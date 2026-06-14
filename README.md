# Fuel Calculator

A progressive web app (PWA) that calculates fuel cost and range based on distance, average consumption, and price per liter. Available in English and Romanian.

## Live demo

**[mrmcb92.github.io/fuel-calculator](https://mrmcb92.github.io/fuel-calculator/)**

---

## Features

### Cost calculator
- Real-time calculation as you type — no need to press Calculate
- **Round trip** toggle — doubles the distance automatically
- **Cost / km** — displayed alongside total cost and liters needed
- **Split cost** — enter the number of passengers to see the per-person share
- Results are clickable — tap any card to copy the value to clipboard
- **Share** button — uses Web Share API on mobile, falls back to clipboard copy

### Fuel type & automatic prices
- Select fuel type (95 · 98 · Diesel · GPL) to auto-fill the price field
- Prices are fetched automatically from [globalpetrolprices.com](https://www.globalpetrolprices.com/Romania/) — no API key required
- A **freshness badge** next to the fuel type label shows when prices were last updated (e.g. `↻ updated 02 Jun 16:00`) — tap it to force a manual refresh
- Prices are cached locally for 12 hours; stale cache is refreshed on next visit
- If the fetch fails, hardcoded fallback prices are used
- Auto-fill only works in **RON** currency; a notice is shown for EUR/USD
- A disclaimer is always visible: *"Indicative prices, updated weekly — may differ slightly at the pump"*

### Range calculator
- Enter a budget, consumption and price → get maximum distance and liters needed
- Auto-fills consumption and price from the Cost tab
- **Fuel type selector** — same 95 · 98 · Diesel · GPL buttons as the Cost tab; selecting a type updates the price in both tabs simultaneously

### Vehicle profiles
- Save multiple vehicles with their average consumption and unit
- Load or delete any profile from the dropdown
- **Cloud sync via Firebase** — profiles are shared across all your devices in real time using a 6-character sync code (see [Cloud sync](#cloud-sync))

### History
- Last 10 calculations saved automatically (localStorage)
- Shows distance, liters, total cost, and per-person cost if applicable
- Clear history button

### Settings & UX
- **Consumption unit** selector: L/100km · km/L · mpg (US)
- **Currency** selector: RON · EUR · USD
- **EN / RO** language toggle, preference persisted
- **Reset** button clears all fields and results
- Enter key submits from any input field
- `inputmode="decimal"` — numeric keyboard on mobile
- Saves last-used values and restores them on next visit

### PWA
- Installable on Android and iOS as a standalone app
- **Install app** button — an in-app guide for "Add to Home Screen": triggers the native install prompt on Android/Chrome, and shows step-by-step instructions on iOS (where browsers don't expose a prompt). Hidden automatically once the app is installed.
- Works offline after first visit (Service Worker, stale-while-revalidate)
- Maskable icon support for Android home screen

---

## Automatic price updates

Fuel prices for Romania are scraped weekly from [globalpetrolprices.com](https://www.globalpetrolprices.com/Romania/) and stored in `fuel-prices.json` in the repository. A GitHub Actions workflow runs every **Monday at 14:00 UTC** (16:00 Romania time) — after the source site publishes its weekly update.

```
.github/workflows/update-fuel-prices.yml   # Cron job: every Monday 14:00 UTC
scripts/fetch_fuel_prices.py               # Python scraper
fuel-prices.json                           # Published prices (served via GitHub raw CDN)
```

The app fetches `fuel-prices.json` directly from the GitHub raw CDN (`raw.githubusercontent.com`) — no backend, no API key, free forever.

**Price sources per fuel type:**

| Fuel | Source | Note |
|------|--------|-------|
| 95 (gasoline) | globalpetrolprices.com | scraped directly |
| 98 (premium) | computed | B95 + 0.65 RON/L |
| Diesel | globalpetrolprices.com | scraped directly |
| GPL | globalpetrolprices.com | scraped directly |

> Prices are **indicative** and reflect the national average published by globalpetrolprices.com. They may differ slightly from prices at your local pump.

---

## Cloud sync

Vehicle profiles are stored in Firebase Firestore and synced in real time across all devices.

**How to link two devices:**
1. Open the app on **Device A** → tap the **⇄** button next to the vehicle dropdown
2. Copy the 6-character sync code (e.g. `DL7R64`)
3. Open the app on **Device B** → tap **⇄** → paste the code → tap **Sync**

Both devices now share the same profile list. Any profile saved or deleted on one device appears on the other within seconds.

**Self-hosting / configuring Firebase:**

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (Databases & Storage → Firestore → Start in test mode)
3. Register a web app (Settings → General → Your apps → `</>`)
4. Copy the `firebaseConfig` values into `firebase-config.js`:

```js
const FIREBASE_CONFIG = {
  apiKey:            "...",
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "..."
};
```

Without a valid config the app falls back to localStorage-only profiles (single-device mode).

---

## Usage

| Tab | Input | Output |
|-----|-------|--------|
| Cost | Distance, consumption, fuel type / price | Liters · Total cost · Cost/km · Per person |
| Range | Budget, consumption, fuel type / price | Max distance · Liters needed |

**Accepted ranges:**

| Field | Range |
|-------|-------|
| Distance | 0.1 – 50,000 km |
| Consumption | 0.1 – 999 (any unit) |
| Fuel price | 0.1 – 1,000 |
| Passengers | 1 – 20 |

---

## Project structure

```
fuel-calculator/
├── index.html                              # App structure and markup
├── style.css                               # Dark theme, layout, animations
├── app.js                                  # Calculation logic, Firebase sync, i18n, fuel prices
├── firebase-config.js                      # Firebase credentials (fill in your own)
├── fuel-prices.json                        # Weekly-updated Romanian fuel prices (RON/L)
├── sw.js                                   # Service Worker (cache + offline)
├── manifest.json                           # PWA configuration
├── scripts/
│   └── fetch_fuel_prices.py                # Scraper: fetches prices from globalpetrolprices.com
├── .github/workflows/
│   └── update-fuel-prices.yml              # GitHub Actions cron: every Monday 14:00 UTC
├── icon-nou-192.png
└── icon-nou-512.png
```

---

## Technologies

- Vanilla HTML / CSS / JavaScript — no build step, no framework
- **Firebase Firestore** (compat SDK v10) for cloud profile sync
- **GitHub Actions** + **Python** (`requests` + `BeautifulSoup4`) for weekly price scraping
- **GitHub raw CDN** for zero-cost, CORS-friendly JSON delivery
- Web App Manifest + Service Worker for PWA installation and offline use
- `Intl.NumberFormat` for locale-aware number formatting
- Web Share API for native share on mobile
- Clipboard API for copy-on-tap
- Google Fonts: Syne + DM Mono

## Local development

No build step required. Serve the project root with any HTTP server:

```bash
python3 -m http.server 3000
# or
npx serve .
```

To run the price scraper manually:

```bash
pip install requests beautifulsoup4
python3 scripts/fetch_fuel_prices.py
```

> **Note:** The Service Worker only activates over HTTPS or on `localhost`. It will not work over `file://`.

---

# Calculator Combustibil

O aplicație web progresivă (PWA) care calculează costul unui drum și autonomia în funcție de distanță, consum mediu și prețul per litru. Disponibilă în română și engleză.

## Demo

**[mrmcb92.github.io/fuel-calculator](https://mrmcb92.github.io/fuel-calculator/)**

---

## Funcționalități

### Calculator cost
- Calcul în timp real la fiecare tastare — fără buton de confirmare obligatoriu
- **Tur-retur** — dublează distanța automat
- **Cost / km** — afișat alături de costul total și litri necesari
- **Împarte costul** — introdu numărul de pasageri pentru a vedea suma per persoană
- Click pe orice card de rezultat copiază valoarea în clipboard
- Buton **Distribuie** — Web Share API pe mobil, fallback pe clipboard

### Tip combustibil & prețuri automate
- Selectează tipul de combustibil (95 · 98 · Diesel · GPL) pentru completarea automată a prețului
- Prețurile sunt preluate automat de pe [globalpetrolprices.com](https://www.globalpetrolprices.com/Romania/) — fără cheie API
- Un **indicator de prospețime** lângă eticheta tipului de combustibil arată când au fost actualizate prețurile (ex: `↻ actualizat 02 iun 16:00`) — apasă pe el pentru refresh manual
- Prețurile sunt stocate local în cache timp de 12 ore; cache-ul expirat se reîmprospătează la vizita următoare
- Dacă preluarea eșuează, se folosesc prețuri de rezervă predefinite
- Completarea automată funcționează doar în moneda **RON**; pentru EUR/USD se afișează o notificare
- Un disclaimer este mereu vizibil: *„Prețuri orientative, actualizate săptămânal — pot diferi ușor față de pompă"*

### Calculator autonomie
- Introdu bugetul, consumul și prețul → afli distanța maximă și litrii necesari
- Preia automat consumul și prețul din tab-ul Cost
- **Selector tip combustibil** — aceleași butoane 95 · 98 · Diesel · GPL ca în tab-ul Cost; selectarea unui tip actualizează prețul în ambele tab-uri simultan

### Profiluri vehicule
- Salvează mai multe vehicule cu consumul și unitatea lor
- Încarcă sau șterge orice profil din dropdown
- **Sincronizare cloud prin Firebase** — profilurile se partajează între toate dispozitivele în timp real printr-un cod de 6 caractere (vezi [Sincronizare cloud](#sincronizare-cloud-1))

### Istoric
- Ultimele 10 calcule salvate automat (localStorage)
- Afișează distanța, litrii, costul total și suma per persoană dacă e cazul
- Buton de ștergere istoric

### Setări & UX
- **Unitate consum**: L/100km · km/L · mpg (US)
- **Monedă**: RON · EUR · USD
- Buton limbă **RO / EN**, preferința se salvează
- Buton **Resetează** — șterge toate câmpurile și rezultatele
- Tasta Enter trimite din orice câmp
- `inputmode="decimal"` — tastatură numerică pe mobil
- Salvează ultimele valori și le restaurează la următoarea vizită

### PWA
- Instalabilă pe Android și iOS ca aplicație standalone
- Buton **Instalează aplicația** — un ghid în aplicație pentru „Adaugă la ecranul principal": declanșează promptul nativ de instalare pe Android/Chrome și afișează instrucțiuni pas cu pas pe iOS (unde browserele nu oferă un prompt). Se ascunde automat după instalare.
- Funcționează offline după prima vizită (Service Worker)
- Suport iconiță maskable pentru ecranul de pornire Android

---

## Actualizare automată prețuri

Prețurile combustibililor pentru România sunt preluate săptămânal de pe [globalpetrolprices.com](https://www.globalpetrolprices.com/Romania/) și stocate în fișierul `fuel-prices.json` din repository. Un workflow GitHub Actions rulează în fiecare **luni la 14:00 UTC** (16:00 ora României) — după ce site-ul sursă publică actualizarea săptămânală.

```
.github/workflows/update-fuel-prices.yml   # Cron job: în fiecare luni la 14:00 UTC
scripts/fetch_fuel_prices.py               # Scraper Python
fuel-prices.json                           # Prețurile publicate (servite prin GitHub raw CDN)
```

Aplicația preia `fuel-prices.json` direct din CDN-ul raw GitHub (`raw.githubusercontent.com`) — fără backend, fără cheie API, gratuit permanent.

**Surse prețuri per tip combustibil:**

| Combustibil | Sursă | Observație |
|-------------|-------|------------|
| 95 (benzină) | globalpetrolprices.com | preluat direct |
| 98 (premium) | calculat | B95 + 0,65 RON/L |
| Diesel | globalpetrolprices.com | preluat direct |
| GPL | globalpetrolprices.com | preluat direct |

> Prețurile sunt **orientative** și reflectă media națională publicată de globalpetrolprices.com. Pot diferi ușor față de prețurile de la pompa din apropierea ta.

---

## Sincronizare cloud

Profilurile vehiculelor sunt stocate în Firebase Firestore și sincronizate în timp real pe toate dispozitivele.

**Cum conectezi două dispozitive:**
1. Deschide aplicația pe **Dispozitiv A** → apasă butonul **⇄** din dreptul dropdown-ului de vehicule
2. Copiază codul de 6 caractere (ex: `DL7R64`)
3. Deschide aplicația pe **Dispozitiv B** → apasă **⇄** → lipești codul → apasă **Sincronizează**

Ambele dispozitive partajează aceeași listă de profiluri. Orice profil salvat sau șters pe un dispozitiv apare pe celălalt în câteva secunde.

---

## Structura proiectului

```
fuel-calculator/
├── index.html                              # Structura aplicației
├── style.css                               # Temă dark, layout, animații
├── app.js                                  # Logica de calcul, sync Firebase, i18n, prețuri combustibili
├── firebase-config.js                      # Credențiale Firebase (completează cu ale tale)
├── fuel-prices.json                        # Prețuri combustibili România, actualizate săptămânal (RON/L)
├── sw.js                                   # Service Worker (cache + offline)
├── manifest.json                           # Configurare PWA
├── scripts/
│   └── fetch_fuel_prices.py                # Scraper: preia prețurile de pe globalpetrolprices.com
├── .github/workflows/
│   └── update-fuel-prices.yml              # Cron GitHub Actions: în fiecare luni la 14:00 UTC
├── icon-nou-192.png
└── icon-nou-512.png
```

---

## Tehnologii

- HTML / CSS / JavaScript vanilla — fără build, fără framework
- **Firebase Firestore** (compat SDK v10) pentru sincronizare profiluri
- **GitHub Actions** + **Python** (`requests` + `BeautifulSoup4`) pentru preluarea automată săptămânală a prețurilor
- **GitHub raw CDN** pentru livrare JSON gratuită și compatibilă CORS
- Web App Manifest + Service Worker pentru instalare PWA și funcționare offline
- `Intl.NumberFormat` pentru formatare numerică în format românesc
- Web Share API pentru share nativ pe mobil
- Clipboard API pentru copiere la tap
- Google Fonts: Syne + DM Mono

## Instalare locală

Nu necesită build. Servește directorul rădăcină cu orice server HTTP local:

```bash
python3 -m http.server 3000
# sau
npx serve .
```

Pentru a rula scraper-ul de prețuri manual:

```bash
pip install requests beautifulsoup4
python3 scripts/fetch_fuel_prices.py
```

> **Notă:** Service Worker-ul funcționează doar pe HTTPS sau pe `localhost`. Nu se activează pe `file://`.
