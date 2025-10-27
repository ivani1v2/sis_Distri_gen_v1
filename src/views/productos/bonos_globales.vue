<template>
  <div class="pa-4">
    <v-card outlined class="pa-4 mb-4">
      <v-row justify="space-between" align="center">
        <v-col cols="12" sm="4">
          <h2 class="text-h6">📦Bonos y Precios Globales</h2>
        </v-col>

        <v-col cols="12" sm="4" class="text-right">
          <v-btn color="primary" @click="abrirNuevo()">
            <v-icon left>mdi-plus</v-icon>Nuevo Movimiento
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card outlined>
      <v-data-table :headers="headers" :items="movimientos" dense class="elevation-1">
        <template v-slot:item.accion="{ item }">
          <v-menu bottom left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="editarTransferencia(item)">
                <v-list-item-icon><v-icon color="orange">mdi-pencil</v-icon></v-list-item-icon>
                <v-list-item-content>Editar</v-list-item-content>
              </v-list-item>
              <v-list-item @click="anularTransferencia(item)">
                <v-list-item-icon><v-icon color="red">mdi-cancel</v-icon></v-list-item-icon>
                <v-list-item-content>Anular</v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dial_mov" max-width="750px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dial_mov = !dial_mov">mdi-close</v-icon>
          <v-switch v-model="activo" color="green" label="Activo"></v-switch>
          <v-spacer></v-spacer>
          <v-radio-group class="mt-4" v-model="modo_bono" row dense>
            <v-radio label="Precio" value="precio"></v-radio>
            <v-radio label="Bono" value="bono"></v-radio>
          </v-radio-group>
        </v-system-bar>
      </div>

      <v-card>
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="6">
              <v-textarea dense outlined v-model="nombre" auto-grow filled label="Nombre" rows="1"></v-textarea>
            </v-col>
            <v-col cols="12" class="mt-n4">
              <v-textarea dense outlined v-model="observacion" auto-grow filled label="Observacion"
                rows="1"></v-textarea>
            </v-col>
          </v-row>

          <v-divider></v-divider>

          <!-- PRECIOS -->
          <v-row class="mt-1" v-if="modo_bono == 'precio'" dense>
            <v-col cols="6">
              <v-text-field outlined dense type="number" v-model="escala_may1"
                label="Escala Mayorista 1"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field outlined dense type="number" v-model="precio_may1"
                label="Precio Mayorista 1"></v-text-field>
            </v-col>
            <v-col cols="6" class="mt-n4">
              <v-text-field outlined dense type="number" v-model="escala_may2"
                label="Escala Mayorista 2"></v-text-field>
            </v-col>
            <v-col cols="6" class="mt-n4">
              <v-text-field outlined dense type="number" v-model="precio_may2"
                label="Precio Mayorista 2"></v-text-field>
            </v-col>
          </v-row>

          <!-- BONOS -->
          <v-row class="mt-n1" v-else>
            <v-col cols="6">
              <v-btn x-small block @click="dial_agrega = true" color="success">Agrega Bono</v-btn>
            </v-col>
            <v-col cols="12" class="mt-n2">
              <v-simple-table fixed-header height="20vh" dense>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">A partir de</th>
                      <th class="text-left">Cantidad Bono</th>
                      <th class="text-left">Codigo</th>
                      <th class="text-left">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in array_bono2" :key="item">
                      <td>
                        <v-icon @click="elimina(2, item)" color="red">mdi-minus</v-icon>{{ item.apartir_de }}
                      </td>
                      <td>{{ item.cantidad_bono }}</td>
                      <td>{{ item.codigo }} - {{ vernombre(item.codigo) }}</td>
                      <td>{{ item.cantidad_max }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="mt-n6">
          <v-spacer></v-spacer>
          <v-btn color="success" @click="genera_bono()">Guarda</v-btn>
          <v-btn color="error" @click="dial_mov = !dial_mov">cancela</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Agregar Bono -->
    <v-dialog v-model="dial_agrega" max-width="460px">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dial_agrega = !dial_agrega">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-row dense>
          <v-col cols="12">
            <v-text-field outlined type="number" dense v-model="apartir_de" label="Bono a partir de :"></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field outlined type="number" dense v-model="cantidad_bono"
              label="Cantidad bonificacion"></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field outlined type="number" dense v-model="cantidad_max"
              label="Cantidad max de bonificacion"></v-text-field>
          </v-col>
        </v-row>

        <v-autocomplete v-model="producto_sele" :items="$store.state.productos" item-text="nombre" item-value="id"
          label="Buscar Productos" clearable menu-props="auto" outlined dense append-icon="mdi-magnify">
          <template v-slot:item="{ item }">
            <v-list-item-content>
              <v-list-item-title>
                <strong>{{ item.categoria }}</strong> - {{ item.nombre }}
              </v-list-item-title>
            </v-list-item-content>
          </template>
        </v-autocomplete>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardar_bono()">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import store from "@/store";
import { allBono, nuevoBono, eliminabono } from "../../db";

export default {
  data() {
    return {
      // diálogos
      dial_mov: false,
      dial_agrega: false,

      // modo de programación
      modo_bono: "precio", // "precio" | "bono"
      activo: true,

      // formulario común
      nombre: "",
      observacion: "",

      // precios
      escala_may1: null,
      precio_may1: null,
      escala_may2: null,
      precio_may2: null,

      // bonos
      producto_sele: null,
      apartir_de: null,
      cantidad_bono: null,
      cantidad_max: null,
      array_bono2: [],

      // tabla
      headers: [
        { text: "ID", value: "id", width: 110 },
        { text: "Código", value: "codigo", width: 110 },
        { text: "Tipo", value: "tipo", width: 110 },
        { text: "Nombre", value: "nombre" },
        { text: "Observación", value: "observacion" },
        { text: "Acción", value: "accion", sortable: false, align: "center", width: 100 },
      ],
      movimientos: [],

      // edición
      editIndex: -1,
      editId: null,      // aquí guardamos el key actual (igual a codigo)
      editTipo: null,    // para detectar cambio de tipo
    };
  },

  async mounted() {
    await this.cargarMovimientos();
  },

  methods: {
    // ————————————————— Carga inicial / refresco
    async cargarMovimientos() {
      try {
        const snap = await allBono().once("value");
        const val = typeof snap.val === "function" ? snap.val() : null;

        let arr = [];
        if (Array.isArray(val)) {
          // Si viniera como array (no recomendado cuando key = codigo)
          arr = val.filter(Boolean).map(v => ({
            ...v,
            id: v.codigo || v.id, // forzamos que id=code si no vino
            codigo: v.codigo || v.id,
          }));
        } else if (val && typeof val === "object") {
          // Objeto con key = codigo
          arr = Object.entries(val).map(([key, v]) => ({
            ...v,
            id: key,
            codigo: v?.codigo || key,
          }));
        }

        // Orden por sufijo numérico del código
        arr.sort((a, b) => this._suffixNum(a.codigo) - this._suffixNum(b.codigo));
        this.movimientos = arr;
      } catch (e) {
        console.error(e);
        this._toast("No se pudo cargar la lista de programaciones.");
        this.movimientos = [];
      }
    },

    // —— helpers
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

    // id_grupo automático según length del tipo (independiente del código)
    getNextGroupId(tipo) {
      const count = (this.movimientos || []).filter((m) => m && m.tipo === tipo).length;
      return count + 1;
    },

    // —— bonos: CRUD de filas del sub-grid (solo UI)
    guardar_bono() {
      if (!this.producto_sele || !this.apartir_de || !this.cantidad_bono) {
        this._toast("Completa producto, 'a partir de' y 'cantidad de bonificación'.");
        return;
      }
      this.array_bono2.push({
        apartir_de: Number(this.apartir_de),
        codigo: this.producto_sele, // id de producto
        cantidad_max: this.cantidad_max ? Number(this.cantidad_max) : null,
        cantidad_bono: Number(this.cantidad_bono),
      });
      // limpiar mini-form
      this.producto_sele = null;
      this.apartir_de = null;
      this.cantidad_bono = null;
      this.cantidad_max = null;
      this.dial_agrega = false;
    },

    elimina(_tipo, item) {
      this.array_bono2 = this.array_bono2.filter((x) => x !== item);
    },

    // —— construir payloads
    _buildPrecioPayload() {
      return {
        tipo: "precio",
        activo: !!this.activo,
        nombre: (this.nombre || "").trim(),
        observacion: (this.observacion || "").trim(),
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

    // —— guardar programación (usa nuevoBono) con id=codigo=key
    async genera_bono() {
      if (!this.nombre?.trim()) {
        this._toast("Escribe un nombre.");
        return;
      }

      let payload = this.modo_bono === "precio" ? this._buildPrecioPayload() : this._buildBonoPayload();
      store.commit("dialogoprogress")
      try {
        if (this.editIndex >= 0 && this.editId != null) {
          // —— Edición
          const anterior = this.movimientos[this.editIndex] || {};
          const oldKey = anterior.codigo || anterior.id;

          if (anterior.tipo === payload.tipo) {
            // Mismo tipo → mantener key/codigo/id
            payload.codigo = oldKey;
            payload.id = oldKey;
            payload.id_grupo = anterior.id_grupo ?? this.getNextGroupId(payload.tipo);
            await nuevoBono(oldKey, payload);
          } else {
            // Cambió el tipo → renombrar key
            const newCode = this._nextCodigo(payload.tipo);
            payload.codigo = newCode;
            payload.id = newCode;
            payload.id_grupo = this.getNextGroupId(payload.tipo);

            // Crear nuevo y borrar viejo

            await nuevoBono(newCode, payload);
            await nuevoBono(oldKey, null); // en RTDB set(null) = delete
          }
        } else {
          // —— Nuevo
          const newCode = this._nextCodigo(payload.tipo);
          payload.codigo = newCode;
          payload.id = newCode;
          payload.id_grupo = this.getNextGroupId(payload.tipo);
          await nuevoBono(newCode, payload);
        }

        await this.cargarMovimientos();
        this._toast("Guardado correctamente");
        this.dial_mov = false;
        store.commit("dialogoprogress")
        this._resetForm();
      } catch (e) {
        console.error(e);
        this._toast("Error al guardar la programación.");
      }
    },

    // —— acciones de fila
    editarTransferencia(item) {
      const idx = this.movimientos.findIndex((x) => String(x.id) === String(item.id));
      if (idx < 0) return;

      this._resetForm();
      this.editIndex = idx;
      this.editId = item.id;     // = codigo
      this.editTipo = item.tipo;

      this.modo_bono = item.tipo;
      this.activo = !!item.activo;
      this.nombre = item.nombre || "";
      this.observacion = item.observacion || "";

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
      if (confirm('Seguro de anular?')) {
        store.commit("dialogoprogress")
        await eliminabono(item.id)
        this.cargarMovimientos()
        store.commit("dialogoprogress")
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
