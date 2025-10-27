<template>
    <div class="pa-3">

        <v-card>
            <h4 class="text-center">Compras por Cliente</h4>
            <v-row class="pa-2">
                <v-col cols="10">
                       <v-autocomplete outlined dense autofocus label="Busca Cliente" auto-select-first v-model="busca_p"
                    :items="arra_clientes" append-icon="mdi-magnify" @click:append="filtra()"
                    @keyup.enter="filtra()"></v-autocomplete>
                </v-col>
                <v-col cols="2" class="text-center">
                    <v-btn elevation="2" rounded color="red" small @click="busca()">
                        <v-icon color="white" class="mx-auto text--center" small>mdi-magnify</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <v-row class="mt-n12">
                <v-col cols="12">
                    <h4 class="text-center">Total General: S/.{{ sumaventas() }} </h4>
                </v-col>
            </v-row>

            <v-simple-table fixed-header height='70vh' dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Correlativo
                            </th>
                            <th class="text-left">
                                Cliente
                            </th>
                            <th class="text-left">
                                Fecha
                            </th>
                            <th class="text-left">
                                Estado
                            </th>
                            <th class="text-left">
                                Total
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
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
                            <td style="font-size:75%;" width="20">S/.{{ redondear(item.total - item.descuentos) }}</td>
                            <td width="200">
                                <v-icon class="mx-1" color="green"
                                    @click.prevent="ejecutaConsolida(item.numeracion)">mdi-eye</v-icon>
                                <v-btn class="mx-1" color="error" x-small rounded outlined
                                    @click="verPDF(item, '80')">80</v-btn>
                                <v-btn class="mx-1" color="error" x-small rounded outlined
                                    @click="verPDF(item, 'A4')">A4</v-btn>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>

        <v-dialog v-model="dialog" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>
                <v-simple-table dark fixed-header max-width="70vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Medida
                                </th>
                                <th class="text-left">
                                    Cantidad.
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Descuento
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
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
import {
    pdfGenera
} from '../../pdf_comprobantes'
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
        num_cliente: ''
    }),
    created() {
       
    },
    computed: {
        listafiltrada() {
            this.desserts.reverse()
            return this.desserts.filter((item) => (item.numeracion)
                .toLowerCase().includes(this.num_doc.toLowerCase()))
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
    },
    methods: {



        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        sumaventas() {
            var venta = 0
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].estado == "aprobado") {
                    venta = venta + parseFloat(this.desserts[i].total) - parseFloat(this.desserts[i].descuentos)
                }
            }
            return this.redondear(venta)
        },
        ejecutaConsolida(value) {
            store.commit("dialogoprogress")

            this.arrayConsolidar = []
            consultaDetalle(value).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                this.dialog = true
                store.commit("dialogoprogress")
            })
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        verPDF(item, medida) {
            store.commit("dialogoprogress")
            var arraydatos = []
            consultaDetalle(item.numeracion).once("value").then((snapshot) => {
                arraydatos = snapshot.val()
                if (snapshot.exists()) {
                    pdfGenera(arraydatos, item, medida, 'abre')
                }
                store.commit("dialogoprogress")
            })
        },
        eliminardata() {
            //   eliminaNodo("comprobantedetalle")
        },
        modificafechas() {
            for (var i = 0; i < this.desserts.length; i++) {
                console.log(this.desserts[i].numeracion)
                //grabaDatoC(this.desserts[i].numeracion,"estado","aprobado")
                // grabaDatoC(this.desserts[i].numeracion,"vencimientoDoc",1656438412)
                //grabaDatoC(this.desserts[i].numeracion,"automata","no")
            }
        },
        async busca() {
            var array = []
            this.desserts = []
            this.num_cliente = this.busca_p.split('/')[0].trim()

            if (this.num_cliente != '') {
                store.commit("dialogoprogress")
                var snapshot = await allCabecera().limitToLast(100).orderByChild("dni")
                    .equalTo(this.num_cliente)
                    .once("value")
                if (snapshot.exists()) {
                    console.log(snapshot.val())
                    snapshot.forEach((item) => {
                        var data = item.val()
                        data.color = this.asigna_color_doc(data),
                            array.push(data)
                    })
                    this.desserts = array
                    store.commit("dialogoprogress")
                } else {
                    store.commit('dialogosnackbar', 'SIN INFORMACION')
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
            var color = ''
            if (data.estado != 'aprobado' || data.estado != 'ACEPTADO' ||
                data.estado != 'PENDIENTE' || data.estado != 'pendiente') {
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

    }
}
</script>

<style></style>
