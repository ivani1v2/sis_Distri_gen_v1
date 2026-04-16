<template>
    <div>
        <template v-if="modo === 'tab'">
            <v-card flat color="transparent">
                <v-card-title class="px-0 pb-4 d-flex align-center">
                    <div class="text-h5 font-weight-black">Marcas</div>
                    <v-spacer />
                    <v-btn color="primary" rounded depressed @click="$emit('agregar')">
                        <v-icon left>mdi-plus</v-icon> Nueva Marca
                    </v-btn>
                </v-card-title>

                <v-alert v-if="!localItems.length" type="info" dense text>
                    No hay marcas registradas.
                </v-alert>

                <draggable v-model="localItems" :animation="200" handle=".drag-handle" @end="emitirReorden"
                    tag="div" class="d-flex flex-wrap">
                    <div v-for="(item, index) in localItems" :key="item.id" class="pa-2" style="width: 200px;">
                        <v-card class="rounded-xl overflow-hidden" outlined>
                            <v-hover v-slot="{ hover }">
                                <div style="position: relative;">
                                    <v-img :src="item.fotoUrl || placeholderImg"
                                        :lazy-src="item.thumbB64 || placeholderImg" height="180"
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
                            </v-card-text>

                            <input :ref="'file_' + item.id" type="file" accept="image/*" style="display:none"
                                @change="seleccionarFoto($event, item.id)" />
                        </v-card>
                    </div>
                </draggable>
            </v-card>
        </template>

        <v-autocomplete v-else :value="localValue.nombre" :items="items" label="Marca" outlined rounded dense
            clearable hide-details @input="actualizarNombre" />
    </div>
</template>

<script>
import draggable from "vuedraggable"

export default {
    name: "TiendaDialogoMarca",
    components: { draggable },
    props: {
        modo: {
            type: String,
            default: "form",
        },
        value: {
            type: Object,
            default: () => ({ nombre: "" }),
        },
        items: {
            type: Array,
            default: () => [],
        },
        placeholderImg: {
            type: String,
            default: "",
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
            }
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
        actualizarNombre(nombre) {
            this.$emit("input", { nombre: nombre || "" })
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
        emitirReorden() {
            this.$emit("reordenar", [...this.localItems])
        },
    },
}
</script>
