<template>
  <div class="mb-6 pa-3 mt-1">
    <v-row align="center" dense class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-select v-model="sede_filtro" :items="sedesFiltro" item-text="nombre" item-value="base" outlined dense
          hide-details label="Sede" prepend-inner-icon="mdi-store" />
      </v-col>

      <v-col cols="12" sm="6" md="4" class="mt-n3 mb-n4">
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
            <v-btn small color="red darken-1" dark @click="dialogoPDF = true">
              <v-icon left>mdi-file-pdf-box</v-icon> PDF
            </v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item="{ item }">
          <tr>
            <td style="font-size:80%;">{{ item.id }}</td>
            <td style="font-size:80%;">{{ item.categoria }}</td>
            <td style="font-size:80%;">{{ item.nombre }}</td>
            <td style="font-size:80%;">{{ item.medida }}</td>
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
    <v-dialog v-model="dialogoPDF" max-width="490px">
      <v-card class="pa-1">
        <v-system-bar window dark>
          <v-icon @click="dialogoPDF = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <span>Seleccionar formato</span>
        </v-system-bar>
        <v-row dense class="pa-3">
          <v-col cols="6">
            <v-card @click="exportarPDF('A4')" class="hover-card text-center pa-3" style="cursor: pointer;">
              <v-icon size="40" color="red">mdi-file-pdf-box</v-icon>
              <h5 class="pa-1">PDF A4</h5>
              <div class="caption grey--text">Formato completo</div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card @click="exportarPDF('80')" class="hover-card text-center pa-3" style="cursor: pointer;">
              <v-icon size="40" color="red">mdi-file-pdf-box</v-icon>
              <h5 class="pa-1">PDF 80mm</h5>
              <div class="caption grey--text">Formato ticket</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
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
      { text: 'Medida', value: 'medida' },
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
    dialogoPDF: false,
  }),

  computed: {
    sedesFiltro() {
      const sedes = (store.state.array_sedes || []).filter(s => s.tipo === 'sede')
      console.log('Sedes para filtro:', store.state.array_sedes)
      if (sedes.length === 0) {
        return [{
          nombre: 'PRINCIPAL',
          base: store.state.baseDatos.bd,
          esPrincipal: true
        }]
      }
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
        { text: 'Medida', value: 'medida' },
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
          Medida: it.medida || '',
          Costo: costoN,
          Stock: this.convierte_stock(it.stock, it.factor),
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
            'ID', 'Categoria', 'Nombre', 'Medida', 'Costo', 'Stock', 'PrecioVenta',
            'TotalCosto', 'TotalVenta', 'Observacion', 'Sede'
          ]
        })

        hoja['!cols'] = [
          { wch: 8 },
          { wch: 15 },
          { wch: 30 },
          { wch: 10 },
          { wch: 12 },
          { wch: 10 },
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

    async exportarPDF(formato = null) {
      try {
        if (!formato) {
          this.dialogoPDF = true
          return
        }

        const { jsPDF } = await import('jspdf')
        await import('jspdf-autotable')

        const isTicket = formato === '80'

        const config = isTicket
          ? { orientation: 'portrait', unit: 'mm', format: [80, 297] }
          : { orientation: 'landscape', unit: 'mm', format: 'a4' }

        const doc = new jsPDF(config)

        const marginLeft = isTicket ? 2 : 10
        const fontSizeTitle = isTicket ? 9 : 14
        const fontSizeNormal = isTicket ? 7 : 10
        const fontSizeSmall = isTicket ? 6 : 9
        const lineHeight = isTicket ? 4 : 6

        let currentY = 10

        doc.setFontSize(fontSizeTitle)
        doc.setFont('helvetica', 'bold')
        doc.text(`INVENTARIO - ${this.nombreSedeActual}`, marginLeft, currentY)
        currentY += lineHeight * 1.5

        doc.setFontSize(fontSizeNormal)
        doc.setFont('helvetica', 'normal')
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, marginLeft, currentY)
        currentY += lineHeight

        const filtros = []
        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          filtros.push(`Categoría: ${this.filtro_categoria}`)
        }
        if (this.soloConStock) {
          filtros.push('Solo con stock')
        }

        if (filtros.length > 0) {
          doc.setFontSize(fontSizeSmall)
          doc.text(`Filtros: ${filtros.join(', ')}`, marginLeft, currentY)
          currentY += lineHeight
        }

        if (!isTicket) {
          doc.setFontSize(fontSizeSmall)
          doc.text(`Total productos: ${this.listafiltrada.length} | Stock total: ${this.formatNumber(this.kpi.sumaStock)}`, marginLeft, currentY)
          currentY += lineHeight
          doc.text(`Costo total: ${this.monedaSimbolo}${this.formatMoney(this.kpi.sumaTotalCosto)} | Venta total: ${this.monedaSimbolo}${this.formatMoney(this.kpi.sumaTotalVenta)}`, marginLeft, currentY)
          currentY += lineHeight * 1.5
        } else {
          doc.setFontSize(fontSizeSmall)
          doc.text(`Prod: ${this.listafiltrada.length} | Stock: ${this.formatNumber(this.kpi.sumaStock)}`, marginLeft, currentY)
          currentY += lineHeight * 1.5
        }

        const headers = isTicket
          ? [['ID', 'PRODUCTO', 'MED', 'STOCK']]
          : [['ID', 'CATEGORÍA', 'NOMBRE', 'MEDIDA', `COSTO (${this.monedaSimbolo})`, 'STOCK', `P. VENTA (${this.monedaSimbolo})`, `T. COSTO (${this.monedaSimbolo})`, `T. VENTA (${this.monedaSimbolo})`]]

        const rows = this.listafiltrada.map(item => {
          if (isTicket) {
            let nombre = item.nombre || ''
            let medida = item.medida || ''

            return [
              item.id || '',
              nombre,
              medida,
              this.convierte_stock(item.stock, item.factor)
            ]
          } else {
            const costoN = this.toNumber(item.costo)
            const precioN = this.toNumber(item.precio)
            const stockN = this.toNumber(item.stock)

            return [
              item.id || '',
              item.categoria || '',
              item.nombre || '',
              item.medida || '',
              this.formatMoney(costoN),
              this.convierte_stock(item.stock, item.factor),
              this.formatMoney(precioN),
              this.formatMoney(costoN * stockN),
              this.formatMoney(precioN * stockN)
            ]
          }
        })

        const columnStyles = isTicket
          ? {
            0: { cellWidth: 10, fontSize: 6 },
            1: { cellWidth: 45, fontSize: 6 },
            2: { cellWidth: 8, fontSize: 6 },
            3: { cellWidth: 10, fontSize: 6, halign: 'right' }
          }
          : {
            0: { cellWidth: 20, fontSize: fontSizeSmall },
            1: { cellWidth: 30, fontSize: fontSizeSmall },
            2: { cellWidth: 50, fontSize: fontSizeSmall },
            3: { cellWidth: 25, fontSize: fontSizeSmall },
            4: { cellWidth: 25, fontSize: fontSizeSmall, halign: 'right' },
            5: { cellWidth: 25, fontSize: fontSizeSmall, halign: 'right' },
            6: { cellWidth: 30, fontSize: fontSizeSmall, halign: 'right' },
            7: { cellWidth: 30, fontSize: fontSizeSmall, halign: 'right' },
            8: { cellWidth: 30, fontSize: fontSizeSmall, halign: 'right' }
          }

        const styles = isTicket
          ? {
            fontSize: 6,
            cellPadding: 1,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'helvetica',
            overflow: 'linebreak',
            textColor: [0, 0, 0]
          }
          : {
            fontSize: fontSizeSmall,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'helvetica',
            textColor: [0, 0, 0]
          }

        doc.autoTable({
          head: headers,
          body: rows,
          startY: currentY,
          margin: { left: marginLeft, right: marginLeft },
          styles: styles,
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: isTicket ? 6 : fontSizeSmall,
            fontStyle: 'bold',
            lineWidth: 0.1
          },
          columnStyles: columnStyles,
          tableWidth: isTicket ? 'wrap' : 'auto',
          theme: 'grid',
          didDrawPage: (data) => {
            const pageCount = doc.internal.getNumberOfPages()
            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()

            doc.setFontSize(6)
            doc.setFont('helvetica', 'normal')
            const footerText = `Página ${data.pageNumber} de ${pageCount} - ${this.nombreSedeActual}`

            if (isTicket) {
              doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' })
            } else {
              doc.text(footerText, pageWidth - marginLeft, pageHeight - 10, { align: 'right' })
            }
          }
        })

        let nombreBase = 'inventario'
        const sedeNombre = this.nombreSedeActual.replace(/\s+/g, '_')
        nombreBase += `_${sedeNombre}`

        if (this.filtro_categoria && this.filtro_categoria !== 'TODOS') {
          nombreBase += `_${this.filtro_categoria.replace(/\s+/g, '_')}`
        }
        if (this.soloConStock) {
          nombreBase += '_con-stock'
        }

        const nombre = `${nombreBase}_${formato}_${this.nowString()}.pdf`
        doc.save(nombre)

        this.dialogoPDF = false

      } catch (e) {
        console.error('Error exportando a PDF', e)
        alert('No se pudo exportar a PDF.')
        this.dialogoPDF = false
      }
    }
  }
}
</script>

<style scoped>
.v-data-table td {
  vertical-align: middle !important;
}

.hover-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  background-color: #f5f5f5;
}
</style>