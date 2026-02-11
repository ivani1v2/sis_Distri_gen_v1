<template>
  <v-dialog v-model="show" max-width="550px" persistent>
    <v-card>
      <v-card-title class="green white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-check-circle</v-icon>
        Completar Reparación
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-3 mb-4 purple lighten-5">
          <div class="font-weight-bold mt-2">{{ equipo.codigo }}</div>
          <div class="caption grey--text">{{ equipo.marca }} {{ equipo.modelo }}</div>
          <div class="text-right mt-n9">
            <v-chip color="purple" small dark label>EN MANTENIMIENTO</v-chip>
            <div v-if="equipo.fecha_mantenimiento_inicio" class="caption mt-2">
              <v-icon x-small>mdi-calendar</v-icon>
              Inicio: {{ formatFecha(equipo.fecha_mantenimiento_inicio) }}
            </div>
          </div>
        </v-card>

        <div class="subtitle-2 mb-2">Resultado de la Reparación (Obligatorio)</div>
        <v-radio-group v-model="condicionResultante" class="mt-0">
          <v-card outlined class="pa-3 mb-2" :class="{ 'success lighten-5': condicionResultante === 'OPERATIVO' }"
            @click="condicionResultante = 'OPERATIVO'" style="cursor: pointer;">
            <v-radio value="OPERATIVO" color="success">
              <template v-slot:label>
                <div>
                  <span class="font-weight-bold green--text">OPERATIVO</span>
                  <div class="caption grey--text">La reparación fue exitosa. El equipo está listo para usar.</div>
                </div>
              </template>
            </v-radio>
          </v-card>

          <v-card outlined class="pa-3" :class="{ 'grey lighten-3': condicionResultante === 'DADO DE BAJA' }"
            @click="condicionResultante = 'DADO DE BAJA'" style="cursor: pointer;">
            <v-radio value="DADO DE BAJA" color="grey darken-1">
              <template v-slot:label>
                <div>
                  <span class="font-weight-bold grey--text text--darken-2">DADO DE BAJA</span>
                  <div class="caption grey--text">No se puede reparar. El equipo será dado de baja.</div>
                </div>
              </template>
            </v-radio>
          </v-card>
        </v-radio-group>

        <v-textarea v-model="observacion" label="Descripción de la reparación (Obligatorio)" outlined dense rows="3" auto-grow class="caption"
          :rules="[rules.required]"
          placeholder="Describa el trabajo realizado, piezas cambiadas, o motivo de la baja..."
          :error-messages="errorObservacion"></v-textarea>

        <v-alert v-if="condicionResultante === 'DADO DE BAJA'" type="warning" dense text class="mt-2 caption">
          <strong>Atención:</strong> Esta acción deshabilitará el equipo. Podrá ser asignado cambiando a <strong>OPERATIVO</strong> nuevamente.
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn :color="condicionResultante === 'OPERATIVO' ? 'green' : 'grey darken-1'" dark :loading="guardando"
          :disabled="!esFormularioValido" @click="completarReparacion">
          <v-icon left>mdi-check</v-icon>
          {{ condicionResultante === 'OPERATIVO' ? 'Completar Reparación' : 'Dar de Baja' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { completarReparacion } from "@/db_activos";
import moment from "moment";

export default {
  name: "DialogCompletarReparacion",

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
    formatFecha(timestamp) {
      return moment(timestamp).format("DD/MM/YYYY HH:mm");
    },

    limpiar() {
      this.condicionResultante = null;
      this.observacion = "";
      this.errorObservacion = "";
    },

    async completarReparacion() {
      if (!this.condicionResultante) {
        this.$store.commit("dialogosnackbar", "Seleccione el resultado de la reparación");
        return;
      }

      if (!this.observacion || this.observacion.trim().length === 0) {
        this.errorObservacion = "La descripción es obligatoria";
        return;
      }

      this.guardando = true;

      try {
        await completarReparacion(this.equipo.codigo, this.condicionResultante, this.observacion);
        this.$emit("completado");
        this.cerrar();
      } catch (error) {
        console.error("Error al completar reparación:", error);
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
