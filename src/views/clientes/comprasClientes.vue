<template>
    <div class="pa-4">
        <v-card class="elevation-3 rounded-lg">

            <v-card-title class="pa-4 blue-grey lighten-5">
                <v-icon large left color="blue-grey darken-3">mdi-cart-check</v-icon>
                <span class="text-h5 font-weight-bold blue-grey--text text--darken-3">Compras por Cliente</span>
                <v-spacer></v-spacer>

                <v-row dense class="ml-4" style="max-width: 500px;">
                    <v-col cols="12">
                        <v-autocomplete outlined dense autofocus label="Buscar Cliente (DNI / Razón Social)"
                            auto-select-first v-model="busca_p" :items="arra_clientes"
                            prepend-inner-icon="mdi-account-search" append-icon="mdi-magnify" @click:append="busca"
                            @keyup.enter="busca" hide-details></v-autocomplete>
                    </v-col>
                </v-row>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="py-3">
                <v-row dense class="align-center">

                    <!-- RESUMEN: CARDS -->
                    <v-col cols="12" md="8">
                        <v-row dense>
                            <!-- TOTAL GENERAL -->
                            <v-col cols="6" sm="6" md="3">
                                <v-card outlined class="pa-3 rounded-lg">
                                    <div class="d-flex align-center">
                                        <v-avatar size="34" class="mr-2" color="primary">
                                            <v-icon dark small>mdi-cash-multiple</v-icon>
                                        </v-avatar>
                                        <div>
                                            <div class="caption grey--text">Total general</div>
                                            <div class="subtitle-2 font-weight-bold primary--text">
                                                {{monedaSimbolo}} {{ resumenVentas.totalGeneral }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>

                            <!-- APROBADOS -->
                            <v-col cols="6" sm="6" md="3">
                                <v-card outlined class="pa-3 rounded-lg">
                                    <div class="d-flex align-center">
                                        <v-avatar size="34" class="mr-2" color="green">
                                            <v-icon dark small>mdi-check-circle</v-icon>
                                        </v-avatar>
                                        <div>
                                            <div class="caption grey--text">Aprobados</div>
                                            <div class="subtitle-2 font-weight-bold green--text text--darken-2">
                                                {{monedaSimbolo}} {{ resumenVentas.totalAprobado }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>

                            <!-- PENDIENTES -->
                            <v-col cols="6" sm="6" md="3">
                                <v-card outlined class="pa-3 rounded-lg">
                                    <div class="d-flex align-center">
                                        <v-avatar size="34" class="mr-2" color="orange">
                                            <v-icon dark small>mdi-clock-outline</v-icon>
                                        </v-avatar>
                                        <div>
                                            <div class="caption grey--text">Pendientes</div>
                                            <div class="subtitle-2 font-weight-bold orange--text text--darken-2">
                                                {{monedaSimbolo}} {{ resumenVentas.totalPendiente }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>

                            <!-- ANULADOS -->
                            <v-col cols="6" sm="6" md="3">
                                <v-card outlined class="pa-3 rounded-lg">
                                    <div class="d-flex align-center">
                                        <v-avatar size="34" class="mr-2" color="red">
                                            <v-icon dark small>mdi-close-circle</v-icon>
                                        </v-avatar>
                                        <div>
                                            <div class="caption grey--text">Anulados</div>
                                            <div class="subtitle-2 font-weight-bold red--text text--darken-2">
                                                {{monedaSimbolo}} {{ resumenVentas.totalAnulado }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- TEXTO DE CLIENTE FILTRADO -->
                        <div v-if="num_cliente" class="caption grey--text mt-1">
                            Cliente filtrado: <b>{{ num_cliente }}</b> · {{ resumenVentas.cantidad }} comprobante(s)
                        </div>
                    </v-col>

                    <!-- BOTON CONSOLIDADO -->
                    <v-col cols="12" md="4" class="text-center text-md-right">
                        <v-btn small color="info" rounded @click="verConsolidadoProductos" :disabled="!desserts.length"
                            class="mx-1">
                            <v-icon left small>mdi-package-variant-closed</v-icon>
                            Consolidado de Productos
                        </v-btn>
                    </v-col>

                </v-row>
            </v-card-text>


            <v-divider></v-divider>

            <v-simple-table fixed-header height="70vh" dense class="elevation-0">
                <template v-slot:default>
                    <thead class="grey darken-3">
                        <tr>
                            <th class="text-left">Correlativo</th>
                            <th class="text-left">Cliente</th>
                            <th class="text-left">Fecha</th>
                            <th class="text-center">Estado</th>
                            <th class="text-right">Total</th>
                            <th class="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!listafiltrada.length">
                            <td colspan="6" class="text-center grey--text text-caption">
                                Sin resultados para el cliente seleccionado.
                            </td>
                        </tr>
                        <tr v-for="item in listafiltrada" :key="item.numeracion">
                            <td class="caption font-weight-medium">{{ item.numeracion }}</td>
                            <td class="caption">{{ item.dni }} / {{ item.cliente }}</td>
                            <td class="caption">{{ conviertefecha(item.fecha) }}</td>
                            <td class="text-center">
                                <v-chip x-small :color="asigna_color_doc_chip(item)" dark>
                                    {{ item.estado }}
                                </v-chip>
                            </td>
                            <td class="text-right font-weight-bold">
                                {{ monedaSimbolo }}{{ redondear(item.total - item.descuentos) }}
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
                                            <v-list-item-icon><v-icon color="info">mdi-eye</v-icon></v-list-item-icon>
                                            <v-list-item-title>Ver Detalle</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="verPDF(item, '80')">
                                            <v-list-item-icon><v-icon
                                                    color="red">mdi-printer-pos-outline</v-icon></v-list-item-icon>
                                            <v-list-item-title>Imprimir (Ticket 80mm)</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="verPDF(item, 'A4')">
                                            <v-list-item-icon><v-icon
                                                    color="red darken-2">mdi-file-pdf-box</v-icon></v-list-item-icon>
                                            <v-list-item-title>Imprimir (A4)</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <v-dialog v-model="dialog" max-width="850px">
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark>
                    <v-toolbar-title>Detalle del Comprobante</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-simple-table fixed-header height="60vh" dense>
                        <template v-slot:default>
                            <thead class="blue-grey lighten-5">
                                <tr>
                                    <th class="text-left font-weight-bold">Descripción</th>
                                    <th class="text-left font-weight-bold">Medida</th>
                                    <th class="text-center font-weight-bold">Cantidad</th>
                                    <th class="text-right font-weight-bold">Precio Unit.</th>
                                    <th class="text-right font-weight-bold">Dscto.</th>
                                    <th class="text-right font-weight-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in arrayConsolidar" :key="index">
                                    <td class="caption">{{ item.id }} - {{ item.nombre }}</td>
                                    <td class="caption">{{ item.medida }}</td>
                                    <td class="text-center caption">{{ item.cantidad }}</td>
                                    <td class="text-right caption">{{monedaSimbolo}}{{ redondear(item.precioedita) }}</td>
                                    <td class="text-right caption red--text">{{monedaSimbolo}}{{ redondear(item.preciodescuento) }}
                                    </td>
                                    <td class="text-right caption font-weight-bold">{{monedaSimbolo}}{{ redondear(item.precioedita *
                                        item.cantidad - item.preciodescuento) }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogConsolidadoProductos" max-width="900px">
            <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark>
                    <v-toolbar-title>Consolidado de Productos Vendidos (Filtro Cliente)</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogConsolidadoProductos = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-simple-table fixed-header height="70vh" dense class="elevation-0">
                        <template v-slot:default>
                            <thead class="blue-grey lighten-5">
                                <tr>
                                    <th class="text-left font-weight-bold">ID</th>
                                    <th class="text-left font-weight-bold">Descripción</th>
                                    <th class="text-left font-weight-bold">Medida</th>
                                    <th class="text-right font-weight-bold">Cantidad total</th>
                                    <th class="text-right font-weight-bold">Desc. total ({{monedaSimbolo}})</th>
                                    <th class="text-right font-weight-bold">Total Neto ({{monedaSimbolo}})</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(p, idx) in consolidadoProductos" :key="p.id || idx">
                                    <td class="caption">{{ p.id || '-' }}</td>
                                    <td class="caption">{{ p.nombre || '-' }}</td>
                                    <td class="caption">{{ p.medida || '-' }}</td>
                                    <td class="text-right caption font-weight-bold">{{ redondear(p.cantidadTotal) }}
                                    </td>
                                    <td class="text-right caption red--text">{{ redondear(p.totalDescuento) }}</td>
                                    <td class="text-right caption font-weight-bold primary--text">
                                        {{ redondear(p.total - p.totalDescuento) }}
                                    </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

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
    consulta_Cabecera
} from '../../db'

import store from '@/store/index'
import moment from 'moment'
import { pdfGenera } from '../../pdf_comprobantes'

export default {
    data: () => ({
        busca_clientes: false,
        documento: '',
        desserts: [],
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment().format('YYYY-MM-DD'),
        date2: moment().format('YYYY-MM-DD'),
        rechazados: 0,
        error: '',
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'T',
        arra_clientes: [],
        busca_p: '',
        num_cliente: '',
        dialogConsolidadoProductos: false,
        consolidadoProductos: []
    }),
    created() {
        // Inicializa aquí si es necesario
    },
    computed: {
        listafiltrada() {
            return this.desserts.filter((item) =>
                (item.numeracion || "")
                    .toLowerCase()
                    .includes((this.num_doc || "").toLowerCase())
            );
        },

        resumenVentas() {
            const dec = Number(store.state?.configuracion?.decimal ?? 2);

            let totalGeneral = 0;
            let totalAprobado = 0;
            let totalPendiente = 0;
            let totalAnulado = 0;

            const list = Array.isArray(this.desserts) ? this.desserts : [];

            for (const d of list) {
                const estado = String(d.estado || "").toUpperCase();
                const total = Number(d.total || 0) - Number(d.descuentos || 0);

                totalGeneral += total;

                if (estado === "APROBADO" || estado === "ACEPTADO") totalAprobado += total;
                else if (estado === "PENDIENTE") totalPendiente += total;
                else if (estado === "ANULADO") totalAnulado += total;
            }

            const f = (n) => Number(n || 0).toFixed(dec);

            return {
                cantidad: list.length,
                totalGeneral: f(totalGeneral),
                totalAprobado: f(totalAprobado),
                totalPendiente: f(totalPendiente),
                totalAnulado: f(totalAnulado),
            };
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
        }
    },

    watch: {
        '$store.state.clientessearch': {
            immediate: true,
            handler(nuevo) {
                const base = Array.isArray(nuevo) ? nuevo : []
                this.arra_clientes = base.map(it => `${it.id} / ${it.nombre}`)
            }
        }
    },
    methods: {
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
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
        ejecutaConsolida(value) {
            store.commit('dialogoprogress', true) // Usar true/false o un número, como en el script anterior
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
            // Extraer solo el DNI/RUC
            this.num_cliente = (this.busca_p || '').split('/')[0].trim()

            if (!this.num_cliente) {
                store.commit('dialogosnackbar', 'Seleccione o ingrese un cliente.')
                return
            }

            store.commit('dialogoprogress', true)
            try {
                const snapshot = await allCabecera()
                    .limitToLast(200) // Se recomienda limitar para rendimiento
                    .orderByChild('dni')
                    .equalTo(this.num_cliente)
                    .once('value')

                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        const data = item.val()
                        data.color = this.asigna_color_doc(data) // El color original
                        array.push(data)
                    })
                    // Ordenar por fecha descendente (más recientes primero)
                    this.desserts = array.sort((a, b) => b.fecha - a.fecha)
                    store.commit('dialogoprogress', false)
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
            if (estado === 'ANULADO') return '#FF0000' // Rojo
            if (estado === 'APROBADO' || estado === 'ACEPTADO') return '#46FF00' // Verde
            if (estado === 'PENDIENTE') return '#FFB200' // Naranja/Amarillo
            return '#808080' // Gris por defecto
        },
        // 👇 Nueva función para color de chip (más limpio que el color hex directo)
        asigna_color_doc_chip(datas) {
            let estado = (datas.estado || '').toUpperCase()
            if (estado === 'ANULADO') return 'red'
            if (estado === 'APROBADO' || estado === 'ACEPTADO') return 'green'
            if (estado === 'PENDIENTE') return 'orange'
            return 'grey'
        },

        async verConsolidadoProductos() {
            if (!this.desserts.length) {
                store.commit('dialogosnackbar', 'No hay comprobantes para consolidar')
                return
            }

            const mapa = {} // key = id producto
            store.commit('dialogoprogress', true)

            try {
                // Recorre todos los comprobantes cargados
                const detailPromises = this.desserts.map(cab => consultaDetalle(cab.numeracion).once('value'));
                const snapshots = await Promise.all(detailPromises);

                snapshots.forEach((snapshot) => {
                    snapshot.forEach((itemSnap) => {
                        const det = itemSnap.val() || {}
                        const id = det.id || 'SIN_ID'

                        // Ignorar items sin ID o nombre si es necesario
                        if (!id || !det.nombre) return;

                        const cant = Number(det.cantidad || 0)
                        const totalItem = Number(det.precioedita || 0) * cant;
                        const descTotal = Number(det.preciodescuento || 0) * cant; // Asumiendo que el descuento ya está por unidad o total

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
        }
    }
}
</script>