// Legacy-host renderer. The official site moved to https://xpmanga.com (ESCANORy/XPManga-web),
// so this script no longer renders site content. It regenerates the redirect stubs, 404.html and
// robots.txt from legacy-redirects.mjs. It never touches xpmanga-app/ or xpmanga-sources/.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { forbiddenFiles, redirects, render404, renderStub, robotsTxt } from "./legacy-redirects.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDir, "..", "..");
const outDir = process.env.XPMANGA_SITE_PUBLIC_DIR ?? repositoryRoot;

for (const route of redirects) {
  const file = join(outDir, route.file);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderStub(route), "utf8");
}
await writeFile(join(outDir, "404.html"), render404(), "utf8");
await writeFile(join(outDir, "robots.txt"), robotsTxt, "utf8");
for (const name of forbiddenFiles) await rm(join(outDir, name), { force: true });

console.log(`Wrote ${redirects.length} redirect stubs, 404.html and robots.txt to ${outDir}`);
