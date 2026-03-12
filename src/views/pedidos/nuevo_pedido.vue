<template>
    <div class="pa-3">
        <v-row>
            <v-col cols="12" md="4"
                v-if="$vuetify.breakpoint.mdAndUp || ($vuetify.breakpoint.smAndDown && $vuetify.breakpoint.width > $vuetify.breakpoint.height)">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true" :x_categoria="true"
                    :cliente_selecto="cliente_s">
                </cat_fijo>
            </v-col>
            <v-col cols="12" md="8">
                <v-card class="mt-1">
                    <v-card-text>
                        <v-row class="mt-n1" dense>
                            <v-col cols="6" xs="6">
                                <cat_fijo v-if="esMovil" ref="catFijo" @agrega_lista="agregar_lista($event)"
                                    :muestra_tabla="false" :x_categoria="true" :cliente_selecto="cliente_s">
                                </cat_fijo>
                            </v-col>
                            <v-col cols="6" xs="12">
                                <v-btn class="mt-1 ml-2" small elevation="3" rounded color="success"
                                    @click="abre_catalogo()">
                                    Catalogo
                                    <v-icon color="white" class="mx-auto text--center"
                                        small>mdi-archive-arrow-down</v-icon>

                                </v-btn>
                            </v-col>

                        </v-row>
                    </v-card-text>
                </v-card>
                <h4 class="mb-n5 mt-1 red--text" v-if="cliente_s != ''">
                    <div> Cliente : {{ cliente_s.nombre }}</div>
                    <div v-if="esListaPreciosActivo && listasPreciosCliente.length" class="mt-1">
                        <!-- <v-chip v-for="lista in listasPreciosCliente" :key="lista" small outlined
                            :color="CONFIG_LISTAS[lista]?.color || 'grey'" class="mr-1">
                            <v-icon left small>mdi-tag</v-icon>
                            {{ CONFIG_LISTAS[lista]?.nombre || lista }}
                        </v-chip> -->
                    </div>
                </h4>

                <v-alert v-if="excedeLineaCredito" type="error" dense border="left" colored-border class="mt-8 mb-6"
                    icon="mdi-alert-octagon">
                    <div class="d-flex flex-wrap justify-space-between align-center text-caption">
                        <span>Línea de crédito: <strong>{{ moneda }} {{ lineaCreditoCliente.toFixed(2)
                                }}</strong></span>
                        <span>Deuda: <strong class="red--text">{{ moneda }} {{ deudaCliente.toFixed(2)
                                }}</strong></span>
                        <span>Disponible: <strong class="red--text">{{ moneda }} {{ saldoDisponible.toFixed(2)
                                }}</strong></span>
                    </div>
                    <div class="mt-1 red--text text-caption font-weight-medium">
                        El monto del pedido ({{ moneda }} {{ totalDetalle.toFixed(2) }}) supera el saldo disponible
                    </div>
                </v-alert>

                <v-card class="mt-5">
                    <div class="tabla-scroll">
                        <v-simple-table class="elevation-0" dense :class="{ 'tabla-dark': tablaOscura }">
                            <!-- Sin encabezado: usamos tarjetas -->
                            <thead class="d-none">
                                <tr>
                                    <th>Ítems</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="item in listaproductos" :key="item.uuid || item.id"
                                    @click.prevent="editaProducto(item)">
                                    <td class="pa-0 mt-n1 mb-n1">
                                        <v-card class="ma-1 pa-2" outlined :elevation="0" :ripple="!tablaOscura"
                                            :class="{ 'card-dark': tablaOscura }">

                                            <div class="d-flex align-center mt-n2 mb-n2">
                                                <!-- Contenido -->
                                                <div class="flex-grow-1 mr-2">
                                                    <div class="text-caption grey--text text--darken-1">
                                                        <!-- Precio + chips -->
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
                                                        <v-chip v-if="Number(item.preciodescuento) > 0" x-small
                                                            class="ml-1" color="deep-orange" text-color="white" label>
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
                                                        <v-chip v-if="item.operacion === 'GRATUITA'" x-small
                                                            class="ml-1" color="pink" text-color="white" label>
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
                                <tr v-if="!listaproductos || listaproductos.length === 0" class="empty-full">
                                    <td :class="['text-center', tablaOscura ? 'white--text' : 'grey--text']">
                                        No hay productos en la lista
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </div>
                </v-card>

                <v-card class="mt-3 pa-1 totals-sticky">
                    <v-row>
                        <v-col cols="7">
                            <v-list-item-content class="ml-3">
                                <v-list-item-subtitle>

                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h3>SubTotal: {{ moneda }} {{ sumaTotal() }}</h3>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h4 class="red--text">Descuentos: {{ moneda }} {{ sumaDescuentos() }}</h4>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    <h2>Total: <select class="mr-n1 red--text" id="moneda" name="moneda"
                                            v-model="moneda">
                                            <option v-for="moneda in $store.state.moneda" :key="moneda.codigo"
                                                :value="moneda.simbolo">
                                                {{ moneda.simbolo }}
                                            </option>
                                        </select> {{ redondear(sumaTotal() - sumaDescuentos()) }}</h2>
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </v-col>
                        <v-col cols="1">
                        </v-col>
                        <v-col cols="3">
                            <v-btn block elevation="15" rounded v-if="listaproductos != ''" color="error"
                                @click="grabar()" :disabled="excedeLineaCredito">
                                Grabar
                            </v-btn>
                        </v-col>

                    </v-row>
                </v-card>
            </v-col>
        </v-row>


        <v-dialog v-model="dial_catalogo" max-width="550">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_catalogo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-1">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true"
                    :x_categoria="false">
                </cat_fijo>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_guardar" max-width="640">
            <v-card class="pa-3 rounded-xl">
                <v-toolbar dense flat>
                    <v-toolbar-title class="subtitle-1 font-weight-medium">
                        Guardar Pedido
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-chip small class="mr-2" outlined>
                        Total: <strong class="ml-1">{{ redondear(sumaTotal() - sumaDescuentos()) }}</strong>
                    </v-chip>
                    <v-btn icon @click="dial_guardar = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-divider></v-divider>


                <!-- Tipo de comprobante -->
                <v-row dense class="">
                    <v-col cols="12">
                        <v-radio-group v-model="tipocomprobante" row dense>
                            <v-radio label="Nota de venta" value="T"></v-radio>
                            <!-- <v-radio label="Boleta" value="B"></v-radio>
                            <v-radio label="Factura" value="F"></v-radio> -->
                        </v-radio-group>
                    </v-col>
                </v-row>

                <v-row dense class="mt-n3">
                    <v-col cols="6" sm="4">
                        <v-select readonly outlined dense v-model="documento" :items="documentos" label="Tipo Doc"
                            hide-details prepend-inner-icon="mdi-card-account-details-outline" />
                    </v-col>
                    <v-col cols="6" sm="8">
                        <v-text-field readonly outlined dense type="number" v-model="numero" label="Número"
                            append-icon="mdi-magnify" @click:append="BuscarDocumento()"
                            @keyup.enter="BuscarDocumento()" />
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n5">
                        <v-text-field readonly outlined dense v-model="nombreCompleto" label="Nombres completos"
                            prepend-inner-icon="mdi-account" />
                    </v-col>
                    <v-col cols="12" class="mt-n5">
                        <!-- Dirección con icono de mapa al costado -->
                        <v-layout dense align-center>
                            <v-flex>
                                <v-text-field class="" outlined dense v-model="direccion"
                                    label="Direccion"></v-text-field>
                            </v-flex>
                            <v-btn icon small color="info" class="ml-2 mt-n8" @click="ver_direcciones">
                                <v-icon>mdi-directions</v-icon>
                            </v-btn>
                        </v-layout>

                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" sm="6" class="mt-n5">
                        <v-text-field outlined dense type="tel" v-model="telfcliente" label="Teléfono"
                            prepend-inner-icon="mdi-phone" />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-n5">
                        <v-select outlined dense v-model="formaPago" :items="opcionesFormaPago" label="Forma de pago"
                            prepend-inner-icon="mdi-cash-multiple" />
                    </v-col>

                    <v-col cols="6" class="mt-n5" v-if="formaPago === 'CREDITO'">
                        <v-text-field outlined dense type="date" v-model="fechaVencimiento" :min="hoyISO"
                            label="Vence el" prepend-inner-icon="mdi-calendar" />
                    </v-col>
                    <v-col cols="6" class="mt-n5" v-if="formaPago === 'CREDITO'">
                        <v-btn class="mt-2" x-small block color="indigo" dark @click="abrirCronograma">
                            Cronograma
                            <v-icon right small>mdi-calendar-clock</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n5">
                        <v-text-field outlined dense v-model="observacion" label="Observación"
                            prepend-inner-icon="mdi-note-text" />
                    </v-col>
                </v-row>
                <v-row class="mt-n6" dense>
                    <v-col cols="6">
                        <v-switch v-model="imprime_orden" dense inset color="indigo" :label="`Imprime Orden Pedido`"
                            prepend-icon="mdi-printer" class="mt-0" hide-details />
                    </v-col>
                    <v-col cols="6">
                        <v-select v-if="$store.state.permisos.moduloempresa" outlined dense v-model="cod_vendedor"
                            class="" :items="$store.state.array_sedes" item-text="nombre" item-value="codigo"
                            label="Vendedor">
                            <template v-slot:item="{ item }"><span>{{ item.nombre }}</span></template>
                            <template v-slot:selection="{ item }"><span>{{ item && item.nombre }}</span></template>
                        </v-select>
                    </v-col>
                </v-row>



                <v-divider></v-divider>

                <v-card-actions class="pa-3">
                    <v-spacer></v-spacer>
                    <v-btn text color="grey darken-1" @click="dial_guardar = false">
                        Cancelar
                    </v-btn>
                    <v-btn color="red" dark @click="confirmarGuardado">
                        Guardar
                        <v-icon right>mdi-content-save</v-icon>
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>


        <!-- Dialog de progreso -->
        <v-dialog v-model="loadingGuardar" persistent max-width="300">
            <v-card class="pa-6 text-center">
                <v-progress-circular indeterminate size="60" color="red"></v-progress-circular>
                <div class="mt-3">Guardando pedido...</div>
            </v-card>
        </v-dialog>
        <dialog_direcciones_cliente v-model="dial_direcciones"
            :cliente-id="numero || (cliente_s && cliente_s.documento) || ''" @seleccion="onDireccionSeleccionada" />

        <dial_stock v-model="dialStock" :items="sinStock" @close="dialStock = false" />

        <dial_mapas v-model="dialogoMapa" :guardar_auto="true" @cierra="dialogoMapa = false" />
        <cronograma v-if="dialogoCronograma" :totalCredito="Number(sumaTotal())" @cierra="dialogoCronograma = false"
            @emite_cronograma="guarda_cronograma($event)" :pagoInicial="0" :moneda="moneda" :planExistente="cronograma"
            :diasCredito="cliente_s?.dias_credito || 0" />
        <dial_edita_prod v-if="dialogoProducto" @cierra="dialogoProducto = false"
            @editaProducto="editaProductoFinal($event)" :item_selecto="item_selecto" @eliminaedita="eliminaedita()" />
    </div>
</template>

<script>
import moment from 'moment'
import store from '@/store/index'
import cat_fijo from '@/components/catalogo_fijo'
import dial_mapas from '../clientes/dial_mapa.vue'
import { pdfGenera } from './formatos/orden_pedido.js'
import { aplicaPreciosYBonos, agregarLista, analizaPreciosParcial, analizaGruposParcial } from "../funciones/calculo_bonos";
import {
    aplicarPreciosPorLista,
    cambiarTipoPrecioManual,
    CONFIG_LISTAS,
    TIPOS_LISTA,
    validarPreciosProducto
} from "../funciones/calculo_lista_precios";
import dialog_direcciones_cliente from '@/views/clientes/dialogos/dial_direcciones'
import cronograma from '../ventas/dialogos/cronograma_creditos.vue'
import dial_edita_prod from '../ventas/edita_producto.vue'
import axios from "axios"
import CryptoJS from "crypto-js";
import { allcuentaxcobrar, nuevaCuentaxcobrar } from '@/db'
import { colClientes } from '@/db_firestore'
import dial_stock from '../ventas/dialogos/dial_stock_insuficiente.vue' // ajusta ruta real

export default {
    name: 'caja',

    components: {
        cat_fijo,
        dial_mapas,
        cronograma,
        dial_edita_prod,
        dialog_direcciones_cliente,
        dial_stock
    },

    data() {
        return {
            dialogoCronograma: false,
            loadingGuardar: false,
            tipocomprobante: 'T',
            documentos: ['SIN DOCUMENTO', 'DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',
            numero: '',
            nombreCompleto: '',
            telfcliente: '',
            direccion: '',
            observacion: '',
            dial_guardar: false,
            dial_catalogo: false,
            moneda: 'S/',
            dialogoProducto: false,
            listaproductos: [],
            preciodescuento: '',
            item_selecto: [],
            cliente_s: [],
            formaPago: 'CONTADO',
            fechaVencimiento: '', // ISO yyyy-mm-dd cuando sea CREDITO
            dialogoMapa: false,
            dial_direcciones: false,
            imprime_orden: false,
            cronograma: null,
            modoOrdenProductos: 'push',
            cod_vendedor: store.state.sedeActual.codigo,
            lineaCreditoCliente: 0,
            deudaCliente: 0,
            cargandoCredito: false,
            dialStock: false,
            sinStock: [],
            modoOrdenProductos: "push",
            tablaOscura: false,
            CONFIG_LISTAS: CONFIG_LISTAS,
        }
    },
    created() {
        this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        const data = store?.state?.cliente_selecto;

        if (data) {
            // Busca la dirección principal
            const dirPri = Array.isArray(data.direcciones) && data.direcciones.length
                ? (data.direcciones.find(d => d && d.principal) || data.direcciones[0])
                : null;

            // Usa data.direccion si existe; si no, la principal del array
            const direccion = (data.direccion && String(data.direccion).trim())
                ? data.direccion
                : (dirPri?.direccion || '');

            this.cliente_s = data;
            this.numero = data.documento || '';
            this.direccion = direccion;
            this.documento = data.tipodoc || '';
            this.nombreCompleto = data.nombre || '';
            this.telfcliente = data.telefono || '';
            const usarDefecto = store.state.configuracion.usar_comprobante_defecto === true
            if (usarDefecto) {
                this.tipocomprobante = store.state.configuracion.defecto || 'T';
            } else {
                this.tipocomprobante = data.tipocomprobante || 'T';
            }
            // OPCIONAL: si tu componente tiene estas props/campos, completa coords
            if ('latitud' in this) this.latitud = (data.latitud ?? dirPri?.latitud ?? null);
            if ('longitud' in this) this.longitud = (data.longitud ?? dirPri?.longitud ?? null);

            if (this.lineaCreditoActivo && data.documento) {
                this.cargarDatosCredito(data.documento);
            }
        } else {
            this.tipocomprobante = store.state.configuracion.defecto || 'T';
        }
        if ((!this.listaproductos || this.listaproductos.length === 0) &&
            Array.isArray(store.state.lista_productos) &&
            store.state.lista_productos.length > 0) {
            // clon simple para no mutar directamente el state
            this.listaproductos = JSON.parse(JSON.stringify(store.state.lista_productos));
        }
        const savedModo = localStorage.getItem("modoOrdenProductos");
        if (savedModo === "push" || savedModo === "top") {
            this.modoOrdenProductos = savedModo;
        }

        const savedDark = localStorage.getItem("tablaOscura");
        if (savedDark === "1") this.tablaOscura = true;
        if (savedDark === "0") this.tablaOscura = false;
    },
    beforeDestroy() {
        store.commit("emision", '')
        store.commit("cliente_selecto", '')
        store.commit("lista_productos", []);
    },
    computed: {
        esMovil() {
            return this.$vuetify && this.$vuetify.breakpoint ? this.$vuetify.breakpoint.smAndDown : false
        },
        hoyISO() {
            return moment().format('YYYY-MM-DD');
        },
        lineaCreditoActivo() {
            return this.$store.state.configuracion?.linea_credito_activo === true;
        },
        totalDetalle() {
            let suma = 0;
            for (let i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].operacion !== 'GRATUITA') {
                    suma += (this.listaproductos[i].cantidad * this.listaproductos[i].precio) - parseFloat(this.listaproductos[i].preciodescuento || 0);
                }
            }
            return suma;
        },
        saldoDisponible() {
            return this.lineaCreditoCliente - this.deudaCliente;
        },
        excedeLineaCredito() {
            if (!this.lineaCreditoActivo) return false;
            if (this.lineaCreditoCliente <= 0) return false;
            return this.totalDetalle > this.saldoDisponible;
        },
        opcionesFormaPago() {

            return ['CONTADO', 'CREDITO'];
        },
        esListaPreciosActivo() {
            return this.$store.state.configuracion?.lista_precios === true;
        },
        listasPreciosCliente() {
            return this.cliente_s?.listas_precios || [];
        },
        tieneMultiplesListas() {
            return this.esListaPreciosActivo && this.listasPreciosCliente.length > 1;
        },
        colorPrecioTipo() {
            return (tipo) => {
                const colores = {
                    'distribuidor': 'purple',
                    'mayorista': 'blue',
                    'minorista': 'green',
                    'regular': 'grey'
                };
                return colores[tipo] || 'grey';
            };
        }

    },
    watch: {
        modoOrdenProductos(nv) {
            localStorage.setItem("modoOrdenProductos", nv);
        },
        tablaOscura(nv) {
            localStorage.setItem("tablaOscura", nv ? "1" : "0");
        },
        formaPago(nv) {
            if (nv === 'CREDITO') {
                // Usar días de crédito del cliente o 7 días por defecto
                const diasCredito = this.cliente_s?.dias_credito || 7;
                this.fechaVencimiento = moment().add(diasCredito, 'days').format('YYYY-MM-DD');
            } else {
                this.fechaVencimiento = '';
            }
        },
        numero(nv) {
            const docStr = String(nv || '').trim();

            // Si tiene 11 dígitos, forzamos RUC
            if (docStr.length === 11) {
                this.documento = 'RUC';
            }

            // Si tiene 8 dígitos y estaba en RUC, regresamos a DNI (opcional)
            if (docStr.length === 8 && this.documento === 'RUC') {
                this.documento = 'DNI';
            }
        },

        listaproductos: {
            handler(nuevo) {
                store.commit("lista_productos", nuevo);
            },
            deep: true, // importante para detectar cambios dentro del array/objetos
        },
        modoOrdenProductos(nuevo) {
            localStorage.setItem('modoOrdenProductos', nuevo);
        },
        'cliente_s': {
            handler(nuevoCliente) {
                if (this.esListaPreciosActivo && this.listaproductos.length > 0) {
                    this.recalculoCompleto();
                }
            },
            deep: true
        },

        // Watch para cuando cambian las listas de precios del cliente
        'cliente_s.listas_precios': {
            handler(nuevasListas) {
                if (this.esListaPreciosActivo && this.listaproductos.length > 0) {
                    this.recalculoCompleto();
                }
            },
            deep: true
        }
    },

    methods: {
        async cargarDatosCredito(documento) {
            if (!documento || !this.lineaCreditoActivo) return;

            this.cargandoCredito = true;
            try {
                const docSnap = await colClientes().doc(documento).get();
                if (docSnap.exists) {
                    const clienteData = docSnap.data();
                    this.lineaCreditoCliente = parseFloat(clienteData.linea_credito || 0);
                } else {
                    this.lineaCreditoCliente = 0;
                }

                const snapshot = await allcuentaxcobrar()
                    .orderByChild('documento')
                    .equalTo(documento)
                    .once('value');

                let deudaTotal = 0;

                if (snapshot.exists()) {
                    snapshot.forEach(item => {
                        const cuenta = item.val();
                        if (cuenta.estado === 'PENDIENTE') {
                            deudaTotal += parseFloat(cuenta.monto_pendiente || 0);
                        }
                    });
                }
                this.deudaCliente = deudaTotal;
            } catch (error) {
                console.error('Error cargando datos de crédito:', error);
                this.lineaCreditoCliente = 0;
                this.deudaCliente = 0;
            } finally {
                this.cargandoCredito = false;
            }
        },
        abrirCronograma() {
            // solo tiene sentido si es CREDITO
            if (this.formaPago !== 'CREDITO') return;
            this.dialogoCronograma = true;
        },
        guarda_cronograma(cronograma) {
            this.fechaVencimiento = cronograma.fecha_ultima_cuota
            this.cronograma = cronograma;
            if ((!this.cliente_s?.dias_credito || this.cliente_s.dias_credito === 0) &&
                cronograma.dias_credito_calculados > 0) {
                this.cliente_s.dias_credito = cronograma.dias_credito_calculados;
            }
            this.dialogoCronograma = false; // Cierra el diálogo después de guardar
        },
        onDireccionSeleccionada(dir) {
            if (!dir) return;

            // 1) Asignar la calle al campo de dirección del pedido
            this.direccion = (dir.direccion || '').trim();

            // 2) Si la dirección trae coordenadas, úsalas para la cabecera (ubicacion_cliente)
            if (!this.cliente_s || typeof this.cliente_s !== 'object') {
                this.cliente_s = {};
            }

            if (dir.latitud !== undefined && dir.latitud !== null) {
                this.$set(this.cliente_s, 'latitud', dir.latitud);
            }

            if (dir.longitud !== undefined && dir.longitud !== null) {
                this.$set(this.cliente_s, 'longitud', dir.longitud);
            }
        },

        ver_direcciones() {
            // Documento del cliente (prioriza lo digitado; si no, el del cliente_s)
            const doc = String(this.numero || this.cliente_s?.documento || '').trim();

            if (!doc) {
                store.commit &&
                    store.commit(
                        'dialogosnackbar',
                        'Primero ingrese/busque el documento del cliente.'
                    );
                return;
            }

            // nos aseguramos de que "numero" tenga el doc
            this.numero = doc;

            // solo abrimos el diálogo; el componente hijo se encarga de leer al cliente
            this.dial_direcciones = true;
        },

        formatDireccionLista(d) {
            // Texto amigable para listar en el diálogo
            const linea = (d?.direccion || '').trim();
            const dis = (d?.distrito?.nombre || '').trim();
            const prov = (d?.provincia?.nombre || '').trim();
            const ref = (d?.referencia || '').trim();

            const loc = [dis, prov].filter(Boolean).join(', ');
            const base = [linea, loc].filter(Boolean).join(' — ');
            return ref ? `${base} · Ref: ${ref}` : base;
        },

        aplicarDireccion() {
            const d = this.list_direcciones?.[this.direccionSeleccionadaIndex];
            if (!d) { this.dial_direcciones = false; return; }

            // Pegamos al campo 'direccion' del comprobante (calle + distrito + provincia)
            this.direccion = [
                (d?.direccion || '').trim(),
                (d?.distrito?.nombre || '').trim(),
                (d?.provincia?.nombre || '').trim()
            ].filter(Boolean).join(' - ');

            this.dial_direcciones = false;
        },
        grabar() {
            // Siempre recalcular antes de grabar
            if (store.state.permisos.permite_editar_bono) {
                this.recalculoCompleto()
            }
            this.dial_guardar = true;
        },
        async confirmarGuardado() {
            // Validaciones mínimas
            if (!this.numero) {
                store.commit("dialogosnackbar", "Ingrese el número de documento");
                return;
            }
            const docStr = String(this.numero || '').trim();

            // Si es FACTURA, obligar RUC y 11 dígitos
            if (this.tipocomprobante === 'F') {
                if (this.documento !== 'RUC') {
                    store.commit("dialogosnackbar", "Para FACTURA el tipo de documento debe ser RUC");
                    return;
                }
                if (docStr.length !== 11) {
                    store.commit("dialogosnackbar", "El RUC debe tener 11 dígitos");
                    return;
                }
            }
            if (!this.nombreCompleto) {
                store.commit("dialogosnackbar", "Ingrese el nombre del cliente");
                return;
            }
            if (this.formaPago === 'CREDITO' && !this.fechaVencimiento) {
                store.commit("dialogosnackbar", "Seleccione la fecha de vencimiento");
                return;
            }
            if (!Array.isArray(this.listaproductos) || this.listaproductos.length === 0) {
                store.commit("dialogosnackbar", "Agregue al menos un producto");
                return;
            }

            this.loadingGuardar = true; // 🔹 abre dialogo progreso

            try {
                // Subtotal y totales
                const subTotal = parseFloat(this.sumaTotal() || 0);
                const descuentos = parseFloat(this.sumaDescuentos() || 0);
                const totalGeneral = parseFloat((subTotal - descuentos).toFixed(2));
                let cronogramaCabecera = null;
                if (this.formaPago === 'CREDITO') {
                    if (this.cronograma && Array.isArray(this.cronograma.cuotas) && this.cronograma.cuotas.length > 0) {
                        // Usa el cronograma emitido por el diálogo
                        cronogramaCabecera = this.cronograma.cuotas;
                    } else {
                        // Fallback: una sola cuota con el total y la fecha de vencimiento
                        cronogramaCabecera = [
                            {
                                numero: '001',
                                vencimiento: this.fechaVencimiento,
                                importe: totalGeneral,
                            }
                        ]

                    }
                }
                // Cabecera (ya lo tienes armado)
                const cabecera = {
                    tipo_comprobante: this.tipocomprobante,
                    moneda: this.moneda,
                    fecha_emision: moment().unix(),
                    condicion_pago: this.formaPago,
                    fecha_vencimiento: this.formaPago === 'CREDITO' ? this.fechaVencimiento : null,
                    dias_credito: this.cronograma?.dias_credito_calculados || this.cliente_s?.dias_credito || 0,
                    cronograma: cronogramaCabecera,
                    doc_tipo: this.documento,
                    doc_numero: this.numero,
                    cliente_nombre: this.nombreCompleto,
                    cliente_direccion: this.direccion,
                    cliente_zona: this.cliente_s?.zona || '',
                    cliente_telefono: this.telfcliente || '',
                    subtotal: subTotal,
                    descuentos: descuentos,
                    total: totalGeneral,
                    total_items: this.listaproductos.length,
                    observacion: this.observacion || '',
                    cod_vendedor: this.cod_vendedor || store.state.sedeActual.codigo,
                    estado: 'atendido',
                    ubicacion_cliente: {
                        lat: this.cliente_s.latitud,
                        lng: this.cliente_s.longitud
                    },
                    ubicacion_pedido: store.state.ubicacion_actual,
                    peso_total: this.listaproductos.reduce((acc, item) => acc + (Number(item.peso) || 0), 0),
                };
                console.log('⏺️ Cabecera lista para enviar:', cabecera);
                const detalle = this.listaproductos;

                const payload = { cabecera, detalle, control_stock: true, ruc_asociado: this.$store.state.baseDatos.ruc_asociado };
                console.log('⏺️ Payload listo para enviar:', payload);

                var resp = await this.api_rest(payload, "guardar_pedido");
                if (!resp) {
                    // ya se mostró el dial de stock insuficiente
                    return;
                }

                if (this.formaPago === 'CREDITO' && resp?.data?.id) {
                    await this.crearCuentaxCobrar(resp.data.id, cabecera, totalGeneral);
                }

                if (this.imprime_orden) {
                    const id = resp?.data?.id || resp?.id || null;
                    cabecera.id = id;
                    pdfGenera(cabecera, detalle, store.state.configImpresora.tamano);
                }
                store.commit("dialogosnackbar", "Documento guardado con éxito ✅");
                this.dial_guardar = false;

                this.resetFormulario();

                const origen = store.state.origen_pedido_nuevo;
                store.commit("clearOrigenPedido");

                if (origen === 'visitas') {
                    this.$router.push({
                        name: 'lista'
                    });
                } else {
                    this.$router.push({
                        name: 'lista_pedidos'
                    });
                }
            } catch (err) {
                const status = err?.response?.status;
                const body = err?.response?.data || {};

                if (status === 409 && body?.code === "STOCK_INSUFICIENTE") {
                    // ya se manejó en api_rest
                    return;
                }

                console.error("❌ Error guardando:", err);
                store.commit("dialogosnackbar", "Error al guardar el pedido");
            } finally {
                this.loadingGuardar = false;
            }
        },
        resetFormulario() {
            this.numero = "";
            this.nombreCompleto = "";
            this.telfcliente = "";
            this.direccion = "";
            this.observacion = "";
            this.listaproductos = [];
            this.formaPago = "CONTADO";
            this.fechaVencimiento = "";
        },
        async api_rest(data, metodo) {
            try {
                console.log(data.cabecera)
                const idem = this.buildIdemKeyPedido({
                    bd: store.state.baseDatos.bd,
                    cabecera: data.cabecera,
                    detalle: data.detalle || []
                });

                const resp = await axios({
                    method: 'POST',
                    url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                    //url: 'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion',
                    headers: { 'X-Idempotency-Key': idem },
                    data: {
                        bd: store.state.baseDatos.bd,
                        data,
                        metodo
                    }
                });

                return resp.data;

            } catch (err) {
                console.log(err)
                const status = err?.response?.status;
                const body = err?.response?.data || {};

                // ✅ STOCK INSUFICIENTE
                if (status === 409 && body?.code === "STOCK_INSUFICIENTE") {
                    this.sinStock = Array.isArray(body.sinStock) ? body.sinStock : [];
                    this.dialStock = true;
                    return null; // 👈 importante
                }

                throw err;
            }
        },

        buildIdemKeyPedido({ bd, cabecera = {}, detalle = [] }) {
            const normalizar = (v) =>
                String(v || "")
                    .trim()
                    .replace(/\s+/g, " ")
                    .toUpperCase();

            const ts = cabecera.fecha_emision
                ? Number(cabecera.fecha_emision)
                : moment().unix();

            const bucket3min = Math.floor(ts / 180);

            const base = {
                bucket: bucket3min,
                tipo: cabecera.tipo_comprobante || "",
                doc: cabecera.doc_numero || "",
                nombre: normalizar(cabecera.cliente_nombre),
                direccion: normalizar(cabecera.cliente_direccion || ''),
                zona: normalizar(cabecera.cliente_zona),
                total: Number(cabecera.total || 0).toFixed(2),
                detalle: (detalle || [])
                    .map(d => `${d.id}:${d.cantidad}:${Number(d.precio_base || d.precio || 0).toFixed(4)}`)
                    .sort()
                    .join("|"),
                vendedor: cabecera.cod_vendedor || "",
                ruc: cabecera.ruc_asociado || ""
            };

            const raw = JSON.stringify(base);
            const hash10 = CryptoJS.SHA256(raw).toString().substring(0, 10);

            return `${bd}-${hash10}`;
        },
        /* agregar_lista(value) {

            
            // 1) Usamos tu helper para fusionar / sumar cantidades / etc.
            console.log(value)
            let nuevaLista = agregarLista({
                listaActual: this.listaproductos,
                nuevosItems: value,
                createUUID: this.create_UUID,
                redondear: (n) => this.redondear(n),
            });

            // 2) Marcar timestamp interno para controlar el orden visual
            const baseTs = Date.now();
            let offset = 0;

            nuevaLista = nuevaLista.map(item => {
                // si ya tenía marca, la respetamos
                if (item.__tsAdd) return item;

                // si no, se la ponemos (sirve para items recién agregados)
                const nuevo = { ...item };
                nuevo.__tsAdd = baseTs + (offset++); // pequeño offset para evitar empates
                return nuevo;
            });

            // 3) Ordenar según modo
            if (this.modoOrdenProductos === 'top') {
                // Últimos agregados arriba → mayor __tsAdd primero
                nuevaLista.sort((a, b) => {
                    const ta = a.__tsAdd || 0;
                    const tb = b.__tsAdd || 0;
                    return tb - ta;
                });
            }
            // si es 'push', dejamos el orden que devuelve agregarLista

            // 4) Asignamos y recalculamos bonos / precios
            this.listaproductos = nuevaLista;
            this.recalculoUltimoAgregado(value);
        }, */

        agregar_lista(value) {
            let nuevaLista = agregarLista({
                listaActual: this.listaproductos,
                nuevosItems: value,
                createUUID: this.create_UUID,
                redondear: (n) => this.redondear(n),
            });

            const nuevosIds = (Array.isArray(value) ? value : [value])
                .map(x => String(x?.id ?? x?.cod_producto ?? ''))
                .filter(Boolean);
            const itemsConLista = (Array.isArray(value) ? value : [value])
                .filter(item => item._lista_precios || item.precio_tipo);

            if (itemsConLista.length > 0) {
                this.listaproductos = nuevaLista;
            }
            else if (this.esListaPreciosActivo && this.listasPreciosCliente.length > 0 && this.cliente_s) {

                nuevaLista = aplicarPreciosPorLista({
                    lineas: nuevaLista,
                    productos: this.$store.state.productos,
                    cliente: this.cliente_s,
                    idsAfectados: nuevosIds,
                    opciones: {
                        respetarManual: true,
                        forzar: false
                    }
                });

                this.listaproductos = nuevaLista;
            } else {
                this.listaproductos = nuevaLista;

                if (nuevosIds.length) {
                    this.recalculoUltimoAgregado(value);
                }
            }

            const baseTs = Date.now();
            let offset = 0;
            this.listaproductos = this.listaproductos.map(item => {
                if (!item.__tsAdd) {
                    item.__tsAdd = baseTs + (offset++);
                }
                return item;
            });

            if (this.modoOrdenProductos === 'top') {
                this.listaproductos.sort((a, b) => (b.__tsAdd || 0) - (a.__tsAdd || 0));
            }
        },

        recalculoUltimoAgregado(value) {
            const items = Array.isArray(value) ? value : [value];

            // ids agregados (último/últimos)
            const ids = items
                .map(x => String(x?.id ?? x?.cod_producto ?? ''))
                .filter(Boolean);

            if (!ids.length) return;

            // ✅ 1) Precios SOLO para esos IDs (si permites editar precios)

            this.listaproductos = analizaPreciosParcial({
                lineas: this.listaproductos,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                idsAfectados: ids,
                lista_precios: this.lista_precios_selecta,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });


            // ✅ 2) Bonos: SOLO si está permitido editar bono (si no, NO tocamos nada)

            this.listaproductos = analizaGruposParcial({
                lineas: this.listaproductos,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                idsAfectados: ids, // esto limita a grupos del último producto
                createUUID: this.create_UUID,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });

        },
        recalculoCompleto() {
            if (this.esListaPreciosActivo && this.listasPreciosCliente.length > 0 && this.cliente_s) {
                // Usar lógica de listas de precios
                this.listaproductos = aplicarPreciosPorLista({
                    lineas: this.listaproductos,
                    productos: this.$store.state.productos,
                    cliente: this.cliente_s,
                    idsAfectados: null,
                    opciones: {
                        respetarManual: true,
                        forzar: false
                    }
                });
            } else {
                // Usar lógica tradicional de bonos
                this.listaproductos = aplicaPreciosYBonos({
                    lineas: this.listaproductos,
                    productos: this.$store.state.productos,
                    bonos: this.$store.state.bonos,
                    createUUID: this.create_UUID,
                    redondear: (n) => this.redondear(n),
                    inPlace: true,
                });
            }
        },

        editaProducto(val) {
            this.item_selecto = val
            this.dialogoProducto = true
        },


        eliminaedita() {
            var pos = this.listaproductos.map(e => e.uuid).indexOf(this.item_selecto.uuid)
            this.listaproductos.splice(pos, 1)
            this.dialogoProducto = false
            if (store.state.permisos.permite_editar_bono) {
                this.recalculoCompleto()
            }
        },
        editaProductoFinal(lineaActualizada) {
            // ✅ si el usuario cambió el precio, marcamos como manual
            // (asumo que en tu diálogo editas lineaActualizada.precio)
            lineaActualizada.precio_manual = true;

            // opcional: si quieres conservar "precio_base" como el precio original de catálogo:
            // si no existe base, la seteas una vez
            if (lineaActualizada.precio_base == null) {
                lineaActualizada.precio_base = Number(lineaActualizada.precio || this.item_selecto.precio || 0);
            }

            const idx = this.listaproductos.findIndex(l => l.uuid === lineaActualizada.uuid);
            if (idx !== -1) this.$set(this.listaproductos, idx, lineaActualizada);

            if (store.state.permisos.permite_editar_bono) this.recalculoCompleto();
            this.dialogoProducto = false;
        },



        sumaTotal() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].operacion != 'GRATUITA') {
                    suma = suma + (this.listaproductos[i].cantidad * this.listaproductos[i].precio)
                }
            }
            this.totalDocumento = suma.toFixed(2)
            return suma.toFixed(2)
        },
        sumaDescuentos() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                suma = suma + parseFloat(this.listaproductos[i].preciodescuento)
            }
            this.totalDescuento = (suma).toFixed(2)
            return (suma).toFixed(2)
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        abre_catalogo() {
            this.dial_catalogo = true
        },
        cambiarTipoPrecio(item, nuevoTipo) {
            if (!this.esListaPreciosActivo || !item || !nuevoTipo) return;

            const producto = this.$store.state.productos.find(p => p.id === item.id);
            if (!producto) return;

            const itemActualizado = cambiarTipoPrecioManual(item, nuevoTipo, producto);

            if (itemActualizado) {
                const idx = this.listaproductos.findIndex(l => l.uuid === item.uuid);
                if (idx !== -1) {
                    this.$set(this.listaproductos, idx, itemActualizado);
                }
            }
        },
        async crearCuentaxCobrar(pedidoId, cabecera, totalGeneral) {
            try {
                let fechaVencimientoCXC = moment().unix();
                if (this.fechaVencimiento) {
                    fechaVencimientoCXC = moment(this.fechaVencimiento).endOf('day').unix();
                }
                const montoTotal = parseFloat(totalGeneral);
                let datosCuotas = [];

                if (this.cronograma && Array.isArray(this.cronograma.cuotas) && this.cronograma.cuotas.length > 0) {
                    datosCuotas = this.cronograma.cuotas.map(cuota => ({
                        id: cuota.numero,
                        fecha_vence: Math.floor(new Date(cuota.vencimiento + "T23:59:59").getTime() / 1000),
                        monto: cuota.importe,
                        estado: "PENDIENTE"
                    }));
                } else if (this.formaPago === 'CREDITO' && this.fechaVencimiento) {
                    datosCuotas = [{
                        fecha_vence: Math.floor(new Date(this.fechaVencimiento + "T23:59:59").getTime() / 1000),
                        monto: montoTotal,
                        estado: "PENDIENTE"
                    }];
                }

                const cuentaPorCobrar = {
                    monto_total: montoTotal.toFixed(2),
                    monto_pendiente: montoTotal,
                    cliente_zona: cabecera.cliente_zona || this.cliente_s?.zona || '',
                    estado: 'PENDIENTE',
                    documento: cabecera.doc_numero || this.numero,
                    moneda: this.moneda,
                    nombre: cabecera.cliente_nombre || this.nombreCompleto,
                    vendedor: this.cod_vendedor || store.state.sedeActual.codigo,
                    doc_ref: pedidoId,
                    fecha: cabecera.fecha_emision,
                    fecha_vence: fechaVencimientoCXC,
                    dias_credito: cabecera.dias_credito || this.cliente_s?.dias_credito || 0,
                    datos: datosCuotas
                };

                await nuevaCuentaxcobrar(pedidoId, cuentaPorCobrar);

            } catch (error) {
                console.error('❌ Error al crear cuenta por cobrar:', error);
                store.commit("dialogosnackbar", "Pedido guardado pero hubo un error al crear la cuenta por cobrar");
            }
        }
    },

}
</script>
<style>
.selected-row {
    background-color: #b2ff85;
    /* Puedes cambiar el color de fondo para la fila seleccionada */
}

.table-container {
    height: 65vh;
    overflow-y: auto;
}

/* La columna ocupa el alto de la vista para que el scroll viva dentro */
.venta-col {
    min-height: 100vh;
}

/* Área desplazable solo para la lista (clave: min-height:0 en hijos flex) */
.tabla-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0;
}

/* Mantiene el card de totales visible abajo (opcional) */
.totals-sticky {
    position: sticky;
    bottom: 0;
    z-index: 5;
}

/* Pequeño ajuste para iOS/Android (evita “salto” al abrir teclado) */
@supports (height: 100dvh) {
    .venta-col {
        min-height: 100dvh;
    }
}

.tabla-dark {
    background: #000 !important;
    color: #fff !important;
}

.tabla-dark td,
.tabla-dark th {
    background: #363535 !important;
    color: #fff !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
}

.card-dark {
    background: #2e2d2d !important;
    color: #fff !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
}

.card-dark .grey--text {
    color: rgba(255, 255, 255, 0.7) !important;
}

/* vacío centrado y alto */
.empty-full {
    height: 100%;
    min-height: 55vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* evita flash blanco al tocar */
.card-dark {
    -webkit-tap-highlight-color: transparent !important;
}
</style>
