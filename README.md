[README.md](https://github.com/user-attachments/files/27812721/README.md)
# Calculator Combustibil

O aplicație web progresivă (PWA) care calculează consumul de combustibil și costul estimat al unui drum, pe baza distanței, consumului mediu și prețului per litru.

## Funcționalități

- Calcul instant al litrilor necesari și al costului total
- Salvează automat ultimele valori introduse (localStorage)
- Funcționează offline după prima vizită (Service Worker)
- Poate fi instalată pe telefon ca aplicație nativă (PWA)
- Validare cu praguri realiste pentru fiecare câmp
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
├── index.html      # Structura paginii
├── style.css       # Design și temă dark
├── app.js          # Logica de calcul și validare
├── sw.js           # Service Worker (cache + offline)
├── manifest.json   # Configurare PWA
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

Nu necesită build sau server special. Poți servi fișierele cu orice server HTTP local, de exemplu:

```bash
npx serve .
```

sau cu extensia **Live Server** din VS Code.

> **Notă:** Service Worker-ul funcționează doar pe HTTPS sau pe `localhost`. Pe `file://` nu se activează.

## Demo

Disponibil la: `https://mrmcb92.github.io/calculator-combustibil/`
