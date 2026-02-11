import firebase from "firebase/app";
import "firebase/database";
import store from "@/store/index";
import { db } from "./db.js";
import moment from "moment";

const getActivosRef = () => db.database().ref(store.state.baseDatos.bd).child("activos");
const getEquiposRef = () => getActivosRef().child("equipos");
const getHistorialRef = () => getActivosRef().child("historial");
const getClientesActivosRef = () => getActivosRef().child("clientes_activos");
const getContadoresActivosRef = () => getActivosRef().child("contadores");

/**
 * Obtiene el siguiente código automático para equipos
 */
export const obtenerSiguienteCodigo = async () => {
  const contadorRef = getContadoresActivosRef().child("equipo_contador");
  const snapshot = await contadorRef.once("value");
  const actual = snapshot.val() || 0;
  const siguiente = actual + 1;
  await contadorRef.set(siguiente);
  return `ACTIVO-${String(siguiente).padStart(3, "0")}`;
};

/**
 * Obtiene el contador actual sin incrementar
 */
export const obtenerContadorActual = async () => {
  const snapshot = await getContadoresActivosRef().child("equipo_contador").once("value");
  return snapshot.val() || 0;
};

/**
 * Obtiene todos los equipos
 */
export const allEquipos = () => getEquiposRef();

/**
 * Obtiene un equipo por CÓDIGO (acceso directo)
 */
export const getEquipo = (codigo) => getEquiposRef().child(codigo);

/**
 * Obtiene un equipo por código (con datos)
 */
export const getEquipoPorCodigo = async (codigo) => {
  const snapshot = await getEquiposRef().child(codigo).once("value");
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

/**
 * Crea un nuevo equipo
 */
export const nuevoEquipo = async (data) => {
  const codigo = data.codigo || await obtenerSiguienteCodigo();
  const timestamp = Date.now();
  const existe = await getEquiposRef().child(codigo).once("value");
  if (existe.exists()) {
    throw new Error(`El código ${codigo} ya existe`);
  }

  const equipoData = {
    codigo: codigo,
    marca: data.marca || "",
    modelo: data.modelo || "",
    descripcion: data.descripcion || "",
    fecha_ingreso: data.fecha_ingreso || timestamp,
    ubicacion_especifica: data.ubicacion_especifica || "",
    condicion: "OPERATIVO",
    estado: "ALMACÉN",
    cliente_id: null,
    cliente_nombre: null,
    cliente_direccion: null,
    fecha_ultimo_cambio: timestamp,
    fecha_asignacion: null,
    fecha_devolucion: null,
    fecha_mantenimiento_inicio: null,
    fecha_mantenimiento_fin: null,
    observacion_actual: data.observacion_actual || "",
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    creado_por: store.state.permisos?.correo || "",
    creado_en: timestamp,
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).set(equipoData);

  await registrarHistorial(codigo, {
    tipo_cambio: "INGRESO",
    condicion_anterior: null,
    condicion_nueva: "OPERATIVO",
    estado_anterior: null,
    estado_nuevo: "ALMACÉN",
    cliente_anterior_id: null,
    cliente_anterior_nombre: null,
    cliente_nuevo_id: null,
    cliente_nuevo_nombre: null,
    observacion: `Equipo ingresado al sistema: ${codigo}`
  });

  return equipoData;
};

/**
 * Actualiza datos básicos de un equipo
 */
export const actualizarEquipo = async (codigo, data) => {
  const timestamp = Date.now();
  const updates = {
    ...data,
    actualizado_en: timestamp,
    usuario_ultimo_cambio: store.state.permisos?.correo || ""
  };

  await getEquiposRef().child(codigo).update(updates);
  return updates;
};

/**
 * Escucha cambios en tiempo real de equipos
 */
export const escucharEquipos = (callback) => {
  return getEquiposRef().on("value", (snapshot) => {
    const equipos = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        equipos.push({ codigo: child.key, ...child.val() });
      });
    }
    callback(equipos);
  });
};

/**
 * Detiene la escucha de equipos
 */
export const detenerEscuchaEquipos = () => {
  getEquiposRef().off();
};

/**
 * Asigna un equipo a un cliente (estado RESERVADO)
 */
export const asignarEquipo = async (codigo, cliente, observacion = "") => {
  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.condicion !== "OPERATIVO") throw new Error("El equipo debe estar OPERATIVO para asignarse");
  if (equipo.estado !== "ALMACÉN") throw new Error("El equipo debe estar en ALMACÉN para asignarse");

  const timestamp = Date.now();

  const updates = {
    estado: "RESERVADO",
    cliente_id: cliente.documento || cliente.id,
    cliente_nombre: cliente.nombre || cliente.razon_social,
    cliente_direccion: cliente.direccion || "",
    fecha_asignacion: timestamp,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  await getClientesActivosRef()
    .child(cliente.documento || cliente.id)
    .child("equipos_asignados")
    .child(codigo)
    .set({
      fecha_asignacion: timestamp,
      estado: "ACTIVO",
      observacion
    });

  await getClientesActivosRef()
    .child(cliente.documento || cliente.id)
    .update({
      cliente_id: cliente.documento || cliente.id,
      cliente_nombre: cliente.nombre || cliente.razon_social
    });

  await registrarHistorial(codigo, {
    tipo_cambio: "ASIGNACION",
    condicion_anterior: equipo.condicion,
    condicion_nueva: equipo.condicion,
    estado_anterior: "ALMACÉN",
    estado_nuevo: "RESERVADO",
    cliente_anterior_id: null,
    cliente_anterior_nombre: null,
    cliente_nuevo_id: cliente.documento || cliente.id,
    cliente_nuevo_nombre: cliente.nombre || cliente.razon_social,
    observacion: observacion || `Equipo asignado a ${cliente.nombre || cliente.razon_social}`
  });

  return updates;
};

/**
 * Confirma la entrega de un equipo (estado EN USO)
 */
export const confirmarEntrega = async (codigo, observacion = "") => {
  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.estado !== "RESERVADO") throw new Error("El equipo debe estar RESERVADO para confirmar entrega");

  const timestamp = Date.now();

  const updates = {
    estado: "EN USO",
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  if (equipo.cliente_id) {
    await getClientesActivosRef()
      .child(equipo.cliente_id)
      .child("equipos_asignados")
      .child(codigo)
      .update({
        estado: "ACTIVO",
        fecha_entrega: timestamp
      });
  }

  await registrarHistorial(codigo, {
    tipo_cambio: "ASIGNACION",
    condicion_anterior: equipo.condicion,
    condicion_nueva: equipo.condicion,
    estado_anterior: "RESERVADO",
    estado_nuevo: "EN USO",
    cliente_anterior_id: equipo.cliente_id,
    cliente_anterior_nombre: equipo.cliente_nombre,
    cliente_nuevo_id: equipo.cliente_id,
    cliente_nuevo_nombre: equipo.cliente_nombre,
    observacion: observacion || "Entrega confirmada al cliente"
  });

  return updates;
};

/**
 * Registra la devolución de un equipo
 * @param {string} codigo - Código del equipo
 * @param {string} condicionResultante - OPERATIVO o AVERIADO
 * @param {string} observacion - Observación obligatoria
 * @param {string} destino - ALMACÉN o PENDIENTE RECOJO (default: ALMACÉN)
 */
export const devolverEquipo = async (codigo, condicionResultante, observacion, destino = "ALMACÉN") => {
  if (!observacion || observacion.trim() === "") {
    throw new Error("La observación es obligatoria para registrar una devolución");
  }

  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.estado !== "EN USO" && equipo.estado !== "RESERVADO") {
    throw new Error("El equipo debe estar EN USO o RESERVADO para devolverse");
  }

  // Validar destino
  const destinoValido = destino === "PENDIENTE RECOJO" ? "PENDIENTE RECOJO" : "ALMACÉN";

  const timestamp = Date.now();
  const clienteAnteriorId = equipo.cliente_id;
  const clienteAnteriorNombre = equipo.cliente_nombre;

  const updates = {
    estado: destinoValido,
    condicion: condicionResultante,
    cliente_id: destinoValido === "PENDIENTE RECOJO" ? equipo.cliente_id : null,
    cliente_nombre: destinoValido === "PENDIENTE RECOJO" ? equipo.cliente_nombre : null,
    cliente_direccion: destinoValido === "PENDIENTE RECOJO" ? equipo.cliente_direccion : null,
    fecha_devolucion: timestamp,
    fecha_asignacion: destinoValido === "PENDIENTE RECOJO" ? equipo.fecha_asignacion : null,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  // Solo remover de cliente si va a ALMACÉN directamente
  if (destinoValido === "ALMACÉN" && clienteAnteriorId) {
    await getClientesActivosRef()
      .child(clienteAnteriorId)
      .child("equipos_asignados")
      .child(codigo)
      .remove();
  }

  await registrarHistorial(codigo, {
    tipo_cambio: destinoValido === "PENDIENTE RECOJO" ? "PENDIENTE_RECOJO" : "DEVOLUCION",
    condicion_anterior: equipo.condicion,
    condicion_nueva: condicionResultante,
    estado_anterior: equipo.estado,
    estado_nuevo: destinoValido,
    cliente_anterior_id: clienteAnteriorId,
    cliente_anterior_nombre: clienteAnteriorNombre,
    cliente_nuevo_id: destinoValido === "PENDIENTE RECOJO" ? equipo.cliente_id : null,
    cliente_nuevo_nombre: destinoValido === "PENDIENTE RECOJO" ? equipo.cliente_nombre : null,
    observacion
  });

  return updates;
};

/**
 * Completa el recojo de un equipo pendiente, llevándolo a ALMACÉN
 * @param {string} codigo - Código del equipo
 * @param {string} observacion - Observación obligatoria
 */
export const completarRecojo = async (codigo, observacion) => {
  if (!observacion || observacion.trim() === "") {
    throw new Error("La observación es obligatoria para completar el recojo");
  }

  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.estado !== "PENDIENTE RECOJO") {
    throw new Error("El equipo debe estar en PENDIENTE RECOJO");
  }

  const timestamp = Date.now();
  const clienteAnteriorId = equipo.cliente_id;
  const clienteAnteriorNombre = equipo.cliente_nombre;

  const updates = {
    estado: "ALMACÉN",
    cliente_id: null,
    cliente_nombre: null,
    cliente_direccion: null,
    fecha_asignacion: null,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  // Remover de cliente
  if (clienteAnteriorId) {
    await getClientesActivosRef()
      .child(clienteAnteriorId)
      .child("equipos_asignados")
      .child(codigo)
      .remove();
  }

  await registrarHistorial(codigo, {
    tipo_cambio: "RECOJO_COMPLETADO",
    condicion_anterior: equipo.condicion,
    condicion_nueva: equipo.condicion,
    estado_anterior: "PENDIENTE RECOJO",
    estado_nuevo: "ALMACÉN",
    cliente_anterior_id: clienteAnteriorId,
    cliente_anterior_nombre: clienteAnteriorNombre,
    cliente_nuevo_id: null,
    cliente_nuevo_nombre: null,
    observacion
  });

  return updates;
};

/**
 * Envía un equipo a mantenimiento
 */
export const enviarAMantenimiento = async (codigo, observacion) => {
  if (!observacion || observacion.trim() === "") {
    throw new Error("La observación es obligatoria");
  }

  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.estado !== "ALMACÉN") throw new Error("El equipo debe estar en ALMACÉN para enviar a mantenimiento");

  const timestamp = Date.now();

  const updates = {
    condicion: "EN MANTENIMIENTO",
    fecha_mantenimiento_inicio: timestamp,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  await registrarHistorial(codigo, {
    tipo_cambio: "MANTENIMIENTO",
    condicion_anterior: equipo.condicion,
    condicion_nueva: "EN MANTENIMIENTO",
    estado_anterior: equipo.estado,
    estado_nuevo: equipo.estado,
    cliente_anterior_id: null,
    cliente_anterior_nombre: null,
    cliente_nuevo_id: null,
    cliente_nuevo_nombre: null,
    observacion
  });

  return updates;
};

/**
 * Completa la reparación de un equipo
 */
export const completarReparacion = async (codigo, condicionResultante, observacion) => {
  if (!observacion || observacion.trim() === "") {
    throw new Error("La observación es obligatoria");
  }

  if (!["OPERATIVO", "DADO DE BAJA"].includes(condicionResultante)) {
    throw new Error("La condición resultante debe ser OPERATIVO o DADO DE BAJA");
  }

  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");
  if (equipo.condicion !== "EN MANTENIMIENTO") {
    throw new Error("El equipo debe estar EN MANTENIMIENTO para completar reparación");
  }

  const timestamp = Date.now();

  const updates = {
    condicion: condicionResultante,
    fecha_mantenimiento_fin: timestamp,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  await registrarHistorial(codigo, {
    tipo_cambio: "REPARACION",
    condicion_anterior: "EN MANTENIMIENTO",
    condicion_nueva: condicionResultante,
    estado_anterior: equipo.estado,
    estado_nuevo: equipo.estado,
    cliente_anterior_id: null,
    cliente_anterior_nombre: null,
    cliente_nuevo_id: null,
    cliente_nuevo_nombre: null,
    observacion
  });

  return updates;
};

/**
 * Cambia el estado/condición de un equipo manualmente
 */
export const cambiarEstadoEquipo = async (codigo, nuevoEstado, nuevaCondicion, observacion) => {
  if (!observacion || observacion.trim() === "") {
    throw new Error("La observación es obligatoria para cambiar estado");
  }

  const equipoSnap = await getEquiposRef().child(codigo).once("value");
  const equipo = equipoSnap.val();

  if (!equipo) throw new Error("Equipo no encontrado");

  const timestamp = Date.now();

  const updates = {
    estado: nuevoEstado || equipo.estado,
    condicion: nuevaCondicion || equipo.condicion,
    fecha_ultimo_cambio: timestamp,
    observacion_actual: observacion,
    usuario_ultimo_cambio: store.state.permisos?.correo || "",
    actualizado_en: timestamp
  };

  await getEquiposRef().child(codigo).update(updates);

  await registrarHistorial(codigo, {
    tipo_cambio: "CAMBIO_ESTADO",
    condicion_anterior: equipo.condicion,
    condicion_nueva: nuevaCondicion || equipo.condicion,
    estado_anterior: equipo.estado,
    estado_nuevo: nuevoEstado || equipo.estado,
    cliente_anterior_id: equipo.cliente_id,
    cliente_anterior_nombre: equipo.cliente_nombre,
    cliente_nuevo_id: equipo.cliente_id,
    cliente_nuevo_nombre: equipo.cliente_nombre,
    observacion
  });

  return updates;
};

/**
 * Registra un evento en el historial del equipo
 */
export const registrarHistorial = async (codigo, data) => {
  const timestamp = Date.now();
  const historialRef = getHistorialRef().child(codigo).push();

  const historialData = {
    id: historialRef.key,
    equipo_codigo: codigo,
    fecha: timestamp,
    usuario: store.state.permisos?.correo || "",
    usuario_nombre: store.state.permisos?.nombre || store.state.permisos?.correo || "",

    tipo_cambio: data.tipo_cambio,
    condicion_anterior: data.condicion_anterior,
    condicion_nueva: data.condicion_nueva,
    estado_anterior: data.estado_anterior,
    estado_nuevo: data.estado_nuevo,
    cliente_anterior_id: data.cliente_anterior_id,
    cliente_anterior_nombre: data.cliente_anterior_nombre,
    cliente_nuevo_id: data.cliente_nuevo_id,
    cliente_nuevo_nombre: data.cliente_nuevo_nombre,
    observacion: data.observacion
  };

  await historialRef.set(historialData);
  return historialData;
};

/**
 * Obtiene el historial de un equipo
 */
export const getHistorialEquipo = async (codigo) => {
  const snapshot = await getHistorialRef().child(codigo).orderByChild("fecha").once("value");
  const historial = [];

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      historial.push({ id: child.key, ...child.val() });
    });
  }

  // Ordenar descendente por fecha
  return historial.sort((a, b) => b.fecha - a.fecha);
};


export const getHistorialPorFechas = async (fechaInicio, fechaFin) => {
  const snapshot = await getHistorialRef().once("value");
  const historial = [];

  if (snapshot.exists()) {
    snapshot.forEach((equipoSnap) => {
      const equipoCodigo = equipoSnap.key;
      equipoSnap.forEach((registro) => {
        const data = registro.val();
        if (data.fecha >= fechaInicio && data.fecha <= fechaFin) {
          historial.push({
            id: registro.key,
            equipo_codigo: equipoCodigo,
            ...data
          });
        }
      });
    });
  }

  return historial.sort((a, b) => b.fecha - a.fecha);
};

/**
 * Obtiene los equipos asignados a un cliente
 */
export const getEquiposCliente = async (clienteId) => {
  const snapshot = await getClientesActivosRef().child(clienteId).once("value");
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

/**
 * Obtiene todos los clientes con equipos asignados
 */
export const getClientesConEquipos = async () => {
  const snapshot = await getClientesActivosRef().once("value");
  const clientes = [];

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      clientes.push({ id: child.key, ...child.val() });
    });
  }

  return clientes;
};

/**
 * Busca equipos por código o cliente
 */
export const buscarEquipos = async (termino) => {
  const esCodigoValido = termino.match(/^ACTIVO-\d{1,3}$/i);
  if (esCodigoValido) {
    const codigo = termino.toUpperCase();
    const equipo = await getEquipoPorCodigo(codigo);
    if (equipo) {
      return [{ codigo: codigo, ...equipo }];
    }
  }

  const snapshot = await getEquiposRef().once("value");
  const equipos = [];
  const terminoLower = termino.toLowerCase();

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const equipo = { codigo: child.key, ...child.val() };
      const matchCodigo = (equipo.codigo || "").toLowerCase().includes(terminoLower);
      const matchCliente = (equipo.cliente_nombre || "").toLowerCase().includes(terminoLower);
      const matchMarca = (equipo.marca || "").toLowerCase().includes(terminoLower);
      const matchModelo = (equipo.modelo || "").toLowerCase().includes(terminoLower);
      const matchDescripcion = (equipo.descripcion || "").toLowerCase().includes(terminoLower);

      if (matchCodigo || matchCliente || matchMarca || matchModelo || matchDescripcion) {
        equipos.push(equipo);
      }
    });
  }

  return equipos;
};

/**
 * Obtiene estadísticas de equipos
 */
export const getEstadisticasEquipos = async () => {
  const snapshot = await getEquiposRef().once("value");

  const stats = {
    total: 0,
    disponibles: 0,
    enUso: 0,
    reservados: 0,
    enMantenimiento: 0,
    averiados: 0,
    dadosDeBaja: 0
  };

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const equipo = child.val();
      stats.total++;

      if (equipo.condicion === "OPERATIVO" && equipo.estado === "ALMACÉN") {
        stats.disponibles++;
      }
      if (equipo.estado === "EN USO") {
        stats.enUso++;
      }
      if (equipo.estado === "RESERVADO") {
        stats.reservados++;
      }
      if (equipo.condicion === "EN MANTENIMIENTO") {
        stats.enMantenimiento++;
      }
      if (equipo.condicion === "AVERIADO") {
        stats.averiados++;
      }
      if (equipo.condicion === "DADO DE BAJA") {
        stats.dadosDeBaja++;
      }
    });
  }

  return stats;
};

/**
 * Obtiene equipo completo con código incluido
 */
export const getEquipoCompleto = async (codigo) => {
  const snapshot = await getEquiposRef().child(codigo).once("value");
  if (snapshot.exists()) {
    return {
      codigo: codigo,
      ...snapshot.val()
    };
  }
  return null;
};

/**
 * Verifica si un código existe
 */
export const existeCodigo = async (codigo) => {
  const snapshot = await getEquiposRef().child(codigo).once("value");
  return snapshot.exists();
};

/**
 * IMPORTACIÓN MASIVA DE EQUIPOS
 * @param {Array} equiposData - Array de objetos con los datos de los equipos
 * @returns {Object} Resultado con éxitos y errores
 */
export const importarEquiposMasivo = async (equiposData) => {
  const resultados = {
    exitosos: [],
    errores: []
  };

  const timestamp = Date.now();
  const usuario = store.state.permisos?.correo || "sistema@masivo.com";

  const promesas = equiposData.map(async (item) => {
    try {
      if (!item.codigo || String(item.codigo).trim() === "") {
        throw new Error("Código obligatorio");
      }

      const codigo = String(item.codigo).trim().toUpperCase();

      const existe = await getEquiposRef().child(codigo).once("value");
      if (existe.exists()) {
        throw new Error(`El código ${codigo} ya existe en el sistema`);
      }

      if (!item.marca || String(item.marca).trim() === "") {
        throw new Error("Marca obligatoria");
      }
      if (!item.descripcion || String(item.descripcion).trim() === "") {
        throw new Error("Descripción obligatoria");
      }
      if (!item.fecha_ingreso) {
        throw new Error("Fecha de ingreso obligatoria");
      }
      if (!item.ubicacion_especifica || String(item.ubicacion_especifica).trim() === "") {
        throw new Error("Ubicación específica obligatoria");
      }

      let fechaIngreso = item.fecha_ingreso;
      if (typeof fechaIngreso === "string" && fechaIngreso.includes("/")) {
        const [dia, mes, anio] = fechaIngreso.split("/");
        fechaIngreso = moment(`${anio}-${mes}-${dia}`).valueOf();
      } else {
        fechaIngreso = moment(fechaIngreso).valueOf();
      }
      if (isNaN(fechaIngreso)) {
        throw new Error("Fecha de ingreso inválida");
      }

      const condicion = item.condicion?.toUpperCase().trim() || "OPERATIVO";
      const estado = item.estado?.toUpperCase().trim() || "ALMACÉN";

      const equipoData = {
        codigo: codigo,
        marca: item.marca.trim(),
        modelo: item.modelo?.trim() || "",
        descripcion: item.descripcion.trim(),
        fecha_ingreso: fechaIngreso,
        ubicacion_especifica: item.ubicacion_especifica.trim(),
        condicion: condicion,
        estado: estado,
        cliente_id: item.cliente_id?.trim() || null,
        cliente_nombre: item.cliente_nombre?.trim() || null,
        cliente_direccion: item.cliente_direccion?.trim() || null,
        observacion_actual: item.observacion_actual?.trim() || `Importado masivamente el ${moment().format("DD/MM/YYYY")}`,
        fecha_asignacion: null,
        fecha_devolucion: null,
        fecha_mantenimiento_inicio: null,
        fecha_mantenimiento_fin: null,
        fecha_ultimo_cambio: timestamp,
        usuario_ultimo_cambio: usuario,
        creado_por: usuario,
        creado_en: timestamp,
        actualizado_en: timestamp
      };

      await getEquiposRef().child(codigo).set(equipoData);
      if (equipoData.cliente_id && equipoData.estado === "EN USO") {
        await getClientesActivosRef()
          .child(equipoData.cliente_id)
          .child("equipos_asignados")
          .child(codigo)
          .set({
            fecha_asignacion: timestamp,
            estado: "ACTIVO",
            observacion: equipoData.observacion_actual
          });

        await getClientesActivosRef()
          .child(equipoData.cliente_id)
          .update({
            cliente_id: equipoData.cliente_id,
            cliente_nombre: equipoData.cliente_nombre
          });
      }

      await registrarHistorial(codigo, {
        tipo_cambio: "INGRESO",
        condicion_anterior: null,
        condicion_nueva: condicion,
        estado_anterior: null,
        estado_nuevo: estado,
        cliente_anterior_id: null,
        cliente_anterior_nombre: null,
        cliente_nuevo_id: equipoData.cliente_id,
        cliente_nuevo_nombre: equipoData.cliente_nombre,
        observacion: `Importado desde carga masiva`
      });

      return { success: true, codigo, data: equipoData };

    } catch (error) {
      return {
        success: false,
        codigo: item.codigo || "SIN CÓDIGO",
        error: error.message,
        fila: item._fila || 0
      };
    }
  });

  const settled = await Promise.allSettled(promesas);

  settled.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      resultados.exitosos.push(result.value.codigo);
    } else {
      const errorData = result.status === "fulfilled" ? result.value : {
        codigo: equiposData[index]?.codigo || "DESCONOCIDO",
        error: result.reason?.message || "Error desconocido",
        fila: equiposData[index]?._fila || index + 2
      };
      resultados.errores.push(errorData);
    }
  });

  return resultados;
};