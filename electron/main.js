const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    title: 'KOMPLAYENS-KADR v7.0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// D:\ diskka saqlash
ipcMain.handle('save-to-d-drive', async (event, data) => {
  try {
    const dPath = 'D:\\Komplayens_Kadr_Baza';
    
    if (!fs.existsSync(dPath)) {
      fs.mkdirSync(dPath, { recursive: true });
    }
    
    const filePath = path.join(dPath, 'komplayens_kadr_baza.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return { ok: true, path: filePath };
  } catch (e) {
    // Agar D:\ yo'q bo'lsa, foydalanuvchi papkasiga saqlaymiz
    try {
      const fallbackPath = path.join(app.getPath('userData'), 'komplayens_kadr_baza.json');
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf-8');
      return { ok: true, path: fallbackPath };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
});

// D:\ diskdan o'qish
ipcMain.handle('load-from-d-drive', async () => {
  try {
    const filePath = 'D:\\Komplayens_Kadr_Baza\\komplayens_kadr_baza.json';
    
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'Fayl topilmadi' };
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return { ok: true, data: JSON.parse(data) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// JSON fayl tanlash
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
