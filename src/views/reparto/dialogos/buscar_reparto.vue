<template>
    <v-dialog v-model="dial_repartos" max-width="650">
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="dial_repartos = false">mdi-close</v-icon>
                <v-spacer></v-spacer>

            </v-system-bar>
        </div>

        <v-card class="pa-1">
            <v-card class="mb-2 pa-2">
                <v-row dense>
                    <v-col cols="6">
                        <v-text-field outlined dense type="date" label="Hasta" v-model="date1" />
                    </v-col>
                    <v-col cols="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-text-field outlined dense type="date" label="Hasta" v-model="date2" />
                            </v-flex>

                        </v-layout>

                    </v-col>
                    <v-col cols="12" class="text-center mt-n6">
                        <v-btn small color="success" class="" @click="filtrar">
                            filtrar
                            <v-icon>mdi-filter</v-icon>
                        </v-btn>
                    </v-col>

                </v-row>
            </v-card>
            <v-card>
                <v-simple-table fixed-header height="65vh">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Fecha</th>
                            <th>N°Pedidos</th>
                            <th>Total S/.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pedido in repartosarray" :key="pedido.id" @click="selec_reparto(pedido)">
                            <td style="font-size:75%;">{{ pedido.id }}</td>
                            <td style="font-size:75%;">{{ pedido.fecha }}</td>
                            <td style="font-size:75%;">{{ pedido.resumen.total_pedidos }}</td>
                            <td style="font-size:75%;">S/.{{ pedido.resumen.total_general }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-card>
    </v-dialog>
</template>
<script>
import { all_cabecera_reparto } from "../../../db";
import moment from "moment";
export default {
    name: 'rechaza_pedido',
    props: {

        item_selecto: null,
    },
    data() {
        return {
            dial_repartos: false,
            motivo_rechazo: '',
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            repartosarray: [],
        };
    },
    created() {
        this.dial_repartos = true;
    },
    methods: {

        async filtrar() {
            // normaliza rango
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            const start = d1.startOf("day").unix();
            const end = d2.endOf("day").unix();

            var snap = await all_cabecera_reparto()
                .orderByChild("fecha_emision")
                .startAt(start)
                .endAt(end)
                .once("value");
            var data = snap.val() || {};
            this.repartosarray = Object.keys(data).map((key) => {

                data[key].id = key;
                data[key].fecha = this.formatFecha(data[key].fecha_emision, 'DD/MM');
                return data[key];
            });

        },

        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },
        selec_reparto(item) {
            this.$emit('seleccionado', item);
        },

        cerrar_dialogo() {
            this.$emit('cerrar');
        },
    },
};
</script>