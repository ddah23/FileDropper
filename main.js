const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const { startServer } = require("./src/server");
const { devicesDetected } = require("./src/discovery");
const fs = require("fs");
const http = require('http');
const { formidable } = require("formidable");
const { isFolder } = require("./src/fileHandler");
const { addSent } = require("./src/history");
const { Transform } = require("stream");
const axios = require("axios");
const os = require("os");

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 900,
        height: 600,
        resizable: false,
        center: true,
        autoHideMenuBar: true,
        icon: path.join(__dirname, "public", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    })
    win.loadFile("render/index.html")
}

ipcMain.handle("get-devices", () => {
    return Array.from(devicesDetected.values()) // Convertir map en arreglo
})

ipcMain.handle("open-folder", (event, path) => {
    shell.showItemInFolder(path);
});

ipcMain.handle("open-desktop", () => {
    const desktopDir = path.join(os.homedir(), "Desktop");
    shell.openPath(desktopDir);
});

let targetIP = null;
ipcMain.handle("set-selected-ip", (event, ip) => {
    targetIP = ip;
    return true;
})

ipcMain.on("send-file", async (event, files) => {
    if (!targetIP) return;
    const win = BrowserWindow.getAllWindows()[0];

    for (const file of files) {
        let nombreParaEnviar = file.name; // Declarada aquí para que sea accesible en el catch
        try {
            const stats = fs.statSync(file.path);
            const esCarpeta = stats.isDirectory();
            const pathParaEnviar = await isFolder(file.path);
            nombreParaEnviar = esCarpeta ? `${file.name}.folder.zip` : file.name;

            const fileBlob = await fs.openAsBlob(pathParaEnviar);
            const totalBytes = fileBlob.size;

            const formData = new globalThis.FormData();
            formData.append("file", fileBlob, nombreParaEnviar);

            await axios.post(`http://${targetIP}:3737/upload`, formData, {
                timeout: 0,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || totalBytes;
                    let percentage = Math.round((progressEvent.loaded / total) * 100);
                    if (percentage >= 100) percentage = 99;
                    if (win) win.webContents.send("transfer-progress", percentage);
                }
            });

            if (win) win.webContents.send("transfer-progress", 100);
            if (esCarpeta) fs.unlinkSync(pathParaEnviar);

            if (win) win.webContents.send("transfer-done", { name: file.name, size: totalBytes });
            addSent({
                name: file.name,
                size: totalBytes,
                destination: targetIP,
                status: 'ok',
                timestamp: new Date().toISOString()
            });
            console.log(`Enviado con éxito: ${nombreParaEnviar}`);
        } catch (error) {
            if (win) win.webContents.send("transfer-error", { name: nombreParaEnviar, size: 0, message: error.message });
            addSent({
                name: nombreParaEnviar,
                size: 0,
                destination: targetIP,
                status: 'error',
                timestamp: new Date().toISOString()
            });
            console.error("Error al enviar:", error.message);
        }
    }
});


app.whenReady().then(() => {
    createWindow();
    startServer();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})