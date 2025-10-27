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
                        <!-- el resto del contenido -->
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
import { crearOActualizarCliente as nuevoCliente } from '../../db_firestore'
export default {
    name: "dial_mapa",
    props: {
        value: Boolean,            // v-model
        clienteEnMapa: Object,     // cliente único (opcional)
        guardar_auto: Boolean,     // ya lo tenías
        clientes: { type: Array, default: () => [] }, // << lista para “todos”
        verTodos: { type: Boolean, default: false }   // << flag de modo
    },
    data() {
        return {
            infoClienteAbierto: false,
            infoClientePos: null,          // {lat, lng}
            clienteSeleccionado: null,     // objeto cliente clickeado
            dialogoMapa: false,
            ubicacionCliente: null, // {lat, lng}
            centro: { lat: -12.0464, lng: -77.0428 }, // Default Lima
            fullscreen: false,
            miPosicion: null,
            iconoMiPosicion: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
            infoMiPosicion: false,
            infoOptions: {                // NUEVO: no hacer pan automático del mapa
                disableAutoPan: true,
                // Si quieres elevar un poco la ventanita, puedes luego crear un Size:
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
            }
        },
        dialogoMapa(val) {
            this.$emit('input', val)
        },
        ubicacionActual(nueva) {                 // NUEVO
            if (nueva && nueva.lat && nueva.lng) {
                this.miPosicion = { lat: nueva.lat, lng: nueva.lng };
                // si aún no hay punto de cliente, centra el mapa en tu posición
                //  if (!this.ubicacionCliente) this.centro = { ...this.miPosicion };
            }
        },
    },
    created() {
        console.log(store.state.ubicacion_actual)
    },
    computed: {
        // ...lo que ya tienes...
        ubicacionActual() {
            return store.state.ubicacion_actual || null; // NUEVO
        },
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown)
        // Espera a que Google Maps API esté lista
        this.$gmapApiPromiseLazy().then(() => {
            // Mueve la ventanita ~40px hacia arriba (ajusta a tu gusto: 35–60)
            const offset = new window.google.maps.Size(0, -40);
            // Reasignar el objeto para gatillar reactividad
            this.infoOptions = { ...this.infoOptions, pixelOffset: offset };
        });
    },
    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
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
                // --- MODO “TODOS”: construir bounds con todos los clientes válidos + (opcional) tu posición ---
                const coords = []
                this.clientes.forEach(c => {
                    if (this.isValidCoord(c.latitud, c.longitud)) {
                        coords.push({ lat: Number(c.latitud), lng: Number(c.longitud), c })
                    }
                })

                if (coords.length) {
                    // centra por bounds
                    this.$nextTick(() => {
                        const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                        if (!map) return
                        const bounds = new window.google.maps.LatLngBounds()
                        coords.forEach(k => bounds.extend(k))
                        if (this.miPosicion) bounds.extend(this.miPosicion)
                        map.fitBounds(bounds)
                    })
                }
                this.ubicacionCliente = null  // edición desactivada en modo múltiple
                this.centro = coords[0] || this.miPosicion || fallback
            } else {
                // --- MODO “UNO”: como lo tenías, centrado en el cliente o en miPosición ---
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

            // Refina mi posición con GPS del navegador (igual que ya tenías)
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
            if (this.verTodos) return   // no se edita en modo múltiple
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
                // Ya está bloqueado: mostrar UI con pasos para habilitar en el navegador
                alert('Por favor, habilita los permisos de ubicación en tu navegador.');
                return;
            }
            const ua = this.ubicacionActual; // ya lo tienes en computed
            if (ua && ua.lat && ua.lng) {
                this.miPosicion = { lat: Number(ua.lat), lng: Number(ua.lng) };
                this.centro = { ...this.miPosicion }; // por si quieres mantenerlo reactivo

                this.$nextTick(() => {
                    const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                    if (map) {
                        map.panTo(this.miPosicion);   // 👈 mueve la vista
                        // opcional: map.setZoom(15);
                    }
                });
            }
        },


        toggleFullscreen() {
            this.fullscreen = !this.fullscreen
            // scroll al top al entrar a fullscreen (en móvil a veces se queda abajo)
            if (this.fullscreen) setTimeout(() => window.scrollTo(0, 0), 100)
        },
        handleKeydown(e) {
            if (this.fullscreen && e.key === 'Escape') {
                this.fullscreen = false;
            }
        },
        abreInfoCliente(cli) {
            // posición del cliente
            const lat = Number(cli.latitud), lng = Number(cli.longitud)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

            this.clienteSeleccionado = cli
            this.infoClientePos = { lat, lng }
            this.infoClienteAbierto = true

            // centrar suavemente el mapa en el cliente seleccionado
            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject
                if (map && this.infoClientePos) map.panTo(this.infoClientePos)
            })
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
            // Perú por defecto (+51). Ajusta si guardas ya con código país.
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
            // Ajusta los sinónimos que uses en tu sistema:
            if (e === 'atendido' || e === 'completado' || e === 'ok' || e === 'hecho') return 'atendido';
            if (e === 'pendiente' || e === 'por atender' || e === 'en espera') return 'pendiente';
            return e; // por si tienes otros estados
        },
        iconoPorEstado(cli) {
            const estado = this.estadoNormalizado(cli);
            // Íconos clásicos de Google (https)
            const ICONS = {
                verde: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                rojo: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                naranja: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                gris: 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png' // fallback/otros
            };

            let url = ICONS.gris;
            if (estado === 'pre-venta' || estado === 'venta') url = ICONS.verde;
            else if (estado === 'visita') url = ICONS.rojo;
            else if (estado === 'pendiente') url = ICONS.naranja;

            // Opcional: define tamaño/ancle para nitidez en pantallas HiDPI
            return {
                url,
                scaledSize: new window.google.maps.Size(32, 32), // 32x32 se ve bien
                anchor: new window.google.maps.Point(16, 32)     // ancla en la punta
            };
        },
        abreInfoCliente(cli, esUno = false) {
            if (esUno) {
                // modo por cliente: usa la posición del marcador editable
                if (!this.ubicacionCliente) return;
                this.clienteSeleccionado = cli || this.clienteEnMapa || {};
                this.infoClientePos = { ...this.ubicacionCliente };
            } else {
                // modo verTodos: usa lat/lng del cliente de la lista
                const lat = Number(cli?.latitud), lng = Number(cli?.longitud);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                this.clienteSeleccionado = cli;
                this.infoClientePos = { lat, lng };
            }

            this.infoClienteAbierto = true;

            // centra suavemente el mapa
            this.$nextTick(() => {
                const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                if (map && this.infoClientePos) map.panTo(this.infoClientePos);
            });
        },

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
