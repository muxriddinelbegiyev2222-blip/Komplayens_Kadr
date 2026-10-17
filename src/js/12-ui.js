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
  if (series) series.addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2); });
  if (number) number.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").substring(0, 7); });
}

function showAboutModal() {
  const modal = document.getElementById("aboutModal");
  if (modal) { modal.classList.remove("hidden"); }
}

function closeAboutModal() {
  const modal = document.getElementById("aboutModal");
  if (modal) modal.classList.add("hidden");
}

// 🆕 КИРИЛЛ-ЛОТИН (Тўлиқ ва хатосиз)
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

// 🆕 ТУГМА ИШЛАШИ УЧУН
function toggleAlphabet() {
  if (!isLatinMode) {
    // Лотинга ўтиш
    isLatinMode = true;
    const btn = document.getElementById("btnLangToggle");
    if (btn) btn.textContent = "🔤 Лотин → Кирилл";
    
    // Бутун саҳифадаги матнни алмаштириш
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() && node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE') {
        node._origCyr = node._origCyr || node.nodeValue;
        node.nodeValue = cyrToLat(node._origCyr);
      }
    }
  } else {
    // Кириллга қайтиш
    isLatinMode = false;
    const btn = document.getElementById("btnLangToggle");
    if (btn) btn.textContent = "🔤 Кирилл / Лотин";
    
    // renderAll() чақириш орқали барча матнларни асл ҳолатига қайтариш
    if (typeof renderAll === "function") renderAll();
  }
}

function loadLanguage() {
  // Саҳифа очилганда тилни юклаш
  const saved = localStorage.getItem("KOMPLAYENS_KADR_LANG");
  if (saved === "lat") {
    setTimeout(() => { if (!isLatinMode) toggleAlphabet(); }, 500);
  }
}

console.log("✅ 12-ui.js юкланди (v11.5 — Кирилл/Лотин тўлиқ)");
