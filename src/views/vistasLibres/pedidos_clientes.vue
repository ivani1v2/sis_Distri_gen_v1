<template>
  <div class="pedido-publico pa-3">
    <v-card class="mx-auto mt-8" max-width="640" shaped elevation="8">
      <v-card-title class="justify-space-between">
        <div>
          <div class="text-h6">Pedido {{ pedidoId }}</div>
          <div class="text-caption grey--text">Base: {{ bd }}</div>
        </div>
        <v-chip small :color="error ? 'red' : 'green'" dark>
          {{ error ? 'No disponible' : 'Disponible' }}
        </v-chip>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-alert v-if="error" type="error" dense outlined>
          {{ error }}
        </v-alert>

        <div v-else>
          <div class="mb-3 text-body-2">
            <strong>Cliente:</strong> {{ cabecera.cliente_nombre || '-' }}
          </div>
          <div class="mb-3 text-body-2">
            <strong>Total:</strong> {{ cabecera.moneda || 'S/' }} {{ cabecera.total || '0.00' }}
          </div>

          <v-radio-group v-model="medida" row dense hide-details>
            <v-radio label="A4" value="A4"></v-radio>
            <v-radio label="80mm" value="80"></v-radio>
            <v-radio label="58mm" value="58"></v-radio>
          </v-radio-group>

          <v-row dense class="mt-3">
            <v-col cols="12" sm="6">
              <v-btn block color="primary" :loading="loadingPdf" @click="generarPdf('abre')">
                Ver PDF
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6">
              <v-btn block color="success" :loading="loadingPdf" @click="generarPdf('descarga')">
                Descargar PDF
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import imageToBase64 from 'image-to-base64/browser'
import store from '@/store/index'
import { obtenerBD, consultaArchivo, obtenerImpresoras, buscaPedidoCabeceraBd, buscaPedidoDetalleBd } from '@/db'
import { pdfGenera } from '@/views/pedidos/formatos/orden_pedido.js'

export default {
  name: 'PedidosClientes',
  data() {
    return {
      bd: '',
      pedidoId: '',
      medida: '80',
      loading: false,
      loadingPdf: false,
      error: '',
      cabecera: {},
      detalle: []
    }
  },
  async created() {
    this.bd = String(this.$route.params.bd || '').trim()
    this.pedidoId = String(this.$route.params.id || '').trim()

    if (!this.bd || !this.pedidoId) {
      this.error = 'Parámetros inválidos del enlace.'
      return
    }

    this.loading = true
    try {
      await this.inicializarEmpresa()
      await this.cargarPedido()
    } catch (e) {
      this.error = 'No se pudo cargar el pedido.'
      console.error('Error cargando pedido público:', e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async inicializarEmpresa() {
      const empresaSnap = await obtenerBD(this.bd).once('value')
      if (!empresaSnap.exists()) {
        this.error = 'La base indicada no existe.'
        return
      }

      store.commit('BD', empresaSnap.val())

      const impresorasSnap = await obtenerImpresoras().once('value')
      if (impresorasSnap.exists()) {
        store.commit('configImpresora', impresorasSnap.val())
      }

      const archivoSnap = await consultaArchivo().once('value')
      const logoUrl = archivoSnap.val()?.logoEmpresa
      if (logoUrl) {
        try {
          const base64 = await imageToBase64(logoUrl)
          store.commit('logoempresa', base64)
        } catch (e) {
          console.warn('No se pudo cargar logo para vista pública')
        }
      }
    },

    async cargarPedido() {
      const cabeceraSnap = await buscaPedidoCabeceraBd(this.bd, this.pedidoId).once('value')
      if (!cabeceraSnap.exists()) {
        this.error = 'No se encontró el pedido solicitado.'
        return
      }

      const detalleSnap = await buscaPedidoDetalleBd(this.bd, this.pedidoId).once('value')
      const detalleData = detalleSnap.val()

      this.cabecera = { id: this.pedidoId, ...cabeceraSnap.val() }
      this.detalle = this.normalizarDetalle(detalleData)
    },

    normalizarDetalle(detalle) {
      if (Array.isArray(detalle)) {
        return detalle.filter(Boolean)
      }
      if (detalle && typeof detalle === 'object') {
        return Object.values(detalle)
      }
      return []
    },

    async generarPdf(modo) {
      if (this.error) return

      this.loadingPdf = true
      try {
        await pdfGenera(this.cabecera, this.detalle, this.medida, modo)
      } catch (e) {
        console.error('Error generando PDF de pedido público:', e)
        this.error = 'No se pudo generar el PDF del pedido.'
      } finally {
        this.loadingPdf = false
      }
    }
  }
}
</script>

<style scoped>
.pedido-publico {
  min-height: 100vh;
  background: linear-gradient(145deg, #f4f6f8 0%, #eaf0f5 100%);
}
</style>
