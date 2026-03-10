const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:8080");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  nextProcess = spawn("npm", ["start"], {
    shell: true,
    cwd: path.join(__dirname, ".."),
    env: { ...process.env },
  });

  nextProcess.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  nextProcess.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  setTimeout(() => {
    createWindow();
  }, 8000);
});

app.on("window-all-closed", () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) nextProcess.kill();
});