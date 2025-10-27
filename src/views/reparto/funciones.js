export function irGoogleMaps(pedido) {
    if (pedido.latitud && pedido.longitud) {
        const url = `https://www.google.com/maps?q=${pedido.latitud},${pedido.longitud}`;
        window.open(url, "_blank");
    } else {
        alert("Este cliente no tiene coordenadas registradas.");
    }
}
export function enviarWhatsApp(pedido) {
    const telefono = String(pedido.telefono || "").replace(/\D/g, "");
    if (!telefono) {
        alert("Este cliente no tiene número de teléfono registrado.");
        return;
    }

    const mensaje = encodeURIComponent(`Hola ${pedido.cliente}, le escribimos respecto a su pedido N° ${pedido.id}.`);
    const url = `https://wa.me/51${telefono}?text=${mensaje}`;
    window.open(url, "_blank");
}
export function llamarCliente(pedido) {
    const telefono = String(pedido.telefono || "").replace(/\D/g, "");
    if (!telefono) {
        alert("Este cliente no tiene número de teléfono registrado.");
        return;
    }
    window.open(`tel:${telefono}`);
}
export function chipColor(estado) {
    const s = (estado || '').toString().toLowerCase();
    if (s === 'anulado') return 'red';
    if (s === 'enviado') return 'blue';
    return 'orange'; // pendiente y otros
}
export function chipColorEntrega(estado) {
    const s = (estado || '').toString().trim().toLowerCase();
    if (s === 'entregado') return 'info';
    if (s === 'reprogramado') return 'success';
    if (s === 'rechazado') return 'error';
    // default: pendiente u otros
    return 'warning';
}
export function estadoColorTexto(estado) {
    // normalizamos
    const st = (estado || '').toLowerCase();

    // puedes alinear con tu iconoPorEstado:
    // pendiente -> naranja
    // rechazado -> rojo
    // entregado/atendido -> verde
    // default -> #999 (gris)
    if (st === 'rechazado') return 'red';
    if (st === 'entregado' || st === 'atendido') return 'green';
    if (st === 'pendiente') return 'orange';
    // otros (reprogramado, etc.)
    return '#0091ff'; // celeste como tus marcadores ltblue/naranja/etc.
}