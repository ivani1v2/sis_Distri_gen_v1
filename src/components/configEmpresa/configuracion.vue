<template>
  <v-dialog v-model="$store.state.dialogoConfiguracion" max-width="550px">
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
            <v-checkbox dense v-model="inventario" label="Control Inventario">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>Sistema bloqueará ventas cuando no haya stock disponible.</span>
                </v-tooltip>
              </template>
            </v-checkbox>
          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="flujocaja" label="Flujo caja">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>Todas las ventas directas se registran en el flujo de caja.</span>
                </v-tooltip>
              </template>
            </v-checkbox>
          </v-col>
          <v-col cols="6" class="mt-n4">
            <v-checkbox dense v-model="creditofactura" label="Ventas al Credito"></v-checkbox>
          </v-col>
          <v-col cols="6" class="mt-n4">
            <v-checkbox dense v-model="copia_saldos_caja" label="Copia saldo Caja"></v-checkbox>
          </v-col>

          <v-col cols="12" class="mt-n4">
            <v-divider class="my-2" color="grey"></v-divider>
          </v-col>

          <v-col cols="6" class="d-flex align-center mt-1 mb-3">
            <v-checkbox dense v-model="detracciones" hide-details class="ma-0 pa-0">
            </v-checkbox>

            <span v-if="!detracciones" class="text-caption mr-3">Activar Detracciones</span>
            <v-text-field v-if="detracciones" class="mb-n6" outlined dense v-model="cuenta_detra"
              label="Cuenta BN Detracciones"></v-text-field>


            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon small color="blue" v-bind="attrs" v-on="on" class="ml-1">mdi-help-circle</v-icon>
              </template>
              <span>Activa campo para ingresar operacion de venta afectas a Detraccion</span>
            </v-tooltip>
          </v-col>



          <v-col cols="12" class="mt-n3">
            <v-divider class="my-2" color="grey"></v-divider>
          </v-col>

          <v-col cols="6" class="mt-n4">
            <v-checkbox dense v-model="mostrar_cuentas" label="Mostrar cuentas"></v-checkbox>
          </v-col>


          <v-col cols="6" class="mt-n4">
            <v-checkbox dense v-model="mostrar_ope_gratuitas" label="Mostrar Ope Gratuitas"></v-checkbox>
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

          <v-col cols="6" class="d-flex align-center mt-n4">
            <v-checkbox dense v-model="usar_comprobante_defecto" hide-details class="ma-0 pa-0">
            </v-checkbox>

            <span v-if="!usar_comprobante_defecto" class="text-caption mr-3">Comprobante Defecto</span>

            <v-select v-if="usar_comprobante_defecto" dense v-model="pordefecto" :items="arraydoc" menu-props="auto"
              hide-details label="Comprobante" item-text="texto" item-value="valor"></v-select>

            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon small color="blue" v-bind="attrs" v-on="on" class="ml-1">mdi-help-circle</v-icon>
              </template>
              <span>Si está ACTIVO, se usará el comprobante seleccionado aquí. Si NO
                se usará el tipo de comprobante asignado a cada cliente.</span>
            </v-tooltip>
          </v-col>

          <v-col cols="6">
            <v-select :items="arrayOperacion" label="Operacion X Defecto" dense outlined v-model="operacion"></v-select>
          </v-col>

          <!-- NUEVO: Moneda por defecto -->
          <v-col cols="6">
            <v-select dense outlined v-model="moneda_defecto" :items="monedasOpciones" item-text="label"
              item-value="codigo" label="Moneda por defecto"></v-select>
          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="sincroniza_tipo_cambio" label="Sinc. Tipo Cambio">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>solo para empresas que manejan ventas en Soles y Dolares Sincroniza automáticamente el tipo de
                    cambio. y de
                    pasar de una moenda a otra la convierte en su equivalente de forma automatica. </span>
                </v-tooltip>
              </template>
            </v-checkbox>

          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="alerta_stock_minimo" label="Alerta Stock Mínimo">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>Muestra una alerta en PRODUCTOS con stock por debajo del mínimo registrado.</span>
                </v-tooltip>
              </template>
            </v-checkbox>
          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="desc_porcentaje" label="Descuento x %">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>Activa las opciones de hasta 3 descuentos en porcentaje en venta y Preventa</span>
                </v-tooltip>
              </template>
            </v-checkbox>
          </v-col>
          <v-col cols="6">
            <v-checkbox dense v-model="linea_credito_activo" label="Línea de Crédito">
              <template v-slot:append>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                  </template>
                  <span>Habilita la gestión de línea de crédito por cliente. Si está activo, se validará que la deuda no
                    supere el
                    límite asignado en pre-ventas.</span>
                </v-tooltip>
              </template>
            </v-checkbox>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { allConfigura, grabaConfigura, nuevaEmpresa } from "../../db";
import store from "@/store/index";

export default {
  data() {
    return {
      inventario: false,
      sunat: true,
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
      distancia_visita: 15,
      pordefecto: "T",
      arraydoc: [{
        valor: 'T', texto: 'NOTA',
      }, {
        valor: 'B', texto: 'BOLETA'
      }, {
        valor: 'F', texto: 'FACTURA'
      }],
      arrayOperacion: ["GRAVADA", "EXONERADA"],
      operacion: "GRAVADA",
      empresa: "",
      sincroniza_tipo_cambio: false,
      desc_porcentaje: false,
      alerta_stock_minimo: false,
      linea_credito_activo: false,
      usar_comprobante_defecto: false,
      moneda_defecto: "PEN",
    };
  },
  created() {
    this.empresa = this.$store.state.baseDatos;
    this.inicializar();
  },
  computed: {
    // Construye opciones a partir de this.$store.state.moneda
    monedasOpciones() {
      const arr = (this.$store.state.moneda || []);
      return arr.map(m => ({
        ...m,
        label: `${m.simbolo} - ${m.moneda}`, // ej: "S/ - Sol"
      }));
    },
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
            distancia_visita = this.distancia_visita,
            sincroniza_tipo_cambio = this.sincroniza_tipo_cambio,
            desc_porcentaje = this.desc_porcentaje,
            alerta_stock_minimo = this.alerta_stock_minimo,
            linea_credito_activo = this.linea_credito_activo,
            usar_comprobante_defecto = this.usar_comprobante_defecto,
            moneda_defecto = this.moneda_defecto,
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
            distancia_visita,
            mostrar_ope_gratuitas,
            moneda_defecto,
            sincroniza_tipo_cambio,
            desc_porcentaje,
            alerta_stock_minimo,
            linea_credito_activo,
            usar_comprobante_defecto,
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
      grabaConfigura("distancia_visita", this.distancia_visita);
      grabaConfigura("sincroniza_tipo_cambio", this.sincroniza_tipo_cambio);
      grabaConfigura("desc_porcentaje", this.desc_porcentaje);
      grabaConfigura("alerta_stock_minimo", this.alerta_stock_minimo);
      grabaConfigura("linea_credito_activo", this.linea_credito_activo);
      grabaConfigura("usar_comprobante_defecto", this.usar_comprobante_defecto);
      grabaConfigura("moneda_defecto", this.moneda_defecto);
      store.commit("dialogoConfiguracion");
    },
  },
};
</script>
