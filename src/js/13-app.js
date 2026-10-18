// =========================================================================
// 13-APP.JS — Асосий инициализация ва Event Listeners
// «КОМПЛАЕНС-КАДР» v11.7
// =========================================================================

async function initApp() {
  console.log("🚀 «КОМПЛАЕНС-КАДР» v11.7 ишга тушмоқда...");
  console.log("=".repeat(60));

  try {
    appState = loadState();
    console.log(`📊 Стейт юкланди: ${appState.candidates.length} та номзод, ${appState.users.length} та фойдаланувчи`);

    if (typeof loadNotifications === "function") {
      loadNotifications();
      console.log(`🔔 Уведомлениялар: ${notificationsList.length} та`);
    }

    if (typeof migrateAllPasswords === "function") {
      await migrateAllPasswords();
    }

    if (typeof initUI === "function") {
      initUI();
      console.log("🎨 UI созламалари тайёр");
    }

    populateRegionSelects();
    console.log("📍 Ҳудуд селектлари тайёр");

    setupAllEventListeners();
    console.log("🎯 Event listener'лар боғланди");

    const cfg = getSupabaseConfig();
    const urlInput = document.getElementById("inpSupabaseUrl");
    const keyInput = document.getElementById("inpSupabaseKey");
    if (urlInput) urlInput.value = cfg.url;
    if (keyInput) keyInput.value = cfg.key;

    const hasSession = checkSession();

    if (typeof initRealtime === "function") {
      initRealtime();
      console.log("⚡ Realtime ишга тушди");
    }

    if (typeof autoLoadFromDDrive === "function") {
      await autoLoadFromDDrive();
    }

    if (typeof checkDDriveStatus === "function") {
      await checkDDriveStatus();
    }

    renderAll();
    console.log("🖼 Жадваллар чизилди");

    if (typeof pullFromSupabase === "function") {
      pullFromSupabase(false);
    }

    if (hasSession && currentUser) {
      document.getElementById("loginOverlay").classList.add("hidden");
      switchRole(currentUser.role);
      console.log(`✅ Автоматик кириш: ${currentUser.login}`);
      if (typeof showToast === "function") {
        showToast(`Хуш келибсиз, ${currentUser.name}!`, "success");
      }
      
      // 🆕 QR KOD ORQALI KIRGANDA AVTOMATIK QIDIRISH
      handleQrSearch();

    } else {
      showLoginScreen();
    }

    console.log("=".repeat(60));
    console.log("✅ «КОМПЛАЕНС-КАДР» v11.7 тайёр!");

  } catch (e) {
    console.error("❌ Инициализацияда хато:", e);
    alert("Дастурни ишга туширишда хато:\n\n" + e.message);
  }
}

// 🆕 QR KODDAN KELGAN HAVOLANI TEKSHIRISH VA HUJJATNI OCHISH
function handleQrSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  
  if (searchQuery) {
    // URL dagi qidiruv so'zini tozalash (chalg'imasligi uchun)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Ma'lumotlar to'liq yuklanishi uchun 1 soniya kutamiz
    setTimeout(() => {
      const foundCand = appState.candidates.find(c => 
        c.reestrNo === searchQuery || c.pinfl === searchQuery
      );
      
      if (foundCand) {
        // Agar topilsa, hujjatni ochamiz
        if (typeof openDocModal === "function") {
          openDocModal(foundCand.id);
        }
      } else {
        if (typeof showToast === "function") {
          showToast("⚠️ QR код бўйича маълумот топилмади", "warning");
        }
      }
    }, 1000);
  }
}

function showLoginScreen() {
  const overlay = document.getElementById("loginOverlay");
  const username = document.getElementById("loginUsername");
  const password = document.getElementById("loginPassword");
  const error = document.getElementById("loginError");

  if (overlay) overlay.classList.remove("hidden");
  if (username) {
    username.value = "";
    setTimeout(() => username.focus(), 100);
  }
  if (password) password.value = "";
  if (error) error.classList.add("hidden");
}

function setupAllEventListeners() {
  setupLoginListeners();
  setupCandidateFormListeners();
  setupUserFormListeners();
  setupFilterListeners();
  setupSubtabListeners();
  setupInputFormattingListeners();
  console.log("✅ Барча event listener'лар боғланди");
}

function setupLoginListeners() {
  const loginBtn = document.getElementById("btnLoginSubmit");
  const loginPass = document.getElementById("loginPassword");
  const loginUser = document.getElementById("loginUsername");

  if (loginBtn) loginBtn.addEventListener("click", performLogin);

  if (loginPass) {
    loginPass.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); performLogin(); }
    });
  }

  if (loginUser) {
    loginUser.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); if (loginPass) loginPass.focus(); }
    });
  }
}

function setupCandidateFormListeners() {
  const candForm = document.getElementById("candidateForm");
  if (candForm) candForm.addEventListener("submit", handleCandidateFormSubmit);

  if (typeof setupHeadingFieldTracking === "function") {
    setupHeadingFieldTracking();
    console.log("📝 Сарлавҳа превьюси tracking ёқилди");
  }

  const pinflInput = document.getElementById("inpPinfl");
  if (pinflInput) pinflInput.addEventListener("input", checkPinflDuplicate);

  const recTypeSel = document.getElementById("inpRecordType");
  if (recTypeSel && typeof updateHeadingPreview === "function") {
    recTypeSel.addEventListener("change", () => {
      try { updateHeadingPreview(); } catch (e) { console.error("updateHeadingPreview error:", e); }
    });
  }
}

function setupUserFormListeners() {
  const userForm = document.getElementById("userCreateForm");
  if (userForm) userForm.addEventListener("submit", handleUserCreateSubmit);
}

function setupFilterListeners() {
  const filters = [
    "fotoRegionFilter","fotoCategoryFilter","formerRegionFilter",
    "dbRegionFilter","dbCategoryFilter","dbYearFilter","dbMonthFilter","dbStatusFilter"
  ];

  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => { if (typeof renderAll === "function") renderAll(); });
  });

  const searchInput = document.getElementById("dbSearchInput");
  if (searchInput) searchInput.addEventListener("input", () => { if (typeof renderAll === "function") renderAll(); });

  const itsFilter = document.getElementById("itsFilterStatus");
  if (itsFilter) itsFilter.addEventListener("change", () => { if (typeof renderAll === "function") renderAll(); });
}

function setupSubtabListeners() {
  const subtabNew = document.getElementById("subtabNew");
  const subtabInProcess = document.getElementById("subtabInProcess");
  const subtabApproved = document.getElementById("subtabApproved");

  if (subtabNew) subtabNew.addEventListener("click", () => switchSubTab("new"));
  if (subtabInProcess) subtabInProcess.addEventListener("click", () => switchSubTab("in_process"));
  if (subtabApproved) subtabApproved.addEventListener("click", () => switchSubTab("approved"));
}

function setupInputFormattingListeners() {
  setupDateInput("inpBirthDate");
  setupPinflInput("inpPinfl");
  setupPassportInputs("inpPassSeries", "inpPassNum");

  setupDateInput("editCandBirthDate");
  setupPinflInput("editCandPinfl");
  setupPassportInputs("editCandPassSeries", "editCandPassNum");

  console.log("✅ Input форматлаш созланди");
}

function setupModalBackdropClose() {
  document.addEventListener("click", (e) => {
    const modalIds = ["editorModal", "docModal", "editCandidateModal", "aboutModal"];
    modalIds.forEach(id => {
      const modal = document.getElementById(id);
      if (modal && !modal.classList.contains("hidden") && e.target === modal) {
        if (id === "editorModal" && typeof closeEditorModal === "function") closeEditorModal();
        if (id === "docModal" && typeof closeDocModal === "function") closeDocModal();
        if (id === "editCandidateModal" && typeof closeEditCandidateModal === "function") closeEditCandidateModal();
        if (id === "aboutModal" && typeof closeAboutModal === "function") closeAboutModal();
      }
    });
  });
}

function showVersion() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  «КОМПЛАЕНС-КАДР» v11.7                              ║
║  Кадастр агентлиги учун ягона комплаенс тизими       ║
║  ─────────────────────────────────────────────────   ║
║  Яратувчи: Elbegiyev Muxriddin                       ║
║  Алоқа:    +998 33 911 22 22                         ║
╚══════════════════════════════════════════════════════╝
  `);
}

function checkAppHealth() {
  const issues = [];
  if (!appState) issues.push("❌ appState юкланмаган");
  if (!appState || !Array.isArray(appState.users)) issues.push("❌ users массиви йўқ");
  if (!appState || !Array.isArray(appState.candidates)) issues.push("❌ candidates массиви йўқ");

  const criticalFunctions = [
    "performLogin","doLogout","switchRole","switchTab","renderAll",
    "openDocModal","openEditorModal","pushToSupabase","pullFromSupabase","initRealtime",
    "buildDistrictHeading","updateHeadingPreview","getFinalHeading",
    "latToCyr","validateDate","validateFIO"
  ];
  criticalFunctions.forEach(fn => {
    if (typeof window[fn] !== "function") issues.push(`❌ Функция йўқ: ${fn}()`);
  });

  const criticalElements = [
    "loginOverlay","loginUsername","loginPassword","kpiTotal","fototablitsaBody",
    "docModal","editorModal","candidateForm","inpDistrictHeading","inpDistrict","inpRegion","inpCategory"
  ];
  criticalElements.forEach(id => {
    if (!document.getElementById(id)) issues.push(`❌ DOM элемент йўқ: #${id}`);
  });

  return issues;
}

// 🆕 KADR VA BOSHQA ROLNIG TIZIMGA KIRISHIDAGI HUQUQLARINI KUCHAYTIRISH
// Yagona Baza va Sudlanganlar tablarini HR (Kadrlar)ga ham ochish
const origSwitchRole = window.switchRole;
window.switchRole = function(role) {
  if (origSwitchRole) origSwitchRole(role);
  
  // Ruxsatlarni tekshirish va tablarni ochish
  if (role === 'kadr' || role === 'rahbar' || role === 'korrupsiya') {
    const tabDb = document.getElementById('tabBtnDatabase');
    const tabNeg = document.getElementById('tabBtnNegative');
    if (tabDb) tabDb.style.display = 'block';
    if (tabNeg) tabNeg.style.display = 'block';
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupModalBackdropClose();
    showVersion();
    initApp();
  });
} else {
  setupModalBackdropClose();
  showVersion();
  initApp();
}

window.addEventListener("error", (e) => {
  console.error("❌ Глобал хато:", e.error || e.message);
  if (e.error && e.error.message) console.error("Хато тафсилоти:", e.error.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("❌ Ушланмаган Promise:", e.reason);
});

console.log("✅ 13-app.js юкланди (v11.7)");
