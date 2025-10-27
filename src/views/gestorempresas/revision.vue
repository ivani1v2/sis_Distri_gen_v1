<template>
    <div class="mb-6 mt-3 pa-4">
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="4">
                    <v-text-field type="date" class="mx-1" outlined dense v-model="date" label="Inicio"></v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-text-field class="mx-1" type="date" outlined dense v-model="date2" label="Fin"></v-text-field>
                </v-col>

                <v-col cols="4">
                    <v-select :items="lista_tiendas" label="Ubicacion" dense outlined v-model="ubicacion"></v-select>
                </v-col>
            </v-row>

            <v-row class="mt-n8">
                <v-col cols="10">
                    <h4 class="text-center">Total General: S/.{{ sumaventas() }} </h4>
                </v-col>
                <v-col cols="1">
                    <v-btn color="success" class="" block x-small @click="editacomprobante()">AUTOMATA</v-btn>
                </v-col>
                <v-col cols="1">
                    <v-btn color="info" class="" block x-small @click="busca()">FILTRA</v-btn>
                </v-col>
            </v-row>

            <v-simple-table fixed-header height='70vh' dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Tienda
                            </th>
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
                            <td style="font-size:75%;">{{ item.tienda }} - {{ item.tienda_bd }}</td>
                            <td style="font-size:75%;">{{ item.numeracion }}</td>
                            <td style="font-size:75%;">{{ item.dni + ' - ' + item.cliente }}
                            </td>
                            <td style="font-size:75%;">{{ conviertefecha(item.fecha) }}</td>
                            <td>
                                <v-icon :color="item.color">mdi-circle</v-icon>
                            </td>
                            <td style="font-size:75%;">S/.{{ redondear(item.total) }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="12">
                                        <v-icon color="green" @click.prevent="ejecutaConsolida(item)">mdi-eye</v-icon>
                                    </v-col>

                                </v-row>
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
                                    Cantidad
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in arrayConsolidar" :key="item.id">
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }} x {{ item.medida }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>

        <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />


    </div>
</template>

<script>
import {
    allCabecera_general,
    consultaDetalle,
    grabaDatoC,
    consulta_Cabecera,

    allEmpresas,
    grabaDatoC_otrabd
} from '../../db'
import store from '@/store/index'
import imprime from '@/components/dialogos/dialog_imprime'
import moment from 'moment'
export default {
    components: {

        imprime
    },

    data: () => ({
        genera_pdf: false,
        documento: '',
        desserts: [],
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'T',
        numero: '',
        correo: '',
        array_ubica: [],
        ubicacion: 'todos',
        lista_tiendas: []
    }),

    computed: {
        listafiltrada() {
            this.desserts.reverse()
            if (this.ubicacion == 'todos') {
                return this.desserts
            }
            if (this.ubicacion != 'todos') {
                return this.desserts.filter((item) => item.tienda == this.ubicacion)
            }

        }
    },
    created() {
        this.obten_tiendas()

        this.busca()
    },
    methods: {
        async obten_tiendas() {
            this.array_ubica = []
            var snap = await allEmpresas().orderByChild('pruebas').equalTo(false).once('value')
            snap.forEach((item) => {
                console.log(item.val())
                this.array_ubica.push(item.val())
                this.lista_tiendas.push(item.val().name)
            })
            this.lista_tiendas.unshift('todos')
            console.log(this.array_ubica.length)
        },
        selecciona_item(item) {
            this.seleccionado = item
            this.genera_pdf = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM hh:mm A')
        },
        sumaventas() {
            var venta = 0
            var lista = this.listafiltrada
            for (var i = 0; i < lista.length; i++) {
                if (lista[i].estado == "aprobado") {
                    venta = venta + parseFloat(lista[i].total)
                }
            }
            return this.redondear(venta)
        },
        /*ejecutaConsolida(value) {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            consultaDetalle_bd(value.bd, value.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                this.dialog = true
                store.commit("dialogoprogress")
            })
        },*/
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        async busca() {
            store.commit("dialogoprogress")
            var array = []
            this.desserts = []
            var tiendas = this.array_ubica
            for (var i = 0; i < tiendas.length; i++) {
                console.log(tiendas[i])
                var snapshot = await allCabecera_general(tiendas[i].bd)
                    .orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value")
                console.log(snapshot.val())
                snapshot.forEach((item) => {
                    var data = item.val()
                    if (data.estado != 'aprobado') {
                        if (data.tipocomprobante != 'T') {
                            data.color = this.asigna_color_doc(data)
                            data.tienda = tiendas[i].name
                            data.tienda_bd = tiendas[i].bd
                            array.push(data)
                        }
                    }
                })

            }
            this.desserts = array
            store.commit("dialogoprogress")
        },
        editacomprobante() {
            for (var i = 0; i < this.desserts.length; i++) {
                console.log(this.desserts[i])
                grabaDatoC_otrabd(this.desserts[i].tienda_bd, this.desserts[i].numeracion, "automata", "")
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
