<template>
    <v-dialog v-model="dial" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-radio-group class="" v-model="medida_comprobante" row dense>
                    <v-radio label="A4" value="A4"></v-radio>
                    <v-radio label="A5" value="A5"></v-radio>
                    <v-radio label="80mm" value="80"></v-radio>
                </v-radio-group>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <div class="text--center">
                <v-radio-group class="mt-n1" v-model="medida_comprobante" row dense>
                    <v-radio label="A4" value="A4"></v-radio>
                    <v-radio label="80mm" value="80"></v-radio>
                    <v-radio label="58mm" value="58"></v-radio>
                </v-radio-group>
            </div>
            <v-row dense>
                <v-col cols="6" xs="6" sm="3">
                    <v-card @click.prevent="verPDF('imprime')">
                        <v-container>
                            <v-img class="mx-auto" height="35" width="35" src="/disc.png"></v-img>
                            <h5 block class="text-center pa-1">IMPRIME</h5>
                        </v-container>
                    </v-card>
                </v-col>
                <v-col cols="6" xs="6" sm="3">
                    <v-card @click.prevent="(envia_what = true)">
                        <v-container>
                            <v-img class="mx-auto" height="35" width="35" src="/what.png"></v-img>
                            <h5 block class="text-center pa-1">WHATSAPP</h5>
                        </v-container>
                    </v-card>
                </v-col>
                <v-col cols="6" xs="6" sm="3">
                    <v-card @click.prevent="(envia_correo = true)">
                        <v-container>
                            <v-img class="mx-auto" height="35" width="35" src="/mail.png"></v-img>
                            <h5 block class="text-center pa-1">CORREO</h5>
                        </v-container>
                    </v-card>
                </v-col>
                <v-col cols="6" xs="6" sm="3">
                    <v-card @click.prevent="verPDF('descarga')">
                        <v-container>
                            <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                            <h5 block class="text-center pa-1">DESCARGA</h5>
                        </v-container>
                    </v-card>
                </v-col>
            </v-row>
        </v-card>

        <v-dialog v-model="envia_what" max-width="450">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(envia_what = !envia_what)">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-5">
                <h4 class="text-center">Completa los Datos</h4>
                <h5 class="text-center">Este proceso generara un link para envio.</h5>
                <v-row dense class="mt-1">
                    <v-col cols="12">
                        <v-text-field append-icon="mdi-send-check" @click:append="envia_link_('w')" prepend-icon="+51"
                            dense outlined v-model="numero" type="number" label="Envio Whatsapp"
                            @keyup.enter="envia_link_('w')"></v-text-field>
                    </v-col>
                </v-row>
            </v-card>

        </v-dialog>
        <v-dialog v-model="envia_correo" max-width="450">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="(envia_correo = !envia_correo)">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-5">
                <h4 class="text-center">Completa los Datos</h4>
                <v-row dense class="mt-1">
                    <v-col cols="12">
                        <v-form ref="form" v-model="valid" lazy-validation>
                            <v-text-field autofocus :rules="emailRules" dense outlined v-model="correo"
                                label="Envio Correo"></v-text-field>
                            <v-btn :disabled="!valid" color="info" class="mr-4" @click="envia_link_('c')">
                                ENVIAR CORREO
                            </v-btn>
                        </v-form>
                    </v-col>
                </v-row>
            </v-card>

        </v-dialog>
        <v-dialog persistent v-model="progress" max-width="250">
            <v-card class="pa-12">
                <v-progress-linear indeterminate color="blue-grey" height="25">
                </v-progress-linear>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import {
    consultaDetalle
} from '../../db'
import {
    pdfGenera
} from '../../pdf_comprobantes'
import {
    pdfGenera_pasaje
} from '../../pdf_pasajes'
import {
    pdfGenera_encomienda
} from '../../pdf_encomienda'
import axios from "axios"
import store from '@/store/index'
import moment from 'moment'
import { colClientes } from '../../db_firestore'
export default {
    name: 'caja',

    props: {
        data: [],
        detalle: {
            type: Array,
            default: null
        }
    },
    data() {
        return {
            dial: false,
            valid: true,
            emailRules: [
                v => !!v || 'E-mail is required',
                v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
            ],
            progress: false,
            envia_what: false,
            envia_correo: false,
            correo: '',
            numero: '',
            seleccionado: '',
            datos_cliente: [],
            medida_comprobante: store.state.configImpresora.tamano
        }
    },

    async created() {
        this.seleccionado = this.data
        if (this.seleccionado.dni != "00000000") {
            const doc = await colClientes().doc(String(this.seleccionado.dni)).get()
            console.log('cleinte', doc.data())
            if (doc.exists) {
                const data = doc.data() || {}
                this.datos_cliente = { id: doc.id, ...data }
                this.numero = data.telefono || ''
                this.correo = data.correo || ''
            } else {
                this.datos_cliente = { id: '00000000' }
            }
        } else {
            this.datos_cliente = {
                id: '00000000'
            }
        }


        this.dial = true
    },
    mounted() {
        window.addEventListener("keydown", this.detectarTecla);
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
    },
    methods: {
        async detectarTecla(event) {
            // Cerrar con ESC
            if (event.key === "Escape") {
                event.preventDefault();
                this.cierra();
                return;
            }

            // Ejecutar una sola vez con ENTER
            if (event.key === "Enter") {
                // Ignorar autorepetición del teclado (tecla sostenida)
                if (event.repeat) return;

                // No disparar si estás escribiendo en un campo
                const tag = (event.target?.tagName || "").toLowerCase();
                const isTyping = tag === "input" || tag === "textarea" || event.target?.isContentEditable;

                // Evitar cuando hay diálogos abiertos o progreso activo
                const bloqueado = this.envia_what || this.envia_correo || this.progress;

                if (!isTyping && !bloqueado && !this.enterLock) {
                    this.enterLock = true;
                    event.preventDefault();
                    try {
                        await this.verPDF("imprime");
                    } finally {
                        // Libera el candado solo cuando termina
                        this.enterLock = false;
                    }
                }
            }
        },
        async envia_link_(modo) {
            console.log(store.state.baseDatos)
            var item = this.seleccionado
            switch (modo) {
                case 'w':
                    if (this.numero != '' && String(this.numero).length == 9) {
                        console.log(this.datos_cliente.id, 'telefono', this.numero)
                        if (this.seleccionado.dni != "00000000") {
                         //   edita_campo_Cliente(this.datos_cliente.id, 'telefono', this.numero)
                             await this.setCampoCliente(this.datos_cliente.id, 'telefono', this.numero)
                        }
                        var message = 'Puede ver su comprobante en el siguiente link \n' +
                            'https://sis-distribucion.web.app/comprobantes_clientes/' + store.state.baseDatos.bd + '/' + store.state.baseDatos.ruc + '/' + item.cod_comprobante + '/' + item.serie + '/' + item.correlativoDocEmitido + '/' + item.dni
                        if (store.state.esmovil) {
                            var url = "whatsapp://send?text=" + encodeURIComponent(message) + "&phone=" + encodeURIComponent('+51' + this.numero)
                        } else {
                            var url = "https://web.whatsapp.com/send?text=" + encodeURIComponent(message) + "&phone=" + encodeURIComponent('+51' + this.numero)
                        }
                        window.open(url);
                    } else {
                        store.commit('dialogosnackbar', 'Numero no es correcto!')
                    }
                    this.cierra()
                    break;
                case 'c':

                    if (this.datos_cliente != '' && this.datos_cliente.id != '00000000') {
                        await this.setCampoCliente(this.datos_cliente.id, 'correo', this.correo)
                        
                    }
                    this.progress = true
                    axios({
                        method: 'post',
                        url: 'https://us-central1-factura-peru.cloudfunctions.net/mailer',
                        //url: 'http://localhost:5000/factura-peru/us-central1/mailer',
                        headers: {},
                        data: {
                            "to": this.correo,
                            "subject": "Comprobante " + item.serie + '-' + item.correlativoDocEmitido,
                            "message": "Hola, tenemos un comprobante para ti",
                            "url_comprobante": 'https://sis-distribucion.web.app/comprobantes_clientes/' + store.state.baseDatos.ruc + '/' + item.cod_comprobante + '/' + item.serie + '/' + item.correlativoDocEmitido + '/' + item.dni,
                            "ruc_emisor": store.state.baseDatos.ruc,
                            "razon_social": store.state.baseDatos.name,
                            "fecha": moment.unix(item.fecha).format('YYYY-MM-DD'),
                            "correlativo": item.serie + '-' + item.correlativoDocEmitido
                        }
                    }).then(response =>
                        this.termina(response)
                    )
                    break;

            }
        },
        termina(a) {
            this.progress = false
            this.cierra()
        },
        async verPDF(modo) {
            var item = this.seleccionado
            console.log(item)
            this.progress = true
            var arraydatos = []
            console.log(this.detalle)
            if (this.detalle) {
                arraydatos = this.detalle
            } else {
                let snapshot = await consultaDetalle(item.numeracion).once("value")
                arraydatos = snapshot.val()
            }
            console.log(this.datos_cliente)
            item.referencia = this.getReferenciaPrincipal(this.datos_cliente) || this.datos_cliente.referencia || '';
            item.telefono = this.numero || ''
            if (item.encomienda) {
                pdfGenera_encomienda(arraydatos, item, this.medida_comprobante, modo === 'descarga' ? 'descarga' : 'abre');
            } else if (item.pasajeros) {
                pdfGenera_pasaje(arraydatos, item, this.medida_comprobante, modo === 'descarga' ? 'descarga' : 'abre');
            } else {
                pdfGenera(arraydatos, item, this.medida_comprobante, modo === 'descarga' ? 'descarga' : 'abre');
            }

            //this.imprime(resp)
            this.progress = false
            this.cierra()

        },
        imprime(datas) {
            // pc_print(data)
            var nom_impresora = 'Microsoft Print to PDF'
            console.log(datas)
            const form = new FormData()
            //var nom_impresora = 'ZDesigner GT800 (EPL)' 

            // fileInputElement
            let file = new File([datas], "img.pdf", { type: "application/pdf", lastModified: new Date().getTime() });
            let container = new DataTransfer();
            container.items.add(file);
            console.log(container.files)
            document.getElementById("id_file").files = container.files;
            //document.getElementById("id_file").value = data
            document.getElementById("id_impresora").value = nom_impresora
            var a = window.open('', 'TheWindow', 'left=5000,top=5000,width=0,height=0')
            document.getElementById('id_form').submit()
            /* setTimeout(function () {
                 a.close();
                 //  resolve(true)
             }, 1000);* /
 
             /*     const ff = document.getElementById('id_form')
                  document.getElementById("id_file").value = data
                  document.getElementById("id_impresora").value = nom_impresora
                  ff.addEventListener('submit', function (event) {
                      event.preventDefault()
                      const fi = document.getElementById('id_file')
                      const uf = fi.files[0]
                      const bd = new Blob([uf], { type: uf.type })
                      const bu = URL.createObjectURL(bd)
                      window.open(bu, '_blank')
                      URL.revokeObjectURL(bu)
                  })*/

        },
        getReferenciaPrincipal(cliente) {
            if (!cliente || !Array.isArray(cliente.direcciones) || cliente.direcciones.length === 0) return '';
            const dir = cliente.direcciones.find(d => d && d.principal) || cliente.direcciones[0];
            return (dir && dir.referencia) ? String(dir.referencia).trim() : '';
        },
        cierra() {

            this.$emit('cierra', false)
        },
        async setCampoCliente(id, campo, valor) {
            try {
                if (!id || id === '00000000') return
                await colClientes().doc(String(id)).set({ [campo]: valor }, { merge: true })
            } catch (e) {
                console.error(`No se pudo actualizar ${campo} del cliente ${id}:`, e)
                // opcional: feedback suave
                this.$store?.commit?.('dialogosnackbar', `No se pudo actualizar ${campo}.`)
            }
        }

    },

}
</script>
