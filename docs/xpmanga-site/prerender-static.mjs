// Static-first renderer: keeps route content, metadata, and GitHub Pages deep links usable without JavaScript.
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
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
  ?? ((await exists(join(buildOutput, "index.html"))) ? buildOutput : repositoryRoot);
const template = await readFile(join(publicDir, "index.html"), "utf8");

const pages = [
  {
    path: "",
    locale: "ar",
    title: "XPManga | قارئ مانجا متعدد المصادر لأندرويد",
    description: "تعرّف إلى XPManga، قارئ Android متعدد المصادر، وتحقق من حالة الإصدار ودليل المصادر الرسمي.",
    heading: "XPManga — قارئ مانجا متعدد المصادر",
    summary: "قارئ Android يجمع المصادر الرسمية والمكتبة والتنزيل والقراءة في تجربة واحدة.",
    canonical: "https://xpmanga.com/",
    alternate: "https://xpmanga.com/en/",
  },
  {
    path: "download",
    locale: "ar",
    title: "تنزيل XPManga | الإصدار الرسمي",
    description: "نزّل إصدار XPManga الرسمي وتحقق من رقم الإصدار وبصمة APK قبل التثبيت.",
    heading: "تنزيل XPManga",
    summary: "تتوفر هنا فقط حزمة APK الرسمية المعتمدة مع رقم الإصدار وبصمة SHA-256.",
    canonical: "https://xpmanga.com/download",
    alternate: "https://xpmanga.com/en/download",
  },
  {
    path: "sources",
    locale: "ar",
    title: "المصادر الرسمية | XPManga",
    description: "دليل المصادر الرسمية داخل XPManga، منفصلًا عن توفر المواقع الخارجية ومحتواها.",
    heading: "مصادر XPManga الرسمية",
    summary: "يعرض هذا الدليل المصادر المتاحة داخل التطبيق وحالة تكاملها الرسمية.",
    canonical: "https://xpmanga.com/sources",
    alternate: "https://xpmanga.com/en/sources",
  },
  {
    path: "help",
    locale: "ar",
    title: "المساعدة والدعم | XPManga",
    description: "إرشادات تثبيت XPManga وتحديثه وإدارة المصادر وإرسال البلاغات إلى الدعم الرسمي.",
    heading: "المساعدة والدعم",
    summary: "إرشادات مختصرة للتثبيت والتحديث وإدارة المصادر وحل المشكلات الشائعة.",
    canonical: "https://xpmanga.com/help",
    alternate: "https://xpmanga.com/en/help",
  },
  {
    path: "en",
    locale: "en",
    title: "XPManga | A multi-source Android manga reader",
    description: "Meet XPManga, a multi-source Android manga reader, and check its official release and source directory.",
    heading: "XPManga — a multi-source manga reader",
    summary: "An Android reader that brings official sources, library, downloads, and reading into one experience.",
    canonical: "https://xpmanga.com/en/",
    alternate: "https://xpmanga.com/",
  },
  {
    path: "en/download",
    locale: "en",
    title: "Download XPManga | Official release",
    description: "Download the official XPManga release and verify its version and APK SHA-256 before installing.",
    heading: "Download XPManga",
    summary: "Only the approved APK is published here, together with its version and SHA-256 digest.",
    canonical: "https://xpmanga.com/en/download",
    alternate: "https://xpmanga.com/download",
  },
  {
    path: "en/sources",
    locale: "en",
    title: "Official sources | XPManga",
    description: "Explore XPManga's official source directory, separate from external-site availability and content.",
    heading: "Official XPManga sources",
    summary: "This directory lists sources available in the app and their official integration status.",
    canonical: "https://xpmanga.com/en/sources",
    alternate: "https://xpmanga.com/sources",
  },
  {
    path: "en/help",
    locale: "en",
    title: "Help and support | XPManga",
    description: "Guidance for installing and updating XPManga, managing sources, and reporting problems.",
    heading: "Help and support",
    summary: "Short guidance for installation, updates, source management, and common problems.",
    canonical: "https://xpmanga.com/en/help",
    alternate: "https://xpmanga.com/help",
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fallbackBody(page) {
  const isArabic = page.locale === "ar";
  const links = isArabic
    ? [["/", "الرئيسية"], ["/download", "التنزيل"], ["/sources", "المصادر"], ["/help", "المساعدة"], ["/en/", "English"]]
    : [["/en/", "Home"], ["/en/download", "Download"], ["/en/sources", "Sources"], ["/en/help", "Help"], ["/", "العربية"]];
  const navigation = links
    .map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`)
    .join(" · ");
  return `<div id="root"><main data-static-fallback="true" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif;line-height:1.7"><header><a href="${isArabic ? "/" : "/en/"}"><img src="/manus-storage/xpmanga-xp-logo_08329fe6.png" width="72" height="72" alt="XPManga" /></a><nav aria-label="${isArabic ? "التنقل الرئيسي" : "Primary navigation"}">${navigation}</nav></header><section><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.summary)}</p><p><a href="${escapeHtml(page.canonical)}">${isArabic ? "الرابط الرسمي لهذه الصفحة" : "Official link for this page"}</a></p></section></main></div>`;
}

function render(page) {
  const locale = page.locale === "ar" ? "ar_AR" : "en_US";
  const alternateLocale = page.locale === "ar" ? "en_US" : "ar_AR";
  return template
    .replace(/<html lang="[^"]+" dir="[^"]+">/, `<html lang="${page.locale}" dir="${page.locale === "ar" ? "rtl" : "ltr"}">`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${locale}" />`)
    .replace(/<meta property="og:locale:alternate" content="[^"]*" \/>/, `<meta property="og:locale:alternate" content="${alternateLocale}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${page.canonical}" />`)
    .replace(/<link rel="alternate" hreflang="ar" href="[^"]*" \/>/, `<link rel="alternate" hreflang="ar" href="${page.locale === "ar" ? page.canonical : page.alternate}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${page.locale === "en" ? page.canonical : page.alternate}" />`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/\s*<script src="\/__manus__\/debug-collector\.js" defer><\/script>/, "")
    .replace(/<div id="root">[\s\S]*?<\/div>/, fallbackBody(page));
}

for (const page of pages) {
  const target = join(publicDir, page.path);
  await mkdir(target, { recursive: true });
  await writeFile(join(target, "index.html"), render(page));
}

await cp(join(publicDir, "en", "index.html"), join(publicDir, "404.html"));
console.log(`Prerendered ${pages.length} static routes plus 404.html in ${publicDir}`);
