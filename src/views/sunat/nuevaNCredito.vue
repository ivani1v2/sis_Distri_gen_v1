<template>
<div class="pa-3 mb-6">
    <v-card>
        <div class="d-flex align-content-start flex-wrap">

            <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio"></v-text-field>

            <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin"></v-text-field>

            <v-text-field class="mx-1" outlined dense v-model="num_doc" label="Busca Documento" :prepend-inner-icon="tipo_doc" @click:prepend-inner="cambia_doc()" @keyup.enter="busca()"></v-text-field>

            <v-btn elevation="2" rounded color="red" small @click="busca()">
                <v-icon color="white" class="mx-auto text--center" small>mdi-magnify</v-icon>
            </v-btn>
        </div>

        <v-simple-table fixed-header height="65vh" dense>
            <template v-slot:default>
                <thead>
                    <tr>
                        <th class="text-left">
                            Correlativo
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
                        <td>{{ item.numeracion }}</td>
                        <td>{{ conviertefecha(item.fecha) }}</td>
                        <td>S/.{{ item.total-item.descuentos }}</td>
                        <td>
                            <v-icon color="red" @click="dialogoselecciona(item)">mdi-cash-100</v-icon>
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>
    </v-card>

    <notas />

  </div>
</template>

  
<script>
import {
    allCabecera,
    consultaDetalle,
    consulta_Cabecera
} from '../../db'
import moment from 'moment'
import store from '@/store/index'
import notas from './dialogos/dialogo_Nota'
export default {

    components: {
        notas,
    },

    data: () => ({
        desserts: [],
        arrayConsolidar: [],
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        itemselecto: '',
        ordenNcredito: '',
        serienc: '',
        num_doc: '',
        tipo_doc: 'B'
    }),
    created() {
        this.busca()
    },
    computed: {
        listafiltrada() {
            this.desserts.reverse()
            return this.desserts.filter((item) => (item.numeracion)
                .toLowerCase().includes(this.num_doc.toLowerCase()))
        }
    },
    methods: {
        dialogoselecciona(item) {
            store.commit('dialogoNota')
            //this.dialog=true
            this.cargaData(item)
            this.itemselecto = item
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },

        cargaData(value) {
            store.commit('data_caja_cabecera', value)
            this.arrayConsolidar = []
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].numeracion == value.numeracion) {
                    consultaDetalle(this.desserts[i].numeracion).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            this.arrayConsolidar.push(item.val())

                        })
                        store.commit('data_caja', this.arrayConsolidar)
                    })
                }
            }
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },

        router(view) {
            this.$router.push({
                name: view
            })
        },
        busca() {
            var array = []
            this.desserts = []
            if (this.num_doc != '') {
                var data = this.tipo_doc + (this.num_doc).toString().padStart(8, 0)
                consulta_Cabecera(data)
                    .once("value").then((snapshot) => {
                        if (snapshot.exists()) {
                            var data = snapshot.val()
                            this.desserts.push(data)
                        } else {
                            store.commit('dialogosnackbar', 'Comprobante no existe')
                        }
                    })
            } else {
                allCabecera()
                    .orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            console.log(data)
                            if (data.tipocomprobante != 'T' && (data.estado!='anulado') && data.num_nc==undefined) {
                               // console.log(data)
                                array.push(data)
                            }
                        })
                        this.desserts = array
                    })
            }
        },
        cambia_doc() {
            if (this.tipo_doc == 'B') {
                this.tipo_doc = 'F'
            } else {
                this.tipo_doc = 'B'
            }
        },

    }
}
</script>
