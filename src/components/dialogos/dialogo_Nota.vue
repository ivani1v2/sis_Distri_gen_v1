<template>
    <v-dialog v-model="dial" max-width="950px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card class="pa-3">

            <v-row class="mt-1" dense>
                <v-col cols="6">
                    <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-select outlined dense v-model="motivo" :items="$store.state.motivos" hide-details
                        label="Motivo"></v-select>
                </v-col>
            </v-row>
            <v-row class="pa-2 mt-n12">
                <v-col cols="6">
                    <h5>Documento: {{ info_comprobante.dni }}</h5>
                    <h5>Nombre: {{ info_comprobante.cliente }}</h5>
                </v-col>
                <v-col cols="6">
                    <h5>Ref:
                        {{ info_comprobante.serie }}-{{ info_comprobante.correlativoDocEmitido
                        }}
                    </h5>
                    <h5>Total: {{ info_comprobante.total }}</h5>
                </v-col>
            </v-row>
            <v-card class="pa-3" elevation="6">
                <v-simple-table fixed-header height="40vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Und.
                                </th>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Medida
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in lista_productos" :key="item.id" @click.prevent="editaProducto(item.id)">
                                <td>{{ item.cantidad }}</td>
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>S/.{{ item.precioedita }}</td>
                                <td>S/.{{ redondear((item.precioedita * item.cantidad)) }}</td>
                            </tr>
                        </tbody>
                    </template>

                </v-simple-table>
            </v-card>
            <v-row class="mt-1">
                <v-col cols="6">
                    <v-list-item-content class="ml-3">
                        <v-list-item-subtitle>
                            <h2>Total: S/.{{ redondear(sumaTotal()) }}</h2>
                        </v-list-item-subtitle>
                    </v-list-item-content>

                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="6" md="4" sm="4" xs="6">
                    <v-btn block elevation="15" rounded v-if="listaproductos != ''" color="error"
                        @click="obtencorrelativo()">
                        GENERA NC
                    </v-btn>
                </v-col>

            </v-row>
        </v-card>

        <v-dialog v-model="dialogoProducto" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoProducto = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">

                <v-row class="mx-auto mt-4 text-center" dense>

                    <v-col cols="4" xs="4">
                        <v-icon @click="suma()" color="green">mdi-plus</v-icon>
                    </v-col>

                    <v-col cols="4" xs="4">
                        <v-text-field dense @keyup.enter="grabaEdita()" type="number" outlined v-model="cantidadEdita"
                            label="Cantidad"></v-text-field>
                    </v-col>
                    <v-col cols="4" xs="4">
                        <v-icon @click="resta()" color="red">mdi-minus</v-icon>
                    </v-col>

                </v-row>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12" class="mb-n4 mt-n4">
                        <v-text-field disabled dense @keyup.enter="grabaEdita()" class="pa-3" v-model="nombreEdita"
                            label="Nombre"></v-text-field>
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field dense @keyup.enter="grabaEdita()" type="number" class="pa-3" v-model="precioedita"
                            label="Precio"></v-text-field>
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field disabled dense @keyup.enter="grabaEdita()" type="number" class="pa-3"
                            v-model="preciodescuento" label="Descuento"></v-text-field>
                    </v-col>
                </v-row>

                <v-card-actions class="mt-n6">

                    <v-btn color="red darken-1" text @click="eliminaedita()">
                        Elimina
                    </v-btn>

                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="grabaEdita()">
                        Graba
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoanula" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoanula = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-title primary-title>
                    Esta seguro de generar Nota de credito?
                </v-card-title>
                <v-card-text>
                    CORRELATIVO : {{ serienc }}-{{ ordenNcredito }}
                </v-card-text>
                <v-card-text>
                    TOTAL: S/.{{ sumaTotal() }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="Genera()" color="success">Generar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import {
    obtenContador,
    sumaContador,
    grabaEstadoComprobanteNCD,
    grabaAnulacionreferecia,
    grabaCabeceraNCD,
    grabaDetalleNCD,
    grabaDatoC
} from '../../db'
import {
    envioNCredito
} from '../../servidorsunat'
import moment from 'moment'
import {
    pdfGenera
} from '../../pdf_notaCD'
import {
    modifica_stock_array
} from '../../control_stock'
import store from '@/store/index'
export default {
    name: 'caja',
    props: {
        items: [],
        cabecera: []
    },
    data() {
        return {
            dial: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            dialogAgrega: false,
            dialogoProducto: false,
            dialogoanula: false,
            codigo: '',
            listaproductos: [],
            buscar: '',
            codigoedita: '',
            cantidadEdita: '',
            precioedita: '',
            nombreEdita: '',
            preciodescuento: '',
            cantidadSinCodigo: 1,
            precioSinCodigo: '',
            medidasincodigo: 'UNIDAD',
            nombreSincodigo: '',
            tipocomprobante: 'T',
            correlativo: '',
            radios: 'EFECTIVO',
            documentos: [
                'DNI',
                'RUC',
                'Pasaporte',
                'Carnet de Extranjeria'
            ],
            documento: 'DNI',
            ordenboleta: '',
            ordenticket: '',
            ordenfactura: '',
            numero: '',
            nombreCompleto: '',
            direccion: '',
            arraytipoProducto: ['BIEN', 'SERVICIO'],
            arrayOperacion: [
                'GRAVADA',
                'EXONERADA',
                'INAFECTA'
            ],
            tipooperacion: 'GRAVADA',
            tipoproducto: "BIEN",
            info_comprobante: [],
            modo_credito: '',
            motivo: 'Anulación de la operación',
            serienc: '',
            ordenNcredito: '',
            data_array: []
        }
    },
    computed: {
        lista_productos() {
            this.listaproductos = this.items
            this.info_comprobante = this.cabecera
            return this.listaproductos
        },

    },
    created() {
        this.dial = true
    },

    methods: {

        editaProducto(id) {

            this.dialogoProducto = true
            for (var i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].id == id) {
                    this.codigoedita = i
                    this.cantidadEdita = this.listaproductos[i].cantidad
                    this.precioedita = this.listaproductos[i].precioedita
                    this.preciodescuento = this.listaproductos[i].preciodescuento
                    this.nombreEdita = this.listaproductos[i].nombre
                }
            }

        },
        suma() {

            if (this.cantidadEdita >= this.listaproductos[this.codigoedita].stock &&
                this.listaproductos[this.codigoedita].controstock && store.state.configuracion.inventario
            ) {
                store.commit('dialogosnackbar', 'NO TIENE MAS STOCK')
            } else {
                this.cantidadEdita = parseInt(this.cantidadEdita) + 1
            }
        },
        resta() {
            if (this.cantidadEdita > 1) {
                this.cantidadEdita = parseInt(this.cantidadEdita) - 1
            }
        },
        grabaEdita() {
            if (parseFloat(this.cantidadEdita) > parseFloat(this.listaproductos[this.codigoedita].stock) &&
                this.listaproductos[this.codigoedita].controstock && store.state.configuracion.inventario
            ) {
                store.commit('dialogosnackbar', 'NO TIENE MAS STOCK')
            } else {
                if (this.preciodescuento == '') {
                    this.preciodescuento = 0
                }
                if (parseFloat(this.listaproductos[this.codigoedita].precioedita) >= parseFloat(this.preciodescuento.toString().trim())) {
                    this.listaproductos[this.codigoedita].cantidad = this.cantidadEdita.toString().trim()
                    this.listaproductos[this.codigoedita].precio = this.redondear(this.precioedita.toString().trim())
                    this.listaproductos[this.codigoedita].precioedita = this.redondear(this.precioedita.toString().trim())
                    this.listaproductos[this.codigoedita].preciodescuento = this.redondear(this.preciodescuento.toString().trim())
                    this.listaproductos[this.codigoedita].nombre = this.nombreEdita.toString().trim()
                    this.dialogoProducto = false
                } else {
                    store.commit('dialogosnackbar', 'REVISE DESCUENTO')
                }
            }
        },

        eliminaedita() {
            this.listaproductos.splice(this.codigoedita, 1)
            this.dialogoProducto = false
            if (this.listaproductos == '') {
                this.btn_orden = false
            }
        },
        buscarArray(array, id) {
            var a = ''
            for (var i = 0; i < array.length; i++) {
                if (array[i].id == id) {
                    a = array[i]
                }
            }
            return a
        },
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

        obtencorrelativo() {
            console.log(this.listaproductos)
            this.completa_items(this.listaproductos).then((r) => {
                console.log(r)
                this.data_array = r
                var a = obtenContador().once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        if (this.info_comprobante.tipocomprobante == "F") {
                            this.tipo_comp_ref = '01'
                            this.serienc = "FN" + store.state.seriesdocumentos.notacredito
                            this.ordenNcredito = snapshot.val().ordenncredito
                        }
                        if (this.info_comprobante.tipocomprobante == "B") {
                            this.tipo_comp_ref = '03'
                            this.serienc = "BN" + store.state.seriesdocumentos.notacredito
                            this.ordenNcredito = snapshot.val().ordenncredito
                        }
                        this.dialogoanula = true
                        return true
                    }
                })
                return a

            })
        },
        comparafecha() {
            var hoy = moment(String(new Date())).add(-5, 'd').format('YYYY-MM-DD')
            var fecha = moment(String(this.date)).format('YYYY-MM-DD')
            if (moment(fecha).isAfter(hoy)) {
                return true
            } else {
                return false
            }
        },
        async Genera() {

            var data = this.data_array
            if (this.comparafecha()) {
                store.commit("dialogoprogress", 1)
                var fechahoy = this.verdate()
                var arrayCabecera = {
                    dni: this.info_comprobante.dni,
                    direccion: this.info_comprobante.direccion,
                    cliente: this.info_comprobante.cliente,
                    total: this.sumaTotal(),
                    numeracion: this.serienc + this.ordenNcredito,
                    descuentos: 0,
                    serie: this.serienc,
                    tipocomprobante: 'NC',
                    correlativo: this.ordenNcredito,
                    fecha: fechahoy,
                    tipo_comp_ref: this.tipo_comp_ref,
                    serie_comp_ref: this.info_comprobante.serie,
                    correlativo_comp_ref: this.info_comprobante.correlativoDocEmitido,
                    estado: 'PENDIENTE',
                    mensajeSunat: '',
                    hash: '',
                    motivo: this.motivo,
                    porcentaje_igv: this.info_comprobante.porcentaje_igv,
                    cod_motivo: this.obtencodigomotivo(this.motivo),
                    total_op_gravadas: data.totaloperaGravada,
                    total_op_exoneradas: data.totaloperaExonerada,
                    total_cargo: data.total_cargo,
                    igv: data.totalIGV,
                }
                var items = data.item
                await grabaCabeceraNCD(arrayCabecera.numeracion, arrayCabecera)
                await grabaDetalleNCD(arrayCabecera.numeracion, items)
                await this.sumacontadores()
                /*if (arrayCabecera.cod_motivo == '01' || arrayCabecera.cod_motivo == '02' || arrayCabecera.cod_motivo == '03' ||
                    arrayCabecera.cod_motivo == '06' || arrayCabecera.cod_motivo == '07') {
                    //modifica_stock_array('SUMA', items)
                    grabaDatoC(this.info_comprobante.numeracion, "nc_suma", false)
                } else {
                    grabaDatoC(this.info_comprobante.numeracion, "nc_suma", true)
                }*/
                pdfGenera(items, arrayCabecera, store.state.configImpresora.tamano)
                this.dialogoanula = false
                var r = await envioNCredito(arrayCabecera, items)
                //console.log(r)
                if (r.status_message == '0') {
                    await grabaEstadoComprobanteNCD(arrayCabecera.numeracion, 'ACEPTADO', r.data, r.hash)
                    await grabaDatoC(this.info_comprobante.numeracion, "num_nc", arrayCabecera.numeracion)
                    await grabaAnulacionreferecia(this.info_comprobante.numeracion, 'anulado', 'Editado mediante Nota de Credito : ' + this.serienc + '-' + this.ordenNcredito)
                } else {
                    await grabaEstadoComprobanteNCD(arrayCabecera.numeracion, r.status_message, r.data, r.hash)
                    alert('No aceptada! Comuniquese con el Administrador!')
                }

                store.commit("dialogoprogress", 1)
                this.router('creditoDebito')
            } else {
                store.commit('dialogosnackbar', 'FECHA EXCEDE EL LIMITE PERMITIDO')
            }
        },
        router(view) {
            this.$router.push({
                name: view
            })
        },
        completa_items(arrays) {
            var item = []
            var totaloperaGravada = 0
            var totaloperaExonerada = 0
            var total_op_gratuitas = 0
            var totalIGV = 0
            var totalIGV_GRATUITA = 0
            var total_cargo = 0
            var porcentaje_igv = this.info_comprobante.porcentaje_igv / 100
            var porcentaje_cargo = 0
            var a = new Promise((resolve, reject) => {
                arrays.forEach((items, index, array) => {
                    var data = items
                    var precio_item = parseFloat(this.redondear(data.precioedita))
                    /*   if (data.cargoxconsumo && porcentaje_cargo != 0) {
                           var cargo = parseFloat(this.redondear(precio_item / (parseFloat(porcentaje_cargo) + 1)))
                           var sumcargo = parseFloat(precio_item - cargo)
                           precio_item = cargo
                           total_cargo = total_cargo + parseFloat(sumcargo * data.cantidad)
                       }*/
                    if (data.operacion == "GRAVADA") {
                        var precioVentaUnitario = precio_item
                        var valor_unitario = precioVentaUnitario / (1 + (porcentaje_igv))
                        var igv = valor_unitario * data.cantidad * porcentaje_igv
                        var valorTotal = valor_unitario * data.cantidad
                        var antesimpuesto = valor_unitario * data.cantidad
                        var totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        totaloperaGravada = totaloperaGravada + parseFloat(antesimpuesto)
                        totaloperaExonerada = totaloperaExonerada + 0
                        totalIGV = totalIGV + parseFloat(totalImpuesto)
                    }
                    if (data.operacion == "EXONERADA") {
                        var precioVentaUnitario = precio_item
                        var valor_unitario = precioVentaUnitario
                        var igv = 0.00
                        var valorTotal = valor_unitario * data.cantidad
                        var antesimpuesto = valor_unitario * data.cantidad
                        var totalImpuesto = 0.00
                        totaloperaGravada = totaloperaGravada + 0
                        totaloperaExonerada = totaloperaExonerada + parseFloat(antesimpuesto)
                        totalIGV = totalIGV + parseFloat(totalImpuesto)
                    }
                    if (data.operacion == "GRATUITA") {
                        var precioVentaUnitario = parseFloat((1 / 1.18).toFixed(2))
                        var valor_unitario = precioVentaUnitario
                        var igv = 0.00
                        var valorTotal = valor_unitario * data.cantidad
                        var antesimpuesto = valor_unitario * data.cantidad
                        var totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        totaloperaGravada = totaloperaGravada + 0
                        totaloperaExonerada = totaloperaExonerada + 0
                        total_op_gratuitas = total_op_gratuitas + parseFloat(antesimpuesto)
                        totalIGV = totalIGV + 0
                        totalIGV_GRATUITA = +totalIGV_GRATUITA + 0
                        precioVentaUnitario = valor_unitario
                        valor_unitario = 0.00
                        totalImpuesto = 0.00

                        //antesimpuesto = (precioVentaUnitario*parseFloat(data.cantidad))
                    }

                    if (data.tipoproducto == undefined) {
                        data.tipoproducto = 'BIEN'
                    }
                    item.push({
                        id: data.id,
                        cantidad: data.cantidad,
                        nombre: data.nombre,
                        medida: data.medida,
                        cod_medida: data.cod_medida,
                        precio: data.precio,
                        precioedita: data.precio,
                        tipoproducto: data.tipoproducto,
                        operacion: data.operacion,
                        icbper: 0,
                        cargoxconsumo: false,
                        valor_unitario: valor_unitario.toFixed(5),
                        valor_total: valorTotal.toFixed(2),
                        igv: igv.toFixed(2),
                        valor_icbper: 0.00,
                        factor_icbper: 0,
                        total_antes_impuestos: antesimpuesto.toFixed(2),
                        total_impuestos: totalImpuesto.toFixed(2),
                        precioVentaUnitario: this.redondear(precioVentaUnitario)
                    })
                    //console.log(item)
                    if (index === array.length - 1) {
                        var data = {
                            item: item,
                            totaloperaGravada: totaloperaGravada.toFixed(2),
                            totaloperaExonerada: totaloperaExonerada.toFixed(2),
                            total_op_gratuitas: total_op_gratuitas.toFixed(2),
                            totalIGV: totalIGV.toFixed(2),
                            totalIGV_GRATUITA: totalIGV_GRATUITA.toFixed(2),
                            total_cargo: total_cargo.toFixed(2)
                        }
                        resolve(data)
                    };
                })

            })
            a.then((value) => {
                return value
            })
            return a
        },
        async sumacontadores() {
            await sumaContador("ordenncredito", (parseInt(this.ordenNcredito) + 1).toString().padStart(4, 0))
            return true
        },
        obtencodigomotivo(motivo) {
            var array = store.state.motivosSunat
            var codigo = '01'
            for (var i = 0; i < array.length; i++) {
                if (array[i].nombre == motivo) {
                    codigo = array[i].codigo
                }
            }
            return codigo
        },

        sumaTotalmodopago() {
            var suma = 0
            for (var i = 0; i < this.modopagos.length; i++) {
                suma = suma + parseFloat(this.modopagos[i].monto)
            }
            return parseFloat(suma).toFixed(2)
        },

        sumarCorrelativo() {
            if (this.tipocomprobante == "T") {
                sumaContador("ordenticket", (parseInt(this.ordenticket) + 1).toString().padStart(8, 0))
            }
            if (this.tipocomprobante == "B") {
                sumaContador("ordenboleta", (parseInt(this.ordenboleta) + 1).toString().padStart(8, 0))
            }
            if (this.tipocomprobante == "F") {
                sumaContador("ordenfactura", (parseInt(this.ordenfactura) + 1).toString().padStart(8, 0))
            }
            //store.commit('dialogoCaja')

        },
        limpiacajas() {

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
        cierra() {
            this.$emit('cierra', false)
        }

    },



}
</script>
