<template>
    <div class="mb-6 pa-3 mt-1">

        <v-row dense class="mb-2">

            <v-col cols="6">
                <v-btn :disabled="!$store.state.permisos.crea_producto" rounded elevation="2" color="primary" block
                    small @click="obtenordenproducto">
                    <v-icon left>mdi-plus</v-icon> Nuevo producto
                </v-btn>
            </v-col>
            <v-col cols="6">
                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="success" block small v-bind="attrs" v-on="on">
                            <v-icon left>mdi-cog</v-icon> Opciones
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" small color="warning" block
                                @click="dialogostock = true, Procesa()">
                                <v-icon left>mdi-chart-bar</v-icon> Ver Estadistica
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" dark small color="success" block
                                @click="dialogoFiltro = true">
                                <v-icon left>mdi-filter</v-icon> Filtro
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn :disabled="!$store.state.sedeActual.principal" dark small color="info" block
                                @click="subirXLS">
                                <v-icon left>mdi-microsoft-excel</v-icon> Exportar Excel
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="warning" block @click="dialogoAlertaStockManual = true">
                                <v-icon left>mdi-alert</v-icon> Alerta Stock Mínimo
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn dark small color="purple" block @click="irABonosGlobales">
                                <v-icon left>mdi-gift</v-icon> Configuración de Bonos
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn small color="green" class="mr-n2" @click="analiza_gruposs">
                                MIGRAR BONO
                            </v-btn>
                        </v-list-item>

                    </v-list>
                </v-menu>
            </v-col>
        </v-row>

        <v-row align="center">
            <v-col cols="6">
                <v-text-field outlined dense v-model="buscar" append-icon="mdi-magnify" label="BUSCAR"></v-text-field>
            </v-col>
            <v-col cols="6" class="mt-n6">
                <v-select outlined dense v-model="filtro_categoria" :items="arraycategoria_f" menu-props="auto"
                    hide-details label="Categoria"></v-select>
            </v-col>
        </v-row>
        <v-card class="pa-4" v-if="!isMobile">
            <v-data-table dense :headers="headers" :items="listafiltrada" item-key="id" mobile-breakpoint="0">
                <template v-slot:item="{ item }">
                    <tr>
                        <td style="font-size:80%;">{{ item.id }}</td>
                        <td style="font-size:80%;">{{ item.categoria }}</td>
                        <td style="font-size:80%;">{{ item.nombre }}</td>
                        <td style="font-size:80%;">{{ item.medida }}</td>
                        <td style="font-size:80%;">{{ convierte_stock(item.stock, item.factor) }}</td>
                        <td style="font-size:80%;">{{ Number(item.precio).toFixed(2) }}</td>
                        <td style="font-size:80%;">
                            <v-row>
                                <v-col cols="12">
                                    <v-icon color="green" :disabled="!$store.state.permisos.productos_edita"
                                        @click="editar(item)">mdi-lead-pencil</v-icon>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </template>
            </v-data-table>
        </v-card>

        <!-- MOBILE con alto fijo por ítem -->
        <v-card v-else class="mobile-card d-flex flex-column">
            <div class="mobile-list">
                <recycle-scroller :items="listafiltrada" :item-size="80" key-field="id" class="scroller">
                    <template #default="{ item }">
                        <div class="item-card">
                            <div class="item-main">
                                <div class="item-title">{{ item.nombre }}</div>
                                <div class="item-sub">#{{ item.id }} · {{ item.categoria }} · {{ item.medida }}</div>
                                <div class="item-meta">
                                    Stock: {{ convierte_stock(item.stock, item.factor) }} · S/{{ redondear(item.precio)
                                    }}
                                </div>
                            </div>
                            <v-btn icon small :disabled="!$store.state.permisos.productos_edita" @click="editar(item)">
                                <v-icon color="green">mdi-lead-pencil</v-icon>
                            </v-btn>
                        </div>
                    </template>
                </recycle-scroller>
            </div>
            <v-divider class=""></v-divider>
            <v-card-actions class="py-1 px-3 d-flex justify-space-between">
                <span class="caption grey--text text--darken-1">Mostrando</span>
                <v-chip small color="primary" text-color="white" label>
                    {{ listafiltrada.length }} ítems
                </v-chip>
            </v-card-actions>
        </v-card>

        <v-dialog v-model="dialogo" max-width="650px">
            <div>
                <v-system-bar window dark>
                    <v-icon color="red" large @click="dialogo = !dialogo">mdi-close</v-icon>
                    <v-switch dense v-model="activo" color="green" label="Activo"></v-switch>
                    <v-switch dense v-model="controstock" color="green" label="Stock"></v-switch>
                    <v-spacer></v-spacer>

                    <v-spacer></v-spacer>
                    <v-icon color="green" large @click="save(false)">mdi-content-save</v-icon>
                    <template>
                        <v-menu bottom left offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn icon v-bind="attrs" v-on="on">
                                    <v-icon>mdi-dots-vertical</v-icon>
                                </v-btn>
                            </template>
                            <v-list dense>
                                <v-list-item @click="dial_bono_global = !dial_bono_global">
                                    <v-list-item-icon><v-icon color="info">mdi-magnify</v-icon></v-list-item-icon>
                                    <v-list-item-title>Bono Global</v-list-item-title>
                                </v-list-item>
                            </v-list>

                            <v-list dense>
                                <v-list-item @click="print_codbarra()">
                                    <v-list-item-icon><v-icon color="warning">mdi-barcode</v-icon></v-list-item-icon>
                                    <v-list-item-title>CodBarra</v-list-item-title>
                                </v-list-item>
                            </v-list>
                            <v-list dense>
                                <v-list-item @click="dial_adicional = !dial_adicional">
                                    <v-list-item-icon><v-icon color="success">mdi-plus</v-icon></v-list-item-icon>
                                    <v-list-item-title>Campos Adicionales</v-list-item-title>
                                </v-list-item>
                            </v-list>
                            <v-list dense>
                                <v-list-item @click="dialogoElimina = true">
                                    <v-list-item-icon><v-icon color="red">mdi-delete</v-icon></v-list-item-icon>
                                    <v-list-item-title>Eliminar</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>
                </v-system-bar>
            </div>

            <v-card class="pa-4">

                <v-row dense>
                    <v-col cols="6" sm="6" md="6" v-if="false">
                        <v-select :items="arraytipoProducto" label="Tipo" dense outlined
                            v-model="tipoproducto"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-select :items="arrayOperacion" label="Operacion" dense outlined
                            v-model="operacion"></v-select>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined dense :disabled="!$store.state.permisos.productos_edita_id" v-model="id"
                            label="ID"></v-text-field>
                    </v-col>
                </v-row>

                <v-row class="mt-n6" dense>
                    <v-col cols="6" sm="6" md="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="proveedor" :items="arrayproveedor" hide-details label="Proveedor" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class="mr-n2" @click="abre_tabla('proveedor')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>
                    </v-col>

                    <v-col cols="6" sm="6" md="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="categoria" :items="arraycategoria" hide-details label="Categoría" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class="mr-n2" @click="abre_tabla('categorias')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>
                    </v-col>
                </v-row>
                <v-row class="mt-1" dense>
                    <v-col cols="6">
                        <v-layout dense align-center>
                            <v-flex>
                                <v-autocomplete outlined :disabled="!$store.state.permisos.productos_edita" dense
                                    v-model="marca" :items="array_marca" hide-details label="Marca" clearable
                                    cache-items :menu-props="{ maxHeight: 300 }" :filter="filtraStr" />
                            </v-flex>
                            <v-btn icon small color="green" class=" mr-n2" @click="abre_tabla('marcas')">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-layout>

                    </v-col>
                    <v-col cols="6">
                        <v-text-field dense outlined v-model="codbarra" label="Cod Barras"
                            append-icon="mdi-barcode-scan" :autofocus="!$store.state.esmovil"
                            @click:append="escanea_qr()"></v-text-field>
                    </v-col>

                </v-row>
                <v-row class="mt-n7">
                    <v-col cols="12">
                        <v-textarea :disabled="!$store.state.permisos.productos_edita" dense outlined v-model="nombre"
                            auto-grow filled label="Descripcion" rows="1"></v-textarea>
                    </v-col>
                </v-row>

                <v-row class="mt-n7" dense>
                    <v-col cols="12" xs="12" sm="4" md="4" :class="$vuetify.breakpoint.smAndDown ? 'mb-n6 mt-n1' : ''">
                        <v-autocomplete outlined dense clearable :disabled="!$store.state.permisos.productos_edita"
                            v-model="medida" :items="itemsMedidasNombre" item-text="text" item-value="value"
                            label="Medida" :menu-props="{ maxHeight: 300 }" :filter="filtraStr"
                            @change="medida = (medida || '').toUpperCase()" />
                    </v-col>
                    <v-col cols="6" xs="6" sm="4" md="4">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="factor" label="Factor"></v-text-field>
                    </v-col>

                    <v-col cols="6" xs="6" sm="4" md="4">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="stock" label="Stock"></v-text-field>
                    </v-col>


                </v-row>
                <v-row class="mt-n6" dense>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined readonly dense :value="convierte_stock(stock, factor)"
                            label="Stock Conjunto"></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="6" md="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" type="number" dense
                            v-model="precio" label="Precio"></v-text-field>
                    </v-col>
                </v-row>

                <v-alert v-if="grupoPrecioSelect" type="info" dense text class="mt-n4 mb-10">
                    Escalas deshabilitadas: Tiene grupo de precio global asignado
                    <v-btn x-small text color="primary" class="ml-2" @click="quitarGrupoPrecio">
                        Quitar grupo de precio Global
                    </v-btn>
                </v-alert>

                <v-row class="mt-n6" dense>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita || !!grupoPrecioSelect"
                            type="number" dense v-model="escala_may1" label="Escala may 1"
                            persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita || !!grupoPrecioSelect"
                            type="number" dense v-model="precio_may1" label="Precio may 1"
                            persistent-hint></v-text-field>
                    </v-col>

                </v-row>

                <v-row class="mt-n6" dense>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita || !!grupoPrecioSelect"
                            type="number" dense v-model="escala_may2" label="Escala may 2"
                            persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita || !!grupoPrecioSelect"
                            type="number" dense v-model="precio_may2" label="Precio may 2"
                            persistent-hint></v-text-field>
                    </v-col>

                </v-row>

                <v-row class="mt-n6" dense>

                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" dense type="number"
                            v-model="costo" label="Costo"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined :disabled="!$store.state.permisos.productos_edita" dense type="number"
                            v-model="peso" label="Peso (KG)"></v-text-field>
                    </v-col>
                </v-row>
                <v-card flat outlined class="mt-n4 rounded-lg overflow-hidden">
                    <v-tabs v-model="tabBonos" dense grow color="primary" background-color="grey lighten-5">
                        <v-tab class="text-none">
                            <v-icon small left color="orange">mdi-gift-outline</v-icon>
                            Bono
                            <v-badge v-if="grupoBonoAsignado" color="orange" content="1" inline small></v-badge>
                        </v-tab>
                        <v-tab class="text-none">
                            <v-icon small left color="blue">mdi-tag-multiple-outline</v-icon>
                            Precio
                            <v-badge v-if="grupoPrecioAsignado" color="blue" content="1" inline small></v-badge>
                        </v-tab>
                    </v-tabs>

                    <v-tabs-items v-model="tabBonos">
                        <v-tab-item px-2>
                            <v-card flat class="pa-3">
                                <div class="d-flex flex-wrap justify-space-between align-center mb-2">
                                    <span class="text-overline grey--text">Promoción de Regalo</span>
                                    <div class="d-flex">
                                        <v-btn color="primary" depressed x-small rounded
                                            @click="abrirBonoGlobalTab('bono')">
                                            <v-icon x-small left>mdi-sync</v-icon> {{ grupoBonoAsignado ? 'Cambiar' :
                                                'Asignar' }}
                                        </v-btn>
                                        <v-btn color="success" depressed x-small rounded class="ml-1"
                                            @click="abrirNuevoBonoDesdeProductos('bono')">
                                            <v-icon x-small left>mdi-plus</v-icon> Nuevo
                                        </v-btn>
                                        <v-btn v-if="grupoBonoAsignado" color="info" depressed x-small rounded
                                            class="ml-1" @click="abrirVisorProductos(grupoBonoAsignado)">
                                            <v-icon x-small left>mdi-account-group</v-icon> Ver Productos
                                        </v-btn>
                                    </div>
                                </div>

                                <v-card v-if="grupoBonoAsignado" flat outlined class="pa-0 rounded-lg border-orange">
                                    <div class="pa-2 orange lighten-5 d-flex align-center">
                                        <v-icon color="orange" small class="mr-2">mdi-gift</v-icon>
                                        <div class="text-truncate mr-2 flex-grow-1">
                                            <div
                                                class="text-body-2 font-weight-black orange--text text--darken-4 lh-tight text-uppercase">
                                                {{ grupoBonoAsignado.nombre }}</div>
                                            <div class="text-caption grey--text">{{ grupoBonoAsignado.codigo }}</div>
                                        </div>
                                        <v-btn icon x-small color="red" @click.stop="quitarGrupoBono">
                                            <v-icon small>mdi-delete-outline</v-icon>
                                        </v-btn>
                                    </div>

                                    <div class="pa-2 bg-white">
                                        <div v-if="grupoBonoAsignado.data && grupoBonoAsignado.data.length">
                                            <div v-for="(r, i) in grupoBonoAsignado.data" :key="i"
                                                class="d-flex align-center py-2 border-bottom-dashed">
                                                <div class="text-center mr-3 px-2 py-1 grey lighten-4 rounded"
                                                    style="min-width: 50px;">
                                                    <div class="text-caption grey--text lh-1 font-weight-bold">COMPRA
                                                    </div>
                                                    <div class="text-h6 font-weight-black lh-1 primary--text">{{
                                                        r.apartir_de }}
                                                    </div>
                                                    <div class="text-overline grey--text lh-1"
                                                        style="font-size: 0.5rem !important;">UND</div>
                                                </div>

                                                <div class="flex-grow-1">
                                                    <div
                                                        class="text-caption grey--text font-weight-medium mb-n1 uppercase">
                                                        Y
                                                        LLEVA GRATIS:</div>
                                                    <div class="text-body-2 font-weight-black success--text lh-tight">
                                                        {{ Number(r.cantidad_bono || r.cantidad || 0) }}x {{
                                                            obtenerNombreProducto(r.codigo || r.cod_producto) }}
                                                    </div>
                                                    <div class="text-overline grey--text lh-1">Límite: {{ r.cantidad_max
                                                        || '∞'
                                                        }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <v-alert v-else type="warning" dense text class="ma-0 caption">Este grupo no
                                            tiene
                                            reglas.</v-alert>
                                    </div>
                                </v-card>

                                <v-alert v-else color="grey lighten-3" dense class="text-center py-4 mb-0">
                                    <v-icon color="grey" class="mb-1">mdi-gift-off-outline</v-icon>
                                    <div class="caption grey--text text--darken-1">Sin bono asignado</div>
                                </v-alert>
                            </v-card>
                        </v-tab-item>

                        <v-tab-item>
                            <v-card flat class="pa-3">
                                <div class="d-flex flex-wrap justify-space-between align-center mb-2">
                                    <span class="text-overline grey--text">Escalas de Precio</span>
                                    <div class="d-flex">
                                        <v-btn color="primary" depressed x-small rounded
                                            @click="abrirBonoGlobalTab('precio')">
                                            <v-icon x-small left>mdi-sync</v-icon> {{ grupoPrecioAsignado ? 'Cambiar' :
                                                'Asignar' }}
                                        </v-btn>
                                        <v-btn color="success" depressed x-small rounded class="ml-1"
                                            @click="abrirNuevoBonoDesdeProductos('precio')">
                                            <v-icon x-small left>mdi-plus</v-icon> Nuevo
                                        </v-btn>
                                        <v-btn v-if="grupoPrecioAsignado" color="info" depressed x-small rounded
                                            class="ml-1" @click="abrirVisorProductos(grupoPrecioAsignado)">
                                            <v-icon x-small left>mdi-account-group</v-icon> Ver Productos
                                        </v-btn>
                                    </div>
                                </div>

                                <v-card v-if="grupoPrecioAsignado" flat outlined class="rounded-lg border-blue pa-0">
                                    <div class="pa-2 blue lighten-5 d-flex align-center border-bottom-subtle">
                                        <v-icon color="blue" small class="mr-2">mdi-tag-multiple</v-icon>
                                        <div class="flex-grow-1 text-truncate">
                                            <div
                                                class="text-body-2 font-weight-black blue--text text--darken-4 lh-tight text-uppercase">
                                                {{ grupoPrecioAsignado.nombre }}</div>
                                            <div class="text-caption grey--text">{{ grupoPrecioAsignado.codigo }}</div>
                                        </div>
                                        <v-btn icon x-small color="red" @click.stop="quitarGrupoPrecio">
                                            <v-icon small>mdi-delete-outline</v-icon>
                                        </v-btn>
                                    </div>

                                    <div class="pa-3">
                                        <v-row dense>
                                            <v-col cols="6" v-if="grupoPrecioAsignado.escala_may1">
                                                <div class="text-center pa-2 rounded grey lighten-5 border-blue-light">
                                                    <div class="text-overline grey--text lh-1">≥{{
                                                        grupoPrecioAsignado.escala_may1 }} UND</div>
                                                    <div class="text-subtitle-2 font-weight-black blue--text">S/{{
                                                        grupoPrecioAsignado.precio_may1 }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="6" v-if="grupoPrecioAsignado.escala_may2">
                                                <div class="text-center pa-2 rounded grey lighten-5 border-blue-light">
                                                    <div class="text-overline grey--text lh-1">≥{{
                                                        grupoPrecioAsignado.escala_may2 }} UND</div>
                                                    <div class="text-subtitle-2 font-weight-black blue--text">S/{{
                                                        grupoPrecioAsignado.precio_may2 }}</div>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </div>
                                </v-card>

                                <v-alert v-else color="grey lighten-3" dense class="text-center py-4 mb-0">
                                    <v-icon color="grey" class="mb-1">mdi-tag-off-outline</v-icon>
                                    <div class="caption grey--text text--darken-1">Sin escalas de precio</div>
                                </v-alert>
                            </v-card>
                        </v-tab-item>
                    </v-tabs-items>
                </v-card>

            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_bono_global" max-width="650px" persistent scrollable>
            <v-card>
                <v-toolbar flat dense color="primary" dark>
                    <v-btn icon @click="dial_bono_global = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-toolbar-title class="text-subtitle-1">
                        Asignar Bonos Globales
                    </v-toolbar-title>
                </v-toolbar>
                <v-card-text class="pt-4">
                    <div class="mb-4">
                        <div class="text-subtitle-2 mb-2">
                            Grupo de Precios Mayoreo
                        </div>
                        <v-autocomplete outlined dense clearable v-model="grupoPrecioSelect" :items="grupoPrecioItems"
                            item-text="text" item-value="value" label="Seleccionar" prepend-inner-icon="mdi-magnify"
                            no-data-text="No hay grupos de precios disponibles">
                            <template v-slot:item="{ item }">
                                <v-list-item-content>
                                    <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <span v-if="item.raw.escala_may1">
                                            ≥{{ item.raw.escala_may1 }} → S/{{ item.raw.precio_may1 }}
                                        </span>
                                        <span v-if="item.raw.escala_may2" class="ml-2">
                                            | ≥{{ item.raw.escala_may2 }} → S/{{ item.raw.precio_may2 }}
                                        </span>
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                        </v-autocomplete>
                        <v-card outlined class="pa-2" v-if="grupoPrecioSelectDetalle">
                            <div class="text-caption font-weight-bold">{{ grupoPrecioSelectDetalle.nombre }}</div>
                            <div class="text-caption grey--text" v-if="grupoPrecioSelectDetalle.fecha_vencimiento">
                                Vence: {{ formatearFechaSimple(grupoPrecioSelectDetalle.fecha_vencimiento) }}
                            </div>
                            <v-row dense class="mt-1">
                                <v-col cols="6" v-if="grupoPrecioSelectDetalle.escala_may1">
                                    <div class="text-caption blue--text">
                                        ≥{{ grupoPrecioSelectDetalle.escala_may1 }} und → <strong>S/{{
                                            grupoPrecioSelectDetalle.precio_may1 }}</strong>
                                    </div>
                                </v-col>
                                <v-col cols="6" v-if="grupoPrecioSelectDetalle.escala_may2">
                                    <div class="text-caption blue--text">
                                        ≥{{ grupoPrecioSelectDetalle.escala_may2 }} und → <strong>S/{{
                                            grupoPrecioSelectDetalle.precio_may2 }}</strong>
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card>
                    </div>

                    <v-divider class="mb-4"></v-divider>
                    <div>
                        <div class="text-subtitle-2 mb-2">Grupo de Bonificación</div>
                        <v-autocomplete outlined dense clearable v-model="grupoBonoSelect" :items="grupoBonoItems"
                            item-text="text" item-value="value" label="Seleccionar" prepend-inner-icon="mdi-magnify"
                            no-data-text="No hay grupos disponibles">
                            <template v-slot:item="{ item }">
                                <v-list-item-content>
                                    <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ item.raw.data ? item.raw.data.length : 0 }} regla(s)
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                        </v-autocomplete>
                        <v-card outlined class="pa-2" v-if="grupoBonoSelectDetalle">
                            <div class="text-caption font-weight-bold mb-1">{{ grupoBonoSelectDetalle.nombre }}</div>
                            <div class="text-caption grey--text" v-if="grupoBonoSelectDetalle.fecha_vencimiento">
                                Vence: {{ formatearFechaSimple(grupoBonoSelectDetalle.fecha_vencimiento) }}
                            </div>
                            <v-simple-table dense
                                v-if="grupoBonoSelectDetalle.data && grupoBonoSelectDetalle.data.length" class="mt-1">
                                <template v-slot:default>
                                    <thead>
                                        <tr>
                                            <th class="text-caption">A partir de</th>
                                            <th class="text-caption">Bonificación</th>
                                            <th class="text-caption">Máx</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(regla, idx) in grupoBonoSelectDetalle.data" :key="idx">
                                            <td class="text-caption">{{ regla.apartir_de }} und</td>
                                            <td class="text-caption">
                                                <strong class="orange--text">{{ regla.cantidad_bono }}x</strong>
                                                {{ obtenerNombreProducto(regla.codigo) }}
                                            </td>
                                            <td class="text-caption">{{ regla.cantidad_max || '∞' }}</td>
                                        </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>
                        </v-card>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn text color="grey" @click="dial_bono_global = false">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="guardarBonosGlobales">
                        <v-icon left>mdi-check</v-icon> Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogoElimina" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoElimina = !dialogoElimina">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-text>
                    <h3> DESEA ELIMINAR PERMANENTEMENTE EL PRODUCTO? {{ itemelimina }}</h3>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="eliminar()">si</v-btn>
                    <v-btn color="error" @click="dialogoElimina = !dialogoElimina">no</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoFiltro" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogoFiltro = !dialogoFiltro">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-card-text>
                    <v-select :items="arrayfiltroStock" label="Stock" outlined v-model="filtrostock"></v-select>
                    <v-select :items="arrayfiltroestado" label="ESTADO" outlined v-model="filtroestado"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="dialogoFiltro = !dialogoFiltro">FILTRAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialo_escaner" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialo_escaner = !dialo_escaner">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <lector v-if="dialo_escaner" msg="Hello Vue in CodeSandbox!" @resultado="resultado($event)" />
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_adiciona" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_adiciona = !dial_adiciona">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row class="" dense>
                    <v-col cols="12">
                        <v-text-field outlined type="number" dense v-model="apartir_de"
                            label="Bono apartir de :"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field outlined type="number" dense v-model="cantidad_bono"
                            label="Cantidad bonificacion"></v-text-field>
                    </v-col>
                </v-row>
                <v-autocomplete v-model="producto_sele" :items="$store.state.productos" item-text="nombre"
                    item-value="id" label="Buscar Productos" clearable menu-props="auto" outlined dense
                    append-icon="mdi-magnify">
                    <template v-slot:item="{ item }">
                        <v-list-item-content>
                            <v-list-item-title>
                                <strong>{{ item.categoria }}</strong> - {{ item.nombre }}
                            </v-list-item-title>
                        </v-list-item-content>
                    </template></v-autocomplete>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" @click="guardar_bono()">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogostock" max-width="490">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogostock = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon @click="exporta()" large color="green">mdi-microsoft-excel</v-icon>
                </v-system-bar>
            </div>
            <v-card>
                <v-card-title>
                    <v-spacer></v-spacer>

                </v-card-title>
                <h5 class="pa-5 mt-n5"> Total Stock: {{ arrayConsolidartotal.cantidad }} / Total Costo:
                    {{ arrayConsolidartotal.costo }} / Total precio: {{ arrayConsolidartotal.precio }} </h5>

                <v-simple-table fixed-header height="400px">
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Nombre
                                </th>
                                <th class="text-left">
                                    Cantidad
                                </th>
                                <th class="text-left">
                                    Costo
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in arrayConsolidar" :key="item">
                                <td>{{ item.categoria }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>{{ item.costo }}</td>
                                <td>{{ item.precio }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>

            </v-card>

        </v-dialog>
        <v-dialog v-model="dial_adicional" max-width="490" persistent>
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_adicional = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                    <v-icon color="green" large @click="save(true), dial_adicional = false">mdi-content-save</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-2">
                <v-row class="mt-1" dense>
                </v-row>
                <v-text-field outlined dense v-model="obs1" label="Observacion 1"></v-text-field>
                <v-text-field outlined dense type="number" v-model="stock_minimo" label="Stock mínimo">
                    <template v-slot:append>
                        <span class="text-caption grey--text">{{ medida }}</span>
                    </template>
                </v-text-field>
                <div v-if="factor > 1" class="text-caption grey--text mt-n4 mb-2 ml-1">
                    Equivale a: <strong>{{ stockMinimoConvertido }}</strong>
                </div>

            </v-card>

        </v-dialog>
        <dial_categorias v-if="dial_categorias" @cierra="cerrarYActualizarCategorias" :tipo='tipo_tabla' />
        <dial_alerta_stock_minimo v-if="permisoAlertaStockActivo" v-model="dialogoAlertaStock" />
        <dial_alerta_stock_minimo v-model="dialogoAlertaStockManual" />
        <dial_config_bono v-model="dial_bono_productos" :bono="bonoSeleccionadoProductos"
            :proveedoresItems="proveedoresItemsProductos" :productos="productosItems" :editando="editandoBonoProductos"
            @guardar="guardarBonoDesdeProductos" />

        <VisorProductosBono v-model="dialVisorProductos" :bono="bonoParaVisor" @producto-agregado="onProductoAgregado"
            @producto-quitado="onProductoQuitado" />
    </div>
</template>

<script>
import dial_categorias from '@/views/productos/dialogos/categorias.vue';
import dial_alerta_stock_minimo from './dialogos/dial_alerta_stock_minimo.vue';
import lector from "@/components/lector";
import moment from 'moment'
import { imprime_codbarra } from './imprime_cod_barra'
import { runMigracionBonosUnitariosToGlobales } from './migracion_bonos'
import dial_config_bono from './dialogos/dial_config_bono.vue';
import VisorProductosBono from './components/VisorProductosBono.vue';
import {
    nuevoProducto,
    eliminaProducto,
    obtenContador,
    sumaContador,
    allCategorias,
    allBono,
    nuevoProductoOtraBase,
} from '../../db'
import store from '@/store/index'
import XLSX from 'xlsx'
export default {
    props: {
        msg: String,
    },
    components: {
        lector,
        dial_categorias,
        dial_alerta_stock_minimo,
        dial_config_bono,
        VisorProductosBono
    },
    data: () => ({
        dial_adicional: false,
        dialogostock: false,
        dial_categorias: false,
        dialogoAlertaStock: false,
        dialogoAlertaStockManual: false,
        headers: [{
            text: 'id',
            align: 'start',
            sortable: false,
            value: 'id',
        },
        {
            text: 'Categoria',
            value: 'categoria',
        },
        {
            text: 'Nombre',
            value: 'nombre',
        },
        {
            text: 'Medida',
            value: 'medida',
        },
        {
            text: 'Stock',
            value: 'stock',
        },
        {
            text: 'Precio',
            value: 'precio',
        },
        {
            text: 'Actions',
            value: 'actions',
            sortable: false
        },
        ],
        dialo_escaner: false,
        snackbar: false,
        text: '',
        timeout: 2000,
        sumacon: false,
        itemelimina: '',
        dialogoElimina: false,
        dialogoFiltro: false,
        buscar: '',
        desserts: [],
        id: '',
        categoria: '',
        proveedor: '',
        nombre: '',
        medida: 'UNIDAD',
        stock: '',
        precio: 0,
        costo: 0,
        margen: '',
        cocina: '',
        arrayConsolidar: [],
        arrayConsolidartotal: [],
        arraycategoria: [],
        arrayproveedor: [],
        arraylocales: [],
        dialogo: false,
        arraytipoProducto: ['BIEN', 'SERVICIO'],
        arrayfiltroStock: ['incluir 0', 'excluir 0'],
        filtrostock: 'incluir 0',
        arrayfiltroestado: ['TODOS', 'ACTIVO', 'INACTIVO'],
        filtroestado: 'TODOS',
        tipoproducto: "BIEN",
        arrayOperacion: [
            'GRAVADA',
            'EXONERADA',
            'INAFECTA'
        ],
        operacion: "GRAVADA",
        icbper: false,
        controstock: true,
        codbarra: '',
        activo: true,
        barra: false,
        cargoxconsumo: false,
        filtro_categoria: 'TODOS',
        arraycategoria_f: [],
        factor: '1',
        escala_may1: 0,
        precio_may1: 0,
        escala_may2: 0,
        precio_may2: 0,
        peso: 0,
        tiene_bono: false,
        dial_adiciona: false,
        lista_bono: [],
        apartir_de: 1,
        cantidad_bono: 1,
        producto_sele: '',
        tipo_tabla: null,
        marca: '',
        array_marca: [],
        item_selecto: '',
        dial_bono_global: false,
        grupoPrecioItems: [],
        grupoBonoItems: [],
        grupoPrecioSelect: null,
        grupoBonoSelect: null,
        obs1: '',
        stock_minimo: 0,
        bonosGlobalesCache: [],
        tabBonos: 0,
        dial_bono_productos: false,
        bonoSeleccionadoProductos: {},
        editandoBonoProductos: false,
        tipoBonoActual: 'precio',
        dialVisorProductos: false,
        bonoParaVisor: {},
    }),

    async beforeCreate() {
        var snapshot = await allCategorias("categorias").once("value")
        snapshot.forEach((item) => {
            this.arraycategoria_f.push(item.val().nombre)
            this.arraycategoria.push(item.val().nombre)
        })
        var snapshot = await allCategorias("marcas").once("value")
        snapshot.forEach((item) => {
            this.array_marca.push(item.val().nombre)
        })
    },

    created() {
        console.log(store.state.sedeActual.principal)
        this.arraycategoria_f.push('TODOS')
    },

    mounted() {
        this.mostrarAlertaStock();
    },

    watch: {
        dial_bono_global(val) {
            if (val) this.cargarGruposBonos();
        },
        dialogo(val) {
            if (val) this.cargarBonosGlobalesCache();
        },
    },

    computed: {
        permisoAlertaStockActivo() {
            return Boolean(this.$store.state.configuracion?.alerta_stock_minimo);
        },
        stockMinimoConvertido() {
            const s = Number(this.stock_minimo) || 0;
            const f = Number(this.factor) || 1;
            if (f <= 1) return `${s} ${this.medida || 'UND'}`;
            const cajas = Math.floor(s / f);
            const und = s - (cajas * f);
            const medidaBase = (this.medida || 'CAJA').toUpperCase();
            if (und > 0) {
                return `${cajas} ${medidaBase}(s) y ${und} UND`;
            }
            return `${cajas} ${medidaBase}(s)`;
        },
        itemsMedidasNombre() {
            const arr = (this.$store.state.medidassunat || []);
            return arr.map(m => ({
                text: `${String(m.nombre || '').toUpperCase()}`,
                value: String(m.nombre || '').toUpperCase()
            }));
        },
        esMovil() {
            return this.$vuetify && this.$vuetify.breakpoint ? this.$vuetify.breakpoint.smAndDown : false
        },
        isMobile() {
            return this.$vuetify.breakpoint.smAndDown;
        },
        listafiltrada() {
            this.desserts = store.state.productos
            if (this.filtrostock == 'excluir 0') {
                var filtro = this.desserts.filter((item) =>
                    (item.stock) > 0)
            } else {
                var filtro = this.desserts
            }

            if (this.filtroestado == 'TODOS') {
                var lista = filtro
            } else {
                if (this.filtroestado == 'ACTIVO') {
                    var lista = filtro.filter((item) =>
                        (item.activo) == true)
                } else {
                    var lista = filtro.filter((item) =>
                        (item.activo) == false)
                }
            }
            if (this.filtro_categoria == 'TODOS') {
                return lista.filter((item) => (item.id + item.nombre+item.codbarra)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
            } else {
                return lista.filter(item => item.categoria == this.filtro_categoria && (item.id + item.nombre)
                    .toLowerCase().includes(this.buscar.toLowerCase()))
            }
        },
        grupoPrecioAsignado() {
            if (!this.grupoPrecioSelect) return null;
            const bono = this.bonosGlobalesCache.find(b => b.codigo === this.grupoPrecioSelect && b.tipo === 'precio');
            if (!bono || !bono.activo) return null;
            if (bono.fecha_vencimiento && new Date(bono.fecha_vencimiento) < new Date()) return null;
            return bono;
        },
        grupoBonoAsignado() {
            if (!this.grupoBonoSelect) return null;
            const bono = this.bonosGlobalesCache.find(b => b.codigo === this.grupoBonoSelect && b.tipo === 'bono');
            if (!bono || !bono.activo) return null;
            if (bono.fecha_vencimiento && new Date(bono.fecha_vencimiento) < new Date()) return null;
            return bono;
        },
        grupoPrecioSelectDetalle() {
            if (!this.grupoPrecioSelect) return null;
            const item = this.grupoPrecioItems.find(i => i.value === this.grupoPrecioSelect);
            return item ? item.raw : null;
        },
        grupoBonoSelectDetalle() {
            if (!this.grupoBonoSelect) return null;
            const item = this.grupoBonoItems.find(i => i.value === this.grupoBonoSelect);
            return item ? item.raw : null;
        },
        tieneBonosGlobalesAsignados() {
            return !!(this.grupoPrecioAsignado || this.grupoBonoAsignado);
        },
        contarBonosGlobales() {
            let count = 0;
            if (this.grupoPrecioAsignado) count++;
            if (this.grupoBonoAsignado) count++;
            return count;
        },
        productosItems() {
            return store.state.productos || [];
        },
        proveedoresItemsProductos() {
            const provs = new Set();
            (store.state.productos || []).forEach(p => {
                if (p.proveedor) provs.add(p.proveedor);
            });
            return Array.from(provs).sort();
        },
    },

    methods: {
        abrirBonoGlobalTab(tipo) {
            this.dial_bono_global = true;
        },
        analiza_gruposs() {
            runMigracionBonosUnitariosToGlobales({ limpiarBonoUnitario: true })
        },
        analiza_grupos() {
            try {
                const productos = (store.state.productos || []).filter(Boolean);

                const conBonos = productos.filter(p => p.tiene_bono === true); // SOLO true

                const filas = conBonos.map(p => {
                    const lista = Array.isArray(p.lista_bono) ? p.lista_bono.filter(Boolean) : [];

                    // ordenar reglas por apartir_de numérico
                    const ordenadas = lista.slice().sort((a, b) => (Number(a.apartir_de) || 0) - (Number(b.apartir_de) || 0));

                    const resumen = ordenadas.slice(0, 5).map(r => {
                        const a = Number(r?.apartir_de) || 0;
                        const c = Number(r?.cantidad) || 0;
                        const nom = r?.nom_producto || '';
                        return `${a}→${c}x ${nom}`;
                    }).join(' | ') + (ordenadas.length > 5 ? ' ...' : '');

                    return {
                        id: p.id,
                        categoria: p.categoria,
                        nombre: p.nombre,
                        precio: Number(p.precio || 0).toFixed(2),
                        reglas: ordenadas.length,
                        resumen,
                    };
                });

                filas.sort((a, b) => b.reglas - a.reglas);

                this.itemsTablaBonos = filas;
                this.dialTablaBonos = true;

                console.log(`Productos con tiene_bono=true: ${filas.length}`);
                console.table(filas);

                return filas;
            } catch (e) {
                console.error('analiza_grupos error:', e);
                this.itemsTablaBonos = [];
                this.dialTablaBonos = true;
                return [];
            }
        },


        mostrarAlertaStock() {
            this.dialogoAlertaStock = true;
        },

        irABonosGlobales() {
            this.$router.push({ name: 'bonos_globales' });
        },

        async cargarBonosGlobalesCache() {
            try {
                const snap = await allBono().once("value");
                const val = typeof snap.val === "function" ? snap.val() : null;

                let arr = [];
                if (Array.isArray(val)) arr = val.filter(Boolean);
                else if (val && typeof val === "object") arr = Object.values(val);

                this.bonosGlobalesCache = arr;
            } catch (e) {
                console.error(e);
                this.bonosGlobalesCache = [];
            }
        },

        obtenerProductoConBonos() {
            return {
                ...this.item_selecto,
                tiene_bono: this.tiene_bono,
                lista_bono: this.lista_bono,
                grupo_precio: this.grupoPrecioSelect,
                grupo_bono: this.grupoBonoSelect,
            };
        },

        async cargarGruposBonos() {
            const snap = await allBono().once("value");
            const val = typeof snap.val === "function" ? snap.val() : null;
            let arr = [];
            if (Array.isArray(val)) arr = val.filter(Boolean);
            else if (val && typeof val === "object") arr = Object.values(val);

            const hoy = new Date();
            const activos = arr.filter(x => {
                if (!x?.activo) return false;
                if (x.fecha_vencimiento && new Date(x.fecha_vencimiento) < hoy) return false;
                return true;
            });
            const precios = activos.filter(x => x?.tipo === "precio");
            const bonos = activos.filter(x => x?.tipo === "bono");

            this.grupoPrecioItems = precios.map(x => ({
                text: `${x.codigo} — ${x.nombre}`,
                value: x.codigo,
                raw: x
            }));

            this.grupoBonoItems = bonos.map(x => ({
                text: `${x.codigo} — ${x.nombre}`,
                value: x.codigo,
                raw: x
            }));
        },

        guardarBonosGlobales() {
            this.dial_bono_global = false;
            this.save(true);
        },

        quitarGrupoPrecio() {
            this.grupoPrecioSelect = null;
        },

        quitarGrupoBono() {
            this.grupoBonoSelect = null;
        },

        formatearFechaSimple(fecha) {
            if (!fecha) return '';
            return new Date(fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },

        obtenerNombreProducto(id) {
            const prod = (store.state.productos || []).find(p => p.id === id);
            return prod ? prod.nombre : `ID: ${id}`;
        },

        filtraStr(item, queryText, itemText) {
            const text = (itemText || item || '').toString()
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const query = (queryText || '').toString()
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return text.includes(query);
        },

        abre_tabla(tipo) {
            this.tipo_tabla = tipo
            this.dial_categorias = !this.dial_categorias
        },
        validaCamposBono() {
            const a = Number(this.apartir_de);
            const c = Number(this.cantidad_bono);

            if (!Number.isFinite(a) || a <= 0) {
                alert('Ingresa un valor válido (> 0) en "A partir de".');
                return false;
            }
            if (!Number.isFinite(c) || c <= 0) {
                alert('Ingresa una "Cantidad bonificación" válida (> 0).');
                return false;
            }
            return true;
        },
        async guardar_bono() {
            try {
                if (!this.validaCamposBono()) return;

                const producto = store.state.productos.find(e => e.id == this.producto_sele);
                if (!producto) {
                    alert("El producto seleccionado no existe.");
                    return;
                }

                this.lista_bono.push({
                    apartir_de: this.apartir_de,
                    cantidad: this.cantidad_bono,
                    cod_producto: this.producto_sele,
                    nom_producto: producto.nombre,
                    precio: 1,
                });

                this.cantidad_bono = null;
                this.producto_sele = null;
                this.dial_adiciona = false;

            } catch (error) {
                console.error("Error al guardar el combo:", error);
            }
        },

        elimina_bono(item) {
            try {
                this.lista_bono = this.lista_bono.filter(combo => combo !== item);
            } catch (error) {
                console.error("Error al eliminar el producto del combo:", error);
            }
        },
        resultado(resultado) {
            this.codbarra = resultado
            this.dialo_escaner = false
        },
        snack(text) {
            this.snackbar = true
            this.text = text
        },
        escanea_qr() {
            if (store.state.esmovil) {
                this.dialo_escaner = true
            }
        },
        obtenordenproducto() {
            store.commit("dialogoprogress")
            this.sumacon = true

            obtenContador().once("value").then((snapshot) => {
                if (!snapshot.exists()) {
                    store.commit("dialogoprogress")
                    alert('Error al obtener contador. Comuníquese con soporte.')
                    this.sumacon = false
                    return
                }

                const idNuevo = snapshot.val().ordenproducto

                const productos = store.state.productos || []
                const existe = productos.some(p => String(p.id) === String(idNuevo))

                if (existe) {
                    store.commit("dialogoprogress")
                    this.sumacon = false
                    alert('Error con ID, comunicarse con soporte')
                    return
                }

                this.id = idNuevo
                this.codbarra = ''
                this.categoria = '1'
                this.nombre = ''
                this.medida = 'UNIDAD'
                this.stock = 1
                this.precio = 0
                this.precio2 = 0
                this.costo = 0
                this.margen = 0
                this.tipoproducto = 'BIEN'
                this.operacion = 'GRAVADA'
                this.icbper = false
                this.lista_bono = []
                this.dialogo = true
                this.activo = true
                this.controstock = true
                this.tiene_bono = false
                this.escala_may1 = 0
                this.precio_may1 = 0
                this.escala_may2 = 0
                this.precio_may2 = 0
                this.proveedor = 0
                this.peso = 0
                this.factor = 1
                this.item_selecto = ''
                this.grupoPrecioSelect = null
                this.grupoBonoSelect = null
                this.marca = ''
                this.obs1 = ''
                this.stock_minimo = 0

                if (Boolean(store.state.configuracion.operacion)) {
                    this.operacion = store.state.configuracion.operacion
                }

                store.commit("dialogoprogress")
            })
        },

        editar(data) {
            console.log(data)
            this.sumacon = false;
            this.item_selecto = data
            this.id = data.id;
            this.activo = data.activo;
            this.codbarra = data.codbarra;
            this.categoria = data.categoria;
            this.proveedor = data.proveedor || '';
            this.nombre = data.nombre;
            this.medida = data.medida;
            this.stock = Number(data.stock);
            this.factor = Number(data.factor) || 1
            this.precio = Number(data.precio);
            this.escala_may1 = Number(data.escala_may1) || 0
            this.precio_may1 = Number(data.precio_may1) || 0
            this.escala_may2 = Number(data.escala_may2) || 0
            this.precio_may2 = Number(data.precio_may2) || 0;
            this.costo = Number(data.costo);
            this.peso = Number(data.peso) || 0
            this.tipodata = data.tipodata;
            this.operacion = data.operacion;
            this.icbper = data.icbper;
            this.controstock = data.controstock;
            this.lista_bono = data.lista_bono || [];
            this.tiene_bono = data.tiene_bono || false;
            this.marca = data.marca || ''
            this.grupoPrecioSelect = data.grupo_precio || null;
            this.grupoBonoSelect = data.grupo_bono || null;
            this.obs1 = data.obs1 || '';
            this.stock_minimo = Number(data.stock_minimo) || 0;

            this.dialogo = true;
        },

        async save(cerrar) {
            if (this.stock == '') {
                this.stock = 0
            }
            if (!this.nombre || this.nombre.trim() === '') {
                alert("Debe seleccionar un nombre")
                return
            }
            if (this.categoria == 1 || this.categoria == '' || !this.categoria) {
                alert("Debe considerar una categoria válida")
                return
            }
            if (this.precio == 0) {
                alert("El precio no puede ser igual a 0")
                return
            }
            const factorNum = Number(this.factor) || 0
            const medidaStr = (this.medida || '').toString().toUpperCase()

            if (factorNum > 1 && medidaStr === 'UNIDAD') {
                alert("Si el factor es mayor a 1, la medida no puede ser UNIDAD. Cambia la medida o el factor.")
                return
            }
            const stockMinimoNum = Number(this.stock_minimo) || 0;
            if (stockMinimoNum < 0) {
                alert("El stock mínimo no puede ser negativo");
                return;
            }
            store.commit("dialogoprogress")
            const tieneGrupoPrecio = !!this.grupoPrecioSelect;

            // si hay grupo de precio global, limpia escalas locales
            if (tieneGrupoPrecio) {
                this.escala_may1 = 0;
                this.precio_may1 = 0;
                this.escala_may2 = 0;
                this.precio_may2 = 0;
            }
            var array = {
                id: this.id,
                activo: this.activo,
                codbarra: this.codbarra,
                nombre: this.nombre.trim(),
                categoria: this.categoria,
                proveedor: this.proveedor || null,
                medida: this.medida,
                stock: this.stock,
                factor: this.factor,
                precio: this.precio,
                escala_may1: this.escala_may1 || 0,
                precio_may1: this.precio_may1 || 0,
                escala_may2: this.escala_may2 || 0,
                precio_may2: this.precio_may2 || 0,
                peso: this.peso || 0,
                costo: this.costo,
                margen: this.margen || 0,
                tipoproducto: this.tipoproducto,
                operacion: this.operacion,
                icbper: this.icbper,
                controstock: this.controstock,
                lista_bono: this.lista_bono,
                tiene_bono: this.tiene_bono,
                editado: moment().unix(),
                marca: this.marca,
                grupo_precio: this.grupoPrecioSelect,
                grupo_bono: this.grupoBonoSelect,
                obs1: this.obs1,
                stock_minimo: Number(this.stock_minimo) || 0
            }
            await nuevoProducto(this.id, array)

            if (this.sumacon == true) {
            //    await this.copiarProductoATodasLasSedes(this.id, array);
                this.sumacontador()
            }
            this.dialogo = cerrar

            store.commit("dialogoprogress")
        },

        async copiarProductoATodasLasSedes(id, producto) {
            try {
                const sedes = store.state.array_sedes || [];
                const bdActual = store.state.baseDatos.bd;
                const otrasSedes = sedes.filter(s => s.tipo === 'sede' && s.base !== bdActual);
                const promesas = otrasSedes.map(sede => {
                    const productoConStock0 = { ...producto, stock: 0 };
                    return nuevoProductoOtraBase(sede.base, id, productoConStock0);
                });

                if (promesas.length > 0) {
                    await Promise.all(promesas);
                    console.log(`Producto ${id} copiado a ${promesas.length} sedes con stock 0`);
                }
            } catch (error) {
                console.error('Error copiando producto a otras sedes:', error);
            }
        },

        async eliminar() {
            if (confirm('seguro de eliminar?')) {
                await eliminaProducto(this.id)
                this.id = ''
                this.dialogoElimina = false
                this.dialogo = false
            }

        },
        sumacontador() {
            sumaContador("ordenproducto", parseInt(this.id) + 1)
        },
        subirXLS() {
            this.$router.push({
                name: "ImportaExporta"
            })
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        cerrarYActualizarCategorias() {
            this.dial_categorias = false;
            this.actualizaCategorias();
        },
        actualizaCategorias() {
            this.arraycategoria = [];
            this.arraycategoria_f = ['TODOS'];
            allCategorias('categorias').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.arraycategoria.push(nombre);
                    this.arraycategoria_f.push(nombre);
                });
            });
            allCategorias('marcas').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.array_marca.push(nombre);

                });
            });

            allCategorias('proveedor').once("value").then((snapshot) => {
                snapshot.forEach((item) => {
                    const nombre = item.val().nombre;
                    this.arrayproveedor.push(nombre);

                });
            });
        },
        Procesa() {
            var array = this.desserts
            var hash = [];
            var categoria = array.filter(function (current) {
                var exists = !hash[current.categoria]
                hash[current.categoria] = true
                return exists
            });
            this.sumatutilidad(categoria, array)
        },
        sumatutilidad(categoria, array) {
            let suma = []

            console.log(categoria)
            for (var i = 0; i < categoria.length; i++) {
                var cant = 0
                var cost = 0
                var pre = 0
                for (var e = 0; e < array.length; e++) {
                    if (categoria[i].categoria == array[e].categoria) {
                        if (!isNaN(parseFloat(array[e].costo))) {
                            cost = cost + (parseFloat(array[e].costo) * parseFloat(array[e].stock))
                        }
                        if (!isNaN(array[e].precio)) {
                            pre = pre + (parseFloat(array[e].precio) * parseFloat(array[e].stock))
                        }
                        cant = cant + parseFloat(array[e].stock)
                    }
                }
                suma.push({
                    categoria: categoria[i].categoria,
                    cantidad: this.redondear(cant),
                    costo: this.redondear(cost),
                    precio: this.redondear(pre)
                });
            }

            this.arrayConsolidar = suma
            this.sumatotal(suma)

        },
        sumatotal(suma) {

            let sumatotal = []
            var totalcantidad = 0
            var totalcosto = 0
            var totalprecio = 0
            for (var e = 0; e < suma.length; e++) {
                totalcantidad = totalcantidad + parseFloat(suma[e].cantidad)
                totalcosto = totalcosto + parseFloat(suma[e].costo)
                totalprecio = totalprecio + parseFloat(suma[e].precio)
            }
            sumatotal = {
                cantidad: this.redondear(totalcantidad),
                costo: this.redondear(totalcosto),
                precio: this.redondear(totalprecio)
            };
            this.arrayConsolidartotal = sumatotal
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        convierte_stock(stock, factor) {
            const s = Number(stock);
            const f = Number(factor);

            if (!Number.isFinite(f) || f <= 1) return String(stock);

            if (!Number.isFinite(s)) return String(stock);

            const cajas = Math.floor(s / f);
            const und = s - cajas * f;
            return `${cajas}/${und}`;
        },
        print_codbarra() {
            const producto = this.item_selecto && this.item_selecto.id
                ? this.item_selecto
                : {
                    id: this.id,
                    nombre: this.nombre,
                    codbarra: this.codbarra,
                    precio: this.precio,
                    medida: this.medida,
                    marca: this.marca,
                };

            imprime_codbarra(producto, {
                formato: "58x30",
                copias: 1,
                mostrarNombre: false,
                mostrarPrecio: false,
                barWidth: 1
            });
        },

        abrirNuevoBonoDesdeProductos(tipo) {
            this.tipoBonoActual = tipo;
            this.editandoBonoProductos = false;
            this.bonoSeleccionadoProductos = {
                tipo: tipo,
                activo: true,
                nombre: '',
                observacion: '',
                proveedor: null,
                fecha_vencimiento: null,
                ...(tipo === 'precio' ? {
                    escala_may1: null,
                    precio_may1: null,
                    escala_may2: null,
                    precio_may2: null
                } : {
                    data: []
                })
            };
            this.dial_bono_productos = true;
        },

        editarBonoDesdeProductos(bono) {
            this.tipoBonoActual = bono.tipo;
            this.editandoBonoProductos = true;
            this.bonoSeleccionadoProductos = { ...bono };
            this.dial_bono_productos = true;
        },

        async guardarBonoDesdeProductos(bonoData) {
            if (!bonoData.nombre?.trim()) {
                store.commit("dialogosnackbar", "Escribe un nombre para el bono.");
                return;
            }

            store.commit("dialogoprogress");

            try {
                const { nuevoBono } = await import('../../db');
                let codigo;
                if (this.editandoBonoProductos && this.bonoSeleccionadoProductos.codigo) {
                    codigo = this.bonoSeleccionadoProductos.codigo;
                } else {
                    codigo = this._generarCodigoBono(bonoData.tipo);
                }

                const payload = {
                    ...bonoData,
                    codigo: codigo,
                    creado: this.editandoBonoProductos ? (this.bonoSeleccionadoProductos.creado || Date.now()) : Date.now(),
                    usuario: store?.state?.usuario || null,
                };

                await nuevoBono(codigo, payload);
                if (bonoData.tipo === 'precio') {
                    this.grupoPrecioSelect = codigo;
                } else {
                    this.grupoBonoSelect = codigo;
                }
                await this.cargarBonosGlobalesCache();
                await this.cargarGruposBonos();

                store.commit("dialogosnackbar", "Bono guardado y asignado correctamente");
                this.dial_bono_productos = false;

            } catch (e) {
                console.error('Error guardando bono:', e);
                store.commit("dialogosnackbar", "Error al guardar el bono");
            } finally {
                store.commit("dialogoprogress");
            }
        },

        _generarCodigoBono(tipo) {
            const prefix = tipo === 'precio' ? 'P' : 'B';
            const existentes = this.bonosGlobalesCache
                .filter(b => b.tipo === tipo && typeof b.codigo === 'string')
                .map(b => {
                    const match = b.codigo.match(/^[PB](\d+)$/i);
                    return match ? Number(match[1]) : 0;
                })
                .filter(n => Number.isFinite(n));
            const max = existentes.length ? Math.max(...existentes) : 0;
            return `${prefix}${String(max + 1).padStart(5, '0')}`;
        },

        abrirVisorProductos(bono) {
            this.bonoParaVisor = bono;
            this.dialVisorProductos = true;
        },

        onProductoAgregado(producto) {
            this.cargarBonosGlobalesCache();
        },

        onProductoQuitado(producto) {
            this.cargarBonosGlobalesCache();
        },


    },

}
</script>
<style scoped>
.mobile-list .scroller {
    height: calc(100vh - 320px);
    overflow: auto;
}

.item-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .08);
    padding: 8px 12px;
    margin: 5px 8px;
    min-height: 68px;
}

.item-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
}

.item-sub {
    font-size: 11px;
    color: #777;
    margin-top: 1px;
}

.item-meta {
    font-size: 12px;
    margin-top: 1px;
}

.mobile-list .scroller {
    height: 65dvh;
    overflow: auto;
}

.mobile-card {
    height: 70dvh;
}

.lh-tight {
    line-height: 1.1 !important;
}

.lh-1 {
    line-height: 1 !important;
}

.border-orange {
    border: 1px solid #FF9800 !important;
}

.border-blue {
    border: 1px solid #2196F3 !important;
}

.border-blue-light {
    border: 1px solid #bbdefb !important;
}

.border-bottom-dashed {
    border-bottom: 1px dashed #eee;
}

.border-bottom-subtle {
    border-bottom: 1px solid #e3f2fd;
}
</style>