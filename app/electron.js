'use strict'

const electron = require('electron')
const path = require('path')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow
let config = {}

exports.openFiles = function openFiles () {
  const opts = {
    title: 'Select images.',
    properties: [ 'openFile', 'openDirectory', 'multiSelections' ],
  };
  electron.dialog.showOpenDialog(mainWindow, opts, function (selectedPaths) {
    if (!Array.isArray(selectedPaths)) return;
    if (!mainWindow) mainWindow = createWindow();
    mainWindow.webContents.send('onOpen', selectedPaths);
  });
};

exports.choose = function choose (mode) {
  if (!mainWindow) return;
  mainWindow.webContents.send('setmode', mode);
};

exports.sendEvent = function sendEvent (event, payload) {
  if (!mainWindow) return;
  mainWindow.webContents.send(event, payload);
}

if (process.env.NODE_ENV === 'development') {
  config = require('../config')
  config.url = `http://localhost:${config.port}`
} else {
  config.devtron = false
  config.url = `file://${__dirname}/dist/index.html`
}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800
  })

  mainWindow.loadURL(config.url)

  if (process.env.NODE_ENV === 'development') {
    BrowserWindow.addDevToolsExtension(path.join(__dirname, '../node_modules/devtron'))

    let installExtension = require('electron-devtools-installer')

    installExtension.default(installExtension.VUEJS_DEVTOOLS)
      .then((name) => mainWindow.webContents.openDevTools())
      .catch((err) => console.log('An error occurred: ', err))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  require('./menu');

  console.log('mainWindow opened')
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
