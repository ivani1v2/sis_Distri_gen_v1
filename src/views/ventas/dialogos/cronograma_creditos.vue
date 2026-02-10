<template>
    <v-dialog v-model="dial" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()" color="red" large>mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn color="primary" x-small @click="guardarPlanLetras" :disabled="!cuotas.length">
                    <v-icon left small>mdi-content-save</v-icon> Guardar plan
                </v-btn>
            </v-system-bar>
        </div>

        <v-card class="pa-3">

            <v-row dense>
                <v-col cols="12"> 
                    <v-text-field readonly :value="redondear(totalCredito)" label="Monto total (crédito)" type="text"
                        dense outlined hide-details="auto" :prefix="moneda + ' '" />
                </v-col>
            </v-row>

            <v-divider class="my-3" />

            <div class="mb-1 d-flex align-center">
                <span class="text-caption grey--text">Agregar nueva cuota</span>
                <v-spacer></v-spacer>
                <v-btn color="success" x-small @click="dialogGenerar = true" :disabled="saldoPendiente <= 0.01">
                    <v-icon left small>mdi-flash</v-icon> Generar Automático
                </v-btn>
            </div>

            <v-row dense>
                <v-col cols="12" sm="6">
                    <v-text-field v-model="nuevaFecha" label="Fecha de vencimiento" type="date" dense outlined
                        hide-details="auto" />
                </v-col>

                <v-col cols="10" sm="4">
                    <v-text-field v-model.number="nuevoMonto" label="Importe" type="number" dense outlined
                        hide-details="auto" :prefix="moneda + ' '" />
                </v-col>

                <v-col cols="2" sm="2" class="d-flex align-center">
                    <v-btn color="primary" small class="mt-1" @click="agregarCuota">
                        <v-icon small>mdi-plus</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <div v-if="saldoPendiente !== 0" class="mt-2 text-caption"
                :class="saldoPendiente < 0 ? 'error--text' : 'warning--text'">
                Diferencia pendiente: **{{ moneda }} {{ saldoPendiente.toFixed(2) }}**
            </div>

            <v-divider class="my-3" />

            <div class="mt-3">
                <div class="d-flex align-center mb-1">
                    <span class="font-weight-medium">Cuotas programadas</span>
                    <v-spacer></v-spacer>
                    <span class="text-caption grey--text">
                        Total cuotas: {{ moneda }} **{{ totalCuotas.toFixed(2) }}**
                    </span>
                </div>

                <v-simple-table dense class="tabla-cuotas elevation-1">
                    <thead>
                        <tr>
                            <th class="text-left text-caption">#</th>
                            <th class="text-left text-caption">Vencimiento</th>
                            <th class="text-right text-caption">Importe</th>
                            <th class="text-center text-caption">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!cuotas.length">
                            <td colspan="4" class="text-center text-caption grey--text">
                                Aún no has agregado cuotas
                            </td>
                        </tr>

                        <tr v-for="(c, i) in cuotas" :key="i">
                            <td class="text-caption">{{ c.numero }}</td>
                            <td class="text-caption">
                                <div class="d-flex align-center">
                                    <span>{{ formatFecha(c.vencimiento) }}</span>
                                    <v-btn icon x-small class="ml-1" @click="abrirSelectorFecha(c, i)">
                                        <v-icon small color="info">mdi-pencil</v-icon>
                                    </v-btn>
                                </div>
                            </td>
                            <td class="text-right text-caption">
                                {{ moneda }} {{ Number(c.importe).toFixed(2) }}
                            </td>
                            <td class="text-center">
                                <v-btn icon x-small color="error" @click="eliminarCuota(i)">
                                    <v-icon small>mdi-delete</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </div>

        </v-card>
        
        <v-dialog v-model="dialogGenerar" max-width="350">
            <v-card>
                <v-toolbar color="success" dense dark>
                    <v-toolbar-title>Generar Cronograma Automático</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogGenerar = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-card-text class="pt-4">
                    <div class="text-subtitle-1 mb-2">
                        Saldo a financiar: <span class="warning--text font-weight-bold">{{ moneda }} {{ saldoPendiente.toFixed(2) }}</span>
                    </div>

                    <v-text-field
                        v-model.number="numCuotas"
                        label="Número de Cuotas"
                        type="number"
                        dense
                        outlined
                        hide-details="auto"
                        :min="1"
                        class="mb-3"
                    ></v-text-field>

                    <v-text-field
                        v-model.number="frecuenciaDias"
                        label="Frecuencia (días)"
                        type="number"
                        dense
                        outlined
                        hide-details="auto"
                        :min="1"
                    ></v-text-field>
                </v-card-text>

                <v-card-actions>
                    <v-btn block color="success" @click="generarCronograma" :disabled="numCuotas <= 0 || frecuenciaDias <= 0">
                        <v-icon left>mdi-calendar-plus</v-icon>
                        Crear {{ numCuotas || 0 }} cuota(s)
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="dialogEditarFecha" max-width="300">
            <v-card>
                <v-toolbar color="info" dense dark>
                    <v-toolbar-title>Cuota #{{ cuotaSeleccionada.numero }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogEditarFecha = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-0">
                    <v-date-picker
                        v-model="nuevaFechaVencimiento"
                        full-width
                        locale="es-pe"
                        @input="guardarNuevaFecha"
                    ></v-date-picker>
                </v-card-text>
            </v-card>
        </v-dialog>
        
    </v-dialog>
</template>

<script>
import moment from 'moment'

export default {
    name: "letras-credito",

    props: {
        totalCredito: Number,
        pagoInicial: Number,
        moneda: { type: String, default: "S/" },
        planExistente: Object
    },

    data() {
        return {
            dial: false,
            cuotas: [],
            nuevaFecha: "",
            nuevoMonto: null,
            
            // Para Generación Automática
            dialogGenerar: false,
            numCuotas: 3,
            frecuenciaDias: 30,
            
            // NUEVOS para Edición de Fecha
            dialogEditarFecha: false,
            cuotaSeleccionada: {}, // Almacena la cuota que se está editando
            cuotaIndex: -1,        // Almacena el índice de la cuota en el array
            nuevaFechaVencimiento: null, // Almacena la fecha seleccionada en el date-picker
        };
    },

    created() {
        // Inicializa la fecha de la primera cuota
        const d = moment().add(7, 'days').format('YYYY-MM-DD');
        this.nuevaFecha = d

        // Carga plan existente
        if (this.planExistente && Array.isArray(this.planExistente.cuotas)) {
            this.cuotas = this.planExistente.cuotas
            const ultima = this.cuotas[this.cuotas.length - 1]
            if (ultima) {
                this.nuevaFecha = moment(ultima.vencimiento).add(1, 'day').format('YYYY-MM-DD');
            }
        }

        this.dial = true
    },

    computed: {
        totalCuotas() {
            return this.cuotas.reduce((sum, c) => sum + Number(c.importe || 0), 0)
        },

        saldoPendiente() {
            const montoNeto = Number(this.totalCredito || 0) - Number(this.pagoInicial || 0);
            return montoNeto - this.totalCuotas
        }
    },

    methods: {
        /**
         * @description Abre el diálogo para editar la fecha de una cuota específica.
         * @param {object} cuota - El objeto de la cuota.
         * @param {number} index - El índice de la cuota en el array `cuotas`.
         */
        abrirSelectorFecha(cuota, index) {
            this.cuotaSeleccionada = cuota;
            this.cuotaIndex = index;
            // Inicializa el selector de fecha con la fecha de vencimiento actual de la cuota
            this.nuevaFechaVencimiento = cuota.vencimiento; 
            this.dialogEditarFecha = true;
        },
        
        /**
         * @description Se dispara al seleccionar una fecha en el v-date-picker y guarda el cambio.
         * @param {string} nuevaFecha - La fecha seleccionada en formato YYYY-MM-DD.
         */
        guardarNuevaFecha(nuevaFecha) {
            if (this.cuotaIndex !== -1 && nuevaFecha) {
                // Usamos Vue.set para asegurar la reactividad en el array
                this.$set(this.cuotas[this.cuotaIndex], 'vencimiento', nuevaFecha);
                
                // Cierra el diálogo y resetea los estados
                this.dialogEditarFecha = false;
                this.cuotaIndex = -1;
                this.cuotaSeleccionada = {};
            }
        },

        // --- Métodos de Cuota Manual ---

        agregarCuota() {
            if (!this.nuevaFecha) return alert("Seleccione una fecha de vencimiento")
            if (!this.nuevoMonto || Number(this.nuevoMonto) <= 0)
                return alert("Ingrese un importe válido")

            const importe = Number(this.nuevoMonto)

            if (this.saldoPendiente - importe < -0.01)
                return alert(`El importe excede el saldo restante por financiar (${this.moneda} ${this.saldoPendiente.toFixed(2)})`)

            this.cuotas.push({
                numero: '',
                vencimiento: this.nuevaFecha,
                importe
            })
            
            this.nuevaFecha = moment(this.nuevaFecha).add(this.frecuenciaDias, 'days').format('YYYY-MM-DD');
            this.nuevoMonto = null
            this.renumerarCuotas()
        },

        eliminarCuota(index) {
            this.cuotas.splice(index, 1)
            this.renumerarCuotas()
        },

        renumerarCuotas() {
            this.cuotas = this.cuotas.map((c, idx) => ({
                ...c,
                numero: String(idx + 1).padStart(3, '0')
            }))
        },

        // --- Métodos de Generación Automática ---

        generarCronograma() {
            const num = Number(this.numCuotas)
            const dias = Number(this.frecuenciaDias)
            
            if (num <= 0 || dias <= 0) {
                alert("Ingrese un número de cuotas y una frecuencia válidos.")
                return
            }

            const saldo = this.saldoPendiente
            if (saldo <= 0.01) {
                alert("El saldo pendiente por financiar es cero o negativo.")
                this.dialogGenerar = false
                return
            }
            
            // Cálculo de montos (ver detalles en el script anterior)
            let montoBase = saldo / num
            let montoFijo = Math.floor(montoBase * 100) / 100
            let ajuste = saldo - (montoFijo * num) 
            
            const nuevasCuotas = []
            let fechaActual = moment(this.nuevaFecha)
            
            for (let i = 0; i < num; i++) {
                let importeCuota = montoFijo
                
                if (i === num - 1) {
                    importeCuota = montoFijo + ajuste
                }
                
                nuevasCuotas.push({
                    numero: '',
                    vencimiento: fechaActual.format('YYYY-MM-DD'),
                    importe: parseFloat(importeCuota.toFixed(2))
                })
                
                fechaActual = fechaActual.add(dias, 'days')
            }

            if (this.cuotas.length > 0) {
                const ok = confirm("Al generar un nuevo cronograma, se REEMPLAZARÁN las cuotas existentes. ¿Continuar?")
                if (!ok) {
                    this.dialogGenerar = false
                    return
                }
            }

            this.cuotas = nuevasCuotas
            this.renumerarCuotas()
            this.dialogGenerar = false
            
            this.nuevaFecha = fechaActual.format('YYYY-MM-DD');
            this.nuevoMonto = null;

            alert(`Cronograma de ${num} cuotas generado con éxito.`)
        },

        // --- Métodos de Guardar y Utilidad ---

        guardarPlanLetras() {
            if (!this.totalCredito) return alert("El monto total del crédito es 0.")
            if (!this.cuotas.length) return alert("Debe agregar al menos una cuota")

            if (Math.abs(this.saldoPendiente) > 0.01) {
                const ok = confirm(
                    `La suma de cuotas no coincide con el saldo a financiar (dif: ${this.saldoPendiente.toFixed(2)}).\n\n¿Guardar de todas formas?`
                )
                if (!ok) return
            }

            const fechaUltima =
                this.cuotas.length ? this.cuotas[this.cuotas.length - 1].vencimiento : null

            const payload = {
                total_credito: Number(this.totalCredito),
                pago_inicial: Number(this.pagoInicial || 0),
                fecha_ultima_cuota: fechaUltima,
                cuotas: this.cuotas
            }

            this.$emit("emite_cronograma", payload)
            this.cierra()
        },

        formatFecha(f) {
            return moment(f).format('DD/MM/YYYY')
        },

        cierra() {
            this.dial = false
            this.$emit("cierra", false)
        },
        redondear(valor) {
            const dec = this.$store?.state?.configuracion?.decimal ?? 2;
            return parseFloat(valor).toFixed(dec);
        },
    }
}
</script>

<style scoped>
/* Estilos sin cambios */
.tabla-cuotas {
    border-radius: 8px;
    overflow: hidden;
}
</style>
</style>
