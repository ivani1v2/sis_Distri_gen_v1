<template>
    <v-dialog v-model="dialog" max-width="600">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierre()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-checkbox class="mb-n3" dense v-model="agrega_vehiculo" label="Guardar Vehiculo"></v-checkbox>
            </v-system-bar>
        </div>
        <v-card class="pa-6">
            <v-btn class="mt-n6" elevation="3" color="info" @click="abre_lista()" x-small>
                <v-icon left>
                    mdi-magnify
                </v-icon>Ver Lista
            </v-btn>
            <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mb-n6' : 'mb-n6'">
                <v-col cols="12" sm="6">
                    <v-text-field autofocus style="font-size:13.5px" outlined dense v-model="placa"
                        label="Placa vehiculo" :rules="inputRules" append-icon="mdi-magnify"
                        @click:append="abre_lista()"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field style="font-size:13.5px" outlined dense v-model="num_habilitacion"
                        label="N° Habilitacion Vehicular" :rules="numHabilitacionRules"></v-text-field>
                </v-col>
                <h5 class="mt-n2 mb-6">Datos de la autorización especial para el traslado de la carga</h5>
                <v-col cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'">
                    <v-autocomplete outlined dense label="Emisor de Autorizacion" auto-select-first
                        v-model="emisor_autori" :items="$store.state.emisores"></v-autocomplete>
                </v-col>
                <v-col cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'">
                    <v-text-field style="font-size:13.5px" outlined dense v-model="autorizacion"
                        label="N° de Autorizacion"></v-text-field>
                </v-col>
            </v-row>
            <v-card-actions class="mb-n6">
                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="graba()">
                    Agregar
                </v-btn>
            </v-card-actions>
        </v-card>
        <v-dialog v-model="dialog_lista" max-width="450">
            <v-card class="pa-3">
                <v-simple-table fixed-header height="400px" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Placa
                                </th>
                                <th class="text-left">
                                    Habilitacion
                                </th>
                                <th class="text-left">
                                    ACCION
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in lista_vehiculos" :key="item.id">
                                <td @click="selcciona(item)">{{ item.placa }}</td>
                                <td @click="selcciona(item)">{{ item.num_habilitacion }}</td>
                                <td> <v-icon color="red" @click="eliminar(item)" small>mdi-close</v-icon></td>

                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import {
    allvechiulos,
    nuevo_vehiculo,
    elimina_vehiculo
} from '../../db'
import moment from 'moment'
import store from '@/store/index'
export default {

    data() {
        return {
            dialog: false,
            dialog_lista: false,
            agrega_vehiculo: true,
            placa: '',
            num_habilitacion: '',
            autorizacion: '',
            emisor_autori: '',
            lista_vehiculos: [],
            inputRules: [
                (value) => /^[0-9|A-Z|a-z]*$/g.test(value) || '(Solo números y letras no espacios)',
            ],
            numHabilitacionRules: [
                (value) => /^[0-9|A-Z|a-z]*$/g.test(value) || '(Solo números y letras)',
                (value) => value.length >= 10 && value.length <= 15 || 'N° de Habilitación debe tener entre 10 y 15 caracteres',
            ]
        }
    },

    created() {
        this.dialog = true
    },
    computed: {

    },
    methods: {
        async abre_lista() {
            var array = []
            store.commit("dialogoprogress")
            var snap = await allvechiulos().once('value')
            snap.forEach((item) => {
                let data = item.val();
                data.key = item.key
                array.push(data);
            });
            this.lista_vehiculos = array
            store.commit("dialogoprogress")
            this.dialog_lista = true
        },
        selcciona(item) {
            this.agrega_vehiculo = false
            this.placa = item.placa
            this.num_habilitacion = item.num_habilitacion.trim()
            this.autorizacion = item.autorizacion.trim()
            this.emisor_autori = item.emisor_autori.trim()
            this.dialog_lista = false
        },
        async eliminar(data) {
            if (confirm('seguro de eliminar')) {
                await elimina_vehiculo(data.key)
                this.abre_lista()
            }
        },
        async graba() {
            if (this.placa.length != 6 || this.placa.includes('-')) {
                alert('Placa Invalida')
                return
            }
            var array = {
                placa: this.placa.toUpperCase(),
                num_habilitacion: this.num_habilitacion.trim(),
                autorizacion: this.autorizacion.trim(),
                emisor_autori: this.emisor_autori.trim()
            }
            var find = this.lista_vehiculos.find(item => item.placa == this.placa)
            if (this.agrega_vehiculo && find == undefined) {
                store.commit("dialogoprogress")
                await nuevo_vehiculo(array)
                store.commit("dialogoprogress")
            }
            this.$emit('agrega_lista', array)
        },
        cierre() {
            this.$emit('cierre', false)
        }

    }

}
/*
 */
</script>
