// funciones/calculo_lista_precios.js

/**
 * Constantes para tipos de lista
 */
export const TIPOS_LISTA = {
  DISTRIBUIDOR: 'distribuidor',
  MAYORISTA: 'mayorista',
  MINORISTA: 'minorista'
};

/**
 * Configuración de prioridades y mapeo de campos
 */
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

/**
 * Determina qué precio usar según las listas de precios del cliente
 * @param {Object} producto - Producto con sus precios
 * @param {Array} listasPreciosCliente - Array de listas (['mayorista', 'minorista', 'distribuidor'])
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} - Resultado con precio y metadatos
 */
export function determinarPrecioPorLista(producto, listasPreciosCliente, opciones = {}) {
  const { prioridadPersonalizada = null, fallback = true } = opciones;
  
  // Si no hay listas o el producto no existe, retornar precio regular
  if (!listasPreciosCliente?.length || !producto) {
    return {
      precio: producto?.precio || 0,
      tipo: 'regular',
      campo: 'precio',
      fuente: 'fallback'
    };
  }

  // Usar prioridad personalizada o la predeterminada
  const prioridad = prioridadPersonalizada || CONFIG_LISTAS;

  // Ordenar listas por prioridad
  const listasOrdenadas = [...listasPreciosCliente]
    .filter(lista => prioridad[lista]) // Solo listas válidas
    .sort((a, b) => (prioridad[a]?.prioridad || 999) - (prioridad[b]?.prioridad || 999));

  // Buscar el primer precio disponible
  for (const lista of listasOrdenadas) {
    const config = prioridad[lista];
    if (!config) continue;
    
    const precio = Number(producto[config.campo]);
    if (precio && precio > 0) {
      return {
        precio,
        tipo: lista,
        campo: config.campo,
        nombre: config.nombre,
        color: config.color,
        fuente: 'lista_precios'
      };
    }
  }

  // Fallback al precio regular si se permite
  if (fallback) {
    return {
      precio: Number(producto.precio) || 0,
      tipo: 'regular',
      campo: 'precio',
      fuente: 'fallback'
    };
  }

  return null;
}

/**
 * Obtiene todos los precios disponibles de un producto según las listas del cliente
 * @param {Object} producto - Producto
 * @param {Array} listasPreciosCliente - Listas del cliente
 * @returns {Object} - Objeto con precios disponibles
 */
export function obtenerPreciosDisponibles(producto, listasPreciosCliente = []) {
  if (!producto) return {};
  
  const disponibles = {};
  
  // Siempre incluir todos los precios que existen
  if (producto.precio) disponibles.minorista = Number(producto.precio);
  if (producto.precio_may2) disponibles.mayorista = Number(producto.precio_may2);
  if (producto.precio_may1) disponibles.distribuidor = Number(producto.precio_may1);
  
  // Marcar cuáles están permitidas para este cliente
  const permitidas = new Set(listasPreciosCliente || []);
  
  return {
    todos: disponibles,
    permitidas: Object.fromEntries(
      Object.entries(disponibles).filter(([lista]) => permitidas.has(lista))
    )
  };
}

/**
 * Valida si un producto tiene precios configurados para las listas del cliente
 * @param {Object} producto - Producto
 * @param {Array} listasPreciosCliente - Listas del cliente
 * @returns {Object} - Resultado de validación
 */
export function validarPreciosProducto(producto, listasPreciosCliente = []) {
  if (!producto) return { valido: false, razon: 'Producto no existe' };
  
  const faltantes = [];
  const existentes = [];
  
  for (const lista of listasPreciosCliente) {
    const config = CONFIG_LISTAS[lista];
    if (!config) continue;
    
    const precio = Number(producto[config.campo]);
    if (precio && precio > 0) {
      existentes.push(lista);
    } else {
      faltantes.push(lista);
    }
  }
  
  return {
    valido: faltantes.length === 0,
    faltantes,
    existentes,
    mensaje: faltantes.length 
      ? `Faltan precios para: ${faltantes.join(', ')}` 
      : 'Todos los precios están configurados'
  };
}

/**
 * Aplica precios basados en listas a una línea de pedido
 * @param {Object} linea - Línea de pedido
 * @param {Object} producto - Producto original
 * @param {Array} listasPreciosCliente - Listas del cliente
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} - Línea actualizada
 */
export function aplicarPrecioListaALinea(linea, producto, listasPreciosCliente, opciones = {}) {
  const { forzar = false, respetarManual = true } = opciones;
  
  // Si tiene precio manual y no se fuerza, respetar
  if (linea.precio_manual && !forzar && respetarManual) {
    return linea;
  }
  
  const resultado = determinarPrecioPorLista(producto, listasPreciosCliente);
  
  if (resultado) {
    return {
      ...linea,
      precio: resultado.precio,
      precio_base: Number(producto.precio), // Precio regular como referencia
      precio_tipo: resultado.tipo,
      precio_campo: resultado.campo,
      precio_fuente: resultado.fuente,
      precios_disponibles: obtenerPreciosDisponibles(producto, listasPreciosCliente).todos
    };
  }
  
  return linea;
}

/**
 * Aplica precios por lista a un array de líneas
 * @param {Object} params - Parámetros
 * @returns {Array} - Líneas actualizadas
 */
export function aplicarPreciosPorLista({
  lineas,
  productos,
  cliente,
  idsAfectados = null,
  opciones = {}
}) {
  if (!lineas?.length || !productos?.length || !cliente?.listas_precios?.length) {
    return lineas;
  }

  const listasCliente = cliente.listas_precios;
  const mapaProductos = productos.reduce((acc, p) => {
    if (p?.id) acc[p.id] = p;
    return acc;
  }, {});

  return lineas.map(linea => {
    // Si hay filtro por IDs y no está incluido, saltar
    if (idsAfectados && !idsAfectados.includes(String(linea.id))) {
      return linea;
    }

    const producto = mapaProductos[linea.id];
    if (!producto) return linea;

    return aplicarPrecioListaALinea(linea, producto, listasCliente, opciones);
  });
}

/**
 * Cambia el tipo de precio de una línea manualmente
 * @param {Object} linea - Línea a modificar
 * @param {string} nuevoTipo - Nuevo tipo (distribuidor/mayorista/minorista)
 * @param {Object} producto - Producto original
 * @returns {Object} - Línea actualizada
 */
export function cambiarTipoPrecioManual(linea, nuevoTipo, producto) {
  const config = CONFIG_LISTAS[nuevoTipo];
  if (!config || !producto) return linea;
  
  const nuevoPrecio = Number(producto[config.campo]);
  if (!nuevoPrecio || nuevoPrecio <= 0) return linea;
  
  return {
    ...linea,
    precio: nuevoPrecio,
    precio_tipo: nuevoTipo,
    precio_campo: config.campo,
    precio_manual: true,
    precio_fuente: 'manual'
  };
}
