<template>
  <v-dialog v-model="$store.state.dialogo_moneda" max-width="480px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogo_moneda')">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <v-icon large color="green" @click="graba()">mdi-content-save</v-icon>
      </v-system-bar>
    </div>

    <v-card class="pa-5">
      <div>

        <v-row dense>

          <v-col cols="6">
            <v-text-field dense v-model="nom_moneda" label="Nombre moneda"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field dense v-model="conversion_moneda" label="conversion"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="activo_moneda" label="Activo?"></v-checkbox>
          </v-col>
        </v-row>
      </div>

    </v-card>

  </v-dialog>
</template>

<script>
import {
  allConfigura,
  grabaConfigura
} from '../../db'
import store from '@/store/index'

export default {
  data() {
    return {
      nom_moneda: '',
      conversion_moneda: '',
      activo_moneda: ''

    }
  },
  created() {
    this.inicializar()
  },
  methods: {
    inicializar() {
      allConfigura().once("value").then((snapshot) => {
        if (snapshot.val() != null) {
          this.nom_moneda = snapshot.val().nom_moneda
          this.conversion_moneda = snapshot.val().conversion_moneda
          this.activo_moneda = snapshot.val().activo_moneda
        }

      })
    },
    graba() {
      grabaConfigura("nom_moneda", this.nom_moneda)
      grabaConfigura("conversion_moneda", this.conversion_moneda)
      grabaConfigura("activo_moneda", this.activo_moneda)
      store.commit('dialogo_moneda')
    }
  }
}
</script>
