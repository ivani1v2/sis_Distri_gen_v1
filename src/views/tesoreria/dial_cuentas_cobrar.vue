<template>
    <v-dialog v-model="showDialog" :fullscreen="isMobile" :max-width="isMobile ? undefined : '1100'" persistent>
        <v-card class="rounded-lg">
            <v-toolbar :color="isMobile ? 'orange darken-2' : 'orange darken-2'" dark dense
                :height="isMobile ? 48 : undefined">
                <v-icon left>mdi-cash-multiple</v-icon>
                <v-toolbar-title>Cuentas por Cobrar Pendientes</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <v-row dense class="mb-3">
                    <v-col :cols="isMobile ? 12 : 4">
                        <v-select outlined dense hide-details v-model="origenSeleccionado" :items="origenesDisponibles"
                            item-text="nombreCompleto" item-value="base" label="Origen (BD)"
                            prepend-inner-icon="mdi-database" return-object>
                            <template v-slot:selection="{ item }">
                                <v-chip small :color="getOrigenColor(item.base)" dark>
                                    {{ item.base }} - {{ item.nombre }}
                                </v-chip>
                            </template>
                        </v-select>
                    </v-col>

                    <v-col :cols="isMobile ? 8 : 5">
                        <v-text-field outlined dense hide-details v-model="busqueda" label="Buscar cliente/documento"
                            prepend-inner-icon="mdi-magnify" clearable />
                    </v-col>

                    <v-col :cols="isMobile ? 4 : 3">
                        <v-btn color="primary" @click="cargarDatos" block :loading="cargando"
                            :height="isMobile ? 40 : undefined">
                            <v-icon left v-if="!isMobile">mdi-refresh</v-icon>
                            <span v-if="!isMobile">Actualizar</span>
                            <v-icon v-else>mdi-refresh</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <v-alert type="info" dense text class="mb-3">
                    <v-row dense>
                        <v-col :cols="isMobile ? 6 : 4">
                            <strong>Total:</strong> S/. {{ totalPendiente.toFixed(2) }}
                        </v-col>
                        <v-col :cols="isMobile ? 6 : 4">
                            <strong>Registros:</strong> {{ listaFiltrada.length }}
                        </v-col>
                        <v-col :cols="isMobile ? 12 : 4" class="mt-1 mt-md-0">
                            <strong>Origen:</strong>
                            <v-chip x-small :color="getOrigenColor(origenSeleccionado?.base)" dark class="ml-1">
                                {{ origenSeleccionado?.base || 'Ninguno' }}
                            </v-chip>
                        </v-col>
                    </v-row>
                </v-alert>

                <v-data-table v-if="!isMobile" :headers="headers" :items="listaFiltrada" :items-per-page="10"
                    :loading="cargando" dense fixed-header height="400px" class="elevation-1"
                    no-data-text="No hay cuentas por cobrar pendientes" :footer-props="{
                        'items-per-page-options': [10, 25, 50, -1],
                        'items-per-page-text': 'Filas por página'
                    }">
                    <template #[`item.doc_ref`]="{ item }">
                        <span class="font-weight-bold primary--text">{{ item.doc_ref }}</span>
                    </template>

                    <template #[`item.cliente`]="{ item }">
                        <div class="font-weight-medium">{{ item.nombre || 'SIN NOMBRE' }}</div>
                        <div class="caption grey--text">{{ item.documento || '---' }}</div>
                    </template>

                    <template #[`item.fecha`]="{ item }">
                        <v-chip x-small color="blue-grey lighten-4">
                            {{ formatFecha(item.fecha) }}
                        </v-chip>
                    </template>

                    <template #[`item.fecha_vence`]="{ item }">
                        <v-chip x-small :color="esVencido(item.fecha_vence) ? 'red lighten-4' : 'green lighten-4'">
                            {{ formatFecha(item.fecha_vence) }}
                        </v-chip>
                    </template>

                    <template #[`item.monto_total`]="{ item }">
                        <span class="font-weight-bold">S/. {{ redondear(item.monto_total) }}</span>
                    </template>

                    <template #[`item.monto_pendiente`]="{ item }">
                        <span class="font-weight-bold red--text">S/. {{ redondear(item.monto_pendiente) }}</span>
                    </template>

                    <template #[`item.pagado`]="{ item }">
                        <span class="font-weight-bold green--text">S/. {{ redondear(item.pagado) }}</span>
                    </template>

                    <template #[`item.vendedor`]="{ item }">
                        <v-chip x-small color="purple lighten-4">
                            {{ item.vendedor || '---' }}
                        </v-chip>
                    </template>
                </v-data-table>

                <div v-else class="cards-container">
                    <v-card v-for="item in itemsMostrados" :key="item.id" outlined class="mb-2 rounded-lg"
                        :class="{ 'vencido': esVencido(item.fecha_vence) }">
                        <v-card-title class="py-1 px-2 blue-grey lighten-5">
                            <div class="d-flex justify-space-between align-center" style="width: 100%;">
                                <div>
                                    <v-chip x-small color="primary" class="font-weight-bold">
                                        {{ item.doc_ref }}
                                    </v-chip>
                                </div>
                                <div>
                                    <v-chip x-small :color="esVencido(item.fecha_vence) ? 'red' : 'green'" dark>
                                        {{ esVencido(item.fecha_vence) ? 'VENCIDO' : 'AL DÍA' }}
                                    </v-chip>
                                </div>
                            </div>
                        </v-card-title>

                        <v-card-text class="py-2 px-2">
                            <div class="d-flex align-center mb-1">
                                <v-icon x-small color="grey" class="mr-1">mdi-account</v-icon>
                                <span class="font-weight-bold body-2">{{ item.nombre }}</span>
                            </div>

                            <div class="d-flex align-center mb-1">
                                <v-icon x-small color="grey" class="mr-1">mdi-card-account-details</v-icon>
                                <span class="caption">{{ item.documento || '---' }}</span>
                            </div>

                            <div class="d-flex justify-space-between mb-1">
                                <div class="d-flex align-center">
                                    <v-icon x-small color="grey" class="mr-1">mdi-calendar</v-icon>
                                    <span class="caption">E: {{ formatFecha(item.fecha) }}</span>
                                </div>
                                <div class="d-flex align-center">
                                    <v-icon x-small color="grey" class="mr-1">mdi-calendar-clock</v-icon>
                                    <span class="caption">V: {{ formatFecha(item.fecha_vence) }}</span>
                                </div>
                            </div>

                            <v-row dense class="mt-1">
                                <v-col cols="4" class="text-center">
                                    <div class="caption grey--text">Total</div>
                                    <div class="font-weight-bold body-2">S/. {{ redondear(item.monto_total) }}</div>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <div class="caption grey--text">Pagado</div>
                                    <div class="font-weight-bold green--text body-2">S/. {{ redondear(item.pagado) }}
                                    </div>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <div class="caption grey--text">Pendiente</div>
                                    <div class="font-weight-bold red--text body-2">S/. {{
                                        redondear(item.monto_pendiente) }}</div>
                                </v-col>
                            </v-row>

                            <div v-if="item.vendedor" class="d-flex align-center mt-1">
                                <v-icon x-small color="grey" class="mr-1">mdi-account-tie</v-icon>
                                <v-chip x-small color="purple lighten-4" class="caption">
                                    {{ item.vendedor }}
                                </v-chip>
                            </div>
                        </v-card-text>
                    </v-card>

                    <div v-if="itemsMostrados.length < listaFiltrada.length" class="text-center pa-3">
                        <v-btn color="primary" outlined block @click="cargarMasItems" :loading="cargandoMas"
                            class="mb-2">
                            <v-icon left>mdi-arrow-down</v-icon>
                            Ver más ({{ itemsMostrados.length }} de {{ listaFiltrada.length }})
                        </v-btn>
                    </div>

                    <div v-if="!cargandoMas && itemsMostrados.length >= listaFiltrada.length && listaFiltrada.length > 0"
                        class="text-center pa-3 grey--text caption">
                        <v-icon small color="grey">mdi-check-circle</v-icon>
                        Mostrando todos los {{ listaFiltrada.length }} registros
                    </div>

                    <div v-if="listaFiltrada.length === 0 && !cargando" class="text-center pa-4">
                        <v-icon size="48" color="grey lighten-1">mdi-cash-off</v-icon>
                        <p class="grey--text mt-2">No hay cuentas por cobrar pendientes</p>
                    </div>
                </div>

                <div v-if="cargando && cuentas.length === 0" class="text-center pa-4">
                    <v-progress-circular indeterminate color="orange"></v-progress-circular>
                    <p class="grey--text mt-2">Cargando cuentas...</p>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { db } from '../../db'
import { all_flujo_teso, cuentasxcobrar_por_bd, todas_las_bd_por_ruc } from '../../db'
import moment from 'moment'
import store from '@/store/index'

export default {
    name: 'DialCuentasCobrar',

    props: {
        value: {
            type: Boolean,
            default: false
        }
    },

    data: () => ({
        cargando: false,
        cargandoMas: false,
        cuentas: [],
        itemsMostrados: [],
        origenSeleccionado: null,
        busqueda: '',
        itemsPorPagina: 10,
        headers: [
            { text: 'Documento', value: 'doc_ref', sortable: true },
            { text: 'Cliente', value: 'cliente', sortable: true },
            { text: 'Emisión', value: 'fecha', sortable: true, width: '90px' },
            { text: 'Vencimiento', value: 'fecha_vence', sortable: true, width: '90px' },
            { text: 'Total', value: 'monto_total', sortable: true, align: 'end', width: '90px' },
            { text: 'Pagado', value: 'pagado', sortable: true, align: 'end', width: '90px' },
            { text: 'Pendiente', value: 'monto_pendiente', sortable: true, align: 'end', width: '90px' },
            { text: 'Vendedor', value: 'vendedor', sortable: true, width: '80px' }
        ]
    }),

    computed: {
        showDialog: {
            get() { return this.value },
            set(val) { this.$emit('input', val) }
        },

        isMobile() {
            return this.$vuetify?.breakpoint?.smAndDown || false;
        },

        listaFiltrada() {
            let lista = [...this.cuentas];

            if (this.busqueda && this.busqueda.trim()) {
                const texto = this.busqueda.toLowerCase().trim();
                lista = lista.filter(c =>
                    (c.nombre || '').toLowerCase().includes(texto) ||
                    (c.documento || '').toLowerCase().includes(texto) ||
                    (c.doc_ref || '').toLowerCase().includes(texto)
                );
            }

            return lista;
        },

        totalPendiente() {
            return this.listaFiltrada.reduce((sum, c) => sum + Number(c.monto_pendiente || 0), 0);
        },
        origenesDisponibles() {
            const sedes = this.$store.state.array_sedes || [];
            console.log('Sedes disponibles en el store:', sedes);
            const sedesFiltradas = sedes.filter(sede => sede.tipo === 'sede');

            return sedesFiltradas.map(sede => ({
                base: sede.base,
                nombre: sede.nombre,
                nombreCompleto: `${sede.base} - ${sede.nombre}`,
                codigo: sede.codigo,
                tipo: sede.tipo,
                principal: sede.principal || false
            }));
        }
    },

    watch: {
        value(val) {
            if (val) {
                this.cargarOrigenes();
            }
        },

        origenSeleccionado: {
            handler(newVal) {
                if (newVal) {
                    this.cargarDatos();
                }
            },
            deep: true
        },

        busqueda() {
            this.resetearPaginacion();
        },

        listaFiltrada() {
            this.resetearPaginacion();
        }
    },

    methods: {
        cerrar() {
            this.$emit('input', false);
        },

        resetearPaginacion() {
            this.itemsMostrados = this.listaFiltrada.slice(0, this.itemsPorPagina);
        },

        cargarMasItems() {
            if (this.cargandoMas) return;

            this.cargandoMas = true;

            setTimeout(() => {
                const start = this.itemsMostrados.length;
                const end = start + this.itemsPorPagina;
                const nuevosItems = this.listaFiltrada.slice(start, end);

                if (nuevosItems.length > 0) {
                    this.itemsMostrados = [...this.itemsMostrados, ...nuevosItems];
                }

                this.cargandoMas = false;
            }, 300);
        },

        getOrigenColor(base) {
            const colores = {
                'BD97': 'blue darken-2',
                'BD98': 'green darken-2',
                'BD99': 'purple darken-2',
                'BD00': 'orange darken-2',
                'BD01': 'cyan darken-2',
                'BD02': 'pink darken-2',
                'V_T4C174': 'red darken-2'
            };
            return colores[base] || 'grey darken-2';
        },

        async cargarOrigenes() {
            // Ya no necesitas consultar Firebase
            // Solo asegurar que hay datos
            if (this.origenesDisponibles.length === 0) {
                this.$store.commit('dialogosnackbar', 'No hay sedes configuradas');
                return;
            }

            // Seleccionar la sede actual por defecto
            const bdActual = store.state.baseDatos?.bd;
            if (bdActual) {
                const origenActual = this.origenesDisponibles.find(o => o.base === bdActual);
                if (origenActual) {
                    this.origenSeleccionado = origenActual;
                } else {
                    this.origenSeleccionado = this.origenesDisponibles[0];
                }
            } else {
                this.origenSeleccionado = this.origenesDisponibles[0];
            }
        },

        async cargarDatos() {
            if (!this.origenSeleccionado) return;

            this.cargando = true;
            this.cuentas = [];

            try {
                const bd = this.origenSeleccionado.base;
                const dbRef = cuentasxcobrar_por_bd(bd);
                const snap = await dbRef.once('value');
                const data = snap.val() || {};

                Object.entries(data).forEach(([docRef, docData]) => {
                    let datos;
                    if (docData && (docData.doc_ref || docData.documento || docData.nombre)) {
                        datos = docData;
                    }
                    else if (docData && docData.datos) {
                        datos = docData.datos;
                    }
                    else {
                        datos = docData || {};
                    }

                    if (datos && datos.estado === 'PENDIENTE') {
                        this.cuentas.push({
                            id: docRef,
                            doc_ref: datos.doc_ref || docRef,
                            documento: datos.documento || '',
                            nombre: datos.nombre || 'SIN NOMBRE',
                            estado: datos.estado || 'PENDIENTE',
                            fecha: datos.fecha || 0,
                            fecha_envio: datos.fecha_envio || 0,
                            fecha_vence: datos.fecha_vence || 0,
                            monto_total: Number(datos.monto_total || 0),
                            monto_pendiente: Number(datos.monto_pendiente || 0),
                            pagado: Number(datos.pagado || 0),
                            vendedor: datos.vendedor || '',
                            empleado: datos.empleado || '',
                            moneda: datos.moneda || 'S/'
                        });
                    }
                });

                this.cuentas.sort((a, b) => (a.fecha_vence || 0) - (b.fecha_vence || 0));
                this.resetearPaginacion();

            } catch (error) {
                console.error('Error cargando cuentas por cobrar:', error);
                this.$store.commit('dialogosnackbar', 'Error al cargar cuentas por cobrar');
            } finally {
                this.cargando = false;
            }
        },

        formatFecha(timestamp) {
            if (!timestamp || timestamp === 0) return '-';
            return moment.unix(timestamp).format('DD/MM/YY');
        },

        esVencido(timestamp) {
            if (!timestamp || timestamp === 0) return false;
            return moment.unix(timestamp).isBefore(moment(), 'day');
        },

        redondear(valor) {
            return Number(valor || 0).toFixed(2);
        }
    }
}
</script>

<style scoped>
.vencido {
    border-left: 4px solid #ff5252 !important;
}

.v-card.rounded-lg {
    border-radius: 8px !important;
}

.cards-container {
    height: calc(100vh - 250px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 4px;
}

.v-data-table ::v-deep td {
    font-size: 0.8rem !important;
    padding: 0 8px !important;
}

.v-data-table ::v-deep th {
    font-size: 0.75rem !important;
    font-weight: 600 !important;
}
</style>