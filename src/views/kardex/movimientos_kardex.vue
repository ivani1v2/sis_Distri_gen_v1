<template>
    <div class="pa-4">
        <v-card class="elevation-4 rounded-lg">

            <v-card-title class="pa-4 blue-grey lighten-5">
                <v-icon large left color="blue-grey darken-3">mdi-warehouse</v-icon>
                <span class="text-h5 font-weight-bold blue-grey--text text--darken-3">Historial de Movimientos de
                    Kardex</span>
                <v-spacer></v-spacer>

                <v-row dense class="ml-4" style="max-width: 450px;">
                    <v-col cols="5">
                        <v-text-field outlined dense type="date" v-model="date1" label="Desde" hide-details
                            @change="suscribir"></v-text-field>
                    </v-col>
                    <v-col cols="5">
                        <v-text-field outlined dense type="date" v-model="date2" label="Hasta" hide-details
                            @change="suscribir"></v-text-field>
                    </v-col>
                    <v-col cols="2" class="d-flex align-center">
                        <v-btn icon color="primary" @click="suscribir" class="mt-n6">
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="py-3">
                 <v-alert v-if="periodoCerrado" type="warning" dense class="mb-3 caption" outlined>
                    El período <strong>{{ periodoActualKey }}</strong> está cerrado. No se pueden registrar movimientos.
                </v-alert>
                <v-row dense>
                    <v-col cols="12" md="3">
                        <v-btn small color="success" block @click="abre_creador_documento()" :disabled="periodoCerrado">
                            <v-icon left>mdi-package-variant-closed</v-icon> REGISTRO COMPRA
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-btn small color="info" block @click="(crea_ajuste = true)" :disabled="periodoCerrado">
                            <v-icon left>mdi-swap-horizontal</v-icon> ENTRADAS / SALIDAS
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-btn small color="error" block @click="registro_merma" :disabled="periodoCerrado">
                            <v-icon left>mdi-delete-sweep</v-icon> REGISTRO MERMA
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-btn small color="#26C6DA" class="white--text" block @click="abrirGestionPeriodos">
                            <v-icon left>mdi-calendar-clock</v-icon> GEST. PERIODOS
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="3" class="text-right">
                        <v-btn v-if="false" small color="primary" @click="exportar_excel">
                            <v-icon left>mdi-file-excel</v-icon> Exportar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-simple-table fixed-header height="70vh" dense class="elevation-0">
                <template v-slot:default>
                    <thead>
                        <tr class="blue-grey lighten-5">
                            <th class="text-left font-weight-bold">ID</th>
                            <th class="text-left font-weight-bold">Proveedor / Motivo</th>
                            <th class="text-left font-weight-bold">Observación</th>
                            <th class="text-left font-weight-bold">Documento / Tipo</th>
                            <th class="text-left font-weight-bold">Referencia</th>
                            <th class="text-left font-weight-bold">Emisión / Ingreso</th>
                            <th class="text-left font-weight-bold">Total</th>
                            <th class="text-left font-weight-bold">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td><v-chip x-small>{{ item.id }}</v-chip></td>

                            <td>
                                <span v-if="item.operacion === 'COMPRA'">
                                    {{ item.nom_proveedor }}
                                </span>
                                <span v-else class="font-italic black--text">
                                    {{ item.motivo || item.tipodocumento }}
                                </span>
                                <div class="caption grey--text">{{ item.num_doc }}</div>
                            </td>

                            <td>
                                <span class="caption">{{ item.observacion || '-' }}</span>
                            </td>

                            <td>
                                <v-chip
                                    :color="item.operacion === 'COMPRA' ? 'green lighten-4' : (item.modo_ajuste === 'SALIDA' ? 'red lighten-4' : 'blue lighten-4')"
                                    small>
                                    {{ item.tipodocumento }}
                                </v-chip>
                            </td>

                            <td>
                                <span v-if="item.operacion === 'COMPRA'">
                                    {{ item.sreferencia }}-{{ item.creferencia }}
                                </span>
                                <span v-else>-</span>
                            </td>

                            <td>
                                <span class="caption">E: {{ conviertefecha(item.fecha_emision) }}</span><br>
                                <span class="caption">I: {{ conviertefecha(item.fecha_ingreso) }}</span>
                            </td>

                            <td class="font-weight-bold">
                                {{ monedaSimbolo }}{{ redondear(item.total) }}
                                <div class="caption grey--text">{{ item.modo_pago }}</div>
                            </td>

                            <td width="100">
                                <v-menu offset-y>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon v-bind="attrs" v-on="on" small>
                                            <v-icon>mdi-dots-vertical</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click.prevent="edita_compra(item)"
                                            :disabled="item.motivo == 'TRANSFERENCIA ENTRE SEDES'">
                                            <v-list-item-icon><v-icon
                                                    color="warning">mdi-pencil</v-icon></v-list-item-icon>
                                            <v-list-item-title>Editar Movimiento</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="abre_visualizacion(item)">
                                            <v-list-item-icon><v-icon color="info">mdi-eye</v-icon></v-list-item-icon>
                                            <v-list-item-title>Ver Detalle</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <v-dialog v-model="crea_movimiento" max-width="800px" persistent>
            <v-card class="rounded-lg">
                <v-toolbar color="success" dense dark>
                    <v-toolbar-title>Crear Registro de Compra</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="crea_movimiento = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="6">
                            <v-text-field type="date" outlined dense v-model="date"
                                label="Fecha Emisión"></v-text-field>
                        </v-col>
                        <v-col cols="6">
                            <v-text-field type="date" outlined dense v-model="date_ingreso"
                                label="Fecha Ingreso Producto"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="12" md="6">
                            <v-text-field outlined dense v-model="num_doc" label="N° DOC PROVEE."
                                append-icon="mdi-magnify" @click:append="busca_proveedor()"></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field outlined dense v-model="nom_proveedor"
                                label="NOMBRE PROVEEDOR"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="4">
                            <v-select :items="arraydocumento" label="Tipo" dense outlined
                                v-model="tipodocumento"></v-select>
                        </v-col>
                        <v-col cols="4">
                            <v-text-field :disabled="(num_doc == '')" type="text" outlined dense v-model="sreferencia"
                                label="Serie Referencia" placeholder="F001"></v-text-field>
                        </v-col>
                        <v-col cols="4">
                            <v-text-field :disabled="(sreferencia == '')" type="number" outlined dense
                                v-model="creferencia" label="Correlativo Referencia" placeholder="1234"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="6">
                            <v-select :items="arraymodo" label="Modo Pago" dense outlined
                                v-model="modo_pago"></v-select>
                        </v-col>
                        <v-col cols="6">
                            <v-select v-model="moneda" :items="$store.state.moneda"
                                :item-text="item => `${item.simbolo} ${item.moneda} (${item.codigo})`" return-object
                                label="Moneda" outlined dense hide-details></v-select>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="12">
                            <v-textarea outlined dense v-model="observacion" auto-grow filled label="OBSERVACION"
                                rows="1"></v-textarea>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn block large @click="nueva_compra()" color="success">
                        <v-icon left>mdi-plus-circle</v-icon> CREAR DOCUMENTO
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="crea_ajuste" max-width="800px" persistent>
            <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark>
                    <v-toolbar-title>Crear Movimiento de Ajuste (Entrada/Salida)</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="crea_ajuste = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="4">
                            <v-select :disabled="!$store.state.permisos.es_admin" :items="arrayajuste"
                                label="Tipo movimiento" dense outlined v-model="modo_ajuste"></v-select>
                        </v-col>
                        <v-col cols="4">
                            <v-text-field type="date" outlined dense v-model="date"
                                label="Fecha Emisión"></v-text-field>
                        </v-col>
                        <v-col cols="4">
                            <v-text-field type="date" outlined dense v-model="date_ingreso"
                                label="Fecha de Movimiento"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="6">
                            <v-select :disabled="!$store.state.permisos.es_admin" :items="$store.state.motivos_ajuste"
                                label="Motivo" dense outlined v-model="motivos_ajuste"></v-select>
                        </v-col>
                        <v-col cols="6">
                            <v-textarea outlined dense v-model="observacion" auto-grow filled label="OBSERVACIÓN"
                                rows="1"></v-textarea>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="12">
                            <v-textarea outlined dense v-model="responsable" auto-grow filled label="RESPONSABLE"
                                rows="1"></v-textarea>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn block large @click="nuevo_ajuste()" color="info">
                        <v-icon left>mdi-plus-circle</v-icon> CREAR DOCUMENTO DE AJUSTE
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_detalle" max-width="850px">
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark>
                    <v-toolbar-title>Detalle de Movimiento: {{ item_selecto.id }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon color="success" @click="impreme_rep()"><v-icon>mdi-printer</v-icon></v-btn>
                    <v-btn icon @click="dial_detalle = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <h5 class="text-subtitle-1 mb-3">
                        <span v-if="item_selecto.operacion === 'COMPRA'">Proveedor: {{ item_selecto.nom_proveedor
                        }}</span>
                        <span v-else>Motivo: {{ item_selecto.motivo }}</span>
                    </h5>
                    <h4 v-if="item_selecto.motivo == 'TRANSFERENCIA ENTRE SEDES'"> ORIGEN : {{
                        nombreSede(item_selecto.sreferencia) }} DESTINO: {{ nombreSede(item_selecto.creferencia)
                        }}</h4>
                    <v-simple-table fixed-header height="60vh" dense class="elevation-1">
                        <template v-slot:default>
                            <thead class="grey darken-3 white--text">
                                <tr>
                                    <th class="text-left white--text">Descripción</th>
                                    <th class="text-left white--text">Medida</th>
                                    <th class="text-center white--text">Cantidad</th>
                                    <th class="text-right white--text">Precio Unit.</th>
                                    <th class="text-right white--text">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in arrayConsolidar" :key="index">
                                    <td>{{ item.nombre }}</td>
                                    <td>{{ item.medida }}</td>
                                    <td class="text-center">{{ item.cantidad }}</td>
                                    <td class="text-right">{{ item_selecto.moneda || 'S/.' }}{{
                                        redondear(item.costo_nuevo) }}</td>
                                    <td class="text-right font-weight-bold">{{ item_selecto.moneda || 'S/.' }}{{
                                        redondear(item.costo_nuevo * item.cantidad) }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_proveedor" max-width="1100px">
            <tabla_proveedor v-if="dial_proveedor" @respuesta="completa_proveedor($event)" />
        </v-dialog>

        <compras v-if="dialo_compras" :data="data_edita" @cierra_compra="dialo_compras = $event" />
        <ajuste_inv v-if="dialo_ajuste" :data="data_edita" @cierra_compra="dialo_ajuste = $event" />
 <dialog_periodos v-model="dial_periodos" @cerrar="dial_periodos = false"
            @periodo-actualizado="onPeriodoActualizado" />
        <fab_periodos @periodo-actualizado="suscribirPeriodos" />
    </div>
</template>

<script>
import {
    allMovimientos,
    obtenContador,
    nuevoMovimiento,
    sumaContador,
    all_periodos,
} from '../../db'
import store from '@/store/index'
import { generarPDFCompra } from "./formatos/form_kardex";
import moment from 'moment'
import compras from '@/views/movi_kardex/compras'
import ajuste_inv from '@/views/movi_kardex/ajuste_inventario'
import dialog_periodos from '@/components/dialogos/dialog_periodos'
import fab_periodos from '@/components/fab_periodos'

import tabla_proveedor from '@/components/configEmpresa/tabla_proveedor'

export default {
    components: {
        compras,
        tabla_proveedor,
        ajuste_inv,
        dialog_periodos,
        fab_periodos,
    },
    data: () => ({
        dial_proveedor: false,
        dial_detalle: false,
        dial_transferencia: false,
        date1: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        crea_ajuste: false,
        mesSeleccionado: moment().format('YYYY - MM'),
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
        _subRef: null,
        moneda: store.state.moneda.find(m => m.codigo === 'PEN'),
        dial_periodos: false,
        periodosBD: {},
        _periodoRef: null,
    }),
    mounted() {
        this.inicio();
        this.suscribir();
        this.suscribirPeriodos();
    },
    beforeDestroy() {
        if (this._subRef) this._subRef.off('value', this.onDataChange);
        if (this._periodoRef) this._periodoRef.off('value', this.onPeriodoChange);
    },
    computed: {
        listafiltrada() {
            return this.desserts;
        },
        monedaSimbolo(){
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        },
        periodoCerrado() {
            const periodo = this.periodosBD[this.mesSeleccionado];
            if (!periodo) return false;
            return periodo.estado === 'close';
        },

        periodoActualKey() {
            return this.mesSeleccionado;
        },
        mesesDisponibles() {
            const meses = [];

            for (let i = 11; i >= 0; i--) {
                const fecha = moment().subtract(i, 'months');
                const anio = fecha.year();
                const mes = fecha.month() + 1;
                const mesStr = mes.toString().padStart(2, '0');
                const valor = `${anio}-${mesStr}`;
                const labelNumerico = `${mesStr}-${anio}`;
                const nombreMesCorto = fecha.format('MMM');
                const labelCorto = `${nombreMesCorto} ${anio}`;
                meses.push({
                    label: labelCorto,
                    labelNumerico: labelNumerico,
                    value: valor,
                    anio: anio,
                    mes: mes
                });
            }
            return meses;
        }
    },
    watch: {
        mesSeleccionado() {
            this.suscribir();
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
            this.mesSeleccionado = moment().format('YYYY-MM');

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
                moneda: this.moneda.simbolo,
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
        conviertefecha_unix(d) {
            const m = moment(d, 'YYYY-MM-DD', true);
            return m.isValid() ? m.unix() : moment().unix();
        },
        abre_visualizacion(item) {
            console.log(item)
            this.item_selecto = item
            this.arrayConsolidar = item.data
            this.dial_detalle = true
        },
        impreme_rep() {
            generarPDFCompra(this.item_selecto)
        },
        unixInicio(d) {
            const m = moment(d, 'YYYY-MM-DD', true);
            return m.isValid() ? m.startOf('day').unix() : 0; // fallback seguro
        },
        unixFin(d) {
            const m = moment(d, 'YYYY-MM-DD', true);
            return m.isValid() ? m.endOf('day').unix() : 4102444799; // 2099-12-31
        },
        cambiarMes() {
            this.suscribir();
        },
        mesAnterior() {
            const fechaActual = moment(this.mesSeleccionado, 'YYYY-MM');
            const mesAnterior = fechaActual.subtract(1, 'month').format('YYYY-MM');
            this.mesSeleccionado = mesAnterior;
        },

        mesActual() {
            this.mesSeleccionado = moment().format('YYYY-MM');
        },
        suscribir() {
            // corta cualquier suscripción previa
            if (this._subRef) this._subRef.off('value', this.onDataChange);
            const fechaInicio = moment(this.mesSeleccionado, 'YYYY-MM').startOf('month');
            const fechaFin = moment(this.mesSeleccionado, 'YYYY-MM').endOf('month');

            const ini = fechaInicio.unix();
            const fin = fechaFin.unix();

            this._subRef = allMovimientos()
                .orderByChild('fecha_emision')
                .startAt(ini)
                .endAt(fin);

            this._subRef.on('value', this.onDataChange);
        },
        nombreSede(base) {
            if (!base) return '-';
            // Puedes usar store.state o this.$store si usas namespaced modules
            const sedes = store.state.array_sedes.filter(e => e.tipo == 'sede') || [];
            const s = sedes.find(s => s.base == base);
            return s ? s.nombre : base;
        },
        abrirGestionPeriodos() {
            this.dial_periodos = true;
        },
        onPeriodoChange(snapshot) {
            this.periodosBD = snapshot.val() || {};
        },
        suscribirPeriodos() {
            if (this._periodoRef) this._periodoRef.off('value', this.onPeriodoChange);
            this._periodoRef = all_periodos();
            this._periodoRef.on('value', this.onPeriodoChange);
        },
        onPeriodoActualizado(data) {
            console.log('Período actualizado desde dialog:', data);
        },
    }

}
</script>
