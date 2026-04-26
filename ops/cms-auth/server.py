#!/usr/bin/env python3
import http.server
import json
import os
import re
import secrets
import ssl
import socketserver
import urllib.parse
import urllib.request


ALLOWED_DOMAINS = os.environ.get("ALLOWED_DOMAINS", "capootech.com")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "https://capootech.com")
BASE_PATH = os.environ.get("BASE_PATH", "/cms-auth").rstrip("/")
BIND_HOST = os.environ.get("BIND_HOST", "127.0.0.1")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
GITHUB_HOSTNAME = os.environ.get("GITHUB_HOSTNAME", "github.com")
PORT = int(os.environ.get("PORT", "8787"))


def escape_regexp(value):
    return re.escape(value).replace("\\*", ".+")


def is_allowed_domain(domain):
    for item in ALLOWED_DOMAINS.split(","):
        pattern = "^{}$".format(escape_regexp(item.strip()))
        if re.match(pattern, domain or ""):
            return True
    return False


def is_allowed_origin(value):
    if not value:
        return False

    origin = urllib.parse.urlparse(value)
    request_origin = "{}://{}".format(origin.scheme, origin.netloc)

    return any(request_origin == item.strip().rstrip("/") for item in ALLOWED_ORIGINS.split(","))


def build_html(provider="unknown", token=None, error=None, error_code=None):
    state = "error" if error else "success"
    content = {"provider": provider, "error": error, "errorCode": error_code} if error else {
        "provider": provider,
        "token": token,
    }
    return """<!doctype html><html><body><script>
(() => {{
  window.addEventListener('message', ({{ data, origin }}) => {{
    if (data === 'authorizing:{provider}') {{
      window.opener?.postMessage('authorization:{provider}:{state}:{content}', origin);
    }}
  }});
  window.opener?.postMessage('authorizing:{provider}', '*');
}})();
</script></body></html>""".format(
        provider=provider,
        state=state,
        content=json.dumps(content, separators=(",", ":")),
    )


class CMSAuthHandler(http.server.BaseHTTPRequestHandler):
    server_version = "CapooTechCMSAuth/1.0"

    def log_message(self, fmt, *args):
        print("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), fmt % args))

    def send_html(self, **kwargs):
        body = build_html(**kwargs).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html;charset=UTF-8")
        self.send_header(
            "Set-Cookie",
            "csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure",
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location, cookie):
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Set-Cookie", cookie)
        self.end_headers()

    def read_csrf_cookie(self):
        cookie = self.headers.get("Cookie", "")
        match = re.search(r"\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b", cookie)
        if not match:
            return None, None
        return match.group(1), match.group(2)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith(BASE_PATH):
            path = path[len(BASE_PATH):] or "/"
        params = urllib.parse.parse_qs(parsed.query)

        if path in ("/auth", "/oauth/authorize"):
            return self.handle_auth(params)
        if path in ("/callback", "/oauth/redirect"):
            return self.handle_callback(params)
        if path == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain;charset=UTF-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_response(404)
        self.end_headers()

    def handle_auth(self, params):
        provider = params.get("provider", [""])[0]
        domain = params.get("site_id", [""])[0]
        request_origin = self.headers.get("Origin") or self.headers.get("Referer")

        if provider != "github":
            return self.send_html(
                error="Your Git backend is not supported by the authenticator.",
                error_code="UNSUPPORTED_BACKEND",
            )

        if not is_allowed_domain(domain):
            return self.send_html(
                provider=provider,
                error="Your domain is not allowed to use the authenticator.",
                error_code="UNSUPPORTED_DOMAIN",
            )

        if not is_allowed_origin(request_origin):
            return self.send_html(
                provider=provider,
                error="This origin is not allowed to use the authenticator.",
                error_code="UNSUPPORTED_ORIGIN",
            )

        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            return self.send_html(
                provider=provider,
                error="OAuth app client ID or secret is not configured.",
                error_code="MISCONFIGURED_CLIENT",
            )

        csrf_token = secrets.token_hex(16)
        query = urllib.parse.urlencode(
            {
                "client_id": GITHUB_CLIENT_ID,
                "scope": "repo,user",
                "state": csrf_token,
            }
        )
        cookie = (
            "csrf-token={}_{}; HttpOnly; Path={}; Max-Age=600; SameSite=Lax; Secure".format(
                provider, csrf_token, BASE_PATH
            )
        )
        return self.redirect(
            "https://{}/login/oauth/authorize?{}".format(GITHUB_HOSTNAME, query),
            cookie,
        )

    def handle_callback(self, params):
        code = params.get("code", [""])[0]
        state = params.get("state", [""])[0]
        provider, csrf_token = self.read_csrf_cookie()

        if provider != "github":
            return self.send_html(
                error="Your Git backend is not supported by the authenticator.",
                error_code="UNSUPPORTED_BACKEND",
            )

        if not code or not state:
            return self.send_html(
                provider=provider,
                error="Failed to receive an authorization code. Please try again later.",
                error_code="AUTH_CODE_REQUEST_FAILED",
            )

        if not csrf_token or state != csrf_token:
            return self.send_html(
                provider=provider,
                error="Potential CSRF attack detected. Authentication flow aborted.",
                error_code="CSRF_DETECTED",
            )

        payload = json.dumps(
            {
                "code": code,
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            "https://{}/login/oauth/access_token".format(GITHUB_HOSTNAME),
            data=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(request, context=ssl.create_default_context(), timeout=15) as response:
                result = json.loads(response.read().decode("utf-8"))
        except Exception:
            return self.send_html(
                provider=provider,
                error="Failed to request an access token. Please try again later.",
                error_code="TOKEN_REQUEST_FAILED",
            )

        token = result.get("access_token")
        if not token:
            return self.send_html(
                provider=provider,
                error=result.get("error", "Server responded without an access token."),
                error_code="TOKEN_REQUEST_FAILED",
            )

        return self.send_html(provider=provider, token=token)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if __name__ == "__main__":
    address = (BIND_HOST, PORT)
    httpd = ThreadingHTTPServer(address, CMSAuthHandler)
    print("CapooTech CMS auth listening on {}:{}{}".format(BIND_HOST, PORT, BASE_PATH), flush=True)
    httpd.serve_forever()
