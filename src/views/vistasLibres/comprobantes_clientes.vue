<template>
    <div class="div-1 pa-3">
        <v-card shaped elevation="10" class="card-1 mx-auto mt-10" color="white" width="500px">
            <v-card-title primary-title class="text-center">

            </v-card-title>
            <div>
                <p><span class="black--text">RUC EMISOR:</span> {{ this.$route.params.ruc }}</p>
                <p><span class="black--text">COMPROBANTE:</span>
                    {{ this.$route.params.serie }}-{{ this.$route.params.correlativo }}</p>
                <p><span class="black--text">RUC CLIENTE:</span>{{ this.$route.params.cliente }}</p>
            </div>
            <v-card-text>
                <v-row dense class="text-center">
                    <v-col cols="4">
                        <v-card @click.prevent="descargaXML()">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/xml.png"></v-img>
                                <h5 block class="text-center pa-1">XML</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="4">
                        <v-card @click.prevent="descargaCDR()">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/cdr.png"></v-img>
                                <h5 block class="text-center pa-1">CDR</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="4">
                        <v-card @click.prevent="verPDF('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="verPDF('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-img src="/power-by-cloud.png" max-width="250" max-height="250" class="mx-auto"></v-img>
            </v-card-actions>
        </v-card>

    </div>
</template>

<script>
import {
    descargaXML,
    descargaCDR
} from '../../servidorsunat'
import {
    solicitaPermiso,
    ObtenerToken
} from '../../sendMessaging'
import {
    buscacabecera,
    buscadetalle,
    allEmpresas,
    obtenerBD,
    obtenerImpresoras,
    consultaArchivo
} from '../../db'
import imageToBase64 from 'image-to-base64/browser'
import store from '@/store/index'
import {
    pdfGenera
} from '../../pdf_comprobantes'
export default {
    name: "App",
    data: function () {
        return {
            ruc: '',
            tipodoc: '',
            serie: '',
            correlativo: '',
            ruc_cliente: '',
            bd: ''
        };
    },
    async created() {
        store.commit("dialogoprogress")
        this.bd = this.$route.params.bd
        this.ruc = this.$route.params.ruc
        this.tipodoc = this.$route.params.tipodoc
        this.serie = this.$route.params.serie
        this.correlativo = this.$route.params.correlativo
        this.ruc_cliente = this.$route.params.cliente
        solicitaPermiso()
        await this.inicia()
        store.commit("dialogoprogress")
    },
    methods: {
        async inicia() {
            var data = await obtenerBD(this.bd).once("value")
            store.commit('BD', data.val())
            var snapshot = await consultaArchivo().once("value")
            if (snapshot.val() != null && snapshot.val().logoEmpresa != '') {
                imageToBase64(snapshot.val().logoEmpresa) // Image URL
                    .then(
                        (response) => {
                            store.commit("logoempresa", response)
                        })
                    .catch(
                        (error) => {
                            console.log(error)
                        }
                    )
            }

        },
        descargaXML() {
            this.GuardaToken()
            descargaXML(this.ruc, this.tipodoc, this.serie, this.correlativo)
        },
        descargaCDR() {
            descargaCDR(this.ruc, this.tipodoc, this.serie, this.correlativo)
        },
        async verPDF(medida) {
            store.commit("dialogoprogress")
            var numeracion = this.serie.charAt(0) + this.correlativo
            var impresora = await obtenerImpresoras().once("value")
            store.commit("configImpresora", impresora.val())
            var cabecera = await buscacabecera(this.bd, numeracion).once("value")
            if (cabecera.exists()) {
                var detalle = await buscadetalle(this.bd, numeracion).once("value")
            } else {
                numeracion = this.serie + '-' + this.correlativo
                cabecera = await buscacabecera(this.bd, numeracion).once("value")
                var detalle = await buscadetalle(this.bd, numeracion).once("value")
            }

            pdfGenera(detalle.val(), cabecera.val(), medida, 'descarga')
            store.commit("dialogoprogress")
        },
        GuardaToken() {

            ObtenerToken().getToken().then((currentToken) => {
                if (currentToken) {
                    console.log('token = ', currentToken);
                } else {
                    console.log('No Instance ID token available. Request permission to generate one.');
                    updateUIForPushPermissionRequired();
                }
            }).catch((err) => {
                console.log('An error occurred while retrieving token. ', err);
            });
        }
    },

};
</script>

<style scoped>
.div-1 {
    background-color: #333030;
    width: 100%;
    height: 100%;
    text-align: center;
    justify-content: center;
    position: relative;
}

.card-1 {
    align-items: center;
}
</style>
