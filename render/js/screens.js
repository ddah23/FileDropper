// Listar dispositivos disponibles
const devicesGrid = document.getElementById("devices-grid");

function addDevices(devices) {
    devicesList = Array.isArray(devices) ? devices : [devices];
    if (Array.isArray(devices)) {
        devicesGrid.innerHTML = "";
    }

    devicesList.forEach(device => {
        const existingCard = document.getElementById(`device-${device.fqdn}`);
        if (existingCard) existingCard.remove();
        devicesGrid.style.marginTop = "36px";

        if (device.isOnline === true) {
            devicesGrid.insertAdjacentHTML("beforeend",
                `
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
                    <button class="connect-btn" data-ip="${device.IP}">Conectar</button>
                </div>
            `
            )
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
                    <button class="connect-btn" disabled>Sin conexión</button>
                </div>
            `
            )
        }
    })
}

async function loadDevices() {
    const deviceList = await window.api.getDevices();
    addDevices(deviceList);

}
loadDevices();

window.api.onDeviceDiscovered((device) => {
    addDevices(device);
});

// Navegar entre Screens
const screenDevices = document.getElementById("screen-devices");
const screenMain = document.getElementById("screen-main");
let deviceIp;

devicesGrid.addEventListener("click", async (e) => {
    if (e.target && e.target.classList.contains("connect-btn")) {
        deviceIp = e.target.dataset.ip;
        selectedIp = await window.api.setSelectedIP(deviceIp);

        const card = e.target.closest(".device-card");
        const deviceName = card.querySelector(".device-name").textContent;

        if (selectedIp) {
            screenDevices.classList.add("hidden");
            screenMain.classList.remove("hidden");

            const topbarName = document.getElementById("topbar-name");
            topbarName.textContent = `${deviceName}`;
        }
    }
});

// Revisa cada 3 segundos el estado real
setInterval(async () => {
    const devices = await window.api.checkOnlineStatus();

    devices.forEach(device => {
        const existingCard = document.getElementById(`device-${device.fqdn}`);

        if (existingCard) {
            if (!device.isOnline) {
                existingCard.className = "device-card offline";
                existingCard.querySelector(".status-dot").className = "status-dot offline";
                const btn = existingCard.querySelector(".connect-btn");
                if (btn) {
                    btn.disabled = true;
                    btn.innerText = "Sin conexión";
                }

                const isInMain = !screenMain.classList.contains("hidden");
                const isConnected = (device.IP === deviceIp);

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
                    btn.innerText = "Conectar";
                }
            }
        } else if (device.isOnline) {
            addDevices(device);
        }
    });
}, 1000);

// Boton desconectar
document.getElementById("disconnect-btn").addEventListener("click", () => {
    screenDevices.classList.remove("hidden");
    screenMain.classList.add("hidden");
    deviceIp = undefined;
});