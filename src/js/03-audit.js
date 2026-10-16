// =========================================================================
// 03-AUDIT.JS — Аудит-лог (ким нима қилди) + Юбориш журнали
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// =========================================================================
// АСОСИЙ ФУНКЦИЯЛАР
// =========================================================================

// -------------------- АУДИТ-ЛОГНИ ЮКЛАШ --------------------
function loadAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Audit log load warning:", e);
  }
  return [];
}

// -------------------- АУДИТ-ЛОГНИ САҚЛАШ --------------------
function saveAuditLog(log) {
  // Фақат 2000 та охирги ёзувни сақлаш (localStorage тўлиб қолмаслиги учун)
  const trimmed = log.slice(-2000);
  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Audit log save warning:", e);
  }
}

// -------------------- ЛОГГА ЁЗУВ ҚЎШИШ --------------------
function addAuditLog(action, details = "") {
  if (!currentUser) {
    console.warn("Audit: currentUser йўқ, ёзув қўшилмади");
    return;
  }

  const log = loadAuditLog();
  const now = getNow();

  log.push({
    id: "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    timestamp: now.dateTime,
    timestampISO: new Date().toISOString(),
    user: currentUser.login || "unknown",
    userName: currentUser.name || "",
    role: currentRole || "unknown",
    roleName: ROLE_NAMES[currentRole] || currentRole,
    action: action,
    details: details
  });

  saveAuditLog(log);
}

// -------------------- АУДИТ-ЛОГНИ ТОЗАЛАШ (30 кундан эски) --------------------
function clearAuditLog() {
  if (currentRole !== ROLES.KORRUPSIYA) {
    alert("Рухсат йўқ! Фақат Коррупцияга қарши курашиш бўлими тозалай олади.");
    return;
  }

  if (!confirm("Аудит-логдан 30 кундан эски ёзувларни ўчирмоқчимисиз?")) return;

  const log = loadAuditLog();
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const filtered = log.filter(x => new Date(x.timestampISO).getTime() > cutoff);
  const removed = log.length - filtered.length;

  saveAuditLog(filtered);
  addAuditLog("AUDIT_CLEAR", `${removed} та эски ёзув ўчирилди`);

  if (typeof renderAuditTable === "function") {
    renderAuditTable();
  }

  alert(`✅ ${removed} та эски ёзув ўчирилди.`);
}

// =========================================================================
// 🆕 ЖУРНАЛ ФУНКЦИЯЛАРИ — Номзод жараёни тарихи
// =========================================================================

// -------------------- БИТТА НОМЗОД УЧУН ТАРИХ --------------------
function getCandidateHistory(candidateId) {
  const log = loadAuditLog();
  return log.filter(x =>
    x.details && x.details.includes(candidateId)
  );
}

// -------------------- 🆕 НОМЗОД ҚЎШИЛГАНДА --------------------
function logCandidateAdded(candidate) {
  if (!candidate) return;
  addAuditLog(
    "CANDIDATE_ADDED",
    `${candidate.id} | ${candidate.fio} | ${candidate.region} | ${candidate.category}`
  );
}

// -------------------- 🆕 КОРРУПЦИЯ БЎЛИМИ КЎРГАНДА --------------------
function logKorrupsiyaViewed(candidate) {
  if (!candidate) return;
  addAuditLog(
    "KORRUPSIYA_VIEWED",
    `${candidate.id} | ${candidate.fio} | Коррупция бўлими кўриб чиқди`
  );
}

// -------------------- 🆕 ИЦ ТЕКШИРУВИ ЎЗГАРГАНДА --------------------
function logITSChecked(candidate, status, text) {
  if (!candidate) return;
  addAuditLog(
    "ITS_CHECKED",
    `${candidate.id} | ${candidate.fio} | Ҳолат: ${status} | ${text}`
  );
}

// -------------------- 🆕 БОШЛИҚҚА ЮБОРИЛГАНДА --------------------
function logSentToBoss(candidate, bossName = "Бўлим бошлиғи") {
  if (!candidate) return;

  const now = getNow();

  // Номзодга вақтни ёзиш
  candidate.sentToBossAt = now.date;
  candidate.sentToBossTime = now.time;
  candidate.sentToBossBy = currentUser?.login || "unknown";
  candidate.sentToBossByName = currentUser?.name || "Коррупция бўлими";

  addAuditLog(
    "SENT_TO_BOSS",
    `${candidate.id} | ${candidate.fio} | ${bossName}га юборилди | ${now.dateTime}`
  );

  // 🔔 Уведомления
  if (typeof addNotification === "function") {
    addNotification({
      type: "sent_to_boss",
      candidateId: candidate.id,
      candidateName: candidate.fio,
      message: "Бошлиққа юборилди",
      detail: `${candidate.region} | ${candidate.category}`,
      forRoles: [ROLES.RAHBAR]
    });
  }
}

// -------------------- 🆕 БОШЛИҚ КЎРГАНДА --------------------
function logBossViewed(candidate) {
  if (!candidate) return;

  const now = getNow();
  candidate.bossViewedAt = now.dateTime;

  addAuditLog(
    "BOSS_VIEWED",
    `${candidate.id} | ${candidate.fio} | Бошлиқ кўриб чиқди`
  );

  // 🔔 Уведомления
  if (typeof addNotification === "function") {
    addNotification({
      type: "boss_viewed",
      candidateId: candidate.id,
      candidateName: candidate.fio,
      message: "Бошлиқ кўриб чиқди",
      detail: `${candidate.region}`,
      forRoles: [ROLES.KORRUPSIYA]
    });
  }
}

// -------------------- 🆕 ТАСДИҚЛАНГАНДА --------------------
function logApproved(candidate, bossName = "И.Зарипов") {
  if (!candidate) return;

  const now = getNow();
  candidate.bossApprovedAt = now.dateTime;
  candidate.approvedDate = now.date;

  addAuditLog(
    "APPROVED",
    `${candidate.id} | ${candidate.fio} | ${bossName} томонидан ТАСДИҚЛАНДИ`
  );

  // 🔔 Уведомления: HR + Коррупция + Кузатувчи
  if (typeof addNotification === "function") {
    addNotification({
      type: "approved",
      candidateId: candidate.id,
      candidateName: candidate.fio,
      message: "✅ Тасдиқланди",
      detail: `${candidate.region} | ${candidate.category}`,
      forRoles: [ROLES.KADR, ROLES.KORRUPSIYA, ROLES.KUZATUVCHI]
    });
  }
}

// -------------------- 🆕 ҚАЙТАРИЛГАНДА --------------------
function logReturned(candidate, reason = "") {
  if (!candidate) return;

  const now = getNow();
  candidate.bossReturnedAt = now.dateTime;
  candidate.bossReturnReason = reason || "Изоҳ кўрсатилмаган";

  addAuditLog(
    "RETURNED",
    `${candidate.id} | ${candidate.fio} | Қайтарилди | Сабаб: ${candidate.bossReturnReason}`
  );

  // 🔔 Уведомления
  if (typeof addNotification === "function") {
    addNotification({
      type: "returned",
      candidateId: candidate.id,
      candidateName: candidate.fio,
      message: "↩️ Қайтарилди",
      detail: `Сабаб: ${candidate.bossReturnReason}`,
      forRoles: [ROLES.KORRUPSIYA]
    });
  }
}

// -------------------- 🆕 НОМЗОД ТАҲРИРЛАНГАНДА --------------------
function logCandidateEdited(candidate, changes = []) {
  if (!candidate) return;

  const changesText = changes
    .map(ch => `${ch.field}: "${ch.oldValue}" → "${ch.newValue}"`)
    .join(" | ");

  addAuditLog(
    "CANDIDATE_EDITED",
    `${candidate.id} | ${candidate.fio} | Ўзгаришлар: ${changesText}`
  );

  // 🔔 Уведомления
  if (typeof addNotification === "function") {
    addNotification({
      type: "candidate_edited",
      candidateId: candidate.id,
      candidateName: candidate.fio,
      message: "✏️ Таҳрирланди",
      detail: changesText.substring(0, 100),
      forRoles: [ROLES.KORRUPSIYA]
    });
  }
}

// -------------------- 🆕 НОМЗОД ЎЧИРИЛГАНДА --------------------
function logCandidateDeleted(candidate) {
  if (!candidate) return;

  addAuditLog(
    "CANDIDATE_DELETED",
    `${candidate.id} | ${candidate.fio} | ${candidate.region} | Ўчирилди`
  );
}

// =========================================================================
// 🆕 БИТТА НОМЗОД УЧУН ТАРИХНИ ЧИЗИШ (Timeline)
// =========================================================================

function renderCandidateTimeline(candidateId) {
  const history = getCandidateHistory(candidateId);

  if (history.length === 0) {
    return `<div class="text-xs text-slate-500 italic p-2">Тарих мавжуд эмас</div>`;
  }

  // Icon мап
  const icons = {
    CANDIDATE_ADDED: "🆕",
    KORRUPSIYA_VIEWED: "👁",
    ITS_CHECKED: "🔍",
    SENT_TO_BOSS: "📤",
    BOSS_VIEWED: "✅",
    APPROVED: "✅",
    RETURNED: "↩️",
    CANDIDATE_EDITED: "✏️",
    CANDIDATE_DELETED: "🗑"
  };

  // Rang мап
  const colors = {
    CANDIDATE_ADDED: "border-blue-400 bg-blue-50",
    KORRUPSIYA_VIEWED: "border-amber-400 bg-amber-50",
    ITS_CHECKED: "border-amber-400 bg-amber-50",
    SENT_TO_BOSS: "border-indigo-400 bg-indigo-50",
    BOSS_VIEWED: "border-emerald-400 bg-emerald-50",
    APPROVED: "border-emerald-500 bg-emerald-100",
    RETURNED: "border-red-400 bg-red-50",
    CANDIDATE_EDITED: "border-purple-400 bg-purple-50",
    CANDIDATE_DELETED: "border-red-500 bg-red-100"
  };

  let html = `<div class="space-y-2 text-xs">`;

  history.forEach(item => {
    const icon = icons[item.action] || "•";
    const color = colors[item.action] || "border-slate-300 bg-slate-50";

    // Details дан фойдаланувчига тушунарли матн
    let displayText = item.details || "";
    // ID ни олиб ташлаш (CAND-xxx |)
    displayText = displayText.replace(/CAND-\d+\s*\|\s*/g, "");
    // Ф.И.Ш. ни олиб ташлаш (такрорланмасин)
    const fioMatch = displayText.split("|");
    if (fioMatch.length > 1) {
      displayText = fioMatch.slice(1).join("|").trim();
    }

    html += `
      <div class="p-2 rounded-lg border-l-4 ${color}">
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="font-bold text-slate-800">${icon} ${formatActionName(item.action)}</span>
          <span class="text-[10px] text-slate-500 font-mono">${item.timestamp}</span>
        </div>
        <div class="text-slate-700">${displayText || "—"}</div>
        <div class="text-[10px] text-slate-500 mt-1">
          <b>${item.userName || item.user}</b> (${item.roleName || item.role})
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// -------------------- АМАЛ НОМИ (ўзбекча) --------------------
function formatActionName(action) {
  const names = {
    LOGIN: "Тизимга кирди",
    LOGOUT: "Тизимдан чиқди",
    CANDIDATE_ADDED: "Янги номзод қўшилди",
    KORRUPSIYA_VIEWED: "Кўриб чиқилди",
    ITS_CHECKED: "ИЦ текшируви",
    SENT_TO_BOSS: "Бошлиққа юборилди",
    BOSS_VIEWED: "Бошлиқ кўрди",
    APPROVED: "Тасдиқланди",
    RETURNED: "Қайтарилди",
    CANDIDATE_EDITED: "Таҳрирланди",
    CANDIDATE_DELETED: "Ўчирилди",
    USER_CREATE: "Фойдаланувчи яратилди",
    USER_DELETE: "Фойдаланувчи ўчирилди",
    AUDIT_CLEAR: "Аудит тозаланди",
    SUPABASE_CONFIG: "Supabase созламаси",
    REALTIME_RECONNECT: "Realtime қайта уланди",
    D_DRIVE_CONNECT: "D:\\ диск уланди",
    BACKUP: "Захира нусха",
    RESTORE: "Тикланди",
    ROLE_SWITCH: "Роль алмаштирилди"
  };
  return names[action] || action;
}

// =========================================================================
// АУДИТ-ЛОГ ЖАДВАЛИНИ ЧИЗИШ
// =========================================================================

function renderAuditTable() {
  const tbody = document.getElementById("auditTableBody");
  if (!tbody) return;

  const log = loadAuditLog().slice().reverse(); // Энг янги юқорида

  if (log.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500 font-bold">Аудит-лог бўш</td></tr>`;
    return;
  }

  tbody.innerHTML = log.map((item, idx) => `
    <tr>
      <td class="text-center font-bold">${idx + 1}</td>
      <td class="font-mono text-xs">${item.timestamp}</td>
      <td class="font-bold text-xs">${item.userName || item.user}</td>
      <td class="text-xs font-bold">${item.roleName || item.role}</td>
      <td class="text-xs font-bold text-blue-800">${formatActionName(item.action)}</td>
      <td class="text-xs">${(item.details || "—").substring(0, 120)}</td>
    </tr>
  `).join("");
}

// =========================================================================
// ЖУРНАЛНИ EXCEL ГА ЭКСПОРТ
// =========================================================================

function exportAuditLogExcel() {
  const log = loadAuditLog();
  if (log.length === 0) {
    alert("Аудит-лог бўш!");
    return;
  }

  let rows = "";
  log.forEach((item, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${item.timestamp}</td>
        <td>${item.userName || item.user}</td>
        <td>${item.roleName || item.role}</td>
        <td>${formatActionName(item.action)}</td>
        <td>${(item.details || "").replace(/</g, "&lt;")}</td>
      </tr>
    `;
  });

  const table = `<table><thead><tr>
    <th>Т/р</th><th>Вақт</th><th>Фойдаланувчи</th>
    <th>Роль</th><th>Амал</th><th>Тафсилот</th>
  </tr></thead><tbody>${rows}</tbody></table>`;

  const now = getNow();
  downloadBlobFile(
    wrapFramedExportHtml("Аудит-Лог — Ким нима ўзгартирди", table),
    `Audit_Log_${now.date.replace(/\./g, "_")}.xls`,
    "application/vnd.ms-excel;charset=utf-8"
  );
}

// -------------------- ЛОГ ----------
console.log("✅ 03-audit.js юкланди");
