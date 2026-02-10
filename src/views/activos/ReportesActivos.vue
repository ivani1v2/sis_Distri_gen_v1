<template>
  <div class="pa-2 pa-sm-3">
    <v-row dense class="mb-2 mb-sm-3 align-center">
      <v-col cols="12" sm="6">
        <h2 class="text-h6 text-sm-h6 font-weight-bold primary--text">
          Reportes de Activos
        </h2>
      </v-col>
      <v-col cols="12" sm="6" class="text-right">
        <v-btn small color="primary" @click="$router.push({ name: 'lista_activos' })" class="mt-1 mt-sm-0">
          <v-icon left small>mdi-arrow-left</v-icon>
          Volver
        </v-btn>
      </v-col>
    </v-row>

    <v-row dense class="mb-3">
      <v-col v-for="(stat, key) in statsCards" :key="key" cols="6" sm="3" md="2" class="py-1 px-2">
        <v-card class="pa-3 d-flex align-center" :color="stat.color + ' lighten-5'" flat height="100%">
          <v-icon :color="stat.color" size="22" class="mr-5 ml-6">
            {{ stat.icon }}
          </v-icon>
          <div class="d-flex flex-column ml-2">
            <div class="text-h7 font-weight-bold" :class="stat.color + '--text'" style="line-height: 1.2;">
              {{ stat.value }}
            </div>
            <div class="text-caption mt-1" style="line-height: 1.1;">
              {{ stat.title }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-2">
      <v-tabs v-model="tabActivo" background-color="primary" dark show-arrows height="42">
        <v-tab v-for="tab in tabs" :key="tab.key" class="text-capitalize">
          <v-icon left small>{{ tab.icon }}</v-icon>
          <span class="d-none d-sm-inline">{{ tab.title }}</span>
          <span class="d-inline d-sm-none">{{ tab.short }}</span>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tabActivo">
        <v-tab-item>
          <v-card flat class="pa-2 pa-sm-3">
            <div class="d-flex justify-space-between align-center flex-wrap mb-2 mb-sm-3">
              <div class="subtitle-2 font-weight-medium">
                <v-icon small color="green" class="mr-1">mdi-check-circle</v-icon>
                Equipos Disponibles
              </div>
              <v-btn small color="success" @click="exportarExcel('disponibles')" class="mt-1 mt-sm-0">
                <v-icon left small>mdi-download</v-icon>
                <span class="d-none d-sm-inline">Exportar</span>
                <span class="d-inline d-sm-none">Excel</span>
              </v-btn>
            </div>

            <template v-if="$vuetify.breakpoint.smAndUp">
              <v-data-table :headers="headersBasico" :items="equiposDisponibles" dense :items-per-page="10"
                no-data-text="No hay equipos disponibles" class="elevation-1 compact-table">
                <template v-slot:[`item.condicion`]="{ item }">
                  <v-chip color="green" x-small dark label>{{ item.condicion }}</v-chip>
                </template>
                <template v-slot:[`item.estado`]="{ item }">
                  <v-chip color="blue" x-small outlined label>{{ item.estado }}</v-chip>
                </template>
                <template v-slot:[`item.descripcion`]="{ item }">
                  <span class="text-truncate" style="max-width: 150px; display: inline-block;">
                    {{ item.descripcion }}
                  </span>
                </template>
                <template v-slot:[`item.ubicacion_especifica`]="{ item }">
                  <span class="text-truncate" style="max-width: 120px; display: inline-block;">
                    {{ item.ubicacion_especifica || '-' }}
                  </span>
                </template>
              </v-data-table>
            </template>

            <template v-else>
              <v-card v-for="item in equiposDisponibles" :key="item.codigo" class="mb-2 pa-2" outlined>
                <div class="d-flex justify-space-between align-center">
                  <div class="font-weight-bold primary--text">{{ item.codigo }}</div>
                  <v-chip color="green" x-small dark label>{{ item.condicion }}</v-chip>
                </div>
                <div class="text-caption mt-1">{{ item.marca }} {{ item.modelo }}</div>
                <div class="text-caption">{{ item.descripcion }}</div>
                <div class="d-flex justify-space-between align-center mt-1">
                  <span class="text-caption">{{ item.ubicacion_especifica || 'Sin ubicación' }}</span>
                  <v-chip color="blue" x-small outlined label>{{ item.estado }}</v-chip>
                </div>
              </v-card>

              <v-alert v-if="equiposDisponibles.length === 0" type="info" dense class="mt-2">
                No hay equipos disponibles
              </v-alert>
            </template>
          </v-card>
        </v-tab-item>

        <v-tab-item>
          <v-card flat class="pa-2 pa-sm-3">
            <div class="d-flex justify-space-between align-center flex-wrap mb-2 mb-sm-3">
              <div class="subtitle-2 font-weight-medium">
                <v-icon small color="teal" class="mr-1">mdi-account-check</v-icon>
                Equipos con Cliente
              </div>
              <v-btn small color="success" @click="exportarExcel('clientes')" class="mt-1 mt-sm-0">
                <v-icon left small>mdi-download</v-icon>
                <span class="d-none d-sm-inline">Exportar</span>
                <span class="d-inline d-sm-none">Excel</span>
              </v-btn>
            </div>

            <template v-if="$vuetify.breakpoint.smAndUp">
              <v-data-table :headers="headersCliente" :items="equiposConCliente" dense :items-per-page="10"
                no-data-text="No hay equipos asignados" class="elevation-1 compact-table">
                <template v-slot:[`item.estado`]="{ item }">
                  <v-chip :color="item.estado === 'EN USO' ? 'teal' : 'orange'" x-small dark label>
                    {{ item.estado }}
                  </v-chip>
                </template>
                <template v-slot:[`item.fecha_asignacion`]="{ item }">
                  {{ formatFecha(item.fecha_asignacion) }}
                </template>
                <template v-slot:[`item.cliente_nombre`]="{ item }">
                  <span class="text-truncate" style="max-width: 180px; display: inline-block;">
                    {{ item.cliente_nombre || '-' }}
                  </span>
                </template>
                <template v-slot:[`item.cliente_direccion`]="{ item }">
                  <span class="text-truncate" style="max-width: 150px; display: inline-block;">
                    {{ item.cliente_direccion || '-' }}
                  </span>
                </template>
              </v-data-table>
            </template>

            <template v-else>
              <v-card v-for="item in equiposConCliente" :key="item.codigo" class="mb-2 pa-2" outlined>
                <div class="d-flex justify-space-between align-center">
                  <div class="font-weight-bold primary--text">{{ item.codigo }}</div>
                  <v-chip :color="item.estado === 'EN USO' ? 'teal' : 'orange'" x-small dark label>
                    {{ item.estado }}
                  </v-chip>
                </div>
                <div class="text-caption mt-1">{{ item.marca }} {{ item.modelo }}</div>
                <div class="text-caption font-weight-medium mt-1">
                  <v-icon x-small class="mr-1">mdi-account</v-icon>
                  {{ item.cliente_nombre || 'Sin cliente' }}
                </div>
                <div class="text-caption text-truncate grey--text">{{ item.cliente_direccion || 'Sin dirección' }}</div>
                <div class="text-caption mt-1 ">
                  <v-icon x-small class="mr-1">mdi-calendar</v-icon>
                  {{ formatFecha(item.fecha_asignacion) }}
                </div>
              </v-card>

              <v-alert v-if="equiposConCliente.length === 0" type="info" dense class="mt-2">
                No hay equipos con cliente
              </v-alert>
            </template>
          </v-card>
        </v-tab-item>

        <v-tab-item>
          <v-card flat class="pa-2 pa-sm-3">
            <div class="d-flex justify-space-between align-center flex-wrap mb-2 mb-sm-3">
              <div class="subtitle-2 font-weight-medium">
                <v-icon small color="purple" class="mr-1">mdi-wrench</v-icon>
                Equipos en Mantenimiento
              </div>
              <v-btn small color="success" @click="exportarExcel('mantenimiento')" class="mt-1 mt-sm-0">
                <v-icon left small>mdi-download</v-icon>
                <span class="d-none d-sm-inline">Exportar</span>
                <span class="d-inline d-sm-none">Excel</span>
              </v-btn>
            </div>

            <template v-if="$vuetify.breakpoint.smAndUp">
              <v-data-table :headers="headersMantenimiento" :items="equiposMantenimiento" dense :items-per-page="10"
                no-data-text="No hay equipos en mantenimiento" class="elevation-1 compact-table">
                <template v-slot:[`item.condicion`]="{ item }">
                  <v-chip :color="item.condicion === 'EN MANTENIMIENTO' ? 'purple' : 'red'" x-small dark label>
                    {{ item.condicion }}
                  </v-chip>
                </template>
                <template v-slot:[`item.fecha_mantenimiento_inicio`]="{ item }">
                  {{ formatFecha(item.fecha_mantenimiento_inicio) }}
                </template>
                <template v-slot:[`item.observacion_actual`]="{ item }">
                  <span class="text-truncate" style="max-width: 200px; display: inline-block;">
                    {{ item.observacion_actual || '-' }}
                  </span>
                </template>
              </v-data-table>
            </template>

            <template v-else>
              <v-card v-for="item in equiposMantenimiento" :key="item.codigo" class="mb-2 pa-2" outlined>
                <div class="d-flex justify-space-between align-center">
                  <div class="font-weight-bold primary--text">{{ item.codigo }}</div>
                  <v-chip :color="item.condicion === 'EN MANTENIMIENTO' ? 'purple' : 'red'" x-small dark label>
                    {{ item.condicion }}
                  </v-chip>
                </div>
                <div class="text-caption mt-1">{{ item.marca }} {{ item.modelo }}</div>
                <div class="text-caption">{{ item.descripcion }}</div>
                <div class="text-caption mt-1">
                  <v-icon x-small class="mr-1">mdi-calendar</v-icon>
                  {{ formatFecha(item.fecha_mantenimiento_inicio) }}
                </div>
                <div class="text-caption text-truncate mt-1">{{ item.observacion_actual || 'Sin observación' }}</div>
              </v-card>

              <v-alert v-if="equiposMantenimiento.length === 0" type="info" dense class="mt-2">
                No hay equipos en mantenimiento
              </v-alert>
            </template>
          </v-card>
        </v-tab-item>

        <v-tab-item>
          <v-card flat class="pa-2 pa-sm-3">
            <div class="subtitle-2 font-weight-medium mb-2 mb-sm-3">
              <v-icon small color="grey" class="mr-1">mdi-history</v-icon>
              Historial de Movimientos
            </div>

            <v-row dense class="mb-3">
              <v-col cols="12" sm="4" md="3">
                <v-text-field v-model="fechaInicioFormatted" label="Fecha Inicio" outlined dense hide-details readonly
                  @click="menuFechaInicio = true" prepend-inner-icon="mdi-calendar" class="compact-field">
                </v-text-field>
                <v-menu v-model="menuFechaInicio" :close-on-content-click="false" transition="scale-transition"
                  offset-y>
                  <v-date-picker v-model="fechaInicio" @input="menuFechaInicio = false" locale="es"></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4" md="3">
                <v-text-field v-model="fechaFinFormatted" label="Fecha Fin" outlined dense hide-details readonly
                  @click="menuFechaFin = true" prepend-inner-icon="mdi-calendar" class="compact-field">
                </v-text-field>
                <v-menu v-model="menuFechaFin" :close-on-content-click="false" transition="scale-transition" offset-y>
                  <v-date-picker v-model="fechaFin" @input="menuFechaFin = false" locale="es"></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4" md="3">
                <v-select v-model="filtroEquipoHistorial" :items="equiposOptions" label="Filtrar por Equipo" outlined
                  dense hide-details clearable prepend-inner-icon="mdi-filter" class="compact-field">
                </v-select>
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center">
                <v-btn color="primary" @click="buscarHistorial" :loading="cargandoHistorial" class="mr-2 flex-grow-1"
                  small>
                  <v-icon left small>mdi-magnify</v-icon>
                  <span class="d-none d-sm-inline">Buscar</span>
                </v-btn>
                <v-btn small color="success" @click="exportarHistorialExcel" :disabled="historialFiltrado.length === 0"
                  class="flex-grow-1">
                  <v-icon left small>mdi-download</v-icon>
                  <span class="d-none d-sm-inline">Descargar</span>
                </v-btn>
              </v-col>
            </v-row>

            <template v-if="$vuetify.breakpoint.smAndUp">
              <v-data-table :headers="headersHistorial" :items="historialFiltrado" dense :items-per-page="15"
                class="elevation-1 mb-3 compact-table" :loading="cargandoHistorial"
                no-data-text="Seleccione un rango de fechas y presione Buscar">
                <template v-slot:[`item.fecha`]="{ item }">
                  <span style="font-size: 12px;">{{ formatFechaHora(item.fecha) }}</span>
                </template>
                <template v-slot:[`item.tipo_cambio`]="{ item }">
                  <v-chip :color="getColorTipo(item.tipo_cambio)" x-small dark label>
                    {{ item.tipo_cambio }}
                  </v-chip>
                </template>
                <template v-slot:[`item.usuario_nombre`]="{ item }">
                  <span class="text-truncate" style="max-width: 120px; display: inline-block;">
                    {{ item.usuario_nombre || item.usuario || '-' }}
                  </span>
                </template>
                <template v-slot:[`item.observacion`]="{ item }">
                  <span class="text-truncate" style="max-width: 250px; display: inline-block;">
                    {{ item.observacion || '-' }}
                  </span>
                </template>
              </v-data-table>
            </template>

            <template v-else>
              <v-card v-for="item in historialFiltrado" :key="item.id" class="mb-2 pa-2" outlined>
                <div class="d-flex justify-space-between align-center">
                  <div class="font-weight-bold primary--text text-caption">{{ item.equipo_codigo }}</div>
                  <v-chip :color="getColorTipo(item.tipo_cambio)" x-small dark label>
                    {{ item.tipo_cambio }}
                  </v-chip>
                </div>
                <div class="text-caption mt-1">
                  <v-icon x-small class="mr-1">mdi-calendar-clock</v-icon>
                  {{ formatFechaHora(item.fecha) }}
                </div>
                <div class="text-caption">
                  <v-icon x-small class="mr-1">mdi-account</v-icon>
                  {{ item.usuario_nombre || item.usuario }}
                </div>
                <div class="text-caption text-truncate mt-1">{{ item.observacion || 'Sin observación' }}</div>
              </v-card>

              <v-alert v-if="historialFiltrado.length === 0 && !cargandoHistorial" type="info" dense class="mt-2">
                No hay registros de historial
              </v-alert>
            </template>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </div>
</template>

<script>
import { escucharEquipos, detenerEscuchaEquipos, getHistorialPorFechas } from "@/db_activos";
import moment from "moment";
import * as XLSX from "xlsx";

export default {
  name: "ReportesActivos",

  data() {
    return {
      tabActivo: 0,
      equipos: [],
      cargando: true,

      stats: {
        total: 0,
        disponibles: 0,
        enUso: 0,
        reservados: 0,
        enMantenimiento: 0,
        averiados: 0
      },

      tabs: [
        { key: 0, icon: 'mdi-check-circle', title: 'Disponibles', short: 'Disp' },
        { key: 1, icon: 'mdi-account-check', title: 'Con Cliente', short: 'Clientes' },
        { key: 2, icon: 'mdi-wrench', title: 'Mantenimiento', short: 'Mant' },
        { key: 3, icon: 'mdi-history', title: 'Historial', short: 'Hist' }
      ],

      headersBasico: [
        { text: "Código", value: "codigo", width: "100px", sortable: true },
        { text: "Marca", value: "marca", width: "120px", sortable: true },
        { text: "Modelo", value: "modelo", width: "120px", sortable: true },
        { text: "Tipo", value: "descripcion", width: "150px", sortable: true },
        { text: "Condición", value: "condicion", width: "110px", sortable: true },
        { text: "Estado", value: "estado", width: "100px", sortable: true },
        { text: "Ubicación", value: "ubicacion_especifica", width: "140px", sortable: true }
      ],

      headersCliente: [
        { text: "Código", value: "codigo", width: "100px", sortable: true },
        { text: "Marca/Modelo", value: "marca", width: "150px", sortable: true },
        { text: "Cliente", value: "cliente_nombre", width: "180px", sortable: true },
        { text: "Dirección", value: "cliente_direccion", width: "200px", sortable: true },
        { text: "Estado", value: "estado", width: "100px", sortable: true },
        { text: "Fecha Asignación", value: "fecha_asignacion", width: "130px", sortable: true }
      ],

      headersMantenimiento: [
        { text: "Código", value: "codigo", width: "100px", sortable: true },
        { text: "Marca", value: "marca", width: "120px", sortable: true },
        { text: "Modelo", value: "modelo", width: "120px", sortable: true },
        { text: "Condición", value: "condicion", width: "130px", sortable: true },
        { text: "Inicio Mant.", value: "fecha_mantenimiento_inicio", width: "120px", sortable: true },
        { text: "Observación", value: "observacion_actual", width: "200px", sortable: true }
      ],

      headersHistorial: [
        { text: "Fecha", value: "fecha", width: "150px", sortable: true },
        { text: "Equipo", value: "equipo_codigo", width: "100px", sortable: true },
        { text: "Tipo", value: "tipo_cambio", width: "110px", sortable: true },
        { text: "Usuario", value: "usuario_nombre", width: "120px", sortable: true },
        { text: "Observación", value: "observacion", width: "250px", sortable: true }
      ],

      historial: [],
      cargandoHistorial: false,
      fechaInicio: moment().subtract(30, 'days').format("YYYY-MM-DD"),
      fechaFin: moment().format("YYYY-MM-DD"),
      menuFechaInicio: false,
      menuFechaFin: false,
      filtroEquipoHistorial: null
    };
  },

  computed: {
    statsCards() {
      return [
        { key: 'total', icon: 'mdi-package-variant-closed', title: 'Total', value: this.stats.total, color: 'blue' },
        { key: 'disponibles', icon: 'mdi-check-circle', title: 'Disponibles', value: this.stats.disponibles, color: 'green' },
        { key: 'enUso', icon: 'mdi-account-check', title: 'En Uso', value: this.stats.enUso, color: 'teal' },
        { key: 'reservados', icon: 'mdi-clock-outline', title: 'Reservados', value: this.stats.reservados, color: 'orange' },
        { key: 'enMantenimiento', icon: 'mdi-wrench', title: 'Mantenimiento', value: this.stats.enMantenimiento, color: 'purple' },
        { key: 'averiados', icon: 'mdi-alert-circle', title: 'Averiados', value: this.stats.averiados, color: 'red' }
      ];
    },

    equiposDisponibles() {
      return this.equipos.filter(e => e.condicion === "OPERATIVO" && e.estado === "ALMACÉN");
    },

    equiposConCliente() {
      return this.equipos.filter(e => e.estado === "EN USO" || e.estado === "RESERVADO");
    },

    equiposMantenimiento() {
      return this.equipos.filter(e =>
        e.condicion === "EN MANTENIMIENTO" || e.condicion === "AVERIADO"
      );
    },

    equiposOptions() {
      return this.equipos.map(e => ({
        text: `${e.codigo} - ${e.marca} ${e.modelo || ''}`.trim(),
        value: e.codigo
      })).sort((a, b) => a.text.localeCompare(b.text));
    },

    historialFiltrado() {
      if (!this.filtroEquipoHistorial) return this.historial;
      return this.historial.filter(h => h.equipo_codigo === this.filtroEquipoHistorial);
    },

    fechaInicioFormatted() {
      return this.fechaInicio ? moment(this.fechaInicio).format("DD/MM/YYYY") : "";
    },

    fechaFinFormatted() {
      return this.fechaFin ? moment(this.fechaFin).format("DD/MM/YYYY") : "";
    }
  },

  mounted() {
    this.cargarEquipos();
  },

  beforeDestroy() {
    detenerEscuchaEquipos();
  },

  methods: {
    cargarEquipos() {
      this.cargando = true;
      escucharEquipos((equipos) => {
        this.equipos = equipos;
        this.actualizarEstadisticas();
        this.cargando = false;
      });
    },

    actualizarEstadisticas() {
      this.stats = {
        total: this.equipos.length,
        disponibles: this.equipos.filter(e => e.condicion === "OPERATIVO" && e.estado === "ALMACÉN").length,
        enUso: this.equipos.filter(e => e.estado === "EN USO").length,
        reservados: this.equipos.filter(e => e.estado === "RESERVADO").length,
        enMantenimiento: this.equipos.filter(e => e.condicion === "EN MANTENIMIENTO").length,
        averiados: this.equipos.filter(e => e.condicion === "AVERIADO").length
      };
    },

    formatFecha(timestamp) {
      if (!timestamp) return "-";
      return moment(timestamp).format("DD/MM/YYYY");
    },

    formatFechaHora(timestamp) {
      if (!timestamp) return "-";
      return moment(timestamp).format("DD/MM/YYYY HH:mm");
    },

    getColorTipo(tipo) {
      const colores = {
        "INGRESO": "blue",
        "ASIGNACION": "green",
        "DEVOLUCION": "orange",
        "MANTENIMIENTO": "purple",
        "REPARACION": "teal",
        "CAMBIO_ESTADO": "grey"
      };
      return colores[tipo] || "grey";
    },

    async buscarHistorial() {
      if (!this.fechaInicio || !this.fechaFin) {
        this.$store.commit("dialogosnackbar", "Seleccione ambas fechas");
        return;
      }

      this.cargandoHistorial = true;

      try {
        const inicio = moment(this.fechaInicio).startOf('day').valueOf();
        const fin = moment(this.fechaFin).endOf('day').valueOf();
        this.historial = await getHistorialPorFechas(inicio, fin);
      } catch (error) {
        console.error("Error al buscar historial:", error);
        this.$store.commit("dialogosnackbar", "Error al buscar historial");
      } finally {
        this.cargandoHistorial = false;
      }
    },

    async exportarExcel(tipo) {
      try {
        let data = [];
        let filename = "";

        if (tipo === "disponibles") {
          data = this.equiposDisponibles.map(e => ({
            "Código": e.codigo,
            "Marca": e.marca,
            "Modelo": e.modelo || "",
            "Tipo": e.descripcion,
            "Condición": e.condicion,
            "Estado": e.estado,
            "Ubicación": e.ubicacion_especifica || "",
            "Fecha Ingreso": e.fecha_ingreso ? moment(e.fecha_ingreso).format("DD/MM/YYYY") : ""
          }));
          filename = "equipos_disponibles";
        } else if (tipo === "clientes") {
          data = this.equiposConCliente.map(e => ({
            "Código": e.codigo,
            "Marca": e.marca,
            "Modelo": e.modelo || "",
            "Tipo": e.descripcion,
            "Cliente": e.cliente_nombre || "",
            "Doc. Cliente": e.cliente_id || "",
            "Dirección": e.cliente_direccion || "",
            "Estado": e.estado,
            "Fecha Asignación": e.fecha_asignacion ? moment(e.fecha_asignacion).format("DD/MM/YYYY") : ""
          }));
          filename = "equipos_con_cliente";
        } else if (tipo === "mantenimiento") {
          data = this.equiposMantenimiento.map(e => ({
            "Código": e.codigo,
            "Marca": e.marca,
            "Modelo": e.modelo || "",
            "Tipo": e.descripcion,
            "Condición": e.condicion,
            "Inicio Mant.": e.fecha_mantenimiento_inicio ? moment(e.fecha_mantenimiento_inicio).format("DD/MM/YYYY") : "",
            "Observación": e.observacion_actual || ""
          }));
          filename = "equipos_mantenimiento";
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipos");
        XLSX.writeFile(wb, `${filename}_${moment().format("YYYYMMDD")}.xlsx`);
        this.$store.commit("dialogosnackbar", "Archivo exportado correctamente");
      } catch (error) {
        console.error("Error al exportar:", error);
        this.$store.commit("dialogosnackbar", "Error al exportar");
      }
    },

    exportarHistorialExcel() {
      if (this.historialFiltrado.length === 0) return;

      const data = this.historialFiltrado.map(h => ({
        "Fecha": this.formatFechaHora(h.fecha),
        "Equipo": h.equipo_codigo,
        "Tipo": h.tipo_cambio,
        "Usuario": h.usuario_nombre || h.usuario || "",
        "Observación": h.observacion || ""
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historial");

      const filename = this.filtroEquipoHistorial
        ? `historial_${this.filtroEquipoHistorial}_${moment().format("YYYYMMDD")}.xlsx`
        : `historial_activos_${moment().format("YYYYMMDD")}.xlsx`;

      XLSX.writeFile(wb, filename);
      this.$store.commit("dialogosnackbar", "Archivo exportado correctamente");
    }
  }
};
</script>

<style scoped>
.v-card {
  border-radius: 6px !important;
}

.v-tab {
  min-width: 90px;
  padding: 0 10px;
  font-size: 12px;
}

.v-tabs {
  min-height: 42px;
}

.compact-table>>>.v-data-table-header {
  padding: 4px 0 !important;
}

.compract-table>>>th {
  font-size: 12px !important;
  padding: 4px 8px !important;
  height: 36px !important;
}

.compact-table>>>td {
  font-size: 12px !important;
  padding: 4px 8px !important;
  height: 40px !important;
}

.compact-table>>>.v-data-footer {
  padding: 4px 8px !important;
  min-height: 40px !important;
}

.compact-field>>>.v-input__control {
  min-height: 40px !important;
}

.compact-field>>>.v-input__slot {
  min-height: 40px !important;
  padding: 0 8px !important;
}

.compact-field>>>.v-text-field__slot input {
  font-size: 13px !important;
}

.v-chip--x-small {
  height: 18px !important;
  font-size: 10px !important;
  padding: 0 6px !important;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .v-tab {
    min-width: 70px;
    padding: 0 6px;
    font-size: 11px;
  }

  .text-h5 {
    font-size: 1.25rem !important;
  }
}

.v-card .v-icon {
  margin-bottom: 2px !important;
}

.v-card .text-h5 {
  margin-top: 0 !important;
  line-height: 1.2 !important;
}

.v-card .text-caption {
  line-height: 1.1 !important;
  margin-top: 2px !important;
}
</style>