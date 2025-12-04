<template>
  <v-dialog v-model="dial" max-width="450">
    <v-card class="rounded-lg">
      <v-toolbar color="indigo" dark dense>
        <v-toolbar-title>Editar cuota</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="guardarEdicionCuota">
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
              prefix="S/."
              type="number"
              outlined
              dense
              v-model="form_monto"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              label="Fecha de vencimiento"
              type="date"
              outlined
              dense
              v-model="form_fecha_str"
            ></v-text-field>
          </v-col>
        </v-row>
        <div class="mt-2 caption grey--text">
          Monto pendiente total del crédito:
          <strong>S/.{{ redondear(item_selecto.monto_pendiente || 0) }}</strong>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment'
import store from '@/store'
import { editaCuentaxCobrar } from '../../../db'

export default {
  name: 'dial_editar_cuota',
  props: {
    item_selecto: {
      type: Object,
      required: true
    },
    cuota_edit_index: {
      type: Number,
      required: true
    },
    cuota_edit_monto: {
      type: [Number, String],
      default: 0
    },
    cuota_edit_fecha_str: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dial: false,
      form_monto: '',
      form_fecha_str: ''
    }
  },

  created() {
    // inicializar con los valores que viene del padre
    this.form_monto = String(this.cuota_edit_monto || 0)
    this.form_fecha_str = this.cuota_edit_fecha_str || ''
    this.dial = true
  },

  methods: {
    redondear(num) {
      const dec = this.$store.state.configuracion?.decimal || 2
      return Number(num || 0).toFixed(dec)
    },

    async guardarEdicionCuota() {
      try {
        if (this.cuota_edit_index === null || this.cuota_edit_index < 0) {
          alert('Índice de cuota inválido.')
          return
        }

        const monto = parseFloat(this.form_monto) || 0
        if (monto <= 0) {
          alert('El monto de la cuota debe ser mayor a 0.')
          return
        }

        if (!this.form_fecha_str) {
          alert('Seleccione una fecha de vencimiento.')
          return
        }

        const fechaUnix = moment(String(this.form_fecha_str)).unix()

        const deuda = this.item_selecto
        const datos = Array.isArray(deuda.datos) ? [...deuda.datos] : []

        if (this.cuota_edit_index >= datos.length) {
          alert('La cuota seleccionada ya no existe.')
          return
        }

        const old = datos[this.cuota_edit_index]

        // actualizar cuota
        datos[this.cuota_edit_index] = {
          ...old,
          monto,
          fecha_vence: fechaUnix,
          fecha_modificacion: moment().unix(),
          vendedor: store.state.permisos?.correo?.slice(0, -13) || old.vendedor || ''
        }

        // nuevo monto pendiente = suma de cuotas NO pagadas
        const nuevoPendiente = datos
          .filter(c => c.estado !== 'PAGADO')
          .reduce((acc, it) => acc + (parseFloat(it.monto) || 0), 0)

        await editaCuentaxCobrar(deuda.doc_ref, 'datos', datos)

        const actualizado = {
          ...deuda,
          datos,
        }

        // mandar al padre para que actualice item_selecto y/o tabla
        this.$emit('actualizar-item', actualizado)

        this.cierra()
      } catch (e) {
        console.error('Error guardando edición de cuota:', e)
        alert('Ocurrió un error al guardar la cuota.')
      }
    },

    cierra() {
      this.dial = false
      this.$emit('cerrar')
    }
  }
}
</script>
