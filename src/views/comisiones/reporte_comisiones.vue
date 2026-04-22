<template>
    <div class="pa-2 pa-md-4">
        <v-card class="elevation-4 rounded-lg">
            <v-card-title class="pa-4 blue-grey lighten-5 d-block">
                <div class="d-flex flex-wrap align-center mb-3">
                    <div class="d-flex align-center mb-2 mb-sm-0">
                        <v-icon :large="$vuetify.breakpoint.mdAndUp" left
                            color="blue-grey darken-3">mdi-calculator</v-icon>
                        <span
                            :class="{ 'text-h5': $vuetify.breakpoint.mdAndUp, 'text-h6': $vuetify.breakpoint.smAndDown }"
                            class="font-weight-bold blue-grey--text text--darken-3">Reporte de Comisiones</span>
                    </div>
                    <v-spacer></v-spacer>
                    <div class="d-flex flex-wrap mt-2 mt-sm-0">
                        <v-btn color="success" x-small @click="exportarExcel"
                            class="ml-0 ml-sm-2 mr-2 mr-sm-0 font-weight-medium" :disabled="!datos">
                            <v-icon left small>mdi-file-excel</v-icon>
                            Exportar Excel
                        </v-btn>
                        <v-btn color="info" x-small @click="verObjetivoComisiones" class="ml-2 font-weight-medium"
                            :disabled="!filtros.periodo">
                            <v-icon left small>mdi-target</v-icon>
                            Ver Objetivo
                        </v-btn>
                        <v-btn v-if="esAdmin" color="primary" x-small @click="abrirListaObjetivos"
                            class="ml-2 font-weight-medium">
                            <v-icon left small>mdi-clipboard-list</v-icon>
                            Lista Objetivos
                        </v-btn>
                    </div>
                </div>
                <v-row dense>
                    <v-col cols="12" sm="4">
                        <v-select dense v-model="filtros.periodo" :items="periodos" label="Periodo" outlined
                            hide-details></v-select>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-autocomplete dense v-model="filtros.vendedor" :items="vendedoresItems" label="Vendedor"
                            outlined :clearable="esAdmin" item-text="displayText" item-value="codigo" hide-details
                            :disabled="!esAdmin" :readonly="!esAdmin" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-btn small block color="primary" @click="consultar" :loading="cargando" class="font-weight-bold">
                            <v-icon left>mdi-magnify</v-icon>
                            Consultar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text v-if="cargando" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <div class="caption mt-3">Consultando comisiones...</div>
            </v-card-text>
            <v-card-text v-else-if="datos" class="pa-4">
                <v-card class="mb-4" outlined>
                    <v-card-title class="py-2 subtitle-1 font-weight-bold blue-grey lighten-5">
                        <v-icon left small>mdi-chart-bar</v-icon>
                        Métricas Generales
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <v-row>
                            <v-col cols="6" md="1" lg="3" v-for="(metric, key) in metricasDisplay" :key="key">
                                <v-card outlined class="pa-2 text-center fill-height d-flex flex-column justify-center"
                                    elevation="0">
                                    <div class="text-caption grey--text">
                                        {{ metric.label }}
                                    </div>

                                    <template v-if="key === 'ventas'">
                                        <div class="text-subtitle-2 font-weight-bold primary--text mt-1">
                                            Cont.: {{ metric.contado }}
                                        </div>
                                        <div class="text-subtitle-2 font-weight-bold info--text">
                                            Créd.: {{ metric.credito }}
                                        </div>
                                    </template>

                                    <template v-else>
                                        <div class="text-h6 font-weight-bold primary--text">
                                            {{ metric.value }}
                                        </div>
                                    </template>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
                <!-- Indicadores de Gestión -->
              <v-card class="mb-6 rounded-xl elevation-3 overflow-hidden border-light">


  <v-divider></v-divider>

  <v-card-text class="pa-0 d-none d-md-block">
    <v-simple-table class="table-kpi">
      <template v-slot:default>
        <thead>
          <tr class="grey lighten-4">
            <th class="text-left py-4 pl-6 text-uppercase font-weight-bold grey--text text--darken-2" style="font-size: 0.7rem;">Indicador Operativo</th>
            <th class="text-center text-uppercase font-weight-bold grey--text text--darken-2" style="font-size: 0.7rem;">Meta</th>
            <th class="text-center text-uppercase font-weight-bold grey--text text--darken-2" style="font-size: 0.7rem;">Real</th>
            <th class="text-left text-uppercase font-weight-bold grey--text text--darken-2" width="280" style="font-size: 0.7rem;">Progreso / Cumplimiento</th>
            <th class="text-right pr-6 text-uppercase font-weight-bold grey--text text--darken-2" style="font-size: 0.7rem;">Fórmula</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in datos.array_indicadores" :key="item.nombre_indicador" class="row-hover">
            <td class="pl-6 py-4">
              <div class="font-weight-black blue-grey--text text--darken-3">{{ item.nombre_indicador }}</div>
            </td>
            <td class="text-center">
              <v-chip small label outlined color="grey darken-1" class="font-weight-medium">{{ item.objetivo }}</v-chip>
            </td>
            <td class="text-center">
              <span class="text-h6 font-weight-black primary--text">{{ item.real }}</span>
            </td>
            <td>
              <div class="d-flex align-center">
                <div class="flex-grow-1 mr-3">
                  <v-progress-linear
                    :value="item.porcentaje > 100 ? 100 : item.porcentaje"
                    :color="getColorPorcentaje(item.porcentaje)"
                    height="10"
                    rounded
                    class="elevation-1"
                  >
                  </v-progress-linear>
                </div>
                <div class="text-right" style="min-width: 50px">
                  <span class="font-weight-black" :class="`${getColorPorcentaje(item.porcentaje)}--text`">
                    {{ item.porcentaje }}%
                  </span>
                </div>
              </div>
            </td>
            <td class="text-right pr-6">
              <span class="text-caption font-italic grey--text text--darken-1">{{ item.formula }}</span>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-card-text>

  <v-card-text class="pa-3 d-block d-md-none grey lighten-4">
    <v-row dense>
      <v-col cols="12" v-for="item in datos.array_indicadores" :key="item.nombre_indicador">
        <v-card flat class="rounded-lg mb-2 pa-4 elevation-1 border-all">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-overline primary--text font-weight-bold">{{ item.formula }}</span>
            <v-chip :color="getColorPorcentaje(item.porcentaje)" dark x-small class="font-weight-black">
              {{ item.porcentaje }}%
            </v-chip>
          </div>
          
          <div class="text-subtitle-1 font-weight-black mb-3">{{ item.nombre_indicador }}</div>

          <v-row dense class="mb-2 text-center">
            <v-col cols="6" class="border-right">
              <div class="text-caption grey--text">OBJETIVO</div>
              <div class="text-subtitle-2 font-weight-bold">{{ item.objetivo }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption grey--text">REAL</div>
              <div class="text-subtitle-2 font-weight-bold primary--text">{{ item.real }}</div>
            </v-col>
          </v-row>

          <v-progress-linear
            :value="item.porcentaje > 100 ? 100 : item.porcentaje"
            :color="getColorPorcentaje(item.porcentaje)"
            height="8"
            rounded
          ></v-progress-linear>
        </v-card>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>
                <v-row class="mb-4">
                    <v-col cols="12" md="4">
                        <v-card outlined>
                            <v-card-text class="text-center">
                                <div class="text-subtitle-2 grey--text">COMISION Cobertura</div>
                                <div class="text-h5 font-weight-bold primary--text">{{ monedaSimbolo }} {{
                                    formatNumber(datos.comisiones.cobertura) }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-card outlined>
                            <v-card-text class="text-center">
                                <div class="text-subtitle-2 grey--text">COMISION Plan Soles</div>
                                <div class="text-h5 font-weight-bold primary--text">{{ monedaSimbolo }} {{
                                    formatNumber(datos.comisiones.plan_soles) }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-card outlined color="success lighten-5">
                            <v-card-text class="text-center">
                                <div class="text-subtitle-2 grey--text">Total Comisión</div>
                                <div class="text-h5 font-weight-bold success--text">{{ monedaSimbolo }} {{
                                    formatNumber(datos.comisiones.total_general)
                                }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <v-card outlined>
                    <v-card-title class="py-2 subtitle-1 font-weight-bold blue-grey lighten-5">
                        <v-icon left small>mdi-store</v-icon>
                        Detalle por Proveedor
                    </v-card-title>
                    <div class="d-block d-md-none">
                        <v-card-text v-for="prov in datos.proveedores" :key="prov.proveedor" class="pa-2">
                            <v-card outlined class="pa-3">
                                <div class="font-weight-bold mb-2 primary--text">{{ prov.proveedor }}</div>
                                <v-row dense>
                                    <v-col cols="6" class="text-caption grey--text">Comisión Base:</v-col>
                                    <v-col cols="6" class="text-right text-caption">{{ monedaSimbolo }} {{
                                        formatNumber(prov.monto_comision) }}</v-col>
                                    <v-col cols="6" class="text-caption grey--text">Plan Soles:</v-col>
                                    <v-col cols="6" class="text-right text-caption">{{ monedaSimbolo }} {{
                                        formatNumber(prov.plan_soles)
                                        }}</v-col>
                                    <v-col cols="6" class="text-caption grey--text">Obj. Mínimo:</v-col>
                                    <v-col cols="6" class="text-right text-caption">{{ monedaSimbolo }} {{
                                        formatNumber(prov.objetivo_minimo) }}</v-col>
                                    <v-col cols="6" class="text-caption grey--text">Venta Real:</v-col>
                                    <v-col cols="6" class="text-right text-caption">{{ monedaSimbolo }} {{
                                        formatNumber(prov.monto_vendido) }}</v-col>
                                    <v-col cols="6" class="text-caption grey--text">% Cumpl.:</v-col>
                                    <v-col cols="6" class="text-right">
                                        <v-chip :color="getColorPorcentaje(parseFloat(prov.pct_cumplimiento))" x-small>
                                            {{ prov.pct_cumplimiento }}%
                                        </v-chip>
                                    </v-col>
                                    <v-col cols="6" class="text-caption font-weight-bold grey--text">Comisión:</v-col>
                                    <v-col cols="6" class="text-right font-weight-bold primary--text">{{ monedaSimbolo
                                        }} {{
                                            formatNumber(prov.comision)
                                        }}</v-col>
                                </v-row>
                            </v-card>
                        </v-card-text>
                        <v-card-text class="pa-2">
                            <v-card outlined class="pa-3 blue-grey lighten-5">
                                <v-row dense>
                                    <v-col cols="6" class="font-weight-bold">TOTALES:</v-col>
                                    <v-col cols="6" class="text-right font-weight-bold success--text">{{ monedaSimbolo
                                        }} {{
                                            formatNumber(datos.suma_comisiones_proveedores) }}</v-col>
                                </v-row>
                            </v-card>
                        </v-card-text>
                    </div>
                    <v-card-text class="pa-0 d-none d-md-block">
                        <v-simple-table dense>
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th class="text-left">Proveedor</th>
                                        <th class="text-right">Comisión Base</th>
                                        <th class="text-right">Plan Soles</th>
                                        <th class="text-right">Obj. Mínimo</th>
                                        <th class="text-right">Venta Real</th>
                                        <th class="text-right">% Cumpl.</th>
                                        <th class="text-right">Comisión</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="prov in datos.proveedores" :key="prov.proveedor">
                                        <td>{{ prov.proveedor }}</td>
                                        <td class="text-right">{{ monedaSimbolo }} {{ formatNumber(prov.monto_comision)
                                            }}</td>
                                        <td class="text-right">{{ monedaSimbolo }} {{ formatNumber(prov.plan_soles) }}
                                        </td>
                                        <td class="text-right">{{ monedaSimbolo }} {{ formatNumber(prov.objetivo_minimo)
                                            }}</td>
                                        <td class="text-right">{{ monedaSimbolo }} {{ formatNumber(prov.monto_vendido)
                                            }}</td>
                                        <td class="text-right">
                                            <v-chip outlined
                                                :color="getColorPorcentaje(parseFloat(prov.pct_cumplimiento))" small>
                                                {{ prov.pct_cumplimiento }}%
                                            </v-chip>
                                        </td>
                                        <td class="text-right font-weight-bold">{{ monedaSimbolo }} {{
                                            formatNumber(prov.comision) }}
                                        </td>
                                    </tr>
                                    <tr class="font-weight-bold blue-grey lighten-5">
                                        <td colspan="6" class="text-right">TOTALES:</td>
                                        <td class="text-right">{{ monedaSimbolo }} {{
                                            formatNumber(datos.suma_comisiones_proveedores) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </v-card-text>
                </v-card>
                <!-- Gráficos - Solo visible en desktop -->
                <template v-if="$vuetify.breakpoint.mdAndUp">
                    <v-row class="mb-4 mt-2">
                        <v-col cols="12" md="4">
                            <v-card outlined>
                                <v-card-title class="py-2 subtitle-1 font-weight-bold blue-grey lighten-5">
                                    <v-icon left small>mdi-chart-pie</v-icon>
                                    Distribución por Proveedor
                                </v-card-title>
                                <v-card-text>
                                    <canvas ref="chartProveedores"></canvas>
                                </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card outlined>
                                <v-card-title class="py-2 subtitle-1 font-weight-bold blue-grey lighten-5">
                                    <v-icon left small>mdi-account-star</v-icon>
                                    Top 5 Clientes
                                </v-card-title>
                                <v-card-text class="pa-2">
                                    <v-list dense class="pa-0" v-if="datos && datos.top_5_clientes">
                                        <v-list-item v-for="(cliente, idx) in datos.top_5_clientes" :key="idx"
                                            class="px-1">
                                            <v-list-item-avatar size="28" :color="getAvatarColor(idx)" class="my-1">
                                                <span class="white--text text-caption font-weight-bold">{{ idx + 1
                                                }}</span>
                                            </v-list-item-avatar>
                                            <v-list-item-content class="py-1">
                                                <v-list-item-title
                                                    class="text-caption font-weight-medium text-truncate">
                                                    {{ cliente.cliente_nombre_formato }}
                                                </v-list-item-title>
                                                <v-list-item-subtitle class="text-caption">
                                                    {{ cliente.num_compras }} compras
                                                </v-list-item-subtitle>
                                            </v-list-item-content>
                                            <v-list-item-action class="my-0">
                                                <v-chip small color="success" text-color="white"
                                                    class="font-weight-bold">
                                                    {{ monedaSimbolo }} {{ formatNumber(cliente.monto_total) }}
                                                </v-chip>
                                            </v-list-item-action>
                                        </v-list-item>
                                    </v-list>
                                </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card outlined>
                                <v-card-title class="py-2 subtitle-1 font-weight-bold blue-grey lighten-5">
                                    <v-icon left small>mdi-chart-bar</v-icon>
                                    Top 10 Productos
                                </v-card-title>
                                <v-card-text>
                                    <canvas ref="chartProductos"></canvas>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>

            </v-card-text>
            <v-card-text v-else class="text-center py-10 grey--text">
                <v-icon size="64" color="grey lighten-2">mdi-calculator</v-icon>
                <div class="text-h6 mt-4">Seleccione período y vendedor para consultar</div>
            </v-card-text>
        </v-card>
        <dialogo_comisiones v-model="dialogObjetivo" :periodo-edit="periodoObjetivo" :vendedor-edit="filtros.vendedor"
            :datos-edit="datosObjetivo" :vendedores-existentes="vendedoresItems" modo="ver" :proveedores-existentes="[]"
            :solo-lectura="true" @cerrar="dialogObjetivo = false" />
        <!-- Diálogo Lista de Objetivos (Solo Admin) -->
        <comisiones_lista v-if="esAdmin" v-model="dialogListaObjetivos" @cerrar="dialogListaObjetivos = false" />
    </div>
</template>

<script>
import store from '@/store/index'
import { busca_tabla } from "@/db";
import axios from "axios";
import * as XLSX from "xlsx";
import Chart from "chart.js/auto";
import dialogo_comisiones from './dialogo_comisiones.vue'
import comisiones_lista from './comisiones_lista.vue'
import moment from "moment";

export default {
    name: "ReporteComisiones",
    components: {
        dialogo_comisiones,
        comisiones_lista
    },
    data() {
        return {
            cargando: false,
            filtros: {
                periodo: moment().format('YYYY-MM'),
                vendedor: ''
            },
            periodos: [],
            vendedores: [],
            datos: null,
            charts: {
                proveedores: null,
                clientes: null,
                productos: null
            },
            dialogObjetivo: false,
            datosObjetivo: null,
            periodoObjetivo: null,
            dialogListaObjetivos: false
        };
    },
    computed: {
        apiBaseUrl() {
           const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'http://127.0.0.1:5001/sis-distribucion/southamerica-east1/api_distribucion';
            }
            return 'https://api-distribucion-6sfc6tum4a-rj.a.run.app';
        },
        metricasDisplay() {
            if (!this.datos) return {};
            const m = this.datos.metricas_generales;
            return {
                clientes: { label: "Clientes Atendidos", value: m.clientes_atendidos },
                ventas: {
                    label: "Ventas",
                    contado: `${this.monedaSimbolo} ${this.formatNumber(m.venta_contado)}`,
                    credito: `${this.monedaSimbolo} ${this.formatNumber(m.venta_credito)}`
                },
                itemsDist: { label: "Items Distintos", value: m.items_distintos },
                pedidos: { label: "N° Pedidos", value: m.nro_pedidos },
            };
        },
        totalVentasProveedores() {
            return this.datos?.proveedores?.reduce((sum, p) => sum + p.nro_ventas, 0) || 0;
        },
        totalItemsProveedores() {
            return this.datos?.proveedores?.reduce((sum, p) => sum + p.nro_items_vendidos, 0) || 0;
        },
        totalItemsDistintosProveedores() {
            return this.datos?.proveedores?.reduce((sum, p) => sum + p.nro_items_distintos, 0) || 0;
        },
        esAdmin() {
            return store.state.permisos?.es_admin === true
        },
        vendedoresItems() {
            if (!this.esAdmin) {
                const codigo =
                    this.$store.state.sedeActual?.codigo ||
                    this.$store.state.permisos?.codigo_vendedor ||
                    this.$store.state.usuario?.codigo_vendedor;

                const nombre =
                    this.$store.state.sedeActual?.nombre ||
                    this.$store.state.permisos?.nombre_vendedor ||
                    this.$store.state.usuario?.nombre_vendedor ||
                    'Mi Vendedor';

                if (codigo) {
                    return [{
                        codigo,
                        nombre,
                        tipo: 'vendedor',
                        displayText: `${codigo} - ${nombre}`
                    }];
                }
            }

            return (this.vendedores || []).filter(v => v && v.codigo);
        },
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/';
        },
    },
    created() {
        this.generarPeriodos();
        this.cargarVendedores();
        this.setVendedorActual();
    },
    methods: {
        generarPeriodos() {
            for (let i = 0; i < 12; i++) {
                const fecha = moment().subtract(i, 'months');
                this.periodos.push(fecha.format('YYYY-MM'));
            }
        },
        setVendedorActual() {
            if (!this.esAdmin) {
                const codigo =
                    this.$store.state.sedeActual?.codigo ||
                    this.$store.state.permisos?.codigo_vendedor ||
                    this.$store.state.usuario?.codigo_vendedor;

                if (codigo) {
                    this.filtros.vendedor = codigo;
                }
            }
        },
        getAvatarColor(index) {
            const colors = ['#ffb1b1', '#b1d4f0', '#fff0b1', '#b1e6e6', '#d9b1ff'];
            return colors[index] || '#c7b1a3';
        },
        getClienteNombre(nombreFormato) {
            const partes = nombreFormato.split(' - ');
            return partes.length > 1 ? partes[1] : nombreFormato;
        },
        async cargarVendedores() {
            try {
                if (this.$store.state.array_sedes && this.$store.state.array_sedes.length > 0) {
                    this.vendedores = this.$store.state.array_sedes
                        .filter(v => v && v.activo !== false && v.codigo)
                        .map(v => ({
                            ...v,
                            displayText: `${v.codigo} - ${v.nombre}`
                        }));
                } else {
                    const snapshot = await busca_tabla("vendedores").once("value");
                    const vendedores = [];

                    snapshot.forEach((item) => {
                        const data = item.val();
                        if (data && data.activo !== false && data.codigo) {
                            vendedores.push({
                                ...data,
                                displayText: `${data.codigo} - ${data.nombre}`
                            });
                        }
                    });

                    this.vendedores = vendedores;
                }

                if (!this.filtros.vendedor && this.vendedoresItems.length) {
                    this.setVendedorActual();
                }

                console.log('PADRE vendedores cargados', this.vendedores);
                console.log('PADRE vendedoresItems', this.vendedoresItems);
            } catch (error) {
                console.error("Error cargando vendedores:", error);
            }
        },
        async consultar() {
            if (!this.filtros.periodo || !this.filtros.vendedor) {
                this.$store.commit("dialogosnackbar", {
                    mensaje: "Seleccione período y vendedor",
                    color: "warning"
                });
                return;
            }
            this.cargando = true;
            try {
                const response = await axios.post(this.apiBaseUrl, {
                    bd: this.$store.state.baseDatos?.bd,
                    metodo: "reporte_comisiones",
                    data: {
                        ruc: this.$store.state.baseDatos?.ruc_asociado || this.$store.state.baseDatos?.ruc,
                        periodo: this.filtros.periodo,
                        cod_vendedor: this.filtros.vendedor
                    }
                });
                console.log(response.data)
                if (response.data.message === "OK" && response.data.data) {
                    this.datos = response.data.data;

                    this.$nextTick(() => {
                        this.dibujarGraficos();
                    });
                    this.$store.commit("dialogosnackbar", {
                        mensaje: "Comisiones calculadas correctamente",
                        color: "success"
                    });
                } else {
                    this.$store.commit("dialogosnackbar", {
                        mensaje: response.data.error || "Error en la consulta",
                        color: "error"
                    });
                }
            } catch (error) {
                this.$store.commit("dialogosnackbar", {
                    mensaje: error.response?.data?.error || "Error al consultar comisiones",
                    color: "error"
                });
            } finally {
                this.cargando = false;
            }
        },
        dibujarGraficos() {
            if (this.charts.proveedores) this.charts.proveedores.destroy();
            if (this.charts.clientes) this.charts.clientes.destroy();
            if (this.charts.productos) this.charts.productos.destroy();
            if (this.datos.distribucion_proveedores && this.$refs.chartProveedores) {
                const ctx = this.$refs.chartProveedores.getContext('2d');
                const labels = this.datos.distribucion_proveedores.map(p => p.proveedor);
                const data = this.datos.distribucion_proveedores.map(p => p.porcentaje);
                this.charts.proveedores = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: this.generarColoresSuaves(data.length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const monto = this.datos.distribucion_proveedores[context.dataIndex].monto;
                                        return `${label}: ${value.toFixed(2)}% (${this.monedaSimbolo} ${this.formatNumber(monto)})`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            if (this.datos.top_5_clientes && this.$refs.chartClientes) {
                const ctx = this.$refs.chartClientes.getContext('2d');
                const labels = this.datos.top_5_clientes.map(c => {
                    const nombre = c.cliente_nombre_formato.split(' - ')[1] || c.cliente_nombre_formato;
                    return nombre.length > 20 ? nombre.substring(0, 18) + '...' : nombre;
                });
                const data = this.datos.top_5_clientes.map(c => c.monto_total);
                this.charts.clientes = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Monto Total (${this.monedaSimbolo})`,
                            data: data,
                            backgroundColor: '#b1d4f0',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const cliente = this.datos.top_5_clientes[context.dataIndex];
                                        return [
                                            `Cliente: ${cliente.cliente_nombre_formato}`,
                                            `Monto: ${this.monedaSimbolo} ${this.formatNumber(cliente.monto_total)}`,
                                            `Compras: ${cliente.num_compras}`
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => `${this.monedaSimbolo} ` + this.formatNumber(value)
                                }
                            }
                        }
                    }
                });
            }
            if (this.datos.top_10_productos && this.$refs.chartProductos) {
                const ctx = this.$refs.chartProductos.getContext('2d');
                const labels = this.datos.top_10_productos.map(p => {
                    const nombre = p.producto_id;
                    return nombre.length > 20 ? nombre.substring(0, 18) + '...' : nombre;
                });
                const data = this.datos.top_10_productos.map(p => p.monto_total);
                this.charts.productos = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Monto Total (${this.monedaSimbolo})`,
                            data: data,
                            backgroundColor: [
                                '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#ff8a65',
                                '#4db6ac', '#f06292', '#7986cb', '#ffd54f', '#a1887f'
                            ],
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const prod = this.datos.top_10_productos[context.dataIndex];
                                        return [
                                            `Producto: ${prod.producto_nombre_formato}`,
                                            `Monto: ${this.monedaSimbolo} ${this.formatNumber(prod.monto_total)}`,
                                            `Cantidad: ${prod.cantidad_total} unidades`,
                                            `Veces vendido: ${prod.veces_vendido}`
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => `${this.monedaSimbolo} ` + this.formatNumber(value)
                                }
                            }
                        }
                    }
                });
            }
        },
        generarColoresSuaves(cantidad) {
            const colores = [
                '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#ff8a65',
                '#4db6ac', '#f06292', '#7986cb', '#ffd54f', '#a1887f',
                '#4fc3f7', '#aed581', '#e57373', '#90a4ae', '#9575cd'
            ];
            return colores.slice(0, cantidad);
        },
        getColorPorcentaje(porcentaje) {
            if (porcentaje >= 100) return 'success';
            if (porcentaje >= 80) return 'info';
            if (porcentaje >= 60) return 'warning';
            return 'error';
        },
        formatNumber(valor) {
            if (valor === undefined || valor === null) return '0.00';
            const num = typeof valor === 'string' ? parseFloat(valor) : valor;
            return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        },
        verObjetivoComisiones() {
            if (!this.filtros.periodo || !this.filtros.vendedor) {
                this.$store.commit("dialogosnackbar", {
                    mensaje: "Seleccione período y vendedor",
                    color: "warning"
                });
                return;
            }

            this.periodoObjetivo = this.filtros.periodo;
            this.datosObjetivo = null;
            this.dialogObjetivo = true;
        },
        abrirListaObjetivos() {
            this.dialogListaObjetivos = true;
        },
        exportarExcel() {
            if (!this.datos) return;
            const wb = XLSX.utils.book_new();
            const indicadores = this.datos.array_indicadores.map(item => ({
                Indicador: item.nombre_indicador,
                Objetivo: item.objetivo,
                Real: item.real,
                Porcentaje: item.porcentaje + '%',
                Formula: item.formula
            }));
            const wsIndicadores = XLSX.utils.json_to_sheet(indicadores);
            XLSX.utils.book_append_sheet(wb, wsIndicadores, 'Indicadores');
            const proveedores = this.datos.proveedores.map(p => ({
                Proveedor: p.proveedor,
                Comision_Base: p.monto_comision,
                Plan_Soles: p.plan_soles,
                Objetivo_Minimo: p.objetivo_minimo,
                Venta_Real: p.monto_vendido,
                Porcentaje_Cumplimiento: p.pct_cumplimiento,
                Comision: p.comision,
                Nro_Ventas: p.nro_ventas,
                Nro_Items: p.nro_items_vendidos,
                Nro_Items_Distintos: p.nro_items_distintos
            }));
            const wsProveedores = XLSX.utils.json_to_sheet(proveedores);
            XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');
            if (this.datos.top_5_clientes) {
                const clientes = this.datos.top_5_clientes.map(c => ({
                    Cliente: c.cliente_nombre_formato,
                    Monto_Total: c.monto_total,
                    Numero_Compras: c.num_compras
                }));
                const wsClientes = XLSX.utils.json_to_sheet(clientes);
                XLSX.utils.book_append_sheet(wb, wsClientes, 'Top Clientes');
            }
            if (this.datos.top_10_productos) {
                const productos = this.datos.top_10_productos.map(p => ({
                    Producto: p.producto_nombre_formato,
                    Cantidad: p.cantidad_total,
                    Monto_Total: p.monto_total,
                    Veces_Vendido: p.veces_vendido
                }));
                const wsProductos = XLSX.utils.json_to_sheet(productos);
                XLSX.utils.book_append_sheet(wb, wsProductos, 'Top Productos');
            }
            const resumen = [
                { Concepto: 'Periodo', Valor: this.datos.periodo },
                { Concepto: 'Vendedor', Valor: `${this.datos.vendedor.nombre} (${this.datos.vendedor.codigo})` },
                { Concepto: 'Venta Total', Valor: `${this.monedaSimbolo} ${this.formatNumber(this.datos.metricas_generales.venta_total)}` },
                { Concepto: 'Comision Cobertura', Valor: `${this.monedaSimbolo} ${this.formatNumber(this.datos.comisiones.cobertura)}` },
                { Concepto: 'Comision Plan Soles', Valor: `${this.monedaSimbolo} ${this.formatNumber(this.datos.comisiones.plan_soles)}` },
                { Concepto: 'Total Comision', Valor: `${this.monedaSimbolo} ${this.formatNumber(this.datos.comisiones.total_general)}` }
            ];
            const wsResumen = XLSX.utils.json_to_sheet(resumen);
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
            const nombreArchivo = `Comisiones_${this.datos.periodo}_${this.datos.vendedor.codigo}.xlsx`;
            XLSX.writeFile(wb, nombreArchivo);
        }
    }
};
</script>

<style scoped>
.v-card__title {
    line-height: 1.2;
}

.line-height-1 {
  line-height: 1.2 !important;
}
.border-light {
  border: 1px solid #e0e0e0 !important;
}
.border-all {
  border: 1px solid #eeeeee !important;
}
.border-right {
  border-right: 1px solid #eeeeee !important;
}
.table-kpi thead th {
  height: 50px !important;
}
.row-hover:hover {
  background-color: #fcfdfe !important;
}
/* Estilo premium para la barra de progreso */
.v-progress-linear {
  background-color: rgba(0, 0, 0, 0.05) !important;
}
</style>
