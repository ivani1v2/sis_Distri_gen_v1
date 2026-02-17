import jsPDF from "jspdf";
import "jspdf-autotable";

// Función para obtener color según estado
const getEstadoColor = (estado) => {
    const estadoUpper = String(estado || "").toUpperCase();
    switch (estadoUpper) {
        case "ENTREGADO":
            return [46, 125, 50]; // Verde
        case "PARCIAL":
            return [255, 152, 0]; // Naranja
        case "RECHAZADO":
            return [211, 47, 47]; // Rojo
        case "REPROGRAMADO":
            return [156, 39, 176]; // Púrpura
        case "PENDIENTE":
        default:
            return [100, 100, 100]; // Gris
    }
};

export const pdfGenera = (cabeceraGrupo = {}, dataEntrega = {}, grupo = "", gastos = []) => {
    const doc = new jsPDF();
    const moneda = "S/ ";

    // ======================
    // 1) TÍTULO
    // ======================
    doc.setFontSize(16);
    doc.text(`Liquidación de Reparto N° ${grupo}`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24);

    // ======================
    // 2) CLAVES ACTIVAS (sin ANULADOS)
    // ======================
    const clavesActivas = Object.keys(cabeceraGrupo).filter(num => {
        const cab = cabeceraGrupo[num] || {};
        return String(cab.estado || "").toUpperCase() !== "ANULADO";
    });

    // Si no hay nada, salimos rápido
    if (clavesActivas.length === 0) {
        doc.setFontSize(12);
        doc.text("No hay comprobantes activos para este grupo.", 14, 32);
        doc.save(`liquidacion_reparto_${grupo || "sin_grupo"}.pdf`);
        return;
    }

    // ======================
    // 3) RESUMEN GENERAL / POR ESTADO_ENTREGA
    // ======================
    let y = 30; // Ajustado para empezar justo después de la fecha

    const resumenEstados = {
        ENTREGADO: { monto: 0, docs: 0, cobrado: 0 },
        PARCIAL: { monto: 0, docs: 0, cobrado: 0 },
        RECHAZADO: { monto: 0, docs: 0 },
        PENDIENTE: { monto: 0, docs: 0 }
    };

    let totalRechazadoMercGlobal = 0;   // suma de total_rechazado de dataEntrega
    let totalCobradoGlobal = 0;         // suma de total_cobrado de dataEntrega
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

    clavesActivas.forEach(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};

        const estadoEntrega = String(cab.estado_entrega || "").toUpperCase();
        const totalPedido = cab.total != null
            ? Number(cab.total)
            : Number(ent.total_pedido || 0);

        const totalCobrado = Number(ent.total_cobrado || 0);
        const totalRechazado = Number(ent.total_rechazado || 0);

        totalCobradoGlobal += isNaN(totalCobrado) ? 0 : totalCobrado;
        totalRechazadoMercGlobal += isNaN(totalRechazado) ? 0 : totalRechazado;

        const montoValido = isNaN(totalPedido) ? 0 : totalPedido;

        if (estadoEntrega === "ENTREGADO") {
            resumenEstados.ENTREGADO.monto += montoValido;
            resumenEstados.ENTREGADO.docs += 1;
            resumenEstados.ENTREGADO.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
        } else if (estadoEntrega === "PARCIAL") {
            resumenEstados.PARCIAL.monto += montoValido;
            resumenEstados.PARCIAL.docs += 1;
            resumenEstados.PARCIAL.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
        } else if (estadoEntrega === "RECHAZADO") {
            resumenEstados.RECHAZADO.monto += montoValido;
            resumenEstados.RECHAZADO.docs += 1;
        } else {
            resumenEstados.PENDIENTE.monto += montoValido;
            resumenEstados.PENDIENTE.docs += 1;
        }
    });

    const totalPedidoGlobal =
        resumenEstados.ENTREGADO.monto +
        resumenEstados.PARCIAL.monto +
        resumenEstados.RECHAZADO.monto +
        resumenEstados.PENDIENTE.monto;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen general", 14, y);
    y += 4;

    // Cuadro pequeño de resumen
    const bodyResumen = [
        [
            "Total pedido",
            `${moneda}${totalPedidoGlobal.toFixed(2)}`,
            clavesActivas.length
        ],
        [
            "Entregado (completo)",
            `${moneda}${resumenEstados.ENTREGADO.monto.toFixed(2)}`,
            resumenEstados.ENTREGADO.docs
        ],
        [
            "Entregado (parcial) - Cobrado",
            `${moneda}${resumenEstados.PARCIAL.cobrado.toFixed(2)}`,
            resumenEstados.PARCIAL.docs
        ],
        [
            "Rechazado (documento completo)",
            `${moneda}${resumenEstados.RECHAZADO.monto.toFixed(2)}`,
            resumenEstados.RECHAZADO.docs
        ],
        [
            "Pendiente",
            `${moneda}${resumenEstados.PENDIENTE.monto.toFixed(2)}`,
            resumenEstados.PENDIENTE.docs
        ],
        [
            "Cobrado (total)",
            `${moneda}${totalCobradoGlobal.toFixed(2)}`,
            ""
        ],
        [
            "Mercadería rechazada (x ítem)",
            `${moneda}${totalRechazadoMercGlobal.toFixed(2)}`,
            ""
        ]
    ];

    if (gastos.length > 0) {
        bodyResumen.push([
            "Gastos del reparto",
            `${moneda}${totalGastos.toFixed(2)}`,
            gastos.length
        ]);
        bodyResumen.push([
            "Total neto (cobrado - gastos)",
            `${moneda}${(totalCobradoGlobal - totalGastos).toFixed(2)}`,
            ""
        ]);
    }

    doc.autoTable({
        startY: y,
        head: [["Concepto", "Monto", "N° Comprobantes"]],
        body: bodyResumen,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 73, 94] },
        tableWidth: 182,
        margin: { left: 14 }
    });

    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 25;

    // ======================
    // 4) TOTALES POR MÉTODO DE PAGO
    // ======================
    const totalesPorPago = {};

    clavesActivas.forEach(num => {
        const ent = dataEntrega[num] || {};
        (ent.pagos_entrega || []).forEach(pg => {
            const nombre = (pg.nombre || "OTROS").toUpperCase();
            const monto = Number(pg.monto || 0);
            if (!totalesPorPago[nombre]) {
                totalesPorPago[nombre] = 0;
            }
            totalesPorPago[nombre] += isNaN(monto) ? 0 : monto;
        });
    });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Totales por método de pago", 14, y);

    const bodyPagos = Object.entries(totalesPorPago).map(([nombre, monto]) => [
        nombre,
        `${moneda}${monto.toFixed(2)}`
    ]);

    doc.autoTable({
        startY: y + 3,
        head: [["Método de pago", "Monto"]],
        body: bodyPagos,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
        tableWidth: 182,
        margin: { left: 14 }
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 15;

    // ======================
    // 5) CUADRO DE RECHAZOS (por producto)
    // ======================
    const bodyRechazos = [];
    let totalItemsRechazados = 0;

    clavesActivas.forEach(num => {
        const ent = dataEntrega[num] || {};
        (ent.rechazos || []).forEach(r => {
            const totalLinea = Number(r.total_linea || 0);
            const cant = Number(r.cantidad || 0);
            totalItemsRechazados += isNaN(cant) ? 0 : cant;

            bodyRechazos.push([
                num,
                r.nombre || "",
                (r.es_rechazo_parcial ? "UNIDAD" : (r.medida || "")),
                cant || 0,
                `${moneda}${Number(r.precio_unit || 0).toFixed(2)}`,
                `${moneda}${(isNaN(totalLinea) ? 0 : totalLinea).toFixed(2)}`
            ]);
        });
    });

    if (bodyRechazos.length > 0) {
        finalY += 6;
        doc.setFontSize(11);
        doc.text(
            `Productos rechazados (Ítems: ${totalItemsRechazados} | Total: ${moneda}${totalRechazadoMercGlobal.toFixed(2)})`,
            14,
            finalY
        );

        doc.autoTable({
            startY: finalY + 3,
            head: [["Comprobante", "Producto", "Medida", "Cant", "Precio", "Total"]],
            body: bodyRechazos,
            theme: "grid",
            styles: { fontSize: 7 },
            headStyles: { fillColor: [192, 57, 43] },
            tableWidth: 182,
            margin: { left: 14 }
        });

        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;
    }

    // ======================
    // 6) GASTOS DEL REPARTO
    // ======================
    if (gastos.length > 0) {
        finalY += 6;

        doc.setFontSize(11);
        doc.text("Gastos del Reparto", 14, finalY);

        const bodyGastos = gastos.map(g => [
            g.descripcion || '',
            g.usuario || '',
            new Date(g.fecha).toLocaleString(),
            `${moneda}${Number(g.monto || 0).toFixed(2)}`
        ]);

        bodyGastos.push([
            { content: 'TOTAL GASTOS', colSpan: 3, styles: { fontStyle: 'bold' } },
            { content: `${moneda}${totalGastos.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]);

        doc.autoTable({
            startY: finalY + 4,
            head: [["Descripción", "Usuario", "Fecha", "Monto"]],
            body: bodyGastos,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [255, 152, 0] },
            tableWidth: 182,
            margin: { left: 14 }
        });

        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;
    }

    // ======================
    // 7) DETALLE POR COMPROBANTE (al final)
    // ======================
    finalY += 6;
    doc.setFontSize(11);
    doc.text("Detalle por comprobante", 14, finalY);

    const bodyComprobantes = clavesActivas.map(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};
        const estadoEntrega = String(cab.estado_entrega || "PENDIENTE").toUpperCase();

        const totalPedido = cab.total != null
            ? Number(cab.total)
            : Number(ent.total_pedido || 0);

        const totalCobrado = Number(ent.total_cobrado || 0);
        const totalRech = Number(ent.total_rechazado || 0);

        return [
            num,
            (cab.cliente || "").substring(0, 25),
            { content: estadoEntrega, styles: { textColor: getEstadoColor(estadoEntrega) } },
            `${moneda}${(isNaN(totalPedido) ? 0 : totalPedido).toFixed(2)}`,
            `${moneda}${(isNaN(totalCobrado) ? 0 : totalCobrado).toFixed(2)}`,
            `${moneda}${(isNaN(totalRech) ? 0 : totalRech).toFixed(2)}`
        ];
    });

    doc.autoTable({
        startY: finalY + 3,
        head: [
            [
                "Comprobante",
                "Cliente",
                "Estado Entrega",
                "Total Pedido",
                "Cobrado",
                "Rechazado"
            ]
        ],
        body: bodyComprobantes,
        theme: "grid",
        styles: { fontSize: 7 },
        headStyles: { fillColor: [39, 174, 96] },
        tableWidth: 182,
        margin: { left: 14 }
    });

    doc.save(`liquidacion_reparto_${grupo || "sin_grupo"}.pdf`);
};

export const pdfGeneraDetalle = (cabeceraGrupo = {}, dataEntrega = {}, grupo = "", gastos = []) => {
    const doc = new jsPDF();
    const moneda = "S/ ";

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Detalle de Reparto ${grupo}`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24);

    const clavesActivas = Object.keys(cabeceraGrupo).filter(num => {
        const cab = cabeceraGrupo[num] || {};
        return String(cab.estado || "").toUpperCase() !== "ANULADO";
    });

    if (clavesActivas.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("No hay comprobantes activos para este grupo.", 14, 32);
        doc.save(`detalle_reparto_${grupo || "sin_grupo"}.pdf`);
        return;
    }

    // ======================
    // 1) RESUMEN GENERAL (igual que en Liquidación)
    // ======================
    let y = 30;

    // Calcular totales por estado de entrega
    const resumenEstados = {
        ENTREGADO: { monto: 0, docs: 0, cobrado: 0 },
        PARCIAL: { monto: 0, docs: 0, cobrado: 0 },
        RECHAZADO: { monto: 0, docs: 0, cobrado: 0 },
        PENDIENTE: { monto: 0, docs: 0, cobrado: 0 }
    };

    let totalRechazadoMercGlobal = 0;
    let totalCobradoGlobal = 0;
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

    clavesActivas.forEach(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};

        const estadoEntrega = String(cab.estado_entrega || "").toUpperCase();
        const totalPedido = cab.total != null
            ? Number(cab.total)
            : Number(ent.total_pedido || 0);

        const totalCobrado = Number(ent.total_cobrado || 0);
        const totalRechazado = Number(ent.total_rechazado || 0);

        totalCobradoGlobal += isNaN(totalCobrado) ? 0 : totalCobrado;
        totalRechazadoMercGlobal += isNaN(totalRechazado) ? 0 : totalRechazado;

        const montoValido = isNaN(totalPedido) ? 0 : totalPedido;

        if (estadoEntrega === "ENTREGADO") {
            resumenEstados.ENTREGADO.monto += montoValido;
            resumenEstados.ENTREGADO.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
            resumenEstados.ENTREGADO.docs += 1;
        } else if (estadoEntrega === "PARCIAL") {
            resumenEstados.PARCIAL.monto += montoValido;
            resumenEstados.PARCIAL.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
            resumenEstados.PARCIAL.docs += 1;
        } else if (estadoEntrega === "RECHAZADO") {
            resumenEstados.RECHAZADO.monto += montoValido;
            resumenEstados.RECHAZADO.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
            resumenEstados.RECHAZADO.docs += 1;
        } else {
            resumenEstados.PENDIENTE.monto += montoValido;
            resumenEstados.PENDIENTE.cobrado += isNaN(totalCobrado) ? 0 : totalCobrado;
            resumenEstados.PENDIENTE.docs += 1;
        }
    });

    const totalPedidoGlobal =
        resumenEstados.ENTREGADO.monto +
        resumenEstados.PARCIAL.monto +
        resumenEstados.RECHAZADO.monto +
        resumenEstados.PENDIENTE.monto;

    // Calcular totales por método de pago
    const totalesPorPago = {};
    clavesActivas.forEach(num => {
        const ent = dataEntrega[num] || {};
        (ent.pagos_entrega || []).forEach(pg => {
            const nombre = (pg.nombre || "OTROS").toUpperCase();
            const monto = Number(pg.monto || 0);
            if (!totalesPorPago[nombre]) {
                totalesPorPago[nombre] = 0;
            }
            totalesPorPago[nombre] += isNaN(monto) ? 0 : monto;
        });
    });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen general", 14, y);
    y += 4;

    const bodyResumenDetalle = [
        [
            "Total pedido",
            `${moneda}${totalPedidoGlobal.toFixed(2)}`,
            clavesActivas.length
        ],
        [
            "Entregado (completo)",
            `${moneda}${resumenEstados.ENTREGADO.monto.toFixed(2)}`,
            resumenEstados.ENTREGADO.docs
        ],
        [
            "Entregado (parcial) - Cobrado",
            `${moneda}${resumenEstados.PARCIAL.cobrado.toFixed(2)}`,
            resumenEstados.PARCIAL.docs
        ],
        [
            "Rechazado (documento)",
            `${moneda}${resumenEstados.RECHAZADO.monto.toFixed(2)}`,
            resumenEstados.RECHAZADO.docs
        ],
        [
            "Pendiente",
            `${moneda}${resumenEstados.PENDIENTE.monto.toFixed(2)}`,
            resumenEstados.PENDIENTE.docs
        ],
        [
            "Cobrado (total)",
            `${moneda}${totalCobradoGlobal.toFixed(2)}`,
            ""
        ],
        [
            "Mercadería rechazada (x ítem)",
            `${moneda}${totalRechazadoMercGlobal.toFixed(2)}`,
            ""
        ]
    ];

    if (gastos.length > 0) {
        bodyResumenDetalle.push([
            "Gastos del reparto",
            `${moneda}${totalGastos.toFixed(2)}`,
            gastos.length
        ]);
        bodyResumenDetalle.push([
            "Total neto (cobrado - gastos)",
            `${moneda}${(totalCobradoGlobal - totalGastos).toFixed(2)}`,
            ""
        ]);
    }

    doc.autoTable({
        startY: y,
        head: [["Concepto", "Monto", "N° Comprobantes"]],
        body: bodyResumenDetalle,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 73, 94] },
        tableWidth: 'auto',
        margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY + 6;

    // ======================
    // 2) TOTALES POR MÉTODO DE PAGO
    // ======================
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Totales por método de pago", 14, finalY);

    const bodyPagos = Object.entries(totalesPorPago).map(([nombre, monto]) => [
        nombre,
        `${moneda}${monto.toFixed(2)}`
    ]);

    doc.autoTable({
        startY: finalY + 3,
        head: [["Método de pago", "Monto"]],
        body: bodyPagos,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        tableWidth: 'auto',
        margin: { left: 14, right: 14 }
    });

    finalY = doc.lastAutoTable.finalY + 6;

    // ======================
    // 3) PRODUCTOS RECHAZADOS
    // ======================
    const bodyRechazos = [];
    let totalItemsRechazados = 0;

    clavesActivas.forEach(num => {
        const ent = dataEntrega[num] || {};

        (ent.rechazos || []).forEach(r => {
            const totalLinea = Number(r.total_linea || 0);
            const cant = Number(r.cantidad || 0);
            totalItemsRechazados += isNaN(cant) ? 0 : cant;

            bodyRechazos.push([
                num,
                r.nombre || "",
                (r.es_rechazo_parcial ? "UNIDAD" : (r.medida || "")),
                cant || 0,
                `${moneda}${Number(r.precio_unit || 0).toFixed(2)}`,
                `${moneda}${(isNaN(totalLinea) ? 0 : totalLinea).toFixed(2)}`
            ]);
        });
    });

    if (bodyRechazos.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(
            `Productos rechazados (Ítems: ${totalItemsRechazados} | Total: ${moneda}${totalRechazadoMercGlobal.toFixed(2)})`,
            14,
            finalY
        );

        doc.autoTable({
            startY: finalY + 3,
            head: [["Comprobante", "Producto", "Medida", "Cant", "Precio", "Total"]],
            body: bodyRechazos,
            theme: "grid",
            styles: {
                fontSize: 7,
                overflow: 'linebreak'
            },
            headStyles: { fillColor: [192, 57, 43] },
            tableWidth: 'auto',
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 'auto' }
            }
        });
    }

    // ======================
    // 4) GASTOS DEL REPARTO
    // ======================
    if (gastos.length > 0) {
        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : finalY + 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("Gastos del Reparto", 14, finalY);

        const bodyGastos = gastos.map(g => [
            g.descripcion || '',
            g.usuario || '',
            new Date(g.fecha).toLocaleString(),
            `${moneda}${Number(g.monto || 0).toFixed(2)}`
        ]);

        bodyGastos.push([
            { content: 'TOTAL GASTOS', colSpan: 3, styles: { fontStyle: 'bold' } },
            { content: `${moneda}${totalGastos.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]);

        doc.autoTable({
            startY: finalY + 4,
            head: [["Descripción", "Usuario", "Fecha", "Monto"]],
            body: bodyGastos,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [255, 152, 0] },
            tableWidth: 182,
            margin: { left: 14 }
        });
    }

    // ======================
    // 5) DETALLE POR COMPROBANTE (al final)
    // ======================
    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 6;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalle por comprobante", 14, finalY);

    const bodyDetalle = clavesActivas.map(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};
        const estadoEntrega = String(cab.estado_entrega || "PENDIENTE").toUpperCase();

        const totalPedido = cab.total != null ? Number(cab.total) : Number(ent.total_pedido || 0);
        const direccion = cab.direccion || cab.cliente_direccion || "";
        const codVendedor = cab.cod_vendedor || cab.vendedor || cab.vend_code || "";
        const observacion = cab.observacion || ent.observacion || "";

        return [
            num,
            codVendedor,
            (cab.cliente || "").substring(0, 30),
            {
                content: direccion,
                styles: { fontSize: 6 }
            },
            { content: estadoEntrega, styles: { textColor: getEstadoColor(estadoEntrega) } },
            `${moneda}${(isNaN(totalPedido) ? 0 : totalPedido).toFixed(2)}`,
            observacion
        ];
    });

    doc.autoTable({
        startY: finalY + 3,
        head: [["Comprobante", "Vend", "Cliente", "Dirección", "Estado", "Total", "Observación"]],
        body: bodyDetalle,
        theme: "grid",
        styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        headStyles: { fillColor: [39, 174, 96] },
        tableWidth: 182,
        margin: { left: 14 },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 12 },
            2: { cellWidth: 28 },
            3: { cellWidth: 30, fontSize: 6 },
            4: { cellWidth: 18 },
            5: { cellWidth: 22 },
            6: { cellWidth: 50 }
        }
    });

    // Guardar PDF
    doc.save(`detalle_reparto_${grupo || "sin_grupo"}.pdf`);
};