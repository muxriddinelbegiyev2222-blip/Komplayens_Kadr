// =========================================================================
// 12-UI.JS — Тунги режим, Кирилл/Лотин (Тўлиқ ва Аниқ), Info
// «КОМПЛАЕНС-КАДР» v11.6
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
  setupAlphabetObserver();
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

// 🆕 САНА (КУН.ОЙ.ЙИЛ) КИРИТИШ — идемпотент (такрор боғланмайди)
function setupDateInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (el.dataset.dateBound === "1") return;
  el.dataset.dateBound = "1";
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
  if (el.dataset.pinflBound === "1") return;
  el.dataset.pinflBound = "1";
  el.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 14);
  });
}

function setupPassportInputs(seriesId, numberId) {
  const series = document.getElementById(seriesId);
  const number = document.getElementById(numberId);
  if (series && series.dataset.passBound !== "1") {
    series.dataset.passBound = "1";
    series.addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2); });
  }
  if (number && number.dataset.passBound !== "1") {
    number.dataset.passBound = "1";
    number.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").substring(0, 7); });
  }
}

function showAboutModal() {
  const modal = document.getElementById("aboutModal");
  if (modal) { modal.classList.remove("hidden"); }
}

function closeAboutModal() {
  const modal = document.getElementById("aboutModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================================
// КИРИЛЛ-ЛОТИН — ТЎЛИҚ ВА ИДЕМПОТЕНТ (v11.6)
// =========================================================================

const CHAR_MAP = {
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'J','З':'Z',
  'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
  'С':'S','Т':'T','У':'U','Ф':'F','Х':'X','Ц':'Ts','Ч':'Ch','Ш':'Sh',
  'Щ':'Sh','Ъ':'’','Ы':'I','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
  'Ў':'Oʻ','Қ':'Q','Ғ':'Gʻ','Ҳ':'H',
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh',
  'щ':'sh','ъ':'’','ы':'i','ь':'','э':'e','ю':'yu','я':'ya',
  'ў':'oʻ','қ':'q','ғ':'gʻ','ҳ':'h'
};

const WORD_DICTIONARY = {
  "Коррупция": "Korrupsiya", "коррупция": "korrupsiya", "Комплаенс": "Komplayens", "комплаенс": "komplayens",
  "Кадастр": "Kadastr", "кадастр": "kadastr", "Агентлиги": "Agentligi", "агентлиги": "agentligi",
  "Палатаси": "Palatasi", "палатаси": "palatasi", "Админ": "Admin", "админ": "admin",
  "Раҳбар": "Rahbar", "раҳбар": "rahbar", "Бошлиқ": "Boshliq", "бошлиқ": "boshliq",
  "Бошлиғи": "Boshlig'i", "бошлиғи": "boshlig'i", "Кузатувчи": "Kuzatuvchi", "кузатувчи": "kuzatuvchi",
  "Кадрлар": "Kadrlar", "кадрлар": "kadrlar", "Ходим": "Xodim", "ходим": "xodim", "Ходимлар": "Xodimlar", "ходимлар": "xodimlar",
  "Тасдиқлаш": "Tasdiqlash", "тасдиқлаш": "tasdiqlash", "Тасдиқланди": "Tasdiqlandi", "тасдиқланди": "tasdiqlandi",
  "Жараёнида": "Jarayonida", "жараёнида": "jarayonida", "Юбориш": "Yuborish", "юбориш": "yuborish",
  "Юборилди": "Yuborildi", "юборилди": "yuborildi", "Қайтариш": "Qaytarish", "қайтариш": "qaytarish",
  "Ўрганиш": "O'rganish", "ўрганиш": "o'rganish", "Ўрганиб": "O'rganib", "ўрганиб": "o'rganib", "чиқилди": "chiqildi",
  "Вилояти": "Viloyati", "вилояти": "viloyati", "Туман": "Tuman", "туман": "tuman", "Тумани": "Tumani", "тумани": "tumani",
  "Шаҳар": "Shahar", "шаҳар": "shahar", "Шаҳри": "Shahri", "шаҳри": "shahri", "Бошқармаси": "Boshqarmasi", "бошқармаси": "boshqarmasi",
  "Филиали": "Filiali", "филиали": "filiali", "Бўлими": "Bo'limi", "бўлими": "bo'limi", "Бўлим": "Bo'lim", "бўлим": "bo'lim",
  "Маълумотнома": "Ma'lumotnoma", "маълумотнома": "ma'lumotnoma", "Маълумот": "Ma'lumot", "маълумот": "ma'lumot",
  "Лавозим": "Lavozim", "лавозим": "lavozim", "Лавозими": "Lavozimi", "лавозими": "lavozimi", "Топширилаётган": "Topshirilayotgan",
  "Собиқ": "Sobiq", "собиқ": "sobiq", "Ф.И.Ш.": "F.I.Sh.", "Туғилган": "Tug'ilgan", "туғилган": "tug'ilgan",
  "Санаси": "Sanasi", "санаси": "sanasi", "Жойи": "Joyi", "жойи": "joyi", "Паспорт": "Pasport", "паспорт": "pasport",
  "Қўшиш": "Qo'shish", "қўшиш": "qo'shish", "Сақлаш": "Saqlash", "сақлаш": "saqlash", "Ўчириш": "O'chirish", "ўчириш": "o'chirish",
  "Таҳрирлаш": "Tahrirlash", "таҳрирлаш": "tahrirlash", "Таҳрир": "Tahrir", "таҳрир": "tahrir", "Кўриш": "Ko'rish", "кўриш": "ko'rish",
  "Статистика": "Statistika", "статистика": "statistika", "Фототаблица": "Fototablitsa", "фототаблица": "fototablitsa",
  "Судланганлар": "Sudlanganlar", "судланганлар": "sudlanganlar", "Судланган": "Sudlangan", "судланган": "sudlangan",
  "Судланмаган": "Sudlanmagan", "судланмаган": "sudlanmagan", "Ягона": "Yagona", "ягона": "yagona", "База": "Baza", "база": "baza",
  "Созламалар": "Sozlamalar", "созламалар": "sozlamalar", "Киритилган": "Kiritilgan", "киритилган": "kiritilgan",
  "Диққат": "Diqqat", "диққат": "diqqat", "Парол": "Parol", "парол": "parol", "Логин": "Login", "логин": "login",
  "Жами": "Jami", "жами": "jami", "Барча": "Barcha", "барча": "barcha", "Барчаси": "Barchasi", "барчаси": "barchasi",
  "Ҳаммаси": "Hammasi", "ҳаммаси": "hammasi", "Нусхалаш": "Nusxalash", "нусхалаш": "nusxalash",
  "Печать": "Pechat", "печать": "pechat", "Принтерга": "Printerga"
};

function cyrToLat(text) {
  if (!text) return text;
  let result = text;
  Object.keys(WORD_DICTIONARY).forEach(cyrWord => {
    const latWord = WORD_DICTIONARY[cyrWord];
    const regex = new RegExp(cyrWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, latWord);
  });
  result = result.replace(/[А-Яа-яЁёЎўҚқҒғҲҳЪъЬьЫыЩщЭэЮюЯя]/g, ch => {
    return CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : ch;
  });
  return result;
}

// 🆕 Битта алмаштириш ишлаяптими ёки йўқми (рекурсияни тўхтатиш учун)
let _applyAlphabetRunning = false;

function applyAlphabet() {
  if (_applyAlphabetRunning) return;
  _applyAlphabetRunning = true;
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      if (!node.nodeValue || !node.nodeValue.trim()) continue;

      if (isLatinMode) {
        if (!node._origCyr) node._origCyr = node.nodeValue;
        if (/[А-Яа-яЁёЎўҚқҒғҲҳ]/.test(node.nodeValue)) {
          const converted = cyrToLat(node._origCyr);
          if (converted !== node.nodeValue) node.nodeValue = converted;
        }
      } else {
        if (node._origCyr && node.nodeValue !== node._origCyr) {
          node.nodeValue = node._origCyr;
        }
      }
    }
  } catch (e) {
    console.error("applyAlphabet error:", e);
  } finally {
    _applyAlphabetRunning = false;
  }
}

// 🆕 ТУГМА ИШЛАШИ УЧУН
function toggleAlphabet() {
  isLatinMode = !isLatinMode;
  try { localStorage.setItem("KOMPLAYENS_KADR_LANG", isLatinMode ? "lat" : "cyr"); } catch (e) {}

  const btn = document.getElementById("btnLangToggle");
  if (btn) {
    const label = isLatinMode ? "🔤 Лотин → Кирилл" : "🔤 Кирилл / Лотин";
    btn.textContent = label;
    if (btn.firstChild && btn.firstChild.nodeType === 3) {
      btn.firstChild._origCyr = label;
    }
  }

  // renderAll() ичидаги wrapper applyAlphabet() ни чақиради
  if (typeof renderAll === "function") {
    renderAll();
  } else {
    applyAlphabet();
  }
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem("KOMPLAYENS_KADR_LANG");
    if (saved === "lat") {
      isLatinMode = true;
      const btn = document.getElementById("btnLangToggle");
      if (btn) {
        const label = "🔤 Лотин → Кирилл";
        btn.textContent = label;
        if (btn.firstChild && btn.firstChild.nodeType === 3) {
          btn.firstChild._origCyr = label;
        }
      }
    }
  } catch (e) { console.error("loadLanguage error:", e); }
}

// 🆕 Динамик DOM ўзгаришларини ушлаб, дарҳол алфавитни қўллаш
function setupAlphabetObserver() {
  if (typeof MutationObserver === "undefined") return;
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!isLatinMode) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyAlphabet();
    });
  });
  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch (e) { console.error("MutationObserver setup error:", e); }
}

// 🆕 renderAll() wrapper — ҳар бир чақирувда алфавитни қўллайди
(function wrapRenderAllForAlphabet() {
  if (typeof window.renderAll !== "function") return;
  if (window.renderAll.__alphabetWrapped) return;
  const _orig = window.renderAll;
  const wrapped = function() {
    const result = _orig.apply(this, arguments);
    try { if (typeof applyAlphabet === "function") applyAlphabet(); } catch (e) { console.error("applyAlphabet wrapper error:", e); }
    return result;
  };
  wrapped.__alphabetWrapped = true;
  window.renderAll = wrapped;
  console.log("✅ renderAll — алфавит синхронизация билан ўралди");
})();

console.log("✅ 12-ui.js юкланди (v11.6 — Кирилл/Лотин тўлиқ, идемпотент)");
