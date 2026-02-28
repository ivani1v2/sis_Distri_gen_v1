<template>
  <div class="pa-4">
    <v-card outlined class="pa-4 mb-4">
      <v-row align="center">
        <v-col cols="12" md="4" class="text-center text-md-left">
          <h2 class="text-h6">Bonos y Precios Globales</h2>
        </v-col>
        <v-col cols="12" md="8">
          <v-row class="justify-center justify-md-end" dense>
            <v-col cols="6" md="auto">
              <v-btn block color="primary" @click="abrirNuevo">
                <v-icon left>mdi-plus</v-icon>
                Nuevo
              </v-btn>
            </v-col>
            <v-col cols="6" md="auto">
              <v-btn block color="green" dark @click="exportarExcel" :loading="exportando">
                <v-icon left>mdi-microsoft-excel</v-icon>
                Exportar
              </v-btn>
            </v-col>
            <v-col cols="6" md="auto">
              <v-btn block color="success" :disabled="!seleccionados.length" @click="activarMasivo(true)">
                <v-icon left>mdi-check-all</v-icon>
                Activar ({{ seleccionados.length }})
              </v-btn>
            </v-col>
            <v-col cols="6" md="auto">
              <v-btn block color="error" :disabled="!seleccionados.length" @click="activarMasivo(false)">
                <v-icon left>mdi-close-box-multiple</v-icon>
                Desactivar
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>

    <v-card outlined class="pa-3">
      <v-row no-gutters>
        <v-col cols="12" sm="3" class="pb-1 pb-sm-0 pr-sm-2">
          <v-autocomplete v-model="filtroProductos" :items="productosItems" :item-text="p => p.id + ' - ' + p.nombre"
            item-value="id" multiple chips small-chips deletable-chips outlined dense clearable
            label="Filtrar por Producto" prepend-inner-icon="mdi-package-variant">
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title>{{ item.id }} - {{ item.nombre }}</v-list-item-title>
              </v-list-item-content>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="3" class="pb-1 pb-sm-0 px-sm-2">
          <v-autocomplete v-model="filtroProveedores" :items="proveedoresItems" multiple chips small-chips
            deletable-chips outlined dense clearable label="Filtrar por Proveedor" prepend-inner-icon="mdi-truck" />
        </v-col>
        <v-col cols="12" sm="3" class="pb-1 pb-sm-0 px-sm-2">
          <v-text-field v-model="filtroNombre" outlined dense clearable label="Buscar por nombre"
            prepend-inner-icon="mdi-magnify" />
        </v-col>
        <v-col cols="12" sm="3" class="pb-0 pb-sm-0 pl-sm-2">
          <v-btn-toggle v-model="filtroEstado" mandatory dense class="d-flex justify-center justify-sm-start">
            <v-btn small value="todos">Todos</v-btn>
            <v-btn small value="activos" color="success">Activos</v-btn>
            <v-btn small value="inactivos" color="error">Inactivos</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
    </v-card>


    <v-card outlined class="d-none d-md-block">
      <v-data-table v-model="seleccionados" :headers="headers" :items="movimientosFiltrados" dense class="elevation-1"
        show-select item-key="id" :items-per-page="15">

        <template v-slot:[`item.activo`]="{ item }">
          <v-chip x-small :color="item.activo ? 'success' : 'error'" text-color="white">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
          <v-chip x-small v-if="estaVencido(item)" color="warning" text-color="white" class="ml-1">
            Vencido
          </v-chip>
        </template>

        <template v-slot:[`item.tipo`]="{ item }">
          <v-chip x-small :color="item.tipo === 'precio' ? 'blue' : 'orange'" text-color="white">
            <v-icon x-small left>{{ item.tipo === 'precio' ? 'mdi-tag-multiple' : 'mdi-gift' }}</v-icon>
            {{ item.tipo === 'precio' ? 'Precio' : 'Bono' }}
          </v-chip>
        </template>

        <template v-slot:[`item.observacion`]="{ item }">
          <span class="text-caption">{{ item.observacion || '-' }}</span>
        </template>

        <template v-slot:[`item.proveedor`]="{ item }">
          <span class="text-caption">{{ item.proveedor || '-' }}</span>
        </template>

        <template v-slot:[`item.fecha_vencimiento`]="{ item }">
          <span v-if="item.fecha_vencimiento" class="text-caption">
            {{ formatearFecha(item.fecha_vencimiento) }}
          </span>
          <span v-else class="text-caption grey--text">-</span>
        </template>

        <template v-slot:[`item.productos_asignados`]="{ item }">
          <v-chip x-small outlined color="primary" @click="verProductosAsignados(item)">
            <v-icon x-small left class="mr-1">mdi-package-variant</v-icon>
            {{ contarProductosAsignados(item) }}
          </v-chip>
        </template>

        <template v-slot:[`item.accion`]="{ item }">
          <v-menu bottom left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon small v-bind="attrs" v-on="on">
                <v-icon small>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item @click="editarTransferencia(item)">
                <v-list-item-icon><v-icon color="orange">mdi-pencil</v-icon></v-list-item-icon>
                <v-list-item-content>Editar</v-list-item-content>
              </v-list-item>
              <v-list-item @click="verProductosAsignados(item)">
                <v-list-item-icon><v-icon color="blue">mdi-eye</v-icon></v-list-item-icon>
                <v-list-item-content>Ver Productos</v-list-item-content>
              </v-list-item>
              <v-list-item @click="toggleActivo(item)">
                <v-list-item-icon>
                  <v-icon :color="item.activo ? 'error' : 'success'">
                    {{ item.activo ? 'mdi-close-circle' : 'mdi-check-circle' }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>{{ item.activo ? 'Desactivar' : 'Activar' }}</v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <v-card outlined class="d-md-none">
      <v-toolbar dense flat color="grey lighten-4" v-if="seleccionados.length">
        <v-btn text small @click="seleccionados = []" color="grey">
          <v-icon left small>mdi-close</v-icon>Deseleccionar ({{ seleccionados.length }})
        </v-btn>
      </v-toolbar>
      <div style="max-height: 60vh; overflow-y: auto;">
        <v-list dense class="py-0">
          <div v-for="(item, index) in movimientosFiltrados" :key="'mobile-' + item.id">
            <v-list-item class="py-2" @click="verProductosAsignados(item)">
              <v-list-item-action class="mr-2 my-0" @click.stop>
                <v-checkbox :input-value="estaSeleccionado(item)" @change="toggleSeleccion(item, $event)" dense
                  hide-details></v-checkbox>
              </v-list-item-action>
              <v-list-item-content class="py-0">
                <div class="d-flex align-center mb-1">
                  <v-chip x-small :color="item.tipo === 'precio' ? 'blue' : 'orange'" text-color="white" class="mr-2">
                    {{ item.tipo === 'precio' ? 'Precio' : 'Bono' }}
                  </v-chip>
                  <v-chip x-small :color="item.activo ? 'success' : 'error'">
                    {{ item.activo ? 'Activo' : 'Inactivo' }}
                  </v-chip>
                  <v-chip x-small v-if="estaVencido(item)" color="warning" class="ml-1">Vencido</v-chip>
                </div>
                <div class="font-weight-medium text-body-2">{{ item.nombre }}</div>
                <div class="text-caption grey--text" v-if="item.proveedor">{{ item.proveedor }}</div>
                <div class="text-caption grey--text text--darken-1" v-if="item.observacion">{{ item.observacion }}</div>
                <div class="text-caption">
                  <v-icon x-small>mdi-package-variant</v-icon> {{ contarProductosAsignados(item) }} productos
                </div>
                <div class="text-caption" v-if="item.fecha_vencimiento">
                  <v-icon x-small>mdi-calendar</v-icon> {{ formatearFecha(item.fecha_vencimiento) }}
                </div>
              </v-list-item-content>
              <v-list-item-action class="my-0">
                <v-menu bottom left>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn icon small v-bind="attrs" v-on="on" @click.stop>
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list dense>
                    <v-list-item @click="editarTransferencia(item)">
                      <v-list-item-icon><v-icon small color="orange">mdi-pencil</v-icon></v-list-item-icon>
                      <v-list-item-content>Editar</v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="verProductosAsignados(item)">
                      <v-list-item-icon><v-icon small color="blue">mdi-eye</v-icon></v-list-item-icon>
                      <v-list-item-content>Ver Productos</v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="toggleActivo(item)">
                      <v-list-item-icon>
                        <v-icon small :color="item.activo ? 'error' : 'success'">
                          {{ item.activo ? 'mdi-close-circle' : 'mdi-check-circle' }}
                        </v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>{{ item.activo ? 'Desactivar' : 'Activar' }}</v-list-item-content>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item @click="anularTransferencia(item)">
                      <v-list-item-icon><v-icon small color="red">mdi-delete</v-icon></v-list-item-icon>
                      <v-list-item-content>Eliminar</v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list-item-action>
            </v-list-item>
            <v-divider v-if="index < movimientosFiltrados.length - 1"></v-divider>
          </div>
          <v-list-item v-if="!movimientosFiltrados.length">
            <v-list-item-content class="text-center grey--text py-4">
              No hay bonos para mostrar
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-card>

    <dial_config_bono v-model="dial_mov" :bono="bonoSeleccionado" :proveedoresItems="proveedoresItems"
      :productos="productosItems" :editando="!!editId" @guardar="guardarBonoHandler" />

    <VisorProductosBono v-model="dialVisorProductos" :bono="bonoSeleccionado" />
  </div>
</template>

<script>
import store from "@/store";
import { allBono, nuevoBono, eliminabono } from "../../db";
import VisorProductosBono from './components/VisorProductosBono.vue';
import dial_agregar_regla from "./dialogos/dial_agregar_regla.vue";
import dial_config_bono from "./dialogos/dial_config_bono.vue";
import * as XLSX from 'xlsx';

export default {
  components: {
    VisorProductosBono,
    dial_agregar_regla,
    dial_config_bono,
  },
  data() {
    return {
      dial_mov: false,
      dialVisorProductos: false,
      headers: [
        { text: "Código", value: "codigo", width: 90, align: 'center' },
        { text: "Tipo", value: "tipo", width: 90, align: 'center' },
        { text: "Estado", value: "activo", width: 100, align: 'center' },
        { text: "Nombre", value: "nombre", width: 180 },
        { text: "Observación", value: "observacion", width: 200 },
        { text: "Proveedor", value: "proveedor", width: 130 },
        { text: "Vence", value: "fecha_vencimiento", width: 100, align: 'center' },
        { text: "Productos", value: "productos_asignados", width: 90, sortable: false, align: 'center' },
        { text: "", value: "accion", sortable: false, align: "center", width: 60 },
      ],
      movimientos: [],
      seleccionados: [],
      bonoSeleccionado: {},
      filtroProductos: [],
      filtroProveedores: [],
      filtroNombre: '',
      filtroEstado: 'todos',
      editIndex: -1,
      editId: null,
      exportando: false,
      modo_bono: 'precio',
      array_bono2: [],
      activo: true,
      nombre: '',
      observacion: '',
      proveedor: null,
      fecha_vencimiento: null,
      escala_may1: null,
      precio_may1: null,
      escala_may2: null,
      precio_may2: null,
      producto_sele: null,
      apartir_de: null,
      cantidad_bono: null,
      cantidad_max: null,
      editTipo: null,
    };
  },

  computed: {
    hoy() {
      return new Date().toISOString().substr(0, 10);
    },
    productosItems() {
      return store.state.productos || [];
    },
    proveedoresItems() {
      const provs = new Set();
      (store.state.productos || []).forEach(p => {
        if (p.proveedor) provs.add(p.proveedor);
      });
      return Array.from(provs).sort();
    },
    diasRestantes() {
      if (!this.fecha_vencimiento) return 0;
      const hoy = new Date();
      const venc = new Date(this.fecha_vencimiento);
      const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
      return diff;
    },
    esFechaProxima() {
      return this.diasRestantes <= 7 && this.diasRestantes > 0;
    },
    movimientosFiltrados() {
      let lista = [...this.movimientos];

      if (this.filtroEstado === 'activos') {
        lista = lista.filter(m => m.activo && !this.estaVencido(m));
      } else if (this.filtroEstado === 'inactivos') {
        lista = lista.filter(m => !m.activo || this.estaVencido(m));
      }

      if (this.filtroNombre) {
        const q = this.filtroNombre.toLowerCase();
        lista = lista.filter(m =>
          (m.nombre || '').toLowerCase().includes(q) ||
          (m.codigo || '').toLowerCase().includes(q)
        );
      }

      if (this.filtroProveedores && this.filtroProveedores.length) {
        lista = lista.filter(m => this.filtroProveedores.includes(m.proveedor));
      }

      if (this.filtroProductos && this.filtroProductos.length) {
        lista = lista.filter(m => {
          const productosAsignados = this.obtenerProductosAsignados(m);
          return this.filtroProductos.some(pId => productosAsignados.includes(pId));
        });
      }

      return lista;
    }
  },

  async mounted() {
    await this.cargarMovimientos();
  },

  methods: {
    async cargarMovimientos() {
      try {
        const snap = await allBono().once("value");
        const val = typeof snap.val === "function" ? snap.val() : null;

        let arr = [];
        if (Array.isArray(val)) {
          arr = val.filter(Boolean).map(v => ({
            ...v,
            id: v.codigo || v.id,
            codigo: v.codigo || v.id,
          }));
        } else if (val && typeof val === "object") {
          arr = Object.entries(val).map(([key, v]) => ({
            ...v,
            id: key,
            codigo: v?.codigo || key,
          }));
        }

        for (const bono of arr) {
          if (bono.fecha_vencimiento && bono.activo) {
            const vencido = new Date(bono.fecha_vencimiento) < new Date();
            if (vencido && bono.activo) {
              await nuevoBono(bono.codigo, { ...bono, activo: false });
              bono.activo = false;
            }
          }
        }

        arr.sort((a, b) => this._suffixNum(a.codigo) - this._suffixNum(b.codigo));
        this.movimientos = arr;
      } catch (e) {
        console.error(e);
        this._toast("No se pudo cargar la lista de programaciones.");
        this.movimientos = [];
      }
    },

    obtenerProductosAsignados(bono) {
      const codigo = bono.codigo;
      const tipo = bono.tipo;
      return (store.state.productos || [])
        .filter(p => tipo === 'precio' ? p.grupo_precio === codigo : p.grupo_bono === codigo)
        .map(p => p.id);
    },

    contarProductosAsignados(bono) {
      return this.obtenerProductosAsignados(bono).length;
    },

    verProductosAsignados(bono) {
      this.bonoSeleccionado = bono;
      this.dialVisorProductos = true;
    },

    estaSeleccionado(item) {
      return this.seleccionados.some(s => s.id === item.id);
    },

    toggleSeleccion(item, checked) {
      if (checked) {
        if (!this.estaSeleccionado(item)) {
          this.seleccionados.push(item);
        }
      } else {
        const idx = this.seleccionados.findIndex(s => s.id === item.id);
        if (idx !== -1) {
          this.seleccionados.splice(idx, 1);
        }
      }
    },

    estaVencido(bono) {
      if (!bono.fecha_vencimiento) return false;
      return new Date(bono.fecha_vencimiento) < new Date();
    },

    formatearFecha(fecha) {
      if (!fecha) return '';
      return new Date(fecha).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },

    async toggleActivo(item) {
      const nuevoEstado = !item.activo;

      if (nuevoEstado && this.estaVencido(item)) {
        alert('Este bono está vencido. Primero debe cambiar la fecha de vencimiento a una fecha posterior para poder activarlo.');
        return;
      }

      store.commit("dialogoprogress");
      try {
        await nuevoBono(item.codigo, { ...item, activo: nuevoEstado });
        await this.cargarMovimientos();
        this.seleccionados = [];
        this._toast(nuevoEstado ? 'Bono activado' : 'Bono desactivado');
      } catch (e) {
        console.error(e);
        this._toast("Error al cambiar estado");
      }
      store.commit("dialogoprogress");
    },

    async activarMasivo(activar) {
      if (!this.seleccionados.length) return;

      if (activar) {
        const vencidos = this.seleccionados.filter(item => this.estaVencido(item));
        if (vencidos.length > 0) {
          alert(`Hay ${vencidos.length} bono(s) vencido(s) seleccionado(s). Debe cambiar la fecha de vencimiento antes de activarlos.`);
          return;
        }
      }

      const confirmMsg = activar
        ? `¿Activar ${this.seleccionados.length} bono(s)?`
        : `¿Desactivar ${this.seleccionados.length} bono(s)?`;

      if (!confirm(confirmMsg)) return;

      store.commit("dialogoprogress");
      try {
        for (const item of this.seleccionados) {
          await nuevoBono(item.codigo, { ...item, activo: activar });
        }
        await this.cargarMovimientos();
        this.seleccionados = [];
        this._toast(activar ? 'Bonos activados correctamente' : 'Bonos desactivados correctamente');
      } catch (e) {
        console.error(e);
        this._toast("Error en operación masiva");
      }
      store.commit("dialogoprogress");
    },
    _suffixNum(cod) {
      if (!cod || typeof cod !== "string") return 0;
      const m = cod.match(/^[A-Z](\d+)$/i);
      return m ? Number(m[1]) : 0;
    },
    _nextCodigo(tipo) {
      const pref = tipo === "precio" ? "P" : "B";
      const nums = (this.movimientos || [])
        .filter(m => m?.tipo === tipo && typeof (m.codigo || m.id) === "string")
        .map(m => this._suffixNum(m.codigo || m.id))
        .filter(n => Number.isFinite(n));
      const max = nums.length ? Math.max(...nums) : 0;
      const next = max + 1;
      return `${pref}${String(next).padStart(5, "0")}`;
    },

    _resetForm() {
      this.modo_bono = "precio";
      this.bonoSeleccionado = {};
      //this.proveedoresItems = [];
      //this.productosItems = [];
      this.seleccionados = [];
      this.activo = true;
      this.nombre = "";
      this.observacion = "";
      this.proveedor = null;
      this.fecha_vencimiento = null;

      this.escala_may1 = null;
      this.precio_may1 = null;
      this.escala_may2 = null;
      this.precio_may2 = null;

      this.producto_sele = null;
      this.apartir_de = null;
      this.cantidad_bono = null;
      this.cantidad_max = null;
      this.array_bono2 = [];

      this.editIndex = -1;
      this.editId = null;
      this.editTipo = null;
    },

    abrirNuevo() {
      this._resetForm();
      this.dial_mov = true;
    },
    getNextGroupId(tipo) {
      const count = (this.movimientos || []).filter((m) => m && m.tipo === tipo).length;
      return count + 1;
    },
    editarTransferencia(item) {
      console.log('Editando item:', item);
      const idx = this.movimientos.findIndex((x) => String(x.id) === String(item.id));
      if (idx < 0) return;

      this._resetForm();
      this.editIndex = idx;
      this.editId = item.id;
      this.editTipo = item.tipo;
      this.modo_bono = item.tipo;
      this.activo = !!item.activo;
      this.nombre = item.nombre || "";
      this.observacion = item.observacion || "";
      this.proveedor = item.proveedor || null;
      this.fecha_vencimiento = item.fecha_vencimiento || null;
      if (item.tipo === "precio") {
        this.escala_may1 = item.escala_may1 || null;
        this.precio_may1 = item.precio_may1 || null;
        this.escala_may2 = item.escala_may2 || null;
        this.precio_may2 = item.precio_may2 || null;
        this.array_bono2 = [];
      } else {
        this.array_bono2 = Array.isArray(item.data) ? item.data : [];
        this.escala_may1 = null;
        this.precio_may1 = null;
        this.escala_may2 = null;
        this.precio_may2 = null;
      }
      this.bonoSeleccionado = { ...item };
      console.log('Datos asignados:', {
        nombre: this.nombre,
        modo_bono: this.modo_bono,
        array_bono2: this.array_bono2,
        escala_may1: this.escala_may1
      });
      this.dial_mov = true;
    },
    async anularTransferencia(item) {
      if (confirm('¿Seguro de eliminar este bono?')) {
        store.commit("dialogoprogress");
        await eliminabono(item.id);
        this.cargarMovimientos();
        store.commit("dialogoprogress");
      }
    },

    async guardarBonoHandler(bonoData) {
      if (!bonoData.nombre?.trim()) {
        this._toast("Escribe un nombre.");
        return;
      }

      store.commit("dialogoprogress");

      try {
        const payload = {
          ...bonoData,
          creado: Date.now(),
          usuario: store?.state?.usuario || null,
        };

        if (this.editId) {
          const anterior = this.movimientos[this.editIndex] || {};
          const oldKey = anterior.codigo || anterior.id;

          if (anterior.tipo === payload.tipo) {
            payload.codigo = oldKey;
            payload.id = oldKey;
            payload.id_grupo = anterior.id_grupo ?? this.getNextGroupId(payload.tipo);
            await nuevoBono(oldKey, payload);
          } else {
            const newCode = this._nextCodigo(payload.tipo);
            payload.codigo = newCode;
            payload.id = newCode;
            payload.id_grupo = this.getNextGroupId(payload.tipo);
            await nuevoBono(newCode, payload);
            await nuevoBono(oldKey, null);
          }
        } else {
          const newCode = this._nextCodigo(payload.tipo);
          payload.codigo = newCode;
          payload.id = newCode;
          payload.id_grupo = this.getNextGroupId(payload.tipo);
          await nuevoBono(newCode, payload);
        }

        await this.cargarMovimientos();
        this._toast("Guardado correctamente");
        this.dial_mov = false;
      } catch (e) {
        console.error(e);
        this._toast("Error al guardar la programación.");
      } finally {
        store.commit("dialogoprogress");
      }
    },

    _toast(msg) {
      if (this.$store?.commit) {
        this.$store.commit("dialogosnackbar", msg);
      } else {
        console.log(msg);
      }
    },

    vernombre(idProd) {
      return store.state.productos.find((x) => x.id === idProd)?.nombre || "Sin Nombre";
    },

    async exportarExcel() {
      try {
        this.exportando = true;
        const productos = store.state.productos || [];
        const productosMap = productos.reduce((map, prod) => {
          map[prod.id] = prod;
          return map;
        }, {});
        const datosExportar = [];

        this.movimientosFiltrados.forEach(bono => {
          let estado = bono.activo ? 'Activo' : 'Inactivo';
          if (bono.activo && this.estaVencido(bono)) {
            estado = 'Vencido';
          }
          if (bono.tipo === 'bono' && Array.isArray(bono.data)) {
            bono.data.forEach((regla, indexRegla) => {
              const productosAsignados = this.obtenerProductosAsignados(bono);
              let nombreProductoRegla = 'Bono general';
              if (regla.codigo) {
                const productoRegla = productosMap[regla.codigo];
                if (productoRegla) {
                  nombreProductoRegla = productoRegla.nombre || productoRegla.id || regla.codigo;
                } else {
                  const prodEncontrado = productos.find(p => p.id === regla.codigo);
                  nombreProductoRegla = prodEncontrado ? prodEncontrado.nombre : regla.codigo;
                }
              }
              const nombresProductosAfectados = productosAsignados
                .map(id => {
                  const prod = productosMap[id];
                  return prod ? prod.nombre : id;
                })
                .join(', ');

              datosExportar.push({
                'Código Bono': bono.codigo || '',
                'Tipo': 'Bono',
                'Estado': estado,
                'Nombre Bono': bono.nombre || '',
                'Observación': bono.observacion || '',
                'Proveedor': bono.proveedor || '',
                'Fecha Vencimiento': bono.fecha_vencimiento ? this.formatearFechaExcel(bono.fecha_vencimiento) : '',
                'Regla N°': indexRegla + 1,
                'Producto en Regla': nombreProductoRegla,
                'A partir de (und)': regla.apartir_de || 0,
                'Cantidad a recibir': regla.cantidad_bono || 0,
                'Límite máximo': regla.cantidad_max || 'Sin límite',
                'Escala 1 (und)': '-',
                'Precio escala 1': '-',
                'Escala 2 (und)': '-',
                'Precio escala 2': '-',
                'Productos Afectados': productosAsignados.length,
                'Lista Productos Afectados': nombresProductosAfectados,
                'Creado': bono.creado ? new Date(bono.creado).toLocaleDateString() : '',
              });
            });
          } else if (bono.tipo === 'precio') {
            const productosAsignados = this.obtenerProductosAsignados(bono);
            const nombresProductos = productosAsignados
              .map(id => {
                const prod = productosMap[id];
                return prod ? prod.nombre : id;
              })
              .join(', ');

            datosExportar.push({
              'Código Bono': bono.codigo || '',
              'Tipo': 'Precio',
              'Estado': estado,
              'Nombre Bono': bono.nombre || '',
              'Observación': bono.observacion || '',
              'Proveedor': bono.proveedor || '',
              'Fecha Vencimiento': bono.fecha_vencimiento ? this.formatearFechaExcel(bono.fecha_vencimiento) : '',
              'Regla N°': '-',
              'Producto en Regla': 'Precio por escala',
              'A partir de (und)': '-',
              'Cantidad a recibir': '-',
              'Límite máximo': '-',
              'Escala 1 (und)': bono.escala_may1 || '-',
              'Precio escala 1': bono.precio_may1 ? `S/ ${bono.precio_may1}` : '-',
              'Escala 2 (und)': bono.escala_may2 || '-',
              'Precio escala 2': bono.precio_may2 ? `S/ ${bono.precio_may2}` : '-',
              'Productos Afectados': productosAsignados.length,
              'Lista Productos Afectados': nombresProductos,
              'Creado': bono.creado ? new Date(bono.creado).toLocaleDateString() : '',
            });
          }
        });
        const wb = XLSX.utils.book_new();
        if (datosExportar.length === 0) {
          const ws = XLSX.utils.aoa_to_sheet([
            ['REPORTE DETALLADO DE BONOS Y PRECIOS'],
            ['Fecha exportación:', new Date().toLocaleDateString('es-PE')],
            ['Hora exportación:', new Date().toLocaleTimeString('es-PE')],
            ['Filtro estado:', this.filtroEstado === 'todos' ? 'Todos' : (this.filtroEstado === 'activos' ? 'Activos' : 'Inactivos')],
            ['Filtro productos:', this.filtroProductos.length > 0 ? this.filtroProductos.length + ' seleccionados' : 'Ninguno'],
            ['Filtro proveedores:', this.filtroProveedores.length > 0 ? this.filtroProveedores.join(', ') : 'Ninguno'],
            ['Búsqueda nombre:', this.filtroNombre || 'Ninguna'],
            ['Total registros:', 0],
            [''],
            ['No hay datos para exportar con los filtros aplicados']
          ]);

          XLSX.utils.book_append_sheet(wb, ws, 'Bonos y Precios');
        } else {
          const ws = XLSX.utils.json_to_sheet(datosExportar);
          const wscols = [
            { wch: 12 },
            { wch: 8 },
            { wch: 10 },
            { wch: 25 },
            { wch: 25 },
            { wch: 20 },
            { wch: 15 },
            { wch: 8 },
            { wch: 30 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 50 },
            { wch: 12 },
            { wch: 15 }
          ];
          ws['!cols'] = wscols;
          const encabezadoInfo = [
            ['REPORTE DETALLADO DE BONOS Y PRECIOS'],
            ['Se muestra una fila por cada regla en los bonos'],
            ['Fecha exportación:', new Date().toLocaleDateString('es-PE')],
            ['Hora exportación:', new Date().toLocaleTimeString('es-PE')],
            ['Filtro estado:', this.filtroEstado === 'todos' ? 'Todos' : (this.filtroEstado === 'activos' ? 'Activos' : 'Inactivos')],
            ['Filtro productos:', this.filtroProductos.length > 0 ? this.filtroProductos.length + ' seleccionados' : 'Ninguno'],
            ['Filtro proveedores:', this.filtroProveedores.length > 0 ? this.filtroProveedores.join(', ') : 'Ninguno'],
            ['Búsqueda nombre:', this.filtroNombre || 'Ninguna'],
            ['Total registros:', datosExportar.length],
            ['']
          ];
          const hojaCompleta = XLSX.utils.aoa_to_sheet([]);
          XLSX.utils.sheet_add_aoa(hojaCompleta, encabezadoInfo, { origin: 'A1' });
          const inicioDatos = encabezadoInfo.length + 1;
          XLSX.utils.sheet_add_json(hojaCompleta, datosExportar, { origin: `A${inicioDatos}` });
          hojaCompleta['!autofilter'] = {
            ref: `A${inicioDatos}:T${inicioDatos}`
          };

          XLSX.utils.book_append_sheet(wb, hojaCompleta, 'Bonos y Precios');
          const resumenBonos = this.crearResumenBonos(datosExportar);
          const wsResumen = XLSX.utils.json_to_sheet(resumenBonos);
          XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por Bono');
        }
        const fecha = new Date().toISOString().split('T')[0];
        const hora = new Date().toLocaleTimeString('es-PE').replace(/:/g, '-').split(' ')[0];
        const nombreArchivo = `Bonos_Precios_Detalle_${fecha}_${hora}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        this._toast(`Exportado ${datosExportar.length} registros a Excel`);
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        this._toast('Error al exportar a Excel');
      } finally {
        this.exportando = false;
      }
    },

    crearResumenBonos(datosDetalle) {
      const resumenMap = new Map();
      datosDetalle.forEach(fila => {
        const codigoBono = fila['Código Bono'];
        if (!resumenMap.has(codigoBono)) {
          resumenMap.set(codigoBono, {
            'Código Bono': codigoBono,
            'Tipo': fila['Tipo'],
            'Estado': fila['Estado'],
            'Nombre Bono': fila['Nombre Bono'],
            'Proveedor': fila['Proveedor'],
            'Fecha Vencimiento': fila['Fecha Vencimiento'],
            'Total Reglas': 0,
            'Total Productos Afectados': 0,
            'Detalle': ''
          });
        }
        const resumen = resumenMap.get(codigoBono);
        if (fila['Tipo'] === 'Bono' && fila['Regla N°'] !== '-') {
          resumen['Total Reglas'] += 1;
        } else if (fila['Tipo'] === 'Precio') {
          resumen['Total Reglas'] = 1;
        }
        resumen['Total Productos Afectados'] = Math.max(
          resumen['Total Productos Afectados'],
          fila['Productos Afectados'] || 0
        );
        let detalle = '';
        if (fila['Tipo'] === 'Bono' && fila['Regla N°'] !== '-') {
          detalle = `Regla ${fila['Regla N°']}: ${fila['A partir de (und)']} und → ${fila['Cantidad a recibir']}x ${fila['Producto en Regla']}`;
          if (fila['Límite máximo'] !== 'Sin límite' && fila['Límite máximo'] !== '-') {
            detalle += ` (Max: ${fila['Límite máximo']})`;
          }
        } else if (fila['Tipo'] === 'Precio') {
          detalle = `Escala1: ${fila['Escala 1 (und)']} und → ${fila['Precio escala 1']}`;
          if (fila['Escala 2 (und)'] !== '-') {
            detalle += ` | Escala2: ${fila['Escala 2 (und)']} und → ${fila['Precio escala 2']}`;
          }
        }
        if (resumen['Detalle']) {
          resumen['Detalle'] += ' | ' + detalle;
        } else {
          resumen['Detalle'] = detalle;
        }
      });

      return Array.from(resumenMap.values());
    },
    formatearFechaExcel(fecha) {
      if (!fecha) return '';
      const d = new Date(fecha);
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
  },
};
</script>
<style scoped>
.w-full {
  width: 100%;
}

.lh-1 {
  line-height: 1.1;
}

.border-subtle {
  border: 1px solid #e0e0e0 !important;
}

.border-blue {
  border: 1px solid #90caf9 !important;
  border-top: 4px solid #1976d2 !important;
}

.v-btn-toggle .v-btn {
  height: 36px !important;
}
</style>