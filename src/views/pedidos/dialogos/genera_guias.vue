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

            <v-card class="pa-3 mt-1" v-if="modo_transporte === '01'">
                <h4 style="font-size:13.5px" class="mb-1">Datos Transportista
                    <v-btn class="mt-n1 ml-3" elevation="3" color="info" @click="dial_trans = true" x-small>
                        <v-icon left>
                            mdi-magnify
                        </v-icon>Ver Lista
                    </v-btn>
                </h4>
                <v-row class="text-center mb-n5" dense>
                    <v-col cols="12" sm="3" :class="$vuetify.breakpoint.smAndDown ? '' : ''">
                        <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="ruc_transporte"
                            label="RUC Transportista" append-icon="mdi-magnify" @click:append="buscar_transporte()"
                            @keyup.enter="buscar_transporte()"></v-text-field>

                    </v-col>
                    <v-col cols="12" sm="5" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                        <v-text-field style="font-size:13.5px" outlined small dense v-model="razon_transporte"
                            label="Razon Social"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                        <v-text-field style="font-size:13.5px" outlined dense v-model="registro_mtc"
                            label="N° Registro MTC"></v-text-field>
                    </v-col>
                </v-row>
            </v-card>

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


            <v-row class="mt-1 " dense>

                <v-col cols="12">
                    <v-card class="pa-3 ">
                        <v-row dense>
                            <v-row class="text-left">
                                <v-col cols="6">
                                    <h4 style="font-size:13.5px">Punto de Partida
                                    </h4>
                                </v-col>
                                <v-col cols="6">

                                </v-col>
                            </v-row>
                            <v-col cols="12">
                                <v-row class="" dense>
                                    <v-col cols="4">
                                        <v-autocomplete outlined dense clearable v-model="departamento_p"
                                            :items="arrayDepas" item-text="nombre" return-object label="DEPARTAMENTO">
                                            <template v-slot:item="{ item }">
                                                <div class="d-flex justify-space-between" style="width:100%">
                                                    <span>{{ item.nombre }}</span>
                                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo
                                                    }}</small>
                                                </div>
                                            </template>
                                        </v-autocomplete>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-autocomplete outlined dense clearable v-model="provincia_p"
                                            :items="arrayProvsP" item-text="nombre" return-object label="PROVINCIA"
                                            :disabled="!departamento_p">
                                            <template v-slot:item="{ item }">
                                                <div class="d-flex justify-space-between" style="width:100%">
                                                    <span>{{ item.nombre }}</span>
                                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo
                                                    }}</small>
                                                </div>
                                            </template>
                                        </v-autocomplete>

                                    </v-col>
                                    <v-col cols="4">
                                        <v-autocomplete outlined dense clearable v-model="distrito_p"
                                            :items="arrayDistsP" item-text="nombre" return-object label="DISTRITO"
                                            :disabled="!provincia_p">
                                            <template v-slot:item="{ item }">
                                                <div class="d-flex justify-space-between" style="width:100%">
                                                    <span>{{ item.nombre }}</span>
                                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo
                                                    }}</small>
                                                </div>
                                            </template>
                                        </v-autocomplete>
                                    </v-col>
                                </v-row>
                                <v-textarea :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'"
                                    style="font-size:13.5px" outlined dense v-model="dir_p" auto-grow filled
                                    label="DIRECCION ORIGEN" rows="1"></v-textarea>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Resumen de destinatarios a emitir -->
            <h4 class="mb-2">Destinatarios ({{ clientes.length }})</h4>

            <v-data-table :headers="headersDest" :items="clientes" item-key="numeracion" dense fixed-header
                height="50vh" show-expand class="elevation-0">
                <!-- Items count -->
                <template v-slot:item.doc_relacionado="{ item }">
                    <span class="font-weight-medium">
                        {{ item.cod_comprobante }} : {{ item.numeracion }}
                    </span>
                </template>

                <template v-slot:item.items_count="{ item }">
                    <span v-if="Array.isArray(item.items)">{{ item.items.length }}</span>
                    <span v-else class="red--text">0</span>
                </template>

                <!-- Peso -->
                <template v-slot:item.peso_total="{ item }">
                    <div class="text-right">{{ item.peso_total }}</div>
                </template>

                <!-- EXPAND: Observación + detalle items -->
                <template v-slot:expanded-item="{ headers, item }">
                    <td :colspan="headers.length" class="pa-3 grey lighten-4">
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model.number="item.peso_total" label="Peso (KG)" type="number" min="0"
                                    step="0.01" dense outlined hide-details class="mb-2" />
                                <v-textarea outlined dense rows="2" auto-grow label="Observación"
                                    v-model="item.observacion" />

                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-card outlined class="pa-2">
                                    <v-row dense class="mb-2">
                                        <v-col cols="12" class="d-flex justify-end">
                                            <v-btn x-small color="error" class="mr-2" @click="quitarTodosItems(item)">
                                                <v-icon left small>mdi-broom</v-icon> Quitar todo
                                            </v-btn>

                                            <v-btn x-small color="primary" @click="abrirDialAgregarItem(item)">
                                                <v-icon left small>mdi-plus</v-icon> Agregar ítem
                                            </v-btn>
                                        </v-col>
                                    </v-row>

                                    <div class="font-weight-medium mb-2">Ítems ({{ (item.items || []).length }})</div>

                                    <v-simple-table dense>
                                        <thead>
                                            <tr>
                                                <th style="width:30px"></th>
                                                <th>Producto</th>
                                                <th class="text-right">Cant</th>
                                                <th>Medida</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <tr v-for="(it, k) in (item.items || [])" :key="k">
                                                <td>
                                                    <v-icon small color="red"
                                                        @click="quitarItem(item, k)">mdi-close</v-icon>
                                                </td>
                                                <td style="font-size:12px">{{ it.nombre || it.descripcion || "-" }}</td>
                                                <td class="text-right" style="font-size:12px">{{ it.cantidad || 0 }}
                                                </td>
                                                <td style="font-size:12px">{{ it.medida || "-" }}</td>
                                            </tr>

                                            <tr v-if="!(item.items || []).length">
                                                <td colspan="4" class="red--text">Sin ítems</td>
                                            </tr>
                                        </tbody>
                                    </v-simple-table>

                                </v-card>
                            </v-col>
                        </v-row>
                    </td>
                </template>
            </v-data-table>


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
        <transportista v-if="dial_trans" @cierre="dial_trans = false" @agrega_lista="agregar_empresa($event)" />s
        <vehiculos v-if="dial_agrega_v" @cierre="dial_agrega_v = false" @agrega_lista="agrega_vehiculo($event)" />
        <choferes v-if="dial_agrega_c" @cierre="dial_agrega_c = false" @agrega_lista="agrega_conductor($event)" />
        <dial_items v-if="dial_agrega" @cierre="dial_agrega = false" @agrega_item="guada_item($event)" />

    </v-dialog>
</template>

<script>
import { obtenContador, nuevaGuiaremision, sumaContador, grabaCabecera_p } from '@/db'
import transportista from '@/views/transporte/dial/dial_transportista'
import { guia_remision } from '@/servidorsunat'
import moment from 'moment'
import store from '@/store'
import vehiculos from '@/views/transporte/vehiculos'
import choferes from '@/views/transporte/choferes'
import dial_items from "@/views/transporte/dial/dialogo_agrega_items.vue";
import {
    departamento,
    provincia,
    distrito
} from '../../../ubigeos'
export default {
    name: 'GuiaMasivaSimple',
    props: {
        data_guia: { type: Object, required: true }, // { id_grupo, desserts: [...] }
    },
    components: {
        vehiculos,
        choferes,
        transportista,
        dial_items
    },
    data: () => ({
        // Cabecera común (misma lógica que unitaria)
        dial_agrega: false,
        destinatarioActivo: null, // aquí guardamos la fila actual

        dial_trans: false,
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
        headersDest: [
            { text: "Cliente", value: "cliente" },
            { text: "Doc Relacionado", value: "doc_relacionado" },
            { text: "Punto llegada", value: "direccion" },
            { text: "Peso", value: "peso_total", align: "end" },
            { text: "Items", value: "items_count", align: "center" },
            { text: "", value: "data-table-expand" }
        ],
        // Vehículos y conductores (privado)
        dial_agrega_v: false,
        dial_agrega_c: false,
        array_vehiculo: [],                         // { placa, num_habilitacion, autorizacion, emisor_autori }
        array_conductor: [],                        // { num_doc_conductor, nom_conductor, num_licencia, title? }
        departamento_p: null,
        provincia_p: null,
        distrito_p: null,
        arrayDepas: [],
        arrayProvsP: [],
        arrayDistsP: [],
        cascadaLock: false,
        // Estado UI
        procesando: false,
        resultados: [],
        erroresGenerales: '',
    }),
    created() {
        this.arrayDepas = departamento() || []
        const bd = store.state.baseDatos || {}
        this.cascadaLock = true
        try {
            const depP = this.findDep(bd.departamento)
            const provP = this.findProv(depP, bd.provincia)
            const distP = this.findDist(provP, bd.distrito)

            // Set partida (objetos)
            this.departamento_p = depP
            this.arrayProvsP = depP ? (provincia(depP.ubigeo || depP.ubigeo_sunat) || []) : []
            this.provincia_p = provP
            this.arrayDistsP = provP ? (distrito(provP.ubigeo || provP.ubigeo_sunat) || []) : []
            this.distrito_p = distP

            // Dirección + ubigeo
            this.dir_p = bd.direccion || ''
            this.u_origen = bd.ubigeo || ''
        } finally {
            this.$nextTick(() => { this.cascadaLock = false })
        }
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
    watch: {
        'departamento_p'(depa) {
            if (this.cascadaLock) return
            this.provincia_p = null
            this.distrito_p = null
            this.arrayDistsP = []
            if (depa && (depa.ubigeo || depa.ubigeo_sunat)) {
                this.arrayProvsP = provincia(depa.ubigeo || depa.ubigeo_sunat) || []
            } else {
                this.arrayProvsP = []
            }
            if (!this.distrito_p) this.u_origen = ''
        },
        'provincia_p'(prov) {
            if (this.cascadaLock) return
            this.distrito_p = null
            if (prov && (prov.ubigeo || prov.ubigeo_sunat)) {
                this.arrayDistsP = distrito(prov.ubigeo || prov.ubigeo_sunat) || []
            } else {
                this.arrayDistsP = []
            }
            if (!this.distrito_p) this.u_origen = ''
        },

        'distrito_p'(dist) {
            if (this.cascadaLock) return
            const dep = this.departamento_p || null
            const prov = this.provincia_p || null
            const dis = dist || null

            const uDep = dep?.ubigeo_sunat ?? dep?.ubigeo ?? ''
            const uProv = prov?.ubigeo_sunat ?? prov?.ubigeo ?? ''
            const uDist = dis?.ubigeo_sunat ?? dis?.ubigeo ?? ''

            this.u_origen = (uDep && uProv && uDist) ? `${uDep}${uProv}${uDist}` : ''
            console.log(this.u_origen)
        },
    },
    methods: {
        agregar_empresa(data) {
            console.log(data)
            this.ruc_transporte = data.ruc
            this.razon_transporte = data.razon_transporte
            this.registro_mtc = data.registro_mtc
            this.dial_trans = false
        },
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
                    console.log(c)
                    const items = Array.isArray(c.items) ? c.items : []
                    if (!items.length) {
                        this.resultados.push({ id: '-', cliente: c.cliente, ok: false, msg: 'Sin ítems' })
                        continue
                    }
                    const docRel = this.buildDocRelacionado(c);
                    const doc_relacionados = docRel ? [docRel] : [];

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
                        observacion: (c.observacion || ''),
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
                        departamento_p: this.departamento_p.nombre || store.state.baseDatos.departamento || '',
                        provincia_p: this.provincia_p.nombre || store.state.baseDatos.provincia || '',
                        distrito_p: this.distrito_p.nombre || store.state.baseDatos.distrito || '',
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
                        doc_relacionados,

                    }

                    try {
                        await nuevaGuiaremision(array.id, array)  // guardas en tu BD
                        guia_remision(array, array.data)          // envías a SUNAT
                        console.log(this.data_guia.id_grupo,
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
        },
        findDep(val) {
            if (!val) return null
            if (typeof val === 'object') return val
            return (this.arrayDepas || []).find(d =>
                String(d.nombre || '').toUpperCase() === String(val).toUpperCase()
                || d.ubigeo === val
                || d.ubigeo_sunat === val
            ) || null
        },

        findProv(depObj, val) {
            if (!depObj || !val) return null
            if (typeof val === 'object') return val
            const provs = provincia(depObj.ubigeo || depObj.ubigeo_sunat) || []
            return provs.find(p =>
                String(p.nombre || '').toUpperCase() === String(val).toUpperCase()
                || p.ubigeo === val
                || p.ubigeo_sunat === val
            ) || null
        },

        findDist(provObj, val) {
            if (!provObj || !val) return null
            if (typeof val === 'object') return val
            const dists = distrito(provObj.ubigeo || provObj.ubigeo_sunat) || []
            return dists.find(d =>
                String(d.nombre || '').toUpperCase() === String(val).toUpperCase()
                || d.ubigeo === val
                || d.ubigeo_sunat === val
            ) || null
        },
        clean(v) {
            return (v == null ? '' : String(v)).replace(/\s+/g, '');
        },

        buildDocRelacionado(c) {
            // En tu data: c.dni es del CLIENTE, NO del emisor.
            const rucEmisor = this.clean(store.state.baseDatos?.ruc);      // TU RUC
            const tipo = this.clean(c?.cod_comprobante);                  // 01/03/07/08...
            const id = this.clean(c?.numeracion);                         // BD06-00000466

            if (!rucEmisor || !tipo || !id) return null;
            return { ruc: rucEmisor, tipo, id };
        },
        abrirDialAgregarItem(dest) {
            // dest es el "item" de la fila (destinatario)
            this.destinatarioActivo = dest;
            if (!Array.isArray(this.destinatarioActivo.items)) {
                this.$set(this.destinatarioActivo, "items", []);
            }
            this.dial_agrega = true;
        },

        guada_item(data) {
            // data viene del diálogo
            if (!this.destinatarioActivo) {
                this.dial_agrega = false;
                return;
            }

            // normaliza estructura mínima esperada
            const nuevo = {
                uuid: data.uuid || data.cod_producto || data.id || String(Date.now()),
                cod_producto: data.cod_producto || data.uuid || data.id || "",
                descripcion: data.descripcion || data.nombre || "",
                nombre: data.nombre || data.descripcion || "",
                cantidad: Number(data.cantidad || 0),
                medida: data.medida || "NIU",
                des_medida: data.des_medida || "",
                peso: Number(data.peso || 0),
                peso_total_item: Number(data.peso_total_item || 0),
            };

            if (!Array.isArray(this.destinatarioActivo.items)) {
                this.$set(this.destinatarioActivo, "items", []);
            }

            this.destinatarioActivo.items.push(nuevo);

            this.dial_agrega = false;
            this.destinatarioActivo = null;
        },

        quitarItem(dest, index) {
            if (!dest || !Array.isArray(dest.items)) return;
            dest.items.splice(index, 1);
        },

        quitarTodosItems(dest) {
            if (!dest) return;
            this.$set(dest, "items", []);
        },


    },
}
</script>
