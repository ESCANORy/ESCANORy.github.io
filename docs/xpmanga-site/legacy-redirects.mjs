// Single source of truth for the legacy escanory.github.io pages.
// Since October 2026 the official site is https://xpmanga.com (repository ESCANORy/XPManga-web).
// This host keeps only instant-redirect stubs that point each legacy route to its final
// xpmanga.com URL in the same language, plus the app control-plane paths
// (xpmanga-app/, xpmanga-sources/), which site tooling must never touch.

export const FINAL_ORIGIN = "https://xpmanga.com";

export const redirects = [
  { file: "index.html", locale: "ar", target: "https://xpmanga.com/" },
  { file: "download/index.html", locale: "ar", target: "https://xpmanga.com/download/" },
  { file: "help/index.html", locale: "ar", target: "https://xpmanga.com/help/" },
  { file: "sources/index.html", locale: "ar", target: "https://xpmanga.com/sources/" },
  { file: "en/index.html", locale: "en", target: "https://xpmanga.com/en/" },
  { file: "en/download/index.html", locale: "en", target: "https://xpmanga.com/en/download/" },
  { file: "en/help/index.html", locale: "en", target: "https://xpmanga.com/en/help/" },
  { file: "en/sources/index.html", locale: "en", target: "https://xpmanga.com/en/sources/" },
];

// Paths the app reads from this host. Site tooling must leave them byte-for-byte unchanged.
export const protectedPaths = ["xpmanga-app", "xpmanga-sources"];

// Files that must not exist on the legacy host (they would advertise duplicate URLs).
export const forbiddenFiles = ["sitemap.xml"];

const copy = {
  ar: {
    dir: "rtl",
    title: "انتقل موقع XPManga إلى xpmanga.com",
    body: (href) => `انتقل موقع XPManga الرسمي إلى <a href="${href}">${href}</a>.`,
  },
  en: {
    dir: "ltr",
    title: "XPManga has moved to xpmanga.com",
    body: (href) => `The official XPManga website has moved to <a href="${href}">${href}</a>.`,
  },
};

export function renderStub({ locale, target }) {
  const text = copy[locale];
  if (!text) throw new Error(`Unknown locale: ${locale}`);
  return `<!doctype html>
<html lang="${locale}" dir="${text.dir}">
<head>
<meta charset="utf-8">
<title>${text.title}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>${text.body(target)}</p>
</body>
</html>
`;
}

export function render404() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Page not found | XPManga</title>
<meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>This page does not exist. The official XPManga website is <a href="https://xpmanga.com/en/">xpmanga.com</a>.</p>
<p dir="rtl" lang="ar">هذه الصفحة غير موجودة. موقع XPManga الرسمي هو <a href="https://xpmanga.com/">xpmanga.com</a>.</p>
</body>
</html>
`;
}

export const robotsTxt = `User-agent: *
Allow: /
`;
