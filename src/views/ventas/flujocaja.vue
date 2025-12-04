<template>
    <div class="pa-4 mt-10">
        <v-dialog persistent v-model="dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>


        <v-row dense class="mt-n5">
            <v-col cols="12" md="6" xs="12">
                <h3> T.GENERAL: S/.{{ sumatotal() }} </h3>
                <h4> Venta: S/.{{ sumaVentas() }} </h4>
                <h5>APERTURA: {{ fecha_inicio }}</h5>
            </v-col>
            <v-col cols="12" md="2" xs="12">
                <v-btn v-if="$store.state.permisos.punto_venta" block small elevation="6" color="error"
                    @click="abrir_caja()">
                    Caja
                    <v-spacer></v-spacer>
                    <v-icon color="white" class="mx-auto text--center" medium>mdi-cash-register</v-icon>
                </v-btn>
            </v-col>
            <v-col cols="12" md="4" xs="12">
                <v-menu v-model="menuOpc" bottom offset-y :close-on-content-click="false">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="success" block small v-bind="attrs" v-on="on">
                            Opciones
                            <v-spacer></v-spacer>
                            <v-icon left>mdi-arrow-down-bold</v-icon>
                        </v-btn>
                    </template>

                    <v-list dense>
                        <!-- Filtro de movimientos -->
                        <v-list-item @click.stop>
                            <v-select outlined dense v-model="filtroMov" :items="arrayFiltroMov" item-text="text"
                                item-value="value" label="Filtrar movimientos" hide-details />
                        </v-list-item>

                        <v-list-item class="">
                            <v-btn dark small color="info" block @click="evento(5)">
                                Inicio Caja
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="evento(2)">
                                INGR/EGRE
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="evento(3)">
                                CIERRA CAJA
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="evento(4)">
                                HISTORIAL
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="dialog_reporte = !dialog_reporte">
                                Productos Vendidos
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="evento(6)">
                                REPORTE GENERAL
                            </v-btn>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>

        </v-row>
        <v-row gutters class="mt-n3" style="font-size:80%;">
            <v-col cols="12" md="3" sm="6" xs="12" v-for="item in suma_reportes()" :key="item.nombre">

                <TABLE BORDER CELLPADDING=10 CELLSPACING=0 WIDTH="100%">
                    <TR BGCOLOR="LightGRAY">
                        <TH COLSPAN=3>{{ item.nombre }}</TH>
                    </TR>
                    <TR BGCOLOR="LightGRAY">
                        <TH>Ing.</TH>
                        <TH>Egr.</TH>
                        <TH>Saldo</TH>
                    </TR>
                    <TR class="text-center" fontSize=1px>
                        <TD>
                            <h5>S/.{{ redondear(item.ingreso) }}</h5>
                        </TD>
                        <TD class="red--text">
                            <h5>S/.{{ item.egreso }}</h5>
                        </TD>
                        <TD>
                            <h5>S/.{{ redondear(item.ingreso - item.egreso) }}</h5>
                        </TD>
                    </TR>
                </TABLE>

            </v-col>
        </v-row>

        <v-simple-table class="elevation-1" fixed-header height="60vh" dense>
            <template v-slot:default>
                <thead>

                    <tr>
                        <th class="text-left">
                            Mov.
                        </th>
                        <th class="text-left">
                            MODO
                        </th>
                        <th class="text-left">
                            FECHA
                        </th>
                        <th class="text-left">
                            Total
                        </th>
                        <th class="text-left" v-if="true">
                            Obs.
                        </th>
                        <th class="text-left">
                            Estado
                        </th>
                        <th class="text-left">
                            Accion
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in listafiltrada" :key="item.id"
                        :class="{ 'credito-row': item.operacion === 'credito' }">
                        <td style=" font-size:80%;">{{ extrae_texto(item.operacion, 4) }}</td>
                        <td style="font-size:80%;">{{ extrae_texto(item.modo, 4) }}</td>
                        <td style="font-size:80%;">{{ conviertefecha(item.fecha) }}</td>
                        <td style="font-size:80%;" v-if="item.operacion == 'ingreso'">S/.{{ redondear(item.total) }}
                        </td>
                        <td style="font-size:80%;" v-if="item.operacion == 'credito'">S/.{{ redondear(item.total) }}
                        </td>
                        <td style="font-size:80%;" v-if="item.operacion == 'egreso'" class="red--text">- S/.{{
                            redondear(item.total)
                        }}
                        </td>
                        <td style="font-size:80%;" v-if="true">{{ item.observacion }}</td>
                        <td style="font-size:80%;" v-if="item.estado == 'activo'">{{ item.estado }}</td>
                        <td style="font-size:80%;" v-if="item.estado != 'activo'" class="red--text">{{ item.estado
                        }}
                        </td>
                        <td width="100">
                            <v-row>
                                <v-col cols="6" xs="6">
                                    <v-icon color="red" @click="abre_editar(item)">mdi-pencil</v-icon>
                                </v-col>
                                <v-col cols="6" xs="6">
                                    <v-icon color="green" @click.prevent="ver_items(item)">mdi-eye</v-icon>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </tbody>
            </template>

        </v-simple-table>
        <v-row gutters class="mt-1 mb-12" v-if="false">
            <h4 class="text--center">TOTALIZADOS </h4>
            <v-col cols="12" md="3" sm="6" xs="12" v-for="item in suma_reportes()" :key="item.nombre">

                <TABLE BORDER CELLPADDING=10 CELLSPACING=0 WIDTH="100%">
                    <TR BGCOLOR="LightGRAY">
                        <TH COLSPAN=3>{{ item.nombre }}</TH>
                    </TR>
                    <TR BGCOLOR="LightGRAY">
                        <TH>Ing.</TH>
                        <TH>Egr.</TH>
                        <TH>Saldo</TH>
                    </TR>
                    <TR class="text-center" fontSize=1px>
                        <TD>
                            <h5>S/.{{ redondear(item.ingreso) }}</h5>
                        </TD>
                        <TD class="red--text">
                            <h5>S/.{{ item.egreso }}</h5>
                        </TD>
                        <TD>
                            <h5>S/.{{ redondear(item.ingreso - item.egreso) }}</h5>
                        </TD>
                    </TR>
                </TABLE>

            </v-col>
        </v-row>
        <v-dialog v-model="dialogoegreso" max-width="600">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoegreso = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon large color="green" @click="graba()">mdi-content-save</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date" label="Fecha"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-select v-model="operacion" :items="arrayoperacion2" menu-props="auto" hide-details
                            label="Modo" outlined dense></v-select>
                    </v-col>
                </v-row>
                <v-row dense class="mt-n5">
                    <v-col cols="6">
                        <v-text-field type="number" v-model="monto" label="Monto S/." outlined dense></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-select v-model="modo_pago" :items="$store.state.modopagos" menu-props="auto" hide-details
                            label="Modo" outlined dense></v-select>
                    </v-col>
                </v-row>
                <v-row dense class="mt-n5">
                    <v-col cols="12">
                        <v-textarea v-model="obs" auto-grow filled dense outlined color="deep-purple"
                            label="observacion" rows="1"></v-textarea>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoObservacion" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoObservacion = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">

                <h4>Modo Pago = <strong class="red--text">{{ this.itemelecto.modo }}</strong>
                    <v-icon color="green" class="" @click="cambia_metodo = true">mdi-lead-pencil</v-icon>
                </h4>
                <h4>{{ this.itemelecto.observacion }}</h4>
                <h4>Total = S/.{{ this.itemelecto.total }}</h4>

                <v-card-actions>
                    <v-row dense class="mt-5">
                        <v-col cols="12">
                            <v-btn color="error" block @click="pre_anular = true">Anular</v-btn>
                        </v-col>
                    </v-row>

                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="pre_anular" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="pre_anular = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <h4 class="text-center">ESTE PROCESO ANULARÁ</h4>
                <h4 class="text-center">SOLO! LA ENTRADA EN EL FLUJO DE CAJA</h4>
                <h4 class="text-center">RECUERDE QUE DEBE ANULAR EL COMPROBANTE EMITIDO CON UNA NOTA DE CREDITO O
                    CON
                    BAJA
                    DE COMPROBANTE EN LA OPCION SUNAT!!!</h4>
                <v-card-actions>
                    <v-row dense class="mt-5">
                        <v-col cols="12">
                            <v-btn color="error" block @click="anular()">CONTINUAR !</v-btn>
                        </v-col>
                    </v-row>

                </v-card-actions>
            </v-card>

        </v-dialog>
        <v-dialog v-model="cambia_metodo" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="cambia_metodo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-select v-model="modo_pago" :items="$store.state.modopagos" menu-props="auto" hide-details
                    label="Modo" outlined dense></v-select>
                <v-card-actions>
                    <v-row dense class="mt-5">
                        <v-col cols="12">
                            <v-btn color="success" block @click="cambia_edita_modo()">MODIFICAR</v-btn>
                        </v-col>
                    </v-row>

                </v-card-actions>
            </v-card>

        </v-dialog>
        <v-dialog v-model="dialogocierre" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogocierre = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <H4 class="text-center">CIERRE DE CAJA</H4>
                <v-card-text>
                    <v-text-field disabled type="date" outlined dense v-model="date" label="Fecha"></v-text-field>
                    <v-textarea class="mt-n2" dense v-model="observacion" auto-grow filled color="deep-purple"
                        label="Observacion" rows="1"></v-textarea>
                </v-card-text>

                <v-card-actions>

                    <v-spacer></v-spacer>
                    <v-row>
                        <v-col cols="6">
                            <v-btn color="red" text @click="ejecuta_reporte_detallado()">
                                Ver reporte
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="green darken-1" text @click="cierraflujos()">
                                Graba
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog v-model="dialogo_apertura" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_apertura = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <H4 class="text-center">APERTURA CAJA</H4>
                <v-card-text>
                    <v-text-field disabled type="date" outlined dense v-model="date" label="Fecha"></v-text-field>
                    <v-text-field class="mt-n2" outlined type="number" dense v-model="monto_apertura"
                        label="Monto Apertura"></v-text-field>
                    <v-checkbox v-model="guardar_stock" label="Guardar stock actual" class="mt-2" dense></v-checkbox>
                </v-card-text>

                <v-card-actions>

                    <v-spacer></v-spacer>
                    <v-row class="mt-n6">
                        <v-col cols="12">
                            <v-btn color="green darken-1" text @click="crea_apertura()">
                                Crea
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-actions>
            </v-card>

        </v-dialog>
        <v-dialog v-model="dial_reportes" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_reportes = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row>
                    <v-col cols="6">
                        <v-btn color="warning" block @click="ejecuta_reporte_detallado()">
                            TOTAL
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn color="success" block @click="exportaExcel()">
                            Excel
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card>

        </v-dialog>
        <v-dialog v-model="dialog" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>
                <v-simple-table dark fixed-header max-width="68vh" dense>
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

                            <tr v-for="item in arrayConsolidar" :key="item.id">
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>
        <dial_rep_vend v-if="dialog_reporte" :data="desserts" @cierra="dialog_reporte = false" />

    </div>
</template>

<script>

import {
    allflujo,
    edita_Flujo,
    nuevoflujo,
    consultaDetalle,
    estadoFlujo,
    elimina_all_flujo,
    nuevoflujo_historial,
    nuevo_histo_stock,
    all_histo_stock,
    nuevoflujo_teso
} from '../../db'
import XLSX from 'xlsx'
import moment from 'moment'
import {
    pdfcierrecaja,
    pdf_total_caja
} from '../../pdf'
import dial_rep_vend from './reportes/rep_productos_vendidos.vue'
import store from '@/store/index'

export default {
    name: 'flujocaja',
    components: {
        dial_rep_vend
    },
    data() {
        return {
            filtroMov: 'todos',
            arrayFiltroMov: [
                { text: "Todos", value: "todos" },
                { text: "Ingresos", value: "ingreso" },
                { text: "Egresos", value: "egreso" },
                { text: "Venta", value: "venta" }
            ],
            arrayConsolidar: [],
            arra_cods: [],
            dialog: false,
            dialog_reporte: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            monto_apertura: 0,
            dialogo_apertura: false,
            dial_reportes: false,
            desserts: [],
            dialogoegreso: false,
            dialogoObservacion: false,
            dialogocierre: false,
            guardar_stock: false,
            operacionfiltra: 'todos',
            operacion: 'ingreso',
            arrayoperacion: ["todos", "ingreso", "egreso"],
            arrayoperacion2: ["ingreso", "egreso"],
            observacion: '',
            ordenflujo: '',
            modo: 'EFECTIVO',
            arrafiltrado: '',
            itemelecto: '',
            arrayExporta: [],
            dialogoprogress: false,
            doc_sujeto: '',
            nom_sujeto: '',
            serie_ref: '',
            corr_ref: '',
            modo_pago: 'EFECTIVO',
            monto: '',
            obs: '',
            cabecera: '',
            fecha_inicio: moment(String(new Date)).format('MM-DD'),
            cambia_metodo: false,
            pre_anular: false,
        }
    },
    mounted() {
        allflujo().limitToLast(1500).on("value", this.onDataChange);
    },
    beforeDestroy() {
        allflujo().off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            if (this.filtroMov === 'todos') return this.desserts;

            // 👇 Nuevo filtro: solo movimientos de ingreso cuya observación contenga "VENTA"
            if (this.filtroMov === 'venta') {
                return this.desserts.filter(f =>
                    f.operacion === 'ingreso' &&
                    f.estado !== 'anulado' &&
                    f.observacion &&
                    f.observacion.toUpperCase().includes('VENTA')
                );
            }

            // Ingresos / Egresos como ya lo tenías
            return this.desserts.filter(f =>
                f.operacion === this.filtroMov
            );
        },
    },
    methods: {
        abrir_caja() {
            this.$router.push('/caja2'); // Redirige a la ruta flujocaja
        },




        abre_editar(item) {

            this.modo_pago = item.modo
            this.itemelecto = item
            this.dialogoObservacion = true
        },
        async cambia_edita_modo() {
            store.commit("dialogoprogress", 1)
            await edita_Flujo(this.itemelecto.id + '/modo', this.modo_pago)
            store.commit("dialogoprogress", 1)
            this.cambia_metodo = false
            this.dialogoObservacion = false
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        sumatotal() {
            var suma = 0
            var array = this.listafiltrada
            for (var i = 0; i < array.length; i++) {
                if (array[i].operacion == "ingreso" && array[i].estado != 'anulado') {
                    suma = suma + parseFloat(array[i].total)
                }
            }
            return suma.toFixed(2)
        },
        sumaVentas() {
            let suma = 0;
            for (let i = 0; i < this.desserts.length; i++) {
                const item = this.desserts[i];

                if (
                    item.operacion === "ingreso" &&
                    item.estado !== "anulado" &&
                    item.observacion &&
                    item.observacion.toUpperCase().includes("VENTA")
                ) {
                    suma += parseFloat(item.total);
                }
            }
            return suma.toFixed(2);
        },
        suma_reportes() {
            var lista = []
            var modopagos = store.state.modopagos
            for (var i = 0; i < modopagos.length; i++) {
                lista.push({
                    nombre: this.extrae_texto(modopagos[i], 4),
                    ingreso: this.sumatoria(this.listafiltrada, modopagos[i], 'ingreso'),
                    egreso: this.sumatoria(this.listafiltrada, modopagos[i], 'egreso'),
                })
            }
            return lista
        },
        sumatoria(array, modo, operacion) {
            var suma = 0
            for (var e = 0; e < array.length; e++) {
                if (array[e].modo == modo && array[e].operacion == operacion && array[e].estado == 'activo') {
                    suma = suma + parseFloat(array[e].total)
                }
            }
            return suma.toFixed(2)
        },
        extrae_texto(data, cantidad) {
            return data.substr(0, cantidad)
        },
        evento(item) {
            if (item == 2) {
                this.consultaCorrelativo()
            }
            if (item == 3) {
                this.cierrecaja()
            }
            if (item == 4) {
                this.$router.push({
                    path: '/reporte_flujos'
                })
            }
            if (item == 5) {
                this.dialogo_apertura = true
            }
            if (item == 6) {
                this.dial_reportes = true
            }
        },
        async onDataChange(items) {

            let array = [];
            items.forEach((item) => {
                let data = item.val();
                if (Boolean(data.estado)) {
                    let key = item.key
                    data.key = key
                    data.id = key
                    array.push(data);
                }

            });

            array.sort(function (a, b) {
                if (a.fecha > b.fecha) {
                    return 1;
                }
                if (a.fecha < b.fecha) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            this.desserts = array.reverse()
            //store.commit("dialogoprogress", 1)
        },

        irCaja() {
            this.$router.push({
                path: '/caja2'
            })
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM hh:mm A')
        },
        consultaCorrelativo() {
            this.dialogoegreso = true

        },
        async graba() {

            if (!this.monto || isNaN(this.monto) || this.monto <= 0) {
                this.$store.commit('dialogosnackbar', 'Ingrese un monto válido');
                return;
            }
            if (this.operacion === 'egreso') {
                const reportes = this.suma_reportes(); // ← asegúrate que devuelve un array
                console.log('Reportes disponibles:', reportes, this.modo_pago.toUpperCase());
                const metodo = reportes.find(m =>
                    m.nombre.toUpperCase() === this.extrae_texto(this.modo_pago, 4)
                );
                console.log('Método encontrado:', metodo);
                if (metodo) {
                    const saldoDisponible = parseFloat(metodo.ingreso) - parseFloat(metodo.egreso);
                    if (parseFloat(this.monto) > saldoDisponible) {
                        this.$store.commit('dialogosnackbar', `Saldo insuficiente en ${this.modo_pago}`);
                        return;
                    }
                }
            }

            this.dialogoprogress = true;
            const correo = store.state.permisos.correo || '';
            const responsable = correo.split('@')[0];

            const flujo = {
                operacion: this.operacion || '',
                observacion: `${this.obs || ''} ${this.serie_ref || ''} ${this.corr_ref || ''}`.trim(),
                modo: this.modo_pago || '',
                fecha: moment().unix(),
                total: parseFloat(this.monto),
                estado: 'activo',
                responsable,
                sujeto: responsable
            };

            try {
                await nuevoflujo(flujo);
                this.limpia();
                this.$store.commit('dialogosnackbar', '✅ Flujo guardado correctamente');
            } catch (error) {
                console.error('Error al guardar:', error);
                this.$store.commit('dialogosnackbar', '❌ Error al guardar el flujo');
            } finally {
                this.dialogoprogress = false;
            }
        },



        limpia() {
            this.dialogoegreso = false
            this.dialogocierre = false
            this.obs = ''
            this.operacion = 'ingreso'
            this.monto = ''
        },
        cierrecaja() {
            this.operacion = "todos"
            this.modo = "EFECTIVO"
            this.dialogocierre = true

        },
        calcTotalesPorMetodo(flujos) {
            const porModo = {};
            const mods = (this.$store.state.modopagos || []).map(m => m.toUpperCase());

            // inicializa todos los métodos que tengas configurados
            for (const m of mods) porModo[m] = { ingreso: 0, egreso: 0, saldo: 0 };

            // acumula
            for (const it of flujos) {
                if (!it || it.estado === 'anulado') continue;
                const modo = (it.modo || 'SIN DEFINIR').toUpperCase();
                const total = parseFloat(it.total) || 0;

                if (!porModo[modo]) porModo[modo] = { ingreso: 0, egreso: 0, saldo: 0 };

                if (it.operacion === 'ingreso') porModo[modo].ingreso += total;
                else if (it.operacion === 'egreso') porModo[modo].egreso += total;
                // (crédito no impacta saldo de caja)
            }

            // calcula saldos por método
            const saldosFinales = {};
            let totalIngreso = 0, totalEgreso = 0;

            for (const [modo, v] of Object.entries(porModo)) {
                v.ingreso = parseFloat(v.ingreso.toFixed(2));
                v.egreso = parseFloat(v.egreso.toFixed(2));
                v.saldo = parseFloat((v.ingreso - v.egreso).toFixed(2));

                saldosFinales[modo] = v.saldo;
                totalIngreso += v.ingreso;
                totalEgreso += v.egreso;
            }

            return {
                por_modo: porModo,
                saldos_finales: saldosFinales,
                total_ingreso: parseFloat(totalIngreso.toFixed(2)),
                total_egreso: parseFloat(totalEgreso.toFixed(2)),
            };
        },

        // 🔹 NUEVO: aplica saldos finales como saldos iniciales del nuevo flujo
        async aplica_saldos_iniciales(saldosFinalesPorModo) {
            const ahora = moment().unix();
            const correo = this.$store.state.permisos.correo || '';
            const responsable = correo.split('@')[0];

            for (const [modo, saldo] of Object.entries(saldosFinalesPorModo)) {
                const monto = parseFloat(saldo) || 0;
                if (monto <= 0) continue; // solo trasladamos saldos positivos

                const flujoInicial = {
                    operacion: 'ingreso',
                    observacion: 'Saldo inicial automático',
                    modo,
                    fecha: ahora,
                    total: parseFloat(monto.toFixed(2)),
                    estado: 'activo',
                    responsable,
                    sujeto: responsable,
                };
                await nuevoflujo(flujoInicial);
            }
        },
        async cierraflujos() {
            this.$store.commit("dialogoprogress", 1);

            // 1) Calcula totales por método con los flujos actuales
            const tot = this.calcTotalesPorMetodo(this.desserts);

            // 2) Arma registro de historial (incluye desagregado por método)
            const historial = {
                fecha_inicio: moment().unix(),
                fecha_cierre: moment().unix(),
                monto_apertura: 0,
                ingreso: tot.total_ingreso,
                egreso: tot.total_egreso,
                observacion: this.observacion,
                estado: 'cerrado',
                data: this.desserts,              // respaldo de movimientos
                totales_por_modo: tot.por_modo,            // 👈 guardado por método
                saldos_finales_por_modo: tot.saldos_finales// 👈 saldos finales por método
            };

            // (opcional) genera pdf detallado antes de limpiar
            this.ejecuta_reporte_detallado();

            // 3) Guarda historial y crea movimientos en tesorería (netos por método)
            const r = await nuevoflujo_historial(historial);
            await this.crear_flujo_tesoreria(historial, r.key);

            // 4) Limpia flujos de la caja actual
            await elimina_all_flujo();

            // 5) Aplica saldos finales como saldos iniciales del NUEVO flujo
            if (store.state.configuracion.copia_saldos_caja) {
                await this.aplica_saldos_iniciales(tot.saldos_finales);
            }


            this.$store.commit("dialogoprogress", 0);
            this.dialogocierre = false;
        },
        async crear_flujo_tesoreria(data, key) {
            const ingresosPorModo = {};
            const egresosPorModo = {};
            const creditosPorModo = {};

            // Acumular por método de pago
            data.data.forEach(item => {
                if (item.estado === "anulado") return;
                const modo = item.modo || "SIN DEFINIR";
                const total = parseFloat(item.total) || 0;

                if (item.operacion === "ingreso") {
                    ingresosPorModo[modo] = (ingresosPorModo[modo] || 0) + total;
                } else if (item.operacion === "egreso") {
                    egresosPorModo[modo] = (egresosPorModo[modo] || 0) + total;
                } else if (item.operacion === "credito") {
                    creditosPorModo[modo] = (creditosPorModo[modo] || 0) + total;
                }
            });

            const ahora = moment().unix();
            const sede = store.state.sedeActual;
            const responsable = (store.state.permisos.correo || '').split('@')[0];

            // Saldo neto por método (ingreso - egreso). Si es negativo, registrar como egreso.
            const modos = new Set([...Object.keys(ingresosPorModo), ...Object.keys(egresosPorModo)]);
            for (const modo of modos) {
                const neto = (ingresosPorModo[modo] || 0) - (egresosPorModo[modo] || 0);
                if (neto === 0) continue;

                const flujo = {
                    operacion: neto > 0 ? "ingreso" : "egreso",
                    observacion: `Cierre de caja ${sede.nombre} - Saldo neto por ${modo}`,
                    origen: sede,
                    modo,
                    fecha: ahora,
                    total: Math.abs(neto),
                    estado: "activo",
                    id_flujo: key,
                    responsable
                };
                await nuevoflujo_teso(flujo);
            }

            // Línea aparte para CRÉDITO (no se netea)
            for (const [modo, total] of Object.entries(creditosPorModo)) {
                if (!total) continue;
                const flujoCredito = {
                    operacion: "credito",
                    observacion: `Cierre de caja ${sede.nombre} - Total por ${modo} (CRÉDITO)`,
                    origen: sede,
                    modo,
                    fecha: ahora,
                    total,
                    estado: "activo",
                    id_flujo: key,
                    responsable
                };
                await nuevoflujo_teso(flujoCredito);
            }

            this.dialogo_apertura = false;
        },



        total_saldo(modo) {
            var lista = {}
            lista = {
                nombre: this.extrae_texto(modo, 4),
                ingreso: this.sumatoria(this.desserts, modo, 'ingreso'),
                egreso: this.sumatoria(this.desserts, modo, 'egreso'),
            }

            return lista
        },
        async crea_caja() {
            var arra_totales = this.total_saldo('EFECTIVO')
            var monto = (parseFloat(arra_totales.ingreso) - parseFloat(arra_totales.egreso)).toFixed(2)
            var array = {
                fecha_inicio: moment().unix(),
                fecha_cierre: '',
                monto_apertura: monto,
                ingreso: 0,
                egreso: 0,
                observacion: 'Apertura automatica',
                estado: 'activo'
            }
            await nuevoflujo_historial(array)

            //this.dialogo_apertura=false
            //this.crea_apertura(monto)

        },
        async crea_apertura() {
            store.commit("dialogoprogress", 1)
            var flujo = {
                operacion: 'ingreso',
                observacion: 'Apertura de caja',
                modo: 'EFECTIVO',
                fecha: moment().unix(),
                total: this.monto_apertura,
                estado: 'activo',
                responsable: store.state.permisos.correo.slice(0, -13),
                sujeto: store.state.permisos.correo.slice(0, -13),
            }
            await nuevoflujo(flujo)

            this.dialogo_apertura = false
            store.commit("dialogoprogress", 1)

        },


        ejecutareporte(flujos) {
            var modopagos = store.state.modopagos
            var nuevoArray = []
            var fecha = moment(String(new Date)).format('YYYY-MM-DD hh:mm A')
            for (var i = 0; i < modopagos.length; i++) {
                var suma = 0
                var array = []
                for (var e = 0; e < flujos.length; e++) {
                    if (flujos[e].estado != 'anulado') {
                        if (flujos[e].modo == modopagos[i]) {

                            array.push(flujos[e]);
                            console.log(parseFloat(flujos[e]))
                            if (flujos[e].operacion == "ingreso") {
                                suma = suma + parseFloat(flujos[e].total)

                            } else {
                                suma = suma - parseFloat(flujos[e].total)
                            }
                        }
                    }
                }

                nuevoArray[i] = new Array(3);
                nuevoArray[i][0] = array
                nuevoArray[i][1] = modopagos[i]
                nuevoArray[i][2] = suma.toFixed(2)
            }
            pdfcierrecaja(nuevoArray, fecha)
        },
        exportaExcel() {
            var data = this.desserts
            var array = []
            for (var i = 0; i < data.length; i++) {
                var item = data[i]
                array.push({
                    operacion: item.operacion,
                    modo: item.modo,
                    fecha: this.conviertefecha(item.fecha),
                    total: parseFloat(item.total),
                    obs: item.observacion,
                    estado: item.estado
                })
            }
            var data = XLSX.utils.json_to_sheet(array)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "flujo caja")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExporta = false
        },
        async anular() {

            this.dialogoprogress = true
            var id = this.itemelecto.id
            console.log(this.itemelecto)
            await estadoFlujo(id, "anulado")
            this.dialogoObservacion = false
            this.pre_anular = false
            this.dialogoprogress = false

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
        ejecuta_reporte_detallado() {
            let movimientos = {
                EFECTIVO: {
                    ingreso: 0,
                    egreso: 0
                },
                TARJETA: {
                    ingreso: 0,
                    egreso: 0
                },
                YAPE: {
                    ingreso: 0,
                    egreso: 0
                },
                PLIN: {
                    ingreso: 0,
                    egreso: 0
                },
                TRANSFERENCIA: {
                    ingreso: 0,
                    egreso: 0
                },
                "T.DEBITO": {
                    ingreso: 0,
                    egreso: 0
                },
                "T.CREDITO": {
                    ingreso: 0,
                    egreso: 0
                },
                RAPPY: {
                    ingreso: 0,
                    egreso: 0
                },
                "PEDIDOS YA": {
                    ingreso: 0,
                    egreso: 0
                },
                "POS QR": {
                    ingreso: 0,
                    egreso: 0
                }
            };

            let t_general = 0;
            let t_egresos = 0;
            let datos_egreso = [],
                datos_ingreso = [];

            this.desserts.forEach(item => {
                if (item.estado !== 'anulado') {
                    let monto = parseFloat(item.total);
                    let operacion = item.operacion;
                    let metodo = item.modo;

                    if (operacion === 'ingreso') {
                        t_general += monto;
                        movimientos[metodo]?.ingreso !== undefined ? movimientos[metodo].ingreso += monto : null;
                        datos_ingreso.push(item);
                    } else if (operacion === 'egreso') {
                        t_egresos += monto;
                        movimientos[metodo]?.egreso !== undefined ? movimientos[metodo].egreso -= monto : null;
                        datos_egreso.push(item);
                    }
                }
            });
            const redondear = (num) => parseFloat(num.toFixed(2));
            let array = {
                observacion: this.observacion,
                ...Object.keys(movimientos).reduce((acc, key) => ({
                    ...acc,
                    [`i_${key.toLowerCase().replace(/\s/g, '')}`]: redondear(movimientos[key].ingreso),
                    [`e_${key.toLowerCase().replace(/\s/g, '')}`]: redondear(movimientos[key].egreso)
                }), {}),
                t_efectivo: movimientos.EFECTIVO.ingreso + movimientos.EFECTIVO.egreso,
                datos: datos_egreso,
                datos_ingreso: datos_ingreso,
                t_general: t_general,
                t_egresos: t_egresos
            };
            console.log(array)
            pdf_total_caja(array);
        },
        async ver_items(value) {
            store.commit("dialogoprogress", 1)
            this.arrayConsolidar = []
            this.arra_cods = []
            var snapshot = await consultaDetalle(value.numeracion_doc).once("value")
            snapshot.forEach((item) => {
                this.arrayConsolidar.push(item.val())
            })
            store.commit("dialogoprogress", 1)
            this.dialog = true

        },
        async obtener_cod_venta(value) {
            console.log(value)
            var da = ''
            var a = await allpedidos().orderByChild('doc_venta').equalTo(value.numeracion_doc).once('value')

            if (a.exists()) {
                a.forEach((item) => {
                    var data = item.val()
                    if (data.tienda == store.state.permisos.tienda) {
                        da = da + ' ' + data.id
                    }

                })
            }
            return da
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        },

    }

}
</script>
<style>
.credito-row {
    color: #1976d2 !important;
    /* Azul (puedes usar otra tonalidad) */
    font-weight: 600;
    /* opcional, para resaltar */
}
</style>