<template>
    <div class="mb-6 mt-3 pa-4">
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="6" sm="6">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio" />
                </v-col>

                <v-col cols="6" sm="6">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin" />
                </v-col>
            </v-row>

            <v-row dense class="mt-n4">
                <v-col cols="12" sm="6">
                    <v-btn color="primary" small :loading="cargando" @click="cargar">
                        🔍 Consultar
                    </v-btn>

                    <v-btn class="ml-2" small color="success" :disabled="!itemsTabla.length" @click="exportarExcel">
                        <v-icon left small>mdi-microsoft-excel</v-icon> Excel
                    </v-btn>

                    <v-btn-toggle v-model="modoVista" class="ml-2" dense mandatory>
                        <v-btn small :value="'CAB'">
                            <v-icon left small>mdi-file-document-outline</v-icon>
                            Solo cabeceras
                        </v-btn>
                        <v-btn small :value="'DET'">
                            <v-icon left small>mdi-format-list-bulleted</v-icon>
                            Detallado
                        </v-btn>
                    </v-btn-toggle>
                </v-col>

                <v-col cols="12" sm="6" class="text-right">
                    <v-chip v-if="!cargando" outlined>
                        Total General: <strong class="ml-1">{{ moneda }} {{ totalGeneralVista }}</strong>
                    </v-chip>
                </v-col>
            </v-row>

            <!-- ✅ selector de columnas -->
            <v-row dense class="mt-2">
                <v-col cols="12">
                    <v-autocomplete v-if="modoVista === 'CAB'" v-model="colsCabSeleccionadas" :items="camposCabecera"
                        item-text="text" item-value="value" multiple chips deletable-chips outlined dense hide-details
                        label="Columnas (Cabecera) para mostrar y exportar" />

                    <v-autocomplete v-else v-model="colsDetSeleccionadas" :items="camposDetalle" item-text="text"
                        item-value="value" multiple chips deletable-chips outlined dense hide-details
                        label="Columnas (Detalle) disponibles: cabecera + detalle" />
                </v-col>
            </v-row>

            <v-progress-linear v-if="cargando" indeterminate height="2" class="mt-2" />
        </v-card>

        <v-card class="mt-3">
            <v-data-table class="tabla-xs elevation-1" :headers="headersTabla" :items="itemsTabla"
                :item-key="modoVista === 'DET' ? 'rid' : '_docKey'" dense :items-per-page="100">
                <!-- producto en una sola linea si existe la columna -->
                <template v-slot:item.d_nombre="{ item }">
                    <span class="desc-item" :title="item.d_nombre">
                        {{ item.d_nombre }}
                        <v-chip v-if="item.d_esGratuita === 'SI'" x-small color="pink" text-color="white" class="ml-1"
                            label>
                            GRATUITA
                        </v-chip>
                    </span>
                </template>

                <template v-slot:body.append>
                    <tr class="font-weight-bold">
                        <td :colspan="headersTabla.length - 1" class="text-right">
                            Total General:
                        </td>
                        <td class="text-right">{{ moneda }} {{ totalGeneralVista }}</td>
                    </tr>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script>
import moment from "moment";
import "moment/locale/es";
import { allCabecera, consultaDetalle } from "../../db";
import * as XLSX from "xlsx";
import store from "@/store/index";

moment.locale("es");

export default {
    name: "ReporteCabeceraDetalle",

    data: () => ({
        date: moment().format("YYYY-MM-DD"),
        date2: moment().format("YYYY-MM-DD"),
        cargando: false,

        // CAB / DET
        modoVista: "CAB",

        // data
        cabeceras: [],
        filas: [],

        // ✅ catálogo de campos cabecera
        camposCabecera: [
            { text: "Comprobante", value: "_docKey" },
            { text: "Numeración", value: "numeracion" },
            { text: "Código Cliente", value: "dni" },
            { text: "Cliente", value: "cliente" },
            { text: "Dirección", value: "direccion" },
            { text: "Vendedor", value: "vendedor" },
            { text: "Fecha", value: "fecha_str" },
            { text: "Estado", value: "estado" },
            { text: "Estado Entrega", value: "estado_entrega" },
            { text: "Forma Pago", value: "forma_pago" },
            { text: "Moneda", value: "moneda" },
            { text: "Total", value: "total" },
            { text: "Pendiente Pago", value: "pendiente_pago" },
            { text: "Peso Total", value: "peso_total" },
            { text: "Op Gravadas", value: "total_op_gravadas" },
            { text: "Op Exoneradas", value: "total_op_exoneradas" },
            { text: "Op Gratuitas", value: "total_op_gratuitas" },
            { text: "IGV", value: "igv" },
            { text: "Vencimiento", value: "vencimiento_str" },
        ],

        // ✅ catálogo de campos DET: cabecera(h_) + detalle(d_)
        camposDetalle: [
            // CAB
            { text: "Fecha", value: "h_fecha_str" },
            { text: "Vendedor", value: "h_vendedor" },
            { text: "Código Cliente", value: "h_dni" },
            { text: "Cliente", value: "h_cliente" },
            { text: "Numero Documento", value: "h_numeracion" },
            { text: "Estado", value: "h_estado" },
            { text: "Forma Pago", value: "h_forma_pago" },
            { text: "Total Doc", value: "h_total" },
            { text: "Peso Total Doc", value: "h_peso_total" },

            // DET
            { text: "Producto", value: "d_nombre" },
            { text: "ID Producto", value: "d_id" },
            { text: "Categoría", value: "d_categoria" },
            { text: "Marca", value: "d_marca" },
            { text: "Proveedor", value: "d_proveedor" },
            { text: "Operación", value: "d_operacion" },
            { text: "Medida", value: "d_medida" },
            { text: "Factor", value: "d_factor" },
            { text: "Cantidad", value: "d_cantidad" },
            { text: "Peso", value: "d_peso" },
            { text: "Precio", value: "d_precio" },
            { text: "Total", value: "d_total" },
            { text: "Gratuita", value: "d_esGratuita" },
            { text: "IGV Item", value: "d_igv" },
        ],

        // ✅ columnas por defecto
        colsCabSeleccionadas: ["_docKey", "dni", "cliente", "fecha_str", "total"],
        colsDetSeleccionadas: [
            "h_fecha_str",
            "h_vendedor",
            "h_dni",
            "h_cliente",
            "d_proveedor",
            "h_numeracion",
            "d_nombre",
            "d_medida",
            "d_cantidad",
            "d_precio",
            "d_total",
            "d_esGratuita",
        ],
    }),

    computed: {
        moneda() {
            return store.state?.moneda?.[0]?.simbolo || "S/";
        },

        itemsTabla() {
            return this.modoVista === "CAB" ? this.cabeceras : this.filas;
        },

        headersTabla() {
            const cols = this.modoVista === "CAB" ? this.colsCabSeleccionadas : this.colsDetSeleccionadas;
            const cat = this.modoVista === "CAB" ? this.camposCabecera : this.camposDetalle;

            return cols.map((v) => {
                const f = cat.find((x) => x.value === v);
                return {
                    text: f?.text || v,
                    value: v,
                    sortable: true,
                    align:
                        String(v).includes("total") || String(v).includes("precio") || String(v).includes("cantidad") || String(v).includes("peso")
                            ? "right"
                            : "left",
                };
            });
        },

        totalGeneralVista() {
            // si existe columna total en lo mostrado:
            const totalKey =
                this.modoVista === "CAB"
                    ? (this.colsCabSeleccionadas.includes("total") ? "total" : null)
                    : (this.colsDetSeleccionadas.includes("d_total") ? "d_total" : null);

            if (!totalKey) return this.n2(0);

            const s = (this.itemsTabla || []).reduce((acc, r) => acc + Number(r[totalKey] || 0), 0);
            return this.n2(s);
        },
        productosMap() {
            const arr = store.state.productos || [];
            // si productos viene como objeto {id: {...}}, esto lo soporta también
            const list = Array.isArray(arr) ? arr : Object.values(arr || {});
            const map = Object.create(null);

            for (const p of list) {
                if (!p) continue;
                const id = String(p.id ?? "").trim();
                if (id) map[id] = p;
            }
            return map;
        },
    },
    created() {
        console.log(store.state.productos)
    },
    methods: {
        n2(n) {
            const dec = store.state?.configuracion?.decimal ?? 2;
            return Number(n || 0).toFixed(dec);
        },

        unixInicioFin() {
            const start = moment(String(this.date)).startOf("day").unix();
            const end = moment(String(this.date2)).endOf("day").unix();
            return { start, end };
        },

        async cargar() {
            this.cargando = true;
            this.cabeceras = [];
            this.filas = [];

            try {
                const { start, end } = this.unixInicioFin();

                const snap = await allCabecera()
                    .orderByChild("fecha")
                    .startAt(start)
                    .endAt(end)
                    .once("value");

                if (!snap.exists()) return;

                const cab = [];
                snap.forEach((child) => {
                    const c = child.val() || {};

                    if (String(c.estado || "").toLowerCase() === "anulado") return;

                    const docKey = c.numeracion || c.doc_ref || child.key;

                    cab.push({
                        ...c,
                        _docKey: docKey,
                        numeracion: docKey,
                        fecha_str: moment.unix(Number(c.fecha || 0)).format("YYYY-MM-DD"),
                        vencimiento_str: c.vencimientoDoc ? moment.unix(Number(c.vencimientoDoc || 0)).format("YYYY-MM-DD") : "",
                        total: Number(c.total || 0),
                        pendiente_pago: Number(c.pendiente_pago || 0),
                        peso_total: Number(c.peso_total || 0),
                        total_op_gravadas: Number(c.total_op_gravadas || 0),
                        total_op_exoneradas: Number(c.total_op_exoneradas || 0),
                        total_op_gratuitas: Number(c.total_op_gratuitas || 0),
                        igv: Number(c.igv || 0),
                    });
                });

                cab.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

                // CAB
                if (this.modoVista === "CAB") {
                    this.cabeceras = cab;
                    return;
                }

                // DET
                const pack = await Promise.all(
                    cab.map((h) =>
                        consultaDetalle(h.numeracion)
                            .once("value")
                            .then((detSnap) => {
                                const val = detSnap.val() || [];
                                const dets = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
                                return { h, dets };
                            })
                    )
                );

                const filas = [];
                for (const { h, dets } of pack) {
                    dets.forEach((det, idx) => {
                        const oper = String(det.operacion || "").toUpperCase();
                        const esGratuita = oper === "GRATUITA";
                        console.log(det)
                        const precio = Number(det.precioedita ?? det.precio ?? det.precioVentaUnitario ?? 0);
                        const cantidad = Number(det.cantidad || 0);
                        const total = esGratuita ? 0 : Number((precio * cantidad).toFixed(2));
                        const pid = det.id ? String(det.id) : "";
                        const prod = pid ? (this.productosMap[pid] || null) : null;
                        console.log(prod)
                        // helpers de maestro (ajústalo a tus nombres reales)
                        const marca = prod ? (prod.marca ?? "") : "";
                        const categoria = prod ? (prod.categoria ?? "") : "";
                        const codbarra = prod ? (prod.codbarra ?? "") : "";

                        // si tu proveedor está en otro campo, cámbialo aquí:
                        const proveedor = prod
                            ? (prod.proveedor ?? prod.nom_proveedor ?? prod.razon_social ?? "")
                            : "";
                        filas.push({
                            rid: `${h.numeracion}-${idx}`,

                            // CAB (h_)
                            h_fecha_str: h.fecha_str,
                            h_vendedor: h.vendedor || "",
                            h_dni: h.dni || "",
                            h_cliente: h.cliente || "",
                            h_numeracion: h.numeracion || "",
                            h_estado: h.estado || "",
                            h_forma_pago: h.forma_pago || "",
                            h_total: Number(h.total || 0),
                            h_peso_total: Number(h.peso_total || 0),

                            // DET (d_)
                            d_nombre: det.nombre || "",
                            d_id: det.id ? String(det.id) : "",
                            d_operacion: det.operacion || "",
                            d_medida: det.medida || "",
                            d_factor: Number(det.factor || 0),
                            d_cantidad: cantidad,
                            d_peso: Number(det.peso || 0),
                            d_precio: precio,
                            d_total: total,
                            d_esGratuita: esGratuita ? "SI" : "NO",
                            d_igv: Number(det.igv || 0),

                            d_categoria: categoria,
                            d_marca: marca,
                            d_proveedor: proveedor,
                            d_codbarra: codbarra,
                        });
                    });
                }

                filas.sort((a, b) => {
                    const fa = a.h_fecha_str || "";
                    const fb = b.h_fecha_str || "";
                    if (fa === fb) return String(a.h_cliente || "").localeCompare(String(b.h_cliente || ""));
                    return fa.localeCompare(fb);
                });

                this.filas = filas;
            } catch (e) {
                console.error("Error cargando:", e);
            } finally {
                this.cargando = false;
            }
        },

        exportarExcel() {
            const data = this.itemsTabla || [];
            if (!data.length) return;

            const cols = this.modoVista === "CAB" ? this.colsCabSeleccionadas : this.colsDetSeleccionadas;
            const catalogo = this.modoVista === "CAB" ? this.camposCabecera : this.camposDetalle;

            // armar filas solo con lo seleccionado (y con títulos legibles)
            const rows = data.map((r) => {
                const obj = {};
                for (const key of cols) {
                    const meta = catalogo.find((x) => x.value === key);
                    const titulo = meta?.text || key;
                    obj[titulo] = r[key] ?? "";
                }
                return obj;
            });

            const worksheet = XLSX.utils.json_to_sheet(rows);

            // ancho automático
            const headers = Object.keys(rows[0] || {});
            worksheet["!cols"] = headers.map((h) => ({
                wch: Math.max(h.length, ...rows.map((x) => String(x[h] ?? "").length)) + 2,
            }));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, this.modoVista === "CAB" ? "Cabeceras" : "Detalle");

            XLSX.writeFile(workbook, `reporte_${this.modoVista}_${this.date}_${this.date2}.xlsx`);
        },
        storageKey(tipo) {
            // tipo: "CAB" o "DET"
            // si tienes multi-empresa, puedes agregar aquí BD/RUC también
            const uid = store.state?.user?.uid || store.state?.usuario?.uid || "anon";
            return `reporte_cols_${uid}_${tipo}`;
        },

        guardarPreferencias() {
            try {
                if (this.modoVista === "CAB") {
                    localStorage.setItem(this.storageKey("CAB"), JSON.stringify(this.colsCabSeleccionadas || []));
                } else {
                    localStorage.setItem(this.storageKey("DET"), JSON.stringify(this.colsDetSeleccionadas || []));
                }
            } catch (e) {
                console.warn("No se pudo guardar preferencias:", e);
            }
        },

        cargarPreferencias() {
            try {
                const cab = localStorage.getItem(this.storageKey("CAB"));
                const det = localStorage.getItem(this.storageKey("DET"));

                if (cab) {
                    const arr = JSON.parse(cab);
                    if (Array.isArray(arr) && arr.length) this.colsCabSeleccionadas = arr;
                }

                if (det) {
                    const arr = JSON.parse(det);
                    if (Array.isArray(arr) && arr.length) this.colsDetSeleccionadas = arr;
                }
            } catch (e) {
                console.warn("No se pudo cargar preferencias:", e);
            }
        },

    },

    watch: {
        modoVista() {
            this.cargar();
        },

        colsCabSeleccionadas: {
            deep: true,
            handler() {
                this.guardarPreferencias();
            }
        },

        colsDetSeleccionadas: {
            deep: true,
            handler() {
                this.guardarPreferencias();
            }
        },
    },

    mounted() {
        this.cargarPreferencias(); // ✅ carga lo guardado
        this.cargar();
    },

};
</script>

<style scoped>
.tabla-xs ::v-deep thead th {
    font-size: 11.5px;
    padding: 4px 6px;
}

.tabla-xs ::v-deep tbody td {
    font-size: 12px;
    padding: 2px 6px;
}

.tabla-xs ::v-deep .v-data-footer {
    font-size: 11.5px;
}

.desc-item {
    display: inline-block;
    max-width: 520px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
}
</style>
