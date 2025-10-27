<template>
    <div class="mb-6 mt-3 pa-4">
        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="4">
                    <v-text-field type="date" class="mx-1" outlined dense v-model="date" label="Inicio"></v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-text-field class="mx-1" type="date" outlined dense v-model="date2" label="Fin"></v-text-field>
                </v-col>

                <v-col cols="4">
                    <v-select :items="array_ubica" label="Ubicacion" dense outlined v-model="ubicacion"></v-select>
                </v-col>
            </v-row>

            <v-row class="mt-n8">
                <v-col cols="2">
                    <h4 class="text-center" v-if="tabla == 'detallado'">V.General: S/.{{ sumaventas().venta }}</h4>
                </v-col>
                <v-col cols="2">

                </v-col>
                <v-col cols="2">

                </v-col>
                <v-col cols="3">
                    <v-btn color="error" class="" block x-small @click="consolida('detallado')"
                        v-if="tabla == 'consolida'">Detallado</v-btn>
                    <v-btn color="error" class="" block x-small @click="consolida('consolida')"
                        v-if="tabla == 'detallado'">Consolidado</v-btn>
                </v-col>
                <v-col cols="3">
                    <v-btn color="info" class="" block x-small @click="busca()">FILTRA</v-btn>
                </v-col>
            </v-row>

            <v-simple-table fixed-header height='70vh' dense v-if="tabla == 'detallado'">
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Tienda
                            </th>
                            <th class="text-left">
                                Vendedor
                            </th>
                            <th class="text-left">
                                Correlativo
                            </th>
                            <th class="text-left">
                                Cliente
                            </th>
                            <th class="text-left">
                                Fecha
                            </th>
                            <th class="text-left">
                                Estado
                            </th>
                            <th class="text-left">
                                Saldo
                            </th>
                            <th class="text-left">
                                Total
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td style="font-size:75%;">{{ item.tienda }}</td>
                            <td style="font-size:75%;">{{ acorta_vendedor(item.vendedor) }}</td>
                            <td style="font-size:75%;">{{ item.numeracion }}</td>
                            <td style="font-size:75%;">{{ item.dni + ' - ' + item.cliente }}
                            </td>
                            <td style="font-size:75%;">{{ conviertefecha(item.fecha) }}</td>
                            <td>
                                <v-icon :color="item.color">mdi-circle</v-icon>
                            </td>
                            <td style="font-size:75%;">S/.{{ redondear(item.total) - redondear(item.a_cuenta) }}</td>
                            <td style="font-size:75%;">S/.{{ redondear(item.total) }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="12">
                                        <v-icon color="green" @click.prevent="ejecutaConsolida(item)">mdi-eye</v-icon>
                                    </v-col>

                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
            <v-simple-table fixed-header height='70vh' dense v-if="tabla == 'consolida'">
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Tienda
                            </th>
                            <th class="text-left">
                                Venta General
                            </th>
                            <th class="text-left">
                                A cuenta
                            </th>
                            <th class="text-left">
                                Saldo
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in lista_consol" :key="item.id">
                            <td style="font-size:75%;"> {{ item.tienda }}</td>
                            <td style="font-size:75%;">S/ {{ item.venta }}</td>
                            <td style="font-size:75%;">S/ {{ item.a_cuenta }}</td>
                            <td style="font-size:75%;">S/ {{ (item.venta - item.a_cuenta).toFixed(2) }}</td>

                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>
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
                <v-simple-table dark fixed-header max-width="70vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Cantidad
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
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }} x {{ item.medida }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>

        <v-dialog v-model="dial_metodos" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_metodos = !dial_metodos">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">

                <v-row class="mt-n2">
                    <v-col cols="4">
                        <h4 class="text-center">EFECTIVO : </h4>
                    </v-col>
                    <v-col cols="4">
                        <h4 class="text-center">TARJETA : </h4>
                    </v-col>
                    <v-col cols="4">
                        <h4 class="text-center">YAPE : </h4>
                    </v-col>
                    <v-col cols="4">
                        <h4 class="text-center">PLIN : </h4>
                    </v-col>
                    <v-col cols="4">
                        <h4 class="text-center">TRASNF. : </h4>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />


    </div>
</template>

<script>
import {
    allCabecera_general,
    consultaDetalle,
    grabaDatoC,
    consulta_Cabecera,
    consultaDetalle_bd
} from '../../db'
import store from '@/store/index'
import imprime from '@/components/dialogos/dialog_imprime'
import moment from 'moment'
export default {
    components: {

        imprime
    },

    data: () => ({
        tabla: 'detallado',
        genera_pdf: false,
        documento: '',
        desserts: [],
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        seleccionado: '',
        num_doc: '',
        tipo_doc: 'T',
        numero: '',
        correo: '',
        array_ubica: [],
        tabla_conso: [],
        ubicacion: 'todos',
        dial_metodos: false,
    }),

    computed: {
        listafiltrada() {
            this.desserts.reverse()
            if (this.ubicacion == 'todos') {
                return this.desserts
            }
            if (this.ubicacion != 'todos') {
                return this.desserts.filter((item) => item.tienda == this.ubicacion)
            }

        },
        lista_consol() {
            return this.tabla_conso
        }
    },
    created() {
        this.array_ubica = store.state.tiendas
        this.array_ubica.unshift('todos')
        this.busca()
    },
    methods: {
        async consolida(tabla) {
            if (tabla == 'detallado') {
                this.tabla = 'detallado'
            } else {


                store.commit("dialogoprogress", 1)
                var tiendas = store.state.array_tiendas
                var array = []
                for (var i = 0; i < tiendas.length; i++) {
                    var snapshot = await allCabecera_general(tiendas[i].bd)
                        .orderByChild('fecha')
                        .startAt(moment(String(this.date)) / 1000)
                        .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                        .once("value")
                    var venta = 0
                    var pendiente = 0
                    var a_cuenta = 0
                    snapshot.forEach((item) => {
                        var data = item.val()
                        if (data.estado != 'ANULADO' && data.estado != "error" && data.estado != "anulado") {
                            a_cuenta = a_cuenta + parseFloat(data.a_cuenta)
                            venta = venta + parseFloat(data.total)

                        }
                    })
                    array.push({
                        tienda: tiendas[i].nom_tienda,
                        venta: venta,
                        a_cuenta: a_cuenta
                    })
                }
                this.tabla_conso = array.sort(function (a, b) {
                    if (parseFloat(a.venta) < parseFloat(b.venta)) {
                        return 1;
                    }
                    if (parseFloat(a.venta) > parseFloat(b.venta)) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                this.tabla = 'consolida'
                store.commit("dialogoprogress", 1)
            }
        },
        visualiza_metodos() {
            var lista = this.listafiltrada
            var efectivo = 0
            var tarjeta = 0
            var yape = 0
            var plin = 0
            var trans = 0
            for (var i = 0; i < lista.length; i++) {
                var data = lista[i].modopago
                for (var e = 0; e < data.length; e++) {
                    var dd = data[e]
                    if (!Boolean(dd.monto)) {
                        dd.monto = 0
                    }
                    if (dd.nombre == 'EFECTIVO') {
                        efectivo = efectivo + parseFloat(dd.monto)
                    }
                    if (dd.nombre == 'TARJETA') {
                        tarjeta = tarjeta + parseFloat(dd.monto)
                    }
                    if (dd.nombre == 'YAPE') {
                        yape = yape + parseFloat(dd.monto)
                    }
                    if (dd.nombre == 'PLIN') {
                        plin = plin + parseFloat(dd.monto)
                    }
                    if (dd.nombre == 'TRANSFERENCIA') {
                        trans = trans + parseFloat(dd.monto)
                    }
                }
            }
            var array = {
                efectivo: efectivo,
                tarjeta: tarjeta,
                yape: yape,
                plin: plin,
                trans: trans
            }
            console.log(array)
            this.dial_metodos = true
        },
        selecciona_item(item) {
            this.seleccionado = item
            this.genera_pdf = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM hh:mm A')
        },
        sumaventas() {
            var venta = 0
            var pendiente = 0
            var a_cuenta = 0
            var lista = this.listafiltrada
            for (var i = 0; i < lista.length; i++) {
                if (lista[i].estado != "ANULADO" && lista[i].estado != "error" && lista[i].estado != "anulado") {
                    a_cuenta = a_cuenta + parseFloat(lista[i].a_cuenta)
                    venta = venta + parseFloat(lista[i].total)
                }
            }
            var array = {
                venta: venta.toFixed(2),
                a_cuenta: a_cuenta.toFixed(2),
                saldo: (venta - a_cuenta).toFixed(2)
            }
            return array
        },
        ejecutaConsolida(value) {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            consultaDetalle_bd(value.bd, value.numeracion).once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    this.arrayConsolidar.push(item.val())
                })
                this.dialog = true
                store.commit("dialogoprogress")
            })
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        async busca() {
            store.commit("dialogoprogress", 1)
            var array = []
            this.desserts = []
            var tiendas = store.state.array_tiendas
            for (var i = 0; i < tiendas.length; i++) {
                console.log(tiendas[i])
                var snapshot = await allCabecera_general(tiendas[i].bd)
                    .orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value")

                snapshot.forEach((item) => {
                    var data = item.val()
                    data.color = this.asigna_color_doc(data)
                    data.tienda = tiendas[i].nom_tienda
                    data.tienda_bd = tiendas[i].bd
                    if (data.estado != 'ANULADO') {
                        console.log(data)
                        array.push(data)
                    }

                })

            }
            this.desserts = array
            store.commit("dialogoprogress", 1)
        },
        cambia_doc() {
            if (this.tipo_doc == 'B') {
                this.tipo_doc = 'F'
            } else {
                if (this.tipo_doc == 'F') {
                    this.tipo_doc = 'T'
                } else {
                    this.tipo_doc = 'B'
                }
            }
        },
        asigna_color_doc(datas) {
            let data = datas
            var color = ''
            if (data.estado != 'aprobado' || data.estado != 'ACEPTADO' ||
                data.estado != 'PENDIENTE' || data.estado != 'pendiente') {
                color = '#FF0000'
            }
            if (data.estado == 'aprobado' || data.estado == 'ACEPTADO') {
                color = '#46FF00'
            }
            if (data.estado == 'PENDIENTE' || data.estado == 'pendiente') {
                color = '#FFB200'
            }
            return color
        },
        acorta_vendedor(val) {
            let indice = val.indexOf(" ")
            let indice2 = val.indexOf(",")
            var nom = String(val.substring(indice2 + 2, val.length)).trim()
            let indc = nom.indexOf(" ")
            var vend = val.substring(0, indice) + ' ' + nom.substring(0, indc);
            return vend
        }

    }
}
</script>
