<template>
  <v-container class="mt-6 mb-6" grid-list-xs>
    <v-card>

      <v-card-text>
        <v-row class="mx-auto mt-4">
          <v-col cols="9" xs="9">
            <v-text-field v-model="codigo" label="Codigo" append-icon="mdi-magnify" @click:append="buscaProducto()"
              @keyup.enter="buscaProducto()"></v-text-field>
          </v-col>
          <v-col cols="3" xs="3">
            <v-btn color="success" @click="tranferir()">Transferir</v-btn>
          </v-col>
        </v-row>
      </v-card-text>


      <v-simple-table fixed-header height="400px">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">
                id
              </th>
              <th class="text-left">
                Nombre
              </th>
              <th class="text-left">
                Categoria
              </th>
              <th class="text-left">
                stock
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listaproductos" :key="item.id" @click="dialogDelete = !dialogDelete, id = item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.nombre }}</td>
              <td>{{ item.categoria }}</td>
              <td>{{ item.cantidad }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>

    </v-card>


    <div class="text-center">
      <v-snackbar v-model="snackbar" :timeout="timeout" top>
        {{ text }}

        <template v-slot:action="{ attrs }">
          <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Seguro desea descontar 1?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDelete = !dialogDelete">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="restaProductos()">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>


  </v-container>

</template>

<script>
import {
  buscaProductos, grabarStockOtraBase, nuevoProductoOtraBase,
  grabarStock, allProductoOtraBase
} from '../db'
import store from '@/store/index'

export default {
  data() {
    return {
      codigo: '',
      listaproductos: [],
      listaproductosBD: [],
      prelista: [],
      snackbar: false,
      text: '',
      timeout: 2000,
      dialogDelete: false,
      id: ''
    }
  },
  mounted() {
    allProductoOtraBase('BD6').on("value", this.onDataChange);
  },
  beforeDestroy() {
    allProductoOtraBase('BD6').off("value", this.onDataChange);
  },
  methods: {
    onDataChange(items) {
      let array = [];
      items.forEach((item) => {
        let key = item.key;
        let data = item.val();
        array.push({
          id: key,
          activo: data.activo,
          codbarra: data.codbarra,
          nombre: data.nombre,
          categoria: data.categoria,
          medida: data.medida,
          stock: data.stock,
          precio: data.precio,
          costo: data.costo,
          margen: data.margen,
          ubicacion: data.ubicacion,
          cocina: data.cocina,
          tipoproducto: data.tipoproducto,
          operacion: data.operacion,
          icbper: data.icbper,
          barra: data.barra,
          controstock: data.controstock,
          pmayorista: data.pmayorista,
          papartirde: data.papartirde,
          cantidad: 1,
        });
      });
      this.listaproductosBD = array;
    },

    tranferir() {
      var bd = 'BD6'
      for (var i = 0; i < this.listaproductos.length; i++) {
        if (this.buscarArrayOtraBase(this.listaproductos[i].id)) {
          var stock = 0
          stock = this.listaproductos[i].cantidad + this.buscarStockOtraBase(this.listaproductos[i].id)
          grabarStockOtraBase(bd, this.listaproductos[i].id, stock)
        } else {
          var array = {
            id: this.listaproductos[i].id,
            activo: this.listaproductos[i].activo,
            codbarra: this.listaproductos[i].codbarra,
            nombre: this.listaproductos[i].nombre,
            categoria: this.listaproductos[i].categoria,
            medida: this.listaproductos[i].medida,
            stock: this.listaproductos[i].cantidad,
            precio: this.listaproductos[i].precio,
            costo: this.listaproductos[i].costo,
            margen: this.listaproductos[i].margen,
            ubicacion: this.listaproductos[i].ubicacion,
            cocina: this.listaproductos[i].cocina,
            tipoproducto: this.listaproductos[i].tipoproducto,
            operacion: this.listaproductos[i].operacion,
            icbper: this.listaproductos[i].icbper,
            barra: this.listaproductos[i].barra,
            controstock: this.listaproductos[i].controstock,
            pmayorista: this.listaproductos[i].pmayorista,
            papartirde: this.listaproductos[i].papartirde
          }
          nuevoProductoOtraBase(bd, this.listaproductos[i].id, array)
        }
        var nuevostock = 0
        nuevostock = parseInt(this.listaproductos[i].stock) - parseInt(this.listaproductos[i].cantidad)
        grabarStock(this.listaproductos[i].id, nuevostock)
      }

      this.listaproductos = ''
    },
    buscaProducto() {
      var self = this
      if (this.listaproductos != '') {
        if (this.listaproductos.indexOf(this.buscarArray(this.codigo)) == -1) {
          buscaProductos(this.codigo).once("value").then((snapshot) => {
            if (snapshot.exists && snapshot.val().stock > 0) {
              this.listaproductos.push({
                id: snapshot.val().id,
                activo: snapshot.val().activo,
                codbarra: snapshot.val().codbarra,
                nombre: snapshot.val().nombre,
                categoria: snapshot.val().categoria,
                medida: snapshot.val().medida,
                stock: snapshot.val().stock,
                precio: snapshot.val().precio,
                costo: snapshot.val().costo,
                margen: snapshot.val().margen,
                ubicacion: snapshot.val().ubicacion,
                cocina: snapshot.val().cocina,
                tipoproducto: snapshot.val().tipoproducto,
                operacion: snapshot.val().operacion,
                icbper: snapshot.val().icbper,
                barra: snapshot.val().barra,
                controstock: snapshot.val().controstock,
                pmayorista: snapshot.val().pmayorista,
                papartirde: snapshot.val().papartirde,
                cantidad: 1,
              })
              this.codigo = ''
            } else {
              self.snack("Producto no Existe o sin Stock")
              this.codigo = ''
            }
          }).catch(function (error) {
            self.snack("Producto no Existe")
            console.log(error)
            self.codigo = ''
          })

        } else {
          this.sumaproductos(this.codigo)
          this.codigo = ''
        }
      } else {
        buscaProductos(this.codigo).once("value").then((snapshot) => {
          if (snapshot.exists && snapshot.val().stock > 0) {
            this.listaproductos.push({
              id: snapshot.val().id,
              activo: snapshot.val().activo,
              codbarra: snapshot.val().codbarra,
              nombre: snapshot.val().nombre,
              categoria: snapshot.val().categoria,
              medida: snapshot.val().medida,
              stock: snapshot.val().stock,
              precio: snapshot.val().precio,
              costo: snapshot.val().costo,
              margen: snapshot.val().margen,
              ubicacion: snapshot.val().ubicacion,
              cocina: snapshot.val().cocina,
              tipoproducto: snapshot.val().tipoproducto,
              operacion: snapshot.val().operacion,
              icbper: snapshot.val().icbper,
              barra: snapshot.val().barra,
              controstock: snapshot.val().controstock,
              pmayorista: snapshot.val().pmayorista,
              papartirde: snapshot.val().papartirde,
              cantidad: 1,
            })
            this.codigo = ''
          } else {
            self.snack("Producto no Existe o sin Stock")
            this.codigo = ''
          }

        }).catch(function (error) {
          self.snack("Producto no Existe")
          console.log(error)
          self.codigo = ''
        })
      }

    },
    snack(text) {
      this.snackbar = true
      this.text = text
    },
    buscarArray(id) {
      var a = []
      for (var i = 0; i < this.listaproductos.length; i++) {
        if (this.listaproductos[i].id == id) {
          a = this.listaproductos[i]
        }
      }
      return a
    },
    buscarArrayOtraBase(id) {
      var a = false
      for (var i = 0; i < this.listaproductosBD.length; i++) {
        if (this.listaproductosBD[i].id == id) {
          a = true
        }
      }
      return a
    },
    buscarStockOtraBase(id) {
      var a = 0
      for (var i = 0; i < this.listaproductosBD.length; i++) {
        if (this.listaproductosBD[i].id == id) {
          a = parseInt(this.listaproductosBD[i].stock)
        }
      }
      return a
    },
    sumaproductos(id) {
      for (var i = 0; i < this.listaproductos.length; i++) {
        if (this.listaproductos[i].id == id) {
          if (this.listaproductos[i].cantidad >= this.listaproductos[i].stock &&
            store.state.configuracion[0].estado
          ) {
            this.snack("No tiene mas stock")
          } else {
            this.listaproductos[i].cantidad = this.listaproductos[i].cantidad + 1
          }
        }
      }
    },
    restaProductos() {
      var id = this.id
      for (var i = 0; i < this.listaproductos.length; i++) {
        if (this.listaproductos[i].id == id) {
          if (this.listaproductos[i].cantidad > 1) {
            this.listaproductos[i].cantidad = this.listaproductos[i].cantidad - 1
          }
          else {
            this.listaproductos.splice(this.codigoedita, 1)
          }
        }
      }
      this.dialogDelete = false
    }


  },


}
</script>