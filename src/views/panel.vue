<template>
    <div class="pa-4 mb-5">
        <v-btn @click="migra_clientes" v-if="false">Abrir Diálogo</v-btn>
        <template>
            <div>
                <v-alert v-if="false" v-model="alert" dismissible color="black" border="left" elevation="2"
                    colored-border icon="mdi-school" prominent>
                    Ofrecemos servicios de contabilidad y declaraciones mensuales para tu empresa <span
                        class="red--text">INFO AQUI =>
                    </span>
                    <v-btn :href="`https://api.whatsapp.com/send?phone=$+51902135696&text=Hola Necesito Ayuda`"
                        target="_blank" text>
                        <v-icon color="green">mdi-whatsapp</v-icon>
                    </v-btn>
                </v-alert>
            </div>
        </template>

        <v-row class="mb-4 mt-3">

            <v-col
                v-if="!$store.state.baseDatos.transporte && $store.state.permisos.punto_venta && $store.state.baseDatos.caja2"
                cols="6" class="pa-1" md="4" sm="4" xs="6">
                <v-card @click.prevent="opcionCaja()">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/caja.png"></v-img>
                        <h4 block class="text-center pa-1">Caja</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="!$store.state.baseDatos.transporte && $store.state.permisos.moduloproductos" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('productos')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/productos.png"></v-img>
                        <h4 block class="text-center pa-1">Productos</h4>

                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.es_admin" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('transferencia_productos')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/truck.png"></v-img>
                        <h4 block class="text-center pa-1">Transferir</h4>

                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.lista_pedidos" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('lista_pedidos')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/rep.png"></v-img>
                        <h4 block class="text-center pa-1">Pedidos</h4>
                    </v-container>
                </v-card>
            </v-col>
              <v-col v-if="$store.state.permisos.reporte_avance" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="dialogo_avance=!dialogo_avance">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/reporte.png"></v-img>
                        <h5 block class="text-center pa-1">Avance Pre-Venta</h5>
                    </v-container>
                </v-card>
            </v-col>
                      <v-col v-if="false" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('reporte_ventas')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/reporte.png"></v-img>
                        <h4 block class="text-center pa-1">Reportes Ventas</h4>

                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.visitas" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('lista')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/visitas.png"></v-img>
                        <h4 block class="text-center pa-1">Visitas</h4>
                    </v-container>
                </v-card>
            </v-col>
                 <v-col v-if="true" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('cuentas_cobrar')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/tarjeta.png"></v-img>
                        <h4 block class="text-center pa-1">Creditos</h4>
                    </v-container>
                </v-card>
            </v-col>
                 <v-col v-if="$store.state.permisos.flujo_caja" cols="6"
                class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('flujocaja')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/cash.png"></v-img>
                        <h4 block class="text-center pa-1">Flujo Caja</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.modulotransporte" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('reparto_transporte')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/repe.png"></v-img>
                        <h4 block class="text-center pa-1">Mapa Reparto</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.moduloproductos" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('clientes')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/clientes.png"></v-img>
                        <h4 block class="text-center pa-1">Clientes</h4>
                    </v-container>
                </v-card>
            </v-col>
                <v-col v-if="$store.state.permisos.reportes_comprobantes" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('comprobantes')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/comprobante.png"></v-img>
                        <h4 block class="text-center pa-1">Comprobantes</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="false" cols="6" class="pa-1 mx-auto" md="4" sm="4" xs="6">
                <v-card @click.prevent="dialog = !dialog">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/diseno-grafico.png"></v-img>
                        <h4 block class="text-center pa-1">Servicio de Diseño</h4>
                    </v-container>
                </v-card>
            </v-col>

            <v-col v-if="false" cols="6" class="pa-1 mx-auto " md="4" sm="4" xs="6">
                <v-card @click.prevent="router('soporte')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/licen.png"></v-img>
                        <h4 block class="text-center pa-1">Soporte</h4>

                    </v-container>
                </v-card>
            </v-col>
            <v-col v-if="$store.state.permisos.moduloempresa" cols="6" class="pa-1 mx-auto" md="4" sm="4" xs="6">
                <v-card @click.prevent="router('miempresa')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/setting.png"></v-img>
                        <h4 block class="text-center pa-1">Config</h4>
                    </v-container>
                </v-card>
            </v-col>
        </v-row>
        <v-dialog v-model="dialog" max-width="600px">


            <v-card>
                <v-card-title class="text-h5 grey--text text--darken-2">
                    Servicios Profesionales de Diseño Gráfico
                </v-card-title>

                <v-card-text>
                    <v-img
                        src="https://img.freepik.com/premium-photo/modern-graphic-designer-desk-with-computer-displaying-colorful-digital-art-software-creative-design-tools-color-palette-cozy-office-setting_187882-23564.jpg"
                        aspect-ratio="2.75" class="mb-4"></v-img>

                    <p>
                        ¿Buscas destacar visualmente? Nuestro equipo ofrece servicios especializados para ayudarte a
                        llevar tu marca al siguiente nivel. Ya sea que necesites un <strong>logo único</strong>,
                        <strong>diseños para publicidad impactantes</strong>, o <strong>una página web moderna</strong>,
                        estamos aquí para hacer realidad tus ideas.
                    </p>

                    <ul>
                        <li>Logos profesionales y memorables.</li>
                        <li>Diseños de cartas y materiales publicitarios que captan la atención.</li>
                        <li>Desarrollo de páginas web adaptables y optimizadas para cualquier dispositivo.</li>
                    </ul>

                    <p>
                        Transformamos tu visión en piezas visuales que comunican y venden. Contáctanos y descubre cómo
                        podemos ayudarte a resaltar tu marca.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="abre_link()">
                        Contáctanos
                    </v-btn>
                    <v-btn text @click="dialog = false">
                        Cerrar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_avance v-if="dialogo_avance" @cierra="dialogo_avance=false"></dial_avance>
    </div>
</template>

<script>
// @ is an alias to /src
import store from '@/store/index'
import dial_avance from '../views/reportes/avance_pre_venta.vue'
import { migra_clientes,migra_clientes_por_ruc } from '../migra_cliente.js'
import { copiarDocumento } from '../migrar_bd.js'
export default {
    name: 'panel',
    components: {
        dial_avance
    },
    data() {
        return {
            user: '',
            alert: true,
            dialog: false,
            dialogo_avance:false,
        }
    },
    methods: {
        router(view) {
            this.$router.push({
                name: view
            })
        },
        abre_link() {
            var message = 'Deseo un diseño de publicidad '
            if (store.state.esmovil) {
                var url = "whatsapp://send?text=" + encodeURIComponent(message) + "&phone=" + encodeURIComponent('+51936052681')
            } else {
                var url = "https://web.whatsapp.com/send?text=" + encodeURIComponent(message) + "&phone=" + encodeURIComponent('+51936052681')
            }

            window.open(url);
        },
        opcionCaja() {
            //if (store.state.esmovil) {
            if (store.state.baseDatos.caja2) {
                this.$router.push({
                    name: 'caja2'
                })
            } else {
                this.$router.push({
                    name: 'caja'
                })
            }
            /*}else{
                if (store.state.baseDatos.caja2) {
                    this.$router.push({
                        name: 'caja_pc'
                    })
                } else {
                    this.$router.push({
                        name: 'caja'
                    })
                }
            }*/

        },
        migra_clientes() {
            console.log('Iniciando migración de clientes...')
           // migra_clientes()
           //copiarDocumento()
           // migra_clientes_por_ruc('20612921980') // Ejemplo de RUC adicional
        }
            

    },

}
</script>
<style scoped>
.v-card-text p {
    font-size: 16px;
    line-height: 1.5;
    color: #555;
}

.v-card-title {
    font-weight: bold;
    color: #333;
}
</style>