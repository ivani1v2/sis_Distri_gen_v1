<template>
  <v-dialog v-model="dialog" max-width="900" persistent scrollable>
    <v-card class="rounded-lg">
      <!-- Toolbar -->
      <v-toolbar :color="toolbarColor" dark dense>
        <v-toolbar-title>
          {{ tituloDialogo }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="cerrar" :disabled="guardando">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Sin datos -->
      <v-card-text v-if="sinDatos" class="text-center py-10">
        <v-icon size="64" color="grey lighten-1">mdi-clipboard-alert-outline</v-icon>
        <div class="text-h6 mt-4 grey--text">No hay objetivo configurado</div>
        <div class="caption grey--text">Para el período {{ formatPeriodo(periodoEdit) }}</div>
      </v-card-text>

      <!-- Cargando -->
      <v-card-text v-else-if="cargandoObjetivo" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="caption mt-3">Cargando objetivo...</div>
      </v-card-text>

      <!-- Contenido -->
      <v-card-text v-else class="pa-4">
        <v-form ref="form" v-model="valido">
          <!-- Período -->
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-select outlined dense v-model="anio" :items="anios" label="Año *" prepend-inner-icon="mdi-calendar"
                :rules="[v => !!v || 'Año requerido']" :error="!!errorPeriodo"
                :disabled="modo === 'editar' || guardando || ((modo === 'ver' || soloLectura) && !!vendedorEdit)"@change="validarPeriodo" />
            </v-col>

            <v-col cols="12" sm="4">
              <v-select outlined dense v-model="mes" :items="meses" item-text="nombre" item-value="valor" label="Mes *"
                prepend-inner-icon="mdi-calendar-month" :rules="[v => !!v || 'Mes requerido']" :error="!!errorPeriodo"
                :disabled="modo === 'editar' || guardando || ((modo === 'ver' || soloLectura) && !!vendedorEdit)" @change="validarPeriodo" />
            </v-col>

            <v-col cols="12" sm="4">
            <v-autocomplete
  outlined
  dense
  v-model="vendedorSeleccionado"
  :items="listaVendedores"
  label="Vendedor *"
  item-text="displayText"
  item-value="codigo"
  prepend-inner-icon="mdi-account-tie"
  :rules="[v => !!v || 'Vendedor requerido']"
  :disabled="modo === 'editar' || guardando || ((modo === 'ver' || soloLectura) && !!vendedorEdit)"
  @change="validarPeriodo"
/>
            </v-col>

            <v-col cols="12" v-if="errorPeriodo">
              <v-alert type="error" dense border="left">
                {{ errorPeriodo }}
              </v-alert>
            </v-col>
          </v-row>
          <!-- Métricas generales -->
          <v-card outlined class="pa-3 mb-4">
            <v-card-title class="pa-0 mb-2 text-subtitle-2 primary--text">
              <v-icon left small color="primary">mdi-chart-bar</v-icon>
              Métricas de Rendimiento
            </v-card-title>

            <v-row dense>
              <v-col cols="12" sm="6" md="3">
                <v-text-field outlined dense type="number" v-model.number="n_clientes_compra"
                  label="Clientes con compra" prepend-inner-icon="mdi-account-group"
                  :rules="[v => v >= 0 || 'Debe ser ≥ 0']" :disabled="modo === 'ver' || guardando"></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field outlined dense type="number" v-model.number="n_mix_items_ventas"
                  label="Mix items por venta" prepend-inner-icon="mdi-package-variant"
                  :rules="[v => v >= 0 || 'Debe ser ≥ 0']" :disabled="modo === 'ver' || guardando"></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field outlined dense type="number" v-model.number="n_cobertura" label="Cobertura"
                  prepend-inner-icon="mdi-map-marker-radius" :rules="[v => v >= 0 || 'Debe ser ≥ 0']"
                  :disabled="modo === 'ver' || guardando"></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field outlined dense type="number" v-model.number="n_ventas_contado" label="Ventas al contado"
                  prepend-inner-icon="mdi-cash" :rules="[v => v >= 0 || 'Debe ser ≥ 0']" prefix="%"
                  :disabled="modo === 'ver' || guardando"></v-text-field>
              </v-col>
            </v-row>
          </v-card>

          <!-- Proveedores -->
          <v-card outlined class="pa-3">
            <v-card-title class="pa-0 mb-2 text-subtitle-2 primary--text">
              <v-icon left small color="primary">mdi-truck</v-icon>
              Comisiones por Proveedor
              <v-spacer></v-spacer>

              <template v-if="modo !== 'ver'">
                <v-btn small color="info" @click="confirmarAgregarTodos"
                  :disabled="!tieneProveedoresParaAgregar || guardando" class="mr-2" :loading="agregandoTodos">
                  <v-icon left small>mdi-content-duplicate</v-icon>
                  Agregar Todos
                </v-btn>

                <v-btn small color="success" @click="agregarProveedor" :disabled="!puedeAgregarProveedor || guardando">
                  <v-icon left small>mdi-plus</v-icon>
                  Agregar
                </v-btn>
              </template>
            </v-card-title>

            <!-- Selector de proveedor (solo visible si no es modo ver) -->
            <template v-if="modo !== 'ver'">
              <v-row dense class="mb-3">
                <v-col cols="12" sm="5">
                  <v-combobox outlined dense v-model="nombreProveedorTemp" :items="nombresProveedoresExistentes"
                    label="Nombre del proveedor *" prepend-inner-icon="mdi-account-tie" clearable
                    :loading="cargandoProveedores" no-data-text="Escriba el nombre del proveedor"
                    hint="Seleccione existente o escriba nuevo" persistent-hint @input="validarProveedorTemp"
                    :error="!!errorProveedorTemp"
                    :success="nombreProveedorTemp && !errorProveedorTemp && !proveedorYaAgregado"
                    :disabled="guardando"></v-combobox>

                  <div v-if="errorProveedorTemp" class="text-caption error--text mt-1">
                    <v-icon x-small color="error">mdi-alert-circle</v-icon>
                    {{ errorProveedorTemp }}
                  </div>

                  <div v-if="nombreProveedorTemp && !errorProveedorTemp && proveedorYaAgregado"
                    class="text-caption warning--text mt-1">
                    <v-icon x-small color="warning">mdi-alert</v-icon>
                    Ya está en la lista
                  </div>

                  <div v-if="nombreProveedorTemp && !errorProveedorTemp && !proveedorYaAgregado && !proveedorExisteEnBD"
                    class="text-caption success--text mt-1">
                    <v-icon x-small color="success">mdi-plus-circle</v-icon>
                    Nuevo proveedor (se creará al guardar)
                  </div>
                </v-col>

                <v-col cols="12" sm="7" v-if="mostrarCamposTemp">
                  <v-row dense>
                    <v-col cols="4">
                      <v-text-field outlined dense type="number" v-model.number="montoComisionesTemp" label="Comisiones"
                        prepend-inner-icon="mdi-cash-multiple" :prefix="moneda" :rules="[v => v >= 0 || 'Monto válido']"
                        :disabled="guardando"></v-text-field>
                    </v-col>

                    <v-col cols="4">
                      <v-text-field outlined dense type="number" v-model.number="montoPlanSolesTemp" label="Plan"
                        prepend-inner-icon="mdi-cash" :prefix="moneda" :rules="[v => v >= 0 || 'Monto válido']"
                        :disabled="guardando"></v-text-field>
                    </v-col>

                    <v-col cols="4">
                      <v-text-field outlined dense type="number" v-model.number="porcentajeMinimoTemp" label="% mínimo"
                        prepend-inner-icon="mdi-percent" :rules="[v => v >= 0 && v <= 100 || 'Entre 0 y 100']"
                        :disabled="guardando"></v-text-field>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </template>

            <!-- Tabla de proveedores -->
            <v-simple-table dense>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th class="text-right">Comisiones</th>
                    <th class="text-right">Plan</th>
                    <th class="text-right">% Mínimo</th>
                    <th class="text-right">Objetivo Mínimo</th>
                    <th class="text-center" v-if="modo !== 'ver'">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(datos, nombre) in proveedores" :key="nombre">
                    <td>
                      <span>{{ nombre }}</span>
                      <v-chip v-if="modo !== 'ver' && !esProveedorExistente(nombre)" x-small color="warning"
                        class="ml-1">
                        nuevo
                      </v-chip>
                    </td>

                    <td class="text-right">
                      <template v-if="modo === 'ver'">
                        {{ moneda }} {{ formatMonto(datos.monto_comisiones) }}
                      </template>
                      <template v-else>
                        <v-edit-dialog :return-value.sync="datos.monto_comisiones" @save="actualizarProveedor" large
                          :disabled="guardando">
                          {{ moneda }} {{ formatMonto(datos.monto_comisiones) }}
                          <template v-slot:input>
                            <v-text-field v-model.number="datos.monto_comisiones" type="number" :prefix="moneda" dense
                              single-line :disabled="guardando"></v-text-field>
                          </template>
                        </v-edit-dialog>
                      </template>
                    </td>

                    <td class="text-right">
                      <template v-if="modo === 'ver'">
                        {{ moneda }} {{ formatMonto(datos.monto_plan_soles) }}
                      </template>
                      <template v-else>
                        <v-edit-dialog :return-value.sync="datos.monto_plan_soles" @save="actualizarProveedor" large
                          :disabled="guardando">
                          {{ moneda }} {{ formatMonto(datos.monto_plan_soles) }}
                          <template v-slot:input>
                            <v-text-field v-model.number="datos.monto_plan_soles" type="number" :prefix="moneda" dense
                              single-line :disabled="guardando"></v-text-field>
                          </template>
                        </v-edit-dialog>
                      </template>
                    </td>

                    <td class="text-right">
                      <template v-if="modo === 'ver'">
                        {{ datos.porcentaje_minimo }}%
                      </template>
                      <template v-else>
                        <v-edit-dialog :return-value.sync="datos.porcentaje_minimo" @save="actualizarProveedor" large
                          :disabled="guardando">
                          {{ datos.porcentaje_minimo }}%
                          <template v-slot:input>
                            <v-text-field v-model.number="datos.porcentaje_minimo" type="number" suffix="%"
                              :rules="[v => v >= 0 && v <= 100]" dense single-line :disabled="guardando"></v-text-field>
                          </template>
                        </v-edit-dialog>
                      </template>
                    </td>

                    <td class="text-right font-weight-bold primary--text">
                      {{ moneda }} {{ formatMonto(calcularObjetivoMinimo(datos)) }}
                    </td>

                    <td class="text-center" v-if="modo !== 'ver'">
                      <v-btn icon x-small color="error" @click="eliminarProveedor(nombre)" :disabled="guardando">
                        <v-icon x-small>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>

            <div v-if="!tieneProveedores" class="text-center py-4 grey--text">
              <v-icon color="grey lighten-1" class="mb-2">mdi-truck-off</v-icon>
              <div>No hay proveedores agregados</div>
            </div>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Acciones del formulario -->
      <v-card-actions class="px-4 py-3">
        <v-btn text small @click="cerrar" :disabled="guardando">
          Cancelar
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn v-if="modo !== 'ver'" color="success" :disabled="!puedeGuardar" @click="guardar" :loading="guardando">
          <v-icon left small>mdi-content-save</v-icon>
          {{ modo === 'editar' ? 'Actualizar' : 'Guardar Objetivo' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Diálogo de confirmación para agregar todos -->
    <v-dialog v-model="dialogConfirmarAgregarTodos" max-width="400">
      <v-card>
        <v-card-title class="headline">
          Confirmar acción
        </v-card-title>
        <v-card-text>
          ¿Está seguro de agregar todos los proveedores disponibles?
          <br>
          <span class="font-weight-bold">{{ proveedoresDisponibles.length }} proveedores</span> serán agregados con
          valores en 0.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogConfirmarAgregarTodos = false">Cancelar</v-btn>
          <v-btn color="primary" @click="agregarTodosProveedores" :loading="agregandoTodos">
            Sí, agregar todos
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import { consultaComision, nuevaComision, actualizaComision } from '@/db'
import store from '@/store/index'
import moment from 'moment'

export default {
  name: 'DialogoComisiones',

  props: {
    value: Boolean,
    periodoEdit: {
      type: String,
      default: null
    },
    vendedorEdit: {
      type: [String, Number],
      default: null
    },
    datosEdit: {
      type: Object,
      default: null
    },
    modo: {
      type: String,
      default: 'crear'
    },
    proveedoresExistentes: {
      type: Array,
      default: () => []
    },
    vendedoresExistentes: {
      type: Array,
      default: () => []
    },
    soloLectura: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // Estados
      dialog: this.value,
      valido: false,
      guardando: false,
      cargandoProveedores: false,
      agregandoTodos: false,
      dialogConfirmarAgregarTodos: false,
      cargandoObjetivo: false,
      sinDatos: false,

      // Período
      anio: moment().year(),
      mes: moment().month() + 1,
      anios: [2026, 2027],
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

      // Métricas
      n_clientes_compra: 0,
      n_mix_items_ventas: 0,
      n_cobertura: 0,
      n_ventas_contado: 0,

      // Proveedores
      proveedores: {},
      nombresProveedoresExistentes: [],

      // Proveedor temporal
      nombreProveedorTemp: null,
      montoComisionesTemp: 0,
      montoPlanSolesTemp: 0,
      porcentajeMinimoTemp: 0,

      // Errores
      errorPeriodo: '',
      errorProveedorTemp: '',
      vendedorSeleccionado: '',
      
    }
  },
  created() {
    console.log(this.vendedoresExistentes)
  },
  computed: {
    listaVendedores() {
      return (this.vendedoresExistentes || []).filter(v => v && v.codigo)
    },

    nombreVendedorSeleccionado() {
      const vendedor = this.listaVendedores.find(
        v => String(v.codigo) === String(this.vendedorSeleccionado)
      )
      return vendedor?.nombre || ''
    },

    periodo() {
      return `${this.anio}-${this.mes.toString().padStart(2, '0')}`
    },

    moneda() {
      return store.state.moneda?.find(
        m => m.codigo === store.state.configuracion?.moneda_defecto
      )?.simbolo || 'S/'
    },

    toolbarColor() {
      if (this.soloLectura) return 'info'
      return this.modo === 'editar' ? 'primary' : 'success'
    },

    tituloDialogo() {
      const nombreVendedor = this.nombreVendedorSeleccionado

      if (this.soloLectura) {
        return `Objetivo: ${this.formatPeriodo(this.periodoEdit)}${nombreVendedor ? ' - ' + nombreVendedor : ''}`
      }

      if (this.modo === 'editar') {
        return `Editando: ${this.formatPeriodo(this.periodoEdit)}${nombreVendedor ? ' - ' + nombreVendedor : ''}`
      }

      return 'Nuevo Objetivo de Comisiones'
    },

    puedeGuardar() {
      if (!this.valido) return false
      if (!this.anio || !this.mes) return false
      if (!this.vendedorSeleccionado) return false
      if (this.errorPeriodo) return false
      if (
        this.n_clientes_compra < 0 ||
        this.n_mix_items_ventas < 0 ||
        this.n_cobertura < 0 ||
        this.n_ventas_contado < 0
      ) return false
      return this.tieneProveedores
    },

    puedeAgregarProveedor() {
      return this.nombreProveedorTemp &&
        this.nombreProveedorTemp.trim() &&
        !this.errorProveedorTemp &&
        !this.proveedorYaAgregado
    },

    proveedorYaAgregado() {
      if (!this.nombreProveedorTemp) return false
      return !!this.proveedores[this.nombreProveedorTemp.trim()]
    },

    proveedorExisteEnBD() {
      if (!this.nombreProveedorTemp) return false
      return this.nombresProveedoresExistentes.includes(this.nombreProveedorTemp.trim())
    },

    mostrarCamposTemp() {
      return this.nombreProveedorTemp &&
        !this.errorProveedorTemp &&
        !this.proveedorYaAgregado
    },

    tieneProveedores() {
      return Object.keys(this.proveedores).length > 0
    },

    proveedoresDisponibles() {
      return this.nombresProveedoresExistentes.filter(
        nombre => !this.proveedores[nombre]
      )
    },

    tieneProveedoresParaAgregar() {
      return this.proveedoresDisponibles.length > 0
    },

    esAdmin() {
      return store.state.permisos?.es_admin === true
    }
  },

  watch: {
    value: {
      handler(nuevo) {
        this.dialog = nuevo
        if (nuevo && this.modo === 'crear') {
          this.resetFormulario()
          this.$nextTick(() => {
            this.validarPeriodo()
          })
        }
      },
      immediate: true
    },

    dialog(nuevo) {
      this.$emit('input', nuevo)
    },
    vendedorSeleccionado(nuevo) {
  if (!nuevo) return

  if (this.modo === 'ver' || this.soloLectura) {
    this.cargarObjetivoDesdeBD(this.periodo)
  } else if (this.modo === 'crear') {
    this.validarPeriodo()
  }
},

   periodoEdit: {
  handler(nuevo) {
    if (!nuevo) return

    if (nuevo && this.datosEdit && this.modo === 'editar') {
      if (this.vendedorEdit) {
        this.vendedorSeleccionado = this.vendedorEdit
      }
      this.cargarDatosEdicion(nuevo, this.datosEdit)
      return
    }

    if (nuevo && (this.modo === 'ver' || this.soloLectura)) {
      if (this.vendedorEdit) {
        this.vendedorSeleccionado = this.vendedorEdit
        this.cargarObjetivoDesdeBD(nuevo)
      } else {
        // No vino vendedor: solo prepara el período y deja elegir
        const [anio, mes] = nuevo.split('-')
        this.anio = parseInt(anio, 10)
        this.mes = parseInt(mes, 10)
        this.sinDatos = false
        this.cargandoObjetivo = false
      }
    }
  },
  immediate: true
},

    vendedorEdit: {
      handler(nuevo) {
        if (nuevo) {
          this.vendedorSeleccionado = nuevo
        }
      },
      immediate: true
    },

    proveedoresExistentes: {
      handler(nuevo) {
        this.nombresProveedoresExistentes = nuevo || []
      },
      immediate: true
    },

    modo: {
      handler(nuevo) {
        if (nuevo === 'crear' && this.dialog) {
          this.$nextTick(() => {
            this.validarPeriodo()
          })
        }
      },
      immediate: true
    }
  },

  methods: {
    // ========== FORMATO ==========
    formatPeriodo(periodo) {
      if (!periodo) return ''
      const [anio, mes] = periodo.split('-')
      return `${this.meses[parseInt(mes) - 1].nombre} ${anio}`
    },

    formatMonto(valor) {
      return Number(valor || 0).toFixed(2)
    },

    calcularObjetivoMinimo(datos) {
      return (datos.monto_plan_soles * datos.porcentaje_minimo) / 100
    },

    // ========== VALIDACIONES ==========
    async validarPeriodo() {
      if (this.modo !== 'crear') {
        this.errorPeriodo = ''
        return
      }

      if (!this.anio || !this.mes || !this.vendedorSeleccionado) {
        this.errorPeriodo = ''
        return
      }

      try {
        store.commit('dialogoprogress', true)

        const snap = await consultaComision(this.periodo, this.vendedorSeleccionado).once('value')

        this.errorPeriodo = snap.exists()
          ? `Ya existe un objetivo para ${this.formatPeriodo(this.periodo)} - ${this.nombreVendedorSeleccionado || this.vendedorSeleccionado}`
          : ''
      } catch (error) {
        console.error('Error validando período:', error)
      } finally {
        store.commit('dialogoprogress', false)
      }
    },

    validarProveedorTemp() {
      if (!this.nombreProveedorTemp || !this.nombreProveedorTemp.trim()) {
        this.errorProveedorTemp = ''
        return
      }

      const nombre = this.nombreProveedorTemp.trim()

      if (nombre.length < 3) {
        this.errorProveedorTemp = 'Mínimo 3 caracteres'
        return
      }

      if (!/^[a-zA-Z0-9\s\.\-&]+$/.test(nombre)) {
        this.errorProveedorTemp = 'Caracteres no válidos'
        return
      }

      if (this.proveedores[nombre]) {
        this.errorProveedorTemp = 'Ya está en la lista'
        return
      }

      this.errorProveedorTemp = ''
    },

    esProveedorExistente(nombre) {
      return this.nombresProveedoresExistentes.includes(nombre)
    },

   async cargarObjetivoDesdeBD(periodo) {
  if (!periodo) return

  if (!this.vendedorSeleccionado) {
    this.sinDatos = false
    this.cargandoObjetivo = false
    return
  }

  this.cargandoObjetivo = true
  this.sinDatos = false

  try {
    const snap = await consultaComision(periodo, this.vendedorSeleccionado).once('value')

    if (snap.exists()) {
      const datos = snap.val()
      this.cargarDatosEdicion(periodo, datos)
      this.sinDatos = false
    } else {
      this.sinDatos = true
    }
  } catch (error) {
    console.error('Error cargando objetivo:', error)
    this.sinDatos = true
    this.$store.commit('dialogosnackbar', {
      mensaje: 'Error al cargar el objetivo',
      color: 'error'
    })
  } finally {
    this.cargandoObjetivo = false
  }
},
    // ========== CARGA DE DATOS ==========
    cargarDatosEdicion(periodo, datos) {
      if (!datos) return

      const [anio, mes] = periodo.split('-')

      this.anio = parseInt(anio, 10)
      this.mes = parseInt(mes, 10)

      this.errorPeriodo = ''

      if (datos.vendedor) {
        this.vendedorSeleccionado = datos.vendedor
      } else if (datos.vendedor_id) {
        this.vendedorSeleccionado = datos.vendedor_id
      }

      this.n_clientes_compra = Number(datos.n_clientes_compra) || 0
      this.n_mix_items_ventas = Number(datos.n_mix_items_ventas) || 0
      this.n_cobertura = Number(datos.n_cobertura) || 0
      this.n_ventas_contado = Number(datos.n_ventas_contado) || 0

      this.proveedores = {}
      Object.keys(datos.proveedores || {}).forEach(key => {
        this.proveedores[key] = {
          monto_comisiones: Number(datos.proveedores[key].monto_comisiones) || 0,
          monto_plan_soles: Number(datos.proveedores[key].monto_plan_soles) || 0,
          porcentaje_minimo: Number(datos.proveedores[key].porcentaje_minimo) || 0
        }
      })
    },

    resetFormulario() {
      this.anio = moment().year()
      this.mes = moment().month() + 1
      this.vendedorSeleccionado = ''
      this.n_clientes_compra = 0
      this.n_mix_items_ventas = 0
      this.n_cobertura = 0
      this.n_ventas_contado = 0
      this.proveedores = {}
      this.nombreProveedorTemp = null
      this.montoComisionesTemp = 0
      this.montoPlanSolesTemp = 0
      this.porcentajeMinimoTemp = 0
      this.errorPeriodo = ''
      this.errorProveedorTemp = ''
      this.sinDatos = false
      this.cargandoObjetivo = false

      if (this.$refs.form) {
        this.$refs.form.resetValidation()
      }
    },
    // ========== GESTIÓN DE PROVEEDORES ==========
    agregarProveedor() {
      if (!this.puedeAgregarProveedor) return

      const nombre = this.nombreProveedorTemp.trim()

      this.$set(this.proveedores, nombre, {
        monto_comisiones: Number(this.montoComisionesTemp),
        monto_plan_soles: Number(this.montoPlanSolesTemp),
        porcentaje_minimo: Number(this.porcentajeMinimoTemp)
      })

      // Limpiar campos temporales
      this.nombreProveedorTemp = null
      this.montoComisionesTemp = 0
      this.montoPlanSolesTemp = 0
      this.porcentajeMinimoTemp = 0

      store.commit('dialogosnackbar', 'Proveedor agregado')
    },

    confirmarAgregarTodos() {
      if (this.proveedoresDisponibles.length === 0) return
      this.dialogConfirmarAgregarTodos = true
    },

    async agregarTodosProveedores() {
      this.agregandoTodos = true
      this.dialogConfirmarAgregarTodos = false

      try {
        const disponibles = this.proveedoresDisponibles

        let agregados = 0
        disponibles.forEach(nombre => {
          this.$set(this.proveedores, nombre, {
            monto_comisiones: 0,
            monto_plan_soles: 0,
            porcentaje_minimo: 0
          })
          agregados++
        })

        store.commit('dialogosnackbar', `Se agregaron ${agregados} proveedores`)
      } finally {
        this.agregandoTodos = false
      }
    },

    actualizarProveedor() {
      this.proveedores = { ...this.proveedores }
    },

    eliminarProveedor(nombre) {
      this.$delete(this.proveedores, nombre)
      store.commit('dialogosnackbar', 'Proveedor eliminado')
    },

    // ========== GUARDADO ==========
    async guardar() {
      if (!this.puedeGuardar) return

      this.guardando = true
      store.commit('dialogoprogress', true)

      try {
        const vendedorObj = this.listaVendedores.find(
          v => String(v.codigo) === String(this.vendedorSeleccionado)
        )

        const data = {
          vendedor: this.vendedorSeleccionado,
          vendedor_nombre: vendedorObj?.nombre || '',
          n_clientes_compra: Number(this.n_clientes_compra),
          n_mix_items_ventas: Number(this.n_mix_items_ventas),
          n_cobertura: Number(this.n_cobertura),
          n_ventas_contado: Number(this.n_ventas_contado),
          proveedores: {}
        }

        Object.keys(this.proveedores).forEach(key => {
          data.proveedores[key] = {
            monto_comisiones: Number(this.proveedores[key].monto_comisiones),
            monto_plan_soles: Number(this.proveedores[key].monto_plan_soles),
            porcentaje_minimo: Number(this.proveedores[key].porcentaje_minimo)
          }
        })

        if (this.modo === 'editar') {
          await actualizaComision(this.periodo, this.vendedorSeleccionado, data)
          store.commit('dialogosnackbar', 'Objetivo actualizado correctamente')
          this.$emit('actualizada', this.periodo, this.vendedorSeleccionado, data)
        } else {
          await nuevaComision(this.periodo, this.vendedorSeleccionado, data)
          store.commit('dialogosnackbar', 'Objetivo creado correctamente')
          this.$emit('creada', this.periodo, this.vendedorSeleccionado, data)
        }

        this.cerrar()
      } catch (error) {
        console.error('Error guardando:', error)
        store.commit('dialogosnackbar', 'Error al guardar')
      } finally {
        this.guardando = false
        store.commit('dialogoprogress', false)
      }
    },
    cerrar() {
      this.dialog = false
      this.sinDatos = false
      this.cargandoObjetivo = false
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.v-edit-dialog {
  cursor: pointer;
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
}

.v-edit-dialog:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.v-alert {
  margin-bottom: 0;
}

.v-data-table ::v-deep td {
  padding: 8px 4px !important;
}

.v-chip {
  cursor: default;
}
</style>