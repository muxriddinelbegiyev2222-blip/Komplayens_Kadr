// =========================================================================
// 15-WORD-IMPORT.JS — Word файлни автоматик ўқиш (Mammoth.js орқали)
// =========================================================================

let wordImportRawData = [], wordImportHeaders = [], wordImportMapping = {}, wordImportGroups = [];

const WORD_IMPORT_FIELDS = [
  { key: "skip", label: "— Ўтказиб юбориш —" },
  { key: "number", label: "Т/р" },
  { key: "fio", label: "Ф.И.Ш." },
  { key: "birthInfo", label: "Туғилган сана ва жой" },
  { key: "currentJob", label: "Эгаллаган лавозими" },
  { key: "jobSince", label: "Қачондан ишлаган" },
  { key: "freedAt", label: "Озод этилган сана" },
  { key: "freeReason", label: "Озод этиш сабаби" },
  { key: "suggestion", label: "Таклиф" },
  { key: "region", label: "Ҳудуд" },
  { key: "pinfl", label: "ПИНФЛ" }
];

function openWordImportModal() {
  if (!hasPermission("add_candidate")) return alert("Рухсат йўқ!");
  let modal = document.getElementById("wordImportModal");
  if (!modal) { modal = createWordImportModal(); document.body.appendChild(modal); }
  resetWordImportState(); modal.classList.remove("hidden"); showWordImportStep("upload");
}

function closeWordImportModal() {
  document.getElementById("wordImportModal")?.classList.add("hidden"); resetWordImportState();
}

function resetWordImportState() { wordImportRawData = []; wordImportHeaders = []; wordImportMapping = {}; wordImportGroups = []; }

function createWordImportModal() {
  const modal = document.createElement("div");
  modal.id = "wordImportModal";
  modal.className = "fixed inset-0 z-[95] bg-slate-950/80 flex items-center justify-center p-4 hidden no-print";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-900">
      <div class="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3"><span class="text-2xl">📄</span><div><span class="text-xs uppercase font-bold text-blue-200">Word импорт</span><h3 class="text-base font-extrabold">Собиқ ходимларни юклаш</h3></div></div>
        <button onclick="closeWordImportModal()" class="w-9 h-9 rounded-xl bg-red-600 text-white font-extrabold flex items-center justify-center">✕</button>
      </div>
      <div class="p-6 overflow-y-auto flex-1 space-y-4">
        <div id="wordImportStepUpload" class="space-y-4">
          <div class="p-4 rounded-xl bg-blue-50 border-2 border-blue-300 text-xs text-slate-700">
            <p class="mb-2"><b>Қандай ишлайди?</b></p>
            <ol class="list-decimal list-inside space-y-1"><li>Word файлда жадвал бўлиши шарт</li><li>Файлни қуйидаги тугма орқали юкланг</li><li>Дастур автоматик ўқийди</li><li>Текшириб, базага қўшинг</li></ol>
          </div>
          <div class="flex items-center justify-center p-8 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50" ondragover="event.preventDefault()" ondrop="handleWordFileDrop(event)">
            <input type="file" id="wordFileInput" accept=".docx" onchange="handleWordFileSelect(event)" class="hidden" />
            <div class="text-center"><span class="text-4xl block mb-3">📄</span><button onclick="document.getElementById('wordFileInput').click()" class="px-6 py-3 rounded-xl bg-blue-800 text-white font-extrabold text-sm shadow-lg">📂 Word файлни танлаш</button><p class="text-xs text-slate-500 mt-2">Фақат .docx</p></div>
          </div>
          <div id="wordImportUploadError" class="hidden p-3 rounded-lg bg-red-50 text-red-800 text-xs font-bold"></div>
          <div id="wordImportLoading" class="hidden p-4 rounded-lg bg-blue-50 text-blue-800 text-sm font-bold text-center">Word файл таҳлил қилинмоқда...</div>
        </div>
        <div id="wordImportStepPreview" class="space-y-4 hidden">
          <div class="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-xs font-bold text-emerald-900">✅ Файл ўқилди! <span id="wordImportRowsCount">0</span> қатор. Устунларни текширинг:</div>
          <div id="wordImportMappingArea" class="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl border"></div>
          <div class="pt-3 border-t"><h4 class="font-extrabold text-sm mb-2">📋 Кўриниши:</h4><div id="wordImportPreviewTable" class="overflow-x-auto max-h-96 border rounded-lg"></div></div>
        </div>
        <div id="wordImportStepResult" class="space-y-4 hidden"><div class="p-6 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center"><span class="text-5xl block mb-3">✅</span><h4 class="font-extrabold text-xl text-emerald-900 mb-2">Импорт тайёр!</h4><p class="text-sm text-emerald-800"><b id="wordImportSuccessCount">0</b> та ходим қўшилди</p></div></div>
      </div>
      <div class="bg-slate-100 px-6 py-3.5 border-t flex justify-between">
        <button id="wordImportBackBtn" onclick="showWordImportStep('upload')" class="hidden px-4 py-2 rounded-xl bg-slate-500 text-white text-xs font-bold">← Ортга</button>
        <div class="ml-auto flex gap-2">
          <button onclick="closeWordImportModal()" class="px-4 py-2 rounded-xl bg-slate-400 text-white text-xs font-bold">Бекор қилиш</button>
          <button id="wordImportConfirmBtn" onclick="confirmWordImport()" class="hidden px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold shadow-lg">💾 Базага қўшиш</button>
        </div>
      </div>
    </div>`;
  return modal;
}

function showWordImportStep(step) {
  ["Upload","Preview","Result"].forEach(s => document.getElementById("wordImportStep" + s)?.classList.add("hidden"));
  document.getElementById("wordImportBackBtn")?.classList.add("hidden");
  document.getElementById("wordImportConfirmBtn")?.classList.add("hidden");
  if (step === "upload") document.getElementById("wordImportStepUpload")?.classList.remove("hidden");
  if (step === "preview") { document.getElementById("wordImportStepPreview")?.classList.remove("hidden"); document.getElementById("wordImportBackBtn")?.classList.remove("hidden"); document.getElementById("wordImportConfirmBtn")?.classList.remove("hidden"); }
  if (step === "result") document.getElementById("wordImportStepResult")?.classList.remove("hidden");
}

function handleWordFileSelect(e) { const file = e.target.files?.[0]; if (file) processWordFile(file); e.target.value = ""; }
function handleWordFileDrop(e) { e.preventDefault(); const file = e.dataTransfer?.files?.[0]; if (file) processWordFile(file); }

async function processWordFile(file) {
  const err = document.getElementById("wordImportUploadError"), load = document.getElementById("wordImportLoading");
  err?.classList.add("hidden");
  if (!file.name.match(/\.(docx)$/i)) { err.textContent = "❌ Фақат .docx"; err.classList.remove("hidden"); return; }
  load?.classList.remove("hidden");
  try {
    if (typeof mammoth === "undefined") throw new Error("Mammoth.js юкланмаган. Интернетни текширинг.");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const parsed = parseWordHtml(result.value);
    if (!parsed || parsed.rows.length === 0) throw new Error("Жадвал топилмади. Word да жадвал борми?");
    wordImportRawData = parsed.rows; wordImportHeaders = parsed.headers; wordImportGroups = parsed.groups;
    autoMapWordColumns(); renderWordImportMapping(); renderWordImportPreview(); showWordImportStep("preview");
    document.getElementById("wordImportRowsCount").textContent = parsed.rows.length;
  } catch (err) { err.textContent = "❌ " + err.message; err.classList.remove("hidden"); } 
  finally { load?.classList.add("hidden"); }
}

function parseWordHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html"); const tables = doc.querySelectorAll("table");
  if (tables.length > 0) {
    let best = null, max = 0;
    tables.forEach(t => { const r = t.querySelectorAll("tr").length; if (r > max) { max = r; best = t; } });
    if (best) return parseTableElement(best);
  }
  return { headers: [], rows: [], groups: [] };
}

function parseTableElement(table) {
  const rows = [], groups = []; const trs = table.querySelectorAll("tr");
  trs.forEach(tr => {
    const cells = tr.querySelectorAll("td, th"); if (cells.length === 0) return;
    const rowData = []; let isHeader = false, isGroup = false;
    cells.forEach(cell => {
      const text = cell.textContent.trim(); if (cell.querySelector("img")) { rowData.push("[РАСМ]"); return; }
      if (parseInt(cell.getAttribute("colspan") || 1) > 1) isGroup = true;
      rowData.push(text);
    });
    if (tr.querySelector("th")) isHeader = true;
    if (isGroup) { const gt = rowData.filter(t => t).join(" ").trim(); if (gt) groups.push({ title: gt, rowIndex: rows.length }); }
    rows.push({ cells: rowData, isHeader, isGroup });
  });
  const headers = rows.find(r => r.isHeader)?.cells || (rows.slice(0, 5).sort((a,b) => b.cells.length - a.cells.length)[0]?.cells || []);
  return { headers, rows: rows.filter(r => !r.isHeader), groups };
}

function autoMapWordColumns() {
  wordImportMapping = {};
  wordImportHeaders.forEach((h, i) => {
    const t = (h || "").toLowerCase(); let f = "skip";
    if (/фио|ф\.и\.ш|исм/i.test(t)) f = "fio";
    else if (/туғилган/i.test(t)) f = "birthInfo";
    else if (/pinfl|пинфл/i.test(t)) f = "pinfl";
    else if (/эгаллаб|лавозим|ишлаган/i.test(t)) f = "currentJob";
    else if (/қачондан|стаж/i.test(t)) f = "jobSince";
    else if (/озод.*сана|буйруқ/i.test(t)) f = "freedAt";
    else if (/озод.*сабаб/i.test(t)) f = "freeReason";
    else if (/таклиф/i.test(t)) f = "suggestion";
    else if (/ҳудуд|вилоят/i.test(t)) f = "region";
    else if (/№|т\/р/i.test(t)) f = "number";
    wordImportMapping[i] = f;
  });
}

function renderWordImportMapping() {
  const area = document.getElementById("wordImportMappingArea");
  area.innerHTML = wordImportHeaders.map((h, i) => `
    <div class="flex items-center gap-2 p-2 bg-white rounded border">
      <div class="flex-1"><div class="text-[10px] text-slate-500">Устун ${i + 1}</div><div class="font-bold text-xs">${h || "(бўш)"}</div></div>
      <select onchange="wordImportMapping[${i}] = this.value; renderWordImportPreview();" class="px-2 py-1 border rounded text-xs font-bold">
        ${WORD_IMPORT_FIELDS.map(opt => `<option value="${opt.key}" ${wordImportMapping[i] === opt.key ? 'selected' : ''}>${opt.label}</option>`).join("")}
      </select>
    </div>
  `).join("");
}

function renderWordImportPreview() {
  const cont = document.getElementById("wordImportPreviewTable");
  const cols = Object.keys(wordImportMapping).filter(k => wordImportMapping[k] !== "skip").map(Number);
  const dataRows = wordImportRawData.filter(r => !r.isGroup);
  cont.innerHTML = `<table class="min-w-full border text-[10px]"><thead><tr>${cols.map(c => `<th class="border bg-blue-100 p-1">${WORD_IMPORT_FIELDS.find(f => f.key === wordImportMapping[c])?.label}</th>`).join("")}</tr></thead><tbody>${dataRows.slice(0, 30).map(r => `<tr>${cols.map(c => `<td class="border p-1">${r.cells[c] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function confirmWordImport() {
  const dataRows = wordImportRawData.filter(r => !r.isGroup); let count = 0;
  dataRows.forEach(row => {
    const record = {}; Object.keys(wordImportMapping).forEach(i => { if (wordImportMapping[i] !== "skip" && wordImportMapping[i] !== "number") record[wordImportMapping[i]] = row.cells[i]; });
    if (!record.fio || record.fio.length < 3) return;
    const now = getNow(); const num = String(appState.candidates.length + 1).padStart(2, "0");
    const nC = { id: "CAND-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4), reestrNo: `ККБ-СХ-${now.year}/${now.month}-${num}`, createdAt: now.date, createdTime: now.time, createdBy: currentUser?.login, createdByName: currentUser?.name + " (Word)", year: now.year, month: now.month, recordType: "former", region: cleanText(record.region || "—"), category: "Собиқ ходимлар йўналиши", districtHeading: `Давлат кадастрлари палатаси ${record.region || ""} собиқ ходими бўйича`, appointType: "(собиқ ходим)", fio: cleanText(latToCyr(record.fio)), birthDate: "01.01.1990", birthPlace: cleanText(latToCyr(record.birthInfo || "")), passSeries: "", passNum: "", pinfl: record.pinfl?.replace(/\D/g, "").substr(0, 14) || "", currentJob: cleanText(latToCyr(record.currentJob || "")), jobSince: (record.jobSince || "").replace(/\D/g, "").substr(0, 4), photo: makeAvatarSvg("ХА", "#7e22ce"), itsChecked: false, sudlanganStatus: "clean", sudlanganText: "муқаддам судланмаган", workflowStage: "admin_review", eduText: "Word импорт.", para2: "-", para3: "-", para4: "-", editHistory: [] };
    appState.candidates.unshift(nC); count++;
  });
  if (count > 0) { saveState(); renderAll(); }
  document.getElementById("wordImportSuccessCount").textContent = count; showWordImportStep("result"); showToast(`✅ ${count} ходим қўшилди`, "success");
}
