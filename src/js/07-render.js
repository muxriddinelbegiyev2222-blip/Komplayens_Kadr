// =========================================================================
// 07-RENDER.JS — Жадвалларни, KPI ва Статистикани экранга чиқариш
// «КОМПЛАЕНС-КАДР» v11.9 FINAL
// =========================================================================

let activeSubTab = "new"; // new, in_process, approved, rejected

function renderAll() {
  if (typeof renderKPI === "function") renderKPI();
  if (typeof renderFototablitsa === "function") renderFototablitsa();
  if (typeof renderFormer === "function") renderFormer();
  if (typeof renderHired === "function") renderHired();
  if (typeof renderItsTable === "function") renderItsTable();
  if (typeof renderNegative === "function") renderNegative();
  if (typeof renderDatabase === "function") renderDatabase();
  if (typeof renderDashboard === "function") renderDashboard();
  if (typeof renderAuditLog === "function") renderAuditLog();
  if (typeof renderUsersTable === "function") renderUsersTable();
  if (typeof updateSubTabCounts === "function") updateSubTabCounts();
  if (typeof applyPagination === "function") applyPagination();
  
  // 3D Menyularni aktiv qilish
  const activeTab = typeof activeMainTab !== 'undefined' ? activeMainTab : 'fototablitsa';
  document.querySelectorAll('.nav-card').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tabBtn${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)?.classList.add('active');
}

// =========================================================================
// KPI CARDS (Юқоридаги рақамлар)
// =========================================================================
function renderKPI() {
  const total = appState.candidates.length;
  const current = appState.candidates.filter(c => c.recordType === "current").length;
  const former = appState.candidates.filter(c => c.recordType === "former").length;
  
  // O'rganish jarayonida (admin_review, boss_review, hr_final)
  const inProcess = appState.candidates.filter(c => 
    c.workflowStage === "admin_review" || 
    c.workflowStage === "boss_review" || 
    c.workflowStage === "hr_final"
  ).length;
  
  // Ishga qabul qilinganlar
  const approved = appState.candidates.filter(c => c.workflowStage === "hired").length;
  
  // Sudlanganlar
  const sudlangan = appState.candidates.filter(c => c.sudlanganStatus === "sudlangan").length;

  if (document.getElementById("kpiTotal")) document.getElementById("kpiTotal").textContent = total;
  if (document.getElementById("kpiCurrent")) document.getElementById("kpiCurrent").textContent = current;
  if (document.getElementById("kpiFormer")) document.getElementById("kpiFormer").textContent = former;
  if (document.getElementById("kpiInProcess")) document.getElementById("kpiInProcess").textContent = inProcess;
  if (document.getElementById("kpiApproved")) document.getElementById("kpiApproved").textContent = approved;
  if (document.getElementById("kpiSudlangan")) document.getElementById("kpiSudlangan").textContent = sudlangan;
}

// =========================================================================
// SUB-TABLAR (Ички менюлар сони)
// =========================================================================
function updateSubTabCounts() {
  const list = appState.candidates.filter(c => c.recordType === "current");
  
  const countNew = list.filter(c => c.workflowStage === "admin_review").length;
  const countInProcess = list.filter(c => c.workflowStage === "boss_review" || c.workflowStage === "hr_final").length;
  const countApproved = list.filter(c => c.workflowStage === "hired").length;
  const countRejected = list.filter(c => c.workflowStage === "rejected").length;

  if (document.getElementById("subtabNewCount")) document.getElementById("subtabNewCount").textContent = countNew;
  if (document.getElementById("subtabInProcessCount")) document.getElementById("subtabInProcessCount").textContent = countInProcess;
  if (document.getElementById("subtabApprovedCount")) document.getElementById("subtabApprovedCount").textContent = countApproved;
  if (document.getElementById("subtabRejectedCount")) document.getElementById("subtabRejectedCount").textContent = countRejected;
}

// =========================================================================
// ЁРДАМЧИ: ФИЛЬТРЛАШ
// =========================================================================
function getFilteredCandidates(recordType, stageFilter = null) {
  const regElId = recordType === "former" ? "formerRegionFilter" : "fotoRegionFilter";
  const catElId = "fotoCategoryFilter";
  
  const reg = document.getElementById(regElId)?.value || "ALL";
  const cat = document.getElementById(catElId)?.value || "ALL";

  return appState.candidates.filter(c => {
    if (c.recordType !== recordType) return false;
    if (reg !== "ALL" && c.region !== reg) return false;
    if (recordType === "current" && cat !== "ALL" && c.category !== cat) return false;
    
    if (stageFilter) {
      if (stageFilter === "new" && c.workflowStage !== "admin_review") return false;
      if (stageFilter === "in_process" && c.workflowStage !== "boss_review" && c.workflowStage !== "hr_final") return false;
      if (stageFilter === "approved" && c.workflowStage !== "hired") return false;
      if (stageFilter === "rejected" && c.workflowStage !== "rejected") return false;
    }
    return true;
  });
}

// =========================================================================
// ФОТОТАБЛИЦА ЖАДВАЛИ
// =========================================================================
function renderFototablitsa() {
  const tbody = document.getElementById("fototablitsaBody");
  if (!tbody) return;

  const list = getFilteredCandidates("current", activeSubTab);
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500 font-bold">Ёзувлар топилмади</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    
    // Tugmalarni shakllantirish
    let actionBtns = "";
    if (c.workflowStage === "admin_review") {
      actionBtns = `
        <button onclick="editCandidate('${c.id}')" class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Tahrirlash</button>
      `;
    } else if (c.workflowStage === "boss_review" || c.workflowStage === "hr_final") {
      actionBtns = `
        <button onclick="openDocModal('${c.id}')" class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">Ma'lumotnoma</button>
      `;
    } else if (c.workflowStage === "hired") {
      actionBtns = `
        <button onclick="hrRejectCandidate('${c.id}')" class="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold">Bekor qilish</button>
        <button onclick="openDocModal('${c.id}')" class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">Ma'lumotnoma</button>
      `;
    } else if (c.workflowStage === "rejected") {
      actionBtns = `
        <button onclick="hrHireCandidate('${c.id}')" class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">Qabul qilish</button>
      `;
    }

    tr.innerHTML = `
      <td class="text-center font-bold">${i + 1}</td>
      <td class="text-center"><img src="${c.photo}" class="w-12 h-16 object-cover mx-auto rounded border shadow-sm" /></td>
      <td class="text-center">
        <b>${c.fio}</b><br/>
        <span class="text-xs text-slate-500">${c.birthDate} й., ${c.birthPlace}</span><br/>
        <span class="text-xs font-mono">${c.pinfl}</span>
      </td>
      <td class="text-center text-xs">
        ${c.currentJob}<br/>
        <b>${c.jobSince} дан</b>
      </td>
      <td class="text-center">
        ${getFinalResultPlainText(c)}<br/>
        <div class="flex justify-center gap-1 mt-1 flex-wrap">
          ${actionBtns}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// HIRED (ИШГА ҚАБУЛ ҚИЛИНГАНЛАР) ЖАДВАЛИ
// =========================================================================
function renderHired() {
  const tbody = document.getElementById("hiredTableBody");
  if (!tbody) return;

  const list = appState.candidates.filter(c => c.workflowStage === "hired" && c.recordType === "current");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500 font-bold">Ишга қабул қилинганлар йўқ</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-bold">${i + 1}</td>
      <td class="text-center"><img src="${c.photo}" class="w-12 h-16 object-cover mx-auto rounded border shadow-sm" /></td>
      <td class="text-center"><b>${c.fio}</b><br/><span class="text-xs font-mono">${c.pinfl}</span></td>
      <td class="text-center text-xs">${c.currentJob}</td>
      <td class="text-center font-bold text-emerald-700">${c.approvedDate || "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// FORMER (СОБИҚ ХОДИМЛАР) ЖАДВАЛИ
// =========================================================================
function renderFormer() {
  const tbody = document.getElementById("formerTableBody");
  if (!tbody) return;

  const list = getFilteredCandidates("former");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500 font-bold">Ёзувлар топилмади</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-bold">${i + 1}</td>
      <td class="text-center"><img src="${c.photo}" class="w-12 h-16 object-cover mx-auto rounded border shadow-sm" /></td>
      <td class="text-center"><b>${c.fio}</b><br/><span class="text-xs font-mono">${c.pinfl}</span></td>
      <td class="text-center text-xs">${c.currentJob}</td>
      <td class="text-center">
        ${getFinalResultPlainText(c)}<br/>
        <button onclick="openDocModal('${c.id}')" class="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">Ma'lumotnoma</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// ITS (СУДЛАНГАНЛИК ТЕКШИРУВИ) ЖАДВАЛИ
// =========================================================================
function renderItsTable() {
  const tbody = document.getElementById("itsTableBody");
  if (!tbody) return;

  const filter = document.getElementById("itsFilterStatus")?.value || "ALL";
  let list = appState.candidates;
  
  if (filter === "UNCHECKED") list = list.filter(c => !c.itsChecked);
  else if (filter === "SUDLANGAN") list = list.filter(c => c.sudlanganStatus === "sudlangan");

  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-slate-500 font-bold">Ёзувлар топилмади</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-bold">${i + 1}</td>
      <td>${c.fio}</td>
      <td class="text-center">${c.birthDate}</td>
      <td class="text-center">${c.passSeries}</td>
      <td class="text-center">${c.passNum}</td>
      <td class="text-center font-mono">${c.pinfl}</td>
      <td class="text-center">${c.recordType}</td>
      <td>
        <select id="itsSel_${c.id}" class="px-2 py-1 border rounded text-xs w-full mb-1 outline-none focus:ring-1 focus:ring-blue-500">
          <option value="clean" ${c.sudlanganStatus === 'clean' ? 'selected' : ''}>✓ Тоза</option>
          <option value="sudlangan" ${c.sudlanganStatus === 'sudlangan' ? 'selected' : ''}>🚨 Судланган</option>
        </select>
        <input id="itsTxt_${c.id}" type="text" value="${c.sudlanganText}" class="px-2 py-1 border rounded text-xs w-full outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="text-center"><button onclick="quickSaveItsRow('${c.id}', true)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow text-xs font-bold transition">Saqlash</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// NEGATIVE (СУДЛАНГАНЛАР) ЖАДВАЛИ
// =========================================================================
function renderNegative() {
  const tbody = document.getElementById("negativeTableBody");
  if (!tbody) return;

  const list = appState.candidates.filter(c => c.sudlanganStatus === "sudlangan");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-500 font-bold">Судланганлар йўқ</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-bold">${i + 1}</td>
      <td><b>${c.fio}</b><br/><span class="text-xs text-slate-500">${c.birthDate}</span></td>
      <td class="font-mono text-xs">${c.passSeries} ${c.passNum} | ${c.pinfl}</td>
      <td>${c.region}<br/><span class="text-xs text-slate-500">${c.category}</span></td>
      <td class="text-red-600 font-bold">${c.sudlanganText}</td>
      <td class="text-center font-bold">${getFinalResultPlainText(c)}</td>
      <td class="text-center"><button onclick="openDocModal('${c.id}')" class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold shadow-sm">Ma'lumotnoma</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// DATABASE (ЯГОНА БАЗА) ЖАДВАЛИ
// =========================================================================
function renderDatabase() {
  const tbody = document.getElementById("databaseTableBody");
  if (!tbody) return;

  let list = appState.candidates;
  const reg = document.getElementById("dbRegionFilter")?.value || "ALL";
  const cat = document.getElementById("dbCategoryFilter")?.value || "ALL";
  const yr = document.getElementById("dbYearFilter")?.value || "ALL";
  const mo = document.getElementById("dbMonthFilter")?.value || "ALL";
  const st = document.getElementById("dbStatusFilter")?.value || "ALL";
  const q = (document.getElementById("dbSearchInput")?.value || "").toLowerCase();

  if (reg !== "ALL") list = list.filter(c => c.region === reg);
  if (cat !== "ALL") list = list.filter(c => c.category === cat);
  if (yr !== "ALL") list = list.filter(c => c.year === yr);
  if (mo !== "ALL") list = list.filter(c => c.month === mo);
  if (st === "approved") list = list.filter(c => c.workflowStage === "hired");
  if (st === "in_process") list = list.filter(c => c.workflowStage !== "hired" && c.workflowStage !== "rejected");
  if (q) list = list.filter(c => c.fio.toLowerCase().includes(q) || c.pinfl.includes(q));

  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-500 font-bold">Ёзувлар топилмади</td></tr>`;
    return;
  }

  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center text-xs">${c.reestrNo}<br/><span class="text-slate-500">${c.createdAt}</span></td>
      <td class="text-center text-xs">${c.region}<br/>(${c.year}/${c.month})</td>
      <td><b>${c.fio}</b><br/><span class="font-mono text-xs">${c.pinfl}</span></td>
      <td>${c.category}<br/><span class="text-xs text-slate-500">${c.currentJob}</span></td>
      <td class="text-center font-bold">${getFinalResultPlainText(c)}</td>
      <td class="text-center text-xs">${c.workflowStage}</td>
      <td class="text-center"><button onclick="openDocModal('${c.id}')" class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold shadow-sm">Ma'lumotnoma</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// DASHBOARD (СТАТИСТИКА) ЖАДВАЛИ
// =========================================================================
function renderDashboard() {
  const tbody = document.getElementById("dashboardTableBody");
  if (!tbody) return;
  
  // Statistikani hududlar va yo'nalishlar bo'yicha hisoblash
  const regions = [...new Set(appState.candidates.map(c => c.region))];
  tbody.innerHTML = "";

  if (regions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-4 text-slate-500 font-bold">Маълумотлар йўқ</td></tr>`;
    return;
  }

  regions.forEach((reg, i) => {
    const list = appState.candidates.filter(c => c.region === reg);
    
    const countKaRahbar = list.filter(c => c.category.includes("КА ҳудудий")).length;
    const countDkpRahbar = list.filter(c => c.category.includes("ДКП ҳудудий")).length;
    const countKaTuman = list.filter(c => c.category.includes("КА туман")).length;
    const countDkpTuman = list.filter(c => c.category.includes("ДКП туман")).length;
    const countKomplayens = list.filter(c => c.category.includes("Комплаенс")).length;
    const countMarkaziy = list.filter(c => c.category.includes("марказий")).length;
    const countTizim = list.filter(c => c.category.includes("Тизим")).length;
    const countSobiq = list.filter(c => c.category.includes("Собиқ")).length;
    
    const countInProcess = list.filter(c => c.workflowStage !== "hired" && c.workflowStage !== "rejected").length;
    const countHired = list.filter(c => c.workflowStage === "hired").length;
    const countCriminal = list.filter(c => c.sudlanganStatus === "sudlangan").length;
    const total = list.length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${i + 1}</td>
      <td><b>${reg}</b></td>
      <td class="text-center">${countKaRahbar}</td>
      <td class="text-center">${countDkpRahbar}</td>
      <td class="text-center">${countKaTuman}</td>
      <td class="text-center">${countDkpTuman}</td>
      <td class="text-center">${countKomplayens}</td>
      <td class="text-center bg-purple-50">${countMarkaziy}</td>
      <td class="text-center bg-blue-50">${countTizim}</td>
      <td class="text-center bg-purple-50">${countSobiq}</td>
      <td class="text-center">${countInProcess}</td>
      <td class="text-center text-emerald-700 font-bold">${countHired}</td>
      <td class="text-center text-red-600 font-bold">${countCriminal}</td>
      <td class="text-center font-extrabold bg-slate-100">${total}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// AUDIT-LOG ЖАДВАЛИ
// =========================================================================
function renderAuditLog() {
  const tbody = document.getElementById("auditTableBody");
  if (!tbody) return;
  const log = loadAuditLog();
  tbody.innerHTML = "";
  if (log.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-500 font-bold">Аудит-лог бўш</td></tr>`;
    return;
  }
  log.slice(0, 100).forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${i + 1}</td>
      <td class="text-xs">${item.timestamp}</td>
      <td>${item.userName || item.user}</td>
      <td>${item.roleName || item.role}</td>
      <td>${formatActionName(item.action)}</td>
      <td class="text-xs text-slate-500">${item.details || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// FOYDALANUVCHILAR ЖАДВАЛИ
// =========================================================================
function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  appState.users.forEach((u, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td class="font-mono">${u.login}</td>
      <td><span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Faol</span></td>
      <td><button onclick="deleteUser(${i})" class="text-red-500 font-bold hover:underline">O'chirish</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// ЯКУНИЙ НАТИЖА МАТНИ
// =========================================================================
function getFinalResultPlainText(c) {
  if (c.workflowStage === "hired") return `<span class="text-emerald-700 font-bold">✓ Ишга қабул қилинди</span>`;
  if (c.workflowStage === "rejected") return `<span class="text-red-600 font-bold">❌ Бекор қилинди</span>`;
  if (c.workflowStage === "hr_final") return `<span class="text-amber-600 font-bold">⏳ HR қарори кутилмоқда</span>`;
  if (c.workflowStage === "boss_review") return `<span class="text-amber-600 font-bold">⏳ Бошлиқ тасдиғида</span>`;
  return `<span class="text-slate-500 font-bold">⏳ Ўрганиш жараёнида</span>`;
}

// =========================================================================
// PAGINATION (САҲИФАЛАШ)
// =========================================================================
function applyPagination() {
  const tableIds = ["fototablitsaBody", "formerTableBody", "hiredTableBody", "databaseTableBody", "itsTableBody", "negativeTableBody"];
  
  tableIds.forEach(id => {
    const tbody = document.getElementById(id);
    if (!tbody) return;
    
    // Agar pagination logikasi to'liq bo'lmasa, shunchaki hamma qatorlarni ko'rsatamiz
    // Bu joy kelajakda 20/50 tadan qilib cheklash uchun ishlatiladi.
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => row.style.display = "");
  });
}
