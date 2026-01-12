<template>
    <div class="mapa-usuarios-wrapper">
        <v-card class="elevation-6 rounded-lg">
            <v-card-title class="pa-4 pb-2">
                <v-icon left color="blue darken-2">mdi-map-marker-multiple-outline</v-icon>
                <span class="text-h6 font-weight-regular">Ubicación de Usuarios</span>
                <v-spacer></v-spacer>
                <v-chip small :color="usuariosUbicados.length > 0 ? 'success' : 'grey'" text-color="white"
                    class="font-weight-medium">
                    <v-icon left small>mdi-account-group</v-icon>
                    {{ usuariosUbicados.length }} usuarios ubicados
                </v-chip>
            </v-card-title>

            <!-- LEYENDA / LISTA (NUEVA TABLA SIMPLE) -->
            <div class="legend-table pa-2">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 24px;"></th>
                            <th>Usuario</th>
                            <th>Última ubicación</th>
                            <th>Accion</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in usuariosUbicados" :key="item.codigo || item.uid || index">
                            <!-- Color -->
                            <td class="text-center">
                                <v-icon :color="getColorByIndex(item._colorIndex)" small>
                                    mdi-map-marker
                                </v-icon>
                            </td>

                            <!-- Nombre clickable -->
                            <td>
                                <span class="font-weight-medium caption" @click="centrarEnUsuarioSeleccionado(item)"
                                    style="cursor: pointer; color: #1565C0;">
                                    {{ item.nombre || item.codigo || 'Usuario' }}
                                </span>
                            </td>

                            <!-- Última ubicación -->
                            <td class="text-center">
                                <span class="caption text--secondary ">
                                    {{ formatTimestamp(item?.ubicacion?.timestamp) }}
                                </span>
                            </td>

                            <!-- Acciones -->
                            <td class="text-center">
                                <v-icon small color="blue" @click="centrarEnUsuarioSeleccionado(item)"
                                    title="Centrar en el mapa">
                                    mdi-target
                                </v-icon>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>


            <!-- MAPA -->
            <v-card-text style="padding: 0;">
                <div class="mapa-contenedor">
                    <GmapMap ref="gmap" :center="centro" :zoom="14"
                        style="width: 100%; height: 500px; border-radius: 0 0 8px 8px;" :options="mapOptions">
                        <!-- Marcadores de usuarios -->
                        <GmapMarker v-for="(u, idx) in usuariosUbicados" :key="u.token || u.uid || u.codigo || idx"
                            v-show="u.ubicacion && isValidCoord(u.ubicacion.lat, u.ubicacion.lng)" :position="{
                                lat: Number(u.ubicacion.lat),
                                lng: Number(u.ubicacion.lng)
                            }" :icon="iconoPorIndex(u._colorIndex)" :title="u.nombre || u.codigo || 'Usuario'"
                            @click="abreInfoUsuario(u)" />

                        <!-- Mi posición (si quieres usarla más adelante, puedes agregar el marker) -->
                        <!--
            <GmapMarker
              v-if="miPosicion"
              :position="miPosicion"
              :draggable="false"
              :zIndex="999"
              :icon="iconoMiPosicion"
              title="Mi posición"
              @click="abreInfoMiPosicion"
            />
            -->

                        <!-- Info usuario -->
                        <GmapInfoWindow v-if="infoUsuarioAbierto && infoUsuarioPos" :position="infoUsuarioPos"
                            :opened="true" :options="infoOptions" @closeclick="cierraInfoUsuario">
                            <div class="info-usuario">
                                <div class="font-weight-bold primary--text text-capitalize mb-1">
                                    {{ usuarioSeleccionadoNombre }}
                                </div>
                                <div v-if="usuarioSeleccionadoCodigo" class="text-caption text--secondary">
                                    Cód: {{ usuarioSeleccionadoCodigo }}
                                </div>
                                <div v-if="usuarioSeleccionadoEmail" class="text-caption text--secondary">
                                    Email: {{ usuarioSeleccionadoEmail }}
                                </div>
                                <div v-if="usuarioSeleccionado?.ubicacion?.timestamp"
                                    class="text-caption mt-1 text-right blue-grey--text text--lighten-2">
                                    <v-icon x-small>mdi-history</v-icon>
                                    Última ubicación: {{ formatTimestamp(usuarioSeleccionado.ubicacion.timestamp) }}
                                </div>
                            </div>
                        </GmapInfoWindow>
                    </GmapMap>

                    <!-- Overlays de estado -->
                    <div v-if="!usuariosUbicados.length && !mapLoaded" class="overlay-mensaje">
                        <v-progress-circular indeterminate color="blue-grey"></v-progress-circular>
                    </div>
                    <div v-else-if="!usuariosUbicados.length && mapLoaded" class="overlay-mensaje">
                        <v-alert type="info" prominent text>
                            No se encontraron usuarios con ubicación válida.
                        </v-alert>
                    </div>

                    <!-- FABs -->
                    <div class="fab-container">
                        <v-btn fab small color="white" class="mb-3 elevation-6" @click="centrarEnMiPosicion"
                            title="Centrar en mi posición">
                            <v-icon color="info">mdi-crosshairs-gps</v-icon>
                        </v-btn>
                        <v-btn fab small color="primary" class="elevation-6" @click="centrarEnUsuarios"
                            title="Ver todos los usuarios ubicados">
                            <v-icon>mdi-fit-to-screen</v-icon>
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import { gmapApi } from 'vue2-google-maps'
import store from '@/store/index'
import { allUsuarios } from '../../db'
import moment from 'moment'

export default {
    name: 'mapa_usuarios',
    data() {
        return {
            usuariosUbicados: [],
            centro: { lat: -12.0464, lng: -77.0428 },
            miPosicion: null,
            iconoMiPosicion: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
            infoMiPosicion: false,

            infoUsuarioAbierto: false,
            infoUsuarioPos: null,
            usuarioSeleccionado: null,
            mapLoaded: false,

            infoOptions: {
                disableAutoPan: true,
                pixelOffset: null
            },

            mapOptions: {
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy',
                styles: [
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                    {
                        featureType: 'road',
                        elementType: 'labels.icon',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            },

            // Íconos de Google Maps
            iconPalette: [
                'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
                'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png'
            ],

            // Colores Vuetify paralelos a la paleta de iconos
            colorPalette: [
                'red darken-1',
                'green darken-1',
                'amber darken-1',
                'deep-purple darken-1',
                'orange darken-1',
                'pink darken-1',
                'blue-grey darken-1'
            ]
        }
    },
    computed: {
        google: gmapApi,
        ubicacionActual() {
            return store.state.ubicacion_actual || null
        },
        usuarioSeleccionadoNombre() {
            return (
                this.usuarioSeleccionado?.nombre ||
                this.usuarioSeleccionado?.codigo ||
                'Usuario'
            )
        },
        usuarioSeleccionadoCodigo() {
            return this.usuarioSeleccionado?.codigo || ''
        },
        usuarioSeleccionadoEmail() {
            return this.usuarioSeleccionado?.email || this.usuarioSeleccionado?.correo || ''
        }
    },
    created() {
        this.verUbicacionUsuarios()
        this.inicializarMiPosicion()

        this.$gmapApiPromiseLazy().then(() => {
            if (!window.google) return
            const offset = new window.google.maps.Size(0, -35)
            this.infoOptions = { ...this.infoOptions, pixelOffset: offset }
            this.mapLoaded = true
        })
    },
    methods: {
        formatTimestamp(ts) {
            if (!ts) return 'N/A'
            const timestampMs = String(ts).length === 10 ? ts * 1000 : ts
            return moment(timestampMs).format('HH:mm:ss DD/MMM')
        },

        verUbicacionUsuarios() {
            allUsuarios()
                .orderByChild('ruc')
                .equalTo(Number(store.state.baseDatos.ruc_asociado))
                .on('value', snapshot => {
                    const usuarios = []
                    snapshot.forEach(childSnapshot => {
                        const usuario = childSnapshot.val()

                        if (
                            usuario.ubicacion &&
                            this.isValidCoord(usuario.ubicacion.lat, usuario.ubicacion.lng)
                        ) {
                            // asignar índice de color estable por orden de carga
                            usuario._colorIndex = usuarios.length
                            usuarios.push(usuario)
                        }
                    })
                    this.usuariosUbicados = usuarios
                    this.recalcularCentro()
                })
        },

        inicializarMiPosicion() {
            const ua = this.ubicacionActual
            if (ua && ua.lat && ua.lng) {
                this.miPosicion = {
                    lat: Number(ua.lat),
                    lng: Number(ua.lng)
                }
            }

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        this.miPosicion = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        }
                        if (!this.usuariosUbicados.length) {
                            this.centro = { ...this.miPosicion }
                        }
                    },
                    () => { },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                )
            }
        },

        recalcularCentro() {
            if (this.usuariosUbicados.length) {
                this.centrarEnUsuarios()
            } else if (this.miPosicion) {
                this.centro = { ...this.miPosicion }
            }
        },

        isValidCoord(lat, lng) {
            const a = Number(lat)
            const b = Number(lng)
            return Number.isFinite(a) && Number.isFinite(b) && (Math.abs(a) > 0.0001 || Math.abs(b) > 0.0001)
        },

        // icono del marcador según índice
        iconoPorIndex(idx = 0) {
            const url = this.iconPalette[idx % this.iconPalette.length]
            if (!this.google || !window.google) {
                return { url }
            }
            return {
                url,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32)
            }
        },

        // color del ícono en la tabla según índice
        getColorByIndex(idx = 0) {
            return this.colorPalette[idx % this.colorPalette.length]
        },

        abreInfoUsuario(u) {
            if (!u || !u.ubicacion) return
            const lat = Number(u.ubicacion.lat)
            const lng = Number(u.ubicacion.lng)
            if (!this.isValidCoord(lat, lng)) return

            this.usuarioSeleccionado = u
            this.infoUsuarioPos = { lat, lng }
            this.infoUsuarioAbierto = true

            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map && this.infoUsuarioPos) map.panTo(this.infoUsuarioPos)
            })
        },

        cierraInfoUsuario() {
            this.infoUsuarioAbierto = false
            this.infoUsuarioPos = null
            this.usuarioSeleccionado = null
        },

        abreInfoMiPosicion() {
            this.infoMiPosicion = true
        },

        centrarEnMiPosicion() {
            if (!this.miPosicion) return
            this.cierraInfoUsuario()
            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map) {
                    map.panTo(this.miPosicion)
                    map.setZoom(16)
                }
            })
            this.infoMiPosicion = true
        },

        centrarEnUsuarios() {
            const map = this.$refs.gmap && this.$refs.gmap.$mapObject
            if (!map || (!this.usuariosUbicados.length && !this.miPosicion) || !window.google) return

            this.cierraInfoUsuario()

            const bounds = new window.google.maps.LatLngBounds()
            let hasValidCoords = false

            this.usuariosUbicados.forEach(u => {
                if (u.ubicacion && this.isValidCoord(u.ubicacion.lat, u.ubicacion.lng)) {
                    bounds.extend({
                        lat: Number(u.ubicacion.lat),
                        lng: Number(u.ubicacion.lng)
                    })
                    hasValidCoords = true
                }
            })

            if (this.miPosicion) {
                bounds.extend(this.miPosicion)
                hasValidCoords = true
            }

            if (hasValidCoords) {
                map.fitBounds(bounds)
            } else {
                map.panTo(this.centro)
                map.setZoom(12)
            }
        },

        centrarEnUsuarioSeleccionado(u) {
            if (!u || !u.ubicacion) return
            const lat = Number(u.ubicacion.lat)
            const lng = Number(u.ubicacion.lng)
            if (!this.isValidCoord(lat, lng)) return

            this.usuarioSeleccionado = u
            this.infoUsuarioPos = { lat, lng }
            this.infoUsuarioAbierto = true

            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map && this.infoUsuarioPos) {
                    map.panTo(this.infoUsuarioPos)
                    map.setZoom(16)
                }
            })
        }
    }
}
</script>

<style scoped>
.mapa-usuarios-wrapper {
    width: 100%;
}

.legend-table {
    border-bottom: 1px solid #E0E0E0;
    overflow-x: auto;
}

.legend-table table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.legend-table th,
.legend-table td {
    height: 30px;
    padding: 4px 8px;
    font-size: 11px;
    vertical-align: middle;
}

.legend-table th {
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 600;
}

.mapa-contenedor {
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
}

.fab-container {
    position: absolute;
    bottom: 24px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 3020;
}

.info-usuario {
    min-width: 180px;
    max-width: 250px;
    font-size: 13px;
    line-height: 1.4;
}

.overlay-mensaje {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    backdrop-filter: blur(2px);
}
</style>
