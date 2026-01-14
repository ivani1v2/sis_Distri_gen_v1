<template>
    <v-dialog v-model="$store.state.dialogo_configcatalogo" max-width="480px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="$store.commit('dialogo_configcatalogo')">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="green" @click="graba()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-5">
            <div>

                <v-row dense>
                    <v-col cols="6">
                        <v-checkbox dense v-model="mostrar_codigo" label="Mostrar Codigo"></v-checkbox>
                    </v-col>
                       <v-col cols="6">
                        <v-checkbox dense v-model="precio_minimo" label="Precio minimo"></v-checkbox>
                    </v-col>
                    <v-col cols="12">
                        <v-checkbox dense v-model="desc_porcentaje_catalogo" label="Mostrar descuento % en catálogo"></v-checkbox>
                    </v-col>
                </v-row>
            </div>

        </v-card>

    </v-dialog>
</template>

<script>
import {
    allConfigura,
    grabaConfigura
} from '../../db'
import store from '@/store/index'

export default {
    data() {
        return {
            mostrar_codigo: false,
            precio_minimo: false,
            desc_porcentaje_catalogo: false,
        }
    },
    created() {
        this.inicializar()
    },
    methods: {
        inicializar() {
            allConfigura().once("value").then((snapshot) => {
                if (snapshot.val() != null) {
                    this.mostrar_codigo = snapshot.val().mostrar_codigo || false
                    this.precio_minimo = snapshot.val().precio_minimo || false
                    this.desc_porcentaje_catalogo = snapshot.val().desc_porcentaje_catalogo || false
                }

            })
        },
        async graba() {
            await grabaConfigura("mostrar_codigo", this.mostrar_codigo || false)
            await grabaConfigura("precio_minimo", this.precio_minimo || false)
            await grabaConfigura("desc_porcentaje_catalogo", this.desc_porcentaje_catalogo || false)
            store.commit('dialogo_configcatalogo')
        }
    }
}
</script>
