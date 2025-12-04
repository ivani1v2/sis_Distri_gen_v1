<template>
    <div class="pa-3">
        <v-card>
            <h4 class="text-center">Compras por Cliente</h4>

            <v-row class="pa-2">
                <v-col cols="10">
                    <v-autocomplete
                        outlined
                        dense
                        autofocus
                        label="Busca Cliente"
                        auto-select-first
                        v-model="busca_p"
                        :items="arra_clientes"
                        append-icon="mdi-magnify"
                        @click:append="filtra()"
                        @keyup.enter="filtra()"
                    ></v-autocomplete>
                </v-col>
                <v-col cols="2" class="text-center">
                    <v-btn elevation="2" rounded color="red" small @click="busca()">
                        <v-icon color="white" class="mx-auto text--center" small>mdi-magnify</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <v-row class="mt-n4 px-4">
                <v-col cols="12" md="6">
                    <h4 class="text-center text-md-left mb-2 mb-md-0">
                        Total General: S/. {{ sumaventas() }}
                    </h4>
                </v-col>
                <v-col cols="12" md="6" class="text-center text-md-right">
                    <!-- 👇 NUEVO BOTÓN -->
                    <v-btn
                        small
                        color="primary"
                        rounded
                        @click="verConsolidadoProductos"
                        :disabled="!desserts.length"
                    >
                        <v-icon left small>mdi-view-list</v-icon>
                        Ver productos
                    </v-btn>
                </v-col>
            </v-row>

            <v-simple-table fixed-header height="70vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">Correlativo</th>
                            <th class="text-left">Cliente</th>
                            <th class="text-left">Fecha</th>
                            <th class="text-left">Estado</th>
                            <th class="text-left">Total</th>
                            <th class="text-left">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td style="font-size:75%;" width="100">{{ item.numeracion }}</td>
                            <td style="font-size:75%;">{{ item.dni + ' - ' + item.cliente }}</td>
                            <td style="font-size:75%;" width="200">{{ conviertefecha(item.fecha) }}</td>
                            <td style="font-size:75%;" width="20">
                                <v-icon :color="item.color">mdi-circle</v-icon>
                            </td>
                            <td style="font-size:75%;" width="20">
                                {{ item.moneda }}{{ redondear(item.total - item.descuentos) }}
                            </td>
                            <td width="200">
                                <v-icon
                                    class="mx-1"
                                    color="green"
                                    @click.prevent="ejecutaConsolida(item.numeracion)"
                                >
                                    mdi-eye
                                </v-icon>
                                <v-btn
                                    class="mx-1"
                                    color="error"
                                    x-small
                                    rounded
                                    outlined
                                    @click="verPDF(item, '80')"
                                >
                                    80
                                </v-btn>
                                <v-btn
                                    class="mx-1"
                                    color="error"
                                    x-small
                                    rounded
                                    outlined
                                    @click="verPDF(item, 'A4')"
                                >
                                    A4
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <!-- DETALLE DE UN SOLO COMPROBANTE (LO QUE YA TENÍAS) -->
        <v-dialog v-model="dialog" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-simple-table dark fixed-header max-width="70vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Descripción</th>
                                <th class="text-left">Medida</th>
                                <th class="text-left">Cantidad</th>
                                <th class="text-left">Precio</th>
                                <th class="text-left">Descuento</th>
                                <th class="text-left">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in arrayConsolidar" :key="item.id">
                                <td>{{ item.id + ' ' + item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }}</td>
                                <td class="red--text">S/.{{ item.preciodescuento }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <!-- 👇 NUEVO: CONSOLIDADO DE PRODUCTOS -->
        <v-dialog v-model="dialogConsolidadoProductos" max-width="900px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogConsolidadoProductos = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <span>Consolidado de productos</span>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-simple-table fixed-header height="70vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">ID</th>
                                <th class="text-left">Descripción</th>
                                <th class="text-left">Medida</th>
                                <th class="text-right">Cantidad total</th>
                                <th class="text-right">Desc. total (S/.)</th>
                                <th class="text-right">Total (S/.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, idx) in consolidadoProductos" :key="p.id || idx">
                                <td style="font-size:75%;">{{ p.id || '-' }}</td>
                                <td style="font-size:75%;">{{ p.nombre || '-' }}</td>
                                <td style="font-size:75%;">{{ p.medida || '-' }}</td>
                                <td style="font-size:75%;" class="text-right">
                                    {{ p.cantidadTotal }}
                                </td>
                                <td style="font-size:75%;" class="text-right">
                                    {{ redondear(p.totalDescuento) }}
                                </td>
                                <td style="font-size:75%;" class="text-right">
                                    {{ redondear(p.total) }}
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
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
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        rechazados: 0,
        error: '',
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'T',
        arra_clientes: [],
        busca_p: '',
        num_cliente: '',
        // 👇 NUEVO
        dialogConsolidadoProductos: false,
        consolidadoProductos: []
    }),
    created() {
        // ...
    },
    computed: {
        listafiltrada() {
            this.desserts.reverse()
            return this.desserts.filter((item) =>
                (item.numeracion || '')
                    .toLowerCase()
                    .includes((this.num_doc || '').toLowerCase())
            )
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
                if (this.desserts[i].estado == 'aprobado') {
                    venta =
                        venta +
                        parseFloat(this.desserts[i].total) -
                        parseFloat(this.desserts[i].descuentos)
                }
            }
            return this.redondear(venta)
        },
        ejecutaConsolida(value) {
            store.commit('dialogoprogress')
            this.arrayConsolidar = []
            consultaDetalle(value)
                .once('value')
                .then((snapshot) => {
                    snapshot.forEach((item) => {
                        this.arrayConsolidar.push(item.val())
                    })
                    this.dialog = true
                    store.commit('dialogoprogress')
                })
        },
        redondear(valor) {
            return parseFloat(valor || 0).toFixed(store.state.configuracion.decimal)
        },
        verPDF(item, medida) {
            store.commit('dialogoprogress')
            let arraydatos = []
            consultaDetalle(item.numeracion)
                .once('value')
                .then((snapshot) => {
                    arraydatos = snapshot.val()
                    if (snapshot.exists()) {
                        pdfGenera(arraydatos, item, medida, 'abre')
                    }
                    store.commit('dialogoprogress')
                })
        },
        async busca() {
            let array = []
            this.desserts = []
            this.num_cliente = (this.busca_p || '').split('/')[0].trim()

            if (this.num_cliente != '') {
                store.commit('dialogoprogress')
                const snapshot = await allCabecera()
                    .limitToLast(100)
                    .orderByChild('dni')
                    .equalTo(this.num_cliente)
                    .once('value')

                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        const data = item.val()
                        data.color = this.asigna_color_doc(data)
                        array.push(data)
                    })
                    this.desserts = array
                    store.commit('dialogoprogress')
                } else {
                    store.commit('dialogosnackbar', 'SIN INFORMACIÓN')
                }
            }
        },
        cambia_doc() {
            if (this.tipo_doc == 'B') {
                this.tipo_doc = 'F'
            } else {
                if (this.tipo_doc == 'F') {
                    this.tipo_doc = 'T'
                } else {
                    this.tipo_doc = 'B'
                }
            }
        },
        asigna_color_doc(datas) {
            let data = datas
            let color = ''
            if (
                data.estado != 'aprobado' ||
                data.estado != 'ACEPTADO' ||
                data.estado != 'PENDIENTE' ||
                data.estado != 'pendiente'
            ) {
                color = '#FF0000'
            }
            if (data.estado == 'aprobado' || data.estado == 'ACEPTADO') {
                color = '#46FF00'
            }
            if (data.estado == 'PENDIENTE' || data.estado == 'pendiente') {
                color = '#FFB200'
            }
            return color
        },

        // 👇 NUEVO: consolida todos los productos de TODOS los comprobantes listados
        async verConsolidadoProductos() {
            if (!this.desserts.length) {
                store.commit('dialogosnackbar', 'No hay comprobantes para consolidar')
                return
            }

            const mapa = {} // key = id producto
            store.commit('dialogoprogress')

            try {
                // Recorre todos los comprobantes cargados
                for (const cab of this.desserts) {
                    if (!cab || !cab.numeracion) continue

                    const snapshot = await consultaDetalle(cab.numeracion).once('value')
                    if (!snapshot.exists()) continue

                    snapshot.forEach((itemSnap) => {
                        const det = itemSnap.val() || {}
                        const id = det.id || 'SIN_ID'
                        const nombre = det.nombre || ''
                        const medida = det.medida || ''

                        const cant = Number(det.cantidad || 0)
                        const precio = Number(det.precioedita || 0)
                        const descUnit = Number(det.preciodescuento || 0)

                        if (!mapa[id]) {
                            mapa[id] = {
                                id,
                                nombre,
                                medida,
                                cantidadTotal: 0,
                                total: 0,
                                totalDescuento: 0
                            }
                        }

                        mapa[id].cantidadTotal += cant
                        mapa[id].total += cant * precio
                        mapa[id].totalDescuento += cant * descUnit
                    })
                }

                this.consolidadoProductos = Object.values(mapa).sort((a, b) =>
                    (a.nombre || '').localeCompare(b.nombre || '')
                )
                this.dialogConsolidadoProductos = true
            } catch (err) {
                console.error(err)
                store.commit('dialogosnackbar', 'Error al consolidar productos')
            } finally {
                store.commit('dialogoprogress')
            }
        }
    }
}
</script>

<style>
/* puedes dejar vacío o agregar estilos luego */
</style>
