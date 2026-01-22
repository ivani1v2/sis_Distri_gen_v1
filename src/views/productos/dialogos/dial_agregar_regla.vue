<template>
  <v-dialog v-model="dialog" max-width="460px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="cerrar">mdi-close</v-icon>
        <span class="ml-2">Agregar Regla de Bonificación</span>
      </v-system-bar>
    </div>
    <v-card class="pa-3">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            outlined
            type="number"
            dense
            v-model="apartir_de"
            label="Bono a partir de (und) *"
            prepend-inner-icon="mdi-numeric"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            outlined
            type="number"
            dense
            v-model="cantidad_bono"
            label="Cantidad bonificación *"
            prepend-inner-icon="mdi-gift"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            outlined
            type="number"
            dense
            v-model="cantidad_max"
            label="Cantidad máxima"
            hint="Opcional"
            persistent-hint
            prepend-inner-icon="mdi-infinity"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-autocomplete
        v-model="producto_sele"
        :items="productos"
        item-text="nombre"
        item-value="id"
        label="Producto a bonificar *"
        clearable
        menu-props="auto"
        outlined
        dense
        prepend-inner-icon="mdi-magnify"
      >
        <template v-slot:item="{ item }">
          <v-list-item-content>
            <v-list-item-title>
              <strong>{{ item.categoria }}</strong> - {{ item.nombre }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Stock: {{ item.stock }} | Precio: S/{{ item.precio }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </v-autocomplete>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="success" @click="guardar" :disabled="!esValido">
          <v-icon left>mdi-plus</v-icon>Agregar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DialAgregarRegla',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    productos: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      producto_sele: null,
      apartir_de: null,
      cantidad_bono: null,
      cantidad_max: null
    }
  },
  computed: {
    dialog: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    esValido() {
      return this.producto_sele && this.apartir_de && this.cantidad_bono
    }
  },
  watch: {
    value(val) {
      if (!val) {
        this.reset()
      }
    }
  },
  methods: {
    reset() {
      this.producto_sele = null
      this.apartir_de = null
      this.cantidad_bono = null
      this.cantidad_max = null
    },
    cerrar() {
      this.$emit('input', false)
      this.$emit('cerrar')
    },
    guardar() {
      if (!this.esValido) return

      const regla = {
        apartir_de: Number(this.apartir_de),
        codigo: this.producto_sele,
        cantidad_max: this.cantidad_max ? Number(this.cantidad_max) : null,
        cantidad_bono: Number(this.cantidad_bono)
      }

      this.$emit('guardar', regla)
      this.$emit('input', false)
    }
  }
}
</script>