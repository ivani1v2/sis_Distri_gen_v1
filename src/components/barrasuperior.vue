<template>
    <nav>
        <v-app-bar app color="black" dark elevate-on-scroll dense >
            <div class="d-flex align-center">

                <v-btn v-if="!barra" @click="drawer = !drawer" fab x-small>
                    <v-app-bar-nav-icon x-small color="white">
                    </v-app-bar-nav-icon>
                </v-btn>
                <v-img alt="Vuetify Name" class="shrink mt-1 hidden-sm-and-down" contain min-width="100"
                    src="domotica.png" width="100" />


            </div>
            <v-spacer></v-spacer>
            <span
                style="font-size: 0.8em; text-transform: uppercase; border: 1px solid #ccc; padding: 3px 6px; border-radius: 4px;"
                v-if="$store.state.baseDatos.multi_empresa">
                Sede: {{ sede_acual }}
            </span>
            <v-spacer></v-spacer>
            <v-btn v-show="esCaja2" x-small elevation="6" rounded color="error" @click="abrir_flujo()">
                Flujo Caja
                <v-icon color="white" class="mx-auto text--center" small>mdi-cash-register</v-icon>
            </v-btn>


            <v-spacer></v-spacer>
            <v-btn :href="`https://api.whatsapp.com/send?phone=$+51902135696&text=Hola Necesito Ayuda`" target="_blank"
                text>
                <v-icon color="green">mdi-whatsapp</v-icon>
            </v-btn>
        </v-app-bar>

        <v-navigation-drawer v-model="drawer" temporary app class="drawer-estilo">

            <v-list-item class="px-3">
                <v-list-item-avatar>
                    <v-img
                        src="https://firebasestorage.googleapis.com/v0/b/mitienda-f5ef8.appspot.com/o/carpetaiconos%2Ficono25?alt=media&token=9ead45f5-7735-4386-8647-e1d80cc913ab"></v-img>
                </v-list-item-avatar>

                <v-list-item-title class="mb-2">
                    <v-row no-gutters>
                        <v-col cols="12">
                            <span style="font-size: 0.8em; color: #FF2D00;">Usuario:</span>

                        </v-col>
                        <v-col cols="12">
                            <span style="font-size: 0.8em ; text-transform:uppercase">{{ nombreusuario }}</span>
                        </v-col>
                    </v-row>

                    <v-btn dark v-if="$store.state.baseDatos.multi_empresa" class="ma-2" color="red" small text
                        @click="abre_tiendas()">
                        {{ sede_acual }}
                        <v-icon color="white" right>
                            mdi-storefront
                        </v-icon>

                    </v-btn>
                </v-list-item-title>

                <v-btn icon @click.stop="drawer = !drawer">
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
            </v-list-item>

            <v-divider></v-divider>

            <v-list dense>
                <v-list-item link @click.prevent="router('panel')">
                    <v-list-item-icon>
                        <v-icon>mdi-account</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>Home</v-list-item-title>
                    </v-list-item-content>

                </v-list-item>

                <v-list-group v-if="$store.state.permisos.modulocaja && $store.state.baseDatos.caja2" :value="listaMenu"
                    prepend-icon="mdi-cash-register">
                    <template v-slot:activator>
                        <v-list-item-title>Venta</v-list-item-title>
                    </template>
                    <v-container>

                        <v-list-item v-if="$store.state.permisos.punto_venta && $store.state.baseDatos.caja2" link
                            @click.prevent="opcionCaja()">
                            <v-list-item-icon>
                                <v-icon>mdi-cash-register</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Punto de Venta</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item link @click.prevent="router('reporte_proformas')">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Proformas</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>


                        <v-list-item v-if="$store.state.permisos.flujo_caja" link @click.prevent="router('flujocaja')">
                            <v-list-item-icon>
                                <v-icon>mdi-chart-areaspline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Flujo de Caja</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item link @click.prevent="router('cuentas_cobrar')">
                            <v-list-item-icon>
                                <v-icon>mdi-account-cash</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Creditos</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>
                <v-list-group v-if="$store.state.permisos.modulotransporte" :value="listaMenu"
                    prepend-icon="mdi-dump-truck">
                    <template v-slot:activator>
                        <v-list-item-title>Transporte</v-list-item-title>
                    </template>
                    <v-container>

                        <v-list-item link @click.prevent="router('reporte_Guia')">
                            <v-list-item-icon>
                                <v-icon>mdi-dump-truck</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>G.R.Remitente</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item link @click.prevent="router('reporte_Guia_t')">
                            <v-list-item-icon>
                                <v-icon>mdi-dump-truck</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>G.R. Transportista</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>

                <v-list-group v-if="$store.state.permisos.moduloproductos" :value="listaMenu"
                    prepend-icon="mdi-package-variant-closed">
                    <template v-slot:activator>
                        <v-list-item-title>Productos</v-list-item-title>
                    </template>
                    <v-container>

                        <v-list-item link @click.prevent="router('productos')">
                            <v-list-item-icon>
                                <v-icon>mdi-package-variant-closed</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> Productos</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item link @click.prevent="router('bonos_globales')">
                            <v-list-item-icon>
                                <v-icon>mdi-package-variant-closed</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> Bonos Globales</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="$store.state.permisos.productos_sede" link
                            @click.prevent="router('productos_x_sede')">
                            <v-list-item-icon>
                                <v-icon>mdi-package-variant-closed</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> Productos x Sede</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                    </v-container>
                </v-list-group>
                <v-list-group v-if="$store.state.permisos.moduloclientes" :value="listaMenu"
                    prepend-icon="mdi-account-search">
                    <template v-slot:activator>
                        <v-list-item-title>Clientes</v-list-item-title>
                    </template>
                    <v-container>
                        <v-list-item link @click.prevent="router('clientes')">
                            <v-list-item-icon>
                                <v-icon>mdi-account-search</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Lista Clientes</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item link @click.prevent="router('comprasClientes')">
                            <v-list-item-icon>
                                <v-icon>mdi-account-search</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Historial Compra</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>
                <v-list-group v-if="$store.state.permisos.lista_pedidos" :value="listaMenu"
                    prepend-icon="mdi-account-convert">
                    <template v-slot:activator>
                        <v-list-item-title>Pedidos</v-list-item-title>
                    </template>
                    <v-container>
                         <v-list-item  link @click.prevent="router('lista')">
                            <v-list-item-icon>
                                <v-icon>mdi-clipboard-list</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Lista Visitas</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item  link @click.prevent="router('lista_pedidos')">
                            <v-list-item-icon>
                                <v-icon>mdi-clipboard-list</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Lista Pedidos</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="$store.state.permisos.reparto" link @click.prevent="router('lista_repartos')">
                            <v-list-item-icon>
                                <v-icon>mdi-clipboard-list</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Reparto</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>
                <v-list-group v-if="false" :value="listaMenu" prepend-icon="mdi-account-convert">
                    <template v-slot:activator>
                        <v-list-item-title>Empleados</v-list-item-title>
                    </template>
                    <v-container>
                        <v-list-item disabled link @click.prevent="router('clientes')">
                            <v-list-item-icon>
                                <v-icon>mdi-clipboard-list</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Lista Empleados</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item disabled link @click.prevent="router('comprasClientes')">
                            <v-list-item-icon>
                                <v-icon>mdi-list-status</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Control Asistencia</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>
                <v-list-group v-if="$store.state.permisos.moduloFinanzas" :value="listaMenu" prepend-icon="mdi-finance">
                    <template v-slot:activator>
                        <v-list-item-title>Finanzas</v-list-item-title>
                    </template>
                    <v-container>
                        <v-list-item v-if="$store.state.permisos.tesoreria" link @click.prevent="router('tesoreria')">
                            <v-list-item-icon>
                                <v-icon>mdi-account-cash</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Tesoreria</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="$store.state.permisos.cuentas_cobrar" link
                            @click.prevent="router('cuentas_cobrar')">
                            <v-list-item-icon>
                                <v-icon>mdi-account-cash</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>C x Cobrar</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item v-if="false" link>
                            <v-list-item-icon>
                                <v-icon>mdi-truck-fast</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>C x Pagar</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item v-if="false" link>
                            <v-list-item-icon>
                                <v-icon>mdi-truck-fast</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Balance</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                    </v-container>
                </v-list-group>

                <v-list-group v-if="$store.state.permisos.modulokardex" :value="listaMenu"
                    prepend-icon="mdi-dump-truck">
                    <template v-slot:activator>
                        <v-list-item-title>Kardex</v-list-item-title>
                    </template>
                    <v-container>
                        <v-list-item v-if="$store.state.permisos.modulokardex" link
                            @click.prevent="router('movimientos_kardex')">
                            <v-list-item-icon>
                                <v-icon>mdi-swap-horizontal</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Kardex</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="$store.state.permisos.modulokardex" link
                            @click.prevent="router('rep_mov_producto')">
                            <v-list-item-icon>
                                <v-icon>mdi-swap-horizontal</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Mov x Producto</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="$store.state.permisos.transferencias" link
                            @click.prevent="router('transferencia_productos')">
                            <v-list-item-icon>
                                <v-icon>mdi-swap-horizontal</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Transferencias</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item v-if="true" link @click.prevent="router('reporte_stock')">
                            <v-list-item-icon>
                                <v-icon>mdi-swap-horizontal</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Stock</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>

                <v-list-item link @click.prevent="router('lista_periodos')" v-if="false">
                    <v-list-item-icon>
                        <v-icon>mdi-bank</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>SIRE Compras (new)</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

                <v-list-group v-if="$store.state.permisos.modulosunat" :value="listaMenu"
                    prepend-icon="mdi-text-box-multiple-outline">
                    <template v-slot:activator>
                        <v-list-item-title>SUNAT</v-list-item-title>
                    </template>
                    <v-container>

                        <v-list-item @click.prevent="router('boletaFactura')">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Boletas, Facturas</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item @click.prevent="router('creditoDebito')">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>N.Credito</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item @click.prevent="router('resumenbaja')">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Resumen Bajas</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item @click.prevent="router('ticket')">
                            <v-list-item-icon>
                                <v-icon>mdi-web-box</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Tickets</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>

                <v-list-group v-if="$store.state.permisos.moduloreportes" :value="listaMenu"
                    prepend-icon="mdi-chart-bar">
                    <template v-slot:activator>
                        <v-list-item-title>REPORTES</v-list-item-title>
                    </template>
                    <v-container>
                        <v-list-item @click.prevent="router('reporte_ventas')">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Reporte Ventas</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click.prevent="router('ventasxempleado')"
                            v-if="$store.state.configuracion.comisiones">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Ventas x Emp.</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item @click.prevent="router('comprobantes')"
                            v-if="$store.state.permisos.modulocomprobantes">
                            <v-list-item-icon>
                                <v-icon>mdi-text-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Comprobantes</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>

                        <v-list-item @click.prevent="router('reporteVentaDetalle')">
                            <v-list-item-icon>
                                <v-icon>mdi-cash-100</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> X Producto</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click.prevent="router('reporte_x_vendedor')">
                            <v-list-item-icon>
                                <v-icon>mdi-cash-100</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> X Vendedor</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click.prevent="router('venta_x_sede')" v-if="false">
                            <v-list-item-icon>
                                <v-icon>mdi-cash-100</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title> X Sede</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click.prevent="router('reg_contables')">
                            <v-list-item-icon>
                                <v-icon>mdi-finance</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>Reg. Contable</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                </v-list-group>

                <v-spacer></v-spacer>
                <v-divider></v-divider>

                <v-list-item v-if="user == 'ivanac1992@domotica.com'" @click.prevent="router('panelgeneral')">
                    <v-list-item-icon>
                        <v-icon>mdi-logout-variant</v-icon>
                    </v-list-item-icon>

                    <v-list-item-content>
                        <v-list-item-title>Admin</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

                <v-list-item v-if="$store.state.permisos.moduloempresa" link @click.prevent="router('miempresa')">
                    <v-list-item-icon>
                        <v-icon>mdi-cog-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>Configuracion</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

                <v-list-item @click.prevent="accion('Cerrar Sesion')">
                    <v-list-item-icon>
                        <v-icon>mdi-logout-variant</v-icon>
                    </v-list-item-icon>

                    <v-list-item-content>
                        <v-list-item-title>Cerrar Sesion</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

            </v-list>
        </v-navigation-drawer>

        <div class="text-center">
            <v-dialog v-model="dialog" width="500">

                <v-card>
                    <v-card-title class="text-h5 grey lighten-2">
                        NOTIFICACIONES
                    </v-card-title>

                    <v-card class="mx-auto" max-width="500">
                        <v-list two-line>
                            <v-list-item-group v-model="selected" active-class="red--text" multiple>
                                <template v-for="(item, index) in items">
                                    <v-list-item :key="item.title">
                                        <template v-slot:default="{ active }">
                                            <v-list-item-content>
                                                <v-list-item-title v-text="item.title"></v-list-item-title>

                                                <v-list-item-subtitle class="text--primary"
                                                    v-text="item.headline"></v-list-item-subtitle>

                                                <v-list-item-subtitle v-text="item.subtitle"></v-list-item-subtitle>
                                            </v-list-item-content>

                                            <v-list-item-action>
                                                <v-list-item-action-text v-text="item.action"></v-list-item-action-text>

                                                <v-icon v-if="!active" color="grey lighten-1">
                                                    mdi-star-outline
                                                </v-icon>

                                                <v-icon v-else color="yellow darken-3">
                                                    mdi-star
                                                </v-icon>
                                            </v-list-item-action>
                                        </template>
                                    </v-list-item>

                                    <v-divider v-if="index < items.length - 1" :key="index"></v-divider>
                                </template>
                            </v-list-item-group>
                        </v-list>
                    </v-card>

                    <v-divider></v-divider>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" text @click="dialog = false">
                            ENTENDIDO
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

        </div>
        <mensaje />
        <dialogAlerta />
        <dialogoprogress />
        <dialogosnackbar />
        <v-dialog v-model="dialog_tiendas" scrollable max-width="500px">
            <v-card>
                <h4 class="text-center">SELECCIONE SEDE</h4>

                <v-simple-table class="elevation-1 mt-2" fixed-header height="70vh">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    CODIGO
                                </th>
                                <th class="text-left">
                                    B.Datos
                                </th>
                                <th class="text-left">
                                    SEDE
                                </th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in array_sedes" :key="item.key" @click="select_tienda(item)">
                                <td>{{ item.codigo }}</td>
                                <td>{{ item.base }}</td>
                                <td>{{ item.nombre }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

            </v-card>
        </v-dialog>
        <dial_multi v-if="dialogo_multi" @cierra="dialogo_multi = false"></dial_multi>
    </nav>
</template>

<script>
// @ is an alias to /src
import firebase from 'firebase'
import {
    nuevoCampoUsuario,
    obtenerBD,
    allConfigura,
    allModoPago,
    allBancos,
    consultaArchivo,
    obtenerImpresoras,
    allUsuarios,
    allnotificaciones,
    allProductos,
    obtenerSeries,
    allCategorias,
    lee_multiEmpresas,
    alltabla_cliente,
    all_serv_imp,
    allBono,
    all_medidas
} from '../db'
import {
    colClientes
} from '../db_firestore'
import store from '@/store/index'
import mensaje from '@/components/dialogos/dialogMensaje'
import dialogAlerta from '@/components/dialogos/dialogAlerta'
import dialogoprogress from '@/components/dialogos/dialogoprogress'
import dialogosnackbar from '@/components/dialogos/dialogosnackbar'
import dial_multi from '@/components/multi_empresa'
import imageToBase64 from 'image-to-base64/browser'
import isMobile from 'mobile-device-detect'
import { resetFiltros } from '../guarda_navegador';
export default {
    name: 'barrasuperior',

    components: {
        mensaje,
        dialogAlerta,
        dialogoprogress,
        dialogosnackbar,
        dial_multi
    },
    data() {
        return {
            dialogo_multi: false,
            listaMenu: false,
            drawer: false,
            user: '',
            nombreusuario: '',
            barra: true,
            bd: '',
            dialog: false,
            messages: 0,
            selected: [],
            items: [{
                action: '15 min',
                headline: 'Tenemos novedades para Ti',
                subtitle: 'Facturacion Domotica System esta habilitado para ti, los 365 dias',
                title: 'BIENVENIDO!',
            },],
            dialog_tiendas: false,
            array_sedes: [],
            sede_acual: ''
        }
    },
    beforeCreate() {
        // 0) Pinta rápido si ya tienes permisos/BD guardados (vuex-persistedstate)
        const cachedPerm = store.state.permisos;
        const cachedBD = store.state.baseDatos;
        if (cachedPerm && cachedBD) {
            this.barra = false;                 // muestra UI al toque
            this.bd = cachedPerm.bd || '';
        }

        // 1) Asegura persistencia LOCAL (hazlo una sola vez al iniciar la app)
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(() => { /* noop */ });

        // 2) Si ya hay usuario, úsalo de inmediato (sin esperar el callback)
        const cu = firebase.auth().currentUser;
        if (cu) {
            this.user = cu.email;
            this.nombreusuario = cu.email.slice(0, -13);
            this.barra = false;
            //console.log('asss',cu.email)
            //this.obtenerDatausuario(cu.email)
            // cache→server para permisos
            //  this.obtenerDatausuarioPorUid?.();  // o tu variante por correo con cache→server
        }

        // 3) Aún así suscríbete para cambios (login/logout futuros)
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.user = user.email;
                this.nombreusuario = user.email.slice(0, -13);
                this.barra = false;
                this.obtenerDatausuario(user.email)
            } else {
                this.user = null;
                store.commit('BD', '');
            }
        });
    },
    computed: {
        esCaja2() {
            return this.$route.path === "/caja2";
        }
    },
    created() {

    },
    methods: {
        abrir_flujo() {
            this.$router.push('/flujocaja'); // Redirige a la ruta flujocaja
        },
        accion(accion) {
            if (accion == "Cerrar Sesion") {
                try { resetFiltros(); } catch (e) { /* noop */ }
                firebase.auth().signOut().then(() => {
                    this.$router.push({
                        name: 'Home'
                    })
                    this.barra = true
                    store.commit('BD', '')
                    store.commit('permisos', '')
                    localStorage.removeItem('ruc_asociado');
                    location.reload(true);
                })
            }
            if (accion == "paneladmin") {
                this.$router.push({
                    name: 'paneladmin'
                })
            }
        },
        router(view) {
            this.$router.push({
                name: view
            })
        },

        async obtenerDatausuario(user) {
            var snapshot = await allUsuarios().orderByChild('correo').equalTo(user).once("value")
            if (snapshot.exists()) {
                snapshot.forEach((item) => {
                    this.bd = item.val().bd
                    store.commit('permisos', item.val())

                })

                this.obtenerCliente(this.bd)
            }
        },
        async obtenerCliente(BD) {
            var snapshot = await obtenerBD(BD).once("value")

            store.commit('BD', snapshot.val())
            localStorage.setItem('ruc_asociado', snapshot.val().ruc_asociado);

            store.commit('esmovil', isMobile.isAndroid)
            if (snapshot.exists()) {
                this.obtenconfiguracion()
                this.notificaciones(snapshot.val())
                this.cargar_datos()
                this.obtener_multi(snapshot.val())
            } else {
                alert('Empresa sin informacion')
            }
        },
        async obtener_multi(data) {
            if (data.multi_empresa) {
                const snap = await lee_multiEmpresas(data.ruc).once('value');
                const empresa = snap.val();

                if (empresa && empresa.sedes) {

                    store.commit('array_sedes', empresa.sedes);
                    const emp = empresa.sedes.filter(e => e.tipo == 'sede')
                    // Buscar la sede actual por coincidencia de base de datos
                    this.array_sedes = emp
                    const sedeActual = empresa.sedes.find(e => e.codigo === store.state.permisos.codigo);
                    store.commit('sedeActual', sedeActual);
                    this.sede_acual = sedeActual ? sedeActual.nombre : '';
                }
            }
        },

        async obtenconfiguracion() {
            all_medidas().once('value').then((snap) => {
                const base = (store.state.medidassunat || []).map(m => ({
                    nombre: String(m.nombre || '').trim().toUpperCase(),
                    corto: String(m.corto || '').trim().toUpperCase(),
                    general: String(m.general || '').trim().toUpperCase(),
                }));

                const extras = Object.values(snap.val() || {}).map(it => ({
                    nombre: String(it.nombre || '').trim().toUpperCase(),
                    corto: String(it.corto || '').trim().toUpperCase(),
                    general: String(it.general || '').trim().toUpperCase(),
                }));

                // Únicos por nombre
                const seen = new Set();
                const uniq = [...base, ...extras].filter(x => {
                    if (seen.has(x.nombre)) return false;
                    seen.add(x.nombre);
                    return true;
                });

                store.commit('set_medidas', uniq);
            });

            allBono().once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    store.commit('bonos', snapshot.val())
                }
            })
            allConfigura().once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    store.commit('configuracion', snapshot.val())
                }
            })
            obtenerImpresoras().once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    //console.log(snapshot.val())
                    store.commit("configImpresora", snapshot.val())
                }
            })
            all_serv_imp().once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    store.commit("serv_imp", snapshot.val())
                }
            })
            consultaArchivo().once("value").then((snapshot) => {
                store.commit("logoempresa", '')
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
            })
            obtenerSeries().once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    store.commit("seriesdocumentos", snapshot.val())
                }
            })
            allModoPago().once("value").then((snapshot) => {
                if (snapshot.exists()) {
                    store.commit("modopagos", snapshot.val())
                }
            })
            allBancos().once("value").then((snapshot) => {
                var arraybanco = []
                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        arraybanco.push(item.val())
                    })
                    store.commit("bancos", arraybanco)
                }
            })


        },

        cargar_datos() {
            console.log('Cargando datos iniciales...');
            const idxById = new Map();     // id -> posición en array
            const clientessearch = [];
            const unsub = colClientes().onSnapshot({ includeMetadataChanges: true }, (querySnapshot) => {
                console.log('fromCache?-barra', querySnapshot.metadata.fromCache);          // true/false
                console.log('changes:-barra', querySnapshot.docChanges().length);

                querySnapshot.docChanges().forEach((ch) => {
                    const id = ch.doc.id;

                    if (ch.type === 'removed') {
                        // eliminar en O(1) con swap&pop
                        const i = idxById.get(id);
                        if (i !== undefined) {
                            const last = clientessearch.length - 1;
                            const lastItem = clientessearch[last];
                            clientessearch[i] = lastItem;
                            clientessearch.pop();
                            idxById.delete(id);
                            if (lastItem) idxById.set(lastItem.id, i);
                        }
                        return;
                    }

                    // added | modified -> upsert versión corta
                    const d = ch.doc.data() || {};
                    const nombre = String(d.nombre || '').trim();
                    const nota = String(d.nota || '').trim();
                    const item = { id, nombre, nota };

                    const i = idxById.get(id);
                    if (i === undefined) {
                        idxById.set(id, clientessearch.length);
                        clientessearch.push(item);
                    } else {
                        clientessearch.splice(i, 1, item);
                    }
                });
                if (typeof store !== 'undefined' && store.state) {
                    store.state.clientessearch = clientessearch;
                }
            });
            allProductos().on('value', (snapshot) => {
                let array = [];
                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        let data = item.val();
                        array.push(data);
                    });
                    store.commit('productos', array)
                }
            })
            allCategorias("categorias").on('value', (snapshot) => {
                let array = [];
                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        let data = item.val();
                        let key = item.key;
                        data.id = key
                        array.push(data);
                    });
                    store.commit('categorias', array)
                }
            })
            alltabla_cliente('zona').on('value', (snapshot) => {
                let array = [];
                if (snapshot.exists()) {
                    snapshot.forEach((item) => {
                        let data = item.val();
                        array.push(data);
                    });
                    store.commit('zonas', array)
                }
            })
        },

        opcionCaja() {
            if (store.state.baseDatos.caja2) {
                this.$router.push({
                    name: 'caja2'
                })
            }
        },
        opcionCaja2() {
            if (store.state.baseDatos.caja2) {
                this.$router.push({
                    name: 'caja_pc'
                })
            }
        },
        notificaciones(items) {
            allnotificaciones(items.bd).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    var data = snapshot.val()
                    store.commit('arraynotifica', data)
                    if (data.dialogoactualiza) {
                        store.commit('dialogomensaje')
                    }
                    if (data.dialogoAlerta) {
                        store.commit('dialogoAlerta')
                    }
                }
            })
        },
        async abre_tiendas() {
            store.commit("dialogoprogress")
            //  this.array_sedes = []

            //  this.array_sedes = store.state.array_sedes; // Asegúrate de tener esta mutación en tu Vuex
            this.dialog_tiendas = true;
            store.commit("dialogoprogress")
        },
        async select_tienda(data) {
            if (!store.state.permisos.moduloempresa) {
                alert('no cuenta con permiso para cambiar de sede!')
                return
            }
            store.commit("dialogoprogress")
            await nuevoCampoUsuario(store.state.permisos.token, 'codigo', data.codigo)
            await nuevoCampoUsuario(store.state.permisos.token, 'bd', data.base)
            location.reload(true);
            this.dialog_tiendas = false
        }

    },


}
</script>
<style>
@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
<style scoped>
.drawer-estilo {
    border-top-right-radius: 15px;
    border-bottom-right-radius: 15px;
    box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.3);
}
</style>