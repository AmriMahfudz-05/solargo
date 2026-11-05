# SolarGo — Platform Pintar & Mandiri PLTS Atap

Platform simulasi dan tender transisi energi bersih untuk perhitungan kelayakan PLTS Atap residensial dan komersial di Indonesia, disesuaikan dengan skema mandiri (*zero-export*) berdasarkan **Permen ESDM No. 2 Tahun 2024**.

## Fitur Utama

- **Interactive Solar Solver & ROI Calculator**:
  - Simulasi kebutuhan kapasitas PV (kWp) berdasarkan data radiasi BMKG & NASA POWER (Jakarta, Surabaya, Bali, Bandung, Medan, Makassar).
  - Model derating suhu sel surya tropis (NOCT), sudut deklinasi surya, dan Air Mass (AM).
  - Penyesuaian profil konsumsi daya harian (Dominan Siang vs Malam / Modul BESS Litium).
  - Estimasi CAPEX EPC Turnkey, Payback Period, dan reduksi emisi karbon (ton CO₂e/tahun).
- **Visualisasi Kurva Sinkronisasi Beban (Zero-Export)**:
  - Grafik SVG 24 jam interaktif yang menyesuaikan secara dinamis terhadap profil beban dan kapasitas kWp.
- **Tender Kontraktor EPC Resmi**:
  - Kurasi mitra kontraktor berizin IUJPTL & tenaga ahli ber-SKTTK Kementerian ESDM.
- **Konsultasi Independen**:
  - Alur penjadwalan evaluasi DED bersama Lead Engineer independen bebas bias vendor.
- **Arsitektur Modular & Aman**:
  - Dilengkapi *Content Security Policy* (CSP) ketat untuk mencegah serangan XSS.
  - Bebas *inline scripts* dan *inline event handlers* (`onclick`/`onchange`).
  - Pemisahan berkas terstruktur (HTML, CSS, dan modul JS).

## Struktur Berkas

```
solargo/
├── index.html                  # Struktur markup utama
├── assets/
│   ├── css/
│   │   └── style.css           # Styling kustom, animasi pulse, dan slider
│   └── js/
│       ├── tailwind-config.js  # Ekstensi tema Tailwind CSS
│       ├── calculator.js       # Core engine kalkulasi fisika & tarif PLN
│       ├── ui.js               # Handler interaksi modal, toast, & event listener
│       └── main.js             # Bootstrap inisialisasi aplikasi
└── README.md
```

## Cara Menjalankan

Cukup buka `index.html` langsung di peramban web modern, atau jalankan melalui static server:
```bash
npx serve .
```
atau
```bash
python3 -m http.server 8080
```
