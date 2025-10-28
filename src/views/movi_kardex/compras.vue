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
                        <h4>Pago: {{ arra_cabe_doC.modo_pago }}</h4>
                        <v-btn class="mb-1" color="warning" @click="abre_modifica()" x-small> Editar Cabecera </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <h4>RUC : {{ arra_cabe_doC.num_doc }}</h4>
                        <h4>RAZON SOCIAL : {{ arra_cabe_doC.nom_proveedor }}</h4>
                        <h4>Observacion : {{ arra_cabe_doC.observacion }}</h4>
                        <div class="mt-2 mb-n5" v-if="!$store.state.esmovil">
                            <v-autocomplete autofocus class="mt-n3" label="Busca Producto" auto-select-first
                                v-model="busca_p" :items="array_productos" @keyup.enter="selecciona()"></v-autocomplete>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-simple-table dark fixed-header height="55vh" dense>
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
                                Cost Unit
                            </th>
                            <th class="text-left">
                                Cantidad
                            </th>
                            <th class="text-left">
                                Importe
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
                            <td width="35">{{ redondear(item.costo_nuevo) }}</td>
                            <td width="35">{{ item.cantidad }}</td>
                            <td width="35" v-if="item.operacion == 'GRAVADA'">S/.{{ redondear(item.cantidad *
                                item.costo_nuevo) }}</td>
                            <td width="35" v-if="item.operacion == 'GRATUITA'">S/.0.00</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
            <v-spacer></v-spacer>
            <v-row dense>
                <v-col cols="6">

                </v-col>
                <v-col cols="6" class="text-right">
                    <h5> Op.Gravada:<span class="red--text"> S/.{{ tot_base_imp }}</span></h5>
                    <h5> Op.Gratuita: <span class="red--text"> S/.{{ tot_gratuita }}</span></h5>
                    <h5> Op.Exonerada: <span class="red--text"> S/.{{ tot_exonerada }}</span></h5>
                    <h5> IGV {{ igv }}%: <span class="red--text"> S/.{{ tot_igv }}</span></h5>
                    <h5> TOTAL: <span class="red--text"> S/.{{ totaliza }}</span></h5>
                </v-col>
            </v-row>
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
        <v-dialog v-model="dial_agrega_prod" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_agrega_prod = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-select :items="arrayOperacion" label="Operacion" dense outlined v-model="operacion_edita"></v-select>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="6" class="mb-n4 mt-n1">
                        <v-text-field dense @focus="(foco_igv = false)" class="pa-3" v-model="sin_igv"
                            label="PRECIO SIN IGV"></v-text-field>
                    </v-col>
                    <v-col cols="6" class="mb-n4 mt-n1">
                        <v-text-field dense @focus="(foco_igv = true)" class="pa-3" v-model="con_igv"
                            label="PRECIO CON IGV"></v-text-field>
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
                    <v-btn color="error" text @click="(dial_agrega_prod = false)">
                        Cancela
                    </v-btn>
                    <v-btn color="green darken-1" text @click="agregaCatalogo()">
                        Agrega
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialo_cantidad" max-width="300px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_cantidad = !dialo_cantidad">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card>

                <v-card-title>
                    <v-row v-if="!btn" class="pa-1">
                        <v-col cols="6">
                            <v-btn color="success" block @click="seleeciona_modo('entero')">{{ this.selecto.medida
                                }}</v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="success" block @click="seleeciona_modo('fraccion')">UND.</v-btn>
                        </v-col>
                    </v-row>
                    <v-row class="mx-auto text-center" dense>
                        <v-col cols="6" class="mb-n4 mt-n1">
                            <v-text-field dense @focus="(foco_igv = false)" class="pa-3" v-model="sin_igv"
                                label="PRECIO SIN IGV"></v-text-field>
                        </v-col>
                        <v-col cols="6" class="mb-n4 mt-n1">
                            <v-text-field dense @focus="(foco_igv = true)" class="pa-3" v-model="con_igv"
                                label="PRECIO CON IGV"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-text-field type="number" autofocus outlined dense v-model="cantidad" label="CANTIDAD"
                        @focus="$event.target.select()" @keyup.enter="agregaCatalogo()"></v-text-field>
                </v-card-title>
                <v-btn class="mt-n6" color="red" @click="agregaCatalogo()" block>OK</v-btn>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_modifica" max-width="800px" persistent>

            <div>
                <v-system-bar window dark>
                    <v-icon @click="(dial_modifica = !dial_modifica)">mdi-close</v-icon>
                    <h5 class="text-center">REGISTRO DE COMPRAS</h5>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="pa-1" dense>
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field type="date" outlined dense v-model="date_ingreso"
                            label="Ingreso Producto"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="6">
                        <v-text-field readonly outlined dense v-model="num_doc" label="N° DOC PROVEE."
                            append-icon="mdi-magnify"
                            @click:append="$store.commit('dialogo_tabla_proveedores', false)"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field readonly outlined dense v-model="nom_proveedor"
                            label="NOMBRE PROVEEDOR"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="4">
                        <v-select :items="arraydocumento" label="Tipo" dense outlined
                            v-model="tipodocumento"></v-select>
                    </v-col>
                    <v-col cols="4">
                        <v-text-field :disabled="(num_doc == '')" type="text" outlined dense v-model="sreferencia"
                            label="Serie Referencia" placeholder="F001"></v-text-field>
                    </v-col>
                    <v-col cols="4">
                        <v-text-field :disabled="(sreferencia == '')" type="number" outlined dense v-model="creferencia"
                            label="Correlativo Referencia" placeholder="1234"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n8" dense>
                    <v-col cols="3">
                        <v-select :items="arraymodo" label="Modo Pago" dense outlined v-model="modo_pago"></v-select>
                    </v-col>
                    <v-col cols="9">
                        <v-textarea outlined dense v-model="observacion" auto-grow filled label="OBSERVACION"
                            rows="1"></v-textarea>
                    </v-col>
                </v-row>
                <v-row class="pa-1 mt-n2" dense>
                    <v-col cols="12">
                        <v-btn block class="" @click="guarda_moficacion()" color="success">GUARDA MODIFICACION</v-btn>
                    </v-col>
                </v-row>

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
                    <h2 class="text-center">SEGURO QUE DESEA ANULAR??</h2>
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
import cateogrias from '@/components/dialogos/dialogocatalogo'
import clientes from '@/components/dialogos/dialogoClientes'
import moment from 'moment'
import store from '@/store/index'
import catalogo from '@/components/dialogos/dialogocatalogo'
import tabla_proveedor from '@/components/configEmpresa/tabla_proveedor'
import cata_productos from '@/views/movi_kardex/lista_productos'
import {
    nuevoMovimiento,
    edita_Movimiento,
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
        cateogrias,
        catalogo,
        tabla_proveedor,
        cata_productos
    },
    props: {
        data: [],
    },
    data() {
        return {
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
            arraydocumento: ['FACTURA', 'BOLETA', 'NOTA DE VENTA'],
            tipodocumento: 'FACTURA',
            edita_app: false,
            sreferencia: '',
            creferencia: '',
            observacion: '',
            num_doc: '',
            nom_proveedor: '',
            dial: false,
        }
    },
    created() {
        this.inicio()
        this.dial = true
    },
    computed: {
        totaliza() {
            if (this.foco_igv) {
                this.sin_igv = (this.con_igv / 1.18).toFixed(4)
            } else {
                this.con_igv = (this.sin_igv * 1.18).toFixed(4)
            }

            var suma_gravada = 0
            var suma_exo = 0
            var suma_grati = 0
            var suma = 0
            if (this.lista_productos != undefined) {
                for (var i = 0; i < this.lista_productos.length; i++) {
                    var data = this.lista_productos[i]
                    if (data.operacion == 'GRAVADA') {
                        suma_gravada = suma_gravada + (data.cantidad * data.costo_nuevo)
                    }
                    if (data.operacion == 'EXONERADA') {
                        suma_exo = suma_exo + (data.cantidad * data.costo_nuevo)
                    }
                    if (data.operacion == 'GRATUITA') {
                        suma_grati = suma_grati + (data.cantidad * data.costo_nuevo)
                    }

                }
                if (this.incluye_igv) {
                    this.tot_base_imp = (suma_gravada / (1 + (this.igv) / 100)).toFixed(2)
                    this.tot_igv = (suma_gravada / (1 + (this.igv) / 100) * (this.igv) / 100).toFixed(2)
                } else {
                    this.tot_base_imp = (suma_gravada).toFixed(2)
                    this.tot_igv = ((suma_gravada) * (this.igv) / 100).toFixed(2)
                }
                this.tot_gratuita = (suma_grati / (1 + (this.igv) / 100)).toFixed(2)
                this.tot_exonerada = suma_exo
                suma = parseFloat(this.tot_base_imp) + parseFloat(this.tot_igv) + suma_exo
                return suma.toFixed(2)
            }
        },

    },
    methods: {
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
            console.log(item)
            this.producto_ingresado = item
            this.operacion_edita = 'GRAVADA'
            this.nombreEdita = item.nombre

            // Asignamos precios base del producto
            this.con_igv = Number(item.costo || 0)
            this.sin_igv = (Number(this.con_igv) / 1.18).toFixed(4)

            // Cantidad por defecto
            this.cantidad = 1

            // Guardamos selección y preparamos UI de modo
            this.selecto = item
            this.modo = 'fraccion'       // por defecto "unidad"
            this.btn = false             // muestra los botones paquete/unidad
            this.dialo_cantidad = true
        },
        seleeciona_modo(tipo) {
            // tipo: 'entero' (paquete) | 'fraccion' (unidad)
            this.modo = tipo
            this.btn = true              // oculta los botones tras elegir
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        editaProducto(val) {
            for (var i = 0; i < this.lista_productos.length; i++) {
                if (this.lista_productos[i].uuid == val.uuid) {
                    this.codigoedita = i
                    this.selecto = this.lista_productos[i]
                    this.nombreEdita = this.lista_productos[i].nombre
                    this.operacion_edita = this.lista_productos[i].operacion
                    this.costo_edita = this.lista_productos[i].costo_nuevo
                }
            }
            this.dialogoProducto = true
        },
        async eliminar() {
             store.commit("dialogoprogress");
            modifica_stock_unitario('RESTA', this.selecto)
                    await this.eliminar_mov()
            this.lista_productos.splice(this.codigoedita, 1)
             store.commit("dialogoprogress");
            this.dialogoProducto = false
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
        async agregaCatalogo() {
            store.commit("dialogoprogress")
            this.busca_p = ''

            const prod = this.producto_ingresado || {}

            const factor = Number(prod.factor) > 0 ? Number(prod.factor) : 1

            const qtyIngresada = parseFloat(this.cantidad) || 0
            // Si es paquete ("entero"), multiplicamos por factor
            const cantidadFinal = (this.modo === 'entero') ? (qtyIngresada) : qtyIngresada
            console.log(this.modo, prod)
            const medida = (this.modo === 'entero') ? prod.medida : 'UNIDAD'
            // Precio que guardas (con IGV como ya lo hacías)
            let costoConIgv = Number(this.con_igv) || 0

            // 💡 Si quisieras que el precio ingresado sea por PAQUETE y convertirlo a unitario,
            // usa esta línea en vez de la anterior:
            // if (this.modo === 'entero') costoConIgv = costoConIgv / factor

            const array_producto = {
                uuid: crypto.randomUUID() || "",
                id: prod.id,
                cantidad: cantidadFinal,
                nombre: prod.nombre,
                medida: medida,            // deja tu medida como la tienes
                stock: prod.stock,
                operacion: this.operacion_edita,
                costo: costoConIgv,
                costo_nuevo: costoConIgv,

                // metadatos útiles (no rompen nada existente)
                factor_paquete: factor,
                modo_ingreso: this.modo         // 'entero' (paquete) | 'fraccion' (unidad)

            }

            await modifica_stock_unitario('SUMA', array_producto)

            this.dialo_cantidad = false
            this.lista_productos.push(array_producto)
            this.genera_compra(false)
            store.commit("dialogoprogress")
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
        abre_modifica() {
            console.log(this.arra_cabe_doC)
            this.date_ingreso = moment.unix(this.arra_cabe_doC.fecha_ingreso).format('YYYY-MM-DD')
            this.date = moment.unix(this.arra_cabe_doC.fecha_emision).format('YYYY-MM-DD')
            this.nom_proveedor = this.arra_cabe_doC.nom_proveedor
            this.num_doc = this.arra_cabe_doC.num_doc
            this.tipodocumento = this.arra_cabe_doC.tipodocumento
            this.creferencia = this.arra_cabe_doC.creferencia
            this.sreferencia = this.arra_cabe_doC.sreferencia
            this.operacion = this.arra_cabe_doC.operacion
            this.modo_pago = this.arra_cabe_doC.modo_pago
            this.dial_modifica = true
        },
        async guarda_moficacion() {
            this.progress = true
            this.arra_cabe_doC.fecha_ingreso = this.conviertefecha_unix(this.date_ingreso)
            this.arra_cabe_doC.fecha_emision = this.conviertefecha_unix(this.date)
            this.arra_cabe_doC.nom_proveedor = this.nom_proveedor
            this.arra_cabe_doC.num_doc = this.num_doc
            this.arra_cabe_doC.tipodocumento = this.tipodocumento
            this.arra_cabe_doC.creferencia = this.creferencia
            this.arra_cabe_doC.sreferencia = this.sreferencia
            this.arra_cabe_doC.operacion = this.operacion
            this.arra_cabe_doC.modo_pago = this.modo_pago
            await nuevoMovimiento(this.arra_cabe_doC.id, this.arra_cabe_doC)
            await this.genera_compra(false)
            this.progress = false
            this.dial_modifica = false
        },
        selec_proveedor(data) {
            this.num_doc = data.codigo
            this.nom_proveedor = data.rsocial
            this.dialogoproveedor = false
        },
        cierra() {
            this.$emit('cierra_compra', false)
        },
        async anula_mov() {
            this.progress = true
            await modifica_stock_array('RESTA', this.lista_productos)
            await elmina_mov_kardex(this.arra_cabe_doC.id)
            this.progress = false
            this.dial_anula = false
            this.cierra()
        }
    },

}
</script>
