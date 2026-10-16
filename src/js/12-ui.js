// =========================================================================
// 12-UI.JS — Тунги режим, Кирилл/Лотин, Info, Дизайн, Ёрдамчи
// «КОМПЛАЕНС-КАДР» v9.1 — Таржима тўлиқ тўғриланган
// =========================================================================

// =========================================================================
// 1. ТУНГИ / КУНДУЗГИ РЕЖИМ
// =========================================================================

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

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
// 2. КИРИЛЛ / ЛОТИН — ТЎЛИҚ ТЎҒРИ ТАРЖИМА
// =========================================================================

// -------------------- СЎЗЛАР ЛУҒАТИ (муҳим сўзлар) --------------------
// Бу сўзлар механизматик ҳарф-ҳарф таржимадан ОЛДИН алмаштирилади
const WORD_DICTIONARY = {
  // РАСМИЙ АТАМАЛАР
  "Коррупцияга": "Korrupsiyaga",
  "коррупцияга": "korrupsiyaga",
  "Коррупция": "Korrupsiya",
  "коррупция": "korrupsiya",
  "КОРРУПЦИЯГА": "KORRUPSIYAGA",
  "КОРРУПЦИЯ": "KORRUPSIYA",
  "Комплаенс": "Komplayens",
  "комплаенс": "komplayens",
  "КОМПЛАЕНС": "KOMPLAYENS",
  "Кадастр": "Kadastr",
  "кадастр": "kadastr",
  "КАДАСТР": "KADASTR",
  "Агентлиги": "Agentligi",
  "агентлиги": "agentligi",
  "АГЕНТЛИГИ": "AGENTLIGI",
  "Палатаси": "Palatasi",
  "палатаси": "palatasi",
  "ПАЛАТАСИ": "PALATASI",

  // РОЛЛАР
  "Админ": "Admin",
  "админ": "admin",
  "АДМИН": "ADMIN",
  "Раҳбар": "Rahbar",
  "раҳбар": "rahbar",
  "РАҲБАР": "RAHBAR",
  "Бошлиқ": "Boshliq",
  "бошлиқ": "boshliq",
  "БОШЛИҚ": "BOSHLIQ",
  "Бошлиғи": "Boshlig'i",
  "бошлиғи": "boshlig'i",
  "Кузатувчи": "Kuzatuvchi",
  "кузатувчи": "kuzatuvchi",
  "КУЗАТУВЧИ": "KUZATUVCHI",
  "Кадрлар": "Kadrlar",
  "кадрлар": "kadrlar",
  "КАДРЛАР": "KADRLAR",
  "Ходим": "Xodim",
  "ходим": "xodim",
  "ХОДИМ": "XODIM",
  "Ходимлар": "Xodimlar",
  "ходимлар": "xodimlar",

  // ЖАРАЁН
  "Тасдиқлаш": "Tasdiqlash",
  "тасдиқлаш": "tasdiqlash",
  "ТАСДИҚЛАШ": "TASDIQLASH",
  "Тасдиқланди": "Tasdiqlandi",
  "тасдиқланди": "tasdiqlandi",
  "Тасдиқланган": "Tasdiqlangan",
  "Жараёнида": "Jarayonida",
  "жараёнида": "jarayonida",
  "Жараён": "Jarayon",
  "жараён": "jarayon",
  "ЖАРАЁН": "JARAYON",
  "Юбориш": "Yuborish",
  "юбориш": "yuborish",
  "Юборилди": "Yuborildi",
  "юборилди": "yuborildi",
  "Қайтариш": "Qaytarish",
  "қайтариш": "qaytarish",
  "Қайтарилди": "Qaytarildi",
  "Ўрганиш": "O'rganish",
  "ўрганиш": "o'rganish",
  "Ўрганилмоқда": "O'rganilmoqda",
  "Ўрганиб": "O'rganib",
  "ўрганиб": "o'rganib",
  "чиқилди": "chiqildi",
  "Чиқилди": "Chiqildi",

  // ҲУДУД
  "Вилояти": "Viloyati",
  "вилояти": "viloyati",
  "ВИЛОЯТИ": "VILOYATI",
  "Вилоят": "Viloyat",
  "вилоят": "viloyat",
  "Туман": "Tuman",
  "туман": "tuman",
  "ТУМАН": "TUMAN",
  "Тумани": "Tumani",
  "тумани": "tumani",
  "Шаҳар": "Shahar",
  "шаҳар": "shahar",
  "ШАҲАР": "SHAHAR",
  "Шаҳри": "Shahri",
  "шаҳри": "shahri",
  "Бошқармаси": "Boshqarmasi",
  "бошқармаси": "boshqarmasi",
  "Бошқарма": "Boshqarma",
  "бошқарма": "boshqarma",
  "Филиали": "Filiali",
  "филиали": "filiali",
  "Филиал": "Filial",
  "филиал": "filial",
  "Бўлими": "Bo'limi",
  "бўлими": "bo'limi",
  "Бўлим": "Bo'lim",
  "бўлим": "bo'lim",
  "Республикаси": "Respublikasi",
  "республикаси": "respublikasi",

  // ҲУЖЖАТ
  "Маълумотнома": "Ma'lumotnoma",
  "маълумотнома": "ma'lumotnoma",
  "Маълумот": "Ma'lumot",
  "маълумот": "ma'lumot",
  "Лавозим": "Lavozim",
  "лавозим": "lavozim",
  "Лавозими": "Lavozimi",
  "лавозими": "lavozimi",
  "Топширилаётган": "Topshirilayotgan",
  "топширилаётган": "topshirilayotgan",
  "Тайинлов": "Tayinlov",
  "тайинлов": "tayinlov",
  "Ишга": "Ishga",
  "ишга": "ishga",
  "Ротация": "Rotatsiya",
  "ротация": "rotatsiya",
  "Захира": "Zaxira",
  "захира": "zaxira",
  "Собиқ": "Sobiq",
  "собиқ": "sobiq",
  "СОБИҚ": "SOBIQ",

  // ШАХС
  "Ф.И.Ш.": "F.I.Sh.",
  "Фуқаро": "Fuqaro",
  "фуқаро": "fuqaro",
  "Туғилган": "Tug'ilgan",
  "туғилган": "tug'ilgan",
  "Санаси": "Sanasi",
  "санаси": "sanasi",
  "Жойи": "Joyi",
  "жойи": "joyi",
  "Паспорт": "Pasport",
  "паспорт": "pasport",
  "ПИНФЛ": "PINFL",
  "Пинфл": "Pinfl",

  // ТУГМАЛАР
  "Қўшиш": "Qo'shish",
  "қўшиш": "qo'shish",
  "Қўшилди": "Qo'shildi",
  "Сақлаш": "Saqlash",
  "сақлаш": "saqlash",
  "Сақланди": "Saqlandi",
  "Ўчириш": "O'chirish",
  "ўчириш": "o'chirish",
  "Ўчирилди": "O'chirildi",
  "Таҳрирлаш": "Tahrirlash",
  "таҳрирлаш": "tahrirlash",
  "Таҳрир": "Tahrir",
  "таҳрир": "tahrir",
  "Кўриш": "Ko'rish",
  "кўриш": "ko'rish",
  "Юклаш": "Yuklash",
  "юклаш": "yuklash",
  "Чиқиш": "Chiqish",
  "чиқиш": "chiqish",
  "Кириш": "Kirish",
  "кириш": "kirish",

  // ТАБЛАР
  "Статистика": "Statistika",
  "статистика": "statistika",
  "Фототаблица": "Fototablitsa",
  "фототаблица": "fototablitsa",
  "Фототаблицада": "Fototablitsada",
  "Амалдаги": "Amaldagi",
  "амалдаги": "amaldagi",
  "Номзодлар": "Nomzodlar",
  "номзодлар": "nomzodlar",
  "Номзод": "Nomzod",
  "номзод": "nomzod",
  "Жадвали": "Jadvali",
  "жадвали": "jadvali",
  "Жадвал": "Jadval",
  "жадвал": "jadval",
  "Судланганлар": "Sudlanganlar",
  "судланганлар": "sudlanganlar",
  "Судланган": "Sudlangan",
  "судланган": "sudlangan",
  "Судланмаган": "Sudlanmagan",
  "судланмаган": "sudlanmagan",
  "Ягона": "Yagona",
  "ягона": "yagona",
  "База": "Baza",
  "база": "baza",
  "Аудит": "Audit",
  "аудит": "audit",
  "Созламалар": "Sozlamalar",
  "созламалар": "sozlamalar",
  "Уведомления": "Uvedomleniya",
  "уведомления": "uvedomleniya",
  "Синхронлаш": "Sinxronlash",
  "синхронлаш": "sinxronlash",

  // САНА/ВАҚТ
  "Сана": "Sana",
  "сана": "sana",
  "Вақт": "Vaqt",
  "вақт": "vaqt",
  "ВАҚТ": "VAQT",
  "Киритилган": "Kiritilgan",
  "киритилган": "kiritilgan",
  "Яратилган": "Yaratilgan",
  "яратилган": "yaratilgan",

  // ХАТО/ХАБАР
  "Диққат": "Diqqat",
  "диққат": "diqqat",
  "ДИҚҚАТ": "DIQQAT",
  "Хато": "Xato",
  "хато": "xato",
  "Муваффақиятли": "Muvaffaqiyatli",
  "муваффақиятли": "muvaffaqiyatli",
  "Рухсат": "Ruxsat",
  "рухсат": "ruxsat",
  "РУХСАТ": "RUXSAT",

  // ХАВФСИЗЛИК
  "Парол": "Parol",
  "парол": "parol",
  "Логин": "Login",
  "логин": "login",
  "Маxфий": "Maxfiy",
  "Махфий": "Maxfiy",
  "махфий": "maxfiy",
  "Хавфсизлик": "Xavfsizlik",
  "хавфсизлик": "xavfsizlik",

  // РАҚАМ
  "Жами": "Jami",
  "жами": "jami",
  "ЖАМИ": "JAMI",
  "сон": "son",
  "та": "ta",
  "та.": "ta.",

  // БОШҚА
  "Барча": "Barcha",
  "барча": "barcha",
  "Барчаси": "Barchasi",
  "барчаси": "barchasi",
  "Ҳаммаси": "Hammasi",
  "ҳаммаси": "hammasi",
  "Матн": "Matn",
  "матн": "matn",
  "Чоп": "Chop",
  "чоп": "chop",
  "Нусхалаш": "Nusxalash",
  "нусхалаш": "nusxalash",
  "Печать": "Pechat",
  "печать": "pechat",
  "Принтерга": "Printerga"
};

// -------------------- ҲАРФ-ҲАРФ ЛУҒАТИ --------------------
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

// -------------------- ТАРЖИМА ФУНКЦИЯСИ --------------------
function cyrToLat(text) {
  if (!text) return text;

  let result = text;

  // 1. Аввал сўз-сўз алмаштириш (муҳим сўзлар)
  Object.keys(WORD_DICTIONARY).forEach(cyrWord => {
    const latWord = WORD_DICTIONARY[cyrWord];
    // Сўз чегараси билан алмаштириш
    const regex = new RegExp(cyrWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, latWord);
  });

  // 2. Кейин ҳарф-ҳарф (қолган сўзлар учун)
  result = result.replace(/[А-Яа-яЁёЎўҚқҒғҲҳЪъЬьЫыЩщЭэЮюЯя]/g, ch => {
    return CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : ch;
  });

  return result;
}

// -------------------- ЛОТИН → КИРИЛЛ (қайтариш) --------------------
function latToCyr(text) {
  if (!text) return text;
  // Бу функция керак бўлса — кейинроқ
  return text;
}

// -------------------- АЛМАШТИРИШ --------------------
function toggleAlphabet() {
  isLatinMode = !isLatinMode;

  const btn = document.getElementById("btnLangToggle");
  if (btn) {
    btn.textContent = isLatinMode ? "🔤 Лотин → Кирилл" : "🔤 Кирилл / Лотин";
  }

  // Сақлаш
  localStorage.setItem("KOMPLAYENS_KADR_LANG", isLatinMode ? "lat" : "cyr");

  if (isLatinMode) {
    // БУТУН BODY да матнни ўзгартириш
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Script, style, button текшируви
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
            return NodeFilter.FILTER_REJECT;
          }
          // Бўш матн
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          // Рақамлар ва белгилар
          if (!/[А-Яа-яЁёЎўҚқҒғҲҳ]/.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (!node._origCyr) {
        node._origCyr = node.nodeValue;
      }
      // Тўлиқ матнни алмаштириш
      node.nodeValue = cyrToLat(node._origCyr);
    }

    // Input placeholderлар
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(el => {
      if (!el._origPlaceholder) {
        el._origPlaceholder = el.placeholder;
      }
      el.placeholder = cyrToLat(el._origPlaceholder);
    });

    // Select option матнлари — бу аллақачон TreeWalker орқали

    // Header таблар (улар ҳам TreeWalker да)
    // Тугади

  } else {
    // Асл ҳолатга қайтариш
    if (typeof renderAll === "function") {
      renderAll();
    }

    // Барча _origCyr ни тиклаш
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node._origCyr) {
        node.nodeValue = node._origCyr;
      }
    }

    // Placeholderларни тиклаш
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(el => {
      if (el._origPlaceholder) {
        el.placeholder = el._origPlaceholder;
      }
    });
  }
}

// -------------------- ТИЛНИ ЮКЛАШ (саҳифа очилганда) --------------------
function loadLanguage() {
  const saved = localStorage.getItem("KOMPLAYENS_KADR_LANG");
  if (saved === "lat") {
    // Кечикма билан — render дан кейин
    setTimeout(() => {
      if (!isLatinMode) toggleAlphabet();
    }, 500);
  }
}

// =========================================================================
// 3. INFO (Дастур ҳақида)
// =========================================================================

function showAboutModal() {
  let modal = document.getElementById("aboutModal");

  if (!modal) {
    modal = createAboutModal();
    document.body.appendChild(modal);
  }

  modal.classList.remove("hidden");

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

  setTimeout(() => modal.classList.add("hidden"), 200);
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
      <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-6 py-5 text-white relative">
        <button onclick="closeAboutModal()"
                class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer">
          ✕
        </button>
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-xl bg-white/10 border-2 border-white/30 flex items-center justify-center font-extrabold text-2xl text-white">КК</div>
          <div>
            <div class="text-xs uppercase tracking-widest text-blue-200 font-bold">Кадастр агентлиги</div>
            <h2 class="text-xl font-extrabold tracking-tight">«КОМПЛАЕНС-КАДР» v9.1</h2>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-5 text-slate-800">
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

        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">📋</span>
            <h3 class="font-extrabold text-slate-900">Асосий функциялар</h3>
          </div>
          <ul class="text-sm text-slate-600 space-y-1.5 leading-relaxed">
            <li>• 4 та роль (HR, Korrupsiya, Rahbar, Kuzatuvchi)</li>
            <li>• Номзодлар ва собиқ ходимлар реестри</li>
            <li>• ИЦ судланганлик текшируви</li>
            <li>• A4 Маълумотнома генерацияси</li>
            <li>• Word / Excel экспорт</li>
            <li>• Supabase Realtime онлайн база</li>
            <li>• 🔔 Уведомлениялар тизими</li>
            <li>• 📋 Аудит-лог (ким нима ўзгартирди)</li>
          </ul>
        </div>

        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">👨‍💻</span>
            <h3 class="font-extrabold text-blue-900">Дастур яратувчи</h3>
          </div>
          <div class="text-sm space-y-1">
            <div class="font-bold text-slate-900 text-base">Elbegiyev Muxriddin</div>
            <div class="flex items-center gap-2 text-slate-700">
              <span>📞</span>
              <a href="tel:+998339112222" class="font-mono font-bold hover:text-blue-700 hover:underline">+998 33 911 22 22</a>
            </div>
            <div class="flex items-center gap-2 text-slate-700">
              <span>✉️</span>
              <a href="mailto:komplayenskadastr@gmail.com" class="font-mono text-xs hover:text-blue-700 hover:underline">komplayenskadastr@gmail.com</a>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>📅 Версия: <b class="text-slate-700">9.1</b></span>
          <span>🗓 ${getTodayDate()}</span>
        </div>
      </div>

      <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
        <button onclick="closeAboutModal()" class="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold cursor-pointer">
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
// 4-18. ЁРДАМЧИ ФУНКЦИЯЛАР
// =========================================================================

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  return dateStr || "—";
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  if (timeStr) return `${dateStr} ${timeStr}`;
  return dateStr;
}

function timeAgo(dateTimeStr) {
  if (!dateTimeStr) return "—";
  try {
    const parts = dateTimeStr.split(" ");
    if (parts.length < 2) return dateTimeStr;
    const [datePart, timePart] = parts;
    const [dd, mm, yyyy] = datePart.split(".");
    const [hh, mi, ss] = (timePart || "00:00:00").split(":");
    const dt = new Date(yyyy, mm - 1, dd, hh || 0, mi || 0, ss || 0);
    const diffMin = Math.floor((Date.now() - dt.getTime()) / 60000);

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

  if (series) {
    series.addEventListener("input", (e) => {
      // Фақат катта A-Z, рақамлар ЭМАС
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2);
    });
  }
  if (number) {
    number.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 7);
    });
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modals = [
        { id: "aboutModal", fn: "closeAboutModal" },
        { id: "docModal", fn: "closeDocModal" },
        { id: "editorModal", fn: "closeEditorModal" },
        { id: "editCandidateModal", fn: "closeEditCandidateModal" },
        { id: "notificationPanel", fn: "closeNotificationPanel" }
      ];
      for (const m of modals) {
        const el = document.getElementById(m.id);
        if (el && !el.classList.contains("hidden")) {
          if (typeof window[m.fn] === "function") window[m.fn]();
          return;
        }
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("dbSearchInput");
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "q") {
      e.preventDefault();
      if (currentUser) doLogout();
    }
  });
}

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

function getStatusIcon(status) {
  const icons = {
    admin_review: "🔍", boss_review: "📤", approved: "✅",
    returned: "↩️", clean: "✓", sudlangan: "🚨",
    new: "🆕", in_process: "⏳", completed: "✅"
  };
  return icons[status] || "•";
}

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

function formatNumber(num) {
  if (typeof num !== "number") return "0";
  return num.toLocaleString("uz-UZ");
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("Clipboard API error:", e);
  }
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
    return false;
  }
}

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

function scrollToElement(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setupOnlineOfflineDetector() {
  window.addEventListener("online", () => {
    showToast("🌐 Интернет уланди", "success");
    if (typeof initRealtime === "function") initRealtime();
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
// INIT UI
// =========================================================================

function initUI() {
  loadTheme();
  if (typeof loadNotificationSoundSetting === "function") loadNotificationSoundSetting();
  startClock();
  setupKeyboardShortcuts();
  setupOnlineOfflineDetector();

  // Input форматлаш
  setupDateInput("inpBirthDate");
  setupPinflInput("inpPinfl");
  setupPassportInputs("inpPassSeries", "inpPassNum");

  setupDateInput("editCandBirthDate");
  setupPinflInput("editCandPinfl");
  setupPassportInputs("editCandPassSeries", "editCandPassNum");

  // Тилни юклаш (кечикма билан)
  loadLanguage();

  console.log("✅ UI созламалари тайёр");
}

console.log("✅ 12-ui.js юкланди (v9.1 — тўлиқ таржима)");
