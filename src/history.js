const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// Stored in userData (not in app package) so it persists across restarts and updates
const historyPath = path.join(app.getPath("userData"), "history.json");

let sentList = [];
let receivedList = [];

if (!fs.existsSync(historyPath)) {
    const initialData = { sent: [], received: [] };
    fs.writeFileSync(historyPath, JSON.stringify(initialData, null, 2));
} else {
    const fileContent = fs.readFileSync(historyPath, "utf-8");
    const savedHistory = JSON.parse(fileContent);

    sentList = savedHistory.sent || [];
    receivedList = savedHistory.received || [];
}

function addSent({ name, size, destination, status, timestamp }) {
    sentList.push({ name, size, destination, status, timestamp });
    fs.writeFileSync(historyPath, JSON.stringify({ sent: sentList, received: receivedList }, null, 2));
}

function addReceived({ name, size, origin, status, timestamp }) {
    receivedList.push({ name, size, origin, status, timestamp });
    fs.writeFileSync(historyPath, JSON.stringify({ sent: sentList, received: receivedList }, null, 2));
}

function getHistory() {
    return [sentList, receivedList];
}

module.exports = { addSent, addReceived, getHistory };