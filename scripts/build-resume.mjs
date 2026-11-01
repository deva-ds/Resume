// Generates the downloadable resume PDF, the social-preview image (og.png) and the
// apple-touch-icon from src/content.json, using headless Chrome via Puppeteer.
// Usage: node scripts/build-resume.mjs [outDir]   (default: public)
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, process.argv[2] ?? "public");
const content = JSON.parse(await readFile(path.join(root, "src/content.json"), "utf8"));
const { site, hero, stats = [], experience, skills, about, contact, resume = {} } = content;
const fullName = resume.fullName ?? content.footerName;

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">';

/* ------------------------------------------------------------------ resume PDF */

const point = (p) => {
  const i = p.indexOf(" — ");
  return i > 0 && i < 90
    ? `<li><strong>${esc(p.slice(0, i))}</strong> — ${esc(p.slice(i + 3))}</li>`
    : `<li>${esc(p)}</li>`;
};

const section = (title, body) => `<section><h2>${esc(title)}</h2>${body}</section>`;

const contactParts = [
  contact.location && esc(contact.location),
  contact.phone && `<a href="tel:${esc(contact.phone.replace(/\s/g, ""))}">${esc(contact.phone)}</a>`,
  contact.email && `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`,
  contact.linkedin && `<a href="${esc(contact.linkedin)}">${esc(contact.linkedinLabel ?? contact.linkedin)}</a>`,
].filter(Boolean);

const sideSections = [...(about?.cards ?? []), ...(resume.extraSections ?? [])];

const resumeHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(fullName)} — Resume</title>
<meta name="author" content="${esc(fullName)}">
${FONTS}
<style>
  @page { size: A4; margin: 14mm 14mm 14mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Manrope, "Segoe UI", Arial, sans-serif; color: #1c1c1c; font-size: 10pt; line-height: 1.45; margin: 0; }
  header { border-bottom: 3px solid #d7261e; padding-bottom: 8px; margin-bottom: 10px; }
  h1 { font-size: 24pt; letter-spacing: .02em; margin: 0; font-weight: 800; }
  .title { color: #d7261e; font-weight: 700; margin-top: 2px; }
  .contact { color: #555; font-size: 9pt; margin-top: 4px; }
  .contact a { color: inherit; text-decoration: none; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: .12em; color: #d7261e; margin: 12px 0 5px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
  p { margin: 0 0 4px; }
  ul { margin: 2px 0 0; padding-left: 16px; }
  li { margin-bottom: 2px; }
  .job { margin-bottom: 8px; break-inside: avoid; }
  .job-head { display: flex; justify-content: space-between; gap: 12px; }
  .role { font-weight: 700; }
  .org { color: #555; font-style: italic; }
  .period { color: #555; white-space: nowrap; font-weight: 600; }
  .tags { color: #777; font-size: 8.5pt; margin-top: 2px; }
  .skills div { margin-bottom: 2px; }
  .skills b { font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(${Math.min(sideSections.length, 3) || 1}, 1fr); gap: 0 18px; break-inside: avoid; }
  .grid ul { padding-left: 14px; }
</style></head>
<body>
  <header>
    <h1>${esc(fullName)}</h1>
    ${resume.title ? `<div class="title">${esc(resume.title)}</div>` : ""}
    <div class="contact">${contactParts.join(" &nbsp;|&nbsp; ")}</div>
  </header>
  ${resume.objective || about?.summary ? section("Career Objective", `<p>${esc(resume.objective ?? about.summary)}</p>`) : ""}
  ${resume.summary?.length ? section("Professional Summary", `<ul>${resume.summary.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`) : ""}
  ${section(
    "Core Skills & Technology Stack",
    `<div class="skills">${skills.map((g) => `<div><b>${esc(g.title)}:</b> ${g.items.map(esc).join(", ")}</div>`).join("")}</div>`
  )}
  ${section(
    "Professional Experience",
    experience
      .map(
        (j) => `<div class="job">
      <div class="job-head"><div><div class="role">${esc(j.role)}</div><div class="org">${esc(j.org)}</div></div>
      <div class="period">${esc(j.period)}</div></div>
      <ul>${j.points.map(point).join("")}</ul>
      ${j.tags?.length ? `<div class="tags">Tools: ${j.tags.map(esc).join(" · ")}</div>` : ""}
    </div>`
      )
      .join("")
  )}
  ${
    sideSections.length
      ? `<div class="grid">${sideSections
          .map((c) => section(c.title, `<ul>${c.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`))
          .join("")}</div>`
      : ""
  }
</body></html>`;

/* ------------------------------------------------------------------ og.png (1200×630) */

const avatarFile = path.join(root, "public", site.avatar);
const avatarDataUri = existsSync(avatarFile)
  ? `data:image/png;base64,${(await readFile(avatarFile)).toString("base64")}`
  : "";

const ogHtml = `<!doctype html>
<html><head><meta charset="utf-8">${FONTS}
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: Manrope, "Segoe UI", Arial, sans-serif; color: #fffaf5; position: relative;
    background:
      radial-gradient(ellipse 55% 70% at 72% 60%, rgba(255,120,80,.35), transparent 60%),
      linear-gradient(115deg, #7a1212 0%, #c62828 38%, #e53935 68%, #ff7043 100%);
  }
  .copy { position: absolute; left: 72px; top: 0; bottom: 0; width: 720px; display: flex; flex-direction: column; justify-content: center; z-index: 2; }
  .hi { font-size: 20px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; margin-bottom: 6px; }
  h1 { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; font-size: 118px; line-height: .95; letter-spacing: -.02em; margin-bottom: 18px; }
  .title { font-size: 26px; font-weight: 700; margin-bottom: 14px; }
  .lede { font-size: 20px; line-height: 1.45; color: rgba(255,250,245,.85); max-width: 600px; }
  .stats { display: flex; gap: 36px; margin-top: 30px; }
  .stat b { display: block; font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 44px; line-height: 1; }
  .stat span { font-size: 14px; color: rgba(255,250,245,.8); }
  .avatar { position: absolute; right: 40px; bottom: -8px; height: 600px; z-index: 1; filter: drop-shadow(0 20px 36px rgba(0,0,0,.4)); }
</style></head>
<body>
  <div class="copy">
    <div class="hi">${esc(hero?.greeting ?? "")}</div>
    <h1>${esc(hero?.name ?? fullName)}</h1>
    <div class="title">${esc(hero?.title ?? resume.title ?? "")}</div>
    <div class="lede">${esc(site.description ?? about?.summary ?? "")}</div>
    <div class="stats">${stats
      .slice(0, 3)
      .map((s) => `<div class="stat"><b>${esc(s.prefix ?? "")}${esc(s.value)}${esc(s.suffix ?? "")}</b><span>${esc(s.label)}</span></div>`)
      .join("")}</div>
  </div>
  ${avatarDataUri ? `<img class="avatar" src="${avatarDataUri}" alt="">` : ""}
</body></html>`;

/* ------------------------------------------------------------------ apple-touch-icon (180×180) */

const iconHtml = `<!doctype html>
<html><head><meta charset="utf-8">${FONTS}
<style>
  * { margin: 0; } html, body { width: 180px; height: 180px; overflow: hidden; }
  body { background: linear-gradient(135deg, #8b1a1a 0%, #c62828 45%, #ff7043 100%); display: grid; place-items: center; }
  span { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-size: 126px; line-height: 1; color: #fffaf5; transform: translate(2px, -6px); }
</style></head><body><span>P</span></body></html>`;

/* ------------------------------------------------------------------ render */

const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(edge) ? edge : undefined);

const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
try {
  await mkdir(outDir, { recursive: true });
  const render = async (html, viewport, fn) => {
    const page = await browser.newPage();
    if (viewport) await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await fn(page);
    await page.close();
  };

  await render(resumeHtml, null, async (page) => {
    const file = path.join(outDir, site.resumePdf);
    await page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });
    console.log(`Resume PDF written: ${path.relative(root, file)}`);
  });

  await render(ogHtml, { width: 1200, height: 630 }, async (page) => {
    const file = path.join(outDir, "og.png");
    await page.screenshot({ path: file, type: "png" });
    console.log(`Social preview written: ${path.relative(root, file)}`);
  });

  await render(iconHtml, { width: 180, height: 180 }, async (page) => {
    const file = path.join(outDir, "apple-touch-icon.png");
    await page.screenshot({ path: file, type: "png" });
    console.log(`Touch icon written: ${path.relative(root, file)}`);
  });
} finally {
  await browser.close();
}
