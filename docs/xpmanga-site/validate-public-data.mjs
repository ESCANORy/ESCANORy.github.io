// QA gate: public projections are allowlisted, non-executable, and conservative by default.
import { readFile } from "node:fs/promises";

const readJson = async (file) => JSON.parse(await readFile(new URL(`../client/public/data/${file}`, import.meta.url), "utf8"));
const release = await readJson("release.json");
const sources = await readJson("sources-projection.json");
const gate = await readJson("feature-publication-gate.json");

const allowedRelease = new Set(["releaseStatus", "channel", "versionName", "versionCode", "publishedAt", "minAndroid", "sizeBytes", "artifactUrl", "apkSha256", "certificateSha256", "packageName", "releaseUrl", "notes", "isLatest", "verifiedAt"]);
const allowedSource = new Set(["displayName", "approvedAliases", "languageCodes", "canonicalDomain", "integrationStatus", "lastUpdated", "detailsCopy"]);
const allowedStatuses = new Set(["SUPPORTED", "REQUIRES_APP_UPDATE", "SUSPENDED", "DISCONTINUED", "TEMPORARILY_UNAVAILABLE"]);
const forbidden = new Set(["sourceId", "packageId", "packagePath", "packageSha256", "engineId", "engineContract", "allowedDomains", "networkPolicy", "privateKey", "jks", "token"]);

for (const key of Object.keys(release)) if (!allowedRelease.has(key)) throw new Error(`Unexpected release field: ${key}`);
if (release.releaseStatus === "NO_PUBLIC_APK" && release.artifactUrl !== null) throw new Error("NO_PUBLIC_APK cannot expose artifactUrl");
if (!sources || !Array.isArray(sources.sources)) throw new Error("sources projection must contain sources[]");
for (const source of sources.sources) {
  for (const key of Object.keys(source)) if (!allowedSource.has(key)) throw new Error(`Unexpected source field: ${key}`);
  if (!allowedStatuses.has(source.integrationStatus)) throw new Error(`Unknown source status: ${source.integrationStatus}`);
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(source.canonicalDomain)) throw new Error(`Invalid domain: ${source.canonicalDomain}`);
  if (!Array.isArray(source.approvedAliases) || !Array.isArray(source.languageCodes)) throw new Error(`Invalid aliases/languages for ${source.displayName}`);
}
const serialized = JSON.stringify({ release, sources, gate }).toLowerCase();
for (const key of forbidden) if (serialized.includes(`"${key.toLowerCase()}"`)) throw new Error(`Forbidden internal field exposed: ${key}`);
if (!Array.isArray(gate.features) || gate.defaultReleaseStatus !== "NO_PUBLIC_APK") throw new Error("Feature gate default must remain NO_PUBLIC_APK");
console.log(`Validated release, ${sources.sources.length} sources, and ${gate.features.length} gated features.`);

