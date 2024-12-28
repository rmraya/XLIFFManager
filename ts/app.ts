/*******************************************************************************
 * Copyright (c) 2018 - 2024 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { spawnSync, SpawnSyncReturns } from "child_process";
import { app, BrowserWindow, ClientRequest, dialog, ipcMain, IpcMainEvent, Menu, MenuItem, MessageBoxReturnValue, nativeTheme, net, session, shell } from "electron";
import { IncomingMessage } from "electron/main";
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { Language, LanguageUtils } from "typesbcp47";
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

    static latestVersion: string;
    static downloadLink: string;

    static i18n: I18n;
    static lang: string = 'en';

    static javaErrors: boolean = false;

    constructor() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else if (App.mainWindow) {
            if (App.mainWindow.isMinimized()) {
                App.mainWindow.restore();
            }
            App.mainWindow.focus();
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

        app.on('ready', () => {
            this.createWindow();
            this.createMenu();
            App.mainWindow.once('ready-to-show', () => {
                App.loadLocation();
                App.mainWindow.show();
                App.startup();
            });
        });

        app.on('window-all-closed', () => {
            app.quit();
        });

        nativeTheme.on('updated', () => {
            this.loadDefaults();
            let dark = App.path.join(app.getAppPath(), 'css', 'dark.css');
            let light = App.path.join(app.getAppPath(), 'css', 'light.css');
            let highcontrast = App.path.join(app.getAppPath(), 'css', 'highcontrast.css');
            if (App.defaultTheme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    App.currentTheme = dark;
                } else {
                    App.currentTheme = light;
                }
                if (nativeTheme.shouldUseHighContrastColors) {
                    App.currentTheme = highcontrast;
                }
                let windows: BrowserWindow[] = BrowserWindow.getAllWindows();
                for (let window of windows) {
                    window.webContents.send('set-theme', App.currentTheme);
                }
            }
        });

        ipcMain.on('main-height', (event: IpcMainEvent, arg: any) => {
            App.mainWindow.setContentSize(arg.width, arg.height);
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
        ipcMain.on('approve-all', (event: IpcMainEvent, xliff: string) => {
            this.approveAll(event, xliff);
        });
        ipcMain.on('copy-sources', (event: IpcMainEvent, xliff: string) => {
            this.copySources(event, xliff);
        });
        ipcMain.on('pseudo-translate', (event: IpcMainEvent, xliff: string) => {
            this.pseudoTranslate(event, xliff);
        });
        ipcMain.on('remove-targets', (event: IpcMainEvent, xliff: string) => {
            this.removeTargets(event, xliff);
        });
        ipcMain.on('validate', (event: IpcMainEvent, xliff: string) => {
            this.validate(event, xliff);
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
        ipcMain.on('analyse', (event: IpcMainEvent, file: string) => {
            this.analyse(event, file);
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
            if (arg.key && arg.window) {
                arg.message = App.i18n.getString(arg.window, arg.key);
            }
            dialog.showMessageBoxSync(arg);
        });
        ipcMain.on('licenses-height', (event: IpcMainEvent, arg: any) => {
            App.setHeight(App.licensesWindow, arg);
        });
        ipcMain.on('close-licenses', () => {
            App.destroyWindow(App.licensesWindow);
        });
        ipcMain.on('open-license', (event: IpcMainEvent, arg: any) => {
            App.openLicense();
        });
    }

    static startup(): void {
        App.mainWindow.webContents.send('get-height', App.currentTheme);
        setTimeout(() => {
            App.checkUpdates(true);
        }, 800);
    }

    static runJava(module: string, arg: string[]): string {
        App.javaErrors = false;
        let javapath: string = process.platform === 'win32' ? App.path.join(app.getAppPath(), 'bin', 'java.exe') : App.path.join(app.getAppPath(), 'bin', 'java');
        let params: string[] = ['--module-path', 'lib', '-m', module];
        if (arg) {
            params = params.concat(arg);
        }
        let ls: SpawnSyncReturns<Buffer> = spawnSync(javapath, params, { cwd: app.getAppPath(), windowsHide: true });
        let stdout: Buffer = ls.stdout;
        let stderr: Buffer = ls.stderr;
        if (stderr.length > 0) {
            if (stderr.toString().indexOf('SEVERE:') !== -1) {
                App.javaErrors = true;
            }
            return stderr.toString();
        }
        return stdout.toString();
    }

    static setHeight(window: BrowserWindow, arg: any) {
        window.setContentSize(arg.width, arg.height);
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
            height: 500,
            maximizable: false,
            show: false,
            icon: App.appIcon,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
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
        let highcontrast = App.path.join(app.getAppPath(), 'css', 'highcontrast.css');
        if (App.defaultTheme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                App.currentTheme = dark;
            } else {
                App.currentTheme = light;
            }
            if (nativeTheme.shouldUseHighContrastColors) {
                App.currentTheme = highcontrast;
            }
        }
        if (App.defaultTheme === 'dark') {
            App.currentTheme = dark;
        }
        if (App.defaultTheme === 'light') {
            App.currentTheme = light;
        }
        if (App.defaultTheme === 'highcontrast') {
            App.currentTheme = highcontrast;
        }
    }

    setTheme(): void {
        App.mainWindow.webContents.send('set-theme', App.currentTheme);
    }

    getLanguages(event: IpcMainEvent): void {
        let languages: Array<Language> = LanguageUtils.getCommonLanguages(App.lang);
        let data: any = {
            srcLang: App.defaultSrcLang,
            tgtLang: App.defaultTgtLang,
            none: App.i18n.getString('Main', 'selectLanguage'),
            languages: languages
        };
        event.sender.send('languages-received', data);
    }

    getPackageLanguages(event: IpcMainEvent, arg: any): void {
        let result: string = App.runJava('openxliff/com.maxprograms.converters.sdlppx.Sdlppx2Xliff', ['-lang', App.lang, '-file', arg.package]);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        let parsed: any = JSON.parse(result);
        event.sender.send('package-languages', parsed);
    }

    getXliffLanguages(event: IpcMainEvent, arg: any): void {
        let result: string = App.runJava('openxliff/com.maxprograms.converters.xliff.XliffUtils', ['-lang', App.lang, '-file', arg.xliff]);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        let parsed: any = JSON.parse(result);
        event.sender.send('xliff-languages', parsed);
    }

    getCharsets(event: IpcMainEvent): void {
        let charsets: any = JSON.parse(App.runJava('openxliff/com.maxprograms.converters.EncodingResolver', ['-lang', App.lang, '-list']).trim());
        let data: any = {
            none: App.i18n.getString('Main', 'selectCharset'),
            charsets: charsets
        }
        event.sender.send('charsets-received', data);
    }

    getTypes(event: IpcMainEvent): void {
        let types: any = JSON.parse(App.runJava('openxliff/com.maxprograms.converters.FileFormats', ['-lang', App.lang, '-list']).trim());
        let data: any = {
            none: App.i18n.getString('Main', 'selectFileType'),
            types: types
        }
        event.sender.send('types-received', data);
    }

    selectSourceFile(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] },
                { name: App.i18n.getString('FileFormats', 'icml'), extensions: ['icml'] },
                { name: App.i18n.getString('FileFormats', 'inx'), extensions: ['inx'] },
                { name: App.i18n.getString('FileFormats', 'idml'), extensions: ['idml'] },
                { name: App.i18n.getString('FileFormats', 'ditamap'), extensions: ['ditamap', 'dita', 'xml'] },
                { name: App.i18n.getString('FileFormats', 'html'), extensions: ['html', 'htm'] },
                { name: App.i18n.getString('FileFormats', 'javascript'), extensions: ['js'] },
                { name: App.i18n.getString('FileFormats', 'properties'), extensions: ['properties'] },
                { name: App.i18n.getString('FileFormats', 'json'), extensions: ['json'] },
                { name: App.i18n.getString('FileFormats', 'mif'), extensions: ['mif'] },
                { name: App.i18n.getString('FileFormats', 'office'), extensions: ['docx', 'xlsx', 'pptx'] },
                { name: App.i18n.getString('FileFormats', 'openOffice1'), extensions: ['sxw', 'sxc', 'sxi', 'sxd'] },
                { name: App.i18n.getString('FileFormats', 'openOffice2'), extensions: ['odt', 'ods', 'odp', 'odg'] },
                { name: App.i18n.getString('FileFormats', 'plainText'), extensions: ['txt'] },
                { name: App.i18n.getString('FileFormats', 'po'), extensions: ['po', 'pot'] },
                { name: App.i18n.getString('FileFormats', 'rc'), extensions: ['rc'] },
                { name: App.i18n.getString('FileFormats', 'resx'), extensions: ['resx'] },
                { name: App.i18n.getString('FileFormats', 'sdlxliff'), extensions: ['sdlxliff'] },
                { name: App.i18n.getString('FileFormats', 'srt'), extensions: ['srt'] },
                { name: App.i18n.getString('FileFormats', 'svg'), extensions: ['svg'] },
                { name: App.i18n.getString('FileFormats', 'tradosPackage'), extensions: ['sdlppx'] },
                { name: App.i18n.getString('FileFormats', 'ts'), extensions: ['ts'] },
                { name: App.i18n.getString('FileFormats', 'txml'), extensions: ['txml'] },
                { name: App.i18n.getString('FileFormats', 'visio'), extensions: ['vsdx'] },
                { name: App.i18n.getString('FileFormats', 'txlf'), extensions: ['txlf'] },
                { name: App.i18n.getString('FileFormats', 'xliff'), extensions: ['xlf', 'xliff', 'mqxliff', 'txlf'] },
                { name: App.i18n.getString('FileFormats', 'xml'), extensions: ['xml'] }
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
                { name: App.i18n.getString('FileFormats', 'xliffFile'), extensions: ['xlf'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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
                { name: App.i18n.getString('FileFormats', 'ditaval'), extensions: ['ditaval'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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
                { name: App.i18n.getString('FileFormats', 'jsonFile'), extensions: ['json'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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
        let file: any = {
            source: arg.file,
            xliff: arg.file + '.xlf',
            type: arg.type,
            catalog: App.defaultCatalog,
            enc: arg.enc,
            srcLang: arg.srcLang,
            tgtLang: arg.tgtLang,
            srx: App.defaultSRX,
            is20: arg.is20,
            is21: arg.is21
        }
        if (arg.embed) {
            file.embed = true;
        } else {
            let baseName: string = App.path.basename(arg.file);
            let extension: string = App.path.extname(baseName);
            let name: string = baseName.substring(0, baseName.length - extension.length);
            let skeletonName = name + Date.now() + '.skl';
            let skeleton = App.path.join(App.sklFolder, skeletonName);
            file.skl = skeleton;
        }
        if (arg.paragraph) {
            file.paragraph = true;
        }
        if (arg.ignoresvg) {
            file.ignoresvg = true;
        }
        if (arg.config) {
            file.config = arg.config;
        }
        if (arg.ditaval) {
            file.ditaval = arg.ditaval;
        }
        let json: any = {
            files: [file]
        }

        let jsonFile: string = App.path.join(app.getPath('temp'), 'convert.json');
        writeFileSync(jsonFile, JSON.stringify(json, null, 2));

        event.sender.send('set-status', { status: App.i18n.getString('App', 'creatingXliff') });

        let result: string = App.runJava('openxliff/com.maxprograms.converters.Convert', ['-lang', App.lang, '-json', jsonFile]);

        if (App.javaErrors) {
            let errorLine: string = '';
            let lines: string[] = result.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].indexOf('SEVERE') !== -1) {
                    errorLine = lines[i];
                }
            }
            event.sender.send('conversion-completed', { result: 'Error', reason: errorLine });
        } else {
            event.sender.send('conversion-completed', { result: 'Success' });
        }
    }

    selectXliffValidation(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('FileFormats', 'xliffFile'), extensions: ['xlf'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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
                { name: App.i18n.getString('FileFormats', 'xliffFile'), extensions: ['xlf'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-tasks', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    validate(event: IpcMainEvent, xliff: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'validatingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.validation.XliffChecker', ['-lang', App.lang, '-xliff', xliff, '-catalog', App.defaultCatalog]);
        event.sender.send('validation-completed');
        while (result.indexOf('SEVERE:') !== -1) {
            result = result.substring(result.indexOf('SEVERE:') + 'SEVERE:'.length);
        }
        if (result.indexOf('INFO:') !== -1) {
            result = result.substring(result.indexOf('INFO:') + 'INFO:'.length);
        }
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        dialog.showMessageBox(App.mainWindow, {
            type: 'info',
            message: result,
        });
    }

    copySources(event: IpcMainEvent, xliff: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'processingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.converters.CopySources', ['-lang', App.lang, '-xliff', xliff, '-catalog', App.defaultCatalog]);
        event.sender.send('process-completed');
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
        }
    }

    pseudoTranslate(event: IpcMainEvent, xliff: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'processingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.converters.PseudoTranslation', ['-lang', App.lang, '-xliff', xliff, '-catalog', App.defaultCatalog]);
        event.sender.send('process-completed');
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
        }
    }

    removeTargets(event: IpcMainEvent, xliff: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'processingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.converters.RemoveTargets', ['-lang', App.lang, '-xliff', xliff, '-catalog', App.defaultCatalog]);
        event.sender.send('process-completed');
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
        }
    }

    approveAll(event: IpcMainEvent, xliff: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'processingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.converters.ApproveAll', ['-lang', App.lang, '-xliff', xliff, '-catalog', App.defaultCatalog]);
        event.sender.send('process-completed');
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
        }
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
        let params: string[] = ['-lang', App.lang, '-xliff', arg.xliff, '-target', arg.target, '-catalog', App.defaultCatalog];
        if (arg.unapproved) {
            params.push('-unapproved');
        }
        if (arg.exportTmx) {
            params.push('-export');
        }
        event.sender.send('set-status', { status: App.i18n.getString('App', 'mergingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.converters.Merge', params);
        console.log(result);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        event.sender.send('merge-completed');
    }

    selectXliffAnalysis(event: IpcMainEvent): void {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: App.i18n.getString('FileFormats', 'xliffFile'), extensions: ['xlf'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
            ]
        }).then((value: Electron.OpenDialogReturnValue) => {
            if (!value.canceled) {
                event.sender.send('add-xliff-analysis', value.filePaths[0]);
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    analyse(event: IpcMainEvent, file: string): void {
        event.sender.send('set-status', { status: App.i18n.getString('App', 'analysingXliff') });
        let result: string = App.runJava('openxliff/com.maxprograms.stats.RepetitionAnalysis', ['-lang', App.lang, '-xliff', file, '-catalog', App.defaultCatalog]);
        console.log(result);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        event.sender.send('analysis-completed');
    }

    getFileType(event: IpcMainEvent, file: string): void {
        let params: any = { file: file };
        let result: string = App.runJava('openxliff/com.maxprograms.converters.FileFormats', ['-file', file]);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        } else {
            let parsed: any = JSON.parse(result);
            params.type = parsed.format;
            if (parsed.format !== 'Unknown') {
                result = App.runJava('openxliff/com.maxprograms.converters.EncodingResolver', ['-file', file, '-type', parsed.format]);
                if (!App.javaErrors) {
                    parsed = JSON.parse(result);
                    params.encoding = parsed.encoding;
                }
            } else {
                params.encoding = 'Unknown';
            }
        }
        event.sender.send('add-source-file', params);
    }

    getTargetFile(event: IpcMainEvent, file: string): void {
        let result: string = App.runJava('openxliff/com.maxprograms.converters.Merge', ['-xliff', file, '-getTarget']);
        if (App.javaErrors) {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), result);
            return;
        }
        event.sender.send('add-target-file', result);
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
                                height: 220,
                                minimizable: false,
                                maximizable: false,
                                resizable: false,
                                show: false,
                                icon: App.appIcon,
                                useContentSize: true,
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
        let editMenu: Menu = Menu.buildFromTemplate([
            { label: App.i18n.getString('App', 'cut'), accelerator: 'CmdOrCtrl+X', click: () => { BrowserWindow.getFocusedWindow()?.webContents.cut(); } },
            { label: App.i18n.getString('App', 'copy'), accelerator: 'CmdOrCtrl+C', click: () => { BrowserWindow.getFocusedWindow()?.webContents.copy(); } },
            { label: App.i18n.getString('App', 'paste'), accelerator: 'CmdOrCtrl+V', click: () => { BrowserWindow.getFocusedWindow()?.webContents.paste(); } },
            { label: App.i18n.getString('App', 'selectAll'), accelerator: 'CmdOrCtrl+A', click: () => { BrowserWindow.getFocusedWindow()?.webContents.selectAll(); } }
        ]);
        let viewMenu: Menu = Menu.buildFromTemplate([
            { label: App.i18n.getString('App', 'createXliffView'), accelerator: 'CmdOrCtrl+1', click: () => { App.createXliffView(); } },
            { label: App.i18n.getString('App', 'mergeXliffView'), accelerator: 'CmdOrCtrl+2', click: () => { App.mergeXliffView(); } },
            { label: App.i18n.getString('App', 'validateXliffView'), accelerator: 'CmdOrCtrl+3', click: () => { App.validateXliffView(); } },
            { label: App.i18n.getString('App', 'analyseXliffView'), accelerator: 'CmdOrCtrl+4', click: () => { App.analyzeXliffView(); } },
            { label: App.i18n.getString('App', 'translationTaskView'), accelerator: 'CmdOrCtrl+5', click: () => { App.translationTasksView(); } },
        ]);
        let helpMenu: Menu = Menu.buildFromTemplate([
            { label: App.i18n.getString('App', 'userGuide'), accelerator: 'F1', click: () => { App.showHelp() } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'checkUpdates'), click: () => { App.checkUpdates(false); } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'viewLicenses'), click: () => { App.openLicense(); } },
            { type: 'separator' },
            { label: App.i18n.getString('App', 'releaseHistory'), click: () => { App.releaseHistory(); } },
            { label: App.i18n.getString('App', 'supportGroup'), click: () => { App.showSupportGroup(); } },
        ]);
        let template: MenuItem[] = [
            new MenuItem({ label: App.i18n.getString('App', 'editMenu'), submenu: editMenu }),
            new MenuItem({ label: App.i18n.getString('App', 'helpMenu'), role: 'help', submenu: helpMenu })
        ];
        if (!app.isPackaged) {
            viewMenu.append(new MenuItem({ type: 'separator' }));
            viewMenu.append(new MenuItem({ label: App.i18n.getString('App', 'developmentTools'), accelerator: 'F12', click: () => { App.mainWindow.webContents.openDevTools() } }));
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
            template = [
                new MenuItem({ label: App.i18n.getString('App', 'xliffManager'), submenu: appleMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'editMenu'), submenu: editMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'viewMenu'), submenu: viewMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'helpMenu'), role: 'help', submenu: helpMenu })
            ];
        } else {
            let fileMenu: Menu = Menu.buildFromTemplate([]);
            template = [
                new MenuItem({ label: App.i18n.getString('App', 'fileMenu'), submenu: fileMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'editMenu'), submenu: editMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'viewMenu'), submenu: viewMenu }),
                new MenuItem({ label: App.i18n.getString('App', 'settingsMenu'), click: () => { App.showSettings(); } }),
                new MenuItem({ label: App.i18n.getString('App', 'helpMenu'), role: 'help', submenu: helpMenu })
            ];
        }

        if (process.platform === 'win32') {
            if (template[0].submenu) {
                template[0].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'exit'), accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            }
            if (template[4].submenu) {
                template[4].submenu.append(new MenuItem({ type: 'separator' }));
                template[4].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'about'), click: () => { App.showAbout(); } }));
            }
        }

        if (process.platform === 'linux') {
            if (template[0].submenu) {
                template[0].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'quit'), accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            }
            if (template[4].submenu) {
                template[4].submenu.append(new MenuItem({ type: 'separator' }));
                template[4].submenu.append(new MenuItem({ label: App.i18n.getString('App', 'about'), click: () => { App.showAbout(); } }));
            }
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    static showAbout(): void {
        App.aboutWindow = new BrowserWindow({
            parent: App.mainWindow,
            width: 380,
            height: 460,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.appIcon,
            useContentSize: true,
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
        let version: any = JSON.parse(App.runJava('openxliff/com.maxprograms.converters.Constants', []).trim());
        let data: any = {
            'XLIFFManager': app.getVersion(),
            'Java': version.java + ' - ' + version.javaVendor,
            'XMLJava': version.xmlVersion + ' - ' + version.xmlBuild,
            'OpenXLIFF': version.version + ' - ' + version.build,
            'BCP47J': version.bcp47jVersion + ' - ' + version.bcp47jBuild,
            'electron': process.versions.electron
        };
        event.sender.send('set-version', data);
    }

    static showHelp(): void {
        shell.openExternal('file://' + App.path.join(app.getAppPath(), 'xliffmanager_' + App.lang + '.pdf'), {
            activate: true, workingDirectory: app.getAppPath()
        }).catch((error: Error) => {
            dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
        });
    }

    static showSettings(): void {
        App.settingsWindow = new BrowserWindow({
            parent: App.mainWindow,
            width: 640,
            height: 410,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.appIcon,
            useContentSize: true,
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
                { name: App.i18n.getString('FileFormats', 'srxFile'), extensions: ['srx'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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
                { name: App.i18n.getString('FileFormats', 'xmlFile'), extensions: ['xml'] },
                { name: App.i18n.getString('FileFormats', 'anyFile'), extensions: ['*'] }
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

    static openLicense() {
        let licenseFile = 'file://' + this.path.join(app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
        let title = 'Eclipse Public License 1.0';
        let licenseWindow = new BrowserWindow({
            parent: this.licensesWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: App.appIcon,
            useContentSize: true,
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
            App.mainWindow.focus();
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
            response.on('error', (error: Error) => {
                App.mainWindow.webContents.send('set-status', { status: '' });
                dialog.showErrorBox(App.i18n.getString('App', 'error'), error.message);
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(0);
                }
            });
        });
        request.end();
    }

    static createXliffView(): void {
        App.mainWindow.webContents.send('show-createXliff');
    }

    static mergeXliffView(): void {
        App.mainWindow.webContents.send('show-mergeXliff');
    }

    static validateXliffView(): void {
        App.mainWindow.webContents.send('show-validateXliff');
    }

    static analyzeXliffView(): void {
        App.mainWindow.webContents.send('show-analyzeXliff');
    }

    static translationTasksView(): void {
        App.mainWindow.webContents.send('show-translationTasks');
    }
}

try {
    new App();
} catch (e) {
    console.error(e);
}