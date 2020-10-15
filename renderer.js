// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer } = require('electron'),
      {getLogger} = require("log4js"),
      logger = getLogger(),
      $ = require('jquery');

require('popper.js');
require('bootstrap');

logger.level = "all";


function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function listener(event_type, event, data_object){
    logger.debug(`[Browser] Event type: ${event_type}; Data:`, data_object);
    switch (data_object.type) {
        case "addingPrinter":

            if(!data_object.error && data_object.success){
                let error_container = document.getElementById('error');
                error_container.classList.add('d-none');
                $('#addPrinter').modal('hide');
                ipcRenderer.send('asynchronous-message', {type: "getPrinters", uuid: data_object.uuid});
            } else {
                let error_container = document.getElementById('error');
                if(data_object.error === 1){
                    error_container.innerText = 'Can\'t find printer on this IP address';
                } else if(data_object.error === 2){
                    error_container.innerText = 'Printer with IP '+$("#ip").val()+' already exits!';
                }else error_container.innerText = 'Unknown error';

                error_container.classList.remove('d-none')

                if(data_object.error === 1) {
                    $("#ip").val('');
                    $("#ip").focus()
                }
            }
            document.querySelector('#addbutton').disabled = false;
            document.querySelector("#addbutton > span").classList.add('d-none');
            document.querySelector('#name').disabled = false;
            document.querySelector('#ip').disabled = false;
            $("#ip").val('');
            $("#name").val('');

            break;
        case "changedDevtoolsStatus":
            document.getElementById("devtools_button") .innerText = data_object.status ? 'Hide DevTools' : 'Show DevTools';
            break;

        case "printersResponse":
            document.getElementById('printers_container').innerHTML = '';
            for(let printerID = 0; printerID < data_object.printers.length; printerID++){
                let tr = document.createElement('tr');
                tr.setAttribute("data-uuid", data_object.printers[printerID].uuid);

                if(data_object.uuid === data_object.printers[printerID].uuid || data_object.uuid === 'all'){
                    tr.classList.add('added_animate');
                }

                let printerSelect = document.createElement('td');
                printerSelect.innerHTML = '<input type="checkbox" id="printer'+printerID+'">' +
                    '<label class="form-check-label" for="validationFormCheck1"></label>';


                //PRINTER GUID
                let printerUUID = document.createElement('td');


                let UUIDSpan = document.createElement('span');
                UUIDSpan.classList.add("badge");
                UUIDSpan.classList.add("badge-light");
                UUIDSpan.classList.add("user-select-all");
                UUIDSpan.innerText = data_object.printers[printerID].uuid;
                printerUUID.append(UUIDSpan);

                //PRINTER NAME
                let printerName = document.createElement('td');
                printerName.innerText = data_object.printers[printerID].name;

                //PRINTER MODEL
                let printerModel = document.createElement('td');

                let modelSpan = document.createElement('span');
                modelSpan.classList.add("badge");
                modelSpan.classList.add("badge-dark");

                modelSpan.innerText = data_object.printers[printerID].model;
                printerModel.append(modelSpan);


                //PRINTER MEM
                let printerMem = document.createElement('td');
                if(data_object.printers[printerID].memory){
                    const usedMem = formatBytes(data_object.printers[printerID].memory.used, 0);
                    const totalMem = formatBytes(data_object.printers[printerID].memory.total, 0);
                    printerMem.innerText = `${usedMem}/${totalMem}`;
                }else  printerMem.innerText = `-`;


                //PRINTER IP
                let printerIP = document.createElement('td');
                printerIP.innerText = data_object.printers[printerID].ip;
                printerIP.classList.add("user-select-all");
                let printerSettings = document.createElement('td');
                printerSettings.innerHTML = "<button type=\"button\" class=\"btn btn-dark\" data-toggle=\"modal\" onclick=\"Common.settingsOpen()\">\n" +
                    "              <svg width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" class=\"bi bi-gear\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
                    "                <path fill-rule=\"evenodd\" d=\"M8.837 1.626c-.246-.835-1.428-.835-1.674 0l-.094.319A1.873 1.873 0 0 1 4.377 3.06l-.292-.16c-.764-.415-1.6.42-1.184 1.185l.159.292a1.873 1.873 0 0 1-1.115 2.692l-.319.094c-.835.246-.835 1.428 0 1.674l.319.094a1.873 1.873 0 0 1 1.115 2.693l-.16.291c-.415.764.42 1.6 1.185 1.184l.292-.159a1.873 1.873 0 0 1 2.692 1.116l.094.318c.246.835 1.428.835 1.674 0l.094-.319a1.873 1.873 0 0 1 2.693-1.115l.291.16c.764.415 1.6-.42 1.184-1.185l-.159-.291a1.873 1.873 0 0 1 1.116-2.693l.318-.094c.835-.246.835-1.428 0-1.674l-.319-.094a1.873 1.873 0 0 1-1.115-2.692l.16-.292c.415-.764-.42-1.6-1.185-1.184l-.291.159A1.873 1.873 0 0 1 8.93 1.945l-.094-.319zm-2.633-.283c.527-1.79 3.065-1.79 3.592 0l.094.319a.873.873 0 0 0 1.255.52l.292-.16c1.64-.892 3.434.901 2.54 2.541l-.159.292a.873.873 0 0 0 .52 1.255l.319.094c1.79.527 1.79 3.065 0 3.592l-.319.094a.873.873 0 0 0-.52 1.255l.16.292c.893 1.64-.902 3.434-2.541 2.54l-.292-.159a.873.873 0 0 0-1.255.52l-.094.319c-.527 1.79-3.065 1.79-3.592 0l-.094-.319a.873.873 0 0 0-1.255-.52l-.292.16c-1.64.893-3.433-.902-2.54-2.541l.159-.292a.873.873 0 0 0-.52-1.255l-.319-.094c-1.79-.527-1.79-3.065 0-3.592l.319-.094a.873.873 0 0 0 .52-1.255l-.16-.292c-.892-1.64.902-3.433 2.541-2.54l.292.159a.873.873 0 0 0 1.255-.52l.094-.319z\"/>\n" +
                    "                <path fill-rule=\"evenodd\" d=\"M8 5.754a2.246 2.246 0 1 0 0 4.492 2.246 2.246 0 0 0 0-4.492zM4.754 8a3.246 3.246 0 1 1 6.492 0 3.246 3.246 0 0 1-6.492 0z\"/>\n" +
                    "              </svg>\n" +
                    "            </button>";



                //PRINTER  ONLINE
                let printerOnline = document.createElement('td');

                let onlineSpan = document.createElement('span');
                onlineSpan.classList.add("badge");
                if(data_object.printers[printerID].online){
                    onlineSpan.classList.add("badge-success");
                } else onlineSpan.classList.add("badge-danger");
                onlineSpan.innerText = data_object.printers[printerID].online ? 'Online' : 'Offline';
                printerOnline.append(onlineSpan);

                if(data_object.printers[printerID].status) {
                    let workSpan = document.createElement('span');
                    workSpan.classList.add("badge");
                    workSpan.classList.add("badge-dark");
                    workSpan.innerText = data_object.printers[printerID].status;
                    console.log(data_object.printers[printerID].status)
                    printerOnline.append(workSpan);
                }

                //Compile
                tr.append(printerSelect);
                tr.append(printerUUID);
                tr.append(printerName);
                tr.append(printerModel);
                tr.append(printerIP);
                tr.append(printerOnline);
                tr.append(printerMem);
                tr.append(printerSettings);

                let printers_container = document.getElementById('printers_container');
                printers_container.append(tr);
            }

            if(!data_object.printers.length){
                document.getElementById('no_printers').classList.remove('d-none');
            } else {
                document.getElementById('no_printers').classList.add('d-none');
            }
            document.getElementById('printers_count').innerText = data_object.printers.length.toString();
            document.getElementById('printers_table').classList.remove('d-none');
            document.getElementById('loader').classList.add('d-none');
            document.querySelector('#update > svg').classList.remove('spinner')
            setTimeout(  () => {
                if($('.added_animate').length){
                    $('.added_animate').css({background: '#fff'})
                }
            }, 1500)
            break;
    }
}
ipcRenderer.on('asynchronous-reply', (event, data) => listener('asynchronous-reply', event, data))
ipcRenderer.send('asynchronous-message', {type: "getPrinters"});