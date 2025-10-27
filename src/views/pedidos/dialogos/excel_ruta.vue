<template>
    <v-dialog v-model="dial" fullscreen persistent scrollable>
        <v-card>
            <!-- Barra superior -->
            <v-system-bar window dark>
                <v-icon large color="red" @click="cerrar">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn text small @click="descargarPlantilla">
                    <v-icon left small>mdi-file-download</v-icon> Plantilla
                </v-btn>
                <v-btn :disabled="!rows.length" color="primary" small class="ml-2" @click="emitirValidos">
                    <v-icon left small>mdi-check-circle</v-icon>
                    Enviar válidos ({{ resumen.validos }})
                </v-btn>
            </v-system-bar>

            <v-card-title class="py-3">
                <v-icon left color="blue">mdi-file-excel</v-icon>
                <span class="subtitle-1 font-weight-medium">Cargar Excel de clientes</span>
                <v-spacer></v-spacer>
                <v-chip class="mr-2" small :color="resumen.validos ? 'green' : 'grey'" dark>
                    Válidos: {{ resumen.validos }}
                </v-chip>
                <v-chip small :color="resumen.invalidos ? 'red' : 'grey'" dark>
                    Con error: {{ resumen.invalidos }}
                </v-chip>
            </v-card-title>

            <v-card-text class="pt-0">
                <!-- Uploader -->
                <v-card class="pa-3 mb-3">
                    <v-row dense>
                        <v-col cols="12" md="8">
                            <v-file-input outlined dense prepend-icon="mdi-cloud-upload" accept=".xlsx,.xls,.csv"
                                label="Selecciona un archivo Excel o CSV" show-size @change="handleFile" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-select outlined dense :items="sheetNames" v-model="activeSheet" label="Hoja"
                                :disabled="!sheetNames.length" hide-details />
                        </v-col>
                    </v-row>
                    <div class="caption grey--text mt-1">
                        Columnas esperadas: <b>vend</b>, <b>doc</b>, <b>cod</b>, <b>cliente</b>, <b>direccion</b>,
                        <b>soles</b>, <b>gps</b>
                        (ej. "-12.04, -77.03"). También admite sinónimos comunes (vendedor, comprobante, código, nombre,
                        monto, etc.).
                    </div>
                </v-card>

                <!-- Tabla -->
                <v-data-table :headers="headers" :items="rows" :items-per-page="20" dense class="elevation-1">
                    <!-- index -->
                    <template v-slot:item.index="slot">
                        <span class="grey--text text--darken-1">#{{ slot.item._row }}</span>
                    </template>

                    <!-- latitud -->
                    <template v-slot:item.latitud="slot">
                        <span :class="valClass(slot.item, 'latitud')">{{ slot.item.latitud }}</span>
                    </template>

                    <!-- longitud -->
                    <template v-slot:item.longitud="slot">
                        <span :class="valClass(slot.item, 'longitud')">{{ slot.item.longitud }}</span>
                    </template>

                    <!-- estado validación -->
                    <template v-slot:item.estadoValid="slot">
                        <v-chip x-small :color="slot.item._errores.length ? 'red' : 'green'" dark>
                            {{ slot.item._errores.length ? 'Con error' : 'Válido' }}
                        </v-chip>
                    </template>

                    <!-- errores -->
                    <template v-slot:item.errores="slot">
                        <div v-if="slot.item._errores.length">
                            <v-tooltip bottom>
                                <template v-slot:activator="act">
                                    <v-btn x-small text v-bind="act.attrs" v-on="act.on" @click="verErrores(slot.item)">
                                        <v-icon left x-small color="red">mdi-alert</v-icon>
                                        {{ slot.item._errores.length }} error(es)
                                    </v-btn>
                                </template>
                                <span>{{ slot.item._errores.join(' - ') }}</span>
                            </v-tooltip>
                        </div>
                        <span v-else class="grey--text">—</span>
                    </template>
                </v-data-table>

            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import store from '@/store/index'
import * as XLSX from 'xlsx'
import { obtenContador, nueva_cabecera_reparto, sumaContador, grabaCabecera_p } from "../../../db";
export default {
    name: 'DialogoCargaExcelClientes',
    props: {

    },
    data() {
        return {
            dial: false,
            sheetNames: [],
            activeSheet: null,
            rows: [],
            rawWorkbook: null,
            dlgErrores: { open: false, row: null },
            headers: [
                { text: '#', value: 'index', width: 60 },
                { text: 'Vendedor', value: 'vendedor', width: 180 },
                { text: 'Doc', value: 'doc', width: 140 },
                { text: 'Cod', value: 'cod', width: 110 },
                { text: 'Cliente', value: 'cliente', width: 220 },
                { text: 'Dirección', value: 'direccion', width: 260 },
                { text: 'Soles', value: 'soles', width: 100, align: 'right' },
                { text: 'Latitud', value: 'latitud', width: 110 },
                { text: 'Longitud', value: 'longitud', width: 110 },
                { text: 'Validación', value: 'estadoValid', width: 120 },
                { text: 'Errores', value: 'errores', width: 160 }
            ]

        }
    },
    created() {
        this.dial = true
    },
    watch: {
        activeSheet(name) {
            if (this.rawWorkbook && name) this.parseSheet(name)
        }
    },
    computed: {
        resumen() {
            const total = this.rows.length
            const invalidos = this.rows.filter(r => r._errores.length).length
            return {
                total,
                validos: total - invalidos,
                invalidos
            }
        }
    },
    methods: {
        cerrar() {
            this.$emit('cerrar')
        },

        // === CARGA & PARSEO ===
        async handleFile(file) {
            if (!file) return
            try {
                const buf = await file.arrayBuffer()
                const wb = XLSX.read(buf, { type: 'array' })
                this.rawWorkbook = wb
                this.sheetNames = wb.SheetNames || []
                this.activeSheet = this.sheetNames[0] || null
                if (this.activeSheet) this.parseSheet(this.activeSheet)
            } catch (e) {
                console.error(e)
                this.$emit('error', 'No se pudo leer el archivo.')
            }
        },

        parseSheet(sheetName) {
            try {
                const ws = this.rawWorkbook.Sheets[sheetName]
                if (!ws) return
                // A JSON respetando la primera fila como header
                const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
                // Mapear y validar
                const salida = json.map((row, i) => this.mapAndValidate(row, i + 2)) // i+2 por header en fila 1
                this.rows = salida
            } catch (e) {
                console.error(e)
                this.$emit('error', 'No se pudo procesar la hoja.')
            }
        },

        // === MAPEOS & VALIDACIÓN ===
        norm(s) {
            return String(s || '')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toLowerCase().trim()
        },

        pickField(row, keys) {
            // keys: sinónimos aceptados
            for (const k in row) {
                const nk = this.norm(k)
                if (keys.includes(nk)) {
                    return row[k]
                }
            }
            return ''
        },

        parseLatLngFromGPS(gps) {
            if (!gps) return { lat: null, lng: null }
            // extrae los primeros 2 números (admite decimal con . o ,)
            const nums = String(gps).match(/-?\d+(?:[.,]\d+)?/g)
            if (!nums || nums.length < 2) return { lat: null, lng: null }
            const a = parseFloat(nums[0].replace(',', '.'))
            const b = parseFloat(nums[1].replace(',', '.'))
            const lat = Number.isFinite(a) ? a : null
            const lng = Number.isFinite(b) ? b : null
            return { lat, lng }
        },

        parseMonto(val) {
            // Extrae el primer número (soporta "S/ 106.65" o "106,65")
            if (val === null || val === undefined) return 0
            const m = String(val).match(/-?\d+(?:[.,]\d+)?/)
            if (!m) return 0
            return parseFloat(m[0].replace(',', '.')) || 0
        },

        mapAndValidate(row, rowNumber) {
            // Sinónimos de encabezados (normalizados sin tildes/minúsculas)
            const keys = {
                vendedor: ['vend', 'vendedor'],
                doc: ['doc', 'documento', 'comprobante', 'factura', 'boleta'],
                cod: ['cod', 'codigo', 'código', 'id', 'idcliente', 'codigo cliente', 'codigo_cliente'],
                cliente: ['cliente', 'nombre', 'razon social', 'razon_social', 'razón social'],
                direccion: ['direccion', 'dirección', 'direccion 1', 'direccion1', 'direccion comercial', 'direccion fiscal'],
                repa: ['repa', 'repartidor', 'ruta'], // opcional
                soles: ['soles', 'monto', 'total', 'importe'],
                gps: ['gps', 'latlng', 'ubicacion', 'ubicación', 'coordenadas'],
                latitud: ['lat', 'latitud'],
                longitud: ['lng', 'long', 'longitud', 'lon']
            }

            const nombreField = (arr) => this.pickField(row, arr.map(this.norm))

            // Campos base según tu archivo
            const vendedor = String(nombreField(keys.vendedor) || '').trim()
            const doc = String(nombreField(keys.doc) || '').trim()
            const cod = String(nombreField(keys.cod) || '').trim()
            const cliente = String(nombreField(keys.cliente) || '').trim()
            const direccion = String(nombreField(keys.direccion) || '').trim()
            const repa = String(nombreField(keys.repa) || '').trim() // opcional
            const solesRaw = nombreField(keys.soles)
            const gps = nombreField(keys.gps)
            let latitud = nombreField(keys.latitud)
            let longitud = nombreField(keys.longitud)

            const errores = []

            // Reglas mínimas
            if (!cliente) errores.push('Cliente requerido')
            if (!direccion) errores.push('Dirección requerida')

            // Monto
            const soles = this.parseMonto(solesRaw)

            // Coordenadas
            let lat = null
            let lng = null

            const hasLat = String(latitud || '').trim() !== ''
            const hasLng = String(longitud || '').trim() !== ''
            if (hasLat || hasLng) {
                lat = parseFloat(String(latitud).replace(',', '.'))
                lng = parseFloat(String(longitud).replace(',', '.'))
            } else if (gps) {
                const p = this.parseLatLngFromGPS(gps)
                lat = p.lat
                lng = p.lng
            }

            if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                errores.push('Coordenadas faltantes o inválidas')
            } else {
                if (lat < -90 || lat > 90) errores.push('Latitud fuera de rango (-90..90)')
                if (lng < -180 || lng > 180) errores.push('Longitud fuera de rango (-180..180)')
            }

            return {
                _row: rowNumber,
                _errores: errores,
                // columnas para la tabla
                vendedor,
                doc,
                cod,
                cliente,
                direccion,
                repa,
                soles: Number.isFinite(soles) ? Number(soles.toFixed(2)) : 0,
                latitud: Number.isFinite(lat) ? lat : null,
                longitud: Number.isFinite(lng) ? lng : null,
                _raw: row
            }
        },

        valClass(item, field) {
            if (item._errores.length === 0) return ''
            if (field === 'latitud' || field === 'longitud') {
                const bad = item.latitud == null || item.longitud == null
                return bad ? 'red--text text--darken-2 font-weight-medium' : ''
            }
            return ''
        },

        verErrores(item) {
            this.dlgErrores = { open: true, row: item }
        },


        descargarPlantilla() {
            const csv =
                'vend,doc,cod,cliente,direccion,soles,gps\n' +
                'CARLOS MONTENEGRO CA,03-BCH3-0068121,5127643,ALCALDE VASQUEZ YRMA VIRGINIA,CALLE EL TUMI N°268,"106.65","-6.795854,-79.845493"\n' +
                'CARLOS MONTENEGRO CA,03-BCH3-0068122,5127644,PEÑA LOPEZ JUAN,JR. LAS FLORES 123,"74.32","-6.795854,-79.845493"\n'
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'plantilla_reparto.csv'
            a.click()
            URL.revokeObjectURL(url)
        },

        csvSafe(s) {
            const t = String(s == null ? '' : s)
            if (t.includes(';') || t.includes('"') || t.includes('\n')) {
                return `"${t.replace(/"/g, '""')}"`
            }
            return t
        },

        async emitirValidos() {
            try {
                // 1) Filas válidas
                const validos = this.rows.filter(r => r._errores.length === 0)
                if (!validos.length) {
                    this.$emit('error', 'No hay filas válidas para guardar.')
                    return
                }
store.commit("dialogoprogress");
                // 2) Vendedor
                const vendedoresUnicos = Array.from(
                    new Set(validos.map(r => String(r.vendedor || '').trim()).filter(Boolean))
                )
                const vendedorTop = vendedoresUnicos.length === 1 ? vendedoresUnicos[0] : 'MIXTO'

                // 3) Docs y totales
                const docs = []
                const detalles = []   // para grabar cada pedido
                let totalGeneral = 0

                validos.forEach((r, i) => {
                    // doc requerido; si falta, genera uno
                    let doc = String(r.doc || '').trim()
                    if (!doc) doc = `ROW-${String(i + 1).padStart(4, '0')}`

                    docs.push(doc)
                    const total = Number(r.soles || 0)
                    totalGeneral += total

                    // Detalle completo del pedido (se guarda en grabaCabecera_p)
                    detalles.push({
                        doc,
                        data: {
                            numeracion: doc,
                            cliente: r.cliente,
                            dni: r.cod,                          // usas 'cod' como identificador de cliente
                            direccion: r.direccion,
                            telefono: '',                        // no viene en el Excel
                            estado: 'pendiente',
                            total: Number(total.toFixed(2)),
                            vendedor: r.vendedor || vendedorTop,
                            ubicacion: { lat: r.latitud, lng: r.longitud }
                        }
                    })
                })

                // 4) Cabecera
                const nowUnix = Math.floor(Date.now() / 1000)
                const grupo = await this.consultaCorrelativo('correlativo_reparto', 4)

                const payload = {
                    grupo,
                    subido:true,
                    fecha_traslado: nowUnix,
                    fecha_emision: nowUnix,
                    vendedor: vendedorTop,
                    vendedores: vendedoresUnicos,
                    pedidos: docs, // << SOLO los doc
                    resumen: {
                        total_contado: Number(totalGeneral.toFixed(2)),
                        total_credito: 0,
                        peso_total: 0,
                        total_pedidos: validos.length,
                        total_general: Number(totalGeneral.toFixed(2))
                    }
                }

                // 5) Guarda cabecera
                await nueva_cabecera_reparto(grupo, payload)

                // 6) Guarda cada pedido con su doc
                for (const { doc, data } of detalles) {
                    await grabaCabecera_p(grupo, doc, data)
                }

                // 7) Incrementa correlativo y cierra
                await this.incrementaCorrelativo(grupo, 'correlativo_reparto', 4)
                store.commit("dialogoprogress");
                this.cerrar()
            } catch (e) {
                console.error(e)
                this.$emit('error', 'No se pudo guardar el reparto.')
            }
        },

        async consultaCorrelativo(contador, pad) {
            // lee el nodo de contadores (ajusta obtenContador según tu ruta)
            const snap = await obtenContador().once("value");
            const data = snap.exists() ? snap.val() : {};

            // valor actual del contador (puede ser string o number)
            const actualRaw = data && data[contador];

            // normaliza a string; si no hay valor usa "0"
            const actualStr = (actualRaw === null || actualRaw === undefined)
                ? "0"
                : String(actualRaw);

            const numero = parseInt(actualStr, 10);
            // devuelve 8 dígitos con ceros a la izquierda
            return String(isNaN(numero) ? 1 : numero).padStart(pad, "0");
        },
        async incrementaCorrelativo(num, contador, pad) {
            // num viene de consultaCorrelativo(); igual lo normalizamos
            const actual = parseInt(String(num ?? "0"), 10);
            const siguiente = isNaN(actual) ? 1 : actual + 1;

            const nuevo = String(siguiente).padStart(pad, "0");
            await sumaContador(contador, nuevo);   // persiste el nuevo correlativo
            return nuevo;                              // opcional: devolverlo
        }

    }
}
</script>

<style scoped>
/* Ajustes menores de tabla y texto */
.red--text {
    font-weight: 600;
}
</style>
