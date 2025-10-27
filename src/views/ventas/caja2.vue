<template>
    <div class="pa-3">
        <v-row>
            <v-col cols="12" md="4"
                v-if="$vuetify.breakpoint.mdAndUp || ($vuetify.breakpoint.smAndDown && $vuetify.breakpoint.width > $vuetify.breakpoint.height)">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true" :x_categoria="true">
                </cat_fijo>
            </v-col>
            <v-col cols="12" md="8" class="venta-col d-flex flex-column">
                <v-card class="mt-1">
                    <v-card-text>
                        <v-row class="mt-n4" dense>
                            <v-col cols="6" xs="6">
                                <cat_fijo v-if="$store.state.esmovil" ref="catFijo"
                                    @agrega_lista="agregar_lista($event)" :muestra_tabla="false" :x_categoria="true">
                                </cat_fijo>

                            </v-col>
                            <v-col cols="6" xs="12">
                                <div class="d-flex align-center">
                                    <v-text-field :disabled="!$store.state.permisos.edita_fecha" v-model="date"
                                        type="date" outlined dense label="Fecha de Emisión"
                                        prepend-inner-icon="mdi-calendar" hide-details
                                        class="flex-grow-1"></v-text-field>
                                    <v-tooltip top v-if="false">
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-icon color="primary" class="ml-2" v-bind="attrs" v-on="on"
                                                @click="dial_config = !dial_config">
                                                mdi-cog
                                            </v-icon>
                                        </template>
                                        <span>Configuraciones adicionales</span>
                                    </v-tooltip>
                                </div>
                            </v-col>

                        </v-row>
                    </v-card-text>
                    <v-row class="mx-auto mt-n5" dense>
                        <!-- Catálogo -->
                        <v-col :cols="permiteAgregar ? 4 : 6" class="text-center">
                            <v-btn small elevation="3" rounded color="success" @click="abre_catalogo()">
                                Catalogo
                                <v-icon color="white" class="mx-auto text--center" small>mdi-archive-arrow-down</v-icon>
                            </v-btn>
                        </v-col>

                        <!-- Agregar (solo si tiene permiso) -->
                        <v-col v-if="permiteAgregar" cols="4" class="text-center">
                            <v-btn small elevation="6" rounded color="info" @click="dialogAgrega = !dialogAgrega">
                                Agregar
                                <v-icon color="white" class="mx-auto text--center" small>mdi-plus</v-icon>
                            </v-btn>
                        </v-col>

                        <!-- Proforma -->
                        <v-col :cols="permiteAgregar ? 4 : 6" class="text-center">
                            <v-btn v-if="$store.state.permisos.proforma" small elevation="6" rounded color="warning"
                                @click="dialogo_proforma = !dialogo_proforma">
                                Proforma
                                <v-icon color="white" class="mx-auto text--center"
                                    medium>mdi-text-box-multiple-outline</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>

                </v-card>
                <h4 class="mb-n5 mt-1 red--text" v-if="cliente_s != ''">
                    <div> Cliente : {{ cliente_s.nombre }}</div>
                </h4>
                <v-card class="mt-5">
                    <div class="tabla-scroll">
                        <v-simple-table class="elevation-0" dense>
                            <!-- Sin encabezado: usamos tarjetas -->
                            <thead class="d-none">
                                <tr>
                                    <th>Ítems</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="item in listaproductos" :key="item.uuid || item.id"
                                    @click.prevent="editaProducto(item)">
                                    <td class="pa-0 mt-n1 mb-n1">
                                        <v-card class="ma-1 pa-2 " outlined :elevation="0" ripple>
                                            <div class="d-flex align-center mt-n2 mb-n2">
                                                <!-- Contenido -->
                                                <div class="flex-grow-1 mr-2">
                                                    <div class="text-caption grey--text text--darken-1">
                                                        <!-- Precio + chips -->
                                                        <span>
                                                            Precio: {{ moneda }}
                                                            {{ redondear(item.precio) }}
                                                        </span>
                                                        <v-chip v-if="Number(item.preciodescuento) > 0" x-small
                                                            class="ml-1" color="deep-orange" text-color="white" label>
                                                            −{{ moneda }} {{ redondear(item.preciodescuento) }}
                                                        </v-chip>
                                                        <v-chip v-if="item.medida" x-small class="ml-1" label>
                                                            {{ item.medida }}
                                                        </v-chip>
                                                        <v-chip v-if="item.operacion === 'GRATUITA'" x-small
                                                            class="ml-1" color="pink" text-color="white" label>
                                                            Gratuita
                                                        </v-chip>
                                                    </div>

                                                    <div class="mt-1 text-subtitle-2 text-truncate"
                                                        style="max-width: 70vw;">
                                                        <span class="font-weight-bold red--text">{{
                                                            Number(item.cantidad)
                                                            }}×</span>
                                                        {{ item.nombre }}
                                                    </div>
                                                </div>

                                                <!-- Total -->
                                                <div class="text-right mr-1">
                                                    <div class="subtitle-2 font-weight-bold">
                                                        {{ moneda }}
                                                        {{ item.totalLinea
                                                        }}
                                                    </div>
                                                    <div class="caption grey--text">Total</div>
                                                </div>
                                            </div>
                                        </v-card>
                                    </td>
                                </tr>

                                <!-- Vacío -->
                                <tr v-if="!listaproductos || listaproductos.length === 0">
                                    <td class="py-6 text-center grey--text">
                                        No hay productos en la lista
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </div>

                </v-card>

                <v-card class="mt-3 pa-1 totals-sticky">
                    <v-row>
                        <v-col cols="7">
                            <v-list-item-content class="ml-3">
                                <v-list-item-subtitle>

                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h3>SubTotal: {{ moneda }} {{ sumaTotal() }}</h3>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h4 class="red--text">Descuentos: {{ moneda }} {{ sumaDescuentos() }}</h4>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    <h2>Total: <select class="mr-n1 red--text" id="moneda" name="moneda"
                                            v-model="moneda">
                                            <option v-for="moneda in $store.state.moneda" :key="moneda.codigo"
                                                :value="moneda.simbolo">
                                                {{ moneda.simbolo }}
                                            </option>
                                        </select> {{ redondear(sumaTotal() - sumaDescuentos()) }}</h2>
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </v-col>
                        <v-col cols="1">
                        </v-col>
                        <v-col cols="3">
                            <v-btn block elevation="15" rounded v-if="listaproductos != ''" color="error"
                                @click="cobrar()">
                                Cobrar <span v-if="!$store.state.esmovil">(F2)</span>
                            </v-btn>
                        </v-col>

                    </v-row>
                </v-card>
            </v-col>
        </v-row>



        <v-dialog v-model="dialogoProducto" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dialogoProducto = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-checkbox :disabled="!$store.state.permisos.edita_bono" v-model="es_bono"
                        label="ES BONO"></v-checkbox>
                </v-system-bar>
            </div>
            <v-card class="pa-3">

                <v-row class="mx-auto mt-4 text-center" dense v-if="$store.state.permisos.caja_edita_cantidad">

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
                <v-row class="mx-auto text-center mt-n3" dense>
                    <v-col readonly @focus="$event.target.select()" cols="6"
                        v-if="$store.state.permisos.caja_edita_precio">
                        <v-text-field outlined dense @keyup.enter="grabaEdita()" type="number" v-model="precioedita"
                            label="Precio"></v-text-field>
                    </v-col>
                    <v-col cols="6" v-if="$store.state.permisos.descuentos">
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
        <v-dialog v-model="dial_catalogo" max-width="550">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_catalogo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-1">
                <cat_fijo ref="catFijo" v-if="dial_catalogo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true"
                    :x_categoria="false" :lista_precios="lista_precios_selecta">
                </cat_fijo>
            </v-card>
        </v-dialog>
        <dial_proforma v-if="dialogo_proforma" @cierra="dialogo_proforma = false"
            @copia_proforma="copia_comprobante($event)" />
        <cobrar v-if="dial_cobro" @cierre="dial_cobro = false" @terminar='termina_venta($event)'
            :cabecera="cabecera_final" :items="items_final" :cliente="arra_cliente" />
        <agrega_producto v-if="dialogAgrega" @cierra="dialogAgrega = false"
            @agrega_lista="agregar_lista($event), dialogAgrega = false" />
        <imprime v-if="genera_pdf" :data="cabecera_cobro" @cierra="cierra_imprime()" />
    </div>
</template>

<script>
import moment from 'moment'
import {
    procesar_items
} from '../../funciones_generales'
import store from '@/store/index'
import dial_proforma from './dialogos/dialogo_proforma.vue'
import cobrar from '@/views/ventas/cobro_final'
import agrega_producto from '@/views/ventas/agrega_producto'
import imprime from '@/components/dialogos/dialog_imprime'
import cat_fijo from '@/components/catalogo_fijo'
import { aplicaPreciosYBonos } from "../funciones/calculo_bonos";
export default {
    name: 'caja',

    components: {
        dial_proforma,
        cobrar,
        agrega_producto,
        imprime,
        cat_fijo
    },

    data() {
        return {
            operacion: '0101',
            paisSeleccionado: null,
            dial_catalogo: false,
            moneda: 'S/',
            dialogo_proforma: false,
            genera_pdf: false,
            dial_cobro: false,
            dialogAgrega: false,
            dialogoProducto: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            codigo: '',
            listaproductos: [],
            cantidadEdita: '',
            preciodescuento: '',
            precioedita: '',
            nombreEdita: '',
            porcentaje: 0,
            item_selecto: [],
            cabecera_final: [],
            items_final: [],
            cabecera_cobro: [],
            arra_cliente: [],
            genera_guia: false,
            array_ult_venta: [],
            cliente_s: [],
            es_bono: false,
            lista_precios_selecta: ['1', '2', '3']
        }
    },
    created() {
        if (store.state.cliente_selecto != '') {
            const data = store.state.cliente_selecto;
            this.lista_precios_selecta = data.listas_precios || ['1', '2', '3']
            const dirPri = this.getDirPrincipal(data);

            const dir = (data.direccion && String(data.direccion).trim())
                ? data.direccion
                : (dirPri?.direccion || '');

            const latitud = (data.latitud ?? dirPri?.latitud ?? null);
            const longitud = (data.longitud ?? dirPri?.longitud ?? null);

            this.cliente_s = data;
            this.arra_cliente = {
                dir,
                dni: data.documento || '',
                nombre: data.nombre || '',
                latitud,
                longitud,
            };

        }
        if (store.state.emision != '') {
            var data = store.state.emision
            this.listaproductos = data.data
            this.arra_cliente = {
                dir: data.dir_cliente,
                dni: data.num_cliente,
                nombre: data.nom_cliente
            }
        }
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
        store.commit("emision", '')
        store.commit("cliente_selecto", '')
    },
    computed: {
        conversion() {
            var total = this.precioedita * (this.porcentaje / 100)
            return total.toFixed(2)
        },
        permiteAgregar() {
            return !!this.$store.state.permisos.agrega_producto;
        }
    },
    mounted() {
        window.addEventListener("keydown", this.detectarTecla);
    },
    watch: {
        es_bono(nuevo) {
            if (nuevo) {
                this.precioedita = 0
                this.preciodescuento = 0
            } else if (this.item_selecto && Number(this.item_selecto.precio) > 0) {
                this.precioedita = Number(this.item_selecto.precio)
            }
        }
    },

    methods: {
        getDirPrincipal(cliente) {
            const arr = Array.isArray(cliente?.direcciones) ? cliente.direcciones : [];
            if (!arr.length) return null;
            // prioriza la marcada como principal; si no hay, toma la primera
            return arr.find(d => d && d.principal) || arr[0] || null;
        },

        captura_foco() {
            this.$nextTick(() => {
                if (this.$refs.catFijo) {
                    this.$refs.catFijo.enfocarInput(); // Llama al método del hijo
                }
            });
        },
        detectarTecla(event) {
            if (event.key === "F2" && !store.state.esmovil) {
                event.preventDefault(); // Evita que el navegador abra la ayuda
                this.cobrar();
            }
        },
        comparafecha() {
            var hoy = moment(String(new Date())).add(-4, 'd').format('YYYY-MM-DD')
            var fecha = moment(String(this.date)).format('YYYY-MM-DD')
            if (moment(fecha).isAfter(hoy)) {
                return true
            } else {
                return false
            }
        },
        verdate() {
            var fecha = moment(String(this.date)) / 1000
            if (moment(String(new Date())).format('YYYY-MM-DD') == moment(String(this.date)).format('YYYY-MM-DD')) {
                fecha = moment().unix()
            }
            return fecha
        },
        async cobrar() {
            this.recalculoCompleto();
            if (!this.comparafecha()) {
                alert('Fecha Excede el limite')
                return
            }
            if (this.operacion === '0102') {
                this.listaproductos = this.listaproductos.map(producto => {
                    return {
                        ...producto,
                        opera_sunat: '0102'
                    };
                });
            }
            var fechahoy = this.verdate()
            var totalcuenta = this.sumaTotal()
            var totaldescuentos = this.sumaDescuentos()
            var resp = await procesar_items(this.listaproductos)
            var cabecera = resp[0]
            var items = resp[1]
            cabecera.operacion = this.operacion
            cabecera.paisSeleccionado = this.paisSeleccionado
            cabecera.fecha = fechahoy
            cabecera.vencimientoDoc = fechahoy
            cabecera.total = totalcuenta
            cabecera.descuentos = totaldescuentos
            cabecera.moneda = this.moneda
            this.cabecera_final = cabecera
            this.items_final = items
            this.dial_cobro = true
        },

        // flujo completo (recomendado al cobrar)
        recalculoCompleto() {
            this.listaproductos = aplicaPreciosYBonos({
                lineas: this.listaproductos,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                createUUID: this.create_UUID,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });
        },

        async termina_venta(val) {
            this.array_ult_venta = val
            this.genera_guia = val.genera_guia
            this.cabecera_cobro = val.arrayCabecera
            this.genera_pdf = true
            store.commit("dialogoprogress")
            this.dial_cobro = false
            this.listaproductos = []
            this.cabecera_final = []
            this.item_final = []

            store.commit("emision", '')
            this.es_delivery = false
        },

        agregar_lista(value) {
            const items = Array.isArray(value) ? value : [value];

            items.forEach(val => {
                const medidaLinea = (val.medida || '').toString().trim().toUpperCase();
                const esGratuitaNueva = String(val.operacion || '').toUpperCase() === 'GRATUITA';

                // ---------- CASO GRATUITA: acumula cantidad por (id + medida)
                if (esGratuitaNueva) {
                    const existenteGrat = this.listaproductos.find(item =>
                        item.id === val.id &&
                        String(item.medida || '').toUpperCase() === medidaLinea &&
                        String(item.operacion || '').toUpperCase() === 'GRATUITA'
                    );

                    if (existenteGrat) {
                        existenteGrat.cantidad = Number(existenteGrat.cantidad || 0) + Number(val.cantidad || 0);
                        existenteGrat.totalLinea = '0.00'; // siempre 0 en gratuita
                        return; // ya sumamos; no insertamos nuevo
                    }

                    // No existía: insertar línea gratuita
                    this.listaproductos.push({
                        uuid: this.create_UUID().substring(29),
                        factor: val.factor || 1,
                        id: val.id,
                        cantidad: Number(val.cantidad || 0),
                        nombre: val.nombre,
                        medida: medidaLinea,
                        precio: Number(val.precio || 0),
                        precio_base: Number(val.precio || 0),
                        preciodescuento: 0,
                        costo: val.costo,
                        tipoproducto: val.tipoproducto,
                        operacion: 'GRATUITA',
                        peso: 0,
                        controstock: val.controstock,
                        totalLinea: '0.00',
                    });
                    return;
                }

                // ---------- CASO NO GRATUITA: PERMITIR DUPLICADOS, PERO SUMAR SI (id + medida) COINCIDEN
                const existente = this.listaproductos.find(item =>
                    item.id === val.id &&
                    String(item.medida || '').toUpperCase() === medidaLinea &&
                    String(item.operacion || '').toUpperCase() !== 'GRATUITA' // solo acumula con no-gratuita
                );

                if (existente) {
                    // Acumular cantidad. Si el precio nuevo difiere, mantenemos el precio que ya estaba
                    // (si prefieres reemplazar por el nuevo, cambia la asignación de precio).
                    existente.cantidad = Number(existente.cantidad || 0) + Number(val.cantidad || 0);

                    // Mantén el precio de la línea existente
                    const precioUnit = Number(existente.precio || 0);
                    existente.totalLinea = this.redondear(precioUnit * Number(existente.cantidad || 0));
                    // Mantén preciodescuento tal cual (se suman aparte en sumaDescuentos)
                    return; // no inserta nueva línea
                }

                // No había línea equivalente -> insertar una nueva
                this.listaproductos.push({
                    uuid: this.create_UUID().substring(29),
                    factor: val.factor,
                    id: val.id,
                    cantidad: Number(val.cantidad || 0),
                    nombre: val.nombre,
                    medida: medidaLinea,
                    precio: Number(val.precio || 0),
                    precio_base: Number(val.precio || 0),
                    preciodescuento: 0,
                    costo: val.costo,
                    tipoproducto: val.tipoproducto,
                    operacion: val.operacion, // 'GRAVADA', etc.
                    peso: 0,
                    controstock: val.controstock,
                    totalLinea: this.redondear(Number(val.precio || 0) * Number(val.cantidad || 0)),
                });
            });

            // Recalcula todo (precios/bonos/redondeos)
            this.recalculoCompleto();
        },



        grabaEdita() {
            const esBono = !!this.es_bono

            if (this.cantidadEdita == '' || Number(this.cantidadEdita) <= 0) {
                alert('ingrese cantidad valida')
                return
            }

            // Validaciones de precio solo si NO es bono
            if (!esBono) {
                if (Number(this.precioedita) === 0) {
                    alert("Precio no puede ser 0")
                    return
                }
                if (parseFloat(this.precioedita) <= parseFloat(this.preciodescuento || 0)) {
                    alert("Precio no puede ser menor/igual a 0")
                    return
                }
            }
            if (!esBono && this.$store.state.configuracion.precio_minimo) {

                const prod = store.state.productos.find(p => String(p.id) === String(this.item_selecto.id)) || {};
                const factor = (
                    Number(this.item_selecto?.factor) &&
                    this.item_selecto.medida !== 'UNIDAD' &&
                    Number(this.item_selecto.factor) !== 1
                ) ? Number(this.item_selecto.factor) : 1;

                // bases numéricas
                const baseMay2 = Number(prod.precio_may2) || 0;
                const baseMay1 = Number(prod.precio_may1) || 0;
                const basePrecio = Number(prod.precio) || 0;

                // elige base mínima preferente
                let baseMinima = basePrecio;
                if (baseMay2 > 0) baseMinima = baseMay2;
                else if (baseMay1 > 0) baseMinima = baseMay1;

                // aplica factor y redondea si tienes helper
                const precioMinimo = this.redondear ? this.redondear(baseMinima * factor) : (baseMinima * factor);
                if (Number(this.precioedita) < precioMinimo) {
                    alert(`Precio menor al mínimo (${precioMinimo})`);
                    return;
                }
            }
            // Stock
            if (this.item_selecto.controstock) {
                const producto = store.state.productos.find(item => item.id == this.item_selecto.id)
                if (producto && producto.stock < Number(this.cantidadEdita)) {
                    alert('Producto sin Stock')
                    return
                }
            }
            // Si hay porcentaje, convertir a monto de descuento (solo cuando no es bono)
            if (!esBono && this.porcentaje) {
                this.preciodescuento = this.conversion
            }

            const pos = this.listaproductos.findIndex(e => e.uuid === this.item_selecto.uuid)
            if (pos === -1) return

            const linea = this.listaproductos[pos]
            linea.nombre = this.nombreEdita
            linea.cantidad = Number(this.cantidadEdita)

            if (esBono) {
                // Bono/Gratuita
                linea.operacion = 'GRATUITA'
                linea.totalLinea = '0.00'
            } else {
                // Quitar gratuita si estaba marcada y volver a gravada (o conservar su estado previo si ya era gravada)
                linea.operacion = (linea.operacion === 'GRATUITA') ? 'GRAVADA' : (linea.operacion || 'GRAVADA')
                linea.precio = Number(this.precioedita)
                linea.preciodescuento = Number(this.preciodescuento) || 0
                // En esta pantalla sumas descuentos aparte, así que el total de la línea no descuenta
                linea.totalLinea = this.redondear(linea.cantidad * linea.precio)
            }

            this.dialogoProducto = false
            this.recalculoCompleto();
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
            var pos = this.listaproductos.map(e => e.uuid).indexOf(this.item_selecto.uuid)
            this.listaproductos.splice(pos, 1)
            this.dialogoProducto = false
            this.recalculoCompleto()
        },
        editaProducto(val) {
            this.item_selecto = val
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
            this.dialogoProducto = true
        },


        sumaTotal() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].operacion != 'GRATUITA') {
                    suma = suma + (this.listaproductos[i].cantidad * this.listaproductos[i].precio)
                }
            }
            this.totalDocumento = this.redondear(suma)
            return this.redondear(suma)
        },
        sumaDescuentos() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                suma = suma + parseFloat(this.listaproductos[i].preciodescuento)
            }
            this.totalDescuento = (suma).toFixed(2)
            return (suma).toFixed(2)
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        abre_catalogo() {
            this.dial_catalogo = true
        },

        copia_comprobante(data) {
            this.arra_cliente = {
                dir: data.dir_cliente,
                dni: data.num_cliente,
                nombre: data.nom_cliente
            }
            this.listaproductos = data.data
            this.dialogo_proforma = false
        },

        async cierra_imprime() {
            this.genera_pdf = false
            await new Promise(resolve => setTimeout(resolve, 250))
            if (this.cliente_s != '') {
                //    await guarda_lista(this.cliente_s.fecha + '/' + this.cliente_s.id + '/estado', 'atendido')
                store.commit("cliente_selecto", '')
                this.cliente_s = ''
                this.$router.back()
            }
            if (this.genera_guia) {
                store.commit("array_guia", this.array_ult_venta)

                if (store.state.esmovil) {
                    this.$router.push({
                        path: '/gr_movil'
                    })
                } else {
                    this.$router.push({
                        path: '/gr_remitente'
                    })
                }
            }
            this.captura_foco()

        },

    },

}
</script>
<style>
.selected-row {
    background-color: #b2ff85;
    /* Puedes cambiar el color de fondo para la fila seleccionada */
}

.table-container {
    height: 65vh;
    overflow-y: auto;
}

/* La columna ocupa el alto de la vista para que el scroll viva dentro */
.venta-col {
    min-height: 100vh;
}

/* Área desplazable solo para la lista (clave: min-height:0 en hijos flex) */
.tabla-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0;
}

/* Mantiene el card de totales visible abajo (opcional) */
.totals-sticky {
    position: sticky;
    bottom: 0;
    z-index: 5;
}

/* Pequeño ajuste para iOS/Android (evita “salto” al abrir teclado) */
@supports (height: 100dvh) {
    .venta-col {
        min-height: 100dvh;
    }
}
</style>
