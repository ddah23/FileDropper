const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const jsonPath = path.join(app.getPath("userData"), "history.json");

let sent = [];
let received = [];

if (!fs.existsSync(jsonPath)) {
    const objCreate = { sent: [], received: [] };
    fs.writeFileSync(jsonPath, JSON.stringify(objCreate, null, 2));
} else {
    const fileRead = fs.readFileSync(jsonPath, "utf-8");
    const config = JSON.parse(fileRead);

    sent = config.sent || [];
    received = config.received || [];
}

function addSent({ name, size, destination, status, timestamp }) {
    const newSent = {
        name: name,
        size: size,
        destination: destination,
        status: status,
        timestamp: timestamp
    }
    sent.push(newSent);

    const newData = { sent, received }
    fs.writeFileSync(jsonPath, JSON.stringify(newData, null, 2));
}

function addReceived({ name, size, origin, status, timestamp }) {
    const newReceived = {
        name: name,
        size: size,
        origin: origin,
        status: status,
        timestamp: timestamp
    }
    received.push(newReceived);

    const newData = { sent, received }
    fs.writeFileSync(jsonPath, JSON.stringify(newData, null, 2));
}

function getHistory() {
    return [sent, received];
}

module.exports = { addSent, addReceived, getHistory };