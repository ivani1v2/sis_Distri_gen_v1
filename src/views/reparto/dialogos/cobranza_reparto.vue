<template>
    <v-dialog v-model="dial" max-width="650" persistent>
        <v-card elevation="2" class="pa-2 mb-3">
           <v-row no-gutters align="center" class="mb-2">
                <v-col>
                    <div class="text-h6 font-weight-bold">
                        Liquidacion Reparto {{ grupo }}
                    </div>
                </v-col>
                <v-col cols="auto">
                    <v-btn icon small color="red" @click="$emit('cerrar')">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
            

            <!-- Totales generales -->
            <v-row dense>
                <v-col cols="6" sm="3">
                    <v-chip color="blue" dark class="ma-1" block>
                        Total : {{ moneda }} {{ totalPedido.toFixed(2) }}
                    </v-chip>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-chip color="green" dark class="ma-1" block>
                        Cobrado: {{ moneda }} {{ totalCobrado.toFixed(2) }}
                    </v-chip>
                </v-col>

                <v-col cols="6" sm="3">
                    <v-chip color="red" dark class="ma-1" block>
                        Rechazos: {{ moneda }} {{ totalRechazado.toFixed(2) }}
                    </v-chip>
                </v-col>

                <v-col cols="6" sm="3">
                    <v-chip color="orange" dark class="ma-1" block>
                        Ítems rechazados: {{ totalItemsRechazados }}
                    </v-chip>
                </v-col>
            </v-row>

            <!-- Totales por método de pago -->
            <div class="text-subtitle-2 font-weight-bold mt-2 mb-1">
                Por método de pago
            </div>

            <v-row dense>
                <v-col v-for="(m, key) in totalesPorPago" :key="key" cols="6" sm="3">
                    <v-chip outlined class="ma-1" color="primary" block>
                        {{ key }}: {{ moneda }} {{ m.toFixed(2) }}
                    </v-chip>
                </v-col>
            </v-row>
            <v-btn class="mt-6" color="red darken-1" dark block @click="dialog = true" small>
                Ver detalle rechazados ({{ totalItemsRechazados }})
            </v-btn>
        </v-card>

        <!-- Botón para ver detalle rechazados -->


        <!-- Dialogo detalle rechazados -->
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title class="font-weight-bold">
                    Productos rechazados
                </v-card-title>

                <v-card-text>
                    <v-data-table :headers="headers" :items="rechazos" dense disable-pagination mobile-breakpoint="1"
                        hide-default-footer />
                </v-card-text>

                <v-card-actions>
                    <v-btn text color="red" @click="dialog = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>
<script>
import { all_detalle_entrega } from "../../../db";

export default {
    name: "cobranza_reparto",
    props: {
        grupo: { type: String, required: true },
        pedidos: { type: Array, required: true }
    },
    data() {
        return {
            dial: false,
            dataEntrega: {},
            rechazos: [],
            dialog: false,
            moneda: "S/ ",
            headers: [
                { text: "Producto", value: "nombre" },
                { text: "Cant", value: "cantidad" },
                { text: "Precio", value: "precio_unit" },
                { text: "Total", value: "total_linea" }
            ]
        };
    },
    computed: {
        totalCobrado() {
            return Object.values(this.dataEntrega).reduce((acc, o) => acc + (o.total_cobrado || 0), 0);
        },
        totalPedido() {
            return Object.values(this.dataEntrega).reduce((acc, o) => acc + (o.total_pedido || 0), 0);
        },
        totalRechazado() {
            return Object.values(this.dataEntrega).reduce((acc, o) => acc + (o.total_rechazado || 0), 0);
        },
        totalItemsRechazados() {
            return this.rechazos.reduce((acc, r) => acc + (r.cantidad || 0), 0);
        },
        totalesPorPago() {
            const tot = {};
            Object.values(this.dataEntrega).forEach(p => {
                (p.pagos_entrega || []).forEach(pg => {
                    tot[pg.nombre] = (tot[pg.nombre] || 0) + pg.monto;
                });
            });
            return tot;
        }
    },
    created() {
        this.obtenerDetallesEntrega(this.grupo);
        this.dial = true;
    },
    methods: {
        obtenerDetallesEntrega(grupo) {
            all_detalle_entrega(grupo).once("value", snap => {
                this.dataEntrega = snap.val() || {};
                this.rechazos = Object.values(this.dataEntrega)
                    .flatMap(p => p.rechazos || []);
            });
        }
    }
};
</script>