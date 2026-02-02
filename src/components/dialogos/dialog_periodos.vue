<template>
    <v-dialog v-model="dialog" max-width="550px" hidden persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="#039BE5" dense dark>
                <v-toolbar-title>Gestión de Períodos</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text class="pa-4">
                <v-row dense class="mb-4">
                    <v-col cols="12">
                        <v-select v-model="anioSeleccionado" :items="listaAnios" label="Seleccionar Año" outlined dense
                            hide-details prepend-inner-icon="mdi-calendar" @change="cargarPeriodos"></v-select>
                    </v-col>
                </v-row>
                <v-card outlined class="rounded-lg">
                    <v-list dense>
                        <v-list-item v-for="(mes, index) in mesesDisponibles" :key="index" :class="{
                            'grey lighten-4': !mes.disponible,
                            'ultimo-cerrado-item': mes.key === ultimoCerradoKey,
                            'periodo-activo-item': mes.key === periodoActivo?.key
                        }">
                            <v-list-item-icon>
                                <v-icon :color="getIconColor(mes)">
                                    {{ mes.estado === 'open' ? 'mdi-lock-open-variant' : 'mdi-lock' }}
                                </v-icon>
                            </v-list-item-icon>

                            <v-list-item-content>
                                <v-list-item-title class="font-weight-medium">
                                    {{ mes.nombre }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <v-chip x-small :color="mes.estado === 'open' ? 'success' : 'error'" dark>
                                        {{ mes.estado === 'open' ? 'ABIERTO' : 'CERRADO' }}
                                    </v-chip>
                                    <span v-if="!mes.disponible" class="ml-2 caption grey--text">
                                        (No disponible)
                                    </span>
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action>
                                <v-tooltip bottom :disabled="!getTooltipMensaje(mes)">
                                    <template v-slot:activator="{ on, attrs }">
                                        <div v-bind="attrs" v-on="on">
                                            <v-switch v-model="mes.abierto"
                                                :disabled="!mes.disponible || loading || !puedeModificar(mes)"
                                                color="success" hide-details dense
                                                @change="confirmarCambio(mes)"></v-switch>
                                        </div>
                                    </template>
                                    <span>{{ getTooltipMensaje(mes) }}</span>
                                </v-tooltip>
                            </v-list-item-action>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-card-text>
        </v-card>

        <v-dialog v-model="dialogConfirm" max-width="400px" persistent>
            <v-card class="rounded-lg elevation-3">
                <v-toolbar :color="accionConfirm === 'ABRIR' ? '#4CAF50' : '#F44336'" dense dark flat>
                    <v-toolbar-title class="font-weight-medium">
                        Confirmar Acción
                    </v-toolbar-title>
                </v-toolbar>

                <v-card-text class="pa-4">
                    <div class="text-center mb-4">
                        <div class="icon-container" :class="accionConfirm === 'ABRIR' ? 'success-icon' : 'error-icon'">
                            <v-icon x-large :color="accionConfirm === 'ABRIR' ? '#4CAF50' : '#F44336'">
                                {{ accionConfirm === 'ABRIR' ? 'mdi-lock-open-variant' : 'mdi-lock' }}
                            </v-icon>
                        </div>
                        <p class="mt-3 mb-1 subtitle-1 font-weight-medium">
                            {{ accionConfirm === 'ABRIR' ? 'Abrir Período' : 'Cerrar Período' }}
                        </p>
                        <p class="body-2 text--secondary">
                            {{ mesConfirm?.nombre }} {{ anioSeleccionado }}
                        </p>
                    </div>

                    <v-divider class="my-3"></v-divider>

                    <p class="body-2 mb-3">
                        <strong>Se ejecutarán las siguientes acciones:</strong>
                    </p>

                    <v-list dense class="mb-3 pasos-lista">
                        <v-list-item v-for="(step, i) in pasosConfirm" :key="i" class="px-0">
                            <v-list-item-icon class="mr-3">
                                <div class="paso-icon" :class="getPasoIconClass(step)">
                                    <v-icon small>{{ step.icon }}</v-icon>
                                </div>
                            </v-list-item-icon>
                            <v-list-item-content class="py-1">
                                <span :class="getPasoTextClass(step)">{{ step.text }}</span>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>

                    <div v-if="esAperturaRetroactiva" class="alerta-retroactiva mb-3">
                        <v-icon small color="#FF9800" class="mr-1">mdi-alert</v-icon>
                        <span class="caption">
                            <strong>Atención:</strong> Está abriendo un período anterior.
                        </span>
                    </div>

                    <div v-if="accionConfirm === 'CERRAR'" class="info-cierre-backend mb-3">
                        <v-icon small color="#2196F3" class="mr-1">mdi-information</v-icon>
                        <span class="caption">
                            Se ejecutará el proceso de cierre en el servidor.
                        </span>
                    </div>
                </v-card-text>

                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="#9E9E9E" text @click="cancelarCambio" :disabled="loading" class="px-3">
                        Cancelar
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn :color="accionConfirm === 'ABRIR' ? '#4CAF50' : '#F44336'" @click="ejecutarCambio"
                        :loading="loading" :disabled="pasosConfirm.length === 0" depressed
                        class="px-4 font-weight-medium">
                        <v-icon left>mdi-check</v-icon>
                        {{ accionConfirm === 'ABRIR' ? 'Abrir' : 'Cerrar' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" top rounded="pill">
            <div class="d-flex align-center">
                <v-icon class="mr-2">{{ snackbarIcon }}</v-icon>
                <span class="body-2">{{ snackbarText }}</span>
            </div>
            <template v-slot:action="{ attrs }">
                <v-btn icon small v-bind="attrs" @click="snackbar = false" class="ml-2">
                    <v-icon small>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
    </v-dialog>
</template>

<script>
import { all_periodos, nuevo_periodo_k } from '@/db';
import moment from 'moment';
import axios from 'axios';
import store from '@/store/index';

export default {
    name: 'DialogPeriodos',
    props: {
        value: Boolean,
        default: false
    },
    data() {
        const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        return {
            dialog: this.value,
            dialogConfirm: false,
            loading: false,
            anioSeleccionado: moment().year(),
            periodosBD: {},
            mesConfirm: null,
            pasosConfirm: [],
            esAperturaRetroactiva: false,
            nombresMeses,
            snackbar: false,
            snackbarText: '',
            snackbarColor: 'success'
        };
    },
    computed: {
        listaAnios() {
            const anioActual = moment().year();
            return Array.from({ length: anioActual - 2021 }, (_, i) => anioActual - i);
        },

        mesesDisponibles() {
            const anioActual = moment().year();
            const mesActual = moment().month();

            return this.nombresMeses.map((nombre, index) => {
                const mesNum = (index + 1).toString().padStart(2, '0');
                const periodoKey = `${this.anioSeleccionado}-${mesNum}`;
                const periodoBD = this.periodosBD[periodoKey];
                const estado = periodoBD?.estado || 'open';

                const disponible = this.esMesDisponible(index, anioActual, mesActual, periodoBD);
                
                return {
                    index,
                    numero: mesNum,
                    nombre,
                    key: periodoKey,
                    estado,
                    abierto: estado === 'open',
                    disponible
                };
            });
        },

        accionConfirm() {
            return this.mesConfirm?.abierto ? 'ABRIR' : 'CERRAR';
        },

        periodoActivo() {
            const meses = this.mesesDisponibles.filter(m => m.disponible);
            return meses.reverse().find(m => m.estado === 'open') || null;
        },

        ultimoCerradoKey() {
            const meses = this.mesesDisponibles.filter(m => m.disponible);
            return meses.reverse().find(m => m.estado === 'close')?.key || null;
        },

        snackbarIcon() {
            return this.snackbarColor === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle';
        }
    },
    watch: {
        value(val) {
            this.dialog = val;
            if (val) {
                this.anioSeleccionado = moment().year();
                this.cargarPeriodos();
            }
        },
        dialog(val) {
            this.$emit('input', val);
        }
    },
    mounted() {
        if (this.dialog) this.cargarPeriodos();
    },
    methods: {
        getPasoIconClass(paso) {
            const iconos = {
                'mdi-lock': 'paso-icon-error',
                'mdi-lock-open-variant': 'paso-icon-success',
                'mdi-alert': 'paso-icon-warning'
            };
            return iconos[paso.icon] || 'paso-icon-info';
        },

        getPasoTextClass(paso) {
            const clases = {
                'error--text': 'paso-text-error',
                'success--text': 'paso-text-success',
                'warning--text': 'paso-text-warning'
            };
            
            for (const [key, value] of Object.entries(clases)) {
                if (paso.class?.includes(key)) return value;
            }
            return 'paso-text-info';
        },

        esMesDisponible(index, anioActual, mesActual, periodoBD) {
            if (periodoBD) return true;
            if (this.anioSeleccionado === anioActual) return index <= mesActual;
            return this.anioSeleccionado < anioActual;
        },

        async cargarPeriodos() {
            try {
                const snapshot = await all_periodos().once('value');
                this.periodosBD = snapshot.val() || {};
            } catch (error) {
                console.error('Error al cargar períodos:', error);
                this.mostrarMensaje('Error al cargar períodos', 'error');
            }
        },

        getIconColor(mes) {
            if (!mes.disponible) return 'grey';
            return mes.estado === 'open' ? '#4CAF50' : '#F44336';
        },

        getPeriodoAnterior(mes) {
            const [anio, mesNum] = mes.key.split('-').map(Number);
            return mesNum === 1 ? `${anio - 1}-12` : `${anio}-${String(mesNum - 1).padStart(2, '0')}`;
        },

        getPeriodoSiguiente(mes) {
            const [anio, mesNum] = mes.key.split('-').map(Number);
            return mesNum === 12 ? `${anio + 1}-01` : `${anio}-${String(mesNum + 1).padStart(2, '0')}`;
        },

        puedeModificar(mes) {
            if (!mes.disponible) return false;
            if (mes.estado === 'open') return true;
            
            const periodoSiguiente = this.getPeriodoSiguiente(mes);
            const estadoSiguiente = this.periodosBD[periodoSiguiente]?.estado;
            
            if (estadoSiguiente === 'open') return true;
            if (!this.periodosBD[periodoSiguiente]) {
                const [anioSig, mesSig] = periodoSiguiente.split('-').map(Number);
                const anioActual = moment().year();
                const mesActual = moment().month() + 1;
                return anioSig > anioActual || (anioSig === anioActual && mesSig > mesActual);
            }
            
            return false;
        },

        getTooltipMensaje(mes) {
            if (!mes.disponible) return 'Período no disponible';
            if (!this.puedeModificar(mes) && mes.estado === 'close') {
                const periodoSig = this.getPeriodoSiguiente(mes);
                const [anio, mesNum] = periodoSig.split('-');
                const nombreMesSig = this.nombresMeses[parseInt(mesNum) - 1];
                return `Para abrir ${mes.nombre}, primero debe abrir ${nombreMesSig} ${anio}`;
            }
            return mes.estado === 'open' ? `Cerrar ${mes.nombre} activará el período siguiente` : 'Abrir período';
        },

        mostrarMensaje(texto, tipo = 'success') {
            this.snackbarText = texto;
            this.snackbarColor = tipo;
            this.snackbar = true;
        },

        confirmarCambio(mes) {
            this.mesConfirm = { ...mes };
            this.pasosConfirm = [];
            this.esAperturaRetroactiva = false;

            mes.abierto ? this.prepararPasosApertura(mes) : this.prepararPasosCierre(mes);
            this.dialogConfirm = true;
        },

        prepararPasosApertura(mes) {
            const periodoSiguiente = this.getPeriodoSiguiente(mes);
            const estadoSiguiente = this.periodosBD[periodoSiguiente]?.estado;
            const [anioSig, mesSig] = periodoSiguiente.split('-').map(Number);
            const nombreMesSig = this.nombresMeses[mesSig - 1];
            
            this.esAperturaRetroactiva = this.esAperturaRetroactivaDePeriodo(mes);

            if (estadoSiguiente === 'close') {
                this.agregarPasosAperturaConsecutiva(mes, periodoSiguiente, nombreMesSig, anioSig);
            } else {
                this.agregarPasoSimpleApertura(mes);
            }
        },

        esAperturaRetroactivaDePeriodo(mes) {
            const periodoActivo = this.periodoActivo;
            if (!periodoActivo) {
                const anioActual = moment().year();
                const mesActual = moment().month() + 1;
                const [anioMes, mesNum] = mes.key.split('-').map(Number);
                return anioMes < anioActual || (anioMes === anioActual && mesNum < mesActual);
            }

            const [anioActivo, mesActivo] = periodoActivo.key.split('-').map(Number);
            const [anioMes, mesNum] = mes.key.split('-').map(Number);
            return anioMes < anioActivo || (anioMes === anioActivo && mesNum < mesActivo);
        },

        agregarPasosAperturaConsecutiva(mes, periodoSiguiente, nombreMesSig, anioSig) {
            this.pasosConfirm.push({
                icon: 'mdi-lock-open-variant',
                text: `Abrir ${nombreMesSig} ${anioSig}`,
                class: 'font-weight-medium primary--text',
                accion: 'abrir',
                periodo: periodoSiguiente
            });

            this.pasosConfirm.push({
                icon: 'mdi-arrow-right',
                text: `Luego abrir ${mes.nombre} ${this.anioSeleccionado}`,
                class: 'font-weight-medium success--text',
                accion: 'abrir',
                periodo: mes.key
            });

            if (this.esAperturaRetroactiva) {
                this.pasosConfirm.push({
                    icon: 'mdi-alert',
                    text: `Después de hacer ajustes, deberá cerrar ${mes.nombre} y luego ${nombreMesSig}`,
                    class: 'caption warning--text'
                });
            }
        },

        agregarPasoSimpleApertura(mes) {
            this.pasosConfirm.push({
                icon: 'mdi-lock-open-variant',
                text: `Abrir ${mes.nombre} ${this.anioSeleccionado}`,
                class: 'font-weight-medium success--text',
                accion: 'abrir',
                periodo: mes.key
            });

            if (this.esAperturaRetroactiva) {
                this.pasosConfirm.push({
                    icon: 'mdi-alert',
                    text: `Después de hacer ajustes, deberá cerrar ${mes.nombre}`,
                    class: 'caption warning--text'
                });
            }
        },

        prepararPasosCierre(mes) {
            const periodoSiguiente = this.getPeriodoSiguiente(mes);
            const [anioSig, mesSig] = periodoSiguiente.split('-').map(Number);
            const nombreMesSig = this.nombresMeses[mesSig - 1];
            
            this.pasosConfirm.push({
                icon: 'mdi-lock',
                text: `Cerrar ${mes.nombre} ${this.anioSeleccionado}`,
                class: 'font-weight-medium error--text',
                accion: 'cerrar',
                periodo: mes.key,
                ejecutarCierre: true
            });
            
            this.pasosConfirm.push({
                icon: 'mdi-lock-open-variant',
                text: `Próximo período: ${nombreMesSig} ${anioSig}`,
                class: 'font-weight-medium success--text',
                accion: 'abrir',
                periodo: periodoSiguiente
            });
        },

        cancelarCambio() {
            this.dialogConfirm = false;
            this.mesConfirm = null;
            this.pasosConfirm = [];
            this.cargarPeriodos();
        },

        async ejecutarCambio() {
            if (!this.mesConfirm || this.pasosConfirm.length === 0) return;
            this.loading = true;

            try {
                const pasosAccion = this.pasosConfirm.filter(p => p.accion);
                
                for (const paso of pasosAccion) {
                    if (paso.accion === 'cerrar') {
                        await this.ejecutarCierrePeriodo(paso.periodo);
                    } else if (paso.accion === 'abrir') {
                        await this.cambiarEstadoPeriodo(paso.periodo, 'open');
                    }
                    await new Promise(resolve => setTimeout(resolve, 800));
                }

                await this.cargarPeriodos();
                this.$emit('periodo-actualizado', {
                    key: this.mesConfirm.key,
                    estado: this.mesConfirm.abierto ? 'open' : 'close'
                });

                this.mostrarMensaje('Operación completada exitosamente');
                this.dialogConfirm = false;
                this.mesConfirm = null;
                this.pasosConfirm = [];

            } catch (error) {
                console.error('Error en la operación:', error);
                this.mostrarMensaje('Error: ' + (error.message || error), 'error');
                await this.cargarPeriodos();
            } finally {
                this.loading = false;
            }
        },

        async cambiarEstadoPeriodo(periodoKey, estado) {
            const periodoData = {
                estado,
                actualizado: moment().unix(),
                usuario: store.state.usuario?.email || 'sistema'
            };

            await nuevo_periodo_k(periodoKey, periodoData);
            
            this.periodosBD[periodoKey] = {
                ...this.periodosBD[periodoKey],
                ...periodoData
            };
        },

        async ejecutarCierrePeriodo(periodoKey) {
            await this.cambiarEstadoPeriodo(periodoKey, 'close');

            const [anio, mes] = periodoKey.split('-');
            const periodoFormato = `${mes}-${anio}`;

            const data = {
                bd: store.state.baseDatos.bd,
                data: { periodo: periodoFormato },
                metodo: 'cierra_periodo'
            };

            try {
                const response = await axios.post('https://api-distribucion-6sfc6tum4a-rj.a.run.app', data, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });

                if (response.data.message !== 'OK') {
                    throw new Error(response.data.message || 'Error en el cierre del período');
                }

                if (response.data.data?.periodo_siguiente) {
                    const periodoSigKey = response.data.data.periodo_siguiente.split('-').reverse().join('-');
                    
                    if (!this.periodosBD[periodoSigKey]) {
                        await nuevo_periodo_k(periodoSigKey, {
                            estado: 'open',
                            actualizado: moment().unix(),
                            usuario: 'sistema',
                            creado_por_cierre: true
                        });
                    }
                }

                return response.data;
            } catch (error) {
                throw new Error(`Error al procesar el cierre: ${error.response?.data?.message || error.message}`);
            }
        },

        cerrar() {
            this.dialog = false;
            this.$emit('cerrar');
        }
    }
};
</script>

<style scoped>
.v-list-item {
    border-bottom: 1px solid #e0e0e0;
    transition: background-color 0.2s ease;
    position: relative;
}

.v-list-item:last-child {
    border-bottom: none;
}

.v-list-item:hover {
    background-color: #fafafa;
}

.periodo-activo-item {
    background-color: #f1f8ff !important;
    border-left: 3px solid #2196F3 !important;
    margin-left: -3px;
}

.ultimo-cerrado-item {
    background-color: #fff8e1 !important;
    border-left: 3px solid #FF9800 !important;
    margin-left: -3px;
}

.periodo-activo-item.ultimo-cerrado-item {
    border-left: 3px solid #4CAF50 !important;
    background: linear-gradient(90deg, #f1f8ff 50%, #fff8e1 50%) !important;
}

.icon-container {
    display: inline-flex;
    padding: 16px;
    border-radius: 50%;
}

.icon-container.success-icon {
    background-color: rgba(76, 175, 80, 0.1);
}

.icon-container.error-icon {
    background-color: rgba(244, 67, 54, 0.1);
}

.pasos-lista {
    background-color: #fafafa;
    border-radius: 6px;
    padding: 8px;
}

.paso-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
}

.paso-icon-success {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
}

.paso-icon-error {
    background-color: rgba(244, 67, 54, 0.1);
    color: #F44336;
}

.paso-icon-warning {
    background-color: rgba(255, 152, 0, 0.1);
    color: #FF9800;
}

.paso-icon-info {
    background-color: rgba(33, 150, 243, 0.1);
    color: #2196F3;
}

.paso-text-success {
    color: #2e7d32;
    font-weight: 500;
}

.paso-text-error {
    color: #c62828;
    font-weight: 500;
}

.paso-text-warning {
    color: #ef6c00;
    font-weight: 500;
}

.paso-text-info {
    color: #1565c0;
    font-weight: 500;
}

.alerta-retroactiva {
    display: flex;
    align-items: flex-start;
    padding: 10px 12px;
    background-color: #fff3e0;
    border-radius: 6px;
    border-left: 3px solid #FF9800;
}

.info-cierre-backend {
    display: flex;
    align-items: flex-start;
    padding: 10px 12px;
    background-color: #e3f2fd;
    border-radius: 6px;
    border-left: 3px solid #2196F3;
}

.v-snackbar {
    border-radius: 24px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.v-btn {
    text-transform: none;
    letter-spacing: normal;
}
</style>