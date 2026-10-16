// =========================================================================
// 12-UI.JS — Тунги режим, Кирилл/Лотин, Info, Дизайн, Ёрдамчи
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// =========================================================================
// 1. ТУНГИ / КУНДУЗГИ РЕЖИМ
// =========================================================================

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  // Сақлаш
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

  // Тугма матнини янгилаш
  const btn = document.getElementById("btnThemeToggle");
  if (btn) {
    btn.textContent = isDark ? "☀️ Кундузги" : "🌙 Тунги";
  }

  console.log("🎨 Режим:", isDark ? "Тунги" : "Кундузги");
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const btn = document.getElementById("btnThemeToggle");

  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    if (btn) btn.textContent = "☀️ Кундузги";
  } else {
    document.body.classList.remove("dark-mode");
    if (btn) btn.textContent = "🌙 Тунги";
  }
}

// =========================================================================
// 2. КИРИЛЛ / ЛОТИН АЛМАШТИРИШ
// =========================================================================

// Кирилл → Лотин
function cyrToLat(text) {
  const map = {
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'J','З':'Z',
    'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','У':'U','Ф':'F','Х':'X','Ц':'Ts','Ч':'Ch','Ш':'Sh',
    'Ъ':'’','Э':'E','Ю':'Yu','Я':'Ya','Ў':'O‘','Қ':'Q','Ғ':'G‘','Ҳ':'H',
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh',
    'ъ':'’','ь':'','э':'e','ю':'yu','я':'ya','ў':'o‘','қ':'q','ғ':'g‘','ҳ':'h'
  };

  return text.replace(/[А-Яа-яЁёЎўҚқҒғҲҳЪъЬь]/g, ch => map[ch] !== undefined ? map[ch] : ch);
}

function toggleAlphabet() {
  isLatinMode = !isLatinMode;

  const btn = document.getElementById("btnLangToggle");
  if (btn) {
    btn.textContent = isLatinMode ? "🔤 Лотин → Кирилл" : "🔤 Кирилл / Лотин";
  }

  if (isLatinMode) {
    // Фақат main ичидаги матнни ўзгартириш
    const walker = document.createTreeWalker(
      document.querySelector("main"),
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) {
        node._origCyr = node._origCyr || node.nodeValue;
        node.nodeValue = cyrToLat(node._origCyr);
      }
    }
  } else {
    // Асл ҳолатга қайтариш
    if (typeof renderAll === "function") {
      renderAll();
    }
  }
}

// =========================================================================
// 3. INFO (Дастур ҳақида)
// =========================================================================

function showAboutModal() {
  // Агар мавжуд бўлса — очиш
  let modal = document.getElementById("aboutModal");

  if (!modal) {
    // Яратиш
    modal = createAboutModal();
    document.body.appendChild(modal);
  }

  modal.classList.remove("hidden");

  // Animation
  setTimeout(() => {
    const box = modal.querySelector(".about-box");
    if (box) {
      box.style.transform = "scale(1)";
      box.style.opacity = "1";
    }
  }, 50);
}

function closeAboutModal() {
  const modal = document.getElementById("aboutModal");
  if (!modal) return;

  const box = modal.querySelector(".about-box");
  if (box) {
    box.style.transform = "scale(0.9)";
    box.style.opacity = "0";
  }

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

function createAboutModal() {
  const modal = document.createElement("div");
  modal.id = "aboutModal";
  modal.className = "fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 hidden";
  modal.onclick = (e) => {
    if (e.target === modal) closeAboutModal();
  };

  modal.innerHTML = `
    <div class="about-box bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all duration-200"
         style="transform: scale(0.9); opacity: 0;">

      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-6 py-5 text-white relative">
        <button onclick="closeAboutModal()"
                class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer">
          ✕
        </button>
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-xl bg-white/10 border-2 border-white/30 flex items-center justify-center font-extrabold text-2xl text-white">КК</div>
          <div>
            <div class="text-xs uppercase tracking-widest text-blue-200 font-bold">Кадастр агентлиги</div>
            <h2 class="text-xl font-extrabold tracking-tight">«КОМПЛАЕНС-КАДР» v9.0</h2>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5 text-slate-800">

        <!-- Мақсад -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">🎯</span>
            <h3 class="font-extrabold text-slate-900">Дастур мақсади</h3>
          </div>
          <p class="text-sm leading-relaxed text-slate-600">
            Кадастр агентлиги ва унинг ҳудудий бошқармалари ходимларини
            <b>комплаенс текширувидан</b> ўтказиш, судланганлик ҳолатини аниқлаш,
            маълумотнома тайёрлаш ва тасдиқлаш жараёнини автоматлаштириш.
          </p>
        </div>

        <!-- Функциялар -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">📋</span>
            <h3 class="font-extrabold text-slate-900">Асосий функциялар</h3>
          </div>
          <ul class="text-sm text-slate-600 space-y-1.5 leading-relaxed">
            <li>• 4 та роль (HR, Коррупция, Раҳбар, Кузатувчи)</li>
            <li>• Номзодлар ва собиқ ходимлар реестри</li>
            <li>• ИЦ судланганлик текшируви</li>
            <li>• A4 Маълумотнома генерацияси</li>
            <li>• Word / Excel экспорт</li>
            <li>• Supabase Realtime онлайн база</li>
            <li>• 🔔 Уведомлениялар тизими</li>
            <li>• 📋 Аудит-лог (ким нима ўзгартирди)</li>
          </ul>
        </div>

        <!-- Яратувчи -->
        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">👨‍💻</span>
            <h3 class="font-extrabold text-blue-900">Дастур яратувчи</h3>
          </div>
          <div class="text-sm space-y-1">
            <div class="font-bold text-slate-900 text-base">Elbegiyev Muxriddin</div>
            <div class="flex items-center gap-2 text-slate-700">
              <span>📞</span>
              <a href="tel:+998339112222" class="font-mono font-bold hover:text-blue-700 hover:underline">
                +998 33 911 22 22
              </a>
            </div>
            <div class="flex items-center gap-2 text-slate-700">
              <span>✉️</span>
              <a href="mailto:komplayenskadastr@gmail.com" class="font-mono text-xs hover:text-blue-700 hover:underline">
                komplayenskadastr@gmail.com
              </a>
            </div>
          </div>
        </div>

        <!-- Версия -->
        <div class="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>📅 Версия: <b class="text-slate-700">9.0</b></span>
          <span>🗓 ${getTodayDate()}</span>
        </div>

      </div>

      <!-- Footer -->
      <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
        <button onclick="closeAboutModal()"
                class="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold cursor-pointer">
          Ёпиш
        </button>
      </div>
    </div>
  `;

  return modal;
}

function getTodayDate() {
  const d = new Date();
  const months = [
    "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
    "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// =========================================================================
// 4. ЁРДАМЧИ: HTML ESCAPE
// =========================================================================

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =========================================================================
// 5. ЁРДАМЧИ: САНА ФОРМАТЛАШ
// =========================================================================

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return dateStr;
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  if (timeStr) return `${dateStr} ${timeStr}`;
  return dateStr;
}

// =========================================================================
// 6. ЁРДАМЧИ: САНА ҚИСҚАРТИШ
// =========================================================================

function timeAgo(dateTimeStr) {
  if (!dateTimeStr) return "—";

  try {
    const parts = dateTimeStr.split(" ");
    if (parts.length < 2) return dateTimeStr;

    const [datePart, timePart] = parts;
    const [dd, mm, yyyy] = datePart.split(".");
    const [hh, mi, ss] = (timePart || "00:00:00").split(":");

    const dt = new Date(yyyy, mm - 1, dd, hh || 0, mi || 0, ss || 0);
    const diffMs = Date.now() - dt.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "ҳозир";
    if (diffMin < 60) return `${diffMin} дақиқа олдин`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} соат олдин`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} кун олдин`;

    return dateTimeStr;
  } catch (e) {
    return dateTimeStr;
  }
}

// =========================================================================
// 7. ЁРДАМЧИ: САНА МАЙДОНЛАРИНИ ТЎЛДИРИШ
// =========================================================================

function setupDateInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;

  // Placeholder
  el.placeholder = "кк.оо.йййй";

  // Автоматик нуқта қўшиш
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

// =========================================================================
// 8. ЁРДАМЧИ: ПИНФЛ ВА ПАСПОРТ МАЙДОНЛАРИ
// =========================================================================

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

  if (series) {
    series.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2);
    });
  }

  if (number) {
    number.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 7);
    });
  }
}

// =========================================================================
// 9. ЁРДАМЧИ: КЛАВИАТУРА ҚИСҚАРТМАЛАРИ
// =========================================================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape — модалларни ёпиш
    if (e.key === "Escape") {
      // About
      const about = document.getElementById("aboutModal");
      if (about && !about.classList.contains("hidden")) {
        closeAboutModal();
        return;
      }

      // Doc
      const doc = document.getElementById("docModal");
      if (doc && !doc.classList.contains("hidden")) {
        closeDocModal();
        return;
      }

      // Editor
      const editor = document.getElementById("editorModal");
      if (editor && !editor.classList.contains("hidden")) {
        closeEditorModal();
        return;
      }

      // Edit Candidate
      const editCand = document.getElementById("editCandidateModal");
      if (editCand && !editCand.classList.contains("hidden")) {
        closeEditCandidateModal();
        return;
      }

      // Notification panel
      const notifPanel = document.getElementById("notificationPanel");
      if (notifPanel && !notifPanel.classList.contains("hidden")) {
        closeNotificationPanel();
        return;
      }
    }

    // Ctrl + K — қидирув
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("dbSearchInput");
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    // Ctrl + Q — чиқиш (рухсат сўраш)
    if ((e.ctrlKey || e.metaKey) && e.key === "q") {
      e.preventDefault();
      if (currentUser) {
        doLogout();
      }
    }
  });
}

// =========================================================================
// 10. ЁРДАМЧИ: САНА ВА ВАҚТНИ ЯНГИЛАШ (тиклаб туриш)
// =========================================================================

let clockInterval = null;

function startClock() {
  updateClock();

  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateClock, 1000);
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

// =========================================================================
// 11. ЁРДАМЧИ: БЕЗАК (иконка) ЯРАТИШ
// =========================================================================

function getStatusIcon(status) {
  const icons = {
    admin_review: "🔍",
    boss_review: "📤",
    approved: "✅",
    returned: "↩️",
    clean: "✓",
    sudlangan: "🚨",
    new: "🆕",
    in_process: "⏳",
    completed: "✅"
  };
  return icons[status] || "•";
}

// =========================================================================
// 12. ЁРДАМЧИ: ТУГМА ҲОЛАТИНИ ЎЗГАРТИРИШ
// =========================================================================

function setButtonLoading(btnId, isLoading, loadingText = "Юкланмоқда...") {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (isLoading) {
    btn._originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText;
    btn.classList.add("opacity-60", "cursor-wait");
  } else {
    btn.disabled = false;
    btn.textContent = btn._originalText || btn.textContent;
    btn.classList.remove("opacity-60", "cursor-wait");
  }
}

// =========================================================================
// 13. ЁРДАМЧИ: СОНЛАРНИ ФОРМАТЛАШ
// =========================================================================

function formatNumber(num) {
  if (typeof num !== "number") return "0";
  return num.toLocaleString("uz-UZ");
}

// =========================================================================
// 14. ЁРДАМЧИ: КОПИРОВАНИЕ (Clipboard)
// =========================================================================

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("Clipboard API error:", e);
  }

  // Fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    console.error("Copy fallback error:", e);
    return false;
  }
}

// =========================================================================
// 15. ЁРДАМЧИ: САҲИФАНИ ЮКЛАШ (Loading spinner)
// =========================================================================

function showLoadingSpinner(text = "Юкланмоқда...") {
  let spinner = document.getElementById("globalLoadingSpinner");

  if (!spinner) {
    spinner = document.createElement("div");
    spinner.id = "globalLoadingSpinner";
    spinner.className = "fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center hidden";
    spinner.innerHTML = `
      <div class="text-center">
        <div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div class="text-white font-bold text-sm" id="loadingSpinnerText">${text}</div>
      </div>
    `;
    document.body.appendChild(spinner);
  }

  const textEl = document.getElementById("loadingSpinnerText");
  if (textEl) textEl.textContent = text;

  spinner.classList.remove("hidden");
}

function hideLoadingSpinner() {
  const spinner = document.getElementById("globalLoadingSpinner");
  if (spinner) spinner.classList.add("hidden");
}

// =========================================================================
// 16. ЁРДАМЧИ: ЭКРАНГА СИҒДИРИШ (Scroll to element)
// =========================================================================

function scrollToElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// =========================================================================
// 17. ЁРДАМЧИ: ИНТЕРНЕТ ҲОЛАТИ
// =========================================================================

function setupOnlineOfflineDetector() {
  window.addEventListener("online", () => {
    showToast("🌐 Интернет уланди", "success");

    if (typeof initRealtime === "function") {
      initRealtime();
    }
  });

  window.addEventListener("offline", () => {
    showToast("⚠️ Интернет узилди (офлайн режим)", "warning");

    const badge = document.getElementById("cloudSyncBadge");
    if (badge) {
      badge.textContent = "⚠️ Офлайн режим";
      badge.className = "text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold";
    }
  });
}

// =========================================================================
// 18. INIT — УШБУ МОДУЛНИНГ ҚЎШИМЧА ИШГА ТУШИРИШИ
// =========================================================================

function initUI() {
  // Тема
  loadTheme();

  // Товуш
  if (typeof loadNotificationSoundSetting === "function") {
    loadNotificationSoundSetting();
  }

  // Соат
  startClock();

  // Клавиатура
  setupKeyboardShortcuts();

  // Интернет
  setupOnlineOfflineDetector();

  // Input форматлаш
  setupDateInput("inpBirthDate");
  setupPinflInput("inpPinfl");
  setupPassportInputs("inpPassSeries", "inpPassNum");

  // Таҳрир модалида ҳам
  setupDateInput("editCandBirthDate");
  setupPinflInput("editCandPinfl");
  setupPassportInputs("editCandPassSeries", "editCandPassNum");

  console.log("✅ UI созламалари тайёр");
}

// -------------------- ЛОГ ----------
console.log("✅ 12-ui.js юкланди");
