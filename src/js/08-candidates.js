// =========================================================================
// 08-CANDIDATES.JS — Номзодлар CRUD
// «КОМПЛАЕНС-КАДР» v10.0 — Ақлли сарлавҳа + Қўлда тузатиш
// =========================================================================

// =========================================================================
// 1. ЛОТИН → КИРИЛЛ
// =========================================================================

function latToCyr(text) {
  if (!text) return text;

  // Агар матнда 50%+ кирилл бўлса — тегишмаймиз
  const cyrCount = (text.match(/[А-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length;
  const allLetters = (text.match(/[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/g) || []).length;
  if (cyrCount > allLetters / 2) return text;

  let r = text;

  // Диграфлар
  r = r.replace(/sh/gi, m => m[0] === "S" ? "Ш" : "ш");
  r = r.replace(/ch/gi, m => m[0] === "C" ? "Ч" : "ч");
  r = r.replace(/yo/gi, m => m[0] === "Y" ? "Ё" : "ё");
  r = r.replace(/yu/gi, m => m[0] === "Y" ? "Ю" : "ю");
  r = r.replace(/ya/gi, m => m[0] === "Y" ? "Я" : "я");
  r = r.replace(/ts/gi, m => m[0] === "T" ? "Ц" : "ц");

  // O', G'
  r = r.replace(/[oO]['ʻ`‘’ʼ]/g, m => m[0] === "O" ? "Ў" : "ў");
  r = r.replace(/[gG]['ʻ`‘’ʼ]/g, m => m[0] === "G" ? "Ғ" : "ғ");

  // Оддий ҳарфлар
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
// 2. ТАШКИЛОТ ВА ЛАВОЗИМНИ АНИҚЛАШ
// =========================================================================

// Категориядан ташкилотни олиш
function getOrganizationFromCategory(category) {
  if (!category) return "Кадастр агентлиги";

  // ДКП (Давлат кадастрлари палатаси)
  if (category.includes("ДКП")) {
    return "Давлат кадастрлари палатаси";
  }

  // КА ва бошқалар (Кадастр агентлиги)
  return "Кадастр агентлиги";
}

// Категориядан лавозимни олиш
function getPositionFromCategory(category) {
  if (!category) return "";

  if (category.includes("КА туман")) return "бўлими бошлиғи";
  if (category.includes("ДКП туман")) return "филиали раҳбари";
  if (category.includes("КА ҳудудий")) return "бошлиғи";
  if (category.includes("ДКП ҳудудий")) return "бошлиғи";
  if (category.includes("КА марказий")) return "Марказий аппарати ходими";
  if (category.includes("ДКП марказий")) return "Марказий аппарати ходими";
  if (category.includes("Комплаенс")) return "комплаенс ходими";
  if (category.includes("Собиқ")) return "собиқ ходими бўйича";

  return "";
}

// =========================================================================
// 3. АҚЛЛИ САРЛАВҲА ЯСАШ
// =========================================================================

function buildDistrictHeading(region, district, category) {
  // Собиқ ходимлар — махсус
  if (category && category.includes("Собиқ")) {
    const org = getOrganizationFromCategory(category);
    return `${org} ${region || ""} собиқ ходими бўйича`.trim();
  }

  // Ташкилот
  const org = getOrganizationFromCategory(category);

  // Ҳудуд қисми
  const regionPart = region ? `${org} ${region} бошқармаси` : org;

  // Лавозим (category дан)
  const posFromCategory = getPositionFromCategory(category);

  // District
  let cleanDistrict = (district || "").trim();
  cleanDistrict = latToCyr(cleanDistrict);

  // Агар district бўш бўлса — фақат ҳудуд + лавозим
  if (!cleanDistrict) {
    if (posFromCategory) {
      return `${regionPart} ${posFromCategory} лавозимига`;
    }
    return `${regionPart} лавозимига`;
  }

  // District да аллақачон лавозим сўзи борми?
  const positionWords = /бўлими|бўлим|бошлиғи|бошлиқ|филиали|филиал|раҳбари|раҳбар|мутахассиси|мутахассис|ходими|ходим|аппарати/i;
  const hasPosition = positionWords.test(cleanDistrict);

  if (hasPosition) {
    // District да лавозим бор
    return `${regionPart} ${cleanDistrict} лавозимига`;
  } else {
    // District да лавозим йўқ — category дан қўшамиз
    if (posFromCategory) {
      return `${regionPart} ${cleanDistrict} ${posFromCategory} лавозимига`;
    }
    return `${regionPart} ${cleanDistrict} лавозимига`;
  }
}

// =========================================================================
// 4. САРЛАВҲА ПРЕВЬЮСИ (реал-тайм)
// =========================================================================

function updateHeadingPreview() {
  const region = document.getElementById("inpRegion")?.value || "";
  const category = document.getElementById("inpCategory")?.value || "";
  const district = document.getElementById("inpDistrict")?.value.trim() || "";

  const heading = buildDistrictHeading(region, district, category);

  const field = document.getElementById("inpDistrictHeading");
  if (field) {
    // Агар фойдаланувчи қўлда таҳрирлаган бўлса — автоматик ўчирилади
    if (field.dataset.manualEdited === "true") {
      console.log("⏸ Қўлда таҳрирланган — автоматик янгилаш ўчирилди");
      return;
    }
    field.value = heading;
  }
}

function setupHeadingFieldTracking() {
  const field = document.getElementById("inpDistrictHeading");
  if (!field) return;

  // Фойдаланувчи қўлда ёзса — белгилаш
  field.addEventListener("input", () => {
    if (!field.dataset.tracking) {
      field.dataset.tracking = "1";
      field.dataset.manualEdited = "true";
    }
  });

  // Region/Category ўзгарганда — таҳрир ҳолатини тозалаш
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
// 5. ВАЛИДАЦИЯ
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
  const jobSince = document.getElementById("inpJobSince").value.trim();
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

  if (!district || district.length < 3) errors.push("Туман/шаҳар номи киритилиши шарт");
  if (!heading || heading.length < 20) errors.push("Тўлиқ сарлавҳа 20+ белгидан иборат бўлиши керак");

  return errors;
}

// =========================================================================
// 6. PINFL ДУБЛИКАТ
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
// 7. НОМЗОД ҚЎШИШ
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
  const district = document.getElementById("inpDistrict").value.trim();
  const appointType = document.getElementById("inpAppointType").value;
  const pinfl = document.getElementById("inpPinfl").value.trim();
  const passSeries = document.getElementById("inpPassSeries").value.trim().toUpperCase();
  const passNum = document.getElementById("inpPassNum").value.trim();
  let fio = document.getElementById("inpFio").value.trim();
  const birthDate = document.getElementById("inpBirthDate").value.trim();
  let birthPlace = document.getElementById("inpBirthPlace").value.trim();
  let currentJob = document.getElementById("inpCurrentJob").value.trim();
  const jobSince = document.getElementById("inpJobSince").value.trim();
  const fileInput = document.getElementById("inpPhotoFile");

  // 🆕 Автоконвертация
  fio = latToCyr(fio);
  birthPlace = latToCyr(birthPlace);
  currentJob = latToCyr(currentJob);

  const finishCreate = (photoDataUrl) => {
    const now = getNow();
    const num = String(appState.candidates.length + 1).padStart(2, "0");
    const prefix = recordType === "former" ? "ККБ-СХ-" : "ККБ-";
    const reestrNo = `${prefix}${now.year}/${now.month}-${num}`;

    // 🆕 ЯКУНИЙ САРЛАВҲА
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

    // Формани тозалаш
    e.target.reset();

    // Превьюни тозалаш
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
  };

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = ev => finishCreate(ev.target.result);
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    const parts = fio.split(" ");
    const init = ((parts[0] ? parts[0][0] : "Х") + (parts[1] ? parts[1][0] : "А")).toUpperCase();
    finishCreate(makeAvatarSvg(init, "#4a6fa5"));
  }
}

// =========================================================================
// 8. ТАҲРИРЛАШ
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

  // Автоконвертация
  newFio = latToCyr(newFio);
  newBirthPlace = latToCyr(newBirthPlace);
  newCurrentJob = latToCyr(newCurrentJob);

  // Валидация
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
}

// =========================================================================
// 9. ЎЧИРИШ
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
// 10. ИЦ + БОШЛИҚҚА ЮБОРИШ
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
// 11. ФОЙДАЛАНУВЧИ
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

console.log("✅ 08-candidates.js юкланди (v10.0 — Ақлли сарлавҳа + Қўлда тузатиш)");
