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
}

URLS = {
    "B95":    "https://www.globalpetrolprices.com/Romania/gasoline_prices/",
    "Diesel": "https://www.globalpetrolprices.com/Romania/diesel_prices/",
    "GPL":    "https://www.globalpetrolprices.com/Romania/lpg_prices/",
}

# Sanity range for Romanian fuel prices (RON/L)
PRICE_MIN = 1.0
PRICE_MAX = 30.0


def load_current_prices():
    try:
        with open(PRICES_FILE) as f:
            return json.load(f)
    except Exception:
        return {
            "prices": {"B95": 7.20, "B98": 7.85, "Diesel": 7.00, "GPL": 3.50}
        }


def parse_price_from_page(html: str) -> float | None:
    """
    GlobalPetrolPrices.com shows prices in a table (#graphPageTable).
    The most recent week is the last row; price column is index 1.
    Falls back to a regex search if the table structure changes.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Strategy 1: named table with rows
    table = soup.find("table", {"id": "graphPageTable"})
    if not table:
        table = soup.find("table", class_=re.compile(r"graph", re.I))

    if table:
        rows = table.find_all("tr")
        # Walk from the bottom (most recent) to find a numeric price
        for row in reversed(rows[1:]):
            cells = row.find_all("td")
            if len(cells) >= 2:
                raw = cells[1].get_text(" ", strip=True)
                price = _to_float(raw)
                if price and PRICE_MIN < price < PRICE_MAX:
                    return price

    # Strategy 2: regex over the full page text looking for "X.XX RON"
    matches = re.findall(r"(\d{1,2}[.,]\d{1,3})\s*RON", html)
    for m in matches:
        price = _to_float(m)
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    # Strategy 3: any decimal number that looks like a Romanian fuel price
    # (between 5 and 15 RON/L is a reasonable modern range)
    matches = re.findall(r"\b([5-9]\.\d{2}|1[0-4]\.\d{2})\b", html)
    if matches:
        price = _to_float(matches[0])
        if price:
            return price

    return None


def _to_float(text: str) -> float | None:
    """Convert price string like '7.20', '7,20', '7.200' to float."""
    clean = re.sub(r"[^\d.,]", "", text).strip()
    # Handle Romanian thousands separator: "1.234,56" -> European format
    if "," in clean and "." in clean:
        if clean.index(".") < clean.index(","):
            # 1.234,56 -> 1234.56
            clean = clean.replace(".", "").replace(",", ".")
        else:
            # 1,234.56 (US format)
            clean = clean.replace(",", "")
    elif "," in clean:
        clean = clean.replace(",", ".")
    try:
        return round(float(clean), 2)
    except ValueError:
        return None


def fetch_price(fuel: str) -> float | None:
    url = URLS.get(fuel)
    if not url:
        return None
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        price = parse_price_from_page(r.text)
        return price
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
        "updated": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "source":  "globalpetrolprices.com" if fetched_any else "manual",
        "currency": "RON",
        "prices": prices,
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
