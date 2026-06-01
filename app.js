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
    syncTitle:      'Sync Profiles',
    syncDesc1:      'Your device code — share it with another device:',
    syncDesc2:      'Enter another device\'s code to use the same profiles:',
    syncCopy:       'Copy',
    syncApply:      'Sync',
    syncOk:         'Synced! Profiles will appear shortly.',
    syncInvalid:    'Invalid code — must be 6 characters.',
    syncConnecting: 'Connecting...',
    syncConnected:  'Synced',
    syncOffline:    'Offline — using local profiles',
    fuelType:       'Fuel type',
    priceDefault:   'default prices · tap to refresh',
    priceUpdated:   'updated',
    priceLive:      'live',
    priceLoading:   'updating...',
    priceRonOnly:   'live prices in RON only',
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
    syncTitle:      'Sincronizare Profiluri',
    syncDesc1:      'Codul tău — trimite-l pe alt dispozitiv:',
    syncDesc2:      'Introdu codul altui dispozitiv pentru aceleași profiluri:',
    syncCopy:       'Copiază',
    syncApply:      'Sincronizează',
    syncOk:         'Sincronizat! Profilurile apar în câteva secunde.',
    syncInvalid:    'Cod invalid — trebuie să aibă 6 caractere.',
    syncConnecting: 'Se conectează...',
    syncConnected:  'Sincronizat',
    syncOffline:    'Offline — profiluri locale',
    fuelType:       'Tip combustibil',
    priceDefault:   'prețuri implicite · apasă pentru refresh',
    priceUpdated:   'actualizat',
    priceLive:      'live',
    priceLoading:   'se actualizează...',
    priceRonOnly:   'prețuri live doar în RON',
    eroareNaN:      (f) => `Câmpul „${f}" nu este valid.`,
    eroareInterval: (f, a, b) => `„${f}" trebuie să fie între ${a} și ${b}.`,
  }
};

// ── State ───────────────────────────────────────────────────────────────────

let limbaActiva  = localStorage.getItem('comb_limba')      || 'en';
let consumUnit   = localStorage.getItem('comb_consumUnit') || 'L100';
let currency     = localStorage.getItem('comb_currency')   || 'RON';
let lastResult   = null;
let profilesCache = [];

// ── Firebase ─────────────────────────────────────────────────────────────────

let db = null;
let syncId = null;
let unsubscribeProfiles = null;

const SYNC_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateSyncId() {
  return Array.from({ length: 6 }, () =>
    SYNC_ID_CHARS[Math.floor(Math.random() * SYNC_ID_CHARS.length)]
  ).join('');
}

function getSyncId() {
  let id = localStorage.getItem('comb_syncId');
  if (!id || id.length !== 6) {
    id = generateSyncId();
    localStorage.setItem('comb_syncId', id);
  }
  return id;
}

function isFirebaseConfigured() {
  return (
    typeof FIREBASE_CONFIG !== 'undefined' &&
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId
  );
}

function initFirebase() {
  // Always generate syncId so the modal shows a code even without Firebase
  syncId = getSyncId();

  if (!isFirebaseConfigured()) {
    profilesCache = localGetProfiles();
    renderProfiles();
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    subscribeToProfiles(syncId);
    setSyncStatusBar('connecting');
  } catch (e) {
    console.warn('Firebase init failed:', e);
    profilesCache = localGetProfiles();
    renderProfiles();
  }
}

function subscribeToProfiles(id) {
  if (unsubscribeProfiles) {
    unsubscribeProfiles();
    unsubscribeProfiles = null;
  }
  if (!db) return;

  setSyncStatusBar('connecting');

  unsubscribeProfiles = db.collection('users').doc(id)
    .onSnapshot(
      snap => {
        const data = snap.data();
        profilesCache = Array.isArray(data?.profiles) ? data.profiles : [];
        // also keep localStorage in sync as offline fallback
        localStorage.setItem('comb_profiles', JSON.stringify(profilesCache));
        renderProfiles();
        setSyncStatusBar('connected');
      },
      err => {
        console.warn('Firestore error:', err);
        profilesCache = localGetProfiles();
        renderProfiles();
        setSyncStatusBar('offline');
      }
    );
}

function setSyncStatusBar(state) {
  const bar  = document.getElementById('sync-status-bar');
  const text = document.getElementById('sync-status-text');
  if (!bar || !text) return;
  const tr = t();
  if (state === 'connecting') {
    bar.style.display = '';
    bar.className = 'sync-status-bar connecting';
    text.textContent = tr.syncConnecting;
  } else if (state === 'connected') {
    bar.style.display = '';
    bar.className = 'sync-status-bar connected';
    text.textContent = tr.syncConnected + (syncId ? ' · ' + syncId : '');
    setTimeout(() => { if (bar.className.includes('connected')) bar.style.display = 'none'; }, 3000);
  } else if (state === 'offline') {
    bar.style.display = '';
    bar.className = 'sync-status-bar offline';
    text.textContent = tr.syncOffline;
  }
}

// ── Profile storage helpers ──────────────────────────────────────────────────

function localGetProfiles() {
  try { return JSON.parse(localStorage.getItem('comb_profiles') || '[]'); } catch { return []; }
}

function getProfiles() {
  return profilesCache;
}

function saveProfiles(profiles) {
  profilesCache = profiles;
  localStorage.setItem('comb_profiles', JSON.stringify(profiles));
  if (db && syncId) {
    db.collection('users').doc(syncId)
      .set({ profiles }, { merge: true })
      .catch(err => console.warn('Firestore write error:', err));
  }
}

// ── Sync modal ───────────────────────────────────────────────────────────────

function openSyncModal() {
  document.getElementById('sync-code-display').textContent = syncId || '------';
  document.getElementById('sync-code-input').value = '';
  document.getElementById('sync-feedback').textContent = '';
  document.getElementById('sync-modal').style.display = '';
}

function closeSyncModal() {
  document.getElementById('sync-modal').style.display = 'none';
}

function onOverlayClick(e) {
  if (e.target === document.getElementById('sync-modal')) closeSyncModal();
}

function copySyncCode() {
  if (!syncId) return;
  navigator.clipboard?.writeText(syncId).then(() => showToast(t().copiedMsg));
}

function applySyncCode() {
  const raw   = document.getElementById('sync-code-input').value.trim().toUpperCase();
  const fb    = document.getElementById('sync-feedback');
  const tr    = t();
  if (raw.length !== 6) {
    fb.textContent = tr.syncInvalid;
    fb.className   = 'sync-feedback error';
    return;
  }
  syncId = raw;
  localStorage.setItem('comb_syncId', syncId);
  document.getElementById('sync-code-display').textContent = syncId;
  document.getElementById('sync-code-input').value = '';
  fb.textContent = tr.syncOk;
  fb.className   = 'sync-feedback ok';
  if (db) {
    subscribeToProfiles(syncId);
  }
}

// ── Formatters ──────────────────────────────────────────────────────────────

const fmt  = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt1 = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function t() { return TRADUCERI[limbaActiva]; }

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Unit conversion ──────────────────────────────────────────────────────────

function toL100(val, unit) {
  if (unit === 'kmL') return 100 / val;
  if (unit === 'mpg') return 235.214 / val;
  return val;
}

const CONSUM_PLACEHOLDER = { L100: '6.5', kmL: '15.4', mpg: '36' };
const CONSUM_LABEL       = { L100: 'L/100', kmL: 'km/L', mpg: 'mpg' };

// ── Fuel prices ───────────────────────────────────────────────────────────────

// Default fallback prices for Romania (RON/L) — updated May 2026
const FUEL_DEFAULTS_RON = { B95: 9.43, B98: 10.08, Diesel: 9.53, GPL: 4.41 };
const FUEL_CACHE_KEY    = 'comb_fuelPrices';
const FUEL_CACHE_TTL    = 12 * 60 * 60 * 1000; // 12 hours — daily updates

let selectedFuelType = localStorage.getItem('comb_fuelType') || '';

// ── Fuel price functions ──────────────────────────────────────────────────────

// Prices are served from the repo's fuel-prices.json via GitHub raw CDN.
// A GitHub Actions workflow (/.github/workflows/update-fuel-prices.yml)
// updates the file automatically every Monday — no API key needed.
const FUEL_PRICES_URL =
  'https://raw.githubusercontent.com/mrmcb92/fuel-calculator/main/fuel-prices.json';

function loadFuelPriceCache() {
  try { return JSON.parse(localStorage.getItem(FUEL_CACHE_KEY) || 'null'); } catch { return null; }
}

async function fetchFuelPrices() {
  try {
    const res = await fetch(FUEL_PRICES_URL + '?t=' + Date.now());
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.prices) return null;
    // Validate each value is a positive number
    const prices = {};
    for (const [k, v] of Object.entries(data.prices)) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) prices[k] = Math.round(n * 100) / 100;
    }
    if (!Object.keys(prices).length) return null;
    const cache = {
      prices,
      timestamp:  Date.now(),
      updatedAt:  data.updated || null,
      source:     'live',
    };
    localStorage.setItem(FUEL_CACHE_KEY, JSON.stringify(cache));
    return cache;
  } catch (e) {
    console.warn('Fuel price fetch failed:', e);
    return null;
  }
}

function getCurrentFuelPrices() {
  const cache = loadFuelPriceCache();
  return cache?.prices || FUEL_DEFAULTS_RON;
}

async function initFuelPrices() {
  const cache = loadFuelPriceCache();
  const now   = Date.now();

  if (cache && (now - cache.timestamp) < FUEL_CACHE_TTL) {
    updatePriceFreshness(cache.updatedAt || cache.timestamp, 'live');
  } else {
    updatePriceFreshness(null, 'loading');
    const fresh = await fetchFuelPrices();
    updatePriceFreshness(
      fresh ? (fresh.updatedAt || fresh.timestamp) : null,
      fresh ? 'live' : 'default'
    );
  }

  if (selectedFuelType) {
    updateFuelTypeButtons();
    applyFuelTypePrice(selectedFuelType, false);
  }
}

async function refreshFuelPrices() {
  localStorage.removeItem(FUEL_CACHE_KEY);
  updatePriceFreshness(null, 'loading');
  const fresh = await fetchFuelPrices();
  updatePriceFreshness(
    fresh ? (fresh.updatedAt || fresh.timestamp) : null,
    fresh ? 'live' : 'default'
  );
  if (selectedFuelType) applyFuelTypePrice(selectedFuelType, true);
  showToast(fresh ? t().priceLive + ' ✓' : t().priceDefault);
}

function selectFuelType(type) {
  selectedFuelType = type;
  localStorage.setItem('comb_fuelType', type);
  updateFuelTypeButtons();
  applyFuelTypePrice(type, true);
}

function applyFuelTypePrice(type, overwrite) {
  if (currency !== 'RON') {
    // Don't auto-fill for non-RON currencies — prices are RON-based
    return;
  }
  const prices = getCurrentFuelPrices();
  const price  = prices[type];
  if (!price) return;
  const val = price.toFixed(2);
  // Cost tab
  const pretEl = document.getElementById('pret');
  if (pretEl && (overwrite || !pretEl.value)) {
    pretEl.value = val;
    recalculeaza();
  }
  // Range tab
  const pretREl = document.getElementById('pret-r');
  if (pretREl && (overwrite || !pretREl.value)) {
    pretREl.value = val;
    calcRange();
  }
}

function updateFuelTypeButtons() {
  document.querySelectorAll('#fuel-type-grid .fuel-btn, #fuel-type-grid-r .fuel-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fuel === selectedFuelType);
  });
}

function updatePriceFreshness(timestamp, state) {
  const el = document.getElementById('price-freshness');
  if (!el) return;
  const tr     = t();
  const locale = limbaActiva === 'ro' ? 'ro-RO' : 'en-GB';

  const setText = (elem, text, cls) => {
    if (!elem) return;
    elem.textContent = text;
    elem.className   = cls;
  };
  const elR = document.getElementById('price-freshness-r');

  if (state === 'loading') {
    setText(el,  tr.priceLoading, 'price-freshness loading');
    setText(elR, tr.priceLoading, 'price-freshness loading');
  } else if (state === 'live' && timestamp) {
    const ds  = new Date(timestamp).toLocaleString(locale, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const txt = '↻ ' + tr.priceUpdated + ' ' + ds;
    setText(el,  txt, 'price-freshness live');
    setText(elR, txt, 'price-freshness live');
  } else if (state === 'ron-only') {
    setText(el,  tr.priceRonOnly, 'price-freshness');
    setText(elR, tr.priceRonOnly, 'price-freshness');
  } else {
    setText(el,  tr.priceDefault, 'price-freshness');
    setText(elR, tr.priceDefault, 'price-freshness');
  }
}


// ── Language ─────────────────────────────────────────────────────────────────

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
    'label-fuel-type':    tr.fuelType,
    'label-fuel-type-r':  tr.fuelType,
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
    'modal-sync-title':   tr.syncTitle,
    'modal-sync-desc1':   tr.syncDesc1,
    'modal-sync-desc2':   tr.syncDesc2,
    'label-copy-sync':    tr.syncCopy,
    'label-apply-sync':   tr.syncApply,
  };
  for (const [id, text] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  document.getElementById('btn-limba').textContent = limbaActiva === 'en' ? 'RO' : 'EN';
  document.documentElement.lang = limbaActiva;
  updateCurrencyLabels();
  // Re-render price freshness with updated language
  const cache = loadFuelPriceCache();
  if (cache && cache.source === 'live') {
    updatePriceFreshness(cache.updatedAt || cache.timestamp, 'live');
  } else {
    updatePriceFreshness(null, currency !== 'RON' && selectedFuelType ? 'ron-only' : 'default');
  }
  if (lastResult) afiseazaRezultat(lastResult);
  renderHistory();
}

function schimbaLimba() {
  limbaActiva = limbaActiva === 'en' ? 'ro' : 'en';
  localStorage.setItem('comb_limba', limbaActiva);
  aplicaLimba();
}

// ── Currency ─────────────────────────────────────────────────────────────────

function setCurrency(cur) {
  currency = cur;
  localStorage.setItem('comb_currency', cur);
  document.querySelectorAll('#currency-toggle .seg').forEach(b => {
    b.classList.toggle('active', b.dataset.cur === cur);
  });
  updateCurrencyLabels();
  // When switching back to RON and a fuel type is selected, auto-fill price
  if (cur === 'RON' && selectedFuelType) {
    applyFuelTypePrice(selectedFuelType, true);
  } else if (cur !== 'RON' && selectedFuelType) {
    updatePriceFreshness(null, 'ron-only');
  }
  if (lastResult) afiseazaRezultat(lastResult);
}

function updateCurrencyLabels() {
  document.getElementById('unit-pret').textContent   = currency + '/L';
  document.getElementById('unit-pret-r').textContent = currency + '/L';
  document.getElementById('unit-buget').textContent  = currency;
}

// ── Consumption unit ──────────────────────────────────────────────────────────

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

// ── Tabs ──────────────────────────────────────────────────────────────────────

function setTab(tab) {
  ['cost', 'range', 'history'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === tab);
    document.getElementById('panel-' + id).style.display = id === tab ? '' : 'none';
  });
  if (tab === 'range') {
    const c  = document.getElementById('consum').value;
    const p  = document.getElementById('pret').value;
    const cu = parseFloat(c);
    if (!isNaN(cu) && cu > 0) {
      document.getElementById('consum-r').value = String(toL100(cu, consumUnit)).replace(',', '.');
    }
    if (p) document.getElementById('pret-r').value = p;
    calcRange();
  }
  if (tab === 'history') renderHistory();
}

// ── Split passengers ──────────────────────────────────────────────────────────

function toggleSplit() {
  const on = document.getElementById('split-toggle').checked;
  document.getElementById('pasageri-wrap').style.display = on ? '' : 'none';
  recalculeaza();
}

// ── Validation ────────────────────────────────────────────────────────────────

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

// ── Cost calculation ──────────────────────────────────────────────────────────

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

  btn.disabled    = true;
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
  rez.className   = 'eroare';
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

// ── Range calculation ─────────────────────────────────────────────────────────

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

// ── Copy to clipboard ─────────────────────────────────────────────────────────

function copyValue(val) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(val).then(() => showToast(t().copiedMsg));
}

document.addEventListener('click', e => {
  const card = e.target.closest('.result-card[data-copy]');
  if (card) copyValue(card.dataset.copy);
});

// ── Share ─────────────────────────────────────────────────────────────────────

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

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ── History ───────────────────────────────────────────────────────────────────

function getHistory() {
  try { return JSON.parse(localStorage.getItem('comb_history') || '[]'); } catch { return []; }
}

function addToHistory(res) {
  const hist = getHistory();
  hist.unshift({
    date:      new Date().toISOString(),
    distanta:  res.distanta,
    litri:     res.litri,
    cost:      res.cost,
    costPerKm: res.costPerKm,
    pasageri:  res.pasageri,
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
    const ds  = new Date(h.date).toLocaleString(locale, {
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

// ── Vehicle profiles ──────────────────────────────────────────────────────────

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
  saveProfiles(profiles);
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
  saveProfiles(getProfiles().filter(p => p.id !== id));
  renderProfiles();
  showToast(tr.profileDeleted);
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetForm() {
  ['distanta', 'consum'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('tur-retur').checked    = false;
  document.getElementById('split-toggle').checked = false;
  document.getElementById('pasageri-wrap').style.display = 'none';
  document.getElementById('profile-select').value = '';
  document.getElementById('rezultat-wrap').style.display = 'none';
  document.getElementById('share-row').style.display     = 'none';
  lastResult = null;
  // Re-apply fuel type price if one is selected, otherwise clear price
  if (selectedFuelType && currency === 'RON') {
    applyFuelTypePrice(selectedFuelType, true);
  } else {
    document.getElementById('pret').value = '';
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function incarca() {
  const d = localStorage.getItem('comb_distanta');
  const c = localStorage.getItem('comb_consum');
  const p = localStorage.getItem('comb_pret');
  if (d) document.getElementById('distanta').value = d;
  if (c) document.getElementById('consum').value   = c;
  if (p) document.getElementById('pret').value     = p;

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
  initFirebase();
  updateFuelTypeButtons();
  initFuelPrices();
  recalculeaza();

  document.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') calculeaza(); });
  });
}

document.addEventListener('DOMContentLoaded', incarca);

// globals
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
window.openSyncModal      = openSyncModal;
window.closeSyncModal     = closeSyncModal;
window.onOverlayClick     = onOverlayClick;
window.copySyncCode       = copySyncCode;
window.applySyncCode      = applySyncCode;
window.selectFuelType     = selectFuelType;
window.refreshFuelPrices  = refreshFuelPrices;
