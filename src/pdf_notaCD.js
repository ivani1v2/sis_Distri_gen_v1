import jspdf from 'jspdf'
import 'jspdf-autotable'
import store from '@/store/index'
import QR from 'qrcode-base64'
import moment from 'moment'
import { NumerosALetras } from 'numero-a-letras'

export const pdfGenera = (arraydatos, cabecera, medida) => {
  if (cabecera.cliente == undefined) {
    cabecera.cliente = ''
  }
  if (cabecera.dni == undefined) {
    cabecera.dni = ''
  }
  if (cabecera.direccion == undefined) {
    cabecera.direccion = ''
  }

  var qrs = generaQR(cabecera)
  console.log(medida)
  switch (medida) {
    case 'A4':
      impresionA4(arraydatos, qrs, cabecera)
      break;
    case '80':
      pdfGeneraFinal(arraydatos, qrs, cabecera)
      break;
    case '58':
      pdfGeneraFinal(arraydatos, qrs, cabecera)
      break;
  }
}

export const pdfGeneraFinal = (arraydatos, qr, cabecera) => {
  console.log(arraydatos)
  var arraycabe = cabecera
  var linea = parseInt(store.state.configImpresora.msuperior)
  var Direccion = store.state.baseDatos.direccion + '-' + store.state.baseDatos.distrito + '-' + store.state.baseDatos.provincia + '-' + store.state.baseDatos.departamento
  var imagen = store.state.logoempresa
  var separacion = "-------------------------------------------------------------------------------------------------------------------"
  var fechaImpresion = moment.unix(cabecera.fecha).format('DD/MM/YYYY hh:mm a')
  var array = arraydatos
  var total = cabecera.total - cabecera.descuentos
  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento
  var lMargin = store.state.configImpresora.mizquierdo; //left margin in mm
  var rMargin = store.state.configImpresora.mderecho; //right margin in mm
  var pdfInMM = 72;  // width of A4 in mm
  var pageCenter = pdfInMM / 2;
  var moneda = arraycabe.moneda || 'S/';
  var tiponota = "TIPO DE NOTA: " + arraycabe.motivo
  var modificaDOc = "MODIFICA: " + arraycabe.serie_comp_ref + '-' + arraycabe.correlativo_comp_ref

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [500, pdfInMM]
  })

  doc.text('.', 0, linea)
  linea = linea + 3

  if (imagen != '') {
    doc.addImage("data:image/png;base64," + imagen, 'png', (pdfInMM / 2) - 20, linea, 40, 40);
    linea = linea + parseInt(store.state.configImpresora.minferior) /// modificar margenes de logo
  }
  doc.setFontSize(8)
  doc.setFont('Helvetica', 'Bold');
  var texto = doc.splitTextToSize(store.state.baseDatos.name, (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center'); //EMPRESA

  linea = linea + (4 * texto.length)

  doc.setFont('Helvetica', '');
  doc.setFontSize(8)
  var texto = doc.splitTextToSize('Ruc: ' + store.state.baseDatos.ruc + '\n' + Direccion
    , (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center'); //RUC


  linea = linea + (3.5 * texto.length)


  if (store.state.configImpresora.cabecera != '') {
    linea = linea + 2
    var texto = doc.splitTextToSize(store.state.configImpresora.cabecera, (pdfInMM - lMargin - rMargin));
    doc.text(texto, pageCenter, linea, 'center'); //cabecera
    linea = linea + (3.5 * texto.length)
  }
  if (store.state.configImpresora.telefono != '') {
    linea = linea + 1
    var texto = doc.splitTextToSize("Telf: " + store.state.configImpresora.telefono, (pdfInMM - lMargin - rMargin));
    doc.text(texto, pageCenter, linea, 'center'); //cabecera
    linea = linea + (3.5 * texto.length)
  }

  doc.setFont('Helvetica', 'bold');
  doc.text(separacion, pageCenter, linea, 'center');
  linea = linea + 5
  var texto = doc.splitTextToSize('NOTA DE CREDITO ELECTRONICA', (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + 3
  doc.setFont('Helvetica', '');
  var texto = doc.splitTextToSize(arraycabe.serie + "-" + arraycabe.correlativo, (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + 5

  var texto = doc.splitTextToSize("EMISION: " + fechaImpresion, (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + 5

  /*--------------datos cliente--------------------*/
  var texto = doc.splitTextToSize(tiponota, (pdfInMM - lMargin - rMargin));
  doc.text(texto, lMargin, linea, 'left');
  linea = linea + (3.5 * texto.length)

  var texto = doc.splitTextToSize(modificaDOc, (pdfInMM - lMargin - rMargin));
  doc.text(texto, lMargin, linea, 'left');
  linea = linea + (3.5 * texto.length)

  if (arraycabe.cliente != "") {
    var texto = doc.splitTextToSize('Nombre   : ' + arraycabe.cliente, (pdfInMM - lMargin - rMargin));
    doc.text(texto, lMargin, linea, 'left');
    linea = linea + (3.5 * texto.length)

  }
  if (arraycabe.dni != "") {
    var texto = doc.splitTextToSize('Documento: ' + arraycabe.dni, (pdfInMM - lMargin - rMargin));
    doc.text(texto, lMargin, linea, 'left');
    linea = linea + (3.5 * texto.length)
  }
  if (arraycabe.direccion != "") {
    var texto = doc.splitTextToSize('Direccion: ' + arraycabe.direccion, (pdfInMM - lMargin - rMargin));
    doc.text(texto, lMargin, linea, 'left');

    linea = linea + (3.5 * texto.length)
  }

  doc.setFont('Helvetica', 'bold');
  doc.text(separacion, pageCenter, linea, 'center');
  linea = linea + 7
  doc.text(separacion, pageCenter, linea, 'center');
  //-----------------productos-----------------------

  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    console.log(array[i])
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre;
    nuevoArray[i][2] = array[i].precioedita;
    nuevoArray[i][3] = parseFloat((array[i].precioedita) * array[i].cantidad).toFixed(2);
  }


  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: { fontSize: 7.5, cellPadding: 0.1, valign: 'middle', halign: 'center' },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 8, halign: 'center' },
      1: { columnWidth: 40, halign: 'left', },
      2: { columnWidth: 12, halign: 'center' },
      3: { columnWidth: 12, halign: 'center' },
    },
    theme: ['plain'],
    head: [['Ca', 'Descripcion', 'P.U', 'P.T']],
    body: nuevoArray
  })


  let finalY = doc.previousAutoTable.finalY
  linea = finalY + 3

  //-------------------------------------------------------
  doc.setFont('Helvetica', 'bold');
  doc.text(separacion, pageCenter, linea, 'center');
  linea = linea + 4
  doc.setFont('Helvetica', '');



  doc.text("OP. GRAVADA", lMargin, linea)
  doc.text(moneda + arraycabe.total_op_gravadas, 68, linea, 'right')
  linea = linea + 3.5
  if (arraycabe.total_op_exoneradas > 0) {
    doc.text("OP. EXONERADA", lMargin, linea)
    doc.text(moneda + (arraycabe.total_op_exoneradas).toString(), 68, linea, 'right')
    linea = linea + 3.5
  }
  doc.text("IGV " + arraycabe.porcentaje_igv + '%', lMargin, linea)
  doc.text(moneda + arraycabe.igv, 68, linea, 'right')
  linea = linea + 3.5


  doc.text("Total", lMargin, linea)
  doc.text(moneda + total, 68, linea, 'right')
  linea = linea + 3

  doc.setFont('Helvetica', 'bold');
  doc.text(separacion, pageCenter, linea, 'center');
  linea = linea + 3

  doc.setFont('Helvetica', '');
  doc.setFontSize(8)
  var texto = doc.splitTextToSize("Son: " + NumerosALetras(parseFloat(total).toFixed(store.state.configuracion.decimal), moneda), (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + (3.5 * texto.length)

  var texto = doc.splitTextToSize("Representación Impresa de la NOTA DE CREDITO ELECTRONICA" +
    " Consultar su validez en http://https://domo.pe/buscardocumentos", (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + (3 * texto.length)

  doc.addImage(qr, 'png', (pdfInMM / 2) - 10, linea, 18, 18);
  linea = linea + 14

  linea = linea + parseFloat(store.state.configImpresora.minferiorgeneral)

  doc.text('.', 0, linea)

  abre_dialogo_impresion(doc.output('bloburi'))

  //doc.output('dataurlnewwindow');
  // 

}
function generaQR(cabecera) {
  var ruc = store.state.baseDatos.ruc
  var fecha = moment.unix(cabecera.fecha).format('DD/MM/YYYY')
  var imgData = QR.drawImg(ruc + '|' + cabecera.cod_comprobante + '|' + cabecera.serie + '|' + cabecera.correlativoDocEmitido + '|' + cabecera.igv + '|' +
    cabecera.total + '|' + fecha + '|' + cabecera.cod_tipoDocumento + '|' + cabecera.dni + '|', {
    typeNumber: 4,
    errorCorrectLevel: 'M',
    size: 500
  })
  return imgData
}

function impresionA4(arraydatos, qr, arraycabecera) {
  var arraycabe = arraycabecera
  var linea = parseInt(store.state.configImpresora.msuperior)
  var nombreEmpresa = store.state.baseDatos.name
  var imagen = store.state.logoempresa
  var Direccion = store.state.baseDatos.direccion + ' - ' + store.state.baseDatos.distrito + ' - ' + store.state.baseDatos.provincia + ' - ' + store.state.baseDatos.departamento
  var fechaImpresion = moment.unix(arraycabecera.fecha).format('DD/MM/YYYY hh:mm a')
  var array = arraydatos
  var total = arraycabe.total
  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento
  var pdfInMM = 210;  // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;
  var moneda = arraycabe.moneda || 'S/';
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM]
  })

  doc.text('.', -1, linea)
  linea = linea + 3


  if (imagen != '') {
    doc.rect(10, 10, 30, 30);
    doc.addImage("data:image/png;base64," + imagen, 'png', 12, 12, 26, 26);
    linea = linea + 15

    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(9.5)
    var texto = doc.splitTextToSize(nombreEmpresa, 80);
    doc.text(texto, 55, linea, 'left'); //EMPRESA

    linea = linea + (4 * texto.length)

    if (cabecera != '') {
      doc.setFont('Helvetica', '');
      doc.setFontSize(8)
      var texto = doc.splitTextToSize(cabecera, 70);
      doc.text(texto, 55, linea, 'left'); //CABECERA
      linea = linea + (4 * texto.length)
    }

    doc.setFont('Helvetica', '');
    doc.setFontSize(8)
    var texto = doc.splitTextToSize(Direccion, 70);
    doc.text(texto, 55, linea, 'left'); //direccion

    linea = linea + (4 * texto.length)
    if (telefono != '') {
      doc.setFont('Helvetica', '');
      doc.setFontSize(8)
      var texto = doc.splitTextToSize("TELEFONO: " + telefono, 70);
      doc.text(texto, 55, linea, 'left'); //TELEFONO EMPRESA
    }
  } else {
    linea = linea + 15
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(15)
    var texto = doc.splitTextToSize(nombreEmpresa, 100);
    doc.text(texto, 10, linea, 'left'); //EMPRESA

    linea = linea + (5 * texto.length)

    if (cabecera != '') {
      doc.setFont('Helvetica', '');
      doc.setFontSize(10)
      var texto = doc.splitTextToSize(cabecera, 120);
      doc.text(texto, 10, linea, 'left'); //CABECERA
      linea = linea + (4 * texto.length)
    }

    doc.setFont('Helvetica', '');
    doc.setFontSize(8)
    var texto = doc.splitTextToSize(Direccion, 120);
    doc.text(texto, 10, linea, 'left'); //direccion

    linea = linea + (4 * texto.length)
    if (telefono != '') {
      doc.setFont('Helvetica', '');
      doc.setFontSize(8)
      var texto = doc.splitTextToSize("TELEFONO: " + telefono, 70);
      doc.text(texto, 10, linea, 'left'); //TELEFONO EMPRESA
    }
  }
  doc.setLineWidth(0.7);
  doc.rect(140, 10, 60, 25);

  doc.setFontSize(11)
  doc.setFont('Helvetica', 'Bold');
  var texto = doc.splitTextToSize('Ruc: ' + store.state.baseDatos.ruc, 50);
  doc.text(texto, 170, 18, 'center');
  doc.setFontSize(8)
  var texto = doc.splitTextToSize('NOTA DE CREDITO ELECTRONICA', 50);
  doc.text(texto, 170, 22, 'center');
  doc.setFontSize(10)
  console.log(arraycabe)
  var texto = doc.splitTextToSize(arraycabe.serie + "-" + arraycabe.correlativo, 50);
  doc.text(texto, 170, 26, 'center');


  doc.setFontSize(8)
  doc.setLineWidth(0.3);
  doc.rect(10, 40, 190, 20);
  linea = 45
  if (arraycabe.cliente != '') {

    doc.setFont('Helvetica', 'Bold');
    doc.text("SEÑORES", 15, linea, 'left');
    doc.text(" : ", 32, linea, 'left');
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize(arraycabe.cliente, 85);
    doc.text(texto, 36, linea, 'left');
    linea = linea + (4 * texto.length)

    doc.setFont('Helvetica', 'Bold');
    doc.text("RUC", 15, linea, 'left');
    doc.text(" : ", 32, linea, 'left');
    doc.setFont('Helvetica', '');
    doc.text(arraycabe.dni, 36, linea, 'left');
    linea = linea + 4

    doc.setFont('Helvetica', 'Bold');
    doc.text("DIRECCION", 15, linea, 'left');
    doc.text(" : ", 32, linea, 'left');
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize(arraycabe.direccion, 85);
    doc.text(texto, 36, linea, 'left');
    linea = linea + (4 * texto.length)

  } else {
    doc.setFont('Helvetica', 'Bold');
    doc.text("MOTIVO", 15, linea, 'left');
    doc.text(" : ", 32, linea, 'left');
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize(arraycabe.motivo, 85);
    doc.text(texto, 36, linea, 'left');
    linea = linea + (4 * texto.length)
  }
  linea = 45

  doc.setFont('Helvetica', 'Bold');
  doc.text("FECHA EMISION", 130, linea, 'left');
  doc.text(" : ", 154, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(fechaImpresion, 157, linea, 'left');
  linea = linea + 4

  doc.setFont('Helvetica', 'Bold');
  doc.text("MODIFICA", 130, linea, 'left');
  doc.text(" : ", 154, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(arraycabe.serie_comp_ref + '-' + arraycabe.correlativo_comp_ref, 157, linea, 'left');
  linea = linea + 4
  if (arraycabe.cliente != '') {
    doc.setFont('Helvetica', 'Bold');
    doc.text("MOTIVO", 130, linea, 'left');
    doc.text(" : ", 154, linea, 'left');
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize(arraycabe.motivo, 40);
    doc.text(texto, 157, linea, 'left');
    linea = linea + (4 * texto.length)
  }

  linea = 65
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre.trim();
    nuevoArray[i][2] = array[i].medida;
    nuevoArray[i][3] = array[i].precioedita;
    nuevoArray[i][4] = parseFloat((array[i].precioedita) * array[i].cantidad).toFixed(store.state.configuracion.decimal);
  }

  doc.autoTable({
    margin: { top: linea, left: 10 },
    didDrawPage: function (data) {
      data.settings.margin.top = 10;
    },
    styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'center', lineWidth: 0.2, lineColor: 1 },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 20, halign: 'center' },
      1: { columnWidth: 110, halign: 'left', },
      2: { columnWidth: 20, halign: 'center', },
      3: { columnWidth: 20, halign: 'center' },
      4: { columnWidth: 20, halign: 'center' },
    },
    theme: ['plain'],
    head: [['Cantidad', 'Descripcion', 'MEDIDA', 'P.Unitario', 'P.Total']],
    body: nuevoArray
  })

  let finalY = doc.previousAutoTable.finalY
  if (finalY > 270) {
    doc.addPage()
    linea = 10
  } else {
    linea = finalY + 5
  }

  var lineaqr = linea

  doc.setFont('Helvetica', '');
  doc.setFontSize(8)
  var texto = doc.splitTextToSize("Son: " + NumerosALetras(parseFloat(total).toFixed(store.state.configuracion.decimal), moneda), 100);
  doc.text(texto, 10, lineaqr, 'left');
  lineaqr = lineaqr + 3

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(130, linea, 70, 22);

  linea = linea + 4

  doc.setFontSize(8)
  doc.setFont('Helvetica', 'Bold');
  doc.text("OP. GRAVADA", 135, linea, 'left');
  doc.text(" : ", 159, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(moneda + arraycabe.total_op_gravadas, 172, linea, 'left');
  linea = linea + 4

  doc.setFontSize(8)
  doc.setFont('Helvetica', 'Bold');
  doc.text("OP. EXONERADA", 135, linea, 'left');
  doc.text(" : ", 159, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(moneda + (arraycabe.total_op_exoneradas).toString(), 172, linea, 'left');
  linea = linea + 4

  doc.setFontSize(8)
  doc.setFont('Helvetica', 'Bold');
  doc.text("IGV " + arraycabe.porcentaje_igv + '%', 135, linea, 'left');
  doc.text(" : ", 159, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(moneda + arraycabe.igv, 172, linea, 'left');
  linea = linea + 4

  doc.setFontSize(8)
  doc.setFont('Helvetica', 'Bold');
  doc.text("Total", 135, linea, 'left');
  doc.text(" : ", 159, linea, 'left');
  doc.setFont('Helvetica', '');
  doc.text(moneda + total, 172, linea, 'left');
  linea = linea + 4

  doc.addImage(qr, 'png', 10, lineaqr, 20, 20);
  lineaqr = lineaqr + 10

  doc.setFont('Helvetica', '');
  doc.setFontSize(7)
  var texto = doc.splitTextToSize("Representación Impresa de la NOTA DE CREDITO ELECTRONICA" +
    " Consultar su validez en http://https://domo.pe/buscardocumentos", 90);
  doc.text(texto, 35, lineaqr, 'left');

  linea = linea + 15
  doc.text('.', 0, linea)

  abre_dialogo_impresion(doc.output('bloburi'))

}



function abre_dialogo_impresion(blob) {
  var Ancho = screen.width;
  var Alto = screen.height;
  var A = Ancho * 50 / 100;
  var H = Alto * 50 / 100;
  var difA = Ancho - A;
  var difH = Alto - H;
  var tope = difH / 2;
  var lado = difA / 2;
  var Opciones = "status=no, menubar=no, directories=no, location=no, toolbar=no, scrollbars=yes, resizable=no, width=" + A + ", height=" + H + ", top=" + tope + ", left=" + lado + "";
  var w = window.open(blob, "_blank", Opciones)
  w.print();
}
