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
                                </div>
                            </v-col>

                        </v-row>
                    </v-card-text>
                    <v-row :class="[
                        'mx-auto mb-1',
                        $store.state.esmovil ? 'mt-n8' : 'mt-n3'
                    ]" dense justify="space-between">
                        <v-col :cols="permiteAgregar ? 4 : 6" class="text-center">
                            <v-btn x-small elevation="3" rounded color="success" block @click="abre_catalogo()">
                                <v-icon left small>mdi-archive-arrow-down</v-icon> Catálogo
                            </v-btn>
                        </v-col>

                        <v-col v-if="permiteAgregar" cols="4" class="text-center">
                            <v-btn x-small elevation="6" rounded color="info" block @click="dialogAgrega = true">
                                <v-icon left small>mdi-plus-circle</v-icon> Agregar
                            </v-btn>
                        </v-col>

                        <v-col :cols="permiteAgregar ? 4 : 6" class="text-center">
                            <v-btn v-if="$store.state.permisos.proforma" x-small elevation="6" rounded color="warning"
                                block @click="dialogo_proforma = true">
                                <v-icon left small>mdi-text-box-multiple-outline</v-icon> Proforma
                            </v-btn>
                        </v-col>
                    </v-row>

                </v-card>
                <h4 class="mb-n5 mt-1 red--text">
                    <div class="d-flex align-center justify-space-between">
                        <div v-if="cliente_s != ''"> Cliente : {{ cliente_s.nombre }} </div>

                        <!-- Ícono de configuración -->
                        <v-icon small color="blue darken-2" class="mr-2" @click="dial_config = !dial_config"
                            title="Configuraciones adicionales">
                            mdi-cog
                        </v-icon>
                    </div>
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
                                                        <v-chip v-if="Number(item.precio_base) !== Number(item.precio)"
                                                            x-small class="ml-1" color="deep-orange" text-color="white"
                                                            label>
                                                            {{ moneda }} {{ redondear(item.precio_base) }}
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
                                    <h2 class="d-flex align-center">

                                        Total:

                                        <v-menu offset-y>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-btn v-bind="attrs" v-on="on" small class="ml-2 mr-2 pa-0" color="red"
                                                    text style="font-size: inherit; min-width: 0;">
                                                    {{ moneda }}
                                                </v-btn>
                                            </template>

                                            <v-list dense>
                                                <v-list-item v-for="m in $store.state.moneda" :key="m.codigo"
                                                    @click="moneda = m.simbolo">
                                                    <v-list-item-title>{{ m.simbolo }} - {{ m.moneda
                                                        }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>

                                        {{ redondear(sumaTotal() - sumaDescuentos()) }}

                                    </h2>
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
        <v-dialog v-model="dial_config" max-width="420px">
            <v-card>
                <v-toolbar dense color="primary" dark>
                    <v-toolbar-title>Configuración de lista</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dial_config = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pt-4">
                    <v-subheader class="pl-0">Orden de productos</v-subheader>
                    <v-radio-group v-model="modoOrdenProductos" column dense>
                        <v-radio value="push" label="Agregar al final (orden tradicional)" />
                        <v-radio value="top" label="Últimos agregados siempre arriba" />
                    </v-radio-group>
                    <p class="caption grey--text mt-2">
                        Esta configuración solo afecta el orden visual de la lista, no cambia los totales ni el cálculo
                        de
                        bonos.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="dial_config = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <dial_proforma v-if="dialogo_proforma" @cierra="dialogo_proforma = false"
            @copia_proforma="copia_comprobante($event)" />
        <cobrar v-if="dial_cobro" @cierre="dial_cobro = false" @terminar='termina_venta($event)'
            :cabecera="cabecera_final" :items="items_final" :cliente="arra_cliente" />
        <agrega_producto v-if="dialogAgrega" @cierra="dialogAgrega = false"
            @agrega_lista="agregar_lista($event), dialogAgrega = false" />
        <imprime v-if="genera_pdf" :data="cabecera_cobro" @cierra="cierra_imprime()" />
        <dial_edita_prod v-if="dialogoProducto" @cierra="dialogoProducto = false"
            @editaProducto="editaProductoFinal($event)" :item_selecto="item_selecto" @eliminaedita="eliminaedita()" />
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
import { aplicaPreciosYBonos, agregarLista } from "../funciones/calculo_bonos";
import dial_edita_prod from './edita_producto.vue'
export default {
    name: 'caja',

    components: {
        dial_proforma,
        cobrar,
        agrega_producto,
        imprime,
        cat_fijo,
        dial_edita_prod
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
            codigo: '',                // <- solo déjalo si realmente lo usas en otra parte
            listaproductos: [],
            item_selecto: [],
            cabecera_final: [],
            items_final: [],
            cabecera_cobro: [],
            arra_cliente: [],
            genera_guia: false,
            array_ult_venta: [],
            cliente_s: [],
            lista_precios_selecta: ['1', '2', '3'],
            dial_config: false,
            modoOrdenProductos: 'push',
        }
    },
    created() {
        this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
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
        if ((!this.listaproductos || this.listaproductos.length === 0) &&
            Array.isArray(store.state.lista_productos) &&
            store.state.lista_productos.length > 0) {
            // clon simple para no mutar directamente el state
            this.listaproductos = JSON.parse(JSON.stringify(store.state.lista_productos));
        }
        const savedModo = localStorage.getItem('modoOrdenProductos');
        if (savedModo === 'push' || savedModo === 'top') {
            this.modoOrdenProductos = savedModo;
        }
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
        store.commit("emision", '')
        store.commit("cliente_selecto", '')
        store.commit("lista_productos", []);
    },
    computed: {

        permiteAgregar() {
            return !!this.$store.state.permisos.agrega_producto;
        },

    },
    mounted() {
        window.addEventListener("keydown", this.detectarTecla);
    },
    watch: {

        listaproductos: {
            handler(nuevo) {
                store.commit("lista_productos", nuevo);
            },
            deep: true, // importante para detectar cambios dentro del array/objetos
        },
        modoOrdenProductos(nuevo) {
            localStorage.setItem('modoOrdenProductos', nuevo);
        },
    },

    methods: {
        editaProductoFinal(lineaActualizada) {
            const idx = this.listaproductos.findIndex(
                l => l.uuid === lineaActualizada.uuid
            );

            if (idx !== -1) {
                // Actualizamos esa línea en la lista
                this.$set(this.listaproductos, idx, lineaActualizada);
            }

            // Recalcula precios por escala + bonos
            this.recalculoCompleto();

            // Cerramos el diálogo
            this.dialogoProducto = false;
        },
        eliminaedita() {
            var pos = this.listaproductos.map(e => e.uuid).indexOf(this.item_selecto.uuid)
            this.listaproductos.splice(pos, 1)
            this.dialogoProducto = false
            this.recalculoCompleto()
        },
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
            console.log(this.listaproductos, this.listaproductos)
            var resp = await procesar_items(this.listaproductos)
            console.log("resp", resp)
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
            // 1) Usamos tu helper para fusionar / sumar cantidades / etc.
            let nuevaLista = agregarLista({
                listaActual: this.listaproductos,
                nuevosItems: value,
                createUUID: this.create_UUID,
                redondear: (n) => this.redondear(n),
            });

            // 2) Marcar timestamp interno para controlar el orden visual
            const baseTs = Date.now();
            let offset = 0;

            nuevaLista = nuevaLista.map(item => {
                // si ya tenía marca, la respetamos
                if (item.__tsAdd) return item;

                // si no, se la ponemos (sirve para items recién agregados)
                const nuevo = { ...item };
                nuevo.__tsAdd = baseTs + (offset++); // pequeño offset para evitar empates
                return nuevo;
            });

            // 3) Ordenar según modo
            if (this.modoOrdenProductos === 'top') {
                // Últimos agregados arriba → mayor __tsAdd primero
                nuevaLista.sort((a, b) => {
                    const ta = a.__tsAdd || 0;
                    const tb = b.__tsAdd || 0;
                    return tb - ta;
                });
            }
            // si es 'push', dejamos el orden que devuelve agregarLista

            // 4) Asignamos y recalculamos bonos / precios
            this.listaproductos = nuevaLista;
            this.recalculoCompleto();
        },


        editaProducto(val) {
            console.log(val)
            this.item_selecto = val
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
            console.log(data)
            this.moneda = data.moneda || 'S/'
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
