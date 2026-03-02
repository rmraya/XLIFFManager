/*******************************************************************************
 * Copyright (c) 2018-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ipcRenderer } from "electron";
import { Language } from "typesbcp47";

export class Settings {

    constructor() {
        ipcRenderer.send('get-theme');

        (document.getElementById('browseCatalog') as HTMLButtonElement).addEventListener('click', () => { ipcRenderer.send('select-catalog'); });
        (document.getElementById('browseSkeleton') as HTMLButtonElement).addEventListener('click', () => { ipcRenderer.send('select-skeleton'); });
        (document.getElementById('browseSRX') as HTMLButtonElement).addEventListener('click', () => { ipcRenderer.send('select-srx'); });
        (document.getElementById('saveSettings') as HTMLButtonElement).addEventListener('click', () => { this.saveSettings(); });

        ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
            ipcRenderer.send('get-languages');
        });

        ipcRenderer.on('set-defaultTheme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('themeColor') as HTMLSelectElement).value = arg;
        });

        ipcRenderer.on('set-appLanguage', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('appLangSelect') as HTMLSelectElement).value = arg;
        });

        ipcRenderer.on('languages-received', (event: Electron.IpcRendererEvent, arg: any) => {
            this.languagesReceived(arg);
        });

        ipcRenderer.on('skeleton-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('skeletonFolder') as HTMLInputElement).value = arg;
            ipcRenderer.send('get-srx');
        });

        ipcRenderer.on('catalog-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg;
            ipcRenderer.send('get-skeleton');
        });

        ipcRenderer.on('srx-received', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultSRX') as HTMLInputElement).value = arg;
            ipcRenderer.send('get-appLanguage');
            ipcRenderer.send('get-defaultTheme');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-settings');
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'settings', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
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
        ipcRenderer.send('get-catalog');
    }

    saveSettings(): void {
        ipcRenderer.send('save-defaults', {
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
