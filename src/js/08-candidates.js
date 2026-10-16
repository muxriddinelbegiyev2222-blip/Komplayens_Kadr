// =========================================================================
// 08-CANDIDATES.JS — Номзодлар CRUD (Қўшиш + Таҳрирлаш + Ўчириш)
// «КОМПЛАЕНС-КАДР» v9.1 — Ҳудудга "бошқармаси" автоматик
// =========================================================================

// =========================================================================
// PINFL ДУБЛИКАТ ТЕКШИРУВИ
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
      box.innerHTML = `⚠️ <b>ДИҚҚАТ! ПИНФЛ ДУБЛИКАТИ:</b><br/>
        Ушбу шахс (<b>${dup.fio}</b>) базада мавжуд!<br/>
        Реестр: <b>${dup.reestrNo}</b> (${dup.region})<br/>
        Якуний натижа: <b>${getFinalResultPlainText(dup)}</b>`;
    } else {
      box.className = "p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs";
      box.innerHTML = `✅ <b>ПИНФЛ тоза:</b> Аввал хулоса берилмаган.`;
    }
  } else if (val.length > 0 && val.length < 14) {
    box.classList.remove("hidden");
    box.className = "p-2.5 rounded-lg bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs";
    box.innerHTML = `⚠️ ПИНФЛ <b>${val.length}</b> та рақам — 14 та бўлиши керак.`;
  } else {
    box.classList.add("hidden");
  }
}

// =========================================================================
// 🆕 ҲУДУД НОМИНИ ТЎЛИҚ ҚИЛИШ
// "Жиззах вилояти" → "Кадастр агентлиги Жиззах вилояти бошқармаси"
// =========================================================================

function buildDistrictHeading(region, district, category) {
  if (!region) return "";

  // Ҳудуд турини аниқлаш
  const isRegion = region.includes("вилояти") || region.includes("Республикаси");
  const isCity = region.includes("шаҳри");

  // Асосий ҳудуд номи
  let regionPart = `Кадастр агентлиги ${region}`;

  // Агар вилоят бўлса — "бошқармаси" қўшиш
  if (isRegion) {
    regionPart += " бошқармаси";
  } else if (isCity) {
    regionPart += " шаҳар бошқармаси";
  }

  // Агар district киритилган бўлса — қўшиш
  const districtPart = district ? district.trim() : "";

  // Category дан лавозим номини аниқлаш
  let positionPart = "";
  if (category) {
    if (category.includes("КА туман")) positionPart = "бўлими бошлиғи";
    else if (category.includes("ДКП туман")) positionPart = "филиали раҳбари";
    else if (category.includes("КА ҳудудий")) positionPart = "бошлиғи";
    else if (category.includes("ДКП ҳудудий")) positionPart = "бошлиғи";
    else if (category.includes("КА марказий")) positionPart = "Марказий аппарати ходими";
    else if (category.includes("ДКП марказий")) positionPart = "Марказий аппарати ходими";
    else if (category.includes("Комплаенс")) positionPart = "комплаенс ходими";
  }

  // Тўлиқ сарлавҳа
  if (districtPart) {
    // Агар district да "бошлиғи" ёки "филиали" аллақачон бор бўлса — такрорламаймиз
    const hasPosition = districtPart.includes("бошлиғи") ||
                        districtPart.includes("филиали") ||
                        districtPart.includes("раҳбари");
    if (hasPosition) {
      return `${regionPart} ${districtPart} лавозимига`;
    } else {
      return `${regionPart} ${districtPart} ${positionPart} лавозимига`;
    }
  }

  return `${regionPart} ${positionPart} лавозимига`;
}

// =========================================================================
// ЯНГИ НОМЗОД ҚЎШИШ
// =========================================================================

function handleCandidateFormSubmit(e) {
  e.preventDefault();

  if (!hasPermission("add_candidate")) {
    alert("Рухсат йўқ! Фақат Кадрлар ва Коррупция бўлими номзод қўшади.");
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
  const fio = document.getElementById("inpFio").value.trim();
  const birthDate = document.getElementById("inpBirthDate").value.trim();
  const birthPlace = document.getElementById("inpBirthPlace").value.trim();
  const currentJob = document.getElementById("inpCurrentJob").value.trim();
  const jobSince = document.getElementById("inpJobSince").value.trim();
  const fileInput = document.getElementById("inpPhotoFile");

  if (pinfl.length !== 14) {
    alert("ПИНФЛ аниқ 14 та рақамдан иборат бўлиши шарт!");
    return;
  }
  if (!/^\d{14}$/.test(pinfl)) {
    alert("ПИНФЛ фақат рақамлардан иборат бўлиши керак!");
    return;
  }
  if (!fio || !region || !district || !currentJob) {
    alert("Барча мажбурий майдонларни тўлдиринг!");
    return;
  }
  // Паспорт серияси текшируви
  if (!/^[A-Z]{2}$/.test(passSeries)) {
    alert("Паспорт серияси иккита катта ҳарфдан иборат бўлиши керак! (Масалан: AD, AB)");
    return;
  }

  const finishCreate = (photoDataUrl) => {
    const now = getNow();
    const num = String(appState.candidates.length + 1).padStart(2, "0");
    const prefix = recordType === "former" ? "ККБ-СХ-" : "ККБ-";
    const reestrNo = `${prefix}${now.year}/${now.month}-${num}`;

    // 🆕 Ҳудуд сарлавҳасини тўғри ясаш
    const districtHeading = buildDistrictHeading(region, district, category);

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
      bossReturnedAt: "",
      bossReturnReason: "",
      approvedDate: "",
      lastEditedAt: "",
      lastEditedBy: "",
      editHistory: []
    };

    appState.candidates.unshift(newCand);

    if (typeof logCandidateAdded === "function") {
      logCandidateAdded(newCand);
    }

    // 🔔 Уведомления: фақат Коррупция + Раҳбарга
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
    document.getElementById("pinflDuplicateBox").classList.add("hidden");

    if (recordType === "former") {
      switchTab("former");
    } else if (currentRole === ROLES.KORRUPSIYA && typeof switchSubTab === "function") {
      switchSubTab("new");
    }

    showToast(`✅ Янги номзод қўшилди! (${reestrNo})`, "success");
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
// НОМЗОДНИ ТАҲРИРЛАШ (фақат Коррупция бўлими)
// =========================================================================

function editCandidate(id) {
  if (!hasPermission("edit_candidate")) {
    alert("Рухсат йўқ! Фақат Коррупцияга қарши курашиш бўлими таҳрирлай олади.");
    return;
  }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) {
    alert("Номзод топилмади!");
    return;
  }

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
    } else {
      histEl.classList.add("hidden");
    }
  }

  const modal = document.getElementById("editCandidateModal");
  if (modal) modal.classList.remove("hidden");
}

function setValueIfExists(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

// =========================================================================
// ТАҲРИРНИ САҚЛАШ (🔕 Уведомления ЮБОРИЛМАЙДИ!)
// =========================================================================

function saveEditedCandidate() {
  if (!hasPermission("edit_candidate")) {
    alert("Рухсат йўқ!");
    return;
  }

  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;

  const newFio = document.getElementById("editCandFio").value.trim();
  const newPinfl = document.getElementById("editCandPinfl").value.trim();
  const newPassSeries = document.getElementById("editCandPassSeries").value.trim().toUpperCase();
  const newPassNum = document.getElementById("editCandPassNum").value.trim();
  const newBirthDate = document.getElementById("editCandBirthDate").value.trim();
  const newBirthPlace = document.getElementById("editCandBirthPlace").value.trim();
  const newCurrentJob = document.getElementById("editCandCurrentJob").value.trim();
  const newJobSince = document.getElementById("editCandJobSince").value.trim();
  const newDistrict = document.getElementById("editCandDistrict").value.trim();
  const newRegion = document.getElementById("editCandRegion").value;
  const newCategory = document.getElementById("editCandCategory").value;
  const newAppointType = document.getElementById("editCandAppointType").value;

  if (!newFio || newPinfl.length !== 14) {
    alert("Ф.И.Ш. ва ПИНФЛ (14 рақам) тўғри киритинг!");
    return;
  }
  if (!/^\d{14}$/.test(newPinfl)) {
    alert("ПИНФЛ фақат рақамлардан иборат бўлиши керак!");
    return;
  }

  const dup = appState.candidates.find(x => x.pinfl === newPinfl && x.id !== c.id);
  if (dup) {
    alert(`⚠️ Бу ПИНФЛ бошқа номзодда бор!\n${dup.fio} (${dup.reestrNo})`);
    return;
  }

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
    { field: "Тайинлов", old: c.appointType, new: newAppointType }
  ];

  fieldsToCheck.forEach(f => {
    if (f.old !== f.new) {
      changes.push({
        at: now.dateTime,
        by: `${editorName} (${editor})`,
        field: f.field,
        oldValue: f.old || "",
        newValue: f.new || ""
      });
    }
  });

  if (changes.length === 0) {
    alert("Ҳеч қандай ўзгариш киритилмаган.");
    return;
  }

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

  // 🆕 Ҳудуд сарлавҳасини қайта ясаш
  c.districtHeading = buildDistrictHeading(newRegion, newDistrict, newCategory);

  if (!Array.isArray(c.editHistory)) c.editHistory = [];
  c.editHistory = c.editHistory.concat(changes);
  c.lastEditedAt = now.dateTime;
  c.lastEditedBy = editor;

  // 🔕 Audit log ёзилади (керак), лекин уведомления ЮБОРИЛМАЙДИ
  if (typeof addAuditLog === "function") {
    addAuditLog("CANDIDATE_EDITED", `${c.id} | ${c.fio} | Ўзгаришлар: ${changes.map(ch => ch.field).join(", ")}`);
  }

  saveState();
  renderAll();
  closeEditCandidateModal();
  showToast(`✅ Таҳрир сақланди (${changes.length} та ўзгариш)`, "success");
}

function closeEditCandidateModal() {
  const modal = document.getElementById("editCandidateModal");
  if (modal) modal.classList.add("hidden");
  activeCandidateId = null;
}

// =========================================================================
// НОМЗОДНИ ЎЧИРИШ (🔕 Уведомления ЮБОРИЛМАЙДИ!)
// =========================================================================

function confirmDeleteCandidate(id) {
  if (!hasPermission("delete_candidate")) {
    alert("Рухсат йўқ! Фақат Коррупцияга қарши курашиш бўлими ўчира олади.");
    return;
  }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;

  if (!confirm(`⚠️ ДИҚҚАТ!\n\n«${c.fio}» (${c.reestrNo}) номзодини ЎЧИРМОҚЧИМИСИЗ?\n\nБу амални ортга қайтариб бўлмайди!`)) return;
  if (!confirm(`❌ ЯНА БИР МАРТА ТАСДИҚЛАНГ!\n\n${c.fio}\nРеестр: ${c.reestrNo}\n\nҲақиқатан ўчирилсинми?`)) return;

  // 🔕 Audit log ёзилади, уведомления ЮБОРИЛМАЙДИ
  if (typeof addAuditLog === "function") {
    addAuditLog("CANDIDATE_DELETED", `${c.id} | ${c.fio} | ${c.region} | Ўчирилди`);
  }

  const idx = appState.candidates.findIndex(x => x.id === id);
  if (idx !== -1) appState.candidates.splice(idx, 1);

  saveState();
  renderAll();
  showToast(`🗑 «${c.fio}» ўчирилди`, "warning");
}

// =========================================================================
// ИЦ НАТИЖАСИНИ САҚЛАШ
// =========================================================================

function quickSaveItsRow(id, notify = false) {
  if (!hasPermission("edit_its")) {
    alert("Рухсат йўқ! Фақат Коррупция бўлими ИЦ кирита олади.");
    return;
  }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;

  const selEl = document.getElementById(`itsSel_${id}`);
  const txtEl = document.getElementById(`itsTxt_${id}`);
  if (!selEl || !txtEl) {
    alert("Майдонлар топилмади!");
    return;
  }

  const sel = selEl.value;
  const txt = txtEl.value.trim();

  c.sudlanganStatus = sel;
  c.itsChecked = true;
  if (sel === "clean") {
    c.sudlanganText = txt || "муқаддам судланмаган";
  } else {
    c.sudlanganText = txt.includes("судланган") ? txt : `муқаддам судланган (${txt || "ЖК моддаси аниқланди"})`;
  }

  if (typeof logITSChecked === "function") {
    logITSChecked(c, sel, c.sudlanganText);
  }

  saveState();
  renderAll();
  if (notify) showToast(`✅ ${c.fio} — ИЦ сақланди`, "success");
}

// =========================================================================
// БОШЛИҚҚА ЮБОРИШ
// =========================================================================

function bulkSendCleanToBoss() {
  if (!hasPermission("send_to_boss")) {
    alert("Рухсат йўқ!");
    return;
  }

  let count = 0;
  appState.candidates.forEach(c => {
    if (c.workflowStage === "admin_review" && c.sudlanganStatus === "clean" && c.itsChecked) {
      if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи");
      c.workflowStage = "boss_review";
      count++;
    }
  });

  if (count === 0) {
    showToast("Юбориш учун тоза чиққан номзод йўқ", "warning");
    return;
  }

  saveState();
  renderAll();
  showToast(`📤 ${count} нафар номзод Бўлим бошлиғига юборилди`, "success");
}

// =========================================================================
// ФОЙДАЛАНУВЧИ ЎЧИРИШ (🔕 Уведомления ЮБОРИЛМАЙДИ)
// =========================================================================

function deleteUser(idx) {
  if (!hasPermission("delete_user")) {
    alert("Рухсат йўқ!");
    return;
  }
  const u = appState.users[idx];
  if (!u) return;
  if (u.login === "admin") {
    alert("Асосий админни ўчириб бўлмайди!");
    return;
  }
  if (!confirm(`«${u.name}» (${u.login}) фойдаланувчисини ўчирмоқчимисиз?`)) return;

  if (typeof addAuditLog === "function") {
    addAuditLog("USER_DELETE", `${u.login} ўчирилди`);
  }

  appState.users.splice(idx, 1);
  saveState();
  renderUsersTable();
  showToast(`🗑 ${u.name} ўчирилди`, "warning");
}

// =========================================================================
// ФОЙДАЛАНУВЧИ ЯРАТИШ
// =========================================================================

async function handleUserCreateSubmit(e) {
  e.preventDefault();
  if (!hasPermission("create_user")) {
    alert("Рухсат йўқ!");
    return;
  }

  const name = document.getElementById("newUserName").value.trim();
  const role = document.getElementById("newUserRole").value;
  const login = document.getElementById("newUserLogin").value.trim();
  const pass = document.getElementById("newUserPass").value.trim();

  if (!name || !login || !pass) {
    alert("Барча майдонларни тўлдиринг!");
    return;
  }
  if (appState.users.some(u => u.login === login)) {
    alert("❌ Бу логин банд!");
    return;
  }
  if (pass.length < 6) {
    alert("Парол камида 6 та белгидан иборат бўлиши керак!");
    return;
  }

  const passHash = await hashPassword(pass);
  if (!passHash) {
    alert("Парол хешлашда хато!");
    return;
  }

  appState.users.push({ login, passHash, name, role });

  if (typeof addAuditLog === "function") {
    addAuditLog("USER_CREATE", `${login} (${ROLE_NAMES[role] || role}) яратилди`);
  }

  saveState();
  renderUsersTable();
  e.target.reset();
  showToast(`✅ Фойдаланувчи (${login}) яратилди`, "success");
}

console.log("✅ 08-candidates.js юкланди (v9.1 — бошқармаси + ҳудуд)");
