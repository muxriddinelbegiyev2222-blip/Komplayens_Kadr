// =========================================================================
// 12-UI.JS — Тунги режим, Кирилл/Лотин (Тўлиқ ва Аниқ), Info
// «КОМПЛАЕНС-КАДР» v11.5
// =========================================================================

function initUI() {
  document.body.classList.remove("dark-mode");
  if (typeof loadNotificationSoundSetting === "function") loadNotificationSoundSetting();
  startClock();
  setupKeyboardShortcuts();
  setupOnlineOfflineDetector();
  setupDateInput("inpBirthDate");
  setupDateInput("inpJobSince");
  setupPinflInput("inpPinfl");
  setupPassportInputs("inpPassSeries", "inpPassNum");
  setupDateInput("editCandBirthDate");
  setupDateInput("editCandJobSince");
  setupPinflInput("editCandPinfl");
  setupPassportInputs("editCandPassSeries", "editCandPassNum");
  loadLanguage();
  console.log("✅ UI созламалари тайёр");
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const el = document.getElementById("currentClock");
  if (!el) return;
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  el.textContent = `${dd}.${mm}.${yyyy}  ${hh}:${mi}:${ss}`;
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modals = ["aboutModal", "docModal", "editorModal", "editCandidateModal", "notificationPanel"];
      for (const id of modals) {
        const el = document.getElementById(id);
        if (el && !el.classList.contains("hidden")) {
          if (id === "docModal") closeDocModal();
          else if (id === "editorModal") closeEditorModal();
          else if (id === "editCandidateModal") closeEditCandidateModal();
          else if (id === "notificationPanel") closeNotificationPanel();
          else if (id === "aboutModal") el.classList.add("hidden");
          return;
        }
      }
    }
  });
}

function setupOnlineOfflineDetector() {
  window.addEventListener("online", () => {
    showToast("🌐 Интернет уланди", "success");
    if (typeof initRealtime === "function") initRealtime();
  });
  window.addEventListener("offline", () => {
    showToast("⚠️ Интернет узилди", "warning");
  });
}

// 🆕 САНА (КУН.ОЙ.ЙИЛ) КИРИТИШ
function setupDateInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.placeholder = "кк.оо.йййй";
  el.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 8);
    if (val.length >= 3 && val.length <= 4) {
      val = val.substring(0, 2) + "." + val.substring(2);
    } else if (val.length > 4) {
      val = val.substring(0, 2) + "." + val.substring(2, 4) + "." + val.substring(4);
    }
    e.target.value = val;
  });
}

function setupPinflInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 14);
  });
}

function setupPassportInputs(seriesId, numberId) {
  const series = document.getElementById(seriesId);
  const number = document.getElementById(numberId);
  if (series) series.addEventListener("input",
