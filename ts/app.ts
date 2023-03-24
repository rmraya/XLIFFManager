/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
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
import { app, BrowserWindow, ClientRequest, dialog, ipcMain, IpcMainEvent, Menu, MenuItem, MessageBoxReturnValue, nativeTheme, net, Rectangle, session, shell } from "electron";
import { IncomingMessage } from "electron/main";
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { I18n } from "./i18n";

class App {

    static path = require('path');

    static mainWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;

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

    static i18n: I18n;
    static lang: string = 'en';

    ls: ChildProcessWithoutNullStreams;
    stopping: boolean = false;

    constructor() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else {
            if (App.mainWindow) {
                if (App.mainWindow.isMinimized()) {
                    App.mainWindow.restore();
                }
                App.mainWindow.focus();
            }
        }
        App.appHome = App.path.join(app.getPath('appData'), app.name);
        App.appIcon = App.path.join(app.getAppPath(), 'icons', 'openxliff.png');
        App.defaultSRX = App.path.join(app.getAppPath(), 'srx', 'default.srx');
        App.defaultCatalog = App.path.join(app.getAppPath(), 'catalog', 'catalog.xml');
        App.sklFolder = App.path.join(app.getPath('appData'), app.name, 'skl');
        App.defaultsFile = App.path.join(app.getPath('appData'), app.name, 'defaults.json');
        App.javapath = App.path.join(app.getAppPath(), 'bin', 'java');
        if (process.platform === 'win32') {
            App.javapath = App.path.join(app.getAppPath(), 'bin', 'java.exe');
            App.verticalPadding = 60;
        }
        if (!existsSync(App.appHome)) {
            mkdirSync(App.appHome);
        }
        if (!existsSync(App.defaultsFile)) {
            let defaults: any = {
                srx: App.defaultSRX,
                catalog: App.defaultCatalog,
                skeleton: App.sklFolder,
                theme: 'system',
                appLang: 'en'
            }
            writeFileSync(App.defaultsFile, JSON.stringify(defaults, null, 2));
        }
        this.loadDefaults();

        App.i18n = new I18n(App.path.join(app.getAppPath(), 'i18n', 'xliffmanager_' + App.lang + '.json'));

        this.ls = spawn(App.javapath, ['--module-path', 'lib', '-m', 'xliffmanager/com.maxprograms.server.FilterServer', '-port', '8000', '-lang', App.lang], { cwd: app.getAppPath() });
        if (!app.isPackaged) {
            this.ls.stdout.on('data', (data: Buffer | string) => {
                console.log(data instanceof Buffer ? data.toString() : data);
            });
            this.ls.stderr.on('data', (data: Buffer | string) => {
                console.error(data instanceof Buffer ? data.toString() : data);
            });
        }
        execFileSync(App.javapath, ['--module-path', 'lib', '-m', 'xliffmanager/com.maxprograms.server.CheckURL', 'http://localhost:8000/FilterServer'], { cwd: app.getAppPath() });

        app.on('ready', () => {
            this.createWindow();
            this.createMenu();
            App.mainWindow.once('ready-to-show', () => {
                App.loadLocation();
                App.mainWindow.show();
                App.startup();
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
            let rect: Rectangle = App.mainWindow.getBounds();
            if (rect.height < arg.height + App.verticalPadding) {
                rect.height = arg.height + App.verticalPadding;
                App.mainWindow.setBounds(rect);
            }
        });
        ipcMain.on('about-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.aboutWindow, arg);
        });
        ipcMain.on('close-about', () => {
            App.destroyWindow(App.aboutWindow);
        });
        ipcMain.on('licenses-clicked', () => {
            App.showLicenses({ from: 'about' });
        });
        ipcMain.on('settings-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.settingsWindow, arg);
        });
        ipcMain.on('close-settings', () => {
            App.destroyWindow(App.settingsWindow);
        });
        ipcMain.on('select-source-file', (event: IpcMainEvent) => {
            this.selectSourceFile(event);
        });
        ipcMain.on('select-xliff-file', (event: IpcMainEvent) => {
            this.selectXliffFile(event);
        });
        ipcMain.on('convert', (event: IpcMainEvent, arg: any) => {
            this.convert(event, arg);
        });
        ipcMain.on('select-xliff-validation', (event: IpcMainEvent) => {
            this.selectXliffValidation(event);
        });
        ipcMain.on('select-xliff-tasks', (event: IpcMainEvent) => {
            this.selectXliffTasks(event);
        });
        ipcMain.on('processTask', (event: IpcMainEvent, arg: any) => {
            this.processTask(event, arg);
        });
        ipcMain.on('validate', (event: IpcMainEvent, arg: any) => {
            this.validate(event, arg);
        });
        ipcMain.on('select-xliff-analysis', (event: IpcMainEvent) => {
            this.selectXliffAnalysis(event);
        });
        ipcMain.on('select-ditaval', (event: IpcMainEvent) => {
            this.selectDitaval(event);
        });
        ipcMain.on('select-config', (event: IpcMainEvent) => {
            this.selectConfig(event);
        });
        ipcMain.on('select-target-file', (event: IpcMainEvent) => {
            this.selectTargetFile(event);
        });
        ipcMain.on('analyse', (event: IpcMainEvent, arg: any) => {
            this.analyse(event, arg);
        });
        ipcMain.on('merge', (event: IpcMainEvent, arg: any) => {
            this.merge(event, arg);
        });
        ipcMain.on('select-skeleton', (event: IpcMainEvent) => {
            this.selectSkeleton(event);
        });
        ipcMain.on('select-catalog', (event: IpcMainEvent) => {
            this.selectCatalog(event);
        });
        ipcMain.on('select-srx', (event: IpcMainEvent) => {
            this.selectSrx(event);
        });
        ipcMain.on('show-about', () => {
            App.showAbout();
        });
        ipcMain.on('show-settings', () => {
            App.showSettings();
        });
        ipcMain.on('save-defaults', (event: IpcMainEvent, arg: any) => {
            this.saveDefaults(arg);
        });
        ipcMain.on('get-theme', (event: IpcMainEvent) => {
            event.sender.send('set-theme', App.currentTheme);
        });
        ipcMain.on('get-defaultTheme', (event: IpcMainEvent) => {
            event.sender.send('set-defaultTheme', App.defaultTheme);
        });
        ipcMain.on('get-appLanguage', (event: IpcMainEvent) => {
            event.sender.send('set-appLanguage', App.lang);
        });
        ipcMain.on('get-version', (event: IpcMainEvent) => {
            this.getVersion(event);
        });
        ipcMain.on('get-languages', (event: IpcMainEvent) => {
            this.getLanguages(event);
        });
        ipcMain.on('get-skeleton', (event: IpcMainEvent) => {
            event.sender.send('skeleton-received', App.sklFolder);
        });
        ipcMain.on('get-catalog', (event: IpcMainEvent) => {
            event.sender.send('catalog-received', App.defaultCatalog);
        });
        ipcMain.on('get-srx', (event: IpcMainEvent) => {
            event.sender.send('srx-received', App.defaultSRX);
        });
        ipcMain.on('get-charsets', (event: IpcMainEvent) => {
            this.getCharsets(event);
        });
        ipcMain.on('get-types', (event: IpcMainEvent) => {
            this.getTypes(event);
        });
        ipcMain.on('get-package-languages', (event: IpcMainEvent, arg: any) => {
            this.getPackageLanguages(event, arg);
        });
        ipcMain.on('get-xliff-languages', (event: IpcMainEvent, arg: any) => {
            this.getXliffLanguages(event, arg);
        });
        ipcMain.on('check-updates', () => {
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
        ipcMain.on('show-home', () => {
            App.showHomePage();
        });
        ipcMain.on('download-latest', () => {
            App.downloadLatest();
        });
        ipcMain.on('close-updates', () => {
            App.destroyWindow(App.updatesWindow);
        });
        ipcMain.on('show-file', (event: IpcMainEvent, arg: any) => {
            shell.openExternal('file://' + arg.file, {
                activate: true, workingDirectory: app.getAppPath()
            }).catch((error: Error) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
            });
        });
        ipcMain.on('show-dialog', (event: IpcMainEvent, arg: any) => {
            if (arg.key) {
                arg.message = App.i18n.getString('Main', arg.key);
            }
            if (arg.titleKey) {
                arg.title = App.i18n.getString('Main', arg.titleKey);
            }
            dialog.showMessageBox(arg);
        });
        ipcMain.on('show-message', (event: IpcMainEvent, arg: any) => {
            dialog.showMessageBoxSync(arg);
        });
        ipcMain.on('licenses-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.licensesWindow, arg);
        });
        ipcMain.on('close-licenses', () => {
            App.destroyWindow(App.licensesWindow);
        });
        ipcMain.on('open-license', (event: IpcMainEvent, arg: any) => {
            App.openLicense(arg.type);
        });
    }

    static startup(): void {
        App.mainWindow.webContents.send('get-height', App.currentTheme);
        setTimeout(() => {
            App.checkUpdates(true);
        }, 800);
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
                let parent: BrowserWindow | null = window.getParentWindow();
                window.hide();
                window.destroy();
                if (parent) {
                    parent.focus();
                } else {
                    App.mainWindow.focus();
                }
            } catch (error: any) {
                console.error(error);
            }
        }
    }

    createWindow(): void {
        App.mainWindow = new BrowserWindow({
            width: 860,
            maximizable: false,
            show: false,
            icon: App.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            height: 500
        });
        App.mainWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', App.lang, 'main.html'));
        App.mainWindow.on('move', () => {
            App.saveLocation();
        });
    }

    static saveLocation(): void {
        let defaultsFile: string = App.path.join(app.getPath('appData'), app.name, 'position.json');
        let position: number[] = App.mainWindow.getPosition();
        let pos: any = { x: position[0], y: position[1] }
        writeFileSync(defaultsFile, JSON.stringify(pos, null, 2));
    }

    static loadLocation(): void {
        let defaultsFile: string = App.path.join(app.getPath('appData'), app.name, 'position.json');
        if (existsSync(defaultsFile)) {
            try {
                let data: Buffer = readFileSync(defaultsFile);
                let pos: any = JSON.parse(data.toString());
                App.mainWindow.setPosition(pos.x, pos.y);
            } catch (error: any) {
                console.error(error);
            }
        }
    }

    saveDefaults(defaults: any): void {
        writeFileSync(App.defaultsFile, JSON.stringify(defaults, null, 2));
        App.settingsWindow.hide();
        App.settingsWindow.destroy();
        App.mainWindow.focus();
        this.loadDefaults();
        this.setTheme();
    }

    loadDefaults(): void {
        let data: Buffer = readFileSync(App.defaultsFile);
        let defaults = JSON.parse(data.toString());

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
        if (defaults.appLang) {
            if (app.isReady() && defaults.appLang !== App.lang) {
                dialog.showMessageBox({
                    type: 'question',
                    message: App.i18n.getString('App', 'languageChanged'),
                    buttons: [App.i18n.getString('App', 'restart'), App.i18n.getString('App', 'dismiss')],
                    cancelId: 1
                }).then((value: MessageBoxReturnValue) => {
                    if (value.response == 0) {
                        app.relaunch();
                        app.quit();
                    }
                });
            }
            App.lang = defaults.appLang;
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
            (data: any) => {
                data.srcLang = App.defaultSrcLang;
                data.tgtLang = App.defaultTgtLang;
                data.none = App.i18n.getString('Main', 'selectLanguage');
                event.sender.send('languages-received', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getPackageLanguages(event: IpcMainEvent, arg: any): void {
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('package-languages', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getXliffLanguages(event: IpcMainEvent, arg: any): void {
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('xliff-languages', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getCharsets(event: IpcMainEvent): void {
        App.sendRequest({ command: 'getCharsets' },
            (data: any) => {
                data.none = App.i18n.getString('Main', 'selectCharset');
                event.sender.send('charsets-received', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getTypes(event: IpcMainEvent): void {
        App.sendRequest({ command: 'getTypes' },
            (data: any) => {
                data.none = App.i18n.getString('Main', 'selectFileType');
                event.sender.send('types-received', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
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
                { name: App.i18n.getString('App', 'anyFile'), extensions: anyFile },
                { name: App.i18n.getString('App', 'icml'), extensions: ['icml'] },
                { name: App.i18n.getString('App', 'inx'), extensions: ['inx'] },
                { name: App.i18n.getString('App', 'idml'), extensions: ['idml'] },
                { name: App.i18n.getString('App', 'ditamap'), extensions: ['ditamap', 'dita', 'xml'] },
                { name: App.i18n.getString('App', 'html'), extensions: ['html', 'htm'] },
                { name: App.i18n.getString('App', 'javascript'), extensions: ['js'] },
                { name: App.i18n.getString('App', 'properties'), extensions: ['properties'] },
                { name: App.i18n.getString('App', 'json'), extensions: ['json'] },
                { name: App.i18n.getString('App', 'mif'), extensions: ['mif'] },
                { name: App.i18n.getString('App', 'office'), extensions: ['docx', 'xlsx', 'pptx'] },
                { name: App.i18n.getString('App', 'openOffice1'), extensions: ['sxw', 'sxc', 'sxi', 'sxd'] },
                { name: App.i18n.getString('App', 'openOffice2'), extensions: ['odt', 'ods', 'odp', 'odg'] },
                { name: App.i18n.getString('App', 'plainText'), extensions: ['txt'] },
                { name: App.i18n.getString('App', 'po'), extensions: ['po', 'pot'] },
                { name: App.i18n.getString('App', 'rc'), extensions: ['rc'] },
                { name: App.i18n.getString('App', 'resx'), extensions: ['resx'] },
                { name: App.i18n.getString('App', 'sdlxliff'), extensions: ['sdlxliff'] },
                { name: App.i18n.getString('App', 'srt'), extensions: ['srt'] },
                { name: App.i18n.getString('App', 'svg'), extensions: ['svg'] },
                { name: App.i18n.getString('App', 'tradosPackage'), extensions: ['sdlppx'] },
                { name: App.i18n.getString('App', 'ts'), extensions: ['ts'] },
                { name: App.i18n.getString('App', 'txml'), extensions: ['txml'] },
                { name: App.i18n.getString('App', 'visio'), extensions: ['vsdx'] },
                { name: App.i18n.getString('App', 'txlf'), extensions: ['txlf'] },
                { name: App.i18n.getString('App', 'xliff'), extensions: ['xlf', 'xliff', 'mqxliff', 'txlf'] },
                { name: App.i18n.getString('App', 'xml'), extensions: ['xml'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                this.getFileType(event, value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectXliffFile(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'xliffFile'), extensions: ['xlf'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-file', value.filePaths[0]);
                this.getTargetFile(event, value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectDitaval(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'ditaval'), extensions: ['ditaval'] },
                { name: App.i18n.getString('App', 'anyFile'), extensions: [] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-ditaval-file', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectConfig(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'jsonFile'), extensions: ['json'] },
                { name: App.i18n.getString('App', 'anyFile'), extensions: [] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-config-file', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    convert(event: IpcMainEvent, arg: any): void {
        arg.sklFolder = App.sklFolder;
        arg.catalog = App.defaultCatalog;
        arg.srx = App.defaultSRX;
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('conversion-started');
                App.status = 'running';
                let intervalObject = setInterval(() => {
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
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    selectXliffValidation(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'xliffFile'), extensions: ['xlf'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-validation', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectXliffTasks(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'xliffFile'), extensions: ['xlf'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-tasks', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    validate(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('validation-started', '');
                App.status = 'running';
                let intervalObject = setInterval(() => {
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
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    processTask(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('process-started', '');
                App.status = 'running';
                let intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'tasksResult', 'process-completed');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        clearInterval(intervalObject);
                    }
                }, 1000);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    selectTargetFile(event: IpcMainEvent): void {
        dialog.showSaveDialog({
            title: App.i18n.getString('App', 'targetFolder')
        }).then((value: Electron.SaveDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-target-file', value.filePath);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    merge(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('merge-created');
                App.status = 'running';
                let intervalObject = setInterval(() => {
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
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    selectXliffAnalysis(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'xliffFile'), extensions: ['xlf'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-analysis', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    analyse(event: IpcMainEvent, arg: any): void {
        arg.catalog = App.defaultCatalog;
        App.sendRequest(arg,
            (data: any) => {
                event.sender.send('analysis-started');
                App.status = 'running';
                let intervalObject = setInterval(() => {
                    App.getStatus(data.process);
                    if (App.status === 'completed') {
                        App.getResult(data.process, event, 'analysisResult', 'analysis-completed');
                        clearInterval(intervalObject);
                    } else if (App.status === 'running') {
                        // it's OK, keep waiting
                    } else {
                        clearInterval(intervalObject);
                    }
                }, 600);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getFileType(event: IpcMainEvent, file: string): void {
        App.sendRequest({ command: 'getFileType', file: file },
            (data: any) => {
                event.sender.send('add-source-file', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    getTargetFile(event: IpcMainEvent, file: string): void {
        App.sendRequest({ command: 'getTargetFile', file: file },
            (data: any) => {
                if (data.result === 'Success') {
                    event.sender.send('add-target-file', data.target);
                } else {
                    dialog.showErrorBox(App.i18n.getString('App', 'error'), data.reason);
                }
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    static getStatus(processId: string): void {
        App.sendRequest({ command: 'status', process: processId },
            (data: any) => {
                App.status = data.status;
            },
            (reason: string) => {
                App.status = 'error';
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    static getResult(processId: string, event: IpcMainEvent, command: string, callback: string): void {
        App.sendRequest({ command: command, process: processId },
            (data: any) => {
                event.sender.send(callback, data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
            }
        );
    }

    static checkUpdates(silent: boolean): void {
        session.defaultSession.clearCache().then(() => {
            let request: Electron.ClientRequest = net.request({
                url: 'https://maxprograms.com/xliffmanager.json',
                session: session.defaultSession
            });
            request.on('response', (response: IncomingMessage) => {
                let responseData: string = '';
                response.on('data', (chunk: Buffer) => {
                    responseData += chunk;
                });
                response.on('end', () => {
                    try {
                        let parsedData = JSON.parse(responseData);
                        if (app.getVersion() !== parsedData.version) {
                            App.latestVersion = parsedData.version;
                            switch (process.platform) {
                                case 'darwin':
                                    App.downloadLink = process.arch === 'arm64' ? parsedData.arm64 : parsedData.darwin;
                                    break;
                                case 'win32':
                                    App.downloadLink = parsedData.win32;
                                    break;
                                case 'linux':
                                    App.downloadLink = parsedData.linux;
                                    break;
                            }
                            App.updatesWindow = new BrowserWindow({
                                parent: this.mainWindow,
                                width: 600,
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
                            App.updatesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', App.lang, 'updates.html'));
                            App.updatesWindow.once('ready-to-show', () => {
                                App.updatesWindow.show();
                            });
                            App.updatesWindow.on('close', () => {
                                App.mainWindow.focus();
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBox(App.mainWindow, {
                                    type: 'info',
                                    message: App.i18n.getString('App', 'noUpdates')
                                });
                            }
                        }
                    } catch (reason: any) {
                        if (!silent) {
                            dialog.showMessageBox(App.mainWindow, {
                                type: 'error',
                                message: JSON.stringify(reason)
                            });
                        }
                    }
                });
            });
            request.on('error', (error: Error) => {
                if (!silent) {
                    dialog.showMessageBox(App.mainWindow, {
                        type: 'error',
                        message: error.message
                    });
                }
            });
            request.end();
        });
    }

    createMenu(): void {
        let helpMenu: Menu = Menu.buildFromTemplate([
            { label: App.i18n.getString('App', 'userGuide'), accelerator: 'F1', click: () => { App.showHelp() } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'checkUpdates'), click: () => { App.checkUpdates(false); } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'viewLicenses'), click: () => { App.showLicenses({ from: 'menu' }); } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'releaseHistory'), click: () => { App.releaseHistory(); } },
            { label: App.i18n.getString('App', 'supportGroup'), click: () => { App.showSupportGroup(); } },
        ]);
        let template: MenuItem[] = [
            new MenuItem({ label: App.i18n.getString('App', 'helpMenu'), role: 'help', submenu: helpMenu })
        ];
        if (!app.isPackaged) {
            helpMenu.append(new MenuItem({ label: App.i18n.getString('App', 'developmentTools'), accelerator: 'F12', click: () => { App.mainWindow.webContents.openDevTools() } }));
        }

        if (process.platform === 'darwin') {
            let appleMenu: Menu = Menu.buildFromTemplate([
                { label: App.i18n.getString('App', 'aboutMac'), click: () => { App.showAbout(); } },
                { label: App.i18n.getString('App', 'preferences'), accelerator: 'Cmd+,', click: () => { App.showSettings(); } },
                { type: 'separator' },
                {
                    label: App.i18n.getString('App', 'services'), role: 'services', submenu: [
                        { label: App.i18n.getString('App', 'noServices'), enabled: false }
                    ]
                },
                { type: 'separator' },
                { label: App.i18n.getString('App', 'quitMac'), accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit(); } }
            ]);
            template.unshift(new MenuItem({ label: App.i18n.getString('App', 'xliffManager'), submenu: appleMenu }));
        } else {
            let fileMenu: Menu = Menu.buildFromTemplate([
                { label: App.i18n.getString('App', 'settings'), click: () => { App.showSettings(); } },
                { type: 'separator' }
            ]);
            template.unshift(new MenuItem({ label: App.i18n.getString('App', 'fileMenu'), submenu: fileMenu }));
        }

        if (process.platform === 'win32') {
            if (template[0].submenu) {
                template[0].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'exit'), accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            }
            if (template[1].submenu) {
                template[1].submenu.append(new MenuItem({ type: 'separator' }));
                template[1].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'about'), click: () => { App.showAbout(); } }));
            }
        }

        if (process.platform === 'linux') {
            if (template[0].submenu) {
                template[0].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'quit'), accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            }
            if (template[1].submenu) {
                template[1].submenu.append(new MenuItem({ type: 'separator' }));
                template[1].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'about'), click: () => { App.showAbout(); } }));
            }
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    static showAbout(): void {
        App.aboutWindow = new BrowserWindow({
            parent: App.mainWindow,
            width: 360,
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
        App.aboutWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', App.lang, 'about.html'));
        App.aboutWindow.once('ready-to-show', () => {
            App.aboutWindow.show();
        });
        App.aboutWindow.on('close', () => {
            App.mainWindow.focus();
        });
    }

    getVersion(event: IpcMainEvent): void {
        App.sendRequest({ command: 'version' },
            (data: any) => {
                data.xliffManager = App.i18n.format(App.i18n.getString('About', 'xliffmanager'), [app.getVersion()]);
                data.openxliff = App.i18n.format(App.i18n.getString('About', 'openxliff'), [data.tool, data.version, data.build]);
                event.sender.send('set-version', data);
            },
            (reason: string) => {
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                console.log(reason);
            }
        );
    }

    static showHelp(): void {
        shell.openExternal('file://' + App.path.join(app.getAppPath(), 'xliffmanager.pdf'), {
            activate: true, workingDirectory: app.getAppPath()
        }).catch((error: Error) => {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
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
        App.settingsWindow.loadURL('file://' + App.path.join(app.getAppPath(), 'html', App.lang, 'settings.html'));
        App.settingsWindow.once('ready-to-show', () => {
            App.settingsWindow.show();
        });
        App.settingsWindow.on('close', () => {
            App.mainWindow.focus();
        });
    }

    selectSrx(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: App.i18n.getString('App', 'defaultSRX'),
            defaultPath: App.defaultSRX,
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'srxFile'), extensions: ['srx'] },
                { name: App.i18n.getString('App', 'anyFile'), extensions: [] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('srx-received', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectCatalog(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: App.i18n.getString('App', 'defaultCatalog'),
            defaultPath: App.defaultCatalog,
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('App', 'xmlFile'), extensions: ['xml'] },
                { name: App.i18n.getString('App', 'anyFile'), extensions: [] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('catalog-received', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    selectSkeleton(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            title: App.i18n.getString('App', 'skeletonFolder'),
            defaultPath: App.sklFolder,
            properties: ['openDirectory', 'createDirectory']
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('skeleton-received', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    static releaseHistory(): void {
        shell.openExternal("https://www.maxprograms.com/products/xliffmanagerlog.html").catch((error: Error) => {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
        });
    }

    static showLicenses(arg: any): void {
        let parent: BrowserWindow = App.mainWindow;
        if (arg.from === 'about' && App.aboutWindow) {
            parent = App.aboutWindow;
        }
        App.licensesWindow = new BrowserWindow({
            parent: parent,
            width: 430,
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
        App.licensesWindow.setMenu(null);
        App.licensesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', App.lang, 'licenses.html'));
        App.licensesWindow.once('ready-to-show', () => {
            App.licensesWindow.show();
        });
        App.licensesWindow.on('close', () => {
            parent.focus();
        });
    }

    static openLicense(type: string) {
        let licenseFile = '';
        let title = '';
        switch (type) {
            case 'XLIFFManager':
            case "OpenXLIFF":
            case "XMLJava":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "electron":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'electron.txt');
                title = 'MIT License';
                break;
            case "TypeScript":
            case "MapDB":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'Apache2.0.html');
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'java.html');
                title = 'GPL2 with Classpath Exception';
                break;
            case "JSON":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'json.txt');
                title = 'JSON.org License';
                break;
            case "jsoup":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'jsoup.txt');
                title = 'MIT License';
                break;
            case "DTDParser":
                licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'LGPL2.1.txt');
                title = 'LGPL 2.1';
                break;
            default:
                dialog.showErrorBox(App.i18n.getString('App', 'error'), 'Unknown license');
                return;
        }
        let licenseWindow = new BrowserWindow({
            parent: this.licensesWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: App.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        licenseWindow.setMenu(null);
        licenseWindow.loadURL(licenseFile);
        licenseWindow.once('ready-to-show', () => {
            licenseWindow.show();
        });
        licenseWindow.on('close', () => {
            App.licensesWindow.focus();
        });
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/').catch((error: Error) => {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
        });
    }

    static showHomePage(): void {
        shell.openExternal("https://maxprograms.com/").catch((error: Error) => {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
        });
    }

    static sendRequest(json: any, success: Function, error: Function): void {
        let options: any = {
            url: 'http://localhost:8000/FilterServer',
            method: 'POST'
        }
        let request: ClientRequest = net.request(options);
        let responseData: string = '';
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Accept', 'application/json');
        request.on('response', (response: IncomingMessage) => {
            response.on('error', (e: Error) => {
                error(e.message);
            });
            response.on('aborted', () => {
                error(App.i18n.getString('App', 'requestAborted'));
            });
            response.on('end', () => {
                try {
                    let result: any = JSON.parse(responseData);
                    success(result);
                } catch (reason: any) {
                    error(JSON.stringify(reason));
                }
            });
            response.on('data', (chunk: Buffer | string) => {
                responseData += chunk instanceof Buffer ? chunk.toString() : chunk;
            });
        });
        request.on('error', (e: Error) => {
            error(e.message);
        });
        request.write(JSON.stringify(json));
        request.end();
    }

    static downloadLatest(): void {
        let downloadsFolder = app.getPath('downloads');
        let url: URL = new URL(App.downloadLink);
        let path: string = url.pathname;
        path = path.substring(path.lastIndexOf('/') + 1);
        let file: string = downloadsFolder + (process.platform === 'win32' ? '\\' : '/') + path;
        if (existsSync(file)) {
            unlinkSync(file);
        }
        let request: Electron.ClientRequest = net.request({
            url: App.downloadLink,
            session: session.defaultSession
        });
        App.mainWindow.webContents.send('set-status', { status: 'Downloading...' });
        App.updatesWindow.destroy();
        request.on('response', (response: IncomingMessage) => {
            let fileSize = Number.parseInt(response.headers['content-length'] as string);
            let received: number = 0;
            let downloaded: string = App.i18n.getString('App', 'downloaded');
            response.on('data', (chunk: Buffer) => {
                received += chunk.length;
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(received / fileSize);
                }
                App.mainWindow.webContents.send('set-status', {
                    status: App.i18n.format(downloaded, ['' + Math.trunc(received * 100 / fileSize)])
                });
                appendFileSync(file, chunk);
            });
            response.on('end', () => {
                App.mainWindow.webContents.send('set-status', { status: '' });
                dialog.showMessageBox({
                    type: 'info',
                    message: App.i18n.getString('App', 'updateDownloaded')
                });
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(0);
                    shell.openPath(file).then(() => {
                        app.quit();
                    }).catch((reason: string) => {
                        dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                    });
                }
                if (process.platform === 'linux') {
                    shell.showItemInFolder(file);
                }
            });
            response.on('error', (reason: string) => {
                App.mainWindow.webContents.send('set-status', { status: '' });
                dialog.showErrorBox(App.i18n.getString('App', 'error'), reason);
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(0);
                }
            });
        });
        request.end();
    }
}

try {
    new App();
} catch (e) {
    console.error(e);
}