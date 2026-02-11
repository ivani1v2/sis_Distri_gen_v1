<template>
  <v-dialog v-model="show" max-width="450px" persistent>
    <v-card>
      <v-card-title class="amber darken-2 white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-truck-check</v-icon>
        Completar Recojo
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-3 mb-4">
          <div class="font-weight-bold">{{ equipo.codigo }}</div>
          <div class="caption grey--text mb-3">{{ equipo.marca }} {{ equipo.modelo }}</div>
          <div class="text-right mt-n13 mb-4">
           <v-chip x-small :color="getColorCondicion(equipo.condicion)" dark class="mt-2">
            {{ equipo.condicion }}
          </v-chip>
          </div>
          <div class="caption mt-1">
            <v-icon x-small>mdi-account</v-icon>
            Cliente: {{ equipo.cliente_nombre }} ({{ equipo.cliente_id }})
          </div>
          <div class="caption mt-1">
            <v-icon x-small>mdi-map-marker</v-icon>
            {{ equipo.cliente_direccion || 'Sin dirección' }}
          </div>          
        </v-card>

        <v-alert type="info" dense text class="caption mb-3">
          El equipo será trasladado al <span class="font-weight-bold">ALMACÉN</span> y desvinculado del cliente.
        </v-alert>

        <v-textarea v-model="observacion" label="Observación (Obligatorio)" outlined dense rows="3" auto-grow class="caption"
          :rules="[rules.required]"
          placeholder="Indique detalles del recojo: fecha, responsable, estado físico del equipo..."
          :error-messages="errorObservacion"></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="amber darken-2" dark :loading="guardando" :disabled="!esFormularioValido" class="subtitle-2"
          @click="completarRecojo">
          <v-icon left>mdi-check</v-icon>
          Completar Recojo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { completarRecojo } from "@/db_activos";

export default {
  name: "DialogCompletarRecojo",

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
    },

    esFormularioValido() {
      return this.observacion && this.observacion.trim().length > 0;
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
      this.observacion = "";
      this.errorObservacion = "";
    },

    getColorCondicion(condicion) {
      const colores = {
        "OPERATIVO": "green",
        "AVERIADO": "red",
        "EN MANTENIMIENTO": "purple",
        "DADO DE BAJA": "grey darken-1"
      };
      return colores[condicion] || "grey";
    },

    async completarRecojo() {
      if (!this.observacion || this.observacion.trim().length === 0) {
        this.errorObservacion = "La observación es obligatoria";
        return;
      }

      this.guardando = true;

      try {
        await completarRecojo(this.equipo.codigo, this.observacion);
        this.$store.commit("dialogosnackbar", "Recojo completado exitosamente");
        this.$emit("recojo-completado");
        this.cerrar();
      } catch (error) {
        console.error("Error al completar recojo:", error);
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
