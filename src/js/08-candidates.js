// =========================================================================
// 08-CANDIDATES.JS — CRUD + Image Resize + Full Date
// «КОМПЛАЕНС-КАДР» v11.5
// =========================================================================

let currentPhotoDataUrl = null;
let currentEditPhotoDataUrl = null;

function cleanText(text) {
  if (!text) return text;
  let r = String(text).trim().replace(/\s+/g, " ");
  return r.replace(/^[,;:\-\s]+/, "").replace(/[,;:\-\s]+$/, "");
}

function latToCyr(text) {
  if (!text) return text;
  if ((text.match(/[А-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length > (text.match(/[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length / 2) return text;
  let r = text;
  r = r.replace(/sh/gi, m => m[0] === "S" ? "Ш" : "ш").replace(/ch/gi, m => m[0] === "C" ? "Ч" : "ч").replace(/yo/gi, m => m[0] === "Y" ? "Ё" : "ё").replace(/yu/gi, m => m[0] === "Y" ? "Ю" : "ю").replace(/ya/gi, m => m[0] === "Y" ? "Я" : "я").replace(/ts/gi, m => m[0] === "T" ? "Ц" : "ц");
  r = r.replace(/[oO]['ʻ`‘’ʼ]/g, m => m[0] === "O" ? "Ў" : "ў").replace(/[gG]['ʻ`‘’ʼ]/g, m => m[0] === "G" ? "Ғ" : "ғ");
  const map = { "a":"а","b":"б","d":"д","e":"е","f":"ф","g":"г","h":"ҳ","i":"и","j":"ж","k":"к","l":"л","m":"м","n":"н","o":"о","p":"п","q":"қ","r":"р","s":"с","t":"т","u":"у","v":"в","x":"х","y":"й","z":"з","A":"А","B":"Б","D":"Д","E":"Е","F":"Ф","G":"Г","H":"Ҳ","I":"И","J":"Ж","K":"К","L":"Л","M":"М","N":"Н","O":"О","P":"П","Q":"Қ","R":"Р","S":"С","T":"Т","U":"У","V":"В","X":"Х","Y":"Й","Z":"З","c":"к","C":"К","w":"в","W":"В" };
  return r.replace(/[a-zA-Z]/g, ch => map[ch] || ch);
}

async function loadPhotoFromFile(file, zoneId) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300, MAX_HEIGHT = 400;
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          if (typeof showToast === "function") showToast("⏳ Расм юкланмоқда...", "info");
          if (typeof uploadPhotoToSupabase === "function") {
            const url = await uploadPhotoToSupabase(blob, file.name);
            if (url) { showPhotoPreview(url, zoneId); if (typeof showToast === "function") showToast("✅ Расм юкланди", "success"); } 
            else { if (typeof showToast === "function") showToast("❌ Расм юклашда хато", "error"); }
          } else {
            showPhotoPreview(canvas.toDataURL("image/jpeg", 0.7), zoneId);
          }
          resolve();
        }, "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function handlePhotoDragOver(e) { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("drag-over"); }
function handlePhotoDragLeave(e) { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("drag-over"); }
async function handlePhotoDrop(e, zoneId) {
  e.preventDefault(); e.stopPropagation();
  document.getElementById(zoneId)?.classList.remove("drag-over");
  const dt = e.dataTransfer;
  if (dt.files && dt.files.length > 0) {
    const file = dt.files[0];
    if (file.type && file.type.startsWith("image/")) { await loadPhotoFromFile(file, zoneId); return; }
  }
  const html = dt.getData("text/html");
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      if (match[1].startsWith("data:image")) { showPhotoPreview(match[1], zoneId); return; }
      else if (match[1].startsWith("http")) { await loadPhotoFromUrl(match[1], zoneId); return; }
    }
  }
}
async function loadPhotoFromUrl(url, zoneId) {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => { showPhotoPreview(ev.target.result, zoneId); resolve(); };
      reader.readAsDataURL(blob);
    });
  } catch (e) { showToast("❌ Расмни юклаб бўлмади. Файлни танланг.", "warning"); }
}
function showPhotoPreview(dataUrl, zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  if (zoneId === "editCandPhotoDropZone") currentEditPhotoDataUrl = dataUrl; else currentPhotoDataUrl = dataUrl;
  zone.classList.add("has-photo");
  zone.querySelector(".drop-zone-content").classList.add("hidden");
  const img = zone.querySelector(".drop-zone-preview"); img.src = dataUrl; img.classList.remove("hidden");
  zone.querySelector(".drop-zone-clear").classList.remove("hidden");
}
function clearPhoto(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  if (zoneId === "editCandPhotoDropZone") currentEditPhotoDataUrl = null; else currentPhotoDataUrl = null;
  zone.classList.remove("has-photo", "drag-over");
  zone.querySelector(".drop-zone-content").classList.remove("hidden");
  zone.querySelector(".drop-zone-preview").src = ""; zone.querySelector(".drop-zone-preview").classList.add("hidden");
  zone.querySelector(".drop-zone-clear").classList.add("hidden");
}
function triggerPhotoFileSelect(zoneId) { const id = zoneId === "editCandPhotoDropZone" ? "editCandPhotoFile" : "inpPhotoFile"; document.getElementById(id)?.click(); }
async function handlePhotoFileInput(e, zoneId) {
  const file = e.target.files?.[0]; if (!file) return;
  await loadPhotoFromFile(file, zoneId); e.target.value = "";
}
function setupPhotoPasteListener() {
  document.addEventListener("paste", (e) => {
    const editModal = document.getElementById("editCandidateModal");
    const isEdit = editModal && !editModal.classList.contains("hidden");
    const isForm = document.getElementById("candidateForm")?.offsetParent !== null;
    if (!isEdit && !isForm) return;
    const items = e.clipboardData?.items; if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) { loadPhotoFromFile(file, isEdit ? "editCandPhotoDropZone" : "inpPhotoDropZone"); e.preventDefault(); return; }
      }
    }
  });
}

function getOrganizationFromCategory(cat) { return (cat && cat.includes("ДКП")) ? "Давлат кадастрлари палатаси" : "Кадастр агентлиги"; }
function getPositionFromCategory(cat) {
  if (!cat) return "";
  if (cat.includes("КА туман")) return "бўлими бошлиғи";
  if (cat.includes("ДКП туман")) return "филиали раҳбари";
  if (cat.includes("КА ҳудудий") || cat.includes("ДКП ҳудудий")) return "бошлиғи";
  if (cat.includes("марказий")) return "ходими";
  if (cat.includes("Комплаенс")) return "комплаенс ходими";
  if (cat.includes("Собиқ")) return "собиқ ходими бўйича";
  return "";
}

// 🆕 ТУМАН МАЙДОНИНИ ЯШИРИШ/КЎРСАТИШ ВА САНА БИЛАН ИШЛАШ
function updateHeadingPreview() {
  const region = document.getElementById("inpRegion")?.value || "";
  const category = document.getElementById("inpCategory")?.value || "";
  const district = document.getElementById("inpDistrict")?.value.trim() || "";
  
  const distWrapper = document.getElementById("districtFieldWrapper");
  const distInput = document.getElementById("inpDistrict");
  const distLabel = document.getElementById("inpDistrictLabel");
  
  // 🆕 Кадастр агентлиги ёки ДКП танланса - Туман майдонини яшириш
  if (region === "Кадастр агентлиги" || region === "Давлат кадастрлари палатаси") {
    if (distWrapper) distWrapper.style.display = "none";
    if (distInput) distInput.value = "";
  } else {
    if (distWrapper) distWrapper.style.display = "grid";
    if (district === "") {
      distInput.placeholder = region === "Тизим ташкилотлари" ? 'Мисол: "Kadastr IT" МЧЖ' : "Дўстлик тумани бўлими";
      distLabel.textContent = region === "Тизим ташкилотлари" ? "4. Ташкилот номи *" : "4. Туман / шаҳар (қисқа) *";
    }
  }

  const heading = buildDistrictHeading(region, district, category); 
  const field = document.getElementById("inpDistrictHeading");
  if (field && field.dataset.manualEdited !== "true") field.value = heading;
}

function buildDistrictHeading(region, district, category) {
  region = cleanText(region); district = cleanText(district);
  if (category?.includes("Собиқ")) return cleanText(`${getOrganizationFromCategory(category)} ${region || ""} собиқ ходими бўйича`);
  if (region === "Кадастр агентлиги") return category?.includes("Комплаенс") ? "Кадастр агентлиги комплаенс ходими лавозимига" : "Кадастр агентлиги ходими лавозимига";
  if (region === "Давлат кадастрлари палатаси") return category?.includes("Комплаенс") ? "Давлат кадастрлари палатаси комплаенс ходими лавозимига" : "Давлат кадастрлари палатаси ходими лавозимига";
  if (region === "Тизим ташкилотлари") return district ? `Тизим ташкилоти ${district} лавозимига` : "Тизим ташкилоти ходими лавозимига";
  const org = getOrganizationFromCategory(category); const regionPart = region ? `${org} ${region} бошқармаси` : org; const posCat = getPositionFromCategory(category);
  const distCyr = latToCyr(district);
  if (!distCyr) return posCat ? `${regionPart} ${posCat} лавозимига` : `${regionPart} лавозимига`;
  const hasPos = /бўлими|бўлим|бошлиғи|бошлиқ|филиали|филиал|раҳбари|раҳбар|мутахассиси|мутахассис|ходими|ходим|аппарати/i.test(distCyr);
  return hasPos ? `${regionPart} ${distCyr} лавозимига` : `${regionPart} ${distCyr} ${posCat} лавозимига`.trim();
}

function setupHeadingFieldTracking() {
  const field = document.getElementById("inpDistrictHeading"); if (!field) return;
  field.addEventListener("input", () => { field.dataset.tracking = "1"; field.dataset.manualEdited = "true"; });
  ["inpRegion", "inpCategory", "inpDistrict"].forEach(id => { const el = document.getElementById(id); if (el) { el.addEventListener("change", () => { field.dataset.manualEdited = "false"; field.dataset.tracking = ""; updateHeadingPreview(); }); el.addEventListener("input", () => { if (el.id === "inpDistrict" && field.dataset.manualEdited !== "true") updateHeadingPreview(); }); } });
  setupPhotoPasteListener();
}
function getFinalHeading() {
  const manual = document.getElementById("inpDistrictHeading")?.value.trim() || ""; if (manual) return manual;
  return buildDistrictHeading(document.getElementById("inpRegion")?.value || "", document.getElementById("inpDistrict")?.value.trim() || "", document.getElementById("inpCategory")?.value || "");
}

// Валидация
function validateDate(dateStr, fieldName) {
  if (!dateStr) return `${fieldName} бўш`; const digits = dateStr.replace(/\D/g, ""); if (digits.length < 8) return `${fieldName} тўлиқ эмас`;
  const dd = parseInt(digits.substring(0, 2)), mm = parseInt(digits.substring(2, 4)), yyyy = parseInt(digits.substring(4, 8));
  if (dd < 1 || dd > 31) return `${fieldName}: кун 01-31`; if (mm < 1 || mm > 12) return `${fieldName}: ОЙ 01-12 бўлиши керак!`; if (yyyy < 1900 || yyyy > 2030) return `${fieldName}: йил 1900-2030`;
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; if (dd > days[mm - 1]) return `${fieldName}: бу ойда ${days[mm - 1]} кун`;
  return null;
}
function validateFIO(fio) { if (!fio || fio.length < 3) return "Ф.И.Ш. қисқа"; if (/^\d+$/.test(fio)) return "Ф.И.Ш. рақам бўлмаслиги керак"; if (fio.length > 100) return "Ф.И.Ш. узун"; return null; }
function validateCurrentJob(job) { if (!job || job.length < 5) return "Лавозим қисқа"; if (/^\d+$/.test(job)) return "Лавозим рақам бўлмаслиги керак"; return null; }

function validateCandidateForm() {
  const errors = []; const fio = document.getElementById("inpFio").value.trim(); const pinfl = document.getElementById("inpPinfl").value.trim(); const passSeries = document.getElementById("inpPassSeries").value.trim().toUpperCase(); const passNum = document.getElementById("inpPassNum").value.trim(); const birthDate = document.getElementById("inpBirthDate").value.trim(); const jobSince = document.getElementById("inpJobSince").value.trim(); const currentJob = document.getElementById("inpCurrentJob").value.trim(); const district = document.getElementById("inpDistrict").value.trim(); const heading = document.getElementById("inpDistrictHeading")?.value.trim() || "";
  const fErr = validateFIO(fio); if (fErr) errors.push(fErr);
  if (pinfl.length !== 14 || !/^\d{14}$/.test(pinfl)) errors.push("ПИНФЛ 14 рақам бўлиши керак");
  if (!/^[A-Z]{2}$/.test(passSeries)) errors.push("Паспорт серияси 2 та катта ҳарф");
  if (!/^\d{7}$/.test(passNum)) errors.push("Паспорт рақами 7 та рақам");
  const bdErr = validateDate(birthDate, "Туғилган сана"); if (bdErr) errors.push(bdErr);
  const jsErr = validateDate(jobSince, "Лавозимга қўйилган сана"); if (jsErr) errors.push(jsErr);
  const jobErr = validateCurrentJob(currentJob); if (jobErr) errors.push(jobErr);
  
  const noDist = ["Кадастр агентлиги", "Давлат кадастрлари палатаси"]; const selReg = document.getElementById("inpRegion")?.value;
  if (!noDist.includes(selReg) && (!district || district.length < 3)) errors.push(selReg === "Тизим ташкилотлари" ? "Ташкилот номи шарт" : "Туман/шаҳар номи шарт");
  
  if (!heading || heading.length < 20) errors.push("Тўлиқ сарлавҳа 20+ белги");
  return errors;
}

function checkPinflDuplicate() {
  const inp = document.getElementById("inpPinfl"); const box = document.getElementById("pinflDuplicateBox"); if (!inp || !box) return;
  const val = inp.value.replace(/\D/g, ""); inp.value = val;
  if (val.length === 14) {
    const dup = appState.candidates.find(c => c.pinfl === val); box.classList.remove("hidden");
    if (dup) { box.className = "p-2.5 rounded-lg bg-red-50 border-2 border-red-400 text-red-950 text-xs"; box.innerHTML = `⚠️ <b>ПИНФЛ ДУБЛИКАТИ:</b> <b>${dup.fio}</b>`; } 
    else { box.className = "p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs"; box.innerHTML = `✅ <b>ПИНФЛ тоза</b>`; }
  } else if (val.length > 0 && val.length < 14) { box.classList.remove("hidden"); box.className = "p-2.5 rounded-lg bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs"; box.innerHTML = `⚠️ ПИНФЛ: <b>${val.length}</b> / 14`; } 
  else box.classList.add("hidden");
}

function handleCandidateFormSubmit(e) {
  e.preventDefault(); if (!hasPermission("add_candidate")) return alert("Рухсат йўқ!");
  const errors = validateCandidateForm(); if (errors.length > 0) return alert("⚠️ ХАТОЛАР:\n\n• " + errors.join("\n• "));
  
  const recordType = document.getElementById("inpRecordType").value; const region = document.getElementById("inpRegion").value; const category = document.getElementById("inpCategory").value; let district = document.getElementById("inpDistrict").value.trim(); const appointType = document.getElementById("inpAppointType").value; const pinfl = document.getElementById("inpPinfl").value.trim(); const passSeries = document.getElementById("inpPassSeries").value.trim().toUpperCase(); const passNum = document.getElementById("inpPassNum").value.trim(); let fio = document.getElementById("inpFio").value.trim(); const birthDate = document.getElementById("inpBirthDate").value.trim(); let birthPlace = document.getElementById("inpBirthPlace").value.trim(); let currentJob = document.getElementById("inpCurrentJob").value.trim(); let jobSince = document.getElementById("inpJobSince").value.trim();
  
  if (region === "Кадастр агентлиги" || region === "Давлат кадастрлари палатаси") district = "";
  
  fio = cleanText(latToCyr(fio)); birthPlace = cleanText(latToCyr(birthPlace)); currentJob = cleanText(latToCyr(currentJob)); 
  // 🆕 jobSince энди Кун.Ой.Йил шаклида (масалан: 15.01.2026)
  // Тозалаш: фақат рақам ва нуқта қолади
  jobSince = jobSince.replace(/[^\d.]/g, "");

  let photoDataUrl = currentPhotoDataUrl || makeAvatarSvg(((fio.split(" ")[0] || "Х")[0] + (fio.split(" ")[1] || "А")[0]).toUpperCase(), "#4a6fa5");
  const now = getNow(); const num = String(appState.candidates.length + 1).padStart(2, "0"); const prefix = recordType === "former" ? "ККБ-СХ-" : "ККБ-"; const reestrNo = `${prefix}${now.year}/${now.month}-${num}`; const heading = getFinalHeading();
  
  const newCand = { id: "CAND-" + Date.now(), reestrNo, createdAt: now.date, createdTime: now.time, createdBy: currentUser?.login || "unknown", createdByName: currentUser?.name || "", year: now.year, month: now.month, recordType, region, category, districtHeading: heading, appointType, fio, birthDate, birthPlace, passSeries, passNum, pinfl, currentJob, jobSince, photo: photoDataUrl, itsChecked: false, sudlanganStatus: "clean", sudlanganText: "муқаддам судланмаган", workflowStage: "admin_review", eduText: "миллати ўзбек, оилали, маълумоти олий.", para2: "...", para3: "...", para4: "...", korrupsiyaViewedAt: "", sentToBossAt: "", sentToBossTime: "", sentToBossBy: "", sentToBossByName: "", bossViewedAt: "", bossApprovedAt: "", bossApprovedBy: "", bossReturnedAt: "", bossReturnReason: "", approvedDate: "", lastEditedAt: "", lastEditedBy: "", editHistory: [] };
  
  appState.candidates.unshift(newCand); if (typeof logCandidateAdded === "function") logCandidateAdded(newCand); if (typeof addNotification === "function") addNotification({ type: "new_candidate", candidateId: newCand.id, candidateName: newCand.fio, message: "🆕 Янги ходим киритилди", detail: `${newCand.region} | ${newCand.category}`, forRoles: [ROLES.KORRUPSIYA, ROLES.RAHBAR] });
  
  saveState(); renderAll(); e.target.reset(); currentPhotoDataUrl = null; clearPhoto("inpPhotoDropZone"); const hf = document.getElementById("inpDistrictHeading"); if (hf) { hf.value = ""; hf.dataset.manualEdited = "false"; hf.dataset.tracking = ""; }
  document.getElementById("pinflDuplicateBox").classList.add("hidden"); if (recordType === "former") switchTab("former"); else if (currentRole === ROLES.KORRUPSIYA) switchSubTab("new"); showToast(`✅ Номзод қўшилди!`, "success");
}

function editCandidate(id) {
  if (!hasPermission("edit_candidate")) return alert("Рухсат йўқ!"); const c = appState.candidates.find(x => x.id === id); if (!c) return;
  activeCandidateId = id; setValueIfExists("editCandFio", c.fio); setValueIfExists("editCandPinfl", c.pinfl); setValueIfExists("editCandPassSeries", c.passSeries); setValueIfExists("editCandPassNum", c.passNum); setValueIfExists("editCandBirthDate", c.birthDate); setValueIfExists("editCandBirthPlace", c.birthPlace); setValueIfExists("editCandCurrentJob", c.currentJob); setValueIfExists("editCandJobSince", c.jobSince); setValueIfExists("editCandDistrict", c.districtHeading);
  const rs = document.getElementById("editCandRegion"); if (rs) rs.value = c.region; const cs = document.getElementById("editCandCategory"); if (cs) cs.value = c.category; const as = document.getElementById("editCandAppointType"); if (as) as.value = c.appointType;
  currentEditPhotoDataUrl = c.photo || null; const pz = document.getElementById("editCandPhotoDropZone"); if (pz && c.photo) { pz.querySelector(".drop-zone-content").classList.add("hidden"); pz.querySelector(".drop-zone-preview").src = c.photo; pz.querySelector(".drop-zone-preview").classList.remove("hidden"); pz.querySelector(".drop-zone-clear").classList.remove("hidden"); pz.classList.add("has-photo"); } else if (pz) { clearPhoto("editCandPhotoDropZone"); currentEditPhotoDataUrl = c.photo || null; }
  const hb = document.getElementById("editHistoryBlock"); if (hb) { if (c.editHistory?.length > 0) { hb.classList.remove("hidden"); hb.innerHTML = `<div class="text-xs font-bold mb-1">📋 Тарих:</div>` + c.editHistory.slice().reverse().map(h => `<div class="text-[10px] p-1.5 rounded bg-amber-50 mb-1"><b>${h.at}</b>: ${h.field}</div>`).join(""); } else hb.classList.add("hidden"); }
  document.getElementById("editCandidateModal")?.classList.remove("hidden");
}
function setValueIfExists(id, val) { const el = document.getElementById(id); if (el) el.value = val || ""; }

function saveEditedCandidate() {
  if (!hasPermission("edit_candidate")) return alert("Рухсат йўқ!"); const c = appState.candidates.find(x => x.id === activeCandidateId); if (!c) return;
  let nFio = document.getElementById("editCandFio").value.trim(); const nPinfl = document.getElementById("editCandPinfl").value.trim(); const nPs = document.getElementById("editCandPassSeries").value.trim().toUpperCase(); const nPn = document.getElementById("editCandPassNum").value.trim(); const nBd = document.getElementById("editCandBirthDate").value.trim(); let nBp = document.getElementById("editCandBirthPlace").value.trim(); let nCj = document.getElementById("editCandCurrentJob").value.trim(); let nJs = document.getElementById("editCandJobSince").value.trim(); const nDist = document.getElementById("editCandDistrict").value.trim(); const nReg = document.getElementById("editCandRegion").value; const nCat = document.getElementById("editCandCategory").value; const nApp = document.getElementById("editCandAppointType").value;
  
  nFio = cleanText(latToCyr(nFio)); nBp = cleanText(latToCyr(nBp)); nCj = cleanText(latToCyr(nCj)); nJs = nJs.replace(/[^\d.]/g, "");
  
  if (validateFIO(nFio)) return alert(validateFIO(nFio)); if (!/^\d{14}$/.test(nPinfl)) return alert("ПИНФЛ 14 рақам!"); if (!/^[A-Z]{2}$/.test(nPs) || !/^\d{7}$/.test(nPn)) return alert("Паспорт хато!");
  const dup = appState.candidates.find(x => x.pinfl === nPinfl && x.id !== c.id); if (dup) return alert(`⚠️ ПИНФЛ бошқа номзодда: ${dup.fio}`);
  
  const changes = []; const now = getNow(); const ed = currentUser?.login || "unknown"; const edN = currentUser?.name || "";
  [{f:"Ф.И.Ш.",o:c.fio,n:nFio},{f:"ПИНФЛ",o:c.pinfl,n:nPinfl},{f:"Лавозим",o:c.currentJob,n:nCj},{f:"Иш вақти",o:c.jobSince,n:nJs},{f:"Ҳудуд",o:c.region,n:nReg},{f:"Сарлавҳа",o:c.districtHeading,n:nDist}].forEach(x => { if (x.o !== x.n) changes.push({at: now.dateTime, by: `${edN} (${ed})`, field: x.f, oldValue: x.o, newValue: x.n}); });
  if (currentEditPhotoDataUrl && currentEditPhotoDataUrl !== c.photo) changes.push({at: now.dateTime, by: `${edN} (${ed})`, field: "Расм", oldValue: "[эски]", newValue: "[янги]"});
  
  if (changes.length === 0) return alert("Ўзгариш йўқ.");
  
  c.fio = nFio; c.pinfl = nPinfl; c.passSeries = nPs; c.passNum = nPn; c.birthDate = nBd; c.birthPlace = nBp; c.currentJob = nCj; c.jobSince = nJs; c.region = nReg; c.category = nCat; c.appointType = nApp; c.districtHeading = nDist; if (currentEditPhotoDataUrl) c.photo = currentEditPhotoDataUrl;
  c.editHistory = (c.editHistory || []).concat(changes); c.lastEditedAt = now.dateTime; c.lastEditedBy = ed;
  if (typeof addAuditLog === "function") addAuditLog("CANDIDATE_EDITED", `${c.id} | ${c.fio}`);
  
  saveState(); renderAll(); closeEditCandidateModal(); showToast(`✅ Таҳрир сақланди`, "success");
}
function closeEditCandidateModal() { document.getElementById("editCandidateModal")?.classList.add("hidden"); activeCandidateId = null; currentEditPhotoDataUrl = null; }

function confirmDeleteCandidate(id) {
  if (!hasPermission("delete_candidate")) return alert("Рухсат йўқ!"); const c = appState.candidates.find(x => x.id === id); if (!c) return;
  if (!confirm(`⚠️ «${c.fio}» ЎЧИРИЛСИНМИ?`)) return; if (!confirm(`❌ ЯНА БИР МАРТА ТАСДИҚЛАНГ!`)) return;
  if (typeof addAuditLog === "function") addAuditLog("CANDIDATE_DELETED", `${c.id} | ${c.fio}`); const idx = appState.candidates.findIndex(x => x.id === id); if (idx !== -1) appState.candidates.splice(idx, 1);
  saveState(); renderAll(); showToast(`🗑 Ўчирилди`, "warning");
}

function quickSaveItsRow(id, notify = false) {
  if (!hasPermission("edit_its")) return alert("Рухсат йўқ!"); const c = appState.candidates.find(x => x.id === id); if (!c) return;
  const selEl = document.getElementById(`itsSel_${id}`); const txtEl = document.getElementById(`itsTxt_${id}`); if (!selEl || !txtEl) return;
  c.sudlanganStatus = selEl.value; c.itsChecked = true; c.sudlanganText = selEl.value === "clean" ? (txtEl.value.trim() || "муқаддам судланмаган") : (txtEl.value.trim().includes("судланган") ? txtEl.value.trim() : `муқаддам судланган (${txtEl.value.trim() || "ЖК моддаси аниқланди"})`);
  if (typeof logITSChecked === "function") logITSChecked(c, c.sudlanganStatus, c.sudlanganText); saveState(); renderAll(); if (notify) showToast(`✅ ИЦ сақланди`, "success");
}

function bulkSendCleanToBoss() {
  if (!hasPermission("send_to_boss")) return alert("Рухсат йўқ!"); let count = 0;
  appState.candidates.forEach(c => { if (c.workflowStage === "admin_review" && c.sudlanganStatus === "clean" && c.itsChecked) { if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи"); c.workflowStage = "boss_review"; count++; } });
  if (count === 0) return showToast("Тоза чиққан номзод йўқ", "warning"); saveState(); renderAll(); showToast(`📤 ${count} нафар юборилди`, "success");
}

function deleteUser(idx) {
  if (!hasPermission("delete_user")) return alert("Рухсат йўқ!"); const u = appState.users[idx]; if (!u) return;
  if (u.login === "admin") return alert("Асосий админ ўчирилмайди!"); if (!confirm(`«${u.name}» ўчирилсинми?`)) return;
  if (typeof addAuditLog === "function") addAuditLog("USER_DELETE", `${u.login}`); appState.users.splice(idx, 1); saveState(); renderUsersTable(); showToast(`🗑 Ўчирилди`, "warning");
}

async function handleUserCreateSubmit(e) {
  e.preventDefault(); if (!hasPermission("create_user")) return alert("Рухсат йўқ!");
  const name = document.getElementById("newUserName").value.trim(); const role = document.getElementById("newUserRole").value; const login = document.getElementById("newUserLogin").value.trim(); const pass = document.getElementById("newUserPass").value.trim();
  if (!name || !login || !pass) return alert("Барча майдонларни тўлдиринг!"); if (appState.users.some(u => u.login === login)) return alert("Логин банд!"); if (pass.length < 6) return alert("Парол 6+ белги!");
  const passHash = await hashPassword(pass); if (!passHash) return alert("Хешлаш хато!");
  appState.users.push({ login, passHash, name, role }); if (typeof addAuditLog === "function") addAuditLog("USER_CREATE", `${login} (${role})`); saveState(); renderUsersTable(); e.target.reset(); showToast(`✅ ${login} яратилди`, "success");
}
