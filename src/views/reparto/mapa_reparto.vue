<template>
    <v-dialog v-model="dialogoMapa" max-width="800px" persistent fullscreen>
        <v-app-bar scroll-behavior="hide" class="pa-0" app color="" dark dense>
            <v-row dense>
                <v-autocomplete ref="buscador" v-model="busqueda" :items="sugerenciasBusqueda" item-text="label"
                    item-value="valor" outlined dense hide-details label="Buscar cliente, DNI o dirección" clearable
                    @change="onSeleccionBusqueda" style="font-size:80%;">
                    <!-- cómo se ven las opciones del dropdown -->
                    <template v-slot:item="{ item }">
                        <div class="autocomplete-item-row" :style="{ color: estadoColorTexto(item.estado_entrega) }">
                            {{ item.label }}
                            <small class="ml-2 estado-pill"
                                :style="{ color: '#fff', backgroundColor: estadoColorTexto(item.estado_entrega) }">
                                {{ item.estado_entrega || 'sin estado' }}
                            </small>
                        </div>
                    </template>
                </v-autocomplete>


                <v-select v-if="!isMobile" v-model="estadoFiltro" :items="estadosEntrega" outlined dense hide-details
                    class="ml-2" label="Estado" />
                <v-spacer v-if="!isMobile"></v-spacer>
                <v-btn v-if="!isMobile" x-small color="error" dark rounded depressed lock class="mt-2" @click="cierra">
                    <v-icon>mdi-close</v-icon>

                </v-btn>
            </v-row>

        </v-app-bar>
        <div v-if="clienteSeleccionado" class="panel-cliente">
            <div class="panel-inner">
                <div class="panel-header">
                    <div class="panel-txt">
                        <div class="panel-doc">
                            <small>Doc: {{ clienteSeleccionado.tipo_doc || '' }}-{{ clienteSeleccionado.id }}</small>
                        </div>
                        <div class="panel-dir">
                            <strong>{{ clienteSeleccionado.dni }}-{{ clienteSeleccionado.cliente }}</strong>
                        </div>
                        <div class="panel-dir">
                            <strong>{{ clienteSeleccionado.direccion }}</strong>
                        </div>
                    </div>

                    <v-btn x-small icon color="error" @click="clienteSeleccionado = null; stopBlink()">
                        <v-icon small>mdi-close</v-icon>
                    </v-btn>
                </div>

                <div class="panel-estado-line">
                    <v-chip x-small dark :color="chipColorEntrega(clienteSeleccionado.estado_entrega)" class="mr-2">
                        {{ (clienteSeleccionado.estado_entrega || '').toLowerCase() }}
                    </v-chip>

                    <div class="panel-monto">
                        <strong>S/. {{ clienteSeleccionado.total }}</strong>
                    </div>
                </div>

                <div class="panel-acciones">
                    <!-- navegar -->
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" color="info" dark icon
                                :disabled="!clienteSeleccionado.latitud || !clienteSeleccionado.longitud"
                                @click="irGoogleMaps(clienteSeleccionado)">
                                <v-icon>mdi-navigation</v-icon>
                            </v-btn>
                        </template>
                        <span>Ir con Google Maps</span>
                    </v-tooltip>

                    <!-- whatsapp -->
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" color="success" dark icon
                                :disabled="!clienteSeleccionado.telefono" @click="enviarWhatsApp(clienteSeleccionado)">
                                <v-icon>mdi-whatsapp</v-icon>
                            </v-btn>
                        </template>
                        <span>WhatsApp</span>
                    </v-tooltip>

                    <!-- llamar -->
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" color="info" dark icon
                                :disabled="!clienteSeleccionado.telefono" @click="llamarCliente(clienteSeleccionado)">
                                <v-icon>mdi-phone</v-icon>
                            </v-btn>
                        </template>
                        <span>Llamar</span>
                    </v-tooltip>

                    <!-- entregar -->
                    <v-spacer></v-spacer>
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" color="warning" dark icon
                                :disabled="clienteSeleccionado.estado_entrega !== 'pendiente'"
                                @click="dial_aceptado = !dial_aceptado">
                                <v-icon>mdi-check</v-icon>
                            </v-btn>
                        </template>
                        <span>Entregado</span>
                    </v-tooltip>

                    <!-- rechazar -->
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" color="error" dark icon
                                :disabled="clienteSeleccionado.estado_entrega !== 'pendiente'"
                                @click="dial_rechazo = !dial_rechazo">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </template>
                        <span>Rechazar</span>
                    </v-tooltip>
                </div>
            </div>
        </div>
        <v-card>
            <v-card-text style="position:relative; padding:0;">
                <div :class="{ 'mapa-fullscreen': fullscreen }" style="height:85vh; width:100%; position:relative;">
                    <GmapMap ref="gmap" :center="centro" :zoom="15"
                        :style="fullscreen ? 'width: 100vw; height: 100vh' : 'width: 100%; height: 90vh'"
                        :options="mapOptions">

                        <GmapMarker v-if="miPosicion" :position="miPosicion" :draggable="false" :zIndex="999"
                            :icon="iconoMiPosicion" :title="'Mi posición actual'" @click="abreInfoMiPosicion" />
                        <GmapMarker v-for="(cli, i) in clientesFiltradosPorEstado" :key="cli.id || cli.documento || i"
                            v-show="isValidCoord(cli.latitud, cli.longitud)"
                            :position="{ lat: Number(cli.latitud), lng: Number(cli.longitud) }" :title="cli.nombre"
                            :draggable="false" :icon="iconoPorEstado(cli, i)" @click="abreInfoCliente(cli, i)" />
                        <GmapInfoWindow v-if="miPosicion" :position="miPosicion" :opened="infoMiPosicion"
                            :options="infoOptions" @closeclick="infoMiPosicion = false">
                            <div class="info-mi-pos">Tu ubicación actual</div>
                        </GmapInfoWindow>


                    </GmapMap>
                    <!-- FABs flotantes -->
                    <div class="fab-container">

                        <v-menu v-if="isMobile" offset-y :close-on-content-click="false" transition="scale-transition"
                            max-width="320" class="mt-12">
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn fab small color="success" class="mb-2" v-bind="attrs" v-on="on">
                                    <v-icon>mdi-filter</v-icon>
                                </v-btn>
                            </template>

                            <!-- Panel de filtros en móvil -->
                            <v-card class="pa-3" tile>
                                <v-select v-model="estadoFiltro" :items="estadosEntrega" outlined dense hide-details
                                    label="Estado" class="mb-2" />

                                <v-divider class="my-2" />

                            </v-card>
                        </v-menu>
                        <v-btn fab small color="info" class="mb-2" @click="ubicarme" title="Ubicarme">
                            <v-icon>mdi-crosshairs-gps</v-icon>
                        </v-btn>
                        <v-btn v-if="isMobile" fab small color="red" class="mb-2" @click="cierra" title="Cancelar">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>

                    </div>

                </div>
            </v-card-text>
        </v-card>
        <dial_rechaza v-if="dial_rechazo" :item_selecto="clienteSeleccionado" :grupo="grupo" @cerrar="dial_rechazo = false"
            @guardado="clienteSeleccionado = null; stopBlink(); dial_rechazo = false" />
        <acepta_pedido v-if="dial_aceptado" :item_selecto="clienteSeleccionado" :grupo="grupo" @cerrar="dial_aceptado = false"
            @guardado="clienteSeleccionado = null; stopBlink(); dial_aceptado = false" />
    </v-dialog>
</template>

<script>
import { gmapApi } from 'vue2-google-maps'
import store from '@/store/index'
import { llamarCliente, enviarWhatsApp, irGoogleMaps, chipColor, chipColorEntrega, estadoColorTexto } from './funciones'
import acepta_pedido from './dialogos/acepta_pedido.vue'
import dial_rechaza from './dialogos/rechaza_pedido.vue'
export default {
    name: "dial_mapa",
    props: {
        grupo: null,
        value: Boolean,            // v-model
        clientes: { type: Array, default: () => [] }, // << lista para “todos”
    },
    components: {
        dial_rechaza,
        acepta_pedido
    },
    data() {
        return {
            dial_aceptado: false,
            dial_rechazo: false,
            estadoFiltro: 'todos',
            estadosEntrega: ['todos', 'pendiente', 'entregado', 'reprogramado', 'rechazado'],   // {lat, lng}
            clienteSeleccionado: null,
            clienteSeleccionadoIndex: null,
            busqueda: '',                   // ✅ índice del cliente seleccionado
            blinkOn: false,                   // ✅ estado actual del parpadeo (true/false)
            blinkTimer: null,                 // ✅ guardamos el setInterval para limpiar luego  // objeto cliente clickeado
            dialogoMapa: false,
            ubicacionCliente: null, // {lat, lng}
            centro: { lat: -12.0464, lng: -77.0428 }, // Default Lima
            fullscreen: false,
            miPosicion: null,
            iconoMiPosicion: null,
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
            } else {
                // ✅ cuando se cierra desde el padre
                this.stopBlink()
            }
        },
        dialogoMapa(val) {
            this.$emit('input', val)
            if (!val) {
                // ✅ cuando se cierra internamente
                this.stopBlink()
            }
        },
        ubicacionActual(nueva) {
            if (nueva && nueva.lat && nueva.lng) {
                this.miPosicion = { lat: nueva.lat, lng: nueva.lng };
            }
        },
    },
    created() {
        console.log(this.clientes)
    },
    computed: {
        // ...lo que ya tienes...
        isMobile() { return this.$vuetify.breakpoint.smAndDown; },
        ubicacionActual() {
            return store.state.ubicacion_actual || null; // NUEVO
        },
        sugerenciasBusqueda() {
            const q = (this.busqueda || '').toString().trim().toLowerCase();

            const base = this.clientes
                .filter(c => c)
                .map(c => {
                    const dni = String(c.dni || c.documento || '').trim();
                    const nombre = c.cliente || c.nombre || '(Sin nombre)';
                    const dir = c.direccion || '';

                    const label = [dni, nombre]
                        .filter(x => x && x !== '')
                        .join(' • ');

                    return {
                        label,
                        valor: dni || nombre || dir,
                        ref: c,
                        estado_entrega: (c.estado_entrega || '').toLowerCase(),  // 👈 NUEVO
                    };
                });

            if (!q) {
                return base.slice(0, 20);
            }

            return base
                .filter(item => item.label.toLowerCase().includes(q))
                .slice(0, 20);
        },
        clientesFiltradosPorEstado() {
            const filtroEstado = (this.estadoFiltro || 'todos').toLowerCase();
            if (filtroEstado === 'todos') return this.clientes;
            return this.clientes.filter(c =>
                (c.estado_entrega || '').toLowerCase() === filtroEstado
            );
        },


    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown)

        this.$gmapApiPromiseLazy().then(() => {
            const gmaps = window.google.maps;

            const offset = new gmaps.Size(0, -40);
            this.infoOptions = { ...this.infoOptions, pixelOffset: offset };

            const ancho = 30;
            const alto = 30;

            this.iconoMiPosicion = {
                url: '/carga.png',
                size: new gmaps.Size(ancho, alto),
                scaledSize: new gmaps.Size(ancho, alto),
                anchor: new gmaps.Point(ancho / 2, alto),
                labelOrigin: new gmaps.Point(ancho / 2, 0)
            };
        });
    },
    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown)
        this.stopBlink()   // ✅ limpiar intervalo al destruir
    },
    methods: {
        chipColorEntrega,
        chipColor,
        llamarCliente,
        enviarWhatsApp,
        irGoogleMaps,
        estadoColorTexto,
        startBlink(index) {
            this.clienteSeleccionadoIndex = index
            this.blinkOn = true

            // si ya existe un intervalo viejo, lo limpiamos
            if (this.blinkTimer) clearInterval(this.blinkTimer)

            // alternar cada ~500ms
            this.blinkTimer = setInterval(() => {
                this.blinkOn = !this.blinkOn
            }, 500)
        },

        // ✅ detener parpadeo
        stopBlink() {
            this.clienteSeleccionadoIndex = null
            this.blinkOn = false
            if (this.blinkTimer) {
                clearInterval(this.blinkTimer)
                this.blinkTimer = null
            }
        },
        onSeleccionBusqueda(valorElegido) {

            if (!valorElegido) {
                // limpiaron el autocomplete

                this.stopBlink()
                return;
            }

            // buscamos dentro de sugerencias el item que coincide con el valor
            const item = this.sugerenciasBusqueda.find(x => x.valor === valorElegido);
            if (!item || !item.ref) return;

            const cli = item.ref;
            this.clienteSeleccionado = cli;

            // buscar también su índice real en this.clientes
            const idx = this.clientes.findIndex(c =>
                (c.id || c.documento) === (cli.id || cli.documento)
            );
            this.startBlink(idx); // ✅ parpadea ese punto

            if (this.isValidCoord(cli.latitud, cli.longitud)) {
                const pos = { lat: Number(cli.latitud), lng: Number(cli.longitud) };
                this.centro = pos;

                this.$nextTick(() => {
                    const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                    if (map) {
                        map.panTo(pos);
                        map.setZoom(17);
                    }
                });
            }
            this.$nextTick(() => {
                if (this.$refs.buscador && this.$refs.buscador.$refs.input) {
                    this.$refs.buscador.$refs.input.blur();
                }
            })

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


            // Refina mi posición con GPS del navegador (igual que ya tenías)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const actual = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        this.miPosicion = actual
                        if (!this.ubicacionCliente) this.centro = { ...actual }
                    },
                    () => { },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                )
            }
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

        iconoPorEstado(cli, i) {
            // íconos base
            const ICONS = {
                verde: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                rojo: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                celeste: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                naranja: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            };

            // 1. si este marcador es el seleccionado => modo parpadeo
            if (this.clienteSeleccionadoIndex === i) {
                // alterna rojo/verde según blinkOn
                const urlBlink = this.blinkOn ? ICONS.naranja : ICONS.verde;
                return {
                    url: urlBlink,
                    scaledSize: new window.google.maps.Size(32, 32),
                    anchor: new window.google.maps.Point(16, 32)
                };
            }

            // 2. si NO es el seleccionado => color normal por estado_entrega
            const estado = (cli && cli.estado_entrega) || '';
            let url = ICONS.celeste;
            if (estado === 'atendido' || estado === 'entregado') {
                url = ICONS.celeste;
            } else if (estado === 'rechazado') {
                url = ICONS.rojo;
            } else if (estado === 'pendiente') {
                url = ICONS.naranja;
            }

            return {
                url,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32)
            };
        },

        // cuando el usuario hace click directo en un marcador
        abreInfoCliente(cli, index) {
            this.clienteSeleccionado = cli;
            this.startBlink(index); // ✅ empieza el parpadeo en ese punto

            if (this.isValidCoord(cli.latitud, cli.longitud)) {
                const pos = { lat: Number(cli.latitud), lng: Number(cli.longitud) };
                this.centro = pos;

                this.$nextTick(() => {
                    const map = this.$refs.gmap && this.$refs.gmap.$mapObject;
                    if (map) {
                        map.panTo(pos);
                        map.setZoom(17);
                    }
                });
            }
        },



    }
}
</script>

<style scoped>
.fab-container {
    position: absolute;
    bottom: 20px;
    right: 14px;
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

.panel-cliente {
    position: fixed;
    /* flota sobre todo */
    top: 48px;
    /* justo debajo del app-bar (app-bar dense ~48px) */
    right: 18px;
    z-index: 5000;
    /* más alto que el mapa y los controles */
    max-width: 350px;
    min-width: 260px;
    color: #fff;
    font-size: 12px;
    line-height: 1.3;
    pointer-events: auto;
    /* para que sí se pueda clickear */
}

.panel-inner {
    background: rgba(0, 0, 0, 0.9);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, .6);
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, .2);
}

.panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 4px;
}

.panel-txt {
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.panel-doc {
    font-size: 15px;
    color: #ccc;
    line-height: 1.2;
}

.panel-dir {
    font-weight: 600;
    font-size: 12px;
    color: #fff;
    line-height: 1.2;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.panel-estado-line {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    margin-bottom: 6px;
}

.panel-monto {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
}

.panel-acciones {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 6px;
    flex-wrap: wrap;
}

/* ya existentes */
.fab-container {
    position: absolute;
    bottom: 24px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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

.autocomplete-item-row {
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 1.2;
    white-space: normal;
    /* por si es dirección larga */
}

.autocomplete-selection {
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.estado-pill {
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    border-radius: 3px;
    padding: 2px 4px;
    text-transform: lowercase;
}
</style>
