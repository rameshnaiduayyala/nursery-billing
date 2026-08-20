const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Gangadhara Nursery Business Management',
    icon: path.join(__dirname, '../frontend/public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local file & API communication
    },
  });

  // Path to built frontend HTML
  const frontendDistPath = path.join(__dirname, '../frontend/dist/index.html');

  if (fs.existsSync(frontendDistPath)) {
    // Load built production frontend file
    mainWindow.loadFile(frontendDistPath);
  } else {
    // Fallback to Vite dev server if dist folder is not yet built
    console.log('Frontend dist folder not found. Loading dev server http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  }

  // Remove default top menu bar for clean app UI (can toggle with Alt)
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Global print handler
ipcMain.on('print-window', (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
