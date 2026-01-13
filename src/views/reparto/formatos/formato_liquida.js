import jsPDF from "jspdf";
import "jspdf-autotable";

export const pdfGenera = (cabeceraGrupo = {}, dataEntrega = {}, grupo = "") => {
    const doc = new jsPDF();
    const moneda = "S/ ";

    // ======================
    // 1) TÍTULO
    // ======================
    doc.setFontSize(16);
    doc.text(`Liquidación de Reparto ${grupo}`, 14, 18);

    doc.setFontSize(10);
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
    const resumenEstados = {
        ENTREGADO: { monto: 0, docs: 0, cobrado: 0 },
        RECHAZADO: { monto: 0, docs: 0 },
        PENDIENTE: { monto: 0, docs: 0 }
    };

    let totalRechazadoMercGlobal = 0;   // suma de total_rechazado de dataEntrega
    let totalCobradoGlobal = 0;         // suma de total_cobrado de dataEntrega

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
        resumenEstados.RECHAZADO.monto +
        resumenEstados.PENDIENTE.monto;

    let y = 32;

    doc.setFontSize(11);
    doc.text("Resumen general", 14, y);
    y += 4;

    // Cuadro pequeño de resumen
    doc.autoTable({
        startY: y,
        head: [["Concepto", "Monto", "N° Comprobantes"]],
        body: [
            [
                "Total pedido",
                `${moneda}${totalPedidoGlobal.toFixed(2)}`,
                clavesActivas.length
            ],
            [
                "Entregado (facturado)",
                `${moneda}${resumenEstados.ENTREGADO.monto.toFixed(2)}`,
                resumenEstados.ENTREGADO.docs
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
                "" // no aplica n° docs aquí
            ],
            [
                "Mercadería rechazada (x ítem)",
                `${moneda}${totalRechazadoMercGlobal.toFixed(2)}`,
                "" // cantidad de ítems la veremos en la tabla de rechazos
            ]
        ],
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
    // 5) RESUMEN POR COMPROBANTE
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
            estadoEntrega,
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

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;

    // ======================
    // 6) CUADRO DE RECHAZOS (por producto)
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
                num,                              // Comprobante
                r.nombre || "",                  // Producto
                r.medida || "",                  // Medida
                cant || 0,                       // Cantidad
                `${moneda}${Number(r.precio_unit || 0).toFixed(2)}`, // Precio
                `${moneda}${(isNaN(totalLinea) ? 0 : totalLinea).toFixed(2)}` // Total
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
    }

    // ======================
    // 7) GUARDAR PDF
    // ======================
    doc.save(`liquidacion_reparto_${grupo || "sin_grupo"}.pdf`);
};

export const pdfGeneraDetalle = (cabeceraGrupo = {}, dataEntrega = {}, grupo = "") => {
    const doc = new jsPDF();
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
    const resumenPorMoneda = {};
    let totalRechazadoMercGlobal = 0;

    clavesActivas.forEach(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};

        const monedaRaw = cab.moneda || cab.cod_moneda || ent.moneda || "S/";
        const simbolo = monedaRaw.trim();

        if (!resumenPorMoneda[simbolo]) {
            resumenPorMoneda[simbolo] = {
                contado: 0,
                credito: 0,
                entregado: 0,
                rechazado: 0,
                pendiente: 0,
                total: 0,
                pedidos: 0,
                docsEntregado: 0,
                docsRechazado: 0,
                docsPendiente: 0
            };
        }

        const totalPedido = cab.total != null ? Number(cab.total) : Number(ent.total_pedido || 0);
        const montoValido = isNaN(totalPedido) ? 0 : totalPedido;
        const totalRechazado = Number(ent.total_rechazado || 0);
        totalRechazadoMercGlobal += isNaN(totalRechazado) ? 0 : totalRechazado;

        const condicion = String(cab.condicion_pago || cab.condicion || "CONTADO").toUpperCase();
        if (condicion.includes("CREDITO") || condicion.includes("CRÉDITO")) {
            resumenPorMoneda[simbolo].credito += montoValido;
        } else {
            resumenPorMoneda[simbolo].contado += montoValido;
        }

        const estadoEntrega = String(cab.estado_entrega || "").toUpperCase();
        if (estadoEntrega === "ENTREGADO") {
            resumenPorMoneda[simbolo].entregado += montoValido;
            resumenPorMoneda[simbolo].docsEntregado += 1;
        } else if (estadoEntrega === "RECHAZADO") {
            resumenPorMoneda[simbolo].rechazado += montoValido;
            resumenPorMoneda[simbolo].docsRechazado += 1;
        } else {
            resumenPorMoneda[simbolo].pendiente += montoValido;
            resumenPorMoneda[simbolo].docsPendiente += 1;
        }

        resumenPorMoneda[simbolo].total += montoValido;
        resumenPorMoneda[simbolo].pedidos += 1;
    });

    let y = 32;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen general", 14, y);
    y += 4;

    const bodyResumen = [];
    const monedasKeys = Object.keys(resumenPorMoneda);

    monedasKeys.forEach(simbolo => {
        const res = resumenPorMoneda[simbolo];
        
        if (monedasKeys.length > 1) {
            bodyResumen.push([
                { content: `── ${simbolo} ──`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);
        }

        bodyResumen.push(
            ["Total pedido", `${simbolo} ${res.total.toFixed(2)}`, res.pedidos],
            ["Contado", `${simbolo} ${res.contado.toFixed(2)}`, ""],
            ["Crédito", `${simbolo} ${res.credito.toFixed(2)}`, ""],
            ["Entregado", `${simbolo} ${res.entregado.toFixed(2)}`, res.docsEntregado],
            ["Rechazado (doc)", `${simbolo} ${res.rechazado.toFixed(2)}`, res.docsRechazado],
            ["Pendiente", `${simbolo} ${res.pendiente.toFixed(2)}`, res.docsPendiente]
        );
    });

    doc.autoTable({
        startY: y,
        head: [["Concepto", "Monto", "N° Docs"]],
        body: bodyResumen,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 73, 94] },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 }
        }
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 40;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalle por comprobante", 14, finalY);

    const bodyDetalle = clavesActivas.map(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};

        const monedaSimbolo = cab.moneda || cab.cod_moneda || ent.moneda || "S/";
        const totalPedido = cab.total != null ? Number(cab.total) : Number(ent.total_pedido || 0);
        const direccion = cab.direccion || cab.cliente_direccion || "";
        const codVendedor = cab.cod_vendedor || cab.vendedor || cab.vend_code || "";

        return [
            num,
            codVendedor,
            (cab.cliente || "").substring(0, 30),
            direccion.substring(0, 35),
            `${monedaSimbolo} ${(isNaN(totalPedido) ? 0 : totalPedido).toFixed(2)}`,
            ""
        ];
    });

    doc.autoTable({
        startY: finalY + 3,
        head: [["Comprobante", "Vendedor", "Cliente", "Dirección", "Total Pedido", "Observación"]],
        body: bodyDetalle,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [39, 174, 96] },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 15 },
            2: { cellWidth: 40 },
            3: { cellWidth: 40 },
            4: { cellWidth: 22 },
            5: { cellWidth: 40 }
        }
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;

    const bodyRechazos = [];
    let totalItemsRechazados = 0;

    clavesActivas.forEach(num => {
        const cab = cabeceraGrupo[num] || {};
        const ent = dataEntrega[num] || {};
        const monedaSimbolo = cab.moneda || cab.cod_moneda || ent.moneda || "S/";

        (ent.rechazos || []).forEach(r => {
            const totalLinea = Number(r.total_linea || 0);
            const cant = Number(r.cantidad || 0);
            totalItemsRechazados += isNaN(cant) ? 0 : cant;

            bodyRechazos.push([
                num,
                r.nombre || "",
                r.medida || "",
                cant || 0,
                `${monedaSimbolo} ${Number(r.precio_unit || 0).toFixed(2)}`,
                `${monedaSimbolo} ${(isNaN(totalLinea) ? 0 : totalLinea).toFixed(2)}`
            ]);
        });
    });

    if (bodyRechazos.length > 0) {
        finalY += 6;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(
            `Productos rechazados (Ítems: ${totalItemsRechazados} | Total: S/ ${totalRechazadoMercGlobal.toFixed(2)})`,
            14,
            finalY
        );

        doc.autoTable({
            startY: finalY + 3,
            head: [["Comprobante", "Producto", "Medida", "Cant", "Precio", "Total"]],
            body: bodyRechazos,
            theme: "grid",
            styles: { fontSize: 7 },
            headStyles: { fillColor: [192, 57, 43] }
        });
    }

    doc.save(`detalle_reparto_${grupo || "sin_grupo"}.pdf`);
};
