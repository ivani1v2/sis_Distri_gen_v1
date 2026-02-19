<template>
  <v-dialog v-model="dial" max-width="450" persistent>
    <v-card class="rounded-lg">
      <v-toolbar color="success" dark dense>
        <v-toolbar-title>Registrar Abono</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
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
            {{ moneda }}{{ redondear(montoCuota) }}
          </span>
        </h4>

        <div class="mb-3 text-center">
          <v-chip small outlined>
            Abonar: {{ moneda }} {{ redondear(montoCuota) }}
          </v-chip>
        </div>

        <v-row dense v-for="pago in pagos" :key="pago.nombre" class="align-center">
          <v-col cols="12">
            <v-text-field
              :label="pago.nombre.toUpperCase()"
              :prefix="moneda"
              v-model.number="pago.monto"
              @input="ajustarMetodoPago(pago)"
              :type="$store.state.esmovil ? 'tel' : 'number'"
              inputmode="decimal"
              step="0.01"
              outlined
              dense
              hide-details
              :class="{ 'mpago-activo': pago.monto > 0 }"
              @focus="$event.target.select()"
            >
              <template v-slot:prepend-inner>
                <v-avatar size="28" class="mr-2" tile>
                  <v-img :src="buscarIcono(pago.nombre)" @click.stop="cambiarMetodoPago(pago)" />
                </v-avatar>
              </template>
              <template v-slot:append>
                <v-btn icon x-small @click.stop="cambiarMetodoPago(pago)">
                  <v-icon small>mdi-arrow-collapse-down</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <div class="mt-2 mb-1 caption grey--text" v-if="diferenciaPagos !== 0">
          Falta/Exceso: {{ moneda }} {{ redondear(diferenciaPagos) }}
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn color="success" block large @click="amortizar" :loading="cargando">
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

const EPS = 0.01

export default {
  name: 'dial_amortiza',
  props: {
    item_selecto: { type: Object, required: true },
    item_selecto_cuota_index: { type: Number, required: true },
    moneda: { type: String, default: 'S/' }
  },
  data() {
    return {
      dial: false,
      pagos: [],
      montoCuota: 0,
      cargando: false
    }
  },
  created() {
    const idx = this.item_selecto_cuota_index
    this.montoCuota = this.item_selecto?.datos?.[idx]?.monto || this.item_selecto.monto_pendiente || 0
    this.montoCuota = Number(this.montoCuota)

    this.pagos = (this.$store?.state?.modopagos || []).map(nombre => ({
      nombre,
      monto: 0
    }))

    if (this.montoCuota > 0 && this.pagos.length > 0) {
      this.pagos[0].monto = this.montoCuota
    }

    this.dial = true
  },
  computed: {
    sumaPagos() {
      return this.pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
    },
    diferenciaPagos() {
      return Number((this.montoCuota - this.sumaPagos).toFixed(2))
    }
  },
  methods: {
    async amortizar() {
      this.cargando = true
      store.commit('dialogoprogress')

      try {
        const index = this.item_selecto_cuota_index
        const deuda = this.item_selecto

        if (!this.validarDatos(deuda, index)) return

        const datos = [...deuda.datos]
        const cuota = datos[index]
        const montoAbonado = Number(this.sumaPagos.toFixed(2))

        if (!this.validarMonto(montoAbonado)) return

        const ahora = moment().unix()
        const pagosFiltrados = this.pagos
          .filter(p => p.monto > 0)
          .map(p => ({
            nombre: p.nombre,
            monto: Number(p.monto),
            fecha: ahora
          }))

        cuota.monto_original = Number(cuota.monto_original ?? cuota.monto ?? 0)
        cuota.monto_pagado_acum = Number((Number(cuota.monto_pagado_acum || 0) + montoAbonado).toFixed(2))
        cuota.estado = 'PAGADO'
        cuota.fecha_pagado = ahora
        cuota.fecha_modificacion = ahora
        cuota.monto = cuota.monto_pagado_acum
        cuota.pagos = [...(cuota.pagos || []), ...pagosFiltrados]

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

        await Promise.all(pagosFiltrados.map(p => this.generarFlujo(p.nombre, p.monto, deuda)))

        this.$emit('actualizar-item', {
          ...deuda,
          datos,
          monto_pendiente: montoPendienteReal,
          pagado: totalPagadoGlobal,
          estado: todoPagado ? 'LIQUIDADO' : 'PENDIENTE'
        })

        this.dial = false

      } catch (error) {
        console.error('Error:', error)
        alert('Ocurrió un error al registrar el abono.')
      } finally {
        this.cargando = false
        store.commit('dialogoprogress')
      }
    },

    validarDatos(deuda, index) {
      if (index == null || index < 0) {
        alert('No se pudo identificar la cuota a abonar.')
        return false
      }
      if (!deuda?.datos) {
        alert('La deuda no tiene cronograma válido.')
        return false
      }
      if (!deuda.datos[index]) {
        alert('La cuota seleccionada ya no existe.')
        return false
      }
      return true
    },

    validarMonto(montoAbonado) {
      if (montoAbonado <= 0) {
        alert('Ingrese un monto mayor a 0.')
        return false
      }
      if (montoAbonado - this.montoCuota > EPS) {
        alert(`El monto a abonar no puede superar el monto de la cuota.`)
        return false
      }
      return true
    },

    async generarFlujo(modo, monto, cabecera) {
      const fecha = moment().unix()
      await nuevoflujo({
        operacion: 'ingreso',
        observacion: 'Pago Credito - ' + cabecera.nombre,
        numeracion_doc: cabecera.doc_ref,
        modo,
        fecha,
        total: monto,
        estado: 'activo',
        responsable: store.state.permisos.correo.slice(0, -13),
        sujeto: store.state.permisos.correo.slice(0, -13)
      })
    },

    buscarIcono(nombre) {
      return this.$store.state.iconos_pagos.find(item => item.nombre == nombre)?.icono || ''
    },

    obtenerMetodoSaldo() {
      return this.pagos.find(p => p.nombre.toUpperCase() === 'EFECTIVO') || this.pagos[0] || null
    },

    calcularSumaSin(nombre) {
      return this.pagos
        .filter(p => p.nombre !== nombre)
        .reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
    },

    cambiarMetodoPago(metodo) {
      this.pagos.forEach(p => p.monto = 0)
      const seleccionado = this.pagos.find(p => p.nombre === metodo.nombre)
      if (seleccionado) seleccionado.monto = this.montoCuota
    },

    ajustarMetodoPago(editado) {
      const saldo = this.obtenerMetodoSaldo()
      if (!saldo || editado.nombre === saldo.nombre) return
      
      const otros = this.calcularSumaSin(saldo.nombre)
      let restante = Number((this.montoCuota - otros).toFixed(2))
      saldo.monto = restante > 0 ? restante : 0
    },

    redondear(num) {
      return Number(num).toFixed(2)
    },

    cerrar() {
      this.dial = false
      this.$emit('cerrar')
    }
  }
}
</script>