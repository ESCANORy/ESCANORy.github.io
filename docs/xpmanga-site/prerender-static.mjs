// Style/architecture reminder: static-first routes preserve SEO, RTL/LTR metadata, and GitHub Pages deep links.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "..", "dist", "public");
const template = await readFile(join(publicDir, "index.html"), "utf8");

const pages = [
  { path: "", locale: "ar", title: "XPManga | قارئ مانجا متعدد المصادر لأندرويد — قيد التطوير", description: "تعرف إلى XPManga، قارئ Android متعدد المصادر، وتحقق من حالة الإصدار ودليل التكامل الرسمي.", canonical: "https://xpmanga.com/", alternate: "https://xpmanga.com/en/" },
  { path: "download", locale: "ar", title: "تنزيل XPManga | الإصدار الرسمي", description: "تحقق من حالة إصدار XPManga قبل التنزيل. لا توجد APK عامة معتمدة حتى الآن.", canonical: "https://xpmanga.com/download", alternate: "https://xpmanga.com/en/download" },
  { path: "sources", locale: "ar", title: "المصادر الرسمية | XPManga", description: "دليل التكاملات الرسمية داخل XPManga، مع فصل واضح عن توفر المواقع الخارجية ومحتواها.", canonical: "https://xpmanga.com/sources", alternate: "https://xpmanga.com/en/sources" },
  { path: "help", locale: "ar", title: "المساعدة والدعم | XPManga", description: "حلول قصيرة لتثبيت XPManga وتحديثه وإدارة المصادر وإرسال البلاغات إلى الدعم الرسمي.", canonical: "https://xpmanga.com/help", alternate: "https://xpmanga.com/en/help" },
  { path: "en", locale: "en", title: "XPManga | A multi-source Android reader — in pre-release", description: "Learn about XPManga, a multi-source Android reader, and check release status and official integrations.", canonical: "https://xpmanga.com/en/", alternate: "https://xpmanga.com/" },
  { path: "en/download", locale: "en", title: "Download XPManga | Official release", description: "Check the XPManga release status before downloading. No public APK is approved yet.", canonical: "https://xpmanga.com/en/download", alternate: "https://xpmanga.com/download" },
  { path: "en/sources", locale: "en", title: "Official sources | XPManga", description: "Explore official XPManga integration status, separate from external-site availability and content.", canonical: "https://xpmanga.com/en/sources", alternate: "https://xpmanga.com/sources" },
  { path: "en/help", locale: "en", title: "Help and support | XPManga", description: "Quick fixes for installing XPManga, updating it, managing sources, and sending a support report.", canonical: "https://xpmanga.com/en/help", alternate: "https://xpmanga.com/help" },
];

function render(page) {
  return template
    .replace(/<html lang="[^"]+" dir="[^"]+">/, `<html lang="${page.locale}" dir="${page.locale === "ar" ? "rtl" : "ltr"}">`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${page.description}" />`)
    .replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${page.locale === "ar" ? "ar_AR" : "en_US"}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${page.canonical}" />`)
    .replace(/<link rel="alternate" hreflang="ar" href="[^"]*" \/>/, `<link rel="alternate" hreflang="ar" href="${page.locale === "ar" ? page.canonical : page.alternate}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${page.locale === "en" ? page.canonical : page.alternate}" />`)
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
}

for (const page of pages) {
  const target = join(publicDir, page.path);
  await mkdir(target, { recursive: true });
  await writeFile(join(target, "index.html"), render(page));
}

await cp(join(publicDir, "en", "index.html"), join(publicDir, "404.html"));
console.log(`Prerendered ${pages.length} static routes plus 404.html`);

