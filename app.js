/*******************************************************************************
 * Copyright (c) 2018-2019 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
const { app, ipcMain, BrowserWindow, dialog } = require('electron');
const spawn = require('child_process').spawn;
const fs = require('fs');
var request = require('request');
const http = require('http');
const https = require('https');

let win;
let settings;
let javapath;
let status;
let appHome;
let sklFolder;
let defaultCatalog;
let defaultSRX;
let defaultSrcLang = 'none';
let defaultTgtLang = 'none';

const locked = app.requestSingleInstanceLock();

if (!locked) {
    app.quit()
} else {
    if (win) {
        // Someone tried to run a second instance, we should focus our window.
        if (win.isMinimized()) {
            mainWindow.restore()
        }
        win.focus()
    }
}

if (process.platform == 'win32') {
    javapath = __dirname + '\\bin\\java.exe';
    appHome = app.getPath('appData') + '\\xliffmanager\\';
    sklFolder = appHome + 'skl\\';
    defaultCatalog = app.getAppPath() + '\\catalog\\catalog.xml';
    defaultSRX = app.getAppPath() + '\\srx\\default.srx';
} else {
    javapath = __dirname + '/bin/java';
    appHome = app.getPath('appData') + '/xliffmanager/';
    sklFolder = appHome + 'skl/';
    defaultCatalog = app.getAppPath() + '/catalog/catalog.xml';
    defaultSRX = app.getAppPath() + '/srx/default.srx';
}

loadDefaults();

const ls = spawn(javapath, ['--module-path', 'lib', '-m', 'xliffFilters/com.maxprograms.server.FilterServer'], { cwd: __dirname })
ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

function stopServer() {
    request('http://localhost:8000/FilterServer/stop', { 'timeout': 20000 }, function (error, response, body) {
        if (error) {
            if (ls) {
                ls.kill();
            }
        }
    });
}

function checkServer(url, timeout) {
    request(url, { 'timeout': timeout }, function (error, response, body) {
        if (error) {
            console.log(error);
            dialog.showMessageBox({ type: 'error', message: 'Server not ready yet' });
        }
    });
}

app.on('ready', () => {
    checkServer('http://localhost:8000/FilterServer', 20000);
    createWindows();
    win.show();
    // win.webContents.openDevTools();
});

app.on('quit', () => {
    stopServer();
})

app.on('window-all-closed', function () {
    stopServer();
    app.quit()
})

function createWindows() {
    win = new BrowserWindow({
        width: 580,
        height: 660,
        maximizable: false,
        show: false,
        backgroundColor: '#2d2d2e',
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.on('closed', () => {
        win = null;
    });
    win.setMenu(null);
    win.loadURL('file://' + __dirname + '/main.html');
}

ipcMain.on('select-source-file', (event, arg) => {
    var files = dialog.showOpenDialog({
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
            { name: 'TS (Qt Linguist translation source)', extensions: ['ts'] },
            { name: 'TXML Document', extensions: ['txml'] },
            { name: 'Visio XML Drawing', extensions: ['vsdx'] },
            { name: 'XML Document', extensions: ['xml'] }
        ]
    });
    if (files) {
        getFileType(event, files[0]);
    }
});

ipcMain.on('select-xliff-file', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    });
    if (files) {
        event.sender.send('add-xliff-file', files[0]);
        getTargetFile(event, files[0]);
    }
});

ipcMain.on('select-xliff-validation', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    });
    if (files) {
        event.sender.send('add-xliff-validation', files[0]);
    }
});

ipcMain.on('select-xliff-analysis', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'XLIFF File', extensions: ['xlf'] }
        ]
    });
    if (files) {
        event.sender.send('add-xliff-analysis', files[0]);
    }
});

ipcMain.on('select-ditaval', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'DITAVAL File', extensions: ['ditaval'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    });
    if (files) {
        event.sender.send('add-ditaval-file', files[0]);
    }
});

ipcMain.on('select-target-file', (event, arg) => {
    var file = dialog.showSaveDialog({ title: 'Target File/Folder' });
    if (file) {
        event.sender.send('add-target-file', file);
    }
});

ipcMain.on('select-skeleton', (event, arg) => {
    var file = dialog.showOpenDialog({
        title: 'Skeleton Folder',
        defaultPath: sklFolder,
        properties: ['openDirectory', 'createDirectory']
    });
    if (file) {
        event.sender.send('skeleton-received', { sklFolder: file[0] });
    }
});

ipcMain.on('select-catalog', (event, arg) => {
    var files = dialog.showOpenDialog({
        title: 'Default Catalog',
        defaultPath: defaultCatalog,
        properties: ['openFile'],
        filters: [
            { name: 'XML File', extensions: ['xml'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    });
    if (files) {
        event.sender.send('catalog-received', { catalog: files[0] });
    }
});

ipcMain.on('select-srx', (event, arg) => {
    var files = dialog.showOpenDialog({
        title: 'Default Catalog',
        defaultPath: defaultCatalog,
        properties: ['openFile'],
        filters: [
            { name: 'SRX File', extensions: ['srx'] },
            { name: 'Any File', extensions: ['*'] }
        ]
    });
    if (files) {
        event.sender.send('srx-received', { srx: files[0] });
    }
});

ipcMain.on('show-about', (event, arg) => {
    var about = new BrowserWindow({
        parent: win,
        width: 270,
        height: 320,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false, backgroundColor: '#2d2d2e',
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    about.setMenu(null);
    about.loadURL('file://' + __dirname + '/about.html');
    about.show();
});

ipcMain.on('show-settings', (event, arg) => {
    settings = new BrowserWindow({
        parent: win,
        width: 590,
        height: 190,
        minimizable: false,
        maximizable: false,
        resizable: false,
        show: false,
        backgroundColor: '#2d2d2e',
        icon: './icons/openxliff.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    settings.setMenu(null);
    settings.loadURL('file://' + __dirname + '/settings.html');
    settings.show();
});

ipcMain.on('save-defaults', (event, arg) => {
    saveDefaults(arg);
});

function saveDefaults(defaults) {
    fs.writeFile(appHome + 'defaults.json', JSON.stringify(defaults), function (err) {
        if (err) {
            dialog.showMessageBox({ type: 'error', message: err.message });
            return;
        }
        defaultCatalog = defaults.catalog;
        sklFolder = defaults.skeleton;
        defaultSrcLang = defaults.srcLang;
        defaultTgtLang = defaults.tgtLang;
        defaultSRX = defaults.srx;
        settings.close();
    });
}

function loadDefaults() {
    fs.readFile(appHome + 'defaults.json', function (err, data) {
        if (err instanceof Error) {
            return;
        }
        let defaults = JSON.parse(data);
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
    });
}

function getFileType(event, file) {
    request.post('http://localhost:8000/FilterServer', { json: { command: 'getFileType', file: file } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('add-source-file', body);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
}

function getTargetFile(event, file) {
    request.post('http://localhost:8000/FilterServer', { json: { command: 'getTargetFile', file: file } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.result === 'Success') {
                    event.sender.send('add-target-file', body.target);
                } else {
                    dialog.showErrorBox('Error', body.reason);
                }
            } else {
                dialog.showErrorBox('Error', error);
            }
        }
    );
}

ipcMain.on('convert', (event, arg) => {
    arg.sklFolder = sklFolder;
    arg.catalog = defaultCatalog;
    arg.srx = defaultSRX;
    request.post('http://localhost:8000/FilterServer', { json: arg },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('conversion-started', '');
                status = 'running';
                var intervalObject = setInterval(function () {
                    getStatus(body.process);
                    if (status === 'completed') {
                        getResult(body.process, event, 'conversionResult', 'conversion-completed');
                        clearInterval(intervalObject);
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        clearInterval(intervalObject);
                        event.sender.send('show-error', error);
                    }
                }, 1000);
            } else {
                dialog.showErrorBox('Error', error);
            }
        }
    );
});

function getStatus(processId) {
    request.post('http://localhost:8000/FilterServer', { json: { command: 'status', process: processId } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                status = body.status;
            } else {
                status = 'error!';
            }
        }
    );
}

ipcMain.on('validate', (event, arg) => {
    arg.catalog = defaultCatalog;
    request.post('http://localhost:8000/FilterServer', { json: arg },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('validation-started', '');
                status = 'running';
                var intervalObject = setInterval(function () {
                    getStatus(body.process);
                    if (status === 'completed') {
                        getResult(body.process, event, 'validationResult', 'validation-result');
                        clearInterval(intervalObject);
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        event.sender.send('show-error', status);
                        clearInterval(intervalObject);
                    }
                }, 1000);
            } else {
                dialog.showErrorBox('Error', error);
            }
        });
});

function getResult(processId, event, command, callback) {
    var arg = { command: command, process: processId }
    request.post('http://localhost:8000/FilterServer', { json: arg },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send(callback, body);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
}

ipcMain.on('analyse', (event, arg) => {
    arg.catalog = defaultCatalog;
    request.post('http://localhost:8000/FilterServer', { json: arg },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('analysis-started', '');
                status = 'running';
                var intervalObject = setInterval(function () {
                    getStatus(body.process);
                    if (status === 'completed') {
                        getResult(body.process, event, 'analysisResult', 'analysis-completed');
                        clearInterval(intervalObject);
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        event.sender.send('show-error', status);
                        clearInterval(intervalObject);
                    }
                }, 1000);
            } else {
                dialog.showErrorBox('Error', error);
            }
        });
});

ipcMain.on('merge', (event, arg) => {
    arg.catalog = defaultCatalog;
    request.post('http://localhost:8000/FilterServer', { json: arg },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('merge-created', '');
                status = 'running';
                var intervalObject = setInterval(function () {
                    getStatus(body.process);
                    if (status === 'completed') {
                        getResult(body.process, event, 'mergeResult', 'merge-completed');
                        clearInterval(intervalObject);
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    }
                }, 1000);
            } else {
                dialog.showErrorBox('Error', error);
            }
        }
    );
});

ipcMain.on('get-version', (event) => {
    http.get('http://localhost:8000/FilterServer/', (res) => {
        const { statusCode } = res;
        if (statusCode !== 200) {
            event.sender.send('show-error', 'Version Request Failed.\nStatus code: ' + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                event.sender.send('set-version', parsedData);
            } catch (e) {
                console.error(e.message);
                event.sender.send('show-error', e.message);
            }
        });
    }).on('error', (e) => {
        console.error(e.message);
        event.sender.send('show-error', e.message);
    });
});

ipcMain.on('get-languages', (event) => {
    http.get('http://localhost:8000/FilterServer/getLanguages', (res) => {
        const { statusCode } = res;
        if (statusCode !== 200) {
            event.sender.send('show-error', 'Languages Request Failed.\nStatus code: ' + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                parsedData.srcLang = defaultSrcLang;
                parsedData.tgtLang = defaultTgtLang;
                event.sender.send('languages-received', parsedData);
            } catch (e) {
                console.error(e.message);
                event.sender.send('show-error', e.message);
            }
        });
    }).on('error', (e) => {
        console.error(e.message);
        event.sender.send('show-error', e.message);
    });
});

ipcMain.on('get-skeleton', (event) => {
    event.sender.send('skeleton-received', { sklFolder: sklFolder });
});

ipcMain.on('get-catalog', (event) => {
    event.sender.send('catalog-received', { catalog: defaultCatalog });
});

ipcMain.on('get-srx', (event) => {
    event.sender.send('srx-received', { srx: defaultSRX });
});

ipcMain.on('get-charsets', (event) => {
    http.get('http://localhost:8000/FilterServer/getCharsets', (res) => {
        const { statusCode } = res;
        if (statusCode !== 200) {
            event.sender.send('show-error', 'Charsets Request Failed.\nStatus code: ' + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                event.sender.send('charsets-received', parsedData);
            } catch (e) {
                console.error(e.message);
                event.sender.send('show-error', e.message);
            }
        });
    }).on('error', (e) => {
        console.error(e.message);
        event.sender.send('show-error', e.message);
    });
});

ipcMain.on('get-types', (event) => {
    http.get('http://localhost:8000/FilterServer/getTypes', (res) => {
        const { statusCode } = res;
        if (statusCode !== 200) {
            event.sender.send('show-error', 'Types Request Failed.\nStatus code: ' + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                event.sender.send('types-received', parsedData);
            } catch (e) {
                event.sender.send('show-error', e.message);
            }
        });
    }).on('error', (e) => {
        event.sender.send('show-error', e.message);
    });
});

ipcMain.on('check-updates', (event) => {
    https.get('https://raw.githubusercontent.com/rmraya/XLIFFManager/master/package.json', (res) => {
        if (res.statusCode === 200) {
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    if (app.getVersion() !== parsedData.version) {
                        dialog.showMessageBox(win, {
                            type: 'info',
                            title: 'Updates Available',
                            message: 'Version ' + parsedData.version + ' is available'
                        });
                    } else {
                        dialog.showMessageBox(win, {
                            type: 'info',
                            message: 'There are currently no updates available.'
                        });
                    }
                } catch (e) {
                    event.sender.send('show-error', e.message);
                }
            });
        } else {
            event.sender.send('show-error', 'Updates Request Failed.\nStatus code: ' + res.statusCode);
        }
    }).on('error', (e) => {
        event.sender.send('show-error', e.message);
    });
});