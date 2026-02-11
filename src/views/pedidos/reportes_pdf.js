import jspdf from 'jspdf'
import 'jspdf-autotable'
import store from '@/store/index'
import { consultaArchivo } from '../../db'
import QR from 'qrcode-base64'
import moment from 'moment'

export const reporte_almacen = async (cabecera, peso, arraydatos, observacion, formato = "F1") => {
  const array = arraydatos || []
  let linea = 10
  const fechaImpresion = moment(String(new Date)).format('DD/MM/YYYY hh:mm a')
  const lMargin = store.state.configImpresora.lMargin
  const rMargin = store.state.configImpresora.rMargin
  const pdfInMM = 210

  const doc = new jspdf({
    orientation: 'portrait',
    unit: 'mm',
    format: [297, pdfInMM],
  })

  doc.setFontSize(10)
  doc.setFont('Helvetica', '')

  linea += 13

  const nuevoArray = []
  let totalCajas = 0
  let totalUnd = 0

  for (let i = 0; i < array.length; i++) {
    const invet = store.state.productos.find(
      (id) => String(id.id) === String(array[i].id)
    )
    const valor = await convierte_stock(array[i].cantidad, invet?.factor || 1)

    const cajas = Number(valor?.entero || 0)
    const und = Number(valor?.und || 0)

    totalCajas += cajas
    totalUnd += und

    const peso = array[i].peso

    if (formato === 'F1') {
      // F1: CODIGO - DESCRIPCION - MEDIDA - CAJAS - UND - PESO
      nuevoArray.push([
        array[i].id,
        array[i].nombre,
        array[i].medida,
        cajas,
        und,
        peso,
      ])
    } else {
      // F2: CAJAS/UND - MEDIDA - DESCRIPCION - PESO
      let cajasUndStr = ''

      if (und === 0) {
        // Solo cajas
        cajasUndStr = String(cajas)
      } else if (cajas === 0) {
        // Solo unidades
        cajasUndStr = `0/${und}`
      } else {
        // Cajas y unidades
        cajasUndStr = `${cajas}/${und}`
      }

      nuevoArray.push([
        cajasUndStr,         // Columna combinada Cajas / Und
        array[i].medida,     // Medida
        array[i].nombre,     // Descripción
        peso,                // Peso
      ])
    }
  }

  const esF1 = formato === 'F1'

  doc.autoTable({
    margin: { top: linea, left: 5 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: 'middle',
      halign: 'center',
      lineWidth: 0.2,
      lineColor: 1
    },
    headStyles: {
      lineWidth: 0.2,
      lineColor: 1,
      fillColor: [1, 0, 0]
    },
    columnStyles: esF1
      ? {
        0: { columnWidth: 15, halign: 'center', fontStyle: 'bold' }, // CODIGO
        1: { columnWidth: 115, halign: 'left' },                     // DESCRIPCION
        2: { columnWidth: 20, halign: 'center' },                    // MEDIDA
        3: { columnWidth: 12, halign: 'center' },                    // CAJAS
        4: { columnWidth: 12, halign: 'center' },                    // UND
        5: { columnWidth: 20, halign: 'center' },                    // PESO
      }
      : {
        0: { columnWidth: 15, halign: 'center' },                    // CAJAS/UND
        1: { columnWidth: 25, halign: 'center' },                    // MEDIDA
        2: { columnWidth: 130, halign: 'left' },                     // DESCRIPCION
        3: { columnWidth: 25, halign: 'center' },                    // PESO
      },
    head: esF1
      ? [['Codigo', 'Descripcion', 'Medida', 'Cajas', 'Und', 'Peso(KG)']]
      : [['Caj/Und', 'Medida', 'Descripcion', 'Peso(KG)']],
    body: nuevoArray,
  })

  // Header + paginación por página
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber

    doc.setFontSize(14)
    doc.setFont('Helvetica', '')
    let texto = doc.splitTextToSize('RP. N° ' + cabecera, pdfInMM - lMargin - rMargin)
    doc.text(texto, 10, 10, 'left')

    doc.setFontSize(10)
    doc.setFont('Helvetica', '')
    texto = doc.splitTextToSize('Fecha Impresion: ' + fechaImpresion, pdfInMM - lMargin - rMargin)
    doc.text(texto, 10, 15, 'left')

    doc.setFontSize(10)
    doc.setFont('Helvetica', '')
    texto = doc.splitTextToSize('Observacion: ' + observacion, pdfInMM - lMargin - rMargin)
    doc.text(texto, 10, 20, 'left')

    doc.setFontSize(14)
    doc.setFont('Helvetica', 'Bold')
    texto = doc.splitTextToSize('TOTAL KG : ' + peso, pdfInMM - lMargin - rMargin)
    doc.text(texto, 140, 10, 'left')

    doc.setFontSize(10)
    doc.setFont('Helvetica', '')
    doc.text(170, 290, 'PAG :' + pageCurrent + '/' + pageCount)
  }

  // Totales al final
  const finalY = doc.previousAutoTable.finalY || 0
  const yTotales = finalY + 6

  doc.setPage(pageCount)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTALES:', 10, yTotales)
  doc.setFont('Helvetica', '')
  doc.setFontSize(10)
  doc.text(`Cajas: ${totalCajas}`, 35, yTotales)
  doc.text(`Und: ${totalUnd}`, 65, yTotales)

  window.open(doc.output('bloburl'))
}

export const reporte_transporte = (data) => {
  var linea = parseInt(10)
  var nombreEmpresa = store.state.baseDatos.name
  var Ruc = 'Ruc: ' + store.state.baseDatos.ruc
  var fechaImpresion = moment(String(new Date)).format('DD/MM/YYYY hh:mm a')
  var lMargin = 15; //left margin in mm
  var rMargin = 15; //right margin in mm
  var pdfInMM = 210;  // width of A5 in mm
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [210, 297]
  })
  doc.addPage();

  doc.text('.', -1, linea)
  linea = linea + 5
  /*
    doc.setFontSize(14)
    doc.setFont('Helvetica', 'Bold');
    var texto = doc.splitTextToSize("REPARTO N° " + data[0][1].id_grupo, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, linea, 'left'); //EMPRESA
    linea = linea + 5
  
    doc.setFontSize(10)
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize('Fecha Impresion: ' + fechaImpresion, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, linea, 'left');
    linea = linea + 3
  
    var texto = doc.splitTextToSize('CONTADO: S/.' + data[0][2].contado, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 100, 10, 'left');
  
     
    var texto = doc.splitTextToSize('CREDITO: S/.' + data[0][2].credito, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 100, 14, 'left');
  
    var texto = doc.splitTextToSize('MONTO TOTAL: S/.' + data[0][2].total, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 150, 10, 'left');
  
    var texto = doc.splitTextToSize('PESO TOTAL(KG): ' + data[0][2].peso, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 150, 14, 'left');
   */

  doc.setFontSize(8)
  // overall margin
  const margin = {
    left: 10,
    right: 10,
    top: 30,
    bottom: 20,
  };

  const tablesCount = data.length;
  // number of table sections in the page
  const sections = 1;
  // space between each section
  const spacing = 5;

  // calculate each section width
  const printWidht = doc.internal.pageSize.width - (margin.left + margin.right);
  const sectionWidth = (printWidht - ((sections - 1) * spacing)) / sections;

  // add an initial empty page that will be delete later,
  // it is needed for the first setPage(previous_page) call


  let currentSection;
  let nextSection = 1;
  let startY = linea + 10;
  var sumatotal = 0
  for (var i = 0; i < tablesCount; i++) {
    sumatotal = sumatotal + parseFloat(data[i][2])
  }

  //var texto =doc.splitTextToSize("TOTAL GENERAL: S/."+ sumatotal.toFixed(2), (pdfInMM-lMargin-rMargin));
  //  doc.text(texto,pageCenter,startY,'center');

  startY = startY + 10

  for (let i = 0; i < tablesCount; i++) {


    var texto = doc.splitTextToSize(data[i][1].dni + ' - ' + data[i][1].cliente + ' / DIRECCION: ' + data[i][1].direccion, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, startY, 'left');
    startY = startY + (3.5 * texto.length)

    if (data[i][3] != '') {
      //console.log(data[i][3])
      var arr = data[i][3]
      for (let e = 0; e < arr.length; e++) {

        var texto = doc.splitTextToSize('DEUDA: ' + arr[e].doc_ref + ' / Fecha: ' + moment.unix(arr[e].fecha).format('DD/MM/YY') + ' / Total: ' + arr[e].monto_total + ' / Saldo: ' + arr[e].monto_pendiente, (pdfInMM - lMargin - rMargin));
        doc.setTextColor(255, 45, 0);
        doc.text(texto, 10, startY, 'left');
        startY = startY + (3.5 * texto.length)
      }

    }
    doc.setTextColor(0, 0, 0);
    var texto = doc.splitTextToSize('Vendedor: ' + data[i][1].vendedor + ' / Documento: ' + data[i][1].serie + '-' + data[i][1].correlativoDocEmitido, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, startY, 'left');

    var texto = doc.splitTextToSize('Forma Pago:  ' + data[i][1].forma_pago + ' / Total: S/.' + data[i][1].total, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 135, startY, 'left');
    startY = startY + 1



    doc.autoTable({
      theme: ['grid'],
      styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'left', lineWidth: 0.1, lineColor: 1 },
      body: createRows(data[i][0]),
      tableWidth: sectionWidth,
      columnStyles: {
        0: { columnWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { columnWidth: 90, halign: 'left', },
        2: { columnWidth: 15, halign: 'center' },
        3: { columnWidth: 15, halign: 'center' },
        4: { columnWidth: 20, halign: 'center' },
        5: { columnWidth: 20, halign: 'center' },
        6: { columnWidth: 20, halign: 'center' },
      },
      margin: {
        left: margin.left + ((nextSection - 1) * (sectionWidth + spacing)),
        top: margin.top,
        bottom: margin.bottom,
      },
      startY,
      rowPageBreak: 'avoid', // avoid breaking rows into multiple sections
      didDrawPage({ table, pageNumber, pageCount }) {
        currentSection = nextSection;
        nextSection = (nextSection % sections) + 1;

        // set left margin which will controll x position of next section
        const shift = (nextSection - 1) * (sectionWidth + spacing)
        table.settings.margin.left = margin.left + shift;

        // if next section is not the fist, move to previous page so when
        // autoTable calls addPage() it will still be the same current page
        if (nextSection > 1) {
          doc.setPage(doc.internal.getNumberOfPages() - 1);
        }
      }
    });

    // activate last page for further printing
    doc.setPage(doc.internal.getNumberOfPages());

    // if there's remaining vertical space in page: start printing next table from the current section
    const remainingVSpace = doc.internal.pageSize.height - margin.bottom - doc.lastAutoTable.finalY;
    if (remainingVSpace > 25) {
      nextSection = currentSection;
      startY = doc.lastAutoTable.finalY + 4;
    } else {
      startY = margin.top;
      if (nextSection == 1) doc.addPage();
    }
  }


  let finalY = doc.previousAutoTable.finalY
  linea = finalY + 5
  var pageCount = doc.internal.getNumberOfPages()
  for (i = 0; i < pageCount; i++) {
    doc.setPage(i)
    let pageCurrent = doc.internal.getCurrentPageInfo().pageNumber
    doc.setFontSize(13)
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize("REPARTO N° " + data[0][2].id_grupo, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, 8, 'left'); //EMPRESA

    doc.setFontSize(9)
    doc.setFont('Helvetica', '');
    var texto = doc.splitTextToSize('Fecha Impresion: ' + fechaImpresion, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, 13, 'left');

    var texto = doc.splitTextToSize('CONTADO: S/.' + data[0][2].contado, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 100, 12, 'left');

    var texto = doc.splitTextToSize('CREDITO: S/.' + data[0][2].credito, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 100, 16, 'left');

    var texto = doc.splitTextToSize('MONTO TOTAL: S/.' + data[0][2].total, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 150, 12, 'left');

    var texto = doc.splitTextToSize('PESO TOTAL(KG): ' + data[0][2].peso, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 150, 16, 'left');

    doc.autoTable({
      startY: 20,
      margin: { top: 1, left: 10 },
      styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'center', lineWidth: 0.1, lineColor: 255 },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 15, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        1: { columnWidth: 90, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        2: { columnWidth: 15, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        3: { columnWidth: 15, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        4: { columnWidth: 20, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        5: { columnWidth: 20, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        6: { columnWidth: 20, halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      },

      body: [['COD', 'DESCRIPCION', 'TG', 'CANT', 'MEDIDA', 'P.Unit.', 'Total']],

    })
    doc.line(0, 18, pdfInMM, 18)

    doc.setFontSize(10)
    doc.setFont('Helvetica', '');
    doc.text(170, 290, 'PAG :' + (pageCurrent - 1) + '/' + (pageCount - 1));

  }
  // delete unused empty page
  doc.deletePage(1);
  // reporte(doc.output('blob'))
  window.open(doc.output('bloburl'))
}
function reporte(data) {
  var ip = store.state.configImpresora.ip_cocina
  var reader = new FileReader();

  reader.readAsDataURL(data);
  reader.onloadend = function () {
    var base64data = reader.result;
    //console.log(base64data)
  }

}

function createRows(count) {
  var datos = count
  var nuevoArray = new Array(datos.length);
  for (var i = 0; i < datos.length; i++) {
    var tg = ''
    if (datos[i].tg) {
      tg = 'X'
    }
    nuevoArray[i] = new Array(6);
    nuevoArray[i][0] = datos[i].id;
    nuevoArray[i][1] = datos[i].nombre;
    nuevoArray[i][2] = tg;
    nuevoArray[i][3] = datos[i].cantidad;
    nuevoArray[i][4] = datos[i].medida;
    nuevoArray[i][5] = (datos[i].precio).toFixed(2);
    nuevoArray[i][6] = (parseFloat(datos[i].precio) * parseFloat(datos[i].cantidad)).toFixed(2);
  }
  return nuevoArray;
}
async function convierte_stock(stock, factor) {
  var cajas = Math.floor(stock / factor)
  var und = stock - cajas * factor
  var regresa = {
    entero: cajas,
    und: und
  }
  return regresa
}
export const reporte_kardex_valor = (data, periodo, array_final) => {
  var linea = 5
  var nombreEmpresa = store.state.baseDatos.name
  var Ruc = 'Ruc: ' + store.state.baseDatos.ruc
  var fechaImpresion = moment(String(new Date)).format('DD/MM/YYYY hh:mm a')
  var lMargin = 15; //left margin in mm
  var rMargin = 15; //right margin in mm
  var pdfInMM = 210;  // width of A5 in mm
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "landscape",
    unit: "mm",
    format: [210, 297]
  })
  doc.addPage();

  doc.text('.', -1, linea)
  linea = linea + 5

  doc.setFontSize(10)
  doc.setFont('Helvetica', '');
  var texto = doc.splitTextToSize(nombreEmpresa, (pdfInMM - lMargin - rMargin));
  doc.text(texto, 10, linea, 'left'); //EMPRESA
  linea = linea + 5

  var texto = doc.splitTextToSize(Ruc, (pdfInMM - lMargin - rMargin));
  doc.text(texto, 10, linea, 'left'); //EMPRESA
  linea = linea + 3

  var texto = doc.splitTextToSize('Fecha Impresion: ' + fechaImpresion, (pdfInMM - lMargin - rMargin));
  doc.text(texto, 230, 10, 'left');
  linea = linea + 3

  var texto = doc.splitTextToSize('PERIODO : ' + periodo, (pdfInMM - lMargin - rMargin));
  doc.text(texto, 230, 14, 'left');
  linea = linea + 3

  var texto = doc.splitTextToSize('REGISTRO DE INVENTARIO PERMANENTE VALORIZADO', (pdfInMM - lMargin - rMargin));
  doc.text(texto, 95, 12, 'left');
  linea = linea + 3

  var texto = doc.splitTextToSize('METODO DE VALUACION: PROMEDIO', (pdfInMM - lMargin - rMargin));
  doc.text(texto, 107, 16, 'left');
  linea = linea + 3

  doc.setFontSize(8)
  // overall margin
  const margin = {
    left: 10,
    right: 10,
    top: 30,
    bottom: 20,
  };

  const tablesCount = data.length;
  // number of table sections in the page
  const sections = 1;
  // space between each section
  const spacing = 5;

  // calculate each section width
  const printWidht = doc.internal.pageSize.width - (margin.left + margin.right);
  const sectionWidth = (printWidht - ((sections - 1) * spacing)) / sections;

  // add an initial empty page that will be delete later,
  // it is needed for the first setPage(previous_page) call


  let currentSection;
  let nextSection = 1;
  let startY = linea;


  startY = startY + 14

  for (let i = 0; i < tablesCount; i++) {

    var texto = doc.splitTextToSize("PRODUCTO: " + data[i].item.id + "-" + data[i].item.nombre + 'TIPO: 01 - MERCADERIA // UNIDAD DE MEDIDA: 07 - UNIDADES', (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, startY, 'left');
    startY = startY + (3.5 * texto.length)
    /*var texto = doc.splitTextToSize('Vendedor: ' + data[i][1].vendedor + ' / Documento: ' + data[i][1].serie + '-' + data[i][1].correlativoDocEmitido, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 10, startY, 'left');

    var texto = doc.splitTextToSize('Forma Pago:  ' + data[i][1].forma_pago + ' / Total: S/.' + data[i][1].total, (pdfInMM - lMargin - rMargin));
    doc.text(texto, 135, startY, 'left');
    startY = startY + 1*/



    doc.autoTable({
      theme: ['grid'],
      styles: { fontSize: 8, cellPadding: 0.1, valign: 'middle', halign: 'left', lineWidth: 0, lineColor: 0 },
      body: createRows_valor(data[i].data),
      tableWidth: sectionWidth,
      columnStyles: {
        0: { columnWidth: 24, halign: 'center', },
        1: { columnWidth: 10, halign: 'center', },
        2: { columnWidth: 24, halign: 'center' },
        3: { columnWidth: 10, halign: 'center' },
        4: { columnWidth: 24, halign: 'center' },
        5: { columnWidth: 24, halign: 'center' },
        6: { columnWidth: 24, halign: 'center' },
        7: { columnWidth: 24, halign: 'center' },
        8: { columnWidth: 24, halign: 'center' },
        9: { columnWidth: 24, halign: 'center' },
        10: { columnWidth: 24, halign: 'center' },
        11: { columnWidth: 24, halign: 'center' },
        12: { columnWidth: 24, halign: 'center' },
      },
      margin: {
        left: margin.left + ((nextSection - 1) * (sectionWidth + spacing)),
        top: margin.top,
        bottom: margin.bottom,
      },
      startY,
      rowPageBreak: 'avoid', // avoid breaking rows into multiple sections
      didDrawPage({ table, pageNumber, pageCount }) {
        currentSection = nextSection;
        nextSection = (nextSection % sections) + 1;

        // set left margin which will controll x position of next section
        const shift = (nextSection - 1) * (sectionWidth + spacing)
        table.settings.margin.left = margin.left + shift;

        // if next section is not the fist, move to previous page so when
        // autoTable calls addPage() it will still be the same current page
        if (nextSection > 1) {
          doc.setPage(doc.internal.getNumberOfPages() - 1);
        }
      }
    });



    // activate last page for further printing
    doc.setPage(doc.internal.getNumberOfPages());

    // if there's remaining vertical space in page: start printing next table from the current section
    const remainingVSpace = doc.internal.pageSize.height - margin.bottom - doc.lastAutoTable.finalY;
    if (remainingVSpace > 25) {
      nextSection = currentSection;
      startY = doc.lastAutoTable.finalY + 4;
    } else {
      startY = margin.top;
      if (nextSection == 1) doc.addPage();
    }
    doc.autoTable({
      styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'left', lineWidth: 0.1, lineColor: 0 },
      body: createRows_foot(data[i].totales),
      tableWidth: sectionWidth,
      columnStyles: {
        0: { columnWidth: 68, halign: 'center', },
        1: { columnWidth: 24, halign: 'center', },
        2: { columnWidth: 24, halign: 'center' },
        3: { columnWidth: 24, halign: 'center' },
        4: { columnWidth: 24, halign: 'center' },
        5: { columnWidth: 24, halign: 'center' },
        6: { columnWidth: 24, halign: 'center' },
        7: { columnWidth: 24, halign: 'center' },
        8: { columnWidth: 24, halign: 'center' },
        9: { columnWidth: 24, halign: 'center' },

      },
      margin: {
        left: margin.left + ((nextSection - 1) * (sectionWidth + spacing)),
        top: margin.top,
        bottom: margin.bottom,
      },
      startY,
      rowPageBreak: 'avoid', // avoid breaking rows into multiple sections
      didDrawPage({ table, pageNumber, pageCount }) {
        currentSection = nextSection;
        nextSection = (nextSection % sections) + 1;

        // set left margin which will controll x position of next section
        const shift = (nextSection - 1) * (sectionWidth + spacing)
        table.settings.margin.left = margin.left + shift;

        // if next section is not the fist, move to previous page so when
        // autoTable calls addPage() it will still be the same current page
        if (nextSection > 1) {
          doc.setPage(doc.internal.getNumberOfPages() - 1);
        }
      }
    });
    // activate last page for further printing
    doc.setPage(doc.internal.getNumberOfPages());

    // if there's remaining vertical space in page: start printing next table from the current section
    remainingVSpace = doc.internal.pageSize.height - margin.bottom - doc.lastAutoTable.finalY;
    if (remainingVSpace > 30) {
      nextSection = currentSection;
      startY = doc.lastAutoTable.finalY + 4;
    } else {
      startY = margin.top;
      if (nextSection == 1) doc.addPage();
    }
  }


  let finalY = doc.previousAutoTable.finalY
  linea = finalY + 3

  var pageCount = doc.internal.getNumberOfPages()
  for (let i = 0; i < pageCount; i++) {
    doc.setPage(i)
    let pageCurrent = doc.internal.getCurrentPageInfo().pageNumber

    doc.autoTable({
      startY: 20,
      margin: { top: 1, left: 10 },
      styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'center', lineWidth: 0.1, lineColor: 255 },
      bodyStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 24, halign: 'center', },
        1: { columnWidth: 10, halign: 'center', },
        2: { columnWidth: 24, halign: 'center' },
        3: { columnWidth: 10, halign: 'center' },
        4: { columnWidth: 24, halign: 'center' },
        5: { columnWidth: 24, halign: 'center' },
        6: { columnWidth: 24, halign: 'center' },
        7: { columnWidth: 24, halign: 'center' },
        8: { columnWidth: 24, halign: 'center' },
        9: { columnWidth: 24, halign: 'center' },
        10: { columnWidth: 24, halign: 'center' },
        11: { columnWidth: 24, halign: 'center' },
        12: { columnWidth: 24, halign: 'center' },
      },
      body: [['FECHA', 'TD', 'DOCUMENTO', 'OPERACION', 'CANTIDAD', 'COSTO Unit.', 'COSTO TOTAL', 'CANTIDAD', 'COSTO Unit.', 'COSTO TOTAL', 'CANTIDAD', 'COSTO Unit.', 'COSTO TOTAL']],

    })
    doc.line(0, 18, pdfInMM, 18)

    doc.setFontSize(10)
    doc.setFont('Helvetica', '');
    doc.text(170, 290, 'PAG :' + (pageCurrent - 1) + '/' + (pageCount - 1));

  }

  // delete unused empty page
  doc.deletePage(1);
  // reporte(doc.output('blob'))
  doc.setFontSize(10)
  doc.setFont('Helvetica', '');
  doc.autoTable({
    theme: ['plain'],
    startY: linea + 10,
    margin: { top: 1, left: 10 },
    styles: { fontSize: 8, cellPadding: 0.5, valign: 'middle', halign: 'center', lineWidth: 0.1, lineColor: 255 },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    bodyStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 40, halign: 'center', },
      1: { columnWidth: 40, halign: 'center', },
      2: { columnWidth: 40, halign: 'center' },
      3: { columnWidth: 40, halign: 'center' },
    },
    head: [['Saldo Inicial (S/.)', 'Ingresos (S/.)', 'Salidas (S/.)', 'Stock Final (S/.)']],
    body: [[parseFloat((array_final.tot_saldo_inicial).toFixed(2)), parseFloat((array_final.tot_ingresos).toFixed(2)),
    parseFloat((array_final.tot_salidas)).toFixed(2), parseFloat((array_final.total_stock)).toFixed(2)]]
  })
  window.open(doc.output('bloburl'))
}
function createRows_valor(count) {
  //console.log(CountQueuingStrategy)
  var datos = count
  var nuevoArray = new Array(datos.length);
  for (var i = 0; i < datos.length; i++) {
    nuevoArray[i] = new Array(13);
    nuevoArray[i][0] = moment.unix(datos[i].fecha).format('DD-MM-YY');
    nuevoArray[i][1] = datos[i].tipo_doc;
    nuevoArray[i][2] = datos[i].documento;
    nuevoArray[i][3] = datos[i].tipo_ope;
    nuevoArray[i][4] = datos[i].cantidad_entrada;
    nuevoArray[i][5] = datos[i].costo_entrada;
    nuevoArray[i][6] = datos[i].total_entrada;
    nuevoArray[i][7] = datos[i].cantidad_salida;
    nuevoArray[i][8] = datos[i].costo_salida;
    nuevoArray[i][9] = datos[i].total_salida;
    nuevoArray[i][10] = datos[i].saldo;
    nuevoArray[i][11] = datos[i].saldo_costo;
    nuevoArray[i][12] = datos[i].saldo_total;
  }
  return nuevoArray;
}
function createRows_foot(count) {

  var datos = count
  var nuevoArray = new Array(datos.length);

  nuevoArray[0] = new Array(10);
  nuevoArray[0][0] = "TOTALES S/. ";
  nuevoArray[0][1] = count.tot_entradas;
  nuevoArray[0][2] = "";
  nuevoArray[0][3] = count.cost_entradas;
  nuevoArray[0][4] = count.cant_salidas;
  nuevoArray[0][5] = "";
  nuevoArray[0][6] = count.cost_salidas;
  nuevoArray[0][7] = count.cant_total;
  nuevoArray[0][8] = "";
  nuevoArray[0][9] = count.cost_total;

  return nuevoArray;
}


const num = v => Number(v || 0);
const fmt2 = v => num(v).toFixed(2);

export function reporteProductoClientePDF(datas = [], rango = {}) {
  // datas: [{ cabecera, detalle }]  detalle puede ser objeto o array
  const { fecha_ini_str = "", fecha_fin_str = "" } = rango || {};
  // 1) Agrupar: producto -> (cliente -> cantidad)
  const productos = new Map();
  for (const doc of datas) {
    const cab = doc.cabecera || {};
    const det = doc.detalle || [];
    const items = Array.isArray(det) ? det : Object.values(det);

    for (const it of items) {
      // Solo líneas con cantidad válida
      const cantidad = num(it.cantidad);
      if (!cantidad) continue;

      const prodId = String(it.id);
      const prodKey = `${prodId}|||${it.nombre || ""}|||${it.medida || ""}`;
      const cliente = (cab.cliente || "").trim() || "(Sin nombre)";
      // mapa por producto
      if (!productos.has(prodKey)) {
        productos.set(prodKey, {
          id: prodId,
          nombre: it.nombre || "",
          medida: it.medida || "",
          clientes: new Map(), // cliente -> { cantidad, ventas }
          totalUnd: 0,
          ventas: 0
        });
      }
      const bucket = productos.get(prodKey);

      // acumular por cliente
      if (!bucket.clientes.has(cliente)) {
        bucket.clientes.set(cliente, { cantidad: 0, ventas: 0 });
      }
      const c = bucket.clientes.get(cliente);
      c.cantidad += cantidad;
      c.ventas += 1;

      // totales del producto
      bucket.totalUnd += cantidad;
      bucket.ventas += 1;
    }
  }

  // 2) Crear PDF
  const doc = new jspdf({ unit: "mm", format: "a4", compress: true });
  const titulo = "REPORTE PRODUCTO / CLIENTE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(titulo, 105, 12, { align: "center" });
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Fecha Pedidos: ${fecha_ini_str}  /  ${fecha_fin_str}`, 95, 17, { align: "center" });

  let y = 23;
  const pageH = doc.internal.pageSize.getHeight();

  // Orden: por nombre de producto
  const ordenProductos = [...productos.values()]
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));

  for (const p of ordenProductos) {
    // Salto de página si no hay espacio mínimo
    if (y > pageH - 40) {
      doc.addPage();
      y = 15;
    }

    // 2.1) Fila de cabecera del producto (resaltada)
    const headerTxt = `${p.id} - ${p.nombre}    —   ${p.ventas} ventas   —   ${fmt2(p.totalUnd)}  x ${p.medida}`;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(headerTxt, 12, y);

    y += 1;
    console.log(p)
    // 2.2) Tabla por clientes: Cliente | Cantidad
    const rows = [...p.clientes.entries()]
      .map(([cliente, info]) => [cliente, fmt2(info.cantidad)])
      .sort((a, b) => Number(b[1]) - Number(a[1])); // desc por cantidad

    doc.autoTable({
      startY: y,
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 1, halign: "left" },
      headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 140 },     // Cliente
        1: { cellWidth: 40, halign: "right" } // Cantidad
      },
      theme: "grid",
      margin: { left: 10, right: 10 }
    });

    y = doc.lastAutoTable.finalY + 3;
  }

  // 3) Descargar
  abre_dialogo_impresion(doc)
  //doc.save("reporte_producto_cliente.pdf");
}


function abre_dialogo_impresion(data) {

  var blob = (data.output("bloburi"))
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


/**
 * @param {Array} data - Array de objetos con la estructura de consultadetalles_pdf
 */
export const reporte_clientes_transporte = (data) => {
  const fechaImpresion = moment(String(new Date)).format('DD/MM/YYYY hh:mm a')
  const lMargin = 10
  const rMargin = 10
  const pdfInMM = 210

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [210, 297]
  })

  // Crear array de filas para la tabla
  const rows = []
  for (let i = 0; i < data.length; i++) {
    const item = data[i][1] // Cabecera del pedido
    const montoCredito = item.forma_pago === 'CREDITO' ? parseFloat(item.total || 0).toFixed(2) : '0.00'

    rows.push([
      item.numeracion || '',
      `${item.dni || ''} - ${item.cliente || ''}`,
      item.vendedor || '',
      parseFloat(item.peso_total || 0).toFixed(2),
      item.forma_pago || '',
      montoCredito,
      parseFloat(item.total || 0).toFixed(2)
    ])
  }

  // Configuración de la tabla
  doc.autoTable({
    startY: 29,
    margin: { top: 30, left: lMargin, right: rMargin },
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      valign: 'middle',
      halign: 'center',
      lineWidth: 0.2,
      lineColor: 80,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineWidth: 0.2,
      lineColor: 80
    },
    columnStyles: {
      0: { columnWidth: 25, halign: 'center' },
      1: { columnWidth: 70, halign: 'left' },
      2: { columnWidth: 18, halign: 'center' },
      3: { columnWidth: 18, halign: 'center' },
      4: { columnWidth: 22, halign: 'center' },
      5: { columnWidth: 20, halign: 'right' },
      6: { columnWidth: 20, halign: 'right' },
    },
    head: [['Correlativo', 'Documento - Cliente', 'Vendedor', 'Peso (KG)', 'Modo', 'M. Crédito', 'Total']],
    body: rows,
    didParseCell: function (data) {
      if (data.row.section === 'body') {
        data.cell.styles.fillColor = [255, 255, 255];
      }
    }
  })

  // Agregar encabezado en todas las páginas
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber

    // Título del reporte
    doc.setFontSize(13)
    doc.setFont('Helvetica', 'bold')
    let texto = doc.splitTextToSize("REPARTO N° " + data[0][2].id_grupo, (pdfInMM - lMargin - rMargin))
    doc.text(texto, lMargin, 10, 'left')

    // Fecha de impresión
    doc.setFontSize(9)
    doc.setFont('Helvetica', '')
    texto = doc.splitTextToSize('Fecha Impresion: ' + fechaImpresion, (pdfInMM - lMargin - rMargin))
    doc.text(texto, lMargin, 15, 'left')

    // Totales en el encabezado
    doc.setFontSize(9)
    texto = doc.splitTextToSize('CONTADO: S/.' + data[0][2].contado, (pdfInMM - lMargin - rMargin))
    doc.text(texto, 100, 10, 'left')

    texto = doc.splitTextToSize('CREDITO: S/.' + data[0][2].credito, (pdfInMM - lMargin - rMargin))
    doc.text(texto, 100, 14, 'left')

    texto = doc.splitTextToSize('MONTO TOTAL: S/.' + data[0][2].total, (pdfInMM - lMargin - rMargin))
    doc.text(texto, 150, 10, 'left')

    texto = doc.splitTextToSize('PESO TOTAL: ' + data[0][2].peso + ' KG', (pdfInMM - lMargin - rMargin))
    doc.text(texto, 150, 14, 'left')

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
    doc.line(lMargin, 24, pdfInMM - rMargin, 24)

    // Paginación
    doc.setFontSize(9)
    doc.text(170, 290, 'PAG: ' + pageCurrent + '/' + pageCount)
  }
  window.open(doc.output('bloburl'))
}