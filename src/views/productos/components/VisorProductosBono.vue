<template>
    <div>
        <v-dialog v-model="dialogo" max-width="650px" scrollable @input="onDialogChange">
            <v-card>
                <v-system-bar window dark>
                    <v-icon @click="cerrar">mdi-close</v-icon>
                    <span class="ml-2">Productos asignados al bono</span>
                    <v-spacer></v-spacer>
                    <v-chip x-small :color="bono.activo ? 'success' : 'error'" text-color="white">
                        {{ bono.activo ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                </v-system-bar>

                <v-card-title class="py-2">
                    <div class="flex-grow-1">
                        <div class="text-subtitle-1 font-weight-bold">{{ bono.nombre }}</div>
                        <div class="text-caption grey--text">
                            Código: {{ bono.codigo }} | {{ bono.tipo === 'precio' ? 'Precio Mayoreo' : 'Bonificación' }}
                            <span v-if="bono.fecha_vencimiento">
                                | Vence: {{ formatearFecha(bono.fecha_vencimiento) }}
                            </span>
                        </div>
                    </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text class="pa-2" style="max-height: 450px; overflow-y: auto;">
                    <v-card outlined class="pa-2 mb-3" color="grey lighten-5">
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="text-caption font-weight-bold">
                                    <v-icon small color="primary" class="mr-1">mdi-package-variant</v-icon>
                                    Productos asignados: {{ productosAsignados.length }}
                                </div>
                            </div>
                            <v-btn color="primary" small @click="dialogoBusqueda = true">
                                <v-icon left small>mdi-magnify-plus</v-icon>
                                Buscar Productos
                            </v-btn>
                        </div>
                    </v-card>

                    <v-text-field v-model="busqueda" dense outlined hide-details prepend-inner-icon="mdi-magnify"
                        placeholder="Buscar en productos asignados..." class="mb-2" clearable></v-text-field>

                    <v-simple-table dense fixed-header height="200px" v-if="productosFiltrados.length">
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th width="80">ID</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th width="100">Precio</th>
                                    <th width="50">Quitar</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="prod in productosFiltrados" :key="prod.id">
                                    <td class="text-caption">{{ prod.id }}</td>
                                    <td>{{ prod.nombre }}</td>
                                    <td class="text-caption grey--text">{{ prod.categoria }}</td>
                                    <td class="text-caption">S/{{ Number(prod.precio || 0).toFixed(2) }}</td>
                                    <td>
                                        <v-btn icon x-small color="red" @click="quitarProducto(prod)" 
                                            :loading="quitando === prod.id">
                                            <v-icon x-small>mdi-close</v-icon>
                                        </v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>

                    <v-alert v-else type="info" dense text>
                        No hay productos asignados a este bono
                    </v-alert>

                    <v-expansion-panels v-if="bono.tipo === 'bono' && bono.data && bono.data.length" class="mt-4">
                        <v-expansion-panel>
                            <v-expansion-panel-header>
                                <v-icon small color="orange" class="mr-2">mdi-gift</v-icon>
                                <span class="text-subtitle-2">Reglas de Bonificación</span>
                                <v-chip x-small color="orange" text-color="white" class="ml-2">
                                    {{ bono.data.length }}
                                </v-chip>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content class="pa-2">
                                <v-simple-table dense>
                                    <template v-slot:default>
                                        <thead>
                                            <tr>
                                                <th>A partir de</th>
                                                <th>Bono</th>
                                                <th>Máx</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(regla, idx) in bono.data" :key="idx">
                                                <td>{{ regla.apartir_de }} und</td>
                                                <td>{{ regla.cantidad_bono }}x {{ obtenerNombreProducto(regla.codigo) }}</td>
                                                <td>{{ regla.cantidad_max || '∞' }}</td>
                                            </tr>
                                        </tbody>
                                    </template>
                                </v-simple-table>
                            </v-expansion-panel-content>
                        </v-expansion-panel>
                    </v-expansion-panels>

                    <v-expansion-panels v-if="bono.tipo === 'precio'" class="mt-4">
                        <v-expansion-panel>
                            <v-expansion-panel-header>
                                <v-icon small color="blue" class="mr-2">mdi-tag-multiple</v-icon>
                                <span class="text-subtitle-2">Escalas de Precios</span>
                                <v-chip x-small color="blue" text-color="white" class="ml-2">
                                    {{ (bono.escala_may1 ? 1 : 0) + (bono.escala_may2 ? 1 : 0) }}
                                </v-chip>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content class="pa-2">
                                <v-row dense>
                                    <v-col cols="12" sm="6" v-if="bono.escala_may1">
                                        <v-card outlined class="pa-2">
                                            <div class="text-caption grey--text">Mayorista 1</div>
                                            <div>≥ <strong>{{ bono.escala_may1 }}</strong> und</div>
                                            <div class="success--text font-weight-bold">S/{{ bono.precio_may1 }}</div>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12" sm="6" v-if="bono.escala_may2">
                                        <v-card outlined class="pa-2">
                                            <div class="text-caption grey--text">Mayorista 2</div>
                                            <div>≥ <strong>{{ bono.escala_may2 }}</strong> und</div>
                                            <div class="success--text font-weight-bold">S/{{ bono.precio_may2 }}</div>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-expansion-panel-content>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="py-1">
                    <v-chip small outlined>
                        <v-icon small left>mdi-package-variant</v-icon>
                        {{ productosAsignados.length }} productos asignados
                    </v-chip>
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="cerrar">Cerrar</v-btn>
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