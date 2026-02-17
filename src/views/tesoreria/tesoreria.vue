<template>
    <div class="pa-4 mt-10">
        <v-dialog persistent v-model="dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>
        <v-row dense class="mt-n5">

            <v-col cols="12" md="3" xs="12">
                <h3> T.GENERAL: S/.{{ sumatotal() }} </h3>
                <h5>APERTURA: {{ fecha_inicio }}</h5>
            </v-col>
            <v-col cols="6" md="2" xs="6">
                <v-text-field
                    outlined
                    dense
                    type="date"
                    v-model="filtroFecha1"
                    label="Desde"
                    hide-details
                    prepend-inner-icon="mdi-calendar-start"
                />
            </v-col>
            <v-col cols="6" md="2" xs="6">
                <v-text-field
                    outlined
                    dense
                    type="date"
                    v-model="filtroFecha2"
                    label="Hasta"
                    hide-details
                    prepend-inner-icon="mdi-calendar-end"
                />
            </v-col>
            <v-col cols="6" md="2" xs="6">
                <v-btn color="orange darken-1" dark block small @click="dialCuentasCobrar = true">
                    <v-icon left small>mdi-cash-multiple</v-icon>
                    Cuentas x Cobrar
                </v-btn>
            </v-col>
            <v-col cols="6" md="3" xs="6">
                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="info" block small v-bind="attrs" v-on="on">
                            Opciones
                            <v-spacer></v-spacer>
                            <v-icon left>
                                mdi-arrow-down-bold
                            </v-icon>
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item>
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
                                CIERRA TESORERIA
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="info" block @click="evento(4)">
                                HISTORIAL
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
                        <td style="font-size:80%;" v-if="item.operacion == 'ingreso'">S/.{{ item.total }}</td>
                        <td style="font-size:80%;" v-if="item.operacion == 'credito'">S/.{{ item.total }}</td>
                        <td style="font-size:80%;" v-if="item.operacion == 'egreso'" class="red--text">- S/.{{
                            item.total
                        }}
                        </td>
                        <td style="font-size:80%;" v-if="true">{{ item.observacion }}</td>
                        <td style="font-size:80%;" v-if="item.estado == 'activo'">{{ item.estado }}</td>
                        <td style="font-size:80%;" v-if="item.estado != 'activo'" class="red--text">{{ item.estado
                        }}
                        </td>
                        <td width="100">
                            <v-row>
                                <v-col cols="12" xs="12">
                                    <v-icon color="red" @click="abre_editar(item)">mdi-pencil</v-icon>
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

        <!-- Dialog de Cuentas por Cobrar -->
        <DialCuentasCobrar v-model="dialCuentasCobrar" />
    </div>
</template>

<script>

import {
    all_flujo_teso,
    edita_Flujo_teso,
    nuevoflujo_teso,
    estadoFlujo_teso,
    elimina_all_flujo_teso,
    nuevoflujo_historial_teso,
} from '../../db'
import XLSX from 'xlsx'
import moment from 'moment'
import {
    pdfcierrecaja,
    pdf_total_caja
} from '../../pdf'

import store from '@/store/index'
import DialCuentasCobrar from './dial_cuentas_cobrar.vue'

export default {
    components: {
        DialCuentasCobrar
    },

    data() {
        return {
            arrayConsolidar: [],
            arra_cods: [],
            dialog: false,
            date: moment().format('YYYY-MM-DD'),
            date2: moment().format('YYYY-MM-DD'),
            filtroFecha1: moment().startOf('month').format('YYYY-MM-DD'),

            filtroFecha2: moment().endOf('day').format('YYYY-MM-DD'),
            dialCuentasCobrar: false,
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
            fecha_inicio: moment().format('MM-DD'),
            cambia_metodo: false,
            pre_anular: false,
        }
    },
    mounted() {
        all_flujo_teso().limitToLast(1500).on("value", this.onDataChange);
    },
    beforeDestroy() {
        all_flujo_teso().off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            // Filtra por rango de fechas si están definidas
            if (!this.filtroFecha1 || !this.filtroFecha2) {
                return this.desserts;
            }
            
            const inicio = moment(this.filtroFecha1, 'YYYY-MM-DD').startOf('day').unix();
            const fin = moment(this.filtroFecha2, 'YYYY-MM-DD').endOf('day').unix();
            
            return this.desserts.filter(item => {
                const fechaItem = item.fecha || 0;
                return fechaItem >= inicio && fechaItem <= fin;
            });
        },
    },
    methods: {
        exporta_Reporte() {
            var data = XLSX.utils.json_to_sheet(this.arrayConsolidar)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "flujo caja")
            XLSX.writeFile(workbook, `${filename}.xlsx`)

        },
        abre_editar(item) {
            if (!store.state.permisos.moduloreportes) {
                store.commit('dial_alert', 'SOLO PUEDE SER EDITADO O ELIMINADO POR USUARIO ADMINISTRADOR')
                return
            }
            if (item.estado == 'anulado') {
                store.commit('dial_alert', 'MOVIMIENTO ANULADO')
                return
            }
            this.modo_pago = item.modo
            this.itemelecto = item
            this.dialogoObservacion = true
        },
        async cambia_edita_modo() {
            store.commit("dialogoprogress", 1)
            await edita_Flujo_teso(this.itemelecto.id + '/modo', this.modo_pago)
            store.commit("dialogoprogress", 1)
            this.cambia_metodo = false
            this.dialogoObservacion = false
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        sumatotal() {
            var suma = 0
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].operacion == "ingreso" && this.desserts[i].estado != 'anulado') {
                    suma = suma + parseFloat(this.desserts[i].total)
                }
            }
            return suma.toFixed(2)
        },
        suma_reportes() {
            var lista = []
            var modopagos = store.state.modopagos
            for (var i = 0; i < modopagos.length; i++) {
                lista.push({
                    nombre: this.extrae_texto(modopagos[i], 4),
                    ingreso: this.sumatoria(this.desserts, modopagos[i], 'ingreso'),
                    egreso: this.sumatoria(this.desserts, modopagos[i], 'egreso'),
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
            console.log(items.val())
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

        obtener_ultimo() {
            if (this.desserts[this.desserts.length - 1] != undefined) {
                var array = moment.unix(this.desserts[this.desserts.length - 1].fecha).format('DD/MM/YYYY')
                return array
            }
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
                await nuevoflujo_teso(flujo);
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
        async cierraflujos() {
            var arra_totales = this.total_saldo('EFECTIVO')
            var array = {
                fecha_inicio: moment().unix(),
                fecha_cierre: moment().unix(),
                monto_apertura: 0,
                ingreso: arra_totales.ingreso,
                egreso: arra_totales.egreso,
                observacion: this.observacion,
                estado: 'cerrado',
                data: this.desserts,
            }
            //this.ejecutareporte(this.desserts)
            this.ejecuta_reporte_detallado()
            await nuevoflujo_historial_teso(array)
            elimina_all_flujo_teso()
            this.dialogocierre = false
            //this.crea_apertura()            
            //   this.crea_caja()

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
            await nuevoflujo_historial_teso(array)

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
            await nuevoflujo_teso(flujo)

            this.dialogo_apertura = false
            store.commit("dialogoprogress", 1)

        },
        ejecutareporte(flujos) {
            var modopagos = store.state.modopagos
            var nuevoArray = []
            var fecha = moment().format('YYYY-MM-DD hh:mm A')
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
            await estadoFlujo_teso(id, "anulado")
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


        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        },
        ver_items(data){
            console.log(data)
        }
    }

}
</script>
