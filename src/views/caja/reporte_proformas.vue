<template>
    <div class="mb-6 mt-10 pa-4">

        <v-row class="mb-n7 mt-n7 text-center" no-gutters>
            <v-col cols="4">
                <h2>PROFORMAS</h2>
            </v-col>
            <v-col cols="4">
                <v-icon @click="data_proforma = '', dial_proforma = true" color="green"
                    large>mdi-plus-circle-outline</v-icon>
            </v-col>

        </v-row>

        <v-row class="text-center pa-2 mb-n7">
            <v-col cols="6">
                <v-text-field type="date" outlined dense v-model="date1" label="INICIO"></v-text-field>
            </v-col>

            <v-col cols="6">
                <v-text-field type="date" outlined dense v-model="date2" label="FIN"></v-text-field>
            </v-col>

        </v-row>

        <v-card>
            <v-simple-table fixed-header height="65vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Id
                            </th>
                            <th class="text-left">
                                Fecha Emision
                            </th>
                            <th class="text-left">
                                Cliente
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
                            <td style="font-family:verdana;font-size:75%;">{{ item.id }}</td>
                            <td style="font-family:verdana;font-size:75%;">{{ conviertefecha(item.fecha_emision) }}</td>
                            <td style="font-family:verdana;font-size:75%;">{{ item.num_cliente }} - {{ item.nom_cliente
                                }}</td>
                            <td style="font-family:verdana;font-size:75%;">S/ {{ item.total }}</td>
                            <td>
                                <v-menu>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon v-bind="attrs" v-on="on">
                                            <v-icon>mdi-dots-vertical</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click='emite(item)'>
                                            <v-list-item-icon>
                                                <v-icon color="info">mdi-send</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Emitir</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="abre_visualizacion(item)">
                                            <v-list-item-icon>
                                                <v-icon color="green">mdi-eye</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Visualizar</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="imprime(item)">
                                            <v-list-item-icon>
                                                <v-icon color="red">mdi-text-box-search-outline</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Imprime</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="editar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="yellow">mdi-pencil</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Editar</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="elminar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="red">mdi-delete</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Borrar</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>
        <v-dialog v-model="dialogo_detalle" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_detalle = !dialogo_detalle">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <h4>OBSERVACION: <span class="red--text">{{ observacion }}</span></h4>
                <v-simple-table dark fixed-header height="300px" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Und.
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Tot.
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in lista_productos" :key="item.id">
                                <td>{{ item.nombre }}</td>
                                <td width="100">{{ item.cantidad }}</td>
                                <td width="100">S/.{{ item.precioedita }}</td>
                                <td width="100">S/.{{ redondear(item.cantidad * item.precio) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogo_elimina" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_elimina = !dialogo_elimina">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text class="text--center">
                    <h2>SEGURO QUE DESEA GENERAR ELIMINAR PROFORMA</h2>
                </v-card-text>
                <v-card-actions>
                    <v-row dense>
                        <v-col cols="6">
                            <v-btn color="success" small block @click="elminar_ahora()">SI</v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="error" small block @click="dialogo_elimina = false">NO</v-btn>
                        </v-col>
                    </v-row>
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
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_emite" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_emite = !dialogo_emite">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="6">
                        <v-card @click.prevent="doc('FACTURA')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">FACTURA/BOLETA</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="doc('GUIA')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">GUIA REM</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <proforma v-if="dial_proforma" @cierra="dial_proforma = false" :data="data_proforma" />
    </div>
</template>

<script>
import {
    allProformas,
    eliminaProformas
} from '../../db'
import moment from 'moment'
import store from '@/store/index'
import proforma from '@/components/dialogos/dialogo_proforma'
import {
    generaproforma
} from '../../pdf_proforma'
export default {
    components: {
        proforma
    },
    data: () => ({
        dial_proforma: false,
        dialogo_emite: false,
        date1: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        desserts: [],
        dialogo_detalle: false,
        dialogo_elimina: false,
        dialogo_imprime: false,
        lista_productos: [],
        observacion: '',
        selecto: [],
        item_selecto: [],
        data_proforma: []
    }),
    mounted() {
        allProformas().orderByChild('fecha_emision').startAt(moment(String(this.date1)) / 1000).endAt(moment(String(this.date1)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
    },
    beforeDestroy() {
        allProformas().orderByChild('fecha_emision').startAt(moment(String(this.date1)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            allProformas().orderByChild('fecha_emision').startAt(moment(String(this.date1)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
            return this.desserts.reverse()
        }
    },
    created() {
        this.inicio()
    },
    methods: {
        editar(data) {
            if (confirm('seguro de querer editar?')) {
                this.item_selecto = data
                this.data_proforma = data
                this.dial_proforma = true
            }
        },
        doc(data) {
            store.commit("emision", this.selecto)
            if (data == 'FACTURA') {
                this.$router.push({
                    name: 'caja2'
                })
            } else {
                store.commit("array_guia", this.selecto)

                this.$router.push({
                    name: 'gr_remitente'
                })
            }
        },
        emite(data) {
            this.selecto = data
            this.dialogo_emite = true
        },
        inicio() {
            var dia = moment(String(new Date)).format('DD')
            this.date1 = moment().subtract(parseFloat(dia) - 1, 'd').format('YYYY-MM-DD')
            this.date2 = moment(String(new Date)).format('YYYY-MM-DD')
        },
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                array.push(data);
            });
            this.desserts = array;
        },
        abre_visualizacion(data) {
            this.observacion = data.observacion
            this.lista_productos = data.data
            this.dialogo_detalle = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        verPDF(medida) {
            generaproforma(this.selecto, medida)
        },
        imprime(item) {
            this.selecto = item
            this.dialogo_imprime = true
        },
        elminar(item) {
            this.selecto = item
            this.dialogo_elimina = true
        },
        elminar_ahora() {
            console.log(this.selecto)
            eliminaProformas(this.selecto.id)
            this.dialogo_elimina = false
        }

    }
}
</script>
