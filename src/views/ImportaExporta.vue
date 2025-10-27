<template>
  <v-container class="mt-4">
    <v-row dense class="mb-2">
      <v-col cols="12" sm="6" md="4">
        <v-select dense outlined hide-details v-model="target" :items="targetOptions" item-text="label"
          item-value="value" label="Entorno (tabla destino)" />
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" sm="6" md="4">
        <v-btn block color="primary" @click="exportarFormato">
          <v-icon left>mdi-file-export-outline</v-icon> Exportar Formato
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-btn block color="info" @click="exportarDatos">
          <v-icon left>mdi-microsoft-excel</v-icon> Exportar Datos
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-btn block color="teal" dark @click="abrirSelectorArchivo">
          <v-icon left>mdi-file-import</v-icon> Importar Excel
        </v-btn>
      </v-col>
    </v-row>

    <!-- Input oculto para seleccionar archivo Excel -->
    <input ref="fileXLSX" type="file" accept=".xlsx,.xls" style="display:none" @change="leerExcel" />

    <!-- Diálogo de importación y previsualización -->
    <v-dialog v-model="dialogoImport" max-width="1100px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoImport = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <span class="mr-3">Destino: <strong>{{ targetLabel }}</strong></span>
          <span class="mr-3">Registros válidos: {{ importRows.length }}</span>
          <v-btn small color="success" :loading="subiendoExcel" @click="subirImportados">
            <v-icon left>mdi-cloud-upload</v-icon> Subir a BD
          </v-btn>
        </v-system-bar>
      </div>

      <v-card>
        <v-card-title class="subtitle-1">Previsualización de Importación</v-card-title>
        <v-card-text>
          <v-alert v-if="importErrores.length" type="warning" dense class="mb-3">
            Se encontraron {{ importErrores.length }} filas con advertencias/errores.
            <div class="mt-2">
              <div v-for="(err, i) in importErrores" :key="'e' + i">
                <strong>Fila {{ err.fila }}</strong>
                <span v-if="err.id"> — {{ err.id }}</span>
                <span v-if="err.nombre"> — {{ err.nombre }}</span>:
                <em>{{ err.issues.join(', ') }}</em>
              </div>
            </div>
          </v-alert>

          <v-simple-table fixed-header height="420px">
            <template v-slot:default>
              <thead>
                <tr>
                  <th v-for="h in tablaHeaders" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in importRows" :key="idx">
                  <td v-for="h in tablaHeaders" :key="h">{{ r[h] }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar simple -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" top>
      {{ snackbar.text }}
      <v-btn text @click="snackbar.show = false">Cerrar</v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import XLSX from 'xlsx'
import moment from 'moment'
import store from '@/store'
import { crearOActualizarCliente,colClientes  } from '../db_firestore'
// BD: ajusta estos imports a tu capa real
import { nuevoProducto, nuevoCliente /*, upsertStockInicial */ } from '@/db'

export default {
  name: 'ExcelMasivo',
  data() {
    return {
      // target/entorno
      target: 'productos',
      targetOptions: [
        { label: 'Productos', value: 'productos' },
        { label: 'Clientes', value: 'clientes' },
        { label: 'Stock Inicial', value: 'stock' },
      ],

      // import UI
      dialogoImport: false,
      importRows: [],
      importErrores: [],
      subiendoExcel: false,

      snackbar: { show: false, text: '', timeout: 2500 }
    }
  },
  computed: {
    targetLabel() {
      const x = this.targetOptions.find(t => t.value === this.target)
      return x ? x.label : this.target
    },
    // columnas a mostrar en la previsualización (si no hay filas, usamos esquema por defecto)
    tablaHeaders() {
      if (this.importRows.length) return Object.keys(this.importRows[0])
      return this.esquemaPorDefecto()
    }
  },
  methods: {
    // ===== UI helpers =====
    abrirSelectorArchivo() {
      if (this.$refs.fileXLSX) {
        this.$refs.fileXLSX.value = null
        this.$refs.fileXLSX.click()
      }
    },
    alerta(msg) {
      this.snackbar.text = msg
      this.snackbar.show = true
    },

    // ===== Esquemas por defecto (para headers cuando aún no hay filas) =====
    esquemaPorDefecto() {
      if (this.target === 'productos') {
        return [
          'id', 'activo', 'codbarra', 'nombre', 'categoria', 'medida', 'stock', 'factor',
          'precio', 'escala_may1', 'precio_may1', 'escala_may2', 'precio_may2',
          'peso', 'costo', 'margen', 'tipoproducto', 'operacion', 'icbper', 'controstock',
          'lista_bono', 'tiene_bono', 'marca'
        ]
      }
      if (this.target === 'clientes') {
        return [
          'activo', 'id', 'tipodoc', 'documento', 'nombre', 'giro', 'correo', 'direccion', 'telefono',
          'sede', 'nota', 'referencia', 'departamento', 'provincia', 'distrito', 'ubigeo',
          'tipocomprobante', 'zona', 'dia', 'latitud', 'longitud'
        ]
      }
      // stock
      return ['id', 'stock']
    },

    // ===== Exportar formato (plantilla) =====
    exportarFormato() {
      let plantilla = []
      let sheetName = 'formato'

      if (this.target === 'productos') {
        plantilla = [{
          id: '10001',
          activo: true,
          codbarra: '',
          nombre: '',
          categoria: '',
          medida: 'UNIDAD',
          stock: 0,
          factor: 1,
          precio: 0,
          escala_may1: 0,
          precio_may1: 0,
          escala_may2: 0,
          precio_may2: 0,
          peso: 0,
          costo: 0,
          margen: 0,
          tipoproducto: 'BIEN',
          operacion: 'GRAVADA',
          icbper: false,
          controstock: true,
          lista_bono: '[]',   // como texto JSON
          tiene_bono: false,
          marca: ''
        }]
        sheetName = 'productos'
      } else if (this.target === 'clientes') {
        plantilla = [{
          activo: true,
          id: '',                 // opcional si igualas al doc
          tipodoc: 'DNI',
          documento: '',
          nombre: '',
          giro: '',
          correo: '',
          direccion: '',
          telefono: '',
          sede: '',
          nota: '',
          referencia: '',
          departamento: '',       // nombre o código
          provincia: '',
          distrito: '',
          ubigeo: '',
          tipocomprobante: 'T',
          zona: '',
          dia: '',
          latitud: '',
          longitud: ''
        }]
        sheetName = 'clientes'
      } else {
        plantilla = [{ id: '10001', stock: 0 }]
        sheetName = 'stock'
      }

      const ws = XLSX.utils.json_to_sheet(plantilla)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `FORMATO_${sheetName.toUpperCase()}.xlsx`)
      this.alerta('Formato descargado.')
    },

    // ===== Exportar datos actuales (según target) =====
    async exportarDatos() {
      let filas = []
      let name = 'datos'

      if (this.target === 'productos') {
        const productos = (store.state.productos || [])
        filas = productos.map(p => ({
          id: p.id,
          activo: !!p.activo,
          codbarra: p.codbarra || '',
          nombre: (p.nombre || '').trim(),
          categoria: p.categoria || '',
          medida: p.medida || 'UNIDAD',
          stock: Number(p.stock) || 0,
          factor: Number(p.factor) || 1,
          precio: Number(p.precio) || 0,
          escala_may1: Number(p.escala_may1) || 0,
          precio_may1: Number(p.precio_may1) || 0,
          escala_may2: Number(p.escala_may2) || 0,
          precio_may2: Number(p.precio_may2) || 0,
          peso: Number(p.peso) || 0,
          costo: Number(p.costo) || 0,
          margen: Number(p.margen) || 0,
          tipoproducto: p.tipoproducto || 'BIEN',
          operacion: p.operacion || 'GRAVADA',
          icbper: !!p.icbper,
          controstock: p.controstock !== false,
          lista_bono: JSON.stringify(p.lista_bono || []),
          tiene_bono: !!p.tiene_bono,
          marca: p.marca || ''
        }))
        name = 'productos'
      } else if (this.target === 'clientes') {
        const snap = await colClientes().get();   // ← usa el snapshot

    // Mapea los documentos
    const cli = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        filas = cli.map(c => ({
          activo: c.activo !== false,
          id: c.id || '',
          tipodoc: c.tipodoc || 'DNI',
          documento: c.documento || '',
          nombre: c.nombre || '',
           giro: c.giro || '', 
          correo: c.correo || '',
          direccion: c.direccion || '',
          telefono: c.telefono || '',
          sede: c.sede || '',
          nota: c.nota || '',
          referencia: c.referencia || '',
          departamento: (c.departamento && c.departamento.nombre) || c.departamento || '',
          provincia: (c.provincia && c.provincia.nombre) || c.provincia || '',
          distrito: (c.distrito && c.distrito.nombre) || c.distrito || '',
          ubigeo: c.ubigeo || '',
          tipocomprobante: c.tipocomprobante || 'T',
          zona: c.zona || '',
          dia: (c.dia ? String(c.dia) : '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase(),
          latitud: c.latitud || '',
          longitud: c.latitud || ''
        }))
        name = 'clientes'
      } else {
        // stock inicial (si lo guardas en productos.stock ya lo tienes arriba)
        const productos = (store.state.productos || [])
        filas = productos.map(p => ({ id: p.id, stock: Number(p.stock) || 0 }))
        name = 'stock'
      }

      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, name)
      XLSX.writeFile(wb, `${name.toUpperCase()}.xlsx`)
      this.alerta('Exportación completada.')
    },

    // ===== Importar =====
    leerExcel(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

          // normaliza según target
          let normalizados = []
          if (this.target === 'productos') {
            normalizados = json.map(r => this.normalizaProducto(r))
          } else if (this.target === 'clientes') {
            normalizados = json.map(r => this.normalizaCliente(r))
          } else {
            normalizados = json.map(r => this.normalizaStock(r))
          }

          const { ok, errores } = this.validaFilas(normalizados)
          this.importErrores = errores
          this.importRows = ok
          this.dialogoImport = true
        } catch (err) {
          console.error(err)
          this.alerta('Archivo Excel inválido.')
        }
      }
      reader.readAsArrayBuffer(file)
    },

    // ---- Normalizadores por target ----
    _toBool(v, def = false) {
      if (typeof v === 'boolean') return v
      if (v === null || v === undefined || v === '') return def
      const s = String(v).toLowerCase().trim()
      return ['true', '1', 'si', 'sí', 'yes', 'y', 'x'].includes(s)
    },
    _toNum(v, def = 0, decs = null) {
      if (typeof v === 'number' && !isNaN(v)) {
        return decs == null ? v : Number(v.toFixed(decs));
      }
      const n = parseFloat(String(v).replace(',', '.'));
      if (isNaN(n)) return def;
      return decs == null ? n : Number(n.toFixed(decs)); // <-- redondea
    },
    _toStr(v, def = '') {
      return (v === null || v === undefined) ? def : String(v).trim()
    },

    normalizaProducto(row) {
      const o = {}; Object.keys(row).forEach(k => o[String(k).toLowerCase().trim()] = row[k]);

      const listaBonoRaw = this._toStr(o.lista_bono, '[]');
      let lista_bono; try { lista_bono = JSON.parse(listaBonoRaw) } catch { lista_bono = [] }

      return {
        id: this._toStr(o.id),
        activo: this._toBool(o.activo, true),
        codbarra: this._toStr(o.codbarra),
        nombre: this._toStr(o.nombre),
        categoria: this._toStr(o.categoria),
        medida: this._toStr(o.medida || 'UNIDAD'),
        stock: this._toNum(o.stock, 0),                 // sin redondeo forzado
        factor: this._toNum(o.factor, 1),
        precio: this._toNum(o.precio, 0, 2),            // <-- 2 decimales
        escala_may1: this._toNum(o.escala_may1, 0),
        precio_may1: this._toNum(o.precio_may1, 0, 2),  // <-- 2 decimales
        escala_may2: this._toNum(o.escala_may2, 0),
        precio_may2: this._toNum(o.precio_may2, 0, 2),  // <-- 2 decimales
        peso: this._toNum(o.peso, 0),
        costo: this._toNum(o.costo, 0, 2),              // <-- si también quieres costo con 2
        margen: this._toNum(o.margen, 0),               // normalmente % puede quedarse tal cual
        tipoproducto: this._toStr(o.tipoproducto || 'BIEN'),
        operacion: this._toStr(o.operacion || 'GRAVADA'),
        icbper: this._toBool(o.icbper, false),
        controstock: this._toBool(o.controstock, true),
        lista_bono,
        tiene_bono: this._toBool(o.tiene_bono, false),
        marca: this._toStr(o.marca)
      }
    },


    normalizaCliente(row) {
      const o = {}
      Object.keys(row).forEach(k => o[String(k).toLowerCase().trim()] = row[k])

      return {
        activo: this._toBool(o.activo, true),
        id: this._toStr(o.id), // opcional
        tipodoc: this._toStr(o.tipodoc || 'DNI').toUpperCase(),
        documento: this._toStr(o.documento),
        nombre: this._toStr(o.nombre),
            giro: this._toStr(o.giro),            // ← nuevo
        correo: this._toStr(o.correo),
        direccion: this._toStr(o.direccion),
        telefono: this._toStr(o.telefono),
        sede: this._toStr(o.sede),
        nota: this._toStr(o.nota),
        referencia: this._toStr(o.referencia),
        departamento: this._toStr(o.departamento),
        provincia: this._toStr(o.provincia),
        distrito: this._toStr(o.distrito),
        ubigeo: this._toStr(o.ubigeo),
        tipocomprobante: this._toStr(o.tipocomprobante || 'T'),
        zona: this._toStr(o.zona),
        dia: this._toStr(o.dia)
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .toLowerCase(),
        latitud: this._toStr(o.latitud),
        longitud: this._toStr(o.longitud),
      }
    },

    normalizaStock(row) {
      const o = {}
      Object.keys(row).forEach(k => o[String(k).toLowerCase().trim()] = row[k])
      return {
        id: this._toStr(o.id),
        stock: this._toNum(o.stock, 0)
      }
    },

    // ---- Validaciones por target ----
    validaFilas(filas) {
      const errores = []
      const ok = []
      for (let i = 0; i < filas.length; i++) {
        const r = filas[i]
        const issues = []

        if (this.target === 'productos') {
          if (!r.id) issues.push('id requerido')
          if (!r.nombre) issues.push('nombre requerido')
          if (!r.categoria || r.categoria === '1') issues.push('categoría inválida')
          if (Number(r.precio) === 0) issues.push('precio no puede ser 0')
        } else if (this.target === 'clientes') {
          if (!r.documento) issues.push('documento requerido')
          if (!r.tipodoc) issues.push('tipodoc requerido')
          if (!r.nombre) issues.push('nombre requerido')
        } else {
          if (!r.id) issues.push('id requerido')
          // stock puede ser 0
        }

        if (issues.length) errores.push({ fila: i + 2, id: r.id, nombre: r.nombre, issues })
        else ok.push(r)
      }
      return { ok, errores }
    },

    // ===== Subir (según target) =====
    async subirImportados() {
      if (!this.importRows.length) {
        this.alerta('No hay filas válidas para subir.')
        return
      }
      store.commit("dialogoprogress")
      // procesa en paralelo por lotes para no saturar la red/SDK
      const BATCH = 50 // ajusta 20–100 según tu backend
      const ahora = moment().unix()
      this.subiendoExcel = true

      const runBatches = async (tasks) => {
        let ok = 0, fail = 0, errs = []
        for (let i = 0; i < tasks.length; i += BATCH) {
          const slice = tasks.slice(i, i + BATCH)
          const res = await Promise.allSettled(slice.map(fn => fn()))
          res.forEach(r => r.status === 'fulfilled' ? ok++ : (fail++, errs.push(r.reason)))
        }
        return { ok, fail, errs }
      }

      try {
        let tasks = []

        if (this.target === 'productos') {
          tasks = this.importRows.map(r => () => {
            const payload = {
              id: r.id,
              activo: !!r.activo,
              codbarra: r.codbarra || '',
              nombre: String(r.nombre || '').trim(),
              categoria: r.categoria || '',
              medida: r.medida || 'NIU',
              stock: Number(r.stock ?? 0),
              factor: Number(r.factor ?? 1),
              precio: Number(r.precio ?? 0),
              escala_may1: Number(r.escala_may1 ?? 0),
              precio_may1: Number(r.precio_may1 ?? 0),
              escala_may2: Number(r.escala_may2 ?? 0),
              precio_may2: Number(r.precio_may2 ?? 0),
              peso: Number(r.peso ?? 0),
              costo: Number(r.costo ?? 0),
              margen: Number(r.margen ?? 0),
              tipoproducto: r.tipoproducto || 'BIEN',
              operacion: r.operacion || 'GRAVADA',
              icbper: !!r.icbper,
              controstock: !!r.controstock,
              lista_bono: Array.isArray(r.lista_bono) ? r.lista_bono : [],
              tiene_bono: !!r.tiene_bono,
              marca: r.marca || '',
              editado: ahora,
            }
            return nuevoProducto(r.id, payload)
          })
        } else if (this.target === 'clientes') {
          tasks = this.importRows.map(r => () => {
            const form = {
              activo: !!r.activo,
              id: r.id || r.documento,
              tipodoc: r.tipodoc || '1',
              documento: r.documento,
              nombre: String(r.nombre || '').trim(),
              giro: r.giro || '',      
              correo: r.correo || '',
              direccion: r.direccion || '',
              telefono: r.telefono || '',
              sede: r.sede || '',
              nota: r.nota || '',
              referencia: r.referencia || '',
              departamento: r.departamento || null,
              provincia: r.provincia || null,
              distrito: r.distrito || null,
              ubigeo: r.ubigeo || '',
              tipocomprobante: r.tipocomprobante || 'T',
              zona: r.zona || '',
              dia: r.dia || '',
              latitud: String(r.latitud ?? ''),
              longitud: String(r.longitud ?? ''),
              editado: ahora,
            }
            return crearOActualizarCliente(r.documento, { ...form })
          })
        } else {
          // stock inicial (rápido) — solo actualiza campos necesarios
          tasks = this.importRows.map(r => () =>
            nuevoProducto(r.id, { stock: Number(r.stock) || 0, editado: ahora })
          )
        }

        const { ok, fail } = await runBatches(tasks)

        this.alerta(`Importación completada. Correctos: ${ok}${fail ? ` · Fallidos: ${fail}` : ''}`)
        this.dialogoImport = false
        this.importRows = []
        this.importErrores = []
      } catch (e) {
        console.error(e)
        this.alerta('Ocurrió un error durante la importación.')
      } finally {
        this.subiendoExcel = false
        store.commit("dialogoprogress")
      }
    }

  }
}
</script>
