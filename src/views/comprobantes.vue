<template>
    <div class="mb-6 mt-3 pa-4">
        <v-btn v-if="false" @click="detalle">mostrar</v-btn>
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio"></v-text-field>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin"></v-text-field>
                </v-col>
                <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field class="mx-1" outlined dense v-model="num_doc" label="Busca Documento"
                        append-icon="mdi-magnify" @click:append="busca()" :prepend-inner-icon="tipo_doc"
                        @click:prepend-inner="cambia_doc()" @keyup.enter="busca()"></v-text-field>
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
                            <td style="font-size:75%;">{{ item.numeracion }}</td>
                            <td style="font-size:75%;" v-if="!$store.state.esmovil">{{ item.dni + ' - ' + item.cliente
                            }}
                                <span v-if="item.observacion != ''">- {{ item.observacion }}</span>
                            </td>
                            <td style="font-size:75%;">{{ conviertefecha(item.fecha) }}</td>
                            <td>
                                <v-icon :color="item.color">mdi-circle</v-icon>
                            </td>

                            <td style="font-size:75%;"><strong class="">{{ item.moneda || 'S/' }}</strong>{{
                                redondear(item.total - item.descuentos) }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="6" xs="6">
                                        <v-icon color="green"
                                            @click.prevent="ejecutaConsolida(item)">mdi-eye</v-icon>
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
        <v-dialog v-model="dialog" max-width="750px">
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
                                    Total
                                </th>
                            </tr>
                        </thead>

                    
                        <tbody>
                            <tr v-for="item in arrayConsolidar" :key="item.id" class="">
                                <td>{{ item.nombre }} - S/.{{ item.precioedita }} x {{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td v-if="item.operacion == 'GRATUITA'" class="red--text">S/.0.00</td>
                                <td v-else>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
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
    allCabecera,
    consultaDetalle,
    grabaDatoC,
    consulta_Cabecera
} from '../db'
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
            return this.desserts.filter((item) => (item.numeracion)
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
            consultaDetalle(value.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                this.dialog = true
                store.commit("dialogoprogress")
            })
            console.log(value,this.arrayConsolidar)
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(2)
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
            if (this.num_doc != '') {
                var data = this.tipo_doc + (this.num_doc).toString().padStart(8, 0)
                consulta_Cabecera(data)
                    .once("value").then((snapshot) => {
                        if (snapshot.exists()) {
                            var data = snapshot.val()
                            data.color = this.asigna_color_doc(data),
                                this.desserts.push(data)
                        } else {
                            store.commit('dialogosnackbar', 'Comprobante no existe')
                        }
                        store.commit("dialogoprogress")
                    })
            } else {
                allCabecera()
                    .orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            data.color = this.asigna_color_doc(data),
                                array.push(data)
                        })
                        this.desserts = array
                        store.commit("dialogoprogress")
                    })
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
        async detalle() {
            const arrau = [];

            for (let i = 0; i < this.desserts.length; i++) {
                const value = this.desserts[i].numeracion; // Asegúrate de tener este valor para la consulta
                const snap = await consultaDetalle(value).once("value");

                snap.forEach((item) => {
                    arrau.push({
                        cabecera: this.desserts[i],
                        detalle: item.val()
                    });
                });
            }

            console.log(arrau);
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
