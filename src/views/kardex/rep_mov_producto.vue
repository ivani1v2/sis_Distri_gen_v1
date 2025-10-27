<template>
    <div class="mb-6 mt-1 pa-2">
        <!-- Resumen de saldos -->


        <v-row dense>
            <!-- Selección de periodo -->
            <v-col cols="6" sm="3">
                <v-select v-model="periodo" :items="periodos" label="Periodo" outlined dense />
            </v-col>

            <!-- Selección de producto -->
            <!-- Selección de producto -->
            <v-col cols="12" md="6">
                <v-autocomplete v-model="buscar" :items="$store.state.productos"
                    :item-text="item => `${item.id} - ${item.nombre}`" item-value="id" label="Buscar producto" clearable
                    outlined dense prepend-inner-icon="mdi-magnify" />
            </v-col>


            <!-- Botón buscar -->
            <v-col cols="6" sm="3">
                <v-btn block color="primary" @click="inicio" :disabled="cargando">
                    <v-icon left>mdi-magnify</v-icon>
                    Buscar
                </v-btn>
            </v-col>
        </v-row>
        <v-row dense class="mb-2 mt-n6">
            <v-col cols="6">
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
                <v-btn x-small color="primary" @click="procesa_kardex" :disabled="cargando">
                    <v-icon left>mdi-cog</v-icon>
                    Procesa kardex
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
                <v-progress-circular :size="70" :width="8" :value="progreso" />
                <div class="mt-3 subtitle-2">Procesando kardex…</div>
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
            '01-2025', '02-2025', '03-2025', '04-2025', '05-2025', '06-2025',
            '07-2025', '08-2025', '09-2025', '10-2025', '11-2025', '12-2025', '2025'
        ],
        listafiltrada: [],
        buscar: '',
        saldoInicial: 0,
        saldoFinal: 0,
        cargando: false,
        factorConv: 1,
        progreso: 0,
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

    created() { this.inicio() },

    methods: {
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

                // ← guarda el factor para cabecera y filas
                this.factorConv = Number(
                    prodSel?.factor ?? prodSel?.factor_paquete ?? prodSel?.factor_conversion ?? 1
                )

                const [ini, fin] = this.rangoDesdePeriodo(this.periodo)

                const raiz = colempresa().doc('kardex')
                const prodRef = raiz.collection('historial').doc(prodId)
                const movCol = prodRef.collection('detalle')

                const qs = await movCol.orderBy('f').startAt(ini).endAt(fin).get()

                const rows = []
                let prevSaldo = 0
                let lastSaldo = null
                let index = 0

                qs.forEach(d => {
                    const x = d.data()
                    const saldoMov = x.saldo ?? 0
                    const cantAbs = x.cant ?? 0

                    if (index === 0) this.saldoInicial = prevSaldo
                    lastSaldo = saldoMov
                    index++

                    const stockInicialFila = prevSaldo

                    rows.push({
                        id: x.doc || d.id,
                        modo_ajuste: x.op || '',
                        fecha_ingreso: x.f || 0,
                        motivo: x.rs || '',
                        equivalente: this.eqStr(saldoMov, this.factorConv),   // ← usa helper
                        data: [{
                            uuid: d.id,
                            id: prodId,
                            nombre: nombreProd,
                            cantidad: cantAbs,
                            costo: x.costo ?? 0,
                            stock_inicial: stockInicialFila,
                            saldo_final: saldoMov
                        }]
                    })

                    prevSaldo = saldoMov
                })

                this.listafiltrada = rows
                this.saldoFinal = lastSaldo ?? this.saldoInicial
            } catch (e) {
                console.error('Error cargando historial:', e)
                this.listafiltrada = []
                this.saldoInicial = 0
                this.saldoFinal = 0
                this.factorConv = 1
            }
        },
        

        async procesa_kardex() {
            this.cargando = true
            try {
                // Periodo & rango
                const [ini, fin] = this.rangoDesdePeriodo(this.periodo)
                const periodoKey = (this.periodo.length === 7)
                    ? this.periodo.split('-').reverse().join('-')   // "YYYY-MM"
                    : this.periodo                                  // "YYYY"

                // Helpers
                const n = (v) => {
                    if (v === undefined || v === null || v === '') return 0
                    const s = typeof v === 'string' ? v.replace(',', '.').trim() : v
                    const num = Number(s)
                    return Number.isFinite(num) ? num : 0
                }
                const toSafe = v => (v === undefined || Number.isNaN(v) ? null : v)
                // Reemplaza commitInChunks dentro de procesa_kardex():
                const commitInChunks = async (ops, chunkSize = 400) => {
                    const total = ops.length || 1
                    let done = 0
                    this.progreso = 0

                    for (let i = 0; i < ops.length; i += chunkSize) {
                        const batch = fs.batch()
                        const slice = ops.slice(i, i + chunkSize)
                        slice.forEach(({ ref, data, merge }) => batch.set(ref, data, { merge }))
                        await batch.commit()

                        done += slice.length
                        this.progreso = Math.min(100, Math.round((done / total) * 100))
                    }
                }


                // Acumulador por producto
                const porProd = new Map()

                // --- 1) VENTAS (cabeceras + detalle) ---
                const cabSnap = await allCabecera()
                    .orderByChild('fecha').startAt(ini).endAt(fin).once('value')

                if (cabSnap.exists()) {
                    const cabeceras = cabSnap.val()
                    await Promise.all(Object.keys(cabeceras).map(async (cabId) => {
                        const cab = cabeceras[cabId]
                        const detSnap = await consultaDetalle(cabId).once('value')
                        const detalle = detSnap.exists() ? Object.values(detSnap.val()) : []

                        detalle.forEach(d => {
                            const pid = String(d.id)
                            const arr = porProd.get(pid) || []

                            // ---- CANTIDAD con REGLA DE FACTOR ----
                            let qty = n(d.cant_ingresada) || n(d.cantidad)
                            const factor = n(d.factor || d.factor_paquete || 1)
                            const medidaStr = String(d.medida || d.cod_medida || '').toUpperCase()
                            if (factor > 1 && medidaStr !== 'UNIDAD' && medidaStr !== 'NIU') {
                                qty = qty * factor
                            }
                            // --------------------------------------

                            arr.push({
                                f: Number(cab.fecha) || 0, // unix s
                                op: 'VENTA',
                                doc: cab.numeracion || `${cab.serie || ''}-${cab.correlativoDocEmitido || ''}` || String(cabId),
                                rs: cab.cliente || '',
                                cant: -qty,                 // venta => salida
                                costo: n(d.costo),
                                pid,
                                p: d.nombre || '',
                                med: d.medida || d.cod_medida || 'NIU'
                            })
                            porProd.set(pid, arr)
                        })
                    }))
                }

                // --- 2) MOVIMIENTOS (COMPRA / AJUSTE ENTRADA / AJUSTE SALIDA / etc.) ---
                const movSnap = await allMovimientos()
                    .orderByChild('fecha_emision')
                    .startAt(ini)
                    .endAt(fin)
                    .once('value')

                if (movSnap.exists()) {
                    const movs = Object.values(movSnap.val())
                    movs.forEach(m => {
                        const fecha = Number(m.fecha_emision || m.fecha_ingreso || m.fecha_creacion || 0)
                        const opBase = String(m.operacion || '').toUpperCase()     // COMPRA | AJUSTE | ...
                        const modo = m.modo_ajuste ? String(m.modo_ajuste).toUpperCase() : '' // ENTRADA/SALIDA
                        const op = modo ? `${opBase} ${modo}` : opBase
                        const doc = m.tipodocumento ? `${m.tipodocumento}-${m.id || ''}` : (m.id || '')
                        const rs = m.nom_proveedor || m.motivo || ''

                            ; (m.data || []).forEach(d => {
                                const pid = String(d.id)
                                const arr = porProd.get(pid) || []

                                // ---- CANTIDAD con REGLA DE FACTOR ----
                                let qty = n(d.cant_ingresada) || n(d.cantidad)
                                const factor = n(d.factor || d.factor_paquete || 1)
                                const medidaStr = String(d.medida || d.cod_medida || '').toUpperCase()
                                if (factor > 1 && medidaStr !== 'UNIDAD' && medidaStr !== 'NIU') {
                                    qty = qty * factor
                                }
                                // --------------------------------------

                                // Signo por operación
                                let signo = 0
                                if (opBase === 'COMPRA') signo = +1
                                else if (opBase === 'AJUSTE') {
                                    if (modo === 'ENTRADA') signo = +1
                                    else if (modo === 'SALIDA') signo = -1
                                } else if (modo === 'ENTRADA') signo = +1
                                else if (modo === 'SALIDA') signo = -1

                                if (qty !== 0 && signo !== 0) {
                                    arr.push({
                                        f: fecha || 0,
                                        op: op,
                                        doc: doc,
                                        rs: rs,
                                        cant: signo * qty,         // + entra, - sale
                                        costo: n(d.costo),
                                        pid,
                                        p: d.nombre || '',
                                        med: d.medida || d.cod_medida || 'NIU'
                                    })
                                    porProd.set(pid, arr)
                                }
                            })
                    })
                }

                // --- 3) Guardar en Firestore (subcolección detalle por producto) ---
                const ops = []

                porProd.forEach((arr, pid) => {
                    if (this.buscar && String(pid) !== String(this.buscar)) return

                    arr.sort((a, b) => a.f - b.f)
                    let saldo = 0 // si tienes saldo inicial real, colócalo aquí

                    const raiz = colempresa().doc('kardex')
                    const prodRef = raiz.collection('historial').doc(String(pid))
                    const movCol = prodRef.collection('detalle')

                    // Resumen
                    ops.push({
                        ref: prodRef,
                        data: {
                            producto_id: pid,
                            producto: arr[0]?.p || '',
                            periodo: periodoKey,
                            saldo_inicial: 0,
                            saldo_final: 0
                        },
                        merge: true
                    })

                    // Saldo inicial
                    ops.push({
                        ref: movCol.doc('000000'),
                        data: { f: toSafe(ini), op: 'SALDO INICIAL', doc: '', rs: '', cant: 0, saldo: 0 },
                        merge: true
                    })

                    // Movimientos
                    arr.forEach((m, idx) => {
                        saldo += m.cant
                        const mid = String(idx + 1).padStart(6, '0')
                        ops.push({
                            ref: movCol.doc(mid),
                            data: {
                                f: toSafe(m.f),
                                op: toSafe(m.op),
                                doc: toSafe(m.doc),
                                rs: toSafe(m.rs),
                                cant: Math.abs(toSafe(m.cant) ?? 0),
                                saldo: toSafe(saldo),
                                costo: toSafe(m.costo),
                                med: toSafe(m.med)
                            },
                            merge: true
                        })
                    })

                    // Saldos finales
                    ops.push({
                        ref: prodRef,
                        data: { saldo_final: toSafe(saldo) },
                        merge: true
                    })
                })

                await commitInChunks(ops, 400)
                console.info('✅ Kardex (con factor aplicado por medida) guardado:', periodoKey)
            } catch (e) {
                console.error('❌ Error procesando kardex:', e)
            } finally {
                this.cargando = false
            }
        },


        formatFecha(segundos) {
            return segundos ? moment.unix(segundos).format('YYYY-MM-DD') : ''
        }
    }
}
</script>
