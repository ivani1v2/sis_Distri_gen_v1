<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <v-card>
      <v-card-title class="teal white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-truck-delivery</v-icon>
        Confirmar Entrega
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-3 mb-4">
          <div class="font-weight-bold">{{ equipo.codigo }}</div>
          <div class="caption grey--text">{{ equipo.marca }} {{ equipo.modelo }}</div>
        </v-card>

        <v-card outlined class="pa-3 mb-4 orange lighten-5">
          <div class="caption grey--text">Cliente asignado:</div>
          <div class="font-weight-medium">{{ equipo.cliente_nombre }} ({{ equipo.cliente_id }})</div>
          <div class="caption grey--text">{{ equipo.cliente_direccion || 'Dirección no especificada' }}</div>
        </v-card>

        <v-alert type="info" dense text class="mb-4 caption">
          Al confirmar la entrega, el equipo pasará de estado <strong>RESERVADO</strong> a <strong>EN USO</strong>.
        </v-alert>

        <v-textarea v-model="observacion" label="Observación de entrega" outlined dense rows="3" auto-grow
          placeholder="Detalles de la entrega, quien recibió, etc."></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-btn color="teal" dark :loading="guardando" @click="confirmar">
          <v-icon left>mdi-check</v-icon>
          Confirmar Entrega
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { confirmarEntrega } from "@/db_activos";

export default {
  name: "DialogConfirmarEntrega",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  data() {
    return {
      observacion: "",
      guardando: false
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
      }
    }
  },

  methods: {
    async confirmar() {
      this.guardando = true;

      try {
        await confirmarEntrega(this.equipo.codigo, this.observacion);
        this.$emit("confirmado");
        this.cerrar();
      } catch (error) {
        console.error("Error al confirmar entrega:", error);
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
