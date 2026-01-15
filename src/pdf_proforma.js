import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";

import moment from "moment";
import "jspdf-autotable";
import imageToBase64 from "image-to-base64/browser";
import QR from "qrcode-base64";
import numeros_a_letras from "numeros_a_letras";

export const generaproforma = (array, formato) => {
  switch (formato) {
    case "A4":
      impresionA4(array);
      break;
    case "80":
      impresion80(array);
      break;
    case "58":
      impresion58(array);
      break;
  }
};
function impresion58(arrays) {
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
  var fecha_emision = moment.unix(arrays.fecha_emision).format("DD/MM/YYYY");
  var fecha_vencimiento = moment
    .unix(arrays.fecha_vencimiento)
    .format("DD/MM/YYYY");
  var array = arrays.data;
  var total = arrays.total;

  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = 2; //left margin in mm
  var rMargin = 1; //right margin in mm
  var pdfInMM = 55; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var piepagina = store.state.configImpresora.piepagina;
  var telefono = store.state.configImpresora.telefono;
  var pageCenter = pdfInMM / 2;
  var serie = "P001-" + arrays.id;
  var moneda = arrays.moneda || "S/";
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
  var texto = doc.splitTextToSize("PROFORMA", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(serie, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fecha_emision,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  /*--------------datos cliente--------------------*/

  var texto = doc.splitTextToSize(
    "Nombre   : " + arrays.nom_cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arrays.num_cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  if (arrays.dir_cliente != "") {
    var texto = doc.splitTextToSize(
      "Direccion: " + arrays.dir_cliente,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3 * texto.length;
  }

  if (arrays.observacion != "") {
    var texto = doc.splitTextToSize(
      "Observacion: " + arrays.observacion,
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
  // Detectar si existe algún descuento y si el permiso está activo
  const permisoDescuento = store.state.configuracion && store.state.configuracion.desc_porcentaje_catalogo;
  const existeDescuento = permisoDescuento && array.some(
    (it) =>
      (Number(it.desc_1) > 0 || Number(it.desc_2) > 0 || Number(it.desc_3) > 0)
  );
  
  var operacionexonerada = 0;
  var operaciongravada = 0;
  var nuevoArray = [];
  
  for (var i = 0; i < array.length; i++) {
    var descuento = parseFloat(array[i].preciodescuento || 0);
    var textoDescuento = existeDescuento
      ? `${array[i].desc_1 || 0} / ${array[i].desc_2 || 0} / ${array[i].desc_3 || 0}`
      : null;
    
    if (!existeDescuento) {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre + "\n" + "- " + moneda + array[i].precioedita + " X " + array[i].medida,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(store.state.configuracion.decimal)
      ]);
    } else {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre + "\n" + "- " + moneda + array[i].precioedita + " X " + array[i].medida,
        textoDescuento,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(store.state.configuracion.decimal)
      ]);
    }
    
    if (array[i].operacion == "EXONERADA") {
      operacionexonerada =
        parseFloat(operacionexonerada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
    if (array[i].operacion == "GRAVADA") {
      operaciongravada =
        parseFloat(operaciongravada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
  }
  
  // Cabeceras y estilos según si hay descuentos
  const headSinDesc = [["Cant", "Descripcion", "P.T"]];
  const headConDesc = [["Cant", "Descripcion", "%Desc", "P.T"]];
  
  const columnStylesSinDesc = {
    0: { columnWidth: 8, halign: "center" },
    1: { columnWidth: 30, halign: "left" },
    2: { columnWidth: 11, halign: "right" },
  };
  
  const columnStylesConDesc = {
    0: { columnWidth: 7, halign: "center" },
    1: { columnWidth: 23, halign: "left" },
    2: { columnWidth: 12, halign: "center" },
    3: { columnWidth: 9, halign: "right" },
  };

  doc.autoTable({
    margin: { top: linea - 9, left: 0 },
    styles: {
      fontSize: 7,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: existeDescuento ? columnStylesConDesc : columnStylesSinDesc,
    theme: ["plain"],
    head: existeDescuento ? headConDesc : headSinDesc,
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  doc.setFont("Helvetica", "");
  doc.setFontSize(7);

  doc.text("OP. GRAVADA", lMargin, linea);
  doc.text(
    moneda + (parseFloat(operaciongravada) / 1.18).toFixed(2).toString(),
    50,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("OP. EXONERADA", lMargin, linea);
  doc.text(
    moneda + operacionexonerada.toFixed(2).toString().toString(),
    50,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("IGV 18%", lMargin, linea);
  doc.text(
    moneda +
    ((parseFloat(operaciongravada) / 1.18) * 0.18).toFixed(2).toString(),
    50,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("Total", lMargin, linea);
  doc.text(moneda + total, 50, linea, "right");
  linea = linea + 3.5;

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  doc.setFontSize(7);

  linea = linea + parseFloat(store.state.configImpresora.minferiorgeneral);
  // console.log("aqui"+store.state.configImpresora.minferiorgeneral)
  doc.text(".", 0, linea);
  abre_dialogo_impresion(doc.output("bloburi"));
}
function impresion80(arrays) {
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
  var fecha_emision = moment.unix(arrays.fecha_emision).format("DD/MM/YYYY");
  var fecha_vencimiento = moment
    .unix(arrays.fecha_vencimiento)
    .format("DD/MM/YYYY");
  var array = arrays.data;
  var total = arrays.total;

  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = 3.5; //left margin in mm
  var rMargin = 2; //right margin in mm
  var pdfInMM = 75; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var piepagina = store.state.configImpresora.piepagina;
  var telefono = store.state.configImpresora.telefono;
  var pageCenter = pdfInMM / 2;
  var serie = "P001-" + arrays.id;
  var moneda = arrays.moneda || "S/";
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

  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  var texto = doc.splitTextToSize("PROFORMA", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(serie, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  var texto = doc.splitTextToSize(
    "EMISION: " + fecha_emision,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 5;

  /*--------------datos cliente--------------------*/

  var texto = doc.splitTextToSize(
    "Nombre   : " + arrays.nom_cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arrays.num_cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  if (arrays.dir_cliente != "") {
    var texto = doc.splitTextToSize(
      "Direccion: " + arrays.dir_cliente,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3 * texto.length;
  }

  if (arrays.observacion != "") {
    var texto = doc.splitTextToSize(
      "Observacion: " + arrays.observacion,
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
  // Detectar si existe algún descuento y si el permiso está activo
  const permisoDescuento = store.state.configuracion && store.state.configuracion.desc_porcentaje_catalogo;
  const existeDescuento = permisoDescuento && array.some(
    (it) =>
      (Number(it.desc_1) > 0 || Number(it.desc_2) > 0 || Number(it.desc_3) > 0)
  );
  
  var operacionexonerada = 0;
  var operaciongravada = 0;
  var nuevoArray = [];
  
  for (var i = 0; i < array.length; i++) {
    var tg = "";
    var obs = "";
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / TG: " + moneda + array[i].valor_total;
      array[i].precioedita = "0.00";
    }
    var descuento = parseFloat(array[i].preciodescuento || 0);
    
    var textoDescuento = existeDescuento
      ? `${array[i].desc_1 || 0} / ${array[i].desc_2 || 0} / ${array[i].desc_3 || 0}`
      : null;
    
    if (!existeDescuento) {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre + "\n" + "-" + array[i].medida,
        array[i].precioedita,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(store.state.configuracion.decimal)
      ]);
    } else {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre + "\n" + "-" + array[i].medida,
        array[i].precioedita,
        textoDescuento,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(store.state.configuracion.decimal)
      ]);
    }
    
    if (array[i].operacion == "EXONERADA") {
      operacionexonerada =
        parseFloat(operacionexonerada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
    if (array[i].operacion == "GRAVADA") {
      operaciongravada =
        parseFloat(operaciongravada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
  }
  
  // Cabeceras y estilos según si hay descuentos
  const headSinDesc = [["Cant", "Descripcion", "P.U", "P.T"]];
  const headConDesc = [["Cant", "Descripcion", "P.U", "%Desc", "P.T"]];
  
  const columnStylesSinDesc = {
    0: { columnWidth: 8, halign: "center" },
    1: { columnWidth: 35, halign: "left" },
    2: { columnWidth: 12, halign: "right" },
    3: { columnWidth: 12, halign: "right" },
  };
  
  const columnStylesConDesc = {
    0: { columnWidth: 8, halign: "center" },
    1: { columnWidth: 27, halign: "left" },
    2: { columnWidth: 10, halign: "right" },
    3: { columnWidth: 14, halign: "center" },
    4: { columnWidth: 10, halign: "right" },
  };

  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: {
      fontSize: 7.5,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: existeDescuento ? columnStylesConDesc : columnStylesSinDesc,
    theme: ["plain"],
    head: existeDescuento ? headConDesc : headSinDesc,
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  doc.setFont("Helvetica", "");

  doc.text("OP. GRAVADA", lMargin, linea);
  doc.text(
    moneda + (parseFloat(operaciongravada) / 1.18).toFixed(2).toString(),
    68,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("OP. EXONERADA", lMargin, linea);
  doc.text(
    moneda + operacionexonerada.toFixed(2).toString().toString(),
    68,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("IGV 18%", lMargin, linea);
  doc.text(
    moneda +
    ((parseFloat(operaciongravada) / 1.18) * 0.18).toFixed(2).toString(),
    68,
    linea,
    "right"
  );
  linea = linea + 3.5;

  doc.text("Total", lMargin, linea);
  doc.text(moneda + total, 68, linea, "right");
  linea = linea + 3.5;

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");

  if (store.state.configImpresora.mensaje_final_proforma != "") {
    linea = linea + 7;
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(
      store.state.configImpresora.mensaje_final_proforma,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
  }
  linea = linea + parseFloat(store.state.configImpresora.minferiorgeneral);
  // console.log("aqui"+store.state.configImpresora.minferiorgeneral)
  doc.text(".", 0, linea);
  abre_dialogo_impresion(doc.output("bloburi"));
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

function impresionA4(arrays) {
  var linea = parseInt(store.state.configImpresora.msuperior);
  var nombreEmpresa = store.state.baseDatos.name;
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
  var serie = "P001-" + arrays.id;
  var array = arrays.data;
  var total = arrays.total;
  var totalDesc = 0;
  var fecha_emision = moment.unix(arrays.fecha_emision).format("DD/MM/YYYY");
  var fecha_vencimiento = moment
    .unix(arrays.fecha_vencimiento)
    .format("DD/MM/YYYY");

  //formato de pagina de PF
  var guardadocumento = store.state.configImpresora.guardadocumento;
  var lMargin = store.state.configImpresora.lMargin; //left margin in mm
  var rMargin = store.state.configImpresora.rMargin; //right margin in mm
  var pdfInMM = 210; // width of A4 in mm
  var cabecera = store.state.configImpresora.cabecera;
  var telefono = store.state.configImpresora.telefono;
  var bancos = store.state.bancos;
  var moneda = arrays.moneda || "S/";
  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [297, pdfInMM],
  });

  doc.text(".", -1, linea);
  linea = 4;

  if (imagen != "") {
    doc.rect(10, 10, 30, 30);
    doc.addImage("data:image/png;base64," + imagen, "png", 12, 12, 26, 26);
    linea = linea + 10;

    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(9.5);
    var texto = doc.splitTextToSize(nombreEmpresa, 80);
    doc.text(texto, 55, linea, "left"); //EMPRESA

    linea = linea + 4 * texto.length;

    if (cabecera != "") {
      doc.setFont("Helvetica", "");
      doc.setFontSize(8);
      var texto = doc.splitTextToSize(cabecera, 70);
      doc.text(texto, 55, linea, "left"); //CABECERA
      linea = linea + 4 * texto.length;
    }

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
    linea = linea + 10;
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
  var texto = doc.splitTextToSize(Ruc, 50);
  doc.text(texto, 170, 18, "center");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize("PROFORMA", 50);
  doc.text(texto, 170, 22, "center");
  doc.setFontSize(10);
  var texto = doc.splitTextToSize(serie, 50);
  doc.text(texto, 170, 26, "center");

  doc.setFontSize(8);
  doc.setLineWidth(0.3);
  doc.rect(10, 40, 190, 20);
  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("SEÑORES", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arrays.nom_cliente, 85);
  doc.text(texto, 36, linea, "left");
  linea = linea + 3.5 * texto.length;

  doc.setFont("Helvetica", "Bold");
  doc.text("RUC", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(arrays.num_cliente, 36, linea, "left");
  linea = linea + 3.5;

  doc.setFont("Helvetica", "Bold");
  doc.text("DIRECCION", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(arrays.dir_cliente, 80);
  doc.text(texto, 36, linea, "left");
  linea = linea + 3.5 * texto.length;

  if (arrays.observacion.length < 100) {
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.observacion, 180);
    doc.text(texto, 36, linea, "left");
    linea = linea + 3.5 * texto.length;
  }

  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA EMISION", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fecha_emision, 167, linea, "left");
  linea = linea + 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA VENCIMIENTO", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fecha_vencimiento, 167, linea, "left");
  linea = linea + 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("CONDICIONES", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(arrays.modo_pago, 167, linea, "left");

  /*  doc.setFont('Helvetica','Bold');
    doc.text("MODO POGO",130,linea,'left');
    doc.text(" : ",164,linea,'left');
    doc.setFont('Helvetica','');
    doc.text(modopago,167,linea,'left');*/

  linea = 65;

  doc.setFont("Helvetica", "");
  doc.setFontSize(9);
  var texto = doc.splitTextToSize(
    "De nuestra consideración:" +
    "\n" +
    "Por medio de la presente y de acuerdo a los requerimientos, nos complace hacerles llegar nuestra propuesta:",
    200
  );
  doc.text(texto, 10, linea, "left"); //direccion
  linea = linea + 3.5 * texto.length;
  const permisoDescuento = store.state.configuracion && store.state.configuracion.desc_porcentaje_catalogo;
  const existeDescuento = permisoDescuento && array.some(
    (it) =>
      (Number(it.desc_1) > 0 || Number(it.desc_2) > 0 || Number(it.desc_3) > 0)
  );
  
  var operacionexonerada = 0;
  var operaciongravada = 0;
  var nuevoArray = [];
  
  for (var i = 0; i < array.length; i++) {
    if (array[i].operacion == "GRATUITA") {
      array[i].precioedita = "0.00";
    }
    var descuento = parseFloat(array[i].preciodescuento || 0);
    
    var textoDescuento = existeDescuento
      ? `${array[i].desc_1 || 0} / ${array[i].desc_2 || 0} / ${array[i].desc_3 || 0}`
      : null;
    
    if (!existeDescuento) {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre,
        array[i].medida,
        array[i].precioedita,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(2)
      ]);
    } else {
      nuevoArray.push([
        array[i].cantidad,
        array[i].nombre,
        array[i].medida,
        array[i].precioedita,
        textoDescuento,
        parseFloat(array[i].precioedita * array[i].cantidad).toFixed(2)
      ]);
    }
    
    if (array[i].operacion == "EXONERADA") {
      operacionexonerada =
        parseFloat(operacionexonerada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
    if (array[i].operacion == "GRAVADA") {
      operaciongravada =
        parseFloat(operaciongravada) +
        parseFloat(array[i].precioedita * array[i].cantidad) -
        descuento;
    }
  }
  
  const headSinDesc = [["Cantidad", "Descripcion", "Medida", "P.Unitario", "P.Total"]];
  const headConDesc = [["Cant", "Descripcion", "Medida", "P.Unitario", "%Desc", "P.Total"]];
  
  const columnStylesSinDesc = {
    0: { columnWidth: 20, halign: "center", fontStyle: "bold" },
    1: { columnWidth: 110, halign: "left" },
    2: { columnWidth: 20, halign: "center" },
    3: { columnWidth: 20, halign: "center" },
    4: { columnWidth: 20, halign: "center", fontStyle: "bold" },
  };
  
  const columnStylesConDesc = {
    0: { columnWidth: 15, halign: "center", fontStyle: "bold" },
    1: { columnWidth: 90, halign: "left" },
    2: { columnWidth: 18, halign: "center" },
    3: { columnWidth: 20, halign: "center" },
    4: { columnWidth: 22, halign: "center" },
    5: { columnWidth: 20, halign: "center", fontStyle: "bold" },
  };

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
    columnStyles: existeDescuento ? columnStylesConDesc : columnStylesSinDesc,
    theme: ["plain"],
    head: existeDescuento ? headConDesc : headSinDesc,
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 5;
  var lineaqr = linea;

  if (arrays.observacion.length >= 100) {
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(arrays.observacion, 95);
    doc.text(texto, 36, linea, "left");
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(130, linea, 70, 20);

  linea = linea + 5;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. GRAVADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda + (parseFloat(operaciongravada) / 1.18).toFixed(2).toString(),
    172,
    linea,
    "left"
  );
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. EXONERADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda + operacionexonerada.toFixed(2).toString(),
    172,
    linea,
    "left"
  );
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("IGV 18%", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda +
    ((parseFloat(operaciongravada) / 1.18) * 0.18).toFixed(2).toString(),
    172,
    linea,
    "left"
  );
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("TOTAL", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda +
    parseFloat(total - totalDesc)
      .toFixed(2)
      .toString(),
    172,
    linea,
    "left"
  );
  if (store.state.configImpresora.mensaje_final_proforma) {
    doc.setFont("Helvetica", "Bold");
    doc.text(
      store.state.configImpresora.mensaje_final_proforma,
      10,
      linea,
      "left"
    );
    linea = linea + 4;
  }
  if (bancos != "") {
    doc.autoTable({
      margin: { top: 10, left: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 25, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 25, halign: "center" },
        2: { columnWidth: 30, halign: "center" },
        3: { columnWidth: 30, halign: "center" },
      },
      theme: ["plain"],
      head: [["BANCO", "MONEDA", "CUENTA", "CCI"]],
      body: arraybancos(bancos),
    });
  }

  linea = linea + 15;
  doc.text(".", 0, linea);
  //doc.text(numeros_a_letras(parseFloat(cuentatotal),'nominal',0,'CENTIMOS','SOLES'),0,linea)

  abre_dialogo_impresion(doc.output("bloburi"));
}

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
