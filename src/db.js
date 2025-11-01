// Conveniently import this file anywhere to use db

import firebase from "firebase/app";
import "firebase/database";
import store from "@/store/index";
import moment from "moment";
export const db = firebase.initializeApp({
  apiKey: "AIzaSyBALmU6xm1c9gTelduqp9PBRJbTIpn3kLA",
  authDomain: "sis-distribucion.firebaseapp.com",
  databaseURL: "https://sis-distribucion-default-rtdb.firebaseio.com/",
  projectId: "sis-distribucion",
  storageBucket: "sis-distribucion.firebasestorage.app",
  messagingSenderId: "438794422463",
  appId: "1:438794422463:web:9d8aabc0355dc8fe7f5e0a",
});

const empresas = db.database().ref("empresas");
const multi_empresas = db.database().ref("multi_empresas");
const notificaciones = db.database().ref("notificaciones");

export const allEmpresas = () => {
  return empresas;
};

export const nuevaEmpresa = (id, array) => {
  return empresas.child(id).set(array);
};

export const eliminaEmpresa = (id) => {
  return empresas.child(id).remove();
};

export const actualizaEmpresa = (id, array) => {
  return empresas.child(id).set(array);
};
//--------------usuarios-----------
export const nuevoUsuario = (id, array) => {
  return db.database().ref("usuarios").child(id).set(array);
};
export const allUsuarios = () => {
  return db.database().ref("usuarios");
};
export const buscarUsuarios = (id) => {
  return db.database().ref("usuarios").child(id);
};
export const primerUsuario = (id, correo, pass) => {
  db.database().ref("usuarios").child(id).child("correo").set(correo);
  db.database().ref("usuarios").child(id).child("pass").set(pass);
};
export const nuevoCampoUsuario = (id, campo, data) => {
  return db.database().ref("usuarios").child(id).child(campo).set(data);
};
//-----multiempresas
export const all_multiEmpresas = () => {
  return multi_empresas;
};
export const lee_multiEmpresas = (id) => {
  return multi_empresas.child(id);
};
export const nueva_multiEmpresa = (id, array) => {
  return multi_empresas.child(id).set(array);
};

export const elimina_multiEmpresa = (id) => {
  return multi_empresas.child(id).remove();
};

//----------------empresa---------------------
export const obtenerBD = (empresa) => {
  return empresas.child(empresa);
};
export const allConfigura = () => {
  return db.database().ref(store.state.baseDatos.bd).child("configuracion");
};
export const grabaConfigura = (configura, value) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("configuracion")
    .child(configura)
    .set(value)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};

export const grabaConfiguraImpresora = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("configuracion")
    .child("impresoras")
    .child(id)
    .set(array);
};
export const allConfiguraImpresora = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("configuracion")
    .child("impresoras");
};
export const eliminaConfiguraImpresora = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("configuracion")
    .child("impresoras")
    .child(id)
    .remove();
};
//----------------empresa---------------------
export const obtenerImpresoras = () => {
  return db.database().ref(store.state.baseDatos.bd).child("impresora");
};
export const actualizaImpresoras = (tipo, dato) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("impresora")
    .child(tipo)
    .set(dato);
};
//----------------series---------------------
export const obtenerSeries = () => {
  return db.database().ref(store.state.baseDatos.bd).child("seriesdocumentos");
};
export const actualizaSeries = (tipo, dato) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("seriesdocumentos")
    .child(tipo)
    .set(dato);
};

//----------------productos---------------------
export const allProductos = () => {
  return db.database().ref(store.state.baseDatos.bd).child("productos");
};
export const nuevoProducto = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("productos")
    .child(id)
    .set(array);
};
export const eliminaProducto = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("productos")
    .child(id)
    .remove();
};
export const buscaProductos = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("productos")
    .child(id);
};
export const grabarStock = (id, stock) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("productos")
    .child(id)
    .child("stock")
    .set(stock)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const editaProducto = (id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("productos")
    .child(id)
    .child(campo)
    .set(data);
};

//-------------entradas------------
export const allProformas = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proformas");
};
export const nuevoProformas = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proformas")
    .child(id)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const eliminaProformas = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proformas")
    .child(id)
    .remove();
};
export const buscaProformas = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proformas");
};




//---------crear masivos---------
export const crearCampo = (bd, id, nombre, valor) => {
  return db
    .database()
    .ref(bd)
    .child("productos")
    .child(id)
    .child(nombre)
    .set(valor);
};
export const crearCampoconfiguracion = (bd, tabla, nombre, valor) => {
  return db.database().ref(bd).child(tabla).child(nombre).set(valor);
};
export const crearCampoCATEGORIAS = (bd, tabla, id, nombre, valor) => {
  return db.database().ref(bd).child(tabla).child(id).child(nombre).set(valor);
};
//----------------contadores---------------------
export const obtenContador = () => {
  return db.database().ref(store.state.baseDatos.bd).child("contadores");
};
export const sumaContador = (contador, orden) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("contadores")
    .child(contador)
    .set(orden)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const actualizaContador = (contador, orden) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("contadores")
    .child(contador)
    .set(orden);
};
//----------------categorias---------------------
export const allCategorias = (tabla) => {
  return db.database().ref(store.state.baseDatos.bd).child(tabla);
};
export const nuevoCategoria = (tabla, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .push(array);
};
export const editaCategoria = (tabla, id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .child(id)
    .child(campo)
    .set(data);
};
export const eliminaCategoria = (tabla, id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .child(id)
    .remove();
};
//----------------Tabla cliente---------------------
export const alltabla_cliente = (tabla) => {
  return db.database().ref(store.state.baseDatos.bd).child(tabla);
};
export const nueva_tabla_cliente = (tabla, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .push(array);
};
export const edita_tablacliente = (tabla, id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .child(id)
    .child(campo)
    .set(data);
};
export const elimina_tabla_cliente = (tabla, id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child(tabla)
    .child(id)
    .remove();
};
//----------------categorias---------------------
export const allSeries = () => {
  return db.database().ref(store.state.baseDatos.bd).child("series");
};
export const nuevoSeries = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("series")
    .child(id)
    .set(array);
};
export const eliminaSeries = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("series")
    .child(id)
    .remove();
};
//-----------Comprobante Venta--------------------
export const consulta_Cabecera = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(id);
};
export const eliminaNodo = (nodo) => {
  return db.database().ref(store.state.baseDatos.bd).child(nodo).remove();
};
export const allCabecera = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera");
};
export const allCabecera_general = (bd) => {
  return db.database().ref(bd).child("comprobantecabecera");
};
export const elimina_Cabecera = (numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .remove();
};
export const grabaCabecera = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .set(array)

};
export const grabaDetalle = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantedetalle")
    .child(numeracion)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const consultaDetalle = (numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantedetalle")
    .child(numeracion);
};
export const grabaEstadoComprobante = (
  numeracion,
  personaID,
  estado,
  data,
  hash
) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("documentId")
    .set(personaID);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("hash")
    .set(hash);
};
export const grabaconsultacomprobante = (numeracion, estado, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
};
export const grabaDatoC = (numeracion, campo, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child(campo)
    .set(data);
};
export const edita_campo_nc_cabe = (numeracion, campo, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child(campo)
    .set(data);
};
export const edita_campo_nc = (numeracion, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child(campo)
    .set(data);
};
export const grabaconsultacomprobanteNC = (numeracion, estado, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
};

export const grabaEstadoTicketConsolidado = (numeracion, consolidado) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("estado")
    .set("consolidado");
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("documentId")
    .set(consolidado);
};
export const buscacabecera = (bd, numeracion) => {
  return db.database().ref(bd).child("comprobantecabecera").child(numeracion);
};
export const buscadetalle = (bd, numeracion) => {
  return db.database().ref(bd).child("comprobantedetalle").child(numeracion);
};
export const grabaDatoC_otrabd = (bd, numeracion, campo, data) => {
  db.database()
    .ref(bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child(campo)
    .set(data);
};
//------------- puntos clientes /////

/////////////---------ubigeos-------------------
export const consultaubigeo = () => {
  return db.database().ref("ubigeos");
};
//-----------Acrhivos---------------
export const guardaArchivo = (BD, selectedFile, ubicacion) => {
  const storageRef = db.storage().ref(BD + "/" + ubicacion);
  return storageRef.put(selectedFile);
};
export const guardaIcono = (selectedFile, ubicacion) => {
  const storageRef = db.storage().ref("carpetaiconos/" + ubicacion);
  return storageRef.put(selectedFile);
};
export const guardaRutaIconos = (orden, array) => {
  return db.database().ref("iconos").child(orden).set(array);
};
export const eliminaRutaIconos = (orden) => {
  return db.database().ref("iconos").child(orden).remove();
};
export const eliminaIcono = (ubicacion) => {
  return db
    .storage()
    .ref("carpetaiconos/" + ubicacion)
    .delete();
};
export const consultaIconos = () => {
  return db.database().ref("iconos");
};
export const guardaRutaArchibo = (ruta, tipo) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("Rutas")
    .child(tipo)
    .set(ruta);
};
export const consultaArchivo = () => {
  return db.database().ref(store.state.baseDatos.bd).child("Rutas");
};
export const bajarCartaPDF = (base) => {
  return db.database().ref(base).child("Rutas");
};
//--------------clientes------------

export const allClientes_bd = (bd) => {
  return db
    .database()
    .ref("general")
    .child(bd)
    .child("clientes");
};
export const allClientes = () => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("clientes");
};
export const nuevoCliente = (id, array) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("clientes")
    .child(id)
    .set(array)
};
export const eliminaCliente = (id) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("clientes")
    .child(id)
    .remove();
};
export const buscaCliente = () => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("clientes");
};
export const edita_campo_Cliente = (id, campo, data) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("clientes")
    .child(id)
    .child(campo)
    .set(data)
};

//--------------clientes------------
export const allEmpleados = () => {
  return db.database().ref(store.state.baseDatos.bd).child("empleados");
};
export const nuevoEmpleados = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("empleados")
    .child(id)
    .set(array);
};
export const eliminaEmpleados = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("empleados")
    .child(id)
    .remove();
};
export const buscaEmpleados = () => {
  return db.database().ref(store.state.baseDatos.bd).child("empleados");
};
//--------------proveedores------------
export const allProveedor = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proveedor");
};
export const nuevoProveedor = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proveedor")
    .child(id)
    .set(array);
};
export const eliminaProveedor = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proveedor")
    .child(id)
    .remove();
};
export const buscaProveedor = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("proveedor");
};
//-------buscar Otra BASE---------
export const buscaProductosOtraBase = (bd, id) => {
  return db.database().ref(bd).child("productos").child(id);
};
export const edita_producto_otraBD = (bd, id, campo, stock) => {
  return db
    .database()
    .ref(bd)
    .child("productos")
    .child(id)
    .child(campo)
    .set(stock);
};
export const grabarStockOtraBase = (bd, id, stock) => {
  return db
    .database()
    .ref(bd)
    .child("productos")
    .child(id)
    .child("stock")
    .set(stock);
};
export const nuevoProductoOtraBase = (bd, id, array) => {
  return db.database().ref(bd).child("productos").child(id).set(array);
};
export const nuevaCategoria_otraBD = (bd, id, array) => {
  return db.database().ref(bd).child("categorias").child(id).set(array);
};
export const allProductoOtraBase = (bd) => {
  return db.database().ref(bd).child("productos");
};
export const allComprobantesCabeceraOtraBase = (bd) => {
  return db.database().ref(bd).child("comprobantecabecera");
};
export const nuevoComprobantesCabeceraSerie = (bd, id, serie) => {
  return db
    .database()
    .ref(bd)
    .child("comprobantecabecera")
    .child(id)
    .child("serie")
    .set(serie);
};

//-------------flujo tesoreria---------
export const all_flujo_teso = () => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujotesoreria");
};
export const nuevoflujo_teso = (array) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujotesoreria")
    .push(array);
};
export const estadoFlujo_teso = (id, estado) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujotesoreria")
    .child(id)
    .child("estado")
    .set(estado);
};
export const edita_Flujo_teso = (id, estado) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujotesoreria")
    .child(id)
    .set(estado);
};
export const elimina_all_flujo_teso = () => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujotesoreria")
    .remove();
};
export const nuevoflujo_historial_teso = (array) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("flujocaja_historial")
    .push(array);
};
//--------------flujocaja-------------
export const allflujo = () => {
  return db.database().ref(store.state.baseDatos.bd).child("flujocaja");
};
export const elimina_all_flujo = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja")
    .remove();
};
export const elimina_all_flujo_bd = (bd) => {
  return db.database().ref(bd).child("flujocaja").remove();
};
export const nuevo_histo_stock = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("histo_stock")
    .child(id)
    .set(array);
};
export const all_histo_stock = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("histo_stock");
};
export const nuevoflujo = (array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja")
    .push(array);
};
export const estadoFlujo = (id, estado) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja")
    .child(id)
    .child("estado")
    .set(estado);
};
export const edita_Flujo = (id, estado) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja")
    .child(id)
    .set(estado);
};
export const flujo_historial = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja_historial")
    .child(id);
};
export const allflujo_historial = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja_historial");
};
export const nuevoflujo_historial = (array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("flujocaja_historial")
    .push(array);
};
//----modo pago---------
export const allModoPago = () => {
  return db.database().ref(store.state.baseDatos.bd).child("modopago");
};
export const nuevoModoPago_bd = (bd, array) => {
  return db.database().ref(bd).child("modopago").set(array);
};
export const nuevoModoPago = (array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("modopago")
    .set(array);
};
export const eliminaModoPago = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("modopago")
    .child(id)
    .remove();
};
//----modo pago---------
export const allPredefinidos = () => {
  return db.database().ref(store.state.baseDatos.bd).child("Predefinidos");
};
export const nuevoPredefinidos = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("Predefinidos")
    .child(id)
    .set(array);
};
export const eliminaPredefinidos = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("Predefinidos")
    .child(id)
    .remove();
};
//----cuentas bancos---------
export const allBancos = () => {
  return db.database().ref(store.state.baseDatos.bd).child("bancos");
};
export const nuevoBanco = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("bancos")
    .child(id)
    .set(array);
};
export const eliminaBanco = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("bancos")
    .child(id)
    .remove();
};

//-----------------------notaCredito DEbito
export const consulta_CabeceraNCD = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(id);
};
export const allCabeceraNCD = () => {
  return db.database().ref(store.state.baseDatos.bd).child("ncdcabecera");
};
export const grabaCabeceraNCD = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .set(array);
};
export const grabaDetalleNCD = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("ncddetalle")
    .child(numeracion)
    .set(array);
};
export const consultaDetalleNCD = (numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("ncddetalle")
    .child(numeracion);
};
export const grabaEstadoComprobanteNCD = (numeracion, estado, data, hash) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("hash")
    .set(hash);
};
export const grabaAnulacionreferecia = (numeracion, estado, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("comprobantecabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
};
export const grabaAnulacionrefereciaNC = (numeracion, estado, data) => {
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("estado")
    .set(estado);
  db.database()
    .ref(store.state.baseDatos.bd)
    .child("ncdcabecera")
    .child(numeracion)
    .child("mensajeSunat")
    .set(data);
};
//-------------------------RESUMEN DE ANULACION-----------------+
export const allCabeceraRA = () => {
  return db.database().ref(store.state.baseDatos.bd).child("racabecera");
};
export const grabaCabeceraRA = (numeracion, array) => {
  var c = db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("racabecera")
    .child(numeracion)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const grabaDetalleRA = (numeracion, array) => {
  var c = db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("radetalle")
    .child(numeracion)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const consultaDetalleRA = (numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("radetalle")
    .child(numeracion);
};
//-----------------------NOTIFICACIONES--------------------
export const grabaNotificacion = (bd, estado, mensaje) => {
  var c = db
    .database()
    .ref("notificaciones")
    .child(bd)
    .child("mensaje")
    .set(mensaje)
    .then(() => {
      db.database()
        .ref("notificaciones")
        .child(bd)
        .child("dialogoAlerta")
        .set(estado);
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const grabaactualizadialogo = (bd, estado, dialog) => {
  var c = db
    .database()
    .ref("notificaciones")
    .child(bd)
    .child(dialog)
    .set(estado)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const allnotificaciones = (bd) => {
  return db.database().ref("notificaciones").child(bd);
};
export const grabaCronogramapago = (bd, array) => {
  return db.database().ref("pagoempresas").child(bd).set(array);
};
export const allCronogramapago = (bd) => {
  return db.database().ref("pagoempresas").child(bd);
};
export const grabapagocronograma = (bd, periodo, data, valor) => {
  return db
    .database()
    .ref("pagoempresas")
    .child(bd)
    .child(periodo)
    .child(data)
    .set(valor);
};
//-----------------------REPORTES--------------------
export const grabareporte = (tipo, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("reportes")
    .child(tipo)
    .set(array);
};
export const consultareporte = (tipo) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("reportes")
    .child(tipo);
};
//-----------------proformas-------------
export const allCabeceraProforma = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("proformas")
    .child("cabecera");
};
export const grabaCabeceraProforma = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("proformas")
    .child("cabecera")
    .child(numeracion)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const grabaDetalleProforma = (numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("proformas")
    .child("detalle")
    .child(numeracion)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const consultaDetalleProforma = (numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("proformas")
    .child("detalle")
    .child(numeracion);
};
//------------------cujentas x cobrar
export const nuevaCuentaxcobrar = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("x_cobrar")
    .child(id)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const editaCuentaxCobrar = (id, tipo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("x_cobrar")
    .child(id)
    .child(tipo)
    .set(data)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const allcuentaxcobrar = () => {
  return db.database().ref(store.state.baseDatos.bd).child("x_cobrar");
};
///----------------------guia remision-*-----------------
export const allGuiaremision = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Guia");
};
export const nuevaGuiaremision = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Guia")
    .child(id)
    .set(array);
  return c;
};
export const eliminaGuiaremision = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Guia")
    .child(id)
    .remove();
};
export const buscaGuiaremision = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Guia")
    .child(id);
};
export const editaGuiaremision = (id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Guia")
    .child(id)
    .child(campo)
    .set(data);
};
export const nuevo_ticket_guia = (comprobante, ticket) => {
  var array = {
    id_doc: comprobante,
    num_ticket: ticket,
    estado: "pendiente",
    bd: store.state.baseDatos.bd,
    fecha: moment().unix(),
  };
  console.log(array);
  return db.database().ref("pendientes").child("guias").push(array);
};
//------------------
export const nuevoMovimiento = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("movimientos")
    .child(id)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const edita_Movimiento = (id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("movimientos")
    .child(id)
    .child(campo)
    .set(data)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const allMovimientos = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("movimientos");
};
export const elmina_mov_kardex = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("movimientos")
    .child(id)
    .remove();
};
export const movi_detallado_pro = (periodo, id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("historial")
    .child(periodo)
    .child(id)
    .push(array)
    .then((c) => {
      return db
        .database()
        .ref(store.state.baseDatos.bd)
        .child("almacen")
        .child("historial")
        .child(periodo)
        .child(id)
        .child(c.key)
        .child("key")
        .set(c.key)
        .then(() => {
          return c.key;
        });
    });
};
export const edita_hitorial = (periodo, id, key, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("historial")
    .child(periodo)
    .child(id)
    .child(key)
    .child(campo)
    .set(data)
    .then((c) => {
      return true;
    });
};
export const all_movi_detallado_pro = (periodo, id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("historial")
    .child(periodo)
    .child(id);
};
export const eliminar_Movimientos = (periodo, id, key) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("historial")
    .child(periodo)
    .child(id)
    .child(key)
    .remove()
    .then(() => {
      return true;
    });
};
///-----------------agrega tablaa------------------
export const agrega_tabla = (tabla, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("tablas")
    .child(tabla)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
  return c;
};
export const busca_tabla = (tabla) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("tablas")
    .child(tabla);
};
//--------------------almacen crea-------------------------
export const all_almacenes = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("lista_almacenes");
};
export const elimina_almacenes = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("lista_almacenes")
    .child(id)
    .remove();
};
export const nuevo_almacen = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("lista_almacenes")
    .child(id)
    .set(array)
    .then(() => {
      return true;
    })
    .catch(function (error) {
      return error;
    });
};
//--- sire
export const all_periodo_k = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("periodos");
};
export const nuevo_periodo_k = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("periodos")
    .child(id)
    .set(array);
};
export const edita_periodo_k = (id, campo, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("almacen")
    .child("periodos")
    .child(id)
    .child(campo)
    .set(data);
};

//vehiculos
export const allvechiulos = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("vehiculos");
};
export const nuevo_vehiculo = (array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("vehiculos")
    .push(array);
};
export const elimina_vehiculo = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("vehiculos")
    .child(id)
    .remove();
};
//choferes
export const allchofer = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("chofer");
};
export const nuevo_chofer = (array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("chofer")
    .push(array);
};
export const elimina_chofer = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("chofer")
    .child(id)
    .remove();
};
//transportista
export const alltransporte = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("transporte");
};
export const nuevo_transporte = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("transporte")
    .child(id)
    .set(array);
};
//---------PASAJES----------

export const all_transferencia = () => {
  return db
    .database()
    .ref("kardex_general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("transferencias");
};
export const graba_transferencia = (data) => {
  return db
    .database()
    .ref("kardex_general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("transferencias")
    .push(data);
};
export function actualiza_transferencia(clave, data) {
  return db
    .database()
    .ref("kardex_general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("transferencias/" + clave)
    .update(data);
}

// visitas
export const nueva_visita = (id_cliente, array) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("visita_clientes")
    .child(id_cliente)
    .push(array)
};
export const visita_x_id = (id_cliente) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("visita_clientes")
    .child(id_cliente)
};
export const all_pedidos = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_pedidos")
};
export const edita_pedidos = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_pedidos")
};
export const modifica_pedidos = (id, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_pedidos")
    .child(id)
    .set(data)
};
export const detalle_pedido = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_pedidos")
    .child(id)
};
export const all_cabecera_reparto = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_reparto")
};
export const Cabecera_p = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_reparto")
    .child(id);
};
export const nueva_cabecera_reparto = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("cabecera_reparto")
    .child(id)
    .set(array);
};
export const all_Cabecera_p = (grupo) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_reparto")
    .child(grupo)
    .child("data_c");
};
export const all_detalle_p = (grupo, numeracion) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_reparto")
    .child(grupo)
    .child("data_d")
    .child(numeracion);
};
export const grabaCabecera_p = (grupo, numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_reparto")
    .child(grupo)
    .child("data_c")
    .child(numeracion)
    .set(array)
};
export const detalleCabecera_p = (grupo, numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_reparto")
    .child(grupo)
    .child("data_d")
    .child(numeracion)
    .set(array)
};
export const guarda_serv_imp = (id, data) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("servicio_imp")
    .child(id)
    .set(data);
};
export const all_serv_imp = () => {
  return db.database().ref(store.state.baseDatos.bd).child("servicio_imp");
};
export const elimina_serv_imp = () => {
  return db.database().ref(store.state.baseDatos.bd).child("servicio_imp");
};
//-------------COMPRAS------------
export const allBono = () => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Bono");
};
export const busca_bono = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Bono")
    .child(id);
};
export const nuevoBono = (id, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Bono")
    .child(id)
    .set(array)
};
export const eliminabono = (id) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("kardex")
    .child("Bono")
    .child(id)
    .remove()
};

export const all_medidas = () => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("medidas");
};
export const graba_medida = (data) => {
  return db
    .database()
    .ref("general")
    .child(store.state.baseDatos.ruc_asociado)
    .child("medidas")
    .push(data);
};
export const graba_cabecera_p = (id, numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd).child("pedidos").child('detalle_reparto').child(id).child('data_c').child(numeracion).set(array)
};
export const graba_detalle_p = (id, numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd).child("pedidos").child('detalle_reparto').child(id).child('data_d').child(numeracion).set(array)
};
export const nuevo_detalle_entrega = (grupo, numeracion, array) => {
  return db
    .database()
    .ref(store.state.baseDatos.bd)
    .child("pedidos")
    .child("detalle_reparto")
    .child(grupo)
    .child("entregas")
    .child(numeracion)
    .set(array)
};