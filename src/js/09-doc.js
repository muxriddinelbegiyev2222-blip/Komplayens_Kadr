// =========================================================================
// 09-DOC.JS — A4 Маълумотнома, Таҳрир, Тасдиқлаш, QR КОД
// «КОМПЛАЕНС-КАДР» v11.6 — QR ихчам ва сканерланадиган
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
  saveState();
  if (typeof logSentToBoss === "function") logSentToBoss(c, "Бўлим бошлиғи");
  renderAll();
  closeEditorModal();
  showToast(`📤 «${c.fio}» Бўлим бошлиғига юборилди`, "success");
}

// =========================================================================
// QR ВЕРИФИКАЦИЯ — ихчам, сканерланадиган, сохталаштиришга қарши
// =========================================================================

const QR_VERIFY_SECRET = "KOMPLAYENS_KADR_v11.6_2026_VERIFY_SECRET_KEY_9F2A";
const QR_VERIFY_BASE_URL = ""; // агар сервер бўлса: "https://verify.komplayens.uz"
const QR_SIGNER_POSITION_LAT = "Korrupsiya bolimi boshlig'i";

function getSignerName(candidate) { return "I.Zaripov"; }
function getApproverName(candidate) { return candidate?.bossApprovedBy || "I.Zaripov"; }
function getSignerPositionLat() { return QR_SIGNER_POSITION_LAT; }

// Ихчам синхрон hash (FNV-1a + djb2 → 8 hex)
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

// QR мазмуни: ~70-80 белги
function buildQrPayload(c) {
  const approverName = getApproverName(c);
  const position = getSignerPositionLat();
  const reestrNo = (c.reestrNo || "").replace(/\|/g, "/");
  const date = (c.approvedDate || c.createdAt || "").replace(/\|/g, "/");

  const core = `${reestrNo}|${approverName}|${position}|${date}`;
  const hash = qrShortHash(core);

  if (QR_VERIFY_BASE_URL) {
    return `${QR_VERIFY_BASE_URL}/v?r=${encodeURIComponent(reestrNo)}&h=${hash}`;
  }
  return `${core}|${hash}`;
}

// QR маълумотини текшириш (керак бўлса ишлатилади)
function verifyQrPayload(payload) {
  if (!payload || typeof payload !== "string") return false;
  const parts = payload.split("|");
  if (parts.length !== 5) return false;
  const [reestrNo, approverName, position, date, hash] = parts;
  const expected = qrShortHash(`${reestrNo}|${approverName}|${position}|${date}`);
  return expected === hash;
}

// QR расм URL — ECC=L (кам модул), катта ўлчам, кичик margin
function buildQrImageUrl(payload, size) {
  const s = size || 220;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&ecc=L&margin=1&data=${encodeURIComponent(payload)}`;
}

// =========================================================================
// A4 МАЪЛУМОТНОМА HTML
// =========================================================================

function buildOfficialMalumotnomaHtml(c) {
  const p3Parts = (c.para3 || "").split("\n").filter(Boolean);
  const p4Parts = (c.para4 || "").split("\n").filter(Boolean);
  const sudHtml = c.sudlanganStatus === "sudlangan"
    ? `<b style="color:#b91c1c;text-decoration:underline;">${c.sudlanganText}</b>`
    : `${c.sudlanganText}`;

  // 🆕 QR: ихчам, катта, сканерланадиган
  let qrHtml = "";
  if (c.workflowStage === "approved") {
    const qrPayload = buildQrPayload(c);
    const qrUrl = buildQrImageUrl(qrPayload, 220);
    qrHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <img src="${qrUrl}" alt="QR" style="width:120px;height:120px;display:block;image-rendering:pixelated;" />
        <div style="font-size:7.5pt;color:#475569;text-align:center;line-height:1.15;">
          Тасдиқловчи: <b>${getApproverName(c)}</b><br/>
          ${getSignerPositionLat().replace(/'/g, "ʻ")}
        </div>
      </div>
    `;
  }

  const stampHtml = c.workflowStage === "approved"
    ? `<div style="border:2px solid #047857;color:#047857;padding:6px 12px;border-radius:6px;font-size:10.5pt;font-weight:bold;text-align:center;">
        <div style="text-align:center;margin-bottom:6px;">
          ТАСДИҚЛАНДИ<br/>
          <span style="font-size:9pt;font-weight:normal;">Ўрганиб чиқилди • ${c.approvedDate || c.createdAt}</span>
        </div>
        ${qrHtml}
      </div>`
    : `<div style="border:1.5px dashed #b45309;color:#b45309;padding:4px 12px;border-radius:6px;font-size:10pt;font-weight:bold;text-align:center;">ЎРГАНИШ ЖАРАЁНИДА</div>`;

  return `
    <div style="font-family:'Times New Roman',Times,serif;color:#000000;">
      <div style="text-align:center;font-weight:bold;font-size:14pt;line-height:1.35;margin-bottom:14pt;">
        ${(c.districtHeading || "").replace(/ лавозимига$/i, "")} лавозимига тавсия этилаётган номзод<br/>${c.fio} бўйича<br/>МАЪЛУМОТНОМА
      </div>
      <div class="malumotnoma-text">
        <p>Номзод ${(c.jobSince || "").replace(/ й\.?$/, "")} йилдан ${c.currentJob} лавозимида ишлаб келмоқда. ${c.birthDate} йилда ${c.birthPlace}да туғилган, ${sudHtml}, ${c.eduText}</p>
        <p>${c.para2}</p>
        ${p3Parts.map(line => `<p>${line}</p>`).join("")}
        ${p4Parts.map(line => `<p>${line}</p>`).join("")}
      </div>
      <div style="margin-top:26pt;display:flex;align-items:flex-end;justify-content:space-between;font-family:'Times New Roman',Times,serif;font-size:13pt;font-weight:bold;color:#000000;gap:10px;">
        <div style="line-height:1.35;flex:0 0 auto;">Коррупцияга қарши курашиш<br/>бўлими бошлиғи</div>
        <div style="flex:1 1 auto;display:flex;justify-content:center;">${stampHtml}</div>
        <div style="text-align:center;flex:0 0 auto;">${getSignerName(c)}</div>
      </div>
      <div style="margin-top:16pt;padding-top:6pt;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:9.5pt;color:#475569;font-family:'Times New Roman',Times,serif;">
        <span>«КОМПЛАЕНС-КАДР» реестри: ${c.reestrNo} (${c.region})</span>
        <span>Якуний натижа: ${getFinalResultPlainText(c)}</span>
      </div>
    </div>
  `;
}

// =========================================================================
// DOC MODAL
// =========================================================================

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
  c.bossApprovedBy = currentUser?.name || "I.Zaripov";
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
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>МАЪЛУМОТНОМА — ${c.fio}</title><style>@page { size: A4 portrait; margin: 16mm 16mm 16mm 22mm; } body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; } .malumotnoma-text p { text-indent: 1.25cm; text-align: justify; line-height: 1.48; font-size: 14pt; margin: 0 0 8pt 0; }</style></head><body>${buildOfficialMalumotnomaHtml(c)}</body></html>`;
  const printWin = window.open("", "_blank", "width=850,height=950");
  if (printWin) { printWin.document.open(); printWin.document.write(htmlContent); printWin.document.close(); printWin.focus(); setTimeout(() => printWin.print(), 300); }
  else { window.print(); }
}

function copyDocText() {
  const el = document.getElementById("a4InnerContent");
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => showToast("📋 Маълумотнома матни нусхаланди", "success")).catch(() => alert("Нусхалаш амалга ошмади"));
}

console.log("✅ 09-doc.js юкланди (v11.6 — QR ихчам, сканерланадиган, сохталаштиришга қарши)");
