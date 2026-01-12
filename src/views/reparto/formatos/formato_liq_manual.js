import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";

import moment from "moment";
export const pdf_a4_t = (form, cabecera, datos) => {
  if (form == "V") {
    pdf_a4_v(cabecera, datos);
  } else {
    pdf_a4_h(cabecera, datos);
  }
};
const pdf_a4_h = (cabecera, datos) => {
  console.log(cabecera);
  console.log(datos);
  var lMargin = store.state.configImpresora.lMargin; //left margin in mm
  var rMargin = store.state.configImpresora.rMargin; //right margin in mm
  var pdfInMM = 210; // width of A4 in mm
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  var linea = 5;
  //console.log(arraycabe)
  doc.text(".", -1, linea);

  doc.setFontSize(10);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize("Formato Liq", pdfInMM - lMargin - rMargin);
  doc.text(texto, 5, linea, "left");

  var texto = doc.splitTextToSize(
    "Reparto : " + cabecera.grupo,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 45, linea, "left");

  var texto = doc.splitTextToSize(
    "Fecha : " + moment.unix(cabecera.fecha_emision).format("DD/MM/YYYY"),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 80, linea, "left");

  linea = linea + 7;
  doc.setFontSize(10);
  var texto = doc.splitTextToSize(
    "PESO : " +
      cabecera.peso +
      "  -  Cont. : S/" +
      cabecera.contado +
      "  -  Cred. : S/" +
      cabecera.credito +
      "  -  T.Gen. : S/" +
      cabecera.t_general +
      "  -  N°Pedidos : " +
      cabecera.pedidos,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 5, linea, "left"); //EMPRESA
  //lado derecho
  var texto = doc.splitTextToSize(
    "Reparto : " + cabecera.grupo,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 180, linea, "left");

  var texto = doc.splitTextToSize(
    "Fecha : " + moment.unix(cabecera.fecha_emision).format("DD/MM/YYYY"),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 220, linea, "left");

  linea = linea + 7;
  doc.setFontSize(10);
  var texto = doc.splitTextToSize(
    "PESO : " +
      cabecera.peso +
      "  -  Cont. : S/" +
      cabecera.contado +
      "  -  Cred. : S/" +
      cabecera.credito +
      "\n  T.Gen. : S/" +
      cabecera.t_general +
      " -  N°Pedidos : " +
      cabecera.pedidos,
    pdfInMM - lMargin - rMargin
  );

  doc.text(texto, 180, linea, "left"); //EMPRESA

  linea = linea + 5;
  var nuevoArray2 = new Array(11);
  nuevoArray2[0] = ["200"];
  nuevoArray2[1] = ["100"];
  nuevoArray2[2] = ["50"];
  nuevoArray2[3] = ["20"];
  nuevoArray2[4] = ["10"];
  nuevoArray2[5] = ["5"];
  nuevoArray2[6] = ["2"];
  nuevoArray2[7] = ["1"];
  nuevoArray2[8] = ["0.50"];
  nuevoArray2[9] = ["0.20"];
  nuevoArray2[10] = ["0.10"];

  doc.autoTable({
    startY: 15,
    margin: { top: 10, left: 5 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    footStyle: { lineWidth: 0 },
    columnStyles: {
      0: { columnWidth: 20, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 30, halign: "center" },
      2: { columnWidth: 23, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Efectivo", colSpan: 3 }],
      ["Denom", "Cantidad", "Sub Total"],
    ],
    body: nuevoArray2,
    foot: [[{ content: "Total Efectivo", colSpan: 2 }, { content: "" }]],
  });

  var nuevoArray3 = new Array(2);
  for (var i = 0; i < 24; i++) {
    nuevoArray3[i] = [""];
  }

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 175 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 25, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 12, halign: "center" },
      2: { columnWidth: 22, halign: "center" },
      3: { columnWidth: 12, halign: "center" },
      4: { columnWidth: 12, halign: "center" },
      5: { columnWidth: 30, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Rechazos", colSpan: 6 }],
      ["Nro Ped", "VD", "Cod.Prod", "Cant", "Valori", "Motivo"],
    ],
    body: nuevoArray3,
  });
  linea = linea + 72;

  var filt = datos.filter((e) => e.forma_pago == "CREDITO");

  var tm = filt.length;
  if (filt.length < 20) {
    tm = 12;
  }
  var nuevoArray = new Array(tm);
  for (var i = 0; i < tm; i++) {
    var item = filt[i];
    console.log(item);

    if (item != undefined) {
      let indice = item.cliente.indexOf(" ");
      let indice2 = item.cliente.indexOf(",");
      if (indice2 == -1) {
        indice2 = indice - 1;
      }
      var nom = String(
        item.cliente.substring(indice2 + 2, item.cliente.length)
      ).trim();
      let indc = nom.indexOf(" ");
      var vend =
        item.cliente.substring(0, indice) + " " + nom.substring(0, indc);
      nuevoArray[i] = new Array(4);
      nuevoArray[i][0] = item.numeracion;
      nuevoArray[i][1] = item.vendedor;
      nuevoArray[i][2] = {
        content: vend,
        styles: { textColor: [0, 0, 0], fontSize: 6 },
      };
      nuevoArray[i][3] = item.total;
    } else {
      nuevoArray[i] = new Array(4);
      nuevoArray[i][0] = "";
      nuevoArray[i][1] = "";
      nuevoArray[i][2] = "";
      nuevoArray[i][3] = "";
    }
  }

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 5 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 16, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 8, halign: "center" },
      2: { columnWidth: 32, halign: "center" },
      3: { columnWidth: 17, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Creditos Autorizados", colSpan: 4 }],
      ["Nro.Doc.", "V", "Cliente", "Importe"],
    ],
    body: nuevoArray,
    foot: [[{ content: "Total x Cobrar", colSpan: 3 }, { content: "" }]],
  });

  let finalss = doc.previousAutoTable.finalY;
  linea = finalss + 5;

  for (var i = 0; i < 10; i++) {
    var item = filt[i];
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = "";
    nuevoArray[i][1] = "";
    nuevoArray[i][2] = "";
    nuevoArray[i][3] = "";
  }

  doc.autoTable({
    startY: 15,
    margin: { top: 10, left: 80 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 24, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 40, halign: "center" },
      2: { columnWidth: 18, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Depositos/Transferencias", colSpan: 3 }],
      ["Nro.Dep/Tranf", "Cliente", "Importe"],
    ],
    body: nuevoArray,
    foot: [[{ content: "Total Dep./Transf", colSpan: 2 }, { content: "" }]],
  });

  let finalz = doc.previousAutoTable.finalY;
  linea = finalz + 5;

  var nuevoArray4 = new Array(2);
  for (var i = 0; i < 4; i++) {
    nuevoArray4[i] = [""];
  }

  doc.autoTable({
    startY: 100,
    margin: { top: 10, left: 80 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 57, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 25, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Desc/Gastos Autorizados", colSpan: 2 }],
      ["Motivo", "Importe"],
    ],
    body: nuevoArray4,
    foot: [
      [{ content: "Total Desc. Autorizado", colSpan: 1 }, { content: "" }],
    ],
  });

  doc.autoTable({
    startY: 140,
    margin: { top: 10, left: 80 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.3,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 35, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 35, halign: "left" },
    },
    theme: ["plain"],
    head: [[{ content: "Resumen", colSpan: 2 }]],
    body: [
      ["Importe a Cobrar"],
      ["Total Efectivo"],
      ["Total Rechazos"],
      ["Cred Autorizados"],
      ["Total Dep o Por Deps"],
      ["Total Desc Autoriz"],
      ["Diferencia"],
    ],
  });

  linea = 190;
  var texto = doc.splitTextToSize(
    "Nombre Chofer : ",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 10, linea, "left");
  linea = linea + 10;
  var texto = doc.splitTextToSize(
    "Nombre Liquidador : ",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 10, linea, "left");

  linea = linea + 30;
  var texto = doc.splitTextToSize("Firma: ", pdfInMM - lMargin - rMargin);
  doc.text(texto, 80, 195, "left");

  var texto = doc.splitTextToSize(
    "%Efectividad: ",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 80, 204, "left");
  doc.setDrawColor(0, 0, 0);
  doc.line(115, linea + 2, 150, linea + 2);
  window.open(doc.output("bloburl"));
};
const pdf_a4_v = (cabecera, datos) => {
  console.log(cabecera);
  console.log(datos);
  var lMargin = store.state.configImpresora.lMargin; //left margin in mm
  var rMargin = store.state.configImpresora.rMargin; //right margin in mm
  var pdfInMM = 210; // width of A4 in mm
  var pageCenter = pdfInMM / 2;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM],
  });
  var linea = 5;
  //console.log(arraycabe)
  doc.text(".", -1, linea);
  linea = linea + 5;

  doc.setFontSize(12);
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize(
    "Formato Liquidacion",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 10, linea, "left");

  var texto = doc.splitTextToSize(
    "Reparto : " + cabecera.grupo,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 80, linea, "left");

  var texto = doc.splitTextToSize(
    "Fecha : " + moment.unix(cabecera.fecha_emision).format("DD/MM/YYYY"),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 160, linea, "left");

  linea = linea + 7;
  doc.setFontSize(10);
  var texto = doc.splitTextToSize(
    "PESO : " +
      cabecera.peso +
      "  -  Contado : S/" +
      cabecera.contado +
      "  -  Credito : S/" +
      cabecera.credito +
      "  -  T.General : S/" +
      cabecera.t_general,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "Nro Pedidos : " + cabecera.pedidos,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //EMPRESA
  linea = linea + 5;
  var nuevoArray2 = new Array(11);
  nuevoArray2[0] = ["200"];
  nuevoArray2[1] = ["100"];
  nuevoArray2[2] = ["50"];
  nuevoArray2[3] = ["20"];
  nuevoArray2[4] = ["10"];
  nuevoArray2[5] = ["5"];
  nuevoArray2[6] = ["2"];
  nuevoArray2[7] = ["1"];
  nuevoArray2[8] = ["0.50"];
  nuevoArray2[9] = ["0.20"];
  nuevoArray2[10] = ["0.10"];

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 10 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    footStyle: { lineWidth: 0 },
    columnStyles: {
      0: { columnWidth: 20, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 30, halign: "center" },
      2: { columnWidth: 23, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Efectivo", colSpan: 3 }],
      ["Denom", "Cantidad", "Sub Total"],
    ],
    body: nuevoArray2,
    foot: [[{ content: "Total Efectivo", colSpan: 2 }, { content: "" }]],
  });

  var nuevoArray3 = new Array(2);
  for (var i = 0; i < 24; i++) {
    nuevoArray3[i] = [""];
  }

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 85 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 25, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 12, halign: "center" },
      2: { columnWidth: 22, halign: "center" },
      3: { columnWidth: 12, halign: "center" },
      4: { columnWidth: 12, halign: "center" },
      5: { columnWidth: 30, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Rechazos", colSpan: 6 }],
      ["Nro Ped", "VD", "Cod.Prod", "Cant", "Valori", "Motivo"],
    ],
    body: nuevoArray3,
  });
  linea = linea + 80;

 var filt = datos.filter((e) => e.forma_pago == "CREDITO");

  const maxCredRows = 5;              // ⭐ máximo 5 filas
  var tm = maxCredRows;
  var nuevoArray = new Array(tm);

  for (var i = 0; i < tm; i++) {
    var item = filt[i];               // si no existe, se rellena vacío

    if (item != undefined) {
      let indice = item.cliente.indexOf(" ");
      let indice2 = item.cliente.indexOf(",");
      if (indice2 == -1) {
        indice2 = indice - 1;
      }
      var nom = String(
        item.cliente.substring(indice2 + 2, item.cliente.length)
      ).trim();
      let indc = nom.indexOf(" ");
      var vend =
        item.cliente.substring(0, indice) + " " + nom.substring(0, indc);
      nuevoArray[i] = new Array(4);
      nuevoArray[i][0] = item.numeracion;
      nuevoArray[i][1] = item.vendedor;
      nuevoArray[i][2] = {
        content: vend,
        styles: { textColor: [0, 0, 0], fontSize: 6 },
      };
      nuevoArray[i][3] = item.total;
    } else {
      nuevoArray[i] = new Array(4);
      nuevoArray[i][0] = "";
      nuevoArray[i][1] = "";
      nuevoArray[i][2] = "";
      nuevoArray[i][3] = "";
    }
  }

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 10 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 16, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 8, halign: "center" },
      2: { columnWidth: 32, halign: "center" },
      3: { columnWidth: 17, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Creditos Autorizados", colSpan: 4 }],
      ["Nro.Doc.", "V", "Cliente", "Importe"],
    ],
    body: nuevoArray,
    foot: [[{ content: "Total x Cobrar", colSpan: 3 }, { content: "" }]],
  });

  let finalss = doc.previousAutoTable.finalY;
  linea = finalss + 5;

  for (var i = 0; i < 15; i++) {
    var item = filt[i];
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = "";
    nuevoArray[i][1] = "";
    nuevoArray[i][2] = "";
    nuevoArray[i][3] = "";
  }

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: 10 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 24, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 31, halign: "center" },
      2: { columnWidth: 18, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Depositos/Transferencias", colSpan: 3 }],
      ["Nro.Dep/Tranf", "Cliente", "Importe"],
    ],
    body: nuevoArray,
    foot: [[{ content: "Total Dep./Transf", colSpan: 2 }, { content: "" }]],
  });

  let finalz = doc.previousAutoTable.finalY;
  linea = finalz + 5;

  var nuevoArray4 = new Array(2);
  for (var i = 0; i < 4; i++) {
    nuevoArray4[i] = [""];
  }

  doc.autoTable({
    startY: 175,
    margin: { top: 10, left: 85 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 83, halign: "center", fontStyle: "bold" },
      1: { columnWidth: 30, halign: "center" },
    },
    theme: ["plain"],
    head: [
      [{ content: "Desc/Gastos Autorizados", colSpan: 2 }],
      ["Motivo", "Importe"],
    ],
    body: nuevoArray4,
    foot: [
      [{ content: "Total Desc. Autorizado", colSpan: 1 }, { content: "" }],
    ],
  });

  doc.autoTable({
    startY: 218,
    margin: { top: 10, left: 85 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.3,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 35, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 35, halign: "left" },
    },
    theme: ["plain"],
    head: [[{ content: "Resumen", colSpan: 2 }]],
    body: [
      ["Importe a Cobrar"],
      ["Total Efectivo"],
      ["Total Rechazos"],
      ["Cred Autorizados"],
      ["Total Dep o Por Deps"],
      ["Total Desc Autoriz"],
      ["Diferencia"],
    ],
  });

  linea = 270;
  var texto = doc.splitTextToSize(
    "Nombre Chofer : ",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 90, linea, "left");
  linea = linea + 10;
  var texto = doc.splitTextToSize(
    "Nombre Liquidador : ",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, 90, linea, "left");

  linea = linea + 30;
  var texto = doc.splitTextToSize("Firma: ", pdfInMM - lMargin - rMargin);
  doc.text(texto, 150, 290, "left");
  doc.setDrawColor(0, 0, 0);
  doc.line(115, linea + 2, 150, linea + 2);
  window.open(doc.output("bloburl"));
};
