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

### Replacing the resume PDF or avatar

These files live in [`public/`](public):

| File | What it is |
| --- | --- |
| `public/Pullaiah_Devalla_Resume.pdf` | Downloaded by the "Resume" buttons |
| `public/pullaiah-avatar.png` | The illustrated avatar (transparent background) |

To replace one, upload a new file with the **same name** into `public/`. If you use a different name, update `site.resumePdf` or `site.avatar` in `content.json`.

If you replace the avatar with a different image, the eye positions will no longer line up. They are set in the `EYES` list near the top of `src/App.jsx` (percent positions of each eye on the image), so a new avatar needs those numbers adjusted.

---

## How the automatic deployment works

- Workflow file: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- It runs on every push to `main` (and can be run manually from the **Actions** tab via "Run workflow").
- It installs dependencies, builds the site, and publishes the `dist/` folder to GitHub Pages.
- One-time setting (already done): **Settings → Pages → Build and deployment → Source = GitHub Actions**.

## Running locally (optional)

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Edits to `src/content.json` show up instantly.

## Project layout

```
src/content.json      <- all website text (edit this)
src/App.jsx           <- page layout, avatar eye-tracking, interactions
src/App.css           <- styling and animations
public/               <- avatar image and resume PDF
.github/workflows/    <- automatic build + deploy to GitHub Pages
```
