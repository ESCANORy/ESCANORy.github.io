// QA gate: every public route is prerendered with a language, title, description, and canonical.
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist", "public");
const routes = ["index.html", "download/index.html", "sources/index.html", "help/index.html", "en/index.html", "en/download/index.html", "en/sources/index.html", "en/help/index.html", "404.html"];
for (const route of routes) {
  const file = join(root, route);
  await access(file);
  const html = await readFile(file, "utf8");
  for (const required of ["<title>", "meta name=\"description\"", "rel=\"canonical\"", "hreflang=\"ar\"", "hreflang=\"en\""]) if (!html.includes(required)) throw new Error(`${route} missing ${required}`);
}
console.log(`Validated ${routes.length} static HTML outputs.`);

