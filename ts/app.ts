/*******************************************************************************
 * Copyright (c) 2018-2021 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
import { ChildProcessWithoutNullStreams, execFileSync, spawn } from "child_process";
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, Menu, MenuItem, nativeTheme, Rectangle, shell } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ClientRequest, IncomingMessage, request } from "http";

class App {

    static https = require('https');
    static path = require('path');

    static mainWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;

    static currentTheme: string;
    static defaultTheme: string = 'system';
    static appIcon: string;
    static javapath: string;
    static status: string;
    static appHome: string;
    static sklFolder: string;
    static defaultCatalog: string;
    static defaultSRX: string;
    static defaultsFile: string;
    static defaultSrcLang: string = 'none';
    static defaultTgtLang: string = 'none';

    static verticalPadding: number = 46;

    static latestVersion: string;
    static downloadLink: string;

    ls: ChildProcessWithoutNullStreams;
    stopping: boolean;

    constructor() {
        app.allowRendererProcessReuse = true;
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else {
            if (App.mainWindow) {
                if (App.mainWindow.isMinimized()) {
                    App.mainWindow.restore()
                }
                App.mainWindow.focus()
            }
        }
        App.appHome = App.path.join(app.getPath('appData'), app.name);
        App.appIcon = App.path.join(app.getAppPath(), 'icons', 'openxliff.png');
        App.defaultSRX = App.path.join(app.getAppPath(), 'srx', 'default.srx');
        App.defaultCatalog = App.path.join(app.getAppPath(), 'catalog', 'catalog.xml');
        App.sklFolder = App.path.join(app.getPath('appData'), app.name, 'skl');
        App.defaultsFile = App.path.join(app.getPath('appData'), app.name, 'defaults.json');
        if (process.platform === 'win32') {
            App.javapath = App.path.join(app.getAppPath(), 'bin', 'java.exe');
            App.verticalPadding = 56;
        } else {
            App.javapath = App.path.join(app.getAppPath(), 'bin', 'java');
        }
        if (!existsSync(App.appHome)) {
            mkdirSync(App.appHome);
        }
        if (!existsSync(App.defaultsFile)) {
            let defaults: any = {
                srx: App.defaultSRX,
                catalog: App.defaultCatalog,
                skeleton: App.sklFolder,
                theme: 'system'
            }
            writeFileSync(App.defaultsFile, JSON.stringify(defaults));
        }
        this.ls = spawn(App.javapath, ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.FilterServer', '-port', '8000'], { cwd: app.getAppPath() });

        var ck = execFileSync('bin/java', ['--module-path', 'lib', '-m', 'openxliff/com.maxprograms.server.CheckURL', 'http://localhost:8000/FilterServer'], { cwd: app.getAppPath() });
        console.log(ck.toString());

        app.on('ready', () => {
            this.createWindow();
            this.createMenu();
            this.loadDefaults();
            App.mainWindow.once('ready-to-show', (event: IpcMainEvent) => {
                App.loadLocation();
                App.mainWindow.show();
                setTimeout(() => {
                    App.checkUpdates(true);
                }, 1000);
            });
        });

        app.on('quit', () => {
            this.stopServer();
        });

        app.on('window-all-closed', () => {
            this.stopServer();
            app.quit();
        });

        nativeTheme.on('updated', () => {
            this.loadDefaults();
        });

        nativeTheme.on('updated', () => {
            if (App.defaultTheme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    App.currentTheme = App.path.join(app.getAppPath(), 'css', 'dark.css');
                } else {
                    App.currentTheme = App.path.join(app.getAppPath(), 'css', 'light.css');
                }
                App.mainWindow.webContents.send('set-theme', App.currentTheme);
            }
        });

        ipcMain.on('main-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.mainWindow, arg);
        });
        ipcMain.on('about-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.aboutWindow, arg);
        });
        ipcMain.on('close-about', () => {
            App.destroyWindow(App.aboutWindow);
        });
        ipcMain.on('settings-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.settingsWindow, arg);
        });
        ipcMain.on('close-settings', () => {
            App.destroyWindow(App.settingsWindow);
        });
        ipcMain.on('select-source-file', (event) => {
            this.selectSourceFile(event);
        });
        ipcMain.on('select-xliff-file', (event) => {
            this.selectXliffFile(event);
        });
        ipcMain.on('convert', (event, arg) => {
            this.convert(event, arg);
        });
        ipcMain.on('select-xliff-validation', (event) => {
            this.selectXliffValidation(event);
        });
        ipcMain.on('validate', (event, arg) => {
            this.validate(event, arg);
        });
        ipcMain.on('select-xliff-analysis', (event) => {
            this.selectXliffAnalysis(event);
        });
        ipcMain.on('select-ditaval', (event) => {
            this.selectDitaval(event);
        });
        ipcMain.on('select-target-file', (event) => {
            this.selectTargetFile(event);
        });
        ipcMain.on('analyse', (event, arg) => {
            this.analyse(event, arg);
        });
        ipcMain.on('merge', (event, arg) => {
            this.merge(event, arg);
        });
        ipcMain.on('select-skeleton', (event) => {
            this.selectSkeleton(event);
        });
        ipcMain.on('select-catalog', (event) => {
            this.selectCatalog(event);
        });
        ipcMain.on('select-srx', (event) => {
            this.selectSrx(event);
        });
        ipcMain.on('show-about', () => {
            App.showAbout();
        });
        ipcMain.on('show-settings', () => {
            App.showSettings();
        });
        ipcMain.on('save-defaults', (event, arg) => {
            this.saveDefaults(arg);
        });
        ipcMain.on('get-theme', (event) => {
            event.sender.send('set-theme', App.currentTheme);
        });
        ipcMain.on('get-defaultTheme', (event) => {
            event.sender.send('set-defaultTheme', App.defaultTheme);
        });
        ipcMain.on('get-version', (event) => {
            this.getVersion(event);
        });
        ipcMain.on('get-languages', (event) => {
            this.getLanguages(event);
        });
        ipcMain.on('get-skeleton', (event) => {
            event.sender.send('skeleton-received', App.sklFolder);
        });
        ipcMain.on('get-catalog', (event) => {
            event.sender.send('catalog-received', App.defaultCatalog);
        });
        ipcMain.on('get-srx', (event) => {
            event.sender.send('srx-received', App.defaultSRX);
        });
        ipcMain.on('get-charsets', (event) => {
            this.getCharsets(event);
        });
        ipcMain.on('get-types', (event) => {
            this.getTypes(event);
        });
        ipcMain.on('get-package-languages', (event, arg) => {
            this.getPackageLanguages(event, arg);
        });
        ipcMain.on('check-updates', (event) => {
            App.checkUpdates(false);
        });
        ipcMain.on('show-help', () => {
            App.showHelp();
        });
        ipcMain.on('get-versions', (event: IpcMainEvent) => {
            event.sender.send('set-versions', { current: app.getVersion(), latest: App.latestVersion });
        });
        ipcMain.on('updates-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.updatesWindow, arg);
        });
        ipcMain.on('release-history', () => {
            App.releaseHistory();
        });
        ipcMain.on('download-latest', () => {
            App.downloadLatest();
        });
        ipcMain.on('close-updates', () => {
            App.destroyWindow(App.updatesWindow);
        });
        ipcMain.on('show-file', (event, arg) => {
            shell.openExternal('file://' + arg.file, {
                activate: true, workingDirectory: app.getAppPath()
            }).catch((error: Error) => {
                dialog.showErrorBox('Error', error.message);
            });
        });
        ipcMain.on('show-dialog', (event, arg) => {
            dialog.showMessageBox(arg);
        });
    }

    stopServer(): void {
        if (!this.stopping) {
            this.stopping = true;
            this.ls.kill();
        }
    }

    static setHeight(window: BrowserWindow, arg: any) {
        let rect: Rectangle = window.getBounds();
        rect.height = arg.height + App.verticalPadding;
        window.setBounds(rect);
    }

    static destroyWindow(window: BrowserWindow): void {
        if (window) {
            try {
                let parent: BrowserWindow = window.getParentWindow();
                window.hide();
                window.destroy();
                window = undefined;
                if (parent) {
                    parent.focus();
                } else {
                    App.mainWindow.focus();
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    createWindow(): void {
        App.mainWindow = new BrowserWindow({
            width: 620,
            maximizable: false,
            show: false,
            icon: App.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.mainWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', 'main.html'));
        App.mainWindow.on('resize', () => {
            App.saveLocation();
        });
        App.mainWindow.on('move', () => {
            App.saveLocation();
        });
    }

    static saveLocation(): void {
        let defaultsFile: string = App.path.join(app.getPath('appData'), app.name, 'location.json');
        writeFileSync(defaultsFile, JSON.stringify(App.mainWindow.getBounds()));
    }

    static loadLocation(): void {
        let defaultsFile: string = App.path.join(app.getPath('appData'), app.name, 'location.json');
        if (existsSync(defaultsFile)) {
            try {
                var data: Buffer = readFileSync(defaultsFile);
                App.mainWindow.setBounds(JSON.parse(data.toString()));
            } catch (err) {
                console.log(err);
            }
        }
    }

    saveDefaults(defaults: any): void {
        writeFileSync(App.defaultsFile, JSON.stringify(defaults));
        App.settingsWindow.hide();
        App.settingsWindow.destroy();
        App.mainWindow.focus();
        this.loadDefaults();
        this.setTheme();
    }

    loadDefaults(): void {
        var data: Buffer = readFileSync(App.defaultsFile);
        var defaults = JSON.parse(data.toString());

        if (defaults.srx) {
            App.defaultSRX = defaults.srx;
        }
        if (defaults.skeleton) {
            App.sklFolder = defaults.skeleton;
        }
        if (defaults.catalog) {
            App.defaultCatalog = defaults.catalog;
        }
        if (defaults.srcLang) {
            App.defaultSrcLang = defaults.srcLang;
        }
        if (defaults.tgtLang) {
            App.defaultTgtLang = defaults.tgtLang;
        }
        if (defaults.theme) {
            App.defaultTheme = defaults.theme;
        }

        let light = App.path.join(app.getAppPath(), 'css', 'light.css');
        let dark = App.path.join(app.getAppPath(), 'css', 'dark.css');

        if (App.defaultTheme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                App.currentTheme = dark;
            } else {
                App.currentTheme = light;
            }
        }
        if (App.defaultTheme === 'dark') {
            App.currentTheme = dark;
        }
        if (App.defaultTheme === 'light') {
            App.currentTheme = light;
        }
    }

    setTheme(): void {
        App.mainWindow.webContents.send('set-theme', App.currentTheme);
    }

    getLanguages(event: IpcMainEvent): void {
        App.sendRequest({ command: 'getLanguages' },
            function success(data: any) {
                data.srcLang = App.defaultSrcLang;
                data.tgtLang = App.defaultTgtLang;
                event.sender.send('languages-received', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    getPackageLanguages(event: IpcMainEvent, arg: any): void {
        App.sendRequest(arg,
            function success(data: any) {
                event.sender.send('package-languages', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    getCharsets(event: IpcMainEvent): void {
        App.sendRequest({ command: 'getCharsets' },
            function success(data: any) {
                event.sender.send('charsets-received', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    getTypes(event: IpcMainEvent): void {
        App.sendRequest({ command: 'getTypes' },
            function success(data: any) {
                event.sender.send('types-received', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    selectSourceFile(event: IpcMainEvent): void {
        let anyFile: string[] = [];
        if (process.platform === 'linux') {
            anyFile = ['*'];
        }
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Any File', extensions: anyFile },
                { name: 'Adobe InCopy ICML', extensions: ['icml'] },
                { name: 'Adobe InDesign Interchange', extensions: ['inx'] },
                { name: 'Adobe InDesign IDML', extensions: ['idml'] },
                { name: 'DITA Map', extensions: ['ditamap', 'dita', 'xml'] },
                { name: 'HTML Page', extensions: ['html', 'htm'] },
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'Java Properties', extensions: ['properties'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'MIF (Maker Interchange Format)', extensions: ['mif'] },
                { name: 'Microsoft Office 2007 Document', extensions: ['docx', 'xlsx', 'pptx'] },
                { name: 'OpenOffice 1.x Document', extensions: ['sxw', 'sxc', 'sxi', 'sxd'] },
                { name: 'OpenOffice 2.x Document', extensions: ['odt', 'ods', 'odp', 'odg'] },
                { name: 'Plain Text', extensions: ['txt'] },
                { name: 'PO (Portable Objects)', extensions: ['po', 'pot'] },
                { name: 'RC (Windows C/C++ Resources)', extensions: ['rc'] },
                { name: 'ResX (Windows .NET Resources)', extensions: ['resx'] },
                { name: 'SDLXLIFF Document', extensions: ['sdlxliff'] },
                { name: 'SRT Subtitle', extensions: ['srt'] },
                { name: 'SVG (Scalable Vector Graphics)', extensions: ['svg'] },
                { name: 'Trados Studio Package', extensions: ['sdlppx'] },
                { name: 'TS (Qt Linguist translation source)', extensions: ['ts'] },
                { name: 'TXML Document', extensions: ['txml'] },
                { name: 'Visio XML Drawing', extensions: ['vsdx'] },
                { name: 'XLIFF', extensions: ['xlf', 'xliff', 'mqxliff', 'txlf'] },
                { name: 'XML Document', extensions: ['xml'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                this.getFileType(event, value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    selectXliffFile(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'XLIFF File', extensions: ['xlf'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-file', value.filePaths[0]);
                this.getTargetFile(event, value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    selectDitaval(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'DITAVAL File', extensions: ['ditaval'] },
                { name: 'Any File', extensions: [] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('add-ditaval-file', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    convert(event: IpcMainEvent, arg: any): void {
        arg.sklFolder = App.sklFolder;
        arg.catalog = App.defaultCatalog;
        arg.srx = App.defaultSRX;
        App.sendRequest(arg,
            function success(data: any) {
                event.sender.send('conversion-started');
                App.status = 'running';
                var intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'conversionResult', 'conversion-completed');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
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

    selectXliffValidation(event: IpcMainEvent): void {
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

    validate(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            function success(data: any) {
                event.sender.send('validation-started', '');
                App.status = 'running';
                var intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'validationResult', 'validation-result');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
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

    selectTargetFile(event: IpcMainEvent): void {
        dialog.showSaveDialog({ title: 'Target File/Folder' }).then((value) => {
            if (!value.canceled) {
                event.sender.send('add-target-file', value.filePath);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    merge(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            function success(data: any) {
                event.sender.send('merge-created');
                App.status = 'running';
                var intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'mergeResult', 'merge-completed');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
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

    selectXliffAnalysis(event: IpcMainEvent): void {
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

    analyse(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            function success(data: any) {
                event.sender.send('analysis-started');
                App.status = 'running';
                var intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'analysisResult', 'analysis-completed');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
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

    getFileType(event: IpcMainEvent, file: string): void {
        App.sendRequest({ command: 'getFileType', file: file },
            function success(data: any) {
                event.sender.send('add-source-file', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    getTargetFile(event: IpcMainEvent, file: string): void {
        App.sendRequest({ command: 'getTargetFile', file: file },
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

    static getStatus(processId: string): void {
        App.sendRequest({ command: 'status', process: processId },
            function success(data: any) {
                App.status = data.status;
            },
            function error(reason: string) {
                App.status = 'error';
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    static getResult(processId: string, event: IpcMainEvent, command: string, callback: string): void {
        App.sendRequest({ command: command, process: processId },
            function success(data: any) {
                event.sender.send(callback, data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    static checkUpdates(silent: boolean): void {
        App.https.get('https://maxprograms.com/xliffchecker.json', (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                let rawData = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        if (app.getVersion() !== parsedData.version) {
                            App.latestVersion = parsedData.version;
                            switch (process.platform) {
                                case 'darwin': App.downloadLink = parsedData.darwin;
                                    break;
                                case 'win32': App.downloadLink = parsedData.win32;
                                    break;
                                case 'linux': App.downloadLink = parsedData.linux;
                                    break;
                            }
                            App.updatesWindow = new BrowserWindow({
                                parent: this.mainWindow,
                                width: 600,
                                useContentSize: true,
                                minimizable: false,
                                maximizable: false,
                                resizable: false,
                                show: false,
                                icon: App.appIcon,
                                webPreferences: {
                                    nodeIntegration: true,
                                    contextIsolation: false
                                }
                            });
                            App.updatesWindow.setMenu(null);
                            App.updatesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', 'updates.html'));
                            App.updatesWindow.once('ready-to-show', () => {
                                App.updatesWindow.show();
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBox(App.mainWindow, {
                                    type: 'info',
                                    message: 'There are currently no updates available'
                                });
                            }
                        }
                    } catch (e) {
                        dialog.showMessageBox(App.mainWindow, { type: 'error', message: e.message });
                    }
                });
            } else {
                if (!silent) {
                    dialog.showMessageBox(App.mainWindow, { type: 'error', message: 'Updates Request Failed.\nStatus code: ' + res.statusCode });
                }
            }
        }).on('error', (e: any) => {
            if (!silent) {
                dialog.showMessageBox(App.mainWindow, { type: 'error', message: e.message });
            }
        });
    }

    createMenu(): void {
        var helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'XLIFF Manager User Guide', accelerator: 'F1', click: () => { App.showHelp() } },
            { type: 'separator' },
            { label: 'Check for Updates', click: () => { App.checkUpdates(false) } },
            { label: 'View Release History', click: () => { App.releaseHistory() } }
        ]);
        var template: MenuItem[] = [
            new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];

        if (process.platform === 'darwin') {
            var appleMenu: Menu = Menu.buildFromTemplate([
                { label: 'About XLIFF Manager', click: () => { App.showAbout() } },
                { label: 'Preferences...', accelerator: 'Cmd+,', click: () => { App.showSettings() } },
                { type: 'separator' },
                {
                    label: 'Services', role: 'services', submenu: [
                        { label: 'No Services Apply', enabled: false }
                    ]
                },
                { type: 'separator' },
                { label: 'Quit XLIFF Manager', accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit() } }
            ]);
            template.unshift(new MenuItem({ label: 'XLIFF Manager', submenu: appleMenu }));
        } else {
            var fileMenu: Menu = Menu.buildFromTemplate([
                { label: 'Settings', click: () => { App.showSettings() } },
                { type: 'separator' }
            ]);
            template.unshift(new MenuItem({ label: '&File', submenu: fileMenu }));
        }

        if (process.platform === 'win32') {
            template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit() } }));
            template[1].submenu.append(new MenuItem({ type: 'separator' }));
            template[1].submenu.append(new MenuItem({ label: 'About...', click: () => { App.showAbout() } }));
        }

        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit() } }));
            template[1].submenu.append(new MenuItem({ type: 'separator' }));
            template[1].submenu.append(new MenuItem({ label: 'About...', click: () => { App.showAbout() } }));
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    static showAbout(): void {
        App.aboutWindow = new BrowserWindow({
            parent: App.mainWindow,
            width: 320,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.aboutWindow.setMenu(null);
        App.aboutWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', 'about.html'));
        App.aboutWindow.once('ready-to-show', (event: IpcMainEvent) => {
            App.aboutWindow.show();
        });
    }

    getVersion(event: IpcMainEvent): void {
        App.sendRequest({ command: 'version' },
            function success(data: any) {
                data.xliffManager = app.getVersion();
                event.sender.send('set-version', data);
            },
            function error(reason: string) {
                dialog.showErrorBox('Error', reason);
                console.log(reason);
            }
        );
    }

    static showHelp(): void {
        shell.openExternal('file://' + App.path.join(app.getAppPath(), 'xliffmanager.pdf'), {
            activate: true, workingDirectory: app.getAppPath()
        }).catch((error: Error) => {
            dialog.showErrorBox('Error', error.message);
        });
    }

    static showSettings(): void {
        App.settingsWindow = new BrowserWindow({
            parent: App.mainWindow,
            width: 640,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.settingsWindow.setMenu(null);
        App.settingsWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', 'settings.html'));
        App.settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            App.settingsWindow.show();
        });
    }

    selectSrx(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Default SRX File',
            defaultPath: App.defaultSRX,
            properties: ['openFile'],
            filters: [
                { name: 'SRX File', extensions: ['srx'] },
                { name: 'Any File', extensions: [] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('srx-received', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    selectCatalog(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Default Catalog',
            defaultPath: App.defaultCatalog,
            properties: ['openFile'],
            filters: [
                { name: 'XML File', extensions: ['xml'] },
                { name: 'Any File', extensions: [] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('catalog-received', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    selectSkeleton(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: 'Skeleton Folder',
            defaultPath: App.sklFolder,
            properties: ['openDirectory', 'createDirectory']
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('skeleton-received', value.filePaths[0]);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static releaseHistory(): void {
        shell.openExternal("https://www.maxprograms.com/products/xliffmanagerlog.html").catch((error: Error) => {
            dialog.showErrorBox('Error', error.message);
        });
    }

    static sendRequest(json: any, success: any, error: any): void {
        var postData: string = JSON.stringify(json);
        var options = {
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
            (res: IncomingMessage) => {
                res.setEncoding('utf-8');
                if (res.statusCode != 200) {
                    error('sendRequest() error: ' + res.statusMessage);
                }
                var rawData: string = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        success(JSON.parse(rawData));
                    } catch (e) {
                        console.log('Received data: ' + rawData);
                        error(e.message);
                    }
                });
            }
        );
        req.write(postData, (err: Error) => {
            if (err) {
                console.log('Write error:  ' + err.message);
            }
        });
        req.on('error', (err: Error) => {
            error(err.message);
            console.log('Error:  ' + err.message);
            console.log('Params: ' + JSON.stringify(json));
        });
        req.end();
    }

    static downloadLatest(): void {
        shell.openExternal(App.downloadLink).catch((reason: any) => {
            if (reason instanceof Error) {
                console.log(reason.message);
            }
            dialog.showErrorBox('Error', 'Unable to download latest version.');
        });
    }
}

new App();