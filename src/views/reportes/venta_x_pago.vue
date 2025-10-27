<template>
    <div class="mt-3 pa-4">
        <v-card class="mb-5 mt-2">
            <h2 class="text-center mt-n6">Ventas X Pago</h2>
            <v-row class=" mb-n3 text-center">
                <v-col cols="4">
                    <v-row dense>
                        <v-col cols="4">
                            <v-icon @click="dialogoFiltro = true" color="blue" large>mdi-filter</v-icon>
                        </v-col>
                        <v-col cols="4">
                            <v-icon @click="Exporta_excel()" color="green" large>mdi-microsoft-excel</v-icon>
                        </v-col>
                        <v-col cols="4">
                            <v-icon @click="dialogo_imprime = true" color="red" large>mdi-file-pdf-box</v-icon>
                        </v-col>
                    </v-row>
                </v-col>
                <v-col cols="4">
                    <h4 class="text-center">Del {{ date1 }} al {{ date2 }}</h4>
                </v-col>
                <v-col cols="4">

                </v-col>
            </v-row>
            <v-row class="mt-n7 mb-n3 text-center">
                <v-col cols="6">
                    <h4 class="text-center">T-Venta Contado: S/.{{ suma_venta() }}</h4>
                    <h4 class="text-center">T-Utilidad : S/.{{ suma_utilidad() }}</h4>
                </v-col>
                <v-col cols="6">
                    <h4 class="text-center">T-Venta Credito: S/.{{ suma_venta_c() }}</h4>
                    <h4 class="text-center">T-Utilidad : S/.{{ suma_utilidad_c() }}</h4>
                </v-col>
            </v-row>
            <v-row class=" mb-n3 text-center">
                <v-col cols="6">
                    <v-simple-table class="elevation-1" fixed-header height="70vh" dense>
                        <template v-slot:default>
                            <thead>

                                <tr>
                                    <th class="text-left">
                                        Cantidad
                                    </th>
                                    <th class="text-left">
                                        Nombre
                                    </th>
                                    <th class="text-left">
                                        Costo
                                    </th>
                                    <th class="text-left">
                                        P.Prom.
                                    </th>
                                    <th class="text-left">
                                        Total V.
                                    </th>
                                    <th class="text-left">
                                        Utilidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in desserts" :key="item.id">
                                    <td style="font-size:75%;">{{ (item.cantidad).toFixed(2) }}</td>
                                    <td style="font-size:75%;">{{ item.nombre }}</td>
                                    <td style="font-size:75%;">{{ item.costo }}</td>
                                    <td style="font-size:75%;">{{ item.precio_prom }}</td>
                                    <td style="font-size:75%;">{{ item.total }}</td>
                                    <td style="font-size:75%;">{{ (item.total - item.costo_tot).toFixed(2) }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-col>
                <v-col cols="6">
                    <v-simple-table class="elevation-1" fixed-header height="70vh" dense>
                        <template v-slot:default>
                            <thead>

                                <tr>
                                    <th class="text-left">
                                        Cantidad
                                    </th>
                                    <th class="text-left">
                                        Nombre
                                    </th>
                                    <th class="text-left">
                                        Costo
                                    </th>
                                    <th class="text-left">
                                        P.Prom.
                                    </th>
                                    <th class="text-left">
                                        Total V.
                                    </th>
                                    <th class="text-left">
                                        Utilidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in array_credito" :key="item.id">
                                    <td style="font-size:75%;">{{ item.cantidad }}</td>
                                    <td style="font-size:75%;">{{ item.nombre }}</td>
                                    <td style="font-size:75%;">{{ item.costo }}</td>
                                    <td style="font-size:75%;">{{ item.precio_prom }}</td>
                                    <td style="font-size:75%;">{{ item.total }}</td>
                                    <td style="font-size:75%;">{{ (item.total - item.costo_tot).toFixed(2) }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-col>
            </v-row>

        </v-card>

        <v-dialog v-model="dialogoFiltro" max-width="550px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoFiltro = !dialogoFiltro">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-4">
                <v-row class="text-center">
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date1" label="INICIO"></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date2" label="FIN"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="text-center mt-n7">
                    <v-col cols="6">
                        <v-switch v-model="costo_catalogo" color="green" label="Costo Catalogo"></v-switch>
                    </v-col>
                </v-row>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="genera_filtro()" text>Genera</v-btn>
                </v-card-actions>
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
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import {
    allCabecera,
    consultaDetalle,
    allcuentaxcobrar
} from '../../db'
import store from '@/store/index'
import XLSX from 'xlsx'
import moment from 'moment'
import {
    pdf_productos_vendidos
} from '../../pdf'
export default {

    data() {
        return {
            dialogoFiltro: false,
            desserts: [],
            array_credito: [],
            date1: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            ruta: 'TODAS',
            arry_total: [],
            costo_catalogo: true,
            dialogo_imprime: false,
        }
    },
    methods: {
        async consulta_credito() {
            var array_cabecera = []
            var snapshot2 = await allcuentaxcobrar()
                .orderByChild('f_pago')
                .startAt(moment(String(this.date1)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value")
            snapshot2.forEach((item) => {
                var data = item.val()
                console.log(data)
                array_cabecera.push({ numeracion: data.doc_ref })
            })
            this.consuta_detalle_c(array_cabecera).then((r) => {
                //console.log(r)
                r.sort(function (a, b) {
                    if (a.cantidad < b.cantidad) {
                        return 1;
                    }
                    if (a.cantidad > b.cantidad) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });

                this.array_credito = r
            })
        },
        consuta_detalle_c(arrays) {
            var array_detalle = []
            var a = new Promise((resolve, reject) => {
                arrays.forEach((items, index, array) => {
                    var data = items
                    consultaDetalle(data.numeracion).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            var producto = item.val()
                            var p_catalogo = 0
                            var catalogo = store.state.productos.find(id => String(id.id) === String(producto.id))
                            if (catalogo != undefined) {
                                //  console.log(catalogo)
                                p_catalogo = catalogo.costo
                            } else {
                                p_catalogo = 0
                            }

                            //console.log(producto)
                            if (this.buscarArray(array_detalle, producto) == '') {
                                var total = parseFloat((producto.precioedita * producto.cantidad - parseFloat(producto.preciodescuento)).toFixed(2))
                                var total_costo = parseFloat((p_catalogo * producto.cantidad).toFixed(2))
                                array_detalle.push({
                                    id: producto.id,
                                    nombre: producto.nombre,
                                    medida: producto.medida,
                                    cantidad: parseFloat(producto.cantidad),
                                    costo: p_catalogo,
                                    costo_tot: total_costo,
                                    precio_prom: parseFloat((total / producto.cantidad).toFixed(2)),
                                    total: total
                                })
                            } else {

                                /// var pos = this.arrayConsolidar.map(e => e.id).indexOf(existe.id)
                                var pos = this.buscarposicion(array_detalle, producto)
                                var array = this.buscarArray(array_detalle, producto)

                                var suma_cantidad = parseFloat(producto.cantidad) + parseFloat(array.cantidad)
                                array_detalle[pos].cantidad = suma_cantidad

                                var precio_t = parseFloat(array.total) + parseFloat(producto.precioedita * producto.cantidad - parseFloat(producto.preciodescuento))
                                array_detalle[pos].total = parseFloat(precio_t.toFixed(2))

                                var suma3 = parseFloat(array.costo_tot) + parseFloat(p_catalogo * producto.cantidad)
                                array_detalle[pos].costo_tot = parseFloat(suma3.toFixed(2))

                                var precio_p = precio_t / suma_cantidad
                                array_detalle[pos].precio_prom = parseFloat(precio_p.toFixed(2))

                            }
                        })
                        if (index === array.length - 1) {
                            resolve(array_detalle)
                        };
                    })
                })
            })
            return a
        },
        async genera_filtro() {
            this.consulta_credito()
            store.commit("dialogoprogress")
            var array_cabecera = []
            var snapshot = await allCabecera()
                .orderByChild('fecha')
                .startAt(moment(String(this.date1)) / 1000)
                .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                .once("value")
            snapshot.forEach((item) => {
                var data = item.val()
                console.log(data)
                if (data.estado == 'aprobado' && data.forma_pago == "Contado") {
                    array_cabecera.push(data)
                }
            })

            this.consuta_detalle(array_cabecera).then((r) => {
                //console.log(r)
                r.sort(function (a, b) {
                    if (a.cantidad < b.cantidad) {
                        return 1;
                    }
                    if (a.cantidad > b.cantidad) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                store.commit("dialogoprogress")
                this.dialogoFiltro = false
                this.desserts = r
            })

        },
        consuta_detalle(arrays) {
            var array_detalle = []
            var a = new Promise((resolve, reject) => {
                arrays.forEach((items, index, array) => {
                    var data = items
                    consultaDetalle(data.numeracion).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            var producto = item.val()
                            var p_catalogo = 0
                            var catalogo = store.state.productos.find(id => String(id.id) === String(producto.id))
                            if (catalogo != undefined) {
                                //  console.log(catalogo)
                                p_catalogo = catalogo.costo
                            } else {
                                p_catalogo = 0
                            }

                            //console.log(producto)
                            if (this.buscarArray(array_detalle, producto) == '') {
                                var total = parseFloat((producto.precioedita * producto.cantidad - parseFloat(producto.preciodescuento)).toFixed(2))
                                var total_costo = parseFloat((p_catalogo * producto.cantidad).toFixed(2))
                                array_detalle.push({
                                    id: producto.id,
                                    nombre: producto.nombre,
                                    medida: producto.medida,
                                    cantidad: parseFloat(producto.cantidad),
                                    costo: p_catalogo,
                                    costo_tot: total_costo,
                                    precio_prom: parseFloat((total / producto.cantidad).toFixed(2)),
                                    total: total
                                })
                            } else {

                                /// var pos = this.arrayConsolidar.map(e => e.id).indexOf(existe.id)
                                var pos = this.buscarposicion(array_detalle, producto)
                                var array = this.buscarArray(array_detalle, producto)

                                var suma_cantidad = parseFloat(producto.cantidad) + parseFloat(array.cantidad)
                                array_detalle[pos].cantidad = suma_cantidad

                                var precio_t = parseFloat(array.total) + parseFloat(producto.precioedita * producto.cantidad - parseFloat(producto.preciodescuento))
                                array_detalle[pos].total = parseFloat(precio_t.toFixed(2))

                                var suma3 = parseFloat(array.costo_tot) + parseFloat(p_catalogo * producto.cantidad)
                                array_detalle[pos].costo_tot = parseFloat(suma3.toFixed(2))

                                var precio_p = precio_t / suma_cantidad
                                array_detalle[pos].precio_prom = parseFloat(precio_p.toFixed(2))

                            }
                        })
                        if (index === array.length - 1) {
                            resolve(array_detalle)
                        };
                    })
                })
            })
            return a
        },
        buscarArray(array, id) {
            var a = ''
            for (var i = 0; i < array.length; i++) {
                if (array[i].id == id.id) {
                    a = array[i]
                }
            }
            return a
        },
        buscarposicion(array, id) {
            var a = ''
            for (var i = 0; i < array.length; i++) {
                if (array[i].id == id.id) {
                    a = i
                }
            }
            return a
        },
        suma_utilidad() {
            var total = 0
            for (var i = 0; i < this.desserts.length; i++) {
                total = total + parseFloat(this.desserts[i].total - this.desserts[i].costo_tot)
            }
            return total.toFixed(2)
        },
        suma_venta() {
            var total = 0
            for (var i = 0; i < this.desserts.length; i++) {
                total = total + parseFloat(this.desserts[i].total)
            }
            return total.toFixed(2)
        },
        suma_utilidad_c() {
            var total = 0
            for (var i = 0; i < this.array_credito.length; i++) {
                total = total + parseFloat(this.array_credito[i].total - this.array_credito[i].costo_tot)
            }
            return total.toFixed(2)
        },
        suma_venta_c() {
            var total = 0
            for (var i = 0; i < this.array_credito.length; i++) {
                total = total + parseFloat(this.array_credito[i].total)
            }
            return total.toFixed(2)
        },
        Exporta_excel() {
            var data = XLSX.utils.json_to_sheet(this.desserts)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "REPORTE")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExporta = false
        },
        verPDF(medida) {
            //console.log(this.desserts)
            pdf_productos_vendidos(this.desserts, medida)
        }

    }

}
</script>
