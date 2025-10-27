<template>
    <v-dialog v-model="$store.state.dialogocontadores" max-width="460px">
        <div>
            <v-system-bar window dark>
                <v-icon @click="$store.commit('dialogocontadores')">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="green" @click="grabaContador()">mdi-content-save</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-4">
            <v-row dense>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenproducto" label="Orden Productos"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="flujocaja" label="Orden Flujo"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenboleta" label="Orden Boletas"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenfactura" label="Orden Factura"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenticket" label="Orden Ticket"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenresumen" label="Orden ResumenBAja"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenncredito" label="Orden N.Credito B"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenncredito_f" label="Orden N.Credito F"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenndebito" label="Orden N.Debito"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenclientes" label="Orden clientes"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenentradas" label="Orden Entradas"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenproveedor" label="Orden Proveedor"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenproformas" label="Orden Proformas"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordenresumenc" label="Orden ResumenCompr."></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordentrabajadores" label="Orden trabajadores."></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="orden_cierre" label="Orden Cierre caja"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="orden_guia" label="Orden Guia Rem."></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="orden_guia_t" label="Orden Guia Transportista"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="ordensalidas" label="Orden Salida"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense v-model="orden_compras" label="Orden Compras"></v-text-field>
                </v-col>
            </v-row>
        </v-card>

    </v-dialog>
</template>

<script>
import {
    obtenContador,
    actualizaContador,
    actualizaImpresoras
} from '../../db'
import store from '@/store/index'

export default {

    data() {
        return {
            ordenproducto: '10001',
            ordenboleta: '00000001',
            ordenfactura: '00000001',
            ordenticket: '00000001',
            flujocaja: '0001',
            ordenresumen: '0001',
            ordenncredito: '0001',
            ordenndebito: '0001',
            ordenclientes: '0001',
            ordenentradas: '0001',
            ordenproveedor: '0001',
            ordenproformas: '00000001',
            ordenresumenc: '0001',
            ordencosteo: '0001',
            ordentrabajadores: '0001',
            orden_cierre: '0001',
            orden_guia: '00001',
            ordensalidas: '0001',
            orden_compras: '0001',
            ordenncredito_f: '0001',
            orden_guia_t: '00001'
        }
    },
    mounted() {
        this.initialize()
    },
    methods: {
        initialize() {
            obtenContador().once("value").then((snapshot) => {
                this.ordenproducto = snapshot.val().ordenproducto
                this.ordenboleta = snapshot.val().ordenboleta
                this.ordenfactura = snapshot.val().ordenfactura
                this.ordenticket = snapshot.val().ordenticket
                this.flujocaja = snapshot.val().flujocaja
                this.ordenresumen = snapshot.val().ordenresumen
                this.ordenncredito = snapshot.val().ordenncredito
                this.ordenndebito = snapshot.val().ordenndebito
                this.ordenclientes = snapshot.val().ordenclientes
                this.ordenentradas = snapshot.val().ordenentradas
                this.ordenproveedor = snapshot.val().ordenproveedor
                this.ordenproformas = snapshot.val().ordenproformas
                this.ordenresumenc = snapshot.val().ordenresumenc
                this.ordentrabajadores = snapshot.val().ordentrabajadores
                this.orden_cierre = snapshot.val().orden_cierre
                this.orden_guia = snapshot.val().orden_guia
                this.orden_guia_t = snapshot.val().orden_guia_t
                this.ordensalidas = snapshot.val().ordensalidas
                this.orden_compras = snapshot.val().orden_compras
                this.ordenncredito_f = snapshot.val().ordenncredito_f
            })
        },
        grabaContador() {
            actualizaContador('ordenproducto', this.ordenproducto)
            actualizaContador('ordenboleta', this.ordenboleta)
            actualizaContador('ordenfactura', this.ordenfactura)
            actualizaContador('ordenticket', this.ordenticket)
            actualizaContador('flujocaja', this.flujocaja)
            actualizaContador('ordenresumen', this.ordenresumen)
            actualizaContador('ordenncredito', this.ordenncredito)
            actualizaContador('ordenndebito', this.ordenndebito)
            actualizaContador('ordenclientes', this.ordenclientes)
            actualizaContador('ordenentradas', this.ordenentradas)
            actualizaContador('ordenproveedor', this.ordenproveedor)
            actualizaContador('ordenproformas', this.ordenproformas)
            actualizaContador('ordenresumenc', this.ordenresumenc)
            actualizaContador('ordentrabajadores', this.ordentrabajadores)
            actualizaContador('orden_cierre', this.orden_cierre)
            actualizaContador('orden_guia', this.orden_guia)
            actualizaContador('orden_guia_t', this.orden_guia_t)
            actualizaContador('ordensalidas', this.ordensalidas)
            actualizaContador('orden_compras', this.orden_compras)
            actualizaContador('ordenncredito_f', this.ordenncredito_f)
            store.commit("dialogocontadores")
        }

    }

}
</script>
