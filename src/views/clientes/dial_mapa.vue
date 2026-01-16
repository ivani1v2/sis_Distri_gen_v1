<template>
    <v-dialog v-model="dialogoMapa" max-width="800px" persistent>
        <v-card>
            <v-card-title>
                <v-icon left color="blue">mdi-map-marker</v-icon>
                Ubicación
                <v-spacer></v-spacer>
                <v-chip color="primary" outlined>
                    <v-icon left small>mdi-account</v-icon>
                    <div v-if="clienteEnMapa && !verTodos">
                        <h4>{{ clienteEnMapa.nombre }}</h4>
                    </div>
                </v-chip>
            </v-card-title>

            <v-card-text style="position:relative; padding:0;">
                <div :class="{ 'mapa-fullscreen': fullscreen }" style="height:500px; width:100%; position:relative;">
                    <GmapMap ref="gmap" :center="centro" :zoom="15"
                        :style="fullscreen ? 'width: 100vw; height: 100vh' : 'width: 100%; height: 500px'"
                        @click="mapClick" :options="mapOptions">
                        <GmapMarker v-if="!verTodos && ubicacionCliente" :position="ubicacionCliente" :draggable="true"
                            @dragend="onMarkerDragEnd" @click="abreInfoCliente(clienteEnMapa, true)" />
                        <GmapMarker v-if="miPosicion" :position="miPosicion" :draggable="false" :zIndex="999"
                            :icon="iconoMiPosicion" :title="'Mi posición actual'" @click="abreInfoMiPosicion" />
                        <GmapMarker v-for="(u, idx) in usuariosUbicados" :key="u.token || idx"
                            v-show="u.ubicacion && isValidCoord(u.ubicacion.lat, u.ubicacion.lng)" :position="{
                                lat: Number(u.ubicacion.lat),
                                lng: Number(u.ubicacion.lng)
                            }" :icon="'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'"
                            :title="u.nombre || u.codigo || 'Vendedor'" />
                        <GmapMarker v-if="verTodos" v-for="(cli, i) in clientes" :key="cli.id || cli.documento || i"
                            v-show="isValidCoord(cli.latitud, cli.longitud)"
                            :position="{ lat: Number(cli.latitud), lng: Number(cli.longitud) }" :title="cli.nombre"
                            :draggable="false" :icon="iconoPorEstado(cli)" @click="abreInfoCliente(cli)" />
                        <GmapInfoWindow v-if="miPosicion" :position="miPosicion" :opened="infoMiPosicion"
                            :options="infoOptions" @closeclick="infoMiPosicion = false">
                            <div class="info-mi-pos">Tu ubicación actual</div>
                        </GmapInfoWindow>
                        <GmapInfoWindow v-if="verTodos && infoClienteAbierto && infoClientePos"
                            :position="infoClientePos" :opened="true" :options="infoOptions"
                            @closeclick="cierraInfoCliente">
                            <div class="info-cliente">
                                <div class="font-weight-bold">
                                    {{ (clienteSeleccionado && clienteSeleccionado.nombre) ? clienteSeleccionado.nombre
                                        : 'Cliente' }}
                                </div>

                                <div v-if="clienteSeleccionado && clienteSeleccionado.direccion"
                                    class="text--secondary">
                                    {{ clienteSeleccionado.direccion }}
                                </div>

                                <div v-if="clienteSeleccionado && clienteSeleccionado.documento"
                                    class="text--secondary">
                                    Doc: {{ clienteSeleccionado.documento }}
                                </div>

                                <div class="mt-2" style="display:flex; gap:8px; align-items:center;">
                                    <v-btn x-small color="primary" @click="navegarCliente" title="Navegar">
                                        <v-icon left small>mdi-navigation</v-icon> Ir
                                    </v-btn>
                                    <v-btn x-small color="success"
                                        v-if="clienteSeleccionado && clienteSeleccionado.telefono"
                                        @click="llamarCliente" title="Llamar">
                                        <v-icon left small>mdi-phone</v-icon> Llamar
                                    </v-btn>
                                    <v-btn x-small color="teal"
                                        v-if="clienteSeleccionado && clienteSeleccionado.telefono"
                                        @click="whatsappCliente" title="WhatsApp">
                                        <v-icon left small>mdi-whatsapp</v-icon> WhatsApp
                                    </v-btn>
                                </div>
                            </div>
                        </GmapInfoWindow>
                        <GmapInfoWindow v-if="!verTodos && infoClienteAbierto && ubicacionCliente"
                            :position="ubicacionCliente" :opened="true" :options="infoOptions"
                            @closeclick="cierraInfoCliente">
                            <div class="info-cliente">
                                <div class="font-weight-bold">
                                    {{ (clienteSeleccionado && clienteSeleccionado.nombre) ? clienteSeleccionado.nombre
                                        : 'Cliente' }}
                                </div>

                                <div v-if="clienteSeleccionado && clienteSeleccionado.direccion"
                                    class="text--secondary">
                                    {{ clienteSeleccionado.direccion }}
                                </div>

                                <div v-if="clienteSeleccionado && clienteSeleccionado.documento"
                                    class="text--secondary">
                                    Doc: {{ clienteSeleccionado.documento }}
                                </div>

                                <div class="mt-2" style="display:flex; gap:8px; align-items:center;">
                                    <v-btn x-small color="primary" @click="navegarCliente" title="Navegar">
                                        <v-icon left small>mdi-navigation</v-icon> Ir
                                    </v-btn>
                                    <v-btn x-small color="success"
                                        v-if="clienteSeleccionado && clienteSeleccionado.telefono"
                                        @click="llamarCliente" title="Llamar">
                                        <v-icon left small>mdi-phone</v-icon> Llamar
                                    </v-btn>
                                    <v-btn x-small color="teal"
                                        v-if="clienteSeleccionado && clienteSeleccionado.telefono"
                                        @click="whatsappCliente" title="WhatsApp">
                                        <v-icon left small>mdi-whatsapp</v-icon> WhatsApp
                                    </v-btn>
                                </div>
                            </div>
                        </GmapInfoWindow>
                    </GmapMap>
                    <!-- FABs flotantes -->
                    <div class="fab-container">
                        <v-btn fab small color="info" class="mb-2" @click="ubicarme" title="Ubicarme">
                            <v-icon>mdi-crosshairs-gps</v-icon>
                        </v-btn>
                        <v-btn v-if="!verTodos" fab small color="primary" class="mb-2" @click="guardarUbicacion"
                            title="Guardar ubicación">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                        <v-btn fab small color="red" class="mb-2" @click="cierra" title="Cancelar">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <v-btn v-if="fullscreen" fab small color="white" @click="toggleFullscreen"
                            title="Salir de pantalla completa">
                            <v-icon color="blue">mdi-fullscreen-exit</v-icon>
                        </v-btn>
                    </div>
                    <!-- Botón para activar fullscreen si NO está en fullscreen -->
                    <v-btn v-if="!fullscreen" fab small color="grey lighten-4" class="fab-fullscreen"
                        @click="toggleFullscreen" title="Pantalla completa">
                        <v-icon color="blue">mdi-fullscreen</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { gmapApi } from 'vue2-google-maps'
import store from '@/store/index'
import { allUsuarios } from '../../db'
import { crearOActualizarCliente as nuevoCliente } from '../../db_firestore'

export default {
    name: "dial_mapa",
    props: {
        value: Boolean,
        clienteEnMapa: Object,
        guardar_auto: Boolean,
        clientes: { type: Array, default: () => [] },
        verTodos: { type: Boolean, default: false }
    },
    data() {
        return {
            infoClienteAbierto: false,
            infoClientePos: null,
            clienteSeleccionado: null,
            dialogoMapa: false,
            ubicacionCliente: null,
            centro: { lat: -12.0464, lng: -77.0428 },
            usuariosUbicados: [],
            fullscreen: false,
            miPosicion: null,
            iconoMiPosicion: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
            infoMiPosicion: false,
            ubicacionListener: null,
            infoOptions: {
                disableAutoPan: true,
                pixelOffset: null
            },
            mapOptions: {
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy',
                styles: [
                    {
                        featureType: "poi",
                        stylers: [{ visibility: "off" }]
                    },
                    {
                        featureType: "transit",
                        stylers: [{ visibility: "off" }]
                    },
                    {
                        featureType: "road",
                        elementType: "labels.icon",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            }
        }
    },
    watch: {
        value(val) {
            this.dialogoMapa = val
            if (val) {
                this.fullscreen = false
                this.inicializarUbicacion()
                this.ver_ubicacion_usuarios()
            } else {
                this.detenerListenerUbicacion()
            }
        },
        dialogoMapa(val) {
            this.$emit('input', val)
        },
        ubicacionActual(nueva) {
            if (nueva && nueva.lat && nueva.lng) {
                this.miPosicion = { lat: nueva.lat, lng: nueva.lng };
            }
        },
    },
    created() {
        console.log(store.state.ubicacion_actual)
    },
    beforeDestroy() {
    this.detenerListenerUbicacion()
    window.removeEventListener('keydown', this.handleKeydown)
    
    this.usuariosUbicados = []
    this.ubicacionListener = null
    this.clienteSeleccionado = null
    this.infoClientePos = null
},
    mounted() {
        window.addEventListener('keydown', this.handleKeydown)
        this.$gmapApiPromiseLazy().then(() => {
            const offset = new window.google.maps.Size(0, -40);
            this.infoOptions = { ...this.infoOptions, pixelOffset: offset };
        });
    },
    computed: {
        ubicacionActual() {
            return store.state.ubicacion_actual || null;
        },
    },
    methods: {
        ver_ubicacion_usuarios() {
            if (this.ubicacionListener) {
                return
            }
            
            this.ubicacionListener = allUsuarios()
                .orderByChild('ruc')
                .equalTo(Number(store.state.baseDatos.ruc_asociado))
                .on("value", snapshot => {
                    const usuarios = []
                    snapshot.forEach(childSnapshot => {
                        const usuario = childSnapshot.val()

                        if (
                            usuario.ubicacion &&
                            Number.isFinite(Number(usuario.ubicacion.lat)) &&
                            Number.isFinite(Number(usuario.ubicacion.lng)) &&
                            usuario.ubicacion.lat !== 0 &&
                            usuario.ubicacion.lng !== 0
                        ) {
                            usuarios.push(usuario)
                        }
                    })

                    this.usuariosUbicados = usuarios
                })
        },
        
        detenerListenerUbicacion() {
            if (this.ubicacionListener) {
                allUsuarios().off("value", this.ubicacionListener)
                this.ubicacionListener = null
            }
            this.usuariosUbicados = []
        },      
        isValidCoord(lat, lng) {
            const a = Number(lat), b = Number(lng)
            return Number.isFinite(a) && Number.isFinite(b) && a !== 0 && b !== 0
        },
        
        abreInfoMiPosicion() {
            this.infoMiPosicion = true;
        },
        
        inicializarUbicacion() {
            const fallback = { lat: -12.0464, lng: -77.0428 }
            const ua = store.state.ubicacion_actual
            this.miPosicion = (ua && ua.lat && ua.lng) ? { lat: ua.lat, lng: ua.lng } : { ...fallback }

            if (this.verTodos) {
                const coords = []
                this.clientes.forEach(c => {
                    if (this.isValidCoord(c.latitud, c.longitud)) {
                        coords.push({ lat: Number(c.latitud), lng: Number(c.longitud), c })
                    }
                })

                if (coords.length) {
                    this.$nextTick(() => {
                        const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                        if (!map) return
                        const bounds = new window.google.maps.LatLngBounds()
                        coords.forEach(k => bounds.extend(k))
                        if (this.miPosicion) bounds.extend(this.miPosicion)
                        map.fitBounds(bounds)
                    })
                }
                this.ubicacionCliente = null
                this.centro = coords[0] || this.miPosicion || fallback
            } else {
                if (this.clienteEnMapa && this.isValidCoord(this.clienteEnMapa.latitud, this.clienteEnMapa.longitud)) {
                    this.ubicacionCliente = {
                        lat: Number(this.clienteEnMapa.latitud),
                        lng: Number(this.clienteEnMapa.longitud)
                    }
                    this.centro = { ...this.ubicacionCliente }
                } else {
                    this.ubicacionCliente = null
                    this.centro = { ...this.miPosicion }
                }
            }

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const actual = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        this.miPosicion = actual
                        if (!this.verTodos && !this.ubicacionCliente) this.centro = { ...actual }
                    },
                    () => { },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                )
            }
        },

        mapClick(e) {
            if (this.verTodos) return
            this.ubicacionCliente = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        },

        onMarkerDragEnd(event) {
            this.ubicacionCliente = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            }
        },
        
        guardarUbicacion() {
            if (this.clienteEnMapa && this.ubicacionCliente) {
                if (this.guardar_auto) {
                    nuevoCliente(this.clienteEnMapa.documento, {
                        ...this.clienteEnMapa,
                        latitud: this.ubicacionCliente.lat,
                        longitud: this.ubicacionCliente.lng
                    })
                } else {
                    this.$emit('ubicacion-guardada', {
                        ...this.clienteEnMapa,
                        latitud: this.ubicacionCliente.lat,
                        longitud: this.ubicacionCliente.lng
                    })
                }
            }
            this.cierra()
        },
        
        cierra() {
            this.$emit('cierra', false)
            this.dialogoMapa = false
        },
        
        async ubicarme() {
            const perm = navigator.permissions?.query
                ? await navigator.permissions.query({ name: 'geolocation' })
                : null;

            if (perm && perm.state === 'denied') {
                alert('Por favor, habilita los permisos de ubicación en tu navegador.');
                return;
            }
            const ua = this.ubicacionActual;
            if (ua && ua.lat && ua.lng) {
                this.miPosicion = { lat: Number(ua.lat), lng: Number(ua.lng) };
                this.centro = { ...this.miPosicion };

                this.$nextTick(() => {
                    const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                    if (map) {
                        map.panTo(this.miPosicion);
                    }
                });
            }
        },

        toggleFullscreen() {
            this.fullscreen = !this.fullscreen
            if (this.fullscreen) setTimeout(() => window.scrollTo(0, 0), 100)
        },
        
        handleKeydown(e) {
            if (this.fullscreen && e.key === 'Escape') {
                this.fullscreen = false;
            }
        },
        
        abreInfoCliente(cli, esUno = false) {
            if (esUno) {
                if (!this.ubicacionCliente) return;
                this.clienteSeleccionado = cli || this.clienteEnMapa || {};
                this.infoClientePos = { ...this.ubicacionCliente };
            } else {
                const lat = Number(cli?.latitud), lng = Number(cli?.longitud);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                this.clienteSeleccionado = cli;
                this.infoClientePos = { lat, lng };
            }

            this.infoClienteAbierto = true;

            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                if (map && this.infoClientePos) map.panTo(this.infoClientePos);
            });
        },

        cierraInfoCliente() {
            this.infoClienteAbierto = false
            this.infoClientePos = null
            this.clienteSeleccionado = null
        },

        navegarCliente() {
            if (!this.infoClientePos) return
            const { lat, lng } = this.infoClientePos
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            window.open(url, '_blank')
        },

        llamarCliente() {
            const tel = (this.clienteSeleccionado?.telefono || '').toString().trim()
            if (!tel) return
            window.open(`tel:${tel}`, '_self')
        },

        whatsappCliente() {
            const tel = (this.clienteSeleccionado?.telefono || '').toString().replace(/\D/g, '')
            if (!tel) return
            const numero = tel.startsWith('51') ? tel : `51${tel}`
            const texto = encodeURIComponent(`Hola ${this.clienteSeleccionado?.nombre || ''}`)
            window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
        },
        
        estadoNormalizado(cli) {
            console.log(cli)
            const e = (cli && (cli.estado || cli.estatus || cli.situacion || ''))
                .toString()
                .toLowerCase()
                .trim();
            if (e === 'atendido' || e === 'completado' || e === 'ok' || e === 'hecho') return 'atendido';
            if (e === 'pendiente' || e === 'por atender' || e === 'en espera') return 'pendiente';
            return e;
        },
        
        iconoPorEstado(cli) {
            const estado = this.estadoNormalizado(cli);
            const ICONS = {
                verde: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                rojo: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                naranja: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                gris: 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png'
            };

            let url = ICONS.gris;
            if (estado === 'pre-venta' || estado === 'venta') url = ICONS.verde;
            else if (estado === 'visita') url = ICONS.rojo;
            else if (estado === 'pendiente') url = ICONS.naranja;

            return {
                url,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32)
            };
        }
    }
}
</script>

<style scoped>
.fab-container {
    position: absolute;
    bottom: 24px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 3020;
}

.fab-fullscreen {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 3020;
}

.v-dialog__content .mapa-fullscreen,
.mapa-fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    background: #fff !important;
    z-index: 4000 !important;
}

.info-mi-pos {
    font-weight: 600;
    font-size: 13px;
    color: #1a237e;
}

.info-cliente {
    min-width: 220px;
    max-width: 280px;
    font-size: 12.5px;
    line-height: 1.3;
}
</style>