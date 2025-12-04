<template>
  <v-dialog v-model="dial" max-width="480px" persistent>
    <div>
      <v-system-bar window dark>
        <v-icon @click="cierra()">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <span class="mr-3">Tipo de cambio</span>
      </v-system-bar>
    </div>

    <v-card class="pa-5">
      <!-- Loader superior -->
      <v-progress-linear v-if="loading" indeterminate height="3" class="mb-3" />

      <!-- Fecha -->
      <v-row dense>
        <v-col cols="12">
          <v-text-field type="date" label="Fecha" outlined dense v-model="fecha" @change="cargarPorFecha" />
        </v-col>
      </v-row>

      <!-- Moneda / Compra / Venta -->
      <v-row dense>
        <v-col cols="4">
          <v-text-field label="Moneda" outlined dense v-model="moneda" disabled />
        </v-col>

        <v-col cols="4">
          <v-text-field label="Compra" outlined dense v-model="compra" type="number" step="0.0001" />
        </v-col>

        <v-col cols="4">
          <v-text-field label="Venta" outlined dense v-model="venta" type="number" step="0.0001" />
        </v-col>
      </v-row>

      <!-- Botones -->
      <v-row class="mt-2" dense>
        <v-col cols="6">
          <v-btn block depressed @click="cargarPorFecha">
            Recargar
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn block color="success" depressed :disabled="!esValido" @click="guardar">
            Guardar
          </v-btn>
        </v-col>
      </v-row>

      <!-- Historial simple -->
      <v-divider class="my-3" />

      <h5 class="mb-1" style="font-size: 13px;">Últimos tipos de cambio</h5>

      <v-simple-table dense height="160px" fixed-header>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left" style="font-size: 11px;">Fecha</th>
              <th class="text-left" style="font-size: 11px;">Compra</th>
              <th class="text-left" style="font-size: 11px;">Venta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in historial" :key="row.fecha" @click="seleccionarFecha(row)" style="cursor: pointer;">
              <td style="font-size: 11px;">{{ row.fecha }}</td>
              <td style="font-size: 11px;">{{ row.compra }}</td>
              <td style="font-size: 11px;">{{ row.venta }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment'
import { grabaTipoCambio, all_TipoCambio, consulta_TipoCambio } from '../../db'
import store from '@/store/index'

export default {
  name: 'dialogoTipoCambio',
  data() {
    return {
      dial: false,
      fecha: moment().format('YYYY-MM-DD'),
      moneda: 'USD',
      compra: '',
      venta: '',
      historial: [],
      loading: false,
    }
  },
  created() {
    this.dial = true
    this.cargarPorFecha()
    this.cargarHistorial()
  },
  computed: {
    esValido() {
      return (
        this.fecha &&
        this.compra !== '' &&
        this.venta !== '' &&
        !isNaN(this.compra) &&
        !isNaN(this.venta)
      )
    },
  },
  methods: {
    cierra() {
      this.$emit('cierra', false)
      this.dial = false
    },

    async cargarPorFecha() {
      try {
        this.loading = true
        const snap = await consulta_TipoCambio(this.fecha).once('value')
        if (snap.exists()) {
          const data = snap.val()
          this.moneda = data.moneda || 'USD'
          this.compra = data.compra
          this.venta = data.venta
        } else {
          // No hay registro para esa fecha: limpio valores
          this.moneda = 'USD'
          this.compra = ''
          this.venta = ''
        }
      } catch (e) {
        console.error('Error al cargar tipo de cambio:', e)
      } finally {
        this.loading = false
      }
    },

    async cargarHistorial() {
      try {
        this.loading = true
        // últimos 15 registros ordenados por fecha (key)
        const snap = await all_TipoCambio().orderByKey().limitToLast(15).once('value')
        const arr = []
        snap.forEach(child => {
          const val = child.val() || {}
          arr.push({
            fecha: child.key,
            compra: val.compra,
            venta: val.venta,
          })
        })
        // los más recientes arriba
        this.historial = arr.reverse()
      } catch (e) {
        console.error('Error al cargar historial de tipo de cambio:', e)
      } finally {
        this.loading = false
      }
    },

    seleccionarFecha(row) {
      this.fecha = row.fecha
      this.compra = row.compra
      this.venta = row.venta
    },

    async guardar() {
      if (!this.esValido) return

      const dato = {
        fecha: this.fecha,
        moneda: this.moneda || 'USD',
        compra: parseFloat(this.compra),
        venta: parseFloat(this.venta),
      }

      try {
        this.loading = true
        await grabaTipoCambio(this.fecha, dato)

        // opcional: guardar en store para usar en toda la app
        try {
          store.commit('tipo_cambio', dato)
        } catch (e) {
          // si no existe la mutación, no pasa nada
        }

        // refresco historial
        await this.cargarHistorial()
        // pequeño feedback
        alert('Tipo de cambio guardado correctamente')
      } catch (e) {
        console.error('Error al guardar tipo de cambio:', e)
        alert('Error al guardar tipo de cambio')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
