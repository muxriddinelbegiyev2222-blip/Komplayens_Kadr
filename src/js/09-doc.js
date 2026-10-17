// =========================================================================
// 09-DOC.JS — A4 Маълумотнома, Таҳрир, Тасдиқлаш, QR КОД
// «КОМПЛАЕНС-КАДР» v10.7 (Тўлиқ тузатилган)
// =========================================================================

function openEditorModal(id) {
  if (!hasPermission("edit_its") && !hasPermission("view_candidate_details")) { alert("Рухсат йўқ!"); return; }
  const c = appState.candidates.find(x => x.id === id);
  if (!c) return;
  activeCandidateId = id;

  if (currentRole === ROLES.KORRUPSIYA && !c.korrupsiyaViewedAt) {
    const now = getNow();
    c.korrupsiyaViewedAt = now.dateTime;
    if (typeof logKorrupsiyaViewed === "function") logKorrupsiyaViewed(c);
    saveState();
  }

  const title = document.getElementById("editorCandidateTitle");
  if (title) title.textContent = `${c.fio} (${c.region}) — Маълумотномани тайёрлаш`;

  setVal("editSudlanganStatus", c.sudlanganStatus);
  setVal("editSudlanganText", c.sudlanganText);
  setVal("editEduText", c.eduText);
  setVal("editPara2", c.para2);
  setVal("editPara3", c.para3);
  setVal("editPara4", c.para4);

  const returnBlock = document.getElementById("returnReasonBlock");
  if (returnBlock) {
    if (c.bossReturnReason && c.bossReturnedAt) {
      returnBlock.classList.remove("hidden");
      returnBlock.innerHTML = `<div class="p-3 rounded-lg bg-red-50 border-2 border-red-400 text-red-900 text-xs"><b>↩️ Охирги қайтариш:</b><br/><b>Вақт:</b> ${c.bossReturnedAt}<br/><b>Сабаб:</b> ${c.bossReturnReason}</div>`;
    } else { returnBlock.classList.add("hidden"); }
  }

  const modal = document.getElementById("editorModal");
  if (modal) modal.classList.remove("hidden");
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

function closeEditorModal() {
  const modal = document.getElementById("editorModal");
  if (modal) modal.classList.add("hidden");
}

function onSudlanganSelectChange() {
  const sel = document.getElementById("editSudlanganStatus");
  const inp = document.getElementById("editSudlanganText");
  if (!sel || !inp) return;
  if (sel.value === "clean") inp.value = "муқаддам судланмаган";
  else if (inp.value === "муқаддам судланмаган") inp.value = "муқаддам судланган (ЎзР ЖКнинг ___-моддаси билан)";
}

function collectEditorFields(c) {
  if (!c) return;
  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
  c.sudlanganStatus = getVal("editSudlanganStatus") || "clean";
  c.sudlanganText = getVal("editSudlanganText") || "муқаддам судланмаган";
  c.eduText = getVal("editEduText") || c.eduText;
  c.para2 = getVal("editPara2") || c.para2;
  c.para3 = getVal("editPara3") || c.para3;
  c.para4 = getVal("editPara4") || c.para4;
  c.itsChecked = true;
}

function saveDraftOnly() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  collectEditorFields(c);
  if (typeof logITSChecked === "function") logITSChecked(c, c.sudlanganStatus, c.sudlanganText);
  saveState();
  renderAll();
  closeEditorModal();
  showToast("💾 Қоралама сақланди", "info");
}

function sendToBossForApproval() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;

  collectEditorFields(c);
  c.workflowStage = "boss_review";

  saveState(); // 1. Мажбурий сақлаш
  
  if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи"); // 2. Логлаш

  renderAll(); // 3. Экранни янгилаш
  closeEditorModal();
  showToast(`📤 «${c.fio}» Бўлим бошлиғига юборилди`, "success");
}

function getSignerName(candidate) {
  // Сиз айтгандек, имзо жойида доим I.Zaripov туради
  return "I.Zaripov";
}

function getApproverName(candidate) {
  if (!candidate) return "—";
  if (candidate.workflowStage === "approved" && candidate.bossApprovedBy) return candidate.bossApprovedBy;
  return "I.Zaripov";
}

function buildOfficialMalumotnomaHtml(c) {
  const p3Parts = (c.para3 || "").split("\n").filter(Boolean);
  const p4Parts = (c.para4 || "").split("\n").filter(Boolean);

  const sudHtml = c.sudlanganStatus === "sudlangan"
    ? `<b style="color:#b91c1c;text-decoration:underline;">${c.sudlanganText}</b>`
    : `${c.sudlanganText}`;

  // 🆕 QR код фақат тасдиқланганда чиқади
  let qrHtml = "";
  if (c.workflowStage === "approved") {
    const qrText = `PINFL: ${c.pinfl}\nReestr: ${c.reestrNo}\nTasdiqlandi: ${c.approvedDate}\nTasdiqlovchi: ${getApproverName(c)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrText)}`;
    qrHtml = `<div style="text-align:center;margin-top:5px;"><img src="${qrUrl}" alt="QR" style="width:70px;height:70px;display:block;margin:0 auto 2px auto;" /><div style="font-size:7pt;color:#475569;">Ҳужжат ҳақиқийлиги</div></div>`;
  }

  const stampHtml = c.workflowStage === "approved"
    ? `<div style="border:2px solid #047857;color:#047857;padding:4px 12px;border-radius:6px;font-size:11pt;font-weight:bold;text-align:center;display:flex;align-items:center;gap:10px;"><div>ТАСДИҚЛАНДИ<br/><span style="font-size:9pt;">Ўрганиб чиқилди • ${c.approvedDate || c.createdAt}</span></div>${qrHtml}</div>`
    : `<div style="border:1.5px dashed #b45309;color:#b45309;padding:4px 12px;border-radius:6px;font-size:10pt;font-weight:bold;text-align:center;">ЎРГАНИШ ЖАРАЁНИДА</div>`;

  return `
    <div style="font-family:'Times New Roman',Times,serif;color:#000000;">
      <div style="text-align:center;font-weight:bold;font-size:14pt;line-height:1.35;margin-bottom:14pt;">
        ${(c.districtHeading || "").replace(/ лавозимига$/i, "")} лавозимига тавсия этилаётган номзод<br/>
        ${c.fio} бўйича<br/>
        МАЪЛУМОТНОМА
      </div>

      <div class="malumotnoma-text">
        <p>
          Номзод ${(c.jobSince || "").replace(/ й\.?$/, "")} йилдан ${c.currentJob} лавозимида ишлаб келмоқда. ${c.birthDate} йилда ${c.birthPlace}да туғилган, ${sudHtml}, ${c.eduText}
        </p>
        <p>${c.para2}</p>
        ${p3Parts.map(line => `<p>${line}</p>`).join("")}
        ${p4Parts.map(line => `<p>${line}</p>`).join("")}
      </div>

      <div style="margin-top:26pt;display:flex;align-items:flex-end;justify-content:space-between;font-family:'Times New Roman',Times,serif;font-size:14pt;font-weight:bold;color:#000000;">
        <div style="line-height:1.35;">
          Коррупцияга қарши курашиш<br/>бўлими бошлиғи
        </div>
        ${stampHtml}
        <div style="text-align:center;">
          ${getSignerName(c)}
        </div>
      </div>

      <div style="margin-top:16pt;padding-top:6pt;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:9.5pt;color:#475569;font-family:'Times New Roman',Times,serif;">
        <span>«КОМПЛАЕНС-КАДР» реестри: ${c.reestrNo} (${c.region})</span>
        <span>ПИНФЛ: ${c.pinfl} | Якуний натижа: ${getFinalResultPlainText(c)}</span>
      </div>
    </div>
  `;
}

function openDocModal(id) {
  try {
    const c = appState.candidates.find(x => x.id === id);
    if (!c) return alert("Номзод топилмади!");

    if ((currentRole === ROLES.KUZATUVCHI || currentRole === ROLES.KADR) && c.workflowStage !== "approved") {
      return alert("Ушбу номзод ҳали «Ўрганиш жараёнида». Бўлим бошлиғи тасдиқлагандан сўнг Маълумотнома очилади.");
    }

    activeCandidateId = id;

    const content = document.getElementById("a4InnerContent");
    if (content) content.innerHTML = buildOfficialMalumotnomaHtml(c);

    const reestrInfo = document.getElementById("docModalReestrInfo");
    if (reestrInfo) reestrInfo.textContent = `Реестр: ${c.reestrNo} | ПИНФЛ: ${c.pinfl}`;

    const badge = document.getElementById("docModalStatusBadge");
    if (badge) {
      if (c.workflowStage === "approved") {
        badge.textContent = "✓ Ўрганиб чиқилди";
        badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      } else {
        badge.textContent = "⏳ Ўрганиш жараёнида";
        badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30";
      }
    }

    const bossPanel = document.getElementById("bossActionPanel");
    const warnBox = document.getElementById("bossSudlanganWarningBox");
    const chk = document.getElementById("chkBossConfirmSudlangan");
    const btnApprove = document.getElementById("btnBossFinalApprove");

    if (currentRole === ROLES.RAHBAR && c.workflowStage === "boss_review") {
      if (bossPanel) bossPanel.classList.remove("hidden");

      if (!c.bossViewedAt) {
        if (typeof logBossViewed === "function") logBossViewed(c);
        saveState();
      }

      if (c.sudlanganStatus === "sudlangan") {
        if (warnBox) warnBox.classList.remove("hidden");
        const warnText = document.getElementById("bossSudlanganWarningText");
        if (warnText) warnText.textContent = `ИЦ Маълумоти: ${c.sudlanganText}`;
        if (chk) chk.checked = false;
        if (btnApprove) {
          btnApprove.disabled = true;
          btnApprove.className = "px-5 py-2.5 rounded-xl bg-slate-400 text-white text-xs font-extrabold cursor-not-allowed";
        }
      } else {
        if (warnBox) warnBox.classList.add("hidden");
        if (btnApprove) {
          btnApprove.disabled = false;
          btnApprove.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-lg cursor-pointer";
        }
      }
    } else {
      if (bossPanel) bossPanel.classList.add("hidden");
    }

    const modal = document.getElementById("docModal");
    if (modal) modal.classList.remove("hidden");
  } catch (error) {
    console.error("Open Doc Modal Error:", error);
    alert("Ҳужжатни очишда хато: " + error.message);
  }
}

function toggleBossApproveButton() {
  const chk = document.getElementById("chkBossConfirmSudlangan");
  const btnApprove = document.getElementById("btnBossFinalApprove");
  if (!chk || !btnApprove) return;
  if (chk.checked) {
    btnApprove.disabled = false;
    btnApprove.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-lg cursor-pointer";
  } else {
    btnApprove.disabled = true;
    btnApprove.className = "px-5 py-2.5 rounded-xl bg-slate-400 text-white text-xs font-extrabold cursor-not-allowed";
  }
}

function approveByBoss() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  if (!hasPermission("approve")) return alert("Рухсат йўқ!");

  const now = getNow();
  c.workflowStage = "approved";
  c.approvedDate = now.date;
  c.bossApprovedAt = now.dateTime;

  if (typeof logApproved === "function") logApproved(c, "I.Zaripov");

  saveState();
  renderAll();
  openDocModal(c.id);
  showToast(`✅ «${c.fio}» тасдиқланди!`, "success");
}

function returnToAdminForRevision() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  if (!hasPermission("return")) return alert("Рухсат йўқ!");

  const reason = prompt("Қайтариш сабабини киритинг:", c.bossReturnReason || "");
  if (reason === null) return;
  if (!reason.trim()) return alert("Сабабни киритишингиз шарт!");

  c.workflowStage = "admin_review";
  c.bossReturnReason = reason.trim();

  if (typeof logReturned === "function") logReturned(c, reason.trim());

  saveState();
  renderAll();
  closeDocModal();
  showToast(`↩️ «${c.fio}» таҳрирга қайтарилди`, "warning");
}

function closeDocModal() {
  const modal = document.getElementById("docModal");
  if (modal) modal.classList.add("hidden");
  activeCandidateId = null;
}

function printCurrentDocA4() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>МАЪЛУМОТНОМА — ${c.fio}</title>
      <style>
        @page { size: A4 portrait; margin: 16mm 16mm 16mm 22mm; }
        body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; }
        .malumotnoma-text p { text-indent: 1.25cm; text-align: justify; line-height: 1.48; font-size: 14pt; margin: 0 0 8pt 0; }
      </style>
    </head>
    <body>${buildOfficialMalumotnomaHtml(c)}</body>
    </html>
  `;
  const printWin = window.open("", "_blank", "width=850,height=950");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  } else { window.print(); }
}

function copyDocText() {
  const el = document.getElementById("a4InnerContent");
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => showToast("📋 Маълумотнома матни нусхаланди", "success")).catch(() => alert("Нусхалаш амалга ошмади"));
}
console.log("✅ 09-doc.js юкланди (v10.7 — Тўлиқ тузатилган, QR ва Имзо)");
