import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import QR from "qrcode-base64";
import moment from "moment";
import { NumerosALetras } from "numero-a-letras";
let modo_genera = "abre";
import axios from "axios";

let moneda = "S/";

function permite_impresion_host() {
  if (store?.state?.esmovil) return false;
  const tienePermiso = store?.state?.permisos?.permite_impresion_host === true;
  const tieneConfig = store?.state?.permisos?.config_impresion_host?.ip_dispositivo;
  return tienePermiso && tieneConfig;
}

async function abre_dialogo_impresion(doc) {
  try {
    if (!permite_impresion_host()) {
      abre_dialogo_impresion_original(doc);
      return;
    }
    
    const configHost = store?.state?.permisos?.config_impresion_host || {};
    const IP_PC = configHost.ip_dispositivo || "192.168.1.19";
    const PORT = configHost.puerto_dispositivo || 8090;
    const BRIDGE_URL = `http://${IP_PC}:${PORT}/bridge-pdf`;
    const token = store?.state?.configImpresora?.token_host || configHost.token || "1234";
    
    const meta = {
      bd: store?.state?.baseDatos?.bd || "",
      usuario: store?.state?.permisos?.nombre || "",
      tipo: "comprobante",
      ts: Date.now(),
    };
    
    const buffer = doc.output("arraybuffer");

    const ventana = window.open(
      BRIDGE_URL, 
      "_blank", 
      "width=500,height=400,menubar=no,toolbar=no,location=no,status=no"
    );
    
    if (!ventana) {
      alert("Permite ventanas emergentes para imprimir.");
      return;
    }
    
    const mensaje = { 
      type: "PRINT_PDF", 
      token, 
      printer: configHost.nombre_impresora || "POS-80-Series", 
      copies: 1,
      meta, 
      pdf: buffer 
    };
    
    const timer = setInterval(() => {
      try {
        ventana.postMessage(mensaje, "*", [buffer]);
        clearInterval(timer);

      } catch (e) {}
    }, 250);
    
  } catch (e) {
    console.error("Error impresión host:", e);
    abre_dialogo_impresion_original(doc);
  }
}

async function abre_dialogo_impresion_original(doc) {
  if (store.state.configImpresora.impresora_auto && isElectronEnv()) {
    console.log("⚡ Modo Electron detectado, usando axios_imp");
    axios_imp(doc.output("arraybuffer"));
    return;
  }
  
  var blob = doc.output("bloburi");
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
  if (w) {
    w.print();
  } else {
    console.error("❌ No se pudo abrir ventana de impresión");
  }
}
export const pdfGenera = (arraydatos, cabecera, medida, modo) => {
  //console.log(arraydatos, cabecera, medida, modo);
  moneda = cabecera.moneda || "S/";
  modo_genera = modo;
  var qrs = generaQR(cabecera);
  switch (medida) {
    case "A4":
      impresionA4(arraydatos, qrs, cabecera);
      break;
    case "A5":
      //impresionA5_vertical(arraydatos, qrs, cabecera);
      impresionA5_horizontal(arraydatos, qrs, cabecera);
      break;
    case "80":
      var resp = impresion80(arraydatos, qrs, cabecera);
      break;
    case "58":
      impresion58(arraydatos, qrs, cabecera);
      break;
  }
};
async function impresion58(arraydatos, qr, cabecera) {
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
  var lMargin = 2; //left margin in mm
  var rMargin = 1; //right margin in mm
  var pdfInMM = 57; // width of A4 in mm
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
  doc.setTextColor(0, 0, 0);
  doc.text(".", 0, linea);
  linea = linea + 3;
  //console.log(imagen)

  const esNotaVenta58 = arraycabe.tipocomprobante === "T";
  const ocultarLogo58 = esNotaVenta58 && store.state.configImpresora.no_mostrar_logo_nota_pedido;
  if (imagen != "" && !ocultarLogo58) {
    doc.addImage(
      "data:image/png;base64," + imagen,
      "png",
      pdfInMM / 2 - 27,
      linea,
      55,
      30
    );
    linea = linea + parseInt(store.state.configImpresora.minferior) - 10; /// modificar margenes de logo
  }
  doc.setFontSize(9.5);
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
  linea = linea + 4.5;
  doc.setFont("Helvetica", "");
  if (store.state.configImpresora.nom_comercial) {
    var texto = doc.splitTextToSize(
      store.state.baseDatos.name,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //EMPRESA
    linea = linea + 4.5;
  }
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(Direccion, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); //RUC

  linea = linea + 4.5 * texto.length;

  if (cabecera != "") {
    linea = linea + 2;
    var texto = doc.splitTextToSize(cabecera, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 4 * texto.length;
  }
  if (telefono != "") {
    var texto = doc.splitTextToSize(
      "Telf: " + telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center"); //cabecera
    linea = linea + 4 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 4;
  var texto = doc.splitTextToSize(documento, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 4;
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
  doc.setFontSize(9.5);
  var texto = doc.splitTextToSize(
    "Nombre   : " + arraycabe.cliente,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 4 * texto.length;

  var texto = doc.splitTextToSize(
    "Documento: " + arraycabe.dni,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 4 * texto.length;

  if (arraycabe.direccion != "") {
    var texto = doc.splitTextToSize(
      "Direccion: " + arraycabe.direccion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 4 * texto.length;
  }
  if (arraycabe.referencia != "") {
    var texto = doc.splitTextToSize(
      "Ref: " + arraycabe.referencia,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  if (arraycabe.tipocomprobante != "T") {
    var texto = doc.splitTextToSize(
      "Condiciones: " + arraycabe.forma_pago,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 4 * texto.length;
  }
  if (arraycabe.telefono != "") {
    var texto = doc.splitTextToSize(
      "Telf: " + arraycabe.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 4 * texto.length;
  }
  if (arraycabe.observacion) {
    var texto = doc.splitTextToSize(
      "Observacion: " + arraycabe.observacion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 4 * texto.length;
  }
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 6;
  doc.text(separacion, pageCenter, linea, "center");

  //-----------------productos-----------------------
  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    var obs = "";
    var tg = "";
    var totals = (
      Number(array[i].total_antes_impuestos) + Number(array[i].total_impuestos)
    ).toFixed(2);
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / Bonificacion";
      totals = "0.00";
      if (!store.state.configuracion.mostrar_ope_gratuitas) {
        array[i].precio = "0.00";
      }
    }
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    //nuevoArray[i][1] = array[i].nombre + "\n" + "-" + array[i].medida + tg;
    nuevoArray[i][1] = array[i].nombre + tg;
    nuevoArray[i][2] = Number(array[i].precio).toFixed(2);
    nuevoArray[i][3] = totals + obs;
  }
  if (!store.state.configuracion.mostrar_ope_gratuitas) {
    arraycabe.total_op_gratuitas = "0.00";
  }
  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: {
      fontSize: 9.5,
      cellPadding: 0.5,
      valign: "middle",
      halign: "center",
      textColor: [0, 0, 0],
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 7, halign: "center", valign: "top" },
      1: { columnWidth: 24, halign: "left" },
      2: { columnWidth: 11, halign: "right" },
      3: { columnWidth: 11, halign: "right" },
    },
    theme: ["plain"],
    head: [["Ca", "Descrip.", "P.U", "P.T"]],
    body: nuevoArray,
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return; // solo Descripción
      const txt = Array.isArray(data.cell.text)
        ? data.cell.text.join(" ")
        : String(data.cell.text || "");
      if (/bonificacion/i.test(txt)) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [0, 0, 0]; // rojo suave
        // opcional: fondo suave
        // data.cell.styles.fillColor = [255, 245, 204];
      }
    },
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3.5;
  if (arraycabe.total_op_gratuitas > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    var texto = doc.splitTextToSize("* Transferencia Gratuita", 100);
    doc.text(texto, 10, linea, "left");
    linea = linea + 3;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 4;
  }
  var array_pago = arraycabe.modopago;
  for (var i = 0; i < array_pago.length; i++) {
    var data = array_pago[i];
    if (Boolean(data.monto)) {
      doc.setFont("Helvetica", "");
      doc.setFontSize(9);
      doc.text(data.nombre, lMargin, linea);
      doc.text(
        moneda + String(parseFloat(data.monto).toFixed(2)),
        50,
        linea,
        "right"
      );
      linea = linea + 3.5;
    }
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(9);
  if (arraycabe.tipocomprobante != "T") {
    doc.text("OP. GRAVADA", lMargin, linea);
    doc.text(moneda + arraycabe.total_op_gravadas, 50, linea, "right");
    linea = linea + 4;
    if (arraycabe.total_op_exoneradas > 0) {
      doc.text("OP. EXONERADA", lMargin, linea);
      doc.text(
        moneda + arraycabe.total_op_exoneradas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 4;
    }
    if (false) {
      doc.text("OP. GRATUITAS", lMargin, linea);
      doc.text(
        moneda + arraycabe.total_op_gratuitas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 4;
    }
    if (arraycabe.total_op_inafectas > 0) {
      doc.text("OP. INFAFECTA", lMargin, linea);
      doc.text(
        moneda + arraycabe.total_op_inafectas.toString(),
        50,
        linea,
        "right"
      );
      linea = linea + 4;
    }
    doc.text("IGV " + arraycabe.porcentaje_igv + "%", lMargin, linea);
    doc.text(moneda + arraycabe.igv, 50, linea, "right");
    linea = linea + 4;
  }

  doc.text("Total", lMargin, linea);
  doc.text(moneda + total, 50, linea, "right");
  linea = linea + 4;

  if (store.state.configuracion.activo_moneda) {
    linea = linea + 2;
    doc.setFont("Helvetica", "bold");
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
    doc.setFont("Helvetica", "");
    doc.setFontSize(9);
    var tot_moneda =
      parseFloat(store.state.configuracion.conversion_moneda) *
      parseFloat(total);
    var texto = doc.splitTextToSize(
      "TOTAL " + store.state.configuracion.nom_moneda + ": " + tot_moneda,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, pageCenter, linea, "center");
    doc.setFontSize(9);
    linea = linea + 3 * texto.length;
  }

  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  doc.setFontSize(9);
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
  doc.setFontSize(9);
  var texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2), moneda),
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, pageCenter, linea, "center");
  linea = linea + 3.5 * texto.length;

  if (arraycabe.tipocomprobante != "T") {
    doc.setFontSize(9);
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

  if (arraycabe.tipocomprobante == "T" && qr != "") {
    doc.setFontSize(8);
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
    doc.addImage(qr, "png", pdfInMM / 2 - 10, linea, 18, 18);
    linea = linea + 20;
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
        textColor: [0, 0, 0],
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
  doc.text(".", 0, linea);

  switch (modo_genera) {
    case "abre":
      if (store.state.esmovil) {
        const arrayBuffer = doc.output("arraybuffer");
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const file = new File(
          [blob],
          `${arraycabe.serie}-${arraycabe.correlativoDocEmitido}.pdf`,
          {
            type: "application/pdf",
          }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "Enviar comprobante",
              text: "Selecciona una app para compartir o imprimir",
              files: [file],
            });
          } catch (err) {
          }
        } else {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        }
      } else {
        abre_dialogo_impresion(doc);
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
async function impresion80(arraydatos, qr, cabecera) {
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
  //console.log(arraycabe);
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
    compress: true, // <--- IMPORTANTE: Evita pérdida de calidad
    precision: 2, // <--- Precisión de dibujo
  });

  doc.setTextColor(0, 0, 0);
  doc.text(".", 0, linea);
  linea = linea + 3;
  //console.log(imagen)
  const esNotaVenta80 = arraycabe.tipocomprobante === "T";
  const ocultarLogo80 = esNotaVenta80 && store.state.configImpresora.no_mostrar_logo_nota_pedido;
  if (imagen != "" && !ocultarLogo80) {
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
    linea = linea + 3.5 * texto.length;
  }
  if (arraycabe.referencia != "") {
    var texto = doc.splitTextToSize(
      "Ref: " + arraycabe.referencia,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  var texto = doc.splitTextToSize(
    "Condiciones: " + arraycabe.forma_pago,
    pdfInMM - lMargin - rMargin
  );
  doc.text(texto, lMargin, linea, "left");
  linea = linea + 3.5 * texto.length;

  if (arraycabe.observacion) {
    var texto = doc.splitTextToSize(
      "Observacion: " + arraycabe.observacion,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  //console.log('cabe', arraycabe)
  if (arraycabe.telefono) {
    var texto = doc.splitTextToSize(
      "Telf: " + arraycabe.telefono,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  if (arraycabe.id_pedido) {
    var texto = doc.splitTextToSize(
      "# Pedido: " + arraycabe.id_pedido,
      pdfInMM - lMargin - rMargin
    );
    doc.text(texto, lMargin, linea, "left");
    linea = linea + 3.5 * texto.length;
  }
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 7;
  doc.text(separacion, pageCenter, linea, "center");
  var descuentos = 0;
  //-----------------productos-----------------------
  var nuevoArray = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    descuentos += Number(array[i].preciodescuento);
    var obs = "";
    var tg = "";
    var totals = (
      Number(array[i].total_antes_impuestos) + Number(array[i].total_impuestos)
    ).toFixed(2);
    if (array[i].operacion == "GRATUITA") {
      obs = "*";
      tg = " / Bonificacion";
      totals = "0.00";
      if (!store.state.configuracion.mostrar_ope_gratuitas) {
        array[i].precio = "0.00";
      }
    }
    nuevoArray[i] = new Array(4);
    nuevoArray[i][0] = array[i].cantidad;
    nuevoArray[i][1] = array[i].nombre + "\n" + "-" + array[i].medida + tg;
    nuevoArray[i][2] = Number(array[i].precio).toFixed(2);
    nuevoArray[i][3] = totals + obs;
  }
  if (!store.state.configuracion.mostrar_ope_gratuitas) {
    arraycabe.total_op_gratuitas = "0.00";
  }
  doc.autoTable({
    margin: { top: linea - 9, left: 1 },
    styles: {
      fontSize: 8,
      cellPadding: 0.1,
      valign: "middle",
      halign: "center",
      textColor: [0, 0, 0],
    },
    headStyles: { lineWidth: 0, minCellHeight: 9 },
    columnStyles: {
      0: { columnWidth: 8, halign: "center", valign: "top" },
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

  //-------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;

  if (arraycabe.descuentos != 0) {
    doc.setFontSize(8);
    doc.text("DESCUENTOS", lMargin, linea);
    doc.text(moneda + arraycabe.descuentos, 68, linea, "right");
    linea = linea + 3.5;
  }
  console.log(arraycabe.total_op_gratuitas);
  if (arraycabe.total_op_gratuitas > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
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
  doc.setFontSize(8);
  if (arraycabe.tipocomprobante != "T") {
    doc.text("OP. GRAVADA", lMargin, linea);
    doc.text(moneda + arraycabe.total_op_gravadas, 68, linea, "right");
    linea = linea + 3.5;
    if (arraycabe.total_op_exoneradas > 0) {
      doc.text("OP. EXONERADA", lMargin, linea);
      doc.text(
        moneda + arraycabe.total_op_exoneradas.toString(),
        68,
        linea,
        "right"
      );
      linea = linea + 3.8;
    }
    if (arraycabe.total_op_gratuitas > 0) {
      doc.text("OP. GRATUITAS", lMargin, linea);
      doc.text(
        moneda + arraycabe.total_op_gratuitas.toString(),
        68,
        linea,
        "right"
      );
      linea = linea + 3.8;
    }
    doc.text("IGV " + arraycabe.porcentaje_igv + "%", lMargin, linea);
    doc.text(moneda + arraycabe.igv, 68, linea, "right");
    linea = linea + 3.8;
  }
  if (descuentos > 0) {
    doc.text("Descuentos", lMargin, linea);
    doc.text(moneda + descuentos.toFixed(2), 68, linea, "right");
    linea = linea + 3.8;
  }
  doc.text("Total", lMargin, linea);
  doc.setFontSize(10);
  doc.setFont("Helvetica", "bold");

  doc.text(moneda + formatMoney(total), 68, linea, "right");
  linea = linea + 3.5;
  doc.setFontSize(8);
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center");
  linea = linea + 3;
  doc.setFont("Helvetica", "");
  doc.setFontSize(8);

  var array_pago = arraycabe.modopago;
  for (var i = 0; i < array_pago.length; i++) {
    var data = array_pago[i];
    if (Boolean(data.monto)) {
      doc.setFont("Helvetica", "");
      doc.setFontSize(9);
      doc.text(data.nombre, lMargin, linea);
      doc.text(
        moneda + String(parseFloat(data.monto).toFixed(2)),
        68,
        linea,
        "right"
      );
      linea = linea + 3;
    }
  }

  console.log(arraycabe.detraccion);
  if (
    arraycabe.detraccion &&
    Object.keys(arraycabe.detraccion).length > 0 &&
    arraycabe.detraccion !== ""
  ) {
    doc.setFontSize(9);
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(
      "DETRACCION: " +
      arraycabe.detraccion.porcentaje +
      "%  : " +
      moneda +
      arraycabe.detraccion.monto +
      "\nCTA. BANCO DE LA NACION: " +
      arraycabe.detraccion.cuenta,
      80
    );
    doc.text(texto, pageCenter, linea, "center");
    linea = linea + 6.5;
  }

  /*
  doc.setFont('Helvetica', 'bold');
  var texto = doc.splitTextToSize('Vendedor : ' + arraycabe.vendedor, (pdfInMM - lMargin - rMargin));
  doc.text(texto, pageCenter, linea, 'center');
  linea = linea + (3.5 * texto.length)*/
  const vendedor = arraycabe.cod_vendedor ?? arraycabe.vendedor;
  if (vendedor) {
    linea = linea + 1 * texto.length;
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(
      "Vendedor: " + vendedor,
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
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2), moneda),
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
        doc.addImage(qr, "png", pdfInMM / 2 - 12, linea, 24, 24);
        linea = linea + 20;
      }
    }
  }

  if (arraycabe.tipocomprobante == "T" && qr != "") {
    doc.setFontSize(8);
    doc.text(separacion, pageCenter, linea, "center");
    linea = linea + 3;
    doc.addImage(qr, "png", pdfInMM / 2 - 12, linea, 24, 24);
    linea = linea + 26;
  }

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
        textColor: [0, 0, 0],
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
      const arrayBuffer = doc.output("arraybuffer");
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const file = new File(
          [blob],
          `${arraycabe.serie}-${arraycabe.correlativoDocEmitido}.pdf`,
          {
            type: "application/pdf",
          }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "Enviar comprobante",
              text: "Selecciona una app para compartir o imprimir",
              files: [file],
            });
          } catch (err) {
          }
        } else {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        }
      } else {
        abre_dialogo_impresion(doc);
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
    parseFloat(arraycabe.total_op_inafectas || 0) +
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

  const esNotaVentaA4 = arraycabe.tipocomprobante === "T";
  const ocultarLogoA4 = esNotaVentaA4 && store.state.configImpresora.no_mostrar_logo_nota_pedido;
  if (imagen != "" && !ocultarLogoA4) {
    console.log(store.state.configImpresora.log_largo);

    if (store.state.configImpresora.log_largo) {
      doc.addImage("data:image/png;base64," + imagen, "png", 10, 9, 130, 30);
    } else {
      doc.rect(10, 10, 30, 30);
      doc.addImage("data:image/png;base64," + imagen, "png", 12, 12, 26, 26);
    }

    if (cabecera != "") {
      linea = linea + 8;
    } else {
      linea = linea + 18;
    }
    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(9.5);
    if (!store.state.configImpresora.log_largo) {
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
    }
    if (telefono != "") {
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
  console.log(arraycabe);
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
  console.log("telef" + arraycabe.telefono);
  if (arraycabe.telefono != "" && arraycabe.telefono != undefined) {
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
  var respuesta = tabla_A4(array, linea);

  arraycabe.total_op_gratuitas = respuesta.ope_grat.toFixed(2);
  if (!store.state.configuracion.mostrar_ope_gratuitas) {
    arraycabe.total_op_gratuitas = "0.00";
  }

  doc.autoTable(respuesta.table);

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
    lineaqr = lineaqr + 5;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  var texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2), moneda),
    100
  );
  doc.text(texto, 10, lineaqr, "left");
  lineaqr = lineaqr + 6;

  let nextSection = 1;
  let currentSection;
  const remainingVSpace = doc.internal.pageSize.height - lineaqr;
  if (remainingVSpace > 50) {
    nextSection = currentSection;
    linea = lineaqr + 4;
    lineaqr = lineaqr + 10;
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
    doc.text(moneda + arraycabe.descuentos, 190, linea, "right");
    linea = linea + 4;
  }
  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. GRAVADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(moneda + arraycabe.total_op_gravadas, 190, linea, "right");
  linea = linea + 4;
  if (arraycabe.total_op_inafectas > 0) {
    doc.setFontSize(8);
    doc.setFont("Helvetica", "Bold");
    doc.text("OP. INAFECTA", 135, linea, "left");
    doc.text(" : ", 159, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(
      moneda + arraycabe.total_op_inafectas.toString(),
      190,
      linea,
      "right"
    );
    linea = linea + 4;
  }
  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("OP. EXONERADA", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda + arraycabe.total_op_exoneradas.toString(),
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
    moneda + arraycabe.total_op_gratuitas.toString(),
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
  doc.text(moneda + arraycabe.igv, 190, linea, "right");
  linea = linea + 4;

  doc.setFontSize(8);
  doc.setFont("Helvetica", "Bold");
  doc.text("Total", 135, linea, "left");
  doc.text(" : ", 159, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(moneda + total.toString(), 190, linea, "right");
  linea = linea + 2;

  if ((arraycabe.forma_pago).toLowerCase() == "credito") {

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DETALLE DE CRONOGRAMA", 10, lineaqr - 10);
    lineaqr = lineaqr - 6;
    doc.autoTable({
      startY: lineaqr,
      margin: { top: 10, left: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 1,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1, fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: "bold" },
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
    lineaqr = finalY + 8;
  }
  if (
    arraycabe.detraccion &&
    Object.keys(arraycabe.detraccion).length > 0 &&
    arraycabe.detraccion !== ""
  ) {
    var lineaqr2 = lineaqr + 8;
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    var texto = doc.splitTextToSize(
      "DETRACCION: " +
      arraycabe.detraccion.porcentaje +
      "%  : " +
      moneda +
      arraycabe.detraccion.monto +
      "\nCTA. BANCO DE LA NACION: " +
      arraycabe.detraccion.cuenta,
      80
    );
    doc.text(texto, 35, lineaqr2, "left");
  }

  if (qr != "") {
    if (arraycabe.tipocomprobante == "F" || arraycabe.tipocomprobante == "B") {
      doc.addImage(qr, "png", 10, lineaqr, 28, 28);
    }
    if (arraycabe.tipocomprobante == "T") {
      doc.addImage(qr, "png", 10, lineaqr, 28, 28);
    }
    if (arraycabe.tipocomprobante != "T") {
      lineaqr = lineaqr + 18;
      doc.setFont("Helvetica", "");
      doc.setFontSize(9);
      var texto = doc.splitTextToSize(
        "Representación Impresa de la " +
        documento +
        " Consultar su validez en https://domo.pe/buscardocumentos",
        90
      );
      doc.text(texto, 40, lineaqr, "left");
    }
  }
  if (arraycabecera.forma_pago.toLowerCase() != "credito") {
    linea = linea + 3.5;
    var array_pago = arraycabe.modopago;
    linea = linea - 18;
    doc.text("MODO DE PAGO : ", 75, linea);
    linea = linea + 3.5;
    for (var i = 0; i < array_pago.length; i++) {
      var data = array_pago[i];
      if (Boolean(data.monto)) {
        doc.setFont("Helvetica", "");
        doc.setFontSize(9);
        doc.text(data.nombre, 75, linea);
        doc.text(
          moneda + String(parseFloat(data.monto).toFixed(2)),
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
        abre_dialogo_impresion(doc);
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
function impresionA5_horizontal(array, qr, arraycabecera) {
  const arraycabe = arraycabecera;
  let linea = 10;

  const nombreEmpresa = store.state.baseDatos.name || "";
  const imagen = store.state.logoempresa || "";
  const Direccion =
    [
      store.state.baseDatos.direccion,
      store.state.baseDatos.distrito,
      store.state.baseDatos.provincia,
      store.state.baseDatos.departamento,
    ]
      .filter(Boolean)
      .join(" - ") || "-";

  const fechaImpresion = moment.unix(arraycabe.fecha).format("DD/MM/YYYY");
  const fecha_vencimiento = moment
    .unix(arraycabe.vencimientoDoc || arraycabe.fecha)
    .format("DD/MM/YYYY");

  const total = (
    (parseFloat(arraycabe.total_op_exoneradas || 0) || 0) +
    (parseFloat(arraycabe.total_op_gravadas || 0) || 0) +
    (parseFloat(arraycabe.igv || 0) || 0)
  ).toFixed(2);

  const totalDesc = arraycabe.descuentos || 0;

  // === A5 HORIZONTAL ===
  const pdfW = 210; // ancho A5 apaisado
  const pdfH = 148; // alto A5 apaisado
  const margin = 5;
  const usable = pdfW - 2 * margin;

  const cabecera = store.state.configImpresora.cabecera || "";
  const telefono = store.state.configImpresora.telefono || "";
  const bancos = store.state.bancos || [];
  if (arraycabe.total_op_gratuitas === undefined)
    arraycabe.total_op_gratuitas = 0;

  let documento = "TICKET DE VENTA";
  switch (arraycabe.tipocomprobante) {
    case "T":
      documento = store.state.seriesdocumentos.notaventa
        ? "NOTA DE VENTA"
        : "TICKET DE VENTA";
      break;
    case "B":
      documento = "BOLETA DE VENTA ELECTRONICA";
      break;
    case "F":
      documento = "FACTURA ELECTRONICA";
      break;
  }

  // landscape
  const doc = new jspdf({ orientation: "landscape", unit: "mm", format: "a5" });
  doc.text(".", -1, linea);
  linea += 3;

  // --- Encabezado: texto empresa a la izquierda / recuadro a la derecha ---
  const boxW = 70,
    boxH = 21;
  const boxX = pdfW - margin - boxW; // derecha
  const boxY = margin;

  // Texto empresa (columna izquierda con wrap)
  let leftX = margin + 5;
  const leftW = Math.max(120, boxX - leftX - 6);

  const esNotaVentaA5 = arraycabe.tipocomprobante === "T";
  const ocultarLogoA5 = esNotaVentaA5 && store.state.configImpresora.no_mostrar_logo_nota_pedido;
  if (imagen != "" && !ocultarLogoA5) {
    doc.addImage("data:image/png;base64," + imagen, "png", 10, 5, 26, 26);
    leftX = 40;
  }
  doc.setFont("Helvetica", "Bold");
  doc.setFontSize(11);
  let texto = doc.splitTextToSize(nombreEmpresa, leftW);
  doc.text(texto, leftX, linea, "left");
  linea += 4 * texto.length;

  if (cabecera) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(8.5);
    texto = doc.splitTextToSize(cabecera, leftW);
    doc.text(texto, leftX, linea, "left");
    linea += 3.5 * texto.length;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(8.5);
  texto = doc.splitTextToSize(Direccion, Math.min(100, leftW));
  doc.text(texto, leftX, linea, "left");
  linea += 4.2 * texto.length;

  if (telefono) {
    texto = doc.splitTextToSize("TELEFONO: " + telefono, leftW);
    doc.text(texto, leftX, linea, "left");
    linea += 3.5 * texto.length;
  }

  // Recuadro tipo/serie a la derecha
  doc.setLineWidth(0.3);
  doc.rect(boxX, boxY, boxW, boxH);

  doc.setFontSize(10);
  doc.setFont("Helvetica", "Bold");
  texto = doc.splitTextToSize(
    "Ruc: " + (store.state.baseDatos.ruc || ""),
    boxW - 6
  );
  doc.text(texto, boxX + boxW / 2, boxY + 7, "center");

  doc.setFontSize(8.5);
  texto = doc.splitTextToSize(documento, boxW - 6);
  doc.text(texto, boxX + boxW / 2, boxY + 12, "center");

  doc.setFontSize(10);
  texto = doc.splitTextToSize(
    (arraycabe.serie || "") + "-" + (arraycabe.correlativoDocEmitido || ""),
    boxW - 6
  );
  doc.text(texto, boxX + boxW / 2, boxY + 18, "center");

  const yHeaderBottom = Math.max(linea, boxY + boxH);

  // --- Marco de datos de cliente ---
  doc.setFontSize(7.5);
  doc.setLineWidth(0.3);
  doc.rect(margin, yHeaderBottom - 1, usable, 20);
  linea = yHeaderBottom + 3;

  // Izquierda
  doc.setFont("Helvetica", "Bold");
  doc.text("SEÑORES", margin + 5, linea, "left");
  doc.text(" : ", margin + 22, linea, "left");
  doc.setFont("Helvetica", "");
  texto = doc.splitTextToSize(arraycabe.cliente || "", 120);
  doc.text(texto, margin + 26, linea, "left");
  linea += 4 * texto.length;

  doc.setFont("Helvetica", "Bold");
  doc.text(
    (arraycabe.tipoDocumento || "").substring(0, 10),
    margin + 5,
    linea,
    "left"
  );
  doc.text(" : ", margin + 22, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(arraycabe.dni || "", margin + 26, linea, "left");
  linea += 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("DIRECCION", margin + 5, linea, "left");
  doc.text(" : ", margin + 22, linea, "left");
  doc.setFont("Helvetica", "");
  texto = doc.splitTextToSize(arraycabe.direccion || "-", 120);
  doc.text(texto, margin + 26, linea, "left");
  linea += 4 * texto.length;

  if (arraycabe.referencia) {
    doc.setFont("Helvetica", "Bold");
    doc.text("REFERENCIA", margin + 5, linea, "left");
    doc.text(" : ", margin + 22, linea, "left");
    doc.setFont("Helvetica", "");
    texto = doc.splitTextToSize(arraycabe.referencia || "-", 120);
    doc.text(texto, margin + 26, linea, "left");
    linea += 4 * texto.length;
  }

  if (arraycabe.observacion && arraycabe.observacion.length < 100) {
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", margin + 5, linea, "left");
    doc.text(" : ", margin + 22, linea, "left");
    doc.setFont("Helvetica", "");
    texto = doc.splitTextToSize(arraycabe.observacion, usable - 30);
    doc.text(texto, margin + 26, linea, "left");
    linea += 3.5 * texto.length;
  }
  if (arraycabe.placa_cliente) {
    doc.setFont("Helvetica", "Bold");
    doc.text("PLACA", margin + 5, linea, "left");
    doc.text(" : ", margin + 22, linea, "left");
    doc.setFont("Helvetica", "");
    texto = doc.splitTextToSize(arraycabe.placa_cliente, 120);
    doc.text(texto, margin + 26, linea, "left");
    linea += 4 * texto.length;
  }

  // Derecha
  let lineaDer = yHeaderBottom + 3;
  const labelX2 = pdfW - margin - 70; // más ancho disponible en horizontal
  const colonX2 = labelX2 + 32;
  const valueX2 = colonX2 + 3;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA EMISION", labelX2, lineaDer, "left");
  doc.text(" : ", colonX2, lineaDer, "left");
  doc.setFont("Helvetica", "");
  doc.text(fechaImpresion, valueX2, lineaDer, "left");
  lineaDer += 4;

  if ((arraycabe.vencimientoDoc || "").toString().length === 10) {
    doc.setFont("Helvetica", "Bold");
    doc.text("FECHA VENCIMIENTO", labelX2, lineaDer, "left");
    doc.text(" : ", colonX2, lineaDer, "left");
    doc.setFont("Helvetica", "");
    doc.text(fecha_vencimiento, valueX2, lineaDer, "left");
    lineaDer += 4;
  }
  if (arraycabe.telefono) {
    doc.setFont("Helvetica", "Bold");
    doc.text("TELEFONO", labelX2, lineaDer, "left");
    doc.text(" : ", colonX2, lineaDer, "left");
    doc.setFont("Helvetica", "");
    doc.text(arraycabe.telefono, valueX2, lineaDer, "left");
    lineaDer += 4;
  }

  doc.setFont("Helvetica", "Bold");
  doc.text("CONDICIONES", labelX2, lineaDer, "left");
  doc.text(" : ", colonX2, lineaDer, "left");
  doc.setFont("Helvetica", "");
  doc.text(arraycabecera.forma_pago || "", valueX2, lineaDer, "left");

  // --- Tabla de productos ---
  linea = yHeaderBottom + 18;

  const nuevoArray = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    let obs = "",
      tg = "";
    if (array[i].operacion === "GRATUITA") {
      obs = "*";
      tg = " / TG: " + moneda + (array[i].valor_total || 0);
      array[i].precioedita = "0.00";
    }
    nuevoArray[i] = new Array(5);
    nuevoArray[i][0] = array[i].cantidad || 0;
    nuevoArray[i][1] = (array[i].nombre || "") + tg;
    nuevoArray[i][2] = array[i].medida || "";
    nuevoArray[i][3] =
      array[i].precioedita ||
      array[i].precio ||
      array[i].precioVentaUnitario ||
      "0.00";
    nuevoArray[i][4] =
      (
        parseFloat(
          array[i].precioedita ||
          array[i].precio ||
          array[i].precioVentaUnitario ||
          0
        ) * (array[i].cantidad || 0)
      ).toFixed(2) + obs;
  }

  // Con más ancho disponible en horizontal
  const colW = { c0: 18, c2: 22, c3: 20, c4: 22 };
  const descW = usable - (colW.c0 + colW.c2 + colW.c3 + colW.c4); // ~118 mm aprox.

  doc.autoTable({
    startY: linea,
    margin: { top: 10, left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 0.6,
      valign: "middle",
      halign: "center",
      lineWidth: 0.2,
      lineColor: 1,
    },
    headStyles: {
      lineWidth: 0.2,
      lineColor: 1,
      fontStyle: "bold",
      fillColor: [184, 184, 184],
    },
    columnStyles: {
      0: { columnWidth: colW.c0, halign: "center" },
      1: { columnWidth: descW, halign: "left" },
      2: { columnWidth: colW.c2, halign: "center" },
      3: { columnWidth: colW.c3, halign: "right" },
      4: { columnWidth: colW.c4, halign: "right" },
    },
    theme: "plain",
    head: [["Cantidad", "Descripcion", "Medida", "P.Unitario", "P.Total"]],
    body: nuevoArray,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 6;
  let lineaqr = linea;

  if ((arraycabe.total_op_gratuitas || 0) > 0) {
    doc.setFont("Helvetica", "");
    doc.setFontSize(8);
    texto = doc.splitTextToSize(
      "* Transferencia Gratuita y/o Servicio Prestado Gratuitamente",
      140
    );
    doc.text(texto, margin, lineaqr, "left");
    lineaqr += 3;
  }

  doc.setFont("Helvetica", "");
  doc.setFontSize(8);
  texto = doc.splitTextToSize(
    "Son: " + NumerosALetras(parseFloat(total).toFixed(2), moneda),
    140
  );
  doc.text(texto, margin, lineaqr, "left");
  lineaqr += 3;

  if (arraycabe.observacion && arraycabe.observacion.length >= 100) {
    linea += 4;
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", margin + 5, linea, "left");
    doc.text(" : ", margin + 22, linea, "left");
    doc.setFont("Helvetica", "");
    texto = doc.splitTextToSize(arraycabe.observacion, usable - 33);
    doc.text(texto, margin + 26, linea, "left");
  }

  // Salto si se viene el pie
  const remainingVSpace =
    doc.internal.pageSize.height - doc.lastAutoTable.finalY;
  if (remainingVSpace <= 35) {
    doc.addPage();
    linea = 10;
    lineaqr = 10;
  }

  // --- Totales (recuadro a la derecha) ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const totBoxW = 70,
    totBoxH = 23,
    totBoxX = pdfW - margin - totBoxW;
  doc.rect(totBoxX, linea, totBoxW, totBoxH);

  let yTot = linea + 4;
  doc.setFontSize(8.5);

  if (parseFloat(totalDesc) !== 0) {
    doc.setFont("Helvetica", "Bold");
    doc.text("DESCUENTOS", totBoxX + 5, yTot, "left");
    doc.text(" : ", totBoxX + 33, yTot, "left");
    doc.setFont("Helvetica", "");
    doc.text(
      moneda + (arraycabe.descuentos || 0),
      totBoxX + totBoxW - 2,
      yTot,
      "right"
    );
    yTot += 4;
  }

  if (arraycabe.operacion === "0200") {
    doc.setFont("Helvetica", "Bold");
    doc.text("EXPORTACION", totBoxX + 5, yTot, "left");
    doc.text(" : ", totBoxX + 33, yTot, "left");
    doc.setFont("Helvetica", "");
    doc.text(
      moneda + (arraycabe.total_op_gravadas || 0),
      totBoxX + totBoxW - 2,
      yTot,
      "right"
    );
    yTot += 4;
  } else {
    doc.setFont("Helvetica", "Bold");
    doc.text("OP. GRAVADA", totBoxX + 5, yTot, "left");
    doc.text(" : ", totBoxX + 33, yTot, "left");
    doc.setFont("Helvetica", "");
    doc.text(
      moneda + (arraycabe.total_op_gravadas || 0),
      totBoxX + totBoxW - 2,
      yTot,
      "right"
    );
    yTot += 4;
  }

  doc.setFont("Helvetica", "Bold");
  doc.text("OP. EXONERADA", totBoxX + 5, yTot, "left");
  doc.text(" : ", totBoxX + 33, yTot, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda + String(arraycabe.total_op_exoneradas || 0),
    totBoxX + totBoxW - 2,
    yTot,
    "right"
  );
  yTot += 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("OP. GRATUITAS", totBoxX + 5, yTot, "left");
  doc.text(" : ", totBoxX + 33, yTot, "left");
  doc.setFont("Helvetica", "");
  doc.text(
    moneda + String(arraycabe.total_op_gratuitas || 0),
    totBoxX + totBoxW - 2,
    yTot,
    "right"
  );
  yTot += 4;

  doc.setFont("Helvetica", "Bold");
  doc.text(
    "IGV " + (arraycabe.porcentaje_igv || 0) + "%",
    totBoxX + 5,
    yTot,
    "left"
  );
  doc.text(" : ", totBoxX + 33, yTot, "left");
  doc.setFont("Helvetica", "");
  doc.text(moneda + (arraycabe.igv || 0), totBoxX + totBoxW - 2, yTot, "right");
  yTot += 4;

  // --- Franja de TOTAL (debajo del recuadro) ---
  const totalStripGap = 2; // separación respecto al recuadro
  const totalStripH = 8; // alto de la franja
  const totalStripY = linea + totBoxH + totalStripGap;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(totBoxX, totalStripY, totBoxW, totalStripH);

  // Texto TOTAL
  doc.setFont("Helvetica", "Bold");
  doc.setFontSize(11); // un poco más grande para destacar
  const yTotalText = totalStripY + 5; // posiciona el texto dentro de la franja
  doc.text("TOTAL: ", totBoxX + 5, yTotalText, "left");
  doc.text(moneda + String(total), totBoxX + totBoxW - 2, yTotalText, "right");
  // --- Crédito (cuotas) ---
  if (false) {
    // borde inferior del recuadro de totales + pequeño espacio
    const yCuotas = linea + totBoxH + 2;
    doc.autoTable({
      startY: yCuotas,
      margin: { left: totBoxX, right: margin },
      tableWidth: totBoxW, // MISMO ANCHO QUE EL BOX DE TOTALES
      styles: {
        fontSize: 8,
        cellPadding: 0.8,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
      },
      headStyles: { lineWidth: 0.2, lineColor: 1, fontStyle: "bold" },
      columnStyles: {
        0: { columnWidth: 20, halign: "center", fontStyle: "bold" }, // CUOTA
        1: { columnWidth: 22, halign: "center" }, // IMPORTE
        2: { columnWidth: totBoxW - (20 + 22), halign: "center" }, // VENCE
      },
      theme: "plain",
      head: [["CUOTA", "IMPORTE", "VENCE"]],
      body: cuotascredito(arraycabe.cuotas || []),
    });
    lineaqr = doc.previousAutoTable.finalY + 3;
  }

  // --- Detracción ---
  if (arraycabe.detraccion && Object.keys(arraycabe.detraccion).length) {
    const lineaqr2 = (lineaqr || yTot + 10) + 7;
    doc.setFontSize(7);
    doc.setFont("Helvetica", "bold");
    texto = doc.splitTextToSize(
      "DETRACCION: " +
      arraycabe.detraccion.porcentaje +
      "%  : " +
      moneda +
      arraycabe.detraccion.monto +
      "\nCTA. BANCO DE LA NACION: " +
      arraycabe.detraccion.cuenta,
      110
    );
    doc.text(texto, margin + 25, lineaqr2, "left");
  }

  // --- QR + leyenda SUNAT ---
  if (
    qr &&
    (arraycabe.tipocomprobante === "F" || arraycabe.tipocomprobante === "B")
  ) {
    doc.addImage(qr, "PNG", margin, lineaqr, 25, 25);
  }
  // QR para Nota de Venta en A5
  if (qr && arraycabe.tipocomprobante === "T") {
    doc.addImage(qr, "PNG", margin, lineaqr, 25, 25);
  }
  if (arraycabe.tipocomprobante !== "T") {
    const leyenda =
      "Representación Impresa de la " +
      documento +
      " Consultar su validez en https://domo.pe/buscardocumentos";
    doc.setFont("Helvetica", "");
    doc.setFontSize(7);
    texto = doc.splitTextToSize(leyenda, 80);
    doc.text(texto, margin + 28, lineaqr + 2, "left");
  }

  // --- Modo de pago (cuando NO es crédito) ---
  if (false) {
    const array_pago = arraycabe.modopago || [];
    const yPago = yTot + 3;
    doc.setFont("Helvetica", "Bold");
    doc.setFontSize(8);
    doc.text("MODO DE PAGO : ", margin + 23, yPago);
    let yLine = yPago + 3;
    for (let i = 0; i < array_pago.length; i++) {
      const data = array_pago[i];
      if (Boolean(data?.monto)) {
        doc.setFont("Helvetica", "");
        doc.setFontSize(7);
        doc.text(data.nombre || "", margin + 23, yLine);
        doc.text(
          moneda + String(parseFloat(data.monto).toFixed(2)),
          margin + 58,
          yLine,
          "right"
        );
        yLine += 3;
      }
    }
  }

  // --- Pie de página ---
  if (store.state.configImpresora.piepagina) {
    doc.setFontSize(9.5);
    lineaqr += 10;
    doc.setFont("Helvetica", "bold");
    doc.text(
      store.state.configImpresora.piepagina,
      pdfW / 2,
      lineaqr,
      "center"
    );
  }

  linea += 12;
  doc.text(".", 0, linea);

  // --- Salida
  switch (modo_genera) {
    case "abre":
      if (store.state.esmovil) {
        window.open(doc.output("bloburi"));
      } else {
        abre_dialogo_impresion(doc);
      }
      break;
    case "host":
      break;
    case "descarga":
      doc.save(
        (arraycabe.serie || "") +
        "-" +
        (arraycabe.correlativoDocEmitido || "") +
        ".pdf"
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

/* function abre_dialogo_impresion(data) {
  if (store.state.configImpresora.impresora_auto && isElectronEnv()) {
    axios_imp(data.output("arraybuffer"));
    return;
  }
  var blob = data.output("bloburi");
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
} */
async function axios_imp(pdfBuffer) {
  let impresoras = "Caja1";
  let data = store.state.serv_imp;
  //console.log(data)
  if (!data || !data.impresoras) {
    console.error("❌ Error: Datos de impresoras no disponibles");
    return;
  }

  // 🔹 Filtrar impresoras según el tipo
  const impresoraEncontrada = data.impresoras.filter(
    (impresora) => impresora.tipo === impresoras
  );

  if (!Array.isArray(impresoraEncontrada) || impresoraEncontrada.length === 0) {
    store.commit(
      "dialogosnackbar",
      `No se encontró una impresora con el tipo: ${impresoras}`
    );

    return;
  }

  const nombresImpresoras = impresoraEncontrada.map(
    (impresora) => impresora.deviceId
  );

  let serverIp = data.ip;
  if (!serverIp) {
    console.error("❌ Error: No se ha definido la dirección IP del servidor");
    return;
  }

  let printUrl = `http://${serverIp}/print`;
  console.log("📌 URL de impresión:", printUrl);

  // ✅ Verificar si el buffer del PDF es válido
  if (!pdfBuffer) {
    console.error("❌ Error: El buffer del PDF es inválido");
    return;
  }

  try {
    // ✅ Enviar la solicitud con Axios usando ArrayBuffer en el cuerpo
    const response = await axios.post(printUrl, pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        printernames: JSON.stringify(nombresImpresoras), // Enviar nombres de impresoras en el header
      },
      responseType: "json",
    });

    console.log("✅ Respuesta del servidor:", response.data);
    store.commit("dialogosnackbar", "Impreso Correctamente");
  } catch (error) {
    console.error("❌ Error al enviar la impresión:", error);
    store.commit(
      "dialogosnackbar",
      "❌ Error al enviar el documento a la impresora."
    );
  }
}
function isElectronEnv() {
  const w = typeof window !== "undefined" ? window : undefined;
  const p = typeof process !== "undefined" ? process : undefined;
  return Boolean(
    (p && p.versions && p.versions.electron) || // main / preload
    (w && w.process && w.process.type === "renderer") || // renderer
    (w &&
      w.navigator &&
      w.navigator.userAgent &&
      w.navigator.userAgent.includes("Electron"))
  );
}

function tabla_A4(array, linea) {
  // Detectar si existe algún descuento
  const existeDescuento = array.some(
    (it) =>
      it.descuentos &&
      (Number(it.descuentos.desc_1) > 0 ||
        Number(it.descuentos.desc_2) > 0 ||
        Number(it.descuentos.desc_3) > 0)
  );

  let ope_grat = 0;
  const nuevoArray = [];

  for (let item of array) {
    const descuentos = item.descuentos || {};

    const precioBase = Number(item.precio || 0); // P.Unitario
    const precioNeto = Number(item.precio || 0); // P.Neto
    let totalLinea = precioNeto * item.cantidad;

    // Texto descuentos combinados en una sola celda
    const textoDescuento = existeDescuento
      ? `${descuentos.desc_1 || 0} / ${descuentos.desc_2 || 0} / ${descuentos.desc_3 || 0
      }`
      : null;

    let obs = "";
    let tg = "";

    if (item.operacion === "GRATUITA") {
      obs = "*";
      tg = " / Bono";
      const totBase = precioBase * item.cantidad;
      ope_grat += totBase;
      totalLinea = 0;
    }

    // Estructura según exista o no descuento
    if (!existeDescuento) {
      // SIN DESCUENTOS
      nuevoArray.push([
        item.cantidad,
        item.nombre + tg,
        item.medida,
        precioBase.toFixed(2),
        totalLinea.toFixed(2) + obs,
      ]);
    } else {
      // CON DESCUENTOS
      nuevoArray.push([
        item.cantidad,
        item.nombre + tg,
        item.medida,
        precioBase.toFixed(2),
        textoDescuento,
        precioNeto.toFixed(2),
        totalLinea.toFixed(2) + obs,
      ]);
    }
  }

  // CABECERA SEGÚN MODO
  const headSinDescuento = [
    ["Cantidad", "Descripcion", "Medida", "P.Unitario", "P.Total"],
  ];

  const headConDescuento = [
    [
      "Cant",
      "Descripcion",
      "Medida",
      "P.Unitario",
      "%Desc",
      "P.Neto",
      "P.Total",
    ],
  ];

  // COLUMNAS SIMPLES Y LIMPIAS
  const columnStylesSinDesc = {
    0: { columnWidth: 20 },
    1: { columnWidth: 110, halign: "left" },
    2: { columnWidth: 20 },
    3: { columnWidth: 20 },
    4: { columnWidth: 20 },
  };

  const columnStylesConDesc = {
    0: { columnWidth: 12 },
    1: { columnWidth: 80, halign: "left" },
    2: { columnWidth: 18 },
    3: { columnWidth: 20 },
    4: { columnWidth: 20 }, // %Desc
    5: { columnWidth: 20 }, // P.Neto
    6: { columnWidth: 20 }, // Total
  };

  // TABLA A DEVOLVER
  const table = {
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
    theme: ["plain"],
    head: existeDescuento ? headConDescuento : headSinDescuento,
    columnStyles: existeDescuento ? columnStylesConDesc : columnStylesSinDesc,
    body: nuevoArray,
  };

  return { table, ope_grat };
}

function formatMoney(num) {
  const n = Number(num || 0);

  // Formato tipo S/ 1,070.65
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}