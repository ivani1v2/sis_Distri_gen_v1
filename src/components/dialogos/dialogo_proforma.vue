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
            <v-row dense class="mb-2">
                <v-col cols="12" sm="4" md="3">
                    <v-select v-model="moneda" :items="$store.state.moneda"
                        :item-text="item => `${item.simbolo} ${item.moneda} (${item.codigo})`" return-object
                        label="Moneda" outlined dense hide-details></v-select>
                </v-col>
            </v-row>

            <div style="max-height: 50vh; overflow-y: auto;">
                <v-card 
                    v-for="item in listaproductos" 
                    :key="item.uuid || item.id"
                    class="mb-2 pa-2"
                    outlined
                >
                    <v-row dense align="center">
                        <v-col cols="12" sm="6">
                            <div style="font-size: 13px; font-weight: 500;">
                                {{ item.id }} - {{ item.nombre }}
                                <v-chip x-small color="red" dark v-if="item.operacion === 'GRATUITA'" class="ml-1">
                                    Gratuita
                                </v-chip>
                            </div>
                            <div style="font-size: 11px; color: grey;">
                                {{ item.medida }}
                            </div>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-row dense>
                                <v-col cols="3" class="text-center">
                                    <div style="font-size: 12px; color: grey;">Cant.</div>
                                    <div style="font-size: 12px; font-weight: 500;">{{ item.cantidad }}</div>
                                </v-col>
                                <v-col cols="3" class="text-center" v-if="item.operacion !== 'GRATUITA'">
                                    <div style="font-size: 12px; color: grey;">Precio</div>
                                    <div style="font-size: 12px; font-weight: 500;">{{ redondear(item.precio) }}</div>
                                </v-col>
                                <v-col cols="3" class="text-center" v-if="$store.state.configuracion.desc_porcentaje_catalogo && item.operacion !== 'GRATUITA'">
                                    <div style="font-size: 12px; color: grey;">%Desc</div>
                                    <div style="font-size: 12px;">{{ item.desc_1 || 0 }}/{{ item.desc_2 || 0 }}/{{ item.desc_3 || 0 }}</div>
                                </v-col>
                                <v-col cols="3" class="text-center" v-if="item.operacion !== 'GRATUITA'">
                                    <div style="font-size: 12px; color: grey;">Total</div>
                                    <div style="font-size: 12px; font-weight: 600; color: #4CAF50;">
                                        {{ redondear(item.cantidad * item.precio) }}
                                    </div>
                                </v-col>
                            </v-row>
                        </v-col>
                       <v-col cols="12" sm="2" class="text-right">
                            <v-btn icon small color="warning" @click="editar(item)" title="Editar">
                                <v-icon small>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn icon small color="error" @click="eliminar(item)" title="Eliminar">
                                <v-icon small>mdi-delete</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card>

                <v-card v-if="listaproductos.length === 0" class="pa-4 text-center" outlined>
                    <v-icon large color="grey">mdi-package-variant</v-icon>
                    <div class="grey--text mt-2">No hay productos agregados</div>
                </v-card>
            </div>

            <v-spacer></v-spacer>
            <v-row class="mt-1">
                <v-col cols="6"></v-col>
                <v-col cols="6">
                    <h3>
                        TOTAL:
                        {{ monedaSimbolo }}{{ total(listaproductos) }}
                    </h3>
                </v-col>
            </v-row>
        </v-card>
        <v-dialog v-model="dialogo_genera" max-width="550px">
            <div> <v-system-bar window dark> <v-icon @click="dialogo_genera = !dialogo_genera">mdi-close</v-icon>
                </v-system-bar> </div> <v-card class="pa-2"> <v-row class="" dense> <v-col cols="6"> <v-text-field
                            type="date" outlined dense v-model="date" label="Emision"></v-text-field> </v-col> <v-col
                        cols="6">
                        <v-text-field type="date" outlined dense v-model="date_vence"
                            label="Vencimiento(30 dias)"></v-text-field> </v-col> <v-col cols="4" class="mt-n5">
                        <v-text-field style="font-family:verdana;font-size:75%;" type="number" outlined dense
                            v-model="num_cliente" label="N°Doc" append-icon="mdi-magnify"
                            @click:append="BuscarDocumento()" @keyup.enter="BuscarDocumento()"></v-text-field> </v-col>
                    <v-col cols="8" class="mt-n5">
                        <v-text-field style="font-family:verdana;font-size:75%;" outlined dense v-model="nom_cliente"
                            label="Nombre Cliente"></v-text-field> </v-col> <v-col cols="12" class="mt-n5">
                        <v-text-field style="font-family:verdana;font-size:75%;" outlined dense v-model="dir_cliente"
                            label="Direccion Cliente"></v-text-field> </v-col> <v-col cols="12" class="mt-n5">
                        <v-textarea style="font-family:verdana;font-size:75%;" outlined dense v-model="observacion"
                            auto-grow filled label="OBSERVACION" rows="1"></v-textarea> </v-col> <v-col cols="12"
                        class="mt-n5"> <v-select style="font-size:85%;" outlined dense v-model="modo_pago"
                            :items="array_modo" menu-props="auto" hide-details label="Tipo Doc"></v-select> </v-col>
                </v-row> <v-card-actions class="mt-2"> <v-btn small color="success" block
                        @click="genera_proforma()">Generar</v-btn> </v-card-actions> </v-card>
        </v-dialog> <v-dialog v-model="dialogAgrega" max-width="390">
            <div> <v-system-bar window dark> <v-icon @click="dialogAgrega = false">mdi-close</v-icon> </v-system-bar>
            </div>
            <v-card class="pa-3"> <v-row class="mb-n12"> <v-col cols="6" sm="6" md="6"> <v-select
                            :items="arraytipoProducto" label="Tipo" dense outlined v-model="tipoproducto"></v-select>
                    </v-col> <v-col cols="6" sm="6" md="6"> <v-select :items="arrayOperacion" label="Operacion" dense
                            outlined v-model="tipooperacion"></v-select> </v-col> </v-row> <v-row class="mt-4"> <v-col
                        cols="6" xs="6">
                        <v-text-field dense outlined type="number" v-model="cantidadSinCodigo"
                            label="Cantidad"></v-text-field>
                    </v-col> <v-col cols="6" xs="6"> <v-text-field dense outlined type="number"
                            v-model="precioSinCodigo" label="Precio"></v-text-field> </v-col> </v-row>
                <descuentos-porcentaje
                    ref="descSinCodigoRef"
                    :precio-base="Number(precioSinCodigo) || 0"
                    :es-bono="tipooperacion === 'GRATUITA'"
                    :decimales="$store.state.configuracion.decimal || 2"
                    @cambio="descSinCodigo = $event"
                    class="my-3"
                />
                <v-select dense
                    outlined v-model="medidasincodigo" :items="$store.state.medidas" menu-props="auto"
                    hide-details label="Medida"></v-select> <v-textarea class="mt-4" @keyup.enter="agregaSinCatalogo()"
                    dense outlined auto-grow filled v-model="nombreSincodigo" label="Descripcion" rows="1"></v-textarea>
                <v-card-actions>
                    <v-spacer></v-spacer> <v-btn color="green darken-1" text @click="agregaSinCatalogo()"> Agregar
                    </v-btn>
                </v-card-actions> </v-card>
        </v-dialog> <v-dialog v-model="dial_edita" max-width="390">
            <div> <v-system-bar window dark> <v-icon @click="dial_edita = false">mdi-close</v-icon> </v-system-bar>
            </div>
            <v-card class="pa-3" :key="editKey"> <v-row class="mb-n12"> <v-col cols="6" sm="6" md="6"> <v-select
                            :items="arraytipoProducto" label="Tipo" dense outlined
                            v-model="selecto.tipoproducto"></v-select> </v-col> <v-col cols="6" sm="6" md="6"> <v-select
                            :items="arrayOperacion" label="Operacion" dense outlined
                            v-model="selecto.operacion"></v-select> </v-col> </v-row> <v-row class="mt-4"> <v-col
                        cols="6" xs="6"> <v-text-field dense outlined type="number" v-model.number="selecto.cantidad"
                            label="Cantidad"></v-text-field> </v-col> <v-col cols="6" xs="6"> <v-text-field dense
                            outlined type="number" v-model.number="selecto.precioedita" label="Precio" @input="onPrecioEditaChange"></v-text-field> </v-col>
                </v-row>
                
               <!-- Bandera 123 -->
                <v-alert v-if="precioCambiado" type="warning" dense text class="mt-2 mb-0" style="font-size: 11px;">
                    El precio fue modificado. Ajuste los descuentos si es necesario.
                </v-alert>
                <descuentos-porcentaje
                    v-if="dial_edita"
                    :key="'desc-edit-' + editKey"
                    ref="descEditaRef"
                    :precio-base="precioBaseEdita"
                    :descuentos-iniciales="descuentosInicialesEdita"
                    :es-bono="selecto.operacion === 'GRATUITA'"
                    :decimales="$store.state.configuracion.decimal || 2"
                    @cambio="onDescEditaCambio"
                    class="my-3"
                />
                <v-select dense outlined v-model="selecto.medida" :items="$store.state.medidas"
                    menu-props="auto" hide-details label="Medida"></v-select> <v-textarea class="mt-4"
                    @keyup.enter="guardarEdicion()" dense outlined auto-grow filled v-model="selecto.nombre"
                    label="Descripcion" rows="1"></v-textarea>
                <v-card-actions> <v-spacer></v-spacer> <v-btn color="green darken-1" text @click="guardarEdicion()">
                        Guardar
                    </v-btn> </v-card-actions> </v-card>
        </v-dialog>
        <catalogo v-if="dial_catalogo" @array="agregar_lista($event)" @cierra="dial_catalogo = false" />
        <busca_clis v-if="dial_cliente" @cerrar="dial_cliente = false" @agregar="agregacliente($event)"></busca_clis>
    </v-dialog> </template>


<script>
import {
    obtenContador,
    nuevoProformas,
    sumaContador
} from '../../db'
import moment from 'moment'
import catalogo from '@/components/dialogos/dialogocatalogo'
import store from '@/store/index'
import busca_clis from '@/views/clientes/dialogos/busca_cliente'
import { agregarLista } from "../../views/funciones/calculo_bonos";
import {
    generaproforma
} from '../../pdf_proforma'
import axios from "axios"
import DescuentosPorcentaje from '@/components/descuentos_porcentaje.vue'
export default {
    name: 'caja',

    components: {
        catalogo,
        busca_clis,
        DescuentosPorcentaje
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
            listaproductos: [],
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
            selecto: {},
            editKey: 0,
            precioCambiado: false,
            precioOriginalEdita: 0,
            dial_cliente: false,
            moneda: store.state.moneda.find(m => m.codigo === 'USD'),
            descSinCodigo: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 },
            descEdita: { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 },
        }
    },
    computed: {
        precioBaseEdita() {
            return Number(this.selecto.precio_base) || Number(this.selecto.precioedita) || 0;
        },
        descuentosInicialesEdita() {
            return {
                desc_1: Number(this.selecto.desc_1) || 0,
                desc_2: Number(this.selecto.desc_2) || 0,
                desc_3: Number(this.selecto.desc_3) || 0
            };
        },
        monedaSimbolo(){
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/';
        }
    },
    created() {
        if (this.data != '') {
            console.log('editando')
            this.num_cliente = this.data.num_cliente
            this.nom_cliente = this.data.nom_cliente
            this.dir_cliente = this.data.dir_cliente
            this.observacion = this.data.observacion
            this.modo_pago = this.data.modo_pago
            this.date = moment.unix(this.data.fecha_emision).format('YYYY-MM-DD')
            this.date_vence = moment.unix(this.data.fecha_vencimiento).format('YYYY-MM-DD')
            this.listaproductos = this.data.data
        }
        this.dial = true
    },

    methods: {
        editar(data) {
            this.editKey++;
            this.precioCambiado = false;
            const precio = Number(data.precioedita) || Number(data.precio) || 0;
            this.precioOriginalEdita = precio;
            this.selecto = { 
                ...data,
                cantidad: Number(data.cantidad) || 1,
                precioedita: precio,
                precio_base: Number(data.precio_base) || precio,
                desc_1: Number(data.desc_1) || 0,
                desc_2: Number(data.desc_2) || 0,
                desc_3: Number(data.desc_3) || 0
            };
            this.dial_edita = true;
        },
        onPrecioEditaChange() {
            const precioActual = Number(this.selecto.precioedita) || 0;
            this.precioCambiado = precioActual !== this.precioOriginalEdita;
        },
        cierra() {
            this.$emit('cierra', false)
        },
        eliminar(item) {
            if (!item) return;

            const precio = this.redondear(item.precioedita != null
                ? item.precioedita
                : (item.precio || 0)
            );
            const msg = `¿Seguro que deseas borrar el ítem:\n\n${item.id} - ${item.nombre}\n${item.cantidad} x ${precio}?`;

            if (!confirm(msg)) return;

            const clave = item.uuid || item.id;
            if (!clave) return;

            const index = this.listaproductos.findIndex(p => (p.uuid || p.id) === clave);
            if (index !== -1) {
                this.listaproductos.splice(index, 1);
            }
        },

        abrir_comprobantes() {
            this.dialo_datos = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('YYYY-MM-DD')
        },
        consulta_correlativo() {
            if (this.listaproductos == '') {
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
            const fecha_emision = moment(String(this.date)) / 1000
            const fecha_vencimiento = moment(String(this.date_vence)) / 1000

            if (this.num_cliente === '') {
                this.num_cliente = '00000000000'
            }
            if (this.nom_cliente === '') {
                this.nom_cliente = 'Cliente Varios'
            }

            const id = this.data !== '' ? this.data.id : this.correlativo_proforma

            const productosModificados = this.listaproductos.map(producto => {
                const precioFinal = producto.precioedita != null
                    ? Number(producto.precioedita)
                    : Number(producto.precio || 0)

                const precioBase = producto.precio_base != null
                    ? Number(producto.precio_base)
                    : Number(producto.precio || producto.precioedita || 0)

                return {
                    ...producto,
                    precioedita: precioFinal,
                    precio: precioFinal,
                    precio_base: precioBase,
                }
            })

            const array = {
                id,
                fecha_emision,
                fecha_vencimiento,
                num_cliente: this.num_cliente,
                nom_cliente: this.nom_cliente,
                dir_cliente: this.dir_cliente,
                observacion: this.observacion,
                moneda: this.moneda.simbolo,
                total: this.total(this.listaproductos),
                modo_pago: this.modo_pago,
                responsable: store.state.permisos.correo.slice(0, -13),
                data: productosModificados,
            }

            await nuevoProformas(array.id, array)
            generaproforma(array, store.state.configImpresora.tamano)

            if (this.data === '') {
                sumaContador(
                    "ordenproformas",
                    (parseInt(this.correlativo_proforma) + 1).toString().padStart(4, 0)
                )
            }

            this.limpia_data()
        },

        total(array) {
            let suma = 0
            for (let i = 0; i < array.length; i++) {
                if (array[i].operacion !== 'GRATUITA') {
                    const precio = array[i].precioedita != null
                        ? Number(array[i].precioedita)
                        : Number(array[i].precio || 0)

                    suma += Number(array[i].cantidad || 0) * precio
                }
            }
            return this.redondear(suma)
        },
        limpia_data() {
            this.listaproductos = []
            this.observacion = ''
            store.commit("dialogoprogress")
            this.dialogo_genera = false
            this.cierra()
        },
        agregar_lista(value) {
            this.listaproductos = agregarLista({
                listaActual: this.listaproductos,
                nuevosItems: value,
                createUUID: this.create_UUID,
                redondear: (n) => this.redondear(n),
            });
            console.log(this.listaproductos)
        },

        agregaSinCatalogo() {
            if (this.nombreSincodigo == '' || this.medidasincodigo == '' ||
                this.precioSinCodigo == '' || this.cantidadSinCodigo == '') {
                store.commit('dialogosnackbar', 'REVISE PRODUCTO')
            } else {
                const tieneDescuentos = this.descSinCodigo.desc_1 > 0 || 
                                        this.descSinCodigo.desc_2 > 0 || 
                                        this.descSinCodigo.desc_3 > 0;
                
                const precioFinal = tieneDescuentos && this.tipooperacion !== 'GRATUITA'
                    ? this.descSinCodigo.precioFinal
                    : Number(this.precioSinCodigo);

                this.listaproductos.push({
                    id: this.create_UUID().substring(29),
                    codbarra: this.create_UUID().substring(29),
                    cantidad: this.cantidadSinCodigo.toString().trim(),
                    nombre: this.nombreSincodigo,
                    medida: this.medidasincodigo,
                    categoria: 'varios',
                    precio: this.redondear(precioFinal),
                    precio_base: this.redondear(this.precioSinCodigo),
                    stock: 9090909,
                    precioedita: this.redondear(precioFinal),
                    preciodescuento: 0,
                    costo: 0,
                    tipoproducto: this.tipoproducto,
                    operacion: this.tipooperacion,
                    icbper: 'false',
                    controstock: false,
                    // Guardar descuentos
                    desc_1: this.descSinCodigo.desc_1 || 0,
                    desc_2: this.descSinCodigo.desc_2 || 0,
                    desc_3: this.descSinCodigo.desc_3 || 0,
                })
                this.dialogAgrega = false
                this.nombreSincodigo = ''
                this.medidasincodigo = ''
                this.precioSinCodigo = ''
                // Resetear descuentos
                this.descSinCodigo = { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 };
                if (this.$refs.descSinCodigoRef) {
                    this.$refs.descSinCodigoRef.reset();
                }
            }

        },
        onDescEditaCambio(data) {
            this.descEdita = data;
            if (this.selecto && data.precioFinal) {
                this.selecto.precioedita = data.precioFinal;
                this.selecto.desc_1 = data.desc_1 || 0;
                this.selecto.desc_2 = data.desc_2 || 0;
                this.selecto.desc_3 = data.desc_3 || 0;
            }
        },
        guardarEdicion() {
            if (!this.selecto) {
                this.dial_edita = false;
                return;
            }
            const clave = this.selecto.uuid || this.selecto.id;
            const index = this.listaproductos.findIndex(p => (p.uuid || p.id) === clave);
            
            if (index !== -1) {
                this.selecto.precio = parseFloat(this.selecto.precioedita) || 0;
                
                if ((this.selecto.desc_1 > 0 || this.selecto.desc_2 > 0 || this.selecto.desc_3 > 0) && !this.selecto.precio_base) {
                    this.selecto.precio_base = this.selecto.precio;
                }
                this.$set(this.listaproductos, index, { ...this.selecto });
            }
            
            this.dial_edita = false;
            this.descEdita = { desc_1: 0, desc_2: 0, desc_3: 0, precioFinal: 0, montoDescuento: 0 };
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
                this.dial_cliente = !this.dial_cliente
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
            this.dial_cliente = false
        },
    },

}
</script>
