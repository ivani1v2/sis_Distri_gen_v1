<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" fullscreen>
        <div>
            <v-system-bar dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>Genera Reparto</h3>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="mb-2 pa-12 mt-2">
            <v-row dense class="">
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Inicio" v-model="date1" @change="filtrar" />
                </v-col>
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Fin" v-model="date2" @change="filtrar" />
                </v-col>
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense label="Vendedor" v-model="vendedor" @change="filtrar" />
                </v-col>
                <v-col cols="6" md="3" sm="6" class="d-flex align-center mt-n6">
                    <v-menu bottom offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="success" block small v-bind="attrs" v-on="on">
                                Opciones
                                <v-spacer></v-spacer>
                                <v-icon left>mdi-arrow-down-bold</v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click="crear">
                                <v-list-item-title>
                                    <v-icon left>mdi-cash</v-icon> Crear Reparto
                                </v-list-item-title>
                            </v-list-item>
                            <!-- NUEVO: Ver consolidado -->
                            <v-list-item @click="verConsolidado">
                                <v-list-item-title>
                                    <v-icon left>mdi-clipboard-text</v-icon> Ver consolidado
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>

            <v-row class="mb-2 mt-n6">
                <v-col cols="12" class="d-flex align-center">
                    <small class="grey--text">
                        {{ selectedIds.length }} seleccionado(s) de {{ pedidosArray.length }} visibles
                    </small>
                </v-col>
            </v-row>

            <v-simple-table dense fixed-header height="65vh">
                <thead>
                    <tr>
                        <th style="width:36px">
                            <v-checkbox dense hide-details :input-value="allVisibleSelected"
                                :indeterminate="indeterminate" @change="onToggleMaster" />
                        </th>
                        <th>Vendedor</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in pedidosArray" :key="pedido.id">
                        <td>
                            <v-checkbox dense hide-details v-model="selectedIds" :value="String(pedido.id)" />
                        </td>
                        <td style="font-size:75%;">{{ pedido.cod_vendedor }}</td>
                        <td style="font-size:75%;">{{ pedido.doc_numero }} - {{ pedido.cliente_nombre }}</td>
                        <td style="font-size:75%;">{{ pedido.fecha }}</td>
                        <td>
                            <v-chip x-small :color="chipColor(pedido.estado)" dark />
                        </td>
                        <td style="font-size:75%;">S/.{{ number2(pedido.total) }}</td>
                        <td>
                            <v-btn icon small @click="verDetalle(pedido)">
                                <v-icon color="blue">mdi-eye</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>

        <!-- Detalle (por pedido) -->
        <v-dialog v-model="dialogDetalle" max-width="650">
            <v-card>
                <v-toolbar flat color="black" dark dense>
                    <v-toolbar-title>{{ pedidoSeleccionado ? pedidoSeleccionado.id : '' }}</v-toolbar-title>
                    <v-toolbar-title class="ml-12"> S/ {{ pedidoSeleccionado ? pedidoSeleccionado.total : ''
                    }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogDetalle = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <div v-if="pedidoSeleccionado" class="pa-2">
                    <h5>Cliente: <span>{{ pedidoSeleccionado.doc_numero }} - {{ pedidoSeleccionado.cliente_nombre
                    }}</span></h5>
                    <h5>Direcion: <span>{{ pedidoSeleccionado.cliente_direccion }}</span></h5>
                    <h5>Modo : {{ pedidoSeleccionado.condicion_pago }}</h5>
                    <h5>Comprobante : {{ pedidoSeleccionado.tipo_comprobante }}</h5>
                </div>

                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Medida</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="d in detalleSeleccionado" :key="`${d.id}-${d.nombre}`">
                            <td style="font-size:75%;">{{ d.nombre }} <strong class="red--text" v-if="d.operacion=='GRATUITA'">{{ d.operacion }}</strong></td>
                            <td style="font-size:75%;">{{ d.cantidad }}</td>
                            <td style="font-size:75%;">{{ d.medida }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.precio) }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.totalLinea) }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <!-- NUEVO: Consolidado de seleccionados -->
        <!-- Consolidado de seleccionados -->

        <!-- Diálogo CREAR REPARTO -->
        <v-dialog v-model="dialogCrear" max-width="520">
            <v-card>
                <v-toolbar flat dark color="black" dense>
                    <v-btn icon @click="dialogCrear = false"><v-icon>mdi-close</v-icon></v-btn>
                    <v-toolbar-title>Crear Reparto</v-toolbar-title>
                    <v-spacer></v-spacer>
                </v-toolbar>

                <v-card-text class="pt-4">
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-text-field dense outlined type="date" label="Fecha de Traslado"
                                v-model="fechaTraslado" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field dense outlined type="date" label="Fecha de Emisión" v-model="fechaEmision" />
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12" sm="6">
                            <div class="subtitle-2">T. CONTADO:
                                <span class="red--text font-weight-bold">S/. {{ number2(totalContadoSel) }}</span>
                            </div>
                            <div class="subtitle-2">T. CRÉDITO:
                                <span class="red--text font-weight-bold">S/. {{ number2(totalCreditoSel) }}</span>
                            </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <div class="subtitle-2">T. PESO:
                                <span class="red--text font-weight-bold">{{ number2(pesoTotalSel) }} KG</span>
                            </div>
                            <div class="subtitle-2">T. PEDIDOS:
                                <span class="red--text font-weight-bold">{{ totalPedidosSel }}</span>
                            </div>
                        </v-col>
                    </v-row>

                    <div class="mt-4 title">T. GENERAL:
                        <span class="red--text font-weight-bold">S/. {{ number2(totalGeneralSel) }}</span>
                    </div>
                </v-card-text>

                <v-card-actions class="px-4 pb-4">
                    <v-spacer></v-spacer>
                    <v-btn color="success" large @click="confirmarCrearReparto">
                        <v-icon left>mdi-check-circle</v-icon> Crear
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- BLOQUEADOR GLOBAL -->
        <v-dialog v-model="blocking" persistent max-width="320">
            <v-card class="pa-6 d-flex align-center justify-center" elevation="8">
                <div class="text-center">
                    <v-progress-circular indeterminate size="48" class="mb-3"></v-progress-circular>
                    <div class="subtitle-1 font-weight-medium">Procesando…</div>
                    <small class="grey--text">No cierres esta ventana</small>
                </div>
            </v-card>
        </v-dialog>
        <dial_consolidado v-if="dialogConsolidado" :selected-ids="selectedIds"
            :consolidado-seleccionados="consolidadoSeleccionados" @cierra="dialogConsolidado = false" />
    </v-dialog>
</template>

<script>
import moment from "moment";
import { all_pedidos, detalle_pedido } from "../../../db";
import dial_consolidado from "./dialogo_rep_consolidado.vue"
import store from '@/store/index'
import axios from "axios";
export default {
    components: {
        dial_consolidado
    },
    data() {
        return {
            dial: false,
            vendedor: 'todos',
            dialogDetalle: false,
            pedidoSeleccionado: null,
            detalleSeleccionado: [],
            // NUEVO: consolidado
            dialogConsolidado: false,
            consolidadoSeleccionados: [],
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            pedidosArray: [],
            refOrden: null,
            selectedIds: [],
            dialogCrear: false,
            fechaTraslado: this.date1, // o moment().format("YYYY-MM-DD")
            fechaEmision: this.date2,  // o moment().add(1,'day').format("YYYY-MM-DD")
            blocking: false,
        };
    },
    computed: {
        visibleIds() {
            return this.pedidosArray.map(p => String(p.id));
        },
        allVisibleSelected() {
            return this.visibleIds.length > 0 &&
                this.visibleIds.every(id => this.selectedIds.includes(id));
        },
        indeterminate() {
            const count = this.selectedIds.filter(id => this.visibleIds.includes(id)).length;
            return count > 0 && count < this.visibleIds.length;
        },

        seleccionados() {
            const set = new Set(this.selectedIds.map(String));
            return this.pedidosArray.filter(p => set.has(String(p.id)));
        },
        totalPedidosSel() {
            return this.seleccionados.length;
        },
        totalContadoSel() {
            return this.seleccionados
                .filter(p => String(p.condicion_pago || '').toUpperCase().includes('CONTADO'))
                .reduce((a, b) => a + Number(b.total || 0), 0);
        },
        totalCreditoSel() {
            return this.seleccionados
                .filter(p => String(p.condicion_pago || '').toUpperCase().includes('CREDITO') || String(p.condicion_pago || '').toUpperCase().includes('CRÉDITO'))
                .reduce((a, b) => a + Number(b.total || 0), 0);
        },
        totalGeneralSel() {
            return this.seleccionados.reduce((a, b) => a + Number(b.total || 0), 0);
        },
        pesoTotalSel() {
            // si viene peso_total en cabecera, úsalo; si no, 0
            return this.seleccionados.reduce((a, b) => a + Number(b.peso_total || 0), 0);
        },
    },
    created() {
        this.dial = true
        this.filtrar();
    },
    beforeDestroy() {
        this._detach();
    },
    watch: {
        date1() { this.filtrar(); },
        date2() { this.filtrar(); },
        vendedor() { this.filtrar(); },
    },
    methods: {
        async verConsolidado() {
            if (this.selectedIds.length === 0) {
                this.$toast && this.$toast.info
                    ? this.$toast.info("Selecciona al menos un documento.")
                    : alert("Selecciona al menos un documento.");
                return;
            }

            // Mapa rápido id -> pedido para leer datos de cabecera (cliente)
            const byId = new Map(this.pedidosArray.map(p => [String(p.id), p]));
            const acumulado = [];

            try {
                // (opcional) muestra spinner global si usas Vuex
                store.commit && store.commit("dialogoprogress");

                await Promise.all(
                    this.selectedIds.map(async (id) => {
                        const p = byId.get(String(id)) || {};
                        const snap = await detalle_pedido(id).once("value");
                        const val = snap.val() || [];
                        const items = Array.isArray(val) ? val : Object.values(val);

                        items.forEach(d => {
                            acumulado.push({
                                pedidoId: id,
                                cliente: `${p.doc_numero || ''} - ${p.cliente_nombre || ''}`.trim(),
                                nombre: d.nombre,
                                cantidad: d.cantidad,
                                medida: d.medida,
                                precio: d.precio,
                                total_linea: d.totalLinea
                            });
                        });
                    })
                );

                // ordenar opcionalmente por pedido y luego por producto
                acumulado.sort((a, b) => {
                    if (a.pedidoId === b.pedidoId) return String(a.nombre).localeCompare(String(b.nombre));
                    return String(a.pedidoId).localeCompare(String(b.pedidoId));
                });

                this.consolidadoSeleccionados = acumulado;
                this.dialogConsolidado = !this.dialogConsolidado;
            } finally {
                store.commit && store.commit("dialogoprogress");
            }
        },

        onToggleMaster(val) {
            if (val) {
                const set = new Set([...this.selectedIds, ...this.visibleIds]);
                this.selectedIds = Array.from(set);
            } else {
                const visible = new Set(this.visibleIds);
                this.selectedIds = this.selectedIds.filter(id => !visible.has(id));
            }
        },

        crear() {
            if (this.selectedIds.length === 0) {
                this.$toast && this.$toast.info
                    ? this.$toast.info("Selecciona al menos un documento.")
                    : alert("Selecciona al menos un documento.");
                return;
            }
            // precarga fechas (si quieres sincronizarlas con filtros)
            this.fechaTraslado = this.date1;
            this.fechaEmision = this.date2;
            this.dialogCrear = true;
        },
        async confirmarCrearReparto() {
            try {
                if (this.blocking) return;
                this.blocking = true;

                // 🔁 convertir a unix (segundos)
                const unixTraslado = moment(String(this.fechaTraslado)) / 1000;
                const unixEmision = moment(String(this.fechaEmision)) / 1000;

                if (unixTraslado == null || unixEmision == null) {
                    this.$toast?.error
                        ? this.$toast.error("Fechas inválidas. Revisa traslado/emisión.")
                        : alert("Fechas inválidas. Revisa traslado/emisión.");
                    return;
                }

                const payload = {
                    fecha_traslado: unixTraslado,
                    fecha_emision: moment().unix(),
                    vendedor: this.vendedor,
                    pedidos: this.selectedIds,  // IDs seleccionados
                    resumen: {
                        total_contado: this.totalContadoSel.toFixed(2),
                        total_credito: this.totalCreditoSel.toFixed(2),
                        peso_total: this.pesoTotalSel.toFixed(2),
                        total_pedidos: this.totalPedidosSel.toFixed(2),
                        total_general: this.totalGeneralSel.toFixed(2),
                    },
                };

                console.log("Payload reparto:", payload); // verás los UNIX (ej. 1757472000)

                var resp = await this.api_rest(payload, "crea_reparto");
                console.log('res', resp.data.data.grupo)
                this.$router.push({
                    path: "/liquida_reparto/" + resp.data.data.grupo
                })
                /* this.$toast?.success
                     ? this.$toast.success("Reparto creado correctamente.")
                     : alert("Reparto creado correctamente.");
 
                 this.dialogCrear = false;*/
            } catch (e) {
                console.error(e);
                this.$toast?.error
                    ? this.$toast.error("Error creando el reparto.")
                    : alert("Error creando el reparto.");
            }
            finally {
                this.blocking = false; // <-- cierra el bloqueo siempre
            }
        },
        async api_rest(data, metodo) {
            console.log(data)
            var a = axios({
                method: 'POST',
                url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
               //url: 'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion',
                headers: {},
                data: {
                    "bd": store.state.baseDatos.bd,
                    "data": data,
                    "metodo": metodo
                }
            }).then(response => {

                return response
            })
            return a
        },
        chipColor(estado) {
            const s = (estado || '').toString().toLowerCase();
            if (s === 'anulado') return 'red';
            if (s === 'procesado' || s === 'atendido') return 'blue';
            return 'orange';
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

            this.refOrden.on("value", this.onDataChange);
        },

        onDataChange(snap) {
            const arr = [];
            snap.forEach(item => {
                const data = item.val() || {};
              if (data?.estado !== 'pendiente' || !(Number(data?.total) > 0)) return;
                data.id = item.key;
                data.fecha = this.formatFecha(data.fecha_emision);

                if (this.vendedor && this.vendedor.toString().toLowerCase() !== 'todos') {
                    const cod = (data.cod_vendedor || '').toString().toLowerCase();
                    if (cod !== this.vendedor.toString().toLowerCase()) return;
                }
                arr.push(data);
            });
            this.pedidosArray = arr;

            // mantener seleccionados solo los visibles
            const visible = new Set(arr.map(p => String(p.id)));
            this.selectedIds = this.selectedIds.filter(id => visible.has(id));
        },

        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },

        async verDetalle(pedido) {
            this.pedidoSeleccionado = pedido;
            store.commit("dialogoprogress");
            const snap = await detalle_pedido(pedido.id).once("value")
            const val = snap.val() || [];
            const items = Array.isArray(val) ? val : Object.values(val);
            this.detalleSeleccionado = items;
            this.dialogDetalle = true;
            store.commit("dialogoprogress");
        },

        cierra() {
            this.dial = false
            this.$emit('cierra')
        },
    },
};
</script>
