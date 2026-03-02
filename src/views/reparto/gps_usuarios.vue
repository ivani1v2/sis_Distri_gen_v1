<template>
    <div class="mapa-usuarios-wrapper">
        <v-card class="elevation-4 rounded-xl overflow-hidden main-card">
            <v-toolbar color="primary" dark flat dense class="px-2">
                <v-icon left>mdi-radar</v-icon>
                <v-toolbar-title class="text-subtitle-1 font-weight-medium">
                    Monitoreo GPS
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip color="white" text-color="primary" class="font-weight-bold" small>
                    <v-icon left small>mdi-account-multiple-check</v-icon>
                    <span class="d-none d-sm-inline ml-1">Activos:</span> {{ usuariosFiltrados.length }}
                </v-chip>
            </v-toolbar>

            <v-row no-gutters class="map-container-row position-relative">

                <v-col cols="12" md="8" lg="9" class="position-relative map-col order-0 order-md-1">
                    <GmapMap ref="gmap" :center="centro" :zoom="14" style="width: 100%; height: 100%;"
                        :options="mapOptions">
                        <GmapMarker v-for="(u, idx) in usuariosFiltrados"
                            :key="'m-' + (u.token || u.uid || u.codigo || idx)"
                            v-show="u.ubicacion && isValidCoord(u.ubicacion.lat, u.ubicacion.lng)"
                            :position="{ lat: Number(u.ubicacion.lat), lng: Number(u.ubicacion.lng) }"
                            :icon="iconoPorIndex(u._colorIndex, isSelected(u))"
                            :title="u.nombre || u.codigo || 'Usuario'" :zIndex="isSelected(u) ? 999 : 1"
                            @click="abreInfoUsuario(u)" />

                        <GmapInfoWindow v-if="infoUsuarioAbierto && infoUsuarioPos" :position="infoUsuarioPos"
                            :opened="true" :options="infoOptions" @closeclick="cierraInfoUsuario">
                            <div class="custom-infowindow pa-1">
                                <div class="d-flex align-center mb-2">
                                    <v-avatar size="32" color="primary lighten-5" class="mr-2">
                                        <v-icon small color="primary">mdi-account</v-icon>
                                    </v-avatar>
                                    <div>
                                        <div class="font-weight-bold text-capitalize text-body-2"
                                            style="line-height: 1.2;">
                                            {{ usuarioSeleccionadoNombre }}
                                        </div>
                                        <div v-if="usuarioSeleccionadoCodigo" class="text-caption grey--text">
                                            Cód: {{ usuarioSeleccionadoCodigo }}
                                        </div>
                                    </div>
                                </div>
                                <v-divider class="my-1"></v-divider>
                                <div class="text-caption grey--text text--darken-2 d-flex align-center">
                                    <v-icon x-small color="grey" class="mr-1">mdi-calendar-clock</v-icon>
                                    {{ formatTimestampExact(usuarioSeleccionado?.ubicacion?.timestamp) }}
                                </div>
                            </div>
                        </GmapInfoWindow>
                    </GmapMap>

                    <v-fade-transition>
                        <v-btn v-if="!mostrarListaMovil" class="mobile-list-btn d-md-none" color="primary" rounded
                            elevation="6" @click="mostrarListaMovil = true">
                            <v-icon left>mdi-format-list-bulleted</v-icon>
                            Ver Usuarios ({{ usuariosFiltrados.length }})
                        </v-btn>
                    </v-fade-transition>

                    <div class="fab-container">
                        <v-tooltip left>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn fab small color="white" class="mb-3 elevation-4" @click="centrarEnMiPosicion"
                                    v-bind="attrs" v-on="on">
                                    <v-icon color="blue darken-2">mdi-crosshairs-gps</v-icon>
                                </v-btn>
                            </template>
                            <span>Mi ubicación</span>
                        </v-tooltip>

                        <v-tooltip left>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn fab small color="primary" class="elevation-4" @click="centrarEnUsuarios"
                                    v-bind="attrs" v-on="on">
                                    <v-icon>mdi-fit-to-screen</v-icon>
                                </v-btn>
                            </template>
                            <span>Centrar todos</span>
                        </v-tooltip>
                    </div>
                </v-col>

                <v-col cols="12" md="4" lg="3" class="sidebar-list d-flex flex-column grey lighten-5 order-1 order-md-0"
                    :class="{ 'mobile-list-open': mostrarListaMovil }">

                    <div class="d-md-none white d-flex justify-center align-center pt-3 pb-1 mobile-drag-handle"
                        @click="mostrarListaMovil = false">
                        <div class="drag-pill"></div>
                    </div>

                    <div class="pa-3 white elevation-1" style="z-index: 2;">
                        <v-text-field v-model="busqueda" prepend-inner-icon="mdi-magnify" label="Buscar usuario..."
                            hide-details outlined dense rounded color="primary" clearable></v-text-field>
                    </div>

                    <div class="flex-grow-1 overflow-y-auto pa-2 list-scroll-area">
                        <div v-if="!mapLoaded && cargaInicial">
                            <v-skeleton-loader v-for="n in 5" :key="n" type="list-item-avatar-two-line"
                                class="mb-2"></v-skeleton-loader>
                        </div>

                        <div v-else-if="usuariosFiltrados.length === 0" class="text-center pa-6 grey--text">
                            <v-icon size="48" color="grey lighten-2" class="mb-3">mdi-account-search-outline</v-icon>
                            <div class="text-body-2">No se encontraron usuarios</div>
                        </div>

                        <v-list v-else two-line class="bg-transparent pa-0">
                            <v-card v-for="(item, index) in usuariosFiltrados" :key="item.uid || item.codigo || index"
                                class="mb-2 transition-swing user-card"
                                :class="{ 'selected-card border-primary': isSelected(item) }" elevation="1"
                                @click="centrarEnUsuarioSeleccionado(item)">
                                <v-list-item class="px-3">
                                    <v-list-item-avatar size="40"
                                        :color="getColorByIndex(item._colorIndex) + ' lighten-5'">
                                        <v-icon :color="getColorByIndex(item._colorIndex)">mdi-map-marker</v-icon>
                                    </v-list-item-avatar>

                                    <v-list-item-content>
                                        <v-list-item-title class="font-weight-bold text-body-2 text-capitalize"
                                            style="color: #2C3E50;">
                                            {{ item.nombre || item.codigo || 'Usuario Desconocido' }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="text-caption mt-1 d-flex align-center">
                                            <v-icon x-small color="grey" class="mr-1">mdi-clock-outline</v-icon>
                                            <span :title="formatTimestampExact(item?.ubicacion?.timestamp)">
                                                {{ timeAgo(item?.ubicacion?.timestamp) }}
                                            </span>
                                        </v-list-item-subtitle>
                                    </v-list-item-content>

                                    <v-list-item-action>
                                        <v-btn icon small :color="isSelected(item) ? 'primary' : 'grey'">
                                            <v-icon small>mdi-target</v-icon>
                                        </v-btn>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-card>
                        </v-list>
                    </div>
                </v-col>
            </v-row>
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
            busqueda: '',
            centro: { lat: -12.0464, lng: -77.0428 },
            miPosicion: null,

            infoUsuarioAbierto: false,
            infoUsuarioPos: null,
            usuarioSeleccionado: null,
            mapLoaded: false,
            cargaInicial: true,
            mostrarListaMovil: false, // NUEVO: Control del panel en celular

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
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] }
                ]
            },

            iconPalette: [
                'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
                'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            ],

            colorPalette: [
                'red darken-1', 'green darken-1', 'amber darken-1',
                'deep-purple darken-1', 'orange darken-1', 'pink darken-1', 'blue-grey darken-1'
            ]
        }
    },
    computed: {
        google: gmapApi,
        ubicacionActual() {
            return store.state.ubicacion_actual || null
        },
        usuariosFiltrados() {
            if (!this.busqueda) return this.usuariosUbicados;
            const term = this.busqueda.toLowerCase();
            return this.usuariosUbicados.filter(u =>
                (u.nombre && u.nombre.toLowerCase().includes(term)) ||
                (u.codigo && String(u.codigo).toLowerCase().includes(term))
            );
        },
        usuarioSeleccionadoNombre() {
            return this.usuarioSeleccionado?.nombre || this.usuarioSeleccionado?.codigo || 'Usuario'
        },
        usuarioSeleccionadoCodigo() {
            return this.usuarioSeleccionado?.codigo || ''
        }
    },
    created() {
        moment.locale('es');
        this.verUbicacionUsuarios()
        this.inicializarMiPosicion()

        this.$gmapApiPromiseLazy().then(() => {
            if (!window.google) return
            const offset = new window.google.maps.Size(0, -35)
            this.infoOptions = { ...this.infoOptions, pixelOffset: offset }
            this.mapLoaded = true

            // ✅ Si ya llegaron usuarios antes de cargar el mapa, centramos aquí también
            this.$nextTick(() => {
                if (this.usuariosUbicados.length) this.centrarEnUsuarios()
            })
        })
    },
    methods: {
        formatTimestampExact(ts) {
            if (!ts) return 'Desconocida'
            const timestampMs = String(ts).length === 10 ? ts * 1000 : ts
            return moment(timestampMs).format('DD/MM/YYYY HH:mm:ss')
        },
        timeAgo(ts) {
            if (!ts) return 'Sin datos'
            const timestampMs = String(ts).length === 10 ? ts * 1000 : ts
            return moment(timestampMs).fromNow()
        },
        isSelected(item) {
            const selId = this.usuarioSeleccionado?.uid || this.usuarioSeleccionado?.codigo
            const itemId = item?.uid || item?.codigo
            if (!selId || !itemId) return false
            return selId === itemId
        },
        verUbicacionUsuarios() {
            allUsuarios()
                .orderByChild('ruc')
                .equalTo((store.state.baseDatos.ruc_asociado))
                .on('value', snapshot => {
                    const usuarios = []
                    snapshot.forEach(childSnapshot => {
                        const usuario = childSnapshot.val()
                        usuario.uid = childSnapshot.key
                        if (usuario.ubicacion && this.isValidCoord(usuario.ubicacion.lat, usuario.ubicacion.lng)) {
                            usuario._colorIndex = usuarios.length
                            usuarios.push(usuario)
                        }
                    })
                    this.usuariosUbicados = usuarios
                    if (this.cargaInicial && usuarios.length > 0) {
                        this.recalcularCentro()
                        this.cargaInicial = false
                    }
                })
        },
        inicializarMiPosicion() {
            const ua = this.ubicacionActual
            if (ua && ua.lat && ua.lng) {
                this.miPosicion = { lat: Number(ua.lat), lng: Number(ua.lng) }
            }
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        this.miPosicion = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        if (!this.usuariosUbicados.length) this.centro = { ...this.miPosicion }
                    },
                    () => { },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                )
            }
        },
        recalcularCentro() {
            if (this.usuariosUbicados.length) this.centrarEnUsuarios()
            else if (this.miPosicion) this.centro = { ...this.miPosicion }
        },
        isValidCoord(lat, lng) {
            const a = Number(lat); const b = Number(lng);
            return Number.isFinite(a) && Number.isFinite(b) && (Math.abs(a) > 0.0001 || Math.abs(b) > 0.0001)
        },
        iconoPorIndex(idx = 0, isSelected = false) {
            const url = this.iconPalette[idx % this.iconPalette.length]
            if (!this.google || !window.google) return { url }
            const size = isSelected ? 38 : 30;
            return {
                url,
                scaledSize: new window.google.maps.Size(size, size),
                anchor: new window.google.maps.Point(size / 2, size)
            }
        },
        getColorByIndex(idx = 0) {
            return this.colorPalette[idx % this.colorPalette.length]
        },
        abreInfoUsuario(u) {
            if (!u || !u.ubicacion) return
            const lat = Number(u.ubicacion.lat); const lng = Number(u.ubicacion.lng);
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
        centrarEnMiPosicion() {
            if (!this.miPosicion) return
            this.cierraInfoUsuario()
            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map) { map.panTo(this.miPosicion); map.setZoom(16); }
            })
        },
        centrarEnUsuarios() {
            const map = this.$refs.gmap && this.$refs.gmap.$mapObject
            if (!map || (!this.usuariosUbicados.length && !this.miPosicion) || !window.google) return
            this.cierraInfoUsuario()

            const bounds = new window.google.maps.LatLngBounds()
            let hasValidCoords = false

            this.usuariosFiltrados.forEach(u => {
                if (u.ubicacion && this.isValidCoord(u.ubicacion.lat, u.ubicacion.lng)) {
                    bounds.extend({ lat: Number(u.ubicacion.lat), lng: Number(u.ubicacion.lng) })
                    hasValidCoords = true
                }
            })
            if (this.miPosicion) { bounds.extend(this.miPosicion); hasValidCoords = true; }
            if (hasValidCoords) map.fitBounds(bounds)
            else { map.panTo(this.centro); map.setZoom(12) }
        },
        centrarEnUsuarioSeleccionado(u) {
            // Cierra la lista en celular automáticamente para ver el mapa
            this.mostrarListaMovil = false;

            this.abreInfoUsuario(u);
            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map && this.infoUsuarioPos) {
                    map.setZoom(14);
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

.map-container-row {
    height: 70vh;
    /* Altura principal de escritorio */
    min-height: 600px;
}

/* Panel Lateral (Lista) */
.sidebar-list {
    border-right: 1px solid #E0E0E0;
    height: 100%;
    background-color: #FAFAFA;
}

/* Scroll interno de la lista */
.list-scroll-area {
    scroll-behavior: smooth;
}

/* Estilos de las tarjetas de usuario en la lista */
.user-card {
    cursor: pointer;
    border: 1px solid transparent;
}

.user-card:hover {
    background-color: #f8f9fa !important;
    transform: translateY(-1px);
}

.selected-card {
    background-color: #E3F2FD !important;
    border-color: #2196F3 !important;
}

/* Contenedor del Mapa */
.map-col {
    height: 100%;
}

/* InfoWindow Custom */
.custom-infowindow {
    min-width: 180px;
    max-width: 260px;
}

/* Botones flotantes (FAB) */
.fab-container {
    position: absolute;
    bottom: 24px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 10;
}

/* Tíldador Drag en móvil */
.drag-pill {
    width: 40px;
    height: 5px;
    background-color: #D1D5DB;
    border-radius: 10px;
}

.mobile-drag-handle {
    cursor: pointer;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
}

/* =========================================================
   AJUSTES RESPONSIVE (MÓVILES Y TABLETS PEQUEÑAS)
   ========================================================= */
@media (max-width: 959px) {
    .main-card {
        border-radius: 0 !important;
        /* Pantalla completa en móvil */
        height: calc(100vh - 56px);
        /* Asumiendo altura del App Bar principal */
        display: flex;
        flex-direction: column;
    }

    .map-container-row {
        height: 100%;
        min-height: auto;
        display: block;
        /* Rompe el flex-row */
    }

    .map-col {
        height: 100%;
        width: 100%;
    }

    /* Transformar el sidebar en Bottom Sheet deslizable */
    .sidebar-list {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 65%;
        /* Ocupa el 65% de la pantalla cuando se abre */
        z-index: 20;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border-top-left-radius: 24px !important;
        border-top-right-radius: 24px !important;
        box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15) !important;
        background-color: white !important;
    }

    .sidebar-list.mobile-list-open {
        transform: translateY(0);
    }

    /* Botón flotante central inferior (Ver Usuarios) */
    .mobile-list-btn {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 15;
    }

    /* Subir FABs para que no tapen al botón central */
    .fab-container {
        bottom: 90px;
    }
}
</style>