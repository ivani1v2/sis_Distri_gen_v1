<template>
    <div class="pa-4 grey lighten-5">
        <!-- ====================== ACCESO A TIENDA (PRO) ====================== -->
        <v-card class="mb-3 rounded-lg tienda-banner" outlined>
            <v-card-text class="py-3 d-flex align-center flex-wrap">
                <v-avatar size="42" class="mr-3" color="primary" tile>
                    <v-icon dark>mdi-storefront</v-icon>
                </v-avatar>

                <div class="mr-4">
                    <div class="text-subtitle-1 font-weight-black">Visualizar mi tienda</div>
                    <div class="text-caption grey--text">
                        Revisa cómo la ven tus clientes en tiempo real.
                    </div>
                    <div class="text-caption font-weight-bold mt-1 primary--text">
                        https://tienda.domo.pe/
                    </div>
                </div>

                <v-spacer />

                <div class="d-flex align-center">
                    <v-btn color="primary" rounded depressed class="mr-2" @click="abrirTienda">
                        <v-icon left>mdi-open-in-new</v-icon>
                        Abrir tienda
                    </v-btn>

                    <v-btn icon color="grey darken-1" :title="'Copiar enlace'" @click="copiarLinkTienda">
                        <v-icon>mdi-content-copy</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <v-card>

            <v-btn color="primary" rounded depressed @click="dial_config = !dial_config">
                <v-icon left>mdi-cog</v-icon> Configura
            </v-btn>
        </v-card>
        <v-card elevation="2" class="rounded-lg">
            <v-tabs v-model="tab" background-color="white" color="primary" grow class="rounded-t-lg">
                <v-tab v-for="(item, i) in items" :key="i" class="font-weight-bold">
                    <v-icon left small>{{ getIcon(item) }}</v-icon> {{ item }}
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab" class="pa-4 grey lighten-5">
                <!-- ====================== MARCAS ====================== -->
                <v-tab-item>
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Marcas</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('marca')">
                                <v-icon left>mdi-plus</v-icon> Nueva Marca
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!marcas.length" type="info" dense text>
                            No hay marcas registradas.
                        </v-alert>


                        <draggable v-model="marcas" :animation="200" handle=".drag-handle" @end="alSoltarDragMarcas"
                            tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in marcas" :key="item.id" class="pa-2" style="width: 200px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorMarca(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('marca', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                    </v-card-text>

                                    <input :ref="'file_marca_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'marca', item.id)" />
                                </v-card>
                            </div>
                        </draggable>



                    </v-card>
                </v-tab-item>
                <!-- ====================== CATEGORIAS ====================== -->
                <v-tab-item>
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Categorías</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('categoria')">
                                <v-icon left>mdi-plus</v-icon> Nueva Categoría
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!categorias.length" type="info" dense text>
                            No hay categorías registradas.
                        </v-alert>

                        <draggable v-model="categorias" :animation="200" handle=".drag-handle"
                            @end="alSoltarDragCategorias" tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in categorias" :key="item.id" class="pa-2" style="width: 200px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorCategoria(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('categoria', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                    </v-card-text>

                                    <input :ref="'file_categoria_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'categoria', item.id)" />
                                </v-card>
                            </div>
                        </draggable>
                    </v-card>
                </v-tab-item>
                <!-- ====================== PRODUCTOS ====================== -->
                <v-tab-item>
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Productos</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('producto')">
                                <v-icon left>mdi-plus</v-icon> Nuevo Producto
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!productos.length" type="info" dense text>
                            No hay productos registrados.
                        </v-alert>

                        <draggable v-model="productos" :animation="200" handle=".drag-handle"
                            @end="alSoltarDragProductos" tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in productos" :key="item.id" class="pa-2" style="width: 220px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorProducto(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="editarProducto(item)">
                                                        <v-icon color="warning" small>mdi-pencil</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('producto', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                        <div class="text-caption grey--text">
                                            S/ {{ Number(item.precio || 0).toFixed(2) }}
                                        </div>
                                        <div class="text-caption grey--text text-truncate">
                                            {{ item.marca || 'Sin marca' }} • {{ item.categoria || 'Sin categoría' }}
                                        </div>

                                    </v-card-text>

                                    <input :ref="'file_producto_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'producto', item.id)" />
                                </v-card>
                            </div>
                        </draggable>
                    </v-card>
                </v-tab-item>

                <!-- (Luego puedes copiar el mismo patrón para categorias y productos) -->
            </v-tabs-items>
        </v-card>

        <!-- ====================== DIALOGO ====================== -->
        <v-dialog v-model="dlgAdd" max-width="450" transition="dialog-bottom-transition">
            <v-card class="rounded-xl">
                <v-toolbar flat color="white" class="px-2">
                    <v-btn icon @click="cerrarDialogo"><v-icon>mdi-close</v-icon></v-btn>
                    <v-toolbar-title class="font-weight-black">{{ tituloDialogo }}</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="pt-6">
                    <div class="text-center mb-6">
                        <v-hover v-slot="{ hover }">
                            <v-avatar size="120" color="grey lighten-4" class="elevation-2">
                                <v-img :src="previewDialogo || placeholderImg">
                                    <v-fade-transition>
                                        <div v-if="hover" class="d-flex align-center justify-center"
                                            style="height:100%; background: rgba(0,0,0,0.3); cursor:pointer"
                                            @click="$refs.fileCreate.click()">
                                            <v-icon color="white">mdi-camera-plus</v-icon>
                                        </div>
                                    </v-fade-transition>
                                </v-img>
                            </v-avatar>
                        </v-hover>
                        <div class="mt-2 text-caption grey--text">Sube una foto clara</div>
                        <input ref="fileCreate" type="file" accept="image/*" style="display:none"
                            @change="seleccionarFotoDialogo" />
                    </div>

                    <v-autocomplete v-if="tipoDialogo === 'marca'" v-model="formMarca.nombre" :items="array_marca"
                        label="Marca" outlined rounded dense clearable hide-details :search-input.sync="searchMarca" />

                    <v-autocomplete v-if="tipoDialogo === 'categoria'" v-model="formCategoria.nombre"
                        :items="arraycategoria" label="Categoría" outlined rounded dense clearable hide-details
                        :search-input.sync="searchCategoria" />


                    <template v-if="tipoDialogo === 'producto'">
                        <v-autocomplete v-model="productoSelId" :items="arrayProductos" item-text="nombre"
                            item-value="id" label="Buscar producto (catálogo)" outlined rounded dense clearable
                            hide-details :search-input.sync="searchProducto" @change="onSelectProductoCatalogo" />

                        <v-text-field class="mt-6" v-model="formProducto.nombre" label="Nombre del producto" outlined
                            rounded dense readonly />

                        <v-text-field class="mt-n3" v-model.number="formProducto.precio" label="Precio" type="number"
                            min="0" step="0.01" outlined rounded dense />
                        <v-autocomplete class="mt-n3" v-model="formProducto.marca" :items="array_marca" label="Marca"
                            outlined rounded dense clearable />

                        <v-autocomplete class="mt-n3" v-model="formProducto.categoria" :items="arraycategoria"
                            label="Categoría" outlined rounded dense clearable />


                    </template>

                </v-card-text>

                <v-card-actions class="pa-4 pt-0">
                    <v-btn block x-large color="primary" rounded depressed :disabled="deshabilitarGuardar"
                        @click="guardarItem">
                        Confirmar y Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_config v-if="dial_config" @cierra="dial_config = false" />

        <dial_crop ref="dlgCrop" @confirmado="onCropConfirmado" @cerrar="onCropCerrado" />

    </div>
</template>

<script>
import firebase from "firebase/app"
import "firebase/database"
import "firebase/storage"
import { obten_datos_tienda, guarda_datos_tienda, elimina_datos_tienda, allCategorias } from "../../db"
import { generarMiniaturaBase64, convertirADataUrl } from "./helpers"
import store from "@/store"
import draggable from "vuedraggable"
import dial_config from "./dialogos/config_tienda.vue"
import dial_crop from "./dialogos/dial_foto.vue"
export default {
    name: "caja",
    props: { dial_activo: "" },
    components: { draggable, dial_config, dial_crop },
    data() {
        return {
            dial_config: false,
            tab: 0,
            items: ["MARCAS", "CATEGORIAS", "PRODUCTOS"],

            marcas: [],
            categorias: [],
            productos: [],

            bd: store.state.baseDatos.bd,

            dlgAdd: false,
            tipoDialogo: "",

            formMarca: { nombre: "" },
            formCategoria: { nombre: "" },
            formProducto: { nombre: "", precio: 0, marca: "", categoria: "", idCatalogo: "" },



            previewDialogo: "",
            archivoDialogo: null,
            editMode: false,
            editId: "",
            placeholderImg:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
          <rect width='100%' height='100%' fill='#f2f2f2'/>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#999' font-family='Arial' font-size='16'>
            Sin foto
          </text>
        </svg>`),
            arraycategoria: [],
            array_marca: [],
            arrayProductos: [],
            searchMarca: null,
            searchCategoria: null,
            searchProducto: null,

            productoSelId: null,          // id del producto seleccionado del catálogo
            productoSelObj: null,         // objeto completo
        }

    },
    computed: {
        tituloDialogo() {
            if (this.tipoDialogo === "marca") return "Agregar Marca"
            if (this.tipoDialogo === "categoria") return "Agregar Categoría"
            if (this.tipoDialogo === "producto") return this.editMode ? "Editar Producto" : "Agregar Producto"
            return "Agregar"
        },

        deshabilitarGuardar() {
            if (this.tipoDialogo === "marca") return !this.formMarca.nombre.trim()
            if (this.tipoDialogo === "categoria") return !this.formCategoria.nombre.trim()
            if (this.tipoDialogo === "producto")
                return (
                    !this.formProducto.nombre.trim() ||
                    !(Number(this.formProducto.precio) > 0) ||
                    !this.formProducto.categoria ||
                    !this.formProducto.marca
                )


            return true
        },
    },
    mounted() {
        this.escucharTodo()
    },
    async created() {
        var snapshot = await allCategorias("categorias").once("value")
        snapshot.forEach((item) => {
            this.arraycategoria.push(item.val().nombre)
        })
        var snapshot = await allCategorias("marcas").once("value")
        snapshot.forEach((item) => {
            this.array_marca.push(item.val().nombre)
        })
        this.arrayProductos = store.state.productos

    },
    methods: {
        abrirTienda() {
            // abre en nueva pestaña
            window.open("https://tienda.domo.pe/", "_blank");
        },

        async copiarLinkTienda() {
            const link = "https://tienda.domo.pe/";
            try {
                await navigator.clipboard.writeText(link);
                if (this.$toast) this.$toast.success("Link copiado");
                else alert("Link copiado: " + link);
            } catch (e) {
                // fallback
                const el = document.createElement("textarea");
                el.value = link;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                alert("Link copiado: " + link);
            }
        },

        onSelectProductoCatalogo(id) {
            if (!id) {
                this.productoSelObj = null
                this.formProducto = { nombre: "", precio: 0, marca: "", categoria: "", idCatalogo: "" }
                return
            }

            const p = (this.arrayProductos || []).find(x => String(x.id) === String(id))
            if (!p) return

            this.productoSelObj = p

            this.formProducto.nombre = p.nombre || ""
            this.formProducto.precio = Number(p.precio || 0)

            // tus datos reales traen categoria como texto
            this.formProducto.categoria = p.categoria || ""

            // si en tu catálogo marca viene como "0" (id) y no nombre,
            // aquí puedes mapearlo si tienes tabla marcas, si no, lo dejas vacío.
            this.formProducto.marca = typeof p.marca === "string" ? p.marca : ""

            this.formProducto.idCatalogo = p.id
        },

        async aplicarFotoProcesadaEnTarjeta(file, tipo, id) {
            const tabla =
                tipo === "marca" ? "marcas" :
                    tipo === "categoria" ? "categorias" :
                        "productos"

            const arr =
                tabla === "marcas" ? this.marcas :
                    tabla === "categorias" ? this.categorias :
                        this.productos

            const actual = (arr || []).find(x => x && x.id === id) || {}

            // 1) borrar anterior (si existe)
            if (actual.rutaStorage) {
                await this.eliminarEnStoragePorRuta(actual.rutaStorage)
            }

            // 2) generar thumb + subir nueva
            const thumbB64 = await generarMiniaturaBase64(file, 220, 0.65)
            const { url, rutaStorage } = await this.subirImagenStorage(file, tipo, id)

            // 3) guardar en RTDB
            const nuevoRegistro = {
                ...actual,
                id,
                thumbB64,
                fotoUrl: url,
                rutaStorage,
                updatedAt: Date.now(),
            }

            await guarda_datos_tienda(`${tabla}/${id}`, nuevoRegistro)

            // 4) actualizar en memoria
            const idx = (arr || []).findIndex(x => x && x.id === id)
            if (idx >= 0) {
                if (tabla === "marcas") this.$set(this.marcas, idx, nuevoRegistro)
                if (tabla === "categorias") this.$set(this.categorias, idx, nuevoRegistro)
                if (tabla === "productos") this.$set(this.productos, idx, nuevoRegistro)
            }
        },

        async onCropConfirmado({ file, preview, meta }) {
            if (meta.modo === "dialogo") {
                this.archivoDialogo = file
                this.previewDialogo = preview
                return
            }

            if (meta.modo === "tarjeta") {
                await this.aplicarFotoProcesadaEnTarjeta(file, meta.tipo, meta.id)
            }
        },

        onCropCerrado() {
            // opcional: limpiar estados si quieres
        },

        editarProducto(item) {
            this.tipoDialogo = "producto"
            this.editMode = true
            this.editId = item.id

            this.formProducto = {
                nombre: item.nombre || "",
                precio: Number(item.precio || 0),
                marcaId: item.marcaId || "",
                categoriaId: item.categoriaId || "",
            }

            // si ya tiene foto, muéstrala de preview (no es obligatorio)
            this.previewDialogo = item.fotoUrl || item.thumbB64 || ""
            this.archivoDialogo = null // si elige otra foto, recién se setea

            this.dlgAdd = true
        },

        getIcon(tabName) {
            const icons = { MARCAS: "mdi-watermark", CATEGORIAS: "mdi-tag-multiple", PRODUCTOS: "mdi-package-variant" }
            return icons[tabName] || "mdi-help"
        },

        async escucharTodo() {
            const [snapM, snapC, snapP] = await Promise.all([
                obten_datos_tienda("marcas").once("value"),
                obten_datos_tienda("categorias").once("value"),
                obten_datos_tienda("productos").once("value"),
            ])

            const valM = snapM.val() || {}
            const valC = snapC.val() || {}
            const valP = snapP.val() || {}

            this.marcas = Object.values(valM).filter(x => x && x.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.categorias = Object.values(valC).filter(x => x && x.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.productos = Object.values(valP).filter(x => x && x.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))

        },

        // ---- selector (marcas) ----
        abrirSelectorMarca(id) {
            const refName = `file_marca_${id}`
            const input = this.$refs[refName]
            const el = Array.isArray(input) ? input[0] : input
            if (el) el.click()
        },

        // ---- dialogo ----
        abrirAgregar(tipo) {
            this.tipoDialogo = tipo
            this.editMode = false
            this.editId = ""

            if (tipo === "marca") this.formMarca = { nombre: "" }
            if (tipo === "categoria") this.formCategoria = { nombre: "" }
            if (tipo === "producto") this.formProducto = { nombre: "", precio: 0, marcaId: "", categoriaId: "" }

            this.previewDialogo = ""
            this.archivoDialogo = null
            this.dlgAdd = true
        },

        cerrarDialogo() {
            this.dlgAdd = false
            this.tipoDialogo = ""
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.editMode = false
            this.editId = ""
            if (this.$refs.fileCreate) this.$refs.fileCreate.value = ""
        },

        seleccionarFotoDialogo(e) {
            const file = e.target.files?.[0]
            if (!file) return

            this.$refs.dlgCrop.abrirCropperConFile(file, {
                modo: "dialogo"
            })

            e.target.value = ""
        },

        // ---- guardar ----
        generarId() {
            return "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
        },
        async guardarItem() {
            if (this.deshabilitarGuardar) return
            store.commit("dialogoprogress")

            try {
                const esMarca = this.tipoDialogo === "marca"
                const esCategoria = this.tipoDialogo === "categoria"
                const esProducto = this.tipoDialogo === "producto"

                const tabla = esMarca ? "marcas" : esCategoria ? "categorias" : esProducto ? "productos" : null
                if (!tabla) return

                // si es edición, no generes id nuevo
                const id = (this.editMode && esProducto) ? this.editId : this.generarId()

                const nombre = esMarca
                    ? this.formMarca.nombre.trim()
                    : esCategoria
                        ? this.formCategoria.nombre.trim()
                        : this.formProducto.nombre.trim()

                // orden:
                // - si edita: respeta el orden actual del producto
                // - si crea: pone al final
                let orden
                if (esMarca) orden = this.marcas.length + 1
                if (esCategoria) orden = this.categorias.length + 1
                if (esProducto) {
                    if (this.editMode) {
                        const actual = (this.productos || []).find(x => x.id === id)
                        orden = actual?.orden || 1
                    } else {
                        orden = this.productos.length + 1
                    }
                }
                // base item
                let item

                if (this.editMode && esProducto) {
                    // 1) si edita, parte del existente para NO borrar foto ni otros campos
                    const actual = (this.productos || []).find(x => x.id === id) || {}

                    item = {
                        ...actual,
                        id,
                        nombre,
                        orden,
                        updatedAt: Date.now(),
                        precio: Number(this.formProducto.precio || 0),
                        marcaId: this.formProducto.marcaId || "",
                        categoriaId: this.formProducto.categoriaId || "",
                    }

                    // 2) SOLO si cambió foto, actualizas thumb/fotoUrl/rutaStorage
                    if (this.archivoDialogo) {
                        // 1) borrar anterior (si existía)
                        if (item.rutaStorage) {
                            await this.eliminarEnStoragePorRuta(item.rutaStorage)
                        }

                        // 2) subir nueva
                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, "producto", id)

                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }


                } else {
                    // CREAR NUEVO (marca/categoria/producto)
                    item = {
                        id,
                        nombre,
                        orden,
                        thumbB64: "",
                        fotoUrl: "",
                        updatedAt: Date.now(),
                    }

                    if (esProducto) {
                        item.precio = Number(this.formProducto.precio || 0)
                        item.marca = this.formProducto.marca || ""
                        item.categoria = this.formProducto.categoria || ""
                        item.idCatalogo = this.formProducto.idCatalogo || ""

                    }

                    if (this.archivoDialogo) {
                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const tipoStorage = esMarca ? "marca" : esCategoria ? "categoria" : "producto"
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, tipoStorage, id)
                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }
                }


                await guarda_datos_tienda(`${tabla}/${id}`, item)

                // actualizar arrays en memoria
                if (tabla === "marcas") {
                    this.marcas.unshift(item)
                } else if (tabla === "categorias") {
                    this.categorias.unshift(item)
                } else if (tabla === "productos") {
                    if (this.editMode) {
                        const idx = (this.productos || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.productos, idx, item)
                    } else {
                        this.productos.unshift(item)
                    }
                }

                this.cerrarDialogo()
            } catch (e) {
                console.error("❌ Error guardando:", e)
            } finally {
                store.commit("dialogoprogress")
            }
        },

        seleccionarFoto(e, tipo, id) {
            const file = e.target.files?.[0]
            if (!file) return

            this.$refs.dlgCrop.abrirCropperConFile(file, {
                modo: "tarjeta",
                tipo,
                id
            })

            e.target.value = ""
        },


        abrirSelectorProducto(id) {
            const refName = `file_producto_${id}`
            const input = this.$refs[refName]
            const el = Array.isArray(input) ? input[0] : input
            if (el) el.click()
        },


        async eliminarItem(tipo, id) {
            try {
                const ok = confirm("¿Seguro de eliminar este registro? Esta acción no se puede deshacer.")
                if (!ok) return

                const tabla =
                    tipo === "marca" ? "marcas" :
                        tipo === "categoria" ? "categorias" :
                            tipo === "producto" ? "productos" : null

                if (!tabla) return

                // 1) Obtener el registro actual para saber rutaStorage
                const bd = store.state.baseDatos.bd
                const snap = await firebase.database().ref(bd).child(`tienda/${tabla}/${id}`).once("value")
                const actual = snap.val() || {}

                // 2) Borrar foto en Storage
                // Opción A: borrar solo el archivo exacto (si guardaste rutaStorage)
                if (actual.rutaStorage) {
                    await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                } else {
                    // Opción B: borrar toda la carpeta por si hubo varias fotos (más seguro)
                    // tienda/{bd}/{tipo}/{id}/
                    const prefix = `tienda/${this.bd}/${tipo}/${id}`
                    await this.eliminarCarpetaStorage(prefix)
                }

                // 3) Borrar el registro en RTDB
                await elimina_datos_tienda(tabla, id)

                // 4) Actualizar arrays + reordenar (tu lógica igual)
                if (tabla === "marcas") {
                    this.marcas = (this.marcas || []).filter(x => x && x.id !== id)
                    this.marcas = this.marcas.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.marcas.forEach(m => (updates[`marcas/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "categorias") {
                    this.categorias = (this.categorias || []).filter(x => x && x.id !== id)
                    this.categorias = this.categorias.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.categorias.forEach(m => (updates[`categorias/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "productos") {
                    this.productos = (this.productos || []).filter(x => x && x.id !== id)
                    this.productos = this.productos.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.productos.forEach(m => (updates[`productos/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                console.log("✅ Eliminado (BD + Storage):", tabla, id)
            } catch (e) {
                console.error("❌ Error al eliminar:", e)
            }
        },


        async eliminarEnStoragePorRuta(rutaStorage) {
            try {
                if (!rutaStorage) return
                await firebase.storage().ref(rutaStorage).delete()
            } catch (e) {
                // Si no existe o no hay permisos, no rompas el flujo
                console.warn("⚠️ No se pudo borrar en Storage:", e?.message || e)
            }
        },

        async eliminarCarpetaStorage(prefix) {
            // Borra todo lo que haya dentro del "folder" (Firebase no borra carpetas, borra archivos)
            try {
                if (!prefix) return
                const ref = firebase.storage().ref(prefix)
                const res = await ref.listAll()

                // borra archivos
                await Promise.all(res.items.map(item => item.delete()))

                // si hay subcarpetas, borrar recursivo
                await Promise.all(res.prefixes.map(p => this.eliminarCarpetaStorage(p.fullPath)))
            } catch (e) {
                console.warn("⚠️ No se pudo borrar carpeta en Storage:", e?.message || e)
            }
        },



        async subirImagenStorage(file, tipo, id) {
            const extension = (file.name.split(".").pop() || "jpg").toLowerCase()
            const nombreArchivo = `${Date.now()}_${id}.${extension}`
            const rutaStorage = `tienda/${this.bd}/${tipo}/${id}/${nombreArchivo}`

            const refStorage = firebase.storage().ref(rutaStorage)
            await refStorage.put(file, { contentType: file.type || "image/jpeg" })
            const url = await refStorage.getDownloadURL()
            return { url, rutaStorage }
        },
        async alSoltarDragMarcas() {
            try {
                const bd = store.state.baseDatos.bd

                // 1) re-calcula orden en memoria (para que el chip cambie al toque)
                this.marcas = this.marcas.map((m, i) => ({ ...m, orden: i + 1 }))

                // 2) update masivo (rutas RELATIVAS a /{bd}/tienda)
                const updates = {}
                this.marcas.forEach(m => {
                    updates[`marcas/${m.id}/orden`] = m.orden
                })

                // 3) aplica el update en /{bd}/tienda
                await firebase.database().ref(bd).child("tienda").update(updates)

                console.log("✅ Orden guardado", this.marcas.map(x => ({ id: x.id, orden: x.orden })))
            } catch (e) {
                console.error("❌ Error guardando orden:", e)
            }
        },
        async alSoltarDragCategorias() {
            try {
                const bd = store.state.baseDatos.bd

                this.categorias = this.categorias.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.categorias.forEach(m => {
                    updates[`categorias/${m.id}/orden`] = m.orden
                })

                await firebase.database().ref(bd).child("tienda").update(updates)

                console.log("✅ Orden categorías guardado", this.categorias.map(x => ({ id: x.id, orden: x.orden })))
            } catch (e) {
                console.error("❌ Error guardando orden categorías:", e)
            }
        },
        async alSoltarDragProductos() {
            try {
                const bd = store.state.baseDatos.bd
                this.productos = this.productos.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.productos.forEach(m => (updates[`productos/${m.id}/orden`] = m.orden))

                await firebase.database().ref(bd).child("tienda").update(updates)
                console.log("✅ Orden productos guardado")
            } catch (e) {
                console.error("❌ Error guardando orden productos:", e)
            }
        },

        nombreMarca(id) {
            const m = (this.marcas || []).find(x => x.id === id)
            return m ? m.nombre : "Sin marca"
        },
        nombreCategoria(id) {
            const c = (this.categorias || []).find(x => x.id === id)
            return c ? c.nombre : "Sin categoría"
        },


    },
}
</script>

<style scoped>
.card-item {
    transition: 0.2s;
}

.drag-ghost {
    opacity: 0.15;
}

.drag-chosen {
    opacity: 0.9;
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}
.tienda-banner {
  border: 1px solid #e8eefc !important;
  background: linear-gradient(90deg, rgba(30,58,138,0.08) 0%, rgba(255,255,255,1) 60%);
}

</style>
