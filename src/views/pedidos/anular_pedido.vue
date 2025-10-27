<template>
  <v-dialog v-model="dial" max-width="550px" height="85vh" persistent>
    <div>
      <v-system-bar window dark>
        <v-icon @click="cierra()">mdi-close</v-icon>
        <v-spacer></v-spacer>
      </v-system-bar>
    </div>

    <v-card>
      <v-card-text class="pt-4">
        <v-form ref="form" v-model="formOk" lazy-validation>
          <v-row dense>
            <!-- Tipo de documento -->
            <v-col cols="12">
              <v-select
                dense
                outlined
                hide-details="auto"
                label="Tipo de documento"
                :items="tiposItems"
                item-text="text"
                item-value="value"
                v-model="tipoDoc"
                :rules="[v => !!v || 'Requerido']"
              />
            </v-col>

            <!-- Correlativo solo número -->
            <v-col cols="12">
              <v-text-field
                dense
                outlined
                hide-details="auto"
                label="Correlativo (solo número)"
                v-model="correlativo"
                :rules="[
                  v => !!v || 'Requerido',
                  v => /^[0-9]{1,8}$/.test((v || '')) || 'Solo dígitos (máx. 8)'
                ]"
                placeholder="Ej: 365"
                @input="soloNumeros"
              />
              <div class="caption grey--text text--darken-1 mt-1" v-if="idDocumentoCompleto">
                Se buscará: <strong>{{ idDocumentoCompleto }}</strong>
              </div>

              <!-- Preview / feedback de búsqueda -->
              <v-skeleton-loader type="text" v-if="buscando" class="mt-2" />
              <v-card v-else-if="preview" outlined class="mt-2 pa-2">
                <div class="text-subtitle-2 grey--text text--darken-1 mb-1">
                  Documento encontrado
                </div>
                <div class="d-flex justify-space-between">
                  <div>
                    <div class="font-weight-medium">{{ preview.id_documento }}</div>
                    <div class="text-truncate">Cliente: {{ preview.cliente }}</div>
                  </div>
                  <div class="text-right">
                    <div class="grey--text text--darken-1 caption">Total</div>
                    <div class="font-weight-bold">S/. {{ Number(preview.total).toFixed(2) }}</div>
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- Motivo -->
            <v-col cols="12">
              <v-textarea
                dense
                outlined
                auto-grow
                rows="2"
                label="Motivo de anulación"
                v-model="motivo"
                :rules="[v => !!(v && v.trim().length) || 'Indica el motivo']"
                counter="200"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cierra()">Cancelar</v-btn>
        <v-btn
          color="red darken-1"
          dark
          depressed
          :loading="loading"
          :disabled="!formOk || loading"
          @click="guardar"
        >
          Anular documento
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import store from '@/store/index'
import axios from 'axios'
import { all_pedidos, detalle_pedido } from '../../db'

export default {
  name: 'anular_pedido',
  props: {},
  data() {
    return {
      dial: false,
      tiposItems: [
        { text: 'Ticket (Nota de venta)', value: 'T' }, // usa series.ticket
        { text: 'Boleta', value: 'B' }, // usa series.boleta
        { text: 'Factura', value: 'F' }, // usa series.factura
      ],
      tipoDoc: 'T',     // por defecto
      correlativo: '',  // usuario ingresa solo número (1..8 dígitos)
      motivo: '',
      loading: false,
      formOk: false,

      // 🔹 Cambios mínimos añadidos:
      preview: null,         // { id, id_documento, cliente, total, raw }
      buscando: false,
    }
  },
  created() {
    this.dial = true
  },
  computed: {
    series() {
      // ejemplo: { boleta:'BD01', factura:'FD01', ticket:'TD01', ... }
      return store.state.seriesdocumentos || {}
    },
    serieSeleccionada() {
      // Mapea tipoDoc -> serie
      if (this.tipoDoc === 'B') return this.series.boleta || ''
      if (this.tipoDoc === 'F') return this.series.factura || ''
      // 'T' ticket / nota
      return this.series.ticket || ''
    },
    correlativoPadded() {
      // completa a 8 dígitos
      const n = String(this.correlativo || '').replace(/\D/g, '')
      if (!n) return ''
      return n.padStart(8, '0')
    },
    idDocumentoCompleto() {
      if (!this.serieSeleccionada || !this.correlativoPadded) return ''
      return `${this.serieSeleccionada}-${this.correlativoPadded}`
    }
  },
  watch: {
    // 🔹 Al cambiar serie+correlativo, buscar preview automáticamente
    idDocumentoCompleto: {
      immediate: true,
      handler() {
        this.buscarPreview()
      }
    }
  },
  methods: {
    cierra() {
      this.$emit('cerrar', false)
    },
    soloNumeros(v) {
      // fuerza solo dígitos y limita a 8
      this.correlativo = String(v || '').replace(/\D/g, '').slice(0, 8)
    },

    // 🔹 Busca el pedido y llena preview (cliente + total)
    async buscarPreview() {
      const iddoc = this.idDocumentoCompleto
      this.preview = null
      if (!iddoc) return

      try {
        this.buscando = true
        const snap = await all_pedidos()
          .orderByChild('id_documento')
          .equalTo(iddoc)
          .limitToFirst(1)
          .once('value')

        if (!snap.exists()) return

        const obj = snap.val() || {}
        const firstKey = Object.keys(obj)[0]
        const p = obj[firstKey]

        const cliente =
          (p?.cliente && (p.cliente.nombre || p.cliente.razon_social)) ||
          p?.nombre_cliente || p?.cliente_nombre || p?.nombre || '—'

        const total =
          Number(p?.total) ||
          Number(p?.total_pagar) ||
          Number(p?.totaltotal) ||
          Number(p?.importe_total) ||
          0

        this.preview = {
          id: p?.id,
          id_documento: p?.id_documento,
          cliente,
          total,
          raw: p
        }
      } catch (e) {
        console.error('buscarPreview', e)
      } finally {
        this.buscando = false
      }
    },

    async guardar() {
      const ok = this.$refs.form && this.$refs.form.validate()
      if (!ok) return

      if (!this.idDocumentoCompleto) {
        store.commit?.('dialogosnackbar', 'Serie/correlativo inválidos ❌')
        return
      }

      // Si no hay preview (no buscado o no encontrado), intenta buscar ahora
      if (!this.preview) {
        await this.buscarPreview()
        if (!this.preview) {
          store.commit?.('dialogosnackbar', 'No se encontró un pedido con ese ID de documento ❌')
          return
        }
      }

      const msg = [
        '¿Confirmas la anulación del documento?',
        `\n• ID: ${this.preview.id_documento}`,
        `• Cliente: ${this.preview.cliente}`,
        `• Total: S/. ${Number(this.preview.total).toFixed(2)}`
      ].join(' ')
      const seguro = window.confirm(msg)
      if (!seguro) return

      this.loading = true
      try {
        // Usar el objeto crudo del preview
        const pedido = this.preview.raw
        if (!pedido || !pedido.id) {
          store.commit?.('dialogosnackbar', 'Pedido inválido o sin ID ❌')
          this.loading = false
          return
        }

        // Ejecutar la anulación completa
        await this.anular(pedido)

        // Feedback OK
        store.commit?.('dialogosnackbar', 'Documento anulado ✅')
        this.cierra()
      } catch (e) {
        console.error(e)
        store.commit?.('dialogosnackbar', 'No se pudo anular ❌')
      } finally {
        this.loading = false
      }
    },

    async anular(pedido) {
      if (!confirm('Seguro de anular el pedido? Se devolverá el stock.')) return

      store.commit('dialogoprogress')

      // 1) Trae detalle para devolver stock
      const snap = await detalle_pedido(pedido.id).once('value')
      const val = snap.val() || []
      const detalle = Array.isArray(val) ? val : Object.values(val)

      // 2) Payload para backend
      const payload = {
        cabecera: {
          ...pedido,
          motivo_anulacion: this.motivo.trim(),
          tipo_doc_anulado: this.tipoDoc,               // 'T' | 'B' | 'F'
          id_documento_anulado: this.idDocumentoCompleto, // ej: TD01-00000365
        },
        detalle,
        control_stock: true,
      }

      // 3) Llamada idempotente
      const idem = `anula-${pedido.id}`
      await axios.post(
        'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
        {
          bd: this.$store.state.baseDatos.bd,
          data: payload,
          metodo: 'anular_pedido',
        },
        { headers: { 'X-Idempotency-Key': idem } }
      )

      store.commit('dialogoprogress')
      this.$emit('anulado', { id: pedido.id, id_documento: pedido.id_documento })
    },
  },
}
</script>
