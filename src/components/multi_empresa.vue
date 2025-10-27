<template>
    <v-dialog v-model="dial" max-width="900px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3 class="text-h6">Productos por sede</h3>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-row dense>
                <v-col cols="6">
                    <v-select v-model="sede_actual" :items="$store.state.array_sedes" item-text="nombre"
                        item-value="base" label="Sede" outlined dense @change="sedeCambiada"></v-select>
                </v-col>
                <v-col cols="6">
                    <v-text-field v-model="busqueda" label="Buscar producto" dense outlined clearable
                        append-icon="mdi-magnify"></v-text-field>
                </v-col>
            </v-row>

            <v-simple-table dense fixed-header height="60vh" class="mt-4">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(producto, key) in productosFiltrados" :key="key">
                        <td>{{ producto.id }}</td>
                        <td>{{ producto.nombre }}</td>
                        <td>{{ producto.categoria }}</td>
                        <td>{{ producto.precio }}</td>
                        <td :class="producto.stock < 0 ? 'red--text font-weight-bold' : ''">
                            {{ producto.stock }}
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>
    </v-dialog>
</template>

<script>
import { allProductoOtraBase } from "../db";
import store from "@/store/index";

export default {
    data() {
        return {
            dial: false,
            sede_actual: null,
            productos: [],
            busqueda: "",
        };
    },
    created() {
        this.dial = true;
    },
    computed: {
        productosFiltrados() {
            if (!this.busqueda) return this.productos;
            const filtro = this.busqueda.toLowerCase();
            return this.productos.filter(p =>
                p.nombre?.toLowerCase().includes(filtro)
            );
        },
    },
    methods: {
        async sedeCambiada(val) {
            const seleccionada = store.state.array_sedes.find(e => e.base === val);
            if (!seleccionada) return;

            const snap = await allProductoOtraBase(seleccionada.base).once("value");
            const data = snap.val();
            this.productos = data ? Object.values(data) : [];
        },
        cierra() {
            this.$emit("cierra");
        },
    },
};
</script>
