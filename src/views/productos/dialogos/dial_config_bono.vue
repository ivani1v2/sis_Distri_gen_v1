<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    max-width="700px"
    persistent
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar flat color="grey darken-4" dark dense max-height="64">
        <v-icon @click="cerrar" class="mr-2">mdi-close</v-icon>
        <v-toolbar-title class="text-body-1 font-weight-bold">
          {{ titulo }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip :color="activo ? 'success' : 'grey'" small class="font-weight-black">
          {{ activo ? 'ACTIVO' : 'INACTIVO' }}
        </v-chip>
      </v-toolbar>

      <v-card-text class="pa-4 pa-sm-6 grey lighten-5">
        <v-row dense align="center" class="mb-4">
          <v-col cols="12" sm="4" class="d-flex align-center">
            <v-switch
              v-model="activo"
              inset
              color="success"
              label="Estado Activo"
              class="mt-0 pt-0"
              hide-details
            ></v-switch>
          </v-col>
          <v-col cols="12" sm="8">
            <v-btn-toggle
              v-model="modo_bono"
              mandatory
              borderless
              class="w-full d-flex"
              color="primary"
            >
              <v-btn value="precio" class="flex-grow-1 text-none" small>
                <v-icon left>mdi-tag-multiple</v-icon> Escala de Precios
              </v-btn>
              <v-btn value="bono" class="flex-grow-1 text-none" small>
                <v-icon left>mdi-gift</v-icon> Bonificación
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>

        <v-card flat class="rounded-lg pa-4 mb-4 white border-subtle">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="nombre"
                label="Nombre de la promoción *"
                prepend-inner-icon="mdi-format-title"
                dense
                outlined
                hide-details
                class="mb-3"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="proveedor"
                :items="proveedoresItems"
                label="Proveedor"
                prepend-inner-icon="mdi-truck-outline"
                dense
                outlined
                hide-details
                class="mb-3"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="menuFechaVencimiento"
                :close-on-content-click="false"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="fecha_vencimiento"
                    label="Fecha de Vencimiento"
                    prepend-inner-icon="mdi-calendar-clock"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    dense
                    outlined
                    clearable
                    hide-details
                    class="mb-1"
                  ></v-text-field>
                  <span class="text-caption grey--text pl-1">Dejar vacío para "Sin vencimiento"</span>
                </template>
                <v-date-picker
                  v-model="fecha_vencimiento"
                  @input="menuFechaVencimiento = false"
                  :min="hoy"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6" v-if="fecha_vencimiento">
              <v-alert
                dense
                outlined
                :type="esFechaProxima ? 'warning' : 'info'"
                class="mb-0 text-caption rounded-lg py-1"
              >
                <strong>{{ diasRestantes }} días</strong> para que caduque.
              </v-alert>
            </v-col>
            <v-col cols="12" class="mt-2">
              <v-textarea
                v-model="observacion"
                label="Notas u observaciones"
                prepend-inner-icon="mdi-comment-text-outline"
                dense
                outlined
                auto-grow
                rows="1"
                hide-details
                filled
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card>

        <div class="mt-2">
          <v-row v-if="modo_bono == 'precio'" dense>
            <v-col
              cols="12"
              class="mb-2 d-flex align-center font-weight-bold grey--text text--darken-2 text-subtitle-2 font-weight-black"
            >
              <v-icon color="blue" class="mr-2">mdi-numeric-1-box</v-icon> ESCALAS MAYORISTAS
            </v-col>
            <v-col cols="12" sm="6">
              <v-card outlined class="pa-3 rounded-lg border-blue">
                <div class="caption blue--text font-weight-bold mb-2">ESCALA 1</div>
                <v-text-field
                  label="Desde (und)"
                  v-model="escala_may1"
                  type="number"
                  dense
                  outlined
                  hide-details
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  label="Precio S/"
                  v-model="precio_may1"
                  type="number"
                  dense
                  outlined
                  hide-details
                  prefix="S/"
                ></v-text-field>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card outlined class="pa-3 rounded-lg border-blue">
                <div class="caption blue--text font-weight-bold mb-2">ESCALA 2</div>
                <v-text-field
                  label="Desde (und)"
                  v-model="escala_may2"
                  type="number"
                  dense
                  outlined
                  hide-details
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  label="Precio S/"
                  v-model="precio_may2"
                  type="number"
                  dense
                  outlined
                  hide-details
                  prefix="S/"
                ></v-text-field>
              </v-card>
            </v-col>
          </v-row>

          <div v-else>
            <div
              class="mb-3 d-flex align-center justify-space-between font-weight-black text-subtitle-2 grey--text text--darken-2"
            >
              <span><v-icon color="orange" class="mr-2">mdi-gift-outline</v-icon> REGLAS DE BONO</span>
              <v-btn
                small
                depressed
                color="success"
                class="rounded-lg text-none"
                @click="abrirDialogoAgregarRegla"
              >
                <v-icon left small>mdi-plus</v-icon> Agregar Regla
              </v-btn>
            </div>

            <v-card outlined class="rounded-lg overflow-hidden border-subtle">
              <v-simple-table dense fixed-header height="200px" v-if="array_bono2.length">
                <template v-slot:default>
                  <thead>
                    <tr class="grey lighten-4 text-uppercase">
                      <th class="caption font-weight-bold">A partir de</th>
                      <th class="caption font-weight-bold">Regalo</th>
                      <th class="caption font-weight-bold text-center">Máx</th>
                      <th class="caption font-weight-bold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in array_bono2" :key="idx">
                      <td class="text-body-2">{{ item.apartir_de }} und</td>
                      <td class="py-1">
                        <div class="success--text font-weight-bold lh-1">
                          {{ item.cantidad_bono }} Unidades
                        </div>
                        <div
                          class="caption grey--text text-truncate"
                          style="max-width: 150px;"
                        >
                          {{ vernombre(item.codigo) }}
                        </div>
                      </td>
                      <td class="text-center font-weight-bold">{{ item.cantidad_max || '∞' }}</td>
                      <td class="text-center">
                        <v-btn
                          icon
                          x-small
                          color="red lighten-4"
                          @click="eliminarReglaBono(item)"
                        >
                          <v-icon small color="red">mdi-trash-can-outline</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-card-text v-else class="text-center py-6 grey lighten-4">
                <v-icon x-large color="grey lighten-2">mdi-gift-off</v-icon>
                <div class="grey--text mt-2 font-italic text-caption">
                  No hay reglas registradas aún.
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 bg-white">
        <v-btn text color="grey darken-1" class="text-none px-6" @click="cerrar">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          depressed
          class="text-none px-8 rounded-lg font-weight-bold"
          @click="guardar"
          :loading="guardando"
        >
          <v-icon left>mdi-content-save-check</v-icon> Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>

    <dial_agregar_regla
      v-model="dial_agrega"
      :productos="productos"
      @guardar="agregarRegla"
      @cerrar="cerrarDialogoAgregarRegla"
    />
  </v-dialog>
</template>

<script>  
import dial_agregar_regla from "./dial_agregar_regla.vue";

export default {
  name: 'DialConfigBono',
  components: {
    dial_agregar_regla
  },
  props: {
    value: {
      type: Boolean,
      default: false
    },
    bono: {
      type: Object,
      default: () => ({})
    },
    proveedoresItems: {
      type: Array,
      default: () => []
    },
    productos: {
      type: Array,
      default: () => []
    },
    editando: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      menuFechaVencimiento: false,
      modo_bono: 'precio',
      activo: true,
      nombre: '',
      observacion: '',
      proveedor: null,
      fecha_vencimiento: null,
      escala_may1: null,
      precio_may1: null,
      escala_may2: null,
      precio_may2: null,
      array_bono2: [],
      guardando: false,
      dial_agrega: false
    }
  },
  computed: {
    hoy() {
      return new Date().toISOString().substr(0, 10)
    },
    diasRestantes() {
      if (!this.fecha_vencimiento) return 0
      const hoy = new Date()
      const venc = new Date(this.fecha_vencimiento)
      const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
      return diff
    },
    esFechaProxima() {
      return this.diasRestantes <= 7 && this.diasRestantes > 0
    },
    titulo() {
      return this.editando ? 'Editar Promoción' : 'Nueva Promoción'
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.cargarDatos()
      } else {
        this.resetFormulario()
      }
    },
    bono: {
      deep: true,
      handler() {
        if (this.value) {
          this.cargarDatos()
        }
      }
    }
  },
  methods: {
    cargarDatos() {
      if (this.bono && Object.keys(this.bono).length > 0) {
        this.modo_bono = this.bono.tipo || 'precio'
        this.activo = !!this.bono.activo
        this.nombre = this.bono.nombre || ''
        this.observacion = this.bono.observacion || ''
        this.proveedor = this.bono.proveedor || null
        this.fecha_vencimiento = this.bono.fecha_vencimiento || null

        if (this.bono.tipo === 'precio') {
          this.escala_may1 = this.bono.escala_may1 ?? null
          this.precio_may1 = this.bono.precio_may1 ?? null
          this.escala_may2 = this.bono.escala_may2 ?? null
          this.precio_may2 = this.bono.precio_may2 ?? null
          this.array_bono2 = []
        } else {
          const bonos = Array.isArray(this.bono.data) ? this.bono.data : []
          this.array_bono2 = bonos.map((b) => ({
            apartir_de: b.apartir_de,
            cantidad_bono: b.cantidad_bono,
            cantidad_max: b.cantidad_max,
            codigo: b.codigo
          }))
          this.escala_may1 = null
          this.precio_may1 = null
          this.escala_may2 = null
          this.precio_may2 = null
        }
      } else {
        this.resetFormulario()
      }
    },
    resetFormulario() {
      this.modo_bono = 'precio'
      this.activo = true
      this.nombre = ''
      this.observacion = ''
      this.proveedor = null
      this.fecha_vencimiento = null
      this.escala_may1 = null
      this.precio_may1 = null
      this.escala_may2 = null
      this.precio_may2 = null
      this.array_bono2 = []
    },
    cerrar() {
      this.$emit('input', false)
    },
    guardar() {
      if (!this.nombre.trim()) {
        this.$toast('Escribe un nombre.')
        return
      }

      this.guardando = true
      
      const bonoData = {
        tipo: this.modo_bono,
        activo: this.activo,
        nombre: this.nombre.trim(),
        observacion: this.observacion.trim(),
        proveedor: this.proveedor,
        fecha_vencimiento: this.fecha_vencimiento,
        ...(this.modo_bono === 'precio'
          ? {
              escala_may1: this.escala_may1 != null ? Number(this.escala_may1) : null,
              precio_may1: this.precio_may1 != null ? Number(this.precio_may1) : null,
              escala_may2: this.escala_may2 != null ? Number(this.escala_may2) : null,
              precio_may2: this.precio_may2 != null ? Number(this.precio_may2) : null
            }
          : {
              data: this.array_bono2.map((b, i) => ({
                id: i + 1,
                apartir_de: Number(b.apartir_de),
                cantidad_bono: Number(b.cantidad_bono),
                cantidad_max: b.cantidad_max != null ? Number(b.cantidad_max) : null,
                codigo: b.codigo
              }))
            })
      }

      this.$emit('guardar', bonoData)
      this.guardando = false
    },
    vernombre(idProd) {
      return this.productos.find((x) => x.id === idProd)?.nombre || 'Sin Nombre'
    },
    abrirDialogoAgregarRegla() {
      this.dial_agrega = true
    },
    cerrarDialogoAgregarRegla() {
      this.dial_agrega = false
    },
    agregarRegla(regla) {
      this.array_bono2.push(regla)
    },
    eliminarReglaBono(regla) {
      this.array_bono2 = this.array_bono2.filter((x) => x !== regla)
    }
  }
}
</script>

<style scoped>
.w-full {
  width: 100%;
}
.lh-1 {
  line-height: 1.1;
}
.border-subtle {
  border: 1px solid #e0e0e0 !important;
}
.border-blue {
  border: 1px solid #90caf9 !important;
  border-top: 4px solid #1976d2 !important;
}
.v-btn-toggle .v-btn {
  height: 36px !important;
}
</style>