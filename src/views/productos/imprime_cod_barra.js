// imprime_cod_barra.js
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

/**
 * Genera un PDF con etiqueta de código de barras (Code128).
 * Firma flexible:
 *   - imprime_codbarra(producto, opts)
 *   - imprime_codbarra(opts, producto)
 *
 * @param {Object} arg1 - producto o opciones
 * @param {Object} arg2 - opciones o producto
 */
export const imprime_codbarra = (arg1 = {}, arg2 = {}) => {
  // --- Resolver firma flexible
  let producto, opts;
  const esProducto = (o) => o && (o.id || o.codbarra || o.nombre);
  if (esProducto(arg1)) { producto = arg1; opts = arg2 || {}; }
  else if (esProducto(arg2)) { producto = arg2; opts = arg1 || {}; }
  else { producto = null; opts = arg1 || {}; }

  if (!producto) {
    alert("No se recibió un producto válido para imprimir el código de barras.");
    return;
  }

  // --- Opciones
  const copias = Number(opts.copias || 1);                // cuántas etiquetas
  const formato = String(opts.formato || "58x30");        // "58x30", "58x40", "80x50", "35x25", "30x20"
  const mostrarPrecio = opts.mostrarPrecio !== false;     // true por defecto
  const mostrarNombre = opts.mostrarNombre !== false;     // true por defecto
  const formatoMapa = {
    "58x30": [58, 30],
    "58x40": [58, 40],
    "80x50": [80, 50],
    "35x25": [35, 25],
    "30x20": [30, 20], // NUEVO
  };
  const [W, H] = formatoMapa[formato] || [58, 30];       // mm

  // Detectar etiqueta pequeña (mini)
  const isMini = (W <= 30 || H <= 20);

  // Tamaños adaptativos
  const nameFont  = isMini ? 7  : 9;
  const codeFont  = isMini ? 7  : 9;
  const priceFont = isMini ? 9  : 11;

  // Grosor de barras por defecto (px) - más fino en mini
  const defaultBarWidth = isMini ? 1.2 : 2;
  const barWidth = Number(opts.barWidth ?? defaultBarWidth);

  // --- Datos del producto
  const p = {
    id: String(producto.id ?? "").trim(),
    nombre: String(producto.nombre ?? "").trim(),
    codbarra: String(producto.codbarra ?? producto.id ?? "").trim(),
    precio: Number(producto.precio ?? 0),
    medida: String(producto.medida ?? "").trim(),
    marca: String(producto.marca ?? "").trim(),
  };

  const codigo = p.codbarra || p.id;
  if (!codigo) {
    alert("El producto no tiene código de barras ni ID.");
    return;
  }

  // --- Generar código de barras (canvas → PNG)
  const canvas = document.createElement("canvas");
  try {
    const barOpts = {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      width: barWidth,                          // px por barra
      height: isMini ? 60 : 80,                 // alto en px del canvas (luego lo escalamos en el PDF)
    };
    (window.JsBarcode || JsBarcode)(canvas, codigo, barOpts);
  } catch (e) {
    console.error(e);
    alert("No se pudo generar el código de barras.");
    return;
  }
  const barcodePNG = canvas.toDataURL("image/png");

  // --- Armar PDF
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "landscape" });

  const pintarEtiqueta = () => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const M = 3; // margen superior
    let y = M;

    // Nombre (opcional) centrado, máx 2 líneas
    if (mostrarNombre && p.nombre) {
      doc.setFontSize(nameFont);
      const nombreLines = doc.splitTextToSize(p.nombre.toUpperCase(), W - 6);
      doc.text(nombreLines.slice(0, 2), W / 2, y, { align: "center" });
      y += (nombreLines.length > 1 ? (isMini ? 6 : 8) : (isMini ? 4 : 5));
    }

    // Altura de barras según espacio disponible
    // reserva 6mm si muestras precio, 3mm si no, más 3mm de respiración
    const reservaInferior = (mostrarPrecio ? 6 : 3) + 3;
    const barH = Math.max(
      isMini ? 9 : 12,
      Math.min(isMini ? 14 : 18, H - y - reservaInferior)
    );

    // Código de barras centrado
    const barW = W - 8;                 // margen lateral
    const xBar = (W - barW) / 2;
    doc.addImage(barcodePNG, "PNG", xBar, y, barW, barH, undefined, "FAST");
    y += barH;

    // Código legible (debajo del código)
    doc.setFontSize(codeFont);
    y += 3; // separación visual
    doc.text(codigo, W / 2, y, { align: "center" });

    // Precio (opcional) abajo a la derecha
    if (mostrarPrecio) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(priceFont);
      doc.text(`S/ ${Number(p.precio || 0).toFixed(2)}`, W - 2, H - 2, { align: "right" });
    }
  };

  for (let i = 0; i < copias; i++) {
    if (i > 0) doc.addPage([W, H], "portrait");
    pintarEtiqueta();
  }

  const filename = `ETQ_${p.id || codigo}.pdf`;
  doc.save(filename);
};
