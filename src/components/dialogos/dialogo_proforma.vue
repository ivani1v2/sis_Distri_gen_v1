<template>
    <v-dialog v-model="dial" max-width="1050px" persistent transition="dialog-bottom-transition">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="orange" @click="dialogAgrega = true">mdi-plus</v-icon>
                <v-icon large color="green" @click="dial_catalogo = !dial_catalogo">mdi-magnify</v-icon>
                <v-icon color="red" large @click="consulta_correlativo()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-row class="pa-2" dense>
                <v-col cols="6" sm="4" xs="6">
                    <v-text-field type="date" outlined dense v-model="date" label="Emision"></v-text-field>
                </v-col>
                <v-col cols="6" sm="4" xs="6">
                    <v-text-field type="date" outlined dense v-model="date_vence"
                        label="Vencimiento(30 dias)"></v-text-field>
                </v-col>
                <v-col cols="12" sm="4" xs="12" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field style="font-family:verdana;font-size:75%;" type="number" outlined dense
                        v-model="num_cliente" label="N°Doc" append-icon="mdi-magnify" @click:append="BuscarDocumento()"
                        @keyup.enter="BuscarDocumento()"></v-text-field>
                </v-col>
            </v-row>
            <v-row dense class="pa-2 mt-n10 mb-n7">
                <v-col cols="6">
                    <v-text-field style="font-family:verdana;font-size:75%;" outlined dense v-model="nom_cliente"
                        label="Nombre Cliente"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field style="font-family:verdana;font-size:75%;" outlined dense v-model="dir_cliente"
                        label="Direccion Cliente"></v-text-field>
                </v-col>
            </v-row>
            <v-row dense class="pa-2 mt-n10 mb-n7">
                <v-col cols="8">
                    <v-textarea style="font-family:verdana;font-size:75%;" outlined dense v-model="observacion"
                        auto-grow filled label="OBSERVACION" rows="1"></v-textarea>
                </v-col>
                <v-col cols="4">
                    <v-select style="font-size:85%;" outlined dense v-model="modo_pago" :items="array_modo"
                        menu-props="auto" hide-details label="Tipo Doc"></v-select>
                </v-col>
            </v-row>
            <v-simple-table dark fixed-header height="50vh" dense>
                <template v-slot:default>

                    <thead>
                        <tr>
                            <th class="text-left">

                            </th>
                            <th class="text-left">
                                Descripcion
                            </th>
                            <th class="text-left">
                                medida
                            </th>
                            <th class="text-left">
                                Und.
                            </th>
                            <th class="text-left">
                                Precio
                            </th>
                            <th class="text-left">
                                Tot.
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr v-for="item in lista_productos" :key="item.id">
                            <td width="5">
                                <v-menu>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon v-bind="attrs" v-on="on">
                                            <v-icon>mdi-dots-vertical</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click.prevent="editar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="yellow">mdi-pencil</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Editar</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="eliminar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="red">mdi-delete</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Borrar</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>

                            </td>
                            <td style="font-family:verdana;font-size:75%;">{{ item.id }}-{{ item.nombre }} <strong
                                    class="red--text" v-if="item.operacion == 'GRATUITA'"> -
                                    Gratuita</strong></td>
                            <td style="font-family:verdana;font-size:75%;">{{ item.medida }}</td>
                            <td width="100">
                                <v-row class="mt-n4 mb-n6">
                                    <v-col cols="12">
                                        <v-text-field type="number" dense v-model="item.cantidad"></v-text-field>
                                    </v-col>
                                </v-row>
                            </td>
                            <td width="100" v-if="item.operacion != 'GRATUITA'">
                                <v-row class="mt-n4 mb-n6">
                                    <v-col cols="12">
                                        <v-text-field type="number" dense v-model="item.precioedita"></v-text-field>
                                    </v-col>
                                </v-row>
                            </td>
                            <td width="100" v-if="item.operacion != 'GRATUITA'">S/.{{ redondear(item.cantidad *
                                item.precioedita) }}</td>
                        </tr>
                    </tbody>
                    <v-card-text>

                    </v-card-text>

                </template>
            </v-simple-table>

            <v-spacer></v-spacer>
            <v-row class="mt-1">
                <v-col cols="8">

                </v-col>
                <v-col cols="4">
                    <h3>TOTAL: {{ total(lista_productos) }}</h3>
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
                    <h2 class="text-center">SEGURO QUE DESEA GENERAR NUEVA PROFORMA?</h2>

                </v-card-text>
                <v-card-actions>
                    <v-btn color="success" block @click="genera_proforma()">SI</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogAgrega" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogAgrega = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="mb-n12">
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arraytipoProducto" label="Tipo" dense outlined
                            v-model="tipoproducto"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arrayOperacion" label="Operacion" dense outlined
                            v-model="tipooperacion"></v-select>
                    </v-col>
                </v-row>
                <v-row class="mt-4">
                    <v-col cols="6" xs="6">
                        <v-text-field dense outlined type="number" v-model="cantidadSinCodigo"
                            label="Cantidad"></v-text-field>
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field dense outlined type="number" v-model="precioSinCodigo"
                            label="Precio"></v-text-field>
                    </v-col>

                </v-row>
                <v-select dense outlined class="mt-n6" v-model="medidasincodigo" :items="$store.state.medidas"
                    menu-props="auto" hide-details label="Medida"></v-select>
                <v-textarea class="mt-4" @keyup.enter="agregaSinCatalogo()" dense outlined auto-grow filled
                    v-model="nombreSincodigo" label="Descripcion" rows="1"></v-textarea>

                <v-card-actions>

                    <v-spacer></v-spacer>

                    <v-btn color="green darken-1" text @click="agregaSinCatalogo()">
                        Agregar
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog v-model="dial_edita" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_edita = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="mb-n12">
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arraytipoProducto" label="Tipo" dense outlined
                            v-model="selecto.tipoproducto"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arrayOperacion" label="Operacion" dense outlined
                            v-model="selecto.operacion"></v-select>
                    </v-col>
                </v-row>
                <v-row class="mt-4">
                    <v-col cols="6" xs="6">
                        <v-text-field dense outlined type="number" v-model="selecto.cantidad"
                            label="Cantidad"></v-text-field>
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field dense outlined type="number" v-model="selecto.precioedita"
                            label="Precio"></v-text-field>
                    </v-col>

                </v-row>
                <v-select dense outlined class="mt-n6" v-model="selecto.medida" :items="$store.state.medidas"
                    menu-props="auto" hide-details label="Medida"></v-select>
                <v-textarea class="mt-4" @keyup.enter="agregaSinCatalogo()" dense outlined auto-grow filled
                    v-model="selecto.nombre" label="Descripcion" rows="1"></v-textarea>

                <v-card-actions>

                    <v-spacer></v-spacer>

                    <v-btn color="green darken-1" text @click="dial_edita = false">
                        Agregar
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>
        <catalogo v-if="dial_catalogo" @array="agregaCatalogo($event)" @cierra="dial_catalogo = false" />

        <clientes v-if="dialogo_clientes" @array="agregacliente($event)" @cierra="dialogo_cliente = false" />
    </v-dialog>
</template>

<script>
import {
    obtenContador,
    nuevoProformas,
    sumaContador
} from '../../db'
import moment from 'moment'
import catalogo from '@/components/dialogos/dialogocatalogo'
import store from '@/store/index'
import clientes from '@/components/dialogos/dialogoClientes'
import {
    generaproforma
} from '../../pdf_proforma'
import axios from "axios"
export default {
    name: 'caja',

    components: {
        catalogo,
        clientes
    },
    props: {
        data: '',
    },
    data() {
        return {
            dial_catalogo: false,
            dial: false,
            dial_edita: false,
            dialogo_genera: false,
            dialogAgrega: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date_vence: moment(String(new Date)).add(30, 'd').format('YYYY-MM-DD'),
            lista_productos: [],
            num_cliente: '',
            nom_cliente: '',
            dir_cliente: '',
            observacion: '',
            correlativo_proforma: '',
            arraytipoProducto: ['BIEN', 'SERVICIO'],
            arrayOperacion: [
                'GRAVADA',
                'EXONERADA',
            ],
            tipooperacion: 'GRAVADA',
            tipoproducto: "BIEN",
            cantidadSinCodigo: 1,
            precioSinCodigo: 1,
            medidasincodigo: 'UNIDAD',
            nombreSincodigo: '',
            array_modo: ['CONTADO', 'CREDITO'],
            modo_pago: 'CONTADO',
            selecto: '',
            dialogo_clientes: false,
        }
    },
    computed: {

    },
    created() {
        console.log(this.data)
        if (this.data != '') {
            console.log('editando')
            this.num_cliente = this.data.num_cliente
            this.nom_cliente = this.data.nom_cliente
            this.dir_cliente = this.data.dir_cliente
            this.observacion = this.data.observacion
            this.modo_pago = this.data.modo_pago
            this.date = moment.unix(this.data.fecha_emision).format('YYYY-MM-DD')
            this.date_vence = moment.unix(this.data.fecha_vencimiento).format('YYYY-MM-DD')
            this.lista_productos = this.data.data
        }
        this.dial = true
    },

    methods: {
        editar(data) {
            console.log(data)
            this.selecto = data
            this.dial_edita = true
        },
        cierra() {
            this.$emit('cierra', false)
        },
        eliminar(item) {
            if (confirm('seguro de querer borrar item?')) {
                for (var i = 0; i < this.lista_productos.length; i++) {
                    if (this.lista_productos[i].id == item.id) {
                        this.lista_productos.splice(i, 1)
                    }
                }
            }

        },
        abrir_comprobantes() {
            this.dialo_datos = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },
        consulta_correlativo() {
            if (this.lista_productos == '') {
                alert('falta items')
                return
            }
            obtenContador().once("value").then((snapshot) => {
                this.correlativo_proforma = snapshot.val().ordenproformas
                this.dialogo_genera = true
            })
        },
        async genera_proforma() {

            store.commit("dialogoprogress")
            var fecha_emision = moment(String(this.date)) / 1000
            var fecha_vencimiento = moment(String(this.date_vence)) / 1000
            if (this.num_cliente == '') {
                this.num_cliente = '00000000000'
            }
            if (this.nom_cliente == '') {
                this.nom_cliente = 'Cliente Varios'
            }
            if (this.data != '') {
                var id = this.data.id
            } else {
                var id = this.correlativo_proforma
            }
            const productosModificados = this.lista_productos.map(producto => ({
                ...producto,
                precio: producto.precioedita // Copia el valor de precio a precioedita
            }));
            var array = {
                id: id,
                fecha_emision: fecha_emision,
                fecha_vencimiento: fecha_vencimiento,
                num_cliente: this.num_cliente,
                nom_cliente: this.nom_cliente,
                dir_cliente: this.dir_cliente,
                observacion: this.observacion,
                total: this.total(this.lista_productos),
                modo_pago: this.modo_pago,
                responsable: store.state.permisos.correo.slice(0, -13),
                data: productosModificados
            }
            await nuevoProformas(array.id, array)
            generaproforma(array, store.state.configImpresora.tamano)
            if (this.data == '') {
                sumaContador("ordenproformas", (parseInt(this.correlativo_proforma) + 1).toString().padStart(4, 0))
            }

            this.limpia_data()

        },
        total(array) {
            var suma = 0
            for (var i = 0; i < array.length; i++) {
                if (array[i].operacion != 'GRATUITA') {
                    suma = suma + (array[i].cantidad * array[i].precioedita)
                }

            }
            return this.redondear(suma)
        },
        limpia_data() {
            this.lista_productos = []
            this.observacion = ''
            store.commit("dialogoprogress")
            this.dialogo_genera = false
            this.cierra()
        },
        agregaCatalogo(value) {
            this.lista_productos.push({
                id: value.id,
                codbarra: value.codbarra,
                cantidad: value.cantidad,
                nombre: value.nombre,
                categoria: value.categoria,
                medida: value.medida,
                precio: value.precio,
                stock: value.stock,
                precioedita: value.precio,
                preciodescuento: 0,
                tipoproducto: value.tipoproducto,
                operacion: value.operacion,
                controstock: value.controstock,
            })
        },

        agregaSinCatalogo() {
            if (this.nombreSincodigo == '' || this.medidasincodigo == '' ||
                this.precioSinCodigo == '' || this.cantidadSinCodigo == '') {
                store.commit('dialogosnackbar', 'REVISE PRODUCTO')
            } else {
                this.lista_productos.push({
                    id: this.create_UUID().substring(29),
                    codbarra: this.create_UUID().substring(29),
                    cantidad: this.cantidadSinCodigo.toString().trim(),
                    nombre: this.nombreSincodigo,
                    medida: this.medidasincodigo,
                    categoria: 'varios',
                    precio: this.redondear(this.precioSinCodigo.toString().trim()),
                    stock: 9090909,
                    precioedita: this.redondear(this.precioSinCodigo.toString().trim()),
                    preciodescuento: 0,
                    costo: 0,
                    tipoproducto: this.tipoproducto,
                    operacion: this.tipooperacion,
                    icbper: 'false',
                    controstock: false,
                })
                this.dialogAgrega = false
                this.nombreSincodigo = ''
                this.medidasincodigo = ''
                this.precioSinCodigo = ''
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
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        BuscarDocumento() {
            if (this.num_cliente.length == 11) {
                this.documento = "RUC"
            } else {
                this.documento = "DNI"
            }
            if (this.num_cliente == '') {
                this.dialogo_clientes = !this.dialogo_clientes
                return
            } else {
                if (this.num_cliente != '' && this.documento == "RUC" || this.documento == "DNI" &&
                    this.num_cliente.length == 8 || this.num_cliente.length == 11) {
                    store.commit("dialogoprogress")
                    console.log(this.num_cliente)
                    var cliente = store.state.clientes.find(id => String(id.documento) === String(this.num_cliente))
                    if (Boolean(cliente)) {
                        this.nom_cliente = cliente.nombre
                        this.dir_cliente = cliente.direccion
                        store.commit("dialogoprogress")
                    } else {
                        this.consultaApiPeru()
                    }
                } else {
                    store.commit('dialogosnackbar', 'Documento Invalido')
                }
            }
        },
        consultaApiPeru() {
            var self = this
            var token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            axios
                .get('https://apiperu.dev/api/' + this.documento.toLowerCase() + '/' + this.num_cliente, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data,
                    store.commit("dialogoprogress"),
                    self.llenardatos(response.data.data)
                ))

        },
        llenardatos(data) {
            if (data != undefined) {
                if (this.documento == 'DNI') {
                    this.nom_cliente = data.nombre_completo
                    this.dir_cliente = data.direccion
                }
                if (this.documento == 'RUC') {
                    this.nom_cliente = data.nombre_o_razon_social
                    this.dir_cliente = data.direccion
                }
            } else {
                store.commit('dialogosnackbar', 'Documento no existe')
            }
        },
        agregacliente(data) {
            this.num_cliente = data.documento
            this.nom_cliente = data.nombre
            this.dir_cliente = data.direccion
            this.dialogo_clientes = false
        },
    },

}
</script>
