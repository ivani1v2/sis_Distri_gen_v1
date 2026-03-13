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
import { all_detalle_p, grabaCabecera_p, nuevo_detalle_entrega, incrementa_procesados_reparto, marcaPedidoComoContabilizado } from "../../../db";

export default {
    name: 'rechaza_pedido',
    props: {
        grupo: null,
        item_selecto: null,
    },
    data() {
        return {
            dial_rechazo: false,
            motivo_rechazo: '',
            array_detalle: []
        };
    },
    async created() {
        await this.busca_detalle();
        this.dial_rechazo = true;
    },
    methods: {
        async busca_detalle() {
            const snap = await all_detalle_p(this.item_selecto.id_grupo || this.grupo, this.item_selecto.id).once("value");
            const raw = snap.val() || [];
            if (Array.isArray(raw)) {
                this.array_detalle = raw.map(x => ({ ...x, uuid: x.uuid || `${x.id}-${Math.random()}` }));
            } else {
                this.array_detalle = Object.keys(raw).map(k => ({ uuid: k, ...raw[k] }));
            }
        },

        async rechazar_pedido() {
            if (!confirm(`¿Confirma el rechazo del pedido N° ${this.item_selecto.id}?`)) {
                return;
            }

            const rechazos = this.array_detalle.map(it => {
                const factor = Number(it.factor || 1);
                return {
                    uuid: it.uuid || it.id,
                    id_producto: it.id,
                    nombre: it.nombre,
                    cantidad: Number(it.cantidad || 0),
                    total_linea: Number(it.total_antes_impuestos || 0) + Number(it.total_impuestos || 0),
                    medida: it.medida || "",
                    precio_unit: Number(it.precio || 0),
                    operacion: it.operacion || "",
                    factor: factor,
                    es_rechazo_parcial: false,
                    cantidad_original: Number(it.cantidad || 0),
                    tipo_rechazo: "Completo"
                };
            });

            const totalRechazado = rechazos.reduce((acc, r) => acc + r.total_linea, 0);

            const data = {
                id_grupo: this.item_selecto.id_grupo || this.grupo,
                id_pedido: this.item_selecto.id,
                rechazos: rechazos,
                rechazos_count: rechazos.length,
                pagos_entrega: [],
                observaciones: this.motivo_rechazo || "Pedido rechazado completo",
                total_pedido: Number(this.item_selecto.total || 0),
                total_rechazado: totalRechazado,
                total_cobrar: 0,
                total_cobrado: 0,
                total_credito: 0,
                estado_entrega: "rechazado"
            };

            const promesas = [
                nuevo_detalle_entrega(this.item_selecto.id_grupo || this.grupo, this.item_selecto.id, data),
                grabaCabecera_p(this.item_selecto.id_grupo || this.grupo, `${this.item_selecto.id}/estado_entrega`, 'rechazado'),
                grabaCabecera_p(this.item_selecto.id_grupo || this.grupo, `${this.item_selecto.id}/observacion_entrega`, this.motivo_rechazo || "Pedido rechazado completo"),
                grabaCabecera_p(this.item_selecto.id_grupo || this.grupo, `${this.item_selecto.id}/rechazos_count`, rechazos.length),
                incrementa_procesados_reparto(this.item_selecto.id_grupo || this.grupo),
                marcaPedidoComoContabilizado(this.item_selecto.id_grupo || this.grupo, this.item_selecto.id)
            ];

            this.$store.commit("dialogoprogress");

            try {
                await Promise.all(promesas);
                this.$store.commit("dialogoprogress");

                this.motivo_rechazo = '';
                this.$emit('guardado', { grupo: this.item_selecto.id_grupo || this.grupo });
                this.$emit('cerrar');

                this.$toast?.success?.("Pedido rechazado correctamente.") || alert("Pedido rechazado correctamente.");

            } catch (error) {
                console.error("Error al rechazar pedido:", error);
                this.$store.commit("dialogoprogress");
                this.$toast?.error?.("No se pudo rechazar el pedido.") || alert("No se pudo rechazar el pedido.");
            }
        },

        cerrar_dialogo() {
            this.$emit('cerrar');
        },
    },
};
</script>