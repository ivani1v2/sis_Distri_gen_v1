<template>
  <v-container class="mb-6">
    <v-select :items="arraydocumento" label="Tipo" dense outlined v-model="tipodocumento"></v-select>
    <v-dialog persistent v-model="dialogoprogress" max-width="200">

      <v-card class="pa-12">
        <v-progress-circular :rotate="90" :size="100" :width="15" color="primary" indeterminate></v-progress-circular>
      </v-card>
    </v-dialog>

    <v-card>
      <v-btn block color="primary" dark @click="anulardocumento()">Anular documentos</v-btn>
      <v-card-title>
        <v-row class="mx-auto mt-4 text-center">
          <v-col cols="6" xs="6">
            <v-text-field type="date" v-model="date" label="Inicio"></v-text-field>
          </v-col>
          <v-col cols="6" xs="6">
            <v-text-field type="date" v-model="date2" label="Fin"></v-text-field>
          </v-col>
        </v-row>
      </v-card-title>

      <v-simple-table fixed-header height="70vh" dense>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">
                Correlativo
              </th>
              <th class="text-left">
                Fecha
              </th>
              <th class="text-left">
                Total
              </th>
              <th class="text-left">
                Accion
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listafiltrada" :key="item.id">
              <td>{{ item.numeracion }}</td>
              <td>{{ conviertefecha(item.fecha) }}</td>
              <td>S/.{{ item.total }}</td>
              <td> <v-checkbox v-model="item.anula"></v-checkbox> </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>

    </v-card>




    <v-dialog v-model="dialogoanula" max-width="590">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoanula = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card v-if="arrayAnula != ''">
        <v-card-title primary-title>
          Se generará el Resumen de Anulacion "RA-{{ ordenresumen }}"
        </v-card-title>
        <v-container grid-list-xs>
          <div v-for="item in arrayAnula" :key='item.item'>
            {{ item.serie }}-{{ item.correlativo }}
          </div>
        </v-container>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="anular()">Anular</v-btn>
          <v-btn color="success" @click="dialogoanula = false">No</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="arrayAnula == ''">
        <v-card-title primary-title>
          NO HA SELECCIONADO NI UN COMPROBANTE
        </v-card-title>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import {
  allCabecera, obtenContador, grabaAnulacionreferecia, grabaAnulacionrefereciaNC,
  sumaContador, grabaCabeceraRA, grabaDetalleRA, allCabeceraNCD
} from '../../db'

import moment from 'moment'
import { resumenBajaSunat, resumenComprobantes } from '../../servidorsunat'
export default {


  data: () => ({
    dialogoanula: false,
    snackbar: false,
    text: '',
    timeout: 2000,
    dialogoprogress: false,
    desserts: [],
    dessertsnc: [],
    arrayAnula: [],
    correlativo: '',
    date: moment(String(new Date)).format('YYYY-MM-DD'),
    date2: moment(String(new Date)).format('YYYY-MM-DD'),
    arraydocumento: ["FACTURA", "NOTA DE CREDITO", "BOLETA"],
    tipodocumento: "FACTURA"
  }),
  mounted() {
    allCabecera().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
    allCabeceraNCD().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.carganc);
  },
  destroyed() {
    allCabecera().off("value");
    allCabeceraNCD().off("value");
  },
  computed: {
    listafiltrada() {
      if (this.tipodocumento == "FACTURA" || this.tipodocumento == "BOLETA") {
        allCabecera().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.onDataChange);
        return this.desserts
      } else {
        allCabeceraNCD().orderByChild('fecha').startAt(moment(String(this.date)) / 1000).endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000).on("value", this.carganc);
        return this.dessertsnc
      }

    },
  },
  methods: {
    onDataChange(items) {
      let array = [];
      items.forEach((item) => {
        let data = item.val();
        if (data.tipocomprobante != 'T') {
          array.push({
            tipoDocumento: data.tipoDocumento,
            numeracion: data.numeracion,
            total: data.total,
            fecha: data.fecha,
            estado: data.estado,
            tipocomprobante: data.tipocomprobante,
            correlativoDocEmitido: data.correlativoDocEmitido,
            serie: data.serie,
            anula: false
          });
        }
      });

      this.desserts = array;
    },
    carganc(items) {

      let array = [];
      items.forEach((item) => {
        let data = item.val();
        array.push({
          numeracion: data.numeracion,
          correlativo: data.correlativo,
          correlativoDocEmitido: data.correlativo,
          total: data.total,
          fecha: data.fecha,
          estado: data.estado,
          tipocomprobante: data.tipocomprobante,
          hash: data.hash,
          mensajeSunat: data.mensajeSunat,
          serie: data.serie,
          serie_comp_ref: data.serie_comp_ref,
          tipo_comp_ref: data.tipo_comp_ref,
          correlativo_comp_ref: data.correlativo_comp_ref,
          anula: false
        });
      });

      this.dessertsnc = array;
    },

    conviertefecha(date) {
      return moment.unix(date).format('DD/MM/YYYY hh:mm A')
    },


    snack(text) {
      this.snackbar = true
      this.text = text
    },
    anular() {
      if (this.tipodocumento == "BOLETA") {
        this.anularRA()
      }
      else {
        this.dialogoprogress = true

        var fecha_1 = moment().format('YYYY-MM-DD')
        var fecha_2 = moment().format('YYYYMMDD')
        var fecha = moment().unix()
        var arrayCabecera = {
          fecha: fecha,
          tipo_comprobante: "RA",
          fecha_referencia: fecha_1,
          fecha_envio: fecha_1,
          serie: fecha_2,
          correlativo: this.ordenresumen,
          estado: 'PENDIENTE',
          mensajeSunat: '',
          ticket: '',
        }
        var arrayItems = this.arrayAnula
        console.log(arrayItems)
        resumenBajaSunat(arrayCabecera, arrayItems).then((r) => {
          console.log(r)
          if (r.data == "correcto") {
            this.grabaestadocomprobante(arrayItems, "RA" + this.ordenresumen)
            this.grabaanulacion(r, arrayCabecera, arrayItems)
          }
        })
      }
    },
    anularRA() {
      this.dialogoprogress = true
      var fecha_1 = moment().format('YYYY-MM-DD')
      var fecha_2 = moment().format('YYYYMMDD')
      var fecha = moment().unix()
      var arrayCabecera = {
        fecha: fecha,
        tipo_comprobante: "RC",
        fecha_referencia: fecha_1,
        fecha_envio: fecha_1,
        serie: fecha_2,
        correlativo: this.ordenresumen,
        estado: 'PENDIENTE',
        mensajeSunat: '',
        ticket: '',
      }
      var arrayItems = this.arrayAnula
      console.log(arrayItems)
      resumenComprobantes(arrayCabecera, arrayItems).then((r) => {
        console.log(r)
        this.dialogoprogress = false
        if (r.data == "correcto") {
          //   this.grabaestadocomprobante(arrayItems,"RA"+this.ordenresumen)
          // this.grabaanulacion(r,arrayCabecera,arrayItems)
        }
      })
    },
    grabaanulacion(resp, arrayCabecera, arrayItems) {
      arrayCabecera.ticket = resp.hash
      arrayCabecera.mensajeSunat = resp.hash
      grabaCabeceraRA("RA" + this.ordenresumen, arrayCabecera)
      grabaDetalleRA("RA" + this.ordenresumen, arrayItems).then((r) => {
        console.log(r)
        sumaContador("ordenresumen", (parseInt(this.ordenresumen) + 1).toString().padStart(4, 0))
        this.dialogoprogress = false
        this.dialogoanula = false
        this.router('resumenbaja')
      })

    },
    anulardocumento() {
      if (this.tipodocumento == "NOTA DE CREDITO") {
        this.anularnotacredito()
      }
      if (this.tipodocumento == "BOLETA") {
        this.anularBoleta()
      }
      if (this.tipodocumento == "FACTURA") {
        var array = []
        var item = 0
        for (var i = 0; i < this.desserts.length; i++) {
          if (this.desserts[i].anula) {
            item = item + 1
            if (this.desserts[i].tipocomprobante == "F") {
              var tipodoc = "01"
              var serie = this.desserts[i].serie
            } else {
              var tipodoc = "03"
              var serie = this.desserts[i].serie
            }
            array.push({
              item: item,
              tipo_comprobante: tipodoc,
              serie: serie,
              correlativo: this.desserts[i].correlativoDocEmitido,
              motivo: "Error en Documento",
            })
          }
        }
        this.arrayAnula = array
        this.obtencorrelativo().then((r) => {
          this.dialogoanula = true
        })

      }
    },
    obtencorrelativo() {
      var a = obtenContador().once("value").then((snapshot) => {
        this.ordenresumen = snapshot.val().ordenresumen
        if (snapshot.exists()) {
          return true
        }
      })
      return a
    },
    grabaestadocomprobante(array, correlativo) {
      if (this.tipodocumento == "FACTURA") {
        array.forEach((item) => {
          grabaAnulacionreferecia(item.serie.charAt(0) + item.correlativo, 'anulado', 'Anulado mediante Resumen de baja : ' + correlativo)
        })
      } else {
        array.forEach((item) => {
          grabaAnulacionrefereciaNC("NC" + item.correlativo, 'anulado', 'Anulado mediante Resumen de baja : ' + correlativo)
        })

      }

    },
    anularnotacredito() {
      var array = []
      var item = 0
      for (var i = 0; i < this.dessertsnc.length; i++) {
        if (this.dessertsnc[i].anula) {
          item = item + 1
          if (this.dessertsnc[i].tipocomprobante == "NC") {
            var tipodoc = '07'
            var serie = this.dessertsnc[i].serie
          }
          array.push({
            item: item,
            tipo_comprobante: tipodoc,
            serie: serie,
            correlativo: this.dessertsnc[i].correlativoDocEmitido,
            motivo: "Error en Documento",
          })
        }
      }
      this.arrayAnula = array
      this.obtencorrelativo().then((r) => {
        this.dialogoanula = true
      })
    },
    anularBoleta() {
      var array = []
      var item = 0
      for (var i = 0; i < this.desserts.length; i++) {
        if (this.desserts[i].anula) {
          item = item + 1
          if (this.desserts[i].tipocomprobante == "F") {
            var tipodoc = "01"
            var serie = this.desserts[i].serie
          } else {
            var tipodoc = "03"
            var serie = this.desserts[i].serie
          }
          array.push({
            item: item,
            tipo_comprobante: tipodoc,
            serie: serie,
            correlativo: this.desserts[i].correlativoDocEmitido,
            motivo: 3,
            total_a_pagar: "12.30",
            total_op_gravadas: "10.42",
            total_impuestos: "1.88"
          })
        }
      }
      this.arrayAnula = array
      this.obtencorrelativo().then((r) => {
        this.dialogoanula = true
      })
    },
    router(view) {
      this.$router.push({ name: view })
    },


  }
}
</script>