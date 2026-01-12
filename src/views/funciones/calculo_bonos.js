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
import store from '@/store/index'

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
const round4 = (n) => {
  const x = Number(n) || 0;
  return Math.round((x + Number.EPSILON) * 10000) / 10000;
};

/**
 * Aplica o revierte precio por escala de grupo_precio
 */
export function analizaPrecios({
  lineas = [],
  productos = [],
  bonos = {},
  lista_precios = ["1", "2", "3"],
  redondear = (n) => Number(n).toFixed(2),
  inPlace = true,
} = {}) {
  const res = _clonarSiNecesario(lineas, inPlace);

  const toNum = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };

  const isActiveTier = (t) => (lista_precios || []).includes(String(t));

  const singleListId = () => {
    const arr = (lista_precios || [])
      .map((x) => Number(x))
      .filter(Number.isFinite);
    return arr.length === 1 ? arr[0] : null;
  };

  const tieneMay1 = (p) =>
    toNum(p?.precio_may1, 0) > 0 && toNum(p?.escala_may1, 0) > 0;
  const tieneMay2 = (p) =>
    toNum(p?.precio_may2, 0) > 0 && toNum(p?.escala_may2, 0) > 0;

  const unidadesLinea = (linea) => {
    const factor = toNum(linea?.factor, 1);
    const medida = String(linea?.medida || "")
      .trim()
      .toUpperCase();
    let u = toNum(linea?.cantidad, 0);
    if (factor > 1 && medida !== "UNIDAD") u *= factor;
    return u;
  };

  const sugerirTier = (prod, unidades) => {
    const only = singleListId();
    if (only) return only;

    const cant = toNum(unidades, 0);
    const hayMay1 = tieneMay1(prod);
    const hayMay2 = tieneMay2(prod);

    if (!hayMay1 && !hayMay2) return 1;

    if (hayMay1 && !hayMay2 && isActiveTier(2)) {
      const esc1 = toNum(prod.escala_may1, Infinity);
      return cant >= esc1 ? 2 : 1;
    }

    if (hayMay1 && hayMay2) {
      const esc1 = toNum(prod.escala_may1, Infinity);
      const esc2 = toNum(prod.escala_may2, Infinity);
      const lim1 = Math.min(esc1, esc2);
      const lim2 = Math.max(esc1, esc2);

      if (isActiveTier(3) && cant >= lim2) return 3;
      if (isActiveTier(2) && cant >= lim1) return 2;
      return 1;
    }

    if (!hayMay1 && hayMay2) {
      const esc2 = toNum(prod.escala_may2, Infinity);
      return isActiveTier(3) && cant >= esc2 ? 3 : 1;
    }

    return 1;
  };

  const precioUnidadPorTier = (prod, tier) => {
    const only = singleListId();
    if (only === 3) return toNum(prod.precio_may2, toNum(prod.precio, 0));
    if (only === 2) return toNum(prod.precio_may1, toNum(prod.precio, 0));
    if (only === 1) return toNum(prod.precio, 0);

    if (tier === 3) return toNum(prod.precio_may2, toNum(prod.precio, 0));
    if (tier === 2) return toNum(prod.precio_may1, toNum(prod.precio, 0));
    return toNum(prod.precio, 0);
  };

  // ✅ ahora SIEMPRE actualiza precio_base junto con precio
  const setPrecioLinea = (linea, precioUnidad) => {
    const factor = toNum(linea?.factor, 1);
    const medida = String(linea?.medida || "")
      .trim()
      .toUpperCase();

    const precioEmitido =
      factor > 1 && medida !== "UNIDAD" ? precioUnidad * factor : precioUnidad;

    const p = round4(precioEmitido); // ✅ REDONDEO 4 decimales

    linea.precio = p;
    linea.precio_base = p; // ✅ también base

    const desc = toNum(linea.preciodescuento, 0);
    if (desc >= linea.precio) linea.preciodescuento = 0;

    linea.totalLinea = redondear(
      toNum(linea.cantidad, 0) * toNum(linea.precio, 0)
    );
  };

  // ==========================================================
  // 1) GRUPO_PRECIO
  // ==========================================================
  const totalPorGrupoPrecio = {};

  for (const linea of res) {
    if (_isGratuita(linea)) continue;

    const prod = productos.find((p) => String(p.id) === String(linea.id));
    if (!prod) continue;

    const grupo = prod.grupo_precio || null;
    if (!grupo) continue;

    const cfg = bonos[grupo];
    if (!cfg || cfg.tipo !== "precio" || !cfg.activo) continue;

    totalPorGrupoPrecio[grupo] =
      (totalPorGrupoPrecio[grupo] || 0) + unidadesLinea(linea);
  }

  for (const [grupoId, unidadesGrupo] of Object.entries(totalPorGrupoPrecio)) {
    const cfg = bonos[grupoId];
    if (!cfg) continue;

    const esc1 = toNum(cfg.escala_may1, 0);
    const esc2 = toNum(cfg.escala_may2, 0);
    const p1 = toNum(cfg.precio_may1, 0);
    const p2 = toNum(cfg.precio_may2, 0);

    let precioObjetivo = null;
    if (esc2 && unidadesGrupo >= esc2 && p2) precioObjetivo = p2;
    else if (esc1 && unidadesGrupo >= esc1 && p1) precioObjetivo = p1;

    for (const linea of res) {
      if (_isGratuita(linea)) continue;

      const prod = productos.find((p) => String(p.id) === String(linea.id));
      if (!prod) continue;
      if ((prod.grupo_precio || null) !== grupoId) continue;

      // precio por grupo (tal cual)
      const nuevoPrecio =
        precioObjetivo != null
          ? toNum(precioObjetivo, 0)
          : toNum(linea.precio, 0);

      linea.precio = Number(nuevoPrecio);
      linea.precio_base = Number(nuevoPrecio); // ✅ CAMBIO

      const desc = toNum(linea.preciodescuento, 0);
      if (desc >= linea.precio) linea.preciodescuento = 0;

      linea.totalLinea = redondear(
        toNum(linea.cantidad, 0) * toNum(linea.precio, 0)
      );
    }
  }

  // ==========================================================
  // 2) ESCALAS POR PRODUCTO (si NO hay grupo_precio activo)
  // ==========================================================
  if (store.state.permisos.permite_editar_precios) {
    for (const linea of res) {
      if (_isGratuita(linea)) continue;

      const prod = productos.find((p) => String(p.id) === String(linea.id));
      if (!prod) continue;

      const grupo = prod.grupo_precio || null;
      if (grupo) {
        const cfg = bonos[grupo];
        if (cfg && cfg.tipo === "precio" && cfg.activo) continue; // no tocar
      }

      const hayMay1 = tieneMay1(prod);
      const hayMay2 = tieneMay2(prod);
      if (!hayMay1 && !hayMay2) continue;

      const u = unidadesLinea(linea);
      const tier = sugerirTier(prod, u);
      const pUnidad = precioUnidadPorTier(prod, tier);

      linea._precio_tier = tier;

      setPrecioLinea(linea, pUnidad); // ✅ aquí también actualiza precio_base
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
  // 1) Recalcular desde cero: borra bonos automáticos previos
  const base = (lineas || []).filter((l) => !l?.bono_auto);
  const res = _clonarSiNecesario(base, inPlace);

  // 2) Totales por grupo_bono (cuando existe)
  const totalPorGrupo = {};

  // 3) Totales por producto-origen para lista_bono (cuando grupo_bono es null)
  //    Guardamos unidades compradas por producto id
  const totalPorProducto = {}; // { idProducto: unidades }

  for (const linea of res) {
    if (_isGratuita(linea)) continue;

    const prod = productos.find((p) => String(p.id) === String(linea.id));
    if (!prod) continue;

    // unidades (si viene en paquete/caja convertir a unidades)
    const factorLinea = Number(linea.factor || 1);
    const medidaLinea = String(linea.medida || "")
      .trim()
      .toUpperCase();

    let unidadesLinea = Number(linea.cantidad || 0);
    if (factorLinea > 1 && medidaLinea !== "UNIDAD") {
      unidadesLinea = unidadesLinea * factorLinea;
    }

    const grupo = prod.grupo_bono || null;

    // A) con grupo_bono → tu lógica actual
    if (grupo) {
      totalPorGrupo[grupo] = (totalPorGrupo[grupo] || 0) + unidadesLinea;
      continue;
    }

    // B) sin grupo_bono → si tiene lista_bono, acumular por producto
    if (Array.isArray(prod.lista_bono) && prod.lista_bono.length > 0) {
      const pid = String(prod.id);
      totalPorProducto[pid] = (totalPorProducto[pid] || 0) + unidadesLinea;
    }
  }

  // --------------------------
  // 4) BONOS POR GRUPO (igual que antes)
  // --------------------------
  for (const [grupoId, cantidadGrupo] of Object.entries(totalPorGrupo)) {
    const cfg = bonos[grupoId];
    if (!cfg || cfg.tipo !== "bono" || !cfg.activo) continue;

    const reglas = _getReglasBono(cfg);

    // mejor regla por apartir_de
    let reglaElegida = null;
    for (const regla of reglas) {
      const apartir = Number(regla.apartir_de || 0);
      if (!apartir) continue;
      if (cantidadGrupo >= apartir) {
        if (!reglaElegida || apartir > Number(reglaElegida.apartir_de || 0)) {
          reglaElegida = regla;
        }
      }
    }
    if (!reglaElegida) continue;

    const apartir = Number(reglaElegida.apartir_de || 0);
    const cantBono = Number(reglaElegida.cantidad_bono || 0);
    const cantMax =
      reglaElegida.cantidad_max != null
        ? Number(reglaElegida.cantidad_max)
        : null;
    const idBono = reglaElegida.codigo;

    if (!apartir || !cantBono || !idBono) continue;

    const veces = Math.floor(cantidadGrupo / apartir);
    if (veces <= 0) continue;

    let qtyFree = veces * cantBono;
    if (cantMax != null && Number.isFinite(cantMax))
      qtyFree = Math.min(qtyFree, cantMax);
    if (qtyFree <= 0) continue;

    const prodBono = productos.find((p) => String(p.id) === String(idBono));
    if (!prodBono) continue;

    const medidaBono =
      String(prodBono.medida || "")
        .trim()
        .toUpperCase() || "UNIDAD";
    const factorProd = Number(prodBono.factor || 1);
    const basePeso = Number(prodBono.peso || 0);

    // peso total (si bono se entrega en unidades, usa basePeso * qtyFree)
    let pesoLinea = 0;
    if (factorProd > 1 && medidaBono !== "UNIDAD")
      pesoLinea = basePeso * factorProd * Number(qtyFree);
    else pesoLinea = basePeso * Number(qtyFree);

    res.push({
      uuid: createUUID().slice(-7),
      id: prodBono.id,
      nombre: prodBono.nombre,
      medida: "UNIDAD",
      factor: Number(prodBono.factor || 1),
      cantidad: Number(qtyFree),
      precio: 0,
      precio_base: 0,
      preciodescuento: 0,
      costo: Number(prodBono.costo || 0),
      tipoproducto: prodBono.tipoproducto,
      operacion: "GRATUITA",
      peso: pesoLinea,
      controstock: !!prodBono.controstock,
      totalLinea: redondear(0),

      bono_auto: true,
      bono_origen_tipo: "grupo_bono",
      bono_origen: grupoId,
      bono_regla: reglaElegida.id || null,
    });
  }

  // --------------------------
  // 5) BONOS POR lista_bono (grupo_bono null)
  // --------------------------
  if (store.state.permisos.permite_editar_bono) {
    for (const [prodOrigenId, unidadesCompradas] of Object.entries(
      totalPorProducto
    )) {
      const prodOrigen = productos.find(
        (p) => String(p.id) === String(prodOrigenId)
      );
      if (!prodOrigen) continue;

      const reglas = Array.isArray(prodOrigen.lista_bono)
        ? prodOrigen.lista_bono
        : [];
      if (!reglas.length) continue;

      // elegir mejor regla por mayor apartir_de alcanzado
      let reglaElegida = null;
      for (const r of reglas) {
        const apartir = Number(r.apartir_de || 0);
        if (!apartir) continue;
        if (unidadesCompradas >= apartir) {
          if (!reglaElegida || apartir > Number(reglaElegida.apartir_de || 0)) {
            reglaElegida = r;
          }
        }
      }
      if (!reglaElegida) continue;

      const apartir = Number(reglaElegida.apartir_de || 0);
      const cantBonoPorVez = Number(reglaElegida.cantidad || 0); // lista_bono usa "cantidad"
      const idBono = reglaElegida.cod_producto; // ✅ producto bono real
      if (!apartir || !cantBonoPorVez || !idBono) continue;

      const veces = Math.floor(unidadesCompradas / apartir);
      if (veces <= 0) continue;

      const qtyFree = veces * cantBonoPorVez;
      if (qtyFree <= 0) continue;

      const prodBono = productos.find((p) => String(p.id) === String(idBono));
      if (!prodBono) continue;

      // Bono SIEMPRE en UNIDAD (tal como vienes trabajando)
      const basePeso = Number(prodBono.peso || 0);
      const pesoLinea = basePeso * Number(qtyFree);

      res.push({
        uuid: createUUID().slice(-7),
        id: prodBono.id,
        nombre: prodBono.nombre,
        medida: "UNIDAD",
        factor: Number(prodBono.factor || 1),
        cantidad: Number(qtyFree),
        precio: 0,
        precio_base: 0,
        preciodescuento: 0,
        costo: Number(prodBono.costo || 0),
        tipoproducto: prodBono.tipoproducto,
        operacion: "GRATUITA",
        peso: pesoLinea,
        controstock: !!prodBono.controstock,
        totalLinea: redondear(0),

        bono_auto: true,
        bono_origen_tipo: "lista_bono",
        bono_origen: prodOrigen.id, // de qué producto se originó
        bono_regla: `${prodOrigen.id}:${String(
          reglaElegida.apartir_de
        )}:${String(reglaElegida.cod_producto)}`,
      });
    }
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
  const conPrecios = analizaPrecios({
    lineas,
    productos,
    bonos,
    redondear,
    inPlace,
  });
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

  items.forEach((val) => {
    const medidaLinea = (val.medida || "").toString().trim().toUpperCase();
    const esGratuitaNueva =
      String(val.operacion || "").toUpperCase() === "GRATUITA";
    const cantidad = Number(val.cantidad || 0);
    const basePeso = Number(val.peso || 0);
    const factor = Number(val.factor || 1);

    // 👉 Cálculo del peso total de la línea
    let pesoLinea = 0;
    if (factor > 1 && medidaLinea !== "UNIDAD") {
      // Ej: CAJA x 12 UNDS → peso * factor * cantidad
      pesoLinea = basePeso * factor * cantidad;
    } else {
      // UNIDAD o factor 1 → peso * cantidad
      pesoLinea = basePeso * cantidad;
    }

    // ---------- CASO GRATUITA: acumula cantidad por (id + medida)
    if (esGratuitaNueva) {
      const existenteGrat = lista.find(
        (item) =>
          item.id === val.id &&
          String(item.medida || "").toUpperCase() === medidaLinea &&
          String(item.operacion || "").toUpperCase() === "GRATUITA"
      );

      if (existenteGrat) {
        existenteGrat.cantidad = Number(existenteGrat.cantidad || 0) + cantidad;
        existenteGrat.peso = Number(existenteGrat.peso || 0) + pesoLinea;
        existenteGrat.totalLinea = "0.00"; // siempre 0 en gratuita
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
        operacion: "GRATUITA",
        peso: pesoLinea,
        controstock: val.controstock,
        totalLinea: "0.00",
      });
      return;
    }

    // ---------- CASO NO GRATUITA: PERMITIR DUPLICADOS, PERO SUMAR SI (id + medida) COINCIDEN
    const existente = lista.find(
      (item) =>
        item.id === val.id &&
        String(item.medida || "").toUpperCase() === medidaLinea &&
        String(item.operacion || "").toUpperCase() !== "GRATUITA"
    );

    if (existente) {
      // Acumular cantidad y peso
      const nuevaCantidad = Number(existente.cantidad || 0) + cantidad;
      existente.cantidad = nuevaCantidad;
      existente.peso = Number(existente.peso || 0) + pesoLinea;

      // Mantén el precio de la línea existente
      const precioUnit = Number(existente.precio || 0);
      existente.totalLinea = redondear(precioUnit * nuevaCantidad);
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
