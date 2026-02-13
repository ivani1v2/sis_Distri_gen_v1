<template>
    <div class="pa-2 pa-sm-4">
        <v-card class="elevation-1 rounded-lg mb-4">
            <v-card-text class="pa-3 blue-grey lighten-5">
                <v-row dense align="center">
                    <!-- Cliente -->
                    <v-col cols="12" :sm="$vuetify.breakpoint.smAndDown ? 12 : 4">
                        <v-autocomplete outlined dense label="Cliente" auto-select-first v-model="clienteSeleccionado"
                            :items="clientesFormateados" prepend-inner-icon="mdi-account-search" hide-details
                            clearable />
                    </v-col>
                    <!-- Año -->
                    <v-col cols="6" sm="2">
                        <v-select outlined dense label="Año" v-model="anioSeleccionado" :items="aniosDisponibles"
                            prepend-inner-icon="mdi-calendar" hide-details />
                    </v-col>
                    <!-- Meses -->
                    <v-col cols="6" sm="3">
                        <v-select outlined dense label="Meses" v-model="mesesSeleccionados" :items="mesesDisponibles"
                            item-text="text" item-value="value" prepend-inner-icon="mdi-calendar-range" multiple chips
                            small-chips deletable-chips hide-details>
                            <template v-slot:selection="{ item, index }">
                                <v-chip v-if="index < 2" x-small close @click:close="removeMes(item.value)">
                                    {{ item.text.substring(0, 3) }}
                                </v-chip>
                                <span v-if="index === 2" class="grey--text caption">
                                    (+{{ mesesSeleccionados.length - 2 }})
                                </span>
                            </template>
                        </v-select>
                    </v-col>

                    <!-- Botón Consultar -->
                    <v-col cols="12" sm="2">
                        <v-btn block color="primary" :loading="cargando" :disabled="!clienteSeleccionado"
                            @click="consultarDatos">
                            <v-icon left small>mdi-magnify</v-icon>
                            Consultar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- SKELETON LOADER -->
        <div v-if="cargando" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <div class="caption mt-3 grey--text">Consultando BigQuery...</div>
        </div>

        <!-- MENSAJE SIN CLIENTE -->
        <v-card v-else-if="!clienteSeleccionado" class="elevation-1 rounded-lg">
            <v-card-text class="text-center py-10">
                <v-icon size="80" color="grey lighten-2" class="mb-4">mdi-account-search</v-icon>
                <div class="subtitle-1 grey--text">Seleccione un cliente para ver su análisis</div>
            </v-card-text>
        </v-card>

        <!-- MENSAJE SIN DATOS -->
        <v-card v-else-if="datosCliente.length === 0 && !cargando" class="elevation-1 rounded-lg">
            <v-card-text class="text-center py-10">
                <v-icon size="80" color="grey lighten-2" class="mb-4">mdi-chart-box-outline</v-icon>
                <div class="subtitle-1 grey--text">No hay datos para el período seleccionado</div>
                <div class="caption grey--text mt-2">Intente con otro rango de fechas</div>
            </v-card-text>
        </v-card>

        <div v-else>
            <v-row dense class="mx-0">
                <v-col v-for="(stat, key) in kpisResumen" :key="key" cols="6" sm="4" md="2" class="d-flex">
                    <v-card class="px-3 py-2 d-flex align-center" :color="stat.color + ' lighten-4'" flat width="100%">
                        <v-icon :color="stat.color" size="20" class="mr-6 ml-6">
                            {{ stat.icon }}
                        </v-icon>

                        <div class="d-flex flex-column" style="line-height: 1.1;">
                            <div class="font-weight-bold" :class="stat.color + '--text'" style="font-size: 0.9rem;">
                                {{ stat.prefix || '' }}{{ stat.value }}{{ stat.suffix || '' }}
                            </div>

                            <div class="text-caption">
                                {{ stat.title }}
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>


            <!-- GRÁFICOS -->
            <v-row dense>
                <!-- GRÁFICO 1: Evolución Mensual -->
                <v-col cols="12" md="12">
                    <v-card class="elevation-1 rounded-lg mb-4">
                        <v-card-title class="py-2 px-3 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
                            <v-icon small color="primary" class="mr-2">mdi-chart-line</v-icon>
                            Evolución de Ventas Mensuales
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="pa-2" style="height: 300px;">
                            <canvas ref="chartEvolucion"></canvas>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- GRÁFICO 2: Volumen de Compras -->
                <v-col cols="12" md="6">
                    <v-card class="elevation-1 rounded-lg mb-4">
                        <v-card-title class="py-2 px-3 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
                            <v-icon small color="info" class="mr-2">mdi-chart-bar-stacked</v-icon>
                            Composición: Pedido vs Directo
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="pa-2" style="height: 300px;">
                            <canvas ref="chartVolumen"></canvas>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- GRÁFICO 3: Formas de Pago -->
                <v-col cols="12" md="6">
                    <v-card class="elevation-1 rounded-lg mb-4">
                        <v-card-title class="py-2 px-3 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
                            <v-icon small color="success" class="mr-2">mdi-credit-card-outline</v-icon>
                            Formas de Pago
                            <v-spacer></v-spacer>
                            <v-chip x-small outlined :color="esMesUnico ? 'purple' : 'blue'">
                                {{ esMesUnico ? 'Dona' : 'Barras' }}
                            </v-chip>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="pa-2" style="height: 300px;">
                            <canvas ref="chartPagos"></canvas>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- GRÁFICO 4: Ticket Promedio -->
                <v-col cols="12" md="6">
                    <v-card class="elevation-1 rounded-lg mb-4">
                        <v-card-title class="py-2 px-3 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
                            <v-icon small color="orange" class="mr-2">mdi-ticket-percent</v-icon>
                            Ticket Promedio por Tipo
                            <v-spacer></v-spacer>
                            <v-chip x-small outlined :color="esMesUnico ? 'purple' : 'orange'">
                                {{ esMesUnico ? 'Pie' : 'Líneas' }}
                            </v-chip>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="pa-2" style="height: 300px;">
                            <canvas ref="chartTicket"></canvas>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="6">
                    <Top5Productos :datos-cliente="datosCliente" />
                </v-col>
            </v-row>

            <!-- TABLA DE DETALLE MENSUAL -->
            <v-card class="elevation-1 rounded-lg mb-5">
                <v-card-title class="py-2 px-3 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
                    <v-icon small color="teal" class="mr-2">mdi-table</v-icon>
                    Detalle Mensual
                </v-card-title>
                <v-divider></v-divider>

                <!-- TABLA DESKTOP -->
                <v-simple-table v-if="!$vuetify.breakpoint.smAndDown" dense>
                    <thead class="grey lighten-3">
                        <tr>
                            <th class="text-left">Mes</th>
                            <th class="text-right">Total General</th>
                            <th class="text-center">Ticket Prom.</th>
                            <th class="text-right"># Compras</th>
                            <th class="text-right">Pedidos</th>
                            <th class="text-right">Directos</th>
                            <th class="text-right">Contado</th>
                            <th class="text-right">Crédito</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in datosCliente" :key="idx">
                            <td class="font-weight-medium">
                                {{ item.mes_nombre_es }} {{ item.anio }}
                            </td>
                            <td class="text-right font-weight-bold primary--text">
                                {{ monedaSimbolo }}{{ formatearNumero(item.total_general) }}
                            </td>
                            <td class="text-center">
                                <v-chip :color="getTicketColorChip(item.ticket_promedio)" text-color="white" x-small
                                    class="font-weight-bold">
                                    {{ getTicketTexto(item.ticket_promedio) }}
                                </v-chip>
                            </td>
                            <td class="text-right">{{ item.num_compras_total }}</td>
                            <td class="text-right blue--text">{{ item.num_pedidos }}</td>
                            <td class="text-right green--text">{{ item.num_directo }}</td>
                            <td class="text-right teal--text">{{ item.num_contado }}</td>
                            <td class="text-right orange--text">{{ item.num_credito }}</td>
                        </tr>
                        <!-- FILA TOTALES -->
                        <tr class="grey lighten-4 font-weight-bold">
                            <td>TOTAL</td>
                            <td class="text-right primary--text">
                                {{ monedaSimbolo }}{{ formatearNumero(totalesResumen.totalGeneral) }}
                            </td>
                            <td class="text-center">
                                <v-chip :color="getTicketColorChip(totalesResumen.ticketPromedio)" text-color="white"
                                    x-small class="font-weight-bold">
                                    {{ getTicketTexto(totalesResumen.ticketPromedio) }}
                                </v-chip>
                            </td>
                            <td class="text-right">{{ totalesResumen.numCompras }}</td>
                            <td class="text-right blue--text">{{ totalesResumen.numPedidos }}</td>
                            <td class="text-right green--text">{{ totalesResumen.numDirecto }}</td>
                            <td class="text-right teal--text">{{ totalesResumen.numContado }}</td>
                            <td class="text-right orange--text">{{ totalesResumen.numCredito }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>

                <!-- CARDS MÓVIL -->
                <div v-else class="pa-2">
                    <v-card v-for="(item, idx) in datosCliente" :key="idx" outlined class="mb-2 rounded-lg">
                        <v-card-text class="pa-2">
                            <div class="d-flex justify-space-between mb-2">
                                <span class="font-weight-bold">{{ item.mes_nombre_es }} {{ item.anio }}</span>
                                <span class="font-weight-bold primary--text">
                                    {{ monedaSimbolo }}{{ formatearNumero(item.total_general) }}
                                </span>
                            </div>
                            <v-row dense class="caption">
                                <v-col cols="6">
                                    <span class="grey--text">Ticket:</span>
                                    <v-chip :color="getTicketColorChip(item.ticket_promedio)" text-color="white" x-small
                                        class="ml-1 font-weight-bold">
                                        {{ getTicketTexto(item.ticket_promedio) }}
                                    </v-chip>
                                </v-col>
                                <v-col cols="6" class="text-right">
                                    <span class="grey--text"># Compras:</span>
                                    <span class="font-weight-medium">{{ item.num_compras_total }}</span>
                                </v-col>
                                <v-col cols="6">
                                    <v-chip x-small color="blue" dark class="mr-1">Ped: {{ item.num_pedidos }}</v-chip>
                                    <v-chip x-small color="green" dark>Dir: {{ item.num_directo }}</v-chip>
                                </v-col>
                                <v-col cols="6" class="text-right">
                                    <v-chip x-small color="teal" dark class="mr-1">Cont: {{ item.num_contado }}</v-chip>
                                    <v-chip x-small color="orange" dark>Cred: {{ item.num_credito }}</v-chip>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
            </v-card>
        </div>
    </div>
</template>

<script>
import Chart from "chart.js/auto";
import axios from "axios";
import store from "@/store/index";
import Top5Productos from "@/views/clientes/Top5Productos.vue";
import * as XLSX from "xlsx";

export default {
    name: "AnalisisCliente",
    props: {
        clientePreseleccionado: {
            type: String,
            default: ""
        }
    },
    components: {
        Top5Productos
    },
    data() {
        return {
            clienteSeleccionado: "",
            anioSeleccionado: new Date().getFullYear(),
            mesesSeleccionados: [new Date().getMonth() + 1],
            datosCliente: [],
            cargando: false,

            chartEvolucionInstance: null,
            chartVolumenInstance: null,
            chartPagosInstance: null,
            chartTicketInstance: null,

            aniosDisponibles: this.generarAnios(),
            mesesDisponibles: [
                { text: "Enero", value: 1 },
                { text: "Febrero", value: 2 },
                { text: "Marzo", value: 3 },
                { text: "Abril", value: 4 },
                { text: "Mayo", value: 5 },
                { text: "Junio", value: 6 },
                { text: "Julio", value: 7 },
                { text: "Agosto", value: 8 },
                { text: "Septiembre", value: 9 },
                { text: "Octubre", value: 10 },
                { text: "Noviembre", value: 11 },
                { text: "Diciembre", value: 12 }
            ]
        };
    },
    computed: {
        esMesUnico() {
            return this.datosCliente.length === 1;
        },

        clientesFormateados() {
            const clientes = this.$store.state.clientessearch || [];
            return clientes.map(c => `${c.id} / ${c.nombre}`);
        },

        monedaSimbolo() {
            return (
                this.$store.state.moneda.find(
                    m => m.codigo === this.$store.state.configuracion.moneda_defecto
                )?.simbolo || "S/ "
            );
        },

        totalesResumen() {
            const datos = this.datosCliente;
            if (!datos.length) {
                return {
                    totalGeneral: 0,
                    ticketPromedio: 0,
                    numCompras: 0,
                    numPedidos: 0,
                    numDirecto: 0,
                    numContado: 0,
                    numCredito: 0
                };
            }

            const totalGeneral = datos.reduce((sum, d) => sum + Number(d.total_general || 0), 0);
            const numCompras = datos.reduce((sum, d) => sum + Number(d.num_compras_total || 0), 0);
            const numPedidos = datos.reduce((sum, d) => sum + Number(d.num_pedidos || 0), 0);
            const numDirecto = datos.reduce((sum, d) => sum + Number(d.num_directo || 0), 0);
            const numContado = datos.reduce((sum, d) => sum + Number(d.num_contado || 0), 0);
            const numCredito = datos.reduce((sum, d) => sum + Number(d.num_credito || 0), 0);
            const ticketPromedio = numCompras > 0 ? totalGeneral / numCompras : 0;

            return {
                totalGeneral,
                ticketPromedio,
                numCompras,
                numPedidos,
                numDirecto,
                numContado,
                numCredito
            };
        },

        kpisResumen() {
            const t = this.totalesResumen;
            const mesActual = new Date().getMonth() + 1;
            const ultimoMesData = this.datosCliente.find(d => d.mes === mesActual) ||
                this.datosCliente[this.datosCliente.length - 1] || {};
            const ticketMesActual = ultimoMesData.ticket_promedio || 0;

            return [
                {
                    title: "Total Período",
                    value: this.formatearNumero(t.totalGeneral),
                    prefix: this.monedaSimbolo,
                    icon: "mdi-cash-multiple",
                    color: "primary",
                    tooltip: "Suma total del período seleccionado"
                },
                {
                    title: "Ticket Prom. General",
                    value: this.getTicketTexto(t.ticketPromedio),
                    icon: "mdi-ticket-percent",
                    color: this.getTicketColorBg(t.ticketPromedio),
                    isChip: true,
                    tooltip: `${this.monedaSimbolo}${this.formatearNumero(t.ticketPromedio)}`
                },
                {
                    title: "Ticket Mes Actual",
                    value: ticketMesActual > 0 ? this.getTicketTexto(ticketMesActual) : "Sin datos",
                    icon: "mdi-calendar-month",
                    color: ticketMesActual > 0 ? this.getTicketColorBg(ticketMesActual) : "grey",
                    isChip: true,
                    tooltip: ticketMesActual > 0
                        ? `${this.monedaSimbolo}${this.formatearNumero(ticketMesActual)}`
                        : "No hay datos para el mes actual"
                },
                {
                    title: "Total Compras",
                    value: t.numCompras,
                    icon: "mdi-cart",
                    color: "teal",
                    tooltip: "Número total de compras"
                },
                {
                    title: "Meses con datos",
                    value: this.datosCliente.length,
                    icon: "mdi-calendar-check",
                    color: "purple",
                    tooltip: "Cantidad de meses en el período"
                },
                {
                    title: "Mejor Mes",
                    value: this.mejorMes,
                    icon: "mdi-trophy",
                    color: "amber",
                    tooltip: "Mes con mayor venta del período"
                }
            ];
        },
        mejorMes() {
            if (!this.datosCliente.length) return "-";

            const mejor = this.datosCliente.reduce((max, item) =>
                item.total_general > max.total_general ? item : max
                , this.datosCliente[0]);

            return `${mejor.mes_nombre_es} ${mejor.anio}`;
        }
    },
    watch: {
    clientePreseleccionado: {
        immediate: true,
        async handler(val) {
            if (val) {
                // Asigna el valor al v-model del autocomplete
                this.clienteSeleccionado = val;
                
                // Espera un momento para que el DOM se actualice
                await this.$nextTick();
                
                // Consulta automáticamente
                this.consultarDatos();
            } else {
                this.clienteSeleccionado = '';
            }
        }
    }
},
    methods: {
        getTicketTexto(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "RECURRENTE";
            if (val >= 200) return "REGULAR";
            return "BAJO";
        },

        getTicketColorChip(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "success";
            if (val >= 200) return "warning";
            return "error";
        },

        getTicketTextColor(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "white";
            if (val >= 200) return "white";
            return "white";
        },

        getTicketClass(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "success--text font-weight-bold";
            if (val >= 200) return "warning--text font-weight-bold";
            return "error--text font-weight-bold";
        },
        generarAnios() {
            const anioActual = new Date().getFullYear();
            return [anioActual, anioActual - 1, anioActual - 2];
        },

        generarMesesActuales() {
            const mesActual = new Date().getMonth() + 1;
            const meses = [];
            for (let i = 0; i < 6; i++) {
                let mes = mesActual - i;
                if (mes < 1) mes += 12;
                meses.unshift(mes);
            }
            return meses.sort((a, b) => a - b);
        },

        removeMes(mes) {
            const idx = this.mesesSeleccionados.indexOf(mes);
            if (idx > -1) {
                this.mesesSeleccionados.splice(idx, 1);
            }
        },
        formatearNumero(valor) {
            const dec = this.$store.state?.configuracion?.decimal || 2;
            return Number(valor || 0).toFixed(dec);
        },

        getTicketColor(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "green--text font-weight-bold";
            if (val >= 200) return "orange--text font-weight-bold";
            return "red--text font-weight-bold";
        },

        getTicketColorBg(ticket) {
            const val = Number(ticket || 0);
            if (val >= 600) return "green";
            if (val >= 200) return "orange";
            return "red";
        },

        async consultarDatos() {
            if (!this.clienteSeleccionado) {
                store.commit("dialogosnackbar", "Seleccione un cliente.");
                return;
            }
            const dni = (this.clienteSeleccionado || "").split("/")[0].trim();
            if (!dni) {
                store.commit("dialogosnackbar", "Cliente no válido.");
                return;
            }

            const empresa = String(
                this.$store.state.baseDatos?.ruc_asociado ||
                this.$store.state.baseDatos?.ruc ||
                ""
            ).trim();

            if (!empresa) {
                store.commit("dialogosnackbar", "No se encontró información de la empresa.");
                return;
            }

            this.cargando = true;
            this.datosCliente = [];

            try {
                // Construir condiciones de meses
                const mesesCondicion = this.mesesSeleccionados.length > 0
                    ? `AND mes IN UNNEST(@meses)`
                    : "";

                const query = `
                    SELECT *
                    FROM \`sis-distribucion.firebase.vw_resumen_compras_cliente\`
                    WHERE id_empresa = @empresa
                      AND dni = @dni
                      AND anio = @anio
                      ${mesesCondicion}
                    ORDER BY anio, mes
                `;

                const params = {
                    empresa: empresa,
                    dni: dni,
                    anio: this.anioSeleccionado
                };

                if (this.mesesSeleccionados.length > 0) {
                    params.meses = this.mesesSeleccionados;
                }

                const response = await axios.post(
                    "https://consulta-bigquery-6sfc6tum4a-rj.a.run.app",
                    { query, params },
                    { headers: { "Content-Type": "application/json" } }
                );

                // Procesar datos
                this.datosCliente = (response.data.data || []).map(row => ({
                    ...row,
                    total_general: Number(row.total_general || 0),
                    ticket_promedio: Number(row.ticket_promedio || 0),
                    num_compras_total: Number(row.num_compras_total || 0),
                    num_pedidos: Number(row.num_pedidos || 0),
                    num_directo: Number(row.num_directo || 0),
                    num_contado: Number(row.num_contado || 0),
                    num_credito: Number(row.num_credito || 0),
                    num_otro_pago: Number(row.num_otro_pago || 0),
                    total_pedidos: Number(row.total_pedidos || 0),
                    total_directo: Number(row.total_directo || 0),
                    total_contado: Number(row.total_contado || 0),
                    total_credito: Number(row.total_credito || 0),
                    ticket_prom_pedidos: Number(row.ticket_prom_pedidos || 0),
                    ticket_prom_directo: Number(row.ticket_prom_directo || 0),
                    ticket_prom_contado: Number(row.ticket_prom_contado || 0),
                    ticket_prom_credito: Number(row.ticket_prom_credito || 0),
                    anio: Number(row.anio || 0),
                    mes: Number(row.mes || 0),
                    top_5_productos: row.top_5_productos || []
                }));

                console.log("Datos consultados:", this.datosCliente);

                // Inicializar gráficos después de renderizar
                this.$nextTick(() => {
                    setTimeout(() => {
                        this.inicializarGraficos();
                    }, 300);
                });

                if (this.datosCliente.length === 0) {
                    store.commit("dialogosnackbar", "No hay datos para el período seleccionado.");
                }
            } catch (error) {
                console.error("Error al consultar datos:", error);
                store.commit("dialogosnackbar", "Error al consultar datos. Revise su conexión.");
            } finally {
                this.cargando = false;
            }
        },

        // Inicializar todos los gráficos
        inicializarGraficos() {
            if (!this.datosCliente.length) return;

            this.dibujarGraficoEvolucion();
            this.dibujarGraficoVolumen();
            this.dibujarGraficoPagos();
            this.dibujarGraficoTicket();
        },

        // Destruir gráfico si existe
        destruirGrafico(instancia) {
            if (instancia) {
                instancia.destroy();
            }
        },

        // GRÁFICO 1: Evolución Mensual (línea con doble eje Y)
        dibujarGraficoEvolucion() {
            this.destruirGrafico(this.chartEvolucionInstance);

            const canvas = this.$refs.chartEvolucion;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            const labels = this.datosCliente.map(d => d.eje_x);
            const totales = this.datosCliente.map(d => d.total_general);
            const tickets = this.datosCliente.map(d => d.ticket_promedio);

            this.chartEvolucionInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            type: "bar",
                            label: "Total General",
                            data: totales,
                            backgroundColor: "rgba(33, 150, 243, 0.3)",
                            borderColor: "#2196F3",
                            borderWidth: 1,
                            yAxisID: "y"
                        },
                        {
                            type: "line",
                            label: "Ticket Promedio",
                            data: tickets,
                            borderColor: "#FF9800",
                            backgroundColor: "rgba(255, 152, 0, 0.2)",
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            yAxisID: "y1"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: "index",
                        intersect: false
                    },
                    plugins: {
                        legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const label = ctx.dataset.label || "";
                                    const value = Number(ctx.parsed.y || 0).toFixed(2);
                                    return `${label}: ${this.monedaSimbolo}${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: "linear",
                            display: true,
                            position: "left",
                            title: { display: true, text: "Total General", font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        },
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            title: { display: true, text: "Ticket Prom.", font: { size: 10 } },
                            grid: { drawOnChartArea: false },
                            ticks: { font: { size: 9 } }
                        },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            });
        },

        // GRÁFICO 2: Volumen de Compras (barra apilada)
        dibujarGraficoVolumen() {
            this.destruirGrafico(this.chartVolumenInstance);

            const canvas = this.$refs.chartVolumen;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            const labels = this.datosCliente.map(d => d.eje_x);
            const pedidos = this.datosCliente.map(d => d.num_pedidos);
            const directos = this.datosCliente.map(d => d.num_directo);

            this.chartVolumenInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Pedidos",
                            data: pedidos,
                            backgroundColor: "rgba(0, 188, 212, 0.3)",
                            borderColor: "#00BCD4",
                            borderWidth: 1
                        },
                        {
                            label: "Venta Directa",
                            data: directos,
                            backgroundColor: "rgba(76, 175, 80, 0.3)",
                            borderColor: "#4CAF50",
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } },
                        tooltip: {
                            callbacks: {
                                afterLabel: (ctx) => {
                                    const dataIndex = ctx.dataIndex;
                                    const total = pedidos[dataIndex] + directos[dataIndex];
                                    const pct = total > 0 ? ((ctx.parsed.y / total) * 100).toFixed(1) : 0;
                                    return `(${pct}% del total)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { stacked: true, ticks: { font: { size: 9 } } },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: { display: true, text: "# Compras", font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        }
                    }
                }
            });
        },

        // GRÁFICO 3: Formas de Pago (condicional según cantidad de meses)
        dibujarGraficoPagos() {
            this.destruirGrafico(this.chartPagosInstance);
            const canvas = this.$refs.chartPagos;
            if (!canvas || !this.datosCliente.length) return;

            const ctx = canvas.getContext("2d");
            const labels = this.datosCliente.map(d => d.eje_x);
            const contado = this.datosCliente.map(d => d.num_contado);
            const credito = this.datosCliente.map(d => d.num_credito);
            const otro = this.datosCliente.map(d => d.num_otro_pago);

            // Configuración base
            let config = {
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                }
            };

            // Si es un solo mes, usar DOUGHNUT
            if (this.esMesUnico) {
                config.type = 'doughnut';
                config.data = {
                    labels: ['Contado', 'Crédito', 'Otro'],
                    datasets: [{
                        data: [
                            contado.reduce((a, b) => a + b, 0),
                            credito.reduce((a, b) => a + b, 0),
                            otro.reduce((a, b) => a + b, 0)
                        ],
                        backgroundColor: [
                            "rgba(0, 150, 136, 0.8)",
                            "rgba(255, 152, 0, 0.8)",
                            "rgba(158, 158, 158, 0.8)"
                        ],
                        borderColor: ["#009688", "#FF9800", "#9E9E9E"],
                        borderWidth: 1
                    }]
                };
                config.options.plugins.tooltip = {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const value = ctx.parsed;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${value} compras (${percentage}%)`;
                        }
                    }
                };
            } else {
                // Múltiples meses: usar BARRAS
                config.type = 'bar';
                config.data = {
                    labels,
                    datasets: [
                        {
                            label: "Contado",
                            data: contado,
                            backgroundColor: "rgba(0, 150, 136, 0.8)",
                            borderColor: "#009688",
                            borderWidth: 1
                        },
                        {
                            label: "Crédito",
                            data: credito,
                            backgroundColor: "rgba(255, 152, 0, 0.8)",
                            borderColor: "#FF9800",
                            borderWidth: 1
                        },
                        {
                            label: "Otro",
                            data: otro,
                            backgroundColor: "rgba(158, 158, 158, 0.8)",
                            borderColor: "#9E9E9E",
                            borderWidth: 1
                        }
                    ]
                };
                config.options.scales = {
                    x: { ticks: { font: { size: 9 } } },
                    y: { beginAtZero: true, title: { display: true, text: "# Compras" } }
                };
            }

            this.chartPagosInstance = new Chart(ctx, config);
        },

        // GRÁFICO 4: Ticket Promedio por Tipo (condicional según cantidad de meses)
        dibujarGraficoTicket() {
            this.destruirGrafico(this.chartTicketInstance);

            const canvas = this.$refs.chartTicket;
            if (!canvas || !this.datosCliente.length) return;

            const ctx = canvas.getContext("2d");
            const labels = this.datosCliente.map(d => d.eje_x);
            const ticketPedidos = this.datosCliente.map(d => d.ticket_prom_pedidos);
            const ticketDirectos = this.datosCliente.map(d => d.ticket_prom_directo);

            let config = {
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                }
            };

            // Si es un solo mes, usar PIE
            if (this.esMesUnico) {
                const totalPedidos = ticketPedidos.reduce((a, b) => a + b, 0);
                const totalDirectos = ticketDirectos.reduce((a, b) => a + b, 0);

                config.type = 'pie';
                config.data = {
                    labels: ['Ticket Pedidos', 'Ticket Directos'],
                    datasets: [{
                        data: [totalPedidos, totalDirectos],
                        backgroundColor: [
                            "rgba(33, 150, 243, 0.8)",
                            "rgba(76, 175, 80, 0.8)"
                        ],
                        borderColor: ["#2196F3", "#4CAF50"],
                        borderWidth: 1
                    }]
                };
                config.options.plugins.tooltip = {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const value = ctx.parsed;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${this.monedaSimbolo}${Number(value).toFixed(2)} (${percentage}%)`;
                        }
                    }
                };
            } else {
                // Múltiples meses: usar LÍNEAS
                config.type = 'line';
                config.data = {
                    labels,
                    datasets: [
                        {
                            label: "Ticket Pedidos",
                            data: ticketPedidos,
                            borderColor: "#2196F3",
                            backgroundColor: "rgba(33, 150, 243, 0.2)",
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3
                        },
                        {
                            label: "Ticket Directos",
                            data: ticketDirectos,
                            borderColor: "#4CAF50",
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3
                        }
                    ]
                };
                config.options.plugins.tooltip = {
                    callbacks: {
                        label: (ctx) => {
                            const label = ctx.dataset.label || "";
                            const value = Number(ctx.parsed.y || 0).toFixed(2);
                            return `${label}: ${this.monedaSimbolo}${value}`;
                        }
                    }
                };
                config.options.scales = {
                    x: { ticks: { font: { size: 9 } } },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Ticket Promedio", font: { size: 10 } },
                        ticks: { font: { size: 9 } }
                    }
                };
            }

            this.chartTicketInstance = new Chart(ctx, config);
        },
    },

    // Limpiar gráficos al destruir componente
    beforeDestroy() {
        this.destruirGrafico(this.chartEvolucionInstance);
        this.destruirGrafico(this.chartVolumenInstance);
        this.destruirGrafico(this.chartPagosInstance);
        this.destruirGrafico(this.chartTicketInstance);
    }
};
</script>

<style scoped>
canvas {
    max-width: 100%;
}

@media (max-width: 600px) {
    .v-card__text {
        padding: 8px !important;
    }

    .caption {
        font-size: 10px !important;
    }

    .subtitle-2 {
        font-size: 12px !important;
    }
}

.v-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.v-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}
</style>
