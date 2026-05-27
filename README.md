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

### Range calculator
- Enter a budget, consumption and price → get maximum distance and liters needed
- Auto-fills consumption and price from the Cost tab

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
- Works offline after first visit (Service Worker, stale-while-revalidate)
- Maskable icon support for Android home screen

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
| Cost | Distance, consumption, price | Liters · Total cost · Cost/km · Per person |
| Range | Budget, consumption, price | Max distance · Liters needed |

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
├── index.html           # App structure and markup
├── style.css            # Dark theme, layout, animations
├── app.js               # Calculation logic, Firebase sync, i18n
├── firebase-config.js   # Firebase credentials (fill in your own)
├── sw.js                # Service Worker (cache + offline)
├── manifest.json        # PWA configuration
├── icon-nou-192.png
└── icon-nou-512.png
```

---

## Technologies

- Vanilla HTML / CSS / JavaScript — no build step, no framework
- **Firebase Firestore** (compat SDK v10) for cloud profile sync
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

### Calculator autonomie
- Introdu bugetul, consumul și prețul → afli distanța maximă și litrii necesari
- Preia automat consumul și prețul din tab-ul Cost

### Profiluri vehicule
- Salvează mai multe vehicule cu consumul și unitatea lor
- Încarcă sau șterge orice profil din dropdown
- **Sincronizare cloud prin Firebase** — profilurile se partajează între toate dispozitivele în timp real printr-un cod de 6 caractere (vezi [Sincronizare cloud](#sincronizare-cloud))

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
- Funcționează offline după prima vizită (Service Worker)
- Suport iconiță maskable pentru ecranul de pornire Android

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
├── index.html           # Structura aplicației
├── style.css            # Temă dark, layout, animații
├── app.js               # Logica de calcul, sync Firebase, i18n
├── firebase-config.js   # Credențiale Firebase (completează cu ale tale)
├── sw.js                # Service Worker (cache + offline)
├── manifest.json        # Configurare PWA
├── icon-nou-192.png
└── icon-nou-512.png
```

---

## Tehnologii

- HTML / CSS / JavaScript vanilla — fără build, fără framework
- **Firebase Firestore** (compat SDK v10) pentru sincronizare profiluri
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

> **Notă:** Service Worker-ul funcționează doar pe HTTPS sau pe `localhost`. Nu se activează pe `file://`.
