import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";
import * as XLSX from "xlsx";

// Formato ticket 80mm (original mejorado)
export function imprimirTransferenciaPDF80mm(
  transferencia,
  nombreSedeFn = (s) => s,
  formatoFechaFn = (t) => t
) {
  const doc = new jsPDF({
    unit: "pt",
    format: [302, 700],
  });

  const origen = nombreSedeFn(transferencia.sede_origen);
  const destino = nombreSedeFn(transferencia.sede_destino);
  const usuario = transferencia.usuario || "-";
  const fecha = moment.unix(transferencia.fecha_unix).format("DD/MM/YYYY hh:mm a");
  const pesoTotal = Number(transferencia.peso_total || 0).toFixed(2);
  const totalUnidades = transferencia.total_unidades || 
    (transferencia.productos || []).reduce((s, p) => s + Number(p.cantidad || 0), 0);

  doc.setFontSize(14);
  doc.text("TRANSFERENCIA DE PRODUCTOS", 151, 32, { align: "center" });

  doc.setFontSize(10);
  let y = 56;
  doc.text(`Fecha: ${fecha}`, 10, y); y += 16;
  doc.text(`Usuario: ${usuario}`, 10, y); y += 16;
  doc.text(`Origen: ${origen}`, 10, y); y += 16;
  doc.text(`Destino: ${destino}`, 10, y); y += 16;
  doc.text(`Total Unidades: ${totalUnidades}`, 10, y); y += 16;
  doc.text(`Peso Total: ${pesoTotal} kg`, 10, y); y += 16;
  doc.text(`Monto Total: S/ ${Number(transferencia.total || 0).toFixed(2)}`, 10, y); y += 16;

  if (transferencia.observacion) {
    doc.setFontSize(9);
    doc.text(`Obs: ${transferencia.observacion}`, 10, y, { maxWidth: 282 });
    y += 20;
  }

  const headers = [["Producto", "Cant.", "P.Unit", "Monto"]];
  const data = (transferencia.productos || []).map((p) => [
    (p.nombre || "").toString().substring(0, 18),
    p.cantidad?.toString() || "",
    `S/${Number(p.precio || 0).toFixed(2)}`,
    `S/${Number(p.monto_soles || 0).toFixed(2)}`,
  ]);

  doc.autoTable({
    head: headers,
    body: data,
    startY: y + 10,
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
      1: { halign: "center", cellWidth: 35 },
      2: { halign: "right", cellWidth: 45 },
      3: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = doc.lastAutoTable.finalY;

  doc.setFontSize(9);
  doc.text("______________________________", 151, finalY + 50, { align: "center" });
  doc.text("Firma Responsable", 151, finalY + 64, { align: "center" });

  window.open(doc.output("bloburl"), "_blank");
}

export function imprimirTransferenciaPDFA4(
  transferencia,
  nombreSedeFn = (s) => s,
  logoEmpresa = null
) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const origen = nombreSedeFn(transferencia.sede_origen);
  const destino = nombreSedeFn(transferencia.sede_destino);
  const usuario = transferencia.usuario || "-";
  const fecha = moment.unix(transferencia.fecha_unix).format("DD/MM/YYYY hh:mm a");
  const pesoTotal = Number(transferencia.peso_total || 0).toFixed(2);
  const totalUnidades = transferencia.total_unidades || 
    (transferencia.productos || []).reduce((s, p) => s + Number(p.cantidad || 0), 0);

  let y = 40;

  if (logoEmpresa) {
    try {
      doc.addImage(logoEmpresa, "PNG", 40, y, 80, 40);
    } catch (e) {
      console.warn("No se pudo agregar logo:", e);
    }
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSFERENCIA DE PRODUCTOS", pageWidth / 2, y + 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Documento generado: ${moment().format("DD/MM/YYYY HH:mm")}`, pageWidth / 2, y + 35, { align: "center" });
  
  y = 100;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 249, 250);
  const infoBoxHeight = transferencia.observacion ? 140 : 120;
  doc.roundedRect(40, y, pageWidth - 80, infoBoxHeight, 5, 5, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  y += 20;
  
  const col2X = pageWidth / 2 + 20;
  doc.text("ORIGEN:", 55, y);
  doc.setFont("helvetica", "normal");
  doc.text(origen, 115, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("DESTINO:", col2X, y);
  doc.setFont("helvetica", "normal");
  doc.text(destino, col2X + 65, y);
  
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 55, y);
  doc.setFont("helvetica", "normal");
  doc.text(fecha, 100, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Usuario:", col2X, y);
  doc.setFont("helvetica", "normal");
  doc.text(usuario.split("@")[0], col2X + 55, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Total Unidades:", 55, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(totalUnidades), 145, y);
  
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Peso Total:", 55, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${pesoTotal} kg`, 130, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Monto Total:", 55, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 128, 0);
  doc.text(`S/ ${Number(transferencia.total || 0).toFixed(2)}`, 135, y);
  doc.setTextColor(0, 0, 0);

  if (transferencia.observacion) {
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("Observación:", 55, y);
    doc.setFont("helvetica", "normal");
    doc.text(transferencia.observacion.substring(0, 70), 135, y);
  }

  y = 100 + infoBoxHeight + 20;

  const headers = [["#", "Código", "Producto", "Cantidad", "P. Unit.", "Peso", "Subtotal"]];
  const data = (transferencia.productos || []).map((p, i) => [
    i + 1,
    p.codbarra || p.id || "-",
    (p.nombre || "").substring(0, 35),
    p.cantidad,
    `S/ ${Number(p.precio || 0).toFixed(2)}`,
    `${Number(p.peso || 0).toFixed(2)} kg`,
    `S/ ${Number(p.monto_soles || 0).toFixed(2)}`,
  ]);

  doc.autoTable({
    head: headers,
    body: data,
    startY: y,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 30 },
      1: { halign: "center", cellWidth: 70 },
      2: { halign: "left", cellWidth: 180 },
      3: { halign: "center", cellWidth: 55 },
      4: { halign: "right", cellWidth: 60 },
      5: { halign: "right", cellWidth: 55 },
      6: { halign: "right", cellWidth: 65 },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" }
      );
    },
  });

  const finalY = doc.lastAutoTable.finalY + 30;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Productos: ${transferencia.productos?.length || 0}`, 40, finalY);
  doc.text(`Total Unidades: ${totalUnidades}`, 170, finalY);
  doc.text(`Peso Total: ${pesoTotal} kg`, 290, finalY);
  doc.setTextColor(0, 128, 0);
  doc.text(`MONTO TOTAL: S/ ${Number(transferencia.total || 0).toFixed(2)}`, pageWidth - 40, finalY, { align: "right" });

  const firmaY = finalY + 80;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  doc.line(60, firmaY, 200, firmaY);
  doc.text("Entregado por", 130, firmaY + 15, { align: "center" });
  
  doc.line(pageWidth - 200, firmaY, pageWidth - 60, firmaY);
  doc.text("Recibido por", pageWidth - 130, firmaY + 15, { align: "center" });

  window.open(doc.output("bloburl"), "_blank");
}

export function exportarTransferenciaExcel(
  transferencia,
  nombreSedeFn = (s) => s
) {
  const origen = nombreSedeFn(transferencia.sede_origen);
  const destino = nombreSedeFn(transferencia.sede_destino);
  const fecha = moment.unix(transferencia.fecha_unix).format("DD/MM/YYYY HH:mm");
  const pesoTotal = Number(transferencia.peso_total || 0).toFixed(2);
  const totalUnidades = transferencia.total_unidades || 
    (transferencia.productos || []).reduce((s, p) => s + Number(p.cantidad || 0), 0);

  const wb = XLSX.utils.book_new();

  const headerData = [
    ["", "", "TRANSFERENCIA DE PRODUCTOS", "", "", "", ""],
    [],
    ["INFORMACIÓN GENERAL"],
    ["Sede Origen:", origen, "", "Sede Destino:", destino, "", ""],
    ["Fecha:", fecha, "", "Usuario:", (transferencia.usuario || "-").split("@")[0], "", ""],
    ["Total Unidades:", totalUnidades, "", "Peso Total:", `${pesoTotal} kg`, "", ""],
    ["Monto Total:", `S/ ${Number(transferencia.total || 0).toFixed(2)}`, "", "", "", "", ""],
    [],
    ["Observación:", transferencia.observacion || "Sin observaciones"],
    [],
    ["DETALLE DE PRODUCTOS"],
    ["#", "CÓDIGO", "PRODUCTO", "CANTIDAD", "P. UNITARIO", "PESO (kg)", "SUBTOTAL"],
  ];

  const productData = (transferencia.productos || []).map((p, i) => [
    i + 1,
    p.codbarra || p.id || "-",
    p.nombre || "",
    p.cantidad,
    `S/ ${Number(p.precio || 0).toFixed(2)}`,
    Number(p.peso || 0).toFixed(2),
    `S/ ${Number(p.monto_soles || 0).toFixed(2)}`,
  ]);

  const totalesRows = [
    [],
    ["", "", "TOTALES:", totalUnidades, "", pesoTotal, `S/ ${Number(transferencia.total || 0).toFixed(2)}`],
  ];

  const wsData = [...headerData, ...productData, ...totalesRows];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    { s: { r: 8, c: 1 }, e: { r: 8, c: 6 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 6 } },
  ];

  ws["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 45 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
  ];

  ws["!rows"] = [
    { hpt: 30 },
    { hpt: 15 },
    { hpt: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Transferencia");

  const fileName = `Transferencia_${origen}_${destino}_${moment.unix(transferencia.fecha_unix).format("YYYYMMDD")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportarListaTransferenciasExcel(
  transferencias,
  nombreSedeFn = (s) => s
) {
  const headerData = [
    ["REPORTE DE TRANSFERENCIAS"],
    [`Generado: ${moment().format("DD/MM/YYYY HH:mm")}`],
    [],
    ["Fecha", "Origen", "Destino", "Productos", "Unidades", "Peso (kg)", "Monto Total", "Usuario", "Estado", "Observación"],
  ];

  const data = transferencias.map((t) => [
    moment.unix(t.fecha_unix).format("DD/MM/YYYY HH:mm"),
    nombreSedeFn(t.sede_origen),
    nombreSedeFn(t.sede_destino),
    t.productos?.length || 0,
    t.total_unidades || t.productos?.reduce((s, p) => s + Number(p.cantidad || 0), 0) || 0,
    Number(t.peso_total || 0).toFixed(2),
    Number(t.total || 0).toFixed(2),
    (t.usuario || "-").split("@")[0],
    t.estado || "activo",
    t.observacion || "-",
  ]);

  const wsData = [...headerData, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transferencias");

  XLSX.writeFile(wb, `Transferencias_${moment().format("YYYYMMDD_HHmm")}.xlsx`);
}
