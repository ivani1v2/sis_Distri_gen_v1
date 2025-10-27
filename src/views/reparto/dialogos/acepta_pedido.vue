<template>
    <v-dialog v-model="dial" max-width="650" persistent>
        <!-- Barra superior con cerrar -->
        <div>
            <v-system-bar window dark>
                <v-icon color="red" @click="cerrar_dialogo()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h2 class="red--text">
                    <strong>{{ moneda }} {{ redondear(item_selecto.total) }}</strong>
                </h2>
                <v-spacer></v-spacer>
                <span>
                    N° {{ item_selecto.id }}
                </span>
            </v-system-bar>
        </div>

        <v-card class="">
            <v-card-subtitle class="grey--text text--darken-4">
                <span class="grey--text text--darken-4">
                    <h4 class="">{{ item_selecto.dni }} - {{ item_selecto.cliente }}</h4>
                </span>

                <!-- chip forma de pago -->
                <v-chip x-small :color="chipPagoColor(item_selecto.forma_pago)" dark
                    class="text-uppercase font-weight-bold mr-2" style="font-size:10px; letter-spacing:.03em;">
                    {{ chipPagoTexto(item_selecto.forma_pago) }}
                </v-chip>

                <!-- chip número de ítems -->
                <v-chip x-small :color="chipItemsColor()" dark class="font-weight-bold mr-2"
                    style="font-size:10px; letter-spacing:.03em;">
                    {{ totalItemsPedido }} ítems
                </v-chip>

                <br>
            </v-card-subtitle>

            <v-card-actions class="mt-n6">
                <v-spacer></v-spacer>
                <v-btn x-small @click="confirmarEntrega" color="success" class="ma-2">
                    <v-icon left>mdi-check</v-icon>
                    Confirmar entrega
                </v-btn>
            </v-card-actions>

            <v-divider class="mb-2"></v-divider>

            <!-- LISTA DE PRODUCTOS -->
            <v-simple-table class="elevation-0" dense>
                <thead class="d-none">
                    <tr>
                        <th>Ítems</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in itemsCalculados" :key="item.uuid || item.id"
                        @click.prevent="editaProducto(item)">
                        <td class="pa-0 mt-n1 mb-n1">
                            <v-card class="ma-1 pa-2" outlined :elevation="0" ripple>
                                <div class="d-flex align-center mt-n2 mb-n2">

                                    <!-- Columna texto -->
                                    <div class="flex-grow-1 mr-2">
                                        <!-- precio + chips -->
                                        <div class="text-caption grey--text text--darken-1">
                                            <span>
                                                Precio: {{ moneda }}
                                                {{ redondear(item.precio) }}
                                            </span>

                                            <v-chip v-if="Number(item.preciodescuento) > 0" x-small class="ml-1"
                                                color="deep-orange" text-color="white" label>
                                                −{{ moneda }} {{ redondear(item.preciodescuento) }}
                                            </v-chip>

                                            <v-chip v-if="item.medida" x-small class="ml-1" label>
                                                {{ item.medida }}
                                            </v-chip>

                                            <v-chip v-if="item.operacion === 'GRATUITA'" x-small class="ml-1"
                                                color="pink" text-color="white" label>
                                                Gratuita
                                            </v-chip>
                                        </div>

                                        <!-- nombre y cantidad -->
                                        <div class="mt-1 text-subtitle-2 text-truncate" style="max-width: 70vw;">
                                            <span class="font-weight-bold red--text">
                                                {{ Number(item.cantidad) }}×
                                            </span>
                                            {{ item.nombre }}
                                        </div>
                                    </div>

                                    <!-- Columna total -->
                                    <div class="text-right mr-1">
                                        <div class="subtitle-2 font-weight-bold">
                                            {{ moneda }}
                                            {{ redondear(item.totalLinea) }}
                                        </div>
                                        <div class="caption grey--text">Total</div>
                                    </div>
                                </div>
                            </v-card>
                        </td>
                    </tr>

                    <!-- vacío -->
                    <tr v-if="!itemsCalculados || itemsCalculados.length === 0">
                        <td class="py-6 text-center grey--text">
                            No hay productos rechazados.
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>
    </v-dialog>
</template>

<script>
import { all_detalle_p,grabaCabecera_p } from "../../../db";

export default {
    props: {
        item_selecto: { type: Object, required: true },
    },
    data() {
        return {
            dial: false,
            array_detalle: [],
            moneda: "S/.",
            array_rechazos: [],
        };
    },
    async created() {
        await this.busca_detalle();
        this.dial = true;
    },
    computed: {
        // ítems mostrados en la tabla (rechazados en tu caso actual)
        itemsCalculados() {
            return this.array_rechazos;
        },

        // total de ítems del pedido original (todos)
        totalItemsPedido() {
            return this.array_detalle.length;
        },
    },
    methods: {
        async busca_detalle() {
            const snap = await all_detalle_p(
                this.item_selecto.id_grupo,
                this.item_selecto.id
            ).once("value");

            const raw = snap.val() || [];

            if (Array.isArray(raw)) {
                this.array_detalle = raw;
            } else {
                this.array_detalle = Object.keys(raw).map((k) => ({
                    uuid: k,
                    ...raw[k],
                }));
            }

            // si quieres que array_rechazos empiece llenado con algo,
            // puedes filtrarlo aquí. Por ahora lo dejo intacto.
        },

        redondear(n) {
            const num = Number(n || 0);
            return num.toFixed(2);
        },

        editaProducto(item) {
            console.log("Editar producto:", item);
        },

        cerrar_dialogo() {
            this.dial = false;
            this.$emit("cerrar");
        },

        chipPagoColor(forma) {
            const f = (forma || "").toLowerCase();
            if (f === "contado") return "green darken-2";
            if (f === "credito" || f === "crédito") return "indigo darken-2";
            return "grey darken-1";
        },

        chipPagoTexto(forma) {
            if (!forma) return "—";
            const f = forma.toLowerCase();
            if (f === "contado") return "contado";
            if (f === "credito" || f === "crédito") return "crédito";
            return forma;
        },

        chipItemsColor() {
            // color neutro pero distinto al de forma de pago
            return "blue-grey darken-2";
        },

       async  confirmarEntrega() {
            // lógica que ya tendrás/null por ahora
             if (!confirm(`¿Confirma el Entrega del pedido N° ${this.item_selecto.id}?`)) {
                return;
            }
            this.$store.commit("dialogoprogress");
            await Promise.all([
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/estado_entrega`, 'entregado'),
            ]);

            this.$store.commit("dialogoprogress");
            this.$emit('guardado',{ grupo: this.item_selecto.id_grupo });
        },
    },
};
</script>
