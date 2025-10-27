import { jsPDF } from "jspdf";

export function form_devolucion({
  serie,
  correlativo,
  fecha,
  productos,
  usuario,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });

  let y = 8;
  doc.setFontSize(14);
  doc.text("DEVOLUCIÓN", 40, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 4, y);
  y += 5;
  doc.text(`Serie: ${serie}   Correlativo: ${correlativo}`, 4, y);
  y += 5;
  doc.text(`Usuario: ${usuario || "-"}`, 4, y);
  y += 8;

  doc.text("PRODUCTOS DEVUELTOS:", 4, y);
  y += 6;

  doc.setFont("courier", "normal");
  doc.setFontSize(9);

  // Encabezado de la tabla, bien alineado
  doc.text("Producto", 4, y);
  doc.text("Cant", 44, y, { align: "right" });
  doc.text("Precio", 60, y, { align: "right" });
  doc.text("Total", 76, y, { align: "right" });
  y += 5;
  doc.setLineWidth(0.1);
  doc.line(4, y, 76, y);

  y += 3;

  let totalGeneral = 0;
  productos.forEach((p) => {
    if (p.devolver_real && p.devolver_real > 0) {
      const nombre = String(p.nombre).slice(0, 28); // Ajusta si necesitas más espacio
      const cantidad = p.devolver_real;
      const precio = Number(p.precioVentaUnitario).toFixed(2);
      const total = (cantidad * Number(p.precioVentaUnitario)).toFixed(2);
      totalGeneral += Number(total);

      doc.text(nombre, 4, y);
      doc.text(`${cantidad}`, 44, y, { align: "right" });
      doc.text(`${precio}`, 60, y, { align: "right" });
      doc.text(`${total}`, 76, y, { align: "right" });
      y += 5;
    }
  });

  y += 3;
  doc.setLineWidth(0.1);
  doc.line(4, y, 76, y);
  y += 5;
  doc.setFontSize(11);
  doc.text(`Total devuelto: S/ ${totalGeneral.toFixed(2)}`, 76, y, {
    align: "right",
  });
  y += 8;

  doc.setFontSize(8);
  doc.text("Gracias por su visita.", 40, y, { align: "center" });

  if (y > 200) doc.internal.pageSize.height = y + 10;

  window.open(doc.output("bloburl"));
}
