<template>
    <div class="mb-6 mt-2 pa-3">
        <v-row no-gutters class="mt-n1 mb-1">
            <v-col cols="4" class="pa-1">
                <v-btn v-if="false" @click="editar_masivo()" icon>
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <v-card @click.prevent="cliente_selecto = null, dial_cliente = true">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/clientes.png" />
                        <h5 class="text-center">Nuevo</h5>
                    </v-container>
                </v-card>
            </v-col>

            <v-col cols="4" class="pa-1">
                <v-card @click.prevent="ver_mapa">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/maps.png" />
                        <h5 class="text-center">Mapa</h5>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="4" class="pa-1">
                <v-card @click.prevent="dialtabla_zona = !dialtabla_zona">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/zonas.png" />
                        <h5 class="text-center">Zonas</h5>
                    </v-container>
                </v-card>
            </v-col>
        </v-row>

        <v-text-field class="mb-n3" outlined dense v-model="buscar" append-icon="mdi-magnify" label="BUSCAR" />
        <!-- DESKTOP / TABLET: deja tu data-table tal cual -->
        <v-card v-if="!isMobile">
            <v-data-table dense :headers="headers" :items="listaFiltrada" mobile-breakpoint="1" item-key="id">
                <template v-slot:item="{ item }">
                    <tr>
                        <td width="50">{{ item.documento }}</td>
                        <td>{{ item.nombre }}</td>
                        <td>{{ item.telefono || '-' }}</td>
                        <td>
                            <v-chip v-if="item.sede" small color="blue lighten-4" text-color="blue darken-2">
                                {{ (item.sede) }}
                            </v-chip>
                            <span v-else>-</span>
                        </td>
                        <td width="150">
                            <v-row>
                                <v-col cols="6" class="text-center">
                                    <v-icon color="green" @click="editar(item)">mdi-lead-pencil</v-icon>
                                </v-col>
                                <v-col cols="6" class="text-center">
                                    <v-icon color="blue" @click="abrirMapa(item)">mdi-map-marker</v-icon>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </template>

                <template v-slot:no-data>
                    <v-btn color="primary" @click="initialize">SHOW</v-btn>
                </template>
            </v-data-table>
        </v-card>

        <!-- MÓVIL: lista virtual con “card” ligera + footer de conteo -->
        <v-card v-else class="mobile-card d-flex flex-column">
            <div class="mobile-list">
                <recycle-scroller :items="listaFiltrada" :item-size="84" key-field="id" class="scroller">
                    <template #default="{ item }">
                        <div class="item-card">
                            <div class="item-main">
                                <div class="item-title">{{ item.nombre }}</div>
                                <div class="item-sub">Doc: {{ item.documento || '-' }} · {{ item.telefono || '-' }}
                                </div>
                                <div class="item-meta">
                                    Vend.: {{ item.sede || '-' }}
                                </div>
                            </div>
                            <div class="actions">
                                <v-btn icon small @click="abrirMapa(item)">
                                    <v-icon>mdi-map-marker</v-icon>
                                </v-btn>
                                <v-btn icon small @click="editar(item)" :disabled="false">
                                    <v-icon color="green">mdi-lead-pencil</v-icon>
                                </v-btn>
                                <v-menu offset-y v-if="false">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon small v-bind="attrs" v-on="on">
                                            <v-icon>mdi-dots-vertical</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click="eliminar(item)">
                                            <v-list-item-icon><v-icon
                                                    color="error">mdi-delete</v-icon></v-list-item-icon>
                                            <v-list-item-title>Borrar</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </div>
                        </div>
                    </template>
                </recycle-scroller>
            </div>

            <v-divider></v-divider>
            <v-card-actions class="py-1 px-3 d-flex justify-space-between">
                <span class="caption grey--text text--darken-1">Mostrando</span>
                <v-chip small color="primary" text-color="white" label>
                    {{ listaFiltrada.length }} clientes
                </v-chip>
            </v-card-actions>
        </v-card>


        <!-- Diálogos -->
        <dial_mapa v-model="dialogoMapa" :clienteEnMapa="clienteSeleccionado" :guardar_auto="true"
            @ubicacion-guardada="onUbicacionGuardada" />
        <mapa_clientes v-model="mostrarMapaClientes" :clientes="clientes" />
        <v-snackbar v-model="snackbar" :timeout="timeout" top>{{ text }}</v-snackbar>

        <nuevo_cli v-if="dial_cliente" @cierra="dial_cliente = $event; filtra()"
            @actualizar="dial_cliente = false, filtra()" :cliente_selecto="cliente_selecto" />
        <dial_tabla_zona v-if="dialtabla_zona" @cierra="dialtabla_zona = false" />
    </div>
</template>

<script>
import dial_mapa from './dial_mapa.vue'
import mapa_clientes from './mapa_clientes.vue'
import nuevo_cli from './agrega_cliente.vue'
import store from '@/store/index'
import { eliminaCliente, edita_campo_Cliente } from "../../db"
import dial_tabla_zona from './dialogos/tablas_zona.vue'
import { colClientes } from '../../db_firestore'
export default {
    components: { dial_mapa, mapa_clientes, nuevo_cli, dial_tabla_zona },

    data: () => ({
        dialtabla_zona: false,
        // UI
        clientes: [],
        buscar: '',
        headers: [
            { text: 'DOCUMENTO', value: 'documento' },
            { text: 'Nombre', value: 'nombre' },
            { text: 'Telefono', value: 'telefono' },
            { text: 'Sede', value: 'sede' },
            { text: 'Actions', value: 'actions', sortable: false }
        ],

        // diálogos
        dial_cliente: false,
        dialogoMapa: false,
        mostrarMapaClientes: false,

        // selección
        clienteSeleccionado: null,
        cliente_selecto: null,

        // feedback
        snackbar: false,
        text: '',
        timeout: 2000
    }),

    created() {
        // Carga inicial desde store
        this.filtra()
    },
    beforeDestroy() {
        if (this.unsub) this.unsub()
    },



    computed: {
        // Fuente de datos: no mutar aquí
        isMobile() {
            return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
        },

        // Filtro por texto (documento/nombre/distrito/telefono/nota/id)
        listaFiltrada() {
            const q = (this.buscar || '').toLowerCase().trim()
            if (!q) return this.clientes

            return this.clientes.filter((c) =>
                [
                    c.id,
                    c.documento,
                    c.nombre,
                    c.distrito,
                    c.telefono,
                    c.nota
                ]
                    .map((v) => String(v || '').toLowerCase())
                    .some((v) => v.includes(q))
            )
        }
    },
    watch: {
        dialogoMapa(nuevoValor) {
            if (nuevoValor === false) {
                this.filtra()
            }
        }
    },

    methods: {
        async filtra() {
            try {
                const snap = await colClientes().get()  // o más si quieres
                this.clientes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                console.log('Clientes cargados:', this.clientes.length)
            } catch (e) {
                console.error('Error cargando clientes:', e)
            }
        },

        initialize() {
            // Acción del botón no-data. Aquí podrías recargar clientes desde backend.
            this.filtra()
            this.snackbar = true
            this.text = 'Lista actualizada'
        },

        nombreSede(base) {
            if (!base) return '-'
            const sede = (store.state.array_sedes || []).find((s) => s.base == base)
            return sede ? sede.nombre : base
        },

        editar(item) {
            console.log(item)
            this.cliente_selecto = item
            this.dial_cliente = true
        },

        abrirMapa(cliente) {
            this.clienteSeleccionado = cliente
            this.dialogoMapa = true
        },

        ver_mapa() {
            this.mostrarMapaClientes = !this.mostrarMapaClientes
        },
        async eliminar(data) {
            if (confirm('Esta seguro de eliminar?')) {
                await eliminaCliente(data.id)
                //alert('cliente eliminado')
            }
        },
        onUbicacionGuardada(payload) {
            // Si quieres mostrar feedback luego de guardar coordenadas:
            this.snackbar = true
            this.text = 'Ubicación guardada'
            // Aquí podrías refrescar store.state.clientes si lo actualizas remotamente
        },
        editar_masivo() {
            store.state.clientes.forEach(async (cliente) => {

                console.log('Editando cliente:', cliente.nombre)
                edita_campo_Cliente(cliente.id, 'dia', 'dom')

            })


        }
    }
}
</script>
<style scoped>
/* Card a pantalla "casi" completa y scroller interno */
.mobile-card {
    height: 65dvh;
    /* mejor manejo en móviles modernos */
}

.mobile-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.scroller {
    flex: 1 1 auto;
    height: 100%;
    overflow: auto;
}

/* Ítem tipo “card” ligero para performance */
.item-card {
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: #fff;
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .08);

    padding: 10px 12px;
    margin: 6px 8px;
    min-height: 72px;
    /* ajusta y luego iguala item-size */
}

.item-title {
    font-size: 14px;
    font-weight: 550;
    line-height: 1.2;
}

.item-sub {
    font-size: 11px;
    color: #777;
    margin-top: 2px;
}

.item-meta {
    font-size: 12px;
    margin-top: 2px;
}

.actions>.v-btn {
    margin-left: 1px;
}

/* Asegura layout estable */
.item-card {
    display: flex;
    align-items: center;
}

/* El texto ocupa el espacio flexible y permite que acciones no se apreten */
.item-main {
    flex: 1 1 auto;
    min-width: 0;
    /* importante para elipsis */
}

/* Evita que los botones se vayan abajo */
.actions {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    /* <- clave */
    gap: 4px;
    /* espacio entre botones */
    flex: 0 0 auto;
    /* no crecer/encogerse */
}

/* Los botones no deben encogerse ni expandirse */
.actions .v-btn {
    flex: 0 0 auto;
}

/* Opcional: elipsis para títulos/líneas largas y evitar que empujen los botones */
.item-title,
.item-sub,
.item-meta {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>