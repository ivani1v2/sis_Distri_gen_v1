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

                <v-simple-table fixed-header height="60vh">
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
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.stock }}</td>
                                <td>{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </div>
        </v-card>
        <v-dialog v-model="dialo_cantidad" max-width="300px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = !dialo_cantidad">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-text class="">
                    <div class="mb-3 text-center" v-if="producto_selecto">
                        <v-chip class="ma-1" outlined :color="precioSeleccionado === 1 ? 'red' : 'grey lighten-2'"
                            :text-color="precioSeleccionado === 1 ? 'black' : 'black'"
                            :input-value="precioSeleccionado === 1" @click="precioSeleccionado = 1">
                            S/ {{ Number(producto_selecto.precio).toFixed(2) }}
                        </v-chip>

                        <v-chip class="ma-1" outlined :color="precioSeleccionado === 2 ? 'red' : 'grey lighten-2'"
                            :text-color="precioSeleccionado === 2 ? 'black' : 'black'"
                            :input-value="precioSeleccionado === 2" @click="precioSeleccionado = 2"
                            v-if="producto_selecto.precio2">
                            S/ {{ Number(producto_selecto.precio2).toFixed(2) }}
                        </v-chip>
                    </div>

                    <v-text-field type="number" autofocus outlined dense v-model="cantidad" label="CANTIDAD"
                        @focus="$event.target.select()" @keydown.enter="agrega_con_cantidad()"></v-text-field>
                </v-card-text>

                <v-btn class="mt-n6" color="red" @click="agrega_con_cantidad()" block>OK</v-btn>

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

export default {

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
            if (valor.stock <= 0) {
                alert('SIN STOCK')
                return
            }

            if (valor) {
                // Filtrar las observaciones disponibles

                this.cantidad = 1;
                this.producto_selecto = valor;
                this.dialo_cantidad = true;
            }
        },
        agrega_con_cantidad() {
            if (this.cantidad == '' || this.cantidad == 0) {
                this.cantidad = 1
            }

            var cant = parseFloat(this.cantidad)
            this.producto_selecto.cantidad = cant

            this.dialo_cantidad = false
            const productoClonad = {
                ...this.producto_selecto,
                cantidad: this.cantidad,
            };

            // Asignar el precio correcto según selección
            if (this.precioSeleccionado === 2 && this.producto_selecto.precio2) {
                productoClonad.precio = this.producto_selecto.precio2;
            }
            this.$emit('array', productoClonad)
            if (this.producto_selecto.tiene_bono && Array.isArray(this.producto_selecto.lista_bono)) {
                const bonosOrdenados = [...this.producto_selecto.lista_bono]
                    .map(b => ({
                        ...b,
                        apartir_de: Number(b.apartir_de || 0),
                        cantidad: Number(b.cantidad || 0)
                    }))
                    .sort((a, b) => b.apartir_de - a.apartir_de); // Mayor a menor

                let cantidadRestante = this.cantidad;

                bonosOrdenados.forEach(bono => {
                    const factor = Math.floor(cantidadRestante / bono.apartir_de);
                    if (factor >= 1) {
                        const productoBono = store.state.productos.find(p => p.id === bono.cod_producto);
                        if (productoBono) {
                            this.$emit('array', {
                                ...productoBono,
                                operacion: 'GRATUITA',
                                cantidad: factor * bono.cantidad,
                                precio: 1,
                                observacion: ''
                            });
                            // Descuenta la cantidad usada para este tramo
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
        }
    }

}
</script>
