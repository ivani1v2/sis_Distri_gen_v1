<template>
   <v-dialog v-model="dial" class="mx-auto" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large @click="cierre()" color="red">mdi-close</v-icon>
                <v-spacer></v-spacer>

            </v-system-bar>
        </div>
    <v-card outlined class="rounded-lg">
        <v-card-title class="font-weight-bold">
            ⚙️ Configuración de pedidos
        </v-card-title>

        <v-divider />

        <v-card-text class="mt-6">
            <v-text-field v-model.number="pedidoMinimo" label="Monto mínimo de pedido" prefix="S/ " type="number"
                outlined dense min="0" hint="El pedido no podrá registrarse si no supera este monto" persistent-hint />
        </v-card-text>

        <v-card-actions>
            <v-spacer />
            <v-btn color="primary" :loading="guardando" @click="guardar">
                Guardar cambios
            </v-btn>
        </v-card-actions>
    </v-card>
   </v-dialog>
</template>

<script>
import firebase from "firebase/app"
import "firebase/database"
import store from "@/store"

export default {
    name: "ConfiguracionPedido",

    data() {
        return {
            dial:false,
            pedidoMinimo: 0,
            guardando: false,
        }
    },
    created(){
        this.dial = true
    },
    mounted() {
        this.cargarConfiguracion()
    },

    methods: {
        refConfig() {
            return firebase
                .database()
                .ref(store.state.baseDatos.bd)
                .child("tienda")
                .child("configuracion")
        },

        async cargarConfiguracion() {
            const snap = await this.refConfig().once("value")
            const data = snap.val() || {}
            this.pedidoMinimo = data.pedido_minimo || 0
        },

        async guardar() {
            try {
                this.guardando = true
                        store.commit("dialogoprogress")
                await this.refConfig().update({
                    pedido_minimo: Number(this.pedidoMinimo) || 0,
                    updatedAt: Date.now(),
                })
                     store.commit("dialogoprogress")
                     this.cierre()
            } catch (e) {
                console.error("Error guardando configuración", e)
            } finally {
                this.guardando = false
            }
        },
        cierre(){
            this.$emit("cerrar")
            this.dial = false

        }
    },
}
</script>
