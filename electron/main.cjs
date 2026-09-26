// electron/main.cjs
// Electron main process — creates and manages the desktop window

const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "ভূমিসেবা সহায়তা কেন্দ্র",
    icon: path.join(__dirname, "../public/favicon.svg"),
    backgroundColor: "#FFFFFF",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Remove default menu bar for a cleaner POS-like feel
  Menu.setApplicationMenu(null);

  // Show when ready to prevent flicker
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Handle external links — open in default browser instead of new window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow blob: URLs (used for PDF preview in new tabs)
    if (url.startsWith("blob:")) {
      return { action: "allow" };
    }
    // Allow localhost in dev
    if (isDev && url.startsWith(DEV_URL)) {
      return { action: "allow" };
    }
    // Everything else → external browser
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Ensure only one window opens for blob URLs
  mainWindow.webContents.on("did-create-window", (childWindow) => {
    childWindow.setMenu(null);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: prevent navigation to external sites in the main window
app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    // Allow blob: URLs (used for PDF preview) — no URL parsing needed
    if (navigationUrl.startsWith("blob:")) {
      return;
    }

    // Allow data: URLs
    if (navigationUrl.startsWith("data:")) {
      return;
    }

    // Allow dev server
    if (isDev && navigationUrl.startsWith(DEV_URL)) {
      return;
    }

    // For all other URLs, safely parse and compare
    try {
      const parsedUrl = new URL(navigationUrl);
      const currentUrl = new URL(contents.getURL());

      // Allow navigation within our own app
      if (parsedUrl.origin === currentUrl.origin) {
        return;
      }
    } catch (err) {
      // If URL parsing fails, allow it (safe fallback)
      return;
    }

    // Block everything else
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});