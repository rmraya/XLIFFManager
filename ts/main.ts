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

class Charset {
    code!: string;
    description!: string;
}

class Language {
    code!: string;
    description!: string;
}

class Main {

    electron = require('electron');
    languagesChanged: boolean = false;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');

        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
            this.electron.ipcRenderer.send('get-languages');
        });

        this.electron.ipcRenderer.on('languages-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.languagesReceived(arg);
        });

        this.electron.ipcRenderer.on('types-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.typesReceived(arg);
        });
        this.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatus(arg.status);
        });

        this.electron.ipcRenderer.on('show-createXliff', () => { this.showCreate(); });
        this.electron.ipcRenderer.on('show-mergeXliff', () => { this.showMerge(); });
        this.electron.ipcRenderer.on('show-validateXliff', () => { this.showValidate(); });
        this.electron.ipcRenderer.on('show-analyzeXliff', () => { this.showAnalysis(); });
        this.electron.ipcRenderer.on('show-translationTasks', () => { this.showTasks(); });

        (document.getElementById('createTab') as HTMLAnchorElement).addEventListener('click', () => { this.showCreate(); });
        (document.getElementById('mergeTab') as HTMLAnchorElement).addEventListener('click', () => { this.showMerge(); });
        (document.getElementById('validateTab') as HTMLAnchorElement).addEventListener('click', () => { this.showValidate(); });
        (document.getElementById('analysisTab') as HTMLAnchorElement).addEventListener('click', () => { this.showAnalysis(); });
        (document.getElementById('tasksTab') as HTMLAnchorElement).addEventListener('click', () => { this.showTasks(); });
        (document.getElementById('infoButton') as HTMLAnchorElement).addEventListener('click', () => { this.electron.ipcRenderer.send('show-about'); });
        (document.getElementById('updatesButton') as HTMLAnchorElement).addEventListener('click', () => { this.electron.ipcRenderer.send('check-updates'); });
        (document.getElementById('settingsButton') as HTMLAnchorElement).addEventListener('click', () => { this.electron.ipcRenderer.send('show-settings'); });
        (document.getElementById('browseSource') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-source-file'); });
        (document.getElementById('typeSelect') as HTMLSelectElement).addEventListener('change', () => { this.typeChanged(); });
        (document.getElementById('browseDitaVal') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-ditaval'); });
        (document.getElementById('browseConfig') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-config'); });
        (document.getElementById('createXLIFF') as HTMLButtonElement).addEventListener('click', () => { this.createXLIFF(); });
        (document.getElementById('browseXLIFF') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-file'); });
        (document.getElementById('browseTarget') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-target-file'); });
        (document.getElementById('mergeXLIFF') as HTMLButtonElement).addEventListener('click', () => { this.mergeXLIFF(); });
        (document.getElementById('browseXLIFFValidation') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-validation'); });
        (document.getElementById('validateButton') as HTMLButtonElement).addEventListener('click', () => { this.validate(); });
        (document.getElementById('browseXLIFFAnalysis') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-analysis'); });
        (document.getElementById('analyseButton') as HTMLButtonElement).addEventListener('click', () => { this.analyse(); });
        (document.getElementById('browseXLIFFTasks') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-tasks'); });
        (document.getElementById('copySourcesButton') as HTMLButtonElement).addEventListener('click', () => { this.copySources(); });
        (document.getElementById('pseudoTranslateButton') as HTMLButtonElement).addEventListener('click', () => { this.pseudoTranslate(); });
        (document.getElementById('removeTargetsButton') as HTMLButtonElement).addEventListener('click', () => { this.removeTargets(); });
        (document.getElementById('approveAllButton') as HTMLButtonElement).addEventListener('click', () => { this.approveAll(); });

        this.electron.ipcRenderer.on('add-source-file', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addSourceFile(arg);
        });

        this.electron.ipcRenderer.on('package-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.packageLanguages(arg);
        });

        this.electron.ipcRenderer.on('xliff-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.xliffLanguages(arg);
        });

        this.electron.ipcRenderer.on('add-xliff-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xliffFile') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('add-xliff-validation', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xliffFileValidation') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('add-xliff-analysis', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('add-xliff-tasks', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xliffFileTasks') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('add-target-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('targetFile') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('charsets-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.charsetsReceived(arg);
        });

        this.electron.ipcRenderer.on('process-completed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.processCompleted(arg);
        });

        this.electron.ipcRenderer.on('analysis-completed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.analysisCompleted(arg);
        });

        this.electron.ipcRenderer.on('validation-result', (event: Electron.IpcRendererEvent, arg: any) => {
            this.validationResult(arg);
        });

        this.electron.ipcRenderer.on('conversion-completed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.conversionCompleted(arg);
        });

        this.electron.ipcRenderer.on('merge-completed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.mergeCompleted(arg);
        });

        this.electron.ipcRenderer.on('show-error', (event: Electron.IpcRendererEvent, arg: any) => {
            this.showError(arg);
        });

        this.electron.ipcRenderer.on('add-ditaval-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('ditavalFile') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('add-config-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('configFile') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('get-height', () => {
            // there's only one tab visible at a time
            let height: number = document.getElementsByClassName('tabContent')[0].clientHeight;
            let hiddenTabs: HTMLCollectionOf<Element> = document.getElementsByClassName('hiddenTab');
            for (let i: number = 0; i < hiddenTabs.length; i++) {
                let tabHeight: number = hiddenTabs[i].clientHeight;
                if (tabHeight > height) {
                    height = tabHeight;
                }
            }
            height += 16; // add extra padding at bottom
            this.electron.ipcRenderer.send('main-height', { width: document.body.clientWidth, height: height });
        });
    }

    startWaiting(): void {
        document.body.classList.add("wait");
    }

    endWaiting(): void {
        document.body.classList.remove("wait");
    }

    addSourceFile(arg: any): void {
        (document.getElementById('sourceFile') as HTMLInputElement).value = arg.file;
        let type: string = arg.type;
        if (type !== 'Unknown') {
            (document.getElementById('typeSelect') as HTMLSelectElement).value = type;
            if ('DITA' === type) {
                this.enableDitaVal();
            } else {
                this.disableDitaVal();
            }
            if ('JSON' === type) {
                this.enableConfig();
            } else {
                this.disableConfig();
            }
            if ('XLIFF' === type || 'TXLF' === type || 'WPML' === type || 'SDLXLIFF' === type) {
                this.electron.ipcRenderer.send('get-xliff-languages', { command: 'getXliffLangs', xliff: arg.file });
            } else if ('SDLPPX' === type) {
                this.electron.ipcRenderer.send('get-package-languages', { command: 'getPackageLangs', package: arg.file });
            } else if (this.languagesChanged) {
                this.electron.ipcRenderer.send('get-languages');
            }
        }
        let encoding: string = arg.encoding;
        if (encoding !== 'Unknown') {
            (document.getElementById('charsetSelect') as HTMLSelectElement).value = encoding;
        }
    }

    createXLIFF(): void {
        let sourceFile: string = (document.getElementById('sourceFile') as HTMLInputElement).value;
        if (!sourceFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'sourceFileWarning' });
            return;
        }
        let sourceLang: string = (document.getElementById('sourceSelect') as HTMLSelectElement).value;
        if (sourceLang === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'sourceLanguageWarning' });
            return;
        }
        let fileType: string = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (fileType === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'fileTypeWarning' });
            return;
        }
        let charset: string = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'characterSetWarning' });
            return;
        }
        let args: any = { command: 'convert', file: sourceFile, srcLang: sourceLang, type: fileType, enc: charset };
        // check optional parameters
        let targetLang: string = (document.getElementById('targetSelect') as HTMLSelectElement).value;
        if (targetLang !== 'none') {
            args.tgtLang = targetLang;
        }
        if ((document.getElementById('ditavalFile') as HTMLInputElement).disabled === false) {
            let ditaval: string = (document.getElementById('ditavalFile') as HTMLInputElement).value;
            if (ditaval) {
                args.ditaval = ditaval;
            }
        }
        if ((document.getElementById('configFile') as HTMLInputElement).disabled === false) {
            let config: string = (document.getElementById('configFile') as HTMLInputElement).value;
            if (config) {
                args.config = config;
            }
        }
        let is20: boolean = (document.getElementById('is20') as HTMLInputElement).checked;
        if (is20) {
            args.is20 = true;
            args.is21 = false;
        }
        let is21: boolean = (document.getElementById('is21') as HTMLInputElement).checked;
        if (is21) {
            args.is20 = false;
            args.is21 = true;
        }
        let isParagraph: boolean = (document.getElementById('isParagraph') as HTMLInputElement).checked;
        if (isParagraph) {
            args.paragraph = true;
        }
        let isEmbed: boolean = (document.getElementById('isEmbed') as HTMLInputElement).checked;
        if (isEmbed) {
            args.embed = true;
        }
        this.startWaiting();
        this.electron.ipcRenderer.send('convert', args);
    }

    conversionCompleted(arg: any): any {
        this.endWaiting();
        this.setStatus('');
        if (arg.result === 'Success') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', titleKey: 'titleSuccess', key: 'xliffCreated' });
        } else {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    validate(): void {
        let xliffFile: string = (document.getElementById('xliffFileValidation') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'validateXliff', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('validate', args);
    }

    validationResult(arg: any): void {
        this.endWaiting();
        this.setStatus('');
        if (arg.valid) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', message: arg.comment });
        } else {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    showError(arg: any): void {
        this.setStatus('');
        this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg });
    }

    analyse(): void {
        let xliffFile: string = (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'analyseXliff', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('analyse', args);
    }

    analysisCompleted(arg: any): void {
        this.endWaiting();
        this.setStatus('');
        if (arg.result === 'Success') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', titleKey: 'titleSuccess', key: 'analysisCompleted' });
            this.electron.ipcRenderer.send('show-file', { file: (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value + '.log.html' });
        } else {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    typeChanged(): void {
        if ('DITA' === (document.getElementById('typeSelect') as HTMLSelectElement).value) {
            this.enableDitaVal();
        } else {
            this.disableDitaVal();
        }
    }

    typesReceived(arg: any): void {
        let array: any[] = arg.types;
        let options: string = '<option value="none">' + arg.none + '</option>';
        array.forEach((type: any) => {
            options = options + '<option value="' + type.type + '">' + type.description + '</option>';
        });
        (document.getElementById('typeSelect') as HTMLSelectElement).innerHTML = options;
        this.electron.ipcRenderer.send('get-charsets');
    }

    charsetsReceived(arg: any): any {
        let array: Charset[] = arg.charsets;
        let options: string = '<option value="none">' + arg.none + '</option>';
        array.forEach((charset: Charset) => {
            options = options + '<option value="' + charset.code + '">' + charset.description + '</option>';
        });
        (document.getElementById('charsetSelect') as HTMLSelectElement).innerHTML = options;
        (document.getElementById('sourceFile') as HTMLInputElement).focus();
    }

    packageLanguages(arg: any): any {
        if (arg.reason) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
            (document.getElementById('typeSelect') as HTMLSelectElement).value = 'none';
            return;
        }

        let srcArray: Language[] = arg.srcLangs;
        let srcOptions: string = '<option value="none">Select Language</option>';
        srcArray.forEach((lang: Language) => {
            srcOptions = srcOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        let sourceSelect: HTMLSelectElement = document.getElementById('sourceSelect') as HTMLSelectElement;
        sourceSelect.innerHTML = srcOptions;
        if (srcArray.length === 1) {
            sourceSelect.value = srcArray[0].code;
        }

        let tgtArray: Language[] = arg.tgtLangs;
        let tgtOptions: string = '<option value="none">Select Language</option>';
        tgtArray.forEach((lang: Language) => {
            tgtOptions = tgtOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        let targetSelect: HTMLSelectElement = document.getElementById('targetSelect') as HTMLSelectElement;
        targetSelect.innerHTML = tgtOptions;
        if (tgtArray.length === 1) {
            (document.getElementById('targetSelect') as HTMLSelectElement).value = tgtArray[0].code;
        }
        this.languagesChanged = true;
    }

    xliffLanguages(arg: any): any {
        if (arg.reason) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
            (document.getElementById('typeSelect') as HTMLSelectElement).value = 'none';
            return;
        }

        let sourceSelect: HTMLSelectElement = document.getElementById('sourceSelect') as HTMLSelectElement;
        sourceSelect.value = arg.srcLang;
        if (arg.tgtLang !== '') {
            let targetSelect: HTMLSelectElement = document.getElementById('targetSelect') as HTMLSelectElement;
            targetSelect.value = arg.tgtLang;
        }
        this.languagesChanged = true;
    }

    languagesReceived(arg: any): void {
        let array: Language[] = arg.languages;
        let languageOptions: string = '<option value="none">' + arg.none + '</option>';
        array.forEach((lang: Language) => {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        let sourceSelect: HTMLSelectElement = document.getElementById('sourceSelect') as HTMLSelectElement;
        sourceSelect.innerHTML = languageOptions;
        sourceSelect.value = arg.srcLang;
        let targetSelect: HTMLSelectElement = document.getElementById('targetSelect') as HTMLSelectElement;
        targetSelect.innerHTML = languageOptions;
        targetSelect.value = arg.tgtLang;
        this.languagesChanged = false;
        this.electron.ipcRenderer.send('get-types');
    }

    mergeXLIFF(): void {
        let xliffFile: string = (document.getElementById('xliffFile') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let targetFile: string = (document.getElementById('targetFile') as HTMLInputElement).value;
        if (!targetFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'targetFileWarning' });
            return;
        }
        let args: any = { command: 'merge', xliff: xliffFile, target: targetFile };
        let unapproved: boolean = (document.getElementById('unapproved') as HTMLInputElement).checked;
        if (unapproved) {
            args.unapproved = true;
        }
        let exportTmx: boolean = (document.getElementById('exportTmx') as HTMLInputElement).checked;
        if (exportTmx) {
            args.exportTmx = true;
        }
        this.startWaiting();
        this.electron.ipcRenderer.send('merge', args);
    }

    mergeCompleted(arg: any): void {
        this.endWaiting();
        this.setStatus('');
        if (arg.result === 'Success') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', titleKey: 'titleSuccess', key: 'xliffMerged' });
            if ((document.getElementById('openTranslated') as HTMLInputElement).checked) {
                this.electron.ipcRenderer.send('show-file', { file: (document.getElementById('targetFile') as HTMLInputElement).value });
            }
        } else {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    enableDitaVal(): void {
        (document.getElementById('browseDitaVal') as HTMLButtonElement).disabled = false;
        (document.getElementById('ditavalFile') as HTMLInputElement).disabled = false;
    }

    disableDitaVal(): void {
        (document.getElementById('browseDitaVal') as HTMLButtonElement).disabled = true;
        (document.getElementById('ditavalFile') as HTMLInputElement).value = '';
        (document.getElementById('ditavalFile') as HTMLInputElement).disabled = true;
    }

    enableConfig(): void {
        (document.getElementById('browseConfig') as HTMLButtonElement).disabled = false;
        (document.getElementById('configFile') as HTMLInputElement).disabled = false;
    }

    disableConfig(): void {
        (document.getElementById('browseConfig') as HTMLButtonElement).disabled = true;
        (document.getElementById('configFile') as HTMLInputElement).value = '';
        (document.getElementById('configFile') as HTMLInputElement).disabled = true;
    }

    setStatus(arg: string): void {
        let status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
        status.innerHTML = arg;
        if (arg.length > 0) {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }

    showCreate(): void {
        (document.getElementById('createTab') as HTMLAnchorElement).classList.add('selectedTab');
        (document.getElementById('mergeTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('validateTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('analysisTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('tasksTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('create') as HTMLDivElement).className = 'tabContent';
        (document.getElementById('merge') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('validate') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('analysis') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('tasks') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('sourceFile') as HTMLInputElement).focus();
    }

    showMerge(): void {
        (document.getElementById('createTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('mergeTab') as HTMLAnchorElement).classList.add('selectedTab');
        (document.getElementById('validateTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('analysisTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('tasksTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('create') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('merge') as HTMLDivElement).className = 'tabContent';
        (document.getElementById('validate') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('analysis') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('tasks') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('xliffFile') as HTMLInputElement).focus();
    }

    showValidate(): void {
        (document.getElementById('createTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('mergeTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('validateTab') as HTMLAnchorElement).classList.add('selectedTab');
        (document.getElementById('analysisTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('tasksTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('create') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('merge') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('validate') as HTMLDivElement).className = 'tabContent';
        (document.getElementById('analysis') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('tasks') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('xliffFileValidation') as HTMLInputElement).focus();
    }

    showAnalysis(): void {
        (document.getElementById('createTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('mergeTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('validateTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('analysisTab') as HTMLAnchorElement).classList.add('selectedTab');
        (document.getElementById('tasksTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('create') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('merge') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('validate') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('analysis') as HTMLDivElement).className = 'tabContent';
        (document.getElementById('tasks') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('xliffFileAnalysis') as HTMLInputElement).focus();
    }

    showTasks(): void {
        (document.getElementById('createTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('mergeTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('validateTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('analysisTab') as HTMLAnchorElement).classList.remove('selectedTab');
        (document.getElementById('tasksTab') as HTMLAnchorElement).classList.add('selectedTab');
        (document.getElementById('create') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('merge') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('validate') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('analysis') as HTMLDivElement).className = 'hiddenTab';
        (document.getElementById('tasks') as HTMLDivElement).className = 'tabContent';
        (document.getElementById('xliffFileAnalysis') as HTMLInputElement).focus();
    }

    copySources(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'copySources', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    pseudoTranslate(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'pseudoTranslate', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    removeTargets(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'removeTargets', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    approveAll(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', key: 'xliffFileWarning' });
            return;
        }
        let args = { command: 'approveAll', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    processCompleted(arg: any): void {
        this.endWaiting();
        this.setStatus('');
        if (arg.result !== 'Success') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }
}