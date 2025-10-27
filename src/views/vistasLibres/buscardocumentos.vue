<template>
    <v-container class="mt-8">
        <v-card shaped elevation="10" class="card-1 mx-auto mt-10" color="white" width="500px">
            <v-card-title class="text--center">BUSCAR DOCUMENTO</v-card-title>
            <v-row dense class="pa-4">
                <v-col cols="12">
                    <v-text-field outlined dense v-model="ruc" label="RUC(emisor)"
                        placeholder="20481962171"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field outlined dense v-model="serie" label="SERIE" placeholder="F001"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field outlined dense v-model="correlativo" label="CORRELATIVO"
                        placeholder="10000156"></v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-text-field outlined dense v-model="dni" label="RUC/DNI(Cliente)"
                        placeholder="10466888975"></v-text-field>
                </v-col>
            </v-row>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="success" @click="buscar()">BUSCAR</v-btn>
            </v-card-actions>
        </v-card>
        <v-snackbar v-model="snackbar" :timeout="timeout" top>
            {{ text }}

            <template v-slot:action="{ attrs }">
                <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script>
import {
    descargaXML,
    descargaCDR
} from '../../servidorsunat'
import {
    db,
    allEmpresas,
    buscacabecera,
    buscadetalle
} from '@/db'

import moment from 'moment'
import store from '@/store/index'
export default {
    data() {
        return {
            ruc: '',
            serie: '',
            correlativo: '',
            snackbar: false,
            text: '',
            timeout: 2000,
            existedoc: false,
            tipodoc: '',
            dni: '',
            bd: ''
        }
    },

    methods: {
        buscar() {
            if (this.serie.charAt(0) == "F") {
                this.tipodoc = '01'
            } else {
                this.tipodoc = '03'
            }
            var self = this
            var ruc = this.ruc
            var serie = this.serie
            var correlativo = this.correlativo
            var gsReference = db.storage().refFromURL('gs://mitienda-f5ef8.appspot.com')
            gsReference.child(ruc + '/' + ruc + '-' + this.tipodoc + '-' + serie + '-' + correlativo + '.ZIP').getDownloadURL().then(function (url) {
                // `url` is the download URL for 'images/stars.jpg'
                self.existe()

            }).catch(function (error) {
                // Handle any errors
                self.noExiste()
            });
        },
        async existe() {
            if (this.serie.charAt(0) == "F") {
                this.tipodoc = '01'
            } else {
                this.tipodoc = '03'
            }
            this.bd = await this.buscaempresa()
            var url = 'https://factura-peru.com/comprobantes_clientes/' + this.bd + '/' + this.ruc + '/' + this.tipodoc + '/' + this.serie + '/' + this.correlativo + '/' + this.dni
            window.open(url);
        },
        noExiste() {
            this.snack("NO EXISTE")
            this.existedoc = false
        },
        descargaXML() {
            descargaXML(this.ruc, this.tipodoc, this.serie, this.correlativo)
        },
        descargaCDR() {
            descargaCDR(this.ruc, this.tipodoc, this.serie, this.correlativo)
        },
        copiaDocumento() {
            var numeracion = this.serie.charAt(0) + this.correlativo
            this.buscaempresa().then((bd) => {
                this.bd = bd
                this.buscacabecera(bd, numeracion).then((cabecera) => {
                    console.log(cabecera)
                    this.buscadetalle(bd, numeracion).then((detalle) => {
                        console.log(detalle)
                        this.generadocumentopdf(cabecera, detalle)
                    })
                })
            })
        },
        buscaempresa() {
            var bd = ''
            var a = allEmpresas().once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    if (item.val().ruc == this.ruc) {
                        //store.commit('BD',item.val())
                        bd = item.val().bd
                    }
                })
                return bd
            })
            return a
        },
        buscacabecera(bd, numeracion) {
            var a = buscacabecera(bd, numeracion).once("value").then((snapshot) => {
                return snapshot.val()
            })
            return a
        },
        buscadetalle(bd, numeracion) {
            var a = buscadetalle(bd, numeracion).once("value").then((snapshot) => {
                return snapshot.val()
            })
            return a
        },
        generadocumentopdf(cabecera, detalle) {
            /*   pdfGenera(cabecera.tipocomprobante + '001-' + cabecera.correlativoDocEmitido, moment.unix(cabecera.fecha).format('DD/MM/YYYY hh:mm A'),
                   cabecera.modopago, cabecera.total, cabecera.descuentos, cabecera.cliente, cabecera.dni,
                   cabecera.direccion, detalle, cabecera.hash, '')*/
        },
        snack(text) {
            this.snackbar = true
            this.text = text
        },

    }

}
</script>