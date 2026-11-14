# Job market dashboard

A React dashboard for the daily bdjobs data collected by this repo. It shows which sectors have the most
open jobs, how many jobs were posted each day, and a ranked, filterable list of jobs with a match score.

The dashboard reads `data/processed/jobs_master.csv` straight from GitHub in the browser, so it always shows
the latest scrape. There is no backend and no rebuild is needed when new data arrives.

## Run it on your computer

You need Node.js 20 or newer (check with `node -v`). If you use Anaconda you can install it with
`conda install -c conda-forge nodejs`, or download it from https://nodejs.org.

```bash
cd dashboard
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Publish it with GitHub Pages

1. Put `.github/workflows/deploy-dashboard.yml` in the repo root (it is included in the update zip).
2. On GitHub: Settings, Pages, Build and deployment, Source: **GitHub Actions**.
3. Merge to `main`. The workflow builds the site and publishes it at
   `https://<your-username>.github.io/job-market-tracker/`.

The daily scrape commits do not trigger a rebuild, and they do not need to: the site loads the data file
when someone opens the page.

## Things you can change

| What | Where |
| --- | --- |
| Data file address, job link format | `src/config.js` |
| Sector names (id to name) | `src/sectors.js` |
| Match score weights | `scoreJobs` in `src/data.js` |
| Colors, fonts, spacing | `src/styles.css` |

## How the match score works

Each open job gets 0 to 100 points: salary up to 40 (percentile among open jobs, none if no salary is listed
or pay is above Tk 300k a month), vacancies up to 20, freshness up to 20 and time left up to 20.

## Known limits

- Sector names are inferred from job titles. bdjobs only provides a category number.
- "Jobs posted per day" counts only jobs that were still open when scraped, so older days read low until the
  daily scrape has built up history.
- Some top-ranked jobs are overseas recruitment ads. Use the search box or the sector list to narrow down.
- The job link format in `src/config.js` was not verified against bdjobs. Open one link and adjust it if needed.
