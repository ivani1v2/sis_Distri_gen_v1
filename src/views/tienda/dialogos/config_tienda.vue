<template>
    <v-dialog v-model="dial" class="mx-auto" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierre">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card outlined class="rounded-lg">
            <v-card-title class="font-weight-bold">
                Configuracion de pedidos
            </v-card-title>

            <v-divider />

            <v-card-text class="mt-6">
                <v-text-field v-model.number="pedidoMinimo" label="Monto minimo de pedido" prefix="S/ " type="number"
                    outlined dense min="0" hint="El pedido no podra registrarse si no supera este monto"
                    persistent-hint />

                <v-text-field v-model="ultimaSincronizacion" class="mt-4" label="Ultima sincronizacion"
                    type="datetime-local" prepend-inner-icon="mdi-clock-outline" outlined dense
                    hint="Solo se enviaran registros modificados despues de esta fecha. Si lo dejas vacio, se enviara todo."
                    persistent-hint />

                <v-text-field v-model="telefonoWhatsapp" class="mt-4" label="Telefono de WhatsApp" type="tel"
                    prepend-inner-icon="mdi-whatsapp" outlined dense
                    hint="Numero al que se dirigiran los clientes cuando tengan dudas" persistent-hint />

                <v-autocomplete v-model="comprobantesPermitidos" class="mt-4" :items="itemsComprobantes"
                    item-text="label" item-value="value" label="Comprobantes permitidos" multiple chips deletable-chips
                    outlined dense hint="Selecciona que tipos de comprobante aceptara la tienda" persistent-hint />

                <v-row class="mt-4">
                    <v-col cols="6">
                        <v-text-field v-model="serie" label="Serie" type="text" prepend-inner-icon="mdi-counter"
                            outlined dense hint="Numero de serie para pedidos" persistent-hint />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field :value="moneda" label="Moneda" type="text" :disabled="true"
                            prepend-inner-icon="mdi-check" outlined dense persistent-hint />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn class="mr-2" color="info" outlined :disabled="guardando || guardandoSincronizando"
                    @click="abrirDialogoIcono">
                    Icono de tienda
                </v-btn>
                <v-btn class="mr-2" color="secondary" outlined :loading="guardandoSincronizando"
                    @click="guardarYSincronizarTodo">
                    Sincronizar todo
                </v-btn>
                <v-btn color="primary" :loading="guardando" @click="guardar">
                    Guardar cambios
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-dialog v-model="dialIcono" max-width="760" persistent>
            <v-card class="rounded-lg">
                <v-card-title class="font-weight-bold d-flex align-center">
                    <span>Icono de tienda</span>
                    <v-spacer />
                    <v-btn icon @click="cerrarDialogoIcono">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-divider />

                <v-card-text class="pt-5">
                    <div class="text-caption grey--text mb-4">
                        La imagen se ajustara al centro y se generaran dos iconos PNG listos para PWA: 192x192 y
                        512x512.
                    </div>

                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-card outlined class="pa-4 fill-height">
                                <div class="text-subtitle-2 font-weight-bold mb-3">Imagen seleccionada</div>

                                <div class="d-flex flex-column align-center justify-center icono-dropzone rounded-lg pa-4">
                                    <v-avatar size="120" tile class="rounded-lg elevation-1 grey lighten-4">
                                        <v-img v-if="previewOriginal" :src="previewOriginal" contain />
                                        <div v-else class="d-flex align-center justify-center fill-height">
                                            <v-icon color="grey">mdi-image-outline</v-icon>
                                        </div>
                                    </v-avatar>

                                    <v-btn class="mt-4" color="primary" small depressed @click="$refs.fileIcono.click()">
                                        <v-icon left small>mdi-upload</v-icon>
                                        Seleccionar imagen
                                    </v-btn>

                                    <input ref="fileIcono" type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                                        style="display:none" @change="seleccionarIcono" />
                                </div>

                                <div class="mt-4 text-caption">
                                    <div><strong>Dimensiones reales:</strong> {{ dimensionesOriginalTexto }}</div>
                                    <div><strong>Tamaño:</strong> {{ pesoOriginalTexto }}</div>
                                    <div><strong>Formato:</strong> {{ tipoOriginalTexto }}</div>
                                </div>

                                <v-alert v-if="mensajeIcono" :type="tipoMensajeIcono" dense outlined class="mt-4 mb-0">
                                    {{ mensajeIcono }}
                                </v-alert>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-card outlined class="pa-4 fill-height">
                                <div class="text-subtitle-2 font-weight-bold mb-3">Vista previa PWA</div>

                                <div class="d-flex flex-wrap justify-space-around">
                                    <div class="text-center mb-3">
                                        <v-avatar size="72" tile class="rounded-xl elevation-1 grey lighten-4">
                                            <v-img v-if="preview180" :src="preview180" contain />
                                            <div v-else class="d-flex align-center justify-center fill-height">
                                                <v-icon color="grey">mdi-apple</v-icon>
                                            </div>
                                        </v-avatar>
                                        <div class="text-caption mt-2">180 iOS</div>
                                    </div>

                                    <div class="text-center mb-3">
                                        <v-avatar size="64" tile class="rounded-xl elevation-1 grey lighten-4">
                                            <v-img v-if="preview192" :src="preview192" contain />
                                            <div v-else class="d-flex align-center justify-center fill-height">
                                                <v-icon color="grey">mdi-cellphone</v-icon>
                                            </div>
                                        </v-avatar>
                                        <div class="text-caption mt-2">192 x 192</div>
                                    </div>

                                    <div class="text-center mb-3">
                                        <v-avatar size="104" tile class="rounded-xl elevation-1 grey lighten-4">
                                            <v-img v-if="preview512" :src="preview512" contain />
                                            <div v-else class="d-flex align-center justify-center fill-height">
                                                <v-icon color="grey">mdi-monitor-cellphone</v-icon>
                                            </div>
                                        </v-avatar>
                                        <div class="text-caption mt-2">512 x 512</div>
                                    </div>

                                    <div class="text-center mb-3">
                                        <v-avatar size="104" tile class="rounded-xl elevation-1 grey lighten-4">
                                            <v-img v-if="preview512maskable" :src="preview512maskable" contain />
                                            <div v-else class="d-flex align-center justify-center fill-height">
                                                <v-icon color="grey">mdi-shield-star-outline</v-icon>
                                            </div>
                                        </v-avatar>
                                        <div class="text-caption mt-2">512 maskable</div>
                                    </div>
                                </div>

                                <v-divider class="my-4" />

                                <div class="text-caption">
                                    <div><strong>URL 180 actual:</strong></div>
                                    <div class="grey--text text-truncate">{{ icono180 || "-" }}</div>
                                </div>
                                <div class="text-caption mt-3">
                                    <div><strong>URL 192 actual:</strong></div>
                                    <div class="grey--text text-truncate">{{ icono192 || "-" }}</div>
                                </div>
                                <div class="text-caption mt-3">
                                    <div><strong>URL 512 actual:</strong></div>
                                    <div class="grey--text text-truncate">{{ icono512 || "-" }}</div>
                                </div>
                                <div class="text-caption mt-3">
                                    <div><strong>URL 512 maskable actual:</strong></div>
                                    <div class="grey--text text-truncate">{{ icono512maskable || "-" }}</div>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-card-actions class="px-6 pb-5">
                    <v-spacer />
                    <v-btn text color="grey darken-1" :disabled="guardandoIcono" @click="cerrarDialogoIcono">
                        Cerrar
                    </v-btn>
                    <v-btn color="primary" depressed :loading="guardandoIcono" :disabled="!archivoIcono"
                        @click="guardarIconoTienda">
                        Guardar icono
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import firebase from "firebase/app"
import "firebase/database"
import "firebase/storage"
import store from "@/store"
import { generarIconoMaskable, generarIconoPwa } from "../helpers"

export default {
    name: "ConfiguracionPedido",

    data() {
        return {
            dial: false,
            pedidoMinimo: 0,
            ultimaSincronizacion: "",
            telefonoWhatsapp: "",
            comprobantesPermitidos: ["B", "F", "T"],
            serie: "APP",
            moneda: "",
            icono180: "",
            icono192: "",
            icono512: "",
            icono512maskable: "",
            itemsComprobantes: [
                { label: "Boleta (B)", value: "B" },
                { label: "Factura (F)", value: "F" },
                { label: "Nota de venta (T)", value: "T" },
            ],
            guardando: false,
            guardandoSincronizando: false,
            dialIcono: false,
            guardandoIcono: false,
            archivoIcono: null,
            previewOriginal: "",
            preview180: "",
            preview192: "",
            preview512: "",
            preview512maskable: "",
            metaOriginal: null,
            mensajeIcono: "",
            tipoMensajeIcono: "info",
        }
    },
    created() {
        this.dial = true
    },
    mounted() {
        this.moneda = this.monedaSimbolo
        this.cargarConfiguracion()
    },
    computed: {
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || "S/ "
        },
        dimensionesOriginalTexto() {
            if (!this.metaOriginal) return "-"
            return `${this.metaOriginal.width} x ${this.metaOriginal.height}`
        },
        pesoOriginalTexto() {
            if (!this.metaOriginal?.size) return "-"
            const kb = Number(this.metaOriginal.size || 0) / 1024
            return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`
        },
        tipoOriginalTexto() {
            return this.metaOriginal?.type || "-"
        },
    },
    methods: {
        obtenerPayloadConfiguracion() {
            return {
                pedido_minimo: Number(this.pedidoMinimo) || 0,
                ultima_sincronizacion: this.parsearDatetimeLocal(this.ultimaSincronizacion),
                telefono_whatsapp: String(this.telefonoWhatsapp || "").trim(),
                comprobantes_permitidos: Array.isArray(this.comprobantesPermitidos)
                    ? this.comprobantesPermitidos.filter(Boolean)
                    : [],
                serie: String(this.serie || "APP").trim(),
                moneda: String(this.moneda || this.monedaSimbolo).trim(),
                icono180: String(this.icono180 || "").trim(),
                icono192: String(this.icono192 || "").trim(),
                icono512: String(this.icono512 || "").trim(),
                icono512maskable: String(this.icono512maskable || "").trim(),
                updatedAt: Date.now(),
            }
        },
        refConfig() {
            return firebase
                .database()
                .ref(store.state.baseDatos.bd)
                .child("tienda")
                .child("configuracion")
        },

        async cargarConfiguracion() {
            const snap = await this.refConfig().once("value")
            const data = snap.val() || {}
            this.pedidoMinimo = data.pedido_minimo || 0
            this.ultimaSincronizacion = this.formatearDatetimeLocal(data.ultima_sincronizacion)
            this.telefonoWhatsapp = data.telefono_whatsapp || ""
            this.comprobantesPermitidos = Array.isArray(data.comprobantes_permitidos) && data.comprobantes_permitidos.length
                ? data.comprobantes_permitidos
                : ["B", "F", "T"]
            this.serie = data.serie || "APP"
            this.moneda = data.moneda || this.monedaSimbolo
            this.icono180 = data.icono180 || ""
            this.icono192 = data.icono192 || ""
            this.icono512 = data.icono512 || ""
            this.icono512maskable = data.icono512maskable || ""
            this.cargarPreviewsGuardados()
        },

        async guardarConfiguracion() {
            const payload = this.obtenerPayloadConfiguracion()
            await this.refConfig().update(payload)
            return payload
        },
        async leerMetaDesdeUrl(url) {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        size: 0,
                        type: "image/png",
                    })
                }
                img.onerror = () => reject(new Error("No se pudo cargar la vista previa guardada"))
                img.src = url
            })
        },
        async leerMetaImagen(file) {
            return new Promise((resolve, reject) => {
                const url = URL.createObjectURL(file)
                const img = new Image()
                img.onload = () => {
                    const meta = {
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        size: Number(file.size || 0),
                        type: file.type || "image/*",
                    }
                    URL.revokeObjectURL(url)
                    resolve(meta)
                }
                img.onerror = () => {
                    URL.revokeObjectURL(url)
                    reject(new Error("No se pudo leer la imagen"))
                }
                img.src = url
            })
        },
        limpiarPreviewOriginal() {
            if (this.previewOriginal && String(this.previewOriginal).startsWith("blob:")) {
                URL.revokeObjectURL(this.previewOriginal)
            }
            this.previewOriginal = ""
        },
        async cargarPreviewsGuardados() {
            this.limpiarPreviewOriginal()
            this.preview180 = this.icono180 || ""
            this.preview192 = this.icono192 || ""
            this.preview512 = this.icono512 || ""
            this.preview512maskable = this.icono512maskable || ""
            this.previewOriginal = this.icono512 || this.icono512maskable || this.icono192 || this.icono180 || ""
            this.archivoIcono = null

            if (!this.previewOriginal) {
                this.metaOriginal = null
                this.mensajeIcono = ""
                this.tipoMensajeIcono = "info"
                return
            }

            try {
                this.metaOriginal = await this.leerMetaDesdeUrl(this.previewOriginal)
                this.mensajeIcono = "Mostrando iconos PWA ya guardados."
                this.tipoMensajeIcono = "info"
            } catch (error) {
                this.metaOriginal = null
                this.mensajeIcono = "Los iconos estan guardados, pero no se pudo cargar su vista previa."
                this.tipoMensajeIcono = "warning"
            }
        },
        abrirDialogoIcono() {
            this.dialIcono = true
            this.cargarPreviewsGuardados()
        },
        async seleccionarIcono(e) {
            const file = e.target.files?.[0]
            if (!file) {
                e.target.value = ""
                return
            }

            this.archivoIcono = null
            this.preview180 = ""
            this.preview192 = ""
            this.preview512 = ""
            this.preview512maskable = ""
            this.mensajeIcono = ""
            this.tipoMensajeIcono = "info"
            this.limpiarPreviewOriginal()

            try {
                this.metaOriginal = await this.leerMetaImagen(file)
                this.previewOriginal = URL.createObjectURL(file)

                const icono192 = await generarIconoPwa(file, 192)
                const icono180 = await generarIconoPwa(file, 180)
                const icono512 = await generarIconoPwa(file, 512)
                const icono512maskable = await generarIconoMaskable(file, 512)

                this.archivoIcono = file
                this.preview180 = icono180.dataUrl
                this.preview192 = icono192.dataUrl
                this.preview512 = icono512.dataUrl
                this.preview512maskable = icono512maskable.dataUrl
                this.mensajeIcono = this.metaOriginal.width < 512 || this.metaOriginal.height < 512
                    ? "La imagen original es menor a 512 px en alguno de sus lados. Se generara igual, pero lo ideal es usar una imagen mayor."
                    : "La imagen esta lista para generar los iconos PWA."
                this.tipoMensajeIcono = this.metaOriginal.width < 512 || this.metaOriginal.height < 512 ? "warning" : "success"
            } catch (error) {
                this.archivoIcono = null
                this.preview180 = ""
                this.preview192 = ""
                this.preview512 = ""
                this.preview512maskable = ""
                this.mensajeIcono = error.message || "No se pudo preparar el icono"
                this.tipoMensajeIcono = "error"
            } finally {
                e.target.value = ""
            }
        },
        rutaStorageIcono(size) {
            return `tienda/${store.state.baseDatos.bd}/branding/icono-${size}.png`
        },
        rutaStorageIconoMaskable() {
            return `tienda/${store.state.baseDatos.bd}/branding/icono-512-maskable.png`
        },
        async subirIconoStorage(file, size) {
            const icono = await generarIconoPwa(file, size)
            const rutaStorage = this.rutaStorageIcono(size)
            const ref = firebase.storage().ref(rutaStorage)
            await ref.put(icono.file, {
                contentType: "image/png",
                cacheControl: "public,max-age=3600",
            })
            const url = await ref.getDownloadURL()
            return { url, rutaStorage }
        },
        async subirIconoStorageMaskable(file) {
            const icono = await generarIconoMaskable(file, 512)
            const rutaStorage = this.rutaStorageIconoMaskable()
            const ref = firebase.storage().ref(rutaStorage)
            await ref.put(icono.file, {
                contentType: "image/png",
                cacheControl: "public,max-age=3600",
            })
            const url = await ref.getDownloadURL()
            return { url, rutaStorage }
        },
        async guardarIconoTienda() {
            if (!this.archivoIcono) return

            try {
                this.guardandoIcono = true
                store.commit("dialogoprogress")

                const [{ url: icono180 }, { url: icono192 }, { url: icono512 }, { url: icono512maskable }] = await Promise.all([
                    this.subirIconoStorage(this.archivoIcono, 180),
                    this.subirIconoStorage(this.archivoIcono, 192),
                    this.subirIconoStorage(this.archivoIcono, 512),
                    this.subirIconoStorageMaskable(this.archivoIcono),
                ])

                this.icono180 = icono180
                this.icono192 = icono192
                this.icono512 = icono512
                this.icono512maskable = icono512maskable
                this.preview180 = icono180
                this.preview192 = icono192
                this.preview512 = icono512
                this.preview512maskable = icono512maskable
                this.previewOriginal = icono512 || icono512maskable || icono192 || icono180

                const payload = {
                    icono180,
                    icono192,
                    icono512,
                    icono512maskable,
                    updatedAt: Date.now(),
                }

                await this.refConfig().update(payload)
                this.$emit("guardado", payload)
                this.metaOriginal = await this.leerMetaDesdeUrl(this.previewOriginal)
                this.mensajeIcono = "Iconos PWA guardados correctamente."
                this.tipoMensajeIcono = "success"
            } catch (error) {
                console.error("Error guardando icono de tienda", error)
                this.mensajeIcono = error.message || "No se pudo guardar el icono"
                this.tipoMensajeIcono = "error"
            } finally {
                this.guardandoIcono = false
                store.commit("dialogoprogress")
            }
        },
        cerrarDialogoIcono() {
            this.dialIcono = false
        },
        async guardar() {
            try {
                this.guardando = true
                store.commit("dialogoprogress")
                const payload = await this.guardarConfiguracion()
                this.$emit("guardado", payload)
                store.commit("dialogoprogress")
                this.cierre()
            } catch (e) {
                console.error("Error guardando configuracion", e)
            } finally {
                this.guardando = false
            }
        },
        async guardarYSincronizarTodo() {
            try {
                this.guardandoSincronizando = true
                store.commit("dialogoprogress")
                const payload = await this.guardarConfiguracion()
                this.$emit("guardado", payload)
                this.$emit("sincronizar-todo", payload)
                store.commit("dialogoprogress")
                this.cierre()
            } catch (e) {
                console.error("Error guardando y sincronizando todo", e)
            } finally {
                this.guardandoSincronizando = false
            }
        },
        formatearDatetimeLocal(valor) {
            const ts = Number(valor || 0)
            if (!ts) return ""

            const fecha = new Date(ts)
            if (Number.isNaN(fecha.getTime())) return ""

            const pad = (n) => String(n).padStart(2, "0")
            return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
        },
        parsearDatetimeLocal(valor) {
            if (!valor) return 0
            const fecha = new Date(valor)
            const ts = fecha.getTime()
            return Number.isNaN(ts) ? 0 : ts
        },
        cierre() {
            this.limpiarPreviewOriginal()
            this.$emit("cerrar")
            this.dial = false
        },
    },
}
</script>

<style scoped>
.icono-dropzone {
    min-height: 240px;
    border: 1px dashed #90caf9;
    background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
}
</style>
