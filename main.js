// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const fetch = require("node-fetch");
const path = require('path')
var Datastore = require('nedb');
var db = new Datastore({filename : 'printers'});
db.loadDatabase();
let mainWindow;
var log4js = require("log4js");
var logger = log4js.getLogger();
const { dialog } = require('electron')
logger.level = "all";
logger.info("App started");
async function listener(event_type, event, data_object)  {
      logger.debug(`Event type: ${event_type}; Data:`, data_object);
      switch (data_object.type){
        case "openDevTools":
            if(mainWindow.webContents.isDevToolsOpened()){
                mainWindow.webContents.closeDevTools()
                event.reply('asynchronous-reply', {type: 'changedDevtoolsStatus', status: false});
            }else {
                mainWindow.webContents.openDevTools();
                event.reply('asynchronous-reply', {type: 'changedDevtoolsStatus', status: true});
            }

            break;
        case "addPrinter":
            db.find({ip: data_object.ip}, async (err, db_data) => {
                if(db_data.length) {
                    event.reply('asynchronous-reply', {type: 'addingPrinter', error: 2});
                    logger.debug(`Printer with ip ${data_object.ip} already exits`);
                    return false;
                }

                await fetch(`http://${data_object.ip}/api/v1/system`).then(async(response) => {
                    await response.json().then((body) => {
                        const printerInfo = {
                            uuid: body.guid,
                            ip: data_object.ip,
                            name: data_object.name,
                            model: body.variant
                        };
                        logger.debug(`Adding new printer`, printerInfo);
                        db.insert(printerInfo, function (err, inserted) {
                            if(!err) {
                                logger.debug(`Success inserted`, inserted._id);
                                event.reply('asynchronous-reply', {
                                    type: 'addingPrinter',
                                    success: true,
                                    uuid: inserted.uuid
                                });
                            } else logger.error(`Printer insert error: `, err);
                        });

                    }).catch((e) => {
                        if(e.type === 'invalid-json') {
                            logger.error(`JSON PARSE ERROR: `, e);
                            event.reply('asynchronous-reply', {type: 'addingPrinter', error: 1});
                        }else {
                            event.reply('asynchronous-reply', {type: 'addingPrinter', error: 666});
                            logger.trace("Unknown error");
                        }
                    });
                }).catch((e) => {
                    logger.debug(`Request failed: `, e);
                    event.reply('asynchronous-reply', {type: 'addingPrinter', error: 1});
                });
            });

            break;

        case "getPrinters":
            new Promise((resolve, reject) => {
                db.find({}, function (err, data) {
                    if(err) {
                        logger.debug(`Can't get printers from database `, err);
                    } else resolve(data);
                });
            }).then(async(d) => {
                for(let printer of d){
                    await fetch(`http://${printer.ip}/api/v1/system`, {
                        timeout: 1000,
                    }).then(async (response) => {
                        const body = await response.json();
                        if(body.guid){
                            printer.online = true;
                        }
                        await fetch(`http://${printer.ip}/api/v1/system/memory`, {
                            timeout: 1000,
                        }).then(async (response) => {
                            printer.memory = await response.json();
                        }).catch((e) => {
                            logger.warn(`Can't get printer memory `, e.type);
                            printer.memory = false;
                        });

                        await fetch(`http://${printer.ip}/api/v1/printer`, {
                            timeout: 1000,
                        }).then(async (response) => {
                            printer.status = (await response.json()).status.toUpperCase();
                        }).catch((e) => {
                            logger.warn(`Can't get printer status `, e.type);
                            printer.status = false;
                        });
                    }).catch((e) => {
                        printer.online = false;
                        logger.warn(`Can't get  printer info (Maybe offline) Error type:`, e.type);
                    });
                }
                event.reply('asynchronous-reply', {type: 'printersResponse', printers: d, uuid: data_object.uuid})
            });
            break;
    }
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })
  mainWindow.setMenuBarVisibility(false);
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  logger.info("Window created");
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'){
      logger.info("App closed");
      app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('synchronous-message', (event, data) => listener('synchronous-message', event, data))
ipcMain.on('asynchronous-message', (event, data) => listener('asynchronous-message', event, data))
ipcMain.on('asynchronous-reply', (event, data) => listener('asynchronous-reply', event, data))