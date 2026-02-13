<template>
  <div class="pa-4">
    <v-card class="elevation-3 rounded-lg">
      <v-card-title class="pa-4 blue-grey lighten-5 d-block">
        <div class="d-flex align-center mb-3">
          <v-icon :large="$vuetify.breakpoint.mdAndUp" left color="blue-grey darken-3">mdi-cash-multiple</v-icon>
          <span :class="{ 'text-h5': $vuetify.breakpoint.mdAndUp, 'text-h6': $vuetify.breakpoint.smAndDown }"
            class="font-weight-bold blue-grey--text text--darken-3">Cx Cobrar</span>
          <v-spacer></v-spacer>
          <v-btn color="info" small @click="exportarExcel" class="ml-2 font-weight-medium">
            <v-icon left small>mdi-file-excel</v-icon>
            <span>Exportar</span>

          </v-btn>
        </div>

        <v-row dense>
          <v-col cols="12" md="3">
            <v-select outlined dense hide-details v-model="cuenta_estado" :items="array_estado" label="Estado"
              prepend-inner-icon="mdi-list-status" @change="filtra" />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete outlined dense hide-details label="Buscar Cliente" :items="arra_empleados"
              item-text="nombre" item-value="documento" prepend-inner-icon="mdi-account-search" v-model="busca_p"
              clearable />

          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="vendedoresSeleccionados" :items="vendedoresItems" item-text="nombre" item-value="codigo"
              label="Vendedor" multiple outlined dense chips small-chips deletable-chips clearable
              :menu-props="{ closeOnContentClick: true }" @change="onVendedorChange" class="mb-n6" />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="zonasSeleccionadas" :items="zonasItems" item-text="nombre" item-value="codigo"
              label="Zona/Cliente" multiple outlined dense chips small-chips deletable-chips clearable
              :menu-props="{ closeOnContentClick: true }" @change="onZonaChange" class="mb-n6" />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn block color="primary" class="elevation-2" @click="filtra">
              <v-icon left>mdi-filter</v-icon>
              Aplicar filtros
            </v-btn>
          </v-col>
        </v-row>

      </v-card-title>

      <v-divider></v-divider>
      <v-card-text class="py-4">
        <v-row align="center">
          <h4 class="text-h6">
            Total Pendiente: <span class="red--text text--darken-3">{{ monedaSimbolo }} {{ suma_total().toFixed(2)
            }}</span>
          </h4>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-data-table :headers="headersCxc" :items="listafiltrada" :items-per-page="-1" class="elevation-0"
        :sort-by.sync="sortBy" :sort-desc.sync="sortDesc" dense fixed-header height="65vh" mobile-breakpoint="1"
        no-data-text="No hay cuentas por cobrar disponibles">
        <template v-slot:item.cliente="{ item }">
          <div class="font-weight-medium">
            {{ item.nombre }}
          </div>
          <div class="caption grey--text d-flex align-center">
            <span>{{ item.documento }}</span>
            <v-divider vertical class="mx-2"></v-divider>
            <span class=" caption blue--text text--darken-1">
              {{ item.doc_ref }}
            </span>
          </div>
        </template>

        <template v-slot:item.fecha="{ item }">
          <v-chip small color="blue-grey lighten-5" class="font-weight-bold">{{ conviertefecha(item.fecha) }}</v-chip>
        </template>

        <template v-slot:item.fecha_vence="{ item }">
          <v-chip small
            :color="analiza_fecha(item.fecha_vence) && item.estado === 'PENDIENTE' ? 'red lighten-4' : 'green lighten-4'"
            class="font-weight-bold">
            {{ conviertefecha(item.fecha_vence) }}
          </v-chip>
        </template>

        <template v-slot:item.estado="{ item }">
          <v-chip small
            :color="item.estado === 'LIQUIDADO' ? 'green' : (item.estado === 'PENDIENTE' ? 'orange' : 'red')" dark>
            {{ item.estado }}
          </v-chip>
        </template>

        <template v-slot:item.monto_total="{ item }">
          <span class="font-weight-bold">{{ monedaSimbolo }} {{ redondear(item.monto_total) }}</span>
        </template>

        <template v-slot:item.monto_pendiente="{ item }">
          <span class="red--text font-weight-bold">{{ monedaSimbolo }} {{ redondear(item.monto_pendiente) }}</span>
        </template>

        <template v-slot:item.pagado="{ item }">
          <span class="green--text font-weight-bold">{{ monedaSimbolo }}{{ redondear(item.monto_total -
            item.monto_pendiente) }}</span>
        </template>

        <template v-slot:item.accion="{ item }">
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on" small>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item @click="ejecuta_liquidacion(item)" :disabled="item.estado === 'LIQUIDADO'">
                <v-list-item-icon><v-icon color="warning">mdi-hand-heart</v-icon></v-list-item-icon>
                <v-list-item-title>Liquidación / Abono</v-list-item-title>
              </v-list-item>
              <v-list-item @click.prevent="ejecutaConsolida(item)">
                <v-list-item-icon><v-icon color="info">mdi-eye</v-icon></v-list-item-icon>
                <v-list-item-title>Ver Detalle Productos</v-list-item-title>
              </v-list-item>
              <v-list-item @click.prevent="verCronogramaPDF(item)">
                <v-list-item-icon><v-icon color="success">mdi-calendar</v-icon></v-list-item-icon>
                <v-list-item-title>Ver Cronograma</v-list-item-title>
              </v-list-item>
              <v-list-item @click.prevent="verPDF(item)">
                <v-list-item-icon><v-icon color="red">mdi-file-pdf-box</v-icon></v-list-item-icon>
                <v-list-item-title>Ver Comprobante (PDF)</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>

    </v-card>

    <v-dialog v-model="dialog" max-width="590">
      <v-card class="rounded-lg">
        <v-toolbar color="primary" dark dense>
          <v-toolbar-title>Detalle de Comprobante: {{ item_selecto.doc_ref }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-virtual-scroll :items="arrayConsolidar" :item-height="55" height="400">
            <template v-slot:default="{ item }">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium" v-text="item.nombre"></v-list-item-title>
                  <v-list-item-subtitle class="caption"
                    v-text="`${monedaSimbolo}${item.precio} x ${item.medida}`"></v-list-item-subtitle>
                  <v-list-item-subtitle v-if="item.preciodescuento != 0" class="red--text caption font-weight-bold">
                    Descuento ({{ monedaSimbolo }}{{ redondear(item.preciodescuento) }})
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip color="blue-grey lighten-5" small>{{ item.cantidad }} Uds.</v-chip>
                </v-list-item-action>
                <v-list-item-action>
                  <span class="font-weight-bold primary--text">{{ monedaSimbolo }}{{ redondear((item.precioedita *
                    item.cantidad) -
                    item.preciodescuento) }}</span>
                </v-list-item-action>
              </v-list-item>
              <v-divider></v-divider>
            </template>
          </v-virtual-scroll>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog_liquidacion" max-width="650">
      <v-card class="rounded-lg">
        <v-toolbar color="success" dark dense>
          <v-btn icon @click="dialog_liquidacion = false" color="red"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>Liquidación de Crédito</v-toolbar-title>
          <v-icon color="red" @click.prevent="eliminar(item_selecto)">mdi-delete</v-icon>
          <v-spacer></v-spacer>


        </v-toolbar>
        <v-card-text class="pa-4">
          <v-row dense class="mb-2">
            <v-col cols="6">
              <h4 class="font-weight-medium">Comprobante: <span class="blue-grey--text text--darken-2">{{
                item_selecto.doc_ref }}</span></h4>
            </v-col>
            <v-col cols="6" class="text-right">
              <h4 class="font-weight-medium">Vence: <span class="red--text text--darken-1">{{
                conviertefecha(item_selecto.fecha_vence) }}</span></h4>
            </v-col>
          </v-row>
          <h4 class="mb-2">Cliente: <span class="blue-grey--text text--darken-2">{{ item_selecto.nombre }}</span></h4>
          <h4 class="mb-4">Total Pendiente: <span class="red--text text--darken-2">{{ monedaSimbolo }}{{
            redondear(item_selecto.monto_pendiente) }}</span></h4>

          <v-card outlined class="pa-2 mb-4">
            <h5 class="text-subtitle-2 mb-1">Cronograma de pago</h5>

            <!-- 🔹 Alerta cuando las cuotas no cuadran con el monto_total -->
            <v-alert v-if="descuadreCronograma" type="warning" border="left" colored-border icon="mdi-alert-circle"
              class="mb-3">
              <div class="font-weight-medium">
                El total de las cuotas
                (<strong>{{ moneda }}{{ redondear(sumaCuotas) }}</strong>)
                no coincide con el monto total del crédito
                (<strong>{{ moneda }}{{ redondear(item_selecto.monto_total) }}</strong>).
              </div>
              <div class="mt-1">
                Es necesario agregar una nueva cuota para completar el cronograma.
              </div>

              <template v-slot:append>
                <v-btn small color="primary" @click="abrirNuevaCuota">
                  <v-icon left small>mdi-plus-circle</v-icon>
                  Agregar cuota
                </v-btn>
              </template>
            </v-alert>
            <v-simple-table fixed-header dense height="250px">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left text-caption">Estado</th>
                    <th class="text-left text-caption">Monto</th>
                    <th class="text-left text-caption">Fecha</th>
                    <th class="text-left text-caption">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in item_selecto.datos" :key="index">
                    <td>
                      <v-chip x-small
                        :color="item.estado === 'ABONO' ? 'blue' : (item.estado === 'PENDIENTE' ? 'orange' : 'red')"
                        dark>
                        {{ item.estado }}
                      </v-chip>
                    </td>
                    <td class="font-weight-bold">{{ monedaSimbolo }}{{ redondear(item.monto) }}</td>
                    <td>
                      <v-chip small color="grey lighten-4" class="font-weight-bold">
                        {{ conviertefecha(item.fecha_vence) }}
                      </v-chip>
                      <v-chip v-if="item.estado === 'PAGADO'" color="info" x-small>PAGADO
                        {{ conviertefecha(item.fecha_pagado) }}</v-chip>
                    </td>
                    <td>
                      <v-menu offset-y>
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn icon v-bind="attrs" v-on="on">
                            <v-icon>mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>

                        <v-list dense>
                          <v-list-item @click="abonarCuota(item, index)" :disabled="item.estado === 'PAGADO'">
                            <v-list-item-icon>
                              <v-icon color="green">mdi-cash-plus</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title>Abonar</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="imprime_constancia(item, index)" v-if="item.estado == 'PAGADO'">
                            <v-list-item-icon>
                              <v-icon color="warning">mdi-printer</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title>Imprime Constancia</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="editarCuota(item, index)" :disabled="item.estado === 'PAGADO'">
                            <v-list-item-icon>
                              <v-icon color="blue">mdi-pencil</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title>Editar</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="eliminarCuota(item, index)">
                            <v-list-item-icon>
                              <v-icon color="red">mdi-delete</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title>Eliminar</v-list-item-title>
                          </v-list-item>

                        </v-list>
                      </v-menu>
                    </td>

                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card>
        </v-card-text>

      </v-card>
    </v-dialog>


    <v-dialog v-model="dialog_detalle_cuota" max-width="350">
      <v-card class="rounded-lg">
        <v-toolbar color="grey darken-2" dark dense>
          <v-toolbar-title>Detalle de Movimiento</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog_detalle_cuota = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <h4>Modificado: {{ conviertefecha(detalle.fecha_modificacion) || 'N/A' }} </h4>
          <h4>Responsable: {{ detalle.vendedor || 'N/A' }} </h4>
          <h4 v-if="detalle.amortizado != undefined">Monto Amortiza: {{ monedaSimbolo }}{{ redondear(detalle.amortizado)
          }}
          </h4>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="genera_pdf" max-width="550">
      <v-card class="rounded-lg">
        <v-toolbar color="red darken-2" dark dense>
          <v-toolbar-title>Vista Previa de Comprobante</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="(genera_pdf = !genera_pdf)"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />
      </v-card>
    </v-dialog>
    <d_amortiza v-if="dialog_amortiza" :item_selecto="item_selecto" :item_selecto_cuota_index="item_selecto_cuota_index"
      @actualizar-item="actualizarItem" @cerrar="dialog_amortiza = false" />
    <d_editar v-if="dialog_editar_cuota" :item_selecto="item_selecto" :cuota_edit_index="cuota_edit_index"
      :cuota_edit_monto="cuota_edit_monto" :cuota_edit_fecha_str="cuota_edit_fecha_str"
      @actualizar-item="actualizarItem" @cerrar="dialog_editar_cuota = false" />
    <d_nueva_cuota v-if="dialog_nueva_cuota" :item_selecto="item_selecto" @actualizar-item="actualizarItem"
      @cerrar="dialog_nueva_cuota = false" />
  </div>
</template>

<script>
import imprime from '@/components/dialogos/dialog_imprime'
import {
  allcuentaxcobrar,
  consultaDetalle,
  consulta_Cabecera,
  editaCuentaxCobrar,
} from '../../db'
import { reporte_cronograma, reporte_liquidacion_cuota } from "./cuentas_x_cobrar/formatos_cuentas"
import store from '@/store/index'
import d_editar from './cuentas_x_cobrar/dial_editar_cuota.vue'
import d_amortiza from './cuentas_x_cobrar/dial_amortiza.vue'
import d_nueva_cuota from './cuentas_x_cobrar/dial_nueva_cuota.vue'
import {
  pdfGenera_resumen
} from '../../pdf_comprobantes'
import moment from 'moment'
import {
  pdf_cuentas_cobrar,
  pdf_liquida_prestamo
} from '../../pdf_reportes'
import XLSX from 'xlsx'

export default {
  components: {
    imprime,
    d_amortiza,
    d_editar,
    d_nueva_cuota,
  },

  data: () => ({
    headersCxc: [
      { text: 'Cliente', value: 'cliente', sortable: true },
      { text: 'Zona', value: 'cliente_zona', sortable: true },
      { text: 'Emision', value: 'fecha', sortable: true },
      { text: 'Venci.', value: 'fecha_vence', sortable: true },
      { text: 'Estado', value: 'estado', sortable: true },
      { text: 'Vendedor', value: 'vendedor_nombre', sortable: true },
      { text: 'Total', value: 'monto_total', sortable: true, align: 'end' },
      { text: 'Pendiente', value: 'monto_pendiente', sortable: true, align: 'end' },
      { text: 'Pagado', value: 'pagado', sortable: true, align: 'end' },
      { text: 'Accion', value: 'accion', sortable: false, align: 'center' },
    ],

    desserts: [],
    sortBy: ['cliente'],
    sortDesc: [false],

    dialog: false,
    dialog_liquidacion: false,
    dialog_detalle_cuota: false,
    dialog_amortiza: false,
    dialog_editar_cuota: false,
    genera_pdf: false,

    item_selecto: [],
    item_selecto_cuota_index: null,
    detalle: [],

    cuota_edit_monto: '',
    cuota_edit_fecha_str: '',
    cuota_edit_index: null,

    arrayConsolidar: [],

    array_estado: ['PENDIENTE', 'LIQUIDADO'],
    cuenta_estado: 'PENDIENTE',
    buscar: '',
    busca_p: '',
    arra_empleados: [],

    vendedoresSeleccionados: ['TODOS'],
    vendedoresPrevios: ['TODOS'],
    dialFiltroMovil: false,
    allCuentasRaw: [],

    date1: moment(String(new Date)).format('YYYY-MM-DD'),
    seleccionado: '',
    a_cuenta: 0,
    dialog_nueva_cuota: false,
    zonasSeleccionadas: ['TODOS'],
    zonasPrevios: ['TODOS'],
    allZonas: [],

  }),

  created() {
    this.inicializarVendedores();
    this.inicializarZonas();
    this.filtra();
  },

  computed: {
    zonasItems() {
      const zonas = this.allCuentasRaw
        .map(item => item.cliente_zona)
        .filter(zona => zona && zona.trim() !== '')
        .filter((zona, index, self) => self.indexOf(zona) === index)
        .sort();

      const items = zonas.map(zona => ({
        nombre: zona,
        codigo: zona
      }));

      return [{ nombre: 'TODAS LAS ZONAS', codigo: 'TODOS' }, ...items];
    },

    listafiltrada() {
      const texto = (this.busca_p || '').toLowerCase().trim()

      if (!texto) return this.desserts

      return this.desserts.filter(item => {
        return (
          item.nombre?.toLowerCase().includes(texto) ||
          item.documento?.toLowerCase().includes(texto) ||
          item.doc_ref?.toLowerCase().includes(texto)
        )
      })
    },
    vendedoresItems() {
      const base = Array.isArray(this.$store.state.array_sedes)
        ? this.$store.state.array_sedes
        : [];
      const tieneTodos = base.some(it => (it.codigo || '').toString().toUpperCase() === 'TODOS');
      const items = tieneTodos ? base : [{ nombre: 'TODOS', codigo: 'TODOS' }, ...base];
      return items;
    },

    moneda() {
      return this.item_selecto?.moneda || 'S/'
    },

    sumaCuotas() {
      if (!this.item_selecto || !Array.isArray(this.item_selecto.datos)) return 0
      return this.item_selecto.datos.reduce(
        (acc, it) => acc + (parseFloat(it.monto) || 0),
        0
      )
    },

    descuadreCronograma() {
      if (!this.item_selecto) return false
      const totalCredito = parseFloat(this.item_selecto.monto_total) || 0
      return Math.abs(totalCredito - this.sumaCuotas) > 0.01
    },

    monedaSimbolo() {
      return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
    }
  },

  watch: {
    '$store.state.clientessearch': {
      immediate: true,
      handler(nuevo) {
        const base = Array.isArray(nuevo) ? nuevo : []
        this.arra_empleados = base.map(it => ({
          documento: it.id,
          nombre: it.nombre,
        }))
      }
    },
    vendedoresSeleccionados() {
      this.applyVendorFilter();
    },
    cuenta_estado() {
      this.applyVendorFilter();
    },
  },

  methods: {
    inicializarZonas() {
      this.zonasSeleccionadas = ['TODOS'];
      this.zonasPrevios = ['TODOS'];
    },

    onZonaChange(val = []) {
      const TODOS = 'TODOS'
      const antes = this.zonasPrevios
      const ahora = val

      if (
        antes.includes(TODOS) &&
        ahora.length > 1 &&
        ahora.some(v => v !== TODOS)
      ) {
        this.zonasSeleccionadas = ahora.filter(v => v !== TODOS)
      }
      else if (
        ahora.includes(TODOS) &&
        ahora.length > 1
      ) {
        this.zonasSeleccionadas = [TODOS]
      }
      this.zonasPrevios = [...this.zonasSeleccionadas]
      this.applyVendorFilter();
    },
    inicializarVendedores() {
      if (!store.state.permisos?.es_admin) {
        this.vendedoresSeleccionados = [store.state.sedeActual?.codigo || 'TODOS'];
      } else {
        this.vendedoresSeleccionados = ['TODOS'];
      }
    },

    aplicarFiltroMovil() {
      this.dialFiltroMovil = false;
      this.applyVendorFilter();
    },

    onVendedorChange(val = []) {
      const TODOS = 'TODOS'
      const antes = this.vendedoresPrevios
      const ahora = val
      if (
        antes.includes(TODOS) &&
        ahora.length > 1 &&
        ahora.some(v => v !== TODOS)
      ) {
        this.vendedoresSeleccionados = ahora.filter(v => v !== TODOS)
      }
      else if (
        ahora.includes(TODOS) &&
        ahora.length > 1
      ) {
        this.vendedoresSeleccionados = [TODOS]
      }
      this.vendedoresPrevios = [...this.vendedoresSeleccionados]
    },

    applyVendorFilter() {
      const seleccionados = this.vendedoresSeleccionados || [];
      const zonasSeleccionadas = this.zonasSeleccionadas || [];

      if (seleccionados.length === 0) {
        this.desserts = [];
        return;
      }

      let filtered = this.allCuentasRaw.filter(item =>
        item.estado === this.cuenta_estado
      );

      if (!seleccionados.includes('TODOS')) {
        const codigosNormalizados = seleccionados.map(c => String(c).toUpperCase().trim());
        filtered = filtered.filter(p => {
          const codVendedor = (p.vendedor != null ? String(p.vendedor) : '').toUpperCase().trim();
          return codigosNormalizados.includes(codVendedor);
        });
      }

      if (!zonasSeleccionadas.includes('TODOS')) {
        filtered = filtered.filter(p => {
          const zona = p.cliente_zona || '';
          return zonasSeleccionadas.includes(zona);
        });
      }

      this.desserts = filtered;
    },

    async filtra() {
      try {
        var array = [];
        this.busca_p = this.busca_p || '';
        var cli = this.busca_p.split('/')[0].trim();

        let snap;

        if (this.busca_p == '') {
          snap = await allcuentaxcobrar()
            .orderByChild("estado")
            .equalTo(this.cuenta_estado)
            .once("value");
        } else {
          snap = await allcuentaxcobrar()
            .orderByChild("documento")
            .equalTo(cli)
            .once("value");
        }

        if (snap.exists()) {
          snap.forEach(item => {
            const data = item.val();
            if (this.busca_p !== '' && data.estado !== this.cuenta_estado) {
              return;
            }

            let vendedor_nombre = 'Sin vendedor';
            if (data.vendedor && Array.isArray(this.$store.state.array_sedes)) {
              const vendedorInfo = this.$store.state.array_sedes.find(s =>
                s.codigo === data.vendedor
              );
              if (vendedorInfo) {
                vendedor_nombre = vendedorInfo.nombre;
              }
            }

            const nom = data.nombre || data.cliente || '';
            array.push({
              ...data,
              nombre: nom,
              cliente: nom,
              vendedor_nombre: vendedor_nombre,
              cliente_zona: data.cliente_zona || 'SIN ZONA' // Valor por defecto
            });
          });
        }

        this.allCuentasRaw = array;

        // Inicializar zonas después de tener datos
        if (this.zonasSeleccionadas.length === 0) {
          this.inicializarZonas();
        }

        this.applyVendorFilter();

      } catch (error) {
        console.error('Error en filtra:', error);
        this.allCuentasRaw = [];
        this.desserts = [];
      }
    },

    imprime_constancia(cuota, index) {
      if (!this.item_selecto) {
        alert('No hay un crédito seleccionado.')
        return
      }
      const pagos = Array.isArray(cuota.pagos) ? cuota.pagos : []
      reporte_liquidacion_cuota(this.item_selecto, cuota, pagos);
    },

    verCronogramaPDF(item) {
      reporte_cronograma(item);
    },

    actualizarItem(nuevo) {
      this.dialog_amortiza = false;
      this.item_selecto = nuevo;
      this.item_selecto_cuota_index = null;
      this.filtra();
    },

    abrirNuevaCuota() {
      if (!this.item_selecto) {
        alert('No hay un crédito seleccionado.');
        return;
      }
      this.dialog_nueva_cuota = true;
    },

    editarCuota(item, index) {
      this.cuota_edit_index = index;
      this.cuota_edit_monto = item.monto;
      this.cuota_edit_fecha_str = moment.unix(item.fecha_vence).format('YYYY-MM-DD');
      this.dialog_editar_cuota = true;
    },

    abonarCuota(item, index) {
      this.item_selecto_cuota_index = index;
      this.a_cuenta = item.monto;
      const total = Number(this.a_cuenta || 0);
      this.pagosEntrega = (this.$store?.state?.modopagos || []).map((n, idx) => ({
        nombre: n,
        monto: idx === 0 && total > 0 ? total.toFixed(2) : ''
      }));
      this.dialog_amortiza = true;
    },

    eliminarCuota(item, index) {
      if (!this.item_selecto || !Array.isArray(this.item_selecto.datos)) return;

      const confirmado = confirm(`¿Eliminar esta cuota de ${this.monedaSimbolo}${this.redondear(item.monto)}?`);
      if (!confirmado) return;

      const datos = [...this.item_selecto.datos];
      datos.splice(index, 1);
      editaCuentaxCobrar(this.item_selecto.doc_ref, 'datos', datos);
      this.item_selecto = {
        ...this.item_selecto,
        datos
      };
    },

    async ejecutaConsolida(value) {
      store.commit("dialogoprogress", 1);
      this.arrayConsolidar = [];
      this.seleccionado = value;
      var snap = await consultaDetalle(value.doc_ref).once("value");
      snap.forEach((item) => {
        this.arrayConsolidar.push(item.val());
      });
      store.commit("dialogoprogress", 1);
      this.dialog = true;
    },

    async eliminar(item) {
      const confirmado = confirm(`¿Eliminar la cuenta por cobrar del cliente ${item.nombre} con comprobante ${item.doc_ref}?`);
      if (!confirmado) return;

      store.commit("dialogoprogress", 1);
      try {
        await editaCuentaxCobrar(item.doc_ref, 'estado', 'ELIMINADO');
        this.filtra();
        this.dialog_liquidacion = false;
        alert('Cuenta por cobrar eliminada correctamente.');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Ocurrió un error al eliminar.');
      } finally {
        store.commit("dialogoprogress", 1);
      }
    },

    async imprime_cuenta() {
      store.commit("dialogoprogress", 1);
      var array = [];
      var aa = this.desserts;
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i];
        var snapshot = await consultaDetalle(data.doc_ref).once("value");
        snapshot.forEach((item) => {
          var datas = item.val();
          array.push(datas);
        });
      }
      pdfGenera_resumen(array);
      store.commit("dialogoprogress", 1);
      return true;
    },

    ejecutareporte() {
      var fecha = this.date1;
      pdf_cuentas_cobrar(this.desserts, fecha);
    },

    suma_total() {
      var aa = this.desserts;
      var suma = 0;
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i];
        suma = suma + parseFloat(data.monto_pendiente);
      }
      return suma;
    },

    async imprime_liquidacion(abonos) {
      var array = [];
      var aa = this.desserts;
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i];
        var snapshot = await consultaDetalle(data.doc_ref).once("value");
        snapshot.forEach((item) => {
          var datas = item.val();
          array.push(datas);
        });
      }
      pdf_liquida_prestamo(array, abonos);
      return true;
    },

    conviertefecha(date) {
      return moment.unix(date).format('DD/MM/YY');
    },

    redondear(valor) {
      return parseFloat(valor).toFixed(store.state.configuracion.decimal);
    },

    async verPDF(item) {
      var a = await consulta_Cabecera(item.doc_ref).once('value');
      if (!a.exists()) {
        alert('COMPROBANTE NO EXISTE');
        return;
      }
      this.seleccionado = a.val();
      this.genera_pdf = true;
    },

    ejecuta_liquidacion(value) {
      this.item_selecto = value;
      this.dialog_liquidacion = true;
    },

    analiza_fecha(datas) {
      var hoy = moment(String(this.date1));
      var data = moment.unix(datas);
      var result = false;
      if (data.isBefore(hoy, 'days')) {
        result = true;
      }
      if (data.isSame(hoy, 'days')) {
        result = true;
      }
      return result;
    },

    exportarExcel() {
      const filas = this.listafiltrada.map(item => ({
        Cliente: item.nombre,
        Documento: item.documento,
        Comprobante: item.doc_ref,
        Emision: this.conviertefecha(item.fecha),
        Vencimiento: this.conviertefecha(item.fecha_vence),
        Estado: item.estado,
        Vendedor: item.vendedor_nombre || 'Sin vendedor',
        'Código Vendedor': item.vendedor || '',
        Moneda: item.moneda || 'S/',
        'Monto total': Number(item.monto_total || 0),
        'Monto pendiente': Number(item.monto_pendiente || 0),
        Pagado: Number((item.monto_total - item.monto_pendiente) || 0),
      }));

      const ws = XLSX.utils.json_to_sheet(filas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CuentasXCobrar');
      XLSX.writeFile(wb, 'cuentas_x_cobrar.xlsx');
    },
  }
}
</script>