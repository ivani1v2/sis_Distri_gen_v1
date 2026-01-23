import jspdf from "jspdf";
import "jspdf-autotable";
import store from "@/store/index";
import moment from "moment";
import { NumerosALetras } from "numero-a-letras";

let moneda = "S/";
let modo_genera = "abre";

export const pdfGenera = (cabecera, arraydatos, medida = "80", modo = "abre") => {
  moneda = cabecera?.moneda || "S/";
  modo_genera = modo;

  switch (medida) {
    case "A4":
      return impresionA4_ordenPedido(cabecera, arraydatos);
    case "58":
      return impresion58_ordenPedido(cabecera, arraydatos);
    case "80":
    default:
      return impresion80_ordenPedido(cabecera, arraydatos);
  }
};
async function impresionA4_ordenPedido(cabecera, items = []) {
  const emp = store.state.baseDatos || {};
  const cfg = store.state.configImpresora || {};
  const imagen = store.state.logoempresa || "";

  const mostrarLogo = cfg.mostrar_logo_pedido !== false;

  const lMargin = 14;      // márgenes cómodos para A4
  const rMargin = 14;
  const tMargin = 14;
  const pageWidth = 210;   // A4 mm
  const contentWidth = pageWidth - lMargin - rMargin;

  // Campos de cabecera (seguimos tu lógica robusta con defaults)
  const fechaEmiUnix = cabecera?.fecha_emision || moment().unix();
  const fechaEmi = moment.unix(fechaEmiUnix).format("DD/MM/YYYY HH:mm");
  const condicion = cabecera?.condicion_pago || "CONTADO";
  const diasCredito = Number(cabecera?.dias_credito || 0);
  const fechaVence = cabecera?.fecha_vencimiento
    ? cabecera.fecha_vencimiento
    : (condicion === "CRÉDITO" && diasCredito > 0
      ? moment.unix(fechaEmiUnix).add(diasCredito, "days").format("DD/MM/YYYY")
      : "");

  const total = Number(cabecera?.total || 0);
  const subtotal = Number(
    cabecera?.subtotal ??
    (items || []).reduce((s, it) => s + Number(it.precio || 0) * Number(it.cantidad || 0), 0)
  );
  const descuentos = Number(cabecera?.descuentos || 0);
  const numeroOP = cabecera?.numero_pedido || cabecera?.codigo || cabecera?.num_orden || "";

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });



  // ---------- ENCABEZADO ----------
  // Logo (izq) + datos empresa (centro) + título (derecha)
  const yTop = tMargin;
  let y = yTop;

  // helper para rectángulos redondeados (borde fino)
  function roundedRect({ x, y, w, h, r = 3, stroke = true, fill = false }) {
    doc.roundedRect(x, y - 5, w, h - 5, r, r, stroke ? "S" : (fill ? "F" : "N"));
  }

  const colW_logo = (imagen && mostrarLogo) ? 28 : 0;
  const colW_right = 75;
  const colW_center = contentWidth - colW_logo - colW_right - (colW_logo ? 6 : 0);

  const xLogo = lMargin;
  const xCenter = colW_logo ? (xLogo + colW_logo + 6) : lMargin;
  const xRight = lMargin + contentWidth - colW_right;

  if (imagen && mostrarLogo) {
    doc.addImage("data:image/png;base64," + imagen, "png", xLogo, y, colW_logo, colW_logo);
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  const empName = doc.splitTextToSize((emp.name || "").toUpperCase(), colW_center);
  doc.text(empName, xCenter, y + 6);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  const direccion = [emp.direccion, emp.distrito, emp.provincia, emp.departamento].filter(Boolean).join(" - ");
  const infoEmpresa = [
    direccion || null,
    (cfg.telefono ? `Telf: ${cfg.telefono}` : null),
    (cfg.cabecera ? cfg.cabecera : null),
  ].filter(Boolean).join("\n");
  const empInfo = doc.splitTextToSize(infoEmpresa, colW_center);
  doc.text(empInfo, xCenter, y + 13);

  const logoHeight = (imagen && mostrarLogo) ? colW_logo : 0;
  const usedH = Math.max(logoHeight, 13 + (empInfo.length ? (empInfo.length * 4.6) : 0));

  const boxH = Math.max(usedH, 30);
  doc.setDrawColor(60);
  doc.setLineWidth(0.3);
  roundedRect({ x: xRight, y, w: colW_right, h: boxH, r: 3, stroke: true });

  let yBox = y + 5;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`R.U.C. ${emp.ruc || ""}`, xRight + colW_right / 2, yBox, { align: "center" });

  yBox += 6
  doc.setFontSize(12);
  doc.setTextColor(0, 90, 180);
  const tituloDoc = (cabecera?.tipo_doc_titulo || "ORDEN DE PEDIDO").toUpperCase();
  doc.text(tituloDoc, xRight + colW_right / 2, yBox, { align: "center" });
  doc.setTextColor(0);

  const correlativo = String(cabecera?.id);
  doc.text(correlativo, xRight + colW_right / 2, yBox + 5, { align: "center" });
  doc.setTextColor(0);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  const serieNumero = cabecera?.serie_numero || cabecera?.numero_pedido || cabecera?.num_orden || cabecera?.codigo || "";
  if (serieNumero) {
    doc.text(String(serieNumero), xRight + colW_right / 2, yBox, { align: "center" });
  }
  y += boxH + 10;
  var linea = y;
  doc.setFontSize(8);
  doc.setLineWidth(0.3);
  doc.rect(10, 40, 190, 20);
  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("SEÑORES", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(cabecera.cliente_nombre, 85);
  doc.text(texto, 36, linea, "left");
  linea = linea + 4 * texto.length;
  doc.setFont("Helvetica", "Bold");
  doc.text(cabecera.doc_tipo, 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(cabecera.doc_numero, 36, linea, "left");
  linea = linea + 4;

  doc.setFont("Helvetica", "Bold");
  doc.text("DIRECCION", 15, linea, "left");
  doc.text(" : ", 32, linea, "left");
  doc.setFont("Helvetica", "");
  var texto = doc.splitTextToSize(cabecera.cliente_direccion, 85);
  doc.text(texto, 36, linea, "left");
  linea = linea + 4 * texto.length;

  if (cabecera.observacion.length < 100 && cabecera.observacion != "") {
    doc.setFont("Helvetica", "Bold");
    doc.text("OBS", 15, linea, "left");
    doc.text(" : ", 32, linea, "left");
    doc.setFont("Helvetica", "");
    var texto = doc.splitTextToSize(cabecera.observacion, 180);
    doc.text(texto, 36, linea, "left");
    linea = linea + 3.5 * texto.length;
  }

  linea = 45;

  doc.setFont("Helvetica", "Bold");
  doc.text("FECHA EMISION", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(fechaEmi, 167, linea, "left");
  linea = linea + 4;

  if (fechaVence) {
    doc.setFont("Helvetica", "Bold");
    doc.text("FECHA VENCIMIENTO", 130, linea, "left");
    doc.text(" : ", 164, linea, "left");
    doc.setFont("Helvetica", "");
    doc.text(fechaVence, 167, linea, "left");
    linea = linea + 4;
  }


  doc.setFont("Helvetica", "Bold");
  doc.text("CONDICIONES", 130, linea, "left");
  doc.text(" : ", 164, linea, "left");
  doc.setFont("Helvetica", "");
  doc.text(condicion, 167, linea, "left");

  y = linea + 15;
  // ---------- TABLA DE ÍTEMS ----------
  console.log("items", items);
  var respuesta = tabla_A4(items, y)

  doc.autoTable(respuesta.table);


  let finalY = doc.previousAutoTable.finalY || y;
  y = finalY + 6;

  // ---------- TOTALES ----------
  const totalBoxX = lMargin + contentWidth - 70;
  const lineH = 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SUBTOTAL", totalBoxX, y);
  doc.text(moneda + subtotal.toFixed(2), lMargin + contentWidth, y, { align: "right" });
  y += lineH;

  if (descuentos) {
    doc.text("DESCUENTOS", totalBoxX, y);
    doc.text(moneda + descuentos.toFixed(2), lMargin + contentWidth, y, { align: "right" });
    y += lineH;
  }

  doc.setFont("Helvetica", "bold");
  doc.text("TOTAL", totalBoxX, y);
  doc.text(moneda + total.toFixed(2), lMargin + contentWidth, y, { align: "right" });
  y += lineH + 4;

  // ---------- OBS / VENDEDOR / SON ----------
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Observaciones", lMargin, y); y += 5;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  if (cabecera?.observacion) {
    const obs = doc.splitTextToSize(cabecera.observacion, contentWidth);
    doc.text(obs, lMargin, y);
    y += 6 + (obs.length - 1) * 5;
  } else {
    y += 2;
  }

  if (cabecera?.cod_vendedor) {
    doc.text(`Atiende: ${cabecera.cod_vendedor}`, lMargin, y);
    y += 6;
  }


  const enLetras = `Son: ${NumerosALetras(Number(total).toFixed(2), moneda)}`;
  const enLetrasTxt = doc.splitTextToSize(enLetras, contentWidth);
  doc.text(enLetrasTxt, lMargin, y);
  y += 6 + (enLetrasTxt.length - 1) * 5;

  const cuotasData = Array.isArray(cabecera?.cronograma)
    ? cabecera.cronograma
    : (cabecera?.cronograma?.cuotas || []);

  if ((condicion || '').toUpperCase() === 'CREDITO' && cuotasData.length > 0) {

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Detalle de cronograma: ", 14, y + 3);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Detalle de cronograma: ", 14, y + 3);
    y += 4;
    doc.autoTable({
      startY: y,
      margin: { top: 10, left: lMargin },
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
      body: cuotascredito(cuotasData),
    });
    y = doc.previousAutoTable.finalY + 3;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("**Documento no válido como comprobante de pago**", lMargin, y + 4);
  y += 8;
  doc.setTextColor(0);

  // Pie de página configurable
  if (cfg.piepagina) {
    const pie = doc.splitTextToSize(cfg.piepagina, contentWidth);
    // Si no alcanza en esta página, autoTable ya habrá creado nuevas páginas; colocamos pie en la actual
    const usableY = doc.internal.pageSize.getHeight() - 18; // margen inferior
    if (y > usableY) doc.addPage();
    doc.text(pie, lMargin, doc.internal.pageSize.getHeight() - 14);
  }

  // ---------- Numeración de páginas ----------
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Página ${i} de ${pageCount}`,
      lMargin + contentWidth,
      doc.internal.pageSize.getHeight() - 6,
      { align: "right" }
    );
  }
  doc.setTextColor(0);

  // ---------- Salida (mismo flujo que tu 80mm) ----------
  if (modo_genera === "descarga") {
    const clienteNombre = (cabecera?.cliente_nombre || 'cliente')
      .split(/\s+/)              // separa por espacios
      .slice(0, 2)               // toma solo las 2 primeras palabras
      .join('_')                 // une con guion bajo
      .replace(/[^a-zA-Z0-9_]/g, ''); // limpia caracteres especiales
    const nombre = `${numeroOP || moment().format("YYYYMMDD-HHmm")}_${clienteNombre}.pdf`;
    doc.save(nombre);
  } else {
    if (store.state.esmovil) {
      const arrayBuffer = doc.output("arraybuffer");
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const file = new File([blob], `orden-pedido.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Orden de Pedido",
            text: "Compartir/Imprimir Orden de Pedido",
            files: [file],
          });
        } catch (e) { /* noop */ }
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } else {
      try {
        // @ts-ignore
        if (typeof abre_dialogo_impresion === "function") {
          // @ts-ignore
          abre_dialogo_impresion(doc);
        } else {
          abre_dialogo_impresion(doc);
        }
      } catch {
        abre_dialogo_impresion(doc);
      }
    }
  }

  return true;
}

async function impresion80_ordenPedido(cabecera, items = []) {
  const emp = store.state.baseDatos || {};
  const cfg = store.state.configImpresora || {};
  const imagen = store.state.logoempresa || "";
  const lMargin = 3.5;
  const rMargin = 2;
  const pdfInMM = 75;
  const pageCenter = pdfInMM / 2;
  let linea = parseInt(cfg.msuperior || 4, 10) || 4;

  // Campos de cabecera
  const fechaEmi = moment.unix(cabecera?.fecha_emision || moment().unix()).format("DD/MM/YYYY HH:mm");
  const condicion = cabecera?.condicion_pago || "CONTADO";
  const diasCredito = Number(cabecera?.dias_credito || 0);
  const fechaVence = cabecera?.fecha_vencimiento
    ? moment.unix(cabecera.fecha_vencimiento).format("DD/MM/YYYY")
    : (condicion === "CRÉDITO" && diasCredito > 0
      ? moment.unix(cabecera?.fecha_emision || moment().unix()).add(diasCredito, "days").format("DD/MM/YYYY")
      : "");

  const total = Number(cabecera?.total || 0);
  const subtotal = Number(cabecera?.subtotal ?? (items || []).reduce((s, it) => s + Number(it.precio || 0) * Number(it.cantidad || 0), 0));
  const descuentos = Number(cabecera?.descuentos || 0);

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM], // altura larga, ancho 80mm (75 útiles aprox)
    compress: true, // <--- IMPORTANTE: Evita pérdida de calidad
    precision: 2    // <--- Precisión de dibujo
  });

  const separacion = "-------------------------------------------------------------------------------------------------------------------";

  doc.setTextColor(0, 0, 0);
  doc.text(".", 0, linea); linea += 3;

  // Logo opcional
  if (imagen) {
    doc.addImage("data:image/png;base64," + imagen, "png", pdfInMM / 2 - 20, linea, 40, 40);
    linea += parseInt(cfg.minferior || 40, 10);
  }

  // Empresa
  doc.setFont("Helvetica", "Bold"); doc.setFontSize(8);
  let texto = doc.splitTextToSize(emp.name || "", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 4 * texto.length;

  // RUC + Dirección
  doc.setFont("Helvetica", ""); doc.setFontSize(7.5);
  const direccion = [emp.direccion, emp.distrito, emp.provincia, emp.departamento].filter(Boolean).join(" - ");
  texto = doc.splitTextToSize(("Ruc: " + (emp.ruc || "")) + (direccion ? "\n" + direccion : ""), pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 3.5 * texto.length;

  if (cfg.cabecera) {
    linea += 1.5;
    texto = doc.splitTextToSize(cfg.cabecera, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 3.5 * texto.length;
  }
  if (cfg.telefono) {
    texto = doc.splitTextToSize("Telf: " + cfg.telefono, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 3.5 * texto.length;
  }

  // TITULO: ORDEN DE PEDIDO
  doc.setFont("Helvetica", "bold"); doc.setFontSize(8);
  doc.text(separacion, pageCenter, linea, "center"); linea += 5;
  texto = doc.splitTextToSize("ORDEN DE PEDIDO", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 4;

  // Número de OP (si tienes uno)
  const numeroOP = cabecera?.id || "";
  if (numeroOP) {
    doc.setFont("Helvetica", "");
    texto = doc.splitTextToSize("N°: " + String(numeroOP), pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 4;
  }

  // Fecha emisión
  doc.setFont("Helvetica", ""); doc.setFontSize(8);
  texto = doc.splitTextToSize("Emisión: " + fechaEmi, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 5;

  // --- Datos del cliente ---
  doc.setFont("Helvetica", ""); doc.setFontSize(8);
  texto = doc.splitTextToSize("Cliente   : " + (cabecera?.cliente_nombre || ""), pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left"); linea += 3.5 * texto.length;

  texto = doc.splitTextToSize("Documento: " + [cabecera?.doc_tipo, cabecera?.doc_numero].filter(Boolean).join(" "), pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left"); linea += 3.5 * texto.length;

  if (cabecera?.cliente_direccion) {
    texto = doc.splitTextToSize("Dirección: " + cabecera.cliente_direccion, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.5 * texto.length;
  }
  if (cabecera?.cliente_referencia) {
    texto = doc.splitTextToSize("Refe: " + cabecera.cliente_referencia, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.5 * texto.length;
  }


  if (cabecera?.cliente_telefono) {
    texto = doc.splitTextToSize("Telf: " + cabecera.cliente_telefono, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.5 * texto.length;
  }

  // Condición de pago + vencimiento si aplica
  texto = doc.splitTextToSize("Condición: " + condicion + (fechaVence ? ("  |  Vence: " + fechaVence) : ""), pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left"); linea += 4;



  // Separador antes de tabla
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center"); linea += 7;
  doc.text(separacion, pageCenter, linea, "center");

  // --- Tabla de ítems ---
  // --- Tabla de ítems ---
  const body = (items || []).map(it => {
    const cant = Number(it.cantidad || 0);

    // Precio original
    let pu = Number(it.precio ?? 0);

    // Si NO se deben mostrar precios en operaciones GRATUITAS
    if (!store.state.configuracion.mostrar_ope_gratuitas &&
      String(it.operacion || "").toUpperCase() === "GRATUITA") {
      pu = 0;
    }

    const pt = Number(it.totalLinea ?? (pu * cant));

    const descLinea =
      `${it.nombre || ""}\n- ${String(it.medida || "").toUpperCase()}`;

    return [
      cant,
      descLinea,
      pu.toFixed(2),
      pt.toFixed(2)
    ];
  });


  doc.autoTable({
    margin: { top: linea - 9, left: 1, right: 1 },
    styles: { fontSize: 8, cellPadding: 0.1, valign: "middle", halign: "center", textColor: [0, 0, 0], },
    headStyles: { lineWidth: 0, minCellHeight: 9, fontStyle: "bold" },
    columnStyles: {
      0: { columnWidth: 8, halign: "center", valign: "top" }, // Cant
      1: { columnWidth: 35, halign: "left" }, // Desc
      2: { columnWidth: 12, halign: "right" }, // P.U
      3: { columnWidth: 12, halign: "right" }, // P.T
    },
    theme: "plain",
    head: [["Cant", "Descripción", "P.U", "P.T"]],
    body,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  // --- Totales ---
  doc.setFont("Helvetica", "bold");
  doc.text(separacion, pageCenter, linea, "center"); linea += 3;

  doc.setFont("Helvetica", ""); doc.setFontSize(8);
  doc.text("SUBTOTAL", lMargin, linea); doc.text(moneda + formatMoney(total), 68, linea, "right"); linea += 3.5;

  if (descuentos) {
    doc.text("DESCUENTOS", lMargin, linea); doc.text(moneda + formatMoney(descuentos), 68, linea, "right"); linea += 3.5;
  }

  doc.setFont("Helvetica", "Bold");
  doc.text("TOTAL", lMargin, linea); doc.text(moneda + formatMoney(total), 68, linea, "right"); linea += 4;

  // --- Observación / Vendedor ---
  doc.setFont("Helvetica", "bold"); doc.text(separacion, pageCenter, linea, "center"); linea += 3;
  doc.setFont("Helvetica", ""); doc.setFontSize(7.2);

  if (cabecera?.observacion) {
    texto = doc.splitTextToSize("Obs: " + cabecera.observacion, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.2 * texto.length;
  }

  if (cabecera?.cod_vendedor) {
    texto = doc.splitTextToSize("Atiende: " + cabecera.cod_vendedor, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 4;
  }

  // Son:
  texto = doc.splitTextToSize("Son: " + NumerosALetras(Number(total).toFixed(2), moneda), pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 4 * texto.length;


  const cuotasData80 = Array.isArray(cabecera?.cronograma)
    ? cabecera.cronograma
    : (cabecera?.cronograma?.cuotas || []);

  if ((condicion || '').toUpperCase() === 'CREDITO' && cuotasData80.length > 0) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Detalle de cronograma: ", lMargin, linea + 3);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Detalle de cronograma: ", lMargin, linea + 3);
    linea += 6;
    doc.autoTable({
      startY: linea,
      margin: { top: 10, left: 3 },
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
      body: cuotascredito(cuotasData80),
    });
    linea = doc.previousAutoTable.finalY + 3;
  }

  // Leyenda
  doc.setFontSize(7);
  texto = doc.splitTextToSize("**Documento no válido como comprobante de pago**", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 6;



  // Pie configurado
  if (cfg.piepagina) {
    linea += 4;
    texto = doc.splitTextToSize(cfg.piepagina, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center");
  }

  linea += Number(cfg.minferiorgeneral || 0);
  doc.text(".", 0, linea);

  if (modo_genera === "descarga") {
    const clienteNombre = (cabecera?.cliente_nombre || 'cliente')
      .split(/\s+/)              // separa por espacios
      .slice(0, 2)               // toma solo las 2 primeras palabras
      .join('_')                 // une con guion bajo
      .replace(/[^a-zA-Z0-9_]/g, ''); // limpia caracteres especiales
    const nombre = `${numeroOP || moment().format("YYYYMMDD-HHmm")}_${clienteNombre}.pdf`;
    doc.save(nombre);
  } else {
    // abrir compartido en móvil o diálogo impresión en escritorio
    if (store.state.esmovil) {
      const arrayBuffer = doc.output("arraybuffer");
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const file = new File([blob], `orden-pedido.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Orden de Pedido",
            text: "Compartir/Imprimir Orden de Pedido",
            files: [file],
          });
        } catch (e) { /* silencio */ }
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } else {
      // si tienes un helper global, úsalo; si no, abre en nueva pestaña
      try {
        // @ts-ignore
        if (typeof abre_dialogo_impresion === "function") {
          // @ts-ignore
          abre_dialogo_impresion(doc);
        } else {
          abre_dialogo_impresion(doc);
        }
      } catch {
        window.open(doc.output("bloburi"));
      }
    }
  }

  return true;
}
// === NUEVO: 58mm ===
async function impresion58_ordenPedido(cabecera, items = []) {
  const emp = store.state.baseDatos || {};
  const cfg = store.state.configImpresora || {};
  const imagen = store.state.logoempresa || "";

  // Ancho de papel 58mm; dejamos 56 útiles para margen/centrado cómodo
  const lMargin = 1;
  const rMargin = 1;
  const pdfInMM = 57;            // ancho del PDF (mm)
  const pageCenter = pdfInMM / 2;
  let linea = parseInt(cfg.msuperior || 4, 10) || 4;

  // Campos de cabecera
  const fechaEmi = moment.unix(cabecera?.fecha_emision || moment().unix()).format("DD/MM/YYYY HH:mm");
  const condicion = (cabecera?.condicion_pago || "CONTADO").toUpperCase();
  const diasCredito = Number(cabecera?.dias_credito || 0);
  const fechaVence = cabecera?.fecha_vencimiento
    ? moment.unix(cabecera.fecha_vencimiento).format("DD/MM/YYYY")
    : (condicion === "CRÉDITO" && diasCredito > 0
      ? moment.unix(cabecera?.fecha_emision || moment().unix()).add(diasCredito, "days").format("DD/MM/YYYY")
      : "");

  const total = Number(cabecera?.total || 0);
  const subtotal = Number(
    cabecera?.subtotal ??
    (items || []).reduce((s, it) => s + Number(it.precio || 0) * Number(it.cantidad || 0), 0)
  );
  const descuentos = Number(cabecera?.descuentos || 0);

  const doc = new jspdf({
    orientation: "portrait",
    unit: "mm",
    format: [1000, pdfInMM],
    compress: true, // <--- IMPORTANTE: Evita pérdida de calidad
    precision: 2    // <--- Precisión de dibujo// alto grande (continuo), ancho 58 mm
  });

  const separacion = "------------------------------------------------------------";

  doc.setTextColor(0, 0, 0);
  doc.text(".", 0, linea); linea += 2.5;

  // Logo (opcional): un poco más pequeño que en 80mm
  if (imagen) {
    doc.addImage("data:image/png;base64," + imagen, "png", pageCenter - 26, linea, 53, 32);
    linea += parseInt(cfg.minferior || 32, 10);
  }

  // Empresa
  doc.setFont("Helvetica", "Bold"); doc.setFontSize(8.6);
  let texto = doc.splitTextToSize(emp.name || "", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 4 * texto.length;

  // RUC + Dirección
  doc.setFont("Helvetica", ""); doc.setFontSize(9);
  const direccion = [emp.direccion, emp.distrito, emp.provincia, emp.departamento].filter(Boolean).join(" - ");
  texto = doc.splitTextToSize(("Ruc: " + (emp.ruc || "")) + (direccion ? "\n" + direccion : ""), pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 3.4 * texto.length;

  if (cfg.cabecera) {
    linea += 1;
    texto = doc.splitTextToSize(cfg.cabecera, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 3.4 * texto.length;
  }
  if (cfg.telefono) {
    doc.setFontSize(9);
    texto = doc.splitTextToSize("Telf: " + cfg.telefono, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 3.4 * texto.length;
  }

  // Título
  doc.setFont("Helvetica", "bold"); doc.setFontSize(8.6);
  doc.text(separacion, pageCenter, linea, "center"); linea += 4.7;
  texto = doc.splitTextToSize("ORDEN DE PEDIDO", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 3.8;

  // Número de OP

  const numeroOP = cabecera?.id || "";
  if (numeroOP) {
    doc.setFont("Helvetica", ""); doc.setFontSize(9);
    texto = doc.splitTextToSize(String(numeroOP), pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center"); linea += 3.8;
  }

  // Fecha emisión
  doc.setFont("Helvetica", ""); doc.setFontSize(8.2);
  texto = doc.splitTextToSize("Emisión: " + fechaEmi, pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 4;

  // Datos del cliente
  doc.setFont("Helvetica", ""); doc.setFontSize(9.0);
  texto = doc.splitTextToSize("Cliente   : " + (cabecera?.cliente_nombre || ""), pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left"); linea += 3.6 * texto.length;

  const docLinea = [cabecera?.doc_tipo, cabecera?.doc_numero].filter(Boolean).join(" ");
  if (docLinea) {
    texto = doc.splitTextToSize("Documento: " + docLinea, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.6 * texto.length;
  }

  if (cabecera?.cliente_direccion) {
    texto = doc.splitTextToSize("Dirección: " + cabecera.cliente_direccion, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.6 * texto.length;
  }
  if (cabecera?.referencia) {
    texto = doc.splitTextToSize("Ref: " + cabecera.referencia, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.6 * texto.length;
  }

  if (cabecera?.cliente_telefono) {
    texto = doc.splitTextToSize("Telf: " + cabecera.cliente_telefono, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.6 * texto.length;
  }

  // Condición / Vencimiento
  const condTxt = "Condición: " + condicion;
  texto = doc.splitTextToSize(condTxt, pdfInMM - lMargin - rMargin);
  doc.text(texto, lMargin, linea, "left"); linea += 4;

  // Separador
  doc.setFont("Helvetica", "bold"); doc.setFontSize(8.4);
  doc.text(separacion, pageCenter, linea, "center"); linea += 5;
  doc.text(separacion, pageCenter, linea, "center");

  // Tabla de ítems (columnas compactas para 58mm)

  (items || []).sort((a, b) => {
    const nombreA = (a.nombre || '').toUpperCase();
    const nombreB = (b.nombre || '').toUpperCase();

    // 1️⃣ Ordena por nombre de producto
    if (nombreA < nombreB) return -1;
    if (nombreA > nombreB) return 1;

    // 2️⃣ Si tienen el mismo producto, GRABADA primero, GRATUITA después
    const opA = (a.operacion || '').toUpperCase();
    const opB = (b.operacion || '').toUpperCase();

    if (opA === opB) return 0;
    if (opA === 'GRATUITA') return 1;  // va al final
    if (opB === 'GRATUITA') return -1;
    return 0;
  });
  const body = (items || []).map(it => {
    const cant = Number(it.cantidad || 0);
    const pu = Number((it.precio ?? 0));

    const pt = Number(it.total_linea || it.totalLinea);
    const esBono = String(it.operacion || '').toUpperCase() === 'GRATUITA';
    const descLinea = esBono
      ? `${it.nombre || ''} *BONIFICACION*`
      : `${it.nombre || ''}`;

    return [cant, descLinea, pu.toFixed(2), pt.toFixed(2)];
  });

  doc.autoTable({
    margin: { top: linea - 7, left: 1, right: 1 },
    styles: { fontSize: 9, cellPadding: 0.3, valign: "middle", halign: "center", textColor: [0, 0, 0], },
    headStyles: { lineWidth: 0, minCellHeight: 8, fontStyle: "bold" },
    columnStyles: {
      0: { columnWidth: 7, halign: "center", valign: "top", }, // Cant
      1: { columnWidth: 30, halign: "left" }, // Descripción (+ und)
      2: { columnWidth: 9.5, halign: "right" }, // P.U.
      3: { columnWidth: 9.5, halign: "right" }, // P.T.
    },
    theme: "plain",
    head: [["Can", "Descripción", "P.U", "P.T"]],
    body,
  });

  let finalY = doc.previousAutoTable.finalY;
  linea = finalY + 2;

  // Totales
  doc.setFont("Helvetica", "bold"); doc.setFontSize(8.4);
  doc.text(separacion, pageCenter, linea, "center"); linea += 2.8;

  doc.setFont("Helvetica", ""); doc.setFontSize(8.6);
  doc.text("SUBTOTAL", lMargin, linea); doc.text(moneda + subtotal.toFixed(2), pdfInMM - rMargin, linea, "right"); linea += 3.2;

  if (descuentos) {
    doc.text("DESCUENTOS", lMargin, linea); doc.text(moneda + descuentos.toFixed(2), pdfInMM - rMargin, linea, "right"); linea += 3.2;
  }

  doc.setFont("Helvetica", "Bold");
  doc.text("TOTAL", lMargin, linea); doc.text(moneda + total.toFixed(2), pdfInMM - rMargin, linea, "right"); linea += 3.4;

  // Observación / Vendedor
  doc.setFont("Helvetica", "bold"); doc.setFontSize(8.2);
  doc.text(separacion, pageCenter, linea, "center"); linea += 3;

  doc.setFont("Helvetica", ""); doc.setFontSize(8.5);
  if (cabecera?.observacion) {
    texto = doc.splitTextToSize("Obs: " + cabecera.observacion, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.2 * texto.length;
  }

  if (cabecera?.cod_vendedor) {

    texto = doc.splitTextToSize("Atiende: " + cabecera.cod_vendedor, pdfInMM - lMargin - rMargin);
    doc.text(texto, lMargin, linea, "left"); linea += 3.4;
  }

  // Son:
  texto = doc.splitTextToSize("Son: " + NumerosALetras(Number(total).toFixed(2), moneda), pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 3.4 * texto.length;


  const cuotasData58 = Array.isArray(cabecera?.cronograma)
    ? cabecera.cronograma
    : (cabecera?.cronograma?.cuotas || []);

  if ((condicion || '').toUpperCase() === 'CREDITO' && cuotasData58.length > 0) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.4);
    doc.text("Detalle de cronograma de pagos:", lMargin, linea + 5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.4);
    doc.text("Detalle de cronograma de pagos:", lMargin, linea + 5);
    linea += 5;
    doc.autoTable({
      startY: linea,
      margin: { top: 10, left: 1 },
      styles: {
        fontSize: 7,
        cellPadding: 0.2,
        valign: "middle",
        halign: "center",
        lineWidth: 0.2,
        lineColor: 1,
        textColor: [0, 0, 0],
      },
      headStyles: { lineWidth: 0.2, lineColor: 1 },
      columnStyles: {
        0: { columnWidth: 12, halign: "center", fontStyle: "bold" },
        1: { columnWidth: 22, halign: "center" },
        2: { columnWidth: 21, halign: "center" },
      },
      theme: ["plain"],
      head: [["CUOTA", "IMPORTE", "VENCE"]],
      body: cuotascredito(cuotasData58),
    });
    linea = doc.previousAutoTable.finalY + 3;
  }

  // Leyenda
  doc.setFontSize(7.8);
  texto = doc.splitTextToSize("**Documento no válido como comprobante de pago**", pdfInMM - lMargin - rMargin);
  doc.text(texto, pageCenter, linea, "center"); linea += 6;

  // Pie
  if (cfg.piepagina) {
    linea += 2.5;
    texto = doc.splitTextToSize(cfg.piepagina, pdfInMM - lMargin - rMargin);
    doc.text(texto, pageCenter, linea, "center");
  }

  linea += Number(cfg.minferiorgeneral || 0);
  doc.text(".", 0, linea);

  // Salida (igual que 80mm)
  if (modo_genera === "descarga") {
    const clienteNombre = (cabecera?.cliente_nombre || 'cliente')
      .split(/\s+/)              // separa por espacios
      .slice(0, 2)               // toma solo las 2 primeras palabras
      .join('_')                 // une con guion bajo
      .replace(/[^a-zA-Z0-9_]/g, ''); // limpia caracteres especiales
    const nombre = `${numeroOP || moment().format("YYYYMMDD-HHmm")}_${clienteNombre}.pdf`;
    doc.save(nombre);
  } else {
    if (store.state.esmovil) {
      const arrayBuffer = doc.output("arraybuffer");
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const file = new File([blob], `orden-pedido.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Orden de Pedido",
            text: "Compartir/Imprimir Orden de Pedido",
            files: [file],
          });
        } catch (e) { /* noop */ }
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } else {
      try {
        // @ts-ignore
        if (typeof abre_dialogo_impresion === "function") {
          // @ts-ignore
          abre_dialogo_impresion(doc);
        } else {
          window.open(doc.output("bloburi"));
        }
      } catch {
        abre_dialogo_impresion(doc);
      }
    }
  }

  return true;
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

function tabla_A4(array, linea) {
  // Detectar si existe algún descuento en algún ítem
  const existeDescuento = array.some(it =>
    (Number(it.desc_1) || 0) > 0 ||
    (Number(it.desc_2) || 0) > 0 ||
    (Number(it.desc_3) || 0) > 0
  );

  let ope_grat = 0;
  const nuevoArray = [];

  for (let item of array) {
    // precios
    const precioBase = Number(item.precio_base ?? item.precio ?? 0); // P.Unitario base
    const precioNeto = Number(item.precio ?? 0);                     // P.Neto

    let totalLinea = Number(item.totalLinea ?? (precioNeto * item.cantidad) ?? 0);

    // Texto descuentos combinados en una sola celda (si aplica)
    const textoDescuento = existeDescuento
      ? `${Number(item.desc_1 || 0)} / ${Number(item.desc_2 || 0)} / ${Number(item.desc_3 || 0)}`
      : null;

    let obs = "";
    let tg = "";

    if (item.operacion === "GRATUITA") {
      obs = "*";
      tg = " / Bono";

      const totBase = precioBase * item.cantidad;
      ope_grat += totBase;
      totalLinea = 0; // línea gratuita
    }

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
        precioBase.toFixed(2),       // P.Unitario base
        textoDescuento,              // %Desc 1/2/3
        precioNeto.toFixed(2),       // P.Neto
        totalLinea.toFixed(2) + obs  // Total
      ]);
    }
  }

  // CABECERAS
  const headSinDescuento = [
    ["Cantidad", "Descripcion", "Medida", "P.Unitario", "P.Total"]
  ];

  const headConDescuento = [
    ["Cant", "Descripcion", "Medida", "P.Unitario", "%Desc", "P.Neto", "P.Total"]
  ];

  // COLUMNAS
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
    3: { columnWidth: 20 },  // P.Unitario
    4: { columnWidth: 20 },  // %Desc
    5: { columnWidth: 20 },  // P.Neto
    6: { columnWidth: 20 },  // Total
  };

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


function cuotascredito(cuotas) {
  if (!cuotas || !Array.isArray(cuotas)) return [];
  return cuotas.map((cuota, index) => {
    const numCuota = cuota.cuota || cuota.numero || (index + 1);
    const importe = moneda + (Number(cuota.importe || cuota.monto || 0).toFixed(2));
    let vence = '';
    if (cuota.fecha_vence) {
      vence = typeof cuota.fecha_vence === 'number'
        ? moment.unix(cuota.fecha_vence).format('DD/MM/YYYY')
        : cuota.fecha_vence;
    } else if (cuota.vencimiento) {
      vence = moment(cuota.vencimiento).format('DD/MM/YYYY');
    } else if (cuota.vence) {
      vence = cuota.vence;
    }
    return [numCuota, importe, vence];
  });
}

function formatMoney(num) {
  const n = Number(num || 0);

  // Formato tipo S/ 1,070.65
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
