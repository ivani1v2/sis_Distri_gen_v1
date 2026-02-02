// Evita doble init en hot-reload
import firebase from "firebase/app";
import "firebase/database";
import "firebase/firestore";
import store from "@/store/index";
import { db } from "./db.js";
const app = db;

// Firestore (nuevo para usuarios)
export const fs = app.firestore();

// (Opcional pero recomendado) caché offline Firestore
fs.enablePersistence({ synchronizeTabs: true }).catch((e) => {
  // Si falla por múltiples pestañas, reintenta sin synchronizeTabs

  // Si es 'unimplemented', queda en memoria (aún así encola mientras no recargues).
});

// --------- USUARIOS (FIRESTORE) - NUEVO ----------
export const colUsuarios = () => fs.collection("usuarios");
export const colClientes = () => fs.collection("general").doc(store.state.baseDatos.ruc_asociado).collection("clientes");
export const colRuta_x_dia = () => fs.collection("general").doc(store.state.baseDatos.ruc_asociado).collection("rutaDelDia");
export const colClientesSearch = () => fs.collection("general").doc(store.state.baseDatos.ruc_asociado).collection("clientes_search");
export const colempresa = () => fs.collection(store.state.baseDatos.bd);

// Crea/actualiza usuario por ID
export const nuevoUsuario = (id, data) => colUsuarios().doc(id).set(data, { merge: true });

export const crearOActualizarCliente = (id, data) =>
  colClientes().doc(String(id)).set({ id: String(id), ...data }, { merge: true });

export const borrarCliente = (id) =>
  colClientes().doc(String(id)).delete();

// --------- KARDEX CIERRES (FIRESTORE) ----------
// Ruta: /BD97/kardex/cierres/MM-YYYY/productos/{productoId}
export const colCierresKardex = (periodo) => 
  fs.collection(store.state.baseDatos.bd)
    .doc('kardex')
    .collection('cierres')
    .doc(periodo)
    .collection('productos');

// Obtener todos los productos del cierre de un período
export const getCierresPeriodo = async (periodo) => {
  const snapshot = await colCierresKardex(periodo).get();
  const productos = [];
  snapshot.forEach(doc => {
    productos.push({ id: doc.id, ...doc.data() });
  });
  return productos;
};

// Obtener cierre de un producto específico
export const getCierreProducto = async (periodo, productoId) => {
  const doc = await colCierresKardex(periodo).doc(String(productoId)).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }
  return null;
};

// Referencia a colección de historial de un producto
export const colHistorialProducto = (productoId) => 
  fs.collection(store.state.baseDatos.bd)
    .doc('kardex')
    .collection('historial')
    .doc(String(productoId))
    .collection('detalle');

// Obtener movimientos de un producto en un rango de fechas
export const getMovimientosProductoPeriodo = async (productoId, fechaIni, fechaFin) => {
  const snapshot = await colHistorialProducto(productoId)
    .where('f', '>=', fechaIni)
    .where('f', '<=', fechaFin)
    .orderBy('f')
    .get();
  
  const movimientos = [];
  snapshot.forEach(doc => {
    movimientos.push({ id: doc.id, ...doc.data() });
  });
  return movimientos;
};

// Obtener resumen de movimientos para todos los productos en un período
export const getResumenMovimientosPeriodo = async (fechaIni, fechaFin, productosIds) => {
  const resumen = {};
  productosIds.forEach(id => {
    resumen[id] = { sum_mes: 0, movs_mes: 0 };
  });
  
  if (productosIds.length === 0) return resumen;
  
  // Limitar concurrencia para no sobrecargar Firestore
  const batchSize = 5; // Número de consultas simultáneas
  const delay = 50; // Milisegundos entre lotes
  
  for (let i = 0; i < productosIds.length; i += batchSize) {
    const batchIds = productosIds.slice(i, i + batchSize);
    
    // Crear promesas para este lote
    const promises = batchIds.map(productoId => 
      colHistorialProducto(productoId)
        .where('f', '>=', fechaIni)
        .where('f', '<=', fechaFin)
        .get()
        .then(snapshot => ({
          productoId,
          sum_mes: snapshot.docs.reduce((sum, doc) => sum + Number(doc.data().cant || 0), 0),
          movs_mes: snapshot.size
        }))
        .catch(error => {
          console.warn(`Error parcial para producto ${productoId}:`, error.message);
          return {
            productoId,
            sum_mes: 0,
            movs_mes: 0
          };
        })
    );
    
    // Esperar este lote
    const resultados = await Promise.all(promises);
    
    // Consolidar resultados
    resultados.forEach(resultado => {
      if (resultado && resultado.productoId) {
        resumen[resultado.productoId] = {
          sum_mes: resultado.sum_mes,
          movs_mes: resultado.movs_mes
        };
      }
    });
    
    // Pequeña pausa entre lotes para no saturar
    if (i + batchSize < productosIds.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return resumen;
};