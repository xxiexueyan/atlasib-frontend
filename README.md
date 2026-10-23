# AtlasIB frontend

React, Vite, Tailwind CSS, and Axios frontend for IB course planning and university program matching.

## Local development

```sh
npm ci
npm run dev
```

In development, API requests default to `http://127.0.0.1:8000/api/v1`. Override this with `VITE_API_BASE_URL` when needed.

## Production deployment

Build and serve the static site from `dist/`:

```sh
npm ci
npm run build
```

Set `VITE_API_BASE_URL` in the hosting provider's build environment to the publicly reachable HTTPS API URL, for example `https://api.example.com/api/v1`. If the API is reverse-proxied under the frontend domain, set it to `/api/v1` instead. The production default is `/api/v1`; it intentionally does not use localhost.

The API server must allow the deployed frontend origin through CORS. Both frontend and API should use HTTPS in production. This is a standard static Vite build and can be deployed to a static hosting provider. If deploying beneath a URL subpath, configure the Vite `base`, PWA manifest `start_url`/`scope`, and service-worker scope for that path.

## PWA

The production build includes a web app manifest, 192/512 pixel app icons, an Apple touch icon, and a Workbox service worker that precaches the frontend shell and static assets. The service worker updates automatically. API responses are not cached, so online API functionality still requires network access.

Installability and service-worker behavior require a secure context: HTTPS in production (or localhost for development). After changing PWA assets or configuration, run `npm run build` and verify the served site in a browser's Application panel.

Copy `.env.example` to `.env.local` for local overrides. Never commit production secrets or private API credentials to `VITE_*` variables; Vite embeds those values in public client assets.
