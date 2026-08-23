# XPManga Official Site

This directory documents the static-first official website snapshot for `xpmanga.com`.

The published routes are `/`, `/download`, `/sources`, `/help`, and their `/en/*` equivalents. The existing `xpmanga-sources/` signed control-plane paths must remain byte-for-byte unchanged by site releases. Public release and source projections live under `data/`.

The site has **no backend, analytics, session replay, or debug collector**. Every route includes route-specific title, description, Open Graph metadata, language direction, canonical and alternate links, plus meaningful HTML inside `#root` for crawlers and users when JavaScript is unavailable. The client application may replace that fallback after loading.

Regenerate and validate the checked-in static output from the repository root:

```bash
node docs/xpmanga-site/prerender-static.mjs
node docs/xpmanga-site/validate-public-data.mjs
node docs/xpmanga-site/validate-static-output.mjs
```

When a separate build output exists at `docs/dist/public`, the scripts use it automatically. To validate another directory explicitly, set `XPMANGA_SITE_PUBLIC_DIR` to its absolute path.
