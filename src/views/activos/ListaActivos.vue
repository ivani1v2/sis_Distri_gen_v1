<template>
  <div class="pa-3 ma-0">
    <v-row dense class="mb-2">
      <v-col cols="12" sm="6" md="4">
        <h2 class="text-h6 font-weight-bold">
          Gestión de Activos
        </h2>
      </v-col>
      <v-col cols="12" sm="6" md="8" :class="['d-flex', 'justify-end', $vuetify.breakpoint.xsOnly ? 'mt-n10' : '']">
        <v-btn color="primary" small @click="abrirNuevoEquipo" class="mr-2">
          <v-icon left small>mdi-plus</v-icon>
          <span class="d-none d-sm-inline">Nuevo Equipo</span>
          <span class="d-inline d-sm-none">Nuevo</span>
        </v-btn>
        <v-btn color="success" small @click="$router.push({ name: 'reportes_activos' })">
          <v-icon left small>mdi-chart-bar</v-icon>
          <span class="d-none d-sm-inline">Reportes</span>
        </v-btn>
        <v-btn color="purple" dark small @click="dialogCargaMasiva = true" class="ml-2">
          <v-icon left small>mdi-upload-multiple</v-icon>
          <span class="d-none d-sm-inline">Cargar Masivo</span>
        </v-btn>
      </v-col>
    </v-row>

    <v-row dense class="mb-3" style="flex-wrap: nowrap;">
      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'todos' ? 'blue lighten-3' : 'blue lighten-5'" flat
          @click="aplicarFiltroRapido('todos')">
          <div class="text-subtitle-1 font-weight-bold"
            :class="filtroRapido === 'todos' ? 'blue--text text--darken-2' : 'primary--text'">
            {{ stats.total }}
          </div>
          <div class="caption">Total</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'disponibles' ? 'green lighten-3' : 'green lighten-5'" flat
          @click="aplicarFiltroRapido('disponibles')">
          <div class="text-subtitle-1 font-weight-bold green--text">{{ stats.disponibles }}</div>
          <div class="caption">Dis.</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'reservados' ? 'amber lighten-3' : 'amber lighten-5'" flat
          @click="aplicarFiltroRapido('reservados')">
          <div class="text-subtitle-1 font-weight-bold amber--text text--darken-3">{{ stats.reservados }}</div>
          <div class="caption">Reser.</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'enUso' ? 'orange lighten-3' : 'orange lighten-5'" flat
          @click="aplicarFiltroRapido('enUso')">
          <div class="text-subtitle-1 font-weight-bold orange--text text--darken-2">{{ stats.enUso }}</div>
          <div class="caption">En uso</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'pendienteRecojo' ? 'amber lighten-2' : 'amber lighten-5'" flat
          @click="aplicarFiltroRapido('pendienteRecojo')">
          <div class="text-subtitle-1 font-weight-bold amber--text text--darken-4">{{ stats.pendienteRecojo }}</div>
          <div class="caption">Pend.</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'enMantenimiento' ? 'purple lighten-3' : 'purple lighten-5'" flat
          @click="aplicarFiltroRapido('enMantenimiento')">
          <div class="text-subtitle-1 font-weight-bold purple--text">{{ stats.enMantenimiento }}</div>
          <div class="caption">Mant.</div>
        </v-card>
      </v-col>

      <v-col style="flex: 1 1 0; min-width: 0;">
        <v-card class="text-center pa-1 cursor-pointer"
          :color="filtroRapido === 'averiados' ? 'red lighten-3' : 'red lighten-5'" flat
          @click="aplicarFiltroRapido('averiados')">
          <div class="text-subtitle-1 font-weight-bold red--text">{{ stats.averiados }}</div>
          <div class="caption">Aver.</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense class="mb-2">
      <v-col cols="12" sm="6" md="4">
        <v-text-field v-model="busqueda" outlined dense hide-details placeholder="Buscar por código, marca, cliente..."
          prepend-inner-icon="mdi-magnify" clearable></v-text-field>
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select v-model="filtroCondicion" :items="condicionesOptions" outlined dense hide-details label="Condición"
          clearable></v-select>
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select v-model="filtroEstado" :items="estadosOptions" outlined dense hide-details label="Estado"
          clearable></v-select>
      </v-col>
    </v-row>

    <v-card v-if="!isMobile" class="elevation-1">
      <v-data-table :headers="headers" :items="equiposFiltrados" :search="busqueda" dense :items-per-page="15"
        item-key="codigo" class="elevation-0" :loading="cargando" loading-text="Cargando equipos..."
        no-data-text="No hay equipos registrados" no-results-text="No se encontraron resultados">
        <template v-slot:[`item.codigo`]="{ item }">
          <span class="font-weight-bold">{{ item.codigo }}</span>
        </template>

        <template v-slot:[`item.condicion`]="{ item }">
          <v-chip :color="getColorCondicion(item.condicion)" small dark label>
            {{ item.condicion }}
          </v-chip>
        </template>

        <template v-slot:[`item.estado`]="{ item }">
          <v-chip :color="getColorEstado(item.estado)" small outlined label>
            {{ item.estado }}
          </v-chip>
        </template>

        <template v-slot:[`item.cliente_nombre`]="{ item }">
          <span v-if="item.cliente_nombre" style="max-width: 150px; display: inline-block;">
            {{ item.cliente_nombre }}
          </span>
          <span v-else class="grey--text">-</span>
        </template>

        <template v-slot:[`item.cliente_direccion`]="{ item }">
          <span v-if="item.cliente_direccion" class="caption">
            <v-tooltip bottom max-width="300">
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on"
                  style="max-width: 250px; display: inline-block;">
                  {{ item.cliente_direccion }}
                </span>
              </template>
              <span>{{ item.cliente_direccion }}</span>
            </v-tooltip>
          </span>
          <span v-else class="grey--text">-</span>
        </template>

        <template v-slot:[`item.acciones`]="{ item }">
          <v-menu offset-y left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon small v-bind="attrs" v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item @click="verDetalle(item)">
                <v-list-item-icon><v-icon small color="primary">mdi-eye</v-icon></v-list-item-icon>
                <v-list-item-title>Ver Detalle</v-list-item-title>
              </v-list-item>
              <v-list-item @click="editarEquipo(item)">
                <v-list-item-icon><v-icon small color="info">mdi-pencil</v-icon></v-list-item-icon>
                <v-list-item-title>Editar</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item v-if="puedeAsignar(item)" @click="abrirAsignacion(item)">
                <v-list-item-icon><v-icon small color="success">mdi-account-plus</v-icon></v-list-item-icon>
                <v-list-item-title>Asignar Cliente</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="puedeConfirmarEntrega(item)" @click="abrirConfirmarEntrega(item)">
                <v-list-item-icon><v-icon small color="teal">mdi-truck-delivery</v-icon></v-list-item-icon>
                <v-list-item-title>Confirmar Entrega</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="puedeDevolver(item)" @click="abrirDevolucion(item)">
                <v-list-item-icon><v-icon small color="orange">mdi-keyboard-return</v-icon></v-list-item-icon>
                <v-list-item-title>Registrar Devolución</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="puedeCompletarRecojo(item)" @click="abrirCompletarRecojo(item)">
                <v-list-item-icon><v-icon small color="amber darken-2">mdi-truck-check</v-icon></v-list-item-icon>
                <v-list-item-title>Completar Recojo</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="puedeEnviarMantenimiento(item)" @click="abrirMantenimiento(item)">
                <v-list-item-icon><v-icon small color="purple">mdi-wrench</v-icon></v-list-item-icon>
                <v-list-item-title>Enviar a Mantenimiento</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="puedeCompletarReparacion(item)" @click="abrirCompletarReparacion(item)">
                <v-list-item-icon><v-icon small color="green">mdi-check-circle</v-icon></v-list-item-icon>
                <v-list-item-title>Completar Reparación</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="verHistorial(item)">
                <v-list-item-icon><v-icon small color="grey">mdi-history</v-icon></v-list-item-icon>
                <v-list-item-title>Ver Historial</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <!-- LISTA MOBILE -->
    <div v-else>
      <v-card v-if="cargando" class="pa-4 text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-2">Cargando equipos...</div>
      </v-card>

      <div v-else-if="equiposFiltrados.length === 0" class="text-center pa-4">
        <v-icon size="64" color="grey lighten-1">mdi-package-variant</v-icon>
        <div class="grey--text mt-2">No hay equipos registrados</div>
      </div>

      <v-card v-else v-for="item in equiposFiltrados" :key="item.codigo" class="mb-2 pa-3" @click="verDetalle(item)">
        <div class="d-flex justify-space-between align-start">
          <div class="flex-grow-1">
            <div class="font-weight-bold">{{ item.codigo }}</div>
            <div class="caption grey--text">{{ item.marca }} {{ item.modelo }}</div>
            <div v-if="item.cliente_nombre" class="caption mt-1">
              <v-icon x-small>mdi-account</v-icon> {{ item.cliente_nombre }}
            </div>
            <span v-if="item.cliente_direccion" class="caption grey--text">
              <v-icon x-small>mdi-map-marker</v-icon> {{ truncarTexto(item.cliente_direccion, 30) }}
            </span>
          </div>
          <div class="text-right">
            <v-chip :color="getColorCondicion(item.condicion)" x-small dark label class="mb-1">
              {{ item.condicion }}
            </v-chip>
            <br>
            <v-chip :color="getColorEstado(item.estado)" x-small outlined label>
              {{ item.estado }}
            </v-chip>
          </div>
        </div>
        <v-divider class="my-2"></v-divider>
        <div class="d-flex justify-space-around">
          <v-btn v-if="puedeAsignar(item)" x-small text color="success" @click.stop="abrirAsignacion(item)">
            <v-icon x-small left>mdi-account-plus</v-icon> Asignar
          </v-btn>
          <v-btn v-if="puedeConfirmarEntrega(item)" x-small text color="teal" @click.stop="abrirConfirmarEntrega(item)">
            <v-icon x-small left>mdi-truck-delivery</v-icon> Entregar
          </v-btn>
          <v-btn v-if="puedeDevolver(item)" x-small text color="orange" @click.stop="abrirDevolucion(item)">
            <v-icon x-small left>mdi-keyboard-return</v-icon> Devolver
          </v-btn>
          <v-btn v-if="puedeCompletarRecojo(item)" x-small text color="amber darken-2"
            @click.stop="abrirCompletarRecojo(item)">
            <v-icon x-small left>mdi-truck-check</v-icon> Recojo
          </v-btn>
          <v-btn v-if="puedeEnviarMantenimiento(item)" x-small text color="purple"
            @click.stop="abrirMantenimiento(item)">
            <v-icon x-small left>mdi-wrench</v-icon> Manten.
          </v-btn>
          <v-btn v-if="puedeCompletarReparacion(item)" x-small text color="green"
            @click.stop="abrirCompletarReparacion(item)">
            <v-icon x-small left>mdi-check</v-icon> Completar
          </v-btn>
          <v-btn x-small text color="grey" @click.stop="verHistorial(item)">
            <v-icon x-small>mdi-history</v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- DIALOGS -->
    <dialog-nuevo-equipo v-if="dialogNuevoEquipo" :visible.sync="dialogNuevoEquipo" :equipo="equipoEditar"
      @guardado="onEquipoGuardado" />

    <dialog-asignar-cliente v-if="dialogAsignar" :visible.sync="dialogAsignar" :equipo="equipoSeleccionado"
      @asignado="onEquipoAsignado" />

    <dialog-confirmar-entrega v-if="dialogConfirmarEntrega" :visible.sync="dialogConfirmarEntrega"
      :equipo="equipoSeleccionado" @confirmado="onEntregaConfirmada" />

    <dialog-devolucion v-if="dialogDevolucion" :visible.sync="dialogDevolucion" :equipo="equipoSeleccionado"
      @devuelto="onEquipoDevuelto" />

    <dialog-completar-recojo v-if="dialogCompletarRecojo" :visible.sync="dialogCompletarRecojo"
      :equipo="equipoSeleccionado" @recojo-completado="onRecojoCompletado" />

    <dialog-mantenimiento v-if="dialogMantenimiento" :visible.sync="dialogMantenimiento" :equipo="equipoSeleccionado"
      @enviado="onMantenimientoEnviado" />

    <dialog-completar-reparacion v-if="dialogCompletarReparacion" :visible.sync="dialogCompletarReparacion"
      :equipo="equipoSeleccionado" @completado="onReparacionCompletada" />

    <dialog-historial v-if="dialogHistorial" :visible.sync="dialogHistorial" :equipo="equipoSeleccionado" />

    <dialog-detalle-equipo v-if="dialogDetalle" :visible.sync="dialogDetalle" :equipo="equipoSeleccionado"
      @editar="editarEquipo" @asignar="abrirAsignacion" @devolver="abrirDevolucion" @mantenimiento="abrirMantenimiento"
      @completar="abrirCompletarReparacion" @confirmar-entrega="abrirConfirmarEntrega" @historial="verHistorial" />
    <dialog-carga-masiva-activos v-if="dialogCargaMasiva" :visible.sync="dialogCargaMasiva"
      @importado="recargarEquipos" />
  </div>
</template>

<script>
import {
  escucharEquipos,
  detenerEscuchaEquipos,
  getEstadisticasEquipos
} from "@/db_activos";

import DialogNuevoEquipo from "./dialogos/DialogNuevoEquipo.vue";
import DialogAsignarCliente from "./dialogos/DialogAsignarCliente.vue";
import DialogConfirmarEntrega from "./dialogos/DialogConfirmarEntrega.vue";
import DialogDevolucion from "./dialogos/DialogDevolucion.vue";
import DialogCompletarRecojo from "./dialogos/DialogCompletarRecojo.vue";
import DialogMantenimiento from "./dialogos/DialogMantenimiento.vue";
import DialogCompletarReparacion from "./dialogos/DialogCompletarReparacion.vue";
import DialogHistorial from "./dialogos/DialogHistorial.vue";
import DialogDetalleEquipo from "./dialogos/DialogDetalleEquipo.vue";
import DialogCargaMasivaActivos from "./dialogos/DialogCargaMasivaActivos.vue";

export default {
  name: "ListaActivos",

  components: {
    DialogNuevoEquipo,
    DialogAsignarCliente,
    DialogConfirmarEntrega,
    DialogDevolucion,
    DialogCompletarRecojo,
    DialogMantenimiento,
    DialogCompletarReparacion,
    DialogHistorial,
    DialogDetalleEquipo,
    DialogCargaMasivaActivos
  },

  data() {
    return {
      cargando: true,
      equipos: [],
      busqueda: "",
      filtroCondicion: null,
      filtroEstado: null,
      filtroRapido: "todos",

      stats: {
        total: 0,
        disponibles: 0,
        enUso: 0,
        reservados: 0,
        pendienteRecojo: 0,
        enMantenimiento: 0,
        averiados: 0,
        dadosDeBaja: 0
      },

      headers: [
        { text: "Código", value: "codigo", width: "120" },
        { text: "Marca", value: "marca", width: "100" },
        { text: "Modelo", value: "modelo", width: "100" },
        { text: "Condición", value: "condicion", width: "130" },
        { text: "Estado", value: "estado", width: "110" },
        { text: "Cliente", value: "cliente_nombre", width: "150" },
        { text: "Dirección", value: "cliente_direccion", width: "200" },
        { text: "Ub. Origen", value: "ubicacion_especifica", width: "130" },
        { text: "Acciones", value: "acciones", sortable: false, width: "80", align: "center" }
      ],

      condicionesOptions: [
        { text: "Operativo", value: "OPERATIVO" },
        { text: "En Mantenimiento", value: "EN MANTENIMIENTO" },
        { text: "Averiado", value: "AVERIADO" },
        { text: "Dado de Baja", value: "DADO DE BAJA" }
      ],

      estadosOptions: [
        { text: "Almacén", value: "ALMACÉN" },
        { text: "Reservado", value: "RESERVADO" },
        { text: "En Uso", value: "EN USO" },
        { text: "Pendiente Recojo", value: "PENDIENTE RECOJO" }
      ],

      // Dialogs
      dialogNuevoEquipo: false,
      dialogAsignar: false,
      dialogConfirmarEntrega: false,
      dialogDevolucion: false,
      dialogCompletarRecojo: false,
      dialogMantenimiento: false,
      dialogCompletarReparacion: false,
      dialogHistorial: false,
      dialogDetalle: false,

      equipoSeleccionado: null,
      equipoEditar: null,
      dialogCargaMasiva: false,
    };
  },

  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },

    equiposFiltrados() {
      let resultado = [...this.equipos];

      // Filtro rápido
      if (this.filtroRapido === "disponibles") {
        resultado = resultado.filter(e => e.condicion === "OPERATIVO" && e.estado === "ALMACÉN");
      } else if (this.filtroRapido === "reservados") {
        resultado = resultado.filter(e => e.estado === "RESERVADO");
      } else if (this.filtroRapido === "enUso") {
        resultado = resultado.filter(e => e.estado === "EN USO");
      } else if (this.filtroRapido === "pendienteRecojo") {
        resultado = resultado.filter(e => e.estado === "PENDIENTE RECOJO");
      } else if (this.filtroRapido === "enMantenimiento") {
        resultado = resultado.filter(e => e.condicion === "EN MANTENIMIENTO");
      } else if (this.filtroRapido === "averiados") {
        resultado = resultado.filter(e => e.condicion === "AVERIADO");
      }

      // Filtros adicionales (si filtroRapido es 'todos', aplican estos filtros)
      if (this.filtroRapido === "todos") {
        if (this.filtroCondicion) {
          resultado = resultado.filter(e => e.condicion === this.filtroCondicion);
        }
        if (this.filtroEstado) {
          resultado = resultado.filter(e => e.estado === this.filtroEstado);
        }
      }

      // Búsqueda
      if (this.busqueda && this.busqueda.trim()) {
        const termino = this.busqueda.toLowerCase().trim();
        resultado = resultado.filter(e => {
          return (
            (e.codigo || "").toLowerCase().includes(termino) ||
            (e.marca || "").toLowerCase().includes(termino) ||
            (e.modelo || "").toLowerCase().includes(termino) ||
            (e.cliente_nombre || "").toLowerCase().includes(termino) ||
            (e.descripcion || "").toLowerCase().includes(termino)
          );
        });
      }

      return resultado;
    }
  },

  watch: {
    // Cuando el usuario usa los dropdowns, auto-cambiar a 'todos' para que tomen efecto
    filtroCondicion(val) {
      if (val) this.filtroRapido = 'todos';
    },
    filtroEstado(val) {
      if (val) this.filtroRapido = 'todos';
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
    truncarTexto(texto, longitud) {
      if (!texto) return '';
      return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
    },

    actualizarEstadisticas() {
      this.stats = {
        total: this.equipos.length,
        disponibles: this.equipos.filter(e => e.condicion === "OPERATIVO" && e.estado === "ALMACÉN").length,
        enUso: this.equipos.filter(e => e.estado === "EN USO").length,
        reservados: this.equipos.filter(e => e.estado === "RESERVADO").length,
        pendienteRecojo: this.equipos.filter(e => e.estado === "PENDIENTE RECOJO").length,
        enMantenimiento: this.equipos.filter(e => e.condicion === "EN MANTENIMIENTO").length,
        averiados: this.equipos.filter(e => e.condicion === "AVERIADO").length,
        dadosDeBaja: this.equipos.filter(e => e.condicion === "DADO DE BAJA").length
      };
    },

    aplicarFiltroRapido(filtro) {
      // Toggle: si se hace clic en el mismo filtro, ir a 'todos'
      if (this.filtroRapido === filtro && filtro !== 'todos') {
        this.filtroRapido = 'todos';
      } else {
        this.filtroRapido = filtro;
      }
      // Limpiar los dropdowns solo cuando se presiona un card que no sea 'todos'
      if (filtro !== 'todos') {
        this.filtroCondicion = null;
        this.filtroEstado = null;
      }
    },

    getColorCondicion(condicion) {
      const colores = {
        "OPERATIVO": "green",
        "EN MANTENIMIENTO": "purple",
        "AVERIADO": "red",
        "DADO DE BAJA": "grey"
      };
      return colores[condicion] || "grey";
    },

    getColorEstado(estado) {
      const colores = {
        "ALMACÉN": "blue",
        "RESERVADO": "orange",
        "EN USO": "teal",
        "PENDIENTE RECOJO": "amber darken-2"
      };
      return colores[estado] || "grey";
    },

    // Validaciones de acciones
    puedeAsignar(item) {
      return item.condicion === "OPERATIVO" && item.estado === "ALMACÉN";
    },

    puedeConfirmarEntrega(item) {
      return item.estado === "RESERVADO";
    },

    puedeDevolver(item) {
      return item.estado === "EN USO" || item.estado === "RESERVADO";
    },

    puedeCompletarRecojo(item) {
      return item.estado === "PENDIENTE RECOJO";
    },

    puedeEnviarMantenimiento(item) {
      return item.estado === "ALMACÉN" && (item.condicion === "AVERIADO" || item.condicion === "OPERATIVO");
    },

    puedeCompletarReparacion(item) {
      return item.condicion === "EN MANTENIMIENTO";
    },

    // Acciones
    abrirNuevoEquipo() {
      this.equipoEditar = null;
      this.dialogNuevoEquipo = true;
    },

    editarEquipo(item) {
      this.equipoEditar = { ...item };
      this.dialogNuevoEquipo = true;
    },

    verDetalle(item) {
      this.equipoSeleccionado = item;
      this.dialogDetalle = true;
    },

    abrirAsignacion(item) {
      this.equipoSeleccionado = item;
      this.dialogAsignar = true;
    },

    abrirConfirmarEntrega(item) {
      this.equipoSeleccionado = item;
      this.dialogConfirmarEntrega = true;
    },

    abrirDevolucion(item) {
      this.equipoSeleccionado = item;
      this.dialogDevolucion = true;
    },

    abrirCompletarRecojo(item) {
      this.equipoSeleccionado = item;
      this.dialogCompletarRecojo = true;
    },

    abrirMantenimiento(item) {
      this.equipoSeleccionado = item;
      this.dialogMantenimiento = true;
    },

    abrirCompletarReparacion(item) {
      this.equipoSeleccionado = item;
      this.dialogCompletarReparacion = true;
    },

    verHistorial(item) {
      this.equipoSeleccionado = item;
      this.dialogHistorial = true;
    },

    // Callbacks de dialogs
    onEquipoGuardado() {
      this.$store.commit("dialogosnackbar", "Equipo guardado correctamente");
      this.dialogNuevoEquipo = false;
    },

    onEquipoAsignado() {
      this.$store.commit("dialogosnackbar", "Equipo asignado correctamente");
      this.dialogAsignar = false;
    },

    onEntregaConfirmada() {
      this.$store.commit("dialogosnackbar", "Entrega confirmada correctamente");
      this.dialogConfirmarEntrega = false;
    },

    onEquipoDevuelto() {
      this.$store.commit("dialogosnackbar", "Devolución registrada correctamente");
      this.dialogDevolucion = false;
    },

    onRecojoCompletado() {
      this.dialogCompletarRecojo = false;
    },

    onMantenimientoEnviado() {
      this.$store.commit("dialogosnackbar", "Equipo enviado a mantenimiento");
      this.dialogMantenimiento = false;
    },

    onReparacionCompletada() {
      this.$store.commit("dialogosnackbar", "Reparación completada");
      this.dialogCompletarReparacion = false;
    },
    recargarEquipos() {
      detenerEscuchaEquipos();
      this.cargarEquipos();
    }
  }
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.9;
}
</style>
