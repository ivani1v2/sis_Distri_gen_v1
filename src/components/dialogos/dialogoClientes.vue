<template>
    <v-dialog v-model="dial" max-width="650">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card>
            <v-card-title>
                <v-spacer></v-spacer>
                <v-text-field v-model="busc_cliente" append-icon="mdi-magnify" label="Search" single-line hide-details
                    dense></v-text-field>
            </v-card-title>

            <v-simple-table fixed-header height="55vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Numero
                            </th>
                            <th class="text-left">
                                NOMBRE
                            </th>
                            <th class="text-left">
                                TELEFONO
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltradaclientes" :key="item.id"
                            @click="agregacliente(item), $store.commit('dialogoClientesnuevos')">
                            <td>{{ item.documento }}</td>
                            <td>{{ item.nombre }}</td>
                            <td>{{ item.telefono }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>



    </v-dialog>
</template>

<script>
import store from '@/store/index'

export default {

    data() {
        return {
            dial: false,
            busc_cliente: '',
            clienteslista: []
        }
    },
    created() {
        this.dial = true
    },
    mounted() {
        this.initialize()
    },
    methods: {
        initialize() {
            this.clienteslista = store.state.clientes
        },
        agregacliente(item) {
            this.busc_cliente = ''
            this.$emit('array', item)
        },
        cierra() {
            this.dial = false
            this.busc_cliente = ''
            this.$emit('cierra')
        },
    },
    computed: {
        listafiltradaclientes() {
            return this.clienteslista.filter((item) =>
                (item.documento + item.nombre + item.telefono)
                    .toLowerCase().includes(this.busc_cliente.toLowerCase()))
        },

    }
}
</script>
