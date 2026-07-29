# Manav Agarwal Portfolio, ArcadeOS & NIMO

A high-performance creative developer portfolio combining case studies, interactive UI work, a browser-based ArcadeOS experience, and the NIMO portfolio assistant.

## Highlights

- Recruiter-focused project presentation and case studies
- ArcadeOS with playable experiences, profiles, achievements, statistics, customization, audio tools, and diagnostics
- Local-first NIMO intent engine for deterministic navigation and project facts
- Standalone NIMO Core integration for comparisons, reasoning, and multi-turn questions
- PWA metadata, offline support, responsive layouts, and accessibility considerations
- Production build pipeline with JavaScript, CSS, and HTML optimization

## Architecture

```text
MY-PORTFOLIO/
├── frontend/
│   ├── index.html
│   ├── project-*.html
│   ├── css/
│   ├── js/
│   │   ├── modules/       # Portfolio, ArcadeOS, and local NIMO behavior
│   │   └── services/      # NIMO Core API client
│   ├── images/
│   ├── sw.js
│   └── site.webmanifest
├── backend/               # Legacy/local backend reference; not the production NIMO service
├── build.js
├── package.json
└── vercel.json
```

The production assistant backend is maintained separately in [NIMO-CORE](https://github.com/manav193/NIMO-CORE) and deployed as a Cloudflare Worker.

## NIMO request flow

```text
Visitor question
      |
Local deterministic intent engine
      |
Complex comparison, reasoning, or follow-up
      |
NIMO Core -> verified knowledge -> provider routing/failover
```

Simple navigation and known facts remain local. Complex questions are routed to NIMO Core with bounded conversation history.

## Local development

```bash
git clone https://github.com/manav193/MY-PORTFOLIO.git
cd MY-PORTFOLIO
npm install
npm run build
```

Use the scripts in `package.json` for the current preview and test workflow.

## Security boundary

- Production provider credentials are stored only in NIMO Core deployment secrets.
- Browser-delivered code contains no OpenRouter API key.
- NIMO Core applies CORS, validation, rate limiting, safe errors, deterministic grounding, caching, telemetry, and provider failover.
- The local intent engine continues to provide basic functionality when the remote assistant is unavailable.

## Related repository

- [NIMO Core](https://github.com/manav193/NIMO-CORE)

## License

See [LICENSE](LICENSE).
