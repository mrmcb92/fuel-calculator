const LIMITE = {
  distanta: { min: 0.1, max: 50000 },
  consum:   { min: 2,   max: 50   },
  pret:     { min: 0.1, max: 100  }
};

const TRADUCERI = {
  en: {
    titlu:       'Fuel Calculator',
    subtitlu:    'Estimate the cost before or after your trip',
    distanta:    'Distance',
    consum:      'Avg. consumption',
    pret:        'Fuel price',
    buton:       'Calculate',
    butonLoading:'Calculating...',
    labelLitri:  'Fuel needed',
    labelCost:   'Total cost',
    unitLitri:   'liters',
    unitCost:    'RON',
    eroareNaN:   (camp) => `"${camp}" is not a valid number.`,
    eroareInterval: (camp, min, max) => `"${camp}" must be between ${min} and ${max}.`,
  },
  ro: {
    titlu:       'Calculator Combustibil',
    subtitlu:    'Estimează costul înainte sau după drum',
    distanta:    'Distanță',
    consum:      'Consum mediu',
    pret:        'Preț combustibil',
    buton:       'Calculează',
    butonLoading:'Se calculează...',
    labelLitri:  'Combustibil',
    labelCost:   'Cost total',
    unitLitri:   'litri',
    unitCost:    'lei',
    eroareNaN:   (camp) => `Câmpul „${camp}" nu este valid.`,
    eroareInterval: (camp, min, max) => `„${camp}" trebuie să fie între ${min} și ${max}.`,
  }
};

let limbaActiva = localStorage.getItem('comb_limba') || 'en';

const fmt = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function t() {
  return TRADUCERI[limbaActiva];
}

function aplicaLimba() {
  const tr = t();

  document.getElementById('app-titlu').textContent    = tr.titlu;
  document.getElementById('app-subtitlu').textContent = tr.subtitlu;
  document.getElementById('label-distanta').textContent = tr.distanta;
  document.getElementById('label-consum').textContent   = tr.consum;
  document.getElementById('label-pret').textContent     = tr.pret;
  document.getElementById('btn-calculeaza').textContent = tr.buton;
  document.getElementById('btn-limba').textContent      = limbaActiva === 'en' ? 'RO' : 'EN';
  document.documentElement.lang                         = limbaActiva;

  // re-renderează rezultatul dacă e vizibil
  const wrap = document.getElementById('rezultat-wrap');
  if (wrap.style.display !== 'none') {
    const distanta = parseFloat(document.getElementById('distanta').value);
    const consum   = parseFloat(document.getElementById('consum').value);
    const pret     = parseFloat(document.getElementById('pret').value);
    if (!isNaN(distanta) && !isNaN(consum) && !isNaN(pret)) {
      const litri = (distanta / 100) * consum;
      const cost  = litri * pret;
      afiseazaRezultat(litri, cost);
    }
  }
}

function schimbaLimba() {
  limbaActiva = limbaActiva === 'en' ? 'ro' : 'en';
  localStorage.setItem('comb_limba', limbaActiva);
  aplicaLimba();
}

function salveaza(distanta, consum, pret) {
  localStorage.setItem('comb_distanta', distanta);
  localStorage.setItem('comb_consum', consum);
  localStorage.setItem('comb_pret', pret);
}

function incarca() {
  const d = localStorage.getItem('comb_distanta');
  const c = localStorage.getItem('comb_consum');
  const p = localStorage.getItem('comb_pret');
  if (d) document.getElementById('distanta').value = d;
  if (c) document.getElementById('consum').value   = c;
  if (p) document.getElementById('pret').value     = p;
  aplicaLimba();
}

function valideaza(distanta, consum, pret) {
  const tr = t();
  const valori = { distanta, consum, pret };
  for (const [camp, val] of Object.entries(valori)) {
    if (isNaN(val)) return tr.eroareNaN(camp);
    const { min, max } = LIMITE[camp];
    if (val < min || val > max) return tr.eroareInterval(camp, min, max);
  }
  return null;
}

function afiseazaEroare(msg) {
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  wrap.style.display = 'block';
  rez.className  = 'eroare';
  rez.innerHTML  = msg;
}

function afiseazaRezultat(litri, cost) {
  const tr  = t();
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  wrap.style.display = 'block';
  rez.className  = '';
  rez.innerHTML  = `
    <div class="result-grid">
      <div class="result-card">
        <div class="r-label">${tr.labelLitri}</div>
        <div class="r-value">${fmt.format(litri)}</div>
        <div class="r-unit">${tr.unitLitri}</div>
      </div>
      <div class="result-card">
        <div class="r-label">${tr.labelCost}</div>
        <div class="r-value">${fmt.format(cost)}</div>
        <div class="r-unit">${tr.unitCost}</div>
      </div>
    </div>
  `;
}

function calculeaza() {
  const distanta = parseFloat(document.getElementById('distanta').value);
  const consum   = parseFloat(document.getElementById('consum').value);
  const pret     = parseFloat(document.getElementById('pret').value);
  const btn      = document.getElementById('btn-calculeaza');
  const tr       = t();

  btn.disabled    = true;
  btn.textContent = tr.butonLoading;

  const eroare = valideaza(distanta, consum, pret);
  if (eroare) {
    afiseazaEroare(eroare);
    btn.disabled    = false;
    btn.textContent = tr.buton;
    return;
  }

  const litri = (distanta / 100) * consum;
  const cost  = litri * pret;

  salveaza(distanta, consum, pret);
  afiseazaRezultat(litri, cost);

  btn.disabled    = false;
  btn.textContent = tr.buton;
}

document.addEventListener('DOMContentLoaded', incarca);
window.calculeaza    = calculeaza;
window.schimbaLimba  = schimbaLimba;
