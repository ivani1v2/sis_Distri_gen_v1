<template>
    <!-- ====================== DIALOGO CROP ====================== -->
    <v-dialog v-model="dial" max-width="720" persistent>
        <v-card class="rounded-xl">
            <v-toolbar flat color="white">
                <v-btn icon @click="cierre"><v-icon>mdi-close</v-icon></v-btn>
                <v-toolbar-title class="font-weight-black">Ajustar foto</v-toolbar-title>
                <v-spacer />
                <v-btn color="primary" rounded depressed @click="confirmarCrop">
                    <v-icon left>mdi-check</v-icon> Usar foto
                </v-btn>
            </v-toolbar>

            <v-card-text>
                <div class="crop-wrap">
                    <img ref="cropImg" :src="cropSrc" style="max-width:100%; display:block;" />
                </div>

                <div class="mt-4">
                    <div class="text-caption grey--text mb-1">Zoom</div>
                    <v-slider v-model="cropZoom" :min="1" :max="3" :step="0.01" hide-details @input="onZoomChange" />
                </div>

                <div class="d-flex justify-center mt-2">
                    <v-btn small class="mr-2" @click="rotar(-90)">
                        <v-icon left small>mdi-rotate-left</v-icon> Rotar
                    </v-btn>
                    <v-btn small @click="rotar(90)">
                        <v-icon left small>mdi-rotate-right</v-icon> Rotar
                    </v-btn>
                </div>

                <div class="text-caption grey--text mt-3">
                    Tip: arrastra la imagen para centrar. Usa el zoom para alejar/acercar (fondo blanco automático).
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

</template>

<script>
import Cropper from "cropperjs"
import "cropperjs/dist/cropper.css"
import { convertirADataUrl } from "../helpers"

export default {
    name: "dlgCrop",

    data() {
        return {
            dial: false,
            cropSrc: "",
            cropZoom: 1,
            _cropper: null,
            cropMeta: null,

        }
    },

    mounted() {

    },

    methods: {
        async abrirCropperConFile(file, meta) {
            this.cropMeta = meta
            this.cropZoom = 1

            // convertir a dataUrl para mostrar en <img>
            this.cropSrc = await convertirADataUrl(file)
            this.dial = true

            this.$nextTick(() => {
                // destruir si ya existía
                if (this._cropper) {
                    this._cropper.destroy()
                    this._cropper = null
                }

                const img = this.$refs.cropImg
                if (!img) return

                this._cropper = new Cropper(img, {
                    viewMode: 1,                // no se sale del contenedor
                    dragMode: "move",
                    aspectRatio: 1,             // cuadrado
                    autoCropArea: 1,            // ocupa todo el cuadro
                    background: true,
                    guides: false,
                    center: true,
                    responsive: true,
                    zoomOnWheel: true,
                })
            })
        },

        onZoomChange() {
            if (!this._cropper) return
            // zoom absoluto: 1..3 (simple y consistente)
            this._cropper.zoomTo(this.cropZoom)
        },

        rotar(grados) {
            if (!this._cropper) return
            this._cropper.rotate(grados)
        },

        cerrarCrop() {
            this.dial = false

            this.cropSrc = ""
            this.cropMeta = null
            this.cropZoom = 1
            if (this._cropper) {
                this._cropper.destroy()
                this._cropper = null
            }
        },

        async confirmarCrop() {
            if (!this._cropper) return

            // canvas final cuadrado con fondo blanco
            const canvas = this._cropper.getCroppedCanvas({
                width: 800,
                height: 800,
                fillColor: "#ffffff",
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "high",
            })

            // preview inmediato
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92)

            // convertir a File (para que tu flujo actual siga igual)
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
            const outFile = new File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" })

            const meta = this.cropMeta || {}
            this.$emit("confirmado", { file: outFile, preview: dataUrl, meta })
            this.cerrarCrop()

        },

        async aplicarFotoProcesadaEnTarjeta(file, tipo, id) {
            const tabla = tipo === "marca" ? "marcas" : tipo === "categoria" ? "categorias" : "productos"
            const arr = tabla === "marcas" ? this.marcas : tabla === "categorias" ? this.categorias : this.productos
            const actual = (arr || []).find(x => x.id === id) || {}

            const thumbB64 = await generarMiniaturaBase64(file, 220, 0.65)
            const { url, rutaStorage } = await this.subirImagenStorage(file, tipo, id)

            await guarda_datos_tienda(`${tabla}/${id}`, {
                ...actual,
                id,
                thumbB64,
                fotoUrl: url,
                rutaStorage,
                updatedAt: Date.now(),
            })

            const idx = (arr || []).findIndex(x => x.id === id)
            if (idx >= 0) {
                const nuevo = { ...arr[idx], thumbB64, fotoUrl: url, rutaStorage, updatedAt: Date.now() }
                if (tabla === "marcas") this.$set(this.marcas, idx, nuevo)
                if (tabla === "categorias") this.$set(this.categorias, idx, nuevo)
                if (tabla === "productos") this.$set(this.productos, idx, nuevo)
            }
        },

        cierre() {
            this.cerrarCrop()
            this.$emit("cerrar")
        }

    },
}
</script>
<style scoped>
.crop-wrap {
    width: 100%;
    height: 380px;
    background: #f5f5f5;
    border-radius: 12px;
    overflow: hidden;
}
</style>