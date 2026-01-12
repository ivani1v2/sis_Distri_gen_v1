<template>
    <v-dialog :value="value" max-width="600px" persistent @input="$emit('input', $event)">
        <v-card class="rounded-lg">
            <v-toolbar :color="cuentas_pendientes.length > 0 ? 'red darken-2' : 'green'" dark dense>
                <v-icon left>{{ cuentas_pendientes.length > 0 ? 'mdi-alert-circle' : 'mdi-check-circle' }}</v-icon>
                <v-toolbar-title>
                    {{ cuentas_pendientes.length > 0 ? 'Deuda Pendiente' : 'Sin Deudas' }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <v-progress-linear v-if="cargando" indeterminate color="primary" class="mb-4" />
                <div class="mb-4">
                    <h5 class="font-weight-bold blue-grey--text text--darken-2">
                        <v-icon small left>mdi-account</v-icon>
                        {{ cliente?.nombre || 'Cliente' }}
                    </h5>
                </div>

                <template v-if="cuentas_pendientes.length > 0">
                    <v-alert type="warning" border="left" colored-border icon="mdi-cash-remove" class="mb-4">
                        <div class="">Deuda Total: <span class="red--text"> S/ {{ total_deuda }}</span></div>
                    </v-alert>

                    <div class="cuentas-lista">
                        <v-card v-for="(cuenta, idx) in cuentas_pendientes" :key="idx" 
                                outlined class="mb-2 pa-2" flat>
                            <div class="d-flex justify-space-between align-center">
                                <div>
                                    <div class="caption font-weight-medium">DOC: {{ cuenta.doc_ref }}</div>
                                    <v-chip x-small :color="esVencido(cuenta.fecha_vence) ? 'red' : 'orange'" dark class="mt-1"> Vence:
                                        {{ conviertefecha(cuenta.fecha_vence) }}
                                    </v-chip>
                                </div>
                                <div class="text-right">
                                    <div class="font-weight-bold red--text">
                                        {{ cuenta.moneda || 'S/' }}{{ parseFloat(cuenta.monto_pendiente || 0).toFixed(2) }}
                                    </div>
                                </div>
                            </div>
                        </v-card>
                    </div>
                </template>

                <template v-else-if="!cargando">
                    <v-alert type="success" border="left" colored-border icon="mdi-check-decagram">
                        <div>¿Desea continuar con el pedido?</div>
                    </v-alert>
                </template>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn v-if="cuentas_pendientes.length === 0 && accionPendiente" color="success" @click="continuar">
                    <v-icon left>mdi-check</v-icon>
                    Continuar
                </v-btn>
                <v-btn v-if="cuentas_pendientes.length > 0 && accionPendiente" color="error"  @click="continuar">
                    <v-icon left>mdi-alert</v-icon>
                    Continuar de todos modos
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment'
import { allcuentaxcobrar } from '../../../db'

export default {
    name: 'DialDeudasCliente',
    props: {
        value: {
            type: Boolean,
            default: false
        },
        cliente: {
            type: Object,
            default: null
        },
        accionPendiente: {
            type: String,
            default: null // 'vender', 'pre_venta' o null (solo consulta)
        }
    },
    data: () => ({
        cargando: false,
        cuentas_pendientes: [],
        total_deuda: 0,
        consultaEnProceso: false 
    }),
    watch: {
        value: {
            immediate: true,
            handler(nv, ov) {
                if (nv && !ov && this.cliente) {
                    this.consultarDeudas()
                }
                if (!nv) {
                    this.cuentas_pendientes = []
                    this.total_deuda = 0
                }
            }
        }
    },
    methods: {
        async consultarDeudas() {
            if (this.consultaEnProceso) return
            this.consultaEnProceso = true
            
            this.cargando = true
            this.cuentas_pendientes = []
            this.total_deuda = 0

            try {
                const documento = String(this.cliente?.documento || this.cliente?.id || '').trim()
                if (!documento) {
                    this.cargando = false
                    this.consultaEnProceso = false
                    return
                }

                const snap = await allcuentaxcobrar()
                    .orderByChild('documento')
                    .equalTo(documento)
                    .once('value')

                if (snap.exists()) {
                    snap.forEach(item => {
                        const data = item.val()
                        if (data.estado === 'PENDIENTE') {
                            this.cuentas_pendientes.push({
                                ...data,
                                key: item.key
                            })
                            this.total_deuda += parseFloat(data.monto_pendiente || 0)
                        }
                    })
                }
            } catch (e) {
                console.error('Error al consultar deudas:', e)
            } finally {
                this.cargando = false
                this.consultaEnProceso = false
            }
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY')
        },
        esVencido(fechaVence) {
            if (!fechaVence) return false
            const hoy = moment().startOf('day')
            const vence = moment.unix(fechaVence)
            return vence.isBefore(hoy, 'day') || vence.isSame(hoy, 'day')
        },
        cerrar() {
            this.$emit('input', false)
            this.$emit('cerrar')
        },
        continuar() {
            this.$emit('continuar', {
                accion: this.accionPendiente,
                cliente: this.cliente,
                tieneDeuda: this.cuentas_pendientes.length > 0
            })
        }
    }
}
</script>

<style scoped>
.cuentas-lista {
    max-height: 180px;
    overflow-y: auto;
}
</style>