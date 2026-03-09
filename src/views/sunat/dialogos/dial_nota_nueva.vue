<template>
    <v-dialog v-model="dial" max-width="1100px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>

                <v-btn x-small color="info" @click="limpiar_items">
                    Limpiar Items
                </v-btn>

                <v-btn x-small color="success" class="ml-2" @click="dialogoCatalogo = true">
                    Agregar Productos
                </v-btn>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-row dense>
                <v-col cols="12" md="3">
                    <v-text-field
                        type="date"
                        outlined
                        dense
                        v-model="date"
                        label="Emisión"
                    />
                </v-col>

                <v-col cols="12" md="3">
                    <v-select
                        outlined
                        dense
                        v-model="tipoReferencia"
                        :items="tiposReferencia"
                        label="Tipo Doc. Ref."
                        item-text="text"
                        item-value="value"
                    />
                </v-col>

                <v-col cols="12" md="3">
                    <v-text-field
                        outlined
                        dense
                        v-model="serieReferencia"
                        label="Serie Ref."
                        placeholder="F001 / B001"
                    />
                </v-col>

                <v-col cols="12" md="3">
                    <v-text-field
                        outlined
                        dense
                        v-model="correlativoReferencia"
                        label="Correlativo Ref."
                        placeholder="1234"
                    />
                </v-col>
            </v-row>

            <!-- DATOS CLIENTE -->
            <v-row dense class="mt-n2">
                <v-col cols="12" md="3">
                    <v-select
                        outlined
                        dense
                        v-model="documento"
                        :items="documentos"
                        label="Tipo Doc"
                    />
                </v-col>

                <v-col cols="12" md="3">
                    <v-text-field
                        outlined
                        dense
                        v-model="dni"
                        label="Número Documento"
                        append-icon="mdi-magnify"
                        @click:append="BuscarDocumento"
                        @keyup.enter="BuscarDocumento"
                    />
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field
                        outlined
                        dense
                        v-model="cliente"
                        label="Cliente"
                    />
                </v-col>
            </v-row>

            <v-row dense class="mt-n2">
                <v-col cols="12" md="8">
                    <v-text-field
                        outlined
                        dense
                        v-model="direccion"
                        label="Dirección"
                    />
                </v-col>

                <v-col cols="12" md="4">
                    <v-text-field
                        outlined
                        dense
                        v-model="telfcliente"
                        label="Teléfono"
                    />
                </v-col>
            </v-row>

            <v-row dense class="mt-n2">
                <v-col cols="12" md="8">
                    <v-select
                        outlined
                        dense
                        v-model="motivo"
                        :items="$store.state.motivosSunat"
                        item-text="nombre"
                        item-value="nombre"
                        label="Motivo de Nota de Crédito"
                    />
                </v-col>

                <v-col cols="12" md="4">
                    <v-switch
                        dense
                        class="mt-1"
                        v-model="regresar_stock"
                        label="Regresar stock"
                        inset
                    />
                </v-col>
            </v-row>

            <v-card outlined class="pa-2 mt-2">
                <v-row dense>
                    <v-col cols="12" md="4">
                        <strong>Referencia:</strong>
                        {{ tipoReferencia }} {{ serieReferencia }}-{{ correlativoReferencia }}
                    </v-col>
                    <v-col cols="12" md="4">
                        <strong>Cliente:</strong>
                        {{ dni }} - {{ cliente }}
                    </v-col>
                    <v-col cols="12" md="4" class="text-md-right">
                        <strong>Total:</strong> {{ moneda }} {{ redondear(sumaTotal()) }}
                    </v-col>
                </v-row>
            </v-card>

            <v-card class="pa-2 mt-3" elevation="4">
                <v-simple-table fixed-header height="40vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Código</th>
                                <th class="text-left">Descripción</th>
                                <th class="text-left">Medida</th>
                                <th class="text-right">Cant.</th>
                                <th class="text-right">Precio</th>
                                <th class="text-right">Total</th>
                                <th class="text-center">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-if="!listaproductos.length">
                                <td colspan="7" class="text-center grey--text">
                                    No hay productos agregados
                                </td>
                            </tr>

                            <tr
                                v-for="(item, index) in listaproductos"
                                :key="item.id + '_' + index"
                            >
                                <td>{{ item.id }}</td>
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
<td class="text-right">{{ item.cantidad }}</td>
<td class="text-right">{{ redondear(item.precio) }}</td>
<td class="text-right">{{ redondear(item.cantidad * item.precio) }}</td>
                                <td class="text-center">
                                    <v-btn icon small color="info" @click="editaProducto(index)">
                                        <v-icon small>mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn icon small color="red" @click="eliminaedita(index)">
                                        <v-icon small>mdi-delete</v-icon>
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

            <v-row class="mt-2" dense>
                <v-col cols="12" md="4">
                    <h2>Total: {{ moneda }} {{ redondear(sumaTotal()) }}</h2>
                </v-col>
                <v-spacer />
                <v-col cols="12" md="3">
                    <v-btn
                        block
                        color="error"
                        elevation="10"
                        rounded
                        :disabled="!puedeGenerar"
                        @click="obtencorrelativo()"
                    >
                        GENERAR NC
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
                    <v-col cols="4">
                        <v-icon @click="suma()" color="green">mdi-plus</v-icon>
                    </v-col>

                    <v-col cols="4">
                        <v-text-field
                            dense
                            type="number"
                            outlined
                            v-model.number="cantidadEdita"
                            label="Cantidad"
                            @keyup.enter="grabaEdita()"
                        />
                    </v-col>

                    <v-col cols="4">
                        <v-icon @click="resta()" color="red">mdi-minus</v-icon>
                    </v-col>
                </v-row>

                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12" class="mb-n4 mt-n4">
                        <v-text-field disabled dense class="pa-3" v-model="nombreEdita" label="Nombre" />
                    </v-col>

                    <v-col cols="12">
                        <v-text-field
                            dense
                            type="number"
                            class="pa-3"
                            v-model.number="precioedita"
                            label="Precio"
                            @keyup.enter="grabaEdita()"
                        />
                    </v-col>
                </v-row>

                <v-card-actions class="mt-n6">
                    <v-btn color="red darken-1" text @click="eliminaedita(indexEdita)">
                        Elimina
                    </v-btn>

                    <v-spacer></v-spacer>

                    <v-btn color="green darken-1" text @click="grabaEdita()">
                        Graba
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- DIALOG CONFIRMACION -->
        <v-dialog v-model="dialogoanula" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoanula = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-title>
                    ¿Está seguro de generar la Nota de Crédito?
                </v-card-title>
                <v-card-text>
                    CORRELATIVO: {{ serienc }}-{{ ordenNcredito }}
                </v-card-text>
                <v-card-text>
                    TOTAL: {{ moneda }} {{ sumaTotal() }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="Genera()" color="success">Generar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogoCatalogo" max-width="650px">
    <div>
        <v-system-bar window dark>
            <v-icon @click="dialogoCatalogo = false">mdi-close</v-icon>
            <v-spacer></v-spacer>
        </v-system-bar>
    </div>

    <v-card class="pa-1">
        <cat_fijo
            v-if="dialogoCatalogo"
            ref="catFijoNC"
            @agrega_lista="agregar_lista($event)"
            :muestra_tabla="true"
            :x_categoria="false"
            :lista_precios="lista_precios_selecta"
        />
    </v-card>
</v-dialog>
    </v-dialog>
</template>

<script>
import {
    obtenContador,
    sumaContador,
    grabaEstadoComprobanteNCD,
    grabaCabeceraNCD,
    grabaDetalleNCD
} from '../../../db'
import { crearOActualizarCliente as nuevoCliente, colClientes } from '../../../db_firestore'
import { envioNCredito } from '../../../servidorsunat'
import moment from 'moment'
import { pdfGenera } from '../../../pdf_notaCD'
import { modifica_stock_array } from '../../../control_stock'
import store from '@/store/index'
import cat_fijo from '@/components/catalogo_fijo'

export default {
    name: 'dialogoNotaNueva',
    components: {
        cat_fijo
    },

    data() {
        return {
            dial: true,
            date: moment(String(new Date)).format('YYYY-MM-DD'),

            dialogoProducto: false,
            dialogoanula: false,
            dialogoCatalogo: false,

            regresar_stock: false,

            tipoReferencia: '01',
            tiposReferencia: [
                { text: 'Factura', value: '01' },
                { text: 'Boleta', value: '03' }
            ],

            documentos: ['DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',

            serieReferencia: '',
            correlativoReferencia: '',
            dni: '',
            cliente: '',
            direccion: '',
            departamento: '',
            provincia: '',
            distrito: '',
            ubigeo: '',
            telfcliente: '',

            listaproductos: [],
            lista_precios_selecta: ['1', '2', '3'],

            indexEdita: -1,
            cantidadEdita: 1,
            precioedita: 0,
            nombreEdita: '',

            motivo: 'Anulación de la operación',
            serienc: '',
            ordenNcredito: '',
            data_array: [],
            moneda: 'S/',
            porcentaje_igv: 18
        }
    },

    computed: {
        puedeGenerar() {
            return (
                this.listaproductos.length > 0 &&
                this.serieReferencia &&
                this.correlativoReferencia &&
                this.cliente &&
                this.dni
            )
        }
    },

    watch: {
        motivo: {
            immediate: true,
            handler(val) {
                const motivosRegresanStock = [
                    'Anulación de la operación',
                    'Anulación por error en el RUC',
                    'Devolución total',
                    'Devolución por ítem',
                ]
                this.regresar_stock = motivosRegresanStock.includes(val)
            }
        }
    },

    created() {
        this.moneda = this.$store.state.moneda.find(
            m => m.codigo === this.$store.state.configuracion.moneda_defecto
        )?.simbolo || 'S/'
    },

    methods: {
        getDireccionPreferida(data = {}) {
            let dir = (data.direccion || '').trim()

            if (!dir && Array.isArray(data.direcciones) && data.direcciones.length > 0) {
                const d0 = data.direcciones[0] || {}
                dir = (d0.direccion || '').trim()
            }

            return dir
        },

        async BuscarDocumento() {
            if (this.dni === '') {
                store.commit('dialogosnackbar', 'Ingrese número de documento')
                return
            }

            try {
                store.commit('dialogoprogress')

                const num = String(this.dni).trim()

                if (num.length === 11) this.documento = 'RUC'
                else if (num.length === 8) this.documento = 'DNI'

                const docSnap = await colClientes().doc(num).get()

                if (docSnap.exists) {
                    const data = docSnap.data() || {}

                    if (data.nombre) this.cliente = data.nombre

                    const dirFinal = this.getDireccionPreferida(data)
                    if (dirFinal) this.direccion = dirFinal

                    if (data.departamento) this.departamento = data.departamento
                    if (data.provincia) this.provincia = data.provincia
                    if (data.distrito) this.distrito = data.distrito
                    if (data.ubigeo) this.ubigeo = data.ubigeo
                    if (data.telefono) this.telfcliente = data.telefono

                    store.commit('dialogoprogress')
                    return
                }

                const {
                    nombre,
                    direccion,
                    departamento,
                    provincia,
                    distrito,
                    ubigeo
                } = await this.$store.dispatch('busca_cliente', {
                    documento: this.documento,
                    numero: this.dni,
                })

                await nuevoCliente(this.dni, {
                    nombre: nombre || '',
                    tipodoc: this.documento,
                    documento: this.dni,
                    id: this.dni,
                    direccion: direccion || '',
                    departamento: departamento || '',
                    provincia: provincia || '',
                    distrito: distrito || '',
                    ubigeo: ubigeo || '',
                    sede: store.state.sedeActual.codigo
                })

                if (nombre) this.cliente = nombre
                if (direccion) this.direccion = direccion
                if (departamento) this.departamento = departamento
                if (provincia) this.provincia = provincia
                if (distrito) this.distrito = distrito
                if (ubigeo) this.ubigeo = ubigeo

                store.commit('dialogoprogress')
            } catch (error) {
                console.error(error)
                store.commit('dialogoprogress')
                store.commit('dialogosnackbar', 'Error al obtener datos del cliente')
            }
        },

        limpiar_items() {
            this.listaproductos = []
        },

        agregar_lista(value) {
            const linea = Array.isArray(value) ? value[0] : value
            if (!linea) return

            const presentacionId = linea._presentacion_id || null
            const operacion = linea.operacion || 'GRAVADA'
            const precio = Number(linea.precio || 0)

            const index = this.listaproductos.findIndex(p =>
                String(p.id) === String(linea.id) &&
                String(p.medida || '') === String(linea.medida || '') &&
                String(p._presentacion_id || '') === String(presentacionId || '') &&
                String(p.operacion || 'GRAVADA') === String(operacion) &&
                Number(p.precio || 0) === precio
            )

            if (index >= 0) {
                this.listaproductos[index].cantidad =
                    Number(this.listaproductos[index].cantidad || 0) + Number(linea.cantidad || 0)
            } else {
               this.listaproductos.push({
    ...linea,
    cantidad: Number(linea.cantidad || 1),
    precio: Number(linea.precio || 0),
    precioedita: Number(linea.precio || 0),
    preciodescuento: Number(linea.preciodescuento || 0),
    cod_medida: linea.cod_medida || 'NIU'
})
            }

            this.dialogoCatalogo = false
        },

        editaProducto(index) {
            const prod = this.listaproductos[index]
            if (!prod) return

            this.indexEdita = index
            this.cantidadEdita = Number(prod.cantidad || 1)
            this.precioedita = Number(prod.precio || 0)
            this.nombreEdita = prod.nombre || ''
            this.dialogoProducto = true
        },

        suma() {
            this.cantidadEdita = Number(this.cantidadEdita || 0) + 1
        },

        resta() {
            if (Number(this.cantidadEdita) > 1) {
                this.cantidadEdita = Number(this.cantidadEdita) - 1
            }
        },

        grabaEdita() {
            if (this.indexEdita < 0) return

            this.listaproductos[this.indexEdita].cantidad = Number(this.cantidadEdita || 1)
            this.listaproductos[this.indexEdita].precio = Number(this.precioedita || 0)
            this.listaproductos[this.indexEdita].precioedita = Number(this.precioedita || 0)
            this.dialogoProducto = false
        },

        eliminaedita(index) {
            if (index >= 0) {
                this.listaproductos.splice(index, 1)
            }
            this.dialogoProducto = false
        },

        sumaTotal() {
            let suma = 0
            for (let i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].operacion !== 'GRATUITA') {
                    suma += Number(this.listaproductos[i].cantidad || 0) * Number(this.listaproductos[i].precio || 0)
                }
            }
            return Number(suma).toFixed(2)
        },

        obtencorrelativo() {
            if (!this.puedeGenerar) {
                store.commit('dialogosnackbar', 'Complete referencia, cliente y agregue items')
                return
            }

            this.completa_items(this.listaproductos).then(r => {
                this.data_array = r
                obtenContador().once('value').then(snapshot => {
                    if (!snapshot.exists()) return

                    this.serienc = this.tipoReferencia === '01'
                        ? 'FN' + store.state.seriesdocumentos.notacredito
                        : 'BN' + store.state.seriesdocumentos.notacredito

                    this.ordenNcredito = snapshot.val().ordenncredito
                    this.dialogoanula = true
                })
            })
        },

        comparafecha() {
            const hoy = moment(String(new Date())).add(-5, 'd').format('YYYY-MM-DD')
            const fecha = moment(String(this.date)).format('YYYY-MM-DD')
            return moment(fecha).isAfter(hoy)
        },

        async Genera() {
            const data = this.data_array

            if (!this.comparafecha()) {
                store.commit('dialogosnackbar', 'FECHA EXCEDE EL LIMITE PERMITIDO')
                return
            }

            try {
                store.commit('dialogoprogress', 1)

                const fechahoy = this.verdate()

                const arrayCabecera = {
                    moneda: this.moneda,
                    dni: this.dni,
                    direccion: this.direccion,
                    cliente: this.cliente,
                    telefono: this.telfcliente,
                    total: this.sumaTotal(),
                    numeracion: this.serienc + this.ordenNcredito,
                    descuentos: 0,
                    serie: this.serienc,
                    tipocomprobante: 'NC',
                    correlativo: this.ordenNcredito,
                    fecha: fechahoy,
                    tipo_comp_ref: this.tipoReferencia,
                    serie_comp_ref: this.serieReferencia,
                    correlativo_comp_ref: this.correlativoReferencia,
                    estado: 'PENDIENTE',
                    mensajeSunat: '',
                    hash: '',
                    motivo: this.motivo,
                    porcentaje_igv: this.porcentaje_igv,
                    cod_motivo: this.obtencodigomotivo(this.motivo),
                    total_op_gravadas: data.totaloperaGravada,
                    total_op_exoneradas: data.totaloperaExonerada,
                    total_cargo: data.total_cargo,
                    igv: data.totalIGV,
                    regresar_stock: this.regresar_stock
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
                        const itemsStock = this.listaproductos.map(it => ({
                            id: it.id,
                            cantidad: Number(it.cantidad),
                            medida: it.medida
                        }))
                        await modifica_stock_array('SUMA', itemsStock)
                    } catch (e) {
                        console.error('Error al regresar stock:', e)
                        store.commit('dialogosnackbar', 'Nota generada, pero hubo un problema al regresar stock')
                    }
                }

                if (r.status_message === '0') {
                    await grabaEstadoComprobanteNCD(
                        arrayCabecera.numeracion,
                        'ACEPTADO',
                        r.data,
                        r.hash
                    )
                } else {
                    await grabaEstadoComprobanteNCD(
                        arrayCabecera.numeracion,
                        r.status_message,
                        r.data,
                        r.hash
                    )
                    alert('No aceptada. Revise respuesta SUNAT.')
                }

                store.commit('dialogoprogress', 1)
                this.$emit('generado', true)
            } catch (e) {
                console.error(e)
                store.commit('dialogoprogress', 1)
                store.commit('dialogosnackbar', 'Ocurrió un error al generar la NC')
            }
        },

        completa_items(arrays) {
            let item = []
            let totaloperaGravada = 0
            let totaloperaExonerada = 0
            let total_op_gratuitas = 0
            let totalIGV = 0
            let totalIGV_GRATUITA = 0
            let total_cargo = 0
            const porcentaje_igv = Number(this.porcentaje_igv) / 100

            return new Promise((resolve) => {
                arrays.forEach((items, index, array) => {
                    const data = items
                    let precio_item = parseFloat(this.redondear(data.precio))
                    let precioVentaUnitario = 0
                    let valor_unitario = 0
                    let igv = 0
                    let valorTotal = 0
                    let antesimpuesto = 0
                    let totalImpuesto = 0

                    if (data.operacion === 'GRAVADA') {
                        precioVentaUnitario = precio_item
                        valor_unitario = precioVentaUnitario / (1 + porcentaje_igv)
                        igv = valor_unitario * data.cantidad * porcentaje_igv
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        totaloperaGravada += parseFloat(antesimpuesto)
                        totalIGV += parseFloat(totalImpuesto)
                    }

                    if (data.operacion === 'EXONERADA') {
                        precioVentaUnitario = precio_item
                        valor_unitario = precioVentaUnitario
                        igv = 0
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = 0
                        totaloperaExonerada += parseFloat(antesimpuesto)
                    }

                    if (data.operacion === 'GRATUITA') {
                        precioVentaUnitario = parseFloat((1 / 1.18).toFixed(2))
                        valor_unitario = precioVentaUnitario
                        igv = 0
                        valorTotal = valor_unitario * data.cantidad
                        antesimpuesto = valor_unitario * data.cantidad
                        totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                        total_op_gratuitas += parseFloat(antesimpuesto)
                        precioVentaUnitario = valor_unitario
                        valor_unitario = 0
                        totalImpuesto = 0
                    }

                    if (data.tipoproducto === undefined) {
                        data.tipoproducto = 'BIEN'
                    }

                    item.push({
                        id: data.id,
                        cantidad: data.cantidad,
                        nombre: data.nombre,
                        medida: data.medida,
                        cod_medida: data.cod_medida || 'NIU',
                        precio: data.precio,
                        precioedita: data.precio,
                        tipoproducto: data.tipoproducto,
                        operacion: data.operacion,
                        factor: data.factor || 1,
                        cargoxconsumo: false,
                        valor_unitario: Number(valor_unitario).toFixed(5),
                        valor_total: Number(valorTotal).toFixed(2),
                        igv: Number(igv).toFixed(2),
                        total_antes_impuestos: Number(antesimpuesto).toFixed(2),
                        total_impuestos: Number(totalImpuesto).toFixed(2),
                        precioVentaUnitario: this.redondear(precioVentaUnitario)
                    })

                    if (index === array.length - 1) {
                        resolve({
                            item: item,
                            totaloperaGravada: totaloperaGravada.toFixed(2),
                            totaloperaExonerada: totaloperaExonerada.toFixed(2),
                            total_op_gratuitas: total_op_gratuitas.toFixed(2),
                            totalIGV: totalIGV.toFixed(2),
                            totalIGV_GRATUITA: totalIGV_GRATUITA.toFixed(2),
                            total_cargo: total_cargo.toFixed(2)
                        })
                    }
                })
            })
        },

        async sumacontadores() {
            await sumaContador(
                'ordenncredito',
                (parseInt(this.ordenNcredito) + 1).toString().padStart(4, 0)
            )
            return true
        },

        obtencodigomotivo(motivo) {
            const array = store.state.motivosSunat || []
            let codigo = '01'
            for (let i = 0; i < array.length; i++) {
                if (array[i].nombre === motivo) {
                    codigo = array[i].codigo
                }
            }
            return codigo
        },

        redondear(valor) {
            return parseFloat(valor || 0).toFixed(store.state.configuracion.decimal)
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