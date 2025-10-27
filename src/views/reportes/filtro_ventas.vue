<template>
    <div class="mb-6 mt-3 pa-4">
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense @click="$store.commit('dialogoFecha')" v-model="date"
                        label="Inicio" readonly></v-text-field>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense @click="$store.commit('dialogoFecha2')" v-model="date2"
                        label="Fin" readonly></v-text-field>
                </v-col>
                <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field class="mx-1" outlined dense v-model="num_doc" label="Busca" append-icon="mdi-magnify"
                        @click:append="busca()" @keyup.enter="busca()"></v-text-field>
                </v-col>
            </v-row>

            <v-row class="mt-n8">
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
                            <th class="text-left" v-if="!$store.state.esmovil">
                                Cliente
                            </th>
                            <th class="text-left" v-if="!$store.state.esmovil">
                                Colegio
                            </th>
                            <th class="text-left">
                                Fecha
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
                            <td style="font-size:75%;">{{ item.numeracion }}</td>
                            <td style="font-size:75%;" v-if="!$store.state.esmovil">{{ item.dni + ' - ' + item.cliente
                                }}
                            </td>
                            <td style="font-size:75%;">{{ item.observacion }}</td>
                            <td style="font-size:75%;">{{ conviertefecha(item.fecha) }}</td>

                            <td style="font-size:75%;">S/.{{ redondear(item.total - item.descuentos) }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="6" xs="6">
                                        <v-icon color="green"
                                            @click.prevent="ejecutaConsolida(item.numeracion)">mdi-eye</v-icon>
                                    </v-col>
                                    <v-col cols="6" xs="6">
                                        <v-icon color="red"
                                            @click.prevent="selecciona_item(item)">mdi-text-box-search-outline</v-icon>
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
                                    Descuento
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
                                <td class="red--text">S/.{{ item.preciodescuento }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad - item.preciodescuento) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>
        <v-dialog v-model="genera_pdf" max-width="550">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(genera_pdf = !genera_pdf)">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />
        </v-dialog>

        <fecha @fecha="(date = $event, busca())" />
        <fecha2 @fecha="date2 = $event, busca()" />
    </div>
</template>

<script>
import {
    allCabecera,
    consultaDetalle,
    grabaDatoC,
    consulta_Cabecera
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
        correo: ''
    }),

    computed: {
        listafiltrada() {
            this.desserts.reverse()
            return this.desserts.filter((item) => (item.observacion).trim()
                .toLowerCase().includes(this.num_doc.toLowerCase()))
        }
    },
    created() {
        this.busca()
    },
    methods: {
        selecciona_item(item) {
            this.seleccionado = item
            this.genera_pdf = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        sumaventas() {
            var venta = 0
            for (var i = 0; i < this.listafiltrada.length; i++) {

                venta = venta + parseFloat(this.desserts[i].total) - parseFloat(this.desserts[i].descuentos)

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
        busca() {
            store.commit("dialogoprogress")
            var array = []
            this.desserts = []

            allCabecera()
                .orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    snapshot.forEach((item) => {
                        var data = item.val()
                        if (data.estado == 'aprobado') {
                            array.push(data)
                        }
                    })
                    this.desserts = array
                    store.commit("dialogoprogress")
                })

        },

    }
}
</script>
