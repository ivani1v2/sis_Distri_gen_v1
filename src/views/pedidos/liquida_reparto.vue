<template>
    <div class="pa-3 mt-6">
        <v-row dense class="mt-2">
            <v-col cols="4">
                <h5 class="">
                    FECHA REPARTO : {{ conviertefecha(cabecera_total.fecha_emision) }}
                </h5>
            </v-col>
            <v-col cols="4">
                <v-menu bottom offset-y transition="scale-transition">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="red darken-2" dark block small v-bind="attrs" v-on="on" class="rounded-lg">
                            <v-icon left small>mdi-file-chart</v-icon>
                            Reportes
                            <v-spacer></v-spacer>
                            <v-icon right small>mdi-chevron-down</v-icon>
                        </v-btn>
                    </template>

                    <v-list dense class="py-1">
                        <v-list-item @click="dial_descarga = true">
                            <v-list-item-icon><v-icon color="blue darken-2">mdi-warehouse</v-icon></v-list-item-icon>
                            <v-list-item-title>Reporte Almacén</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="reporte_producto_cliente()">
                            <v-list-item-icon><v-icon
                                    color="green darken-2">mdi-account-multiple</v-icon></v-list-item-icon>
                            <v-list-item-title>Producto x Cliente</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="pdf_transporte()">
                            <v-list-item-icon><v-icon color="indigo darken-2">mdi-truck</v-icon></v-list-item-icon>
                            <v-list-item-title>Reporte Transporte</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="reporte_cobrar()">
                            <v-list-item-icon><v-icon
                                    color="orange darken-2">mdi-account-cash</v-icon></v-list-item-icon>
                            <v-list-item-title>Por Cobrar</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="ver_detalle_masivo()">
                            <v-list-item-icon><v-icon color="purple darken-2">mdi-file-eye</v-icon></v-list-item-icon>
                            <v-list-item-title>Ver Detalle</v-list-item-title>
                        </v-list-item>

                        <v-divider></v-divider>

                        <v-list-item @click="dialogo_imprime = !dialogo_imprime">
                            <v-list-item-icon><v-icon color="teal darken-2">mdi-printer</v-icon></v-list-item-icon>
                            <v-list-item-title>Imprimir Comprobantes</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>

            <v-col cols="4">
                <v-menu bottom offset-y transition="scale-transition">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="blue darken-3" dark block small v-bind="attrs" v-on="on" class="rounded-lg">
                            <v-icon left small>mdi-cogs</v-icon>
                            Acciones
                            <v-spacer></v-spacer>
                            <v-icon right small>mdi-chevron-down</v-icon>
                        </v-btn>
                    </template>

                    <v-list dense class="py-1">

                        <v-list-item @click="envia_sunat">
                            <v-list-item-icon><v-icon color="green">mdi-cloud-upload</v-icon></v-list-item-icon>
                            <v-list-item-title>Enviar a Sunat</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="abare_guias()">
                            <v-list-item-icon><v-icon color="cyan darken-2">mdi-file-send</v-icon></v-list-item-icon>
                            <v-list-item-title>Guía de Remisión</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="transferir_pedidos()">
                            <v-list-item-icon><v-icon
                                    color="deep-purple darken-1">mdi-swap-horizontal</v-icon></v-list-item-icon>
                            <v-list-item-title>Transferir Pedidos</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="anular_masivo()">
                            <v-list-item-icon><v-icon color="red">mdi-cancel</v-icon></v-list-item-icon>
                            <v-list-item-title>Anular Masivo</v-list-item-title>
                        </v-list-item>

                    </v-list>
                </v-menu>
            </v-col>
        </v-row>
        <v-row dense class="mt-n1">
            <v-col cols="4">

                <h3>
                    <v-icon color="red" large @click="anterior()">mdi-arrow-left-bold</v-icon>
                    REPARTO N°{{ router_grupo }}
                    <v-icon color="red" large @click="siguiente()">mdi-arrow-right-bold</v-icon>
                </h3>

            </v-col>
            <v-col cols="4">
                <h4>TOTAL (S/.): {{ t_general }}</h4>
                <h6>Contado (S/.): {{ t_contado }}</h6>
                <h6>Credito (S/.): {{ t_credito }}</h6>
            </v-col>
            <v-col cols="4">
                <h4>TOTAL PEDIDOS: {{ suma_pedidos }}</h4>
            </v-col>

        </v-row>

        <v-simple-table fixed-header dense height='65vh'>
            <template v-slot:default>
                <thead>
                    <tr>
                        <th class="text-left">

                            Correlativo
                        </th>
                        <th class="text-left">
                            Nombre
                        </th>

                        <th class="text-left">
                            <v-icon color="info"
                                @click="(ordenar_correlativo = false, ordenar_vendedor = !ordenar_vendedor)">mdi-sort-alphabetical-descending</v-icon>
                            Vend.
                        </th>
                        <th class="text-left">
                            Peso (KG)
                        </th>
                        <th class="text-left">
                            Modo
                        </th>
                        <th class="text-left">
                            Estado
                        </th>
                        <th class="text-left">
                            Monto Credito
                        </th>
                        <th class="text-left">
                            Total
                        </th>
                        <th class="text-left">
                            <div class="d-flex">
                                Accion
                                <v-checkbox class="mt-n1 mb-n8" dense v-model="consolida_t" @click="consolida_todo()">
                                </v-checkbox>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in listafiltrada" :key="item.numeracion">
                        <td style="font-size:75%;" width="150">{{ item.numeracion }} <span @click="imprime_guia(item)"
                                class="red--text" v-if="item.guia_id"> - GR</span> </td>
                        <td style="font-size:75%;" width="500">{{ item.dni }} - {{ item.cliente }}</td>
                        <td style="font-size:75%;" width="20">{{ item.vendedor }}</td>
                        <td style="font-size:75%;" width="20">{{ item.peso_total }}</td>
                        <td style="font-size:75%;" white="30">{{ item.forma_pago }}</td>
                        <td style="font-size:75%;" white="15" v-if="item.estado == 'ANULADO'" class="red--text">ANUL
                        </td>
                        <td style="font-size:75%;" white="15" v-if="item.estado == 'PENDIENTE'" class="orange--text">
                            PEND
                        </td>
                        <td style="font-size:75%;" white="15" v-if="item.estado == 'ENVIADO'" class="green--text">ENVI
                        </td>
                        <td style="font-size:75%;" white="20">{{ item.moneda }}{{ item.pendiente_pago }}</td>
                        <td style="font-size:75%;" white="20">{{ item.moneda }}{{ item.total }}</td>
                        <td width="50">
                            <v-row dense>
                                <v-col cols="6">
                                    <v-menu>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn icon v-bind="attrs" v-on="on">
                                                <v-icon>mdi-dots-vertical</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list dense>
                                            <v-list-item @click='ver_detalle(item)'>
                                                <v-list-item-icon>
                                                    <v-icon color="warning"> mdi-eye</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>ver Detalle</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click='imprimir(item)'>
                                                <v-list-item-icon>
                                                    <v-icon color="info"> mdi-cash-register</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Imprimir</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click='edita_c(item)' v-if="item.estado == 'PENDIENTE'">
                                                <v-list-item-icon>
                                                    <v-icon color="success"> mdi-pencil</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Editar</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click='abrirDialogoAnulacion(item)'
                                                v-if="item.estado == 'PENDIENTE'">
                                                <v-list-item-icon>
                                                    <v-icon color="error"> mdi-delete</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Anular</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </v-col>
                                <v-col cols="6">
                                    <v-checkbox class="mb-n9" dense v-model="item.consolida"></v-checkbox>
                                </v-col>
                            </v-row>

                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>

        <v-dialog v-model="dialogo_detalle" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(dialogo_detalle = false)">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon @click="Exporta_excel()" large color="success">mdi-microsoft-excel</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>
                <v-simple-table dark fixed-header height="70vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Medida
                                </th>
                                <th class="text-left">
                                    Cantidad.
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in arrayConsolidar" :key="item">
                                <td>{{ item.id + ' ' + item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precio }} </td>
                                <td>S/.{{ item.total }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_descarga" max-width="500">
            <v-card class="pa-5">
                <h4 class="text-center">Seleccione el formato de descarga</h4>
                <v-textarea v-model="observacion_reporte" label="Observación" outlined dense rows="2"
                    auto-grow></v-textarea>
                <v-row class="pa-1 mt-n2">
                    <v-col cols="6">
                        <v-btn class="mt-5" color="success" block @click="pdf_almacen()"> PDF </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn class="mt-5" color="error" block @click="exportar_ex()"> EXCEL </v-btn>
                    </v-col>
                </v-row>

            </v-card>
        </v-dialog>
        <v-dialog persistent v-model="progress2" max-width="500">
            <v-card class="pa-12">
                <h5 class="text-center">No interrumpa el proceso</h5>
                <v-progress-linear v-model="skill" color="blue-grey" height="25">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>
            </v-card>
        </v-dialog>
        <v-dialog persistent v-model="progress" max-width="500">
            <v-card class="pa-12">
                <h5 class="text-center">No interrumpa el proceso</h5>
                <v-progress-linear indeterminate color="blue-grey" height="25">
                </v-progress-linear>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_motivo_anulacion" max-width="520px" persistent>
            <v-card>
                <v-system-bar window dark>
                    <v-icon @click="cerrarDialogoAnulacion">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <span class="caption">Motivo de anulación</span>
                </v-system-bar>

                <v-card-text class="pt-4">
                    <div class="mb-3 grey--text text--darken-1 text-caption">
                        Indique el motivo por el cual se anula el comprobante
                        <strong v-if="comp_anular">{{ comp_anular.numeracion }}</strong>.
                    </div>

                    <!-- Opciones rápidas (opcional) -->
                    <v-select dense outlined clearable :items="motivos_predeterminados"
                        label="Motivo (selección rápida)" v-model="motivo_seleccion" @change="sincronizaMotivo" />

                    <!-- Texto libre -->
                    <v-textarea outlined dense auto-grow rows="2" v-model.trim="motivo_anulacion"
                        label="Detalle del motivo (obligatorio)" :rules="[v => !!v || 'Ingrese el motivo']" />

                    <!-- Mostrar error simple -->
                    <div v-if="error_motivo" class="red--text text-caption mt-1">{{ error_motivo }}</div>
                </v-card-text>

                <v-card-actions class="px-4 pb-4">
                    <v-spacer></v-spacer>
                    <v-btn text @click="cerrarDialogoAnulacion">Cancelar</v-btn>
                    <v-btn color="error" :loading="anulando" @click="confirmarAnulacion">
                        Anular comprobante
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 🔵 DIALOGO DE PROGRESO DE IMPRESIÓN -->
        <v-dialog v-model="printDialog" persistent max-width="500">
            <v-card class="pa-6">
                <h5 class="text-center">Imprimiendo comprobantes…</h5>

                <div class="text-center caption mb-2">
                    {{ printDone }} / {{ printTotal }} completados — faltan {{ Math.max(printTotal - printDone, 0) }}
                </div>

                <v-progress-linear :value="printPercent" height="22" color="blue-grey">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>

                <div v-if="printError" class="red--text text-caption mt-2">{{ printError }}</div>

                <div class="mt-4 d-flex justify-end">
                    <v-btn text color="primary" @click="printDialog = false" :disabled="printDone < printTotal">
                        Cerrar
                    </v-btn>
                </div>
            </v-card>
        </v-dialog>
        <!-- Detalle (por pedido) -->
        <v-dialog v-model="dialogDetalle" max-width="650">
            <v-card>
                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Medida</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="d in pedidoSeleccionado" :key="`${d.id}-${d.nombre}`">
                            <td style="font-size:75%;"> <strong class="red--text">{{ d.cantidad }}</strong> x {{
                                d.nombre }}
                                <strong class="red--text" v-if="d.operacion == 'GRATUITA'">{{ d.operacion }}</strong>
                            </td>
                            <td style="font-size:75%;">{{ d.medida }}</td>
                            <td style="font-size:75%;">S/.{{ d.precio }} <strong v-if="d.preciodescuento != 0"
                                    class="red--text">
                                    - {{ d.preciodescuento }}</strong></td>
                            <td style="font-size:75%;">S/.{{ (Number(d.total_antes_impuestos) +
                                Number(d.total_impuestos)).toFixed(2) }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_imprime" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_imprime = !dialogo_imprime">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprime_comprobante('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprime_comprobante('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprime_comprobante('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <genera_guias v-if="dialogo_guia" @cierra="dialogo_guia = false" @graba="carga_Guia()" :data_guia="data_guia" />
        <dialogo_edita_c v-if="dialogo_edita_" @cierra="dialogo_edita_ = false, recalcula_cabecera()"
            :cabecera="cabecera_selecta" :detalle="detalle_selecto" />
        <imprime v-if="genera_pdf" :data="seleccionado" :detalle="detalle_selecto" @cierra="genera_pdf = $event" />
    </div>
</template>

<script>
import {
    Cabecera_p,
    all_Cabecera_p,
    all_detalle_p,
    allcuentaxcobrar,
    buscaGuiaremision,
    eliminar_Movimientos,
    all_serv_imp,
    grabaCabecera_p,
    modifica_pedidos,
    nueva_cabecera_reparto
} from '../../db'

import store from '@/store/index'
import XLSX from 'xlsx'
import moment from 'moment'
import dialogo_edita_c from './dialogos/dialogo_edita_c'
import genera_guias from './dialogos/genera_guias.vue'
import {
    pdfGenera
} from '../../pdf_comprobantes'
import {
    pdf_cuentas_cobrar
} from '../../pdf_reportes'
import {
    reporte_almacen,
    reporte_transporte
} from './reportes_pdf'
import imprime from '@/components/dialogos/dialog_imprime'
import {
    generaGuia
} from '../../pdf_guia'
import { reporteProductoClientePDF } from './reportes_pdf'
import axios from "axios"
import { colClientes } from '../../db_firestore'
export default {
    components: {
        dialogo_edita_c,
        imprime,
        genera_guias,
    },
    data() {
        return {
            dialogo_imprime: false,
            dialogDetalle: false,
            pedidoSeleccionado: null,
            dialogo_motivo_anulacion: false,
            comp_anular: null,
            motivo_anulacion: '',
            motivo_seleccion: null,
            motivos_predeterminados: [
                'Error en la operación',
                'Datos del cliente incorrectos',
                'Producto/servicio cargado por error',
                'Duplicado',
                'Solicitud del cliente'
            ],
            error_motivo: '',
            anulando: false,
            seleccionado: [],
            detalle_selecto: [],
            genera_pdf: false,
            data_guia: [],
            dialogo_guia: false,
            dial_descarga: false,
            progress2: false,
            progress: false,
            skill: 0,
            dialogo_detalle: false,
            dialo_crea: false,
            desserts: [],
            date1: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            fecha_traslado: moment(String(new Date)).format('YYYY-MM-DD'),
            arrayConsolidar: [],
            modulo: [],
            vendedor: [],
            consolida_t: false,
            total_contado: 0,
            total_credito: 0,
            total_peso: 0,
            total_item: 0,
            num_doc: '',
            detalles: [],
            cabecera_total: '',
            dialo_datos: false,
            desactiva_guia: false,
            dial_impresion: false,
            inicio_impresion: 0,
            dia_envia_sunat: false,
            suma_peso: 0,
            t_general: 0,
            t_credito: 0,
            t_contado: 0,
            router_grupo: '',
            ordenar_vendedor: false,
            ordenar_correlativo: false,
            dialogo_edita_: false,
            listafiltrada: [],
            cabecera_selecta: [],
            detalle_selecto: [],
            printDialog: false,
            printTotal: 0,
            printDone: 0,
            printError: '',
            observacion_reporte: '',
        }
    },
    created() {

        this.router_grupo = this.$route.params.id
        this.inicio()

    },
    mounted() {
        all_Cabecera_p(this.router_grupo).on("value", this.onDataChange);
    },
    beforeDestroy() {
        all_Cabecera_p(this.router_grupo).off("value", this.onDataChange);

    },
    watch: {
        router_grupo() {
            this.inicio(); // carga cabecera
            all_Cabecera_p(this.router_grupo).off("value", this.onDataChange); // limpia anterior
            all_Cabecera_p(this.router_grupo).on("value", this.onDataChange); // escucha nuevo
        }
    },
    computed: {
        printPercent() {
            return this.printTotal ? (this.printDone / this.printTotal) * 100 : 0;
        },
        suma_pedidos() {
            let total = 0;
            let sum_soles = 0;
            let sum_peso = 0;
            let sum_credito = 0;
            let sum_contado = 0;

            this.desserts.forEach((pedido) => {
                if (pedido.estado !== "ANULADO") {
                    total += 1;
                    sum_soles += parseFloat(pedido.total);
                    sum_peso += parseFloat(pedido.peso_total);

                    if (pedido.pendiente_pago === 0) {
                        sum_contado += parseFloat(pedido.total);
                    } else {
                        sum_credito += parseFloat(pedido.pendiente_pago);
                    }
                }
            });

            this.t_general = sum_soles.toFixed(2);
            this.suma_peso = sum_peso.toFixed(2);
            this.t_credito = sum_credito.toFixed(2);
            this.t_contado = sum_contado.toFixed(2);

            return total;
        },
    },
    watch: {
        router_grupo() {
            this.inicio(); // actualiza cabecera
            all_Cabecera_p(this.router_grupo).off("value", this.onDataChange);
            all_Cabecera_p(this.router_grupo).on("value", this.onDataChange);
        },
        num_doc() {
            this.filtrarLista();
        },
        ordenar_vendedor() {
            this.filtrarLista();
        },
        ordenar_correlativo() {
            this.filtrarLista();
        }
    },
    methods: {
        recalcula_cabecera() {
            const resumen = {
                peso_total: 0,
                total_contado: 0,
                total_credito: 0,
                total_general: 0,
                total_pedidos: 0
            };

            // Recorremos todos los comprobantes del reparto
            this.desserts.forEach(p => {
                if (p.estado === 'ANULADO') return; // no suma anulados

                resumen.peso_total += Number(p.peso_total || 0);
                resumen.total_general += Number(p.total || 0);
                resumen.total_pedidos += 1;

                const pendiente = Number(p.pendiente_pago || 0);

                if (pendiente === 0) {
                    // Todo contado
                    resumen.total_contado += Number(p.total || 0);
                } else {
                    // Crédito pendiente
                    resumen.total_credito += pendiente;
                }
            });

            // Redondeo básico
            resumen.peso_total = Number(resumen.peso_total.toFixed(2));
            resumen.total_contado = Number(resumen.total_contado.toFixed(2));
            resumen.total_credito = Number(resumen.total_credito.toFixed(2));
            resumen.total_general = Number(resumen.total_general.toFixed(2));

            // Actualiza la cabecera del reparto
            nueva_cabecera_reparto(this.router_grupo + '/total', resumen.total_general);
            nueva_cabecera_reparto(this.router_grupo + '/total_pedidos', resumen.total_pedidos);
            nueva_cabecera_reparto(this.router_grupo + '/resumen', resumen);
        },

        async transferir_pedidos() {
            const seleccionados = this.desserts.filter(d => d.consolida);
            if (seleccionados.length === 0) {
                alert('No hay pedidos seleccionados para transferir.');
                return;
            }
            const nuevo_reparto = prompt('Ingrese el número del nuevo reparto:');
            if (!nuevo_reparto) {
                alert('Operación cancelada. No se ingresó un número de reparto válido.');
                return;
            }
            store.commit("dialogoprogress")
            var array = [];
            for (const pedido of seleccionados) {
                console.log('Transferiendo pedido:', pedido);
                const snapshot = await all_detalle_p(this.router_grupo, pedido.numeracion).once("value");
                array.push({
                    cabecera: { ...pedido, id_grupo: nuevo_reparto },
                    items: snapshot.val()
                })
            }
            const payload = {
                grupo_antiguo: this.router_grupo,
                grupo_nuevo: nuevo_reparto,
                data: array
            };

            await this.api_rest(payload, 'tranferir_pedido');
            store.commit("dialogoprogress")

        },
        async imprimir(data) {
            const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
            this.detalle_selecto = snapshot.val()
            var cliente = store.state.clientes.find(e => Number(e.documento) == Number(data.dni))
            if (cliente) {
                data.telefono = cliente.telefono || ''
                data.referencia = cliente.referencia || ''
            }
            this.seleccionado = data
            this.genera_pdf = true
        },
        async reporte_cobrar() {
            store.commit("dialogoprogress");

            let r = await this.busca_creditos(this.desserts);

            // Filtrar elementos únicos por `doc_ref`
            const uniqueR = r.filter(
                (current, index, self) =>
                    self.findIndex((item) => item.doc_ref === current.doc_ref) === index
            );

            // Generar PDF de cuentas por cobrar
            pdf_cuentas_cobrar(uniqueR);

            store.commit("dialogoprogress");
        },
        async pdf_transporte() {
            store.commit("dialogoprogress");

            const array = this.desserts.filter(
                (item) => item.consolida && item.estado !== "ANULADO"
            );

            const r = await this.consultadetalles_pdf(array);
            store.commit("dialogoprogress");

            // Generar reporte de transporte
            reporte_transporte(r);
        },
        async pdf_almacen() {
            store.commit("dialogoprogress");
            this.arrayConsolidar = [];

            const array = this.desserts.filter(
                (item) => item.consolida && item.estado !== "ANULADO"
            );

            let a = await this.consuta_detalle(array);
            console.log(a)
            // Ordenar por nombre y luego por ID
            a.sort((a, b) =>
                a.nombre.localeCompare(b.nombre)
            );
            // Ordenar por nombre y luego por ID
            a.sort((a, b) =>
                a.id - b.id
            );
            store.commit("dialogoprogress");
            console.log(a);

            // Generar reporte de almacén
            reporte_almacen(this.router_grupo, this.suma_peso, a, this.observacion_reporte);
        },
        filtrarLista() {
            let array = this.desserts.filter((item) =>
                (item.numeracion + item.cliente)
                    .toLowerCase()
                    .includes(this.num_doc.toLowerCase())
            );

            if (this.ordenar_vendedor) {
                array.sort((a, b) => a.vendedor.localeCompare(b.vendedor));
            }

            if (this.ordenar_correlativo) {
                array.sort((a, b) => a.numeracion.localeCompare(b.numeracion));
            }

            this.listafiltrada = array;
        },
        async actualiza_guia(data) {
            if (confirm('Seguro de generar Guia?')) {
                var snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value")
                var array = {
                    cabecera: data,
                    items: snapshot.val()
                }
                store.commit('productos_guia', array)
                this.$router.push({
                    path: "/gr_remitente/"
                })
            }
        },
        async abare_guias() {
            // Solo seleccionados (consolida) y no anulados
            const seleccionados = this.desserts.filter(d => d.consolida && d.estado !== 'ANULADO');

            if (!seleccionados.length) {
                this.$store.commit('dialogosnackbar', 'Seleccione al menos un comprobante.');
                return;
            }

            // Helper: código SUNAT de medida (NIU/KGM/TNE, etc.)
            const medCode = (nombre) => {
                const it = this.$store.state.medidassunat?.find(m => m.nombre === nombre);
                return it ? it.corto : 'NIU'; // fallback
            };

            try {
                this.$store.commit('dialogoprogress'); // abre

                const conItems = [];

                for (const d of seleccionados) {
                    // Lee detalle del comprobante
                    const snap = await all_detalle_p(this.router_grupo, d.numeracion).once('value');

                    const items = [];
                    let pesoComprobante = 0;

                    if (snap && snap.exists()) {
                        snap.forEach((s) => {
                            const v = s.val() || {};

                            // Busca en el maestro para completar peso si no viene en el detalle
                            const prod = this.$store.state.productos?.find(
                                p => String(p.id) === String(v.id)
                            ) || {};

                            // Peso unitario con tolerancia a distintos campos
                            const pesoUnit = Number(prod.peso)

                            const cantidad = Number(v.cantidad || 0);

                            // Peso del ítem = peso unitario * cantidad (si necesitas factor por caja, ajusta aquí)
                            const pesoItem = Number((pesoUnit * cantidad).toFixed(3));
                            pesoComprobante += pesoItem;

                            items.push({
                                uuid: v.id,
                                cantidad,
                                medida: medCode(v.medida),   // código SUNAT
                                des_medida: v.medida,        // descripción
                                cod_producto: v.id,
                                descripcion: v.nombre,
                                // campos útiles extra para trazabilidad
                                peso: Number(pesoUnit.toFixed(3)),
                                peso_total_item: pesoItem,
                            });
                        });
                    }

                    const peso_total_final = Number((pesoComprobante).toFixed(3));

                    let direccion = d.direccion;
                    let ubigeo = d.ubigeo;
                    if ((!direccion || !ubigeo) && Array.isArray(this.$store.state.clientes)) {
                        const cli = this.$store.state.clientes.find(
                            c => String(c.documento) === String(d.dni)
                        );
                        if (cli) {
                            direccion = direccion || cli.direccion || '';
                            ubigeo = ubigeo || cli.ubigeo || '';
                        }
                    }

                    // Adjunta items y peso calculado al comprobante
                    conItems.push({
                        ...d,
                        direccion,
                        ubigeo,
                        items,
                        peso_total: Number(peso_total_final.toFixed(3)),
                    });
                }

                // Enviar al componente generador masivo
                this.data_guia = {
                    id_grupo: this.router_grupo,
                    desserts: conItems,
                };
                this.dialogo_guia = true;
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'No se pudieron cargar los ítems.');
            } finally {
                this.$store.commit('dialogoprogress'); // cierra
            }
        },


        async imprime_guia(data) {
            var snapshot = await buscaGuiaremision(data.guia_id).once("value")
            console.log(snapshot.val())
            if (snapshot.exists()) {
                var arraydatos = snapshot.val()
                generaGuia(arraydatos, store.state.configImpresora.tamano)
            }
        },
        inicio() {
            Cabecera_p(this.router_grupo)
                .once("value").then((snapshot) => {
                    var data = snapshot.val()
                    console.log('inci', data)
                    this.cabecera_total = {
                        id_grupo: this.router_grupo,
                        contado: data.contado,
                        credito: data.credito,
                        total: (parseFloat(data.credito) + parseFloat(data.contado)).toFixed(2),
                        peso: data.peso,
                        guia: data.guia,
                        pedidos: data.pedidos,
                        fecha_emision: data.fecha_emision,
                        envio_stock: data.envio_stock
                    }
                    this.total_peso = data.peso
                })
        },
        anterior() {
            if (parseInt(this.router_grupo) > 1) {
                this.router_grupo = (parseInt(this.router_grupo) - 1).toString().padStart(4, '0');
            }
        },
        siguiente() {
            const corre = (parseInt(this.router_grupo) + 1).toString().padStart(4, '0');
            console.log(corre)
            Cabecera_p(corre)
                .once("value")
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        this.router_grupo = corre; // esto disparará el watcher
                    } else {
                        store.commit('dialogosnackbar', 'NO EXISTEN MÁS REPARTOS');
                    }
                });
        },


        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                data.consolida = false; // estado inicial
                array.push(data);
            });
            console.log(array)
            this.desserts = array;
            this.filtrarLista(); // 👈 importante
        },

        async busca_creditos(data) {
            const array_cuentas = [];

            try {
                // Crear un array de promesas para cada consulta
                const promesas = data.map(async (items) => {
                    const snapshot = await allcuentaxcobrar()
                        .orderByChild("documento")
                        .equalTo(items.dni)
                        .once("value");

                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            if (Number(item.val().monto_pendiente) != 0)
                                array_cuentas.push(item.val());
                        });
                    }
                });

                // Esperar a que todas las promesas se completen
                await Promise.all(promesas);

                return array_cuentas;
            } catch (error) {
                console.error("Error en busca_creditos:", error);
                throw error; // Lanzar el error para manejarlo fuera
            }
        },

        consolida_todo() {
            for (var i = 0; i < this.desserts.length; i++) {
                this.desserts[i].consolida = this.consolida_t
            }
        },
        async cargaData(value) {
            try {
                // Abrir el diálogo de progreso
                store.commit("dialogoprogress", true);

                // Limpiar el arrayConsolidar
                this.arrayConsolidar = [];

                // Obtener los detalles de la base de datos
                const snapshot = await all_detalle_p(this.router_grupo, value.numeracion).once("value");

                console.log(snapshot.val());

                // Procesar los datos obtenidos
                snapshot.forEach((item) => {
                    const producto = item.val();
                    producto.total = (parseFloat(producto.precio) * parseFloat(producto.cantidad)).toFixed(2);
                    this.arrayConsolidar.push(producto);
                });

                // Mostrar el diálogo de detalle
                this.dialogo_detalle = true;
            } catch (error) {
                console.error("Error en cargaData:", error);
                store.commit("dialogosnackbar", "Ocurrió un error al cargar los datos.");
            } finally {
                // Cerrar el diálogo de progreso
                store.commit("dialogoprogress", false);
            }
        },
        carga_Guia() {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            this.consuta_detalle(this.desserts).then(() => {
                this.arrayConsolidar.sort(function (a, b) {
                    if (a.nombre > b.nombre) {
                        return 1;
                    }
                    if (a.nombre < b.nombre) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                var data = {
                    total_peso: this.suma_peso,
                }
                var array = [this.arrayConsolidar, data]
                store.commit("dialogoprogress")
                store.commit('data_guia', array)
                store.commit('dialogo_guia', false)
            })
        },
        ver_detalle_masivo() {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            this.consuta_detalle(this.desserts).then(() => {
                this.arrayConsolidar.sort(function (a, b) {
                    if (a.nombre > b.nombre) {
                        return 1;
                    }
                    if (a.nombre < b.nombre) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                store.commit("dialogoprogress")
                this.dialogo_detalle = true
            })
        },
        async consuta_detalle(arrays) {

            for (const data of arrays) {
                if (data.consolida) {
                    const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
                    snapshot.forEach((item) => {
                        const producto = item.val();
                        const invet = store.state.productos.find((id) => String(id.id) === String(producto.id));

                        let cantidad = parseFloat(producto.cantidad) * parseFloat(invet.factor);
                        if (producto.medida === "UNIDAD" && invet.factor > 1) {
                            cantidad = parseFloat(producto.cantidad);
                        }

                        // Buscar producto existente en arrayConsolidar
                        const index = this.arrayConsolidar.findIndex((p) => p.id === producto.id);

                        if (index === -1) {
                            // Producto no existe, agregarlo
                            this.arrayConsolidar.push({
                                id: producto.id,
                                nombre: producto.nombre,
                                medida: invet.medida,
                                cantidad: cantidad,
                                peso: (parseFloat(producto.peso) * parseFloat(producto.cantidad)).toFixed(2),
                                precio: producto.precio,
                                total: (parseFloat(producto.precio) * parseFloat(producto.cantidad)).toFixed(2),
                            });
                        } else {
                            // Producto existente, actualizar valores
                            const consolidado = this.arrayConsolidar[index];

                            consolidado.cantidad += cantidad;
                            consolidado.peso = (
                                parseFloat(consolidado.peso) +
                                parseFloat(producto.peso) * parseFloat(producto.cantidad)
                            ).toFixed(2);
                            consolidado.total = (
                                parseFloat(consolidado.total) +
                                parseFloat(producto.precio) * parseFloat(producto.cantidad)
                            ).toFixed(2);
                        }
                    });
                }
            }

            return this.arrayConsolidar;
        },

        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY')
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        Exporta_excel() {
            var data = XLSX.utils.json_to_sheet(this.arrayConsolidar)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "Ordenes")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExporta = false
        },
        async imprime_comprobante(tamano) {
            const array = this.desserts.filter((item) => item.consolida === true);

            if (!array.length) {
                this.$store.commit('dialogosnackbar', 'Seleccione al menos un comprobante.');
                return;
            }

            // Si estás en navegador de escritorio y NO en Electron y usas deep-link → lanzas y no puedes trackear progreso real
            if (this.esEscritorioNavegador && this.esEscritorioNavegador()) {
                // Opción: muestra diálogo corto informativo (no progreso real) o solo un snackbar
                this.$store.commit('dialogosnackbar', 'Enviando a la app de escritorio…');
                this.abrirElectronDeepLink && this.abrirElectronDeepLink({
                    accion: 'imprimir_comprobantes',
                    id_reparto: this.router_grupo,
                    cantidad: array.length
                });
                return;
            }

            // Flujo local (web/Electron): mostramos progreso real
            this.printTotal = array.length;
            this.printDone = 0;
            this.printError = '';
            this.printDialog = true;

            // Arranca impresión recursiva
            this.impresion_comp(array, 0, tamano);
        },

        async impresion_comp(array, i, tamano) {
            try {
                if (i < array.length) {
                    const data = array[i];
                    const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
                    const arraydatos = snapshot.val();

                    if (snapshot.exists()) {
                        // Llama tu generador de PDF (sin cambios de lógica)
                        const doc = await colClientes().doc(String(data.dni)).get();
                        if (doc.exists) {
                            const datas = doc.data() || {}
                            data.referencia = this.getReferenciaPrincipal(datas) || datas.referencia || '';
                            console.log(data.referencia)
                        }
                        await pdfGenera(arraydatos, data, tamano, 'abre');
                    }

                    // ✔️ Avanza el progreso
                    this.printDone = i + 1;

                    // Pequeño delay para no bloquear UI; ajusta si necesitas más/menos tiempo
                    setTimeout(() => this.impresion_comp(array, i + 1, tamano), 300);
                } else {
                    // ✔️ Terminado
                    this.$store.commit('dialogosnackbar', 'Impresión finalizada.');
                    this.printDialog = false;
                }
            } catch (e) {
                console.error(e);
                this.printError = 'Ocurrió un error durante la impresión.';
                // Avanzamos igualmente para no colgar el proceso y continuar con el siguiente
                this.printDone = Math.min(i + 1, this.printTotal);
                setTimeout(() => this.impresion_comp(array, i + 1, tamano), 300);
            }
        },
        getReferenciaPrincipal(cliente) {
            if (!cliente || !Array.isArray(cliente.direcciones) || cliente.direcciones.length === 0) return '';
            const dir = cliente.direcciones.find(d => d && d.principal) || cliente.direcciones[0];
            return (dir && dir.referencia) ? String(dir.referencia).trim() : '';
        },
        async edita_c(cabecera) {
            console.log(cabecera)
            var snapshot = await all_detalle_p(this.router_grupo, cabecera.numeracion).once("value")
            var detalle = snapshot.val()
            if (snapshot.exists()) {
                console.log(snapshot.val())
                this.cabecera_selecta = cabecera
                this.detalle_selecto = detalle
                this.dialogo_edita_ = true
            }
        },
        async busca_cuentas(doc) {
            var lista = []
            var snapshot = await allcuentaxcobrar().orderByChild("documento").equalTo(String(doc)).once("value")
            if (snapshot.exists()) {
                snapshot.forEach((item) => {
                    var dat = item.val()
                    console.log(dat)
                    if (Number(dat.monto_pendiente) != 0) {
                        lista.push(item.val())
                    }
                })
            }
            return lista
        },
        async consultadetalles_pdf(arrays) {
            var i = 0
            var arrayDetalle = []
            for (var i = 0; i < arrays.length; i++) {
                var items = arrays[i]
                var array_tempo = []
                var snapshot = await all_detalle_p(this.router_grupo, items.numeracion).once("value")
                var total = 0
                snapshot.forEach((item) => {
                    let value = item.val();
                    /*  if (value.operacion != 'GRATUITA') {
                          total = total + (value.precioedita * value.cantidad)
                      }*/

                    var tg = false
                    if (value.operacion == 'GRATUITA') {
                        tg = true
                    }
                    array_tempo.push({
                        cantidad: parseFloat(value.cantidad),
                        id: value.id,
                        nombre: value.nombre,
                        medida: value.medida,
                        precio: parseFloat(value.precio),
                        observacion: value.observacion,
                        tg: tg
                    })
                })
                //    console.log(items.total, total.toFixed(2))
                //    items.total = total.toFixed(2)
                var t = []
                if (items.forma_pago == 'CREDITO') {
                    t = await this.busca_cuentas(items.dni)
                }

                var array_cabe = {
                    total: this.t_general,
                    peso: this.suma_peso,
                    pedidos: this.suma_pedidos,
                    contado: this.t_contado,
                    credito: this.t_credito,
                    id_grupo: this.router_grupo
                }
                arrayDetalle[i] = new Array(3)
                arrayDetalle[i][0] = array_tempo
                arrayDetalle[i][1] = items
                arrayDetalle[i][2] = array_cabe
                arrayDetalle[i][3] = t
                this.detalles = arrayDetalle
            }
            return arrayDetalle
        },

        async procesa_stock() {

            for (var i = 0; i < this.desserts.length; i++) {
                var data = this.desserts[i]
                console.log(data)

                var snap = await all_detalle_p(this.router_grupo, data.numeracion).once("value")
                snap.forEach((item) => {
                    var items = item.val()
                    console.log(items.key_mov)
                })


            }
        },

        finaliza(data) {
            console.log(data)
            this.progress = false
        },
        async exportar_ex() {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            var array = this.desserts.filter((item) => (item.consolida == true && item.estado != 'ANULADO'))
            await this.consuta_detalle(array)
            this.arrayConsolidar.sort(function (a, b) {
                if (a.nombre > b.nombre) {
                    return 1;
                }
                if (a.nombre < b.nombre) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            this.arrayConsolidar.sort(function (a, b) {
                if (a.id > b.id) {
                    return 1;
                }
                if (a.id < b.id) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            var data = (this.arrayConsolidar)
            var array = []
            for (var i = 0; i < data.length; i++) {
                var dd = data[i]
                console.log(dd)
                var invet = store.state.productos.find(id => String(id.id) === String(dd.id))
                var valor = await this.convierte_stock(dd.cantidad, invet.factor)
                array.push({
                    id: dd.id,
                    producto: dd.nombre,
                    medida: 'und',
                    cajas: valor.entero,
                    unidades: valor.und,
                    cantidad: dd.cantidad,
                })
            }
            // reporte_almacen(this.router_grupo, this.suma_peso, this.arrayConsolidar)
            var data = XLSX.utils.json_to_sheet(array)
            const workbook = XLSX.utils.book_new()
            const filename = 'rep'
            XLSX.utils.book_append_sheet(workbook, data, "anulados")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            store.commit("dialogoprogress")
        },
        async convierte_stock(stock, factor) {
            var cajas = Math.floor(stock / factor)
            var und = stock - cajas * factor
            var regresa = {
                entero: cajas,
                und: und
            }
            return regresa
        },
        async anular(data) {
            if (confirm('Seguro de anular?')) {
                store.commit("dialogoprogress")
                await grabaCabecera_p(this.router_grupo, data.numeracion + '/estado', 'ANULADO')
                this.recalcula_cabecera()
                store.commit("dialogoprogress")
            }
        },
        async envia_sunat() {
            //const pendientes = this.listafiltrada.filter(x => x.estado === 'PENDIENTE');
            const pendientes = this.listafiltrada;
            if (pendientes.length === 0) {
                // Muestra aviso y no envía
                this.$store.commit('dialogosnackbar', 'No hay comprobantes PENDIENTES para enviar.');
                return;
            }

            store.commit("dialogoprogress")
            const array = {
                cabeceras: this.listafiltrada,
                id_reparto: this.router_grupo
            }
            await this.api_rest(array, 'sunat_reparto')
            store.commit("dialogoprogress")
        },
        async api_rest(data, metodo) {
            console.log(data)
            var a = axios({
                method: 'POST',
                //url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                url: 'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion',
                headers: {},
                data: {
                    "bd": store.state.baseDatos.bd,
                    "data": data,
                    "metodo": metodo
                }
            }).then(response => {
                return response
            })
            return a
        },
        abrirDialogoAnulacion(item) {
            this.comp_anular = item;
            this.motivo_anulacion = '';
            this.motivo_seleccion = null;
            this.error_motivo = '';
            this.dialogo_motivo_anulacion = true;
        },
        cerrarDialogoAnulacion() {
            this.dialogo_motivo_anulacion = false;
            this.comp_anular = null;
            this.motivo_anulacion = '';
            this.motivo_seleccion = null;
            this.error_motivo = '';
        },
        sincronizaMotivo(val) {
            // Si eligen uno rápido, lo pasa al textarea para permitir edición
            if (val && !this.motivo_anulacion) this.motivo_anulacion = val;
        },

        async confirmarAnulacion() {
            if (!this.motivo_anulacion) {
                this.error_motivo = 'Ingrese el motivo';
                return;
            }
            if (!this.comp_anular) return;

            try {
                this.anulando = true;

                // 1) Trae detalle
                const snap = await all_detalle_p(this.router_grupo, this.comp_anular.numeracion).once('value');
                const val = snap.val() || [];
                const detalle = Array.isArray(val) ? val : Object.values(val);

                // 2) Cabecera para el API (asegurando id, id_grupo, id_documento)
                const cabAPI = {
                    ...this.comp_anular,
                    id: `${this.router_grupo}-${this.comp_anular.numeracion}`,   // requerido por tu Cloud Function
                    id_grupo: this.router_grupo,
                    id_documento: this.comp_anular.numeracion,
                };

                // 3) Payload + motivo + control de stock
                const payload = {
                    cabecera: cabAPI,
                    detalle,
                    control_stock: true,
                    motivo_anulacion: this.motivo_anulacion, // <-- pásalo para registrar el motivo real
                };

                // 4) Idempotencia por comprobante
                const idem = `anula-${this.router_grupo}-${this.comp_anular.numeracion}`;

                await axios.post(
                    'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                    {
                        bd: this.$store.state.baseDatos.bd,
                        data: payload,
                        metodo: 'anular_pedido',
                    },
                    { headers: { 'X-Idempotency-Key': idem } }
                );

                this.$store.commit('dialogosnackbar', 'Comprobante anulado y stock revertido.');
                this.cerrarDialogoAnulacion();
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'Ocurrió un error al anular.');
            } finally {
                this.anulando = false;
            }
        },


        // (Tu método anular viejo ya no se usa, lo puedes retirar o dejar redirigiendo)
        async anular(data) {
            // Redirige al nuevo flujo con diálogo
            this.abrirDialogoAnulacion(data);
        },
        // 🔗 ADICIÓN: helpers para detectar Electron y abrir deep link
        esElectron() {
            // En BrowserWindow, el userAgent incluye "Electron/<ver>"
            return /\belectron\/\d+/i.test(navigator.userAgent);
        },
        esEscritorioNavegador() {
            // No Electron y no móvil (usando tu breakpoint Vuetify)
            const isMobile = this.$vuetify?.breakpoint?.smAndDown;
            return !this.esElectron() && !isMobile;
        },
        abrirElectronDeepLink(params = {}) {
            const PROTO = 'domotica';
            const q = new URLSearchParams(params).toString();
            // 👇 barra después de 'print' para que el main parsee bien: domotica://print/?...
            const url = `${PROTO}://print/${q ? `?${q}` : ''}`;

            window.location.href = url;

            setTimeout(() => {
                this.$store?.commit?.('dialogosnackbar', 'Si no se abrió la app de escritorio, instálala y vuelve a intentar.');
            }, 1500);
        },
        async reporte_producto_cliente() {
            store.commit("dialogoprogress");

            const arrays = this.desserts.filter(d => d.estado != "ANULADO") || [];

            // 🗓️ rango de fechas (antigua y reciente)
            const ts = arrays.map(x => Number(x.fecha) || 0).filter(Boolean);
            const fechaIni = ts.length ? Math.min(...ts) : null;   // más antigua
            const fechaFin = ts.length ? Math.max(...ts) : null;   // más reciente

            const rangoFechas = {
                fecha_ini: fechaIni,
                fecha_fin: fechaFin,
                fecha_ini_str: fechaIni ? moment.unix(fechaIni).format("DD/MM/YYYY") : "",
                fecha_fin_str: fechaFin ? moment.unix(fechaFin).format("DD/MM/YYYY") : ""
            };

            const datas = [];
            for (const data of arrays) {
                const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
                datas.push({ cabecera: data, detalle: snapshot.val() });
            }

            // 👉 pásalo al generador
            reporteProductoClientePDF(datas, rangoFechas);

            store.commit("dialogoprogress");
        },
        async ver_detalle(item) {
            console.log('cabecera', item)
            this.$store.commit("dialogoprogress");
            console.log(this.router_grupo, item.numeracion)
            var snap = await all_detalle_p(this.router_grupo, item.numeracion).once("value")
            const detalle = snap.val();
            this.$store.commit("dialogoprogress");
            this.dialogDetalle = true;
            this.pedidoSeleccionado = detalle
            console.log(this.pedidoSeleccionado);
            // Aquí puedes abrir un diálogo o hacer lo que necesites con el detalle

        },
        async anular_masivo() {
            // 1. Filtramos sólo los comprobantes seleccionados (checkbox consolida)
            const seleccionados = this.desserts.filter(d => d.consolida);

            if (seleccionados.length === 0) {
                this.$store.commit('dialogosnackbar', 'No hay comprobantes seleccionados.');
                return;
            }

            // 2. Confirmación al usuario
            const ok = confirm(
                '¿Seguro que quieres ANULAR estos comprobantes?\n' +
                '- Se marcarán como ANULADO en este reparto.\n' +
                '- Volverán a estado PENDIENTE en la pantalla de Pedidos.'
            );
            if (!ok) return;

            try {
                // 3. Mostrar loader global
                this.$store.commit("dialogoprogress");

                // 4. Armamos todas las tareas async por cada comprobante seleccionado
                const tareas = seleccionados.map(comp => {
                    const subtareas = [];

                    // 4a. Regresar el pedido original a "pendiente"
                    // asumimos que comp.id_pedido es la key del pedido en /pedidos
                    if (comp.id_pedido) {
                        subtareas.push(
                            modifica_pedidos(
                                comp.id_pedido + '/estado',
                                'pendiente'
                            )
                        );
                    } else {
                        console.warn('⚠️ Sin id_pedido para', comp);
                    }

                    // 4b. Marcar la cabecera del reparto como ANULADO
                    // esto escribe en /Cabecera_p/<grupo>/<numeracion>/estado = 'ANULADO'
                    // usamos this.router_grupo (el reparto actual) y comp.numeracion
                    if (comp.numeracion) {
                        subtareas.push(
                            grabaCabecera_p(
                                this.router_grupo,
                                comp.numeracion + '/estado',
                                'ANULADO'
                            )
                        );
                    } else {
                        console.warn('⚠️ Sin numeracion para', comp);
                    }

                    // Devolvemos una promesa que espera ambas subtareas
                    return Promise.all(subtareas);
                });

                // 5. Esperar que TODAS las cabeceras+pedidos terminen
                await Promise.all(tareas);

                // 6. Feedback al usuario
                this.$store.commit('dialogosnackbar', 'Comprobantes anulados y devueltos a pendiente.');
            } catch (e) {
                console.error('Error en anular_masivo:', e);
                alert('Ocurrió un error al intentar anular masivamente.');
            } finally {
                // 7. Cerrar loader SIEMPRE
                this.$store.commit("dialogoprogress");
            }
        }






    }
}
</script>
