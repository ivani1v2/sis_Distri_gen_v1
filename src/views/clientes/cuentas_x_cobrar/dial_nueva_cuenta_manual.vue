<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card class="rounded-lg">
      <v-toolbar color="primary" dark dense height="48">
        <v-toolbar-title class="text-subtitle-1">Registrar Cuenta Manual</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="cerrar" dark small class="mr-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-3">
        <v-row dense>
          <v-col cols="12">
            <v-autocomplete v-model="clienteSeleccionado" :items="clientes" :filter="customFilter" item-text="nombre"
              item-value="id" label="Cliente *" outlined dense hide-details="auto" class="mb-2"
              prepend-inner-icon="mdi-account-search" :loading="buscandoClientes" return-object clearable
              @change="clienteChange" :search-input.sync="busquedaCliente">
              <template v-slot:item="{ item }">
                <v-list-item-content class="py-1">
                  <v-list-item-title class="text-body-2">{{ item.nombre }}</v-list-item-title>
                  <v-list-item-subtitle class="caption">{{ item.documento || item.id }}</v-list-item-subtitle>
                </v-list-item-content>
              </template>
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>No hay clientes que coincidan</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="6">
            <v-text-field v-model="documentoCliente" label="Documento" outlined dense hide-details="auto" class="mb-2"
              prepend-inner-icon="mdi-card-account-details" readonly></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-select v-model="vendedorSeleccionado" :items="vendedoresItems" item-text="nombre" item-value="codigo"
              label="Vendedor *" outlined dense hide-details="auto" class="mb-2" prepend-inner-icon="mdi-account-tie"
              clearable></v-select>
          </v-col>

          <v-col cols="6">
            <v-text-field v-model="docRef" label="ID Referencia *" outlined dense hide-details="auto" class="mb-2"
              prepend-inner-icon="mdi-identifier" placeholder="Ej: BD97-12345678" :error="docRefError"
              :error-messages="docRefErrorMsg" @input="docRef = $event.toUpperCase(); validarDocRef()"
              @blur="validarDocRefExistente"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-text-field v-model="montoTotal" label="Monto Total *" outlined dense hide-details="auto" class="mb-2"
              type="number" :prefix="monedaSimbolo"></v-text-field>
          </v-col>

          <v-col cols="6">
            <v-menu v-model="menuFechaEmision" :close-on-content-click="false" transition="scale-transition" offset-y
              max-width="290px" min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="fechaEmisionStr" label="Emisión *" prepend-inner-icon="mdi-calendar" readonly
                  v-bind="attrs" v-on="on" outlined dense hide-details="auto" class="mb-2"></v-text-field>
              </template>
              <v-date-picker v-model="fechaEmisionStr" @input="menuFechaEmision = false" locale="es-pe"></v-date-picker>
            </v-menu>
          </v-col>

          <v-col cols="6">
            <v-menu v-model="menuFechaVence" :close-on-content-click="false" transition="scale-transition" offset-y
              max-width="290px" min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="fechaVenceStr" label="Vence *" prepend-inner-icon="mdi-calendar-clock" readonly
                  v-bind="attrs" v-on="on" outlined dense hide-details="auto" class="mb-2"></v-text-field>
              </template>
              <v-date-picker v-model="fechaVenceStr" @input="menuFechaVence = false" locale="es-pe"></v-date-picker>
            </v-menu>
          </v-col>

          <v-col cols="12">
            <v-divider class="my-2"></v-divider>

            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-2 font-weight-bold">Cronograma</span>
              <v-chip small color="primary" class="ml-2">{{ totalCuotas }} cuota(s)</v-chip>
              <v-spacer></v-spacer>
              <v-btn small color="indigo" dark @click="abrirCronograma"
                :disabled="!montoTotal || parseFloat(montoTotal) <= 0">
                <v-icon left small>mdi-calendar-clock</v-icon>
                <span class="d-none d-sm-inline">Cronograma</span>
              </v-btn>
            </div>

            <v-alert v-if="montoTotal && parseFloat(montoTotal) > 0 && (!cronogramaData || sumaCuotas === 0)"
              type="info" dense class="mb-2">
              <div class="text-caption">
                Configure el cronograma de pago
              </div>
            </v-alert>

            <v-alert v-if="cronogramaData && Math.abs(parseFloat(montoTotal || 0) - sumaCuotas) > 0.01" type="warning"
              dense class="mb-2">
              <div class="text-caption">
                Descuadre: {{ monedaSimbolo }}{{ redondear(parseFloat(montoTotal || 0) - sumaCuotas) }}
              </div>
            </v-alert>

            <v-simple-table v-if="cronogramaData" dense class="table-compact">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-caption px-1">#</th>
                    <th class="text-caption px-1">Monto</th>
                    <th class="text-caption px-1">Vence</th>
                    <th class="text-caption px-1">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cuota, index) in cuotasLista" :key="index">
                    <td class="text-caption px-1">{{ cuota.numero }}</td>
                    <td class="text-caption px-1">{{ monedaSimbolo }}{{ redondear(cuota.importe) }}</td>
                    <td class="text-caption px-1">{{ formatearFechaResumida(cuota.vencimiento) }}</td>
                    <td class="px-1">
                      <v-chip x-small color="orange" dark>PEND</v-chip>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-2">
        <v-spacer></v-spacer>
        <v-btn small text @click="cerrar">Cancelar</v-btn>
        <v-btn small color="primary" @click="guardar" :loading="cargando" :disabled="!docRefValido">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>

    <cronograma v-if="dialogoCronograma" :totalCredito="parseFloat(montoTotal) || 0" :pagoInicial="0"
      :moneda="monedaSimbolo" :planExistente="cronogramaData" :fechaInicial="fechaVenceStr"
      @cierra="dialogoCronograma = false" @emite_cronograma="recibirCronograma" />
  </v-dialog>
</template>

<script>
import moment from 'moment'
import store from '@/store/index'
import { nuevaCuentaxcobrar, allcuentaxcobrar } from '../../../db'
import cronograma from '../../ventas/dialogos/cronograma_creditos.vue'

export default {
  name: 'dialNuevaCuentaManual',
  components: {
    cronograma
  },
  props: {
    value: Boolean,
    clientes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dialog: this.value,
      cargando: false,
      clienteSeleccionado: null,
      documentoCliente: '',
      buscandoClientes: false,
      vendedorSeleccionado: null,
      montoTotal: '',
      fechaEmisionStr: moment().format('YYYY-MM-DD'),
      fechaVenceStr: moment().add(30, 'days').format('YYYY-MM-DD'),
      menuFechaEmision: false,
      menuFechaVence: false,
      dialogoCronograma: false,
      cronogramaData: null,
      docRef: '',
      docRefError: false,
      docRefErrorMsg: '',
      docRefValido: false,
      docRefExiste: false,
      busquedaCliente: ''
    }
  },
  computed: {
    monedaSimbolo() {
      return this.$store.state.moneda?.find(m => m.codigo === this.$store.state.configuracion?.moneda_defecto)?.simbolo || 'S/';
    },
    totalCuotas() {
      return this.cronogramaData?.cuotas?.length || 0;
    },
    cuotasLista() {
      return this.cronogramaData?.cuotas || [];
    },
    sumaCuotas() {
      if (!this.cronogramaData?.cuotas) return 0;
      return this.cronogramaData.cuotas.reduce((sum, c) => sum + (parseFloat(c.importe) || 0), 0);
    },
    vendedoresItems() {
      const base = Array.isArray(this.$store.state.array_sedes)
        ? this.$store.state.array_sedes
        : [];
      return base;
    },
  },
  watch: {
    value(val) {
      this.dialog = val;
      if (val) {
        this.resetForm();
      }
    },
    dialog(val) {
      this.$emit('input', val);
    }
  },
  methods: {
    customFilter(item, queryText) {
      const busqueda = String(queryText || '').toLowerCase()

      const nombre = String(item.nombre || '').toLowerCase()
      const dni = String(item.id || '').toLowerCase()

      return nombre.includes(busqueda) || dni.includes(busqueda)
    },
    validarDocRef() {
      const regex = /^BD\d{2}-[A-Za-z0-9]+$/;
      if (!this.docRef) {
        this.docRefError = true;
        this.docRefErrorMsg = 'El ID es obligatorio';
        this.docRefValido = false;
      } else {
        this.docRefError = false;
        this.docRefErrorMsg = '';
        this.docRefValido = true;
      }
    },
    async validarDocRefExistente() {
      if (!this.docRefValido) return;

      try {
        const snapshot = await allcuentaxcobrar().child(this.docRef).once('value');
        if (snapshot.exists()) {
          this.docRefError = true;
          this.docRefErrorMsg = 'Este ID ya existe';
          this.docRefValido = false;
          this.docRefExiste = true;
        } else {
          this.docRefExiste = false;
        }
      } catch (error) {
        console.error('Error validando doc_ref:', error);
      }
    },
    clienteChange(cliente) {
      if (cliente) {
        this.documentoCliente = cliente.id;
      } else {
        this.documentoCliente = '';
      }
    },
    abrirCronograma() {
      if (!this.montoTotal || parseFloat(this.montoTotal) <= 0) {
        alert('Ingrese un monto válido');
        return;
      }
      this.dialogoCronograma = true;
    },
    recibirCronograma(cronograma) {
      this.cronogramaData = cronograma;
      if (cronograma.fecha_ultima_cuota) {
        this.fechaVenceStr = cronograma.fecha_ultima_cuota;
      }
      this.dialogoCronograma = false;
    },
    formatearFecha(fecha) {
      if (!fecha) return '';
      if (typeof fecha === 'number') {
        return moment.unix(fecha).format('DD/MM/YYYY');
      }
      return moment(fecha).format('DD/MM/YYYY');
    },
    formatearFechaResumida(fecha) {
      if (!fecha) return '';
      if (typeof fecha === 'number') {
        return moment.unix(fecha).format('DD/MM');
      }
      return moment(fecha).format('DD/MM');
    },
    redondear(valor) {
      return parseFloat(valor || 0).toFixed(store.state.configuracion?.decimal || 2);
    },
    validar() {
      if (!this.docRefValido) {
        alert('ID de referencia inválido');
        return false;
      }
      if (!this.clienteSeleccionado) {
        alert('Seleccione un cliente');
        return false;
      }
      if (!this.montoTotal || parseFloat(this.montoTotal) <= 0) {
        alert('Monto inválido');
        return false;
      }
      if (!this.fechaEmisionStr) {
        alert('Seleccione fecha de emisión');
        return false;
      }
      if (!this.fechaVenceStr) {
        alert('Seleccione fecha de vencimiento');
        return false;
      }
      if (!this.vendedorSeleccionado) {
        alert('Seleccione un vendedor');
        return false;
      }
      return true;
    },
    async guardar() {
      if (!this.validar()) return;

      await this.validarDocRefExistente();
      if (this.docRefExiste) {
        alert('El ID ya existe');
        return;
      }

      this.cargando = true;

      try {
        const fechaEmisionUnix = moment(this.fechaEmisionStr).unix();
        const fechaVenceUnix = moment(this.fechaVenceStr).unix();
        const ahora = moment().unix();
        const codigoVendedor = this.vendedorSeleccionado || '';

        const cuentaData = {
          doc_ref: this.docRef,
          documento: this.clienteSeleccionado.id || this.clienteSeleccionado.documento || '',
          nombre: this.clienteSeleccionado.nombre,
          direccion: this.clienteSeleccionado.direccion || '',
          telefono: this.clienteSeleccionado.telefono || '',
          empleado: '',
          fecha: fechaEmisionUnix,
          fecha_envio: ahora,
          fecha_registro: ahora,
          fecha_vence: fechaVenceUnix,
          monto_total: parseFloat(this.montoTotal),
          monto_pendiente: parseFloat(this.montoTotal),
          pagado: 0,
          estado: 'PENDIENTE',
          vendedor: codigoVendedor,
          cuenta_manual: true,
          usuario_registro: store.state.usuario?.correo || 'sistema'
        };

        if (this.cronogramaData?.cuotas?.length > 0) {
          cuentaData.datos = this.cronogramaData.cuotas.map((c, index) => ({
            id: index + 1,
            monto: parseFloat(c.importe),
            monto_original: parseFloat(c.importe),
            monto_pagado_acum: 0,
            fecha: fechaEmisionUnix,
            fecha_vence: moment(c.vencimiento).unix(),
            fecha_modificacion: ahora,
            estado: 'PENDIENTE',
            vendedor: codigoVendedor,
            pagos: []
          }));
        } else {
          cuentaData.datos = [{
            id: 1,
            monto: parseFloat(this.montoTotal),
            monto_original: parseFloat(this.montoTotal),
            monto_pagado_acum: 0,
            fecha: fechaEmisionUnix,
            fecha_vence: fechaVenceUnix,
            fecha_modificacion: ahora,
            estado: 'PENDIENTE',
            vendedor: codigoVendedor,
            pagos: []
          }];
        }

        await nuevaCuentaxcobrar(this.docRef, cuentaData);
        store.commit('dialogosnackbar', 'Cuenta registrada correctamente');
        this.$emit('cuenta-guardada', cuentaData);
        this.cerrar();

      } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar: ' + error.message);
      } finally {
        this.cargando = false;
      }
    },
    cerrar() {
      this.dialog = false;
      this.resetForm();
    },
    resetForm() {
      this.clienteSeleccionado = null;
      this.documentoCliente = '';
      this.vendedorSeleccionado = null;
      this.montoTotal = '';
      this.fechaEmisionStr = moment().format('YYYY-MM-DD');
      this.fechaVenceStr = moment().add(30, 'days').format('YYYY-MM-DD');
      this.cronogramaData = null;
      this.docRef = '';
      this.docRefError = false;
      this.docRefErrorMsg = '';
      this.docRefValido = false;
      this.docRefExiste = false;
      this.busquedaCliente = '';
    }
  }
}
</script>

<style scoped>
.table-compact>>>table {
  border-collapse: collapse;
}

.table-compact>>>td,
.table-compact>>>th {
  padding: 4px 2px !important;
  font-size: 11px;
}
</style>