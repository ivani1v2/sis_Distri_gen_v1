<template>
    <v-dialog v-model="$store.state.dialogo_cobrar" class="" max-width="600" persistent @keydown.enter="avanza()"
        transition="dialog-bottom-transition">
        <div>
            <v-system-bar window dark>
                <v-icon large @click="$store.commit('dialogo_cobrar')" color="red">mdi-close</v-icon>
                {{ obten_correlativo }}

                <v-spacer></v-spacer>
                A pagar : S/.{{ total_suma }}
            </v-system-bar>
        </div>
        <v-card class="pa-3">

            <v-radio-group class="mt-n1" v-model="tipocomprobante" row dense>
                <v-radio label="NOTA" value="T"></v-radio>
                <v-radio label="BOLETA" value="B"></v-radio>
                <v-radio label="FACTURA" value="F"></v-radio>
            </v-radio-group>

            <template v-if="$store.state.configuracion.flujocaja">
                <v-stepper v-model="e1">
                    <v-stepper-header>
                        <v-stepper-step :complete="e1 > 1" step="1">
                            MODO
                        </v-stepper-step>

                        <v-divider></v-divider>

                        <v-stepper-step :complete="e1 > 2" step="2">
                            PAGO
                        </v-stepper-step>

                        <v-divider></v-divider>

                        <v-stepper-step step="3">
                            FINALIZAR
                        </v-stepper-step>
                    </v-stepper-header>

                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <v-card class="mb-1" height="200px">
                                <v-simple-table fixed-header height="200px" dense>
                                    <thead>

                                        <tr>
                                            <th class="text-left">
                                                modo
                                            </th>
                                            <th class="text-left">
                                                monto
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in modopagos" :key="item.modo">
                                            <td colspan="2">
                                                <v-row class="mt-1" dense>
                                                    <v-col cols="6">
                                                        <v-select v-model="item.modo" :items="$store.state.modopagos"
                                                            dense></v-select>
                                                    </v-col>
                                                    <v-col cols="6">
                                                        <v-text-field type="number" v-model="item.monto" dense
                                                            @keyup.enter="e1 = 2"></v-text-field>
                                                    </v-col>
                                                </v-row>
                                            </td>
                                        </tr>
                                    </tbody>

                                    <v-row class="mt-1 text-center">
                                        <v-col cols="6">
                                            <v-icon @click="modopagoDialog()" color="green">mdi-plus</v-icon>
                                        </v-col>
                                        <v-col cols="6">
                                            <v-icon @click="eliminamodopago()" color="red">mdi-minus</v-icon>
                                        </v-col>
                                    </v-row>

                                </v-simple-table>

                            </v-card>

                            <v-card-actions>
                                <v-btn @click="dialogCobra = !dialogCobra" text color="error">
                                    CERRAR
                                </v-btn>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="paso1()">
                                    CONTINUAR
                                </v-btn>
                            </v-card-actions>

                        </v-stepper-content>

                        <v-stepper-content step="2">
                            <v-card height="250px" class="mb-1">
                                <v-card-title primary-title>
                                    COBRAR = S/.{{ calculavuelto }}
                                </v-card-title>
                                <v-card-text>
                                    <v-text-field id="campo" v-model="paravuelto" dense label="Vuelto de: " type="number"
                                        outlined :autofocus="focusvuelto"></v-text-field>
                                </v-card-text>
                                <v-card-title style="font-size:24px ;" class="mt-n8 red--text">
                                    {{ cuadravuelto }}
                                </v-card-title>

                            </v-card>
                            <v-card-actions>
                                <v-btn @click="e1 = 1" text color="error">
                                    ANTERIOR
                                </v-btn>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="e1 = 3">
                                    CONTINUAR
                                </v-btn>
                            </v-card-actions>
                        </v-stepper-content>

                        <v-stepper-content step="3">
                            <v-card height="250px">
                                <v-row class="mt-1" dense>
                                    <v-col cols="4" xs="4">
                                        <v-select dense v-model="documento" :items="documentos" menu-props="auto"
                                            hide-details label="Tipo Doc"></v-select>
                                    </v-col>
                                    <v-col cols="8" xs="8">
                                        <v-text-field type="number" dense v-model="numero" label="Numero"
                                            append-icon="mdi-magnify" @click:append="BuscarDocumento()"
                                            @keyup.enter="BuscarDocumento()"></v-text-field>
                                    </v-col>

                                </v-row>

                                <v-text-field dense v-model="nombreCompleto" label="Nombres Completos"></v-text-field>
                                <v-text-field dense v-model="direccion" label="Direccion"></v-text-field>
                                <v-text-field v-if="$store.state.configImpresora.placa_cliente" dense
                                    v-model="placa_cliente" label="N° Placa Vehiculo"></v-text-field>
                                <v-text-field v-if="$store.state.configImpresora.refcliente" dense v-model="refcliente"
                                    label="Referencia"></v-text-field>

                                <v-text-field v-if="$store.state.configImpresora.telfcliente" type="number" dense
                                    v-model="telfcliente" label="Telefono"></v-text-field>
                            </v-card>

                            <v-card-actions class="mb-n1">
                                <v-btn v-if="$store.state.configuracion.calvuelto" @click="e1 = 2" text color="error">
                                    ANTERIOR
                                </v-btn>
                                <v-btn v-if="!$store.state.configuracion.calvuelto" @click="e1 = 1" text color="error">
                                    ANTERIOR
                                </v-btn>
                                <v-spacer></v-spacer>
                                <v-btn color="warning" @click="cobroCredito()">
                                    CREDITO
                                </v-btn>
                                <v-btn color="primary" @click="cobrar()">
                                    CONTADO
                                </v-btn>
                            </v-card-actions>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </template>

            <template v-if="!$store.state.configuracion.flujocaja">
                <v-row class="mt-n2" dense>
                    <v-col cols="4" xs="4">
                        <v-select dense v-model="documento" :items="documentos" menu-props="auto" hide-details
                            label="Tipo Doc"></v-select>
                    </v-col>
                    <v-col cols="8" xs="8">
                        <v-text-field dense type="number" v-model="numero" label="Numero" append-icon="mdi-magnify"
                            @click:append="BuscarDocumento()" @keyup.enter="BuscarDocumento()"></v-text-field>
                    </v-col>
                </v-row>
                <v-text-field dense v-model="nombreCompleto" label="Nombres Completos"></v-text-field>
                <v-text-field dense v-model="direccion" label="Direccion"></v-text-field>
                <v-text-field v-if="$store.state.configImpresora.refcliente" dense v-model="refcliente"
                    label="Referencia"></v-text-field>
                <v-text-field type="number" dense v-model="telfcliente" label="Telefono"></v-text-field>
                <v-text-field v-if="$store.state.configuracion.comisiones" append-icon="mdi-magnify"
                    @click:append="BuscarEmpleado()" @keyup.enter="BuscarEmpleado()" dense v-model="empleado"
                    label="Empleado"></v-text-field>
                <v-text-field v-if="$store.state.configuracion.obscomprobante" dense v-model="observacion"
                    label="Observacion"></v-text-field>
                <v-text-field v-if="$store.state.configImpresora.placa_cliente" dense v-model="placa_cliente"
                    label="N° Placa Vehiculo"></v-text-field>
                <v-row class="mx-auto mt-n4">
                    <v-radio-group v-model="radios" row dense>
                        <v-radio v-for="n in $store.state.modopagos" :key="n" :label="n" :value="n"></v-radio>
                    </v-radio-group>
                </v-row>
                <v-card-actions>
                    <v-btn color="warning" @click="cobroCredito()">
                        CREDITO
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="cobrar()">
                        CONTADO
                    </v-btn>
                </v-card-actions>
            </template>

            <v-dialog v-model="dialogocredito" max-width="500px">
                <div>
                    <v-system-bar window dark>
                        <v-icon @click="dialogocredito = !dialogocredito">mdi-close</v-icon>
                        <v-spacer></v-spacer>
                        <v-icon large @click="nuevacuota()" color="green">mdi-plus</v-icon>
                        <v-icon large @click="eliminacuota()" color="red">mdi-minus</v-icon>
                    </v-system-bar>
                </div>
                <v-card class="mb-1" height="350px">
                    <v-simple-table fixed-header height="280px" dense>
                        <thead>

                            <tr>
                                <th class="text-left">
                                    Cuota
                                </th>
                                <th class="text-left">
                                    monto
                                </th>
                                <th class="text-left">
                                    Vence
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in cuotasCredito" :key="item.modo">
                                <td colspan="3">
                                    <v-row class="mt-1" dense>
                                        <v-col cols="4">
                                            <v-text-field disabled type="number" v-model="item.numero" dense></v-text-field>
                                        </v-col>
                                        <v-col cols="4">
                                            <v-text-field type="number" v-model="item.importe" dense></v-text-field>
                                        </v-col>
                                        <v-col cols="4">
                                            <v-text-field type="date" v-model="item.vencimiento" dense></v-text-field>
                                        </v-col>
                                    </v-row>
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="success" @click="finalizacobrocredito()">Finalizar</v-btn>
                    </v-card-actions>

                </v-card>
            </v-dialog>

            <v-dialog v-model="dialogoempleado" max-width="490">
                <div>
                    <v-system-bar window dark>
                        <v-icon @click="dialogoempleado = false">mdi-close</v-icon>
                    </v-system-bar>
                </div>
                <v-card>
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-text-field v-model="buscar" append-icon="mdi-magnify" label="Search" single-line hide-details
                            dense></v-text-field>
                    </v-card-title>

                    <v-simple-table fixed-header height="400px" dense>
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th class="text-left">
                                        NOMBRE
                                    </th>
                                    <th class="text-left">
                                        TELEFONO
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in listafiltradaempleados" :key="item.id" @click="agregaEmpleado(item)">
                                    <td>{{ item.nombre }}</td>
                                    <td>{{ item.telefono }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>

                </v-card>

            </v-dialog>

            <clientes @array="agregacliente($event)" />

        </v-card>
        <v-dialog v-model="genera_pdf" max-width="550" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(genera_pdf = !genera_pdf), limpiacajas()">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <imprime v-if="genera_pdf" :data="seleccionado" @cierra="limpiacajas(), genera_pdf = $event" />
        </v-dialog>
    </v-dialog>
</template>

<script>
import imprime from '@/components/dialogos/dialog_imprime'
import {
    allEmpleados,
    nuevoflujo,
    buscaCliente,
    sumaContador,
    nuevoCliente,
    nuevaCuentaxcobrar,
    grabaPuntosCliente,
    obtenContador,
    grabaCabecera,
    grabaDetalle
} from '../../db'
import {
    sumarCorrelativo
} from '../../genera_comprobante'
import {
    guardaComprobante,
    enviaDocumentoApiSunat
} from '../../servidorsunat'
import {
    modifica_stock_array
} from '../../control_stock'
import moment from 'moment'
import {
    pdfGenera
} from '../../pdf_comprobantes'
import store from '@/store/index'
import axios from "axios"
import clientes from '@/components/dialogos/dialogoClientes'
export default {
    name: 'caja',

    components: {
        clientes,
        imprime
    },

    data() {
        return {
            genera_pdf: false,
            seleccionado: '',
            buscar: '',
            documentos: ['DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',
            tipocomprobante: 'T',
            listaproductos: '',
            numero: '',
            nombreCompleto: '',
            direccion: '',
            telefono: '',
            refcliente: '',
            telfcliente: '',
            observacion: '',
            e1: 1,
            calculavuelto: 0,
            paravuelto: '',
            focusvuelto: true,
            dialogocredito: false,
            cuotasCredito: [],
            modopagos: [],
            dialogoempleado: false,
            empleadoslista: [],
            empleado: '',
            dniempleado: '',
            array_cabecera: [],
            placa_cliente: '',
            contadores: '',
            radios: 'EFECTIVO',
            consulta_cliente: [],
            cliente_selecto: [],
        }
    },

    methods: {
        sumaTotal() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                suma = suma + (this.listaproductos[i].cantidad * this.listaproductos[i].precioedita)
            }
            this.totalDocumento = suma.toFixed(2)
            return suma.toFixed(2)
        },
        sumaDescuentos() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                suma = suma + parseFloat(this.listaproductos[i].preciodescuento)
            }
            this.totalDescuento = this.redondear(suma)
            return this.redondear(suma)
        },
        eliminamodopago() {
            let pos = this.modopagos.pop()
        },
        modopagoDialog() {
            this.modopagos.push({
                modo: 'TARJETA',
                monto: 0
            })
        },
        visualizar() {
            this.array_cabecera.serie = 'XXXX',
                this.array_cabecera.correlativoDocEmitido = '000000',
                this.array_cabecera.tipoDocumento = this.documento
            this.array_cabecera.dni = this.numero
            this.array_cabecera.cliente = this.nombreCompleto
            this.array_cabecera.direccion = this.direccion
            this.array_cabecera.telefono = this.telefono
            this.array_cabecera.observacion = this.observacion
            this.array_cabecera.referenciacliente = this.refcliente
            this.array_cabecera.tipocomprobante = this.tipocomprobante
            var arrayCabecera = this.array_cabecera
            var items = this.listaproductos
            pdfGenera(items, arrayCabecera, '80', 'abre')
        },

        async cobrar() {
            if (this.tipocomprobante == "F" && this.numero.length != 11 ||
                this.tipocomprobante == "F" && this.nombreCompleto == '' ||
                this.documento == 'RUC' && this.numero.length != 11) {
                store.commit('dialogosnackbar', 'DEBE CONSIDERAR DATOS DEL CLIENTE')
            } else {
                store.commit("dialogoprogress")
                if (this.numero != '' && this.nombreCompleto != '') {
                    this.guarda_clientes()
                }
                let snapshot = await obtenContador().once("value")
                var contadores = snapshot.val()
                var auto = ""
                if (this.documento == "DNI") {
                    var doccliente = "1" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                }
                if (this.documento == "RUC") {
                    var doccliente = "6" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                }
                if (this.documento == "Pasaporte") {
                    var doccliente = "7" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                }
                if (this.documento == "Carnet de Extranjeria") {
                    var doccliente = "4" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                }
                if (store.state.configuracion.flujocaja) {
                    var modosdepago = this.modopagos[0].modo
                } else {
                    var modosdepago = this.radios
                }
                if (this.tipocomprobante == "B") { //Catálogo No. 01: Código de Tipo de documento
                    var cod_comprobante = '03' //01-factura -- 03-boleta -- 07-notaCred -- 08-notadebit -- 
                    var serie = store.state.seriesdocumentos.boleta
                    var correlativo = contadores.ordenboleta
                }
                if (this.tipocomprobante == "F") { //Catálogo No. 01: Código de Tipo de documento 
                    var cod_comprobante = '01' //01-factura -- 03-boleta -- 07-notaCred -- 08-notadebit -- 
                    var serie = store.state.seriesdocumentos.factura
                    var correlativo = contadores.ordenfactura
                }
                if (this.tipocomprobante == "T") {
                    var cod_comprobante = '00'
                    var serie = store.state.seriesdocumentos.ticket
                    var correlativo = contadores.ordenticket
                    this.array_cabecera.estado = 'aprobado'
                    auto = "NO"
                }
                if (this.nombreCompleto == '') {
                    this.nombreCompleto = 'CLIENTES VARIOS'
                }
                if (this.numero == '') {
                    this.numero = '00000000'
                    this.documento = "DNI"
                    var doccliente = "1"
                }
                if (store.state.configImpresora.vendedor) {
                    this.array_cabecera.nomempleado = (store.state.permisos.correo).substr(0, store.state.permisos.correo.length - 13)
                    console.log(store.state.permisos.correo)
                }
                this.array_cabecera.serie = serie,
                    this.array_cabecera.correlativoDocEmitido = correlativo,
                    this.array_cabecera.numeracion = this.tipocomprobante + correlativo,
                    this.array_cabecera.tipoDocumento = this.documento
                this.array_cabecera.cod_tipoDocumento = doccliente
                this.array_cabecera.dni = this.numero
                this.array_cabecera.cliente = this.nombreCompleto
                this.array_cabecera.direccion = this.direccion
                this.array_cabecera.telefono = this.telfcliente
                this.array_cabecera.observacion = this.observacion
                this.array_cabecera.referenciacliente = this.refcliente
                this.array_cabecera.tipocomprobante = this.tipocomprobante
                this.array_cabecera.cod_comprobante = cod_comprobante
                this.array_cabecera.automata = auto
                this.array_cabecera.modopago = modosdepago
                this.array_cabecera.placa_cliente = this.placa_cliente
                this.array_cabecera.forma_pago = "Contado"
                this.array_cabecera.cuotas = ''
                var arrayCabecera = this.array_cabecera
                var array_item = this.listaproductos
                store.commit('ultimo_correlativo', this.array_cabecera.numeracion)
                await Promise.all([grabaCabecera(arrayCabecera.numeracion, arrayCabecera), grabaDetalle(arrayCabecera.numeracion, array_item)])
                if (arrayCabecera.tipocomprobante != 'T') {
                    enviaDocumentoApiSunat(arrayCabecera, array_item).then((r) => {

                    })
                }
                this.seleccionado = arrayCabecera
                this.genera_pdf = true
                await Promise.all([sumarCorrelativo(arrayCabecera.tipocomprobante, correlativo), modifica_stock_array('RESTA', array_item)])
                store.commit("dialogoprogress")

                this.genera_flujo(this.modopagos, arrayCabecera.numeracion)
            }
        },
        genera_flujo(arrays, observacion) {
            var fecha = moment().unix()
            var a = new Promise((resolve, reject) => {
                if (store.state.configuracion.flujocaja) {
                    arrays.forEach((items, index, array) => {
                        var data = items
                        if (this.contadores.flujocaja == '0NaN') {
                            this.contadores.flujocaja = '0001'
                        }
                        if (data.monto != '0') {
                            var flujo = {
                                id: this.contadores.flujocaja,
                                operacion: 'ingreso',
                                observacion: 'VENTA - ' + observacion,
                                numeracion_doc: observacion,
                                modo: data.modo,
                                fecha: fecha,
                                total: data.monto,
                                estado: 'activo',
                                responsable: store.state.permisos.correo.slice(0, -13),
                                sujeto: store.state.permisos.correo.slice(0, -13),
                            }
                            nuevoflujo(this.contadores.flujocaja, flujo).then(() => {
                                if (index === array.length - 1) {
                                    resolve(true)
                                };
                            })
                            this.contadores.flujocaja = (parseInt(this.contadores.flujocaja) + 1).toString().padStart(4, 0)
                        }
                    })
                } else {
                    resolve(true)
                }
                this.sumarCorrelativo('Flujo')
            })
            return a
        },
        guarda_comsionCliente(total) {
            var id = this.id_cliente
            var cli = this.array_cliente
            if (id != '') {
                var dataP = parseInt(store.state.configuracion.conversion_puntos)
                if (cli != undefined) {
                    var visi = parseInt(cli.visitas) + 1
                    var compras = parseFloat(cli.compras) + parseFloat(total)
                    var puntos = parseFloat(cli.puntos) + parseFloat(total) / dataP
                    grabaPuntosCliente(id, "visitas", visi)
                    grabaPuntosCliente(id, "compras", this.redondear(compras))
                    grabaPuntosCliente(id, "puntos", this.redondear(puntos))

                } else {
                    var puntos = parseFloat(total) / dataP
                    grabaPuntosCliente(id, "visitas", 1)
                    grabaPuntosCliente(id, "compras", total)
                    grabaPuntosCliente(id, "puntos", this.redondear(puntos))
                }
            }
            this.array_cliente = []
        },
        sumaTotalmodopago() {
            var suma = 0
            for (var i = 0; i < this.modopagos.length; i++) {
                suma = suma + parseFloat(this.modopagos[i].monto)
            }
            return parseFloat(suma).toFixed(2)
        },
        sumarCorrelativo(data) {
            if (data == "T") {
                var valor = (parseInt(this.contadores.ordenticket) + 1).toString().padStart(8, 0)
                var campo = 'ordenticket'
            }
            if (data == "B") {
                var valor = (parseInt(this.contadores.ordenboleta) + 1).toString().padStart(8, 0)
                var campo = 'ordenboleta'
            }
            if (data == "F") {
                var valor = (parseInt(this.contadores.ordenfactura) + 1).toString().padStart(8, 0)
                var campo = 'ordenfactura'
            }
            if (data == "Flujo") {
                var valor = (parseInt(this.contadores.flujocaja)).toString().padStart(4, 0)
                var campo = "flujocaja"
            }
            var a = sumaContador(campo, valor).then(() => {
                return true
            })
            return a
        },
        limpiacajas() {
            this.cliente_selecto = []
            this.consulta_cliente = []
            this.tipocomprobante = store.state.configuracion.defecto
            this.e1 = 1
            this.radios = 'EFECTIVO'
            this.documento = 'DNI'
            this.numero = ''
            this.nombreCompleto = ''
            this.placa_cliente = ''
            this.direccion = ''
            this.totalDocumento = ''
            this.refcliente = ''
            this.telfcliente = ''
            this.dialogCobra = false
            store.commit("completa_cobro", true)

            store.commit('dialogo_cobrar')
        },
        validadatos() {
            var fechahoy = this.conviertefecha(moment().unix())
            var validacion = true
            var suma = 0
            for (var i = 0; i < this.cuotasCredito.length; i++) {
                if (this.cuotasCredito[i].importe == 0) {
                    validacion = false
                }
                if (!moment(this.cuotasCredito[i].vencimiento).isAfter(fechahoy)) {
                    validacion = false
                }
            }
            return validacion
        },
        async finalizacobrocredito() {
            if (!this.validadatos()) {
                store.commit('dialogosnackbar', 'REVISE LAS CUOTAS')
            } else {

                if (this.tipocomprobante == "F" && this.numero.length != 11 ||
                    this.tipocomprobante == "F" && this.nombreCompleto == '' ||
                    this.documento == 'RUC' && this.numero.length != 11) {
                    store.commit('dialogosnackbar', 'DEBE CONSIDERAR DATOS DEL CLIENTE')
                } else {
                    store.commit("dialogoprogress")
                    if (this.numero != '' && this.nombreCompleto != '') {
                        this.guarda_clientes()
                    }
                    let snapshot = await obtenContador().once("value")
                    var contadores = snapshot.val()
                    var auto = ""
                    if (this.documento == "DNI") {
                        var doccliente = "1" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                    }
                    if (this.documento == "RUC") {
                        var doccliente = "6" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                    }
                    if (this.documento == "Pasaporte") {
                        var doccliente = "7" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                    }
                    if (this.documento == "Carnet de Extranjeria") {
                        var doccliente = "4" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
                    }
                    if (store.state.configuracion.flujocaja) {
                        var modosdepago = this.modopagos[0].modo
                    } else {
                        var modosdepago = this.radios
                    }
                    if (this.tipocomprobante == "B") { //Catálogo No. 01: Código de Tipo de documento
                        var cod_comprobante = '03' //01-factura -- 03-boleta -- 07-notaCred -- 08-notadebit -- 
                        var serie = store.state.seriesdocumentos.boleta
                        var correlativo = contadores.ordenboleta
                    }
                    if (this.tipocomprobante == "F") { //Catálogo No. 01: Código de Tipo de documento 
                        var cod_comprobante = '01' //01-factura -- 03-boleta -- 07-notaCred -- 08-notadebit -- 
                        var serie = store.state.seriesdocumentos.factura
                        var correlativo = contadores.ordenfactura
                    }
                    if (this.tipocomprobante == "T") {
                        var cod_comprobante = '00'
                        var serie = store.state.seriesdocumentos.ticket
                        var correlativo = contadores.ordenticket
                        this.array_cabecera.estado = 'aprobado'
                        auto = "NO"
                    }
                    if (this.nombreCompleto == '') {
                        this.nombreCompleto = 'CLIENTES VARIOS'
                    }
                    if (this.numero == '') {
                        this.numero = '00000000'
                        this.documento = "DNI"
                        var doccliente = "1"
                    }
                    this.array_cabecera.nomempleado = ''
                    if (store.state.configImpresora.vendedor) {
                        this.array_cabecera.nomempleado = (store.state.permisos.correo).substr(0, store.state.permisos.correo - 13)
                        console.log(this.array_cabecera.nomempleado)
                    }
                    var vencimientodoc = moment(String(this.cuotasCredito[this.cuotasCredito.length - 1].vencimiento)) / 1000
                    this.array_cabecera.serie = serie,
                        this.array_cabecera.correlativoDocEmitido = correlativo,
                        this.array_cabecera.numeracion = this.tipocomprobante + correlativo,
                        this.array_cabecera.tipoDocumento = this.documento
                    this.array_cabecera.cod_tipoDocumento = doccliente
                    this.array_cabecera.dni = this.numero
                    this.array_cabecera.cliente = this.nombreCompleto
                    this.array_cabecera.direccion = this.direccion
                    this.array_cabecera.telefono = this.telefono
                    this.array_cabecera.observacion = this.observacion
                    this.array_cabecera.referenciacliente = this.refcliente
                    this.array_cabecera.tipocomprobante = this.tipocomprobante
                    this.array_cabecera.cod_comprobante = cod_comprobante
                    this.array_cabecera.placa_cliente = this.placa_cliente
                    this.array_cabecera.automata = auto
                    this.array_cabecera.modopago = modosdepago
                    this.array_cabecera.forma_pago = "Credito"
                    this.array_cabecera.vencimientoDoc = vencimientodoc,
                        this.array_cabecera.cuotas = this.cuotasCredito
                    var arrayCabecera = this.array_cabecera
                    var array_item = this.listaproductos

                    store.commit('ultimo_correlativo', this.array_cabecera.numeracion)
                    await grabaCabecera(arrayCabecera.numeracion, arrayCabecera)
                    await grabaDetalle(arrayCabecera.numeracion, array_item)
                    if (arrayCabecera.tipocomprobante != 'T') {
                        enviaDocumentoApiSunat(arrayCabecera, array_item).then((r) => {
                            console.log(r)
                        })
                    }
                    this.seleccionado = arrayCabecera
                    this.genera_pdf = true
                    await sumarCorrelativo(arrayCabecera.tipocomprobante, correlativo)
                    await modifica_stock_array('RESTA', array_item)
                    this.guarda_cuentaCobrar(arrayCabecera).then(() => { })
                    store.commit("dialogoprogress")
                }
            }
        },
        async guarda_cuentaCobrar(data) {
            var fecha = moment().unix()
            var fecha_venche = moment().add(15, 'd').unix()
            var cabecera = {
                monto_total: data.total,
                monto_pendiente: data.total,
                estado: 'PENDIENTE',
                documento: data.dni,
                nombre: data.cliente,
                vendedor: data.vendedor,
                empleado: data.nomempleado,
                doc_ref: data.numeracion,
                fecha: data.fecha,
                fecha_envio: fecha,
                fecha_vence: fecha_venche,
                datos: [{
                    id: 0,
                    fecha: fecha,
                    fecha_vence: fecha_venche,
                    monto: data.total,
                    estado: 'PENDIENTE'
                }]
            }
            console.log(cabecera)
            await nuevaCuentaxcobrar(cabecera.doc_ref, cabecera)
        },
        cobroCredito() {
            this.cuotasCredito = []
            var totalcuenta = this.sumaTotal()
            var totaldescuentos = this.sumaDescuentos()
            var fec_venc = moment(this.fecha_cuota()) / 1000
            this.cuotasCredito.push({
                numero: '001',
                importe: this.redondear(totalcuenta - totaldescuentos),
                vencimiento: this.conviertefecha(this.fecha_cuota()),
                estado: 'pendiente',
                fecha_modificacion: moment().unix(),
                vendedor: store.state.permisos.correo.slice(0, -13)
            })
            this.dialogocredito = true
        },
        fecha_cuota() {
            var fecha = moment(String(new Date())).add(30, 'd') / 1000
            return fecha
        },
        nuevacuota() {
            var numerocuota = (parseInt(this.cuotasCredito.length + 1)).toString().padStart(3, 0)

            this.cuotasCredito.push({
                numero: numerocuota,
                importe: 0,
                vencimiento: this.conviertefecha(this.fecha_cuota()),
                estado: 'pendiente',
                fecha_modificacion: moment().unix(),
                vendedor: store.state.permisos.correo.slice(0, -13)
            })
        },
        eliminacuota() {
            this.cuotasCredito.pop()
        },
        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        verdate() {
            var fecha = moment(String(this.date)) / 1000
            if (moment(String(new Date())).format('YYYY-MM-DD') == moment(String(this.date)).format('YYYY-MM-DD')) {
                fecha = moment().unix()
            }
            return fecha

        },
        BuscarDocumento() {
            if (this.numero == '') {
                store.commit("dialogoClientesnuevos")
            } else {
                if (this.documento == "RUC" || this.documento == "DNI" &&
                    this.numero.length == 8 || this.numero.length == 11) {
                    store.commit("dialogoprogress")

                    if (this.numero.length == 11) {
                        this.documento = "RUC"
                    } else {
                        this.documento = "DNI"
                    }
                    var cliente = store.state.clientes.find(id => String(id.documento) === String(this.numero))
                    if (Boolean(cliente)) {
                        this.cliente_selecto = cliente
                        //console.log(cliente)
                        this.nombreCompleto = cliente.nombre
                        this.direccion = cliente.direccion + ' - ' + cliente.departamento + ' - ' + cliente.provincia + ' - ' + cliente.distrito
                        this.refcliente = cliente.referencia
                        this.telfcliente = cliente.telefono
                        store.commit("dialogoprogress")
                    } else {
                        this.consultaApiPeru()
                    }
                } else {
                    store.commit('dialogosnackbar', 'Documento Invalido')
                }
            }
        },
        BuscarEmpleado() {
            allEmpleados().once("value").then((snapshot) => {
                let array = [];
                snapshot.forEach((item) => {
                    let data = item.val();
                    array.push(data);
                });
                this.empleadoslista = array
                this.dialogoempleado = true
            })
        },
        agregaEmpleado(item) {
            this.empleado = item.nombre
            this.dniempleado = item.documento
            this.dialogoempleado = false
        },

        consultaApiPeru() {
            var self = this
            var token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            axios
                .get('https://apiperu.dev/api/' + this.documento.toLowerCase() + '/' + this.numero, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data,
                    store.commit("dialogoprogress"),
                    self.llenardatos(response.data.data)
                ))
        },
        llenardatos(data) {
            //  console.log(data)
            if (data != undefined) {
                this.consulta_cliente = data
                if (this.documento == 'DNI') {
                    this.nombreCompleto = data.nombre_completo
                    if (Boolean(data.direccion_completa)) {
                        this.direccion = data.direccion_completa
                    }
                    this.telfcliente = ''
                    this.refcliente = ''
                }
                if (this.documento == 'RUC') {
                    this.nombreCompleto = data.nombre_o_razon_social
                    if (Boolean(data.direccion_completa)) {
                        this.direccion = data.direccion_completa
                    }
                    this.telfcliente = ''
                    this.refcliente = ''
                }
            } else {
                store.commit('dialogosnackbar', 'Documento no existe')
            }
        },
        cuadrapago() {
            if (!this.separacuentas) {
                var cuadrepago = this.redondear(this.sumaTotal()) - this.redondear(this.sumaTotalmodopago()) - this.redondear(this.sumaDescuentos())
            } else {
                var cuadrepago = this.redondear(this.sumaTotalSeparado()) - this.redondear(this.sumaTotalmodopago()) - this.redondear(this.sumaDescuentosSeparado())
            }
            if (cuadrepago.toFixed(0) != 0) {
                store.commit('dialogosnackbar', "Monto de pago no coincide en S/." + this.redondear(this.sumaTotalmodopago() - (this.sumaTotal() - this.sumaDescuentos())))
                return false
            } else {
                return true
            }
        },

        paso1() {
            if (this.modopagos.length == 0) {
                store.commit('dialogosnackbar', "NO PUEDE QUEDAR VACIO!")
            } else {
                this.calculavuelto = 0
                if (store.state.configuracion.calvuelto) {

                    for (var i = 0; i < this.modopagos.length; i++) {
                        if (this.modopagos[i].modo == "EFECTIVO") {
                            this.calculavuelto = this.modopagos[i].monto
                            if (this.cuadrapago()) {
                                this.e1 = 2
                            }

                        }
                    }
                }
                if (this.calculavuelto == 0) {
                    if (this.cuadrapago()) {
                        this.e1 = 3
                    }
                }
            }
        },

        consultacliente(data) {
            buscaCliente()
                .orderByChild("documento")
                .equalTo(data)
                .once("value")
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            this.info_cliente = item.val()
                            this.documento = item.val().tipodoc
                            this.numero = item.val().documento
                            this.nombreCompleto = item.val().nombre
                            this.direccion = item.val().direccion
                        })
                    }
                })
        },

        selecciona_cliente() {
            this.dialogo_selecc_cliente = true
            if (this.numero == '') {
                store.commit('dialogoClientesnuevos')
            }
        },
        avanza() {
            if (this.e1 < 3) {
                this.e1++
            }
        },
        agregacliente(data) {
            this.cliente_selecto = data
            this.documento = data.tipodoc
            this.numero = data.documento
            this.nombreCompleto = data.nombre
            this.telfcliente = data.telefono
            this.direccion = data.direccion
            this.refcliente = data.referencia
        },
        async guarda_clientes() {
            var suma = false
            console.log(this.cliente_selecto)
            if (this.cliente_selecto.id != undefined) {
                this.cliente_selecto.nombre = this.nombreCompleto
                this.cliente_selecto.referencia = this.refcliente
                this.cliente_selecto.telefono = this.telfcliente
                this.cliente_selecto.direccion = this.cliente_selecto.direccion
                var array = this.cliente_selecto
            } else {
                let snapshot = await obtenContador().once("value")
                var contadores = snapshot.val().ordenclientes
                if (this.consulta_cliente == '') {
                    this.consulta_cliente.departamento = store.state.baseDatos.departamento
                    this.consulta_cliente.provincia = store.state.baseDatos.provincia
                    this.consulta_cliente.distrito = store.state.baseDatos.distrito
                    this.consulta_cliente.ubigeo_sunat = store.state.baseDatos.ubigeo
                }
                var array = {
                    activo: true,
                    id: contadores,
                    tipodoc: this.documento,
                    documento: this.numero,
                    nombre: this.nombreCompleto,
                    correo: '',
                    departamento: this.consulta_cliente.departamento,
                    provincia: this.consulta_cliente.provincia,
                    distrito: this.consulta_cliente.distrito,
                    ubigeo: this.consulta_cliente.ubigeo_sunat,
                    direccion: this.consulta_cliente.direccion,
                    telefono: this.telfcliente,
                    alias: '',
                    nota: 'agregado automaticamente',
                    referencia: this.refcliente,
                }
                suma = true
            }
            //console.log(array)
            nuevoCliente(array.id, array).then(() => {
                if (suma) {
                    sumarCorrelativo('clientes', array.id)
                }
            })
        },

    },
    computed: {
        total_suma() {
            this.listaproductos = store.state.productos_caja
            this.modopagos = store.state.modopago_caja
            this.array_cabecera = store.state.cabecera_caja
            return this.array_cabecera.total
        },
        listafiltradaclientes() {
            return this.clienteslista.filter((item) =>
                (item.documento + item.nombre + item.telefono)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
        },
        cuadravuelto() {
            var resta = 0
            resta = this.paravuelto - this.calculavuelto
            if (resta < 0) {
                return "MONTO MENOR A S/.0"
            } else {
                return "El vuelto debe ser: S/." + resta.toFixed(2)
            }
        },
        obten_correlativo() {
            if (this.tipocomprobante == "B") { //Catálogo No. 01: Código de Tipo de documento
                this.documento = 'DNI'
                return store.state.seriesdocumentos.boleta + '-' + this.contadores.ordenboleta
            }
            if (this.tipocomprobante == "F") { //Catálogo No. 01: Código de Tipo de documento 
                this.documento = 'RUC'
                return store.state.seriesdocumentos.factura + '-' + this.contadores.ordenfactura
            }
            if (this.tipocomprobante == "T") {
                return store.state.seriesdocumentos.ticket + '-' + this.contadores.ordenticket
            }
        },
        listafiltradaempleados() {
            return this.empleadoslista.filter((item) =>
                (item.alias + item.nombre + item.telefono)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
        },
    },
    mounted() {
        this.tipocomprobante = store.state.configuracion.defecto
        obtenContador().on("value", (snapshot) => {
            this.contadores = snapshot.val()
        })
    },
    beforeDestroy() {
        obtenContador().off("value", this.onDataChange);
    },

}
</script>
