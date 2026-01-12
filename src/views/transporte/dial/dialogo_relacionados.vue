<template>
  <v-dialog v-model="dial" max-width="760" persistent>
    <v-card>
      <v-card-title class="text-h6">
        Documentos relacionados
        <v-spacer />
        <v-btn icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="formValido">
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                outlined dense
                v-model="form.ruc"
                label="RUC relacionado"
                maxlength="11"
                :rules="[
                  v => !!v || 'Requerido',
                  v => /^\d{11}$/.test(v) || '11 dígitos'
                ]"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-select
                outlined dense
                v-model="form.tipo"
                :items="tipos"
                item-text="text"
                item-value="value"
                label="Tipo documento"
                :rules="[v => !!v || 'Requerido']"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                outlined dense
                v-model="form.id"
                label="Documento (Serie-Número)"
                placeholder="F001-00012345"
                :rules="[v => !!v || 'Requerido']"
              />
            </v-col>

            <v-col cols="12">
              <v-btn color="primary" small :disabled="!formValido" @click="agregar">
                Agregar
              </v-btn>
            
              <v-btn color="red" text small class="ml-2" @click="limpiar">Limpiar</v-btn>
            </v-col>
          </v-row>
        </v-form>

        <!-- Lista (se muestra la prop `docs`) -->
        <v-simple-table class="mt-4" v-if="docs && docs.length">
          <thead>
            <tr>
              <th>RUC</th>
              <th>Tipo</th>
              <th>Documento</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d, i) in docs" :key="i">
              <td>{{ d.ruc }}</td>
              <td>{{ textoTipo(d.tipo) }}</td>
              <td>{{ d.id }}</td>
              <td class="text-right">
                <v-btn icon small @click="$emit('eliminar', i)">
                  <v-icon small color="red">mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <div v-else class="grey--text text--darken-1">
          No hay documentos agregados.
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="cerrar">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const DEFAULT_TIPOS = [
  { value: '01', text: '01 - Factura' },
  { value: '03', text: '03 - Boleta' },
  { value: '09', text: '09 - GRE Remitente' },
  { value: '31', text: '31 - GRE Transportista' }
];

export default {
  name: 'DocRelacionadosDialog',
  props: {
    /* visibilidad: puedes usar v-model en el padre */
    value: { type: Boolean, default: false },
    /* array externo (padre) */
    docs: { type: Array, default: () => [] },
    /* opcional: catálogo 61 propio */
    tiposDocRelacion: { type: Array, default: () => DEFAULT_TIPOS }
  },
  data() {
    return {
      dial: this.value,                 // estado interno del diálogo
      formValido: false,
      form: { ruc: '', tipo: null, id: '' }
    };
  },
  created(){
    this.dial= true
  },
  watch: {
    value(val) { this.dial = val; },
    dial(val) { this.$emit('input', val); } // soporte v-model opcional
  },
  computed: {
    tipos() {
      return this.tiposDocRelacion && this.tiposDocRelacion.length
        ? this.tiposDocRelacion
        : DEFAULT_TIPOS;
    }
  },
  methods: {
    agregar() {
      if (!this.$refs.form.validate()) return;

      // Emite el objeto para que el padre lo agregue a su array
      this.$emit('agregar', { ...this.form });
    this.form = { ruc: '', tipo: null, id: '' };
      this.$refs.form && this.$refs.form.resetValidation();
    },

    limpiar() {
      this.form = { ruc: '', tipo: null, id: '' };
      this.$refs.form && this.$refs.form.resetValidation();
      this.$emit('limpiar',true); 
    },
    cerrar() {
        // cierra internamente
        console.log('as')
      this.$emit('cierre',true);         // notifica al padre
    },
    textoTipo(code) {
      const t = this.tipos.find(x => x.value === code);
      return t ? t.text : code;
    }
  }
};
</script>
