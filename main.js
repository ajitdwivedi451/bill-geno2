const { app, BrowserWindow } = require('electron');
const path = require('path');
const serve = require('electron-serve');

// यह हमारे Next.js के 'out' फोल्डर को लोड करेगा
const loadURL = serve({ directory: path.join(__dirname, 'out') });

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Billgeno Desktop",
    autoHideMenuBar: true, // 🟢 ऊपर का बोरिंग फाइल/एडिट मेनू छुपाने के लिए
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // फुल स्क्रीन या मैक्सिमाइज करके खोलें
  mainWindow.maximize();

  if (app.isPackaged) {
    loadURL(mainWindow);
  } else {
    // डेवलपमेंट मोड के लिए
    mainWindow.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});