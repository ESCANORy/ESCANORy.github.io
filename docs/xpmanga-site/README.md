# XPManga legacy host (escanory.github.io)

The official XPManga website is **https://xpmanga.com**, built from `ESCANORy/XPManga-web`. This repository no longer publishes site content.

What this host still serves:

- `xpmanga-app/` and `xpmanga-sources/`: the app's signed update and source control-plane paths. Site tooling must leave them byte-for-byte unchanged.
- `data/`: public release and source projections, checked by `validate-public-data.mjs`.
- Eight legacy page URLs (`/`, `/download/`, `/help/`, `/sources/` and their `/en/` versions). Each is an instant-redirect stub whose `rel=canonical` and `meta refresh` point to the final `xpmanga.com` URL in the same language. Google treats an instant meta refresh as a permanent redirect.
- `404.html` (`noindex`, links to xpmanga.com) and `robots.txt` (`Allow: /`, so crawlers can see the redirects). No `sitemap.xml`.

The redirect map and stub templates live in `legacy-redirects.mjs`, the single source of truth. To change a target, edit that file, then regenerate and validate from the repository root:

```bash
node docs/xpmanga-site/prerender-static.mjs
node docs/xpmanga-site/validate-public-data.mjs
node docs/xpmanga-site/validate-static-output.mjs --live
```

`--live` also requires each target to answer HTTP 200 without a redirect. Set `XPMANGA_SITE_PUBLIC_DIR` to validate another directory.
