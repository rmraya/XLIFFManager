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


class Main {

    electron = require('electron');
    languagesChanged: boolean = false;

    constructor() {
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.send('get-charsets');
        this.electron.ipcRenderer.send('get-theme');

        document.getElementById('helpButton').addEventListener('click', () => { this.electron.ipcRenderer.send('show-help'); });
        document.getElementById('infoButton').addEventListener('click', () => { this.electron.ipcRenderer.send('show-about'); });
        document.getElementById('updatesButton').addEventListener('click', () => { this.electron.ipcRenderer.send('check-updates'); });
        document.getElementById('settingsButton').addEventListener('click', () => { this.electron.ipcRenderer.send('show-settings'); });
        document.getElementById('browseSource').addEventListener('click', () => { this.electron.ipcRenderer.send('select-source-file'); });
        document.getElementById('typeSelect').addEventListener('change', () => { this.typeChanged(); });
        document.getElementById('browseDitaVal').addEventListener('click', () => { this.electron.ipcRenderer.send('select-ditaval'); });
        document.getElementById('createXLIFF').addEventListener('click', () => { this.createXLIFF(); });
        document.getElementById('browseXLIFF').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-file'); });
        document.getElementById('browseTarget').addEventListener('click', () => { this.electron.ipcRenderer.send('select-target-file'); });
        document.getElementById('mergeXLIFF').addEventListener('click', () => { this.mergeXLIFF(); });
        document.getElementById('browseXLIFFValidation').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-validation'); });
        document.getElementById('validateButton').addEventListener('click', () => { this.validate(); });
        document.getElementById('browseXLIFFAnalysis').addEventListener('click', () => { this.electron.ipcRenderer.send('select-xliff-analysis'); });
        document.getElementById('analyseButton').addEventListener('click', () => { this.analyse(); });

        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });

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

        this.electron.ipcRenderer.on('add-target-file', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('targetFile') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('languages-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.languagesReceived(arg);
        });

        this.electron.ipcRenderer.on('charsets-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.charsetsReceived(arg);
        });

        this.electron.ipcRenderer.on('types-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.typesReceived(arg);
        });

        this.electron.ipcRenderer.on('conversion-started', () => {
            this.setStatus('Conversion started');
        });

        this.electron.ipcRenderer.on('validation-started', () => {
            this.setStatus('Validation started');
        });

        this.electron.ipcRenderer.on('analysis-started', () => {
            this.setStatus('Analysys started');
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
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('main-height', { width: body.clientWidth, height: body.clientHeight });
    }

    startWaiting(): void {
        document.getElementById('body').classList.add("wait");
    }

    endWaiting(): void {
        document.getElementById('body').classList.remove("wait");
    }

    addSourceFile(arg: any): void {
        (document.getElementById('sourceFile') as HTMLInputElement).value = arg.file;
        var type = arg.type;
        if (type !== 'Unknown') {
            (document.getElementById('typeSelect') as HTMLSelectElement).value = type;
            if ('DITA' === type) {
                this.enableDitaVal();
            } else {
                this.disableDitaVal();
            }
            if ('SDLPPX' === type) {
                this.electron.ipcRenderer.send('get-package-languages', { command: 'getPackageLangs', package: arg.file });
            } else {
                if (this.languagesChanged) {
                    this.electron.ipcRenderer.send('get-languages');
                }
            }
        }
        var encoding = arg.encoding;
        if (encoding !== 'Unknown') {
            (document.getElementById('charsetSelect') as HTMLSelectElement).value = encoding;
        }
    }

    createXLIFF(): void {
        var sourceFile = (document.getElementById('sourceFile') as HTMLInputElement).value;
        if (!sourceFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source file' });
            return;
        }
        var sourceLang = (document.getElementById('sourceSelect') as HTMLSelectElement).value;
        if (sourceLang === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source language' });
            return;
        }
        var fileType = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (fileType === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select file type' });
            return;
        }
        var charset = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select character set' });
            return;
        }
        var args: any = { command: 'convert', file: sourceFile, srcLang: sourceLang, type: fileType, enc: charset };
        // check optional parameters
        var targetLang = (document.getElementById('targetSelect') as HTMLSelectElement).value;
        if (targetLang !== 'none') {
            args.tgtLang = targetLang;
        }
        if ((document.getElementById('ditavalFile') as HTMLInputElement).disabled === false) {
            var ditaval = (document.getElementById('ditavalFile') as HTMLInputElement).value;
            if (ditaval) {
                args.ditaval = ditaval;
            }
        }
        var is20: boolean = (document.getElementById('is20') as HTMLInputElement).checked;
        if (is20) {
            args.is20 = true;
        }
        var isParagraph = (document.getElementById('isParagraph') as HTMLInputElement).checked;
        if (isParagraph) {
            args.paragraph = true;
        }
        var isEmbed = (document.getElementById('isEmbed') as HTMLInputElement).checked;
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
        var xliffFile = (document.getElementById('xliffFileValidation') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var args = { command: 'validateXliff', file: xliffFile };
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
        var xliffFile = (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var args = { command: 'analyseXliff', file: xliffFile };
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
        var array = arg.types;
        var options = '<option value="none">Select File Type</option>';
        for (let i = 0; i < array.length; i++) {
            var type = array[i];
            options = options + '<option value="' + type.type + '">' + type.description + '</option>';
        }
        document.getElementById('typeSelect').innerHTML = options;
    }

    charsetsReceived(arg: any): any {
        var array = arg.charsets;
        var options = '<option value="none">Select Character Set</option>';
        for (let i = 0; i < array.length; i++) {
            var charset = array[i];
            options = options + '<option value="' + charset.code + '">' + charset.description + '</option>';
        }
        document.getElementById('charsetSelect').innerHTML = options;
    }

    packageLanguages(arg: any): any {
        if (arg.reason) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
            (document.getElementById('typeSelect') as HTMLSelectElement).value = 'none';
            return;
        }

        var srcArray = arg.srcLangs;
        var srcOptions: string = '<option value="none">Select Language</option>';
        for (let i = 0; i < srcArray.length; i++) {
            var lang = srcArray[i];
            srcOptions = srcOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('sourceSelect').innerHTML = srcOptions;
        if (srcArray.length === 1) {
            (document.getElementById('sourceSelect') as HTMLSelectElement).value = srcArray[0].code;
        }

        var tgtArray = arg.tgtLangs;
        var tgtOptions: string = '<option value="none">Select Language</option>';
        for (let i = 0; i < tgtArray.length; i++) {
            var lang = tgtArray[i];
            tgtOptions = tgtOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('targetSelect').innerHTML = tgtOptions;
        if (tgtArray.length === 1) {
            (document.getElementById('targetSelect') as HTMLSelectElement).value = tgtArray[0].code;
        }
        this.languagesChanged = true;
    }

    languagesReceived(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('sourceSelect').innerHTML = languageOptions;
        (document.getElementById('sourceSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('targetSelect').innerHTML = languageOptions;
        (document.getElementById('targetSelect') as HTMLSelectElement).value = arg.tgtLang;
        this.languagesChanged = false;
    }

    mergeXLIFF(): void {
        var xliffFile = (document.getElementById('xliffFile') as HTMLInputElement).value;
        if (!xliffFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var targetFile = (document.getElementById('targetFile') as HTMLInputElement).value;
        if (!targetFile) {
            this.electron.ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select target file/folder' });
            return;
        }
        var args: any = { command: 'merge', xliff: xliffFile, target: targetFile };
        var unapproved = (document.getElementById('unapproved') as HTMLInputElement).checked;
        if (unapproved) {
            args.unapproved = true;
        }
        var exportTmx = (document.getElementById('exportTmx') as HTMLInputElement).checked;
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

    setStatus(arg: any): void {
        var status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
        status.innerHTML = arg;
        if (arg.length > 0) {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }

}

new Main();