<template>
    <v-dialog v-model="$store.state.dialogoImpresora" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="$store.commit('dialogoImpresora')">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="green" @click="grabaContador()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>

        <v-card class="pa-6">
            <v-row class="mt-n5" dense>
                <v-col cols="6">
                    <v-checkbox dense v-model="guardadocumento" label="Guardar Auto"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-checkbox dense v-model="vendedor" label="Muestra Vendedor"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-checkbox dense v-model="nom_comercial" label="Nom Comercial"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-select dense v-model="tamano" :items="tamanos" label="Impresora Caja" outlined></v-select>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" dense v-model="mizquierdo" label="Margen Izquierdo"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" dense v-model="mderecho" label="Margen Derecho"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" dense v-model="msuperior" label="Margen Superior"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" dense v-model="minferiorgeneral" label="Margen Inferior"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" dense v-model="minferior" label="Margen logo inferior"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="telefono" label="Telefono"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-checkbox dense v-model="log_largo" label="Logo largo A4"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-checkbox dense v-model="mostrar_logo_pedido" label="Logo en Orden Pedido A4"></v-checkbox>
                </v-col>
                <v-col cols="12" class="mt-n4">
                    <v-textarea dense outlined auto-grow filled v-model="cabecera" label="Cabecera"
                        rows="1"></v-textarea>
                </v-col>
                <v-col cols="12" class="mt-n6">
                    <v-textarea dense outlined auto-grow filled v-model="piepagina" label="Mensaje final"
                        rows="1"></v-textarea>
                </v-col>
                <v-col cols="12" class="mt-n6">
                    <v-textarea dense outlined auto-grow filled v-model="mensaje_final_proforma"
                        label="Mensaje final Proforma" rows="1"></v-textarea>
                </v-col>
            </v-row>

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
            actualizaImpresoras('mensaje_final_proforma', this.mensaje_final_proforma || '')
            actualizaImpresoras('impresora_auto', this.impresora_auto || false)
            store.commit("dialogoImpresora")
        }

    }

}
</script>
