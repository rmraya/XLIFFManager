/*******************************************************************************
 * Copyright (c) 2018-2019 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/ 
const {ipcRenderer} = require('electron');

var pjson = require('./package.json');
document.getElementById('xliffmanager').innerHTML = pjson.version;

ipcRenderer.send('get-version');

ipcRenderer.on('set-version', (event, arg) => {
    document.getElementById('openxliff').innerHTML = arg.tool + '<br/>Version:' + arg.version + '<br/>Build: ' + arg.build;
});