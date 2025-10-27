// rep_consolidado.js
import jsPDF from "jspdf"
import "jspdf-autotable"

export function exportConsolidadoPDF({
  itemsAgrupados = [],
  selectedIds = [],
  totalCabecera,
  filename = "consolidado_pedidos.pdf"
}) {
  const n2 = (x) => Number(x || 0).toFixed(2)

  // Totales monetarios
  const totalLineas = itemsAgrupados.reduce((s, g) => s + Number(g.total || 0), 0)
  const totalReporte = Number.isFinite(Number(totalCabecera)) ? Number(totalCabecera) : totalLineas

  // 👉 Acumular totales Paquetes/Unidades
  const { totalPaq, totalUnd } = itemsAgrupados.reduce((acc, g) => {
    const c = g.cantidad
    if (typeof c === "string") {
      const [p, u] = c.split("/").map(v => Number(v))
      if (Number.isFinite(p)) acc.totalPaq += p
      if (Number.isFinite(u)) acc.totalUnd += u
    } else if (Number.isFinite(Number(c))) {
      acc.totalUnd += Number(c) // cantidad numérica = unidades
    }
    return acc
  }, { totalPaq: 0, totalUnd: 0 })

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })

  // Título
  const titulo = `Consolidado de pedidos (${selectedIds.length}) — Total S/. ${n2(totalReporte)}`
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(12)
  doc.text(titulo, 10, 12)

  const difiere = Number.isFinite(Number(totalCabecera)) && Math.abs(totalReporte - totalLineas) > 0.005
  if (difiere) {
    doc.setFont("Helvetica", "")
    doc.setFontSize(9)
    doc.text(`(Suma de líneas: S/. ${n2(totalLineas)})`, 10, 16)
  }

  const startY = difiere ? 21 : 16

  // Filas
  const body = itemsAgrupados.map((g) => {
    const prod = `${g.nombre}${g.medida ? ` x ${g.medida}` : ""}`
    let cantDisplay
    if (typeof g.cantidad === "string") {
      cantDisplay = g.cantidad
    } else if (Number.isFinite(Number(g.cantidad))) {
      cantDisplay = n2(g.cantidad)
    } else {
      cantDisplay = String(g.cantidad ?? "")
    }
    return [prod, cantDisplay, n2(g.precioUnitProm), n2(g.total)]
  })

  // 👉 Pie de tabla con totales de paquetes y unidades
  const foot = [
    ["", `Tot. Paq/Und: ${totalPaq}/${totalUnd}`, "", ""] // lo mostramos en la columna "Cant."
  ]

  doc.autoTable({
    head: [["Producto", "Cant.", "Precio", "Total S/."]],
    body,
    foot,
    startY,
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [63, 81, 181], textColor: 255, halign: "center" },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold",halign: "right" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { top: startY, left: 10, right: 10, bottom: 14 }, // deja espacio para texto extra
    didDrawPage: (data) => {
      // Número de página
      const pageNum = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setFont("Helvetica", "")
      doc.text(`Página ${pageNum}`, 200 - 10, 287, { align: "right" })
    },
  })


  abre_dialogo_impresion(doc)
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