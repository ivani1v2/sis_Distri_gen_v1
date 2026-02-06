<template>
  <v-container fluid class="pa-2 pa-md-4">
    <v-card class="elevation-4 rounded-lg mb-4">
      <v-card-title class="blue-grey lighten-5 py-3">
        <span class="font-weight-medium blue-grey--text text--darken-3">
          Stock por Periodo
        </span>
        <v-spacer></v-spacer>
        <v-chip color="primary" outlined>
          <v-icon left small>mdi-cube-scan</v-icon>
          {{ listafiltrada.length }} productos
        </v-chip>
      </v-card-title>
    </v-card>

    <v-card class="elevation-2 rounded-lg mb-4">
      <v-card-text class="pb-2">
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <div class="d-flex align-center">
              <v-select v-model="filtros.anio" :items="years" label="Año" outlined dense hide-details
                class="mr-1 flex-grow-1" prepend-inner-icon="mdi-calendar" @change="onCambioFiltro" />

              <v-select v-model="filtros.mes" :items="mesesSelect" label="Mes" outlined dense hide-details
                class="mr-2 flex-grow-1" prepend-inner-icon="mdi-calendar-month" @change="onCambioFiltro" />

              <v-btn color="primary" @click="cargarCierrePeriodo" :loading="cargando" :disabled="!periodoSeleccionado"
                height="35" class="px-3">
                <v-icon left small>mdi-magnify</v-icon> 
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete v-model="filtros.producto" :items="productosParaFiltro" item-text="nombreCompleto"
              item-value="id" label="Producto" outlined dense hide-details clearable
              prepend-inner-icon="mdi-package-variant" :filter="filtroProducto" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select v-model="filtros.proveedor" :items="proveedoresDisponibles" label="Proveedor" outlined dense
              hide-details clearable prepend-inner-icon="mdi-truck" />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end">
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn icon color="success" class="mr-1" @click="exportarExcel" :disabled="!hayDatos"
                  :loading="exportando" v-bind="attrs" v-on="on">
                  <v-icon>mdi-file-excel</v-icon>
                </v-btn>
              </template>
              <span>Exportar a Excel</span>
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn icon color="error" @click="exportarPDF" :disabled="!hayDatos" v-bind="attrs" v-on="on">
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
              </template>
              <span>Exportar a PDF</span>
            </v-tooltip>
          </v-col>

        </v-row>
      </v-card-text>
    </v-card>


    <v-row dense class="mb-4">
      <v-col cols="6" sm="3">
        <v-card class="elevation-2 rounded-lg text-center pa-3" color="blue lighten-5">
          <div class="text-caption blue--text text--darken-2">PRODUCTOS</div>
          <div class="font-weight-bold blue--text text--darken-3 text-h6">
            {{ listafiltrada.length }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="elevation-2 rounded-lg text-center pa-3" color="green lighten-5">
          <div class="text-caption green--text text--darken-2">SALDO INICIAL</div>
          <div class="font-weight-bold green--text text--darken-3 text-h6">
            {{ formatNumber(kpi.sumaSaldoInicial) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="elevation-2 rounded-lg text-center pa-3" color="orange lighten-5">
          <div class="text-caption orange--text text--darken-2">MOV. DEL MES</div>
          <div class="font-weight-bold orange--text text--darken-3 text-h6">
            {{ kpi.sumaMovMes >= 0 ? '+' : '' }}{{ formatNumber(kpi.sumaMovMes) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="elevation-2 rounded-lg text-center pa-3" color="purple lighten-5">
          <div class="text-caption purple--text text--darken-2">SALDO FINAL</div>
          <div class="font-weight-bold purple--text text--darken-3 text-h6">
            {{ formatNumber(kpi.sumaSaldoFinal) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="cargando" class="elevation-2 rounded-lg mb-4">
      <v-card-text class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <div class="mt-4 grey--text">Cargando datos del periodo...</div>
      </v-card-text>
    </v-card>

    <v-card v-else-if="periodoNoDisponible" class="elevation-2 rounded-lg mb-4">
      <v-card-text class="text-center py-8">
        <v-icon size="64" color="warning">mdi-calendar-remove</v-icon>
        <div class="text-h6 mt-4 warning--text">Periodo no disponible</div>
        <div class="grey--text mt-2">
          El período {{ meses[filtros.mes - 1] }} {{ filtros.anio }} aún no está disponible.
          <br>Solo puede visualizar el mes actual y períodos anteriores.
        </div>
      </v-card-text>
    </v-card>

    <v-card v-else class="elevation-2 rounded-lg">
      <v-card-title class="py-2">
        {{ periodoAbierto ? 'Stock de' : 'Cierre de' }} {{ meses[filtros.mes - 1] }} {{ filtros.anio }}
        <v-chip small class="ml-2" :color="periodoNoDisponible ? 'warning' : (periodoAbierto ? 'info' : 'success')"
          dark>
          <v-icon left x-small>{{ periodoNoDisponible ? 'mdi-calendar-remove' : (periodoAbierto ?
            'mdi-lock-open-variant' :
            'mdi-lock') }}</v-icon>
          {{ periodoNoDisponible ? 'NO DISPONIBLE' : (periodoAbierto ? 'ABIERTO' : 'CERRADO') }}
        </v-chip>
        <v-spacer></v-spacer>
        <v-text-field v-model="busqueda" append-icon="mdi-magnify" label="Buscar..." single-line hide-details dense
          outlined style="max-width: 300px"></v-text-field>
      </v-card-title>
      <v-alert v-if="filtrosCambiados && datosCargados" type="warning" dense text border="left" class="mx-4 mt-2 mb-2">
        <div class="d-flex align-center">
          <span class="caption font-weight-medium">Periodo cambiado: {{ meses[filtros.mes - 1] }} {{ filtros.anio}}</span>
          <v-spacer></v-spacer>
          <v-btn x-small color="success" @click="cargarCierrePeriodo" :loading="cargando" class="ml-2">
            <v-icon x-small left>mdi-refresh</v-icon>
            Actualizar datos
          </v-btn>
        </div>
      </v-alert>

      <v-divider></v-divider>

      <v-data-table v-if="!$vuetify.breakpoint.xs" :headers="headers" :items="listafiltrada" :search="busqueda"
        :items-per-page="15" :footer-props="{ 'items-per-page-options': [10, 15, 25, 50, -1] }" item-key="id"
        class="elevation-0 mb-8" dense :loading="cargando" loading-text="Cargando...">

        <template v-slot:[`item.id`]="{ item }">
          <v-chip small outlined>{{ item.id }}</v-chip>
        </template>

        <template v-slot:[`item.nombre`]="{ item }">
          <div>
            <span class="font-weight-medium">{{ item.nombre }}</span>
            <div class="text-caption grey--text">{{ item.proveedor || '-' }}</div>
          </div>
        </template>

        <template v-slot:[`item.saldo_inicial`]="{ item }">
          <span>{{ formatStock(item.saldo_inicial, item.factor) }}</span>
        </template>

        <template v-slot:[`item.sum_mes`]="{ item }">
          <v-chip small :color="item.sum_mes > 0 ? 'success' : (item.sum_mes < 0 ? 'error' : 'grey')"
            :outlined="item.sum_mes === 0" dark>
            {{ item.sum_mes > 0 ? '+' : '' }}{{ formatNumber(item.sum_mes || 0) }}
          </v-chip>
        </template>

        <template v-slot:[`item.saldo_final`]="{ item }">
          <span class="font-weight-bold">{{ formatStock(item.saldo_final, item.factor) }}</span>
        </template>

        <template v-slot:[`item.movs_mes`]="{ item }">
          <v-chip x-small color="info" outlined>{{ item.movs_mes || 0 }}</v-chip>
        </template>

        <template v-slot:[`body.append`]>
          <tr class="grey lighten-3 font-weight-bold" v-if="listafiltrada.length > 0">
            <td colspan="2" class="text-right">TOTALES:</td>
            <td></td>
            <td class="text-right">{{ formatNumber(kpi.sumaSaldoInicial) }}</td>
            <td class="text-center">
              <v-chip small :color="kpi.sumaMovMes >= 0 ? 'success' : 'error'" dark>
                {{ kpi.sumaMovMes >= 0 ? '+' : '' }}{{ formatNumber(kpi.sumaMovMes) }}
              </v-chip>
            </td>
            <td class="text-right font-weight-bold">{{ formatNumber(kpi.sumaSaldoFinal) }}</td>
            <td class="text-center">{{ formatNumber(kpi.totalMovimientos) }}</td>
          </tr>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" border="left" outlined class="ma-4" dense>
            <span v-if="!datosCargados">Seleccione período y haga clic en "Buscar" para cargar datos.</span>
            <span v-else-if="!periodoSeleccionado">Seleccione un período para visualizar.</span>
            <span v-else-if="periodoAbierto">No hay productos registrados para mostrar el stock actual.</span>
            <span v-else>No se encontraron datos de cierre para {{ meses[filtros.mes - 1] }} {{ filtros.anio }}.</span>
          </v-alert>
        </template>
      </v-data-table>

      <div v-else class="pa-2">
        <v-expansion-panels accordion>
          <v-expansion-panel v-for="item in listaMobilPaginada" :key="item.id">
            <v-expansion-panel-header class="py-2">
              <v-row dense align="center">
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center">
                    <v-chip x-small outlined>{{ item.id }}</v-chip>
                    <span class="font-weight-bold">
                      {{ formatStock(item.saldo_final, item.factor) }}
                    </span>
                  </div>
                  <div class="text-caption font-weight-medium mt-1">{{ item.nombre }}</div>
                  <div class="text-caption grey--text">{{ item.proveedor || '-' }}</div>
                </v-col>
              </v-row>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-divider class="mb-3"></v-divider>
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td class="text-left">Saldo Inicial:</td>
                    <td class="text-right">{{ formatStock(item.saldo_inicial, item.factor) }}</td>
                  </tr>
                  <tr>
                    <td class="text-left">Mov. del Mes:</td>
                    <td class="text-right">
                      <v-chip x-small :color="item.sum_mes > 0 ? 'success' : (item.sum_mes < 0 ? 'error' : 'grey')"
                        dark>
                        {{ item.sum_mes > 0 ? '+' : '' }}{{ formatNumber(item.sum_mes || 0) }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr class="grey lighten-4">
                    <td class="text-left font-weight-bold">Saldo Final:</td>
                    <td class="text-right font-weight-bold">{{ formatStock(item.saldo_final, item.factor) }}</td>
                  </tr>
                  <tr>
                    <td class="text-left">N° Movimientos:</td>
                    <td class="text-right">{{ item.movs_mes || 0 }}</td>
                  </tr>
                  <tr>
                    <td class="text-left">Medida:</td>
                    <td class="text-right">{{ item.medida || '-' }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <div v-if="listafiltrada.length > itemsMobilMostrados" class="text-center py-4 mb-5">
          <v-btn color="primary" outlined @click="mostrarMasMovil">
            <v-icon left>mdi-plus</v-icon>
            Mostrar más ({{ listafiltrada.length - itemsMobilMostrados }} restantes)
          </v-btn>
        </div>

        <div v-if="listafiltrada.length === 0" class="text-center py-8 grey--text">
          <v-icon large color="grey lighten-1">mdi-package-variant</v-icon>
          <div class="mt-2">No hay datos para los filtros seleccionados</div>
        </div>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { all_periodos } from '@/db';
import { getCierresPeriodo, getResumenMovimientosPeriodo } from '@/db_firestore';
import axios from 'axios'
import store from '@/store/index';
import moment from 'moment';

export default {
  name: 'StockXPeriodo',

  data: () => ({
    headers: [
      { text: 'Código', value: 'id', align: 'start', width: 100 },
      { text: 'Producto', value: 'nombre', width: 280 },
      { text: 'Medida', value: 'medida', width: 80 },
      { text: 'Saldo Inicial', value: 'saldo_inicial', align: 'right', width: 110 },
      { text: 'Mov. Mes', value: 'sum_mes', align: 'center', width: 100 },
      { text: 'Saldo Final', value: 'saldo_final', align: 'right', width: 110 },
      { text: '# Movs', value: 'movs_mes', align: 'center', width: 80 },
    ],
    filtros: {
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      producto: null,
      proveedor: null
    },
    busqueda: '',
    cargando: false,
    exportando: false,
    datosCierre: [],
    periodosBD: {},
    periodoAbierto: true,
    periodoNoDisponible: false,
    years: [],
    meses: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    itemsMobilMostrados: 30,
    itemsMobilIncremento: 30,
    snackbar: { show: false, text: '', color: 'success' },
    datosCargados: false,
    filtrosCambiados: false,
  }),

  computed: {
    mesesSelect() {
      return this.meses.map((mes, index) => ({
        text: mes,
        value: index + 1
      }));
    },

    periodoSeleccionado() {
      const mes = String(this.filtros.mes).padStart(2, '0');
      return `${mes}-${this.filtros.anio}`;
    },

    productosParaFiltro() {
      const productos = store.state.productos || [];
      return productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        nombreCompleto: `${p.id} - ${p.nombre}`
      }));
    },

    proveedoresDisponibles() {
      const proveedores = new Set();
      this.datosCierre.forEach(item => {
        if (item.proveedor) {
          proveedores.add(item.proveedor);
        }
      });
      return ['TODOS', ...Array.from(proveedores).sort()];
    },

    listafiltrada() {
      let filtrados = [...this.datosCierre];

      if (this.filtros.producto) {
        filtrados = filtrados.filter(item => String(item.id) === String(this.filtros.producto));
      }

      if (this.filtros.proveedor && this.filtros.proveedor !== 'TODOS') {
        filtrados = filtrados.filter(item => item.proveedor === this.filtros.proveedor);
      }

      if (this.busqueda) {
        const search = this.busqueda.toLowerCase();
        filtrados = filtrados.filter(item =>
          (item.nombre || '').toLowerCase().includes(search) ||
          (item.id || '').toString().includes(search) ||
          (item.proveedor || '').toLowerCase().includes(search)
        );
      }

      return filtrados;
    },

    listaMobilPaginada() {
      return this.listafiltrada.slice(0, this.itemsMobilMostrados);
    },

    hayDatos() {
      return this.listafiltrada.length > 0;
    },

    kpi() {
      return this.listafiltrada.reduce((acc, item) => {
        acc.sumaSaldoInicial += this.toNumber(item.saldo_inicial);
        acc.sumaSaldoFinal += this.toNumber(item.saldo_final);
        acc.sumaMovMes += this.toNumber(item.sum_mes);
        acc.totalMovimientos += this.toNumber(item.movs_mes);
        return acc;
      }, { sumaSaldoInicial: 0, sumaSaldoFinal: 0, sumaMovMes: 0, totalMovimientos: 0 });
    },
  },

  async created() {
    this.generarYears();
  },

  watch: {
    busqueda() { this.resetPaginacionMovil(); },
    'filtros.producto'() { this.resetPaginacionMovil(); },
    'filtros.proveedor'() { this.resetPaginacionMovil(); }
  },

  methods: {
    async getEstadoPeriodo(periodoKey) {
      try {
        const snapshot = await all_periodos().once('value');
        this.periodosBD = snapshot.val() || {};
        return this.periodosBD[periodoKey]?.estado || 'open';
      } catch (error) {
        console.error('Error obteniendo estado del período:', error);
        return 'open';
      }
    },

    generarYears() {
      const currentYear = new Date().getFullYear();
      for (let year = 2022; year <= currentYear; year++) {
        this.years.push(year);
      }
    },

    generarPeriodosAnio() {
      const currentYear = new Date().getFullYear();
      if (this.filtros.anio === currentYear) {
        this.filtros.mes = new Date().getMonth() + 1;
      } else {
        this.filtros.mes = 12;
      }
    },

    async cargarCierrePeriodo() {
      this.cargando = true;
      this.datosCierre = [];
      this.datosCargados = false;
      this.filtrosCambiados = false;
      this.resetPaginacionMovil();

      try {
        await this.waitForProducts();
        const productosStore = store.state.productos || [];

        if (productosStore.length === 0) {
          this.mostrarSnackbar('No hay productos cargados', 'warning');
          return;
        }

        const anioActual = moment().year();
        const mesActual = moment().month() + 1;

        if (this.filtros.anio > anioActual ||
          (this.filtros.anio === anioActual && this.filtros.mes > mesActual)) {
          this.periodoNoDisponible = true;
          this.periodoAbierto = true;
          this.mostrarSnackbar('Este período aún no está disponible', 'warning');
          return;
        }

        this.periodoNoDisponible = false;

        const periodoKey = `${this.filtros.anio}-${String(this.filtros.mes).padStart(2, '0')}`;
        const estadoPeriodo = await this.getEstadoPeriodo(periodoKey);
        const estaCerrado = estadoPeriodo === 'close';
        this.periodoAbierto = !estaCerrado;

        if (estaCerrado) {
          await this.cargarDatosPeriodoCerrado(productosStore);
        } else {
          await this.cargarDatosPeriodoAbierto(productosStore);
        }

        this.datosCargados = true;

      } catch (error) {
        console.error('Error cargando cierre del período:', error);
        this.mostrarSnackbar('Error al cargar datos: ' + (error.message || error), 'error');
        this.datosCierre = [];
      } finally {
        this.cargando = false;
      }
    },

    async cargarDatosPeriodoCerrado(productosStore) {
      const cierres = await getCierresPeriodo(this.periodoSeleccionado);

      this.datosCierre = cierres.map(cierre => {
        const producto = productosStore.find(p => String(p.id) === String(cierre.id));
        return {
          id: cierre.id,
          nombre: producto?.nombre || 'Sin nombre',
          proveedor: producto?.proveedor || '',
          medida: producto?.medida || '',
          factor: producto?.factor || 1,
          saldo_inicial: Math.round(this.toNumber(cierre.saldo_inicial)),
          saldo_final: Math.round(this.toNumber(cierre.saldo_final)),
          sum_mes: Math.round(this.toNumber(cierre.sum_mes)),
          movs_mes: Math.round(this.toNumber(cierre.movs_mes))
        };
      });

      if (this.datosCierre.length > 0) {
        this.mostrarSnackbar(`Cierre cargado: ${this.datosCierre.length} productos`, 'success');
      } else {
        this.mostrarSnackbar(`No hay datos de cierre para ${this.meses[this.filtros.mes - 1]} ${this.filtros.anio}`, 'info');
      }
    },

    async cargarDatosPeriodoAbierto(productosStore) {
      try {
        const response = await axios.post(
          'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
          {
            bd: store.state.baseDatos.bd,
            data: { periodo: this.periodoSeleccionado },
            metodo: 'reporte_stock_actual'
          },
          { timeout: 30000 }
        );

        if (!response.data || !response.data.data) {
          throw new Error('Estructura de respuesta inválida');
        }

        const result = response.data.data;

        if (!result.ok) {
          throw new Error(result.error || 'Error del servidor');
        }

        if (!result.items || !Array.isArray(result.items)) {
          throw new Error('No se encontraron items en la respuesta');
        }

        this.datosCierre = result.items.map(item => {
          const producto = productosStore.find(p => String(p.id) === String(item.pid));
          return {
            id: item.pid,
            nombre: producto?.nombre || 'Sin nombre',
            proveedor: producto?.proveedor || '',
            medida: producto?.medida || '',
            factor: producto?.factor || 1,
            saldo_inicial: Math.round(item.saldo_inicial || 0),
            saldo_final: Math.round(item.saldo_final || 0),
            sum_mes: Math.round(item.sum_mes || 0),
            movs_mes: Math.round(item.movs_mes || 0)
          };
        });

        this.mostrarSnackbar(`Período abierto: ${this.datosCierre.length} productos`, 'info');

      } catch (error) {
        this.mostrarSnackbar(`Error: ${error.message}`, 'error');
        this.datosCierre = [];
      }
    },

    waitForProducts() {
      return new Promise(resolve => {
        if (store.state.productos?.length > 0) return resolve();

        const unwatch = store.watch(
          state => state.productos,
          productos => {
            if (productos?.length > 0) {
              unwatch();
              resolve();
            }
          },
          { immediate: true }
        );

        setTimeout(() => { unwatch(); resolve(); }, 10000);
      });
    },

    getPeriodoAnterior(anio, mes) {
      return mes === 1 ? `12-${anio - 1}` : `${String(mes - 1).padStart(2, '0')}-${anio}`;
    },

    toNumber(v) {
      if (v === null || v === undefined) return 0;
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : 0;
    },

    formatNumber(v) {
      return this.toNumber(v).toLocaleString('es-PE');
    },

    formatStock(unidades, factor) {
      const s = this.toNumber(unidades);
      const f = this.toNumber(factor);
      if (f <= 1) return s.toLocaleString('es-PE');
      return `${Math.floor(s / f)}/${s % f}`;
    },

    mostrarMasMovil() {
      this.itemsMobilMostrados += this.itemsMobilIncremento;
    },

    resetPaginacionMovil() {
      this.itemsMobilMostrados = 30;
    },
    onCambioFiltro() {
      this.filtrosCambiados = true;
      if (this.datosCargados) {
        this.mostrarSnackbar('Los filtros han cambiado. Haga clic en "Actualizar" para cargar nuevos datos.', 'info');
      }
    },

    filtroProducto(item, queryText) {
      const searchText = queryText.toLowerCase();
      return (
        item.nombre.toLowerCase().includes(searchText) ||
        item.id.toString().includes(searchText)
      );
    },

    mostrarSnackbar(text, color = 'success') {
      this.snackbar.text = text;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    nowString() {
      const d = new Date();
      const pad = s => String(s).padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    },

    filasExport() {
      return this.listafiltrada.map(item => ({
        Codigo: item.id,
        Nombre: item.nombre,
        Proveedor: item.proveedor || '-',
        Medida: item.medida || '-',
        SaldoInicial: this.formatStock(item.saldo_inicial, item.factor),
        MovMes: item.sum_mes,
        SaldoFinal: this.formatStock(item.saldo_final, item.factor),
        NumMovimientos: item.movs_mes
      }));
    },

    async exportarExcel() {
      if (!this.hayDatos) {
        this.mostrarSnackbar('No hay datos para exportar', 'warning');
        return;
      }

      this.exportando = true;

      try {
        const mod = await import('xlsx');
        const XLSX = mod.default || mod;
        const data = this.filasExport();

        const fechaExport = new Date().toLocaleString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const encabezadoInfo = [
          ['REPORTE DE STOCK POR PERÍODO - CIERRE DE KARDEX'],
          [`Fecha de exportación: ${fechaExport}`],
          [`Periodo: ${this.meses[this.filtros.mes - 1]} ${this.filtros.anio}`],
          [`Productos: ${data.length} | Saldo Inicial: ${this.formatNumber(this.kpi.sumaSaldoInicial)} | Mov. Mes: ${this.kpi.sumaMovMes >= 0 ? '+' : ''}${this.formatNumber(this.kpi.sumaMovMes)} | Saldo Final: ${this.formatNumber(this.kpi.sumaSaldoFinal)}`],
          []
        ];

        const ws = XLSX.utils.aoa_to_sheet(encabezadoInfo);
        XLSX.utils.sheet_add_json(ws, data, { origin: 'A6' });

        ws['!cols'] = [
          { wch: 12 },
          { wch: 40 },
          { wch: 25 },
          { wch: 10 },
          { wch: 12 },
          { wch: 10 },
          { wch: 12 },
          { wch: 12 }
        ];

        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
          { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }
        ];

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, ws, 'Stock Periodo');

        const nombre = `Stock_${this.meses[this.filtros.mes - 1]}_${this.filtros.anio}_${this.nowString()}.xlsx`;
        XLSX.writeFile(libro, nombre);

        this.mostrarSnackbar('Excel exportado correctamente', 'success');
      } catch (e) {
        console.error('Error exportando a Excel', e);
        this.mostrarSnackbar('Error al exportar Excel', 'error');
      } finally {
        this.exportando = false;
      }
    },

    async exportarPDF() {
      if (!this.hayDatos) {
        this.mostrarSnackbar('No hay datos para exportar', 'warning');
        return;
      }

      try {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
        doc.setFontSize(14);
        doc.text(`Reporte de Stock por Periodo - ${this.meses[this.filtros.mes - 1]} ${this.filtros.anio}`, 40, 32);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString('es-PE')}`, 40, 48);
        const kpiText = `Productos: ${this.listafiltrada.length} | Saldo Inicial: ${this.formatNumber(this.kpi.sumaSaldoInicial)} | Mov. Mes: ${this.kpi.sumaMovMes >= 0 ? '+' : ''}${this.formatNumber(this.kpi.sumaMovMes)} | Saldo Final: ${this.formatNumber(this.kpi.sumaSaldoFinal)}`;
        doc.text(kpiText, 40, 64);
        const rows = this.filasExport().map(r => ([
          r.Codigo,
          r.Nombre,
          r.Proveedor,
          r.Medida,
          r.SaldoInicial,
          typeof r.MovMes === 'number' ? (r.MovMes >= 0 ? `+${this.formatNumber(r.MovMes)}` : this.formatNumber(r.MovMes)) : r.MovMes,
          r.SaldoFinal,
          r.NumMovimientos
        ]));

        const head = [['Código', 'Producto', 'Proveedor', 'Medida', 'Saldo Inicial', 'Mov. Mes', 'Saldo Final', '# Movs']];

        doc.autoTable({
          head,
          body: rows,
          startY: 80,
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [55, 71, 79] },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 200 },
            2: { cellWidth: 120 },
            3: { cellWidth: 50 },
            4: { halign: 'right', cellWidth: 70 },
            5: { halign: 'center', cellWidth: 60 },
            6: { halign: 'right', cellWidth: 70 },
            7: { halign: 'center', cellWidth: 50 },
          },
          didDrawPage: () => {
            const footerText = `Página ${doc.internal.getNumberOfPages()} - ${this.meses[this.filtros.mes - 1]} ${this.filtros.anio}`;
            doc.setFontSize(8);
            doc.text(footerText, doc.internal.pageSize.getWidth() - 120, doc.internal.pageSize.getHeight() - 10);
          }
        });

        const nombre = `Stock_${this.meses[this.filtros.mes - 1]}_${this.filtros.anio}_${this.nowString()}.pdf`;
        doc.save(nombre);

        this.mostrarSnackbar('PDF exportado correctamente', 'success');
      } catch (e) {
        console.error('Error exportando a PDF', e);
        this.mostrarSnackbar('Error al exportar PDF', 'error');
      }
    },
  },
};
</script>

<style scoped>
.v-data-table {
  font-size: 13px;
}

.v-expansion-panel-content {
  transition: all 0.3s ease;
}

.v-chip.v-size--x-small {
  font-size: 10px;
}
</style>
