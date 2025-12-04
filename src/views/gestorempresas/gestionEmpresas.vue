<template>
  <v-container grid-list-xs>
    <v-dialog v-model="progress" max-width="200" persistent>
      <v-card>
        <v-progress-circular :rotate="90" :size="200" :width="15" :value="Uploadvalue" color="red">
          {{ Uploadvalue }}
        </v-progress-circular>
      </v-card>

    </v-dialog>
    <h3 class="text-center">{{ $store.state.empresaselecta.namecomercial }}({{ $route.params.bd }})</h3>
    <v-card>
      <v-card-title primary-title>
        <v-btn color="success" block @click="dialogoCreaalerta = !dialogoCreaalerta">Crea Alerta</v-btn>
        <v-btn class="mt-3" color="success" block @click="dialogoPagos = !dialogoPagos">INGRESAR PAGO</v-btn>
      </v-card-title>
    </v-card>
    <v-dialog v-model="dialogoCreaalerta" max-width="390">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoCreaalerta = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-textarea v-model="mensaje" auto-grow filled label="mensaje" rows="1"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="grabamensaje()">
            Graba
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="dialogoPagos" max-width="490">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoPagos = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-btn color="success" block @click="dialogogenera = !dialogogenera">GENERA CRONOGRAMA</v-btn>
        <v-btn color="success" class="mt-2" block @click="cargaperido()">INGRESA PAGO</v-btn>
        <v-btn color="success" class="mt-2" block @click="cargacronograma()">VISUALIZAR PAGOS</v-btn>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogogenera" max-width="490">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogogenera = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-card-text>
          <v-text-field dense v-model="fpago" label="fechas de pago"></v-text-field>
          <v-text-field dense v-model="periodos" label="MESES A GENERAR"></v-text-field>

        </v-card-text>
        <v-card-actions>
          <v-btn color="success" block @click="generaperiodos()">GENERA</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="dialogoingresapago" max-width="490">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogoingresapago = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card class="pa-3">
        <v-card-text>
          <v-select :items="arrayperiodo" label="PERIODO" dense outlined v-model="fperiodo"></v-select>
          <v-row>
            <v-col cols="6">
              <v-text-field dense v-model="fpagadoel" label="SE PAGO EN LA FECHA:(DD-MM-YYYY)"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field dense v-model="montopagado" label="MONTO"></v-text-field>
            </v-col>
          </v-row>

          <v-file-input dense label="File input" filled v-model="selectedFile" prepend-icon="mdi-camera"></v-file-input>

        </v-card-text>
        <v-card-actions>
          <v-btn color="success" block @click="grabapago()">INGRESA PAGO</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogopagoscronograma" max-width="490">
      <div>
        <v-system-bar window dark>
          <v-icon @click="dialogopagoscronograma = false">mdi-close</v-icon>
        </v-system-bar>
      </div>
      <v-card>

        <v-simple-table fixed-header height="400px" dense>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-center">
                  Periodo
                </th>
                <th class="text-center" nowrap>
                  Fechas de Pago
                </th>
                <th class="text-center">
                  Estado
                </th>
                <th class="text-center">
                  Pagado el
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in arraypagos" :key="item.id">
                <td nowrap>{{ item.periodo }}</td>
                <td nowrap class="text-center">{{ item.fpago }}</td>
                <td nowrap class="text-center red--text" v-if="item.estado == 'PENDIENTE'">{{ item.estado }}</td>
                <td class="text-center green--text" v-if="item.estado == 'PAGADO'">{{ item.estado }}</td>
                <td><v-btn small v-if="item.pagadoel != ''" text @click="abrirpago(item)">{{ item.pagadoel }} </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>

      </v-card>

    </v-dialog>
  </v-container>
</template>
<script>
import {
  grabaNotificacion, grabaCronogramapago, allCronogramapago,
  grabapagocronograma, guardaArchivo
} from '../../db'
import store from '@/store/index'
import moment from 'moment'
export default {
  data() {
    return {
      dialogoCreaalerta: false,
      dialogoPagos: false,
      dialogogenera: false,
      dialogopagoscronograma: false,
      dialogoingresapago: false,
      mensaje: '',
      periodos: '24',
      fpago: '2022-02-19',
      arraypagos: [],
      fperiodo: '',
      arrayperiodo: [],
      fpagadoel: '19-02-2022',
      montopagado: '',
      selectedFile: null,
      value: '',
      size: 250,
      Uploadvalue: 0,
      progress: false,
    }
  },
  created() {
    //location.reload(true)

  },
  methods: {
    grabamensaje() {
      var bd = store.state.empresaselecta.bd
      grabaNotificacion(bd, true, this.mensaje).then((r) => {
        console.log(r)
        this.dialogoCreaalerta = false
      })
    },
    generaperiodos() {
      var now = moment(this.fpago)
      var array = []
      for (var i = 0; i < this.periodos; i++) {
        array.push({
          periodo: now.format('YYYY-MM'),
          fpago: now.format('DD-MM-YYYY'),
          estado: "PENDIENTE",
          pagadoel: '',
          ruta: '',
          montopagado: ''
        })
        now.add(1, 'M')
      }
      setTimeout(() => this.grabaCronogra(array), 1000);
    },
    grabaCronogra(array) {
      grabaCronogramapago(store.state.empresaselecta.bd, array)
      this.dialogogenera = false
    },
    cargacronograma() {
      allCronogramapago(store.state.empresaselecta.bd).once("value").then((snapshot) => {
        this.arraypagos = snapshot.val()
      })
      this.dialogopagoscronograma = true
    },
    grabapago() {
      var array = this.arraypagos
      var i = 0
      array.forEach((item) => {
        if (item.periodo == this.fperiodo) {
          this.grabafechapago(i)
        }
        i++
      })
    },
    grabafechapago(index) {
      grabapagocronograma(store.state.empresaselecta.bd, index, "pagadoel", this.fpagadoel)
      grabapagocronograma(store.state.empresaselecta.bd, index, "montopagado", this.montopagado)
      grabapagocronograma(store.state.empresaselecta.bd, index, "estado", "PAGADO")
      console.log(this.selectedFile)
      if (this.selectedFile != null && this.selectedFile != '') {
        this.agregarFoto(index)
      }
      this.dialogoingresapago = false
    },
    cargaperido() {
      this.fpagadoel = moment().format("DD-MM-YYYY")
      this.arrayperiodo = []
      allCronogramapago(store.state.empresaselecta.bd).once("value").then((snapshot) => {
        this.arraypagos = snapshot.val()
        snapshot.forEach((item) => {
          if (item.val().estado == "PENDIENTE") {
            this.arrayperiodo.push(item.val().periodo)
          }
        })
        this.dialogoingresapago = true
      })
    },
    agregarFoto(index) {

      this.progress = true
      var task = guardaArchivo(store.state.empresaselecta.bd, this.selectedFile, this.fperiodo)
      task.on('state_changed', snapshot => {
        let porcentaje = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        this.Uploadvalue = porcentaje
      }, error => { console.log(error.message) },
        () => {
          this.Uploadvalue = 100;
          task.snapshot.ref.getDownloadURL().then((url) => {
            console.log("exito")
            console.log(url)
            grabapagocronograma(store.state.empresaselecta.bd, index, "ruta", url)
            //guardaRutaArchibo(url,'cartapdf')
            this.selectedFile = '',
              this.progress = false
          })
        }
      )

    },
    abrirpago(item) {
      if (item.ruta != '') {
        window.open(item.ruta)
      }
    }

  }

}
</script>