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

ipcRenderer.send('get-languages');
ipcRenderer.send('get-catalog');
ipcRenderer.send('get-skeleton')

ipcRenderer.on('languages-received', (event,arg) => {
    var array = arg.languages;
    var options = '<option value="none">Select Language</option>';
    for (let i=0 ; i<array.length ; i++) {
        var lang = array[i];
        options = options + '<option value="' + lang.code + '">' + lang.description + '</option>';
    }
    document.getElementById('sourceSelect').innerHTML = options;
    document.getElementById('sourceSelect').value = arg.srcLang;
    document.getElementById('targetSelect').innerHTML = options;
    document.getElementById('targetSelect').value = arg.tgtLang;
 });

ipcRenderer.on('skeleton-received', (event,arg) => {
     document.getElementById('skeletonFolder').value = arg.sklFolder;
}); 

ipcRenderer.on('catalog-received', (event,arg) => {
    document.getElementById('defaultCatalog').value = arg.catalog;
}); 

document.getElementById('save').addEventListener('click', () => {
    ipcRenderer.send('save-defaults', {
        srcLang: document.getElementById('sourceSelect').value,
        tgtLang: document.getElementById('targetSelect').value,
        skeleton: document.getElementById('skeletonFolder').value, 
        catalog: document.getElementById('defaultCatalog').value
    });
});