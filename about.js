const {ipcRenderer} = require('electron');

var pjson = require('./package.json');
document.getElementById('xliffmanager').innerHTML = pjson.version;

ipcRenderer.send('get-version');

ipcRenderer.on('set-version', (event, arg) => {
    document.getElementById('openxliff').innerHTML = arg.tool + '<br/>Version:' + arg.version + '<br/>Build: ' + arg.build;
});