// =========================================================================
// 05-AUTH.JS — Логин, Чиқиш, Роллар, Рухсатлар
// «КОМПЛАЕНС-КАДР» v9.0
// Роль: admin → korrupsiya (Коррупцияга қарши курашиш бўлими)
// =========================================================================

// =========================================================================
// РУХСАТЛАР МАТРИЦАСИ
// =========================================================================

const PERMISSIONS = {
  // Номзод бошқаруви
  add_candidate: ["kadr", "korrupsiya"],
  edit_candidate: ["korrupsiya"],
  delete_candidate: ["korrupsiya"],
  view_candidate_details: ["korrupsiya", "rahbar"],

  // Жараён
  edit_its: ["korrupsiya"],
  send_to_boss: ["korrupsiya"],
  approve: ["rahbar"],
  return: ["rahbar"],

  // Кўриниш
  view_all_tabs: ["korrupsiya"],
  view_its_tab: ["korrupsiya", "rahbar"],
  view_negative_tab: ["korrupsiya", "rahbar", "kuzatuvchi"],
  view_database_tab: ["korrupsiya", "rahbar", "kuzatuvchi"],
  view_audit_tab: ["korrupsiya"],
  view_settings_tab: ["korrupsiya"],
  view_timeline: ["korrupsiya", "rahbar"],

  // Экспорт
  export_negative: ["korrupsiya"],
  export_audit: ["korrupsiya"],
  export_full_database: ["korrupsiya", "rahbar"],

  // Фойдаланувчи бошқаруви
  create_user: ["korrupsiya"],
  delete_user: ["korrupsiya"]
};

// -------------------- РУХСАТНИ ТЕКШИРИШ --------------------
function hasPermission(action) {
  if (!currentRole) return false;
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(currentRole);
}

// =========================================================================
// ЛОГИН
// =========================================================================

// -------------------- КИРИШ --------------------
async function performLogin() {
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const errorBox = document.getElementById("loginError");

  if (!usernameInput || !passwordInput) return;

  const u = usernameInput.value.trim();
  const p = passwordInput.value.trim();

  // Валидация
  if (!u || !p) {
    errorBox.textContent = "Логин ва паролни киритинг!";
    errorBox.classList.remove("hidden");
    return;
  }

  // Фойдаланувчини топиш
  const found = appState.users.find(x => x.login === u);

  if (!found) {
    errorBox.textContent = "Логин топилмади!";
    errorBox.classList.remove("hidden");
    passwordInput.value = "";
    return;
  }

  // Паролни текшириш
  let isValid = false;

  if (found.passHash) {
    // Хешланган парол
    isValid = await verifyPassword(p, found.passHash);
  } else if (found.pass) {
    // Эски усул — биринчи кириш
    if (found.pass === p) {
      isValid = true;
      // Хешга ўтказиш
      const success = await migratePasswordToHash(found, p);
      if (success) {
        saveState();
        console.log(`✅ ${found.login} пароли хешланди`);
      }
    }
  }

  if (!isValid) {
    errorBox.textContent = "Парол нотўғри!";
    errorBox.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  // Муваффақиятли кириш
  errorBox.classList.add("hidden");
  document.getElementById("loginOverlay").classList.add("hidden");

  currentUser = found;
  currentRole = found.role;

  // Сессияни сақлаш
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    login: found.login,
    role: found.role,
    loginTime: new Date().toISOString()
  }));

  // Audit log
  if (typeof addAuditLog === "function") {
    addAuditLog("LOGIN", `${found.name} тизимга кирди`);
  }

  // Ролни қўллаш
  switchRole(found.role);

  // Синхронлаш
  if (typeof pullFromSupabase === "function") {
    pullFromSupabase(false);
  }

  // Хуш келибсиз хабари
  if (typeof showToast === "function") {
    showToast(`Хуш келибсиз, ${found.name}!`, "success");
  }
}

// -------------------- ЧИҚИШ --------------------
function doLogout() {
  if (!confirm("Тизимдан чиқмоқчимисиз?")) return;

  // Audit log
  if (typeof addAuditLog === "function" && currentUser) {
    addAuditLog("LOGOUT", `${currentUser.name} чиқди`);
  }

  // Сессияни ўчириш
  localStorage.removeItem(SESSION_KEY);

  // Ўзгарувчиларни тозалаш
  currentUser = null;
  currentRole = null;
  currentSubTab = "new";

  // Логин ойнасини кўрсатиш
  const loginOverlay = document.getElementById("loginOverlay");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");

  if (loginOverlay) loginOverlay.classList.remove("hidden");
  if (usernameInput) usernameInput.value = "";
  if (passwordInput) passwordInput.value = "";

  // Роль кўрсаткичини янгилаш
  const roleLabel = document.getElementById("currentRoleLabel");
  if (roleLabel) roleLabel.textContent = "— Тизимга кирилмаган —";

  const banner = document.getElementById("roleBannerText");
  if (banner) banner.innerHTML = "";

  // Барча табларни яшириш
  ["tabBtnIts", "tabBtnNegative", "tabBtnDatabase", "tabBtnAudit", "tabBtnSettings"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Махсус элементларни яшириш
  const negativeExportWrap = document.getElementById("negativeExportWrap");
  if (negativeExportWrap) negativeExportWrap.style.display = "none";

  const btnBulk = document.getElementById("btnBulkSendClean");
  if (btnBulk) btnBulk.style.display = "none";

  // Фототаблицага ўтиш
  if (typeof switchTab === "function") {
    switchTab("fototablitsa");
  }
}

// -------------------- СЕССИЯНИ ТЕКШИРИШ --------------------
function checkSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    const session = JSON.parse(raw);
    if (!session.login) return false;

    const user = appState.users.find(u => u.login === session.login);
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }

    // Сессияни тиклаш
    currentUser = user;
    currentRole = user.role;

    console.log(`✅ Сессия тикланди: ${user.login}`);

    return true;
  } catch (e) {
    console.warn("Session check warning:", e);
    return false;
  }
}

// =========================================================================
// РОЛНИ АЛМАШТИРИШ
// =========================================================================

function switchRole(role) {
  currentRole = role;

  // Роль номи
  const roleLabel = document.getElementById("currentRoleLabel");
  if (roleLabel) {
    roleLabel.textContent = ROLE_NAMES[role] || role;
  }

  // Баннер
  const banner = document.getElementById("roleBannerText");
  if (banner) {
    if (role === ROLES.KADR) {
      banner.innerHTML = "👤 <b>Кадрлар бўлими (HR)</b> — Номзод ва собиқ ходимларни киритади. Текширув жараёнини кўради, лекин админ босқичларини кўрмайди.";
    } else if (role === ROLES.KORRUPSIYA) {
      banner.innerHTML = "🛡️ <b>Коррупцияга қарши курашиш бўлими</b> — ИЦ текширади, ЖК моддасини киритади, Бўлим бошлиғига тасдиқлашга юборади.";
    } else if (role === ROLES.RAHBAR) {
      banner.innerHTML = "✅ <b>Бўлим бошлиғи (И.Зарипов)</b> — Коррупция бўлими юборган Маълумотномани тасдиқлайди ёки таҳрирга қайтаради.";
    } else if (role === ROLES.KUZATUVCHI) {
      banner.innerHTML = "👁 <b>Раҳбар Кузатувчи</b> — Фақат тасдиқланган («Ўрганиб чиқилди») хулосаларни ўқий олади.";
    }
  }

  // Табларни янгилаш
  updateTabVisibility(role);

  // Суб-табни янгилаш
  if (typeof updateSubtabsVisibility === "function") {
    updateSubtabsVisibility(role);
  }

  // Номзод қўшиш панели
  const addPanel = document.getElementById("addCandidatePanel");
  const fotoContainer = document.getElementById("fototablitsaContainer");

  if (addPanel && fotoContainer) {
    if (role === ROLES.RAHBAR || role === ROLES.KUZATUVCHI) {
      addPanel.classList.add("hidden");
      fotoContainer.className = "lg:col-span-12 bg-white dark-card rounded-2xl border border-slate-200 p-5 shadow-sm";
    } else {
      addPanel.classList.remove("hidden");
      fotoContainer.className = "lg:col-span-8 bg-white dark-card rounded-2xl border border-slate-200 p-5 shadow-sm";
    }
  }

  // Ролга мос бўлмаган табдан кетиш
  const forbiddenForKadr = ["its", "negative", "settings", "audit"];
  const forbiddenForRahbar = ["settings", "audit"];
  const forbiddenForKuzatuvchi = ["its", "settings", "audit"];

  if (role === ROLES.KADR && forbiddenForKadr.includes(currentTab)) {
    if (typeof switchTab === "function") switchTab("fototablitsa");
  } else if (role === ROLES.RAHBAR && forbiddenForRahbar.includes(currentTab)) {
    if (typeof switchTab === "function") switchTab("dashboard");
  } else if (role === ROLES.KUZATUVCHI && forbiddenForKuzatuvchi.includes(currentTab)) {
    if (typeof switchTab === "function") switchTab("dashboard");
  } else {
    if (typeof renderAll === "function") renderAll();
  }

  // Audit
  if (typeof addAuditLog === "function" && currentUser) {
    // addAuditLog("ROLE_SWITCH", role); // Кераклигича
  }
}

// =========================================================================
// ТАБЛАРНИ КЎРСАТИШ / ЯШИРИШ
// =========================================================================

function updateTabVisibility(role) {
  const tabs = {
    tabBtnIts: hasPermission("view_its_tab"),
    tabBtnNegative: hasPermission("view_negative_tab"),
    tabBtnDatabase: hasPermission("view_database_tab"),
    tabBtnAudit: hasPermission("view_audit_tab"),
    tabBtnSettings: hasPermission("view_settings_tab")
  };

  Object.keys(tabs).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = tabs[id] ? "inline-block" : "none";
    }
  });

  // Махсус элементлар
  const negativeExportWrap = document.getElementById("negativeExportWrap");
  if (negativeExportWrap) {
    negativeExportWrap.style.display = hasPermission("export_negative") ? "block" : "none";
  }

  const btnBulk = document.getElementById("btnBulkSendClean");
  if (btnBulk) {
    btnBulk.style.display = hasPermission("send_to_boss") ? "inline-block" : "none";
  }
}

// =========================================================================
// СУБ-ТАБЛАРНИ КЎРСАТИШ / ЯШИРИШ
// =========================================================================

function updateSubtabsVisibility(role) {
  const subNew = document.getElementById("subtabNew");
  const subInProcess = document.getElementById("subtabInProcess");
  const subApproved = document.getElementById("subtabApproved");

  if (!subNew || !subInProcess || !subApproved) return;

  if (role === ROLES.KADR) {
    // HR: Фақат 2 та суб-таб (Янги яширин)
    subNew.style.display = "none";
    subInProcess.style.display = "inline-block";
    subApproved.style.display = "inline-block";

    // Агар жорий суб-таб "new" бўлса — "in_process" га ўтиш
    if (currentSubTab === "new") {
      currentSubTab = "in_process";
    }
  } else if (role === ROLES.KORRUPSIYA) {
    // Коррупция: 3 та суб-таб
    subNew.style.display = "inline-block";
    subInProcess.style.display = "inline-block";
    subApproved.style.display = "inline-block";
  } else if (role === ROLES.RAHBAR) {
    // Раҳбар: "Бошлиқда" + "Тугатилган"
    subNew.style.display = "none";
    subInProcess.style.display = "inline-block";
    subApproved.style.display = "inline-block";

    if (currentSubTab === "new") {
      currentSubTab = "in_process";
    }
  } else if (role === ROLES.KUZATUVCHI) {
    // Кузатувчи: Фақат "Тугатилган"
    subNew.style.display = "none";
    subInProcess.style.display = "none";
    subApproved.style.display = "inline-block";

    currentSubTab = "approved";
  }
}

// =========================================================================
// ТАБЛАРНИ АЛМАШТИРИШ
// =========================================================================

function switchTab(tab) {
  currentTab = tab;

  const views = {
    dashboard: "viewDashboard",
    fototablitsa: "viewFototablitsa",
    former: "viewFormer",
    its: "viewIts",
    negative: "viewNegative",
    database: "viewDatabase",
    audit: "viewAudit",
    settings: "viewSettings"
  };

  const btns = {
    dashboard: "tabBtnDashboard",
    fototablitsa: "tabBtnFototablitsa",
    former: "tabBtnFormer",
    its: "tabBtnIts",
    negative: "tabBtnNegative",
    database: "tabBtnDatabase",
    audit: "tabBtnAudit",
    settings: "tabBtnSettings"
  };

  Object.keys(views).forEach(k => {
    const viewEl = document.getElementById(views[k]);
    if (viewEl) viewEl.classList.toggle("hidden", k !== tab);

    const b = document.getElementById(btns[k]);
    if (b) {
      if (k === tab) {
        b.className = "px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-500 text-slate-950 shadow cursor-pointer";
      } else {
        b.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer";
      }
    }
  });

  if (typeof renderAll === "function") {
    renderAll();
  }
}

// =========================================================================
// СУБ-ТАБНИ АЛМАШТИРИШ
// =========================================================================

function switchSubTab(subtab) {
  currentSubTab = subtab;

  // Суб-таб тугмаларини янгилаш
  const tabs = ["new", "in_process", "approved"];
  tabs.forEach(t => {
    const btn = document.getElementById(`subtab${t.charAt(0).toUpperCase() + t.slice(1).replace("_", "")}`);
    if (btn) {
      if (t === subtab) {
        btn.className = "px-4 py-2 rounded-lg text-sm font-extrabold bg-blue-600 text-white shadow cursor-pointer";
      } else {
        btn.className = "px-4 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 cursor-pointer";
      }
    }
  });

  // Рендер
  if (typeof renderFototablitsaTable === "function") {
    renderFototablitsaTable();
  }
}

// -------------------- ЛОГ ----------
console.log("✅ 05-auth.js юкланди");
