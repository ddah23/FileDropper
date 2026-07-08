// Panel Historial - Abrir <-> Cerrar
const panelBtn = document.getElementById("toggleBtn");
const panelClose = document.getElementById("close-panel");
const historyPanel = document.getElementById("historyPanel");

panelBtn.addEventListener("click", () =>
    historyPanel.classList.toggle("collapsed"));

panelClose.addEventListener("click", () =>
    historyPanel.classList.add("collapsed"));

// Switch Tabs
const sentList = document.getElementById('listSent');
const receivedList = document.getElementById('listReceived');

const tabSent = document.getElementById('tabSent');
const tabReceived = document.getElementById('tabReceived');

const switchTab = (showSent) => {
    sentList.style.display = showSent ? "block" : "none";
    receivedList.style.display = showSent ? "none" : "block";

    tabSent.classList.toggle("active");
    tabReceived.classList.toggle("active");
}

tabSent.addEventListener("click", () => switchTab(true));
tabReceived.addEventListener("click", () => switchTab(false));
