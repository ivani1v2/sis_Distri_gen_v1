<template>
  <v-dialog :value="value" max-width="650" persistent scrollable @input="$emit('input', $event)" @click:outside.prevent>
    <v-card class="rounded-lg">
      <v-toolbar color="success" dark dense>
        <v-btn icon @click="cerrar" color="red"><v-icon>mdi-close</v-icon></v-btn>
        <v-toolbar-title>Liquidación de Crédito</v-toolbar-title>
        <v-spacer></v-spacer>
        <template v-if="esAdmin">
          <v-btn fab x-small color="blue darken-2" class="mx-1" @click.prevent="abrirEditarPendiente">
            <v-icon small color="white">mdi-pencil</v-icon>
          </v-btn>
          <v-btn v-if="esAdmin" fab x-small color="red accent-4" class="mx-1" @click.prevent="eliminarCuenta">
            <v-icon small color="white">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row dense class="mb-2">
          <v-col cols="6">
            <h4 class="font-weight-medium">Comprobante: <span class="blue-grey--text text--darken-2">{{
              cuentaLocal.doc_ref }}</span></h4>
          </v-col>
          <v-col cols="6" class="text-right">
            <h4 class="font-weight-medium">Vence: <span class="red--text text--darken-1">{{
              conviertefecha(cuentaLocal.fecha_vence) }}</span></h4>
          </v-col>
        </v-row>
        <h4 class="mb-2">Cliente: <span class="blue-grey--text text--darken-2">{{ cuentaLocal.nombre }}</span></h4>
        <h4 class="mb-4">Total Pendiente: <span class="red--text text--darken-2">{{ monedaSimbolo }}{{
          redondear(cuentaLocal.monto_pendiente) }}</span></h4>

        <v-card outlined class="pa-2 mb-4">
          <h5 class="text-subtitle-2 mb-1">Cronograma de pago</h5>

          <v-alert v-if="descuadreCronograma" type="warning" border="left" colored-border icon="mdi-alert-circle"
            class="mb-3">
            <div class="font-weight-medium">
              El total de las cuotas (<strong>{{ moneda }}{{ redondear(sumaCuotas) }}</strong>) no coincide con el monto
              total del crédito (<strong>{{ moneda }}{{ redondear(cuentaLocal.monto_total) }}</strong>).
            </div>
            <div class="mt-1">Es necesario agregar una nueva cuota para completar el cronograma.</div>
            <template v-slot:append>
              <v-btn small color="primary" @click="abrirNuevaCuota">
                <v-icon left small>mdi-plus-circle</v-icon> Agregar cuota
              </v-btn>
            </template>
          </v-alert>

          <v-simple-table fixed-header dense height="400px">
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
                    <v-chip small color="grey lighten-4" class="font-weight-bold">{{ conviertefecha(item.fecha_vence)
                    }}</v-chip>
                    <v-chip v-if="item.estado === 'PAGADO'" color="info" x-small>PAGADO {{
                      conviertefecha(item.fecha_pagado) }}</v-chip>
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
                        <v-list-item @click="item.imagen ? verImagen(item) : adjuntarImagen(item, index)">
                          <v-list-item-icon><v-icon
                              :color="item.imagen ? 'primary' : 'grey'">mdi-camera</v-icon></v-list-item-icon>
                          <v-list-item-title>{{ item.imagen ? 'Ver comprobante' : 'Adjuntar comprobante'
                            }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="imprime_constancia(item)" v-if="item.estado == 'PAGADO'">
                          <v-list-item-icon><v-icon color="warning">mdi-printer</v-icon></v-list-item-icon>
                          <v-list-item-title>Imprime Constancia</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="esAdmin" @click="editarCuota(item, index)" :disabled="!esAdmin">
                          <v-list-item-icon><v-icon color="blue">mdi-pencil</v-icon></v-list-item-icon>
                          <v-list-item-title>Editar</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="esAdmin" @click="eliminarCuota(index)" :disabled="!esAdmin">
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

    <d_amortiza v-show="dialog_amortiza" :item_selecto="cuentaLocal"
      :item_selecto_cuota_index="item_selecto_cuota_index" key="item_selecto_cuota_index" :moneda="monedaSimbolo"
      @actualizar-item="actualizarDespuesDeAbono" @cerrar="cerrarAmortiza" />

    <d_editar v-if="dialog_editar_cuota" :item_selecto="cuentaLocal" :cuota_edit_index="cuota_edit_index"
      :cuota_edit_monto="cuota_edit_monto" :cuota_edit_fecha_str="cuota_edit_fecha_str"
      @actualizar-item="actualizarItem" @cerrar="dialog_editar_cuota = false" />

    <d_nueva_cuota v-if="dialog_nueva_cuota" :item_selecto="cuentaLocal" @actualizar-item="actualizarItem"
      @cerrar="dialog_nueva_cuota = false" />

    <v-dialog v-model="dialog_editar_pendiente" max-width="300" persistent>
      <v-card>
        <v-toolbar color="blue darken-1" dark dense>
          <v-toolbar-title class="subtitle-1">Editar Montos de Cuenta</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog_editar_pendiente = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pt-6">
          <v-text-field v-model="montoTotalEdit" :label="`Monto Total (${monedaSimbolo})`" outlined dense type="number"
            min="0" :error="!!montoTotalError" :error-messages="montoTotalError" />
          <v-text-field v-model="montoPendienteEdit" :label="`Monto Pendiente (${monedaSimbolo})`" outlined dense
            type="number" min="0" :error="!!montoPendienteError" :error-messages="montoPendienteError" class="mb-n5" />
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="dialog_editar_pendiente = false">Cancelar</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="guardandoPendiente" @click="guardarMontoPendiente">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogAdjuntarImagen" max-width="500" persistent>
      <v-card>
        <v-toolbar dark color="primary" dense>
          <v-toolbar-title>Adjuntar comprobante</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="dialogAdjuntarImagen = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <p class="mb-2">Cuota: {{ monedaSimbolo }}{{ redondear(cuotaSeleccionada?.monto) }}</p>
          <p class="mb-3">Vence: {{ conviertefecha(cuotaSeleccionada?.fecha_vence) }}</p>

          <pagos_comprobantes ref="pagosComprobantes" :doc-ref="cuentaLocal.doc_ref"
            :cuota-id="cuotaSeleccionadaIndex" />
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogAdjuntarImagen = false">Cancelar</v-btn>
          <v-btn color="primary" @click="guardarImagenCuota" :loading="guardandoImagen">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogVerImagen" max-width="500" persistent>
      <v-card>
        <v-toolbar dark color="primary" dense>
          <v-toolbar-title>Comprobante de pago</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="dialogVerImagen = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4 text-center">
          <v-img :src="imagenParaVer" contain max-height="500" class="rounded-lg">
            <template v-slot:placeholder>
              <div class="text-center">
                <v-progress-circular indeterminate size="50" color="primary"></v-progress-circular>
                <div class="mt-3 grey--text">
                  <v-icon small>mdi-image</v-icon>
                  <span class="caption ml-1">Cargando imagen...</span>
                </div>
              </div>
            </template>
          </v-img>
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVerImagen = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import pagos_comprobantes from './pagos_comprobantes.vue'

export default {
  name: 'DialLiquidacionCliente',
  components: { d_amortiza, d_editar, d_nueva_cuota, pagos_comprobantes },
  props: {
    value: { type: Boolean, default: false },
    cuenta: { type: Object, default: () => ({}) }
  },
  data: () => ({
    dialog_amortiza: false,
    dialog_editar_cuota: false,
    dialog_nueva_cuota: false,
    dialog_editar_pendiente: false,
    guardandoPendiente: false,
    item_selecto_cuota_index: null,
    cuota_edit_index: null,
    cuota_edit_monto: '',
    cuota_edit_fecha_str: '',
    montoTotalEdit: '',
    montoTotalError: '',
    montoPendienteEdit: '',
    montoPendienteError: '',
    cuentaLocal: {},
    dialogAdjuntarImagen: false,
    dialogVerImagen: false,
    cuotaSeleccionada: null,
    cuotaSeleccionadaIndex: null,
    imagenParaVer: null,
    guardandoImagen: false,
    cargandoImagen: false
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
    },
    esAdmin() {
      return store.state.permisos?.es_admin === true || store.state.permisos?.master === true;
    },
  },
  methods: {
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

    adjuntarImagen(cuota, index) {
      this.cuotaSeleccionada = cuota
      this.cuotaSeleccionadaIndex = index
      this.dialogAdjuntarImagen = true
    },

    verImagen(cuota) {
      if (cuota.imagen?.url) {
        this.imagenParaVer = cuota.imagen.url
        this.dialogVerImagen = true
      }
    },
    async guardarImagenCuota() {
      this.guardandoImagen = true
      try {
        const imagenData = await this.$refs.pagosComprobantes.guardarImagen()
        if (imagenData) {
          const datos = [...this.cuentaLocal.datos]
          datos[this.cuotaSeleccionadaIndex].imagen = imagenData
          await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'datos', datos)
          this.cuentaLocal.datos = datos
          this.$toast?.success?.('Comprobante guardado')
        }
        this.dialogAdjuntarImagen = false
      } catch (error) {
        console.error(error)
        this.$toast?.error?.('Error al guardar imagen')
      } finally {
        this.guardandoImagen = false
      }
    },

    abonarCuota(index) {
      if (!this.cuentaLocal?.datos || !Array.isArray(this.cuentaLocal.datos)) return
      if (!this.cuentaLocal.datos[index]) return
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
      const cuotaEliminada = this.cuentaLocal.datos[index]
      const montoEliminado = parseFloat(cuotaEliminada.monto) || 0
      if (!confirm(`¿Eliminar esta cuota de ${this.monedaSimbolo}${this.redondear(montoEliminado)}?`)) return

      try {
        const datos = [...this.cuentaLocal.datos]
        datos.splice(index, 1)
        let nuevoPagado = parseFloat(this.cuentaLocal.pagado || 0)
        if (cuotaEliminada.estado === 'PAGADO' || cuotaEliminada.estado === 'ABONO') {
          nuevoPagado = Math.max(0, nuevoPagado - montoEliminado)
        }
        const montoTotal = parseFloat(this.cuentaLocal.monto_total) || 0
        const nuevoMontoPendiente = Math.max(0, montoTotal - nuevoPagado)
        const nuevoEstado = nuevoMontoPendiente <= 0 ? 'LIQUIDADO' : 'PENDIENTE'

        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'datos', datos)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'pagado', nuevoPagado)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'monto_pendiente', nuevoMontoPendiente)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'estado', nuevoEstado)

        this.cuentaLocal.datos = datos
        this.cuentaLocal.pagado = nuevoPagado
        this.cuentaLocal.monto_pendiente = nuevoMontoPendiente
        this.cuentaLocal.estado = nuevoEstado
        this.$emit('actualizar', this.cuentaLocal)
      } catch (error) {
        console.error(error)
        alert('Error al eliminar la cuota')
      }
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

    abrirEditarPendiente() {
      const totalActual = parseFloat(this.cuentaLocal?.monto_total || 0)
      const montoActual = parseFloat(this.cuentaLocal?.monto_pendiente || 0)
      this.montoTotalEdit = Number.isFinite(totalActual) ? totalActual.toFixed(store.state.configuracion?.decimal || 2) : '0'
      this.montoPendienteEdit = Number.isFinite(montoActual) ? montoActual.toFixed(store.state.configuracion?.decimal || 2) : '0'
      this.montoTotalError = ''
      this.montoPendienteError = ''
      this.dialog_editar_pendiente = true
    },

    async guardarMontoPendiente() {
      const nuevoMontoTotal = parseFloat(this.montoTotalEdit)
      const nuevoMontoPendiente = parseFloat(this.montoPendienteEdit)

      if (!Number.isFinite(nuevoMontoTotal) || nuevoMontoTotal < 0) {
        this.montoTotalError = 'Ingrese un monto total valido'
        return
      }
      this.montoTotalError = ''

      if (!Number.isFinite(nuevoMontoPendiente) || nuevoMontoPendiente < 0) {
        this.montoPendienteError = 'Ingrese un monto pendiente válido'
        return
      }
      if (nuevoMontoPendiente > nuevoMontoTotal) {
        this.montoPendienteError = 'El pendiente no puede ser mayor al monto total'
        return
      }
      this.montoPendienteError = ''

      const nuevoPagado = Math.max(0, nuevoMontoTotal - nuevoMontoPendiente)
      const nuevoEstado = nuevoMontoPendiente <= 0 ? 'LIQUIDADO' : 'PENDIENTE'

      this.guardandoPendiente = true
      store.commit('dialogoprogress', 1)
      try {
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'monto_total', nuevoMontoTotal)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'monto_pendiente', nuevoMontoPendiente)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'pagado', nuevoPagado)
        await editaCuentaxCobrar(this.cuentaLocal.doc_ref, 'estado', nuevoEstado)

        this.cuentaLocal.monto_total = nuevoMontoTotal
        this.cuentaLocal.monto_pendiente = nuevoMontoPendiente
        this.cuentaLocal.pagado = nuevoPagado
        this.cuentaLocal.estado = nuevoEstado
        this.dialog_editar_pendiente = false
        this.$emit('actualizar', { ...this.cuentaLocal })
        store.commit('dialogosnackbar', 'Montos actualizados')
      } catch (error) {
        console.error(error)
        alert('No se pudo actualizar el monto pendiente')
      } finally {
        this.guardandoPendiente = false
        store.commit('dialogoprogress', 0)
      }
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
        console.error(error)
        alert('Ocurrió un error al eliminar.')
      } finally {
        store.commit('dialogoprogress', 1)
      }
    },

    actualizarItem(nuevo) {
      if (!nuevo?.datos) return
      const totalPagado = nuevo.datos.reduce((acc, cuota) => {
        return acc + ((cuota.estado === 'PAGADO' || cuota.estado === 'ABONO') ? (parseFloat(cuota.monto) || 0) : 0)
      }, 0)
      const montoTotal = parseFloat(nuevo.monto_total) || 0
      nuevo.monto_pendiente = Math.max(0, montoTotal - totalPagado)
      nuevo.pagado = totalPagado
      nuevo.estado = nuevo.monto_pendiente <= 0 ? 'LIQUIDADO' : 'PENDIENTE'

      this.dialog_amortiza = false
      this.dialog_editar_cuota = false
      this.dialog_nueva_cuota = false
      this.cuentaLocal = nuevo
      this.item_selecto_cuota_index = null
      this.$emit('actualizar', nuevo)
    },

    cerrarAmortiza() {
      this.dialog_amortiza = false
      this.item_selecto_cuota_index = null
    },

    actualizarDespuesDeAbono(nuevo) {
      if (!nuevo?.datos) return
      const totalPagado = nuevo.datos.reduce((acc, cuota) => {
        return acc + ((cuota.estado === 'PAGADO' || cuota.estado === 'ABONO') ? (parseFloat(cuota.monto) || 0) : 0)
      }, 0)
      const montoTotal = parseFloat(nuevo.monto_total) || 0
      nuevo.monto_pendiente = Math.max(0, montoTotal - totalPagado)
      nuevo.pagado = totalPagado
      nuevo.estado = nuevo.monto_pendiente <= 0 ? 'LIQUIDADO' : 'PENDIENTE'
      this.cuentaLocal = nuevo
      this.$emit('actualizar', nuevo)
    },

    cerrar() {
      this.$emit('input', false)
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.avatar-active {
  border: 3px solid #1976d2;
  border-radius: 8px;
}
</style>