<template>
    <v-dialog v-model="dial" max-width="950px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn x-small color="info" @click="limpiar_items">
                    Limpiar Items
                </v-btn>
                <v-btn x-small color="success" class="ml-2" @click="abrirAgregarItems">
                    Agregar Items
                </v-btn>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-row class="mt-1" dense>
                <v-col cols="6">
                    <v-text-field type="date" outlined dense v-model="date" label="Emisión"></v-text-field>
                </v-col>

                <v-col cols="6">
                    <v-select outlined dense v-model="motivo" :items="$store.state.motivosSunat" hide-details
                        label="Motivo" item-text="nombre"></v-select>

                    <!-- 🔁 Switch para regresar stock -->

                </v-col>
            </v-row>


            <v-row class="pa-2 mt-n12">
                <v-col cols="4">
                    <h5>Documento: {{ info_comprobante.dni }}</h5>
                    <h5>Nombre: {{ info_comprobante.cliente }}</h5>
                </v-col>
                <v-col cols="4">
                    <h5>
                        Ref: {{ info_comprobante.serie }}-{{ info_comprobante.correlativoDocEmitido }}
                    </h5>
                    <h5>Total: {{ moneda }} {{ info_comprobante.total }}</h5>
                </v-col>
                <v-col cols="4">
                    <v-switch dense class="mt-2" v-model="regresar_stock" label="Regresar stock" inset></v-switch>
                </v-col>
            </v-row>

            <v-card class="pa-3" elevation="6">
                <v-simple-table fixed-header height="40vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Und.</th>
                                <th class="text-left">Descripcion</th>
                                <th class="text-left">Medida</th>
                                <th class="text-left">Precio</th>
                                <th class="text-left">Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="item in lista_productos" :key="item.id" @click.prevent="editaProducto(item.id)">
                                <td>{{ item.cantidad }}</td>
                                <td>{{ item.id }} - {{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.precio }}</td>
                                <td v-if="item.operacion!='GRATUITA'">{{ redondear(item.precio * item.cantidad) }}</td>
                                <td v-if="item.operacion=='GRATUITA'">0.00</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

            <v-row class="mt-1">
                <v-col cols="6">
                    <v-list-item-content class="ml-3">
                        <v-list-item-subtitle>
                            <h2>Total: {{ moneda }} {{ redondear(sumaTotal()) }}</h2>
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-col>

                <v-spacer></v-spacer>

                <v-col cols="6" md="4" sm="4" xs="6">
                    <v-btn block elevation="15" rounded v-if="listaproductos.length" color="error"
                        @click="obtencorrelativo()">
                        GENERA NC
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>

        <!-- DIALOG EDITAR PRODUCTO -->
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
                        <v-text-field dense type="number" outlined v-model="cantidadEdita" label="Cantidad"
                            @keyup.enter="grabaEdita()"></v-text-field>
                    </v-col>

                    <v-col cols="4" xs="4">
                        <v-icon @click="resta()" color="red">mdi-minus</v-icon>
                    </v-col>
                </v-row>

                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12" class="mb-n4 mt-n4">
                        <v-text-field disabled dense class="pa-3" v-model="nombreEdita" label="Nombre"
                            @keyup.enter="grabaEdita()"></v-text-field>
                    </v-col>

                    <v-col cols="12" xs="6">
                        <v-text-field dense type="number" class="pa-3" v-model="precioedita" label="Precio"
                            @keyup.enter="grabaEdita()"></v-text-field>
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

        <!-- DIALOG CONFIRMA NC -->
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

        <!-- DIALOG AGREGAR ITEMS DESDE DOCUMENTO -->
        <v-dialog v-model="dialogoAgregar" max-width="800px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoAgregar = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>

            <v-card class="pa-3">
                <h3 class="mb-2">Agregar Items del Documento</h3>
                <v-simple-table fixed-header height="50vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Descripcion</th>
                                <th class="text-right">Cant. Doc</th>
                                <th class="text-right">Cajas</th>
                                <th class="text-right">Unidades</th>
                                <th class="text-right">Total Und</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in itemsAgregar" :key="item.id">
                                <td>{{ item.id }} - {{ item.nombre }}</td>
                                <td class="text-right">{{ item.maxCantidad }} {{ item.medida }}</td>
                                <template v-if="item.factor === 1 && item.medida === 'UNIDAD'">
                                    <td colspan="2" class="text-right">
                                        <v-text-field dense type="number" hide-details
                                            v-model.number="item.unidadesSimples" @change="validaUnidadesSimples(item)"
                                            :min="0" :max="item.maxCantidad">
                                        </v-text-field>
                                    </td>
                                </template>
                                <template v-else>
                                    <td class="text-right" style="width: 100px;">
                                        <v-text-field dense type="number" hide-details v-model.number="item.cajas"
                                            @change="validaCajas(item)" :min="0" :max="item.maxCantidad">
                                        </v-text-field>
                                    </td>
                                    <td class="text-right" style="width: 100px;">
                                        <v-text-field dense type="number" hide-details v-model.number="item.unidades"
                                            @change="validaUnidades(item)" :min="0" :max="item.factor - 1">
                                        </v-text-field>
                                    </td>
                                </template>
                                <td class="text-right">
                                    <strong v-if="item.factor === 1 && item.medida === 'UNIDAD'">
                                        {{ item.unidadesSimples }} und
                                    </strong>
                                    <strong v-else>
                                        {{ (item.cajas * item.factor) + item.unidades }} und
                                    </strong>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="dialogoAgregar = false">Cancelar</v-btn>
                    <v-btn color="success" @click="aplicarAgregarItems">Agregar a NC</v-btn>
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
} from '../../../db'
import { envioNCredito } from '../../../servidorsunat'
import moment from 'moment'
import { pdfGenera } from '../../../pdf_notaCD'
import { modifica_stock_array } from '../../../control_stock'
import store from '@/store/index'

export default {
    name: 'caja',
    props: {
        items: [],     // items del comprobante
        cabecera: []   // cabecera del comprobante
    },
    data() {
        return {
            dial: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            dialogAgrega: false,
            dialogoProducto: false,
            dialogoanula: false,
            dialogoAgregar: false,
            regresar_stock: false,
            codigo: '',
            listaproductos: [],
            itemsOriginales: [],
            itemsAgregar: [],

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
            documentos: ['DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',
            ordenboleta: '',
            ordenticket: '',
            ordenfactura: '',
            numero: '',
            nombreCompleto: '',
            direccion: '',
            arraytipoProducto: ['BIEN', 'SERVICIO'],
            arrayOperacion: ['GRAVADA', 'EXONERADA', 'INAFECTA'],
            tipooperacion: 'GRAVADA',
            tipoproducto: 'BIEN',

            info_comprobante: [],
            modo_credito: '',
            motivo: 'Anulación de la operación',
            serienc: '',
            ordenNcredito: '',
            data_array: [],
            moneda: 'S/'
        }
    },
    computed: {
        lista_productos() {
            return this.listaproductos
        }
    },
    created() {
        this.dial = true

        // copia de items originales (documento relacionado)
        this.itemsOriginales = this.items ? JSON.parse(JSON.stringify(this.items)) : []
        // por defecto, la NC arranca con todos los items
        this.listaproductos = this.itemsOriginales.map(i => ({ ...i }))

        this.info_comprobante = this.cabecera || {}
        this.moneda = this.info_comprobante.moneda || 'S/'
    },
    watch: {
        motivo: {
            immediate: true,
            handler(val) {
                const motivosRegresanStock = [
                    "Anulación de la operación",
                    "Anulación por error en el RUC",
                    "Devolución total",
                    "Devolución por ítem",
                ];
                // Se enciende solo si el motivo está en la lista
                this.regresar_stock = motivosRegresanStock.includes(val);
            }
        }
    },

    methods: {
        // Limpia por completo el detalle de la NC
        limpiar_items() {
            this.listaproductos = []
        },

        // Abre diálogo para seleccionar items desde el documento original
        abrirAgregarItems() {
            this.itemsAgregar = this.itemsOriginales.map(orig => {
                const existente = this.listaproductos.find(p => p.id === orig.id)
                const factor = Number(orig.factor || 1)
                const lineasExistentes = this.listaproductos.filter(p => p.id === orig.id)

                let cajasExistentes = 0
                let unidadesExistentes = 0

                lineasExistentes.forEach(linea => {
                    if (linea.medida !== 'UNIDAD') {
                        cajasExistentes += Number(linea.cantidad)
                    } else {
                        unidadesExistentes += Number(linea.cantidad)
                    }
                })

                return {
                    ...orig,
                    factor: factor,
                    maxCantidad: Number(orig.cantidad),
                    cajas: cajasExistentes,
                    unidades: unidadesExistentes,
                    unidadesSimples: 0  // 👈 NUEVO: para productos unidad simple
                }
            })
            this.dialogoAgregar = true
        },

        // Valida que no se exceda la cantidad del documento
        validaCantidad(item) {
            let c = Number(item.cantidadSeleccionada || 0)
            let max = item.devolverEnUnidades ? (item.maxCantidad * item.factor) : item.maxCantidad

            if (c < 0) c = 0
            if (c > max) c = max
            item.cantidadSeleccionada = c
        },

        // Aplica selección de items al detalle de la NC
        aplicarAgregarItems() {
            const nuevos = []

            this.itemsAgregar.forEach(item => {
                const esUnidadSimple = item.factor === 1 && item.medida === 'UNIDAD'

                if (esUnidadSimple) {
                    const cantidad = Number(item.unidadesSimples || 0)
                    if (cantidad > 0) {
                        const copia = { ...item }
                        copia.cantidad = cantidad
                        nuevos.push(copia)
                    }
                } else {
                    const cajas = Number(item.cajas || 0)
                    const unidades = Number(item.unidades || 0)

                    if (cajas > 0) {
                        const copiaCaja = { ...item }
                        copiaCaja.cantidad = cajas
                        nuevos.push(copiaCaja)
                    }
                    if (unidades > 0) {
                        const copiaUnidad = { ...item }
                        copiaUnidad.cantidad = unidades
                        copiaUnidad.medida = 'UNIDAD'
                        copiaUnidad.cod_medida = 'NIU'
                        copiaUnidad.precio = Number((item.precio / item.factor).toFixed(4))
                        copiaUnidad.precioedita = Number((item.precioedita / item.factor).toFixed(4))
                        nuevos.push(copiaUnidad)
                    }
                }
            })

            this.listaproductos = nuevos
            this.dialogoAgregar = false
        },
        validaCajas(item) {
            let c = Number(item.cajas || 0)
            if (c < 0) c = 0
            if (c > item.maxCantidad) c = item.maxCantidad
            item.cajas = c
        },

        validaUnidades(item) {
            let u = Number(item.unidades || 0)
            if (u < 0) u = 0
            if (u >= item.factor) u = item.factor - 1
            item.unidades = u
        },
        validaUnidadesSimples(item) {
            let u = Number(item.unidadesSimples || 0)
            if (u < 0) u = 0
            if (u > item.maxCantidad) u = item.maxCantidad
            item.unidadesSimples = u
        },

        editaProducto(id) {
            const index = this.listaproductos.findIndex(p => p.id === id)
            if (index === -1) return

            const prod = this.listaproductos[index]
            this.codigoedita = index
            this.cantidadEdita = prod.cantidad
            this.precioedita = prod.precioedita
            this.preciodescuento = prod.preciodescuento || 0
            this.nombreEdita = prod.nombre

            this.dialogoProducto = true
        },

        suma() {
            if (
                this.cantidadEdita >= this.listaproductos[this.codigoedita].stock &&
                this.listaproductos[this.codigoedita].controstock &&
                store.state.configuracion.inventario
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
            if (
                parseFloat(this.cantidadEdita) >
                parseFloat(this.listaproductos[this.codigoedita].stock) &&
                this.listaproductos[this.codigoedita].controstock &&
                store.state.configuracion.inventario
            ) {
                store.commit('dialogosnackbar', 'NO TIENE MAS STOCK')
            } else {
                if (this.preciodescuento === '') {
                    this.preciodescuento = 0
                }
                if (
                    parseFloat(this.listaproductos[this.codigoedita].precioedita) >=
                    parseFloat(this.preciodescuento.toString().trim())
                ) {
                    this.listaproductos[this.codigoedita].cantidad =
                        this.cantidadEdita.toString().trim()
                    this.listaproductos[this.codigoedita].precio = this.redondear(
                        this.precioedita.toString().trim()
                    )
                    this.listaproductos[this.codigoedita].precioedita = this.redondear(
                        this.precioedita.toString().trim()
                    )
                    this.listaproductos[this.codigoedita].preciodescuento = this.redondear(
                        this.preciodescuento.toString().trim()
                    )
                    this.listaproductos[this.codigoedita].nombre =
                        this.nombreEdita.toString().trim()
                    this.dialogoProducto = false
                } else {
                    store.commit('dialogosnackbar', 'REVISE DESCUENTO')
                }
            }
        },

        eliminaedita() {
            this.listaproductos.splice(this.codigoedita, 1)
            this.dialogoProducto = false
        },

        sumaTotal() {
            let suma = 0

            for (let i = 0; i < this.listaproductos.length; i++) {
                const item = this.listaproductos[i]

                if (item.operacion === 'GRATUITA') continue

                suma += Number(item.cantidad || 0) * Number(item.precio || 0)
            }

            this.totalDocumento = suma.toFixed(2)
            return suma.toFixed(2)
        },
        sumaDescuentos() {
            let suma = 0
            for (let i = 0; i < this.listaproductos.length; i++) {
                suma += parseFloat(this.listaproductos[i].preciodescuento || 0)
            }
            this.totalDescuento = this.redondear(suma)
            return this.redondear(suma)
        },

        obtencorrelativo() {
            this.completa_items(this.listaproductos).then(r => {
                this.data_array = r
                console.log("RESIUL",r)
                obtenContador().once('value').then(snapshot => {
                    if (!snapshot.exists()) return

                    const contadores = snapshot.val() || {}

                    if (this.info_comprobante.tipocomprobante === 'F') {
                        this.tipo_comp_ref = '01'
                        this.serienc = 'FN' + store.state.seriesdocumentos.notacredito
                        this.ordenNcredito = contadores.ordenncredito_f || '0001'
                    }

                    if (this.info_comprobante.tipocomprobante === 'B') {
                        this.tipo_comp_ref = '03'
                        this.serienc = 'BN' + store.state.seriesdocumentos.notacredito
                        this.ordenNcredito = contadores.ordenncredito || '0001'
                    }

                    this.dialogoanula = true
                })
            })
        },

        comparafecha() {
            const hoy = moment(String(new Date()))
                .add(-5, 'd')
                .format('YYYY-MM-DD')
            const fecha = moment(String(this.date)).format('YYYY-MM-DD')
            return moment(fecha).isAfter(hoy)
        },

        async Genera() {
            const data = this.data_array
            if (this.comparafecha()) {
                store.commit('dialogoprogress', 1)
                const fechahoy = this.verdate()
                const totalNum = parseFloat(this.sumaTotal())
                const arrayCabecera = {
                    moneda: this.moneda,
                    dni: this.info_comprobante.dni,
                    direccion: this.info_comprobante.direccion,
                    cliente: this.info_comprobante.cliente,
                    total: totalNum,
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
                    total_op_gratuitas: data.total_op_gratuitas,
                    total_igv: data.totalIGV,
                    total_cargo: data.total_cargo,
                    igv: data.totalIGV,
                    regresar_stock: this.regresar_stock,
                    estado_aplicacion: 'pendiente',
                    monto_aplicado: 0,
                }

                const items = data.item
                await grabaCabeceraNCD(arrayCabecera.numeracion, arrayCabecera)
                await grabaDetalleNCD(arrayCabecera.numeracion, items)
                await this.sumacontadores()

                pdfGenera(items, arrayCabecera, store.state.configImpresora.tamano)

                this.dialogoanula = false
                const r = await envioNCredito(arrayCabecera, items)
                if (this.regresar_stock) {
                    try {
                        // Solo necesitamos id, cantidad y medida para el control de stock
                        const itemsStock = this.listaproductos.map(it => ({
                            id: it.id,
                            cantidad: Number(it.cantidad),
                            medida: it.medida,
                        }))

                        await modifica_stock_array('SUMA', itemsStock)
                    } catch (e) {
                        console.error('Error al regresar stock desde NC:', e)
                        store.commit('dialogosnackbar', 'Nota generada, pero hubo un problema al regresar el stock.')
                    }
                }
                if (r.status_message === '0') {
                    await grabaEstadoComprobanteNCD(
                        arrayCabecera.numeracion,
                        'ACEPTADO',
                        r.data,
                        r.hash
                    )
                    await grabaDatoC(
                        this.info_comprobante.numeracion,
                        'num_nc',
                        arrayCabecera.numeracion
                    )
                    await grabaAnulacionreferecia(
                        this.info_comprobante.numeracion,
                        'editado',
                        'Editado mediante Nota de Credito : ' +
                        this.serienc +
                        '-' +
                        this.ordenNcredito
                    )
                } else {
                    await grabaEstadoComprobanteNCD(
                        arrayCabecera.numeracion,
                        r.status_message,
                        r.data,
                        r.hash
                    )
                    alert('No aceptada! Comuniquese con el Administrador!')
                }

                store.commit('dialogoprogress', 1)
                this.router('creditoDebito')
            } else {
                store.commit('dialogosnackbar', 'FECHA EXCEDE EL LIMITE PERMITIDO')
            }
        },

        router(view) {
            this.$router.push({ name: view })
        },

        completa_items(arrays) {
            let item = []
            let totaloperaGravada = 0
            let totaloperaExonerada = 0
            let total_op_gratuitas = 0
            let totalIGV = 0
            let totalIGV_GRATUITA = 0
            let total_cargo = 0
            const porcentaje_igv = this.info_comprobante.porcentaje_igv / 100
            const porcentaje_cargo = 0

            const a = new Promise((resolve, reject) => {
                arrays.forEach((items, index, array) => {
                    const data = items
                    let precio_item = parseFloat(this.redondear(data.precioedita))
                    let precioVentaUnitario
                    let valor_unitario
                    let igv
                    let valorTotal
                    let antesimpuesto
                    let totalImpuesto

                    if (data.operacion === 'GRAVADA') {
                        precioVentaUnitario = precio_item
                        valor_unitario = precioVentaUnitario / (1 + porcentaje_igv)
                        igv = valor_unitario * data.cantidad * porcentaje_igv
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        totaloperaGravada += parseFloat(antesimpuesto)
                        totaloperaExonerada += 0
                        totalIGV += parseFloat(totalImpuesto)
                    }

                    if (data.operacion === 'EXONERADA') {
                        precioVentaUnitario = precio_item
                        valor_unitario = precioVentaUnitario
                        igv = 0.0
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = 0.0
                        totaloperaGravada += 0
                        totaloperaExonerada += parseFloat(antesimpuesto)
                        totalIGV += parseFloat(totalImpuesto)
                    }

                    if (data.operacion === 'GRATUITA') {
                        precioVentaUnitario = parseFloat((1 / 1.18).toFixed(2))
                        valor_unitario = precioVentaUnitario
                        igv = 0.0
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        totaloperaGravada += 0
                        totaloperaExonerada += 0
                        total_op_gratuitas += parseFloat(antesimpuesto)
                        totalIGV += 0
                        totalIGV_GRATUITA += 0
                        precioVentaUnitario = valor_unitario
                        valor_unitario = 0.0
                        totalImpuesto = 0.0
                    }

                    if (data.tipoproducto === undefined) {
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
                        factor: data.factor || 1,
                        cargoxconsumo: false,
                        valor_unitario: valor_unitario.toFixed(5),
                        valor_total: valorTotal.toFixed(2),
                        igv: igv.toFixed(2),
                        total_antes_impuestos: antesimpuesto.toFixed(2),
                        total_impuestos: totalImpuesto.toFixed(2),
                        precioVentaUnitario: this.redondear(precioVentaUnitario)
                    })

                    if (index === array.length - 1) {
                        const dataR = {
                            item: item,
                            totaloperaGravada: totaloperaGravada.toFixed(2),
                            totaloperaExonerada: totaloperaExonerada.toFixed(2),
                            total_op_gratuitas: total_op_gratuitas.toFixed(2),
                            totalIGV: totalIGV.toFixed(2),
                            totalIGV_GRATUITA: totalIGV_GRATUITA.toFixed(2),
                            total_cargo: total_cargo.toFixed(2)
                        }
                        resolve(dataR)
                    }
                })
            })
            return a
        },

        async sumacontadores() {
            let campo = ''

            if (this.info_comprobante.tipocomprobante === 'F') {
                campo = 'ordenncredito_f'
            }

            if (this.info_comprobante.tipocomprobante === 'B') {
                campo = 'ordenncredito'
            }

            if (!campo) return false

            await sumaContador(
                campo,
                (parseInt(this.ordenNcredito) + 1).toString().padStart(4, '0')
            )

            return true
        },

        obtencodigomotivo(motivo) {
            const array = store.state.motivosSunat
            let codigo = '01'
            for (let i = 0; i < array.length; i++) {
                if (array[i].nombre === motivo) {
                    codigo = array[i].codigo
                }
            }
            return codigo
        },

        sumaTotalmodopago() {
            let suma = 0
            for (let i = 0; i < this.modopagos.length; i++) {
                suma += parseFloat(this.modopagos[i].monto)
            }
            return parseFloat(suma).toFixed(2)
        },

        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },

        verdate() {
            let fecha = moment(String(this.date)) / 1000
            if (
                moment(String(new Date())).format('YYYY-MM-DD') ===
                moment(String(this.date)).format('YYYY-MM-DD')
            ) {
                fecha = moment().unix()
            }
            return fecha
        },

        cierra() {
            this.$emit('cierra', false)
        }
    }
}
</script>
