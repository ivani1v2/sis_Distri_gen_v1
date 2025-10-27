<template>
    <v-dialog v-model="dialog" max-width="600">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierre()">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card class="pa-6">
            <v-simple-table fixed-header height="400px" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Ruc
                            </th>
                            <th class="text-left">
                                Razon Social
                            </th>
                            <th class="text-left">
                                Registro MTC
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in lista" :key="item.id" @click="selcciona(item)">
                            <td>{{ item.ruc }}</td>
                            <td>{{ item.razon_transporte }}</td>
                            <td>{{ item.registro_mtc }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>
    </v-dialog>
</template>

<script>
import {
    alltransporte,
} from '../../db'
export default {

    data() {
        return {
            dialog: false,
            lista: []
        }
    },

    async created() {
        var array = []
        var snap = await alltransporte().once('value')
        snap.forEach((item) => {
            let data = item.val();
            array.push(data);
        });
        this.lista = array
        this.dialog = true
    },

    methods: {
        selcciona(item) {
            this.$emit('agrega_lista', item)
        },
        cierre() {
            this.$emit('cierre', false)
        }

    }

}
/*
 */
</script>
