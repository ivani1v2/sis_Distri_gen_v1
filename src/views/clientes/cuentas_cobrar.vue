<template>
  <div class="pa-4">
    <v-card class="elevation-3 rounded-lg">
      <v-card-title class="pa-4 blue-grey lighten-5 d-block">
        <div class="d-flex align-center mb-3">
          <v-icon :large="$vuetify.breakpoint.mdAndUp" left color="blue-grey darken-3">mdi-cash-multiple</v-icon>
          <span :class="{ 'text-h5': $vuetify.breakpoint.mdAndUp, 'text-h6': $vuetify.breakpoint.smAndDown }"
            class="font-weight-bold blue-grey--text text--darken-3">Cx Cobrar</span>
          <v-spacer></v-spacer>
          <v-btn color="green" small @click="exportarExcel" class="ml-2 white--text font-weight-medium">
            <v-icon left small>mdi-file-excel</v-icon>
            <span>Exportar</span>
          </v-btn>
          <v-btn color="error" small @click="exportarPdf" class="ml-2 font-weight-medium">
            <v-icon left small>mdi-file</v-icon>
            <span>PDF</span>
          </v-btn>
        </div>

        <v-row dense>
          <v-col cols="12" md="2">
            <v-select outlined dense hide-details v-model="cuenta_estado" :items="array_estado" label="Estado"
              prepend-inner-icon="mdi-list-status" @change="filtra" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select outlined dense hide-details v-model="sedeSeleccionada" :items="opcionesSedes" item-text="nombre"
              item-value="base" label="Vendedor" @change="onSedeChange" />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete outlined dense hide-details label="Buscar Cliente" :items="arra_empleados"
              item-text="nombre" item-value="documento" prepend-inner-icon="mdi-account-search" v-model="busca_p"
              clearable />
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-center">
            <v-btn block color="primary" outlined class="elevation-2" @click="filtra">
              <v-icon left>mdi-filter</v-icon>
              Filtrar
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
        no-data-text="No hay cuentas por cobrar disponibles" item-key="_rowKey">
        <template v-slot:[`item.cliente`]="{ item }">
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

        <template v-slot:[`item.fecha`]="{ item }">
          <v-chip small color="blue-grey lighten-5" class="font-weight-bold">{{ conviertefecha(item.fecha) }}</v-chip>
        </template>

        <template v-slot:[`item.fecha_vence`]="{ item }">
          <v-chip small
            :color="analiza_fecha(item.fecha_vence) && item.estado === 'PENDIENTE' ? 'red lighten-4' : 'green lighten-4'"
            class="font-weight-bold">
            {{ conviertefecha(item.fecha_vence) }}
          </v-chip>
        </template>
        <template v-slot:[`item.dias_credito`]="{ item }">
          {{ calcularDiasCredito(item.fecha, item.fecha_vence) }}
          {{ calcularDiasCredito(item.fecha, item.fecha_vence) === 1 ? 'día' : 'días' }}
        </template>

        <template v-slot:[`item.estado`]="{ item }">
          <v-chip small
            :color="item.estado === 'LIQUIDADO' ? 'green' : (item.estado === 'PENDIENTE' ? 'orange' : 'red')" dark>
            {{ item.estado }}
          </v-chip>
        </template>

        <template v-slot:[`item.monto_total`]="{ item }">
          <span class="font-weight-bold">{{ monedaSimbolo }} {{ redondear(item.monto_total) }}</span>
        </template>

        <template v-slot:[`item.monto_pendiente`]="{ item }">
          <span class="red--text font-weight-bold">{{ monedaSimbolo }} {{ redondear(item.monto_pendiente) }}</span>
        </template>

        <template v-slot:[`item.pagado`]="{ item }">
          <span class="green--text font-weight-bold">{{ monedaSimbolo }}{{ redondear(item.monto_total -
            item.monto_pendiente) }}</span>
        </template>

        <template v-slot:[`item.accion`]="{ item }">
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on" small>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item v-if="item.estado === 'ELIMINADO'" @click="revertirEstado(item)">
                <v-list-item-icon><v-icon color="success">mdi-restore</v-icon></v-list-item-icon>
                <v-list-item-title>Revertir Estado (Activar)</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="item.estado !== 'ELIMINADO'" @click="ejecuta_liquidacion(item)"
                :disabled="item.estado === 'LIQUIDADO'">
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

    <dial_liquidacion_cliente v-model="dialog_liquidacion" :cuenta="item_selecto" @actualizar="actualizarItem"
      @cerrar="dialog_liquidacion = false" />

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
        <imprime v-if="genera_pdf" :data="seleccionado" :sede_base="seleccionado.sede_base"
          @cierra="genera_pdf = $event" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import imprime from '@/components/dialogos/dialog_imprime'
import {
  allcuentaxcobrar,
  consultaDetalle,
  consulta_Cabecera,
  editaCuentaxCobrar,
  allCxCMultiSedes,
  consultaCabeceraPorSede,
  consultaDetallePorSede,
} from '../../db'
import { reporte_cronograma } from "./cuentas_x_cobrar/formatos_cuentas"
import store from '@/store/index'
import dial_liquidacion_cliente from './cuentas_x_cobrar/dial_liquidacion_cliente.vue'
import {
  pdfGenera_resumen
} from '../../pdf_comprobantes'
import moment from 'moment'
import {
  pdf_cuentas_cobrar,
  pdf_liquida_prestamo
} from '../../pdf_reportes'
import XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default {
  components: {
    imprime,
    dial_liquidacion_cliente,
  },

  data: () => ({
    headersCxc: [
      { text: 'Cliente', value: 'cliente', sortable: true },
      { text: 'Emision', value: 'fecha', sortable: true },
      { text: 'Venci.', value: 'fecha_vence', sortable: true },
      { text: 'Días', value: 'dias_credito', sortable: true, align: 'center' },
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
    genera_pdf: false,

    item_selecto: {},
    detalle: [],

    arrayConsolidar: [],

    array_estado: ['PENDIENTE', 'LIQUIDADO', 'ELIMINADO'],
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
    zonasSeleccionadas: ['TODOS'],
    zonasPrevios: ['TODOS'],
    allZonas: [],
    sedeSeleccionada: 'TODAS',
    sedesDisponibles: [],
    menuOpc: false,

  }),

  created() {
    this.cargarSedes();
    this.cargarCxCMultiSede();
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

      return [{ nombre: 'TODAS', codigo: 'TODOS' }, ...items];
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

    monedaSimbolo() {
      return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
    },
    esAdmin() {
      return this.$store.state.permisos?.es_admin === true;
    },
    opcionesSedes() {
      const opciones = [
        { nombre: 'TODOS', base: 'TODAS' }
      ];
      this.sedesDisponibles.forEach(s => {
        opciones.push({
          nombre: s.nombre,
          base: s.base
        });
      });
      return opciones;
    },
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
    dedupeSedesPorBase(sedes = []) {
      const usadas = new Set();
      return (Array.isArray(sedes) ? sedes : []).filter(s => {
        const base = String(s?.base || '').trim();
        if (!base || usadas.has(base)) return false;
        usadas.add(base);
        return true;
      });
    },

    normalizaCxcRows(rows = []) {
      const contador = new Map();
      const baseActual = this.$store.state?.baseDatos?.bd;
      return (Array.isArray(rows) ? rows : []).map((raw, index) => {
        const item = { ...raw };
        let vendedor_nombre = 'Sin vendedor';
        if (item.vendedor && Array.isArray(this.$store.state.array_sedes)) {
          const vendedorInfo = this.$store.state.array_sedes.find(s => s.codigo === item.vendedor);
          if (vendedorInfo) vendedor_nombre = vendedorInfo.nombre;
        }

        const sedeBase = item.sede_base || item.base || baseActual;
        const ref = item.doc_ref || item.id || item.key || `ROW_${index}`;
        const uniqueKeyBase = item.unique_key || `${sedeBase}_${ref}`;

        const repeticiones = (contador.get(uniqueKeyBase) || 0) + 1;
        contador.set(uniqueKeyBase, repeticiones);

        const rowKey = repeticiones === 1 ? uniqueKeyBase : `${uniqueKeyBase}__${repeticiones}`;
        const nombre = item.nombre || item.cliente || '';

        return {
          ...item,
          nombre,
          cliente: nombre,
          vendedor_nombre,
          sede_base: sedeBase,
          unique_key: uniqueKeyBase,
          _rowKey: rowKey,
          id: rowKey,
        };
      });
    },

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
        store.commit("dialogoprogress");

        const textoBusqueda = String(this.busca_p || '').trim();

        if (!textoBusqueda) {
          await this.cargarCxCMultiSede();
          store.commit("dialogoprogress");
          return;
        }

        const cli = textoBusqueda.split('/')[0].trim();

        const filtrados = this.allCuentasRaw.filter(item =>
          item.documento === cli && item.estado === this.cuenta_estado
        );

        this.allCuentasRaw = this.normalizaCxcRows(filtrados);
        this.applyVendorFilter();
        store.commit("dialogoprogress");

      } catch (error) {
        console.error('Error en filtra:', error);
        this.allCuentasRaw = [];
        this.desserts = [];
        store.commit("dialogoprogress");
      }
    },

    imprime_constancia(cuota, index) {
      // Este método ahora está en dial_liquidacion_cliente
    },

    verCronogramaPDF(item) {
      reporte_cronograma(item);
    },

    actualizarItem(nuevo) {
      const index = this.allCuentasRaw.findIndex(item => item.unique_key === nuevo.unique_key);
      if (index !== -1) {
        this.allCuentasRaw[index] = { ...this.allCuentasRaw[index], ...nuevo };
      }

      this.applyVendorFilter();
    },

    async ejecutaConsolida(value) {
      store.commit("dialogoprogress", 1);
      this.arrayConsolidar = [];
      this.seleccionado = value;
      const sedeBase = value.sede_base || this.$store.state.baseDatos.bd;
      const detallesSnap = await consultaDetallePorSede(sedeBase, value.doc_ref);
      if (detallesSnap.exists()) {
        const detallesVal = detallesSnap.val();
        if (Array.isArray(detallesVal)) {
          detallesVal.forEach(item => {
            this.arrayConsolidar.push(item);
          });
        } else if (typeof detallesVal === 'object') {
          Object.values(detallesVal).forEach(item => {
            if (item && typeof item === 'object') {
              this.arrayConsolidar.push(item);
            }
          });
        }
      }
      store.commit("dialogoprogress", 1);
      this.dialog = true;
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
      if (!item || !item.doc_ref) {
        store.commit('dialogosnackbar', 'Error: El comprobante no tiene número de referencia');
        return;
      }

      try {
        store.commit("dialogoprogress", 1);
        const sedeBase = item.sede_base || this.$store.state.baseDatos.bd;
        const cabeceraSnap = await consultaCabeceraPorSede(sedeBase, item.doc_ref);

        if (!cabeceraSnap.exists()) {
          console.warn('No existe cabecera para:', item.doc_ref, 'en sede:', sedeBase);
          store.commit('dialogosnackbar', 'El comprobante no existe en la sede indicada');
          store.commit("dialogoprogress", 1);
          return;
        }

        const detallesSnap = await consultaDetallePorSede(sedeBase, item.doc_ref);

        if (!detallesSnap.exists()) {
          console.warn('El comprobante no tiene detalles:', item.doc_ref);
          store.commit('dialogosnackbar', 'Este comprobante no tiene productos');
          store.commit("dialogoprogress", 1);
          return;
        }

        const detallesVal = detallesSnap.val();
        let tieneDetalles = false;

        if (Array.isArray(detallesVal) && detallesVal.length > 0) {
          tieneDetalles = true;
        } else if (typeof detallesVal === 'object' && detallesVal !== null) {
          const keys = Object.keys(detallesVal);
          if (keys.length > 0) {
            tieneDetalles = true;
          }
        }

        if (!tieneDetalles) {
          console.warn('Los detalles están vacíos');
          store.commit('dialogosnackbar', 'El comprobante no tiene productos');
          store.commit("dialogoprogress", 1);
          return;
        }

        const cabeceraData = cabeceraSnap.val();
        this.seleccionado = {
          ...cabeceraData,
          ...item,
          doc_ref: item.doc_ref,
          numeracion: item.doc_ref,
          cliente_nombre: item.nombre,
          cliente_documento: item.documento,
          sede_base: sedeBase
        };

        this.genera_pdf = true;

      } catch (error) {
        console.error('Error en verPDF:', error);
        store.commit('dialogosnackbar', 'Error al consultar el comprobante');
      } finally {
        store.commit("dialogoprogress", 1);
      }
    },

    ejecuta_liquidacion(value) {
      if (!value.sede_base && value.sede) {
        const sedeEncontrada = this.sedesDisponibles.find(s => s.nombre === value.sede);
        if (sedeEncontrada) {
          value.sede_base = sedeEncontrada.base;
        }
      }
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
    calcularDiasCredito(fechaEmision, fechaVencimiento) {
      if (!fechaEmision || !fechaVencimiento) return 0;
      const emision = moment.unix(fechaEmision);
      const vencimiento = moment.unix(fechaVencimiento);
      return vencimiento.diff(emision, 'days');
    },
    cargarSedes() {
      if (this.$store.state.array_sedes && this.$store.state.array_sedes.length > 0) {
        const sedesUnicas = this.dedupeSedesPorBase(this.$store.state.array_sedes);
        this.sedesDisponibles = sedesUnicas.map(s => ({
          nombre: s.nombre,
          base: s.base,
          codigo: s.codigo
        }));
        this.sedeSeleccionada = 'TODAS';
      } else {
        console.log('No hay sedes disponibles en el store');
      }
    },

    async cargarCxCMultiSede() {
      this.dialogoprogress = true;

      let sedesABuscar = this.dedupeSedesPorBase(this.sedesDisponibles);
      if (this.sedeSeleccionada !== 'TODAS') {
        const sede = this.sedesDisponibles.find(s => s.base === this.sedeSeleccionada);
        sedesABuscar = sede ? [sede] : [];
      }

      const resultados = await allCxCMultiSedes(sedesABuscar);

      this.allCuentasRaw = this.normalizaCxcRows(resultados);
      this.applyVendorFilter();
      this.dialogoprogress = false;
    },

    onSedeChange() {
      this.cargarCxCMultiSede();
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
    async revertirEstado(item) {
      if (!confirm(`¿Revertir la cuenta eliminada del cliente ${item.nombre} (${item.doc_ref})?`)) return

      store.commit('dialogoprogress', 1)
      try {
        await editaCuentaxCobrar(item.doc_ref, 'estado', 'PENDIENTE')
        await editaCuentaxCobrar(item.doc_ref, 'fecha_anulacion', null)

        alert('Cuenta revertida correctamente.')
        await this.filtra()

      } catch (error) {
        console.error('Error al revertir:', error)
        alert('Ocurrió un error al revertir la cuenta.')
      } finally {
        store.commit('dialogoprogress', 1)
      }
    },
    exportarPdf() {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

      const fechaImpresion = moment().format('DD/MM/YYYY hh:mm a')
      const total = this.suma_total()

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORTE CUENTAS POR COBRAR', 105, 15, { align: 'center' })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${fechaImpresion}`, 10, 25)
      doc.text(`Total Pendiente: ${this.monedaSimbolo} ${total.toFixed(2)}`, 200, 25, { align: 'right' })

      const rows = this.desserts.map(item => [
        item.doc_ref || '',
        `${item.documento || ''} - ${item.nombre || ''}`,
        item.vendedor || '',
        moment.unix(item.fecha).format('DD/MM/YY'),
        moment.unix(item.fecha_vence).format('DD/MM/YY'),
        this.calcularDiasCredito(item.fecha, item.fecha_vence),
        item.estado || '',
        `${this.monedaSimbolo} ${parseFloat(item.monto_total || 0).toFixed(2)}`,
        `${this.monedaSimbolo} ${parseFloat(item.monto_pendiente || 0).toFixed(2)}`
      ])

      doc.autoTable({
        startY: 30,
        margin: { left: 10, right: 5 },
        head: [['Comprobante', 'Doc - Cliente', 'Vend', 'Emisión', 'Vence', 'Días', 'Estado', 'Total', 'Pendiente']],
        body: rows,
        styles: { fontSize: 6.5, cellPadding: 1, textColor: [0, 0, 0], fillColor: [255, 255, 255] },
        headStyles: { fillColor: [66, 66, 66], textColor: 255, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 8, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 8, halign: 'center' },
          6: { cellWidth: 15 },
          7: { cellWidth: 18, halign: 'right' },
          8: { cellWidth: 18, halign: 'right' }
        }
      })

      window.open(doc.output('bloburl'))
    }
  }
}
</script>