<template>
  <v-dialog v-model="show" max-width="550px" persistent scrollable>
    <v-card>
      <v-card-title class="success white--text py-2 subtitle-1">
        <v-icon color="white" small class="mr-2">mdi-account-plus</v-icon>
        Asignar Equipo a Cliente
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-3">
        <v-alert type="info" dense text class="mb-4">
          <div class="font-weight-bold">{{ equipo.codigo }}</div>
          <div class="caption">{{ equipo.marca }} {{ equipo.modelo }} - {{ equipo.descripcion }}</div>
        </v-alert>
        <v-card outlined class="pa-3 mb-3">
          <div class="subtitle-2 mb-2">
            <v-icon small color="primary" class="mr-1">mdi-magnify</v-icon>
            Buscar Cliente
          </div>

          <v-autocomplete v-model="clienteId" :items="clientesSearch" :filter="filtrarClientes" :loading="buscando"
            item-text="nombre" item-value="id" outlined dense hide-no-data
            placeholder="Escriba nombre o documento del cliente" prepend-inner-icon="mdi-account-search" clearable
            @change="onClienteSeleccionado">
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title>({{ item.id || item.documento }}) {{ item.nombre || item.razon_social }}</v-list-item-title>
              </v-list-item-content>
            </template>
          </v-autocomplete>
        </v-card>

        <v-card v-if="clienteSeleccionado" outlined class="pa-3 mb-3 success lighten-5">
          <div class="subtitle-2 mb-2">
            <v-icon small color="success" class="mr-1">mdi-check</v-icon>
            Cliente Seleccionado
          </div>
          <div class="font-weight-bold">{{ clienteSeleccionado.nombre || clienteSeleccionado.razon_social }}</div>
          <div class="caption">Documento: {{ clienteSeleccionado.documento || clienteSeleccionado.id }}</div>
          <div class="caption">Dirección: {{ clienteSeleccionado.direccion || 'No especificada' }}</div>
        </v-card>

        <v-textarea v-model="observacion" label="Observación" outlined dense rows="2" auto-grow
          placeholder="Notas adicionales sobre la asignación..."></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-btn color="success" :loading="guardando" :disabled="!clienteSeleccionado" @click="asignar">
          <v-icon left>mdi-check</v-icon>
          Asignar Equipo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { asignarEquipo } from "@/db_activos";
import { colClientes } from "@/db_firestore";

export default {
  name: "DialogAsignarCliente",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, required: true }
  },

  data() {
    return {
      clienteId: null,
      buscando: false,
      clienteSeleccionado: null,
      observacion: "",
      guardando: false
    };
  },

  computed: {
    show: {
      get() { return this.visible; },
      set(val) { this.$emit("update:visible", val); }
    },

    clientesSearch() {
      return this.$store.state.clientessearch || [];
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.limpiar();
      }
    }
  },

  methods: {
    limpiar() {
      this.clienteId = null;
      this.clienteSeleccionado = null;
      this.observacion = "";
    },

    filtrarClientes(item, queryText) {
      const searchLower = (queryText || "").toLowerCase();
      const nombre = (item.nombre || item.razon_social || "").toLowerCase();
      const documento = (item.id || item.documento || "").toLowerCase();
      return nombre.includes(searchLower) || documento.includes(searchLower);
    },

    async onClienteSeleccionado(id) {
      if (!id) {
        this.clienteSeleccionado = null;
        return;
      }

      this.buscando = true;

      try {
        const doc = await colClientes().doc(id).get();
        if (doc.exists) {
          this.clienteSeleccionado = { id: doc.id, ...doc.data() };
        } else {
          const clienteStore = this.clientesSearch.find(c => c.id === id);
          if (clienteStore) {
            this.clienteSeleccionado = clienteStore;
          } else {
            this.$store.commit("dialogosnackbar", "No se pudo obtener los datos del cliente");
          }
        }
      } catch (error) {
        console.error("Error al obtener cliente:", error);
        const clienteStore = this.clientesSearch.find(c => c.id === id);
        if (clienteStore) {
          this.clienteSeleccionado = clienteStore;
        }
      } finally {
        this.buscando = false;
      }
    },

    async asignar() {
      if (!this.clienteSeleccionado) return;

      this.guardando = true;

      try {
        await asignarEquipo(this.equipo.codigo, {
          documento: this.clienteSeleccionado.documento || this.clienteSeleccionado.id,
          nombre: this.clienteSeleccionado.nombre || this.clienteSeleccionado.razon_social,
          direccion: this.clienteSeleccionado.direccion || ""
        }, this.observacion);

        this.$emit("asignado");
        this.cerrar();
      } catch (error) {
        console.error("Error al asignar equipo:", error);
        this.$store.commit("dialogosnackbar", "Error: " + error.message);
      } finally {
        this.guardando = false;
      }
    },

    cerrar() {
      this.show = false;
      this.limpiar();
    }
  }
};
</script>
