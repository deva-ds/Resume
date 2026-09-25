# Pullaiah Devalla — Interactive Resume Website

Live site: **https://deva-ds.github.io/Resume/**

A personal resume site with an illustrated avatar whose eyes follow the cursor, an interactive experience timeline, animated stats, and skills cards. Built with React + Vite and deployed automatically to GitHub Pages by GitHub Actions.

---

## How to update the website (no coding needed)

**All text on the site lives in one file: [`src/content.json`](src/content.json).**

1. Open `src/content.json` (on GitHub: click the file, then the pencil icon to edit).
2. Change the text you want.
3. Commit the change to the `main` branch.
4. Wait about 1–2 minutes. GitHub Actions rebuilds the site and publishes it automatically. You can watch progress under the repo's **Actions** tab.

That's it. You never need to touch the code to update content.

### Where each piece of the site comes from

| What you want to change | Where in `src/content.json` |
| --- | --- |
| Name, "HI, I'M", headline under the name, button labels | `hero` |
| Browser tab title | `site.title` |
| The 4 animated numbers under the hero | `stats` |
| Sentence under the "Experience" heading | `experienceIntro` |
| Jobs / roles (timeline + detail panel) | `experience` |
| Sentence under the "Skills" heading | `skillsIntro` |
| Skill cards and the scrolling skill ticker | `skills` |
| About paragraph, certifications, awards, languages | `about` |
| Email, LinkedIn, phone, location | `contact` |
| Name in the footer | `footerName` |
| Resume-only text: full name, title line, career objective, summary bullets, interests | `resume` |

### The downloadable resume PDF is generated automatically

The "Resume" buttons download a PDF that is **built from `content.json` on every deploy**, so it always matches the website. You don't upload a PDF.

The PDF uses:

- `resume.fullName`, `resume.title`, and `contact` for the header.
- `resume.objective` and `resume.summary` for Career Objective and Professional Summary.
- `skills` for Core Skills.
- `experience` for Professional Experience (the same roles, periods, and bullets as the site; `Headline — detail` bullets print with a bold headline).
- `about.cards` (certifications, awards, languages) plus `resume.extraSections` (for example Interests) at the end.

To add another block that appears only in the PDF, add `{ "title": "...", "lines": ["..."] }` to `resume.extraSections`. The PDF layout itself lives in `scripts/build-resume.mjs`.

### Adding a new job

Add a new block at the **top** of the `experience` list (the first item is shown first on the timeline). Copy an existing block and edit it:

```json
{
  "key": "newco",
  "short": "New Company",
  "role": "Lead Data Engineer",
  "org": "New Company, Hyderabad",
  "period": "Jan 2027 — Present",
  "years": "2027 — Now",
  "badge": "Employer",
  "metrics": [
    { "value": 25, "suffix": "+", "label": "Pipelines built" },
    { "value": 3, "suffix": "x", "label": "Faster refresh" },
    { "value": 99, "suffix": "%", "label": "SLA met" }
  ],
  "tags": ["Fabric", "Databricks", "Power BI"],
  "points": [
    "Short headline — longer detail that appears when the item is expanded.",
    "A bullet without a dash shows as a single line."
  ]
},
```

Field notes:

- `key`: any unique short word, no spaces.
- `short`: company name shown on the timeline.
- `badge`: `Client`, `Employer`, or `Previous` (controls the badge color).
- `metrics`: exactly 3 work best. `value` must be a number (it animates); `prefix`/`suffix` are optional text like `"+"`, `"%"`, `"GB"`.
- `points`: write `Headline — detail` (with a spaced em dash ` — `) to make the bullet expandable. Without the dash it shows as a plain line.
- When the previous job ends, update its `period`, `years`, and `badge` (for example to `Previous`).

**JSON tips:** keep the quotes and commas exactly as in the examples. Every item in a list is separated by a comma, but the last item has no trailing comma. If the site stops updating after an edit, open the **Actions** tab — a red X usually means a missing comma or quote in `content.json`.

### Replacing the avatar

The avatar is `public/pullaiah-avatar.png` (transparent background). To replace it, upload a new file with the **same name** into `public/`, or use a different name and update `site.avatar` in `content.json`. (`site.resumePdf` only sets the file name of the generated PDF.)

If you replace the avatar with a different image, the eye positions will no longer line up. They are set in the `EYES` list near the top of `src/App.jsx` (percent positions of each eye on the image), so a new avatar needs those numbers adjusted.

---

## How the automatic deployment works

- Workflow file: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- It runs on every push to `main` (and can be run manually from the **Actions** tab via "Run workflow").
- It installs dependencies, builds the site, generates the resume PDF from `content.json` (the `postbuild` step, using headless Chrome via Puppeteer), and publishes the `dist/` folder to GitHub Pages.
- One-time setting (already done): **Settings → Pages → Build and deployment → Source = GitHub Actions**.

## Running locally (optional)

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Edits to `src/content.json` show up instantly.

To preview the resume PDF locally, run `npm run resume`. It writes `public/Pullaiah_Devalla_Resume.pdf`, which is git-ignored because the deploy regenerates it.

## Project layout

```
src/content.json      <- all website text (edit this)
src/App.jsx           <- page layout, avatar eye-tracking, interactions
src/App.css           <- styling and animations
scripts/build-resume.mjs <- builds the resume PDF from content.json
public/               <- avatar image and icons
.github/workflows/    <- automatic build + deploy to GitHub Pages
```
