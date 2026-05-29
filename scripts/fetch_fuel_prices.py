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
    Extract the current fuel price (RON/L) from a globalpetrolprices.com page.

    The page body contains:
      "The current gasoline price in Romania is RON 9.43 per liter..."
    The meta tags contain the historical average ("RON 6.13 per liter") which
    must be ignored. We search specifically for the "current price" sentence.
    """

    # ── Strategy 1: exact "current ... price in Romania is RON X.XX" ─────
    # Matches the body paragraph, NOT the meta-tag average.
    m = re.search(
        r"current\s+\w+\s+price\s+in\s+Romania\s+is\s+RON\s+(\d{1,2}[.,]\d{2,3})",
        html, re.IGNORECASE
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # ── Strategy 2: "current price ... RON X.XX per liter" (alt wording) ─
    m = re.search(
        r"current\s+price\b.{0,80}RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter",
        html, re.IGNORECASE | re.DOTALL
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # ── Strategy 3: "updated on DD-Mon-YYYY" → price in same paragraph ───
    # Finds the sentence that ends with "updated on <date>" — that's current.
    m = re.search(
        r"RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter.{0,60}updated\s+on",
        html, re.IGNORECASE | re.DOTALL
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # ── Strategy 4: last-resort — all "RON X.XX per liter", take highest ─
    # The current price is typically the highest recent value.
    matches = re.findall(r"RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter", html, re.IGNORECASE)
    candidates = []
    for raw in matches:
        price = _to_float(raw)
        if price and PRICE_MIN < price < PRICE_MAX:
            candidates.append(price)
    if candidates:
        return max(candidates)   # highest = most recent in an upward trend

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
