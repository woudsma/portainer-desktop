import * as path from "path";
import { app, BrowserWindow, screen } from "electron";
import { format as formatUrl } from "url";
import { initDocker } from "./docker-node-api";
import dotenv from "dotenv";

dotenv.config();

const {
  NODE_ENV,
  ELECTRON_WEBPACK_WDS_PORT,
  DOCKER_IMAGE_NAME,
  DOCKER_CONTAINER_NAME,
} = process.env;

const isDevelopment = NODE_ENV !== "production";
let mainWindow;

const createMainWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const window = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(800, height),
    center: true,
    // preload: 'path/to/script.js',
    webPreferences: { nodeIntegration: true },
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:9000`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true,
      })
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
};

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    initDocker({ image: DOCKER_IMAGE_NAME, name: DOCKER_CONTAINER_NAME });
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on("ready", () => {
  initDocker({ image: DOCKER_IMAGE_NAME, name: DOCKER_CONTAINER_NAME });
  mainWindow = createMainWindow();
});
