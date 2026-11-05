// ==================== SolarGo: Core Calculator Engine ====================
// Berisi model data kota, mesin kalkulasi fisika, dan pembaruan grafik SVG.

// Data model kota (Iradiasi rata-rata kWh/m2/hari & latitude)
const LOCATION_METRICS = {
  jakarta: { name: 'Jakarta', irrad: 4.65, lat: -6.2, tempAvg: 31.5 },
  surabaya: { name: 'Surabaya', irrad: 4.90, lat: -7.2, tempAvg: 33.0 },
  bali: { name: 'Bali', irrad: 5.05, lat: -8.6, tempAvg: 30.8 },
  bandung: { name: 'Bandung', irrad: 4.35, lat: -6.9, tempAvg: 25.5 },
  medan: { name: 'Medan', irrad: 4.45, lat: 3.5, tempAvg: 31.0 },
  makassar: { name: 'Makassar', irrad: 4.85, lat: -5.1, tempAvg: 31.8 }
};

// Format Rupiah
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format tampilan slider tagihan
function updateBillDisplay(val) {
  const el = document.getElementById('billDisplay');
  if (el) {
    el.textContent = formatIDR(val);
  }
}

// Toggle panel detail ilmiah
function toggleScientificDetails() {
  const body = document.getElementById('scientificDetailsBody');
  const chevron = document.getElementById('toggleChevron');
  if (!body) return;

  const isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    if (chevron) chevron.classList.add('rotate-180');
  } else {
    body.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
  }
}

// Helper perbarui elemen DOM dengan aman
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function safeSetHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ==================== Main Scientific Calculation Engine ====================
function runSimulation(showNotice = false) {
  // 1. Ambil Parameter Pengguna
  const locSelect = document.getElementById('inputLocation');
  const locKey = locSelect ? locSelect.value : 'jakarta';
  const locData = LOCATION_METRICS[locKey] || LOCATION_METRICS.jakarta;

  const plnCapacityRadio = document.querySelector('input[name="plnCapacity"]:checked');
  const plnVA = plnCapacityRadio ? parseFloat(plnCapacityRadio.value) : 4400;

  const billInput = document.getElementById('inputBill');
  const billAmount = billInput ? parseFloat(billInput.value) || 2500000 : 2500000;

  const roofInput = document.getElementById('inputRoofArea');
  const roofArea = roofInput ? parseFloat(roofInput.value) || 45 : 45;

  const loadProfileRadio = document.querySelector('input[name="profileLoad"]:checked');
  const isDayDominant = loadProfileRadio ? loadProfileRadio.value === 'day' : true;

  // 2. Rumus Fisika Surya & Meteorologi
  // Estimasi hari dalam setahun n = 105 (pertengahan April untuk simulasi tipikal tropis)
  const dayOfYear = 105;
  // Deklinasi delta = 23.45 * sin( (360/365)*(284 + n) )
  const rad = Math.PI / 180;
  const declination = 23.45 * Math.sin(((360 / 365) * (284 + dayOfYear)) * rad);

  // Sudut Zenith perkiraan siang di ekuator: theta_z approx |lat - delta|
  const zenithAngle = Math.abs(locData.lat - declination);
  // Air Mass: AM = 1 / cos(theta_z)
  const airMass = 1 / Math.cos(zenithAngle * rad);

  // Penurunan kinerja akibat suhu sel (Derating Suhu Modul Pmax)
  // T_sel = T_ambient + (NOCT - 20)/800 * G_poa (di mana NOCT ~ 45C, G_poa ~ 800 W/m2) -> T_sel ~ T_ambient + 25C
  const ambientTemp = locData.tempAvg;
  const cellTemp = ambientTemp + 20; // Sel surya tropis beroperasi di ~48-52 C saat terik
  const gammaPmax = -0.0035; // -0.35% per derajat celcius di atas 25C STC
  const tempDeratingLoss = gammaPmax * (cellTemp - 25); // sekitar -0.07 hingga -0.09 (-7% s/d -9%)

  // 3. Estimasi Kebutuhan Energi
  // Tarif PLN R-1/R-2/B-2 ~ Rp 1.444,70 / kWh hingga Rp 1.699 / kWh
  const tariffPerKwh = plnVA >= 6600 ? 1699.53 : 1444.70;
  const monthlyKwh = billAmount / tariffPerKwh;
  const dailyKwh = monthlyKwh / 30;

  // 4. Zero-Export Optimization & Batasan Fisik Permen ESDM No. 2/2024
  // Modul 550 Wp (~2.5 m² per panel dengan spacing)
  const maxPanelsByRoof = Math.floor(roofArea / 2.6);

  // Target produksi harian diselaraskan dengan profil konsumsi siang
  // Jika Day Dominant: 75%-85% serapan mandiri, Night Dominant: 35%-45% serapan mandiri (tanpa BESS)
  const selfConsumptionRatio = isDayDominant ? 0.82 : 0.42;
  const targetDailySolarKwh = dailyKwh * (isDayDominant ? 0.70 : 0.45);

  // Kebutuhan kWp = Target kWh harian / (Peak Sun Hours harian * (1 + tempDeratingLoss) * SystemPR ~0.80)
  const effectivePsh = locData.irrad * (1 + tempDeratingLoss) * 0.82; // PR ~82%
  let calculatedKwp = targetDailySolarKwh / effectivePsh;

  // Batasi kWp tidak melebihi kapasitas inverter & kapasitas terpasang PLN (VA)
  const maxKwpAllowedByPLN = (plnVA / 1000) * 1.15; // Rasio DC/AC inverter 1.15
  calculatedKwp = Math.min(calculatedKwp, maxKwpAllowedByPLN);

  // Batasi kWp terhadap luas atap riil
  const maxKwpByRoof = maxPanelsByRoof * 0.55; // 550Wp = 0.55 kWp
  if (calculatedKwp > maxKwpByRoof && maxKwpByRoof > 0.5) {
    calculatedKwp = maxKwpByRoof;
  }

  // Pastikan minimal 1.1 kWp (2 panel)
  calculatedKwp = Math.max(1.1, Math.round(calculatedKwp * 10) / 10);
  const totalPanels = Math.ceil((calculatedKwp * 1000) / 550);

  // Produksi bulanan riil terpakai
  const monthlySolarGeneratedKwh = calculatedKwp * locData.irrad * 30 * 0.82 * (1 + tempDeratingLoss);
  const usefulMonthlyKwh = monthlySolarGeneratedKwh * selfConsumptionRatio;

  // Penghematan Tagihan Bulanan (Rp)
  const monthlySavings = Math.min(billAmount * 0.78, usefulMonthlyKwh * tariffPerKwh);
  const savingPercentage = Math.round((monthlySavings / billAmount) * 100);

  // Biaya Investasi CAPEX (rata-rata Rp 12.5 - 14 juta per kWp turnkey di Indonesia)
  const capexMin = calculatedKwp * 12200000;
  const capexMax = calculatedKwp * 13800000;
  const capexAvg = (capexMin + capexMax) / 2;

  // Payback Period (Tahun)
  const paybackYears = capexAvg / (monthlySavings * 12);
  const lifetimeSavings = (monthlySavings * 12 * 25) - capexAvg;

  // Reduksi Emisi Karbon (Grid Emission Factor Jamali / Luar Jawa ~ 0.79 kg CO2e / kWh)
  const carbonOffsetYearlyTon = (monthlySolarGeneratedKwh * 12 * 0.79) / 1000;

  // 5. UPDATE TAMPILAN DASHBOARD HASIL
  safeSetText('resMonthlySaving', formatIDR(monthlySavings));
  safeSetText('resSavingPercentage', `-${savingPercentage}%`);
  safeSetHtml('resKwp', `${calculatedKwp.toFixed(2)} <span class="text-xs font-normal">kWp</span>`);
  safeSetText('resModuleCount', `${totalPanels} Modul Monokristalin 550Wp`);
  safeSetHtml('resPayback', `${paybackYears.toFixed(1)} <span class="text-xs font-normal">Tahun</span>`);
  safeSetHtml('resCarbon', `${carbonOffsetYearlyTon.toFixed(1)} <span class="text-xs font-normal">Ton CO₂e/th</span>`);
  safeSetText('resCapex', `${formatIDR(capexMin)} - ${formatIDR(capexMax)}`);
  safeSetText('resLifetimeSavings', formatIDR(lifetimeSavings));

  // Update Detail Matematika & Fisika
  safeSetText('mathDeclination', `${declination.toFixed(1)}°`);
  safeSetText('mathAirMass', `${airMass.toFixed(2)} AM`);
  safeSetText('mathCellTemp', `${cellTemp.toFixed(1)}°C`);
  safeSetText('mathDeratingLoss', `${(tempDeratingLoss * 100).toFixed(2)}% vs STC`);

  // Update Status Permen ESDM & BESS
  const bessBadge = document.getElementById('bessBadge');
  const zeroExportText = document.getElementById('zeroExportText');
  if (isDayDominant) {
    if (zeroExportText) zeroExportText.innerHTML = 'Efisiensi Serapan Mandiri: <strong>82% Terkonsumsi Langsung</strong>';
    if (bessBadge) {
      bessBadge.textContent = 'BESS Opsional';
      bessBadge.className = 'text-[11px] font-semibold text-sage-700 bg-sage-100 px-2 py-0.5 rounded-md';
    }
  } else {
    if (zeroExportText) zeroExportText.innerHTML = 'Efisiensi Serapan Mandiri: <strong>42% (Tanpa Baterai)</strong>';
    if (bessBadge) {
      bessBadge.textContent = 'Direkomendasikan Modul BESS Litium';
      bessBadge.className = 'text-[11px] font-semibold text-clay bg-orange-50 px-2 py-0.5 rounded-md';
    }
  }

  // Update Grafik Beban SVG secara dinamis
  updateDynamicChart(isDayDominant, calculatedKwp);

  if (showNotice && typeof showToast === 'function') {
    showToast('Model kalkulasi fisika berhasil diperbarui!');
  }
}

// Dynamic Chart Adjuster
function updateDynamicChart(isDayDominant, kwp) {
  const loadLine = document.getElementById('svgLoadLine');
  const loadArea = document.getElementById('svgLoadArea');
  if (!loadLine || !loadArea) return;

  if (isDayDominant) {
    // Puncak beban berada di siang hari (jam 11-15) bersesuaian dengan surya
    loadLine.setAttribute('d', 'M 0 115 Q 120 100, 200 45 T 300 45 T 500 115');
    loadArea.setAttribute('d', 'M 0 115 Q 120 100, 200 45 T 300 45 T 500 115 L 500 140 L 0 140 Z');
  } else {
    // Beban siang rendah, melonjak saat malam (jam 18-23)
    loadLine.setAttribute('d', 'M 0 65 Q 150 115, 250 115 T 400 35 T 500 50');
    loadArea.setAttribute('d', 'M 0 65 Q 150 115, 250 115 T 400 35 T 500 50 L 500 140 L 0 140 Z');
  }
}

// Global exposure
window.LOCATION_METRICS = LOCATION_METRICS;
window.formatIDR = formatIDR;
window.updateBillDisplay = updateBillDisplay;
window.toggleScientificDetails = toggleScientificDetails;
window.runSimulation = runSimulation;
window.updateDynamicChart = updateDynamicChart;
