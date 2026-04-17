<template>
    <div>
        <template v-if="modo === 'tab'">
            <v-card flat color="transparent">
                <v-card-title class="px-0 pb-4 d-flex align-center">
                    <div class="text-h5 font-weight-black">Grupo Precio</div>
                    <v-spacer />
                    <v-btn color="primary" rounded depressed @click="$emit('agregar')">
                        <v-icon left>mdi-plus</v-icon> Nuevo Grupo
                    </v-btn>
                </v-card-title>

                <v-alert v-if="!localItems.length" type="info" dense text>
                    No hay grupos de precio registrados.
                </v-alert>

                <draggable v-else v-model="localItems" :animation="200" handle=".drag-handle" @end="emitirReorden"
                    tag="div">
                    <v-card v-for="(item, index) in localItems" :key="item.id" class="mb-3 rounded-lg" outlined>
                        <v-list-item three-line>
                            <v-list-item-content>
                                <div class="text-caption grey--text mb-1">
                                    #{{ item.orden || (index + 1) }}
                                </div>
                                <v-list-item-title class="font-weight-bold">
                                    {{ item.nombre || 'Grupo sin nombre' }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    Escalas: {{ Number(item.escala_may1 || 0) }} / {{ Number(item.escala_may2 || 0) }}
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    Codigos aceptados: {{ cantidadCodigos(item) }}
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action class="ml-2">
                                <v-btn icon small color="warning" @click="$emit('editar', item)">
                                    <v-icon small>mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn icon small color="red" @click="$emit('eliminar', item.id)">
                                    <v-icon small>mdi-delete</v-icon>
                                </v-btn>
                                <v-btn icon small class="drag-handle">
                                    <v-icon small color="grey darken-2">mdi-drag</v-icon>
                                </v-btn>
                            </v-list-item-action>
                        </v-list-item>
                    </v-card>
                </draggable>
            </v-card>
        </template>

        <v-container v-else fluid class="pa-0">
            <v-row dense>
                <v-col cols="12">
                    <v-text-field :value="localValue.nombre" label="Nombre del grupo"
                        prepend-inner-icon="mdi-format-title" outlined dense hide-details="auto"
                        @input="actualizarCampo('nombre', $event)" />
                </v-col>
            </v-row>

            <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                    <v-text-field :value="localValue.escala_may1" label="Escala mayoreo 1" type="number" outlined dense
                        hide-details="auto" @input="actualizarNumero('escala_may1', $event)" />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field :value="localValue.escala_may2" label="Escala mayoreo 2" type="number" outlined dense
                        hide-details="auto" @input="actualizarNumero('escala_may2', $event)" />
                </v-col>
            </v-row>

            <v-row dense class="mt-2">
                <v-col cols="12">
                    <v-autocomplete :value="localValue.codigosAceptados" :items="productosAutocomplete"
                        item-text="autocompleteLabel" item-value="autocompleteId" label="Codigos aceptados"
                        prepend-inner-icon="mdi-barcode" multiple chips deletable-chips outlined dense
                        hide-details="auto" @change="actualizarCodigos($event)">
                        <template #selection="{ item }">
                            <v-chip small class="ma-1" close @click:close="quitarCodigo(codigoItem(item))">
                                {{ codigoItem(item) }}
                            </v-chip>
                        </template>
                    </v-autocomplete>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
import draggable from "vuedraggable"

export default {
    name: "TiendaDialogoGrupoPrecio",
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
        arrayProductos: {
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
                escala_may1: Number(this.value?.escala_may1 || 0),
                escala_may2: Number(this.value?.escala_may2 || 0),
                codigosAceptados: Array.isArray(this.value?.codigosAceptados)
                    ? this.value.codigosAceptados.map(item => String(item))
                    : [],
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
        actualizarCodigos(valor) {
            this.emitir({
                codigosAceptados: Array.isArray(valor) ? valor.map(item => String(item)) : [],
            })
        },
        quitarCodigo(id) {
            this.actualizarCodigos(
                (this.localValue.codigosAceptados || []).filter(item => String(item) !== String(id))
            )
        },
        codigoItem(item) {
            return String(item?.autocompleteId || item?.id || item?.value || item || "")
        },
        cantidadCodigos(item) {
            return Array.isArray(item?.codigosAceptados) ? item.codigosAceptados.length : 0
        },
        emitirReorden() {
            this.$emit("reordenar", [...this.localItems])
        },
    },
}
</script>
