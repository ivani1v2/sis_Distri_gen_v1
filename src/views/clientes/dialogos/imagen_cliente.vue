<template>
    <v-dialog v-model="dialogImagen" max-width="500" persistent>
        <template v-slot:activator="{ on, attrs }">
            <v-btn v-if="modoActivador === 'icono'" icon v-bind="attrs" v-on="on"
                :color="tieneImagen ? 'primary' : 'grey'"
                :disabled="!imagenClienteHabilitado || (!clienteDoc && !modoPendiente)">
                <v-icon>mdi-camera</v-icon>
                <v-badge v-if="modoPendiente" color="orange" dot overlap offset-x="8" offset-y="8" />
            </v-btn>

            <v-btn v-else text class="px-2" v-bind="attrs" v-on="on"
                :disabled="!imagenClienteHabilitado || (!clienteDoc && !modoPendiente)">
                <div class="thumb-square mr-2">
                    <v-img v-if="previewUrl" :src="previewUrl" cover height="52" width="52" color="grey" />
                    <span v-else class="thumb-empty"><v-icon>mdi-camera-off</v-icon></span>
                </div>
                <span class="caption text-none">{{ textoActivador }}</span>
            </v-btn>
        </template>

        <v-card>
            <v-toolbar dark color="blue darken-2" flat dense>
                <v-icon left small>mdi-camera</v-icon>
                <v-toolbar-title class="text-subtitle-1 font-weight-bold">
                    {{ modoPendiente ? 'Imagen (se guardará al crear cliente)' : 'Imagen del Cliente' }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon dark @click="dialogImagen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-0">
                <transition name="fade" mode="out-in">
                    <div v-if="cargandoUrl" key="skeleton" class="text-center py-0">
                        <v-skeleton-loader class="mx-auto" type="image, card-heading" :boilerplate="false"
                            :loading="true"></v-skeleton-loader>
                        <div class="mt-3 grey--text">
                            <v-icon small>mdi-image</v-icon>
                            <span class="caption ml-1">Cargando imagen...</span>
                        </div>
                    </div>

                    <div v-else-if="previewUrl" key="image" class="text-center">
                        <v-img :src="previewUrl" contain max-height="450" class="rounded-lg"
                            transition="fade-transition" aspect-ratio="1">
                            <template v-slot:placeholder>
                                <v-row align="center" justify="center" class="fill-height">
                                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                </v-row>
                            </template>
                        </v-img>
                    </div>

                    <div v-else key="empty" class="text-center py-0 grey--text">
                        <v-icon size="80">mdi-image-off</v-icon>
                        <p class="mt-2">No hay imagen seleccionada</p>
                    </div>
                </transition>

                <input v-if="!soloLectura" ref="fileInput" type="file" accept="image/jpeg,image/png"
                    style="display: none;" @change="onFileSelected">
                <input v-if="!soloLectura" ref="cameraInput" type="file" accept="image/*" capture="environment"
                    style="display: none;" @change="onFileSelected">
            </v-card-text>

            <v-divider v-if="!soloLectura"></v-divider>

            <v-card-actions v-if="!soloLectura" class="justify-center">
                <v-btn color="teal" outlined @click="abrirCamara" x-small>
                    <v-icon left small>mdi-camera</v-icon>
                    Capturar
                </v-btn>
                <v-btn color="primary" outlined @click="abrirSelectorArchivo" x-small>
                    <v-icon left small>mdi-upload</v-icon>
                    Galeria
                </v-btn>

                <v-btn color="error" outlined @click="eliminarImagen" :loading="eliminando" x-small>
                    <v-icon left small>mdi-delete</v-icon> Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-dialog v-model="subiendo" persistent max-width="300">
            <v-card class="pa-6 text-center">
                <v-progress-circular indeterminate size="60" color="primary"></v-progress-circular>
                <div class="mt-3 text-subtitle-1">Procesando imagen...</div>
                <small class="grey--text">Comprimiendo y redimensionando</small>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import firebase from "firebase/app"
import "firebase/storage"
import store from '@/store/index'
import { crearOActualizarCliente } from '@/db_firestore'

export default {
    name: 'ImageUploaderCliente',
    props: {
        clienteDoc: {
            type: String,
            default: null
        },
        clienteId: {
            type: String,
            default: null
        },
        modoActivador: {
            type: String,
            default: 'miniatura'
        },
        modoPendiente: {
            type: Boolean,
            default: false
        },
        soloLectura: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialogImagen: false,
            subiendo: false,
            eliminando: false,
            cargandoUrl: false,
            imageUrl: null,
            previewUrl: null,
            previewBlob: null,
            previewSize: 0
        }
    },
    computed: {
        bd() {
            return store.state.baseDatos?.bd || ''
        },
        imagenClienteHabilitado() {
            return store.state.baseDatos?.imagen_cliente === true
        },
        tieneImagen() {
            return !!this.imageUrl || !!this.previewUrl
        },
        textoActivador() {
            if (this.modoPendiente && this.previewUrl) return 'Imagen pendiente'
            if (this.tieneImagen) return 'Ver imagen'
            return 'Subir imagen'
        },
        rutaStorage() {
            if (!this.clienteDoc) return null
            return `${this.bd}/clientes/imagenes/${this.clienteDoc}.jpg`
        }
    },
    watch: {
        dialogImagen(val) {
            if (val && this.clienteDoc && !this.modoPendiente) {
                this.cargarImagen()
            }
        },
        clienteId() {
            if (!this.modoPendiente) this.cargarImagen()
        },
        clienteDoc() {
            if (!this.modoPendiente) this.cargarImagen()
        }
    },
    mounted() {
        if (this.clienteId && !this.modoPendiente) this.cargarImagen()
    },
    methods: {
        async cargarImagen() {
            this.cargandoUrl = true
            this.previewUrl = null

            try {
                const { colClientes } = await import('@/db_firestore')
                const docSnap = await colClientes().doc(this.clienteId).get()
                const data = docSnap.data()

                if (data && data.imagen_url) {
                    this.imageUrl = data.imagen_url
                    setTimeout(() => {
                        this.previewUrl = data.imagen_url
                        this.cargandoUrl = false
                    }, 500)
                } else {
                    this.imageUrl = null
                    this.previewUrl = null
                    this.cargandoUrl = false
                }
            } catch (e) {
                console.error('Error cargando imagen:', e)
                this.imageUrl = null
                this.previewUrl = null
                this.cargandoUrl = false
            }
        },

        async comprimirYRedimensionar(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.readAsDataURL(file)
                reader.onload = (e) => {
                    const img = new Image()
                    img.src = e.target.result
                    img.onload = () => {
                        let width = img.width
                        let height = img.height
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

                        let quality = 0.7
                        let output = canvas.toDataURL('image/jpeg', quality)

                        const ajustarCalidad = (dataURL, targetSize = 70 * 1024) => {
                            let currentSize = Math.ceil(dataURL.length * 0.75)
                            if (currentSize <= targetSize || quality <= 0.1) {
                                return dataURL
                            }
                            quality = Math.max(0.1, quality * (targetSize / currentSize))
                            return canvas.toDataURL('image/jpeg', quality)
                        }

                        output = ajustarCalidad(output)
                        const blob = this.dataURLToBlob(output)

                        if (blob.size > 1024 * 1024) {
                            quality = Math.max(0.1, quality * 0.5)
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
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }
            return new Blob([u8arr], { type: mime })
        },

        abrirSelectorArchivo() {
            this.$refs.fileInput && this.$refs.fileInput.click()
        },

        onFileSelected(e) {
            const file = e.target.files[0]
            if (file && this.validarArchivo(file)) {
                this.procesarImagen(file)
            }
            e.target.value = ''
        },

        abrirCamara() {
            this.$refs.cameraInput && this.$refs.cameraInput.click()
        },

        validarArchivo(file) {
            if (!file.type.match(/image\/(jpeg|png)/)) {
                this.$toast?.error?.('Solo JPG o PNG')
                return false
            }
            if (file.size > 5 * 1024 * 1024) {
                this.$toast?.error?.('Máximo 5MB antes de comprimir')
                return false
            }
            return true
        },

        async procesarImagen(file) {
            this.subiendo = true
            try {
                const imagenComprimida = await this.comprimirYRedimensionar(file)

                if (imagenComprimida.size > 1024 * 1024) {
                    throw new Error('Imagen comprimida > 1MB')
                }

                if (this.modoPendiente) {
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = (e) => resolve(e.target.result)
                        reader.onerror = reject
                        reader.readAsDataURL(imagenComprimida)
                    })

                    this.previewUrl = dataUrl
                    this.previewBlob = imagenComprimida
                    this.previewSize = Math.round(imagenComprimida.size / 1024)
                    this.$toast?.success?.('Imagen lista para guardar')
                    this.dialogImagen = false
                } else {
                    if (this.imageUrl) {
                        try {
                            await firebase.storage().ref(this.rutaStorage).delete()
                        } catch (e) { }
                    }

                    const refStorage = firebase.storage().ref(this.rutaStorage)
                    await refStorage.put(imagenComprimida, { contentType: 'image/jpeg' })
                    const url = await refStorage.getDownloadURL()
                    this.imageUrl = url
                    this.previewUrl = url
                    this.previewBlob = null
                    this.previewSize = Math.round(imagenComprimida.size / 1024)

                    await crearOActualizarCliente(this.clienteId, {
                        imagen_url: url,
                        imagen_storage: this.rutaStorage
                    })

                    this.$toast?.success?.('Imagen subida')
                    this.dialogImagen = false
                }

            } catch (e) {
                console.error(e)
                this.$toast?.error?.('Error: ' + e.message)
            } finally {
                this.subiendo = false
            }
        },

        async eliminarImagen() {
            if (!confirm('¿Eliminar imagen?')) return

            this.eliminando = true
            try {
                if (this.modoPendiente) {
                    this.imageUrl = null
                    this.previewUrl = null
                    this.previewBlob = null
                    this.previewSize = 0
                    this.$toast?.success?.('Imagen eliminada')
                    return
                }

                await firebase.storage().ref(this.rutaStorage).delete()
                this.imageUrl = null
                this.previewUrl = null
                this.previewBlob = null
                this.previewSize = 0

                await crearOActualizarCliente(this.clienteId, {
                    imagen_url: null,
                    imagen_storage: null
                })

                this.$toast?.success?.('Imagen eliminada')
            } catch (e) {
                console.error(e)
                this.$toast?.error?.('Error al eliminar')
            } finally {
                this.eliminando = false
            }
        },

        getImagenPendiente() {
            return this.previewBlob
        },

        async guardarImagenPendiente(clienteDoc, clienteId) {
            if (!this.previewBlob || !clienteDoc) return null

            const ruta = `${this.bd}/clientes/imagenes/${clienteDoc}.jpg`
            const refStorage = firebase.storage().ref(ruta)
            await refStorage.put(this.previewBlob, { contentType: 'image/jpeg' })
            const url = await refStorage.getDownloadURL()

            await crearOActualizarCliente(clienteId, {
                imagen_url: url,
                imagen_storage: ruta
            })

            this.imageUrl = url
            this.previewUrl = url
            this.previewBlob = null
            return url
        }
    }
}
</script>

<style scoped>
.thumb-square {
    width: 42px;
    height: 42px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    border-radius: 6px;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.thumb-empty {
    display: inline-flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #616161;
    background: #f5f5f5;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>