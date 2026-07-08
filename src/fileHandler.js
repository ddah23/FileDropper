const fs = require("fs");
const path = require("path");
const os = require("os");
const AdmZip = require("adm-zip");

async function isFolder(filePath) {
    const folder = fs.statSync(filePath).isDirectory();

    if (folder) {
        const tempPath = path.join(os.tmpdir(), "temp_transfer.zip");
        const zip = new AdmZip();

        const folderName = path.basename(filePath);
        zip.addLocalFolder(filePath, folderName);

        zip.writeZip(tempPath);

        return tempPath;
    } else {
        return filePath;
    }
}

module.exports = { isFolder };