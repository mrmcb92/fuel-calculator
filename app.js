// ── Translations ────────────────────────────────────────────────────────────

const TRADUCERI = {
  en: {
    titlu:          'Fuel Calculator',
    subtitlu:       'Estimate the cost before or after your trip',
    tabCost:        'Cost',
    tabRange:       'Range',
    tabHistory:     'History',
    profileDefault: '— Vehicle —',
    distanta:       'Distance',
    turRetur:       'Round trip',
    consum:         'Avg. consumption',
    pret:           'Fuel price',
    pasageri:       'Passengers',
    split:          'Split cost',
    buget:          'Budget',
    consumR:        'Avg. consumption',
    pretR:          'Fuel price',
    butonCalc:      'Calculate',
    butonLoading:   'Calculating...',
    butonReset:     'Reset',
    labelLitri:     'Fuel needed',
    labelCost:      'Total cost',
    labelCostKm:    'Cost / km',
    labelPerPax:    'Per person',
    labelMaxDist:   'Max distance',
    labelLitriR:    'Fuel needed',
    unitLitri:      'liters',
    unitKm:         'km',
    share:          'Share',
    clearHistory:   'Clear history',
    noHistory:      'No calculations yet.',
    profileName:    'Vehicle name:',
    profileSaved:   'Profile saved!',
    profileDeleted: 'Profile deleted.',
    profileNone:    'Select a profile first.',
    copiedMsg:      'Copied!',
    eroareNaN:      (f) => `"${f}" is not a valid number.`,
    eroareInterval: (f, a, b) => `"${f}" must be between ${a} and ${b}.`,
  },
  ro: {
    titlu:          'Calculator Combustibil',
    subtitlu:       'Estimează costul înainte sau după drum',
    tabCost:        'Cost',
    tabRange:       'Autonomie',
    tabHistory:     'Istoric',
    profileDefault: '— Vehicul —',
    distanta:       'Distanță',
    turRetur:       'Tur-retur',
    consum:         'Consum mediu',
    pret:           'Preț combustibil',
    pasageri:       'Pasageri',
    split:          'Împarte costul',
    buget:          'Buget',
    consumR:        'Consum mediu',
    pretR:          'Preț combustibil',
    butonCalc:      'Calculează',
    butonLoading:   'Se calculează...',
    butonReset:     'Resetează',
    labelLitri:     'Combustibil',
    labelCost:      'Cost total',
    labelCostKm:    'Cost / km',
    labelPerPax:    'Per persoană',
    labelMaxDist:   'Distanță maximă',
    labelLitriR:    'Combustibil necesar',
    unitLitri:      'litri',
    unitKm:         'km',
    share:          'Distribuie',
    clearHistory:   'Șterge istoricul',
    noHistory:      'Niciun calcul salvat.',
    profileName:    'Nume vehicul:',
    profileSaved:   'Profil salvat!',
    profileDeleted: 'Profil șters.',
    profileNone:    'Selectează un profil mai întâi.',
    copiedMsg:      'Copiat!',
    eroareNaN:      (f) => `Câmpul „${f}" nu este valid.`,
    eroareInterval: (f, a, b) => `„${f}" trebuie să fie între ${a} și ${b}.`,
  }
};

// ── State ───────────────────────────────────────────────────────────────────

let limbaActiva = localStorage.getItem('comb_limba')      || 'en';
let consumUnit  = localStorage.getItem('comb_consumUnit') || 'L100';
let currency    = localStorage.getItem('comb_currency')   || 'RON';
let lastResult  = null;

// ── Formatters ──────────────────────────────────────────────────────────────

const fmt  = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt1 = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function t() { return TRADUCERI[limbaActiva]; }

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Unit conversion ─────────────────────────────────────────────────────────

function toL100(val, unit) {
  if (unit === 'kmL') return 100 / val;
  if (unit === 'mpg') return 235.214 / val; // US mpg
  return val;
}

const CONSUM_PLACEHOLDER = { L100: '6.5', kmL: '15.4', mpg: '36' };
const CONSUM_LABEL       = { L100: 'L/100', kmL: 'km/L', mpg: 'mpg' };

// ── Language ────────────────────────────────────────────────────────────────

function aplicaLimba() {
  const tr = t();
  const ids = {
    'app-titlu':          tr.titlu,
    'app-subtitlu':       tr.subtitlu,
    'tab-cost-label':     tr.tabCost,
    'tab-range-label':    tr.tabRange,
    'tab-history-label':  tr.tabHistory,
    'profile-default-opt':tr.profileDefault,
    'label-distanta':     tr.distanta,
    'label-tur-retur':    tr.turRetur,
    'label-consum':       tr.consum,
    'label-pret':         tr.pret,
    'label-pasageri':     tr.pasageri,
    'label-split':        tr.split,
    'label-buget':        tr.buget,
    'label-consum-r':     tr.consumR,
    'label-pret-r':       tr.pretR,
    'label-btn-calc':     tr.butonCalc,
    'label-btn-reset':    tr.butonReset,
    'label-share':        tr.share,
    'label-clear-history':tr.clearHistory,
  };
  for (const [id, text] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  document.getElementById('btn-limba').textContent = limbaActiva === 'en' ? 'RO' : 'EN';
  document.documentElement.lang = limbaActiva;
  updateCurrencyLabels();
  if (lastResult) afiseazaRezultat(lastResult);
  renderHistory();
}

function schimbaLimba() {
  limbaActiva = limbaActiva === 'en' ? 'ro' : 'en';
  localStorage.setItem('comb_limba', limbaActiva);
  aplicaLimba();
}

// ── Currency ────────────────────────────────────────────────────────────────

function setCurrency(cur) {
  currency = cur;
  localStorage.setItem('comb_currency', cur);
  document.querySelectorAll('#currency-toggle .seg').forEach(b => {
    b.classList.toggle('active', b.dataset.cur === cur);
  });
  updateCurrencyLabels();
  if (lastResult) afiseazaRezultat(lastResult);
}

function updateCurrencyLabels() {
  document.getElementById('unit-pret').textContent   = currency + '/L';
  document.getElementById('unit-pret-r').textContent = currency + '/L';
  document.getElementById('unit-buget').textContent  = currency;
}

// ── Consumption unit ────────────────────────────────────────────────────────

function setConsumUnit(unit) {
  consumUnit = unit;
  localStorage.setItem('comb_consumUnit', unit);
  document.querySelectorAll('#consum-unit-toggle .seg').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === unit);
  });
  document.getElementById('unit-consum').textContent = CONSUM_LABEL[unit];
  document.getElementById('consum').placeholder      = CONSUM_PLACEHOLDER[unit];
  recalculeaza();
}

// ── Tabs ────────────────────────────────────────────────────────────────────

function setTab(tab) {
  ['cost', 'range', 'history'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === tab);
    document.getElementById('panel-' + id).style.display = id === tab ? '' : 'none';
  });
  if (tab === 'range') {
    const c = document.getElementById('consum').value;
    const p = document.getElementById('pret').value;
    const cu = parseFloat(c);
    if (!isNaN(cu) && cu > 0) {
      document.getElementById('consum-r').value = fmt1.format(toL100(cu, consumUnit)).replace(',', '.');
    }
    if (p) document.getElementById('pret-r').value = p;
    calcRange();
  }
  if (tab === 'history') renderHistory();
}

// ── Split passengers ────────────────────────────────────────────────────────

function toggleSplit() {
  const on = document.getElementById('split-toggle').checked;
  document.getElementById('pasageri-wrap').style.display = on ? '' : 'none';
  recalculeaza();
}

// ── Validation ──────────────────────────────────────────────────────────────

function valideaza(distanta, consumL100, pret) {
  const tr = t();
  if (isNaN(distanta) || distanta < 0.1 || distanta > 50000)
    return tr.eroareInterval(tr.distanta, 0.1, 50000);
  if (isNaN(consumL100) || consumL100 <= 0)
    return tr.eroareNaN(tr.consum);
  if (isNaN(pret) || pret < 0.1 || pret > 1000)
    return tr.eroareInterval(tr.pret, 0.1, 1000);
  return null;
}

// ── Cost calculation ────────────────────────────────────────────────────────

function getDistantaEffectiva() {
  const d = parseFloat(document.getElementById('distanta').value);
  return document.getElementById('tur-retur').checked ? d * 2 : d;
}

function recalculeaza() {
  const distanta   = getDistantaEffectiva();
  const consumRaw  = parseFloat(document.getElementById('consum').value);
  const consumL100 = toL100(consumRaw, consumUnit);
  const pret       = parseFloat(document.getElementById('pret').value);

  if (isNaN(distanta) || isNaN(consumRaw) || isNaN(pret)) return;
  if (valideaza(distanta, consumL100, pret)) return;

  const litri     = (distanta / 100) * consumL100;
  const cost      = litri * pret;
  const costPerKm = cost / distanta;
  const splitOn   = document.getElementById('split-toggle').checked;
  const pasageri  = splitOn ? (parseInt(document.getElementById('pasageri').value) || 1) : 1;

  lastResult = { litri, cost, costPerKm, pasageri, distanta, consumL100, pret };
  afiseazaRezultat(lastResult);
}

function calculeaza() {
  const distanta   = getDistantaEffectiva();
  const consumRaw  = parseFloat(document.getElementById('consum').value);
  const consumL100 = toL100(consumRaw, consumUnit);
  const pret       = parseFloat(document.getElementById('pret').value);
  const btn        = document.getElementById('btn-calculeaza');
  const lbl        = document.getElementById('label-btn-calc');
  const tr         = t();

  btn.disabled  = true;
  lbl.textContent = tr.butonLoading;

  const eroare = valideaza(distanta, consumL100, pret);
  if (eroare) {
    afiseazaEroare(eroare);
    btn.disabled    = false;
    lbl.textContent = tr.butonCalc;
    return;
  }

  const litri     = (distanta / 100) * consumL100;
  const cost      = litri * pret;
  const costPerKm = cost / distanta;
  const splitOn   = document.getElementById('split-toggle').checked;
  const pasageri  = splitOn ? (parseInt(document.getElementById('pasageri').value) || 1) : 1;

  lastResult = { litri, cost, costPerKm, pasageri, distanta, consumL100, pret };
  localStorage.setItem('comb_distanta', document.getElementById('distanta').value);
  localStorage.setItem('comb_consum',   document.getElementById('consum').value);
  localStorage.setItem('comb_pret',     pret);
  addToHistory(lastResult);
  afiseazaRezultat(lastResult);

  btn.disabled    = false;
  lbl.textContent = tr.butonCalc;
}

function afiseazaEroare(msg) {
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  document.getElementById('share-row').style.display = 'none';
  wrap.style.display = 'block';
  rez.className  = 'eroare';
  rez.textContent = msg;
}

function afiseazaRezultat(res) {
  const tr   = t();
  const wrap = document.getElementById('rezultat-wrap');
  const rez  = document.getElementById('rezultat');
  wrap.style.display = 'block';
  document.getElementById('share-row').style.display = '';
  rez.className = '';

  const cols = res.pasageri > 1 ? 4 : 3;

  const perPaxHTML = res.pasageri > 1 ? `
    <div class="result-card" data-copy="${fmt.format(res.cost / res.pasageri)}">
      <div class="r-label">${tr.labelPerPax}</div>
      <div class="r-value">${fmt.format(res.cost / res.pasageri)}</div>
      <div class="r-unit">${currency}</div>
    </div>` : '';

  rez.innerHTML = `
    <div class="result-grid cols-${cols}">
      <div class="result-card" data-copy="${fmt1.format(res.litri)}">
        <div class="r-label">${tr.labelLitri}</div>
        <div class="r-value">${fmt1.format(res.litri)}</div>
        <div class="r-unit">${tr.unitLitri}</div>
      </div>
      <div class="result-card" data-copy="${fmt.format(res.cost)}">
        <div class="r-label">${tr.labelCost}</div>
        <div class="r-value">${fmt.format(res.cost)}</div>
        <div class="r-unit">${currency}</div>
      </div>
      <div class="result-card" data-copy="${fmt.format(res.costPerKm)}">
        <div class="r-label">${tr.labelCostKm}</div>
        <div class="r-value">${fmt.format(res.costPerKm)}</div>
        <div class="r-unit">${currency}/km</div>
      </div>
      ${perPaxHTML}
    </div>
  `;
}

// ── Range calculation ───────────────────────────────────────────────────────

function calcRange() {
  const buget     = parseFloat(document.getElementById('buget').value);
  const consumL100 = parseFloat(document.getElementById('consum-r').value);
  const pret      = parseFloat(document.getElementById('pret-r').value);
  const wrap      = document.getElementById('range-result-wrap');
  const rez       = document.getElementById('range-rezultat');
  const tr        = t();

  if (isNaN(buget) || isNaN(consumL100) || isNaN(pret) || consumL100 <= 0 || pret <= 0 || buget <= 0) return;

  const litri = buget / pret;
  const dist  = (litri / consumL100) * 100;

  wrap.style.display = 'block';
  rez.innerHTML = `
    <div class="result-grid cols-2">
      <div class="result-card" data-copy="${fmt.format(dist)}">
        <div class="r-label">${tr.labelMaxDist}</div>
        <div class="r-value">${fmt.format(dist)}</div>
        <div class="r-unit">${tr.unitKm}</div>
      </div>
      <div class="result-card" data-copy="${fmt1.format(litri)}">
        <div class="r-label">${tr.labelLitriR}</div>
        <div class="r-value">${fmt1.format(litri)}</div>
        <div class="r-unit">${tr.unitLitri}</div>
      </div>
    </div>
  `;
}

// ── Copy to clipboard ───────────────────────────────────────────────────────

function copyValue(val) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(val).then(() => showToast(t().copiedMsg));
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// Click-to-copy via event delegation
document.addEventListener('click', e => {
  const card = e.target.closest('.result-card[data-copy]');
  if (card) copyValue(card.dataset.copy);
});

// ── Share ───────────────────────────────────────────────────────────────────

function shareResult() {
  if (!lastResult) return;
  const tr   = t();
  const text = [
    tr.titlu,
    `${tr.distanta}: ${fmt.format(lastResult.distanta)} km`,
    `${tr.labelLitri}: ${fmt1.format(lastResult.litri)} ${tr.unitLitri}`,
    `${tr.labelCost}: ${fmt.format(lastResult.cost)} ${currency}`,
    `${tr.labelCostKm}: ${fmt.format(lastResult.costPerKm)} ${currency}/km`,
  ].join('\n');

  if (navigator.share) {
    navigator.share({ title: tr.titlu, text });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(t().copiedMsg));
  }
}

// ── History ─────────────────────────────────────────────────────────────────

function getHistory() {
  try { return JSON.parse(localStorage.getItem('comb_history') || '[]'); } catch { return []; }
}

function addToHistory(res) {
  const hist = getHistory();
  hist.unshift({
    date:       new Date().toISOString(),
    distanta:   res.distanta,
    litri:      res.litri,
    cost:       res.cost,
    costPerKm:  res.costPerKm,
    pasageri:   res.pasageri,
    currency,
  });
  if (hist.length > 10) hist.pop();
  localStorage.setItem('comb_history', JSON.stringify(hist));
}

function clearHistory() {
  localStorage.removeItem('comb_history');
  renderHistory();
}

function renderHistory() {
  const hist = getHistory();
  const list = document.getElementById('history-list');
  const btn  = document.getElementById('btn-clear-history');
  const tr   = t();

  if (!hist.length) {
    list.innerHTML = `<p class="no-history">${tr.noHistory}</p>`;
    btn.style.display = 'none';
    return;
  }

  btn.style.display = '';
  const locale = limbaActiva === 'ro' ? 'ro-RO' : 'en-GB';
  list.innerHTML = hist.map(h => {
    const ds = new Date(h.date).toLocaleString(locale, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const cur = h.currency || 'RON';
    const perPax = h.pasageri > 1
      ? `<span>${tr.labelPerPax}: ${fmt.format(h.cost / h.pasageri)} ${cur}</span>` : '';
    return `
      <div class="hist-item">
        <div class="hist-date">${ds}</div>
        <div class="hist-vals">
          <span>${fmt.format(h.distanta)} km</span>
          <span>${fmt1.format(h.litri)} L</span>
          <span class="hist-cost">${fmt.format(h.cost)} ${cur}</span>
          ${perPax}
        </div>
      </div>
    `;
  }).join('');
}

// ── Vehicle profiles ─────────────────────────────────────────────────────────

function getProfiles() {
  try { return JSON.parse(localStorage.getItem('comb_profiles') || '[]'); } catch { return []; }
}

function renderProfiles() {
  const sel      = document.getElementById('profile-select');
  const tr       = t();
  const profiles = getProfiles();
  const current  = sel.value;
  sel.innerHTML  = `<option value="">${esc(tr.profileDefault)}</option>` +
    profiles.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  if (current) sel.value = current;
}

function saveProfile() {
  const consumVal = document.getElementById('consum').value;
  if (!consumVal) return;
  const tr   = t();
  const name = prompt(tr.profileName);
  if (!name || !name.trim()) return;
  const profiles = getProfiles();
  profiles.push({ id: Date.now().toString(), name: name.trim(), consum: parseFloat(consumVal), unit: consumUnit });
  localStorage.setItem('comb_profiles', JSON.stringify(profiles));
  renderProfiles();
  showToast(tr.profileSaved);
}

function loadProfile() {
  const id = document.getElementById('profile-select').value;
  if (!id) return;
  const p = getProfiles().find(x => x.id === id);
  if (!p) return;
  setConsumUnit(p.unit || 'L100');
  document.getElementById('consum').value = p.consum;
  recalculeaza();
}

function deleteProfile() {
  const id = document.getElementById('profile-select').value;
  const tr = t();
  if (!id) { showToast(tr.profileNone); return; }
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem('comb_profiles', JSON.stringify(profiles));
  renderProfiles();
  showToast(tr.profileDeleted);
}

// ── Reset ────────────────────────────────────────────────────────────────────

function resetForm() {
  ['distanta', 'consum', 'pret'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('tur-retur').checked    = false;
  document.getElementById('split-toggle').checked = false;
  document.getElementById('pasageri-wrap').style.display = 'none';
  document.getElementById('profile-select').value = '';
  document.getElementById('rezultat-wrap').style.display = 'none';
  document.getElementById('share-row').style.display     = 'none';
  lastResult = null;
}

// ── Init ─────────────────────────────────────────────────────────────────────

function incarca() {
  const d = localStorage.getItem('comb_distanta');
  const c = localStorage.getItem('comb_consum');
  const p = localStorage.getItem('comb_pret');
  if (d) document.getElementById('distanta').value = d;
  if (c) document.getElementById('consum').value   = c;
  if (p) document.getElementById('pret').value     = p;

  // restore toggles
  document.querySelectorAll('#currency-toggle .seg').forEach(b => {
    b.classList.toggle('active', b.dataset.cur === currency);
  });
  document.querySelectorAll('#consum-unit-toggle .seg').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === consumUnit);
  });
  document.getElementById('unit-consum').textContent = CONSUM_LABEL[consumUnit];
  document.getElementById('consum').placeholder      = CONSUM_PLACEHOLDER[consumUnit];

  updateCurrencyLabels();
  aplicaLimba();
  renderProfiles();
  recalculeaza();

  // Enter key support on all inputs
  document.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') calculeaza(); });
  });
}

document.addEventListener('DOMContentLoaded', incarca);

// expose globals (called via inline onclick)
window.calculeaza    = calculeaza;
window.recalculeaza  = recalculeaza;
window.schimbaLimba  = schimbaLimba;
window.setTab        = setTab;
window.setConsumUnit = setConsumUnit;
window.setCurrency   = setCurrency;
window.toggleSplit   = toggleSplit;
window.calcRange     = calcRange;
window.shareResult   = shareResult;
window.clearHistory  = clearHistory;
window.saveProfile   = saveProfile;
window.loadProfile   = loadProfile;
window.deleteProfile = deleteProfile;
window.resetForm     = resetForm;
