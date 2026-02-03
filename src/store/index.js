import Vue from "vue";
import Vuex from "vuex";
import store from "@/store/index";
import axios from "axios";
import moment from "moment";
Vue.use(Vuex);
import createPersistedState from "vuex-persistedstate";
export default new Vuex.Store({
  state: {
    baseDatos: [],
    esmovil: "",
    permisos: [],
    array_sedes: [],
    sedeActual: [],
    dialogocontadores: null,
    serv_imp: null,
    dialogomedidas: null,
    dialogoFecha: null,
    dialogoFecha2: null,
    dialogoFecha3: null,
    dialogoConfiguracion: null,
    configuracion: [],
    configImpresora: {},
    seriesdocumentos: {},
    dialgoGestionMesas: null,
    dialogoToken: null,
    dialogoAgregaExcel: null,
    dialogoCartaQR: null,
    dialogoLogoEmpresa: null,
    dialogoImpresora: null,
    dialogoProducto: null,
    dialogoSerieDocumentos: null,
    dialogomodopago: null,
    dialogomensaje: null,
    dialogoAlerta: null,
    dialogoRestaurante: null,
    dialogoiconos: null,
    dialogoproductos: false,
    dialogoproductosv2: false,
    dialogoprogress: null,
    dialogosnackbar: null,
    dialogoinsumo: null,
    dialogobancos: null,
    dialogohost: null,
    dialogoPredefinidos: null,
    dialogoclientes: null,
    dialogoClientesnuevos: null,
    dialogo_moneda: null,
    dialogo_configcatalogo: null,
    dialogo_guia: null,
    dialogoentrada: null,
    dialogosalidas: null,
    dialogoproforma: null,
    dialogocompras: null,
    dialogo_cobrar: null,
    completa_cobro: false,
    dialogo_caja: false,
    logoempresa: "",
    textosnackbar: "",
    tipodialogoicono: "",
    iconoselecto: "",
    modopagos: [],
    bancos: [],
    token: "",
    empresaselecta: [],
    arraynotifica: [],
    productos: [],
    clientes: [],
    categorias: [],
    productos_caja: [],
    cabecera_caja: [],
    modopago_caja: [],
    productos_consolida: [],
    ultimo_correlativo: "",
    dialogoClientesnuevos: false,
    dialogoNota: null,
    data_caja_cabecera: "",
    data_caja: "",
    array_guia: "",
    origen_pedido_nuevo: "",
    lista_modos: [
      "EFECTIVO",
      "YAPE",
      "PLIN",
      "TARJETA",
      "TRANSFERENCIA",
      "INTERBANK CTA CTE",
      "BBVA CTA CTE",
      "T.DEBITO",
      "T.CREDITO",
      "RAPPY",
      "PEDIDOS YA",
    ],
    moneda: [
      {
        codigo: "PEN",
        moneda: "Sol",
        simbolo: "S/",
        pais: "Perú",
      },
      {
        codigo: "USD",
        moneda: "Dólar Estadounidense",
        simbolo: "$",
        pais: "Estados Unidos",
      },
      {
        codigo: "EUR",
        moneda: "Euro",
        simbolo: "€",
        pais: "Unión Europea",
      }
    ],

    modopagos: [],
    iconos_pagos: [
      {
        nombre: "EFECTIVO",
        icono: "cash.png",
      },
      {
        nombre: "TARJETA",
        icono: "tarjeta.png",
      },
      {
        nombre: "YAPE",
        icono: "yape.png",
      },
      {
        nombre: "PLIN",
        icono: "plin.webp",
      },
      {
        nombre: "TRANSFERENCIA",
        icono: "bank.png",
      },
      {
        nombre: "INTERBANK CTA CTE",
        icono: "bank.png",
      },
      {
        nombre: "BBVA CTA CTE",
        icono: "bank.png",
      },
      {
        nombre: "T.DEBITO",
        icono: "tarjeta.png",
      },
      {
        nombre: "T.CREDITO",
        icono: "tarjeta_.png",
      },
      {
        nombre: "RAPPY",
        icono: "rappy.png",
      },
      {
        nombre: "PEDIDOS YA",
        icono: "pedidosya.png",
      },
    ],
    array_periodos: ["08-2023", "09-2023", "10-2023", "11-2023", "12-2023"],
    motivos_ajuste: [
      "STOCK INICIAL",
      "COMPRA",
      "TRASLADO ENTRE ALMACENES",
      "DEGUSTACION",
      "PRODUCCION",
      "MERMA",
      "AJUSTE DE INVENTARIO",
      "CONSUMO",
      "DETERIORO",
      "DONACION",
      "PERDIDA",
      "ROBO",
      "TRANSFORMACION",
    ],
    medidas: [
      "UNIDAD",
      "METRO CUBICO",
      "DOCENA",
      "PAR",
      "MILLARES",
      "KILOGRAMO",
      "TONELADA",
      "METRO",
      "GRAMO",
      "PAQUETE",
      "PAQUETEx6",
      "PAQUETEx12",
      "PAQUETE",
      "CAJA",
      "BOTELLAS",
      "LITRO",
      "GALON",
      "BIDON",
      "PLANCHA",
      "CIENTO",
      "FARDOS",
      "DIAS",
      "FRASCO",
      "SACO",
      "DISPLAY",
      "TIRA"
    ],
    medidassunat: [
      {
        nombre: "UNIDAD",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "METRO CUBICO",
        corto: "MTQ",
        general: "MTQ",
      },
      {
        nombre: "DOCENA",
        corto: "DZN",
        general: "DOC",
      },
      {
        nombre: "PAR",
        corto: "NIU",
        general: "PAR",
      },
      {
        nombre: "MILLARES",
        corto: "MIL",
        general: "MILL",
      },
      {
        nombre: "KILOGRAMO",
        corto: "KGM",
        general: "KG",
      },
      {
        nombre: "TONELADA",
        corto: "TNE",
        general: "TN",
      },
      {
        nombre: "METRO",
        corto: "MTR",
        general: "MT",
      },
      {
        nombre: "GRAMO",
        corto: "GRM",
        general: "GR",
      },
      {
        nombre: "PAQUETE",
        corto: "PK",
        general: "PAQ",
      },
      {
        nombre: "PAQUETEx6",
        corto: "PK",
        general: "PAQ",
      },
      {
        nombre: "PAQUETEx12",
        corto: "PK",
        general: "PAQ",
      },
      {
        nombre: "CAJA",
        corto: "BX",
        general: "CAJ",
      },
      {
        nombre: "BOTELLAS",
        corto: "BO",
        general: "BOT",
      },
      {
        nombre: "LITRO",
        corto: "LTR",
        general: "LT",
      },
      {
        nombre: "GALON",
        corto: "GLI",
        general: "GAL",
      },
      {
        nombre: "BIDON",
        corto: "NIU",
        general: "BID",
      },
      {
        nombre: "PLANCHA",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "CIENTO",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "FARDOS",
        corto: "NIU",
        general: "FAR",
      },
      {
        nombre: "DIAS",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "FRASCO",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "DISPLAY",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "TIRA",
        corto: "NIU",
        general: "UND",
      },
      {
        nombre: "SACO",
        corto: "BG",
        general: "SAC",
      },
    ],
    emisores: [
      "SUCAMEC",
      "DIGEMID",
      "DIGESA",
      "SENASA",
      "SERFOR",
      "MTC",
      "PRODUCE",
      "MIN. AMBIENTE",
      "SANIPES",
      "MML",
      "MINSA",
      "GR",
    ],
    motivos_guia: [
      "VENTA",
      "VENTA SUJETA A CONFIRMACION DEL COMPRADOR",
      "COMPRA",
      "TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA",
      "IMPORTACION",
      "TRASLADO EMISOR ITINERANTE CP",
      "EXPORTACION",
      "TRASLADO A ZONA PRIMARIA",
      "OTROS",
    ],
    motivosSunat_guia: [
      {
        nombre: "VENTA",
        codigo: "01",
      },
      {
        nombre: "VENTA SUJETA A CONFIRMACION DEL COMPRADOR",
        codigo: "14",
      },
      {
        nombre: "COMPRA",
        codigo: "02",
      },
      {
        nombre: "TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA",
        codigo: "04",
      },
      {
        nombre: "TRASLADO EMISOR ITINERANTE CP",
        codigo: "18",
      },
      {
        nombre: "IMPORTACION",
        codigo: "08",
      },
      {
        nombre: "EXPORTACION",
        codigo: "09",
      },
      {
        nombre: "TRASLADO A ZONA PRIMARIA",
        codigo: "19",
      },
      {
        nombre: "OTROS",
        codigo: "13",
      },
    ],

    motivosSunat: [
      {
        nombre: "Anulación de la operación",
        codigo: "01",
      },
      {
        nombre: "Anulación por error en el RUC",
        codigo: "02",
      },
      {
        nombre: "Corrección por error en la descripción",
        codigo: "03",
      },
      {
        nombre: "Descuento global",
        codigo: "04",
      },
      {
        nombre: "Descuento por ítem",
        codigo: "05",
      },
      {
        nombre: "Devolución total",
        codigo: "06",
      },
      {
        nombre: "Devolución por ítem",
        codigo: "07",
      },
      {
        nombre: "Bonificación",
        codigo: "08",
      },
      {
        nombre: "Disminución en el valor",
        codigo: "09",
      },
      {
        nombre: "Otros Conceptos",
        codigo: "10",
      },
    ],
    detracciones: [
      { cod: "000", nom: "Sin Detraccion", porcentaje: "0" },
      { cod: "019", nom: "Arrendamiento de Bienes", porcentaje: "10" },
      { cod: "021", nom: "Movimiento de carga", porcentaje: "10" },
      { cod: "022", nom: "Otros servicios empresariales", porcentaje: "12" },
      {
        cod: "026",
        nom: "Servicio de transporte de personas",
        porcentaje: "10",
      },
      {
        cod: "037",
        nom: "Demas Servicios gravados con el IGV",
        porcentaje: "12",
      },
    ],
    operacion: [
      { cod: "0101", nom: "Venta lnterna" },
      { cod: "0102", nom: "Exportacion Servicios" },
    ],
    emision: [],
    dia_filt: ["lun", "mar", "mie", "jue", "vie", "sab", "dom"],
    cliente_selecto: [],
    ubicacion_actual: null,
    zonas: [],
    bonos: [],
    clientessearch: [],
    lista_productos: [],
    tipo_cambio: null,
  },
  mutations: {
    tipo_cambio(state, n) {
      state.tipo_cambio = n;
    },
    lista_productos(state, n) {
      state.lista_productos = n;
    },
    bonos(state, n) {
      state.bonos = n;
    },
    setUbicacionActual(state, ubicacion) {
      state.ubicacion_actual = ubicacion;
    },
    cliente_selecto(state, n) {
      state.cliente_selecto = n;
    },
    BD(state, n) {
      state.baseDatos = n;
      console.log("STORE: " + n.bd);
    },
    zonas(state, n) {
      state.zonas = n;
    },
    array_guia(state, n) {
      state.array_guia = n;
    },
    array_sedes(state, n) {
      state.array_sedes = n;
    },
    sedeActual(state, n) {
      state.sedeActual = n;
    },
    emision(state, n) {
      state.emision = n;
    },
    esmovil(state, n) {
      state.esmovil = n;
    },
    permisos(state, n) {
      state.permisos = n;
    },
    configuracion(state, n) {
      state.configuracion = n;
    },
    productos(state, n) {
      state.productos = n;
    },
    clientes(state, n) {
      state.clientes = n;
    },
    SET_CLIENTESSEARCH(state, arr) {
      // Reemplaza el array para asegurar reactividad
      state.clientessearch = Array.isArray(arr) ? arr.slice() : []
    },
    SET_UNSUB(state, fn) {
      state._unsubClientes = fn || null
    },
    CLEAR_CLIENTESSEARCH(state) {
      state.clientessearch = []
    },
    categorias(state, n) {
      state.categorias = n;
    },
    configImpresora(state, n) {
      state.configImpresora = n;
    },
    seriesdocumentos(state, n) {
      state.seriesdocumentos = n;
    },
    productos_caja(state, n) {
      state.productos_caja = n;
    },
    modopago_caja(state, n) {
      state.modopago_caja = n;
    },
    cabecera_caja(state, n) {
      state.cabecera_caja = n;
    },
    serv_imp(state, n) {
      state.serv_imp = n;
    },
    set_medidas(state, n) {
      state.medidassunat = n;
    },
    dialogocontadores(state) {
      state.dialogocontadores = !state.dialogocontadores;
    },
    dialogomedidas(state) {
      state.dialogomedidas = !state.dialogomedidas;
    },
    dialogoFecha(state) {
      state.dialogoFecha = !state.dialogoFecha;
    },
    dialogomodopago(state) {
      state.dialogomodopago = !state.dialogomodopago;
    },
    dialogoFecha2(state) {
      state.dialogoFecha2 = !state.dialogoFecha2;
    },
    dialogoFecha3(state) {
      state.dialogoFecha3 = !state.dialogoFecha3;
    },
    dialogoConfiguracion(state) {
      state.dialogoConfiguracion = !state.dialogoConfiguracion;
    },
    dialogoToken(state) {
      state.dialogoToken = !state.dialogoToken;
    },
    dialogoAgregaExcel(state) {
      state.dialogoAgregaExcel = !state.dialogoAgregaExcel;
    },
    dialogoLogoEmpresa(state) {
      state.dialogoLogoEmpresa = !state.dialogoLogoEmpresa;
    },
    dialogoImpresora(state) {
      state.dialogoImpresora = !state.dialogoImpresora;
    },
    dialogoProducto(state) {
      state.dialogoProducto = !state.dialogoProducto;
    },
    dialogoSerieDocumentos(state) {
      state.dialogoSerieDocumentos = !state.dialogoSerieDocumentos;
    },
    dialogoiconos(state, n) {
      state.dialogoiconos = !state.dialogoiconos;
      state.tipodialogoicono = n;
    },
    dialogoproductos(state, n) {
      state.dialogoproductos = n;
    },
    dialogoproductosv2(state, n) {
      state.dialogoproductosv2 = n;
    },
    dialogoPredefinidos(state) {
      state.dialogoPredefinidos = !state.dialogoPredefinidos;
    },
    dialogo_moneda(state) {
      state.dialogo_moneda = !state.dialogo_moneda;
    },
    dialogo_configcatalogo(state) {
      state.dialogo_configcatalogo = !state.dialogo_configcatalogo;
    },
    dialogo_guia(state) {
      state.dialogo_guia = !state.dialogo_guia;
    },
    dialogoentrada(state) {
      state.dialogoentrada = !state.dialogoentrada;
    },
    dialogosalidas(state) {
      state.dialogosalidas = !state.dialogosalidas;
    },
    dialogoproforma(state) {
      state.dialogoproforma = !state.dialogoproforma;
    },
    dialogocompras(state) {
      state.dialogocompras = !state.dialogocompras;
    },
    dialogo_cobrar(state) {
      state.dialogo_cobrar = !state.dialogo_cobrar;
    },
    completa_cobro(state, n) {
      state.completa_cobro = !state.completa_cobro;
    },
    iconoselecto(state, n) {
      state.iconoselecto = n;
    },
    token(state, n) {
      state.token = n;
    },
    modopagos(state, n) {
      state.modopagos = n;
    },
    bancos(state, n) {
      state.bancos = n;
    },
    empresaselecta(state, n) {
      state.empresaselecta = n;
    },
    dialogomensaje(state) {
      state.dialogomensaje = !state.dialogomensaje;
    },
    dialogoAlerta(state) {
      state.dialogoAlerta = !state.dialogoAlerta;
    },
    arraynotifica(state, n) {
      state.arraynotifica = n;
    },
    dialogoprogress(state) {
      state.dialogoprogress = !state.dialogoprogress;
    },
    dialogosnackbar(state, n) {
      state.dialogosnackbar = !state.dialogosnackbar;
      state.textosnackbar = n;
    },
    dialogoinsumo(state) {
      state.dialogoinsumo = !state.dialogoinsumo;
    },
    dialogobancos(state) {
      state.dialogobancos = !state.dialogobancos;
    },
    dialogohost(state) {
      state.dialogohost = !state.dialogohost;
    },
    logoempresa(state, n) {
      state.logoempresa = n;
    },
    dialogoclientes(state) {
      state.dialogoclientes = !state.dialogoclientes;
    },
    dialogoClientesnuevos(state) {
      state.dialogoClientesnuevos = !state.dialogoClientesnuevos;
    },
    dialogo_caja(state) {
      state.dialogo_caja = !state.dialogo_caja;
    },
    productos_consolida(state, n) {
      state.productos_consolida = n;
    },
    ultimo_correlativo(state, n) {
      state.ultimo_correlativo = n;
    },
    dialogoNota(state) {
      state.dialogoNota = !state.dialogoNota;
    },
    data_caja(state, n) {
      state.data_caja = n;
    },
    data_caja_cabecera(state, n) {
      state.data_caja_cabecera = n;
    },
    setOrigenPedido(state, origen) {
        state.origen_pedido_nuevo = origen;
    },
    
    clearOrigenPedido(state) {
        state.origen_pedido_nuevo = null;
    },
  },
  actions: {
    setOrigenPedido({ commit }, origen) {
        commit('setOrigenPedido', origen);
    },
    
    clearOrigenPedido({ commit }) {
        commit('clearOrigenPedido');
    },
    async busca_cliente({ commit }, { documento, numero }) {
      try {
        var cliente = store.state.clientes.find(
          (id) => String(id.documento) === String(numero)
        );
        if (Boolean(cliente)) {
          console.log("cliente encontrado", cliente);
          return {
            nombre: cliente.nombre,
            direccion: cliente.direccion || "",
          };
        } else {
          const token =
            "80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d";

          const response = await axios.get(
            `https://apiperu.dev/api/${documento.toLowerCase()}/${numero}`,
            {
              headers: {
                Content_Type: "application/json",
                authorization: `Bearer ${token}`,
              },
            }
          );
          console.log(response.data.success)
          var cliente = "";
          if (response.data.success) {
            cliente = response.data.data;
            var array = {
              activo: true,
              id: numero,
              tipodoc: documento,
              documento: numero,
              nombre: cliente.nombre_completo || cliente.nombre_o_razon_social,
              correo: "",
              departamento:
                cliente.departamento || store.state.baseDatos.departamento,
              provincia: cliente.provincia || store.state.baseDatos.provincia,
              distrito: cliente.distrito || store.state.baseDatos.distrito,
              ubigeo: cliente.ubigeo_sunat || store.state.baseDatos.ubigeo,
              direccion: cliente.direccion || "",
              telefono: "",
              nota: "agregado automaticamente",
              referencia: "",
              sede: store.state.baseDatos.bd || "",
              dia: moment().locale('es').format('ddd').normalize('NFD')                                             // separa tildes
                .replace(/[\u0300-\u036f]/g, '')                              // quita tildes
                .replace(/\./g, '')                                           // quita el punto final
                .toLowerCase()
            };
    
          }

          return {
            nombre:
              cliente.nombre_completo || cliente.nombre_o_razon_social || null,
            direccion: cliente.direccion || "",
            departamento:
              cliente.departamento || store.state.baseDatos.departamento,
            distrito: cliente.distrito || store.state.baseDatos.distrito,
            provincia: cliente.provincia || store.state.baseDatos.provincia,
            ubigeo: cliente.ubigeo_sunat || store.state.baseDatos.ubigeo,
          };
        }
      } catch (error) {
        console.error("Error al consultar la API:", error.message);
        throw new Error("Error al obtener datos del cliente.");
      }
    },
    async consultaApiPeru({ commit }, { documento, numero }) {
      try {
        const token =
          "80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d";
        const response = await axios.get(
          `https://apiperu.dev/api/${documento.toLowerCase()}/${numero}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
            timeout: 6000,
          }
        );

        const data = response?.data?.data || {};
        if (
          response?.data?.success &&
          (data.nombre_completo || data.nombre_o_razon_social)
        ) {
          return {
            nombre: data.nombre_completo || data.nombre_o_razon_social || "",
            direccion: data.direccion || "",
            departamento:
              data.departamento || store.state.baseDatos.departamento,
            provincia: data.provincia || store.state.baseDatos.provincia,
            distrito: data.distrito || store.state.baseDatos.distrito,
            ubigeo: data.ubigeo_sunat || store.state.baseDatos.ubigeo,
          };
        } else {
          // Si no hay éxito o no hay datos útiles
          return {
            nombre: "",
            direccion: "",
            departamento: store.state.baseDatos.departamento,
            provincia: store.state.baseDatos.provincia,
            distrito: store.state.baseDatos.distrito,
            ubigeo: store.state.baseDatos.ubigeo,
          };
        }
      } catch (error) {
        console.error("Error al consultar API Perú:", error.message || error);
        return {
          nombre: "",
          direccion: "",
          departamento: store.state.baseDatos.departamento,
          provincia: store.state.baseDatos.provincia,
          distrito: store.state.baseDatos.distrito,
          ubigeo: store.state.baseDatos.ubigeo,
        };
      }
    },
  },
  modules: {},
  getters: {
    ubicacionActual: (state) => state.ubicacion_actual,
  },
  plugins: [
    createPersistedState({
      key: "domotica-system:v1",
      paths: [
        "permisos",
        "baseDatos",
        "sedeActual",
        "configuracion",
        "seriesdocumentos",
        "modopagos",
        "bancos",
        "configImpresora",
        "categorias",
        "zona",
        "cliente_selecto",
        "array_sedes",
        "lista_productos"
      ],
    }),
  ],

});
