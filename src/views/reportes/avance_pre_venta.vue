<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" fullscreen>
        <div>
            <v-system-bar dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>Reporte de Ventas</h3>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card>
            <!-- Filtros -->
            <v-row dense class="pa-4">
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Inicio" v-model="date1" @change="filtrar" />
                </v-col>
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Fin" v-model="date2" @change="filtrar" />
                </v-col>
                <v-col cols="6" md="2" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n4' : ''">
                    <v-select style="font-size:80%;" v-model="vendedor" :items="vendedoresItems" item-text="nombre"
                        item-value="codigo" label="Vendedor" outlined dense @change="onVendedorChange" />
                </v-col>
            </v-row>

            <!-- KPIs -->
            <v-row dense class="mt-n8 pa-2">
                <v-col cols="6" sm="6" md="3">
                    <v-card class="pa-4">
                        <div class="subtitle-2 grey--text text--darken-1">Total de pedidos</div>
                        <div class="text-h5 font-weight-bold">{{ kpi.totalPedidos }}</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="6" md="3">
                    <v-card class="pa-4">
                        <div class="subtitle-2 grey--text text--darken-1">Total en soles</div>
                        <div class="text-h5 font-weight-bold">S/ {{ formatNum(kpi.totalSoles) }}</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="6" md="3">
                    <v-card class="pa-4">
                        <div class="subtitle-2 grey--text text--darken-1">Total ítems</div>
                        <div class="text-h5 font-weight-bold">{{ formatNum(kpi.totalItems) }}</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="6" md="3">
                    <v-card class="pa-4">
                        <div class="subtitle-2 grey--text text--darken-1">Ticket promedio</div>
                        <div class="text-h5 font-weight-bold">S/ {{ formatNum(kpi.ticketPromedio) }}</div>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Acciones detalle -->
            <v-row dense class="px-4 pb-4">
                <v-col cols="6" class="d-flex align-center">
                    <v-btn small color="primary" depressed :loading="loadingDetalles" @click="toggleTop">
                        {{ showTop ? 'Ocultar detalle' : 'Mostrar más detalle' }}
                    </v-btn>
                </v-col>
                <v-col cols="6" class="d-flex align-center">
                    <!-- Botón gráfico (Top 5 + Otros) -->
                    <v-btn small color="warning" :disabled="!topProductos.length" @click="grafDial = true"
                        :title="'Ver gráfico (Top 5 + Otros)'">
                        MOSTRA GRAFICO <v-icon>mdi-chart-donut</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Top productos -->
            <v-row v-if="showTop" dense class="px-4 pb-6">
                <v-col cols="12" md="12">
                    <v-card>
                        <v-card-title>
                            Productos más vendidos
                            <v-spacer></v-spacer>
                            <v-chip small class="ma-1" outlined>por cantidad</v-chip>
                            <v-switch v-model="ordenPorImporte" inset label="Ordenar por importe" class="ml-2"
                                hide-details />
                        </v-card-title>

                        <v-card-text>
                            <v-alert dense type="info" v-if="loadingDetalles">Cargando detalles de productos…</v-alert>
                            <v-alert dense type="warning" v-if="!loadingDetalles && topProductos.length === 0">
                                No hay productos para el rango/selección actual.
                            </v-alert>

                            <!-- 📱 Móvil: tarjetas compactas (2 por fila) -->
                            <div v-if="!loadingDetalles && topProductos.length && isMobile">
                                <v-row dense class="mobile-grid">
                                    <v-col cols="6" v-for="(item, i) in topProductos" :key="item.producto_id || i">
                                        <v-card outlined class="mobile-card">
                                            <v-card-title class="mobile-title">
                                                <div class="title-text clamp-2">
                                                    {{ item.descripcion }}
                                                </div>
                                            </v-card-title>

                                            <v-card-text class="mobile-body">
                                                <div class="row-line">
                                                    <span class="label">Cant.</span>
                                                    <span class="value">{{ item.cantidad_total }}</span>
                                                </div>
                                                <div class="row-line">
                                                    <span class="label">Importe</span>
                                                    <span class="value">S/ {{ formatNum(item.importe_total) }}</span>
                                                </div>
                                                <div class="row-line">
                                                    <span class="label">Prom.</span>
                                                    <span class="value">
                                                        <span v-if="item.cantidad_total > 0">
                                                            S/ {{ formatNum(item.importe_total / item.cantidad_total) }}
                                                        </span>
                                                        <span v-else>—</span>
                                                    </span>
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- 🖥️ Desktop: tabla -->
                            <v-data-table v-else-if="!loadingDetalles && topProductos.length && !isMobile"
                                :headers="headersTop" :items="topProductos" :items-per-page="10" dense
                                class="elevation-1">
                                <template v-slot:item.importe_total="{ item }">
                                    S/ {{ formatNum(item.importe_total) }}
                                </template>
                                <template v-slot:item.precio_unit="{ item }">
                                    <span v-if="item.cantidad_total > 0">
                                        S/ {{ formatNum(item.importe_total / item.cantidad_total) }}
                                    </span>
                                    <span v-else>—</span>
                                </template>
                            </v-data-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-card>

        <!-- ========== DIALOGO SECUNDARIO (GRÁFICO) ========== -->
        <v-dialog v-model="grafDial" max-width="900">
            <v-card>
                <v-toolbar flat color="indigo" dark dense>
                    <v-toolbar-title class="mini-title">Gráfico (Top 5 + Otros)</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="grafDial = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-tabs v-model="grafTab" background-color="grey lighten-4" grow>
                    <v-tab>Cantidad</v-tab>
                    <v-tab>Valor (S/.)</v-tab>
                </v-tabs>

                <v-tabs-items v-model="grafTab">
                    <v-tab-item>
                        <div class="pa-4">
                            <DoughnutBasic :labels="top5CantLabels" :values="top5CantValues" />
                        </div>
                    </v-tab-item>
                    <v-tab-item>
                        <div class="pa-4">
                            <DoughnutBasic :labels="top5ValorLabels" :values="top5ValorValues" />
                        </div>
                    </v-tab-item>
                </v-tabs-items>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import moment from "moment";
import { all_pedidos, detalle_pedido } from "../../db";
import store from "@/store/index";

/* ===== Chart.js (dona) ===== */
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    DoughnutController
} from "chart.js";
ChartJS.register(Title, Tooltip, Legend, ArcElement, DoughnutController);

/* Donut básico (render function → compatible con runtime-only) */
const DoughnutBasic = {
    name: "DoughnutBasic",
    props: { labels: Array, values: Array },
    data() { return { chart: null } },
    render(h) {
        return h("div", { style: { height: "260px" } }, [h("canvas", { ref: "canvas" })]);
    },
    methods: {
        draw() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (this.chart) this.chart.destroy();
            this.chart = new ChartJS(ctx, {
                type: "doughnut",
                data: {
                    labels: this.labels || [],
                    datasets: [{
                        data: (this.values || []).map(v => Number(v || 0)),
                        backgroundColor: [
                            "#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800",
                            "#9C27B0", "#26C6DA", "#7E57C2", "#66BB6A", "#EF5350"
                        ].slice(0, (this.labels || []).length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } }
                }
            });
        }
    },
    watch: {
        labels() { this.$nextTick(this.draw); },
        values() { this.$nextTick(this.draw); }
    },
    mounted() { this.draw(); },
    beforeDestroy() { if (this.chart) this.chart.destroy(); }
};

export default {
    components: { DoughnutBasic },
    data() {
        return {
            dial: false,
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            vendedor: "TODOS",

            // data base
            allPedidosRaw: [],
            pedidosArray: [],

            // detalles agregados
            loadingDetalles: false,
            productosAgg: {},

            // UI
            ordenPorImporte: false,

            // refs
            refOrden: null,
            showTop: false,

            // diálogo gráfico
            grafDial: false,
            grafTab: 0
        };
    },

    computed: {
        vendedoresItems() {
            const base = Array.isArray(this.$store.state.array_sedes)
                ? this.$store.state.array_sedes
                : [];
            const tieneTodos = base.some(it => (it.codigo || "").toString().toUpperCase() === "TODOS");
            return tieneTodos ? base : [{ nombre: "TODOS", codigo: "TODOS" }, ...base];
        },

        // pedidos vigentes (excluye anulados)
        pedidosVigentes() {
            return (this.pedidosArray || []).filter(
                p => String(p.estado || "").toLowerCase().trim() !== "anulado"
            );
        },

        // KPIs con pedidos vigentes
        kpi() {
            const base = this.pedidosVigentes;
            const totalPedidos = base.length;
            const totalSoles = base.reduce((acc, p) => acc + Number(p.total || 0), 0);
            const totalItems = base.reduce((acc, p) => acc + Number(p.total_items || 0), 0);
            const ticketPromedio = totalPedidos > 0 ? totalSoles / totalPedidos : 0;
            return { totalPedidos, totalSoles, totalItems, ticketPromedio };
        },

        // Tabla Top productos
        topProductos() {
            const arr = Object.values(this.productosAgg || {});
            arr.sort((a, b) => {
                if (this.ordenPorImporte) {
                    return b.importe_total - a.importe_total || b.cantidad_total - a.cantidad_total;
                }
                return b.cantidad_total - a.cantidad_total || b.importe_total - a.importe_total;
            });
            return arr;
        },

        headersTop() {
            return [
                { text: "Producto", value: "descripcion", align: "start" },
                { text: "Cantidad", value: "cantidad_total", align: "end" },
                { text: "Importe", value: "importe_total", align: "end" },
                { text: "Precio prom.", value: "precio_unit", align: "end" }
            ];
        },
        isMobile() {
            return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
        },

        /* ===== Datos para el diálogo de gráficos (Top 5 + Otros) ===== */
        top5CantLabels() {
            const { labels } = this.buildTop5(this.topProductos, "cantidad_total");
            return labels;
        },
        top5CantValues() {
            const { values } = this.buildTop5(this.topProductos, "cantidad_total");
            return values;
        },
        top5ValorLabels() {
            const { labels } = this.buildTop5(this.topProductos, "importe_total");
            return labels;
        },
        top5ValorValues() {
            const { values } = this.buildTop5(this.topProductos, "importe_total");
            return values;
        }
    },

    created() {
        this.dial = true;
        this.filtrar();
    },

    beforeDestroy() {
        this._detach();
    },

    methods: {
        // ========= Filtros de rango / vendedor =========
        filtrar() {
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            if (!d1.isValid() || !d2.isValid()) return;
            if (d1.isAfter(d2)) [d1, d2] = [d2, d1];

            const start = d1.startOf("day").unix();
            const end = d2.endOf("day").unix();

            this._detach();
            this.refOrden = all_pedidos()
                .orderByChild("fecha_emision")
                .startAt(start)
                .endAt(end);

            this.refOrden.on("value", this.onDataChange, (err) => console.error(err));
        },

        onVendedorChange() {
            this.applyVendorFilter();
        },

        onDataChange(snap) {
            const array = [];
            snap.forEach((item) => {
                const data = item.val() || {};
                data.id = item.key;
                data.fecha = this.formatFecha(data.fecha_emision);
                array.push(data);
            });

            this.allPedidosRaw = array;
            this.applyVendorFilter();
        },

        applyVendorFilter() {
            const v = (this.vendedor || "TODOS").toString().toUpperCase().trim();
            if (v === "TODOS") {
                this.pedidosArray = this.allPedidosRaw.slice();
            } else {
                this.pedidosArray = this.allPedidosRaw.filter(p =>
                    (p.cod_vendedor != null ? String(p.cod_vendedor) : "").toUpperCase().trim() === v
                );
            }

            // recalcular detalle solo si está visible
            if (this.showTop) this.buildTopProductos(); else this.productosAgg = {};
        },

        toggleTop() {
            this.showTop = !this.showTop;
            if (this.showTop) {
                // Cargar/actualizar cuando se abre
                this.buildTopProductos();
            }
        },

        async buildTopProductos() {
            this.loadingDetalles = true;
            try {
                const prom = this.pedidosVigentes.map(p => this.leerDetallePedido(p.id));
                const detallesPorPedido = await Promise.all(prom);

                const agg = {};
                for (const detList of detallesPorPedido) {
                    const items = Array.isArray(detList) ? detList : [];
                    for (const d of items) {
                        const key = d.codigo || d.id || d.nombre || "SIN-ID";
                        const desc = (d.nombre || d.descripcion || "Producto sin nombre").trim();
                        const cant = Number(d.cantidad || 0);
                        const imp = Number(
                            d.totalLinea ?? d.total_linea ?? (Number(d.precio || 0) * cant)
                        );
                        if (!agg[key]) {
                            agg[key] = { producto_id: key, descripcion: desc, cantidad_total: 0, importe_total: 0 };
                        }
                        agg[key].cantidad_total += cant;
                        agg[key].importe_total += imp;
                    }
                }
                this.productosAgg = agg;
            } catch (e) {
                console.error("Error cargando detalles:", e);
                this.productosAgg = {};
            } finally {
                this.loadingDetalles = false;
            }
        },

        leerDetallePedido(pedidoId) {
            return new Promise((resolve) => {
                try {
                    detalle_pedido(pedidoId).once("value")
                        .then(snap => {
                            const val = snap.val() || [];
                            const out = Array.isArray(val) ? val : Object.values(val);
                            resolve(out.map(row => ({ ...row })));
                        })
                        .catch(() => resolve([]));
                } catch {
                    resolve([]);
                }
            });
        },

        // ========= Utilitarios / UI =========
        formatFecha(unix, formato = "DD/MM HH:mm") {
            return moment.unix(unix).format(formato);
        },

        formatNum(n) {
            const v = Number(n || 0);
            return v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        _detach() {
            if (this.refOrden) this.refOrden.off();
        },

        cierra() {
            this.dial = false;
            this._detach();
            this.$emit("cierra");
        },

        // helper: arma Top 5 por métrica y agrega "Otros" para el gráfico
        buildTop5(rows, metric /* 'cantidad_total' | 'importe_total' */) {
            const list = [...(rows || [])]
                .sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0));

            const top5 = list.slice(0, 5);
            const resto = list.slice(5);
            const otrosValor = resto.reduce((s, r) => s + Number(r[metric] || 0), 0);

            const labels = top5.map(x => x.descripcion);
            const values = top5.map(x => Number(x[metric] || 0));

            if (otrosValor > 0) {
                labels.push("Otros");
                values.push(otrosValor);
            }
            return {
                labels: labels.length ? labels : ["Sin datos"],
                values: values.length ? values : [0]
            };
        }
    }
};
</script>

<style scoped>
/* Grid con separación mínima en móvil */
.mobile-grid {
    margin-left: -4px;
    margin-right: -4px;
}

.mobile-grid>.col {
    padding-left: 4px !important;
    padding-right: 4px !important;
}

/* Card compacta */
.mobile-card {
    border-radius: 10px;
    box-shadow: none;
}

/* Título compacto */
.mobile-title {
    padding: 6px 8px;
    min-height: 40px;
}

/* Texto de título: 2 líneas máx con clamp */
.title-text {
    font-size: 12.5px;
    line-height: 1.15;
    font-weight: 600;
}

.clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Body ultra compacto */
.mobile-body {
    padding: 6px 8px 8px 8px !important;
}

/* Filas de datos */
.row-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 2px 0;
}

/* Etiquetas y valores pequeños pero legibles */
.label {
    font-size: 11px;
    color: #6b7280;
    /* grey-500 */
}

.value {
    font-size: 12px;
    font-weight: 600;
}

/* Gráfico dialog title */
.mini-title {
    font-size: 14px !important;
    line-height: 1.1 !important;
    font-weight: 500;
}
</style>
