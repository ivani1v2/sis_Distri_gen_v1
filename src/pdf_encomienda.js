import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import QR from "qrcode-base64";
import moment from "moment";
import "moment/locale/es"; // Importa el idioma español
moment.locale("es");
import { NumerosALetras } from "numero-a-letras";
let modo_genera = "abre";
import { envia_host } from "./host_impresora";
export const pdfGenera_encomienda = (arraydatos, cabecera, medida, modo) => {
  //console.log(arraydatos, cabecera, medida, modo);
  modo_genera = modo;
  var qrs = "";
  if (cabecera.tipocomprobante != "T") {
    var qrs = generaQR(cabecera);
  }
  switch (medida) {
    case "A4":
      impresionA4(arraydatos, qrs, cabecera);
      break;
    case "80":
      var resp = impresion80(arraydatos, qrs, cabecera);
      break;
    case "58":
      impresion58(arraydatos, qrs, cabecera);
      break;
  }
};
function impresion58(arraydatos, qr, cabecera) {
  var arraycabe = cabecera;
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Ruc = "Ruc: " + store.state.baseDatos.ruc;
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment
    .unix(arraycabe.fecha)
    .format("DD/MM/YYYY hh:mm a");
  var array = arraydatos;
  var total = (
    parseFloat(arraycabe.total_op_exoneradas) +
    parseFloat(arraycabe.total_op_gravadas) +
    parseFloat(arraycabe.total_op_inafectas || 0) +
    parseFloat(arraycabe.igv)
  ).toFixed(2);

  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = 4; //left margin in mm
  var rMargin = 1; //right margin in mm
  var pdfInMM = 54; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var piepagina = store.state.configImpresora.piepagina;
  var telefono = store.state.configImpresora.telefono;
  var pageCenter = pdfInMM / 2;

  switch (arraycabe.tipocomprobante) {
    case "T":
      var documento = "TICKET DE VENTA";
      if (store.state.seriesdocumentos.notaventa) {
        documento = "NOTA DE VENTA";
      }
      break;
    case "B":
      var documento = "BOLETA ELECTRONICA";
      break;
    case "F":
      var documento = "FACTURA ELECTRONICA";
      break;
  }

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;
  //console.log(imagen)
  if (imagen != "") {
    doc.addImage(
      "data:image/png;base64," + imagen,
      "png",
      pdfInMM / 2 - 15,
      linea,
      30,
      30
    );
    linea = linea + parseInt(store.state.configImpresora.minferior) - 10; /// modificar margenes de logo
  }
  doc.setFontSize(7);
  doc.setFont("Helvetica", "Bold");
  if (store.state.configImpresora.nom_comercial) {
    var texto = doc.splitTextToSize(
      store.state.baseDatos.namecomercial,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA

    linea = linea + 4 * texto.length;
    doc.setFont("Helvetica", "");
  } else {
    var texto = doc.splitTextToSize(
      store.state.baseDatos.name,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA

    linea = linea + 4 * texto.length;
  }

  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(Ruc, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //RUC
  linea = linea + 3.2;
  doc.setFont("Helvetica", "");
  if (store.state.configImpresora.nom_comercial) {
    var texto = doc.splitTextToSize(
      store.state.baseDatos.name,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA
    linea = linea + 3.5;
  }
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(Direccion, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //RUC

  linea = linea + 3 * texto.length;

  if (cabecera != "") {
    linea = linea + 2;
    var texto = doc.splitTextToSize(cabecera, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }
  if (telefono != "") {
    var texto = doc.splitTextToSize(
      "Telf: " + telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  var texto = doc.splitTextToSize(documento, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    arraycabe.serie + "-" + arraycabe.correlativoDocEmitido,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fechaImpresion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  /*--------------datos cliente--------------------*/

  var texto = doc.splitTextToSize(
    "Nombre   : " + arraycabe.cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arraycabe.dni,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  if (arraycabe.direccion != "") {
    var texto = doc.splitTextToSize(
      "Direccion: " + arraycabe.direccion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3 * texto.length;
  }
  if (arraycabe.tipocomprobante != "T") {
    var texto = doc.splitTextToSize(
      "Condiciones: " + arraycabe.forma_pago,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  if (arraycabe.telefono != "") {
    var texto = doc.splitTextToSize(
      "Telf: " + arraycabe.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3 * texto.length;
  }
  if (arraycabe.observacion != "") {
    var texto = doc.splitTextToSize(
      "Observacion: " + arraycabe.observacion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3 * texto.length;
  }
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 7;
  doc.text(separacion, pageCenter, linea, "center");

  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    //console.log(array[i])
    var obs = "";
    var tg = "";
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / TG: S/." + array[i].valor_total;
      array[i].precioedita = "0.00";
    }
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] =
      array[i].nombre +
      "\n" +
      "- S/." +
      array[i].precioedita +
      " X " +
      array[i].medida +
      tg;
    nuevoArray[i][2] =
      parseFloat(array[i].precioedita * array[i].cantidad).toFixed(2) + obs;
  }

  doc.autoTable({
    margin: { top: linea - 9, left: 3 },
    styles: {
      fontSize: 7,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 8, halign: "center" },
      1: { columnWidth: 30, halign: "left" },
      2: { columnWidth: 11, halign: "right" },
    },
    theme: ["plain"],
    head: [["Cant", "Descripcion", "P.T"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  var array_pago = arraycabe.modopago;
  for (var i = 0; i < array_pago.length; i++) {
    var data = array_pago[i];
    if (Boolean(data.monto)) {
      doc.setFont("Helvetica", "");
      doc.setFontSize(7);
      doc.text(data.nombre, lMargin, linea);
      doc.text(
        "S/." + String(parseFloat(data.monto).toFixed(2)),
        50,
        linea,
        "right"
      );
      linea = linea + 3;
    }
  }
  if (arraycabe.total_op_gratuitas > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(7);
    var texto = doc.splitTextToSize(
      "* Transferencia Gratuita y/o Servicio Prestado Gratuitamente",
      50
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 3 * texto.length;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 4;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(7);
  if (arraycabe.tipocomprobante != "T") {
    doc.text("OP. GRAVADA", lMargin, linea);
    doc.text("S./" + arraycabe.total_op_gravadas, 50, linea, "right");
    linea = linea + 3.5;
    if (arraycabe.total_op_exoneradas > 0) {
      doc.text("OP. EXONERADA", lMargin, linea);
      doc.text(
        "S./" + arraycabe.total_op_exoneradas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
    if (arraycabe.total_op_gratuitas > 0) {
      doc.text("OP. GRATUITAS", lMargin, linea);
      doc.text(
        "S./" + arraycabe.total_op_gratuitas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
    if (arraycabe.total_op_inafectas > 0) {
      doc.text("OP. INFAFECTA", lMargin, linea);
      doc.text(
        "S./" + arraycabe.total_op_inafectas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
    doc.text("IGV " + arraycabe.porcentaje_igv + "%", lMargin, linea);
    doc.text("S./" + arraycabe.igv, 50, linea, "right");
    linea = linea + 3.5;
  }

  doc.text("Total", lMargin, linea);
  doc.text("S./" + total, 50, linea, "right");
  linea = linea + 3.5;

  if (store.state.configuracion.activo_moneda) {
    linea = linea + 2;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
    doc.setFont("Helvetica", "");
    doc.setFontSize(7);
    var tot_moneda =
      parseFloat(store.state.configuracion.conversion_moneda) *
      parseFloat(total);
    var texto = doc.splitTextToSize(
      "TOTAL " + store.state.configuracion.nom_moneda + ": " + tot_moneda,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    doc.setFontSize(7);
    linea = linea + 3 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  doc.setFontSize(7);
  if (arraycabe.nomempleado != "" && arraycabe.nomempleado != undefined) {
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(
      "Vendedor: " + arraycabe.nomempleado,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 3.5 * texto.length;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
  }
  doc.setFont("Helvetica", "");
  doc.setFontSize(7);
  var texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2)),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3.5 * texto.length;

  if (arraycabe.tipocomprobante != "T") {
    doc.setFontSize(7);
    var texto = doc.splitTextToSize(
      "Representación Impresa de la " +
        documento +
        " Consultar su validez en https://domo.pe/buscardocumentos",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 3 * texto.length;

    if (qr != "") {
      if (
        arraycabe.tipocomprobante == "F" ||
        arraycabe.tipocomprobante == "B"
      ) {
        doc.addImage(qr, "png", pdfInMM / 2 - 10, linea, 18, 18);
        linea = linea + 14;
      }
    }
  }

  if (arraycabe.forma_pago == "Credito") {
    linea = linea + 10;
    doc.autoTable({
      margin: { top: 10, left: 1 },
      startY: linea,
      styles: {
        fontSize: 7,
        cellPadding: 0.1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 11, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 22, halign: "center" },
        2: { columnWidth: 17, halign: "center" },
      },
      theme: ["plain"],
      head: [["CUOTA", "IMPORTE", "VENCE"]],
      body: cuotascredito(arraycabe.cuotas),
    });
    let finalY = doc.previousAutoTable.finalY;
    linea = finalY + 3;
  }

  if (piepagina != "") {
    linea = linea + 7;
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(piepagina, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center");
  }
  linea = linea + parseFloat(store.state.configImpresora.minferiorgeneral);
  // console.log("aqui"+store.state.configImpresora.minferiorgeneral)
  doc.text(".", 0, linea);

  switch (modo_genera) {
    case "abre":
      if (store.state.esmovil) {
        window.open(doc.output("bloburi"));
      } else {
        abre_dialogo_impresion(doc.output("bloburi"));
      }
      break;
    case "host":
      break;
    case "descarga":
      doc.save(
        arraycabe.serie + "-" + arraycabe.correlativoDocEmitido + ".pdf"
      );
      break;
  }
}
function impresion80(arraydatos, qr, cabecera) {
  var arraycabe = cabecera;
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Ruc = "Ruc: " + store.state.baseDatos.ruc;
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment
    .unix(arraycabe.fecha)
    .format("DD/MM/YYYY hh:mm a");
  var array = arraydatos;
  var total = (
    parseFloat(arraycabe.total_op_exoneradas) +
    parseFloat(arraycabe.total_op_gravadas) +
    parseFloat(arraycabe.igv)
  ).toFixed(2);
  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var pdfInMM = 75; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var piepagina = store.state.configImpresora.piepagina;
  var telefono = store.state.configImpresora.telefono;
  var pageCenter = pdfInMM / 2;
  console.log(arraycabe);
  switch (arraycabe.tipocomprobante) {
    case "T":
      var documento = "TICKET DE VENTA";
      if (store.state.seriesdocumentos.notaventa) {
        documento = "NOTA DE VENTA";
      }
      break;
    case "B":
      var documento = "BOLETA DE VENTA ELECTRONICA";
      break;
    case "F":
      var documento = "FACTURA ELECTRONICA";
      break;
  }

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;
  //console.log(imagen)
  if (imagen != "") {
    doc.addImage(
      "data:image/png;base64," + imagen,
      "png",
      pdfInMM / 2 - 20,
      linea,
      40,
      40
    );
    linea = linea + parseInt(store.state.configImpresora.minferior); /// modificar margenes de logo
  }
  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    store.state.baseDatos.name,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA

  linea = linea + 4 * texto.length;

  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    Ruc + "\n" + Direccion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //RUC

  linea = linea + 3.5 * texto.length;

  if (cabecera != "") {
    linea = linea + 2;
    var texto = doc.splitTextToSize(cabecera, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }
  if (telefono != "") {
    var texto = doc.splitTextToSize(
      "Telf: " + telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  var texto = doc.splitTextToSize(documento, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    arraycabe.serie + "-" + arraycabe.correlativoDocEmitido,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fechaImpresion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  /*--------------datos cliente--------------------*/

  var texto = doc.splitTextToSize(
    "Remitente   : " + arraycabe.cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 4 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arraycabe.dni,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");

  if (arraycabe.encomienda.remitente.telefono) {
    linea = linea + 4 * texto.length;
    var texto = doc.splitTextToSize(
      "Telefono: " + arraycabe.encomienda.remitente.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
  }
  linea = linea + 3 * texto.length;

  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3 * texto.length;

  var texto = doc.splitTextToSize(
    "Destinatario   : " + arraycabe.encomienda.destinatario.nombre,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 4 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arraycabe.encomienda.destinatario.documento,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");

  if (arraycabe.encomienda.destinatario.telefono) {
    linea = linea + 4 * texto.length;
    var texto = doc.splitTextToSize(
      "Telefono: " + arraycabe.encomienda.destinatario.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
  }

  linea = linea + 3 * texto.length;

  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3 * texto.length;

  var texto = doc.splitTextToSize(
    "Origen   : " + arraycabe.encomienda.agencia_origen,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 5 * texto.length;

  var texto = doc.splitTextToSize("Destino  : ", pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  var texto = doc.splitTextToSize(
    arraycabe.encomienda.agencia_destino,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 16, linea, "left");
  linea = linea + 5 * texto.length;
  if (arraycabe.encomienda.destinatario.direccion) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize("Direccion: ", pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    var texto = doc.splitTextToSize(
      arraycabe.encomienda.destinatario.direccion,
      pdfInMM - lMargin - rMargin - 12
    );
    doc.text(texto, 16, linea, "left");
    linea = linea + 4 * texto.length;
  }
  doc.setFontSize(8);
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize("Modo     : ", pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  var texto = doc.splitTextToSize(
    arraycabe.encomienda.tipo_pago,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 16, linea, "left");

  linea = linea + 3.5 * texto.length;
  doc.setFontSize(8);
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 7;
  doc.text(separacion, pageCenter, linea, "center");

  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    //console.log(array[i])
    var obs = "";
    var tg = "";
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / TG: S/." + array[i].valor_total;
      array[i].precioedita = "0.00";
    }
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre + tg;
    nuevoArray[i][2] = array[i].precioedita;
    nuevoArray[i][3] =
      parseFloat(array[i].precioedita * array[i].cantidad).toFixed(2) + obs;
  }

  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: {
      fontSize: 8.5,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 8, halign: "center" },
      1: { columnWidth: 35, halign: "center" },
      2: { columnWidth: 12, halign: "right" },
      3: { columnWidth: 12, halign: "right" },
    },
    theme: ["plain"],
    head: [["Cant", "Descripcion", "P.U", "P.T"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY;
  linea = linea + 3;
  doc.setFontSize(8);
  doc.setFont("Helvetica", "");
  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  if (arraycabe.descuentos != 0) {
    doc.setFontSize(8);
    doc.text("DESCUENTOS", lMargin, linea);
    doc.text("S./" + arraycabe.descuentos, 68, linea, "right");
    linea = linea + 3.5;
  }
  if (arraycabe.total_op_gratuitas > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(7);
    var texto = doc.splitTextToSize(
      "* Transferencia Gratuita y/o Servicio Prestado Gratuitamente",
      100
    );
    doc.text(texto, 2, linea, "left");
    linea = linea + 3;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 4;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(7.5);
  if (arraycabe.tipocomprobante != "T") {
    doc.text("OP. GRAVADA", lMargin, linea);
    doc.text("S./" + arraycabe.total_op_gravadas, 68, linea, "right");
    linea = linea + 3.5;
    if (arraycabe.total_op_exoneradas > 0) {
      doc.text("OP. EXONERADA", lMargin, linea);
      doc.text(
        "S./" + arraycabe.total_op_exoneradas.toString(),
        68,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
    if (arraycabe.total_op_gratuitas > 0) {
      doc.text("OP. GRATUITAS", lMargin, linea);
      doc.text(
        "S./" + arraycabe.total_op_gratuitas.toString(),
        68,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
    doc.text("IGV " + arraycabe.porcentaje_igv + "%", lMargin, linea);
    doc.text("S./" + arraycabe.igv, 68, linea, "right");
    linea = linea + 3.5;
  }

  doc.text("Total", lMargin, linea);
  doc.text("S./" + total, 68, linea, "right");
  linea = linea + 3.5;

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  doc.setFontSize(8);

  // modo pago

  var array_pago = arraycabe.modopago;
  if (arraycabe.encomienda.tipo_pago == "PAGADO") {
    for (var i = 0; i < array_pago.length; i++) {
      var data = array_pago[i];
      if (Boolean(data.monto)) {
        doc.setFont("Helvetica", "");
        doc.setFontSize(7);
        doc.text(data.nombre, lMargin, linea);
        doc.text(
          "S/." + String(parseFloat(data.monto).toFixed(2)),
          68,
          linea,
          "right"
        );
        linea = linea + 3;
      }
    }
  }

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  /*
  doc.setFont("Helvetica", "bold");
  var texto = doc.splitTextToSize(
    "Vendedor : " + arraycabe.vendedor,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3.5 * texto.length;*/

  if (arraycabe.nomempleado != "" && arraycabe.nomempleado != undefined) {
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(
      "Vendedor: " + arraycabe.nomempleado,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 3.5 * texto.length;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
  }
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2)),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3.5 * texto.length;

  if (arraycabe.tipocomprobante != "T") {
    doc.setFontSize(8);
    var texto = doc.splitTextToSize(
      "Representación Impresa de la " +
        documento +
        " Consultar su validez en https://domo.pe/buscardocumentos",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 3 * texto.length;

    if (qr != "") {
      if (
        arraycabe.tipocomprobante == "F" ||
        arraycabe.tipocomprobante == "B"
      ) {
        doc.addImage(qr, "png", pdfInMM / 2 - 10, linea, 18, 18);
        linea = linea + 14;
      }
      linea = linea + 8;
    }
  }
  linea = linea + 1;
  doc.setFontSize(7);
  doc.setFont("Helvetica", "bold");
  var texto = doc.splitTextToSize(
    "CONDICION DE TRANSPORTES DE ENCOMIENDAS",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 3, linea, "left");
  linea = linea + 3.5 * texto.length;
  var terminos = `1. Las características del servicio solicitado por el cliente se encuentran debidamente detalladas en el comprobante recibo y/o guía.
2. En observancia a las normas vigentes está prohibido el transporte de drogas, armas, municiones, materiales reactivos, explosivos, tóxicos, inflamables y otros considerados peligrosos. Los envíos de animales vivos y material de fácil descomposición se encuentran comprendidos en la restricción, por tanto, la empresa no se responsabiliza por daños y perjuicios que este tipo de envíos puedan sufrir.
3. En cumplimiento del punto anterior, el cliente asume la responsabilidad que pudiera ocasionar.
4. La empresa no transporta dinero, ni artículos de valor no declarados, por lo tanto, no se hace responsable por la pérdida o deterioro. En caso de que el cliente decidiera enviar artículos de valor, deberá declarar al personal de la empresa el valor declarado o cargar un adicional del 10% sobre el valor declarado.
5. La empresa indemnizará hasta 10 veces el valor del flete pagado por el envío. En caso de pérdida, extravío, deterioro o suplantación del envío no declarado.
6. El embalaje de las encomiendas o carga es de absoluta responsabilidad del cliente. La empresa no se responsabiliza por el deterioro por causas derivadas del mal embalaje.
7. En caso de envío de delivery, si el cliente no responde a la comunicación de coordinación de entrega, el cliente tendrá que acercarse a nuestras oficinas para el recojo de su encomienda.
8. La empresa no se responsabiliza pasado más de 15 días prestados del servicio.`;
  doc.setFont("Helvetica", "");
  doc.setFontSize(7);
  var texto = doc.splitTextToSize(terminos, pdfInMM - lMargin - rMargin);
  doc.text(texto, 3, linea, "left");
  linea = linea + 2 * texto.length;
  doc.setFontSize(8);

  if (arraycabe.forma_pago == "Credito") {
    linea = linea + 10;
    doc.autoTable({
      margin: { top: 10, left: 3 },
      startY: linea,
      styles: {
        fontSize: 7.5,
        cellPadding: 0.2,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 15, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 26, halign: "center" },
        2: { columnWidth: 25, halign: "center" },
      },
      theme: ["plain"],
      head: [["CUOTA", "IMPORTE", "VENCE"]],
      body: cuotascredito(arraycabe.cuotas),
    });
    let finalY = doc.previousAutoTable.finalY;
    linea = finalY + 3;
  }

  if (piepagina != "") {
    linea = linea + 7;
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(piepagina, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center");
  }
  linea = linea + parseFloat(store.state.configImpresora.minferiorgeneral);
  // console.log("aqui"+store.state.configImpresora.minferiorgeneral)
  doc.text(".", 0, linea);

  switch (modo_genera) {
    case "abre":
      if (store.state.esmovil) {
        window.open(doc.output("bloburi"));
      } else {
        abre_dialogo_impresion(doc.output("bloburi"));
      }
      break;
    case "host":
      envia_host(
        doc.output("blob"),
        arraycabe.serie + "-" + arraycabe.correlativoDocEmitido + ".pdf",
        "caja"
      );
      break;
    case "descarga":
      doc.save(
        arraycabe.serie + "-" + arraycabe.correlativoDocEmitido + ".pdf"
      );
      break;
  }
}
function abre_dialogo_impresion(blob) {
  var Ancho = screen.width;
  var Alto = screen.height;
  var A = (Ancho * 50) / 100;
  var H = (Alto * 50) / 100;
  var difA = Ancho - A;
  var difH = Alto - H;
  var tope = difH / 2;
  var lado = difA / 2;
  var Opciones =
    "status=no, menubar=no, directories=no, location=no, toolbar=no, scrollbars=yes, resizable=no, width=" +
    A +
    ", height=" +
    H +
    ", top=" +
    tope +
    ", left=" +
    lado +
    "";
  var w = window.open(blob, "_blank", Opciones);
  w.print();
}

function impresionA4(array, qr, arraycabecera) {
  var arraycabe = arraycabecera;
  var linea = parseInt(store.state.configImpresora.msuperior);
  var nombreEmpresa = store.state.baseDatos.name;
  var imagen = store.state.logoempresa;
  var Direccion =
    store.state.baseDatos.direccion +
    " - " +
    store.state.baseDatos.distrito +
    " - " +
    store.state.baseDatos.provincia +
    " - " +
    store.state.baseDatos.departamento;
  var fechaImpresion = moment.unix(arraycabe.fecha).format("DD/MM/YYYY");
  var fecha_vencimiento = moment
    .unix(arraycabe.vencimientoDoc)
    .format("DD/MM/YYYY");
  var total = (
    parseFloat(arraycabe.total_op_exoneradas) +
    parseFloat(arraycabe.total_op_gravadas) +
    parseFloat(arraycabe.igv)
  ).toFixed(2);
  var totalDesc = arraycabe.descuentos;
  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento;
  var pdfInMM = 210; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;
  var bancos = store.state.bancos;
  if (arraycabe.total_op_gratuitas == undefined) {
    arraycabe.total_op_gratuitas = 0;
  }
  switch (arraycabe.tipocomprobante) {
    case "T":
      var documento = "TICKET DE VENTA";
      if (store.state.seriesdocumentos.notaventa) {
        documento = "NOTA DE VENTA";
      }
      break;
    case "B":
      var documento = "BOLETA DE VENTA ELECTRONICA";
      break;
    case "F":
      var documento = "FACTURA ELECTRONICA";
      break;
  }

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = linea + 3;

  if (imagen != "") {
    doc.rect(10, 10, 30, 30);
    doc.addImage("data:image/png;base64," + imagen, "png", 12, 12, 26, 26);

    if (cabecera != "") {
      linea = linea + 8;
    } else {
      linea = linea + 23;
    }
    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(9.5);
    var texto = doc.splitTextToSize(nombreEmpresa, 80);
    doc.text(texto, 48, linea, "left"); //EMPRESA

    linea = linea + 4 * texto.length;

    if (cabecera != "") {
      doc.setFont("Helvetica", "");
      doc.setFontSize(7.5);
      var texto = doc.splitTextToSize(cabecera, 80);
      doc.text(texto, 48, linea, "left"); //CABECERA
      linea = linea + 3.5 * texto.length;
    }

    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    var texto = doc.splitTextToSize(Direccion, 80);
    doc.text(texto, 48, linea, "left"); //direccion

    linea = linea + 4 * texto.length;
    if (false) {
      doc.setFont("Helvetica", "");
      doc.setFontSize(8);
      var texto = doc.splitTextToSize("TELEFONO: " + telefono, 70);
      doc.text(texto, 48, linea, "left"); //TELEFONO EMPRESA
    }
  } else {
    linea = linea + 15;
    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(15);
    var texto = doc.splitTextToSize(nombreEmpresa, 100);
    doc.text(texto, 10, linea, "left"); //EMPRESA

    linea = linea + 5 * texto.length;

    if (cabecera != "") {
      doc.setFont("Helvetica", "");
      doc.setFontSize(10);
      var texto = doc.splitTextToSize(cabecera, 120);
      doc.text(texto, 10, linea, "left"); //CABECERA
      linea = linea + 4 * texto.length;
    }

    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    var texto = doc.splitTextToSize(Direccion, 120);
    doc.text(texto, 10, linea, "left"); //direccion

    linea = linea + 4 * texto.length;
    if (telefono != "") {
      doc.setFont("Helvetica", "");
      doc.setFontSize(8);
      var texto = doc.splitTextToSize("TELEFONO: " + telefono, 70);
      doc.text(texto, 10, linea, "left"); //TELEFONO EMPRESA
    }
  }
  doc.setLineWidth(0.7);
  doc.rect(140, 10, 60, 25);

  doc.setFontSize(11);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize("Ruc: " + store.state.baseDatos.ruc, 50);
  doc.text(texto, 170, 18, "center");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(documento, 50);
  doc.text(texto, 170, 22, "center");
  doc.setFontSize(10);
  var texto = doc.splitTextToSize(
    arraycabe.serie + "-" + arraycabe.correlativoDocEmitido,
    50
  );
  doc.text(texto, 170, 26, "center");

  doc.setFontSize(8);
  doc.setLineWidth(0.3);
  doc.rect(10, 40, 190, 20);
  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("SEÑORES", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arraycabe.cliente, 85);
  doc.text(texto, 36, linea, "left");
  linea = linea + 4 * texto.length;
  //console.log(arraycabe);
  doc.setFont("Helvetica", "Bold");
  doc.text(arraycabe.tipoDocumento, 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(arraycabe.dni, 36, linea, "left");
  linea = linea + 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("DIRECCION", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arraycabe.direccion, 85);
  doc.text(texto, 36, linea, "left");
  linea = linea + 4 * texto.length;

  if (arraycabe.observacion.length < 100 && arraycabe.observacion != "") {
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arraycabe.observacion, 180);
    doc.text(texto, 36, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  if (arraycabe.placa_cliente != "") {
    doc.setFont("Helvetica", "Bold");
    doc.text("PLACA", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arraycabe.placa_cliente, 85);
    doc.text(texto, 36, linea, "left");
    linea = linea + 4 * texto.length;
  }

  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA EMISION", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fechaImpresion, 167, linea, "left");
  linea = linea + 4;

  if (arraycabe.vencimientoDoc.toString().length == 10) {
    doc.setFont("Helvetica", "Bold");
    doc.text("FECHA VENCIMIENTO", 130, linea, "left");
    doc.text(" : ", 164, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(fecha_vencimiento, 167, linea, "left");
    linea = linea + 4;
  }
  if (arraycabe.telefono != "") {
    doc.setFont("Helvetica", "Bold");
    doc.text("TELEFONO", 130, linea, "left");
    doc.text(" : ", 164, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(arraycabe.telefono, 167, linea, "left");
    linea = linea + 4;
  }

  doc.setFont("Helvetica", "Bold");
  doc.text("CONDICIONES", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(arraycabecera.forma_pago, 167, linea, "left");

  linea = 65;

  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    var obs = "";
    var tg = "";
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / TG: S/." + array[i].valor_total;
      array[i].precioedita = "0.00";
    }
    nuevoArray[i] = new Array(5);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre + tg;
    nuevoArray[i][2] = array[i].medida;
    nuevoArray[i][3] = array[i].precioedita;
    nuevoArray[i][4] =
      parseFloat(array[i].precioedita * array[i].cantidad).toFixed(2) + obs;
  }

  doc.autoTable({
    margin: { top: linea, left: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 20, halign: "center" },
      1: { columnWidth: 110, halign: "left" },
      2: { columnWidth: 20, halign: "center" },
      3: { columnWidth: 20, halign: "center" },
      4: { columnWidth: 20, halign: "center" },
    },
    theme: ["plain"],
    head: [["Cantidad", "Descripcion", "Medida", "P.Unitario", "P.Total"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 5;
  var lineaqr = linea;

  if (arraycabe.total_op_gratuitas > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    var texto = doc.splitTextToSize(
      "* Transferencia Gratuita y/o Servicio Prestado Gratuitamente",
      100
    );
    doc.text(texto, 10, lineaqr, "left");
    lineaqr = lineaqr + 3;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2)),
    100
  );
  doc.text(texto, 10, lineaqr, "left");
  lineaqr = lineaqr + 3;
  if (arraycabe.observacion.length >= 100) {
    linea = linea + 4;
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arraycabe.observacion, 95);
    doc.text(texto, 36, linea, "left");
  }
  let nextSection = 1;
  let currentSection;
  const remainingVSpace =
    doc.internal.pageSize.height - doc.lastAutoTable.finalY;
  if (remainingVSpace > 50) {
    nextSection = currentSection;
    linea = doc.lastAutoTable.finalY + 4;
    lineaqr = doc.lastAutoTable.finalY + 10;
  } else {
    linea = 10;
    lineaqr = 10;
    if (nextSection == 1) doc.addPage();
  }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(130, linea, 70, 25);

  linea = linea + 4;
  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  if (arraycabe.descuentos != 0) {
    doc.text("DESCUENTOS", 135, linea, "left");
    doc.text(" : ", 159, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text("S./" + arraycabe.descuentos, 190, linea, "right");
    linea = linea + 4;
  }
  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. GRAVADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text("S./" + arraycabe.total_op_gravadas, 190, linea, "right");
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. EXONERADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    "S./" + arraycabe.total_op_exoneradas.toString(),
    190,
    linea,
    "right"
  );
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. GRATUITAS", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    "S./" + arraycabe.total_op_gratuitas.toString(),
    190,
    linea,
    "right"
  );
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("IGV " + arraycabe.porcentaje_igv + "%", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text("S./" + arraycabe.igv, 190, linea, "right");
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("Total", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text("S./" + total.toString(), 190, linea, "right");
  linea = linea + 4;

  if (arraycabe.forma_pago == "Credito") {
    doc.autoTable({
      margin: { top: 10, left: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 35, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 35, halign: "center" },
        2: { columnWidth: 40, halign: "center" },
      },
      theme: ["plain"],
      head: [["CUOTA", "IMPORTE", "VENCE"]],
      body: cuotascredito(arraycabe.cuotas),
    });
    let finalY = doc.previousAutoTable.finalY;
    lineaqr = finalY + 3;
  }
  if (arraycabe.detraccion == "4% Transportes") {
    var lineaqr2 = lineaqr + 5;
    doc.setFontSize(7);
    doc.setFont("Helvetica", "bold");
    var detra = (total * 0.04).toFixed(2);
    var texto = doc.splitTextToSize(
      "Porcentaje de Detraccion: 4%  -  Monto de Detraccion: S/" +
        detra +
        "  -  Cuenta banco de la nacion: " +
        store.state.configuracion.cuenta_detra,
      80
    );
    doc.text(texto, 35, lineaqr2, "left");
  }

  if (qr != "") {
    if (arraycabe.tipocomprobante == "F" || arraycabe.tipocomprobante == "B") {
      doc.addImage(qr, "png", 10, lineaqr, 20, 20);
    }
    if (arraycabe.tipocomprobante != "T") {
      lineaqr = lineaqr + 14.5;
      doc.setFont("Helvetica", "");
      doc.setFontSize(7);
      var texto = doc.splitTextToSize(
        "Representación Impresa de la " +
          documento +
          " Consultar su validez en https://domo.pe/buscardocumentos",
        90
      );
      doc.text(texto, 35, lineaqr, "left");
    }
  }
  if (arraycabecera.forma_pago != "Credito") {
    var array_pago = arraycabe.modopago;
    linea = linea - 18;
    doc.text("MODO DE PAGO : ", 85, linea);
    linea = linea + 3;
    for (var i = 0; i < array_pago.length; i++) {
      var data = array_pago[i];
      if (Boolean(data.monto)) {
        doc.setFont("Helvetica", "");
        doc.setFontSize(7);
        doc.text(data.nombre, 85, linea);
        doc.text(
          "S/." + String(parseFloat(data.monto).toFixed(2)),
          118,
          linea,
          "right"
        );
        linea = linea + 3;
      }
    }
  }
  if (bancos != "") {
    lineaqr = lineaqr + 23;
    doc.setFont("Helvetica", "");
    doc.setFontSize(9);

    var texto = doc.splitTextToSize("Cuenta Empresa : ", 200);
    doc.text(texto, 10, lineaqr, "left");
    lineaqr = lineaqr + 3;
    doc.autoTable({
      startY: lineaqr,
      margin: { top: 10, left: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 0.5,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 50, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 25, halign: "center" },
        2: { columnWidth: 50, halign: "center" },
        3: { columnWidth: 50, halign: "center" },
      },
      theme: ["plain"],
      head: [["BANCO", "MONEDA", "CUENTA", "CCI"]],
      body: arraybancos(bancos),
    });
    let finalY = doc.previousAutoTable.finalY;
    lineaqr = finalY + 3;
  }
  //console.log(store.state.configImpresora.piepagina);
  if (store.state.configImpresora.piepagina != "") {
    doc.setFontSize(10);
    lineaqr = lineaqr + 15;
    doc.setFont("Helvetica", "bold");
    doc.text(store.state.configImpresora.piepagina, 100, lineaqr, "center");
  }

  linea = linea + 15;
  doc.text(".", 0, linea);

  switch (modo_genera) {
    case "abre":
      if (store.state.esmovil) {
        window.open(doc.output("bloburi"));
      } else {
        abre_dialogo_impresion(doc.output("bloburi"));
      }
      break;
    case "host":
      break;
    case "descarga":
      doc.save(
        arraycabe.serie + "-" + arraycabe.correlativoDocEmitido + ".pdf"
      );
      break;
  }
}

export const generaQR = (cabecera) => {
  var ruc = store.state.baseDatos.ruc;
  var fecha = moment.unix(cabecera.fecha).format("DD/MM/YYYY");
  var imgData = QR.drawImg(
    ruc +
      "|" +
      cabecera.cod_comprobante +
      "|" +
      cabecera.serie +
      "|" +
      cabecera.correlativoDocEmitido +
      "|" +
      cabecera.igv +
      "|" +
      cabecera.total +
      "|" +
      fecha +
      "|" +
      cabecera.cod_tipoDocumento +
      "|" +
      cabecera.dni +
      "|",
    {
      typeNumber: 4,
      errorCorrectLevel: "M",
      size: 500,
    }
  );
  return imgData;
};
function arraybancos(array) {
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].banco;
    nuevoArray[i][1] = array[i].moneda;
    nuevoArray[i][2] = array[i].cuenta;
    nuevoArray[i][3] = array[i].cci;
  }
  return nuevoArray;
}
function cuotascredito(array) {
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(3);
    nuevoArray[i][0] = array[i].numero;
    nuevoArray[i][1] = array[i].importe;
    nuevoArray[i][2] = array[i].vencimiento;
  }
  return nuevoArray;
}

export const pdfGenera_resumen = (arraydatos) => {
  var arraycabe = cabecera;
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Ruc = "Ruc: " + store.state.baseDatos.ruc;
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment.unix("").format("DD/MM/YYYY hh:mm a");
  var array = arraydatos;

  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var pdfInMM = 75; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var piepagina = store.state.configImpresora.piepagina;
  var telefono = store.state.configImpresora.telefono;
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  var texto = doc.splitTextToSize("CUENTA TOTAL", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3.5;

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 7;
  doc.text(separacion, pageCenter, linea, "center");

  //-----------------productos-----------------------
  var total = 0;
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    total = total + parseFloat(array[i].precioedita * array[i].cantidad);

    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre;
    nuevoArray[i][2] = parseFloat(array[i].precioedita).toFixed(2);
    nuevoArray[i][3] = parseFloat(
      array[i].precioedita * array[i].cantidad
    ).toFixed(2);
  }

  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: {
      fontSize: 7.5,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 8, halign: "center" },
      1: { columnWidth: 35, halign: "left" },
      2: { columnWidth: 12, halign: "right" },
      3: { columnWidth: 12, halign: "right" },
    },
    theme: ["plain"],
    head: [["Cant", "Descripcion", "P.U", "P.T"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  doc.text("Total", lMargin, linea);
  doc.text("S./" + parseFloat(total).toFixed(2), 68, linea, "right");
  linea = linea + 3.5;

  if (store.state.esmovil) {
    window.open(doc.output("bloburi"));
  } else {
    abre_dialogo_impresion(doc.output("bloburi"));
  }
};
