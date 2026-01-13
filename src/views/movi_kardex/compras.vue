<template>
    <v-dialog v-model="ui.main" max-width="1100px" persistent>
        <v-card class="rounded-lg">
            <v-toolbar color="blue-grey darken-3" dense dark>
                <v-icon @click="emitCerrar">mdi-close</v-icon>
                <v-toolbar-title class="ml-2 font-weight-bold">
                    Registro de Compras
                </v-toolbar-title>
                <v-spacer></v-spacer>

                <v-btn icon color="info" @click="ui.productos = true" title="Buscar y Añadir Producto">
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-divider vertical class="mx-2"></v-divider>
                <v-btn icon color="red lighten-1" @click="ui.confirmaAnulacion = true" title="Anular Compra">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn icon color="success" @click="ui.confirmaGrabar = true" title="Guardar Cambios">
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">

                <v-row dense class="mb-3">
                    <v-col cols="12" md="6">
                        <v-card outlined class="pa-3">
                            <div class="d-flex align-center justify-space-between mb-2">
                                <h4 class="text-subtitle-1 primary--text">
                                    <v-icon small left>mdi-file-document-outline</v-icon>
                                    Documento: {{ cabecera.tipodocumento }} ({{ cabecera.sreferencia }}-{{
                                    cabecera.creferencia }})
                                </h4>
                                <v-btn x-small color="warning" @click="abreEditarCabecera">
                                    <v-icon x-small left>mdi-pencil</v-icon> Editar Cabecera
                                </v-btn>
                            </div>
                            <v-divider class="mb-2"></v-divider>
                            <h5 class="text-caption">
                                **PROVEEDOR:** {{ cabecera.nom_proveedor || 'N/A' }} ({{ cabecera.num_doc || 'N/A' }})
                            </h5>
                            <h5 class="text-caption">
                                **EMISIÓN:** {{ fmtFecha(cabecera.fecha_emision) }} | **INGRESO:** {{
                                fmtFecha(cabecera.fecha_ingreso) }}
                            </h5>
                            <h5 class="text-caption">
                                **OBSERVACIÓN:** {{ cabecera.observacion }}
                            </h5>
                            <h5 class="text-caption">
                                **PAGO:** {{ cabecera.modo_pago }}
                            </h5>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-card outlined class="pa-3 fill-height d-flex flex-column justify-center">
                            <h4 class="text-subtitle-1 success--text mb-2">
                                <v-icon small left>mdi-barcode-scan</v-icon> Búsqueda Rápida de Producto
                            </h4>
                            <v-autocomplete outlined dense autofocus label="Buscar por ID o Nombre (ENTER para agregar)"
                                auto-select-first v-model="busqueda.texto" :items="busqueda.items"
                                @keyup.enter="onBuscarEnter" hide-details   @change="onBuscarEnter"/>

                        </v-card>
                    </v-col>
                </v-row>

                <v-divider class="my-3"></v-divider>
                <v-simple-table fixed-header height="35vh" dense class="elevation-1">
                    <template v-slot:default>
                        <thead class="grey darken-3 black--text">
                            <tr>
                                <th class="text-left black--text" width="5%">Acción</th>
                                <th class="text-left black--text" width="45%">Descripción</th>
                                <th class="text-left black--text" width="10%">Medida</th>
                                <th class="text-right black--text" width="15%">Costo Unit. (C/IGV)</th>
                                <th class="text-center black--text" width="10%">Cantidad</th>
                                <th class="text-right black--text" width="15%">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!detalle.length">
                                <td colspan="6" class="text-center grey--text text-caption">
                                    No hay productos en este comprobante.
                                </td>
                            </tr>
                            <tr v-for="it in detalle" :key="it.uuid">
                                <td>
                                    <v-btn icon x-small color="green" title="Editar ítem" @click="abreEditarItem(it)">
                                        <v-icon small>mdi-pencil</v-icon>
                                    </v-btn>
                                </td>
                                <td>
                                    <span class="font-weight-medium">{{ it.nombre }}</span>
                                    <div class="caption grey--text">{{ it.id }} ({{ it.operacion }})</div>
                                </td>
                                <td>{{ it.medida }}</td>
                                <td class="text-right">{{ monedaSimbolo }} {{ fmtDec(it.costo_nuevo) }}</td>
                                <td class="text-center">{{ it.cantidad }}</td>
                                <td class="text-right font-weight-bold">
                                    <span v-if="it.operacion === 'GRATUITA'"
                                        class="caption orange--text">GRATUITO</span>
                                    <span v-else>{{ monedaSimbolo }} {{ fmtDec(it.cantidad * it.costo_nuevo) }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

                <v-row dense class="mt-4">
                    <v-col cols="6"></v-col>
                    <v-col cols="6" class="text-right">
                        <v-divider></v-divider>
                        <h5 class="mt-1"> Op. Gravada (Base): <span class="red--text">{{ monedaSimbolo }} {{
                                totales.baseGravada }}</span></h5>
                        <h5> Op. Exonerada: <span class="red--text">{{ monedaSimbolo }} {{ totales.exonerada }}</span></h5>
                        <h5> Op. Gratuita (Base): <span class="red--text">{{ monedaSimbolo }} {{ totales.gratuita }}</span>
                        </h5>
                        <h5 class="font-weight-bold"> IGV {{ igv }}%: <span class="red--text">{{ monedaSimbolo }} {{
                                totales.igv }}</span></h5>
                        <v-divider class="my-1"></v-divider>
                        <h4 class="text-h5 font-weight-black success--text"> TOTAL: <span class="red--text">{{ monedaSimbolo }}
                                {{
                                totales.total }}</span></h4>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-dialog v-model="ui.confirmaGrabar" max-width="460px">
            <v-card class="rounded-lg">
                <v-toolbar color="success" dense dark><v-toolbar-title>Confirmar
                        Guardado</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="ui.confirmaGrabar = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4 text-center">
                    <h2 class="text-h5">¿SEGURO DE CONTINUAR Y GUARDAR LOS CAMBIOS?</h2>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="success" block large @click="grabar(true)">SÍ, GUARDAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ui.editarItem" max-width="450px">
            <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark><v-toolbar-title>Editar
                        Ítem</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="ui.editarItem = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-select :items="constantes.operaciones" label="Operación" dense outlined
                        v-model="formItem.operacion" />
                    <v-text-field dense outlined v-model="formItem.costo" label="Costo Unitario (C/IGV)"
                        type="number" />
                    <v-text-field dense outlined v-model="formItem.nombre" label="Nombre del Producto" />
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="error" text @click="eliminarItem">
                        <v-icon left>mdi-delete</v-icon> Eliminar Ítem
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" @click="guardarItemEditado">
                        <v-icon left>mdi-content-save</v-icon> Grabar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ui.agregarItem" max-width="400px">
            <v-card class="rounded-lg">
                <v-toolbar color="green darken-1" dense dark><v-toolbar-title>Añadir
                        Producto</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="ui.agregarItem = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-select :items="constantes.operaciones" label="Operación" dense outlined
                        v-model="formNuevo.operacion" />

                    <v-row dense class="mx-auto text-center">
                        <v-col v-if="formNuevo.operacion !== 'EXONERADA'" cols="6" class="mb-n1">
                            <v-text-field dense label="PRECIO SIN IGV" v-model="formNuevo.sinIgv"
                                @focus="precioFocus = 'sin'" />
                        </v-col>
                        <v-col :cols="formNuevo.operacion === 'EXONERADA' ? 12 : 6" class="mb-n1">
                            <v-text-field dense
                                :label="formNuevo.operacion === 'EXONERADA' ? 'PRECIO EXONERADO' : 'PRECIO CON IGV'"
                                v-model="formNuevo.conIgv" @focus="precioFocus = 'con'" />
                        </v-col>
                    </v-row>

                    <v-text-field dense outlined label="Nombre (detallado)" v-model="formNuevo.nombre"
                        @keyup.enter="confirmAgregar" class="mt-2" />

                    <h5 class="mt-3 mb-2">Seleccione Modo de Ingreso:</h5>
                    <v-row dense class="mx-auto text-center">
                        <v-col cols="6">
                            <v-btn block :color="formNuevo.modo === 'entero' ? 'primary' : 'grey lighten-2'"
                                @click="seleccionarModo('entero')">{{ prodSelecto.medida }}</v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block :color="formNuevo.modo === 'fraccion' ? 'primary' : 'grey lighten-2'"
                                @click="seleccionarModo('fraccion')">UNIDAD</v-btn>
                        </v-col>
                    </v-row>

                    <v-text-field type="number" outlined dense v-model.number="formNuevo.cantidad" label="CANTIDAD"
                        @focus="$event.target.select()" @keyup.enter="confirmAgregar" class="mt-4" />
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="success" block large @click="confirmAgregar">
                        <v-icon left>mdi-plus-circle</v-icon> AÑADIR AL COMPROBANTE
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ui.editarCabecera" max-width="800px" persistent>
            <v-card class="rounded-lg">
                <v-toolbar color="warning" dense dark>
                    <v-toolbar-title>Editar Cabecera de Compra</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="ui.editarCabecera = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="6"><v-text-field type="date" outlined dense v-model="formCabecera.emision"
                                label="Fecha Emisión" /></v-col>
                        <v-col cols="6"><v-text-field type="date" outlined dense v-model="formCabecera.ingreso"
                                label="Fecha Ingreso Producto" /></v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="6">
                            <v-text-field readonly outlined dense v-model="formCabecera.num_doc" label="N° DOC PROVEE."
                                append-icon="mdi-magnify"
                                @click:append="$store.commit('dialogo_tabla_proveedores', false)" />
                        </v-col>
                        <v-col cols="6"><v-text-field readonly outlined dense v-model="formCabecera.nom_proveedor"
                                label="NOMBRE PROVEEDOR" /></v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="4"><v-select :items="constantes.tiposDocumento" label="Tipo Documento" dense
                                outlined v-model="formCabecera.tipodocumento" /></v-col>
                        <v-col cols="4"><v-text-field type="text" outlined dense v-model="formCabecera.sreferencia"
                                label="Serie Ref." placeholder="F001" :disabled="!formCabecera.num_doc" /></v-col>
                        <v-col cols="4"><v-text-field type="number" outlined dense v-model="formCabecera.creferencia"
                                label="Correlativo Ref." placeholder="1234"
                                :disabled="!formCabecera.sreferencia" /></v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="3"><v-select :items="constantes.modosPago" label="Modo Pago" dense outlined
                                v-model="formCabecera.modo_pago" /></v-col>
                        <v-col cols="9"><v-textarea outlined dense v-model="formCabecera.observacion" auto-grow
                                label="OBSERVACIÓN" rows="1" /></v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn block color="success" large @click="guardarCabecera">GUARDAR CAMBIOS DE CABECERA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog persistent v-model="ui.progreso" max-width="250px">
            <v-card class="pa-8 text-center rounded-lg">
                <v-progress-linear indeterminate color="blue-grey" height="25" class="mb-3" />
                <span class="text-caption">Procesando operación...</span>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ui.confirmaAnulacion" max-width="460px">
            <v-card class="rounded-lg">
                <v-toolbar color="red" dense dark><v-toolbar-title>Confirmar
                        Anulación</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="ui.confirmaAnulacion = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4 text-center">
                    <h2 class="text-h5 red--text text--darken-2">¿SEGURO QUE DESEA ANULAR ESTA COMPRA?</h2>
                    <p class="mt-3 caption">Esta acción revertirá los movimientos de stock.</p>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="red" block large @click="anular">SÍ, ANULAR COMPRA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ui.productos" max-width="800px">
            <cata_productos v-if="ui.productos" @array="onProductoSeleccionado" @cierra="ui.productos = $event" />
        </v-dialog>
    </v-dialog>
</template>
<script>
import moment from "moment"
import store from "@/store/index"
import cata_productos from "@/views/movi_kardex/lista_productos"
import { nuevoMovimiento, edita_Movimiento, elmina_mov_kardex } from "../../db"
import { modifica_stock_array, modifica_stock_unitario } from "../../control_stock"
import { fs, colempresa } from "../../db_firestore"

export default {
    name: "RegistroCompras",
    components: { cata_productos },
    props: { data: { type: Object, required: true } },
    data() {
        return {
            // Cabecera y detalle
            moneda: 'S/',
            cabecera: this.cloneCabecera(this.data),
            detalle: Array.isArray(this.data?.data) ? [...this.data.data] : [],

            // Parámetros
            igv: 18,
            incluyeIgv: true,

            // UI
            ui: {
                main: true,
                progreso: false,
                productos: false,
                editarItem: false,
                agregarItem: false,
                editarCabecera: false,
                confirmaGrabar: false,
                confirmaAnulacion: false,
            },
            formCabecera: {
                emision: "",
                ingreso: "",
                num_doc: "",
                nom_proveedor: "",
                tipodocumento: "FACTURA",
                sreferencia: "",
                creferencia: "",
                modo_pago: "CONTADO",
                observacion: ""
            },
            // Búsqueda rápida por autocompletado
            busqueda: {
                texto: "",
                items: this.buildAutocompleteItems(),
            },

            // Formularios
            formItem: { index: -1, uuid: "", nombre: "", operacion: "GRAVADA", costo: "" },
            formNuevo: { operacion: "GRAVADA", sinIgv: "", conIgv: "", nombre: "", cantidad: 1, modo: "fraccion" },
            prodSelecto: {},
            precioFocus: "con", // 'con' | 'sin'

            constantes: {
                operaciones: ["GRAVADA", "GRATUITA", "EXONERADA"],
                modosPago: ["CONTADO", "CREDITO"],
                tiposDocumento: ["FACTURA", "BOLETA", "NOTA DE VENTA"],
            },
        }
    },

    computed: {
        totales() {
            const t = this.calcTotales(this.detalle, this.igv, this.incluyeIgv)
            return {
                baseGravada: this.fmtDec(t.base),
                igv: this.fmtDec(t.igv),
                exonerada: this.fmtDec(t.exo),
                gratuita: this.fmtDec(t.gratuitaBase),
                total: this.fmtDec(t.total),
            }
        },
        monedaSimbolo(){
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        }
    },

    watch: {
        "formNuevo.sinIgv"(v) {
            if (this.formNuevo.operacion === "EXONERADA") return; // sin IGV = exonerado (se maneja desde conIgv)
            if (this.precioFocus === "sin") {
                const n = this.num(v);
                this.formNuevo.conIgv = n ? (n * (1 + this.igv / 100)).toFixed(4) : "";
            }
        },
        "formNuevo.conIgv"(v) {
            if (this.formNuevo.operacion === "EXONERADA") {
                // En exonerada, ambos equivalen
                this.formNuevo.sinIgv = v;
                return;
            }
            if (this.precioFocus === "con") {
                const n = this.num(v);
                this.formNuevo.sinIgv = n ? (n / (1 + this.igv / 100)).toFixed(4) : "";
            }
        },
    },
    created() {
        console.log('moneda compra', this.data);
        this.moneda = this.data.moneda || 'S/'
    },
    methods: {
        // ---------- Utilitarios ----------
        docCode(tipo) {
            if (tipo === "FACTURA") return "01";
            if (tipo === "BOLETA") return "03";
            if (tipo === "NOTA DE VENTA") return "00";
            return "00";
        },
        cloneCabecera(src) {
            const d = src || {};
            const ahora = moment().unix();
            return {
                id: d.id || this.uuid4(),
                fecha_emision: this.asUnix(d.fecha_emision) || this.asUnix(Date.now()),
                fecha_ingreso: this.asUnix(d.fecha_ingreso) || this.asUnix(Date.now()),
                fecha_creacion: d.fecha_creacion || ahora,          // NUEVO
                tipodocumento: d.tipodocumento || "FACTURA",
                cod_doc: d.cod_doc || this.docCode(d.tipodocumento || "FACTURA"), // NUEVO
                operacion: d.operacion || "COMPRA",                 // NUEVO
                periodo: d.periodo || "",                           // NUEVO
                sreferencia: d.sreferencia || "",
                moneda: d.moneda || "S/",
                creferencia: d.creferencia || "",
                modo_pago: d.modo_pago || "CONTADO",
                num_doc: d.num_doc || "",
                nom_proveedor: d.nom_proveedor || "",
                observacion: d.observacion || "",
                responsable: d.responsable || this.usuarioResponsable(), // NUEVO
                data: [],
            };
        },
        usuarioResponsable() {
            const correo = store?.state?.permisos?.correo || "";
            // Ejemplo anterior: slice(0, -13). Alternativa más robusta: quitar dominio.
            return correo ? correo.replace(/@.*/, "") : "";
        },

        uuid4() {
            try { return crypto.randomUUID() } catch { /* fallback */ }
            const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
            return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
        },
        asUnix(msOrUnix) {
            if (!msOrUnix && msOrUnix !== 0) return 0
            // si viene en segundos, mantener; si viene en ms, convertir
            return String(msOrUnix).length > 10 ? Math.floor(Number(msOrUnix) / 1000) : Number(msOrUnix)
        },
        fromUnix(u) { return moment.unix(Number(u || 0)).format("YYYY-MM-DD") },
        toUnix(yyyy_mm_dd) { return Math.floor(moment(String(yyyy_mm_dd)).valueOf() / 1000) },
        fmtFecha(unix) { return moment.unix(Number(unix || 0)).format("DD/MM/YYYY") },
        num(v) {
            if (v === undefined || v === null || v === "") return 0
            const n = Number(String(v).replace(",", "."))
            return Number.isFinite(n) ? n : 0
        },
        fmtDec(v) {
            const dec = store?.state?.configuracion?.decimal ?? 2
            return Number(v || 0).toFixed(dec)
        },
        buildAutocompleteItems() {
            const arr = store?.state?.productos || []
            return arr.map(p => `${p.id} / ${p.nombre} / ${p.medida}`)
        },

        // ---------- Cálculos ----------
        calcTotales(items, igvPct, incluyeIgv) {
            let grav = 0, exo = 0, gratuita = 0
            for (const it of items || []) {
                const base = this.num(it.cantidad) * this.num(it.costo_nuevo)
                if (it.operacion === "GRAVADA") grav += base
                else if (it.operacion === "EXONERADA") exo += base
                else if (it.operacion === "GRATUITA") gratuita += base
            }

            let baseImp, igvVal
            if (incluyeIgv) {
                baseImp = grav / (1 + igvPct / 100)
                igvVal = baseImp * (igvPct / 100)
            } else {
                baseImp = grav
                igvVal = grav * (igvPct / 100)
            }

            const total = baseImp + igvVal + exo
            const gratuitaBase = gratuita / (1 + igvPct / 100)

            return { base: baseImp, igv: igvVal, exo, gratuitaBase, total }
        },

        // ---------- UI / Emisiones ----------
        emitCerrar() { this.$emit("cierra_compra", false) },

        onBuscarEnter() {
            const id = String(this.busqueda.texto || "").split("/")[0].trim()
            if (!id) return
            const prod = (store?.state?.productos || []).find(p => String(p.id) === id)
            if (prod) this.preparaAgregar(prod)
        },

        onProductoSeleccionado(prod) {
            if (Array.isArray(prod) && prod.length) prod = prod[0]
            this.preparaAgregar(prod)
        },

        preparaAgregar(prod) {
            this.prodSelecto = prod || {}
            this.formNuevo = {
                operacion: "GRAVADA",
                sinIgv: this.num(prod?.costo) ? (this.num(prod.costo) / (1 + this.igv / 100)).toFixed(4) : "",
                conIgv: this.num(prod?.costo) ? this.num(prod.costo).toFixed(4) : "",
                nombre: prod?.nombre || "",
                cantidad: 1,
                modo: "fraccion", // por defecto unidad
            }
            this.precioFocus = "con"
            this.ui.agregarItem = true
        },

        seleccionarModo(m) { this.formNuevo.modo = m },

        async confirmAgregar() {
            const prod = this.prodSelecto || {}
            const factor = this.num(prod.factor) > 0 ? this.num(prod.factor) : 1
            const cant = Math.max(0, this.num(this.formNuevo.cantidad))
            const cantidadFinal = cant // si quieres multiplicar en "entero" por factor, cámbialo aquí
            const medida = this.formNuevo.modo === "entero" ? prod.medida : "UNIDAD"

            // Precio guardado (usamos CON IGV tal cual)
            const costoConIgv = this.num(this.formNuevo.conIgv)

            const nuevo = {
                uuid: this.uuid4(),
                id: prod.id,
                cantidad: cantidadFinal,
                nombre: this.formNuevo.nombre || prod.nombre || "",
                medida,
                stock: prod.stock,
                operacion: this.formNuevo.operacion,
                costo: costoConIgv,
                costo_nuevo: costoConIgv,
                factor_paquete: factor,
                modo_ingreso: this.formNuevo.modo,
            }

            this.ui.progreso = true
            try {
                await modifica_stock_unitario("SUMA", nuevo)
                this.detalle.push(nuevo)
                await this.grabar(false) // persiste cabecera + detalle
            } finally {
                this.ui.progreso = false
                this.ui.agregarItem = false
                this.busqueda.texto = ""
            }
        },

        abreEditarItem(it) {
            const idx = this.detalle.findIndex(x => x.uuid === it.uuid)
            if (idx < 0) return
            this.formItem = {
                index: idx,
                uuid: it.uuid,
                nombre: it.nombre,
                operacion: it.operacion || "GRAVADA",
                costo: String(it.costo_nuevo ?? it.costo ?? ""),
            }
            this.ui.editarItem = true
        },

        async eliminarItem() {
            const idx = this.formItem.index
            if (idx < 0) return
            const it = this.detalle[idx]

            this.ui.progreso = true
            try {
                await modifica_stock_unitario("RESTA", it)
                await this.borrarLineaKardex(it)
                this.detalle.splice(idx, 1)
                await this.grabar(false)
            } finally {
                this.ui.progreso = false
                this.ui.editarItem = false
            }
        },

        async borrarLineaKardex(it) {
            if (!(it && it.id && it.uuid)) return
            const pid = String(it.id)
            const lineId = `${this.cabecera.id}_${String(it.uuid)}`
            try {
                await colempresa().doc("kardex").collection("historial").doc(pid).collection("detalle").doc(lineId).delete()
            } catch (e) {
                console.error("No se pudo borrar línea kardex:", e)
            }
        },

        async guardarItemEditado() {
            const idx = this.formItem.index
            if (idx < 0) return
            const d = this.detalle[idx]
            d.operacion = String(this.formItem.operacion || "GRAVADA").trim()
            d.nombre = String(this.formItem.nombre || "").trim()
            d.costo_nuevo = this.num(this.formItem.costo)

            this.ui.progreso = true
            try {
                await this.grabar(false)
            } finally {
                this.ui.progreso = false
                this.ui.editarItem = false
            }
        },

        // ---------- Persistencia ----------
        async grabar(cerrar) {
            const t = this.calcTotales(this.detalle, this.igv, this.incluyeIgv);

            // Asegurar consistencia de cabecera clave antes de persistir
            this.cabecera.cod_doc = this.docCode(this.cabecera.tipodocumento);
            this.cabecera.operacion = this.cabecera.operacion || "COMPRA";
            this.cabecera.periodo = this.cabecera.periodo ?? "";
            this.cabecera.fecha_creacion = this.cabecera.fecha_creacion || moment().unix();
            this.cabecera.responsable = this.cabecera.responsable || this.usuarioResponsable();

            const payload = {
                ...this.cabecera,
                baseimponible: Number(t.base).toFixed(2),
                igv: Number(t.igv).toFixed(2),
                porc_igv: this.igv,
                tot_gratuita: Number(t.gratuitaBase).toFixed(2), // base sin IGV
                tot_exonerada: Number(t.exo).toFixed(2),
                total: Number(t.total).toFixed(2),
                data: this.detalle,
            };

            await nuevoMovimiento(this.cabecera.id, payload);
            if (cerrar) {
                this.ui.confirmaGrabar = false;
                this.emitCerrar();
            }
        },


        async anular() {
            this.ui.progreso = true
            try {
                await modifica_stock_array("RESTA", this.detalle)
                await elmina_mov_kardex(this.cabecera.id)
            } finally {
                this.ui.progreso = false
                this.ui.confirmaAnulacion = false
                this.emitCerrar()
            }
        },

        // ---------- Cabecera ----------
        abreEditarCabecera() {
            this.formCabecera = {
                emision: this.fromUnix(this.cabecera.fecha_emision),
                ingreso: this.fromUnix(this.cabecera.fecha_ingreso),
                num_doc: this.cabecera.num_doc,
                nom_proveedor: this.cabecera.nom_proveedor,
                tipodocumento: this.cabecera.tipodocumento,
                sreferencia: this.cabecera.sreferencia,
                creferencia: this.cabecera.creferencia,
                modo_pago: this.cabecera.modo_pago,
                observacion: this.cabecera.observacion,
            }
            this.ui.editarCabecera = true
        },

        async guardarCabecera() {
            const f = this.formCabecera
            this.cabecera.fecha_emision = this.toUnix(f.emision)
            this.cabecera.fecha_ingreso = this.toUnix(f.ingreso)
            this.cabecera.num_doc = f.num_doc
            this.cabecera.nom_proveedor = f.nom_proveedor
            this.cabecera.tipodocumento = f.tipodocumento
            this.cabecera.sreferencia = f.sreferencia
            this.cabecera.creferencia = f.creferencia
            this.cabecera.modo_pago = f.modo_pago
            this.cabecera.observacion = f.observacion

            this.ui.progreso = true
            try {
                await this.grabar(false)
            } finally {
                this.ui.progreso = false
                this.ui.editarCabecera = false
            }
        },
    },
}
</script>
