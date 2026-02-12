<template>
    <v-card flat outlined class="rounded-lg mb-8">
        <v-card-title class="py-2 px-3 blue-grey lighten-5">
            <v-icon small color="primary" class="mr-2">mdi-package-variant-closed</v-icon>
            <span class="text-subtitle-2 font-weight-bold">Presentaciones de Venta</span>
            <v-spacer></v-spacer>
            <v-btn small color="primary" depressed rounded @click="abrirDialogAgregar">
                <v-icon small left>mdi-plus</v-icon> Agregar
            </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-0 d-none d-md-block">
            <v-simple-table dense fixed-header>
                <template v-slot:default>
                    <thead>
                        <tr class="blue-grey lighten-5">
                            <th class="text-left">Nombre</th>
                            <th class="text-left">Medida</th>
                            <th class="text-center">Factor</th>
                            <th class="text-center">Precio</th>
                            <th class="text-center">Activo</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!presentacionesArrayFiltrados.length">
                            <td colspan="6" class="text-center grey--text py-4">
                                <v-icon color="grey" class="mb-1">mdi-package-variant</v-icon>
                                <div class="caption">Sin presentaciones. Agrega una para comenzar.</div>
                            </td>
                        </tr>
                        <tr v-for="(pres, idx) in presentacionesArrayFiltrados" :key="pres._id"
                            :class="{ 'red lighten-5': !pres.activo }">
                            <td>{{ pres.nombre || '—' }}</td>
                            <td>{{ pres.medida || '—' }}</td>
                            <td class="text-center">{{ pres.factor }}</td>
                            <td class="text-center">{{ formatearPrecio(pres.precio) }}</td>
                            <td class="text-center">
                                <v-chip x-small :color="pres.activo ? 'success' : 'grey'" text-color="white"
                                    @click="toggleActivo(pres, idx)" style="cursor: pointer">
                                    {{ pres.activo ? 'Sí' : 'No' }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <v-btn icon x-small color="primary" @click="abrirDialogEditar(idx)" class="mr-1">
                                    <v-icon small>mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn icon x-small color="red" @click="eliminarPresentacion(idx)">
                                    <v-icon small>mdi-delete</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card-text>

        <v-card-text class="pa-2 d-md-none">
            <v-row v-if="!presentacionesArrayFiltrados.length">
                <v-col cols="12" class="text-center grey--text py-4">
                    <v-icon color="grey" class="mb-1">mdi-package-variant</v-icon>
                    <div class="caption">Sin presentaciones. Agrega una para comenzar.</div>
                </v-col>
            </v-row>

            <v-row v-else>
                <v-col v-for="(pres, idx) in presentacionesArrayFiltrados" :key="pres._id" cols="12">
                    <v-card flat outlined :class="{ 'red lighten-5': !pres.activo }" class="rounded-lg">
                        <v-card-text class="pa-2">
                            <v-row dense>
                                <v-col cols="8">
                                    <strong>{{ pres.nombre || 'Sin nombre' }}</strong>
                                    <div class="caption grey--text">{{ pres.medida }} • Factor: {{ pres.factor }}</div>
                                </v-col>
                                <v-col cols="4" class="text-right">
                                    <v-chip x-small :color="pres.activo ? 'success' : 'grey'" text-color="white"
                                        @click="toggleActivo(pres, idx)" style="cursor: pointer">
                                        {{ pres.activo ? 'Activo' : 'Inactivo' }}
                                    </v-chip>
                                </v-col>
                            </v-row>

                            <v-row dense class="mt-1">
                                <v-col cols="12">
                                    <span class="caption">Precio:</span>
                                    <div class="font-weight-bold">{{ formatearPrecio(pres.precio) }}</div>
                                </v-col>
                            </v-row>
                        </v-card-text>

                        <v-divider></v-divider>

                        <v-card-actions class="pa-1">
                            <v-btn small text color="primary" @click="abrirDialogEditar(idx)">
                                <v-icon left small>mdi-pencil</v-icon> Editar
                            </v-btn>
                            <v-spacer></v-spacer>
                            <v-btn small text color="red" @click="eliminarPresentacion(idx)">
                                <v-icon left small>mdi-delete</v-icon> Eliminar
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-card-text>

        <v-dialog v-model="dialog" max-width="400px" persistent>
            <v-card>
                <v-card-title class="blue-grey lighten-5">
                    <v-icon small color="primary" class="mr-2">mdi-package-variant-closed</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">{{ dialogTitulo }}</span>
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field v-model="form.nombre" label="Nombre de la presentación"
                                    placeholder="Ej: Caja x6, Pack familiar" outlined dense hide-details="auto"
                                    :error-messages="errores.nombre" @input="limpiarError('nombre')"></v-text-field>
                            </v-col>
                        </v-row>

                        <v-row class="mt-2">
                            <v-col cols="12">
                                <v-select v-model="form.medida" :items="medidasItems" item-text="nombre"
                                    item-value="nombre" label="Unidad" outlined dense hide-details="auto"></v-select>
                            </v-col>
                        </v-row>

                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-text-field v-model.number="form.factor" type="number" label="Factor" placeholder="1"
                                    outlined dense hide-details="auto" min="1" step="1" :error-messages="errores.factor"
                                    @input="validarFactorForm"></v-text-field>
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field v-model.number="form.precio" type="number" label="Precio"
                                    placeholder="0.00" outlined dense hide-details="auto" min="0" step="0.01"
                                    prefix="USD" :error-messages="errores.precio"
                                    @input="limpiarError('precio')"></v-text-field>
                            </v-col>
                        </v-row>

                        <v-row class="mt-2" v-if="modoEdicion">
                            <v-col cols="12">
                                <v-checkbox v-model="form.activo" label="Presentación activa" dense hide-details
                                    class="mt-0"></v-checkbox>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text color="grey darken-1" @click="cerrarDialog">
                        Cancelar
                    </v-btn>
                    <v-btn color="primary" @click="guardarPresentacion" :loading="cargando" depressed>
                        {{ modoEdicion ? 'Actualizar' : 'Agregar' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogEliminar" max-width="400px">
            <v-card>
                <v-card-title class="red lighten-5">
                    <v-icon color="red" class="mr-2">mdi-alert-circle</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">Confirmar eliminación</span>
                </v-card-title>
                <v-card-text class="pt-4">
                    ¿Estás seguro de eliminar la presentación
                    <strong>"{{ presentacionAEliminar?.nombre || 'sin nombre' }}"</strong>?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text color="grey darken-1" @click="dialogEliminar = false">
                        Cancelar
                    </v-btn>
                    <v-btn color="red" @click="confirmarEliminar" depressed>
                        Eliminar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-alert v-if="errorDuplicado" type="error" dense text class="ma-2 caption">
            <v-icon small left>mdi-alert-circle</v-icon>
            {{ errorDuplicado }}
        </v-alert>

        <v-snackbar v-model="snack" :timeout="2000" top right :color="snackColor">
            {{ snackMsg }}
        </v-snackbar>
    </v-card>
</template>

<script>
import store from '@/store/index';

export default {
    name: 'GestionPresentaciones',

    props: {
        producto: {
            type: Object,
            default: () => ({})
        },
        value: {
            type: [Object, Array],
            default: () => ({})
        }
    },

    data() {
        return {
            presentacionesArray: [],
            snack: false,
            snackMsg: '',
            snackColor: 'success',
            nextId: 1,

            dialog: false,
            dialogEliminar: false,
            dialogTitulo: 'Nueva Presentación',
            modoEdicion: false,
            indiceEdicion: -1,
            cargando: false,

            form: {
                nombre: '',
                medida: 'UNIDAD',
                factor: 1,
                precio: 0,
                activo: true
            },

            errores: {
                nombre: '',
                factor: '',
                precio: ''
            },
            presentacionAEliminar: null,
            indiceAEliminar: -1
        };
    },

    computed: {
        monedaSimbolo(){
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/';
        },
        stockProducto() {
            return Number(this.producto?.stock || 0);
        },

        medidasItems() {
            const medidas = store.state.medidassunat || [];
            if (!medidas.length) {
                return [
                    { nombre: 'UNIDAD', corto: 'NIU' },
                    { nombre: 'CAJA', corto: 'BX' },
                    { nombre: 'PAQUETE', corto: 'PK' },
                    { nombre: 'DOCENA', corto: 'DZN' },
                    { nombre: 'DISPLAY', corto: 'NIU' },
                    { nombre: 'FARDO', corto: 'NIU' }
                ];
            }
            return medidas;
        },

        presentacionesArrayFiltrados() {
            return this.presentacionesArray.filter(p => p && typeof p === 'object');
        },

        presentacionesActivas() {
            return this.presentacionesArrayFiltrados.filter(p => p.activo);
        },

        stockCalculadoForm() {
            return Math.floor(this.stockProducto / (Number(this.form.factor) || 1));
        },

        errorDuplicado() {
            const activas = this.presentacionesActivas;
            const factores = activas.map(p => Number(p.factor));
            const duplicados = factores.filter((f, i) => factores.indexOf(f) !== i);

            if (duplicados.length > 0) {
                return `Ya existe una presentación activa con factor ${duplicados[0]}`;
            }
            return null;
        }
    },

    watch: {
        value: {
            handler(nv) {
                if (nv === null || nv === undefined) {
                    this.cargarDesdeValue({});
                } else {
                    this.cargarDesdeValue(nv);
                }
            },
            immediate: true,
            deep: true
        }
    },

    methods: {
        cargarDesdeValue(val) {
            if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
                this.presentacionesArray = [];
                this.nextId = 1;
                return;
            }

            let arr = [];

            if (Array.isArray(val)) {
                arr = val
                    .filter(p => p != null)
                    .map((p, i) => ({
                        _id: String(p._id || p.id || i + 1),
                        nombre: p.nombre || '',
                        medida: p.medida || 'UNIDAD',
                        factor: Number(p.factor) || 1,
                        precio: Number(p.precio) || 0,
                        activo: p.activo !== false
                    }));
            } else if (typeof val === 'object') {
                arr = Object.entries(val)
                    .filter(([_, p]) => p != null)
                    .map(([key, p]) => ({
                        _id: key,
                        nombre: p.nombre || '',
                        medida: p.medida || 'UNIDAD',
                        factor: Number(p.factor) || 1,
                        precio: Number(p.precio) || 0,
                        activo: p.activo !== false
                    }));
            }

            arr.sort((a, b) => a.factor - b.factor);

            const ids = arr
                .map(p => {
                    const num = Number(p._id);
                    return !isNaN(num) && num > 0 ? num : 0;
                })
                .filter(n => n > 0);

            this.nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

            this.presentacionesArray = arr;
        },

        calcularStockDisp(factor) {
            const f = Number(factor) || 1;
            return Math.floor(this.stockProducto / f);
        },

        formatearPrecio(precio) {
            return new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
                minimumFractionDigits: 2
            }).format(precio || 0);
        },

        abrirDialogAgregar() {
            this.modoEdicion = false;
            this.indiceEdicion = -1;
            this.dialogTitulo = 'Nueva Presentación';
            this.form = {
                nombre: '',
                medida: 'UNIDAD',
                factor: 1,
                precio: 0,
                activo: true
            };
            this.errores = { nombre: '', factor: '', precio: '' };
            this.dialog = true;
        },

        abrirDialogEditar(idx) {
            const pres = this.presentacionesArray[idx];
            this.modoEdicion = true;
            this.indiceEdicion = idx;
            this.dialogTitulo = 'Editar Presentación';
            this.form = {
                nombre: pres.nombre || '',
                medida: pres.medida || 'UNIDAD',
                factor: Number(pres.factor) || 1,
                precio: Number(pres.precio) || 0,
                activo: pres.activo !== false
            };
            this.errores = { nombre: '', factor: '', precio: '' };
            this.dialog = true;
        },

        cerrarDialog() {
            this.dialog = false;
            this.cargando = false;
            this.form = { nombre: '', medida: 'UNIDAD', factor: 1, precio: 0, activo: true };
            this.errores = { nombre: '', factor: '', precio: '' };
        },

        validarFactorForm() {
            let f = Number(this.form.factor);
            if (!Number.isFinite(f) || f < 1) f = 1;
            this.form.factor = Math.floor(f);

            if (this.form.activo) {
                const factorDuplicado = this.presentacionesActivas.some((p, i) => {
                    if (this.modoEdicion && i === this.indiceEdicion) return false;
                    return Number(p.factor) === Number(this.form.factor);
                });

                if (factorDuplicado) {
                    this.errores.factor = 'Ya existe una presentación activa con este factor';
                } else {
                    this.errores.factor = '';
                }
            }
        },

        limpiarError(campo) {
            if (this.errores[campo]) {
                this.errores[campo] = '';
            }
        },

        validarFormulario() {
            let valido = true;
            this.errores = { nombre: '', factor: '', precio: '' };

            if (!this.form.nombre || this.form.nombre.trim() === '') {
                this.errores.nombre = 'El nombre es requerido';
                valido = false;
            }

            if (!this.form.factor || this.form.factor < 1) {
                this.errores.factor = 'El factor debe ser mayor a 0';
                valido = false;
            }

            if (!this.form.precio || this.form.precio <= 0) {
                this.errores.precio = 'El precio es requerido';
                valido = false;
            }

            if (this.form.activo && valido) {
                const factorDuplicado = this.presentacionesActivas.some((p, i) => {
                    if (this.modoEdicion && i === this.indiceEdicion) return false;
                    return Number(p.factor) === Number(this.form.factor);
                });

                if (factorDuplicado) {
                    this.errores.factor = 'Ya existe una presentación activa con este factor';
                    valido = false;
                }
            }

            return valido;
        },

        guardarPresentacion() {
            if (!this.validarFormulario()) return;

            this.cargando = true;

            if (this.modoEdicion) {
                const idx = this.indiceEdicion;
                const pres = this.presentacionesArray[idx];
                Object.assign(pres, {
                    nombre: this.form.nombre.trim(),
                    medida: this.form.medida,
                    factor: Number(this.form.factor),
                    precio: Number(this.form.precio),
                    activo: this.form.activo
                });
                this.mostrarSnack('Presentación actualizada', 'success');
            } else {
                this.presentacionesArray.push({
                    _id: String(this.nextId),
                    nombre: this.form.nombre.trim(),
                    medida: this.form.medida,
                    factor: Number(this.form.factor),
                    precio: Number(this.form.precio),
                    activo: true
                });
                this.nextId++;
                this.mostrarSnack('Presentación agregada', 'success');
            }

            this.presentacionesArray.sort((a, b) => a.factor - b.factor);

            this.emitirCambio();
            this.cerrarDialog();
            this.cargando = false;
        },

        toggleActivo(pres, idx) {
            if (!pres.activo) {
                const activas = this.presentacionesArray.filter(p => p && p.activo);
                if (activas.length === 1 && activas[0]._id === pres._id) {
                    this.mostrarSnack('Debe existir al menos 1 presentación activa', 'error');
                    return;
                }
            }

            pres.activo = !pres.activo;
            this.emitirCambio();
        },

        duplicarPresentacion(idx) {
            const original = this.presentacionesArray[idx];
            if (!original) return;

            const factorExistente = this.presentacionesActivas.some(
                p => Number(p.factor) === Number(original.factor)
            );

            if (factorExistente) {
                this.mostrarSnack('Ya existe una presentación activa con este factor', 'error');
                return;
            }

            this.presentacionesArray.push({
                _id: String(this.nextId),
                nombre: original.nombre ? `${original.nombre} (copia)` : '',
                medida: original.medida,
                factor: original.factor,
                precio: original.precio,
                activo: true
            });
            this.nextId++;
            this.emitirCambio();
            this.mostrarSnack('Presentación duplicada', 'success');
        },

        esUnicaActiva(idx) {
            const activas = this.presentacionesArray.filter(p => p && p.activo);
            if (activas.length <= 1) {
                const pres = this.presentacionesArray[idx];
                return pres && pres.activo;
            }
            return false;
        },

        eliminarPresentacion(idx) {
            const pres = this.presentacionesArray[idx];

            this.presentacionAEliminar = pres;
            this.indiceAEliminar = idx;
            this.dialogEliminar = true;
        },

        confirmarEliminar() {
            this.presentacionesArray.splice(this.indiceAEliminar, 1);
            this.emitirCambio();
            this.mostrarSnack('Presentación eliminada', 'success');
            this.dialogEliminar = false;
            this.presentacionAEliminar = null;
            this.indiceAEliminar = -1;
        },

        emitirCambio() {
            const obj = {};
            this.presentacionesArrayFiltrados.forEach(p => {
                obj[p._id] = {
                    nombre: p.nombre || '',
                    medida: p.medida || 'UNIDAD',
                    factor: Number(p.factor) || 1,
                    precio: Number(p.precio) || 0,
                    activo: p.activo !== false
                };
            });

            this.$emit('input', obj);
            this.$emit('update:stock', this.stockProducto);
        },

        mostrarSnack(msg, color = 'success') {
            this.snackMsg = msg;
            this.snackColor = color;
            this.snack = true;
        },

        validarAntesDeGuardar() {
            if (this.errorDuplicado) {
                this.mostrarSnack(this.errorDuplicado, 'error');
                return false;
            }
            return true;
        },

        obtenerParaGuardar() {
            const obj = {};
            this.presentacionesArrayFiltrados.forEach(p => {
                obj[p._id] = {
                    nombre: p.nombre || '',
                    medida: p.medida || 'UNIDAD',
                    factor: Number(p.factor) || 1,
                    precio: Number(p.precio) || 0,
                    activo: p.activo !== false
                };
            });
            return obj;
        }
    }
};
</script>

<style scoped>
.caption-input {
    font-size: 12px !important;
}

.caption-input>>>input {
    font-size: 12px !important;
    padding: 4px 8px !important;
}

.caption-input>>>.v-input__slot {
    min-height: 28px !important;
}

.centered-input>>>input {
    text-align: center;
}

.v-data-table__wrapper {
    max-height: 250px;
    overflow-y: auto;
}

@media (max-width: 600px) {
    .v-data-table__wrapper {
        max-height: none;
        overflow-y: visible;
    }
}

.v-dialog {
    margin: 16px;
}
</style>