<template>
    <div class="d-inline-flex align-center" v-if="tieneBono">
        <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
                <v-chip v-bind="attrs" v-on="on" x-small :color="chipColor" text-color="white" class="cursor-pointer"
                    @click="verDetalle">
                    <v-icon x-small left>{{ chipIcon }}</v-icon>
                    {{ chipText }}
                </v-chip>
            </template>
            <span>{{ tooltipText }}</span>
        </v-tooltip>

        <v-dialog v-model="dialDetalle" max-width="450px">
            <v-card>
                <v-system-bar window dark>
                    <v-icon @click="dialDetalle = false">mdi-close</v-icon>
                    <span class="ml-2">Detalle del Bono</span>
                </v-system-bar>
                <v-card-text class="pt-4">
                    <div v-if="producto.tiene_bono && producto.lista_bono && producto.lista_bono.length">
                        <div class="text-subtitle-2 mb-2">
                            <v-icon small color="orange">mdi-star</v-icon>
                            Bonificación exclusiva del producto
                        </div>
                        <v-simple-table dense>
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th>A partir de</th>
                                        <th>Bonificación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(b, idx) in producto.lista_bono" :key="idx">
                                        <td>{{ b.apartir_de }} und</td>
                                        <td>
                                            <strong class="success--text">{{ b.cantidad }}x</strong>
                                            {{ b.nom_producto }}
                                        </td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </div>

                    <div v-if="bonoGlobalPrecio" class="mt-3">
                        <v-divider class="mb-3" v-if="producto.tiene_bono"></v-divider>
                        <div class="text-subtitle-2 mb-2">
                            <v-icon small color="blue">mdi-tag-multiple</v-icon>
                            Grupo de Precios: {{ bonoGlobalPrecio.nombre }}
                        </div>
                        <v-chip x-small :color="bonoGlobalPrecio.activo ? 'success' : 'error'" class="mb-2">
                            {{ bonoGlobalPrecio.activo ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                        <div class="text-caption" v-if="bonoGlobalPrecio.fecha_vencimiento">
                            Vence: {{ formatearFecha(bonoGlobalPrecio.fecha_vencimiento) }}
                        </div>
                        <v-row dense class="mt-1">
                            <v-col cols="6" v-if="bonoGlobalPrecio.escala_may1">
                                <div class="text-caption">
                                    <strong>May 1:</strong> Desde {{ bonoGlobalPrecio.escala_may1 }} und → 
                                    S/{{ bonoGlobalPrecio.precio_may1 }}
                                </div>
                            </v-col>
                            <v-col cols="6" v-if="bonoGlobalPrecio.escala_may2">
                                <div class="text-caption">
                                    <strong>May 2:</strong> Desde {{ bonoGlobalPrecio.escala_may2 }} und → 
                                    S/{{ bonoGlobalPrecio.precio_may2 }}
                                </div>
                            </v-col>
                        </v-row>
                    </div>

                    <div v-if="bonoGlobalBono" class="mt-3">
                        <v-divider class="mb-3" v-if="producto.tiene_bono || bonoGlobalPrecio"></v-divider>
                        <div class="text-subtitle-2 mb-2">
                            <v-icon small color="orange">mdi-gift</v-icon>
                            Grupo de Bonos: {{ bonoGlobalBono.nombre }}
                        </div>
                        <v-chip x-small :color="bonoGlobalBono.activo ? 'success' : 'error'" class="mb-2">
                            {{ bonoGlobalBono.activo ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                        <div class="text-caption" v-if="bonoGlobalBono.fecha_vencimiento">
                            Vence: {{ formatearFecha(bonoGlobalBono.fecha_vencimiento) }}
                        </div>
                        <v-simple-table dense v-if="bonoGlobalBono.data && bonoGlobalBono.data.length" class="mt-1">
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th>A partir de</th>
                                        <th>Bono</th>
                                        <th>Máx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(regla, idx) in bonoGlobalBono.data" :key="idx">
                                        <td>{{ regla.apartir_de }}</td>
                                        <td>{{ regla.cantidad_bono }}x {{ obtenerNombreProducto(regla.codigo) }}</td>
                                        <td>{{ regla.cantidad_max || '∞' }}</td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </div>

                    <v-alert v-if="!tieneBono" type="info" dense text>
                        Este producto no tiene bonificaciones configuradas
                    </v-alert>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import store from '@/store/index';

export default {
    name: 'IndicadorBono',
    props: {
        producto: {
            type: Object,
            required: true
        },
        bonosGlobales: {
            type: Array,
            default: () => []
        },
        soloIcono: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialDetalle: false
        };
    },
    computed: {
        bonoGlobalPrecio() {
            if (!this.producto.grupo_precio) return null;
            const bono = this.bonosGlobales.find(b => 
                b.codigo === this.producto.grupo_precio && 
                b.tipo === 'precio'
            );
            if (bono && bono.activo && !this.estaVencido(bono)) return bono;
            return null;
        },
        bonoGlobalBono() {
            if (!this.producto.grupo_bono) return null;
            const bono = this.bonosGlobales.find(b => 
                b.codigo === this.producto.grupo_bono && 
                b.tipo === 'bono'
            );
            if (bono && bono.activo && !this.estaVencido(bono)) return bono;
            return null;
        },
        tieneBonoUnitario() {
            return this.producto.tiene_bono && 
                   this.producto.lista_bono && 
                   this.producto.lista_bono.length > 0;
        },
        tieneBono() {
            return this.tieneBonoUnitario || this.bonoGlobalPrecio || this.bonoGlobalBono;
        },
        chipColor() {
            if (this.tieneBonoUnitario && (this.bonoGlobalPrecio || this.bonoGlobalBono)) {
                return 'purple';
            }
            if (this.tieneBonoUnitario) return 'orange';
            if (this.bonoGlobalPrecio) return 'blue';
            if (this.bonoGlobalBono) return 'green';
            return 'grey';
        },
        chipIcon() {
            if (this.tieneBonoUnitario && (this.bonoGlobalPrecio || this.bonoGlobalBono)) {
                return 'mdi-star-circle';
            }
            if (this.tieneBonoUnitario) return 'mdi-star';
            if (this.bonoGlobalPrecio) return 'mdi-tag-multiple';
            if (this.bonoGlobalBono) return 'mdi-gift';
            return 'mdi-gift-outline';
        },
        chipText() {
            if (this.soloIcono) return '';
            if (this.tieneBonoUnitario && (this.bonoGlobalPrecio || this.bonoGlobalBono)) {
                return 'Múltiple';
            }
            if (this.tieneBonoUnitario) return 'Bono';
            if (this.bonoGlobalPrecio) return 'Precio';
            if (this.bonoGlobalBono) return 'Bono G';
            return '';
        },
        tooltipText() {
            const partes = [];
            if (this.tieneBonoUnitario) partes.push('Bonificación exclusiva');
            if (this.bonoGlobalPrecio) partes.push(`Precio: ${this.bonoGlobalPrecio.nombre}`);
            if (this.bonoGlobalBono) partes.push(`Bono: ${this.bonoGlobalBono.nombre}`);
            return partes.length ? partes.join(' | ') : 'Sin bonificaciones';
        }
    },
    methods: {
        verDetalle() {
            this.dialDetalle = true;
        },
        estaVencido(bono) {
            if (!bono.fecha_vencimiento) return false;
            return new Date(bono.fecha_vencimiento) < new Date();
        },
        formatearFecha(fecha) {
            if (!fecha) return '';
            return new Date(fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },
        obtenerNombreProducto(id) {
            const prod = (store.state.productos || []).find(p => p.id === id);
            return prod ? prod.nombre : `ID: ${id}`;
        }
    }
};
</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>