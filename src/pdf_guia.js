import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import moment from "moment";
import "jspdf-autotable";
import QR from "qrcode-base64";

export const generaGuia = (array, formato) => {
  var qrs = generaQR(array);
  switch (formato) {
    case "A4":
      impresionA4(array, qrs);
      break;
    case "80":
      impresion80(array, qrs);
      break;
    case "58":
      impresion58(array, qrs);
      break;
  }
};
export const impresion58 = (arrays, qr) => {
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var array = arrays.data;
  var arraydatos = arrays;
  var arraycabe = arrays;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment
    .unix(arraycabe.fecha_emision)
    .format("DD/MM/YYYY hh:mm a");
  var fecha_traslado = moment.unix(arrays.fecha_traslado).format("DD/MM/YYYY");
  var pdfInMM = 54; // width of A4 in mm
  var lMargin = 2; //left margin in mm
  var rMargin = 1; //right margin in mm
  var pageCenter = pdfInMM / 2;
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [500, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = linea + 3;

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

  linea = linea + 3.5 * texto.length;

  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Ruc: " + store.state.baseDatos.ruc + "\n" + Direccion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //RUC

  linea = linea + 3.5 * texto.length;

  if (store.state.configImpresora.cabecera != "") {
    linea = linea + 2;
    var texto = doc.splitTextToSize(
      store.state.configImpresora.cabecera,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }
  if (store.state.configImpresora.telefono != "") {
    linea = linea + 1;
    var texto = doc.splitTextToSize(
      "Telf: " + store.state.configImpresora.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  if (arraydatos.tipo_comprobante == "09") {
    var texto = doc.splitTextToSize(
      "GUIA DE REMISION REMITENTE",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
  } else {
    var texto = doc.splitTextToSize(
      "GUIA DE REMISION TRANSPORTISTA",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
  }

  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    arraycabe.serie + "-" + arraycabe.correlativo,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fechaImpresion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 4;

  var texto = doc.splitTextToSize(
    "TRASLADO: " + fecha_traslado,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 4;

  var medida = "KG";
  if (arrays.medida_t != undefined) {
    medida = arrays.medida_t;
  }

  doc.setFont("Helvetica", "");
  doc.text(
    "Peso Bruto: " + String(arrays.peso_total) + " " + medida,
    5,
    linea,
    "left"
  );
  linea = linea + 4;

  if (arrays.tipo_comprobante == "09") {
    doc.setFont("Helvetica", "");
    doc.text("MOT. TRASLADO: " + arrays.motivo, 5, linea, "left");
    linea = linea + 4;

    doc.text("MODO TRANSP.: " + arrays.modo_transporte_desc, 5, linea, "left");
    linea = linea + 4;
  } else {
    doc.setFont("Helvetica", "");
    doc.text("Pagador Flete : " + arrays.pagado_por, 5, linea, "left");
    linea = linea + 4;

    doc.text("DOC. RELACIO. : " + arrays.doc_relacionados, 510, linea, "left");
    linea = linea + 4;
  }

  if (
    arrays.modo_transporte_desc == "PUBLICO" &&
    arrays.tipo_comprobante != "31"
  ) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    doc.text("N° Reg. MTC : " + String(arrays.registro_mtc), 10, linea, "left");
    linea = linea + 4 * texto.length;

    doc.text("RUC EMP.T.: " + String(arrays.ruc_transporte), 10, linea, "left");
    linea = linea + 4 * texto.length;

    doc.text(
      "R.S: " + String(arrays.razonsocial_transporte),
      10,
      linea,
      "left"
    );
    linea = linea + 4 * texto.length;
  }

  linea = linea + 2;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE REMITENTE : ", 10, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 47, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [[""]],
    body: [[arrays.ruc_remitente], [arrays.razonsocial_remitente]],
  });
  let finalYsss = doc.previousAutoTable.finalY;
  linea = finalYsss + 5;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE DESTINATARIO : ", 10, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 47, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [[""]],
    body: [[arrays.ruc_destinatario], [arrays.razonsocial_destinatario]],
  });
  let finalYsssS = doc.previousAutoTable.finalY;
  linea = finalYsssS + 6;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("INFORMACION DIRECCION : ", 10, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 47, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [[""]],
    body: [
      [
        "Partida : " +
          arrays.dir_origen +
          " " +
          arrays.distrito_p +
          " " +
          arrays.provincia_p +
          " " +
          arrays.departamento_p,
      ],
      [
        "Llegada : " +
          arrays.dir_destino +
          " " +
          arrays.distrito_l +
          " " +
          arrays.provincia_l +
          " " +
          arrays.departamento_l,
      ],
    ],
  });
  let finalYsssS3 = doc.previousAutoTable.finalY;
  linea = finalYsssS3 + 6;

  var listas = arrays.array_vehiculo;

  if (listas != undefined) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    doc.text("DATOS DE TRANSPORTE : ", 10, linea, "left");
    linea = linea + 1;
    var nuevoArray2 = new Array(listas.length);
    for (var i = 0; i < listas.length; i++) {
      nuevoArray2[i] = new Array(3);
      nuevoArray2[i][0] = i + 1;
      nuevoArray2[i][1] = listas[i].placa;
      nuevoArray2[i][2] = listas[i].num_habilitacion;
      nuevoArray2[i][3] = listas[i].autorizacion;
      nuevoArray2[i][4] = listas[i].emisor_autori;
    }
    doc.autoTable({
      startY: linea,
      margin: { top: 5, left: 4 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 5, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 13, halign: "center" },
        2: { columnWidth: 29, halign: "center" },
      },
      theme: ["plain"],
      head: [["N°", "Placa", "N° Hab.vehic."]],
      body: nuevoArray2,
    });

    let finalYss = doc.previousAutoTable.finalY;

    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    finalYss = finalYss + 4;
    doc.text("DATOS DE CONDUCTOR : ", 10, finalYss, "left");

    var listas2 = arrays.array_conductor;

    var nuevoArray3 = new Array(listas2.length);
    var nuevoArray4 = new Array(listas2.length);
    for (var i = 0; i < listas2.length; i++) {
      nuevoArray3[i] = new Array(3);
      nuevoArray4[i] = new Array(3);
      nuevoArray3[i][0] = i + 1;
      nuevoArray3[i][1] = listas2[i].num_doc_conductor;
      nuevoArray4[i][0] = listas2[i].nom_conductor;
      nuevoArray4[i][1] = listas2[i].num_licencia;
    }

    doc.autoTable({
      startY: finalYss + 3,
      margin: { top: 5, left: 4 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 10, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 37, halign: "center" },
      },
      theme: ["plain"],
      head: [["N°", "N°Doc"]],
      body: nuevoArray3,
    });

    let finalYssss = doc.previousAutoTable.finalY;

    doc.autoTable({
      startY: finalYssss + 3,
      margin: { top: 5, left: 4 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 27, halign: "center" },
        1: { columnWidth: 20, halign: "center" },
      },
      theme: ["plain"],
      head: [["Nombre", "Licencia"]],
      body: nuevoArray4,
    });

    let finalYs = doc.previousAutoTable.finalY;

    linea = finalYs + 4.5;
  }
  doc.setFont("Helvetica", "Bold");
  doc.text("REMITIMOS A UD.(ES):", 5, linea, "left");
  linea = linea + 3;
  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(5);
    console.log(array[i]);
    nuevoArray[i][0] = array[i].descripcion;
    nuevoArray[i][1] = array[i].cantidad;
    nuevoArray[i][2] = array[i].medida;
  }

  doc.autoTable({
    margin: { top: linea, left: 4 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 27, halign: "left" },
      1: { columnWidth: 10, halign: "center" },
      2: { columnWidth: 10, halign: "center" },
    },
    theme: ["plain"],
    head: [["PRODUCTO", "CANT", "MED"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 5;
  var lineaqr = linea;

  lineaqr = lineaqr + 5;
  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Representación Impresa de la GUIA DE REMISION ELECTRONICA" +
      " Consultar su validez en https://factura-peru.web.app//buscardocumentos",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3 * texto.length;

  doc.addImage(qr, "png", pdfInMM / 2 - 10, linea, 20, 20);
  linea = linea + 24;

  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize("Observaciones : ", 200);
  doc.text(texto, 5, linea, "left");
  linea = linea + 4;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arrays.observacion, 200);
  doc.text(texto, 5, linea, "left");
  linea = linea + 4 * texto.length;
  doc.text(".", 0, linea);
  //doc.text(numeros_a_letras(parseFloat(cuentatotal),'nominal',0,'CENTIMOS','SOLES'),0,linea)
  abre_dialogo_impresion(doc.output("bloburi"));
  //doc.save(arraycabe.serie + "-" + arraycabe.correlativo + '.pdf')
};

export const impresion80 = (arrays, qr) => {
  console.log(arrays);
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var array = arrays.data;
  var arraydatos = arrays;
  var arraycabe = arrays;
  var separacion =
    "-------------------------------------------------------------------------------------------------------------------";
  var fechaImpresion = moment
    .unix(arraycabe.fecha_emision)
    .format("DD/MM/YYYY hh:mm a");
  var fecha_traslado = moment.unix(arrays.fecha_traslado).format("DD/MM/YYYY");
  var pdfInMM = 75; // width of A4 in mm
  var lMargin = 4; //left margin in mm
  var rMargin = 2; //right margin in mm
  var pageCenter = pdfInMM / 2;
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [500, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = linea + 3;

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

  linea = linea + 3.5 * texto.length;

  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Ruc: " + store.state.baseDatos.ruc + "\n" + Direccion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center"); //RUC

  linea = linea + 3.5 * texto.length;

  if (store.state.configImpresora.cabecera != "") {
    linea = linea + 2;
    var texto = doc.splitTextToSize(
      store.state.configImpresora.cabecera,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }
  if (store.state.configImpresora.telefono != "") {
    linea = linea + 1;
    var texto = doc.splitTextToSize(
      "Telf: " + store.state.configImpresora.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 3.5 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 5;
  if (arraydatos.tipo_comprobante == "09") {
    var texto = doc.splitTextToSize(
      "GUIA DE REMISION REMITENTE",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
  } else {
    var texto = doc.splitTextToSize(
      "GUIA DE REMISION TRANSPORTISTA",
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
  }

  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(
    arraycabe.serie + "-" + arraycabe.correlativo,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fechaImpresion,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 4;

  var texto = doc.splitTextToSize(
    "TRASLADO: " + fecha_traslado,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 4;

  var medida = "KG";
  if (arrays.medida_t != undefined) {
    medida = arrays.medida_t;
  }

  doc.setFont("Helvetica", "");
  doc.text(
    "Peso Bruto: " + String(arrays.peso_total) + " " + medida,
    10,
    linea,
    "left"
  );
  linea = linea + 4;

  if (arrays.tipo_comprobante == "09") {
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize("MOT TRASLADO: " + arrays.motivo, 63);
    doc.text(texto, 10, linea, "left");

    linea = linea + 4 * texto.length;

    doc.text(
      "MODO TRANSPORTE: " + arrays.modo_transporte_desc,
      10,
      linea,
      "left"
    );
    linea = linea + 4;
  } else {
    doc.setFont("Helvetica", "");
    doc.text("Pagador Flete : " + arrays.pagado_por, 10, linea, "left");
    linea = linea + 4;

    doc.text("DOC. RELACIO. : " + arrays.doc_relacionados, 10, linea, "left");
    linea = linea + 4;
  }

  if (
    arrays.modo_transporte_desc == "PUBLICO" &&
    arrays.tipo_comprobante != "31"
  ) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");

    var texto = doc.splitTextToSize(
      "N° Reg. MTC : " + String(arrays.registro_mtc),
      65
    );
    doc.text(texto, 10, linea, "left");

    linea = linea + 4 * texto.length;

    doc.text("RUC EMP.T.: " + String(arrays.ruc_transporte), 10, linea, "left");
    linea = linea + 4 * texto.length;

    var texto = doc.splitTextToSize(
      "R.S: " + String(arrays.razonsocial_transporte),
      60
    );
    doc.text(texto, 10, linea, "left");
    linea = linea + 4 * texto.length;
  }

  linea = linea + 2;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE REMITENTE : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 66, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [[""]],
    body: [[arrays.ruc_remitente], [arrays.razonsocial_remitente]],
  });
  let finalYsss = doc.previousAutoTable.finalY;
  linea = finalYsss + 5;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE DESTINATARIO : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 66, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [[""]],
    body: [[arrays.ruc_destinatario], [arrays.razonsocial_destinatario]],
  });
  let finalYsssS = doc.previousAutoTable.finalY;
  linea = finalYsssS + 6;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("INFORMACION DIRECCION : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 4 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 18, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 48, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [["", ""]],
    body: [
      [
        "PARTIDA : ",
        arrays.dir_origen +
          " " +
          arrays.distrito_p +
          " " +
          arrays.provincia_p +
          " " +
          arrays.departamento_p,
      ],
      [
        "LLEGADA : ",
        arrays.dir_destino +
          " " +
          arrays.distrito_l +
          " " +
          arrays.provincia_l +
          " " +
          arrays.departamento_l,
      ],
    ],
  });
  let finalYsssS3 = doc.previousAutoTable.finalY;
  linea = finalYsssS3 + 6;

  var listas = arrays.array_vehiculo;

  if (listas != undefined) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    doc.text("DATOS DE TRANSPORTE : ", 15, linea, "left");
    linea = linea + 1;
    var nuevoArray2 = new Array(listas.length);
    for (var i = 0; i < listas.length; i++) {
      nuevoArray2[i] = new Array(3);
      nuevoArray2[i][0] = i + 1;
      nuevoArray2[i][1] = listas[i].placa;
      nuevoArray2[i][2] = listas[i].num_habilitacion;
      nuevoArray2[i][3] = listas[i].autorizacion;
      nuevoArray2[i][4] = listas[i].emisor_autori;
    }
    doc.autoTable({
      startY: linea,
      margin: { top: 5, left: 4 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 6, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 21, halign: "center" },
        2: { columnWidth: 39, halign: "center" },
      },
      theme: ["plain"],
      head: [["N°", "Placa", "T.Unica Circulacion"]],
      body: nuevoArray2,
    });

    let finalYss = doc.previousAutoTable.finalY;

    var listas2 = arrays.array_conductor;

    var nuevoArray3 = new Array(listas2.length);
    for (var i = 0; i < listas2.length; i++) {
      nuevoArray3[i] = new Array(3);
      nuevoArray3[i][0] = i + 1;
      nuevoArray3[i][1] = listas2[i].num_doc_conductor;
      nuevoArray3[i][2] = listas2[i].nom_conductor;
      nuevoArray3[i][3] = listas2[i].num_licencia;
    }

    doc.autoTable({
      startY: finalYss + 5,
      margin: { top: 5, left: 4 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 6, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 14, halign: "center" },
        2: { columnWidth: 26, halign: "center" },
        3: { columnWidth: 20, halign: "center" },
      },
      theme: ["plain"],
      head: [["N°", "N°Doc", "Nombre", "Licencia"]],
      body: nuevoArray3,
    });

    let finalYs = doc.previousAutoTable.finalY;

    linea = finalYs + 4.5;
  }
  doc.setFont("Helvetica", "Bold");
  doc.text("REMITIMOS A UD.(ES) LO SIGUIENTE:", 15, linea, "left");
  linea = linea + 3;
  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(5);
    console.log(array[i]);
    nuevoArray[i][0] = array[i].descripcion;
    nuevoArray[i][1] = array[i].cantidad;
    nuevoArray[i][2] = array[i].medida;
  }

  doc.autoTable({
    margin: { top: linea, left: 4 },
    styles: {
      fontSize: 7.5,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0.2, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 46, halign: "left" },
      1: { columnWidth: 10, halign: "center" },
      2: { columnWidth: 10, halign: "center" },
    },
    theme: ["plain"],
    head: [["PRODUCTO", "CANT", "MED"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 5;
  var lineaqr = linea;

  lineaqr = lineaqr + 5;
  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Representación Impresa de la GUIA DE REMISION ELECTRONICA" +
      " Consultar su validez en https://factura-peru.web.app//buscardocumentos",
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3 * texto.length;

  doc.addImage(qr, "png", pdfInMM / 2 - 10, linea, 20, 20);
  linea = linea + 24;

  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize("Observaciones : ", 200);
  doc.text(texto, 5, linea, "left");
  linea = linea + 4;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arrays.observacion, 200);
  doc.text(texto, 5, linea, "left");
  linea = linea + 4 * texto.length;
  doc.text(".", 0, linea);
  //doc.text(numeros_a_letras(parseFloat(cuentatotal),'nominal',0,'CENTIMOS','SOLES'),0,linea)
  abre_dialogo_impresion(doc.output("bloburi"));
  //doc.save(arraycabe.serie + "-" + arraycabe.correlativo + '.pdf')
};
function impresionA4(arrays, qr) {
  console.log(arrays);
  var linea = parseInt(store.state.configImpresora.msuperior);
  var Direccion =
    store.state.baseDatos.direccion +
    "-" +
    store.state.baseDatos.distrito +
    "-" +
    store.state.baseDatos.provincia +
    "-" +
    store.state.baseDatos.departamento;
  var imagen = store.state.logoempresa;
  var array = arrays.data;

  var fecha_emision = moment.unix(arrays.fecha_emision).format("DD/MM/YYYY");
  var fecha_traslado = moment.unix(arrays.fecha_traslado).format("DD/MM/YYYY");
  var pdfInMM = 210; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = linea + 3;

  if (imagen != "") {
    doc.rect(10, 10, 29, 29);
    doc.addImage("data:image/png;base64," + imagen, "png", 12, 12, 26, 26);
    linea = linea + 15;

    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(9.5);
    var texto = doc.splitTextToSize(store.state.baseDatos.name, 80);
    doc.text(texto, 55, linea, "left"); //EMPRESA

    linea = linea + 4 * texto.length;

    /*if (cabecera != '') {
      doc.setFont('Helvetica', '');
      doc.setFontSize(8)
      var texto = doc.splitTextToSize(cabecera, 70);
      doc.text(texto, 55, linea, 'left'); //CABECERA
      linea = linea + (4 * texto.length)
    }*/

    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    var texto = doc.splitTextToSize(Direccion, 70);
    doc.text(texto, 55, linea, "left"); //direccion

    linea = linea + 4 * texto.length;
    if (telefono != "") {
      doc.setFont("Helvetica", "");
      doc.setFontSize(8);
      var texto = doc.splitTextToSize("TELEFONO: " + telefono, 70);
      doc.text(texto, 55, linea, "left"); //TELEFONO EMPRESA
    }
  } else {
    linea = linea + 15;
    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(15);
    var texto = doc.splitTextToSize(store.state.baseDatos.name, 100);
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
  doc.text(texto, 170, 16, "center");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize("GUIA DE REMISIÓN", 50);
  doc.text(texto, 170, 20, "center");
  if (arrays.tipo_comprobante == "09") {
    var texto = doc.splitTextToSize("REMITENTE", 50);
    doc.text(texto, 170, 24, "center");
  } else {
    var texto = doc.splitTextToSize("TRANSPORTISTA", 50);
    doc.text(texto, 170, 24, "center");
  }

  doc.setFontSize(9);
  var texto = doc.splitTextToSize(arrays.id, 50);
  doc.text(texto, 170, 28, "center");
  if (arrays.tipo_comprobante != "09") {
    doc.setFontSize(7.5);
    var texto = doc.splitTextToSize(
      "REGISTRO MTC : " + arrays.registro_mtc,
      50
    );
    doc.text(texto, 170, 33, "center");
  }
  doc.setFontSize(8);
  doc.setLineWidth(0.3);
  doc.rect(10, 42, 190, 20);

  linea = 46;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA EMISION", 15, linea, "left");
  doc.text(" : ", 46, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fecha_emision, 50, linea, "left");
  linea = linea + 4;

  var medida = "KG";
  if (arrays.medida_t != undefined) {
    medida = arrays.medida_t;
  }
  doc.setFont("Helvetica", "Bold");
  doc.text("Peso Bruto", 130, linea, "left");
  doc.text(" : ", 154, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(String(arrays.peso_total) + " " + medida, 157, linea, "left");

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA TRASLADO", 15, linea, "left");
  doc.text(" : ", 46, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fecha_traslado, 50, linea, "left");
  linea = linea + 5;
  if (arrays.tipo_comprobante == "09") {
    doc.setFont("Helvetica", "Bold");
    doc.text("MOTIVO TRASLADO", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(arrays.motivo, 50, linea, "left");
    linea = linea + 4;

    doc.setFont("Helvetica", "Bold");
    doc.text("MODO TRANSPORTE", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(arrays.modo_transporte_desc, 50, linea, "left");
    linea = linea + 4;
  } else {
    doc.setFont("Helvetica", "Bold");
    doc.text("PAGADOR FLETE", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(arrays.pagado_por, 50, linea, "left");
    linea = linea + 4;

    doc.setFont("Helvetica", "Bold");
    doc.text("DOC. RELACIONADOS", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(arrays.doc_relacionados, 50, linea, "left");
    linea = linea + 4;
  }

  if (arrays.trans_sub && arrays.tipo_comprobante == "31") {
    doc.setFontSize(8);
    doc.setLineWidth(0.3);
    doc.rect(10, 65, 190, 13);
    linea = 70;

    doc.setFont("Helvetica", "Bold");
    doc.text("RUC SUBCONTRATA", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.ruc_subcontrata, 150);
    doc.text(texto, 50, linea, "left");
    linea = linea + 4 * texto.length;

    doc.setFont("Helvetica", "Bold");
    doc.text("RAZON SOCIAL", 15, linea, "left");
    doc.text(" : ", 46, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.razon_subcontrata, 150);
    doc.text(texto, 50, linea, "left");
    linea = linea + 4 * texto.length;
  }
  if (
    arrays.modo_transporte_desc == "PUBLICO" &&
    arrays.tipo_comprobante != "31"
  ) {
    doc.setFontSize(8);
    doc.setLineWidth(0.3);
    doc.rect(10, 65, 190, 13);
    linea = 70;
    var lineas = linea + 3.5 * texto.length;
    doc.setFont("Helvetica", "Bold");
    doc.text("N° Reg. MTC", 130, lineas, "left");
    doc.text(" : ", 154, lineas, "left");
    doc.setFont("Helvetica", "");
    doc.text(String(arrays.registro_mtc), 157, lineas, "left");

    doc.setFont("Helvetica", "Bold");
    doc.text("RUC EMP. TRANSP.", 15, linea, "left");
    doc.text(" : ", 42, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.ruc_transporte, 150);
    doc.text(texto, 46, linea, "left");
    linea = linea + 4 * texto.length;

    doc.setFont("Helvetica", "Bold");
    doc.text("RAZON SOCIAL", 15, linea, "left");
    doc.text(" : ", 42, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.razonsocial_transporte, 150);
    doc.text(texto, 46, linea, "left");
    linea = linea + 4 * texto.length;
  }

  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE REMITENTE : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 45, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 145, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [["", ""]],
    body: [
      ["RUC : ", arrays.ruc_remitente],
      ["RAZON SOCIAL : ", arrays.razonsocial_remitente],
    ],
  });
  let finalYsss = doc.previousAutoTable.finalY;
  linea = finalYsss + 5;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("DATOS DE DESTINATARIO : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 45, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 145, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [["", ""]],
    body: [
      ["RUC : ", arrays.ruc_destinatario],
      ["RAZON SOCIAL : ", arrays.razonsocial_destinatario],
    ],
  });
  let finalYsssS = doc.previousAutoTable.finalY;
  linea = finalYsssS + 6;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("INFORMACION DIRECCION : ", 15, linea, "left");

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 45, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 145, halign: "left", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [["", ""]],
    body: [
      [
        "DIR. PARTIDA : ",
        arrays.dir_origen +
          " " +
          arrays.distrito_p +
          " " +
          arrays.provincia_p +
          " " +
          arrays.departamento_p,
      ],
      [
        "DIR. LLEGADA : ",
        arrays.dir_destino +
          " " +
          arrays.distrito_l +
          " " +
          arrays.provincia_l +
          " " +
          arrays.departamento_l,
      ],
    ],
  });
  let finalYsssS3 = doc.previousAutoTable.finalY;
  linea = finalYsssS3 + 6;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("INFORMACION TRASLADO : ", 15, linea, "left");
  var retorno_vacio = "NO";
  var retorno_envaces = "NO";
  var programado = "NO";
  var vehic_m1 = "NO";
  var traslado_total = "NO";
  if (arrays.retorno_vacio) {
    retorno_vacio = "SI";
  }
  if (arrays.retorno_envaces) {
    retorno_envaces = "SI";
  }
  if (arrays.programado) {
    programado = "SI";
  }
  if (arrays.vehic_m1) {
    vehic_m1 = "SI";
  }
  if (arrays.traslado_total) {
    traslado_total = "SI";
  }

  doc.autoTable({
    startY: linea - 3,
    margin: { top: 5, left: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: { lineWidth: 0, lineColor: 1 },
    columnStyles: {
      0: { columnWidth: 47, halign: "left", fontStyle: "bold" },
      1: { columnWidth: 16, halign: "center", fontStyle: "bold" },
      2: { columnWidth: 48, halign: "left", fontStyle: "bold" },
      3: { columnWidth: 16, halign: "center", fontStyle: "bold" },
      4: { columnWidth: 47, halign: "left", fontStyle: "bold" },
      5: { columnWidth: 16, halign: "center", fontStyle: "bold" },
    },
    theme: ["plain"],
    head: [["", "", "", "", "", ""]],
    body: [
      [
        "Retorno Vehiculo Vacio : ",
        retorno_vacio,
        "Retorno Envases Vacios : ",
        retorno_envaces,
        "Transbordo Programado : ",
        programado,
      ],
      [
        "Vehiculo Categoria M1 o L : ",
        vehic_m1,
        "Traslado Total(DAM O DS) : ",
        traslado_total,
      ],
    ],
  });
  let finalYsssS4 = doc.previousAutoTable.finalY;
  linea = finalYsssS4 + 6;

  var listas = arrays.array_vehiculo;

  if (listas != undefined) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    doc.text("DATOS DE TRANSPORTE : ", 15, linea, "left");
    linea = linea + 1;
    var nuevoArray2 = new Array(listas.length);
    for (var i = 0; i < listas.length; i++) {
      nuevoArray2[i] = new Array(3);
      nuevoArray2[i][0] = i + 1;
      nuevoArray2[i][1] = listas[i].placa;
      nuevoArray2[i][2] = listas[i].num_habilitacion;
      nuevoArray2[i][3] = listas[i].autorizacion;
      nuevoArray2[i][4] = listas[i].emisor_autori;
    }
    doc.autoTable({
      startY: linea,
      margin: { top: 5, left: 10 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 8, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 30, halign: "center" },
        2: { columnWidth: 53, halign: "center" },
        3: { columnWidth: 54, halign: "center" },
        4: { columnWidth: 45, halign: "center" },
      },
      theme: ["plain"],
      head: [
        [
          "N°",
          "Placa",
          "T.Unica Circulacion",
          "Autorizacion Espc.",
          "Autoridad Emisora",
        ],
      ],
      body: nuevoArray2,
    });

    let finalYss = doc.previousAutoTable.finalY;

    var listas2 = arrays.array_conductor;

    var nuevoArray3 = new Array(listas2.length);
    for (var i = 0; i < listas2.length; i++) {
      nuevoArray3[i] = new Array(3);
      nuevoArray3[i][0] = i + 1;
      nuevoArray3[i][1] = listas2[i].num_doc_conductor;
      nuevoArray3[i][2] = listas2[i].nom_conductor;
      nuevoArray3[i][3] = listas2[i].num_licencia;
    }

    doc.autoTable({
      startY: finalYss + 5,
      margin: { top: 5, left: 10 },
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 8, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 30, halign: "center" },
        2: { columnWidth: 107, halign: "center" },
        3: { columnWidth: 45, halign: "center" },
      },
      theme: ["plain"],
      head: [["N°", "N°Doc", "Nombre", "Licencia"]],
      body: nuevoArray3,
    });

    let finalYs = doc.previousAutoTable.finalY;

    linea = finalYs + 4.5;
  }
  doc.setFont("Helvetica", "Bold");
  doc.text("REMITIMOS A UD.(ES) LO SIGUIENTE:", 15, linea, "left");
  linea = linea + 3;
  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    nuevoArray[i] = new Array(5);
    nuevoArray[i][0] = array[i].cod_producto + " - " + array[i].descripcion;
    nuevoArray[i][1] = array[i].cantidad;
    nuevoArray[i][2] = array[i].medida;
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
      0: { columnWidth: 140, halign: "left" },
      1: { columnWidth: 25, halign: "center" },
      2: { columnWidth: 25, halign: "center" },
    },
    theme: ["plain"],
    head: [["PRODUCTO", "CANTIDAD", "MEDIDA"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 5;
  var lineaqr = linea;

  doc.addImage(qr, "png", 10, lineaqr, 25, 25);

  lineaqr = lineaqr + 5;
  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Representación Impresa de la GUIA ELECTRONICA",
    150
  );
  doc.text(texto, 40, lineaqr, "left");
  lineaqr = lineaqr + 4;
  var texto = doc.splitTextToSize(
    "Consultar su validez en : https://factura-peru.web.app/buscardocumento",
    150
  );
  doc.text(texto, 40, lineaqr, "left");
  lineaqr = lineaqr + 4;
  doc.setFont("Helvetica", "Bold");
  var texto = doc.splitTextToSize("Observaciones : ", 200);
  doc.text(texto, 40, lineaqr, "left");
  lineaqr = lineaqr + 4;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arrays.observacion, 200);
  doc.text(texto, 40, lineaqr, "left");
  linea = linea + 4 * texto.length;
  doc.text(".", 0, linea);
  //doc.text(numeros_a_letras(parseFloat(cuentatotal),'nominal',0,'CENTIMOS','SOLES'),0,linea)
  abre_dialogo_impresion(doc.output("bloburi"));
}
export const generaQR = (array) => {
  if (array.qr == undefined) {
    array.qr = "";
  }

  var imgData = QR.drawImg(array.qr, {
    typeNumber: 4,
    errorCorrectLevel: "M",
    size: 600,
  });
  return imgData;
};
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
