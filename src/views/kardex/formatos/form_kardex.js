// Requiere:
// npm i jspdf jspdf-autotable
// o incluir en <script> desde CDN:
// <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.3/dist/jspdf.plugin.autotable.min.js"></script>

import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function generarPDFCompra(data) {
  const doc = new jsPDF({
    orientation: "landscape", // A5 apaisado para mejor ancho de tabla
    unit: "mm",
    format: "a5",
    compress: true,
  });

  // --------- Helpers ----------
  const safeNum = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const money = (n) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(safeNum(n));
  const fmt = (v) => (v ?? "").toString().trim();
  const toDate = (epochSec) => {
    if (!epochSec) return "";
    const d = new Date(epochSec * 1000);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // --------- Cabecera y datos principales ----------
  const titulo = `${fmt(data.tipodocumento)} de Compra`;
  const serie = fmt(data.sreferencia) || "";
  const correl = fmt(data.creferencia) || "";
  const docFull = serie && correl ? `${serie}-${correl}` : correl || serie || fmt(data.id);

  const margenX = 10;
  let y = 12;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text(titulo, margenX, y);
  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  y += 6;

  // Bloque izquierda
  const izq = [
    [`Operación:`, fmt(data.operacion)],
    [`Documento:`, `${fmt(data.cod_doc)} (${fmt(data.tipodocumento)})`],
    [`Serie/Correlativo:`, docFull],
    [`Modo de pago:`, fmt(data.modo_pago)],
    [`Responsable:`, fmt(data.responsable)],
  ];

  // Bloque derecha
  const der = [
    [`Proveedor:`, fmt(data.nom_proveedor)],
    [`RUC:`, fmt(data.num_doc)],
    [`F. Emisión:`, toDate(data.fecha_emision)],
    [`F. Ingreso:`, toDate(data.fecha_ingreso)],
    [`Observación:`, fmt(data.observacion)],
  ];

  const drawPairs = (pairs, x, startY) => {
    let yy = startY;
    pairs.forEach(([k, v]) => {
      doc.setFont("Helvetica", "bold");
      doc.text(k, x, yy);
      doc.setFont("Helvetica", "normal");
      doc.text(String(v || ""), x + 28, yy);
      yy += 5;
    });
    return yy;
  };

  const y1 = drawPairs(izq, margenX, y);
  const y2 = drawPairs(der, 105, y);
  y = Math.max(y1, y2) + 2;

  // Línea separadora
  doc.setLineWidth(0.2);
  doc.line(margenX, y, 200 - margenX, y);
  y += 3;

  // --------- Tabla de ítems ----------
  // Columnas: #, CÓDIGO, DESCRIPCIÓN, CANT, COSTO, IMPORTE
  const body = (data.data || []).map((it, idx) => {
    const costo = safeNum(it.costo_nuevo || it.costo);
    const cant = safeNum(it.cantidad);
    const importe = cant * costo;
    return [
      String(idx + 1),
      fmt(it.id),
      fmt(it.nombre),
      cant.toLocaleString("es-PE"),
      safeNum(costo).toFixed(4),
      safeNum(importe).toFixed(2),
    ];
  });

  doc.autoTable({
    head: [["#", "Código", "Descripción", "Cant.", "Costo (S/)", "Importe (S/)"]],
    body,
    startY: y,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 1.5, halign: "left", valign: "middle" },
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      0: { cellWidth: 8, halign: "right" },
      1: { cellWidth: 22 },
      2: { cellWidth: 92 },
      3: { cellWidth: 16, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
    },
    didParseCell: (dataCell) => {
      // Alineación de números (cant, costo, importe)
      if (dataCell.section === "body" && [0, 3, 4, 5].includes(dataCell.column.index)) {
        dataCell.cell.styles.halign = "right";
      }
    },
    margin: { left: margenX, right: margenX },
    // Pie de tabla con totales si hay paginación
    didDrawPage: (d) => {},
  });

  // Posición tras tabla
  y = doc.lastAutoTable.finalY + 4;

  // --------- Totales ----------
  // Usa los del JSON y calcula subtotal ítems por consistencia (opcional)
  const base = safeNum(data.baseimponible);
  const igv = safeNum(data.igv);
  const total = safeNum(data.total);
  const exonerada = safeNum(data.tot_exonerada);
  const gratuita = safeNum(data.tot_gratuita);

  // Cuadro de totales a la derecha
  const cajaX = 105; // mover si deseas
  const totRows = [
    ["Op. Gravada:", money(base)],
    ["Op. Exonerada:", money(exonerada)],
    ["Op. Gratuita:", money(gratuita)],
    [`IGV (${safeNum(data.porc_igv)}%):`, money(igv)],
    ["TOTAL:", money(total)],
  ];

  let yy = y;
  doc.setFontSize(10);
  totRows.forEach(([k, v], i) => {
    const bold = i === totRows.length - 1; // TOTAL en negrita
    doc.setFont("Helvetica", bold ? "bold" : "normal");
    doc.text(k, cajaX, yy);
    doc.text(v, cajaX + 60, yy, { align: "right" });
    yy += 6;
  });

  // Pie y metadatos
  yy += 2;
  doc.setFontSize(8);
  doc.setFont("Helvetica", "normal");
  doc.text(
    `Generado con Domótica System • Fecha: ${toDate(data.fecha_creacion) || toDate(Math.floor(Date.now()/1000))}`,
    margenX,
    yy
  );

  // Guardar/abrir
  const nombrePDF = `COMPRA_${serie || ""}${serie ? "-" : ""}${correl || data.id || ""}.pdf`;
  doc.save(nombrePDF);
}
