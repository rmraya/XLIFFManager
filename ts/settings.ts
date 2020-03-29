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

var _s = require('electron');

class Settings {

    constructor() {
        _s.ipcRenderer.send('get-languages');
        _s.ipcRenderer.send('get-catalog');
        _s.ipcRenderer.send('get-skeleton');
        _s.ipcRenderer.send('get-srx');

        document.getElementById('browseCatalog').addEventListener('click', () => { _s.ipcRenderer.send('select-catalog'); });
        document.getElementById('browseSkeleton').addEventListener('click', () => { _s.ipcRenderer.send('select-skeleton'); });
        document.getElementById('browseSRX').addEventListener('click', () => { _s.ipcRenderer.send('select-srx'); });
        document.getElementById('saveSettings').addEventListener('click', () => { this.saveSettings(); });

        _s.ipcRenderer.on('languages-received', (event, arg) => {
            this.languagesReceived(arg);
        });

        _s.ipcRenderer.on('skeleton-received', (event, arg) => {
            (document.getElementById('skeletonFolder') as HTMLInputElement).value = arg;
        });

        _s.ipcRenderer.on('catalog-received', (event, arg) => {
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg;
        });

        _s.ipcRenderer.on('srx-received', (event, arg) => {
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
        _s.ipcRenderer.send('save-defaults', {
            srcLang: (document.getElementById('sourceSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('targetSelect') as HTMLSelectElement).value,
            skeleton: (document.getElementById('skeletonFolder') as HTMLInputElement).value,
            catalog: (document.getElementById('defaultCatalog') as HTMLInputElement).value,
            srx: (document.getElementById('defaultSRX') as HTMLInputElement).value
        });
    }

}

new Settings();