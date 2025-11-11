import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import firebase from "firebase";
import store from "@/store/index";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/panel",
    name: "panel",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/panel.vue"),
    meta: {
      requireAuth: true,
    },
  },
  {
    path: "/miempresa",
    name: "miempresa",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/miempresa.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloempresa) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/soporte",
    name: "soporte",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/soporte.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloempresa) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/lista_pedidos",
    name: "lista_pedidos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/pedidos/lista_pedidos.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.lista_pedidos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/liquida_reparto/:id",
    name: "liquida_reparto",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/pedidos/liquida_reparto.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
   {
    path: "/reparto_transporte",
    name: "reparto_transporte",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reparto/reparto_transporte.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
    {
    path: "/lista_repartos",
    name: "lista_repartos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/reparto/lista_repartos.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/nuevo_pedido",
    name: "nuevo_pedido",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/pedidos/nuevo_pedido.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.visitas) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/caja2",
    name: "caja2",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/ventas/caja2.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },

  {
    path: "/mapa_ventas",
    name: "mapa_ventas",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/ventas/mapa_ventas.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/flujocaja",
    name: "flujocaja",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/ventas/flujocaja.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/reporte_flujos",
    name: "reporte_flujos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/ventas/reporte_flujos.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
   {
    path: "/bonos_globales",
    name: "bonos_globales",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/productos/bonos_globales.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloproductos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/productos",
    name: "productos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/productos/productos.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloproductos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/accesos_usuarios/:id/",
    name: "accesos_usuarios",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/accesos_usuarios.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloempresa) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/transferencia_productos/",
    name: "transferencia_productos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/kardex/transferencia_productos.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulokardex) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/devoluciones/",
    name: "devoluciones",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/kardex/devoluciones.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulokardex) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/rep_mov_producto/",
    name: "rep_mov_producto",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/kardex/rep_mov_producto.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulokardex) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/movimientos_kardex/",
    name: "movimientos_kardex",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/kardex/movimientos_kardex.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulokardex) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/reporte_Guia_t",
    name: "reporte_Guia_t",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/transporte/reporte_Guia_t.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/reporte_Guia",
    name: "reporte_Guia",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/transporte/reporte_Guia.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },


  {
    path: "/gr_movil",
    name: "gr_movil",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/transporte/gr_movil.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/gr_remitente",
    name: "gr_remitente",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/transporte/gr_remitente.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/reporte_proformas",
    name: "reporte_proformas",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/caja/reporte_proformas.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocaja) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/cuentas_cobrar",
    name: "cuentas_cobrar",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/clientes/cuentas_cobrar.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (true) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/clientes",
    name: "clientes",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/clientes/clientes.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloclientes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/empleados",
    name: "empleados",
    // route level code-splitting
    // this generate  s a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/empleados/empleados.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloclientes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/revision",
    name: "revision",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/gestorempresas/revision.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.paneladmin) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/paneladmin",
    name: "paneladmin",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/paneladmin.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.paneladmin) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/panelgeneral",
    name: "panelgeneral",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/gestorempresas/panelgeneral.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.paneladmin) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/gestionEmpresas/:bd",
    name: "gestionEmpresas",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/gestorempresas/gestionEmpresas.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.paneladmin) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/productos_x_sede",
    name: "productos_x_sede",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/productos/productos_x_sede.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloproductos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/comprasClientes/",
    name: "comprasClientes",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/clientes/comprasClientes.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloclientes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/filtro_ventas",
    name: "filtro_ventas",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/filtro_ventas.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocomprobantes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/venta_x_sede",
    name: "venta_x_sede",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/venta_x_sede.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulocomprobantes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/comprobantes",
    name: "comprobantes",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/comprobantes.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.reportes_comprobantes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
    {
    path: "/reporte_stock",
    name: "reporte_stock",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reporte_stock.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloreportes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
    {
    path: "/reg_contables",
    name: "reg_contables",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reg_contables.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloreportes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/reportes",
    name: "reportes",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reportes.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloreportes) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/tesoreria",
    name: "tesoreria",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/tesoreria/tesoreria.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/boletaFactura",
    name: "boletaFactura",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/sunat/boletaFactura.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/nuevaBaja",
    name: "nuevaBaja",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/sunat/nuevaBaja.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/nuevaNCredito",
    name: "nuevaNCredito",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/sunat/nuevaNCredito.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/creditoDebito",
    name: "creditoDebito",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/sunat/creditoDebito.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/resumenbaja",
    name: "resumenbaja",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/sunat/resumenbaja.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/ticket",
    name: "ticket",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/sunat/ticket.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.modulosunat) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/ImportaExporta",
    name: "ImportaExporta",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/ImportaExporta.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloproductos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/tranferenciaProductos",
    name: "tranferenciaProductos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/tranferenciaProductos.vue"
      ),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloproductos) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
  {
    path: "/bajarCartaQR/:id",
    name: "bajarCartaQR",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/vistasLibres/bajarCartaQR.vue"
      ),
  },
  {
    path: "/buscardocumentos",
    name: "buscardocumentos",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/vistasLibres/buscardocumentos.vue"
      ),
  },
  {
    path: "/comprobantes_clientes/:bd/:ruc/:tipodoc/:serie/:correlativo/:cliente",
    name: "comprobantes_clientes",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/vistasLibres/comprobantes_clientes.vue"
      ),
  },
  {
    path: "/gestionUsuarios",
    name: "gestionUsuarios",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/gestionUsuarios.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.moduloempresa) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
   {
    path: "/reporte_x_vendedor",
    name: "reporte_x_vendedor",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reporte_x_vendedor.vue"
      ),
    meta: {
      requireAuth: true,
    },
  },
  {
    path: "/reporteventa",
    name: "reporteVentaDetalle",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reporteVentaDetalle.vue"
      ),
    meta: {
      requireAuth: true,
    },
  },
    {
    path: "/reporte_ventas",
    name: "reporte_ventas",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/reporte_ventas.vue"
      ),
    meta: {
      requireAuth: true,
    },
  },
  {
    path: "/venta_x_pago",
    name: "venta_x_pago",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(
        /* webpackChunkName: "carrito" */ "../views/reportes/venta_x_pago.vue"
      ),
    meta: {
      requireAuth: true,
    },
  },
    {
    path: "/lista",
    name: "lista",
    // route level code-splitting
    // this generates a separate chunk (Produc.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "carrito" */ "../views/pedidos/visitas/lista.vue"),
    meta: {
      requireAuth: true,
    },
    beforeEnter: (to, from, next) => {
      if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
        if (store.state.permisos.visitas) {
          next();
        } else {
          next({
            name: "panel",
          });
        }
      }
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.onReady(() => {
  const lastRoute = localStorage.getItem("lastRoute");

  if (lastRoute && firebase.auth().currentUser) {
    router.replace(lastRoute);
  }
});

router.beforeEach((to, from, next) => {
  const user = firebase.auth().currentUser;

  if (to.fullPath) {
    localStorage.setItem("lastRoute", to.fullPath);
  }
  // Si el usuario está logueado y trata de acceder a "/", redirigirlo al panel
  if (user && to.path === "/") {
    next({ name: "panel" });
  } else if (to.matched.some((ruta) => ruta.meta.requireAuth)) {
    // Si la ruta requiere autenticación y el usuario está logueado, permitir acceso
    if (user) {
      next();
    } else {
      // Si no está logueado, redirigir a Home
      next({ name: "Home" });
    }
  } else {
    // Si la ruta no requiere autenticación, continuar normalmente
    next();
  }
});

export default router;
