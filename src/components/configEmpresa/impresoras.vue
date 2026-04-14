<template>
    <v-dialog v-model="$store.state.dialogoImpresora" max-width="520px" persistent>
        <v-card class="rounded-lg d-flex flex-column" style="max-height: 90vh;">

            <!-- Header fijo -->
            <v-system-bar window dark class="px-2" style="position: sticky; top: 0; z-index: 10;">
                <v-btn icon small @click="$store.commit('dialogoImpresora')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>

                <v-spacer></v-spacer>

                <div class="white--text font-weight-medium">
                    Configuración de impresión
                </div>

                <v-spacer></v-spacer>

                <v-btn icon small color="green" @click="grabaContador()">
                    <v-icon color="green">mdi-content-save</v-icon>
                </v-btn>
            </v-system-bar>

            <!-- Contenido con scroll -->
            <v-card-text class="pt-4" style="overflow-y: auto;">
                <!-- Básico -->
                <v-card outlined class="mb-3 rounded-lg">

                    <v-card-text class="py-3 mb-n4">

                        <v-row dense>
                            <v-col cols="6">
                                <v-select dense outlined v-model="tamano" :items="tamanos" label="Impresora caja" />
                            </v-col>

                            <v-col cols="6">
                                <v-text-field dense outlined v-model="telefono" label="Teléfono"
                                    prepend-inner-icon="mdi-phone" />
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>

                <!-- Márgenes -->
                <v-card outlined class="mb-3 rounded-lg">
                    <v-card-title class="py-2 text-subtitle-2">
                        Márgenes (mm)
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="py-3 mb-n4">

                        <v-row dense class="mt-n2">
                            <v-col cols="6">
                                <v-text-field type="number" dense outlined v-model="mizquierdo" label="Izquierdo" />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field type="number" dense outlined v-model="mderecho" label="Derecho" />
                            </v-col>

                            <v-col cols="6" class="mt-n6">
                                <v-text-field type="number" dense outlined v-model="msuperior" label="Superior" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-text-field type="number" dense outlined v-model="minferiorgeneral"
                                    label="Inferior" />
                            </v-col>

                            <v-col cols="12" class="mt-n6">
                                <v-text-field type="number" dense outlined v-model="minferior"
                                    label="Margen logo inferior" />
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>

                <!-- Opciones -->
                <v-card outlined class="mb-3 rounded-lg">
                    <v-card-title class="py-2 text-subtitle-2">
                        Opciones Extra
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="py-3 mb-n4">

                        <v-row dense class="mt-n4">
                            <v-col cols="6">
                                <v-switch inset dense v-model="vendedor" label="Mostrar vendedor" />
                            </v-col>
                            <v-col cols="6">
                                <v-switch inset dense v-model="nom_comercial" label="Nombre comercial" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="log_largo" label="Logo largo A4" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="mostrar_logo_pedido" label="Logo en pedido A4" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="no_mostrar_logo_nota_pedido" label="Ocultar Logo en N. Venta" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="no_mostrar_ruc_nota_venta" label="Ocultar RUC en N. Venta" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="mostrar_zona_nota_venta" label="Mostrar Zona en N. Venta" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="mostrar_medida_general" label="Mostrar Med. General en Comprobantes" />
                            </v-col>
                            <v-col cols="6" class="mt-n6">
                                <v-switch inset dense v-model="ocultar_totalizados_a5" label="Ocultar Totalizados A5" />
                            </v-col>
                        </v-row>

                        <v-row dense>
                            <v-col cols="12">
                                <v-textarea dense outlined auto-grow rows="1" v-model="cabecera" label="Cabecera" />
                            </v-col>

                            <v-col cols="12" class="mt-n6">
                                <v-textarea dense outlined auto-grow rows="1" v-model="piepagina"
                                    label="Mensaje final" />
                            </v-col>

                            <v-col cols="12" class="mt-n6">
                                <v-textarea dense outlined auto-grow rows="1" v-model="mensaje_final_proforma"
                                    label="Mensaje final proforma" />
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>

            </v-card-text>

        </v-card>
    </v-dialog>
</template>

<script>
import {
    obtenerImpresoras,
    actualizaImpresoras
} from '../../db'
import store from '@/store/index'

export default {

    data() {
        return {
            ip_cocina: "192.168.1.5",
            guardadocumento: false,
            impresoracocina: false,
            tamano: '58',
            tamanos: ['58', '80', 'A5', 'A4'],
            mizquierdo: '5',
            mderecho: '3',
            piepagina: '',
            cabecera: '',
            telefono: '',
            msuperior: '5',
            minferior: '40',
            minferiorgeneral: '10',
            vendedor: false,
            nom_comercial: false,
            log_largo: false,
            mostrar_logo_pedido: true,
            no_mostrar_logo_nota_pedido: false,
            no_mostrar_ruc_nota_venta: false,
            mostrar_zona_nota_venta: false,
            mostrar_medida_general: false,
            ocultar_totalizados_a5: false,
            mensaje_final_proforma: '',
            impresora_auto: false,

        }
    },
    mounted() {
        this.initialize()
    },
    methods: {
        initialize() {
            this.desserts = []
            obtenerImpresoras().once("value").then((snapshot) => {
                if (snapshot.exists) {
                    this.ip_cocina = snapshot.val().ip_cocina
                    this.guardadocumento = snapshot.val().guardadocumento
                    this.impresoracocina = snapshot.val().impresoracocina
                    this.tamano = snapshot.val().tamano
                    this.mizquierdo = snapshot.val().mizquierdo
                    this.mderecho = snapshot.val().mderecho
                    this.cabecera = snapshot.val().cabecera
                    this.piepagina = snapshot.val().piepagina
                    this.telefono = snapshot.val().telefono
                    this.msuperior = snapshot.val().msuperior
                    this.minferior = snapshot.val().minferior
                    this.minferiorgeneral = snapshot.val().minferiorgeneral
                    this.vendedor = snapshot.val().vendedor
                    this.nom_comercial = snapshot.val().nom_comercial
                    this.mensaje_final_proforma = snapshot.val().mensaje_final_proforma || ''
                    this.log_largo = snapshot.val().log_largo || false
                    this.mostrar_logo_pedido = snapshot.val().mostrar_logo_pedido !== false
                    this.no_mostrar_logo_nota_pedido = snapshot.val().no_mostrar_logo_nota_pedido === true
                    this.no_mostrar_ruc_nota_venta = snapshot.val().no_mostrar_ruc_nota_venta === true
                    this.mostrar_zona_nota_venta = snapshot.val().mostrar_zona_nota_venta === true
                    this.mostrar_medida_general = snapshot.val().mostrar_medida_general === true
                    this.ocultar_totalizados_a5 = snapshot.val().ocultar_totalizados_a5 === true
                    this.impresora_auto = snapshot.val().impresora_auto || false
                } else {
                    this.ip_cocina = "192.168.1.5"
                    this.guardadocumento = false
                    this.impresoracocina = false
                    this.tamano = '58'
                    this.mizquierdo = '5'
                    this.mderecho = '3'
                    this.cabecera = ''
                    this.piepagina = ''
                    this.telefono = ''
                    this.msuperior = '5'
                    this.minferior = '45'
                    this.minferiorgeneral = '10'
                    this.vendedor = false
                    this.log_largo = false
                    this.mostrar_logo_pedido = true
                    this.no_mostrar_logo_nota_pedido = false
                    this.no_mostrar_ruc_nota_venta = false
                    this.mostrar_zona_nota_venta = false
                    this.mostrar_medida_general = false
                    this.ocultar_totalizados_a5 = false
                    this.impresora_auto = false
                    this.mensaje_final_proforma = ''
                }
            })
        },
        grabaContador() {
            var array = {}
            array = {
                ip_cocina: this.ip_cocina,
                guardadocumento: this.guardadocumento,
                impresoracocina: this.impresoracocina,
                pdfInMM: this.tamano,
                lMargin: this.mizquierdo,
                rMargin: this.mderecho,
                msuperior: this.msuperior,
                minferior: this.minferior,
                minferiorgeneral: this.minferiorgeneral,
                cabecera: this.cabecera,
                piepagina: this.piepagina,
                telefono: this.telefono,
                vendedor: this.vendedor,
                nom_comercial: this.nom_comercial,
                impresora_auto: this.impresora_auto || false,
                log_largo: this.log_largo || false,
                mostrar_logo_pedido: this.mostrar_logo_pedido !== false,
                no_mostrar_logo_nota_pedido: this.no_mostrar_logo_nota_pedido || false,
                no_mostrar_ruc_nota_venta: this.no_mostrar_ruc_nota_venta || false,
                mostrar_zona_nota_venta: this.mostrar_zona_nota_venta || false,
                mostrar_medida_general: this.mostrar_medida_general || false,
                ocultar_totalizados_a5: this.ocultar_totalizados_a5 || false,
                mensaje_final_proforma: this.mensaje_final_proforma || ''

            }
            store.commit("configImpresora", array)
            actualizaImpresoras('ip_cocina', this.ip_cocina)
            actualizaImpresoras('guardadocumento', this.guardadocumento)
            actualizaImpresoras('impresoracocina', this.impresoracocina)
            actualizaImpresoras('tamano', this.tamano)
            actualizaImpresoras('mizquierdo', this.mizquierdo)
            actualizaImpresoras('mderecho', this.mderecho)
            actualizaImpresoras('msuperior', this.msuperior)
            actualizaImpresoras('minferior', this.minferior)
            actualizaImpresoras('cabecera', this.cabecera)
            actualizaImpresoras('piepagina', this.piepagina)
            actualizaImpresoras('minferiorgeneral', this.minferiorgeneral)
            actualizaImpresoras('telefono', this.telefono)
            actualizaImpresoras('vendedor', this.vendedor || false)
            actualizaImpresoras('nom_comercial', this.nom_comercial || false)
            actualizaImpresoras('log_largo', this.log_largo || false)
            actualizaImpresoras('mostrar_logo_pedido', this.mostrar_logo_pedido !== false)
            actualizaImpresoras('no_mostrar_logo_nota_pedido', this.no_mostrar_logo_nota_pedido || false)
            actualizaImpresoras('no_mostrar_ruc_nota_venta', this.no_mostrar_ruc_nota_venta || false)
            actualizaImpresoras('mostrar_zona_nota_venta', this.mostrar_zona_nota_venta || false)
            actualizaImpresoras('mostrar_medida_general', this.mostrar_medida_general || false)
            actualizaImpresoras('ocultar_totalizados_a5', this.ocultar_totalizados_a5 || false)
            actualizaImpresoras('mensaje_final_proforma', this.mensaje_final_proforma || '')
            actualizaImpresoras('impresora_auto', this.impresora_auto || false)
            store.commit("dialogoImpresora")
        }

    }

}
</script>
