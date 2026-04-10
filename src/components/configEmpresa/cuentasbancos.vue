<template>
  <v-dialog v-model="$store.state.dialogobancos" max-width="750px" scrollable transition="dialog-bottom-transition">
    <v-card class="rounded-xl overflow-hidden" style="background-color: #f4f7f9;">

      <v-toolbar color="blue-grey darken-4" dark flat>
        <v-icon left color="blue-grey lighten-3">mdi-bank-outline</v-icon>
        <v-toolbar-title class="subtitle-1 font-weight-bold">Cuentas Bancarias</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn x-small :color="dialog ? 'red lighten-1' : 'green darken-1'"
          @click="dialog = !dialog; if (dialog) initialize()" class="mr-2">
          <v-icon>{{ dialog ? 'mdi-minus' : 'mdi-plus' }}</v-icon> NUEVA CUENTA
        </v-btn>
        <v-btn icon @click="$store.commit('dialogobancos')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-expand-transition>
          <div v-if="dialog" style="background-color: white;">
            <v-container class="pa-6">
              <div class="caption font-weight-bold text-uppercase grey--text mb-4">Registrar Nueva Cuenta</div>
              <v-row dense>
                <v-col cols="12" sm="12">
                  <v-text-field v-model="editedItem.banco" label="Banco" outlined dense hide-details
                    class="mb-3"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.moneda" label="Moneda" outlined dense hide-details
                    class="mb-3"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.titular" label="Titular de la Cuenta" outlined dense hide-details
                    class="mb-3"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.cuenta" label="Número de Cuenta" outlined dense hide-details
                    class="mb-3"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.cci" label="CCI" outlined dense hide-details
                    class="mb-3"></v-text-field>
                </v-col>
              </v-row>
              <div class="d-flex justify-end mt-2">
                <v-btn color="blue-grey darken-3" dark class="px-8 rounded-pill text-none" @click.prevent="agrega()">
                  Guardar Cuenta
                </v-btn>
              </div>
            </v-container>
            <v-divider></v-divider>
          </div>
        </v-expand-transition>

        <v-container class="pa-4">
          <div class="caption font-weight-bold text-uppercase grey--text mb-2 ml-1">Mis Cuentas Registradas</div>
          <v-simple-table class="elevation-1 rounded-lg">
            <template v-slot:default>
              <thead class="grey lighten-4">
                <tr>
                  <th class="text-left caption font-weight-bold">BANCO</th>
                  <th class="text-left caption font-weight-bold">MONEDA</th>
                  <th class="text-left caption font-weight-bold">TITULAR</th>
                  <th class="text-left caption font-weight-bold">CUENTA / CCI</th>
                  <th class="text-center caption font-weight-bold">ACCION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in desserts" :key="item.banco">
                  <td class="font-weight-bold blue-grey--text text--darken-3">{{ item.banco }}</td>
                  <td>
                    <v-chip x-small label font-weight-bold color='blue lighten-5'>
                      {{ item.moneda }}
                    </v-chip>
                  </td>
                  <td class="py-2">
                    <div class="body-2 font-weight-medium">{{ item.titular }}</div>
                  </td>
                  <td class="py-2">
                    <div class="caption grey--text">{{ item.cuenta }}</div>
                    <div v-if="item.cci" class="caption blue--text">CCI: {{ item.cci }}</div>
                  </td>
                  <td class="text-center">
                    <v-btn icon small @click.prevent="elimina(item.banco)">
                      <v-icon color="red lighten-3" small>mdi-delete-outline</v-icon>
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="desserts.length === 0">
                  <td colspan="4" class="text-center py-4 grey--text">No hay cuentas registradas</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>

          <v-card outlined class="mt-6 rounded-lg border-dashed">
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-icon left color="primary">mdi-qrcode</v-icon>
                <span class="subtitle-2 font-weight-bold">Configuración de QR de Pago</span>
              </div>
              <v-row dense align="center">
                <v-col cols="12" sm="5">
                  <v-text-field v-model="qrItem.descripcion" label="Descripción" outlined dense
                    hide-details></v-text-field>
                </v-col>
                <v-col cols="12" sm="7">
                  <v-text-field v-model="qrItem.titular" label="Titular" outlined dense
                    hide-details></v-text-field>
                </v-col>
                <v-col cols="12" sm="10">
                  <v-text-field v-model="qrItem.serial" label="Serial" outlined dense hide-details
                    prepend-inner-icon="mdi-link-variant"></v-text-field>
                </v-col>
                <v-col cols="12" sm="2" class="text-center">
                  <v-btn icon :color="qrPreview ? 'red' : 'primary'" @click.prevent="verQr()"
                    :disabled="!qrItem.serial">
                    <v-icon>{{ qrPreview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                  </v-btn>
                </v-col>

                <v-col cols="12" class="d-flex mt-2">
                  <v-btn small color="blue-grey darken-4" dark depressed class="text-none rounded-pill px-4 mr-2"
                    @click.prevent="guardarQr()">
                    Guardar QR
                  </v-btn>
                  <v-btn small color="red" text class="text-none" @click.prevent="eliminarQr()">
                    Eliminar
                  </v-btn>
                </v-col>

                <v-col cols="12" v-if="qrPreview" class="d-flex justify-center mt-4">
                  <v-card outlined class="pa-2 bg-white">
                    <v-img :src="qrPreview" width="160" height="160" contain class="ml-8"></v-img>
                    <div class="caption text-center mt-1 grey--text font-italic">{{ qrItem.descripcion }}</div>
                    <div class="caption text-center mt-1 grey--text font-italic" v-if="qrItem.titular">{{ qrItem.titular }}</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4 white">
        <v-spacer></v-spacer>
        <v-btn color="blue-grey darken-4" text class="text-none font-weight-bold"
          @click="$store.commit('dialogobancos')">
          Cerrar Panel
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" top>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false" icon>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script>
import QR from 'qrcode-base64'
import { allBancos, nuevoBanco, eliminaBanco } from '../../db'

export default {

  data() {
    return {
      dialog: false,
      desserts: [],
      snackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
      editedItem: {
        banco: '',
        titular: '',
        moneda: '',
        cuenta: '',
        cci: ''
      },
      qrItem: {
        descripcion: '',
        titular: '',
        serial: ''
      },
      qrPreview: '',
    }
  },
  mounted() {
    allBancos().on("value", this.onDataChange);
  },
  beforeDestroy() {
    allBancos().off("value", this.onDataChange);
  },

  methods: {

    onDataChange(items) {
      this.desserts = []
      this.qrItem.descripcion = ''
      this.qrItem.titular = ''
      this.qrItem.serial = ''
      let array = [];
      items.forEach((item) => {
        let data = item.val();
        if (item.key === 'qr' || data.tipo === 'qr') {
          this.qrItem.descripcion = data.descripcion || ''
          this.qrItem.titular = data.titular || ''
          this.qrItem.serial = data.serial || ''
          return
        }
        array.push({
          banco: data.banco,
          titular: data.titular || '',
          moneda: data.moneda,
          cuenta: data.cuenta,
          cci: data.cci
        });
      });

      this.desserts = array;
    },
    initialize() {
      this.desserts = []
      this.qrItem.descripcion = ''
      this.qrItem.titular = ''
      this.qrItem.serial = ''
      allBancos().once("value").then((snapshot) => {
        snapshot.forEach((item) => {
          let data = item.val();
          if (item.key === 'qr' || data.tipo === 'qr') {
            this.qrItem.descripcion = data.descripcion || ''
            this.qrItem.titular = data.titular || ''
            this.qrItem.serial = data.serial || ''
            return
          }
          this.desserts.push({
            banco: data.banco,
            titular: data.titular || '',
            moneda: data.moneda,
            cuenta: data.cuenta,
            cci: data.cci
          });
        });
      })
    },
    agrega() {
      this.editedItem.banco = this.editedItem.banco.toUpperCase()
      this.editedItem.titular = this.editedItem.titular.toUpperCase()
      this.editedItem.moneda = this.editedItem.moneda.toUpperCase()
      nuevoBanco(this.editedItem.banco, this.editedItem)
      this.editedItem.banco = ''
      this.editedItem.titular = ''
      this.editedItem.moneda = ''
      this.editedItem.cuenta = ''
      this.editedItem.cci = ''
      this.dialog = false
      this.initialize()
      this.mostrarSnackbar('Cuenta agregada correctamente', 'success')
    },
    verQr() {
      if (this.qrPreview) {
        this.qrPreview = '';
        return;
      }
      if (!this.qrItem.serial) {
        this.qrPreview = '';
        return;
      }
      this.qrPreview = QR.drawImg(this.qrItem.serial, {
        typeNumber: 4,
        errorCorrectLevel: 'M',
        size: 500,
      });
    },
    guardarQr() {
      if (!this.qrItem.serial) {
        this.mostrarSnackbar('Serial QR obligatorio', 'error')
        return
      }
      const payload = {
        tipo: 'qr',
        descripcion: this.qrItem.descripcion || '',
        titular: this.qrItem.titular || '',
        serial: this.qrItem.serial || ''
      }
      nuevoBanco('qr', payload)
      this.verQr()
      this.initialize()
      this.mostrarSnackbar('QR actualizado correctamente', 'success')
    },
    eliminarQr() {
      eliminaBanco('qr')
      this.qrItem.descripcion = ''
      this.qrItem.titular = ''
      this.qrItem.serial = ''
      this.qrPreview = ''
      this.initialize()
      this.mostrarSnackbar('QR eliminado correctamente', 'info')
    },
    elimina(id) {
      eliminaBanco(id)
      this.mostrarSnackbar('Cuenta eliminada correctamente', 'info')
    },
    mostrarSnackbar(texto, color = 'success') {
      this.snackbarText = texto
      this.snackbarColor = color
      this.snackbar = true
    }
  }

}
</script>

<style scoped>
.border-dashed {
  border: 2px dashed #e0e0e0 !important;
}

.v-data-table>>>td {
  height: 54px !important;
}
</style>