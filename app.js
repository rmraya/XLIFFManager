const {app, ipcMain, BrowserWindow, dialog} = require('electron');
const spawn = require('child_process').spawn;
var request = require('request');

let win;
let javapath;
let killed = false;
let status;

const locked = app.requestSingleInstanceLock()

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
    javapath = __dirname + '\\bin\\java.exe'
} else {
    javapath = __dirname + '/bin/java'
}

const ls = spawn(javapath, ['--module-path', 'lib' ,'-m', 'xliffFilters/com.maxprograms.server.FilterServer'], {cwd: __dirname})
ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

function stopServer() {
    if (!killed) {
        ls.kill();
        killed = true;
    }
}

app.on('ready', () => {
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
    win = new BrowserWindow({width: 600, height: 540, show: false, backgroundColor: '#333333', icon: './icons/openxliff.png'});
    win.on('closed', () => {
        win = null;
    });
    win.setMenu(null);
    win.loadURL(`file://${__dirname}/main.html`); 
}

ipcMain.on('select-source-file', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters:[
            {name: 'Any File', extensions: ['*']},
            {name: 'Adobe InDesign Interchange', extensions: ['inx']},
            {name: 'Adobe InDesign IDML', extensions: ['idml']},
            {name: 'DITA Map', extensions: ['ditamap','dita','xml']},
            {name: 'HTML Page', extensions: ['html','htm']},
            {name: 'JavaScript', extensions: ['js']},
            {name: 'Java Properties', extensions: ['properties']},
            {name: 'MIF (Maker Interchange Format)', extensions: ['mif']},
            {name: 'Microsoft Office 2007 Document', extensions: ['docx','xlsx','pptx']},
            {name: 'OpenOffice 1.x Document', extensions: ['sxw','sxc','sxi','sxd']},
            {name: 'OpenOffice 2.x Document', extensions: ['odt','ods','odp','odg']},
            {name: 'Plain Text', extensions: ['txt']},
            {name: 'PO (Portable Objects)', extensions: ['po','pot']},
            {name: 'RC (Windows C/C++ Resources)', extensions: ['rc']},
            {name: 'ResX (Windows .NET Resources)', extensions: ['resx']},
            {name: 'SDLXLIFF Document', extensions: ['sdlxliff']},
            {name: 'SVG (Scalable Vector Graphics)', extensions: ['svg']},
            {name: 'TS (Qt Linguist translation source)', extensions: ['ts']},
            {name: 'TXML Document', extensions: ['txml']},
            {name: 'Visio XML Drawing', extensions: ['vsdx']},
            {name: 'XML Document', extensions: ['xml']}
        ]
    });
    if (files) {
        getFileType(event, files[0]); 
    }
});

ipcMain.on('select-xliff-file', (event, arg) => {
    var files = dialog.showOpenDialog({
        properties: ['openFile'],
        filters:[
            {name: 'XLIFF File', extensions: ['xlf']}
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
        filters:[
            {name: 'XLIFF File', extensions: ['xlf']}
        ]
    });
    if (files) {
        event.sender.send('add-xliff-validation', files[0]);
    }
});

ipcMain.on('select-target-file', (event, arg) => {
    var file = dialog.showSaveDialog({title: 'Target File/Folder'});
    if (file) {
        event.sender.send('add-target-file', file);
    }
});

ipcMain.on('show-about', (event, arg) => {
    var about = new BrowserWindow({parent: win, width: 190, height: 310, 
        minimizable: false, maximizable: false, resizable: false,
        show: false, backgroundColor: '#333333', icon: './icons/openxliff.png'
    });
    about.setMenu(null);
    about.loadURL('file://' + __dirname + '/about.html');
    about.show();
});

function getFileType(event, file) {
   request.post('http://localhost:8000/FilterServer',{ json: { command: 'getFileType', file: file} }, 
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
    request.post('http://localhost:8000/FilterServer',{ json: { command: 'getTargetFile', file: file} }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('add-target-file', body.target);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
 }

ipcMain.on('convert', (event,arg) => {
    request.post('http://localhost:8000/FilterServer', {json: arg }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('process-created', '');
                status = 'running';
                var intervalObject = setInterval(function () { 
                    getStatus(body.process);
                    if (status === 'completed') { 
                        event.sender.send('process-completed', status);
                        clearInterval(intervalObject); 
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        event.sender.send('show-error', status);
                        clearInterval(intervalObject); 
                    }
                }, 1000); 
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
});


function getStatus(processId) {
    request.post('http://localhost:8000/FilterServer',{ json: { command: 'status', process: processId} }, 
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
    request.post('http://localhost:8000/FilterServer', {json: arg }, 
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            event.sender.send('validation-started', '');
            status = 'running';
            var intervalObject = setInterval(function () { 
                getStatus(body.process);
                if (status === 'completed') { 
                    event.sender.send('validation-completed');
                    getValidationStatus(body.process, event);
                    clearInterval(intervalObject); 
                } else if (status === 'running') {
                    // it's OK, keep waiting
                } else {
                    event.sender.send('show-error', status);
                    clearInterval(intervalObject); 
                }
            }, 1000); 
        } else {
            event.sender.send('show-error', error);
        }
    });
});

function getValidationStatus(processId, event) {
    var arg = {command:'validationResult', process: processId}
    request.post('http://localhost:8000/FilterServer', {json: arg }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('validation-result', body);
            } else {
                event.sender.send('show-error', error);
            }    
        } 
    );
}
                    

ipcMain.on('merge', (event,arg) => {
    request.post('http://localhost:8000/FilterServer', {json: arg }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('merge-created', '');
                status = 'running';
                var intervalObject = setInterval(function () { 
                    getStatus(body.process);
                    if (status === 'completed') { 
                        event.sender.send('merge-completed', status);
                        clearInterval(intervalObject); 
                    } else if (status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        event.sender.send('show-error', status);
                        clearInterval(intervalObject); 
                    }
                }, 1000); 
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
});

ipcMain.on('get-version', (event) => {
    request.post('http://localhost:8000/FilterServer', {json: {command: 'version'}}, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('set-version', body);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
});

ipcMain.on('get-languages', (event) => {
    request.post('http://localhost:8000/FilterServer', {json: {command: 'getLanguages'} }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('languages-received', body);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
});

ipcMain.on('get-charsets', (event) => {
    request.post('http://localhost:8000/FilterServer', {json: {command: 'getCharsets'} }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('charsets-received', body);
            } else {
                event.sender.send('show-error', error);
            }
        }
    );
});

ipcMain.on('get-types', (event) => {
    request.post('http://localhost:8000/FilterServer', {json: {command: 'getTypes'} }, 
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                event.sender.send('types-received', body);
            } else {
                event.sender.send('show-error', error); 
            }
        }
    );
});
