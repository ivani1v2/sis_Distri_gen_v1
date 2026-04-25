// vue.config.js
module.exports = {
  transpileDependencies: ["vuetify"],

  pwa: {
    name: "Domotica Sistema",
    themeColor: "#000000",
    msTileColor: "#000000",

    // Rutas de íconos (ajústalas a tu estructura /img/icons)
    iconPaths: {
      favicon32: "favicon.png",
      favicon16: "favicon.png",
      appleTouchIcon: "favicon.png",
      maskIcon: "img/icons/safari-pinned-tab.svg",
      msTileImage: "favicon.png",
    },

    // Manifest (puedes ampliar más tamaños si quieres)
    manifestOptions: {
      short_name: "Domotica",
      start_url: "/?source=pwa",
      display: "standalone",
      background_color: "#ffffff",
      icons: [
        { src: "/favicon.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      screenshots: [
        { src: "/img/screenshots/screenshot1.png", sizes: "640x480", type: "image/png", form_factor: "wide" },
        { src: "/img/screenshots/screenshot2.png", sizes: "340x480", type: "image/png", form_factor: "narrow" },
      ],
    },

    // El SW se actualiza y toma control automáticamente
    registerType: "autoUpdate",

    // GenerateSW con reglas de cache en tiempo de ejecución
    workboxOptions: {
      skipWaiting: true,      // instala el SW nuevo sin esperar
      clientsClaim: true,     // toma control de las pestañas abiertas
      navigateFallback: "/index.html",

      runtimeCaching: [
        // 📦 Imágenes (cache-first con expiración)
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "img-v1",
            expiration: {
              maxEntries: 120,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
            },
          },
        },

        // 🔤 Fuentes locales (mdi, roboto) - cache-first
        {
          urlPattern: /\.(?:woff2?|ttf|otf)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "fonts-v1",
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
            },
          },
        },

        // 🔤 Google Fonts CSS/archivos
        {
          urlPattern: ({ url }) =>
            url.origin === "https://fonts.googleapis.com" ||
            url.origin === "https://fonts.gstatic.com",
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts",
            cacheableResponse: { statuses: [0, 200] },
          },
        },

        // 🗂️ APIs semiestáticas (catálogos, parámetros, combos)
        {
          urlPattern: ({ url }) =>
            url.pathname.startsWith("/api/catalogos") ||
            url.pathname.startsWith("/api/parametros"),
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "api-catalogos-v1",
            cacheableResponse: { statuses: [0, 200] },
          },
        },

        // 🔄 APIs muy dinámicas (ventas del día, rutas del vendedor)
        {
          urlPattern: ({ url }) =>
            url.pathname.startsWith("/api/ventas") ||
            url.pathname.startsWith("/api/rutas"),
          handler: "NetworkFirst",
          options: {
            cacheName: "api-dinamica-v1",
            networkTimeoutSeconds: 3, // si la red demora, usa caché
            cacheableResponse: { statuses: [0, 200] },
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24, // 1 día
            },
          },
        },

        // (Opcional) cualquier otro GET JSON estático de tu dominio
        // {
        //   urlPattern: ({ request, url }) =>
        //     request.destination === "" &&
        //     url.origin === self.location.origin &&
        //     url.pathname.startsWith("/api/estatico"),
        //   handler: "StaleWhileRevalidate",
        //   options: { cacheName: "api-estatica-v1" },
        // },
      ],
    },
  },
};
