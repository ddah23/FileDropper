const { contextBridge, ipcRenderer, webUtils } = require("electron")

contextBridge.exposeInMainWorld("api", {
    // Petición y respuesta
    getDevices: () => ipcRenderer.invoke("get-devices"),
    checkOnlineStatus: () => ipcRenderer.invoke("check-online-status"),
    setSelectedIP: (ip) => ipcRenderer.invoke("set-selected-ip", ip),
    openFolder: (path) => ipcRenderer.invoke("open-folder", path),
    openDesktop: () => ipcRenderer.invoke("open-desktop"),
    
    getFilePath: (file) => webUtils.getPathForFile(file),

    // Renderer pide acciones al main (envío de datos)
    sendFile: (files) => ipcRenderer.send('send-file', files),
    getHistory: () => ipcRenderer.send("get-history"),

    // Limpia el canal antes de una nueva transferencia
    clearProgress: () => ipcRenderer.removeAllListeners("transfer-progress"),

    // Main notifica eventos al renderer (escucha de eventos)
    transferProgress: (callback) => ipcRenderer.on("transfer-progress", (event, percentage) => callback(percentage)),
    transferDone: (callback) => ipcRenderer.on("transfer-done", (event, success) => callback(success)),
    transferError: (callback) => ipcRenderer.on("transfer-error", (event, error) => callback(error)),
    fileReceived: (callback) => ipcRenderer.on("file-received", (event, file) => callback(file)),
    onDeviceDiscovered: (callback) => ipcRenderer.on("device-discovered", (event, value) => callback(value)),
    onDeviceDisconnected: (callback) => ipcRenderer.on("device-disconnected", (event, fqdn) => callback(fqdn))
});