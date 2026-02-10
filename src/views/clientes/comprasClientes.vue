<template>
    <div class="pa-2 pa-sm-4">
        <v-card class="elevation-2 rounded-lg">
            <v-card-title class="pa-3 pa-sm-4 blue-grey lighten-5">
                <v-row dense align="center" class="w-100">
                    <v-col cols="12" sm="3" class="d-flex align-center">
                        <span :class="$vuetify.breakpoint.smAndDown ? 'text-subtitle-1' : 'text-h6'"
                            class="font-weight-bold blue-grey--text text--darken-3">
                            Compras por Cliente
                        </span>
                    </v-col>

                    <v-col cols="12" sm="9" v-if="!$vuetify.breakpoint.smAndDown">
                        <v-row dense justify="end" align="center">
                            <!-- Fecha inicio -->
                            <v-col cols="3">
                                <v-menu v-model="menuFechaInicio" :close-on-content-click="false"
                                    transition="scale-transition" offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="date" label="Fecha Inicio"
                                            prepend-inner-icon="mdi-calendar" readonly v-bind="attrs" v-on="on" dense
                                            outlined hide-details />
                                    </template>
                                    <v-date-picker v-model="date" @input="menuFechaInicio = false" />
                                </v-menu>
                            </v-col>

                            <!-- Fecha fin -->
                            <v-col cols="3">
                                <v-menu v-model="menuFechaFin" :close-on-content-click="false"
                                    transition="scale-transition" offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="date2" label="Fecha Fin"
                                            prepend-inner-icon="mdi-calendar" readonly v-bind="attrs" v-on="on" dense
                                            outlined hide-details />
                                    </template>
                                    <v-date-picker v-model="date2" @input="menuFechaFin = false" />
                                </v-menu>
                            </v-col>

                            <!-- Cliente -->
                            <v-col cols="6">
                                <v-autocomplete outlined dense label="Buscar Cliente" auto-select-first
                                    v-model="busca_p" :items="arra_clientes" prepend-inner-icon="mdi-account-search"
                                    append-icon="mdi-magnify" @click:append="busca" @keyup.enter="busca" hide-details />
                            </v-col>
                        </v-row>
                    </v-col>
                    <v-col cols="auto" class="ml-auto mt-n10" v-if="$vuetify.breakpoint.smAndDown">
                        <v-btn icon small color="info" @click="verConsolidadoProductos" :disabled="!desserts.length"
                            class="mr-1" title="Ver Consolidado">
                            <v-icon>mdi-chart-box</v-icon>
                        </v-btn>
                        <v-btn icon small color="primary" @click="mostrarFiltrosMovil = !mostrarFiltrosMovil"
                            title="Mostrar Filtros">
                            <v-icon>mdi-filter</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- FILTROS PARA MÓVIL -->
                <v-expand-transition>
                    <div v-if="mostrarFiltrosMovil && $vuetify.breakpoint.smAndDown" class="mt-3">
                        <v-row dense>
                            <v-col cols="12">
                                <v-autocomplete outlined dense autofocus label="Buscar Cliente" auto-select-first
                                    class="caption" v-model="busca_p" :items="arra_clientes"
                                    prepend-inner-icon="mdi-account-search" hide-details></v-autocomplete>
                            </v-col>
                            <v-col cols="6">
                                <v-menu v-model="menuFechaInicio" :close-on-content-click="false"
                                    transition="scale-transition" offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="date" label="Desde" prepend-inner-icon="mdi-calendar"
                                            readonly v-bind="attrs" v-on="on" dense outlined
                                            hide-details></v-text-field>
                                    </template>
                                    <v-date-picker v-model="date" @input="menuFechaInicio = false"></v-date-picker>
                                </v-menu>
                            </v-col>
                            <v-col cols="6">
                                <v-menu v-model="menuFechaFin" :close-on-content-click="false"
                                    transition="scale-transition" offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="date2" label="Hasta" prepend-inner-icon="mdi-calendar"
                                            readonly v-bind="attrs" v-on="on" dense outlined
                                            hide-details></v-text-field>
                                    </template>
                                    <v-date-picker v-model="date2" @input="menuFechaFin = false"></v-date-picker>
                                </v-menu>
                            </v-col>
                            <v-col cols="12" class="text-center">
                                <v-btn small block color="primary" @click="busca" class="mb-2">
                                    <v-icon left small>mdi-magnify</v-icon>
                                    Buscar
                                </v-btn>
                            </v-col>
                        </v-row>
                    </div>
                </v-expand-transition>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text v-if="$vuetify.breakpoint.smAndDown" class="py-2 px-1">
                <v-row dense>
                    <v-col v-for="(card, idx) in resumenCardsMovil" :key="idx" cols="6">
                        <v-card outlined class="pa-2 rounded-lg text-center">
                            <div class="caption grey--text">{{ card.title }}</div>
                            <div :class="card.class" class="subtitle-2 font-weight-bold">
                                {{ card.prefix || '' }}{{ card.value }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-text v-else class="py-3">
                <v-row dense class="align-center">
                    <v-col cols="12" md="8">
                        <v-row dense>
                            <v-col v-for="(card, idx) in resumenCardsDesktop" :key="idx" cols="6" sm="4" md="2">
                                <v-card outlined class="pa-3 rounded-lg">
                                    <div class="d-flex align-center">
                                        <v-avatar size="34" class="mr-2" :color="card.color">
                                            <v-icon dark small>{{ card.icon }}</v-icon>
                                        </v-avatar>
                                        <div>
                                            <div class="caption grey--text">{{ card.title }}</div>
                                            <div :class="card.textClass" class="subtitle-2 font-weight-bold">
                                                {{ card.prefix || '' }}{{ card.value }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-col>

                    <v-col cols="12" md="4" class="text-center text-md-right">
                        <v-btn small color="info" rounded @click="verConsolidadoProductos" :disabled="!desserts.length"
                            class="mx-1 mb-1">
                            <v-icon left small>mdi-package-variant-closed</v-icon>
                            Consolidado
                        </v-btn>
                        <v-btn small color="warning" rounded @click="limpiarFiltros" class="mx-1 mb-1">
                            <v-icon left small>mdi-filter-remove</v-icon>
                            Limpiar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <div v-if="!$vuetify.breakpoint.smAndDown">
                <v-simple-table fixed-header height="60vh" dense class="elevation-0">
                    <template v-slot:default>
                        <thead class="grey darken-3">
                            <tr>
                                <th class="text-left">Correlativo</th>
                                <th class="text-left">Cliente</th>
                                <th class="text-left">Fecha</th>
                                <th class="text-left">Vendedor</th>
                                <th class="text-center">Estado</th>
                                <th class="text-center">Tipo Venta</th>
                                <th class="text-right">Total</th>
                                <th class="text-center">Deuda</th>
                                <th class="text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!listafiltrada.length">
                                <td colspan="9" class="text-center grey--text text-caption py-4">
                                    Sin resultados para el cliente seleccionado.
                                </td>
                            </tr>
                            <tr v-for="item in listafiltrada" :key="item.numeracion">
                                <td class="caption font-weight-medium">{{ item.numeracion }}</td>
                                <td class="caption">{{ item.dni }} / {{ item.cliente }}</td>
                                <td class="caption">{{ conviertefecha(item.fecha) }}</td>
                                <td class="caption">{{ item.vendedor_nombre || 'No especificado' }}</td>
                                <td class="text-center">
                                    <v-chip x-small :color="asigna_color_doc_chip(item)" dark>
                                        {{ item.estado }}
                                    </v-chip>
                                </td>
                                <td class="text-center caption">
                                    <v-chip x-small outlined :color="getTipoVentaColor(item)" dark>
                                        {{ getTipoVenta(item) }}
                                    </v-chip>
                                </td>
                                <td class="text-right font-weight-bold">
                                    {{ monedaSimbolo }}{{ redondear(item.total - item.descuentos) }}
                                </td>
                                <td class="text-center">
                                    <div v-if="item.deudaPendiente > 0">
                                        <v-chip x-small outlined color="red" dark @click="verDeudasCliente(item)">
                                            {{ monedaSimbolo }}{{ redondear(item.deudaPendiente) }}
                                            <v-icon x-small right>mdi-alert</v-icon>
                                        </v-chip>
                                    </div>
                                    <div v-else>
                                        <v-chip x-small outlined color="green" dark>
                                            {{ monedaSimbolo }}0.00
                                        </v-chip>
                                    </div>
                                </td>
                                <td class="text-center" width="200">
                                    <v-menu offset-y>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn icon v-bind="attrs" v-on="on" small>
                                                <v-icon>mdi-dots-vertical</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list dense>
                                            <v-list-item @click.prevent="ejecutaConsolida(item.numeracion)">
                                                <v-list-item-icon><v-icon
                                                        color="info">mdi-eye</v-icon></v-list-item-icon>
                                                <v-list-item-title>Ver Detalle</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="verPDF(item, '80')">
                                                <v-list-item-icon><v-icon
                                                        color="red">mdi-printer-pos-outline</v-icon></v-list-item-icon>
                                                <v-list-item-title>Ticket 80mm</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="verPDF(item, 'A4')">
                                                <v-list-item-icon><v-icon
                                                        color="red darken-2">mdi-file-pdf-box</v-icon></v-list-item-icon>
                                                <v-list-item-title>PDF A4</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </div>

            <!-- CARDS PARA MÓVIL -->
            <div v-else class="pa-2">
                <div v-if="!listafiltrada.length" class="text-center grey--text text-caption py-8">
                    Sin resultados para el cliente seleccionado.
                </div>

                <v-card v-for="item in listafiltrada" :key="item.numeracion" class="mb-3 elevation-1" outlined>
                    <v-card-text class="pa-3">
                        <div class="d-flex justify-space-between align-start mb-2">
                            <div>
                                <div class="font-weight-bold caption blue-grey--text text--darken-3">
                                    {{ item.numeracion }}
                                </div>
                                <div class="caption grey--text">
                                    {{ conviertefecha(item.fecha) }}
                                </div>
                            </div>
                            <div class="text-right">
                                <v-chip x-small :color="asigna_color_doc_chip(item)" dark>
                                    {{ item.estado }}
                                </v-chip>
                                <v-chip x-small outlined :color="getTipoVentaColor(item)" dark class="ml-1">
                                    {{ getTipoVenta(item) }}
                                </v-chip>
                            </div>
                        </div>

                        <div class="mb-2">
                            <div class="caption font-weight-medium">
                                {{ item.cliente }}
                            </div>
                            <div class="caption grey--text">
                                DNI: {{ item.dni }}
                            </div>
                            <div class="caption grey--text">
                                Vendedor: {{ item.vendedor_nombre || 'No especificado' }}
                            </div>
                        </div>

                        <v-divider class="my-2"></v-divider>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="caption grey--text">Total</div>
                                <div class="font-weight-bold">
                                    {{ monedaSimbolo }}{{ redondear(item.total - item.descuentos) }}
                                </div>
                            </div>
                            <div>
                                <div class="caption grey--text text-right">Deuda</div>
                                <div v-if="item.deudaPendiente > 0" class="text-right">
                                    <v-chip x-small outlined color="red" dark @click="verDeudasCliente(item)">
                                        {{ monedaSimbolo }}{{ redondear(item.deudaPendiente) }}
                                    </v-chip>
                                </div>
                                <div v-else class="text-right">
                                    <v-chip x-small outlined color="green" dark>
                                        {{ monedaSimbolo }}0.00
                                    </v-chip>
                                </div>
                            </div>
                        </div>

                        <v-divider class="my-2"></v-divider>
                        <div class="d-flex justify-space-around">
                            <v-btn x-small text color="info" @click.prevent="ejecutaConsolida(item.numeracion)">
                                <v-icon x-small left>mdi-eye</v-icon>
                                Detalle
                            </v-btn>
                            <v-btn x-small text color="red" @click="verPDF(item, '80')">
                                <v-icon x-small left>mdi-printer</v-icon>
                                Ticket
                            </v-btn>
                            <v-btn x-small text color="red darken-2" @click="verPDF(item, 'A4')">
                                <v-icon x-small left>mdi-file-pdf</v-icon>
                                PDF
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <v-divider></v-divider>
            <v-card-text class="py-3 mb-6">
                <v-row dense class="align-center">
                    <v-col cols="12" md="6">
                        <div class="d-flex align-center mb-2">
                            <span class="caption grey--text mr-2">Leyenda Ticket Promedio:</span>
                            <div class="d-flex">
                                <v-chip x-small color="green" dark class="mr-1">
                                    <v-icon x-small left>mdi-circle</v-icon>
                                    ≥ 600
                                </v-chip>
                                <v-chip x-small color="orange" dark class="mr-1">
                                    <v-icon x-small left>mdi-circle</v-icon>
                                    200-599
                                </v-chip>
                                <v-chip x-small color="red" dark>
                                    <v-icon x-small left>mdi-circle</v-icon>
                                    &lt; 200
                                </v-chip>
                            </div>
                        </div>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-row dense>
                            <v-col cols="4">
                                <v-card outlined class="pa-2 rounded-lg text-center">
                                    <div class="caption grey--text">Ventas Totales</div>
                                    <div class="subtitle-2 font-weight-bold blue--text">
                                        {{ monedaSimbolo }}{{ redondear(resumenFinal.ventasTotales) }}
                                    </div>
                                </v-card>
                            </v-col>

                            <v-col cols="4">
                                <v-card outlined class="pa-2 rounded-lg text-center">
                                    <div class="caption grey--text">Deuda Total</div>
                                    <div class="subtitle-2 font-weight-bold"
                                        :class="resumenFinal.deudaTotal > 0 ? 'red--text' : 'green--text'">
                                        {{ monedaSimbolo }}{{ redondear(resumenFinal.deudaTotal) }}
                                    </div>
                                </v-card>
                            </v-col>

                            <v-col cols="4">
                                <v-card outlined class="pa-2 rounded-lg text-center">
                                    <div class="caption grey--text">N° Compras</div>
                                    <div class="subtitle-2 font-weight-bold teal--text">
                                        {{ resumenFinal.numeroPedidos }}
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-dialog v-model="dialog" max-width="900px" scrollable>
            <v-card class="rounded-lg d-flex flex-column" style="max-height: 90vh;">
                <v-toolbar color="primary" dense dark class="flex-grow-0">
                    <v-toolbar-title>Detalle del Comprobante</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-card-text class="pa-4 flex-grow-1 overflow-y-auto">
                    <div v-if="arrayConsolidar.length === 0" class="text-center py-8">
                        <v-icon size="60" color="grey lighten-2" class="mb-3">mdi-package-variant-remove</v-icon>
                        <div class="subtitle-1 grey--text">No hay detalles para mostrar</div>
                    </div>

                    <v-row v-else>
                        <v-col cols="12" md="6" lg="4" v-for="(item, index) in arrayConsolidar" :key="index">
                            <v-card class="mb-n2 elevation-1" outlined>
                                <v-card-text class="pa-3">
                                    <div class="mb-2">
                                        <div class="caption blue-grey--text font-weight-bold mb-1">
                                            ID: {{ item.id }}
                                        </div>
                                        <div class="subtitle-2 font-weight-medium">
                                            {{ item.nombre }}
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <span class="caption grey--text">Medida:</span>
                                        <span class="caption ml-1">{{ item.medida }}</span>
                                    </div>
                                    <div class="mb-2">
                                        <span class="caption grey--text">Cantidad:</span>
                                        <span class="caption ml-1 font-weight-bold">{{ item.cantidad }}</span>
                                    </div>
                                    <div class="mb-2">
                                        <div class="d-flex justify-space-between">
                                            <span class="caption grey--text">Precio Unit.:</span>
                                            <span class="caption">{{ monedaSimbolo }}{{ redondear(item.precioedita)
                                            }}</span>
                                        </div>
                                        <div class="d-flex justify-space-between">
                                            <span class="caption grey--text">Descuento:</span>
                                            <span class="caption red--text">
                                                {{ monedaSimbolo }}{{ redondear(item.preciodescuento) }}
                                            </span>
                                        </div>
                                    </div>
                                    <v-divider class="my-1"></v-divider>
                                    <div class="text-right">
                                        <div class="caption grey--text">Total:</div>
                                        <div class="subtitle-2 font-weight-bold primary--text">
                                            {{ monedaSimbolo }}{{ redondear(item.precioedita * item.cantidad -
                                                item.preciodescuento) }}
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- DIÁLOGO CONSOLIDADO PRODUCTOS -->
        <v-dialog v-model="dialogConsolidadoProductos" max-width="1000px" scrollable>
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark>
                    <v-toolbar-title>
                        Consolidado de Productos
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogConsolidadoProductos = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text class="pa-0">
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th class="text-left">ID</th>
                                <th class="text-left">Descripción</th>
                                <th class="text-left">Medida</th>
                                <th class="text-right">Cantidad</th>
                                <th class="text-right">Descuento</th>
                                <th class="text-right">Total Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, idx) in consolidadoProductos" :key="p.id || idx">
                                <td class="font-weight-bold">{{ p.id || '-' }}</td>
                                <td>{{ p.nombre || '-' }}</td>
                                <td class="grey--text">{{ p.medida || '-' }}</td>
                                <td class="text-right font-weight-bold">
                                    {{ redondear(p.cantidadTotal) }}
                                </td>
                                <td class="text-right red--text">
                                    {{ monedaSimbolo }}{{ redondear(p.totalDescuento) }}
                                </td>
                                <td class="text-right font-weight-bold primary--text">
                                    {{ monedaSimbolo }}{{ redondear(p.total - p.totalDescuento) }}
                                </td>
                            </tr>
                            <tr v-if="consolidadoProductos.length === 0">
                                <td colspan="6" class="text-center grey--text py-4">
                                    <v-icon small class="mr-1">mdi-alert-circle-outline</v-icon>
                                    Sin productos para mostrar
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <dial-deudas-cliente v-model="dialogDeudas" :cliente="clienteParaDeudas" @cerrar="dialogDeudas = false" />

        <v-dialog persistent v-model="$store.state.dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>

    </div>
</template>

<script>
import {
    allCabecera,
    consultaDetalle,
    consulta_Cabecera,
    allcuentaxcobrar
} from '../../db'

import store from '@/store/index'
import moment from 'moment'
import { pdfGenera } from '../../pdf_comprobantes'
import DialDeudasCliente from '@/views/clientes/dialogos/dial_deudas_cliente.vue'

export default {
    components: {
        DialDeudasCliente
    },
    data: () => ({
        busca_clientes: false,
        documento: '',
        desserts: [],
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment().startOf('month').format('YYYY-MM-DD'),
        date2: moment().format('YYYY-MM-DD'),
        menuFechaInicio: false,
        menuFechaFin: false,
        rechazados: 0,
        error: '',
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'T',
        arra_clientes: [],
        busca_p: '',
        num_cliente: '',
        dialogConsolidadoProductos: false,
        consolidadoProductos: [],
        dialogDeudas: false,
        clienteParaDeudas: null,
        infoCliente: null,
        mostrarFiltrosMovil: false
    }),
    computed: {
        listafiltrada() {
            return this.desserts.filter((item) => {
                const itemDate = moment.unix(item.fecha).format('YYYY-MM-DD');
                const fechaInicio = moment(this.date).format('YYYY-MM-DD');
                const fechaFin = moment(this.date2).format('YYYY-MM-DD');

                if (itemDate < fechaInicio || itemDate > fechaFin) {
                    return false;
                }
                if (this.num_doc) {
                    return (item.numeracion || "")
                        .toLowerCase()
                        .includes((this.num_doc || "").toLowerCase());
                }

                return true;
            });
        },

        resumenVentas() {
            const dec = Number(store.state?.configuracion?.decimal ?? 2);
            const filteredList = this.listafiltrada;

            let totalGeneral = 0;
            let totalAprobado = 0;
            let totalPendiente = 0;
            let totalAnulado = 0;
            let cantidadCompras = filteredList.length;

            for (const d of filteredList) {
                const estado = String(d.estado || "").toUpperCase();
                const total = Number(d.total || 0) - Number(d.descuentos || 0);

                totalGeneral += total;

                if (estado === "APROBADO" || estado === "ACEPTADO") {
                    totalAprobado += total;
                } else if (estado === "PENDIENTE") {
                    totalPendiente += total;
                } else if (estado === "ANULADO") {
                    totalAnulado += total;
                }
            }

            const ticketPromedio = cantidadCompras > 0 ? totalGeneral / cantidadCompras : 0;

            const f = (n) => Number(n || 0).toFixed(dec);

            return {
                cantidad: cantidadCompras,
                totalGeneral: f(totalGeneral),
                totalAprobado: f(totalAprobado),
                totalPendiente: f(totalPendiente),
                totalAnulado: f(totalAnulado),
                ticketPromedio: f(ticketPromedio),
            };
        },

        resumenFinal() {
            const filteredList = this.listafiltrada;
            let ventasTotales = 0;
            let deudaTotal = 0;
            let numeroPedidos = 0;

            for (const item of filteredList) {
                const totalNeto = Number(item.total || 0) - Number(item.descuentos || 0);
                ventasTotales += totalNeto;

                deudaTotal += Number(item.deudaPendiente || 0);
                if (item.numeracion) {
                    numeroPedidos++;
                }
            }
            return {
                ventasTotales,
                deudaTotal,
                numeroPedidos
            };
        },

        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
        },

        resumenCardsDesktop() {
            return [
                {
                    title: 'Total general',
                    value: this.resumenVentas.totalGeneral,
                    prefix: this.monedaSimbolo,
                    icon: 'mdi-cash-multiple',
                    color: 'primary',
                    textClass: 'primary--text'
                },
                {
                    title: 'Aprobados',
                    value: this.resumenVentas.totalAprobado,
                    prefix: this.monedaSimbolo,
                    icon: 'mdi-check-circle',
                    color: 'green',
                    textClass: 'green--text text--darken-2'
                },
                {
                    title: 'Pendientes',
                    value: this.resumenVentas.totalPendiente,
                    prefix: this.monedaSimbolo,
                    icon: 'mdi-clock-outline',
                    color: 'orange',
                    textClass: 'orange--text text--darken-2'
                },
                {
                    title: 'Anulados',
                    value: this.resumenVentas.totalAnulado,
                    prefix: this.monedaSimbolo,
                    icon: 'mdi-close-circle',
                    color: 'red',
                    textClass: 'red--text text--darken-2'
                },
                {
                    title: 'T. Promedio',
                    value: this.resumenVentas.ticketPromedio,
                    prefix: this.monedaSimbolo,
                    icon: 'mdi-chart-bar',
                    color: this.getTicketPromedioColor(),
                    textClass: this.getTicketPromedioTextColor()
                },
                {
                    title: 'N° Compras',
                    value: this.resumenVentas.cantidad,
                    icon: 'mdi-numeric',
                    color: 'teal',
                    textClass: 'teal--text text--darken-2'
                }
            ];
        },

        resumenCardsMovil() {
            return [
                {
                    title: 'Total',
                    value: this.resumenVentas.totalGeneral,
                    prefix: this.monedaSimbolo,
                    class: 'primary--text'
                },
                {
                    title: 'Aprobados',
                    value: this.resumenVentas.totalAprobado,
                    prefix: this.monedaSimbolo,
                    class: 'green--text'
                },
                {
                    title: 'Pendientes',
                    value: this.resumenVentas.totalPendiente,
                    prefix: this.monedaSimbolo,
                    class: 'orange--text'
                },
                {
                    title: 'Anulados',
                    value: this.resumenVentas.totalAnulado,
                    prefix: this.monedaSimbolo,
                    class: 'red--text'
                },
                {
                    title: 'T. Promedio',
                    value: this.resumenVentas.ticketPromedio,
                    prefix: this.monedaSimbolo,
                    class: this.getTicketPromedioTextColor()
                },
                {
                    title: 'Compras',
                    value: this.resumenVentas.cantidad,
                    class: 'teal--text'
                }
            ];
        }
    },

    watch: {
        '$store.state.clientessearch': {
            immediate: true,
            handler(nuevo) {
                const base = Array.isArray(nuevo) ? nuevo : []
                this.arra_clientes = base.map(it => `${it.id} / ${it.nombre}`)
            }
        },
        date() {
            this.busca();
        },
        date2() {
            this.busca();
        }
    },
    methods: {
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        getTipoVenta(item) {
            if (item.id_grupo || (item.numeracion && item.numeracion.includes('PED'))) {
                return 'PRE-VENTA';
            }
            return 'VENTA DIRECTA';
        },
        getTipoVentaColor(item) {
            const tipo = this.getTipoVenta(item);
            switch (tipo) {
                case 'PRE-VENTA': return 'amber';
                case 'VENTA DIRECTA': return 'blue';
                default: return 'grey';
            }
        },
        sumaventas() {
            let venta = 0
            for (let i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].estado === 'aprobado' || this.desserts[i].estado === 'ACEPTADO') {
                    venta =
                        venta +
                        parseFloat(this.desserts[i].total || 0) -
                        parseFloat(this.desserts[i].descuentos || 0)
                }
            }
            return this.redondear(venta)
        },
        obtenerNombreVendedor(codigo) {
            if (!codigo) return 'No especificado';
            if (Array.isArray(this.$store.state.array_sedes)) {
                const vendedorInfo = this.$store.state.array_sedes.find(s =>
                    s.codigo === codigo
                );
                return vendedorInfo ? vendedorInfo.nombre : `Código: ${codigo}`;
            }
            return `Código: ${codigo}`;
        },
        ejecutaConsolida(value) {
            store.commit('dialogoprogress', true)
            this.arrayConsolidar = []
            consultaDetalle(value)
                .once('value')
                .then((snapshot) => {
                    snapshot.forEach((item) => {
                        this.arrayConsolidar.push(item.val())
                    })
                    this.dialog = true
                    store.commit('dialogoprogress', false)
                })
                .catch(() => {
                    store.commit('dialogoprogress', false)
                    store.commit('dialogosnackbar', 'Error al obtener detalle')
                })
        },
        redondear(valor) {
            return parseFloat(valor || 0).toFixed(store.state.configuracion.decimal || 2)
        },
        verPDF(item, medida) {
            store.commit('dialogoprogress', true)
            let arraydatos = []
            consultaDetalle(item.numeracion)
                .once('value')
                .then((snapshot) => {
                    arraydatos = snapshot.val()
                    if (snapshot.exists()) {
                        pdfGenera(arraydatos, item, medida, 'abre')
                    } else {
                        store.commit('dialogosnackbar', 'Detalle de comprobante no encontrado.')
                    }
                    store.commit('dialogoprogress', false)
                })
                .catch(() => {
                    store.commit('dialogoprogress', false)
                    store.commit('dialogosnackbar', 'Error al generar PDF')
                })
        },
        async busca() {
            let array = []
            this.desserts = []
            this.num_cliente = (this.busca_p || '').split('/')[0].trim()

            if (!this.num_cliente) {
                store.commit('dialogosnackbar', 'Seleccione o ingrese un cliente.')
                return
            }

            store.commit('dialogoprogress', true)
            try {
                const fechaInicioTimestamp = moment(this.date).startOf('day').unix();
                const fechaFinTimestamp = moment(this.date2).endOf('day').unix();
                const clienteInfo = this.$store.state.clientessearch.find(c => c.id === this.num_cliente);
                this.infoCliente = clienteInfo || null;

                const snapshot = await allCabecera()
                    .orderByChild('dni')
                    .equalTo(this.num_cliente)
                    .once('value')

                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        const data = item.val()
                        if (data.fecha >= fechaInicioTimestamp && data.fecha <= fechaFinTimestamp) {
                            data.color = this.asigna_color_doc(data)
                            data.deudaPendiente = 0

                            let vendedor_nombre = 'Sin vendedor';
                            if (data.vendedor && Array.isArray(this.$store.state.array_sedes)) {
                                const vendedorInfo = this.$store.state.array_sedes.find(s =>
                                    s.codigo === data.vendedor
                                );
                                if (vendedorInfo) {
                                    vendedor_nombre = vendedorInfo.nombre;
                                }
                            }
                            data.vendedor_nombre = vendedor_nombre;

                            array.push(data)
                        }
                    })

                    if (this.num_cliente) {
                        const deudasSnapshot = await allcuentaxcobrar()
                            .orderByChild('documento')
                            .equalTo(this.num_cliente)
                            .once('value')

                        const deudasMap = {}
                        if (deudasSnapshot.exists()) {
                            deudasSnapshot.forEach(item => {
                                const deuda = item.val()
                                if (deuda.estado === 'PENDIENTE' && deuda.monto_pendiente > 0) {
                                    const docRef = deuda.doc_ref || '';
                                    if (!deudasMap[docRef]) {
                                        deudasMap[docRef] = 0
                                    }
                                    deudasMap[docRef] += parseFloat(deuda.monto_pendiente || 0)
                                }
                            })
                            array.forEach(compra => {
                                compra.deudaPendiente = deudasMap[compra.numeracion] || 0
                            })
                        }
                    }
                    this.desserts = array.sort((a, b) => b.fecha - a.fecha)
                    store.commit('dialogoprogress', false)

                    if (array.length === 0) {
                        store.commit('dialogosnackbar', 'No hay compras en el rango de fechas seleccionado.')
                    }
                } else {
                    store.commit('dialogoprogress', false)
                    store.commit('dialogosnackbar', 'SIN INFORMACIÓN para este cliente.')
                }
            } catch (error) {
                console.error("Error al buscar compras:", error);
                store.commit('dialogoprogress', false)
                store.commit('dialogosnackbar', 'Error en la consulta. Revise su conexión.')
            }
        },
        asigna_color_doc(datas) {
            let estado = (datas.estado || '').toUpperCase()
            if (estado === 'ANULADO') return '#FF0000'
            if (estado === 'APROBADO' || estado === 'ACEPTADO') return '#46FF00'
            if (estado === 'PENDIENTE') return '#FFB200'
            return '#808080'
        },
        asigna_color_doc_chip(datas) {
            let estado = (datas.estado || '').toUpperCase()
            if (estado === 'ANULADO') return 'red'
            if (estado === 'APROBADO' || estado === 'ACEPTADO') return 'green'
            if (estado === 'PENDIENTE') return 'orange'
            return 'grey'
        },
        limpiarFiltros() {
            this.busca_p = '';
            this.num_cliente = '';
            this.date = moment().startOf('month').format('YYYY-MM-DD');
            this.date2 = moment().format('YYYY-MM-DD');
            this.desserts = [];
            this.num_doc = '';
            this.infoCliente = null;
            this.mostrarFiltrosMovil = false;
        },
        async verConsolidadoProductos() {
            if (!this.desserts.length) {
                store.commit('dialogosnackbar', 'No hay comprobantes para consolidar')
                return
            }

            const mapa = {}
            store.commit('dialogoprogress', true)

            try {
                const detailPromises = this.desserts.map(cab => consultaDetalle(cab.numeracion).once('value'));
                const snapshots = await Promise.all(detailPromises);

                snapshots.forEach((snapshot) => {
                    snapshot.forEach((itemSnap) => {
                        const det = itemSnap.val() || {}
                        const id = det.id || 'SIN_ID'

                        if (!id || !det.nombre) return;

                        const cant = Number(det.cantidad || 0)
                        const totalItem = Number(det.precioedita || 0) * cant;
                        const descTotal = Number(det.preciodescuento || 0) * cant;

                        if (!mapa[id]) {
                            mapa[id] = {
                                id,
                                nombre: det.nombre,
                                medida: det.medida || 'UNIDAD',
                                cantidadTotal: 0,
                                total: 0,
                                totalDescuento: 0
                            }
                        }

                        mapa[id].cantidadTotal += cant
                        mapa[id].total += totalItem
                        mapa[id].totalDescuento += descTotal
                    })
                });

                this.consolidadoProductos = Object.values(mapa).sort((a, b) =>
                    (a.nombre || '').localeCompare(b.nombre || '')
                )
                this.dialogConsolidadoProductos = true
            } catch (err) {
                console.error(err)
                store.commit('dialogosnackbar', 'Error al consolidar productos')
            } finally {
                store.commit('dialogoprogress', false)
            }
        },
        getTicketPromedioColor() {
            const ticketPromedio = parseFloat(this.resumenVentas.ticketPromedio || 0);
            if (ticketPromedio >= 600) return 'green';
            if (ticketPromedio >= 200) return 'orange';
            return 'red';
        },
        getTicketPromedioTextColor() {
            const ticketPromedio = parseFloat(this.resumenVentas.ticketPromedio || 0);
            if (ticketPromedio >= 600) return 'green--text text--darken-2';
            if (ticketPromedio >= 200) return 'orange--text text--darken-2';
            return 'red--text text--darken-2';
        },
        verDeudasCliente(item) {
            this.clienteParaDeudas = {
                documento: item.dni,
                id: item.dni,
                nombre: item.cliente,
                ...(this.infoCliente || {})
            };
            this.dialogDeudas = true;
        }
    }
}
</script>

<style scoped>
@media (max-width: 600px) {
    .v-card__text {
        padding: 12px !important;
    }

    .caption {
        font-size: 11px !important;
    }

    .subtitle-2 {
        font-size: 13px !important;
    }
}

.v-card {
    transition: transform 0.2s;
}

.v-card:hover {
    transform: translateY(-2px);
}
</style>