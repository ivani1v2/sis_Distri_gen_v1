<template>
    <v-dialog v-model="dial" max-width="1100px" persistent>
        <v-card class="rounded-lg">

            <v-toolbar :color="arra_cabe_doC.modo_ajuste === 'ENTRADA' ? 'info' : 'red darken-1'" dense dark>
                <v-icon @click="cierra">mdi-close</v-icon>
                <v-toolbar-title class="ml-2 font-weight-bold">
                    Ajuste de Inventario ({{ arra_cabe_doC.modo_ajuste }})
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon color="amber lighten-2" @click="$refs.fileExcel.click()" small
                    title="Importar Excel (Código y Cantidad)">
                    Carga masiva<v-icon>mdi-file-excel</v-icon>
                </v-btn>

                <input ref="fileExcel" type="file" accept=".xlsx,.xls" style="display:none" @change="onExcelSelected" />
                <v-spacer></v-spacer>
                <v-btn icon color="info lighten-2" @click="dial_lista = true" title="Buscar y Añadir Producto">
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-divider vertical class="mx-2"></v-divider>
                <v-btn icon color="red lighten-2" @click="dial_anula = true" title="Anular Ajuste">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn icon color="green lighten-1" @click="dialogo_genera = true" title="Guardar Cambios">
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">

                <v-row dense class="mb-3">
                    <v-col cols="12" md="6">
                        <v-card outlined class="pa-3 fill-height">
                            <h4 class="text-subtitle-1 primary--text mb-1">
                                <v-icon small left>mdi-calendar-range</v-icon> Datos del Ajuste
                            </h4>
                            <v-divider class="mb-2"></v-divider>
                            <h5 class="text-caption">
                                **DOCUMENTO:** {{ arra_cabe_doC.tipodocumento }} / {{ arra_cabe_doC.sreferencia }}-{{
                                    arra_cabe_doC.creferencia }}
                            </h5>
                            <h5 class="text-caption">
                                **MODO:** <span
                                    :class="arra_cabe_doC.modo_ajuste === 'ENTRADA' ? 'info--text' : 'error--text'">{{
                                        arra_cabe_doC.modo_ajuste }}</span>
                                | **MOTIVO:** {{ arra_cabe_doC.motivo }}
                            </h5>
                            <h5 class="text-caption">
                                **EMISIÓN:** {{ conviertefecha(arra_cabe_doC.fecha_emision) }} | **MOVIMIENTO:** {{
                                    conviertefecha(arra_cabe_doC.fecha_ingreso) }}
                            </h5>
                            <h5 class="text-caption">
                                **RESPONSABLE:** {{ arra_cabe_doC.responsable }}
                            </h5>
                            <h5 class="text-caption" v-if="arra_cabe_doC.observacion">
                                **OBSERVACIÓN:** {{ arra_cabe_doC.observacion }}
                            </h5>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-card outlined class="pa-3 fill-height d-flex flex-column justify-center">
                            <h4 class="text-subtitle-1 success--text mb-2">
                                <v-icon small left>mdi-package-variant</v-icon> Búsqueda Rápida
                            </h4>
                            <v-autocomplete outlined dense autofocus label="Buscar producto por ID o Nombre"
                                auto-select-first v-model="busca_p" :items="productosConStock" item-text="nombre"
                                item-value="id" return-object @change="seleccionDirecta" hide-details>
                                <template v-slot:item="{ item }">
                                    <v-list-item-content>
                                        <v-list-item-title>
                                            <strong>{{ item.nombre }}</strong>
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="caption">
                                            ID: {{ item.id }} - Stock: {{ item.stock }} {{ item.medida }}
                                        </v-list-item-subtitle>
                                    </v-list-item-content>
                                </template>
                            </v-autocomplete>
                            <v-alert v-if="!lista_productos.length" type="info" outlined dense
                                class="mt-2 text-caption">
                                Use la lista desplegable o la lupa <v-icon x-small>mdi-magnify</v-icon> para añadir
                                ítems.
                            </v-alert>
                        </v-card>
                    </v-col>
                </v-row>

                <v-divider class="my-3"></v-divider>
                <v-simple-table fixed-header height="45vh" dense class="elevation-1">
                    <template v-slot:default>
                        <thead class="grey darken-3 black--text">
                            <tr>
                                <th class="text-left black--text" width="50%">Descripción (ID)</th>
                                <th class="text-left black--text" width="15%">Medida Base</th>
                                <th class="text-center black--text" width="15%">Cantidad</th>
                                <th class="text-center black--text" width="20%">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!lista_productos.length">
                                <td colspan="4" class="text-center grey--text text-caption">
                                    No hay productos registrados en este ajuste.
                                </td>
                            </tr>
                            <tr v-for="(item, index) in lista_productos" :key="item.uuid || index">
                                <td>
                                    <v-icon color="green" @click="editaProducto(item, index)" small
                                        class="mr-1">mdi-pencil</v-icon>
                                    <span class="font-weight-medium">{{ item.nombre }}</span>
                                    <div class="caption grey--text">{{ item.id }}</div>
                                </td>
                                <td>{{ item.medida }}</td>
                                <td class="text-center font-weight-bold">{{ item.cantidad }}</td>
                                <td class="text-center">
                                    <v-btn icon x-small color="error" @click="editaProducto(item, index)">
                                        <v-icon small>mdi-delete</v-icon>
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card-text>
        </v-card>

        <v-dialog v-model="dialogo_genera" max-width="460px">
            <v-card class="rounded-lg">
                <v-toolbar color="green" dense dark><v-toolbar-title>Confirmar
                        Guardado</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="dialogo_genera = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4 text-center">
                    <h2 class="text-h5">¿SEGURO DE CONTINUAR Y GRABAR EL AJUSTE?</h2>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="success" block large @click="genera_compra(true)">SÍ, GUARDAR AJUSTE</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoProducto" max-width="450px">
            <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark><v-toolbar-title>Editar
                        Ítem</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="dialogoProducto = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-select :items="arrayOperacion" label="Operación" dense outlined v-model="operacion_edita"
                        hint="Solo para referencia en inventario (Gravada/Gratuita)" persistent-hint></v-select>
                    <v-text-field dense outlined v-model="costo_edita" label="Costo Unitario (opcional)" type="number"
                        prefix="S/." />
                    <v-text-field dense outlined v-model="nombreEdita" label="Nombre del Producto" />
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="error" text @click="eliminar()">
                        <v-icon left>mdi-delete</v-icon> Eliminar Ítem
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" @click="grabaEdita()">
                        <v-icon left>mdi-content-save</v-icon> Grabar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialo_cantidad" max-width="400px">
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark><v-toolbar-title>Añadir
                        Cantidad</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="dialo_cantidad = false, btn = false, modo = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <div v-if="selecto" class="mb-3">
                        <div class="text-subtitle-2 font-weight-bold">{{ selecto.nombre }} (ID: {{ selecto.id }})</div>
                        <div class="caption grey--text">
                            Stock actual: <strong>{{ Number(selecto.stock).toFixed(2) }} UND.</strong>
                        </div>
                        <div class="caption grey--text" v-if="selecto.medida">
                            Factor Paquete ({{ selecto.medida }}): <strong>{{ Number(selecto.factor) || 1 }}
                                UND.</strong>
                        </div>
                    </div>

                    <v-row v-if="!modo" dense class="mb-3">
                        <v-col cols="12" class="mb-n2">
                            <v-alert type="warning" dense text class="text-caption">¿Cómo desea ingresar/retirar la
                                cantidad?</v-alert>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block :color="modo === 'entero' ? 'primary' : 'success lighten-1'"
                                @click="seleeciona_modo('entero')">
                                <v-icon left small>mdi-cube-outline</v-icon> {{ selecto.medida || 'PAQ' }}
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block :color="modo === 'fraccion' ? 'primary' : 'success lighten-1'"
                                @click="seleeciona_modo('fraccion')">
                                <v-icon left small>mdi-numeric</v-icon> UNIDAD
                            </v-btn>
                        </v-col>
                    </v-row>

                    <v-text-field v-if="modo" type="number" autofocus outlined dense v-model.number="cantidad"
                        :label="modo === 'entero' ? ((selecto.medida || 'PAQ') + ' (cant.)') : 'UNIDAD (cant.)'"
                        @focus="$event.target.select()" @keyup.enter="agregaCatalogo()"></v-text-field>

                    <div class="grey--text text--darken-1 mt-2 text-caption" v-if="modo">
                        Unidades que se **{{ arra_cabe_doC.modo_ajuste === 'ENTRADA' ? 'añadirán' : 'retirarán' }}**:
                        <strong class="font-weight-medium">
                            {{ (modo === 'entero' ? ((Number(cantidad) || 0) * (Number(selecto.factor) || 1)) :
                                (Number(cantidad) || 0)).toFixed(2) }} UND.
                        </strong>
                    </div>
                </v-card-text>

                <v-card-actions class="pa-4 pt-0">
                    <v-btn class="mt-2" color="success" @click="agregaCatalogo()" block
                        :disabled="!modo || cantidad <= 0">
                        <v-icon left>mdi-check</v-icon> AÑADIR AL AJUSTE
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog persistent v-model="progress" max-width="250">
            <v-card class="pa-8 text-center rounded-lg">
                <v-progress-linear indeterminate color="blue-grey" height="25" class="mb-3" />
                <span class="text-caption">Procesando operación...</span>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_anula" max-width="460px">
            <v-card class="rounded-lg">
                <v-toolbar color="red" dense dark><v-toolbar-title>Confirmar
                        Anulación</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="dial_anula = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4 text-center">
                    <h2 class="text-h5 red--text text--darken-2">¿SEGURO QUE DESEA ANULAR ESTE AJUSTE?</h2>
                    <p class="mt-3 caption">Esta acción revertirá los movimientos de stock realizados.</p>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="red" block large @click="anula_mov()">SÍ, ANULAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_lista" max-width="800px">
            <cata_productos v-if="dial_lista" @array="abre_cantidad($event)" @cierra="dial_lista = $event" />
        </v-dialog>
    </v-dialog>
</template>
<script>
import clientes from '@/components/dialogos/dialogoClientes'
import moment from 'moment'
import store from '@/store/index'
import tabla_proveedor from '@/components/configEmpresa/tabla_proveedor'
import cata_productos from '@/views/movi_kardex/lista_productos'
import {
    nuevoMovimiento,
    elmina_mov_kardex
} from '../../db'
import {
    modifica_stock_array,
    modifica_stock_unitario
} from '../../control_stock'
import { fs, colempresa } from '../../db_firestore'
import * as XLSX from "xlsx";
export default {
    name: 'caja',

    components: {
        clientes,
        tabla_proveedor,
        cata_productos
    },
    props: {
        data: [],
    },
    data() {
        return {
            dial: false,
            dial_lista: false,
            dial_anula: false,
            progress: false,
            dial_modifica: false,
            dial_agrega_prod: false,
            dialo_cantidad: false,
            dialogo_genera: false,
            dial_configura: false,
            dialogoProducto: false,
            arra_cabe_doC: [],
            array_productos: [],
            lista_productos: [],
            arrayOperacion: [
                'GRAVADA',
                'GRATUITA'
            ],
            operacion_edita: 'GRAVADA',
            tot_igv: 0.00,
            tot_base_imp: 0.00,
            tot_gratuita: 0,
            tot_exonerada: 0,
            igv: 18,
            busca_p: '',
            btn: false,
            modo: '',
            cantidad: 1,
            cantidad_und: 1,
            selecto: '',
            con_igv: '',
            sin_igv: '',
            foco_igv: false,
            incluye_igv: true,
            costo_edita: '',
            nombreEdita: '',
            producto_ingresado: [],
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date_ingreso: moment(String(new Date)).format('YYYY-MM-DD'),
            arraymodo: ['CONTADO', 'CREDITO'],
            modo_pago: 'CONTADO',
            arraydocumento: ['FACTURA', 'BOLETA'],
            tipodocumento: 'FACTURA',
            edita_app: false,
            sreferencia: '',
            creferencia: '',
            observacion: '',
            num_doc: '',
            nom_proveedor: '',
        }
    },
    created() {
        console.log(store.state.productos)
        this.inicio()
        this.dial = true
    },
    computed: {
        totaliza() {
            let totalGravada = 0;
            let totalExonerada = 0;
            let totalGratuita = 0;

            if (!Array.isArray(this.lista_productos)) return 0;

            for (const item of this.lista_productos) {
                const totalItem = Number(item.cantidad) * Number(item.costo_nuevo || 0);
                switch (item.operacion) {
                    case 'GRAVADA':
                        totalGravada += totalItem;
                        break;
                    case 'EXONERADA':
                        totalExonerada += totalItem;
                        break;
                    case 'GRATUITA':
                        totalGratuita += totalItem;
                        break;
                }
            }

            const igvFactor = 1 + this.igv / 100;
            const baseImp = this.incluye_igv ? totalGravada / igvFactor : totalGravada;
            const igvMonto = baseImp * (this.igv / 100);

            // Asignaciones
            this.tot_base_imp = baseImp.toFixed(2);
            this.tot_igv = igvMonto.toFixed(2);
            this.tot_gratuita = (totalGratuita / igvFactor).toFixed(2);
            this.tot_exonerada = totalExonerada;

            const total =
                parseFloat(this.tot_base_imp) +
                parseFloat(this.tot_igv) +
                totalExonerada;

            return total.toFixed(2);
        },
        productosConStock() {
            return store.state.productos;
        }
    },
    methods: {
        seleccionDirecta(producto) {
            if (producto && producto.id) {
                this.abre_cantidad(producto);
                this.busca_p = '';
            }
        },


        inicio() {
            this.arra_cabe_doC = this.data
            if (this.data.data == undefined) {
                this.data.data = []
            }
            this.lista_productos = this.data.data
            var array = store.state.productos
            for (var i = 0; i < array.length; i++) {
                this.array_productos[this.array_productos.length] = array[i].id + ' / ' + array[i].nombre + ' / ' + array[i].medida
            }
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        selecciona() {
            var producto = this.busca_p.split('/')[0].trim()
            var data = store.state.productos.filter(item => item.id == producto)[0]
            if (data != undefined) {
                this.abre_cantidad(data)
            }
        },
        abre_cantidad(item) {
            this.producto_ingresado = item;
            this.operacion_edita = 'GRAVADA';
            this.nombreEdita = item.nombre;

            // costo con IGV por unidad (si tu sistema guarda costo por unidad)
            this.con_igv = Number(item.costo) || 0;
            this.sin_igv = (this.con_igv / 1.18).toFixed(4);

            // defaults
            this.cantidad = 1;
            this.selecto = item;
            this.modo = false;  // fuerza a elegir PAQ/UND
            this.btn = false;   // muestra botones
            this.dialo_cantidad = true;
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        editaProducto(val) {
            console.log(this.data, val)
            const index = this.lista_productos.findIndex(p => p.uuid === val.uuid);
            if (index !== -1) {
                const producto = this.lista_productos[index];
                this.codigoedita = index;
                this.selecto = producto;
                this.nombreEdita = producto.nombre;
                this.operacion_edita = producto.operacion;
                this.costo_edita = producto.costo_nuevo;
                this.dialogoProducto = true;
            }
        },

        async eliminar() {
            store.commit("dialogoprogress");
            var modo = 'RESTA'
            if (this.arra_cabe_doC.modo_ajuste == 'SALIDA') {
                modo = 'SUMA'
            }
            await modifica_stock_unitario(modo, this.selecto)

            await this.eliminar_mov()
            this.lista_productos.splice(this.codigoedita, 1)
            this.dialogoProducto = false
            this.genera_compra(false)
            store.commit("dialogoprogress");
        },
        async eliminar_mov() {
            if (this.selecto && this.selecto.id && this.selecto.uuid) {
                const pid = String(this.selecto.id);
                const lineId = this.data.id + '_' + String(this.selecto.uuid);

                await colempresa()
                    .doc("kardex")
                    .collection("historial")
                    .doc(pid)
                    .collection("detalle")
                    .doc(lineId)
                    .delete()
                    .catch(e => {
                        console.error("No se pudo borrar linea kardex:", e);
                    });
            } else {
                console.warn("No hay pid/line_id para borrar en kardex, skip.");
            }
        },
        grabaEdita() {
            this.lista_productos[this.codigoedita].operacion = this.operacion_edita.toString().trim()
            this.lista_productos[this.codigoedita].nombre = this.nombreEdita.toString().trim()
            this.lista_productos[this.codigoedita].costo_nuevo = this.costo_edita
            this.genera_compra(false)
            this.dialogoProducto = false
        },
        seleeciona_modo(tipo) {
            // tipo: 'entero' (paquete) | 'fraccion' (unidad)
            this.modo = tipo;
            this.btn = true; // oculta los botones tras elegir
            // asegúrate de tener un número en cantidad
            if (!this.cantidad || isNaN(this.cantidad)) this.cantidad = 1;
        },

        async agregaCatalogo() {
            try {
                store.commit("dialogoprogress");

                if (!this.modo) {
                    this.$store.commit('dialogosnackbar', 'Seleccione PAQUETE o UND antes de continuar.');
                    return;
                }

                const prod = this.producto_ingresado || this.selecto;
                if (!prod || !prod.id) {
                    this.$store.commit('dialogosnackbar', 'Producto no válido.');
                    return;
                }

                const factor = Number(prod.factor) || 1;             // unidades por paquete
                const qty = Number(this.cantidad) || 0;
                if (qty <= 0) {
                    this.$store.commit('dialogosnackbar', 'Ingrese una cantidad válida.');
                    return;
                }

                // unidades base que se moverán
                const unidades = qty;

                // Validación de stock en SALIDA
                const esSalida = this.arra_cabe_doC.modo_ajuste === 'SALIDA';
                const stockDisp = Number(prod.stock) || 0;
                if (esSalida && unidades > stockDisp) {
                    this.$store.commit('dialogosnackbar', `Stock insuficiente. Stock: ${stockDisp}, requerido: ${unidades}`);
                    return;
                }

                // Costos: trabajamos en costo unitario (por UNIDAD) para totales consistentes
                const costoUnit = Number(this.con_igv) || Number(prod.costo) || 0;

                // Objeto que se registra en la lista (cantidad en unidades base)
                const item = {
                    uuid: crypto.randomUUID() || "",
                    id: prod.id,
                    nombre: this.nombreEdita || prod.nombre,
                    medida: this.modo === 'entero' ? (prod.medida || 'PAQ') : 'UNIDAD',
                    operacion: this.operacion_edita,     // GRAVADA / GRATUITA / EXONERADA
                    costo: costoUnit,                // costo unitario
                    costo_nuevo: costoUnit,                // usado en totaliza()
                    stock: stockDisp,
                    factor: factor,                   // info de conversión
                    modo_cant: this.modo,                // 'entero' | 'fraccion'
                    cant_ingresada: qty,                    // lo que el usuario digitó
                    cantidad: unidades                  // *** SIEMPRE en UNIDADES base ***
                };

                // Mover stock (en unidades base)
                const modoStock = esSalida ? 'RESTA' : 'SUMA';
                await modifica_stock_unitario(modoStock, {
                    ...item,
                    // Por compatibilidad, algunos helpers esperan "cantidad" como unidades
                    cantidad: unidades,
                    //  uuid: crypto.randomUUID(),
                });

                // Cerrar diálogo y refrescar lista
                this.dialo_cantidad = false;
                this.lista_productos.push(item);

                // Actualiza cabecera/total
                this.genera_compra(false);

                // Limpieza del buscador
                this.busca_p = '';
                this.modo = false;
                this.btn = false;
            } catch (e) {
                console.error('Error en agregaCatalogo:', e);
                this.$toast?.error?.('Ocurrió un error al agregar el producto.');
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async genera_compra(cierra) {
            var array = this.arra_cabe_doC
            array.baseimponible = this.tot_base_imp
            array.igv = this.tot_igv
            array.porc_igv = this.igv
            array.tot_gratuita = this.tot_gratuita
            array.tot_exonerada = this.tot_exonerada
            array.total = this.totaliza
            array.data = this.lista_productos

            await nuevoMovimiento(array.id, array)
            if (cierra) {
                this.$emit('cierra_compra', false)
                this.dialogo_genera = false
            }
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
        conviertefecha_unix(date) {
            return moment(String(date)) / 1000
        },

        cierra() {
            this.$emit('cierra_compra', false)
        },
        async anula_mov() {
            this.progress = true
            var modo = 'RESTA'
            if (this.arra_cabe_doC.modo_ajuste == 'SALIDA') {
                modo = 'SUMA'
            }
            await modifica_stock_array(modo, this.lista_productos)
            await elmina_mov_kardex(this.arra_cabe_doC.id)
            this.progress = false
            this.dial_anula = false
            this.cierra()
        },
        async onExcelSelected(e) {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;

            // 🔧 Ajustes de control
            const MAX_CONCURRENCY = 4;   // 3-6 recomendado
            const MAX_ROWS = 3000;       // evita cargar excels gigantes
            const SLEEP_EVERY = 25;      // cada N items descansa un poco
            const SLEEP_MS = 40;

            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            // Pool simple para limitar concurrencia
            async function runPool(items, worker, concurrency) {
                let idx = 0;
                let ok = 0, fail = 0;
                const errors = [];

                const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
                    while (idx < items.length) {
                        const my = idx++;
                        try {
                            await worker(items[my], my);
                            ok++;
                        } catch (err) {
                            fail++;
                            errors.push({ item: items[my], err: err?.message || String(err) });
                        }
                    }
                });

                await Promise.all(runners);
                return { ok, fail, errors };
            }

            try {
                this.progress = true;

                const buf = await file.arrayBuffer();
                const wb = XLSX.read(buf, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

                if (!rows || rows.length < 2) {
                    this.$store.commit("dialogosnackbar", "El Excel está vacío.");
                    return;
                }

                // Detecta columnas
                const head = rows[0].map(x => String(x || "").toLowerCase().trim());
                const idxCod = head.findIndex(h => ["codigo", "código", "id", "cod"].includes(h));
                const idxCant = head.findIndex(h => ["cantidad", "cant", "qty"].includes(h));

                if (idxCod === -1 || idxCant === -1) {
                    this.$store.commit("dialogosnackbar", "El Excel debe tener cabecera: codigo | cantidad");
                    return;
                }

                if (rows.length - 1 > MAX_ROWS) {
                    this.$store.commit("dialogosnackbar", `El Excel tiene demasiadas filas (${rows.length - 1}). Máximo: ${MAX_ROWS}`);
                    return;
                }

                const mapaProductos = new Map((store.state.productos || []).map(p => [String(p.id), p]));

                // ✅ 1) AGRUPAR POR CÓDIGO (para no hacer 200 updates del mismo producto)
                const agrupado = new Map(); // codigo -> unidades
                let invalidos = 0;
                let noEncontrados = 0;

                for (let i = 1; i < rows.length; i++) {
                    const r = rows[i] || [];
                    const codigo = String(r[idxCod] ?? "").trim();
                    const cant = Number(r[idxCant] ?? 0);

                    if (!codigo) { invalidos++; continue; }
                    if (!Number.isFinite(cant) || cant <= 0) { invalidos++; continue; }

                    if (!mapaProductos.has(codigo)) {
                        noEncontrados++;
                        continue;
                    }

                    agrupado.set(codigo, (Number(agrupado.get(codigo) || 0) + cant));
                }

                const items = Array.from(agrupado.entries()).map(([codigo, unidades]) => {
                    const prod = mapaProductos.get(codigo);
                    return { prod, unidades };
                });

                if (!items.length) {
                    this.$store.commit("dialogosnackbar", "No hay filas válidas para importar.");
                    return;
                }

                const esSalida = this.arra_cabe_doC.modo_ajuste === "SALIDA";
                const modoStock = esSalida ? "RESTA" : "SUMA";

                // ✅ 2) APLICAR STOCK CONTROLADO + ACTUALIZAR LISTA
                let agregadosLista = 0;
                let saltadosStock = 0;

                const { ok, fail } = await runPool(
                    items,
                    async ({ prod, unidades }, index) => {
                        // mini descanso cada cierto número
                        if (index > 0 && index % SLEEP_EVERY === 0) await sleep(SLEEP_MS);

                        // Validación stock si es SALIDA (opcional)
                        const stockDisp = Number(prod.stock) || 0;
                        if (esSalida && unidades > stockDisp) {
                            saltadosStock++;
                            return;
                        }

                        const costoUnit = Number(prod.costo) || 0;

                        // Item para stock (tu control_stock usa data.cantidad + data.medida)
                        const itemStock = {
                            id: prod.id,
                            cantidad: unidades,   // ✅ unidades base
                            medida: "UNIDAD",     // ✅ fuerza UNIDAD para que no multiplique factor
                            factor: Number(prod.factor) || 1,
                        };

                        // ✅ actualiza stock en Firebase de forma controlada
                        await modifica_stock_unitario(modoStock, itemStock);

                        // ✅ actualiza UI lista_productos (sumar si existe)
                        const idxExist = this.lista_productos.findIndex(x => String(x.id) === String(prod.id));
                        if (idxExist !== -1) {
                            this.lista_productos[idxExist].cantidad =
                                Number(this.lista_productos[idxExist].cantidad || 0) + unidades;
                            this.lista_productos[idxExist].cant_ingresada =
                                Number(this.lista_productos[idxExist].cant_ingresada || 0) + unidades;
                        } else {
                            this.lista_productos.push({
                                uuid: (crypto?.randomUUID ? crypto.randomUUID() : this.create_UUID()),
                                id: prod.id,
                                nombre: prod.nombre,
                                medida: "UNIDAD",
                                operacion: "GRAVADA",
                                costo: costoUnit,
                                costo_nuevo: costoUnit,
                                stock: stockDisp,
                                factor: Number(prod.factor) || 1,
                                modo_cant: "fraccion",
                                cant_ingresada: unidades,
                                cantidad: unidades,
                            });
                        }
                        agregadosLista++;
                    },
                    MAX_CONCURRENCY
                );

                // ✅ guarda ajuste sin cerrar
                await this.genera_compra(false);

                this.$store.commit(
                    "dialogosnackbar",
                    `Excel OK. Productos: ${items.length} | Actualizados: ${ok} | Fallidos: ${fail} | Lista: ${agregadosLista} | No encontrados: ${noEncontrados} | Inválidos: ${invalidos} | Saltados stock: ${saltadosStock}`
                );

            } catch (err) {
                console.error("Error importando Excel:", err);
                this.$store.commit("dialogosnackbar", "Error al importar Excel (revisa consola).");
            } finally {
                this.progress = false;
            }
        }


    },

}
</script>
