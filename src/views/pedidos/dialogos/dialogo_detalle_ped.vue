<template>
    <v-dialog v-model="dial" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                {{ pedidoSeleccionado.id }}
                <v-spacer></v-spacer>
                S/.{{pedidoSeleccionado.total}}
                 <v-spacer></v-spacer>
                <v-icon color="red" large @click="cerrar()">mdi-close</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-2">
            <div v-if="pedidoSeleccionado" class="pa-2">
                <h5 class=""> Cliente: <span>{{ pedidoSeleccionado.doc_numero }} - {{
                    pedidoSeleccionado.cliente_nombre }}</span> </h5>
                <h5 class=""> Direcion: <span>{{ pedidoSeleccionado.cliente_direccion }}</span></h5>
                <h5 class=""> Modo : {{ pedidoSeleccionado.condicion_pago }}</h5>
                <h5 class=""> Comprobante : {{ pedidoSeleccionado.tipo_comprobante }}</h5>
            </div>

            <v-simple-table dense>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Medida</th>
                        <th>Precio</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
               <tr v-for="d in detalleSeleccionado" :key="`${d.id}-${d.nombre}`">
                            <td style="font-size:75%;">{{d.id}} - {{ d.nombre }} <strong class="red--text" v-if="d.operacion=='GRATUITA'">{{ d.operacion }}</strong></td>
                            <td style="font-size:75%;">{{ d.cantidad }}</td>
                            <td style="font-size:75%;">{{ d.medida }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.precio) }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.totalLinea) }}</td>
                        </tr>
                </tbody>
            </v-simple-table>
        </v-card>
    </v-dialog>
</template>

<script>
import { detalle_pedido } from "../../../db";
import store from '@/store/index'
export default {
    name: 'ConsolidadoPedidosSeleccionados',
    props: {
        pedidoSeleccionado: [],
    },
    data() {
        return {
            dial: true,
            detalleSeleccionado: []
        }
    },
    computed: {
        // Siempre array

    },
    async created() {
        await this.consultar_detalle()
        this.dial = true
    },
    methods: {
        async consultar_detalle() {
            store.commit("dialogoprogress")
            var snap = await detalle_pedido(this.pedidoSeleccionado.id).once("value")
            console.log(snap.val())
            const val = snap.val() || [];
            const items = Array.isArray(val) ? val : Object.values(val);
            this.detalleSeleccionado = items;
            store.commit("dialogoprogress")
        },
        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },
        cerrar() {
            this.$emit("cierra", true)
        }
    }
}
</script>
