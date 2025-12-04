<template>
    <v-dialog v-model="dialog" max-width="800px" persistent>
        <v-card>
            <v-card-title class="text-h6">
                <v-icon left>mdi-history</v-icon>
                Historial de Compras
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrarDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <div v-if="cliente">
                    <v-row class="mb-4">
                        <v-col cols="12" sm="6">
                            <h4>{{ cliente.nombre }} {{ cliente.apellido }}</h4>
                            <p class="text-body-2 text--secondary">{{ cliente.email }}</p>
                        </v-col>
                        <v-col cols="12" sm="6" class="text-right">
                            <v-select v-model="tipoConsulta" :items="['Comprobantes', 'Pedidos']" label="Tipo" outlined
                                dense />
                        </v-col>
                    </v-row>


                    <v-data-table dense :headers="headers" :items="compras" :loading="loading" class="elevation-1"
                        no-data-text="No hay registros" loading-text="Cargando...">
                        <template v-slot:item.fecha="{ item }">
                            {{ formatearFecha(item.fecha) }}
                        </template>

                        <template v-slot:item.total="{ item }">
                            {{ Number(item.total || 0).toFixed(2) }}
                        </template>

                        <template v-slot:item.acciones="{ item }">
                            <v-btn icon small @click="verDetalle(item)" title="Ver detalle">
                                <v-icon color="success">mdi-eye</v-icon>
                            </v-btn>
                        </template>
                    </v-data-table>
                </div>
            </v-card-text>
        </v-card>

        <!-- DIALOG DETALLE -->
        <v-dialog v-model="dialogDetalle" max-width="800px">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon left>mdi-file-document-outline</v-icon>
                    Detalle
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogDetalle = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text>
                    <v-progress-linear v-if="loadingDetalle" indeterminate class="mb-4" />

                    <div v-else-if="detalleCabecera">
                        <v-row dense class="mb-2">
                            <v-col cols="12" sm="6">
                                <strong>N°:</strong>
                                {{ detalleCabecera.numeracion || selectedCompra.numero_orden }}
                            </v-col>
                            <v-col cols="12" sm="6">
                                <strong>Total:</strong>
                                {{ Number(detalleCabecera.total || 0).toFixed(2) }}
                            </v-col>

                            <v-col cols="12" sm="6" v-if="detalleCabecera.forma_pago">
                                <strong>Forma de pago:</strong>
                                {{ detalleCabecera.forma_pago }}
                            </v-col>
                        </v-row>

                        <v-divider class="my-3"></v-divider>

                        <h4 class="mb-2">Detalle</h4>

                        <v-simple-table dense>
                            <thead>
                                <tr>
                                    <th class="text-left">Producto</th>
                                    <th class="text-right">Cant.</th>
                                    <th class="text-right">Medida</th>
                                    <th class="text-right">Precio</th>
                                    <th class="text-right">Importe</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="(d, i) in detalleLineas" :key="i">
                                    <td style="font-size:80%;">{{ d.id }} - {{ d.descripcion || d.nombre || d.producto
                                        }}
                                    </td>
                                    <td style="font-size:80%;" class="text-right">{{ d.cantidad }}</td>
                                    <td style="font-size:80%;" class="text-right">{{ d.medida }}</td>
                                    <td style="font-size:80%;" class="text-right">{{ Number(d.precio || 0).toFixed(2) }}
                                    </td>

                                    <td style="font-size:80%;" class="text-right">{{ Number(d.total ||
                                        d.totalLinea).toFixed(2)
                                    }}</td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </div>

                    <div v-else>
                        No se encontró información del registro.
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import {
    allCabecera,
    consultaDetalle,
    consulta_Cabecera,
    all_pedidos,
    detalle_pedido
} from '../../../db'

export default {
    name: 'HistorialCompras',
    props: {
        cliente: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            dialog: false,
            tipoConsulta: 'Pedidos',   // 👈 NUEVO
            loading: false,
            compras: [],
            dialogDetalle: false,
            loadingDetalle: false,
            detalleCabecera: null,
            detalleLineas: [],
            selectedCompra: null,

            headers: [
                { text: 'Fecha', value: 'fecha', sortable: true },
                { text: 'N°', value: 'numero_orden', sortable: false },
                { text: 'Total', value: 'total', sortable: true },
                { text: 'Acciones', value: 'acciones', sortable: false }
            ]
        }
    },
    watch: {
        tipoConsulta() {
            this.cargarHistorial()
        }
    },
    created() {
        this.cargarHistorial()
        this.dialog = true
    },
    methods: {
        async cargarHistorial() {
            if (!this.cliente?.id) return

            this.loading = true
            this.compras = []

            try {
                let snap

                // ⭐ Opción elegida
                console.log('Cargando historial de tipo:', this.cliente.id)
                if (this.tipoConsulta === 'Comprobantes') {
                    snap = await allCabecera()
                        .orderByChild('dni')
                        .equalTo(this.cliente.id)
                        .once('value')
                } else {
                    snap = await all_pedidos()
                        .orderByChild('doc_numero')
                        .equalTo(this.cliente.id)
                        .once('value')
                }

                const data = snap.val() || {}

                let arr = Object.keys(data).map(key => {
                    const x = data[key]
                    return {
                        numero_orden: x.numeracion || key,
                        numeracion: x.numeracion || key,
                        fecha: x.fecha_emision || x.fecha,
                        total: Number(x.total || 0),
                        raw: x
                    }
                })

                arr.sort((a, b) => Number(b.fecha || 0) - Number(a.fecha || 0))

                this.compras = arr.slice(0, 5)
            } catch (error) {
                console.error('Error al cargar historial:', error)
            } finally {
                this.loading = false
            }
        },

        formatearFecha(fecha) {
            if (!fecha) return ''
            return new Date(Number(fecha) * 1000).toLocaleDateString('es-ES')
        },

        async verDetalle(compra) {
            this.selectedCompra = compra
            this.dialogDetalle = true
            this.loadingDetalle = true

            try {
                const numero = compra.numeracion || compra.numero_orden

                let snapCab, snapDet

                // ⭐ Según el selector
                if (this.tipoConsulta === 'Comprobantes') {
                    snapCab = await consulta_Cabecera(numero).once('value')
                    snapDet = await consultaDetalle(numero).once('value')
                } else {
                    snapCab = await all_pedidos().child(numero).once('value')
                    snapDet = await detalle_pedido(numero).once('value')
                }

                this.detalleCabecera = snapCab.val() || {}
                const detData = snapDet.val() || {}

                this.detalleLineas = Object.keys(detData).map(k => detData[k])
            } catch (e) {
                console.error('Error al cargar detalle:', e)
                this.detalleCabecera = null
                this.detalleLineas = []
            } finally {
                this.loadingDetalle = false
            }
        },

        cerrarDialog() {
            this.dialog = false
            this.$emit('cerrar')
        }
    }
}
</script>

<style scoped>
.v-data-table {
    border-radius: 8px;
}
</style>
