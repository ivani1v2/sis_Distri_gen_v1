<template>
    <v-app>
        <v-container grid-list-xs>
            <barrasuperior />
        </v-container>

        <router-view class="mt-6" />

        <v-snackbar v-model="updateAvailable" color="primary" timeout="-1" top elevation="10">
            Nueva versión disponible.
            <v-btn text color="white" @click="refreshApp">Actualizar</v-btn>
        </v-snackbar>

        <v-footer dark padless absolute>
            <v-card class="flex" flat tile>
                <v-card-text class="py-2 white--text text-center">
                    {{ new Date().getFullYear() }} — <strong>Domotica Inc..</strong>
                </v-card-text>
            </v-card>
        </v-footer>
    </v-app>
</template>

<script>
import barrasuperior from "@/components/barrasuperior.vue";
import {
    nuevoCampoUsuario,
} from './db'
import store from '@/store'

export default {
    name: "App",
    components: {
        barrasuperior,
    },
    data() {
        return {
            updateAvailable: false,
            registration: null,
            watchId: null,
            ultimaUbicacion: null,
            dialogoUbicacion: false,
            _lastFixAt: 0,
            _minMsBetweenFixes: 5000,
        };
    },
    computed: {
        minMeters() {
            return this.$store.state.configuracion?.movimiento_minimo_metros || 15;
        },
        maxGpsAccuracy() {
            return this.$store.state.configuracion?.precision_gps_maxima || 100;
        }
    },
    created() {
        this.iniciarRastreoGps();
    },
    mounted() {
        window.addEventListener("swUpdated", (event) => {
            this.registration = event.detail;
            this.updateAvailable = true;
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && !this.watchId) {
                this.iniciarRastreoGps();
            }
        });
    },
    beforeDestroy() {
        this.detenerRastreoGps();
    },
    methods: {
        refreshApp() {
            window.location.reload();
            if (this.registration && this.registration.waiting) {
                this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
            }
        },
        detenerRastreoGps() {
            if (this.watchId !== null) {
                navigator.geolocation.clearWatch(this.watchId);
                this.watchId = null;
            }
        },
        async iniciarRastreoGps() {
            if (!("geolocation" in navigator)) {
                console.warn("Geolocalización no disponible");
                return;
            }

            try {
                const pos = await this._getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 20000,
                });
                this._procesarFix(pos);
            } catch (err) {
                console.warn("Primer fix falló:", err.message || err);
            }

            this._startWatch({
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 15000,
            });
        },
        _startWatch(opts) {
            this.detenerRastreoGps();

            const onSuccess = (pos) => this._procesarFix(pos);
            const onError = (err) => {
                console.error("watchPosition error:", err.message, err);
                if (err.code === 3) {
                    setTimeout(() => {
                        this._startWatch({
                            enableHighAccuracy: true,
                            timeout: 25000,
                            maximumAge: 30000,
                        });
                    }, 1000);
                } else if (err.code === 1) {
                    this.dialogoUbicacion = true;
                } else {
                    setTimeout(() => {
                        this._startWatch(opts);
                    }, 2000);
                }
            };

            this.watchId = navigator.geolocation.watchPosition(onSuccess, onError, opts);
        },
        _procesarFix(pos) {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            const now = Date.now();

            if (accuracy > this.maxGpsAccuracy) return;

            if (now - this._lastFixAt < this._minMsBetweenFixes) return;

            if (this.ultimaUbicacion) {
                const dist = this.calcularDistancia(
                    this.ultimaUbicacion.lat,
                    this.ultimaUbicacion.lng,
                    lat,
                    lng
                );
                if (dist < this.minMeters) return;
            }

            const nuevaUbicacion = { lat, lng, timestamp: now, accuracy };
            if (this.$store.state.permisos.gps_activo) {
                nuevoCampoUsuario(this.$store.state.permisos.token, 'ubicacion', nuevaUbicacion);
            }
            this.$store.commit("setUbicacionActual", nuevaUbicacion);
            this.ultimaUbicacion = nuevaUbicacion;
            this._lastFixAt = now;
        },
        _getCurrentPosition(options) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        },
        calcularDistancia(lat1, lon1, lat2, lon2) {
            const R = 6371e3;
            const toRad = (deg) => (deg * Math.PI) / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        },
    }
};
</script>