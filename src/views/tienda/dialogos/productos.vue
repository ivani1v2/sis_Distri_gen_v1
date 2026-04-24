<template>
    <div>
        <template v-if="modo === 'tab'">
            <v-card flat color="transparent">
                <v-card-title class="px-0 pb-4 d-flex align-center">
                    <div class="text-h5 font-weight-black">Productos</div>
                    <v-spacer />
                    <v-btn color="primary" rounded depressed @click="$emit('agregar')">
                        <v-icon left>mdi-plus</v-icon> Nuevo Producto
                    </v-btn>
                </v-card-title>

                <v-text-field v-model="busqueda" class="mb-4" label="Buscar por nombre o codigo"
                    prepend-inner-icon="mdi-magnify" clearable outlined dense hide-details="auto" />

                <v-alert v-if="!localItems.length" type="info" dense text>
                    No hay productos registrados.
                </v-alert>

                <v-alert v-else-if="busqueda && !itemsFiltrados.length" type="info" dense text>
                    No se encontraron productos con esa coincidencia.
                </v-alert>

                <draggable v-else-if="!busqueda" v-model="localItems" :animation="200" handle=".drag-handle"
                    @end="emitirReorden" tag="div" class="d-flex flex-wrap">
                    <div v-for="(item, index) in localItems" :key="item.id" class="pa-2" style="width: 220px;">
                        <v-card class="rounded-xl overflow-hidden" outlined>
                            <v-hover v-slot="{ hover }">
                                <div style="position: relative;">
                                    <v-img :src="principalFoto(item)" :lazy-src="principalThumb(item)" height="180"
                                        class="grey lighten-4" />

                                    <v-fade-transition>
                                        <div v-if="hover" class="d-flex align-center justify-center"
                                            style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="abrirSelector(item.id)">
                                                <v-icon color="primary" small>mdi-camera</v-icon>
                                            </v-btn>

                                            <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                            </v-btn>

                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="$emit('editar', item)">
                                                <v-icon color="warning" small>mdi-pencil</v-icon>
                                            </v-btn>

                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="$emit('eliminar', item.id)">
                                                <v-icon color="red" small>mdi-delete</v-icon>
                                            </v-btn>
                                        </div>
                                    </v-fade-transition>

                                    <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                        <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                            #{{ item.orden || (index + 1) }}
                                        </v-chip>
                                    </div>
                                </div>
                            </v-hover>

                            <v-card-text class="pa-2 text-center">
                                <div class="text-caption font-weight-bold text-truncate black--text">
                                    {{ item.nombre }}
                                </div>
                                <div class="text-caption grey--text">
                                    {{ monedaSimbolo }} {{ Number(item.precio || 0).toFixed(2) }}
                                </div>
                                <div class="text-caption grey--text text-truncate">
                                    {{ item.marca || 'Sin marca' }} • {{ item.categoria || 'Sin categoria' }}
                                </div>
                            </v-card-text>

                            <input :ref="'file_' + item.id" type="file" accept="image/*" style="display:none"
                                @change="seleccionarFoto($event, item.id)" />
                        </v-card>
                    </div>
                </draggable>

                <div v-else class="d-flex flex-wrap">
                    <div v-for="(item, index) in itemsFiltrados" :key="item.id" class="pa-2" style="width: 220px;">
                        <v-card class="rounded-xl overflow-hidden" outlined>
                            <v-hover v-slot="{ hover }">
                                <div style="position: relative;">
                                    <v-img :src="principalFoto(item)" :lazy-src="principalThumb(item)" height="180"
                                        class="grey lighten-4" />

                                    <v-fade-transition>
                                        <div v-if="hover" class="d-flex align-center justify-center"
                                            style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="abrirSelector(item.id)">
                                                <v-icon color="primary" small>mdi-camera</v-icon>
                                            </v-btn>

                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="$emit('editar', item)">
                                                <v-icon color="warning" small>mdi-pencil</v-icon>
                                            </v-btn>

                                            <v-btn fab x-small color="white" class="ma-1"
                                                @click="$emit('eliminar', item.id)">
                                                <v-icon color="red" small>mdi-delete</v-icon>
                                            </v-btn>
                                        </div>
                                    </v-fade-transition>

                                    <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                        <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                            #{{ item.orden || (index + 1) }}
                                        </v-chip>
                                    </div>
                                </div>
                            </v-hover>

                            <v-card-text class="pa-2 text-center">
                                <div class="text-caption font-weight-bold text-truncate black--text">
                                    {{ item.nombre }}
                                </div>
                                <div class="text-caption grey--text">
                                    {{ monedaSimbolo }} {{ Number(item.precio || 0).toFixed(2) }}
                                </div>
                                <div class="text-caption grey--text text-truncate">
                                    {{ item.marca || 'Sin marca' }} • {{ item.categoria || 'Sin categoria' }}
                                </div>
                            </v-card-text>

                            <input :ref="'file_' + item.id" type="file" accept="image/*" style="display:none"
                                @change="seleccionarFoto($event, item.id)" />
                        </v-card>
                    </div>
                </div>
            </v-card>
        </template>

        <template v-else>
            <v-container fluid class="pa-0">
                <v-row v-if="mostrarCatalogo" dense>
                    <v-col cols="12">
                        <v-autocomplete :value="productoSelId" :items="arrayProductos" item-text="nombre"
                            item-value="id" label="Buscar producto en catalogo" prepend-inner-icon="mdi-magnify"
                            outlined rounded filled color="primary" @change="$emit('select-catalogo', $event)" />
                    </v-col>
                </v-row>

                <v-divider v-if="mostrarCatalogo" class="mb-6"></v-divider>

                <v-alert v-if="mostrarCatalogo && !productoSelId" type="info" dense outlined>
                    Primero busca y selecciona un producto del store para cargar sus datos.
                </v-alert>

                <template v-if="!mostrarCatalogo || productoSelId">
                    <v-row dense>
                        <v-col cols="12" md="8">
                            <v-text-field label="Nombre del producto" :value="localValue.nombre"
                                prepend-inner-icon="mdi-tag-outline" outlined dense hide-details="auto"
                                @input="actualizarCampo('nombre', $event)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field label="Precio Venta" :value="localValue.precio" type="number" :prefix="monedaSimbolo"
                                prepend-inner-icon="mdi-cash-register" outlined dense hide-details="auto"
                                class="font-weight-bold" @input="actualizarNumero('precio', $event)" />
                        </v-col>
                    </v-row>

                    <v-row dense class="mt-2">
                        <v-col cols="12" md="4">
                            <v-autocomplete label="Marca" :value="localValue.marca" :items="arrayMarca" outlined dense
                                hide-details="auto" @input="actualizarCampo('marca', $event)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-autocomplete label="Categoria" :value="localValue.categoria" :items="arrayCategoria"
                                outlined dense hide-details="auto" @input="actualizarCampo('categoria', $event)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-autocomplete label="Unidad Medida" :value="localValue.medida" :items="itemsMedidasNombre"
                                outlined dense hide-details="auto" @input="actualizarCampo('medida', $event)" />
                        </v-col>
                    </v-row>

                    <v-row dense class="mt-2">
                        <v-col cols="12" md="4">
                            <v-autocomplete label="Operación" :value="localValue.operacion" :items="arrayOperacion"
                                outlined dense hide-details="auto" @input="actualizarCampo('operacion', $event)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field label="Peso (kg)" :value="localValue.peso" type="number" step="0.01"
                                prepend-inner-icon="mdi-weight-kilogram" outlined dense hide-details="auto"
                                @input="actualizarNumero('peso', $event)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field label="Factor" :value="localValue.factor" type="number" step="0.01"
                                prepend-inner-icon="mdi-multiplication" outlined dense hide-details="auto"
                                @input="actualizarNumero('factor', $event)" />
                        </v-col>
                    </v-row>

                    <v-row dense class="mt-4">
                        <v-col cols="12" md="6">
                            <v-card outlined class="pa-2">
                                <div class="text-caption mb-1">Mayoreo Nivel 1</div>
                                <v-row dense>
                                    <v-col>
                                        <v-text-field label="Precio" :value="localValue.precio_may1" type="number" :prefix="monedaSimbolo"
                                            outlined dense hide-details
                                            @input="actualizarNumero('precio_may1', $event)" />
                                    </v-col>
                                    <v-col>
                                        <v-text-field label="Cant. Min" :value="localValue.escala_may1" type="number"
                                            outlined dense hide-details
                                            @input="actualizarNumero('escala_may1', $event)" />
                                    </v-col>
                                </v-row>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-card outlined class="pa-2">
                                <div class="text-caption mb-1">Mayoreo Nivel 2</div>
                                <v-row dense>
                                    <v-col>
                                        <v-text-field label="Precio" :value="localValue.precio_may2" type="number" :prefix="monedaSimbolo"
                                            outlined dense hide-details
                                            @input="actualizarNumero('precio_may2', $event)" />
                                    </v-col>
                                    <v-col>
                                        <v-text-field label="Cant. Min" :value="localValue.escala_may2" type="number"
                                            outlined dense hide-details
                                            @input="actualizarNumero('escala_may2', $event)" />
                                    </v-col>
                                </v-row>
                            </v-card>
                        </v-col>
                    </v-row>

                    <v-divider class="my-4"></v-divider>

                    <v-row dense align="center">
                        <v-col cols="6" sm="3">
                            <v-switch :input-value="localValue.activo" label="Activo" color="success" inset dense
                                hide-details @change="actualizarBooleano('activo', $event)" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-switch :input-value="localValue.controstock" label="Stock" color="primary" inset dense
                                hide-details @change="actualizarBooleano('controstock', $event)" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-switch :input-value="localValue.nuevo_ingreso" label="Nuevo ingreso" color="warning"
                                inset dense hide-details @change="actualizarBooleano('nuevo_ingreso', $event)" />
                        </v-col>
                    </v-row>
                </template>
            </v-container>
        </template>
    </div>
</template>

<script>
import draggable from "vuedraggable"

export default {
    name: "TiendaDialogoProductos",
    components: { draggable },
    props: {
        modo: {
            type: String,
            default: "form",
        },
        value: {
            type: Object,
            default: () => ({}),
        },
        items: {
            type: Array,
            default: () => [],
        },
        placeholderImg: {
            type: String,
            default: "",
        },
        arrayProductos: {
            type: Array,
            default: () => [],
        },
        arrayMarca: {
            type: Array,
            default: () => [],
        },
        arrayCategoria: {
            type: Array,
            default: () => [],
        },
        itemsMedidasNombre: {
            type: Array,
            default: () => [],
        },
        arraytipoProducto: {
            type: Array,
            default: () => [],
        },
        arrayOperacion: {
            type: Array,
            default: () => [],
        },
        productoSelId: {
            type: [String, Number],
            default: null,
        },
        mostrarCatalogo: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            localItems: [],
            busqueda: "",
        }
    },
    computed: {
        localValue() {
            return this.value || {}
        },
        itemsFiltrados() {
            const termino = String(this.busqueda || "").trim().toLowerCase()
            if (!termino) return this.localItems

            return (this.localItems || []).filter(item => this.coincideBusqueda(item, termino))
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
        },
    },
    watch: {
        items: {
            immediate: true,
            deep: true,
            handler(value) {
                this.localItems = Array.isArray(value) ? [...value] : []
            },
        },
    },
    methods: {
        emitir(payload) {
            this.$emit("input", {
                ...this.localValue,
                ...payload,
            })
        },
        actualizarCampo(campo, valor) {
            this.emitir({ [campo]: valor || "" })
        },
        actualizarNumero(campo, valor) {
            this.emitir({ [campo]: Number(valor || 0) })
        },
        actualizarBooleano(campo, valor) {
            this.emitir({ [campo]: !!valor })
        },
        abrirSelector(id) {
            const input = this.$refs[`file_${id}`]
            const el = Array.isArray(input) ? input[0] : input
            if (el) el.click()
        },
        seleccionarFoto(event, id) {
            const file = event.target.files?.[0]
            if (file) this.$emit("select-image", { file, id })
            event.target.value = ""
        },
        normalizarImagenes(item) {
            if (Array.isArray(item?.imagenes) && item.imagenes.length) return item.imagenes
            if (item?.fotoUrl || item?.thumbB64 || item?.rutaStorage) {
                return [{
                    fotoUrl: item.fotoUrl || "",
                    thumbB64: item.thumbB64 || "",
                    rutaStorage: item.rutaStorage || "",
                }]
            }
            return []
        },
        principalFoto(item) {
            return this.normalizarImagenes(item)[0]?.fotoUrl || this.placeholderImg
        },
        principalThumb(item) {
            return this.normalizarImagenes(item)[0]?.thumbB64 || this.principalFoto(item)
        },
        coincideBusqueda(item, termino) {
            const campos = [
                item?.nombre,
                item?.id,
                item?.idCatalogo,
                item?.codbarra,
                item?.codigo,
            ]

            return campos.some(valor => String(valor || "").toLowerCase().includes(termino))
        },
        emitirReorden() {
            this.$emit("reordenar", [...this.localItems])
        },
    },
}
</script>
