const devicesGrid = document.getElementById("devices-grid");

function addDevices(devices) {
    const devicesList = Array.isArray(devices) ? devices : [devices];
    // If it's a complete array, it's a full refresh; if it's a single device, it's a targeted update
    if (Array.isArray(devices)) {
        devicesGrid.innerHTML = "";
    }

    devicesList.forEach(device => {
        const existingCard = document.getElementById(`device-${device.fqdn}`);
        if (existingCard) existingCard.remove();
        devicesGrid.style.marginTop = "36px";

        if (device.isOnline === true) {
            devicesGrid.insertAdjacentHTML("beforeend", `
                <div class="device-card online" id="device-${device.fqdn}">
                    <div class="device-icon">
                        <span class="material-symbols-rounded">desktop_windows</span>
                    </div>
                    <div class="device-info">
                        <div class="device-name" data-name="${device.name}">${device.name}</div>
                        <div class="device-status">
                            <div class="status-dot online"></div>
                        </div>
                    </div>
                    <button class="connect-btn" data-ip="${device.IP}">Connect</button>
                </div>
            `);
        } else {
            devicesGrid.insertAdjacentHTML("beforeend", `
                <div class="device-card offline" id="device-${device.fqdn}">
                    <div class="device-icon">
                        <span class="material-symbols-rounded">desktop_windows</span>
                    </div>
                    <div class="device-info">
                        <div class="device-name">${device.name}</div>
                        <div class="device-status">
                            <div class="status-dot offline"></div>
                        </div>
                    </div>
                    <button class="connect-btn" disabled>Offline</button>
                </div>
            `);
        }
    });
}

async function loadDevices() {
    const deviceList = await window.api.getDevices();
    addDevices(deviceList);
}
loadDevices();

window.api.onDeviceDiscovered((device) => {
    addDevices(device);
});

const screenDevices = document.getElementById("screen-devices");
const screenMain = document.getElementById("screen-main");
let deviceIp;

devicesGrid.addEventListener("click", async (e) => {
    if (!e.target || !e.target.classList.contains("connect-btn")) return;

    deviceIp = e.target.dataset.ip;
    const selected = await window.api.setSelectedIP(deviceIp);

    const card = e.target.closest(".device-card");
    const deviceName = card.querySelector(".device-name").textContent;

    if (selected) {
        screenDevices.classList.add("hidden");
        screenMain.classList.remove("hidden");

        const topbarName = document.getElementById("topbar-name");
        topbarName.textContent = deviceName;
    }
});

// Checks every second if discovered devices are still online and updates the grid.
setInterval(async () => {
    const devices = await window.api.checkOnlineStatus();

    devices.forEach(device => {
        const existingCard = document.getElementById(`device-${device.fqdn}`);

        if (!existingCard) {
            if (device.isOnline) addDevices(device);
            return;
        }

        if (!device.isOnline) {
            existingCard.className = "device-card offline";
            existingCard.querySelector(".status-dot").className = "status-dot offline";
            const btn = existingCard.querySelector(".connect-btn");
            if (btn) {
                btn.disabled = true;
                btn.innerText = "Offline";
            }

            // If the device that went down is the one currently connected, go back to the selection screen
            const isInMain = !screenMain.classList.contains("hidden");
            const isConnected = device.IP === deviceIp;
            if (isInMain && isConnected) {
                screenDevices.classList.remove("hidden");
                screenMain.classList.add("hidden");
            }
        } else {
            existingCard.className = "device-card online";
            existingCard.querySelector(".status-dot").className = "status-dot online";
            const btn = existingCard.querySelector(".connect-btn");
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Connect";
            }
        }
    });
}, 1000);

document.getElementById("disconnect-btn").addEventListener("click", () => {
    screenDevices.classList.remove("hidden");
    screenMain.classList.add("hidden");
    deviceIp = undefined;
});