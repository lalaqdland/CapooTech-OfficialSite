# CapooTech Official Site

This repository is the source of truth for static assets served on `https://capootech.com`.

## Structure

- `index.html`: landing page entry
- `styles.css`: landing page stylesheet
- `lang-toggle.js`: language switch logic (default zh, toggle zh/en)
- `favicon-capoo.svg`: browser tab icon
- `images/capoo/*.webp`: gallery images

## Publish to Shanghai server

1. Pick a release id, for example `20260208-1`.
2. Upload this folder to `/opt/sites/capootech/releases/<release_id>/`.
3. Update symlink: `/opt/sites/capootech/current -> /opt/sites/capootech/releases/<release_id>`.
4. Keep Nginx root and image alias pointed to `/opt/sites/capootech/current`.
5. Run `nginx -t && systemctl reload nginx`.

## GitHub Actions

Workflow file: `.github/workflows/deploy-capootech.yml`.
Shanghai gateway template: `ops/nginx/capootech.com.conf.example`.

Required repository secrets:
- `HOST_CN_SHANGHAI`
- `SSH_USER_CN_SHANGHAI`
- `SSH_PORT_CN_SHANGHAI`
- `SSH_PRIVATE_KEY_CN_SHANGHAI`

## First-Time Bootstrap

1. Create an empty GitHub repository: `lalaqdland/CapooTech-OfficialSite` (Public, `main`).
2. Push local `main` branch to `origin`.
3. Add the required Actions secrets.
4. Deploy `ops/nginx/capootech.com.conf.example` on Shanghai S1 as `/etc/nginx/conf.d/capootech.com.conf`.

## Rollback

Point `current` symlink back to previous release and reload Nginx.
