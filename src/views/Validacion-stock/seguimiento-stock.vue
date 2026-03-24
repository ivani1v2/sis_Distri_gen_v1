<template>
    <v-container fluid class="pa-2 pa-md-4 mb-8">
        <v-card class="elevation-4 rounded-lg mb-4">
            <v-card-title class="blue-grey lighten-5 py-3">
                <span class="font-weight-medium blue-grey--text text--darken-3">
                    SEGUIMIENTO DE STOCK
                </span>
                <v-spacer></v-spacer>
                <v-chip :color="resumen.inconsistentes > 0 ? 'error' : 'success'" outlined>
                    <v-icon left small>{{ resumen.inconsistentes > 0 ? 'mdi-alert' : 'mdi-check' }}</v-icon>
                    {{ resumen.consistentes }}/{{ resumen.total }} consistentes
                </v-chip>
            </v-card-title>
        </v-card>
        <v-card class="elevation-2 rounded-lg mb-4">
            <v-card-text class="pb-2">
                <v-row dense align="center">
                    <v-col cols="12" sm="2" md="1">
                        <v-btn color="primary" @click="cargarTodo" :loading="cargando" block class="font-weight-bold">
                            <v-icon left small>mdi-magnify</v-icon>
                            Cargar
                        </v-btn>
                    </v-col>

                    <v-col cols="12" sm="5" md="4">
                        <v-text-field v-model="filtros.busqueda" label="Buscar producto (ID o nombre)" outlined dense
                            hide-details prepend-inner-icon="mdi-magnify" clearable
                            placeholder="Ej: 1090 o CERA PASTA..." />
                    </v-col>
                    <v-col cols="12" sm="5" md="3">
                        <v-select v-model="filtros.estado" :items="opcionesEstado" label="Estado de consistencia"
                            outlined dense hide-details prepend-inner-icon="mdi-alert-circle" />
                    </v-col>
                    <v-col cols="12" sm="2" md="2">
                        <v-btn color="error" @click="corregirStockErrores" :loading="cargando" block
                            class="font-weight-bold">
                            <v-icon left small>mdi-database-sync</v-icon>
                            Corregir
                        </v-btn>
                    </v-col>
                </v-row>

                <!-- Botones de exportación -->
            </v-card-text>
        </v-card>
        <v-row dense class="mb-4">
            <v-col cols="6" sm="2">
                <v-card class="elevation-2 rounded-lg text-center pa-2" color="blue lighten-5">
                    <div class="text-caption blue--text">PRODUCTOS</div>
                    <div class="font-weight-bold blue--text text-h6">{{ resumen.total }}</div>
                </v-card>
            </v-col>
            <v-col cols="6" sm="2">
                <v-card class="elevation-2 rounded-lg text-center pa-2" color="green lighten-5">
                    <div class="text-caption green--text">CONSISTENTES</div>
                    <div class="font-weight-bold green--text text-h6">{{ resumen.consistentes }}</div>
                </v-card>
            </v-col>
            <v-col cols="6" sm="2">
                <v-card class="elevation-2 rounded-lg text-center pa-2" color="orange lighten-5">
                    <div class="text-caption orange--text">INCONSISTENTES</div>
                    <div class="font-weight-bold orange--text text-h6">{{ resumen.inconsistentes }}</div>
                </v-card>
            </v-col>
            <v-col cols="6" sm="3">
                <v-card class="elevation-2 rounded-lg text-center pa-2" color="purple lighten-5">
                    <div class="text-caption purple--text">DIF. ACUMULADA</div>
                    <div class="font-weight-bold purple--text text-h6">{{ formatNumber(resumen.diferenciaAcumulada) }}
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="3">
                <v-card class="elevation-2 rounded-lg text-center pa-2"
                    :color="resumen.inconsistentes > 0 ? 'error lighten-5' : 'success lighten-5'">
                    <div class="text-caption">ESTADO GENERAL</div>
                    <div class="font-weight-bold" :class="resumen.inconsistentes > 0 ? 'error--text' : 'success--text'">
                        {{ resumen.inconsistentes > 0 ? 'INCONSISTENTE' : 'CONSISTENTE' }}
                    </div>
                </v-card>
            </v-col>
        </v-row>
        <v-card v-if="cargando" class="elevation-2 rounded-lg mb-4">
            <v-card-text class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
                <div class="mt-4 grey--text">Cargando datos de stock período, pre-venta y pedidos pendientes...</div>
                <div class="caption grey--text mt-2">{{ estadoCarga }}</div>
            </v-card-text>
        </v-card>
        <v-card v-else class="elevation-2 rounded-lg">
            <v-data-table :headers="headers" :items="datosFiltrados" :items-per-page="25"
                :footer-props="{ 'items-per-page-options': [15, 50, 100, -1] }" dense class="elevation-0" must-sort
                :sort-by="['consistente', 'id']" :sort-desc="[false, false]">
                <template v-slot:[`item.id`]="{ item }">
                    <v-chip small :color="item.consistente ? 'primary' : 'error lighten-4'"
                        :text-color="item.consistente ? 'primary' : 'error'" outlined>
                        {{ item.id }}
                    </v-chip>
                </template>
                <template v-slot:[`item.nombre`]="{ item }">
                    <div>
                        <span :class="!item.consistente ? 'font-weight-bold red--text' : ''">{{ item.nombre }}</span>

                    </div>
                </template>
                <template v-slot:[`item.stock_periodo`]="{ item }">
                    <span :class="!item.consistente ? 'font-weight-bold' : ''">{{ formatStock(item.stock_periodo,
                        item.factor)
                    }}</span>
                </template>
                <template v-slot:[`item.stock_prevenda`]="{ item }">
                    <span>{{ formatStock(item.stock_prevenda, item.factor) }}</span>
                </template>
                <template v-slot:[`item.pedidos_pendientes`]="{ item }">
                    <v-chip small :color="item.pedidos_pendientes > 0 ? 'warning' : 'grey'"
                        :outlined="item.pedidos_pendientes === 0" dark>
                        {{ formatNumber(item.pedidos_pendientes) }}
                    </v-chip>
                </template>
                <template v-slot:[`item.stock_prevenda_real`]="{ item }">
                    <span>{{ formatStock(item.stock_prevenda_real, item.factor) }}</span>
                </template>
                <template v-slot:[`item.estado`]="{ item }">
                    <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <v-chip small :color="item.consistente ? 'success' : 'error'" dark v-bind="attrs" v-on="on">
                                <v-icon left small>{{ item.consistente ? 'mdi-check-circle' : 'mdi-alert-circle'
                                }}</v-icon>
                                {{ item.consistente ? 'OK' : 'ERROR' }}
                            </v-chip>
                        </template>
                        <span>{{ item.mensaje }}</span>
                    </v-tooltip>
                </template>
                <template v-slot:body.append>
                    <tr class="grey lighten-3 font-weight-bold">
                        <td colspan="2" class="text-right">TOTALES:</td>
                        <td class="text-right">{{ formatNumber(resumen.totalStockPeriodo) }}</td>
                        <td class="text-center">{{ formatNumber(resumen.totalPendientes) }}</td>
                        <td class="text-right">{{ formatNumber(resumen.totalStockPrevendaReal) }}</td>
                        <td></td>
                    </tr>
                </template>
                <template v-slot:no-data>
                    <v-alert type="info" border="left" outlined class="ma-4" dense>
                        <span v-if="!datosCargados">
                            Seleccione un período y haga clic en "Cargar" para validar consistencia.
                        </span>
                        <span v-else>
                            No se encontraron productos con los filtros aplicados.
                        </span>
                    </v-alert>
                </template>
            </v-data-table>
        </v-card>
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.text }}
            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="snackbar.show = false">Cerrar</v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { all_pedidos, detalle_pedido, editaProducto } from '../../db'
import axios from 'axios'
import moment from 'moment'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default {
    name: 'SeguimientoStock',

    data() {
        return {
            filtros: {
                anio: new Date().getFullYear(),
                mes: new Date().getMonth() + 1,
                busqueda: '',
                id: '',
                descripcion: '',
                proveedor: null,
                estado: 'TODOS'
            },
            opcionesEstado: [
                { text: 'Todos', value: 'TODOS' },
                { text: 'Solo consistentes', value: 'CONSISTENTES' },
                { text: 'Solo inconsistentes', value: 'INCONSISTENTES' }
            ],
            stockPeriodo: [],
            pedidosPendientesDetalle: [],
            cargando: false,
            datosCargados: false,
            estadoCarga: '',
            years: [],
            meses: [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ],
            headers: [
                { text: 'ID', value: 'id', align: 'start', width: 100 },
                { text: 'Producto', value: 'nombre', width: 300 },
                { text: 'Stock Período', value: 'stock_periodo', align: 'right', width: 120 },
                { text: 'Stock Pre-Venta', value: 'stock_prevenda', align: 'right', width: 120 },          // 👈 sistema
                { text: 'Pedidos Pend.', value: 'pedidos_pendientes', align: 'center', width: 110 },
                { text: 'Stock Pre-Venta (REAL)', value: 'stock_prevenda_real', align: 'right', width: 150 }, // 👈 nuevo
                { text: 'Estado', value: 'estado', align: 'center', width: 100 }
            ],
            snackbar: { show: false, text: '', color: 'success' },
            dialogoDetallePedidos: false,
            productoSeleccionado: null,
            pedidosDelProducto: [],
            cargandoDetalles: false,
            pendientesPorProducto: {},     // { [prodId]: unidadesPendientes }
            numPedidosPorProducto: {},     // { [prodId]: cantidadPedidosUnicos }
        }
    },

    computed: {
        ...mapState({
            productos: state => state.productos || []
        }),
        mesesSelect() {
            return this.meses.map((mes, index) => ({
                text: mes,
                value: index + 1
            }));
        },
        periodoSeleccionado() {
            const mes = String(this.filtros.mes).padStart(2, '0');
            return `${mes}-${this.filtros.anio}`;
        },
        datosConsolidados() {
            if (!this.datosCargados) return []

            // factor y stock PV (sistema) desde store.productos
            const factorMap = new Map()
            const prevendaMap = new Map()

                ; (this.productos || []).forEach(p => {
                    const id = String(p.id || '')
                    if (!id) return
                    factorMap.set(id, Number(p.factor || 1) || 1)
                    prevendaMap.set(id, Number(p.stock || 0) || 0)
                })

            return (this.stockPeriodo || [])
                .map(sp => {
                    const prodId = String(sp.id || sp.pid || '')
                    if (!prodId) return null

                    const productoStore = (this.productos || []).find(p => String(p.id) === prodId) || {}

                    const factor = factorMap.get(prodId) || 1
                    const stockPeriodo = Number(sp.saldo_final || 0) || 0
                    const stockPrevenda = prevendaMap.get(prodId) ?? 0  // PV sistema
                    const pedidosPend = Number(this.pendientesPorProducto?.[prodId] || 0) || 0

                    // ✅ PV REAL = período - pendientes
                    const stockPrevendaReal = stockPeriodo - pedidosPend

                    // ✅ consistente si PV sistema == PV real (tolerancia por decimales)
                    const consistente = Math.abs(stockPrevenda - stockPrevendaReal) < 1e-6

                    return {
                        id: prodId,
                        nombre: productoStore.nombre || sp.nombre || 'Sin nombre',
                        proveedor: productoStore.proveedor || sp.proveedor || '-', // por si usas filtro proveedor
                        factor,
                        stock_periodo: stockPeriodo,
                        stock_prevenda: stockPrevenda,
                        pedidos_pendientes: pedidosPend,
                        stock_prevenda_real: stockPrevendaReal,
                        consistente,
                        mensaje: consistente
                            ? 'Consistente'
                            : `INCONSISTENTE: PV(${stockPrevenda}) vs REAL(${stockPrevendaReal})`,
                    }
                })
                .filter(Boolean)
        },
        datosFiltrados() {
            let filtrados = [...this.datosConsolidados]
            if (this.filtros.busqueda) {
                const busq = this.filtros.busqueda.toLowerCase()
                filtrados = filtrados.filter(item =>
                    String(item.id).toLowerCase().includes(busq) ||
                    item.nombre.toLowerCase().includes(busq)
                )
            }
            if (this.filtros.proveedor) {
                filtrados = filtrados.filter(item =>
                    item.proveedor === this.filtros.proveedor
                )
            }
            if (this.filtros.estado === 'CONSISTENTES') {
                filtrados = filtrados.filter(item => item.consistente)
            } else if (this.filtros.estado === 'INCONSISTENTES') {
                filtrados = filtrados.filter(item => !item.consistente)
            }

            return filtrados
        },
        proveedoresDisponibles() {
            const proveedores = new Set()
            this.datosConsolidados
            return ['TODOS', ...Array.from(proveedores).sort()]
        },
        resumen() {
            const total = this.datosFiltrados.length
            const consistentes = this.datosFiltrados.filter(i => i.consistente).length
            const inconsistentes = total - consistentes

            // diferencia acumulada ahora: |PV sistema - PV real|
            const diferenciaAcumulada = this.datosFiltrados.reduce(
                (acc, item) => acc + Math.abs((Number(item.stock_prevenda || 0)) - (Number(item.stock_prevenda_real || 0))),
                0
            )

            const totalStockPeriodo = this.datosFiltrados.reduce((acc, i) => acc + (Number(i.stock_periodo || 0)), 0)
            const totalStockPrevenda = this.datosFiltrados.reduce((acc, i) => acc + (Number(i.stock_prevenda || 0)), 0)
            const totalPendientes = this.datosFiltrados.reduce((acc, i) => acc + (Number(i.pedidos_pendientes || 0)), 0)
            const totalStockPrevendaReal = this.datosFiltrados.reduce((acc, i) => acc + (Number(i.stock_prevenda_real || 0)), 0)

            return {
                total,
                consistentes,
                inconsistentes,
                diferenciaAcumulada,
                totalStockPeriodo,
                totalStockPrevenda,
                totalPendientes,
                totalStockPrevendaReal
            }
        },
    },

    created() {
        this.generarYears()
    },

    methods: {
        convierte_stock(stockTotal, factor) {
            const total = Number(stockTotal || 0)
            const f = Number(factor || 1) || 1
            const cajas = Math.floor(total / f)
            const und = total - (cajas * f)
            return { entero: cajas, und }
        },

        async corregirStockErrores() {
            try {
                if (!this.datosCargados) {
                    this.mostrarSnackbar('Primero debes cargar los datos.', 'warning')
                    return
                }

                // SOLO inconsistentes (no dependas del filtro actual)
                const errores = (this.datosConsolidados || []).filter(x => !x.consistente)

                if (!errores.length) {
                    this.mostrarSnackbar('No hay productos con error.', 'success')
                    return
                }

                const ok = confirm(`Se actualizará el stock en ${errores.length} productos (solo errores). ¿Continuar?`)
                if (!ok) return

                this.cargando = true
                this.estadoCarga = 'Corrigiendo stock en productos...'

                const CONCURRENCY = 20

                for (let i = 0; i < errores.length; i += CONCURRENCY) {
                    const chunk = errores.slice(i, i + CONCURRENCY)
                    this.estadoCarga = `Corrigiendo ${Math.min(i + CONCURRENCY, errores.length)}/${errores.length}`

                    await Promise.all(chunk.map(async (row) => {
                        const prod = (this.productos || []).find(p => String(p.id) === String(row.id)) || {}
                        const factor = Number(prod.factor || row.factor || 1) || 1

                        // stock_prevenda_real es el total en unidades base
                        const stockTotal = Number(row.stock_prevenda_real || 0)

                        // si quieres forzar entero:
                        const stockTotalInt = Math.round(stockTotal)

                        const conv = this.convierte_stock(stockTotalInt, factor)

                        // ✅ actualiza los 3 campos en tabla productos
                        console.log(stockTotalInt)
                        await Promise.all([
                            editaProducto(row.id, 'stock', stockTotalInt),
                        ])
                    }))

                    await this.$nextTick()
                }

                this.mostrarSnackbar(`Stock corregido en ${errores.length} productos.`, 'success')
            } catch (e) {
                console.error(e)
                this.mostrarSnackbar('Error corrigiendo stock: ' + (e.message || e), 'error')
            } finally {
                this.cargando = false
                this.estadoCarga = ''
            }
        },

        generarYears() {
            const currentYear = new Date().getFullYear()
            for (let year = 2022; year <= currentYear; year++) {
                this.years.push(year)
            }
        },

        async cargarTodo() {
            this.cargando = true
            this.datosCargados = false
            this.estadoCarga = 'Verificando productos...'

            try {
                this.estadoCarga = 'Esperando carga de productos...'
                await this.waitForProducts()
                if (this.productos.length === 0) {
                    console.warn('No hay productos en store después de esperar')
                    if (this.$store.dispatch) {
                        try {
                            this.estadoCarga = 'Cargando productos manualmente...'
                            //await this.$store.dispatch('cargarProductos')
                            await new Promise(r => setTimeout(r, 500))
                        } catch (e) {
                            console.error('Error cargando productos:', e)
                        }
                    }
                }
                this.estadoCarga = 'Cargando stock del período...'
                await this.cargarStockPeriodo()
                this.estadoCarga = 'Cargando pedidos pendientes...'
                await this.cargarPedidosPendientes()
                this.datosCargados = true
                const total = this.datosConsolidados.length
                const inconsistentes = this.datosConsolidados.filter(i => !i.consistente).length
                const msg = `Carga completada: ${total} productos, ${inconsistentes} inconsistencias`
                this.mostrarSnackbar(msg, inconsistentes > 0 ? 'warning' : 'success')
            } catch (error) {
                console.error('Error en carga:', error)
                this.mostrarSnackbar('Error: ' + error.message, 'error')
            } finally {
                this.cargando = false
                this.estadoCarga = ''
            }
        },

        waitForProducts() {
            return new Promise(resolve => {
                if (this.productos.length > 0) return resolve()
                const unwatch = this.$store.watch(
                    state => state.productos,
                    productos => {
                        if (productos?.length > 0) {
                            unwatch()
                            resolve()
                        }
                    },
                    { immediate: true }
                )
                setTimeout(() => { unwatch(); resolve() }, 5000)
            })
        },

        async cargarStockPeriodo() {
            try {
                console.log('Solicitando stock período para:', this.periodoSeleccionado)

                const response = await axios.post(
                    'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                    {
                        bd: this.$store.state.baseDatos.bd,
                        data: { periodo: this.periodoSeleccionado, allowFullScan: true },
                        metodo: 'reporte_stock_actual'
                    },
                    { timeout: 30000 }
                )

                if (!response.data?.data?.ok) {
                    console.error('Error en respuesta:', response.data)
                    throw new Error('Error en respuesta de stock período')
                }

                const items = response.data.data.items || []

                this.stockPeriodo = items.map(item => {
                    const saldoFinal = Number(item.saldo_final || 0)
                    const saldoInicial = Number(item.saldo_inicial || 0)
                    const sumMes = Number(item.sum_mes || 0)
                    const movsMes = Number(item.movs_mes || 0)

                    return {
                        id: String(item.pid || ''),
                        pid: item.pid,
                        nombre: item.nombre || 'Sin nombre',
                        proveedor: item.proveedor || '',
                        saldo_inicial: Math.round(saldoInicial),
                        saldo_final: Math.round(saldoFinal),
                        sum_mes: Math.round(sumMes),
                        movs_mes: Math.round(movsMes)
                    }
                })

            } catch (error) {
                console.error('Error cargando stock período:', error)
                throw error
            }
        },

        async cargarPedidosPendientes() {
            try {
                const snapshot = await all_pedidos()
                    .orderByChild('estado')
                    .equalTo('pendiente')
                    .once('value')

                const cabeceras = snapshot.val() || {}
                const pedidosIds = Object.keys(cabeceras)

                if (!pedidosIds.length) {
                    this.pendientesPorProducto = {}
                    this.numPedidosPorProducto = {}
                    return
                }

                const unidadesMap = new Map()
                const pedidosSetMap = new Map()
                const CONCURRENCY = 20

                for (let i = 0; i < pedidosIds.length; i += CONCURRENCY) {
                    const chunk = pedidosIds.slice(i, i + CONCURRENCY)
                    this.estadoCarga = `Leyendo detalles: ${Math.min(i + CONCURRENCY, pedidosIds.length)}/${pedidosIds.length}`

                    const snaps = await Promise.all(
                        chunk.map(async (pedidoId) => {
                            try {
                                const ds = await detalle_pedido(pedidoId).once('value')
                                return { pedidoId, val: ds.val() }
                            } catch (e) {
                                return { pedidoId, val: null }
                            }
                        })
                    )

                    for (const { pedidoId, val } of snaps) {
                        if (!val) continue

                        const lineas = Array.isArray(val) ? val : Object.values(val)

                        for (const linea of lineas) {
                            const prodId = String(linea?.id || linea?.codigo || '')
                            if (!prodId) continue

                            const cant = Number(linea?.cantidad || 0)
                            if (!cant) continue

                            const factor = Number(linea?.factor || 1) || 1
                            const medida = String(linea?.medida || '').toUpperCase()

                            const esUnidad = (medida === 'UNIDAD' || medida === 'UND' || medida === 'NIU')
                            const unidades = esUnidad ? cant : (cant * factor)

                            unidadesMap.set(prodId, (unidadesMap.get(prodId) || 0) + unidades)

                            if (!pedidosSetMap.has(prodId)) pedidosSetMap.set(prodId, new Set())
                            pedidosSetMap.get(prodId).add(pedidoId)
                        }
                    }

                    await this.$nextTick()
                }

                const pendObj = {}
                const numObj = {}

                for (const [prodId, unidades] of unidadesMap.entries()) {
                    pendObj[prodId] = unidades
                }
                for (const [prodId, set] of pedidosSetMap.entries()) {
                    numObj[prodId] = set.size
                }

                this.pendientesPorProducto = pendObj
                this.numPedidosPorProducto = numObj

            } catch (error) {
                console.error('Error cargando pedidos pendientes:', error)
                throw error
            }
        },

        toNumber(v) {
            if (v === null || v === undefined) return 0
            const n = Number(v)
            return Number.isFinite(n) ? n : 0
        },

        formatNumber(v) {
            return this.toNumber(v).toLocaleString('es-PE')
        },

        formatStock(unidades, factor) {
            const s = this.toNumber(unidades)
            const f = this.toNumber(factor)
            return s.toLocaleString('es-PE')
        },

        mostrarSnackbar(text, color = 'success') {
            this.snackbar.text = text
            this.snackbar.color = color
            this.snackbar.show = true
        },

        nowString() {
            const d = new Date()
            const pad = s => String(s).padStart(2, '0')
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
        },

        convertirAUnidades(valor, factor) {
            const v = this.toNumber(valor)
            const f = this.toNumber(factor)
            if (f <= 1) return v
            return v * f
        },

        // Exportar a Excel
        exportarExcel() {
            try {
                const data = this.datosFiltrados.map(item => ({
                    ID: item.id,
                    Producto: item.nombre,
                    Proveedor: item.proveedor,
                    'Stock Período': item.stock_periodo,
                    'Stock Pre-Venta': item.stock_prevenda,
                    'Pedidos Pend.': item.pedidos_pendientes,
                    'Dif. Esperada': item.diferencia_esperada,
                    Consistente: item.consistente ? 'SÍ' : 'NO',
                    Mensaje: item.mensaje
                }))
                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.json_to_sheet(data)
                ws['!cols'] = [
                    { wch: 10 },
                    { wch: 40 },
                    { wch: 20 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 10 },
                    { wch: 60 }
                ]
                XLSX.utils.book_append_sheet(wb, ws, 'Seguimiento Stock')
                XLSX.writeFile(wb, `seguimiento_stock_${this.periodoSeleccionado}_${this.nowString()}.xlsx`)
                this.mostrarSnackbar('Excel exportado correctamente', 'success')
            } catch (error) {
                console.error('Error exportando Excel:', error)
                this.mostrarSnackbar('Error al exportar Excel', 'error')
            }
        },

        exportarPDF() {
            try {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
                doc.setFontSize(14)
                doc.text(`Seguimiento de Stock - Período ${this.periodoSeleccionado}`, 40, 40)
                doc.setFontSize(10)
                doc.text(`Fecha: ${moment().format('DD/MM/YYYY HH:mm')}`, 40, 60)
                const resumenText = `Productos: ${this.resumen.total} | Consistentes: ${this.resumen.consistentes} | Inconsistentes: ${this.resumen.inconsistentes} | Dif. Acumulada: ${this.formatNumber(this.resumen.diferenciaAcumulada)}`
                doc.text(resumenText, 40, 80)
                const headers = [['ID', 'Producto', 'Proveedor', 'Stock Per.', 'Stock P.V.', 'Pend.', 'Dif. Esp.', 'Estado']]
                const rows = this.datosFiltrados.map(item => [
                    item.id,
                    item.nombre.substring(0, 30),
                    item.proveedor,
                    item.stock_periodo,
                    item.stock_prevenda,
                    item.pedidos_pendientes,
                    item.diferencia_esperada,
                    item.consistente ? 'OK' : 'ERROR'
                ])
                doc.autoTable({
                    head: headers,
                    body: rows,
                    startY: 100,
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [63, 81, 181] },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 200 },
                        2: { cellWidth: 100 },
                        3: { halign: 'right', cellWidth: 60 },
                        4: { halign: 'right', cellWidth: 60 },
                        5: { halign: 'center', cellWidth: 50 },
                        6: { halign: 'right', cellWidth: 60 },
                        7: { halign: 'center', cellWidth: 50 }
                    },
                    didDrawPage: (data) => {
                        const footerText = `Página ${doc.internal.getNumberOfPages()} - ${this.periodoSeleccionado}`
                        doc.setFontSize(8)
                        doc.text(footerText, doc.internal.pageSize.getWidth() - 120, doc.internal.pageSize.getHeight() - 10)
                    }
                })
                doc.save(`seguimiento_stock_${this.periodoSeleccionado}_${this.nowString()}.pdf`)
                this.mostrarSnackbar('PDF exportado correctamente', 'success')
            } catch (error) {
                console.error('Error exportando PDF:', error)
                this.mostrarSnackbar('Error al exportar PDF', 'error')
            }
        }
    }
}
</script>

<style scoped>
.v-data-table {
    font-size: 13px;
}
</style>