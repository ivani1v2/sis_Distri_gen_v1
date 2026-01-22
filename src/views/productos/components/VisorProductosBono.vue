<template>
    <div>
       
<v-dialog v-model="dialogo" max-width="650px" scrollable @input="onDialogChange" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card class="rounded-lg-md">
        <v-toolbar color="grey darken-4" dark flat dense max-height="48">
            <v-toolbar-title class="text-body-2 font-weight-medium">Productos del Bono</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip x-small :color="bono.activo ? 'success' : 'error'" class="font-weight-bold">
                {{ bono.activo ? 'ACTIVO' : 'INACTIVO' }}
            </v-chip>
            <v-btn icon small @click="cerrar" class="ml-2">
                <v-icon small>mdi-close</v-icon>
            </v-btn>
        </v-toolbar>

        <v-card-text class="pa-4 flex-grow-0 grey lighten-4">
            <v-row no-gutters align="center">
                <v-col>
                    <div class="text-h6 font-weight-black primary--text lh-1 mb-1">{{ bono.nombre }}</div>
                    <div class="d-flex flex-wrap align-center caption grey--text text--darken-2">
                        <v-icon x-small class="mr-1">mdi-barcode</v-icon> {{ bono.codigo }}
                        <v-divider vertical class="mx-2"></v-divider>
                        <v-icon x-small class="mr-1">mdi-label-outline</v-icon> {{ bono.tipo === 'precio' ? 'Precio Mayoreo' : 'Bonificación' }}
                        <v-divider vertical class="mx-2" v-if="bono.fecha_vencimiento"></v-divider>
                        <span v-if="bono.fecha_vencimiento" class="orange--text font-weight-bold">
                            <v-icon x-small color="orange">mdi-calendar-clock</v-icon> Exp: {{ formatearFecha(bono.fecha_vencimiento) }}
                        </span>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-text class="pa-3">
            <v-row dense align="center" class="mb-3">
                <v-col cols="12" sm="8">
                    <v-text-field 
                        v-model="busqueda" 
                        dense 
                        filled 
                        rounded 
                        hide-details 
                        prepend-inner-icon="mdi-magnify"
                        placeholder="Filtrar asignados..." 
                        clearable
                    ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                    <v-btn color="primary" block depressed rounded class="text-none" @click="dialogoBusqueda = true">
                        <v-icon left size="18">mdi-plus-circle</v-icon>
                        Añadir Productos
                    </v-btn>
                </v-col>
            </v-row>

            <div class="text-overline mb-1 grey--text">
                Productos Afectados ({{ productosFiltrados.length }})
            </div>

            <v-card outlined class="overflow-hidden rounded-lg">
                <v-simple-table dense fixed-header height="250px">
                    <template v-slot:default>
                        <thead>
                            <tr class="grey lighten-4">
                                <th class="text-left py-2">Producto</th>
                                <th class="text-center" width="80">Precio</th>
                                <th class="text-center" width="50">Acción</th>
                            </tr>
                        </thead>
                        <tbody v-if="productosFiltrados.length">
                            <tr v-for="prod in productosFiltrados" :key="prod.id">
                                <td class="py-2">
                                    <div class="font-weight-bold text-body-2 lh-tight">{{ prod.nombre }}</div>
                                    <div class="caption grey--text">ID: {{ prod.id }} • {{ prod.categoria }}</div>
                                </td>
                                <td class="text-center font-weight-medium">S/{{ Number(prod.precio || 0).toFixed(2) }}</td>
                                <td class="text-center">
                                    <v-btn icon small color="red lighten-4" @click="quitarProducto(prod)" :loading="quitando === prod.id">
                                        <v-icon small color="red">mdi-trash-can-outline</v-icon>
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
                <v-alert v-if="!productosFiltrados.length" type="info" text tile dense class="ma-0">
                    No se encontraron productos
                </v-alert>
            </v-card>

            <div class="mt-4">
                <v-expansion-panels v-if="bono.tipo === 'bono' && bono.data && bono.data.length" flat outlined class="rounded-lg">
                    <v-expansion-panel class="grey lighten-5">
                        <v-expansion-panel-header class="py-0 min-height-48">
                            <template v-slot:default="{ open }">
                                <v-icon small color="orange" class="mr-2">mdi-gift</v-icon>
                                <span class="text-subtitle-2 font-weight-bold grey--text text--darken-3">Reglas de Bonificación</span>
                                <v-spacer></v-spacer>
                                <v-chip x-small color="orange" dark class="mr-2">{{ bono.data.length }}</v-chip>
                            </template>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <v-card v-for="(regla, idx) in bono.data" :key="idx" flat outlined class="mb-2 pa-2 white rounded-md">
                                <div class="d-flex justify-space-between align-center">
                                    <div class="caption">Compra: <strong>{{ regla.apartir_de }} und</strong></div>
                                    <v-icon small color="grey lighten-1">mdi-arrow-right</v-icon>
                                    <div class="caption font-weight-bold primary--text">Lleva: {{ regla.cantidad_bono }}x {{ obtenerNombreProducto(regla.codigo) }}</div>
                                </div>
                                <div class="text-right caption grey--text mt-1 border-top-pt-1">Límite máx: {{ regla.cantidad_max || 'Sin límite' }}</div>
                            </v-card>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <v-expansion-panels v-if="bono.tipo === 'precio'" flat outlined class="rounded-lg">
                    <v-expansion-panel class="grey lighten-5">
                        <v-expansion-panel-header class="py-0 min-height-48">
                            <v-icon small color="blue" class="mr-2">mdi-tag-multiple</v-icon>
                            <span class="text-subtitle-2 font-weight-bold grey--text text--darken-3">Escalas de Precios</span>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <v-row dense>
                                <v-col cols="6" v-if="bono.escala_may1">
                                    <v-card flat outlined class="pa-2 white text-center">
                                        <div class="text-overline lh-1 grey--text">May. 1</div>
                                        <div class="text-body-2">≥ <strong>{{ bono.escala_may1 }}</strong> und</div>
                                        <div class="text-subtitle-2 success--text font-weight-bold">S/{{ bono.precio_may1 }}</div>
                                    </v-card>
                                </v-col>
                                <v-col cols="6" v-if="bono.escala_may2">
                                    <v-card flat outlined class="pa-2 white text-center">
                                        <div class="text-overline lh-1 grey--text">May. 2</div>
                                        <div class="text-body-2">≥ <strong>{{ bono.escala_may2 }}</strong> und</div>
                                        <div class="text-subtitle-2 success--text font-weight-bold">S/{{ bono.precio_may2 }}</div>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3 grey lighten-4">
            <div class="caption grey--text font-weight-bold">
                <v-icon x-small class="mr-1">mdi-check-circle-outline</v-icon>
                {{ productosAsignados.length }} ítems totales
            </div>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-2" text class="text-none px-6" @click="cerrar">Cerrar</v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
        <v-dialog v-model="dialogoBusqueda" max-width="500px" @input="onDialogBusquedaChange">
            <v-card>
                <v-toolbar flat dense color="primary" dark>
                    <v-btn icon @click="dialogoBusqueda = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Buscar producto</v-toolbar-title>
                </v-toolbar>
                
                <v-card-text class="pa-4">
                    <v-autocomplete 
                        v-model="productoSeleccionado" 
                        :items="productosDisponiblesCache" 
                        item-text="nombre" 
                        item-value="id" 
                        outlined 
                        dense 
                        clearable 
                        placeholder="Escriba para buscar..."
                        prepend-inner-icon="mdi-magnify" 
                        :loading="cargandoDisponibles"
                        :search-input.sync="busquedaInput"
                        no-data-text="No se encontraron productos"
                        :menu-props="{ 
                            maxHeight: 250,
                            offsetY: true 
                        }"
                        @change="agregarProductoDesdeDialogo"
                    >
                        <template v-slot:item="{ item }">
                            <v-list-item-content>
                                <v-list-item-title>
                                    {{ item.nombre }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                    ID: {{ item.id }} | Cat: {{ item.categoria }} | S/{{ Number(item.precio || 0).toFixed(2) }}
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </template>
                    </v-autocomplete>
                    
                    <div v-if="productosDisponiblesCache.length > 0" class="mt-3">
                        <div class="text-caption grey--text mb-2">
                            {{ productosDisponiblesCache.length }} productos disponibles
                        </div>
                        <v-divider></v-divider>
                        <v-list dense class="mt-2" style="max-height: 200px; overflow-y: auto;">
                            <v-list-item 
                                v-for="prod in productosDisponiblesCache.slice(0, 10)" 
                                :key="prod.id"
                                @click="seleccionarProducto(prod)"
                                class="py-1"
                            >
                                <v-list-item-icon class="mr-2">
                                    <v-icon small color="grey">mdi-package-variant</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title class="text-caption">{{ prod.nombre }}</v-list-item-title>
                                    <v-list-item-subtitle class="text-caption">
                                        ID: {{ prod.id }} | S/{{ prod.precio }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                                <v-list-item-action>
                                    <v-icon small color="primary">mdi-plus</v-icon>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text color="grey" @click="dialogoBusqueda = false">Cancelar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import store from '@/store/index';
import { allProductos } from '../../../db';

export default {
    name: 'VisorProductosBono',
    props: {
        value: Boolean,
        bono: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            busqueda: '',
            quitando: null,
            agregando: false,
            dialogoBusqueda: false,
            productoSeleccionado: null,
            busquedaInput: '',
            cargandoDisponibles: false,
            productosDisponiblesCache: [],
        };
    },
    computed: {
        dialogo: {
            get() { return this.value; },
            set(v) { this.$emit('input', v); }
        },
        productosAsignados() {
            if (!this.bono || !this.bono.codigo) return [];
            const codigo = this.bono.codigo;
            const tipo = this.bono.tipo;

            return (store.state.productos || []).filter(p => {
                if (tipo === 'precio') {
                    return p.grupo_precio === codigo;
                } else {
                    return p.grupo_bono === codigo;
                }
            });
        },
        productosFiltrados() {
            if (!this.busqueda) return this.productosAsignados;
            const q = this.busqueda.toLowerCase();
            return this.productosAsignados.filter(p =>
                (p.nombre || '').toLowerCase().includes(q) ||
                String(p.id).includes(q)
            );
        },
        estaVencido() {
            if (!this.bono.fecha_vencimiento) return false;
            return new Date(this.bono.fecha_vencimiento) < new Date();
        }
    },
    watch: {
        dialogoBusqueda(val) {
            if (val) {
                this.cargarProductosDisponibles();
            } else {
                // Cuando se cierra, limpiar
                this.productoSeleccionado = null;
                this.busquedaInput = '';
            }
        },
        productosAsignados() {
            if (this.dialogoBusqueda) {
                this.cargarProductosDisponibles();
            }
        }
    },
    methods: {
        cerrar() {
            this.dialogo = false;
            this.dialogoBusqueda = false;
        },
        
        onDialogChange(val) {
            if (!val) {
                this.busqueda = '';
            }
        },
        
        onDialogBusquedaChange(val) {
            if (!val) {
                this.productoSeleccionado = null;
                this.busquedaInput = '';
            }
        },
        
        async cargarProductosDisponibles() {
            this.cargandoDisponibles = true;
            try {
                if (!this.bono || !this.bono.codigo) {
                    this.productosDisponiblesCache = [];
                    return;
                }
                
                const codigo = this.bono.codigo;
                const tipo = this.bono.tipo;
                const campo = tipo === 'precio' ? 'grupo_precio' : 'grupo_bono';
                this.productosDisponiblesCache = (store.state.productos || [])
                    .filter(p => p[campo] !== codigo)
                    .map(p => ({
                        id: p.id,
                        nombre: p.nombre || '',
                        categoria: p.categoria || '',
                        precio: p.precio || 0
                    }));
                    
            } catch (e) {
                console.error('Error cargando productos disponibles:', e);
                this.productosDisponiblesCache = [];
            } finally {
                this.cargandoDisponibles = false;
            }
        },
        
        seleccionarProducto(prod) {
            this.productoSeleccionado = prod.id;
            this.agregarProductoDesdeDialogo();
        },
        
        formatearFecha(fecha) {
            if (!fecha) return '';
            return new Date(fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },
        
        obtenerNombreProducto(id) {
            const prod = (store.state.productos || []).find(p => p.id === id);
            return prod ? prod.nombre : `ID: ${id}`;
        },
        
        async agregarProductoDesdeDialogo() {
            if (!this.productoSeleccionado) return;
            
            const prodId = this.productoSeleccionado;
            this.agregando = true;
            
            try {
                const prod = store.state.productos.find(p => p.id === prodId);
                if (!prod) return;

                const campo = this.bono.tipo === 'precio' ? 'grupo_precio' : 'grupo_bono';
                
                await allProductos().child(prodId).child(campo).set(this.bono.codigo);
                const idx = store.state.productos.findIndex(p => p.id === prodId);
                if (idx !== -1) {
                    store.state.productos[idx][campo] = this.bono.codigo;
                }
                
                this.$emit('producto-agregado', prod);
                setTimeout(() => {
                    this.agregando = false;
                    this.productoSeleccionado = null;
                    this.busquedaInput = '';
                    this.dialogoBusqueda = false;
                }, 300);
                
            } catch (e) {
                console.error('Error agregando producto:', e);
                alert('Error al agregar el producto');
                this.agregando = false;
            }
        },
        
        async quitarProducto(prod) {
            if (!confirm(`¿Quitar "${prod.nombre}" de este bono?`)) return;
            
            this.quitando = prod.id;
            try {
                const campo = this.bono.tipo === 'precio' ? 'grupo_precio' : 'grupo_bono';
                
                await allProductos().child(prod.id).child(campo).remove();
                
                const idx = store.state.productos.findIndex(p => p.id === prod.id);
                if (idx !== -1) {
                    store.state.productos[idx][campo] = null;
                }
                
                this.$emit('producto-quitado', prod);
                if (this.dialogoBusqueda) {
                    this.cargarProductosDisponibles();
                }
                
            } catch (e) {
                console.error('Error quitando producto:', e);
                alert('Error al quitar el producto');
            } finally {
                this.quitando = null;
            }
        }
    }
};
</script>
<style scoped>
.lh-1 { line-height: 1 !important; }
.lh-tight { line-height: 1.2 !important; }
.min-height-48 { min-height: 48px !important; }
.border-top-pt-1 { border-top: 1px dashed #eee; padding-top: 4px; }
.rounded-lg-md { border-radius: 12px !important; }
</style>