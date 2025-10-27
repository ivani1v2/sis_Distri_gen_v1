<template>
    <v-dialog v-model="$store.state.dialogoproductosv2" max-width="950px" persistent
        @keydown.esc="$store.commit('dialogoproductosv2', false)">
        <div>
            <v-system-bar window dark>
                <v-icon @click="$store.commit('dialogoproductosv2', false)">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card>

            <v-card-title>
                <v-spacer></v-spacer>
                <v-text-field class="mb-n1 mt-n2" outlined dense v-model="buscar" append-icon="mdi-magnify" label="Buscar"
                    single-line hide-details autofocus></v-text-field>
            </v-card-title>

            <v-data-table dense fixed-header height="65vh" :headers="headers" :items="listafiltrada" v-model="selectedRows"
                item-key="id" :page.sync="page" :items-per-page="10">
                <template v-slot:item="{ item }">
                    <tr :class="selectedRows.indexOf(item.id) > -1 ? 'cyan' : ''" @click="rowClicked(item)">
                        <td style="font-family:verdana;font-size:80%;">{{ item.id }}</td>
                        <td style="font-family:verdana;font-size:75%;"
                            v-if="$store.state.configuracion.muestra_ubicaciones">{{ item.ubicacion }}</td>
                        <td style="font-family:verdana;font-size:75%;">{{ item.nombre }}</td>
                        <td style="font-family:verdana;font-size:75%;">{{ item.categoria }}</td>
                        <td style="font-family:verdana;font-size:75%;">{{ item.stock }}</td>
                        <td style="font-family:verdana;font-size:75%;">S/.{{ item.precio }}</td>
                    </tr>
                </template>
            </v-data-table>

        </v-card>
        <v-dialog v-model="dialo_cantidad" max-width="200px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = !dialo_cantidad">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card>

                <v-card-title>
                    <v-text-field type="number" autofocus outlined dense v-model="cantidad" label="CANTIDAD"
                        @focus="$event.target.select()" @keydown.enter="agregaCatalogo()"></v-text-field>
                </v-card-title>

                <v-btn class="mt-n6" color="red" @click="agregaCatalogo()" block>OK</v-btn>

            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import store from '@/store/index'
import {
    buscaPresentacion
} from '../../db'
export default {

    data() {
        return {
            arrayiconos: [],
            selectedRows: [],
            tamañoarray: 0,
            categoriaselecta: '',
            activaproductos: false,
            buscar: '',
            dialo_cantidad: false,
            item_selecto: '',
            headers: '',
            fila_selecta: 0,
            page: 1,
            cantidad: 1,
            selecto: '',
        }
    },
    created() {
        this.inicio()
    },
    mounted() {
        let self = this;
        window.addEventListener('keydown', function (event) {
            if (store.state.dialogoproductosv2) {
                if (!self.dialo_cantidad) {
                    if (event.keyCode === 40) { // "abajo"
                        var pos_fin = (10 * self.page) - 1
                        var pos_ini = (10 * self.page) - 10
                        if (self.fila_selecta < pos_fin) {
                            self.toggleSelection(self.posicion(+1).id)
                        }
                        if (self.fila_selecta > pos_fin) {
                            self.fila_selecta = pos_ini
                            self.toggleSelection(self.posicion(0).id)
                        }
                        if (self.fila_selecta < pos_ini) {
                            self.fila_selecta = pos_ini
                            self.toggleSelection(self.posicion(0).id)
                        }
                    }
                    if (event.keyCode === 38) { // "arriba"
                        var pos_ini = (10 * self.page) - 10
                        if (self.fila_selecta > pos_ini) {
                            self.toggleSelection(self.posicion(-1).id)
                        }
                    }
                    if (event.keyCode === 37) { // "izquierda"
                        if (self.page > 1) {
                            self.page--
                            self.toggleSelection(self.posicion(-10).id)
                        }
                        if (self.page == 1) {
                            self.fila_selecta = 0
                            self.toggleSelection(self.posicion(0).id)
                        }
                    }
                    if (event.keyCode === 39) { // "derecha"
                        var pag = self.listafiltrada.length / 10
                        var pos = (10 * self.page) - self.fila_selecta
                        if (self.listafiltrada.length > 10 && self.page < pag) {
                            self.page++
                            if (pos != 0) {
                                self.toggleSelection(self.posicion(+pos).id)
                            } else {
                                self.toggleSelection(self.posicion(+10).id)
                            }
                        }
                    }
                    if (event.keyCode === 13) { // "enter"
                        self.abre_cantidad(self.posicion(0))
                    }
                } else {

                }
            }
        });

    },

    methods: {
        inicio() {
            if (store.state.configuracion.muestra_ubicaciones) {
                this.headers = [{
                    text: 'codigo',
                    value: 'id'
                },
                {
                    text: 'Ubi.',
                    value: 'ubicacion'
                },
                {
                    text: 'nombre',
                    value: 'nombre'
                },
                {
                    text: 'categoria',
                    value: 'categoria'
                },
                {
                    text: 'Stock',
                    value: 'stock'
                },
                {
                    text: 'P.Unit.',
                    value: 'precio'
                },
                ]
            } else {
                this.headers = [{
                    text: 'codigo',
                    value: 'id'
                }, {
                    text: 'nombre',
                    value: 'nombre'
                },
                {
                    text: 'categoria',
                    value: 'categoria'
                },
                {
                    text: 'Stock',
                    value: 'stock'
                },
                {
                    text: 'P.Unit.',
                    value: 'precio'
                },
                ]
            }

        },
        rowClicked(row) {
            if (row.controstock) {
                if (row.stock <= 0) {
                    alert('Producto sin Stock')
                    return
                }
            }
            //this.agregaCatalogo(row)
            this.abre_cantidad(row)
            this.busca_pos(row)
            this.toggleSelection(row.id)
        },
        busca_pos(data) {
            this.fila_selecta = this.listafiltrada.indexOf(data)
        },
        posicion(val) {
            var suma = 0
            suma = this.fila_selecta + val
            if (suma >= 0 && suma < this.listafiltrada.length) {
                this.fila_selecta = this.fila_selecta + val
            }
            return this.listafiltrada[this.fila_selecta]
        },
        toggleSelection(keyID) {
            this.selectedRows = []
            if (this.selectedRows.includes(keyID)) {
                this.selectedRows = this.selectedRows.filter(
                    selectedKeyID => selectedKeyID !== keyID
                );
            } else {
                this.selectedRows.push(keyID);
            }
        },
        abre_cantidad(item) {
            this.cantidad = 1
            this.selecto = item
            this.dialo_cantidad = true
        },
        agregaCatalogo() {
            var item = this.selecto
            this.buscar = ''
            var cant = parseFloat(this.cantidad)
            if (item.controstock) {
                if (parseFloat(item.stock) < parseFloat(this.cantidad)) {
                    alert('Producto sin Stock')
                    return
                }
            }
            item.cantidad = cant
            this.dialo_cantidad = false
            this.$emit('array', item)
            setTimeout(() =>
                store.commit('dialogoproductosv2', false), 200);

        },

    },
    computed: {
        listafiltrada() {
            var invent = store.state.productos
            return invent.filter((item) =>
                (item.activo) == true)
                .filter((item) => (item.id + item.nombre + item.categoria)
                    .toLowerCase().includes(this.buscar.toLowerCase()))

        }
    }
}
</script>
