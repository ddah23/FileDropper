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

const getExtension = (name) => name.split(".").pop().toUpperCase();

const handleDrop = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;

    window.api.clearProgress();

    const files = Array.from(e.dataTransfer.files);
    const filesMap = files.map(file => ({
        path: window.api.getFilePath(file),
        name: file.name
    }));

    window.api.sendFile(filesMap);
    historyPanel.classList.remove("collapsed");

    const file = files[0];
    const displayName = files.length === 1 ? file.name : `${files.length} archivos`;
    const destName = document.getElementById("topbar-name").textContent;
    const formatFile = files.length === 1 ? getExtension(file.name) : "FILES";

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
};

dropArea.addEventListener("drop", handleDrop);

window.api.transferDone(() => {
    const activeTransfer = document.getElementById("active-transfer");
    if (!activeTransfer) return;

    const progressBarWrap = activeTransfer.querySelector(".history-progress-wrap");
    const progressText = activeTransfer.querySelector(".progress-text");
    const statusDot = activeTransfer.querySelector(".history-status-dot");

    if (progressBarWrap) progressBarWrap.style.display = "none";
    if (progressText) progressText.style.display = "none";

    statusDot.className = "history-status-dot ok";
    statusDot.style.display = "block";
    activeTransfer.classList.remove("transferring");
    // Remove the id so the next transfer doesn't reuse this same history element
    activeTransfer.removeAttribute("id");
});

window.api.transferError(() => {
    const activeTransfer = document.getElementById("active-transfer");
    if (!activeTransfer) return;

    const progressBar = activeTransfer.querySelector(".history-progress-fill");
    const progressText = activeTransfer.querySelector(".progress-text");
    const statusDot = activeTransfer.querySelector(".history-status-dot");

    if (progressBar) progressBar.style.backgroundColor = "#dc3545";
    if (progressText) progressText.textContent = "Error";

    statusDot.className = "history-status-dot error";
    statusDot.style.display = "block";
    activeTransfer.classList.remove("transferring");
    activeTransfer.removeAttribute("id");
});

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

    pendingFilesCount++;
    const toast = document.getElementById("incomingToast");
    toast.querySelector(".toast-title").textContent = `${pendingFilesCount} archivo(s) recibido(s)`;
    toast.querySelector(".toast-sub").textContent = `de ${file.origin}`;
    toast.classList.add("show");

    document.getElementById("toastSound").play();
});

document.getElementById("incomingToast").addEventListener("click", () => {
    window.api.openDesktop();
    pendingFilesCount = 0;
    document.getElementById("incomingToast").classList.remove("show");
});