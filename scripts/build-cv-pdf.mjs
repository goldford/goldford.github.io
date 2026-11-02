// Renders /cv/ with its print stylesheet to files/Greig_Oldford_CV.pdf.
// Usage: npm run cv:pdf  (builds the site first). Uses your installed Chrome or Edge;
// set CHROME_PATH to point at a different browser.
import puppeteer from "puppeteer-core";
import { existsSync, copyFileSync, mkdirSync, createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, join, extname } from "node:path";

const browserPath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean).find((p) => existsSync(p));
if (!browserPath) { console.error("No Chrome/Edge found. Set CHROME_PATH."); process.exit(1); }

const root = resolve("_site");
if (!existsSync(join(root, "cv/index.html"))) { console.error("Build the site first (npm run build)."); process.exit(1); }

// Serve _site over HTTP so root-relative asset paths resolve.
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const server = createServer((req, res) => {
  let f = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream" });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const out = resolve("files/Greig_Oldford_CV.pdf");
mkdirSync(resolve("files"), { recursive: true });
const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/cv/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: "letter", preferCSSPageSize: true, printBackground: false });
} finally {
  await browser.close();
  server.close();
}
copyFileSync(out, join(root, "files/Greig_Oldford_CV.pdf"));
console.log(`Wrote ${out}`);
