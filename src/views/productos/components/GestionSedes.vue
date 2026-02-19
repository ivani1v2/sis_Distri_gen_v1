<template>
    <div>
        <!-- Diálogo: Copiar Producto a Otras Sedes -->
        <v-dialog v-model="dialogoSedesLocal" max-width="500px" persistent scrollable>
            <v-card>
                <v-toolbar flat dense color="primary" dark>
                    <v-btn icon @click="cerrarDialogoSedes" :disabled="copiandoSedes">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-toolbar-title class="text-subtitle-1">
                        Copiar Producto a Otras Sedes
                    </v-toolbar-title>
                </v-toolbar>
                <v-card-text class="pt-4">
                    <v-alert type="info" dense text class="mb-4">
                        El producto ya fue guardado en la sede actual.
                        Selecciona las sedes adicionales donde deseas copiarlo.
                    </v-alert>
                    <div class="d-flex justify-space-between mb-3">
                        <span class="text-subtitle-2">Sedes disponibles: {{ sedesDisponibles.length }}</span>
                        <div>
                            <v-btn small text color="primary" @click="seleccionarTodasLasSedes"
                                :disabled="copiandoSedes">
                                Seleccionar todo
                            </v-btn>
                            <v-btn small text color="grey" @click="deseleccionarTodasLasSedes"
                                :disabled="copiandoSedes">
                                Limpiar
                            </v-btn>
                        </div>
                    </div>
                    <v-list dense>
                        <v-list-item v-for="sede in sedesDisponibles" :key="sede.base">
                            <template v-slot:default>
                                <v-list-item-action>
                                    <v-checkbox v-model="sedesSeleccionadas" :value="sede.base"
                                        :disabled="copiandoSedes" color="primary"></v-checkbox>
                                </v-list-item-action>
                                <v-list-item-content>
                                    <v-list-item-title>{{ sede.nombre || sede.base }}</v-list-item-title>
                                    <v-list-item-subtitle v-if="sede.direccion">
                                        {{ sede.direccion }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                        </v-list-item>
                    </v-list>
                    <v-divider class="my-2"></v-divider>
                    <div class="text-caption grey--text">
                        <v-icon small color="grey">mdi-information</v-icon>
                        El producto se copiará con stock 0 en las sedes seleccionadas.
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn text color="grey" @click="cerrarDialogoSedes" :disabled="copiandoSedes">
                        Cancelar
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="copiarASedesSeleccionadas" :loading="copiandoSedes"
                        :disabled="copiandoSedes">
                        <v-icon left>mdi-content-copy</v-icon>
                        Copiar a {{ sedesSeleccionadas.length }} {{ sedesSeleccionadas.length === 1 ? 'sede' : 'sedes'
                        }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Diálogo: Sincronizar Producto en Otras Sedes -->
        <v-dialog v-model="dialogoSincronizarLocal" max-width="450px" persistent scrollable>
            <v-card>
                <v-toolbar flat dense color="teal" dark>
                    <v-btn icon @click="cerrarDialogoSincronizar" :disabled="sincronizando">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-toolbar-title class="text-subtitle-1">
                        Sincronizar Producto en Otras Sedes
                    </v-toolbar-title>
                </v-toolbar>

                <v-card-text class="pt-4">
                    <v-alert type="info" dense text class="mb-4">
                        <div class="d-flex align-center">
                            <div>
                                <strong>{{ productoActual.nombre }}</strong> (ID: {{ productoActual.id }})<br>
                                <small class="grey--text">{{ productoActual.categoria }} | Precio: S/{{ productoActual.precio }} | Stock: {{ productoActual.stock }}</small>
                            </div>
                        </div>
                    </v-alert>

                    <v-progress-linear v-if="sedesSincronizacion.some(s => s.checking)" indeterminate color="teal"
                        class="mb-3" height="2"></v-progress-linear>

                    <div class="d-flex justify-space-between mb-3" v-if="!sedesSincronizacion.some(s => s.checking)">
                        <div>
                            <v-btn small text color="teal" @click="seleccionarTodasSincronizacion"
                                :disabled="sincronizando">
                                <v-icon left small>mdi-checkbox-marked</v-icon>
                                Seleccionar todo
                            </v-btn>
                            <v-btn small text color="grey" @click="deseleccionarTodasSincronizacion"
                                :disabled="sincronizando" class="ml-1">
                                <v-icon left small>mdi-checkbox-blank-outline</v-icon>
                                Limpiar
                            </v-btn>
                        </div>
                    </div>

                    <v-list dense class="mb-3">
                        <v-list-item v-for="sede in sedesSincronizacion" :key="sede.base" class="px-0">
                            <template v-slot:default>
                                <v-list-item-action class="mr-3">
                                    <v-checkbox v-model="sede.seleccionada" :value="sede.base"
                                        :disabled="sincronizando || sede.checking" color="teal" hide-details
                                        class="mt-0"></v-checkbox>
                                </v-list-item-action>

                                <v-list-item-content>
                                    <v-list-item-title class="d-flex align-center">
                                        {{ sede.nombre || sede.base }}
                                        <v-chip v-if="sede.checking" x-small color="grey" outlined class="ml-2">
                                            <v-icon x-small left>mdi-loading mdi-spin</v-icon>
                                            verificando
                                        </v-chip>
                                        <v-chip v-else-if="sede.existe === true" x-small color="success" outlined
                                            class="ml-2">
                                            <v-icon x-small left>mdi-check-circle</v-icon>
                                            existe
                                        </v-chip>
                                        <v-chip v-else-if="sede.existe === false" x-small color="warning" outlined
                                            class="ml-2">
                                            <v-icon x-small left>mdi-alert-circle</v-icon>
                                            nuevo
                                        </v-chip>
                                    </v-list-item-title>

                                    <v-list-item-subtitle>
                                        <span v-if="sede.checking" class="grey--text">
                                            Verificando existencia...
                                        </span>
                                        <span v-else-if="sede.existe === true" class="success--text">
                                            <v-icon x-small color="success">mdi-package</v-icon>
                                            Stock actual: {{ sede.productoData?.stock || 0 }} |
                                            Precio: S/{{ Number(sede.productoData?.precio || 0).toFixed(2) }}
                                        </span>
                                        <span v-else-if="sede.existe === false" class="warning--text">
                                            <v-icon x-small color="warning">mdi-plus-circle</v-icon>
                                            Se creará nuevo producto con stock 0
                                        </span>
                                        <span v-else class="grey--text">
                                            <v-icon x-small>mdi-help-circle</v-icon>
                                            Pendiente de verificación
                                        </span>
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions class="pa-3">
                    <v-btn text color="grey" @click="cerrarDialogoSincronizar" :disabled="sincronizando">
                        Cancelar
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="teal" dark @click="ejecutarSincronizacion" :loading="sincronizando"
                        :disabled="sincronizando || !sedesSincronizacion.some(s => s.seleccionada)" elevation="2">
                        <v-icon left>mdi-sync</v-icon>
                        Sincronizar {{ sedesSincronizacion.filter(s => s.seleccionada).length }}
                        {{ sedesSincronizacion.filter(s => s.seleccionada).length === 1 ? 'sede' : 'sedes' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { nuevoProductoOtraBase, buscaProductosOtraBase } from '../../../db'
import store from '@/store/index'

export default {
    name: 'GestionSedes',
    props: {
        mostrarSedes: {
            type: Boolean,
            default: false
        },
        productoACopiar: {
            type: Object,
            default: () => null
        },
        mostrarSincronizar: {
            type: Boolean,
            default: false
        },
        productoSincronizar: {
            type: Object,
            default: () => ({})
        }
    },
    data: () => ({
        // Copiar sedes
        sedesDisponibles: [],
        sedesSeleccionadas: [],
        copiandoSedes: false,
        // Sincronizar
        sedesSincronizacion: [],
        sincronizando: false,
    }),
    computed: {
        dialogoSedesLocal: {
            get() {
                return this.mostrarSedes;
            },
            set(val) {
                this.$emit('update:mostrarSedes', val);
            }
        },
        dialogoSincronizarLocal: {
            get() {
                return this.mostrarSincronizar;
            },
            set(val) {
                this.$emit('update:mostrarSincronizar', val);
            }
        },
        productoActual() {
            return this.productoSincronizar || {};
        }
    },
    watch: {
        mostrarSedes(val) {
            if (val) {
                this.inicializarDialogoSedes();
            }
        },
        mostrarSincronizar(val) {
            if (val) {
                this.inicializarDialogoSincronizar();
            } else {
                this.limpiarSincronizacion();
            }
        }
    },
    methods: {
        inicializarDialogoSedes() {
            const todasLasSedes = store.state.array_sedes || [];
            const bdActual = this.$store.state.baseDatos.bd;
            this.sedesDisponibles = todasLasSedes.filter(s => s.tipo === 'sede' && s.base !== bdActual);
            this.sedesSeleccionadas = [];
        },
        seleccionarTodasLasSedes() {
            this.sedesSeleccionadas = this.sedesDisponibles.map(s => s.base);
        },
        deseleccionarTodasLasSedes() {
            this.sedesSeleccionadas = [];
        },
        cerrarDialogoSedes() {
            this.dialogoSedesLocal = false;
            this.$emit('cerrar-sedes');
        },
        async copiarASedesSeleccionadas() {
            if (!this.productoACopiar) {
                console.error('No hay producto seleccionado para copiar');
                return;
            }
            if (this.sedesSeleccionadas.length === 0) {
                if (!confirm('No has seleccionado ninguna sede. ¿Deseas continuar?')) {
                    return;
                }
                this.$emit('copiado', { exitosas: 0 });
                this.dialogoSedesLocal = false;
                return;
            }
            this.copiandoSedes = true;
            store.commit("dialogoprogress");

            try {
                const id = this.productoACopiar.id;
                const productoData = { ...this.productoACopiar };
                productoData.stock = 0;
                const promesas = this.sedesSeleccionadas.map(baseSede =>
                    nuevoProductoOtraBase(baseSede, id, productoData)
                );
                await Promise.all(promesas);

                const mensaje = `Producto copiado correctamente a ${promesas.length} ${promesas.length === 1 ? 'sede' : 'sedes'}`;
                store.commit("dialogosnackbar", mensaje);
                this.$emit('copiado', { exitosas: promesas.length });
                this.dialogoSedesLocal = false;
            } catch (error) {
                console.error('Error copiando producto a sedes:', error);
                store.commit("dialogosnackbar", "Error al copiar el producto a algunas sedes");
                this.$emit('copiado', { exitosas: 0, error: true });
                this.dialogoSedesLocal = false;
            } finally {
                this.copiandoSedes = false;
                store.commit("dialogoprogress");
            }
        },

        // ===== SINCRONIZAR =====
        inicializarDialogoSincronizar() {
            this.sedesSincronizacion = [];
            const todasLasSedes = store.state.array_sedes || [];
            const bdActual = this.$store.state.baseDatos.bd;
            this.sedesSincronizacion = todasLasSedes
                .filter(s => s.tipo === 'sede' && s.base !== bdActual)
                .map(s => ({
                    ...s,
                    checking: false,
                    existe: null,
                    productoData: null,
                    seleccionada: false
                }));
            this.verificarExistenciaEnSedes();
        },
        limpiarSincronizacion() {
            this.sedesSincronizacion.forEach(s => {
                s.checking = false;
                s.existe = null;
                s.productoData = null;
                s.seleccionada = false;
            });
        },
        async verificarExistenciaEnSedes() {
            const idProducto = this.productoActual.id;
            if (!idProducto) return;

            for (const sede of this.sedesSincronizacion) {
                sede.checking = true;
                try {
                    const snapshot = await buscaProductosOtraBase(sede.base, idProducto).once("value");
                    sede.existe = snapshot.exists();
                    if (sede.existe) {
                        sede.productoData = snapshot.val();
                    }
                } catch (error) {
                    console.error(`Error verificando sede ${sede.base}:`, error);
                    sede.existe = false;
                    sede.error = true;
                } finally {
                    sede.checking = false;
                }
            }
        },
        seleccionarTodasSincronizacion() {
            this.sedesSincronizacion.forEach(s => {
                s.seleccionada = true;
            });
        },
        deseleccionarTodasSincronizacion() {
            this.sedesSincronizacion.forEach(s => {
                s.seleccionada = false;
            });
        },
        cerrarDialogoSincronizar() {
            this.dialogoSincronizarLocal = false;
            this.$emit('cerrar-sincronizar');
        },
        async ejecutarSincronizacion() {
    store.commit("dialogoprogress");
    this.sincronizando = true;

    const p = this.productoActual;
    
    const productoData = {
        id: p.id,
        activo: p.activo === undefined ? true : p.activo,
        codbarra: p.codbarra || '',
        nombre: (p.nombre || '').trim(),
        categoria: p.categoria || '',
        proveedor: p.proveedor || null,
        medida: p.medida || 'UNIDAD',
        factor: p.factor || 1,
        precio: p.precio || 0,
        escala_may1: p.escala_may1 || 0,
        precio_may1: p.precio_may1 || 0,
        escala_may2: p.escala_may2 || 0,
        precio_may2: p.precio_may2 || 0,
        peso: p.peso || 0,
        costo: p.costo || 0,
        tipoproducto: p.tipoproducto || 'BIEN',
        operacion: p.operacion || 'GRAVADA',
        icbper: p.icbper || false,
        controstock: p.controstock === undefined ? true : p.controstock,
        lista_bono: p.lista_bono || [],
        tiene_bono: p.tiene_bono || false,
        marca: p.marca || '',
        grupo_precio: p.grupoPrecioSelect || p.grupo_precio || null,
        grupo_bono: p.grupoBonoSelect || p.grupo_bono || null,
        obs1: p.obs1 || '',
        stock_minimo: Number(p.stock_minimo) || 0,
    };

    Object.keys(productoData).forEach(key => {
        if (productoData[key] === undefined) {
            delete productoData[key];
        }
    });

    const sedesSeleccionadas = this.sedesSincronizacion.filter(s => s.seleccionada);
    let exitos = 0;
    let errores = 0;

    for (const sede of sedesSeleccionadas) {
        try {
            if (sede.existe) {
                const stockOriginal = sede.productoData?.stock || 0;
                await nuevoProductoOtraBase(sede.base, p.id, {
                    ...productoData,
                    stock: stockOriginal
                });
                exitos++;
            } else {
                await nuevoProductoOtraBase(sede.base, p.id, {
                    ...productoData,
                    stock: 0
                });
                exitos++;
            }
        } catch (error) {
            console.error(`Error en sede ${sede.base}:`, error);
            console.error('Datos del producto:', productoData);
            errores++;
        }
    }

    store.commit("dialogoprogress");
    this.sincronizando = false;
    this.dialogoSincronizarLocal = false;

    if (errores === 0) {
        store.commit("dialogosnackbar",
            `Sincronización completada: ${exitos} ${exitos === 1 ? 'sede actualizada' : 'sedes actualizadas'}`
        );
    } else {
        store.commit("dialogosnackbar",
            `Sincronización con errores: ${exitos} exitosas, ${errores} fallidas`
        );
    }
    this.$emit('sincronizado', { exitos, errores });
},
    }
}
</script>
