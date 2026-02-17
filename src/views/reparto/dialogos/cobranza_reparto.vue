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
                <v-col cols="6" sm="3">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="blue lighten-5">
                        <div class="caption font-weight-bold blue--text">TOTAL PEDIDO</div>
                        <div class="text-h6 font-weight-black blue--text text--darken-2">
                            {{ monedaSimbolo }} {{ totalPedido.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="3">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="green lighten-5">
                        <div class="caption font-weight-bold green--text text--darken-3">TOTAL COBRADO</div>
                        <div class="text-h6 font-weight-black green--text text--darken-4">
                            {{ monedaSimbolo }} {{ totalCobrado.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="3">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="red lighten-5">
                        <div class="caption font-weight-bold red--text text--darken-2">VALOR RECHAZADO</div>
                        <div class="text-h6 font-weight-black red--text text--darken-4">
                            {{ monedaSimbolo }} {{ totalRechazado.toFixed(2) }}
                        </div>
                    </v-sheet>
                </v-col>

                <v-col cols="6" sm="3">
                    <v-sheet class="pa-3 rounded-lg elevation-2 text-center" color="purple lighten-5">
                        <div class="caption font-weight-bold purple--text text--darken-2">TOTAL NETO</div>
                        <div class="text-h6 font-weight-black purple--text text--darken-4">
                            {{ monedaSimbolo }} {{ totalNeto.toFixed(2) }}
                        </div>
                        <div v-if="totalGastos > 0" class="caption red--text">
                            -{{ monedaSimbolo }}{{ totalGastos.toFixed(2) }} gastos
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
                        <span class="text-truncate">{{ key }}</span>: {{ monedaSimbolo }} {{ m.toFixed(2) }}
                    </v-chip>
                </v-col>
            </v-row>

            <v-row class="mt-6 mb-2" dense>
                <v-col cols="12" sm="4">
                    <v-btn color="error" dark block @click="dialog = true" :disabled="totalItemsRechazados === 0"
                        class="font-weight-bold">
                        <v-icon left>mdi-truck-remove</v-icon>
                        Rechazados ({{ totalItemsRechazados }})
                    </v-btn>
                </v-col>
                <v-col cols="12" sm="4">
                    <v-btn color="amber darken-2" dark block @click="dialogGastos = true" class="font-weight-bold">
                        <v-icon left>mdi-cash-minus</v-icon>
                        Gastos ({{ gastos.length }})
                    </v-btn>
                </v-col>
                <v-col cols="12" sm="4">
                    <v-btn color="primary" dark block @click="dialogPdfOpciones = true" class="font-weight-bold">
                        <v-icon left>mdi-file-pdf-box</v-icon>
                        Descargar
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Resumen de gastos -->
            <v-row v-if="gastos.length > 0" dense class="mt-2">
                <v-col cols="12">
                    <v-alert type="warning" dense text class="mb-0">
                        <div class="d-flex flex-column">
                            <div class="d-flex justify-space-between align-center mb-1">
                                <span><strong>Total EFECTIVO cobrado:</strong> {{ monedaSimbolo }}{{
                                    totalEfectivo.toFixed(2) }}</span>
                                <span><strong>Total gastos:</strong> -{{ monedaSimbolo }}{{ totalGastos.toFixed(2)
                                }}</span>
                            </div>
                            <v-divider class="my-1"></v-divider>
                            <div class="d-flex justify-space-between align-center">
                                <span class="font-weight-bold">EFECTIVO disponible después de gastos:</span>
                                <span class="font-weight-bold text-h6"
                                    :class="efectivoDisponible >= 0 ? 'green--text' : 'red--text'">
                                    {{ monedaSimbolo }}{{ efectivoDisponible.toFixed(2) }}
                                </span>
                            </div>
                        </div>
                    </v-alert>
                </v-col>
            </v-row>
        </v-card>

        <v-dialog v-model="dialog" max-width="750">
            <v-card class="rounded-lg">
                <v-card-title class="font-weight-bold primary white--text py-3">
                    <v-icon left>mdi-package-variant-remove</v-icon>
                    Productos Rechazados
                    <v-spacer></v-spacer>
                    <v-btn icon small dark @click="exportarRechazosPDF" title="Exportar PDF">
                        <v-icon>mdi-file-pdf-box</v-icon>
                    </v-btn>
                    <v-btn icon small dark @click="exportarRechazosExcel" title="Exportar Excel">
                        <v-icon>mdi-file-excel</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text class="pt-4">
                    <div v-if="totalItemsRechazados === 0" class="text-center text-subtitle-1 grey--text">
                        No hay productos rechazados para este grupo de reparto.
                    </div>
                    <v-data-table v-else :headers="headers" :items="rechazos" dense disable-pagination
                        mobile-breakpoint="1" hide-default-footer class="elevation-1">

                        <template v-slot:[`item.id_pedido`]="{ item }">
                            <span class="caption">{{ item.id_pedido }}</span>
                        </template>

                        <template v-slot:[`item.nombre`]="{ item }">
                            <div>
                                <span class="font-weight-medium">{{ item.id_producto }}</span> -
                                <span class="ml-1">{{ item.nombre }}</span>
                            </div>
                        </template>

                        <template v-slot:[`item.medida_mostrar`]="{ item }">
                            <span v-if="item.es_rechazo_parcial" class="caption">
                                {{ item.medida_mostrar }}
                                <v-tooltip bottom>
                                    <template v-slot:activator="{ on }">
                                        <v-icon x-small color="info" v-on="on">mdi-information</v-icon>
                                    </template>
                                    <span>Rechazo parcial: {{ item.cantidad }} unidades de {{ item.medida }}
                                        original</span>
                                </v-tooltip>
                            </span>
                            <span v-else>{{ item.medida_mostrar }}</span>
                        </template>
                        <template v-slot:[`item.tipo_rechazo`]="{ item }">
                            <v-chip x-small :color="item.es_rechazo_parcial ? 'amber' : 'grey'" dark>
                                {{ item.tipo_rechazo }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.precio_unit`]="{ item }">
                            {{ item.precio_unit.toFixed(2) }}
                        </template>

                        <template v-slot:[`item.total_linea`]="{ item }">
                            <span class="font-weight-bold red--text">
                                {{ item.total_linea.toFixed(2) }}
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

        <!-- Diálogo de Gastos -->
        <v-dialog v-model="dialogGastos" max-width="550">
            <v-card class="rounded-lg">
                <v-card-title class="font-weight-bold amber darken-2 white--text py-3">
                    <v-icon left>mdi-cash-minus</v-icon>
                    Gastos del Reparto
                    <v-spacer></v-spacer>
                    <v-btn icon small dark @click="abrirNuevoGasto" title="Agregar gasto">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-alert v-if="totalEfectivo > 0" type="info" dense text class="mb-3">
                        Efectivo cobrado: <strong>{{ monedaSimbolo }}{{ totalEfectivo.toFixed(2) }}</strong> |
                        Disponible: <strong>{{ monedaSimbolo }}{{ efectivoDisponible.toFixed(2) }}</strong>
                    </v-alert>

                    <div v-if="gastos.length === 0" class="text-center text-subtitle-1 grey--text py-4">
                        No hay gastos registrados para este reparto.
                    </div>

                    <v-list v-else dense>
                        <v-list-item v-for="gasto in gastos" :key="gasto.id" class="elevation-1 mb-2 rounded">
                            <v-list-item-content>
                                <v-list-item-title>{{ gasto.descripcion }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ formatFecha(gasto.fecha) }} - {{ gasto.usuario }}
                                </v-list-item-subtitle>
                            </v-list-item-content>
                            <v-list-item-action>
                                <div class="d-flex align-center">
                                    <span class="font-weight-bold error--text mr-2">
                                        {{ monedaSimbolo }}{{ Number(gasto.monto).toFixed(2) }}
                                    </span>
                                    <v-btn icon x-small color="error" @click="eliminarGasto(gasto)">
                                        <v-icon small>mdi-delete</v-icon>
                                    </v-btn>
                                </div>
                            </v-list-item-action>
                        </v-list-item>
                    </v-list>

                    <v-divider v-if="gastos.length > 0" class="my-3"></v-divider>
                    <div v-if="gastos.length > 0" class="text-right">
                        <strong>Total Gastos: {{ monedaSimbolo }}{{ totalGastos.toFixed(2) }}</strong>
                    </div>
                </v-card-text>

                <v-card-actions class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="dialogGastos = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Diálogo Nuevo Gasto -->
        <v-dialog v-model="dialogNuevoGasto" max-width="400">
            <v-card class="rounded-lg pa-4">
                <v-card-title class="text-h6 font-weight-bold">
                    <v-icon left color="amber darken-2">mdi-cash-plus</v-icon>
                    Agregar Gasto
                </v-card-title>
                <v-card-text>
                    <v-text-field v-model="nuevoGasto.descripcion" label="Descripción" outlined dense class="mb-2" />
                    <v-text-field v-model.number="nuevoGasto.monto" label="Monto" :prefix="monedaSimbolo" type="number"
                        outlined dense :max="efectivoDisponible"
                        :hint="`Máximo: ${monedaSimbolo}${efectivoDisponible.toFixed(2)}`" persistent-hint />
                </v-card-text>
                <v-card-actions class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn text @click="dialogNuevoGasto = false">Cancelar</v-btn>
                    <v-btn color="amber darken-2" dark @click="agregarGasto">Guardar</v-btn>
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
                    <v-checkbox v-model="mostrarGastosEnPdf" label="Mostrar Gastos Reparto" dense hide-details
                        class="mb-3" :disabled="gastos.length === 0" />
                    <v-btn color="blue darken-2" dark block class="mb-3"
                        @click="generarPdf(); dialogPdfOpciones = false">
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
import { all_detalle_entrega, all_Cabecera_p, all_gastos_reparto, nuevo_gasto_reparto, elimina_gasto_reparto, edita_gasto_reparto } from "../../../db";
import { pdfGenera, pdfGeneraDetalle } from "../../reparto/formatos/formato_liquida";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
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
            cabeceraGrupo: {},
            rechazos: [],
            gastos: [],
            dialog: false,
            dialogPdfOpciones: false,
            dialogGastos: false,
            dialogNuevoGasto: false,
            mostrarGastosEnPdf: false,
            nuevoGasto: {
                descripcion: '',
                monto: 0
            },
            gastoEditando: null,
            moneda: "S/ ",
            headers: [
                { text: "Doc", value: "id_pedido", width: "100px" },
                { text: "Producto", value: "nombre" },
                { text: "Medida", value: "medida_mostrar", align: "center", width: "80px" },
                { text: "Cantidad", value: "cantidad", align: "center", width: "80px" },
                { text: "Tipo", value: "tipo_rechazo", align: "center", width: "70px" },
                { text: "P. Unit (S/)", value: "precio_unit", align: "right" },
                { text: "Total (S/)", value: "total_linea", align: "right" }
            ]
        };
    },
    computed: {
        totalCobrado() {
            return Object.values(this.dataEntrega).reduce((acc, o) => acc + (o.total_cobrado || 0), 0);
        },
        totalPedido() {
            // Calcular desde la cabecera del grupo (todos los pedidos del reparto)
            return Object.values(this.cabeceraGrupo).reduce((acc, cab) => {
                if (String(cab.estado || "").toUpperCase() === "ANULADO") return acc;
                return acc + Number(cab.total || 0);
            }, 0);
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
                    const key = pg.nombre ? pg.nombre.toUpperCase() : 'NO ESPECIFICADO';
                    tot[key] = (tot[key] || 0) + pg.monto;
                });
            });
            return tot;
        },
        totalEfectivo() {
            return this.totalesPorPago['EFECTIVO'] || 0;
        },
        totalGastos() {
            return this.gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
        },
        totalNeto() {
            return this.totalCobrado - this.totalGastos;
        },
        efectivoDisponible() {
            return this.totalEfectivo - this.totalGastos;
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
        }
    },
    created() {
        this.obtenerDetallesEntrega(this.grupo);
        this.obtenerGastos(this.grupo);
        this.dial = true;
    },
    methods: {
        obtenerDetallesEntrega(grupo) {
            all_Cabecera_p(grupo).once("value", snap => {
                this.cabeceraGrupo = snap.val() || {};
            });

            all_detalle_entrega(grupo).once("value", snap => {
                this.dataEntrega = snap.val() || {};

                // Aplanamos todos los rechazos de todos los pedidos incluyendo id_pedido
                this.rechazos = [];
                Object.entries(this.dataEntrega).forEach(([idPedido, p]) => {
                    (p.rechazos || []).forEach(r => {
                        this.rechazos.push({
                            ...r,
                            id_pedido: idPedido,
                            total_linea: (r.cantidad * r.precio_unit) || 0,
                            medida_mostrar: r.es_rechazo_parcial ? 'UNIDAD' : r.medida,
                            tipo_rechazo: r.es_rechazo_parcial ? 'Parcial' : 'Completo'
                        });
                    });
                });
            });
        },

        obtenerGastos(grupo) {
            all_gastos_reparto(grupo).once("value", snap => {
                const data = snap.val() || {};
                this.gastos = Object.entries(data).map(([key, val]) => ({
                    id: key,
                    ...val
                }));
            });
        },

        async agregarGasto() {
            if (!this.nuevoGasto.descripcion || !this.nuevoGasto.monto) {
                alert('Complete descripción y monto');
                return;
            }

            const monto = Number(this.nuevoGasto.monto);
            if (monto <= 0) {
                alert('El monto debe ser mayor a 0');
                return;
            }

            if (monto > this.efectivoDisponible) {
                alert(`El monto excede el efectivo disponible (${this.monedaSimbolo}${this.efectivoDisponible.toFixed(2)})`);
                return;
            }

            const gasto = {
                descripcion: this.nuevoGasto.descripcion,
                monto: monto,
                usuario: this.$store.state.permisos.nombre || 'desconocido',
                usuario_id: this.$store.state.permisos.token || '',
                fecha: Date.now()
            };

            try {
                this.$store.commit("dialogoprogress");
                await nuevo_gasto_reparto(this.grupo, gasto);
                this.obtenerGastos(this.grupo);
                this.nuevoGasto = { descripcion: '', monto: 0 };
                this.dialogNuevoGasto = false;
                this.$store.commit("dialogoprogress");
            } catch (e) {
                console.error(e);
                this.$store.commit("dialogoprogress");
                alert('Error al guardar el gasto');
            }
        },

        async eliminarGasto(gasto) {
            if (!confirm('¿Eliminar este gasto?')) return;

            try {
                this.$store.commit("dialogoprogress");
                await elimina_gasto_reparto(this.grupo, gasto.id);
                this.obtenerGastos(this.grupo);
                this.$store.commit("dialogoprogress");
            } catch (e) {
                console.error(e);
                this.$store.commit("dialogoprogress");
                alert('Error al eliminar el gasto');
            }
        },

        abrirNuevoGasto() {
            if (this.efectivoDisponible <= 0) {
                alert('No hay efectivo disponible para agregar gastos');
                return;
            }
            this.nuevoGasto = { descripcion: '', monto: 0 };
            this.dialogNuevoGasto = true;
        },

        generarPdf() {
            pdfGenera(this.cabeceraGrupo, this.dataEntrega, this.grupo, this.mostrarGastosEnPdf ? this.gastos : []);
        },

        generarPdfDetalle() {
            pdfGeneraDetalle(this.cabeceraGrupo, this.dataEntrega, this.grupo, this.mostrarGastosEnPdf ? this.gastos : []);
        },

        // Exportar rechazos a PDF
        exportarRechazosPDF() {
            const doc = new jsPDF();
            const fecha = new Date().toLocaleString();

            doc.setFontSize(16);
            doc.text(`Productos Rechazados - Reparto ${this.grupo}`, 14, 18);

            doc.setFontSize(10);
            doc.text(`Fecha: ${fecha}`, 14, 26);
            doc.text(`Total Ítems: ${this.totalItemsRechazados} | Total: ${this.monedaSimbolo}${this.totalRechazado.toFixed(2)}`, 14, 32);

            const body = this.rechazos.map(r => [
                r.id_pedido || '',
                r.id_producto || '',
                r.nombre || '',
                r.medida_mostrar || r.medida || '',
                r.cantidad || 0,
                r.tipo_rechazo || '',
                `${this.monedaSimbolo}${Number(r.precio_unit || 0).toFixed(2)}`,
                `${this.monedaSimbolo}${Number(r.total_linea || 0).toFixed(2)}`
            ]);

            doc.autoTable({
                startY: 38,
                head: [['Doc', 'Código', 'Producto', 'Medida', 'Cant', 'Tipo', 'P. Unit', 'Total']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [192, 57, 43] }
            });

            doc.save(`rechazos_reparto_${this.grupo}_${Date.now()}.pdf`);
        },

        // Exportar rechazos a Excel
        exportarRechazosExcel() {
            const fecha = new Date().toLocaleString();
            const data = this.rechazos.map(r => ({
                'Documento': r.id_pedido || '',
                'Código': r.id_producto || '',
                'Producto': r.nombre || '',
                'Medida': r.medida_mostrar || r.medida || '',
                'Cantidad': r.cantidad || 0,
                'Tipo': r.tipo_rechazo || '',
                'Precio Unit': Number(r.precio_unit || 0).toFixed(2),
                'Total': Number(r.total_linea || 0).toFixed(2)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Rechazos');
            XLSX.writeFile(wb, `rechazos_reparto_${this.grupo}_${Date.now()}.xlsx`);
        },

        formatFecha(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp).toLocaleString();
        }
    }

};
</script>