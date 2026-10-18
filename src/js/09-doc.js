// =========================================================================
// 09-DOC.JS — A4 Маълумотнома, Таҳрир, Тасдиқлаш, QR КОД
// «КОМПЛАЕНС-КАДР» v11.8 FINAL (Тўлиқ тўғирланган)
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

  if (!c.para2 || c.para2 === "...") {
    c.para2 = `У миллати ўзбек, маълумоти олий, оилали. Диний эътиқодига кўра ислом динига амал қилади. ДЭО (дарҳақиқат, экстремистик оқимларга) аъзо эмас.`;
  }
  if (!c.para3 || c.para3 === "...") {
    c.para3 = `Ҳозирда ${c.region} ${c.currentJob} лавозимида фаолият кўрсатиб келмоқда. Ўз вазифаларини бажаришда меҳнат интизомига қатъий риоя қилади, ўз ишига масъулиятли ва ташаббускор.`;
  }
  if (!c.para4 || c.para4 === "...") {
    c.para4 = `Шахсий ва бошқарув фазилатларига кўра, жамоада ўзаро ҳурмат ва ҳамжиҳатлик муҳитини ярата олади. Вазифаларни бажаришда тадбиркор ва изланувчан, юқори натижаларга эришишга интилади.`;
  }

  setVal("editSudlanganStatus", c.sudlanganStatus);
  setVal("editSudlanganText", c.sudlanganText);
  setVal("editEduText", c.eduText);
  setVal("editPara2", c.para2);
  setVal("editPara3", c.para3);
  setVal("editPara4", c.para4);
  
  // Majburiy Kirillga o'tkazish
  let sn = c.signerName || "";
  let sp = c.signerPosition || "";
  
  if (!sn || sn.includes("Zaripov") || /[a-zA-Z]/.test(sn)) {
    sn = "И.Зарипов";
  }
  if (!sp || sp.includes("Korrupsiya") || sp.includes("bolimi") || /[a-zA-Z]/.test(sp)) {
    sp = "Коррупцияга қарши курашиш бўлими бошлиғи";
  }
  
  setVal("editSignerName", sn);
  setVal("editSignerPosition", sp);

  const returnBlock = document.getElementById("returnReasonBlock");
  if (returnBlock) {
    if (c.bossReturnReason && c.bossReturnedAt) {
      returnBlock.classList.remove("hidden");
      returnBlock.innerHTML = `<div class="p-3 rounded-lg bg-red-50 border-2 border-red-400 text-red-900 text-xs"><b>↩️ Оҳирги қайтариш:</b><br/><b>Вақт:</b> ${c.bossReturnedAt}<br/><b>Сабаб:</b> ${c.bossReturnReason}</div>`;
    } else { returnBlock.classList.add("hidden"); }
  }

  const modal = document.getElementById("editorModal");
  if (modal) modal.classList.remove("hidden");
}

function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ""; }
function closeEditorModal() { document.getElementById("editorModal")?.classList.add("hidden"); }

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
  c.signerName = getVal("editSignerName") || "И.Зарипов";
  c.signerPosition = getVal("editSignerPosition") || "Коррупцияга қарши курашиш бўлими бошлиғи";
  c.itsChecked = true;
  
  // Eski xato bilan saqlangan bo'lsa, tozalaymiz
  if (c.fullDocHtml && (c.fullDocHtml.includes("I.Zaripov") || c.fullDocHtml.includes("Korrupsiya bolimi"))) {
    c.fullDocHtml = "";
  }
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
  saveState();
  if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи");
  renderAll();
  closeEditorModal();
  showToast(`📤 «${c.fio}» Бўлим бошлиғига юборилди`, "success");
}

// =========================================================================
// QR ВЕРИФИКАЦИЯ
// =========================================================================
const QR_VERIFY_SECRET = "KOMPLAYENS_KADR_v11.8_2026_VERIFY_SECRET_KEY_9F2A";

function getSignerName(c) { 
  let sn = c?.signerName || "И.Зарипов"; 
  if (sn.includes("Zaripov") || /[a-zA-Z]/.test(sn)) sn = "И.Зарипов";
  return sn;
}

function getSignerPosition(c) { 
  let sp = c?.signerPosition || "Коррупцияга қарши курашиш бўлими бошлиғи"; 
  if (sp.includes("Korrupsiya") || /[a-zA-Z]/.test(sp)) sp = "Коррупцияга қарши курашиш бўлими бошлиғи";
  return sp;
}

function getApproverName(c) { return c?.bossApprovedBy || getSignerName(c); }

function qrShortHash(input) {
  const data = String(input) + "|" + QR_VERIFY_SECRET;
  let h1 = 2166136261, h2 = 5381;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    h1 ^= code; h1 = Math.imul(h1, 16777619);
    h2 = ((h2 << 5) + h2) ^ code; h2 = h2 >>> 0;
  }
  const hex1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return (hex1 + hex2).substring(0, 8);
}

function buildQrPayload(c) {
  const approverName = getSignerName(c);
  const position = getSignerPosition(c);
  const reestrNo = (c.reestrNo || "").replace(/\|/g, "/");
  const date = (c.approvedDate || c.createdAt || "").replace(/\|/g, "/");
  const core = `${reestrNo}|${approverName}|${position}|${date}`;
  const hash = qrShortHash(core);
  return `${core}|${hash}`;
}

function generateBase64Qr(payload) {
  try {
    const qr = qrcode(0, 'L');
    qr.addData(payload);
    qr.make();
    return qr.createDataURL(4, 0); 
  } catch (e) {
    console.error("QR generation error:", e);
    return "";
  }
}

// =========================================================================
// A4 МАЪЛУМОТНОМА HTML (Toza CSS orqali)
// =========================================================================

function buildOfficialMalumotnomaHtml(c) {
  // Eski saqlangan lotincha HTML bo'lsa, uni e'tiborsiz qoldiramiz
  if (c.fullDocHtml && c.fullDocHtml.trim() !== "" && !c.fullDocHtml.includes("I.Zaripov") && !c.fullDocHtml.includes("Korrupsiya bolimi")) {
    return c.fullDocHtml;
  }

  const p3Parts = (c.para3 || "").split("\n").filter(Boolean);
  const p4Parts = (c.para4 || "").split("\n").filter(Boolean);
  const sudHtml = c.sudlanganStatus === "sudlangan"
    ? `<b style="color:#b91c1c;text-decoration:underline;">${c.sudlanganText}</b>`
    : `${c.sudlanganText}`;

  let jobSinceText = c.jobSince || "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(jobSinceText)) {
    jobSinceText = `${jobSinceText} йилдан бошлаб`;
  } else if (/^\d{4}$/.test(jobSinceText)) {
    jobSinceText = `${jobSinceText} йилдан`;
  } else if (jobSinceText) {
    jobSinceText = `${jobSinceText} дан`;
  } else {
    jobSinceText = "иш фаолиятини бошлагандан";
  }

  let qrHtml = "";
  if (c.workflowStage === "approved") {
    const qrPayload = buildQrPayload(c);
    const qrDataUrl = generateBase64Qr(qrPayload);
    if (qrDataUrl) {
      qrHtml = `<img src="${qrDataUrl}" style="width:90px; height:90px; display:block; margin:5px auto 0 auto;" draggable="true" title="QR Kodni ko'chirish mumkin" />`;
    }
  }

  const stampHtml = c.workflowStage === "approved"
    ? `<div style="border:2px solid #047857;color:#047857;padding:6px 10px;border-radius:8px;font-size:10pt;font-weight:bold;text-align:center; page-break-inside:avoid; width:120px; margin:0 auto;">
        ТАСДИҚЛАНДИ<br/>
        <span style="font-size:8pt;font-weight:normal;">Ўрганиб чиқилди • ${c.approvedDate || c.createdAt}</span>
        ${qrHtml}
      </div>`
    : `<div style="border:1.5px dashed #b45309;color:#b45309;padding:10px;border-radius:6px;font-size:10pt;font-weight:bold;text-align:center; page-break-inside:avoid; width:120px; margin:0 auto;">ЎРГАНИШ ЖАРАЁНИДА</div>`;

  return `
    <div style="font-family:'Times New Roman',Times,serif;color:#000000;">
      <div style="text-align:center;font-weight:bold;font-size:13pt;line-height:1.3;margin-bottom:12pt;">
        ${(c.districtHeading || "").replace(/ лавозимига$/i, "")} лавозимига тавсия этилаётган номзод<br/>${c.fio} бўйича<br/>МАЪЛУМОТНОМА
      </div>
      
      <div class="malumotnoma-text">
        <p>Номзод ${jobSinceText} ${c.currentJob} лавозимида ишлаб келмоқда. ${c.birthDate} йилда ${c.birthPlace}да туғилган, ${sudHtml}, ${c.eduText}</p>
        <p>${c.para2}</p>
        ${p3Parts.map(line => `<p>${line}</p>`).join("")}
        ${p4Parts.map(line => `<p>${line}</p>`).join("")}
      </div>

      <!-- 3 USTUNLI QAT'IY JADVAL -->
      <table style="width:100%; margin-top:20pt; border-collapse:collapse; page-break-inside:avoid;">
        <tr>
          <td style="width:35%; text-align:left; vertical-align:bottom; padding-bottom:10px;">
            <div style="font-size:11pt; font-weight:bold; line-height:1.2;">${getSignerPosition(c)}</div>
          </td>
          <td style="width:30%; text-align:center; vertical-align:bottom; padding-bottom:10px;">
            ${stampHtml}
          </td>
          <td style="width:35%; text-align:center; vertical-align:bottom; padding-bottom:10px;">
            <div style="font-size:12pt; font-weight:bold; margin-bottom:2px;">${getSignerName(c)}</div>
            <div style="font-size:9pt; color:#333;">(имзо)</div>
          </td>
        </tr>
      </table>

      <div style="margin-top:10pt; padding-top:5pt; border-top:1px solid #cbd5e1; display:flex; justify-content:space-between; font-size:9pt; color:#475569;">
        <span>«КОМПЛАЕНС-КАДР» реестри: ${c.reestrNo} (${c.region})</span>
        <span>Якуний натижа: ${getFinalResultPlainText(c)}</span>
      </div>
    </div>
  `;
}

function openDocModal(id) {
  try {
    const c = appState.candidates.find(x => x.id === id);
    if (!c) return alert("Номзод топилмади!");

    if ((currentRole === ROLES.KUZATUVCHI) && c.workflowStage !== "approved") {
      return alert("Ушбу номзод ҳали «Ўрганиш жараёнида». Бўлим бошлиғи тасдиқлагандан сўнг Маълумотнома очилади.");
    }

    activeCandidateId = id;

    const watermark = document.getElementById("watermarkOverlay");
    if (watermark) {
      if (c.workflowStage !== "approved") {
        watermark.classList.remove("hidden");
        watermark.classList.add("flex");
      } else {
        watermark.classList.add("hidden");
        watermark.classList.remove("flex");
      }
    }

    const content = document.getElementById("a4InnerContent");
    if (content) {
      content.innerHTML = buildOfficialMalumotnomaHtml(c);
      if (currentRole === ROLES.KADR) {
        content.setAttribute("contenteditable", "false");
      } else {
        content.setAttribute("contenteditable", "true");
      }
    }

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

    const actionBtns = document.getElementById("docModalActionButtons");
    if (actionBtns) {
      let html = `<button onclick="closeDocModal()" class="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base flex items-center justify-center cursor-pointer ml-2">✕</button>`;
      html = `<button onclick="printCurrentDocA4()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow cursor-pointer">🖨 Chop etish</button>` + html;

      if (currentRole !== ROLES.KADR) {
        html = `<button onclick="saveDirectDocEdits()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow">💾 Saqlash</button>
                <button onclick="resetDocEdits()" class="px-3.5 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer shadow">↩️ Asl holat</button>
                <button onclick="copyDocText()" class="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer">📋 Nusxalash</button>
                <button onclick="exportCurrentDocWord()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">📄 Word</button>` + html;
      }
      actionBtns.innerHTML = html;
    }

    const bossPanel = document.getElementById("bossActionPanel");
    const warnBox = document.getElementById("bossSudlanganWarningBox");
    const chk = document.getElementById("chkBossConfirmSudlangan");
    const btnApprove = document.getElementById("btnBossFinalApprove");

    if (currentRole === ROLES.RAHBAR && c.workflowStage === "boss_review") {
      if (bossPanel) bossPanel.classList.remove("hidden");
      if (!c.bossViewedAt) { if (typeof logBossViewed === "function") logBossViewed(c); saveState(); }

      if (c.sudlanganStatus === "sudlangan") {
        if (warnBox) warnBox.classList.remove("hidden");
        const warnText = document.getElementById("bossSudlanganWarningText");
        if (warnText) warnText.textContent = `ИЦ Маълумоти: ${c.sudlanganText}`;
        if (chk) chk.checked = false;
        if (btnApprove) { btnApprove.disabled = true; btnApprove.className = "px-5 py-2.5 rounded-xl bg-slate-400 text-white text-xs font-extrabold cursor-not-allowed"; }
      } else {
        if (warnBox) warnBox.classList.add("hidden");
        if (btnApprove) { btnApprove.disabled = false; btnApprove.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-lg cursor-pointer"; }
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

function saveDirectDocEdits() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  const content = document.getElementById("a4InnerContent");
  if (!c || !content) return;
  c.fullDocHtml = content.innerHTML; 
  saveState();
  showToast("✅ Hujjat matni o'zgartirilgan holatda saqlandi", "success");
}

function resetDocEdits() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  if (!confirm("Hujjatdagi qo'lda kiritilgan o'zgarishlar o'chiriladi va asl holatiga qaytadi. Davom etasizmi?")) return;
  c.fullDocHtml = "";
  saveState();
  openDocModal(c.id);
}

function toggleBossApproveButton() {
  const chk = document.getElementById("chkBossConfirmSudlangan");
  const btnApprove = document.getElementById("btnBossFinalApprove");
  if (!chk || !btnApprove) return;
  if (chk.checked) { btnApprove.disabled = false; btnApprove.className = "px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-lg cursor-pointer"; }
  else { btnApprove.disabled = true; btnApprove.className = "px-5 py-2.5 rounded-xl bg-slate-400 text-white text-xs font-extrabold cursor-not-allowed"; }
}

function approveByBoss() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) return;
  if (!hasPermission("approve")) return alert("Рухсат йўқ!");
  const now = getNow();
  c.workflowStage = "approved";
  c.approvedDate = now.date;
  c.bossApprovedAt = now.dateTime;
  c.bossApprovedBy = currentUser?.name || getSignerName(c);
  if (typeof logApproved === "function") logApproved(c, c.bossApprovedBy);
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
  const content = document.getElementById("a4InnerContent");
  const htmlToPrint = content ? content.innerHTML : buildOfficialMalumotnomaHtml(c);
  
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>МАЪЛУМОТНОМА — ${c.fio}</title><style>@page { size: A4 portrait; margin: 20mm 15mm 20mm 30mm; } body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; } .malumotnoma-text p { text-indent: 1.25cm; text-align: justify; line-height: 1.3; font-size: 13pt; margin: 0 0 6pt 0; }</style></head><body>${htmlToPrint}</body></html>`;
  
  const printWin = window.open("", "_blank", "width=850,height=950");
  if (printWin) { printWin.document.open(); printWin.document.write(htmlContent); printWin.document.close(); printWin.focus(); setTimeout(() => printWin.print(), 300); }
  else { window.print(); }
}

function copyDocText() {
  const el = document.getElementById("a4InnerContent");
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => showToast("📋 Маълумотнома матни нусхаланди", "success")).catch(() => alert("Нусхалаш амалга ошмади"));
}
