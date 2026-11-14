"""
Sector mapping for bdjobs category IDs (Cat_id -> sector name).

NOTE: These names were inferred from the most common job titles inside each
category ID. They are not taken from an official bdjobs list, so treat them as
good approximations. IDs that are not listed fall back to "Other (ID n)".

Usage:
    python analysis/sector_map.py        # prints the top sectors
    from sector_map import add_sector_names   # use it in the dashboard
"""

import pandas as pd

SECTOR_MAP = {
    0: "Blue Collar / Other",
    1: "Accounting / Finance",
    2: "Banking / Financial Institutions",
    3: "Commercial / Supply Chain",
    4: "Education / Training",
    5: "Engineering / Architecture",
    6: "Garments / Textile",
    7: "General Management / Admin",
    8: "IT / Software",
    9: "Marketing / Sales",
    10: "Media / Advertising / Events",
    11: "Medical / Healthcare",
    12: "NGO / Development",
    14: "Secretary / Receptionist",
    15: "Data Entry / Operator",
    16: "Customer Support / Call Center",
    17: "HR / Organization Development",
    18: "Design / Creative / Video",
    19: "Production / Operations",
    20: "Hospitality / Travel / Tourism",
    22: "Legal",
    24: "Security / Support Services",
    26: "Agro / Farming",
    27: "Commercial / Export-Import",
    29: "Pharmaceutical",
    30: "Digital Marketing",
    61: "Computer Operator",
    62: "Technician / Mechanic",
    63: "Nursing",
    65: "Medical Technologist / Lab",
    66: "Electrician",
    67: "Driver",
    68: "Chef / Food Service",
    70: "Security Guard",
    71: "Graphics Design",
    79: "Office Assistant / Support Staff",
    83: "Retail Sales",
    84: "Field Sales",
}


def add_sector_names(df):
    """Return a copy of df with a readable 'sector' column added."""
    df = df.copy()
    ids = pd.to_numeric(df["sector_cat_id"], errors="coerce").astype("Int64")
    df["sector"] = ids.map(SECTOR_MAP)
    df["sector"] = df["sector"].fillna("Other (ID " + ids.astype(str) + ")")
    return df


if __name__ == "__main__":
    df = add_sector_names(pd.read_csv("data/processed/jobs_master.csv"))
    df["publish_date"] = pd.to_datetime(df["publish_date"], errors="coerce", utc=True)

    print("Top 10 sectors (all data):")
    print(df["sector"].value_counts().head(10).to_string())

    latest = df["publish_date"].max()
    last_7_days = df[df["publish_date"] >= latest - pd.Timedelta(days=7)]
    print(f"\nTop 10 sectors (7 days up to {latest:%Y-%m-%d}):")
    print(last_7_days["sector"].value_counts().head(10).to_string())
