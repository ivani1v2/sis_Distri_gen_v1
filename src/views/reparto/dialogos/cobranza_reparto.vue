<template>
    <v-dialog v-model="dial" max-width="700" persistent>
        <v-card elevation="8" class="pa-4 pb-2 rounded-lg">
            <v-row no-gutters align="center" class="mb-3">
                <v-col>
                    <div class="text-h5 font-weight-bold primary--text">
                        Liquidación de Reparto
                    </div>
                    <div class="text-subtitle-1 text--secondary">
                        Grupo: **{{ grupo }}**
                    </div>
                </v-col>
                <v-col cols="auto">
                    <v-btn icon large color="red" @click="$emit('cerrar')" title="Cerrar liquidación">
                        <v-icon>mdi-close-circle-outline</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <v-divider class="mb-4"></v-divider>

            <div class="text-subtitle-1 font-weight-bold mb-2">
                <v-icon left color="primary">mdi-finance</v-icon>
                Resumen Financiero
            </div>

            <v-row dense class="mb-4">
                <v-col cols="6" sm="4">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="blue lighten-5">
                        <div class="caption font-weight-bold blue--text">TOTAL PEDIDO</div>
                        <div class="text-h6 font-weight-black blue--text text--darken-2">
                            {{ moneda }} {{ totalPedido.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="4">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="green lighten-5">
                        <div class="caption font-weight-bold green--text text--darken-3">TOTAL COBRADO</div>
                        <div class="text-h6 font-weight-black green--text text--darken-4">
                            {{ moneda }} {{ totalCobrado.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="4">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="red lighten-5">
                        <div class="caption font-weight-bold red--text text--darken-2">VALOR RECHAZADO</div>
                        <div class="text-h6 font-weight-black red--text text--darken-4">
                            {{ moneda }} {{ totalRechazado.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="3" offset-sm="9" class="mt-2">
                    <v-chip color="orange lighten-4" text-color="orange darken-4" block small class="font-weight-bold">
                        <v-icon left small>mdi-package-variant-remove</v-icon>
                        Ítems rechazados: **{{ totalItemsRechazados }}**
                    </v-chip>
                </v-col>
            </v-row>

            <v-divider class="mb-4"></v-divider>
            <div class="text-subtitle-1 font-weight-bold mb-2">
                <v-icon left color="amber darken-2">mdi-cash-multiple</v-icon>
                Desglose por Método de Pago
            </div>

            <v-row dense>
                <v-col v-for="(m, key) in totalesPorPago" :key="key" cols="6" sm="4" md="3">
                    <v-chip outlined class="ma-1 font-weight-medium" color="primary" block>
                        <span class="text-truncate">{{ key }}</span>: {{ moneda }} {{ m.toFixed(2) }}
                    </v-chip>
                </v-col>
            </v-row>

            <v-row class="mt-6 mb-2" dense>
                <v-col cols="12" sm="6">
                    <v-btn color="error" dark block  @click="dialog = true" :disabled="totalItemsRechazados === 0"
                        class="font-weight-bold">
                        <v-icon left>mdi-truck-remove</v-icon>
                        Ver detalle rechazados ({{ totalItemsRechazados }})
                    </v-btn>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-btn color="primary" dark block @click="dialogPdfOpciones = true" class="font-weight-bold">
                        <v-icon left>mdi-file-pdf-box</v-icon>
                        Descargar
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>

        <v-dialog v-model="dialog" max-width="550">
            <v-card class="rounded-lg">
                <v-card-title class="font-weight-bold primary white--text py-3">
                    <v-icon left>mdi-package-variant-remove</v-icon>
                    Productos Rechazados
                </v-card-title>

                <v-card-text class="pt-4">
                    <div v-if="totalItemsRechazados === 0" class="text-center text-subtitle-1 grey--text">
                        No hay productos rechazados para este grupo de reparto.
                    </div>
                    <v-data-table v-else :headers="headers" :items="rechazos" dense disable-pagination
                        mobile-breakpoint="1" hide-default-footer class="elevation-1">
                        <template v-slot:item.precio_unit="{ item }">
                            {{ moneda }} {{ item.precio_unit.toFixed(2) }}
                        </template>
                        <template v-slot:item.total_linea="{ item }">
                            <span class="font-weight-bold red--text">
                                {{ moneda }} {{ item.total_linea.toFixed(2) }}
                            </span>
                        </template>
                    </v-data-table>
                </v-card-text>

                <v-card-actions class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="dialog = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Diálogo de opciones de PDF -->
        <v-dialog v-model="dialogPdfOpciones" max-width="350">
            <v-card class="rounded-lg pa-4">
                <v-card-title class="text-h6 font-weight-bold justify-center">
                    <v-icon left color="primary">mdi-file-pdf-box</v-icon>
                    Seleccione tipo de PDF
                </v-card-title>
                <v-card-text class="text-center pt-4">
                    <v-btn color="blue darken-2" dark block class="mb-3" @click="generarPdf(); dialogPdfOpciones = false">
                        <v-icon left>mdi-file-chart</v-icon>
                        PDF Liquidación
                    </v-btn>
                    <v-btn color="teal darken-1" dark block @click="generarPdfDetalle(); dialogPdfOpciones = false">
                        <v-icon left>mdi-file-table-outline</v-icon>
                        PDF Detalle
                    </v-btn>
                </v-card-text>
                <v-card-actions class="pt-0 justify-center">
                    <v-btn text color="grey" @click="dialogPdfOpciones = false">Cancelar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>
<script>
import { all_detalle_entrega, all_Cabecera_p } from "../../../db";
import { pdfGenera, pdfGeneraDetalle } from "../../reparto/formatos/formato_liquida";
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
            dialogPdfOpciones: false,
            moneda: "S/ ",
            headers: [
                { text: "Producto", value: "nombre" },
                { text: "Cantidad", value: "cantidad", align: "center", width: "80px" },
                { text: "P. Unit", value: "precio_unit", align: "right" },
                { text: "Total", value: "total_linea", align: "right" }
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
            // El valor rechazado es la diferencia entre el pedido original y lo cobrado, 
            // aunque el cálculo a partir del campo total_rechazado es más directo si existe.
            return Object.values(this.dataEntrega).reduce((acc, o) => acc + (o.total_rechazado || 0), 0);
        },
        totalItemsRechazados() {
            return this.rechazos.reduce((acc, r) => acc + (r.cantidad || 0), 0);
        },
        totalesPorPago() {
            const tot = {};
            Object.values(this.dataEntrega).forEach(p => {
                (p.pagos_entrega || []).forEach(pg => {
                    // Usamos el nombre del método de pago en mayúsculas para mejor presentación
                    const key = pg.nombre ? pg.nombre.toUpperCase() : 'NO ESPECIFICADO';
                    tot[key] = (tot[key] || 0) + pg.monto;
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
            all_Cabecera_p(grupo).once("value", snap => {
                this.cabeceraGrupo = snap.val() || {};
            });

            all_detalle_entrega(grupo).once("value", snap => {
                this.dataEntrega = snap.val() || {};

                // Aplanamos todos los rechazos de todos los pedidos
                this.rechazos = Object.values(this.dataEntrega)
                    .flatMap(p => p.rechazos || [])
                    // Aseguramos que los totales de línea sean calculados si no vienen del backend
                    .map(r => ({
                        ...r,
                        total_linea: (r.cantidad * r.precio_unit) || 0
                    }));
            });
        },

        generarPdf() {
            pdfGenera(this.cabeceraGrupo, this.dataEntrega, this.grupo);
        },

        generarPdfDetalle() {
            pdfGeneraDetalle(this.cabeceraGrupo, this.dataEntrega, this.grupo);
        }
    }

};
</script>