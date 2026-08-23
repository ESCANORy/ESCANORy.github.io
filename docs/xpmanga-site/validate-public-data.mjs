// QA gate: public projections are allowlisted, non-executable, and conservative by default.
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

const publicDir = process.env.XPMANGA_SITE_PUBLIC_DIR
  ?? ((await exists(join(buildOutput, "data", "release.json"))) ? buildOutput : repositoryRoot);
const readJson = async (file) => JSON.parse(await readFile(join(publicDir, "data", file), "utf8"));
const release = await readJson("release.json");
const sources = await readJson("sources-projection.json");
const gate = await readJson("feature-publication-gate.json");
const stableManifest = JSON.parse(await readFile(join(publicDir, "xpmanga-app", "updates", "stable", "manifest.json"), "utf8"));
const stableSignature = JSON.parse(await readFile(join(publicDir, "xpmanga-app", "updates", "stable", "manifest.sig"), "utf8"));

const allowedRelease = new Set(["releaseStatus", "channel", "versionName", "versionCode", "publishedAt", "minAndroid", "sizeBytes", "artifactUrl", "apkSha256", "certificateSha256", "packageName", "releaseUrl", "notes", "isLatest", "verifiedAt"]);
const allowedSource = new Set(["displayName", "approvedAliases", "languageCodes", "canonicalDomain", "integrationStatus", "lastUpdated", "detailsCopy"]);
const allowedStatuses = new Set(["SUPPORTED", "REQUIRES_APP_UPDATE", "SUSPENDED", "DISCONTINUED", "TEMPORARILY_UNAVAILABLE"]);
const allowedReleaseStatuses = new Set(["NO_PUBLIC_APK", "PRE_RELEASE_AVAILABLE", "NEWER_RELEASE_AVAILABLE", "STABLE_AVAILABLE", "GOOGLE_PLAY_AVAILABLE", "TEMPORARILY_UNAVAILABLE"]);
const forbidden = new Set(["sourceId", "packageId", "packagePath", "packageSha256", "engineId", "engineContract", "allowedDomains", "networkPolicy", "privateKey", "jks", "token"]);

for (const key of Object.keys(release)) if (!allowedRelease.has(key)) throw new Error(`Unexpected release field: ${key}`);
if (!allowedReleaseStatuses.has(release.releaseStatus)) throw new Error(`Unknown release status: ${release.releaseStatus}`);
if (release.releaseStatus === "NO_PUBLIC_APK") {
  if (release.artifactUrl !== null) throw new Error("NO_PUBLIC_APK cannot expose artifactUrl");
} else {
  if (!/^https:\/\/github\.com\/ESCANORy\/ESCANORy\.github\.io\/releases\/download\/[0-9A-Za-z._-]+\/[0-9A-Za-z._-]+\.apk$/.test(release.artifactUrl ?? "")) throw new Error("Published release must expose a trusted APK URL");
  if (!/^[0-9a-f]{64}$/.test(release.apkSha256 ?? "")) throw new Error("Published release must expose an APK SHA-256");
  if (!/^[0-9a-f]{64}$/.test(release.certificateSha256 ?? "")) throw new Error("Published release must expose a certificate SHA-256");
  if (!Number.isSafeInteger(release.versionCode) || release.versionCode < 1) throw new Error("Published release must expose a positive versionCode");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.versionName ?? "")) throw new Error("Published release must expose a valid versionName");
  if (release.packageName !== "com.yahya.mangareader") throw new Error("Published release packageName is not trusted");
  if (release.releaseStatus === "STABLE_AVAILABLE" && release.channel !== "stable") throw new Error("Stable release must use the stable channel");
  if (release.releaseStatus === "STABLE_AVAILABLE") {
    if (stableManifest.channel !== "stable") throw new Error("Stable manifest channel is invalid");
    if (stableManifest.versionName !== release.versionName || stableManifest.versionCode !== release.versionCode) throw new Error("Stable manifest and release version disagree");
    if (stableManifest.apkUrl !== release.artifactUrl || stableManifest.apkSha256 !== release.apkSha256 || stableManifest.apkSize !== release.sizeBytes) throw new Error("Stable manifest and release artifact disagree");
    if (stableManifest.packageName !== release.packageName || stableManifest.signingCertificateSha256 !== release.certificateSha256) throw new Error("Stable manifest and release identity disagree");
    if (stableSignature.schemaVersion !== 1 || stableSignature.keyId !== "xpmanga-update-2026-02" || stableSignature.algorithm !== "ECDSA_P256_SHA256") throw new Error("Stable manifest signature envelope is not trusted");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(stableSignature.signature ?? "")) throw new Error("Stable manifest signature is not valid base64");
  }
}
if (!sources || !Array.isArray(sources.sources)) throw new Error("sources projection must contain sources[]");
for (const source of sources.sources) {
  for (const key of Object.keys(source)) if (!allowedSource.has(key)) throw new Error(`Unexpected source field: ${key}`);
  if (!allowedStatuses.has(source.integrationStatus)) throw new Error(`Unknown source status: ${source.integrationStatus}`);
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(source.canonicalDomain)) throw new Error(`Invalid domain: ${source.canonicalDomain}`);
  if (!Array.isArray(source.approvedAliases) || !Array.isArray(source.languageCodes)) throw new Error(`Invalid aliases/languages for ${source.displayName}`);
}
const serialized = JSON.stringify({ release, sources, gate }).toLowerCase();
for (const key of forbidden) if (serialized.includes(`"${key.toLowerCase()}"`)) throw new Error(`Forbidden internal field exposed: ${key}`);
if (!Array.isArray(gate.features) || !allowedReleaseStatuses.has(gate.defaultReleaseStatus)) throw new Error("Feature gate has an invalid default release status");
if (gate.defaultReleaseStatus !== release.releaseStatus) throw new Error("Feature gate and release projection disagree");
for (const feature of gate.features) {
  if (!new Set(["published", "unpublished"]).has(feature.publicationStatus)) throw new Error(`Invalid feature publication status: ${feature.featureId}`);
  if (release.releaseStatus === "STABLE_AVAILABLE" && (feature.publicationStatus !== "published" || feature.releaseChannel !== "stable")) {
    throw new Error(`Stable feature is not published on the stable channel: ${feature.featureId}`);
  }
}
console.log(`Validated release, ${sources.sources.length} sources, and ${gate.features.length} gated features in ${publicDir}.`);
