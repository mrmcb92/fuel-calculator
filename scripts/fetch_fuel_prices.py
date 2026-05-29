#!/usr/bin/env python3
"""
Fetches current Romanian fuel prices from globalpetrolprices.com
and writes them to fuel-prices.json in the project root.

Run from repo root:  python scripts/fetch_fuel_prices.py
"""

import json
import re
import sys
import datetime
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing dependencies...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4"])
    import requests
    from bs4 import BeautifulSoup

PRICES_FILE = Path(__file__).parent.parent / "fuel-prices.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

URLS = {
    "B95":    "https://www.globalpetrolprices.com/Romania/gasoline_prices/",
    "Diesel": "https://www.globalpetrolprices.com/Romania/diesel_prices/",
    "GPL":    "https://www.globalpetrolprices.com/Romania/lpg_prices/",
}

# Sanity bounds for Romanian fuel prices (RON/L)
PRICE_MIN = 2.0
PRICE_MAX = 30.0


def load_current_prices():
    try:
        with open(PRICES_FILE) as f:
            return json.load(f)
    except Exception:
        return {
            "prices": {"B95": 9.43, "B98": 10.08, "Diesel": 9.53, "GPL": 4.41}
        }


def _to_float(text: str) -> float | None:
    """Convert price string like '9.43', '9,43' to float."""
    clean = re.sub(r"[^\d.,]", "", str(text)).strip()
    if not clean:
        return None
    # Handle thousands separator: "1.234,56" (European) or "1,234.56" (US)
    if "," in clean and "." in clean:
        if clean.index(".") < clean.index(","):
            clean = clean.replace(".", "").replace(",", ".")
        else:
            clean = clean.replace(",", "")
    elif "," in clean:
        clean = clean.replace(",", ".")
    try:
        return round(float(clean), 2)
    except ValueError:
        return None


def parse_price_from_page(html: str) -> float | None:
    """
    Extract the most recent weekly fuel price (RON/L) from a
    globalpetrolprices.com country page.

    Note: the table on these pages is sorted NEWEST FIRST — the first
    data row (index 1) contains the current week's price.
    """
    soup = BeautifulSoup(html, "html.parser")

    # ── Strategy 1: Named price table (newest row = rows[1]) ──────────────
    table = (
        soup.find("table", {"id": "graphPageTable"})
        or soup.find("table", class_=re.compile(r"graph", re.I))
    )
    if table:
        rows = table.find_all("tr")
        # Rows are newest-first; try the first few data rows only
        for row in rows[1:4]:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            # Column 1 is typically the local-currency price (RON)
            for col_idx in [1, 2]:
                if col_idx >= len(cells):
                    continue
                raw = cells[col_idx].get_text(" ", strip=True)
                price = _to_float(raw)
                if price and PRICE_MIN < price < PRICE_MAX:
                    return price

    # ── Strategy 2: "RON X.XX" pattern (how the page displays prices) ────
    matches = re.findall(r"RON\s+(\d{1,2}[.,]\d{1,3})", html)
    for m in matches:
        price = _to_float(m)
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # ── Strategy 3: "X.XX RON" pattern (alternate layout) ────────────────
    matches = re.findall(r"(\d{1,2}[.,]\d{1,3})\s*RON\b", html)
    for m in matches:
        price = _to_float(m)
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # ── Strategy 4: broad number scan (last resort) ───────────────────────
    # Look for values in the realistic Romanian fuel price range
    matches = re.findall(r"\b(\d{1,2}\.\d{2})\b", html)
    candidates = [_to_float(m) for m in matches if _to_float(m) and 5.0 < (_to_float(m) or 0) < PRICE_MAX]
    if candidates:
        return candidates[0]

    return None


def fetch_price(fuel: str) -> float | None:
    url = URLS.get(fuel)
    if not url:
        return None
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return parse_price_from_page(r.text)
    except Exception as exc:
        print(f"  ⚠  {fuel}: request failed — {exc}")
        return None


def main():
    print("Fetching Romanian fuel prices from globalpetrolprices.com …\n")
    current = load_current_prices()
    prices  = dict(current.get("prices", {}))
    fetched_any = False

    for fuel in ("B95", "Diesel", "GPL"):
        price = fetch_price(fuel)
        if price:
            print(f"  ✓  {fuel}: {price:.2f} RON/L")
            prices[fuel] = price
            if fuel == "B95":
                prices["B98"] = round(price + 0.65, 2)
                print(f"  ✓  B98: {prices['B98']:.2f} RON/L  (B95 + 0.65)")
            fetched_any = True
        else:
            kept = prices.get(fuel, "—")
            print(f"  –  {fuel}: could not fetch, keeping {kept} RON/L")

    result = {
        "updated":  datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "source":   "globalpetrolprices.com" if fetched_any else "manual",
        "currency": "RON",
        "prices":   prices,
    }

    with open(PRICES_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n{'✅' if fetched_any else '⚠ '} fuel-prices.json updated")
    print(f"   updated : {result['updated']}")
    print(f"   source  : {result['source']}")
    print(f"   prices  : {json.dumps(prices)}")


if __name__ == "__main__":
    main()
