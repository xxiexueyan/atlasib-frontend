# AtlasIB frontend

React, Vite, Tailwind CSS, and Axios frontend for IB course planning and university program matching.

## Local development

```sh
npm ci
npm run dev
```

The development environment is configured in `.env.development` and sends API requests to `http://127.0.0.1:8000/api/v1`. The production build environment is configured separately in `.env.production` and uses the test API at `https://atlasib.xxy-info.site/api/v1`. These files let `npm run dev` use the local backend while built deployments use the test backend.

For a machine-specific local override, copy `.env.example` to `.env.local` and edit it. Vite mode-specific files (`.env.development` / `.env.production`) take precedence over `.env.local`; shell or hosting-provider environment variables can override both.

Alternatively, start the Vite development server with:

```sh
./start-frontend.sh
```

The script runs from the project directory regardless of the shell's current directory. Additional Vite CLI options can be passed through, for example `./start-frontend.sh --host 0.0.0.0`.

## Production deployment

Build and serve the static site from `dist/`:

```sh
npm ci
npm run build
```

The production build targets the test API by default. Set `VITE_API_BASE_URL` in the hosting provider's build environment when targeting a different publicly reachable HTTPS API URL. If the API is reverse-proxied under the frontend domain, set it to `/api/v1` instead. Production builds intentionally do not use localhost.

The API server must allow the deployed frontend origin through CORS. Both frontend and API should use HTTPS in production. This is a standard static Vite build and can be deployed to a static hosting provider. If deploying beneath a URL subpath, configure the Vite `base`, PWA manifest `start_url`/`scope`, and service-worker scope for that path.

## PWA

The production build includes a web app manifest, 192/512 pixel app icons, an Apple touch icon, and a Workbox service worker that precaches the frontend shell and static assets. The service worker updates automatically. API responses are not cached, so online API functionality still requires network access.

Installability and service-worker behavior require a secure context: HTTPS in production (or localhost for development). After changing PWA assets or configuration, run `npm run build` and verify the served site in a browser's Application panel.

Copy `.env.example` to `.env.local` for local overrides. Never commit production secrets or private API credentials to `VITE_*` variables; Vite embeds those values in public client assets.
