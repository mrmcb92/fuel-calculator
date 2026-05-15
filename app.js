const CAMPURI = ['distanta', 'consum', 'pret'];
const LIMITE = {
  distanta: { min: 0.1, max: 50000 },
  consum:   { min: 2,   max: 50   },
  pret:     { min: 0.1, max: 100  }
};

const formatar = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function salveazaValori(distanta, consum, pret) {
  localStorage.setItem('combustibil_consum', consum);
  localStorage.setItem('combustibil_pret', pret);
  localStorage.setItem('combustibil_distanta', distanta);
}

function incarcaValoriSalvate() {
  const consum   = localStorage.getItem('combustibil_consum');
  const pret     = localStorage.getItem('combustibil_pret');
  const distanta = localStorage.getItem('combustibil_distanta');

  if (consum)   document.getElementById('consum').value   = consum;
  if (pret)     document.getElementById('pret').value     = pret;
  if (distanta) document.getElementById('distanta').value = distanta;
}

function valideaza(distanta, consum, pret) {
  const valori = { distanta, consum, pret };

  for (const [camp, valoare] of Object.entries(valori)) {
    if (isNaN(valoare)) {
      return `Câmpul „${camp}" nu este un număr valid.`;
    }
    const { min, max } = LIMITE[camp];
    if (valoare < min || valoare > max) {
      return `Câmpul „${camp}" trebuie să fie între ${min} și ${max}.`;
    }
  }

  return null;
}

function calculeaza() {
  const distanta = parseFloat(document.getElementById('distanta').value);
  const consum   = parseFloat(document.getElementById('consum').value);
  const pret     = parseFloat(document.getElementById('pret').value);
  const buton    = document.getElementById('btn-calculeaza');
  const rezultat = document.getElementById('rezultat');

  rezultat.innerHTML = '';
  rezultat.className = '';

  const eroare = valideaza(distanta, consum, pret);
  if (eroare) {
    rezultat.innerHTML = eroare;
    rezultat.className = 'eroare';
    return;
  }

  buton.disabled     = true;
  buton.textContent  = 'Se calculează...';

  const litri = (distanta / 100) * consum;
  const cost  = litri * pret;

  salveazaValori(distanta, consum, pret);

  rezultat.innerHTML = `
    <p>Combustibil necesar: <strong>${formatar.format(litri)} L</strong></p>
    <p>Cost total: <strong>${formatar.format(cost)} lei</strong></p>
  `;

  buton.disabled    = false;
  buton.textContent = 'Calculează';
}

document.addEventListener('DOMContentLoaded', incarcaValoriSalvate);
window.calculeaza = calculeaza;
