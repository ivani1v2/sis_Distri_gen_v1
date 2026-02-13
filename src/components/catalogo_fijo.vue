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
                        — {{ item.nombre }}
                        <small v-if="$store.state.configuracion && $store.state.configuracion.mostrar_codigo"
                            class="grey--text text--darken-1">
                            ({{ item.id }})
                        </small>
                        — <strong class="red--text"> {{ moneda }} {{ Number(item.precio || 0).toFixed(2) }}</strong>
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
                                <v-card class="hoverable" @click.prevent="iraproductos(item)"
                                    style="height: 65px; overflow: hidden;">
                                    <v-card-text class="text-center"
                                        style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
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
                                <td class=" text-body-2"><span v-if="$store.state.configuracion.mostrar_codigo">{{
                                    item.id }}-</span>{{ item.nombre }}</td>
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
                                <td style="font-size:75%;"><span v-if="$store.state.configuracion.mostrar_codigo">{{
                                    item.id }}-</span> {{ item.nombre }}</td>
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
                    <!-- Selector CAJAS + UND simultáneos -->
                    <div class="text-caption grey--text text--darken-1" v-if="getFactor(producto_selecto) > 1">
                        Stock:
                        <strong>{{ Math.floor(Number(producto_selecto.stock || 0) / getFactor(producto_selecto))
                            }}</strong>
                        cajas
                        + <strong>{{ Number(producto_selecto.stock || 0) % getFactor(producto_selecto) }}</strong> und
                        (total <strong>{{ producto_selecto.stock }}</strong> und)
                    </div>
                    <v-row class="pa-1" v-if="producto_selecto && getFactor(producto_selecto) > 1">
                        <v-col cols="6">
                            <v-btn small block :outlined="modoVenta !== 'entero'"
                                :color="modoVenta === 'entero' ? 'success' : undefined"
                                :disabled="getFactor(producto_selecto) <= 1" @click="seleeciona_modo('entero')">
                                {{ producto_selecto.medida || 'CAJA' }} x {{ getFactor(producto_selecto)  }}
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn small block :outlined="modoVenta !== 'fraccion'"
                                :color="modoVenta === 'fraccion' ? 'success' : undefined"
                                @click="seleeciona_modo('fraccion')">
                                UND.
                            </v-btn>
                        </v-col>
                    </v-row>
                    <div class="mb-3 mt-1" v-if="producto_selecto && buscar_activo_precio(1)">
                        <v-select v-model="precioSeleccionadoSelect" :items="opcionesPrecioSelect" item-text="text"
                            item-value="value" outlined dense hide-details label="Precio" :disabled="esPrecioEstricto">
                            <template v-slot:selection="{ item }">
                                <span>
                                    {{ item.text }}
                                    <span v-if="item.sugerido" class="ml-2 grey--text text--darken-1">
                                        
                                    </span>
                                </span>
                            </template>

                            <template v-slot:item="{ item }">
                                <div class="d-flex flex-column">
                                    <div class="font-weight-medium">
                                        {{ item.text }}
                                        <v-icon x-small class="ml-1" v-if="item.sugerido">mdi-robot</v-icon>
                                    </div>
                                    <div class="text-caption grey--text text--darken-1">
                                        {{ item.sub }}
                                    </div>
                                </div>
                            </template>
                        </v-select>

              <div class="text-caption mt-1 grey--text text--darken-1" v-if="opcionesPrecioSelect.some(x => x.value === null)">
  Si eliges <strong>AUTO</strong>, el sistema aplica la escala según la cantidad.
</div>

                    </div>

                    <div class="mb-3 text-center" v-if="false">
                        <!-- Precio normal -->
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                                <v-chip x-small class="ma-1" outlined
                                    :color="tierVisual === 1 ? 'red' : 'grey lighten-2'"
                                    :text-color="tierVisual === 1 ? 'black' : 'black'" :input-value="tierVisual === 1"
                                    @click="!esPrecioEstricto && (precioSeleccionado = 1)" :disabled="esPrecioEstricto">
                                    S/ {{ fmt(precioChip(producto_selecto, 1)) }}
                                    <span class="ml-1 caption grey--text text--darken-1"
                                        v-if="tieneMay1(producto_selecto)">
                                        (&lt; {{ producto_selecto.escala_may1 }})
                                    </span>
                                    <v-icon x-small class="ml-1"
                                        v-if="precioSeleccionado === null && _tierSugerido === 1">mdi-robot</v-icon>
                                </v-chip>

                            </template>
                            <span v-if="tieneMay1(producto_selecto)">
                                Aplica cuando la cantidad es menor a {{ producto_selecto.escala_may1 }} unidades.
                            </span>
                            <span v-else>Precio sin mayoreo.</span>
                        </v-tooltip>

                        <!-- Mayoreo 1 -->
                        <v-tooltip bottom v-if="tieneMay1(producto_selecto) && this.buscar_activo_precio(2)">
                            <template v-slot:activator="{ on, attrs }">
                                <v-chip x-small class="ma-1" outlined
                                    :color="tierVisual === 2 ? 'red' : 'grey lighten-2'"
                                    :text-color="tierVisual === 2 ? 'black' : 'black'" :input-value="tierVisual === 2"
                                    @click="!esPrecioEstricto && (precioSeleccionado = 2)" :disabled="esPrecioEstricto">
                                    S/ {{ fmt(precioChip(producto_selecto, 2)) }}
                                    <span class="ml-1 caption grey--text text--darken-1">
                                        (desde {{ producto_selecto.escala_may1 }})
                                    </span>
                                    <v-icon x-small class="ml-1"
                                        v-if="precioSeleccionado === null && _tierSugerido === 2">mdi-robot</v-icon>
                                </v-chip>

                            </template>
                            <span v-if="tieneMay2(producto_selecto)">
                                Aplica desde {{ producto_selecto.escala_may1 }} hasta antes de {{
                                    producto_selecto.escala_may2
                                }} unidades.
                            </span>
                            <span v-else>
                                Aplica desde {{ producto_selecto.escala_may1 }} unidades en adelante.
                            </span>
                        </v-tooltip>

                        <!-- Mayoreo 2 -->
                        <v-tooltip bottom v-if="tieneMay2(producto_selecto) && this.buscar_activo_precio(3)">
                            <template v-slot:activator="{ on, attrs }">
                                <v-chip class="ma-1" outlined :color="tierVisual === 3 ? 'red' : 'grey lighten-2'"
                                    :text-color="tierVisual === 3 ? 'black' : 'black'" :input-value="tierVisual === 3"
                                    @click="!esPrecioEstricto && (precioSeleccionado = 3)" :disabled="esPrecioEstricto">
                                    S/ {{ fmt(precioChip(producto_selecto, 3)) }}
                                    <span class="ml-1 caption grey--text text--darken-1">
                                        (desde {{ producto_selecto.escala_may2 }})
                                    </span>
                                    <v-icon x-small class="ml-1"
                                        v-if="precioSeleccionado === null && _tierSugerido === 3">mdi-robot</v-icon>
                                </v-chip>
                            </template>
                            <span>Aplica desde {{ producto_selecto.escala_may2 }} unidades en adelante.</span>
                        </v-tooltip>

                        <!-- Botón para volver a AUTO -->
                        <div class="mt-2" v-if="false">
                            <v-btn x-small text color="primary" @click="precioSeleccionado = null">
                                Usar precio automático por cantidad
                            </v-btn>
                        </div>
                    </div>

                    <div v-if="producto_selecto" class="mb-2">
                        <v-row dense>
                            <v-col cols="12">
                                <v-text-field type="number" outlined dense v-model.number="cantidadInput" :label="modoVenta === 'entero'
                                    ? `Cantidad (${producto_selecto.medida || 'CAJA'})`
                                    : 'Cantidad (UND)'" min="0" @focus="$event.target.select()" autofocus
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
                                | Precio final: S/ {{ descuentoAplicado.precioFinal }}
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
            descuentoAplicado: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 }
        }
    },
    computed: {
        precioBaseParaDescuento() {
            if (!this.producto_selecto) return 0;
            const tier = this.precioSeleccionado ?? this.sugerirTier(this.producto_selecto, this.totalUnidades);
            const precioUnidad = this.precioPorTier(this.producto_selecto, tier);
            const factor = this.getFactor(this.producto_selecto);
            return this.modoVenta === 'entero' ? precioUnidad * factor : precioUnidad;
        },
        totalUnidades() {
            if (!this.producto_selecto) return 0;
            const f = this.getFactor(this.producto_selecto);
            const q = Number(this.cantidadInput || 0);
            return this.modoVenta === 'entero' ? q * f : q;
        },
        listafiltrada() {
            var invent = store.state.productos
            return invent.filter((item) =>
                (item.activo) == true)
                .filter((item) => (item.categoria)
                    .toLowerCase().includes(this.categoriaselecta.toLowerCase()))
                .filter((item) => (item.nombre + item.id)
                    .toLowerCase().includes(this.buscar.toLowerCase()))

        },
        productosFiltrados() {
            if (store.state.configuracion.mostrar_codigo) {
                return store.state.productos
                    .filter(item => item.activo)
                    .map(item => ({
                        ...item,
                        displayText: `${item.id} ${item.nombre} (${item.codbarra})`
                    }));
            } else {
                return store.state.productos
                    .filter(item => item.activo) // Solo productos activos
                    .map(item => ({
                        ...item,
                        displayText: `${item.nombre} (${item.codbarra})` // Concatenamos nombre y código de barras
                    }));
            }

        },
        tierVisual() {
            return (this.precioSeleccionado === null || this.precioSeleccionado === undefined)
                ? this._tierSugerido
                : this.precioSeleccionado;
        },
        esPrecioEstricto() {
            return this.$store.state.permisos.permite_editar_precio === true;
        },
        precioSeleccionadoSelect: {
            get() {
                return this.precioSeleccionado === null ? null : this.precioSeleccionado;
            },
            set(v) {
                // null = AUTO
                this.precioSeleccionado = (v === null ? null : Number(v));
                if (this.producto_selecto && this.precioSeleccionado === null) {
                    this._tierSugerido = this.sugerirTier(this.producto_selecto, this.totalUnidades);
                }
            }
        },

      opcionesPrecioSelect() {
  if (!this.producto_selecto) return [];

  const p = this.producto_selecto;
  const opts = [];

  const t1 = this.buscar_activo_precio(1);

  const t2 = this.tieneMay1(p) && this.buscar_activo_precio(2);
  const t3 = this.tieneMay2(p) && this.buscar_activo_precio(3);

  // ✅ Solo mostramos AUTO si hay al menos 2 opciones reales
  const hayMasDeUnaEscala = (t2 || t3); // porque 1 siempre existe si t1=true

  if (hayMasDeUnaEscala) {
    opts.push({
      value: null,
      text: `AUTO (S/ ${this.fmt(this.precioChip(p, this._tierSugerido))})`,
      sub: `Aplicará: ${this.descripcionTier(p, this._tierSugerido)}`,
      sugerido: true
    });
  } else {
    // si no hay auto, aseguramos que se quede fijo en 1
    if (this.precioSeleccionado === null) this.precioSeleccionado = 1;
  }

  // Tier 1
  if (t1) {
    opts.push({
      value: 1,
      text: `Precio normal — S/ ${this.fmt(this.precioChip(p, 1))}`,
      sub: this.descripcionTier(p, 1),
      sugerido: this._tierSugerido === 1
    });
  }

  // Tier 2
  if (t2) {
    opts.push({
      value: 2,
      text: `Mayoreo 1 — S/ ${this.fmt(this.precioChip(p, 2))}`,
      sub: this.descripcionTier(p, 2),
      sugerido: this._tierSugerido === 2
    });
  }

  // Tier 3
  if (t3) {
    opts.push({
      value: 3,
      text: `Mayoreo 2 — S/ ${this.fmt(this.precioChip(p, 3))}`,
      sub: this.descripcionTier(p, 3),
      sugerido: this._tierSugerido === 3
    });
  }

  return opts;
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
                // reinicia auto
                this.precioSeleccionado = null;
                const tier = this.sugerirTier(nv, this.toNum(this.cantidad || 1, 1));
                this._tierSugerido = tier;
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
        descripcionTier(producto, tier) {
            if (!producto) return '';

            if (tier === 1) {
                if (this.tieneMay1(producto)) {
                    return `Aplica cuando la cantidad es menor a ${producto.escala_may1} und.`;
                }
                return 'Precio sin mayoreo.';
            }

            if (tier === 2) {
                if (this.tieneMay2(producto)) {
                    return `Aplica desde ${producto.escala_may1} hasta antes de ${producto.escala_may2} und.`;
                }
                return `Aplica desde ${producto.escala_may1} und en adelante.`;
            }

            if (tier === 3) {
                return `Aplica desde ${producto.escala_may2} und en adelante.`;
            }

            return '';
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
            const factor = this.getFactor(this.producto_selecto);
            const q = this.toNum(this.cantidadInput, 0);
            const unidadesTotal = this.modoVenta === 'entero' ? q * factor : q; // SIEMPRE en unidades para validar

            if (!unidadesTotal || unidadesTotal <= 0) {
                store.commit("dialogosnackbar", "Ingrese una cantidad mayor a 0");
                return;
            }

            if (this.producto_selecto.controstock) {
                const stockDisponible = Number(this.producto_selecto.stock || 0);
                if (unidadesTotal > stockDisponible) {
                    store.commit("dialogosnackbar", "Cantidad supera el stock disponible");
                    return;
                }
            }

            this.dialo_cantidad = false;

            const tier = (this.precioSeleccionado ?? this.sugerirTier(this.producto_selecto, unidadesTotal));
            const precioUnidad = this.precioPorTier(this.producto_selecto, tier);
            const esCaja = (this.modoVenta === 'entero');
            let precioEmitido = esCaja ? (precioUnidad * factor) : precioUnidad;

            const tieneDescuentos = this.descuentoAplicado.desc_1 > 0 ||
                this.descuentoAplicado.desc_2 > 0 ||
                this.descuentoAplicado.desc_3 > 0;

            if (tieneDescuentos && !this.es_bono) {
                precioEmitido = this.descuentoAplicado.precioFinal;
            }

            const cantidadEmitida = q;
            const medidaEmitida = (factor === 1)
                ? (this.producto_selecto.medida || 'UNIDAD')
                : (esCaja ? (this.producto_selecto.medida || 'CAJA') : 'UNIDAD');
            const ope = this.es_bono
                ? 'GRATUITA'
                : (this.producto_selecto.operacion || 'GRAVADA');


            const linea = {
                ...this.producto_selecto,
                operacion: ope,
                cantidad: cantidadEmitida,
                precio: Number(precioEmitido.toFixed(4)),
                precio_base: Number((esCaja ? (precioUnidad * factor) : precioUnidad).toFixed(4)),
                medida: medidaEmitida,
                factor: factor,
                _precio_tier: tier,
                _unidades: unidadesTotal,
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

    },

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