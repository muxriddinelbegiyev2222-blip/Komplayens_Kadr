// =========================================================================
// 10-EXPORT.JS — Word / Excel / PDF экспорт
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// =========================================================================
// АСОСИЙ ЁРДАМЧИ — BLOB ФАЙЛ ЮКЛАШ
// =========================================================================

function downloadBlobFile(content, filename, mimeType) {
  try {
    const blob = new Blob(["\ufeff", content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`📥 ${filename} юклаб олинди`, "success");
  } catch (e) {
    console.error("Download error:", e);
    alert("Файлни юклашда хато: " + e.message);
  }
}

// -------------------- РАМКАЛИ HTML ЎРАШ --------------------
function wrapFramedExportHtml(title, tableHtml) {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; }
        th, td { 
          border: 1.5pt solid #000000; 
          padding: 6pt 8pt; 
          vertical-align: middle; 
          font-family: 'Times New Roman', Times, serif; 
        }
        th { 
          background-color: #e2efda; 
          font-weight: bold; 
          text-align: center; 
        }
      </style>
    </head>
    <body>
      <h3 style="text-align:center;font-family:'Times New Roman',serif;">${title}</h3>
      ${tableHtml}
    </body>
    </html>
  `;
}

// =========================================================================
// 1. ЖОРИЙ ҲУЖЖАТНИ WORD ГА ЭКСПОРТ
// =========================================================================

function exportCurrentDocWord() {
  const c = appState.candidates.find(x => x.id === activeCandidateId);
  if (!c) {
    alert("Номзод топилмади!");
    return;
  }

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${c.fio}</title>
      <style>
        @page { size: 21cm 29.7cm; margin: 1.8cm 1.8cm 1.8cm 2.4cm; }
        body { font-family: 'Times New Roman', serif; font-size: 14pt; }
        p { text-indent: 1.25cm; text-align: justify; line-height: 1.45; margin-bottom: 8pt; }
      </style>
    </head>
    <body>${buildOfficialMalumotnomaHtml(c)}</body>
    </html>
  `;

  const safeName = c.fio.replace(/\s+/g, "_").replace(/[^\w\u0400-\u04FF_-]/g, "");
  downloadBlobFile(
    docHtml,
    `МАЪЛУМОТНОМА_${safeName}.doc`,
    "application/msword;charset=utf-8"
  );

  // Audit log
  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_DOC_WORD", `${c.fio} — Word юкланди`);
  }
}

// =========================================================================
// 2. ФОТОТАБЛИЦА (CURRENT / FORMER) — WORD
// =========================================================================

function exportFototablitsaWord(recordType = "current") {
  const regFilterEl = recordType === "former"
    ? document.getElementById("formerRegionFilter")
    : document.getElementById("fotoRegionFilter");

  const regFilter = regFilterEl ? regFilterEl.value : "ALL";

  const list = appState.candidates.filter(c => {
    if (c.recordType !== recordType) return false;
    if (regFilter !== "ALL" && c.region !== regFilter) return false;
    return true;
  });

  if (list.length === 0) {
    alert("Юклаш учун маълумот йўқ!");
    return;
  }

  let rows = "";
  list.forEach((c, i) => {
    rows += `
      <tr>
        <td style="text-align:center;font-weight:bold;">${i + 1}.</td>
        <td style="text-align:center;"><img src="${c.photo}" width="85" height="110" /></td>
        <td style="text-align:center;">
          <b>${c.fio}</b><br/>
          ${c.birthDate} йил, ${c.birthPlace}<br/>
          ${c.passSeries} ${c.passNum}<br/>
          <b>${c.pinfl}</b>
        </td>
        <td style="text-align:center;color:#1e3a8a;">
          ${c.currentJob}<br/>
          <b>${c.jobSince}</b>
        </td>
        <td style="text-align:center;font-weight:bold;">
          ${getFinalResultPlainText(c)}
        </td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Расм</th>
          <th>Ф.И.Ш., туғилган йили ва жойи</th>
          <th>Эгаллаб турган лавозими ва қайси санадан</th>
          <th>Якуний натижа</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const title = recordType === "former"
    ? `СОБИҚ ХОДИМЛАР (${regFilter})`
    : `ФОТОТАБЛИЦА (${regFilter})`;

  const filename = recordType === "former"
    ? `Sobiq_xodimlar_${regFilter}.doc`
    : `Fototablitsa_${regFilter}.doc`;

  downloadBlobFile(
    wrapFramedExportHtml(title, table),
    filename,
    "application/msword;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_FOTO_WORD", `${recordType} | ${regFilter} | ${list.length} та`);
  }
}

// =========================================================================
// 3. ФОТОТАБЛИЦА — EXCEL
// =========================================================================

function exportFototablitsaExcel(recordType = "current") {
  const regFilterEl = recordType === "former"
    ? document.getElementById("formerRegionFilter")
    : document.getElementById("fotoRegionFilter");

  const regFilter = regFilterEl ? regFilterEl.value : "ALL";

  const list = appState.candidates.filter(c => {
    if (c.recordType !== recordType) return false;
    if (regFilter !== "ALL" && c.region !== regFilter) return false;
    return true;
  });

  if (list.length === 0) {
    alert("Юклаш учун маълумот йўқ!");
    return;
  }

  let rows = "";
  list.forEach((c, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td><b>${c.fio}</b></td>
        <td>${c.region}</td>
        <td>${c.category}</td>
        <td style="text-align:center;">${c.birthDate}</td>
        <td style="text-align:center;">${c.passSeries} ${c.passNum}</td>
        <td style="mso-number-format:'\\@';text-align:center;">${c.pinfl}</td>
        <td>${c.currentJob} (${c.jobSince})</td>
        <td style="text-align:center;font-weight:bold;">${getFinalResultPlainText(c)}</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Ф.И.Ш.</th>
          <th>Ҳудуд</th>
          <th>Йўналиш</th>
          <th>Туғилган сана</th>
          <th>Паспорт</th>
          <th>ПИНФЛ</th>
          <th>Лавозими</th>
          <th>Якуний натижа</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const title = recordType === "former"
    ? `СОБИҚ ХОДИМЛАР (${regFilter})`
    : `НОМЗОДЛАР ЖАДВАЛИ (${regFilter})`;

  const filename = recordType === "former"
    ? `Sobiq_xodimlar_${regFilter}.xls`
    : `Fototablitsa_${regFilter}.xls`;

  downloadBlobFile(
    wrapFramedExportHtml(title, table),
    filename,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_FOTO_EXCEL", `${recordType} | ${regFilter} | ${list.length} та`);
  }
}

// =========================================================================
// 4. ИЦ ЖАДВАЛИ — EXCEL
// =========================================================================

function exportItsExcel(mode = "ALL") {
  const list = appState.candidates.filter(c =>
    mode === "UNCHECKED" ? !c.itsChecked : true
  );

  if (list.length === 0) {
    alert("Юклаш учун маълумот йўқ!");
    return;
  }

  let rows = "";
  list.forEach((c, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${c.fio}</td>
        <td style="text-align:center;">${c.birthDate}</td>
        <td style="text-align:center;">${c.passSeries}</td>
        <td style="mso-number-format:'\\@';text-align:center;">${c.passNum}</td>
        <td style="mso-number-format:'\\@';text-align:center;">${c.pinfl}</td>
        <td>${c.itsChecked ? c.sudlanganText : ""}</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>T/R</th>
          <th>FIO</th>
          <th>Tug'ilgan sana</th>
          <th>Pasport seriyasi</th>
          <th>Pasport raqami</th>
          <th>PINFL</th>
          <th>Судланганлик натижаси</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const title = mode === "UNCHECKED"
    ? "ИЦ ТЕКШИРИШ УЧУН (Ўрганилмаганлар)"
    : "ИЦ ТЎЛИҚ ЖАДВАЛ";

  const filename = mode === "UNCHECKED"
    ? "IC_tekшириш_учун.xls"
    : "IC_toliq_jadval.xls";

  downloadBlobFile(
    wrapFramedExportHtml(title, table),
    filename,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_ITS", `${mode} | ${list.length} та`);
  }
}

// =========================================================================
// 5. СУДЛАНГАНЛАР РЕЕСТРИ — EXCEL
// =========================================================================

function exportNegativeExcel() {
  if (!hasPermission("export_negative")) {
    alert("Рухсат йўқ!");
    return;
  }

  const list = appState.candidates.filter(c => c.sudlanganStatus === "sudlangan");

  if (list.length === 0) {
    alert("Судланганлиги чиққан ходим йўқ!");
    return;
  }

  let rows = "";
  list.forEach((c, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td><b>${c.fio}</b> (${c.birthDate})</td>
        <td style="mso-number-format:'\\@';">${c.passSeries} ${c.passNum} | ${c.pinfl}</td>
        <td>${c.region} — ${c.category}</td>
        <td style="color:#b91c1c;font-weight:bold;">${c.sudlanganText}</td>
        <td style="text-align:center;font-weight:bold;">${getFinalResultPlainText(c)}</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Ф.И.Ш.</th>
          <th>Паспорт ва ПИНФЛ</th>
          <th>Ҳудуд ва Йўналиш</th>
          <th>Судланганлик моддаси</th>
          <th>Якуний натижа</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  downloadBlobFile(
    wrapFramedExportHtml("СУДЛАНГАНЛАР МАХСУС РЕЕСТРИ", table),
    "Sudlanganlar_reestri.xls",
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_NEGATIVE", `${list.length} та судланган`);
  }
}

// =========================================================================
// 6. ЯГОНА БАЗА — EXCEL
// =========================================================================

function exportDatabaseExcel() {
  const list = appState.candidates;

  if (list.length === 0) {
    alert("База бўш!");
    return;
  }

  let rows = "";
  list.forEach((c, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${c.reestrNo} (${c.createdAt})</td>
        <td>${c.region} (${c.year}/${c.month})</td>
        <td><b>${c.fio}</b></td>
        <td style="mso-number-format:'\\@';">${c.pinfl}</td>
        <td>${c.category}</td>
        <td>${c.currentJob}</td>
        <td style="text-align:center;font-weight:bold;">${getFinalResultPlainText(c)}</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Реестр №</th>
          <th>Ҳудуд (Йил/Ой)</th>
          <th>Ф.И.Ш.</th>
          <th>ПИНФЛ</th>
          <th>Тоифа</th>
          <th>Лавозим</th>
          <th>Якуний натижа</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const now = getNow();
  downloadBlobFile(
    wrapFramedExportHtml("ЯГОНА КОМПЛАЕНС БАЗАСИ", table),
    `Yagona_Baza_${now.date.replace(/\./g, "_")}.xls`,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_DATABASE", `${list.length} та ёзув`);
  }
}

// =========================================================================
// 7. DASHBOARD СТАТИСТИКА — EXCEL
// =========================================================================

function exportDashboardExcel() {
  const tableEl = document.getElementById("dashboardStatsTable");
  if (!tableEl) {
    alert("Статистика жадвали топилмади!");
    return;
  }

  const tableHtml = tableEl.outerHTML;
  const now = getNow();

  downloadBlobFile(
    wrapFramedExportHtml("ҲУДУДЛАР ВА ЙЎНАЛИШЛАР КЕСИМИДА СТАТИСТИКА", tableHtml),
    `Statistika_${now.date.replace(/\./g, "_")}.xls`,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_DASHBOARD", "Статистика юкланди");
  }
}

// =========================================================================
// 8. АУДИТ-ЛОГ — EXCEL
// =========================================================================

function exportAuditLogExcel() {
  if (!hasPermission("export_audit")) {
    alert("Рухсат йўқ!");
    return;
  }

  const log = loadAuditLog();

  if (log.length === 0) {
    alert("Аудит-лог бўш!");
    return;
  }

  let rows = "";
  log.forEach((item, i) => {
    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${item.timestamp}</td>
        <td>${item.userName || item.user}</td>
        <td>${item.roleName || item.role}</td>
        <td>${formatActionName(item.action)}</td>
        <td>${(item.details || "").replace(/</g, "&lt;")}</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Вақт</th>
          <th>Фойдаланувчи</th>
          <th>Роль</th>
          <th>Амал</th>
          <th>Тафсилот</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const now = getNow();
  downloadBlobFile(
    wrapFramedExportHtml("АУДИТ-ЛОГ — Ким нима ўзгартирди", table),
    `Audit_Log_${now.date.replace(/\./g, "_")}.xls`,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_AUDIT", `${log.length} та ёзув`);
  }
}

// =========================================================================
// 9. БИТТА НОМЗОДНИНГ ТАРИХИ (TIMELINE) — EXCEL
// =========================================================================

function exportCandidateHistoryExcel(candidateId) {
  const c = appState.candidates.find(x => x.id === candidateId);
  if (!c) return;

  const history = getCandidateHistory(candidateId);

  if (history.length === 0) {
    alert("Бу номзод бўйича тарих мавжуд эмас!");
    return;
  }

  let rows = "";
  history.forEach((item, i) => {
    let displayText = (item.details || "").replace(/CAND-\d+\s*\|\s*/g, "");
    const parts = displayText.split("|");
    if (parts.length > 1) {
      displayText = parts.slice(1).join("|").trim();
    }

    rows += `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${item.timestamp}</td>
        <td>${formatActionName(item.action)}</td>
        <td>${displayText}</td>
        <td>${item.userName || item.user} (${item.roleName || item.role})</td>
      </tr>
    `;
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Т/р</th>
          <th>Вақт</th>
          <th>Амал</th>
          <th>Тафсилот</th>
          <th>Ким</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const safeName = c.fio.replace(/\s+/g, "_").replace(/[^\w\u0400-\u04FF_-]/g, "");
  downloadBlobFile(
    wrapFramedExportHtml(`ЖАРАЁН ТАРИХИ — ${c.fio}`, table),
    `Tarix_${safeName}.xls`,
    "application/vnd.ms-excel;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_HISTORY", `${c.fio} тарихи юкланди`);
  }
}

// =========================================================================
// 10. JSON ЗАХИРА (тўлиқ база)
// =========================================================================

function exportFullBackupJson() {
  if (currentRole !== ROLES.KORRUPSIYA) {
    alert("Рухсат йўқ!");
    return;
  }

  const now = getNow();
  const backup = {
    exportedAt: now.dateTime,
    exportedBy: currentUser?.login || "unknown",
    version: appState.version,
    totalCandidates: appState.candidates.length,
    totalUsers: appState.users.length,
    data: appState
  };

  const filename = `KOMPLAYENS_BACKUP_${now.date.replace(/\./g, "_")}_${now.time.replace(/:/g, "")}.json`;

  downloadBlobFile(
    JSON.stringify(backup, null, 2),
    filename,
    "application/json;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("EXPORT_BACKUP_JSON", `${filename} юкланди`);
  }
}

// =========================================================================
// 11. CSV ЭКСПОРТ (умумий)
// =========================================================================

function exportToCsv(data, headers, filename) {
  if (!Array.isArray(data) || data.length === 0) {
    alert("Маълумот йўқ!");
    return;
  }

  // Header
  let csv = headers.map(h => `"${h}"`).join(",") + "\n";

  // Rows
  data.forEach(row => {
    csv += row.map(cell => {
      const val = String(cell || "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(",") + "\n";
  });

  downloadBlobFile(csv, filename, "text/csv;charset=utf-8");
}

// -------------------- ЛОГ ----------
console.log("✅ 10-export.js юкланди");
