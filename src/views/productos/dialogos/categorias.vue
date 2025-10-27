<template>
  <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" max-width="550px">
    <div>
      <v-system-bar class="" dense window dark height="40">
        <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <h3 class="">{{tipo}}</h3>
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
  </v-dialog>


</template>

<script>
import {
  allCategorias,
  eliminaCategoria,
  nuevoCategoria,
  editaCategoria,
  editaProducto
} from '../../../db'
import store from '@/store/index'

export default {
  props:{
    tipo:null
  } , 
  data: () => ({
    itemselecto: '',
    dialogoNuevo: false,
    nombre: '',
    desserts: [],
    editar: false,
    nom_anterior: ''
  }),
  mounted() {
    allCategorias(this.tipo).on("value", this.onDataChange);
  },
  beforeDestroy() {
    allCategorias(this.tipo).off("value", this.onDataChange);
  },
  created() {
    console.log(this.tipo)
    this.dial = true
  },

  methods: {
   onDataChange(items) {
  const array = [];
  items.forEach((item) => {
    const key = item.key;
    const data = item.val();
    data.key = key;
    array.push(data);
  });

  // Orden alfabético por nombre (case/acentos-insensible, numérico natural)
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
  array.sort((a, b) =>
    collator.compare(
      (a.nombre || '').toString().trim(),
      (b.nombre || '').toString().trim()
    )
  );

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
        await nuevoCategoria(this.tipo,array)
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
      await editaCategoria(this.tipo,this.itemselecto.key, 'nombre', this.nombre)
      return true
    },
    async elimina() {
      var producto = store.state.productos.filter(item => item.categoria == this.itemselecto.nombre)
      if (producto != '') {
        alert('NO SE PUEDE ELININAR')
        return
      }
      if (confirm('SEGURO QUE DESEA ELIMINAR?')) {
        await eliminaCategoria(this.tipo,this.itemselecto.key)
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
