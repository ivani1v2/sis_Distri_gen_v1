<template>
  <v-dialog v-model="$store.state.dialogoiconos" max-width="460px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogoiconos')">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <v-icon v-if="$store.state.tipodialogoicono" large color="green"
          @click="dialogsubiricono = !dialogsubiricono">mdi-plus</v-icon>
      </v-system-bar>
    </div>

    <v-card class="pa-6">
      <v-row class="mt-n5" dense>

        <v-col v-for="item in arrayiconos" :key="item.id" cols="4" class="pa-3" md="4" sm="4" xs="4">
          <v-card v-if="$store.state.tipodialogoicono"
            @click="dialogoeliminaicono = !dialogoeliminaicono, itemselecto = item">
            <v-container>
              <v-img class="mx-auto" height="50" width="50" :src='item.url' :lazy-src='item.url'></v-img>
            </v-container>
          </v-card>
          <v-card v-if="!$store.state.tipodialogoicono"
            @click="$store.commit('iconoselecto', item.url), $store.commit('dialogoiconos')">
            <v-container>
              <v-img class="mx-auto" height="50" width="50" :src='item.url' :lazy-src='item.url'></v-img>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-dialog v-model="dialogsubiricono" max-width="460px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogsubiricono = !dialogsubiricono">mdi-close</v-icon>
          <v-spacer></v-spacer>
        </v-system-bar>
      </div>
      <v-card class="pa-6">
        <v-file-input dense label="File input" filled v-model="selectedFile" prepend-icon="mdi-camera"></v-file-input>
        <v-btn color="success" block rounded @click="agregarFoto()">SUBIR ICONO</v-btn>

      </v-card>

    </v-dialog>

    <v-dialog v-model="dialogoeliminaicono" max-width="460px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoeliminaicono = !dialogoeliminaicono">mdi-close</v-icon>
          <v-spacer></v-spacer>
        </v-system-bar>
      </div>
      <v-card class="pa-6">

        <v-btn color="success" block rounded @click="eliminaricono()">ELIMINAR?</v-btn>

      </v-card>

    </v-dialog>

    <v-dialog v-model="progress" max-width="200" persistent>
      <v-card>
        <v-progress-circular :rotate="90" :size="200" :width="15" :value="Uploadvalue" color="red">
          {{ Uploadvalue }}
        </v-progress-circular>
      </v-card>

    </v-dialog>
  </v-dialog>
</template>

<script>
import {
  guardaIcono,
  guardaRutaIconos,
  consultaIconos,
  eliminaRutaIconos,
  eliminaIcono
} from '../../db'
import store from '@/store/index'

export default {

  data() {
    return {
      dialogsubiricono: false,
      dialogoeliminaicono: false,
      selectedFile: null,
      value: '',
      size: 250,
      Uploadvalue: 0,
      progress: false,
      arrayiconos: [],
      tamañoarray: 0,
      itemselecto: ''
    }
  },
  created() {
    //this.initialize()
  },
  mounted() {
    this.initialize()
  },
  methods: {
    initialize() {
      var array = []
      consultaIconos().once("value").then((snapshot) => {
        snapshot.forEach((item) => {
          var data = item.val()
          array.push({
            url: data.url,
            nombre: data.nombre,
            posicion: data.posicion
          })
        })
        this.arrayiconos = array
        this.tamañoarray = parseInt(array[array.length - 1].posicion) + 1
      })

    },
    agregarFoto() {
      this.comprimirImagen(this.selectedFile, parseInt(30)).then((image) => {

        this.progress = true
        var task = guardaIcono(image, "icono" + this.tamañoarray)
        task.on('state_changed', snapshot => {
          let porcentaje = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          this.Uploadvalue = porcentaje
        }, error => {
          console.log(error.message)
        },
          () => {
            this.Uploadvalue = 100;
            task.snapshot.ref.getDownloadURL().then((url) => {

              var array = {
                url: url,
                nombre: "icono" + this.tamañoarray,
                posicion: this.tamañoarray
              }
              guardaRutaIconos(this.tamañoarray, array)
              this.selectedFile = '',
                this.progress = false
              this.dialogsubiricono = false
              this.initialize()
            })
          }
        )
      })

    },
    eliminaricono() {
      console.log(this.itemselecto)
      eliminaRutaIconos(this.itemselecto.posicion)
      eliminaIcono(this.itemselecto.nombre)
      this.dialogoeliminaicono = false
      this.initialize()
    },

    comprimirImagen(imagenComoArchivo, porcentajeCalidad) {

      return new Promise((resolve, reject) => {
        const $canvas = document.createElement("canvas");
        const imagen = new Image();
        imagen.onload = () => {
          $canvas.width = imagen.width;
          $canvas.height = imagen.height;
          $canvas.getContext("2d").drawImage(imagen, 0, 0);
          $canvas.toBlob(
            (blob) => {
              if (blob === null) {
                return reject(blob);
              } else {
                resolve(blob);
              }
            },
            "image/webp",
            porcentajeCalidad / 100
          );
        };
        imagen.src = URL.createObjectURL(imagenComoArchivo);
      });
    }
  }

}
</script>
