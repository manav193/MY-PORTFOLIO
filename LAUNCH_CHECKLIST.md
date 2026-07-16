# Launch Checklist

Release candidate: `v1.0.0`

## Build And Content

- [x] Public profile, project, resume, GitHub, and contact content reviewed
- [x] Local paths, secrets, placeholder links, TODO/FIXME, and placeholder copy audited
- [x] Production URL, canonical metadata, sitemap, robots, and social image aligned
- [x] Service-worker cache version and precache paths aligned
- [x] Clean dependency install completed with zero reported vulnerabilities
- [x] Production build completed and `dist` validated

## Automated Tests

- [x] `npm run verify`
- [x] Complete ArcadeOS and portfolio test inventory: 18/18 files passing
- [x] Production deployment tests against the live URL

## Browser QA

- [x] Portfolio, Works, case studies, resume, contact, dock, and external links
- [x] Arcade entry, boot/skip, exit, HOME, games, system panels, and protected reset
- [x] Mouse, keyboard, touch emulation, and cabinet controls
- [x] Device matrix from 1920x1080 through 360x800, plus 600x375 short viewport
- [x] Console, page-error, unhandled-rejection, and critical-request audit
- [x] Service-worker install, update, reload, unregister, and offline fallback

## Release

- [x] Release commits pushed to `main`
- [x] Vercel deployment completed
- [x] Live production verification passed
- [x] Annotated release tag pushed

Production URL: `https://my-portfolio-mu-jade-52.vercel.app`
