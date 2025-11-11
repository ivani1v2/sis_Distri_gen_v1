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


        <v-dialog v-model="dialogoExportar" max-width="500px">
            <v-card>
                <v-card-title>
                    <v-row class="mx-auto text-center">
                        <v-col cols="12">
                            <v-select outlined dense :items="periodos" v-model="periodo" label="Periodo (MM-YYYY)"
                                prepend-inner-icon="mdi-calendar-month" />
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
        <v-dialog v-model="dialog_tiendas" scrollable max-width="500px">
            <v-card>
                <h4 class="text-center">SELECCIONE SEDE</h4>

                <v-simple-table class="elevation-1 mt-2" fixed-header height="70vh">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    CODIGO
                                </th>
                                <th class="text-left">
                                    B.Datos
                                </th>
                                <th class="text-left">
                                    SEDE
                                </th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in array_sedes" :key="item.key" @click="select_tienda(item)">
                                <td>{{ item.codigo }}</td>
                                <td>{{ item.base }}</td>
                                <td>{{ item.nombre }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>

import store from '@/store/index'
import {
    allCabecera,
    allCabeceraNCD,
    allMovimientos,
    allCabecera_general,
    allCabeceraNCD_general
} from '../../db'
import moment from 'moment'
import XLSX from 'xlsx'
import Chart from 'chart.js/auto'

export default {

    components: {

    },

    data: () => ({
        dialog_tiendas: false,
        array_sedes: [],
        periodo: moment().format('MM-YYYY'),
        periodos: [],
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
    created() {
        const empresa = store.state.array_sedes
        console.log(empresa)
        const emp = empresa.filter(e => e.tipo == 'sede')
        // Buscar la sede actual por coincidencia de base de datos
        this.array_sedes = emp
        console.log(this.array_sedes)
        this.periodos = this.generaPeriodos(24)
    },
    methods: {
        generaPeriodos(meses) {
            let array = []
            for (let i = 0; i < meses; i++) {
                array.push(moment().subtract(i, 'months').format('MM-YYYY'))
            }
            return array
        },
        rangoUnixDesdePeriodo(per) {
            const [mm, yyyy] = per.split('-')
            const start = moment(`${yyyy}-${mm}-01 00:00:00`, 'YYYY-MM-DD HH:mm:ss').startOf('month').unix()
            const end = moment(`${yyyy}-${mm}-01 23:59:59`, 'YYYY-MM-DD HH:mm:ss').endOf('month').unix()
            return [start, end]
        },
        periodoSunat(per) {
            const [mm, yyyy] = per.split('-')
            return `${mm}${yyyy}`
        },
        exportExcel() {
            if (this.tabla === 'ventas') this.exporta_ventas()
            if (this.tabla === 'compras') this.exporta_compras()
        },
        exporta_ventas() {
            store.commit("dialogoprogress");

            const [ini, fin] = this.rangoUnixDesdePeriodo(this.periodo);
            const [mm, yyyy] = String(this.periodo).split("-");
            const periodoSUNAT = `${mm}${yyyy}00`;
            const toNum = v => parseFloat(v || 0);

            const bases = (this.array_sedes || []).map(s => s.base);   // <<< NUEVO
            const array = [];

            // <<< CAMBIO: consultar TODAS las BDs
            Promise.all(
                bases.map(bd =>
                    allCabecera_general(bd)
                        .orderByChild("fecha")
                        .startAt(ini)
                        .endAt(fin)
                        .once("value")
                )
            )
                .then(results => {
                    let hayDatos = false;

                    results.forEach(snapshot => {
                        if (!snapshot.exists()) return;
                        hayDatos = true;

                        snapshot.forEach(item => {
                            const d = item.val();
                            if (d.tipocomprobante === "T") return;

                            // Normaliza ANULADO (mantengo tu lógica actual)
                            if (d.estado != "aprobado") {
                                d.cod_tipoDocumento = "";
                                d.dni = "";
                                d.cliente = "ANULADO";
                            }

                            array.push({
                                periodo: periodoSUNAT,
                                orden: `${d.cod_comprobante}-${d.serie}-${d.correlativoDocEmitido}`,
                                estado: d.estado,
                                f_emision: this.conviertefecha(d.fecha),
                                f_vencimiento: this.conviertefecha(d.vencimientoDoc),
                                cod_comprobante: d.cod_comprobante,
                                serie: d.serie,
                                correlativo: d.correlativoDocEmitido,
                                cod_tipoDocumento: d.cod_tipoDocumento,
                                ruc: d.dni,
                                razon_social: d.cliente,
                                val_export: "0.00",
                                op_gravada: toNum(d.total_op_gravadas),
                                op_exonerada: toNum(d.total_op_exoneradas),
                                op_inafecta: "0.00",
                                op_gratuita: toNum(d.total_op_gratuitas),
                                isc: "0.00",
                                igv: toNum(d.igv),
                                total: toNum(d.total_op_gravadas) + toNum(d.total_op_exoneradas) + toNum(d.igv),
                                tipo_cambio: "0.00",
                                moneda: d.moneda || "PEN",
                                fecha_doc_ref: "",
                                cod_comprobante_ref: "",
                                serie_ref: "",
                                correlativo_ref: "",
                                corresponde_per: "1",
                            });
                        });
                    });

                    if (!hayDatos) {
                        store.commit("dialogoprogress");
                        alert("No hay datos para exportar en el periodo seleccionado");
                        return;
                    }

                    // <<< PASA TAMBIÉN LAS BASES
                    this.consultasNotaCredito(array, ini, fin, periodoSUNAT, bases);
                })
                .catch(() => {
                    store.commit("dialogoprogress");
                    alert("Ocurrió un error al consultar las ventas");
                });
        },


        consultasNotaCredito(cabecera, ini, fin, periodoSUNAT, bases) {   // <<< bases agregado
            const array = cabecera;
            const toNum = v => parseFloat(v || 0);

            // <<< CAMBIO: consultar TODAS las BDs
            Promise.all(
                bases.map(bd =>
                    allCabeceraNCD_general(bd)
                        .orderByChild("fecha")
                        .startAt(ini)
                        .endAt(fin)
                        .once("value")
                )
            )
                .then(results => {
                    results.forEach(snapshot => {
                        if (!snapshot.exists()) return;

                        snapshot.forEach(item => {
                            const d = item.val();

                            // Normaliza ANULADO (mantengo tu lógica actual)
                            if (d.estado === "ANULADO") {
                                d.cod_tipoDocumento = "";
                                d.dni = "";
                                d.cliente = "ANULADO";
                            }

                            const codTipoDoc = String(d.dni || "").length === 11 ? "6" : "1";

                            array.push({
                                periodo: periodoSUNAT,
                                orden: `07-${d.serie}-${d.correlativo}`,
                                estado: d.estado,
                                f_emision: this.conviertefecha(d.fecha),
                                f_vencimiento: "",
                                cod_comprobante: "07",
                                serie: d.serie,
                                correlativo: d.correlativo,
                                cod_tipoDocumento: codTipoDoc,
                                ruc: d.dni,
                                razon_social: d.cliente,
                                val_export: "0.00",
                                op_gravada: toNum(d.total_op_gravadas) * -1,
                                op_exonerada: toNum(d.total_op_exoneradas) * -1,
                                op_inafecta: "0.00",
                                isc: "0.00",
                                igv: toNum(d.igv) * -1,
                                // (mantengo tu fórmula actual de total)
                                total: toNum(d.total_op_gravadas) + toNum(d.igv) + toNum(d.total_op_exoneradas) * -1,
                                tipo_cambio: "0.00",
                                moneda: d.moneda || "PEN",
                                fecha_doc_ref: this.conviertefecha(d.fecha_comp_ref),
                                cod_comprobante_ref: d.tipo_comp_ref,
                                serie_ref: d.serie_comp_ref,
                                correlativo_ref: d.correlativo_comp_ref,
                                corresponde_per: "1",
                            });
                        });
                    });

                    this.exportar(array, `VENTAS ${this.periodo}`);
                })
                .catch(() => {
                    store.commit("dialogoprogress");
                    alert("Ocurrió un error al consultar las notas de crédito");
                });
        },


        exporta_compras() {
            store.commit("dialogoprogress");

            const [ini, fin] = this.rangoUnixDesdePeriodo(this.periodo);
            const periodoSUNAT = this.periodoSunat(this.periodo) + '00';
            const toNum = v => parseFloat(v || 0);

            const pushRow = (arr, d, sign = 1) => {
                arr.push({
                    periodo: periodoSUNAT,
                    f_emision: this.conviertefecha(d.fecha_emision),
                    f_vencimiento: this.conviertefecha(d.fecha_emision),
                    cod_comprobante: d.cod_doc,
                    serie: d.sreferencia,
                    correlativo: d.creferencia,
                    cod_tipoDocumento: '6',
                    ruc: d.num_doc,
                    razon_social: d.nom_proveedor,
                    val_export: '0.00',
                    op_gravada: toNum(d.baseimponible) * sign,
                    igv: toNum(d.igv) * sign,
                    op_exonerada: toNum(d.tot_exonerada) * sign,
                    op_inafecta: '0.00',
                    isc: '0.00',
                    total: toNum(d.total) * sign,
                    tipo_cambio: '0.00',
                    moneda: d.moneda || 'PEN',
                    fecha_doc_ref: sign === -1 ? this.conviertefecha(d?.ref?.fecha_emision) : '',
                    cod_comprobante_ref: sign === -1 ? (d?.ref?.cod_doc || '') : '',
                    serie_ref: sign === -1 ? (d?.ref?.sreferencia || '') : '',
                    correlativo_ref: sign === -1 ? (d?.ref?.creferencia || '') : '',
                    corresponde_per: '1'
                });
            };

            const array = [];
            allMovimientos()
                .orderByChild('fecha_emision')
                .startAt(ini)
                .endAt(fin)
                .once('value')
                .then(snap => {
                    if (!snap.exists()) {
                        store.commit("dialogoprogress");
                        alert('No hay datos para exportar en el periodo seleccionado');
                        return;
                    }

                    snap.forEach(it => {
                        const d = it.val();
                        if (d.estado === 'anulado') return;
                        if (d.cod_doc === '01') pushRow(array, d, 1);   // Factura de compra
                        if (d.cod_doc === '07') pushRow(array, d, -1);  // Nota de crédito de compra
                    });

                    this.exportar(array, `COMPRAS ${this.periodo}`);
                })
                .catch(() => {
                    store.commit("dialogoprogress");
                    alert('Ocurrió un error al consultar los movimientos');
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
