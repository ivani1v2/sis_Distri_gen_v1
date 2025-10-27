<template>
    <div class="pa-3 mb-6">
        <v-dialog persistent v-model="dialogoprogress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>
        <v-card>
            <v-card-title>
                <v-row class="mx-auto text-center">
                    <v-col cols="6" xs="6">
                        <v-text-field outlined dense type="date" v-model="date" label="Inicio"></v-text-field>
                    </v-col>

                    <v-col cols="6" xs="6">
                        <v-text-field outlined dense type="date" v-model="date2" label="Fin"></v-text-field>
                    </v-col>

                </v-row>
            </v-card-title>

            <v-simple-table fixed-header height="70vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Correlativo
                            </th>
                            <th class="text-left">
                                Fecha
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
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td>{{ item.tipo_comprobante }}{{ item.correlativo }}</td>
                            <td>{{ conviertefecha(item.fecha) }}</td>
                            <td width="50">
                                <v-icon @click="consultaApisunat(item)" :color="item.colorEstado">mdi-circle</v-icon>
                            </td>
                            <td width="50">
                                <v-icon color="green"
                                    @click.prevent="ejecutaConsolida(item), dialog = true">mdi-eye</v-icon>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>
        <v-dialog v-model="dialog" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-title primary-title>
                    DOCUMENTOS ANULADOS:
                </v-card-title>
                <v-card-text v-for="item in arrayConsolidar" :key="item.item">
                    {{ item.serie }} - {{ item.correlativo }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import {
    allCabeceraRA,
    consultaDetalleRA
} from '../../db'
import {
    consultasunatTicket
} from '../../servidorsunat'
import moment from 'moment'

export default {

    data: () => ({
        dialogoprogress: false,
        dialog: false,
        ordenresumen: '',
        desserts: [],
        arrayConsolidar: [],
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
    }),
    mounted() {
        allCabeceraRA().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
    },
    destroyed() {
        allCabeceraRA().off("value");
    },
    computed: {
        listafiltrada() {
            allCabeceraRA().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
            return this.desserts
        }
    },
    methods: {
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                if (data.estado == 'aprobado' || data.estado == 'ACEPTADO') {
                    var color = '#46FF00'
                }
                if (data.estado == 'PENDIENTE' || data.estado == 'pendiente') {
                    var color = '#FFB200'
                }
                array.push({
                    fecha: data.fecha,
                    tipo_comprobante: data.tipo_comprobante,
                    fecha_referencia: data.fecha_referencia,
                    fecha_envio: data.fecha_envio,
                    serie: data.serie,
                    correlativo: data.correlativo,
                    estado: data.estado,
                    mensajeSunat: data.mensajeSunat,
                    ticket: data.ticket,
                    colorEstado: color
                });
            });

            this.desserts = array;
        },
        router(view) {
            this.$router.push({
                name: view
            })
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        ejecutaConsolida(value) {
            this.cargaData(value)
        },

        cargaData(value) {
            console.log(value)
            this.arrayConsolidar = []
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].correlativo == value.correlativo) {
                    consultaDetalleRA(value.tipo_comprobante + this.desserts[i].correlativo).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            this.arrayConsolidar.push(item.val())
                        })

                    })
                }
            }
            console.log(this.arrayConsolidar)
        },
        consultaApisunat(item) {
            console.log(item.ticket)
            consultasunatTicket(item.ticket).then((r) => {
                console.log(r)
            })
        }
    }
}
</script>

<style></style>
