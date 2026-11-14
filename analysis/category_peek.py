import pandas as pd

df = pd.read_csv("data/processed/jobs_master.csv")

# Count jobs per category ID
counts = df["sector_cat_id"].value_counts()

for cat_id, total in counts.head(25).items():
    titles = df[df["sector_cat_id"] == cat_id]["title"].dropna().head(8).tolist()
    print(f"\nCat_id {cat_id} ({total} jobs)")
    for t in titles:
        print("   -", t)