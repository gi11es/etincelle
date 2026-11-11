# Hosting

The site is 100% static — just point any web server at the repo root over HTTPS.

## MIME types

The app uses ES modules (`.mjs`) and WebAssembly (`.wasm`) for in-browser AI. Your web server must serve these with the correct MIME types, otherwise browsers will refuse to load them:

| Extension | Required MIME type |
|-----------|-------------------|
| `.mjs` | `application/javascript` |
| `.wasm` | `application/wasm` |

Most web servers don't include `.mjs` or `.wasm` in their default MIME type mappings. If you see a console error like *"Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of application/octet-stream"*, this is the cause.

## Sample nginx setup

Add the missing extensions to `/etc/nginx/mime.types` (do **not** use a `types` block inside the `server` context — that replaces all inherited MIME types):

```
application/javascript                js mjs;
application/wasm                       wasm;
```

Then create a site config:

```nginx
server {
    listen 443 ssl http2;
    server_name learn.example.com;

    ssl_certificate     /etc/letsencrypt/live/learn.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/learn.example.com/privkey.pem;

    root /var/www/etincelle;
    index index.html;
    charset utf-8;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|json|mjs|wasm|onnx|pdf)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

## Bug report widget (optional)

A floating bug-report widget can submit issues to GitHub with screenshots. It requires:

1. **`shared/secrets.js`** — copy `shared/secrets.example.js` and add a [GitHub fine-grained PAT](https://github.com/settings/personal-access-tokens/new) scoped to Issues (Read & Write) on the target repo. This file is gitignored.

2. **Screenshot proxy** — the widget uploads screenshots to [catbox.moe](https://catbox.moe) for hosting. To avoid CORS issues, add a reverse proxy in your nginx config:

```nginx
    # Proxy for screenshot uploads to catbox.moe (avoids CORS)
    location = /api/catbox {
        proxy_pass https://catbox.moe/user/api.php;
        proxy_ssl_server_name on;
    }
```

Without `secrets.js`, the widget does not appear. Without the proxy, the widget works but screenshots won't be included in issues.

## Auto-deployment

```
*/5 * * * * cd /var/www/etincelle && git pull --ff-only origin master
```

## Local speech recognition for the oral workshop

Include `scripts/nginx-oral.conf` inside the HTTPS server block and reload nginx.
It scopes `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp` to the English workshop and its pinned
Moonshine WASM runtime. This enables the runtime's worker threads without changing
headers for other family activities. Keep `.mjs` and `.wasm` MIME types configured
as above. The browser downloads English Small Streaming model weights from
`https://download.moonshine.ai` on first use and caches them locally. Microphone
audio stays in the browser; no API key or backend speech service is required.

`npm run test:oral` in `tests/` checks the guided UI with controlled recognition.
`npm run test:oral-stt` runs the actual WASM recognizer against the lesson audio and
Chromium's fake microphone, verifies that no audio is uploaded, and requires
ffmpeg to prepare its temporary microphone fixture.
