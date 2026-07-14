# FileDropper

FileDropper is a desktop application for sending files between devices on the same local network. It finds other devices automatically, so you can drop a file or folder and send it without configuring IP addresses or setting up a shared drive.

## Features

- Automatic discovery of other FileDropper devices on the local network.
- Drag-and-drop file transfer, including whole folders.
- Live transfer progress with sent and received history.
- Light and dark mode.
- Desktop notification when a file arrives while the app is in the background.

## How it works

FileDropper announces itself on the network using mDNS (Bonjour) and listens for other instances doing the same. Each device also sends a UDP heartbeat every second so that peers can detect disconnects faster than mDNS alone allows.

When you select a device and drop a file, FileDropper uploads it over HTTP to that device on port `3737`. If you drop a folder, FileDropper compresses it to a temporary `.zip` file first and the receiving device extracts it automatically. Every transfer is recorded in a local history that persists between sessions.

## Requirements

- [Node.js](https://nodejs.org/) 22.12.0 or later.
- All devices must be on the same local network and able to reach each other on ports `3737` (TCP) and `3738` (UDP).

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd file-dropper
npm install
```

## Usage

Start the app in development mode:

```bash
npm start
```

FileDropper opens on a device selection screen. Devices running FileDropper on the same network appear automatically. Select a device to connect, then drag a file or folder onto the drop zone, or click it to choose a file.

To disconnect from a device, use the disconnect button in the top bar. Sent and received transfers are available from the history panel, which can be opened from the floating button in the bottom-right corner.

## Building for distribution

FileDropper uses Electron Forge to package the app for distribution.

Package the app without creating installers:

```bash
npm run package
```

Create platform-specific installers (`.deb`, `.rpm`, or a Squirrel installer on Windows):

```bash
npm run make
```

Output files are written to `out/`.

## Project structure

```
main.js              Electron main process entry point
preload.js           Bridges the renderer process to Node APIs
src/
  discovery.js       Device discovery over mDNS and UDP heartbeats
  server.js           HTTP server that receives incoming files
  sender.js          Uploads outgoing files and reports progress
  fileHandler.js     Compresses folders before sending
  history.js         Reads and writes transfer history to disk
render/
  index.html         Application window markup
  css/               Stylesheets
  js/                Renderer-side scripts (UI, drag-and-drop, theming)
```

## Troubleshooting

**A device does not appear in the list.**
Confirm both devices are on the same network and that no firewall is blocking mDNS or ports `3737` and `3738`.

**A connected device shows as offline unexpectedly.**
FileDropper marks a device offline if it has not received a heartbeat within two seconds. This is expected if the other device's app was closed or the network connection dropped.

## License

