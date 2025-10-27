<template>
    <v-dialog v-model="dial" max-width="1100px">
        <div>
            <v-system-bar window dark>
                <v-icon color="red" large @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h5></h5>
            </v-system-bar>
        </div>
        <v-card class="pa-3">            
            <v-card class="mt-5">
                <v-card class="mt-n2 pa-2 mb-2">
                    <v-row class="mt-n2" dense>
                        <v-col cols="6" md="2">
                            <v-select style="font-size:85%;" outlined dense v-model="doc_fact" :items="documentos"
                                menu-props="auto" hide-details label="Tipo Doc"></v-select>
                        </v-col>
                        <v-col cols="6" md="4">
                            <v-text-field style="font-size:85%;" outlined type="number" dense v-model="num_fact"
                                label="Numero" append-icon="mdi-magnify" @click:append="BuscarDocumento1()"
                                @keyup.enter="BuscarDocumento1()"></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                            <v-text-field style="font-size:85%;" outlined dense v-model="nom_fact" label="Nombre"
                                append-icon="mdi-eye" @click:append="abre_cliente()"></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n6'">
                            <v-text-field style="font-size:85%;" outlined dense v-model="dir_fact"
                                label="Direccion"></v-text-field>
                        </v-col>
                        <v-col :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n6'">
                            <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                        </v-col>
                    </v-row>
                </v-card>
                <v-simple-table dense fixed-header height="35vh">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Precio
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
                            <tr v-for="item in listafiltrada" :key="item.uuid">
                                <td style="font-size:85%;" v-if="item.operacion == 'GRATUITA'">{{ item.nombre }} -
                                    <strong class="red--text">OBSEQUIO</strong>
                                    <strong class="red--text" v-if="item.od && !item.oi"> - OD</strong>
                                    <strong class="red--text" v-if="item.oi && !item.od"> - OI</strong>
                                </td>
                                <td style="font-size:85%;" v-else>{{ item.nombre }}
                                    <strong class="red--text" v-if="item.od && !item.oi"> - OD</strong>
                                    <strong class="red--text" v-if="item.oi && !item.od"> - OI</strong>
                                </td>
                                <td style="font-size:85%;">S/.{{ item.precio }}</td>
                                <td style="font-size:85%;">{{ item.cantidad }}</td>
                                <td style="font-size:85%;">S/{{ item.precio * item.cantidad }}</td>
                            </tr>
                        </tbody>
                    </template>

                </v-simple-table>

            </v-card>
            <v-row class="pa-3">
                <v-col cols="6">
                    <v-btn color="warning" block @click="genera_comprobante(1)"
                        :disabled='doc_fact == "RUC"'>BOLETA</v-btn>
                </v-col>
                <v-col cols="6">
                    <v-btn color="info" block @click="genera_comprobante(2)"
                        :disabled='doc_fact != "RUC"'>FACTURA</v-btn>
                </v-col>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>

import {
    busca_pedido,
    grabaDetalle,
    grabaCabecera,
    grabaEstadoComprobante
} from '../../db'
import moment from 'moment'
import { enviaDocumentoApiSunat } from '../../servidorsunat'
import store from '@/store/index'
import axios from "axios"
import {
    obten_contador,
    sumarCorrelativo
} from '../../contadores'
export default {
    name: 'caja',

    props: {
        cabecera: '',
        items: ''
    },
    data() {
        return {
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            dial: false,
            listaproductos: [],
            doc_fact: 'DNI',
            documentos: [
                'DNI',
                'RUC',
                'Pasaporte',
                'Carnet de Extranjeria'
            ],
            num_fact: '',
            nom_fact: '',
            dir_fact: '',
            telf_fact: '',
        }
    },
    created() {
        this.listaproductos = this.items
        this.nom_fact = this.cabecera.cliente
        this.num_fact = this.cabecera.dni
        this.dial = true
    },
    computed: {
        listafiltrada() {
            return this.listaproductos.reverse()
        }
    },
    methods: {
        cierra() {
            this.$emit('cierra', false)
        },
        async genera_comprobante(val) {

            var cabecera = this.cabecera
            var items = this.listaproductos
            cabecera.id_anterior = cabecera.numeracion
            cabecera.fecha = moment().unix()
            cabecera.vencimientoDoc = cabecera.fecha
            if (this.nombreCompleto == '') {
                this.nombreCompleto = 'CLIENTES VARIOS'
            }
            if (this.numero == '') {
                this.numero = '00000000'
            }
            if (val == 1) {
                cabecera.tipocomprobante = 'B'
            } else {
                cabecera.tipocomprobante = 'F'
            }

            if (this.doc_fact == "DNI") {
                var doccliente = "1" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.doc_fact == "RUC") {
                var doccliente = "6" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.doc_fact == "Pasaporte") {
                var doccliente = "7" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.doc_fact == "Carnet de Extranjeria") {
                var doccliente = "4" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            store.commit("dialogoprogress", 1)

            if (cabecera.tipocomprobante == 'B') {
                var correlativo = await obten_contador('ordenboleta')
                cabecera.serie = store.state.seriesdocumentos.boleta
                cabecera.cod_comprobante = '03'
                cabecera.dni = this.num_fact
                cabecera.cliente = this.nom_fact
                cabecera.direccion = this.dir_fact
            }
            if (cabecera.tipocomprobante == 'F') {
                if (this.num_fact.length != 11) {
                    alert('DOCUMENTO NO CUMPLE EL FORMATO')
                    store.commit("dialogoprogress", 1)
                    return
                }
                var correlativo = await obten_contador('ordenfactura')
                cabecera.serie = store.state.seriesdocumentos.factura
                cabecera.cod_comprobante = '01'
                cabecera.doc_fact = this.doc_fact
                cabecera.num_fact = this.num_fact
                cabecera.nom_fact = this.nom_fact
                cabecera.dir_fact = this.dir_fact
            }
            var fecha = moment(String(this.date)) / 1000
            cabecera.fecha = fecha
            cabecera.vencimientoDoc = fecha
            cabecera.tipoDocumento = this.doc_fact
            cabecera.cod_tipoDocumento = doccliente
            cabecera.numeracion = cabecera.serie + '-' + correlativo
            cabecera.correlativoDocEmitido = correlativo
            console.log(cabecera)
            await grabaCabecera(cabecera.numeracion, cabecera)
            await grabaDetalle(cabecera.numeracion, items)
            if (cabecera.tipocomprobante != 'T') {
                enviaDocumentoApiSunat(cabecera, items).then((rrr) => {
                    //console.log(rrr)
                })
            }

            if (cabecera.tipocomprobante == 'B') {
                await sumarCorrelativo('ordenboleta', correlativo)
            }
            if (cabecera.tipocomprobante == 'F') {
                await sumarCorrelativo('ordenfactura', correlativo)
            }
            await grabaEstadoComprobante(cabecera.id_anterior, 'ANULADO', 'ANULADO', 'ANULADO', '')
            store.commit("dialogoprogress", 1)
            this.cierra()
        },
        BuscarDocumento1() {
            if (this.num_fact.length == 11) {
                this.doc_fact = "RUC"
            } else {
                this.doc_fact = "DNI"
            }
            if (this.num_fact != '' && this.doc_fact == "RUC" || this.doc_fact == "DNI" &&
                this.num_fact.length == 8 || this.num_fact.length == 11) {
                store.commit("dialogoprogress", 1)
                this.consultaApiPeru1()
            }
        },
        consultaApiPeru1() {
            var self = this,
                token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            axios
                .get('https://apiperu.dev/api/' + this.doc_fact.toLowerCase() + '/' + this.num_fact, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data,
                    store.commit("dialogoprogress", 1),
                    self.llenardatos1(response.data.data)
                ))
                .catch(error => {
                    store.commit("dialogoprogress", 1),
                        store.commit('dialogosnackbar', 'Documento Invalido')
                })
        },
        llenardatos1(data) {
            if (this.doc_fact == 'DNI') {
                this.nom_fact = data.nombre_completo
                this.dir_fact = data.direccion_completa
            }
            if (this.doc_fact == 'RUC') {
                this.nom_fact = data.nombre_o_razon_social
                this.dir_fact = data.direccion_completa
            }
        },
    }

}
</script>
