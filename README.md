# Manav Agarwal Portfolio

A production portfolio for Manav Agarwal, a creative technologist in Hyderabad who designs and develops apps, websites, product interfaces, and game UI.

## Highlights

- Recruiter-first portfolio with featured work, case studies, resume, and contact actions
- ArcadeOS, an interactive cabinet experience with games, profiles, achievements, statistics, customization, SoundLab, diagnostics, and reset safety
- Responsive layouts for desktop, tablet, and mobile input
- Keyboard navigation, focus management, reduced-motion support, and semantic landmarks
- Static production build with minified HTML, CSS, and JavaScript
- Offline support through a versioned service worker
- Canonical, Open Graph, Twitter, sitemap, robots, and structured-data metadata

## Stack

- HTML5
- CSS3
- Vanilla JavaScript and ES modules
- esbuild, CleanCSS, and html-minifier-terser for production builds
- Puppeteer-based release checks

## Local Development

```bash
npm ci
npm run build
npm run preview -- --host 0.0.0.0
```

The preview is available at `http://localhost:4173` by default. Run `npm run verify` while the preview server is active.

## Production

The primary deployment target is Vercel. `vercel.json` runs `npm run build` and publishes `dist`.

- Production: [my-portfolio-mu-jade-52.vercel.app](https://my-portfolio-mu-jade-52.vercel.app)
- Source: [github.com/manav193/MY-PORTFOLIO](https://github.com/manav193/MY-PORTFOLIO)

The release process and verified checks are recorded in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). No performance score is claimed without a recorded audit.

## Project Structure

```text
assets/          Social and metadata assets
case-studies/    Case-study source content
css/             Portfolio, intro, ArcadeOS, and project styles
images/          Project and ArcadeOS screenshots
icons/           Favicons and app icons
js/              Application code and modules
dist/            Generated production output (ignored)
```

## License

See [LICENSE](LICENSE).
