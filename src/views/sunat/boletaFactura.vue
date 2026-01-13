<template>
    <div class="mb-6 mt-1 pa-2">

        <v-row dense>
            <v-col cols="6" sm="4">
                <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio"></v-text-field>
            </v-col>
            <v-col cols="6" sm="4">
                <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? '' : ''">
                <v-text-field class="mx-1" outlined dense v-model="num_doc" label="Busca Documento"
                    append-icon="mdi-magnify" @click:append="busca()" :prepend-inner-icon="tipo_doc"
                    @click:prepend-inner="cambia_doc()" @keyup.enter="busca()"></v-text-field>
            </v-col>
        </v-row>
        <v-btn color="success" v-if="false" @click='modificafechas()'>text</v-btn>
        <v-row class="mt-n8">
            <v-col cols="5" v-if="$store.state.esmovil">
                <h4 class="text-center"> Boletas:  {{moneda}} {{ sumaventas().boleta }}</h4>
                <h4 class="text-center"> Facturas: {{moneda}} {{ sumaventas().factura }}</h4>
            </v-col>
            <v-col cols="5" v-if="!$store.state.esmovil">
                <h4 class="text-center"> Boletas: {{moneda}} {{ sumaventas().boleta }}</h4>
            </v-col>
            <v-col cols="5" v-if="!$store.state.esmovil">
                <h4 class="text-center"> Facturas:  {{moneda}} {{ sumaventas().factura }}</h4>
            </v-col>
            <v-col cols="6" sm="2" md="2">
                <v-menu offset-y block>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn x-small color="primary" block dark v-bind="attrs" v-on="on">
                            Opciones
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item @click="masivo_xml()">
                            <v-list-item-title>Masivo XML</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>

            </v-col>
        </v-row>

        <v-simple-table fixed-header height="70vh" dense>
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
                        <td style="font-size:75%;" v-if="!$store.state.esmovil">{{ item.dni + ' - ' + item.cliente }}
                        </td>
                        <td style="font-size:75%;">{{ conviertefecha(item.fecha) }}</td>
                        <td>
                            <v-icon @click="consultaApisunat(item)" :color="item.color">mdi-circle</v-icon>
                        </td>
                        <td style="font-size:75%;"><strong class="">{{ item.moneda || 'S/' }}</strong>{{
                            redondear(item.total) }}
                        </td>
                        <td width="120">
                            <v-row>
                                <v-col cols="4">
                                    <v-icon color="green" @click.prevent="ejecutaConsolida(item)">mdi-eye</v-icon>
                                </v-col>
                                <v-col cols="4">
                                    <v-icon color="orange" @click.prevent="consultaApisunat(item)">mdi-cog</v-icon>
                                </v-col>
                                <v-col cols="4" v-if="!$store.state.esmovil">
                                    <v-icon color="red"
                                        @click.prevent="imprime(item)">mdi-text-box-search-outline</v-icon>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>

        <v-dialog v-model="dialog" max-width="650px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="8">
                        <p style="font-size:80%;"> Doc. N° : {{ seleccionado.numeracion }}</p>
                        <p v-if="pagoConMonto" style="font-size:80%;" class="mt-n4">
                            Pago : {{ pagoConMonto.nombre }} {{ pagoConMonto.monto }}
                        </p>
                        <p style="font-size:80%;" class="mt-n4 mb-1"> Modo : {{ seleccionado.forma_pago }}</p>
                    </v-col>
                    <v-col cols="4">
                        <v-card @click.prevent="selecciona_item()">
                            <v-container>
                                <v-img class="mx-auto mt-n2" height="30" width="30" src="/disc.png"></v-img>
                                <h6 block class="text-center mb-n2">Imprime</h6>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
                <v-simple-table dark fixed-header max-width="68vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Cant.
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in arrayConsolidar" :key="item.id" class="">
                                <td>{{ item.nombre }} - {{moneda}}{{ item.precioedita }} x {{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td v-if="item.operacion == 'GRATUITA'" class="red--text">{{ seleccionado.moneda }}0.00
                                </td>
                                <td v-else>{{ seleccionado.moneda }} {{ redondear(item.precioedita * item.cantidad) }}
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>
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
                        <v-card @click.prevent="descargaXMLs(seleccionado)">
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
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="convertir()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/convertir.png"></v-img>
                                <h5 block class="text-center">Convertir</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="nota_cred()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/nota_credito.png"></v-img>
                                <h5 block class="text-center">Nota de Credito</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-card @click.prevent="guia_rem()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/pdf.png"></v-img>
                                <h5 block class="text-center">GUIA REM</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>

        <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />

        <notas v-if="dial_nota" :items="data_nota_items" :cabecera="data_cabecera_n" @cierra="dial_nota = false" />
        <dial_convertir v-if="dial_convertir" :cabecera="seleccionado" :items="items_convertir"
            @cierra="dial_convertir = false, busca()" />
    </div>
</template>

<script>
import dial_convertir from '@/views/sunat/convertir'
import {
    allCabecera,
    consultaDetalle,
    grabaCabecera,
    grabaconsultacomprobante,
    grabaDatoC,
    consulta_Cabecera,
    editaMontura
} from '../../db'
import store from '@/store/index'
import imprime from '@/components/dialogos/dialog_imprime'
import {
    ejecutaresumen
} from '../../resumenes'
import moment from 'moment'
import {
    enviaDocumentoApiSunat,
    descargaXML,
    descargaCDR,
    consultasunat
} from '../../servidorsunat'
import notas from './dialogos/dialogo_Nota'
import {
    modifica_stock_array
} from '../../control_stock'
export default {
    components: {
        imprime,
        dial_convertir,
        notas
    },

    data: () => ({
        dial_nota: false,
        data_nota_items: [],
        data_cabecera_n: [],
        dial_convertir: false,
        dialogocomprobante: false,
        dialogoprogress: false,
        genera_pdf: false,
        documento: '',
        desserts: [],
        documentoEnvio: '',
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        rechazados: 0,
        img: '',
        error: '',
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'B',
        items_convertir: [],
        moneda: 'S/'
    }),

    computed: {
        listafiltrada() {
            this.desserts.reverse()
            return this.desserts.filter((item) => (item.numeracion)
                .toLowerCase().includes(this.num_doc.toLowerCase()))
        },
        pagoConMonto() {
            const sel = this.seleccionado || {}
            const pagos = sel.modopago
            if (!Array.isArray(pagos)) return null
            return pagos.find(p => p && p.monto && Number(p.monto) > 0) || null

        },
    },
    created() {
          this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        this.busca()
    },
    methods: {

        async masivo_xml() {
            if (this.listafiltrada == '') {
                alert('Debe tener documentos listados primero')
                return
            }
            store.commit("dialogoprogress")
            for (var i = 0; i < this.listafiltrada.length; i++) {
                var data = this.listafiltrada[i]
                await this.descargaXMLs(data)
            }
            store.commit("dialogoprogress")
        },
        async convertir() {
            var array = []
            var data = this.seleccionado
            var snapshot = await consultaDetalle(data.numeracion).once("value")
            snapshot.forEach((item) => {
                array.push(item.val())
            })
            this.items_convertir = array
            this.dialogocomprobante = false
            this.dial_convertir = true
        },
        selecciona_item() {
            this.dialog = false
            this.genera_pdf = true
        },
        imprime(val) {
            this.seleccionado = val
            this.genera_pdf = true
        },
        consultaApisunat(item) {
            console.log(item)
            store.commit("dialogoprogress")
            this.seleccionado = item
            this.arrayConsolidar = []
            consultaDetalle(item.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                store.commit("dialogoprogress")
                this.dialogocomprobante = true
            })
        },
        comparafecha(date) {
            var hoy = moment(String(new Date())).add(-50, 'd').format('YYYY-MM-DD')
            var fecha = moment.unix(date).format('YYYY-MM-DD')
            if (moment(fecha).isAfter(hoy)) {
                return true
            } else {
                return false
            }
        },
        reenvia() {
            var cabecera = this.seleccionado
            if (this.comparafecha(cabecera.fecha)) {
                store.commit("dialogoprogress", 1)
                var items = this.arrayConsolidar
                grabaDatoC(cabecera.numeracion, "automata", '')
                enviaDocumentoApiSunat(cabecera, items).then(r => {
                    store.commit('dialogosnackbar', r.data)
                    store.commit("dialogoprogress", 1)
                    this.dialogocomprobante = false
                    this.busca()
                })
            } else {
                store.commit('dialogosnackbar', 'FECHA EXCEDE EL LIMITE PERMITIDO')
            }
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        sumaventas() {
            var array = {}
            var ventaboleta = 0
            var ventafactura = 0
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].estado == 'baja') {
                    this.desserts[i].total = 0
                }
                if (this.desserts[i].tipocomprobante == 'B') {
                    ventaboleta = ventaboleta + parseFloat(this.desserts[i].total)
                }
                if (this.desserts[i].tipocomprobante == 'F') {
                    ventafactura = ventafactura + parseFloat(this.desserts[i].total)
                }
            }

            array = {
                boleta: this.redondear(ventaboleta),
                factura: this.redondear(ventafactura),
            }
            return array
        },
        ejecutaConsolida(value) {
            store.commit("dialogoprogress", 1)
            this.arrayConsolidar = []
            this.seleccionado = value
            consultaDetalle(value.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                store.commit("dialogoprogress", 1)
                this.dialog = true
            })
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        },
        async descargaXMLs(data) {
            if (data.tipocomprobante == "F") {
                var tipodoc = '01'
                var serie = data.serie
            } else {
                var tipodoc = '03'
                var serie = data.serie
            }
            await descargaXML(store.state.baseDatos.ruc, tipodoc, serie, data.correlativoDocEmitido)
        },
        descargaCDR() {
            if (this.seleccionado.tipocomprobante == "F") {
                var tipodoc = '01'
                var serie = this.seleccionado.serie
            } else {
                var tipodoc = '03'
                var serie = this.seleccionado.serie
            }
            descargaCDR(store.state.baseDatos.ruc, tipodoc, serie, this.seleccionado.correlativoDocEmitido)
        },
        consultar() {
            store.commit("dialogoprogress", 1)
            if (this.seleccionado.tipocomprobante == "F") {
                var tipodoc = '01'
                var serie = this.seleccionado.serie
            } else {
                var tipodoc = '03'
                var serie = this.seleccionado.serie
            }
            consultasunat(tipodoc, serie,
                this.seleccionado.correlativoDocEmitido).then((r) => {
                    store.commit('dialogosnackbar', r)

                    if (r.data == '0002') {
                        grabaconsultacomprobante(this.seleccionado.numeracion, "RECHAZADO", r.hash)
                        grabaDatoC(this.seleccionado.numeracion, "automata", '0002')
                        this.dialogocomprobante = false
                    }
                    if (r.data == '0001') {
                        grabaconsultacomprobante(this.seleccionado.numeracion, "aprobado", r.hash)
                        grabaDatoC(this.seleccionado.numeracion, "automata", '0001')
                        this.dialogocomprobante = false
                    } else {
                        grabaconsultacomprobante(this.seleccionado.numeracion, "error", r.hash)
                        this.dialogocomprobante = false
                    }
                    this.busca()
                    store.commit("dialogoprogress", 1)
                })
        },
        editacomprobante() {
            for (var i = 0; i < this.desserts.length; i++) {
                //grabaDatoC(this.desserts[i].numeracion,"automata","")
                // grabaconsultacomprobante(this.desserts[i].numeracion,"rechazado","El comprobante fue registrado previamente con otros datos - Detalle: xxx.xxx.xxx value='ticket: 202208635648110 error: El comprobante B001-00000094 fue informado anteriormente'")
                console.log(this.desserts[i].numeracion)
                if (this.desserts[i].tipocomprobante == "F") {
                    var tipodoc = '01'
                    var serie = this.desserts[i].serie
                } else {
                    var tipodoc = '03'
                    var serie = this.desserts[i].serie
                }
                this.consultamasiva(tipodoc, serie, this.desserts[i], this.desserts.length - 1, i)

            }
        },
        consultamasiva(tipodoc, serie, array, tam, pos) {
            consultasunat(tipodoc, serie,
                array.numeracion.substring(1)).then((r) => {
                    console.log(r)
                    // store.commit('dialogosnackbar',r.data)
                    if (r.data == '0001') {
                        grabaDatoC(array.numeracion, "automata", '0001')
                        grabaconsultacomprobante(array.numeracion, "aprobado", r.hash)
                        //    this.dialogocomprobante=false
                    } else {
                        grabaconsultacomprobante(array.numeracion, "RECHAZADO", r.hash)
                        //  this.dialogocomprobante=false
                    }
                    if (tam == pos) {
                        //store.commit("dialogoprogress")
                    }
                    //  this.dialogoprogress=false   
                })
        },
        async bajaC() {
            if (!confirm('esta seguro de querer anular?')) {
                return
            }
            var array = this.seleccionado
            var lista_pro = []
            if (!this.seleccionado.regesa_stock) {
                if (confirm('Desea regresar stock de este comprobante?')) {
                    await grabaCabecera(this.seleccionado.numeracion + '/regesa_stock', true)
                    var snap = await consultaDetalle(this.seleccionado.numeracion).once("value")
                    await modifica_stock_array('SUMA', snap.val())
                }
            }
            store.commit("dialogoprogress", 1)
            grabaDatoC(array.numeracion, "automata", "")
            await ejecutaresumen(array)
            this.dialogocomprobante = false
            store.commit("dialogoprogress", 1)
            this.busca()

        },
        async modificafechas() {
            for (var i = 0; i < this.desserts.length; i++) {
                console.log(this.desserts[i].numeracion)
                grabaDatoC(this.desserts[i].numeracion, "automata", '')
         //         await grabaDatoC(this.desserts[i].numeracion, "fecha", 1766442165)
           //     grabaDatoC(this.desserts[i].numeracion, "vencimientoDoc", 1766442165)
                // if (this.desserts[i].estado == 'RECHAZADO') {
                //console.log("rechazado")
                // if (this.desserts[i].tipocomprobante == 'F') {
                // grabaDatoC(this.desserts[i].numeracion, "serie", 'FD02')
                // grabaDatoC(this.desserts[i].numeracion, "automata", '')
                // grabaDatoC(this.desserts[i].numeracion, "vencimientoDoc", 1726695077)
                //  }
                //   }
            }
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
                            data.color = this.asigna_color_doc(data),
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
                            if (data.tipocomprobante != 'T') {
                                data.color = this.asigna_color_doc(data),
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
        async guia_rem() {
            store.commit("dialogoprogress", 1)
            const snapshot = await consultaDetalle(this.seleccionado.numeracion).once("value");
            var array = {
                arrayCabecera: this.seleccionado,
                array_item: snapshot.val()
            }
            store.commit("array_guia", array)
            if (store.state.esmovil) {
                this.$router.push({
                    path: '/gr_movil'
                })
            } else {
                this.$router.push({
                    path: '/gr_remitente'
                })
            }
            store.commit("dialogoprogress", 1)
        },
        async nota_cred() {
            store.commit("dialogoprogress", 1)
            this.data_cabecera_n = this.seleccionado;
            this.arrayConsolidar = [];
            const snapshot = await consultaDetalle(this.seleccionado.numeracion).once("value");
            this.data_nota_items = snapshot.val();
            this.dial_nota = true;
            store.commit("dialogoprogress", 1)
        }

    }
}
</script>
