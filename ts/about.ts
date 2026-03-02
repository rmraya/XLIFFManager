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

export class About {

    constructor() {
        ipcRenderer.send('get-theme');

        ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
            ipcRenderer.send('get-version');
        });
        ipcRenderer.on('set-version', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('xlfm_version') as HTMLTableCellElement).innerHTML = arg.XLIFFManager;
            (document.getElementById('oxlf_version') as HTMLTableCellElement).innerHTML = arg.OpenXLIFF;
            (document.getElementById('xmlj_version') as HTMLTableCellElement).innerHTML = arg.XMLJava;
            (document.getElementById('bcp47j_version') as HTMLTableCellElement).innerHTML = arg.BCP47J;
            (document.getElementById('java_version') as HTMLTableCellElement).innerHTML = arg.Java;
            (document.getElementById('elect_version') as HTMLTableCellElement).innerHTML = arg.electron;
            setTimeout(() => {
                ipcRenderer.send('set-height', { window: 'about', width: document.body.clientWidth, height: document.body.clientHeight });
            }, 100);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                ipcRenderer.send('close-about');
            }
        });
        (document.getElementById('maxprograms') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('show-home');
        });
    }
}
