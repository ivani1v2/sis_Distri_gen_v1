<template>
    <v-dialog v-model="ui.main" max-width="1100px" persistent>
        <!-- Barra superior -->
        <div>
            <v-system-bar window dark>
                <v-icon @click="emitCerrar">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="info" @click="ui.productos = true">mdi-magnify</v-icon>
                <v-icon color="red" large @click="ui.confirmaAnulacion = true">mdi-delete</v-icon>
                <v-icon color="green" large @click="ui.confirmaGrabar = true">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <!-- Cabecera -->
            <v-card-text>
                <v-row dense class="mb-n5">
                    <v-col cols="6">
                        <h4>FECHA DE EMISIÓN: {{ fmtFecha(cabecera.fecha_emision) }}</h4>
                        <h4>FECHA DE INGRESO: {{ fmtFecha(cabecera.fecha_ingreso) }}</h4>
                        <h4>
                            DOCUMENTO: {{ cabecera.tipodocumento }} /
                            {{ cabecera.sreferencia }}-{{ cabecera.creferencia }}
                        </h4>
                        <h4>Pago: {{ cabecera.modo_pago }}</h4>
                        <v-btn x-small color="warning" class="mb-1" @click="abreEditarCabecera">
                            Editar Cabecera
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <h4>RUC : {{ cabecera.num_doc }}</h4>
                        <h4>RAZÓN SOCIAL : {{ cabecera.nom_proveedor }}</h4>
                        <h4>Observación : {{ cabecera.observacion }}</h4>

                        <div class="mt-2 mb-n5" v-if="!$store.state.esmovil">
                            <v-autocomplete autofocus class="mt-n3" label="Busca Producto" auto-select-first
                                v-model="busqueda.texto" :items="busqueda.items" @keyup.enter="onBuscarEnter" />
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>

            <!-- Detalle -->
            <v-simple-table dark fixed-header height="55vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">Descripción</th>
                            <th class="text-left">Medida</th>
                            <th class="text-left">Cost Unit</th>
                            <th class="text-left">Cantidad</th>
                            <th class="text-left">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="it in detalle" :key="it.uuid">
                            <td width="380">
                                <v-icon color="green" small class="mt-n1"
                                    @click="abreEditarItem(it)">mdi-pencil</v-icon>
                                {{ it.id }} {{ it.nombre }}
                            </td>
                            <td width="30">{{ it.medida }}</td>
                            <td width="35">{{ fmtDec(it.costo_nuevo) }}</td>
                            <td width="35">{{ it.cantidad }}</td>
                            <td width="35">
                                <span v-if="it.operacion === 'GRAVADA'">S/. {{ fmtDec(it.cantidad * it.costo_nuevo)
                                }}</span>
                                <span v-else-if="it.operacion === 'GRATUITA'">S/. 0.00</span>
                                <span v-else>S/. {{ fmtDec(it.cantidad * it.costo_nuevo) }}</span>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

            <!-- Totales -->
            <v-row dense>
                <v-col cols="6"></v-col>
                <v-col cols="6" class="text-right">
                    <h5> Op. Gravada: <span class="red--text">S/. {{ totales.baseGravada }}</span></h5>
                    <h5> Op. Gratuita: <span class="red--text">S/. {{ totales.gratuita }}</span></h5>
                    <h5> Op. Exonerada: <span class="red--text">S/. {{ totales.exonerada }}</span></h5>
                    <h5> IGV {{ igv }}%: <span class="red--text">S/. {{ totales.igv }}</span></h5>
                    <h5> TOTAL: <span class="red--text">S/. {{ totales.total }}</span></h5>
                </v-col>
            </v-row>
        </v-card>

        <!-- Confirmar grabar -->
        <v-dialog v-model="ui.confirmaGrabar" max-width="460px">
            <div><v-system-bar window dark><v-icon @click="ui.confirmaGrabar = false">mdi-close</v-icon></v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text>
                    <h2 class="text-center">¿SEGURO DE CONTINUAR?</h2>
                </v-card-text>
                <v-card-actions><v-btn color="success" block @click="grabar(true)">Sí</v-btn></v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Editar Item -->
        <v-dialog v-model="ui.editarItem" max-width="390px">
            <div><v-system-bar window dark><v-icon @click="ui.editarItem = false">mdi-close</v-icon></v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-select :items="constantes.operaciones" label="Operación" dense outlined
                    v-model="formItem.operacion" />
                <v-text-field dense class="pa-3" v-model="formItem.costo" label="Costo Unitario"
                    @keyup.enter="guardarItemEditado" />
                <v-text-field dense class="pa-3" v-model="formItem.nombre" label="Nombre"
                    @keyup.enter="guardarItemEditado" />
                <v-card-actions class="mt-n4">
                    <v-spacer></v-spacer>
                    <v-btn color="error" text @click="eliminarItem">Eliminar</v-btn>
                    <v-btn color="green darken-1" text @click="guardarItemEditado">Grabar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Agregar Item / Cantidad + Precios -->
  <!-- Agregar Item / Cantidad + Precios -->
<v-dialog v-model="ui.agregarItem" max-width="360px">
  <div>
    <v-system-bar window dark>
      <v-icon @click="ui.agregarItem = false">mdi-close</v-icon>
    </v-system-bar>
  </div>
  <v-card class="pa-3">
    <v-select
      :items="constantes.operaciones"
      label="Operación"
      dense
      outlined
      v-model="formNuevo.operacion"
    />

    <!-- Si NO es exonerada: 2 campos (sin/con IGV) -->
    <v-row v-if="formNuevo.operacion !== 'EXONERADA'" dense class="mx-auto text-center">
      <v-col cols="6" class="mb-n1">
        <v-text-field
          dense
          label="PRECIO SIN IGV"
          v-model="formNuevo.sinIgv"
          @focus="precioFocus = 'sin'"
        />
      </v-col>
      <v-col cols="6" class="mb-n1">
        <v-text-field
          dense
          label="PRECIO CON IGV"
          v-model="formNuevo.conIgv"
          @focus="precioFocus = 'con'"
        />
      </v-col>
    </v-row>

    <!-- Si es exonerada: 1 solo campo -->
    <v-row v-else dense class="mx-auto text-center">
      <v-col cols="12" class="mb-n1">
        <v-text-field
          dense
          label="PRECIO EXONERADO"
          v-model="formNuevo.conIgv"
          @focus="precioFocus = 'con'"
        />
      </v-col>
    </v-row>

    <v-row dense class="mx-auto text-center">
      <v-col cols="12" class="mb-n2">
        <v-text-field dense label="Nombre" v-model="formNuevo.nombre" @keyup.enter="confirmAgregar" />
      </v-col>
    </v-row>

    <v-row dense class="mx-auto text-center">
      <v-col cols="6">
        <v-btn block color="success" @click="seleccionarModo('entero')">{{ prodSelecto.medida }}</v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn block color="success" @click="seleccionarModo('fraccion')">UND.</v-btn>
      </v-col>
    </v-row>

    <v-text-field
      type="number"
      outlined
      dense
      v-model.number="formNuevo.cantidad"
      label="CANTIDAD"
      @focus="$event.target.select()"
      @keyup.enter="confirmAgregar"
      class="mt-2"
    />
    <v-btn class="mt-2" color="red" block @click="confirmAgregar">OK</v-btn>
  </v-card>
</v-dialog>


        <!-- Editar Cabecera -->
        <v-dialog v-model="ui.editarCabecera" max-width="800px" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="ui.editarCabecera = false">mdi-close</v-icon>
                    <h5 class="text-center">REGISTRO DE COMPRAS</h5>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense class="pa-1">
                    <v-col cols="6"><v-text-field type="date" outlined dense v-model="formCabecera.emision"
                            label="Emisión" /></v-col>
                    <v-col cols="6"><v-text-field type="date" outlined dense v-model="formCabecera.ingreso"
                            label="Ingreso Producto" /></v-col>
                </v-row>
                <v-row dense class="pa-1 mt-n4">
                    <v-col cols="6"><v-text-field readonly outlined dense v-model="formCabecera.num_doc"
                            label="N° DOC PROVEE." append-icon="mdi-magnify"
                            @click:append="$store.commit('dialogo_tabla_proveedores', false)" /></v-col>
                    <v-col cols="6"><v-text-field readonly outlined dense v-model="formCabecera.nom_proveedor"
                            label="NOMBRE PROVEEDOR" /></v-col>
                </v-row>
                <v-row dense class="pa-1 mt-n4">
                    <v-col cols="4"><v-select :items="constantes.tiposDocumento" label="Tipo" dense outlined
                            v-model="formCabecera.tipodocumento" /></v-col>
                    <v-col cols="4"><v-text-field type="text" outlined dense v-model="formCabecera.sreferencia"
                            label="Serie Ref." placeholder="F001" :disabled="!formCabecera.num_doc" /></v-col>
                    <v-col cols="4"><v-text-field type="number" outlined dense v-model="formCabecera.creferencia"
                            label="Correlativo Ref." placeholder="1234" :disabled="!formCabecera.sreferencia" /></v-col>
                </v-row>
                <v-row dense class="pa-1 mt-n4">
                    <v-col cols="3"><v-select :items="constantes.modosPago" label="Modo Pago" dense outlined
                            v-model="formCabecera.modo_pago" /></v-col>
                    <v-col cols="9"><v-textarea outlined dense v-model="formCabecera.observacion" auto-grow
                            label="OBSERVACIÓN" rows="1" /></v-col>
                </v-row>
                <v-row dense class="pa-1 mt-n1">
                    <v-col cols="12"><v-btn block color="success" @click="guardarCabecera">GUARDAR</v-btn></v-col>
                </v-row>
            </v-card>
        </v-dialog>

        <!-- Progreso -->
        <v-dialog persistent v-model="ui.progreso" max-width="250px">
            <v-card class="pa-12">
                <v-progress-linear indeterminate color="blue-grey" height="25" />
            </v-card>
        </v-dialog>

        <!-- Confirmar anulación -->
        <v-dialog v-model="ui.confirmaAnulacion" max-width="460px">
            <div><v-system-bar window dark><v-icon
                        @click="ui.confirmaAnulacion = false">mdi-close</v-icon></v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text>
                    <h2 class="text-center">¿SEGURO QUE DESEA ANULAR?</h2>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="info" @click="anular">Sí</v-btn>
                    <v-btn color="success" @click="ui.confirmaAnulacion = false">No</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Catálogo de productos -->
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
