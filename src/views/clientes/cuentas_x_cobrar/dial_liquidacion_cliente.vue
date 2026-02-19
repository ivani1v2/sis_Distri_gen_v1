<template>
  <v-dialog :value="value" max-width="650" persistent scrollable @input="$emit('input', $event)" @click:outside.prevent>
    <v-card class="rounded-lg">
      <v-toolbar color="success" dark dense>
        <v-btn icon @click="cerrar" color="red"><v-icon>mdi-close</v-icon></v-btn>
        <v-toolbar-title>Liquidación de Crédito</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-icon color="red" @click.prevent="eliminarCuenta">mdi-delete</v-icon>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row dense class="mb-2">
          <v-col cols="6">
            <h4 class="font-weight-medium">Comprobante: <span class="blue-grey--text text--darken-2">{{ cuentaLocal.doc_ref }}</span></h4>
          </v-col>
          <v-col cols="6" class="text-right">
            <h4 class="font-weight-medium">Vence: <span class="red--text text--darken-1">{{ conviertefecha(cuentaLocal.fecha_vence) }}</span></h4>
          </v-col>
        </v-row>
        <h4 class="mb-2">Cliente: <span class="blue-grey--text text--darken-2">{{ cuentaLocal.nombre }}</span></h4>
        <h4 class="mb-4">Total Pendiente: <span class="red--text text--darken-2">{{ monedaSimbolo }}{{ redondear(cuentaLocal.monto_pendiente) }}</span></h4>

        <v-card outlined class="pa-2 mb-4">
          <h5 class="text-subtitle-2 mb-1">Cronograma de pago</h5>

          <v-alert v-if="descuadreCronograma" type="warning" border="left" colored-border icon="mdi-alert-circle" class="mb-3">
            <div class="font-weight-medium">
              El total de las cuotas (<strong>{{ moneda }}{{ redondear(sumaCuotas) }}</strong>) no coincide con el monto total del crédito (<strong>{{ moneda }}{{ redondear(cuentaLocal.monto_total) }}</strong>).
            </div>
            <div class="mt-1">Es necesario agregar una nueva cuota para completar el cronograma.</div>
            <template v-slot:append>
              <v-btn small color="primary" @click="abrirNuevaCuota">
                <v-icon left small>mdi-plus-circle</v-icon> Agregar cuota
              </v-btn>
            </template>
          </v-alert>

          <v-simple-table fixed-header dense height="250px">
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left text-caption">Estado</th>
                  <th class="text-left text-caption">Monto</th>
                  <th class="text-left text-caption">Fecha</th>
                  <th class="text-left text-caption">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in cuentaLocal.datos" :key="index">
                  <td>
                    <v-chip x-small :color="chipColor(item.estado)" dark>{{ item.estado }}</v-chip>
                  </td>
                  <td class="font-weight-bold">{{ monedaSimbolo }}{{ redondear(item.monto) }}</td>
                  <td>
                    <v-chip small color="grey lighten-4" class="font-weight-bold">{{ conviertefecha(item.fecha_vence) }}</v-chip>
                    <v-chip v-if="item.estado === 'PAGADO'" color="info" x-small>PAGADO {{ conviertefecha(item.fecha_pagado) }}</v-chip>
                  </td>
                  <td>
                    <v-menu offset-y>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn icon v-bind="attrs" v-on="on"><v-icon>mdi-dots-vertical</v-icon></v-btn>
                      </template>
                      <v-list dense>
                        <v-list-item @click="abonarCuota(index)" :disabled="item.estado === 'PAGADO'">
                          <v-list-item-icon><v-icon color="green">mdi-cash-plus</v-icon></v-list-item-icon>
                          <v-list-item-title>Abonar</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="imprime_constancia(item)" v-if="item.estado == 'PAGADO'">
                          <v-list-item-icon><v-icon color="warning">mdi-printer</v-icon></v-list-item-icon>
                          <v-list-item-title>Imprime Constancia</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="editarCuota(item, index)" :disabled="item.estado === 'PAGADO'">
                          <v-list-item-icon><v-icon color="blue">mdi-pencil</v-icon></v-list-item-icon>
                          <v-list-item-title>Editar</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="eliminarCuota(index)">
                          <v-list-item-icon><v-icon color="red">mdi-delete</v-icon></v-list-item-icon>
                          <v-list-item-title>Eliminar</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card>
      </v-card-text>
    </v-card>

    <d_amortiza v-if="dialog_amortiza" :item_selecto="cuentaLocal" :item_selecto_cuota_index="item_selecto_cuota_index"
      :moneda="monedaSimbolo" @actualizar-item="actualizarDespuesDeAbono" @cerrar="cerrarAmortiza" />

    <d_editar v-if="dialog_editar_cuota" :item_selecto="cuentaLocal" :cuota_edit_index="cuota_edit_index"
      :cuota_edit_monto="cuota_edit_monto" :cuota_edit_fecha_str="cuota_edit_fecha_str"
      @actualizar-item="actualizarItem" @cerrar="dialog_editar_cuota = false" />

    <d_nueva_cuota v-if="dialog_nueva_cuota" :item_selecto="cuentaLocal" @actualizar-item="actualizarItem"
      @cerrar="dialog_nueva_cuota = false" />
  </v-dialog>
</template>

<script>
import moment from 'moment'
import store from '@/store/index'
import { editaCuentaxCobrar } from '../../../db'
import { reporte_liquidacion_cuota } from './formatos_cuentas'
import d_amortiza from './dial_amortiza.vue'
import d_editar from './dial_editar_cuota.vue'
import d_nueva_cuota from './dial_nueva_cuota.vue'

export default {
  name: 'DialLiquidacionCliente',
  components: { d_amortiza, d_editar, d_nueva_cuota },
  props: {
    value: { type: Boolean, default: false },
    cuenta: { type: Object, default: () => ({}) }
  },
  data: () => ({
    dialog_amortiza: false,
    dialog_editar_cuota: false,
    dialog_nueva_cuota: false,
    item_selecto_cuota_index: null,
    cuota_edit_index: null,
    cuota_edit_monto: '',
    cuota_edit_fecha_str: '',
    cuentaLocal: {}
  }),
  watch: {
    cuenta: {
      immediate: true,
      handler(nv) {
        this.cuentaLocal = nv ? JSON.parse(JSON.stringify(nv)) : {}
      }
    }
  },
  computed: {
    moneda() {
      return this.cuentaLocal?.moneda || 'S/'
    },
    monedaSimbolo() {
      return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ '
    },
    sumaCuotas() {
      if (!this.cuentaLocal?.datos) return 0
      return this.cuentaLocal.datos.reduce((acc, it) => acc + (parseFloat(it.monto) || 0), 0)
    },
    descuadreCronograma() {
      if (!this.cuentaLocal) return false
      const totalCredito = parseFloat(this.cuentaLocal.monto_total) || 0
      return Math.abs(totalCredito - this.sumaCuotas) > 0.01
    }
  },
  methods: {
    // Utilidades
    conviertefecha(date) {
      return date ? moment.unix(date).format('DD/MM/YY') : '--'
    },
    redondear(valor) {
      return parseFloat(valor || 0).toFixed(store.state.configuracion?.decimal || 2)
    },
    chipColor(estado) {
      const colores = { ABONO: 'blue', PENDIENTE: 'orange', PAGADO: 'green' }
      return colores[estado] || 'grey'
    },

    // Acciones de cuotas
    abonarCuota(index) {
      this.item_selecto_cuota_index = index
      this.dialog_amortiza = true
    },
    editarCuota(item, index) {
      this.cuota_edit_index = index
      this.cuota_edit_monto = item.monto
      this.cuota_edit_fecha_str = moment.unix(item.fecha_vence).format('YYYY-MM-DD')
      this.dialog_editar_cuota = true
    },
    async eliminarCuota(index) {
      if (!this.cuentaLocal?.datos) return
      const monto = this.redondear(this.cuentaLocal.datos[index].monto)
      if (!confirm(`¿Eliminar esta cuota de ${this.monedaSimbolo}${monto}?`)) return

      const datos = [...this.cuentaLocal.datos]
      datos.splice(index, 1)
      await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'datos', datos)
      this.cuentaLocal.datos = datos
      this.$emit('actualizar', this.cuentaLocal)
    },
    imprime_constancia(cuota) {
      if (!this.cuentaLocal) return alert('No hay un crédito seleccionado.')
      const pagos = Array.isArray(cuota.pagos) ? cuota.pagos : []
      reporte_liquidacion_cuota(this.cuentaLocal, cuota, pagos)
    },
    abrirNuevaCuota() {
      if (!this.cuentaLocal) return alert('No hay un crédito seleccionado.')
      this.dialog_nueva_cuota = true
    },

    async eliminarCuenta() {
      if (!confirm(`¿Eliminar la cuenta del cliente ${this.cuentaLocal.nombre} (${this.cuentaLocal.doc_ref})?`)) return
      
      store.commit('dialogoprogress', 1)
      try {
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'estado', 'ELIMINADO')
        alert('Cuenta eliminada correctamente.')
        this.$emit('actualizar', { ...this.cuentaLocal, estado: 'ELIMINADO' })
        this.cerrar()
      } catch (error) {
        console.error('Error al eliminar:', error)
        alert('Ocurrió un error al eliminar.')
      } finally {
        store.commit('dialogoprogress', 1)
      }
    },

    actualizarItem(nuevo) {
      this.dialog_amortiza = false
      this.dialog_editar_cuota = false
      this.dialog_nueva_cuota = false
      this.cuentaLocal = nuevo
      this.item_selecto_cuota_index = null
      this.$emit('actualizar', nuevo)
    },
    actualizarDespuesDeAbono(nuevo) {
      this.cuentaLocal = nuevo
      this.$emit('actualizar', nuevo)
    },
    cerrarAmortiza() {
      this.dialog_amortiza = false
      this.item_selecto_cuota_index = null
    },
    cerrar() {
      this.$emit('input', false)
      this.$emit('cerrar')
    }
  }
}
</script>