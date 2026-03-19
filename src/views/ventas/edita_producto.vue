<template>

    <v-dialog v-model="dial" max-width="390" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <IndicadorBono v-if="tieneBonoProducto" :producto="productoCompleto"
                    :bonos-globales="bonosGlobalesCache" :solo-icono="false" class="mr-14" />
                <v-checkbox v-if="$store.state.permisos.edita_bono" v-model="es_bono" label="ES BONO"></v-checkbox>
            </v-system-bar>
        </div>
        <v-card class="pa-3">

            <v-alert v-if="esBonoGlobal" type="warning" dense text class="mb-6">
                Bono global - No editable
            </v-alert>

            <v-alert v-else-if="esBonoIndividualBloqueado" type="info" dense text class="mb-6">
                Bono exclusivo - No editable
            </v-alert>

            <v-alert v-else-if="esPrecioEstricto && tieneEscalasConfiguradas && !es_bono" type="info" dense text
                class="mb-2">
                Precio automático por escala
                <span v-if="tienePrecioGrupoAplicado || tienePrecioEscalaAplicado" class="ml-1">
                    <v-chip x-small class="ml-1" color="blue" text-color="white">
                        {{ tienePrecioGrupoAplicado ? item_selecto._precio_grupo : ('Tier ' + (item_selecto._precio_tier
                            || 1)) }}
                    </v-chip>
                </span>
            </v-alert>

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
                        label="Precio" :disabled="esPrecioEstricto && tieneEscalasConfiguradas && !es_bono"
                        :hint="(esPrecioEstricto && tieneEscalasConfiguradas) ? 'Precio automático por escala' : ''"
                        :persistent-hint="esPrecioEstricto && tieneEscalasConfiguradas"></v-text-field>
                </v-col>
                <v-col cols="6" v-if="$store.state.permisos.descuentos && !$store.state.configuracion.desc_porcentaje">
                    <v-text-field :disabled="es_bono" @focus="$event.target.select()" outlined dense
                        @keyup.enter="grabaEdita()" type="number" v-model="preciodescuento"
                        label="Descuento"></v-text-field>
                </v-col> </v-row>


            <v-card-actions class="mt-n6">

                <v-btn color="red darken-1" text @click="eliminaedita()" :disabled="!puedeEliminar">
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
import { determinarPrecioPorLista } from "../funciones/calculo_lista_precios";
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
        productos_en_venta: {
            type: Array,
            default: () => [],
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

        this.es_bono = String(val.operacion || '').toUpperCase() === 'GRATUITA'
        if (this.es_bono) {
            this.precioedita = 0
            this.preciodescuento = 0
        }
        this.dial = true

        this.cargarBonosGlobales();
    },
    watch: {
        cantidadEdita(nuevaCantidad) {
            if (this.es_bono) return;

            const cantidad = Number(nuevaCantidad) || 0;
            if (cantidad <= 0) return;

            const factor = Number(this.item_selecto?.factor || 1);
            const medida = String(this.item_selecto?.medida || '').toUpperCase();
            const unidadesTotal = (factor > 1 && medida !== 'UNIDAD') ? cantidad * factor : cantidad;

            const otrosProductos = (this.productos_en_venta || []).filter(
                p => p.uuid !== this.item_selecto.uuid
            );

            const resultado = determinarPrecioPorLista({
                producto: this.productoCompleto,
                listasCliente: this.listasPreciosCliente,
                productosEnVenta: otrosProductos,
                cantidadNueva: unidadesTotal
            });

            if (resultado?.precio) {
                let precioTemp = resultado.precio;
                if (factor > 1 && medida !== 'UNIDAD') {
                    precioTemp = precioTemp * factor;
                }
                this.precioedita = this.redondear(precioTemp);
            }
        },

        es_bono(nuevo) {
            if (nuevo) {
                this.precioedita = 0;
                this.preciodescuento = 0;
            } else {
                let precioRecuperado = Number(this.item_selecto?.precio_base || 0);

                if (!precioRecuperado || precioRecuperado <= 0) {
                    const prodOriginal = store.state.productos.find(
                        p => String(p.id) === String(this.item_selecto?.id)
                    );
                    if (prodOriginal) {
                        precioRecuperado = Number(prodOriginal.precio || 0);
                    }
                }
                if (!precioRecuperado || precioRecuperado <= 0) {
                    precioRecuperado = Number(this.item_selecto?.precio || 0);
                }

                this.precioedita = precioRecuperado;
                this.preciodescuento = 0;
            }
        }
    },

    computed: {
        esListaPreciosActivo() {
            return this.$store.state.configuracion?.lista_precios === true;
        },
        listasPreciosCliente() {
            const cli = this.$store.state.cliente_selecto;
            if (!cli || typeof cli !== 'object' || Array.isArray(cli)) return [];
            return Array.isArray(cli.listas_precios) ? cli.listas_precios : [];
        },
        checkboxBonoVisible() {
            return this.$store.state.permisos.edita_bono === true;
        },

        esBonoGlobal() {
            if (this.item_selecto?.bono_auto !== true) return false;
            if (this.item_selecto?.bono_origen_tipo !== 'grupo_bono') return false;
            if (this.es_bono !== true) return false;
            return this.$store.state.permisos.permite_editar_bono === true;
        },

        esBonoIndividualBloqueado() {
            if (this.item_selecto?.bono_auto !== true) return false;
            if (this.item_selecto?.bono_origen_tipo !== 'lista_bono') return false;
            if (this.es_bono !== true) return false;
            return this.$store.state.permisos.permite_editar_bono === true;
        },

        tienePrecioEscalaAplicado() {
            const tier = this.item_selecto?._precio_tier || 1;
            return tier > 1;
        },

        tienePrecioGrupoAplicado() {
            return !!this.item_selecto?._precio_grupo;
        },

        esPrecioEstricto() {
            return this.$store.state.permisos.permite_editar_precio === true;
        },

        tieneEscalasConfiguradas() {
            const prod = this.productoCompleto;
            if (!prod?.id) return false;

            const tieneGrupoPrecio = !!prod.grupo_precio;
            if (tieneGrupoPrecio) {
                const bonos = this.$store.state.bonos || {};
                const cfg = bonos[prod.grupo_precio];
                if (cfg && cfg.tipo === 'precio' && cfg.activo) return true;
            }

            const tieneMay1 = Number(prod.precio_may1 || 0) > 0 && Number(prod.escala_may1 || 0) > 0;
            const tieneMay2 = Number(prod.precio_may2 || 0) > 0 && Number(prod.escala_may2 || 0) > 0;

            return tieneMay1 || tieneMay2;
        },

        esPrecioEscalaBloqueado() {
            if (!this.tienePrecioEscalaAplicado && !this.tienePrecioGrupoAplicado) return false;
            if (this.es_bono) return false;
            return this.$store.state.permisos.permite_editar_precio === true;
        },

        puedeEditarCantidad() {
            if (this.esBonoGlobal) return false;
            if (this.esBonoIndividualBloqueado) return false;
            if (!this.$store.state.permisos.caja_edita_cantidad) return false;
            return true;
        },

        puedeEliminar() {
            if (this.esBonoGlobal) return false;
            if (this.esBonoIndividualBloqueado) return false;
            return true;
        },
        productoCompleto() {
            const prod = this.$store.state.productos.find(
                p => String(p.id) === String(this.item_selecto?.id)
            );
            return prod || this.item_selecto || {};
        },
        tieneBonoProducto() {
            if (!this.productoCompleto?.id) return false;

            const tieneUnitario = !!(
                this.productoCompleto.tiene_bono &&
                Array.isArray(this.productoCompleto.lista_bono) &&
                this.productoCompleto.lista_bono.length > 0
            );

            const tieneGrupoPrecio = this.bonosGlobalesCache.some(b => {
                if (!b.activo) return false;
                return b.codigo === this.productoCompleto.grupo_precio && b.tipo === 'precio';
            });

            const tieneGrupoBono = this.bonosGlobalesCache.some(b => {
                if (!b.activo) return false;
                return b.codigo === this.productoCompleto.grupo_bono && b.tipo === 'bono';
            });

            return tieneUnitario || tieneGrupoPrecio || tieneGrupoBono;
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

            if (!esBono && Number(this.precioedita) === 0) {
                alert("Precio no puede ser 0");
                return;
            }

            if (this.item_selecto.controstock) {
                const producto = store.state.productos.find(
                    item => item.id == this.item_selecto.id
                );
                if (producto && producto.stock < Number(this.cantidadEdita)) {
                    alert('Producto sin Stock');
                    return;
                }
            }

            const factor = Number(this.item_selecto?.factor || 1);
            const medida = String(this.item_selecto?.medida || '').toUpperCase();
            const modoVenta = (factor > 1 && medida !== 'UNIDAD') ? 'entero' : 'fraccion';

            const precio_unitario = modoVenta === 'entero'
                ? Number(this.precioedita) / factor
                : Number(this.precioedita);

            const linea = {
                ...this.item_selecto,
                desc_1: Number(this.desc_1) || 0,
                desc_2: Number(this.desc_2) || 0,
                desc_3: Number(this.desc_3) || 0,
                nombre: this.nombreEdita,
                cantidad: Number(this.cantidadEdita),
                precio: Number(this.precioedita),
                precio_base: Number(precio_unitario.toFixed(4)),
                preciodescuento: Number(this.preciodescuento) || 0,
                operacion: esBono ? 'GRATUITA' : (this.item_selecto.operacion || 'GRAVADA'),
                precio_manual: true,
            };

            if (esBono) {
                linea.precio = linea.precio_base || Number(this.item_selecto.precio || 0);
                linea.totalLinea = '0.00';
                linea.preciodescuento = 0;
            }

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