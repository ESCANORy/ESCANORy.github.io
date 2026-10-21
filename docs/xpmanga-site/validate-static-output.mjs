// QA gate for the legacy host: every legacy route must be an instant redirect stub whose canonical
// and meta refresh both point to the same final xpmanga.com URL in the route's language.
// Usage: node docs/xpmanga-site/validate-static-output.mjs [--live]
//   --live  also requires each target to answer HTTP 200 without redirecting (final URL).
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FINAL_ORIGIN, forbiddenFiles, protectedPaths, redirects, render404, renderStub, robotsTxt } from "./legacy-redirects.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDir, "..", "..");
const root = process.env.XPMANGA_SITE_PUBLIC_DIR ?? repositoryRoot;
const live = process.argv.includes("--live");
const failures = [];
const fail = (message) => failures.push(message);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const seenTargets = new Set();
for (const route of redirects) {
  const { file, locale, target } = route;
  if (!target.startsWith(`${FINAL_ORIGIN}/`) || !target.endsWith("/")) fail(`${file}: target ${target} is not a final ${FINAL_ORIGIN} URL with a trailing slash`);
  if (seenTargets.has(target)) fail(`${file}: target ${target} is used twice`);
  seenTargets.add(target);
  // xpmanga.com serves Arabic at the root and English under /en/ (XPManga-web PR #78).
  const expectedLocale = target.startsWith(`${FINAL_ORIGIN}/en/`) ? "en" : "ar";
  if (locale !== expectedLocale) fail(`${file}: locale ${locale} does not match target language ${expectedLocale}`);

  const path = join(root, file);
  if (!(await exists(path))) {
    fail(`${file}: missing`);
    continue;
  }
  const html = await readFile(path, "utf8");
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)].map((m) => m[1]);
  const refresh = html.match(/<meta\s+http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/);
  if (canonicals.length !== 1 || canonicals[0] !== target) fail(`${file}: canonical ${JSON.stringify(canonicals)} != ${target}`);
  if (!refresh || refresh[1] !== target) fail(`${file}: meta refresh ${refresh?.[1]} != ${target}`);
  if (!html.includes(`<html lang="${locale}"`)) fail(`${file}: html lang is not ${locale}`);
  if (/<meta\s+name="robots"[^>]*noindex/i.test(html)) fail(`${file}: redirect stub must not be noindex`);
  if (html !== renderStub(route)) fail(`${file}: differs from renderStub(); run node docs/xpmanga-site/prerender-static.mjs`);
}

const notFound = await readFile(join(root, "404.html"), "utf8").catch(() => null);
if (notFound === null) fail("404.html: missing");
else {
  if (!/<meta\s+name="robots"\s+content="noindex"/.test(notFound)) fail("404.html: must be noindex");
  if (notFound !== render404()) fail("404.html: differs from render404()");
}

const robots = await readFile(join(root, "robots.txt"), "utf8").catch(() => null);
if (robots !== robotsTxt) fail("robots.txt: must allow crawling so search engines can see the redirects");

for (const name of forbiddenFiles) if (await exists(join(root, name))) fail(`${name}: must not exist on the legacy host`);
for (const name of protectedPaths) if (!(await exists(join(root, name)))) fail(`${name}/: app control-plane path is missing`);

if (live) {
  for (const { file, target } of redirects) {
    try {
      const response = await fetch(target, { redirect: "manual", headers: { "user-agent": "xpmanga-legacy-validator" } });
      if (response.status !== 200) fail(`${file}: live target ${target} answered ${response.status} (expected 200, no redirect)`);
    } catch (error) {
      fail(`${file}: live target ${target} failed: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((line) => `FAIL ${line}`).join("\n"));
  process.exit(1);
}
console.log(`Validated ${redirects.length} redirect stubs, 404.html, robots.txt${live ? " and live targets" : ""}.`);
