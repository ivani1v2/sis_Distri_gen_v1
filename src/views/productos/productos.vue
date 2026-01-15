<template>
    <div class="mb-6 pa-3 mt-1">

        <v-row dense class="mb-2">

            <v-col cols="6">
                <v-btn :disabled="!$store.state.permisos.crea_producto" rounded elevation="2" color="primary" block
                    small @click="obtenordenproducto">
                    <v-icon left>mdi-plus</v-icon> Nuevo producto
                </v-btn>
            </v-col>
            <v-col cols="6">
                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="success" block small v-bind="attrs" v-on="on">
                            <v-icon left>mdi-cog</v-icon> Opciones
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" small color="warning" block
                                @click="dialogostock = true, Procesa()">
                                <v-icon left>mdi-chart-bar</v-icon> Ver Estadistica
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" dark small color="success" block
                                @click="dialogoFiltro = true">
                                <v-icon left>mdi-filter</v-icon> Filtro
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" dark small color="info" block
                                @click="subirXLS">
                                <v-icon left>mdi-microsoft-excel</v-icon> Exportar Excel
                            </v-btn>
                        </v-list-item>

                    </v-list>
                </v-menu>
            </v-col>
        </v-row>

        <v-row align="center">
            <v-col cols="6">
                <v-text-field outlined dense v-model="buscar" append-icon="mdi-magnify" label="BUSCAR"></v-text-field>
            </v-col>
            <v-col cols="6" class="mt-n6">
                <v-select outlined dense v-model="filtro_categoria" :items="arraycategoria_f" menu-props="auto"
                    hide-details label="Categoria"></v-select>
            </v-col>
        </v-row>
        <v-card class="pa-4" v-if="!isMobile">
            <v-data-table dense :headers="headers" :items="listafiltrada" item-key="id" mobile-breakpoint="0">
                <template v-slot:item="{ item }">
                    <tr>
                        <td style="font-size:80%;">{{ item.id }}</td>
                        <td style="font-size:80%;">{{ item.categoria }}</td>
                        <td style="font-size:80%;">{{ item.nombre }}</td>
                        <td style="font-size:80%;">{{ convierte_stock(item.stock, item.factor) }}</td>
                        <td style="font-size:80%;">{{ Number(item.precio).toFixed(2) }}</td>
                        <td style="font-size:80%;">
                            <v-row>
                                <v-col cols="12">
                                    <v-icon color="green" :disabled="!$store.state.permisos.productos_edita"
                                        @click="editar(item)">mdi-lead-pencil</v-icon>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </template>
            </v-data-table>
        </v-card>

        <!-- MOBILE con alto fijo por ítem -->
        <v-card v-else class="mobile-card d-flex flex-column">
            <div class="mobile-list">
                <recycle-scroller :items="listafiltrada" :item-size="80" key-field="id" class="scroller">
                    <template #default="{ item }">
                        <div class="item-card">
                            <div class="item-main">
                                <div class="item-title">{{ item.nombre }}</div>
                                <div class="item-sub">#{{ item.id }} · {{ item.categoria }}</div>
                                <div class="item-meta">
                                    Stock: {{ convierte_stock(item.stock, item.factor) }} · S/{{ redondear(item.precio)
                                    }}
                                </div>
                            </div>
                            <v-btn icon small :disabled="!$store.state.permisos.productos_edita" @click="editar(item)">
                                <v-icon color="green">mdi-lead-pencil</v-icon>
                            </v-btn>
                        </div>
                    </template>
                </recycle-scroller>
            </div>
            <v-divider class=""></v-divider>
            <v-card-actions class="py-1 px-3 d-flex justify-space-between">
                <span class="caption grey--text text--darken-1">Mostrando</span>
                <v-chip small color="primary" text-color="white" label>
                    {{ listafiltrada.length }} ítems
                </v-chip>
            </v-card-actions>
        </v-card>

        <v-dialog v-model="dialogo" max-width="650px">
            <div>
                <v-system-bar window dark>
                    <v-icon color="red" large @click="dialogo = !dialogo">mdi-close</v-icon>
                    <v-switch dense v-model="activo" color="green" label="Activo"></v-switch>
                    <v-switch dense v-model="controstock" color="green" label="Stock"></v-switch>
                    <v-spacer></v-spacer>

                    <v-spacer></v-spacer>
                    <v-icon color="green" large @click="save(false)">mdi-content-save</v-icon>
                    <template>
                        <v-menu bottom left offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn icon v-bind="attrs" v-on="on">
                                    <v-icon>mdi-dots-vertical</v-icon>
                                </v-btn>
                            </template>
                            <v-list dense>
                                <v-list-item @click="dial_bono_global = !dial_bono_global">
                                    <v-list-item-icon><v-icon color="info">mdi-magnify</v-icon></v-list-item-icon>
                                    <v-list-item-title>Bono Global</v-list-item-title>
                                </v-list-item>
                            </v-list>

                            <v-list dense>
                                <v-list-item @click="print_codbarra()">
                                    <v-list-item-icon><v-icon color="warning">mdi-barcode</v-icon></v-list-item-icon>
                                    <v-list-item-title>CodBarra</v-list-item-title>
                                </v-list-item>
                            </v-list>
                            <v-list dense>
                                <v-list-item @click="dial_adicional = !dial_adicional">
                                    <v-list-item-icon><v-icon color="success">mdi-plus</v-icon></v-list-item-icon>
                                    <v-list-item-title>Campos Adicionales</v-list-item-title>
                                </v-list-item>
                            </v-list>
                            <v-list dense>
                                <v-list-item @click="dialogoElimina = true">
                                    <v-list-item-icon><v-icon color="red">mdi-delete</v-icon></v-list-item-icon>
                                    <v-list-item-title>Eliminar</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>
                </v-system-bar>
            </div>

            <v-card class="pa-4">

                <v-row dense>
                    <v-col cols="6" sm="6" md="6" v-if="false">
                        <v-select :items="arraytipoProducto" label="Tipo" dense outlined
                            v-model="tipoproducto"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arrayOperacion" label="Operacion" dense outlined
                            v-model="operacion"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined dense :disabled="!$store.state.permisos.productos_edita_id" v-model="id"
                            label="ID"></v-text-field>
                    </v-col>
                </v-row>

                <v-row class="mt-n6" dense>
                    <v-col cols="6" sm="6" md="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="proveedor" :items="arrayproveedor" hide-details label="Proveedor" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class="mr-n2" @click="abre_tabla('proveedor')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>
                    </v-col>

                    <v-col cols="6" sm="6" md="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="categoria" :items="arraycategoria" hide-details label="Categoría" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class="mr-n2" @click="abre_tabla('categorias')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>
                    </v-col>
                </v-row>
                <v-row class="mt-1" dense>
                    <v-col cols="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="marca" :items="array_marca" hide-details label="Marca" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class=" mr-n2" @click="abre_tabla('marcas')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>

                    </v-col>
                    <v-col cols="6">
                        <v-text-field dense outlined v-model="codbarra" label="Cod Barras"
                            append-icon="mdi-barcode-scan" :autofocus="!$store.state.esmovil"
                            @click:append="escanea_qr()"></v-text-field>
                    </v-col>

                </v-row>
                <v-row class="mt-n7">
                    <v-col cols="12">
                        <v-textarea :disabled="!$store.state.permisos.productos_edita" dense outlined v-model="nombre"
                            auto-grow filled label="Descripcion" rows="1"></v-textarea>
                    </v-col>
                </v-row>

                <v-row class="mt-n6" dense>
                    <v-col cols="12" xs="12" sm="4" md="4">
                        <v-autocomplete outlined dense clearable :disabled="!$store.state.permisos.productos_edita"
                            v-model="medida" :items="itemsMedidasNombre" item-text="text" item-value="value"
                            label="Medida" :menu-props="{ maxHeight: 300 }" :filter="filtraStr"
                            @change="medida = (medida || '').toUpperCase()" />
                    </v-col>
                    <v-col cols="6" xs="6" sm="4" md="4">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="factor" label="Factor"></v-text-field>
                    </v-col>

                    <v-col cols="6" xs="6" sm="4" md="4">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="stock" label="Stock"></v-text-field>
                    </v-col>


                </v-row>
                <v-row class="mt-n6" dense>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined readonly dense :value="convierte_stock(stock, factor)"
                            label="Stock Conjunto"></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="precio" label="Precio"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="mt-n6" dense>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="escala_may1" label="Escala may 1"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="precio_may1" label="Precio may 1"></v-text-field>
                    </v-col>

                </v-row>

                <v-row class="mt-n6" dense>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="escala_may2" label="Escala may 2"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="precio_may2" label="Precio may 2"></v-text-field>
                    </v-col>

                </v-row>

                <v-row class="mt-n6" dense>

                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" dense type="number"
                            v-model="costo" label="Costo"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" dense type="number"
                            v-model="peso" label="Peso (KG)"></v-text-field>
                    </v-col>
                </v-row>
                <v-row class="mt-n10" dense>
                    <v-col cols="6">
                        <v-switch v-model="tiene_bono" label="Bonificacion"></v-switch>
                    </v-col>
                </v-row>
                <v-simple-table class="mt-n5" v-if="tiene_bono" fixed-header dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    A partir de:
                                </th>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Accion <v-btn color="success" x-small
                                        @click="dial_adiciona = !dial_adiciona">Adicionar</v-btn>
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in lista_bono" :key="item.id">
                                <td>{{ item.apartir_de }}</td>

                                <td> <strong class="red--text"> {{ item.cantidad }} x</strong> {{ item.nom_producto }}
                                </td>
                                <td>
                                    <v-icon small color="red" @click="elimina_bono(item)">mdi-delete</v-icon>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_bono_global" max-width="550px" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_bono_global = !dial_bono_global">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="" dense>
                    <v-col cols="12">
                        <v-autocomplete outlined dense clearable v-model="grupoPrecioSelect" :items="grupoPrecioItems"
                            item-text="text" item-value="value" label="Grupo Precio" prepend-inner-icon="mdi-magnify" />
                    </v-col>
                    <v-col cols="12">
                        <v-autocomplete outlined dense clearable v-model="grupoBonoSelect" :items="grupoBonoItems"
                            item-text="text" item-value="value" label="Grupo Bono" prepend-inner-icon="mdi-magnify" />
                    </v-col>
                </v-row>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="dial_bono_global = false, save(true)">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogoElimina" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoElimina = !dialogoElimina">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-text>
                    <h3> DESEA ELIMINAR PERMANENTEMENTE EL PRODUCTO? {{ itemelimina }}</h3>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="eliminar()">si</v-btn>
                    <v-btn color="error" @click="dialogoElimina = !dialogoElimina">no</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoFiltro" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoFiltro = !dialogoFiltro">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text>
                    <v-select :items="arrayfiltroStock" label="Stock" outlined v-model="filtrostock"></v-select>
                    <v-select :items="arrayfiltroestado" label="ESTADO" outlined v-model="filtroestado"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="dialogoFiltro = !dialogoFiltro">FILTRAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialo_escaner" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_escaner = !dialo_escaner">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <lector v-if="dialo_escaner" msg="Hello Vue in CodeSandbox!" @resultado="resultado($event)" />
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_adiciona" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_adiciona = !dial_adiciona">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="" dense>
                    <v-col cols="12">
                        <v-text-field outlined type="number" dense v-model="apartir_de"
                            label="Bono apartir de :"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field outlined type="number" dense v-model="cantidad_bono"
                            label="Cantidad bonificacion"></v-text-field>
                    </v-col>
                </v-row>
                <v-autocomplete v-model="producto_sele" :items="$store.state.productos" item-text="nombre"
                    item-value="id" label="Buscar Productos" clearable menu-props="auto" outlined dense
                    append-icon="mdi-magnify">
                    <template v-slot:item="{ item }">
                        <v-list-item-content>
                            <v-list-item-title>
                                <strong>{{ item.categoria }}</strong> - {{ item.nombre }}
                            </v-list-item-title>
                        </v-list-item-content>
                    </template></v-autocomplete>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="guardar_bono()">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogostock" max-width="490">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogostock = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon @click="exporta()" large color="green">mdi-microsoft-excel</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-title>
                    <v-spacer></v-spacer>

                </v-card-title>
                <h5 class="pa-5 mt-n5"> Total Stock: {{ arrayConsolidartotal.cantidad }} / Total Costo:
                    {{ arrayConsolidartotal.costo }} / Total precio: {{ arrayConsolidartotal.precio }} </h5>

                <v-simple-table fixed-header height="400px">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Nombre
                                </th>
                                <th class="text-left">
                                    Cantidad
                                </th>
                                <th class="text-left">
                                    Costo
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in arrayConsolidar" :key="item">
                                <td>{{ item.categoria }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>{{ item.costo }}</td>
                                <td>{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

            </v-card>

        </v-dialog>
        <v-dialog v-model="dial_adicional" max-width="490" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_adicional = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon color="green" large @click="save(true), dial_adicional = false">mdi-content-save</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-2">
                <v-row class="mt-1" dense>
                    <v-text-field outlined dense v-model="obs1"
                        label="Observacion 1"></v-text-field>
                </v-row>

            </v-card>

        </v-dialog>
        <dial_categorias v-if="dial_categorias" @cierra="cerrarYActualizarCategorias" :tipo='tipo_tabla' />
    </div>
</template>

<script>
import dial_categorias from '@/views/productos/dialogos/categorias.vue'
import lector from "@/components/lector";
import moment from 'moment'
import { imprime_codbarra } from './imprime_cod_barra'
import {
    nuevoProducto,
    eliminaProducto,
    obtenContador,
    sumaContador,
    allCategorias,
    allBono
} from '../../db'
import store from '@/store/index'
import XLSX from 'xlsx'
export default {
    props: {
        msg: String,
    },
    components: {
        lector,
        dial_categorias
    },
    data: () => ({
        dial_adicional: false,
        dialogostock: false,
        dial_categorias: false,
        headers: [{
            text: 'id',
            align: 'start',
            sortable: false,
            value: 'id',
        },
        {
            text: 'Categoria',
            value: 'categoria',
        },
        {
            text: 'Nombre',
            value: 'nombre',
        },
        {
            text: 'Stock',
            value: 'stock',
        },
        {
            text: 'Precio',
            value: 'precio',
        },
        {
            text: 'Actions',
            value: 'actions',
            sortable: false
        },
        ],
        dialo_escaner: false,
        snackbar: false,
        text: '',
        timeout: 2000,
        sumacon: false,
        itemelimina: '',
        dialogoElimina: false,
        dialogoFiltro: false,
        buscar: '',
        desserts: [],
        id: '',
        categoria: '',
        proveedor: '',
        nombre: '',
        medida: 'UNIDAD',
        stock: '',
        precio: 0,
        costo: 0,
        margen: '',
        cocina: '',
        arrayConsolidar: [],
        arrayConsolidartotal: [],
        arraycategoria: [],
        arrayproveedor: [],
        arraylocales: [],
        dialogo: false,
        arraytipoProducto: ['BIEN', 'SERVICIO'],
        arrayfiltroStock: ['incluir 0', 'excluir 0'],
        filtrostock: 'incluir 0',
        arrayfiltroestado: ['TODOS', 'ACTIVO', 'INACTIVO'],
        filtroestado: 'ACTIVO',
        tipoproducto: "BIEN",
        arrayOperacion: [
            'GRAVADA',
            'EXONERADA',
            'INAFECTA'
        ],
        operacion: "GRAVADA",
        icbper: false,
        controstock: true,
        codbarra: '',
        activo: true,
        barra: false,
        cargoxconsumo: false,
        filtro_categoria: 'TODOS',
        arraycategoria_f: [],
        factor: '1',
        escala_may1: 0,
        precio_may1: 0,
        escala_may2: 0,
        precio_may2: 0,
        peso: 0,
        tiene_bono: false,
        dial_adiciona: false,
        lista_bono: [],
        apartir_de: 1,
        cantidad_bono: 1,
        producto_sele: '',
        tipo_tabla: null,
        marca: '',
        array_marca: [],
        item_selecto: '',
        dial_bono_global: false,
        grupoPrecioItems: [],
        grupoBonoItems: [],
        grupoPrecioSelect: null,
        grupoBonoSelect: null,
        obs1:''
    }),

    async beforeCreate() {
        var snapshot = await allCategorias("categorias").once("value")
        snapshot.forEach((item) => {
            this.arraycategoria_f.push(item.val().nombre)
            this.arraycategoria.push(item.val().nombre)
        })
        var snapshot = await allCategorias("marcas").once("value")
        snapshot.forEach((item) => {
            this.array_marca.push(item.val().nombre)
        })
    },
    created() {
        console.log(store.state.sedeActual.principal)
        this.arraycategoria_f.push('TODOS')
    },

    computed: {
        itemsMedidasNombre() {
            const arr = (this.$store.state.medidassunat || []);
            return arr.map(m => ({
                text: `${String(m.nombre || '').toUpperCase()}`,
                value: String(m.nombre || '').toUpperCase()   // ↩ lo que devuelve (solo nombre)
            }));
        },
        esMovil() {
            return this.$vuetify && this.$vuetify.breakpoint ? this.$vuetify.breakpoint.smAndDown : false
        },
        isMobile() {
            // Considera móvil si es XS/SM según Vuetify o si tu flag global lo indica
            return this.$vuetify.breakpoint.smAndDown;
        },
        listafiltrada() {
            this.desserts = store.state.productos
            if (this.filtrostock == 'excluir 0') {
                var filtro = this.desserts.filter((item) =>
                    (item.stock) > 0)
            } else {
                var filtro = this.desserts
            }

            if (this.filtroestado == 'TODOS') {
                var lista = filtro
            } else {
                if (this.filtroestado == 'ACTIVO') {
                    var lista = filtro.filter((item) =>
                        (item.activo) == true)
                } else {
                    var lista = filtro.filter((item) =>
                        (item.activo) == false)
                }
            }
            if (this.filtro_categoria == 'TODOS') {
                return lista.filter((item) => (item.id + item.nombre)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
            } else {
                return lista.filter(item => item.categoria == this.filtro_categoria && (item.id + item.nombre)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
            }

        }
    },
    watch: {
        dial_bono_global(val) {
            if (val) this.cargarGruposBonos();
        },
    },
    methods: {
        async cargarGruposBonos() {
            const snap = await allBono().once("value");
            const val = typeof snap.val === "function" ? snap.val() : null;

            let arr = [];
            if (Array.isArray(val)) arr = val.filter(Boolean);   // tu formato habitual (array con nulls)
            else if (val && typeof val === "object") arr = Object.values(val);

            const precios = arr.filter(x => x?.tipo === "precio");
            const bonos = arr.filter(x => x?.tipo === "bono");

            this.grupoPrecioItems = precios.map(x => ({
                text: `${x.codigo} — ${x.nombre}`, // lo que ves
                value: x.codigo,                       // lo que guardas
                raw: x
            }));

            this.grupoBonoItems = bonos.map(x => ({
                text: `${x.codigo} — ${x.nombre}`,
                value: x.codigo,
                raw: x
            }));
        },

        filtraStr(item, queryText, itemText) {
            const text = (itemText || item || '').toString()
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const query = (queryText || '').toString()
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return text.includes(query);
        },

        abre_tabla(tipo) {
            this.tipo_tabla = tipo
            this.dial_categorias = !this.dial_categorias
        },
        validaCamposBono() {
            const a = Number(this.apartir_de);
            const c = Number(this.cantidad_bono);

            if (!Number.isFinite(a) || a <= 0) {
                alert('Ingresa un valor válido (> 0) en "A partir de".');
                return false;
            }
            if (!Number.isFinite(c) || c <= 0) {
                alert('Ingresa una "Cantidad bonificación" válida (> 0).');
                return false;
            }
            return true;
        },
        async guardar_bono() {
            try {
                // Validar que se haya seleccionado un producto y se haya ingresado la cantidad y precio
                if (!this.validaCamposBono()) return;

                // Buscar el producto en el estado global y añadirlo a la lista
                const producto = store.state.productos.find(e => e.id == this.producto_sele);
                if (!producto) {
                    alert("El producto seleccionado no existe.");
                    return;
                }

                this.lista_bono.push({
                    apartir_de: this.apartir_de,
                    cantidad: this.cantidad_bono,
                    cod_producto: this.producto_sele,
                    nom_producto: producto.nombre,
                    precio: 1,
                });

                // Resetear los campos después de guardar
                this.cantidad_bono = null;
                this.producto_sele = null;
                this.dial_adiciona = false;

            } catch (error) {
                console.error("Error al guardar el combo:", error);
            }
        },

        elimina_bono(item) {
            try {
                // Filtrar la lista para excluir el elemento que se desea eliminar
                this.lista_bono = this.lista_bono.filter(combo => combo !== item);

            } catch (error) {
                console.error("Error al eliminar el producto del combo:", error);
            }
        },
        resultado(resultado) {
            this.codbarra = resultado
            this.dialo_escaner = false
        },
        snack(text) {
            this.snackbar = true
            this.text = text
        },
        escanea_qr() {
            if (store.state.esmovil) {
                this.dialo_escaner = true
            }
        },
        obtenordenproducto() {
            store.commit("dialogoprogress")
            this.sumacon = true

            obtenContador().once("value").then((snapshot) => {
                if (!snapshot.exists()) {
                    store.commit("dialogoprogress")
                    alert('Error al obtener contador. Comuníquese con soporte.')
                    this.sumacon = false
                    return
                }

                const idNuevo = snapshot.val().ordenproducto

                // 🔍 Validar si el ID ya existe en productos
                const productos = store.state.productos || []
                const existe = productos.some(p => String(p.id) === String(idNuevo))

                if (existe) {
                    // ⚠️ ID en conflicto → no abrimos el diálogo
                    store.commit("dialogoprogress")
                    this.sumacon = false
                    alert('Error con ID, comunicarse con soporte')
                    return
                }

                // ✅ Si no existe, seguimos como siempre
                this.id = idNuevo
                this.codbarra = ''
                this.categoria = '1'
                this.nombre = ''
                this.medida = 'UNIDAD'
                this.stock = 1
                this.precio = 0
                this.precio2 = 0
                this.costo = 0
                this.margen = 0
                this.tipoproducto = 'BIEN'
                this.operacion = 'GRAVADA'
                this.icbper = false
                this.lista_bono = []
                this.dialogo = true
                this.activo = true
                this.controstock = true
                this.tiene_bono = false
                this.escala_may1 = 0
                this.precio_may1 = 0
                this.escala_may2 = 0
                this.precio_may2 = 0
                this.proveedor = 0
                this.peso = 0
                this.factor = 1
                this.item_selecto = ''
                this.grupoPrecioSelect = null
                this.grupoBonoSelect = null
                this.marca = ''
                this.obs1 = ''

                if (Boolean(store.state.configuracion.operacion)) {
                    this.operacion = store.state.configuracion.operacion
                }

                store.commit("dialogoprogress")
            })
        },

        editar(data) {
            console.log(data)
            this.sumacon = false;
            this.item_selecto = data
            this.id = data.id;
            this.activo = data.activo;
            this.codbarra = data.codbarra;
            this.categoria = data.categoria;
            this.proveedor = data.proveedor || '';
            this.nombre = data.nombre;
            this.medida = data.medida;
            this.stock = Number(data.stock);
            this.factor = Number(data.factor) || 1
            this.precio = Number(data.precio);
            this.escala_may1 = Number(data.escala_may1) || 0
            this.precio_may1 = Number(data.precio_may1) || 0
            this.escala_may2 = Number(data.escala_may2) || 0
            this.precio_may2 = Number(data.precio_may2) || 0;
            this.costo = Number(data.costo);
            this.peso = Number(data.peso) || 0
            this.tipodata = data.tipodata;
            this.operacion = data.operacion;
            this.icbper = data.icbper;
            this.controstock = data.controstock;
            this.lista_bono = data.lista_bono || [];
            this.tiene_bono = data.tiene_bono || false;
            this.marca = data.marca || ''
            this.grupoPrecioSelect = data.grupo_precio || null;
            this.grupoBonoSelect = data.grupo_bono || null;
            this.obs1 = data.obs1 || ''

            this.dialogo = true;
        },

        async save(cerrar) {
            if (this.stock == '') {
                this.stock = 0
            }
            if (!this.nombre || this.nombre.trim() === '') {
                alert("Debe seleccionar un nombre")
                return
            }
            if (this.categoria == 1 || this.categoria == '' || !this.categoria) {
                alert("Debe considerar una categoria válida")
                return
            }
            if (this.precio == 0) {
                alert("El precio no puede ser igual a 0")
                return
            }
            const factorNum = Number(this.factor) || 0
            const medidaStr = (this.medida || '').toString().toUpperCase()

            if (factorNum > 1 && medidaStr === 'UNIDAD') {
                alert("Si el factor es mayor a 1, la medida no puede ser UNIDAD. Cambia la medida o el factor.")
                return
            }
            store.commit("dialogoprogress")
            var array = {
                id: this.id,
                activo: this.activo,
                codbarra: this.codbarra,
                nombre: this.nombre.trim(),
                categoria: this.categoria,
                proveedor: this.proveedor || null,
                medida: this.medida,
                stock: this.stock,
                factor: this.factor,
                precio: this.precio,
                escala_may1: this.escala_may1 || 0,
                precio_may1: this.precio_may1 || 0,
                escala_may2: this.escala_may2 || 0,
                precio_may2: this.precio_may2 || 0,
                peso: this.peso || 0,
                costo: this.costo,
                margen: this.margen || 0,
                tipoproducto: this.tipoproducto,
                operacion: this.operacion,
                icbper: this.icbper,
                controstock: this.controstock,
                lista_bono: this.lista_bono,
                tiene_bono: this.tiene_bono,
                editado: moment().unix(),
                marca: this.marca,
                grupo_precio: this.grupoPrecioSelect,
                grupo_bono: this.grupoBonoSelect,
                obs1:this.obs1
            }
            await nuevoProducto(this.id, array)
            if (this.sumacon == true) {
                this.sumacontador()
            }
            this.dialogo = cerrar
            
            store.commit("dialogoprogress")
        },
        async eliminar() {
            if (confirm('seguro de eliminar?')) {
                await eliminaProducto(this.id)
                this.id = ''
                this.dialogoElimina = false
                this.dialogo = false
            }

        },
        sumacontador() {
            sumaContador("ordenproducto", parseInt(this.id) + 1)
        },
        subirXLS() {
            this.$router.push({
                name: "ImportaExporta"
            })
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        cerrarYActualizarCategorias() {
            this.dial_categorias = false;
            this.actualizaCategorias(); // actualiza categorías luego de cerrar
        },
        actualizaCategorias() {
            this.arraycategoria = [];
            this.arraycategoria_f = ['TODOS'];
            allCategorias('categorias').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.arraycategoria.push(nombre);
                    this.arraycategoria_f.push(nombre);
                });
            });
            allCategorias('marcas').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.array_marca.push(nombre);

                });
            });

            allCategorias('proveedor').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.arrayproveedor.push(nombre);

                });
            });
        },
        Procesa() {
            var array = this.desserts
            var hash = [];
            var categoria = array.filter(function (current) {
                var exists = !hash[current.categoria]
                hash[current.categoria] = true
                return exists
            });
            this.sumatutilidad(categoria, array)
        },
        sumatutilidad(categoria, array) {
            let suma = []

            console.log(categoria)
            for (var i = 0; i < categoria.length; i++) {
                var cant = 0
                var cost = 0
                var pre = 0
                for (var e = 0; e < array.length; e++) {
                    if (categoria[i].categoria == array[e].categoria) {
                        if (!isNaN(parseFloat(array[e].costo))) {
                            cost = cost + (parseFloat(array[e].costo) * parseFloat(array[e].stock))
                        }
                        if (!isNaN(array[e].precio)) {
                            pre = pre + (parseFloat(array[e].precio) * parseFloat(array[e].stock))
                        }
                        cant = cant + parseFloat(array[e].stock)
                    }
                }
                suma.push({
                    categoria: categoria[i].categoria,
                    cantidad: this.redondear(cant),
                    costo: this.redondear(cost),
                    precio: this.redondear(pre)
                });
            }

            this.arrayConsolidar = suma
            this.sumatotal(suma)

        },
        sumatotal(suma) {

            let sumatotal = []
            var totalcantidad = 0
            var totalcosto = 0
            var totalprecio = 0
            for (var e = 0; e < suma.length; e++) {
                totalcantidad = totalcantidad + parseFloat(suma[e].cantidad)
                totalcosto = totalcosto + parseFloat(suma[e].costo)
                totalprecio = totalprecio + parseFloat(suma[e].precio)
            }
            sumatotal = {
                cantidad: this.redondear(totalcantidad),
                costo: this.redondear(totalcosto),
                precio: this.redondear(totalprecio)
            };
            this.arrayConsolidartotal = sumatotal
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
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
        print_codbarra() {
            const producto = this.item_selecto && this.item_selecto.id
                ? this.item_selecto
                : {
                    id: this.id,
                    nombre: this.nombre,
                    codbarra: this.codbarra,
                    precio: this.precio,
                    medida: this.medida,
                    marca: this.marca,
                };

            // Ejemplo: 4 copias, 58x40mm, sin nombre visible
            imprime_codbarra(producto, {
                formato: "58x30",
                copias: 1,
                mostrarNombre: false,  // en 30x20 casi siempre conviene ocultarlo
                mostrarPrecio: false,   // o false si no cabe
                barWidth: 1         // ajusta entre 1.0 y 1.4 si tu impresora lo requiere
            });

            // Otros ejemplos:
            // imprime_codbarra(producto, { formato: "58x30", barWidth: 1.6 });
            // imprime_codbarra({ copias: 2, mostrarPrecio: false }, producto); // firma alternativa
        },

    },

}
</script>
<style scoped>
.mobile-list .scroller {
    height: calc(100vh - 320px);
    /* ajusta según tu layout */
    overflow: auto;
}

/* “Card” sin usar v-card para máximo performance */
.item-card {
    display: flex;
    align-items: center;
    justify-content: space-between;

    /* look de card */
    background: #fff;
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .08);

    padding: 8px 12px;
    margin: 5px 8px;
    /* separa visualmente cada item */
    min-height: 68px;
    /* ayuda a mantener altura estable */
}

.item-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
}

.item-sub {
    font-size: 11px;
    color: #777;
    margin-top: 1px;
}

.item-meta {
    font-size: 12px;
    margin-top: 1px;
}

.mobile-list .scroller {
    height: 65dvh;
    /* antes 320px; +40px aprox por el footer */
    overflow: auto;
}

.mobile-card {

    /* mejor en móviles modernos (evita barra de dirección): */
    height: 70dvh;
}
</style>