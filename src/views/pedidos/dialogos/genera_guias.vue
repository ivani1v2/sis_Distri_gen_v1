<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" fullscreen>
        <div>
            <v-system-bar dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>Genera Reparto</h3>
                <v-spacer></v-spacer>

                <v-icon color="green" large @click="emitirMasivo()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-4">
            <v-row dense>
                <v-col cols="6">
                    <h3 class="mb-4">Guías de Remisión (Emisión Masiva)</h3>
                </v-col>
                <v-col cols="6" class="mt-n5">
                    <v-radio-group dense v-model="modo_transporte" row>
                        <template v-slot:label>Modo Transporte:&nbsp;</template>
                        <v-radio label="Público" value="01" />
                        <v-radio label="Privado" value="02" />
                    </v-radio-group>
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="12" sm="3">
                    <v-select outlined dense v-model="tipo_guia" :items="array_tipo_guia" label="Tipo de Guía" />
                </v-col>

                <v-col cols="12" sm="3">
                    <v-text-field outlined dense type="date" v-model="date_emision" label="Fecha Emisión" />
                </v-col>

                <v-col cols="12" sm="3">
                    <v-text-field outlined dense type="date" v-model="date_traslado" :label="texto_fecha" />
                </v-col>

                <v-col cols="12" sm="3">
                    <v-select disabled outlined dense v-model="motivos_guia" :items="$store.state.motivos_guia"
                        label="Motivo traslado" />
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="12" class="mt-n11">
                    <v-radio-group dense v-model="modo_transporte" row>
                        <template v-slot:label>Modo Transporte:&nbsp;</template>
                        <v-radio label="Público" value="01" />
                        <v-radio label="Privado" value="02" />
                    </v-radio-group>
                </v-col>
            </v-row>
            <v-row dense v-if="modo_transporte === '01'">
                <v-col cols="12" sm="4">
                    <v-text-field outlined dense v-model="ruc_transporte" label="RUC Transportista" />
                </v-col>

                <v-col cols="12" sm="4">
                    <v-text-field outlined dense v-model="razon_transporte" label="Razón Social Transportista" />
                </v-col>
                <v-col cols="12" sm="4">
                    <v-text-field outlined dense v-model="registro_mtc" :disabled="modo_transporte === '01'"
                        label="Registro MTC (solo transportista)" />
                </v-col>
            </v-row>

            <!-- 🔵 Vehículo y Conductor (solo PRIVADO) -->
            <v-row class="mt-2" dense v-if="modo_transporte === '02'">
                <v-col cols="6">
                    <v-card class="pa-3">
                        <v-row class="text-center">
                            <v-col cols="6">
                                <h4 class="mb-1">Datos de Vehículos</h4>
                            </v-col>
                            <v-col cols="6">
                                <v-btn block elevation="3" color="info" @click="dial_agrega_v = true" x-small>
                                    <v-icon left>mdi-plus</v-icon>Adicionar
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-simple-table fixed-header height="15vh" dense>
                            <thead>
                                <tr>
                                    <th class="text-left">N° de placa</th>
                                    <th class="text-left">Nº TUCE / C.H.Veh.</th>
                                    <th class="text-left">N° autorización</th>
                                    <th class="text-left">Emisor de la autorización</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in array_vehiculo" :key="item.placa">
                                    <td style="font-size:75%">
                                        <v-icon color="red" @click="eliminar_V(item)" small>mdi-close</v-icon>
                                        {{ item.placa }}
                                    </td>
                                    <td style="font-size:75%">{{ item.num_habilitacion }}</td>
                                    <td style="font-size:75%">{{ item.autorizacion }}</td>
                                    <td style="font-size:75%">{{ item.emisor_autori }}</td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-card>
                </v-col>

                <v-col cols="6">
                    <v-card class="pa-3">
                        <v-row class="text-center">
                            <v-col cols="6">
                                <h4 class="mb-1">Conductor</h4>
                            </v-col>
                            <v-col cols="6">
                                <v-btn block elevation="3" color="info" @click="dial_agrega_c = true" x-small>
                                    <v-icon left>mdi-plus</v-icon>Adicionar
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-simple-table fixed-header height="15vh" dense>
                            <thead>
                                <tr>
                                    <th class="text-left">N° Doc</th>
                                    <th class="text-left">Conductor</th>
                                    <th class="text-left">Licencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in array_conductor" :key="item.num_licencia">
                                    <td style="font-size:75%">
                                        <v-icon color="red" @click="eliminar_c(item)" small>mdi-close</v-icon>
                                        {{ item.num_doc_conductor }}
                                    </td>
                                    <td style="font-size:75%">{{ item.nom_conductor }}</td>
                                    <td style="font-size:75%">{{ item.num_licencia }}</td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Ubigeos -->
            <v-row dense>

                <v-col cols="12" sm="4">
                    <v-text-field outlined dense v-model="u_destino_comun" label="Ubigeo Destino (SUNAT) - Común" />
                </v-col>
                <v-col cols="12" sm="4">
                    <v-select outlined dense v-model="medida_t" :items="array_medidas" label="Medida Peso Total" />
                </v-col>
                <v-col cols="12" sm="4">
                    <v-text-field outlined dense v-model="observacion" label="Observación (opcional)" />
                </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Resumen de destinatarios a emitir -->
            <h4 class="mb-2">Destinatarios ({{ clientes.length }})</h4>
            <v-simple-table dense fixed-header height="50vh">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Dirección destino</th>
                        <th class="text-right">Peso</th>
                        <th class="text-center">Items</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(c, i) in clientes" :key="i">
                        <td>{{ c.cliente }}</td>
                        <td>{{ c.direccion }}</td>
                        <td class="text-right">{{ c.peso_total }}</td>
                        <td class="text-center">
                            <span v-if="Array.isArray(c.items)">{{ c.items.length }}</span>
                            <span v-else class="red--text">0</span>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>


            <!-- Resultados -->
            <v-alert v-if="erroresGenerales" dense type="error" outlined class="mt-4">{{ erroresGenerales }}</v-alert>

            <v-card class="pa-3 mt-4" v-if="resultados.length">
                <h4 class="mb-2">Resultados de emisión</h4>
                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Estado</th>
                            <th>Mensaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in resultados" :key="r.id">
                            <td>{{ r.id || '-' }}</td>
                            <td>{{ r.cliente }}</td>
                            <td>
                                <span :class="r.ok ? 'green--text' : 'red--text'">
                                    {{ r.ok ? 'ENVIADO' : 'NO EMITIDO' }}
                                </span>
                            </td>
                            <td>{{ r.msg }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-card>

        <!-- Diálogos -->
        <vehiculos v-if="dial_agrega_v" @cierre="dial_agrega_v = false" @agrega_lista="agrega_vehiculo($event)" />
        <choferes v-if="dial_agrega_c" @cierre="dial_agrega_c = false" @agrega_lista="agrega_conductor($event)" />
    </v-dialog>
</template>

<script>
import { obtenContador, nuevaGuiaremision, sumaContador,grabaCabecera_p } from '@/db'
import { guia_remision } from '@/servidorsunat'
import moment from 'moment'
import store from '@/store'
import vehiculos from '@/views/transporte/vehiculos'
import choferes from '@/views/transporte/choferes'

export default {
    name: 'GuiaMasivaSimple',
    props: {
        data_guia: { type: Object, required: true }, // { id_grupo, desserts: [...] }
    },
    components: {
        vehiculos,
        choferes,
    },
    data: () => ({
        // Cabecera común (misma lógica que unitaria)
        dial: false,
        tipo_guia: 'GUIA REMITENTE',                // 'GUIA REMITENTE' | 'GUIA TRANSPORTISTA'
        array_tipo_guia: ['GUIA REMITENTE'],
        date_emision: moment().format('YYYY-MM-DD'),
        date_traslado: moment().format('YYYY-MM-DD'),
        motivos_guia: 'VENTA',
        modo_transporte: '01',                      // 01 público, 02 privado
        ruc_transporte: '',
        razon_transporte: '',
        registro_mtc: '',
        dir_origen: store.state.baseDatos.direccion,
        u_origen: store.state.baseDatos.ubigeo || '',
        u_destino_comun: store.state.baseDatos.ubigeo,                        // simple: 1 ubigeo destino para todos
        medida_t: 'KILOGRAMO',
        array_medidas: ['KILOGRAMO', 'TONELADA'],
        observacion: '',

        // Vehículos y conductores (privado)
        dial_agrega_v: false,
        dial_agrega_c: false,
        array_vehiculo: [],                         // { placa, num_habilitacion, autorizacion, emisor_autori }
        array_conductor: [],                        // { num_doc_conductor, nom_conductor, num_licencia, title? }

        // Estado UI
        procesando: false,
        resultados: [],
        erroresGenerales: '',
    }),
    created() {
        this.dial = true
    },
    computed: {
        clientes() {
            return Array.isArray(this.data_guia?.desserts) ? this.data_guia.desserts : []
        },
        texto_fecha() {
            return this.modo_transporte === '01' ? 'Entrega al transportista' : 'Inicio del traslado'
        },
    },
    methods: {
        obtencodigomedida(nombre) {
            const it = store.state.medidassunat.find(x => x.nombre === nombre)
            return it ? it.corto : 'TNL' // fallback simple
        },
        obten_codigo_doc(nombre) {
            if (nombre === 'DNI' || nombre === '1') return '1'
            if (nombre === 'RUC' || nombre === '6') return '6'
            if (nombre === 'Pasaporte' || nombre === '7') return '7'
            if (nombre === 'Carnet de Extranjeria' || nombre === '4') return '4'
            return '1'
        },
        codMotivo(nombre) {
            const arr = store.state.motivosSunat_guia || []
            const it = arr.find(a => a.nombre === nombre)
            return it ? it.codigo : '01'
        },
        unix(dateStr) {
            return moment(String(dateStr)) / 1000
        },

        async emitirMasivo() {
            this.erroresGenerales = ''
            this.resultados = []

            // Validaciones básicas (igual enfoque que unitaria, pero global)
            if (!this.clientes.length) {
                this.erroresGenerales = 'No hay clientes para emitir.'
                return
            }
            if (!this.u_destino_comun) {
                this.erroresGenerales = 'Ingrese Ubigeo destino común.'
                return
            }
            if (!this.dir_origen || !this.u_origen) {
                this.erroresGenerales = 'Complete dirección y ubigeo de origen.'
                return
            }

            // Validación específica para transporte privado
            const errPriv = this.validaTransportePrivado()
            if (errPriv) {
                this.erroresGenerales = errPriv
                return
            }

            this.procesando = true
            try {
                // Fechas y serie como en unitaria
                const Emision = this.unix(this.date_emision)
                const Traslado = this.unix(this.date_traslado)
                const contadorSnap = await obtenContador().once('value')
                const contador = contadorSnap.val() || {}
                const esRemitente = this.tipo_guia === 'GUIA REMITENTE'

                const tipo_comprobante = esRemitente ? '09' : '31'
                const serie_guia = esRemitente ? store.state.seriesdocumentos.guia : store.state.seriesdocumentos.guia_t
                let correlativo = esRemitente ? (contador.orden_guia || '00001') : (contador.orden_guia_t || '00001')

                // función para pad con 5 dígitos
                const pad5 = n => String(n).padStart(5, '0')
                let corrNum = parseInt(correlativo, 10) || 1

                for (const c of this.clientes) {
                    // Items: si no trae, no emitimos esa guía
                    const items = Array.isArray(c.items) ? c.items : []
                    if (!items.length) {
                        this.resultados.push({ id: '-', cliente: c.cliente, ok: false, msg: 'Sin ítems' })
                        continue
                    }

                    // Documento destinatario
                    const codDocDest = this.obten_codigo_doc(String(c.cod_tipoDocumento || '').trim() || (c.dni?.length === 11 ? 'RUC' : 'DNI'))
                    const rucDest = (c.dni || '').trim()
                    const razonDest = (c.cliente || '').trim()

                    // Construye payload igual que en unitaria
                    const id = `${serie_guia}-${pad5(corrNum)}`
                    const array = {
                        id,
                        serie: serie_guia,
                        correlativo: pad5(corrNum),
                        tipo_comprobante,
                        tipo_guia: this.tipo_guia,
                        fecha_emision: Emision,
                        fecha_traslado: Traslado,
                        motivo: this.motivos_guia,
                        cod_motivo: this.codMotivo(this.motivos_guia),
                        observacion: this.observacion,
                        modo_transporte: this.modo_transporte,
                        modo_transporte_desc: this.modo_transporte === '01' ? 'PUBLICO' : 'PRIVADO',
                        ruc_transporte: this.ruc_transporte,
                        razonsocial_transporte: this.razon_transporte,
                        registro_mtc: this.registro_mtc,
                        // ⬇️ Solo incluimos vehículo y conductor si es privado
                        array_vehiculo: (this.modo_transporte === '02') ? this.array_vehiculo : [],
                        array_conductor: (this.modo_transporte === '02') ? this.array_conductor : [],

                        // Remitente = emisor (como en unitaria cuando es guía remitente)
                        cod_documento_rem: '6',
                        ruc_remitente: store.state.baseDatos.ruc,
                        razonsocial_remitente: store.state.baseDatos.name,

                        // Origen común
                        u_origen: this.u_origen,
                        dir_origen: String(this.dir_origen || '').toUpperCase(),
                        departamento_p: store.state.baseDatos.departamento?.nombre || store.state.baseDatos.departamento || '',
                        provincia_p: store.state.baseDatos.provincia?.nombre || store.state.baseDatos.provincia || '',
                        distrito_p: store.state.baseDatos.distrito?.nombre || store.state.baseDatos.distrito || '',
                        cod_documento: codDocDest,
                        ruc_destinatario: rucDest,
                        razonsocial_destinatario: razonDest,
                        u_destino: c.ubigeo || this.u_destino_comun, // si cada cliente trae su ubigeo, lo usa; si no, usa común
                        dir_destino: String(c.direccion || '').toUpperCase(),
                        departamento_l: '',
                        provincia_l: '',
                        distrito_l: '',
                        medida_t: this.medida_t,
                        cod_medida_t: this.obtencodigomedida(this.medida_t),
                        peso_total: (c.peso_total && Number(c.peso_total) > 0) ? c.peso_total : 1,
                        data: items,
                        retorno_vacio: false,
                        retorno_envaces: false,
                        programado: false,
                        vehic_m1: false,
                        traslado_total: false,
                        datos_transpor: (this.tipo_guia !== 'GUIA REMITENTE'),
                        trans_sub: false,
                        ruc_subcontrata: '',
                        razon_subcontrata: '',
                        pagado_por: 'Remitente',
                        doc_relacionados: []
                    }

                    try {
                        await nuevaGuiaremision(array.id, array)  // guardas en tu BD
                        guia_remision(array, array.data)          // envías a SUNAT
                        console.log(    this.data_guia.id_grupo,
                            `${c.numeracion}/guia_id`,
                            array.id)
                        await grabaCabecera_p(
                            this.data_guia.id_grupo,
                            `${c.numeracion}/guia_id`,
                            array.id
                        )
                        this.resultados.push({ id: array.id, cliente: razonDest, ok: true, msg: 'Enviado' })
                        corrNum += 1
                    } catch (e) {
                        this.resultados.push({
                            id: array.id,
                            cliente: razonDest,
                            ok: false,
                            msg: (e && e.message) ? e.message : 'Error al emitir'
                        })
                    }
                }

                // Actualiza contador una sola vez al final
                const nuevo = pad5(corrNum)
                if (esRemitente) {
                    await sumaContador('orden_guia', nuevo)
                } else {
                    await sumaContador('orden_guia_t', nuevo)
                }
            } catch (e) {
                this.erroresGenerales = (e && e.message) ? e.message : 'Error general emitiendo guías.'
            } finally {
                this.procesando = false
            }
        },

        // === Vehículos y conductores (idéntico a unitaria) ===
        agrega_vehiculo(data) {
            if (this.array_vehiculo.length !== 0) {
                // si ya hay 1, la autorización del secundario se limpia (igual que en unitaria)
                data.autorizacion = ''
            }
            this.array_vehiculo.push(data)
            this.dial_agrega_v = false
        },
        eliminar_V(item) {
            const pos = this.array_vehiculo.map(e => e.placa).indexOf(item.placa)
            if (pos !== -1) this.array_vehiculo.splice(pos, 1)
        },

        agrega_conductor(data) {
            data.title = this.array_conductor.length === 0 ? 'Principal' : 'Secundario'
            this.array_conductor.push(data)
            this.dial_agrega_c = false
        },
        eliminar_c(item) {
            const pos = this.array_conductor.map(e => e.num_licencia).indexOf(item.num_licencia)
            if (pos !== -1) this.array_conductor.splice(pos, 1)
        },

        // Validación mínima para privado
        validaTransportePrivado() {
            if (this.modo_transporte === '02') {
                if (!this.array_vehiculo.length) return 'Agrega al menos 1 vehículo'
                if (!this.array_conductor.length) return 'Agrega al menos 1 conductor'
            }
            return ''
        },

        cierra() {
            this.dial = false
            this.$emit('cierra')
        }
    },
}
</script>
