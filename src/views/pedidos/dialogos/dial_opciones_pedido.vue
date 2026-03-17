<template>
  <v-dialog v-model="dial" max-width="500" persistent>
    <v-card class="rounded-xl">
      <v-toolbar color="primary" dark dense flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          <v-icon left small>mdi-check-circle</v-icon>
          Pedido guardado con éxito
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="cerrarYSalir" dark>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-avatar color="success" size="40" class="mr-3">
            <v-icon dark>mdi-receipt</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption grey--text">Comprobante</div>
            <div class="font-weight-bold">{{ pedido.id }}</div>
          </div>
          <v-spacer></v-spacer>
          <div class="text-right">
            <div class="text-caption grey--text">Total</div>
            <div class="font-weight-bold red--text">{{ pedido.moneda }} {{ pedido.total }}</div>
          </div>
        </div>

        <v-divider class="mb-3"></v-divider>

        <div class="text-center mb-2 grey--text text-caption">¿Qué deseas hacer con el pedido?</div>

        <v-row dense>
          <v-col cols="4" v-for="opt in opciones" :key="opt.value">
            <v-hover v-slot="{ hover }">
              <v-card :elevation="hover ? 4 : 1" :class="['option-card', { 'on-hover': hover }]"
                @click="opt.action(opt.value)">
                <v-card-text class="pa-2 text-center">
                  <v-icon :color="opt.color" size="30">{{ opt.icon }}</v-icon>
                  <div class="text-caption font-weight-medium mt-1">{{ opt.label }}</div>
                </v-card-text>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>

        <v-expand-transition>
          <v-card v-if="mostrarOpcionesPapel" outlined class="mt-3 pa-2">
            <div class="d-flex align-center">
              <span class="text-caption grey--text mr-2">Tamaño:</span>
              <v-radio-group v-model="medida_comprobante" row dense hide-details>
                <v-radio label="A4" value="A4"></v-radio>
                <v-radio label="80mm" value="80"></v-radio>
                <v-radio label="58mm" value="58"></v-radio>
              </v-radio-group>
              <v-spacer></v-spacer>
              <v-btn x-small color="orange" dark @click="dial_config_host = true" v-if="!isMobile">
                <v-icon left small>mdi-cog</v-icon> Config
              </v-btn>
            </div>
          </v-card>
        </v-expand-transition>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn text color="primary" @click="cerrarYSalir">
          <v-icon left small>mdi-format-list-bulleted</v-icon>
          Ir a lista de pedidos
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="envia_what" max-width="450">
      <v-card>
        <v-toolbar color="success" dark dense flat>
          <v-toolbar-title class="text-subtitle-2">Enviar por WhatsApp</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="envia_what = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <v-text-field v-model="numero" label="Número de WhatsApp" prefix="+51" type="number" outlined dense
            hide-details class="mb-3"></v-text-field>
          <v-btn block color="success" @click="enviaLinkWhatsapp">
            <v-icon left>mdi-whatsapp</v-icon> Enviar PDF
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="progress" max-width="250">
      <v-card class="pa-6 text-center">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <div class="mt-3">Procesando...</div>
      </v-card>
    </v-dialog>

    <impresorahost v-if="dial_config_host" @cierra="dial_config_host = false" />
  </v-dialog>
</template>

<script>
import { consultaDetalle } from '../../../db'
import { pdfGenera } from '../formatos/orden_pedido.js'
import axios from "axios"
import store from '@/store/index'
import moment from 'moment'
import { colClientes } from '../../../db_firestore'
import impresorahost from '@/components/configEmpresa/impresorahost.vue'

export default {
  name: 'DialOpcionesPedido',
  components: { impresorahost },
  props: {
    pedido: { type: Object, required: true },
    detalle: { type: Array, default: null },
    clienteData: { type: Object, default: null }
  },
  data() {
    return {
      dial: true,
      dial_config_host: false,
      valid: true,
      emailRules: [
        v => !!v || 'E-mail es requerido',
        v => /.+@.+\..+/.test(v) || 'E-mail debe ser válido',
      ],
      progress: false,
      envia_what: false,
      envia_correo: false,
      correo: '',
      numero: '',
      medida_comprobante: store.state.configImpresora.tamano,
      mostrarOpcionesPapel: false,
      opciones: [
        { icon: 'mdi-printer', color: 'blue', label: 'Imprimir', value: 'imprime', action: this.verPDF },
        { icon: 'mdi-download', color: 'green', label: 'Descargar', value: 'descarga', action: this.verPDF },
        { icon: 'mdi-whatsapp', color: 'success', label: 'WhatsApp', value: 'whatsapp', action: this.abrirWhatsApp },
      ]
    }
  },
  computed: {
    isMobile() {
      return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
    },
  },
  created() {
    if (this.clienteData) {
      this.numero = this.clienteData.telefono || ''
      this.correo = this.clienteData.correo || ''
    } else if (this.pedido.cliente_documento) {
      this.cargarDatosCliente()
    }
  },
  methods: {
    async obtenerDetallePedido() {
      if (this.detalle) return this.detalle
      if (!this.pedido.id) return null

      const snapshot = await consultaDetalle(this.pedido.id).once("value")
      return snapshot.val()
    },

    construirCabeceraPdf() {
      return {
        ...this.pedido,
        id: this.pedido.id,
        telefono: this.numero || ''
      }
    },

    construirMensajePedido() {
      const hostPublico = 'https://chikillo-distribucion.web.app'
      return 'Puede ver su pedido en el siguiente link \n' +
        hostPublico + '/pedidos_clientes/' +
        store.state.baseDatos.bd + '/' +
        this.pedido.id
    },

    async cargarDatosCliente() {
      try {
        const doc = await colClientes().doc(String(this.pedido.cliente_documento)).get()
        if (doc.exists) {
          const data = doc.data()
          this.numero = data.telefono || ''
          this.correo = data.correo || ''
        }
      } catch (e) {
        console.error('Error cargando datos del cliente:', e)
      }
    },

    abrirWhatsApp() {
      this.mostrarOpcionesPapel = true
      this.envia_what = true
    },

    abrirCorreo() {
      this.envia_correo = true
    },

    async enviaLinkWhatsapp() {
  if (!this.numero || String(this.numero).length !== 9) {
    store.commit('dialogosnackbar', 'Número no válido (debe ser 9 dígitos)')
    return
  }

  this.progress = true
  try {
    if (this.clienteData && this.clienteData.id) {
      await this.setCampoCliente(this.clienteData.id, 'telefono', this.numero)
    }

    const mensaje = this.construirMensajePedido()
    
    // Abrir WhatsApp con el mensaje
    const url = store.state.esmovil
      ? `whatsapp://send?text=${encodeURIComponent(mensaje)}&phone=+51${this.numero}`
      : `https://web.whatsapp.com/send?phone=+51${this.numero}&text=${encodeURIComponent(mensaje)}`
    
    window.open(url, '_blank')
    
    this.envia_what = false
    this.cerrarYSalir()
  } catch (error) {
    console.error('Error enviando WhatsApp:', error)
    store.commit('dialogosnackbar', 'Error al preparar el envío por WhatsApp')
  } finally {
    this.progress = false
  }
},

    async enviaLinkCorreo() {
      if (!this.correo || !/.+@.+\..+/.test(this.correo)) {
        store.commit('dialogosnackbar', 'Ingrese un correo válido')
        return
      }

      if (this.clienteData && this.clienteData.id) {
        await this.setCampoCliente(this.clienteData.id, 'correo', this.correo)
      }

      this.progress = true
      try {
        await axios({
          method: 'post',
          url: 'https://us-central1-factura-peru.cloudfunctions.net/mailer',
          data: {
            "to": this.correo,
            "subject": "Pedido " + this.pedido.id,
            "message": "Hola, tienes un pedido registrado",
            "url_comprobante": 'https://sis-distribucion.web.app/pedidos_clientes/' +
              store.state.baseDatos.bd + '/' + this.pedido.id,
            "ruc_emisor": store.state.baseDatos.ruc,
            "razon_social": store.state.baseDatos.name,
            "fecha": moment.unix(this.pedido.fecha_emision).format('YYYY-MM-DD'),
            "correlativo": this.pedido.id
          }
        })
        store.commit('dialogosnackbar', 'Correo enviado con éxito')
        this.envia_correo = false
      } catch (error) {
        console.error('Error enviando correo:', error)
        store.commit('dialogosnackbar', 'Error al enviar correo')
      } finally {
        this.progress = false
      }
    },

    async verPDF(modo) {
      this.mostrarOpcionesPapel = true
      this.progress = true
      try {
        const arraydatos = await this.obtenerDetallePedido()
        const cabecera = this.construirCabeceraPdf()

        const modoFinal = modo === 'imprime' ? 'abre' : (modo === 'descarga' ? 'descarga' : 'abre')

        await pdfGenera(cabecera, arraydatos, this.medida_comprobante, modoFinal)

        if (modo === 'imprime') {
          store.commit('dialogosnackbar', 'Enviando a impresión...')
        }

        this.cerrarYSalir()
      } catch (error) {
        console.error('Error generando PDF:', error)
        store.commit('dialogosnackbar', 'Error al generar el PDF')
      } finally {
        this.progress = false
      }
    },

    async setCampoCliente(id, campo, valor) {
      try {
        if (!id) return
        await colClientes().doc(String(id)).set({ [campo]: valor }, { merge: true })
      } catch (e) {
        console.error(`No se pudo actualizar ${campo}:`, e)
      }
    },

    cerrarYSalir() {
      this.dial = false
      this.$emit('salir')
    },

    cierra() {
      this.dial = false
      this.$emit('cierra')
    }
  }
}
</script>

<style scoped>
.option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0;
}

.option-card.on-hover {
  transform: translateY(-2px);
  border-color: #1976d2;
}

.option-card .v-icon {
  transition: transform 0.2s ease;
}

.option-card.on-hover .v-icon {
  transform: scale(1.1);
}
</style>