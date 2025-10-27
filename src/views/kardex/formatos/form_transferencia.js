import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";
export function imprimirTransferenciaPDF80mm(
  transferencia,
  nombreSedeFn = (s) => s,
  formatoFechaFn = (t) => t
) {
  const doc = new jsPDF({
    unit: "pt",
    format: [302, 600], // altura aumentada por más filas
  });

  const origen = nombreSedeFn(transferencia.sede_origen);
  const destino = nombreSedeFn(transferencia.sede_destino);
  const usuario = transferencia.usuario || "-";
  const fecha = moment
    .unix(transferencia.fecha_unix)
    .format("DD/MM/YYYY hh:mm a");

  doc.setFontSize(14);
  doc.text("TRANSFERENCIA DE PRODUCTOS", 151, 32, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 10, 56);
  doc.text(`Usuario: ${usuario}`, 10, 72);
  doc.text(`Origen: ${origen}`, 10, 88);
  doc.text(`Destino: ${destino}`, 10, 104);
  doc.text(`Total: S/ ${Number(transferencia.total || 0).toFixed(2)}`, 10, 120); // ✅ Total aquí

  if (transferencia.observacion) {
    doc.setFontSize(9);
    doc.text(`Obs: ${transferencia.observacion}`, 10, 120, { maxWidth: 282 });
  }

  const headers = [["Producto", "P. Unit", "Cant.", "Monto"]];
  const data = (transferencia.productos || []).map((p) => [
    (p.nombre || "").toString().substring(0, 18),
    `S/ ${Number(p.precio || 0).toFixed(2)}`,
    p.cantidad?.toString() || "",
    `S/ ${Number(p.monto_soles || 0).toFixed(2)}`,
  ]);

  let startY = 152;
  doc.autoTable({
    head: headers,
    body: data,
    startY,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      halign: "left",
      overflow: "linebreak",
    },
    headStyles: {
      fontStyle: "bold",
      halign: "center",
      fillColor: [230, 230, 230],
    },
    columnStyles: {
      1: { halign: "center", cellWidth: 50 },
      2: { halign: "center", cellWidth: 30 },
      3: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = doc.lastAutoTable.finalY;

  // Pie de firma
  doc.setFontSize(9);
  doc.text("______________________________", 151, finalY + 50, {
    align: "center",
  });
  doc.text("Firma Responsable", 151, finalY + 64, {
    align: "center",
  });

  window.open(doc.output("bloburl"), "_blank");
}
