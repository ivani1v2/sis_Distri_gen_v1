<template>
  <v-dialog v-model="dial" max-width="450">
    <v-card class="rounded-lg">
      <v-toolbar color="teal darken-2" dark dense>
        <v-toolbar-title>Nueva cuota</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="guardarNuevaCuota">
          <v-icon>mdi-content-save</v-icon>
        </v-btn>
        <v-btn icon @click="cierra">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              label="Monto de la cuota"
              :prefix="moneda"
              type="number"
              outlined
              dense
              v-model="monto_str"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              label="Fecha de vencimiento"
              type="date"
              outlined
              dense
              v-model="fecha_str"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-divider class="my-3"></v-divider>

        <div class="caption grey--text mb-1">
          Monto total del crédito:
          <strong>{{ moneda }}{{ redondear(totalCredito) }}</strong>
        </div>
        <div class="caption grey--text mb-1">
          Suma actual de cuotas:
          <strong>{{ moneda }}{{ redondear(sumaActual) }}</strong>
        </div>
        <div class="caption grey--text">
          Suma con esta cuota:
          <strong>{{ moneda }}{{ redondear(sumaConNueva) }}</strong>
        </div>

        <v-alert
          v-if="sumaConNueva > totalCredito + 0.01"
          type="error"
          dense
          text
          class="mt-3"
        >
          El total del cronograma superaría el monto total del crédito.
          Ajusta el monto de la cuota.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment'
import store from '@/store'
import { editaCuentaxCobrar } from '../../../db'

export default {
  name: 'dial_nueva_cuota',
  props: {
    item_selecto: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      dial: true,
      monto_str: '',
      fecha_str: moment().format('YYYY-MM-DD'),
    }
  },
  created() {
  // Prefill con la diferencia (lo que falta para llegar al monto_total)
  const diff = this.totalCredito - this.sumaActual
  this.monto_str = diff > 0 ? diff.toFixed(2) : '0.00'
},
  computed: {
    moneda() {
      return this.item_selecto?.moneda || 'S/'
    },
    totalCredito() {
      return Number(this.item_selecto?.monto_total || 0)
    },
    sumaActual() {
      const datos = Array.isArray(this.item_selecto?.datos)
        ? this.item_selecto.datos
        : []
      return datos.reduce((acc, it) => acc + (parseFloat(it.monto) || 0), 0)
    },
    sumaConNueva() {
      const nuevoMonto = parseFloat(this.monto_str) || 0
      return this.sumaActual + nuevoMonto
    },
  },
  methods: {
    redondear(num) {
      const dec = store.state.configuracion?.decimal || 2
      return Number(num).toFixed(dec)
    },
    async guardarNuevaCuota() {
      const monto = parseFloat(this.monto_str) || 0
      if (monto <= 0) {
        alert('El monto de la cuota debe ser mayor a 0.')
        return
      }

      if (!this.fecha_str) {
        alert('Seleccione una fecha de vencimiento.')
        return
      }

      // Validar que no se pase del monto total
      if (this.sumaConNueva > this.totalCredito + 0.01) {
        alert(
          `El total del cronograma (S/.${this.sumaConNueva.toFixed(
            2
          )}) supera el monto total del crédito ` +
            `(S/.${this.totalCredito.toFixed(2)}). Ajusta el monto.`,
        )
        return
      }

      const fecha_vence_unix = moment(String(this.fecha_str)).unix()
      const ahora = moment().unix()
      const datos = Array.isArray(this.item_selecto.datos)
        ? [...this.item_selecto.datos]
        : []

      const nuevaCuota = {
        id: datos.length + 1,
        estado: 'PENDIENTE',
        fecha: ahora,
        fecha_vence: fecha_vence_unix,
        monto: monto,
        vendedor:
          store.state.permisos?.correo?.slice(0, -13) ||
          this.item_selecto.vendedor ||
          '',
        fecha_modificacion: ahora,
      }

      datos.push(nuevaCuota)

      // Guardar en Firebase
      await editaCuentaxCobrar(this.item_selecto.doc_ref, 'datos', datos)

      const actualizado = {
        ...this.item_selecto,
        datos,
      }

      this.$emit('actualizar-item', actualizado)
      this.cierra()
    },
    cierra() {
      this.dial = false
      this.$emit('cerrar')
    },
  },
}
</script>
