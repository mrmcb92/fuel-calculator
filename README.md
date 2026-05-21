# Fuel Calculator

A progressive web app (PWA) that calculates fuel consumption and estimated trip cost based on distance, average consumption, and price per liter. Available in English and Romanian.

## Features

- Instant calculation of liters needed and total cost
- Automatically saves the last entered values (localStorage)
- Works offline after the first visit (Service Worker)
- Can be installed on a smartphone as a native app (PWA)
- Input validation with realistic limits per field
- EN / RO language toggle, preference saved between sessions
- Dark interface, optimized for mobile

## Usage

Enter the three values and press **Calculate**:

| Field | Description | Accepted range |
|---|---|---|
| Distance | Kilometers to travel | 0.1 – 50,000 km |
| Avg. consumption | Liters per 100 km | 2 – 50 L/100km |
| Fuel price | RON per liter | 0.1 – 100 RON/L |

## Project structure

```
calculator-combustibil/
├── index.html       # Page structure
├── style.css        # Design and dark theme
├── app.js           # Calculation logic, validation, i18n
├── sw.js            # Service Worker (cache + offline)
├── manifest.json    # PWA configuration
├── icon-nou-192.png
└── icon-nou-512.png
```

## Technologies

- Vanilla HTML, CSS, JavaScript — no external dependencies
- Web App Manifest for PWA installation
- Service Worker with stale-while-revalidate strategy
- `Intl.NumberFormat` for Romanian number formatting
- Google Fonts: Syne + DM Mono

## Local setup

No build step required. Serve the files with any local HTTP server:

```bash
npx serve .
```

or use the **Live Server** extension in VS Code.

> **Note:** The Service Worker only works over HTTPS or on `localhost`. It will not activate over `file://`.

## Live demo

`https://mrmcb92.github.io/fuel-calculator/`

---

# Calculator Combustibil

O aplicație web progresivă (PWA) care calculează consumul de combustibil și costul estimat al unui drum, pe baza distanței, consumului mediu și prețului per litru. Disponibilă în engleză și română.

## Funcționalități

- Calcul instant al litrilor necesari și al costului total
- Salvează automat ultimele valori introduse (localStorage)
- Funcționează offline după prima vizită (Service Worker)
- Poate fi instalată pe telefon ca aplicație nativă (PWA)
- Validare cu praguri realiste pentru fiecare câmp
- Buton de schimbare limbă EN / RO, preferința se salvează între sesiuni
- Interfață dark, optimizată pentru mobil

## Utilizare

Introdu cele trei valori și apasă **Calculează**:

| Câmp | Descriere | Interval acceptat |
|---|---|---|
| Distanță | Kilometri de parcurs | 0.1 – 50.000 km |
| Consum mediu | Litri la 100 km | 2 – 50 L/100km |
| Preț combustibil | Lei per litru | 0.1 – 100 lei/L |

## Structura proiectului

```
calculator-combustibil/
├── index.html       # Structura paginii
├── style.css        # Design și temă dark
├── app.js           # Logica de calcul, validare, i18n
├── sw.js            # Service Worker (cache + offline)
├── manifest.json    # Configurare PWA
├── icon-nou-192.png
└── icon-nou-512.png
```

## Tehnologii

- HTML, CSS, JavaScript vanilla — fără dependințe externe
- Web App Manifest pentru instalare ca PWA
- Service Worker cu strategie stale-while-revalidate
- `Intl.NumberFormat` pentru formatare în format românesc
- Google Fonts: Syne + DM Mono

## Instalare locală

Nu necesită build. Poți servi fișierele cu orice server HTTP local:

```bash
npx serve .
```

sau cu extensia **Live Server** din VS Code.

> **Notă:** Service Worker-ul funcționează doar pe HTTPS sau pe `localhost`. Pe `file://` nu se activează.

## Demo

`https://mrmcb92.github.io/fuel-calculator/`
