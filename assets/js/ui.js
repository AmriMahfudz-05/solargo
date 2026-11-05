// ==================== SolarGo: UI Helpers & Event Dispatcher ====================
// Modals, Toast, and event listeners (replacing all inline HTML event handlers).

let toastTimer = null;

// Tampilkan notifikasi toast dengan non-blocking timeout
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove('translate-y-24', 'opacity-0');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toastTimer = null;
  }, 3500);
}

// Logika Modal Konsultasi
function openConsultationModal() {
  const modal = document.getElementById('modalConsultation');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeConsultationModal() {
  const modal = document.getElementById('modalConsultation');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function confirmBooking() {
  closeConsultationModal();
  showToast('Permintaan sesi berhasil. Tim Engineer kami akan menghubungi via WhatsApp!');
}

// Logika Modal Tender EPC
function requestQuote(vendorName) {
  const label = document.getElementById('tenderVendorName');
  if (label) {
    label.textContent = `Kontraktor Terpilih: ${vendorName}`;
  }
  const modal = document.getElementById('modalTender');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeTenderModal() {
  const modal = document.getElementById('modalTender');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function confirmTenderRequest() {
  closeTenderModal();
  showToast('Permintaan tender & DED berhasil dikirimkan ke kontraktor!');
}

// Central UI Event Binder
function bindUIEvents() {
  // 1. Tombol dengan atribut [data-action]
  document.querySelectorAll('[data-action]').forEach(el => {
    const action = el.getAttribute('data-action');
    el.addEventListener('click', (e) => {
      // Jika tombol submit di dalam form atau link dengan href spesifik, tangani dengan hati-hati
      if (el.tagName.toLowerCase() === 'a' && el.getAttribute('href')?.startsWith('#')) {
        // Biarkan anchor link normal jika href merujuk ID lain
        if (action === 'open-consultation' || action === 'open-tender') {
          e.preventDefault();
        }
      } else if (el.tagName.toLowerCase() === 'button') {
        e.preventDefault();
      }

      switch (action) {
        case 'open-consultation':
          openConsultationModal();
          break;
        case 'close-consultation':
          closeConsultationModal();
          break;
        case 'confirm-booking':
          confirmBooking();
          break;
        case 'open-tender': {
          const vendor = el.getAttribute('data-vendor') ||
            el.closest('[data-vendor]')?.getAttribute('data-vendor') ||
            'Tier-1 EPC Partner';
          requestQuote(vendor);
          break;
        }
        case 'close-tender':
          closeTenderModal();
          break;
        case 'confirm-tender':
          confirmTenderRequest();
          break;
        case 'recalc':
          if (typeof runSimulation === 'function') {
            runSimulation(true);
          }
          break;
        case 'toggle-science':
          if (typeof toggleScientificDetails === 'function') {
            toggleScientificDetails();
          }
          break;
        default:
          break;
      }
    });
  });

  // 2. Elemen input reaktif [data-simulate]
  document.querySelectorAll('[data-simulate]').forEach(el => {
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();

    if (el.id === 'inputBill') {
      el.addEventListener('input', () => {
        if (typeof updateBillDisplay === 'function') {
          updateBillDisplay(el.value);
        }
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
    } else if (type === 'range') {
      el.addEventListener('input', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
    } else if (type === 'number') {
      el.addEventListener('input', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
      el.addEventListener('change', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
    } else if (tag === 'select' || type === 'radio' || type === 'checkbox') {
      el.addEventListener('change', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
    } else {
      el.addEventListener('change', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
      el.addEventListener('input', () => {
        if (typeof runSimulation === 'function') {
          runSimulation();
        }
      });
    }
  });

  // Fallback bindings jika input tidak memiliki data-simulate
  const billInput = document.getElementById('inputBill');
  if (billInput && !billInput.hasAttribute('data-simulate')) {
    billInput.addEventListener('input', () => {
      if (typeof updateBillDisplay === 'function') updateBillDisplay(billInput.value);
      if (typeof runSimulation === 'function') runSimulation();
    });
  }
  const locInput = document.getElementById('inputLocation');
  if (locInput && !locInput.hasAttribute('data-simulate')) {
    locInput.addEventListener('change', () => {
      if (typeof runSimulation === 'function') runSimulation();
    });
  }
  const roofInput = document.getElementById('inputRoofArea');
  if (roofInput && !roofInput.hasAttribute('data-simulate')) {
    roofInput.addEventListener('input', () => {
      if (typeof runSimulation === 'function') runSimulation();
    });
    roofInput.addEventListener('change', () => {
      if (typeof runSimulation === 'function') runSimulation();
    });
  }
  document.querySelectorAll('input[name="plnCapacity"], input[name="profileLoad"]').forEach(radio => {
    if (!radio.hasAttribute('data-simulate')) {
      radio.addEventListener('change', () => {
        if (typeof runSimulation === 'function') runSimulation();
      });
    }
  });

  // 3. Modal Backdrop Click untuk menutup modal
  const modals = [
    { id: 'modalConsultation', close: closeConsultationModal },
    { id: 'modalTender', close: closeTenderModal }
  ];
  modals.forEach(({ id, close }) => {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          close();
        }
      });
    }
  });

  // 4. Keyboard Escape untuk menutup modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeConsultationModal();
      closeTenderModal();
    }
  });
}

// Global exposure
window.showToast = showToast;
window.openConsultationModal = openConsultationModal;
window.closeConsultationModal = closeConsultationModal;
window.confirmBooking = confirmBooking;
window.requestQuote = requestQuote;
window.closeTenderModal = closeTenderModal;
window.confirmTenderRequest = confirmTenderRequest;
window.bindUIEvents = bindUIEvents;
