<template>
    <div class="mb-6 mt-10 pa-4">

        <v-row class="mb-n7 mt-n7 text-center" no-gutters>
            <v-col cols="6">
                <h2>PROFORMAS</h2>
            </v-col>
            <v-col cols="6">
                <v-btn class="mt-1" small color="success" @click="data_proforma = '', dial_proforma = true">
                    <v-icon small color="">mdi-plus-circle-outline</v-icon>
                    nuevo
                </v-btn>
            </v-col>
        </v-row>

        <v-row class="text-center pa-2 mb-n7">
            <v-col cols="4">
                <v-text-field type="date" outlined dense v-model="date1" label="INICIO"></v-text-field>
            </v-col>

            <v-col cols="4">
                <v-text-field type="date" outlined dense v-model="date2" label="FIN"></v-text-field>
            </v-col>

            <v-col cols="4" v-if="esAdmin">
                <v-select outlined dense v-model="vendedor_filtro" :items="vendedoresItems" 
                    item-text="text" item-value="value" label="Vendedor" clearable hide-details></v-select>
            </v-col>

        </v-row>

        <v-card>
            <v-simple-table fixed-header height="65vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Id
                            </th>
                            <th class="text-left">
                                Fecha Emision
                            </th>
                            <th class="text-left">
                                Cliente
                            </th>
                            <th class="text-left" v-if="esAdmin">
                                Vendedor
                            </th>
                            <th class="text-left">
                                Total
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td style="font-family:verdana;font-size:75%;">{{ item.id }}</td>
                            <td style="font-family:verdana;font-size:75%;">{{ conviertefecha(item.fecha_emision) }}</td>
                            <td style="font-family:verdana;font-size:75%;">{{ item.num_cliente }} - {{ item.nom_cliente
                                }}</td>
                            <td style="font-family:verdana;font-size:75%;" v-if="esAdmin">
                                {{ getNombreVendedor(item.responsable) }}
                            </td>
                            <td style="font-family:verdana;font-size:75%;">{{ item.moneda || 'S/' }} {{ item.total }}
                            </td>
                            <td>
                                <v-menu>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon v-bind="attrs" v-on="on">
                                            <v-icon>mdi-dots-vertical</v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list dense>
                                        <v-list-item @click='emite(item)'>
                                            <v-list-item-icon>
                                                <v-icon color="info">mdi-send</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Emitir</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="abre_visualizacion(item)">
                                            <v-list-item-icon>
                                                <v-icon color="green">mdi-eye</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Visualizar</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="imprime(item)">
                                            <v-list-item-icon>
                                                <v-icon color="red">mdi-text-box-search-outline</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Imprime</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="editar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="yellow">mdi-pencil</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Editar</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click.prevent="elminar(item)">
                                            <v-list-item-icon>
                                                <v-icon color="red">mdi-delete</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-title>Borrar</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>
        <v-dialog v-model="dialogo_detalle" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_detalle = !dialogo_detalle">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <h4>OBSERVACION: <span class="red--text">{{ observacion }}</span></h4>
                <v-simple-table dark fixed-header height="300px" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
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
                                <td>{{ item.nombre }}</td>
                                <td width="100">{{ item.cantidad }}</td>
                                <td width="100">{{monedaSimbolo}}.{{ item.precioedita }}</td>
                                <td width="100">{{monedaSimbolo}} {{ redondear(item.cantidad * item.precio) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogo_elimina" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_elimina = !dialogo_elimina">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text class="text--center">
                    <h2>SEGURO QUE DESEA GENERAR ELIMINAR PROFORMA</h2>
                </v-card-text>
                <v-card-actions>
                    <v-row dense>
                        <v-col cols="6">
                            <v-btn color="success" small block @click="elminar_ahora()">SI</v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="error" small block @click="dialogo_elimina = false">NO</v-btn>
                        </v-col>
                    </v-row>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogo_imprime" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_imprime = !dialogo_imprime">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_emite" max-width="500px" persistent>
            <v-card rounded="lg" elevation="10">
                <v-toolbar color="primary" dark flat dense>
                    <v-toolbar-title class="text-subtitle-1 font-weight-medium">
                        <v-icon left small>mdi-file-document-outline</v-icon>
                        Emitir Documento
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon small @click="dialogo_emite = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pa-4">
                    <v-row dense class="ma-0">
                        <v-col cols="12" sm="6" class="pa-2" v-if="esAdmin">
                            <v-hover v-slot="{ hover }">
                                <v-card @click="doc('FACTURA')" :elevation="hover ? 8 : 2"
                                    :class="['transition-swing', hover ? 'primary lighten-5' : '']" height="120"
                                    rounded="lg" class="d-flex flex-column justify-center cursor-pointer">
                                    <v-container class="pa-3 text-center">
                                        <v-icon size="40" color="primary" class="mb-2">
                                            mdi-receipt
                                        </v-icon>
                                        <div class="text-subtitle-2 font-weight-medium text-primary">
                                            FACTURA/BOLETA
                                        </div>
                                        <v-chip x-small color="primary" text-color="white" class="mt-1">
                                            Emitir como venta directa
                                        </v-chip>
                                    </v-container>
                                </v-card>
                            </v-hover>
                        </v-col>

                        <v-col cols="12" sm="6" class="pa-2" v-if="esAdmin">
                            <v-hover v-slot="{ hover }">
                                <v-card @click="doc('GUIA')" :elevation="hover ? 8 : 2"
                                    :class="['transition-swing', hover ? 'success lighten-5' : '']" height="120"
                                    rounded="lg" class="d-flex flex-column justify-center cursor-pointer">
                                    <v-container class="pa-3 text-center">
                                        <v-icon size="40" color="success" class="mb-2">
                                            mdi-truck-delivery
                                        </v-icon>
                                        <div class="text-subtitle-2 font-weight-medium text-success">
                                            GUÍA REMISIÓN
                                        </div>
                                        <v-chip x-small color="success" text-color="white" class="mt-1">
                                            Emitir con guía de remisión
                                        </v-chip>
                                    </v-container>
                                </v-card>
                            </v-hover>
                        </v-col>
                        <v-col cols="12" class="pa-2">
                            <v-hover v-slot="{ hover }">
                                <v-card @click="convertirAPreventa()" :elevation="hover ? 8 : 2"
                                    :class="['transition-swing', hover ? 'warning lighten-5' : '']" height="120"
                                    rounded="lg" class="d-flex flex-column justify-center cursor-pointer">
                                    <v-container class="pa-3 text-center">
                                        <v-icon size="40" color="warning" class="mb-2">
                                            mdi-cart
                                        </v-icon>
                                        <div class="text-subtitle-2 font-weight-medium text-warning">
                                            PRE-VENTA
                                        </div>
                                        <v-chip x-small color="warning" text-color="white" class="mt-1">
                                            Emitir como pedido
                                        </v-chip>
                                    </v-container>
                                </v-card>
                            </v-hover>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions class="pa-3">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" text @click="dialogo_emite = false" size="small">
                        Cancelar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_deudas_cliente v-model="dial_deudas_cliente" :cliente="cliente_deuda" :accion-pendiente="'pre_venta'"
            @continuar="continuarAPreventa" @cerrar="dial_deudas_cliente = false" />
        <proforma v-if="dial_proforma" @cierra="dial_proforma = false" :data="data_proforma" />
    </div>
</template>

<script>
import {
    allProformas,
    eliminaProformas
} from '../../db'
import moment from 'moment'
import store from '@/store/index'
import proforma from '@/components/dialogos/dialogo_proforma'
import dial_deudas_cliente from '@/views/clientes/dialogos/dial_deudas_cliente'
import {
    generaproforma
} from '../../pdf_proforma'
export default {
    components: {
        proforma,
        dial_deudas_cliente
    },
    data: () => ({
        dial_proforma: false,
        dialogo_emite: false,
        dial_deudas_cliente: false,
        cliente_deuda: null,
        date1: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        desserts: [],
        dialogo_detalle: false,
        dialogo_elimina: false,
        dialogo_imprime: false,
        lista_productos: [],
        observacion: '',
        selecto: [],
        item_selecto: [],
        data_proforma: [],
        vendedor_filtro: ''
    }),
    mounted() {
        this.cargarProformas();
    },
    beforeDestroy() {
        allProformas().off("value", this.onDataChange);
    },
    watch: {
        date1() {
            this.cargarProformas();
        },
        date2() {
            this.cargarProformas();
        }
    },
    computed: {
        esAdmin() {
            return this.$store.state.permisos.es_admin;
        },
        usuarioActual() {
            const correo = this.$store.state.permisos.correo || '';
            return correo.slice(0, -13); // Quita @dominio.com
        },
        vendedoresItems() {
            // Construir lista de responsables únicos desde las proformas
            const responsables = [...new Set(this.desserts.map(p => p.responsable).filter(r => r))];
            // Mapear a objetos con nombre legible y valor del código
            const items = responsables.sort().map(codigo => {
                const sede = this.$store.state.array_sedes?.find(s => s.codigo === codigo);
                return {
                    text: sede?.nombre || codigo,
                    value: codigo
                };
            });
            return [{ text: 'TODOS', value: 'TODOS' }, ...items];
        },
        listafiltrada() {
            let lista = this.desserts;
            
            // Si NO es admin, filtrar solo sus proformas
            if (!this.esAdmin) {
                lista = lista.filter(item => item.responsable === this.usuarioActual);
            } else if (this.vendedor_filtro && this.vendedor_filtro !== 'TODOS') {
                // Si es admin y hay filtro de vendedor seleccionado
                lista = lista.filter(item => item.responsable === this.vendedor_filtro);
            }
            
            return lista.reverse();
        },
        monedaSimbolo(){
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/';
        }
    },
    created() {
        this.inicio()
    },
    methods: {
        cargarProformas() {
            // Remover listener anterior
            allProformas().off("value", this.onDataChange);
            // Establecer nuevo listener
            const start = moment(String(this.date1)) / 1000;
            const end = moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000;
            allProformas().orderByChild('fecha_emision').startAt(start).endAt(end).on("value", this.onDataChange);
        },
        getNombreVendedor(codigo) {
            if (!codigo) return '-';
            // Buscar en array_sedes por codigo
            const sede = this.$store.state.array_sedes?.find(s => s.codigo === codigo);
            return sede?.nombre || codigo; // Si no encuentra, muestra el código
        },
        editar(data) {
            if (confirm('seguro de querer editar?')) {
                this.item_selecto = data
                this.data_proforma = data
                this.dial_proforma = true
            }
        },
        doc(data) {
            store.commit("emision", this.selecto)
            if (data == 'FACTURA') {
                this.$router.push({
                    name: 'caja2'
                })
            } else {
                store.commit("array_guia", this.selecto)

                this.$router.push({
                    name: 'gr_remitente'
                })
            }
        },
        emite(data) {
            this.selecto = data
            this.dialogo_emite = true
        },
        inicio() {
            var dia = moment(String(new Date)).format('DD')
            this.date1 = moment().subtract(parseFloat(dia) - 1, 'd').format('YYYY-MM-DD')
            this.date2 = moment(String(new Date)).format('YYYY-MM-DD')
        },
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                array.push(data);
            });
            this.desserts = array;
        },
        abre_visualizacion(data) {
            this.observacion = data.observacion
            this.lista_productos = data.data
            this.dialogo_detalle = true
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY')
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        verPDF(medida) {
            generaproforma(this.selecto, medida)
        },
        imprime(item) {
            this.selecto = item
            this.dialogo_imprime = true
        },
        elminar(item) {
            this.selecto = item
            this.dialogo_elimina = true
        },
        elminar_ahora() {
            console.log(this.selecto)
            eliminaProformas(this.selecto.id)
            this.dialogo_elimina = false
        },
        convertirAPreventa() {
            const proforma = this.selecto
            this.cliente_deuda = {
                documento: proforma.num_cliente || '',
                nombre: proforma.nom_cliente || '',
                direccion: proforma.dir_cliente || '',
                permite_credito: true,
                linea_credito: 0
            }
            this.dialogo_emite = false
            this.dial_deudas_cliente = true
        },
        continuarAPreventa(payload) {
            this.dial_deudas_cliente = false
            const proforma = this.selecto
            const clienteData = {
                documento: proforma.num_cliente || '',
                nombre: proforma.nom_cliente || '',
                direccion: proforma.dir_cliente || '',
                telefono: proforma.telefono || ''
            }

            const productos = (proforma.data || []).map(item => ({
                ...item,
                precio: Number(item.precioedita ?? item.precio ?? 0),
                precio_base: Number(item.precio_base ?? item.precioedita ?? item.precio ?? 0),
                cantidad: Number(item.cantidad || 0),
                desc_1: Number(item.desc_1 || 0),
                desc_2: Number(item.desc_2 || 0),
                desc_3: Number(item.desc_3 || 0),
                operacion: item.operacion || 'GRAVADA',
                totalLinea: Number(item.precioedita ?? item.precio ?? 0) * Number(item.cantidad || 0)
            }))
            store.commit("cliente_selecto", clienteData)
            store.commit("lista_productos", productos)
            this.$router.push({
                name: 'nuevo_pedido'
            })
        }

    }
}
</script>
