import Vue from "vue";
import "./plugins/fontawesome";
import "./plugins/fontawesome";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";
import { firestorePlugin } from "vuefire";
import firebase from "firebase";
import Croppa from "vue-croppa";
import VueTheMask from "vue-the-mask";
import "./registerServiceWorker";
import * as VueGoogleMaps from "vue2-google-maps";

import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

Vue.use(VueVirtualScroller)
Vue.use(VueTheMask);
Vue.use(Croppa);
Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyAFgkGBAWEkFjWm4ggm74ADhs7iqkVQy5c", // Usa tu propia API key de Google Maps
    libraries: "places", // Necesario si quieres autocompletar
  },
});
Vue.use(firestorePlugin);

Vue.config.productionTip = false;

let app = null;

// 🔗 ADICIÓN (Electron opcional): deep link → navegar por router sin recargar
let pendingTarget = null;
function goToTarget(target) {
  try {
    if (!target) return;
    // Soporta { path, query } o { name, params, query }
    if (target.path) {
      router.push({ path: target.path, query: target.query || {} });
    } else if (target.name) {
      router.push({ name: target.name, params: target.params || {}, query: target.query || {} });
    }
  } catch (e) {
    // No afecta al entorno nube
    console.error("Deep link navigation error:", e);
  }
}

// Escucha mensajes del proceso main SOLO si existe window.deeplink (Electron)
if (window.deeplink && typeof window.deeplink.on === "function") {
  window.deeplink.on((payload) => {
    const user = firebase.auth().currentUser;
    if (user) goToTarget(payload);
    else pendingTarget = payload; // espera login
  });
}
// 🔗 FIN ADICIÓN

firebase.auth().onAuthStateChanged((user) => {
  if (!app) {
    app = new Vue({
      router,
      store,
      vuetify,
      render: (h) => h(App),
    }).$mount("#app");
  }

  // 🔗 ADICIÓN: si llegó un deep link antes de autenticar, navega ahora
  if (user && pendingTarget) {
    goToTarget(pendingTarget);
    pendingTarget = null;
  }
});
