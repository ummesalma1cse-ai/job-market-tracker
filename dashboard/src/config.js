// Where the dashboard reads its data from. The daily GitHub Action updates this
// file, so the site always shows the latest scrape without being rebuilt.
export const DATA_URL =
  import.meta.env.VITE_DATA_URL ||
  "https://raw.githubusercontent.com/ummesalma1cse-ai/job-market-tracker/main/data/processed/jobs_master.csv";

// Small bundled copy used only when GitHub can't be reached.
export const SAMPLE_URL = `${import.meta.env.BASE_URL}sample_jobs.csv`;

export const REPO_URL = "https://github.com/ummesalma1cse-ai/job-market-tracker";

// Link for the "open job" title. Check one link in your browser; if bdjobs uses a
// different address for job pages, change it here.
export const jobLink = (id) => `https://bdjobs.com/h/details/${id}?lang=en`;

// How many days of "posted per day" history the chart shows.
export const CHART_DAYS = 14;
