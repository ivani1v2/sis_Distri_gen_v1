<template>
    <div class="mb-6 mt-1 pa-2">
        <!-- Resumen de saldos -->
        <v-btn v-if="false" color="primary" @click="saldo_inicial_todos">
            <v-icon left>mdi-magnify</v-icon>
            crea saldos iniciales
        </v-btn>

        <v-row dense>
            <!-- Selección de periodo -->
            <v-col cols="12" sm="4">
                <v-select v-model="periodo" :items="periodos" label="Periodo" outlined dense />
            </v-col>

            <!-- Selección de producto -->
            <!-- Selección de producto -->
            <v-col cols="12" md="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                <v-autocomplete v-model="buscar" :items="$store.state.productos"
                    :item-text="item => `${item.id} - ${item.nombre}`" item-value="id" label="Buscar producto" clearable
                    outlined dense prepend-inner-icon="mdi-magnify" />
            </v-col>

            <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                <v-btn block color="primary" @click="inicio" :disabled="cargando">
                    <v-icon left>mdi-magnify</v-icon>
                    Buscar
                </v-btn>
            </v-col>
        </v-row>
        <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mt-3' : 'mt-n6'">
            <v-col cols="12">
                <v-alert x-small outlined type="info" dense>
                    <strong>Saldo inicial:</strong>
                    {{ saldoInicial }}
                    <span v-if="factorConv > 1"> ({{ eqStr(saldoInicial, factorConv) }})</span>
                    &nbsp; | &nbsp;
                    <strong>Saldo final:</strong>
                    {{ saldoFinal }}
                    <span v-if="factorConv > 1"> ({{ eqStr(saldoFinal, factorConv) }})</span>
                </v-alert>

            </v-col>
            <v-col cols="6">
                <v-btn v-if="false" color="blue darken-2" dark small @click="procesaKardex()">
                    Procesar Kardex
                </v-btn>
            </v-col>
        </v-row>


        <!-- Tabla -->
        <v-simple-table fixed-header height="70vh" dense>
            <thead>
                <tr>
                    <th>Fecha Ingreso</th>
                    <th>Correlativo</th>
                    <th>Razón social</th>
                    <th>Stock Inicial</th>
                    <th>Cantidad</th>
                    <th>Saldo</th>
                    <th>Equivalente</th>
                    <th>Modo Ajuste</th>
                </tr>
            </thead>
            <tbody>
                <template v-for="item in productosFiltrados">
                    <tr v-for="prod in item.data" :key="prod.uuid">
                        <td style="font-size:75%;">{{ formatFecha(item.fecha_ingreso) }}</td>
                        <td style="font-size:75%;">{{ item.id }}</td>
                        <td style="font-size:75%;">{{ item.motivo }}</td>

                        <!-- NUEVO: stock inicial y saldo final -->
                        <td style="font-size:75%;">{{ prod.stock_inicial }}</td>
                        <td style="font-size:75%;">
                            {{ prod.cantidad }}
                            <span v-if="esGratuita(item.modo_ajuste)">(GRAT)</span>
                        </td>
                        <td style="font-size:75%;">{{ prod.saldo_final }}</td>
                        <td style="font-size:75%">{{ item.equivalente }}</td>
                        <td style="font-size:75%;">{{ item.modo_ajuste }}</td>
                    </tr>
                </template>
            </tbody>
        </v-simple-table>
        <!-- Diálogo de progreso -->
        <v-dialog persistent v-model="cargando" max-width="260">
            <v-card class="pa-6 d-flex flex-column align-center">
                <!-- animación: si progreso==0 uso indeterminate -->
                <v-progress-circular :size="70" :width="8" :value="progreso"
                    :indeterminate="progreso === 0 || progreso >= 100" />
                <div class="mt-3 subtitle-2">{{ estadoTexto }}</div>
                <div class="caption grey--text">{{ progreso }}%</div>
            </v-card>
        </v-dialog>


    </div>
</template>

<script>
import { allMovimientos, allCabecera, consultaDetalle } from '../../db'
import { fs, colempresa } from '../../db_firestore'
import moment from 'moment'
import store from '@/store'
import axios from "axios"
export default {
    data: () => ({
        periodo: moment().format('MM-YYYY'),
        periodos: [
            '2026',
            '01-2026', '02-2026', '03-2026', '04-2026', '05-2026', '06-2026',
            '07-2026', '08-2026', '09-2026', '10-2026', '11-2026', '12-2026',
            '2025',
            '01-2025', '02-2025', '03-2025', '04-2025', '05-2025', '06-2025',
            '07-2025', '08-2025', '09-2025', '10-2025', '11-2025', '12-2025'
        ],
        listafiltrada: [],
        buscar: '',
        saldoInicial: 0,
        saldoFinal: 0,
        cargando: false,
        factorConv: 1,
        progreso: 0,
        estadoTexto: 'Procesando kardex…',
        last_sync_unix: 0,
    }),

    computed: {
        productosFiltrados() {
            if (!this.buscar) return this.listafiltrada
            return this.listafiltrada
                .map(item => {
                    const data = (item.data || []).filter(p => String(p.id) === String(this.buscar))
                    return data.length ? { ...item, data } : null
                })
                .filter(Boolean)
        }

    },

    created() {
        this.inicio()

    },

    methods: {
        async saldo_inicial_todos() {
            this.cargando = true
            this.progreso = 0
            this.estadoTexto = "Creando saldos iniciales…"

            const prods = store.state.productos || []
            let hechos = 0

            for (const p of prods) {
                await this.creaSaldoInicialProducto(p.id)
                hechos++
                // opcional: barra de progreso
                this.progreso = Math.round((hechos / prods.length) * 100)
            }

            this.cargando = false
            alert("Ajuste inicial procesado para todos los productos.")

            // refresca vista actual
            this.inicio()
        },
        async creaSaldoInicialProducto(productoId) {
            try {
                // 1. buscamos el producto en el store para saber stock actual
                const prod = store.state.productos.find(p => String(p.id) === String(productoId))
                if (!prod) {
                    console.warn("Producto no encontrado en store:", productoId)
                    return { ok: false, error: "Producto no encontrado" }
                }

                const stockReal = Number(prod.stock) || 0  // <-- stock que tú confías como verdad

                // 2. leemos TODOS los movimientos actuales del kardex en Firestore
                //    ruta: /kardex/historial/{productoId}/detalle
                const prodRef = colempresa()
                    .doc("kardex")
                    .collection("historial")
                    .doc(String(productoId))

                const detalleRef = prodRef.collection("detalle")
                const snapMov = await detalleRef.orderBy("f").get()

                // reconstruimos saldoFinal actual recorriendo movimientos en orden
                // OJO: ignoramos líneas con op === "INICIAL" porque son ajustes viejos
                let saldoSimulado = 0
                const movimientosOrd = []
                snapMov.forEach(doc => {
                    const x = doc.data()
                    movimientosOrd.push({
                        id: doc.id,
                        f: x.f || 0,
                        op: (x.op || "").toString().toUpperCase(),
                        cant: Number(x.cant || 0),
                    })
                })

                movimientosOrd
                    .sort((a, b) => (a.f || 0) - (b.f || 0))
                    .forEach(m => {
                        if (m.op === "INICIAL") {
                            // ignoramos INICIAL existente para este cálculo
                            return
                        }
                        saldoSimulado += m.cant
                    })

                const saldoFinalKardex = saldoSimulado

                // 3. calculamos cuánto saldo inicial necesitamos para cuadrar
                //    fórmula: inicial = stockReal - saldoFinalKardex
                const saldoInicialNecesario = stockReal - saldoFinalKardex
                // ejemplo: stockReal=11, saldoFinalKardex=-9 -> inicial=20

                // si ya cuadra no hacemos nada
                if (saldoInicialNecesario === 0) {
                    console.log("Este producto ya está cuadrado, no se crea saldo inicial.")
                    return {
                        ok: true,
                        mensaje: "Sin diferencias. No se creó asiento INICIAL.",
                        stockReal,
                        saldoFinalKardex,
                        saldoInicialNecesario,
                    }
                }

                // 4. grabamos un movimiento "INICIAL" con esa cantidad
                // usamos un line_id único
                const lineId = `INICIAL_${productoId}_${Date.now()}`
                const ahoraUnix = moment().unix()

                await detalleRef.doc(lineId).set({
                    line_id: lineId,
                    f: ahoraUnix,                 // fecha del asiento inicial (ahora mismo)
                    op: "INICIAL",
                    doc: "SALDO INICIAL AUTO",
                    rs: "SISTEMA",
                    cant: saldoInicialNecesario,  // ESTE es el ajuste
                    saldo: saldoInicialNecesario, // opcional: puedes guardar saldo base aquí
                    costo: Number(prod.costo) || 0,
                    med: prod.medida || "UNIDAD",
                    updated_unix: ahoraUnix,
                    doc_src: "saldo_inicial",
                }, { merge: true })

                // 5. opcional: actualizar metadata del producto en kardex/historial/{id}
                await prodRef.set({
                    producto_id: String(productoId),
                    producto: prod.nombre || "",
                    last_update_unix: ahoraUnix,
                }, { merge: true })

                console.log("✅ Saldo inicial creado para", productoId,
                    "ajuste:", saldoInicialNecesario)

                return {
                    ok: true,
                    mensaje: "Saldo inicial creado",
                    stockReal,
                    saldoFinalKardex,
                    saldoInicialNecesario,
                }

            } catch (err) {
                console.error("❌ Error creando saldo inicial:", err)
                return { ok: false, error: String(err) }
            }
        },
        muestraFecha(unix) {
            if (!unix || unix === 0) return '— nunca —'
            return moment.unix(unix).format('DD/MM/YYYY HH:mm')
        },
        esGratuita(op) {
            if (!op) return false
            const s = String(op).toUpperCase()
            return s.includes('GRAT') // cubre "GRATUITA", "GRAT", etc.
        },

        rangoDesdePeriodo(periodo) {
            if (periodo.length === 7) {
                const [mm, yyyy] = periodo.split('-')
                const inicio = moment(`${yyyy}-${mm}-01`).startOf('month').unix()
                const fin = moment(`${yyyy}-${mm}-01`).endOf('month').unix()
                return [inicio, fin]
            } else {
                const inicio = moment(`${periodo}-01-01`).unix()
                const fin = moment(`${periodo}-12-31`).endOf('day').unix()
                return [inicio, fin]
            }
        },
        eqStr(saldo, f) {                 // ← NUEVO: helper reutilizable
            const s = Number(saldo) || 0
            const k = Number(f) || 1
            return (k > 1) ? `${Math.floor(s / k)}/${s % k}` : '-'
        },

        async inicio() {
            try {
                if (!this.buscar) {
                    this.listafiltrada = []
                    this.saldoInicial = 0
                    this.saldoFinal = 0
                    this.factorConv = 1
                    return
                }

                const prodId = String(this.buscar)
                const prodSel = (this.$store.state.productos || []).find(p => String(p.id) === prodId)
                const nombreProd = prodSel ? prodSel.nombre : '(sin nombre)'
                this.factorConv = Number(
                    prodSel?.factor ??
                    prodSel?.factor_paquete ??
                    prodSel?.factor_conversion ??
                    1
                )

                // 🔸 Rango unix del periodo elegido
                const [ini, fin] = this.rangoDesdePeriodo(this.periodo)

                // 🔸 Refs Firestore
                const raiz = colempresa().doc('kardex')
                const prodRef = raiz.collection('historial').doc(prodId)
                const movCol = prodRef.collection('detalle')

                // 🔸 Leer todos los movimientos
                const snapAll = await movCol.orderBy('f').get()
                const movimientosTodos = []

                snapAll.forEach(doc => {
                    const x = doc.data()
                    movimientosTodos.push({
                        uuid: doc.id,
                        f: x.f || 0,
                        op: (x.op || '').toUpperCase(),
                        docref: x.doc || doc.id,
                        rs: x.rs || '',
                        cant: Number(x.cant || 0),
                        costo: x.costo ?? 0,
                        med: x.med || '',
                    })
                })

                // 🔹 Buscar saldo inicial base
                let saldoInicialBase = 0

                const inicialAntes = movimientosTodos
                    .filter(m => m.op === 'INICIAL' && m.f < ini)
                    .sort((a, b) => a.f - b.f)

                const inicialDentro = movimientosTodos
                    .filter(m => m.op === 'INICIAL' && m.f >= ini && m.f <= fin)
                    .sort((a, b) => a.f - b.f)

                if (inicialAntes.length > 0) {
                    const ultima = inicialAntes[inicialAntes.length - 1]
                    saldoInicialBase = Number(ultima.cant || 0)
                } else if (inicialDentro.length > 0) {
                    const primera = inicialDentro[0]
                    saldoInicialBase = Number(primera.cant || 0)
                } else {
                    movimientosTodos
                        .filter(m => m.f < ini)
                        .forEach(m => { saldoInicialBase += Number(m.cant || 0) })
                }

                // 🔹 Filtrar movimientos del periodo (ocultando INICIAL)
                const movimientosPeriodo = movimientosTodos
                    .filter(m => m.f >= ini && m.f <= fin && m.op !== 'INICIAL')
                    .sort((a, b) => a.f - b.f)

                // 🔹 Calcular saldos paso a paso
                let saldoAcum = saldoInicialBase
                const rows = []

                // === NUEVO: insertar una fila inicial independiente ===
                rows.push({
                    id: 'SALDO INICIAL',
                    modo_ajuste: 'INICIAL',
                    // uso el inicio del periodo para que quede primero
                    fecha_ingreso: ini,
                    motivo: 'Saldo inicial del periodo',
                    equivalente: this.eqStr(saldoInicialBase, this.factorConv),
                    data: [{
                        uuid: `INICIAL_${prodId}_${ini}`,
                        id: prodId,
                        nombre: nombreProd,
                        cantidad: 0,                  // movimiento informativo
                        costo: 0,
                        stock_inicial: saldoInicialBase,
                        saldo_final: saldoInicialBase,
                    }]
                })
                // === FIN NUEVO ===

                movimientosPeriodo.forEach(mov => {
                    const stockInicialFila = saldoAcum
                    saldoAcum += mov.cant
                    const saldoFinalFila = saldoAcum

                    rows.push({
                        id: mov.docref,
                        modo_ajuste: mov.op,
                        fecha_ingreso: mov.f,
                        motivo: mov.rs,
                        equivalente: this.eqStr(saldoFinalFila, this.factorConv),
                        data: [{
                            uuid: mov.uuid,
                            id: prodId,
                            nombre: nombreProd,
                            cantidad: mov.cant,
                            costo: mov.costo ?? 0,
                            stock_inicial: stockInicialFila,
                            saldo_final: saldoFinalFila,
                        }]
                    })
                })

                // 🔹 Actualizar cabecera
                this.saldoInicial = saldoInicialBase
                this.saldoFinal = saldoAcum
                this.listafiltrada = rows

            } catch (e) {
                console.error('Error cargando historial:', e)
                this.listafiltrada = []
                this.saldoInicial = 0
                this.saldoFinal = 0
                this.factorConv = 1
            }
        },




        async api_rest(data, metodo) {
            console.log(data)
            var a = axios({
                method: 'POST',
                url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                //url: 'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion',
                headers: {},
                data: {
                    "bd": store.state.baseDatos.bd,
                    "data": data,
                    "metodo": metodo
                }
            }).then(response => {
                console.log(response.data)
                return response
            })
            return a
        },

        async procesaKardex() {
            try {
                store.commit("dialogoprogress", 1) // si ya usas este loader

                const bd = store.state.baseDatos.bd// o como llames tu bd actual

                // payload NUEVO: sin periodo
                const payload = {
                    bd,
                    periodo: this.periodo,
                }

                var json = await this.api_rest(payload, 'genera_historial')

                if (!json) {
                    alert('Error: ' + (json.error || 'no se pudo procesar kardex'))
                } else {
                    alert('Kardex actualizado.')
                }

                // refrescar la última sync mostrada en pantalla
                //  await this.cargaLastSync()

                store.commit("dialogoprogress", 1)
            } catch (e) {
                console.error(e)
                alert('Error interno procesando kardex')
                store.commit("dialogoprogress", 1)
            }
        },



        formatFecha(segundos) {
            return segundos ? moment.unix(segundos).format('YYYY-MM-DD') : ''
        }
    }
}
</script>
