# Optimizare Ergonomică și Vizibilitate Buton Instalare Aplicație (PWA)

Soluție completă pentru problema de vizibilitate a butonului de instalare pe smartphone-uri (Android, iOS) și desktop, prin adăugarea unui banner ergonomic dedicat poziționat sub antet, alături de optimizarea butonului din antet pentru a preveni decuparea vizuală pe ecrane înguste.

### User Review & Critical Decisions

> [!IMPORTANT]
> Deciziile confirmate în etapa de consultare:
> - **Amplasare pe mobil**: **Banner dedicat sub antet** (vizibil instantaneu, ergonomic, cu suprafață mare de atingere de 48px) **plus buton compact în antet** (iconiță stilizată fără text lung, care nu mai iese din ecran).
> - **Comportament banner**: **Cu buton de închidere temporară (X)** și memorare în `localStorage` (`comb_install_banner_dismissed`), permițând redeschiderea oricând din butonul compact din antet.
> - **Compatibilitate multi-platformă**: Suport dedicat pentru promptul nativ pe Android/Chromium, ghid pas-cu-pas dedicat pentru iOS Safari ("Adaugă pe ecranul principal"), și instalare pe Desktop (Chrome/Edge).

---

### 1. Overview & Core Concept

- **Problema identificată**: Pe ecranele telefoanelor mobile (lățime 360px–412px), numărul de butoane din antet (Sincronizare Cloud, Comutator Temă Luminos/Întunecat, Selector Limbă) combinat cu textul lung al butonului de instalare („Instalează aplicația”) depășește lățimea disponibilă. Ca urmare, butonul de instalare era decupat aproape în totalitate în afara marginii din dreapta a ecranului.
- **Soluția**:
  1. **Banner ergonomic dedicat (`#pwa-install-banner`)**: Plasat sub antet, evidențiat vizual cu contrast plăcut în stilul aplicației, afișând iconița aplicației, beneficiile („Acces rapid & mod offline”) și un buton proeminent „Instalează” (touch target confortabil de 44px–48px), plus buton discret de închidere (X).
  2. **Optimizare buton antet (`#btn-install`)**: Reconfigurarea stilului pe mobil pentru a funcționa compact (iconiță vizibilă cu fundal accent sau etichetă scurtă), cu `flex-shrink: 0` și gestionare inteligentă a spațiului în antet, împiedicând orice revărsare (overflow-x).
  3. **Comportament inteligent multi-sistem**: Dacă aplicația rulează deja ca PWA standalone (`display-mode: standalone`), atât bannerul cât și butonul se ascund automat. Pe Android se apelează promptul nativ `beforeinstallprompt`, iar pe iOS Safari / browsere fără suport de instalare directă se deschide modalul cu ghid pas-cu-pas adaptat sistemului de operare.

---

### 2. User Experience & Visual Design

- **Fluxul utilizatorului**:
  1. La deschiderea aplicației în browser (pe Android, iOS sau Desktop), utilizatorul vede imediat sub antet un card atrăgător:
     - Iconița verde Fuel Calculator
     - Text titlu: *Instalează aplicația* (RO) / *Install app* (EN)
     - Subtitlu: *Acces rapid pe ecran și mod offline* (RO) / *Quick home screen & offline access* (EN)
     - Buton principal de acțiune: *Instalează* (RO) / *Install* (EN)
     - Buton de închidere [✕] în colțul drept
  2. La apăsarea butonului „Instalează”:
     - **Pe Android / Chrome desktop**: Se deschide dialogul nativ al browserului pentru adăugarea pe ecranul de pornire.
     - **Pe iOS Safari**: Se deschide ghidul vizual cu pașii preciși (Apasă butonul de partajare $\rightarrow$ Adaugă pe ecranul principal).
  3. Dacă utilizatorul închide bannerul cu [✕], bannerul dispare discret, dar butonul compact din antet rămâne disponibil permanent pentru acces ulterior.
  4. Odată instalată aplicația (eveniment `appinstalled` sau mod `standalone`), toate elementele de instalare se ascund automat, păstrând interfața curată.

- **Design vizual și stilizare conform design system-ului existent**:
  - Fundal banner: Suprafață subtilă integrată cu tema întunecată/luminoasă (`var(--bg-card-subtle)` cu bordură fină `var(--border-subtle)` și accent primar smarald `var(--accent-primary)`).
  - Buton CTA în banner: Păstrează stilul verde distinctiv (`var(--accent-primary)`) cu text alb lizibil și feedback tactil la atingere (`active:scale-[0.98]`).
  - Buton antet: Format compact pe mobil (iconiță descărcare/instalare cu touch target confortabil), integrat armonios cu butoanele de sync, temă și limbă.

---

### 3. Key Product Decisions & Trade-Offs

- **Decizia 1: Banner dedicat sub antet + buton compact în antet**
  - *Abordare*: Combinarea celor două elemente oferă vizibilitate maximă și ergonomie pentru prima interacțiune (bannerul mare), fără a aglomera sau rupe bara de antet, menținând în același timp o cale permanentă de acces în antet.
  - *Avantaje*: Elimină complet decuparea observată în screenshot și oferă o țintă tactilă de dimensiuni mari conform standardelor mobile (min. 44px).
- **Decizia 2: Gestionarea persistenței și ascunderii**
  - *Abordare*: Stocarea stării de închidere în `localStorage` (`comb_install_banner_dismissed`). Dacă este închis, bannerul nu deranjează utilizatorul la fiecare reîmprospătare, însă butonul din antet rămâne mereu la dispoziție dacă se răzgândește.
- **Decizia 3: Text scurt și responsive în antet**
  - *Abordare*: În antet, pe ecrane mici (< 600px), se ascunde textul lung „Instalează aplicația” și se păstrează doar iconița stilizată de instalare sau etichetă compactă, permițând tuturor celor 4 butoane din antet să coexiste fără overflow.

---

### 4. Arhitectură Tehnică & Diagrame

```
┌─────────────────────────────────────────────────────────────┐
│                       APP HEADER                            │
│  [Logo + Fuel Calculator]    [Sync] [Theme] [RO] [Install]  │
│                                                   (Compact) │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              ERGONOMIC PWA INSTALL BANNER                   │
│  ┌───┐  Instalează aplicația                     [ X ]      │
│  │   │  Acces rapid de pe ecran și offline                  │
│  └───┘  [ ⬇ Instalează ]                                    │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [Android / Desktop]               [iOS Safari]
        Native PWA Prompt             Step-by-Step Modal
      (beforeinstallprompt)        (Share -> Add to Screen)
```

#### Modificări planificate în fișiere:
1. `index.html`:
   - Adăugare container `#pwa-install-banner` poziționat ergonomic sub `<header class="app-header">` și deasupra tab-urilor/conținutului principal.
   - Păstrarea și optimizarea `#btn-install` din antet.
2. `style.css`:
   - Stiluri pentru `#pwa-install-banner` (desktop & mobile, suport temă light/dark, touch targets $\ge 44$px).
   - Corecție CSS pentru `.header-actions` și `.install-btn` pe mobil (`@media (max-width: 767px)`) pentru a garanta că nicio acțiune nu este decupată sau ascunsă în afara ecranului.
3. `app.js`:
   - Integrare logică pentru afișarea/închiderea bannerului (`initInstallBanner`, `dismissInstallBanner`, `handleInstallClick`).
   - Sincronizare traduceri (RO/EN) pentru textele noului banner.
   - Asigurare compatibilitate completă cu Android, iOS Safari și Desktop.
