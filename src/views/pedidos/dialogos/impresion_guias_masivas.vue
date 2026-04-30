<template>
    <v-dialog v-model="dialog" max-width="500px" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="teal darken-1" dark dense>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title class="subtitle-1">Impresión Masiva de Guías</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn v-if="!isMobile" x-small color="orange" dark @click="dial_config_host = true">
                    Config
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <template v-if="!imprimiendo">
                    <v-btn-toggle v-model="modo_impresion_guia" mandatory class="mb-4 d-flex justify-center" rounded>
                        <v-btn value="abre" small :color="modo_impresion_guia === 'abre' ? 'teal' : ''"
                            :class="modo_impresion_guia === 'abre' ? 'white--text' : ''">
                            <v-icon left small>mdi-printer</v-icon> Imprimir
                        </v-btn>
                        <v-btn value="descarga" small :color="modo_impresion_guia === 'descarga' ? 'teal' : ''"
                            :class="modo_impresion_guia === 'descarga' ? 'white--text' : ''">
                            <v-icon left small>mdi-download</v-icon> Descargar
                        </v-btn>
                        <v-btn value="unido" small :color="modo_impresion_guia === 'unido' ? 'purple' : ''"
                            :class="modo_impresion_guia === 'unido' ? 'white--text' : ''">
                            <v-icon left small>mdi-file-pdf-box</v-icon> Unir Todo
                        </v-btn>
                    </v-btn-toggle>

                    <v-row justify="center" class="mb-1" v-if="modo_impresion_guia !== 'unido'">
                        <v-col cols="8" sm="6" md="5">
                            <v-text-field v-model.number="copias_guia" label="Copias" type="number" min="1" max="10"
                                dense outlined hide-details prepend-inner-icon="mdi-content-copy"
                                background-color="grey lighten-4" class="rounded-lg">
                                <template v-slot:append>
                                    <v-btn icon small @click="copias_guia = Math.min(copias_guia + 1, 10)">
                                        <v-icon small>mdi-plus</v-icon>
                                    </v-btn>
                                    <v-btn icon small @click="copias_guia = Math.max(copias_guia - 1, 1)">
                                        <v-icon small>mdi-minus</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>

                    <p class="text-subtitle-2 text-center mb-3">
                        Imprimir <strong>{{ guiasSeleccionadas }}</strong> guía(s) de remisión
                    </p>
                    <v-row dense>
                        <v-col cols="6">
                            <v-card @click.prevent="imprimirGuiasFormato('A4')" class="hover-card" outlined>
                                <v-container class="text-center">
                                    <v-icon size="35" color="red">mdi-file-pdf-box</v-icon>
                                    <h5 class="pa-1">PDF A4</h5>
                                </v-container>
                            </v-card>
                        </v-col>
                        <v-col cols="6">
                            <v-card @click.prevent="imprimirGuiasFormato('80')" class="hover-card" outlined>
                                <v-container class="text-center">
                                    <v-icon size="35" color="red">mdi-printer-pos</v-icon>
                                    <h5 class="pa-1">Ticket 80mm</h5>
                                </v-container>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>
                <template v-else>
                    <div class="text-center">
                        <v-icon color="teal" size="40" class="mb-2">mdi-printer</v-icon>
                        <h5 class="text-subtitle-1 font-weight-bold mb-1">
                            {{ modo_impresion_guia === 'descarga' ? 'Descargando guías...' : 'Imprimiendo guías...' }}
                        </h5>
                        <div class="caption mb-2">Formato: {{ formatoGuiaActual === 'A4' ? 'PDF A4' : 'Ticket 80mm' }}
                        </div>
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
        <impresorahost v-if="dial_config_host" @cierra="dial_config_host = false" />
    </v-dialog>
</template>

<script>
import { buscaGuiaremision } from '../../../db'
import { generaGuia } from '../../../pdf_guia'
import impresorahost from '../../../components/configEmpresa/impresorahost.vue'
import {
    abrir_bridge_impresion,
    impresion_bridge,
    cerrar_bridge_impresion,
    ep
} from '../../funciones/impresion_bridge'
import store from '@/store/index'

export default {
    name: 'ImpresionGuiasMasivas',
    components: {
        impresorahost
    },
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
            printGuiaError: '',
            dial_config_host: false,
            modo_impresion_guia: 'abre',
            copias_guia: 1,
        }
    },
    computed: {
        isMobile() {
            return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
        },
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
            if (this.modo_impresion_guia === 'unido') {
                return this.imprimirGuiasUnidas(formato);
            }
            this.formatoGuiaActual = formato;
            this.imprimiendo = true;
            await new Promise(resolve => setTimeout(resolve, 300));

            await this.imprimir_guias_masivo(formato);
        },
        async imprimir_guias_masivo(formato) {
            const seleccionados = this.guiasPendientes;
            const usaBridge = ep(this.modo_impresion_guia);

            if (seleccionados.length === 0) return;

            this.printGuiaTotal = seleccionados.length;
            this.printGuiaDone = 0;
            this.printGuiaError = '';

            try {
                if (usaBridge) {
                    await abrir_bridge_impresion();
                }

                for (let i = 0; i < seleccionados.length; i++) {
                    try {
                        const item = seleccionados[i];
                        const snapshot = await buscaGuiaremision(item.guia_id).once("value");

                        if (!snapshot.exists()) {
                            throw new Error('No se encontró la guía');
                        }

                        const datosGuia = snapshot.val();

                        if (this.modo_impresion_guia === 'descarga') {
                            for (let c = 1; c <= this.copias_guia; c++) {
                                if (c > 1) {
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                }

                                const datosGuiaConCopia = {
                                    ...datosGuia,
                                    numero_copia: c,
                                    total_copias: this.copias_guia
                                };

                                await generaGuia(datosGuiaConCopia, formato, this.modo_impresion_guia, 1);
                            }
                        } else {
                            const resp = await generaGuia(
                                datosGuia,
                                formato,
                                this.modo_impresion_guia,
                                this.copias_guia
                            );

                            if (usaBridge && resp instanceof ArrayBuffer) {
                                await impresion_bridge(
                                    resp,
                                    this.copias_guia || 1,
                                    `${item.guia_id || item.numeracion || Date.now()}-${i}`,
                                    i === seleccionados.length - 1
                                );
                            }
                        }

                        this.printGuiaDone = i + 1;
                        await new Promise(resolve => setTimeout(resolve, 50));
                    } catch (e) {
                        console.error('Error imprimiendo guía:', e);
                        this.printGuiaError = `Error en guía ${i + 1}: ${e.message}`;

                        const continuar = confirm(`Error en guía ${i + 1}. ¿Continuar con las siguientes?`);
                        if (!continuar) break;
                    }
                }

                const mensaje = this.modo_impresion_guia === 'descarga'
                    ? `${this.printGuiaDone} guía(s) descargada(s) en formato ${formato === 'A4' ? 'PDF A4' : 'Ticket 80mm'} con ${this.copias_guia} copia(s) cada una.`
                    : `${this.printGuiaDone} guía(s) impresa(s) en formato ${formato === 'A4' ? 'PDF A4' : 'Ticket 80mm'} con ${this.copias_guia} copia(s) cada una.`;

                store.commit('dialogosnackbar', mensaje);
                this.$emit('update:impresion-completada', true);

                setTimeout(() => {
                    this.cerrar();
                }, 1500);
            } finally {
                if (usaBridge) {
                    await cerrar_bridge_impresion();
                }
                this.imprimiendo = false;
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
            this.modo_impresion_guia = 'abre';
            this.copias_guia = 1;
        },
        async imprimirGuiasUnidas(formato) {
            if (!this.guiasPendientes.length) {
                store.commit('dialogosnackbar', 'No hay guías seleccionadas.');
                return;
            }

            this.imprimiendo = true;
            this.printGuiaTotal = this.guiasPendientes.length;
            this.printGuiaDone = 0;

            try {
                const guias = [];

                for (let i = 0; i < this.guiasPendientes.length; i++) {
                    const item = this.guiasPendientes[i];
                    const snapshot = await buscaGuiaremision(item.guia_id).once("value");

                    if (!snapshot.exists()) {
                        throw new Error(`No se encontró la guía ${item.numeracion}`);
                    }

                    const datosGuia = snapshot.val();
                    guias.push(datosGuia);
                    this.printGuiaDone = i + 1;
                }

                const { pdfGeneraGuiaUnido } = await import('../../../pdf_guia');
                await pdfGeneraGuiaUnido(guias, formato, 'descarga');

                store.commit('dialogosnackbar', `${guias.length} guías unificadas en un solo PDF`);

                setTimeout(() => {
                    this.cerrar();
                }, 1500);
            } catch (error) {
                console.error('Error uniendo guías:', error);
                this.printGuiaError = `Error: ${error.message}`;
                store.commit('dialogosnackbar', 'Error al unir guías: ' + error.message);
            } finally {
                this.imprimiendo = false;
            }
        },
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