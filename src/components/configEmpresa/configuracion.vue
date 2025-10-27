<template>
  <v-dialog v-model="$store.state.dialogoConfiguracion" max-width="480px">
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogoConfiguracion')">mdi-close</v-icon>
        <v-spacer></v-spacer>
        <v-icon large color="green" @click="graba()">mdi-content-save</v-icon>
      </v-system-bar>
    </div>

    <v-card class="pa-5">
      <div>
        <v-row dense>
          <v-col cols="6">
            <v-checkbox dense v-model="inventario" label="Control Inventario"></v-checkbox>
          </v-col>

          <v-col cols="6">
            <v-checkbox dense v-model="sunat" label="Envio Directo Sunat"></v-checkbox>
          </v-col>

          <v-col dense cols="6" class="mt-n6">
            <v-checkbox dense v-model="flujocaja" label="Flujo caja"></v-checkbox>
          </v-col>

          <v-col cols="6" class="mt-n6">
            <v-checkbox dense v-model="detracciones" label="Detracciones"></v-checkbox>
          </v-col>

          <v-col cols="6" class="mt-n6">
            <v-checkbox dense v-model="creditofactura" label="Ventas al Credito"></v-checkbox>
          </v-col>

          <v-col cols="6" class="mt-n6">
            <v-checkbox dense v-model="mostrar_cuentas" label="mostrar cuentas "></v-checkbox>
          </v-col>
          <v-col cols="6" class="mt-n6">
            <v-checkbox dense v-model="copia_saldos_caja" label="Copia saldo Caja"></v-checkbox>
          </v-col>
          <v-col cols="6" class="mt-n6">
            <v-checkbox dense v-model="mostrar_ope_gratuitas" label="Mostrar Ope Gratuitas"></v-checkbox>
          </v-col>
          <v-col cols="6">
            <v-text-field dense v-model="cuenta_detra" label="Cuenta BN Detracciones"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-text-field dense v-model="decimal" label="Decimales"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-text-field dense v-model="igv" label="IGV" suffix="%"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-text-field dense v-model="icbper" label="ICBPER"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-select dense v-model="pordefecto" :items="arraydoc" menu-props="auto" hide-details
              label="Comprobante Defecto"></v-select>
          </v-col>

          <v-col cols="6">
            <v-select :items="arrayOperacion" label="Operacion X Defecto" dense outlined v-model="operacion"></v-select>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { allConfigura, grabaConfigura } from "../../db";
import store from "@/store/index";

export default {
  data() {
    return {
      // Solo variables usadas en el template
      inventario: false,
      sunat: false,
      flujocaja: false,
      detracciones: false,
      creditofactura: false,
      mostrar_cuentas: false,
      copia_saldos_caja: false,
      mostrar_ope_gratuitas: false,
      cuenta_detra: "",
      decimal: 2,
      igv: "18",
      icbper: "0.30",

      pordefecto: "T",
      arraydoc: ["T", "B", "F"],

      arrayOperacion: ["GRAVADA", "EXONERADA"],
      operacion: "GRAVADA",
    };
  },
  created() {
    this.inicializar();
  },
  methods: {
    inicializar() {
      allConfigura()
        .once("value")
        .then((snapshot) => {
          const config = snapshot.val();
          if (!config) return;

          const {
            sunat = this.sunat,
            inventario = this.inventario,
            decimal = this.decimal,
            igv = this.igv,
            icbper = this.icbper,
            flujocaja = this.flujocaja,
            defecto = this.pordefecto,
            creditofactura = this.creditofactura,
            mostrar_cuentas = this.mostrar_cuentas,
            operacion = this.operacion,
            detracciones = this.detracciones,
            cuenta_detra = this.cuenta_detra,
            copia_saldos_caja = this.copia_saldos_caja,
            mostrar_ope_gratuitas = this.mostrar_ope_gratuitas,
          } = config;

          Object.assign(this, {
            sunat,
            inventario,
            decimal,
            igv,
            icbper,
            flujocaja,
            pordefecto: defecto,
            creditofactura,
            mostrar_cuentas,
            operacion,
            detracciones,
            cuenta_detra,
            copia_saldos_caja,
            mostrar_ope_gratuitas
          });
        });
    },

    graba() {
      grabaConfigura("inventario", this.inventario);
      grabaConfigura("sunat", this.sunat);
      grabaConfigura("flujocaja", this.flujocaja);
      grabaConfigura("detracciones", this.detracciones);
      grabaConfigura("creditofactura", this.creditofactura);
      grabaConfigura("mostrar_cuentas", this.mostrar_cuentas);
      grabaConfigura("mostrar_ope_gratuitas", this.mostrar_ope_gratuitas);
      grabaConfigura("cuenta_detra", this.cuenta_detra);
      grabaConfigura("decimal", this.decimal);
      grabaConfigura("igv", this.igv);
      grabaConfigura("icbper", this.icbper);

      grabaConfigura("defecto", this.pordefecto);
      grabaConfigura("operacion", this.operacion);
      grabaConfigura("copia_saldos_caja", this.copia_saldos_caja);
      store.commit("dialogoConfiguracion");
    },
  },
};
</script>
