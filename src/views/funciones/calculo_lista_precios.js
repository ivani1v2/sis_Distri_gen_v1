export const TIPOS_LISTA = {
  DISTRIBUIDOR: 'distribuidor',
  MAYORISTA: 'mayorista',
  MINORISTA: 'minorista'
};

const LISTAS_RECONOCIDAS = new Set(Object.values(TIPOS_LISTA));

export const CONFIG_LISTAS = {
  [TIPOS_LISTA.DISTRIBUIDOR]: {
    prioridad: 1,
    campo: 'precio_may1',
    nombre: 'Distribuidor',
    color: 'purple'
  },
  [TIPOS_LISTA.MAYORISTA]: {
    prioridad: 2,
    campo: 'precio_may2',
    nombre: 'Mayorista',
    color: 'blue'
  },
  [TIPOS_LISTA.MINORISTA]: {
    prioridad: 3,
    campo: 'precio',
    nombre: 'Minorista',
    color: 'green'
  }
};


function _toNumber(valor, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

function _normalizarListas(listasPreciosCliente = []) {
  if (!Array.isArray(listasPreciosCliente)) return [];
  return listasPreciosCliente
    .map(x => String(x || '').trim().toLowerCase())
    .filter(x => LISTAS_RECONOCIDAS.has(x));
}

function _getFactor(item) {
  return Math.max(1, _toNumber(item?.factor, 1));
}

function _unidadesALinea(linea) {
  const cantidad = _toNumber(linea?.cantidad, 0);
  const factor = _getFactor(linea);
  const modoVenta = String(linea?.modoVenta || '').trim().toLowerCase();
  const medida = String(linea?.medida || '').trim().toUpperCase();

  if (modoVenta === 'entero') return cantidad * factor;
  if (modoVenta === 'fraccion') return cantidad;

  if (factor > 1 && medida && medida !== 'UNIDAD') {
    return cantidad * factor;
  }
  return cantidad;
}

function _lineaACajas(linea) {
  const cantidad = _toNumber(linea?.cantidad, 0);
  const factor = _getFactor(linea);
  const modoVenta = String(linea?.modoVenta || '').trim().toLowerCase();
  const medida = String(linea?.medida || '').trim().toUpperCase();

  if (modoVenta === 'entero') return cantidad;
  if (modoVenta === 'fraccion') return cantidad / factor;

  if (factor > 1 && medida && medida !== 'UNIDAD') {
    return cantidad;
  }
  return cantidad / factor;
}

function _precioSeguro(producto, campoPrincipal, campoFallback = 'precio') {
  return _toNumber(producto?.[campoPrincipal], _toNumber(producto?.[campoFallback], 0));
}

function _excluirLineaActual(productosEnVenta = [], lineaActual = null) {
  if (!Array.isArray(productosEnVenta) || !lineaActual) return productosEnVenta || [];

  const uuidActual = lineaActual?.uuid;
  if (uuidActual) {
    return productosEnVenta.filter(p => p?.uuid !== uuidActual);
  }
  return productosEnVenta.filter(p => p !== lineaActual);
}

// ==========================================================
// LÓGICA PRINCIPAL POR CATEGORÍA
// ==========================================================

/**
 * Calcula el total de cajas en una categoría
 * @private
 */
function _calcularTotalCajasCategoria(productosEnVenta, productoNuevo, cantidadNueva = 0) {
  const categoria = productoNuevo?.categoria;
  const factor = _getFactor(productoNuevo);

  let total = 0;

  (productosEnVenta || []).forEach(p => {
    if (p.categoria === categoria) {
      total += _lineaACajas(p);
    }
  });

  total += _toNumber(cantidadNueva, 0) / factor;
  return total;
}

/**
 * Aplica reglas por categoría (5+ cajas = mayorista)
 * @returns {Object} { aplicaMayorista, totalCajas }
 */
export function aplicarReglasPorCategoria({
  productosEnVenta = [],
  productoNuevo,
  cantidadNueva = 0,
  cliente = null
} = {}) {
  if (!productoNuevo) return { aplicaMayorista: false, totalCajas: 0 };

  const totalCajas = _calcularTotalCajasCategoria(productosEnVenta, productoNuevo, cantidadNueva);
  const aplicaMayorista = totalCajas >= 5;

  return {
    totalCajas,
    aplicaMayorista,
    categoria: productoNuevo.categoria,
    tieneListaEspecial: cliente?.listas_precios?.length > 0
  };
}

/**
 * Determina qué precio usar según reglas y listas del cliente
 */
export function determinarPrecioPorReglas({
  producto,
  totalCajas,
  aplicaMayorista,
  listasCliente = []
} = {}) {
  const listas = _normalizarListas(listasCliente);

  if (listas.includes(TIPOS_LISTA.DISTRIBUIDOR)) {
    return {
      precio: _precioSeguro(producto, 'precio_may1'),
      tipo: TIPOS_LISTA.DISTRIBUIDOR,
      fuente: 'lista_cliente',
      campo: 'precio_may1'
    };
  }

  if (listas.includes(TIPOS_LISTA.MAYORISTA)) {
    return {
      precio: _precioSeguro(producto, 'precio_may2'),
      tipo: TIPOS_LISTA.MAYORISTA,
      fuente: 'lista_cliente',
      campo: 'precio_may2'
    };
  }

  if (aplicaMayorista) {
    return {
      precio: _precioSeguro(producto, 'precio_may2'),
      tipo: TIPOS_LISTA.MAYORISTA,
      fuente: 'regla_cantidad',
      campo: 'precio_may2'
    };
  }

  if (listas.includes(TIPOS_LISTA.MINORISTA)) {
    return {
      precio: _toNumber(producto?.precio, 0),
      tipo: TIPOS_LISTA.MINORISTA,
      fuente: 'lista_cliente',
      campo: 'precio'
    };
  }

  return {
    precio: _toNumber(producto?.precio, 0),
    tipo: TIPOS_LISTA.MINORISTA,
    fuente: 'default',
    campo: 'precio'
  };
}

/**
 * Precio de un producto considerando:
 * - Listas de precios del cliente
 * - Reglas por categoría (5+ cajas)
 * - Productos ya en venta
 */
export function determinarPrecioPorLista({
  producto,
  listasCliente = [],
  productosEnVenta = [],
  cantidadNueva = 0
} = {}) {
  if (!producto) {
    return {
      precio: 0,
      tipo: 'regular',
      campo: 'precio',
      fuente: 'fallback'
    };
  }

  const listas = _normalizarListas(listasCliente);
  const { totalCajas, aplicaMayorista } = aplicarReglasPorCategoria({
    productosEnVenta,
    productoNuevo: producto,
    cantidadNueva,
    cliente: { listas_precios: listas }
  });

  return determinarPrecioPorReglas({
    producto,
    totalCajas,
    aplicaMayorista,
    listasCliente: listas
  });
}

/**
 * Aplica precio calculado a una línea específica
 */
export function aplicarPrecioALinea({
  linea,
  producto,
  listasCliente = [],
  productosEnVenta = [],
  forzar = false,
  redondear = (n) => Number(n).toFixed(2)
} = {}) {
  if (linea?.precio_manual && !forzar) {
    return {
      ...linea,
      totalLinea: redondear(linea.cantidad * linea.precio)
    };
  }

  const otrasLineas = _excluirLineaActual(productosEnVenta, linea);
  const cantidadNueva = _unidadesALinea(linea);

  const resultado = determinarPrecioPorLista({
    producto,
    listasCliente,
    productosEnVenta: otrasLineas,
    cantidadNueva
  });

  if (!resultado) return linea;

  const precioAplicado = _toNumber(resultado.precio, 0);

  return {
    ...linea,
    precio: precioAplicado,
    precioedita: precioAplicado,
    precio_base: precioAplicado,
    preciodescuento: 0,
    desc_1: 0,
    desc_2: 0,
    desc_3: 0,
    totalLinea: redondear(linea.cantidad * precioAplicado),
    precio_manual: false,
    precio_tipo: resultado.tipo,
    precio_fuente: resultado.fuente,
    precio_campo: resultado.campo
  };
}

export function aplicarPrecioListaALinea({
  linea,
  producto,
  listasCliente = [],
  listasPreciosCliente = [],
  productosEnVenta = [],
  forzar = false,
  respetarManual = true
} = {}) {
  return aplicarPrecioALinea({
    linea,
    producto,
    listasCliente: Array.isArray(listasCliente) && listasCliente.length ? listasCliente : listasPreciosCliente,
    productosEnVenta,
    forzar: forzar || !respetarManual
  });
}

/**
 *  PRINCIPAL: Aplica precios por categoría a todas las líneas
 */
export function aplicarPreciosPorCategoria({
  lineas = [],
  productos = [],
  cliente = null,
  idsAfectados = null,
  forzar = false,
  inPlace = true
} = {}) {
  if (!lineas?.length || !productos?.length) return lineas;

  const res = inPlace ? lineas : JSON.parse(JSON.stringify(lineas));
  const listasCliente = _normalizarListas(cliente?.listas_precios || []);
  const prodById = new Map(productos.map(p => [String(p.id), p]));

  let categoriasAfectadas = new Set();

  if (idsAfectados && idsAfectados.length > 0) {
    const idsSet = new Set(idsAfectados.map(id => String(id)));

    res.forEach(linea => {
      const idLinea = String(linea?.id || '');
      if (idsSet.has(idLinea)) {
        const prod = prodById.get(idLinea);
        if (prod?.categoria) {
          categoriasAfectadas.add(prod.categoria);
        }
      }
    });
  }

  if (categoriasAfectadas.size === 0) return res;

  let cambio = true;
  let maxPasadas = 10;
  let pasada = 0;

  while (cambio && pasada < maxPasadas) {
    cambio = false;
    pasada++;

    for (let i = 0; i < res.length; i++) {
      const linea = res[i];

      if (String(linea?.operacion || '').toUpperCase() === 'GRATUITA') continue;

      const producto = prodById.get(String(linea.id));
      if (!producto) continue;

      if (!categoriasAfectadas.has(producto.categoria)) continue;

      const precioAnterior = linea.precio;

      const nuevaLinea = aplicarPrecioALinea({
        linea,
        producto,
        listasCliente,
        productosEnVenta: res,
        forzar
      });

      if (nuevaLinea !== linea) {
        res[i] = nuevaLinea;
        if (precioAnterior !== nuevaLinea.precio) {
          cambio = true;
        }
      }
    }
  }

  return res;
}

export function aplicarPreciosPorLista({
  lineas = [],
  productos = [],
  cliente = null,
  idsAfectados = null,
  opciones = {}
} = {}) {
  const listasCliente = Array.isArray(cliente?.listas_precios) ? cliente.listas_precios : [];
  const forzar = opciones?.forzar === true || opciones?.respetarManual === false;

  return aplicarPreciosPorCategoria({
    lineas: lineas,
    productos,
    cliente: { listas_precios: listasCliente },
    idsAfectados,
    forzar,
    inPlace: true
  });
}

/**
 * Obtiene todos los precios disponibles de un producto
 */
export function obtenerPreciosDisponibles(producto) {
  if (!producto) return {};

  return {
    minorista: _toNumber(producto.precio, 0),
    mayorista: _toNumber(producto.precio_may2, 0),
    distribuidor: _toNumber(producto.precio_may1, 0)
  };
}

/**
 * Valida configuración de precios de un producto para las listas del cliente
 */
export function validarPreciosProducto({
  producto,
  listasCliente = []
} = {}) {
  if (!producto) return { valido: false, razon: 'Producto no existe' };

  const listas = _normalizarListas(listasCliente);
  const faltantes = [];

  for (const lista of listas) {
    const config = CONFIG_LISTAS[lista];
    if (!config) continue;

    const precio = _toNumber(producto[config.campo], 0);
    if (precio <= 0) {
      faltantes.push(lista);
    }
  }

  return {
    valido: faltantes.length === 0,
    faltantes,
    mensaje: faltantes.length
      ? `Faltan precios para: ${faltantes.join(', ')}`
      : 'Todos los precios están configurados'
  };
}