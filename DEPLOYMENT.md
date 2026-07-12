# Static Deployment Guide

This project is fully platform-agnostic and supports static hosting at the root domain or inside a subdirectory (such as GitHub Pages). All assets, links, canonical metadata, sitemaps, manifests, and Service Workers adapt dynamically during compilation.

---

## Build Commands

- **Root Domain Deployment** (Default base: `/`):
  ```bash
  npm run build:root
  ```
- **Subdirectory Deployment** (Default base: `/portfolio/`):
  ```bash
  npm run build:subdir
  ```
- **Custom Configuration Build**:
  ```bash
  node build.js --base /custom-path/ --site https://custom-domain.com
  ```

---

## 1. Vercel

### Configuration
A pre-configured `vercel.json` is located in the project root:
- **Framework Preset**: Other / Static HTML
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Custom Subfolder (Vercel Project Settings)
To deploy to a subfolder on Vercel:
1. Navigate to **Project Settings > Build & Development Settings**.
2. Override **Build Command** to: `node build.js --base /portfolio/`.
3. Save and redeploy.

---

## 2. Netlify

### Configuration
A pre-configured `netlify.toml` is in the project root:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Custom Environment Variables
You can configure Netlify to deploy to a custom subdirectory by setting the following environment variables in the Netlify Dashboard (**Site settings > Environment variables**):
* `DEPLOY_BASE`: `/portfolio/`
* `SITE_URL`: `https://example.com`

---

## 3. GitHub Pages

### Configuration
A pre-configured GitHub Actions workflow is located at `.github/workflows/deploy.yml` and will deploy automatically on push to the `main` branch.
- **Node Version**: 20
- **Install Command**: `npm ci`
- **Build Command**: `npm run build` (configured with `DEPLOY_BASE: "/portfolio/"` inside the workflow).

### Custom Repository Name
If your GitHub repository name is NOT `portfolio`, open `.github/workflows/deploy.yml` and modify the environment variable `DEPLOY_BASE` on line 39 to match your repository name:
```yaml
env:
  DEPLOY_BASE: "/your-repo-name/"
```

---

## 4. Cloudflare Pages

### Configuration (Cloudflare Dashboard)
Create a new project on Cloudflare Pages, link your repository, and input:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Custom Subdirectory Environment Variables
Under the Cloudflare Project Settings (**Settings > Environment variables**), specify:
* `DEPLOY_BASE`: `/portfolio/`
* `SITE_URL`: `https://yourdomain.pages.dev`

---

## 5. Firebase Hosting

### Configuration
A pre-configured `firebase.json` is located in the project root:
- **Public Directory**: `dist`
- **Clean URLs**: `false` (forces exact match of `.html` files in line with relative links and SW caching).

---

## 6. Service Worker Notes

The Service Worker (`sw.js`) dynamically adapts its cache version (currently bumped to `v14` on this update) and prefixes all resource paths using the compiled `DEPLOY_BASE`. 

If deploying under a subdirectory (e.g. `/portfolio/`), the Service Worker will register with the correct subdirectory scope (`/portfolio/`), and intercept network requests only for pages matching that path. 

---

## 7. Custom Domain and SEO Configuration

During compile-time, the sitemap, robots, Open Graph, and canonical metadata resolve using the environment variable `SITE_URL`. To align with your own production domain, set the environment variable `SITE_URL` on your hosting provider or run:
```bash
node build.js --site https://yourdomain.com --base /
```
