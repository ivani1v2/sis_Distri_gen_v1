<template>
  <v-dialog v-model="dialogVisible" max-width="420px" persistent>
    <v-card :loading="loading">
      <v-toolbar color="primary" dark dense flat>
        <v-icon left>mdi-map-marker-radius</v-icon>
        <v-toolbar-title class="text-body-1 font-weight-bold">
          Configuración GPS
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="cerrar" :disabled="loading">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="formValido">
          <v-card class="mb-4" flat outlined>
            <v-card-text class="py-3">
              <v-row align="center" no-gutters>
                <v-col cols="5" class="text-right pr-3">
                  <div class="text-subtitle-2 font-weight-bold" :class="modoMaximo ? 'red--text' : ''">
                    Máximo
                  </div>
                  <div class="text-caption" :class="modoMaximo ? 'red--text' : 'grey--text'">
                    Mayor batería
                  </div>
                </v-col>
                <v-col cols="2" class="text-center">
                  <v-switch v-model="modoMaximo" hide-details :color="modoMaximo ? 'red' : 'green'" inset
                    @change="toggleModo"></v-switch>
                </v-col>
                <v-col cols="5" class="text-left pl-3">
                  <div class="text-subtitle-2 font-weight-bold" :class="!modoMaximo ? 'green--text' : ''">
                    Medio
                  </div>
                  <div class="text-caption" :class="!modoMaximo ? 'green--text' : 'grey--text'">
                    Menos batería
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-divider class="my-2"></v-divider>

          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Parámetro</th>
                  <th class="text-right">Actual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Movimiento mínimo</td>
                  <td class="text-right font-weight-bold">{{ config.movimiento_minimo_metros }} m</td>
                </tr>
                <tr>
                  <td>Precisión máxima</td>
                  <td class="text-right font-weight-bold">{{ config.precision_gps_maxima }} m</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>

          <v-row dense class="mt-4">
            <v-col cols="12">
              <v-text-field v-model.number="config.distancia_visita" label="Radio de Visita (m)" type="number" outlined
                dense hide-details="auto" :rules="rules.rango">
                <template v-slot:append>
                  <v-tooltip bottom max-width="250">
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small color="blue lighten-2" v-bind="attrs" v-on="on">
                        mdi-help-circle
                      </v-icon>
                    </template>
                    <span>Radio máximo en metros para marcar visita.</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn text @click="cerrar" :disabled="loading">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="guardar" :loading="loading" :disabled="!formValido || loading">
          <v-icon left size="18">mdi-content-save</v-icon>
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { allConfigura, grabaConfigura } from "../../db";

export default {
  name: "ConfiguracionGPS",
  data: () => ({
    loading: false,
    formValido: false,
    modoMaximo: false,
    config: {
      movimiento_minimo_metros: 15,
      distancia_visita: 15,
      precision_gps_maxima: 100,
    },
    rules: {
      rango: [
        v => (v !== null && v !== '') || 'Requerido',
        v => (v >= 1 && v <= 200) || 'Rango: 1 a 200m'
      ]
    }
  }),

  computed: {
    dialogVisible: {
      get() { return this.$store.state.dialogoConfiguracionGPS; },
      set(val) {
        if (!val && !this.loading) {
          this.$store.commit('dialogoConfiguracionGPS');
        }
      }
    }
  },

  watch: {
    dialogVisible(val) {
      if (val) this.cargarConfiguracion();
    }
  },

  methods: {
    toggleModo() {
      if (this.modoMaximo) {
        this.config.movimiento_minimo_metros = 5;
        this.config.precision_gps_maxima = 150;
      } else {
        this.config.movimiento_minimo_metros = 15;
        this.config.precision_gps_maxima = 100;
      }
    },

    async cargarConfiguracion() {
      this.$store.commit("dialogoprogress");
      this.loading = true;
      try {
        const snapshot = await allConfigura().once("value");
        const data = snapshot.val();
        if (data) {
          Object.keys(this.config).forEach(key => {
            if (data[key] !== undefined) this.config[key] = data[key];
          });
        }

        if (this.config.movimiento_minimo_metros === 5 && this.config.precision_gps_maxima === 150) {
          this.modoMaximo = true;
        } else {
          this.modoMaximo = false;
        }

      } catch (error) {
        this.notificar("Error al cargar configuración");
      } finally {
        this.loading = false;
        this.$store.commit("dialogoprogress");
      }
    },

    async guardar() {
      if (!this.$refs.form.validate()) return;

      this.$store.commit("dialogoprogress");
      this.loading = true;

      try {
        const promesas = Object.keys(this.config).map(key =>
          grabaConfigura(key, this.config[key])
        );
        await Promise.all(promesas);

        this.$store.commit('setConfiguracionGPS', { ...this.config });
        this.notificar("Configuración guardada");
        this.$store.commit('dialogoConfiguracionGPS');

      } catch (error) {
        this.notificar("Error al guardar");
      } finally {
        this.loading = false;
        this.$store.commit("dialogoprogress");
      }
    },

    cerrar() {
      if (!this.loading) {
        this.$store.commit('dialogoConfiguracionGPS');
      }
    },

    notificar(msj) {
      this.$store.commit('dialogosnackbar', msj);
    }
  }
};
</script>