<template>
  <v-dialog v-model="$store.state.dialogoLogoEmpresa" max-width="860px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogoLogoEmpresa')">mdi-close</v-icon>
        <v-spacer></v-spacer>
      </v-system-bar>
    </div>

    <!-- Image Cropping Section -->
    <v-card class="text-center pa-5">
      <croppa :placeholder-font-size="19" canvas-color="transparent" placeholder-color="#000" :width="croppaWidth"
        :height="croppaHeight" :initial-image="imagenURL" v-model="myCroppa">
      </croppa>

      <v-row>
        <v-col cols="6">
          <v-text-field label="Width Ratio" type="number" v-model="croppaWidth" min="100" max="1000" step="10" />
        </v-col>
        <v-col cols="6">
          <v-text-field label="Height Ratio" type="number" v-model="croppaHeight" min="100" max="1000" step="10" />
        </v-col>
      </v-row>

      <v-btn color="success" @click="uploadCroppedImage" block>SUBIR LOGO</v-btn>
    </v-card>

    <!-- Progress Dialog -->
    <v-dialog v-model="progress" max-width="200">
      <v-card>
        <v-progress-circular :rotate="90" :size="200" :width="15" :value="Uploadvalue" color="red">
          {{ Uploadvalue }}%
        </v-progress-circular>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import { guardaArchivo, guardaRutaArchibo, consultaArchivo } from '../../db'
import store from '@/store/index'

export default {
  data() {
    return {
      myCroppa: {},
      progress: false,
      Uploadvalue: 0,
      imagenURL: '',
      croppaWidth: 300,  // Default width
      croppaHeight: 300, // Default height
    }
  },

  mounted() {
    consultaArchivo().on("value", this.onDataChange);
  },

  beforeDestroy() {
    consultaArchivo().off("value", this.onDataChange);
  },

  methods: {
    onDataChange(items) {
      this.imagenURL = items.val().logoEmpresa
    },

    uploadCroppedImage() {
      this.myCroppa.generateBlob((blob) => {
        if (blob == null) {
          guardaRutaArchibo('', "logoEmpresa");
          store.commit('dialogoLogoEmpresa');
        } else {
          this.progress = true;
          const task = guardaArchivo(store.state.baseDatos.bd, blob, 'logoEmpresa');

          task.on('state_changed', snapshot => {
            let porcentaje = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.Uploadvalue = porcentaje;
          }, error => {
            console.error(error.message);
          }, () => {
            this.Uploadvalue = 100;
            task.snapshot.ref.getDownloadURL().then((url) => {
              console.log("Logo uploaded successfully");
              guardaRutaArchibo(url, "logoEmpresa");
              this.progress = false;
            })
          });
        }
      }, 'image/webp', 0.8);  // 80% compressed jpeg file
    }
  }
}
</script>
<style scoped>
.croppa-container:hover {
  opacity: 1;
  background-color: #efed8a;
}
</style>
