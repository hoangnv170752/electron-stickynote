const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;

// About Window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
      width: 300,
      height: 300,
      title: 'About Electron',
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    });
  
     aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
  }

// Main Window
function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: isDev ? 1000 : 500,
      height: 600,
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: isDev,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });
  
    // Show devtools automatically if in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
       mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
  }
// App is initialized
app.on('ready', () => {
    createMainWindow();
  
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
  
    // Remove variable from memory
    mainWindow.on('closed', () => (mainWindow = null));
  });

// Respond to the resize image event
ipcMain.on('image:resize', (e, options) => {
    // console.log(options);
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImage(options);
});

// Resize the image 
async function resizeImage({ imgPath, width, height, destination }) {
    try {
        const newPath = await resizeImage(fs.readFileSync(imgPath), {
            width: +width,
            height: +height,
        });
        const filename = path.basename(imgPath);

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.writeFileSync(path.join(dest, filename), newPath);

        mainWindow.webContents.send('image:done');

        shell.openPath(dest);
    } catch (err) {
        console.log(err);
      }
}


//Template
const menu = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: 'About',
                click: createAboutWindow,
              },
            ],
          },
        ]
      : []),
    {
      role: 'fileMenu',
    },
    ...(!isMac
      ? [
          {
            label: 'Help',
            submenu: [
              {
                label: 'About',
                click: createAboutWindow,
              },
            ],
          },
        ]
      : []),
    // {
    //   label: 'File',
    //   submenu: [
    //     {
    //       label: 'Quit',
    //       click: () => app.quit(),
    //       accelerator: 'CmdOrCtrl+W',
    //     },
    //   ],
    // },
    ...(isDev
      ? [
          {
            label: 'Developer',
            submenu: [
              { role: 'reload' },
              { role: 'forcereload' },
              { type: 'separator' },
              { role: 'toggledevtools' },
            ],
          },
        ]
      : []),
  ];
  

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
  
  // Open a window if none are open (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });