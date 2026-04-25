# CapooTech CMS GitHub OAuth Authenticator

This is a tiny self-hosted OAuth proxy for Sveltia CMS. It uses Python's
standard library only, so no Node/npm packages are required. It lets
`https://capootech.com/admin/` use "Sign In with GitHub" without exposing a
GitHub OAuth Client Secret in browser code.

## Flow

1. Sveltia CMS opens `https://capootech.com/cms-auth/auth?provider=github&site_id=capootech.com`.
2. This service redirects the popup to GitHub OAuth.
3. GitHub redirects back to `https://capootech.com/cms-auth/callback`.
4. The service exchanges the OAuth `code` for a GitHub access token.
5. The popup passes the token back to Sveltia CMS with `postMessage`.
6. Sveltia CMS uses the token to commit gallery changes to GitHub.

## GitHub OAuth App

Create a GitHub OAuth App with:

- Application name: `CapooTech CMS Authenticator`
- Homepage URL: `https://capootech.com`
- Authorization callback URL: `https://capootech.com/cms-auth/callback`

Do not commit the Client Secret.

## Aliyun Deploy

```bash
sudo mkdir -p /opt/services/capootech-cms-auth /etc/capootech
sudo cp server.py /opt/services/capootech-cms-auth/server.py
sudo cp cms-auth.env.example /etc/capootech/cms-auth.env
sudo chmod 600 /etc/capootech/cms-auth.env
sudo chown root:root /etc/capootech/cms-auth.env
sudo editor /etc/capootech/cms-auth.env

sudo cp capootech-cms-auth.service.example /etc/systemd/system/capootech-cms-auth.service
sudo systemctl daemon-reload
sudo systemctl enable --now capootech-cms-auth
curl -fsS http://127.0.0.1:8787/cms-auth/healthz
```

Add `nginx-location.example` inside the `server_name capootech.com` HTTPS
server block, then run:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -fsS https://capootech.com/cms-auth/healthz
```

Finally set `base_url: https://capootech.com/cms-auth` in `admin/config.yml`.
