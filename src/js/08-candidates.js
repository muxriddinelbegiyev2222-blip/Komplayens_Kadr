// =========================================================================
// 08-CANDIDATES.JS — Номзодлар CRUD
// «КОМПЛАЕНС-КАДР» v10.3 — Central Office тўғри ишлайди
// =========================================================================

// =========================================================================
// 1. РАСМ УЧУН ГЛОБАЛ ЎЗГАРУВЧИЛАР
// =========================================================================

let currentPhotoDataUrl = null;
let currentEditPhotoDataUrl = null;

// =========================================================================
// 2. МАТННИ ТОЗАЛАШ
// =========================================================================

function cleanText(text) {
  if (!text) return text;
  let r = String(text);
  r = r.trim();
  r = r.replace(/\s+/g, " ");
  r = r.replace(/^[,;:\-\s]+/, "").replace(/[,;:\-\s]+$/, "");
  return r;
}

// =========================================================================
// 3. ЛОТИН → КИРИЛЛ
// =========================================================================

function latToCyr(text) {
  if (!text) return text;

  const cyrCount = (text.match(/[А-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length;
  const allLetters = (text.match(/[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length;
  if (cyrCount > allLetters / 2) return text;

  let r = text;

  r = r.replace(/sh/gi, m => m[0] === "S" ? "Ш" : "ш");
  r = r.replace(/ch/gi, m => m[0] === "C" ? "Ч" : "ч");
  r = r.replace(/yo/gi, m => m[0] === "Y" ? "Ё" : "ё");
  r = r.replace(/yu/gi, m => m[0] === "Y" ? "Ю" : "ю");
  r = r.replace(/ya/gi, m => m[0] === "Y" ? "Я" : "я");
  r = r.replace(/ts/gi, m => m[0] === "T" ? "Ц" : "ц");

  r = r.replace(/[oO]['ʻ`‘’ʼ]/g, m => m[0] === "O" ? "Ў" : "ў");
  r = r.replace(/[gG]['ʻ`‘’ʼ]/g, m => m[0] === "G" ? "Ғ" : "ғ");

  const map = {
    "a":"а","b":"б","d":"д","e":"е","f":"ф","g":"г","h":"ҳ","i":"и","j":"ж",
    "k":"к","l":"л","m":"м","n":"н","o":"о","p":"п","q":"қ","r":"р","s":"с",
    "t":"т","u":"у","v":"в","x":"х","y":"й","z":"з",
    "A":"А","B":"Б","D":"Д","E":"Е","F":"Ф","G":"Г","H":"Ҳ","I":"И","J":"Ж",
    "K":"К","L":"Л","M":"М","N":"Н","O":"О","P":"П","Q":"Қ","R":"Р","S":"С",
    "T":"Т","U":"У","V":"В","X":"Х","Y":"Й","Z":"З",
    "c":"к","C":"К","w":"в","W":"В"
  };

  r = r.replace(/[a-zA-Z]/g, ch => map[ch] || ch);
  return r;
}

// =========================================================================
// 4. РАСМ DRAG & DROP
// =========================================================================

function handlePhotoDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget;
  if (zone) zone.classList.add("drag-over");
}

function handlePhotoDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget;
  if (zone) zone.classList.remove("drag-over");
}

async function handlePhotoDrop(e, zoneId) {
  e.preventDefault();
  e.stopPropagation();

  const zone = document.getElementById(zoneId);
  if (zone) zone.classList.remove("drag-over");

  const dt = e.dataTransfer;
  if (!dt) return;

  if (dt.files && dt.files.length > 0) {
    const file = dt.files[0];
    if (file.type && file.type.startsWith("image/")) {
      await loadPhotoFromFile(file, zoneId);
      return;
    }
  }

  if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          await loadPhotoFromFile(file, zoneId);
          return;
        }
      }
    }
  }

  const html = dt.getData("text/html");
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      const src = match[1];
      if (src.startsWith("data:image")) {
        showPhotoPreview(src, zoneId);
        return;
      } else if (src.startsWith("http")) {
        await loadPhotoFromUrl(src, zoneId);
        return;
      }
    }
  }

  const url = dt.getData("text/uri-list") || dt.getData("text/plain");
  if (url) {
    const trimmed = url.trim();
    if (trimmed.startsWith("http") && /\.(jpg|jpeg|png|gif|webp|bmp)/i.test(trimmed)) {
      await loadPhotoFromUrl(trimmed, zoneId);
      return;
    }
  }

  if (typeof showToast === "function") {
    showToast("❌ Расм топилмади. Файлни танланг.", "warning");
  }
}

async function loadPhotoFromFile(file, zoneId) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      showPhotoPreview(ev.target.result, zoneId);
      resolve();
    };
    reader.onerror = () => {
      if (typeof showToast === "function") showToast("❌ Файлни ўқишда хато", "error");
      resolve();
    };
    reader.readAsDataURL(file);
  });
}

async function loadPhotoFromUrl(url, zoneId) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      throw new Error("Расм эмас");
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        showPhotoPreview(ev.target.result, zoneId);
        resolve();
      };
      reader.onerror = () => {
        if (typeof showToast === "function") showToast("❌ Расмни ўқишда хато", "error");
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("URL load error:", e);
    if (typeof showToast === "function") {
      showToast("❌ Расмни юклаб бўлмади (CORS). Файлни танланг.", "warning");
    }
  }
}

function showPhotoPreview(dataUrl, zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  if (zoneId === "editCandPhotoDropZone") {
    currentEditPhotoDataUrl = dataUrl;
  } else {
    currentPhotoDataUrl = dataUrl;
  }

  zone.classList.add("has-photo");

  const contentArea = zone.querySelector(".drop-zone-content");
  const previewImg = zone.querySelector(".drop-zone-preview");
  const clearBtn = zone.querySelector(".drop-zone-clear");

  if (contentArea) contentArea.classList.add("hidden");
  if (previewImg) {
    previewImg.src = dataUrl;
    previewImg.classList.remove("hidden");
  }
  if (clearBtn) clearBtn.classList.remove("hidden");

  if (typeof showToast === "function") {
    showToast("✅ Расм юкланди", "success");
  }
}

function clearPhoto(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  if (zoneId === "editCandPhotoDropZone") {
    currentEditPhotoDataUrl = null;
  } else {
    currentPhotoDataUrl = null;
  }

  zone.classList.remove("has-photo", "drag-over");

  const contentArea = zone.querySelector(".drop-zone-content");
  const previewImg = zone.querySelector(".drop-zone-preview");
  const clearBtn = zone.querySelector(".drop-zone-clear");

  if (contentArea) contentArea.classList.remove("hidden");
  if (previewImg) {
    previewImg.src = "";
    previewImg.classList.add("hidden");
  }
  if (clearBtn) clearBtn.classList.add("hidden");
}

function triggerPhotoFileSelect(zoneId) {
  const inputId = zoneId === "editCandPhotoDropZone" ? "editCandPhotoFile" : "inpPhotoFile";
  const input = document.getElementById(inputId);
  if (input) input.click();
}

async function handlePhotoFileInput(e, zoneId) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    if (typeof showToast === "function") showToast("❌ Фақат расм файллари", "warning");
    return;
  }
  await loadPhotoFromFile(file, zoneId);
  e.target.value = "";
}

function setupPhotoPasteListener() {
  document.addEventListener("paste", (e) => {
    const editModal = document.getElementById("editCandidateModal");
    const editModalOpen = editModal && !editModal.classList.contains("hidden");

    const candidateForm = document.getElementById("candidateForm");
    const formVisible = candidateForm && candidateForm.offsetParent !== null;

    if (!editModalOpen && !formVisible) return;

    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const targetZone = editModalOpen ? "editCandPhotoDropZone" : "inpPhotoDropZone";
          loadPhotoFromFile(file, targetZone);
          e.preventDefault();
          return;
        }
      }
    }
  });
}

// =========================================================================
// 5. АҚЛЛИ САРЛАВҲА
// =========================================================================

function getOrganizationFromCategory(category) {
  if (!category) return "Кадастр агентлиги";
  if (category.includes("ДКП")) return "Давлат кадастрлари палатаси";
  return "Кадастр агентлиги";
}

function getPositionFromCategory(category) {
  if (!category) return "";
  if (category.includes("КА туман")) return "бўлими бошлиғи";
  if (category.includes("ДКП туман")) return "филиали раҳбари";
  if (category.includes("КА ҳудудий")) return "бошлиғи";
  if (category.includes("ДКП ҳудудий")) return "бошлиғи";
  if (category.includes("КА марказий")) return "ходими";
  if (category.includes("ДКП марказий")) return "ходими";
  if (category.includes("Комплаенс")) return "комплаенс ходими";
  if (category.includes("Собиқ")) return "собиқ ходими бўйича";
  return "";
}

function buildDistrictHeading(region, district, category) {
  region = cleanText(region);
  district = cleanText(district);

  // ============ СОБИҚ ХОДИМЛАР ============
  if (category && category.includes("Собиқ")) {
    if (region === "Кадастр агентлиги") {
      return "Кадастр агентлиги собиқ ходими бўйича";
    }
    if (region === "Давлат кадастрлари палатаси") {
      return "Давлат кадастрлари палатаси собиқ ходими бўйича";
    }
    if (region === "Тизим ташкилотлари") {
      return district
        ? cleanText(`Тизим ташкилоти ${district} собиқ ходими бўйича`)
        : "Тизим ташкилоти собиқ ходими бўйича";
    }
    const org = getOrganizationFromCategory(category);
    return cleanText(`${org} ${region || ""} собиқ ходими бўйича`);
  }

  // ============ КАДАСТР АГЕНТЛИГИ (марказий) ============
  if (region === "Кадастр агентлиги") {
    if (category && category.includes("Комплаенс")) {
      return "Кадастр агентлиги комплаенс ходими лавозимига";
    }
    if (category && category.includes("КА марказий")) {
      return "Кадастр агентлиги ходими лавозимига";
    }
    if (category && category.includes("КА ҳудудий")) {
      return "Кадастр агентлиги ҳудудий бошқармаси бошлиғи лавозимига";
    }
    return "Кадастр агентлиги ходими лавозимига";
  }

  // ============ ДАВЛАТ КАДАСТРЛАРИ ПАЛАТАСИ (марказий) ============
  if (region === "Давлат кадастрлари палатаси") {
    if (category && category.includes("Комплаенс")) {
      return "Давлат кадастрлари палатаси комплаенс ходими лавозимига";
    }
    if (category && category.includes("ДКП марказий")) {
      return "Давлат кадастрлари палатаси ходими лавозимига";
    }
    if (category && category.includes("ДКП ҳудудий")) {
      return "Давлат кадастрлари палатаси ҳудудий бошқармаси бошлиғи лавозимига";
    }
    return "Давлат кадастрлари палатаси ходими лавозимига";
  }

  // ============ ТИЗИМ ТАШКИЛОТЛАРИ ============
  if (region === "Тизим ташкилотлари") {
    if (district) {
      return cleanText(`Тизим ташкилоти ${district} лавозимига`);
    }
    return "Тизим ташкилоти ходими лавозимига";
  }

  // ============ СТАНДАРТ ҲУДУДЛАР (14 та вилоят/шаҳар) ============
  const org = getOrganizationFromCategory(category);
  const regionPart = region ? `${org} ${region} бошқармаси` : org;
  const posFromCategory = getPositionFromCategory(category);

  const districtCyr = latToCyr(district);

  if (!districtCyr) {
    if (posFromCategory) {
      return cleanText(`${regionPart} ${posFromCategory} лавозимига`);
    }
    return cleanText(`${regionPart} лавозимига`);
  }

  const positionWords = /бўлими|бўлим|бошлиғи|бошлиқ|филиали|филиал|раҳбари|раҳбар|мутахассиси|мутахассис|ходими|ходим|аппарати/i;
  const hasPosition = positionWords.test(districtCyr);

  if (hasPosition) {
    return cleanText(`${regionPart} ${districtCyr} лавозимига`);
  } else {
    if (posFromCategory) {
      return cleanText(`${regionPart} ${districtCyr} ${posFromCategory} лавозимига`);
    }
    return cleanText(`${regionPart} ${districtCyr} лавозимига`);
  }
}

function updateHeadingPreview() {
  const region = document.getElementById("inpRegion")?.value || "";
  const category = document.getElementById("inpCategory")?.value || "";
  const district = document.getElementById("inpDistrict")?.value.trim() || "";

  // 🆕 Туман майдонини динамик созлаш
  const districtInput = document.getElementById("inpDistrict");
  const districtLabel = document.getElementById("inpDistrictLabel");

  if (districtInput) {
    if (region === "Кадастр агентлиги" || region === "Давлат кадастрлари палатаси") {
      // Марказий — туман керак эмас
      districtInput.placeholder = "Керак эмас";
      districtInput.disabled = true;
      districtInput.value = "";
      districtInput.classList.add("bg-slate-100", "cursor-not-allowed");
      if (districtLabel) districtLabel.textContent = "4. Туман / шаҳар (керак эмас)";
    } else if (region === "Тизим ташкилотлари") {
      // Тизим — ташкилот номи
      districtInput.placeholder = 'Масалан: "Kadastr IT" МЧЖ';
      districtInput.disabled = false;
      districtInput.classList.remove("bg-slate-100", "cursor-not-allowed");
      if (districtLabel) districtLabel.textContent = "4. Ташкилот номи *";
    } else {
      // Стандарт ҳудуд
      districtInput.placeholder = "Дўстлик тумани бўлими";
      districtInput.disabled = false;
      districtInput.classList.remove("bg-slate-100", "cursor-not-allowed");
      if (districtLabel) districtLabel.textContent = "4. Туман / шаҳар (қисқа) *";
    }
  }

  const heading = buildDistrictHeading(region, district, category);

  const field = document.getElementById("inpDistrictHeading");
  if (field) {
    if (field.dataset.manualEdited === "true") return;
    field.value = heading;
  }
}

function setupHeadingFieldTracking() {
  const field = document.getElementById("inpDistrictHeading");
  if (!field) return;

  field.addEventListener("input", () => {
    if (!field.dataset.tracking) {
      field.dataset.tracking = "1";
      field.dataset.manualEdited = "true";
    }
  });

  ["inpRegion", "inpCategory", "inpDistrict"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        field.dataset.manualEdited = "false";
        field.dataset.tracking = "";
        updateHeadingPreview();
      });
      el.addEventListener("input", () => {
        if (el.id === "inpDistrict") {
          if (field.dataset.manualEdited !== "true") {
            updateHeadingPreview();
          }
        }
      });
    }
  });

  setupPhotoPasteListener();
}

function getFinalHeading() {
  const manual = document.getElementById("inpDistrictHeading")?.value.trim() || "";
  if (manual) return manual;

  const region = document.getElementById("inpRegion")?.value || "";
  const category = document.getElementById("inpCategory")?.value || "";
  const district = document.getElementById("inpDistrict")?.value.trim() || "";
  return buildDistrictHeading(region, district, category);
}

// =========================================================================
// 6. ВАЛИДАЦИЯ
// =========================================================================

function validateDate(dateStr, fieldName) {
  if (!dateStr) return `${fieldName} бўш`;
  const digits = dateStr.replace(/\D/g, "");
  if (digits.length < 8) return `${fieldName} тўлиқ эмас (кк.оо.йййй)`;

  const dd = parseInt(digits.substring(0, 2));
  const mm = parseInt(digits.substring(2, 4));
  const yyyy = parseInt(digits.substring(4, 8));

  if (dd < 1 || dd > 31) return `${fieldName}: кун 01-31`;
  if (mm < 1 || mm > 12) return `${fieldName}: ОЙ 01-12 бўлиши керак! (Киритилди: ${mm})`;
  if (yyyy < 1900 || yyyy > 2030) return `${fieldName}: йил 1900-2030`;

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dd > daysInMonth[mm - 1]) return `${fieldName}: бу ойда ${daysInMonth[mm - 1]} кун`;

  return null;
}

function validateFIO(fio) {
  if (!fio || fio.length < 3) return "Ф.И.Ш. жуда қисқа";
  if (/^\d+$/.test(fio)) return "Ф.И.Ш. фақат рақамлардан иборат бўлмаслиги керак";
  if (fio.length > 100) return "Ф.И.Ш. жуда узун";
  return null;
}

function validateCurrentJob(job) {
  if (!job || job.length < 5) return "Лавозим жуда қисқа";
  if (/^\d+$/.test(job)) return "Лавозим фақат рақамлардан иборат бўлмаслиги керак";
  return null;
}

function validateCandidateForm() {
  const errors = [];

  const fio = document.getElementById("inpFio").value.trim();
  const pinfl = document.getElementById("inpPinfl").value.trim();
  const passSeries = document.getElementById("inpPassSeries").value.trim().toUpperCase();
  const passNum = document.getElementById("inpPassNum").value.trim();
  const birthDate = document.getElementById("inpBirthDate").value.trim();
  let jobSince = document.getElementById("inpJobSince").value.trim();   // Фақат йилни олиш   jobSince = jobSince.replace(/\D/g, "").substring(0, 4);
  const currentJob = document.getElementById("inpCurrentJob").value.trim();
  const district = document.getElementById("inpDistrict").value.trim();
  const heading = document.getElementById("inpDistrictHeading")?.value.trim() || "";

  const fioErr = validateFIO(fio);
  if (fioErr) errors.push(fioErr);

  if (pinfl.length !== 14) errors.push("ПИНФЛ 14 та рақам");
  else if (!/^\d{14}$/.test(pinfl)) errors.push("ПИНФЛ фақат рақамлар");

  if (!/^[A-Z]{2}$/.test(passSeries)) errors.push("Паспорт серияси 2 та катта ҳарф (AD, AB)");
  if (!/^\d{7}$/.test(passNum)) errors.push("Паспорт рақами 7 та рақам");

  const bdErr = validateDate(birthDate, "Туғилган сана");
  if (bdErr) errors.push(bdErr);

  const jsErr = validateDate(jobSince, "Иш санаси");
  if (jsErr) errors.push(jsErr);

  const jobErr = validateCurrentJob(currentJob);
  if (jobErr) errors.push(jobErr);

  // 🆕 Марказий аппарат учун туман шарт эмас
  const regionEl = document.getElementById("inpRegion");
  const selectedRegion = regionEl ? regionEl.value : "";

  const noDistrictRegions = ["Кадастр агентлиги", "Давлат кадастрлари палатаси"];

  if (!noDistrictRegions.includes(selectedRegion)) {
    if (!district || district.length < 3) {
      if (selectedRegion === "Тизим ташкилотлари") {
        errors.push("Тизим ташкилоти номи киритилиши шарт");
      } else {
        errors.push("Туман/шаҳар номи киритилиши шарт");
      }
    }
  }

  if (!heading || heading.length < 20) errors.push("Тўлиқ сарлавҳа 20+ белгидан иборат бўлиши керак");

  return errors;
}

// =========================================================================
// 7. PINFL ДУБЛИКАТ
// =========================================================================

function checkPinflDuplicate() {
  const inpPinfl = document.getElementById("inpPinfl");
  const box = document.getElementById("pinflDuplicateBox");
  if (!inpPinfl || !box) return;

  const val = inpPinfl.value.replace(/\D/g, "");
  inpPinfl.value = val;

  if (val.length === 14) {
    const dup = appState.candidates.find(c => c.pinfl === val);
    box.classList.remove("hidden");
    if (dup) {
      box.className = "p-2.5 rounded-lg bg-red-50 border-2 border-red-400 text-red-950 text-xs";
      box.innerHTML = `⚠️ <b>ПИНФЛ ДУБЛИКАТИ:</b> <b>${dup.fio}</b> (${dup.reestrNo})`;
    } else {
      box.className = "p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs";
      box.innerHTML = `✅ <b>ПИНФЛ тоза</b>`;
    }
  } else if (val.length > 0 && val.length < 14) {
    box.classList.remove("hidden");
    box.className = "p-2.5 rounded-lg bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs";
    box.innerHTML = `⚠️ ПИНФЛ: <b>${val.length}</b> / 14`;
  } else {
    box.classList.add("hidden");
  }
}

// =========================================================================
// 8. НОМЗОД ҚЎШИШ
// =========================================================================

function handleCandidateFormSubmit(e) {
  e.preventDefault();

  if (!hasPermission("add_candidate")) {
    alert("Рухсат йўқ!");
    return;
  }

  const errors = validateCandidateForm();
  if (errors.length > 0) {
    alert("⚠️ ХАТОЛАРНИ ТУЗАТИНГ:\n\n• " + errors.join("\n• "));
    return;
  }

  const recordType = document.getElementById("inpRecordType").value;
  const region = document.getElementById("inpRegion").value;
  const category = document.getElementById("inpCategory").value;
  let district = document.getElementById("inpDistrict").value.trim();
  const appointType = document.getElementById("inpAppointType").value;
  const pinfl = document.getElementById("inpPinfl").value.trim();
  const passSeries = document.getElementById("inpPassSeries").value.trim().toUpperCase();
  const passNum = document.getElementById("inpPassNum").value.trim();
  let fio = document.getElementById("inpFio").value.trim();
  const birthDate = document.getElementById("inpBirthDate").value.trim();
  let birthPlace = document.getElementById("inpBirthPlace").value.trim();
  let currentJob = document.getElementById("inpCurrentJob").value.trim();
  const jobSince = document.getElementById("inpJobSince").value.trim();

  // 🆕 Марказий аппарат учун district бўш бўлиши мумкин
  if (region === "Кадастр агентлиги" || region === "Давлат кадастрлари палатаси") {
    district = "";
  }

  fio = cleanText(latToCyr(fio));
  birthPlace = cleanText(latToCyr(birthPlace));
  currentJob = cleanText(latToCyr(currentJob));

  let photoDataUrl = currentPhotoDataUrl;

  if (!photoDataUrl) {
    const parts = fio.split(" ");
    const init = ((parts[0] ? parts[0][0] : "Х") + (parts[1] ? parts[1][0] : "А")).toUpperCase();
    photoDataUrl = makeAvatarSvg(init, "#4a6fa5");
  }

  const now = getNow();
  const num = String(appState.candidates.length + 1).padStart(2, "0");
  const prefix = recordType === "former" ? "ККБ-СХ-" : "ККБ-";
  const reestrNo = `${prefix}${now.year}/${now.month}-${num}`;

  const districtHeading = getFinalHeading();

  const newCand = {
    id: "CAND-" + Date.now(),
    reestrNo: reestrNo,
    createdAt: now.date,
    createdTime: now.time,
    createdBy: currentUser?.login || "unknown",
    createdByName: currentUser?.name || "",
    year: now.year,
    month: now.month,
    recordType,
    region,
    category,
    districtHeading,
    appointType,
    fio,
    birthDate,
    birthPlace,
    passSeries,
    passNum,
    pinfl,
    currentJob,
    jobSince,
    photo: photoDataUrl,
    itsChecked: false,
    sudlanganStatus: "clean",
    sudlanganText: "муқаддам судланмаган",
    workflowStage: "admin_review",
    eduText: "миллати ўзбек, оилали, маълумоти олий.",
    para2: "Номзод анъанавий ислом динига эътиқод қилади, намоз амалларини бажармайди, диний амалларни умумэътироф этилган меъёрларини бажаради (ҳайит, хатм, худоий, жанозаларда қатнашади), динга мутаассибларча эътиқод қилиши кузатилмаган, турли ДЭО ва бошқа қўпорувчи кучларга алоқадорлиги ва уларни ғояларини қўллаб-қувватлаши қайд этилмаган.",
    para3: "Иш жойидан ижобий томондан тавсифланиб, қораловчи ёки обрўсизлантирувчи маълумотлар олинмади.\nХусусан, номзод ўзига юклатилган функционал мажбуриятларни бажаришда коррупцион ҳаракатлари кузатилмаган, унга нисбатан шу мазмунда ариза ва шикоятлар келиб тушмаган.",
    para4: "Номзод берилган топшириқларни ўз вақтида бажаришга ҳаракат қилади, ўз устида ишловчи, камтарин ходим сифатида меҳнат жамоасида ҳурматга эга.\nМутахассис сифатида етарли малака ва тажрибага эга, фуқаролар билан муносабатда муомала маданиятига риоя этади, ўзгаларни тинглашни ва ҳурмат қилишни билади, ўз фикрини етказа олади.",
    korrupsiyaViewedAt: "",
    sentToBossAt: "",
    sentToBossTime: "",
    sentToBossBy: "",
    sentToBossByName: "",
    bossViewedAt: "",
    bossApprovedAt: "",
    bossApprovedBy: "",
    bossReturnedAt: "",
    bossReturnReason: "",
    approvedDate: "",
    lastEditedAt: "",
    lastEditedBy: "",
    editHistory: []
  };

  appState.candidates.unshift(newCand);

  if (typeof logCandidateAdded === "function") logCandidateAdded(newCand);

  if (typeof addNotification === "function") {
    addNotification({
      type: "new_candidate",
      candidateId: newCand.id,
      candidateName: newCand.fio,
      message: "🆕 Янги ходим киритилди",
      detail: `${newCand.region} | ${newCand.category}`,
      forRoles: [ROLES.KORRUPSIYA, ROLES.RAHBAR]
    });
  }

  saveState();
  renderAll();

  e.target.reset();

  currentPhotoDataUrl = null;
  clearPhoto("inpPhotoDropZone");

  const headingField = document.getElementById("inpDistrictHeading");
  if (headingField) {
    headingField.value = "";
    headingField.dataset.manualEdited = "false";
    headingField.dataset.tracking = "";
  }

  document.getElementById("pinflDuplicateBox").classList.add("hidden");

  if (recordType === "former") switchTab("former");
  else if (currentRole === ROLES.KORRUPSIYA && typeof switchSubTab === "function") switchSubTab("new");

  showToast(`✅ Номзод қўшилди! (${reestrNo})`, "success");
}

// =========================================================================
// 9. ТАҲРИРЛАШ
// =========================================================================

function editCandidate(id) {
  if (!hasPermission("edit_candidate")) { alert("Рухсат йўқ!"); return; }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;

  activeCandidateId = id;

  setValueIfExists("editCandFio", c.fio);
  setValueIfExists("editCandPinfl", c.pinfl);
  setValueIfExists("editCandPassSeries", c.passSeries);
  setValueIfExists("editCandPassNum", c.passNum);
  setValueIfExists("editCandBirthDate", c.birthDate);
  setValueIfExists("editCandBirthPlace", c.birthPlace);
  setValueIfExists("editCandCurrentJob", c.currentJob);
  setValueIfExists("editCandJobSince", c.jobSince);
  setValueIfExists("editCandDistrict", c.districtHeading);

  const regionSel = document.getElementById("editCandRegion");
  if (regionSel) regionSel.value = c.region;

  const catSel = document.getElementById("editCandCategory");
  if (catSel) catSel.value = c.category;

  const appSel = document.getElementById("editCandAppointType");
  if (appSel) appSel.value = c.appointType;

  currentEditPhotoDataUrl = c.photo || null;
  const photoZone = document.getElementById("editCandPhotoDropZone");
  if (photoZone && c.photo) {
    const contentArea = photoZone.querySelector(".drop-zone-content");
    const previewImg = photoZone.querySelector(".drop-zone-preview");
    const clearBtn = photoZone.querySelector(".drop-zone-clear");

    if (contentArea) contentArea.classList.add("hidden");
    if (previewImg) { previewImg.src = c.photo; previewImg.classList.remove("hidden"); }
    if (clearBtn) clearBtn.classList.remove("hidden");
    photoZone.classList.add("has-photo");
  } else if (photoZone) {
    clearPhoto("editCandPhotoDropZone");
    currentEditPhotoDataUrl = c.photo || null;
  }

  const histEl = document.getElementById("editHistoryBlock");
  if (histEl) {
    if (c.editHistory && c.editHistory.length > 0) {
      histEl.classList.remove("hidden");
      histEl.innerHTML = `
        <div class="text-xs font-bold text-slate-700 mb-1">📋 Таҳрир тарихи (${c.editHistory.length}):</div>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          ${c.editHistory.slice().reverse().map(h => `
            <div class="text-[10px] p-1.5 rounded bg-amber-50 border border-amber-200">
              <b>${h.at}</b> — ${h.by}<br/>
              <span class="text-slate-700">${h.field}: "${h.oldValue}" → "${h.newValue}"</span>
            </div>
          `).join("")}
        </div>
      `;
    } else histEl.classList.add("hidden");
  }

  const modal = document.getElementById("editCandidateModal");
  if (modal) modal.classList.remove("hidden");
}

function setValueIfExists(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

function saveEditedCandidate() {
  if (!hasPermission("edit_candidate")) { alert("Рухсат йўқ!"); return; }
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;

  let newFio = document.getElementById("editCandFio").value.trim();
  const newPinfl = document.getElementById("editCandPinfl").value.trim();
  const newPassSeries = document.getElementById("editCandPassSeries").value.trim().toUpperCase();
  const newPassNum = document.getElementById("editCandPassNum").value.trim();
  const newBirthDate = document.getElementById("editCandBirthDate").value.trim();
  let newBirthPlace = document.getElementById("editCandBirthPlace").value.trim();
  let newCurrentJob = document.getElementById("editCandCurrentJob").value.trim();
  const newJobSince = document.getElementById("editCandJobSince").value.trim();
  const newDistrict = document.getElementById("editCandDistrict").value.trim();
  const newRegion = document.getElementById("editCandRegion").value;
  const newCategory = document.getElementById("editCandCategory").value;
  const newAppointType = document.getElementById("editCandAppointType").value;

  newFio = cleanText(latToCyr(newFio));
  newBirthPlace = cleanText(latToCyr(newBirthPlace));
  newCurrentJob = cleanText(latToCyr(newCurrentJob));

  const fioErr = validateFIO(newFio);
  if (fioErr) { alert(fioErr); return; }
  if (!/^\d{14}$/.test(newPinfl)) { alert("ПИНФЛ 14 рақам!"); return; }
  if (!/^[A-Z]{2}$/.test(newPassSeries)) { alert("Паспорт серияси 2 та катта ҳарф!"); return; }
  if (!/^\d{7}$/.test(newPassNum)) { alert("Паспорт рақами 7 та рақам!"); return; }

  const bdErr = validateDate(newBirthDate, "Туғилган сана");
  if (bdErr) { alert(bdErr); return; }
  const jsErr = validateDate(newJobSince, "Иш санаси");
  if (jsErr) { alert(jsErr); return; }
  const jobErr = validateCurrentJob(newCurrentJob);
  if (jobErr) { alert(jobErr); return; }

  const dup = appState.candidates.find(x => x.pinfl === newPinfl && x.id !== c.id);
  if (dup) { alert(`⚠️ ПИНФЛ бошқа номзодда: ${dup.fio}`); return; }

  const changes = [];
  const now = getNow();
  const editor = currentUser?.login || "unknown";
  const editorName = currentUser?.name || "";

  const fieldsToCheck = [
    { field: "Ф.И.Ш.", old: c.fio, new: newFio },
    { field: "ПИНФЛ", old: c.pinfl, new: newPinfl },
    { field: "Паспорт серия", old: c.passSeries, new: newPassSeries },
    { field: "Паспорт рақам", old: c.passNum, new: newPassNum },
    { field: "Туғилган сана", old: c.birthDate, new: newBirthDate },
    { field: "Туғилган жой", old: c.birthPlace, new: newBirthPlace },
    { field: "Лавозим", old: c.currentJob, new: newCurrentJob },
    { field: "Иш санаси", old: c.jobSince, new: newJobSince },
    { field: "Ҳудуд", old: c.region, new: newRegion },
    { field: "Йўналиш", old: c.category, new: newCategory },
    { field: "Сарлавҳа", old: c.districtHeading, new: newDistrict }
  ];

  fieldsToCheck.forEach(f => {
    if (f.old !== f.new) {
      changes.push({
        at: now.dateTime, by: `${editorName} (${editor})`,
        field: f.field, oldValue: f.old || "", newValue: f.new || ""
      });
    }
  });

  if (currentEditPhotoDataUrl && currentEditPhotoDataUrl !== c.photo) {
    changes.push({
      at: now.dateTime, by: `${editorName} (${editor})`,
      field: "Расм", oldValue: "[эски]", newValue: "[янги]"
    });
  }

  if (changes.length === 0) { alert("Ўзгариш йўқ."); return; }

  c.fio = newFio;
  c.pinfl = newPinfl;
  c.passSeries = newPassSeries;
  c.passNum = newPassNum;
  c.birthDate = newBirthDate;
  c.birthPlace = newBirthPlace;
  c.currentJob = newCurrentJob;
  c.jobSince = newJobSince;
  c.region = newRegion;
  c.category = newCategory;
  c.appointType = newAppointType;
  c.districtHeading = newDistrict;

  if (currentEditPhotoDataUrl) {
    c.photo = currentEditPhotoDataUrl;
  }

  if (!Array.isArray(c.editHistory)) c.editHistory = [];
  c.editHistory = c.editHistory.concat(changes);
  c.lastEditedAt = now.dateTime;
  c.lastEditedBy = editor;

  if (typeof addAuditLog === "function") {
    addAuditLog("CANDIDATE_EDITED", `${c.id} | ${c.fio} | ${changes.map(ch => ch.field).join(", ")}`);
  }

  saveState();
  renderAll();
  closeEditCandidateModal();
  showToast(`✅ Таҳрир сақланди (${changes.length} та)`, "success");
}

function closeEditCandidateModal() {
  const modal = document.getElementById("editCandidateModal");
  if (modal) modal.classList.add("hidden");
  activeCandidateId = null;
  currentEditPhotoDataUrl = null;
}

// =========================================================================
// 10. ЎЧИРИШ
// =========================================================================

function confirmDeleteCandidate(id) {
  if (!hasPermission("delete_candidate")) { alert("Рухсат йўқ!"); return; }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`⚠️ «${c.fio}» ЎЧИРИЛСИНМИ?`)) return;
  if (!confirm(`❌ ЯНА БИР МАРТА ТАСДИҚЛАНГ!`)) return;

  if (typeof addAuditLog === "function") addAuditLog("CANDIDATE_DELETED", `${c.id} | ${c.fio}`);

  const idx = appState.candidates.findIndex(x => x.id === id);
  if (idx !== -1) appState.candidates.splice(idx, 1);

  saveState();
  renderAll();
  showToast(`🗑 «${c.fio}» ўчирилди`, "warning");
}

// =========================================================================
// 11. ИЦ + БОШЛИҚҚА ЮБОРИШ
// =========================================================================

function quickSaveItsRow(id, notify = false) {
  if (!hasPermission("edit_its")) { alert("Рухсат йўқ!"); return; }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;

  const selEl = document.getElementById(`itsSel_${id}`);
  const txtEl = document.getElementById(`itsTxt_${id}`);
  if (!selEl || !txtEl) return;

  const sel = selEl.value;
  const txt = txtEl.value.trim();

  c.sudlanganStatus = sel;
  c.itsChecked = true;
  if (sel === "clean") c.sudlanganText = txt || "муқаддам судланмаган";
  else c.sudlanganText = txt.includes("судланган") ? txt : `муқаддам судланган (${txt || "ЖК моддаси аниқланди"})`;

  if (typeof logITSChecked === "function") logITSChecked(c, sel, c.sudlanganText);

  saveState();
  renderAll();
  if (notify) showToast(`✅ ${c.fio} — ИЦ сақланди`, "success");
}

function bulkSendCleanToBoss() {
  if (!hasPermission("send_to_boss")) { alert("Рухсат йўқ!"); return; }
  let count = 0;
  appState.candidates.forEach(c => {
    if (c.workflowStage === "admin_review" && c.sudlanganStatus === "clean" && c.itsChecked) {
      if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи");
      c.workflowStage = "boss_review";
      count++;
    }
  });
  if (count === 0) { showToast("Тоза чиққан номзод йўқ", "warning"); return; }
  saveState();
  renderAll();
  showToast(`📤 ${count} нафар юборилди`, "success");
}

// =========================================================================
// 12. ФОЙДАЛАНУВЧИ
// =========================================================================

function deleteUser(idx) {
  if (!hasPermission("delete_user")) { alert("Рухсат йўқ!"); return; }
  const u = appState.users[idx];
  if (!u) return;
  if (u.login === "admin") { alert("Асосий админ ўчирилмайди!"); return; }
  if (!confirm(`«${u.name}» ўчирилсинми?`)) return;
  if (typeof addAuditLog === "function") addAuditLog("USER_DELETE", `${u.login}`);
  appState.users.splice(idx, 1);
  saveState();
  renderUsersTable();
  showToast(`🗑 ${u.name} ўчирилди`, "warning");
}

async function handleUserCreateSubmit(e) {
  e.preventDefault();
  if (!hasPermission("create_user")) { alert("Рухсат йўқ!"); return; }

  const name = document.getElementById("newUserName").value.trim();
  const role = document.getElementById("newUserRole").value;
  const login = document.getElementById("newUserLogin").value.trim();
  const pass = document.getElementById("newUserPass").value.trim();

  if (!name || !login || !pass) { alert("Барча майдонларни тўлдиринг!"); return; }
  if (appState.users.some(u => u.login === login)) { alert("Логин банд!"); return; }
  if (pass.length < 6) { alert("Парол 6+ белги!"); return; }

  const passHash = await hashPassword(pass);
  if (!passHash) { alert("Хешлаш хато!"); return; }

  appState.users.push({ login, passHash, name, role });
  if (typeof addAuditLog === "function") addAuditLog("USER_CREATE", `${login} (${role})`);
  saveState();
  renderUsersTable();
  e.target.reset();
  showToast(`✅ ${login} яратилди`, "success");
}

console.log("✅ 08-candidates.js юкланди (v10.3 — Central Office тўғри ишлайди)");
