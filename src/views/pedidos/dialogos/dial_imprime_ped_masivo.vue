<template>
    <v-dialog v-model="dial" max-width="600" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon v-if="tiene_permiso_host" small color="orange" class="mr-2" @click="dial_config_host = true"
                    title="Configurar Impresión Host">mdi-cog</v-icon>
                <v-spacer></v-spacer>
                <v-btn x-small color="success" class="ml-2" @click="imprimirMasivo('A4')"
                    :disabled="!pedidosArray.length || imprimiendo">
                    MASIVO A4
                </v-btn>
                <v-btn x-small color="success" class="ml-1" @click="imprimirMasivo('80')"
                    :disabled="!pedidosArray.length || imprimiendo">
                    MASIVO 80
                </v-btn>
                <v-btn x-small color="success" class="ml-1" @click="imprimirMasivo('58')"
                    :disabled="!pedidosArray.length || imprimiendo">
                    MASIVO 58
                </v-btn>

                <v-icon color="red" large class="ml-2" @click="cerrar()">mdi-close</v-icon>
            </v-system-bar>

        </div>
        <v-card class="pa-2">
            <v-progress-linear v-if="imprimiendo" :value="printPercent" height="15" color="teal" striped class="mb-2">
                <template v-slot:default="{ value }">
                    <strong>{{ Math.ceil(value) }}%</strong>
                </template>
            </v-progress-linear>

            <div v-if="imprimiendo" class="text-center mb-2 caption">
                {{ printDone }} de {{ printTotal }} pedidos - {{ formatoActual }}
            </div>

            <v-simple-table dense fixed-header height="65vh">
                <thead>
                    <tr>
                        <th style="width:36px">
                            <v-checkbox dense hide-details :input-value="allSelected" :indeterminate="indeterminate"
                                @change="toggleAll" :disabled="imprimiendo" />
                        </th>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in pedidosArray" :key="p.id">
                        <td>
                            <v-checkbox dense hide-details v-model="selectedIds" :value="String(p.id)"
                                :disabled="imprimiendo" />
                        </td>

                        <td style="font-size:75%;">{{ p.id }}</td>
                        <td style="font-size:75%;">{{ p.doc_numero }} - {{ p.cliente_nombre }}</td>
                        <td style="font-size:75%;"><strong>{{ p.moneda }}</strong> {{ number2(p.total) }}</td>
                    </tr>
                </tbody>
            </v-simple-table>
            <div class="mt-2">
                <small class="grey--text">
                    {{ selectedIds.length }} seleccionado(s) de {{ pedidosArray.length }}
                </small>
                <small v-if="printError" class="red--text ml-2">{{ printError }}</small>
            </div>
        </v-card>
        <impresorahost v-if="dial_config_host" @cierra="dial_config_host = false" />
    </v-dialog>

</template>

<script>
import moment from "moment";
import { detalle_pedido } from "../../../db";
import store from "@/store/index";
import { colClientes } from "../../../db_firestore";
import { pdfGenera } from "../formatos/orden_pedido.js";
import { impresionQueue } from "../../../impresionQueue";
import impresorahost from '@/components/configEmpresa/impresorahost.vue'

export default {
    name: "dial_imprime_ped_masivo",
    components: {
        impresorahost
    },
    props: {
        pedidosFiltrados: { type: Array, default: () => [] },
    },
    data() {
        return {
            dial: true,
            pedidosArray: [],
            pedidoId: null,
            pedidoSeleccionado: null,
            detalleSeleccionado: [],
            selectedIds: [],
            imprimiendo: false,
            dial_config_host: false,
            printTotal: 0,
            printDone: 0,
            printError: '',
            formatoActual: 'A4',
        };
    },
    created() {
        console.log(this.pedidosFiltrados)
        this.dial = true;
        this.pedidosArray = Array.isArray(this.pedidosFiltrados) ? this.pedidosFiltrados.slice() : [];
        this.selectedIds = this.pedidosArray.map(p => String(p.id));

        if (this.pedidosArray.length) {
            this.pedidoId = this.pedidosArray[0].id;
            this.pedidoSeleccionado = this.pedidosArray[0];
            this.consultar_detalle();
        }
    },
    computed: {
        allSelected() {
            return this.pedidosArray.length > 0 && this.selectedIds.length === this.pedidosArray.length;
        },
        indeterminate() {
            return this.selectedIds.length > 0 && this.selectedIds.length < this.pedidosArray.length;
        },
        pedidosSeleccionados() {
            const set = new Set(this.selectedIds.map(String));
            return this.pedidosArray.filter(p => set.has(String(p.id)));
        },
        tiene_permiso_host() {
            return store.state.permisos?.permite_impresion_host === true;
        },
        printPercent() {
            return this.printTotal ? (this.printDone / this.printTotal) * 100 : 0;
        }
    },

    methods: {
        toggleAll(val) {
            if (val) {
                this.selectedIds = this.pedidosArray.map(p => String(p.id));
            } else {
                this.selectedIds = [];
            }
        },

        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },

        async seleccionarPedido() {
            const p = this.pedidosArray.find(x => String(x.id) === String(this.pedidoId));
            this.pedidoSeleccionado = p || null;
            this.detalleSeleccionado = [];
            if (this.pedidoSeleccionado) await this.consultar_detalle();
        },

        getReferenciaPrincipal(cliente) {
            if (!cliente || !Array.isArray(cliente.direcciones) || cliente.direcciones.length === 0) return "";
            const dir = cliente.direcciones.find(d => d && d.principal) || cliente.direcciones[0];
            return (dir && dir.referencia) ? String(dir.referencia).trim() : "";
        },

        async consultar_detalle() {
            try {
                if (!this.pedidoSeleccionado?.id) return;

                store.commit("dialogoprogress");
                const snap = await detalle_pedido(this.pedidoSeleccionado.id).once("value");
                const val = snap.val() || [];
                const items = Array.isArray(val) ? val : Object.values(val);
                this.detalleSeleccionado = items;
            } catch (e) {
                console.error("consultar_detalle:", e);
                this.detalleSeleccionado = [];
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async buildCabeceraCompleta(cab) {
            const pedido = { ...cab };

            try {
                const doc = await colClientes().doc(String(pedido.doc_numero)).get();
                if (doc.exists) {
                    pedido.referencia = this.getReferenciaPrincipal(doc.data());
                } else {
                    pedido.referencia = "";
                }
            } catch (e) {
                console.warn("No pude leer cliente Firestore:", e);
                pedido.referencia = "";
            }

            pedido.fecha = pedido.fecha || (pedido.fecha_emision ? moment.unix(pedido.fecha_emision).format("DD/MM HH:mm") : "");

            return pedido;
        },

        async imprimirMasivo(tama = "A4") {
            if (this.imprimiendo) return;

            try {
                const lista = this.pedidosSeleccionados || [];
                if (!lista.length) {
                    alert("No hay pedidos seleccionados para imprimir.");
                    return;
                }

                this.formatoActual = tama;
                this.imprimiendo = true;
                this.printTotal = lista.length;
                this.printDone = 0;
                this.printError = '';

                await this.imprimir_recursivo(lista, 0, tama);

            } catch (e) {
                console.error("imprimirMasivo:", e);
                this.printError = "Error en impresión masiva";
            } finally {
                this.imprimiendo = false;
            }
        },
        async imprimir_recursivo(array, index, tama) {
            try {
                if (index < array.length) {
                    const cab = array[index];

                    if (String(cab.estado || "").toLowerCase() === "anulado") {
                        this.printDone = index + 1;
                        await this.imprimir_recursivo(array, index + 1, tama);
                        return;
                    }

                    this.printDone = index;
                    const snap = await detalle_pedido(cab.id).once("value");
                    const val = snap.val() || [];
                    const items = Array.isArray(val) ? val : Object.values(val);

                    const cabecera = await this.buildCabeceraCompleta(cab);
                    await impresionQueue.add(async (docId) => {
                        await pdfGenera(cabecera, items, tama, 'abre', docId);
                    });

                    this.printDone = index + 1;
                    setTimeout(() => {
                        this.imprimir_recursivo(array, index + 1, tama);
                    }, 500);

                } else {
                    const mensaje = `${array.length} pedido(s) impreso(s) en formato ${tama}`;
                    store.commit('dialogosnackbar', mensaje);
                    this.$emit("impresion-completada", true);
                }
            } catch (e) {
                console.error("Error imprimiendo pedido:", e);
                this.printError = `Error en pedido ${index + 1}`;

                setTimeout(() => {
                    this.imprimir_recursivo(array, index + 1, tama);
                }, 500);
            }
        },
        cerrar() {
            this.$emit("cerrar", true);
            this.dial = false;
        },
    },
};
</script>