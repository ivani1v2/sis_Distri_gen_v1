<template>
  <v-dialog v-model="dial" max-width="1000" persistent scrollable>
    <v-card>
      <v-toolbar flat color="primary" dark dense>
        <v-toolbar-title class="text-h6">Seleccionar Productos</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn x-small color="warning" class="mr-2" @click="quitarFiltro" :disabled="bloqueado">
          <v-icon left>mdi-filter-remove</v-icon> Quitar filtro
        </v-btn>
        <v-btn x-small color="success" @click="guardar" :disabled="!selected.length || bloqueado" class="mr-2">
          <v-icon left>mdi-content-save</v-icon> Guardar ({{ selected.length }})
        </v-btn>

        <v-btn icon @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-fade-transition>
          <!-- BLOQUEADO -->
          <div v-if="bloqueado" class="d-flex align-center justify-center" style="min-height: 400px;">
            <v-alert prominent type="error" border="top" elevation="2" max-width="500">
              <div class="text-h5">Límite de Plan Excedido</div>
              <p>
                Su plan actual no permite gestionar más de 4,000 productos por vendedor.
                Por favor, contacte a soporte para un upgrade.
              </p>
              <v-btn color="white" outlined small>Contactar Asesor</v-btn>
            </v-alert>
          </div>

          <!-- NORMAL -->
          <div v-else>
            <v-row dense class="mb-2 align-center">
              <v-col cols="12" md="5">
                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" dense outlined hide-details
                  label="Buscar nombre, ID o código..." clearable />
              </v-col>

              <v-col cols="6" md="3">
                <v-select v-model="filtroCategoria" :items="categoriasItems" label="Categoría" dense outlined
                  hide-details clearable prepend-inner-icon="mdi-tag-outline" />
              </v-col>

              <v-col cols="6" md="2">
                <v-select v-model="filtroSeleccion" :items="filtrosSeleccionItems" item-text="text" item-value="value"
                  label="Ver" dense outlined hide-details />
              </v-col>

              <v-col cols="12" md="2" class="text-right">
                <!-- ✅ ARREGLADO -->
                <v-checkbox v-model="selectAll" label="Seleccionar Todos" hide-details dense class="mt-0 pt-0"
                  @change="toggleSelectAll" />
              </v-col>
            </v-row>

            <div class="mb-2">
              <small class="grey--text">
                {{ selected.length }} seleccionado(s) de {{ productos.length }}
                <span v-if="filtroSeleccion !== 'ALL' || filtroCategoria"> · (vista filtrada)</span>
              </small>
            </div>

            <v-data-table :headers="headers" :items="productosFiltrados" :search="search" :items-per-page="15"
              item-key="id" show-select v-model="selected" dense fixed-header height="500px"
              class="elevation-1 border-light" :footer-props="{ 'items-per-page-options': [15, 30, 50, 100] }">
              <template v-slot:item.categoria="{ item }">
                <v-chip x-small label outlined color="blue-grey lighten-1">
                  {{ item.categoria || "Sin Cat." }}
                </v-chip>
              </template>

              <template v-slot:item.precio="{ item }">
                <span class="font-weight-bold text-body-2">{{ number2(item.precio) }}</span>
              </template>

              <template v-slot:item.stock="{ item }">
                <v-chip :color="Number(item.stock) <= 0 ? 'red lighten-4' : 'green lighten-4'"
                  :class="Number(item.stock) <= 0 ? 'red--text' : 'green--text'" x-small class="font-weight-black">
                  {{ item.stock }}
                </v-chip>
              </template>

              <template v-slot:no-data>
                <div class="pa-4 grey--text text-center">No hay productos</div>
              </template>
            </v-data-table>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { nuevoCampoUsuario } from '../../db'
import store from '@/store/index'

export default {
  name: "DialogSeleccionProductos",
  props: {
    vendedor: null
  },
  data() {
    return {
      dial: true,
      search: "",
      selected: [],
      selectAll: true,

      filtroSeleccion: "ALL",
      filtrosSeleccionItems: [
        { text: "Todos", value: "ALL" },
        { text: "Solo seleccionados", value: "SEL" },
        { text: "Solo NO seleccionados", value: "NOSEL" },
      ],

      filtroCategoria: null,

      headers: [
        { text: "ID", value: "id", width: 90 },
        { text: "Nombre", value: "nombre" },
        { text: "Categoria", value: "categoria", width: 140 },
        { text: "Precio", value: "precio", width: 90 },
        { text: "Costo", value: "costo", width: 90 },
        { text: "Stock", value: "stock", width: 80 },
      ],
    };
  },

  computed: {
    productos() {
      const arr = this.$store?.state?.productos;
      return Array.isArray(arr) ? arr : [];
    },

    bloqueado() {
      return (this.productos?.length || 0) > 40000;
    },

    categoriasItems() {
      const set = new Set();
      for (const p of this.productos || []) {
        const c = (p?.categoria ?? "").toString().trim();
        if (c) set.add(c);
      }
      return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
    },

    selectedSet() {
      return new Set((this.selected || []).map((x) => String(x.id)));
    },

    productosFiltrados() {
      let arr = Array.isArray(this.productos) ? this.productos : [];

      if (this.filtroCategoria) {
        const cat = String(this.filtroCategoria).trim();
        arr = arr.filter((p) => String(p?.categoria ?? "").trim() === cat);
      }

      if (this.filtroSeleccion === "SEL") {
        const set = this.selectedSet;
        return arr.filter((p) => set.has(String(p.id)));
      }
      if (this.filtroSeleccion === "NOSEL") {
        const set = this.selectedSet;
        return arr.filter((p) => !set.has(String(p.id)));
      }

      return arr;
    },
  },

  watch: {
    productos: {
      immediate: true,
      handler(arr) {
        if (this.bloqueado) return;

        const list = Array.isArray(this.vendedor?.list_prod) ? this.vendedor.list_prod : [];
        const setIds = new Set(list.map(x => String(x).trim()).filter(Boolean));

        // Solo setear si todavía no has tocado la selección manualmente
        if (!this.selected.length && setIds.size) {
          this.selected = (arr || []).filter(p => setIds.has(String(p.id)));
        }

        this.selectAll = (this.selected?.length || 0) === (arr?.length || 0);
      }
    },

    selected: {
      deep: true,
      handler(arr) {
        this.selectAll = (arr?.length || 0) === (this.productos?.length || 0);
      }
    }
  },


  created() {
    console.log(this.vendedor);

    if (this.bloqueado) {
      this.selected = [];
      this.selectAll = false;
      return;
    }

    const list = Array.isArray(this.vendedor?.list_prod) ? this.vendedor.list_prod : [];
    const setIds = new Set(list.map(x => String(x).trim()).filter(Boolean));

    // ✅ Seleccionar solo los que el vendedor ya tiene en list_prod
    this.selected = (this.productos || []).filter(p => setIds.has(String(p.id)));

    // ✅ Marcar selectAll si realmente tiene todos seleccionados
    this.selectAll = this.selected.length === this.productos.length;
  },


  methods: {
    // ✅ este checkbox selecciona TODA la lista, no solo vista
    toggleSelectAll(val) {
      if (val) this.selected = this.productos.slice();
      else this.selected = [];
    },

    number2(n) {
      const x = Number(n || 0);
      return x.toFixed(2);
    },

    async guardar() {
      store.commit("dialogoprogress");

      const idsArray = Array.from(
        new Set(
          (this.selected || [])
            .map(p => String(p.id).trim())
            .filter(Boolean)
        )
      );

      console.log("IDS ARRAY:", idsArray);

      await nuevoCampoUsuario(this.vendedor.token, "list_prod", idsArray);

      store.commit("dialogoprogress");
      this.cerrar();
    },

async quitarFiltro() {
  store.commit("dialogoprogress");
  try {
    await nuevoCampoUsuario(this.vendedor.token, "list_prod", null);
    // opcional: limpiar selección local y marcar selectAll
    this.selected = this.productos.slice();
    this.selectAll = true;
    this.cerrar();
  } finally {
    store.commit("dialogoprogress");
  }
},


    cerrar() {
      this.dial = false;
      this.$emit("cerrar", true);
    },
  },
};
</script>
