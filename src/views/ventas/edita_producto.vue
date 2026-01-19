<template>

    <v-dialog v-model="dial" max-width="390" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <IndicadorBono v-if="tieneBonoProducto" 
                    :producto="productoCompleto" 
                    :bonos-globales="bonosGlobalesCache"
                    :solo-icono="false"
                    class="mr-4" />
                <v-checkbox :disabled="!$store.state.permisos.edita_bono" v-model="es_bono"
                    label="ES BONO"></v-checkbox>
            </v-system-bar>
        </div>
        <v-card class="pa-3">

            <v-row class="mx-auto mt-4 text-center" dense v-if="puedeEditarCantidad">

                <v-col cols="4" xs="4">
                    <v-icon @click="suma()" color="green">mdi-plus</v-icon>
                </v-col>

                <v-col cols="4" xs="4">
                    <v-text-field dense @keyup.enter="grabaEdita()" type="number" outlined v-model="cantidadEdita"
                        label="Cantidad"></v-text-field>
                </v-col>
                <v-col cols="4" xs="4">
                    <v-icon @click="resta()" color="red">mdi-minus</v-icon>
                </v-col>

            </v-row>
            <v-row class="mx-auto text-center" dense>
                <v-col cols="12">
                    <v-textarea readonly dense class="mt-n2" outlined v-model="nombreEdita" auto-grow filled
                        color="deep-purple" label="Descripcion" rows="1"></v-textarea>
                </v-col>
            </v-row>
            <v-row class="mx-auto text-center mt-n2" dense
                v-if="$store.state.configuracion.desc_porcentaje && !es_bono">
                <v-col cols="4">
                    <v-text-field dense outlined type="number" label="% Desc 1" v-model="desc_1"
                        @input="calcula_porcentajes()" hide-details>
                    </v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-text-field dense outlined type="number" label="% Desc 2" v-model="desc_2"
                        @input="calcula_porcentajes()" hide-details>
                    </v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-text-field dense outlined type="number" label="% Desc 3" v-model="desc_3"
                        @input="calcula_porcentajes()" hide-details>
                    </v-text-field>
                </v-col>
            </v-row>
            <v-row class="mx-auto text-center mt-2" dense>
                <v-col readonly @focus="$event.target.select()" cols="6" v-if="$store.state.permisos.caja_edita_precio">
                    <v-text-field outlined dense @keyup.enter="grabaEdita()" type="number" v-model="precioedita"
                        label="Precio"></v-text-field>
                </v-col>
                <v-col cols="6" v-if="$store.state.permisos.descuentos && !$store.state.configuracion.desc_porcentaje">
                    <v-text-field :disabled="es_bono" @focus="$event.target.select()" outlined dense
                        @keyup.enter="grabaEdita()" type="number" v-model="preciodescuento"
                        label="Descuento"></v-text-field>
                </v-col> </v-row>


            <v-card-actions class="mt-n6">

                <v-btn color="red darken-1" text @click="eliminaedita()">
                    Elimina
                </v-btn>

                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="grabaEdita()">
                    Graba
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import store from "@/store";
import IndicadorBono from '@/views/productos/components/IndicadorBono.vue';
import { allBono } from '../../db';

export default {
    name: "caja2",
    components: {
        IndicadorBono
    },
    props: {
        item_selecto: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            dial: false,
            cantidadEdita: 1,
            precioedita: 0,
            nombreEdita: "",
            preciodescuento: 0,
            desc_1: 0,
            desc_2: 0,
            desc_3: 0,
            es_bono: false,
            porcentaje: false,
            bonosGlobalesCache: [],
        };
    },
    created() {
        var val = this.item_selecto
        this.desc_1 = val.desc_1 || 0
        this.desc_2 = val.desc_2 || 0
        this.desc_3 = val.desc_3 || 0
        this.cantidadEdita = val.cantidad
        this.nombreEdita = val.nombre
        this.precioedita = val.precio
        this.preciodescuento = val.preciodescuento

        // Si la línea es gratuita, marcar el checkbox y forzar precio/descuento a 0
        this.es_bono = String(val.operacion || '').toUpperCase() === 'GRATUITA'
        if (this.es_bono) {
            this.precioedita = 0
            this.preciodescuento = 0
        }
        this.dial = true
        
        this.cargarBonosGlobales();
    },
    watch: {
        es_bono(nuevo) {
            if (nuevo) {
                // Si ahora es bono: precio y descuento en 0
                this.precioedita = 0;
                this.preciodescuento = 0;
            } else {
                // Si deja de ser bono: recupera precio/descuento del item original
                if (this.item_selecto && Number(this.item_selecto.precio) > 0) {
                    this.precioedita = Number(this.item_selecto.precio) || 0;
                    this.preciodescuento = Number(this.item_selecto.preciodescuento) || 0;
                }
            }
        }
    },

    computed: {
        puedeEditarCantidad() {
            // Si no tiene permiso general para editar cantidad, nunca puede
            if (!this.$store.state.permisos.caja_edita_cantidad) return false;

            const op = String(this.item_selecto?.operacion || '').toUpperCase();

            // Si es GRATUITA -> depende también de permiso edita_bono
            if (op === 'GRATUITA') {
                return !!this.$store.state.permisos.edita_bono;
            }

            // Si NO es gratuita -> solo importa caja_edita_cantidad
            return true;
        },
        productoCompleto() {
            // Busca el producto completo desde el store usando el id del item seleccionado
            const prod = this.$store.state.productos.find(
                p => String(p.id) === String(this.item_selecto?.id)
            );
            return prod || this.item_selecto || {};
        },
        tieneBonoProducto() {
            if (!this.productoCompleto?.id) return false;
            const prodId = String(this.productoCompleto.id);
            
            // Verificar bono unitario
            const tieneUnitario = !!(
                this.productoCompleto.bono && 
                Number(this.productoCompleto.bono) > 0
            );
            
            // Verificar bono global
            const tieneGlobal = this.bonosGlobalesCache.some(b => {
                if (!b.activo) return false;
                const productos = b.productos || [];
                return productos.some(p => String(p.id) === prodId);
            });
            
            return tieneUnitario || tieneGlobal;
        }
    },
    methods: {
        async cargarBonosGlobales() {
            try {
                const snap = await allBono().once("value");
                const val = typeof snap.val === "function" ? snap.val() : null;
                let arr = [];
                if (Array.isArray(val)) arr = val.filter(Boolean);
                else if (val && typeof val === "object") arr = Object.values(val);
                this.bonosGlobalesCache = arr.filter(b => b.activo);
            } catch (error) {
                this.bonosGlobalesCache = [];
            }
        },
        grabaEdita() {
            const esBono = !!this.es_bono;

            if (this.cantidadEdita == '' || Number(this.cantidadEdita) <= 0) {
                alert('ingrese cantidad valida');
                return;
            }

            // Validaciones de precio solo si NO es bono
            if (!esBono) {
                if (Number(this.precioedita) === 0) {
                    alert("Precio no puede ser 0");
                    return;
                }
                if (parseFloat(this.precioedita) <= parseFloat(this.preciodescuento || 0)) {
                    alert("Precio no puede ser menor/igual a 0");
                    return;
                }
            }

            if (!esBono && this.$store.state.configuracion.precio_minimo) {
                const prod = store.state.productos.find(
                    p => String(p.id) === String(this.item_selecto.id)
                ) || {};

                const factor = (
                    Number(this.item_selecto?.factor) &&
                    this.item_selecto.medida !== 'UNIDAD' &&
                    Number(this.item_selecto.factor) !== 1
                ) ? Number(this.item_selecto.factor) : 1;

                const baseMay2 = Number(prod.precio_may2) || 0;
                const baseMay1 = Number(prod.precio_may1) || 0;
                const basePrecio = Number(prod.precio) || 0;

                let baseMinima = basePrecio;
                if (baseMay2 > 0) baseMinima = baseMay2;
                else if (baseMay1 > 0) baseMinima = baseMay1;

                const precioMinimo = this.redondear
                    ? this.redondear(baseMinima * factor)
                    : (baseMinima * factor);

                if (Number(this.precioedita) < precioMinimo) {
                    alert(`Precio menor al mínimo (${precioMinimo})`);
                    return;
                }
            }

            // Stock
            if (this.item_selecto.controstock) {
                const producto = store.state.productos.find(
                    item => item.id == this.item_selecto.id
                );
                if (producto && producto.stock < Number(this.cantidadEdita)) {
                    alert('Producto sin Stock');
                    return;
                }
            }

            // 🚨 AQUÍ ESTABA EL PROBLEMA:
            // Antes intentabas usar this.listaproductos y this.recalculoCompleto()
            // Ahora solo trabajamos con una copia del item_selecto

            const linea = {
                ...this.item_selecto,
                desc_1: Number(this.desc_1) || 0,
                desc_2: Number(this.desc_2) || 0,
                desc_3: Number(this.desc_3) || 0,
                nombre: this.nombreEdita,
                cantidad: Number(this.cantidadEdita),
            };

            if (esBono) {
                linea.operacion = 'GRATUITA';
                linea.precio = linea.precio_base;
                linea.totalLinea = '0.00';
                linea.preciodescuento = 0;
            } else {
                linea.operacion =
                    (linea.operacion === 'GRATUITA')
                        ? 'GRAVADA'
                        : (linea.operacion || 'GRAVADA');

                linea.precio = Number(this.precioedita);
                linea.preciodescuento = Number(this.preciodescuento) || 0;
                linea.totalLinea = this.redondear(linea.cantidad * linea.precio);
            }

            // 👉 Enviamos la línea actualizada al padre
            this.$emit('editaProducto', linea);

        },



        suma() {
            if (this.item_selecto.controstock) {
                var producto = store.state.productos.find(item => item.id == this.item_selecto.id)
                if (producto.stock <= this.cantidadEdita) {
                    alert('Producto sin Stock')
                    return
                }
            }
            this.cantidadEdita = parseInt(this.cantidadEdita) + 1
        },
        resta() {
            if (this.cantidadEdita > 1) {
                this.cantidadEdita = parseInt(this.cantidadEdita) - 1
            }
        },
        eliminaedita() {
            this.$emit('eliminaedita')
        },
        calcula_porcentajes() {
            // ✅ Base REAL siempre: precio_base si existe, si no, precio
            const base = Number(this.item_selecto.precio_base || this.item_selecto.precio) || 0;

            const d1 = Number(this.desc_1) || 0;
            const d2 = Number(this.desc_2) || 0;
            const d3 = Number(this.desc_3) || 0;

            // Si no hay descuentos, volvemos exactamente al precio_base y desc = 0
            if (d1 === 0 && d2 === 0 && d3 === 0) {
                this.precioedita = this.redondear(base);
                this.preciodescuento = this.redondear(0);
                return;
            }

            // 🔹 Descuento en cascada partiendo SIEMPRE del base (precio_base)
            let precio_actual = base;

            if (d1 > 0) precio_actual = precio_actual * (1 - d1 / 100);
            if (d2 > 0) precio_actual = precio_actual * (1 - d2 / 100);
            if (d3 > 0) precio_actual = precio_actual * (1 - d3 / 100);

      

            // Actualiza precio neto y monto de descuento
            this.precioedita = this.redondear(precio_actual);
    
        },

        cierra() {
            this.$emit('cierra')
            this.dial = false
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
    },
};
</script>