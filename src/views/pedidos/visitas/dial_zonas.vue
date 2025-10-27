<template>
    <v-dialog v-model="dial" max-width="850px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="green" @click="nuevo()">mdi-plus</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-3">

            <v-simple-table dark fixed-header height="70vh" dense>
                <template v-slot:default>

                    <thead>
                        <tr>
                            <th class="text-left">
                                Nombre
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr v-for="item in array_tabla" :key="item.id" @click="selecciona(item)">
                            <td>{{ item.nombre }}</td>
                            <td width="10">
                                <div class="d-flex pa-1">
                                    <v-icon color="green" medium @click="editar(item)">mdi-pencil</v-icon>
                                    <v-icon color="red" medium @click="eliminar(item)">mdi-delete</v-icon>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <v-card-text>

                    </v-card-text>

                </template>
            </v-simple-table>

        </v-card>

        <v-dialog v-model="dialogo_agrega" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_agrega = !dialogo_agrega">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <div>
                    <v-textarea dense outlined v-model="nombre" auto-grow filled label="Descripcion"
                        rows="1"></v-textarea>
                </div>

                <v-card-actions>
                    <v-btn color="success" block @click="agregar()">GRABA</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import {
    agrega_tabla,
    busca_tabla
} from '../../db'
import store from '@/store/index'
export default {
    name: 'caja',

    data() {
        return {
            dial: false,
            dialogo_agrega: false,
            nombre: '',
            array_tabla: [],
            edit: false
        }
    },
    created() {
        this.dial = true
    },

    mounted() {
        busca_tabla('zona').on("value", this.onDataChange);
    },
    beforeDestroy() {
        busca_tabla('zona').off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            busca_tabla('zona').on("value", this.onDataChange);
            return this.array_tabla
        }
    },

    methods: {
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                array.push(data);
            });
            this.array_tabla = array;
        },
        nuevo() {
            this.nombre = ''
            this.edit = false
            this.dialogo_agrega = true
        },
        agregar() {
            store.commit("dialogoprogress")
            if (this.edit) {
                var i = this.array_tabla.findIndex(array => array.nombre === this.nombre)
                this.array_tabla[i].nombre = this.nombre.toUpperCase()
                this.edit = false
            } else {
                this.array_tabla.push({
                    nombre: this.nombre.toUpperCase()
                })
            }
            agrega_tabla("zona", this.array_tabla).then(() => {
                store.commit("dialogoprogress")
                this.dialogo_agrega = false
            })

        },
        editar(date) {
            this.edit = true
            this.nombre = date.nombre
            this.dialogo_agrega = true
        },
        eliminar(item) {
            store.commit("dialogoprogress")
            var i = this.array_tabla.findIndex(array => array.nombre === item.nombre)
            this.array_tabla.splice(i, 1)
            agrega_tabla("zona", this.array_tabla).then(() => {
                store.commit("dialogoprogress")
                this.dialogo_agrega = false
            })
        },
        selecciona(item) {
            this.$emit('selecciona', item.nombre)
        },
        cierra() {
            this.$emit('cierra', false)
        }
    },

}
</script>
