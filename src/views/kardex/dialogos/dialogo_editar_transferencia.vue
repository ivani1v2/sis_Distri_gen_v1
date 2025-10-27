<template>
  <v-dialog v-model="localDialog" max-width="700px" persistent>
    <v-card>
      <v-card-title>
        ✏️ Editar Transferencia
        <v-spacer></v-spacer>
        <v-btn icon @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle>
        Origen: <strong>{{ nombreSede(transferencia.sede_origen) }}</strong> |
        Destino: <strong>{{ nombreSede(transferencia.sede_destino) }}</strong>
      </v-card-subtitle>

      <v-card-text>
        <v-simple-table dense>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th style="width:140px;">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in productosEdit" :key="i">
              <td>{{ p.nombre }}</td>
              <td>{{ p.codbarra || p.codigo || p.id }}</td>
              <td>
                <v-text-field
                  v-model.number="p.cantidad"
                  type="number"
                  dense
                  outlined
                  hide-details
                  min="0"
                />
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-textarea
          v-model="observacion"
          label="Observación"
          dense
          outlined
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="red" text @click="cerrar">Cancelar</v-btn>
        <v-btn color="green" dark @click="guardar">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {
  allProductoOtraBase,
  grabarStockOtraBase,
  actualiza_transferencia,
} from "@/db";
import moment from "moment";
import store from "@/store";

export default {
  name: "DialogoEditarTransferencia",
  props: {
    // v-model del padre
    dialog: { type: Boolean, default: false },
    transferencia: { type: Object, default: () => ({}) },
    nombreSede: { type: Function, required: true },
  },
  data() {
    return {
      productosEdit: [],
      observacion: "",
    };
  },
  computed: {
    // Permite usar v-model en el hijo sin mutar la prop directamente
    localDialog: {
      get() {
        return this.dialog;
      },
      set(v) {
        this.$emit("update:dialog", v);
      },
    },
  },
  watch: {
    transferencia: {
      immediate: true,
      handler(val) {
        if (!val) return;
        this.productosEdit = Array.isArray(val.productos)
          ? JSON.parse(JSON.stringify(val.productos))
          : [];
        this.observacion = val.observacion || "";
      },
    },
  },
  methods: {
    cerrar() {
      this.$emit("cerrar");
      this.$emit("update:dialog", false);
    },

    // --- Utilidades numéricas y de totales ---
    toNum(v, def = 0) {
      const n = Number(String(v).replace(",", "."));
      return isNaN(n) ? def : n;
    },
  recalculaLinea(p) {
  const cantidad = Math.max(0, this.toNum(p.cantidad));
  const precio   = this.toNum(p.precio);
  const monto    = +(cantidad * precio).toFixed(2); // siempre desde cantidad*precio

  return {
    ...p,
    cantidad,
    precio: precio ? +precio.toFixed(2) : p.precio,
    monto_soles: monto, // sobreescribe siempre
  };
},

    recalculaProductosYTotal(productos = []) {
      const productosCalc = productos.map(this.recalculaLinea);
      const total = +productosCalc
        .reduce((acc, p) => acc + this.toNum(p.monto_soles), 0)
        .toFixed(2);
      return { productosCalc, total };
    },

    async guardar() {
      try {
        // Abre loader
        store.commit("dialogoprogress");

        // 1) Recalcular líneas + total
        const { productosCalc, total } = this.recalculaProductosYTotal(
          this.productosEdit
        );

        // 2) Stocks actuales en origen y destino
        const [snap_origen, snap_destino] = await Promise.all([
          allProductoOtraBase(this.transferencia.sede_origen).once("value"),
          allProductoOtraBase(this.transferencia.sede_destino).once("value"),
        ]);

        const origen_actual = snap_origen.val()
          ? Object.values(snap_origen.val())
          : [];
        const destino_actual = snap_destino.val()
          ? Object.values(snap_destino.val())
          : [];

        // 3) Ajustes por diferencia (buscar original por ID para mayor robustez)
        for (const nuevo of productosCalc) {
          const original = (this.transferencia.productos || []).find(
            (p) => String(p.id) === String(nuevo.id)
          );
          if (!original) continue;

          const diff =
            this.toNum(nuevo.cantidad) - this.toNum(original.cantidad);
          if (diff === 0) continue;

          // Origen: si diff>0 restamos más stock; si diff<0 devolvemos
          const prodOrigen = origen_actual.find(
            (p) => String(p.id) === String(nuevo.id)
          );
          const stockOrigen = this.toNum(prodOrigen?.stock);
          await grabarStockOtraBase(
            this.transferencia.sede_origen,
            nuevo.id,
            stockOrigen - diff
          );

          // Destino: si diff>0 sumamos; si diff<0 restamos (no negativo)
          const prodDestino = destino_actual.find(
            (p) => String(p.id) === String(nuevo.id)
          );
          const stockDestino = this.toNum(prodDestino?.stock);
          const nuevoStockDestino = Math.max(0, stockDestino + diff);
          await grabarStockOtraBase(
            this.transferencia.sede_destino,
            nuevo.id,
            nuevoStockDestino
          );
        }

        // 4) Persistir transferencia con total recalculado + trazabilidad
        await actualiza_transferencia(this.transferencia.key, {
          productos: productosCalc,
          observacion: this.observacion,
          total,
          estado: "editado",
          editado_por: store.state.permisos?.correo || "",
          editado_en: moment().unix(),
        });

        this.$emit("guardado");
        this.cerrar();
      } catch (e) {
        alert("Error al guardar: " + (e?.message || e));
      } finally {
        // Cierra loader
        store.commit("dialogoprogress");
      }
    },
  },
};
</script>
