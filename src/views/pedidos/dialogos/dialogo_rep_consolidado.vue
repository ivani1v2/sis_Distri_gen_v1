<template>
  <div class="dialogs-root">
    <v-dialog v-model="dial" max-width="1100" persistent>
      <v-card class="dialog-card">
        <v-toolbar flat color="indigo" dark dense>
          <v-toolbar-title class="mini-title">
            # Pedidos : {{ safeSelectedIds.length }} — S/.{{ number2(totalSoles) }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn small icon @click="grafDial = true" :title="'Ver gráfico (Top 5 + Otros)'">
            <v-icon>mdi-chart-donut</v-icon>
          </v-btn>
          <v-btn small color="red" icon @click="exportPDF" :title="'Exportar A4 (PDF)'">
            <v-icon>mdi-file-pdf-box</v-icon>
          </v-btn>
          <v-btn small icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-tabs v-model="tab" background-color="grey lighten-4" grow>
          <v-tab>Más Vendido</v-tab>
          <v-tab>Más Valor</v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab" class="table-scroll">
          <v-tab-item>
            <div class="pa-3">
              <v-simple-table dense class="mt-4">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Total S/.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, i) in listaVendidos" :key="'v-' + i">
                    <td style="font-size:75%;">{{ g.codigo }} - {{ g.nombre }}</td>
                    <!-- 👇 si factor==1 -> solo unds; si >1 -> packs/unds -->
                    <td style="font-size:75%;">
                      <span class="cant-click" @click="verClientes(g)">{{ g.cantDisplay }}</span>
                    </td>
                    <td style="font-size:75%;">S/.{{ number2(g.precioUnitProm) }}</td>
                    <td style="font-size:75%;">S/.{{ number2(g.total) }}</td>
                  </tr>
                  <tr v-if="agrupadoPorProducto.length === 0">
                    <td colspan="4" class="text-center grey--text py-6">No hay ítems para mostrar.</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
          </v-tab-item>

          <v-tab-item>
            <div class="pa-3">
              <v-simple-table dense class="mt-4">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, i) in listaValor" :key="'m-' + i">
                    <td style="font-size:75%;">{{ g.nombre }}</td>
                    <!-- 👇 mismo criterio -->
                    <td style="font-size:75%;">
                      <span class="cant-click" @click="verClientes(g)">{{ g.cantDisplay }}</span>
                    </td>
                    <td style="font-size:75%;">S/.{{ number2(g.total) }}</td>
                  </tr>
                  <tr v-if="agrupadoPorProducto.length === 0">
                    <td colspan="3" class="text-center grey--text py-6">No hay ítems para mostrar.</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-dialog>
    <v-dialog v-model="clientesDial" max-width="600">
      <v-card>
        <v-toolbar flat color="indigo" dark dense>
          <v-toolbar-title class="mini-title">Clientes — {{ clientesDe }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="clientesDial = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-simple-table dense>
            <thead>
              <tr>
                <th>Cliente</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in clientesLista" :key="i">
                <td>{{ c }}</td>
              </tr>
              <tr v-if="!clientesLista.length">
                <td class="grey--text text--darken-1">Sin datos</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-dialog>


    <v-dialog v-model="grafDial" max-width="900">
      <v-card>
        <v-toolbar flat color="indigo" dark dense>
          <v-toolbar-title class="mini-title">Gráfico (Top 5 + Otros)</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="grafDial = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-tabs v-model="grafTab" background-color="grey lighten-4" grow>
          <v-tab>Cantidad</v-tab>
          <v-tab>Valor (S/.)</v-tab>
        </v-tabs>

        <v-tabs-items v-model="grafTab">
          <v-tab-item>
            <div class="pa-4">
              <DoughnutBasic :labels="top5CantLabels" :values="top5CantValues" />
            </div>
          </v-tab-item>
          <v-tab-item>
            <div class="pa-4">
              <DoughnutBasic :labels="top5ValorLabels" :values="top5ValorValues" />
            </div>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import store from '@/store'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, DoughnutController } from "chart.js"
import { exportConsolidadoPDF } from "../formatos/rep_consolidado"
ChartJS.register(Title, Tooltip, Legend, ArcElement, DoughnutController)

const DoughnutBasic = {
  name: "DoughnutBasic",
  props: { labels: Array, values: Array },
  data() { return { chart: null } },
  render(h) { return h("div", { style: { height: "250px" } }, [h("canvas", { ref: "canvas" })]) },
  methods: {
    draw() {
      const canvas = this.$refs.canvas; if (!canvas) return
      const ctx = canvas.getContext("2d"); if (this.chart) this.chart.destroy()
      this.chart = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: this.labels || [],
          datasets: [{
            data: (this.values || []).map(v => Number(v || 0)),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800", "#9C27B0", "#26C6DA", "#7E57C2", "#66BB6A", "#EF5350"]
              .slice(0, (this.labels || []).length)
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
      })
    }
  },
  watch: { labels() { this.$nextTick(this.draw) }, values() { this.$nextTick(this.draw) } },
  mounted() { this.draw() }, beforeDestroy() { if (this.chart) this.chart.destroy() }
}

export default {
  name: "ConsolidadoPedidosSeleccionados",
  components: { DoughnutBasic },
  props: {
    selectedIds: Array,
    consolidadoSeleccionados: Array
  },
  data() {
    return {
      dial: true,
      tab: 0,
      grafDial: false,
      grafTab: 0,
      clientesDial: false, clientesDe: '', clientesLista: []
    }
  },
  created() {
    console.log('Selected IDs:', this.consolidadoSeleccionados)
  },
  computed: {
    clientesPorProducto() {
      // clave usada en el agrupado: `${codigo}#${nombre}`
      const map = new Map()
      const push = (k, val) => {
        if (!map.has(k)) map.set(k, new Set())
        map.get(k).add(val)
      }
      (this.safeConsolidado || []).forEach(r => {
        const key = (r.codigo ? `${String(r.codigo).trim()}#` : '') + String(r.nombre || '')
        const cli = String(r.cliente || '').trim()
        if (cli) push(key, cli)
      })
      // Set -> Array
      const out = new Map()
      map.forEach((set, k) => out.set(k, Array.from(set)))
      return out
    },

    factorIndex() {
      const idx = Object.create(null)
      const cat = Array.isArray(store?.state?.productos) ? store.state.productos : []
      for (const p of cat) {
        const id = String(p?.id ?? '').trim()
        if (!id) continue
        const f = Number(p?.factor ?? p?.factor_unidad ?? 0)
        if (Number.isFinite(f) && f > 0) idx[id] = f
      }
      return idx
    },

    totalSoles() {
      return this.safeConsolidado.reduce((s, r) => s + Number(r.total_linea ?? r.total ?? 0), 0)
    },
    safeSelectedIds() { return Array.isArray(this.selectedIds) ? this.selectedIds : [] },
    safeConsolidado() { return Array.isArray(this.consolidadoSeleccionados) ? this.consolidadoSeleccionados : [] },

    isUnidad() { return (m) => /^(und|unidad|uni|u)$/i.test(String(m || '').trim()) },

    inferFactor() {
      const rx = /(pq[-\s]?(\d+))|(paquetex(\d+))|(?:[^a-z]x\s*(\d+))/i
      return (nombre, medida) => {
        const s = `${String(nombre || '')} ${String(medida || '')}`
        const m = s.match(rx); if (!m) return null
        return Number(m[2] || m[4] || m[5]) || null
      }
    },

    agrupadoPorProducto() {
      const map = new Map()
      const r2 = (v) => Math.round(Number(v || 0) * 100) / 100

      this.safeConsolidado.forEach(r => {
        const key = (r.codigo ? `${r.codigo}#` : "") + String(r.nombre || '')
        const cant = Number(r.cantidad || 0)
        const tot = r2(r.total_linea ?? r.total ?? (Number(r.precio || 0) * cant))
        const medida = String(r.medida || '').trim()
        const codigo = String(r.codigo || '').trim()
        const operacion = String(r.operacion || '').trim().toUpperCase()
        if (!map.has(key)) {
          map.set(key, { codigo, nombre: r.nombre || '', packs: 0, unds: 0, total: 0, eq: 0, factor: 1, gratuitas: 0 })
        }
        const acc = map.get(key)
        //console.log(operacion)
        if (operacion === 'GRATUITA') acc.gratuitas += cant
        if (this.isUnidad(medida)) {
          acc.unds += cant
          acc.eq += cant
          acc.total += tot
          return
        }

        let factor = Number(this.factorIndex[codigo] ?? 0)
        if (!Number.isFinite(factor) || factor <= 0) {
          const fInf = this.inferFactor(r.nombre, medida)
          factor = Number(fInf || 1)
        }

        if (factor > 1) {
          acc.factor = factor
          acc.packs += cant
          acc.eq += cant * factor
        } else {
          acc.unds += cant
          acc.eq += cant
        }
        acc.total += tot
      })
      //console.log(map)
      return Array.from(map.values())
        .map(x => ({
          ...x,
          // 👇 si factor == 1 → solo unds; si >1 → packs/unds
          nombre: x.gratuitas > 0 ? `${x.nombre}  (${x.gratuitas} gratuitas)` : x.nombre,
          cantDisplay: x.factor > 1 ? `${this.int(x.packs)}/${this.int(x.unds)}` : `${this.int(x.unds)}`,
          // dejamos cantPU por si lo usas en otro lado
          cantPU: `${this.int(x.packs)}/${this.int(x.unds)}`,
          precioUnitProm: x.eq > 0 ? (x.total / x.eq) : 0
        }))
        .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
    },

    labelsVendidos() { return this.listaVendidos.map(p => p.nombre) },
    valoresVendidos() { return this.listaVendidos.map(p => p.eq || 0) },
    labelsValor() { return this.listaValor.map(p => p.nombre) },
    valoresValor() { return this.listaValor.map(p => p.total) },

    top5CantLabels() { return this.buildTop5(this.agrupadoPorProducto, "eq").labels },
    top5CantValues() { return this.buildTop5(this.agrupadoPorProducto, "eq").values },
    top5ValorLabels() { return this.buildTop5(this.agrupadoPorProducto, "total").labels },
    top5ValorValues() { return this.buildTop5(this.agrupadoPorProducto, "total").values },

    listaVendidos() {
      return [...this.agrupadoPorProducto].sort((a, b) => Number(b.eq || 0) - Number(a.eq || 0))
    },
    listaValor() {
      return [...this.agrupadoPorProducto].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    },
  },
  methods: {
    verClientes(g) {
      // g.nombre puede venir con " (X gratuitas)"; recupera nombre base
      const baseNombre = String(g.nombre || '').split('  (')[0]
      const key = (g.codigo ? `${String(g.codigo).trim()}#` : '') + baseNombre
      this.clientesDe = baseNombre
      this.clientesLista = this.clientesPorProducto.get(key) || []
      this.clientesDial = true
    },

    number2(n) { return Number(n || 0).toFixed(2) },
    int(n) { return Number(n || 0).toLocaleString() },
    cerrar() { this.$emit("cierra", true) },
    exportPDF() {
      const itemsAgrupados = this.agrupadoPorProducto.map(x => ({
        nombre: x.nombre,
        medida: x.factor > 1 ? 'Paq/Und' : 'Und',
        cantidad: x.cantDisplay, // 👈 misma lógica en PDF
        precioUnitProm: x.precioUnitProm,
        total: x.total
      }))
      exportConsolidadoPDF({ selectedIds: this.safeSelectedIds, itemsAgrupados, filename: "consolidado_pedidos.pdf" })
    },
    buildTop5(rows, metric) {
      const list = [...(rows || [])].sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0))
      const top5 = list.slice(0, 5)
      const resto = list.slice(5)
      const otrosValor = resto.reduce((s, r) => s + Number(r[metric] || 0), 0)
      const labels = top5.map(x => x.nombre)
      const values = top5.map(x => Number(x[metric] || 0))
      if (otrosValor > 0) { labels.push("Otros"); values.push(otrosValor) }
      return { labels: labels.length ? labels : ["Sin datos"], values: values.length ? values : [0] }
    }
  }
}
</script>

<style scoped>
.dialog-card {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.table-scroll {
  overflow: auto;
  flex: 1 1 auto;
}

.mini-title {
  font-size: 14px !important;
  line-height: 1.1 !important;
  font-weight: 500;
}

.cant-click {
  text-decoration: underline;
  cursor: pointer;
}
</style>
