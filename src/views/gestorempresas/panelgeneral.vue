<template>
  <v-container>

    <v-row class="mb-4">
      <v-col cols="6" class="pa-3" md="6" sm="6" xs="6">
        <v-card @click.prevent="router('paneladmin')">
          <v-container>
            <v-img class="mx-auto" height="70" width="70" src="/tienda.png"></v-img>
            <h4 block class="text-center pa-1">EMPRESAS</h4>
          </v-container>
        </v-card>
      </v-col>
      <v-col cols="6" class="pa-3" md="6" sm="6" xs="6">
        <v-card @click.prevent="dial_multi = true">
          <v-container>
            <v-img class="mx-auto" height="70" width="70" src="/sistemas.png"></v-img>
            <h4 block class="text-center pa-1">Multi-Empresas</h4>
          </v-container>
        </v-card>
      </v-col>
      <v-col cols="6" class="pa-3" md="6" sm="6" xs="6">
        <v-card @click.prevent="$store.commit('dialogoiconos')">
          <v-container>
            <v-img class="mx-auto" height="70" width="70" src="/cash.png"></v-img>
            <h4 block class="text-center pa-1">PAGOS</h4>
          </v-container>
        </v-card>
      </v-col>
      <v-col cols="6" class="pa-3" md="6" sm="6" xs="6">
        <v-card @click.prevent="router('revision')">
          <v-container>
            <v-img class="mx-auto" height="70" width="70" src="/sunat.png"></v-img>
            <h4 block class="text-center pa-1">REVISION</h4>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
    <dialogoiconos />
    <multi v-if="dial_multi" @cierra="dial_multi = false"></multi>
  </v-container>
</template>

<script>
// @ is an alias to /src
import dialogoiconos from '@/components/dialogos/iconos'
import multi from '../gestorempresas/multi_empresas.vue'
import store from '@/store/index'
import {
  allCronogramapago
} from '../../db'
export default {
  name: 'panel',

  components: {
    dialogoiconos,
    multi
  },
  data() {
    return {
      dial_multi: false
    }
  },
  created() {

  },
  methods: {

    router(view) {
      this.$router.push({
        name: view
      })
    },
  },

}
</script>
