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

const { ipcRenderer } = require('electron');

class Main {

    languagesChanged: boolean = false;

    constructor() {
        ipcRenderer.send('get-languages');
        ipcRenderer.send('get-types');
        ipcRenderer.send('get-charsets');
        ipcRenderer.send('get-theme');

        document.getElementById('helpButton').addEventListener('click', () => { ipcRenderer.send('show-help'); });
        document.getElementById('infoButton').addEventListener('click', () => { ipcRenderer.send('show-about'); });
        document.getElementById('updatesButton').addEventListener('click', () => { ipcRenderer.send('check-updates'); });
        document.getElementById('settingsButton').addEventListener('click', () => { ipcRenderer.send('show-settings'); });
        document.getElementById('browseSource').addEventListener('click', () => { ipcRenderer.send('select-source-file'); });
        document.getElementById('typeSelect').addEventListener('change', () => { this.typeChanged(); });
        document.getElementById('browseDitaVal').addEventListener('click', () => { ipcRenderer.send('select-ditaval'); });
        document.getElementById('createXLIFF').addEventListener('click', () => { this.createXLIFF(); });
        document.getElementById('browseXLIFF').addEventListener('click', () => { ipcRenderer.send('select-xliff-file'); });
        document.getElementById('browseTarget').addEventListener('click', () => { ipcRenderer.send('select-target-file'); });
        document.getElementById('mergeXLIFF').addEventListener('click', () => { this.mergeXLIFF(); });
        document.getElementById('browseXLIFFValidation').addEventListener('click', () => { ipcRenderer.send('select-xliff-validation'); });
        document.getElementById('validateButton').addEventListener('click', () => { this.validate(); });
        document.getElementById('browseXLIFFAnalysis').addEventListener('click', () => { ipcRenderer.send('select-xliff-analysis'); });
        document.getElementById('analyseButton').addEventListener('click', () => { this.analyse(); });

        ipcRenderer.on('set-theme', (event, arg) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        
        ipcRenderer.on('add-source-file', (event, arg) => {
            this.addSourceFile(arg);
        });

        ipcRenderer.on('package-languages', (event, arg) => {
            this.packageLanguages(arg);
        });

        ipcRenderer.on('add-xliff-file', (event, arg) => {
            (document.getElementById('xliffFile') as HTMLInputElement).value = arg;
        });

        ipcRenderer.on('add-xliff-validation', (event, arg) => {
            (document.getElementById('xliffFileValidation') as HTMLInputElement).value = arg;
        });

        ipcRenderer.on('add-xliff-analysis', (event, arg) => {
            (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value = arg;
        });

        ipcRenderer.on('add-target-file', (event, arg) => {
            (document.getElementById('targetFile') as HTMLInputElement).value = arg;
        });

        ipcRenderer.on('languages-received', (event, arg) => {
            this.languagesReceived(arg);
        });

        ipcRenderer.on('charsets-received', (event, arg) => {
            this.charsetsReceived(arg);
        });

        ipcRenderer.on('types-received', (event, arg) => {
            this.typesReceived(arg);
        });

        ipcRenderer.on('conversion-started', () => {
            document.getElementById('process').innerHTML = '<img src="../img/working.gif"/>';
        });

        ipcRenderer.on('validation-started', () => {
            document.getElementById('validation').innerHTML = '<img src="../img/working.gif"/>';
        });

        ipcRenderer.on('analysis-started', () => {
            document.getElementById('analysis').innerHTML = '<img src="../img/working.gif"/>';
        });

        ipcRenderer.on('analysis-completed', (event, arg) => {
            this.analysisCompleted(arg);
        });

        ipcRenderer.on('validation-result', (event, arg) => {
            this.validationResult(arg);
        });

        ipcRenderer.on('conversion-completed', (event, arg) => {
            this.conversionCompleted(arg);
        });

        ipcRenderer.on('merge-created', () => {
            document.getElementById('merge').innerHTML = '<img src="../img/working.gif"/>';
        });

        ipcRenderer.on('merge-completed', (event, arg) => {
            this.mergeCompleted(arg);
        });

        ipcRenderer.on('show-error', (event, arg) => {
            this.showError(arg);
        });

        ipcRenderer.on('add-ditaval-file', (event, arg) => {
            (document.getElementById('ditavalFile') as HTMLInputElement).value = arg;
        });
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
                ipcRenderer.send('get-package-languages', { command: 'getPackageLangs', package: arg.file });
            } else {
                if (this.languagesChanged) {
                    ipcRenderer.send('get-languages');
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
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source file' });
            return;
        }
        var sourceLang = (document.getElementById('sourceSelect') as HTMLSelectElement).value;
        if (sourceLang === 'none') {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select source language' });
            return;
        }
        var fileType = (document.getElementById('typeSelect') as HTMLSelectElement).value;
        if (fileType === 'none') {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select file type' });
            return;
        }
        var charset = (document.getElementById('charsetSelect') as HTMLSelectElement).value;
        if (charset === 'none') {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select character set' });
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
        ipcRenderer.send('convert', args);
    }

    conversionCompleted(arg: any): any {
        this.endWaiting();
        document.getElementById('process').innerHTML = '';
        if (arg.result === 'Success') {
            ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file created' });
        } else {
            ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    validate(): void {
        var xliffFile = (document.getElementById('xliffFileValidation') as HTMLInputElement).value;
        if (!xliffFile) {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var args = { command: 'validateXliff', file: xliffFile };
        this.startWaiting();
        ipcRenderer.send('validate', args);
    }

    validationResult(arg: any): void {
        this.endWaiting();
        document.getElementById('validation').innerHTML = '';
        if (arg.valid) {
            ipcRenderer.send('show-dialog', { type: 'info', message: arg.comment });
        } else {
            ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
        }
    }

    showError(arg: any): void {
        document.getElementById('process').innerHTML = '';
        document.getElementById('merge').innerHTML = '';
        document.getElementById('validation').innerHTML = '';
        ipcRenderer.send('show-dialog', { type: 'error', message: arg });
    }

    analyse(): void {
        var xliffFile = (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value;
        if (!xliffFile) {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var args = { command: 'analyseXliff', file: xliffFile };
        this.startWaiting();
        ipcRenderer.send('analyse', args);
    }

    analysisCompleted(arg: any): void {
        this.endWaiting();
        document.getElementById('analysis').innerHTML = '';
        if (arg.result === 'Success') {
            ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'Analysis completed' });
            ipcRenderer.send('show-file', { file: (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value + '.log.html' });
        } else {
            ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
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
            ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
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
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
            return;
        }
        var targetFile = (document.getElementById('targetFile') as HTMLInputElement).value;
        if (!targetFile) {
            ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select target file/folder' });
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
        ipcRenderer.send('merge', args);
    }

    mergeCompleted(arg: any): void {
        this.endWaiting();
        document.getElementById('merge').innerHTML = '';
        if (arg.result === 'Success') {
            ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file merged' });
            if ((document.getElementById('openTranslated') as HTMLInputElement).checked) {
                ipcRenderer.send('show-file', { file: (document.getElementById('targetFile') as HTMLInputElement).value });
            }
        } else {
            ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
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

}

new Main();