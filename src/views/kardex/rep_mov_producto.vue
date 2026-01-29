<template>
    <div class="mb-6 mt-1 pa-2">
        <!-- Resumen de saldos -->
        <v-btn v-if="false" color="primary" @click="saldo_inicial_todos">
            <v-icon left>mdi-magnify</v-icon>
            crea saldos iniciales
        </v-btn>

        <v-row dense>
            <!-- Selección de periodo -->
            <v-col cols="12" sm="4">
                <v-select v-model="periodo" :items="periodos" label="Periodo" outlined dense />
            </v-col>

            <!-- Selección de producto -->
            <!-- Selección de producto -->
            <v-col cols="12" md="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                <v-autocomplete v-model="buscar" :items="$store.state.productos"
                    :item-text="item => `${item.id} - ${item.nombre}`" item-value="id" label="Buscar producto" clearable
                    outlined dense prepend-inner-icon="mdi-magnify" />
            </v-col>

            <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                <v-btn block color="primary" @click="inicio" :disabled="cargando">
                    <v-icon left>mdi-magnify</v-icon>
                    Buscar
                </v-btn>
            </v-col>
        </v-row>
        <v-row dense :class="$vuetify.breakpoint.smAndDown ? 'mt-3' : 'mt-n6'">
            <v-col cols="12">
                <v-alert x-small outlined type="info" dense>
                    <strong>Saldo inicial:</strong>
                    {{ saldoInicial }}
                    <span v-if="factorConv > 1"> ({{ eqStr(saldoInicial, factorConv) }})</span>
                    &nbsp; | &nbsp;
                    <strong>Saldo final:</strong>
                    {{ saldoFinal }}
                    <span v-if="factorConv > 1"> ({{ eqStr(saldoFinal, factorConv) }})</span>
                </v-alert>

            </v-col>
            <v-col cols="6">
                <v-btn v-if="false" color="blue darken-2" dark small @click="procesaKardex()">
                    Procesar Kardex
                </v-btn>
            </v-col>
        </v-row>


        <!-- Tabla -->
        <v-simple-table fixed-header height="70vh" dense>
            <thead>
                <tr>
                    <th>Fecha Ingreso</th>
                    <th>Correlativo</th>
                    <th>Razón social</th>
                    <th>Stock Inicial</th>
                    <th>Cantidad</th>
                    <th>Saldo</th>
                    <th>Equivalente</th>
                    <th>Modo Ajuste</th>
                </tr>
            </thead>
            <tbody>
                <template v-for="item in productosFiltrados">
                    <tr v-for="prod in item.data" :key="prod.uuid" @click="ver_deta(item)">
                        <td style="font-size:75%;">{{ formatFecha(item.fecha_ingreso) }}</td>
                        <td style="font-size:75%;">{{ item.id }}</td>
                        <td style="font-size:75%;">{{ item.motivo }}</td>

                        <!-- NUEVO: stock inicial y saldo final -->
                        <td style="font-size:75%;">{{ prod.stock_inicial }}</td>
                        <td style="font-size:75%;">
                            {{ prod.cantidad }}
                            <span v-if="esGratuita(item.modo_ajuste)">(GRAT)</span>
                        </td>
                        <td style="font-size:75%;">{{ prod.saldo_final }}</td>
                        <td style="font-size:75%">{{ item.equivalente }}</td>
                        <td style="font-size:75%;">{{ item.modo_ajuste }}</td>
                    </tr>
                </template>
            </tbody>
        </v-simple-table>
        <!-- Diálogo de progreso -->
        <v-dialog persistent v-model="cargando" max-width="260">
            <v-card class="pa-6 d-flex flex-column align-center">
                <!-- animación: si progreso==0 uso indeterminate -->
                <v-progress-circular :size="70" :width="8" :value="progreso"
                    :indeterminate="progreso === 0 || progreso >= 100" />
                <div class="mt-3 subtitle-2">{{ estadoTexto }}</div>
                <div class="caption grey--text">{{ progreso }}%</div>
            </v-card>
        </v-dialog>


    </div>
</template>
<script>
import moment from "moment";
import store from "@/store";
import axios from "axios";
import { colempresa } from "../../db_firestore";

export default {
  data: () => ({
    periodo: moment().format("MM-YYYY"),
    periodos: [
      "2026",
      "01-2026","02-2026","03-2026","04-2026","05-2026","06-2026",
      "07-2026","08-2026","09-2026","10-2026","11-2026","12-2026",
      "2025",
      "01-2025","02-2025","03-2025","04-2025","05-2025","06-2025",
      "07-2025","08-2025","09-2025","10-2025","11-2025","12-2025"
    ],
    listafiltrada: [],
    buscar: "",
    saldoInicial: 0,
    saldoFinal: 0,
    cargando: false,
    factorConv: 1,

    // UI loader
    progreso: 0,
    estadoTexto: "Cargando…",
  }),

  computed: {
    productosFiltrados() {
      if (!this.buscar) return this.listafiltrada;
      return this.listafiltrada
        .map((item) => {
          const data = (item.data || []).filter(
            (p) => String(p.id) === String(this.buscar),
          );
          return data.length ? { ...item, data } : null;
        })
        .filter(Boolean);
    },
  },

  created() {
    // no buscar automático si no hay producto seleccionado
    // si quieres conservarlo, déjalo. Yo lo dejo pero no hace nada si buscar está vacío.
    this.inicio();
  },

  methods: {
    ver_deta(item) {
      console.log(item);
    },

    rangoDesdePeriodo(periodo) {
      const [mm, yyyy] = String(periodo || "").split("-");
      const ini = moment(`${yyyy}-${mm}-01`).startOf("month").unix();
      const fin = moment(`${yyyy}-${mm}-01`).endOf("month").unix();
      return [ini, fin];
    },

    eqStr(saldo, f) {
      const s = Number(saldo) || 0;
      const k = Number(f) || 1;
      return k > 1 ? `${Math.floor(s / k)}/${s % k}` : "-";
    },

    esGratuita(op) {
      if (!op) return false;
      const s = String(op).toUpperCase();
      return s.includes("GRAT");
    },

    formatFecha(segundos) {
      return segundos ? moment.unix(segundos).format("YYYY-MM-DD") : "";
    },

    // ==========================
    // ✅ NUEVO FLUJO OPTIMIZADO
    // ==========================
    async inicio() {
      try {
        // reset básico
        this.listafiltrada = [];
        this.saldoInicial = 0;
        this.saldoFinal = 0;

        if (!this.buscar) return;

        this.cargando = true;
        this.progreso = 0;
        this.estadoTexto = "Leyendo cierre del periodo…";

        const prodId = String(this.buscar);
        const prodSel = (this.$store.state.productos || []).find(
          (p) => String(p.id) === prodId,
        );
        const nombreProd = prodSel ? prodSel.nombre : "(sin nombre)";
        this.factorConv = Number(
          prodSel?.factor ??
            prodSel?.factor_paquete ??
            prodSel?.factor_conversion ??
            1,
        );

        const [ini, fin] = this.rangoDesdePeriodo(this.periodo);

        // 🔸 Refs Firestore
        const raiz = colempresa().doc("kardex");

        // 1) ✅ leer saldo inicial del cierre
   const cierreRef = raiz
  .collection("cierres")
  .doc(this.periodo)
  .collection("productos")
  .doc(prodId);

        const cierreSnap = await cierreRef.get();

        // si no existe cierre, no recalculamos histórico aquí (por performance)
        // solo avisamos y mostramos el mes con saldo inicial 0.
        let saldoInicialBase = 0;

        if (cierreSnap.exists) {
          const c = cierreSnap.data() || {};
          // prioridad: saldo_inicial del cierre
          saldoInicialBase = Number(c.saldo_inicial ?? 0);
        } else {
          // puedes mostrar alerta si quieres
          // alert("No existe cierre para este periodo. Ejecuta cierra_periodo.");
          saldoInicialBase = 0;
        }

        this.saldoInicial = saldoInicialBase;

        // 2) ✅ leer SOLO movimientos del mes (historial/detalle)
        this.estadoTexto = "Cargando movimientos del mes…";
        this.progreso = 30;

        const movCol = raiz.collection("historial").doc(prodId).collection("detalle");

        // consulta por rango del mes (necesita índice compuesto si lo pide)
        const snapMes = await movCol
          .where("f", ">=", ini)
          .where("f", "<=", fin)
          .orderBy("f")
          .get();

        const movimientosPeriodo = [];
        snapMes.forEach((doc) => {
          const x = doc.data() || {};
          movimientosPeriodo.push({
            uuid: doc.id,
            f: Number(x.f || 0),
            op: String(x.op || "").toUpperCase(),
            docref: x.doc || doc.id,
            rs: x.rs || "",
            cant: Number(x.cant || 0),
            costo: x.costo ?? 0,
            med: x.med || "",
            // si viene saldo desde backend, lo guardamos (no dependemos de él)
            saldo_backend: x.saldo ?? null,
          });
        });

        // 3) armar filas y calcular saldo final usando saldoInicialBase + sum(cant)
        this.estadoTexto = "Calculando saldos…";
        this.progreso = 70;

        let saldoAcum = saldoInicialBase;
        const rows = [];

        // fila inicial informativa
        rows.push({
          id: "SALDO INICIAL",
          modo_ajuste: "INICIAL",
          fecha_ingreso: ini,
          motivo: "Saldo inicial del periodo (cierre)",
          equivalente: this.eqStr(saldoInicialBase, this.factorConv),
          data: [
            {
              uuid: `INICIAL_${prodId}_${ini}`,
              id: prodId,
              nombre: nombreProd,
              cantidad: 0,
              costo: 0,
              stock_inicial: saldoInicialBase,
              saldo_final: saldoInicialBase,
            },
          ],
        });

        movimientosPeriodo
          .filter((m) => m.op !== "INICIAL") // por si hubiera uno mal metido
          .sort((a, b) => a.f - b.f)
          .forEach((mov) => {
            const stockInicialFila = saldoAcum;
            saldoAcum += mov.cant;
            const saldoFinalFila = saldoAcum;

            rows.push({
              id: mov.docref,
              modo_ajuste: mov.op,
              fecha_ingreso: mov.f,
              motivo: mov.rs,
              equivalente: this.eqStr(saldoFinalFila, this.factorConv),
              data: [
                {
                  uuid: mov.uuid,
                  id: prodId,
                  nombre: nombreProd,
                  cantidad: mov.cant,
                  costo: mov.costo ?? 0,
                  stock_inicial: stockInicialFila,
                  saldo_final: saldoFinalFila,
                },
              ],
            });
          });

        this.saldoFinal = saldoAcum;
        this.listafiltrada = rows;

        this.progreso = 100;
        this.estadoTexto = "Listo";
      } catch (e) {
        console.error("Error cargando kardex por periodo:", e);
        this.listafiltrada = [];
        this.saldoInicial = 0;
        this.saldoFinal = 0;
      } finally {
        this.cargando = false;
        // si quieres dejar el 100 visible un momento, no lo reinicies
        // this.progreso = 0
      }
    },

    // ==========================
    // API REST (igual)
    // ==========================
    async api_rest(data, metodo) {
      const r = await axios({
        method: "POST",
        url: "https://api-distribucion-6sfc6tum4a-rj.a.run.app",
        headers: {},
        data: {
          bd: store.state.baseDatos.bd,
          data,
          metodo,
        },
      });
      return r?.data;
    },

    async procesaKardex() {
      try {
        const payload = { periodo: this.periodo };
        const json = await this.api_rest(payload, "genera_historial");
        if (!json?.ok) alert("Error procesando kardex");
        else alert("Kardex actualizado.");
      } catch (e) {
        console.error(e);
        alert("Error interno procesando kardex");
      }
    },
  },
};
</script>

