<template>
    <div class="pa-3">
        <v-dialog persistent v-model="dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>
        <div v-if="!condicion">
            <v-row>
                <v-col cols="4">
                    <h3 class="">Historial Caja</h3>
                </v-col>
                <v-col cols="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio"></v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin"></v-text-field>
                </v-col>
            </v-row>
            <v-simple-table class="elevation-1" fixed-header height="550px" width="200" dense>
                <template v-slot:default>
                    <thead>

                        <tr>
                            <th class="text-left">
                                APERTURA
                            </th>
                            <th class="text-left">
                                ING.
                            </th>
                            <th class="text-left">
                                EGR.
                            </th>
                            <th class="text-left">
                                SALDO.
                            </th>
                            <th class="text-left">
                                CIERRE
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in historiales" :key="item.id" @click="selecto(item)">
                            <td>{{ item.fecha_inicio }}</td>
                            <td>S/.{{ redondear(item.ingreso) }}</td>
                            <td>S/.{{ redondear(item.egreso) }}</td>
                            <td>S/.{{ redondear(item.ingreso - item.egreso) }}</td>
                            <td>{{ item.fecha_cierre }}</td>
                        </tr>
                    </tbody>
                </template>

            </v-simple-table>

        </div>
        <div v-if="condicion">
            <v-row dense>
                <v-col cols="6">
                    <h3>MOVIMIENTOS DE CAJA </h3>
                    <h5>APERTURA: {{ this.titulo.fecha_inicio }} - CIERRE: {{ this.titulo.fecha_cierre }} </h5>
                    <h5>Observ: {{ this.titulo.observacion }}</h5>
                </v-col>
                <v-col cols="3">
                    <v-btn small color="warning" block @click="dial_reportes = true">Reporte</v-btn>
                </v-col>
                <v-col cols="3">
                    <v-btn small color="success" block @click="condicion = false">regresa</v-btn>
                </v-col>
            </v-row>

            <v-row gutters class="mt-n4" v-if="!$store.state.esmovil">
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
            <v-row gutters class="mt-1" v-if="$store.state.esmovil">
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
                                <h5>S/.{{ item.ingreso }}</h5>
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
        </div>
        <v-dialog v-model="dialogoObservacion" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoObservacion = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-title primary-title>
                    Observacion:
                </v-card-title>
                <v-card-text>
                    {{ obs }}
                </v-card-text>
            </v-card>
        </v-dialog>



        <v-dialog v-model="dialogoExporta" max-width="500px">
            <v-card>
                <v-card-title class="text-h5">Desea Exportar Lista de Datos?</v-card-title>
                <v-card-title>
                    <v-row class="mx-auto text-center">
                        <v-col cols="6" xs="6">
                            <v-text-field @click="$store.commit('dialogoFecha')" v-model="date" label="Inicio"
                                readonly></v-text-field>
                        </v-col>

                        <v-col cols="6" xs="6">
                            <v-text-field @click="$store.commit('dialogoFecha2')" v-model="date2" label="Fin"
                                readonly></v-text-field>
                        </v-col>

                    </v-row>
                </v-card-title>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="dialogoExporta = !dialogoExporta">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="exporta()">OK</v-btn>
                    <v-spacer></v-spacer>
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
                </v-card-text>

                <v-card-actions>

                    <v-spacer></v-spacer>
                    <v-row class="mt-n6">
                        <v-col cols="12">
                            <v-btn color="green darken-1" text @click="crea_caja()">
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
                                <td v-if="item.operacion!='GRATUITA'">{{ item.id }} - {{ item.nombre }}</td>
                                   <td v-else>{{ item.id }} - {{ item.nombre }} <strong class="red--text">Gratuita</strong></td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
                <v-card class="pa-3 mt-6" v-for="item in arra_cods" :key="item.id">
                    <p style="font-size:85%;" class="text-center"><strong> Pedido N°: {{ item.id }}</strong>- <span
                            class="red--text">{{
                                item.producto.nombre }}</span>
                    </p>
                </v-card>
            </v-card>

        </v-dialog>
    </div>
</template>

<script>

import {
    allflujo_historial,
    nuevoflujo_historial,
    sumaContador,
    obtenContador,
    nuevoflujo,
    consultaDetalle,
} from '../../db'
import XLSX from 'xlsx'
import moment from 'moment'
import {
    pdfcierrecaja,
    pdf_total_caja
} from '../../pdf'
import store from '@/store/index'
export default {



    data() {
        return {
            dial_reportes: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            desserts: [],
            dialogoegreso: false,
            dialogoObservacion: false,
            dialogocierre: false,
            dialogoExporta: false,
            dialog: false,
            operacionfiltra: 'todos',
            operacion: '',
            array_flujos: [],
            observacion: '',
            ordenflujo: '',
            modo: 'EFECTIVO',
            arrafiltrado: '',
            itemelecto: '',
            arrayExporta: [],
            dialogoprogress: false,
            condicion: false,
            obs: '',
            titulo: '',
            monto_apertura: 0,
            arra_cods: [],
            dialogo_apertura: false,
            arrayConsolidar:[],
            arra_cods:[],
            dialogKey: 0,
        }
    },
    created() {
        this.date = moment(String(new Date)).subtract(2, 'd').format('YYYY-MM-DD')
    },
    mounted() {
        allflujo_historial().orderByChild('fecha_inicio').startAt(moment(String(this.date)) / 1000)
            .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
    },
    beforeDestroy() {
        allflujo_historial().orderByChild('fecha_inicio').startAt(moment(String(this.date)) / 1000)
            .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {

            return this.desserts.reverse()
        },
        historiales() {
            allflujo_historial().orderByChild('fecha_inicio').startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
            return this.array_flujos
        }
    },
    methods: {
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        crea_caja() {
            if (this.array_flujos == '') {
                if (this.monto_apertura != 0) {
                    this.crea_apertura()
                }
                var array = {
                    fecha_inicio: moment().unix(),
                    fecha_cierre: '',
                    monto_apertura: this.monto_apertura,
                    ingreso: 0,
                    egreso: 0,
                    observacion: this.observacion,
                    estado: 'activo'
                }
                nuevoflujo_historial(array).then(r => {
                    this.dialogo_apertura = false
                })

            } else {
                store.commit('dialogosnackbar', "Tiene caja Abierta")
            }
        },
        crea_apertura() {
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
            nuevoflujo(flujo).then(r => {
                this.sumaContador()
            })

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
            return suma
        },
        extrae_texto(data, cantidad) {
            return data.substr(0, cantidad)
        },
        evento(item) {
            if (item == 1) {
                this.dialogoExporta = true
            }
            if (item == 2) {
                this.consultaCorrelativo()
            }
            if (item == 3) {
                this.cierrecaja()
            }
            if (item == 4) {
                this.cierrecaja()
            }
        },
        onDataChange(items) {
            let array = [];
            let array2 = [];
            items.forEach((item) => {
                let data = item.val();
                let key = item.key
                var fech = ''
                if (data.fecha_cierre != '') {
                    fech = this.conviertefecha(data.fecha_cierre)
                }
                array.push({
                    id: key,
                    observacion: data.observacion,
                    fecha_inicio: this.conviertefecha(data.fecha_inicio),
                    fecha_cierre: fech,
                    monto_apertura: data.monto_apertura,
                    ingreso: data.ingreso,
                    egreso: data.egreso,
                    estado: data.estado,
                    data: data.data,
                });
                array2.push({
                    id: key,
                    observacion: data.observacion,
                    fecha_inicio: this.conviertefecha(data.fecha_inicio),
                    fecha_cierre: fech,
                    monto_apertura: data.monto_apertura,
                    ingreso: data.ingreso,
                    egreso: data.egreso,
                    estado: data.estado,
                    data: data.data
                });

            });
            this.array_flujos = array2.reverse()
        },
        selecto(array) {
            if (array.estado == 'activo') {
                this.$router.push({
                    path: '/flujo_caja'
                })
            } else {
                this.desserts = array.data
                this.titulo = array
                this.condicion = true
            }
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY hh:mm A')
        },
        consultaCorrelativo() {
            this.obtencorrelativo().then((r) => {
                this.dialogoegreso = true
            })

        },
        obtencorrelativo() {
            var a = obtenContador().once("value").then((snapshot) => {
                this.ordenflujo = snapshot.val().flujocaja
                if (snapshot.exists()) {
                    return true
                }
            })
            return a
        },
        suma_totales(array) {
            var suma_array = []

            var modopagos = store.state.modopagos
            for (var i = 0; i < modopagos.length; i++) {
                var suma = 0
                for (var e = 0; e < array.length; e++) {
                    if (array[e].modo == modopagos[i]) {
                        if (array[e].tipo != 'ingreso') {
                            suma = suma - parseFloat(array[e].total)
                        } else {
                            suma = suma + parseFloat(array[e].total)
                        }

                    }
                }
                suma_array[i] = suma
            }
            return suma_array
        },
        sumaContador() {
            this.dialogoegreso = false
            this.dialogocierre = false
            this.observacion = ''
            this.operacion = 'ingreso'
            this.monto = ''
        },
        cierrecaja() {
            this.operacion = "todos"
            this.modo = "EFECTIVO"
            this.dialogocierre = true

        },
        exporta() {
            this.arrayExporta = []
            allflujo().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    this.ordenflujo = snapshot.val().flujocaja
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            this.arrayExporta.push({
                                id: data.id,
                                estado: data.estado,
                                operacion: data.operacion,
                                modo: data.modo,
                                observacion: data.observacion,
                                fecha: moment.unix(data.fecha).format('DD/MM/YYYY hh:mm A'),
                                total: data.total,
                            })
                        })
                    }
                    this.exportaExcel()
                })
            this.dialogoExporta = true

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
        anular() {
            this.dialogoprogress = true
            var id = this.itemelecto
            estadoFlujo(id, "anulado").then((r) => {
                console.log(r)
                this.dialogoObservacion = false
                this.dialogoprogress = false
            })
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
            console.log(this.arra_cods)
            store.commit("dialogoprogress", 1)
            this.dialog = true

        },

    }

}
</script>
