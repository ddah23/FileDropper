const fs = require("fs");
const axios = require("axios");
const { BrowserWindow } = require("electron");

async function enviarArchivo(filePath, targetIp) {
    const win = BrowserWindow.getAllWindows();

    try {
        const totalSize = fs.statSync(filePath).size;
        const fileBlob = await fs.openAsBlob(filePath);

        const formData = new FormData();
        formData.append("file", fileBlob, require("path").basename(filePath));

        const res = await axios.post(`http://${targetIp}:3737/receive`, formData, {
            onUploadProgress: (progressEvent) => {
                const total = progressEvent.total || totalSize;
                const percentage = Math.round((progressEvent.loaded / total) * 100);
                if (win.length > 0) win[0].webContents.send("transfer-progress", percentage);
            }
        });

        if (win.length > 0) win[0].webContents.send("transfer-done");
    } catch (error) {
        if (win.length > 0) win[0].webContents.send("transfer-error");
    }
}

module.exports = { enviarArchivo };