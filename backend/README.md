# NIMO Backend (Cloudflare Worker)

Cloudflare Workers-compatible backend API service for the **NIMO Portfolio Assistant**.

## Architecture & Responsibilities

- **Worker Entrypoint**: `src/index.js` exports `default { async fetch(request, env, ctx) }`.
- **API Security**: Stores `OPENROUTER_API_KEY` securely in Cloudflare environment bindings (`env`). Never exposes credentials to client-side bundles.
- **Web Standard API**: Uses Web Fetch API `Request` and `Response` objects without Node-specific modules (`fs`, `path`, `http`).
- **CORS Allowlisting**: Enforces strict origin matching configured in `env.ALLOWED_ORIGINS`.

## Local Development & Deployment

Run locally with Wrangler:
```powershell
npx wrangler dev
```

Deploy to Cloudflare Workers:
```powershell
npx wrangler deploy
```

Set secret key on Cloudflare Workers:
```powershell
npx wrangler secret put OPENROUTER_API_KEY
```

## Configuration File (`wrangler.jsonc`)

```json
{
  "name": "nimo-backend",
  "main": "src/index.js",
  "compatibility_date": "2026-07-22"
}
```

## Endpoints

- `GET /api/health`: Health status check.
- `POST /api/nimo/chat`: Asynchronous extended NIMO query endpoint.
  - **Payload**: `{ "message": "user question", "context": { "page": "home", "section": "work", "language": "en" } }`
