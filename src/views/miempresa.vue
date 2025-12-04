<template>
    <div class="pa-3 mb-2">
        <v-card>
            <v-card-subtitle>
                <v-row no-gutters>
                    <v-col cols="12">
                        <span class="black--text"> EMPRESA:</span> <span> {{ $store.state.baseDatos.bd }} - {{
                            $store.state.baseDatos.name }}</span>
                    </v-col>
                    <v-col cols="12">
                        <span class="black--text">RUC:</span> <span> {{ $store.state.baseDatos.ruc }}</span>
                    </v-col>
                    <v-col cols="12">
                        <span class="black--text">DIRECCION:</span> <span> {{ $store.state.baseDatos.direccion }} -
                            {{ $store.state.baseDatos.distrito }} - {{ $store.state.baseDatos.provincia }} -
                            {{ $store.state.baseDatos.departamento }}</span>
                    </v-col>
                </v-row>
            </v-card-subtitle>
        </v-card>
        <v-row class="mt-n1">
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogoLogoEmpresa')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/logo.png"></v-img>
                        <h4 block class="text-center pa-1">Logo</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogomedidas')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/medidas.png"></v-img>
                        <h4 block class="text-center pa-1">Und Medida</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogoConfiguracion')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/config.png"></v-img>
                        <h4 block class="text-center pa-1">Config General</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogocontadores')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/correlativos.png"></v-img>
                        <h4 block class="text-center pa-1">Correlativos</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogoSerieDocumentos')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/series.png"></v-img>
                        <h4 block class="text-center pa-1">Serie Doc</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogoImpresora')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/printer.png"></v-img>
                        <h4 block class="text-center pa-1">Impresoras</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="dial_host_impresoras = true">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/printer.png"></v-img>
                        <h4 block class="text-center pa-1">Host Impresora</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogomodopago')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/pago.png"></v-img>
                        <h4 block class="text-center pa-1">Tipo Pagos</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogobancos')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/bank.png"></v-img>
                        <h4 block class="text-center pa-1">Bancos</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="dial_tipo_cambio = !dial_tipo_cambio">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/dolar.png"></v-img>
                        <h4 block class="text-center pa-1">Tipo Cambio</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="$store.commit('dialogo_configcatalogo')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/config.png"></v-img>
                        <h4 block class="text-center pa-1">Config Catalogo</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="gestionUsuarios()">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/clientes.png"></v-img>
                        <h4 block class="text-center pa-1">Usuarios</h4>
                    </v-container>
                </v-card>
            </v-col>
            <v-col cols="6" class="pa-3" md="3" xs="6">
                <v-card @click="rutas('ImportaExporta')">
                    <v-container>
                        <v-img class="mx-auto" height="70" width="70" src="/xls.png"></v-img>
                        <h4 block class="text-center pa-1">Carga Masiva</h4>
                    </v-container>
                </v-card>
            </v-col>
        </v-row>

        <contadores />
        <undMedida />
        <Configuracion />
        <logoEmpresa />
        <Impresoras />
        <serieDocumentos />
        <mdopago />
        <cuentasbancos />
        <impresorahost v-if="dial_host_impresoras" @cierra="dial_host_impresoras = false" />
        <moneda v-if="dial_tipo_cambio" @cierra="dial_tipo_cambio = false" />
        <configcatalogo />
    </div>
</template>

<script>
import undMedida from '@/components/configEmpresa/undMedida'
import contadores from '@/components/configEmpresa/contadores'
import Configuracion from '@/components/configEmpresa/configuracion'
import logoEmpresa from '@/components/configEmpresa/logoEmpresa'
import Impresoras from '@/components/configEmpresa/impresoras'
import serieDocumentos from '@/components/configEmpresa/serieDocumentos'
import mdopago from '@/components/configEmpresa/mdopago'
import cuentasbancos from '@/components/configEmpresa/cuentasbancos'
import impresorahost from '@/components/configEmpresa/impresorahost'
import moneda from '@/components/configEmpresa/moneda_ext'
import configcatalogo from '@/components/configEmpresa/config_catalogo'

export default {
    name: 'empresa',

    components: {
        undMedida,
        contadores,
        Configuracion,
        logoEmpresa,
        Impresoras,
        serieDocumentos,
        mdopago,
        cuentasbancos,
        impresorahost,
        moneda,
        configcatalogo
    },

    data() {
        return {
            dial_host_impresoras: false,
            dial_tipo_cambio: false,
        }
    },
    methods: {
        rutas(ruta) {
            this.$router.push({
                name: ruta
            })
        },
        gestionUsuarios() {
            this.$router.push({
                name: "gestionUsuarios"
            })
        },
        gestionEmpleados() {
            this.$router.push({
                name: "empleados"
            })
        }
    }

}
</script>
