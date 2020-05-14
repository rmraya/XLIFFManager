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


class Settings {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.send('get-catalog');
        this.electron.ipcRenderer.send('get-skeleton');
        this.electron.ipcRenderer.send('get-srx');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-defaultTheme');

        document.getElementById('browseCatalog').addEventListener('click', () => { this.electron.ipcRenderer.send('select-catalog'); });
        document.getElementById('browseSkeleton').addEventListener('click', () => { this.electron.ipcRenderer.send('select-skeleton'); });
        document.getElementById('browseSRX').addEventListener('click', () => { this.electron.ipcRenderer.send('select-srx'); });
        document.getElementById('saveSettings').addEventListener('click', () => { this.saveSettings(); });

        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });

        this.electron.ipcRenderer.on('set-defaultTheme', (event, arg) => {
            (document.getElementById('themeColor') as HTMLSelectElement).value = arg;
        });

        this.electron.ipcRenderer.on('languages-received', (event, arg) => {
            this.languagesReceived(arg);
        });

        this.electron.ipcRenderer.on('skeleton-received', (event, arg) => {
            (document.getElementById('skeletonFolder') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('catalog-received', (event, arg) => {
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg;
        });

        this.electron.ipcRenderer.on('srx-received', (event, arg) => {
            (document.getElementById('defaultSRX') as HTMLInputElement).value = arg;
        });
    }

    languagesReceived(arg: any): void {
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
    }

    saveSettings(): void {
        this.electron.ipcRenderer.send('save-defaults', {
            srcLang: (document.getElementById('sourceSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('targetSelect') as HTMLSelectElement).value,
            skeleton: (document.getElementById('skeletonFolder') as HTMLInputElement).value,
            catalog: (document.getElementById('defaultCatalog') as HTMLInputElement).value,
            srx: (document.getElementById('defaultSRX') as HTMLInputElement).value,
            theme: (document.getElementById('themeColor') as HTMLSelectElement).value
        });
    }

}

new Settings();