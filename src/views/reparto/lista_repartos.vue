<template>
    <v-container fluid class="pa-0 mb-12">
        <!-- DESKTOP: toolbar clásica -->
        <v-toolbar v-if="!isMobile" flat color="white" class="mb-3 rounded-lg elevation-2">
            <v-toolbar-title class="font-weight-bold grey--text text--darken-2">
                🚚 Gestión de Repartos
            </v-toolbar-title>

            <v-spacer></v-spacer>

            <v-text-field outlined dense type="date" label="Desde" v-model="date1" hide-details
                prepend-inner-icon="mdi-calendar-start" class="mr-2" />

            <v-text-field outlined dense type="date" label="Hasta" v-model="date2" hide-details
                prepend-inner-icon="mdi-calendar-end" />

            <v-menu v-model="menuOpc" offset-y close-on-content-click transition="scale-transition">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn color="success" dark depressed rounded v-bind="attrs" v-on="on" class="ml-2" small>
                        <v-icon left>mdi-plus-circle</v-icon>
                        Acciones
                        <v-icon right class="ml-1">mdi-menu-down</v-icon>
                    </v-btn>
                </template>

                <v-list dense nav class="py-0">
                    <v-subheader class="font-weight-bold success--text text--lighten-1">OPERACIONES</v-subheader>

                    <v-list-item @click="nuevo_rep = true">
                        <v-list-item-icon><v-icon color="blue">mdi-file-edit</v-icon></v-list-item-icon>
                        <v-list-item-title>Crear Reparto</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="dial_sube_excel = true">
                        <v-list-item-icon><v-icon color="green">mdi-upload</v-icon></v-list-item-icon>
                        <v-list-item-title>Subir Excel Ruta</v-list-item-title>
                    </v-list-item>

                    <v-divider class="my-1"></v-divider>

                    <v-list-item @click="dial_rep_consolidado = true">
                        <v-list-item-icon><v-icon color="info">mdi-chart-bar</v-icon></v-list-item-icon>
                        <v-list-item-title>Reporte Consolidado</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-toolbar>

        <!-- MOBILE: solo CARD con filtros y acciones -->
        <v-card v-else class="mb-3 mx-1 pa-2 rounded-lg elevation-2">
            <div class="font-weight-bold grey--text text--darken-2 mb-2">
                🚚 Gestión de Repartos
            </div>

            <v-row dense>
                <v-col cols="6">
                    <v-text-field outlined dense type="date" v-model="date1" label="Desde" hide-details
                        prepend-inner-icon="mdi-calendar-start" />
                </v-col>
                <v-col cols="6">
                    <v-text-field outlined dense type="date" v-model="date2" label="Hasta" hide-details
                        prepend-inner-icon="mdi-calendar-end" />
                </v-col>

                <v-col cols="12" class="mt-1">
                    <v-menu v-model="menuOpc" offset-y close-on-content-click transition="scale-transition">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn block color="success" dark depressed rounded v-bind="attrs" v-on="on" x-small>
                                <v-icon left>mdi-plus-circle</v-icon>
                                Acciones
                                <v-icon right class="ml-1">mdi-menu-down</v-icon>
                            </v-btn>
                        </template>

                        <v-list dense nav class="py-0">
                            <v-subheader
                                class="font-weight-bold success--text text--lighten-1">OPERACIONES</v-subheader>

                            <v-list-item @click="nuevo_rep = true">
                                <v-list-item-title>Crear Reparto</v-list-item-title>
                            </v-list-item>

                            <v-list-item @click="dial_sube_excel = true">
                                <v-list-item-title>Subir Excel Ruta</v-list-item-title>
                            </v-list-item>

                            <v-divider class="my-1"></v-divider>

                            <v-list-item @click="dial_rep_consolidado = true">
                                <v-list-item-title>Reporte Consolidado</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>
        </v-card>

        <v-card v-if="!isMobile" class="rounded-lg elevation-2">
            <v-simple-table fixed-header height="65vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left"># ID</th>
                            <th class="text-left">📅 Fecha Emision</th>
                            <th class="text-left">🟢 Estado Sunat</th>
                            <th class="text-left">📦 N° Pedidos</th>
                            <th class="text-left">💰 Total (S/.)</th>
                            <th class="text-center">🛠️ Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pedido in repartosarray" :key="pedido.id">
                            <td class="text-caption font-weight-bold">{{ pedido.id }}</td>
                            <td class="text-caption">{{ pedido.fecha }}</td>

                            <td>
                                <v-chip x-small :color="chipColor(pedido.estado)" dark>
                                    {{ pedido.estado | capitalize }}
                                </v-chip>
                            </td>

                            <td class="text-caption">{{ pedido.resumen.total_pedidos }}</td>

                            <td class="text-caption font-weight-medium">
                                S/.{{ number2(pedido.resumen.total_general) }}
                            </td>

                            <td>
                                <div class="d-flex justify-center flex-wrap">
                                    <v-btn x-small color="orange-grey lighten-5" class="mx-1 my-1" depressed rounded
                                        elevation="1" @click="ir_reparto(pedido)">
                                        <v-icon left small color="blue-grey darken-1">mdi-clipboard-list</v-icon>
                                        <span class="blue-grey--text text--darken-1 font-weight-medium">Detalle</span>
                                    </v-btn>

                                    <v-btn x-small color="indigo lighten-5" class="mx-1 my-1" depressed rounded
                                        elevation="1" @click="reparto_transporte(pedido)">
                                        <v-icon left small color="indigo darken-1">mdi-truck-delivery</v-icon>
                                        <span class="indigo--text text--darken-1 font-weight-medium">Mapa</span>
                                    </v-btn>

                                    <v-menu offset-y left>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn x-small color="green lighten-5" class="mx-1 my-1" depressed rounded
                                                elevation="1" v-bind="attrs" v-on="on">
                                                <v-icon left small color="green darken-1">mdi-cash-multiple</v-icon>
                                                <span class="green--text text--darken-1">Opciones</span>
                                            </v-btn>
                                        </template>

                                        <v-list dense>
                                            <v-list-item
                                                @click="repartoActual = pedido.id; dial_cobranza = !dial_cobranza">
                                                <v-list-item-icon>
                                                    <v-icon color="success">mdi-monitor-dashboard</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Liquidación Electrónica</v-list-item-title>
                                            </v-list-item>

                                            <v-list-item @click="formato_liq(pedido)">
                                                <v-list-item-icon>
                                                    <v-icon color="error">mdi-printer</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Liquidación Manual PDF</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <!-- 📱 CELULAR: CARDS POR REPARTO -->
        <v-col v-else cols="12" v-for="pedido in repartosarray" :key="pedido.id" class="">
            <v-card outlined class="mb-n5 rounded-lg elevation-1">

                <v-card-title class="py-2 px-3 pb-0" style="min-height: 40px;">
                    <div class="d-flex justify-space-between align-start" style="width: 100%;">

                        <div class="d-flex flex-column align-start">
                            <div class="font-weight-bold text-subtitle-2"># {{ pedido.id }}</div>
                            <div class="caption grey--text text--darken-1 mt-n1">
                                {{ pedido.fecha }}
                            </div>
                        </div>

                        <div class="d-flex flex-column align-end">
                            <v-chip x-small :color="chipColor(pedido.estado)" dark class="mb-2">
                                {{ pedido.estado | capitalize }}
                            </v-chip>
                        </div>
                    </div>
                </v-card-title>

                <v-card-text class="py-1 px-3 d-flex justify-space-between align-center mt-n2">

                    <div class="d-flex flex-column align-start">
                        <div class="caption grey--text">📦 N° Pedidos</div>
                        <div class="font-weight-bold text-subtitle-2 indigo--text text--darken-2">
                            {{ pedido.resumen.total_pedidos }}
                        </div>
                    </div>

                    <div class="d-flex flex-column align-end">
                        <div class="caption grey--text">💰 Total (S/.)</div>
                        <div class="font-weight-bold text-subtitle-2 green--text text--darken-2">
                            S/. {{ number2(pedido.resumen.total_general) }}
                        </div>
                    </div>
                </v-card-text>

                <v-divider class="mx-3"></v-divider>

                <v-card-actions class="py-1 px-2 d-flex justify-end align-center">

                    <v-btn x-small text color="blue-grey darken-1" @click="ir_reparto(pedido)">
                        <v-icon left x-small>mdi-clipboard-list</v-icon>
                        Detalle
                    </v-btn>

                    <v-btn x-small text color="indigo darken-1" class="ml-1" @click="reparto_transporte(pedido)">
                        <v-icon left x-small>mdi-truck-delivery</v-icon>
                        Mapa
                    </v-btn>

                    <v-menu offset-y left>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn x-small text color="green darken-1" class="ml-1" v-bind="attrs" v-on="on">
                                <v-icon left x-small>mdi-cash-multiple</v-icon>
                                Opciones
                            </v-btn>
                        </template>

                        <v-list dense>
                            <v-list-item @click="repartoActual = pedido.id; dial_cobranza = !dial_cobranza">
                                <v-list-item-icon>
                                    <v-icon color="success">mdi-monitor-dashboard</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Liquidación Electrónica</v-list-item-title>
                            </v-list-item>

                            <v-list-item @click="formato_liq(pedido)">
                                <v-list-item-icon>
                                    <v-icon color="error">mdi-printer</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Liquidación Manual PDF</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-card-actions>
            </v-card>
        </v-col>


        <v-dialog v-model="dial_rep_consolidado" max-width="650">
            <v-card class="rounded-lg">
                <v-toolbar dense color="info" dark>
                    <v-icon left>mdi-chart-bar</v-icon>
                    <v-toolbar-title>Reportes Consolidados</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Seleccionados: {{ selectedIds.length }}</span>
                    <v-menu offset-y left>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn small text v-bind="attrs" v-on="on">
                                <v-icon left>mdi-file-pdf-box</v-icon>
                                Generar
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click='imprimirSeleccionados'>
                                <v-list-item-icon>
                                    <v-icon color="success">mdi-file-chart</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Reporte Producto/Cliente</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                    <v-btn icon @click="dial_rep_consolidado = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pa-0">
                    <v-simple-table dense fixed-header height="60vh">
                        <thead>
                            <tr>
                                <th style="width:36px;">
                                    <v-checkbox hide-details dense class="mt-0" :input-value="allChecked"
                                        :indeterminate="isIndeterminate" @change="toggleAll($event)" color="info" />
                                </th>
                                <th class="text-left"># ID</th>
                                <th class="text-left">Fecha</th>
                                <th class="text-left">N°Pedidos</th>
                                <th class="text-left">Total S/.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="pedido in repartosarray" :key="pedido.id">
                                <td>
                                    <v-checkbox hide-details dense class="mt-0" :value="pedido.id" v-model="selectedIds"
                                        color="info" />
                                </td>
                                <td class="text-caption">{{ pedido.id }}</td>
                                <td class="text-caption">{{ pedido.fecha }}</td>
                                <td class="text-caption">{{ pedido.resumen.total_pedidos }}</td>
                                <td class="text-caption">S/.{{ Number(pedido.resumen.total_general).toFixed(2) }}</td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_reporte_liq" max-width="400">
            <v-card class="pa-5 rounded-lg">
                <h4 class="text-center mb-4">Seleccione Orientación del Reporte Manual</h4>
                <v-row dense>
                    <v-col cols="6">
                        <v-card outlined class="pa-3 text-center transition-all hover-shadow" @click.prevent="doc('H')">
                            <v-icon size="40" color="grey darken-2">mdi-file-pdf-box</v-icon>
                            <h5 class="pa-1 mt-2">Horizontal</h5>
                            <span class="text-caption grey--text">Más detalles por fila</span>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card outlined class="pa-3 text-center transition-all hover-shadow" @click.prevent="doc('V')">
                            <v-icon size="40" color="grey darken-2">mdi-file-pdf-box</v-icon>
                            <h5 class="pa-1 mt-2">Vertical</h5>
                            <span class="text-caption grey--text">Formato A4 estándar</span>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>


        <dial_nuevo_rep v-if="nuevo_rep" @cierra="nuevo_rep = false" />
        <dial_sube_rep v-if="dial_sube_excel" @cerrar="dial_sube_excel = false, filtrar" />
        <cobranza_reparto v-if="dial_cobranza" :pedidos="null" :grupo="repartoActual" @cerrar="dial_cobranza = false" />
    </v-container>
</template>

<script>
import moment from "moment";
import { all_cabecera_reparto, all_Cabecera_p, all_detalle_p } from "../../db";
import { reporteProductoClientePDF } from '../pedidos/reportes_pdf'
import store from '@/store/index'
import dial_nuevo_rep from './dialogos/nuevo_reparto.vue'
import dial_sube_rep from './dialogos/excel_ruta.vue'
import cobranza_reparto from '../reparto/dialogos/cobranza_reparto.vue'
import { pdf_a4_t } from './formatos/formato_liq_manual'
export default {
    name: "lista_repartos",
    components: {
        dial_nuevo_rep,
        dial_sube_rep,
        cobranza_reparto
    },
    data() {
        return {
            // estado
            repartoActual: null,
            dial_cobranza: false,
            dial_rep_consolidado: false,
            selectedIds: [],
            dial_sube_excel: false,
            menuOpc: false,
            nuevo_rep: false,
            vendedor: 'todos',
            pedidoSeleccionado: null,
            detalleSeleccionado: [],
            dialogConsolidadoProd: false,
            consolidadoProductos: [],
            // fechas
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            // datos
            repartosarray: [],
            // refs
            refOrden: null,
            dial_reporte_liq: false,
        };
    },
    created() {
        this.filtrar(); // carga inicial (hoy)
    },
    beforeDestroy() {
        this._detach();
    },
    filters: {
        capitalize(value) {
            if (!value) return ''
            value = value.toString()
            return value.charAt(0).toUpperCase() + value.slice(1)
        }
    },
    computed: {
        allChecked() {
            return this.selectedIds.length && this.selectedIds.length === this.repartosarray.length;
        },
        isIndeterminate() {
            return this.selectedIds.length > 0 && this.selectedIds.length < this.repartosarray.length;
        },
        isMobile() {
            return this.$vuetify.breakpoint.smAndDown;
        }
    },

    watch: {
        date1() { this.filtrar(); },
        date2() { this.filtrar(); },
    },
    methods: {
        reparto_transporte(data) {
            this.$router.push({
                path: "/reparto_transporte/" + data.grupo
            });
        },
        ir_reparto(data) {
            if (data.subido) {
                this.$router.push({
                    path: "/reparto_transporte/"
                })
                return
            }
            this.$router.push({
                path: "/liquida_reparto/" + data.grupo
            })
        },
        chipColor(estado) {
            const s = (estado || '').toString().toLowerCase();
            if (s === 'anulado') return 'red';
            if (s === 'enviado') return 'light-blue darken-1'; // Color mejorado
            if (s === 'liquidado') return 'green lighten-1'; // Añadir color si existe estado 'liquidado'
            return 'orange lighten-1'; // pendiente y otros (color más suave)
        },
        filtrar() {
            // normaliza rango
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            if (!d1.isValid() || !d2.isValid()) return;

            // si vienen invertidas, intercambia
            if (d1.isAfter(d2)) [d1, d2] = [d2, d1];

            const start = d1.startOf("day").unix();      // segundos UNIX
            const end = d2.endOf("day").unix();

            // limpia listener anterior y suscribe nuevo
            this._detach();
            this.refOrden = all_cabecera_reparto()
                .orderByChild("fecha_emision")
                .startAt(start)
                .endAt(end);

            this.refOrden.on("value", this.onDataChange);
        },
        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },
        _detach() {
            if (this.refOrden) {
                this.refOrden.off("value", this.onDataChange);
                this.refOrden = null;
            }
        },
        onDataChange(snap) {
            const array = [];
            snap.forEach((item) => {
                const data = item.val() || {};
                const key = item.key;
                data.id = key;

                data.fecha = this.formatFecha(data.fecha_emision);
                array.push(data);
            });
            console.log(array)
            this.repartosarray = array;
        },
        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },
        // --- acciones UI --- //

        toggleAll(val) {
            this.selectedIds = val ? this.repartosarray.map(r => r.id) : [];
        },
        async formato_liq(datas) {
            try {
                console.log('datas', datas);
                this.array_selecto = [];
                store.commit("dialogoprogress", true); // Activar spinner de carga

                const snapshot = await all_Cabecera_p(datas.grupo).once("value");

                if (snapshot.exists()) {
                    const array = [];

                    snapshot.forEach((item) => {
                        array.push(item.val());
                    });

                    this.array_selecto = {
                        datas: {
                            grupo: datas.grupo,
                            fecha_emision: datas.fecha_emision,
                            peso: datas.peso || 0,
                            contado: datas.resumen.total_contado || 0,
                            credito: datas.resumen.total_credito || 0,
                            t_general: datas.resumen.total_general || 0,
                            pedidos: datas.resumen.total_pedidos || 0
                        },
                        array: array
                    };
                    console.log('array_selecto', this.array_selecto);
                    this.dial_reporte_liq = true;
                    // Si quieres generar PDF aquí, descomenta esta línea:
                    // pdf_a4(datas, array)
                } else {
                    console.warn("No se encontraron datos para el grupo:", datas.grupo);
                }
            } catch (error) {
                console.error("Error al obtener cabeceras:", error);
            } finally {
                store.commit("dialogoprogress", false); // Detener el spinner
            }
        },
        doc(form) {
            pdf_a4_t(form, this.array_selecto.datas, this.array_selecto.array)
        },
        async imprimirSeleccionados() {
            if (!this.selectedIds.length) return;

            try {
                store.commit("dialogoprogress");

                const elegidos = this.repartosarray.filter(r => this.selectedIds.includes(r.id));

                // Rango global
                const ts = elegidos.map(x => Number(x.fecha_emision) || 0).filter(Boolean);
                const fechaIni = ts.length ? Math.min(...ts) : null;
                const fechaFin = ts.length ? Math.max(...ts) : null;
                const rango = {
                    fecha_ini: fechaIni,
                    fecha_fin: fechaFin,
                    fecha_ini_str: fechaIni ? moment.unix(fechaIni).format("DD/MM/YYYY HH:mm") : "",
                    fecha_fin_str: fechaFin ? moment.unix(fechaFin).format("DD/MM/YYYY HH:mm") : ""
                };

                const datas = [];

                // util: ejecuta promesas en lotes (evita abrir demasiadas conexiones a la vez)
                const pAllChunked = async (fns, size = 12) => {
                    const out = [];
                    for (let i = 0; i < fns.length; i += size) {
                        const slice = fns.slice(i, i + size);
                        const res = await Promise.all(slice.map(fn => fn()));
                        out.push(...res);
                    }
                    return out;
                };

                for (const rep of elegidos) {
                    const pedidosSet = new Set(Array.isArray(rep.pedidos) ? rep.pedidos : []);
                    if (!pedidosSet.size) continue;

                    // 1) UNA sola lectura de cabeceras del reparto
                    const snapCab = await all_Cabecera_p(rep.id).once("value");
                    if (!snapCab.exists()) continue;

                    // 2) Filtrar cabeceras que pertenezcan a 'rep.pedidos'
                    const cabsFiltradas = [];
                    snapCab.forEach(child => {
                        const cab = child.val();

                        if (pedidosSet.has(cab.id_pedido)) {
                            cabsFiltradas.push({ numeracion: child.key, cab });
                        }
                    });
                    if (!cabsFiltradas.length) continue;

                    // 3) Detalles en paralelo (por lotes)
                    const tasks = cabsFiltradas.map(({ numeracion, cab }) => async () => {
                        const detSnap = await all_detalle_p(rep.id, numeracion).once("value");
                        return { cabecera: cab, detalle: detSnap.val() };
                    });

                    const resultados = await pAllChunked(tasks, 16); // ajusta el tamaño si quieres
                    datas.push(...resultados);
                }

                if (!datas.length) {
                    this.$store.commit('dialogosnackbar', 'No se encontraron pedidos en los repartos seleccionados.');
                    return;
                }

                // PDF
                reporteProductoClientePDF(datas, rango);

            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'No se pudo generar el reporte.');
            } finally {
                store.commit("dialogoprogress");
            }
        }




    },
};
</script>
<style scoped>
/* Añadir estilos para mejorar el efecto visual en la tarjeta de orientación */
.hover-shadow:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-2px);
    cursor: pointer;
}

.transition-all {
    transition: all 0.3s ease;
}

/* Estilo para que la tabla se vea un poco más grande y limpia */
.v-simple-table th {
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    color: #424242 !important;
}

.v-simple-table td {
    font-size: 0.75rem !important;
}
</style>