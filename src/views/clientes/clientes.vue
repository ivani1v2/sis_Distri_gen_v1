<template>
    <div class="mb-6 mt-2 pa-3">
        <v-row no-gutters class="mt-n1 mb-1">
            <v-col :cols="isMobile ? 4 : 3" class="pa-1">
                <v-card @click.prevent="cliente_selecto = null, dial_cliente = true">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/clientes.png" />
                        <h5 class="text-center">Nuevo</h5>
                    </v-container>
                </v-card>
            </v-col>

            <v-col :cols="isMobile ? 4 : 3" class="pa-1">
                <v-card @click.prevent="ver_mapa">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/maps.png" />
                        <h5 class="text-center">Mapa</h5>
                    </v-container>
                </v-card>
            </v-col>

            <v-col :cols="isMobile ? 4 : 3" class="pa-1">
                <v-card @click.prevent="dialtabla_zona = !dialtabla_zona">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/zonas.png" />
                        <h5 class="text-center">Zonas</h5>
                    </v-container>
                </v-card>
            </v-col>

            <!-- Solo en escritorio se muestra este -->
            <v-col v-if="!isMobile" cols="3" class="pa-1">
                <v-card @click="dialMasivo = true">
                    <v-container>
                        <v-img class="mx-auto" height="30" width="30" src="/convertir.png" />
                        <h5 class="text-center">Modificar masivo</h5>
                    </v-container>
                </v-card>
            </v-col>
        </v-row>


        <!-- 🔎 BUSCAR + FILTROS -->
        <v-row dense>
            <!-- Buscar SIEMPRE visible -->
            <v-col :cols="isMobile ? 8 : 4">
                <v-text-field class="mb-n3" outlined dense v-model="buscar" append-icon="mdi-magnify" label="BUSCAR" />
            </v-col>

            <!-- Desktop / tablet: selects normales -->
            <template v-if="!isMobile">
                <v-col cols="4">
                    <v-select v-model="zona" :items="zonasConTodas" item-text="nombre" item-value="nombre" label="Zona"
                        outlined dense />
                </v-col>

                <v-col cols="4">
                    <v-select v-model="dia" :items="diasConTodos" label="Día" outlined dense />
                </v-col>
            </template>

            <!-- Mobile: botón FILTROS que abre menú con los selects -->
            <template v-else>
                <v-col cols="4" class="d-flex justify-end">
                    <v-menu offset-y bottom :close-on-content-click="false">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn small color="primary" dark v-bind="attrs" v-on="on" block>
                                <v-icon left small>mdi-filter-variant</v-icon>
                                Opciones
                            </v-btn>
                        </template>

                        <v-card class="pa-3" style="min-width: 220px;">
                            <v-select v-model="zona" :items="zonasConTodas" item-text="nombre" item-value="nombre"
                                label="Zona" outlined dense class="mb-3" />

                            <v-select v-model="dia" :items="diasConTodos" label="Día" outlined dense class="mb-3" />

                            <!-- 🔘 Botón Modificar masivo (solo visible en móvil) -->
                            <v-btn small color="success" dark block @click="dialMasivo = true">
                                <v-icon left small>mdi-pencil</v-icon>
                                Modificar masivo
                            </v-btn>
                        </v-card>

                    </v-menu>
                </v-col>
            </template>

        </v-row>

        <!-- DESKTOP / TABLET -->
        <v-card v-if="!isMobile">
            <v-data-table dense :headers="headers" :items="listaFiltrada" mobile-breakpoint="1" item-key="id">
                <template v-slot:item="{ item }">
                    <tr>
                        <td width="50">{{ item.documento }}</td>
                        <td>{{ item.nombre }}</td>
                        <td>{{ item.telefono || '-' }}</td>
                        <td>{{ formateaDia(item.dia) }}</td>
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

        <!-- MÓVIL -->
        <v-card v-else class="mobile-card d-flex flex-column">
            <div class="mobile-list">
                <recycle-scroller :items="listaFiltrada" :item-size="84" key-field="id" class="scroller">
                    <template #default="{ item }">
                        <div class="item-card">
                            <div class="item-main">
                                <div class="item-title">{{ item.nombre }}</div>
                                <div class="item-sub">
                                    Doc: {{ item.documento || '-' }} · {{ item.telefono || '-' }}
                                </div>
                                <div class="item-meta">
                                    Vend.: {{ item.sede || '-' }} · Día: {{ formateaDia(item.dia) }}
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
                                            <v-list-item-icon>
                                                <v-icon color="error">mdi-delete</v-icon>
                                            </v-list-item-icon>
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
        <v-snackbar v-model="snackbar" :timeout="timeout" top>
            {{ text }}
        </v-snackbar>
        <!-- DIALOGO MODIFICACION MASIVA -->
        <v-dialog v-model="dialMasivo" max-width="400">
            <v-card>
                <v-toolbar dense color="primary" dark>
                    <v-toolbar-title style="font-size: 15px">Modificación Masiva</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialMasivo = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-card-text class="pt-3">
                    <h4 class="grey--text text--darken-1 mb-4" style="font-size:13px;">
                        Se aplicará a <b>{{ listaFiltrada.length }}</b> clientes visibles actualmente.
                        <br />
                        <span class="red--text" style="font-size:12px;">
                            Solo se modifican los campos marcados.
                        </span>
                    </h4>

                    <!-- ZONA -->
                    <v-row no-gutters class="align-center mb-3">
                        <v-col cols="2" class="text-center">
                            <v-checkbox v-model="cambiaZona" hide-details dense class="ma-0 pa-0"></v-checkbox>
                        </v-col>

                        <v-col cols="10">
                            <v-select v-model="nuevoZona" :items="zonasConTodas.filter(z => z.nombre !== 'TODAS')"
                                item-text="nombre" item-value="nombre" label="Nueva zona" outlined dense
                                :disabled="!cambiaZona" />
                        </v-col>
                    </v-row>

                    <!-- DIA -->
                    <v-row no-gutters class="align-center mb-1">
                        <v-col cols="2" class="text-center">
                            <v-checkbox v-model="cambiaDia" hide-details dense class="ma-0 pa-0"></v-checkbox>
                        </v-col>

                        <v-col cols="10">
                            <v-select v-model="nuevoDia" :items="diasConTodos.filter(d => d !== 'TODOS')"
                                label="Nuevo día" outlined dense :disabled="!cambiaDia" />
                        </v-col>
                    </v-row>
                </v-card-text>


                <v-card-actions class="justify-end">
                    <v-btn text @click="dialMasivo = false">Cancelar</v-btn>
                    <v-btn color="success" dark @click="aplicarMasivo">Aplicar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
import { colClientes, crearOActualizarCliente } from '../../db_firestore'
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
            { text: 'Dia', value: 'dia' },
            { text: 'Vend', value: 'sede' },
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
        timeout: 2000,
        zona: 'TODAS',   // 👈 ya estaba
        dia: 'TODOS',    // 👈 NUEVO
        dialMasivo: false,
        nuevoZona: null,
        nuevoDia: null,
        cambiaZona: false, // ← check para zona
        cambiaDia: false,  // ← check para dia
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
        zonasConTodas() {
            const base = Array.isArray(this.$store.state.zonas)
                ? this.$store.state.zonas
                : [];

            // este array en tu store parece ser algo tipo [{nombre:'NORTE'},...]
            return [{ nombre: 'TODAS' }, ...base];
        },

        diasConTodos() {
            // puede venir como ['lun','mar',...] o como [{text:'Lunes',value:'lun'}, ...]
            // vamos a soportar ambas formas:
            const raw = this.$store.state.dia_filt || [];

            // normalizamos a array plano de strings
            const lista = raw.map(d => {
                if (typeof d === 'string') return d;
                if (d && d.value) return d.value;
                return d; // fallback
            }).filter(Boolean);

            // anteponemos 'TODOS'
            // (si ya lo tienes en el store no pasa nada que se repita uno visualmente, pero normalmente no lo traes)
            return ['TODOS', ...lista];
        },

        isMobile() {
            return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
        },

        // Filtro por texto (documento/nombre/distrito/telefono/nota/id)
        listaFiltrada() {
            const q = (this.buscar || '').toLowerCase().trim();
            const zonaSel = (this.zona || 'TODAS').toString().toLowerCase();
            const diaSel = (this.dia || 'TODOS').toString().toLowerCase();

            // 1️⃣ filtro por zona
            let base = this.clientes.filter(c => {
                if (zonaSel === 'todas') return true;

                // el cliente puede tener zona o sede
                const zCliente = (c.zona || c.sede || '').toString().toLowerCase();
                return zCliente === zonaSel;
            });

            // 2️⃣ filtro por día
            base = base.filter(c => {
                if (diaSel === 'todos') return true;

                const d = c.dia;

                // caso 1: string directo "lun"
                if (typeof d === 'string') {
                    return d.toLowerCase() === diaSel;
                }

                // caso 2: array ["lun","mar", ...]
                if (Array.isArray(d)) {
                    // normalizamos a lower-case y vemos si incluye el seleccionado
                    return d
                        .map(x => String(x || '').toLowerCase())
                        .includes(diaSel);
                }

                // caso 3: nada definido
                return false;
            });

            // 3️⃣ filtro por texto/buscar
            if (!q) return base;

            return base.filter((c) =>
                [
                    c.id,
                    c.documento,
                    c.nombre,
                    c.distrito,
                    c.telefono,
                    c.nota
                ]
                    .map(v => String(v || '').toLowerCase())
                    .some(v => v.includes(q))
            );
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
        async aplicarMasivo() {
            // Validación: al menos uno marcado
            if (!this.cambiaZona && !this.cambiaDia) {
                this.snackbar = true;
                this.text = "Seleccione qué campo desea modificar";
                return;
            }

            // Validación: si marcó algo, debe escoger valor
            if (this.cambiaZona && !this.nuevoZona) {
                this.snackbar = true;
                this.text = "Seleccione la nueva zona";
                return;
            }
            if (this.cambiaDia && !this.nuevoDia) {
                this.snackbar = true;
                this.text = "Seleccione el nuevo día";
                return;
            }
            store.commit('dialogoprogress')
            // Construye las writes
            const actualizaciones = this.listaFiltrada.map(async (cli) => {
                const data = {};
                if (this.cambiaZona) {
                    data.zona = this.nuevoZona;
                }
                if (this.cambiaDia) {
                    data.dia = this.nuevoDia;
                }
                return crearOActualizarCliente(cli.id, data);
            });

            try {
                await Promise.all(actualizaciones);

                this.text = "Actualización masiva completada";
                this.snackbar = true;

                // cerrar diálogo
                this.dialMasivo = false;

                // limpiar switches y valores
                this.cambiaZona = false;
                this.cambiaDia = false;
                this.nuevoZona = null;
                this.nuevoDia = null;

                // recargar clientes
                store.commit('dialogoprogress')
                this.filtra();

            } catch (e) {
                console.error("Error en actualización masiva:", e);
                this.text = "Error al aplicar cambios";
                this.snackbar = true;
            }
        },


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


        },
        formateaDia(dia) {
            if (!dia) return '-';

            // si es string ("mar")
            if (typeof dia === 'string') {
                return dia;
            }

            // si es array (["mar","jue"])
            if (Array.isArray(dia)) {
                // unimos con coma y espacio: "mar, jue"
                return dia.join(', ');
            }

            return '-';
        },

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