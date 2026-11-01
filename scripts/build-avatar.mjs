// Creates the WebP version of the avatar (public/<site.avatarWebp>) from the PNG
// (public/<site.avatar>) using headless Chrome, so no extra image libraries are needed.
// Run it once whenever the avatar PNG changes:  npm run avatar
import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { site } = JSON.parse(await readFile(path.join(root, "src/content.json"), "utf8"));
const src = path.join(root, "public", site.avatar);
const out = path.join(root, "public", site.avatarWebp ?? site.avatar.replace(/\.\w+$/, ".webp"));
const quality = Number(process.argv[2] ?? 0.85);

const dataUri = `data:image/png;base64,${(await readFile(src)).toString("base64")}`;

const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(edge) ? edge : undefined);
const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  const webp = await page.evaluate(async (uri, q) => {
    const img = new Image();
    img.src = uri;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return { data: c.toDataURL("image/webp", q), w: c.width, h: c.height };
  }, dataUri, quality);
  await writeFile(out, Buffer.from(webp.data.split(",")[1], "base64"));
  const before = (await stat(src)).size;
  const after = (await stat(out)).size;
  console.log(
    `${path.relative(root, out)}: ${webp.w}×${webp.h}, ${(after / 1024).toFixed(0)} KB (PNG was ${(before / 1024).toFixed(0)} KB)`
  );
  if (webp.w !== site.avatarWidth || webp.h !== site.avatarHeight) {
    console.warn(
      `Note: content.json site.avatarWidth/avatarHeight are ${site.avatarWidth}×${site.avatarHeight}; the image is ${webp.w}×${webp.h}. Update them.`
    );
  }
} finally {
  await browser.close();
}
