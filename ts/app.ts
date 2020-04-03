/*******************************************************************************
 * Copyright (c) 2018-2020 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
import { app, ipcMain, BrowserWindow, dialog, Menu, shell, MenuItem, IpcMainEvent, nativeTheme } from "electron";
import { execFileSync, spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

import { ClientRequest, request, IncomingMessage } from "http";
const https = require('https');

app.allowRendererProcessReuse = true;

var mainWindow: BrowserWindow;
var settings: BrowserWindow;
var currentTheme: string;
var defaultTheme: string = 'system';
let javapath: string;
var status: string;
let appHome: string;
let sklFolder: string;
let defaultCatalog: string;
let defaultSRX: string;
let defaultSrcLang: string = 'none';
let defaultTgtLang: string = 'none';
let stopping: boolean;

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    if (mainWindow) {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow.isMinimized()) {
            mainWindow.restore()
        }
        mainWindow.focus()
    }
}

if (process.platform == 'win32') {
    javapath = app.getAppPath() + '\\bin\\java.exe';
    appHome = app.getPath('appData') + '\\xliffmanager\\';
    sklFolder = appHome + 'skl\\';
    defaultCatalog = app.getAppPath() + '\\catalog\\catalog.xml';
    defaultSRX = app.getAppPath() + '\\srx\\default.srx';
} else {
    javapath = app.getAppPath() + '/bin/java';
    appHome = app.getPath('appData') + '/xliffmanager/';
    sklFolder = appHome + 'skl/';
    defaultCatalog = app.getAppPath() + '/catalog/catalog.xml';
    defaultSRX = app.getAppPath() + '/srx/default.srx';
}

const ls = spawn(javapath, ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.FilterServer'], { cwd: app.getAppPath() });

if (!existsSync(appHome + 'defaults.json')) {
    mkdirSync(appHome);
    let defaults: any = {
        srx: defaultSRX,
        catalog: defaultCatalog,
        skeleton: sklFolder,
        theme: 'system'
    }
    writeFileSync(appHome + 'defaults.json', JSON.stringify(defaults));
}

function stopServer(): void {
    if (!stopping) {
        stopping = true;
        ls.kill();
    }
}

var ck = execFileSync('bin/java', ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.CheckURL', 'http://localhost:8000/FilterServer'], { cwd: app.getAppPath() });
console.log(ck.toString());

app.on('ready', () => {
    createWindow();
    createMenu();
    loadDefaults();
    mainWindow.show();
    // mainWindow.webContents.openDevTools();
});

app.on('quit', () => {
    stopServer();
})

app.on('window-all-closed', function () {
    stopServer();
    app.quit()
});

nativeTheme.on('updated', () => {
    loadDefaults();
});

ipcMain.on('select-source-file', (event) => {
    selectSourceFile(event);
});

ipcMain.on('select-xliff-file', (event) => {
    selectXliffFile(event);
});

ipcMain.on('convert', (event, arg) => {
    convert(event, arg);
});

ipcMain.on('select-xliff-validation', (event) => {
    selectXliffValidation(event);
});

ipcMain.on('validate', (event, arg) => {
    validate(event, arg);
});

ipcMain.on('select-xliff-analysis', (event) => {
    selectXliffAnalysis(event);
});

ipcMain.on('select-ditaval', (event) => {
    selectDitaval(event);
});

ipcMain.on('select-target-file', (event) => {
    selectTargetFile(event);
});

ipcMain.on('analyse', (event, arg) => {
    analyse(event, arg);
});

ipcMain.on('merge', (event, arg) => {
    merge(event, arg);
});

ipcMain.on('select-skeleton', (event) => {
    selectSkeleton(event);
});

ipcMain.on('select-catalog', (event) => {
    selectCatalog(event);
});

ipcMain.on('select-srx', (event) => {
    selectSrx(event);
});

ipcMain.on('show-about', () => {
    showAbout();
});

ipcMain.on('show-settings', () => {
    showSettings();
});

ipcMain.on('save-defaults', (event, arg) => {
    saveDefaults(arg);
});

ipcMain.on('get-theme', (event) => {
    event.sender.send('set-theme', currentTheme);
});

ipcMain.on('get-defaultTheme', (event) => {
    event.sender.send('set-defaultTheme', defaultTheme);
});


ipcMain.on('get-version', (event) => {
    getVersion(event);
});

ipcMain.on('get-languages', (event) => {
    getLanguages(event);
});

ipcMain.on('get-skeleton', (event) => {
    event.sender.send('skeleton-received', sklFolder);
});

ipcMain.on('get-catalog', (event) => {
    event.sender.send('catalog-received', defaultCatalog);
});

ipcMain.on('get-srx', (event) => {
    event.sender.send('srx-received', defaultSRX);
});

ipcMain.on('get-charsets', (event) => {
    getCharsets(event);
});

ipcMain.on('get-types', (event) => {
    getTypes(event);
});

ipcMain.on('get-package-languages', (event, arg) => {
    getPackageLanguages(event, arg);
});

ipcMain.on('check-updates', (event) => {
    checkUpdates();
});

ipcMain.on('show-help', () => {
    showHelp();
});

ipcMain.on('show-file', (event, arg) => {
    shell.openItem(arg.file);
});

ipcMain.on('show-dialog', (event, arg) => {
    dialog.showMessageBox(arg);
});

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 580,
        height: 700,
        maximizable: false,
        show: false,
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + app.getAppPath() + '/html/main.html');
}


function saveDefaults(defaults: any): void {
    writeFileSync(appHome + 'defaults.json', JSON.stringify(defaults));
    settings.close();
    loadDefaults();
    setTheme();
}

function loadDefaults(): void {
    var data: Buffer = readFileSync(appHome + 'defaults.json');
    var defaults = JSON.parse(data.toString());
    
    if (defaults.srx) {
        defaultSRX = defaults.srx;
    }
    if (defaults.skeleton) {
        sklFolder = defaults.skeleton;
    }
    if (defaults.catalog) {
        defaultCatalog = defaults.catalog;
    }
    if (defaults.srcLang) {
        defaultSrcLang = defaults.srcLang;
    }
    if (defaults.tgtLang) {
        defaultTgtLang = defaults.tgtLang;
    }
    if (defaults.theme) {
        defaultTheme = defaults.theme;
    }

    if (defaultTheme === 'system') {
        if (nativeTheme.shouldUseDarkColors) {
            currentTheme = app.getAppPath() + '/css/dark.css';
            nativeTheme.themeSource = 'dark';
        } else {
            currentTheme = app.getAppPath() + '/css/light.css';
            nativeTheme.themeSource = 'light';
        }
    }
    if (defaultTheme === 'dark') {
        currentTheme = app.getAppPath() + '/css/dark.css';
        nativeTheme.themeSource = 'dark';
    }
    if (defaultTheme === 'light') {
        currentTheme = app.getAppPath() + '/css/light.css';
        nativeTheme.themeSource = 'light';
    }
}

function setTheme(): void {
    mainWindow.webContents.send('set-theme', currentTheme);
}

function getLanguages(event: IpcMainEvent): void {
    sendRequest({ command: 'getLanguages' },
        function success(data: any) {
            data.srcLang = defaultSrcLang;
            data.tgtLang = defaultTgtLang;
            event.sender.send('languages-received', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getPackageLanguages(event: IpcMainEvent, arg: any): void {
    sendRequest(arg,
        function success(data: any) {
            event.sender.send('package-languages', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getCharsets(event: IpcMainEvent): void {
    sendRequest({ command: 'getCharsets' },
        function success(data: any) {
            event.sender.send('charsets-received', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getTypes(event: IpcMainEvent): void {
    sendRequest({ command: 'getTypes' },
        function success(data: any) {
            event.sender.send('types-received', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function selectSourceFile(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Any File', extensions: ['*'] },
            { name: 'Adobe InDesign Interchange', extensions: ['inx'] },
            { name: 'Adobe InDesign IDML', extensions: ['idml'] },
            { name: 'DITA Map', extensions: ['ditamap', 'dita', 'xml'] },
            { name: 'HTML Page', extensions: ['html', 'htm'] },
            { name: 'JavaScript', extensions: ['js'] },
            { name: 'Java Properties', extensions: ['properties'] },
            { name: 'MIF (Maker Interchange Format)', extensions: ['mif'] },
            { name: 'Microsoft Office 2007 Document', extensions: ['docx', 'xlsx', 'pptx'] },
            { name: 'OpenOffice 1.x Document', extensions: ['sxw', 'sxc', 'sxi', 'sxd'] },
            { name: 'OpenOffice 2.x Document', extensions: ['odt', 'ods', 'odp', 'odg'] },
            { name: 'Plain Text', extensions: ['txt'] },
            { name: 'PO (Portable Objects)', extensions: ['po', 'pot'] },
            { name: 'RC (Windows C/C++ Resources)', extensions: ['rc'] },
            { name: 'ResX (Windows .NET Resources)', extensions: ['resx'] },
            { name: 'SDLXLIFF Document', extensions: ['sdlxliff'] },
            { name: 'SVG (Scalable Vector Graphics)', extensions: ['svg'] },
            { name: 'Trados Studio Package', extensions: ['sdlppx'] },
            { name: 'TS (Qt Linguist translation source)', extensions: ['ts'] },
            { name: 'TXML Document', extensions: ['txml'] },
            { name: 'Visio XML Drawing', extensions: ['vsdx'] },
            { name: 'WPML XLIFF', extensions: ['xliff'] },
            { name: 'XML Document', extensions: ['xml'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            getFileType(event, value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function selectXliffFile(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('add-xliff-file', value.filePaths[0]);
            getTargetFile(event, value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function selectDitaval(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'DITAVAL File', extensions: ['ditaval'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('add-ditaval-file', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function convert(event: IpcMainEvent, arg: any): void {
    arg.sklFolder = sklFolder;
    arg.catalog = defaultCatalog;
    arg.srx = defaultSRX;
    sendRequest(arg,
        function success(data: any) {
            event.sender.send('conversion-started');
            status = 'running';
            var intervalObject = setInterval(function () {
                getStatus(data.process);
                if (status === 'completed') {
                    getResult(data.process, event, 'conversionResult', 'conversion-completed');
                    clearInterval(intervalObject);
                } else if (status === 'running') {
                    // it's OK, keep waiting
                } else {
                    clearInterval(intervalObject);
                }
            }, 1000);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function selectXliffValidation(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('add-xliff-validation', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function validate(event: IpcMainEvent, arg: any): void {
    arg.catalog = defaultCatalog;
    sendRequest(arg,
        function success(data: any) {
            event.sender.send('validation-started', '');
            status = 'running';
            var intervalObject = setInterval(function () {
                getStatus(data.process);
                if (status === 'completed') {
                    getResult(data.process, event, 'validationResult', 'validation-result');
                    clearInterval(intervalObject);
                } else if (status === 'running') {
                    // it's OK, keep waiting
                } else {
                    clearInterval(intervalObject);
                }
            }, 1000);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function selectTargetFile(event: IpcMainEvent): void {
    dialog.showSaveDialog({ title: 'Target File/Folder' }).then((value) => {
        if (!value.canceled) {
            event.sender.send('add-target-file', value.filePath);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function merge(event: IpcMainEvent, arg: any): void {
    arg.catalog = defaultCatalog;
    sendRequest(arg,
        function success(data: any) {
            event.sender.send('merge-created');
            status = 'running';
            var intervalObject = setInterval(function () {
                getStatus(data.process);
                if (status === 'completed') {
                    getResult(data.process, event, 'mergeResult', 'merge-completed');
                    clearInterval(intervalObject);
                } else if (status === 'running') {
                    // it's OK, keep waiting
                } else {
                    clearInterval(intervalObject);
                }
            }, 1000);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function selectXliffAnalysis(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('add-xliff-analysis', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function analyse(event: IpcMainEvent, arg: any): void {
    arg.catalog = defaultCatalog;
    sendRequest(arg,
        function success(data: any) {
            event.sender.send('analysis-started');
            status = 'running';
            var intervalObject = setInterval(function () {
                getStatus(data.process);
                if (status === 'completed') {
                    getResult(data.process, event, 'analysisResult', 'analysis-completed');
                    clearInterval(intervalObject);
                } else if (status === 'running') {
                    // it's OK, keep waiting
                } else {
                    clearInterval(intervalObject);
                }
            }, 1000);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getFileType(event: IpcMainEvent, file: string): void {
    sendRequest({ command: 'getFileType', file: file },
        function success(data: any) {
            event.sender.send('add-source-file', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getTargetFile(event: IpcMainEvent, file: string): void {
    sendRequest({ command: 'getTargetFile', file: file },
        function success(data: any) {
            if (data.result === 'Success') {
                event.sender.send('add-target-file', data.target);
            } else {
                dialog.showErrorBox('Error', data.reason);
            }
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getStatus(processId: string): void {
    sendRequest({ command: 'status', process: processId },
        function success(data: any) {
            status = data.status;
        },
        function error(reason: string) {
            status = 'error';
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function getResult(processId: string, event: IpcMainEvent, command: string, callback: string): void {
    sendRequest({ command: command, process: processId },
        function success(data: any) {
            event.sender.send(callback, data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function checkUpdates(): void {
    https.get('https://raw.githubusercontent.com/rmraya/XLIFFManager/master/package.json', (res: IncomingMessage) => {
        if (res.statusCode === 200) {
            let rawData = '';
            res.on('data', (chunk: string) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    if (app.getVersion() !== parsedData.version) {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Updates Available',
                            message: 'Version ' + parsedData.version + ' is available'
                        });
                    } else {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            message: 'There are currently no updates available.'
                        });
                    }
                } catch (e) {
                    dialog.showErrorBox('Error', e.message);
                }
            });
        } else {
            dialog.showErrorBox('Error', 'Updates Request Failed.\nStatus code: ' + res.statusCode);
        }
    }).on('error', (e: any) => {
        dialog.showErrorBox('Error', e.message);
    });
}

function createMenu(): void {
    var helpMenu: Menu = Menu.buildFromTemplate([
        { label: 'XLIFF Manager User Guide', accelerator: 'F1', click: function () { showHelp() } },
        { type: 'separator' },
        { label: 'Check for Updates', click: function () { checkUpdates() } },
        { label: 'View Release History', click: function () { releaseHistory() } }
    ]);
    var template: MenuItem[] = [
        new MenuItem({ label: 'Help', role: 'help', submenu: helpMenu })
    ];

    if (process.platform === 'darwin') {
        var appleMenu: Menu = Menu.buildFromTemplate([
            { label: 'About XLIFF Manager', click: function () { showAbout() } },
            { label: 'Preferences...', accelerator: 'Cmd+,', click: function () { showSettings() } },
            { type: 'separator' },
            {
                label: 'Services', role: 'services', submenu: [
                    { label: 'No Services Apply', enabled: false }
                ]
            },
            { type: 'separator' },
            { label: 'Quit XLIFF Manager', accelerator: 'Cmd+Q', role: 'quit', click: function () { app.quit() } }
        ]);
        template.unshift(new MenuItem({ label: 'XLIFF Manager', submenu: appleMenu }));
    } else {
        var fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'Settings', click: function () { showSettings() } },
            { type: 'separator' }
        ]);
        template.unshift(new MenuItem({ label: 'File', submenu: fileMenu }));
    }

    if (process.platform == 'win32') {
        template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: function () { app.quit() } }));
        template[1].submenu.append(new MenuItem({ type: 'separator' }));
        template[1].submenu.append(new MenuItem({ label: 'About...', click: function () { showAbout() } }));
    }

    if (process.platform === 'linux') {
        template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: function () { app.quit() } }));
        template[1].submenu.append(new MenuItem({ type: 'separator' }));
        template[1].submenu.append(new MenuItem({ label: 'About...', click: function () { showAbout() } }));
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showAbout(): void {
    var about = new BrowserWindow({
        parent: mainWindow,
        width: 270,
        height: 320,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    if (process.platform !== 'darwin') {
        about.removeMenu();
    }
    about.loadURL('file://' + app.getAppPath() + '/html/about.html');
    about.show();
}

function getVersion(event: IpcMainEvent): void {
    sendRequest({ command: 'version' },
        function success(data: any) {
            const jsonPackage = require('../package.json');
            data.xliffManager = jsonPackage.version;
            event.sender.send('set-version', data);
        },
        function error(reason: string) {
            dialog.showErrorBox('Error', reason);
            console.log(reason);
        }
    );
}

function showHelp(): void {
    var help = app.getAppPath() + '/xliffmanager.pdf';
    if (process.platform == 'win32') {
        help = app.getAppPath() + '\\xliffmanager.pdf'
    }
    shell.openItem(help);
}

function showSettings(): void {
    settings = new BrowserWindow({
        parent: mainWindow,
        width: 590,
        height: 220,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    if (process.platform !== 'darwin') {
        settings.removeMenu();
    }
    settings.loadURL('file://' + app.getAppPath() + '/html/settings.html');
    // settings.webContents.openDevTools();
    settings.show();
}

function selectSrx(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        title: 'Default Catalog',
        defaultPath: defaultCatalog,
        properties: ['openFile'],
        filters: [
            { name: 'SRX File', extensions: ['srx'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('srx-received', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function selectCatalog(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        title: 'Default Catalog',
        defaultPath: defaultCatalog,
        properties: ['openFile'],
        filters: [
            { name: 'XML File', extensions: ['xml'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('catalog-received', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function selectSkeleton(event: IpcMainEvent): void {
    dialog.showOpenDialog({
        title: 'Skeleton Folder',
        defaultPath: sklFolder,
        properties: ['openDirectory', 'createDirectory']
    }).then((value) => {
        if (!value.canceled) {
            event.sender.send('skeleton-received', value.filePaths[0]);
        }
    }).catch((error) => {
        console.log(error);
    });
}

function releaseHistory(): void {
    shell.openExternal("https://www.maxprograms.com/products/xliffmanagerlog.html");
}

function sendRequest(json: any, success: any, error: any): void {
    const postData: string = JSON.stringify(json);
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/FilterServer',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }
    // Make a request
    var req: ClientRequest = request(options);
    req.on('response',
        function (res: IncomingMessage) {
            res.setEncoding('utf-8');
            if (res.statusCode != 200) {
                error('sendRequest() error: ' + res.statusMessage);
            }
            var rawData: string = '';
            res.on('data', function (chunk: string) {
                rawData += chunk;
            });
            res.on('end', function () {
                try {
                    success(JSON.parse(rawData));
                } catch (e) {
                    error(e.message);
                }
            });
        }
    );
    req.write(postData);
    req.end();
}
