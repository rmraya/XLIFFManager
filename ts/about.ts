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


class About {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.send('get-theme');

        this.electron.ipcRenderer.on('set-version', (event: Electron.IpcRendererEvent, arg: any) => {
            document.getElementById('xliffmanager').innerHTML = 'XLIFF Manager ' + arg.xliffManager;
            document.getElementById('openxliff').innerHTML = arg.tool + '<br/>Version: ' + arg.version + '<br/>Build: ' + arg.build;
        });

        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });

        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('about-height', { width: body.clientWidth, height: (body.clientHeight + 20) });
        });
    }
}

new About();