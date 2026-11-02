// Renders the CV pages with their print stylesheet to PDF:
//   /cv/                 -> files/Greig_Oldford_CV.pdf
//   site.private_cv.url  -> site.private_cv.pdf (unlisted DFO / Government of Canada CV)
// Usage: npm run cv:pdf  (builds the site first). Uses your installed Chrome or Edge;
// set CHROME_PATH to point at a different browser.
import puppeteer from "puppeteer-core";
import yaml from "js-yaml";
import { existsSync, copyFileSync, mkdirSync, createReadStream, statSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, join, extname, dirname } from "node:path";

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

const site = yaml.load(readFileSync("src/_data/site.yaml", "utf8"));
const jobs = [{ url: "/cv/", pdf: site.cv_pdf }];
if (site.private_cv?.url && site.private_cv?.pdf) jobs.push(site.private_cv);

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

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
try {
  for (const job of jobs) {
    // PDFs are committed under files/ (passthrough-copied to /files/ on build).
    const rel = job.pdf.replace(/^\/+/, "");
    const out = resolve(rel);
    mkdirSync(dirname(out), { recursive: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}${job.url}`, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: out, format: "letter", preferCSSPageSize: true, printBackground: false });
    await page.close();
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    copyFileSync(out, join(root, rel));
    console.log(`Wrote ${out}`);
  }
} finally {
  await browser.close();
  server.close();
}
