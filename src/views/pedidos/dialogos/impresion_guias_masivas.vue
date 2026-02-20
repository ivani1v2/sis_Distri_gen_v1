<template>
    <v-dialog v-model="dialog" max-width="500px" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="teal darken-1" dark dense>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Impresión Masiva de Guías</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pa-4">
                <template v-if="!imprimiendo">
                    <p class="text-subtitle-2 text-center mb-3">
                        Imprimir <strong>{{ guiasSeleccionadas }}</strong> guía(s) de remisión
                    </p>
                    <v-row dense>
                        <v-col cols="6">
                            <v-card @click.prevent="imprimirGuiasFormato('A4')" class="hover-card" outlined>
                                <v-container class="text-center">
                                    <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                    <h5 class="pa-1">PDF A4</h5>
                                    <span class="caption grey--text">Formato carta</span>
                                </v-container>
                            </v-card>
                        </v-col>
                        <v-col cols="6">
                            <v-card @click.prevent="imprimirGuiasFormato('80')" class="hover-card" outlined>
                                <v-container class="text-center">
                                    <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                    <h5 class="pa-1">Ticket 80mm</h5>
                                    <span class="caption grey--text">Formato térmico</span>
                                </v-container>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>
                <template v-else>
                    <div class="text-center">
                        <v-icon color="teal" size="40" class="mb-2">mdi-printer</v-icon>
                        <h5 class="text-subtitle-1 font-weight-bold mb-1">Imprimiendo guías...</h5>
                        <div class="caption mb-2">Formato: {{ formatoGuiaActual === 'A4' ? 'PDF A4' : 'Ticket 80mm' }}</div>
                        <div class="caption mb-2">{{ printGuiaDone }} de {{ printGuiaTotal }}</div>
                        <v-progress-linear :value="printGuiaPercent" height="15" color="teal" rounded>
                            <template v-slot:default="{ value }">
                                <strong>{{ Math.ceil(value) }}%</strong>
                            </template>
                        </v-progress-linear>
                        <div v-if="printGuiaError" class="red--text text-caption mt-2">{{ printGuiaError }}</div>
                    </div>
                </template>
            </v-card-text>

            <v-card-actions class="justify-center pt-0 pb-3">
                <v-btn text color="grey" @click="cerrar" :disabled="imprimiendo && printGuiaDone < printGuiaTotal">
                    {{ imprimiendo ? 'Cerrar' : 'Cancelar' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { buscaGuiaremision } from '../../../db'
import { generaGuia } from '../../../pdf_guia'
import store from '@/store/index'

export default {
    name: 'ImpresionGuiasMasivas',
    props: {
        value: {
            type: Boolean,
            default: false
        },
        desserts: {
            type: Array,
            default: () => []
        },
        routerGrupo: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            dialog: this.value,
            formatoGuiaActual: 'A4',
            guiasPendientes: [],
            imprimiendo: false,
            printGuiaTotal: 0,
            printGuiaDone: 0,
            printGuiaError: ''
        }
    },
    computed: {
        guiasSeleccionadas() {
            return this.guiasPendientes.length;
        },
        printGuiaPercent() {
            return this.printGuiaTotal ? (this.printGuiaDone / this.printGuiaTotal) * 100 : 0;
        }
    },
    watch: {
        value(val) {
            this.dialog = val;
            if (val) {
                this.inicializarGuias();
            }
        },
        dialog(val) {
            this.$emit('input', val);
            if (!val) {
                this.resetState();
            }
        }
    },
    methods: {
        inicializarGuias() {
            const seleccionados = this.desserts.filter(d => d.consolida);

            if (seleccionados.length === 0) {
                store.commit('dialogosnackbar', 'Seleccione al menos un comprobante.');
                this.cerrar();
                return;
            }

            const validosParaImprimir = seleccionados.filter(d =>
                d.guia_id && d.estado !== 'ANULADO'
            );

            if (validosParaImprimir.length === 0) {
                store.commit('dialogosnackbar', 'Ninguno de los seleccionados tiene guía generada o están anulados.');
                this.cerrar();
                return;
            }

            if (validosParaImprimir.length < seleccionados.length) {
                store.commit('dialogosnackbar',
                    `Se imprimirán ${validosParaImprimir.length} de ${seleccionados.length} seleccionados (los que tienen guía)`
                );
            }

            this.guiasPendientes = validosParaImprimir;
        },
        async imprimirGuiasFormato(formato) {
            if (!this.guiasPendientes.length) return;

            this.formatoGuiaActual = formato;
            this.imprimiendo = true;
            await new Promise(resolve => setTimeout(resolve, 300));

            await this.imprimir_guias_masivo(formato);
        },
        async imprimir_guias_masivo(formato) {
            const seleccionados = this.guiasPendientes;

            if (seleccionados.length === 0) return;

            this.printGuiaTotal = seleccionados.length;
            this.printGuiaDone = 0;
            this.printGuiaError = '';

            await this.imprimir_guia_recursivo(seleccionados, 0, formato);
        },
        async imprimir_guia_recursivo(array, index, formato) {
            try {
                if (index < array.length) {
                    const item = array[index];

                    this.printGuiaDone = index;

                    const snapshot = await buscaGuiaremision(item.guia_id).once("value");

                    if (snapshot.exists()) {
                        const datosGuia = snapshot.val();
                        generaGuia(datosGuia, formato);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    await this.imprimir_guia_recursivo(array, index + 1, formato);
                } else {
                    this.printGuiaDone = array.length;
                    store.commit('dialogosnackbar',
                        `${array.length} guía(s) impresa(s) en formato ${formato === 'A4' ? 'PDF A4' : 'Ticket 80mm'}.`
                    );

                    this.$emit('update:impresion-completada', true);

                    setTimeout(() => {
                        this.cerrar();
                    }, 2000);
                }
            } catch (e) {
                console.error('Error imprimiendo guía:', e);
                this.printGuiaError = `Error en guía ${index + 1}: ${e.message}`;
                // Continuar con la siguiente
                await this.imprimir_guia_recursivo(array, index + 1, formato);
            }
        },
        cerrar() {
            this.dialog = false;
        },
        resetState() {
            this.guiasPendientes = [];
            this.imprimiendo = false;
            this.printGuiaTotal = 0;
            this.printGuiaDone = 0;
            this.printGuiaError = '';
        }
    }
}
</script>

<style scoped>
.hover-card {
    cursor: pointer;
    transition: all 0.2s ease;
}

.hover-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
