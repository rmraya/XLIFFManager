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

ipcRenderer.send('get-languages');
ipcRenderer.send('get-types');
ipcRenderer.send('get-charsets');

function browseSource(): void {
    ipcRenderer.send('select-source-file');
}

function browseXLIFF(): void {
    ipcRenderer.send('select-xliff-file');
}

function browseTarget(): void {
    ipcRenderer.send('select-target-file');
}

function createXLIFF(): void {
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
    ipcRenderer.send('convert', args);
};

function browseXLIFFValidation(): void {
    ipcRenderer.send('select-xliff-validation');
}

function validate(): void {
    var xliffFile = (document.getElementById('xliffFileValidation') as HTMLInputElement).value;
    if (!xliffFile) {
        ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
        return;
    }
    var args = { command: 'validateXliff', file: xliffFile };
    ipcRenderer.send('validate', args);
}

function browseXLIFFAnalysis(): void {
    ipcRenderer.send('select-xliff-analysis');
}

function analyse(): void {
    var xliffFile = (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value;
    if (!xliffFile) {
        ipcRenderer.send('show-dialog', { type: 'warning', message: 'Select XLIFF file' });
        return;
    }
    var args = { command: 'analyseXliff', file: xliffFile };
    ipcRenderer.send('analyse', args);
};

ipcRenderer.on('add-source-file', (event, arg) => {
    (document.getElementById('sourceFile') as HTMLInputElement).value = arg.file;
    var type = arg.type;
    if (type !== 'Unknown') {
        (document.getElementById('typeSelect') as HTMLSelectElement).value = type;
        if ('DITA' === type) {
            enableDitaVal();
        } else {
            disableDitaVal();
        }
    }
    var encoding = arg.encoding;
    if (encoding !== 'Unknown') {
        (document.getElementById('charsetSelect') as HTMLSelectElement).value = encoding;
    }
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
    var array = arg.languages;
    var options = '<option value="none">Select Language</option>';
    for (let i = 0; i < array.length; i++) {
        var lang = array[i];
        options = options + '<option value="' + lang.code + '">' + lang.description + '</option>';
    }
    document.getElementById('sourceSelect').innerHTML = options;
    (document.getElementById('sourceSelect') as HTMLSelectElement).value = arg.srcLang;
    document.getElementById('targetSelect').innerHTML = options;
    (document.getElementById('targetSelect') as HTMLSelectElement).value = arg.tgtLang;
});

ipcRenderer.on('charsets-received', (event, arg) => {
    var array = arg.charsets;
    var options = '<option value="none">Select Character Set</option>';
    for (let i = 0; i < array.length; i++) {
        var charset = array[i];
        options = options + '<option value="' + charset.code + '">' + charset.description + '</option>';
    }
    document.getElementById('charsetSelect').innerHTML = options;
});

ipcRenderer.on('types-received', (event, arg) => {
    var array = arg.types;
    var options = '<option value="none">Select File Type</option>';
    for (let i = 0; i < array.length; i++) {
        var type = array[i];
        options = options + '<option value="' + type.type + '">' + type.description + '</option>';
    }
    document.getElementById('typeSelect').innerHTML = options;
});

function typeChanged(): void {
    if ('DITA' === (document.getElementById('typeSelect') as HTMLSelectElement).value) {
        enableDitaVal();
    } else {
        disableDitaVal();
    }
}

ipcRenderer.on('conversion-started', () => {
    document.getElementById('process').innerHTML = '<img src="img/working.gif"/>';
});

ipcRenderer.on('validation-started', () => {
    document.getElementById('validation').innerHTML = '<img src="img/working.gif"/>';
});

ipcRenderer.on('analysis-started', () => {
    document.getElementById('analysis').innerHTML = '<img src="img/working.gif"/>';
});

ipcRenderer.on('analysis-completed', (event, arg) => {
    document.getElementById('analysis').innerHTML = '';
    if (arg.result === 'Success') {
        ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'Analysis completed' });
        ipcRenderer.send('show-file', { file: (document.getElementById('xliffFileAnalysis') as HTMLInputElement).value + '.log.html' });
    } else {
        ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
    }
});

ipcRenderer.on('validation-result', (event, arg) => {
    document.getElementById('validation').innerHTML = '';
    if (arg.valid) {
        ipcRenderer.send('show-dialog', { type: 'info', message: arg.comment });
    } else {
        ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
    }
});

ipcRenderer.on('conversion-completed', (event, arg) => {
    document.getElementById('process').innerHTML = '';
    if (arg.result === 'Success') {
        ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file created' });
    } else {
        ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
    }
});

ipcRenderer.on('merge-created', () => {
    document.getElementById('merge').innerHTML = '<img src="img/working.gif"/>';
});

ipcRenderer.on('merge-completed', (event, arg) => {
    document.getElementById('merge').innerHTML = '';
    if (arg.result === 'Success') {
        ipcRenderer.send('show-dialog', { type: 'info', title: 'Success', message: 'XLIFF file merged' });
        if ((document.getElementById('openTranslated') as HTMLInputElement).checked) {
            ipcRenderer.send('show-file', { file: (document.getElementById('targetFile') as HTMLInputElement).value });
        }
    } else {
        ipcRenderer.send('show-dialog', { type: 'error', message: arg.reason });
    }
});

ipcRenderer.on('show-error', (event, arg) => {
    document.getElementById('process').innerHTML = '';
    document.getElementById('merge').innerHTML = '';
    document.getElementById('validation').innerHTML = '';
    ipcRenderer.send('show-dialog', { type: 'error', message: arg });
});

function mergeXLIFF(): void {
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
    ipcRenderer.send('merge', args);
}

function settings(): void {
    ipcRenderer.send('show-settings');
}

function about(): void {
    ipcRenderer.send('show-about');
}

function checkUpdates(): void {
    ipcRenderer.send('check-updates');
}

function help(): void {
    ipcRenderer.send('show-help');
}

function enableDitaVal(): void {
    (document.getElementById('browseDitaVal') as HTMLButtonElement).disabled = false;
    (document.getElementById('ditavalFile') as HTMLInputElement).disabled = false;
}

function disableDitaVal(): void {
    (document.getElementById('browseDitaVal') as HTMLButtonElement).disabled = true;
    (document.getElementById('ditavalFile') as HTMLInputElement).value = '';
    (document.getElementById('ditavalFile') as HTMLInputElement).disabled = true;
}

function browseDitaVal(): void {
    ipcRenderer.send('select-ditaval');
}

ipcRenderer.on('add-ditaval-file', (event, arg) => {
    (document.getElementById('ditavalFile') as HTMLInputElement).value = arg;
});


