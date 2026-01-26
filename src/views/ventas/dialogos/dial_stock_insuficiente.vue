<template>
    <v-dialog v-model="internal" max-width="650">
        <v-card>
            <v-system-bar window dark color="red darken-2">
                <v-icon left>mdi-alert</v-icon>
                <span>Stock insuficiente</span>
                <v-spacer></v-spacer>
                <v-btn icon @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-system-bar>

            <v-card-text class="pt-4">
                <div class="mb-3">
                    No hay stock suficiente en uno o más productos. Revisa los siguientes:
                </div>

                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-right">Stock</th>
                            <th class="text-right">Requerido</th>
                            <th class="text-right">Faltante</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(p, i) in items" :key="i">
                            <td>
                                {{ p.nombre }}
                                <span class="grey--text">({{ p.id }})</span>
                            </td>
                            <td class="text-right">{{ num2(p.stockActual) }}</td>
                            <td class="text-right">{{ num2(p.requerido) }}</td>
                            <td class="text-right red--text font-weight-bold">
                                {{ num2(p.faltante) }}
                            </td>
                        </tr>

                        <tr v-if="!items || !items.length">
                            <td colspan="4" class="text-center grey--text">
                                Sin datos para mostrar
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="close">Entendido</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "DialogStockInsuficiente",
    props: {
        value: { // para v-model
            type: Boolean,
            default: false,
        },
        items: { // sinStock
            type: Array,
            default: () => [],
        },
    },
    computed: {
        internal: {
            get() { return this.value; },
            set(v) { this.$emit("input", v); },
        },
    },
    methods: {
        close() {
            this.$emit("input", false);
            this.$emit("close"); // opcional por si quieres ejecutar algo extra
        },
        num2(v) {
            const n = parseFloat(v) || 0;
            return n.toFixed(2);
        },
    },
};
</script>
