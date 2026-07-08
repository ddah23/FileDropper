// Dropzone actions
const dropArea = document.getElementById("dropzone");

const setActive = () => dropArea.classList.add("dragover");
const setInactive = () => dropArea.classList.remove("dragover");

const preventDefaults = (e) => e.preventDefault();

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults);
});

["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, setActive);
});

["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, setInactive);
});


const handleDrop = (e) => {
    e.preventDefault();

    if (!e.dataTransfer.files.length) return;

    window.api.clearProgress();

    const files = Array.from(e.dataTransfer.files);

    const filesMap = files.map(file => {
        return {
            path: window.api.getFilePath(file),
            name: file.name
        }
    });

    window.api.sendFile(filesMap);

    // Abre el panel y cambia a la pestaña de enviados
    historyPanel.classList.remove("collapsed");

    const file = files[0];
    const totalSize = files.reduce((i, f) => i + f.size, 0);
    const displayName = files.length === 1 ? file.name : `${files.length} archivos`;
    const destName = document.getElementById("topbar-name").textContent;
    const formatFile = files.length === 1 ? getExtension(file.name) : 'FILES';

    const historyHtml = `
        <div class="history-item transferring" id="active-transfer">
            <div class="history-file-icon">${formatFile}</div>
            <div class="history-info">
                <div class="history-filename">${displayName}</div>
                <div class="history-meta">
                    <span>A: ${destName}</span> · <span class="progress-text">0%</span>
                </div>
                <div class="history-progress-wrap">
                    <div class="history-progress-fill"></div>
                </div>
            </div>
            <div class="history-status-dot" style="display: none;"></div>
        </div>
    `;
    listSent.insertAdjacentHTML("afterbegin", historyHtml);

    const activeTransfer = document.getElementById("active-transfer");
    const progressText = activeTransfer.querySelector(".progress-text");
    const progressBar = activeTransfer.querySelector(".history-progress-fill");

    window.api.transferProgress((percentage) => {
        const cleanPercentage = Math.max(0, Math.min(100, percentage));
        if (progressBar) progressBar.style.width = `${cleanPercentage}%`;
        if (progressText) progressText.textContent = `${cleanPercentage}%`;
    });
}

window.api.transferDone((fileData) => {
    const activeTransfer = document.getElementById("active-transfer");
    if (activeTransfer) {
        const progressBarWrap = activeTransfer.querySelector(".history-progress-wrap");
        const progressText = activeTransfer.querySelector(".progress-text");
        const statusDot = activeTransfer.querySelector(".history-status-dot");

        if (progressBarWrap) progressBarWrap.style.display = "none";
        if (progressText) progressText.style.display = "none";

        statusDot.className = "history-status-dot ok";
        statusDot.style.display = "block";
        activeTransfer.classList.remove("transferring");
        activeTransfer.removeAttribute("id");
    }
});

window.api.transferError((errorData) => {
    const activeTransfer = document.getElementById("active-transfer");
    if (activeTransfer) {
        const progressBar = activeTransfer.querySelector(".history-progress-fill");
        const progressText = activeTransfer.querySelector(".progress-text");
        const statusDot = activeTransfer.querySelector(".history-status-dot");

        if (progressBar) progressBar.style.backgroundColor = "#dc3545";
        if (progressText) progressText.textContent = "Error";

        statusDot.className = "history-status-dot error";
        statusDot.style.display = "block";
        activeTransfer.classList.remove("transferring");
        activeTransfer.removeAttribute("id");
    }
});

dropArea.addEventListener("drop", handleDrop);

let pendingFilesCount = 0;

window.api.fileReceived((file) => {
    listReceived.insertAdjacentHTML("afterbegin", `
        <div class="history-item">
            <div class="history-file-icon">${getExtension(file.name)}</div>
            <div class="history-info">
                <div class="history-filename">${file.name}</div>
                <div class="history-meta">
                    <span>De: ${file.origin}</span>
                </div>
            </div>
            <div class="history-status-dot ok"></div>
        </div>
    `);

    // Toast
    pendingFilesCount++;
    const toast = document.getElementById('incomingToast');
    toast.querySelector('.toast-title').textContent = `${pendingFilesCount} archivo(s) recibido(s)`;
    toast.querySelector('.toast-sub').textContent = `de ${file.origin}`;
    toast.classList.add('show');

    document.getElementById('toastSound').play()
});

document.getElementById('incomingToast').addEventListener("click", () => {
    window.api.openDesktop();
    pendingFilesCount = 0;
    document.getElementById('incomingToast').classList.remove('show');
});

const getExtension = (name) =>
    name.split(".").pop().toUpperCase();

const formatSize = (bytes) => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    return `${bytes.toFixed(1)} ${units[i]}`;
};

dropArea.addEventListener("drop", handleDrop);


// const deviceName = document.getElementById("devices-footer");