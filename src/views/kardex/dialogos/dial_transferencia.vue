<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" max-width="900px" fullscreen>
        <div>
            <v-system-bar class="" dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>{{ modoEdicion ? 'Editar Transferencia' : 'Nueva Transferencia de Productos' }}</h3>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-2" style="max-width: 950px; margin: auto;">
            <v-card outlined class="pa-2 mb-2">
                <v-row dense align="center">
                    <v-col cols="6" sm="" md="4">
                        <v-select v-model="sede_origen" :items="sedes" label="Sede Origen" item-text="nombre"
                            item-value="base" outlined dense @change="cargarProductos" prepend-inner-icon="mdi-store"
                            :rules="[v => !!v || 'Seleccione sede origen']" :disabled="modoEdicion || !esAdmin">
                        </v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="4">
                        <v-select v-model="sede_destino" :items="sedesDestino" label="Sede Destino" item-text="nombre"
                            item-value="base" outlined dense prepend-inner-icon="mdi-store-marker"
                            :rules="[v => !!v || 'Seleccione sede destino']" :disabled="modoEdicion">
                        </v-select>
                    </v-col>
                    <v-col cols="12" sm="6" md="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                        <v-text-field v-model="fecha_transferencia" type="datetime-local" dense outlined
                            label="Fecha y Hora" prepend-inner-icon="mdi-calendar-clock"></v-text-field>
                    </v-col>
                    <v-col cols="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n4'">
                        <v-textarea v-model="observacion" label="Observación" outlined dense rows="1"
                            prepend-inner-icon="mdi-note-text" hide-details auto-grow></v-textarea>
                    </v-col>
                </v-row>
            </v-card>
            <v-card outlined class="pa-2 mb-2" :disabled="!sede_origen">
                <v-row dense align="center">
                    <v-col cols="12" sm="6">
                        <v-autocomplete v-model="productoSeleccionado" :items="productosDisponibles"
                            label="Buscar producto por nombre" item-value="id" outlined dense clearable
                            prepend-inner-icon="mdi-magnify" :disabled="!sede_origen" return-object
                            @change="onSeleccionProducto" :filter="filtroProducto"
                            no-data-text="Sin productos disponibles">
                            <template v-slot:item="{ item }">
                                <v-list-item-content>
                                    <v-list-item-title>{{ item.nombre }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip x-small color="grey" class="mr-1">ID: {{ item.id }}</v-chip>
                                        <v-chip x-small color="blue" class="mr-1" v-if="item.codbarra">{{ item.codbarra
                                        }}</v-chip>
                                        <v-chip x-small :color="item.stock > 0 ? 'success' : 'error'">
                                            Stock: {{ item.stock || 0 }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                            <template v-slot:selection="{ item }">
                                {{ item.nombre }} - Stock: {{ item.stock || 0 }}
                            </template>
                        </v-autocomplete>
                    </v-col>
                    <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                        <v-text-field v-model="codigo_barra_busqueda" label="Escanear código de barra" outlined dense
                            :disabled="!sede_origen" @keyup.enter="buscarPorCodigoBarra"
                            prepend-inner-icon="mdi-barcode-scan" clearable ref="inputCodigoBarra"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="2" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n6'">
                        <v-btn small block color="primary" :disabled="!sede_origen" @click="buscarPorCodigoBarra">
                            <v-icon left>mdi-magnify</v-icon>Buscar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card>
            <v-card outlined class="pa-2 mb-4">
                <v-row no-gutters class="d-flex flex-nowrap align-center justify-space-around text-center">

                    <v-col class="px-1">
                        <div class="text-overline grey--text lh-1">PROD.</div>
                        <div class="text-subtitle-2 font-weight-bold primary--text">{{ lista_transferencia.length }}
                        </div>
                    </v-col>

                    <v-divider vertical></v-divider>

                    <v-col class="px-1">
                        <div class="text-overline grey--text lh-1">UDS.</div>
                        <div class="text-subtitle-2 font-weight-bold primary--text">{{ totalUnidades }}</div>
                    </v-col>

                    <v-divider vertical></v-divider>

                    <v-col class="px-1">
                        <div class="text-overline grey--text lh-1">PESO</div>
                        <div class="text-subtitle-2 font-weight-bold orange--text">{{ totalPeso.toFixed(1) }}<span
                                class="caption">kg</span></div>
                    </v-col>

                    <v-divider vertical></v-divider>

                    <v-col class="px-1">
                        <div class="text-overline grey--text lh-1">TOTAL</div>
                        <div class="text-subtitle-2 font-weight-bold success--text">S/{{ totalMontoSoles.toFixed(2) }}
                        </div>
                    </v-col>

                </v-row>
            </v-card>
            <v-card outlined>
                <v-data-table :headers="headersTransferencia" :items="lista_transferencia" dense class="elevation-0"
                    :items-per-page="10" no-data-text="Agregue productos a transferir"
                    :class="{ 'd-none': $vuetify.breakpoint.smAndDown && lista_transferencia.length > 0 }">
                    <template v-slot:item.nombre="{ item }">
                        <div>
                            <strong>{{ item.nombre }}</strong>
                            <div class="text-caption grey--text">{{  item.id }}</div>
                        </div>
                    </template>

                    <template v-slot:item.cantidad="{ item }">

                        <strong class="red--text"> {{ item.cantidad }}</strong>
                    </template>

                    <template v-slot:item.precio="{ item }">
                        S/ {{ Number(item.precio || 0).toFixed(2) }}
                    </template>
                    <template v-slot:item.monto_soles="{ item }">
                        <strong>S/ {{ Number(item.monto_soles || 0).toFixed(2) }}</strong>
                    </template>
                    <template v-slot:item.peso_total="{ item }">
                        {{ ((item.peso || 0) * item.cantidad).toFixed(2) }} kg
                    </template>
                    <template v-slot:item.acciones="{ item }">
                        <v-btn icon small color="orange" @click="editarCantidadProducto(item)">
                            <v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon small color="red" @click="eliminarDeLista(item)">
                            <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                </v-data-table>

                <div class="pa-2" v-if="$vuetify.breakpoint.smAndDown && lista_transferencia.length > 0">
                    <v-card v-for="(item) in lista_transferencia" :key="'m-' + item.id" outlined class="mb-2 pa-2">
                        <div class="d-flex align-center justify-space-between">
                            <div class="flex-grow-1" @click="editarCantidadProducto(item)">
                                <div class="font-weight-medium text-body-2">{{ item.nombre }}</div>
                                <div class="text-caption grey--text">{{ item.codbarra || item.id }}</div>
                                <div class="d-flex align-center mt-1">
                                    <v-chip x-small color="primary" class="mr-1">
                                        {{ item.cantidad }} und
                                    </v-chip>

                                    <span class="text-caption font-weight-bold success--text">S/ {{
                                        Number(item.monto_soles ||
                                            0).toFixed(2) }}</span>
                                </div>
                            </div>
                            <v-btn icon small color="red" @click="eliminarDeLista(item)">
                                <v-icon small>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </v-card>
                </div>
            </v-card>
            <v-row class="mt-4 pa-2" dense>
                <v-col cols="6">
                    <v-btn block outlined color="grey" @click="cierra()" small>
                        <v-icon left small>mdi-close</v-icon>Cancelar
                    </v-btn>
                </v-col>
                <v-col cols="6">
                    <v-btn block color="success" @click="confirmarTransferencia" :loading="cargando" small
                        :disabled="lista_transferencia.length == 0 || !sede_origen || !sede_destino">
                        <v-icon left small>mdi-truck-delivery</v-icon>
                        {{ modoEdicion ? 'Guardar' : 'Transferir' }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>


        <v-dialog v-model="dialogoCantidad" max-width="400" persistent>
            <v-card>
                <v-card-title class="headline pb-0">
                    <v-icon left color="primary">mdi-package-variant</v-icon>
                    {{ modoEdicionCantidad ? 'Editar Cantidad' : 'Agregar Producto' }}
                </v-card-title>
                <v-card-text class="pt-4">
                    <div v-if="productoActual" class="mb-4">
                        <v-alert dense text type="info" class="mb-3">
                            <strong>{{ productoActual.nombre }}</strong>
                            <div class="text-caption">
                                Código: {{productoActual.id }}
                            </div>
                        </v-alert>

                        <v-row dense>
                            <v-col cols="6">
                                <div class="text-caption grey--text">Stock Disponible</div>
                                <v-chip :color="stockMaximoEdicion > 0 ? 'success' : 'error'" class="mt-1">
                                    {{ stockMaximoEdicion || 0 }} unid.
                                </v-chip>
                            </v-col>
                            <v-col cols="6">
                                <div class="text-caption grey--text">Precio Unitario</div>
                                <div class="text-h6">S/ {{ Number(productoActual.precio || 0).toFixed(2) }}</div>
                            </v-col>
                        </v-row>


                        <v-divider class="my-3"></v-divider>


                        <v-text-field v-model.number="cantidadAgregar" type="number" label="Cantidad a transferir"
                            outlined dense :min="1" :max="stockMaximoEdicion" :rules="reglaCantidad" ref="inputCantidad"
                            @keyup.enter="agregarALista">
                        </v-text-field>


                        <v-row dense>
                            <v-col cols="6">
                                <div class="text-caption grey--text">Subtotal</div>
                                <div class="text-h6 success--text">
                                    S/ {{ (cantidadAgregar * (productoActual.precio || 0)).toFixed(2) }}
                                </div>
                            </v-col>
                            <v-col cols="6">
                                <div class="text-caption grey--text">Peso</div>
                                <div class="text-h6 orange--text">
                                    {{ (cantidadAgregar * (productoActual.peso || 0)).toFixed(2) }} kg
                                </div>
                            </v-col>
                        </v-row>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn text color="grey" @click="cerrarDialogoCantidad">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="agregarALista" :disabled="!cantidadValida">
                        <v-icon left>mdi-check</v-icon>
                        {{ modoEdicionCantidad ? 'Actualizar' : 'Agregar a Lista' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
       <v-dialog v-model="dialogoConfirmar" max-width="480" persistent>
    <v-card class="rounded-xl overflow-hidden">
        <v-toolbar 
            :color="modoEdicion ? 'orange darken-1' : 'primary'" 
            dark 
            flat 
            dense
        >
            <v-icon left>mdi-alert-circle-outline</v-icon>
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">
                {{ modoEdicion ? 'Confirmar Actualización' : 'Confirmar Transferencia' }}
            </v-toolbar-title>
        </v-toolbar>

        <v-card-text class="pa-4">
            <v-alert 
                outlined 
                :color="modoEdicion ? 'orange' : 'info'" 
                class="mb-4 rounded-lg bg-lighten-5"
                dense
            >
                <div class="text-body-2">
                    <span v-if="modoEdicion">
                        ¿Está seguro de actualizar esta transferencia con <strong>{{ lista_transferencia.length }} productos</strong>?
                    </span>
                    <span v-else>
                        ¿Transferir <strong>{{ lista_transferencia.length }} productos</strong> desde <strong>{{ nombreSedeOrigen }}</strong> hacia <strong>{{ nombreSedeDestino }}</strong>?
                    </span>
                </div>
            </v-alert>

            <v-row dense class="grey lighten-4 rounded-lg pa-2 mx-0">
                <v-col cols="6" class="pb-2">
                    <div class="text-caption grey--text text-uppercase">Productos</div>
                    <div class="text-body-1 font-weight-bold">{{ lista_transferencia.length }}</div>
                </v-col>
                <v-col cols="6" class="pb-2 text-right">
                    <div class="text-caption grey--text text-uppercase">Unidades</div>
                    <div class="text-body-1 font-weight-bold">{{ totalUnidades }}</div>
                </v-col>
                
                <v-divider cols="12" class="my-1"></v-divider>

                <v-col cols="6" class="pt-2">
                    <div class="text-caption grey--text text-uppercase">Peso Total</div>
                    <div class="text-body-1 font-weight-bold">{{ totalPeso.toFixed(2) }} kg</div>
                </v-col>
                <v-col cols="6" class="pt-2 text-right">
                    <div class="text-caption grey--text text-uppercase">Monto Total</div>
                    <div class="text-h6 success--text font-weight-black lh-1">
                        S/ {{ totalMontoSoles.toFixed(2) }}
                    </div>
                </v-col>

                <v-col cols="12" v-if="observacion" class="mt-2 pt-2 border-top">
                    <div class="text-caption grey--text text-uppercase">Observación</div>
                    <div class="text-body-2 font-italic grey--text text--darken-2 line-clamp-2">
                        "{{ observacion }}"
                    </div>
                </v-col>
            </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
            <v-btn 
                text 
                color="grey darken-1" 
                @click="dialogoConfirmar = false"
                class="text-none px-4"
            >
                Cancelar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn 
                :color="modoEdicion ? 'orange' : 'success'" 
                depressed
                class="text-none px-6 rounded-lg"
                @click="ejecutarTransferencia" 
                :loading="cargando"
            >
                <v-icon left>mdi-check</v-icon>
                <strong>{{ modoEdicion ? 'Actualizar' : 'Confirmar' }}</strong>
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>


        <v-snackbar v-model="mensaje" :color="colorMensaje" timeout="4000">{{ textoMensaje }}</v-snackbar>
    </v-dialog>
</template>


<script>
import {
    allProductoOtraBase,
    grabarStockOtraBase,
    graba_transferencia,
    nuevoProductoOtraBase,
    actualiza_transferencia,
} from '@/db';
import { registrarMovimientosTransferencia, rehacerMovimientosTransferencia } from '../help_mov_tranferencia';
import store from '@/store/index';
import moment from 'moment';


export default {
    props: {
        transferencia: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            dial: false,
            sedes: store.state.array_sedes.filter(e => e.tipo == 'sede'),
            sede_origen: '',
            sede_destino: '',
            fecha_transferencia: moment().format('YYYY-MM-DDTHH:mm'),
            productos_origen: [],
            productoSeleccionado: null,
            codigo_barra_busqueda: '',
            lista_transferencia: [],
            observacion: '',
            mensaje: false,
            textoMensaje: '',
            colorMensaje: 'success',
            cargando: false,
            dialogoCantidad: false,
            productoActual: null,
            cantidadAgregar: 1,
            modoEdicionCantidad: false,
            indiceEdicion: -1,
            dialogoConfirmar: false,
            transferenciaKey: null,
            productosOriginales: [],


            headersTransferencia: [
                { text: 'Producto', value: 'nombre', width: '30%' },
                { text: 'Cantidad', value: 'cantidad', width: '12%', align: 'center' },
                { text: 'P. Unit.', value: 'precio', width: '12%', align: 'right' },
                { text: 'Subtotal', value: 'monto_soles', width: '14%', align: 'right' },
                { text: 'Peso', value: 'peso_total', width: '10%', align: 'right' },
                { text: 'Acciones', value: 'acciones', sortable: false, width: '12%', align: 'center' }
            ]
        };
    },
    created() {
        this.dial = true;
        this.inicializar();
    },
    computed: {
        esAdmin() {
            return store.state.permisos?.es_admin === true || store.state.permisos?.master === true;
        },
        modoEdicion() {
            return !!this.transferencia;
        },
        sedesDestino() {
            return this.sedes.filter(s => s.base !== this.sede_origen);
        },
        productosDisponibles() {
            const idsEnLista = this.lista_transferencia.map(p => p.id);
            return this.productos_origen.filter(p => !idsEnLista.includes(p.id) && p.stock > 0);
        },
        totalMontoSoles() {
            return this.lista_transferencia.reduce((sum, item) => sum + Number(item.monto_soles || 0), 0);
        },
        totalUnidades() {
            return this.lista_transferencia.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
        },
        totalPeso() {
            return this.lista_transferencia.reduce((sum, item) => {
                return sum + (Number(item.peso || 0) * Number(item.cantidad || 0));
            }, 0);
        },
        stockMaximoEdicion() {
            if (!this.productoActual) return 0;
            return this.modoEdicionCantidad ? this.productoActual.stock_origen : this.productoActual.stock;
        },
        cantidadValida() {
            if (!this.productoActual) return false;
            return this.cantidadAgregar > 0 && this.cantidadAgregar <= this.stockMaximoEdicion;
        },
        reglaCantidad() {
            if (!this.productoActual) return [];
            return [
                v => v > 0 || 'Mínimo 1 unidad',
                v => v <= this.stockMaximoEdicion || `Máximo ${this.stockMaximoEdicion} unidades disponibles`
            ];
        },
        nombreSedeOrigen() {
            const sede = this.sedes.find(s => s.base === this.sede_origen);
            return sede ? sede.nombre : this.sede_origen;
        },
        nombreSedeDestino() {
            const sede = this.sedes.find(s => s.base === this.sede_destino);
            return sede ? sede.nombre : this.sede_destino;
        }
    },
    methods: {
        async inicializar() {
            if (this.modoEdicion && this.transferencia) {
                this.sede_origen = this.transferencia.sede_origen;
                this.sede_destino = this.transferencia.sede_destino;
                this.fecha_transferencia = moment.unix(this.transferencia.fecha_unix).format('YYYY-MM-DDTHH:mm');
                this.observacion = this.transferencia.observacion || '';
                this.transferenciaKey = this.transferencia.key;
                this.productosOriginales = JSON.parse(JSON.stringify(this.transferencia.productos || []));
                await this.cargarProductos();
                for (const prod of (this.transferencia.productos || [])) {
                    const prodOrigen = this.productos_origen.find(p => p.id == prod.id);
                    this.lista_transferencia.push({
                        id: prod.id,
                        nombre: prod.nombre,
                        codbarra: prod.codbarra,
                        cantidad: prod.cantidad,
                        stock_origen: prodOrigen ? (Number(prodOrigen.stock) + Number(prod.cantidad)) : prod.cantidad,
                        precio: prod.precio || 0,
                        peso: prod.peso || 0,
                        monto_soles: Number(prod.monto_soles || 0),
                    });
                }
            } else {
                this.sede_origen = store.state.sedeActual?.base || store.state.sedeActual?.codigo || '';
                if (this.sede_origen) {
                    await this.cargarProductos();
                }
            }
        },


        filtroProducto(item, queryText) {
            const query = (queryText || '').toLowerCase();
            const nombre = (item.nombre || '').toLowerCase();
            const codigo = (item.codbarra || '').toLowerCase();
            const id = String(item.id || '').toLowerCase();
            return nombre.includes(query) || codigo.includes(query) || id.includes(query);
        },


        async cargarProductos() {
            this.productos_origen = [];
            this.productoSeleccionado = null;
            this.codigo_barra_busqueda = '';
            if (!this.modoEdicion) {
                this.lista_transferencia = [];
            }

            if (this.sede_origen) {
                try {
                    const snap = await allProductoOtraBase(this.sede_origen).once('value');
                    const data = snap.val();
                    this.productos_origen = data ? Object.values(data).map(p => ({
                        ...p,
                        stock: Number(p.stock || 0)
                    })) : [];
                } catch (e) {
                    this.muestraMsg('Error cargando productos: ' + e.message, 'error');
                }
            }
        },


        buscarPorCodigoBarra() {
            if (!this.codigo_barra_busqueda) return;

            const codigoBusqueda = this.codigo_barra_busqueda.trim();
            const prod = this.productos_origen.find(
                p => (p.codbarra && p.codbarra.trim() === codigoBusqueda) ||
                    String(p.id) === codigoBusqueda
            );

            if (!prod) {
                this.muestraMsg('Producto no encontrado con ese código', 'error');
                return;
            }


            const existente = this.lista_transferencia.find(p => p.id === prod.id);
            if (existente) {
                const indice = this.lista_transferencia.findIndex(p => p.id === prod.id);
                this.abrirDialogoCantidad(existente, true, indice);
                this.codigo_barra_busqueda = '';
                return;
            }


            if (prod.stock <= 0) {
                this.muestraMsg('Este producto no tiene stock disponible', 'error');
                this.codigo_barra_busqueda = '';
                return;
            }


            this.abrirDialogoCantidad(prod, false);
            this.codigo_barra_busqueda = '';
        },


        onSeleccionProducto(producto) {
            if (!producto) return;


            const existente = this.lista_transferencia.find(p => p.id === producto.id);
            if (existente) {
                this.muestraMsg('Este producto ya está en la lista de transferencia', 'warning');
                this.productoSeleccionado = null;
                return;
            }


            if (producto.stock <= 0) {
                this.muestraMsg('Este producto no tiene stock disponible', 'error');
                this.productoSeleccionado = null;
                return;
            }


            this.abrirDialogoCantidad(producto, false);
            this.productoSeleccionado = null;
        },


        abrirDialogoCantidad(producto, esEdicion = false, indice = -1) {
            this.productoActual = { ...producto };
            this.modoEdicionCantidad = esEdicion;
            this.indiceEdicion = indice;

            if (esEdicion) {
                this.cantidadAgregar = producto.cantidad;
            } else {
                this.cantidadAgregar = 1;
            }

            this.dialogoCantidad = true;

            this.$nextTick(() => {
                if (this.$refs.inputCantidad) {
                    this.$refs.inputCantidad.focus();
                }
            });
        },


        cerrarDialogoCantidad() {
            this.dialogoCantidad = false;
            this.productoActual = null;
            this.cantidadAgregar = 1;
            this.modoEdicionCantidad = false;
            this.indiceEdicion = -1;
        },


        agregarALista() {
            if (!this.cantidadValida || !this.productoActual) return;


            if (this.modoEdicionCantidad && this.indiceEdicion >= 0) {
                const item = this.lista_transferencia[this.indiceEdicion];
                item.cantidad = this.cantidadAgregar;
                item.monto_soles = Number(this.cantidadAgregar) * Number(item.precio || 0);
                this.muestraMsg('Cantidad actualizada', 'success');
            } else {
                const prod = this.productoActual;
                this.lista_transferencia.push({
                    id: prod.id,
                    nombre: prod.nombre,
                    codbarra: prod.codbarra,
                    cantidad: this.cantidadAgregar,
                    stock_origen: prod.stock,
                    precio: prod.precio || 0,
                    peso: prod.peso || 0,
                    monto_soles: Number(this.cantidadAgregar) * Number(prod.precio || 0),
                });
                this.muestraMsg('Producto agregado a la lista', 'success');
            }


            this.cerrarDialogoCantidad();
        },


        editarCantidadProducto(item) {
            const indice = this.lista_transferencia.findIndex(p => p.id === item.id);
            this.abrirDialogoCantidad(item, true, indice);
        },


        eliminarDeLista(item) {
            const idx = this.lista_transferencia.findIndex(p => p.id === item.id);
            if (idx === -1) return;
            if (confirm(`¿Eliminar "${item.nombre}" de la lista?`)) {
                this.lista_transferencia.splice(idx, 1);
                this.muestraMsg('Producto eliminado de la lista', 'info');
            }
        },


        confirmarTransferencia() {
            if (!this.sede_origen || !this.sede_destino) {
                this.muestraMsg('Seleccione sede origen y destino', 'error');
                return;
            }
            if (this.sede_origen === this.sede_destino) {
                this.muestraMsg('No puede seleccionar la misma sede', 'error');
                return;
            }
            if (this.lista_transferencia.length === 0) {
                this.muestraMsg('Agregue productos a transferir', 'error');
                return;
            }
            this.dialogoConfirmar = true;
        },


        async ejecutarTransferencia() {
            this.cargando = true;
            try {
                const snap_destino = await allProductoOtraBase(this.sede_destino).once('value');
                const productos_destino = snap_destino.val() ? Object.values(snap_destino.val()) : [];


                if (this.modoEdicion) {
                    for (const prodOriginal of this.productosOriginales) {
                        const prodOrigen = this.productos_origen.find(p => p.id == prodOriginal.id);
                        const prodDestino = productos_destino.find(p => p.id == prodOriginal.id);
                        if (prodOrigen) {
                        }
                        if (prodDestino) {
                            const stockRevertido = Math.max(0, Number(prodDestino.stock) - Number(prodOriginal.cantidad));
                            await grabarStockOtraBase(this.sede_destino, prodOriginal.id, stockRevertido);
                        }
                    }


                    const snap_destino2 = await allProductoOtraBase(this.sede_destino).once('value');
                    const productos_destino_actualizados = snap_destino2.val() ? Object.values(snap_destino2.val()) : [];
                    for (const item of this.lista_transferencia) {
                        const nuevoStockOrigen = Number(item.stock_origen) - Number(item.cantidad);
                        await grabarStockOtraBase(this.sede_origen, item.id, Math.max(0, nuevoStockOrigen));


                        const prodDestino = productos_destino_actualizados.find(p => p.id == item.id);
                        let nuevoStockDestino = prodDestino
                            ? Number(prodDestino.stock) + Number(item.cantidad)
                            : Number(item.cantidad);


                        if (prodDestino) {
                            await grabarStockOtraBase(this.sede_destino, item.id, nuevoStockDestino);
                        } else {
                            const prodPrincipal = store.state.productos?.find(p => String(p.id) === String(item.id));
                            const prodOrigen = this.productos_origen.find(p => p.id == item.id);
                            const nuevoProducto = {
                                ...(prodPrincipal || prodOrigen || item),
                                stock: nuevoStockDestino,
                                editado: Math.floor(Date.now() / 1000)
                            };
                            delete nuevoProducto.stock2;
                            await nuevoProductoOtraBase(this.sede_destino, item.id, nuevoProducto);
                        }
                    }
                    const docActualizado = {
                        fecha_unix: moment(this.fecha_transferencia, 'YYYY-MM-DDTHH:mm').unix(),
                        productos: this.lista_transferencia.map(item => ({
                            id: item.id,
                            nombre: item.nombre,
                            codbarra: item.codbarra,
                            cantidad: item.cantidad,
                            precio: item.precio || 0,
                            peso: item.peso || 0,
                            monto_soles: Number((item.monto_soles || 0).toFixed(2)),
                        })),
                        total: Number(this.totalMontoSoles.toFixed(2)),
                        peso_total: Number(this.totalPeso.toFixed(2)),
                        total_unidades: this.totalUnidades,
                        estado: "editado",
                        editado_por: store.state.permisos.correo,
                        editado_en: moment().unix(),
                        observacion: this.observacion,
                    };


                    await actualiza_transferencia(this.transferenciaKey, docActualizado);
                    await rehacerMovimientosTransferencia(this.transferencia, {
                        ...this.transferencia,
                        ...docActualizado,
                        key: this.transferenciaKey
                    });

                    this.dialogoConfirmar = false;
                    this.muestraMsg('Transferencia actualizada correctamente', 'success');


                } else {
                    for (const item of this.lista_transferencia) {
                        const prodOrigen = this.productos_origen.find(p => p.id == item.id);
                        if (!prodOrigen || Number(item.cantidad) > Number(prodOrigen.stock)) {
                            this.muestraMsg(
                                `El stock disponible de "${item.nombre}" es insuficiente (${prodOrigen ? prodOrigen.stock : 0})`,
                                'error'
                            );
                            this.cargando = false;
                            return;
                        }
                    }


                    for (const item of this.lista_transferencia) {
                        const prodOrigen = this.productos_origen.find(p => p.id == item.id);
                        const nuevoStockOrigen = Number(prodOrigen.stock) - Number(item.cantidad);
                        await grabarStockOtraBase(this.sede_origen, item.id, nuevoStockOrigen);


                        const prodDestino = productos_destino.find(p => p.id == item.id);
                        let nuevoStockDestino = prodDestino
                            ? Number(prodDestino.stock) + Number(item.cantidad)
                            : Number(item.cantidad);


                        if (prodDestino) {
                            await grabarStockOtraBase(this.sede_destino, item.id, nuevoStockDestino);
                        } else {
                            const prodPrincipal = store.state.productos?.find(p => String(p.id) === String(item.id));
                            const nuevoProducto = {
                                ...(prodPrincipal || prodOrigen),
                                stock: nuevoStockDestino,
                                editado: Math.floor(Date.now() / 1000)
                            };
                            delete nuevoProducto.stock2;
                            await nuevoProductoOtraBase(this.sede_destino, item.id, nuevoProducto);
                        }
                    }


                    const doc = {
                        fecha_unix: moment(this.fecha_transferencia, 'YYYY-MM-DDTHH:mm').unix(),
                        sede_origen: this.sede_origen,
                        sede_destino: this.sede_destino,
                        productos: this.lista_transferencia.map(item => ({
                            id: item.id,
                            nombre: item.nombre,
                            codbarra: item.codbarra,
                            cantidad: item.cantidad,
                            precio: item.precio || 0,
                            peso: item.peso || 0,
                            monto_soles: Number((item.monto_soles || 0).toFixed(2)),
                        })),
                        total: Number(this.totalMontoSoles.toFixed(2)),
                        peso_total: Number(this.totalPeso.toFixed(2)),
                        total_unidades: this.totalUnidades,
                        estado: "activo",
                        usuario: store.state.permisos.correo,
                        observacion: this.observacion,
                    };


                    const resp = await graba_transferencia(doc);
                    await registrarMovimientosTransferencia({ ...doc, key: resp.key });

                    this.dialogoConfirmar = false;
                    this.muestraMsg('Transferencia realizada correctamente', 'success');
                }


                this.$emit('guardado');

                setTimeout(() => {
                    this.cierra();
                }, 150);


            } catch (e) {
                this.muestraMsg('Error en la transferencia: ' + (e.message || e), 'error');
            } this.cargando = false;
        },


        muestraMsg(msg, color) {
            this.textoMensaje = msg;
            this.colorMensaje = color;
            this.mensaje = true;
        },


        cierra() {
            this.$emit('cerrar');
            this.dial = false;
        }
    },
}
</script>
<style scoped>
/* Ajuste fino para que las etiquetas no ocupen espacio vertical extra */
.lh-1 {
    line-height: 1 !important;
    font-size: 0.65rem !important;
    /* Un poco más pequeño que el overline estándar */
}
.border-top {
    border-top: 1px dashed #ccc;
}
/* Limita la observación a 2 líneas para que no rompa el diseño si es muy larga */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>