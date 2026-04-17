<template>
    <div>
        <template v-if="modo === 'tab'">
            <v-card flat color="transparent">
                <v-card-title class="px-0 pb-4 d-flex align-center">
                    <div class="text-h5 font-weight-black">Promociones</div>
                    <v-spacer />
                    <v-btn color="primary" rounded depressed @click="$emit('agregar')">
                        <v-icon left>mdi-plus</v-icon> Nueva Promocion
                    </v-btn>
                </v-card-title>

                <v-alert v-if="!localItems.length" type="info" dense text>
                    No hay promociones registradas.
                </v-alert>

                <draggable v-model="localItems" :animation="200" handle=".drag-handle" @end="emitirReorden"
                    tag="div" class="d-flex flex-wrap">
                    <div v-for="(item, index) in localItems" :key="item.id" class="pa-2" style="width: 240px;">
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
                                    {{ cantidadCodigos(item) }} productos
                                </div>
                                <div class="text-caption grey--text text-truncate">
                                    {{ resumenMarcas(item) }}
                                </div>
                            </v-card-text>

                            <input :ref="'file_' + item.id" type="file" accept="image/*" style="display:none"
                                @change="seleccionarFoto($event, item.id)" />
                        </v-card>
                    </div>
                </draggable>
            </v-card>
        </template>

        <v-container v-else fluid class="pa-0">
            <v-row dense>
                <v-col cols="12">
                    <v-text-field :value="localValue.nombre" label="Nombre de la promocion"
                        prepend-inner-icon="mdi-sale" outlined dense hide-details="auto"
                        @input="actualizarCampo('nombre', $event)" />
                </v-col>
            </v-row>

            <v-row dense class="mt-2">
                <v-col cols="12">
                    <v-autocomplete :value="localValue.codigosProductos" :items="productosAutocomplete"
                        item-text="autocompleteLabel" item-value="autocompleteId" label="Productos de la promocion"
                        prepend-inner-icon="mdi-barcode" multiple chips deletable-chips outlined dense hide-details="auto"
                        @change="actualizarCodigos($event)">
                        <template #selection="{ item, index }">
                            <v-chip v-if="index < 3" small class="ma-1" close @click:close="quitarCodigo(codigoItem(item))">
                                {{ codigoItem(item) }}
                            </v-chip>
                            <span v-else-if="index === 3" class="grey--text text-caption">
                                +{{ localValue.codigosProductos.length - 3 }} mas
                            </span>
                        </template>
                    </v-autocomplete>
                </v-col>
            </v-row>

            <v-row dense class="mt-2">
                <v-col cols="12">
                    <v-autocomplete :value="localValue.marcasRelacionadas" :items="arrayMarca"
                        label="Marcas relacionadas" prepend-inner-icon="mdi-tag-multiple" multiple chips
                        deletable-chips outlined dense hide-details="auto" @change="actualizarMarcas($event)" />
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
import draggable from "vuedraggable"

export default {
    name: "TiendaDialogoPromociones",
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
    },
    data() {
        return {
            localItems: [],
        }
    },
    computed: {
        localValue() {
            return {
                nombre: this.value?.nombre || "",
                codigosProductos: Array.isArray(this.value?.codigosProductos)
                    ? this.value.codigosProductos.map(item => String(item))
                    : [],
                marcasRelacionadas: Array.isArray(this.value?.marcasRelacionadas) ? [...this.value.marcasRelacionadas] : [],
            }
        },
        productosAutocomplete() {
            return (Array.isArray(this.arrayProductos) ? this.arrayProductos : [])
                .map(item => {
                    const autocompleteId = this.codigoItem(item)
                    return {
                        ...item,
                        autocompleteId,
                        autocompleteLabel: item?.nombre
                            ? `${item.nombre} (${autocompleteId})`
                            : autocompleteId,
                    }
                })
                .filter(item => item.autocompleteId)
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
        actualizarCampo(campo, valor) {
            this.$emit("input", {
                ...this.localValue,
                [campo]: valor || "",
            })
        },
        actualizarCodigos(valor) {
            this.$emit("input", {
                ...this.localValue,
                codigosProductos: Array.isArray(valor) ? valor.map(item => String(item)) : [],
            })
        },
        actualizarMarcas(valor) {
            this.$emit("input", {
                ...this.localValue,
                marcasRelacionadas: Array.isArray(valor) ? valor.filter(Boolean) : [],
            })
        },
        quitarCodigo(id) {
            this.actualizarCodigos(
                (this.localValue.codigosProductos || []).filter(item => String(item) !== String(id))
            )
        },
        codigoItem(item) {
            return String(item?.autocompleteId || item?.id || item?.value || item || "")
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
        cantidadCodigos(item) {
            return Array.isArray(item?.codigosProductos) ? item.codigosProductos.length : 0
        },
        resumenMarcas(item) {
            const marcas = Array.isArray(item?.marcasRelacionadas) ? item.marcasRelacionadas : []
            return marcas.length ? marcas.join(", ") : "Sin marcas relacionadas"
        },
        emitirReorden() {
            this.$emit("reordenar", [...this.localItems])
        },
    },
}
</script>
