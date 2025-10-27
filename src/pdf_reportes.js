import jspdf from 'jspdf'
import 'jspdf-autotable'
import store from '@/store/index'
import { consultaArchivo } from './db'
import QR from 'qrcode-base64'
import moment from 'moment'

export const pdf_cuentas_cobrar = (data,fecha) => {

  var linea = parseInt(store.state.configImpresora.msuperior)      
  var nombreEmpresa= store.state.baseDatos.name
  var Ruc='Ruc: ' + store.state.baseDatos.ruc
  var apertura = fecha
  var emision = moment(String(new Date)).format('YYYY-MM-DD hh:mm A')
  var lMargin=15; //left margin in mm
  var rMargin=15; //right margin in mm
  var pdfInMM=210 ;  // width of A5 in mm
  var pageCenter=pdfInMM/2;

  
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM]
  })

  doc.text('.',-1,linea)
  linea=linea + 5

  doc.setFontSize(14)
  doc.setFont('Helvetica','Bold');
  var texto =doc.splitTextToSize("REPORTE CREDITOS", (pdfInMM-lMargin-rMargin));
  doc.text(texto,10,linea,'left'); //EMPRESA
  linea=linea + 5

  doc.setFontSize(10)
  doc.setFont('Helvetica','');
 /* var texto =doc.splitTextToSize(nombreEmpresa, (pdfInMM-lMargin-rMargin));
  doc.text(texto,pageCenter,linea,'center'); //EMPRESA
  linea=linea + 5
  var texto =doc.splitTextToSize(Ruc, (pdfInMM-lMargin-rMargin));
  doc.text(texto,pageCenter,linea,'center'); //RUC
  linea=linea + 5*/
  var texto =doc.splitTextToSize('Fecha Impresion: ' + emision, (pdfInMM-lMargin-rMargin));
  doc.text(texto,10,linea,'left'); fecha
/*
  var texto =doc.splitTextToSize('Vencimiento Hasta: ' + apertura, (pdfInMM-lMargin-rMargin));
  doc.text(texto,210,linea,'left'); fecha
  */

  linea = linea + 5

  var array = data
  console.log(data)
  var nuevoArray = new Array(array.length);
  for(var i=0;i<array.length;i++){  
    var item = array[i]
    nuevoArray[i] = new Array(9);      
    nuevoArray[i][0] = item.vendedor;
    nuevoArray[i][1] = item.documento;
    nuevoArray[i][2] = item.nombre;  
    nuevoArray[i][3] = moment.unix(item.fecha).format('DD/MM/YY');
    nuevoArray[i][4] = moment.unix(item.fecha_vence).format('DD/MM/YY') ;
    nuevoArray[i][5] = item.doc_ref;
    nuevoArray[i][6] = 'S/.' +item.monto_total ;
    nuevoArray[i][7] = 'S/.' +item.monto_pendiente ;
  }

   doc.autoTable({
    margin: { top: linea, left: 5 },
    styles: {fontSize: 8,cellPadding:1,valign:'middle',halign: 'center',lineWidth: 0.2 , lineColor: 1 },
    headStyles: {lineWidth: 0.2 , lineColor: 1 },
    columnStyles: {
      0: {columnWidth: 10,halign: 'center'},
      1: {columnWidth: 20, halign: 'left',},
      2: {columnWidth: 78, halign: 'left',},
      3: {columnWidth: 15, halign: 'center',},
      4: {columnWidth: 15 , halign: 'center'},
      5: {columnWidth: 20 , halign: 'center'},
      6: {columnWidth: 20 , halign: 'center'},
      7: {columnWidth: 22 , halign: 'center'},
      8: {columnWidth: 22 , halign: 'center'},
    },
    theme: ['plain'],
    head: [['Vend.','Documento','Cliente','Emision', 'Vencim.','Comprob.','Total','Pend.']],
    body: nuevoArray
  })

  let finalY = doc.previousAutoTable.finalY
  linea = finalY + 5

  window.open(doc.output('bloburl'))
}

function extrae_texto(data,cantidad){
  return String(data).substr(0,cantidad)
}