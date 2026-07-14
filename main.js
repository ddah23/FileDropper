const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const { startServer } = require("./src/server");
const { devicesDetected } = require("./src/discovery");
const { sendFiles } = require("./src/sender");
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
            // Disabled so local resources (toast audio, etc.) can load without CORS issues
            webSecurity: false
        }
    })
    win.loadFile("render/index.html");
}

ipcMain.handle("get-devices", () => {
    return Array.from(devicesDetected.values());
})

ipcMain.handle("open-folder", (event, targetPath) => {
    shell.showItemInFolder(targetPath);
})

ipcMain.handle("open-desktop", () => {
    const desktopDir = path.join(os.homedir(), "Desktop");
    shell.openPath(desktopDir);
})

let targetIP = null;
ipcMain.handle("set-selected-ip", (event, ip) => {
    targetIP = ip;
    return true;
})

ipcMain.on("send-file", (event, files) => {
    if (!targetIP) return;
    sendFiles(files, targetIP);
})

app.whenReady().then(() => {
    createWindow();
    startServer();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
})