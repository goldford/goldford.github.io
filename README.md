# goldford.github.io

Personal academic site of Greig Oldford, built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages by GitHub Actions.

## Updating content

Almost everything lives in YAML under `src/_data/`. Edit, commit, push; the site rebuilds itself.

| File | What it holds |
|---|---|
| `site.yaml` | Name, roles, links, headshot path, CV PDF path, SOGEM link |
| `publications.yaml` | Every publication (newest first). `featured: true` puts it on the home page |
| `talks.yaml` | Talks, panels, testimony. `highlight: true` puts it in "On the record" |
| `cv.yaml` | Appointments, education, awards, teaching, service, skills |
| `research.yaml` | Research themes (home cards and `/research/`) |

The CV page (`/cv/`) and the PDF are generated from the same data.

## Commands

```bash
npm install        # once
npm start          # local preview at http://localhost:8080
npm run build      # build to _site/
npm run cv:pdf     # rebuild the site and regenerate files/Greig_Oldford_CV.pdf (needs Chrome or Edge)
```

Run `npm run cv:pdf` and commit the PDF whenever the CV data changes. The deploy workflow does not regenerate it.

## Structure

```
src/_data/        content (YAML)
src/_includes/    base layout and partials
src/*.njk         pages: home, research, publications, talks, cv, art, 404
src/assets/       css, js (foodweb.js = hero animation), img
images/, files/   images and PDFs, served as-is at /images and /files
scripts/          build-cv-pdf.mjs
```

## Deploying

Repository **Settings → Pages → Source** must be set to **GitHub Actions**.
