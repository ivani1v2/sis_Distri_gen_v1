<template>
    <div class="pa-6">
        <!-- Barra superior de filtros -->
        <v-row dense>
            <v-col cols="4">
                <v-select v-model="sede_actual" :items="$store.state.array_sedes" item-text="nombre" item-value="codigo"
                    label="Sede" outlined dense @change="actualizar" />
            </v-col>

            <v-col cols="3">
                <v-text-field outlined dense type="date" v-model="dateInicio" label="Fecha" @change="actualizar" />
            </v-col>

            <v-col cols="3">
                
            </v-col>

            <v-col cols="2" class="text-right">
                <v-btn color="primary" @click="actualizar" small :loading="loading">
                    <v-icon left>mdi-refresh</v-icon>Actualizar
                </v-btn>
            </v-col>
        </v-row>

        <!-- Mensaje de error -->
        <v-alert v-if="errorMsg" type="error" dense outlined class="mb-2">
            {{ errorMsg }}
        </v-alert>

        <!-- Mapa -->
        <div style="position:relative; width:95vw; height:calc(100vh - 130px);">
            <GmapMap ref="mapa" :center="centro" :zoom="zoom" style="width: 95vw; height: 95%;" :options="mapOptions">
                <GmapMarker v-for="(venta, idx) in ventasFiltradas" :key="venta.id"
                    :position="{ lat: Number(venta.lat), lng: Number(venta.lng) }"
                    :title="`Venta #${idx + 1} - ${venta.cliente}`" :icon="markerNumeroSVG(idx + 1)"
                    @click="mostrarInfo(venta, idx)" />

                <!-- Ventana breve (opcional) al pinchar: puedes dejar sólo el diálogo -->
                <GmapInfoWindow v-if="ventaSeleccionada && mostrarInfoWindow"
                    :position="{ lat: Number(ventaSeleccionada.lat), lng: Number(ventaSeleccionada.lng) }"
                    @closeclick="mostrarInfoWindow = false">
                    <div style="min-width:200px">
                        <strong>{{ ventaSeleccionada.cliente }}</strong><br>
                        <span v-if="ventaSeleccionada.direccion">
                            <v-icon left small color="grey">mdi-map-marker</v-icon>
                            {{ ventaSeleccionada.direccion }}<br>
                        </span>
                        <div>
                            <v-icon left small color="amber">mdi-cash</v-icon>
                            S/. {{ ventaSeleccionada.totalNum.toFixed(2) }}
                        </div>
                        <div v-if="ventaSeleccionada.fecha">
                            <v-icon left small color="blue">mdi-calendar</v-icon>
                            {{ formateaFecha(ventaSeleccionada.fecha) }}
                        </div>
                    </div>
                </GmapInfoWindow>
            </GmapMap>

            <!-- Botón "ubicarme" -->
            <v-btn fab small color="info" class="fab-ubicarme" @click="ubicarme" :title="'Ir a mi ubicación'">
                <v-icon>mdi-crosshairs-gps</v-icon>
            </v-btn>
        </div>

        <!-- Diálogo con detalle -->
        <v-dialog v-model="dialogDetalle" max-width="480px">
            <v-card>
                <v-card-title class="headline">
                    Detalle de la venta
                    <v-spacer />
                    <v-btn icon @click="dialogDetalle = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-card-title>

                <v-card-text v-if="ventaSeleccionada">
                    <div class="mb-2">
                        <strong>Cliente:</strong> {{ ventaSeleccionada.cliente }}
                    </div>
                    <div class="mb-2" v-if="ventaSeleccionada.numeracion">
                        <strong>Comprobante:</strong> {{ ventaSeleccionada.numeracion }}
                    </div>
                    <div class="mb-2">
                        <strong>Monto:</strong> S/. {{ ventaSeleccionada.totalNum.toFixed(2) }}
                    </div>
                    <div class="mb-2" v-if="ventaSeleccionada.forma_pago">
                        <strong>Forma de pago:</strong> {{ ventaSeleccionada.forma_pago }}
                    </div>
                    <div class="mb-2" v-if="ventaSeleccionada.modopago && ventaSeleccionada.modopago.length">
                        <strong>Detalle pago:</strong>
                        <ul class="mb-0">
                            <li v-for="(m, i) in ventaSeleccionada.modopago" :key="i" v-if="toNumberSafe(m.monto) > 0">
                                {{ m.nombre }}: S/. {{ toNumberSafe(m.monto).toFixed(2) }}
                            </li>
                        </ul>
                    </div>
                    <div class="mb-2" v-if="ventaSeleccionada.fecha">
                        <strong>Fecha y hora:</strong> {{ formateaFecha(ventaSeleccionada.fecha) }}
                    </div>
                    <div class="mb-2" v-if="ventaSeleccionada.direccion">
                        <strong>Dirección:</strong> {{ ventaSeleccionada.direccion }}
                    </div>
                    <div class="mb-2">
                        <strong>Ubicación:</strong>
                        {{ Number(ventaSeleccionada.lat).toFixed(6) }},
                        {{ Number(ventaSeleccionada.lng).toFixed(6) }}
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn color="primary" text @click="dialogDetalle = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import store from "@/store/index";
import moment from "moment";
import { allCabecera_general } from "../../db";

export default {
    name: "mapa_ventas",
    data() {
        const hoy = moment().format("YYYY-MM-DD");
        const primerDiaMes = moment().startOf("month").format("YYYY-MM-DD");
        return {
            sede_actual: "",
            dateInicio: hoy,
            dateFin: hoy,
            ventas: [],
            loading: false,
            errorMsg: "",
            // selección / UI
            ventasFiltradas: [],
            ventaSeleccionada: null,
            dialogDetalle: false,
            mostrarInfoWindow: false,
            // mapa
            centro: { lat: -9.189967, lng: -75.015152 }, // Centro de Perú
            zoom: 6,
            mapOptions: {
                disableDefaultUI: true,
                zoomControl: true,
                scrollwheel: true,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
                ]
            }
        };
    },
    mounted() {
        this.obtenerVentas();
        this.centrarEnUsuario();
    },
    methods: {
        // ---------- Utils ----------
        toNumberSafe(v, def = 0) {
            const n = Number(v);
            return Number.isFinite(n) ? n : def;
        },
        formateaFecha(fecha) {
            if (!fecha) return "";
            return moment.unix(fecha).format("DD/MM/YYYY HH:mm");
        },
        markerNumeroSVG(n) {
            // Pin simple con número (SVG Data URL)
            const svg = encodeURIComponent(`
        <svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">
          <g>
            <circle cx="18" cy="18" r="14" stroke="black" stroke-width="1" fill="#3f51b5"/>
            <text x="18" y="22" font-size="14" font-family="Arial" fill="white" text-anchor="middle">${n}</text>
          </g>
        </svg>
      `);
            return `data:image/svg+xml;charset=UTF-8,${svg}`;
        },

        // ---------- Normalización ----------
        normalizaVenta(raw) {
            // Origen de lat/lng: prioriza ubicacion.lat/lng y cae a lat/lng raíz
            const lat = raw?.ubicacion?.lat ?? raw?.lat ?? null;
            const lng = raw?.ubicacion?.lng ?? raw?.lng ?? null;

            return {
                id: raw?.id || raw?.numeracion || raw?.documentId || Math.random().toString(36).slice(2),
                cliente: raw?.cliente || "SIN CLIENTE",
                direccion: raw?.direccion || "",
                numeracion: raw?.numeracion || `${raw?.serie || ""}-${raw?.correlativoDocEmitido || ""}`,
                fecha: this.toNumberSafe(raw?.fecha, null),
                forma_pago: raw?.forma_pago || "",
                modopago: Array.isArray(raw?.modopago) ? raw.modopago : [],
                totalNum: this.toNumberSafe(raw?.total, 0),
                lat: this.toNumberSafe(lat, null),
                lng: this.toNumberSafe(lng, null)
            };
        },

        // ---------- Datos ----------
        async obtenerVentas() {
            this.loading = true;
            this.errorMsg = "";
            try {
                if (!this.dateInicio || !this.dateFin) {
                    this.ventas = [];
                    this.ventasFiltradas = [];
                    return;
                }

                const start = moment(this.dateInicio).startOf("day").unix();
                const end = moment(this.dateInicio).endOf("day").unix();

                const ref = allCabecera_general(this.sede_actual);
                const snap = await ref
                    .orderByChild("fecha")
                    .startAt(start)
                    .endAt(end)
                    .once("value");
                if (!snap.exists()) {
                    this.ventas = [];
                    this.ventasFiltradas = [];

                }
                const lista = [];
                snap.forEach((item) => {
                    const data = item.val();
                    // sólo si tiene ubicación válida
                    const hasLat = (data?.ubicacion && data.ubicacion.lat) || data?.lat;
                    const hasLng = (data?.ubicacion && data.ubicacion.lng) || data?.lng;

                    if (hasLat && hasLng) {
                        const venta = this.normalizaVenta({ id: item.key, ...data });
                        if (venta.lat !== null && venta.lng !== null) {
                            lista.push(venta);
                        }
                    }
                });

                // Si vienes de un arreglo ya en this.ventas (como el que pegaste), también lo normalizamos:
                if (Array.isArray(this.ventas) && this.ventas.length && lista.length === 0) {
                    this.ventasFiltradas = this.ventas.map(this.normalizaVenta).filter(v => v.lat !== null && v.lng !== null);
                } else {
                    this.ventas = lista;
                    this.ventasFiltradas = lista;
                }

                // Recentrar si hay ventas
                if (this.ventasFiltradas.length) {
                    const first = this.ventasFiltradas[0];
                    this.centro = { lat: Number(first.lat), lng: Number(first.lng) };
                    this.zoom = 12;
                }
            } catch (err) {
                console.error("Error al obtener ventas:", err);
                this.errorMsg = "No se pudieron cargar las ventas. Intenta nuevamente.";
            } finally {
                this.loading = false;
            }
        },

        actualizar() {
            this.obtenerVentas();
        },

        // ---------- Interacción ----------
        mostrarInfo(venta, idx) {
            this.ventaSeleccionada = venta;
            this.centro = { lat: Number(venta.lat), lng: Number(venta.lng) };
            this.zoom = 16;

            // Muestra InfoWindow breve y también el diálogo con más detalle:
            this.mostrarInfoWindow = true;
            this.dialogDetalle = true;
        },

        ubicarme() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.centro = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        };
                        this.zoom = 15;
                    },
                    () => {
                        // Fallback Lima centro
                        this.centro = { lat: -12.0464, lng: -77.0428 };
                        this.zoom = 13;
                    }
                );
            }
        },

        centrarEnUsuario() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.centro = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        };
                        this.zoom = 13;
                    },
                    () => {
                        this.centro = { lat: -12.0464, lng: -77.0428 };
                        this.zoom = 13;
                    }
                );
            } else {
                this.centro = { lat: -12.0464, lng: -77.0428 };
                this.zoom = 13;
            }
            this.ventaSeleccionada = null;
            this.mostrarInfoWindow = false;
        }
    }
};
</script>

<style scoped>
.fill-window {
    min-height: 100vh !important;
    height: 100vh;
    width: 100vw;
    background: #f4f8fc;
    overflow: hidden;
}

.fab-ubicarme {
    position: absolute;
    bottom: 100px;
    right: 22px;
    z-index: 3020;
}

.fab-fullscreen {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 3020;
}
</style>
