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
                    @click="(dialogoExportar = !dialogoExportar, tabla = 'ventas')">EXPORTAR REGISTRO DE VENTAS</v-btn>
            </v-col>
            <v-col cols="12">
                <v-btn elevation="15" rounded block color="error"
                    @click="dialogoExportar = !dialogoExportar, tabla = 'compras'">EXPORTAR REGISTRO DE COMPRAS</v-btn>
            </v-col>
        </v-row>

        <fecha @fecha="date = $event" />
        <fecha2 @fecha="date2 = $event" />

        <v-dialog v-model="dialogoExportar" max-width="500px">
            <v-card>
                <v-card-title>
                    <v-row class="mx-auto text-center">
                        <v-col cols="6" xs="6">
                            <v-text-field  v-model="date" label="Inicio"
                                type="date"></v-text-field>
                        </v-col>
                        <v-col cols="6" xs="6">
                            <v-text-field  v-model="date2" label="Fin"
                                type="date"></v-text-field>
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

import store from '@/store/index'
import {
    allCabecera,
    allCabeceraNCD,
    allMovimientos
} from '../../db'
import moment from 'moment'
import XLSX from 'xlsx'
import Chart from 'chart.js/auto'

export default {

    components: {
 
    },

    data: () => ({
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        dialogoExportar: false,
        dialogoprogress: false,
        detalles: [],
        cabecera: [],
        cabeceraNC: [],
        detalleNC: [],
        totalsemana: 0,
        semanas: [],
        totalmes: 0,
        meses: [],
        tickets: true,
        arrayConsolidar: [],
        tabla: ''
    }),
    destroyed() {

    },
    methods: {
        exportExcel() {
            if (this.tabla == 'ventas') {
                this.exporta_ventas()
            }
            if (this.tabla == 'compras') {
                this.exporta_compras()
            }
            if (this.tabla == 'todo') {
                this.exportar_todo()
            }
        },
        exportar_todo() {
            store.commit("dialogoprogress")
            let array = [];
            allCabecera().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            array.push(data)
                        })
                        this.exportar(array, 'todo ' + this.date + '-' + this.date2)

                    }
                });
        },
        exporta_ventas() {
            store.commit("dialogoprogress")
            let array = [];
            allCabecera().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            if(data.tipocomprobante=='T') return
                            if (data.estado == 'ANULADO') {
                                data.cod_tipoDocumento = ''
                                data.dni = ''
                                data.cliente = 'ANULADO'
                            }
                            console.log(data.estado)
                            array.push({
                                periodo: this.convierteperiodo(data.fecha) + '00',
                                orden: data.cod_comprobante + '-' + data.serie + '-' + data.correlativoDocEmitido,
                                estado: data.estado,
                                f_emision: this.conviertefecha(data.fecha),
                                f_vencimiento: this.conviertefecha(data.vencimientoDoc),
                                cod_comprobante: data.cod_comprobante,
                                serie: data.serie,
                                correlativo: data.correlativoDocEmitido,
                                cod_tipoDocumento: data.cod_tipoDocumento,
                                ruc: data.dni,
                                razon_social: data.cliente,
                                val_export: '0.00',
                                op_gravada: parseFloat(data.total_op_gravadas),
                                op_exonerada: parseFloat(data.total_op_exoneradas) + parseFloat(data.total_op_gratuitas),
                                op_inafecta: '0.00',
                                isc: '0.00',
                                igv: parseFloat(data.igv),
                                total: parseFloat(data.total_op_gravadas) + parseFloat(data.igv),
                                tipo_cambio: '0.00',
                                moneda: 'PEN',
                                fecha_doc_ref: '',
                                cod_comprobante_ref: '',
                                serie_ref: '',
                                correlativo_ref: '',
                                corresponde_per: '1'
                            })
                        })
                        this.consultasNotaCredito(array)
                    }
                });
        },
        consultasNotaCredito(cabecera) {
            let array = cabecera;
            allCabeceraNCD().orderByChild('fecha')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            let data = item.val();
                            if (data.estado == 'ANULADO') {
                                data.cod_tipoDocumento = ''
                                data.dni = ''
                                data.cliente = 'ANULADO'
                            }
                            data.cod_comprobante = '07'
                            data.cod_tipoDocumento = '1'
                            if (String(data.dni).length == 11) {
                                data.cod_tipoDocumento = '6'
                            }
                            array.push({
                                periodo: this.convierteperiodo(data.fecha) + '00',
                                orden: data.cod_comprobante + '-' + data.serie + '-' + data.correlativo,
                                estado: data.estado,
                                f_emision: this.conviertefecha(data.fecha),
                                f_vencimiento: '',
                                cod_comprobante: data.cod_comprobante,
                                serie: data.serie,
                                correlativo: data.correlativo,
                                cod_tipoDocumento: data.cod_tipoDocumento,
                                ruc: data.dni,
                                razon_social: data.cliente,
                                val_export: '0.00',
                                op_gravada: parseFloat(data.total_op_gravadas) * -1,
                                op_exonerada: parseFloat(data.total_op_exoneradas) * -1,
                                op_inafecta: '0.00',
                                isc: '0.00',
                                igv: parseFloat(data.igv) * -1,
                                total: parseFloat(data.total) * -1,
                                tipo_cambio: '0.00',
                                moneda: 'PEN',
                                fecha_doc_ref: this.conviertefecha(data.fecha_comp_ref),
                                cod_comprobante_ref: data.tipo_comp_ref,
                                serie_ref: data.serie_comp_ref,
                                correlativo_ref: data.correlativo_comp_ref,
                                corresponde_per: '1'
                            });
                        })
                        this.exportar(array, 'VENTAS ' + this.date + '-' + this.date2)
                    } else {
                        this.exportar(array, 'VENTAS ' + this.date + '-' + this.date2)
                    }
                })
        },
        exporta_compras() {
            store.commit("dialogoprogress")
            let array = [];
            allMovimientos().orderByChild('fecha_emision')
                .startAt(moment(String(this.date)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value").then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            if (data.estado != 'anulado') {
                                if (data.cod_doc == '01') {
                                    array.push({
                                        periodo: this.convierteperiodo(data.fecha_emision) + '00',
                                        f_emision: this.conviertefecha(data.fecha_emision),
                                        f_vencimiento: this.conviertefecha(data.fecha_emision),
                                        cod_comprobante: data.cod_doc,
                                        serie: data.sreferencia,
                                        correlativo: data.creferencia,
                                        cod_tipoDocumento: '6',
                                        ruc: data.num_doc,
                                        razon_social: data.nom_proveedor,
                                        val_export: '0.00',
                                        op_gravada: parseFloat(data.baseimponible),
                                        igv: parseFloat(data.igv),
                                        op_exonerada: parseFloat(data.tot_exonerada),
                                        op_inafecta: '0.00',
                                        isc: '0.00',
                                        total: parseFloat(data.total),
                                        tipo_cambio: '0.00',
                                        moneda: 'PEN',
                                        fecha_doc_ref: '',
                                        cod_comprobante_ref: '',
                                        serie_ref: '',
                                        correlativo_ref: '',
                                        corresponde_per: '1'
                                    })
                                }
                                if (data.cod_doc == '07') {
                                    array.push({
                                        periodo: this.convierteperiodo(data.fecha_emision) + '00',
                                        f_emision: this.conviertefecha(data.fecha_emision),
                                        f_vencimiento: this.conviertefecha(data.fecha_emision),
                                        cod_comprobante: data.cod_doc,
                                        serie: data.sreferencia,
                                        correlativo: data.creferencia,
                                        cod_tipoDocumento: '6',
                                        ruc: data.num_doc,
                                        razon_social: data.nom_proveedor,
                                        val_export: '0.00',
                                        op_gravada: parseFloat(data.baseimponible) * -1,
                                        igv: parseFloat(data.igv) * -1,
                                        op_exonerada: parseFloat(data.tot_exonerada) * -1,
                                        op_inafecta: '0.00',
                                        isc: '0.00',
                                        total: parseFloat(data.total) * -1,
                                        tipo_cambio: '0.00',
                                        moneda: 'PEN',
                                        fecha_doc_ref: this.conviertefecha(data.ref.fecha_emision),
                                        cod_comprobante_ref: data.ref.cod_doc,
                                        serie_ref: data.ref.sreferencia,
                                        correlativo_ref: data.ref.creferencia,
                                        corresponde_per: '1'
                                    })
                                }
                            }
                        })
                        this.exportar(array, 'COMPRAS ' + this.date + '-' + this.date2)
                    }
                });
        },
        exportar(cabecera, nombre) {
            let data = XLSX.utils.json_to_sheet(cabecera)
            const workbook = XLSX.utils.book_new()
            const filename = nombre
            XLSX.utils.book_append_sheet(workbook, data, nombre)
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExportar = false
            store.commit("dialogoprogress")
        },
        exportars() {
            let data = XLSX.utils.json_to_sheet(store.state.clientes)
            const workbook = XLSX.utils.book_new()
            const filename = 'lista clientes'
            XLSX.utils.book_append_sheet(workbook, data, 'lista clientes')
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExportar = false
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        convierteperiodo(date) {
            return moment.unix(date).format('MMYYYY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        }
    }
}
</script>
