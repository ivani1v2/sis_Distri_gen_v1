<!-- EditorDetallePedido.vue -->
<template>
    <v-dialog v-model="internalOpen" max-width="900" fullscreen>
        <v-card class="pa-4">
            <v-toolbar flat color="black" dark dense>
                <v-btn icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
                <v-spacer />
                <span class="title font-weight-bold">{{ moneda }} {{ number2(totalDetalle) }}</span>
                <v-spacer />
                <v-btn color="success" icon @click="emitirGuardar" :disabled="excedeLineaCredito">
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text>
                <v-alert v-if="excedeLineaCredito" dense border="left" colored-border type="error" class="mb-3 mt-5">
                    <div class="d-flex justify-space-between flex-wrap caption">
                        <span>Línea Crédito: <strong>{{ moneda }} {{ lineaCreditoCliente.toFixed(2) }}</strong></span>
                        <span>Deuda: <strong class="red--text">{{ moneda }} {{ deudaCliente.toFixed(2)
                                }}</strong></span>
                        <span>Disponible: <strong class="red--text">
                                {{ moneda }} {{ saldoDisponible.toFixed(2) }}
                            </strong></span>
                    </div>
                    <div class="mt-1 caption red--text">
                        El total del pedido supera el saldo disponible. Ajuste el pedido para poder guardar.
                    </div>
                </v-alert>

                <v-row dense>
                    <v-col cols="12">
                        <div class="subtitle-2 grey--text">Cliente</div>
                        <div>{{ cabecera.doc_numero }} - {{ cabecera.cliente_nombre }} <v-btn small color="red" icon
                                @click="openEditCabecera" :title="'Editar cabecera'">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn></div>
                    </v-col>

                    <!-- Condición de pago como v-select -->
                    <v-col cols="6" sm="6" md="6">
                        <v-select dense outlined hide-details label="Condición de pago"
                            v-model="cabecera.condicion_pago" :items="condicionesItemsFiltradas" item-text="text"
                            :disabled="!lineaCreditoActiva" item-value="value"
                            :menu-props="{ closeOnContentClick: true, maxHeight: 300 }" />
                    </v-col>

                    <!-- Tipo de comprobante como v-select -->
                    <v-col cols="6" sm="6" md="6">
                        <v-select dense outlined hide-details label="Tipo de comprobante"
                            v-model="cabecera.tipo_comprobante" :items="comprobantesItems" item-text="text"
                            item-value="value" :menu-props="{ closeOnContentClick: true, maxHeight: 300 }" />
                    </v-col>
                </v-row>

                <v-row dense v-if="cabecera.condicion_pago === 'CREDITO'">
                    <v-col cols="6">
                        <v-menu v-model="menuFecha" :close-on-content-click="false" transition="scale-transition"
                            :disabled="!esAdmin" offset-y min-width="auto">
                            <template v-slot:activator="{ on, attrs }">
                                <v-text-field outlined dense v-model="fechaVencimiento" label="Vence el"
                                    prepend-inner-icon="mdi-calendar" hide-details readonly v-bind="attrs" v-on="on"
                                    :class="{ 'grey--text': !esAdmin }" />
                            </template>
                            <v-date-picker v-model="fechaVencimiento" @input="menuFecha = false" :readonly="!esAdmin" />
                        </v-menu>
                    </v-col>
                    <v-col cols="6">
                        <v-btn v-if="cronogramaEditable" small elevation="3" rounded color="indigo" dark
                            @click="abrirCronograma">
                            <v-icon left small>mdi-calendar-clock</v-icon>
                            Editar Cronograma
                        </v-btn>
                        <div v-else-if="cronogramaParaMostrar" class="d-flex align-center mt-1">
                            <v-chip small outlined color="grey" class="mr-1">
                                {{ cronogramaParaMostrar?.cuotas?.length || 0 }} cuota(s)
                            </v-chip>
                            <v-chip small outlined color="grey">
                                {{ diasCreditoCalculado }} días
                            </v-chip>
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon small color="grey" class="ml-1" v-bind="attrs" v-on="on">
                                        mdi-information
                                    </v-icon>
                                </template>
                                <span>Vence: {{ formatFecha(fechaVencimiento) }}</span>
                            </v-tooltip>
                        </div>
                        <div v-else-if="cabecera.condicion_pago === 'CREDITO' && fechaVencimiento"
                            class="d-flex align-center mt-1">
                            <v-chip small outlined color="grey" class="mr-1">
                                1 cuota
                            </v-chip>
                            <v-chip small outlined color="grey">
                                {{ diasCreditoCalculado }} días
                            </v-chip>
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon small color="grey" class="ml-1" v-bind="attrs" v-on="on">
                                        mdi-information
                                    </v-icon>
                                </template>
                                <span>Vence: {{ formatFecha(fechaVencimiento) }}</span>
                            </v-tooltip>
                        </div>
                    </v-col>
                </v-row>

            </v-card-text>


            <v-card-text class="mt-n3">
                <v-row class="" dense>
                    <v-col cols="8">
                        <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="false"
                            :x_categoria="true" :cliente_selecto="clienteData">
                        </cat_fijo>
                    </v-col>
                    <v-col cols="4">
                        <v-btn small elevation="3" rounded color="success" @click="dial_catalogo = !dial_catalogo">
                            Catalogo
                            <v-icon color="white" class="mx-auto text--center" small>mdi-archive-arrow-down</v-icon>

                        </v-btn>
                    </v-col>
                    <v-col cols="12" class="mt-n5">
                        <v-expansion-panels v-model="expansionObservacion">
                            <v-expansion-panel>
                                <v-expansion-panel-header>
                                    Observación
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <v-textarea v-model="cabecera.observacion" outlined dense hide-details rows="3"
                                        placeholder="Escribe observaciones..." auto-grow></v-textarea>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-col>
                </v-row>
            </v-card-text> <v-card class="mt-3">
                <div class="tabla-scroll">
                    <v-simple-table class="elevation-0" dense>
                        <!-- Sin encabezado: usamos tarjetas -->
                        <thead class="d-none">
                            <tr>
                                <th>Ítems</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="item in lineas" :key="item.uuid || item.id" @click.prevent="editaProducto(item)">
                                <td class="pa-0 mt-n1 mb-n1">
                                    <v-card class="ma-1 pa-2 " outlined :elevation="0" ripple>
                                        <div class="d-flex align-center mt-n2 mb-n2">
                                            <div class="flex-grow-1 mr-2">
                                                <div class="text-caption grey--text text--darken-1">
                                                    <span>
                                                        Precio: {{ moneda }}
                                                        {{ redondear(item.precio) }}
                                                    </span>
                                                    <!-- <v-chip
                                                        v-if="esListaPreciosActivo && item.precio_tipo && item.precio_tipo !== 'regular'"
                                                        x-small class="ml-1"
                                                        :color="CONFIG_LISTAS[item.precio_tipo]?.color || 'purple'"
                                                        text-color="white" label>
                                                        {{ CONFIG_LISTAS[item.precio_tipo]?.nombre ||
                                                            item.precio_tipo }}
                                                    </v-chip> -->
                                                    <v-chip v-if="Number(item.preciodescuento) > 0" x-small class="ml-1"
                                                        color="deep-orange" text-color="white" label>
                                                        −{{ moneda }} {{ redondear(item.preciodescuento) }}
                                                    </v-chip>
                                                    <v-chip v-if="Number(item.precio_base) !== Number(item.precio)"
                                                        x-small class="ml-1" color="deep-orange" text-color="white"
                                                        label>
                                                        {{ moneda }} {{ redondear(item.precio_base) }}
                                                    </v-chip>
                                                    <v-chip v-if="item.medida" x-small class="ml-1" label>
                                                        {{ item.medida }}
                                                    </v-chip>

                                                    <v-chip v-if="item.operacion === 'GRATUITA'" x-small class="ml-1"
                                                        color="pink" text-color="white" label><v-icon x-small
                                                            left>mdi-gift</v-icon>
                                                        Gratuita
                                                    </v-chip>
                                                </div>

                                                <div class="mt-1 text-subtitle-2 text-truncate"
                                                    style="max-width: 70vw;">
                                                    <span class="font-weight-bold red--text">{{
                                                        Number(item.cantidad)
                                                        }}×</span>
                                                    {{ item.nombre }}
                                                </div>
                                            </div>

                                            <!-- Total -->
                                            <div class="text-right mr-1">
                                                <div class="subtitle-2 font-weight-bold">
                                                    {{ moneda }}
                                                    {{ item.totalLinea
                                                    }}
                                                </div>
                                                <div class="caption grey--text">Total</div>
                                            </div>
                                        </div>
                                    </v-card>
                                </td>
                            </tr>

                            <!-- Vacío -->
                            <tr v-if="!lineas || lineas.length === 0">
                                <td class="py-6 text-center grey--text">
                                    No hay productos en la lista
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </div>

            </v-card>

        </v-card>
        <!-- Componente edita_producto -->
        <edita_producto v-if="dialogoProducto" :item_selecto="item_selecto" @editaProducto="onEditaProducto($event)"
            @eliminaedita="eliminaedita()" @cierra="dialogoProducto = false" />
        <v-dialog v-model="dial_catalogo" max-width="550">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_catalogo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-1">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event), dial_catalogo = false"
                    :muestra_tabla="true" :x_categoria="false" :cliente_selecto="clienteData">
                </cat_fijo>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialCab" max-width="420">
            <v-card>
                <v-toolbar flat dense color="indigo" dark>
                    <v-toolbar-title class="subtitle-2">Editar cabecera</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialCab = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="mt-2">
                    <v-row dense>
                        <!-- Buscar cliente en store.state.clientes -->
                        <v-col cols="12">
                            <v-autocomplete dense outlined hide-details clearable
                                label="Buscar cliente (nombre / documento)" v-model="clienteSele" :items="clientesItems"
                                return-object item-text="display" :filter="filtrarCliente"
                                :menu-props="{ maxHeight: 300 }" @change="aplicaClienteSeleccionado">
                                <template v-slot:item="{ item }">
                                    <v-list-item-content>
                                        <v-list-item-title class="text-body-2">
                                            {{ item.nombre }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="caption grey--text">
                                            {{ item.tipodoc }} • {{ item.documento }} — {{ item.direccion }}
                                        </v-list-item-subtitle>
                                    </v-list-item-content>
                                </template>
                            </v-autocomplete>
                        </v-col>

                        <!-- Tipo de documento -->
                        <v-col cols="12" sm="6">
                            <v-select dense outlined hide-details label="Tipo de documento" v-model="cabDocTipo"
                                :items="docTiposItems" item-text="text" item-value="value"
                                :menu-props="{ closeOnContentClick: true, maxHeight: 300 }" />
                        </v-col>

                        <!-- Nº de documento -->
                        <v-col cols="12" sm="6">
                            <v-text-field dense outlined hide-details label="Nº de documento" v-model="cabDocNumero"
                                :counter="cabDocTipo === 'RUC' ? 11 : (cabDocTipo === 'DNI' ? 8 : null)"
                                :rules="[validDocRule]" />
                        </v-col>

                        <!-- Nombre de cliente -->
                        <v-col cols="12">
                            <v-text-field dense outlined hide-details label="Nombre / Razón social"
                                v-model="cabClienteNombre" />
                        </v-col>

                        <!-- Dirección -->
                        <v-col cols="12">
                            <v-text-field dense outlined hide-details label="Dirección" v-model="cabClienteDireccion" />
                        </v-col>

                        <!-- Código de vendedor -->
                        <v-col cols="12">
                            <v-text-field dense outlined label="Código vendedor" v-model="cabVendCode" hide-details />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field dense outlined type="datetime-local" label="Fecha emisión"
                                v-model="cabFechaLocal" hide-details />
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="dialCab = false">Cancelar</v-btn>
                    <v-btn color="green darken-1" depressed @click="saveEditCabecera">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_stock v-model="dialStock" :items="sinStock" @close="dialStock = false" />

        <cronograma v-if="dialogoCronograma" :totalCredito="Number(totalDetalle)" @cierra="dialogoCronograma = false"
            @emite_cronograma="guarda_cronograma($event)" :pagoInicial="0" :moneda="moneda" :editable="esAdmin"
            :planExistente="planExistenteFormateado"
            :diasCredito="clienteData?.dias_credito || cabecera?.dias_credito || 0" />
    </v-dialog>
</template>

<script>
import cat_fijo from '@/components/catalogo_fijo'
import edita_producto from '@/views/ventas/edita_producto'
import cronograma from '../../ventas/dialogos/cronograma_creditos.vue'
import moment from 'moment'
import axios from "axios"
import store from '@/store/index'
import { colClientes } from '../../../db_firestore'
import { allcuentaxcobrar, nuevaCuentaxcobrar, editaCuentaxCobrar, db } from '../../../db'
import { aplicaPreciosYBonos, agregarLista, analizaPreciosParcial, analizaGruposParcial } from '@/views/funciones/calculo_bonos'
import {
    aplicarPreciosPorLista,
    CONFIG_LISTAS,
    cambiarTipoPrecioManual
} from '@/views/funciones/calculo_lista_precios'
import dial_stock from '../../ventas/dialogos/dial_stock_insuficiente.vue'
export default {
    name: 'EditorDetallePedido',
    components: {
        cat_fijo,
        edita_producto,
        cronograma,
        dial_stock
    },
    props: {
        value: { type: Boolean, default: false },
        cabecera: { type: Object, required: true },
        detalle: { type: Array, default: () => [] },
        editablePrecio: { type: Boolean, default: false }
    },
    data() {
        return {
            internalOpen: this.value,
            lineas: [],
            dial_catalogo: false,
            moneda: 'S/',
            condicionesItems: [
                { text: 'Contado', value: 'CONTADO' },
                { text: 'Crédito', value: 'CREDITO' }
            ],
            comprobantesItems: [
                { text: 'Nota', value: 'T' },
                { text: 'Boleta', value: 'B' },
                { text: 'Factura', value: 'F' },
            ],
            dialogoProducto: false,
            item_selecto: {},
            dialCab: false,
            cabVendCode: '',
            cabFechaLocal: '',
            cabDocTipo: 'SIN DOCUMENTO',
            cabDocNumero: '',
            cabClienteNombre: '',
            cabClienteDireccion: '',
            clienteSele: null,
            dialogoCronograma: false,
            fechaVencimiento: '',
            cronogramaData: null,
            menuFecha: false,
            docTiposItems: [
                { text: 'Sin documento', value: 'SIN DOCUMENTO' },
                { text: 'DNI', value: 'DNI' },
                { text: 'RUC', value: 'RUC' },
                { text: 'Carnet Extranjería', value: 'CEX' },
                { text: 'Pasaporte', value: 'PAS' },
            ],
            expansionObservacion: null,
            clienteData: null,
            deudaCliente: 0,
            recalculandoBonos: false,
            dialStock: false,
            sinStock: [],
            CONFIG_LISTAS: CONFIG_LISTAS,
        }
    },
    watch: {
        value(v) {
            this.internalOpen = v
            if (v) {
                if (this.cabecera && this.cabecera.moneda) {
                    this.moneda = this.cabecera.moneda
                }
                this._cargarDesdeProps()
                this.cargarDatosCredito()
            }
        },
        internalOpen(v) {
            this.$emit('input', v)
        },
        detalle: {
            handler() {
                if (this.internalOpen) this._cargarDesdeProps()
            },
            deep: true
        },
        'cabecera.condicion_pago'(nv) {
            if (nv === 'CREDITO') {
                if (!this.fechaVencimiento) {
                    const diasCredito = this.clienteData?.dias_credito || this.cabecera?.dias_credito || 7;
                    this.fechaVencimiento = moment().add(diasCredito, 'days').format('YYYY-MM-DD')
                }
            } else {
                this.fechaVencimiento = ''
                this.cronogramaData = null
                this.cabecera.cronograma = null
            }
        },
        fechaVencimiento: {
            handler(nuevaFecha, oldFecha) {
                if (nuevaFecha && this.cabecera.condicion_pago === 'CREDITO' && nuevaFecha !== oldFecha) {
                    const hoy = moment().startOf('day');
                    const vence = moment(nuevaFecha).startOf('day');
                    const diasCalculados = vence.diff(hoy, 'days');

                    this.cabecera.dias_credito = diasCalculados > 0 ? diasCalculados : 0;
                    if (this.cronogramaData && this.cronogramaData.cuotas?.length > 0) {
                        const ultimoIndice = this.cronogramaData.cuotas.length - 1;
                        this.cronogramaData.cuotas[ultimoIndice].vencimiento = nuevaFecha;
                        this.cronogramaData.fecha_ultima_cuota = nuevaFecha;
                        this.cronogramaData.dias_credito_calculados = diasCalculados;

                        console.log(`Actualizada última cuota (${ultimoIndice + 1}) a ${nuevaFecha}`);
                    }
                    else if (!this.cronogramaData || this.cronogramaData.cuotas?.length === 0) {
                        this.cronogramaData = {
                            cuotas: [{
                                numero: '001',
                                vencimiento: nuevaFecha,
                                importe: this.totalDetalle,
                            }],
                            dias_credito_calculados: diasCalculados,
                            fecha_ultima_cuota: nuevaFecha
                        };
                    }
                    this.cabecera.cronograma = this.cronogramaData.cuotas;

                    console.log(`Fecha vencimiento cambiada a ${nuevaFecha}, días: ${diasCalculados}`);
                }
            },
            immediate: true
        },
    },
    computed: {
        totalDetalle() {
            return (this.lineas || []).reduce((acc, it) => acc + Number(it.totalLinea || 0), 0)
        },
        clientesItems() {
            const arr = (this.$store.state.clientessearch || []).filter(c => c && c.activo !== false);
            return arr.map(c => ({
                ...c,
                display: `${(c.nombre || '').trim()} — ${(c.tipodoc || 'SIN DOCUMENTO')} ${c.id || ''}`
            }));
        },
        planExistenteFormateado() {
            const cronograma = this.cabecera.cronograma;
            if (!cronograma) return null;
            if (Array.isArray(cronograma)) {
                const cuotasFormateadas = cronograma.map(c => ({
                    ...c,
                    numero: String(c.numero).padStart(3, '0')
                }));
                return {
                    cuotas: cuotasFormateadas,
                    dias_credito_calculados: this.cabecera.dias_credito,
                    fecha_ultima_cuota: this.fechaVencimiento,
                    total_credito: this.totalDetalle
                };
            }

            if (cronograma.cuotas && Array.isArray(cronograma.cuotas)) {
                const cuotasFormateadas = cronograma.cuotas.map(c => ({
                    ...c,
                    numero: String(c.numero).padStart(3, '0')
                }));
                return {
                    cuotas: cuotasFormateadas,
                    dias_credito_calculados: cronograma.dias_credito_calculados || this.cabecera.dias_credito,
                    fecha_ultima_cuota: this.fechaVencimiento,
                    total_credito: this.totalDetalle
                };
            }
            console.log('Formato no reconocido:', cronograma);
            return null;
        },
        lineaCreditoActiva() {
            return this.$store.state.configuracion?.linea_credito_activo === true
        },
        lineaCreditoCliente() {
            return parseFloat(this.clienteData?.linea_credito || 0)
        },
        saldoDisponible() {
            return this.lineaCreditoCliente - this.deudaCliente
        },
        mostrarInfoCredito() {
            return this.lineaCreditoActiva && this.lineaCreditoCliente > 0
        },
        excedeLineaCredito() {
            if (!this.lineaCreditoActiva) return false
            if (this.lineaCreditoCliente <= 0) return false
            return this.totalDetalle > this.saldoDisponible
        },
        condicionesItemsFiltradas() {
            if (!this.lineaCreditoActiva) {
                return [{ text: 'Contado', value: 'CONTADO' }];
            }

            if (!this.clienteData?.permite_credito) {
                return [{ text: 'Contado', value: 'CONTADO' }];
            }

            if (this.clienteData?.linea_credito <= 0) {
                return [{ text: 'Contado', value: 'CONTADO' }];
            }
            return this.condicionesItems;
        },
        esListaPreciosActivo() {
            return this.$store.state.configuracion?.lista_precios === true;
        },
        listasPreciosCliente() {
            return this.clienteData?.listas_precios || [];
        },
        esAdmin() {
            return this.$store.state.permisos?.es_admin === true;
        },
        cronogramaEditable() {
            return this.esAdmin && this.cabecera.condicion_pago === 'CREDITO';
        },
        cronogramaParaMostrar() {
            if (this.planExistenteFormateado) {
                return this.planExistenteFormateado;
            }
            if (this.fechaVencimiento && this.cabecera.condicion_pago === 'CREDITO') {
                const diasCredito = this.clienteData?.dias_credito || this.cabecera?.dias_credito || 7;
                return {
                    cuotas: [{
                        numero: '001',
                        vencimiento: this.fechaVencimiento,
                        importe: this.totalDetalle,
                    }],
                    dias_credito_calculados: diasCredito
                };
            }
            return null;
        },
        diasCreditoCalculado() {
            if (!this.fechaVencimiento) return 0;
            const hoy = moment().startOf('day');
            const vence = moment(this.fechaVencimiento).startOf('day');
            return vence.diff(hoy, 'days');
        }
    },
    created() {
        if (this.cabecera && this.cabecera.moneda) {
            this.moneda = this.cabecera.moneda
        } else {
            this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        }
        if (this.cabecera.fecha_vencimiento) {
            this.fechaVencimiento = this.cabecera.fecha_vencimiento
        } else if (this.cabecera.condicion_pago === 'CREDITO') {
            const diasCredito = this.cabecera.dias_credito || 7;
            this.fechaVencimiento = moment().add(diasCredito, 'days').format('YYYY-MM-DD');
        }

        if (this.internalOpen) this._cargarDesdeProps()
        if (this.cabecera.cronograma) {
            if (Array.isArray(this.cabecera.cronograma)) {
                this.cronogramaData = {
                    cuotas: this.cabecera.cronograma,
                    dias_credito_calculados: this.cabecera.dias_credito,
                    fecha_ultima_cuota: this.fechaVencimiento
                };
            }
            else if (this.cabecera.cronograma.cuotas) {
                this.cronogramaData = this.cabecera.cronograma
            }
            else {
                this.cronogramaData = {
                    cuotas: [this.cabecera.cronograma],
                    dias_credito_calculados: this.cabecera.dias_credito,
                    fecha_ultima_cuota: this.fechaVencimiento
                }
            }
        } else {
            this.cronogramaData = {
                cuotas: [],
                dias_credito_calculados: this.cabecera.dias_credito,
                fecha_ultima_cuota: this.fechaVencimiento
            }
        }

        this.cargarDatosCredito()
    },
    methods: {
        recalcularSiPermiteBonos() {
            this.$nextTick(() => this.recalculoCompleto());
        },
        async cargarDatosCredito() {
            const doc = String(this.cabecera?.doc_numero || '').trim()
            if (!doc) return

            try {
                const docSnap = await colClientes().doc(doc).get()
                if (docSnap.exists) {
                    this.clienteData = docSnap.data()
                    if (this.clienteData?.dias_credito > 0 && !this.cabecera.dias_credito) {
                        this.cabecera.dias_credito = this.clienteData.dias_credito;
                    }
                } else {
                    this.clienteData = null
                }

                const deudaSnap = await allcuentaxcobrar()
                    .orderByChild('documento')
                    .equalTo(doc)
                    .once('value')

                let totalDeuda = 0
                if (deudaSnap.exists()) {
                    deudaSnap.forEach(item => {
                        const data = item.val()
                        if (data.estado === 'PENDIENTE') {
                            totalDeuda += parseFloat(data.monto_pendiente || 0)
                        }
                    })
                }
                this.deudaCliente = totalDeuda
            } catch (e) {
                console.error('Error cargando datos crédito:', e)
            }
        },
        abrirCronograma() {
            if (this.cabecera.condicion_pago !== 'CREDITO') return
            if (this.cronogramaData && !this.cronogramaData.cuotas && Array.isArray(this.cronogramaData)) {
                this.cronogramaData = {
                    cuotas: this.cronogramaData,
                    dias_credito_calculados: this.cabecera.dias_credito,
                    fecha_ultima_cuota: this.fechaVencimiento
                }
            }

            this.dialogoCronograma = true
        },

        guarda_cronograma(cronograma) {
            this.cronogramaData = cronograma;
            this.cabecera.cronograma = cronograma.cuotas || cronograma;
            if (cronograma.fecha_ultima_cuota) {
                this.fechaVencimiento = cronograma.fecha_ultima_cuota;
                this.cabecera.fecha_vencimiento = cronograma.fecha_ultima_cuota;
            } else if (cronograma.cuotas && cronograma.cuotas.length > 0) {
                const ultimaCuota = cronograma.cuotas[cronograma.cuotas.length - 1];
                this.fechaVencimiento = ultimaCuota.vencimiento;
                this.cabecera.fecha_vencimiento = ultimaCuota.vencimiento;
            }
            if (cronograma.dias_credito_calculados !== undefined) {
                this.cabecera.dias_credito = cronograma.dias_credito_calculados;
            } else {
                const hoy = moment().startOf('day');
                const vence = moment(this.fechaVencimiento).startOf('day');
                this.cabecera.dias_credito = vence.diff(hoy, 'days');
            }
            this.dialogoCronograma = false;
        },

        editaProducto(val) {
            let precioBase = Number(val.precio_base || val.precio || 0);

            if (val.bono_auto || val.operacion === 'GRATUITA') {
                const productos = this.$store?.state?.productos || [];
                const prodOriginal = productos.find(p => String(p.id) === String(val.id));
                if (prodOriginal) {
                    precioBase = Number(prodOriginal.precio || 0);
                }
            }

            console.log(val)
            this.item_selecto = {
                ...val,
                precio_base: precioBase,
                desc_1: Number(val.desc_1 || 0),
                desc_2: Number(val.desc_2 || 0),
                desc_3: Number(val.desc_3 || 0)
            }
            this.dialogoProducto = true
        },

        onEditaProducto(lineaActualizada) {
            const pos = this.lineas.findIndex(e => e.uuid === lineaActualizada.uuid);
            if (pos === -1) return;

            const linea = this.lineas[pos];

            const precioAntes = Number(linea.precio || 0);
            const nuevoPrecio = Number(lineaActualizada.precio || 0);

            // aplica cambios
            linea.cantidad = Number(lineaActualizada.cantidad || 0);
            linea.precio = nuevoPrecio;
            linea.precio_base = Number(lineaActualizada.precio_base ?? linea.precio_base ?? 0);
            linea.preciodescuento = Number(lineaActualizada.preciodescuento || 0);
            linea.desc_1 = Number(lineaActualizada.desc_1 || 0);
            linea.desc_2 = Number(lineaActualizada.desc_2 || 0);
            linea.desc_3 = Number(lineaActualizada.desc_3 || 0);
            linea.operacion = lineaActualizada.operacion || linea.operacion;
            linea.nombre = lineaActualizada.nombre || linea.nombre;

            // 👇 NUEVO: Preservar información de listas si viene en la línea actualizada
            if (lineaActualizada._lista_precios) {
                linea._lista_precios = lineaActualizada._lista_precios;
            }
            if (lineaActualizada.precio_tipo) {
                linea.precio_tipo = lineaActualizada.precio_tipo;
            }
            if (lineaActualizada._precio_lista) {
                linea._precio_lista = lineaActualizada._precio_lista;
            }

            // marcar manual solo si cambió
            if (nuevoPrecio !== precioAntes) {
                this.$set(linea, 'precio_manual', true);
            }

            this.recalcularLinea(linea);
            this.dialogoProducto = false;
            if (store.state.permisos.permite_editar_bono) {
                this.$nextTick(() => this.recalcularSiPermiteBonos());
            }
        },


        eliminaedita() {
            const itemAEliminar = this.item_selecto;
            const pos = this.lineas.map(e => e.uuid).indexOf(itemAEliminar.uuid);

            if (itemAEliminar.bono_auto && itemAEliminar.bono_origen_tipo === 'lista_bono' && itemAEliminar.bono_origen) {
                const idOrigen = String(itemAEliminar.bono_origen);
                const lineaOrigen = this.lineas.find(l => String(l.id) === idOrigen && !l.bono_auto);
                if (lineaOrigen) {
                    if (!lineaOrigen.bonos_eliminados) {
                        this.$set(lineaOrigen, 'bonos_eliminados', []);
                    }
                    lineaOrigen.bonos_eliminados.push(itemAEliminar.bono_regla);
                }
            }

            if (pos !== -1) {
                this.lineas.splice(pos, 1);
            }
            this.dialogoProducto = false;
            if (store.state.permisos.permite_editar_bono) {
                this.$nextTick(() => {
                    this.recalcularSiPermiteBonos()
                })
            }
        },

        _cargarDesdeProps() {
            const base = Array.isArray(this.detalle) ? this.detalle : []
            this.lineas = base.map(it => ({
                uuid: it.uuid || `${it.id}-${Date.now()}`,
                id: it.id,
                nombre: it.nombre,
                medida: (it.medida || '').toString().toUpperCase(),
                cantidad: Number(it.cantidad || 0),
                precio: Number(it.precio || 0),
                precio_base: Number(it.precio_base || it.precio || 0),
                preciodescuento: Number(it.preciodescuento || 0),
                desc_1: Number(it.desc_1 || 0),
                desc_2: Number(it.desc_2 || 0),
                desc_3: Number(it.desc_3 || 0),
                operacion: it.operacion,
                factor: it.factor,
                costo: it.costo,
                tipoproducto: it.tipoproducto,
                controstock: it.controstock,
                peso: Number(it.peso || 0),
                bono_auto: it.bono_auto || false,
                bono_editado: it.bono_editado || false,
                bono_origen_tipo: it.bono_origen_tipo || null,
                bono_origen: it.bono_origen || null,
                bono_regla: it.bono_regla || null,
                precio_manual: it.precio_manual === true,
                bonos_eliminados: it.bonos_eliminados || null,
                totalLinea: Number(it.totalLinea != null ? it.totalLinea : (Number(it.cantidad || 0) * Number(it.precio || 0))),
                precio_tipo: it.precio_tipo || null,
            }))


        },
        number2(n) {
            const x = Number(n || 0)
            return x.toFixed(2)
        },
        recalcularLinea(it) {
            const cant = Math.max(0, Number(it.cantidad || 0))
            const precio = Math.max(0, Number(it.precio || 0))
            const descUnit = Math.max(0, Number(it.preciodescuento || 0))
            const esGratuita = String(it.operacion || '').toUpperCase() === 'GRATUITA'
            it.cantidad = cant
            it.totalLinea = esGratuita ? 0 : this.fix2(Math.max(0, cant * (precio - descUnit)))
        },
        eliminar(idx) {
            this.lineas.splice(idx, 1)
        },
        tieneMay1(p) {
            return this.toNum(p && p.precio_may1, 0) > 0 && this.toNum(p && p.escala_may1, 0) > 0;
        },
        tieneMay2(p) {
            return this.toNum(p && p.precio_may2, 0) > 0 && this.toNum(p && p.escala_may2, 0) > 0;
        },
        sugerirTier(producto, cantidadRaw) {
            const cantidad = this.toNum(cantidadRaw, 0);

            const hayMay1 = this.tieneMay1(producto);
            const hayMay2 = this.tieneMay2(producto);

            if (!hayMay1 && !hayMay2) return 1;

            if (hayMay1 && !hayMay2) {
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                return cantidad >= esc1 ? 2 : 1;
            }

            if (hayMay1 && hayMay2) {
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                const lim1 = Math.min(esc1, esc2);
                const lim2 = Math.max(esc1, esc2);
                if (cantidad >= lim2) return 3;
                if (cantidad >= lim1) return 2;
                return 1;
            }

            if (!hayMay1 && hayMay2) {
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                return cantidad >= esc2 ? 3 : 1;
            }
            return 1;
        },
        precioPorTier(producto, tier) {
            if (tier === 3) return this.toNum(producto.precio_may2, this.toNum(producto.precio, 0));
            if (tier === 2) return this.toNum(producto.precio_may1, this.toNum(producto.precio, 0));
            return this.toNum(producto.precio, 0);
        },
        agregar_lista(value) {
            // 1) Verificar si el producto ya tiene lista seleccionada
            const itemsConLista = (Array.isArray(value) ? value : [value])
                .filter(item => item._lista_precios || item.precio_tipo);

            // 2) Fusiona / suma / respeta UUID con tu helper oficial
            let nuevaLista = agregarLista({
                listaActual: this.lineas,
                nuevosItems: value,
                createUUID: this.create_UUID,
                redondear: (n) => this.redondear(n),
            });

            // 3) Si el producto ya tiene lista, NO recalcular con bonos
            if (itemsConLista.length > 0) {
                console.log('🎯 Producto con lista seleccionada:', itemsConLista[0]._lista_precios || itemsConLista[0].precio_tipo);
                // Solo asignar sin recalcular
                this.lineas = nuevaLista;
            } else {
                // 4) Marcar timestamp interno
                const baseTs = Date.now();
                let offset = 0;
                nuevaLista = nuevaLista.map(item => {
                    if (item.__tsAdd) return item;
                    return { ...item, __tsAdd: baseTs + (offset++) };
                });

                // 5) Asigna lista y recalcula SOLO lo afectado
                this.lineas = nuevaLista;

                this.$nextTick(() => {
                    this.recalculoUltimoAgregado(value);
                });
            }
        },

        recalculoUltimoAgregado(value) {
            const items = Array.isArray(value) ? value : [value];

            // ids agregados
            const ids = items
                .map(x => String(x?.id ?? x?.cod_producto ?? ''))
                .filter(Boolean);

            if (!ids.length) return;

            // 🔹 SOLO recalcular si NO tienen lista de precios
            const itemsSinLista = items.filter(item => !item._lista_precios && !item.precio_tipo);
            if (itemsSinLista.length === 0) {
                console.log('⏭️ Productos con lista de precios, omitiendo recálculo');
                return;
            }

            const idsSinLista = itemsSinLista.map(x => String(x.id)).filter(Boolean);

            // 🔹 Precios parcial (solo ids sin lista)
            this.lineas = analizaPreciosParcial({
                lineas: this.lineas,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                idsAfectados: idsSinLista,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });

            // 🔹 Bonos parcial (solo ids sin lista)
            this.lineas = analizaGruposParcial({
                lineas: this.lineas,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                idsAfectados: idsSinLista,
                createUUID: this.create_UUID,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });
        },

        recalculoCompleto() {
            // Separar líneas con lista de precios y sin lista
            const lineasConLista = this.lineas.filter(l => l._lista_precios || l.precio_tipo);
            const lineasSinLista = this.lineas.filter(l => !l._lista_precios && !l.precio_tipo);

            if (lineasSinLista.length > 0) {
                const recalculadas = aplicaPreciosYBonos({
                    lineas: lineasSinLista,
                    productos: this.$store.state.productos,
                    bonos: this.$store.state.bonos,
                    createUUID: this.create_UUID,
                    redondear: (n) => this.redondear(n),
                    inPlace: false,
                });

                // Unir manteniendo las que tienen lista
                this.lineas = [...lineasConLista, ...recalculadas];
            }
        },

        create_UUID() {
            let dt = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        },

        async api_rest(data, metodo) {
            const bd = store.state.baseDatos.bd;

            // 👇 genera key estable para ESTE guardado
            const pedidoId =
                data?.cabecera?.pedido_id ||
                data?.cabecera?.id ||
                data?.cabecera?.numeracion ||
                data?.cabecera?.doc_numero || "SIN_ID";

            const ver = data?.cabecera?.updated_at || Date.now();

            const idemKey = `${metodo}:${bd}:${pedidoId}:${ver}`;

            try {
                const resp = await axios({
                    method: "POST",
                    url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                    //url: "http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion",
                    headers: {
                        "x-idempotency-key": idemKey, // ✅ CLAVE
                    },
                    data: { bd, data, metodo },
                });

                if (resp.status === 202 || resp.data?.status === "processing") {
                    const e = new Error("EN PROCESO");
                    e.response = { status: 202, data: resp.data };
                    throw e;
                }

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


        fix2(n) {
            const x = Number(n || 0);
            return Math.round(x * 100) / 100;
        },
        _recalculaDetalle(det = []) {
            // Recalcula totalLinea por si quedó algo sin normalizar
            return (det || []).map(it => {
                const cant = Math.max(0, Number(it.cantidad || 0));
                const precio = Math.max(0, Number(it.precio || 0));
                const desc = Math.max(0, Number(it.preciodescuento || 0));
                const esGrat = String(it.operacion || '').toUpperCase() === 'GRATUITA';
                const totalLinea = esGrat ? 0 : this.fix2(Math.max(0, cant * (precio - desc)));
                return { ...it, cantidad: cant, precio, preciodescuento: desc, totalLinea };
            });
        },
        async emitirGuardar() {
            try {
                store.commit("dialogoprogress")
                const detalleNorm = this._recalculaDetalle(this.lineas);
                const subtotal = detalleNorm.reduce((a, it) => a + Number(it.totalLinea || 0), 0);
                const total = subtotal;
                const total_items = detalleNorm.length;

                let cronogramaCabecera = this.cabecera.cronograma || null;
                let diasCreditoFinal = this.cabecera.dias_credito || 0;

                if (this.cabecera.condicion_pago === 'CREDITO') {
                    if (this.cronogramaData && Array.isArray(this.cronogramaData.cuotas) && this.cronogramaData.cuotas.length > 0) {
                        cronogramaCabecera = this.cronogramaData.cuotas;
                        diasCreditoFinal = this.cronogramaData.dias_credito_calculados || diasCreditoFinal;
                    } else if (Array.isArray(this.cabecera.cronograma) && this.cabecera.cronograma.length > 0) {
                        cronogramaCabecera = this.cabecera.cronograma;
                    } else {
                        cronogramaCabecera = [{
                            numero: '001',
                            vencimiento: this.fechaVencimiento || moment().add(7, 'days').format('YYYY-MM-DD'),
                            importe: this.fix2(total),
                            estado: 'pendiente'
                        }];
                        if (this.fechaVencimiento) {
                            const hoy = moment().startOf('day');
                            const vence = moment(this.fechaVencimiento).startOf('day');
                            diasCreditoFinal = vence.diff(hoy, 'days');
                        }
                    }
                }

                const cabeceraFull = {
                    ...this.cabecera,
                    subtotal: this.fix2(subtotal),
                    total: this.fix2(total),
                    estado: 'atendido',
                    total_items,
                    editado: true,
                    updated_at: Date.now(),
                    cronograma: cronogramaCabecera,
                    fecha_vencimiento: this.cabecera.condicion_pago === 'CREDITO' ? this.fechaVencimiento : null,
                    dias_credito: diasCreditoFinal,
                };

                const payload = {
                    cabecera: cabeceraFull,
                    detalle: detalleNorm,
                    detalle_original: this.detalle,
                    control_stock: true
                };

                const r = await this.api_rest(payload, "guardar_pedido");
                if (!r) {
                    store.commit("dialogoprogress");
                    return;
                }

                const pedidoId = r?.data?.id || r?.id || this.cabecera.id;

                if (this.cabecera.condicion_pago === 'CREDITO') {
                    const snapshot = await allcuentaxcobrar()
                        .orderByChild('doc_ref')
                        .equalTo(pedidoId)
                        .once('value');

                    if (snapshot.exists()) {
                        await this.actualizarCuentaxCobrar(pedidoId, cabeceraFull, total);
                    } else {
                        await this.crearCuentaxCobrarDesdeEdicion(pedidoId, cabeceraFull, total);
                    }
                } else {
                    await this.eliminarCuentaxCobrar(pedidoId);
                }

                store.commit("dialogoprogress")
                store.commit("dialogosnackbar", "Documento guardado con éxito");
                this.cerrar();
            } catch (e) {
                console.error(e);
                store.commit("dialogoprogress")
                store.commit("dialogosnackbar", "Error guardando el documento");
            }
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },

        toNum(v, def = 0) {
            const n = Number(v);
            return Number.isFinite(n) ? n : def;
        },
        cerrar() {
            this.internalOpen = false
            this.expansionObservacion = null
            this.$emit('cancelar')
        },
        openEditCabecera() {
            // Cargar valores actuales
            this.cabVendCode = (this.cabecera?.cod_vendedor || '').toString()
            // fecha_emision esperada en UNIX (segundos). Si no hay, usa ahora.
            const unix = Number(this.cabecera?.fecha_emision || Math.floor(Date.now() / 1000))
            this.cabFechaLocal = this.unixToLocal(unix) // 'YYYY-MM-DDTHH:mm'
            this.dialCab = true
        },

        saveEditCabecera() {
            // Valida fecha
            if (!this.cabFechaLocal) {
                alert('Ingrese una fecha válida')
                return
            }
            // Aplica cambios en la cabecera (referencia prop/obj compartido)
            const nuevoUnix = this.localToUnix(this.cabFechaLocal)
            this.$set(this.cabecera, 'cod_vendedor', this.cabVendCode)
            this.$set(this.cabecera, 'fecha_emision', nuevoUnix)

            // Cierra diálogo
            this.dialCab = false

            // (Opcional) feedback
            this.$toast?.success?.('Cabecera actualizada') || console.log('Cabecera actualizada')
        },
        unixToLocal(unixSeconds) {
            const d = new Date((Number(unixSeconds) || 0) * 1000)
            const pad = n => String(n).padStart(2, '0')
            const yyyy = d.getFullYear()
            const MM = pad(d.getMonth() + 1)
            const dd = pad(d.getDate())
            const hh = pad(d.getHours())
            const mm = pad(d.getMinutes())
            return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
        },
        localToUnix(localStr) {
            // Nota: new Date('YYYY-MM-DDTHH:mm') asume zona local del navegador
            const ms = new Date(localStr).getTime()
            return Math.floor((Number.isFinite(ms) ? ms : Date.now()) / 1000)
        },
        filtrarCliente(item, queryText, itemText) {
            const q = (queryText || '').toLowerCase().trim();
            if (!q) return true;
            const nombre = (item.nombre || '').toLowerCase();
            const doc = (item.documento || '').toLowerCase();
            return q.split(/\s+/).every(p => nombre.includes(p) || doc.includes(p));
        },

        // --- Al elegir un cliente, rellena los campos
        async aplicaClienteSeleccionado(cli) {

            const docCache = await colClientes().doc(String(cli.id)).get({ source: 'cache' })
            if (docCache.exists) {

                const docData = docCache.data();
                this.cabDocTipo = (docData.tipodoc || 'SIN DOCUMENTO').toString().toUpperCase();
                this.cabDocNumero = (docData.id || '').toString();
                this.cabClienteNombre = (docData.nombre || '').toString();
                this.cabClienteDireccion = (docData.direccion || '').toString();
            }


        },

        // --- Regla de validación rápida para número de documento
        validDocRule(v) {
            const tipo = (this.cabDocTipo || '').toUpperCase();
            const val = (v || '').trim();
            if (tipo === 'RUC') return (val.length === 11) || 'RUC debe tener 11 dígitos';
            if (tipo === 'DNI') return (val.length === 8) || 'DNI debe tener 8 dígitos';
            return true;
        },

        // --- Precarga: incluye cliente/doc además de lo que ya tenías
        openEditCabecera() {
            // vendedor
            this.cabVendCode = (this.cabecera?.cod_vendedor || '').toString();

            // fecha (UNIX s → local)
            const unix = Number(this.cabecera?.fecha_emision || Math.floor(Date.now() / 1000));
            this.cabFechaLocal = this.unixToLocal(unix);

            // DOC + CLIENTE
            this.cabDocTipo = (this.cabecera?.doc_tipo || 'SIN DOCUMENTO').toString().toUpperCase();
            this.cabDocNumero = (this.cabecera?.doc_numero || '').toString();
            this.cabClienteNombre = (this.cabecera?.cliente_nombre || '').toString();
            this.cabClienteDireccion = (this.cabecera?.cliente_direccion || '').toString();

            // limpia selección del autocomplete
            this.clienteSele = null;

            this.dialCab = true;
        },

        // --- Guarda: persiste solo los campos solicitados + los tuyos existentes
        saveEditCabecera() {
            if (!this.cabFechaLocal) {
                alert('Ingrese una fecha válida');
                return;
            }
            const docRuleMsg = this.validDocRule(this.cabDocNumero);
            if (docRuleMsg !== true) {
                this.$store?.commit?.('dialogosnackbar', docRuleMsg) || alert(docRuleMsg);
                return;
            }

            const nuevoUnix = this.localToUnix(this.cabFechaLocal);

            // Tus campos existentes
            this.$set(this.cabecera, 'cod_vendedor', this.cabVendCode);
            this.$set(this.cabecera, 'fecha_emision', nuevoUnix);

            // NUEVO: documento + cliente
            this.$set(this.cabecera, 'doc_tipo', (this.cabDocTipo || 'SIN DOCUMENTO').toString().toUpperCase());
            this.$set(this.cabecera, 'doc_numero', (this.cabDocNumero || '').toString().trim());
            this.$set(this.cabecera, 'cliente_nombre', (this.cabClienteNombre || '').toString());
            this.$set(this.cabecera, 'cliente_direccion', (this.cabClienteDireccion || '').toString());

            this.dialCab = false;
            this.$toast?.success?.('Cabecera actualizada') || console.log('Cabecera actualizada');
        },
        formatFecha(fecha) {
            return fecha ? moment(fecha).format('DD/MM/YYYY') : '';
        },
        async actualizarCuentaxCobrar(pedidoId, cabecera, totalGeneral) {
            try {
                const snapshot = await allcuentaxcobrar()
                    .orderByChild('doc_ref')
                    .equalTo(pedidoId)
                    .once('value');

                if (snapshot.exists()) {
                    snapshot.forEach(async (childSnapshot) => {
                        const key = childSnapshot.key;
                        const cuentaData = childSnapshot.val();
                        let fechaVencimientoCXC = moment().unix();
                        if (this.fechaVencimiento) {
                            fechaVencimientoCXC = moment(this.fechaVencimiento).endOf('day').unix();
                        }
                        let datosCuotas = [];
                        if (this.cronogramaData && Array.isArray(this.cronogramaData.cuotas) && this.cronogramaData.cuotas.length > 0) {
                            datosCuotas = this.cronogramaData.cuotas.map(cuota => ({
                                id: cuota.numero,
                                fecha_vence: Math.floor(new Date(cuota.vencimiento + "T23:59:59").getTime() / 1000),
                                monto: cuota.importe,
                                estado: "PENDIENTE"
                            }));
                        } else if (this.fechaVencimiento) {
                            datosCuotas = [{
                                fecha_vence: fechaVencimientoCXC,
                                monto: totalGeneral,
                                estado: "PENDIENTE"
                            }];
                        }

                        await editaCuentaxCobrar(key, 'monto_total', totalGeneral.toFixed(2));
                        await editaCuentaxCobrar(key, 'monto_pendiente', totalGeneral);
                        await editaCuentaxCobrar(key, 'fecha_vence', fechaVencimientoCXC);
                        await editaCuentaxCobrar(key, 'dias_credito', cabecera.dias_credito || 0);
                        await editaCuentaxCobrar(key, 'datos', datosCuotas);
                    });
                } else {
                    let fechaVencimientoCXC = moment().unix();
                    if (this.fechaVencimiento) {
                        fechaVencimientoCXC = moment(this.fechaVencimiento).endOf('day').unix();
                    }
                    let datosCuotas = [];
                    if (this.cronogramaData && Array.isArray(this.cronogramaData.cuotas) && this.cronogramaData.cuotas.length > 0) {
                        datosCuotas = this.cronogramaData.cuotas.map(cuota => ({
                            id: Number(cuota.numero),
                            fecha_vence: Math.floor(new Date(cuota.vencimiento + "T23:59:59").getTime() / 1000),
                            monto: cuota.importe,
                            estado: "PENDIENTE"
                        }));
                    } else if (this.fechaVencimiento) {
                        datosCuotas = [{
                            id: 1,
                            fecha_vence: fechaVencimientoCXC,
                            monto: totalGeneral,
                            estado: "PENDIENTE"
                        }];
                    }
                    const cuentaPorCobrar = {
                        monto_total: totalGeneral.toFixed(2),
                        monto_pendiente: totalGeneral,
                        cliente_zona: cabecera.cliente_zona || this.clienteData?.zona || '',
                        estado: 'PENDIENTE',
                        documento: cabecera.doc_numero || this.numero,
                        moneda: this.moneda,
                        nombre: cabecera.cliente_nombre || this.nombreCompleto,
                        vendedor: cabecera.cod_vendedor || store.state.sedeActual.codigo,
                        doc_ref: pedidoId,
                        fecha: cabecera.fecha_emision,
                        fecha_vence: fechaVencimientoCXC,
                        dias_credito: cabecera.dias_credito || 0,
                        datos: datosCuotas
                    };

                    await nuevaCuentaxcobrar(pedidoId, cuentaPorCobrar);
                    console.log('Nueva cuenta por cobrar creada:', pedidoId);
                }

            } catch (error) {
                console.error('❌ Error al actualizar cuenta por cobrar:', error);
                store.commit("dialogosnackbar", "Pedido guardado pero hubo un error al actualizar la cuenta por cobrar");
            }
        },
        async crearCuentaxCobrarDesdeEdicion(pedidoId, cabecera, totalGeneral) {
            try {
                const bd = this.cabecera.id.split('-')[0];
                if (!bd) {
                    console.error('No se pudo determinar la BD');
                    return;
                }

                let fechaVencimientoCXC = moment().unix();
                if (this.fechaVencimiento) {
                    fechaVencimientoCXC = moment(this.fechaVencimiento).endOf('day').unix();
                }

                const datosCuotas = [{
                    id: 1,
                    fecha_vence: fechaVencimientoCXC,
                    monto: totalGeneral,
                    estado: "PENDIENTE"
                }];

                const diasCreditoFinal = this.cabecera.dias_credito || this.clienteData?.dias_credito || 0;

                const cuentaPorCobrar = {
                    monto_total: totalGeneral.toFixed(2),
                    monto_pendiente: totalGeneral,
                    cliente_zona: this.cabecera.cliente_zona || this.clienteData?.zona || '',
                    estado: 'PENDIENTE',
                    documento: this.cabecera.doc_numero,
                    moneda: this.moneda,
                    nombre: this.cabecera.cliente_nombre,
                    vendedor: this.cabecera.cod_vendedor || store.state.sedeActual.codigo,
                    doc_ref: pedidoId,
                    fecha: this.cabecera.fecha_emision || moment().unix(),
                    fecha_vence: fechaVencimientoCXC,
                    dias_credito: diasCreditoFinal,
                    datos: datosCuotas
                };

                await db.database().ref(bd).child('x_cobrar').child(pedidoId).set(cuentaPorCobrar);
                console.log('CxC creada:', pedidoId);

            } catch (error) {
                console.error('Error al crear CxC:', error);
                store.commit("dialogosnackbar", "Error al crear la cuenta por cobrar");
            }
        },

        async eliminarCuentaxCobrar(pedidoId) {
            try {
                const bd = this.cabecera.id.split('-')[0];
                if (!bd) {
                    console.error('No se pudo determinar la BD');
                    return;
                }

                const snapshot = await db.database()
                    .ref(bd)
                    .child('x_cobrar')
                    .orderByChild('doc_ref')
                    .equalTo(pedidoId)
                    .once('value');

                if (snapshot.exists()) {
                    snapshot.forEach(async (childSnapshot) => {
                        const key = childSnapshot.key;
                        await db.database().ref(bd).child('x_cobrar').child(key).remove();
                        console.log('CxC eliminada:', key);
                    });
                } else {
                    console.log('No se encontró CxC para eliminar');
                }
            } catch (error) {
                console.error('Error al eliminar CxC:', error);
                store.commit("dialogosnackbar", "Error al eliminar la cuenta por cobrar");
            }
        },
    }
}
</script>
