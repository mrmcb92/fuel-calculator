// core.js — pure math helpers shared between the app and its Node unit tests.
// Loaded BEFORE app.js in index.html. Exposes the helpers as globals for the
// app and as window.FuelCore (namespace) for the test suite.
(function (global) {
  'use strict';

  // Convert user input to a number, tolerating European decimal commas ("6,5").
  // Returns NaN for empty / non-numeric input.
  function parseNum(value) {
    if (value === null || value === undefined || value === '') return NaN;
    const s = String(value).trim().replace(',', '.');
    return parseFloat(s);
  }

  // Convert a consumption value in the given unit to litres per 100 km.
  function toL100(val, unit) {
    if (unit === 'kmL') return 100 / val;
    if (unit === 'mpg') return 235.214 / val;
    return val;
  }

  // Pure cost calculation for a one-way or round-trip distance in km.
  // Inputs must already be validated by the caller (see valideaza()).
  function computeCore(distantaKm, consumL100, pretPerL) {
    const litri     = (distantaKm / 100) * consumL100;
    const cost      = litri * pretPerL;
    const costPerKm = cost / distantaKm;
    return { litri, cost, costPerKm };
  }

  const CONSUM_PLACEHOLDER = { L100: '6.5', kmL: '15.4', mpg: '36' };
  const CONSUM_LABEL       = { L100: 'L/100', kmL: 'km/L', mpg: 'mpg' };

  // Normalizes fuel type keys to standard identifiers: B95, B98, Diesel, DieselPlus, GPL.
  // Tolerates variants like "diesel+", "Diesel+", "dieselplus", "95", "98", etc.
  function normalizeFuelType(type) {
    if (!type) return '';
    const s = String(type).trim();
    const lower = s.toLowerCase().replace(/[\s_\-+]/g, '');
    if (lower === 'dieselplus' || s.toLowerCase() === 'diesel+' || lower === 'dplus') return 'DieselPlus';
    if (lower === 'b95' || lower === '95') return 'B95';
    if (lower === 'b98' || lower === '98') return 'B98';
    if (lower === 'diesel') return 'Diesel';
    if (lower === 'gpl') return 'GPL';
    return s;
  }

  // Safely merges fallback default prices with cached prices and optional city prices.
  // Guarantees all default fuels (including DieselPlus) exist even with stale caches.
  function mergeFuelPrices(defaults, cachePrices, cityPrices) {
    const base = Object.assign({}, defaults || {}, cachePrices || {});
    if (cityPrices && typeof cityPrices === 'object') {
      return Object.assign({}, base, cityPrices);
    }
    return base;
  }

  // ── Vehicle Consumption Estimator ──────────────────────────────────────────
  const TRAFFIC_FACTORS = {
    extraurban: 0.85,  // Smooth open road / national (70-90 km/h): -15%
    mixed:      1.00,  // Mixed reference WLTP: 0%
    highway:    1.10,  // Highway speeds 120-130 km/h: +10%
    urban:      1.20,  // Moderate city traffic: +20%
    heavy:      1.40,  // Heavy stop-and-go city traffic / rush hour: +40%
    trafficjam: 1.65,  // Severe gridlock / traffic jam: +65%
  };

  const STYLE_FACTORS = {
    eco:    0.92,  // Defensive / eco-driving: -8%
    normal: 1.00,  // Normal balanced: 0%
    sport:  1.18,  // Aggressive / fast acceleration: +18%
  };

  const LOAD_FACTORS = {
    driver:     1.00,  // Driver only: 0%
    passengers: 1.05,  // 2-3 passengers: +5%
    loaded:     1.10,  // Full vehicle / heavy luggage: +10%
  };

  const SEASON_FACTORS = {
    mild:   1.00,  // Mild / warm temperature: 0%
    winter: 1.12,  // Cold winter, cold engine starts, winter tires: +12%
  };

  const AC_ADDITIONS = {
    off: 0.0,  // A/C off
    eco: 0.5,  // Moderate / Eco A/C: +0.5 L/100km
    max: 1.1,  // Max A/C / Heatwave: +1.1 L/100km
  };

  function computeEstimatedConsumption(baseL100, options) {
    if (baseL100 === null || baseL100 === undefined || isNaN(baseL100) || baseL100 <= 0) {
      return null;
    }
    const opts = options || {};
    const traffic = opts.traffic in TRAFFIC_FACTORS ? opts.traffic : 'mixed';
    const style   = opts.style in STYLE_FACTORS ? opts.style : 'normal';
    const load    = opts.load in LOAD_FACTORS ? opts.load : 'driver';
    const season  = opts.season in SEASON_FACTORS ? opts.season : 'mild';
    const ac      = opts.ac in AC_ADDITIONS ? opts.ac : 'off';

    const trafficFactor = TRAFFIC_FACTORS[traffic];
    const styleFactor   = STYLE_FACTORS[style];
    const loadFactor    = LOAD_FACTORS[load];
    const seasonFactor  = SEASON_FACTORS[season];
    const acAdd         = AC_ADDITIONS[ac];

    const adjustedWithoutAc = baseL100 * trafficFactor * styleFactor * loadFactor * seasonFactor;
    const totalL100 = Math.round((adjustedWithoutAc + acAdd) * 100) / 100;
    const diffFromBase = Math.round((totalL100 - baseL100) * 100) / 100;
    const percentDiff = Math.round(((totalL100 - baseL100) / baseL100) * 100);

    return {
      baseL100,
      totalL100,
      diffFromBase,
      percentDiff,
      trafficImpact: Math.round((baseL100 * (trafficFactor - 1)) * 100) / 100,
      acImpact: acAdd,
      styleImpact: Math.round((baseL100 * (styleFactor - 1)) * 100) / 100,
      loadImpact: Math.round((baseL100 * (loadFactor - 1)) * 100) / 100,
      seasonImpact: Math.round((baseL100 * (seasonFactor - 1)) * 100) / 100,
      options: { traffic, style, load, season, ac }
    };
  }

  const VEHICLE_DATABASE = [
    // Dacia
    { id: 'dacia_logan_tce', brand: 'Dacia', model: 'Logan 1.0 TCe (90 CP)', engine: '1.0 Benzină Turbo', fuel: 'B95', baseL100: 5.3 },
    { id: 'dacia_logan_ecog', brand: 'Dacia', model: 'Logan 1.0 ECO-G (100 CP)', engine: '1.0 GPL / Benzină', fuel: 'GPL', baseL100: 6.8 },
    { id: 'dacia_logan_dci', brand: 'Dacia', model: 'Logan 1.5 dCi (95 CP)', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.2 },
    { id: 'dacia_duster_dci', brand: 'Dacia', model: 'Duster 1.5 dCi 4x2', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.9 },
    { id: 'dacia_duster_tce', brand: 'Dacia', model: 'Duster 1.3 TCe 4x2', engine: '1.3 Benzină Turbo', fuel: 'B95', baseL100: 6.2 },
    { id: 'dacia_duster_4x4', brand: 'Dacia', model: 'Duster 1.5 dCi 4x4', engine: '1.5 Diesel 4x4', fuel: 'Diesel', baseL100: 5.5 },
    { id: 'dacia_sandero_stepway', brand: 'Dacia', model: 'Sandero Stepway 1.0 TCe', engine: '1.0 Benzină', fuel: 'B95', baseL100: 5.6 },
    { id: 'dacia_jogger_ecog', brand: 'Dacia', model: 'Jogger 1.0 ECO-G', engine: '1.0 GPL', fuel: 'GPL', baseL100: 7.6 },
    { id: 'dacia_jogger_hybrid', brand: 'Dacia', model: 'Jogger Hybrid 140', engine: '1.6 Hibrid', fuel: 'B95', baseL100: 4.7 },

    // Volkswagen
    { id: 'vw_golf_tdi', brand: 'Volkswagen', model: 'Golf 2.0 TDI (115/150 CP)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.4 },
    { id: 'vw_golf_tsi', brand: 'Volkswagen', model: 'Golf 1.5 TSI (130/150 CP)', engine: '1.5 Benzină Turbo', fuel: 'B95', baseL100: 5.4 },
    { id: 'vw_passat_tdi', brand: 'Volkswagen', model: 'Passat 2.0 TDI (150 CP)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.8 },
    { id: 'vw_tiguan_tdi', brand: 'Volkswagen', model: 'Tiguan 2.0 TDI', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 5.8 },
    { id: 'vw_polo_tsi', brand: 'Volkswagen', model: 'Polo 1.0 TSI (95 CP)', engine: '1.0 Benzină', fuel: 'B95', baseL100: 5.1 },

    // Skoda
    { id: 'skoda_octavia_tdi', brand: 'Skoda', model: 'Octavia 2.0 TDI (150 CP)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.3 },
    { id: 'skoda_octavia_tsi', brand: 'Skoda', model: 'Octavia 1.5 TSI (150 CP)', engine: '1.5 Benzină Turbo', fuel: 'B95', baseL100: 5.3 },
    { id: 'skoda_superb_tdi', brand: 'Skoda', model: 'Superb 2.0 TDI', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.9 },
    { id: 'skoda_fabia_tsi', brand: 'Skoda', model: 'Fabia 1.0 TSI', engine: '1.0 Benzină', fuel: 'B95', baseL100: 4.9 },
    { id: 'skoda_kodiaq_tdi', brand: 'Skoda', model: 'Kodiaq 2.0 TDI', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 6.1 },

    // Ford
    { id: 'ford_focus_ecoboost', brand: 'Ford', model: 'Focus 1.0 EcoBoost (125 CP)', engine: '1.0 Benzină Turbo', fuel: 'B95', baseL100: 5.5 },
    { id: 'ford_focus_ecoblue', brand: 'Ford', model: 'Focus 1.5 EcoBlue (120 CP)', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.5 },
    { id: 'ford_fiesta_ecoboost', brand: 'Ford', model: 'Fiesta 1.0 EcoBoost', engine: '1.0 Benzină', fuel: 'B95', baseL100: 5.0 },
    { id: 'ford_mondeo_tdci', brand: 'Ford', model: 'Mondeo 2.0 TDCi', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 5.1 },
    { id: 'ford_kuga_tdci', brand: 'Ford', model: 'Kuga 2.0 TDCi / EcoBlue', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 6.0 },

    // Renault
    { id: 'renault_clio_tce', brand: 'Renault', model: 'Clio 1.0 TCe (90 CP)', engine: '1.0 Benzină', fuel: 'B95', baseL100: 5.2 },
    { id: 'renault_clio_dci', brand: 'Renault', model: 'Clio 1.5 dCi', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.1 },
    { id: 'renault_megane_dci', brand: 'Renault', model: 'Megane 1.5 dCi', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.3 },
    { id: 'renault_megane_tce', brand: 'Renault', model: 'Megane 1.3 TCe (140 CP)', engine: '1.3 Benzină Turbo', fuel: 'B95', baseL100: 5.7 },
    { id: 'renault_captur_tce', brand: 'Renault', model: 'Captur 1.0 / 1.3 TCe', engine: '1.0/1.3 Benzină', fuel: 'B95', baseL100: 5.9 },

    // BMW
    { id: 'bmw_320d', brand: 'BMW', model: 'Seria 3 (320d F30/G20)', engine: '2.0 Diesel (190 CP)', fuel: 'Diesel', baseL100: 4.9 },
    { id: 'bmw_320i', brand: 'BMW', model: 'Seria 3 (320i)', engine: '2.0 Benzină Turbo', fuel: 'B95', baseL100: 6.4 },
    { id: 'bmw_520d', brand: 'BMW', model: 'Seria 5 (520d)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 5.3 },
    { id: 'bmw_118d', brand: 'BMW', model: 'Seria 1 (118d)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.6 },
    { id: 'bmw_x3_20d', brand: 'BMW', model: 'X3 xDrive20d', engine: '2.0 Diesel 4x4', fuel: 'Diesel', baseL100: 6.2 },

    // Audi
    { id: 'audi_a4_tdi', brand: 'Audi', model: 'A4 2.0 TDI (150/190 CP)', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.8 },
    { id: 'audi_a4_tfsi', brand: 'Audi', model: 'A4 2.0 TFSI (190 CP)', engine: '2.0 Benzină Turbo', fuel: 'B95', baseL100: 6.5 },
    { id: 'audi_a3_tdi', brand: 'Audi', model: 'A3 2.0 TDI', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.4 },
    { id: 'audi_a6_tdi', brand: 'Audi', model: 'A6 2.0 TDI', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 5.4 },
    { id: 'audi_q5_tdi', brand: 'Audi', model: 'Q5 2.0 TDI', engine: '2.0 Diesel 4x4', fuel: 'Diesel', baseL100: 6.3 },

    // Mercedes-Benz
    { id: 'merc_c220d', brand: 'Mercedes-Benz', model: 'Clasa C 220d', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 4.9 },
    { id: 'merc_e220d', brand: 'Mercedes-Benz', model: 'Clasa E 220d', engine: '2.0 Diesel', fuel: 'Diesel', baseL100: 5.3 },
    { id: 'merc_a180d', brand: 'Mercedes-Benz', model: 'Clasa A 180d', engine: '1.5/2.0 Diesel', fuel: 'Diesel', baseL100: 4.4 },

    // Toyota
    { id: 'toyota_corolla_hybrid', brand: 'Toyota', model: 'Corolla 1.8 Hybrid', engine: '1.8 Hibrid', fuel: 'B95', baseL100: 4.4 },
    { id: 'toyota_yaris_hybrid', brand: 'Toyota', model: 'Yaris 1.5 Hybrid', engine: '1.5 Hibrid', fuel: 'B95', baseL100: 3.8 },
    { id: 'toyota_rav4_hybrid', brand: 'Toyota', model: 'RAV4 2.5 Hybrid', engine: '2.5 Hibrid', fuel: 'B95', baseL100: 5.6 },
    { id: 'toyota_chr_hybrid', brand: 'Toyota', model: 'C-HR 1.8 Hybrid', engine: '1.8 Hibrid', fuel: 'B95', baseL100: 4.8 },

    // Hyundai & Kia
    { id: 'hyundai_tucson_crdi', brand: 'Hyundai', model: 'Tucson 1.6 CRDi / T-GDI', engine: '1.6 Diesel/Benzină', fuel: 'Diesel', baseL100: 6.2 },
    { id: 'hyundai_i30_crdi', brand: 'Hyundai', model: 'i30 1.6 CRDi', engine: '1.6 Diesel', fuel: 'Diesel', baseL100: 4.5 },
    { id: 'hyundai_i30_tgdi', brand: 'Hyundai', model: 'i30 1.0 / 1.5 T-GDI', engine: '1.0/1.5 Benzină', fuel: 'B95', baseL100: 5.8 },
    { id: 'kia_ceed_crdi', brand: 'Kia', model: 'Ceed 1.6 CRDi', engine: '1.6 Diesel', fuel: 'Diesel', baseL100: 4.5 },
    { id: 'kia_sportage', brand: 'Kia', model: 'Sportage 1.6 CRDi / T-GDI', engine: '1.6 Diesel/Benzină', fuel: 'Diesel', baseL100: 6.3 },

    // Opel & Peugeot
    { id: 'opel_astra_cdti', brand: 'Opel', model: 'Astra 1.5 / 1.6 CDTI', engine: '1.5/1.6 Diesel', fuel: 'Diesel', baseL100: 4.5 },
    { id: 'opel_astra_turbo', brand: 'Opel', model: 'Astra 1.2 / 1.4 Turbo', engine: '1.2/1.4 Benzină', fuel: 'B95', baseL100: 5.5 },
    { id: 'peugeot_208_puretech', brand: 'Peugeot', model: '208 1.2 PureTech', engine: '1.2 Benzină', fuel: 'B95', baseL100: 5.0 },
    { id: 'peugeot_308_bluehdi', brand: 'Peugeot', model: '308 1.5 BlueHDi', engine: '1.5 Diesel', fuel: 'Diesel', baseL100: 4.4 },

    // Categorii generale (Generic Categories)
    { id: 'cat_city_gas', brand: 'Categorii generale', model: 'Mașină Mică Oraș (1.0-1.2L Benzină)', engine: 'Benzină', fuel: 'B95', baseL100: 5.2 },
    { id: 'cat_compact_gas', brand: 'Categorii generale', model: 'Compactă Benzină (1.4-1.6L)', engine: 'Benzină', fuel: 'B95', baseL100: 6.2 },
    { id: 'cat_compact_diesel', brand: 'Categorii generale', model: 'Compactă Diesel (1.6-2.0L)', engine: 'Diesel', fuel: 'Diesel', baseL100: 4.6 },
    { id: 'cat_sedan_gas', brand: 'Categorii generale', model: 'Sedan / Break Benzină', engine: 'Benzină', fuel: 'B95', baseL100: 7.0 },
    { id: 'cat_sedan_diesel', brand: 'Categorii generale', model: 'Sedan / Break Diesel', engine: 'Diesel', fuel: 'Diesel', baseL100: 5.2 },
    { id: 'cat_suv_gas', brand: 'Categorii generale', model: 'SUV / Crossover Benzină', engine: 'Benzină', fuel: 'B95', baseL100: 7.5 },
    { id: 'cat_suv_diesel', brand: 'Categorii generale', model: 'SUV / Crossover Diesel', engine: 'Diesel', fuel: 'Diesel', baseL100: 6.2 },
    { id: 'cat_hybrid_gas', brand: 'Categorii generale', model: 'Hibrid Benzină (Full Hybrid)', engine: 'Hibrid', fuel: 'B95', baseL100: 4.6 }
  ];

  // Globals used by app.js (kept in global scope so existing references work).
  global.parseNum                    = parseNum;
  global.toL100                      = toL100;
  global.CONSUM_PLACEHOLDER          = CONSUM_PLACEHOLDER;
  global.CONSUM_LABEL                = CONSUM_LABEL;
  global.normalizeFuelType           = normalizeFuelType;
  global.mergeFuelPrices             = mergeFuelPrices;
  global.TRAFFIC_FACTORS             = TRAFFIC_FACTORS;
  global.AC_ADDITIONS                = AC_ADDITIONS;
  global.STYLE_FACTORS               = STYLE_FACTORS;
  global.LOAD_FACTORS                = LOAD_FACTORS;
  global.SEASON_FACTORS              = SEASON_FACTORS;
  global.computeEstimatedConsumption = computeEstimatedConsumption;
  global.VEHICLE_DATABASE            = VEHICLE_DATABASE;

  // Namespace used by the Node unit tests (tests/core.test.js).
  global.FuelCore = {
    parseNum,
    toL100,
    computeCore,
    CONSUM_PLACEHOLDER,
    CONSUM_LABEL,
    normalizeFuelType,
    mergeFuelPrices,
    TRAFFIC_FACTORS,
    AC_ADDITIONS,
    STYLE_FACTORS,
    LOAD_FACTORS,
    SEASON_FACTORS,
    computeEstimatedConsumption,
    VEHICLE_DATABASE
  };
})(typeof window !== 'undefined' ? window : globalThis);
