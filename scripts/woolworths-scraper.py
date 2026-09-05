"""
woolworths_scraper.py

One-off script to build a Woolworths product dataset (JSON + CSV) covering
every ingredient TheMealDB knows about. Run this locally/manually, then
point your Next.js app at the resulting output/products.json instead of
hitting Woolworths live on every request.

Why this works where the Node fetch didn't:
- curl_cffi mimics a real browser's TLS handshake fingerprint, which is
  likely what was tripping Woolworths' connection-level bot detection
  (Node's fetch/undici has a distinguishable handshake).
- It also "warms up" a session by visiting the homepage first, picking up
  cookies before hitting the search API, rather than firing a blind POST.

Setup:
    pip install curl_cffi

Usage:
    python woolworths_scraper.py
"""
import json
import csv
import re
import time
import random
import urllib.request
from pathlib import Path

from curl_cffi import requests as cf_requests

SEARCH_URL = "https://www.woolworths.com.au/apis/ui/Search/products"
HOME_URL = "https://www.woolworths.com.au/"
MEALDB_INGREDIENTS_URL = "https://www.themealdb.com/api/json/v1/1/list.php?i=list"

# Real category filter values, captured from Woolworths' own site via
# DevTools (search + apply the filter + inspect the Filters payload).
MEAT_FILTER = [{
  "key": "Level1Categories",
  "items": [{"term": "1_D5A2236", "description": "Poultry, Meat & Seafood"}],
}]

PANTRY_FILTER = [{
  "key": "Level1Categories",
  "items": [{"term": "1_39FD49C", "description": "Pantry"}],
}]

FRUIT_AND_VEG_FILTER = [{
  "key": "Level1Categories",
  "items": [{"term": "1-E5BEE36E", "description": "Fruit & Veg"}]
}]

BAKERY_FILTER = [{
  "key": "Level1Categories",
  "items": [{"term": "1_DEB537E", "description": "Bakery"}]
}]

DAIRY_FILTER = [{
  "key": "Level1Categories",
  "items": [{"term": "1_6E4F4E4", "description": "Dairy, Eggs & Fridge"}]
}]

CATEGORY_FILTERS = {
  "Meat, Poultry & Seafood": MEAT_FILTER,
  "Pantry": PANTRY_FILTER,
  "Fruit & Veg": FRUIT_AND_VEG_FILTER,
  "Bakery": BAKERY_FILTER,
  "Dairy": DAIRY_FILTER,
}

# How many Woolworths results to keep per ingredient search
RESULTS_PER_INGREDIENT = 5

# How many raw results to pull from Woolworths per search before filtering
# down to RESULTS_PER_INGREDIENT. Needs to be bigger than that, since some
# of what comes back will get filtered out as irrelevant.
RAW_FETCH_SIZE = 10

CATEGORY_PATH = Path("output/ingredients-category.json")

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

def get_all_mealdb_ingredients():
  """Fetch every ingredient TheMealDB knows about, so the product
  dataset covers any meal the app could possibly return — instead of
  a hand-picked placeholder list."""
  req = urllib.request.Request(
      MEALDB_INGREDIENTS_URL,
      headers={"User-Agent": "Mozilla/5.0 (compatible; woolworths-scraper/1.0)"},
  )
  with urllib.request.urlopen(req, timeout=15) as res:
    raw = res.read().decode("utf-8")

  data = json.loads(raw)
  meals = data.get("meals")

  if not meals:
    print("DEBUG: TheMealDB returned no ingredients. Raw response was:")
    print(raw[:500])
    return []

  ingredients = []
  for entry in meals:
    name = entry.get("strIngredient")
    if name:
      ingredients.append(name.strip())

  print(f"Fetched {len(ingredients)} ingredients from TheMealDB")
  return ingredients


def load_categories(search_terms):
  """Load preclassified ingredients and map them to Woolies filters."""
  if not CATEGORY_PATH.exists():
    raise FileNotFoundError(f"Missing category file: {CATEGORY_PATH}")

  with open(CATEGORY_PATH, "r", encoding="utf-8") as f:
    raw_categories = json.load(f)

  if not isinstance(raw_categories, dict):
    raise ValueError(f"Expected an object in {CATEGORY_PATH}")

  valid_categories = set(CATEGORY_FILTERS)
  categories = {}
  for term in search_terms:
    label = raw_categories.get(term)
    if label not in valid_categories:
      print(f"WARNING: No preclassified category for {term}; using pantry")
      categories[term] = "Pantry"
    else:
      categories[term] = label

  print(f"Loaded {len(categories)} preclassified ingredient categories")
  return categories


def get_session():
  """Create a session with a browser-like TLS fingerprint and warm it up
  by visiting the homepage first, so requests look like they're coming
  from a real browser session rather than a blind API call."""
  session = cf_requests.Session(impersonate="chrome")
  session.get(HOME_URL, timeout=15)
  return session


def search_products(session, term, category):
  def run_search(filters):
    body = {
      "Filters": filters,
      "IsSpecial": False,
      "Location": f"/shop/search/products?searchTerm={term}",
      "PageNumber": 1,
      "PageSize": RAW_FETCH_SIZE,
      "SearchTerm": term,
      "SortType": "TraderRelevance",
    }
    res = session.post(SEARCH_URL, json=body, timeout=15)
    res.raise_for_status()
    data = res.json()

    raw = []
    for group in data.get("Products", []) or []:
      for p in group.get("Products", []) or []:
        if not p:
          continue
        raw.append({
          "search_term": term,
          "stockcode": p.get("Stockcode"),
          "name": p.get("Name"),
          "brand": p.get("Brand"),
          "price": p.get("Price"),
          "cup_price": p.get("CupString"),
          "package_size": p.get("PackageSize"),
          "image_url": p.get("SmallImageFile") or p.get("MediumImageFile"),
          "url": f"https://www.woolworths.com.au/shop/productdetails/{p.get('Stockcode')}",
        })
    return raw

  filters = CATEGORY_FILTERS[category]

  products = run_search(filters)

  if not products:
    print(f"  No products with {category} filter, trying unfiltered")
    products = run_search([])

  return products


def main():
  search_terms = get_all_mealdb_ingredients()
  categories = load_categories(search_terms)
  session = get_session()
  all_products = []

  json_path = OUTPUT_DIR / "products.json"
  csv_path = OUTPUT_DIR / "products.csv"

  for i, term in enumerate(search_terms, start=1):
    print(f"[{i}/{len(search_terms)}] Searching: {term}")
    try:
      category = categories.get(term, "pantry")
      print(f"  Woolies category: {category}")
      products = search_products(session, term, category)
      print(f"  found {len(products)} products")
      all_products.extend(products)
    except Exception as e:
      print(f"  failed: {e}")

    # Save progress every 20 terms, so a crash partway through
    # (a few hundred terms will take a while) doesn't lose everything.
    if i % 10 == 0:
      with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, indent=2, ensure_ascii=False)
      print(f"  ...progress saved ({len(all_products)} products so far)")

    # Be polite / avoid tripping rate limits — randomised delay
    time.sleep(random.uniform(2, 5))

  # Final save
  with open(json_path, "w", encoding="utf-8") as f:
    json.dump(all_products, f, indent=2, ensure_ascii=False)
  print(f"Saved {len(all_products)} products to {json_path}")

  if all_products:
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
      writer = csv.DictWriter(f, fieldnames=all_products[0].keys())
      writer.writeheader()
      writer.writerows(all_products)
    print(f"Saved {len(all_products)} products to {csv_path}")


if __name__ == "__main__":
    main()