<template>
    <v-dialog v-model="dialogo_proforma" max-width="800px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="dialogo_proforma = !dialogo_proforma">mdi-close</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <h4 class="text-center">BUSCA PROFORMA</h4>
            <v-row class="pa-1">
                <v-col cols="10">
                    <v-text-field type="date" outlined dense v-model="date_proforma" label="Emision"></v-text-field>
                </v-col>
                <v-col cols="2">
                    <v-icon large color="green" @click="abrir_proformas(1)">mdi-magnify</v-icon>
                </v-col>
            </v-row>
            <v-row class="pa-1 mt-n12">
                <v-col cols="10">
                    <v-text-field outlined dense v-model="ruc_proforma" label="RUC"></v-text-field>
                </v-col>
                <v-col cols="2">
                    <v-icon large color="green" @click="abrir_proformas(2)">mdi-magnify</v-icon>
                </v-col>
            </v-row>
            <v-simple-table class="mt-n10" height="60vh" fixed-header dense>
                <template v-slot:default>
                    <thead>

                        <tr>
                            <th class="text-left" width="20">
                                Id
                            </th>
                            <th class="text-left">
                                Cliente
                            </th>
                            <th class="text-left">
                                Fecha
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in lista_comprobantes" :key="item.numeracion" @click="copia_comprobante(item)">
                            <td>{{ item.id }}</td>
                            <td>{{ item.nom_cliente }}</td>
                            <td> {{ conviertefecha(item.fecha_emision) }} </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>
    </v-dialog>
</template>

<script>
import {
    allProformas,
} from '../../../db'
import store from '@/store/index'
import moment from 'moment'
export default {
    props: {

    },
    name: 'caja',
    data() {
        return {
            date_proforma: moment(String(new Date)).format('YYYY-MM-DD'),
            ruc_proforma: '',
            dialogo_proforma: false,
            lista_comprobantes: [],
        }
    },
    created() {
        this.dialogo_proforma = true
        this.abrir_proformas(1)
    },
    computed: {

    },
    watch: {

    },
    methods: {
                conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        abrir_proformas(tipo) {
            this.lista_comprobantes = []
            if (tipo == 1) {
                allProformas().orderByChild('fecha_emision')
                    .startAt(moment(String(this.date_proforma)) / 1000)
                    .endAt(moment(String(this.date_proforma)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value").then((snapshot) => {
                        this.lista_comprobantes = snapshot.val()
                        this.dialogo_proforma = true
                    })
            }
            if (tipo == 2) {
                allProformas().orderByChild('num_cliente')
                    .equalTo(this.ruc_proforma)
                    .once("value").then((snapshot) => {
                        this.lista_comprobantes = snapshot.val()
                        this.dialogo_proforma = true
                    })
            }
        },
        copia_comprobante(data){
            this.$emit('copia_proforma',data)
        },
        cierra() {
            this.$emit('cierra', false)
        }
    }
}
</script>
