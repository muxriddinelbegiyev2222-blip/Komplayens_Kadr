const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// 1. Дастур менюсини ўчириш (кимдир менюдан кирмаслиги учун)
Menu.setApplicationMenu(null);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    title: 'KOMPLAYENS-KADR v10.0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false // 2. DevTools ни тўлиқ блоклаш
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // 3. F12 ва Ctrl+Shift+I ни блоклаш (ички ходим кирмаслиги учун)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.key === 'F12' || 
      (input.control && input.shift && input.key.toLowerCase() === 'i') ||
      (input.control && input.shift && input.key.toLowerCase() === 'j') ||
      (input.control && input.key.toLowerCase() === 'u')
    ) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// D:\ дискка сақлаш
ipcMain.handle('save-to-d-drive', async (event, data) => {
  try {
    const dPath = 'D:\\Komplayens_Kadr_Baza';
    if (!fs.existsSync(dPath)) fs.mkdirSync(dPath, { recursive: true });
    const filePath = path.join(dPath, 'komplayens_kadr_baza.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// D:\ дискдан ўқиш
ipcMain.handle('load-from-d-drive', async () => {
  try {
    const filePath = 'D:\\Komplayens_Kadr_Baza\\komplayens_kadr_baza.json';
    if (!fs.existsSync(filePath)) return { ok: false, error: 'Fayl topilmadi' };
    const data = fs.readFileSync(filePath, 'utf-8');
    return { ok: true, data: JSON.parse(data) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// JSON файл танлаш
ipcMain.handle('select-json-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled) return { ok: false };
  try {
    const data = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { ok: true, data: JSON.parse(data) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
