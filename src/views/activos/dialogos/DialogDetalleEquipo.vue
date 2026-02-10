<template>
  <v-dialog v-model="show" max-width="600px" scrollable>
    <v-card>
      <v-card-title class="primary white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-information</v-icon>
        Detalle del Equipo
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-card outlined class="pa-4 mb-4">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="subtitle-1 font-weight-bold">{{ equipo.codigo }}</div>
              <div class="grey--text">{{ equipo.marca }} {{ equipo.modelo }}</div>
            </div>
            <div class="text-right">
              <v-chip :color="getColorCondicion(equipo.condicion)" dark label class="mb-1">
                {{ equipo.condicion }}
              </v-chip>
              <br>
              <v-chip :color="getColorEstado(equipo.estado)" outlined label>
                {{ equipo.estado }}
              </v-chip>
            </div>
          </div>
        </v-card>
        <v-simple-table dense class="mb-4">
          <tbody>
            <tr>
              <td class="font-weight-medium" width="40%">Tipo:</td>
              <td>{{ equipo.descripcion || '-' }}</td>
            </tr>
            <tr>
              <td class="font-weight-medium">Ubicación:</td>
              <td>{{ equipo.ubicacion_especifica || '-' }}</td>
            </tr>
            <tr>
              <td class="font-weight-medium">Fecha Ingreso:</td>
              <td>{{ formatFecha(equipo.fecha_ingreso) }}</td>
            </tr>
            <tr v-if="equipo.cliente_nombre">
              <td class="font-weight-medium">Cliente Actual:</td>
              <td>
                <div class="font-weight-medium">{{ equipo.cliente_nombre }} ({{ equipo.cliente_id }})</div>
                <div class="caption grey--text">{{ equipo.cliente_direccion }}</div>
              </td>
            </tr>
            <tr v-if="equipo.fecha_asignacion">
              <td class="font-weight-medium">Fecha Asignación:</td>
              <td>{{ formatFecha(equipo.fecha_asignacion) }}</td>
            </tr>
            <tr v-if="equipo.fecha_mantenimiento_inicio && equipo.condicion === 'EN MANTENIMIENTO'">
              <td class="font-weight-medium">En mantenimiento desde:</td>
              <td>{{ formatFecha(equipo.fecha_mantenimiento_inicio) }}</td>
            </tr>
            <tr>
              <td class="font-weight-medium">Último cambio:</td>
              <td>
                {{ formatFecha(equipo.fecha_ultimo_cambio) }}
                <div class="caption grey--text">{{ equipo.usuario_ultimo_cambio }}</div>
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-card v-if="equipo.observacion_actual" outlined class="pa-3 mb-4 grey lighten-4">
          <div class="caption grey--text mb-1">Observación actual:</div>
          <div>{{ equipo.observacion_actual }}</div>
        </v-card>

        <div class="subtitle-2 mb-2">Acciones disponibles</div>
        <v-row dense>
          <v-col cols="6" sm="4" v-if="puedeAsignar">
            <v-btn color="success" block small @click="$emit('asignar', equipo); cerrar()">
              <v-icon left small>mdi-account-plus</v-icon>
              Asignar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" v-if="puedeConfirmarEntrega">
            <v-btn color="teal" dark block small @click="$emit('confirmar-entrega', equipo); cerrar()">
              <v-icon left small>mdi-truck-delivery</v-icon>
              Entregar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" v-if="puedeDevolver">
            <v-btn color="orange" dark block small @click="$emit('devolver', equipo); cerrar()">
              <v-icon left small>mdi-keyboard-return</v-icon>
              Devolver
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" v-if="puedeMantenimiento">
            <v-btn color="purple" dark block small @click="$emit('mantenimiento', equipo); cerrar()">
              <v-icon left small>mdi-wrench</v-icon>
              Mantenimiento
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" v-if="puedeCompletar">
            <v-btn color="green" dark block small @click="$emit('completar', equipo); cerrar()">
              <v-icon left small>mdi-check</v-icon>
              Completar Rep.
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4">
            <v-btn color="info" outlined block small @click="$emit('editar', equipo); cerrar()">
              <v-icon left small>mdi-pencil</v-icon>
              Editar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text color="grey" @click="$emit('historial', equipo); cerrar()">
          <v-icon left>mdi-history</v-icon>
          Ver Historial
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="cerrar">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from "moment";

export default {
  name: "DialogDetalleEquipo",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  computed: {
    show: {
      get() { return this.visible; },
      set(val) { this.$emit("update:visible", val); }
    },

    puedeAsignar() {
      return this.equipo.condicion === "OPERATIVO" && this.equipo.estado === "ALMACÉN";
    },

    puedeConfirmarEntrega() {
      return this.equipo.estado === "RESERVADO";
    },

    puedeDevolver() {
      return this.equipo.estado === "EN USO" || this.equipo.estado === "RESERVADO";
    },

    puedeMantenimiento() {
      return this.equipo.estado === "ALMACÉN" &&
        (this.equipo.condicion === "AVERIADO" || this.equipo.condicion === "OPERATIVO");
    },

    puedeCompletar() {
      return this.equipo.condicion === "EN MANTENIMIENTO";
    }
  },

  methods: {
    formatFecha(timestamp) {
      if (!timestamp) return "-";
      return moment(timestamp).format("DD/MM/YYYY HH:mm");
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

    getColorEstado(estado) {
      const colores = {
        "ALMACÉN": "blue",
        "RESERVADO": "orange",
        "EN USO": "teal"
      };
      return colores[estado] || "grey";
    },

    cerrar() {
      this.show = false;
    }
  }
};
</script>
