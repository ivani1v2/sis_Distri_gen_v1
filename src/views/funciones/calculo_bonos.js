/**
 * cálculo de precios por escala y bonos automáticos
 * Autor: Tú 🚀
 *
 * API:
 *  - analizaPrecios({ lineas, productos, bonos, redondear, inPlace })
 *  - analizaGrupos({ lineas, productos, bonos, createUUID, redondear, inPlace })
 *  - aplicaPreciosYBonos(opts)  // helper: precios -> bonos
 *
 * Donde:
 *  - lineas: Array de líneas del comprobante (listaproductos)
 *  - productos: store.state.productos
 *  - bonos: store.state.bonos
 *  - redondear: fn(number) => string/number (usa tu formato decimal)
 *  - createUUID: fn() => string (para líneas de bono)
 *  - inPlace: boolean (true = muta arreglo original; false = retorna copia)
 */

function _clonarSiNecesario(arr, inPlace) {
    return inPlace ? arr : JSON.parse(JSON.stringify(arr || []));
}

function _toUpper(val) {
    return String(val || "").toUpperCase();
}

function _isGratuita(linea) {
    return _toUpper(linea?.operacion) === "GRATUITA";
}

function _getReglasBono(cfg) {
    // Soporta: data = []  o  data = { bonos: [] }
    if (!cfg) return [];
    if (Array.isArray(cfg.data)) return cfg.data;
    if (Array.isArray(cfg.data?.bonos)) return cfg.data.bonos;
    return [];
}

/**
 * Aplica o revierte precio por escala de grupo_precio
 */
export function analizaPrecios({
    lineas = [],
    productos = [],
    bonos = {},
    redondear = (n) => Number(n).toFixed(2),
    inPlace = true,
} = {}) {
    const res = _clonarSiNecesario(lineas, inPlace);

    // 1) Sumar cantidades por grupo_precio (excluye GRATUITA)
    const totalPorGrupoPrecio = {};
    for (const linea of res) {
        if (_isGratuita(linea)) continue;
        const prod = productos.find((p) => String(p.id) === String(linea.id));
        if (!prod) continue;

        const grupo = prod.grupo_precio || null;
        if (!grupo) continue;

        const cfg = bonos[grupo];
        if (!cfg || cfg.tipo !== "precio" || !cfg.activo) continue;

        totalPorGrupoPrecio[grupo] = (totalPorGrupoPrecio[grupo] || 0) + Number(linea.cantidad || 0);
    }

    // 2) Para cada grupo, decide el precio objetivo por escala (o null si no aplica)
    for (const [grupoId, cantidadGrupo] of Object.entries(totalPorGrupoPrecio)) {
        const cfg = bonos[grupoId];
        if (!cfg) continue;

        const esc1 = Number(cfg.escala_may1 || 0);
        const esc2 = Number(cfg.escala_may2 || 0);
        const p1 = Number(cfg.precio_may1 || 0);
        const p2 = Number(cfg.precio_may2 || 0);

        let precioObjetivo = null;
        if (esc2 && cantidadGrupo >= esc2 && p2) precioObjetivo = p2;
        else if (esc1 && cantidadGrupo >= esc1 && p1) precioObjetivo = p1;

        // 3) Aplica precio por escala o revierte al precio_base
        for (const linea of res) {
            if (_isGratuita(linea)) continue;

            const prod = productos.find((p) => String(p.id) === String(linea.id));
            if (!prod) continue;
            if ((prod.grupo_precio || null) !== grupoId) continue;

            // Asegura tener precio_base
            if (linea.precio_base == null) {
                linea.precio_base = Number(linea.precio || 0);
            }

            const nuevoPrecio =
                precioObjetivo != null ? Number(precioObjetivo) : Number(linea.precio_base || 0);

            linea.precio = nuevoPrecio;

            // Evita descuento >= precio (tu UI suma descuentos aparte)
            const desc = Number(linea.preciodescuento || 0);
            if (desc >= linea.precio) {
                linea.preciodescuento = 0;
            }

            // Recalcula totalLinea (sin restar descuento aquí)
            linea.totalLinea = redondear(Number(linea.cantidad || 0) * Number(linea.precio || 0));
        }
    }

    // 4) Revertir grupos con config de precio que no quedaron en el mapa (qty total = 0, etc.)
    for (const linea of res) {
        if (_isGratuita(linea)) continue;

        const prod = productos.find((p) => String(p.id) === String(linea.id));
        if (!prod) continue;

        const grupo = prod.grupo_precio || null;
        if (!grupo) continue;

        const cfg = bonos[grupo];
        if (!cfg || cfg.tipo !== "precio" || !cfg.activo) continue;

        if (!(grupo in totalPorGrupoPrecio)) {
            if (linea.precio_base == null) linea.precio_base = Number(linea.precio || 0);
            linea.precio = Number(linea.precio_base || 0);
            const desc = Number(linea.preciodescuento || 0);
            if (desc >= linea.precio) linea.preciodescuento = 0;
            linea.totalLinea = redondear(Number(linea.cantidad || 0) * Number(linea.precio || 0));
        }
    }

    return res;
}

/**
 * Calcula y agrega líneas de bonos (GRATUITA) por grupo_bono
 */
export function analizaGrupos({
    lineas = [],
    productos = [],
    bonos = {},
    createUUID = () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Date.now() + Math.random() * 16) % 16 | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        }),
    redondear = (n) => Number(n).toFixed(2),
    inPlace = true,
} = {}) {
    // 1) Limpiar bonos automáticos previos (recalcular desde cero)
    const base = (lineas || []).filter((l) => !l?.bono_auto);
    const res = _clonarSiNecesario(base, inPlace);

    // 2) Sumar cantidades por grupo_bono (solo NO gratuitas)
  const totalPorGrupo = {};
for (const linea of res) {
    if (_isGratuita(linea)) continue;

    const prod = productos.find((p) => String(p.id) === String(linea.id));
    if (!prod) continue;

    const grupo = prod.grupo_bono || null;
    if (!grupo) continue;

    const factorLinea = Number(linea.factor || 1);
    const medidaLinea = String(linea.medida || '').trim().toUpperCase();

    // 👉 cantidad usada para BONO: siempre en unidades
    let unidadesLinea = Number(linea.cantidad || 0);

    // Si es CAJA (u otra medida distinta de UNIDAD) y factor>1,
    // convertimos cajas → unidades
    if (factorLinea > 1 && medidaLinea !== 'UNIDAD') {
        unidadesLinea = unidadesLinea * factorLinea;
    }

    totalPorGrupo[grupo] = (totalPorGrupo[grupo] || 0) + unidadesLinea;
}

    // 3) Por cada grupo con reglas, generar líneas GRATUITA
    // 3) Por cada grupo con reglas, generar líneas GRATUITA
    for (const [grupoId, cantidadGrupo] of Object.entries(totalPorGrupo)) {
        const cfg = bonos[grupoId];
        console.log("Analizando bono grupo:", grupoId, "cfg:", cfg);
        if (!cfg || cfg.tipo !== "bono" || !cfg.activo) continue;

        const reglas = _getReglasBono(cfg);

        // >>> NUEVO: elegir SOLO la mejor regla (la de mayor 'apartir_de' que aplique)
        let reglaElegida = null;
        for (const regla of reglas) {
            const apartir = Number(regla.apartir_de || 0);
            if (!apartir) continue;
            if (cantidadGrupo >= apartir) {
                // nos quedamos con la de mayor 'apartir_de' alcanzada
                if (!reglaElegida || apartir > Number(reglaElegida.apartir_de || 0)) {
                    reglaElegida = regla;
                }
            }
        }
        if (!reglaElegida) continue;

        const apartir = Number(reglaElegida.apartir_de || 0);
        const cantBono = Number(reglaElegida.cantidad_bono || 0);
        const cantMax =
            reglaElegida.cantidad_max != null ? Number(reglaElegida.cantidad_max) : null;
        const idBono = reglaElegida.codigo;

        if (!apartir || !cantBono || !idBono) continue;

        const veces = Math.floor(cantidadGrupo / apartir);
        if (veces <= 0) continue;

        let qtyFree = veces * cantBono;
        if (cantMax != null && Number.isFinite(cantMax)) qtyFree = Math.min(qtyFree, cantMax);
        if (qtyFree <= 0) continue;

        const prodBono = productos.find((p) => String(p.id) === String(idBono));
        if (!prodBono) continue;
        const precioUnitarioBono = Number(
            prodBono.precio != null
                ? prodBono.precio
                : (prodBono.precio_base || 0)
        );
        const medidaLinea = String(prodBono.medida || "").trim().toUpperCase() || "UNIDAD";
        const factorProd = Number(prodBono.factor || 1);

        // 🔹 Peso base del producto (por presentación)
        const basePeso = Number(prodBono.peso || 0);

        // 🔹 Cálculo de peso de la línea (mismo criterio que en agregarLista)
        let pesoLinea = 0;
        if (factorProd > 1 && medidaLinea !== "UNIDAD") {
            // Ej: CAJA x 12 und → peso * factor * cantidad_de_cajas
            pesoLinea = basePeso * factorProd * Number(qtyFree);
        } else {
            // UNIDAD o factor 1 → peso * unidades
            pesoLinea = basePeso * Number(qtyFree);
        }
        res.push({
            uuid: createUUID().slice(-7),
            id: prodBono.id,
            nombre: prodBono.nombre,
            medida: "UNIDAD",
            factor: Number(prodBono.factor || 1),
            cantidad: Number(qtyFree), // SIEMPRE en unidades
            precio: precioUnitarioBono,
            precio_base: precioUnitarioBono,
            preciodescuento: 0,
            costo: Number(prodBono.costo || 0),
            tipoproducto: prodBono.tipoproducto,
            operacion: "GRATUITA",
            peso: pesoLinea,
            controstock: !!prodBono.controstock,
            totalLinea: redondear(0),
            // flags
            bono_auto: true,
            bono_origen: grupoId,
            bono_regla: reglaElegida.id || null,
        });
    }


    return res;
}

/**
 * Helper: aplica primero precios por escala y luego bonos gratuitos.
 */
export function aplicaPreciosYBonos({
    lineas = [],
    productos = [],
    bonos = {},
    createUUID,
    redondear,
    inPlace = true,
} = {}) {
    const conPrecios = analizaPrecios({ lineas, productos, bonos, redondear, inPlace });
    const conBonos = analizaGrupos({
        lineas: conPrecios,
        productos,
        bonos,
        createUUID,
        redondear,
        inPlace: true, // ya trabajamos sobre conPrecios
    });
    return conBonos;
}
/**
 * Agrega una o varias líneas a la lista de productos,
 * acumulando cantidades/peso por (id + medida) y respetando
 * la lógica de "GRATUITA" y totalLinea.
 *
 * @param {Object} params
 * @param {Array}  params.listaActual      - Array actual de líneas (listaproductos)
 * @param {Array|Object} params.nuevosItems - Ítem o array de ítems a agregar
 * @param {Function} params.createUUID     - Función para generar UUID (ej: this.create_UUID)
 * @param {Function} params.redondear      - Función para redondear números (ej: this.redondear)
 *
 * @returns {Array} Nueva lista de productos actualizada
 */

export function agregarLista({
    listaActual,
    nuevosItems,
    createUUID,
    redondear,
}) {
    const lista = Array.isArray(listaActual) ? [...listaActual] : [];
    const items = Array.isArray(nuevosItems) ? nuevosItems : [nuevosItems];

    items.forEach(val => {
        const medidaLinea = (val.medida || '').toString().trim().toUpperCase();
        const esGratuitaNueva = String(val.operacion || '').toUpperCase() === 'GRATUITA';
        const cantidad = Number(val.cantidad || 0);
        const basePeso = Number(val.peso || 0);
        const factor = Number(val.factor || 1);

        // 👉 Cálculo del peso total de la línea
        let pesoLinea = 0;
        if (factor > 1 && medidaLinea !== 'UNIDAD') {
            // Ej: CAJA x 12 UNDS → peso * factor * cantidad
            pesoLinea = basePeso * factor * cantidad;
        } else {
            // UNIDAD o factor 1 → peso * cantidad
            pesoLinea = basePeso * cantidad;
        }

        // ---------- CASO GRATUITA: acumula cantidad por (id + medida)
        if (esGratuitaNueva) {
            const existenteGrat = lista.find(item =>
                item.id === val.id &&
                String(item.medida || '').toUpperCase() === medidaLinea &&
                String(item.operacion || '').toUpperCase() === 'GRATUITA'
            );

            if (existenteGrat) {
                existenteGrat.cantidad =
                    Number(existenteGrat.cantidad || 0) + cantidad;
                existenteGrat.peso =
                    Number(existenteGrat.peso || 0) + pesoLinea;
                existenteGrat.totalLinea = '0.00'; // siempre 0 en gratuita
                return; // ya sumamos; no insertamos nuevo
            }

            // No existía: insertar línea gratuita
            lista.push({
                uuid: createUUID().substring(29),
                factor: val.factor,
                id: val.id,
                cantidad,
                nombre: val.nombre,
                medida: medidaLinea,
                precio: Number(val.precio || 0),
                precio_base: Number(val.precio || 0),
                preciodescuento: 0,
                costo: val.costo,
                tipoproducto: val.tipoproducto,
                operacion: 'GRATUITA',
                peso: pesoLinea,
                controstock: val.controstock,
                totalLinea: '0.00',
            });
            return;
        }

        // ---------- CASO NO GRATUITA: PERMITIR DUPLICADOS, PERO SUMAR SI (id + medida) COINCIDEN
        const existente = lista.find(item =>
            item.id === val.id &&
            String(item.medida || '').toUpperCase() === medidaLinea &&
            String(item.operacion || '').toUpperCase() !== 'GRATUITA'
        );

        if (existente) {
            // Acumular cantidad y peso
            const nuevaCantidad = Number(existente.cantidad || 0) + cantidad;
            existente.cantidad = nuevaCantidad;
            existente.peso = Number(existente.peso || 0) + pesoLinea;

            // Mantén el precio de la línea existente
            const precioUnit = Number(existente.precio || 0);
            existente.totalLinea = redondear(
                precioUnit * nuevaCantidad
            );
            // Mantén preciodescuento tal cual (se suman aparte en sumaDescuentos)
            return; // no inserta nueva línea
        }

        // No había línea equivalente -> insertar una nueva
        const precioNum = Number(val.precio || 0);

        lista.push({
            uuid: createUUID().substring(29),
            factor: val.factor,
            id: val.id,
            cantidad,
            nombre: val.nombre,
            medida: medidaLinea,
            precio: precioNum,
            precio_base: precioNum,
            preciodescuento: 0,
            costo: val.costo,
            tipoproducto: val.tipoproducto,
            operacion: val.operacion, // 'GRAVADA', etc.
            peso: pesoLinea,
            controstock: val.controstock,
            totalLinea: redondear(precioNum * cantidad),
        });
    });

    return lista;
}