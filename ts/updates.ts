/*******************************************************************************
 * Copyright (c) 2018 - 2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class Updates {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-versions');
        this.electron.ipcRenderer.on('set-versions', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('current') as HTMLTableCellElement).innerText = arg.current;
            (document.getElementById('latest') as HTMLTableCellElement).innerText = arg.latest;
            this.electron.ipcRenderer.send('updates-height', { width: document.body.clientWidth, height: document.body.clientHeight });
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.electron.ipcRenderer.send('download-latest');
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-updates');
            }
        });
        (document.getElementById('release') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('release-history'); });
        (document.getElementById('download') as HTMLButtonElement).addEventListener('click', () => { this.electron.ipcRenderer.send('download-latest'); });
    }
}
