// formatos_cuentas.js
// Generador de PDF A4 para cronograma de cuentas por cobrar

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import moment from "moment";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs =
  pdfFonts.pdfMake?.vfs ||
  pdfFonts.default?.pdfMake?.vfs ||
  pdfFonts.vfs ||
  {};

// Helper: fecha DD/MM/YYYY
function fFecha(unix) {
  if (!unix) return "";
  return moment.unix(unix).format("DD/MM/YYYY");
}

// Helper: fecha y hora
function fFechaHora(unix) {
  if (!unix) return "";
  return moment.unix(unix).format("DD/MM/YYYY HH:mm");
}

// Helper: moneda
function fMoneda(valor, moneda = "S/") {
  const num = Number(valor || 0);
  return `${moneda} ${num.toFixed(2)}`;
}

/**
 * Genera un PDF A4 con la constancia de pago de UNA cuota.
 *
 * @param {Object} cuenta  Objeto completo de la cuenta por cobrar
 * @param {Object} cuota   Objeto de la cuota ya pagada (un elemento de cuenta.datos)
 * @param {Array}  pagos   Array de métodos de pago usados:
 *                         [{ nombre: 'EFECTIVO', monto: 35.08, fecha: 1764821199 }, ...]
 */
export function reporte_liquidacion_cuota(cuenta, cuota, pagos = []) {
  if (!cuenta || !cuota) {
    alert("No se puede generar la liquidación: datos incompletos.");
    return;
  }

  const moneda = cuenta.moneda || "S/";
  const fechaPagoUnix = cuota.fecha_pagado || (pagos[0] && pagos[0].fecha) || moment().unix();
  const fechaEmisionUnix = moment().unix();

  // Total abonado = suma de métodos de pago
  const totalAbonado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0) || cuota.monto || 0;

  // Saldo del crédito después del pago (si viene en cuenta)
  const saldoCredito = cuenta.monto_pendiente != null
    ? Number(cuenta.monto_pendiente)
    : 0;

  // Tabla de métodos de pago
  const tablaPagosBody = [
    [
      { text: "MÉTODO", style: "tableHeader" },
      { text: "MONTO", style: "tableHeader" },
      { text: "FECHA REGISTRO", style: "tableHeader" }
    ]
  ];

  if (pagos.length) {
    pagos.forEach(p => {
      tablaPagosBody.push([
        { text: String(p.nombre || ""), style: "tableCell" },
        { text: fMoneda(p.monto, moneda), style: "tableCell", alignment: "right" },
        { text: fFechaHora(p.fecha), style: "tableCell", alignment: "center" }
      ]);
    });
  } else {
    // Si por alguna razón no se guardaron pagos_detalle, al menos mostramos una fila genérica
    tablaPagosBody.push([
      { text: "PAGO REGISTRADO", style: "tableCell" },
      { text: fMoneda(totalAbonado, moneda), style: "tableCell", alignment: "right" },
      { text: fFechaHora(fechaPagoUnix), style: "tableCell", alignment: "center" }
    ]);
  }

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [30, 40, 30, 40],
    info: {
      title: `Liquidación de Cuota - ${cuenta.doc_ref} - ${cuota.id || ""}`,
      author: "Domótica System",
    },
    content: [
      // ENCABEZADO
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "CONSTANCIA DE PAGO DE CUOTA", style: "titulo" },
              {
                text: "Crédito - Cuentas por Cobrar",
                style: "subtitulo",
                margin: [0, 4, 0, 0]
              }
            ]
          },
          {
            width: "auto",
            stack: [
              {
                text: `Fecha emisión:\n${fFechaHora(fechaEmisionUnix)}`,
                style: "metaDerecha",
                alignment: "right"
              },
              {
                text: `Usuario: ${cuenta.vendedor || "-"}`,
                style: "metaDerecha",
                alignment: "right",
                margin: [0, 4, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 10]
      },

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5 }] },
      { text: " ", margin: [0, 3] },

      // DATOS DEL CLIENTE Y CRÉDITO
      {
        style: "bloque",
        table: {
          widths: ["25%", "75%"],
          body: [
            [
              { text: "Cliente:", style: "etiqueta" },
              { text: `${cuenta.cliente || cuenta.nombre || ""}`, style: "valor" }
            ],
            [
              { text: "Documento:", style: "etiqueta" },
              { text: `${cuenta.documento || ""}`, style: "valor" }
            ],
            [
              { text: "N° Crédito:", style: "etiqueta" },
              { text: `${cuenta.doc_ref || ""}`, style: "valor" }
            ],
            [
              { text: "Fecha Emisión Crédito:", style: "etiqueta" },
              { text: fFecha(cuenta.fecha), style: "valor" }
            ],
          ]
        },
        layout: "noBorders",
        margin: [0, 0, 0, 10]
      },

      // RESUMEN DE LA CUOTA PAGADA
      {
        style: "bloque",
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: [
            [
              { text: "Cuota N°", style: "etiqueta" },
              { text: String(cuota.id || ""), style: "valor" },
              { text: "Estado Cuota", style: "etiqueta" },
              { text: String(cuota.estado || ""), style: "valor" }
            ],
            [
              { text: "Fecha Vencimiento", style: "etiqueta" },
              { text: fFecha(cuota.fecha_vence), style: "valor" },
              { text: "Fecha de Pago", style: "etiqueta" },
              { text: fFechaHora(fechaPagoUnix), style: "valor" }
            ],
            [
              { text: "Monto Cuota", style: "etiqueta" },
              { text: fMoneda(cuota.monto, moneda), style: "valor" },
              { text: "Monto Pagado", style: "etiqueta" },
              { text: fMoneda(totalAbonado, moneda), style: "valor" }
            ],
            [
              { text: "Importe Total Crédito", style: "etiqueta" },
              { text: fMoneda(cuenta.monto_total, moneda), style: "valor" },
              { text: "Saldo del Crédito", style: "etiqueta" },
              { text: fMoneda(saldoCredito, moneda), style: "valorResaltado" }
            ],
          ]
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14]
      },

      // TABLA DETALLE DE MÉTODOS DE PAGO
      {
        text: "Detalle de métodos de pago",
        style: "tituloSeccion",
        margin: [0, 0, 0, 6]
      },
      {
        style: "tablaPagos",
        table: {
          headerRows: 1,
          widths: ["40%", "25%", "35%"],
          body: tablaPagosBody
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? [60, 60, 60] : null; // plomo oscuro para encabezado
          },
          hLineWidth: function () { return 0.5; },
          vLineWidth: function () { return 0.5; },
          hLineColor: function () { return "#CCCCCC"; },
          vLineColor: function () { return "#CCCCCC"; }
        },
        margin: [0, 0, 0, 18]
      },

      // TEXTO LEGAL / PIE
      {
        text:
          "La presente constancia acredita el pago de la(s) cuota(s) indicada(s) " +
          "correspondiente(s) al crédito señalado. Conserve este documento como respaldo.",
        style: "nota",
        margin: [0, 0, 0, 40]
      },

      {
        columns: [
          {
            width: "50%",
            stack: [
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.5 }] },
              { text: "Firma del Cliente", style: "firmaLabel", margin: [0, 4, 0, 0] }
            ],
            margin: [0, 0, 10, 0]
          },
          {
            width: "50%",
            stack: [
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.5 }] },
              { text: "Firma y sello de la Empresa", style: "firmaLabel", margin: [0, 4, 0, 0] }
            ],
            margin: [10, 0, 0, 0]
          }
        ]
      }
    ],
    styles: {
      titulo: {
        fontSize: 15,
        bold: true,
        color: "#263238"
      },
      subtitulo: {
        fontSize: 10,
        color: "#455A64"
      },
      metaDerecha: {
        fontSize: 9,
        color: "#555555"
      },
      bloque: {
        fontSize: 10
      },
      etiqueta: {
        bold: true,
        color: "#37474F",
        fontSize: 9
      },
      valor: {
        fontSize: 9
      },
      valorResaltado: {
        fontSize: 10,
        bold: true,
        color: "#D32F2F"
      },
      tituloSeccion: {
        fontSize: 11,
        bold: true,
        color: "#37474F"
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: "#FFFFFF",
        alignment: "center"
      },
      tableCell: {
        fontSize: 9,
        margin: [2, 2, 2, 2]
      },
      nota: {
        fontSize: 9,
        italics: true,
        color: "#555555"
      },
      firmaLabel: {
        fontSize: 9,
        alignment: "center"
      }
    },
    defaultStyle: {
      fontSize: 9
    }
  };

  pdfMake.createPdf(docDefinition).open();
}

/**
 * Genera un PDF A4 con el resumen del crédito y su cronograma de pagos.
 * @param {Object} data - Objeto de la cuenta por cobrar, por ejemplo:
 * {
 *   datos: [ { estado, fecha_vence, fecha_pagado?, id, monto }, ... ],
 *   doc_ref, documento, estado, fecha, fecha_vence,
 *   moneda, monto_pendiente, monto_total, nombre,
 *   vendedor, cliente
 * }
 */
export function reporte_cronograma(data) {
  if (!data) {
    console.error('reporte_cronograma: data es requerido')
    return
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Helpers
  const moneda = data.moneda || 'S/'
  const formatFecha = (unix) => {
    if (!unix) return ''
    return moment.unix(unix).format('DD/MM/YYYY')
  }
  const formatNum = (val) => {
    const n = Number(val) || 0
    return n.toFixed(2)
  }

  const ahoraStr = moment().format('DD/MM/YYYY HH:mm')
  const docRef = data.doc_ref || ''

  // =========================
  //  ENCABEZADO
  // =========================
  let y = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('CRONOGRAMA DE PAGO', 105, y, { align: 'center' })

  y += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${ahoraStr}`, 105, y, { align: 'center' })

  // =========================
  //  DATOS DEL COMPROBANTE
  // =========================
  y += 10

  const leftX = 15
  const rightX = 115

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Datos del Crédito', leftX, y)

  y += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Columna izquierda
  doc.text(`Comprobante: ${docRef}`, leftX, y)
  y += 5
  doc.text(`Cliente: ${data.nombre || data.cliente || ''}`, leftX, y)
  y += 5
  doc.text(`Documento: ${data.documento || ''}`, leftX, y)
  y += 5
  doc.text(`Vendedor: ${data.vendedor || ''}`, leftX, y)

  // Columna derecha
  let yRight = y - 15
  doc.text(`Fecha Emisión: ${formatFecha(data.fecha)}`, rightX, yRight)
  yRight += 5
  doc.text(`Fecha Vencimiento: ${formatFecha(data.fecha_vence)}`, rightX, yRight)
  yRight += 5
  doc.text(`Estado: ${data.estado || ''}`, rightX, yRight)
  yRight += 5
  doc.text(`Moneda: ${moneda}`, rightX, yRight)

  // =========================
  //  RESUMEN MONTOS
  // =========================
  y = Math.max(y, yRight) + 8

  const montoTotal = Number(data.monto_total || 0)
  const montoPendiente = Number(data.monto_pendiente || 0)

  const sumaCronograma = Array.isArray(data.datos)
    ? data.datos.reduce((acc, it) => acc + (Number(it.monto) || 0), 0)
    : 0

  const diff = montoTotal - sumaCronograma

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Resumen de Montos', leftX, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${moneda} Monto total del crédito: ${formatNum(montoTotal)}`, leftX, y)
  y += 5
  doc.text(`${moneda} Total cronograma (cuotas): ${formatNum(sumaCronograma)}`, leftX, y)
  y += 5
  doc.text(`${moneda} Pendiente actual: ${formatNum(montoPendiente)}`, leftX, y)
  y += 6

  // Mensaje si no cuadra
  if (Math.abs(diff) > 0.01) {
    doc.setTextColor(200, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `¡Atención! El cronograma no cuadra con el monto total. Diferencia: ${moneda} ${formatNum(diff)}`,
      leftX,
      y
    )
    doc.setTextColor(0, 0, 0)
    y += 6
  }

  // =========================
  //  TABLA DEL CRONOGRAMA
  // =========================
  const cuotas = Array.isArray(data.datos) ? data.datos : []

  const rows = cuotas.map((cuota, idx) => {
    const fechaVenceStr = formatFecha(cuota.fecha_vence)
    const fechaPagoStr =
      cuota.estado === 'PAGADO' && cuota.fecha_pagado
        ? formatFecha(cuota.fecha_pagado)
        : ''
    return [
      idx + 1,
      cuota.id || '',
      cuota.estado || '',
      fechaVenceStr,
      fechaPagoStr,
      `${moneda} ${formatNum(cuota.monto)}`
    ]
  })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle del Cronograma', leftX, y)
  y += 4

  // Márgenes pequeños para usar casi todo el ancho
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 10

  doc.autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    tableWidth: pageWidth - marginX * 2, // casi todo el ancho
    head: [[
      '#',
      'ID',
      'Estado',
      'Fecha Venc.',
      'Fecha Pago',
      'Monto'
    ]],
    body: rows,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
   fillColor: [60, 60, 60],
      textColor: 255,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },  // #
      1: { halign: 'center', cellWidth: 20 },  // ID
      2: { halign: 'center', cellWidth: 40 },  // Estado
      3: { halign: 'center', cellWidth: 40 },  // Fecha Venc.
      4: { halign: 'center', cellWidth: 40 },  // Fecha Pago
      5: { halign: 'right',  cellWidth: 40 },  // Monto
    },
    theme: 'striped',
    didDrawPage: function () {
      // Encabezado fijo por página
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text(
        `Cronograma de pago - ${docRef}`,
        marginX,
        8
      )

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages()
      const str = 'Página ' + pageCount
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text(
        str,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      )
    }
  })

  // =========================
  //  GUARDAR / DESCARGAR
  // =========================
  const nombreArchivo = `${docRef || 'cronograma'}.pdf`
  doc.save(nombreArchivo)
}
