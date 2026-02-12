<template>
    <div content-class="dialogo-cantidad-centrado">
        <v-autocomplete v-if="!activaproductos && x_categoria" v-model="producto_sele" :items="productosFiltrados"
            item-text="displayText" item-value="id" :filter="filtrarProductos"
            :label="muestra_tabla ? 'Buscar Productos (F1)' : 'Buscar Productos'" clearable :auto-select-first="true"
            menu-props="{ maxHeight: '300px', auto: true }" outlined dense ref="buscarField"
            @keydown.native="detectarEntrada" :autofocus="!$store.state.esmovil && muestra_tabla"
            append-icon="mdi-magnify" :loading="cargando" :search-input.sync="buscar"
            no-data-text="No se encontraron productos" @change="prod_selecto">
            <template v-slot:item="{ item }">
                <v-list-item-content>
                    <v-list-item-title>
                        <span class="text-caption grey--text text--darken-2">
                            {{ (item.categoria || '').slice(0, 4).toUpperCase() }}
                        </span>
                        — <strong class="red--text">{{ item.cod_interno }}</strong> / {{ item.nombre }}
                        <small v-if="$store.state.configuracion && $store.state.configuracion.mostrar_codigo"
                            class="grey--text text--darken-1">
                            ({{ item.id }})
                        </small>
                        — <strong class="red--text"> {{ monedaSimbolo }} {{ Number(item.precio || 0).toFixed(2)
                            }}</strong>
                    </v-list-item-title>
                    <v-list-item-subtitle class="mt-n1 mb-n2">
                        <span class="text-caption"
                            :class="Number(item.stock) > 0 ? 'green--text text--darken-2' : 'orange--text text--darken-1'">
                            Stock: <strong> {{ convierte_stock(item.stock, item.factor) }}</strong>
                        </span>
                    </v-list-item-subtitle>
                </v-list-item-content>
            </template>

        </v-autocomplete>
        <v-card class="elevation-6" v-show="muestra_tabla" v-if="x_categoria">


            <v-simple-table v-if="!activaproductos" fixed-header class="pa-1 mt-n3"
                style="height: calc(80vh - 80px); overflow-y: auto;">
                <template v-slot:default>
                    <thead></thead>
                    <tbody>
                        <v-row class="mt-1 mb-4 mx-auto text-center" dense>
                            <v-col v-for="item in $store.state.categorias" :key="item.id" cols="6" class="pa-1">
                                <v-card class="hoverable d-flex align-center justify-center"
                                    @click.prevent="iraproductos(item)" style="height: 65px;">
                                    <v-card-text class="text-center pa-1">
                                        <span class="text-body-5 font-weight-medium">{{ item.nombre }}</span>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </tbody>
                </template>
            </v-simple-table>
            <div v-if="activaproductos">
                <v-card-title>
                    <v-btn icon class="ml-2 mt-n1" @click="regresar">
                        <v-icon color="red">mdi-arrow-left</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-text-field ref="buscarField" class="mb-n1 mt-n2" outlined dense v-model="buscar"
                        append-icon="mdi-magnify" label="Buscar" single-line hide-details
                        :autofocus="!$store.state.esmovil"></v-text-field>
                </v-card-title>
                <v-simple-table fixed-header height="65vh" dense class="elevation-6">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Nombre</th>
                                <th class="text-left">Stock</th>
                                <th class="text-left">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in listafiltrada" :key="item.id" @click="prod_selecto2(item)">
                                <td class=" text-body-2"><span>{{
                                    item.cod_interno }}-</span>{{ item.nombre }}</td>
                                <td class="text-body-2">{{ convierte_stock(item.stock, item.factor) }}</td>
                                <td class="text-body-2">{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </div>
        </v-card>
        <v-card class="elevation-6" v-show="muestra_tabla" v-if="!x_categoria">

            <div>
                <v-card-title>
                    <v-text-field ref="buscarField" class="mb-n1 mt-n2" outlined dense v-model="buscar"
                        append-icon="mdi-magnify" label="Buscar" single-line hide-details
                        :autofocus="!$store.state.esmovil"></v-text-field>
                </v-card-title>
                <v-simple-table fixed-header height="65vh" dense class="elevation-6">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">Nombre</th>
                                <th class="text-left">Stock</th>
                                <th class="text-left">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in listafiltrada" :key="item.id" @click="prod_selecto2(item)">
                                <td style="font-size:75%;"><span>
                                        <Strong class="red--text">{{ item.cod_interno }} </Strong> - </span> {{
                                            item.nombre }}</td>
                                <td style="font-size:75%;">{{ convierte_stock(item.stock, item.factor) }}</td>
                                <td style="font-size:75%;">{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </div>
        </v-card>
        <v-dialog v-model="dialo_cantidad" max-width="300px">
            <v-card>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <IndicadorBono v-if="producto_selecto && tieneBonoProducto(producto_selecto)"
                        :producto="producto_selecto"
                        :bonos-globales="$store.state.bonos ? Object.values($store.state.bonos).filter(b => b && b.activo) : []"
                        :solo-icono="false" class="mr-2" />
                    <v-checkbox v-if="$store.state.permisos.edita_bono" v-model="es_bono" label="ES BONO"></v-checkbox>
                </v-system-bar>
                <v-card-text class="mt-4">

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
                            <span>{{ item.descripcion }} - {{ monedaSimbolo }} {{ fmt(item.precio) }}</span>
                        </template>
                        <template v-slot:item="{ item }">
                            <v-list-item-content>
                                <v-list-item-title>{{ item.descripcion }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ monedaSimbolo }} <strong class="red--text">{{ fmt(item.precio) }}</strong>
                                    <span v-if="item.factor > 1" class="ml-2 grey--text">
                                        Factor: {{ item.factor }}
                                    </span>
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </template>
                    </v-select>

                    <!-- ============================================= -->
                    <!-- CANTIDAD Y DESCUENTOS (común para ambos modos) -->
                    <!-- ============================================= -->
                    <div v-if="producto_selecto" class="mb-2">
                        <v-row dense>
                            <v-col cols="12">
                                <v-text-field type="number" outlined dense v-model.number="cantidadInput"
                                    :label="labelCantidad" min="0" @focus="$event.target.select()" autofocus
                                    @keydown.enter="agrega_con_cantidad()" />
                            </v-col>
                        </v-row>

                        <descuentos-porcentaje ref="descuentosRef" :precio-base="precioBaseParaDescuento"
                            :es-bono="es_bono" :decimales="$store.state.configuracion.decimal || 2"
                            @cambio="onDescuentoCambio" />

                        <div class="text-caption mt-1">
                            Total a vender: <strong>{{ totalUnidades }}</strong> und
                            <span
                                v-if="descuentoAplicado.precioFinal && descuentoAplicado.precioFinal !== precioBaseParaDescuento"
                                class="ml-2 green--text">
                                | Precio final: {{ monedaSimbolo }} {{ descuentoAplicado.precioFinal }}
                            </span>
                        </div>
                    </div>
                    <v-text-field ref="cantidadRef" v-if="false" type="number" autofocus outlined dense
                        v-model="cantidad" label="CANTIDAD" @focus="$event.target.select(); centrarDialogoLuego()"
                        @keydown.enter="agrega_con_cantidad()"></v-text-field>
                </v-card-text>

                <v-card-actions>
                    <v-btn class="mt-n7" color="red" @click="agrega_con_cantidad()" block>OK</v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>
        <v-snackbar v-if="muestra_tabla" v-model="snackAgregar" :timeout="2000" top right color="success" elevation="2"
            content-class="d-flex align-center">
            <v-icon left small class="mr-2">mdi-check-circle</v-icon>
            {{ snackMsg }}
        </v-snackbar>
    </div>
</template>

<script>
import store from '@/store/index'
import DescuentosPorcentaje from '@/components/descuentos_porcentaje.vue'
import IndicadorBono from '@/views/productos/components/IndicadorBono.vue'
export default {
    name: 'catalogo_fijo',
    components: {
        DescuentosPorcentaje,
        IndicadorBono
    },

    props: {
        data: [],
        muestra_tabla: null,
        x_categoria: true,
        lista_precios: {
            type: Array,
            default: () => ['1', '2', '3']
        }
    },
    data() {
        return {
            activaproductos: false,
            producto_sele: '',
            buscar: '',
            cantidad: '',
            producto_selecto: '',
            dialo_cantidad: false,
            categoriaselecta: '',
            cargando: false,
            tiempoBusqueda: null,
            tiempoUltimaTecla: 0,
            esCodigoDeBarras: false,
            codigoIngresado: '',
            precioSeleccionado: null,
            modoVenta: 'fraccion',
            cantidadInput: 1,
            cantCajas: 0,
            cantUnd: 0,
            snackAgregar: false,
            snackMsg: 'Producto agregado',
            es_bono: false,
            moneda: 'S/ ',
            descuentoAplicado: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 },
            presentacionSeleccionada: null,
            opcionPrecioSeleccionada: 'fijo'
        }
    },
    computed: {
        // Mostrar presentaciones cuando la medida es diferente a UNIDAD
        usaPresentaciones() {
            if (!this.producto_selecto) return false;
            const med = (this.producto_selecto.medida || '').toUpperCase().trim();
            return med !== '' && med !== 'UNIDAD';
        },
        // Opciones de precios para el v-select: precio fijo + presentaciones
        opcionesPrecios() {
            if (!this.producto_selecto) return [];

            const opciones = [];

            // Opción fija (precio base del producto)
            opciones.push({
                id: 'fijo',
                descripcion: this.producto_selecto.medida || 'UNIDAD',
                precio: Number(this.producto_selecto.precio) || 0,
                factor: 1,
                esPresentacion: false
            });

            // Si tiene presentaciones activas, agregarlas
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
        // Opción de precio actualmente seleccionada
        opcionPrecioActual() {
            return this.opcionesPrecios.find(o => o.id === this.opcionPrecioSeleccionada) || null;
        },
        // Lista de presentaciones activas del producto
        presentacionesActivas() {
            if (!this.producto_selecto || !this.producto_selecto.presentaciones) return [];
            const pres = this.producto_selecto.presentaciones;
            const stock = Number(this.producto_selecto.stock || 0);

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
        },
        // Presentación actualmente seleccionada
        presentacionActual() {
            if (!this.presentacionSeleccionada) return null;
            return this.presentacionesActivas.find(p => p.id === this.presentacionSeleccionada) || null;
        },
        // Label dinámico para el campo cantidad
        labelCantidad() {
            if (this.opcionPrecioActual && this.opcionPrecioActual.esPresentacion) {
                return `Cantidad (${this.opcionPrecioActual.descripcion})`;
            }

            if (this.producto_selecto) {
                const medida = this.producto_selecto.medida || 'UND';
                return `Cantidad (${medida})`;
            }

            return 'Cantidad (UND)';
        },
        precioBaseParaDescuento() {
            if (!this.producto_selecto) return 0;

            // Usar el precio de la opción seleccionada
            if (this.opcionPrecioActual) {
                return this.opcionPrecioActual.precio;
            }

            return Number(this.producto_selecto.precio) || 0;
        },
        totalUnidades() {
            if (!this.producto_selecto) return 0;
            const q = Number(this.cantidadInput || 0);

            // Si hay opción seleccionada con factor, calcular con ese factor
            if (this.opcionPrecioActual && this.opcionPrecioActual.factor > 1) {
                return q * this.opcionPrecioActual.factor;
            }

            return q;
        },
        listafiltrada() {
            var invent = store.state.productos
            return invent.filter((item) =>
                (item.activo) == true)
                .filter((item) => (item.categoria)
                    .toLowerCase().includes(this.categoriaselecta.toLowerCase()))
                .filter((item) => (item.cod_interno + item.nombre + item.id)
                    .toLowerCase().includes(this.buscar.toLowerCase()))

        },
        productosFiltrados() {

            return store.state.productos
                .filter(item => item.activo) // Solo productos activos
                .map(item => ({
                    ...item,
                    displayText: `${item.cod_interno} ${item.nombre} (${item.codbarra})` // Concatenamos nombre y código de barras
                }));


        },
        tierVisual() {
            return (this.precioSeleccionado === null || this.precioSeleccionado === undefined)
                ? this._tierSugerido
                : this.precioSeleccionado;
        },
        esPrecioEstricto() {
            return this.$store.state.permisos.permite_editar_precio === true;
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m =>
                m.codigo === this.$store.state.configuracion?.moneda_defecto
            )?.simbolo || 'S/';
        },

    },
    mounted() {
        this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        window.addEventListener("keydown", this.detectarTecla);
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
    },


    watch: {
        cantidadInput() {
            if (this.producto_selecto && this.precioSeleccionado === null) {
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);
            }
        },
        modoVenta() {
            if (this.producto_selecto && this.precioSeleccionado === null) {
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);
            }
        },
        cantidad(nv) {
            // si está en modo auto (null), ajusta chip sugerido visualmente
            if (this.producto_selecto && this.precioSeleccionado === null) {
                const tier = this.sugerirTier(this.producto_selecto, this.toNum(nv || 1, 1));
                // solo pinta los chips; sigue en auto (null)
                this._tierSugerido = tier;
            }
        },
        producto_selecto(nv) {
            if (nv) {
                // Seleccionar precio fijo por defecto
                this.opcionPrecioSeleccionada = 'fijo';
                this.cantidadInput = 1;
            }
        },
        cantCajas() {
            if (this.producto_selecto && this.precioSeleccionado === null) {
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);
            }
        },
        cantUnd() {
            if (this.producto_selecto && this.precioSeleccionado === null) {
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);
            }
        },
    },
    created() {

        this.buscar = ''
        this._tierSugerido = 1; // estado interno para pintar sugerencia
    },
    methods: {
        // Verificar si un producto tiene presentaciones configuradas
        tienePresentaciones(prod) {
            if (!prod || !prod.presentaciones) return false;
            const pres = prod.presentaciones;
            const activas = Object.values(pres).filter(p => p && p.activo !== false);
            return activas.length > 0;
        },

        // Obtener presentaciones activas de un producto
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
        },

        tieneBonoProducto(prod) {
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

        precioChip(producto, tier) {
            const base = this.precioPorTier(producto, tier);      // precio por UNIDAD según tier
            const f = this.getFactor(producto);
            return (this.modoVenta === 'entero' && f > 1) ? base * f : base; // si es CAJA, multiplica
        },
        fmt(v) {
            return (Number(v) || 0).toFixed(2);
        },
        seleeciona_modo(m) {
            if (m === 'entero' && this.getFactor(this.producto_selecto) <= 1) return;
            this.modoVenta = m === 'entero' ? 'entero' : 'fraccion';
            // Por UX, si estaba en 0, pon 1
            if (!Number(this.cantidadInput)) this.cantidadInput = 1;
        },
        getFactor(p) {
            const f = Number(p && p.factor);
            return Number.isFinite(f) && f > 0 ? f : 1;
        },
        filtrarProductos(item, queryText, itemText) {
            // Convertimos todo a minúsculas y eliminamos espacios extra
            const textoItem = itemText.toLowerCase().trim();
            const palabrasQuery = queryText.toLowerCase().trim().split(/\s+/);

            // Verificamos que cada palabra escrita esté presente en el texto del item
            return palabrasQuery.every(palabra => textoItem.includes(palabra));
        },
        detectarTecla(event) {
            if (event.key === "F1") {
                event.preventDefault();
                this.enfocarInput();
            }

        },
        enfocarInput() {
            this.$nextTick(() => {
                this.$refs.buscarField.focus(); // Método para enfocar el campo
            })
        },
        detectarEntrada(event) {
            const ahora = new Date().getTime();
            const diferencia = ahora - this.tiempoUltimaTecla;
            this.tiempoUltimaTecla = ahora;
            if (diferencia < 50) {
                // Se asume que es lector de código de barra
                this.esCodigoDeBarras = true;
                this.codigoIngresado += event.key;

            } else {
                // Se asume que es teclado
                this.esCodigoDeBarras = false;
                this.codigoIngresado = event.key;
            }
        },
        agrega_con_cantidad() {
            const q = this.toNum(this.cantidadInput, 0);

            if (!q || q <= 0) {
                store.commit("dialogosnackbar", "Ingrese una cantidad mayor a 0");
                return;
            }

            // Obtener la opción de precio seleccionada
            const opcion = this.opcionPrecioActual;
            if (!opcion) {
                store.commit("dialogosnackbar", "Seleccione un precio");
                return;
            }

            const factor = opcion.factor || 1;
            const unidadesTotal = q * factor;

            // Validar stock
            if (this.producto_selecto.controstock) {
                const stockDisponible = Number(this.producto_selecto.stock || 0);
                if (unidadesTotal > stockDisponible) {
                    store.commit("dialogosnackbar", "Cantidad supera el stock disponible");
                    return;
                }
            }

            this.dialo_cantidad = false;

            let precioEmitido = opcion.precio;

            const tieneDescuentos = this.descuentoAplicado.desc_1 > 0 ||
                this.descuentoAplicado.desc_2 > 0 ||
                this.descuentoAplicado.desc_3 > 0;

            if (tieneDescuentos && !this.es_bono) {
                precioEmitido = this.descuentoAplicado.precioFinal;
            }

            const ope = this.es_bono
                ? 'GRATUITA'
                : (this.producto_selecto.operacion || 'GRAVADA');

            // Determinar medida
            let medidaEmitida = opcion.esPresentacion
                ? (opcion.medida || opcion.descripcion)
                : (this.producto_selecto.medida || 'UNIDAD');

            const linea = {
                ...this.producto_selecto,
                operacion: ope,
                cantidad: q,
                precio: Number(precioEmitido.toFixed(4)),
                precio_base: Number(opcion.precio.toFixed(4)),
                medida: medidaEmitida,
                factor: factor,
                _unidades: unidadesTotal,
                _presentacion_id: opcion.esPresentacion ? opcion.presentacionId : null,
                _presentacion_nombre: opcion.esPresentacion ? opcion.descripcion : null,
                desc_1: this.descuentoAplicado.desc_1 || 0,
                desc_2: this.descuentoAplicado.desc_2 || 0,
                desc_3: this.descuentoAplicado.desc_3 || 0,
            };

            this.$emit('agrega_lista', linea);
            this.avisarAgregado();

            this.$nextTick(() => {
                this.observacionesSeleccionadas = [];
                this.observacion_can = '';
                this.$refs.buscarField && this.$refs.buscarField.focus();
            });
        },



        prod_selecto(valor) {
            if (!valor) return;
            this.$nextTick(() => {
                this.producto_sele = "";
            });
            const producto = store.state.productos.find(p => p.id === valor);
            if (producto.controstock && producto.stock <= 0) {
                store.commit("dialogosnackbar", 'sin stock');
                return;
            }
            if (producto) {
                if (this.esCodigoDeBarras) {
                    producto.cantidad = 1
                    this.buscar = ''
                    this.$emit('agrega_lista', producto)
                    this.$nextTick(() => {
                        this.observacionesSeleccionadas = [];
                        this.observacion_can = ''
                        this.$refs.buscarField.focus();
                    });
                    return
                }
                this.cantidadInput = 1;
                this.producto_selecto = producto;
                this.es_bono = false;
                if (this.$refs.descuentosRef) {
                    this.$refs.descuentosRef.reset();
                }
                this.dialo_cantidad = true;
                this.cantCajas = 0;
                this.cantUnd = 1;
                this.precioSeleccionado = null;
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);

            }
        },
        prod_selecto2(valor) {
            if (valor.controstock && valor.stock <= 0) {
                store.commit("dialogosnackbar", 'sin stock');
                return;
            }
            if (!valor) return;
            this.$nextTick(() => {
                this.producto_sele = "";
            });
            if (valor) {
                this.cantidadInput = 1;
                this.producto_selecto = valor;
                this.precioSeleccionado = null;
                this.es_bono = false;
                if (this.$refs.descuentosRef) {
                    this.$refs.descuentosRef.reset();
                }
                this.dialo_cantidad = true;
                this.cantCajas = 0;
                this.cantUnd = 1;
                this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);

            }
        },
        iraproductos(item) {
            this.buscar = ''
            this.categoriaselecta = item.nombre
            if (this.listafiltrada != '') {
                this.activaproductos = true
            }

        },
        regresar() {
            this.activaproductos = false
        },
        // --- Helpers numéricos seguros
        toNum(v, def = 0) {
            const n = Number(v);
            return Number.isFinite(n) ? n : def;
        },
        tieneMay1(p) {
            return this.toNum(p && p.precio_may1, 0) > 0 && this.toNum(p && p.escala_may1, 0) > 0;
        },
        tieneMay2(p) {
            return this.toNum(p && p.precio_may2, 0) > 0 && this.toNum(p && p.escala_may2, 0) > 0;
        },

        // --- Devuelve 1=precio normal, 2=may1, 3=may2 según cantidad
        sugerirTier(producto, cantidadRaw) {
            // ✅ Si solo hay una lista activa, usa esa (1:precio, 2:may1, 3:may2)
            const only = this.singleListId();
            if (only) return only;

            const cantidad = this.toNum(cantidadRaw, 0);
            const hayMay1 = this.tieneMay1(producto);
            const hayMay2 = this.tieneMay2(producto);

            if (!hayMay1 && !hayMay2) return 1;

            if (hayMay1 && !hayMay2 && this.buscar_activo_precio(2)) {
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                return cantidad >= esc1 ? 2 : 1;
            }

            if (hayMay1 && hayMay2) {
                // Si no está activa la 3, igual permite caer en 2 si la 2 está activa
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                const lim1 = Math.min(esc1, esc2);
                const lim2 = Math.max(esc1, esc2);

                if (this.buscar_activo_precio(3) && cantidad >= lim2) return 3;
                if (this.buscar_activo_precio(2) && cantidad >= lim1) return 2;
                return 1;
            }

            // solo may2 (raro)
            if (!hayMay1 && hayMay2) {
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                return (this.buscar_activo_precio(3) && cantidad >= esc2) ? 3 : 1;
            }

            return 1;
        },


        precioPorTier(producto, tier) {
            // ✅ Si solo hay una lista activa, usa SIEMPRE esa
            const only = this.singleListId();
            if (only === 3) return this.toNum(producto.precio_may2, this.toNum(producto.precio, 0));
            if (only === 2) return this.toNum(producto.precio_may1, this.toNum(producto.precio, 0));
            if (only === 1) return this.toNum(producto.precio, 0);

            // 🔁 Lógica original (respetando tier)
            if (tier === 3) return this.toNum(producto.precio_may2, this.toNum(producto.precio, 0));
            if (tier === 2) return this.toNum(producto.precio_may1, this.toNum(producto.precio, 0));
            return this.toNum(producto.precio, 0);
        },
        singleListId() {
            const arr = (this.lista_precios || []).map(x => Number(x)).filter(Number.isFinite);
            return arr.length === 1 ? arr[0] : null; // 1 | 2 | 3 | null
        },
        convierte_stock(stock, factor) {
            const s = Number(stock);
            const f = Number(factor);

            // Si factor es 1, null, undefined, NaN o <= 1 → devuelve el stock tal cual
            if (!Number.isFinite(f) || f <= 1) return String(stock);

            if (!Number.isFinite(s)) return String(stock); // por si viene algo no numérico

            const cajas = Math.floor(s / f);
            const und = s - cajas * f;
            return `${cajas}/${und}`;
        },
        centrarDialogoLuego() {
            // espera 500ms para que el teclado/viewport termine de moverse
            this.$nextTick(() => {
                setTimeout(() => {
                    // fuerza centrado del overlay activo del diálogo
                    const overlay = document.querySelector('.v-dialog__content.v-dialog__content--active');
                    if (overlay) {
                        overlay.style.display = 'flex';
                        overlay.style.alignItems = 'center';
                        overlay.style.justifyContent = 'center';
                        // opcional: asegura alto de viewport para que el centrado vertical funcione
                        overlay.style.height = '100vh';
                    }

                    const input = this.$refs.cantidadRef && (this.$refs.cantidadRef.$el.querySelector('input'));
                    if (input && input.scrollIntoView) {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 200);
            });
        },

        buscar_activo_precio(num) {
            return this.lista_precios.includes(String(num))
        },
        avisarAgregado(msg = 'Producto Agregado') {
            console.log(this.muestra_tabla)
            if (this.muestra_tabla) {
                this.snackMsg = msg;
                this.$nextTick(() => { this.snackAgregar = true; });
            }
        },
        onDescuentoCambio(data) {
            console.log(data)
            this.descuentoAplicado = data;
        },

    }
}
</script>
<style scoped>
.dialogo-cantidad-centrado {
    display: flex !important;
    align-items: center !important;
    /* centra vertical */
    justify-content: center !important;
    /* centra horizontal */
}
</style>