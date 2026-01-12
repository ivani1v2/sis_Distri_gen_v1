<template>
    <v-dialog v-model="dial" max-width="450" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="success" dark dense>
                <v-toolbar-title>Registrar Abono</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cierra"><v-icon>mdi-close</v-icon></v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <h4 class="mb-1">
                    Monto pendiente del crédito:
                    <span class="red--text text--darken-3">
                        {{ moneda }}{{ redondear(item_selecto.monto_pendiente) }}
                    </span>
                </h4>
                <h4 class="mb-3">
                    Monto de la cuota seleccionada:
                    <span class="blue--text text--darken-3">
                        {{ moneda }}{{ redondear(a_cuenta) }}
                    </span>
                </h4>

                <div class="mb-3 text-center">
                    <v-chip small outlined>
                        Abonar: {{ moneda }} {{ redondear(totalAbono) }}
                    </v-chip>
                </div>

                <!-- MÉTODOS DE PAGO -->
                <v-row dense v-for="p in pagosEntrega" :key="p.nombre" class="align-center">
                    <v-col cols="12">
                        <v-text-field :label="p.nombre.toUpperCase()" :prefix="moneda" :value="p.monto"
                            @input="val => { p.monto = val; onMontoInput(p) }"
                            :type="$store.state.esmovil ? 'tel' : 'number'" inputmode="decimal" step="0.01" outlined
                            dense hide-details class="mpago-field" :class="{ 'mpago-activo': parseFloat(p.monto) > 0 }"
                            @focus="$event.target.select()">
                            <template v-slot:prepend-inner>
                                <v-avatar size="28" class="mr-2" tile>
                                    <v-img :src="busca_ico(p.nombre)" @click.stop="cambia_modo_pago(p)" />
                                </v-avatar>
                            </template>

                            <template v-slot:append>
                                <v-btn icon x-small @click.stop="cambia_modo_pago(p)">
                                    <v-icon small>mdi-arrow-collapse-down</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-col>
                </v-row>

                <div class="mt-2 mb-1 caption grey--text" v-if="diferenciaPagosAmortiza !== 0">
                    Falta/Exceso: {{ moneda }} {{ redondear(diferenciaPagosAmortiza) }}
                </div>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0">
                <v-btn color="success" block large @click="amortiza()">
                    <v-icon left>mdi-cash</v-icon>
                    CONFIRMAR ABONO
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>

<script>
import moment from 'moment'
import store from '@/store'
import { editaCuentaxCobrar, grabaCabecera, nuevoflujo } from '../../../db'
import { reporte_liquidacion_cuota } from "./formatos_cuentas";
export default {
    name: 'dial_amortiza',
    props: {
        item_selecto: Object,
        item_selecto_cuota_index: Number,
        moneda: String
    },
    data() {
        return {
            dial: false,
            pagosEntrega: [],
            a_cuenta: 0
        }
    },

    created() {
        console.log("Dial Amortiza creado", this.item_selecto, this.item_selecto_cuota_index)

        const idx = this.item_selecto_cuota_index
        if (
            this.item_selecto &&
            Array.isArray(this.item_selecto.datos) &&
            idx != null &&
            idx >= 0 &&
            idx < this.item_selecto.datos.length
        ) {
            this.a_cuenta = Number(this.item_selecto.datos[idx].monto) || 0
        } else {
            this.a_cuenta = Number(this.item_selecto.monto_pendiente || 0)
        }

        this.pagosEntrega = (this.$store?.state?.modopagos || []).map(n => ({
            nombre: n,
            monto: ""
        }))

        if (this.a_cuenta > 0 && this.pagosEntrega.length > 0) {
            this.pagosEntrega[0].monto = this.a_cuenta.toFixed(2)
        }

        this.dial = true
    },
    computed: {
        totalAbono() {
            return Number(this.a_cuenta || 0)
        },
        sumaPagosAmortiza() {
            return this.pagosEntrega.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0)
        },
        diferenciaPagosAmortiza() {
            return Number(this.totalAbono.toFixed(2)) - Number(this.sumaPagosAmortiza.toFixed(2))
        }
    },
    methods: {
        async amortiza() {
            store.commit("dialogoprogress")
            try {
                const index = this.item_selecto_cuota_index
                if (index == null || index < 0) {
                    alert("No se pudo identificar la cuota a abonar.")
                    return
                }

                const deuda = this.item_selecto
                if (!deuda || !Array.isArray(deuda.datos)) {
                    alert("La deuda no tiene cronograma válido.")
                    return
                }

                const datos = [...deuda.datos]
                const cuota = datos[index]
                if (!cuota) {
                    alert("La cuota seleccionada ya no existe.")
                    return
                }

                const totalCuotaUI = Number(this.a_cuenta || 0) // referencia UI
                const montoAbonado = Number(this.sumaPagosAmortiza.toFixed(2))

                if (montoAbonado <= 0) {
                    alert("Ingrese un monto mayor a 0.")
                    return
                }

                // Si NO quieres permitir pagar más que lo mostrado en la cuota (UI), deja esto.
                // Si SÍ quieres permitir, elimina este bloque.
                if (montoAbonado - totalCuotaUI > 0.01) {
                    alert(
                        `El total de los métodos de pago (${this.moneda} ${this.redondear(montoAbonado)}) ` +
                        `no puede superar el monto de la cuota (${this.moneda} ${this.redondear(totalCuotaUI)}).`
                    )
                    return
                }

                const ahora = moment().unix()
                const pagos_filtrados = this.pagosEntrega
                    .filter(p => parseFloat(p.monto) > 0)
                    .map(p => ({
                        nombre: p.nombre,
                        monto: Number(p.monto),
                        fecha: ahora
                    }))

                const EPS = 0.01

                // 1) Guardar monto original de la cuota (base histórica)
                const montoOriginal = Number(cuota.monto_original ?? cuota.monto ?? 0)
                cuota.monto_original = montoOriginal

                // 2) Acumular pago en la cuota
                const pagadoAntes = Number(cuota.monto_pagado_acum || 0)
                const pagadoAhora = Number((pagadoAntes + montoAbonado).toFixed(2))
                cuota.monto_pagado_acum = pagadoAhora

                // 3) (COMO TÚ QUIERES) siempre PAGADO + reemplazar monto por lo pagado
                cuota.estado = "PAGADO"
                cuota.fecha_pagado = ahora
                cuota.fecha_modificacion = ahora
                cuota.monto = pagadoAhora // muestra acumulado pagado en esa cuota

                // 4) Acumular pagos
                cuota.pagos = [...(cuota.pagos || []), ...pagos_filtrados]

                // -------------------------------------------------------------------
                // ✅ SALDO GLOBAL (NO POR SUMA DE CUOTAS)
                // pendiente = monto_total - total_pagado_global
                // -------------------------------------------------------------------
                const totalPagadoGlobal = Number(
                    datos.reduce((acc, c) => acc + (Number(c.monto_pagado_acum || 0)), 0).toFixed(2)
                )

                let montoPendienteReal = Number((Number(deuda.monto_total || 0) - totalPagadoGlobal).toFixed(2))
                if (montoPendienteReal < 0) montoPendienteReal = 0

                await editaCuentaxCobrar(deuda.doc_ref, 'datos', datos)
                await editaCuentaxCobrar(deuda.doc_ref, 'monto_pendiente', montoPendienteReal)
                await editaCuentaxCobrar(deuda.doc_ref, 'pagado', totalPagadoGlobal)

                const todoPagado = montoPendienteReal <= EPS

                if (todoPagado) {
                    await editaCuentaxCobrar(deuda.doc_ref, 'estado', 'LIQUIDADO')
                    await grabaCabecera(deuda.doc_ref + '/forma_pago', 'PAGADO')
                } else {
                    await editaCuentaxCobrar(deuda.doc_ref, 'estado', 'PENDIENTE')
                    await grabaCabecera(deuda.doc_ref + '/forma_pago', 'PENDIENTE')
                }

                for (const p of pagos_filtrados) {
                    await this.genera_flujo(p.nombre, p.monto, deuda)
                }

                reporte_liquidacion_cuota(
                    { ...deuda, monto_pendiente: montoPendienteReal, pagado: totalPagadoGlobal },
                    cuota,
                    pagos_filtrados
                )

                this.$emit("actualizar-item", {
                    ...deuda,
                    datos,
                    monto_pendiente: montoPendienteReal,
                    pagado: totalPagadoGlobal,
                    estado: todoPagado ? "LIQUIDADO" : "PENDIENTE"
                })

            } catch (e) {
                console.error("Error en amortiza:", e)
                alert("Ocurrió un error al registrar el abono.")
            } finally {
                store.commit("dialogoprogress")
            }
        },



        async genera_flujo(modo, monto, cabecera) {
            const fecha = moment().unix()
            const flujo = {
                operacion: 'ingreso',
                observacion: 'Pago Credito - ' + cabecera.nombre,
                numeracion_doc: cabecera.doc_ref,
                modo,
                fecha,
                total: monto,
                estado: 'activo',
                responsable: store.state.permisos.correo.slice(0, -13),
                sujeto: store.state.permisos.correo.slice(0, -13)
            }
            await nuevoflujo(flujo)
            return true
        },
        busca_ico(data) {
            const iconos = this.$store.state.iconos_pagos.find(item => item.nombre == data)
            return iconos ? iconos.icono : ''
        },
        getMetodoSaldo() {
            let efectivo = this.pagosEntrega.find(
                x => String(x.nombre || '').toUpperCase() === 'EFECTIVO'
            )
            if (!efectivo && this.pagosEntrega.length > 0) {
                efectivo = this.pagosEntrega[0]
            }
            return efectivo || null
        },
        sumaSin(nombre) {
            return this.pagosEntrega
                .filter(p => p.nombre !== nombre)
                .reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0)
        },
        cambia_modo_pago(val) {
            const total = Number(this.totalAbono.toFixed(2))
            this.pagosEntrega.forEach(p => { p.monto = '' })
            const sel = this.pagosEntrega.find(p => p.nombre === val.nombre)
            if (sel) sel.monto = total > 0 ? total.toFixed(2) : ''
            const saldo = this.getMetodoSaldo()
            if (saldo && saldo.nombre !== val.nombre) {
                saldo.monto = '0'
            }
        },
        onMontoInput(editado) {
            const saldo = this.getMetodoSaldo()
            if (!saldo || editado?.nombre === saldo.nombre) return
            const total = Number(this.totalAbono.toFixed(2))
            const otros = this.sumaSin(saldo.nombre)
            let restante = Number((total - otros).toFixed(2))
            if (restante < 0) restante = 0
            saldo.monto = restante ? restante.toFixed(2) : (restante === 0 ? '0' : '')
        },
        redondear(num) {
            return Number(num).toFixed(2)
        },
        cierra() {
            this.dial = false
            this.$emit('cerrar')
        }
    }
}
</script>