<template>
  <div class="mb-6 pa-3 mt-1">
    <v-row align="center" dense class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-select v-model="sede_filtro" :items="sedesFiltro" item-text="nombre" item-value="base" outlined dense
          hide-details label="Sede" prepend-inner-icon="mdi-store" />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-switch v-model="soloConStock" color="primary" label="Mostrar solo productos con stock" hide-details
          dense></v-switch>
      </v-col>
    </v-row>

    <v-row align="center" dense>
      <v-col cols="12" md="6">
        <v-text-field v-model="buscar" outlined dense clearable append-icon="mdi-magnify"
          label="Buscar por nombre, categoría o ID" hide-details />
      </v-col>

      <v-col cols="12" md="6" class="mt-md-0">
        <v-select v-model="filtro_categoria" :items="arraycategoria_f" outlined dense hide-details label="Categoría"
          menu-props="auto" prepend-inner-icon="mdi-shape" />
      </v-col>
    </v-row>

    <v-row dense class="mb-2">
      <v-col cols="12" md="4">
        <v-card outlined class="pa-3 d-flex align-center justify-space-between">
          <div>
            <div class="caption grey--text text--darken-1">Suma de stock</div>
            <div class="text-h6">{{ formatNumber(kpi.sumaStock) }}</div>
          </div>
          <v-icon large>mdi-cube-scan</v-icon>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card outlined class="pa-3 d-flex align-center justify-space-between">
          <div>
            <div class="caption grey--text text--darken-1">Suma total de costo</div>
            <div class="text-h6">{{ monedaSimbolo }} {{ formatMoney(kpi.sumaTotalCosto) }}</div>
          </div>
          <v-icon large>mdi-cash-multiple</v-icon>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card outlined class="pa-3 d-flex align-center justify-space-between">
          <div>
            <div class="caption grey--text text--darken-1">Suma total de venta</div>
            <div class="text-h6">{{ monedaSimbolo }} {{ formatMoney(kpi.sumaTotalVenta) }}</div>
          </div>
          <v-icon large>mdi-sale</v-icon>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-2">
      <v-data-table dense class="elevation-1" :headers="headersConMoneda" :items="listafiltrada" :items-per-page="50"
        mobile-breakpoint="1">
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-toolbar-title class="subtitle-2">
              Productos ({{ listafiltrada.length }}) - {{ nombreSedeActual }}
            </v-toolbar-title>
            <v-spacer></v-spacer>

            <!-- Botones de exportación -->
            <v-btn small class="mr-2" color="green darken-1" dark @click="exportarExcel">
              <v-icon left>mdi-file-excel</v-icon> Excel
            </v-btn>
            <v-btn small color="red darken-1" dark @click="exportarPDF">
              <v-icon left>mdi-file-pdf-box</v-icon> PDF
            </v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item="{ item }">
          <tr>
            <td style="font-size:80%;">{{ item.id }}</td>
            <td style="font-size:80%;">{{ item.categoria }}</td>
            <td style="font-size:80%;">{{ item.nombre }}</td>
            <td style="font-size:80%;">{{ monedaSimbolo }} {{ formatMoney(item.costo) }}</td>
            <td style="font-size:80%;">{{ convierte_stock(item.stock, item.factor) }}</td>
            <td style="font-size:80%;">{{ monedaSimbolo }} {{ formatMoney(item.precio) }}</td>
            <td style="font-size:80%;">{{ monedaSimbolo }} {{ formatMoney(calcTotalCosto(item)) }}</td>
            <td style="font-size:80%;">{{ monedaSimbolo }} {{ formatMoney(calcTotalVenta(item)) }}</td>
          </tr>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" border="left" outlined class="ma-4" dense>
            No se encontraron productos con los filtros aplicados.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import { allCategorias, allProductoOtraBase } from '../../db'
import store from '@/store/index'
import moment from 'moment'

export default {
  data: () => ({
    headers: [
      { text: 'ID', value: 'id', align: 'start' },
      { text: 'Categoría', value: 'categoria' },
      { text: 'Nombre', value: 'nombre' },
      { text: 'Costo', value: 'costo' },
      { text: 'Stock', value: 'stock' },
      { text: 'Precio V', value: 'precio' },
      { text: 'Total Costo', value: 'total_costo' },
      { text: 'Total Venta', value: 'total_venta' },
    ],
    filtro_categoria: 'TODOS',
    arraycategoria_f: ['TODOS'],
    buscar: '',
    sede_filtro: null,
    soloConStock: false,
    productosPorSede: [],
  }),

  computed: {
    sedesFiltro() {
      const sedes = (store.state.array_sedes || []).filter(s => s.tipo === 'sede')
      return sedes.map(s => ({
        nombre: s.nombre,
        base: s.base,
        esPrincipal: s.base === store.state.sedeActual?.codigo
      }))
    },
    
    sedePrincipal() {
      return store.state.sedeActual?.codigo || null
    },

    nombreSedeActual() {
      if (!this.sede_filtro) return 'Seleccione sede'
      const sede = this.sedesFiltro.find(s => s.base === this.sede_filtro)
      return sede ? sede.nombre : 'Sede'
    },

    headersConMoneda() {
      const simbolo = this.monedaSimbolo;
      return [
        { text: 'ID', value: 'id', align: 'start' },
        { text: 'Categoría', value: 'categoria' },
        { text: 'Nombre', value: 'nombre' },
        { text: `Costo (${simbolo})`, value: 'costo' },
        { text: 'Stock', value: 'stock' },
        { text: `Precio V (${simbolo})`, value: 'precio' },
        { text: `Total Costo (${simbolo})`, value: 'total_costo' },
        { text: `Total Venta (${simbolo})`, value: 'total_venta' },
      ];
    },

    productosBase() {
      if (!this.sede_filtro) {
        return []
      } else {
        return this.productosPorSede
      }
    },

    listafiltrada() {
      const texto = String(this.buscar || '').trim().toLowerCase()
      const cat = this.filtro_categoria

      const filtrados = this.productosBase.filter(p => {
        const pasaCat = !cat || cat === 'TODOS'
          ? true
          : String(p.categoria || '').toLowerCase() === String(cat).toLowerCase()
        if (!pasaCat) return false
        if (this.soloConStock) {
          const stock = this.toNumber(p.stock)
          if (stock < 1) return false
        }
        if (!texto) return true
        const id = String(p.id || '').toLowerCase()
        const nombre = String(p.nombre || '').toLowerCase()
        const categoria = String(p.categoria || '').toLowerCase()
        return id.includes(texto) || nombre.includes(texto) || categoria.includes(texto)
      })

      return filtrados
    },

    kpi() {
      const res = this.listafiltrada.reduce((acc, it) => {
        const stock = this.toNumber(it.stock)
        const costo = this.toNumber(it.costo)
        const precio = this.toNumber(it.precio)

        acc.sumaStock += stock
        acc.sumaTotalCosto += (costo * stock)
        acc.sumaTotalVenta += (precio * stock)
        return acc
      }, { sumaStock: 0, sumaTotalCosto: 0, sumaTotalVenta: 0 })

      return res
    },

    monedaSimbolo() {
      const moneda = this.$store.state.moneda || []
      const codigoDefecto = this.$store.state.configuracion?.moneda_defecto
      const monedaEncontrada = moneda.find(m => m.codigo == codigoDefecto)
      return monedaEncontrada?.simbolo || 'S/ '
    }
  },

  watch: {
    sede_filtro: {
      immediate: true,
      async handler(nuevaSede) {
        if (nuevaSede) {
          await this.cargarProductosSede(nuevaSede)
        } else {
          this.productosPorSede = []
        }
      }
    }
  },

  async created() {
    if (this.sedePrincipal) {
      this.sede_filtro = this.sedePrincipal
    } else if (this.sedesFiltro.length > 0) {
      this.sede_filtro = this.sedesFiltro[0].base
    }

    try {
      const snapshot = await allCategorias('categorias').once('value')
      const setCats = new Set(this.arraycategoria_f)
      snapshot.forEach((it) => {
        const nom = (it.val() && it.val().nombre) ? String(it.val().nombre) : ''
        if (nom) setCats.add(nom)
      })
      this.arraycategoria_f = Array.from(setCats)
      console.log('Categorías cargadas:', this.arraycategoria_f)
    } catch (e) {
      console.error('Error cargando categorías', e)
    }
  },

  methods: {
    async cargarProductosSede(baseSede) {
      try {
        store.commit('dialogoprogress')
        const snapshot = await allProductoOtraBase(baseSede).once('value')
        const productos = []

        snapshot.forEach(item => {
          const prod = item.val()
          if (prod) {
            productos.push({
              ...prod,
              id: prod.id || item.key,
              categoria: prod.categoria || '',
              nombre: prod.nombre || '',
              costo: prod.costo || 0,
              stock: prod.stock || 0,
              precio: prod.precio || 0,
              factor: prod.factor || 1,
              obs1: prod.obs1 || '',
            })
          }
        })

        this.productosPorSede = productos
        console.log(`Productos cargados de sede ${baseSede}:`, productos.length)
      } catch (e) {
        console.error('Error cargando productos de sede', baseSede, e)
        this.productosPorSede = []
      } finally {
        store.commit('dialogoprogress')
      }
    },

    toNumber(v) {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    },

    formatMoney(v) {
      const n = this.toNumber(v)
      const dec = (store?.state?.configuracion?.decimal ?? 2)
      return n.toFixed(dec)
    },

    formatNumber(v) {
      const n = this.toNumber(v)
      return n.toLocaleString('es-PE')
    },

    nowString() {
      const d = new Date()
      const pad = s => String(s).padStart(2, '0')
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
    },

    calcTotalCosto(item) {
      return this.toNumber(item.costo) * this.toNumber(item.stock)
    },

    calcTotalVenta(item) {
      return this.toNumber(item.precio) * this.toNumber(item.stock)
    },

    convierte_stock(stock, factor) {
      const s = this.toNumber(stock)
      const f = this.toNumber(factor)
      if (!Number.isFinite(f) || f <= 1) return String(this.toNumber(stock))
      const cajas = Math.floor(s / f)
      const und = s - cajas * f
      return `${cajas}/${und}`
    },

    filasExport() {
      return this.listafiltrada.map(it => {
        const stockN = this.toNumber(it.stock)
        const costoN = this.toNumber(it.costo)
        const precioN = this.toNumber(it.precio)
        return {
          ID: it.id || '',
          Categoria: it.categoria || '',
          Nombre: it.nombre || '',
          Costo: costoN,
          Stock: stockN,
          PrecioVenta: precioN,
          TotalCosto: costoN * stockN,
          TotalVenta: precioN * stockN,
          Observacion: it.obs1 || '',
          Sede: this.nombreSedeActual
        }
      })
    },

    // ——— Exportar a Excel ———
    async exportarExcel() {
      try {
        const mod = await import('xlsx')
        const XLSX = mod.default || mod
        const data = this.filasExport()

        const hoja = XLSX.utils.json_to_sheet(data, {
          header: [
            'ID', 'Categoria', 'Nombre', 'Costo', 'Stock', 'PrecioVenta',
            'TotalCosto', 'TotalVenta', 'Observacion', 'Sede'
          ]
        })

        hoja['!cols'] = [
          { wch: 8 },
          { wch: 15 },
          { wch: 30 },
          { wch: 12 },
          { wch: 8 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 25 },
          { wch: 15 }
        ]

        const filtrosInfo = []
        filtrosInfo.push(`Sede: ${this.nombreSedeActual}`)
        
        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          filtrosInfo.push(`Categoría: ${this.filtro_categoria}`)
        }
                
        if (this.soloConStock) {
          filtrosInfo.push('Solo con stock ≥ 1')
        }

        const libro = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(libro, hoja, 'Productos')
      
        if (filtrosInfo.length > 0) {
          const infoSheet = XLSX.utils.aoa_to_sheet([
            ['REPORTE DE PRODUCTOS'],
            [''],
            ['Filtros aplicados:'],
            ...filtrosInfo.map(f => [f]),
            [''],
            ['Fecha de exportación:', new Date().toLocaleString('es-PE')],
            ['Total registros:', data.length]
          ])
          
          XLSX.utils.book_append_sheet(libro, infoSheet, 'Información')
        }

        let nombreBase = 'productos'
        
        const sedeNombre = this.nombreSedeActual.replace(/\s+/g, '_')
        nombreBase += `_${sedeNombre}`
        
        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          const catNombre = this.filtro_categoria.replace(/\s+/g, '_')
          nombreBase += `_${catNombre}`
        }
        
        if (this.soloConStock) {
          nombreBase += '_con-stock'
        }
        
        const nombre = `${nombreBase}_${this.nowString()}.xlsx`
        XLSX.writeFile(libro, nombre)
        let msg = `Exportado: ${data.length} productos de ${this.nombreSedeActual}`
        if (this.filtro_categoria !== 'TODOS') msg += `, categoría ${this.filtro_categoria}`
        if (this.soloConStock) msg += ' (solo con stock)'
        
        console.log(msg)
        
      } catch (e) {
        console.error('Error exportando a Excel', e)
        alert('No se pudo exportar a Excel.')
      }
    },

    // ——— Exportar a PDF ———
    async exportarPDF() {
      try {
        const { jsPDF } = await import('jspdf')
        await import('jspdf-autotable')

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' })

        doc.setFontSize(14)
        doc.text(`Reporte de Productos - ${this.nombreSedeActual}`, 40, 32)
        
        doc.setFontSize(10)
        doc.text(`Fecha: ${new Date().toLocaleString('es-PE')}`, 40, 48)

        let filtrosText = ''
        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          filtrosText += `Categoría: ${this.filtro_categoria} | `
        }
        if (this.soloConStock) {
          filtrosText += 'Solo con stock | '
        }
        filtrosText = filtrosText.replace(/\s\|\s$/, '')
        
        if (filtrosText) {
          doc.text(filtrosText, 40, 64)
        }

        doc.setFontSize(10)
        const k1 = `Suma Stock: ${this.formatNumber(this.kpi.sumaStock)}`
        const k2 = `Suma Total Costo: ${this.monedaSimbolo} ${this.formatMoney(this.kpi.sumaTotalCosto)}`
        const k3 = `Suma Total Venta: ${this.monedaSimbolo} ${this.formatMoney(this.kpi.sumaTotalVenta)}`
        doc.text(`${k1}   |   ${k2}   |   ${k3}`, 40, filtrosText ? 80 : 64)

        const rows = this.filasExport().map(r => ([
          r.ID,
          r.Categoria,
          r.Nombre,
          `${this.monedaSimbolo} ${this.formatMoney(r.Costo)}`,
          this.formatNumber(r.Stock),
          `${this.monedaSimbolo} ${this.formatMoney(r.PrecioVenta)}`,
          `${this.monedaSimbolo} ${this.formatMoney(r.TotalCosto)}`,
          `${this.monedaSimbolo} ${this.formatMoney(r.TotalVenta)}`
        ]))

        const head = [[
          'ID', 'Categoría', 'Nombre', `Costo (${this.monedaSimbolo})`, 'Stock',
          `Precio V (${this.monedaSimbolo})`, `Total Costo (${this.monedaSimbolo})`, `Total Venta (${this.monedaSimbolo})`
        ]]

        const startY = filtrosText ? 96 : 80
        
        doc.autoTable({
          head,
          body: rows,
          startY: startY,
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [33, 150, 243] },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 100 },
            2: { cellWidth: 220 },
            3: { halign: 'right', cellWidth: 70 },
            4: { halign: 'right', cellWidth: 70 },
            5: { halign: 'right', cellWidth: 70 },
            6: { halign: 'right', cellWidth: 70 },
            7: { halign: 'right', cellWidth: 70 },
          },
          didDrawPage: (data) => {
            const footerText = `Página ${doc.internal.getNumberOfPages()} - ${this.nombreSedeActual}`
            doc.setFontSize(8)
            doc.text(footerText, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 10)
          }
        })

        let nombreBase = 'productos'
        const sedeNombre = this.nombreSedeActual.replace(/\s+/g, '_')
        nombreBase += `_${sedeNombre}`
        
        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          nombreBase += `_${this.filtro_categoria.replace(/\s+/g, '_')}`
        }
        if (this.soloConStock) {
          nombreBase += '_con-stock'
        }
        
        const nombre = `${nombreBase}_${this.nowString()}.pdf`
        doc.save(nombre)
        
      } catch (e) {
        console.error('Error exportando a PDF', e)
        alert('No se pudo exportar a PDF.')
      }
    },
  },
}
</script>

<style scoped>
.v-data-table td {
  vertical-align: middle !important;
}
</style>