<template>
  <v-dialog v-model="dial" max-width="1100" persistent>
    <v-card class="dialog-card">
      <v-toolbar flat color="primary" dark dense>
        <v-toolbar-title class="mini-title">
          Reporte de Pedidos
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn small color="red" icon @click="exportPDF" :title="'Exportar PDF (A4)'"
          :disabled="loading || !pedidosFiltrados.length">
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-btn>
        <v-btn small color="green" icon @click="exportExcel" :title="'Exportar Excel'"
          :disabled="loading || !pedidosFiltrados.length">
          <v-icon>mdi-file-excel-box</v-icon>
        </v-btn>
        <v-btn small icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pt-4">
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-text-field outlined dense type="date" label="Fecha Inicio" v-model="fechaInicio" hide-details />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field outlined dense type="date" label="Fecha Fin" v-model="fechaFin" hide-details />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select outlined dense :items="tiposPago" item-text="label" item-value="value" label="Tipo de Pago"
              v-model="tipoPago" hide-details />
          </v-col>
          <v-col cols="12" sm="3">
            <v-btn color="primary" block @click="buscarPedidos" :loading="loading">
              <v-icon left>mdi-magnify</v-icon>
              Buscar
            </v-btn>
          </v-col>
        </v-row>

        <v-row dense class="mt-3" v-if="pedidosFiltrados.length">
          <v-col cols="6" sm="3">
            <v-card outlined class="pa-2 text-center">
              <div class="caption grey--text">Total Pedidos</div>
              <div class="subtitle-1 font-weight-bold">{{ resumen.totalPedidos }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card outlined class="pa-2 text-center">
              <div class="caption grey--text">Monto Total</div>
              <div class="subtitle-1 font-weight-bold green--text">{{ moneda }} {{ number2(resumen.montoTotal) }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card outlined class="pa-2 text-center blue lighten-5">
              <div class="caption grey--text">Contado</div>
              <div class="subtitle-1 font-weight-bold blue--text">{{ moneda }} {{ number2(resumen.montoContado) }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card outlined class="pa-2 text-center orange lighten-5">
              <div class="caption grey--text">Crédito</div>
              <div class="subtitle-1 font-weight-bold orange--text text--darken-2">{{ moneda }} {{
                number2(resumen.montoCredito) }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-simple-table dense class="mt-4" fixed-header height="45vh" v-if="pedidosFiltrados.length">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th class="text-center">Peso (Kg)</th>
              <th class="text-center">Cond. Pago</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pedido in pedidosFiltrados" :key="pedido.id">
              <td class="caption">{{ pedido.id }}</td>
              <td class="caption">{{ pedido.doc_numero }} - {{ pedido.cliente_nombre }}</td>
              <td class="caption">{{ pedido.cod_vendedor }}</td>
              <td class="caption text-center">{{ number2(pedido.peso_total || 0) }}</td>
              <td class="text-center">
                <v-chip x-small :color="pedido.condicion_pago === 'CREDITO' ? 'orange' : 'success'" dark>
                  {{ pedido.condicion_pago || 'CONTADO' }}
                </v-chip>
              </td>
              <td class="caption text-right font-weight-bold">{{ moneda }} {{ number2(pedido.total) }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <div v-else-if="!loading && buscado" class="text-center py-10 grey--text">
          <v-icon size="60" color="grey lighten-1">mdi-file-search-outline</v-icon>
          <div class="mt-2">No se encontraron pedidos con los filtros seleccionados.</div>
        </div>

        <div v-else-if="!loading && !buscado" class="text-center py-10 grey--text">
          <v-icon size="60" color="grey lighten-1">mdi-filter-outline</v-icon>
          <div class="mt-2">Seleccione fechas y tipo de pago, luego presione "Buscar".</div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment'
import { all_pedidos } from '@/db'
import jspdf from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import store from '@/store/index'

export default {
  name: 'DialogoRepPedidos',
  props: {
    value: Boolean
  },
  data() {
    return {
      loading: false,
      buscado: false,
      fechaInicio: moment().format('YYYY-MM-DD'),
      fechaFin: moment().format('YYYY-MM-DD'),
      tipoPago: 'TODOS',
      tiposPago: [
        { label: 'Todos', value: 'TODOS' },
        { label: 'Contado', value: 'CONTADO' },
        { label: 'Crédito', value: 'CREDITO' }
      ],
      pedidosRaw: [],
      moneda: 'S/'
    }
  },
  computed: {
    dial: {
      get() { return this.value },
      set(v) { this.$emit('input', v) }
    },
    pedidosFiltrados() {
      if (this.tipoPago === 'TODOS') {
        return this.pedidosRaw
      }
      return this.pedidosRaw.filter(p => {
        const condicion = (p.condicion_pago || 'CONTADO').toUpperCase()
        return condicion === this.tipoPago
      })
    },
    resumen() {
      const arr = this.pedidosFiltrados.filter(p => (p.estado || '').toLowerCase() !== 'anulado')
      const montoTotal = arr.reduce((acc, p) => acc + Number(p.total || 0), 0)
      const montoContado = arr.filter(p => (p.condicion_pago || 'CONTADO').toUpperCase() === 'CONTADO')
        .reduce((acc, p) => acc + Number(p.total || 0), 0)
      const montoCredito = arr.filter(p => (p.condicion_pago || '').toUpperCase() === 'CREDITO')
        .reduce((acc, p) => acc + Number(p.total || 0), 0)
      return {
        totalPedidos: arr.length,
        montoTotal,
        montoContado,
        montoCredito
      }
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
      }
    }
  },
  methods: {
    cerrar() {
      this.dial = false
    },
    number2(n) {
      return Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    async buscarPedidos() {
      this.loading = true
      this.buscado = true
      this.pedidosRaw = []

      try {
        const inicio = moment(this.fechaInicio).startOf('day').unix()
        const fin = moment(this.fechaFin).endOf('day').unix()

        const snap = await all_pedidos()
          .orderByChild('fecha_emision')
          .startAt(inicio)
          .endAt(fin)
          .once('value')

        const pedidos = []
        snap.forEach(child => {
          const data = child.val()
          if (data && (data.estado || '').toLowerCase() !== 'anulado') {
            pedidos.push({
              id: data.id || child.key,
              doc_numero: data.doc_numero || '',
              cliente_nombre: data.cliente_nombre || '',
              cod_vendedor: data.cod_vendedor || data.id_vendedor || '',
              peso_total: data.peso_total || 0,
              condicion_pago: data.condicion_pago || 'CONTADO',
              total: data.total || 0,
              fecha_emision: data.fecha_emision
            })
          }
        })

        pedidos.sort((a, b) => (b.fecha_emision || 0) - (a.fecha_emision || 0))
        this.pedidosRaw = pedidos
      } catch (error) {
        console.error('Error buscando pedidos:', error)
        store.commit('dialogosnackbar', 'Error al buscar pedidos')
      } finally {
        this.loading = false
      }
    },
    exportPDF() {
      const fechaImpresion = moment().format('DD/MM/YYYY HH:mm')
      const doc = new jspdf({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const lMargin = 10
      const pdfInMM = 210

      doc.setFontSize(14)
      doc.setFont('Helvetica', 'Bold')
      doc.text('REPORTE DE PEDIDOS', pdfInMM / 2, 15, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('Helvetica', '')
      const filtroTexto = `Período: ${moment(this.fechaInicio).format('DD/MM/YYYY')} - ${moment(this.fechaFin).format('DD/MM/YYYY')} | Tipo: ${this.tipoPago}`
      doc.text(filtroTexto, pdfInMM / 2, 22, { align: 'center' })

      doc.setFontSize(8)
      doc.text('Impreso: ' + fechaImpresion, pdfInMM - lMargin, 10, { align: 'right' })

      doc.setFontSize(9)
      doc.setFont('Helvetica', 'Bold')
      const resumenTexto = `Total: ${this.moneda} ${this.number2(this.resumen.montoTotal)} | Contado: ${this.moneda} ${this.number2(this.resumen.montoContado)} | Crédito: ${this.moneda} ${this.number2(this.resumen.montoCredito)} | Pedidos: ${this.resumen.totalPedidos}`
      doc.text(resumenTexto, pdfInMM / 2, 28, { align: 'center' })

      const rows = this.pedidosFiltrados.map(p => [
        p.id,
        `${p.doc_numero} - ${p.cliente_nombre}`,
        p.cod_vendedor,
        this.number2(p.peso_total || 0),
        p.condicion_pago || 'CONTADO',
        `${this.moneda} ${this.number2(p.total)}`
      ])

      doc.autoTable({
        startY: 33,
        margin: { left: lMargin, right: lMargin },
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: 120,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 75, halign: 'left' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 28, halign: 'center' }
        },
        head: [['Código', 'Cliente', 'Vendedor', 'Peso (Kg)', 'Cond. Pago', 'Total']],
        body: rows,
        didParseCell: function (data) {
          if (data.row.section === 'body') {
            data.cell.styles.fillColor = [255, 255, 255];
          }
        }
      })

      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('Helvetica', '')
        doc.text(`Página ${i} de ${pageCount}`, pdfInMM - lMargin, 290, { align: 'right' })
      }

      window.open(doc.output('bloburl'))
    },
    exportExcel() {
      const rows = this.pedidosFiltrados.map(p => ({
        'ID': p.id,
        'Documento': p.doc_numero,
        'Cliente': p.cliente_nombre,
        'Vendedor': p.cod_vendedor,
        'Peso (KG)': Number(p.peso_total || 0),
        'Condición Pago': p.condicion_pago || 'CONTADO',
        'Total': Number(p.total || 0)
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')

      const fileName = `Reporte_Pedidos_${moment(this.fechaInicio).format('DDMMYYYY')}_${moment(this.fechaFin).format('DDMMYYYY')}.xlsx`
      XLSX.writeFile(wb, fileName)
    }
  }
}
</script>

<style scoped>
.dialog-card {
  border-radius: 8px;
}

.mini-title {
  font-size: 0.95rem;
}
</style>
