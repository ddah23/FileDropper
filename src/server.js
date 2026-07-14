const http = require("http");
const Busboy = require("busboy");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { BrowserWindow } = require("electron");
const AdmZip = require("adm-zip");
const { getDeviceNameByIp } = require("./discovery");

const PORT = 3737;
const server = http.createServer((req, res) => {
    if (req.method !== "POST") return;

    const rawIp = req.socket ? req.socket.remoteAddress : "";
    // IPv4 connections arrive mapped as "::ffff:x.x.x.x"; strip to compare against device.IP
    const originIp = rawIp ? rawIp.replace(/^.*:/, "") : "127.0.0.1";

    const busboy = Busboy({ headers: req.headers });
    const desktopDir = path.join(os.homedir(), "Desktop");

    busboy.on("file", (fieldname, file, info) => {
        const { filename } = info;
        const tempPath = path.join(os.tmpdir(), filename);
        const writeStream = fs.createWriteStream(tempPath);

        writeStream.on("finish", () => {
            const originName = getDeviceNameByIp(originIp);

            // Folders arrive compressed: extract directly to Desktop and discard the temporary zip
            if (filename.endsWith(".zip")) {
                const zip = new AdmZip(tempPath);
                zip.extractAllTo(desktopDir, true);
                fs.unlinkSync(tempPath);
            } else {
                fs.renameSync(tempPath, path.join(desktopDir, filename));
            }

            const windows = BrowserWindow.getAllWindows();
            if (windows.length > 0) windows[0].webContents.send("file-received", { name: filename, size: 0, origin: originName });
        });

        file.pipe(writeStream);
    });

    busboy.on("finish", () => res.end("OK"));
    req.pipe(busboy);
});

function startServer() {
    server.listen(PORT);
}

module.exports = { startServer };