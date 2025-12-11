// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- Initial Window Functions (Used by index.html) ---
    
    // Sends the initial password from index.html to main.js for file processing
    sendPasswordAndRequestFile: (password) => {
        return ipcRenderer.invoke('decrypt-and-print-pdf', password);
    },
    // Listens for the final deletion status from main.js (for index.html)
    onFileOperationResult: (callback) => {
        ipcRenderer.on('file-operation-result', (event, ...args) => callback(...args));
    },
    

});