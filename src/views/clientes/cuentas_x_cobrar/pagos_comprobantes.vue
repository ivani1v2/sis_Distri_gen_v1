<template>
  <div>
    <div class="mt-3">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="caption font-weight-bold">Comprobante de pago</span>
        <div>
          <v-btn x-small color="primary" outlined @click="subirComprobante" class="mr-1">
            <v-icon left x-small>mdi-upload</v-icon>
            Galería
          </v-btn>
          <v-btn x-small color="teal" outlined @click="tomarFoto">
            <v-icon left x-small>mdi-camera</v-icon>
            Tomar foto
          </v-btn>
        </div>
      </div>

      <div v-if="imagenPreview" class="text-center">
        <v-img :src="imagenPreview" max-height="120" contain class="rounded-lg" />
        <v-btn x-small color="error" text class="mt-1" @click="eliminarImagen">
          <v-icon x-small>mdi-delete</v-icon> Eliminar
        </v-btn>
      </div>
      <div v-else class="text-center pa-3 grey lighten-3 rounded-lg">
        <v-icon size="30">mdi-file-image-outline</v-icon>
        <p class="caption mb-0">Sin comprobante</p>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/jpg" style="display: none"
      @change="onFileSelected">
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" style="display: none"
      @change="onCameraSelected">
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/storage'
import moment from 'moment'
import store from '@/store'

export default {
  name: 'PagosComprobantes',
  props: {
    docRef: { type: String, required: true },
    cuotaId: { type: [String, Number], required: true }
  },
  data() {
    return {
      imagenBlob: null,
      imagenPreview: null,
      subiendo: false
    }
  },
  computed: {
    bd() {
      return store.state.baseDatos?.bd || 'empresa'
    },
    rutaStorage() {
      return `${this.bd}/pagos/${this.docRef}_cuota_${this.cuotaId}.jpg`
    }
  },
  watch: {
    cuotaId: {
      handler() {
        this.imagenBlob = null
        this.imagenPreview = null
      },
      immediate: true
    }
  },
  methods: {
    subirComprobante() {
      this.$refs.fileInput.click()
    },
    tomarFoto() {
      this.$refs.cameraInput.click()
    },
    async onFileSelected(e) {
      const file = e.target.files[0]
      if (file) await this.procesarImagen(file)
      e.target.value = ''
    },
    async onCameraSelected(e) {
      const file = e.target.files[0]
      if (file) await this.procesarImagen(file)
      e.target.value = ''
    },
    async procesarImagen(file) {
      if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        this.$toast?.error?.('Solo imágenes JPG, PNG')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        this.$toast?.error?.('Máximo 5MB antes de comprimir')
        return
      }

      this.subiendo = true
      try {
        const imagenComprimida = await this.comprimirYRedimensionar(file)
        this.imagenBlob = imagenComprimida
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagenPreview = e.target.result
          this.subiendo = false
          this.$toast?.success?.(`Imagen lista (${(imagenComprimida.size / 1024).toFixed(2)} KB)`)
        }
        reader.readAsDataURL(imagenComprimida)
      } catch (e) {
        this.subiendo = false
        this.$toast?.error?.('Error al comprimir')
      }
    },
    eliminarImagen() {
      this.imagenBlob = null
      this.imagenPreview = null
    },
    async comprimirYRedimensionar(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
          const img = new Image()
          img.src = e.target.result
          img.onload = () => {
            let width = img.width, height = img.height
            const maxSize = 800
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height * maxSize) / width
                width = maxSize
              } else {
                width = (width * maxSize) / height
                height = maxSize
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            let quality = 0.6
            let output = canvas.toDataURL('image/jpeg', quality)
            const ajustarCalidad = (dataURL, targetSize = 60 * 1024) => {
              let currentSize = Math.ceil(dataURL.length * 0.75)
              if (currentSize <= targetSize || quality <= 0.1) return dataURL
              quality = Math.max(0.1, quality * (targetSize / currentSize))
              return canvas.toDataURL('image/jpeg', quality)
            }
            output = ajustarCalidad(output)
            const blob = this.dataURLToBlob(output)
            if (blob.size > 70 * 1024) {
              quality = Math.max(0.1, quality * 0.7)
              output = canvas.toDataURL('image/jpeg', quality)
              resolve(this.dataURLToBlob(output))
            } else {
              resolve(blob)
            }
          }
          img.onerror = reject
        }
        reader.onerror = reject
      })
    },
    dataURLToBlob(dataURL) {
      const arr = dataURL.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) u8arr[n] = bstr.charCodeAt(n)
      return new Blob([u8arr], { type: mime })
    },
    async guardarImagen() {
      if (!this.imagenBlob) return null
      const storageRef = firebase.storage().ref(this.rutaStorage)
      await storageRef.put(this.imagenBlob)
      const url = await storageRef.getDownloadURL()
      return {
        url,
        rutaStorage: this.rutaStorage,
        fecha: moment().unix()
      }
    }
  }
}
</script>