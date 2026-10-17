// =========================================================================
// 07-RENDER.JS — Барча жадвалларни чизиш
// «КОМПЛАЕНС-КАДР» v10.6 (Тўлиқ тузатилган)
// =========================================================================

function renderAll() {
  if (!appState) return;

  const all = appState.candidates || [];

  setKpi("kpiTotal", all.length);
  setKpi("kpiCurrent", all.filter(x => x.recordType === "current").length);
  setKpi("kpiFormer", all.filter(x => x.recordType === "former").length);
  setKpi("kpiInProcess", all.filter(x => x.workflowStage !== "approved").length);
  setKpi("kpiApproved", all.filter(x => x.workflowStage === "approved").length);
  setKpi("kpiSudlangan", all.filter(x => x.sudlanganStatus === "sudlangan").length);

  renderDashboardTable();
  renderSubtabsCounters();
  renderFototablitsaTable();
  renderFormerTable();
  renderItsTable();
  renderNegativeTable();
  renderDatabaseTable();
  renderUsersTable();
  
  if (typeof renderAuditTable === "function") {
    renderAuditTable();
  }
  if (typeof updateNotificationBadge === "function") {
    updateNotificationBadge();
  }

  populateRegionSelects();
}

function setKpi(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderSubtabsCounters() {
  const all = appState.candidates || [];
  const newBadge = document.getElementById("subtabNewCount");
  if (newBadge) newBadge.textContent = all.filter(c => c.recordType === "current" && c.workflowStage === "admin_review").length;
  
  const inProcBadge = document.getElementById("subtabInProcessCount");
  if (inProcBadge) inProcBadge.textContent = all.filter(c => c.recordType === "current" && c.workflowStage === "boss_review").length;
  
  const apprBadge = document.getElementById("subtabApprovedCount");
  if (apprBadge) apprBadge.textContent = all.filter(c => c.recordType === "current" && c.workflowStage === "approved").length;
}

// DASHBOARD
function renderDashboardTable() {
  const tbody = document.getElementById("dashboardTableBody");
  if (!tbody) return;

  let html = "";

  REGIONS_14.forEach((reg, idx) => {
    const list = appState.candidates.filter(c => c.region === reg);
    const isCentralKA = reg === "Кадастр агентлиги";
    const isCentralDKP = reg === "Давлат кадастрлари палатаси";
    const isTizim = reg === "Тизим ташкилотлари";

    let kaManagement = 0, dkpManagement = 0, kaDistrict = 0, dkpDistrict = 0, compliance = 0, centralKA = 0, centralDKP = 0, tizim = 0;

    if (isCentralKA) {
      centralKA = list.filter(c => c.recordType === "current").length;
    } else if (isCentralDKP) {
      centralDKP = list.filter(c => c.recordType === "current").length;
    } else if (isTizim) {
      tizim = list.filter(c => c.recordType === "current").length;
    } else {
      kaManagement = list.filter(c => c.recordType === "current" && c.category && c.category.includes("КА ҳудудий бошқармаси")).length;
      dkpManagement = list.filter(c => c.recordType === "current" && c.category && c.category.includes("ДКП ҳудудий бошқармаси")).length;
      kaDistrict = list.filter(c => c.recordType === "current" && c.category === "КА туман (шаҳар) бўлими бошлиғи").length;
      dkpDistrict = list.filter(c => c.recordType === "current" && c.category === "ДКП туман (шаҳар) филиали бошлиғи").length;
      compliance = list.filter(c => c.recordType === "current" && c.category === "Комплаенс хизмати ходими").length;
    }

    const former = list.filter(c => c.recordType === "former").length;
    const inProc = list.filter(c => c.workflowStage !== "approved").length;
    const appr = list.filter(c => c.workflowStage === "approved").length;
    const sud = list.filter(c => c.sudlanganStatus === "sudlangan").length;

    const onclick = (type) => `onclick="openDashboardDetail('${reg}', '${type}')" class="cursor-pointer hover:bg-blue-50 transition"`;

    let regDisplay = reg;
    let rowClass = "";
    if (isCentralKA || isCentralDKP) {
      regDisplay = "🏢 " + reg;
      rowClass = "bg-purple-50";
    } else if (isTizim) {
      regDisplay = "🔷 " + reg;
      rowClass = "bg-blue-50";
    }

    html += `
      <tr class="${rowClass}">
        <td class="text-center font-bold">${idx + 1}.</td>
        <td class="font-bold">${regDisplay}</td>
        <td class="text-center" ${onclick("ka_management")}>${kaManagement}</td>
        <td class="text-center" ${onclick("dkp_management")}>${dkpManagement}</td>
        <td class="text-center font-bold" ${onclick("ka_district")}>${kaDistrict}</td>
        <td class="text-center font-bold" ${onclick("dkp_district")}>${dkpDistrict}</td>
        <td class="text-center" ${onclick("compliance")}>${compliance}</td>
        <td class="text-center font-bold text-purple-800" ${onclick("central")}>${centralKA + centralDKP}</td>
        <td class="text-center font-bold text-blue-800" ${onclick("tizim")}>${tizim}</td>
        <td class="text-center font-bold text-purple-800" ${onclick("former")}>${former}</td>
        <td class="text-center font-bold text-amber-700" ${onclick("in_process")}>${inProc}</td>
        <td class="text-center font-bold text-emerald-700" ${onclick("approved")}>${appr}</td>
        <td class="text-center font-extrabold text-red-600" ${onclick("sudlangan")}>${sud}</td>
        <td class="text-center font-extrabold" ${onclick("all")}>${list.length}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function openDashboardDetail(region, type) {
  if (typeof switchTab === "function") switchTab("fototablitsa");

  setTimeout(() => {
    const regionFilter = document.getElementById("fotoRegionFilter");
    if (regionFilter) regionFilter.value = region === "ALL" ? "ALL" : region;

    if (type === "approved" && typeof switchSubTab === "function") switchSubTab("approved");
    else if ((type === "in_process" || type === "sudlangan") && typeof switchSubTab === "function") switchSubTab("in_process");

    if (typeof renderAll === "function") renderAll();
  }, 100);

  if (typeof showToast === "function") showToast(`📊 ${region} — ${getDetailTitle(type)}`, "info");
}

function getDetailTitle(type) {
  const titles = {
    ka_management: "КА бошқарма раҳбарияти",
    dkp_management: "ДКП бошқарма раҳбарияти",
    ka_district: "КА туман бўлими бошлиғи",
    dkp_district: "ДКП туман филиали раҳбари",
    compliance: "Комплаенс ходимлари",
    central: "Марказий аппарат",
    tizim: "Тизим ташкилотлари",
    former: "Собиқ ходимлар",
    in_process: "Ўрганиш жараёнида",
    approved: "Ўрганиб чиқилган",
    sudlangan: "Судланганлар",
    all: "Барча ёзувлар"
  };
  return titles[type] || type;
}

// ФОТОТАБЛИЦА
function renderFototablitsaTable() {
  const tbody = document.getElementById("fototablitsaBody");
  if (!tbody) return;

  const mainTable = document.getElementById("mainFototablitsaTable");
  if (mainTable) {
    const thead = mainTable.querySelector("thead");
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th style="width:5%;">Т/р</th>
          <th style="width:15%;">Расм</th>
          <th style="width:28%;">Ф.И.Ш., туғилган йили ва жойи</th>
          <th style="width:30%;">Лавозими ва жараён тарихи</th>
          <th style="width:22%;">Якуний натижа</th>
        </tr>
      `;
    }
  }

  const regFilter = document.getElementById("fotoRegionFilter")?.value || "ALL";
  const catFilter = document.getElementById("fotoCategoryFilter")?.value || "ALL";

  let workflowFilter = [];
  if (currentSubTab === "new") workflowFilter = ["admin_review"];
  else if (currentSubTab === "in_process") workflowFilter = ["boss_review"];
  else if (currentSubTab === "approved") workflowFilter = ["approved"];

  if (currentRole === ROLES.KADR && currentSubTab === "in_process") {
    workflowFilter = ["admin_review", "boss_review"];
  }

  const filtered = appState.candidates.filter(c => {
    if (c.recordType !== "current") return false;
    if (regFilter !== "ALL" && c.region !== regFilter) return false;
    if (catFilter !== "ALL" && c.category !== catFilter) return false;
    if (!workflowFilter.includes(c.workflowStage)) return false;
    return true;
  });

  if (filtered.length === 0) {
    const subtabNames = { new: "🆕 Янги келганлар", in_process: "⏳ Тасдиқлаш жараёнида", approved: "✅ Ўрганиб чиқилган" };
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500 font-bold">${subtabNames[currentSubTab] || ""} бўлимида ёзувлар топилмади</td></tr>`;
    return;
  }

  const groups = {};
  filtered.forEach(c => {
    const key = `${c.districtHeading}|||${c.appointType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  let html = "";
  let counter = 1;

  Object.keys(groups).forEach(key => {
    const [heading, appType] = key.split("|||");
    html += `
      <tr>
        <td colspan="5" class="text-center font-bold py-2 bg-slate-50" style="font-size:14px;">
          <span class="text-blue-950">${heading}</span>
          <span class="text-red-600"> ${appType ? " " + appType : ""}</span>
        </td>
      </tr>
    `;
    groups[key].forEach(c => {
      html += renderCandidateRow(c, counter++);
    });
  });

  tbody.innerHTML = html;
}

function renderCandidateRow(c, counter) {
  const createdInfo = c.createdTime ? `<div class="text-[10px] text-slate-500 font-mono mt-0.5">🕐 ${c.createdAt} ${c.createdTime}</div>` : `<div class="text-[10px] text-slate-500 font-mono mt-0.5">🕐 ${c.createdAt}</div>`;

  let timelineHtml = "";
  if (currentRole === ROLES.KORRUPSIYA || currentRole === ROLES.RAHBAR) {
    const steps = [];
    if (c.createdTime) steps.push(`📥 Киритилди: ${c.createdAt} ${c.createdTime}`);
    if (c.sentToBossAt) steps.push(`📤 Юборилди: ${c.sentToBossAt} ${c.sentToBossTime || ""}`);
    if (c.bossViewedAt) steps.push(`👁 Кўрилди: ${c.bossViewedAt}`);
    if (c.bossApprovedAt) steps.push(`✅ Тасдиқланди: ${c.bossApprovedAt}`);
    if (c.bossReturnedAt) steps.push(`↩️ Қайтарилди: ${c.bossReturnedAt}`);

    if (steps.length > 0) {
      timelineHtml = `
        <div class="mt-2 p-2 rounded bg-slate-50 border border-slate-200 text-[10px] space-y-0.5 text-left">
          <div class="font-bold text-slate-700 mb-1">📋 Жараён тарихи:</div>
          ${steps.map(s => `<div class="text-slate-600">${s}</div>`).join("")}
        </div>
      `;
    }
  }

  return `
    <tr>
      <td class="text-center font-bold">${counter}.</td>
      <td class="text-center align-middle">
        <img src="${c.photo}" alt="Фото" style="width:100px; height:125px; object-fit:cover; margin:0 auto; border:1px solid #334155; border-radius:4px; display:block;" />
      </td>
      <td class="text-center">
        <div class="font-bold text-sm">${c.fio}</div>
        <div class="mt-1 text-xs">${c.birthDate} йил,<br/>${c.birthPlace}</div>
        <div class="font-mono text-[10px] mt-1">${c.passSeries} ${c.passNum}</div>
        <div class="font-mono font-bold text-[11px]">${c.pinfl}</div>
        ${createdInfo}
      </td>
      <td class="text-center text-blue-950 text-xs">
        <div class="font-semibold">${c.category || ""}</div>
        <div class="mt-1">${c.currentJob}</div>
        <div class="mt-2 font-semibold text-slate-700">${c.jobSince}</div>
        ${timelineHtml}
      </td>
      <td class="text-center align-middle">${renderActionCell(c)}</td>
    </tr>
  `;
}

function renderActionCell(c) {
  const resultBadge = getFinalResultBadge(c);
  const isSudlangan = c.sudlanganStatus === "sudlangan";

  if (currentRole === ROLES.KADR) {
    if (c.workflowStage === "approved") {
      return `<div class="space-y-1.5 text-center">${resultBadge}<div class="text-[10px] font-bold text-emerald-800">Тасдиқланди</div><button onclick="openDocModal('${c.id}')" class="w-full py-1.5 px-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] shadow cursor-pointer">📄 МАЪЛУМОТНОМА</button></div>`;
    }
    return `<div class="space-y-1 text-center">${resultBadge}<div class="text-[10px] text-slate-500 italic">Текширилмоқда...</div></div>`;
  }

  if (currentRole === ROLES.KORRUPSIYA) {
    let stageInfo = c.workflowStage === "admin_review" ? `<div class="text-[10px] font-bold text-amber-700">🔍 Коррупция бўлимида</div>` : c.workflowStage === "boss_review" ? `<div class="text-[10px] font-bold text-blue-700">📤 Бошлиқда</div>` : `<div class="text-[10px] font-bold text-emerald-700">✓ Тасдиқланди</div>`;
    const sudAlert = isSudlangan ? `<div class="p-1.5 rounded bg-red-100 border border-red-400 text-red-900 font-bold text-[10px]">🚨 СУДЛАНГАН</div>` : `<div class="text-[10px] font-semibold text-emerald-800">✓ Судланмаган</div>`;

    return `
      <div class="space-y-1.5 w-full">
        ${resultBadge} ${stageInfo} ${sudAlert}
        <div class="flex flex-col gap-1 pt-1 w-full">
          <button onclick="openEditorModal('${c.id}')" class="w-full py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer">✍️ Таҳрир (ИЦ)</button>
          <div class="flex gap-1 w-full">
            <button onclick="editCandidate('${c.id}')" class="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer" title="Таҳрирлаш">✏️</button>
            <button onclick="confirmDeleteCandidate('${c.id}')" class="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer" title="Ўчириш">🗑</button>
          </div>
          <button onclick="openDocModal('${c.id}')" class="w-full py-2 px-2 mt-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] shadow cursor-pointer">📄 МАЪЛУМОТНОМА</button>
        </div>
      </div>`;
  }

  if (currentRole === ROLES.RAHBAR) {
    if (c.workflowStage === "admin_review") return `<div class="space-y-1 text-center">${resultBadge}<div class="text-[10px] text-slate-500">🔒 Коррупция бўлимида</div></div>`;
    if (c.workflowStage === "boss_review") {
      if (isSudlangan) return `<div class="space-y-1.5 p-2 rounded-lg bg-red-50 border-2 border-red-500 sudlangan-alert-pulse"><div class="text-[10px] font-extrabold text-red-700 uppercase">🚨 СУДЛАНГАНЛИК!</div><button onclick="openDocModal('${c.id}')" class="w-full py-1.5 px-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] cursor-pointer">⚠️ ЎҚИШ ВА ҚАРОР</button></div>`;
      return `<div class="space-y-1.5">${resultBadge}<div class="text-[10px] font-bold text-emerald-800">✓ Судланмаган</div><button onclick="openDocModal('${c.id}')" class="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] cursor-pointer">👁 ТАСДИҚЛАШ</button></div>`;
    }
    return `<div class="space-y-1.5">${resultBadge}${isSudlangan ? `<div class="text-[10px] font-bold text-red-700">🚨 Судланган</div>` : `<div class="text-[10px] font-semibold text-emerald-800">✓ Судланмаган</div>`}<button onclick="openDocModal('${c.id}')" class="w-full py-1.5 px-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] cursor-pointer">📄 МАЪЛУМОТНОМА</button></div>`;
  }

  if (currentRole === ROLES.KUZATUVCHI) {
    if (c.workflowStage !== "approved") return `<div class="space-y-1 text-center">${resultBadge}<div class="text-[10px] text-slate-500">🔒 Ўрганишда</div></div>`;
    return `<div class="space-y-1.5">${resultBadge}${isSudlangan ? `<div class="p-1 rounded bg-red-100 text-red-900 font-bold text-[10px]">🚨 Судланган</div>` : `<div class="text-[10px] text-emerald-800">✓ Судланмаган</div>`}<button onclick="openDocModal('${c.id}')" class="w-full py-1.5 px-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] cursor-pointer">👁 ЎҚИШ</button></div>`;
  }

  return `<div class="text-[10px] text-slate-400 italic text-center">—</div>`;
}

// СОБИҚ ХОДИМЛАР
function renderFormerTable() {
  const regFilter = document.getElementById("formerRegionFilter")?.value || "ALL";
  const tbody = document.getElementById("formerTableBody");
  if (!tbody) return;

  const list = appState.candidates.filter(c => c.recordType === "former" && (regFilter === "ALL" || c.region === regFilter));

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500 font-bold">Собиқ ходимлар рўйхати бўш</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((c, i) => {
    const createdInfo = c.createdTime ? `<div class="text-[10px] text-slate-500 font-mono mt-1">🕐 ${c.createdAt} ${c.createdTime}</div>` : "";
    return `
      <tr>
        <td class="text-center font-bold">${i + 1}.</td>
        <td class="text-center align-middle"><img src="${c.photo}" alt="Фото" style="width:100px; height:125px; object-fit:cover; margin:0 auto; border:1px solid #334155; border-radius:4px; display:block;" /></td>
        <td class="text-center">
          <div class="font-bold text-sm">${c.fio}</div>
          <div class="mt-1 text-xs">${c.birthDate} йил, ${c.birthPlace}</div>
          <div class="font-mono font-bold text-[11px] mt-1">ПИНФЛ: ${c.pinfl}</div>
          <div class="font-mono text-[10px]">${c.passSeries} ${c.passNum}</div>
          ${createdInfo}
        </td>
        <td class="text-center text-purple-950 text-xs">
          <div class="font-bold">${c.region}</div>
          <div class="mt-1">${c.currentJob}</div>
          <div class="mt-1 text-[10px]">${c.jobSince}</div>
        </td>
        <td class="text-center align-middle">${renderActionCell(c)}</td>
      </tr>
    `;
  }).join("");
}

// ИЦ ЖАДВАЛИ
function renderItsTable() {
  const statusFilter = document.getElementById("itsFilterStatus")?.value || "ALL";
  const tbody = document.getElementById("itsTableBody");
  if (!tbody) return;

  const readOnly = currentRole !== ROLES.KORRUPSIYA;
  const list = appState.candidates.filter(c => {
    if (statusFilter === "UNCHECKED" && c.itsChecked) return false;
    if (statusFilter === "SUDLANGAN" && c.sudlanganStatus !== "sudlangan") return false;
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-slate-500 font-bold">Маълумот топилмади</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td class="text-center font-bold">${idx + 1}</td>
      <td class="font-bold text-xs">${c.fio}</td>
      <td class="text-center font-mono text-xs">${c.birthDate}</td>
      <td class="text-center font-mono font-bold text-xs">${c.passSeries}</td>
      <td class="text-center font-mono font-bold text-xs">${c.passNum}</td>
      <td class="text-center font-mono font-bold text-xs">${c.pinfl}</td>
      <td class="text-center text-xs font-bold">${c.recordType === "former" ? `<span class="text-purple-700">Собиқ</span>` : `<span class="text-blue-800">Номзод</span>`}<br/>${c.region}</td>
      <td>
        ${readOnly ? `<div class="font-bold text-xs ${c.sudlanganStatus === 'sudlangan' ? 'text-red-700' : 'text-emerald-800'}">${c.sudlanganStatus === 'sudlangan' ? '🚨 ' + c.sudlanganText : '✓ ' + c.sudlanganText}</div>` : `
          <div class="space-y-1">
            <select id="itsSel_${c.id}" onchange="quickSaveItsRow('${c.id}')" class="w-full px-2 py-1 rounded border border-slate-300 text-[11px] font-bold bg-white text-slate-900">
              <option value="clean" ${c.sudlanganStatus === 'clean' ? 'selected' : ''}>✓ Судланмаган</option>
              <option value="sudlangan" ${c.sudlanganStatus === 'sudlangan' ? 'selected' : ''}>🚨 СУДЛАНГАН</option>
            </select>
            <input id="itsTxt_${c.id}" type="text" value="${(c.sudlanganText || "").replace(/"/g, '&quot;')}" placeholder="ЖК моддаси..." class="w-full px-2 py-1 rounded border border-slate-300 text-[11px] text-slate-900" />
          </div>
        `}
      </td>
      <td class="text-center">
        ${readOnly ? getFinalResultBadge(c) : `<div class="space-y-1"><button onclick="quickSaveItsRow('${c.id}', true)" class="w-full py-1 px-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold cursor-pointer">💾 Сақлаш</button><button onclick="openEditorModal('${c.id}')" class="w-full py-1 px-2 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer">✍️ Хулоса</button></div>`}
      </td>
    </tr>
  `).join("");
}

// СУДЛАНГАНЛАР
function renderNegativeTable() {
  const tbody = document.getElementById("negativeTableBody");
  if (!tbody) return;

  const list = appState.candidates.filter(c => c.sudlanganStatus === "sudlangan");
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500 font-bold">Судланганлиги чиққан ходимлар йўқ</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td class="text-center font-bold">${idx + 1}.</td>
      <td class="font-bold text-xs">${c.fio}<br/><span class="text-[10px] font-normal">${c.birthDate} й. (${c.birthPlace})</span></td>
      <td class="font-mono text-[11px] font-bold">${c.passSeries} ${c.passNum}<br/>ПИНФЛ: ${c.pinfl}</td>
      <td class="text-xs font-bold">${c.region}<br/><span class="text-blue-900 text-[10px]">${c.category}</span></td>
      <td class="font-bold text-red-700 text-xs">🚨 ${c.sudlanganText}</td>
      <td class="text-center">${getFinalResultBadge(c)}</td>
      <td class="text-center">${(currentRole === ROLES.KUZATUVCHI && c.workflowStage !== "approved") ? `<span class="text-[10px] font-bold text-slate-500">🔒 Тасдиқлангач</span>` : `<button onclick="openDocModal('${c.id}')" class="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold cursor-pointer">📄 МАЪЛУМОТНОМА</button>`}</td>
    </tr>
  `).join("");
}

// ЯГОНА БАЗА
function renderDatabaseTable() {
  const reg = document.getElementById("dbRegionFilter")?.value || "ALL";
  const cat = document.getElementById("dbCategoryFilter")?.value || "ALL";
  const yr = document.getElementById("dbYearFilter")?.value || "ALL";
  const mo = document.getElementById("dbMonthFilter")?.value || "ALL";
  const st = document.getElementById("dbStatusFilter")?.value || "ALL";
  const q = document.getElementById("dbSearchInput")?.value.trim().toLowerCase() || "";

  const list = appState.candidates.filter(c => {
    if (reg !== "ALL" && c.region !== reg) return false;
    if (cat !== "ALL" && c.category !== cat) return false;
    if (yr !== "ALL" && c.year !== yr) return false;
    if (mo !== "ALL" && c.month !== mo) return false;
    if (st === "approved" && c.workflowStage !== "approved") return false;
    if (st === "in_process" && c.workflowStage === "approved") return false;
    if (q && !(c.fio.toLowerCase().includes(q) || c.pinfl.includes(q))) return false;
    return true;
  });

  const tbody = document.getElementById("databaseTableBody");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500 font-bold">Маълумот топилмади</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const canOpenDoc = currentRole === ROLES.KORRUPSIYA || (currentRole === ROLES.RAHBAR && c.workflowStage !== "admin_review") || ((currentRole === ROLES.KADR || currentRole === ROLES.KUZATUVCHI) && c.workflowStage === "approved");
    return `
      <tr>
        <td class="font-mono text-[11px] font-bold">${c.reestrNo}<br/><span class="font-normal">${c.createdAt}</span></td>
        <td class="font-bold text-[11px]">${c.region}<br/><span class="text-emerald-700">${c.year}-йил, ${c.month}-ой</span></td>
        <td><div class="font-bold text-xs">${c.fio}</div><div class="font-mono text-[10px] text-slate-600">ПИНФЛ: ${c.pinfl} | ${c.passSeries} ${c.passNum}</div></td>
        <td class="text-[11px]"><div class="font-bold text-blue-950">${c.category}</div><div class="text-[10px]">${c.currentJob}</div></td>
        <td class="text-center font-bold text-xs">${getFinalResultPlainText(c)}</td>
        <td class="text-center">${getFinalResultBadge(c)}</td>
        <td class="text-center">${canOpenDoc ? `<button onclick="openDocModal('${c.id}')" class="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold cursor-pointer">📄 ҲУЖЖАТ</button>` : `<span class="text-[10px] text-slate-400 font-bold">🔒</span>`}</td>
      </tr>
    `;
  }).join("");
}

// ФОЙДАЛАНУВЧИЛАР
function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  if (currentRole !== ROLES.KORRUPSIYA) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500">Рухсат йўқ</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.users.map((u, idx) => `
    <tr>
      <td class="font-bold text-xs">${u.name}</td>
      <td class="text-xs font-bold">${ROLE_NAMES[u.role] || u.role}</td>
      <td class="font-mono text-xs font-bold">${u.login}</td>
      <td class="text-center text-[10px]">${u.passHash ? '<span class="text-emerald-700 font-bold">🔒 Хеш</span>' : '<span class="text-amber-700 font-bold">⚠️ Очиқ</span>'}</td>
      <td class="text-center">${u.login === "admin" ? `<span class="text-[10px] text-slate-400">Асосий</span>` : `<button onclick="deleteUser(${idx})" class="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold cursor-pointer">Ўчириш</button>`}</td>
    </tr>
  `).join("");
}

// ЁРДАМЧИЛАР
function getFinalResultBadge(c) {
  return c.workflowStage === "approved" ? `<span class="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold text-[10px]">✓ Ўрганиб чиқилди</span>` : `<span class="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-400 font-bold text-[10px]">⏳ Ўрганиш жараёнида</span>`;
}

function getFinalResultPlainText(c) {
  return c.workflowStage === "approved" ? "Ўрганиб чиқилди" : "Ўрганиш жараёнида";
}

function populateRegionSelects() {
  const inpReg = document.getElementById("inpRegion");
  const editReg = document.getElementById("editCandRegion");
  const fotoReg = document.getElementById("fotoRegionFilter");
  const formerReg = document.getElementById("formerRegionFilter");
  const dbReg = document.getElementById("dbRegionFilter");

  const singleOpts = REGIONS_14.map(r => `<option value="${r}">${r}</option>`).join("");
  const allOpts = `<option value="ALL">Барча ҳудудлар (${REGIONS_14.length} та)</option>` + singleOpts;

  if (inpReg && inpReg.options.length === 0) inpReg.innerHTML = singleOpts;
  if (editReg && editReg.options.length === 0) editReg.innerHTML = singleOpts;

  [fotoReg, formerReg, dbReg].forEach(el => {
    if (el && el.options.length === 0) el.innerHTML = allOpts;
  });

  const dateLabel = document.getElementById("fotoCurrentDateLabel");
  if (dateLabel) {
    const now = getNow();
    dateLabel.textContent = `${now.date} йил ҳолатига`;
  }
}

console.log("✅ 07-render.js юкланди (v10.6 — Тўлиқ тузатилган)");
