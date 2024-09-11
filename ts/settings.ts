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

class Settings {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');

        (document.getElementById('browseCatalog') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-catalog'); });
        (document.getElementById('browseSkeleton') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-skeleton'); });
        (document.getElementById('browseSRX') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('select-srx'); });
        (document.getElementById('saveSettings') as HTMLButtonElement).addEventListener('click', () => { this.saveSettings(); });

        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
            this.electron.ipcRenderer.send('get-languages');
        });

        this.electron.ipcRenderer.on('set-defaultTheme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('themeColor') as HTMLSelectElement).value = arg;
            this.electron.ipcRenderer.send('settings-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });

        this.electron.ipcRenderer.on('set-appLanguage', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('appLangSelect') as HTMLSelectElement).value = arg;
        });

        this.electron.ipcRenderer.on('languages-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.languagesReceived(arg);
        });

        this.electron.ipcRenderer.on('skeleton-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('skeletonFolder') as HTMLInputElement).value = arg;
            this.electron.ipcRenderer.send('get-srx');
        });

        this.electron.ipcRenderer.on('catalog-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg;
            this.electron.ipcRenderer.send('get-skeleton');
        });

        this.electron.ipcRenderer.on('srx-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultSRX') as HTMLInputElement).value = arg;
            this.electron.ipcRenderer.send('get-appLanguage');
            this.electron.ipcRenderer.send('get-defaultTheme');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-settings');
            }
        });
    }

    languagesReceived(arg: any): void {
        let array: Language[] = arg.languages;
        let options: string = '<option value="none">' + arg.none + '</option>';
        array.forEach((lang: Language) => {
            options = options + '<option value="' + lang.code + '">' + lang.description + '</option>';
        });
        let sourceSelect: HTMLSelectElement = document.getElementById('sourceSelect') as HTMLSelectElement;
        sourceSelect.innerHTML = options;
        sourceSelect.value = arg.srcLang;
        let targetSelect: HTMLSelectElement = document.getElementById('targetSelect') as HTMLSelectElement;
        targetSelect.innerHTML = options;
        targetSelect.value = arg.tgtLang;
        this.electron.ipcRenderer.send('get-catalog');
    }

    saveSettings(): void {
        this.electron.ipcRenderer.send('save-defaults', {
            srcLang: (document.getElementById('sourceSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('targetSelect') as HTMLSelectElement).value,
            skeleton: (document.getElementById('skeletonFolder') as HTMLInputElement).value,
            catalog: (document.getElementById('defaultCatalog') as HTMLInputElement).value,
            srx: (document.getElementById('defaultSRX') as HTMLInputElement).value,
            theme: (document.getElementById('themeColor') as HTMLSelectElement).value,
            appLang: (document.getElementById('appLangSelect') as HTMLSelectElement).value
        });
    }

}
