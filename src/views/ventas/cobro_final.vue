<template>
    <v-dialog v-model="dial" class="mx-auto" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large @click="cierre()" color="red">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>Total = {{ moneda }} {{ total }}</h3>

                <v-spacer></v-spacer>
                <v-btn v-if="true" x-small color="primary" @click="visualizar()">
                    vista previa
                </v-btn>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-radio-group class="mt-n1 mx-auto " v-model="tipocomprobante" row>
                <v-radio label="Nota" value="T"></v-radio>
                <v-radio v-if="esAdmin" label="Boleta" value="B"></v-radio>
                <v-radio v-if="esAdmin" label="Factura" value="F"></v-radio>
            </v-radio-group>
            <template>
                <v-row class="mt-n3" dense>
                    <v-col cols="4" xs="4">
                        <v-select outlined dense v-model="documento" :items="documentos" menu-props="auto" hide-details
                            label="Tipo Doc"></v-select>
                    </v-col>
                    <v-col cols="8" xs="8">
                        <v-text-field outlined dense type="number" v-model="numero" label="Numero"
                            append-icon="mdi-magnify" :autofocus="!$store.state.esmovil"
                            @click:append="BuscarDocumento()" @keyup.enter="BuscarDocumento()"></v-text-field>
                    </v-col>
                </v-row>

                <v-text-field class="mt-n4" outlined dense v-model="nombreCompleto"
                    label="Nombres Completos"></v-text-field>
                <v-layout dense align-center>
                    <v-flex>
                        <v-text-field class="mt-n3" outlined dense v-model="direccion" label="Direccion"></v-text-field>
                    </v-flex>
                    <v-btn icon small color="info" class="ml-2 mt-n8" @click="ver_direcciones">
                        <v-icon>mdi-directions</v-icon>
                    </v-btn>
                </v-layout>

                <v-text-field class="mt-n3" outlined type="number" dense v-model="telfcliente"
                    label="Telefono"></v-text-field>

                <v-text-field class="mt-n3" outlined dense v-model="observacion" label="Observacion"></v-text-field>
                <v-row class="mt-n3 mx-auto" dense v-if="$store.state.configuracion.calvuelto">
                    <v-col cols="5">
                        <v-text-field v-model="paravuelto" dense label="Vuelto de: " type="number" outlined
                            :autofocus="!$store.state.esmovil"></v-text-field>
                    </v-col>
                    <v-col cols="7" class="red--text text-center">
                        {{ cuadravuelto }}
                    </v-col>
                </v-row>

                <v-row class="mt-n3 mx-auto" dense
                    v-if="$store.state.configuracion.detracciones && (tipocomprobante === 'B' || tipocomprobante === 'F')">
                    <v-autocomplete dense v-model="detraccion" :items="$store.state.detracciones"
                        :item-text="formatItemText" item-value="cod" label="Selecciona Detraccion"
                        outlined></v-autocomplete>
                </v-row>
                <v-row class="mt-n9 mb-n3">
                    <v-col cols="6">
                        <v-switch v-model="genera_guia" label="Genera G-Rem" :false-value="false"
                            :true-value="true"></v-switch>
                    </v-col>
                    <v-col cols="6">
                        <v-select v-if="$store.state.permisos.moduloempresa" outlined dense v-model="cod_vendedor"
                            class="mt-2" :items="$store.state.array_sedes" item-text="nombre" item-value="codigo"
                            label="Vendedor">
                            <template v-slot:item="{ item }"><span>{{ item.nombre }}</span></template>
                            <template v-slot:selection="{ item }"><span>{{ item && item.nombre }}</span></template>
                        </v-select>
                    </v-col>
                </v-row>

                <v-row class="mt-n2" dense>
                    <v-col cols="12" sm="6">
                        <v-btn block color="primary" @click="cobrarContado()" small>
                            EFECTIVO<span v-if="!$store.state.esmovil">(F3)</span>
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="6" v-if="$store.state.configuracion.creditofactura">
                        <v-btn :disabled="numero == '' || !permiteCreditoCliente" block color="error"
                            @click="activarCredito()" small>
                            Credito
                        </v-btn>
                    </v-col>
                    <!-- <v-col cols="4">
                        <v-btn block color="warning" @click="otros()" small>
                            OTROS
                        </v-btn>
                    </v-col> -->
                </v-row>

                <v-alert v-if="$store.state.configuracion.creditofactura && numero != '' && !permiteCreditoCliente"
                    type="warning" dense border="left" colored-border class="mt-2 mb-1" icon="mdi-alert-circle-outline">
                    Este cliente no tiene permiso de crédito.
                </v-alert>

                <v-card flat outlined class="mt-2 pa-2" v-if="formaPago === 'CREDITO'">
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-text-field outlined dense type="date" v-model="fechaVencimiento" :min="hoyISO"
                                label="Vence el" prepend-inner-icon="mdi-calendar" />
                        </v-col>
                        <v-col cols="12" sm="6" v-if="esAdmin">
                            <v-btn class="mt-1" small block color="indigo" dark @click="abrirCronograma">
                                <v-icon left small>mdi-calendar-clock</v-icon>
                                {{ cronograma ? 'Editar Cronograma' : 'Crear Cronograma' }}
                            </v-btn>
                        </v-col>
                        <v-col cols="12">
                            <v-btn block color="error" @click="cobrarCredito()" small>
                                Confirmar Credito
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card>
            </template>

        </v-card>
        <v-dialog v-model="dial_pagos" max-width="490" transition="dialog-bottom-transition">
            <v-card class="pa-3">
                {{ valida_modo_pago }}
                <div class="mt-6">
                    <v-row class="mt-n3" dense v-for="item in modopagos" :key="item.modo">
                        <v-col cols="12">
                            <v-row dense no-gutters>
                                <v-col cols="1">

                                </v-col>
                                <v-col cols="2">
                                    <v-img class="ml-n4" height="35" width="35" :src="busca_ico(item.nombre)"
                                        @click="cambia_modo_pago(item)"></v-img>
                                </v-col>
                                <v-col cols="9">
                                    <v-text-field class="ml-n10" :autofocus="item.nombre == 'EFECTIVO'" :prefix="moneda"
                                        outlined dense v-model="item.monto" type="number"
                                        :label="item.nombre"></v-text-field>
                                </v-col>
                            </v-row>

                        </v-col>

                    </v-row>
                </div>
                <v-btn block color="error" @click="cobrar()" small>
                    COBRAR
                </v-btn>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogocredito" max-width="500px" v-if="false">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogocredito = !dialogocredito">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon large @click="nuevacuota()" color="green">mdi-plus</v-icon>
                    <v-icon large @click="eliminacuota()" color="red">mdi-minus</v-icon>
                </v-system-bar>
            </div>

            <v-card class="mb-1" height="750px"><!-- >>> CAMBIO altura -->
                <!-- CUOTAS A CRÉDITO -->
                <v-simple-table fixed-header height="150px" dense> <!-- >>> CAMBIO altura -->
                    <thead>
                        <tr>
                            <th class="text-left">Cuota</th>
                            <th class="text-left">monto</th>
                            <th class="text-left">Vence</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cuotasCredito" :key="item.numero">
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

                <!-- Selección de método de pago aplicado a esta venta al crédito -->
                <div class="px-3 pt-4" v-if="sumaCuotasCredito != total">
                    <h4 class="subtitle-2 font-weight-bold mb-2">
                        Pago inicial - Falta : {{ money(montoRestanteCredito, moneda) }}
                    </h4>

                    <!-- igual estilo que dial_pagos, pero usa pagoInicialCredito -->
                    <v-row class="mt-n3" dense v-for="item in pagoInicialCredito" :key="item.nombre">
                        <v-col cols="12">
                            <v-row dense no-gutters>


                                <v-col cols="12">
                                    <v-text-field :prefix="moneda" outlined dense type="number" :label="item.nombre"
                                        v-model="item.monto" @focus="$event.target.select()"></v-text-field>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>


                </div>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="cobrar()">Finalizar</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>

        <dialog_direcciones_cliente v-model="dial_direcciones" :cliente-id="numero || (cliente && cliente.dni) || ''"
            @seleccion="onDireccionSeleccionada" />


        <busca_clis v-if="dial_cliente" @cerrar="dial_cliente = false" @agregar="agregacliente($event)"></busca_clis>
        <dial_stock v-model="dialStock" :items="sinStock" @close="onCloseStockDialog" />
        <cronograma v-if="dialogoCronograma" :totalCredito="Number(total || 0)" @cierra="dialogoCronograma = false"
            @emite_cronograma="guarda_cronograma($event)" :pagoInicial="0" :moneda="moneda" :planExistente="cronograma"
            :diasCalculados="diasHastaViernes" :diasCredito="diasCreditoCliente" :editable="esAdmin" />        
    </v-dialog>

</template>

<script>
import {
    allEmpleados,
    obtenContador,
    nuevaCuentaxcobrar
} from '../../db'
import { crearOActualizarCliente as nuevoCliente, colClientes } from '../../db_firestore'
import dial_stock from './dialogos/dial_stock_insuficiente.vue'
import {
    pdfGenera
} from '../../pdf_comprobantes'
import dial_mapa from '../clientes/dial_mapa.vue' // Ajusta la ruta según tu estructura
import {
    enviaDocumentoApiSunat
} from '../../servidorsunat'
import store from '@/store/index'
import axios from "axios"

import moment from 'moment'
import dialog_direcciones_cliente from '@/views/clientes/dialogos/dial_direcciones'
import busca_clis from '@/views/clientes/dialogos/busca_cliente'
import cronograma from './dialogos/cronograma_creditos.vue'

import {
    cobrar_js
} from '@/funciones_generales'
export default {
    name: 'caja',

    components: {
        dial_mapa,
        busca_clis,
        dialog_direcciones_cliente,
        dial_stock,
        cronograma
    },
    props: {
        cabecera: [],
        items: [],
        cliente: []
    },
    data() {
        return {
            metodo_pago_credito: '', // <-- lo vamos a convertir en objeto al final
            pagoInicialCredito: [],  // 👈 NUEVO
            cliente_selecto: [],
            dialogoMapa: false,
            dial_cliente: false,
            moneda: 'S/',
            genera_guia: false,
            detraccion: '',
            dialogocredito: false,
            dial: false,
            genera_pdf: false,
            dialogoempleado: false,
            dial_pagos: false,
            empleadoslista: [],
            buscar: '',
            documentos: ['DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',
            tipocomprobante: 'T',
            numero: '',
            nombreCompleto: '',
            direccion: '',
            departamento: '',
            provincia: '',
            distrito: '',
            ubigeo: '',
            telefono: '',
            refcliente: '',
            telfcliente: '',
            observacion: '',
            nom_empleado: '',
            dni_empleado: '',
            placa_cliente: '',
            modopagos: [],
            total: '',
            cuotasCredito: [],
            intervalo: true,
            paravuelto: '',
            calculavuelto: 0,
            dial_direcciones: false,
            cod_vendedor: store.state.sedeActual.codigo,
            dialStock: false,
            sinStock: [],
            formaPago: 'CONTADO',
            fechaVencimiento: '',
            dialogoCronograma: false,
            cronograma: null,
            
        }
    },

    created() {
        console.log(store.state.configuracion.defecto)
        this.cliente_selecto = this.cliente
        if (this.cliente != '') {
            this.numero = this.cliente.dni || ''
            if (this.numero.length == 11) {
                this.documento = "RUC"
            } else {
                this.documento = "DNI"
            }
            this.nombreCompleto = this.cliente.nombre

            this.direccion = this.cliente.dir
        }
        const usarDefecto = store.state.configuracion.usar_comprobante_defecto === true
        if (usarDefecto) {
            this.tipocomprobante = store.state.configuracion.defecto || 'T'
        } else {
            this.tipocomprobante = store.state.cliente_selecto?.tipocomprobante
                || store.state.cliente?.tipocomprobante
                || 'T'
        }

        this.total = this.cabecera.total - this.cabecera.descuentos
        this.moneda = this.cabecera.moneda
        this.modopagos = []
        var modos = store.state.modopagos
        for (var i = 0; i < modos.length; i++) {
            var data = modos[i]
            var mont = ''
            this.modopagos.push({
                nombre: data,
                monto: mont
            })
        }
        this.pagoInicialCredito = this.modopagos.map(m => ({
            nombre: m.nombre,
            monto: ''
        }))
        this.fechaVencimiento = this.calcularViernesProximo()
        this.dial = true

    },

    computed: {
        sumaCuotasCredito() {
            return this.cuotasCredito.reduce((acc, c) => {
                const n = parseFloat(c.importe) || 0
                return acc + n
            }, 0)
        },

        // cuánto falta pagar hoy (total - sumaCuotasCredito)
        montoRestanteCredito() {
            const t = parseFloat(this.total) || 0
            const pagadoEnCuotas = this.sumaCuotasCredito || 0
            // si cuotas cubren todo, queda 0
            const falta = t - pagadoEnCuotas
            return falta < 0 ? 0 : falta
        },
        hoyISO() {
            return moment().format('YYYY-MM-DD')
        },
        clienteCredito() {
            const fromStore = this.$store.state.cliente_selecto || {}
            const fromProp = this.cliente || {}
            const fromLocal = this.cliente_selecto || {}

            const merged = {
                ...fromStore,
                ...fromProp,
                ...fromLocal,
            }

            if (!merged.documento) {
                merged.documento = merged.dni || merged.id || this.numero || ''
            }

            return merged
        },
        permiteCreditoCliente() {
            return this.clienteCredito?.permite_credito === true
        },
        diasCreditoCliente() {
            return Number(this.clienteCredito?.dias_credito || 0)
        },
        diasHastaViernes() {
            if (this.diasCreditoCliente > 0) return this.diasCreditoCliente
            const hoy = moment().startOf('day')
            const viernes = moment(this.calcularViernesProximo()).startOf('day')
            return viernes.diff(hoy, 'days')
        },
        formatItemText() {
            return (item) => `${item.nom} - ${item.porcentaje}%`;
        },
        cuadravuelto() {
            var resta = 0
            resta = this.paravuelto - this.total
            if (resta < 0) {
                return "ES MENOR AL TOTAL"
            } else {
                return "VUELTO : S/." + resta.toFixed(2)
            }
        },
        valida_modo_pago() {
            var a = this.modopagos.find(id => String(id.nombre) == String('EFECTIVO'))
            var resta = this.total
            for (var i = 1; i < this.modopagos.length; i++) {
                resta = resta - this.modopagos[i].monto
            }

            if (resta < 0) {
                store.commit('dialogosnackbar', 'MONTOS NO COINCIDEN')
            } else {
                this.modopagos[0].monto = resta
            }
            return
        },
        esAdmin() {
            return this.$store.state.permisos?.es_admin === true;
        },
    },
    mounted() {
        window.addEventListener("keydown", this.detectarTecla);
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
    },
    methods: {
        onCloseStockDialog() {
            // opcional: si quieres hacer algo al cerrar
            // por ejemplo: enfocar input, limpiar loader, etc.
        },
        onDireccionSeleccionada(dir) {
            if (!dir) return

            // Dirección principal en el comprobante (solo la calle)
            this.direccion = (dir.direccion || '').trim()

            // Si quieres aprovechar para setear info extra:
            if (dir.departamento) {
                this.departamento = typeof dir.departamento === 'object'
                    ? (dir.departamento.nombre || '').trim()
                    : String(dir.departamento).trim()
            }

            if (dir.provincia) {
                this.provincia = typeof dir.provincia === 'object'
                    ? (dir.provincia.nombre || '').trim()
                    : String(dir.provincia).trim()
            }

            if (dir.distrito) {
                this.distrito = typeof dir.distrito === 'object'
                    ? (dir.distrito.nombre || '').trim()
                    : String(dir.distrito).trim()
            }

            if (dir.ubigeo) {
                this.ubigeo = String(dir.ubigeo).trim()
            }
        },

        money(v, mon) {
            const n = parseFloat(v) || 0
            return `${mon} ${n.toFixed(2)}`
        },
        seleccionaPagoCredito(itemSel) {
            // cuánto falta (ej. total 100, cuotas suman 60 => falta 40)
            const falta = this.montoRestanteCredito

            // limpia todos
            this.pagoInicialCredito.forEach(p => {
                p.monto = ''
            })

            // pone el monto faltante en el método elegido
            itemSel.monto = falta > 0 ? falta.toFixed(2) : '0.00'
        },

        ver_direcciones() {
            // Documento del cliente (prioriza lo digitado; si no, el del prop cliente)
            const doc = String(this.numero || this.cliente?.dni || '').trim()

            if (!doc) {
                store.commit && store.commit(
                    'dialogosnackbar',
                    'Primero ingrese/busque el documento del cliente.'
                )
                return
            }

            // nos aseguramos de que "numero" tenga el doc
            this.numero = doc
            // abrimos el diálogo de direcciones
            this.dial_direcciones = true
        },

        abrirDialogoMapa() {
            this.dialogoMapa = !this.dialogoMapa;
        },
        detectarTecla(event) {
            if (event.key === "F3" && !store.state.esmovil) {
                event.preventDefault(); // Evita que el navegador abra la ayuda
                this.cobrarContado();
            }
            if (event.key === "Escape") {
                event.preventDefault();
                this.cierre();
            }
        },
        cobrarContado() {
            this.formaPago = 'CONTADO'
            this.cronograma = null
            this.cobrar()
        },
        activarCredito() {
            if (!this.permiteCreditoCliente) {
                store.commit('dialogosnackbar', 'El cliente no tiene crédito habilitado')
                return
            }

            this.formaPago = 'CREDITO'
            if (this.diasCreditoCliente > 0) {
                this.fechaVencimiento = moment().add(this.diasCreditoCliente, 'days').format('YYYY-MM-DD')
            } else if (!this.fechaVencimiento) {
                this.fechaVencimiento = this.calcularViernesProximo()
            }
        },
        cobrarCredito() {
            if (!this.permiteCreditoCliente) {
                store.commit('dialogosnackbar', 'El cliente no tiene crédito habilitado')
                return
            }
            this.formaPago = 'CREDITO'
            this.cobrar()
        },
        cobroCredito() {
            this.cobrarCredito()
        },
        abrirCronograma() {
            if (this.formaPago !== 'CREDITO') return
            this.dialogoCronograma = true
        },
        guarda_cronograma(cronograma) {
            if (!cronograma?.fecha_ultima_cuota) return
            this.cronograma = cronograma
            this.fechaVencimiento = cronograma.fecha_ultima_cuota
            this.dialogoCronograma = false
        },
        calcularViernesProximo() {
            const hoy = moment()
            const diaSemana = hoy.day()
            if (diaSemana === 5) return hoy.format('YYYY-MM-DD')
            const diasMap = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0, 6: 6 }
            return hoy.add(diasMap[diaSemana], 'days').format('YYYY-MM-DD')
        },
        prepararCuotasCredito() {
            const total = parseFloat(this.total) || 0

            if (this.formaPago !== 'CREDITO') {
                this.cuotasCredito = []
                return true
            }

            if (!this.fechaVencimiento) {
                store.commit('dialogosnackbar', 'Seleccione la fecha de vencimiento')
                return false
            }

            if (this.cronograma && Array.isArray(this.cronograma.cuotas) && this.cronograma.cuotas.length > 0) {
                this.cuotasCredito = this.cronograma.cuotas.map((c, i) => ({
                    numero: String(c.numero || (i + 1)).padStart(3, '0'),
                    importe: Number(c.importe || 0).toFixed(2),
                    vencimiento: c.vencimiento,
                    estado: 'pendiente',
                    fecha_modificacion: moment().unix(),
                    vendedor: this.cod_vendedor || store.state.sedeActual.codigo
                }))
                return true
            }

            this.cuotasCredito = [{
                numero: '001',
                importe: total.toFixed(2),
                vencimiento: this.fechaVencimiento,
                estado: 'pendiente',
                fecha_modificacion: moment().unix(),
                vendedor: this.cod_vendedor || store.state.sedeActual.codigo
            }]
            return true
        },        
        nuevacuota() {
            var numerocuota = (parseInt(this.cuotasCredito.length + 1)).toString().padStart(3, 0)

            this.cuotasCredito.push({
                numero: numerocuota,
                importe: 0,
                vencimiento: this.conviertefecha(this.fecha_cuota()),
                estado: 'pendiente',
                fecha_modificacion: moment().unix(),
                vendedor: this.cod_vendedor || store.state.sedeActual.codigo
            })
        },
        eliminacuota() {
            this.cuotasCredito.pop()
        },
        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },
        fecha_cuota() {
            var fecha = moment(String(new Date())).add(7, 'd') / 1000
            return fecha
        },

        async cobrar() {

            store.commit("dialogoprogress")
            if (this.formaPago !== 'CREDITO' && this.valida_pagos() != parseFloat(this.total)) {
                alert('Debe ingresar monto correcto')
                store.commit("dialogoprogress")
                return
            }
            if (this.tipocomprobante == "F" && this.numero.length != 11 ||
                this.tipocomprobante == "F" && this.nombreCompleto == '' ||
                this.documento == 'RUC' && this.numero.length != 11) {
                alert('DEBE CONSIDERAR DATOS DEL CLIENTE')
                store.commit("dialogoprogress")
                return
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
                this.cabecera.estado = 'aprobado'
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
            this.cabecera.forma_pago = "Contado"
            this.cabecera.cuotas = ''
            if (this.formaPago === 'CREDITO') {
                const okCuotas = this.prepararCuotasCredito()
                if (!okCuotas) {
                    store.commit("dialogoprogress")
                    return
                }
            }
            if (Array.isArray(this.cuotasCredito) && this.cuotasCredito.length > 0) {
                var vencimientodoc = moment(String(this.cuotasCredito[this.cuotasCredito.length - 1].vencimiento), 'YYYY-MM-DD').unix()
                this.cabecera.vencimientoDoc = vencimientodoc
                this.cabecera.cuotas = this.cuotasCredito
                this.cabecera.forma_pago = "Credito"
            }
            var detra = {}
            if (this.detraccion != '' && this.detraccion != '000') {
                const detraSeleccionada = store.state.detracciones.find(d => d.cod === this.detraccion);

                if (detraSeleccionada) {
                    // Si encontramos el código de detracción, completamos los datos del objeto `detra`
                    detra = {
                        cod_detraccion: this.detraccion,
                        porcentaje: detraSeleccionada.porcentaje,
                        cuenta: store.state.configuracion.cuenta_detra,
                        monto: (parseFloat(this.total) * detraSeleccionada.porcentaje / 100).toFixed(2)
                    };
                }
            }
            if (this.telfcliente && this.numero && this.numero !== '00000000') {
                nuevoCliente(this.numero, { telefono: this.telfcliente })
            }

            this.cabecera.detraccion = detra
            this.cabecera.serie = serie
            this.cabecera.correlativoDocEmitido = correlativo
            this.cabecera.numeracion = serie + '-' + correlativo
            this.cabecera.tipoDocumento = this.documento
            this.cabecera.cod_tipoDocumento = doccliente
            this.cabecera.dni = this.numero
            this.cabecera.cliente = this.nombreCompleto
            this.cabecera.direccion = this.direccion
            this.cabecera.telefono = this.telfcliente
            this.cabecera.observacion = this.observacion
            this.cabecera.referenciacliente = this.refcliente
            this.cabecera.tipocomprobante = this.tipocomprobante
            this.cabecera.cod_comprobante = cod_comprobante
            this.cabecera.placa_cliente = this.placa_cliente
            this.cabecera.automata = auto
            this.cabecera.modopago = this.modopagos
            this.cabecera.cliente_zona = this.cliente_selecto?.zona || ''
            const metodosConMonto = this.pagoInicialCredito.filter(p => parseFloat(p.monto) > 0)

            // Solo guarda si hay alguno
            if (metodosConMonto.length > 0) {
                this.cabecera.metodo_pago_credito = metodosConMonto
            } else {
                delete this.cabecera.metodo_pago_credito // no guardar campo vacío
            }
            this.cabecera.ubicacion = this.$store.getters.ubicacionActual || ''
            this.cabecera.cod_vendedor = this.cod_vendedor || this.$store.state.sedeActual.codigo
            this.cabecera.vendedor = this.cod_vendedor || this.$store.state.sedeActual.codigo

            var arrayCabecera = this.cabecera
            var array_item = this.items
            var array = {
                arrayCabecera: arrayCabecera,
                array_item: array_item,
                control_stock: true,
                ruc_asociado: this.$store.state.baseDatos.ruc_asociado
            }
            console.log(array)
            //await cobrar_js(arrayCabecera, array_item)
            array.genera_guia = this.genera_guia || false
            const r = await this.api_rest(array, 'cobrar_js');
            if (!r) {
                // ya mostraste el diálogo de stock insuficiente
                store.commit("dialogoprogress");
                return;
            }
            if (arrayCabecera.tipocomprobante != 'T') {
                enviaDocumentoApiSunat(arrayCabecera, array_item)
            }
            this.$emit('terminar', array)
        },
        async api_rest(data, metodo) {
            try {
                const resp = await axios({
                    method: 'POST',
                    url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                    //url: 'http://127.0.0.1:5001/sis-distribucion/southamerica-east1/api_distribucion',
                    /*  headers: {
                          'X-Idempotency-Key': data.arrayCabecera.numeracion,
                      },*/
                    data: {
                        bd: store.state.baseDatos.bd,
                        data,
                        metodo
                    }
                });

                return resp.data;

            } catch (err) {
                const status = err?.response?.status;
                const body = err?.response?.data || {};

                if (status === 409 && body?.code === "STOCK_INSUFICIENTE") {
                    this.sinStock = Array.isArray(body.sinStock) ? body.sinStock : [];
                    this.dialStock = true;
                    return null;
                }

                throw err;
            }
        },

        otros() {
            this.dial_pagos = true
        },
        getDireccionPreferida(data = {}) {
            // 1) Si tiene direccion en la raíz, usar esa
            let dir = (data.direccion || '').trim();

            // 2) Si no hay, pero tiene direcciones[], usar el nodo 0
            if (!dir && Array.isArray(data.direcciones) && data.direcciones.length > 0) {
                const d0 = data.direcciones[0] || {};
                dir = (d0.direccion || '').trim();
            }

            return dir;
        },
        async BuscarDocumento() {
            if (this.numero == '') {
                this.dial_cliente = true
                return
            }

            // Muestra mensaje de carga
            this.text = 'Consultando datos del cliente...'
            this.snackbar = true

            try {
                store.commit("dialogoprogress")

                const num = String(this.numero).trim()

                // 1. Buscar en tu Firestore interno primero
                const docSnap = await colClientes().doc(num).get()

                if (docSnap.exists) {
                    const data = docSnap.data() || {}

                    // Nombre
                    if (data.nombre) this.nombreCompleto = data.nombre

                    // 👉 Dirección con lógica combinada (raíz o direcciones[0])
                    const dirFinal = this.getDireccionPreferida(data)
                    if (dirFinal) this.direccion = dirFinal

                    // Si ya tienes estos campos en el doc, los respetas
                    if (data.departamento) this.departamento = data.departamento
                    if (data.provincia) this.provincia = data.provincia
                    if (data.distrito) this.distrito = data.distrito
                    if (data.ubigeo) this.ubigeo = data.ubigeo

                    // Teléfono
                    if (data.telefono) this.telfcliente = data.telefono

                    console.log('Cliente encontrado en Firestore:', data)
                    store.commit("dialogoprogress")
                    return
                }


                // 2. Si NO existe en Firestore -> usar tu flujo actual con el store
                const {
                    nombre,
                    direccion,
                    departamento,
                    provincia,
                    distrito,
                    ubigeo,
                    longitud,
                    latitud
                } = await this.$store.dispatch('busca_cliente', {
                    documento: this.documento,
                    numero: this.numero,
                })
                console.log('antes de guardar')
                nuevoCliente(this.numero, {
                    nombre,
                    tipodoc: this.documento,
                    documento: this.numero,
                    id: this.numero,
                    direccion,
                    departamento,
                    provincia,
                    distrito,
                    ubigeo,
                    sede: store.state.sedeActual.codigo
                })
                // Autocompleta con resultado remoto / SUNAT / RENIEC, etc.
                if (nombre) this.nombreCompleto = nombre
                if (direccion) this.direccion = direccion
                if (departamento) this.departamento = departamento
                if (provincia) this.provincia = provincia
                if (distrito) this.distrito = distrito
                if (ubigeo) this.ubigeo = ubigeo

                this.text = nombre
                    ? 'Cliente encontrado y autocompletado'
                    : 'No se encontró información'

                store.commit("dialogoprogress")
            } catch (error) {
                console.error(error)
                this.text = 'Error al obtener datos del cliente'
                store.commit("dialogoprogress")
            }

            this.snackbar = true
        },


        agregacliente(data) {
            if (!data) return;

            console.log('agregacliente()', data);

            // Normaliza número de documento desde varias posibles claves
            const num = String(
                data.documento ||
                data.id ||
                data.dni ||
                ''
            ).trim();

            this.cliente_selecto = data;
            this.numero = num;

            // Tipo de documento según longitud
            if (num.length === 11) {
                this.documento = 'RUC';
            } else if (num.length === 8) {
                this.documento = 'DNI';
            } else {
                this.documento = this.documento || 'DNI';
            }

            this.nombreCompleto = data.nombre || data.nombre_lc || '';

            // ====== LÓGICA DE DIRECCIÓN ======
            let dirFinal = (data.direccion || '').trim();

            // Si no tiene `direccion` pero sí `direcciones`, usar siempre el nodo 0
            if (!dirFinal && Array.isArray(data.direcciones) && data.direcciones.length > 0) {
                const d0 = data.direcciones[0] || {};
                // Solo la calle, como pediste
                dirFinal = (d0.direccion || '').trim();

                // Si quisieras algo más completo (comentado):
                // dirFinal = [
                //   (d0.direccion || '').trim(),
                //   (d0.distrito && d0.distrito.nombre ? d0.distrito.nombre.trim() : ''),
                //   (d0.provincia && d0.provincia.nombre ? d0.provincia.nombre.trim() : ''),
                // ].filter(Boolean).join(' - ');
            }

            this.direccion = dirFinal;
            // =================================

            // Teléfono si viene
            if (data.telefono) {
                this.telfcliente = data.telefono;
            }
            const usarDefecto = store.state.configuracion.usar_comprobante_defecto === true

            /*  if (usarDefecto) {
                  this.tipocomprobante = store.state.configuracion.defecto || 'T'
              } else {
                  this.tipocomprobante = (data.tipocomprobante || data.tipo_comprobante)
                      ? (data.tipocomprobante || data.tipo_comprobante)
                      : 'T'
              }*/

            this.dial_cliente = false;
        },


        busca_ico(data) {
            var iconos = store.state.iconos_pagos.find(item => item.nombre == data)
            return iconos.icono
        },
        cambia_modo_pago(val) {
            for (var i = 0; i < this.modopagos.length; i++) {
                this.modopagos[i].monto = ''
            }
            var pos = this.modopagos.map(e => e.nombre).indexOf(val.nombre)
            this.modopagos[pos].monto = this.total
        },
        valida_pagos() {
            var suma = 0
            for (var i = 0; i < this.modopagos.length; i++) {
                var data = this.modopagos[i]
                if (data.monto != '') {
                    suma = suma + parseFloat(data.monto)
                }
            }
            return suma
        },
        cierre() {
            this.$emit('cierre', false)
        },
        async visualizar() {
            store.commit("dialogoprogress")
            if (this.valida_pagos() != parseFloat(this.total)) {
                alert('Debe ingresar monto correcto')
                store.commit("dialogoprogress")
                return
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
            if (this.documento == 'Otro Documento') {
                var doccliente = "0" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
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
                this.cabecera.estado = 'aprobado'
                auto = "NO"
            }
            if (this.nombreCompleto == '') {
                this.nombreCompleto = 'CLIENTES VARIOS'
            }

            this.cabecera.forma_pago = "Contado"
            this.cabecera.cuotas = ''
            if (this.cuotasCredito != '') {
                var vencimientodoc = moment(String(this.cuotasCredito[this.cuotasCredito.length - 1].vencimiento)) / 1000
                this.cabecera.vencimientoDoc = vencimientodoc
                this.cabecera.cuotas = this.cuotasCredito
                this.cabecera.forma_pago = "Credito"
            }
            this.cabecera.nomempleado = ''
            if (store.state.configImpresora.vendedor) {
                this.cabecera.nomempleado = (store.state.permisos.correo).substr(0, store.state.permisos.correo.length - 13)
                console.log(store.state.permisos.correo)
            }
            var detra = {}
            if (this.detraccion != '' && this.detraccion != '000') {
                const detraSeleccionada = store.state.detracciones.find(d => d.cod === this.detraccion);
                console.log(detraSeleccionada)
                if (detraSeleccionada) {
                    // Si encontramos el código de detracción, completamos los datos del objeto `detra`
                    detra = {
                        cod_detraccion: this.detraccion,
                        porcentaje: detraSeleccionada.porcentaje,
                        cuenta: store.state.configuracion.cuenta_detra,
                        monto: (parseFloat(this.total) * detraSeleccionada.porcentaje / 100).toFixed(2)
                    };
                }
            }
            this.cabecera.moneda = this.moneda
            this.cabecera.detraccion = detra
            this.cabecera.serie = serie
            this.cabecera.correlativoDocEmitido = correlativo
            this.cabecera.numeracion = serie + '-' + correlativo
            this.cabecera.tipoDocumento = this.documento
            this.cabecera.cod_tipoDocumento = doccliente
            this.cabecera.dni = this.numero
            this.cabecera.cliente = this.nombreCompleto
            this.cabecera.direccion = this.direccion
            this.cabecera.telefono = this.telfcliente
            this.cabecera.observacion = this.observacion
            this.cabecera.referenciacliente = this.refcliente
            this.cabecera.tipocomprobante = this.tipocomprobante
            this.cabecera.cod_comprobante = cod_comprobante
            this.cabecera.placa_cliente = this.placa_cliente
            this.cabecera.automata = auto
            this.cabecera.modopago = this.modopagos
            var arrayCabecera = this.cabecera
            var array_item = this.items
            var array = {
                arrayCabecera: arrayCabecera,
                array_item: array_item,
            }
            var modo = 'imprime'
            pdfGenera(array_item, arrayCabecera, store.state.configImpresora.tamano, modo === 'descarga' ? 'descarga' : 'abre');
            store.commit("dialogoprogress")
        },

    },

}
</script>
