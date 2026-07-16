# Deployment Guide

## Primary Target

Vercel is the production platform for this repository.

- Build command: `npm run build`
- Output directory: `dist`
- Base path: `/`
- Canonical origin: `https://my-portfolio-mu-jade-52.vercel.app`

The checked-in `vercel.json` is the source of truth. A push to `main` is expected to trigger the connected Vercel deployment.

## Release Build

```bash
npm ci
npm run build
npm run preview -- --host 0.0.0.0
npm run verify
```

The build cleans and recreates `dist`, minifies source assets, rewrites deployment paths, and validates required files, service-worker precache entries, metadata, duplicate IDs, and local links.

## Runtime Configuration

The default production URL and public profile links live in `js/portfolio-config.js`. A one-off root build may override the canonical origin:

```bash
node build.js --base / --site https://portfolio.example
```

`SITE_URL` and `DEPLOY_BASE` provide equivalent environment overrides. Override values must be intentional because they affect canonical metadata, sitemap entries, and service-worker scope.

## Secondary Configurations

`netlify.toml`, `firebase.json`, and the GitHub Pages workflow are retained for compatibility. They are not the primary production path and must not replace the canonical Vercel origin without a coordinated metadata update.

## Service Worker

The source worker uses a versioned `manav-portfolio-*` cache. Each production build emits a fresh cache version, deletes earlier portfolio caches during activation, caches only successful responses, and provides navigation fallbacks when offline.
