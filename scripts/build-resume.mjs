// Generates the downloadable resume PDF from src/content.json.
// Usage: node scripts/build-resume.mjs [outDir]   (default: public)
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, process.argv[2] ?? "public");
const content = JSON.parse(await readFile(path.join(root, "src/content.json"), "utf8"));
const { site, experience, skills, about, contact, resume = {} } = content;

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const point = (p) => {
  const i = p.indexOf(" — ");
  return i > 0 && i < 90
    ? `<li><strong>${esc(p.slice(0, i))}</strong> — ${esc(p.slice(i + 3))}</li>`
    : `<li>${esc(p)}</li>`;
};

const section = (title, body) => `<section><h2>${esc(title)}</h2>${body}</section>`;

const contactLine = [contact.location, contact.phone, contact.email, contact.linkedinLabel]
  .filter(Boolean)
  .map(esc)
  .join(" &nbsp;|&nbsp; ");

const sideSections = [...(about?.cards ?? []), ...(resume.extraSections ?? [])];

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
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
    <h1>${esc(resume.fullName ?? content.footerName)}</h1>
    ${resume.title ? `<div class="title">${esc(resume.title)}</div>` : ""}
    <div class="contact">${contactLine}</div>
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

const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(edge) ? edge : undefined);

const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
  await mkdir(outDir, { recursive: true });
  const file = path.join(outDir, site.resumePdf);
  await page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log(`Resume PDF written: ${path.relative(root, file)}`);
} finally {
  await browser.close();
}
