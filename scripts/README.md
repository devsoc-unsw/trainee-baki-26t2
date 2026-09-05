# scripts/

One-off Python scripts that populate `output/products.json`, the
Woolworths product catalogue the server-side compare pipeline reads
from via `src/server/catalogue/woolworths.ts`. They are NOT part of
the Next.js app runtime — nothing in `src/` or the built bundle
depends on them.

## Requirements

- Python 3.11+ (the scraper uses `curl_cffi` for TLS fingerprinting)
- A network path to `woolworths.com.au` and `themealdb.com`
- For `filter-products.py`: a `GEMINI_API_KEY` (see `.env.example`).
  Note that as of the last audit `src/lib/gemini.ts` in the app is
  broken and unused; the Python-side use is independent.

```bash
python -m venv .venv
source .venv/bin/activate
pip install curl_cffi google-genai
```

## Regenerating `output/products.json`

The scraper walks every ingredient TheMealDB knows about (~992 terms)
and pages through Woolworths' internal search API for each. It writes
both a JSON dump and a CSV mirror.

```bash
python scripts/woolworths-scraper.py
```

Output lands in:

- `output/products.json` — array of raw product records, one per
  Woolworths hit. Consumed at module load by
  `src/server/catalogue/woolworths.ts`.
- `output/products.csv` — same data, easier for eyeballing in a
  spreadsheet.

The full run takes ~30 minutes and hits Woolworths politely (random
sleeps between requests). Re-run it whenever prices drift too far
from reality; a real integration would replace this with a live API
call, but until then the JSON is the source of truth.

## Post-processing with `filter-products.py`

Optional. Trims the raw dump down to the top N products per
ingredient after ranking them through the Gemini API. Only useful if
you want a smaller committed dataset — the compare pipeline is fine
consuming the full unfiltered `output/products.json`.

```bash
export GEMINI_API_KEY=...
python scripts/filter-products.py
```

## Housekeeping

`scripts/__pycache__/` and `*.pyc` are gitignored. If you see them
appearing in `git status`, verify your Python isn't writing bytecode
outside the source tree (e.g. via `PYTHONDONTWRITEBYTECODE=1` env
var during development).
