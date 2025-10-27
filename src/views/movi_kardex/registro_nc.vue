<template>
<div>
    <v-card class="pa-3">
        <v-card-text>
            <v-row class="mb-n5 mt-n6" dense>
                <v-col cols="6">
                    <h4>FECHA DE EMISION: {{conviertefecha(arra_cabe_doC.fecha_emision)}}</h4>
                    <h4>FECHA DE INGRESO: {{conviertefecha(arra_cabe_doC.fecha_ingreso)}}</h4>
                    <h4>DOCUMENTO: {{arra_cabe_doC.tipodocumento}} / {{arra_cabe_doC.sreferencia}}-{{arra_cabe_doC.creferencia}}</h4>
                    <h4>REF: {{arra_cabe_doC.ref.sreferencia}}-{{arra_cabe_doC.ref.creferencia}}</h4>
                    <v-btn class="mb-1" color="warning" @click="abre_modifica()" x-small> Editar Cabecera </v-btn>
                </v-col>
                <v-col cols="6">
                    <h4>RUC : {{arra_cabe_doC.num_doc}}</h4>
                    <h4>RAZON SOCIAL : {{arra_cabe_doC.nom_proveedor}}</h4>
                    <h4>Observacion : {{arra_cabe_doC.motivo}}</h4>
                    <div class="mt-2 mb-n5">
                        <v-autocomplete autofocus class="mt-n3" label="Busca Producto" auto-select-first v-model="busca_p" :items="array_productos" @keyup.enter="selecciona()"></v-autocomplete>
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
                            TG
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
                            <v-icon color="green" @click="editaProducto(item)" small class="mt-n1">mdi-pencil</v-icon>
                            {{item.id}} {{ item.nombre }}
                        </td>
                        <td width="30">{{ item.medida }}</td>
                        <td v-if="item.operacion=='GRAVADA'" width="10">
                            <v-icon color="info" small @click="cambia_tg(item)">NO</v-icon>
                        </td>
                        <td v-if="item.operacion=='GRATUITA'" width="10">
                            <v-icon color="error" small @click="cambia_tg(item)">SI</v-icon>
                        </td>
                        <td width="35">{{ redondear(item.costo_nuevo) }}</td>
                        <td width="35">{{ item.cantidad }}</td>
                        <td width="35" v-if="item.operacion=='GRAVADA'">S/.{{ redondear(item.cantidad * item.costo_nuevo)}}</td>
                        <td width="35" v-if="item.operacion=='GRATUITA'">S/.0.00</td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>
        <v-spacer></v-spacer>
        <v-row dense>
           
            <v-col cols="6">
                <v-btn block color="success" x-small @click="reprocesa_todo()" v-if="false">REPROCESA</v-btn>
                <v-btn small class="mt-3" color="info" block @click="dialogo_genera = true">GUARDAR</v-btn>
                <v-btn small block class="mt-3" color="error" @click="(dial_anula=true)">ANULAR</v-btn>
            </v-col>
            <v-col cols="6" class="text-right">
                <h5> Op.Gravada:<span class="red--text"> S/.{{tot_base_imp}}</span></h5>
                <h5> Op.Gratuita: <span class="red--text"> S/.{{tot_gratuita}}</span></h5>
                <h5> Op.Exonerada: <span class="red--text"> S/.{{tot_exonerada}}</span></h5>
                <h5> IGV {{igv}}%: <span class="red--text"> S/.{{tot_igv}}</span></h5>
                <h5> TOTAL: <span class="red--text"> S/.{{totaliza}}</span></h5>
            </v-col>
        </v-row>
    </v-card>

    <v-dialog v-model="dialogo_genera" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="dialogo_genera=!dialogo_genera">mdi-close</v-icon>
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
    <v-dialog v-model="dial_configura" max-width="300">
        <div>
            <v-system-bar window dark>
                <v-icon @click="dial_configura = false">mdi-close</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-row dense>
                <v-col cols="12">
                    <v-text-field label="% IGV" outline type="number" dense v-model="igv"></v-text-field>
                </v-col>
            </v-row>
            <v-checkbox disabled dense v-model="incluye_igv" label="INCLUYE IGV"></v-checkbox>
            <v-card-actions>

                <v-btn color="success" block @click="guarda_sett()">APLICA</v-btn>

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
                    <v-text-field dense @keyup.enter="grabaEdita()" class="pa-3" v-model="costo_edita" label="Costo Unitario"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="mx-auto text-center" dense>
                <v-col cols="12" class="mb-n4 mt-n1">
                    <v-text-field dense @keyup.enter="grabaEdita()" class="pa-3" v-model="nombreEdita" label="Nombre"></v-text-field>
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
                    <v-text-field dense @focus="(foco_igv=false)" class="pa-3" v-model="sin_igv" label="PRECIO SIN IGV"></v-text-field>
                </v-col>
                <v-col cols="6" class="mb-n4 mt-n1">
                    <v-text-field dense @focus="(foco_igv=true)" class="pa-3" v-model="con_igv" label="PRECIO CON IGV"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="mx-auto text-center" dense>
                <v-col cols="12" class="mb-n4 mt-n1">
                    <v-text-field dense @keyup.enter="grabaEdita()" class="pa-3" v-model="nombreEdita" label="Nombre"></v-text-field>
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
    <v-dialog v-model="dialo_cantidad" max-width="400px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="dialo_cantidad = !dialo_cantidad, btn = false, modo = false">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-card-title>
                <div>
                    <v-select :items="arrayOperacion" label="Operacion" dense outlined v-model="operacion_edita"></v-select>

                    <v-text-field type="number" outlined dense v-model="cantidad" :label="this.selecto.medida" autofocus @focus="$event.target.select()" @keydown.enter="agregaCatalogo()">
                    </v-text-field>
                    <v-row class="mx-auto text-center" dense>
                        <v-col cols="6" class="mb-n4 mt-n1">
                            <v-text-field dense @focus="(foco_igv=false)" class="pa-3" v-model="sin_igv" label="PRECIO SIN IGV"></v-text-field>
                        </v-col>
                        <v-col cols="6" class="mb-n4 mt-n1">
                            <v-text-field dense @focus="(foco_igv=true)" class="pa-3" v-model="con_igv" label="PRECIO CON IGV"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-btn class="mt-1" color="red" @click="agregaCatalogo()" block>OK</v-btn>
                </div>
            </v-card-title>

        </v-card>
    </v-dialog>
    <v-dialog persistent v-model="progress" max-width="500">
        <v-card class="pa-12">
            <v-progress-linear indeterminate color="blue-grey" height="25">
            </v-progress-linear>
            Este proceso puede tardar un momento
        </v-card>
    </v-dialog>
    <v-dialog v-model="dial_anula" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="(dial_anula=!dial_anula)">mdi-close</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-card-text>
                <h2 class="text-center">SEGURO DE QUE DESEA ANULAR??</h2>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="info">SI</v-btn>
                <v-btn color="success">NO</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
    <catalogo @array="ingresa_producto($event)" />
</div>
</template>

<script>
import cateogrias from '@/components/dialogos/dialogocatalogo'
import clientes from '@/components/dialogos/dialogoClientes'
import moment from 'moment'
import store from '@/store/index'
import catalogo from '@/components/dialogos/catalogo_productos'
import {
    nuevoMovimiento,
} from '../../db'
import {
    modifica_stock_array,
    modifica_stock_unitario
} from '../../control_stock'
export default {
    name: 'caja',

    components: {
        clientes,
        cateogrias,
        catalogo
    },
    props: {
        data: [],
    },
    data() {
        return {
            dial_anula: false,
            progress: false,
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
            date_ingreso: ''
        }
    },
    created() {
        this.inicio()
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
                this.tot_gratuita = suma_grati.toFixed(2)
                this.tot_exonerada = suma_exo
                suma = parseFloat(this.tot_base_imp) + parseFloat(this.tot_igv) + suma_exo
                return suma.toFixed(2)
            }
        },

    },
    methods: {
        inicio() {
            this.arra_cabe_doC = this.data
            console.log(this.data)
            if (this.arra_cabe_doC.cod_motivo == '01' && this.data.data == '' ||
                this.arra_cabe_doC.cod_motivo == '02' && this.data.data == '' ||
                this.arra_cabe_doC.cod_motivo == '03' && this.data.data == '' ||
                this.arra_cabe_doC.cod_motivo == '06' && this.data.data == '') {
                this.data.data = this.data.ref.data
                this.lista_productos = this.data.data
                this.agrega_primera_vez()
            }
            if (this.data.data != undefined) {
                this.lista_productos = this.data.data
            }

            var array = this.data.ref.data
            for (var i = 0; i < array.length; i++) {
                this.array_productos[this.array_productos.length] = array[i].id + '/' + array[i].id + '-' + array[i].nombre + ' / ' + array[i].cantidad + ' ' + array[i].medida
            }
        },
        async agrega_primera_vez() {
            await this.reprocesa()
            await this.genera_compra(false)

        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY')
        },
        selecciona() {
            var producto = this.busca_p.split('/')[0].trim()
            var medida = this.busca_p.split('/')[2].trim()
            var data = this.data.ref.data.filter(item => item.id == producto && item.cantidad + ' ' + item.medida == medida)[0]
            if (data != undefined) {
                this.abre_cantidad(data)
            }
        },
        abre_cantidad(item) {
            this.producto_ingresado = item
            console.log(item)
            this.operacion_edita = item.operacion
            this.con_igv = item.costo_nuevo
            this.sin_igv = (this.con_igv / 1.18).toFixed(4)
            this.dialo_cantidad = true
        },
        seleeciona_modo(valor) {
            this.modo = valor
            this.btn = true
        },
        guarda_sett() {
            this.dial_configura = false
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        abre_lotes(item) {
            this.codigoedita = item
            store.commit('id_lote', item.id)
        },
        selecciona_lote(item) {
            for (var i = 0; i < this.lista_productos.length; i++) {
                if (this.lista_productos[i].id == this.codigoedita.id) {
                    this.lista_productos[i].lote = item.id_lote
                }
            }
        },
        editaProducto(val) {
            for (var i = 0; i < this.lista_productos.length; i++) {
                if (this.lista_productos[i].key_mov == val.key_mov) {
                    this.codigoedita = i
                    this.selecto = this.lista_productos[i]
                    this.nombreEdita = this.lista_productos[i].nombre
                    this.operacion_edita = this.lista_productos[i].operacion
                    this.costo_edita = this.lista_productos[i].costo_nuevo
                }
            }
            this.dialogoProducto = true
        },
        eliminar() {
            if (this.selecto.key_mov != undefined) {
                var array = {
                    fecha: this.arra_cabe_doC.fecha_ingreso,
                    tipocomprobante: this.arra_cabe_doC.operacion
                }
                if (this.arra_cabe_doC.cod_motivo != '01' && this.arra_cabe_doC.cod_motivo != '02' &&
                    this.arra_cabe_doC.cod_motivo != '03' && this.arra_cabe_doC.cod_motivo != '06' &&
                    this.arra_cabe_doC.cod_motivo != '07') {
                    console.log("no suma")
                } else {
                    if (this.edita_app) {
                        modifica_stock_unitario('TODOS', 'SUMA', this.selecto, array, true)
                    } else {
                        modifica_stock_unitario('ALMACEN', 'SUMA', this.selecto, array, true)
                    }
                }

            }
            this.lista_productos.splice(this.codigoedita, 1)
            this.dialogoProducto = false
        },
        grabaEdita() {
            this.lista_productos[this.codigoedita].operacion = this.operacion_edita.toString().trim()
            this.lista_productos[this.codigoedita].nombre = this.nombreEdita.toString().trim()
            this.lista_productos[this.codigoedita].costo_nuevo = this.costo_edita
            this.genera_compra(false)
            this.dialogoProducto = false
        },
        async agregaCatalogo() {
            this.busca_p = ''
            var value = this.producto_ingresado
            value.costo = this.con_igv
            value.operacion = this.operacion_edita
            value.fraccion = false
            if (this.cantidad > value.cantidad) {
                store.commit('dialogosnackbar', "NO PUEDE SER MAYOR A LA CANTIDAD DEL DOCUMENTO DE REFERENCIA")
            } else {
                store.commit("dialogoprogress")
                value.cantidad = parseFloat(this.cantidad)
                var array_producto = []
                var medida = value.medida
                if (this.modo == 'fraccion') {
                    var medida = 'UND'
                    value.costo = (value.costo / value.factor).toFixed(2)
                    value.fraccion = true
                    value.cantidad = parseFloat(this.cantidad_und)
                }
                console.log(value)
                array_producto = {
                    uuid: this.create_UUID().substring(29),
                    id: value.id,
                    cantidad: value.cantidad,
                    nombre: value.nombre,
                    medida: medida,
                    stock: value.stock,
                    operacion: value.operacion,
                    costo: value.costo,
                    costo_nuevo: value.costo_nuevo,
                    fraccion: value.fraccion,
                    factor: value.factor,
                    lote: 0,
                    key_mov: ''
                }

                var cabecera = {
                    fecha: this.arra_cabe_doC.fecha_ingreso,
                    cod_comprobante: this.arra_cabe_doC.cod_doc,
                    serie: this.arra_cabe_doC.sreferencia,
                    correlativo: this.arra_cabe_doC.creferencia,
                    proveedor: this.arra_cabe_doC.nom_proveedor,
                    tipocomprobante: this.arra_cabe_doC.operacion,
                    numeracion: this.arra_cabe_doC.id
                }
                console.log(this.arra_cabe_doC)
                if (this.arra_cabe_doC.cod_motivo != '01' && this.arra_cabe_doC.cod_motivo != '02' &&
                    this.arra_cabe_doC.cod_motivo != '03' && this.arra_cabe_doC.cod_motivo != '06' &&
                    this.arra_cabe_doC.cod_motivo != '07') {
                    console.log("no suma")
                } else {

                    if (this.edita_app) {
                        var r = await modifica_stock_unitario('TODOS', 'RESTA', array_producto, cabecera, false)
                        array_producto.key_mov = r[1]
                    } else {
                        var r = await modifica_stock_unitario('ALMACEN', 'RESTA', array_producto, cabecera, false)
                        array_producto.key_mov = r
                    }

                }

                console.log(r)
                this.dialo_cantidad = false
                this.lista_productos.push(array_producto)
                this.genera_compra(false)
                store.commit("dialogoprogress")
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
                this.$emit('cierra_nc', false)
                this.dialogo_genera = false
            }
        },
        cambia_tg(data) {
            let index = this.lista_productos.findIndex(x => x.key_mov == data.key_mov)
            switch (data.operacion) {
                case 'GRATUITA':

                    this.lista_productos[index].operacion = 'GRAVADA'
                    console.log(this.lista_productos[index])
                    break;
                case 'GRAVADA':
                    this.lista_productos[index].operacion = 'GRATUITA'
                    break;

            }
        },
        async reprocesa() {
            this.progress = true
            var cabecera = {
                fecha: this.arra_cabe_doC.fecha_ingreso,
                cod_comprobante: this.arra_cabe_doC.cod_doc,
                serie: this.arra_cabe_doC.sreferencia,
                correlativo: this.arra_cabe_doC.creferencia,
                proveedor: this.arra_cabe_doC.nom_proveedor,
                tipocomprobante: this.arra_cabe_doC.operacion,
                numeracion: this.arra_cabe_doC.id
            }
            const array = await modifica_stock_array('TODOS', 'SUMA', this.lista_productos, cabecera, false)
            this.lista_productos = array
            this.progress = false
        },
        async reprocesa_todo() {
            this.progress = true
            var cabecera = {
                fecha: this.arra_cabe_doC.fecha_ingreso,
                cod_comprobante: this.arra_cabe_doC.cod_doc,
                serie: this.arra_cabe_doC.sreferencia,
                correlativo: this.arra_cabe_doC.creferencia,
                proveedor: this.arra_cabe_doC.nom_proveedor,
                tipocomprobante: this.arra_cabe_doC.operacion,
                numeracion: this.arra_cabe_doC.id
            }
            const array = await modifica_stock_array('TODOS', 'RESTA', this.lista_productos, cabecera, false)
            this.lista_productos = array
            await this.genera_compra(false)
            this.progress = false
        },
        async elimina_historial() {
            var array = {
                fecha: this.arra_cabe_doC.fecha_ingreso
            }
            await modifica_stock_array('TODOS', 'RESTA', this.lista_productos, array, true)
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
        abre_modifica(){
            
        }
    },

}
</script>
