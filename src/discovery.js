const { Bonjour } = require("bonjour-service");
const { BrowserWindow, ipcMain } = require("electron");
const dgram = require("dgram");
const os = require("os");

const HEARTBEAT_PORT = 3738;
const SERVICE_PORT = 3737;
const OFFLINE_THRESHOLD_MS = 2000;

const hostName = os.hostname();

// Make FileDropper discoverable on the local network
const bonjourInstance = new Bonjour();
bonjourInstance.publish({ name: hostName, type: "filedropper", protocol: "tcp", port: SERVICE_PORT });

let devicesDetected = new Map();
const deviceFinder = bonjourInstance.find({ type: "filedropper", protocol: "tcp" });

// mDNS doesn't always notify quickly when a device goes offline, so we
// complement it with UDP heartbeats to know in real time who's still online
const udpServer = dgram.createSocket("udp4");

udpServer.on("message", (msg, rinfo) => {
    if (msg.toString() !== "HEARTBEAT_ALIVE") return;

    for (const [fqdn, device] of devicesDetected.entries()) {
        if (device.IP === rinfo.address) {
            device.isOnline = true;
            device.lastSeen = Date.now();
            devicesDetected.set(fqdn, device);
        }
    }
});

udpServer.bind(HEARTBEAT_PORT);

function getDeviceNameByIp(ip) {
    const devices = Array.from(devicesDetected.values());
    const device = devices.find(d => d.IP === ip || d.addresses?.includes(ip));
    return device ? device.name : ip;
}

deviceFinder.on("up", (service) => {
    if (service.name === hostName) return;
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

// Periodically tells other devices that the user is still active on the app
setInterval(() => {
    const client = dgram.createSocket("udp4");
    for (const device of devicesDetected.values()) {
        if (device.IP) {
            client.send("HEARTBEAT_ALIVE", HEARTBEAT_PORT, device.IP, (err) => {
                if (err) console.error(err);
            });
        }
    }
}, 1000);

ipcMain.handle("check-online-status", async () => {
    const now = Date.now();
    for (const device of devicesDetected.values()) {
        if (now - device.lastSeen > OFFLINE_THRESHOLD_MS) {
            device.isOnline = false;
        }
    }
    return Array.from(devicesDetected.values());
});

module.exports = { devicesDetected, getDeviceNameByIp };