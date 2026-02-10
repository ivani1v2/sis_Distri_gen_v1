<template>
  <v-dialog v-model="show" max-width="450px" persistent>
    <v-card>
      <v-card-title class="orange lighten-1 white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-keyboard-return</v-icon>
        Registrar Devolución
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-3 mb-4">
          <div class="font-weight-bold">{{ equipo.codigo }}</div>
          <div class="caption grey--text">{{ equipo.marca }} {{ equipo.modelo }}</div>
          <div class="caption mt-1">
            <v-icon x-small>mdi-account</v-icon>
            Cliente: {{ equipo.cliente_nombre }} ({{ equipo.cliente_id }})
          </div>
        </v-card>

        <div class="subtitle-2 mb-2">Evaluación del Equipo *</div>
        <v-radio-group v-model="condicionResultante" class="mt-0" :rules="[v => !!v || 'Seleccione la condición']">
          <v-card outlined class="pa-3 mb-2" :class="{ 'success lighten-5': condicionResultante === 'OPERATIVO' }"
            @click="condicionResultante = 'OPERATIVO'" style="cursor: pointer;">
            <v-radio value="OPERATIVO" color="success">
              <template v-slot:label>
                <div>
                  <span class="font-weight-bold green--text">OPERATIVO</span>
                  <div class="caption grey--text">El equipo funciona correctamente y puede ser reasignado</div>
                </div>
              </template>
            </v-radio>
          </v-card>

          <v-card outlined class="pa-3" :class="{ 'error lighten-5': condicionResultante === 'AVERIADO' }"
            @click="condicionResultante = 'AVERIADO'" style="cursor: pointer;">
            <v-radio value="AVERIADO" color="error">
              <template v-slot:label>
                <div>
                  <span class="font-weight-bold red--text">AVERIADO</span>
                  <div class="caption grey--text">El equipo presenta fallas y requiere reparación</div>
                </div>
              </template>
            </v-radio>
          </v-card>
        </v-radio-group>
        <v-textarea v-model="observacion" label="Observación *" outlined dense rows="3" auto-grow class="caption"
          :rules="[rules.required]"
          placeholder="Describa el estado del equipo, motivo de devolución, daños observados, etc."
          :error-messages="errorObservacion"></v-textarea>

        <v-alert v-if="condicionResultante === 'AVERIADO'" type="warning" dense text class="caption mt-n2 mb-n2">
          El equipo quedará en ALMACÉN con condición AVERIADO. Deberá enviarse a <span class="font-weight-bold">MANTENIMIENTO</span> para su reparación.
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="orange darken-1" dark :loading="guardando" :disabled="!esFormularioValido" class="subtitle-2"
          @click="registrarDevolucion">
          <v-icon left>mdi-check</v-icon>
          Registrar Devolución
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { devolverEquipo } from "@/db_activos";

export default {
  name: "DialogDevolucion",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  data() {
    return {
      condicionResultante: null,
      observacion: "",
      guardando: false,
      errorObservacion: "",

      rules: {
        required: v => !!v || "Este campo es obligatorio"
      }
    };
  },

  computed: {
    show: {
      get() { return this.visible; },
      set(val) { this.$emit("update:visible", val); }
    },

    esFormularioValido() {
      return this.condicionResultante && this.observacion && this.observacion.trim().length > 0;
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.limpiar();
      }
    },

    observacion(val) {
      if (val && val.trim().length > 0) {
        this.errorObservacion = "";
      }
    }
  },

  methods: {
    limpiar() {
      this.condicionResultante = null;
      this.observacion = "";
      this.errorObservacion = "";
    },

    async registrarDevolucion() {
      if (!this.condicionResultante) {
        this.$store.commit("dialogosnackbar", "Seleccione la condición del equipo");
        return;
      }

      if (!this.observacion || this.observacion.trim().length === 0) {
        this.errorObservacion = "La observación es obligatoria";
        return;
      }

      this.guardando = true;

      try {
        await devolverEquipo(this.equipo.codigo, this.condicionResultante, this.observacion);
        this.$emit("devuelto");
        this.cerrar();
      } catch (error) {
        console.error("Error al registrar devolución:", error);
        this.$store.commit("dialogosnackbar", "Error: " + error.message);
      } finally {
        this.guardando = false;
      }
    },

    cerrar() {
      this.show = false;
      this.limpiar();
    }
  }
};
</script>
