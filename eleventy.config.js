import yaml from "js-yaml";
import markdownIt from "markdown-it";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Tailored GC CV variants live outside this public repo (default: ../greig_os/outreach/cv-variants,
// or set CV_VARIANTS_DIR). Each *.yaml there holds { slug, pdf, cvgc: {overrides} }. They build only
// on a machine that has that folder, so nothing tailored is ever deployed. See cv-variant.njk.
export const cvVariantsDir = () =>
  [process.env.CV_VARIANTS_DIR, "../greig_os/outreach/cv-variants"].filter(Boolean).map((d) => resolve(d)).find((d) => existsSync(d));


const md = markdownIt({ html: true, typographer: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toDate = (d) => (d instanceof Date ? d : new Date(String(d)));

export default function (eleventyConfig) {
  // Content lives in YAML under src/_data so the site, CV and PDF share one source.
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));

  // Art page hidden for now. To restore: delete this line, add Art to site.yaml nav and
  // sitemap.njk, and remove the /art/ redirect in redirects.njk.
  eleventyConfig.ignores.add("src/art.njk");

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  // Prebuilt, staticrypt-encrypted previews. Kept outside src/ so Nunjucks never touches them.
  eleventyConfig.addPassthroughCopy({ "previews/merlin": "merlin/preview" });

  // Bold my name in author lists.
  eleventyConfig.addFilter("authors", (s = "") =>
    String(s).replace(/Oldford,\s*G\.(?:\s?[A-Z]\.)?/g, (m) => `<strong class="me">${m}</strong>`)
  );

  eleventyConfig.addFilter("md", (s = "") => md.render(String(s)));
  eleventyConfig.addFilter("mdInline", (s = "") => md.renderInline(String(s)));

  eleventyConfig.addFilter("year", (d) => toDate(d).getUTCFullYear());
  eleventyConfig.addFilter("monthYear", (d) => {
    const x = toDate(d);
    return `${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("dayMonth", (d) => {
    const x = toDate(d);
    return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
  });
  eleventyConfig.addFilter("talkDay", (t) => {
    const x = toDate(t.date);
    return t.approx ? MONTHS[x.getUTCMonth()] : `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
  });
  eleventyConfig.addFilter("whereNot", (arr = [], key, value) => arr.filter((x) => x[key] !== value));
  eleventyConfig.addFilter("iso", (d) => toDate(d).toISOString().slice(0, 10));

  eleventyConfig.addFilter("where", (arr = [], key, value) => arr.filter((x) => x[key] === value));
  eleventyConfig.addFilter("whereIn", (arr = [], key, values = []) => arr.filter((x) => values.includes(x[key])));
  eleventyConfig.addFilter("pick", (arr = [], ids = []) =>
    ids.map((id) => arr.find((x) => x.id === id)).filter(Boolean)
  );
  eleventyConfig.addFilter("newestFirst", (arr = [], key = "date") =>
    [...arr].sort((a, b) => toDate(b[key]) - toDate(a[key]))
  );
  eleventyConfig.addFilter("limit", (arr = [], n) => arr.slice(0, n));
  eleventyConfig.addFilter("uniqueYears", (arr = [], key = "year") => {
    const ys = arr.map((x) => (key === "date" ? toDate(x.date).getUTCFullYear() : x[key]));
    return [...new Set(ys)].sort((a, b) => b - a);
  });
  eleventyConfig.addFilter("inYear", (arr = [], y) => arr.filter((x) => toDate(x.date).getUTCFullYear() === y));

  eleventyConfig.addGlobalData("cvVariants", () => {
    const dir = cvVariantsDir();
    if (!dir) return [];
    const base = yaml.load(readFileSync("src/_data/cvgc.yaml", "utf8"));
    return readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => {
      const v = yaml.load(readFileSync(join(dir, f), "utf8"));
      return { ...v, dir, cvgc: { ...base, ...(v.cvgc || {}) } };
    });
  });

  eleventyConfig.addGlobalData("build", () => {
    const d = new Date();
    return { date: d, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
