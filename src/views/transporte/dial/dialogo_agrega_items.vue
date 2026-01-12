<template>
    <v-dialog v-model="dial" max-width="760" persistent>

        <div>
            <v-system-bar window dark>
                <v-icon @click="cerrar">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn class="mt-n1 ml-3" elevation="3" color="info" @click="dial_recom = !dial_recom" x-small>
                    <v-icon left>
                        mdi-magnify
                    </v-icon>Ver Lista
                </v-btn>
                <v-spacer></v-spacer>
                <v-icon color="green" large @click="guada_item()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-6">
            <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mb-n6' : 'mb-n6'">
                <v-col cols="12" sm="4">
                    <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="cantidad"
                        label="Cantidad"></v-text-field>
                </v-col>
                <v-col cols="12" sm="3">
                    <v-select outlined dense v-model="medida" :items="$store.state.medidas" menu-props="auto"
                        hide-details label="Medida"></v-select>
                </v-col>
                <v-col cols="12" sm="5" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field style="font-size:13.5px" outlined dense v-model="cod_producto"
                        label="Codigo"></v-text-field>
                </v-col>
                <v-col cols="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'">
                    <v-textarea style="font-size:13.5px" outlined dense v-model="descripcion" auto-grow filled
                        label="Descripcion" rows="1"></v-textarea>
                </v-col>

            </v-row>

        </v-card>
        <v-dialog v-model="dial_recom" max-width="600" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_recom = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-6">
                <v-simple-table fixed-header height="400px" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    cantidad
                                </th>
                                <th class="text-left">
                                    Medida
                                </th>
                                <th class="text-left">
                                    codigo
                                </th>
                                <th class="text-left">
                                    Descripcion
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in lista_items" :key="item.id" @click="selcciona(item)">
                                <td>{{ item.cantidad }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.codigo }}</td>
                                <td>{{ item.descripcion }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import store from '@/store/index'
import {
    all_tablas_transporte,
    nuevo_tablas_transporte
} from '../../../db'
export default {
    name: 'dial_agrega',
    props: {

    },
    data() {
        return {
            dial_recom: false,
            dial: this.value,                 // estado interno del diálogo
            cantidad: '',
            medida: 'TONELADA',
            cod_producto: '',
            descripcion: '',
            lista_items: [],
            item_selecto: []
        };
    },
    async created() {
        var array = []
        var snap = await all_tablas_transporte('items').once('value')
        snap.forEach((item) => {
            let data = item.val();
            array.push(data);
        });
        this.lista_items = array
        this.dial = true
    },


    methods: {
        async guada_item() {
            if (this.cantidad == '' || this.cantidad == 0 || this.descripcion == '') {
                alert('faltan Datos')
                return
            }
            var array = {
                uuid: this.create_UUID(),
                cantidad: this.cantidad,
                medida: this.obtencodigomedida(this.medida),
                des_medida: this.medida,
                cod_producto: this.cod_producto,
                descripcion: this.descripcion
            }
            console.log(array)
            if (this.item_selecto == '') {
                await nuevo_tablas_transporte('items', array.uuid, array)
            }
            this.$emit("agrega_item", array)
        },
        cerrar() {
            this.$emit('cierre', true);         // notifica al padre
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid.substring(29);
        },
        obtencodigomedida(medida) {
            var array = store.state.medidassunat.find(item => item.nombre == medida)
            return array.corto
        },
        selcciona(data) {
            this.item_selecto = data
            this.cantidad = data.cantidad
            this.medida = data.des_medida
            this.cod_producto = data.cod_producto
            this.descripcion = data.descripcion
            this.dial_recom = false
        },
    }
};
</script>
