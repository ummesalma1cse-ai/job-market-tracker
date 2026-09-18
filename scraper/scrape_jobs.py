"""
Daily Job Scraper - BDJobs.com (API-based)
Uses bdjobs' internal API directly to get clean, structured JSON data.
This is more stable and faster than parsing HTML.
"""

import requests
import pandas as pd
from datetime import datetime
import os
import time

# ---------- Settings ----------
API_URL = "https://api.bdjobs.com/Jobs/api/JobSearch/GetJobSearch"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://bdjobs.com/",
}

today = datetime.now().strftime("%Y-%m-%d")
RAW_DATA_PATH = f"data/raw/jobs_{today}.csv"
MASTER_DATA_PATH = "data/processed/jobs_master.csv"


def fetch_page(page_number):
    """Fetch one page of job data from the API."""
    params = {
        "Icat": "",
        "industry": "",
        "category": "",
        "org": "",
        "jobNature": "",       # left empty to get all job types (Full-time, Intern, Part-time)
        "Fcat": "",
        "location": "",
        "Qot": "",
        "jobType": "",
        "jobLevel": "",
        "postedWithin": "",
        "deadline": "",
        "keyword": "",
        "pg": page_number,     # page number
        "qAge": "",
        "Salary": "",
        "experience": "",
        "gender": "",
        "MExp": "",
        "genderB": "",
        "MPostings": "",
        "MCat": "",
        "version": "",
        "rpp": 50,              # results per page
        "Newspaper": "",
        "armyp": "",
        "QDisablePerson": "",
        "pwd": "",
        "workplace": "",
        "facilitiesForPWD": "",
        "SaveFilterList": "",
        "UserFilterName": "",
        "HUserFilterName": "",
        "earlyJobAccess": "",
        "isPro": 0,
        "ToggleJobs": "true",
        "isFresher": "false",
    }

    try:
        response = requests.get(API_URL, headers=HEADERS, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch page {page_number}: {e}")
        return None


def extract_jobs(json_data):
    """Extract the fields we need from the JSON response."""
    if not json_data or "data" not in json_data:
        return []

    jobs = []
    for item in json_data["data"]:
        jobs.append({
            "job_id": item.get("Jobid"),
            "title": item.get("jobTitle"),
            "company": item.get("companyName"),
            "location": item.get("location"),
            "sector_cat_id": item.get("Cat_id"),
            "job_type": item.get("JobType"),
            "salary": item.get("Salary"),
            "vacancies": item.get("Vacancies"),
            "experience": item.get("experience"),
            "workplace": item.get("WorkPlace"),
            "deadline": item.get("deadline"),
            "publish_date": item.get("publishDate"),
            "scraped_date": today
        })
    return jobs


def save_data(jobs):
    """Save scraped data to CSV - both a raw daily file and a running master file."""
    if not jobs:
        print("No job data found.")
        return

    df = pd.DataFrame(jobs)

    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)

    # Save today's raw data
    df.to_csv(RAW_DATA_PATH, index=False, encoding="utf-8-sig")
    print(f"Saved {len(df)} jobs to {RAW_DATA_PATH}")

    # Append to the master file
    if os.path.exists(MASTER_DATA_PATH):
        master_df = pd.read_csv(MASTER_DATA_PATH)
        combined = pd.concat([master_df, df], ignore_index=True)
        combined.drop_duplicates(subset=["job_id"], keep="last", inplace=True)
        combined.to_csv(MASTER_DATA_PATH, index=False, encoding="utf-8-sig")
        print(f"Master file now has {len(combined)} unique jobs.")
    else:
        df.to_csv(MASTER_DATA_PATH, index=False, encoding="utf-8-sig")
        print(f"Created new master file with {len(df)} jobs.")


def main():
    print(f"Scraping started at {datetime.now()}")

    all_jobs = []

    # Fetch page 1 first to find out how many total pages there are
    first_page = fetch_page(1)
    if not first_page:
        print("Could not fetch the first page. Stopping.")
        return

    total_pages = first_page.get("common", {}).get("totalpages", 1)
    total_records = first_page.get("common", {}).get("total_records_found", 0)
    print(f"Found {total_records} jobs across {total_pages} pages.")

    all_jobs.extend(extract_jobs(first_page))

    # Fetch the remaining pages (if more than one)
    for page in range(2, total_pages + 1):
        print(f"Fetching page {page}/{total_pages}...")
        page_data = fetch_page(page)
        if page_data:
            all_jobs.extend(extract_jobs(page_data))
        time.sleep(1)  # be polite to the server, don't hammer it with requests

    save_data(all_jobs)
    print("Scraping finished.")


if __name__ == "__main__":
    main()
