<template>
    <div class="pa-3">
        <v-card class="mb-2 pa-2">
            <v-row dense>

                <v-col cols="6" md="4" sm="6">
                    <v-text-field outlined dense type="date" label="Hasta" v-model="date1" />
                </v-col>
                <v-col cols="6" md="4" sm="6">
                    <v-text-field outlined dense type="date" label="Hasta" v-model="date2" />
                </v-col>
                <v-col cols="6" md="4" sm="6" class="d-flex align-center mt-n6">
                    <!-- ACTIVADOR + MENÚ -->
                    <v-menu v-model="menuOpc" bottom offset-y close-on-content-click transition="scale-transition"
                        max-width="260">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn small color="success" dark rounded depressed block class="px-3" v-bind="attrs"
                                v-on="on">
                                <v-icon left>mdi-tune</v-icon>
                                Acciones
                                <v-icon right class="ml-1">mdi-menu-down</v-icon>
                            </v-btn>
                        </template>

                        <v-list dense nav class="py-0">
                            <v-subheader class="grey--text text--darken-1">Opciones</v-subheader>

                            <v-list-item @click="filtrar">
                                <v-list-item-icon><v-icon>mdi-magnify</v-icon></v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title>Filtrar</v-list-item-title>
                                    <v-list-item-subtitle>Aplicar rango y criterios</v-list-item-subtitle>
                                </v-list-item-content>
                                <v-chip v-if="false" x-small label class="ml-2" outlined>Ctrl + F</v-chip>
                            </v-list-item>

                            <v-divider class="my-1"></v-divider>

                            <v-list-item @click="nuevo_rep = !nuevo_rep">
                                <v-list-item-icon><v-icon>mdi-truck-delivery</v-icon></v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title>Crear reparto</v-list-item-title>
                                    <v-list-item-subtitle>Generar hoja de ruta</v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>

                            <v-divider class="my-1"></v-divider>

                            <v-list-item @click="dial_sube_excel = !dial_sube_excel">
                                <v-list-item-icon><v-icon>mdi-truck-delivery</v-icon></v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title>Sube Excel Ruta</v-list-item-title>
                                    <v-list-item-subtitle>Generar hoja de ruta</v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="dial_rep_consolidado = !dial_rep_consolidado">
                                <v-list-item-icon><v-icon color="info">mdi-chart-bar</v-icon></v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title>Reportes Consolidados</v-list-item-title>
                                    <v-list-item-subtitle>Reporte</v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </v-menu>

                </v-col>
            </v-row>
        </v-card>

        <v-card>
            <v-simple-table dense fixed-header height="65vh">
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>N°Pedidos</th>
                        <th>Total S/.</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in repartosarray" :key="pedido.id">
                        <td style="font-size:75%;">{{ pedido.id }}</td>
                        <td style="font-size:75%;">{{ pedido.fecha }}</td>
                        <td>
                            <v-chip x-small :color="chipColor(pedido.estado)" dark>
                            </v-chip>
                        </td>
                        <td style="font-size:75%;">{{ pedido.resumen.total_pedidos }}</td>
                        <td style="font-size:75%;">S/.{{ pedido.resumen.total_general }}</td>

                        <td>
                            <v-row>
                                <v-col cols="6" xs="6">
                                    <v-btn icon small @click="ir_reparto(pedido)">
                                        <v-icon color="blue">mdi-eye</v-icon>
                                    </v-btn>
                                </v-col>
                                <v-col cols="6" xs="6">
                                       <v-btn icon small @click="repartoActual = pedido.id; dial_cobranza = !dial_cobranza">
                                <v-icon color="success">mdi-cash-register</v-icon>
                            </v-btn>
                                </v-col>
                            </v-row>

                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>
        <v-dialog v-model="dial_rep_consolidado" max-width="650">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_rep_consolidado = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Seleccionados: {{ selectedIds.length }}</span>
                    <v-btn small color="info" :disabled="!selectedIds.length" @click="imprimirSeleccionados">
                        <v-icon left>mdi-printer</v-icon> Imprimir reporte
                    </v-btn>
                </v-system-bar>
            </div>

            <v-card class="pa-1">
                <v-simple-table dense fixed-header height="65vh">
                    <thead>
                        <tr>
                            <th style="width:36px;">
                                <!-- seleccionar todos -->
                                <v-checkbox hide-details dense class="mt-0" :input-value="allChecked"
                                    :indeterminate="isIndeterminate" @change="toggleAll($event)" />
                            </th>
                            <th>Id</th>
                            <th>Fecha</th>
                            <th>N°Pedidos</th>
                            <th>Total S/.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pedido in repartosarray" :key="pedido.id">
                            <td>
                                <v-checkbox hide-details dense class="mt-0" :value="pedido.id" v-model="selectedIds" />
                            </td>
                            <td style="font-size:75%;">{{ pedido.id }}</td>
                            <td style="font-size:75%;">{{ pedido.fecha }}</td>
                            <td style="font-size:75%;">{{ pedido.resumen.total_pedidos }}</td>
                            <td style="font-size:75%;">S/.{{ pedido.resumen.total_general }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <dial_nuevo_rep v-if="nuevo_rep" @cierra="nuevo_rep = false" />
        <dial_sube_rep v-if="dial_sube_excel" @cerrar="dial_sube_excel = false, filtrar" />
        <cobranza_reparto v-if="dial_cobranza" :pedidos="null" :grupo="repartoActual" @cerrar="dial_cobranza = false" />
    </div>
</template>

<script>
import moment from "moment";
import { all_cabecera_reparto, all_Cabecera_p, all_detalle_p } from "../../db";
import { reporteProductoClientePDF } from '../pedidos/reportes_pdf'
import store from '@/store/index'
import dial_nuevo_rep from './dialogos/nuevo_reparto.vue'
import dial_sube_rep from './dialogos/excel_ruta.vue'
import cobranza_reparto from '../reparto/dialogos/cobranza_reparto.vue'
export default {
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
        };
    },
    created() {
        this.filtrar(); // carga inicial (hoy)
    },
    beforeDestroy() {
        this._detach();
    },
    computed: {
        allChecked() {
            return this.selectedIds.length && this.selectedIds.length === this.repartosarray.length;
        },
        isIndeterminate() {
            return this.selectedIds.length > 0 && this.selectedIds.length < this.repartosarray.length;
        },
    },

    watch: {
        date1() { this.filtrar(); },
        date2() { this.filtrar(); },
    },
    methods: {
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
            if (s === 'enviado') return 'blue';
            return 'orange'; // pendiente y otros
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
