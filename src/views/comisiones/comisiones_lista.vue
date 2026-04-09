<template>
  <v-dialog v-model="dialogInterno" max-width="1200" persistent scrollable>
    <v-card class="rounded-lg">
      <!-- Toolbar -->
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title>
          <v-icon left>mdi-clipboard-list</v-icon>
          Objetivos de Comisiones
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Header con filtros -->
      <v-card-title class="pa-3 blue-grey lighten-5">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-row dense>
              <v-col cols="6">
                <v-select v-model="filtroAnio" :items="aniosDisponibles" label="Año" dense outlined clearable
                  prepend-inner-icon="mdi-calendar" hide-details @change="aplicarFiltros"
                  placeholder="Todos los años"></v-select>
              </v-col>
              <v-col cols="6">
                <v-select v-model="filtroMes" :items="meses" label="Mes" dense outlined clearable
                  prepend-inner-icon="mdi-calendar-month" hide-details @change="aplicarFiltros"
                  placeholder="Todos los meses" item-text="nombre" item-value="valor"></v-select>
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12" md="6" class="d-flex justify-end">
            <v-btn color="success" @click="abrirNuevo" :loading="cargando">
              <v-icon left>mdi-plus</v-icon>
              Nuevo Objetivo
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <!-- Tabla de datos -->
      <v-card-text class="pa-0">
        <v-data-table :headers="headers" :items="comisionesFiltradas" :loading="cargando"
          loading-text="Cargando objetivos..." no-data-text="No hay objetivos de comisiones" dense class="elevation-0">
          <!-- Período -->
          <template v-slot:[`item.periodo`]="{ item }">
            <v-chip small outlined color="primary" class="font-weight-bold">
              {{ formatPeriodo(item.periodo) }}
            </v-chip>
          </template>

          <!-- Métricas -->
          <template v-slot:[`item.n_clientes_compra`]="{ item }">
            <span class="font-weight-bold">{{ item.datos.n_clientes_compra || 0 }}</span>
          </template>

          <template v-slot:[`item.n_mix_items_ventas`]="{ item }">
            <span class="font-weight-bold">{{ item.datos.n_mix_items_ventas || 0 }}</span>
          </template>

          <template v-slot:[`item.n_cobertura`]="{ item }">
            <span class="font-weight-bold">{{ item.datos.n_cobertura || 0 }}%</span>
          </template>

          <template v-slot:[`item.n_ventas_contado`]="{ item }">
            <span class="font-weight-bold">{{ formatMonto(item.datos.n_ventas_contado) }}%</span>
          </template>

          <!-- Proveedores con tooltip -->
          <template v-slot:[`item.proveedores`]="{ item }">
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-chip small outlined :color="getProveedoresColor(item.datos.proveedores)" v-bind="attrs" v-on="on">
                  <v-icon left small>mdi-account-group</v-icon>
                  {{ Object.keys(item.datos.proveedores || {}).length }} proveedores
                </v-chip>
              </template>
              <v-list dense max-height="300" class="overflow-y-auto">
                <v-list-item v-for="(datos, nombre) in item.datos.proveedores" :key="nombre">
                  <v-list-item-content>
                    <v-list-item-title class="text-caption font-weight-bold">
                      {{ nombre }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      <v-row dense>
                        <v-col cols="12">
                          <v-icon x-small>mdi-cash</v-icon> Com: {{ moneda }} {{ formatMonto(datos.monto_comisiones) }}
                        </v-col>
                        <v-col cols="12">
                          <v-icon x-small>mdi-chart-line</v-icon> Plan: {{ moneda }} {{
                            formatMonto(datos.monto_plan_soles) }}
                        </v-col>
                        <v-col cols="12">
                          <v-icon x-small>mdi-percent</v-icon> % Min: {{ datos.porcentaje_minimo }}%
                        </v-col>
                        <v-col cols="12" class="primary--text">
                          <v-icon x-small color="primary">mdi-target</v-icon>
                          Obj Min: {{ moneda }} {{ formatMonto(calcularObjetivoMinimo(datos)) }}
                        </v-col>
                      </v-row>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <!-- Acciones -->
          <template v-slot:[`item.acciones`]="{ item }">
           <v-btn icon small @click="editar(item.periodo, item.vendedor, item.datos)" title="Editar">
  <v-icon small color="primary">mdi-pencil</v-icon>
</v-btn>

<v-btn icon small @click="eliminar(item.periodo, item.vendedor)" title="Eliminar">
  <v-icon small color="error">mdi-delete</v-icon>
</v-btn>
          </template>
        </v-data-table>
      </v-card-text>

      <!-- Diálogo de comisiones -->
     <dialogo_comisiones
  v-model="dialogForm"
  :periodo-edit="periodoEdit"
  :vendedor-edit="vendedorEdit"
  :datos-edit="datosEdit"
  :modo="modoDialog"
  :proveedores-existentes="nombresProveedoresExistentes"
  :vendedores-existentes="vendedoresExistentes"
  @creada="onComisionCreada"
  @actualizada="onComisionActualizada"
  @cerrar="cerrarFormulario"
/>
    </v-card>
  </v-dialog>
</template>

<script>
import { allComisiones, eliminaComision } from '@/db'
import { allProveedor_ } from '@/db'
import store from '@/store/index'
import dialogo_comisiones from './dialogo_comisiones.vue'
import moment from 'moment'

export default {
  name: 'ComisionesLista',
  components: {
    dialogo_comisiones
  },

  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
data() {
  return {
    cargando: false,
    dialogForm: false,
    modoDialog: 'crear',

    comisiones: {},
    comisionesLista: [],
    nombresProveedoresExistentes: [],
    vendedoresExistentes: [],

    periodoEdit: null,
    vendedorEdit: null,
    datosEdit: null,

    filtroAnio: null,
    filtroMes: null,

    meses: [
      { nombre: 'Enero', valor: 1 },
      { nombre: 'Febrero', valor: 2 },
      { nombre: 'Marzo', valor: 3 },
      { nombre: 'Abril', valor: 4 },
      { nombre: 'Mayo', valor: 5 },
      { nombre: 'Junio', valor: 6 },
      { nombre: 'Julio', valor: 7 },
      { nombre: 'Agosto', valor: 8 },
      { nombre: 'Setiembre', valor: 9 },
      { nombre: 'Octubre', valor: 10 },
      { nombre: 'Noviembre', valor: 11 },
      { nombre: 'Diciembre', valor: 12 }
    ],

    headers: [
      { text: 'Período', value: 'periodo', width: '150px', sortable: true },
      { text: 'Vendedor', value: 'vendedor_nombre', width: '180px', sortable: true },
      { text: 'Clientes', value: 'n_clientes_compra', align: 'center', width: '90px', sortable: true },
      { text: 'Mix Items', value: 'n_mix_items_ventas', align: 'center', width: '90px', sortable: true },
      { text: 'Cobertura', value: 'n_cobertura', align: 'center', width: '90px', sortable: true },
      { text: 'VentasContado', value: 'n_ventas_contado', align: 'center', width: '110px', sortable: true },
      { text: 'Proveedores', value: 'proveedores', align: 'center', width: '120px', sortable: false },
      { text: 'Acciones', value: 'acciones', sortable: false, align: 'center', width: '100px' }
    ]
  }
},

  computed: {
    dialogInterno: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },

    moneda() {
      return store.state.moneda?.find(m => m.codigo === store.state.configuracion?.moneda_defecto)?.simbolo || 'S/'
    },

    aniosDisponibles() {
      const anios = new Set()
      this.comisionesLista.forEach(item => {
        const [anio] = item.periodo.split('-')
        anios.add(parseInt(anio))
      })
      return Array.from(anios).sort((a, b) => b - a)
    },

    comisionesFiltradas() {
      // console.log('Lista completa antes de filtrar:', this.comisionesLista)

      let filtradas = this.comisionesLista.filter(item => {
        const tieneDatos = item &&
          item.datos &&
          typeof item.datos === 'object' &&
          Object.keys(item.datos).length > 0
        return tieneDatos
      })

      if (this.filtroAnio) {
        filtradas = filtradas.filter(item => {
          const [anio] = item.periodo.split('-')
          return parseInt(anio) === this.filtroAnio
        })
      }

      if (this.filtroMes) {
        filtradas = filtradas.filter(item => {
          const [, mes] = item.periodo.split('-')
          return parseInt(mes) === this.filtroMes
        })
      }
      return filtradas
    },
  },

  watch: {
    value: {
      handler(nuevo) {
        if (nuevo) {
          console.log('Lista abierta - NO cargar automáticamente')
        }
      },
      immediate: false
    },
  },

  created() {
    const hoy = moment()
    this.filtroAnio = hoy.year()
    this.filtroMes = hoy.month() + 1
    this.cargarComisiones(this.filtroAnio, this.filtroMes)
this.cargarVendedoresExistentes()
    this.cargarProveedoresExistentes()
  },

  methods: {
    async cargarVendedoresExistentes() {
  try {
    const vendedores = this.$store.state.array_sedes || []
    this.vendedoresExistentes = vendedores
      .filter(v => v && v.activo !== false && v.codigo)
      .map(v => ({
        ...v,
        displayText: `${v.codigo} - ${v.nombre}`
      }))
  } catch (error) {
    console.error('Error cargando vendedores existentes:', error)
  }
},
async cargarComisiones(anio = null, mes = null, periodoEspecifico = null) {
  this.cargando = true
  store.commit('dialogoprogress', true)

  try {
    const snap = await allComisiones().once('value')
    const data = snap.val() || {}

    let lista = []

    Object.keys(data).forEach(codVendedor => {
      const periodosVendedor = data[codVendedor] || {}

      Object.keys(periodosVendedor).forEach(periodo => {
        const item = periodosVendedor[periodo]

        if (!item || typeof item !== 'object') return

        const [anioItem, mesItem] = periodo.split('-')

        if (periodoEspecifico && periodo !== periodoEspecifico) return
        if (anio && parseInt(anioItem, 10) !== parseInt(anio, 10)) return
        if (mes && parseInt(mesItem, 10) !== parseInt(mes, 10)) return

        lista.push({
          periodo,
          vendedor: codVendedor,
          vendedor_nombre: item.vendedor_nombre || codVendedor,
          datos: item
        })
      })
    })

    this.comisionesLista = lista.sort((a, b) => {
      if (a.periodo === b.periodo) {
        return (a.vendedor || '').localeCompare(b.vendedor || '')
      }
      return b.periodo.localeCompare(a.periodo)
    })

    console.log('LISTA FINAL', this.comisionesLista)
  } catch (error) {
    console.error('Error cargando comisiones:', error)
    store.commit('dialogosnackbar', 'Error al cargar comisiones')
  } finally {
    this.cargando = false
    store.commit('dialogoprogress', false)
  }
},
    async cargarProveedoresExistentes() {
      try {
        const snap = await allProveedor_().once('value')
        const data = snap.val() || {}

        this.nombresProveedoresExistentes = Object.keys(data)
          .map(key => data[key].nombre || key)
          .filter(nombre => nombre)
          .sort()

      } catch (error) {
        console.error('Error cargando proveedores:', error)
      }
    },

    abrirNuevo() {
      this.periodoEdit = null
      this.datosEdit = null
      this.modoDialog = 'crear'
      this.dialogForm = true
    },

  editar(periodo, vendedor, datos) {
  this.periodoEdit = periodo
  this.vendedorEdit = vendedor
  this.datosEdit = datos
  this.modoDialog = 'editar'
  this.dialogForm = true
},

async eliminar(periodo, vendedor) {
  const periodoFormateado = this.formatPeriodo(periodo)
  if (!confirm(`¿Está seguro de eliminar el objetivo de ${periodoFormateado} - ${vendedor}?`)) return

  store.commit('dialogoprogress', true)

  try {
    await eliminaComision(periodo, vendedor)
    store.commit('dialogosnackbar', 'Objetivo eliminado correctamente')
    await this.cargarComisiones(this.filtroAnio, this.filtroMes)
  } catch (error) {
    console.error('Error eliminando:', error)
    store.commit('dialogosnackbar', 'Error al eliminar el objetivo')
  } finally {
    store.commit('dialogoprogress', false)
  }
},

    async onComisionCreada() {
      await this.cargarComisiones(this.filtroAnio, this.filtroMes)
      this.cerrarFormulario()
    },

    async onComisionActualizada() {
      await this.cargarComisiones(this.filtroAnio, this.filtroMes)
      this.cerrarFormulario()
    },

    cerrarFormulario() {
  this.dialogForm = false
  this.periodoEdit = null
  this.vendedorEdit = null
  this.datosEdit = null
},

    aplicarFiltros() {
      this.cargarComisiones(this.filtroAnio, this.filtroMes)
    },

    formatMonto(valor) {
      return Number(valor || 0).toFixed(2)
    },

    formatPeriodo(periodo) {
      if (!periodo) return ''
      const [anio, mes] = periodo.split('-')
      return `${this.meses[parseInt(mes) - 1].nombre} ${anio}`
    },

    calcularObjetivoMinimo(datos) {
      return (datos.monto_plan_soles * datos.porcentaje_minimo) / 100
    },

    getProveedoresColor(proveedores) {
      const cantidad = Object.keys(proveedores || {}).length
      if (cantidad === 0) return 'grey'
      if (cantidad < 3) return 'info'
      if (cantidad < 6) return 'success'
      return 'primary'
    },

    cerrar() {
      this.$emit('input', false)
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.v-data-table ::v-deep .v-data-table-header th {
  font-size: 0.8rem;
  font-weight: 600;
  color: #37474F;
}

.v-chip {
  cursor: pointer;
  transition: all 0.2s;
}

.v-chip:hover {
  transform: scale(1.05);
}
</style>