<template>
<div>
    <div>
        <v-system-bar window dark>
            <v-icon @click="cierra()">mdi-close</v-icon>
            <v-spacer></v-spacer>
        </v-system-bar>
    </div>
    <v-card>

        <v-card-title>
            <v-spacer></v-spacer>
            <v-text-field class="mb-n1 mt-n2" outlined dense v-model="buscar" append-icon="mdi-magnify" label="Buscar" single-line hide-details autofocus></v-text-field>
        </v-card-title>

        <v-data-table dense fixed-header height="65vh" :headers="headers" :items="listafiltrada" :search="buscar" v-model="selectedRows" item-key="id" :page.sync="page" :items-per-page="10">
            <template v-slot:item="{ item }">
                <tr :class="selectedRows.indexOf(item.id)>-1?'cyan':''" @click="rowClicked(item)">
                    <td>{{ item.nombre }}</td>
                    <td>{{ item.categoria }}</td>
                    <td>{{ item.stock }}</td>
                    <td>S/.{{ item.precio }}</td>
                </tr>
            </template>
        </v-data-table>

    </v-card>
</div>
</template>

<script>
import store from '@/store/index'
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
            headers: [{
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
            ],
            fila_selecta: 0,
            page: 1,
            cantidad: 1,
            selecto: '',
        }
    },
    created() {

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
        rowClicked(row) {
            this.agregaCatalogo(row)
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
        agregaCatalogo(item) {
            this.buscar = ''
            var cant = parseFloat(this.cantidad)
            item.cantidad = cant
            this.dialo_cantidad = false
            this.$emit('array', item)
            this.cierra()
        },
        cierra(){
            this.$emit('cierra', false) 
        }

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
