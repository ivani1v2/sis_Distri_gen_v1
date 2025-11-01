<template>
      <v-dialog v-model="dial_rechazo" max-width="650">
            <v-card>
                <v-card-title class="headline">Rechazo de Pedido</v-card-title>
                <v-card-text>
                    <v-textarea v-model="motivo_rechazo" label="Motivo de Rechazo" rows="3" outlined></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="cerrar_dialogo()">Cancelar</v-btn>
                    <v-btn color="blue darken-1" text @click="rechazar_pedido()">Aceptar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        </template>
<script>
import {  grabaCabecera_p } from "../../../db";
export default {
    name: 'rechaza_pedido',
    props: {

        item_selecto: null,
    },
    data() {
        return {
            dial_rechazo: false,
            motivo_rechazo: '',
        };
    },
    created() {
        this.dial_rechazo = true;
    },
    methods: {
        async rechazar_pedido() {
            if (!confirm(`¿Confirma el rechazo del pedido N° ${this.item_selecto.id}?`)) {
                return;
            }
            this.$store.commit("dialogoprogress");
            await Promise.all([
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/estado_entrega`, 'rechazado'),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/observacion_entrega`, this.motivo_rechazo)
            ]);

            this.$store.commit("dialogoprogress");
            this.motivo_rechazo = '';
            this.$emit('guardado',{ grupo: this.item_selecto.id_grupo });
        },
        cerrar_dialogo() {
            this.$emit('cerrar' );
        },
    },
};
</script>