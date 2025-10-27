<template>
<div>
    <div>
        <v-system-bar window dark>
            <v-icon @click="selecciona('')">mdi-close</v-icon>
            <v-spacer></v-spacer>
            <v-icon large color="green" @click="nuevo()">mdi-plus</v-icon>
        </v-system-bar>
    </div>
    <v-card class="pa-1">
        <v-simple-table dark fixed-header height="70vh" dense>
            <template v-slot:default>
                <thead>
                    <tr>
                        <th class="text-left">
                            Codigo
                        </th>
                        <th class="text-left">
                            Razon Social
                        </th>
                        <th v-if="$store.state.tabla_proveedores" class="text-left">
                            Direccion
                        </th>
                        <th v-if="$store.state.tabla_proveedores" class="text-left">
                            Departamento
                        </th>
                        <th v-if="$store.state.tabla_proveedores" class="text-left">
                            Provincia
                        </th>
                        <th v-if="$store.state.tabla_proveedores" class="text-left">
                            Distrito
                        </th>
                        <th class="text-left">
                            Accion
                        </th>
                    </tr>
                </thead>

                <tbody>

                    <tr v-for="item in array_tabla" :key="item.id" @click="selecciona(item)">
                        <td>{{ item.codigo }}</td>
                        <td>{{ item.rsocial }}</td>
                        <td v-if="$store.state.tabla_proveedores">{{ item.direccion }}</td>
                        <td v-if="$store.state.tabla_proveedores">{{ item.departamento }}</td>
                        <td v-if="$store.state.tabla_proveedores"> {{ item.provincia }}</td>
                        <td v-if="$store.state.tabla_proveedores">{{ item.distrito }}</td>
                        <td width="10">
                            <div class="d-flex pa-1">
                                <v-icon color="green" medium @click="editar(item)">mdi-pencil</v-icon>
                                <v-icon color="red" medium @click="eliminar(item)">mdi-delete</v-icon>
                            </div>
                        </td>
                    </tr>
                </tbody>

            </template>
        </v-simple-table>

    </v-card>

    <v-dialog v-model="dialogo_agrega" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="dialogo_agrega=!dialogo_agrega">mdi-close</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <div>
                <v-text-field outlined type="number" dense v-model="codigo" label="Numero" append-icon="mdi-magnify" @click:append="busca_proveedor()" @keyup.enter="busca_proveedor()"></v-text-field>
                <v-textarea dense outlined v-model="rsocial" auto-grow filled label="Razon Social" rows="1"></v-textarea>
                <v-textarea dense outlined v-model="direccion" auto-grow filled label="Direccion" rows="1"></v-textarea>
                <v-textarea dense outlined v-model="departamento" auto-grow filled label="Departamento" rows="1"></v-textarea>
                <v-textarea dense outlined v-model="provincia" auto-grow filled label="Provincia" rows="1"></v-textarea>
                <v-textarea dense outlined v-model="distrito" auto-grow filled label="Distrito" rows="1"></v-textarea>
            </div>

            <v-card-actions>
                <v-btn color="success" block @click="agregar()">GRABA</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</div>
</template>

<script>
import {
    agrega_tabla,
    busca_tabla
} from '../../db'
import store from '@/store/index'
import axios from "axios"
export default {
    name: 'caja',

    data() {
        return {
            dialogo_agrega: false,
            codigo: '',
            rsocial: '',
            direccion: '',
            departamento: '',
            provincia: '',
            distrito: '',
            array_tabla: [],
            edit: false
        }
    },
    mounted() {
        busca_tabla('proveedores').on("value", this.onDataChange);
    },
    beforeDestroy() {
        busca_tabla('proveedores').off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            busca_tabla('proveedores').on("value", this.onDataChange);
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
            this.codigo = ""
            this.rsocial = ''
            this.direccion = ''
            this.departamento = ""
            this.provincia = ""
            this.distrito = ""
            this.edit = false
            this.dialogo_agrega = true
        },
        agregar() {
            store.commit("dialogoprogress")
            if (this.edit) {
                var i = this.array_tabla.findIndex(array => array.codigo === this.codigo)
                this.array_tabla[i].codigo = this.codigo.trim()
                this.array_tabla[i].rsocial = this.rsocial.toUpperCase()
                this.array_tabla[i].direccion = this.direccion.toUpperCase()
                this.array_tabla[i].departamento = this.departamento
                this.array_tabla[i].provincia = this.provincia
                this.array_tabla[i].distrito = this.distrito
                this.edit = false
            } else {
                this.array_tabla.push({
                    codigo: this.codigo.trim(),
                    rsocial: this.rsocial.toUpperCase(),
                    direccion: this.direccion.toUpperCase(),
                    departamento: this.departamento,
                    provincia: this.provincia,
                    distrito: this.distrito,
                })
            }
            agrega_tabla("proveedores", this.array_tabla).then(() => {
                store.commit("dialogoprogress")
                this.dialogo_agrega = false
            })

        },
        editar(date) {
            this.edit = true
            this.codigo = date.codigo
            this.rsocial = date.rsocial
            this.direccion = date.direccion
            this.departamento = date.departamento
            this.provincia = date.provincia
            this.distrito = date.distrito
            this.dialogo_agrega = true
        },
        eliminar(item) {
            store.commit("dialogoprogress")
            var i = this.array_tabla.findIndex(array => array.codigo === item.codigo)
            this.array_tabla.splice(i, 1)
            agrega_tabla("proveedores", this.array_tabla).then(() => {
                store.commit("dialogoprogress")
                this.dialogo_agrega = false
            })
        },
        selecciona(item) {
            this.$emit('respuesta', item)
        },
        busca_proveedor() {
            store.commit("dialogoprogress")
            if (this.codigo.length == 11) {
                var documento = "RUC"
            } else {
                var documento = "DNI"
            }
            var self = this
            var token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            axios
                .get('https://apiperu.dev/api/' + documento.toLowerCase() + '/' + this.codigo, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data,
                    store.commit("dialogoprogress"),
                    self.llenardatos(response.data.data, documento)
                ))
        },
        llenardatos(data, documento) {
            console.log(data)
            if (data != undefined) {
                if (documento == 'DNI') {
                    this.rsocial = data.nombre_completo
                    this.direccion = data.direccion
                    this.departamento = data.departamento
                    this.provincia = data.provincia
                    this.distrito = data.distrito
                }
                if (documento == 'RUC') {
                    this.rsocial = data.nombre_o_razon_social
                    this.direccion = data.direccion
                    this.departamento = data.departamento
                    this.provincia = data.provincia
                    this.distrito = data.distrito
                }
            } else {
                store.commit('dialogosnackbar', 'Documento no existe')
            }

        },
    },

}
</script>
