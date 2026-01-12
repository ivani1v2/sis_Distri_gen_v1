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