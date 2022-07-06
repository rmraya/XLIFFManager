/*******************************************************************************
 * Copyright (c) 2018-2022 Maxprograms.
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
    code: string;
    description: string;
}

class Language {
    code: string;
    description: string;
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

        document.getElementById('createTab').addEventListener('click', () => { this.showCreate(); });
        document.getElementById('mergeTab').addEventListener('click', () => { this.showMerge(); });
        document.getElementById('validateTab').addEventListener('click', () => { this.showValidate(); });
        document.getElementById('analysisTab').addEventListener('click', () => { this.showAnalysis(); });
        document.getElementById('tasksTab').addEventListener('click', () => { this.showTasks(); });
        document.getElementById('infoButton').addEventListener('click', () => { this.electron.ipcRenderer.send('show-about'); });
        document.getElementById('updatesButton').addEventListener('click', () => { this.electron.ipcRenderer.send('check-updates'); });
        document.getElementById('settingsButton').addEventListener('click', () => { this.electron.ipcRenderer.send('show-settings'); });
        document.getElementById('browseSource').addEventListener('click', () => { this.electron.ipcRenderer.send('select-source-file'); });
        document.getElementById('typeSelect').addEventListener('change', () => { this.typeChanged(); });
        document.getElementById('browseDitaVal').addEventListener('click', () => { this.electron.ipcRenderer.send('select-ditaval'); });
        document.getElementById('browseConfig').addEventListener('click', () => { this.electron.ipcRenderer.send('select-config'); });
        document.getElementById('createXLIFF').addEventListener('click', () => { this.createXLIFF(); });
        document.getElementById('browseXLIFF').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-file'); });
        document.getElementById('browseTarget').addEventListener('click', () => { this.electron.ipcRenderer.send('select-target-file'); });
        document.getElementById('mergeXLIFF').addEventListener('click', () => { this.mergeXLIFF(); });
        document.getElementById('browseXLIFFValidation').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-validation'); });
        document.getElementById('validateButton').addEventListener('click', () => { this.validate(); });
        document.getElementById('browseXLIFFAnalysis').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-analysis'); });
        document.getElementById('analyseButton').addEventListener('click', () => { this.analyse(); });
        document.getElementById('browseXLIFFTasks').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-tasks'); });
        document.getElementById('copySourcesButton').addEventListener('click', () => { this.copySources(); });
        document.getElementById('pseudoTranslateButton').addEventListener('click', () => { this.pseudoTranslate(); });
        document.getElementById('removeTargetsButton').addEventListener('click', () => { this.removeTargets(); });
        document.getElementById('approveAllButton').addEventListener('click', () => { this.approveAll(); });

        this.electron.ipcRenderer.on('add-source-file', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addSourceFile(arg);
        });

        this.electron.ipcRenderer.on('package-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.packageLanguages(arg);
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

        this.electron.ipcRenderer.on('conversion-started', () => {
            this.setStatus('Conversion started');
        });

        this.electron.ipcRenderer.on('validation-started', () => {
            this.setStatus('Validation started');
        });

        this.electron.ipcRenderer.on('process-started', () => {
            this.setStatus('Processing started');
        });

        this.electron.ipcRenderer.on('process-completed', (event: Electron.IpcRendererEvent, arg: any) => {
            this.processCompleted(arg);
        });

        this.electron.ipcRenderer.on('analysis-started', () => {
            this.setStatus('Analysis started');
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

        this.electron.ipcRenderer.on('merge-created', () => {
            this.setStatus('Merge started');
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
            this.electron.ipcRenderer.send('main-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        })
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
            if ('SDLPPX' === type) {
                this.electron.ipcRenderer.send('get-package-languages', { command: 'getPackageLangs', package: arg.file });
            } else {
                if (this.languagesChanged) {
                    this.electron.ipcRenderer.send('get-languages');
                }
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
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source file' });
            return;
        }
        let sourceLang: string = (document.getElementById('sourceSelect') as HTMLSelectElement).value;
        if (sourceLang === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source language' });
            return;
        }
        let fileType: string = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (fileType === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select file type' });
            return;
        }
        let charset: string = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select character set' });
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
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file created' });
        } else {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    validate(): void {
        let xliffFile: string = (document.getElementById('xliffFileValidation') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
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
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
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
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'Analysis completed' });
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
        let options: string = '<option value="none">Select File Type</option>';
        array.forEach((type: any) => {
            options = options + '<option value="' + type.type + '">' + type.description + '</option>';
        });
        document.getElementById('typeSelect').innerHTML = options;
        this.electron.ipcRenderer.send('get-charsets');
    }

    charsetsReceived(arg: any): any {
        let array: Charset[] = arg.charsets;
        let options: string = '<option value="none">Select Character Set</option>';
        array.forEach((charset: Charset) => {
            options = options + '<option value="' + charset.code + '">' + charset.description + '</option>';
        });
        document.getElementById('charsetSelect').innerHTML = options;
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
        document.getElementById('sourceSelect').innerHTML = srcOptions;
        if (srcArray.length === 1) {
            (document.getElementById('sourceSelect') as HTMLSelectElement).value = srcArray[0].code;
        }

        let tgtArray: Language[] = arg.tgtLangs;
        let tgtOptions: string = '<option value="none">Select Language</option>';
        tgtArray.forEach((lang: Language) => {
            tgtOptions = tgtOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        document.getElementById('targetSelect').innerHTML = tgtOptions;
        if (tgtArray.length === 1) {
            (document.getElementById('targetSelect') as HTMLSelectElement).value = tgtArray[0].code;
        }
        this.languagesChanged = true;
    }

    languagesReceived(arg: any): void {
        let array: Language[] = arg.languages;
        let languageOptions: string = '<option value="none">Select Language</option>';
        array.forEach((lang: Language) => {
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        document.getElementById('sourceSelect').innerHTML = languageOptions;
        (document.getElementById('sourceSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('targetSelect').innerHTML = languageOptions;
        (document.getElementById('targetSelect') as HTMLSelectElement).value = arg.tgtLang;
        this.languagesChanged = false;
        this.electron.ipcRenderer.send('get-types');
    }

    mergeXLIFF(): void {
        let xliffFile: string = (document.getElementById('xliffFile') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        let targetFile: string = (document.getElementById('targetFile') as HTMLInputElement).value;
        if (!targetFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select target file/folder' });
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
            this.electron.ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file merged' });
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
        document.getElementById('createTab').classList.add('selectedTab');
        document.getElementById('mergeTab').classList.remove('selectedTab');
        document.getElementById('validateTab').classList.remove('selectedTab');
        document.getElementById('analysisTab').classList.remove('selectedTab');
        document.getElementById('tasksTab').classList.remove('selectedTab');
        document.getElementById('create').className = 'tabContent';
        document.getElementById('merge').className = 'hiddenTab';
        document.getElementById('validate').className = 'hiddenTab';
        document.getElementById('analysis').className = 'hiddenTab';
        document.getElementById('tasks').className = 'hiddenTab';
        (document.getElementById('sourceFile') as HTMLInputElement).focus();
    }

    showMerge(): void {
        document.getElementById('createTab').classList.remove('selectedTab');
        document.getElementById('mergeTab').classList.add('selectedTab');
        document.getElementById('validateTab').classList.remove('selectedTab');
        document.getElementById('analysisTab').classList.remove('selectedTab');
        document.getElementById('tasksTab').classList.remove('selectedTab');
        document.getElementById('create').className = 'hiddenTab';
        document.getElementById('merge').className = 'tabContent';
        document.getElementById('validate').className = 'hiddenTab';
        document.getElementById('analysis').className = 'hiddenTab';
        document.getElementById('tasks').className = 'hiddenTab';
        (document.getElementById('xliffFile') as HTMLInputElement).focus();
    }

    showValidate(): void {
        document.getElementById('createTab').classList.remove('selectedTab');
        document.getElementById('mergeTab').classList.remove('selectedTab');
        document.getElementById('validateTab').classList.add('selectedTab');
        document.getElementById('analysisTab').classList.remove('selectedTab');
        document.getElementById('tasksTab').classList.remove('selectedTab');
        document.getElementById('create').className = 'hiddenTab';
        document.getElementById('merge').className = 'hiddenTab';
        document.getElementById('validate').className = 'tabContent';
        document.getElementById('analysis').className = 'hiddenTab';
        document.getElementById('tasks').className = 'hiddenTab';
        (document.getElementById('xliffFileValidation') as HTMLInputElement).focus();
    }

    showAnalysis(): void {
        document.getElementById('createTab').classList.remove('selectedTab');
        document.getElementById('mergeTab').classList.remove('selectedTab');
        document.getElementById('validateTab').classList.remove('selectedTab');
        document.getElementById('analysisTab').classList.add('selectedTab');
        document.getElementById('tasksTab').classList.remove('selectedTab');
        document.getElementById('create').className = 'hiddenTab';
        document.getElementById('merge').className = 'hiddenTab';
        document.getElementById('validate').className = 'hiddenTab';
        document.getElementById('analysis').className = 'tabContent';
        document.getElementById('tasks').className = 'hiddenTab';
        (document.getElementById('xliffFileAnalysis') as HTMLInputElement).focus();
    }

    showTasks(): void {
        document.getElementById('createTab').classList.remove('selectedTab');
        document.getElementById('mergeTab').classList.remove('selectedTab');
        document.getElementById('validateTab').classList.remove('selectedTab');
        document.getElementById('analysisTab').classList.remove('selectedTab');
        document.getElementById('tasksTab').classList.add('selectedTab');
        document.getElementById('create').className = 'hiddenTab';
        document.getElementById('merge').className = 'hiddenTab';
        document.getElementById('validate').className = 'hiddenTab';
        document.getElementById('analysis').className = 'hiddenTab';
        document.getElementById('tasks').className = 'tabContent';
        (document.getElementById('xliffFileAnalysis') as HTMLInputElement).focus();
    }

    copySources(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        let args = { command: 'copySources', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    pseudoTranslate(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        let args = { command: 'pseudoTranslate', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    removeTargets(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        let args = { command: 'removeTargets', file: xliffFile };
        this.startWaiting();
        this.electron.ipcRenderer.send('processTask', args);
    }

    approveAll(): void {
        let xliffFile: string = (document.getElementById('xliffFileTasks') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
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

new Main();