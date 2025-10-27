<template>
  <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" max-width="550px">
    <div>
      <v-system-bar class="" dense window dark height="40">
        <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <h3 class="">{{ tipo }}</h3>
        <v-spacer></v-spacer>

      </v-system-bar>
    </div>
    <v-card class="pa-3">
      <v-row dense class="mb-2">
        <v-col cols="6">
          <v-btn rounded elevation="6" block color="info" @click="abre_nuevo()" small>
            <v-icon left>
              mdi-plus
            </v-icon>Nuevo
          </v-btn>
        </v-col>
          <v-col cols="6">
          <v-btn rounded elevation="6" block color="error" @click="abre_mapa_zona()" small>
            <v-icon left>
              mdi-google-maps
            </v-icon>Mapa Zonas
          </v-btn>
        </v-col>
      </v-row>
      <v-simple-table class="elevation-4" fixed-header height="60vh" dense>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">
                Nombre
              </th>
              <th class="text-left">
                Accion
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in desserts" :key="item.key">
              <td style="font-size:80%;">{{ item.nombre }}</td>
              <td style="font-size:80%;">
                <v-row dense>
                  <v-col cols="12">
                    <v-icon color="green" @click="edita(item)">mdi-lead-pencil</v-icon>
                  </v-col>
                </v-row>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>

      <v-dialog v-model="dialogoNuevo" max-width="460px">
        <div>
          <v-system-bar window dark>
            <v-icon @click="dialogoNuevo = !dialogoNuevo">mdi-close</v-icon>
            <v-spacer></v-spacer>
            <v-icon large color="red" @click="elimina()">mdi-delete</v-icon>
          </v-system-bar>
        </div>
        <v-card class="mx-auto pa-2">
          <v-row dense class="mt-2">
            <v-col cols="12">
              <v-text-field dense outlined v-model="nombre" label="NOMBRE"></v-text-field>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn rounded color="success" @click="grabar()">
              GRABAR
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
    <mapa_zonas v-if="mostrar_mapa" @cerrar="mostrar_mapa=false" :clientes="[]" :zonas="desserts"/>
  </v-dialog>


</template>

<script>
import mapa_zonas from './mapa_zona.vue'
import {
  alltabla_cliente,
  elimina_tabla_cliente,
  nueva_tabla_cliente,
  edita_tablacliente,
  editaProducto
} from '../../../db'
import store from '@/store/index'

export default {
  components: { mapa_zonas },
  props: {

  },
  data: () => ({
    itemselecto: '',
    dialogoNuevo: false,
    nombre: '',
    desserts: [],
    editar: false,
    nom_anterior: '',
    tipo: 'zona',
    mostrar_mapa: false,
  }),
  mounted() {
    alltabla_cliente(this.tipo).on("value", this.onDataChange);
  },
  beforeDestroy() {
    alltabla_cliente(this.tipo).off("value", this.onDataChange);
  },
  created() {
    console.log(this.tipo)
    this.dial = true
  },

  methods: {
    abre_mapa_zona() {
      console.log(this.desserts)
      this.mostrar_mapa = true
    },
    onDataChange(items) {
      let array = [];
      items.forEach((item) => {
        let key = item.key;
        let data = item.val();
        data.key = key
        array.push(data);
      });
      this.desserts = array;
    },
    abre_nuevo() {
      this.editar = false
      this.nombre = ''
      this.dialogoNuevo = true
    },
    async grabar() {
      store.commit("dialogoprogress")
      if (this.editar) {
        await this.modificar()
      } else {
        var array = ({
          nombre: this.nombre,
        })
        await nueva_tabla_cliente(this.tipo, array)
      }
      this.dialogoNuevo = false
      this.nombre = ''
      store.commit("dialogoprogress")

    },
    async modificar() {
      var producto = store.state.productos.filter(item => item.categoria == this.nom_anterior)
      for (var i = 0; i < producto.length; i++) {
        var data = producto[i]
        await editaProducto(data.id, "categoria", this.nombre)
      }
      await edita_tablacliente(this.tipo, this.itemselecto.key, 'nombre', this.nombre)
      return true
    },
    async elimina() {
      var producto = store.state.productos.filter(item => item.categoria == this.itemselecto.nombre)
      if (producto != '') {
        alert('NO SE PUEDE ELININAR')
        return
      }
      if (confirm('SEGURO QUE DESEA ELIMINAR?')) {
        await elimina_tabla_cliente(this.tipo, this.itemselecto.key)
      }
      this.dialogoNuevo = false
    },
    edita(item) {
      this.editar = true
      this.nom_anterior = item.nombre
      this.itemselecto = item
      this.nombre = item.nombre
      this.dialogoNuevo = true
    },
    cierra() {
      this.$emit('cierra', false);
    }
  },
}
</script>
