// ==================== SolarGo: App Bootstrap ====================
// Titik masuk aplikasi: inisialisasi ikon, binding event, dan kalkulasi awal.

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  if (typeof bindUIEvents === 'function') {
    bindUIEvents();
  }
  if (typeof runSimulation === 'function') {
    runSimulation();
  }
});
