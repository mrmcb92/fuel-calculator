#!/usr/bin/env python3
"""
Fetches current Romanian fuel prices and writes them to fuel-prices.json
in the project root.

Primary source : peco-online.ro/minime.php — real station prices, updated daily.
Fallback source: globalpetrolprices.com — national weekly average.

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
    "Accept-Language": "en-US,en;q=0.9,ro;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── Primary: peco-online.ro (real station prices, updated daily) ──────────────
PECO_URL = "https://www.peco-online.ro/minime.php"

# ── Fallback: globalpetrolprices.com (national average, weekly) ───────────────
GPP_URLS = {
    "B95":    "https://www.globalpetrolprices.com/Romania/gasoline_prices/",
    "Diesel": "https://www.globalpetrolprices.com/Romania/diesel_prices/",
    "GPL":    "https://www.globalpetrolprices.com/Romania/lpg_prices/",
}

# Sanity bounds for Romanian fuel prices (RON/L)
PRICE_MIN = 2.0
PRICE_MAX = 30.0

# Octane premium: 98 is sold at roughly B95 + 0.65 RON/L
B98_PREMIUM = 0.65


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


def _avg(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


# ── peco-online.ro ────────────────────────────────────────────────────────────

def fetch_peco_prices() -> dict | None:
    """
    Scrape peco-online.ro/minime.php — a server-rendered HTML table of the
    cheapest station prices in each county-seat city, updated daily.

    Table layout:
      <th>Oras</th><th>Benzina</th><th>Motorina</th><th>GPL</th>
      <tr><td class="text-left">Bucuresti</td>
          <td class="pret">8.72</td>   # Benzina (95)
          <td class="pret">9.08</td>   # Motorina (Diesel)
          <td class="pret">4.42</td>   # GPL
      </tr> ...

    Returns the average across listed cities: {B95, Diesel, GPL}, or None.
    """
    try:
        r = requests.get(PECO_URL, headers=HEADERS, timeout=20)
        r.raise_for_status()
    except Exception as exc:
        print(f"  ⚠  peco-online: request failed — {exc}")
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    cols = {"B95": [], "Diesel": [], "GPL": []}

    for row in soup.find_all("tr"):
        cells = row.find_all("td", class_="pret")
        if len(cells) != 3:
            continue
        b95    = _to_float(cells[0].get_text())
        diesel = _to_float(cells[1].get_text())
        gpl    = _to_float(cells[2].get_text())
        if b95    and PRICE_MIN < b95    < PRICE_MAX: cols["B95"].append(b95)
        if diesel and PRICE_MIN < diesel < PRICE_MAX: cols["Diesel"].append(diesel)
        if gpl    and PRICE_MIN < gpl    < PRICE_MAX: cols["GPL"].append(gpl)

    out = {k: _avg(v) for k, v in cols.items() if v}
    return out or None


# ── globalpetrolprices.com (fallback) ─────────────────────────────────────────

def parse_gpp_page(html: str) -> float | None:
    """
    Extract the current fuel price (RON/L) from a globalpetrolprices.com page.
    The meta tags contain a historical average that must be ignored; we target
    the "current ... price in Romania is RON X.XX" body sentence.
    """
    m = re.search(
        r"current\s+\w+\s+price\s+in\s+Romania\s+is\s+RON\s+(\d{1,2}[.,]\d{2,3})",
        html, re.IGNORECASE
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    m = re.search(
        r"current\s+price\b.{0,80}RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter",
        html, re.IGNORECASE | re.DOTALL
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    m = re.search(
        r"RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter.{0,60}updated\s+on",
        html, re.IGNORECASE | re.DOTALL
    )
    if m:
        price = _to_float(m.group(1))
        if price and PRICE_MIN < price < PRICE_MAX:
            return price

    matches = re.findall(r"RON\s+(\d{1,2}[.,]\d{2,3})\s+per\s+liter", html, re.IGNORECASE)
    candidates = [p for raw in matches if (p := _to_float(raw)) and PRICE_MIN < p < PRICE_MAX]
    return max(candidates) if candidates else None


def fetch_gpp_price(fuel: str) -> float | None:
    url = GPP_URLS.get(fuel)
    if not url:
        return None
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return parse_gpp_page(r.text)
    except Exception as exc:
        print(f"  ⚠  GPP {fuel}: request failed — {exc}")
        return None


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("Fetching Romanian fuel prices …\n")
    current = load_current_prices()
    prices  = dict(current.get("prices", {}))

    # 1) Primary source: peco-online.ro (daily, real station prices)
    peco = fetch_peco_prices() or {}
    if peco:
        print("  Source: peco-online.ro (cheapest stations, daily avg)")
        for fuel, val in peco.items():
            print(f"  ✓  {fuel}: {val:.2f} RON/L")

    # 2) Fallback: globalpetrolprices.com for any fuel peco didn't provide
    used_gpp = False
    for fuel in ("B95", "Diesel", "GPL"):
        if fuel in peco:
            prices[fuel] = peco[fuel]
            continue
        price = fetch_gpp_price(fuel)
        if price:
            print(f"  ✓  {fuel}: {price:.2f} RON/L  (fallback: globalpetrolprices.com)")
            prices[fuel] = price
            used_gpp = True
        else:
            print(f"  –  {fuel}: could not fetch, keeping {prices.get(fuel, '—')} RON/L")

    # 98 is computed from 95 (not published separately by either source)
    if "B95" in prices:
        prices["B98"] = round(prices["B95"] + B98_PREMIUM, 2)
        print(f"  ✓  B98: {prices['B98']:.2f} RON/L  (B95 + {B98_PREMIUM})")

    # Source label
    if peco and used_gpp:
        source = "peco-online.ro + globalpetrolprices.com"
    elif peco:
        source = "peco-online.ro"
    elif used_gpp:
        source = "globalpetrolprices.com"
    else:
        source = "manual"

    result = {
        "updated":  datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "source":   source,
        "currency": "RON",
        "prices":   prices,
    }

    with open(PRICES_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n{'✅' if source != 'manual' else '⚠ '} fuel-prices.json updated")
    print(f"   updated : {result['updated']}")
    print(f"   source  : {result['source']}")
    print(f"   prices  : {json.dumps(prices)}")


if __name__ == "__main__":
    main()
