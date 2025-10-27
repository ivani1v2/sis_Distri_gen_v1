
import store from '@/store/index'

export const envia_host = (blob,name,impresora) => {
    reportes(blob,name,'POS-80-Series')
}
function reportes(data, name,impresora) {
    var reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onloadend = function () {
      var base64data = reader.result;
      var base64 = base64data.split(',')[1];
      Open(base64, name,impresora)
    }
  }
  const Open = (base64, name,impresora) => {
    var ip = store.state.configImpresora.ip_cocina 
    var param = { 'file': base64, 'namefile': name, 'impresora': impresora }
    OpenWindowWithPost('http://'+ip+':8082/printer',
      "width=330,height=145,left=100,top=100,resizable=yes,scrollbars=yes",
      "NewFile", param);
  }

const OpenWindowWithPost = (url, windowoption, name, params) => {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", url);
    form.setAttribute("target", name);
  
    for (var i in params) {
      if (params.hasOwnProperty(i)) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = i;
        input.value = params[i];
        form.appendChild(input);
      }
    }
    document.body.appendChild(form);
    var w = window.open("post.htm", name, windowoption);
    form.submit();
    document.body.removeChild(form);
    setTimeout(function () {
     w.close();
    }, 600);
  }