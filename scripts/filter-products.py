"""
filter-products.py

Re-filters an already-scraped output/products.json

Use this to clean up a dataset you've already pulled, or to
retune NOISE_KEYWORDS and see the effect without waiting through another
full scrape.

Usage:
    pip install google-genai
    set GEMINI_API_KEY=your-key
    python scripts/filter-products.py
"""

import json
import os
import re
from pathlib import Path
from collections import defaultdict

from google import genai

INPUT_PATH = Path("output/products.json")
OUTPUT_PATH = Path("output/products_filtered.json")

# How many results to keep per ingredient after filtering.
RESULTS_PER_INGREDIENT = 5
BATCH_SIZE = 25
GEMINI_MODEL = "gemini-3.6-flash"

# Same list as the scraper — tweak this and re-run to retune without
# scraping again. Add whatever other junk you spot in your existing data.
NOISE_KEYWORDS = [
    "cracker", "biscuit", "chip", "crisp", "broth", "soup", "dip",
    "seasoning", "gravy", "stock cube", "treat", "snack", "pie",
    "sausage roll", "pet", "dog", "cat", "flavoured", "flavour",
    "chews", "candy", "lolly",
]


def relevance_score(term, product_name):
    """Higher = better match. Returns None if the product should be
    excluded outright (contains a noise keyword, or doesn't actually
    contain the search term at all)."""
    name_lower = product_name.lower()
    term_lower = term.lower()

    for kw in NOISE_KEYWORDS:
        if kw in name_lower:
            return None

    if term_lower not in name_lower:
        return None

    words = re.findall(r"[a-z0-9']+", name_lower)
    if term_lower in words:
        return 10 - words.index(term_lower)
    else:
        return 2


def heuristic_filter(term, products):
    """Return products ordered by the existing local relevance heuristic."""
    scored = [
        (relevance_score(term, p.get("name") or ""), p)
        for p in products
    ]
    scored = [(score, p) for score, p in scored if score is not None]
    scored.sort(key=lambda item: item[0], reverse=True)
    return [p for _, p in scored[:RESULTS_PER_INGREDIENT]]


def gemini_filter(client, term, products):
    """Ask Gemini to identify genuine ingredient products in small batches."""
    kept = []

    for start in range(0, len(products), BATCH_SIZE):
        batch = products[start:start + BATCH_SIZE]
        product_lines = "\n".join(
            f"{index}: {product.get('name') or ''}"
            for index, product in enumerate(batch)
        )
        prompt = f"""
You filter Woolworths Australia search results for a recipe ingredient.
Ingredient: {term!r}

Keep a product only when it is a usable grocery ingredient for a recipe
whose ingredient is {term!r}. Reject ready-made meals, snacks, drinks,
supplements, pet food, and products where the ingredient is only an incidental
flavour or a small component (for example chicken crackers for chicken).

Return ONLY valid JSON in this exact shape: {{"keep": [integer indexes]}}
Do not include explanations or markdown.

Products:
{product_lines}
"""
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw).strip()
        decision = json.loads(raw)
        indexes = decision.get("keep")
        if not isinstance(indexes, list):
            raise ValueError("Gemini response did not contain a keep list")

        for index in indexes:
            if isinstance(index, int) and 0 <= index < len(batch):
                kept.append(batch[index])

    return kept[:RESULTS_PER_INGREDIENT]


def main():
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        all_products = json.load(f)

    print(f"Loaded {len(all_products)} products from {INPUT_PATH}")

    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else None
    if client is None:
        print("GEMINI_API_KEY is not set; using heuristic filtering")

    # Group by the ingredient/search term they came from
    by_term = defaultdict(list)
    for p in all_products:
        by_term[p["search_term"]].append(p)

    filtered = []
    for term, products in by_term.items():
        try:
            kept = (
                gemini_filter(client, term, products)
                if client
                else heuristic_filter(term, products)
            )
        except Exception as error:
            print(f"  Gemini filtering failed for {term}: {error}")
            kept = heuristic_filter(term, products)
        filtered.extend(kept)
        if len(kept) < len(products):
            print(
                f"{term}: kept {len(kept)}/{len(products)} "
                f"(dropped {len(products) - len(kept)})"
            )

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(filtered)} products to {OUTPUT_PATH}")
    print(f"(down from {len(all_products)} originally)")


if __name__ == "__main__":
    main()