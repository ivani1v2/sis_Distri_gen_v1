<template>
    <div class="seccion-bonos">
        <v-card outlined class="mb-2" v-if="tieneBonoUnitario">
            <v-card-title class="py-2">
                <v-icon small color="orange" class="mr-2">mdi-star</v-icon>
                <span class="text-subtitle-2">Bonificación Exclusiva</span>
                <v-spacer></v-spacer>
                <v-chip x-small color="orange" text-color="white">Unitario</v-chip>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="py-2">
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
            </v-card-text>
        </v-card>

        <v-card outlined class="mb-2" v-if="bonoGlobalPrecio || bonoGlobalBono">
            <v-card-title class="py-2">
                <v-icon small color="blue" class="mr-2">mdi-earth</v-icon>
                <span class="text-subtitle-2">Bonos Globales Asignados</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="py-2">
                <div v-if="bonoGlobalPrecio" class="mb-3">
                    <v-row dense align="center">
                        <v-col cols="auto">
                            <v-icon small color="blue">mdi-tag-multiple</v-icon>
                        </v-col>
                        <v-col>
                            <div class="text-body-2 font-weight-medium">
                                {{ bonoGlobalPrecio.nombre }}
                                <v-chip x-small :color="bonoGlobalPrecio.activo ? 'success' : 'error'" class="ml-1">
                                    {{ bonoGlobalPrecio.activo ? 'Activo' : 'Inactivo' }}
                                </v-chip>
                            </div>
                            <div class="text-caption grey--text">
                                Código: {{ bonoGlobalPrecio.codigo }}
                                <span v-if="bonoGlobalPrecio.fecha_vencimiento">
                                    | Vence: {{ formatearFecha(bonoGlobalPrecio.fecha_vencimiento) }}
                                    <v-icon x-small :color="estaVencido(bonoGlobalPrecio) ? 'error' : 'success'">
                                        {{ estaVencido(bonoGlobalPrecio) ? 'mdi-alert-circle' : 'mdi-check-circle' }}
                                    </v-icon>
                                </span>
                            </div>
                        </v-col>
                    </v-row>
                    <v-row dense class="mt-1 ml-4">
                        <v-col cols="6" v-if="bonoGlobalPrecio.escala_may1">
                            <div class="text-caption">
                                May 1: ≥{{ bonoGlobalPrecio.escala_may1 }} → S/{{ bonoGlobalPrecio.precio_may1 }}
                            </div>
                        </v-col>
                        <v-col cols="6" v-if="bonoGlobalPrecio.escala_may2">
                            <div class="text-caption">
                                May 2: ≥{{ bonoGlobalPrecio.escala_may2 }} → S/{{ bonoGlobalPrecio.precio_may2 }}
                            </div>
                        </v-col>
                    </v-row>
                </div>

                <div v-if="bonoGlobalBono">
                    <v-divider class="my-2" v-if="bonoGlobalPrecio"></v-divider>
                    <v-row dense align="center">
                        <v-col cols="auto">
                            <v-icon small color="orange">mdi-gift</v-icon>
                        </v-col>
                        <v-col>
                            <div class="text-body-2 font-weight-medium">
                                {{ bonoGlobalBono.nombre }}
                                <v-chip x-small :color="bonoGlobalBono.activo ? 'success' : 'error'" class="ml-1">
                                    {{ bonoGlobalBono.activo ? 'Activo' : 'Inactivo' }}
                                </v-chip>
                            </div>
                            <div class="text-caption grey--text">
                                Código: {{ bonoGlobalBono.codigo }}
                                <span v-if="bonoGlobalBono.fecha_vencimiento">
                                    | Vence: {{ formatearFecha(bonoGlobalBono.fecha_vencimiento) }}
                                    <v-icon x-small :color="estaVencido(bonoGlobalBono) ? 'error' : 'success'">
                                        {{ estaVencido(bonoGlobalBono) ? 'mdi-alert-circle' : 'mdi-check-circle' }}
                                    </v-icon>
                                </span>
                            </div>
                        </v-col>
                    </v-row>
                    <v-simple-table dense class="mt-1 ml-4" v-if="bonoGlobalBono.data && bonoGlobalBono.data.length">
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
            </v-card-text>
        </v-card>

        <v-alert v-if="!tieneBonoUnitario && !bonoGlobalPrecio && !bonoGlobalBono" type="info" dense text>
            <v-row align="center">
                <v-col class="grow">Este producto no tiene bonificaciones configuradas</v-col>
                <v-col class="shrink" v-if="mostrarAccion">
                    <v-btn x-small color="primary" text @click="$emit('configurar')">
                        <v-icon left x-small>mdi-plus</v-icon>
                        Configurar
                    </v-btn>
                </v-col>
            </v-row>
        </v-alert>
    </div>
</template>

<script>
import store from '@/store/index';

export default {
    name: 'SeccionBonosProducto',
    props: {
        producto: {
            type: Object,
            required: true
        },
        bonosGlobales: {
            type: Array,
            default: () => []
        },
        mostrarAccion: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        tieneBonoUnitario() {
            return this.producto.tiene_bono &&
                this.producto.lista_bono &&
                this.producto.lista_bono.length > 0;
        },
        bonoGlobalPrecio() {
            if (!this.producto.grupo_precio) return null;
            return this.bonosGlobales.find(b =>
                b.codigo === this.producto.grupo_precio &&
                b.tipo === 'precio'
            );
        },
        bonoGlobalBono() {
            if (!this.producto.grupo_bono) return null;
            return this.bonosGlobales.find(b =>
                b.codigo === this.producto.grupo_bono &&
                b.tipo === 'bono'
            );
        }
    },
    methods: {
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