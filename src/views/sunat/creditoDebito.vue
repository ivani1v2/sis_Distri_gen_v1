<template>
    <div class="pa-4">
        <v-card>
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

            <v-simple-table fixed-header height="65vh" dense>
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
                            <td>{{ item.numeracion }}</td>
                            <td>{{ item.dni }}-{{ item.cliente }}</td>
                            <td>{{ conviertefecha(item.fecha) }}</td>
                            <td>
                                <v-icon @click="consultar(item)" :color="item.color">mdi-circle</v-icon>
                            </td>
                            <td>S/.{{ item.total - item.descuentos }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="6">
                                        <v-icon color="green"
                                            @click.prevent="ejecutaConsolida(item.numeracion), dialog = true">mdi-eye</v-icon>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-icon color="red"
                                            @click.prevent="verPDF(item)">mdi-text-box-search-outline</v-icon>
                                    </v-col>
                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>
        <v-dialog v-model="dialogocomprobante" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogocomprobante = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-2">
                <v-card-text>
                    <span class="red--text">RESPUESTA SUNAT:</span> {{ seleccionado.mensajeSunat }}
                </v-card-text>
                <v-row dense class="text-center mt-n5">
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="descargaXML()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/xml.png"></v-img>
                                <h5 block class="text-center">XML</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="descargaCDR()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/cdr.png"></v-img>
                                <h5 block class="text-center">CDR</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="consultarapi()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/sunat.png"></v-img>
                                <h5 block class="text-center">Consulta Sunat</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="reenvia()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/reenvia.png"></v-img>
                                <h5 block class="text-center">Reenvia Sunat</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="bajaC()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/anular.png"></v-img>
                                <h5 block class="text-center">ANULAR</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import {
    ejecutaresumen,
    consuta_ticket
} from '../../resumenes'
import {
    allCabeceraNCD,
    consultaDetalleNCD,
    grabaconsultacomprobanteNC,
    consulta_CabeceraNCD
} from '../../db'
import {
    envioNCredito,
    consultasunat,
    descargaXML,
    descargaCDR
} from '../../servidorsunat'

import moment from 'moment'

import {
    pdfGenera
} from '../../pdf_notaCD'
import store from '@/store/index'
export default {
    data: () => ({
        dialogoprogress: false,
        ordenresumen: '',
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        desserts: [],
        dialogocomprobante: false,
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'BN'
    }),
    created() {
        this.busca()
    },
    computed: {
        listafiltrada() {
            return this.desserts.filter((item) => (item.numeracion)
                .toLowerCase().includes(this.num_doc.toLowerCase()))
        }
    },
    methods: {

        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        router(view) {
            this.$router.push({
                name: view
            })
        },
        consultar(item) {
            this.seleccionado = item
            this.dialogocomprobante = true
        },
        consultarapi() {
            store.commit("dialogoprogress")
            var item = this.seleccionado
            this.dialogoprogress = true
            if (item.tipocomprobante == "NC") {
                var tipodoc = '07'
                var serie = item.serie
            } else {
                var tipodoc = '07'
                var serie = item.serie
            }
            consultasunat(tipodoc, serie,
                item.correlativo).then((r) => {
                    if (r.data == '0001') {
                        grabaconsultacomprobanteNC(item.numeracion, "aprobado", r.hash)
                    } else {
                        grabaconsultacomprobanteNC(item.numeracion, "error", r.hash)
                    }
                    this.busca()
                    this.dialogoprogress = false
                    this.dialogocomprobante = false
                    store.commit("dialogoprogress")
                })
        },
        async reenvia() {
            store.commit("dialogoprogress")
            var snap = await consultaDetalleNCD(this.seleccionado.numeracion).once("value")
            await envioNCredito(this.seleccionado, snap.val())
            this.dialogocomprobante = false
            this.busca()
            store.commit("dialogoprogress")
        },
        verPDF(item) {

            consultaDetalleNCD(item.numeracion).once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    //    console.log(snapshot.val())
                    pdfGenera(snapshot.val(), item, store.state.configImpresora.tamano)
                }
            })
        },
        descargaXML() {
            if (this.seleccionado.tipocomprobante == "NC") {
                var tipodoc = '07'
                var serie = this.seleccionado.serie
            }
            descargaXML(store.state.baseDatos.ruc, tipodoc, serie, this.seleccionado.correlativo)
        },
        descargaCDR() {
            if (this.seleccionado.tipocomprobante == "NC") {
                var tipodoc = '07'
                var serie = this.seleccionado.serie
            }
            descargaCDR(store.state.baseDatos.ruc, tipodoc, serie, this.seleccionado.correlativo)
        },
        busca() {
            var array = []
            this.desserts = []
            if (this.num_doc != '') {
                var data = this.tipo_doc + store.state.seriesdocumentos.notacredito + (this.num_doc).toString().padStart(4, 0)
                consulta_CabeceraNCD(data)
                    .once("value").then((snapshot) => {
                        if (snapshot.exists()) {
                            var data = snapshot.val()
                            data.color = this.asigna_color_doc(data),
                                this.desserts.push(data)
                        } else {
                            store.commit('dialogosnackbar', 'Comprobante no existe')
                        }
                    })
            } else {
                allCabeceraNCD()
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
                    })
            }
        },
        cambia_doc() {
            if (this.tipo_doc == 'BN') {
                this.tipo_doc = 'FN'
            } else {
                this.tipo_doc = 'BN'
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
        async bajaC() {
            if (!confirm('esta seguro de querer anular?')) {
                return
            }
            var array = this.seleccionado
            var lista_pro = []
            /*if (!this.seleccionado.regesa_stock) {
                await grabaCabecera(this.seleccionado.numeracion + '/regesa_stock', true)
                var snap = await consultaDetalle(this.seleccionado.numeracion).once("value")
                await modifica_stock_array('SUMA', snap.val())
            }*/
            store.commit("dialogoprogress", 1)
            // grabaDatoC(array.numeracion, "automata", "")
            //consuta_ticket()
            await ejecutaresumen(array)
            this.dialogocomprobante = false
            store.commit("dialogoprogress", 1)
            this.busca()

        },
    }
}
</script>

<style></style>
