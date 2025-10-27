<template>
    <v-container class="pa-6">
        <v-dialog persistent v-model="dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>
        <v-row class="mb-4">
            <v-col cols="12">
                <v-btn elevation="15" rounded block color="success"
                    @click="dialogoExportar = !dialogoExportar">EXPORTAR</v-btn>
            </v-col>

        </v-row>

        <v-row class="mb-4">
            <v-col cols="12" md="6" xs="12">
                <v-card elevation="10" class="mx-auto text-center mb-5" max-width="700">
                    <h4>Total x dia: S/.{{ redondear(total) }}</h4>
                    <canvas id="myChart"></canvas>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" xs="12">
                <v-card elevation="10" class="mx-auto text-center mb-5" max-width="700">
                    <h4>Total x semana: S/.{{ redondear(totalsemana) }}</h4>
                    <canvas id="myChart1"></canvas>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" xs="12">
                <v-card elevation="10" class="mx-auto text-center mb-5" max-width="700">
                    <h4>Total x Año: S/.{{ redondear(totalmes) }}</h4>
                    <canvas id="myChart2"></canvas>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="dialogoExportar" max-width="500px">
            <v-card>
                <v-card-title class="text-h5">Desea Exportar Lista de Datos?</v-card-title>
                <v-card-title>
                    <v-row class="mx-auto text-center">
                        <v-col cols="6" xs="6">
                            <v-text-field type="date" v-model="date" label="Inicio"
                                ></v-text-field>
                        </v-col>

                        <v-col cols="6" xs="6">
                            <v-text-field type="date" v-model="date2" label="Fin"
                                ></v-text-field>
                        </v-col>

                    </v-row>
                    <v-row class="mx-auto text-center">
                        <v-col cols="6" xs="6">
                            <v-checkbox label="Incluye ticket" v-model="tickets"></v-checkbox>
                        </v-col>
                        <v-col cols="6" xs="6">
                            <v-checkbox label="FORMATO NUEVO" v-model="formato_nuevo"></v-checkbox>
                        </v-col>
                    </v-row>
                </v-card-title>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="dialogoExportar = !dialogoExportar">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="exportExcel()">OK</v-btn>
                    <v-spacer></v-spacer>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script>
import {
    allCabecera,
    consultaDetalle,
    allCabeceraNCD,
    consultaDetalleNCD,
    grabareporte,
    consultareporte
} from '../../db'
import moment from 'moment'
import XLSX from 'xlsx'
import Chart from 'chart.js/auto'
import store from '@/store/index'
export default {


    data: () => ({
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        dialogoExportar: false,
        dialogoprogress: false,
        detalles: [],
        cabecera: [],
        cabeceraNC: [],
        detalleNC: [],
        lunes: '',
        martes: '',
        miercoles: '',
        jueves: '',
        viernes: '',
        sabado: '',
        domingo: '',
        total: '',
        totalsemana: 0,
        semanas: [],
        totalmes: 0,
        meses: [],
        tickets: true,
        arrayConsolidar: [],
        formato_nuevo: true
    }),
    created() {
        this.calculadata()

    },
    mounted() {
        this.calculadata()
        this.generareportesemana()
        this.consultamesesanteriores()
    },
    destroyed() {

    },
    methods: {
        exportExcel() {
            // this.dialogoprogress=true

            if (this.formato_nuevo) {
                this.consultasNotaCredito_nueva()
                store.commit("dialogoprogress")
                this.exportanuevo().then((resp) => {
                    this.cabecera = resp
                    this.consultadetalles(resp).then((r) => {
                        this.exportar()
                        store.commit("dialogoprogress")
                    })
                })
            } else {
                this.consultasNotaCredito()
                let array = [];
                allCabecera().orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value").then((snapshot) => {
                        if (snapshot.exists()) {
                            snapshot.forEach((item) => {
                                let data = item.val();
                                if (this.tickets) {
                                    var valido = parseFloat(data.total) - parseFloat(data.descuentos)
                                    this.cargaData(data)
                                    array.push({
                                        tipocomprobante: data.tipocomprobante,
                                        serie: data.serie,
                                        correlativo: data.correlativoDocEmitido,
                                        Op_grabada: parseFloat(this.redondear(parseFloat(valido) / 1.18)),
                                        igv: parseFloat(this.redondear((parseFloat(valido) / 1.18) * 0.18)),
                                        total: parseFloat(valido),
                                        descuentos: parseFloat(data.descuentos),
                                        modopago: data.modopago,
                                        fecha: this.conviertefecha(data.fecha),
                                        vencimientoDoc: this.conviertefecha(data.vencimientoDoc),
                                        estado: data.estado,
                                        mensajeSunat: data.mensajeSunat,
                                        tipoDocumento: data.tipoDocumento,
                                        cliente: data.cliente,
                                        dni: data.dni,
                                        direccion: data.direccion,
                                        numeracion: data.numeracion,
                                        documentId: data.documentId
                                    });
                                } else {
                                    if (data.tipocomprobante != 'T') {
                                        var valido = parseFloat(data.total) - parseFloat(data.descuentos)
                                        this.cargaData(data)
                                        array.push({
                                            tipocomprobante: data.tipocomprobante,
                                            serie: data.serie,
                                            correlativo: data.correlativoDocEmitido,
                                            Op_grabada: parseFloat(this.redondear(parseFloat(valido) / 1.18)),
                                            igv: parseFloat(this.redondear((parseFloat(valido) / 1.18) * 0.18)),
                                            total: parseFloat(valido),
                                            descuentos: parseFloat(data.descuentos),
                                            modopago: data.modopago,
                                            fecha: this.conviertefecha(data.fecha),
                                            vencimientoDoc: this.conviertefecha(data.vencimientoDoc),
                                            estado: data.estado,
                                            mensajeSunat: data.mensajeSunat,
                                            tipoDocumento: data.tipoDocumento,
                                            cliente: data.cliente,
                                            dni: data.dni,
                                            direccion: data.direccion,
                                            numeracion: data.numeracion,
                                            documentId: data.documentId
                                        });
                                    }
                                }
                            })

                            this.cabecera = this.arrayConsolidar
                            this.consultadetalles(array).then((r) => {
                                this.exportar()
                                this.dialogoprogress = false
                            })
                        } else {
                            this.dialogoprogress = false
                        }
                    });
            }
        },
        consultadetalles(arrays) {
            console.log(arrays)
            let arrayDetalle = []
            var a = new Promise((resolve, reject) => {
                arrays.forEach((items, index, array) => {
                    consultaDetalle(items.numeracion).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            let data = item.val();
                            arrayDetalle.push({
                                tipocomprobante: items.tipocomprobante,
                                correlativo: snapshot.key,
                                id: data.id,
                                cantidad: parseFloat(data.cantidad),
                                nombre: data.nombre,
                                medida: data.medida,
                                operacion: data.operacion,
                                precioUND: parseFloat(data.precio),
                                costo: parseFloat(data.costo),
                                stock: parseFloat(data.stock),
                                precioeditaUND: parseFloat(data.precioedita),
                                precio_Total: parseFloat(this.redondear(parseFloat(data.precioedita) * parseFloat(data.cantidad))),
                                preciodescuento: parseFloat(data.preciodescuento),
                                fecha: items.fecha
                            })
                            if (index === array.length - 1) {
                                resolve("true")
                            };
                        })
                    })
                })
                this.detalles = arrayDetalle
            })
            a.then((value) => {
                // console.log(value)

            })

            return a
        },
        consultasNotaCredito() {
            let array = [];
            allCabeceraNCD().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            //   console.log(item.val())
                            let data = item.val();
                            array.push({
                                tipocomprobante: data.tipocomprobante,
                                serie: data.serie,
                                correlativo: data.correlativo,
                                Op_grabada: parseFloat(this.redondear(parseFloat(data.total) / 1.18)),
                                igv: parseFloat(this.redondear((parseFloat(data.total) / 1.18) * 0.18)),
                                total: parseFloat(data.total),
                                fecha: this.conviertefecha(data.fecha),
                                estado: data.estado,
                                mensajeSunat: data.mensajeSunat,
                                tipo_comp_ref: data.tipo_comp_ref,
                                serie_comp_ref: data.serie_comp_ref,
                                correlativo_comp_ref: data.correlativo_comp_ref,
                                numeracion: data.numeracion,
                            });
                        })
                    }
                })
            this.cabeceraNC = array
        },
        consultasNotaCredito_nueva() {
            let array = [];
            allCabeceraNCD().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            //   console.log(item.val())
                            let data = item.val();
                            array.push({
                                estado: data.estado,
                                fecha: this.conviertefecha(data.fecha),
                                tipocomprobante: data.tipocomprobante,
                                serie: data.serie,
                                correlativo: data.correlativo,
                                total_op_exoneradas: data.total_op_exoneradas,
                                Op_grabada: data.total_op_gravadas,
                                igv: data.igv,
                                total: parseFloat(data.total),
                                mensajeSunat: data.mensajeSunat,
                                tipo_comp_ref: data.tipo_comp_ref,
                                serie_comp_ref: data.serie_comp_ref,
                                correlativo_comp_ref: data.correlativo_comp_ref,
                                numeracion: data.numeracion,
                            });
                        })
                    }
                })
            this.cabeceraNC = array
        },
        cargaData(value) {
            console.log(value)
            var array = []
            var ope = 0
            var exo = 0
            var total = 0
            var baseimp = 0
            var igv = 0
            var precio = 0
            var sumcargo = 0
            var total_cargo = 0
            consultaDetalle(value.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    if (item.val().operacion == 'GRAVADA') {
                        if (item.val().cargoxconsumo) {
                            precio = parseFloat((item.val().precioedita / ((parseFloat(value.porcentaje_cargo) / 100) + 1))).toFixed(2)
                            sumcargo = parseFloat(item.val().precioedita - precio)
                            total_cargo = total_cargo + parseFloat(sumcargo * item.val().cantidad)

                        } else {
                            precio = parseFloat(item.val().precioedita)
                        }
                        // console.log(item.val().precioedita)
                        ope = 'GRAVADA'
                        total = total + (precio * parseFloat(item.val().cantidad)) - parseFloat(item.val().preciodescuento)
                        baseimp = baseimp + ((precio * parseFloat(item.val().cantidad)) - parseFloat(item.val().preciodescuento)) / 1.18
                        igv = parseFloat(baseimp) * 0.18
                    } else {
                        precio = parseFloat(item.val().precioedita)
                        ope = 'EXONERADA'
                        exo = exo + (precio * parseFloat(item.val().cantidad)) - parseFloat(item.val().preciodescuento)
                        total = total + (precio * parseFloat(item.val().cantidad)) - parseFloat(item.val().preciodescuento)
                    }

                })
                // console.log(exo)
                if (value.tipocomprobante == "T") {
                    this.arrayConsolidar.push({
                        tipocomprobante: value.tipocomprobante,
                        serie: value.serie,
                        correlativo: value.correlativoDocEmitido,
                        exonerada: 0,
                        baseimp: 0,
                        igv: 0,
                        total: parseFloat(total.toFixed(2)),
                        descuentos: parseFloat(value.descuentos),
                        modopago: value.modopago,
                        fecha: this.conviertefecha(value.fecha),
                        vencimientoDoc: this.conviertefecha(value.vencimientoDoc),
                        estado: value.estado,
                        mensajeSunat: value.mensajeSunat,
                        tipoDocumento: value.tipoDocumento,
                        cliente: value.cliente,
                        dni: value.dni,
                        direccion: value.direccion,
                        numeracion: value.numeracion,
                        dniempleado: value.dniempleado,
                        empleado: value.nomempleado,
                        documentId: value.documentId
                    });
                } else {
                    if (value.porcentaje_cargo != 0) {
                        this.arrayConsolidar.push({
                            tipocomprobante: value.tipocomprobante,
                            serie: value.serie,
                            correlativo: value.correlativoDocEmitido,
                            exonerada: parseFloat(exo.toFixed(2)),
                            baseimp: parseFloat(baseimp.toFixed(2)),
                            igv: parseFloat(igv.toFixed(2)),
                            sub_total: parseFloat(total.toFixed(2)),
                            Cargos: parseFloat(total_cargo),
                            total: parseFloat(parseFloat(total + total_cargo).toFixed(2)),
                            descuentos: parseFloat(value.descuentos),
                            modopago: value.modopago,
                            fecha: this.conviertefecha(value.fecha),
                            vencimientoDoc: this.conviertefecha(value.vencimientoDoc),
                            estado: value.estado,
                            mensajeSunat: value.mensajeSunat,
                            tipoDocumento: value.tipoDocumento,
                            cliente: value.cliente,
                            dni: value.dni,
                            direccion: value.direccion,
                            numeracion: value.numeracion,
                            dniempleado: value.dniempleado,
                            empleado: value.nomempleado,
                            documentId: value.documentId
                        });
                    } else {
                        this.arrayConsolidar.push({
                            tipocomprobante: value.tipocomprobante,
                            serie: value.serie,
                            correlativo: value.correlativoDocEmitido,
                            exonerada: parseFloat(exo.toFixed(2)),
                            baseimp: parseFloat(baseimp.toFixed(2)),
                            igv: parseFloat(igv.toFixed(2)),
                            total: parseFloat(total.toFixed(2)),
                            descuentos: parseFloat(value.descuentos),
                            modopago: value.modopago,
                            fecha: this.conviertefecha(value.fecha),
                            vencimientoDoc: this.conviertefecha(value.vencimientoDoc),
                            estado: value.estado,
                            mensajeSunat: value.mensajeSunat,
                            tipoDocumento: value.tipoDocumento,
                            cliente: value.cliente,
                            dni: value.dni,
                            direccion: value.direccion,
                            numeracion: value.numeracion,
                            dniempleado: value.dniempleado,
                            empleado: value.nomempleado,
                            documentId: value.documentId
                        });
                    }

                }

            })

        },
        modo_pagos(array) {

        },
        exportanuevo() {
            var array = []
            var a = allCabecera().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            if (data.estado == 'ANULADO') {
                                data.cod_tipoDocumento = ''
                                data.dni = ''
                                data.cliente = 'ANULADO'
                                data.total_op_gravadas = 0
                                data.total = 0
                                data.descuentos = 0
                                data.igv = 0
                            }
                            if (Array.isArray(data.modopago)) {

                                var a = data.modopago.filter(item => item.monto != '')
                                if (a[0] != undefined) {
                                    data.modopago = (a[0].nombre)
                                }

                            }

                            if (this.tickets) {
                                array.push({
                                    estado: data.estado,
                                    cod_comprobante: data.cod_comprobante,
                                    tipocomprobante: data.tipocomprobante,
                                    serie: data.serie,
                                    correlativo: data.correlativoDocEmitido,
                                    modopago: data.modopago,
                                    forma_pago: data.forma_pago,
                                    fecha: this.conviertefecha(data.fecha),
                                    vencimientoDoc: this.conviertefecha(data.vencimientoDoc),
                                    porcentaje_igv: data.porcentaje_igv,
                                    sub_total: parseFloat(data.total),
                                    descuentos: -parseFloat(data.descuentos),
                                    total_op_gravadas: parseFloat(data.total_op_gravadas),
                                    total_op_exoneradas: parseFloat(data.total_op_exoneradas),
                                    total_cargo: parseFloat(data.total_cargo),
                                    igv: parseFloat(data.igv),
                                    total: parseFloat(data.total - data.descuentos),
                                    cod_tipoDocumento: data.cod_tipoDocumento,
                                    tipoDocumento: data.tipoDocumento,
                                    cliente: data.cliente,
                                    dni: data.dni,
                                    direccion: data.direccion,
                                    mensajeSunat: data.mensajeSunat,
                                    numeracion: data.numeracion,
                                    dniempleado: data.dniempleado,
                                    empleado: data.nomempleado,
                                })
                            } else {
                                if (data.tipocomprobante != 'T') {
                                    array.push({
                                        estado: data.estado,
                                        cod_comprobante: data.cod_comprobante,
                                        tipocomprobante: data.tipocomprobante,
                                        serie: data.serie,
                                        correlativo: data.correlativoDocEmitido,
                                        modopago: data.modopago,
                                        forma_pago: data.forma_pago,
                                        fecha: this.conviertefecha(data.fecha),
                                        vencimientoDoc: this.conviertefecha(data.vencimientoDoc),
                                        porcentaje_igv: data.porcentaje_igv,
                                        sub_total: parseFloat(data.total),
                                        descuentos: -parseFloat(data.descuentos),
                                        total_op_gravadas: parseFloat(data.total_op_gravadas),
                                        total_op_exoneradas: parseFloat(data.total_op_exoneradas),
                                        total_cargo: parseFloat(data.total_cargo),
                                        igv: parseFloat(data.igv),
                                        total: parseFloat(data.total - data.descuentos),
                                        cod_tipoDocumento: data.cod_tipoDocumento,
                                        tipoDocumento: data.tipoDocumento,
                                        cliente: data.cliente,
                                        dni: data.dni,
                                        direccion: data.direccion,
                                        mensajeSunat: data.mensajeSunat,
                                        numeracion: data.numeracion,
                                        dniempleado: data.dniempleado,
                                        empleado: data.nomempleado,
                                    })
                                }
                            }
                        })
                        return array
                    }
                })
            return a
        },

        exportar() {
            let detalle = XLSX.utils.json_to_sheet(this.detalles)
            let data = XLSX.utils.json_to_sheet(this.cabecera)
            let dataNC = XLSX.utils.json_to_sheet(this.cabeceraNC)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "Ventas")
            XLSX.utils.book_append_sheet(workbook, detalle, "Detalle_venta")
            XLSX.utils.book_append_sheet(workbook, dataNC, "Notas_Credito")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExportar = false
        },

        ini() {
            //  this.dialogoprogress=fals
            const ctx = document.getElementById('myChart');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['LUN', 'MAR', 'MIER', 'JUE', 'VIE', 'SAB', 'DOM'],
                    datasets: [{
                        label: 'ventas',
                        data: [this.lunes, this.martes, this.miercoles, this.jueves, this.viernes, this.sabado, this.domingo],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        ini2() {

            const ctx = document.getElementById('myChart1');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [this.semanas[0].semanainicio + ' - ' + this.semanas[0].semanafin, this.semanas[1].semanainicio + ' - ' + this.semanas[1].semanafin, this.semanas[2].semanainicio + ' - ' + this.semanas[2].semanafin, this.semanas[3].semanainicio + ' - ' + this.semanas[3].semanafin],
                    datasets: [{
                        label: 'ventas',
                        data: [this.semanas[0].total, this.semanas[1].total, this.semanas[2].total, this.semanas[3].total],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        ini3() {
            //  this.dialogoprogress=false
            const ctx = document.getElementById('myChart2');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'],
                    datasets: [{
                        label: 'ventas',
                        data: [this.meses[0], this.meses[1], this.meses[2], this.meses[3], this.meses[4], this.meses[5], this.meses[6],
                        this.meses[7], this.meses[8], this.meses[9], this.meses[10], this.meses[11], this.meses[12]
                        ],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        calculadata() {
            // this.dialogoprogress=true
            var now = moment()
            //  var now = moment()

            var fin = now.format('YYYY-MM-DD')
            //  console.log(now.subtract(1,'d').format('YYYY-MM-DD'))
            if (now.day() == 1) {
                this.consultabasedatos(fin, fin)
            }
            if (now.day() == 0) {
                var inicio = now.subtract(6, 'd').format('YYYY-MM-DD')
                this.consultabasedatos(inicio, fin)
            } else {
                var inicio = now.subtract(now.day() - 1, 'd').format('YYYY-MM-DD')
                this.consultabasedatos(inicio, fin)
            }
        },
        consultabasedatos(inicio, fin) {
            allCabecera().orderByChild('fecha')
                .startAt(moment(String(inicio)) / 1000)
                .endAt(moment(String(fin)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    this.calculatotales(snapshot)
                });

        },
        calculatotales(array) {
            var lu = 0
            var ma = 0
            var mi = 0
            var ju = 0
            var vi = 0
            var sa = 0
            var dom = 0
            var total = 0
            //console.log(array)
            array.forEach((item) => {
                if (item.val().estado == 'aprobado') {
                    total = total + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    if (moment.unix(item.val().fecha).day() == 1) {
                        lu = lu + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 2) {
                        ma = ma + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 3) {
                        mi = mi + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 4) {
                        ju = ju + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 5) {
                        vi = vi + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 6) {
                        sa = sa + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                    if (moment.unix(item.val().fecha).day() == 0) {
                        dom = dom + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                    }
                }
            })
            this.lunes = lu
            this.martes = ma
            this.miercoles = mi
            this.jueves = ju
            this.viernes = vi
            this.sabado = sa
            this.domingo = dom
            this.total = total.toFixed(2)
            this.ini()
        },
        generareportesemana() {
            consultareporte("consultasemanal").once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    consultareporte("semanal").once("value").then((snapshot1) => {

                        var now = moment(snapshot.val().consulta)
                        var now1 = moment()
                        if (now1.day() == 0) {
                            var resta = 7
                        } else {
                            var resta = now1.day()
                        }
                        now1.subtract(resta, 'd').format('YYYY-MM-DD')
                        if (now.isSame(now1.format('YYYY-MM-DD'))) {
                            this.semanas = snapshot1.val()
                            this.ini2()
                            this.totalsemana = snapshot.val().total
                        } else {
                            this.consultadatasemanal()
                        }
                    })
                } else {
                    console.log("no existe  ")
                    this.consultadatasemanal()
                }
            });
        },
        consultadatasemanal() {
            // this.dialogoprogress=true
            console.log("se consulta de bd")
            var now = moment()
            var now1 = moment()

            if (now1.day() == 0) {
                var fin = now.format('YYYY-MM-DD')
            } else {
                var fin = now.subtract(now1.day(), 'd').format('YYYY-MM-DD')
            }
            var inicio = now.subtract(6, 'd').format('YYYY-MM-DD')
            this.consultabasedatossemanas(inicio, fin)
            var fin2 = now.subtract(1, 'd').format('YYYY-MM-DD')
            var inicio2 = now.subtract(6, 'd').format('YYYY-MM-DD')
            this.consultabasedatossemanas(inicio2, fin2)
            var fin3 = now.subtract(1, 'd').format('YYYY-MM-DD')
            var inicio3 = now.subtract(6, 'd').format('YYYY-MM-DD')
            this.consultabasedatossemanas(inicio3, fin3)
            var fin4 = now.subtract(1, 'd').format('YYYY-MM-DD')
            var inicio4 = now.subtract(6, 'd').format('YYYY-MM-DD')
            this.consultabasedatossemanas(inicio4, fin4).then((r) => {
                this.ini2()
                var totalsemana = {
                    total: this.totalsemana,
                    consulta: fin
                }
                grabareporte("semanal", this.semanas)
                grabareporte("consultasemanal", totalsemana)
            })

        },
        consultabasedatossemanas(inicio, fin) {
            var a = allCabecera().orderByChild('fecha')
                .startAt(moment(String(inicio)) / 1000)
                .endAt(moment(String(fin)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    this.calculatotalessemana(snapshot, inicio, fin)
                    return true
                });
            return a

        },
        calculatotalessemana(array, inicio, fin) {
            var total = 0
            array.forEach((item) => {
                if (item.val().estado == 'aprobado') {
                    total = total + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                }
            })
            this.semanas.push({
                semanainicio: moment(inicio).format('DD/MM'),
                semanafin: moment(fin).format('DD/MM'),
                total: this.redondear(total)
            })
            this.totalsemana = parseFloat(this.totalsemana) + parseFloat(total)

        },

        consultamesesanteriores() {
            var now = moment().format('YYYY-MM-DD')
            consultareporte("mes").once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    console.log("edxiste")
                    this.meses = snapshot.val()
                    this.calculaTmes(snapshot.val())
                    this.consultadatames()
                    console.log(this.meses)
                    var numeromes = ''
                    snapshot.forEach((item) => {
                        numeromes = item.key
                    })

                    if (numeromes != moment().month()) {
                        console.log("conmsulta")
                        var fin1 = moment().subtract(moment().date() - 1, 'd').format('YYYY-MM-DD')
                        console.log(fin1)
                        this.versiconsultaanteriormes(fin1)
                    }
                } else {
                    //this.versiconsultaanteriormes('2022-03-01')   
                    this.reportenuevaempresa()
                }
            });
        },
        reportenuevaempresa() {
            var now = moment().format('MM')
            var array = []
            var cant = parseInt(now.toString())
            for (var i = 0; i < cant; i++) {
                array[i] = 0
            }
            //  console.log(array)
            grabareporte("mes", array)
        },
        versiconsultaanteriormes(data) {
            var now = moment(data)
            var fin1 = now.subtract(now.date(), 'd').format('YYYY-MM-DD')
            var inicio1 = now.subtract(now.date() - 1, 'd').format('YYYY-MM-DD')
            //  console.log(fin1)
            //console.log(inicio1)
            this.consultabasedatosmespasado(inicio1, fin1).then((r) => {
                this.consultadatames()
            })
        },
        consultadatames() {
            // this.dialogoprogress=true
            var now = moment()
            var fin = moment().format('YYYY-MM-DD')
            var inicio = now.subtract(now.date() - 1, 'd').format('YYYY-MM-DD')
            this.consultabasedatosmes(inicio, fin).then((r) => {
                this.ini3()
            })
            /*var fin1 = now.subtract(now.date(),'d').format('YYYY-MM-DD')
            var inicio1 = now.subtract(now.date()-1,'d').format('YYYY-MM-DD')
            this.consultabasedatosmes(inicio1,fin1)*/
        },
        consultabasedatosmes(inicio, fin) {
            var a = allCabecera().orderByChild('fecha')
                .startAt(moment(String(inicio)) / 1000)
                .endAt(moment(String(fin)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    this.calculatotalemes(snapshot, inicio, fin)
                    return true
                });
            return a
        },
        calculatotalemes(array, inicio, fin) {
            var total = 0
            array.forEach((item) => {
                if (item.val().estado == 'aprobado') {
                    total = total + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                }
            })
            var mes = moment(inicio).month()
            this.meses[mes] = this.redondear(total)

            this.totalmes = parseFloat(this.totalmes) + parseFloat(total)

        },
        calculaTmes(array) {
            var total = 0
            array.forEach((item) => {
                total = total + parseFloat(item)

            })
            this.totalmes = parseFloat(this.totalmes) + parseFloat(total)
        },

        consultabasedatosmespasado(inicio, fin) {
            var a = allCabecera().orderByChild('fecha')
                .startAt(moment(String(inicio)) / 1000)
                .endAt(moment(String(fin)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    this.calculatotalemespasado(snapshot, inicio, fin)
                    return true
                });
            return a
        },
        calculatotalemespasado(array, inicio, fin) {
            var total = 0
            array.forEach((item) => {
                if (item.val().estado == 'aprobado') {
                    total = total + parseFloat(item.val().total) - parseFloat(item.val().descuentos)
                }
            })
            var mes = moment(inicio).month()
            this.meses[mes] = this.redondear(total)
            grabareporte("mes", this.meses)
            this.totalmes = parseFloat(this.totalmes) + parseFloat(total)

        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        }
    }
}
</script>
