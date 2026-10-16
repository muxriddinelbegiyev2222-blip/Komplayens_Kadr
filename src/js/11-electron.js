// =========================================================================
// 11-ELECTRON.JS — D:\ диск билан ишлаш, Захира, Тиклаш
// «КОМПЛАЕНС-КАДР» v9.0
// Electron + Brauzer режимларини қўллаб-қувватлайди
// =========================================================================

// =========================================================================
// D:\ ДИСККА УЛАНИШ
// =========================================================================

async function connectDDriveFolder() {
  // ⚡ Electron реjimida
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.saveToDDrive(appState);

      if (result.ok) {
        updateDDriveBadge(true);
        showToast(`✅ База D:\\ дискга сақланди`, "success");

        if (typeof addAuditLog === "function") {
          addAuditLog("D_DRIVE_CONNECT", `D:\\ диск уланди: ${result.path}`);
        }
      } else {
        alert("❌ Хатолик: " + result.error);
      }
    } catch (e) {
      console.error("Electron save error:", e);
      alert("❌ D:\\ дискка сақлашда хато: " + e.message);
    }
    return;
  }

  // 🌐 Brauzer реjimida (File System Access API)
  if (!("showSaveFilePicker" in window)) {
    // Fallback: оддий download
    downloadBackupJson();
    return;
  }

  try {
    dDriveFileHandle = await window.showSaveFilePicker({
      suggestedName: "komplayens_kadr_baza.json",
      types: [{
        description: "JSON Database",
        accept: { "application/json": [".json"] }
      }]
    });

    await autoWriteToDDrive();
    updateDDriveBadge(true);

    if (typeof addAuditLog === "function") {
      addAuditLog("D_DRIVE_CONNECT", "D:\\ диск (браузер) уланди");
    }

    showToast("✅ D:\\ диск уланди", "success");
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("D drive picker cancelled by user");
    } else {
      console.warn("D drive picker error:", e);
    }
  }
}

// =========================================================================
// АВТОМАТИК ЁЗИШ (ҳар saveState да чақирилади)
// =========================================================================

async function autoWriteToDDrive() {
  if (!appState) return;

  // ⚡ Electron реjimida
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.saveToDDrive(appState);
      if (result.ok) {
        updateDDriveBadge(true);
      } else {
        updateDDriveBadge(false);
      }
    } catch (e) {
      console.warn("Electron auto-write warning:", e);
      updateDDriveBadge(false);
    }
    return;
  }

  // 🌐 Brauzer реjimida
  if (!dDriveFileHandle) return;

  try {
    const writable = await dDriveFileHandle.createWritable();
    await writable.write(JSON.stringify(appState, null, 2));
    await writable.close();
  } catch (e) {
    console.warn("Auto write warning:", e);
    updateDDriveBadge(false);
  }
}

// =========================================================================
// D:\ BADGE ЯНГИЛАШ
// =========================================================================

function updateDDriveBadge(isActive) {
  const badge = document.getElementById("dDriveStatusBadge");
  if (!badge) return;

  if (isActive) {
    badge.textContent = "💾 D:\\ Авто-сақлаш ёқилган";
    badge.className = "text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded font-semibold";
  } else {
    badge.textContent = "💾 D:\\ Авто-сақлаш ўчирилган";
    badge.className = "text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-semibold";
  }
}

// =========================================================================
// ЗАХИРА НУСХА ЮКЛАБ ОЛИШ (JSON)
// =========================================================================

async function downloadBackupJson() {
  if (!appState) {
    alert("Маълумот йўқ!");
    return;
  }

  const now = getNow();
  const filename = `komplayens_kadr_baza_${now.date.replace(/\./g, "_")}.json`;

  // ⚡ Electron реjimida — D:\ дискка тўғридан-тўғри сақлаш
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.saveToDDrive(appState);

      if (result.ok) {
        if (typeof addAuditLog === "function") {
          addAuditLog("BACKUP", `D:\\ дискка сақланди: ${result.path}`);
        }
        showToast(`✅ База сақланди: ${result.path}`, "success");
      } else {
        alert("❌ Хатолик: " + result.error);
      }
    } catch (e) {
      console.error("Electron backup error:", e);
      alert("❌ Захира олишда хато: " + e.message);
    }
    return;
  }

  // 🌐 Brauzer реjimida — оддий download
  downloadBlobFile(
    JSON.stringify(appState, null, 2),
    filename,
    "application/json;charset=utf-8"
  );

  if (typeof addAuditLog === "function") {
    addAuditLog("BACKUP", `JSON файл юкланди: ${filename}`);
  }
}

// =========================================================================
// ЗАХИРАДАН ТИКЛАШ (JSON)
// =========================================================================

async function restoreBackupJson(ev) {
  // ⚡ Electron реjimida — dialog орқали файл танлаш
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.selectJsonFile();

      if (!result.ok) {
        if (result.error) {
          alert("❌ Хатолик: " + result.error);
        }
        return;
      }

      if (!result.data || !Array.isArray(result.data.candidates)) {
        alert("❌ Файл формати нотўғри!\n«candidates» массиви топилмади.");
        return;
      }

      const count = result.data.candidates.length;
      const usersCount = result.data.users ? result.data.users.length : 0;

      if (!confirm(
        `⚠️ Захирадан тиклаш\n\n` +
        `📊 Номзодлар: ${count} та\n` +
        `👤 Фойдаланувчилар: ${usersCount} та\n` +
        `📅 Версия: ${result.data.version || "?"}\n\n` +
        `Жорий маълумотлар ЎЧИРИЛАДИ ва захира билан алмаштирилади!\n\n` +
        `Давом этмоқчимисиз?`
      )) return;

      // Тиклаш
      appState = result.data;
      appState.version = (appState.version || 0) + 1;

      if (typeof addAuditLog === "function") {
        addAuditLog("RESTORE", `Захирадан тикланди: ${count} та номзод`);
      }

      saveState();
      renderAll();

      showToast(`✅ Захира тикланди: ${count} та номзод`, "success");

    } catch (e) {
      console.error("Restore error:", e);
      alert("❌ Тиклашда хато: " + e.message);
    }
    return;
  }

  // 🌐 Brauzer реjimida — input орқали
  if (!ev || !ev.target || !ev.target.files) return;

  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      if (!parsed || !Array.isArray(parsed.candidates)) {
        alert("❌ Файл формати нотўғри!\n«candidates» массиви топилмади.");
        return;
      }

      const count = parsed.candidates.length;
      const usersCount = parsed.users ? parsed.users.length : 0;

      if (!confirm(
        `⚠️ Захирадан тиклаш\n\n` +
        `📊 Номзодлар: ${count} та\n` +
        `👤 Фойдаланувчилар: ${usersCount} та\n\n` +
        `Жорий маълумотлар ЎЧИРИЛАДИ!\n\n` +
        `Давом этмоқчимисиз?`
      )) return;

      appState = parsed;
      appState.version = (appState.version || 0) + 1;

      if (typeof addAuditLog === "function") {
        addAuditLog("RESTORE", `Захирадан тикланди (браузер): ${count} та номзод`);
      }

      saveState();
      renderAll();

      showToast(`✅ Захира тикланди: ${count} та номзод`, "success");

    } catch (err) {
      console.error("Parse error:", err);
      alert("❌ Файл формати нотўғри!");
    }
  };

  reader.readAsText(file);

  // Input ни тозалаш (кейинги юклаш учун)
  ev.target.value = "";
}

// =========================================================================
// 🆕 АВТОМАТИК ТИКЛАШ (дастур ишга тушганда)
// =========================================================================

async function autoLoadFromDDrive() {
  // ⚡ Electron реjimида
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.loadFromDDrive();

      if (result.ok && result.data && Array.isArray(result.data.candidates)) {
        // Фақат localStorage бўш бўлса тиклаш
        const localRaw = localStorage.getItem(STORAGE_KEY);

        if (!localRaw) {
          console.log("📂 D:\\ дискдан автоматик тиклаш");
          appState = result.data;

          if (typeof renderAll === "function") {
            renderAll();
          }

          showToast(`📂 D:\\ дискдан тикланди (${result.data.candidates.length} та номзод)`, "info");
        }
      }
    } catch (e) {
      console.warn("Auto-load from D drive warning:", e);
    }
  }
}

// =========================================================================
// 🆕 D:\ ДИСК ҲОЛАТИНИ ТЕКШИРИШ
// =========================================================================

async function checkDDriveStatus() {
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    try {
      const result = await window.ElectronAPI.loadFromDDrive();

      if (result.ok) {
        updateDDriveBadge(true);
        return true;
      } else {
        updateDDriveBadge(false);
        return false;
      }
    } catch (e) {
      updateDDriveBadge(false);
      return false;
    }
  }

  // Brauzer реjимida
  if (dDriveFileHandle) {
    updateDDriveBadge(true);
    return true;
  }

  updateDDriveBadge(false);
  return false;
}

// =========================================================================
// 🆕 ФАЙЛ ЮКЛАШ ОЙНАСИ (рухсат текшируви билан)
// =========================================================================

function openRestoreBackupDialog() {
  if (currentRole !== ROLES.KORRUPSIYA) {
    alert("Рухсат йўқ! Фақат Коррупцияга қарши курашиш бўлими захирани тиклай олади.");
    return;
  }

  if (!confirm(
    "⚠️ Захирадан тиклаш\n\n" +
    "Жорий маълумотлар ЎЧИРИЛАДИ ва захира билан алмаштирилади!\n\n" +
    "Давом этмоқчимисиз?"
  )) return;

  // Файл танлаш ойнасини очиш
  const fileInput = document.getElementById("restoreFileInput");
  if (fileInput) {
    fileInput.click();
  } else {
    // Fallback
    restoreBackupJson(null);
  }
}

// =========================================================================
// 🆕 EXCEL ДАН ИМПОРТ (келажакда)
// =========================================================================

async function importFromExcel(file) {
  if (!file) return;

  if (currentRole !== ROLES.KORRUPSIYA) {
    alert("Рухсат йўқ!");
    return;
  }

  // Ҳозирча фақат JSON
  if (!file.name.endsWith(".json")) {
    alert("⚠️ Ҳозирча фақат JSON формати қўллаб-қувватланади.\n\nExcel импорт келажакда қўшилади.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      // ... (келажакда)
    } catch (err) {
      alert("❌ Файл формати нотўғри!");
    }
  };
  reader.readAsText(file);
}

// =========================================================================
// 🆕 D:\ ПАПКА ҲАҚИДА МАЪЛУМОТ
// =========================================================================

function showDDriveInfo() {
  const info = `
📂 D:\\Komplayens_Kadr_Baza\\

Қуйидаги файл сақланади:
• komplayens_kadr_baza.json

Бу файлда:
• Барча номзодлар
• Барча фойдаланувчилар
• Аудит-лог
• Уведомлениялар

Ҳар бир ўзгариш автоматик сақланади.
  `;
  alert(info);
}

// =========================================================================
// 🆕 D:\ ДИСККА ҚЎЛДА САҚЛАШ (тугма)
// =========================================================================

async function manualSaveToDDrive() {
  if (!appState) {
    alert("Маълумот йўқ!");
    return;
  }

  // ⚡ Electron
  if (window.ElectronAPI && window.ElectronAPI.isElectron) {
    const result = await window.ElectronAPI.saveToDDrive(appState);

    if (result.ok) {
      updateDDriveBadge(true);
      showToast(`✅ D:\\ дискга сақланди: ${result.path}`, "success");

      if (typeof addAuditLog === "function") {
        addAuditLog("MANUAL_SAVE", `D:\\ дискга қўлда сақланди`);
      }
    } else {
      alert("❌ Хатолик: " + result.error);
    }
    return;
  }

  // 🌐 Brauzer
  if (dDriveFileHandle) {
    try {
      const writable = await dDriveFileHandle.createWritable();
      await writable.write(JSON.stringify(appState, null, 2));
      await writable.close();

      showToast("✅ D:\\ дискга сақланди", "success");
    } catch (e) {
      alert("❌ Хатолик: " + e.message);
    }
  } else {
    // Ҳали уланмаган — улашни бошлаш
    connectDDriveFolder();
  }
}

// -------------------- ЛОГ ----------
console.log("✅ 11-electron.js юкланди");
