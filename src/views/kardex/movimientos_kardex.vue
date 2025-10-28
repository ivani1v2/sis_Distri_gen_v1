<template>
    <div class="mb-6 pa-4">
        <v-row class="mb-n5 mt-n2" dense>
            <v-col cols="7">
                <h4>Movimientos de Kardex</h4>
                <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mt-n3' : 'mb-4 mt-n4'">
                    <v-col cols="12" md="3" xs="12" v-if="true">
                        <v-btn v-if="true" color="success" class="btn mt-2" block small
                            @click="abre_creador_documento()">REGISTRO
                            COMPRA</v-btn>
                    </v-col>
                    <v-col v-if="true" cols="12" md="3" xs="12">
                        <v-btn color="error" class="mt-2" block small
                            @click="(crea_ajuste = true)">Entradas/Salidas</v-btn>
                    </v-col>
                    <v-col cols="12" md="3" xs="12">
                        <v-btn color="success" class="btn mt-2" block small @click="registro_merma">Registro
                            Merma</v-btn>
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="5">
                <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mt-4' : 'mb-n7 mt-n1 text-center'">
                    <v-col cols="12" md="6" xs="12">
                        <v-text-field type="date" class="redondeado" outlined dense v-model="date1"
                            label="INICIO"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" xs="12">
                        <v-text-field type="date" class="redondeado" outlined dense v-model="date2"
                            label="INICIO"></v-text-field>
                    </v-col>

                </v-row>
            </v-col>
        </v-row>

        <v-card>
            <v-simple-table fixed-header height="70vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                             <th class="text-left">
                                Id mov
                            </th>
                            <th class="text-left">
                                Razon social
                            </th>
                            <th class="text-left">
                                Documento
                            </th>
                            <th class="text-left">
                                Ref
                            </th>
                            <th class="text-left">
                                Fecha Emision
                            </th>
                            <th class="text-left">
                                Fecha Ing. Prod
                            </th>
                            <th class="text-left">
                                MODO
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
 <td>{{ item.id }}</td>
                            <td>{{ conviertefecha(item.fecha_ingreso) }}</td>
                            <td>{{ item.num_doc }}-{{ item.nom_proveedor }}</td>
                            <td v-if="item.operacion == 'COMPRA'">
                                {{ item.tipodocumento }}
                            </td>
                            <td v-if="item.operacion == 'AJUSTE'">
                                -
                            </td>
                            <td v-if="item.operacion == 'AJUSTE'">
                                {{ item.motivo }}
                            </td>
                            <td v-if="item.operacion == 'COMPRA'">
                                {{ item.sreferencia }}-{{ item.creferencia }}
                            </td>
                            <td>{{ conviertefecha(item.fecha_emision) }}</td>
                            <td>{{ conviertefecha(item.fecha_ingreso) }}</td>
                            <td>{{ item.modo_pago }}</td>
                            <td>S/.{{ item.total }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="6">
                                        <v-icon color="green" @click.prevent="edita_compra(item)">mdi-pencil</v-icon>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-icon color="green" @click.prevent="abre_visualizacion(item)">mdi-eye</v-icon>
                                    </v-col>
                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>
        <v-dialog v-model="crea_movimiento" max-width="800px" persistent>

            <div>
                <v-system-bar window dark>
                    <v-icon @click="crea_movimiento = !crea_movimiento">mdi-close</v-icon>
                    <h5 class="text-center">REGISTRO DE COMPRAS</h5>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-2">
                <v-row class="pa-1" dense>
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date_ingreso"
                            label="Ingreso Producto"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="12" md="6" xs="12">
                        <v-text-field outlined dense v-model="num_doc" label="N° DOC PROVEE." append-icon="mdi-magnify"
                            @click:append="busca_proveedor()"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" xs="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n5' : ''">
                        <v-text-field outlined dense v-model="nom_proveedor" label="NOMBRE PROVEEDOR"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="12" md="4" xs="12">
                        <v-select :items="arraydocumento" label="Tipo" dense outlined
                            v-model="tipodocumento"></v-select>
                    </v-col>
                    <v-col cols="6" md="4" xs="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n5' : ''">
                        <v-text-field :disabled="(num_doc == '')" type="text" outlined dense v-model="sreferencia"
                            label="Serie Referencia" placeholder="F001"></v-text-field>
                    </v-col>
                    <v-col cols="6" md="4" xs="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n5' : ''">
                        <v-text-field :disabled="(sreferencia == '')" type="number" outlined dense v-model="creferencia"
                            label="Correlativo Referencia" placeholder="1234"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="12" md="6" xs="12">
                        <v-select :items="arraymodo" label="Modo Pago" dense outlined v-model="modo_pago"></v-select>
                    </v-col>
                    <v-col cols="12" md="6" xs="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n4' : ''">
                        <v-textarea outlined dense v-model="observacion" auto-grow filled label="OBSERVACION"
                            rows="1"></v-textarea>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n2" dense>
                    <v-col cols="12">
                        <v-btn block class="" @click="nueva_compra()" color="success">Crea Documento</v-btn>
                    </v-col>
                </v-row>

            </v-card>

        </v-dialog>
        <v-dialog v-model="crea_ajuste" max-width="800px" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(crea_ajuste = !crea_ajuste)">mdi-close</v-icon>
                    <h5 class="text-center">ENTRADA SALIDA</h5>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="pa-1" dense>
                    <v-col cols="6" md="4" xs="6">
                        <v-select :disabled="!$store.state.permisos.es_admin" :items="arrayajuste"
                            label="Tipo movimiento" dense outlined v-model="modo_ajuste"></v-select>
                    </v-col>
                    <v-col cols="6" md="4" xs="6">
                        <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" xs="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n5' : ''">
                        <v-text-field type="date" outlined dense v-model="date_ingreso"
                            label="Fecha de movimiento Producto"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="12" md="6" xs="12">
                        <v-select :disabled="!$store.state.permisos.es_admin" :items="$store.state.motivos_ajuste"
                            label="Motivo" dense outlined v-model="motivos_ajuste"></v-select>
                    </v-col>
                    <v-col cols="12" md="6" xs="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n5' : ''">
                        <v-textarea outlined dense v-model="observacion" auto-grow filled label="OBSERVACION"
                            rows="1"></v-textarea>
                    </v-col>

                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="12" md="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n1' : ''">
                        <v-textarea outlined dense v-model="responsable" auto-grow filled label="RESPONSABLE"
                            rows="1"></v-textarea>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n2" dense>
                    <v-col cols="12">
                        <v-btn block class="" @click="nuevo_ajuste()" color="success">Crea Documento</v-btn>
                    </v-col>
                </v-row>

            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_detalle" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_detalle = !dial_detalle">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                <v-icon color="success" @click="impreme_rep()">mdi-printer</v-icon>
                </v-system-bar>
                
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>
                <v-simple-table dark fixed-header max-width="75vh" dense>
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
                                    Cantidad.
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

                            <tr v-for="item in arrayConsolidar" :key="item.id">
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.costo_nuevo }}</td>
                                <td>S/.{{ redondear(item.costo_nuevo * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>
        <v-dialog v-model="dial_proveedor" max-width="1100px">
            <tabla_proveedor v-if="dial_proveedor" @respuesta="completa_proveedor($event)" />
        </v-dialog>

        <compras v-if="dialo_compras" :data="data_edita" @cierra_compra="dialo_compras = $event" />


        <ajuste_inv v-if="dialo_ajuste" :data="data_edita" @cierra_compra="dialo_ajuste = $event" />


    </div>
</template>

<script>
import {
    allMovimientos,
    obtenContador,
    nuevoMovimiento,
    sumaContador,
} from '../../db'
import store from '@/store/index'
import { generarPDFCompra } from "./formatos/form_kardex";
import moment from 'moment'
import compras from '@/views/movi_kardex/compras'
import ajuste_inv from '@/views/movi_kardex/ajuste_inventario'

import tabla_proveedor from '@/components/configEmpresa/tabla_proveedor'

export default {
    components: {
        compras,
        tabla_proveedor,
        ajuste_inv,
    },
    data: () => ({
        dial_proveedor: false,
        dial_detalle: false,
        dial_transferencia: false,
        date1: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        crea_ajuste: false,
        crea_transferencia: false,
        dialo_ajuste: false,
        crea_nc: false,
        dialo_nc: false,
        dialo_compras: false,
        ver_compras: false,
        crea_movimiento: false,
        dialogoproveedor: false,
        dial_selec_compra: false,
        selecciona_periodo: false,
        arraydocumento: ['FACTURA', 'BOLETA', 'NOTA DE VENTA'],
        tipodocumento: 'FACTURA',
        sreferencia: '',
        creferencia: '',
        observacion: '',
        num_doc: '',
        nom_proveedor: '',
        arraymodo: ['CONTADO', 'CREDITO'],
        modo_pago: 'CONTADO',
        arrayajuste: ['ENTRADA', 'SALIDA'],
        modo_ajuste: 'ENTRADA',
        motivos_ajuste: 'PRODUCCION',
        cabecera: [],
        desserts: [],
        periodo: '',
        lista_productos: [],
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date_ingreso: moment(String(new Date)).format('YYYY-MM-DD'),
        buscar: '',
        data_edita: [],
        motivo: 'Anulación de la operación',
        periodo_compra: '',
        lista_compras: [],
        array_cabe_ref: [],
        arrayConsolidar: [],
        almacen: '',
        responsable: '',
        item_selecto: [],
    }),
    mounted() {
        allMovimientos()
            .orderByChild('fecha_emision')
            .startAt(moment(String(this.date1)) / 1000)
            .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
            .on("value", this.onDataChange);
    },
    beforeDestroy() {
        allMovimientos().off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            allMovimientos()
                .orderByChild('fecha_emision')
                .startAt(moment(String(this.date1)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .on("value", this.onDataChange);
            return this.desserts
        }
    },
    created() {
        this.inicio()
    },
    methods: {
        registro_merma() {
            this.crea_ajuste = true
            this.motivos_ajuste = 'MERMA'
            this.modo_ajuste = 'SALIDA'
        },
        inicio() {
            var dia = moment(String(new Date)).format('DD')
            this.date1 = moment().subtract(parseFloat(dia) - 1, 'd').format('YYYY-MM-DD')
            this.date2 = moment(String(new Date)).format('YYYY-MM-DD')

        },
        abre_creador_documento() {
            this.limpia_data()
            this.crea_movimiento = true
        },
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                array.push(data);

            });
            console.log(array)
            this.desserts = array;
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        limpia_data() {
            this.lista_productos = []
            this.dialogo_genera = false
            this.observacion = ''
            this.sreferencia = ''
            this.creferencia = ''
            this.num_doc = ''
            this.nom_proveedor = ''
            this.edita_app = false
            this.date = moment(String(new Date)).format('YYYY-MM-DD')
            this.date_ingreso = moment(String(new Date)).format('YYYY-MM-DD')
        },
        busca_proveedor() {
            this.dial_proveedor = true
        },
        completa_proveedor(item) {
            this.dial_proveedor = false
            this.num_doc = item.codigo
            this.nom_proveedor = item.rsocial
        },
        async nueva_compra() {

           
                const snapshot = await obtenContador().once("value")
                if (this.tipodocumento == 'FACTURA') {
                    var cod_doc = '01'
                }
                if (this.tipodocumento == 'BOLETA') {
                    var cod_doc = '03'
                }
                if (this.tipodocumento == 'NOTA DE VENTA') {
                    var cod_doc = '00'
                }
                var conta = snapshot.val().orden_movimientos
                if (conta == undefined) {
                    conta = '00001'
                }

                var array = {
                    id: conta,
                    periodo: this.periodo,
                    operacion: 'COMPRA',
                    fecha_creacion: moment().unix(),
                    fecha_emision: this.conviertefecha_unix(this.date),
                    fecha_ingreso: this.conviertefecha_unix(this.date_ingreso),
                    tipodocumento: this.tipodocumento,
                    cod_doc: cod_doc,
                    sreferencia: this.sreferencia,
                    creferencia: this.creferencia,
                    num_doc: this.num_doc,
                    nom_proveedor: this.nom_proveedor,
                    modo_pago: this.modo_pago,
                    observacion: this.observacion,
                    baseimponible: 0,
                    igv: 0,
                    porc_igv: 0,
                    tot_gratuita: 0,
                    tot_exonerada: 0,
                    total: 0,
                    responsable: store.state.permisos.correo.slice(0, -13),
                    data: [],
                }
                this.data_edita = array
                await nuevoMovimiento(array.id, array)
                await sumaContador("orden_movimientos", (parseInt(array.id) + 1).toString().padStart(5, 0))
                this.dialo_compras = true
                this.crea_movimiento = false
         
        },
        async nuevo_ajuste() {
            if (this.responsable == '') {
                alert('Ingrese el responsable del movimiento')
                return
            }
            const snapshot = await obtenContador().once("value")
            var conta = snapshot.val().orden_movimientos
            if (conta == undefined) {
                conta = '00001'
            }
            var array = {
                id: conta,
                periodo: this.periodo,
                operacion: 'AJUSTE',
                fecha_creacion: moment().unix(),
                fecha_emision: this.conviertefecha_unix(this.date),
                fecha_ingreso: this.conviertefecha_unix(this.date_ingreso),
                tipodocumento: this.modo_ajuste,
                modo_ajuste: this.modo_ajuste,
                motivo: this.motivos_ajuste,
                cod_doc: '00',
                sreferencia: this.sreferencia,
                creferencia: this.modo_ajuste,
                num_doc: '',
                nom_proveedor: this.modo_ajuste,
                modo_pago: '',
                observacion: this.observacion,
                baseimponible: 0,
                igv: 0,
                porc_igv: 0,
                tot_gratuita: 0,
                tot_exonerada: 0,
                total: 0,
                responsable: store.state.permisos.correo.slice(0, -13),
                data: [],
            }
            this.data_edita = array
            await nuevoMovimiento(array.id, array)
            await sumaContador("orden_movimientos", (parseInt(array.id) + 1).toString().padStart(5, 0))
            this.dialo_ajuste = true
            this.crea_ajuste = false
        },
        edita_compra(data) {
            this.data_edita = data
            if (data.operacion == 'DEVOLUCION DE COMPRA') {
                this.dialo_nc = true
            }
            if (data.operacion == 'COMPRA') {
                this.dialo_compras = true
            }
            if (data.operacion == "AJUSTE") {
                this.dialo_ajuste = true
            }
        },
        conviertefecha_unix(date) {
            return moment(String(date)) / 1000
        },
        abre_visualizacion(item) {
           
            console.log(item)
            this.item_selecto = item
            this.arrayConsolidar = item.data
            this.dial_detalle = true
        },
        impreme_rep() {
            generarPDFCompra(this.item_selecto)
        }

    }

}
</script>
