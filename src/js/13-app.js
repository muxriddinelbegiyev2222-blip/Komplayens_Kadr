// =========================================================================
// 13-APP.JS — Асосий инициализация ва Event Listeners
// «КОМПЛАЕНС-КАДР» v9.0
// ЭНГ ОХИРГИ МОДУЛ — барча модулларни боғлайди
// =========================================================================

// =========================================================================
// АСОСИЙ ИНИЦИАЛИЗАЦИЯ
// =========================================================================

async function initApp() {
  console.log("🚀 «КОМПЛАЕНС-КАДР» v9.0 ишга тушмоқда...");
  console.log("=".repeat(60));

  try {
    // ============ 1. СТЕЙТНИ ЮКЛАШ ============
    appState = loadState();
    console.log(`📊 Стейт юкланди: ${appState.candidates.length} та номзод, ${appState.users.length} та фойдаланувчи`);

    // ============ 2. УВЕДОМЛЕНИЯЛАРНИ ЮКЛАШ ============
    loadNotifications();
    console.log(`🔔 Уведомлениялар: ${notificationsList.length} та`);

    // ============ 3. ПАРОЛЛАРНИ ХЕШЛАШ (биринчи ишга туширишда) ============
    await migrateAllPasswords();

    // ============ 4. UI СОЗЛАМАЛАРИ ============
    initUI();
    console.log("🎨 UI созламалари тайёр");

    // ============ 5. ҲУДУД СЕЛЕКТЛАРИНИ ТЎЛДИРИШ ============
    populateRegionSelects();
    console.log("📍 Ҳудуд селектлари тайёр");

    // ============ 6. БАРЧА EVENT LISTENERS ============
    setupAllEventListeners();
    console.log("🎯 Event listener'лар боғланди");

    // ============ 7. СУПАБАСЕ КОНФИГИНИ ЮКЛАШ ============
    const cfg = getSupabaseConfig();
    const urlInput = document.getElementById("inpSupabaseUrl");
    const keyInput = document.getElementById("inpSupabaseKey");
    if (urlInput) urlInput.value = cfg.url;
    if (keyInput) keyInput.value = cfg.key;

    // ============ 8. СЕССИЯНИ ТЕКШИРИШ ============
    const hasSession = checkSession();

    // ============ 9. REALTIME ИШГА ТУШИРИШ ============
    initRealtime();
    console.log("⚡ Realtime ишга тушди");

    // ============ 10. D:\ ДИСКДАН АВТО-ТИКЛАШ ============
    await autoLoadFromDDrive();

    // ============ 11. D:\ ДИСК ҲОЛАТИНИ ТЕКШИРИШ ============
    await checkDDriveStatus();

    // ============ 12. БИРИНЧИ МАРТА RENDER ============
    renderAll();
    console.log("🖼 Жадваллар чизилди");

    // ============ 13. ОНЛАЙН БАЗАДАН ТОРТИШ ============
    pullFromSupabase(false);

    // ============ 14. ЛОГИН ОЙНАСИ ============
    if (hasSession && currentUser) {
      // Сессия мавжуд — автоматик кириш
      document.getElementById("loginOverlay").classList.add("hidden");
      switchRole(currentUser.role);
      console.log(`✅ Автоматик кириш: ${currentUser.login}`);

      showToast(`Хуш келибсиз, ${currentUser.name}!`, "success");
    } else {
      // Логин ойнасини кўрсатиш
      showLoginScreen();
    }

    console.log("=".repeat(60));
    console.log("✅ «КОМПЛАЕНС-КАДР» v9.0 тайёр!");

  } catch (e) {
    console.error("❌ Инициализацияда хато:", e);
    alert("Дастурни ишга туширишда хато:\n\n" + e.message);
  }
}

// =========================================================================
// ЛОГИН ОЙНАСИНИ КЎРСАТИШ
// =========================================================================

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

// =========================================================================
// БАРЧА EVENT LISTENERS
// =========================================================================

function setupAllEventListeners() {
  // ============ 1. ЛОГИН ============
  setupLoginListeners();

  // ============ 2. НОМЗОД ФОРМАСИ ============
  setupCandidateFormListeners();

  // ============ 3. ФОЙДАЛАНУВЧИ ФОРМАСИ ============
  setupUserFormListeners();

  // ============ 4. ФИЛЬТРЛАР ============
  setupFilterListeners();

  // ============ 5. СУБ-ТАБЛАР ============
  setupSubtabListeners();

  console.log("✅ Барча event listener'лар боғланди");
}

// =========================================================================
// 1. ЛОГИН EVENT LISTENERS
// =========================================================================

function setupLoginListeners() {
  const loginBtn = document.getElementById("btnLoginSubmit");
  const loginPass = document.getElementById("loginPassword");
  const loginUser = document.getElementById("loginUsername");

  // Кириш тугмаси
  if (loginBtn) {
    loginBtn.addEventListener("click", performLogin);
  }

  // Enter тугмаси — парол майдонида
  if (loginPass) {
    loginPass.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performLogin();
      }
    });
  }

  // Enter тугмаси — логин майдонида
  if (loginUser) {
    loginUser.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (loginPass) loginPass.focus();
      }
    });
  }

  // Логин ойнасида Escape босса — ёпилмайди (чиқиш учун)
  // Бу қасддан — фойдаланувчи логин қилмагунча киролмайди
}

// =========================================================================
// 2. НОМЗОД ФОРМАСИ EVENT LISTENERS
// =========================================================================

function setupCandidateFormListeners() {
  // Форма submit
  const candForm = document.getElementById("candidateForm");
  if (candForm) {
    candForm.addEventListener("submit", handleCandidateFormSubmit);
  }

  // ПИНФЛ дубликат текшируви
  const pinflInput = document.getElementById("inpPinfl");
  if (pinflInput) {
    pinflInput.addEventListener("input", checkPinflDuplicate);
  }

  // Сана автоматик формат
  const birthDate = document.getElementById("inpBirthDate");
  if (birthDate) {
    birthDate.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 8);
      if (val.length >= 3 && val.length <= 4) {
        val = val.substring(0, 2) + "." + val.substring(2);
      } else if (val.length > 4) {
        val = val.substring(0, 2) + "." + val.substring(2, 4) + "." + val.substring(4);
      }
      e.target.value = val;
    });
  }

  // Паспорт серия — фақат катта ҳарфлар
  const passSeries = document.getElementById("inpPassSeries");
  if (passSeries) {
    passSeries.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2);
    });
  }

  // Паспорт рақам — фақат рақамлар
  const passNum = document.getElementById("inpPassNum");
  if (passNum) {
    passNum.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 7);
    });
  }
}

// =========================================================================
// 3. ФОЙДАЛАНУВЧИ ФОРМАСИ
// =========================================================================

function setupUserFormListeners() {
  const userForm = document.getElementById("userCreateForm");
  if (userForm) {
    userForm.addEventListener("submit", handleUserCreateSubmit);
  }
}

// =========================================================================
// 4. ФИЛЬТРЛАР
// =========================================================================

function setupFilterListeners() {
  const filters = [
    "fotoRegionFilter",
    "fotoCategoryFilter",
    "formerRegionFilter",
    "dbRegionFilter",
    "dbCategoryFilter",
    "dbYearFilter",
    "dbMonthFilter",
    "dbStatusFilter"
  ];

  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        if (typeof renderAll === "function") renderAll();
      });
    }
  });

  // Қидирув
  const searchInput = document.getElementById("dbSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (typeof renderAll === "function") renderAll();
    });
  }

  // ИЦ фильтр
  const itsFilter = document.getElementById("itsFilterStatus");
  if (itsFilter) {
    itsFilter.addEventListener("change", () => {
      if (typeof renderAll === "function") renderAll();
    });
  }
}

// =========================================================================
// 5. СУБ-ТАБЛАР
// =========================================================================

function setupSubtabListeners() {
  const subtabNew = document.getElementById("subtabNew");
  const subtabInProcess = document.getElementById("subtabInProcess");
  const subtabApproved = document.getElementById("subtabApproved");

  if (subtabNew) {
    subtabNew.addEventListener("click", () => switchSubTab("new"));
  }
  if (subtabInProcess) {
    subtabInProcess.addEventListener("click", () => switchSubTab("in_process"));
  }
  if (subtabApproved) {
    subtabApproved.addEventListener("click", () => switchSubTab("approved"));
  }
}

// =========================================================================
// 6. ГЛОБАЛ ЁПИШ
// =========================================================================

// Модал ташқарисига босилганда ёпиш
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

// =========================================================================
// 7. ҚЎШИМЧА INIT ФУНКЦИЯЛАРИ (Ихтиёрий)
// =========================================================================

// Дастур версиясини кўрсатиш
function showVersion() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  «КОМПЛАЕНС-КАДР» v9.0                                ║
║  Кадастр агентлиги учун ягона комплаенс тизими       ║
║  ─────────────────────────────────────────────────   ║
║  Яратувчи: Elbegiyev Muxriddin                       ║
║  Алоқа:    +998 33 911 22 22                         ║
║  ─────────────────────────────────────────────────   ║
║  Модуллар: 13 та                                      ║
║  Функциялар: 90+ та                                   ║
╚══════════════════════════════════════════════════════╝
  `);
}

// Дастур ҳолатини текшириш
function checkAppHealth() {
  const issues = [];

  // Стейт
  if (!appState) issues.push("❌ appState юкланмаган");
  if (!appState || !Array.isArray(appState.users)) issues.push("❌ users массиви йўқ");
  if (!appState || !Array.isArray(appState.candidates)) issues.push("❌ candidates массиви йўқ");

  // Функциялар
  const criticalFunctions = [
    "performLogin", "doLogout", "switchRole", "switchTab",
    "renderAll", "openDocModal", "openEditorModal",
    "pushToSupabase", "pullFromSupabase", "initRealtime"
  ];

  criticalFunctions.forEach(fn => {
    if (typeof window[fn] !== "function") {
      issues.push(`❌ Функция йўқ: ${fn}()`);
    }
  });

  // DOM элементлари
  const criticalElements = [
    "loginOverlay", "loginUsername", "loginPassword",
    "kpiTotal", "fototablitsaBody", "docModal",
    "editorModal", "candidateForm"
  ];

  criticalElements.forEach(id => {
    if (!document.getElementById(id)) {
      issues.push(`❌ DOM элемент йўқ: #${id}`);
    }
  });

  return issues;
}

// =========================================================================
// ИШГА ТУШИРИШ
// =========================================================================

// DOM тайёр бўлганда ишга тушириш
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupModalBackdropClose();
    showVersion();
    initApp();
  });
} else {
  // DOM аллақачон тайёр
  setupModalBackdropClose();
  showVersion();
  initApp();
}

// =========================================================================
// ХАТОЛАРНИ УШЛАШ
// =========================================================================

window.addEventListener("error", (e) => {
  console.error("❌ Глобал хато:", e.error || e.message);

  // Фойдаланувчига кўрсатиш (фақат жиддий хатолар)
  if (e.error && e.error.message) {
    console.error("Хато тафсилоти:", e.error.message);
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("❌ Ушланмаган Promise:", e.reason);
});

// =========================================================================
// САҲИФА ЁПИЛГАНДА
// =========================================================================

window.addEventListener("beforeunload", (e) => {
  // Фақат ўзгаришлар бўлса огоҳлантириш
  // (керак бўлмаса — ўчиринг)
  // e.preventDefault();
  // e.returnValue = "";
});

// =========================================================================
// ЛОГ
// =========================================================================

console.log("✅ 13-app.js юкланди");
console.log("🎯 Барча модуллар тайёр!");
console.log("📋 01-config 02-crypto 03-audit 04-supabase");
console.log("📋 05-auth 06-notifications 07-render 08-candidates");
console.log("📋 09-doc 10-export 11-electron 12-ui 13-app");
