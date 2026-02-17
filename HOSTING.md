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
        add_header Cache-Control "public, immutable";
    }
}
```

## Auto-deployment

```
*/5 * * * * cd /var/www/etincelle && git pull --ff-only origin master
```
