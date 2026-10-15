const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ElectronAPI', {
  saveToDDrive: (data) => ipcRenderer.invoke('save-to-d-drive', data),
  loadFromDDrive: () => ipcRenderer.invoke('load-from-d-drive'),
  selectJsonFile: () => ipcRenderer.invoke('select-json-file'),
  isElectron: true
});
