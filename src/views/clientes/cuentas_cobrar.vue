<template>
  <div class="pa-1 mt-6">
    <v-card>
      <v-row class="" dense>
        <v-col cols="6">
          <v-select outlined v-model="cuenta_estado" :items="array_estado" dense></v-select>
        </v-col>
        <v-col cols="6">
          <v-layout dense align-center>
            <v-flex>
              <v-autocomplete outlined dense autofocus label="Busca Cliente" auto-select-first v-model="busca_p"
                :items="arra_empleados" append-icon="mdi-magnify"></v-autocomplete>
            </v-flex>
            <v-btn icon large color="info" class="mt-n6 " @click="filtra">
              <v-icon>mdi-filter</v-icon>
            </v-btn>
          </v-layout>
        </v-col>
      </v-row>
      <v-row class="mt-n8 pa-1 text-center">
        <v-col cols="6">
          <v-btn :disabled="busca_p == ''" color="success" block small @click="imprime_cuenta()">
            Imprime Cuenta
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn :disabled="busca_p == ''" color="error" block small @click="liquida_total()">
            Liquida Total
          </v-btn>
        </v-col>
        <v-col cols="12">

        </v-col>
      </v-row>
      <h4 class="mt-n6">Total S/.{{ suma_total().toFixed(2) }}</h4>
      <v-data-table :headers="headersCxc" :items="listafiltrada" dense fixed-header height="65vh" :items-per-page="-1"
        class="elevation-1" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc">

        <!-- cliente -->
        <template v-slot:item.cliente="{ item }">
          {{ item.nombre }}
        </template>

        <!-- emision -->
        <template v-slot:item.fecha="{ item }">
          {{ conviertefecha(item.fecha) }}
        </template>

        <!-- vence -->
        <template v-slot:item.fecha_vence="{ item }">
          {{ conviertefecha(item.fecha_vence) }}
        </template>

        <!-- total -->
        <template v-slot:item.monto_total="{ item }">
          S/.{{ redondear(item.monto_total) }}
        </template>

        <!-- pendiente -->
        <template v-slot:item.monto_pendiente="{ item }">
          S/.{{ redondear(item.monto_pendiente) }}
        </template>

        <!-- pagado -->
        <template v-slot:item.pagado="{ item }">
          <span class="red--text">
            S/.{{ item.pagado == undefined ? '0.00' : redondear(item.pagado) }}
          </span>
        </template>

        <!-- accion -->
        <template v-slot:item.accion="{ item }">
          <v-row>
            <v-col cols="6">
              <v-icon color="red" @click="ejecuta_liquidacion(item)">mdi-hand-heart</v-icon>
            </v-col>
            <v-col cols="6">
              <v-icon color="green" @click.prevent="ejecutaConsolida(item)">mdi-eye</v-icon>
            </v-col>
          </v-row>
        </template>
      </v-data-table>


    </v-card>


    <v-dialog v-model="dialog" max-width="590">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialog = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <v-icon color="red" large @click.prevent="verPDF(item_selecto)">mdi-text-box-search-outline</v-icon>
        </v-system-bar>
      </div>
      <v-card>
        <v-virtual-scroll :items="arrayConsolidar" :item-height="55" height="400">
          <template v-slot:default="{ item }">
            <v-list-item>
              <v-list-item-avatar>
                <v-icon small class="green lighten-1" dark>
                  {{ item.cantidad }}
                </v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title v-text="item.nombre"></v-list-item-title>

                <v-list-item-subtitle v-text="'S/.' + item.precio + ' x ' + item.medida"></v-list-item-subtitle>

                <v-list-item-subtitle v-if="item.preciodescuento != 0" class="red--text"
                  v-text="'Descuento (S/.' + item.preciodescuento + ') = S/.' + redondear(item.precioedita - item.preciodescuento)">
                </v-list-item-subtitle>

              </v-list-item-content>

              <v-list-item-action>
                <v-icon color="red lighten-1">S/{{ redondear((item.precioedita * item.cantidad) -
                  item.preciodescuento) }}</v-icon>
              </v-list-item-action>
            </v-list-item>

          </template>

        </v-virtual-scroll>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog_liquidacion" max-width="650">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialog_liquidacion = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <v-icon color="red" large @click.prevent="eliminar(item_selecto)">mdi-delete</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-1">
        <v-card-title primary-title class="text-center mt-n4">
          <p>Liquidacion de Credito </p>
          <v-spacer></v-spacer>
          <p class="red--text">Vence: {{ conviertefecha(item_selecto.fecha_vence) }}</p>
        </v-card-title>
        <v-card-text class="mt-n6">
          <h4>Comprobante : {{ item_selecto.doc_ref }}</h4>
          <h4>Cliente : {{ item_selecto.nombre }}</h4>
          <h4>Total : S/.{{ item_selecto.monto_total }}</h4>
        </v-card-text>
        <v-card height="300px" class="pa-3">
          <v-simple-table fixed-header dense>
            <thead>

              <tr>
                <th class="text-left">
                  Estado
                </th>
                <th class="text-left">
                  monto
                </th>
                <th class="text-left">
                  Vence
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in item_selecto.datos" :key="item.key">
                <td>{{ item.estado }}</td>
                <td>S/.{{ item.monto }}</td>
                <td>{{ conviertefecha(item.fecha_vence) }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card>
        <v-card-actions>
          <v-row class="pa-2">
            <v-col cols="6">
              <v-btn block color="warning" @click="abre_amortiza()">LIQUIDA</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn v-if="false" block color="error" @click="dialog_reprograma = true">Reprograma</v-btn>
            </v-col>
          </v-row>

        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog_reprograma" max-width="450">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialog_reprograma = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <v-icon color="green" large @click="reprograma()">mdi-content-save</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-1">
        <v-card-title primary-title class="text-center mt-n4">
          <p>Reprogramacion </p>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6">
              <v-text-field disabled type="date" dense v-model="date" label="Fecha modificacion"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field type="date" dense v-model="date_promesa" label="Promesa de pago"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="liquida_to" max-width="450">
      <div>
        <v-system-bar window dark>
          <v-icon @click="liquida_to = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <v-icon color="green" @click="guarda_liq()" large>mdi-content-save</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-1">
        <v-card-title primary-title class="text-center mt-n4">
          <p>Liquidacion Total </p>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6">
              <h4>Amortizacion - <span class="red--text">S/.{{ monto_amor }}</span></h4>
            </v-col>
            <v-col cols="6">
              <v-select v-model="modo_amortiza" :items="$store.state.modopagos" dense></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-btn color="error" block small @click="guarda_liq()">
          Liquida Total
        </v-btn>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog_amortiza" max-width="450">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialog_amortiza = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
          <v-icon color="green" @click="amortiza()" large>mdi-content-save</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-1">
        <v-card-title primary-title class="text-center mt-n4">

          <h4>Amortizacion - <span class="red--text">S/.{{ monto_amor }}</span></h4>

        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6">
              <v-select v-model="modo_amortiza" :items="$store.state.modopagos" dense></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field outlined dense type="number" v-model="a_cuenta" label="A cuenta"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog_detalle_cuota" max-width="350">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialog_detalle_cuota = false">mdi-close</v-icon>
          <v-spacer></v-spacer>
        </v-system-bar>
      </div>
      <v-card class="pa-3">

        <h4>Modificado: {{ conviertefecha(detalle.fecha_modificacion) }} </h4>
        <h4>Responsable.: {{ detalle.vendedor }} </h4>
        <h4 v-if="detalle.amortizado != undefined">Monto Amortiza: S/.{{ detalle.amortizado }} </h4>

      </v-card>
    </v-dialog>
    <v-dialog v-model="genera_pdf" max-width="550">
      <div>
        <v-system-bar window dark>
          <v-icon @click="(genera_pdf = !genera_pdf)">mdi-close</v-icon>
          <v-spacer></v-spacer>
        </v-system-bar>
      </div>
      <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />
    </v-dialog>
  </div>
</template>

<script>
import imprime from '@/components/dialogos/dialog_imprime'
import {
  allcuentaxcobrar,
  consultaDetalle,
  consulta_Cabecera,
  nuevoflujo,
  nuevaCuentaxcobrar,
  editaCuentaxCobrar,
  grabaCabecera,

} from '../../db'
import store from '@/store/index'

import {
  pdfGenera_resumen
} from '../../pdf_comprobantes'
import moment from 'moment'
import {
  pdf_cuentas_cobrar,
  pdf_liquida_prestamo
} from '../../pdf_reportes'
import XLSX from 'xlsx'
export default {
  components: {
    imprime
  },

  data: () => ({
    headersCxc: [
      { text: 'Cliente', value: 'cliente', sortable: true },          // cliente formateado
      { text: 'Emision', value: 'fecha', sortable: true },            // usa timestamp para ordenar real
      { text: 'Venci.', value: 'fecha_vence', sortable: true },
      { text: 'Estado', value: 'estado', sortable: true },
      { text: 'Total', value: 'monto_total', sortable: true, align: 'end' },
      { text: 'Pendiente', value: 'monto_pendiente', sortable: true, align: 'end' },
      { text: 'Pagado', value: 'pagado', sortable: true, align: 'end' },
      { text: 'Accion', value: 'accion', sortable: false, align: 'center' },
    ],
    documento: '',
    desserts: [],
    dialog: false,
    dialog_liquidacion: false,
    dialog_detalle_cuota: false,
    arrayConsolidar: [],
    buscar: '',
    date: moment(String(new Date)).format('YYYY-MM-DD'),
    date_promesa: moment(String(new Date)).format('YYYY-MM-DD'),
    rechazados: 0,
    error: '',
    item_selecto: [],
    modo: 'EFECTIVO',
    ordenflujo: '',
    array_estado: ['PENDIENTE', 'LIQUIDADO'],
    cuenta_estado: 'PENDIENTE',
    dialog_reprograma: false,
    dialog_amortiza: false,
    dialog_liquida: false,
    monto_amortiza: 0,
    modo_amortiza: 'EFECTIVO',
    date1: moment(String(new Date)).format('YYYY-MM-DD'),
    detalle: [],
    date_exportar: moment(String(new Date)).format('YYYY-MM-DD'),
    date2_exportar: moment(String(new Date)).format('YYYY-MM-DD'),
    array_exportar: [],
    n_operacion: '',
    seleccionado: '',
    genera_pdf: false,
    busca_p: '',
    arra_empleados: [],
    liquida_to: false,
    a_cuenta: 0,
    sortBy: ['cliente'],   // ordena inicialmente por cliente
    sortDesc: [false],     // false = A→Z, true = Z→A
  }),
  created() {

  },
  computed: {
    monto_amor() {
      if (this.modo_amortiza == 'TARJETA') {
        var a = this.monto_amortiza * 1.05
      } else {
        var a = this.monto_amortiza
      }
      return a
    },
    listafiltrada() {

      if (this.cuenta_estado == 'LIQUIDADO') {
        var array = this.desserts.filter((item) => (item.documento + item.nombre)
          .toLowerCase().includes(this.buscar.toLowerCase()))
      } else {
        var array = this.desserts.filter((item) => (item.documento + item.nombre)
          .toLowerCase().includes(this.buscar.toLowerCase()))
      }
      return array
    }
  },
  watch: {
    '$store.state.clientessearch': {
      immediate: true,
      handler(nuevo) {
        const base = Array.isArray(nuevo) ? nuevo : []
        this.arra_empleados = base.map(it => `${it.id} / ${it.nombre}`)
      }
    },
  },
  methods: {
    async ejecutaConsolida(value) {
      console.log(value)
      store.commit("dialogoprogress", 1)
      this.arrayConsolidar = []
      this.seleccionado = value
      var snap = await consultaDetalle(value.doc_ref).once("value")
      snap.forEach((item) => {
        this.arrayConsolidar.push(item.val())
      })
      store.commit("dialogoprogress", 1)
      this.dialog = true

    },
    async liquida_total() {
      store.commit("dialogoprogress", 1)
      if (this.desserts == '') {
        alert('sin data')
        return
      }
      this.monto_amortiza = this.suma_total()
      this.liquida_to = true
      store.commit("dialogoprogress", 1)
    },
    async guarda_liq() {
      store.commit("dialogoprogress", 1)
      await this.imprime_cuenta()
      var aa = this.desserts
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i]
        await editaCuentaxCobrar(data.doc_ref, 'estado', 'LIQUIDADO')
        await grabaCabecera(data.doc_ref + '/forma_pago', 'PAGADO')
      }
      await this.genera_flujo(this.modo_amortiza, this.monto_amor, data)
      this.liquida_to = false
      this.filtra()
      store.commit("dialogoprogress", 1)
    },
    async filtra() {
      var array = []
      var cli = this.busca_p.split('/')[0].trim()

      let snap
      if (this.busca_p == '') {
        snap = await allcuentaxcobrar().once("value")
      } else {
        snap = await allcuentaxcobrar()
          .orderByChild("documento")
          .equalTo(cli)
          .once("value")
      }

      if (snap.exists()) {
        snap.forEach(item => {
          const data = item.val()

          if (data.estado === this.cuenta_estado) {
            // normalizamos nombre / cliente
            const nom = data.nombre || data.cliente || ''
            array.push({
              ...data,
              nombre: nom,
              cliente: nom, // 👈 clave nueva usada para ordenar en la tabla
            })
          }
        })
      }

      this.desserts = array
    },
    async eliminar(item) {
      const confirmado = confirm(`¿Eliminar la cuenta por cobrar del cliente ${item.nombre} con comprobante ${item.doc_ref}? Esta acción no se puede deshacer.`)
      if (!confirmado) {
        return
      }
      store.commit("dialogoprogress", 1)
      try {
        await editaCuentaxCobrar(item.doc_ref, 'estado', 'ELIMINADO')
        this.filtra()
        this.dialog_liquidacion = false
        alert('Cuenta por cobrar eliminada correctamente.')
      } catch (error) {
        console.error('Error al eliminar la cuenta por cobrar:', error)
        alert('Ocurrió un error al eliminar la cuenta por cobrar. Por favor, inténtelo de nuevo.')
      } finally {
        store.commit("dialogoprogress", 1)
      }
    },
    async imprime_cuenta() {
      store.commit("dialogoprogress", 1)
      var array = []
      var aa = this.desserts
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i]
        var snapshot = await consultaDetalle(data.doc_ref).once("value")
        snapshot.forEach((item) => {
          var datas = item.val()
          array.push(datas)
        })
      }
      pdfGenera_resumen(array)
      store.commit("dialogoprogress", 1)
      return true
    },

    ejecutareporte() {
      var fecha = this.date1
      pdf_cuentas_cobrar(this.desserts, fecha)

    },
    suma_total() {
      var aa = this.desserts
      var suma = 0
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i]
        suma = suma + parseFloat(data.monto_pendiente)
      }
      return suma
    },
    reprograma() {
      store.commit("dialogoprogress")
      var deuda = this.item_selecto
      var array_data = deuda.datos
      var nuevo_mov = {
        id: array_data.length,
        fecha: moment().unix(),
        fecha_vence: (moment(String(this.date_promesa)) / 1000),
        monto: this.item_selecto.monto_pendiente,
        estado: 'REPROGRAMACION',
        doc_ref: 0,
        modo_pago: ''
      }
      array_data.push(nuevo_mov)
      deuda.fecha_vence = (moment(String(this.date_promesa)) / 1000)
      nuevaCuentaxcobrar(deuda.doc_ref, deuda).then(() => {
        this.dialog_reprograma = false
        this.dialog_liquidacion = false
        store.commit("dialogoprogress")
      })
    },
    abre_amortiza() {
      this.monto_amortiza = this.item_selecto.monto_pendiente
      this.a_cuenta = this.item_selecto.monto_pendiente
      this.dialog_amortiza = true
    },
    async amortiza() {
      store.commit("dialogoprogress")
      var item = this.item_selecto
      var deuda = this.item_selecto
      var array_data = deuda.datos
      var nuevo_mov = {
        id: array_data.length,
        fecha: moment().unix(),
        fecha_vence: moment().unix(),
        monto: this.a_cuenta,
        estado: 'ABONO',
        doc_ref: 0,
        modo_pago: ''
      }
      array_data.push(nuevo_mov)
      await editaCuentaxCobrar(item.doc_ref, 'datos', array_data)
      await editaCuentaxCobrar(item.doc_ref, 'f_pago', moment().unix())
      if (this.monto_amor == this.a_cuenta) {
        Promise.all([
          editaCuentaxCobrar(item.doc_ref, 'estado', 'LIQUIDADO'),
          editaCuentaxCobrar(item.doc_ref, 'pagado', this.monto_amor),
          grabaCabecera(item.doc_ref + '/forma_pago', 'PAGADO'),
          this.genera_flujo(this.modo_amortiza, this.monto_amor, this.item_selecto)
        ]);
        this.dialog_liquidacion = false
        this.dialog_amortiza = false
        this.n_operacion = ''
      } else {
        var importe = this.monto_amor - this.a_cuenta
        await editaCuentaxCobrar(item.doc_ref, 'monto_pendiente', importe)
        await this.genera_flujo(this.modo_amortiza, this.a_cuenta, this.item_selecto)
        this.dialog_liquidacion = false
        this.dialog_amortiza = false

      }
      this.imprime_liquidacion(array_data)
      this.filtra()
      store.commit("dialogoprogress")

    },
    async imprime_liquidacion(abonos) {
      var array = []
      var aa = this.desserts
      for (var i = 0; i < aa.length; i++) {
        var data = aa[i]
        var snapshot = await consultaDetalle(data.doc_ref).once("value")
        snapshot.forEach((item) => {
          var datas = item.val()
          array.push(datas)
        })
      }
      pdf_liquida_prestamo(array, abonos)

      return true
    },
    async genera_flujo(modo, monto, cabecera) {
      console.log(cabecera)
      var fecha = moment().unix()
      var flujo = {
        operacion: 'ingreso',
        observacion: 'Pago Credito - ' + cabecera.nombre,
        numeracion_doc: cabecera.doc_ref,
        modo: modo,
        fecha: fecha,
        total: monto,
        estado: 'activo',
        responsable: store.state.permisos.correo.slice(0, -13),
        sujeto: store.state.permisos.correo.slice(0, -13),
      }
      await nuevoflujo(flujo)
      return true
    },
    conviertefecha(date) {
      return moment.unix(date).format('DD/MM/YY')
    },
    redondear(valor) {
      return parseFloat(valor).toFixed(store.state.configuracion.decimal)
    },
    async verPDF(item) {
      var a = await consulta_Cabecera(item.doc_ref).once('value')
      if (!a.exists()) {
        alert('COMPROBANTE NO EXISTE')
        return
      }
      this.seleccionado = a.val()
      this.genera_pdf = true
    },
    ejecuta_liquidacion(value) {
      this.item_selecto = value
      this.dialog_liquidacion = true

    },
    analiza_fecha(datas) {
      var hoy = moment(String(this.date1))
      var data = moment.unix(datas)

      var result = false
      if (data.isBefore(hoy, 'days')) {
        result = true
      }
      if (data.isSame(hoy, 'days')) {
        result = true
      }
      return result
    },
    exporta() {
      this.array_exportar = []
      this.formatea_tabla(this.listafiltrada, 0)
    },
    formatea_tabla(array, i) {
      if (i < array.length) {
        var data = array[i]
        this.array_exportar.push({
          vendedor: data.vendedor,
          doc_cliente: data.documento,
          nom_cliente: data.nombre,
          fecha_emision: this.conviertefecha(data.fecha),
          fecha_vence: this.conviertefecha(data.fecha_vence),
          compro_ref: data.doc_ref,
          total_comprob: parseFloat(data.monto_total),
          monto_pendiente: parseFloat(data.monto_pendiente)
        })
        this.formatea_tabla(array, i + 1)
      } else {
        this.exportar_excel()
      }
    },
    exportar_excel() {
      var array = this.array_exportar
      var data = XLSX.utils.json_to_sheet(array)
      const workbook = XLSX.utils.book_new()
      const filename = 'DATA'
      XLSX.utils.book_append_sheet(workbook, data, "ventas")
      XLSX.writeFile(workbook, `${filename}.xlsx`)
    }
  }
}
</script>
