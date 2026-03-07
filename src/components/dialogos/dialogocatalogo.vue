<template>
    <v-dialog v-model="dial" max-width="600px" @keydown.esc="cierra">
        <div>

            <v-system-bar window dark>
                <v-icon @click="cierra">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon v-if="activaproductos" large color="red"
                    @click="activaproductos = false">mdi-keyboard-return</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-1">
            <v-autocomplete v-if="false" class=" mb-n4" v-model="producto_sele" autofocus
                :items="$store.state.productos" item-text="nombre" item-value="id" label="Buscar Productos" clearable
                menu-props="auto" outlined dense ref="buscarField" :filter="filtroPorPalabras" append-icon="mdi-magnify"
                @change="prod_selecto">
                <template v-slot:item="{ item }">
                    <v-list-item-content>
                        <v-list-item-title>
                            <strong>{{ item.categoria }}</strong> - {{ item.nombre }} - <strong class="red--text">S/ {{
                                item.precio }}</strong>
                        </v-list-item-title>
                    </v-list-item-content>
                </template></v-autocomplete>
            <v-simple-table v-if="false" fixed-header max-width="600px" class="pa-1">
                <template v-slot:default>
                    <thead>
                    </thead>
                    <tbody>

                        <v-row class="mt-1 mb-4 mx-auto" style="text-align:center" dense>
                            <v-col v-for="item in arrayiconos" :key="item.id" cols="6" class="pa-1" md="4" sm="4"
                                xs="4">
                                <v-card height="80" @click.prevent="iraproductos(item)">
                                    <v-card-text class="red--text" style="font-size:medium">
                                        <span class="black--text">{{ item.nombre }}</span>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                    </tbody>
                </template>
            </v-simple-table>

            <div v-if="activaproductos || !$store.state.configuracion.ordencategorias">
                <v-card-title>
                    <v-spacer></v-spacer>
                    <v-text-field class="mb-n1 mt-n2" outlined dense v-model="buscar" append-icon="mdi-magnify"
                        label="Buscar" single-line hide-details :autofocus='!$store.state.esmovil'></v-text-field>
                </v-card-title>

                <v-simple-table fixed-header height="60vh" dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Nombre
                                </th>
                                <th class="text-left">
                                    Stock
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in listafiltrada" :key="item.id" @click="abre_cantidad(item)">
                                <td><Strong>{{ item.cod_interno }} </Strong> - {{ item.nombre }}</td>
                                <td>{{ item.stock }}</td>
                                <td>{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </div>
        </v-card>
        <v-dialog v-model="dialo_cantidad" max-width="350px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = !dialo_cantidad">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-text class="pt-4">
                    <!-- Stock info -->
                    <div class="text-caption grey--text text--darken-1 mb-2" v-if="producto_selecto">
                        Stock: <strong>{{ producto_selecto.stock || 0 }}</strong> {{ producto_selecto.medida || 'UND' }}
                    </div>

                    <!-- ============================================= -->
                    <!-- SELECTOR DE PRECIO (v-select con precio fijo + presentaciones) -->
                    <!-- ============================================= -->
                    <v-select v-if="producto_selecto" v-model="opcionPrecioSeleccionada" :items="opcionesPrecios"
                        item-text="descripcion" item-value="id" label="Seleccionar precio" outlined dense hide-details
                        class="mb-3">
                        <template v-slot:selection="{ item }">
                            <span>{{ item.descripcion }} - S/ {{ fmt(item.precio) }}</span>
                        </template>
                        <template v-slot:item="{ item }">
                            <v-list-item-content>
                                <v-list-item-title>{{ item.descripcion }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    S/ <strong class="red--text">{{ fmt(item.precio) }}</strong>
                                    <span v-if="item.factor > 1" class="ml-2 grey--text">
                                        Factor: {{ item.factor }}
                                    </span>
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </template>
                    </v-select>

                    <!-- ============================================= -->
                    <!-- CANTIDAD Y DESCUENTOS -->
                    <!-- ============================================= -->
                    <v-text-field type="number" autofocus outlined dense v-model.number="cantidad"
                        :label="labelCantidad" min="0" @focus="$event.target.select()"
                        @keydown.enter="agrega_con_cantidad()">
                    </v-text-field>

                    <div v-if="factorActual > 1" class="text-caption grey--text mb-5 mt-n5">
                        Total unidades: <strong>{{ totalUnidades }}</strong> und
                    </div>

                    <descuentos-porcentaje ref="descuentosRef" :precio-base="precioBaseParaDescuento" :es-bono="false"
                        :decimales="$store.state.configuracion.decimal || 2" @cambio="onDescuentoCambio" class="my-2" />

                    <div class="text-caption mt-1"
                        v-if="descuentoAplicado.precioFinal && descuentoAplicado.precioFinal !== precioBaseParaDescuento">
                        Precio final: <strong class="green--text">S/ {{ fmt(descuentoAplicado.precioFinal) }}</strong>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-btn color="red" @click="agrega_con_cantidad()" block>AGREGAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog persistent v-model="progress" max-width="200">
            <v-card class="pa-12">
                <v-progress-circular :rotate="90" :size="100" :width="15" color="primary"
                    indeterminate></v-progress-circular>
            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import store from '@/store/index'
import DescuentosPorcentaje from '@/components/descuentos_porcentaje.vue'

export default {
    components: {
        DescuentosPorcentaje
    },
    data() {
        return {
            dial: false,
            arrayiconos: [],
            tamañoarray: 0,
            categoriaselecta: '',
            activaproductos: false,
            buscar: '',
            progress: false,
            dialo_cantidad: false,
            cantidad: 1,
            producto_selecto: '',
            obs_gen: [],
            observacionesSeleccionadas: [],
            observacion_can: '',
            producto_sele: '',
            precioSeleccionado: 1,
            descuentoAplicado: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 },
            opcionPrecioSeleccionada: 'fijo',
        }
    },
    created() {
        this.dial = true
    },
    mounted() {
        this.initialize()
    },
    methods: {
        filtroPorPalabras(item, queryText, itemText) {
            const query = (queryText || '').toLowerCase().split(' ')
            const texto = (itemText || '').toLowerCase()

            return query.every(palabra => texto.includes(palabra))
        },
        initialize() {
            //this.activaproductos=false
            this.arrayiconos = store.state.categorias
        },
        iraproductos(item) {
            this.buscar = ''
            this.categoriaselecta = item.nombre
            if (this.listafiltrada != '') {
                this.activaproductos = true
            }

        },
        prod_selecto(valor) {
            if (!valor) return; // Si no hay valor seleccionado, no hacer nada
            this.$nextTick(() => {
                this.producto_sele = "";
            });
            // Buscar el producto seleccionado en la lista del store
            const producto = store.state.productos.find(p => p.id === valor);
            if (producto) {
                // Filtrar las observaciones disponibles

                this.cantidad = 1;
                this.producto_selecto = producto;
                this.dialo_cantidad = true;
            }
        },
        abre_cantidad(valor) {
            if (valor) {
                this.cantidad = 1;
                this.producto_selecto = valor;
                this.opcionPrecioSeleccionada = 'fijo';
                this.descuentoAplicado = { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 };
                if (this.$refs.descuentosRef) {
                    this.$refs.descuentosRef.reset();
                }
                this.dialo_cantidad = true;
            }
        },
        onDescuentoCambio(data) {
            this.descuentoAplicado = data;
        },
        agrega_con_cantidad() {
            if (this.cantidad == '' || this.cantidad == 0) {
                this.cantidad = 1
            }

            var cant = parseFloat(this.cantidad)
            const opcion = this.opcionPrecioActual;
            if (!opcion) {
                store.commit('dialogosnackbar', 'Seleccione un precio');
                return;
            }
            if (this.producto_selecto.controstock) {
                const stockDisponible = Number(this.producto_selecto.stock || 0);
                const unidadesTotal = cant * opcion.factor;
                if (unidadesTotal > stockDisponible) {
                    store.commit('dialogosnackbar', 'Cantidad supera el stock disponible');
                    return;
                }
            }

            this.dialo_cantidad = false
            const precioBase = opcion.precio;
            const tieneDescuentos = this.descuentoAplicado.desc_1 > 0 ||
                this.descuentoAplicado.desc_2 > 0 ||
                this.descuentoAplicado.desc_3 > 0;

            const precioFinal = tieneDescuentos ? this.descuentoAplicado.precioFinal : precioBase;

            let medidaEmitida = opcion.esPresentacion
                ? (opcion.medida || opcion.descripcion)
                : (this.producto_selecto.medida || 'UNIDAD');

            const productoClonad = {
                ...this.producto_selecto,
                cantidad: this.cantidad,
                precio: Number(precioFinal.toFixed(4)),
                precio_base: Number(precioBase.toFixed(4)),
                medida: medidaEmitida,
                operacion: 'GRAVADA', 
                desc_1: this.descuentoAplicado.desc_1 || 0,
                desc_2: this.descuentoAplicado.desc_2 || 0,
                desc_3: this.descuentoAplicado.desc_3 || 0,

                _factor: opcion.factor || 1,
                _presentacion_id: opcion.esPresentacion ? opcion.presentacionId : null,
                _presentacion_nombre: opcion.esPresentacion ? opcion.descripcion : null,
            };

            this.$emit('array', productoClonad)

            if (this.producto_selecto.tiene_bono && Array.isArray(this.producto_selecto.lista_bono)) {
                const bonosOrdenados = [...this.producto_selecto.lista_bono]
                    .map(b => ({
                        ...b,
                        apartir_de: Number(b.apartir_de || 0),
                        cantidad: Number(b.cantidad || 0)
                    }))
                    .sort((a, b) => b.apartir_de - a.apartir_de);

                let cantidadRestante = this.cantidad * (opcion.factor || 1);

                bonosOrdenados.forEach(bono => {
                    const factor = Math.floor(cantidadRestante / bono.apartir_de);
                    if (factor >= 1) {
                        const productoBono = store.state.productos.find(p => p.id === bono.cod_producto);
                        if (productoBono) {
                            this.$emit('array', {
                                ...productoBono,
                                operacion: 'GRATUITA',
                                cantidad: factor * bono.cantidad,
                                precio: 0.01,
                                precio_base: 0,
                                observacion: ''
                            });
                            cantidadRestante -= factor * bono.apartir_de;
                        }
                    }
                });
            }

            if (store.state.configuracion.persistencia_catalogo) {
                this.dialog_progress()
            } else {
                this.cierra()
                this.activaproductos = false
                this.buscar = ''
            }
        },
        dialog_progress() {
            this.progress = true
            setTimeout(() =>
                this.progress = false, 400);
            this.buscar = ''
        },
        cierra() {
            this.activaproductos = false
            this.$emit('cierra', false)
        },
        fmt(v) {
            return (Number(v) || 0).toFixed(2);
        },

        tienePresentaciones(prod) {
            if (!prod || !prod.presentaciones) return false;
            const pres = prod.presentaciones;
            const activas = Object.values(pres).filter(p => p && p.activo !== false);
            return activas.length > 0;
        },

        obtenerPresentacionesActivas(prod) {
            if (!prod || !prod.presentaciones) return [];
            const pres = prod.presentaciones;
            const stock = Number(prod.stock || 0);

            return Object.entries(pres)
                .filter(([_, p]) => p && p.activo !== false)
                .map(([id, p]) => ({
                    id,
                    nombre: p.nombre || '',
                    medida: p.medida || 'UNIDAD',
                    factor: Number(p.factor) || 1,
                    precio: Number(p.precio) || 0,
                    activo: p.activo !== false,
                    stock_disp: Math.floor(stock / (Number(p.factor) || 1))
                }))
                .sort((a, b) => a.factor - b.factor);
        }, tieneBonoProducto(prod) {
            if (!prod?.id) return false;
            const tieneUnitario = !!(
                prod.tiene_bono &&
                Array.isArray(prod.lista_bono) &&
                prod.lista_bono.length > 0
            );
            const tieneGrupoBono = !!prod.grupo_bono;
            const tieneGrupoPrecio = !!prod.grupo_precio;

            return tieneUnitario || tieneGrupoBono || tieneGrupoPrecio;
        },

        
    },
    computed: {
        listafiltrada() {
            const invent = store.state.productos.filter(item => item.activo);
            const palabras = this.buscar.toLowerCase().split(/\s+/).filter(p => p);

            return invent.filter(item => {
                // Validamos por categoría si está activada la opción
                const dentroCategoria = !store.state.configuracion.ordencategorias ||
                    (item.categoria || '').toLowerCase().includes(this.categoriaselecta.toLowerCase());

                // Buscamos coincidencia de todas las palabras en el nombre del producto
                const nombre = (item.nombre || '').toLowerCase();
                const coincidePalabras = palabras.every(palabra => nombre.includes(palabra));

                return dentroCategoria && coincidePalabras;
            });
        },
        precioBaseParaDescuento() {
            if (!this.producto_selecto) return 0;
            if (this.precioSeleccionado === 2 && this.producto_selecto.precio2) {
                return Number(this.producto_selecto.precio2) || 0;
            }
            return Number(this.producto_selecto.precio) || 0;
        },
        opcionesPrecios() {
            if (!this.producto_selecto) return [];

            const opciones = [];

            opciones.push({
                id: 'fijo',
                descripcion: this.producto_selecto.medida || 'UNIDAD',
                precio: Number(this.producto_selecto.precio) || 0,
                factor: 1,
                esPresentacion: false
            });

            if (this.producto_selecto.precio2 && Number(this.producto_selecto.precio2) > 0) {
                opciones.push({
                    id: 'precio2',
                    descripcion: 'Precio 2',
                    precio: Number(this.producto_selecto.precio2) || 0,
                    factor: 1,
                    esPresentacion: false
                });
            }

            if (this.tienePresentaciones(this.producto_selecto)) {
                const presentaciones = this.obtenerPresentacionesActivas(this.producto_selecto);
                presentaciones.forEach(pres => {
                    opciones.push({
                        id: `pres_${pres.id}`,
                        descripcion: pres.nombre || pres.medida,
                        precio: pres.precio,
                        factor: pres.factor,
                        esPresentacion: true,
                        presentacionId: pres.id,
                        medida: pres.medida
                    });
                });
            }

            return opciones;
        },

        opcionPrecioActual() {
            return this.opcionesPrecios.find(o => o.id === this.opcionPrecioSeleccionada) || null;
        },

        labelCantidad() {
            if (this.opcionPrecioActual && this.opcionPrecioActual.esPresentacion) {
                return `Cantidad (${this.opcionPrecioActual.descripcion})`;
            }
            return 'Cantidad (UND)';
        },

        precioBaseParaDescuento() {
            if (this.opcionPrecioActual) {
                return this.opcionPrecioActual.precio;
            }
            return Number(this.producto_selecto?.precio) || 0;
        },

        factorActual() {
            if (this.opcionPrecioActual && this.opcionPrecioActual.factor > 1) {
                return this.opcionPrecioActual.factor;
            }
            return 1;
        },

        totalUnidades() {
            const q = Number(this.cantidad || 0);
            return q * this.factorActual;
        }
    }

}
</script>
