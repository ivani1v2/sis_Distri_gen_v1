<template>
    <div class="mb-6 pa-4 mt-3">
        <v-row class="text-center mt-n5">
            <v-col cols="12">
                <h3>GUIAS REMISION REMITENTE</h3>
            </v-col>
        </v-row>
        <v-row class="mt-n4">
            <v-col cols="6">
                <v-text-field type="date" outlined dense v-model="date1" label="INICIO"></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-text-field type="date" outlined dense v-model="date2" label="FIN"></v-text-field>
            </v-col>

        </v-row>
        <v-row class="mt-n9 text-center">
            <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mb-n10' : ''">
                <v-text-field outlined dense v-model="busca_doc" label="Busca Doc"></v-text-field>
            </v-col>
            <v-col cols="6" sm="4">
                <v-btn block elevation="3" color="info" @click="filtrar()" small>
                    <v-icon left>
                        mdi-filter
                    </v-icon>Filtra
                </v-btn>
            </v-col>
            <v-col cols="6" sm="4">
                <v-btn block elevation="3" color="success" @click="ir_nuevo()" small>
                    <v-icon left>
                        mdi-plus
                    </v-icon>Nueva Guia
                </v-btn>
            </v-col>
        </v-row>
        <v-card class="mt-3">
            <v-simple-table fixed-header height="70vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Id
                            </th>
                            <th class="text-left">
                                Fecha Emision
                            </th>
                            <th class="text-left">
                                Destinatario
                            </th>
                            <th class="text-left">
                                Destino
                            </th>
                            <th class="text-left">
                                Estado
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td>{{ item.id }}</td>
                            <td>{{ conviertefecha(item.fecha_emision) }}</td>
                            <td>{{ item.razonsocial_destinatario }}</td>
                            <td>{{ item.dir_destino }}</td>
                            <td>
                                <v-icon :color="item.color" @click.prevent="abre_gestion(item)">mdi-circle</v-icon>
                            </td>
                            <td>
                                <v-row no-gutters>
                                    <v-col cols="6">
                                        <v-icon color="green" @click.prevent="abre_visualizacion(item)">mdi-eye</v-icon>
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
        <v-dialog v-model="dialogo_detalle" max-width="1050px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_detalle = !dialogo_detalle">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <h4>Correlativo : {{ lista_productos.id }} </h4>
                <h6>Destinatario : {{ lista_productos.razonsocial_destinatario }} </h6>
                <h6>Direccion Origen : {{ lista_productos.dir_origen }} </h6>
                <h6>Direccion Destino : {{ lista_productos.dir_destino }} </h6>
                <h6>Fecha Emision : {{ conviertefecha(lista_productos.fecha_emision) }} </h6>
                <h6>Fecha Transporte : {{ conviertefecha(lista_productos.fecha_traslado) }} </h6>
                <v-simple-table dark fixed-header height="55vh" dense>
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
                                    Cantidad
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in lista_productos.data" :key="item.id">
                                <td>{{ item.descripcion }}</td>
                                <td>{{ item.medida }}</td>
                                <td width="100">{{ item.cantidad }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

            </v-card>

        </v-dialog>

        <v-dialog v-model="dial_gestion" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_gestion = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-2">
                <v-card-text>
                    <span class="red--text">RESPUESTA SUNAT:</span> {{ item_selecto.estado }} - Ticket: {{
                    item_selecto.num_ticket
                }}
                    <p class="red--text" v-if="item_selecto.mensaje_sunat != undefined">{{ item_selecto.mensaje_sunat
                        }}</p>

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
                        <v-card @click.prevent="consultar()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/sunat.png"></v-img>
                                <h5 block class="text-center">Consulta Sunat</h5>
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
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="reenvia()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/reenvia.png"></v-img>
                                <h5 block class="text-center">Reenvia Sunat</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_imprime" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_imprime = !dialogo_imprime">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense justify="center">
                    <v-col cols="6">
                        <v-card @click.prevent="imprime('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="imprime('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="imprime('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
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
    allGuiaremision,
    editaGuiaremision
} from '../../db'
import moment from 'moment'
import store from '@/store/index'
import {
    descargaXML,
    descargaCDR,
    guia_remision
} from '../../servidorsunat'
import {
    generaGuia
} from '../../pdf_guia'
import {
    consula_guia
} from '../../servidorsunat'
export default {
    data: () => ({
        date1: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        desserts: [],
        dialogo_detalle: false,
        dialogo_imprime: false,
        dial_gestion: false,
        lista_productos: [],
        observacion: '',
        busca_doc: '',
        item_selecto: ''
    }),
    created() {
        this.filtrar()
    },

    computed: {
        listafiltrada() {
            return this.desserts.reverse()
        }
    },
    methods: {
        descargaXML() {
            console.log(this.item_selecto)
            var tipodoc = this.item_selecto.tipo_comprobante
            var serie = this.item_selecto.serie

            console.log(store.state.baseDatos.ruc, tipodoc, serie, this.item_selecto.correlativo)
            descargaXML(store.state.baseDatos.ruc, tipodoc, serie, this.item_selecto.correlativo)
        },
        descargaCDR() {
            var tipodoc = this.item_selecto.tipo_comprobante
            var serie = this.item_selecto.serie
            descargaCDR(store.state.baseDatos.ruc, tipodoc, serie, this.item_selecto.correlativo)
        },
        async bajaC() {
            if (confirm('seguro de anular?')) {
                store.commit("dialogoprogress")
                await editaGuiaremision(this.item_selecto.id, 'estado', 'anulado')
                store.commit("dialogoprogress")
                this.dial_gestion = false
                this.filtrar()
            }
        },
        async abre_gestion(val) {
            console.log(val)
            this.item_selecto = val
            this.dial_gestion = true
        },
        async consultar() {
            store.commit("dialogoprogress")
            await consula_guia(this.item_selecto)
            this.dial_gestion = false
            store.commit("dialogoprogress")
            this.filtrar()
        },
        async reenvia() {
            if (confirm('SEGURO DE REENVIAR?')) {
                store.commit("dialogoprogress")
                await guia_remision(this.item_selecto, this.item_selecto.data)
                this.dial_gestion = false
                store.commit("dialogoprogress")
                this.filtrar()
            }
        },
        async filtrar() {
            store.commit("dialogoprogress")
            var array = []
            var snapshot = await allGuiaremision()
                .orderByChild('fecha_emision')
                .startAt(moment(String(this.date1)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).once('value')
            if (snapshot.exists()) {
                snapshot.forEach((item) => {
                    var data = item.val()
                    if (data.estado == 'anulado' || data.estado == 'error') {
                        data.color = '#FF0000'
                    }
                    if (data.estado == 'aceptado') {
                        data.color = '#FFB200'
                    }
                    if (data.estado == 'aprobado') {
                        data.color = '#46FF00'
                    }

                    if (data.tipo_comprobante == '09') {
                        array.push(data)
                    }

                })
            }
            store.commit("dialogoprogress")
            this.desserts = array
        },
        abre_visualizacion(data) {
            this.observacion = data.observacion
            this.lista_productos = data
            this.dialogo_detalle = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        verPDF(item) {
            this.item_selecto = item
            this.dialogo_imprime = true
        },
        imprime(medida) {
            generaGuia(this.item_selecto, medida)
            this.dialogo_imprime = false
        },
        ir_nuevo() {
            if (store.state.esmovil) {
                this.$router.push({
                    path: '/gr_movil'
                })
            } else {
                this.$router.push({
                    path: '/gr_remitente'
                })
            }
        },

    }
}
</script>
