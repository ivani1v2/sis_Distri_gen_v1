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
                    <v-select v-model="sede_actual" :items="$store.state.array_sedes" item-text="nombre"
                        item-value="codigo" label="Vendedor" outlined dense clearable />
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
                    <v-chip v-if="!cargando" outlined>
                        Total General: <strong class="ml-1">{{ moneda }} {{ totalGeneral }}</strong>
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
                    {{ moneda }} {{ n2(item.precio) }}
                </template>

                <template v-if="!agrupado" v-slot:item.total="{ item }">
                    <span :class="item.esGratuita ? 'grey--text' : ''">
                        {{ moneda }} {{ n2(item.total) }}
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
import moment from 'moment'
import 'moment/locale/es'
import { allCabecera, consultaDetalle } from '../../db'
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
        headers: [
            { text: 'Fecha', value: 'fecha', sortable: true },
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
        moneda() {
            return (store.state?.moneda?.[0]?.simbolo) || 'S/'
        },
        totalGeneral() {
            const s = this.filas.reduce((acc, r) => acc + Number(r.total || 0), 0)
            return this.n2(s)
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
    },
    methods: {
        n2(n) {
            const dec = store.state?.configuracion?.decimal ?? 2
            return Number(n || 0).toFixed(dec)
        },
        unixInicioFin() {
            // Lo que pediste textual:
            const start = moment(String(this.date)) / 1000
            const end = moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000
            return { start, end }
        },
        async cargar() {
            this.cargando = true
            this.filas = []
            try {
                const { start, end } = this.unixInicioFin()

                // 1) Cabeceras por rango de fecha
                const snap = await allCabecera()
                    .orderByChild('fecha')
                    .startAt(start)
                    .endAt(end)
                    .once('value')

                if (!snap.exists()) {
                    this.filas = []
                    this.cargando = false
                    return
                }

                // 2) Filtra ANULADOS y por sede (si se eligió)
                const cabeceras = []
                snap.forEach((child) => {
                    const c = child.val()
                    if (String(c.estado || '').toLowerCase() === 'anulado') return
                    console.log(c, this.sede_actual)
                    if (this.sede_actual && c.vendedor && String(c.vendedor) !== String(this.sede_actual)) return
                    cabeceras.push(c)
                })

                if (!cabeceras.length) {
                    this.filas = []
                    return
                }

                // 3) Para cada cabecera, trae detalles
                const pack = await Promise.all(
                    cabeceras.map(cab =>
                        consultaDetalle(cab.numeracion).once('value').then(detSnap => {
                            const val = detSnap.val() || []
                            const dets = Array.isArray(val) ? val.filter(Boolean) : Object.values(val)
                            return { cab, dets }
                        })
                    )
                )

                // 4) Aplanar filas
                console.log(pack)
                const filas = []
                for (const { cab, dets } of pack) {
                    const fechaStr = moment.unix(Number(cab.fecha || 0)).format('YYYY-MM-DD')
                    const dni = cab.dni || cab.documento || ''
                    dets.forEach((det, idx) => {
                        const esGratuita = String(det.operacion || '').toUpperCase() === 'GRATUITA'
                        const precio = Number(det.precioedita ?? det.precio ?? 0)
                        const cantidad = Number(det.cantidad || 0)
                        const total = esGratuita ? 0 : (precio * cantidad)
                        filas.push({
                            rid: `${cab.numeracion}-${idx}`,        // 👈 clave única
                            fecha: fechaStr,
                            cliente: cab.cliente || '',
                            dni,
                            producto: det.nombre || (det.id ? String(det.id) : ''),
                            medida: det.medida || '',
                            numeracion: cab.numeracion || '',
                            cantidad,
                            precio,
                            total,
                            esGratuita,
                        })
                    })
                }
                this.filas = filas.sort((a, b) => {
                    if (a.fecha === b.fecha) return (a.cliente || '').localeCompare(b.cliente || '')
                    return a.fecha.localeCompare(b.fecha)
                })
            } catch (e) {
                console.error('Error cargando reporte:', e)
                this.filas = []
            } finally {
                this.cargando = false
            }
        },
        exportarCSV() {
            if (!this.filas.length) return
            const rows = [
                ['Fecha', 'Cliente', 'Doc', 'Producto', 'Medida', 'Cantidad', 'Precio', 'Total', 'Gratuita'],
                ...this.filas.map(r => [
                    r.fecha,
                    r.cliente,
                    r.dni,
                    r.producto,
                    r.medida,
                    r.cantidad,
                    this.n2(r.precio),
                    this.n2(r.total),
                    r.esGratuita ? 'SI' : 'NO',
                ])
            ]
            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `reporte_clientes_productos_${this.date}_${this.date2}.csv`
            a.click()
            URL.revokeObjectURL(url)
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
