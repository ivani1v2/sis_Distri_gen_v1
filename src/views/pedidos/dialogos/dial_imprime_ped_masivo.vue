<template>
    <v-dialog v-model="dial" max-width="600" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon v-if="tiene_permiso_host" small color="orange" class="mr-2" @click="dial_config_host = true"
                    title="Configurar Impresión Host">mdi-cog</v-icon>
                <v-spacer></v-spacer>
                <v-btn x-small color="success" class="ml-2" @click="imprimirMasivo('A4')"
                    :disabled="!pedidosArray.length">
                    MASIVO A4
                </v-btn>
                <v-btn x-small color="success" class="ml-1" @click="imprimirMasivo('80')"
                    :disabled="!pedidosArray.length">
                    MASIVO 80
                </v-btn>
                <v-btn x-small color="success" class="ml-1" @click="imprimirMasivo('58')"
                    :disabled="!pedidosArray.length">
                    MASIVO 58
                </v-btn>

                <v-icon color="red" large class="ml-2" @click="cerrar()">mdi-close</v-icon>
            </v-system-bar>

        </div>
        <v-card class="pa-2">
            <v-simple-table dense fixed-header height="65vh">
                <thead>
                    <tr>
                        <th style="width:36px">
                            <!-- master checkbox -->
                            <v-checkbox dense hide-details :input-value="allSelected" :indeterminate="indeterminate"
                                @change="toggleAll" />
                        </th>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="p in pedidosArray" :key="p.id">
                        <td>
                            <v-checkbox dense hide-details v-model="selectedIds" :value="String(p.id)" />
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
import { pdfGenera } from "../formatos/orden_pedido.js"; // AJUSTA RUTA si es diferente
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

            // selección
            pedidosArray: [],
            pedidoId: null,
            pedidoSeleccionado: null,

            // detalle
            detalleSeleccionado: [],

            // control
            selectedIds: [],
            imprimiendo: false,
            dial_config_host: false,
        };
    },
    created() {
        console.log(this.pedidosFiltrados)
        this.dial = true;
        this.pedidosArray = Array.isArray(this.pedidosFiltrados) ? this.pedidosFiltrados.slice() : [];
        // ✅ todos seleccionados al inicio
        this.selectedIds = this.pedidosArray.map(p => String(p.id));

        // preselecciona el primero
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
            // cabecera base (ya viene de pedidosFiltrados)
            const pedido = { ...cab };

            // 🔎 Firestore cliente (referencia)
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

            // si necesitas asegurar fecha formateada, aquí
            pedido.fecha = pedido.fecha || (pedido.fecha_emision ? moment.unix(pedido.fecha_emision).format("DD/MM HH:mm") : "");

            return pedido;
        },

        async imprimirUno(tama) {
            try {
                if (!this.pedidoSeleccionado?.id) return;

                store.commit("dialogoprogress");

                // 1) detalle
                const snap = await detalle_pedido(this.pedidoSeleccionado.id).once("value");
                const val = snap.val() || [];
                const items = Array.isArray(val) ? val : Object.values(val);

                // 2) cliente (referencia) + cabecera completa
                const cabecera = await this.buildCabeceraCompleta(this.pedidoSeleccionado);

                // 3) imprimir
                pdfGenera(cabecera, items, tama);
            } catch (e) {
                console.error("imprimirUno:", e);
                alert("No se pudo imprimir este pedido");
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async imprimirMasivo(tama = "A4") {
            if (this.imprimiendo) return;
            try {
                if (!this.pedidosArray.length) return;

                this.imprimiendo = true;
                store.commit("dialogoprogress");

                // ⚠️ imprime UNO POR UNO para no saturar
                const lista = this.pedidosSeleccionados || [];
                if (!lista.length) {
                    alert("No hay pedidos seleccionados para imprimir.");
                    return;
                }

                for (const cab of lista) {

                    // opcional: saltar anulados
                    if (String(cab.estado || "").toLowerCase() === "anulado") continue;

                    // detalle
                    const snap = await detalle_pedido(cab.id).once("value");
                    const val = snap.val() || [];
                    const items = Array.isArray(val) ? val : Object.values(val);

                    // cabecera completa (cliente Firestore)
                    const cabecera = await this.buildCabeceraCompleta(cab);

                    // imprimir
                    pdfGenera(cabecera, items, tama);
                }
            } catch (e) {
                console.error("imprimirMasivo:", e);
                alert("Error en impresión masiva");
            } finally {
                store.commit("dialogoprogress");
                this.imprimiendo = false;
            }
        },

        cerrar() {
            this.$emit("cerrar", true);
            this.dial = false;
        },
    },
};
</script>
