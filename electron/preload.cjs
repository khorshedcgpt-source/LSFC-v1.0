// electron/preload.cjs
// Minimal preload script — the app does not need Node.js access from renderer.
// This file exists to satisfy contextIsolation requirements.

const { contextBridge } = require("electron");

// Expose only a safe, minimal API surface to the renderer if needed in future.
// Currently nothing is exposed — the app runs fully in the browser sandbox.

contextBridge.exposeInMainWorld("electronApp", {
  isElectron: true,
  platform: process.platform,
});