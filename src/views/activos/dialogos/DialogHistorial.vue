<template>
  <v-dialog v-model="show" max-width="700px" scrollable>
    <v-card>
      <v-card-title class="grey darken-1 white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-history</v-icon>
        Historial del Equipo
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle class="grey darken-1 white--text pb-2">
        {{ equipo.codigo }} - {{ equipo.marca }} {{ equipo.modelo }}
      </v-card-subtitle>

      <v-card-text class="pt-4" style="max-height: 60vh; overflow-y: auto;">
        <v-select v-model="filtroTipo" :items="tiposCambioOptions" label="Filtrar por tipo" outlined dense hide-details
          clearable class="mb-4"></v-select>

        <div v-if="cargando" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="historialFiltrado.length === 0" class="text-center pa-4 grey--text">
          <v-icon size="48" color="grey lighten-1">mdi-history</v-icon>
          <div class="mt-2">No hay registros en el historial</div>
        </div>

        <v-timeline v-else dense align-top>
          <v-timeline-item v-for="item in historialFiltrado" :key="item.id" :color="getColorTipo(item.tipo_cambio)"
            small>
            <template v-slot:icon>
              <v-icon color="white" x-small>{{ getIconoTipo(item.tipo_cambio) }}</v-icon>
            </template>

            <v-card outlined class="pa-3">
              <div class="d-flex justify-space-between align-start mb-2">
                <v-chip :color="getColorTipo(item.tipo_cambio)" x-small dark label>
                  {{ item.tipo_cambio }}
                </v-chip>
                <span class="caption grey--text">{{ formatFecha(item.fecha) }}</span>
              </div>

              <div v-if="item.estado_anterior !== item.estado_nuevo" class="mb-1">
                <span class="caption">Estado: </span>
                <v-chip x-small outlined>{{ item.estado_anterior || 'N/A' }}</v-chip>
                <v-icon x-small class="mx-1">mdi-arrow-right</v-icon>
                <v-chip x-small outlined color="primary">{{ item.estado_nuevo }}</v-chip>
              </div>

              <div v-if="item.condicion_anterior !== item.condicion_nueva" class="mb-1">
                <span class="caption">Condición: </span>
                <v-chip x-small outlined>{{ item.condicion_anterior || 'N/A' }}</v-chip>
                <v-icon x-small class="mx-1">mdi-arrow-right</v-icon>
                <v-chip x-small outlined :color="getColorCondicion(item.condicion_nueva)">{{ item.condicion_nueva
                  }}</v-chip>
              </div>

              <div v-if="item.cliente_nuevo_nombre || item.cliente_anterior_nombre" class="mb-1">
                <span class="caption">Cliente: </span>
                <span v-if="item.cliente_anterior_nombre" class="text-decoration-line-through grey--text">
                  {{ item.cliente_anterior_nombre }}
                </span>
                <v-icon v-if="item.cliente_anterior_nombre && item.cliente_nuevo_nombre" x-small
                  class="mx-1">mdi-arrow-right</v-icon>
                <span v-if="item.cliente_nuevo_nombre" class="font-weight-medium">
                  {{ item.cliente_nuevo_nombre }}
                </span>
                <span v-if="!item.cliente_nuevo_nombre && item.cliente_anterior_nombre" class="grey--text">
                  (Sin cliente)
                </span>
              </div>

              <div v-if="item.observacion" class="mt-2 caption grey--text text--darken-1">
                <v-icon x-small class="mr-1">mdi-message-text</v-icon>
                {{ item.observacion }}
              </div>

              <div class="mt-2 caption grey--text">
                <v-icon x-small class="mr-1">mdi-account</v-icon>
                {{ item.usuario_nombre || item.usuario || 'Sistema' }}
              </div>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <span class="caption grey--text">{{ historialFiltrado.length }} registro(s)</span>
        <v-spacer></v-spacer>
        <v-btn text @click="cerrar">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { getHistorialEquipo } from "@/db_activos";
import moment from "moment";

export default {
  name: "DialogHistorial",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  data() {
    return {
      cargando: false,
      historial: [],
      filtroTipo: null,

      tiposCambioOptions: [
        { text: "Ingreso", value: "INGRESO" },
        { text: "Asignación", value: "ASIGNACION" },
        { text: "Devolución", value: "DEVOLUCION" },
        { text: "Mantenimiento", value: "MANTENIMIENTO" },
        { text: "Reparación", value: "REPARACION" }
      ]
    };
  },

  computed: {
    show: {
      get() { return this.visible; },
      set(val) { this.$emit("update:visible", val); }
    },

    historialFiltrado() {
      if (!this.filtroTipo) return this.historial;
      return this.historial.filter(h => h.tipo_cambio === this.filtroTipo);
    }
  },

  watch: {
    visible: {
      handler(val) {
        if (val && this.equipo && this.equipo.codigo) {
          this.cargarHistorial();
        }
      },
      immediate: true
    },
    equipo: {
      handler(val) {
        if (val && val.codigo && this.visible) {
          this.cargarHistorial();
        }
      },
      immediate: true
    }
  },

  methods: {
    async cargarHistorial() {
      this.cargando = true;
      this.historial = [];

      try {
        this.historial = await getHistorialEquipo(this.equipo.codigo);
      } catch (error) {
        console.error("Error al cargar historial:", error);
        this.$store.commit("dialogosnackbar", "Error al cargar historial");
      } finally {
        this.cargando = false;
      }
    },

    formatFecha(timestamp) {
      return moment(timestamp).format("DD/MM/YYYY HH:mm");
    },

    getColorTipo(tipo) {
      const colores = {
        "INGRESO": "blue",
        "ASIGNACION": "success",
        "DEVOLUCION": "orange",
        "MANTENIMIENTO": "purple",
        "REPARACION": "teal",
        "CAMBIO_ESTADO": "grey"
      };
      return colores[tipo] || "grey";
    },

    getIconoTipo(tipo) {
      const iconos = {
        "INGRESO": "mdi-plus",
        "ASIGNACION": "mdi-account-plus",
        "DEVOLUCION": "mdi-keyboard-return",
        "MANTENIMIENTO": "mdi-wrench",
        "REPARACION": "mdi-check-circle",
        "CAMBIO_ESTADO": "mdi-swap-horizontal"
      };
      return iconos[tipo] || "mdi-circle";
    },

    getColorCondicion(condicion) {
      const colores = {
        "OPERATIVO": "green",
        "EN MANTENIMIENTO": "purple",
        "AVERIADO": "red",
        "DADO DE BAJA": "grey"
      };
      return colores[condicion] || "grey";
    },

    cerrar() {
      this.show = false;
      this.filtroTipo = null;
    }
  }
};
</script>
