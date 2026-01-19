<template>
  <div class="pa-4">
    <v-card outlined class="pa-4 mb-4">
      <v-row justify="space-between" align="center">
        <v-col cols="12" sm="4">
          <h2 class="text-h6">Bonos y Precios Globales</h2>
        </v-col>
        <v-col cols="12" sm="8" class="text-right">
          <v-btn color="primary" @click="abrirNuevo()" class="mr-2">
            <v-icon left>mdi-plus</v-icon>Nuevo Movimiento
          </v-btn>
          <v-btn color="success" :disabled="!seleccionados.length" @click="activarMasivo(true)">
            <v-icon left>mdi-check-all</v-icon>Activar ({{ seleccionados.length }})
          </v-btn>
          <v-btn color="error" class="ml-2" :disabled="!seleccionados.length" @click="activarMasivo(false)">
            <v-icon left>mdi-close-box-multiple</v-icon>Desactivar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card outlined class="pa-3 mb-4">
      <v-row dense align="center">
        <v-col cols="12" sm="3">
          <v-autocomplete v-model="filtroProductos" :items="productosItems" item-text="nombre" item-value="id" multiple
            chips small-chips deletable-chips outlined dense clearable label="Filtrar por Producto"
            prepend-inner-icon="mdi-package-variant" :menu-props="{ maxHeight: 300 }">
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="3">
          <v-autocomplete v-model="filtroProveedores" :items="proveedoresItems" multiple chips small-chips
            deletable-chips outlined dense clearable label="Filtrar por Proveedor"
            prepend-inner-icon="mdi-truck"></v-autocomplete>
        </v-col>
        <v-col cols="12" sm="3">
          <v-text-field v-model="filtroNombre" outlined dense clearable label="Buscar por nombre"
            prepend-inner-icon="mdi-magnify"></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-btn-toggle v-model="filtroEstado" mandatory dense>
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

        <template v-slot:item.activo="{ item }">
          <v-chip x-small :color="item.activo ? 'success' : 'error'" text-color="white">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
          <v-chip x-small v-if="estaVencido(item)" color="warning" text-color="white" class="ml-1">
            Vencido
          </v-chip>
        </template>

        <template v-slot:item.tipo="{ item }">
          <v-chip x-small :color="item.tipo === 'precio' ? 'blue' : 'orange'" text-color="white">
            <v-icon x-small left>{{ item.tipo === 'precio' ? 'mdi-tag-multiple' : 'mdi-gift' }}</v-icon>
            {{ item.tipo === 'precio' ? 'Precio' : 'Bono' }}
          </v-chip>
        </template>

        <template v-slot:item.observacion="{ item }">
          <span class="text-caption">{{ item.observacion || '-' }}</span>
        </template>

        <template v-slot:item.proveedor="{ item }">
          <span class="text-caption">{{ item.proveedor || '-' }}</span>
        </template>

        <template v-slot:item.fecha_vencimiento="{ item }">
          <span v-if="item.fecha_vencimiento" class="text-caption">
            {{ formatearFecha(item.fecha_vencimiento) }}
          </span>
          <span v-else class="text-caption grey--text">-</span>
        </template>

        <template v-slot:item.productos_asignados="{ item }">
          <v-chip x-small outlined color="primary" @click="verProductosAsignados(item)">
            <v-icon x-small left class="mr-1">mdi-package-variant</v-icon>
            {{ contarProductosAsignados(item) }}
          </v-chip>
        </template>

        <template v-slot:item.accion="{ item }">
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
              <v-divider></v-divider>
              <v-list-item @click="anularTransferencia(item)">
                <v-list-item-icon><v-icon color="red">mdi-delete</v-icon></v-list-item-icon>
                <v-list-item-content>Eliminar</v-list-item-content>
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

    <v-dialog v-model="dial_mov" max-width="750px" persistent>
      <div>
        <v-system-bar window dark>
          <v-icon @click="dial_mov = false">mdi-close</v-icon>
          <v-switch v-model="activo" color="green" label="Activo" class="ml-3"></v-switch>
          <v-spacer></v-spacer>
          <v-radio-group class="mt-4" v-model="modo_bono" row dense>
            <v-radio label="Precio" value="precio"></v-radio>
            <v-radio label="Bono" value="bono"></v-radio>
          </v-radio-group>
        </v-system-bar>
      </div>

      <v-card>
        <v-card-text class="pa-4 pa-sm-6">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field dense outlined v-model="nombre" label="Nombre *"
                prepend-inner-icon="mdi-tag"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete dense outlined v-model="proveedor" :items="proveedoresItems" clearable label="Proveedor"
                prepend-inner-icon="mdi-truck"></v-autocomplete>
            </v-col>
            <v-col cols="12">
              <v-textarea dense outlined v-model="observacion" auto-grow filled label="Observación"
                rows="1"></v-textarea>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu v-model="menuFechaVencimiento" :close-on-content-click="false" transition="scale-transition"
                offset-y min-width="auto">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-model="fecha_vencimiento" label="Fecha de Vencimiento"
                    prepend-inner-icon="mdi-calendar" readonly v-bind="attrs" v-on="on" dense outlined clearable
                    hint="Dejar vacío para sin vencimiento" persistent-hint></v-text-field>
                </template>
                <v-date-picker v-model="fecha_vencimiento" @input="menuFechaVencimiento = false"
                  :min="hoy"></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <v-alert v-if="fecha_vencimiento" dense text :type="esFechaProxima ? 'warning' : 'info'" class="mb-0">
                {{ diasRestantes }} días restantes
              </v-alert>
            </v-col>
          </v-row>

          <v-divider class="my-3"></v-divider>

          <v-row class="mt-1" v-if="modo_bono == 'precio'" dense>
            <v-col cols="12" class="mb-2">
              <span class="text-subtitle-2">
                <v-icon small color="blue">mdi-tag-multiple</v-icon>
                Configuración de Precios Mayorista
              </span>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field outlined dense type="number" v-model="escala_may1" label="Escala Mayorista 1 (und)"
                prepend-inner-icon="mdi-numeric"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field outlined dense type="number" v-model="precio_may1" label="Precio Mayorista 1"
                prepend-inner-icon="S/"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field outlined dense type="number" v-model="escala_may2" label="Escala Mayorista 2 (und)"
                prepend-inner-icon="mdi-numeric"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field outlined dense type="number" v-model="precio_may2" label="Precio Mayorista 2"
                prepend-inner-icon="S/"></v-text-field>
            </v-col>
          </v-row>

          <!-- BONOS -->
          <v-row class="mt-n1" v-else>
            <v-col cols="12" class="mb-2">
              <span class="text-subtitle-2">
                <v-icon small color="orange">mdi-gift</v-icon>
                Configuración de Bonificaciones
              </span>
              <v-btn x-small class="ml-3" @click="dial_agrega = true" color="success">
                <v-icon left x-small>mdi-plus</v-icon>Agregar Regla
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-simple-table fixed-header height="20vh" dense v-if="array_bono2.length">
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">A partir de</th>
                      <th class="text-left">Cant. Bono</th>
                      <th class="text-left">Producto</th>
                      <th class="text-left">Máx</th>
                      <th class="text-left">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in array_bono2" :key="idx">
                      <td>{{ item.apartir_de }} und</td>
                      <td><strong class="success--text">{{ item.cantidad_bono }}x</strong></td>
                      <td>{{ vernombre(item.codigo) }}</td>
                      <td>{{ item.cantidad_max || '∞' }}</td>
                      <td>
                        <v-icon small color="red" @click="elimina(2, item)">mdi-delete</v-icon>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-alert v-else type="info" dense text>
                No hay reglas de bonificación. Agrega una regla para continuar.
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="mt-n6">
          <v-spacer></v-spacer>
          <v-btn color="success" @click="genera_bono()">
            <v-icon left>mdi-content-save</v-icon>Guardar
          </v-btn>
          <v-btn color="error" @click="dial_mov = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dial_agrega" max-width="460px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dial_agrega = false">mdi-close</v-icon>
          <span class="ml-2">Agregar Regla de Bonificación</span>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-row dense>
          <v-col cols="12">
            <v-text-field outlined type="number" dense v-model="apartir_de" label="Bono a partir de (und) *"
              prepend-inner-icon="mdi-numeric"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field outlined type="number" dense v-model="cantidad_bono" label="Cantidad bonificación *"
              prepend-inner-icon="mdi-gift"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field outlined type="number" dense v-model="cantidad_max" label="Cantidad máxima" hint="Opcional"
              persistent-hint prepend-inner-icon="mdi-infinity"></v-text-field>
          </v-col>
        </v-row>

        <v-autocomplete v-model="producto_sele" :items="$store.state.productos" item-text="nombre" item-value="id"
          label="Producto a bonificar *" clearable menu-props="auto" outlined dense prepend-inner-icon="mdi-magnify">
          <template v-slot:item="{ item }">
            <v-list-item-content>
              <v-list-item-title>
                <strong>{{ item.categoria }}</strong> - {{ item.nombre }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Stock: {{ item.stock }} | Precio: S/{{ item.precio }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </v-autocomplete>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardar_bono()">
            <v-icon left>mdi-plus</v-icon>Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <VisorProductosBono v-model="dialVisorProductos" :bono="bonoSeleccionado" />
  </div>
</template>

<script>
import store from "@/store";
import { allBono, nuevoBono, eliminabono } from "../../db";
import VisorProductosBono from './components/VisorProductosBono.vue';

export default {
  components: {
    VisorProductosBono
  },
  data() {
    return {
      dial_mov: false,
      dial_agrega: false,
      dialVisorProductos: false,
      menuFechaVencimiento: false,
      modo_bono: "precio",
      activo: true,
      nombre: "",
      observacion: "",
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
      array_bono2: [],
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
    guardar_bono() {
      if (!this.producto_sele || !this.apartir_de || !this.cantidad_bono) {
        this._toast("Completa producto, 'a partir de' y 'cantidad de bonificación'.");
        return;
      }
      this.array_bono2.push({
        apartir_de: Number(this.apartir_de),
        codigo: this.producto_sele,
        cantidad_max: this.cantidad_max ? Number(this.cantidad_max) : null,
        cantidad_bono: Number(this.cantidad_bono),
      });
      this.producto_sele = null;
      this.apartir_de = null;
      this.cantidad_bono = null;
      this.cantidad_max = null;
      this.dial_agrega = false;
    },

    elimina(_tipo, item) {
      this.array_bono2 = this.array_bono2.filter((x) => x !== item);
    },

    _buildPrecioPayload() {
      return {
        tipo: "precio",
        activo: !!this.activo,
        nombre: (this.nombre || "").trim(),
        observacion: (this.observacion || "").trim(),
        proveedor: this.proveedor || null,
        fecha_vencimiento: this.fecha_vencimiento || null,
        escala_may1: this.escala_may1 != null ? Number(this.escala_may1) : null,
        precio_may1: this.precio_may1 != null ? Number(this.precio_may1) : null,
        escala_may2: this.escala_may2 != null ? Number(this.escala_may2) : null,
        precio_may2: this.precio_may2 != null ? Number(this.precio_may2) : null,
        creado: Date.now(),
        usuario: store?.state?.usuario || null,
      };
    },

    _buildBonoPayload() {
      return {
        tipo: "bono",
        activo: !!this.activo,
        nombre: (this.nombre || "").trim(),
        observacion: (this.observacion || "").trim(),
        proveedor: this.proveedor || null,
        fecha_vencimiento: this.fecha_vencimiento || null,
        data: this.array_bono2.map((b, i) => ({
          id: i + 1,
          apartir_de: Number(b.apartir_de),
          cantidad_bono: Number(b.cantidad_bono),
          cantidad_max: b.cantidad_max != null ? Number(b.cantidad_max) : null,
          codigo: b.codigo,
        })),
        creado: Date.now(),
        usuario: store?.state?.usuario || null,
      };
    },

    async genera_bono() {
      if (!this.nombre?.trim()) {
        this._toast("Escribe un nombre.");
        return;
      }

      let payload = this.modo_bono === "precio" ? this._buildPrecioPayload() : this._buildBonoPayload();
      store.commit("dialogoprogress");

      try {
        if (this.editIndex >= 0 && this.editId != null) {
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
        store.commit("dialogoprogress");
        this._resetForm();
      } catch (e) {
        console.error(e);
        this._toast("Error al guardar la programación.");
        store.commit("dialogoprogress");
      }
    },

    editarTransferencia(item) {
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
        this.escala_may1 = item.escala_may1 ?? null;
        this.precio_may1 = item.precio_may1 ?? null;
        this.escala_may2 = item.escala_may2 ?? null;
        this.precio_may2 = item.precio_may2 ?? null;
      } else {
        const bonos = Array.isArray(item.data) ? item.data : [];
        this.array_bono2 = bonos.map((b) => ({
          apartir_de: b.apartir_de,
          cantidad_bono: b.cantidad_bono,
          cantidad_max: b.cantidad_max,
          codigo: b.codigo,
        }));
      }

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
  },
};
</script>