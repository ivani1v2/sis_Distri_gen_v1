<template>
  <v-dialog v-model="$store.state.dialogomodopago" max-width="460px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogomodopago')">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <v-icon @click="dialog = !dialog" medium class="white" color="green">mdi-plus</v-icon>
      </v-system-bar>
    </div>

    <v-card>
      <v-card v-if="dialog" class="pa-3">

        <v-row>
          <v-col cols="6">
            <v-select v-model="modo_pago" :items="$store.state.lista_modos" dense></v-select>
          </v-col>
          <v-col cols="6">
            <v-btn block @click.prevent="agrega()" color="success">agregar</v-btn>
          </v-col>
        </v-row>
      </v-card>

      <v-simple-table>
        <template v-slot:default>
          <thead>

            <tr>
              <th class="text-left">
                modo
              </th>
              <th class="text-left">
                Accion
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in desserts" :key="item">
              <td>{{ item }}</td>
              <td>
                <v-icon @click.prevent="elimina(item)" color="red">mdi-close</v-icon>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card>

  </v-dialog>
</template>

<script>
import {
  allModoPago,
  nuevoModoPago,
  eliminaModoPago
} from '../../db'
export default {

  data() {
    return {
      dialog: false,
      desserts: [],
      modo_pago: 'EFECTIVO'
    }
  },
  mounted() {
    allModoPago().on("value", this.onDataChange);
  },
  beforeDestroy() {
    allModoPago().off("value", this.onDataChange);
  },

  methods: {

    onDataChange(items) {
      this.desserts = []
      let array = [];
      items.forEach((item) => {
        let data = item.val();
        let key = item.key;
        array.push(data);
      });

      this.desserts = array;
    },
    agrega() {
      var cons = (this.desserts.find(item => item == this.modo_pago))
      if (cons != undefined) {
        alert('METODO YA AGREGADO')
        return
      }
      this.desserts[this.desserts.length] = this.modo_pago
      nuevoModoPago(this.desserts)
      this.dialog = false
    },
    elimina(id) {
      var pos = this.desserts.map(e => e).indexOf(id)
      this.desserts.splice(pos, 1)
      nuevoModoPago(this.desserts)
    }
  }

}
</script>
