<template>
    <div class="pa-1">


        <v-app-bar scroll-behavior="hide" class="mt-12" app color="" dark dense>
            <v-row dense>
                <v-btn v-if="!isMobile" small color="success" dark rounded depressed lock class="mt-1"
                    @click="dial_repartos = !dial_repartos">
                    <v-icon left>mdi-truck</v-icon>
                    Buscar Reparto
                </v-btn>
                <v-spacer></v-spacer>

                <v-text-field v-model="busqueda" outlined dense hide-details prepend-inner-icon="mdi-magnify"
                    label="Buscar cliente, DNI o dirección"></v-text-field>
                <v-select v-if="!isMobile" v-model="estadoFiltro" :items="estadosEntrega" outlined dense hide-details
                    class="ml-2" label="Estado" />
                <v-spacer></v-spacer>
                <v-btn v-if="!isMobile" small color="info" dark rounded depressed lock class="mt-1 mr-2"
                    @click="dial_cobranza = !dial_cobranza">
                    <v-icon left>mdi-cash-register</v-icon>
                    Cobranza
                </v-btn>
                <v-btn v-if="!isMobile" small color="error" dark rounded depressed lock class="mt-1"
                    @click="estadoFiltro = 'todos'; dialogoMapa_reparto = !dialogoMapa_reparto">
                    <v-icon left>mdi-map-marker</v-icon>
                    Modo Mapa
                </v-btn>
                <v-menu v-if="isMobile" offset-y :close-on-content-click="false" transition="scale-transition"
                    max-width="320" class="mt-12">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn icon small v-bind="attrs" v-on="on">
                            <v-icon left>mdi-cog</v-icon>
                        </v-btn>
                    </template>

                    <!-- Panel de filtros en móvil -->
                    <v-card class="pa-3" tile>
                        <v-select v-model="estadoFiltro" :items="estadosEntrega" outlined dense hide-details
                            label="Estado" class="mb-2" />

                        <v-divider class="my-2" />

                        <v-list dense>
                                   <v-list-item @click="dial_cobranza = !dial_cobranza">
                                <v-list-item-icon><v-icon color="info">mdi-cash-register</v-icon></v-list-item-icon>
                                <v-list-item-title>Ver Cobranza</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="dial_repartos = !dial_repartos">
                                <v-list-item-icon><v-icon color="error">mdi-truck</v-icon></v-list-item-icon>
                                <v-list-item-title>Buscar Reparto</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-menu>
            </v-row>
        </v-app-bar>
        <v-card class="mt-12" v-if="!isMobile">
            <v-simple-table fixed-header height="75vh" dense>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Cliente</th>
                        <th>Dirección</th>
                        <th>Estado</th>
                        <th>Total S/.</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in pedidosFiltrados" :key="pedido.id">
                        <td style="font-size:75%;">{{ pedido.id }}</td>
                        <td style="font-size:75%;">{{ pedido.dni }} - {{ pedido.cliente }}</td>
                        <td style="font-size:75%;">{{ pedido.direccion }}</td>
                        <td style="font-size:75%;">
                            <v-chip x-small :color="chipColorEntrega(pedido.estado_entrega)" dark label>
                                {{ (pedido.estado_entrega) }}
                            </v-chip>
                        </td>
                        <td style="font-size:75%;">{{ pedido.total }}</td>
                        <td style="font-size:75%;">
                            <v-row dense>
                                <v-col cols="4" class="text-center">
                                    <v-menu offset-y>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn :disabled="!pedido.latitud || !pedido.longitud" color="info" x-small
                                                v-bind="attrs" v-on="on">
                                                <v-icon small>mdi-map-marker</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list dense>
                                            <v-list-item @click="irGoogleMaps(pedido)">
                                                <v-list-item-icon><v-icon
                                                        color="error">mdi-navigation</v-icon></v-list-item-icon>
                                                <v-list-item-title>Ir Google Maps</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="item_selecto = pedido; dialogoMapa = true">
                                                <v-list-item-icon><v-icon
                                                        color="success">mdi-map-marker</v-icon></v-list-item-icon>
                                                <v-list-item-title>Ver Mapa</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <v-btn :disabled="pedido.estado_entrega != 'pendiente'" x-small color="success"
                                        @click="item_selecto = pedido; dial_aceptado = !dial_aceptado">
                                        <v-icon small>mdi-check</v-icon>
                                    </v-btn>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <v-btn :disabled="pedido.estado_entrega != 'pendiente'" x-small color="error"
                                        @click="item_selecto = pedido; dial_rechazo = !dial_rechazo">
                                        <v-icon small>mdi-close</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>

        <!-- 📱 VISTA PARA CELULARES -->
        <v-container v-else fluid class="mt-12 mb-12">
            <v-row dense>
                <v-col v-for="pedido in displayedPedidos" :key="pedido.id" cols="12" class="pb-0">
                    <v-card outlined class="mb-1 pa-2" style="font-size: 80%;">
                        <v-row dense>
                            <v-col cols="8">
                                <strong>{{ pedido.cliente }}</strong><br>
                                <small>{{ pedido.direccion }}</small><br>
                                <v-chip x-small :color="chipColorEntrega(pedido.estado_entrega)" dark label>
                                    {{ (pedido.estado_entrega) }}
                                </v-chip>
                            </v-col>
                            <v-col cols="4" class="text-right">
                                <div><strong>S/. {{ pedido.total }}</strong></div>
                                <div><small>Doc: {{ pedido.id }}</small></div>
                            </v-col>
                        </v-row>
                        <v-divider class="my-1"></v-divider>
                        <v-row dense>
                            <v-col cols="3" class="text-center">
                                <v-menu offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn :disabled="!pedido.latitud || !pedido.longitud" color="info" x-small
                                            v-bind="attrs" v-on="on">
                                            <v-icon small>mdi-map-marker</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click="irGoogleMaps(pedido)">
                                            <v-list-item-icon><v-icon
                                                    color="error">mdi-navigation</v-icon></v-list-item-icon>
                                            <v-list-item-title>Ir Google Maps</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="item_selecto = pedido; dialogoMapa = true">
                                            <v-list-item-icon><v-icon
                                                    color="success">mdi-map-marker</v-icon></v-list-item-icon>
                                            <v-list-item-title>Ver Mapa</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </v-col>
                            <v-col cols="3" class="text-center">
                                <v-menu offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn :disabled="!pedido.telefono" color="success" x-small v-bind="attrs"
                                            v-on="on">
                                            <v-icon small>mdi-whatsapp</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click="enviarWhatsApp(pedido)">
                                            <v-list-item-icon><v-icon
                                                    color="success">mdi-whatsapp</v-icon></v-list-item-icon>
                                            <v-list-item-title>Whatsapp</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click=" llamarCliente(pedido)">
                                            <v-list-item-icon><v-icon color="info">mdi-phone</v-icon></v-list-item-icon>
                                            <v-list-item-title>Llamar</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </v-col>
                            <v-col cols="3" class="text-center">
                                <v-btn :disabled="pedido.estado_entrega != 'pendiente'" x-small color="warning"
                                    @click="item_selecto = pedido; dial_aceptado = !dial_aceptado">
                                    <v-icon small>mdi-check</v-icon>
                                </v-btn>
                            </v-col>
                            <v-col cols="3" class="text-center">
                                <v-btn :disabled="pedido.estado_entrega != 'pendiente'" x-small color="error"
                                    @click="item_selecto = pedido; dial_rechazo = !dial_rechazo">
                                    <v-icon small>mdi-close</v-icon>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-col>
            </v-row>
            <div class="text-center py-4" v-if="displayedPedidos.length < pedidosFiltrados.length">
                <v-btn small outlined @click="verMas">Ver más ({{ displayedPedidos.length }}/{{ pedidosFiltrados.length
                }})</v-btn>
            </div>
        </v-container>
        <dial_mapas v-model="dialogoMapa"
            :clienteEnMapa="{ nombre: item_selecto.cliente, latitud: item_selecto.latitud, longitud: item_selecto.longitud, documento: item_selecto.dni }"
            :ver-todos="false" :guardar_auto="false" @cierra="dialogoMapa = false" />
        <mapa_reparto v-model="dialogoMapa_reparto" :clientes="pedidosFiltrados" />
        <dial_rechaza v-if="dial_rechazo" :item_selecto="item_selecto" @cerrar="dial_rechazo = false"
            @guardado=" dial_rechazo = false" />
        <busca_reparto v-if="dial_repartos" @seleccionado="ver_reparto($event), dial_repartos = false"
            @cerrar="dial_repartos = false" />
        <div v-if="isMobile && !dialogoMapa_reparto && pedidosFiltrados.length > 0" class="fab-mobile">

            <v-btn color="success" dark class="mb-2" @click="estadoFiltro = 'todos'; dialogoMapa_reparto = true">
                Mapa
                <v-icon>mdi-map-marker</v-icon>
            </v-btn>
        </div>
        <acepta_pedido v-if="dial_aceptado" :item_selecto="item_selecto" @cerrar="dial_aceptado = false"
            @guardado=" dial_aceptado = false" />
        <cobranza_reparto v-if="dial_cobranza" :pedidos="pedidosFiltrados" :grupo="repartoActual" @cerrar="dial_cobranza = false" />
    </div>
</template>

<script>
import moment from "moment";
import { all_Cabecera_p } from "../../db";
import { colClientes } from '../../db_firestore'
import dial_mapas from '../clientes/dial_mapa.vue'
import mapa_reparto from './mapa_reparto.vue'
import dial_rechaza from './dialogos/rechaza_pedido.vue'
import busca_reparto from './dialogos/buscar_reparto.vue'
import acepta_pedido from './dialogos/acepta_pedido.vue'
import cobranza_reparto from './dialogos/cobranza_reparto.vue'
import { llamarCliente, enviarWhatsApp, irGoogleMaps, chipColor, chipColorEntrega } from './funciones'
export default {
    components: { dial_mapas, mapa_reparto, dial_rechaza, busca_reparto, acepta_pedido, cobranza_reparto },
    data() {
        return {
            dial_cobranza: false,
            estadoFiltro: 'pendiente',
            estadosEntrega: ['todos', 'pendiente', 'entregado', 'reprogramado', 'rechazado'],
            dial_repartos: false,
            dialogoMapa: false,
            dialogoMapa_reparto: false,
            dial_rechazo: false,
            dial_aceptado: false,
            lista_pedidos: [],
            item_selecto: [],
            motivo_rechazo: '',
            busqueda: '',
            page: 1,
            pageSize: 10, // cantidad por “página” en móvil
            repartoActual: null,        // guarda el id_grupo actual
            repartoRef: null,           // referencia firebase actual
            repartoListener: null,      // callback actual
        };
    },
    created() {
        // Si hay datos guardados en sessionStorage, recupéralos
        const saved = sessionStorage.getItem("num_reparto");
        if (saved) {
            this.ver_reparto({ grupo: saved })
            console.log("🟢 Reparto restaurado desde sessionStorage:", saved);
        }
    },

    computed: {
        isMobile() { return this.$vuetify.breakpoint.smAndDown; },
        pedidosFiltrados() {
            const q = this.busqueda.trim().toLowerCase();
            const estadoSel = (this.estadoFiltro || 'todos').toLowerCase();

            return this.lista_pedidos.filter(p => {
                // Filtro de texto
                const okTexto = !q || (
                    (p.cliente || '').toLowerCase().includes(q) ||
                    (String(p.dni || '')).toLowerCase().includes(q) ||
                    (p.direccion || '').toLowerCase().includes(q)
                );

                // Filtro de estado
                const estadoPedido = (p.estado_entrega || '').toLowerCase();
                const okEstado = estadoSel === 'todos' || estadoPedido === estadoSel;

                return okTexto && okEstado;
            });
        },
        displayedPedidos() {
            // en escritorio mostramos todo; en móvil, por páginas
            if (!this.isMobile) return this.pedidosFiltrados;
            const end = this.page * this.pageSize;
            return this.pedidosFiltrados.slice(0, end);
        },
    },

    watch: {
        pedidosFiltrados() { this.page = 1; },
        busqueda() { this.page = 1; },
        estadoFiltro() { this.page = 1; },
    },

    beforeDestroy() {
        // Cuando cambies de ruta o cierres pestaña, se limpia
        sessionStorage.removeItem("num_reparto");
        if (this.repartoRef && this.repartoListener) {
            this.repartoRef.off("value", this.repartoListener);
        }
    },
    methods: {
        verMas() {
            this.page += 1;
        },
        async ver_reparto(reparto) {
            console.log("Seleccionando reparto:", reparto);

            const grupoId = reparto.grupo;

            // guarda en sessionStorage para persistencia
            sessionStorage.setItem("num_reparto", String(grupoId));

            // cierra diálogo de selección si estaba abierto
            this.dial_repartos = false;

            // 🔄 si ya había un listener anterior, lo apagamos
            if (this.repartoRef && this.repartoListener) {
                this.repartoRef.off("value", this.repartoListener);
            }

            // guarda cuál es el reparto actual
            this.repartoActual = grupoId;

            // crea la ref al nodo de cabecera de este grupo
            // OJO: asumo que all_Cabecera_p(grupoId) devuelve la ref tipo firebase.database().ref(...)
            const ref = all_Cabecera_p(grupoId);

            // definimos el callback y lo guardamos para poder hacer off luego
            const listener = async (snap) => {
                const cabecera = snap.val() || {};

                // armamos array de pedidos
                const pedidos = Object.keys(cabecera).map(key => {
                    const p = cabecera[key] || {};
                    p.id = key;
                    p.estado_entrega = p.estado_entrega || "pendiente";
                    return p;
                });

                // seteamos en data
                this.lista_pedidos = pedidos;

                // enriquecemos con datos de firestore (teléfono, coords)
                await this.cargarClientesParaPedidos();

                // IMPORTANTE: si el item_selecto que tenías abierto en modal/mapa
                // pertenece a este mismo reparto, refrescarlo para que el estado_entrega
                // nuevo se vea sin tener que reabrir nada
                if (this.item_selecto && this.item_selecto.id) {
                    const actualizado = this.lista_pedidos.find(p => p.id === this.item_selecto.id);
                    if (actualizado) {
                        this.item_selecto = actualizado;
                    }
                }
            };

            // enganchar listener "en vivo"
            ref.on("value", listener);

            // guardar ref y listener para apagarlos más tarde
            this.repartoRef = ref;
            this.repartoListener = listener;
        },

        async cargarClientesParaPedidos() {
            // 1) DNIs únicos desde la lista actual de pedidos
            const dnis = [...new Set(
                this.lista_pedidos
                    .map(p => String(p.dni || p.documento || '').trim())
                    .filter(Boolean)
            )];
            if (!dnis.length) return;

            // 2) Firestore limita 'in' a 10 valores → dividir en bloques de 10
            const bloques = [];
            for (let i = 0; i < dnis.length; i += 10) bloques.push(dnis.slice(i, i + 10));

            // 3) Traer solo esos clientes
            const lotes = await Promise.all(
                bloques.map(b => colClientes().where('documento', 'in', b).get())
            );

            // 4) Indexar por DNI/documento
            const byDoc = {};
            lotes.forEach(snap => {
                snap.forEach(doc => {
                    const c = { id: doc.id, ...doc.data() };
                    const key = String(c.documento || '').trim();
                    if (key) byDoc[key] = c;
                });
            });

            // 5) Enriquecer los pedidos con teléfono / GPS / (fallback de dirección)
            this.lista_pedidos = this.lista_pedidos.map(p => {
                const key = String(p.dni || p.documento || '').trim();
                const c = byDoc[key];
                console.log("Enriqueciendo pedido", p.ubicacion, "con cliente:", c);
                return {
                    ...p,
                    telefono: c?.telefono ?? p.telefono ?? '',
                    latitud: p.ubicacion.lat,
                    longitud: p.ubicacion.lng,
                };
            });
        },

        irGoogleMaps,
        enviarWhatsApp,
        llamarCliente,
        chipColor,
        chipColorEntrega,
    },
};
</script>
<style scoped>
.fab-mobile {
    position: fixed;
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 9999;
}
</style>