// QA gate: every public route must be useful without JavaScript and carry complete route-specific metadata.
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDir, "..", "..");
const buildOutput = join(scriptDir, "..", "dist", "public");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const root = process.env.XPMANGA_SITE_PUBLIC_DIR
  ?? ((await exists(join(buildOutput, "index.html"))) ? buildOutput : repositoryRoot);
const routes = [
  "index.html",
  "download/index.html",
  "sources/index.html",
  "help/index.html",
  "en/index.html",
  "en/download/index.html",
  "en/sources/index.html",
  "en/help/index.html",
  "404.html",
];

function metadata(html, pattern, label, route) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`${route} missing ${label}`);
  return value;
}

await access(join(root, "manus-storage", "xpmanga-xp-logo_08329fe6.png"));

for (const route of routes) {
  const file = join(root, route);
  await access(file);
  const html = await readFile(file, "utf8");
  for (const required of [
    "<title>",
    'meta name="description"',
    'property="og:title"',
    'property="og:description"',
    'property="og:locale"',
    'property="og:locale:alternate"',
    'rel="canonical"',
    'hreflang="ar"',
    'hreflang="en"',
    'data-static-fallback="true"',
    '<h1>',
  ]) {
    if (!html.includes(required)) throw new Error(`${route} missing ${required}`);
  }
  if (html.includes("debug-collector") || html.includes('/__manus__/debug-collector.js')) {
    throw new Error(`${route} contains non-production instrumentation`);
  }
  const title = metadata(html, /<title>([^<]+)<\/title>/, "title", route);
  const description = metadata(html, /<meta name="description" content="([^"]+)" \/>/, "description", route);
  const ogTitle = metadata(html, /<meta property="og:title" content="([^"]+)" \/>/, "og:title", route);
  const ogDescription = metadata(html, /<meta property="og:description" content="([^"]+)" \/>/, "og:description", route);
  const locale = metadata(html, /<meta property="og:locale" content="([^"]+)" \/>/, "og:locale", route);
  const alternate = metadata(html, /<meta property="og:locale:alternate" content="([^"]+)" \/>/, "og:locale:alternate", route);
  if (title !== ogTitle) throw new Error(`${route} title and og:title differ`);
  if (description !== ogDescription) throw new Error(`${route} description and og:description differ`);
  if (locale === alternate) throw new Error(`${route} Open Graph locales must differ`);
  if (route.startsWith("en/") || route === "404.html") {
    if (locale !== "en_US" || alternate !== "ar_AR") throw new Error(`${route} has incorrect English Open Graph locales`);
  } else if (locale !== "ar_AR" || alternate !== "en_US") {
    throw new Error(`${route} has incorrect Arabic Open Graph locales`);
  }
}

console.log(`Validated ${routes.length} static HTML outputs and the published brand asset in ${root}.`);
