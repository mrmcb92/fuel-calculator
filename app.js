const LIMITE = {
  distanta: { min: 0.1, max: 50000 },
  consum:   { min: 2,   max: 50   },
  pret:     { min: 0.1, max: 100  }
};

const fmt = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

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
}

function valideaza(distanta, consum, pret) {
  const valori = { distanta, consum, pret };
  for (const [camp, val] of Object.entries(valori)) {
    if (isNaN(val)) return `Câmpul „${camp}" nu este valid.`;
    const { min, max } = LIMITE[camp];
    if (val < min || val > max) return `„${camp}" trebuie să fie între ${min} și ${max}.`;
  }
  return null;
}

function afiseazaEroare(msg) {
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  wrap.style.display = 'block';
  rez.className = 'eroare';
  rez.innerHTML = msg;
}

function afiseazaRezultat(litri, cost) {
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  wrap.style.display = 'block';
  rez.className = '';
  rez.innerHTML = `
    <div class="result-grid">
      <div class="result-card">
        <div class="r-label">Combustibil</div>
        <div class="r-value">${fmt.format(litri)}</div>
        <div class="r-unit">litri</div>
      </div>
      <div class="result-card">
        <div class="r-label">Cost total</div>
        <div class="r-value">${fmt.format(cost)}</div>
        <div class="r-unit">lei</div>
      </div>
    </div>
  `;
}

function calculeaza() {
  const distanta = parseFloat(document.getElementById('distanta').value);
  const consum   = parseFloat(document.getElementById('consum').value);
  const pret     = parseFloat(document.getElementById('pret').value);
  const btn      = document.getElementById('btn-calculeaza');

  btn.disabled    = true;
  btn.textContent = 'Se calculează...';

  const eroare = valideaza(distanta, consum, pret);
  if (eroare) {
    afiseazaEroare(eroare);
    btn.disabled    = false;
    btn.textContent = 'Calculează';
    return;
  }

  const litri = (distanta / 100) * consum;
  const cost  = litri * pret;

  salveaza(distanta, consum, pret);
  afiseazaRezultat(litri, cost);

  btn.disabled    = false;
  btn.textContent = 'Calculează';
}

document.addEventListener('DOMContentLoaded', incarca);
window.calculeaza = calculeaza;
