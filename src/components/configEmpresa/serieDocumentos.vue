<template>
    <v-dialog v-model="$store.state.dialogoSerieDocumentos" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="$store.commit('dialogoSerieDocumentos')">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-4">

            <v-row>
                <v-checkbox dense v-model="notaventa" label="Nota de venta"></v-checkbox>
            </v-row>
            <v-row>
                <v-col cols="6">
                    <v-text-field outlined dense v-model="ticket" label="TICKET"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field outlined dense v-model="factura" label="FACTURA"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="mt-n6">
                <v-col cols="6">
                    <v-text-field outlined dense v-model="boleta" label="BOLETA"></v-text-field>
                </v-col>
                <v-col cols="6">

                    <v-text-field outlined dense v-model="notacredito" label="NOTA DE CREDITO"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="mt-n6">
                <v-col cols="6">
                    <v-text-field outlined dense v-model="guia" label="GUIA REMITENTE"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field outlined dense v-model="guia_t" label="GUIA TRANSPORTISTA"></v-text-field>
                </v-col>
            </v-row>
            <v-card-actions>
                <v-btn @click="grabaContador()" block color="green">Guardar</v-btn>
            </v-card-actions>

        </v-card>

    </v-dialog>
</template>

<script>
import {
    obtenerSeries,
    actualizaSeries
} from '../../db'
import store from '@/store/index'

export default {

    data() {
        return {
            ticket: 'T001',
            factura: 'F001',
            boleta: 'B001',
            notacredito: '01',
            guia: 'T001',
            guia_t: 'V001',
            notaventa: false,
        }
    },
    mounted() {
        this.initialize()
    },
    methods: {
        initialize() {
            this.desserts = []
            obtenerSeries().once("value").then((snapshot) => {
                if (snapshot.exists) {
                    this.ticket = snapshot.val().ticket
                    this.factura = snapshot.val().factura
                    this.boleta = snapshot.val().boleta
                    this.notacredito = snapshot.val().notacredito
                    this.notaventa = snapshot.val().notaventa
                    this.guia = snapshot.val().guia
                    this.guia_t = snapshot.val().guia_t

                } else {
                    this.ticket = 'T001'
                    this.factura = 'F001'
                    this.boleta = 'B001'
                    this.notacredito = 'NC01'
                    this.guia = 'T001'
                    this.guia_t = 'V001'
                    this.notaventa = false
                }
            })
        },
        grabaContador() {
            var array = {}
            array = {
                ticket: this.ticket,
                factura: this.factura,
                boleta: this.boleta,
                notacredito: this.notacredito,
                notaventa: this.notaventa,
                guia: this.guia,
                guia_t: this.guia_t
            }
            store.commit("seriesdocumentos", array)
            actualizaSeries('ticket', this.ticket)
            actualizaSeries('factura', this.factura)
            actualizaSeries('boleta', this.boleta)
            actualizaSeries('notacredito', this.notacredito)
            actualizaSeries('notaventa', this.notaventa)
            actualizaSeries('guia', this.guia)
            actualizaSeries('guia_t', this.guia_t)
            store.commit("dialogoSerieDocumentos")
        }

    }

}
</script>
