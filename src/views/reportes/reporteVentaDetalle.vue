<template>
  <div class="mt-3 pa-4">
    <v-card class="mb-5 mt-2">
      <v-row class="px-4 pt-4" align="center" justify="space-between">
        <h2 class="text-center mx-auto">PRODUCTOS VENDIDOS</h2>
      </v-row>

      <!-- Barra de acciones -->
      <v-row class="px-4 pt-1 pb-3" align="center">
        <v-col cols="12" md="4">
          <v-row dense class="text-center">
            <v-col cols="4">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" @click="dialogoFiltro = true" color="blue" large>mdi-filter</v-icon>
                </template>
                <span>Filtrar por fechas / costo</span>
              </v-tooltip>
            </v-col>
            <v-col cols="4">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" @click="Exporta_excel()" color="green"
                    large>mdi-microsoft-excel</v-icon>
                </template>
                <span>Exportar a Excel</span>
              </v-tooltip>
            </v-col>
            <v-col cols="4">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" @click="dialogo_imprime = true" color="red"
                    large>mdi-file-pdf-box</v-icon>
                </template>
                <span>Exportar a PDF</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="4" class="text-center">
          <h4>Del {{ date1 }} al {{ date2 }}</h4>
        </v-col>

        <v-col cols="12" md="4">
          <v-row dense>
            <v-col cols="12" md="7">
              <v-text-field v-model="busqueda" dense outlined hide-details prepend-inner-icon="mdi-magnify"
                label="Buscar producto..." />
            </v-col>
            <v-col cols="12" md="5">
              <v-select v-model="filtroOperacion" :items="itemsOperacion" dense outlined hide-details
                label="Operación" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- KPIs -->
      <v-row class="px-4 pb-2" dense>
        <v-col cols="6" md="3">
          <v-card class="pa-3 kpi-card">
            <div class="caption">Total Venta</div>
            <div class="headline">{{ monedaSimbolo }} {{ suma_venta }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="pa-3 kpi-card">
            <div class="caption">Total Utilidad</div>
            <div class="headline">{{ monedaSimbolo }} {{ suma_utilidad }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="pa-3 kpi-card">
            <div class="caption">Unidades Vendidas</div>
            <div class="headline">{{ total_unidades }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="pa-3 kpi-card">
            <div class="caption">Productos Distintos</div>
            <div class="headline">{{ desserts.length }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Resumen GRAVADA vs GRATUITA -->
      <v-row class="px-4 pb-2" dense>
        <v-col cols="12">
          <v-alert border="left" colored-border color="info" elevation="1" dense>
            <v-chip class="ma-1" small color="green" text-color="white">
              GRAVADA: {{ resumenOperacion.gravada.productos }} prod / {{ resumenOperacion.gravada.unidades }} und —
              Venta:
              {{ monedaSimbolo }} {{ format2(resumenOperacion.gravada.venta) }} — Utilidad: {{ monedaSimbolo }} {{
                format2(resumenOperacion.gravada.utilidad)
              }}
            </v-chip>
            <v-chip class="ma-1" small color="orange" text-color="white">
              GRATUITA: {{ resumenOperacion.gratuita.productos }} prod / {{ resumenOperacion.gratuita.unidades }} und —
              Venta:
              {{ monedaSimbolo }} 0.00 — Costo: {{ monedaSimbolo }} {{ format2(resumenOperacion.gratuita.costo) }}
            </v-chip>
            <v-chip class="ma-1" small outlined>
              Considerar costo catálogo: <strong>{{ costo_catalogo ? 'Sí' : 'No' }}</strong>
            </v-chip>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Controles de orden -->
      <v-row class="px-4 pb-2" dense>
        <v-col cols="12" md="4">
          <v-select v-model="ordenPor" :items="itemsOrden" dense outlined hide-details label="Ordenar por" />
        </v-col>
        <v-col cols="12" md="3">
          <v-switch v-model="ordenDesc" inset label="Descendente" color="primary" />
        </v-col>
      </v-row>

      <!-- Tabla -->
      <v-card class="pa-4">
        <v-data-table dense :headers="headers" :items="itemsOrdenados" :search="busqueda" fixed-header
          :items-per-page="50" mobile-breakpoint="0" height="60vh" class="elevation-1">
          <template v-slot:item.cantidad="{ item }">
            <span>{{ format0(item.cantidad) }}</span>
            <v-chip v-if="false" x-small class="ml-1" color="green" text-color="white" title="Unidades gravadas">
              {{ format0(item.cantidad_gravada) }} GRV
            </v-chip>
            <v-chip v-if="item.cantidad_gratuita" x-small class="ml-1" color="orange" text-color="white"
              title="Unidades gratuitas">
              {{ format0(item.cantidad_gratuita) }} GRA
            </v-chip>
          </template>

          <template v-slot:item.costo="{ item }">
            <span>{{ monedaSimbolo }} {{ format2(item.costo) }}</span>
          </template>
          <template v-slot:item.costo_tot="{ item }">
            <span>{{ monedaSimbolo }} {{ format2(item.costo_tot) }}</span>
          </template>

          <template v-slot:item.precio_prom="{ item }">
            <span>{{ monedaSimbolo }} {{ format2(item.precio_prom) }}</span>
          </template>

          <template v-slot:item.total="{ item }">
            <span>{{ monedaSimbolo }} {{ format2(item.total) }}</span>
          </template>

          <template v-slot:item.utilidad="{ item }">
            <template v-if="item.costo === 0">
              <span class="grey--text text--darken-1 font-italic">
                sin costo unitario
              </span>
            </template>

            <template v-else>
              <span :class="{ 'text--success': item.utilidad >= 0, 'red--text': item.utilidad < 0 }">
                {{ monedaSimbolo }} {{ format2(item.utilidad) }}
              </span>
            </template>
          </template>


          <template v-slot:no-data>
            <v-alert color="grey lighten-3" dense>Sin datos para el criterio seleccionado.</v-alert>
          </template>
        </v-data-table>
      </v-card>
    </v-card>

    <!-- Panel ranking -->
    <v-row dense>
      <v-col cols="12" md="4">
        <v-card class="pa-3 mb-6">
          <div class="subtitle-2 font-weight-bold mb-2">Top 5 más vendidos (unidades)</div>
          <v-list dense>
            <v-list-item v-for="(p, i) in topMasVendidos" :key="'top-mas-' + i">
              <v-list-item-content>
                <v-list-item-title class="d-flex justify-space-between">
                  <span>{{ i + 1 }}. {{ p.nombre }}</span>
                  <span>{{ format0(p.cantidad) }} und</span>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3">
          <div class="subtitle-2 font-weight-bold mb-2">Top 5 con mayor utilidad</div>
          <v-list dense>
            <v-list-item v-for="(p, i) in topMayorUtilidad" :key="'top-util-' + i">
              <v-list-item-content>
                <v-list-item-title class="d-flex justify-space-between">
                  <span>{{ i + 1 }}. {{ p.nombre }}</span>
                  <span>{{ monedaSimbolo }} {{ format2(p.utilidad) }}</span>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-3">
          <div class="subtitle-2 font-weight-bold mb-2">Top 5 menos vendidos (unidades)</div>
          <v-list dense>
            <v-list-item v-for="(p, i) in topMenosVendidos" :key="'top-menos-' + i">
              <v-list-item-content>
                <v-list-item-title class="d-flex justify-space-between">
                  <span>{{ i + 1 }}. {{ p.nombre }}</span>
                  <span>{{ format0(p.cantidad) }} und</span>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog filtro -->
    <v-dialog v-model="dialogoFiltro" max-width="650px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoFiltro = !dialogoFiltro">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-4">
        <v-row class="text-center">
          <v-col cols="6">
            <v-text-field type="date" outlined dense v-model="date1" label="INICIO"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field type="date" outlined dense v-model="date2" label="FIN"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-switch v-model="costo_catalogo" color="green" label="Usar costo catálogo"></v-switch>
          </v-col>
          <v-col cols="12" md="6">
            <v-checkbox v-model="incluirGratuitasEnPromedio" label="Incluir gratuitas en precio promedio"
              hide-details />
          </v-col>
        </v-row>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="genera_filtro()" text>Generar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog imprimir -->
    <v-dialog v-model="dialogo_imprime" max-width="490px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogo_imprime = !dialogo_imprime">mdi-close</v-icon>
          <v-spacer></v-spacer>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-row dense>
          <v-col cols="6">
            <v-card @click.prevent="verPDF('A4')" class="hover-card">
              <v-container class="text-center">
                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                <h5 class="pa-1">PDF A4</h5>
              </v-container>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card @click.prevent="verPDF('80')" class="hover-card">
              <v-container class="text-center">
                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                <h5 class="pa-1">PDF 80mm</h5>
              </v-container>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { allCabecera, consultaDetalle } from '../../db'
import store from '@/store/index'
import XLSX from 'xlsx'
import moment from 'moment'
import { pdf_productos_vendidos } from '../../pdf'

export default {
  data() {
    return {
      dialogoFiltro: false,
      dialogo_imprime: false,
      desserts: [],              // [{ id, nombre, medida, cantidad, costo, costo_tot, precio_prom, total, utilidad, cantidad_gratuita, cantidad_gravada }]
      date1: moment(new Date()).format('YYYY-MM-DD'),
      date2: moment(new Date()).format('YYYY-MM-DD'),
      costo_catalogo: true,
      incluirGratuitasEnPromedio: false,

      busqueda: '',
      filtroOperacion: 'TODAS',
      itemsOperacion: ['TODAS', 'GRAVADA', 'GRATUITA'],
      ordenPor: 'cantidad',
      ordenDesc: true,
      itemsOrden: [
        { text: 'Unidades', value: 'cantidad' },
        { text: 'Utilidad', value: 'utilidad' },
        { text: 'Venta total', value: 'total' },
        { text: 'P. Promedio', value: 'precio_prom' },
        { text: 'Costo total', value: 'costo_tot' },
        { text: 'Nombre', value: 'nombre' },
      ],

      headers: [
        { text: 'Cantidad', value: 'cantidad', align: 'start', sortable: false },
        { text: 'Nombre', value: 'nombre', sortable: false },
        { text: 'Medida', value: 'medida', sortable: false },

        { text: 'Costo Unit.', value: 'costo', sortable: false },
        { text: 'Costo Total', value: 'costo_tot', sortable: false },

        { text: 'P. Promedio', value: 'precio_prom', sortable: false },
        { text: 'Venta Total', value: 'total', sortable: false },
        { text: 'Utilidad', value: 'utilidad', sortable: false },
      ]
    }
  },

  computed: {
    // Filtra por operación y aplica el orden seleccionado
    itemsFiltrados() {
      let base = this.desserts

      if (this.filtroOperacion === 'GRAVADA') {
        base = base.filter(i => (i.cantidad_gravada || 0) > 0)
      } else if (this.filtroOperacion === 'GRATUITA') {
        base = base.filter(i => (i.cantidad_gratuita || 0) > 0)
      }

      return base
    },

    itemsOrdenados() {
      const arr = [...this.itemsFiltrados]
      const key = this.ordenPor

      arr.sort((a, b) => {
        const va = a[key] ?? 0
        const vb = b[key] ?? 0
        if (va === vb) {
          return a.nombre.localeCompare(b.nombre)
        }
        return this.ordenDesc ? (vb - va) : (va - vb)
      })
      return arr
    },

    suma_venta() {
      const t = this.itemsFiltrados.reduce((acc, i) => acc + Number(i.total || 0), 0)
      return this.format2(t)
    },

    suma_utilidad() {
      const u = this.itemsFiltrados.reduce((acc, i) => {
        if (Number(i.costo || 0) === 0) return acc
        return acc + Number(i.utilidad || 0)
      }, 0)

      return this.format2(u)
    },


    total_unidades() {
      return this.itemsFiltrados.reduce((acc, i) => acc + Number(i.cantidad || 0), 0)
    },

    resumenOperacion() {
      // Resumen global por tipo de operación
      const res = {
        gravada: { productos: 0, unidades: 0, venta: 0, utilidad: 0 },
        gratuita: { productos: 0, unidades: 0, costo: 0 },
      }
      for (const i of this.desserts) {
        if ((i.cantidad_gravada || 0) > 0) {
          res.gravada.productos += 1
          res.gravada.unidades += Number(i.cantidad_gravada || 0)
          res.gravada.venta += Number(i.total || 0) // total solo recoge gravadas
          res.gravada.utilidad += Number(i.utilidad || 0) - Number(i.costo_gratuitas || 0)
        }
        if ((i.cantidad_gratuita || 0) > 0) {
          res.gratuita.productos += 1
          res.gratuita.unidades += Number(i.cantidad_gratuita || 0)
          res.gratuita.costo += Number(i.costo_gratuitas || 0)
        }
      }
      return res
    },

    topMasVendidos() {
      return [...this.itemsFiltrados].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0)).slice(0, 5)
    },
    topMenosVendidos() {
      return [...this.itemsFiltrados].sort((a, b) => (a.cantidad || 0) - (b.cantidad || 0)).slice(0, 5)
    },
    topMayorUtilidad() {
      return [...this.itemsFiltrados].sort((a, b) => (b.utilidad || 0) - (a.utilidad || 0)).slice(0, 5)
    },
    monedaSimbolo() {
      return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
    }
  },

  methods: {
    async genera_filtro() {
      try {
        store.commit('dialogoprogress')
        const tsIni = moment(this.date1, 'YYYY-MM-DD').startOf('day').unix()
        const tsFin = moment(this.date2, 'YYYY-MM-DD').endOf('day').unix()

        const cabecerasSnap = await allCabecera()
          .orderByChild('fecha')
          .startAt(tsIni)
          .endAt(tsFin)
          .once('value')

        const cabeceras = []
        cabecerasSnap.forEach(s => {
          const d = s.val()
          if (d.estado === 'aprobado') cabeceras.push(d)
        })

        const detalle = await this.consulta_detalle_masiva(cabeceras)
        // Orden default: por cantidad desc
        detalle.sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))

        this.desserts = detalle
      } catch (e) {
        console.error('genera_filtro()', e)
      } finally {
        store.commit('dialogoprogress')
        this.dialogoFiltro = false
      }
    },

    async consulta_detalle_masiva(cabeceras = []) {
      const map = new Map()

      await Promise.all(
        cabeceras.map(async (cab) => {
          const snap = await consultaDetalle(cab.numeracion).once('value')
          snap.forEach(it => {
            const p = it.val()
            const key = String(p.id)
            const esGratuita = String(p.operacion).toUpperCase() === 'GRATUITA'

            let costoCatalogo = 0
            const catalogo = store.state.productos.find(x => String(x.id) === key)
            if (catalogo && this.costo_catalogo) {
              costoCatalogo = Number(catalogo.costo || 0)
            }

            const cantidad = Number(p.cantidad || 0)
            const descuento = Number(p.preciodescuento || 0)
            const precioUnit = Number(p.precio || 0)
            const factor = Number(p.factor || 1)
            const medida = p.medida || ''

            let costoUnitarioMostrar = costoCatalogo
            let costoUnitarioParaCalculo = costoCatalogo

            if (factor > 1) {
              if (medida.toUpperCase().includes('CAJA')) {
                costoUnitarioParaCalculo = costoCatalogo * factor
              }
            }

            const ventaLinea = esGratuita
              ? 0
              : Number((precioUnit * cantidad - descuento).toFixed(2))

            const costoLinea = Number((costoUnitarioParaCalculo * cantidad).toFixed(2))

            if (!map.has(key)) {
              map.set(key, {
                id: key,
                nombre: p.id + '-' + p.nombre,
                medida: p.medida,
                cantidad: 0,
                cantidad_gravada: 0,
                cantidad_gratuita: 0,
                costo: costoUnitarioMostrar,
                costo_tot: 0,
                costo_gratuitas: 0,
                precio_prom: 0,
                total: 0,
                utilidad: 0,
              })
            }

            const acc = map.get(key)
            acc.costo = costoUnitarioMostrar

            acc.cantidad += cantidad
            if (esGratuita) {
              acc.cantidad_gratuita += cantidad
              acc.costo_gratuitas += costoLinea
            } else {
              acc.cantidad_gravada += cantidad
              acc.total = Number((acc.total + ventaLinea).toFixed(2))
              acc.costo_tot = Number((acc.costo_tot + costoLinea).toFixed(2))
            }

            const divisor = this.incluirGratuitasEnPromedio
              ? (acc.cantidad || 1)
              : (acc.cantidad_gravada || 1)
            acc.precio_prom = Number(((acc.total || 0) / divisor).toFixed(2))
            acc.utilidad = Number(((acc.total || 0) - (acc.costo_tot || 0)).toFixed(2))
          })
        })
      )

      return Array.from(map.values())
    },

    format2(n) {
      const num = Number(n || 0)
      return num.toFixed(2)
    },
    format0(n) {
      const num = Number(n || 0)
      return Math.round(num)
    },

    Exporta_excel() {
      // Hoja Detalle
      const detalle = this.itemsOrdenados.map(i => ({
        ID: i.id,
        NOMBRE: i.nombre,
        MEDIDA: i.medida,
        CANTIDAD_TOTAL: i.cantidad,
        CANTIDAD_GRAVADA: i.cantidad_gravada || 0,
        CANTIDAD_GRATUITA: i.cantidad_gratuita || 0,
        COSTO_UNIDAD: i.costo,
        COSTO_TOTAL_GRAV: i.costo_tot,
        COSTO_TOTAL_GRAT: i.costo_gratuitas || 0,
        PRECIO_PROMEDIO: i.precio_prom,
        VENTA_TOTAL: i.total,
        UTILIDAD: i.utilidad,
      })

      )

      // Hoja Resumen
      const res = this.resumenOperacion
      const resumen = [
        { METRICA: 'GRAVADA - Productos', VALOR: res.gravada.productos },
        { METRICA: 'GRAVADA - Unidades', VALOR: res.gravada.unidades },
        { METRICA: 'GRAVADA - Venta', VALOR: res.gravada.venta },
        { METRICA: 'GRAVADA - Utilidad', VALOR: res.gravada.utilidad },
        { METRICA: 'GRATUITA - Productos', VALOR: res.gratuita.productos },
        { METRICA: 'GRATUITA - Unidades', VALOR: res.gratuita.unidades },
        { METRICA: 'GRATUITA - Costo', VALOR: res.gratuita.costo },
      ]

      // Hoja Top
      const top = [
        ['TOP MÁS VENDIDOS'],
        ...this.topMasVendidos.map((p, i) => [i + 1, p.nombre, p.cantidad]),
        [],
        ['TOP MAYOR UTILIDAD'],
        ...this.topMayorUtilidad.map((p, i) => [i + 1, p.nombre, p.utilidad]),
        [],
        ['TOP MENOS VENDIDOS'],
        ...this.topMenosVendidos.map((p, i) => [i + 1, p.nombre, p.cantidad]),
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'DETALLE')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'RESUMEN')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(top), 'TOP')
      XLSX.writeFile(wb, `PRODUCTOS_VENDIDOS_${this.date1}_${this.date2}.xlsx`)
    },

    verPDF(medida) {
      // Pásale la lista ya ordenada para que el PDF respete el criterio actual
      pdf_productos_vendidos(this.itemsOrdenados, medida, {
        rango: { del: this.date1, al: this.date2 },
        incluirGratuitasEnPromedio: this.incluirGratuitasEnPromedio,
        costoCatalogo: this.costo_catalogo,
        resumen: this.resumenOperacion,
        ordenPor: this.ordenPor,
        ordenDesc: this.ordenDesc,
      })
    },
  },
}
</script>

<style scoped>
.kpi-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(33, 33, 33, 0.08) !important;
}

.hover-card {
  transition: transform .15s ease, box-shadow .15s ease;
  border-radius: 14px;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, .08) !important;
}
</style>
