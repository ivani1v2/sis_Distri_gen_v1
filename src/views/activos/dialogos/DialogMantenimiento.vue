<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <v-card>
      <v-card-title class="purple white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-wrench</v-icon>
        Enviar a Mantenimiento
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-3 mb-4">
          <div class="font-weight-bold">{{ equipo.codigo }}</div>
          <div class="caption grey--text">{{ equipo.marca }} {{ equipo.modelo }}</div>
          <div class="text-right mt-n8 mb-2">
            <v-chip :color="getColorCondicion(equipo.condicion)" small dark label>
              {{ equipo.condicion }}
            </v-chip>
          </div>
        </v-card>

        <v-alert type="info" dense text class="mb-4 caption">
          El equipo pasará a condición <strong>EN MANTENIMIENTO</strong>.
          Permanecerá en almacén hasta que se complete la reparación.
        </v-alert>

        <v-textarea v-model="observacion" label="Motivo / Descripción del problema *" outlined dense rows="3" auto-grow
          :rules="[rules.required]" placeholder="Describa la falla o problema que presenta el equipo..." class="caption"
          :error-messages="errorObservacion"></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="purple" dark :loading="guardando" :disabled="!observacion || !observacion.trim()"
          class="subtitle-2" @click="enviarMantenimiento">
          <v-icon left>mdi-check</v-icon>
          Enviar a Mantenimiento
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
import { enviarAMantenimiento } from "@/db_activos";

export default {
  name: "DialogMantenimiento",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  data() {
    return {
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
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.observacion = "";
        this.errorObservacion = "";
      }
    },

    observacion(val) {
      if (val && val.trim().length > 0) {
        this.errorObservacion = "";
      }
    }
  },

  methods: {
    getColorCondicion(condicion) {
      const colores = {
        "OPERATIVO": "green",
        "EN MANTENIMIENTO": "purple",
        "AVERIADO": "red",
        "DADO DE BAJA": "grey"
      };
      return colores[condicion] || "grey";
    },

    async enviarMantenimiento() {
      if (!this.observacion || !this.observacion.trim()) {
        this.errorObservacion = "La descripción del problema es obligatoria";
        return;
      }

      this.guardando = true;

      try {
        await enviarAMantenimiento(this.equipo.codigo, this.observacion);
        this.$emit("enviado");
        this.cerrar();
      } catch (error) {
        console.error("Error al enviar a mantenimiento:", error);
        this.$store.commit("dialogosnackbar", "Error: " + error.message);
      } finally {
        this.guardando = false;
      }
    },

    cerrar() {
      this.show = false;
      this.observacion = "";
    }
  }
};
</script>
