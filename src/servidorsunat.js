import store from "@/store/index";
import axios from "axios";
import {
  db,
  grabaEstadoComprobante,
  grabaDatoC,
  editaGuiaremision,
  nuevo_ticket_guia,
  edita_campo_nc,
} from "@/db";
import moment from "moment";

export const enviaDocumentoApiSunat = (arrayCabecera, array) => {
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
    store.commit(
      "dialogosnackbar",
      "SU SISTEMA NO TIENE UNA CONEXION ACTIVA CON SUNAT!, EL COMPROBANTE NO TIENE VALIDEZ TRIBUTARIA"
    );
  } else {
    var servidorsunat =
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl";
  }
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos.name,
    nombre_comercial: store.state.baseDatos.namecomercial,
    departamento: store.state.baseDatos.departamento,
    provincia: store.state.baseDatos.provincia,
    distrito: store.state.baseDatos.distrito,
    direccion: store.state.baseDatos.direccion,
    ubigeo: store.state.baseDatos.ubigeo,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };
  var arrayCliente = {
    tipo_documento: arrayCabecera.cod_tipoDocumento,
    ruc: arrayCabecera.dni,
    razon_social: arrayCabecera.cliente,
    direccion: arrayCabecera.direccion,
  };
  var arrayItems = [];

  for (var i = 0; i < array.length; i++) {
    var data = array[i];

    if (data.operacion == "GRAVADA") {
      var operacion = ["S", "10", "1000", "IGV", "VAT", "01"];
    }
    if (data.operacion == "EXONERADA") {
      var operacion = ["E", "20", "9997", "EXO", "VAT", "01"];
    }
    if (data.operacion == "INAFECTA") {
      var operacion = ["O", "30", "9998", "INA", "FRE", "01"];
    }
    if (data.operacion == "GRATUITA") {
      var operacion = ["Z", "21", "9996", "GRA", "FRE", "02"];
    }
    arrayItems.push({
      item: i + 1,
      cantidad: data.cantidad,
      unidad: data.cod_medida, //ZZ ES PARA SERVICIOS
      nombre: data.nombre,
      valor_unitario: data.valor_unitario, // precio sin igv unitario
      precio_lista: data.precioVentaUnitario, //precio venta
      valor_total: data.valor_total,
      igv: data.igv,
      icbper: data.valor_icbper,
      factor_icbper: store.state.configuracion.icbper,
      total_antes_impuestos: data.total_antes_impuestos,
      total_impuestos: data.total_impuestos,
      codigos: operacion,
    });
  }

  var pago = "Contado";
  var credito = 0.0;
  var cuotas = [
    {
      numero: "000", // debe considerar 3 digitos. 000 es pork no hay numero
      importe: 0.0,
      vencimiento: "2021-08-31",
    },
  ];
  var vencimiento = moment
    .unix(arrayCabecera.vencimientoDoc)
    .format("YYYY-MM-DD");
  if (
    arrayCabecera.forma_pago == "Credito" &&
    arrayCabecera.cod_comprobante == "01"
  ) {
    pago = "Credito";
    credito = sumacredito(arrayCabecera.cuotas);
    cuotas = arrayCabecera.cuotas;
    vencimiento =
      arrayCabecera.cuotas[arrayCabecera.cuotas.length - 1].vencimiento;
  }
  var arrayCabecerasunat = {
    tipo_operacion: arrayCabecera.operacion || "0101", //Catálogo No. 51: Código de tipo de operación --- Venta interna
    tipo_comprobante: arrayCabecera.cod_comprobante,
    detraccion: arrayCabecera.detraccion || '',
    moneda: obtenerCodigoMoneda(arrayCabecera.moneda),
    serie: arrayCabecera.serie,
    correlativo: arrayCabecera.correlativoDocEmitido,
    total_op_gravadas: arrayCabecera.total_op_gravadas,
    igv: arrayCabecera.igv,
    porcentaje_igv: arrayCabecera.porcentaje_igv,
    icbper: 0,
    cargo_global: arrayCabecera.total_cargo,
    total_op_exoneradas: arrayCabecera.total_op_exoneradas,
    total_G_antes_impuestos: arrayCabecera.total_op_gratuitas,
    total_op_gratuitas: parseFloat(arrayCabecera.total_op_gratuitas),
    totalIGV_GRATUITA: arrayCabecera.totalIGV_GRATUITA,
    total_op_inafectas: parseFloat(arrayCabecera.total_op_inafectas||0),
    total_antes_impuestos:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas) +
      parseFloat(arrayCabecera.total_op_inafectas || 0),
    total_impuestos: arrayCabecera.igv,
    total_despues_impuestos:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas) +
      parseFloat(arrayCabecera.igv) +
      parseFloat(arrayCabecera.total_op_inafectas || 0),
    total_a_pagar:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas) +
      parseFloat(arrayCabecera.igv) +
      parseFloat(arrayCabecera.total_cargo) +
      parseFloat(arrayCabecera.total_op_inafectas || 0), //moment.unix(arrayCabecera.fecha).format('hh:mm A DD/MM')
    fecha_emision: moment.unix(arrayCabecera.fecha).format("YYYY-MM-DD"),
    hora_emision: moment.unix(arrayCabecera.fecha).format("hh:mm:ss"),
    fecha_vencimiento: vencimiento,
    forma_pago: pago, //Contado/Credito
    monto_credito: credito,
  };
  console.log(arrayCabecerasunat,arrayItems);
  //la sumatoria debe dar el monto del credito.

  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "emsionBF");
  bodyFormData.append("usuario", arrayEmisor.ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cliente", JSON.stringify(arrayCliente));
  bodyFormData.append("cabecera", JSON.stringify(arrayCabecerasunat));
  bodyFormData.append("cuotas", JSON.stringify(cuotas));
  bodyFormData.append("items", JSON.stringify(arrayItems));
  // url: 'https://mitienda-f5ef8.uc.r.appspot.com/',
  // url: 'https://silken-bastion-326020.appspot.com/',
  //'https://factura-peru.uc.r.appspot.com/'
  console.log(arrayEmisor);
  var resp = axios({
    method: "POST",
    url: "https://silken-bastion-326020.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      console.log(response.data);
      if (response.data.status_message == "0") {
        grabaDatoC(arrayCabecera.numeracion, "estado", "aprobado");
        grabaDatoC(
          arrayCabecera.numeracion,
          "mensajeSunat",
          response.data.data
        );
        grabaDatoC(arrayCabecera.numeracion, "hash", response.data.hash);
        grabaDatoC(arrayCabecera.numeracion, "automata", "0001");
      } else {
        grabaDatoC(arrayCabecera.numeracion, "estado", "PENDIENTE");
        grabaDatoC(
          arrayCabecera.numeracion,
          "mensajeSunat",
          response.data.data
        );
        grabaDatoC(arrayCabecera.numeracion, "hash", response.data.hash);
        grabaDatoC(arrayCabecera.numeracion, "automata", "");
      }
      //   grabaEstadoComprobante(arrayCabecera.tipocomprobante+arrayCabecera.correlativoDocEmitido,'',response.data.status_message,response.data.data,response.data.hash)
      return response.data;
    })
    .catch(function (error) {
      grabaEstadoComprobante(
        arrayCabecera.numeracion,
        "",
        "error",
        "error",
        "t67pf9JxHk03U57swkHHImGknrw"
      );
      return error;
    });

  return resp;
};

function sumacredito(array) {
  var suma = 0;
  for (var i = 0; i < array.length; i++) {
    suma = suma + parseFloat(array[i].importe);
  }
  return parseFloat(suma.toFixed(3));
}

export const descargaXML = (ruc, tipo, serie, correlativo) => {
  var gsReference = db.storage().refFromURL("gs://mitienda-f5ef8.appspot.com");

  gsReference
    .child(
      ruc + "/" + ruc + "-" + tipo + "-" + serie + "-" + correlativo + ".ZIP"
    )
    .getDownloadURL()
    .then(function (url) {
      // `url` is the download URL for 'images/stars.jpg'

      window.open(url, "_blank");
    })
    .catch(function (error) {});
};
export const descargaCDR = (ruc, tipo, serie, correlativo) => {
  var gsReference = db.storage().refFromURL("gs://mitienda-f5ef8.appspot.com");

  gsReference
    .child(
      ruc + "/R-" + ruc + "-" + tipo + "-" + serie + "-" + correlativo + ".ZIP"
    )
    .getDownloadURL()
    .then(function (url) {
      // `url` is the download URL for 'images/stars.jpg'
      window.open(url, "_blank");
    })
    .catch(function (error) {});
};
export const redondear = (valor) => {
  return parseFloat(valor).toFixed(2);
};

export const consultasunat = (tipo, ser, correla) => {
  var arrayEmisor = {
    ruc: store.state.baseDatos.ruc,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };
  var tipodoc = tipo;
  var serie = ser;
  var correlativo = correla;

  var bodyFormData = new FormData();
  bodyFormData.append("funcion", "consulta");
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("tipodoc", tipodoc);
  bodyFormData.append("serie", serie);
  bodyFormData.append("correlativo", correlativo);
  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};

export const resumenBajaSunat = (arrayCabecera, arrayItems) => {
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  var ruc = store.state.baseDatos.ruc;
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
  } else {
    var servidorsunat =
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl";
  }
  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos.name,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };
  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "anula");
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cabecera", JSON.stringify(arrayCabecera));
  bodyFormData.append("items", JSON.stringify(arrayItems));
  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};
export const guia_remision = (arrayCabecera, array) => {
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  var ruc = store.state.baseDatos.ruc;
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService";
  } else {
    var servidorsunat =
      "https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService?wsdl";
  }

  var arrayItems = [];
  for (var i = 0; i < array.length; i++) {
    var data = array[i];
    arrayItems.push({
      item: i + 1,
      cod_producto: data.cod_producto,
      cantidad: data.cantidad,
      medida: data.medida,
      descripcion: data.descripcion,
    });
  }

  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos.name,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
    client_id: store.state.baseDatos.PersonaID,
    client_secret: store.state.baseDatos.Token,
  };
  let cabe = arrayCabecera;
  cabe.fecha_emisions = moment.unix(cabe.fecha_emision).format("YYYY-MM-DD");
  cabe.fecha_traslados = moment.unix(cabe.fecha_traslado).format("YYYY-MM-DD");

  console.log(cabe, arrayItems, arrayEmisor);
  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "guia");
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cabecera", JSON.stringify(cabe));
  bodyFormData.append("items", JSON.stringify(arrayItems));
  console.log(arrayCabecera);
  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      console.log(response.data);
      var resp = JSON.parse(response.data.data);
      if (response.data.status_message == "aceptado") {
        console.log(arrayCabecera.id, resp.numTicket);
        nuevo_ticket_guia(arrayCabecera.id, resp.numTicket);
        editaGuiaremision(arrayCabecera.id, "estado", "aceptado");
        editaGuiaremision(arrayCabecera.id, "num_ticket", resp.numTicket);
        editaGuiaremision(arrayCabecera.id, "f_recepcion", resp.fecRecepcion);
        editaGuiaremision(arrayCabecera.id, "hash", response.data.hash);
      } else {
        editaGuiaremision(arrayCabecera.id, "estado", "rechazado");
      }
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};
export const consula_guia = (cabecera) => {
  var ruc = store.state.baseDatos.ruc;

  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
    client_id: store.state.baseDatos.PersonaID,
    client_secret: store.state.baseDatos.Token,
  };

  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "consulta_guia");
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", "");
  bodyFormData.append("passfirma", "");
  bodyFormData.append("servidorsunat", "");
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cabecera", JSON.stringify(cabecera));

  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      console.log(response.data);
      if (response.data.status_message == "aprobado") {
        editaGuiaremision(cabecera.id, "estado", "aprobado");
        editaGuiaremision(cabecera.id, "qr", response.data.data);
        editaGuiaremision(cabecera.id, "mensaje_sunat", "");
      } else {
        editaGuiaremision(cabecera.id, "estado", "error");
        editaGuiaremision(
          cabecera.id,
          "mensaje_sunat",
          response.data.data.desError
        );
      }
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};

export const envioNCredito = (arrayCabecera, array) => {
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  var ruc = store.state.baseDatos.ruc;
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
  } else {
    var servidorsunat =
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl";
  }
  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos.name,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };

  var arrayItems = [];

  for (var i = 0; i < array.length; i++) {
    var data = array[i];
    if (data.operacion == "GRAVADA") {
      var operacion = ["S", "10", "1000", "IGV", "VAT", "01"];
    }
    if (data.operacion == "EXONERADA") {
      var operacion = ["E", "20", "9997", "EXO", "VAT", "01"];
    }
    if (data.operacion == "GRATUITA") {
      var operacion = ["Z", "21", "9996", "GRA", "FRE", "02"];
    }

    arrayItems.push({
      item: i + 1,
      cantidad: data.cantidad,
      unidad: data.cod_medida,
      nombre: data.nombre,
      valor_unitario: data.valor_unitario, // precio sin igv unitario
      precio_lista: data.precioVentaUnitario, //precio venta
      valor_total: data.valor_total,
      igv: data.igv,
      total_antes_impuestos: data.total_antes_impuestos,
      total_impuestos: data.total_impuestos,
      codigos: operacion,
    });
  }
  var cod_com = "6";
  if (arrayCabecera.dni.length == 8) {
    cod_com = "1";
  }
  var arrayCliente = {
    tipo_documento: cod_com,
    ruc: arrayCabecera.dni,
    razon_social: arrayCabecera.cliente,
    direccion: arrayCabecera.direccion,
  };
  console.log(arrayCabecera);
  console.log(arrayCliente);
  var arrayCabecerasunat = {
    tipo_comprobante: "07",
    moneda: obtenerCodigoMoneda(arrayCabecera.moneda),
    serie: arrayCabecera.serie,
    correlativo: arrayCabecera.correlativo,
    total_op_gravadas: arrayCabecera.total_op_gravadas,
    igv: arrayCabecera.igv,
    porcentaje_igv: arrayCabecera.porcentaje_igv,
    total_impuestos: arrayCabecera.igv,
    total_op_exoneradas: arrayCabecera.total_op_exoneradas,
    total_antes_impuestos:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas),
    total_despues_impuestos:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas) +
      parseFloat(arrayCabecera.igv),
    total_a_pagar:
      parseFloat(arrayCabecera.total_op_gravadas) +
      parseFloat(arrayCabecera.total_op_exoneradas) +
      parseFloat(arrayCabecera.igv), //moment.unix(arrayCabecera.fecha).format('hh:mm A DD/MM')
    fecha_emision: moment.unix(arrayCabecera.fecha).format("YYYY-MM-DD"),
    codigo_motivo: "01",
    descripcion_motivo: "ANULACION DE LA OPERACION",
    tipo_comp_ref: arrayCabecera.tipo_comp_ref,
    serie_comp_ref: arrayCabecera.serie_comp_ref,
    correlativo_comp_ref: arrayCabecera.correlativo_comp_ref,
  };
  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "NC");
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cliente", JSON.stringify(arrayCliente));
  bodyFormData.append("cabecera", JSON.stringify(arrayCabecerasunat));
  bodyFormData.append("items", JSON.stringify(arrayItems));
  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      console.log(response.data);
      if (response.data.status_message == "0") {
        edita_campo_nc(arrayCabecera.numeracion, "estado", "aprobado");
        edita_campo_nc(
          arrayCabecera.numeracion,
          "mensajeSunat",
          response.data.data
        );
        edita_campo_nc(arrayCabecera.numeracion, "hash", response.data.hash);
        edita_campo_nc(arrayCabecera.numeracion, "automata", "0001");
      } else {
        edita_campo_nc(arrayCabecera.numeracion, "estado", "PENDIENTE");
        edita_campo_nc(
          arrayCabecera.numeracion,
          "mensajeSunat",
          response.data.data
        );
        edita_campo_nc(arrayCabecera.numeracion, "hash", response.data.hash);
        edita_campo_nc(arrayCabecera.numeracion, "automata", "");
      }
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};

export const resumenComprobantes = (arrayCabecera, arrayItems) => {
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  var ruc = store.state.baseDatos.ruc;
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
  } else {
    var servidorsunat =
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl";
  }
  var arrayEmisor = {
    tipo_documento: 6,
    ruc: store.state.baseDatos.ruc,
    razon_social: store.state.baseDatos.name,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };
  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "resumenC");
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("cabecera", JSON.stringify(arrayCabecera));
  bodyFormData.append("items", JSON.stringify(arrayItems));
  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};

export const consultasunatTicket = (ticket) => {
  var rutaFirma = store.state.baseDatos.nombrefirma;
  var passFirma = store.state.baseDatos.passfirma;
  if (store.state.baseDatos.pruebas) {
    var servidorsunat =
      "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
  } else {
    var servidorsunat =
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl";
  }
  var arrayEmisor = {
    ruc: store.state.baseDatos.ruc,
    usuario_sol: store.state.baseDatos.usuariosol,
    clave_sol: store.state.baseDatos.clavesol,
  };

  var ruc = store.state.baseDatos.ruc;
  var bodyFormData = new FormData();
  bodyFormData.append("entorno", "mitienda-f5ef8.appspot.com");
  bodyFormData.append("funcion", "consultaticketRA");
  bodyFormData.append("emisor", JSON.stringify(arrayEmisor));
  bodyFormData.append("usuario", ruc);
  bodyFormData.append("rutafirma", rutaFirma);
  bodyFormData.append("passfirma", passFirma);
  bodyFormData.append("servidorsunat", servidorsunat);
  bodyFormData.append("ticket", ticket);

  var resp = axios({
    method: "POST",
    url: "https://factura-peru.uc.r.appspot.com/",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return resp;
};

function obtencodigomedida(medida) {
  var array = store.state.medidassunat;
  var nomenclatura = "NIU";
  for (var i = 0; i < array.length; i++) {
    if (array[i].nombre == medida) {
      nomenclatura = array[i].corto;
    }
  }
  return nomenclatura;
}
function obtenerCodigoMoneda(simbolo) {
  const monedaEncontrada = store.state.moneda.find(
    (m) => m.simbolo === simbolo
  );
  return monedaEncontrada ? monedaEncontrada.codigo : "PEN"; // Valor predeterminado: "PEN"
}
