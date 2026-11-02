import yaml from "js-yaml";
import markdownIt from "markdown-it";

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
