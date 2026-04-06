<template>
    <div class="mb-6 mt-3 pa-4">
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio" />
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin" />
                </v-col>
                <v-col cols="12" sm="4">
                    <v-select v-model="sede_actual" :items="vendedoresItems" item-text="text" item-value="value"
                        label="Vendedor" outlined dense clearable @change="cargar" />
                </v-col>
            </v-row>

            <v-row dense class="mt-n4">
                <v-col cols="12" sm="6">
                    <v-btn color="primary" small :loading="cargando" @click="cargar">
                        🔍 Consultar
                    </v-btn>
                    <v-btn class="ml-2" small color="success" :disabled="!filas.length" @click="exportarCSV">
                        <v-icon left small>mdi-download</v-icon> CSV
                    </v-btn>
                    <v-btn class="ml-2" small :color="agrupado ? 'indigo' : 'grey darken-1'" dark
                        @click="agrupado = !agrupado">
                        <v-icon left small>mdi-account-group</v-icon>
                        {{ agrupado ? 'Ver detalle' : 'Agrupar por cliente' }}
                    </v-btn>

                </v-col>

                <v-col cols="12" sm="6" class="text-right">
                    <v-chip class="ml-2" outlined color="success" v-if="!cargando">
                        Contado: {{ monedaSimbolo }} {{ totalContado }}
                    </v-chip>
                    <v-chip class="ml-1"  outlined color="indigo" v-if="!cargando">
                        Crédito: {{ monedaSimbolo }} {{ totalCredito }}
                    </v-chip>
                    <v-chip v-if="!cargando" outlined class="ml-1" >
                        Total General: <strong class="ml-1">{{ monedaSimbolo }} {{ totalGeneral }}</strong>
                    </v-chip>
                </v-col>
            </v-row>

            <v-progress-linear v-if="cargando" indeterminate height="2" class="mt-2" />
        </v-card>

        <v-card class="mt-3">
            <v-data-table class="tabla-xs elevation-1" :headers="headersTabla" :items="itemsTabla"
                :item-key="agrupado ? 'cliente' : 'rid'" dense :items-per-page="100">
                <!-- Slots SOLO en vista detallada -->
                <template v-if="!agrupado" v-slot:item.producto="{ item }">
                    <span>
                        {{ item.producto }}
                        <v-chip v-if="item.esGratuita" x-small color="pink" text-color="white" class="ml-1" label>
                            GRATUITA
                        </v-chip>
                    </span>
                </template>

                <template v-if="!agrupado" v-slot:item.precio="{ item }">
                    {{ monedaSimbolo }}{{ n2(item.precio) }}
                </template>

                <template v-if="!agrupado" v-slot:item.total="{ item }">
                    <span :class="item.esGratuita ? 'grey--text' : ''">
                        <strong>{{ monedaSimbolo }}{{ n2(item.total) }}</strong>
                    </span>
                </template>

                <template v-slot:body.append>
                    <tr class="font-weight-bold">
                        <td :colspan="headersTabla.length - 1" class="text-right">
                            Total General:
                        </td>
                        <td class="text-right">{{ monedaSimbolo }}{{ totalGeneralVista }}</td>
                    </tr>
                </template>
            </v-data-table>

        </v-card>
    </div>
</template>

<script>
import moment from 'moment'
import 'moment/locale/es'
import {
    allCabecera, consultaDetalle, allCabeceraMultiSedes, db,
    consultaCabeceraMultiSedes,
    consultaDetalleMultiSedes
} from '../../db'
import store from '@/store/index'

moment.locale('es')

export default {
    name: 'ReporteClientesProductos',
    data: () => ({
        sede_actual: (store.state.sedeActual.codigo) || '',
        date: moment().format('YYYY-MM-DD'),
        date2: moment().format('YYYY-MM-DD'),
        cargando: false,
        filas: [],
        agrupado: false,
        totalFormaPago: {
            contado: 0,
            credito: 0,
        },
        headers: [
            { text: 'Fecha', value: 'fecha', sortable: true },
            { text: 'Hora', value: 'hora', sortable: true },
            { text: 'Tipo venta', value: 'forma_pago', sortable: true },
            { text: 'Cliente', value: 'cliente', sortable: true },
            { text: 'Doc', value: 'numeracion', sortable: true },
            { text: 'Producto', value: 'producto', sortable: true },
            { text: 'Medida', value: 'medida', sortable: false },
            { text: 'Cant', value: 'cantidad', sortable: false, align: 'right' },
            { text: 'Precio', value: 'precio', sortable: false, align: 'right' },
            { text: 'Total', value: 'total', sortable: false, align: 'right' },
        ],
    }),
    computed: {
        vendedoresItems() {
            const base = Array.isArray(this.$store.state.array_sedes) ? this.$store.state.array_sedes : []
            const items = base
                .filter(s => s && s.codigo)
                .map(s => {
                    const codigo = String(s.codigo || '').trim()
                    const nombre = String(s.nombre || '').trim()
                    return {
                        text: nombre ? `${codigo} - ${nombre}` : codigo,
                        value: codigo,
                    }
                })
                .sort((a, b) => a.text.localeCompare(b.text))
            return [{ text: 'TODOS', value: 'TODOS' }, ...items]
        },
        moneda() {
            return (store.state?.moneda?.[0]?.simbolo) || 'S/'
        },
        totalGeneral() {
            const s = this.filas.reduce((acc, r) => acc + Number(r.total || 0), 0)
            return this.n2(s)
        },
        totalContado() {
            return this.n2(this.totalFormaPago.contado)
        },
        totalCredito() {
            return this.n2(this.totalFormaPago.credito)
        },
        headersTabla() {
            if (!this.agrupado) return this.headers
            return [
                { text: 'Cliente', value: 'cliente', sortable: true },
                { text: 'Docs', value: 'docs', align: 'right', sortable: false },
                { text: 'Ítems', value: 'items', align: 'right', sortable: false },
                { text: 'Cantidad', value: 'cantidad', align: 'right', sortable: false },
                { text: 'Total', value: 'total', align: 'right', sortable: false },
            ]
        },
        itemsTabla() {
            return this.agrupado ? this.filasAgrupadas : this.filas
        },

        // ---- total general de la vista actual
        totalGeneralVista() {
            const arr = this.itemsTabla
            const s = arr.reduce((acc, r) => acc + Number(r.total || 0), 0)
            return this.n2(s)
        },

        // ---- (opcional) total del detalle, si lo quieres conservar
        totalGeneral() {
            const s = this.filas.reduce((acc, r) => acc + Number(r.total || 0), 0)
            return this.n2(s)
        },

        // ---- agrupación por cliente
        filasAgrupadas() {
            const map = new Map()
            for (const r of this.filas) {
                const key = r.cliente || '(Sin nombre)'
                if (!map.has(key)) {
                    map.set(key, {
                        cliente: key,
                        docsSet: new Set(),
                        items: 0,
                        cantidad: 0,
                        total: 0,
                    })
                }
                const acc = map.get(key)
                acc.docsSet.add(r.numeracion)
                acc.items += 1
                acc.cantidad += Number(r.cantidad || 0)
                acc.total += Number(r.total.toFixed(2) || 0)
            }
            // salida ordenada por total desc
            return Array.from(map.values())
                .map(x => ({ ...x, docs: x.docsSet.size })) // convertir Set a número
                .sort((a, b) => b.total - a.total)
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        }
    },
    methods: {
        cargarSedes() {
            if (this.$store.state.array_sedes && this.$store.state.array_sedes.length > 0) {
                this.sedesDisponibles = this.$store.state.array_sedes.map(s => ({
                    nombre: s.nombre,
                    base: s.base,
                    codigo: s.codigo
                }))
                this.sedeSeleccionada = 'TODAS'
            }
        },

        obtenerSedesABuscar() {
            if (this.sedeSeleccionada === 'TODAS') {
                return [...this.sedesDisponibles]
            }

            const sede = this.sedesDisponibles.find(s => s.base === this.sedeSeleccionada)
            return sede ? [sede] : []
        },

        cambiarSede() {
            this.busca()
        },

        async selecciona_item(item) {
            const sedesABuscar = this.obtenerSedesABuscar()
            const cabecera = await consultaCabeceraMultiSedes(sedesABuscar, item.numeracion)

            if (cabecera) {
                const detalleResult = await consultaDetalleMultiSedes(sedesABuscar, item.numeracion)

                let productos = []
                if (detalleResult && detalleResult.detalle) {
                    if (typeof detalleResult.detalle === 'object' && !Array.isArray(detalleResult.detalle)) {
                        productos = Object.values(detalleResult.detalle)
                    } else if (Array.isArray(detalleResult.detalle)) {
                        productos = detalleResult.detalle
                    }
                }

                this.seleccionado = cabecera
                this.detalleProductos = productos
                this.genera_pdf = true
            }
        },

        async ejecutaConsolida(value) {
            store.commit("dialogoprogress")
            this.seleccionado = value
            this.arrayConsolidar = []

            const sedesABuscar = this.obtenerSedesABuscar()
            const resultado = await consultaDetalleMultiSedes(sedesABuscar, value.numeracion)

            if (resultado && resultado.detalle) {
                const detalle = resultado.detalle
                if (typeof detalle === 'object' && !Array.isArray(detalle)) {
                    Object.values(detalle).forEach(item => {
                        this.arrayConsolidar.push(item)
                    })
                } else if (Array.isArray(detalle)) {
                    this.arrayConsolidar = detalle
                }
            }

            this.dialog = true
            store.commit("dialogoprogress")
        },
        n2(n) {
            const dec = store.state?.configuracion?.decimal ?? 2
            return Number(n || 0).toFixed(dec)
        },

        async cargar() {
            this.cargando = true
            this.filas = []
            this.totalFormaPago = { contado: 0, credito: 0 }

            try {
                const sede = (this.$store.state.array_sedes || []).find(
                    s => String(s.codigo) === String(this.sede_actual)
                )

                if (this.sede_actual === 'TODOS') {
                    this.filas = []
                    return
                }

                if (!sede || !sede.base) {
                    this.filas = []
                    return
                }

                const snap = await db
                    .database()
                    .ref(sede.base)
                    .child("comprobantecabecera")
                    .orderByChild("fecha")
                    .startAt(moment(this.date).unix())
                    .endAt(moment(this.date2).endOf("day").unix())
                    .once("value")

                if (!snap.exists()) {
                    this.filas = []
                    return
                }

                const cabeceras = []
                let contado = 0
                let credito = 0
                snap.forEach(child => {
                    const c = child.val()
                    console.log(c)
                    if (String(c.estado || "").toUpperCase() === "ANULADO") return

                    const formaPago = String(c.forma_pago || '').toUpperCase().trim()
                    const totalCabecera = Number(c.total || 0)
                    if (formaPago === 'CONTADO') contado += totalCabecera
                    if (formaPago === 'CREDITO') credito += totalCabecera

                    cabeceras.push(c)
                })

                this.totalFormaPago = { contado, credito }

                const pack = await Promise.all(
                    cabeceras.map(async cab => {
                        const detSnap = await db
                            .database()
                            .ref(sede.base)
                            .child("comprobantedetalle")
                            .child(cab.numeracion)
                            .once("value")

                        const val = detSnap.val() || []
                        const dets = Array.isArray(val) ? val.filter(Boolean) : Object.values(val || {})
                        return { cab, dets }
                    })
                )

                const filas = []
                for (const { cab, dets } of pack) {
                    const fechaMoment = moment.unix(Number(cab.fecha || 0))
                    const fechaStr = fechaMoment.format("YYYY-MM-DD")
                    const horaStr = fechaMoment.format("HH:mm:ss")
                    const fechaHoraStr = fechaMoment.format("YYYY-MM-DD HH:mm:ss")
                    const dni = cab.dni || cab.documento || ""
                    const formaPago = cab.forma_pago || ""

                    dets.forEach((det, idx) => {
                        const esGratuita = String(det.operacion || "").toUpperCase() === "GRATUITA"
                        const precio = Number(det.precio ?? 0)
                        const cantidad = Number(det.cantidad || 0)
                        const total = esGratuita ? 0 : precio * cantidad

                        filas.push({
                            rid: `${cab.numeracion}-${idx}`,
                            fecha: fechaStr,
                            hora: horaStr,
                            fechaHora: fechaHoraStr,
                            forma_pago: formaPago,
                            cliente: cab.cliente || "",
                            dni,
                            numeracion: cab.numeracion || "",
                            producto: det.nombre || det.id || "",
                            medida: det.medida || "",
                            cantidad,
                            precio,
                            total,
                            esGratuita,
                        })
                    })
                }

                this.filas = filas.sort((a, b) => {
                    if (a.fecha === b.fecha) {
                        return String(a.cliente || "").localeCompare(String(b.cliente || ""))
                    }
                    return String(a.fecha).localeCompare(String(b.fecha))
                })
            } catch (error) {
                console.error("Error cargando reporte:", error)
                this.filas = []
            } finally {
                this.cargando = false
            }
        },

        exportarCSV() {
            if (!this.filas.length) return

            const rows = [
                ["Fecha", "Cliente", "Doc", "Producto", "Medida", "Cantidad", "Precio", "Total", "Gratuita"],
                ...this.filas.map(r => [
                    r.fecha,
                    r.cliente,
                    r.numeracion,
                    r.producto,
                    r.medida,
                    r.cantidad,
                    this.n2(r.precio),
                    this.n2(r.total),
                    r.esGratuita ? "SI" : "NO",
                ])
            ]

            const csv = rows
                .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
                .join("\n")

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `reporte_clientes_productos_${this.date}_${this.date2}.csv`
            a.click()
            URL.revokeObjectURL(url)
        },
        async busca() {
            store.commit("dialogoprogress")

            try {
                const sedesABuscar = this.obtenerSedesABuscar()

                if (this.num_doc != '') {
                    const numeracion = this.tipo_doc + this.num_doc.toString().padStart(8, 0)
                    const resultado = await consultaCabeceraMultiSedes(sedesABuscar, numeracion)

                    if (resultado) {
                        resultado.color = this.asigna_color_doc(resultado)
                        this.desserts = [resultado]
                    } else {
                        this.desserts = []
                        store.commit('dialogosnackbar', 'Comprobante no existe')
                    }
                } else {
                    const resultados = await allCabeceraMultiSedes(sedesABuscar, this.date, this.date2)
                    resultados.forEach(item => {
                        item.color = this.asigna_color_doc(item)
                    })
                    this.desserts = resultados
                }
            } finally {
                store.commit("dialogoprogress")
            }
        },
    },
    mounted() {
        // carga inicial (hoy)
        this.cargar()
    },
}
</script>
<style scoped>
/* Reduce tipografía y paddings solo en esta tabla */
.tabla-xs ::v-deep .v-data-table__wrapper table {
    font-size: 1px;
}

.tabla-xs ::v-deep thead th {
    font-size: 11.5px;
    padding: 4px 6px;
}

.tabla-xs ::v-deep tbody td {
    font-size: 12px;
    padding: 2px 6px;
}

/* Pie de tabla (paginación) más pequeño */
.tabla-xs ::v-deep .v-data-footer {
    font-size: 11.5px;
}

/* Chips dentro de la tabla aún más compactos */
.tabla-xs ::v-deep .v-chip {
    height: 18px;
    line-height: 18px;
    font-size: 10.5px;
}

/* Opcional: números alineados a la derecha con menos ancho */
.tabla-xs ::v-deep td.text-right,
.tabla-xs ::v-deep th.text-right {
    text-align: right;
}
</style>
