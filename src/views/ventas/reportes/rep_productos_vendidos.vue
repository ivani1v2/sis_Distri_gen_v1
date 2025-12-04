<template>
    <v-dialog v-model="dial" max-width="850px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn color="success" x-small @click="exporta_Reporte()">exportar</v-btn>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-row dense>
                <v-col cols="12">
                </v-col>
            </v-row>
            <v-simple-table dark fixed-header max-width="68vh" dense>
                <template v-slot:default>

                    <thead>
                        <tr>
                            <th class="text-left">
                                Descripcion
                            </th>
                            <th class="text-left">
                                Cantidad.
                            </th>
                            <th class="text-left">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr v-for="item in arrayConsolidar" :key="item.id">
                            <td>{{ item.codigo }}-{{ item.nombre }}</td>
                            <td>{{ item.cantidad }}</td>
                            <td>S/.{{ item.total.toFixed(2) }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

    </v-dialog>
</template>

<script>
import {
    consultaDetalle,
} from '../../../db'
import store from '@/store/index'
import XLSX from 'xlsx'
import moment from 'moment'
export default {
    props: {
        data: [],
    },
    data() {
        return {
            dial: false,
            arrayConsolidar: [],
        }
    },
    created() {
        this.prod_vendidos()
    },

    methods: {
        async prod_vendidos() {
            store.commit("dialogoprogress", 1); // Iniciar diálogo de progreso

            try {


                this.arrayConsolidar = {}; // Objeto para consolidar productos vendidos

                let productosVendidos = this.data.filter(data =>
                    data.operacion === "ingreso" &&
                    data.estado === "activo" &&
                    data.observacion.toLowerCase().includes("venta")
                );

                for (let data of productosVendidos) {
                    try {
                        let snapshot = await consultaDetalle(data.numeracion_doc).once("value");

                        snapshot.forEach(item => {
                            let producto = item.val();
                            let clave = producto.id || producto.nombre; // Usa código si existe, si no, usa nombre

                            if (!this.arrayConsolidar[clave]) {
                                this.arrayConsolidar[clave] = {
                                    nombre: producto.nombre,
                                    codigo: producto.id || null,
                                    cantidad: producto.cantidad,
                                    precio: producto.precio,
                                    total: producto.cantidad * producto.precio,
                                };
                            } else {
                                this.arrayConsolidar[clave].cantidad += producto.cantidad;
                                this.arrayConsolidar[clave].total += producto.cantidad * producto.precio;
                            }
                        });
                    } catch (error) {
                        console.error(`⚠ Error al consultar detalle para ${data.numeracion_doc}:`, error);
                    }
                }

                // Convertir el objeto consolidado en un array final
                this.arrayConsolidar = Object.values(this.arrayConsolidar).sort((a, b) => b.cantidad - a.cantidad);


                console.log("📦 Productos Consolidados con Stock Correcto:", this.arrayConsolidar);
            } catch (error) {
                console.error("❌ Error en la función `prod_vendidos`:", error);
            } finally {
                store.commit("dialogoprogress", 0); // Finalizar diálogo de progreso
                this.dial = true
            }
        },
        exporta_Reporte() {
            var data = XLSX.utils.json_to_sheet(this.arrayConsolidar)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "flujo caja")
            XLSX.writeFile(workbook, `${filename}.xlsx`)

        },
        cierra() {
            this.$emit('cierra', false)
        }
    }
}

</script>
