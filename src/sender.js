const fs = require("fs");
const axios = require("axios");
const { BrowserWindow } = require("electron");
const { isFolder } = require("./fileHandler");

// Sends one or multiple files to the target device; reports progress
async function sendFiles(files, targetIP) {
    const mainWindow = BrowserWindow.getAllWindows()[0];

    for (const file of files) {
        let filenameToSend = file.name;
        try {
            const stats = fs.statSync(file.path);
            const isDirectory = stats.isDirectory();
            // If it's a folder, isFolder compresses it to a temporary .zip before uploading
            const pathToSend = await isFolder(file.path);
            filenameToSend = isDirectory ? `${file.name}.folder.zip` : file.name;

            const fileBlob = await fs.openAsBlob(pathToSend);
            const totalBytes = fileBlob.size;

            const formData = new globalThis.FormData();
            formData.append("file", fileBlob, filenameToSend);

            await axios.post(`http://${targetIP}:3737/upload`, formData, {
                timeout: 0,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || totalBytes;
                    // Capped at 99%: actual 100% is sent manually when the request completes
                    let percentage = Math.round((progressEvent.loaded / total) * 100);
                    if (percentage >= 100) percentage = 99;
                    if (mainWindow) mainWindow.webContents.send("transfer-progress", percentage);
                }
            });

            if (mainWindow) mainWindow.webContents.send("transfer-progress", 100);
            if (isDirectory) fs.unlinkSync(pathToSend);

            if (mainWindow) mainWindow.webContents.send("transfer-done", { name: file.name, size: totalBytes });
            console.log(`Successfully sent: ${filenameToSend}`);
        } catch (error) {
            if (mainWindow) mainWindow.webContents.send("transfer-error", { name: filenameToSend, size: 0, message: error.message });
            console.error("Error sending file:", error.message);
        }
    }
}

module.exports = { sendFiles };