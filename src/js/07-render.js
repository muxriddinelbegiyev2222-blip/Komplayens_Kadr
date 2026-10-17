// =========================================================================
// 07-RENDER.JS — Барча жадвалларни чизиш
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
  renderDashboardTable(); renderSubtabsCounters(); renderFototablitsaTable(); renderFormerTable(); renderItsTable(); renderNegativeTable(); renderDatabaseTable(); renderUsersTable();
  if (typeof renderAuditTable === "function") renderAuditTable();
  if (typeof updateNotificationBadge === "function") updateNotificationBadge();
  populateRegionSelects();
}

function setKpi(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function renderSubtabsCounters() {
  const all = appState.candidates || [];
  const setBadge = (id, filter) => { const b = document.getElementById(id); if (b) b.textContent = all.filter(filter).length; };
  setBadge("subtabNewCount", c => c.recordType === "current" && c.workflowStage === "admin_review");
  setBadge("subtabInProcessCount", c => c.recordType === "current" && c.workflowStage === "boss_review");
  setBadge("subtabApprovedCount", c => c.recordType === "current" && c.workflowStage === "approved");
}

function renderDashboardTable() {
  const tbody = document.getElementById("dashboardTableBody"); if (!tbody) return; let html = "";
  REGIONS_14.forEach((reg, idx) => {
    const list = appState.candidates.filter(c => c.region === reg);
    const isCKA = reg === "Кадастр агентлиги", isCDKP = reg === "Давлат кадастрлари палатаси", isTizim = reg === "Тизим ташкилотлари";
    let kaM = 0, dkpM = 0, kaD = 0, dkpD = 0, comp = 0, cKA = 0, cDKP = 0, tiz = 0;
    if (isCKA) cKA = list.filter(c => c.recordType === "current").length;
    else if (isCDKP) cDKP = list.filter(c => c.recordType === "current").length;
    else if (isTizim) tiz = list.filter(c => c.recordType === "current").length;
    else { kaM = list.filter(c => c.recordType === "current" && c.category?.includes("КА ҳудудий")).length; dkpM = list.filter(c => c.recordType === "current" && c.category?.includes("ДКП ҳудудий")).length; kaD = list.filter(c => c.recordType === "current" && c.category === "КА туман (шаҳар) бўлими бошлиғи").length; dkpD = list.filter(c => c.recordType === "current" && c.category === "ДКП туман (шаҳар) филиали бошлиғи").length; comp = list.filter(c => c.recordType === "current" && c.category === "Комплаенс хизмати ходими").length; }
    const former = list.filter(c => c.recordType === "former").length, inProc = list.filter(c => c.workflowStage !== "approved").length, appr = list.filter(c => c.workflowStage === "approved").length, sud = list.filter(c => c.sudlanganStatus === "sudlangan").length;
    const click = (t) => `onclick="openDashboardDetail('${reg}', '${t}')" class="cursor-pointer hover:bg-blue-50 transition"`;
    let rowClass = (isCKA || isCDKP) ? "bg-purple-50" : isTizim ? "bg-blue-50" : "";
    html += `<tr class="${rowClass}"><td class="text-center font-bold">${idx + 1}.</td><td class="font-bold">${reg}</td><td class="text-center" ${click("ka_management")}>${kaM}</td><td class="text-center" ${click("dkp_management")}>${dkpM}</td><td class="text-center font-bold" ${click("ka_district")}>${kaD}</td><td class="text-center font-bold" ${click("dkp_district")}>${dkpD}</td><td class="text-center" ${click("compliance")}>${comp}</td><td class="text-center font-bold text-purple-800" ${click("central")}>${cKA + cDKP}</td><td class="text-center font-bold text-blue-800" ${click("tizim")}>${tiz}</td><td class="text-center font-bold text-purple-800" ${click("former")}>${former}</td><td class="text-center font-bold text-amber-700" ${click("in_process")}>${inProc}</td><td class="text-center font-bold text-emerald-700" ${click("approved")}>${appr}</td><td class="text-center font-extrabold text-red-600" ${click("sudlangan")}>${sud}</td><td class="text-center font-extrabold" ${click("all")}>${list.length}</td></tr>`;
  });
  tbody.innerHTML = html;
}

function openDashboardDetail(region, type) { switchTab("fototablitsa"); setTimeout(() => { const r = document.getElementById("fotoRegionFilter"); if (r) r.value = region === "ALL" ? "ALL" : region; if (type === "approved") switchSubTab("approved"); else if (type === "in_process" || type === "sudlangan") switchSubTab("in_process"); renderAll(); }, 100); showToast(`📊 ${region}`, "info"); }
function getDetailTitle(type) { const t = { ka_management: "КА раҳбари", dkp_management: "ДКП раҳбари", ka_district: "КА туман", dkp_district: "ДКП туман", compliance: "Комплаенс", central: "Марказ", tizim: "Тизим", former: "Собиқ", in_process: "Жараёнда", approved: "Тасдиқланди", sudlangan: "Судланган", all: "Барча" }; return t[type] || type; }

function renderFototablitsaTable() {
  const tbody = document.getElementById("fototablitsaBody"); if (!tbody) return;
  const mainTable = document.getElementById("mainFototablitsaTable");
  if (mainTable) { const th = mainTable.querySelector("thead"); if (th) th.innerHTML = `<tr><th style="width:5%;">Т/р</th><th style="width:15%;">Расм</th><th style="width:28%;">Ф.И.Ш.</th><th style="width:30%;">Лавозим</th><th style="width:22%;">Натижа</th></tr>`; }
  const regF = document.getElementById("fotoRegionFilter")?.value || "ALL", catF = document.getElementById("fotoCategoryFilter")?.value || "ALL";
  let wf = []; if (currentSubTab === "new") wf = ["admin_review"]; else if (currentSubTab === "in_process") wf = ["boss_review"]; else if (currentSubTab === "approved") wf = ["approved"];
  if (currentRole === ROLES.KADR && currentSubTab === "in_process") wf = ["admin_review", "boss_review"];
  const filtered = appState.candidates.filter(c => c.recordType === "current" && (regF === "ALL" || c.region === regF) && (catF === "ALL" || c.category === catF) && wf.includes(c.workflowStage));
  if (filtered.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500 font-bold">Ёзувлар топилмади</td></tr>`; return; }
  const groups = {}; filtered.forEach(c => { const k = `${c.districtHeading}|||${c.appointType}`; if (!groups[k]) groups[k] = []; groups[k].push(c); });
  let html = "", count = 1;
  Object.keys(groups).forEach(k => {
    const [h, a] = k.split("|||"); html += `<tr><td colspan="5" class="text-center font-bold py-2 bg-slate-50" style="font-size:14px;"><span class="text-blue-950">${h}</span><span class="text-red-600"> ${a || ""}</span></td></tr>`;
    groups[k].forEach(c => { html += renderCandidateRow(c, count++); });
  });
  tbody.innerHTML = html;
}

function renderCandidateRow(c, count) {
  const cI = c.createdTime ? `<div class="text-[10px] text-slate-500 mt-0.5">🕐 ${c.createdAt} ${c.createdTime}</div>` : `<div class="text-[10px] text-slate-500 mt-0.5">🕐 ${c.createdAt}</div>`;
  let tl = "";
  if (currentRole === ROLES.KORRUPSIYA || currentRole === ROLES.RAHBAR) {
    const s = []; if (c.createdTime) s.push(`📥 ${c.createdAt}`); if (c.sentToBossAt) s.push(`📤 ${c.sentToBossAt}`); if (c.bossApprovedAt) s.push(`✅ ${c.bossApprovedAt}`);
    if (s.length > 0) tl = `<div class="mt-2 p-2 rounded bg-slate-50 border border-slate-200 text-[10px] text-left">${s.map(x => `<div>${x}</div>`).join("")}</div>`;
  }
  return `<tr><td class="text-center font-bold">${count}.</td><td class="text-center"><img src="${c.photo}" style="width:100px;height:125px;object-fit:cover;margin:0 auto;border:1px solid #334155;border-radius:4px;" /></td><td class="text-center"><div class="font-bold text-sm">${c.fio}</div><div class="mt-1 text-xs">${c.birthDate} йил,<br/>${c.birthPlace}</div><div class="font-mono text-[10px] mt-1">${c.passSeries} ${c.passNum}</div><div class="font-mono font-bold text-[11px]">${c.pinfl}</div>${cI}</td><td class="text-center text-blue-950 text-xs"><div class="font-semibold">${c.category || ""}</div><div class="mt-1">${c.currentJob}</div><div class="mt-2 text-slate-700">${c.jobSince}</div>${tl}</td><td class="text-center align-middle">${renderActionCell(c)}</td></tr>`;
}

function renderActionCell(c) {
  const b = getFinalResultBadge(c), isSud = c.sudlanganStatus === "sudlangan";
  if (currentRole === ROLES.KADR) { return c.workflowStage === "approved" ? `<div class="space-y-1.5 text-center">${b}<button onclick="openDocModal('${c.id}')" class="w-full py-1.5 rounded-lg bg-blue-700 text-white font-bold text-[11px]">📄 МАЪЛУМОТНОМА</button></div>` : `<div class="space-y-1 text-center">${b}<div class="text-[10px] text-slate-500 italic">Текширилмоқда...</div></div>`; }
  if (currentRole === ROLES.KORRUPSIYA) {
    let st = c.workflowStage === "admin_review" ? `<div class="text-[10px] font-bold text-amber-700">🔍 Коррупцияда</div>` : c.workflowStage === "boss_review" ? `<div class="text-[10px] font-bold text-blue-700">📤 Бошлиқда</div>` : `<div class="text-[10px] font-bold text-emerald-700">✓ Тасдиқланди</div>`;
    return `<div class="space-y-1.5 w-full">${b} ${st} ${isSud ? `<div class="p-1.5 rounded bg-red-100 text-red-900 font-bold text-[10px]">🚨 СУДЛАНГАН</div>` : `<div class="text-[10px] text-emerald-800">✓ Судланмаган</div>`}<div class="flex flex-col gap-1"><button onclick="openEditorModal('${c.id}')" class="w-full py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[10px]">✍️ Таҳрир</button><div class="flex gap-1"><button onclick="editCandidate('${c.id}')" class="flex-1 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px]">✏️</button><button onclick="confirmDeleteCandidate('${c.id}')" class="flex-1 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[10px]">🗑</button></div><button onclick="openDocModal('${c.id}')" class="w-full py-2 rounded-lg bg-emerald-700 text-white font-extrabold text-[11px]">📄 МАЪЛУМОТНОМА</button></div></div>`;
  }
  if (currentRole === ROLES.RAHBAR) {
    if (c.workflowStage === "admin_review") return `<div class="space-y-1 text-center">${b}<div class="text-[10px] text-slate-500">🔒 Коррупцияда</div></div>`;
    if (c.workflowStage === "boss_review") return `<div class="space-y-1.5">${b}<button onclick="openDocModal('${c.id}')" class="w-full py-2 rounded-lg bg-emerald-700 text-white font-extrabold text-[10px]">📄 ҲУЖЖАТНИ ОЧИШ</button></div>`;
    return `<div class="space-y-1.5">${b}<button onclick="openDocModal('${c.id}')" class="w-full py-1.5 rounded-lg bg-blue-700 text-white font-bold text-[10px]">📄 МАЪЛУМОТНОМА</button></div>`;
  }
  if (currentRole === ROLES.KUZATUVCHI) {
    if (c.workflowStage !== "approved") return `<div class="space-y-1 text-center">${b}<div class="text-[10px] text-slate-500">🔒 Ўрганишда</div></div>`;
    return `<div class="space-y-1.5">${b}<button onclick="openDocModal('${c.id}')" class="w-full py-1.5 rounded-lg bg-purple-700 text-white font-bold text-[10px]">👁 ЎҚИШ</button></div>`;
  }
  return `<div class="text-[10px] text-slate-400 italic text-center">—</div>`;
}

function getFinalResultBadge(c) { return c.workflowStage === "approved" ? `<span class="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold text-[10px]">✓ Ўрганиб чиқилди</span>` : c.workflowStage === "boss_review" ? `<span class="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-400 font-bold text-[10px]">📤 Бошлиқда</span>` : `<span class="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-400 font-bold text-[10px]">⏳ Ўрганишда</span>`; }
function getFinalResultPlainText(c) { return c.workflowStage === "approved" ? "Ўрганиб чиқилди" : c.workflowStage === "boss_review" ? "Бошлиқда" : "Ўрганиш жараёнида"; }

// ... (renderFormerTable, renderItsTable, renderNegativeTable, renderDatabaseTable, renderUsersTable, populateRegionSelects - аввалги коддек қолади, жуда узун бўлмаслиги учун бу ерда келтирмадим, лекин сиз аввалги тўлиқ коддан кўчириб қўйинг)
