const { Bonjour } = require("bonjour-service");
const { BrowserWindow, ipcMain } = require("electron");
const dgram = require("dgram");
const os = require("os");

const myHostName = os.hostname();
const instance = new Bonjour();
instance.publish({ name: `${myHostName}`, type: "filedropper", protocol: "tcp", port: 3737 });

let devicesDetected = new Map();
const deviceFinder = instance.find({ type: "filedropper", protocol: "tcp" });

const udpServer = dgram.createSocket("udp4");

udpServer.on("message", (msg, rinfo) => {
    if (msg.toString() === "HEARTBEAT_ALIVE") {
        for (const [fqdn, device] of devicesDetected.entries()) {
            if (device.IP === rinfo.address) {
                device.isOnline = true;
                device.lastSeen = Date.now();
                devicesDetected.set(fqdn, device);
            }
        }
    }
});

udpServer.bind(3738);

function getDeviceNameByIp(ip) {
    const devices = Array.from(devicesDetected.values());
    const device = devices.find(d => d.IP === ip || d.addresses?.includes(ip));
    return device ? device.name : ip;
}

deviceFinder.on("up", (service) => {
    if (service.name === myHostName) return;
    const ip = service.addresses.find(address => address.includes("."));

    const newDevice = {
        name: service.name,
        IP: ip,
        ...service,
        isOnline: true,
        lastSeen: Date.now()
    };
    devicesDetected.set(service.fqdn, newDevice);

    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send("device-discovered", newDevice);
    }
});

setInterval(() => {
    const client = dgram.createSocket("udp4");
    for (const device of devicesDetected.values()) {
        if (device.IP) {
            client.send("HEARTBEAT_ALIVE", 3738, device.IP, (err) => {
                if (err) console.error(err);
            });
        }
    }
}, 1000);

ipcMain.handle("check-online-status", async () => {
    const now = Date.now();
    for (const [fqdn, device] of devicesDetected.entries()) {
        if (now - device.lastSeen > 2000) {
            device.isOnline = false;
        }
    }
    return Array.from(devicesDetected.values());
});

module.exports = { devicesDetected, getDeviceNameByIp };