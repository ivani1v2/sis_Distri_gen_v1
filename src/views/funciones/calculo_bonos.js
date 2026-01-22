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
import store from "@/store/index";

function _clonarSiNecesario(arr, inPlace) {
  return inPlace ? arr : JSON.parse(JSON.stringify(arr || []));
}

function _toUpper(val) {
  return String(val || "").toUpperCase();
}

function _isGratuita(linea) {
  return _toUpper(linea?.operacion) === "GRATUITA";
}
function _isPrecioManual(linea) {
  return linea?.precio_manual === true;
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
      toNum(linea.cantidad, 0) * toNum(linea.precio, 0),
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
      // ✅ si el usuario editó precio, NO lo sobrescribas
      if (!_isPrecioManual(linea)) {
        linea.precio = Number(nuevoPrecio);
        linea.precio_base = Number(nuevoPrecio);
      }

      // ✅ pero siempre recalcula total con el precio actual
      linea.totalLinea = redondear(
        toNum(linea.cantidad, 0) * toNum(linea.precio, 0),
      );

      const desc = toNum(linea.preciodescuento, 0);
      if (desc >= linea.precio) linea.preciodescuento = 0;

      linea.totalLinea = redondear(
        toNum(linea.cantidad, 0) * toNum(linea.precio, 0),
      );
    }
  }

  // ==========================================================
  // 2) ESCALAS POR PRODUCTO (si NO hay grupo_precio activo)
  // ==========================================================

  for (const linea of res) {
    if (_isGratuita(linea)) continue;

    const prod = productos.find((p) => String(p.id) === String(linea.id));
    if (!prod) continue;

    const grupo = prod.grupo_precio || null;
    if (grupo) {
      const cfg = bonos[grupo];
      if (cfg && cfg.tipo === "precio" && cfg.activo) continue;
    }

    const hayMay1 = tieneMay1(prod);
    const hayMay2 = tieneMay2(prod);
    if (!hayMay1 && !hayMay2) continue;

    const u = unidadesLinea(linea);
    const tier = sugerirTier(prod, u);
    const pUnidad = precioUnidadPorTier(prod, tier);

    linea._precio_tier = tier;

    if (!_isPrecioManual(linea)) {
      setPrecioLinea(linea, pUnidad);
    } else {
      // ✅ si es manual, solo recalcula total
      linea.totalLinea = redondear(
        toNum(linea.cantidad, 0) * toNum(linea.precio, 0),
      );
    }
  }

  return res;
}

/**
 * Calcula y agrega líneas de bonos (GRATUITA) por grupo_bono
 * - Soporta reglas tipo: [{ apartir_de: 6, cantidad_bono: 1, codigo: "10003", id: 1 }]
 * - “Cada 6 le da 1” => qtyFree = floor(unidadesGrupo / apartir_de) * cantidad_bono
 * - Estable: recalcula desde cero (borra bonos auto previos si se permite)
 * - Configurable: respeta cantidad_max (si existe) y stock (si controstock)
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
  const toNum = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };

  const _toUpper = (val) => String(val || "").toUpperCase();
  const _isGratuita = (l) => _toUpper(l?.operacion) === "GRATUITA";

  const _getReglasBono = (cfg) => {
    if (!cfg) return [];
    if (Array.isArray(cfg.data)) return cfg.data;
    if (Array.isArray(cfg.data?.bonos)) return cfg.data.bonos;
    return [];
  };

  const _clonarSiNecesario = (arr, inPlaceFlag) =>
    inPlaceFlag ? arr : JSON.parse(JSON.stringify(arr || []));

  // 1) Base: si se permite, recalcula desde cero (borra bonos automáticos previos)
  //    Si NO se permite editar bono, NO tocamos nada.
  const gruposPermitidos = new Set(Object.keys(bonos || {}));

  const base =
    store.state.permisos.permite_editar_bono === true
      ? (lineas || []).filter((l) => {
          const esBonoAutoGrupo =
            l?.bono_auto === true &&
            String(l?.bono_origen_tipo) === "grupo_bono" &&
            gruposPermitidos.has(String(l?.bono_origen));

          // si es bono auto de un grupo que voy a recalcular => lo saco
          return !esBonoAutoGrupo;
        })
      : lineas || [];

  const res = _clonarSiNecesario(base, inPlace);

  // Index para búsquedas rápidas
  const prodById = new Map((productos || []).map((p) => [String(p.id), p]));

  // Unidades reales por línea (caja/paquete -> unidades)
  const unidadesDeLinea = (l) => {
    let u = toNum(l?.cantidad, 0);
    const factor = toNum(l?.factor, 1);
    const medida = _toUpper(l?.medida || "");
    if (factor > 1 && medida !== "UNIDAD") u *= factor;
    return u;
  };

  // Stock helpers
  const stockDe = (p) => toNum(p?.stock, 0);
  const unidadesEnPedidoPorId = (pid) => {
    let u = 0;
    for (const l of res) {
      if (String(l?.id) !== String(pid)) continue;
      u += unidadesDeLinea(l);
    }
    return u;
  };

  // 2) Acumular unidades compradas por grupo_bono (solo líneas NO gratuitas)
  const unidadesPorGrupo = {}; // { grupo_bono: unidades }
  for (const l of res) {
    if (_isGratuita(l)) continue;
    const p = prodById.get(String(l?.id));
    if (!p) continue;
    const grupo = p.grupo_bono || null;
    if (!grupo) continue;

    unidadesPorGrupo[grupo] =
      (unidadesPorGrupo[grupo] || 0) + unidadesDeLinea(l);
  }

  // 3) Por cada grupo, aplicar regla “mejor” (mayor apartir_de que cumpla)
  for (const [grupoId, unidadesGrupo] of Object.entries(unidadesPorGrupo)) {
    const cfg = bonos?.[grupoId];
    if (!cfg || cfg.tipo !== "bono" || !cfg.activo) continue;

    const reglas = _getReglasBono(cfg)
      .map((r) => ({
        ...r,
        apartir_de: toNum(r?.apartir_de, 0),
        cantidad_bono: toNum(r?.cantidad_bono, 0),
        cantidad_max:
          r?.cantidad_max != null && r?.cantidad_max !== ""
            ? toNum(r.cantidad_max, null)
            : null,
        codigo: r?.codigo,
        id: r?.id ?? null,
      }))
      .filter((r) => r.apartir_de > 0 && r.cantidad_bono > 0 && r.codigo);

    if (!reglas.length) continue;

    // Regla elegida: la de mayor apartir_de que cumpla
    let regla = null;
    for (const r of reglas) {
      if (unidadesGrupo >= r.apartir_de) {
        if (!regla || r.apartir_de > regla.apartir_de) regla = r;
      }
    }
    if (!regla) continue;

    // “cada N da M”
    const veces = Math.floor(toNum(unidadesGrupo, 0) / regla.apartir_de);
    if (veces <= 0) continue;

    let qtyFree = veces * regla.cantidad_bono;

    // tope por regla
    if (regla.cantidad_max != null && Number.isFinite(regla.cantidad_max)) {
      qtyFree = Math.min(qtyFree, regla.cantidad_max);
    }
    if (qtyFree <= 0) continue;

    const prodBono = prodById.get(String(regla.codigo));
    if (!prodBono) continue;

    // 4) Limitar por stock (si controla stock)
    if (prodBono.controstock) {
      const disponible = stockDe(prodBono) - unidadesEnPedidoPorId(prodBono.id);
      qtyFree = Math.min(qtyFree, Math.max(0, disponible));
      if (qtyFree <= 0) continue;
    }

    // 5) Merge si ya existe misma línea de bono auto (mismo producto + origen + regla)
    const existente = res.find(
      (x) =>
        x?.bono_auto === true &&
        _isGratuita(x) &&
        String(x?.id) === String(prodBono.id) &&
        x?.bono_origen_tipo === "grupo_bono" &&
        String(x?.bono_origen) === String(grupoId) &&
        String(x?.bono_regla ?? "") === String(regla.id ?? ""),
    );

    if (existente) {
      existente.cantidad = toNum(existente.cantidad, 0) + toNum(qtyFree, 0);
      existente.totalLinea = redondear(0);
      continue;
    }

    // 6) Crear línea gratuita (siempre en UNIDAD)
    const basePeso = toNum(prodBono.peso, 0);
    const pesoLinea = basePeso * toNum(qtyFree, 0);

    res.push({
      uuid: createUUID().slice(-7),
      id: prodBono.id,
      nombre: prodBono.nombre,
      medida: "UNIDAD",
      factor: 1,
      cantidad: toNum(qtyFree, 0),

      precio: toNum(prodBono.precio, 0),
      precio_base: toNum(prodBono.precio, 0),
      preciodescuento: 0,
      costo: toNum(prodBono.costo, 0),

      tipoproducto: prodBono.tipoproducto,
      operacion: "GRATUITA",
      peso: pesoLinea,
      controstock: !!prodBono.controstock,
      totalLinea: redondear(0),

      bono_auto: true,
      bono_origen_tipo: "grupo_bono",
      bono_origen: grupoId,
      bono_regla: regla.id ?? null,
      bono_origen_codigo: String(regla.codigo),
      bono_apartir_de: regla.apartir_de,
      bono_cantidad_bono: regla.cantidad_bono,
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
  const getProd = (id) =>
    store.state.productos.find((p) => String(p.id) === String(id));

  const stockDe = (id) => Number(getProd(id)?.stock || 0);

  const unidadesLinea = (l) => {
    const factor = Number(l.factor || 1);
    const medida = String(l.medida || "")
      .trim()
      .toUpperCase();
    let cant = Number(l.cantidad || 0);
    if (factor > 1 && medida !== "UNIDAD") cant *= factor;
    return cant;
  };

  const unidadesYaEnLista = (id) => {
    let u = 0;
    for (const l of lista) {
      if (String(l.id) !== String(id)) continue;
      u += unidadesLinea(l);
    }
    return u;
  };
  const pickExtras = (val) => ({
    // ✅ descuentos
    desc_1: Number(val.desc_1 || 0),
    desc_2: Number(val.desc_2 || 0),
    desc_3: Number(val.desc_3 || 0),

    // ✅ opcionales que también sueles usar
    _precio_tier: val._precio_tier,
    _unidades: val._unidades,
    observacion: val.observacion,
  });

  items.forEach((val) => {
    const medidaLinea = (val.medida || "").toString().trim().toUpperCase();
    const esGratuitaNueva =
      String(val.operacion || "").toUpperCase() === "GRATUITA";
    const cantidad = Number(val.cantidad || 0);
    const basePeso = Number(val.peso || 0);
    const factor = Number(val.factor || 1);

    let pesoLinea = 0;
    if (factor > 1 && medidaLinea !== "UNIDAD")
      pesoLinea = basePeso * factor * cantidad;
    else pesoLinea = basePeso * cantidad;

    // ================= GRATUITA =================
    if (esGratuitaNueva) {
      const prod = getProd(val.id);
      if (prod && prod.controstock) {
        const stockReal = stockDe(val.id);

        // disponible = stock - (todo lo que ya está en lista, EXCEPTO esta misma entrada)
        const disponible = stockReal - unidadesYaEnLista(val.id);

        // la gratuita entra en UNIDAD normalmente; si viniera en caja, igual se pasa a unidades
        const qtyUnd = unidadesLinea({ ...val, medida: medidaLinea, cantidad });

        const qtyOk = Math.min(qtyUnd, Math.max(0, disponible));

        if (qtyOk <= 0) return; // ✅ no agrega la línea gratuita

        // ✅ si vino más de lo disponible, recorta la cantidad
        // (como tu bono es UNIDAD, basta ajustar "cantidad")
        val = { ...val, cantidad: qtyOk, medida: "UNIDAD", factor: 1 };
      }
      const existenteGrat = lista.find(
        (item) =>
          item.id === val.id &&
          String(item.medida || "").toUpperCase() === medidaLinea &&
          String(item.operacion || "").toUpperCase() === "GRATUITA",
      );

      if (existenteGrat) {
        existenteGrat.cantidad = Number(existenteGrat.cantidad || 0) + cantidad;
        existenteGrat.peso = Number(existenteGrat.peso || 0) + pesoLinea;
        existenteGrat.totalLinea = "0.00";
        // ✅ si quieres conservar descuentos en gratuitas, mantenlos también:
        // existenteGrat.desc_1 = existenteGrat.desc_1 || Number(val.desc_1 || 0);

        return;
      }

      lista.push({
        ...val, // ✅ copia todo (incluye desc_*, etc.)
        uuid: createUUID().substring(29),
        medida: medidaLinea,
        operacion: "GRATUITA",
        preciodescuento: 0,
        peso: pesoLinea,
        totalLinea: "0.00",
      });
      return;
    }

    // ================= NO GRATUITA =================
    const existente = lista.find(
      (item) =>
        item.id === val.id &&
        String(item.medida || "").toUpperCase() === medidaLinea &&
        String(item.operacion || "").toUpperCase() !== "GRATUITA",
    );

    if (existente) {
      const nuevaCantidad = Number(existente.cantidad || 0) + cantidad;
      existente.cantidad = nuevaCantidad;
      existente.peso = Number(existente.peso || 0) + pesoLinea;

      // ✅ Mínimo: si el nuevo trae descuentos, los respetas (si no, mantienes los actuales)
      const ex = pickExtras(existente);
      const nx = pickExtras(val);

      existente.desc_1 = nx.desc_1 || ex.desc_1 || 0;
      existente.desc_2 = nx.desc_2 || ex.desc_2 || 0;
      existente.desc_3 = nx.desc_3 || ex.desc_3 || 0;

      // ⚠️ OJO: precio unitario ya puede venir con descuento aplicado.
      // Si tu "precio" en la línea YA ES el precio final con descuento, esto está bien:
      const precioUnit = Number(existente.precio || 0);
      existente.totalLinea = redondear(precioUnit * nuevaCantidad);

      return;
    }

    const precioNum = Number(val.precio || 0);

    lista.push({
      ...val, // ✅ copia todo para no perder desc_*, _precio_tier, etc.
      uuid: createUUID().substring(29),
      medida: medidaLinea,
      precio: precioNum,
      precioedita: precioNum,
      precio_base:
        val.precio_base != null ? Number(val.precio_base) : precioNum,
      preciodescuento:
        val.preciodescuento != null ? Number(val.preciodescuento) : 0,
      peso: pesoLinea,
      totalLinea: redondear(precioNum * cantidad),
    });
  });

  return lista;
}

export function analizaPreciosParcial({
  lineas = [],
  productos = [],
  bonos = {},
  idsAfectados = [],
  lista_precios = ["1", "2", "3"],
  redondear = (n) => Number(n).toFixed(2),
  inPlace = true,
} = {}) {
  const ids = new Set((idsAfectados || []).map((x) => String(x)));
  if (!ids.size) return lineas;

  // reutiliza tu analizaPrecios, pero “finge” un array solo con esas líneas,
  // y luego las reinyecta en el array original.
  const ref = inPlace ? lineas : JSON.parse(JSON.stringify(lineas || []));

  const subset = ref.filter(
    (l) =>
      ids.has(String(l.id)) &&
      String(l.operacion || "").toUpperCase() !== "GRATUITA",
  );

  // aplica la lógica de precios que ya tienes
  analizaPrecios({
    lineas: subset,
    productos,
    bonos,
    lista_precios,
    redondear,
    inPlace: true,
  });

  return ref;
}
export function analizaGruposParcial({
  lineas = [],
  productos = [],
  bonos = {},
  idsAfectados = [],
  createUUID,
  redondear = (n) => Number(n).toFixed(2),
  inPlace = true,
} = {}) {
  const ids = new Set((idsAfectados || []).map((x) => String(x)));
  if (!ids.size) return lineas;

  const ref = inPlace ? lineas : JSON.parse(JSON.stringify(lineas || []));

  const prodById = new Map((productos || []).map((p) => [String(p.id), p]));

  // 1) grupos_bono afectados por los ids agregados
  const gruposAfectados = new Set();
  ids.forEach((id) => {
    const p = prodById.get(String(id));
    if (p?.grupo_bono) gruposAfectados.add(String(p.grupo_bono));
  });

  if (!gruposAfectados.size) return ref;

  // 2) borra SOLO bonos auto de esos grupos (NO toda la lista)
  for (let i = ref.length - 1; i >= 0; i--) {
    const l = ref[i];
    if (l?.bono_auto === true && String(l?.bono_origen_tipo) === "grupo_bono") {
      if (gruposAfectados.has(String(l?.bono_origen))) {
        ref.splice(i, 1);
      }
    }
  }

  // 3) ahora corre tu analizaGrupos normal, pero SOLO para esos grupos:
  //    truco: calculamos bonos solo si el grupo está en gruposAfectados.
  //    (hacemos un “bonos filtrado”)
  const bonosFiltrados = {};
  gruposAfectados.forEach((g) => {
    bonosFiltrados[g] = bonos[g];
  });

  return analizaGrupos({
    lineas: ref,
    productos,
    bonos: bonosFiltrados,
    createUUID,
    redondear,
    inPlace: true,
  });
}
