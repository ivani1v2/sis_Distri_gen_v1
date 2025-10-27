<template>
    <v-dialog v-model="dialog" max-width="600">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierre()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-checkbox class="mb-n3" dense v-model="agrega_conductor" label="Guardar Conductor"></v-checkbox>
            </v-system-bar>
        </div>
        <v-card class="pa-6">
            <v-btn class="mt-n6" elevation="3" color="info" @click="abre_lista()" x-small>
                <v-icon left>
                    mdi-magnify
                </v-icon>Ver Lista
            </v-btn>
            <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mb-n6' : 'mb-n6'">

                <v-col cols="12" sm="3">
                    <v-select style="font-size:13.5px" outlined dense v-model="tipo_doc_c" :items="documentos"
                        menu-props="auto" hide-details label="Tipo Doc"></v-select>
                </v-col>
                <v-col cols="12" sm="9" :class="$vuetify.breakpoint.smAndDown ? 'mt-1' : ''">
                    <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="num_doc_conductor"
                        label="N° Doc" append-icon="mdi-magnify" @click:append="busca_conductor()"
                        @keyup.enter="busca_conductor()"></v-text-field>
                </v-col>
                <v-col cols="12" sm="7" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field style="font-size:13.5px" outlined dense v-model="nom_conductor"
                        label="Nombre Completo"></v-text-field>
                </v-col>
                <v-col cols="12" sm="5" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field :rules="inputRules" style="font-size:13.5px" outlined dense v-model="num_licencia"
                        label="#Licencia"></v-text-field>
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
                                    Conductor
                                </th>
                                <th class="text-left">
                                    Documento
                                </th>
                                <th class="text-left">
                                    Licencia
                                </th>
                                <th class="text-left">
                                    Accion
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in lista_chofer" :key="item.id">
                                <td @click="selcciona(item)">{{ item.num_doc_conductor }}</td>
                                <td @click="selcciona(item)">{{ item.nom_conductor }}</td>
                                <td @click="selcciona(item)">{{ item.num_licencia }}</td>
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
    allchofer,
    nuevo_chofer,
    elimina_chofer
} from '../../db'
import axios from "axios"
import store from '@/store/index'
export default {

    data() {
        return {
            dialog: false,
            dialog_lista: false,
            agrega_conductor: true,
            lista_chofer: [],
            documentos: [
                'DNI',
                'RUC',
                'Pasaporte',
                'Carnet de Extranjeria'
            ],
            num_licencia: '',
            tipo_doc_c: 'DNI',
            num_doc_conductor: '',
            nom_conductor: '',
            inputRules: [
                (value) => /^[0-9|A-Z|a-z]*$/g.test(value) || '(Solo números y letras)',
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
            var snap = await allchofer().once('value')
            snap.forEach((item) => {
                let data = item.val();
                data.key = item.key
                array.push(data);
            });
            this.lista_chofer = array
            store.commit("dialogoprogress")
            this.dialog_lista = true
        },
        selcciona(item) {
            this.agrega_conductor = false
            this.num_licencia = item.num_licencia
            this.tipo_doc_c = item.tipo_doc_c
            this.num_doc_conductor = item.num_doc_conductor
            this.nom_conductor = item.nom_conductor
            this.dialog_lista = false
        },
        async eliminar(data) {
            if (confirm('seguro de eliminar')) {
                await elimina_chofer(data.key)
                this.abre_lista()
            }
        },
        async graba() {
            if (this.tipo_doc_c == "DNI") {
                var doccliente = "1" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.tipo_doc_c == "RUC") {
                var doccliente = "6" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.tipo_doc_c == "Pasaporte") {
                var doccliente = "7" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (this.tipo_doc_c == "Carnet de Extranjeria") {
                var doccliente = "4" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            var array = {
                cod_doc: doccliente,
                num_licencia: this.num_licencia,
                tipo_doc_c: this.tipo_doc_c,
                num_doc_conductor: this.num_doc_conductor,
                nom_conductor: this.nom_conductor
            }
            var find = this.lista_chofer.find(item => item.num_doc_conductor == this.num_doc_conductor)
            if (this.agrega_conductor && find == undefined) {
                store.commit("dialogoprogress")
                await nuevo_chofer(array)
                store.commit("dialogoprogress")
            }
            this.$emit('agrega_lista', array)
        },
        cierre() {
            this.$emit('cierre', false)
        },
        async busca_conductor() {
            if (this.num_doc_conductor == '') {
                this.abre_lista()
                return
            }
            if (this.num_doc_conductor.length == 8) {
                store.commit("dialogoprogress")
                this.tipo_doc_c = 'DNI'
                var data = await this.consultaApiPeru(this.tipo_doc_c, this.num_doc_conductor)
                if (Boolean(data)) {
                    console.log(data)
                    if (this.tipo_doc_c == 'DNI') {
                        this.nom_conductor = data.nombre_completo
                    }
                    store.commit("dialogoprogress")
                } else {
                    alert('No existe Data')
                    store.commit("dialogoprogress")
                }
            }
        },
        async consultaApiPeru(tipo, doc) {
            var self = this
            var token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            var resp = await axios
                .get('https://apiperu.dev/api/' + tipo.toLowerCase() + '/' + doc, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data

                ))
            return resp.data
        },

    }

}
/*
 */
</script>
