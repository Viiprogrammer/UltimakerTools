class Common {
    printers_types = [1];
    static addPrinter (){
        const name = $("#name").val();
        const ipaddr = $("#ip").val();
        if(!name.trim().length) {
            let error_container = document.getElementById('error');
            error_container.innerText = 'Name is empty';
            error_container.classList.remove('d-none');
            return false;
        }

        document.querySelector('#addbutton').disabled = true;
        document.querySelector("#addbutton > span").classList.remove('d-none');
        document.querySelector('#name').disabled = true;
        document.querySelector('#ip').disabled = true;

        ipcRenderer.send('asynchronous-message', {
            type: "addPrinter",
            ip: ipaddr,
            name: name
        });
    }
    static openDevTools(){
        ipcRenderer.send('asynchronous-message', {
            type: "openDevTools"
        });
    }
    static settingsOpen (){
        $('#settingsPrinter').modal('show');
    }
}