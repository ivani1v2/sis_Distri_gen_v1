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
        headStyles: { fillColor: [52, 73, 94] } // gris oscuro
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
        headStyles: { fillColor: [41, 128, 185] } // azul
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
        headStyles: { fillColor: [39, 174, 96] } // verde
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
            headStyles: { fillColor: [192, 57, 43] } // rojo
        });
    }

    // ======================
    // 7) GUARDAR PDF
    // ======================
    doc.save(`liquidacion_reparto_${grupo || "sin_grupo"}.pdf`);
};
