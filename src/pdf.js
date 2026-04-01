import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import moment from "moment";

export const pdf_total_caja = (arraydatos) => {
  const toNumber = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const money = (value) => toNumber(value).toFixed(2)

  const normalizeMetodo = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim()

  const configuredMetodos = Array.isArray(store?.state?.modopagos)
    ? store.state.modopagos
    : [];

  const metodosBase = configuredMetodos
    .map((m) => normalizeMetodo(m))
    .filter(Boolean)
    .filter((m, idx, arr) => arr.indexOf(m) === idx)

  const metodoKey = (metodo) =>
    normalizeMetodo(metodo)
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\./g, "")

  let metodos = Array.isArray(arraydatos.metodos)
    ? arraydatos.metodos.map((m) => ({
      metodo: normalizeMetodo(m.metodo),
      ingreso: toNumber(m.ingreso),
      egreso: toNumber(m.egreso),
    }))
    : metodosBase
      .map((m) => {
        const key = metodoKey(m)
        const ingreso = toNumber(arraydatos[`i_${key}`])
        const egreso = toNumber(arraydatos[`e_${key}`])
        return { metodo: m, ingreso, egreso }
      })
      .filter((m) => m.ingreso !== 0 || m.egreso !== 0)

  const acumularDesdeDetalles = (detalle, operacion) => {
    if (!Array.isArray(detalle)) return
    detalle.forEach((item) => {
      const metodo = normalizeMetodo(item.modo)
      if (!metodo) return
      const monto = toNumber(item.total)
      const idx = metodos.findIndex((m) => normalizeMetodo(m.metodo) === metodo)
      if (idx === -1) {
        metodos.push({
          metodo,
          ingreso: operacion === "ingreso" ? monto : 0,
          egreso: operacion === "egreso" ? monto : 0,
        })
      } else if (operacion === "ingreso") {
        metodos[idx].ingreso += monto
      } else {
        metodos[idx].egreso += monto
      }
    })
  }

  acumularDesdeDetalles(arraydatos.datos_ingreso, "ingreso")
  acumularDesdeDetalles(arraydatos.datos, "egreso")

  metodos = metodos
    .map((m) => ({
      metodo: m.metodo,
      ingreso: toNumber(m.ingreso),
      egreso: toNumber(m.egreso),
    }))
    .filter((m) => m.ingreso !== 0 || m.egreso !== 0)
    .sort((a, b) => {
      if (a.metodo === "EFECTIVO") return -1
      if (b.metodo === "EFECTIVO") return 1
      return a.metodo.localeCompare(b.metodo)
    })

  const ingresosTotales = toNumber(arraydatos.t_general) || metodos.reduce((acc, m) => acc + toNumber(m.ingreso), 0)
  const egresosTotales = toNumber(arraydatos.t_egresos) || metodos.reduce((acc, m) => acc + toNumber(m.egreso), 0)
  const netoTotal = ingresosTotales - egresosTotales

  const efectivo = metodos.find((m) => m.metodo === "EFECTIVO")
  const totalEfectivo =
    toNumber(arraydatos.t_efectivo) ||
    (efectivo ? toNumber(efectivo.ingreso) - toNumber(efectivo.egreso) : 0)

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const marginX = 12
  const pageWidth = doc.internal.pageSize.getWidth()
  const centerX = pageWidth / 2
  let cursorY = 14

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(13)
  doc.text("REPORTE TOTAL CAJA", centerX, cursorY, { align: "center" })
  cursorY += 6

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9)
  doc.text(store.state.baseDatos?.name || "", centerX, cursorY, { align: "center" })
  cursorY += 4
  doc.text(`Fecha impresión: ${moment().format("DD/MM/YYYY hh:mm a")}`, centerX, cursorY, {
    align: "center",
  })
  cursorY += 6

  if (arraydatos.observacion) {
    const obs = doc.splitTextToSize(`Observación: ${arraydatos.observacion}`, pageWidth - marginX * 2)
    doc.text(obs, marginX, cursorY)
    cursorY += obs.length * 4 + 2
  }

  const resumenRows = metodos.map((m) => [
    m.metodo,
    money(m.ingreso),
    money(m.egreso),
    money(m.ingreso - m.egreso),
  ])

  doc.autoTable({
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [["Método", "Ingresos", "Egresos", "Saldo"]],
    body: resumenRows,
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: [39, 93, 173] },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    theme: "grid",
  })

  cursorY = (doc.lastAutoTable?.finalY || cursorY) + 5

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10)
  doc.text(`TOTAL INGRESOS: S/. ${money(ingresosTotales)}`, marginX, cursorY)
  cursorY += 5
  doc.text(`TOTAL EGRESOS: S/. ${money(egresosTotales)}`, marginX, cursorY)
  cursorY += 5
  doc.text(`TOTAL EFECTIVO: S/. ${money(totalEfectivo)}`, marginX, cursorY)
  cursorY += 5
  doc.text(`TOTAL GENERAL (NETO): S/. ${money(netoTotal)}`, marginX, cursorY)
  cursorY += 6

  const mapDetalle = (items, isEgreso) =>
    (Array.isArray(items) ? items : []).map((item) => [
      moment.unix(toNumber(item.fecha)).format("DD/MM/YYYY HH:mm"),
      normalizeMetodo(item.modo),
      item.responsable || "",
      item.observacion || "",
      `${isEgreso ? "-" : ""}${money(item.total)}`,
    ])

  const ingresosDetalle = mapDetalle(arraydatos.datos_ingreso, false)
  const egresosDetalle = mapDetalle(arraydatos.datos, true)

  if (ingresosDetalle.length) {
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(10)
    doc.text("DETALLE INGRESOS", marginX, cursorY)
    cursorY += 4

    doc.autoTable({
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["Fecha - Hora", "Método", "Responsable", "Observación", "Total"]],
      body: ingresosDetalle,
      styles: { fontSize: 8, cellPadding: 1.3 },
      headStyles: { fillColor: [16, 124, 16] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 28 },
        2: { cellWidth: 32 },
        3: { cellWidth: 75 },
        4: { halign: "right", cellWidth: 20 },
      },
      theme: "grid",
    })
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 6
  }

  if (egresosDetalle.length) {
    doc.autoTable({
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["DETALLE EGRESOS", "Método", "Responsable", "Observación", "Total"]],
      body: egresosDetalle,
      styles: { fontSize: 8, cellPadding: 1.3 },
      headStyles: { fillColor: [178, 34, 34] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 28 },
        2: { cellWidth: 32 },
        3: { cellWidth: 75 },
        4: { halign: "right", cellWidth: 20 },
      },
      theme: "grid",
    })
  }

  const blobUrl = doc.output("bloburi")
  if (store.state.esmovil) {
    window.open(blobUrl)
  } else {
    abre_dialogo_impresion(blobUrl)
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
