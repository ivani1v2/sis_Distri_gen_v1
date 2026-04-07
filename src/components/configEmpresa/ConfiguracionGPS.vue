<template>
  <v-dialog v-model="dialogVisible" max-width="350px" persistent>
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
          <v-row dense>
            <v-col cols="12" v-for="field in campos" :key="field.key">
              <v-text-field v-model.number="config[field.key]" :label="field.label" :suffix="field.suffix" type="number"
                outlined dense hide-details="auto" class="mb-3" :rules="rules.rango">
                <template v-slot:append>
                  <v-tooltip bottom max-width="250">
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small color="blue lighten-2" v-bind="attrs" v-on="on">
                        mdi-help-circle
                      </v-icon>
                    </template>
                    <span>{{ field.hint }}</span>
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
    config: {
      movimiento_minimo_metros: 30,
      distancia_visita: 15,
      precision_gps_maxima: 40,
    },
    campos: [
      {
        key: 'movimiento_minimo_metros',
        label: 'Movimiento Mínimo',
        suffix: 'm',
        hint: 'El sistema ignorará cambios de ubicación menores a este valor. Útil para evitar micro-movimientos cuando el usuario está detenido.'
      },
      {
        key: 'distancia_visita',
        label: 'Radio de Visita Mínima',
        suffix: 'm',
        hint: 'Radio máximo en metros para considerar que el usuario está en el punto. Si la distancia es menor, la visita será válida.'
      },
      {
        key: 'precision_gps_maxima',
        label: 'Precisión Máxima',
        suffix: 'm',
        hint: 'Margen de error aceptable del GPS. El sistema ignorará lecturas con un error superior al configurado.'
      }
    ],
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
        
        // Cerrar el diálogo después de guardar
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