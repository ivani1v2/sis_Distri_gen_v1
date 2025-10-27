<template>
    <v-container class="devoluciones" max-width="700">
        <v-card>
            <v-card-title>
                <v-icon left color="primary">mdi-undo-variant</v-icon>
                Devolución de Productos Vendidos
            </v-card-title>
            <v-card-text>
                <v-form @submit.prevent="buscarVenta" class="mb-4" ref="form">
                    <v-row align="center">
                        <v-col cols="12" sm="4">
                            <v-text-field v-model="serie" label="Serie" outlined dense required></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-text-field v-model="correlativo" label="Correlativo" outlined dense
                                required></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-btn color="primary" type="submit" block>
                                Buscar Venta
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-form>

                <v-alert v-if="mensaje" type="info" class="mb-4" dense>
                    {{ mensaje }}
                </v-alert>

                <v-card v-if="venta && venta.length" outlined class="mb-3">
                    <v-card-title class="subtitle-1 font-weight-bold">
                        Productos Vendidos
                    </v-card-title>
                    <v-data-table :headers="headers" :items="venta" item-key="id" class="elevation-1" disable-pagination
                        hide-default-footer>
                        <template #item.devolver="{ item }">
                            <v-text-field v-model.number="item.devolver" type="number" :max="item.cantidad" min="1"
                                dense hide-details style="max-width: 80px"></v-text-field>
                        </template>
                        <template #item.accion="{ item }">
                            <v-btn color="success" small @click="devolverProducto(item)"
                                :disabled="!item.devolver || item.devolver < 1 || item.devolver > item.cantidad">
                                Devolver
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
import { consultaDetalle } from '../../db'
import store from '@/store/index'
import {
    form_devolucion
} from './formatos/form_devolucion'
export default {
    name: "Devoluciones",
    data() {
        return {
            serie: "",
            correlativo: "",
            venta: null,        // Ahora será un array de productos
            mensaje: "",
            headers: [
                { text: "Producto", value: "nombre" },
                { text: "Cantidad Vendida", value: "cantidad" },
                { text: "Cantidad a Devolver", value: "devolver" },
                { text: "Acción", value: "accion", sortable: false },
            ],
        };
    },
    methods: {
        async buscarVenta() {
            this.mensaje = "";
            this.venta = null;

            if (!this.serie || !this.correlativo) {
                this.mensaje = "Debes ingresar la serie y correlativo.";
                return;
            }

            const codigo = this.serie + '-' + this.correlativo.toString().padStart(8, '0');
            try {
                const snapshot = await consultaDetalle(codigo).once("value");
                if (snapshot.exists()) {
                    const data = snapshot.val(); // data es un array de productos
                    if (Array.isArray(data) && data.length > 0) {
                        // Añadimos campo devolver a cada producto
                        this.venta = data.map(p => ({
                            ...p,
                            devolver: 0
                        }));
                        this.mensaje = "";
                    } else {
                        this.venta = null;
                        this.mensaje = "Venta encontrada pero sin productos.";
                    }
                } else {
                    this.venta = null;
                    this.mensaje = "Venta no encontrada.";
                }
            } catch (error) {
                this.venta = null;
                this.mensaje = "Error consultando la venta.";
            }
        },
        devolverProducto(item) {
            if (item.devolver > 0 && item.devolver <= item.cantidad) {
                // Marca el producto con la cantidad devuelta para el comprobante
                item.devolver_real = item.devolver;
                item.cantidad -= item.devolver;
                this.mensaje = `Se devolvieron ${item.devolver} unidades de ${item.nombre} al stock.`;
                // Genera comprobante solo con este producto
                form_devolucion({
                    serie: this.serie,
                    correlativo: this.correlativo,
                    fecha: new Date().toLocaleString(),
                    productos: [item],
                    usuario: store.state.permisos.usuario || "admin"
                });
                item.devolver = 0;
            } else {
                this.mensaje = "Cantidad a devolver inválida.";
            }
        },
    },
};
</script>

<style scoped>
.devoluciones {
    margin-top: 40px;
}
</style>
