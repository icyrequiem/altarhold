# Altarhold website

Public site and dated devlog for Altarhold (first announced as "Project Altar", later called "Relic Protocol"), a 5v5 MOBA in development by Ynairally.
Served by GitHub Pages from the `main` branch root.

- `index.html` landing page: a React + Tailwind app built from `site-src/` into `assets/`
- `devlog/` one plain HTML page per post (styled by `style.css`)
- `timeline.html` when each mechanic was designed and built
- `proofs/` per-milestone hashes of the private game source (plus OpenTimestamps `.ots` proofs)

## Rebuilding the landing page

```
cd site-src
npm install
npm run build
```

Commit the rebuilt `assets/landing.js` and `assets/landing.css`. When adding a devlog, also add it to `DEVLOGS` in `site-src/landing.jsx`.
