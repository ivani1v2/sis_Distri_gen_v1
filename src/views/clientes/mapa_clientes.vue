<template>
    <v-dialog v-model="dialogoMapaClientes" max-width="1100px" persistent>
        <v-card>
            <v-card-title>
                <v-icon left color="blue">mdi-map-marker-multiple</v-icon>
                Mapa de Clientes
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar">
                    <v-icon color="red">mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text style="position:relative; padding:0;">
                <div style="height:500px; width:100%; position:relative;">
                    <GmapMap ref="mapa" :center="centro" :zoom="zoom" style="width: 100%; height: 500px"
                        :options="mapOptions">
                        <!-- Mi ubicación -->
                        <GmapMarker v-if="miPos" :position="miPos" :title="'Mi ubicación'" :icon="iconoAzul" />
                        <GmapCircle v-if="miPos && precision" :center="miPos" :radius="precision" :options="{
                            strokeColor: '#1e88e5',
                            strokeOpacity: 0.7,
                            strokeWeight: 1,
                            fillColor: '#1e88e5',
                            fillOpacity: 0.12,
                            clickable: false,
                            editable: false,
                            draggable: false
                        }" />

                        <!-- Clientes -->
                        <GmapMarker v-for="cliente in clientesConUbicacion" :key="cliente.id"
                            :position="{ lat: Number(cliente.latitud), lng: Number(cliente.longitud) }"
                            :title="cliente.nombre" @click="mostrarInfo(cliente)" />

                        <GmapInfoWindow v-if="clienteSeleccionado"
                            :position="{ lat: Number(clienteSeleccionado.latitud), lng: Number(clienteSeleccionado.longitud) }"
                            @closeclick="clienteSeleccionado = null">
                            <div>
                                <strong>{{ clienteSeleccionado.nombre }}</strong><br />
                                <small>{{ clienteSeleccionado.direccion }}</small>
                            </div>
                        </GmapInfoWindow>
                    </GmapMap>

                    <v-btn fab small color="info" class="fab-ubicarme" @click="ubicarme" title="Ir a mi ubicación">
                        <v-icon>mdi-crosshairs-gps</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "mapa_clientes",
    props: {
        value: Boolean, // para v-model del dialogo
        clientes: { type: Array, required: true }
    },
    data() {
        return {
            dialogoMapaClientes: false,
            centro: { lat: -9.19, lng: -75.0152 }, // Perú
            zoom: 6,
            clienteSeleccionado: null,
            mapOptions: {
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
                gestureHandling: 'greedy',
                styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                    { featureType: "administrative", stylers: [{ visibility: "off" }] },
                    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
                ]
            },
            miPos: null,          // { lat, lng } de mi ubicación
            precision: null,      // en metros (accuracy)
            iconoAzul: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', // <- HTTPS
        };
    },
    computed: {
        clientesConUbicacion() {
            return this.clientes.filter(
                c => c.latitud && c.longitud && !isNaN(Number(c.latitud)) && !isNaN(Number(c.longitud))
            );
        },
        // <-- AHORA ES computed (antes lo tenías en methods)
        ubicacionActual() {
            const u = (this.$store && this.$store.state && this.$store.state.ubicacion_actual) || null;
            if (!u) return null;
            const lat = Number(u.lat), lng = Number(u.lng);
            return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng, timestamp: u.timestamp || null } : null;
        }
    },
    watch: {
        value(val) {
            this.dialogoMapaClientes = val;
            if (val) this.centrarEnUsuario();
        },
        dialogoMapaClientes(val) {
            this.$emit('input', val);
        },
        // observa cambios en la ubicación del store

    },
    created() {
        // Si ya hay ubicación en el store, el watcher con immediate: true centrará.
        // Si no, no hacemos nada aquí (el botón "ubicarme" o abrir el diálogo lo resolverán).
    },
    methods: {
        _setMiPos(latlng, accuracy, zoom) {
            this.miPos = latlng;
            this.precision = Number.isFinite(accuracy) ? accuracy : null;
            this.clienteSeleccionado = null;

            this.centro = { ...latlng };
            this.zoom = zoom;

            if (this.$refs.mapa && this.$refs.mapa.$mapPromise) {
                this.$refs.mapa.$mapPromise.then((map) => {
                    map.panTo(latlng);
                    map.setZoom(zoom);
                });
            }
        },

        // Prioriza store.state.ubicacion_actual
        centrarDesdeStore() {
            if (this.ubicacionActual) {
                this._setMiPos({ lat: this.ubicacionActual.lat, lng: this.ubicacionActual.lng }, null, 15);
                return true;
            }
            return false;
        },

        // Botón azul: usa store; si no hay, intenta geolocalización; si no, Lima
        ubicarme() {
            if (this.centrarDesdeStore()) return;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude, longitude, accuracy } = pos.coords || {};
                        this._setMiPos({ lat: latitude, lng: longitude }, accuracy, 15);
                    },
                    () => {
                        this._setMiPos({ lat: -12.0464, lng: -77.0428 }, null, 13);
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
                );
            } else {
                this._setMiPos({ lat: -12.0464, lng: -77.0428 }, null, 13);
            }
        },

        // Al abrir el diálogo: intenta store; si no, centra “alejado” con geo o Lima
        centrarEnUsuario() {
            if (this.centrarDesdeStore()) return;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        this.centro = { lat: pos.coords.latitude, lng: pos.coords.longitude };
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
            this.clienteSeleccionado = null;
        },

        mostrarInfo(cliente) {
            this.clienteSeleccionado = cliente;
            this.centro = { lat: Number(cliente.latitud), lng: Number(cliente.longitud) };
            this.zoom = 16;
            if (this.$refs.mapa && this.$refs.mapa.$mapPromise) {
                this.$refs.mapa.$mapPromise.then((map) => {
                    map.panTo(this.centro);
                    map.setZoom(16);
                });
            }
        },

        cerrar() {
            this.dialogoMapaClientes = false;
        }
    }
};
</script>

<style scoped>
.fab-ubicarme {
    position: absolute;
    bottom: 22px;
    right: 22px;
    z-index: 3020;
}
</style>
