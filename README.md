# Manav Agarwal Portfolio & NIMO Assistant

A high-performance portfolio for Manav Agarwal, a creative technologist in Hyderabad who designs and develops apps, websites, product interfaces, and game UI.

## Architecture & Project Structure

The codebase is structured into a clean two-folder architecture separating client-side presentation from secure server-side API boundaries:

```text
portfolio/
├── frontend/             # Browser-facing static portfolio & NIMO client UI
│   ├── index.html        # Main portfolio page
│   ├── project-*.html    # Case-study pages (Arcade OS, NIMO, ToolVerse, etc.)
│   ├── css/              # Production stylesheets & CSS Grid layout systems
│   ├── js/               # Application logic, NIMO intent NLU engine, & modules
│   │   ├── services/     # Isolated NIMO API client (nimo-api.js)
│   │   └── modules/      # NIMO intent NLU, context store & Arcade modules
│   ├── images/           # High-resolution SVG preview graphics & screenshots
│   ├── sw.js             # Service Worker precache & offline capabilities
│   └── site.webmanifest  # PWA manifest metadata
│
├── backend/              # Server-side NIMO API service & OpenRouter boundary
│   ├── src/
│   │   ├── server.js     # Native Node HTTP server & CORS handler
│   │   ├── routes/       # Express/HTTP route handlers (nimo.js)
│   │   └── services/     # Secure OpenRouter API client (openrouter.js)
│   ├── .env.example      # Environment template (OPENROUTER_API_KEY)
│   └── README.md         # Backend server documentation
│
├── build.js              # Production build script (compiles frontend/ -> dist/)
├── vercel.json           # Deployment configuration
└── package.json          # Development & test orchestration
```

## Highlights

- **Recruiter-first portfolio** with featured work, case studies, resume, and contact actions.
- **NIMO Portfolio Assistant**: Local-first, website-aware assistant with intent scoring, context memory, trilingual support (EN / HI / Hinglish), and secure backend API boundary.
- **Arcade OS**: Interactive cabinet experience with games, profiles, achievements, statistics, customization, SoundLab, diagnostics, and reset safety.
- **Static production build** with esbuild bundling, CleanCSS minification, and HTML minification.

## Local Development

### Frontend Build & Preview

```bash
npm install
npm run build
```

### Backend Service (Optional for OpenRouter)

```bash
cd backend
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY
npm start
```

## Security & Environment Boundary

- The `OPENROUTER_API_KEY` exists exclusively on the server side in `backend/.env`.
- Frontend code in `frontend/` never contains or exposes API keys or secrets.
- If the backend service is offline, NIMO seamlessly falls back to 100% local intent processing without breaking.

## License

See [LICENSE](LICENSE).
