import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import moment from "moment";

export const pdf_total_caja = (arraydatos) => {
  console.log(arraydatos)
  var linea = parseInt(store.state.configImpresora.msuperior);
  var pdfInMM = 75; // width of A4 in mm
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment().format("DD/MM/YYYY hh:mm a");
  var pageCenter = pdfInMM / 2;
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;
  doc.setFontSize(11);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    "Reporte Total Caja",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 4;
  /*var texto = doc.splitTextToSize(store.state.permisos.tienda, (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center'); //EMPRESA
  linea = linea + 4*/
  doc.setFontSize(9);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(fechaImpresion, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;

  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  var texto = doc.splitTextToSize("INGRESOS", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  doc.setFont("Helvetica", "");

  doc.text("EFECTIVO", lMargin, linea);
  doc.text("S./" + arraydatos.i_efectivo.toFixed(2), 60, linea, "right");
  linea = linea + 4;
  if (arraydatos.i_tarjeta > 0) {
    doc.text("TARJETA", lMargin, linea);
    doc.text("S./" + arraydatos.i_tarjeta.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_yape > 0) {
    doc.text("YAPE", lMargin, linea);
    doc.text("S./" + arraydatos.i_yape.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_plin > 0) {
    doc.text("PLIN", lMargin, linea);
    doc.text("S./" + arraydatos.i_plin.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }

  if (arraydatos.i_transferencia > 0) {
    doc.text("TRANSF", lMargin, linea);
    doc.text("S./" + arraydatos.i_transferencia.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }

  if (arraydatos.i_debito > 0) {
    doc.text("Debito", lMargin, linea);
    doc.text("S./" + arraydatos.i_debito.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_credito > 0) {
    doc.text("Credito", lMargin, linea);
    doc.text("S./" + arraydatos.i_credito.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_rappy > 0) {
    doc.text("Rappy", lMargin, linea);
    doc.text("S./" + arraydatos.i_rappy.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_pedidos > 0) {
    doc.text("Pedidos Ya", lMargin, linea);
    doc.text("S./" + arraydatos.i_pedidos.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.i_posqr > 0) {
    doc.text("Pos QR", lMargin, linea);
    doc.text("S./" + arraydatos.i_posqr.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  doc.text("T.Ingresos", lMargin, linea);
  doc.text("S./" + arraydatos.t_general.toFixed(2), 60, linea, "right");
  linea = linea + 4;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  doc.setFontSize(9);
  doc.setFont("Helvetica", "bold");
  var texto = doc.splitTextToSize("EGRESOS", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  doc.setFont("Helvetica", "");

  doc.text("EFECTIVO", lMargin, linea);
  doc.text("S./" + arraydatos.e_efectivo.toFixed(2), 60, linea, "right");
  linea = linea + 4;
  if (arraydatos.e_tarjeta > 0) {
    doc.text("TARJETA", lMargin, linea);
    doc.text("S./" + arraydatos.e_tarjeta.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  console.log(arraydatos)
  if (arraydatos.e_yape != 0) {
    doc.text("YAPE", lMargin, linea);
    doc.text("S./" + arraydatos.e_yape.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_plin  != 0) {
    doc.text("PLIN", lMargin, linea);
    doc.text("S./" + arraydatos.e_plin.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_transferencia != 0) {
    doc.text("TRANSF", lMargin, linea);
    doc.text("S./" + arraydatos.e_transferencia.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_debito > 0) {
    doc.text("Debito", lMargin, linea);
    doc.text("S./" + arraydatos.e_debito.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_creidto > 0) {
    doc.text("Credito", lMargin, linea);
    doc.text("S./" + arraydatos.e_creidto.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_rappy > 0) {
    doc.text("Rappy", lMargin, linea);
    doc.text("S./" + arraydatos.e_rappy.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_pedidos > 0) {
    doc.text("Pedidos Ya", lMargin, linea);
    doc.text("S./" + arraydatos.e_pedidos.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  if (arraydatos.e_posqr > 0) {
    doc.text("POS QR", lMargin, linea);
    doc.text("S./" + arraydatos.e_posqr.toFixed(2), 60, linea, "right");
    linea = linea + 4;
  }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  doc.text("T.Egresos", lMargin, linea);
  doc.text("S./" + arraydatos.t_egresos.toFixed(2), 60, linea, "right");
  linea = linea + 4;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  doc.text("T.EFECTIVO", lMargin, linea);
  doc.text(
    "S./" + parseFloat(arraydatos.t_efectivo).toFixed(2),
    60,
    linea,
    "right"
  );
  linea = linea + 5;

  doc.text("T.GENERAL", lMargin, linea);
  doc.text(
    "S./" + parseFloat(arraydatos.t_general - arraydatos.t_egresos).toFixed(2),
    60,
    linea,
    "right"
  );
  linea = linea + 5;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;

  if (arraydatos.observacion != undefined) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(9);
    var texto = doc.splitTextToSize(
      "Obs : " + arraydatos.observacion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 4 * texto.length;
  }

  if (arraydatos.datos_ingreso != "") {
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    var texto = doc.splitTextToSize(
      "DETALLE INGRESOS ",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA
    linea = linea + 5;

    //-----------------productos-----------------------
    var array = arraydatos.datos_ingreso;
    var nuevoArrayS = new Array(array.length);
    for (var i = 0; i < array.length; i++) {
      nuevoArrayS[i] = new Array(3);
      nuevoArrayS[i][0] = array[i].observacion;
      nuevoArrayS[i][1] = Number(array[i].total).toFixed(2);
    }

    doc.autoTable({
      margin: { top: linea, left: 3 },
      startY: linea,
      styles: {
        fontSize: 9,
        cellPadding: 0.5,
        valign: "middle",
        halign: "center",
        textColor: [0, 0, 0],
      },
      headStyles: { lineWidth: 0, minCellHeight: 9 },
      columnStyles: {
        0: { columnWidth: 54, halign: "left" },
        1: { columnWidth: 14, halign: "right" },
      },
      theme: ["grid"],
      body: nuevoArrayS,
    });
    let finalY = doc.previousAutoTable.finalY;
    linea = finalY + 10;
  }

  if (arraydatos.datos != "") {
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    var texto = doc.splitTextToSize(
      "DETALLE EGRESOS",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA
    linea = linea + 5;
    //-----------------productos-----------------------
    var array = arraydatos.datos;
    var nuevoArray = new Array(array.length);
    for (var i = 0; i < array.length; i++) {
      nuevoArray[i] = new Array(3);
      nuevoArray[i][0] = array[i].observacion;
      nuevoArray[i][1] = "-" + Number(array[i].total).toFixed(2);
    }

    doc.autoTable({
      margin: { top: linea, left: 3 },
      startY: linea,
      styles: {
        fontSize: 9,
        cellPadding: 0.5,
        valign: "middle",
        halign: "center",
        textColor: [0, 0, 0],
      },
      headStyles: { lineWidth: 0, minCellHeight: 9 },
      columnStyles: {
        0: { columnWidth: 54, halign: "left" },
        1: { columnWidth: 14, halign: "right" },
      },
      theme: ["grid"],
      body: nuevoArray,
    });
  }

  let finalu = doc.previousAutoTable.finalY;

  linea = finalu + 5;

  doc.text("........", 1, linea);

  if (store.state.esmovil) {
    window.open(doc.output("bloburi"));
  } else {
    abre_dialogo_impresion(doc.output("bloburi"));
  }
};
export const pdfcierrecaja = (data, fecha) => {
  var linea = parseInt(store.state.configImpresora.msuperior);
  var nombreEmpresa = store.state.baseDatos.name;
  var Ruc = "Ruc: " + store.state.baseDatos.ruc;
  var emision = fecha;
  var lMargin = 15; //left margin in mm
  var rMargin = 15; //right margin in mm
  var pdfInMM = 210; // width of A5 in mm
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [210, 297],
  });
  doc.addPage();

  doc.text(".", -1, linea);
  linea = linea + 5;

  doc.setFontSize(15);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    "REPORTE DE CAJA CHICA",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  doc.setFontSize(12);
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(nombreEmpresa, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;
  var texto = doc.splitTextToSize(Ruc, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //RUC
  linea = linea + 5;
  var texto = doc.splitTextToSize(
    "Fecha: " + emision,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //fecha
  linea = linea + 5;

  doc.line(0, linea, pdfInMM, linea);
  linea = linea + 5;

  // overall margin
  const margin = {
    left: 15,
    right: 15,
    top: 20,
    bottom: 20,
  };

  const tablesCount = data.length;
  // number of table sections in the page
  const sections = 1;
  // space between each section
  const spacing = 5;

  // calculate each section width
  const printWidht = doc.internal.pageSize.width - (margin.left + margin.right);
  const sectionWidth = (printWidht - (sections - 1) * spacing) / sections;

  // add an initial empty page that will be delete later,
  // it is needed for the first setPage(previous_page) call

  let currentSection;
  let nextSection = 1;
  let startY = linea;
  var sumatotal = 0;
  for (var i = 0; i < tablesCount; i++) {
    sumatotal = sumatotal + parseFloat(data[i][2]);
  }

  var texto = doc.splitTextToSize(
    "TOTAL GENERAL: S/." + sumatotal.toFixed(2),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, startY, "center");

  startY = startY + 5;

  for (let i = 0; i < tablesCount; i++) {
    startY = startY + 1;
    var texto = doc.splitTextToSize(
      data[i][1] + " = S/." + data[i][2],
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, startY, "center");
    startY = startY + 1;

    doc.autoTable({
      theme: ["grid"],
      head: [["id", "modo", "operacion", "obs", "total"]],
      body: createRows(data[i][0]),
      tableWidth: sectionWidth,
      margin: {
        left: margin.left + (nextSection - 1) * (sectionWidth + spacing),
        top: margin.top,
        bottom: margin.bottom,
      },
      startY,
      rowPageBreak: "avoid", // avoid breaking rows into multiple sections
      didDrawPage({ table, pageNumber, pageCount }) {
        currentSection = nextSection;
        nextSection = (nextSection % sections) + 1;

        // set left margin which will controll x position of next section
        const shift = (nextSection - 1) * (sectionWidth + spacing);
        table.settings.margin.left = margin.left + shift;

        // if next section is not the fist, move to previous page so when
        // autoTable calls addPage() it will still be the same current page
        if (nextSection > 1) {
          doc.setPage(doc.internal.getNumberOfPages() - 1);
        }
      },
    });

    // activate last page for further printing
    doc.setPage(doc.internal.getNumberOfPages());

    // if there's remaining vertical space in page: start printing next table from the current section
    const remainingVSpace =
      doc.internal.pageSize.height - margin.bottom - doc.lastAutoTable.finalY;
    if (remainingVSpace > 25) {
      nextSection = currentSection;
      startY = doc.lastAutoTable.finalY + 10;
    } else {
      startY = margin.top;
      if (nextSection == 1) doc.addPage();
    }
  }

  // delete unused empty page
  doc.deletePage(1);
  doc.save("Cierre de caja " + emision + ".pdf");
};

function createRows(count) {
  var datos = count;
  var nuevoArray = new Array(datos.length);
  for (var i = 0; i < datos.length; i++) {
    nuevoArray[i] = new Array(5);
    nuevoArray[i][0] = datos[i].id;
    nuevoArray[i][1] = datos[i].modo;
    nuevoArray[i][2] = datos[i].operacion;
    nuevoArray[i][3] = datos[i].observacion;
    nuevoArray[i][4] = datos[i].total;
  }
  return nuevoArray;
}

export const ReporteVendedor = (date, date2, listafiltrada, totaliza) => {
  var linea = 5;
  var nombreEmpresa = store.state.baseDatos.name;
  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = store.state.configImpresora.mizquierdo; //left margin in mm
  var rMargin = store.state.configImpresora.mderecho; //right margin in mm
  var pdfInMM = store.state.configImpresora.tamano; // width of A4 in mm
  var pageCenter = pdfInMM / 2;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var size1 = 8;
  var size2 = 10;
  var array = listafiltrada;
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [500, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = linea + 3;

  doc.setFontSize(size2);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(nombreEmpresa, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;

  doc.setFontSize(size1);
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    store.state.baseDatos.direccion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    date + " al " + date2,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;

  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(1);
    nuevoArray[i][0] = array[i].nombre;
    nuevoArray[i][1] = array[i].total;
  }

  doc.autoTable({
    margin: { top: linea, left: parseInt(lMargin) },
    styles: {
      fontSize: 8,
      cellPadding: 0.5,
      valign: "middle",
      halign: "center",
    },
    columnStyles: {
      0: { columnWidth: 36, halign: "left" },
      1: { columnWidth: 36, halign: "center" },
    },
    theme: ["plain"],
    head: [["Vendedor", "Total"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 3;
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  doc.setFontSize(size1);
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    "Total : " + totaliza,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  if (guardadocumento) {
    doc.save(serie + ".pdf");
  } else {
    window.open(doc.output("bloburl"));
  }
};
export const pdf_productos_vendidos = (array, medida) => {
  switch (medida) {
    case "A4":
      impresionA4(array);
      break;
    case "80":
      impresion80(array);
      break;
  }
};
function impresionA4(array) {
  var linea = parseInt(store.state.configImpresora.msuperior);
  var pdfInMM = 210; // width of A4 in mm
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment().format("DD/MM/YYYY hh:mm a");
  var pageCenter = pdfInMM / 2;
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;
  doc.setFontSize(11);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    "Reporte Venta Detallado",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;
  doc.setFontSize(9);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(fechaImpresion, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;

  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre;
    nuevoArray[i][2] = array[i].precio_prom;
    nuevoArray[i][3] = parseFloat(
      array[i].precio_prom * array[i].cantidad
    ).toFixed(store.state.configuracion.decimal);
  }

  doc.autoTable({
    margin: { top: linea, left: 10 },
    styles: {
      fontSize: 8.5,
      cellPadding: 0.5,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 20, halign: "center" },
      1: { columnWidth: 130, halign: "left" },
      2: { columnWidth: 20, halign: "center" },
      3: { columnWidth: 20, halign: "center" },
    },
    theme: ["plain"],
    head: [["Cant", "Descripcion", "P.U", "P.T"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  window.open(doc.output("bloburi"));
}
function impresion80(array) {
  var linea = parseInt(store.state.configImpresora.msuperior);
  var pdfInMM = 75; // width of A4 in mm
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment().format("DD/MM/YYYY hh:mm a");
  var pageCenter = pdfInMM / 2;
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
  });
  doc.setTextColor(10);
  doc.text(".", 0, linea);
  linea = linea + 3;
  doc.setFontSize(11);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    "Reporte Venta Detallado",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;
  doc.setFontSize(9);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(fechaImpresion, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 3;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 10;

  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre;
    nuevoArray[i][2] = array[i].precio_prom;
    nuevoArray[i][3] = parseFloat(
      array[i].precio_prom * array[i].cantidad
    ).toFixed(store.state.configuracion.decimal);
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
      1: { columnWidth: 40, halign: "left" },
      2: { columnWidth: 12, halign: "right" },
      3: { columnWidth: 12, halign: "right" },
    },
    theme: ["plain"],
    head: [["Cant", "Descripcion", "P.U", "P.T"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  window.open(doc.output("bloburi"));
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
