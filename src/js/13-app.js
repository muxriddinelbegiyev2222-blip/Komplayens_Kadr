// =========================================================================
// 13-APP.JS — Асосий инициализация ва Event Listeners
// «КОМПЛАЕНС-КАДР» v11.6
// =========================================================================

async function initApp() {
  console.log("🚀 «КОМПЛАЕНС-КАДР» v11.6 ишга тушмоқда...");
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
    } else {
      showLoginScreen();
    }

    console.log("=".repeat(60));
    console.log("✅ «КОМПЛАЕНС-КАДР» v11.6 тайёр!");

  } catch (e) {
    console.error("❌ Инициализацияда хато:", e);
    alert("Дастурни ишга туширишда хато:\n\n" + e.message);
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
      if (e.key === "
