// =========================================================================
// 01-CONFIG.JS — Константалар ва бошланғич ҳолат
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// -------------------- 14 та ҲУДУД --------------------
const REGIONS_14 = [
  "Жиззах вилояти",
  "Тошкент шаҳри",
  "Тошкент вилояти",
  "Самарқанд вилояти",
  "Фарғона вилояти",
  "Андижон вилояти",
  "Наманган вилояти",
  "Бухоро вилояти",
  "Навоий вилояти",
  "Қашқадарё вилояти",
  "Сурхондарё вилояти",
  "Сирдарё вилояти",
  "Хоразм вилояти",
  "Қорақалпоғистон Республикаси"
];

// -------------------- LOCALSTORAGE КАЛИТЛАРИ --------------------
const STORAGE_KEY = "KOMPLAYENS_KADR_V90_STATE";
const SUPABASE_CONFIG_KEY = "KOMPLAYENS_KADR_V90_SUPABASE";
const AUDIT_LOG_KEY = "KOMPLAYENS_KADR_V90_AUDIT";
const NOTIFICATIONS_KEY = "KOMPLAYENS_KADR_V90_NOTIFICATIONS";
const SESSION_KEY = "KOMPLAYENS_KADR_V90_SESSION";
const THEME_KEY = "KOMPLAYENS_KADR_V90_THEME";

// -------------------- SUPABASE КАЛИТЛАРИ (Сизнинг) --------------------
const DEFAULT_SUPABASE_URL = "https://kyihefutrwvukbaewzor.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_3BO5cEP52JH4KNfGpWlylw_pM0_zg7N";

// -------------------- РОЛЛАР --------------------
const ROLES = {
  KADR: "kadr",
  KORRUPSIYA: "korrupsiya",
  RAHBAR: "rahbar",
  KUZATUVCHI: "kuzatuvchi"
};

const ROLE_NAMES = {
  kadr: "👤 Кадрлар бўлими (HR)",
  korrupsiya: "🛡️ Коррупцияга қарши курашиш бўлими",
  rahbar: "✅ Бўлим бошлиғи (И.Зарипов)",
  kuzatuvchi: "👁 Раҳбар Кузатувчи"
};

// -------------------- WORKFLOW БОСҚИЧЛАРИ --------------------
const WORKFLOW = {
  ADMIN_REVIEW: "admin_review",     // Коррупция бўлими ўрганмоқда
  BOSS_REVIEW: "boss_review",        // Бошлиқ тасдиғида
  APPROVED: "approved"                // Тасдиқланган
};

// -------------------- ЙЎНАЛИШЛАР (8 та) --------------------
const CATEGORIES = [
  "КА туман (шаҳар) бўлими бошлиғи",
  "ДКП туман (шаҳар) филиали бошлиғи",
  "КА ҳудудий бошқармаси бошлиғи",
  "ДКП ҳудудий бошқармаси бошлиғи",
  "КА марказий аппарати ходими",
  "ДКП марказий аппарати ходими",
  "Комплаенс хизмати ходими",
  "Собиқ ходимлар йўналиши"
];

// -------------------- ГЛОБАЛ ЎЗГАРУВЧИЛАР --------------------
let currentRole = null;
let currentUser = null;
let currentTab = "fototablitsa";
let currentSubTab = "new";               // 🆕 Суб-таб: new | in_process | approved
let activeCandidateId = null;
let dDriveFileHandle = null;
let isLatinMode = false;
let appState = null;

// -------------------- БОШЛАНҒИЧ ҲОЛАТ (ДЕМО МАЪЛУМОТСИЗ!) --------------------
const INITIAL_STATE = {
  version: 1,
  users: [
    {
      login: "admin",
      passHash: null,
      pass: "Komplayens2026!",
      name: "Комплаенс Админ (Яратувчи)",
      role: "korrupsiya"
    },
    {
      login: "zaripov",
      passHash: null,
      pass: "Rahbar2026!",
      name: "И.Зарипов — Бўлим бошлиғи",
      role: "rahbar"
    },
    {
      login: "kadr_jizzax",
      passHash: null,
      pass: "Kadr2026!",
      name: "Кадрлар бўлими масъул ходими",
      role: "kadr"
    },
    {
      login: "rahbariyat",
      passHash: null,
      pass: "Kuzatuv2026!",
      name: "Раҳбар Кузатувчи (Юқори раҳбарият)",
      role: "kuzatuvchi"
    }
  ],
  candidates: [],                    // 🆕 БЎШ — демо маълумот ЙЎҚ!
  notifications: []                  // 🆕 Уведомления
};

// -------------------- ҲОЛАТНИ ЮКЛАШ --------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.candidates)) {
        if (typeof parsed.version !== "number") parsed.version = 1;
        if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
        return parsed;
      }
    }
  } catch (e) {
    console.warn("State load warning:", e);
  }
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

// -------------------- ҲОЛАТНИ САҚЛАШ --------------------
function saveState() {
  if (!appState) return;
  appState.version = (appState.version || 0) + 1;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn("Local save warning:", e);
  }

  // D:\ дискга авто-сақлаш (Electron)
  if (typeof autoWriteToDDrive === "function") {
    autoWriteToDDrive();
  }

  // Supabase га юбориш
  if (typeof pushToSupabase === "function") {
    pushToSupabase();
  }
}

// -------------------- ЁРДАМЧИ: САНА ВА ВАҚТ --------------------
function getNow() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return {
    date: `${dd}.${mm}.${yyyy}`,
    time: `${hh}:${mi}:${ss}`,
    dateTime: `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`,
    year: String(yyyy),
    month: mm
  };
}

// -------------------- ЁРДАМЧИ: SVG АВАТАР --------------------
function makeAvatarSvg(initials, bg = "#4a6fa5") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="140" viewBox="0 0 110 140">
    <rect width="110" height="140" fill="${bg}"/>
    <circle cx="55" cy="48" r="22" fill="#e2e8f0"/>
    <path d="M18 132 C18 95 92 95 92 132 Z" fill="#e2e8f0"/>
    <text x="55" y="54" text-anchor="middle" fill="${bg}" font-family="Arial" font-weight="bold" font-size="14">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// -------------------- ЁРДАМЧИ: TOAST ХАБАР --------------------
function showToast(message, type = "info") {
  const colors = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  };

  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 z-[9999] ${colors[type]} text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm`;
  toast.textContent = message;
  toast.style.transition = "all 0.3s";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// -------------------- ЛОГ ----------
console.log("✅ 01-config.js юкланди");
