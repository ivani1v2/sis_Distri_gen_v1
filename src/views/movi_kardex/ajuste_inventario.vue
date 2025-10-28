<template>
    <v-dialog v-model="dial" max-width="1100px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="info" @click="dial_lista = true">mdi-magnify</v-icon>
                <v-icon color="red" large @click="(dial_anula = true)">mdi-delete</v-icon>
                <v-icon color="green" large @click="dialogo_genera = true">mdi-content-save</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-card-text>
                <v-row class="mb-n5 " dense>
                    <v-col cols="6">
                        <h4>FECHA DE EMISION: {{ conviertefecha(arra_cabe_doC.fecha_emision) }}</h4>
                        <h4>FECHA DE INGRESO: {{ conviertefecha(arra_cabe_doC.fecha_ingreso) }}</h4>
                        <h4>DOCUMENTO: {{ arra_cabe_doC.tipodocumento }} /
                            {{ arra_cabe_doC.sreferencia }}-{{ arra_cabe_doC.creferencia }}</h4>
                    </v-col>
                    <v-col cols="6">
                        <h4>Modo Ajuste : <span class="red--text">{{ arra_cabe_doC.modo_ajuste }}</span></h4>
                        <h4>Motivo : {{ arra_cabe_doC.motivo }}</h4>
                        <div class="mt-2 mb-n5" v-if="!$store.state.esmovil">
                            <v-autocomplete v-model="busca_p" :items="productosConStock" item-value="id"
                                item-text="nombre" label="Buscar producto" outlined dense clearable auto-select-first
                                return-object @change="seleccionDirecta">
                                <template v-slot:item="{ item }">
                                    <div>
                                        <strong>{{ item.nombre }}</strong>
                                        <small class="grey--text ml-2">({{ item.id }} - Stock: {{ item.stock }})</small>
                                    </div>
                                </template>
                            </v-autocomplete>


                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-simple-table dark fixed-header height="60vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Descripcion
                            </th>
                            <th class="text-left">
                                Medida
                            </th>
                            <th class="text-left">
                                Cantidad
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in lista_productos" :key="item.key">
                            <td width="380">
                                <v-icon color="green" @click="editaProducto(item)" small
                                    class="mt-n1">mdi-pencil</v-icon>
                                {{ item.id }} {{ item.nombre }}
                            </td>
                            <td width="30">{{ item.medida }}</td>
                            <td width="35">{{ item.cantidad }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
            <v-spacer></v-spacer>
        </v-card>

        <v-dialog v-model="dialogo_genera" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_genera = !dialogo_genera">mdi-close</v-icon>
                </v-system-bar>
            </div>

            <v-card class="pa-3">
                <v-card-text>
                    <h2 class="text-center">SEGURO DE CONTINUAR??</h2>

                </v-card-text>
                <v-card-actions>
                    <v-btn color="success" block @click="genera_compra(true)">SI</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogoProducto" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoProducto = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-select :items="arrayOperacion" label="Operacion" dense outlined v-model="operacion_edita"></v-select>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="6" class="mb-n4 mt-n1">
                        <v-text-field dense @keyup.enter="grabaEdita()" class="pa-3" v-model="costo_edita"
                            label="Costo Unitario"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12" class="mb-n4 mt-n1">
                        <v-text-field dense @keyup.enter="grabaEdita()" class="pa-3" v-model="nombreEdita"
                            label="Nombre"></v-text-field>
                    </v-col>
                </v-row>
                <v-card-actions class="mt-n6">
                    <v-spacer></v-spacer>
                    <v-btn color="error" text @click="eliminar()">
                        Elimina
                    </v-btn>
                    <v-btn color="green darken-1" text @click="grabaEdita()">
                        Graba
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialo_cantidad" max-width="400px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = !dialo_cantidad, btn = false, modo = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-title class="flex flex-col">
                    <div v-if="selecto" class="mb-2">
                        <div class="grey--text text--darken-1" style="font-size:12px;">
                            Presentación: <strong>{{ selecto.medida || 'PAQ' }}</strong> → <strong>UND</strong>
                            (factor: <strong>{{ Number(selecto.factor) || 1 }}</strong>)
                        </div>
                        <div class="grey--text" style="font-size:12px;" v-if="modo">
                            Modo: <strong>{{ modo === 'entero' ? (selecto.medida || 'PAQ') : 'UND' }}</strong>
                        </div>
                    </div>

                    <v-row v-if="!btn" class="pa-1">
                        <v-col cols="6">
                            <v-btn color="success" block @click="seleeciona_modo('entero')">
                                {{ selecto.medida || 'PAQ' }}
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="success" block @click="seleeciona_modo('fraccion')">
                                UND.
                            </v-btn>
                        </v-col>
                    </v-row>

                    <v-text-field class="mt-3" type="number" autofocus outlined dense v-model.number="cantidad"
                        :label="modo === 'entero' ? ((selecto.medida || 'PAQ') + ' (cant.)') : 'UND. (cant.)'"
                        @focus="$event.target.select()" @keyup.enter="agregaCatalogo()"></v-text-field>

                    <div class="grey--text text--darken-1 mt-1" style="font-size:12px;">
                        Unidades que se moverán:
                        <strong>
                            {{ (modo === 'entero'
                                ? ((Number(cantidad) || 0) * (Number(selecto.factor) || 1))
                                : (Number(cantidad) || 0)
                            ).toFixed(0) }}
                        </strong>
                    </div>

                    <v-btn class="mt-2" color="red" @click="agregaCatalogo()" block>OK</v-btn>
                </v-card-title>
            </v-card>
        </v-dialog>


        <v-dialog persistent v-model="progress" max-width="250">
            <v-card class="pa-12">
                <v-progress-linear indeterminate color="blue-grey" height="25">
                </v-progress-linear>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_anula" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(dial_anula = !dial_anula)">mdi-close</v-icon>
                </v-system-bar>
            </div>

            <v-card class="pa-3">
                <v-card-text>
                    <h2 class="text-center">SEGURO DE QUE DESEA ANULAR??</h2>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="info" @click="anula_mov()">SI</v-btn>
                    <v-btn color="success" @click="dial_anula = false">NO</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_lista" max-width="800px">
            <cata_productos v-if="dial_lista" @array="abre_cantidad($event)" @cierra="dial_lista = $event" />
        </v-dialog>
    </v-dialog>
</template>

<script>
import clientes from '@/components/dialogos/dialogoClientes'
import moment from 'moment'
import store from '@/store/index'
import tabla_proveedor from '@/components/configEmpresa/tabla_proveedor'
import cata_productos from '@/views/movi_kardex/lista_productos'
import {
    nuevoMovimiento,
    elmina_mov_kardex
} from '../../db'
import {
    modifica_stock_array,
    modifica_stock_unitario
} from '../../control_stock'
import { fs, colempresa } from '../../db_firestore'
export default {
    name: 'caja',

    components: {
        clientes,
        tabla_proveedor,
        cata_productos
    },
    props: {
        data: [],
    },
    data() {
        return {
            dial: false,
            dial_lista: false,
            dial_anula: false,
            progress: false,
            dial_modifica: false,
            dial_agrega_prod: false,
            dialo_cantidad: false,
            dialogo_genera: false,
            dial_configura: false,
            dialogoProducto: false,
            arra_cabe_doC: [],
            array_productos: [],
            lista_productos: [],
            arrayOperacion: [
                'GRAVADA',
                'GRATUITA'
            ],
            operacion_edita: 'GRAVADA',
            tot_igv: 0.00,
            tot_base_imp: 0.00,
            tot_gratuita: 0,
            tot_exonerada: 0,
            igv: 18,
            busca_p: '',
            btn: false,
            modo: '',
            cantidad: 1,
            cantidad_und: 1,
            selecto: '',
            con_igv: '',
            sin_igv: '',
            foco_igv: false,
            incluye_igv: true,
            costo_edita: '',
            nombreEdita: '',
            producto_ingresado: [],
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date_ingreso: moment(String(new Date)).format('YYYY-MM-DD'),
            arraymodo: ['CONTADO', 'CREDITO'],
            modo_pago: 'CONTADO',
            arraydocumento: ['FACTURA', 'BOLETA'],
            tipodocumento: 'FACTURA',
            edita_app: false,
            sreferencia: '',
            creferencia: '',
            observacion: '',
            num_doc: '',
            nom_proveedor: '',
        }
    },
    created() {
        console.log(store.state.productos)
        this.inicio()
        this.dial = true
    },
    computed: {
        totaliza() {
            let totalGravada = 0;
            let totalExonerada = 0;
            let totalGratuita = 0;

            if (!Array.isArray(this.lista_productos)) return 0;

            for (const item of this.lista_productos) {
                const totalItem = Number(item.cantidad) * Number(item.costo_nuevo || 0);
                switch (item.operacion) {
                    case 'GRAVADA':
                        totalGravada += totalItem;
                        break;
                    case 'EXONERADA':
                        totalExonerada += totalItem;
                        break;
                    case 'GRATUITA':
                        totalGratuita += totalItem;
                        break;
                }
            }

            const igvFactor = 1 + this.igv / 100;
            const baseImp = this.incluye_igv ? totalGravada / igvFactor : totalGravada;
            const igvMonto = baseImp * (this.igv / 100);

            // Asignaciones
            this.tot_base_imp = baseImp.toFixed(2);
            this.tot_igv = igvMonto.toFixed(2);
            this.tot_gratuita = (totalGratuita / igvFactor).toFixed(2);
            this.tot_exonerada = totalExonerada;

            const total =
                parseFloat(this.tot_base_imp) +
                parseFloat(this.tot_igv) +
                totalExonerada;

            return total.toFixed(2);
        },
        productosConStock() {
            return store.state.productos;
        }
    },
    methods: {
        seleccionDirecta(producto) {
            if (producto && producto.id) {
                this.abre_cantidad(producto);
                this.busca_p = '';
            }
        },


        inicio() {
            this.arra_cabe_doC = this.data
            if (this.data.data == undefined) {
                this.data.data = []
            }
            this.lista_productos = this.data.data
            var array = store.state.productos
            for (var i = 0; i < array.length; i++) {
                this.array_productos[this.array_productos.length] = array[i].id + ' / ' + array[i].nombre + ' / ' + array[i].medida
            }
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        selecciona() {
            var producto = this.busca_p.split('/')[0].trim()
            var data = store.state.productos.filter(item => item.id == producto)[0]
            if (data != undefined) {
                this.abre_cantidad(data)
            }
        },
        abre_cantidad(item) {
            this.producto_ingresado = item;
            this.operacion_edita = 'GRAVADA';
            this.nombreEdita = item.nombre;

            // costo con IGV por unidad (si tu sistema guarda costo por unidad)
            this.con_igv = Number(item.costo) || 0;
            this.sin_igv = (this.con_igv / 1.18).toFixed(4);

            // defaults
            this.cantidad = 1;
            this.selecto = item;
            this.modo = false;  // fuerza a elegir PAQ/UND
            this.btn = false;   // muestra botones
            this.dialo_cantidad = true;
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        editaProducto(val) {
            console.log(this.data, val)
            const index = this.lista_productos.findIndex(p => p.uuid === val.uuid);
            if (index !== -1) {
                const producto = this.lista_productos[index];
                this.codigoedita = index;
                this.selecto = producto;
                this.nombreEdita = producto.nombre;
                this.operacion_edita = producto.operacion;
                this.costo_edita = producto.costo_nuevo;
                this.dialogoProducto = true;
            }
        },

        async eliminar() {
            store.commit("dialogoprogress");
            var modo = 'RESTA'
            if (this.arra_cabe_doC.modo_ajuste == 'SALIDA') {
                modo = 'SUMA'
            }
            await modifica_stock_unitario(modo, this.selecto)

            await this.eliminar_mov()
            this.lista_productos.splice(this.codigoedita, 1)
            this.dialogoProducto = false
            this.genera_compra(false)
            store.commit("dialogoprogress");
        },
        async eliminar_mov() {
            if (this.selecto && this.selecto.id && this.selecto.uuid) {
                const pid = String(this.selecto.id);
                const lineId = this.data.id + '_' + String(this.selecto.uuid);

                await colempresa()
                    .doc("kardex")
                    .collection("historial")
                    .doc(pid)
                    .collection("detalle")
                    .doc(lineId)
                    .delete()
                    .catch(e => {
                        console.error("No se pudo borrar linea kardex:", e);
                    });
            } else {
                console.warn("No hay pid/line_id para borrar en kardex, skip.");
            }
        },
        grabaEdita() {
            this.lista_productos[this.codigoedita].operacion = this.operacion_edita.toString().trim()
            this.lista_productos[this.codigoedita].nombre = this.nombreEdita.toString().trim()
            this.lista_productos[this.codigoedita].costo_nuevo = this.costo_edita
            this.genera_compra(false)
            this.dialogoProducto = false
        },
        seleeciona_modo(tipo) {
            // tipo: 'entero' (paquete) | 'fraccion' (unidad)
            this.modo = tipo;
            this.btn = true; // oculta los botones tras elegir
            // asegúrate de tener un número en cantidad
            if (!this.cantidad || isNaN(this.cantidad)) this.cantidad = 1;
        },

        async agregaCatalogo() {
            try {
                store.commit("dialogoprogress");

                if (!this.modo) {
                    this.$store.commit('dialogosnackbar', 'Seleccione PAQUETE o UND antes de continuar.');
                    return;
                }

                const prod = this.producto_ingresado || this.selecto;
                if (!prod || !prod.id) {
                    this.$store.commit('dialogosnackbar', 'Producto no válido.');
                    return;
                }

                const factor = Number(prod.factor) || 1;             // unidades por paquete
                const qty = Number(this.cantidad) || 0;
                if (qty <= 0) {
                    this.$store.commit('dialogosnackbar', 'Ingrese una cantidad válida.');
                    return;
                }

                // unidades base que se moverán
                const unidades = this.modo === 'entero' ? (qty * factor) : qty;

                // Validación de stock en SALIDA
                const esSalida = this.arra_cabe_doC.modo_ajuste === 'SALIDA';
                const stockDisp = Number(prod.stock) || 0;
                if (esSalida && unidades > stockDisp) {
                    this.$store.commit('dialogosnackbar', `Stock insuficiente. Stock: ${stockDisp}, requerido: ${unidades}`);
                    return;
                }

                // Costos: trabajamos en costo unitario (por UNIDAD) para totales consistentes
                const costoUnit = Number(this.con_igv) || Number(prod.costo) || 0;

                // Objeto que se registra en la lista (cantidad en unidades base)
                const item = {
                    uuid: crypto.randomUUID() || "",
                    id: prod.id,
                    nombre: this.nombreEdita || prod.nombre,
                    medida: this.modo === 'entero' ? (prod.medida || 'PAQ') : 'UND',
                    operacion: this.operacion_edita,     // GRAVADA / GRATUITA / EXONERADA
                    costo: costoUnit,                // costo unitario
                    costo_nuevo: costoUnit,                // usado en totaliza()
                    stock: stockDisp,
                    factor: factor,                   // info de conversión
                    modo_cant: this.modo,                // 'entero' | 'fraccion'
                    cant_ingresada: qty,                    // lo que el usuario digitó
                    cantidad: unidades                  // *** SIEMPRE en UNIDADES base ***
                };

                // Mover stock (en unidades base)
                const modoStock = esSalida ? 'RESTA' : 'SUMA';
                await modifica_stock_unitario(modoStock, {
                    ...item,
                    // Por compatibilidad, algunos helpers esperan "cantidad" como unidades
                    cantidad: unidades,
                  //  uuid: crypto.randomUUID(),
                });

                // Cerrar diálogo y refrescar lista
                this.dialo_cantidad = false;
                this.lista_productos.push(item);

                // Actualiza cabecera/total
                this.genera_compra(false);

                // Limpieza del buscador
                this.busca_p = '';
                this.modo = false;
                this.btn = false;
            } catch (e) {
                console.error('Error en agregaCatalogo:', e);
                this.$toast?.error?.('Ocurrió un error al agregar el producto.');
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async genera_compra(cierra) {
            var array = this.arra_cabe_doC
            array.baseimponible = this.tot_base_imp
            array.igv = this.tot_igv
            array.porc_igv = this.igv
            array.tot_gratuita = this.tot_gratuita
            array.tot_exonerada = this.tot_exonerada
            array.total = this.totaliza
            array.data = this.lista_productos

            await nuevoMovimiento(array.id, array)
            if (cierra) {
                this.$emit('cierra_compra', false)
                this.dialogo_genera = false
            }
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
        conviertefecha_unix(date) {
            return moment(String(date)) / 1000
        },

        cierra() {
            this.$emit('cierra_compra', false)
        },
        async anula_mov() {
            this.progress = true
            var modo = 'RESTA'
            if (this.arra_cabe_doC.modo_ajuste == 'SALIDA') {
                modo = 'SUMA'
            }
            await modifica_stock_array(modo, this.lista_productos)
            await elmina_mov_kardex(this.arra_cabe_doC.id)
            this.progress = false
            this.dial_anula = false
            this.cierra()
        }
    },

}
</script>
