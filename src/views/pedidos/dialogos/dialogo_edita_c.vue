<template>
    <v-dialog v-model="dial" max-width="850px" height='85vh' persistent>

        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon color="blue" large @click="dial_catalogo = !dial_catalogo">mdi-plus</v-icon>
                <v-icon color="green" large @click="guardar()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-row class="pa-1">
                <v-col cols="6">
                    <h5>Cliente : <span class="red--text">{{ info_cabecera.dni }}-{{ info_cabecera.cliente }}</span>
                        <v-icon color="green" small @click="dial_edita_cli = true">mdi-pencil</v-icon>
                    </h5>
                    <h5>Direccion : <span class="red--text">{{ info_cabecera.direccion }}</span></h5>
                    <h5>Comprobante : <span class="red--text">{{ info_cabecera.serie }}-{{
                        info_cabecera.correlativoDocEmitido }}</span>
                        <v-icon color="green" small @click="abrir_edita_comprobante()">mdi-pencil</v-icon>
                    </h5>
                    <h5>Fecha: : <span class="red--text">{{ conviertefecha(info_cabecera.fecha) }}</span></h5>
                </v-col>
                <v-col cols="6">
                    <h5>Vend : <span class="red--text">{{ info_cabecera.vendedor }}</span></h5>
                    <h5>Modo : <span class="red--text">{{ info_cabecera.forma_pago }}</span>
                        <v-icon color="green" small @click="edita_modo()">mdi-pencil</v-icon>
                    </h5>
                    <h5>Total : <span class="red--text">S/.{{ calcularTotalGeneral() }}</span></h5>
                    <h5>Pendiente de Pago : <span class="red--text">S/.{{ info_cabecera.pendiente_pago }}</span></h5>
                </v-col>
            </v-row>
            <v-simple-table dense dark fixed-header height="50vh">
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">Cantidad</th>
                            <th class="text-left">Descripción</th>
                            <th class="text-left">Medida</th>
                            <th class="text-left">Precio Unitario</th>
                            <th class="text-left" v-if="$store.state.configuracion?.desc_porcentaje_catalogo">Descuentos</th>
                            <th class="text-left">Precio Neto</th>
                            <th class="text-left">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in lista_productos" :key="item.uuid || item.id" @click.prevent="editaProducto(item)">
                            <td>{{ item.cantidad }}</td>
                            <td>{{ item.id + "-" + item.nombre }}
                                <span v-if="item.operacion == 'GRATUITA'" class="red--text"> - TG</span>
                            </td>
                            <td>{{ item.medida }}</td>
                            <td>
                                <div class="d-flex flex-column align-start">
                                    <span class="font-weight-medium">
                                        {{ monedaSimbolo }}{{ redondear(item.precio || 0) }}
                                    </span>
                                </div>
                            </td>
                            <td v-if="$store.state.configuracion?.desc_porcentaje_catalogo">
                                <div v-if="item.descuentos" class="d-flex flex-column">
                                    <span class="orange--text text-center">
                                        {{ item.descuentos.desc_1 }}
                                        <span v-if="item.descuentos.desc_2 > 0">/ {{ item.descuentos.desc_2 }}
                                            <span v-if="item.descuentos.desc_3 > 0">/ {{ item.descuentos.desc_3 }}</span>
                                        </span>
                                    </span>
                                </div>
                                <span v-else class="grey--text">-</span>
                            </td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span class="font-weight-medium green--text">
                                        {{ monedaSimbolo }}{{ redondear(item.precioedita || item.precio || 0) }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span :class="{ 'red--text': item.operacion === 'GRATUITA' }">
                                    {{ monedaSimbolo }}{{ calcularTotalItem(item) }}
                                </span>
                                <small v-if="item.operacion === 'GRATUITA'" class="caption red--text d-block">GRATUITO</small>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <v-dialog v-model="dialogoProducto" max-width="450">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoProducto = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3" :key="editKey">
                <v-select :items="arrayOperacion" label="Operacion" dense outlined v-model="operacion_edita"></v-select>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12" class="mb-n4 mt-n1">
                        <v-text-field disabled dense @keyup.enter="grabaEdita()" class="pa-3" v-model="nombreEdita" label="Nombre"></v-text-field>
                    </v-col>
                    <v-col cols="6" xs="6" class="position-relative">
                        <v-text-field dense @keyup.enter="grabaEdita()" type="number" class="pa-3" v-model="precioedita" label="Precio Base" @input="onPrecioEditaChange"></v-text-field>
                        <v-btn v-if="precioCambiado" icon x-small color="blue" class="mt-n2 mr-7" @click="restaurarPrecioBase" title="Restaurar precio base original" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);">
                            <v-icon small>mdi-undo</v-icon>
                        </v-btn>
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field dense @keyup.enter="grabaEdita()" type="number" class="pa-3" v-model="cantidadEdita" label="Cantidad"></v-text-field>
                    </v-col>
                    <v-col cols="12" class="mt-n6 mb-3">
                        <div class="caption grey--text text--darken-1">
                            <span v-if="descEdita.precioFinal && descEdita.precioFinal !== Number(precioedita)">
                                <strong class="green--text">Precio Final: {{ monedaSimbolo }}{{ redondear(descEdita.precioFinal) }}</strong>
                            </span>
                            <span v-else class="caption grey--text">Sin descuentos aplicados</span>
                        </div>
                    </v-col>
                </v-row>
                <v-alert v-if="precioCambiado" type="warning" dense text class="mt-2 mb-6" style="font-size: 11px;">
                    El precio fue modificado. Ajuste los descuentos si es necesario.
                </v-alert>
                <descuentos-porcentaje v-if="dialogoProducto" :key="'desc-edit-' + editKey" ref="descEditaRef" :precio-base="precioBaseEdita" :descuentos-iniciales="descuentosInicialesEdita" :es-bono="operacion_edita === 'GRATUITA'" :decimales="decimales" @cambio="onDescEditaCambio" class="my-3" />
                <v-card-actions class="mt-n2">
                    <v-btn color="red darken-1" text @click="eliminaedita()">Eliminar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="grabaEdita()">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_edita_cli" max-width="500">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_edita_cli = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="mt-1" dense>
                    <v-col cols="4">
                        <v-select outlined dense v-model="info_cabecera.tipoDocumento" :items="documentos" menu-props="auto" hide-details label="Tipo Doc"></v-select>
                    </v-col>
                    <v-col cols="8">
                        <v-text-field outlined dense v-model="info_cabecera.dni" label="Documento"></v-text-field>
                    </v-col>
                </v-row>
                <v-text-field outlined dense v-model="info_cabecera.cliente" label="Nombre"></v-text-field>
                <v-text-field outlined dense v-model="info_cabecera.direccion" label="Dirección" prepend-inner-icon="mdi-home-map-marker" append-outer-icon="mdi-map-marker" />
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dial_edita_cli = false" color="orange">GRABA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_edita_modo" max-width="500">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_edita_modo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-radio-group class="mt-n1" v-model="info_cabecera.forma_pago" row>
                    <v-radio @click="cambia_modo('CONTADO')" label="CONTADO" value="CONTADO"></v-radio>
                    <v-radio @click="cambia_modo('CREDITO')" label="CREDITO" value="CREDITO"></v-radio>
                </v-radio-group>
                <v-text-field outlined label="Monto Pendiente de Pago" type="number" v-model="info_cabecera.pendiente_pago" dense></v-text-field>
                <div v-if="info_cabecera.forma_pago == 'CREDITO'">
                    <v-text-field outlined label="Fecha Pago Credito" type="date" v-model="date_vence" dense></v-text-field>
                    <v-btn block color="indigo" dark class="mt-2 mb-3" @click="abrirCronogramaDesdeModo">
                        <v-icon left>mdi-calendar-clock</v-icon>
                        Configurar Cronograma de Cuotas
                        <v-icon right v-if="tieneCronograma">mdi-check-circle</v-icon>
                    </v-btn>
                    <div v-if="tieneCronograma" class="caption success--text mb-2">
                        <v-icon small color="success">mdi-check</v-icon>
                        {{ totalCuotas }} cuota(s) programada(s) - Total: {{ monedaSimbolo }} {{ totalCuotasImporte.toFixed(2) }}
                    </div>
                </div>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="graba_edita_modo()" color="orange">GRABA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <cronograma v-if="dialogoCronograma" :totalCredito="Number(info_cabecera.pendiente_pago) || 0" @cierra="dialogoCronograma = false" @emite_cronograma="guarda_cronograma($event)" :pagoInicial="0" :moneda="monedaSimbolo" :planExistente="planExistenteFormateado" />

        <v-dialog v-model="edita_numeracion" max-width="500">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="edita_numeracion = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <h4 class="text-center">CAMBIAR DOCUMENTO POR :</h4>
                <v-radio-group class="mt-n1" v-model="tipocomprobante_edita" row>
                    <v-radio label="BOLETA" value="B"></v-radio>
                    <v-radio label="FACTURA" value="F"></v-radio>
                </v-radio-group>
                <h4 class="text-center">
                    ESTE PROCESO ANULARA EL COMPROBANTE {{ info_cabecera.serie }}-{{ info_cabecera.correlativoDocEmitido }}
                    ESTA SEGURO DE PROSEGUIR?
                </h4>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="cambiar_comprobante()" color="error">SI</v-btn>
                    <v-btn @click="edita_numeracion = false" color="success">NO</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_catalogo" max-width="550" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_catalogo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-1">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true" :x_categoria="false"></cat_fijo>
            </v-card>
        </v-dialog>
        <dial_stock v-model="dialStock" :items="sinStock" @close="dialStock = false" />

    </v-dialog>
</template>

<script>
import {
    editaProducto,
    edita_Cabecera_p,
    obtenContador,
    sumaContador,
    grabaCabecera_p,
    detalleCabecera_p,
    graba_detalle_p,
    graba_cabecera_p
} from '../../../db'
import {
    procesar_items
} from '../../../funciones_generales'
import moment from 'moment'
import store from '@/store/index'
import cronograma from '../../ventas/dialogos/cronograma_creditos.vue'
import axios from "axios"
import cat_fijo from '@/components/catalogo_fijo'
import dial_stock from '@/views/ventas/dialogos/dial_stock_insuficiente.vue'
import DescuentosPorcentaje from '@/components/descuentos_porcentaje.vue'

export default {
    name: 'caja',
    components: {
        cat_fijo,
        dial_stock,
        DescuentosPorcentaje,
        cronograma,
    },
    props: {
        cabecera: '',
        detalle: ''
    },
    data() {
        return {
            dial: false,
            dial_catalogo: false,
            dialogoProducto: false,
            dial_edita_cli: false,
            dial_edita_modo: false,
            edita_numeracion: false,
            info_cabecera: {},
            contador: {},
            date_vence: moment(String(new Date())).format('YYYY-MM-DD'),
            aumenta_porcentaje: false,
            listaproductos: [],
            codigoedita: '',
            cantidadEdita: '',
            precioedita: '',
            nombreEdita: '',
            preciodescuento: '',
            operacion_edita: '',
            item_selecto: null,
            tipocomprobante_edita: 'T',
            documentos: ['DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            arrayOperacion: ['GRAVADA', 'GRATUITA'],
            direccion: '',
            detalleOriginalSnapshot: [],
            dialStock: false,
            sinStock: [],
            precioFinalActual: 0,
            editKey: 0,
            precioCambiado: false,
            precioOriginalEdita: 0,
            descEdita: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 },
            dialogoCronograma: false,
            cronogramaData: null,
        }
    },
    created() {
        this.listaproductos = this.detalle
        this.info_cabecera = this.cabecera
        this.detalleOriginalSnapshot = JSON.parse(JSON.stringify(this.detalle))
        this.dial = true
    },
    computed: {
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/';
        },
        lista_productos() {
            return this.listaproductos
        },
        precioBaseEdita() {
            return Number(this.item_selecto?.precio) || Number(this.precioedita) || 0;
        },
        descuentosInicialesEdita() {
            return {
                desc_1: Number(this.item_selecto?.descuentos?.desc_1) || 0,
                desc_2: Number(this.item_selecto?.descuentos?.desc_2) || 0,
                desc_3: Number(this.item_selecto?.descuentos?.desc_3) || 0
            };
        },
        decimales() {
            return this.$store?.state?.configuracion?.decimal ?? 2;
        },
        tieneCronograma() {
            return this.info_cabecera?.cuotas &&
                Array.isArray(this.info_cabecera.cuotas) &&
                this.info_cabecera.cuotas.length > 0;
        },
        totalCuotas() {
            return this.tieneCronograma ? this.info_cabecera.cuotas.length : 0;
        },
        totalCuotasImporte() {
            if (!this.tieneCronograma) return 0;
            return this.info_cabecera.cuotas.reduce((sum, c) => sum + (Number(c.importe) || 0), 0);
        },
        planExistenteFormateado() {
            const cuotas = this.info_cabecera?.cuotas;
            if (!cuotas) return null;
            if (Array.isArray(cuotas)) {
                return { cuotas };
            }
            return cuotas;
        }
    },
    methods: {
        cierra() {
            this.$emit('cierra', false)
        },
        cambia_modo(data) {
            if (data === "CONTADO") {
                this.info_cabecera.pendiente_pago = 0;
                this.aumenta_porcentaje = false;
            } else {
                this.date_vence = moment().add(7, "days").format("YYYY-MM-DD");
                this.info_cabecera.pendiente_pago = this.info_cabecera.total;
                this.aumenta_porcentaje = true;
            }
        },
        async abrir_edita_comprobante() {
            try {
                const snapshot = await obtenContador().once("value")
                this.contador = snapshot.val();
                this.tipocomprobante_edita = this.info_cabecera.tipocomprobante;
                this.edita_numeracion = true;
            } catch (error) {
                console.error("Error al obtener el contador:", error);
                store.commit("dialogosnackbar", "Ocurrió un error al abrir la edición del comprobante.");
            }
        },
        async cambiar_comprobante() {
            try {
                store.commit("dialogoprogress");
                if (!["B", "F"].includes(this.tipocomprobante_edita)) {
                    throw new Error("Tipo de comprobante no válido. Use 'B' (Boleta) o 'F' (Factura).");
                }
                if (this.tipocomprobante_edita === this.info_cabecera.tipocomprobante) {
                    store.commit("dialogosnackbar", "El tipo de comprobante seleccionado es el mismo.");
                    this.edita_numeracion = false;
                    return;
                }
                const oldGrupo = this.info_cabecera.id_grupo;
                const oldNumeracion = this.info_cabecera.numeracion;
                await graba_cabecera_p(oldGrupo, oldNumeracion, {
                    ...this.info_cabecera,
                    estado: "ANULADO",
                    motivo_anulacion: "Cambio de tipo de comprobante",
                    numeracion: oldNumeracion,
                });
                const snap = await obtenContador().once("value");
                const contadores = snap.val() || {};
                const esBoleta = this.tipocomprobante_edita === "B";
                const cod_comprobante = esBoleta ? "03" : "01";
                const serie = esBoleta ? store.state.seriesdocumentos.boleta : store.state.seriesdocumentos.factura;
                const contadorKey = esBoleta ? "ordenboleta" : "ordenfactura";
                const correlActivo = String(contadores[contadorKey] || "00000000").padStart(8, "0");
                const ts = moment().unix();
                const numeracionNueva = serie + '-' + correlActivo;
                const nuevaCabecera = {
                    ...this.info_cabecera,
                    estado: "PENDIENTE",
                    tipocomprobante: this.tipocomprobante_edita,
                    cod_comprobante: cod_comprobante,
                    serie: serie,
                    correlativoDocEmitido: correlActivo,
                    numeracion: numeracionNueva,
                    fecha: ts,
                    vencimientoDoc: this.info_cabecera.forma_pago === "CONTADO" ? ts : (Number(this.info_cabecera?.vencimientoDoc) || ts),
                };
                const correlNuevo = (parseInt(correlActivo, 10) + 1).toString().padStart(8, "0");
                await Promise.all([
                    graba_cabecera_p(oldGrupo, numeracionNueva, nuevaCabecera),
                    graba_detalle_p(oldGrupo, numeracionNueva, this.listaproductos),
                    sumaContador(contadorKey, correlNuevo),
                ]);
                this.info_cabecera = { ...nuevaCabecera };
                this.edita_numeracion = false;
                store.commit("dialogosnackbar", `Comprobante cambiado a ${esBoleta ? "BOLETA" : "FACTURA"} ${serie}-${correlNuevo}`);
            } catch (error) {
                console.error("Error en cambiar_comprobante:", error);
                store.commit("dialogosnackbar", "Ocurrió un error al cambiar el comprobante.");
            } finally {
                store.commit("dialogoprogress");
                this.cierra();
            }
        },
        edita_modo() {
            const vd = Number(this.info_cabecera?.vencimientoDoc)
            const base = Number.isFinite(vd) && vd > 0 ? vd : moment().add(7, 'days').unix()
            this.date_vence = moment.unix(base).format('YYYY-MM-DD')
            this.dial_edita_modo = true
        },
        graba_edita_modo() {
            if (this.info_cabecera.forma_pago === 'CREDITO') {
                let vd = this.safeUnixFromYMD(this.date_vence)
                if (!Number.isFinite(vd)) {
                    const base = Number(this.info_cabecera?.fecha) || moment().unix()
                    const dias = Number(this.info_cabecera?.dias_credito) || 7
                    vd = moment.unix(base).add(dias, 'days').unix()
                }
                this.info_cabecera.vencimientoDoc = vd
                if (!Number(this.info_cabecera.pendiente_pago)) {
                    this.info_cabecera.pendiente_pago = Number(this.info_cabecera.total) || 0
                }
                const cuotas = this.info_cabecera?.cuotas;
                if (this.cronogramaData) {
                    this.info_cabecera.cuotas = this.cronogramaData.cuotas || this.cronogramaData;
                    this.info_cabecera.cronograma = this.cronogramaData.cuotas || this.cronogramaData;
                } else if (!Array.isArray(cuotas) || cuotas.length === 0) {
                    this.info_cabecera.cuotas = this.buildCuotasCreditoDefault();
                    this.info_cabecera.cronograma = this.info_cabecera.cuotas;
                } else {
                    this.info_cabecera.cuotas = cuotas.map((c, idx) => ({
                        numero: c.numero || String(idx + 1).padStart(3, '0'),
                        importe: (Number(c.importe) || 0).toFixed(2),
                        vencimiento: c.vencimiento || this.date_vence,
                        estado: c.estado || 'pendiente',
                        fecha_modificacion: c.fecha_modificacion || moment().unix(),
                        vendedor: c.vendedor || (this.info_cabecera.cod_vendedor || this.info_cabecera.vendedor || store.state.sedeActual.codigo),
                    }));
                    this.info_cabecera.cronograma = this.info_cabecera.cuotas;
                }
            } else {
                const f = Number(this.info_cabecera?.fecha)
                this.info_cabecera.vencimientoDoc = Number.isFinite(f) ? f : moment().unix()
                this.info_cabecera.pendiente_pago = 0
                this.info_cabecera.cuotas = ''
                this.info_cabecera.cronograma = null
                this.cronogramaData = null
            }
            this.dial_edita_modo = false
        },
        buildCuotasCreditoDefault() {
            const total = Number(this.info_cabecera?.total) || 0
            const pendiente = Number(this.info_cabecera?.pendiente_pago) || total
            const vendedor = this.info_cabecera?.cod_vendedor || this.info_cabecera?.vendedor || store.state.sedeActual.codigo
            return [{
                numero: '001',
                importe: pendiente.toFixed(2),
                vencimiento: this.date_vence,
                estado: 'pendiente',
                fecha_modificacion: moment().unix(),
                vendedor
            }]
        },
        agregar_lista(value) {
            const items = Array.isArray(value) ? value : [value];
            items.forEach(val => {
                let medidaLinea = (val.medida || '').toString().trim().toUpperCase();
                const yaExiste = this.listaproductos.find(item =>
                    item.id === val.id &&
                    String(item.operacion || '').toUpperCase() === String(val.operacion || '').toUpperCase() &&
                    String(item.medida || '').toUpperCase() === medidaLinea
                );
                if (yaExiste) {
                    const etiqueta = medidaLinea || 'UNIDAD';
                    store.commit("dialogosnackbar", `Producto ya en lista (${etiqueta})`);
                    return;
                }
                const esGratuita = String(val.operacion || '').toUpperCase() === 'GRATUITA';
                const totalLinea = esGratuita ? 0 : Math.max(0, val.cantidad * val.precio);
                this.listaproductos.push({
                    uuid: this.create_UUID().substring(29),
                    factor: val.factor,
                    id: val.id,
                    cantidad: Number(val.cantidad || 0),
                    nombre: val.nombre,
                    medida: medidaLinea,
                    precio: Number(val.precio || 0),
                    precioedita: Number(val.precio || 0),
                    preciodescuento: 0,
                    costo: val.costo,
                    tipoproducto: val.tipoproducto,
                    operacion: val.operacion,
                    peso: 0,
                    controstock: val.controstock,
                    totalLinea: totalLinea,
                    descuentos: { desc_1: 0, desc_2: 0, desc_3: 0 }
                });
            });
        },
        restaurarPrecioBase() {
            const precioCatalogo = this.obtenerPrecioCatalogo(this.item_selecto?.id);
            this.precioedita = precioCatalogo;
            this.precioCambiado = false;
            if (this.item_selecto) {
                this.item_selecto.precio = precioCatalogo;
            }
            this.descEdita = {
                desc_1: 0,
                desc_2: 0,
                desc_3: 0,
                precioFinal: precioCatalogo,
                montoDescuento: 0
            };
            if (this.item_selecto) {
                this.item_selecto.descuentos = { desc_1: 0, desc_2: 0, desc_3: 0 };
            }
        },
        editaProducto(id) {
            console.log(id);
            this.editKey++;
            this.precioCambiado = false;
            const producto = this.listaproductos.find(
                (p) =>
                    p.id === id.id &&
                    p.medida === id.medida &&
                    p.operacion === id.operacion
            );
            if (producto) {
                const precioCatalogo = this.obtenerPrecioCatalogo(producto.id);
                const desc1 = producto.descuentos?.desc_1 ?? 0;
                const desc2 = producto.descuentos?.desc_2 ?? 0;
                const desc3 = producto.descuentos?.desc_3 ?? 0;
                const precioFinalActual = producto.precioedita || producto.precio || precioCatalogo;
                const precioBaseActual = producto.precio || precioCatalogo;
                this.item_selecto = {
                    ...producto,
                    precio: precioBaseActual,
                    descuentos: { desc_1: desc1, desc_2: desc2, desc_3: desc3 }
                };
                this.codigoedita = this.listaproductos.indexOf(producto);
                this.cantidadEdita = producto.cantidad;
                this.precioedita = precioBaseActual;
                this.precioFinalActual = precioFinalActual;
                this.precioOriginalEdita = precioCatalogo;
                this.preciodescuento = producto.preciodescuento;
                this.nombreEdita = producto.nombre;
                this.operacion_edita = producto.operacion;
                this.descEdita = {
                    desc_1: desc1,
                    desc_2: desc2,
                    desc_3: desc3,
                    precioFinal: precioFinalActual,
                    montoDescuento: precioBaseActual - precioFinalActual
                };
                this.precioCambiado = producto.precio && producto.precio !== precioCatalogo;
            }
            this.dialogoProducto = true;
        },
        obtenerPrecioCatalogo(productoId) {
            if (!productoId) {
                return 0;
            }
            const productoCatalogo = store.state.productos?.find(
                p => String(p.id) === String(productoId)
            );
            if (!productoCatalogo) { return 0; }
            const precio = Number(productoCatalogo.precio) || 0;
            return precio;
        },
        onPrecioEditaChange() {
            const precioActual = Number(this.precioedita) || 0;
            const precioCatalogo = this.obtenerPrecioCatalogo(this.item_selecto?.id);
            this.precioCambiado = precioActual !== precioCatalogo;
            if (this.item_selecto) {
                this.item_selecto.precio = precioActual;
                if (this.precioCambiado) {
                    this.descEdita = {
                        desc_1: 0,
                        desc_2: 0,
                        desc_3: 0,
                        precioFinal: precioActual,
                        montoDescuento: 0
                    };
                    this.item_selecto.descuentos = { desc_1: 0, desc_2: 0, desc_3: 0 };
                } else {
                    if (this.$refs.descEditaRef) {
                        this.$refs.descEditaRef.recalcularDesdeBase();
                    }
                }
            }
        },
        onDescEditaCambio(data) {
            this.descEdita = data;
            if (this.item_selecto && data.precioFinal !== undefined) {
                if (!this.item_selecto.descuentos) {
                    this.item_selecto.descuentos = {};
                }
                this.item_selecto.descuentos.desc_1 = data.desc_1 || 0;
                this.item_selecto.descuentos.desc_2 = data.desc_2 || 0;
                this.item_selecto.descuentos.desc_3 = data.desc_3 || 0;
                this.precioFinalActual = data.precioFinal;
                if (!this.precioCambiado) {
                    this.item_selecto.precio = this.precioOriginalEdita;
                }
            }
        },
        async grabaEdita() {
            if (!this.cantidadEdita || parseFloat(this.cantidadEdita) === 0) {
                alert("La cantidad no puede ser vacía o cero.");
                this.cantidadEdita = 1;
                return;
            }
            store.commit("dialogoprogress");
            const producto = this.listaproductos[this.codigoedita];
            const tieneDescuentos = (this.descEdita.desc_1 > 0 || this.descEdita.desc_2 > 0 || this.descEdita.desc_3 > 0);
            const precioCatalogo = this.obtenerPrecioCatalogo(producto.id);
            const precioOriginal = Number(producto.precio) || precioCatalogo;
            let precioFinal;
            if (tieneDescuentos && this.operacion_edita !== 'GRATUITA') {
                precioFinal = this.descEdita.precioFinal;
            } else {
                precioFinal = precioOriginal;
            }
            producto.cantidad = Number(this.cantidadEdita);
            producto.precio = this.redondear(precioFinal);
            producto.precioedita = this.redondear(precioFinal);
            producto.operacion = this.operacion_edita.trim();
            producto.nombre = this.nombreEdita.trim();
            producto.descuentos = {
                desc_1: Number(this.descEdita.desc_1) || 0,
                desc_2: Number(this.descEdita.desc_2) || 0,
                desc_3: Number(this.descEdita.desc_3) || 0
            };
            const esGratuita = this.operacion_edita === 'GRATUITA';
            producto.totalLinea = esGratuita ? 0 : Number(producto.cantidad) * Number(precioFinal);
            this.$forceUpdate();
            store.commit("dialogoprogress");
            this.dialogoProducto = false;
        },
        calcularTotalItem(item) {
            const cantidad = Number(item.cantidad) || 0;
            const precioNeto = Number(item.precioedita || item.precio) || 0;
            if (item.operacion === 'GRATUITA') {
                return '0.00';
            }
            return this.redondear(cantidad * precioNeto);
        },
        calcularTotalGeneral() {
            return this.redondear(
                this.listaproductos.reduce((total, item) => {
                    if (item.operacion === 'GRATUITA') {
                        return total;
                    }
                    const cantidad = Number(item.cantidad) || 0;
                    const precioNeto = Number(item.precioedita || item.precio) || 0;
                    return total + (cantidad * precioNeto);
                }, 0)
            );
        },
        async eliminaedita() {
            store.commit("dialogoprogress");
            this.listaproductos.splice(this.codigoedita, 1);
            this.dialogoProducto = false;
            store.commit("dialogoprogress");
        },
        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        async guardar() {
            const cabeceraAntes = JSON.parse(JSON.stringify(this.info_cabecera));
            try {
                store.commit("dialogoprogress");
                const productosLimpios = this.listaproductos.map(producto => {
                    const limpio = { ...producto };
                    if (limpio.descuentos) {
                        limpio.descuentos = {
                            desc_1: Number(limpio.descuentos.desc_1) || 0,
                            desc_2: Number(limpio.descuentos.desc_2) || 0,
                            desc_3: Number(limpio.descuentos.desc_3) || 0
                        };
                    }
                    return limpio;
                });
                const resp = await procesar_items(productosLimpios);
                const cab = resp[0];
                const detalleNuevo = resp[1];
                const nextCabecera = { ...this.info_cabecera };
                nextCabecera.total_op_gravadas = cab.total_op_gravadas;
                nextCabecera.total_op_inafectas = cab.total_op_inafectas;
                nextCabecera.total_op_gratuitas = cab.total_op_gratuitas;
                nextCabecera.igv = cab.igv;
                nextCabecera.total_op_exoneradas = cab.total_op_exoneradas;
                nextCabecera.totalIGV_GRATUITA = cab.totalIGV_GRATUITA;
                const totalGravadas = Number(cab.total_op_gravadas) + Number(cab.igv);
                const totalExoneradas = Number(cab.total_op_exoneradas);
                nextCabecera.total = this.redondear(totalGravadas + totalExoneradas);
                if (nextCabecera.forma_pago === "CONTADO") {
                    nextCabecera.pendiente_pago = 0;
                } else if (Number(nextCabecera.pendiente_pago) === 0) {
                    nextCabecera.pendiente_pago = Number(nextCabecera.total).toFixed(2);
                }
                nextCabecera.vencimientoDoc = this._normalizeVencimientoDocLocal(nextCabecera);
                const payload = {
                    detalle: detalleNuevo,
                    detalle_original: this.detalleOriginalSnapshot,
                    cabecera: nextCabecera,
                };
                const r = await this.api_rest(payload, "edita_comprobante");
                if (!r) {
                    this.info_cabecera = cabeceraAntes;
                    store.commit("dialogoprogress");
                    return;
                }
                this.info_cabecera = nextCabecera;
                await Promise.all([
                    grabaCabecera_p(this.info_cabecera.id_grupo, this.info_cabecera.numeracion, this.info_cabecera),
                    detalleCabecera_p(this.info_cabecera.id_grupo, this.info_cabecera.numeracion, detalleNuevo),
                ]);
                store.commit("dialogoprogress");
                store.commit("dialogosnackbar", "Documento actualizado correctamente");
                this.cierra();
            } catch (e) {
                this.info_cabecera = cabeceraAntes;
                store.commit("dialogoprogress");
                store.commit("dialogosnackbar", "Error guardando el documento: " + (e.message || "Error desconocido"));
            }
        },
        _normalizeVencimientoDocLocal(cab) {
            let vd = Number(cab?.vencimientoDoc);
            if (!Number.isFinite(vd) || vd <= 0) {
                const f = Number(cab?.fecha);
                vd = Number.isFinite(f) && f > 0 ? f : moment().unix();
            }
            return vd;
        },
        async api_rest(data, metodo) {
            const grupo = this.info_cabecera.id_grupo;
            const numeracion = this.info_cabecera.numeracion;
            const idem = this.makeIdemKey({ metodo, grupo, numeracion, payload: data });
            try {
                const resp = await axios({
                    method: "POST",
                    url: "https://api-distribucion-6sfc6tum4a-rj.a.run.app",
                    headers: {
                        "x-idempotency-key": idem,
                    },
                    data: {
                        bd: store.state.baseDatos.bd,
                        data,
                        metodo,
                    },
                });
                if (resp.status === 202 || resp.data?.status === "processing") {
                    const e = new Error("EN PROCESO");
                    e.response = { status: 202, data: resp.data };
                    throw e;
                }
                return resp.data;
            } catch (err) {
                const status = err?.response?.status;
                const body = err?.response?.data || {};
                if (status === 409 && body?.code === "STOCK_INSUFICIENTE") {
                    this.sinStock = Array.isArray(body.sinStock) ? body.sinStock : [];
                    this.dialStock = true;
                    return null;
                }
                throw err;
            }
        },
        normalizaDetalle(arr = []) {
            const A = Array.isArray(arr) ? arr : []
            return A.map(it => ({
                id: it.id,
                cantidad: Number(it.cantidad || 0),
                factor: Number(it.factor || 1),
                medida: String(it.medida || 'UNIDAD').toUpperCase(),
                controstock: Boolean(it.controstock),
            }))
        },
        safeUnixFromYMD(ymd) {
            const m = moment(ymd, 'YYYY-MM-DD', true)
            return m.isValid() ? m.unix() : null
        },
        normalizeVencimientoDoc() {
            let vd = Number(this.info_cabecera?.vencimientoDoc)
            if (!Number.isFinite(vd) || vd <= 0) {
                const f = Number(this.info_cabecera?.fecha)
                vd = Number.isFinite(f) && f > 0 ? f : moment().unix()
            }
            this.info_cabecera.vencimientoDoc = vd
        },
        stableStringify(obj) {
            if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
            if (Array.isArray(obj)) return `[${obj.map(this.stableStringify).join(',')}]`;
            const keys = Object.keys(obj).sort();
            return `{${keys.map(k => JSON.stringify(k) + ':' + this.stableStringify(obj[k])).join(',')}}`;
        },
        hashDJB2(str) {
            let h = 5381;
            for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
            return (h >>> 0).toString(16);
        },
        makeIdemKey({ metodo, grupo, numeracion, payload }) {
            const fingerprint = this.stableStringify({
                detalle: payload?.detalle || [],
            });
            const h = this.hashDJB2(fingerprint);
            return `${metodo}:${grupo}:${numeracion}:${h}`;
        },
        abrirCronogramaDesdeModo() {
            if (this.info_cabecera.forma_pago !== 'CREDITO') return;
            const montoPendiente = Number(this.info_cabecera.pendiente_pago) || 0;
            if (montoPendiente <= 0) {
                store.commit("dialogosnackbar", "Ingrese un monto pendiente de pago válido");
                return;
            }
            this.dialogoCronograma = true;
        },
        guarda_cronograma(cronograma) {
            this.cronogramaData = cronograma;
            this.$set(this.info_cabecera, 'cronograma', cronograma.cuotas || cronograma);
            this.$set(this.info_cabecera, 'cuotas', cronograma.cuotas || cronograma);
            const sumaCuotas = (cronograma.cuotas || cronograma).reduce((sum, c) => sum + (Number(c.importe) || 0), 0);
            const pendiente = Number(this.info_cabecera.pendiente_pago) || 0;
            if (Math.abs(sumaCuotas - pendiente) > 0.01) {
                console.warn(`La suma de cuotas (${sumaCuotas}) no coincide con el pendiente (${pendiente})`);
            }
            if (cronograma.fecha_ultima_cuota) {
                this.date_vence = cronograma.fecha_ultima_cuota;
                this.$set(this.info_cabecera, 'fecha_vencimiento', cronograma.fecha_ultima_cuota);
                this.$set(this.info_cabecera, 'vencimientoDoc', moment(cronograma.fecha_ultima_cuota).unix());
            }
            this.dialogoCronograma = false;
        },
    },
}
</script>

<style scoped>
.position-relative {
    position: relative;
}
</style>