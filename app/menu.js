/* eslint-disable */
const { app, Menu, dialog } = require('electron');
const { openFiles, choose, sendEvent } = require('./electron');
/* eslint-enable */

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Files...',
        accelerator: 'CmdOrCtrl+O',
        role: 'open',
        click: () => openFiles(),
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'None',
        accelerator: 'CmdOrCtrl+N',
        click: () => choose('none'),
      },
      {
        label: 'Rect',
        accelerator: 'CmdOrCtrl+r',
        click: () => choose('rect'),
      },
      {
        label: 'FreeForm',
        accelerator: 'CmdOrCtrl+f',
        click: () => choose('poly'),
      },
      {
        label: 'Delete',
        accelerator: 'CmdOrCtrl+d',
        click: () => choose('del'),
      },
      {
        type: 'separator',
      },
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: () => sendEvent('undo'),
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        click: () => sendEvent('redo'),
      }
    ],
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize',
      },
      {
        role: 'close',
      },
    ],
  },
  {
    role: 'help',
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {
        role: 'about',
      },
      {
        type: 'separator',
      },
      {
        role: 'services',
        submenu: [],
      },
      {
        type: 'separator',
      },
      {
        role: 'hide',
      },
      {
        role: 'hideothers',
      },
      {
        role: 'unhide',
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ],
  });
}

const menu = Menu.buildFromTemplate(template);

Menu.setApplicationMenu(menu);
