<template>
    <v-dialog v-model="dial" persistent fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-card>
            <v-system-bar dense window dark height="40" color="teal darken-2">
                <v-icon @click="cerrar" color="red lighten-2">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h4>
                    <v-icon left small>mdi-truck-cargo-container</v-icon>
                    Carga de Productos - Reparto #{{ grupo }}
                </h4>
                <v-spacer></v-spacer>
                <v-btn small color="success" depressed @click="guardarCarga" :loading="guardando"
                    :disabled="!puedeGuardar">
                    <v-icon left small>mdi-content-save</v-icon>
                    Guardar
                </v-btn>
            </v-system-bar>

            <v-tabs v-model="tabActivo" background-color="teal lighten-5" color="teal darken-2" grow>
                <v-tab>
                    <v-icon left small>mdi-package-variant-closed</v-icon>
                    Alistar Prod.
                    <v-chip x-small class="ml-2"
                        :color="productosListos === productosConsolidados.length ? 'success' : 'warning'" dark>
                        {{ productosListos }}/{{ productosConsolidados.length }}
                    </v-chip>
                </v-tab>
                <v-tab>
                    <v-icon left small>mdi-qrcode-scan</v-icon>
                    Verificar
                    <v-chip x-small class="ml-2"
                        :color="boletasVerificadas === pedidosOrdenados.length ? 'success' : 'warning'" dark>
                        {{ boletasVerificadasFiltradas }}/{{ pedidosFiltradosVerificacion.length }}

                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tabActivo">
                <v-tab-item>
                    <v-card flat class="pa-3 pa-md-4">
                        <v-card outlined class="mb-4 pa-3">
                            <div class="d-flex align-center justify-space-between mb-2">
                                <span class="font-weight-medium">Progreso de Alistado</span>
                                <span class="caption">
                                    {{ productosListos }} / {{ productosConsolidados.length }} productos listos
                                </span>
                            </div>
                            <v-progress-linear :value="porcentajeAlistado" height="20" rounded
                                :color="porcentajeAlistado === 0 ? 'grey' : colorProgresoAlistado" class="mb-2">
                                <template v-slot:default>
                                    <strong class="white--text">{{ porcentajeAlistado.toFixed(2) }}%</strong>
                                </template>
                            </v-progress-linear>
                            <v-divider class="my-2"></v-divider>
                            <v-row dense class="text-caption">
                                <v-col cols="6">
                                    <strong>PESO TOTAL (KG):</strong> {{ pesoTotalPedido.toFixed(2) }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>PESO ALISTADO (KG):</strong>
                                    <span :class="pesoCargado > pesoTotalPedido ? 'error--text' : 'success--text'">
                                        {{ pesoCargado.toFixed(2) }}
                                    </span>
                                </v-col>
                            </v-row>
                        </v-card>

                        <v-row dense class="mb-3">
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field v-model="busqueda" outlined dense hide-details clearable
                                    prepend-inner-icon="mdi-magnify" placeholder="Buscar producto..."
                                    @input="filtrarProductos">
                                </v-text-field>
                            </v-col>
                            <v-col cols="6" sm="3" md="2">
                                <v-select v-model="filtroEstado" :items="opcionesEstado" outlined dense hide-details
                                    label="Estado" @change="filtrarProductos">
                                </v-select>
                            </v-col>
                            <v-col cols="6" sm="3" md="2">
                                <v-btn block color="teal" dark small @click="marcarTodosListos" :disabled="todosListos">
                                    <v-icon left small>mdi-check-all</v-icon>
                                    Marcar Todos
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-card outlined v-if="!isMobile">
                            <v-data-table :headers="headers" :items="productosFiltrados" :items-per-page="15" dense
                                class="elevation-0" :item-class="getRowClass" item-key="key_unico">

                                <template v-slot:[`header.seleccionar`]>
                                    <v-checkbox :input-value="todosSeleccionados"
                                        :indeterminate="algunosSeleccionados && !todosSeleccionados"
                                        @change="toggleSeleccionarTodos" dense hide-details class="ma-0 pa-0">
                                    </v-checkbox>
                                </template>

                                <template v-slot:[`item.seleccionar`]="{ item }">
                                    <v-checkbox :input-value="item.cantidad_subida === item.cantidad_total"
                                        @change="toggleAlistarItem(item, $event)" :disabled="item.bloqueado" dense
                                        hide-details class="ma-0 pa-0">
                                    </v-checkbox>
                                </template>

                                <template v-slot:[`item.bloqueado`]="{ item }">
                                    <v-icon v-if="item.bloqueado" small color="info">mdi-lock</v-icon>
                                </template>

                                <template v-slot:[`item.producto`]="{ item }">
                                    <div class="font-weight-medium">{{ item.codigo }} - {{ item.nombre }}</div>
                                </template>

                                <template v-slot:[`item.cantidad_total`]="{ item }">
                                    <v-chip small outlined class="primary--text"
                                        style="border-color: var(--v-primary-base);">
                                        {{ item?.cantidad_total || '' }} {{ item?.medida || '' }}
                                    </v-chip>

                                </template>

                                <template v-slot:[`item.peso_total`]="{ item }">
                                    <span class="text-caption">
                                        {{ formatPeso(item.peso_linea) }}
                                    </span>
                                </template>

                                <template v-slot:[`item.cantidad_subida`]="{ item }">
                                    <div class="d-flex align-center justify-center">
                                        <v-btn icon x-small color="error" @click="decrementarCantidad(item)"
                                            :disabled="item.bloqueado || item.cantidad_subida <= 0">
                                            <v-icon small>mdi-minus</v-icon>
                                        </v-btn>
                                        <v-text-field v-model.number="item.cantidad_subida" type="number" outlined dense
                                            hide-details style="max-width: 70px;" :min="0"
                                            @keydown="e => e.key === '-' && e.preventDefault()"
                                            @input="onCantidadChange(item)" :disabled="item.bloqueado"
                                            :error="item.cantidad_subida > item.cantidad_total"
                                            :success="item.cantidad_subida === item.cantidad_total"
                                            :background-color="getInputBgColor(item)" class="mx-1 centered-input" />
                                        <v-btn icon x-small color="success" @click="incrementarCantidad(item)"
                                            :disabled="item.bloqueado">
                                            <v-icon small>mdi-plus</v-icon>
                                        </v-btn>
                                    </div>
                                </template>

                                <template v-slot:[`item.estado`]="{ item }">
                                    <v-chip x-small :color="getEstadoColor(item)" dark>
                                        <v-icon x-small left>{{ getEstadoIcon(item) }}</v-icon>
                                        {{ getEstadoTexto(item) }}
                                    </v-chip>
                                </template>

                                <template v-slot:[`item.clientes`]="{ item }">
                                    <v-btn small color="indigo" dark text @click="abrirDialogClientes(item)">
                                        {{ item.pedidos.length }}
                                        <v-icon small right>mdi-eye</v-icon>
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </v-card>

                        <div v-else>
                            <v-card v-for="item in productosFiltrados" :key="item.key_unico" flat outlined
                                class="mb-2 rounded-lg border-2"
                                :class="item.cantidad_subida === item.cantidad_total ? 'success-border' : getRowClass(item)">

                                <v-card-text class="pa-2">
                                    <div class="d-flex align-start mb-1">
                                        <v-checkbox :input-value="item.cantidad_subida === item.cantidad_total"
                                            @change="toggleAlistarItem(item, $event)" :disabled="item.bloqueado" dense
                                            hide-details class="ma-0 pa-0 pt-1 mr-2" color="success"></v-checkbox>

                                        <div class="flex-grow-1" style="min-width: 0;">
                                            <div
                                                class="text-subtitle-2 font-weight-black line-height-tight text-truncate text-uppercase">
                                                {{ item.nombre }}
                                            </div>
                                            <div class="d-flex align-center mt-1">
                                                <v-chip x-small label outlined color="grey darken-1"
                                                    class="mr-1 font-weight-bold">{{
                                                    item.codigo }}</v-chip>
                                                <v-chip x-small label color="grey lighten-4"
                                                    class="grey--text text--darken-2">{{ item.medida
                                                    }}</v-chip>
                                                <v-icon v-if="item.bloqueado" x-small color="grey"
                                                    class="ml-1">mdi-lock</v-icon>
                                            </div>
                                        </div>

                                        <v-chip x-small :color="getEstadoColor(item)" class="ml-1 px-1 font-weight-bold"
                                            dark>
                                            {{ getEstadoTexto(item) }}
                                        </v-chip>
                                    </div>

                                    <v-row no-gutters align="center" class="bg-light rounded-pill pa-1 mt-2">
                                        <v-col cols="3" class="text-center border-right">
                                            <div class="text-overline grey--text lh-1">REQ.</div>
                                            <div class="text-body-2 font-weight-black primary--text">{{
                                                item.cantidad_total }}</div>
                                        </v-col>

                                        <v-col cols="6" class="d-flex align-center justify-center">
                                            <v-btn icon small color="error" class="grey lighten-4"
                                                @click="decrementarCantidad(item)"
                                                :disabled="item.bloqueado || item.cantidad_subida <= 0">
                                                <v-icon>mdi-minus</v-icon>
                                            </v-btn>

                                            <input v-model.number="item.cantidad_subida" type="number"
                                                class="mx-2 text-center font-weight-black text-h6"
                                                style="width: 45px; border: none; background: transparent; outline: none;"
                                                @input="onCantidadChange(item)" :disabled="item.bloqueado" />

                                            <v-btn icon small color="success" class="grey lighten-4"
                                                @click="incrementarCantidad(item)" :disabled="item.bloqueado">
                                                <v-icon>mdi-plus</v-icon>
                                            </v-btn>
                                        </v-col>

                                        <v-col cols="3" class="text-center border-left"
                                            @click="abrirDialogClientes(item)">
                                            <div class="text-overline grey--text lh-1">PEDS.</div>
                                            <div class="d-flex align-center justify-center">
                                                <span class="text-body-2 font-weight-bold indigo--text">{{
                                                    item.pedidos.length }}</span>
                                                <v-icon x-small color="indigo" class="ml-1">mdi-eye-outline</v-icon>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-card>
                </v-tab-item>

                <v-tab-item>
                    <v-card flat class="pa-3 pa-md-4">
                        <v-card flat class="rounded-xl mb-3 grey lighten-5 border-thin">
                            <v-card-text class="pa-3">
                                <v-row no-gutters align="center">
                                    <v-col>
                                        <div class="d-flex align-end">
                                            <span class="text-h4 font-weight-black success--text line-height-1">{{
                                                boletasVerificadas
                                                }}</span>
                                            <span class="text-h6 grey--text mx-1">/</span>
                                            <span class="text-h6 grey--text text--darken-1">{{ pedidosOrdenados.length
                                                }}</span>
                                        </div>
                                        <div class="text-caption grey--text font-weight-bold text-uppercase">Progreso
                                            Total</div>
                                    </v-col>
                                    <v-col class="text-right">
                                        <v-progress-circular :value="porcentajeVerificacion"
                                            :color="porcentajeVerificacion === 100 ? 'success' : 'warning'" size="50"
                                            width="6">
                                            <span class="caption font-weight-bold">{{ Math.round(porcentajeVerificacion)
                                                }}%</span>
                                        </v-progress-circular>
                                    </v-col>
                                </v-row>

                                <v-progress-linear :value="porcentajeVerificacion" height="6" rounded
                                    :color="porcentajeVerificacion === 100 ? 'success' : 'warning'"
                                    class="mt-3"></v-progress-linear>
                            </v-card-text>
                        </v-card>

                        <v-card flat outlined class="rounded-xl pa-3 mb-4">
                            <v-row dense align="center" class="mb-2">
                                <v-col cols="8">
                                    <div class="d-flex align-center">
                                        <v-icon color="teal" small class="mr-1">mdi-qrcode-scan</v-icon>
                                        <span class="text-subtitle-2 font-weight-bold">Verificación Rápida</span>
                                    </div>
                                </v-col>
                                <v-col cols="4">
                                    <v-select v-model="filtroVerificacion" :items="opcionesVerificacion" dense
                                        hide-details flat solo-inverted background-color="grey lighten-4"
                                        class="compact-select" />
                                </v-col>
                            </v-row>

                            <v-row dense>
                                <v-col cols="12">
                           <v-autocomplete
  v-model="codigoEscaneado"
  :items="correlativosFiltrados"
  outlined
  rounded
  dense
  class="rounded-pill custom-input"
  hide-details
  :loading="buscandoComprobante"
  :placeholder="tipoDocSeleccionado === 'todos' ? 'Serie-Correlativo' : 'Ingrese número'"
  @keyup.enter="buscarComprobante"
  ref="inputEscaner"
  :append-icon="''"
>
  <template v-slot:prepend-inner>
    <v-menu offset-y transition="scale-transition">
      <template v-slot:activator="{ on, attrs }">
        <v-btn small depressed color="primary" class="rounded-lg mr-2" v-bind="attrs" v-on="on">
          {{ tipoDocSeleccionado === 'todos' ? '*' : tipoDocSeleccionado }}
          <v-icon x-small right>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list dense>
        <v-list-item v-for="tipo in tiposDocumento" :key="tipo.value" @click="seleccionarTipoDoc(tipo.value)">
          <v-list-item-title class="caption font-weight-bold">{{ tipo.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </template>

  <template v-slot:append-outer>
    <v-btn icon small class="mt-n1" color="indigo" @click="abrirCamara" :disabled="buscandoComprobante">
      <v-icon>mdi-barcode-scan</v-icon>
    </v-btn>
  </template>
</v-autocomplete>
                                </v-col>

                                <v-col cols="12" v-if="codigoEscaneado" class="mt-2 animate-fade-in">
                                    <v-btn block color="teal font-weight-bold" dark depressed rounded height="45"
                                        @click="buscarComprobante" :loading="buscandoComprobante">
                                        <v-icon left>mdi-magnify</v-icon>
                                        Buscar Comprobante
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-card>

                        <v-row dense>
                            <v-col v-for="(pedido, idx) in pedidosFiltradosVerificacion" :key="pedido.numeracion"
                                cols="12" sm="6" md="4">
                                <v-card outlined class="rounded-lg mb-1" :class="getCardClassPedido(pedido, idx)">
                                    <v-card-text class="pa-2">
                                        <v-row no-gutters align="center">
                                            <v-avatar
                                                :color="pedido.verificado ? 'success' : (idx === 0 ? 'info' : 'grey lighten-2')"
                                                size="24" class="mr-2 white--text font-weight-bold text-caption">
                                                {{ idx + 1 }}
                                            </v-avatar>

                                            <v-col class="text-truncate">
                                                <div class="text-subtitle-2 font-weight-black text-truncate mb-n1">
                                                    {{ pedido.cliente }}
                                                </div>
                                                <span class="text-caption grey--text font-weight-medium">
                                                    {{ formatSerieCorrelativo(pedido.serie, pedido.correlativo) }}
                                                </span>
                                            </v-col>

                                            <v-icon v-if="pedido.verificado" color="success">mdi-check-decagram</v-icon>
                                            <v-icon v-else-if="!puedeVerificarPedido(pedido)"
                                                color="warning">mdi-alert-circle-outline</v-icon>
                                        </v-row>

                                        <v-row no-gutters align="center" class="mt-2">
                                            <div class="d-flex align-center grey--text text--darken-1 mr-3">
                                                <v-icon x-small class="mr-1">mdi-package-variant-closed</v-icon>
                                                <span class="text-caption font-weight-bold">{{ pedido.productos.length
                                                }} SKU</span>
                                            </div>

                                            <v-spacer></v-spacer>

                                            <v-chip v-if="pedido.verificado" x-small color="success lighten-5"
                                                class="success--text font-weight-bold">
                                                VERIFICADO
                                            </v-chip>
                                            <v-chip v-else-if="!puedeVerificarPedido(pedido)" x-small
                                                color="warning lighten-5" class="warning--text font-weight-bold">
                                                INCOMPLETO
                                            </v-chip>
                                            <v-chip v-else x-small color="grey lighten-4"
                                                class="grey--text text--darken-2">
                                                PENDIENTE
                                            </v-chip>
                                        </v-row>
                                    </v-card-text>

                                    <v-card-actions class="pa-2 pt-0">
                                        <v-btn x-small text color="primary" class="text-none"
                                            @click="abrirDialogPedido(pedido)">
                                            <v-icon left x-small>mdi-magnify</v-icon>Detalles
                                        </v-btn>
                                        <v-spacer></v-spacer>
                                        <v-btn v-if="!pedido.verificado && puedeVerificarPedido(pedido)" x-small
                                            color="success" depressed class="text-none rounded-md px-3"
                                            @click="verificarPedidoManual(pedido)">
                                            <v-icon left x-small>mdi-check</v-icon>Verificar
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-tab-item>
            </v-tabs-items>
        </v-card>

        <v-dialog v-model="dialogClientes" max-width="450" scrollable>
            <v-card v-if="productoActual">
                <v-toolbar dense flat color="indigo" dark>
                    <v-toolbar-title class="text-body-2">
                        {{ productoActual.nombre }} - {{ productoActual.medida }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogClientes = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-subtitle class="py-2">
                    <v-chip small color="primary" class="mr-2">
                        Total: {{ productoActual.cantidad_total }} {{ productoActual.medida }}
                    </v-chip>
                </v-card-subtitle>

                <v-divider></v-divider>

                <v-card-text class="pa-0">
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th class="text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="pedido in productoActual.pedidos" :key="pedido.key_pedido">
                                <td class="text-caption">{{ pedido.cliente_nombre }}</td>
                                <td class="text-right">
                                    <strong>{{ pedido.cantidad }}</strong> {{ productoActual.medida }}
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text color="grey" @click="dialogClientes = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogPedido" max-width="600" scrollable>
            <v-card v-if="pedidoActual">
                <v-toolbar dense flat :color="pedidoActual.verificado ? 'success' : 'indigo'" dark>
                    <v-icon left>mdi-receipt</v-icon>
                    <v-toolbar-title class="text-body-2">
                        {{ formatSerieCorrelativo(pedidoActual.serie, pedidoActual.correlativo) }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-chip v-if="pedidoActual.verificado" small color="white" text-color="success">
                        <v-icon small left>mdi-check-circle</v-icon> VERIFICADO
                    </v-chip>
                    <v-btn icon @click="dialogPedido = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-subtitle class="py-2">
                    <div class="d-flex align-center">
                        <v-icon small class="mr-1">mdi-account</v-icon>
                        <strong>{{ pedidoActual.cliente }}</strong>
                    </div>
                    <div class="text-caption grey--text mt-1">
                        Pedido ID: {{ pedidoActual.id_pedido }}
                    </div>
                </v-card-subtitle>

                <v-divider></v-divider>

                <v-card-text class="pa-0">
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(prod, i) in pedidoActual.productos" :key="i">
                                <td>
                                    <div class="text-caption font-weight-medium">{{ prod.nombre }}</div>
                                    <div class="text-caption grey--text">{{ prod.codigo }}</div>
                                </td>
                                <td class="text-center">
                                    <strong>{{ prod.cantidad }}</strong> {{ prod.medida }}
                                </td>
                                <td class="text-center">
                                    <v-icon small :color="productoEstaListo(prod) ? 'success' : 'warning'">
                                        {{ productoEstaListo(prod) ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                                    </v-icon>
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn text color="grey" @click="dialogPedido = false">Cerrar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn v-if="!pedidoActual.verificado" color="success" depressed
                        :disabled="!puedeVerificarPedido(pedidoActual)" @click="confirmarVerificacion">
                        <v-icon left>mdi-check</v-icon>
                        Verificar Boleta
                    </v-btn>
                    <v-btn v-else color="warning" text @click="desverificarPedido">
                        <v-icon left small>mdi-undo</v-icon>
                        Desverificar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogErrorBoleta" max-width="400">
            <v-card>
                <v-card-title class="error white--text py-3">
                    <v-icon left color="white">mdi-alert-circle</v-icon>
                    BOLETA NO CORRESPONDE
                </v-card-title>
                <v-card-text class="pa-4 text-center">
                    <div class="mb-3">
                        <div class="text-caption grey--text">Escaneado:</div>
                        <div class="text-h6 font-weight-bold">{{ codigoEscaneado }}</div>
                    </div>
                    <v-divider class="my-3"></v-divider>
                    <div class="mb-3">
                        <div class="text-caption grey--text">Este reparto:</div>
                        <div class="text-h6 font-weight-bold teal--text">#{{ grupo }}</div>
                    </div>
                    <div v-if="errorBoletaInfo.reparto">
                        <div class="text-caption grey--text">Esta boleta pertenece al reparto:</div>
                        <div class="text-h6 font-weight-bold error--text">#{{ errorBoletaInfo.reparto }}</div>
                    </div>
                    <div v-else>
                        <div class="text-caption error--text">{{ errorBoletaInfo.mensaje }}</div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialogErrorBoleta = false; codigoEscaneado = ''">
                        OK
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogCamara" max-width="400" persistent>
            <v-card>
                <v-toolbar dense flat color="indigo" dark>
                    <v-toolbar-title>Escanear QR</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="cerrarCamara">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text class="pa-0 text-center" style="background: #000; position: relative;">
                    <video ref="videoQR" style="width: 100%; max-height: 300px; object-fit: cover;" autoplay playsinline
                        muted></video>
                    <canvas ref="canvasQR" style="display: none;"></canvas>
                    <div v-if="!cargandoCamara" class="qr-overlay">
                        <div class="qr-frame"></div>
                    </div>
                    <div v-if="cargandoCamara" class="pa-4"
                        style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                        <v-progress-circular indeterminate color="white" size="50"></v-progress-circular>
                        <div class="white--text mt-2">Iniciando cámara...</div>
                    </div>
                </v-card-text>
                <v-card-text class="pa-2 text-center">
                    <span class="caption grey--text">Apunte al código QR del comprobante</span>
                </v-card-text>
                <v-card-actions>
                    <v-btn block color="grey" text @click="cerrarCamara">Cancelar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogAdvertenciaGuardar" max-width="500">
            <v-card>
                <v-card-title class="warning white--text py-3">
                    <v-icon left color="white">mdi-alert</v-icon>
                    Carga Incompleta
                </v-card-title>
                <v-card-text class="pa-4">
                    <div v-if="productosListos < productosConsolidados.length" class="mb-3">
                        <v-icon color="warning" class="mr-2">mdi-package-variant</v-icon>
                        <strong>{{ productosConsolidados.length - productosListos }}</strong> productos sin alistar
                        completamente
                    </div>
                    <div v-if="boletasVerificadas < pedidosOrdenados.length" class="mb-3">
                        <v-icon color="warning" class="mr-2">mdi-receipt</v-icon>
                        <strong>{{ pedidosFiltradosVerificacion.length - boletasVerificadasFiltradas }}</strong> boletas
                        sin
                        verificar
                    </div>
                    <v-alert dense text type="info" class="mt-3">
                        Debe completar el alistado de todos los productos y verificar todas las boletas antes de
                        guardar.
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialogAdvertenciaGuardar = false">Entendido</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
        </v-snackbar>
    </v-dialog>
</template>

<script>
import { db, all_Cabecera_p, all_detalle_p, allProductoOtraBase } from '@/db';
import store from '@/store/index';
import moment from 'moment';
import jsQR from 'jsqr';

export default {
    name: 'DialCargaProductos',
    props: {
        grupo: {
            type: [String, Number],
            required: true
        }
    },
    data() {
        return {
            dial: true,
            tabActivo: 0,
            busqueda: '',
            filtroEstado: 'todos',
            opcionesEstado: [
                { text: 'Todos', value: 'todos' },
                { text: 'Listos', value: 'listo' },
                { text: 'Parciales', value: 'parcial' },
                { text: 'Pendientes', value: 'pendiente' },
                { text: 'Bloqueados', value: 'bloqueado' }
            ],
            productosConsolidados: [],
            productosFiltrados: [],
            productosStock: {},
            pedidosOrdenados: [],
            guardando: false,
            snackbar: false,
            snackbarText: '',
            snackbarColor: 'success',
            dialogClientes: false,
            dialogPedido: false,
            dialogErrorBoleta: false,
            dialogCamara: false,
            dialogAdvertenciaGuardar: false,
            productoActual: null,
            pedidoActual: null,
            cargaExistente: null,
            codigoEscaneado: '',
            buscandoComprobante: false,
            errorBoletaInfo: { reparto: null, mensaje: '' },
            videoStream: null,
            cargandoCamara: false,
            scanInterval: null,
            canvasQR: null,
            headers: [
                { text: '', value: 'seleccionar', width: '30px', sortable: false },
                { text: '', value: 'bloqueado', width: '25px', sortable: false },
                { text: 'Producto', value: 'producto', width: '300px', align: 'start' },
                { text: 'Requerido', value: 'cantidad_total', align: 'center', width: '80px' },
                { text: 'Alistado', value: 'cantidad_subida', align: 'center', width: '120px' },
                { text: 'Peso (kg)', value: 'peso_total', align: 'center', width: '60px' },
                { text: 'Estado', value: 'estado', align: 'start', width: '80px' },
                { text: 'Pedidos', value: 'clientes', align: 'start', width: '60px', sortable: false }
            ],
            tipoDocSeleccionado: 'todos',
            tiposDocumento: [
                { text: 'Todos', value: 'todos' },
                { text: 'Ticket', value: 'T' },
                { text: 'Factura', value: 'F' },
                { text: 'Boleta', value: 'B' }
            ],
            correlativosFiltrados: [],
            filtroVerificacion: 'todos',
            opcionesVerificacion: [
                { text: 'Todos', value: 'todos' },
                { text: 'Verificados', value: 'verificados' },
                { text: 'Pendientes', value: 'pendientes' },
            ],
        };
    },
    computed: {
        boletasVerificadasFiltradas() {
            return this.pedidosFiltradosVerificacion.filter(p => p.verificado).length;
        },
        porcentajeVerificacionFiltrado() {
            const total = this.pedidosFiltradosVerificacion.length;
            if (!total) return 0;
            return (this.boletasVerificadasFiltradas / total) * 100;
        },

        pedidosFiltradosVerificacion() {
            if (this.filtroVerificacion === 'verificados') {
                return this.pedidosOrdenados.filter(p => p.verificado);
            }
            if (this.filtroVerificacion === 'pendientes') {
                return this.pedidosOrdenados.filter(p => !p.verificado);
            }
            return this.pedidosOrdenados;
        },

        isMobile() {
            return this.$vuetify?.breakpoint?.smAndDown || false;
        },
        productosListos() {
            return this.productosConsolidados.filter(p => p.cantidad_subida === p.cantidad_total).length;
        },
        productosParciales() {
            return this.productosConsolidados.filter(p =>
                p.cantidad_subida > 0 && p.cantidad_subida < p.cantidad_total
            ).length;
        },
        productosPendientes() {
            return this.productosConsolidados.filter(p =>
                !p.cantidad_subida || p.cantidad_subida === 0
            ).length;
        },
        porcentajeAlistado() {
            if (!this.productosConsolidados.length) return 0;
            return (this.productosListos / this.productosConsolidados.length) * 100;
        },
        colorProgresoAlistado() {
            if (this.porcentajeAlistado >= 100) return 'success';
            if (this.porcentajeAlistado >= 50) return 'warning';
            return 'error';
        },
        todosListos() {
            return this.productosConsolidados.every(p => p.cantidad_subida === p.cantidad_total);
        },
        pesoTotalPedido() {
            return this.productosConsolidados.reduce((sum, p) => sum + (p.peso_linea || 0), 0);
        },
        pesoCargado() {
            return this.productosConsolidados.reduce((sum, p) => {
                const ratio = p.cantidad_total > 0 ? (p.cantidad_subida || 0) / p.cantidad_total : 0;
                return sum + ((p.peso_linea || 0) * ratio);
            }, 0);
        },
        boletasVerificadas() {
            return this.pedidosOrdenados.filter(p => p.verificado).length;
        },
        porcentajeVerificacion() {
            if (!this.pedidosOrdenados.length) return 0;
            return (this.boletasVerificadas / this.pedidosOrdenados.length) * 100;
        },
        puedeGuardar() {
            return this.todosListos && this.boletasVerificadas === this.pedidosOrdenados.length;
        },
        todosSeleccionados() {
            if (!this.productosFiltrados.length) return false;
            return this.productosFiltrados.every(item =>
                item.bloqueado || item.cantidad_subida === item.cantidad_total
            );
        },
        algunosSeleccionados() {
            return this.productosFiltrados.some(item =>
                !item.bloqueado &&
                item.cantidad_subida > 0 &&
                item.cantidad_subida < item.cantidad_total
            );
        }
    },
    async created() {
        await this.cargarDatos();
    },
    methods: {
        async cargarDatos() {
            try {
                store.commit('dialogoprogress', true);

                const snapStock = await allProductoOtraBase(store.state.baseDatos.bd).once('value');
                if (snapStock.exists()) {
                    const prods = snapStock.val();
                    Object.keys(prods).forEach(id => {
                        this.productosStock[id] = {
                            stock: Number(prods[id].stock || 0),
                            peso: Number(prods[id].peso || 0)
                        };
                    });
                }

                const snapCarga = await db.database()
                    .ref(store.state.baseDatos.bd)
                    .child('pedidos')
                    .child('carga_reparto')
                    .child(this.grupo)
                    .once('value');

                if (snapCarga.exists()) {
                    this.cargaExistente = snapCarga.val();
                }

                const snapCab = await all_Cabecera_p(this.grupo).once('value');
                if (!snapCab.exists()) {
                    this.mostrarMsg('No se encontraron pedidos', 'error');
                    return;
                }

                const cabeceras = [];
                snapCab.forEach(child => {
                    const cab = child.val();
                    cab.numeracion = child.key;
                    cabeceras.push(cab);
                });

                cabeceras.sort((a, b) => {
                    const ordenA = Number(a.orden_lifo || 9999);
                    const ordenB = Number(b.orden_lifo || 9999);
                    return ordenB - ordenA;
                });

                const productosMap = new Map();
                const pedidosMap = new Map();

                for (const cab of cabeceras) {
                    const snapDet = await all_detalle_p(this.grupo, cab.numeracion).once('value');
                    if (!snapDet.exists()) continue;

                    const detalles = snapDet.val();
                    const items = Array.isArray(detalles) ? detalles : Object.values(detalles);

                    const ordenLifo = Number(cab.orden_lifo || cabeceras.length);
                    const ordenCarga = cabeceras.length - ordenLifo + 1;

                    const serie = cab.serie || '';
                    const correlativo = cab.correlativo || cab.numeracion || '';

                    if (!pedidosMap.has(cab.numeracion)) {
                        pedidosMap.set(cab.numeracion, {
                            numeracion: cab.numeracion,
                            id_pedido: cab.id_pedido,
                            cliente: cab.cliente || cab.cliente_nombre || 'Sin nombre',
                            serie: serie,
                            correlativo: correlativo,
                            orden_lifo: ordenLifo,
                            orden_carga: ordenCarga,
                            verificado: false,
                            productos: []
                        });
                    }

                    items.forEach(det => {
                        if (!det) return;

                        const codigo = String(det.codigo || det.id || '');
                        const medida = String(det.medida || 'UND').toUpperCase();
                        const keyUnico = `${codigo}_${medida}`;
                        const cantidad = Number(det.cantidad || 0);

                        const stockInfo = this.productosStock[codigo] || { stock: 0, peso: 0 };
                        const pesoLinea = Number(det.peso_total || det.peso || 0) || (stockInfo.peso * cantidad);

                        if (!productosMap.has(keyUnico)) {
                            productosMap.set(keyUnico, {
                                key_unico: keyUnico,
                                codigo,
                                nombre: det.nombre || 'Sin nombre',
                                medida,
                                cantidad_total: 0,
                                cantidad_subida: 0,
                                stock: stockInfo.stock,
                                peso_linea: 0,
                                bloqueado: false,
                                pedidos: []
                            });
                        }

                        const prod = productosMap.get(keyUnico);
                        prod.cantidad_total += cantidad;
                        prod.peso_linea += pesoLinea;

                        const keyPedido = `${cab.numeracion}_${codigo}_${medida}`;

                        prod.pedidos.push({
                            key_pedido: keyPedido,
                            pedido_id: cab.id_pedido,
                            numeracion: cab.numeracion,
                            cliente_nombre: cab.cliente || cab.cliente_nombre || 'Sin nombre',
                            cantidad: cantidad,
                            orden_lifo: ordenLifo,
                            orden_carga: ordenCarga
                        });

                        const pedido = pedidosMap.get(cab.numeracion);
                        pedido.productos.push({
                            codigo,
                            nombre: det.nombre || 'Sin nombre',
                            medida,
                            cantidad,
                            peso: pesoLinea
                        });
                    });
                }

                productosMap.forEach(prod => {
                    prod.pedidos.sort((a, b) => a.orden_carga - b.orden_carga);
                });

                this.productosConsolidados = Array.from(productosMap.values())
                    .sort((a, b) => a.nombre.localeCompare(b.nombre));

                this.pedidosOrdenados = Array.from(pedidosMap.values())
                    .sort((a, b) => a.orden_carga - b.orden_carga);

                if (this.cargaExistente) {
                    this.aplicarCargaExistente();
                }

                this.filtrarProductos();
                this.filtrarCorrelativos();

            } catch (error) {
                this.mostrarMsg('Error cargando datos: ' + error.message, 'error');
                console.error(error);
            } finally {
                store.commit('dialogoprogress', false);
            }
        },

        aplicarCargaExistente() {
            if (this.cargaExistente.productos) {
                const cargaMap = new Map();
                this.cargaExistente.productos.forEach(p => {
                    cargaMap.set(p.key_unico, p);
                });

                this.productosConsolidados.forEach(prod => {
                    const cargado = cargaMap.get(prod.key_unico);
                    if (cargado) {
                        prod.cantidad_subida = cargado.cantidad_subida || 0;
                        prod.bloqueado = cargado.bloqueado || false;
                    }
                });
            }

            if (this.cargaExistente.boletas_verificadas) {
                const verificadas = new Set(this.cargaExistente.boletas_verificadas);
                this.pedidosOrdenados.forEach(p => {
                    if (verificadas.has(p.numeracion)) {
                        p.verificado = true;
                    }
                });
            }
        },

        filtrarProductos() {
            let items = [...this.productosConsolidados];

            if (this.filtroEstado !== 'todos') {
                items = items.filter(p => {
                    if (this.filtroEstado === 'listo') return p.cantidad_subida === p.cantidad_total;
                    if (this.filtroEstado === 'parcial') {
                        return p.cantidad_subida > 0 && p.cantidad_subida < p.cantidad_total;
                    }
                    if (this.filtroEstado === 'pendiente') {
                        return !p.cantidad_subida || p.cantidad_subida === 0;
                    }
                    if (this.filtroEstado === 'bloqueado') {
                        return p.bloqueado;
                    }
                    return true;
                });
            }

            if (this.busqueda && this.busqueda.trim()) {
                const q = this.busqueda.toLowerCase().trim();
                items = items.filter(p =>
                    (p.nombre || '').toLowerCase().includes(q) ||
                    (p.codigo || '').toLowerCase().includes(q)
                );
            }

            this.productosFiltrados = items;
        },

        abrirDialogClientes(item) {
            this.productoActual = item;
            this.dialogClientes = true;
        },

        abrirDialogPedido(pedido) {
            this.pedidoActual = pedido;
            this.dialogPedido = true;
        },

        onCantidadChange(item) {
            let valor = parseFloat(item.cantidad_subida) || 0;

            if (valor < 0) {
                valor = 0;
            }

            // Redondear a 2 decimales para evitar problemas de precisión
            valor = Math.round(valor * 100) / 100;

            item.cantidad_subida = valor;

            this.filtrarProductos();
        },

        toggleSeleccionarTodos(checked) {
            this.productosFiltrados.forEach(item => {
                if (!item.bloqueado) {
                    if (checked) {
                        item.cantidad_subida = item.cantidad_total;
                    } else {
                        item.cantidad_subida = 0;
                    }
                }
            });
            this.filtrarProductos();
        },

        incrementarCantidad(item) {
            if (item.bloqueado) return;
            item.cantidad_subida = (item.cantidad_subida || 0) + 1;
            this.filtrarProductos();
        },

        decrementarCantidad(item) {
            if (item.bloqueado || item.cantidad_subida <= 0) return;
            item.cantidad_subida = (item.cantidad_subida || 0) - 1;
            this.filtrarProductos();
        },

        formatPeso(peso) {
            if (!peso || peso === 0) return '-';
            // Si es entero, no mostrar decimales
            if (Number.isInteger(peso)) {
                return peso.toString();
            }
            // Si tiene decimales, mostrar hasta 2 decimales
            return peso.toFixed(2);
        },

        toggleAlistarItem(item, checked) {
            if (item.bloqueado) return;

            if (checked) {
                item.cantidad_subida = item.cantidad_total;
            } else {
                item.cantidad_subida = 0;
            }
            this.filtrarProductos();
        },

        marcarTodosListos() {
            this.productosConsolidados.forEach(item => {
                if (!item.bloqueado) {
                    item.cantidad_subida = item.cantidad_total;
                }
            });
            this.filtrarProductos();
            this.mostrarMsg('Todos los productos alistados', 'success');
        },

        productoEstaListo(prod) {
            const keyUnico = `${prod.codigo}_${prod.medida}`;
            const producto = this.productosConsolidados.find(p => p.key_unico === keyUnico);
            return producto && producto.cantidad_subida === producto.cantidad_total;
        },

        puedeVerificarPedido(pedido) {
            return pedido.productos.every(prod => this.productoEstaListo(prod));
        },

        async buscarComprobante() {
            if (!this.codigoEscaneado || !this.codigoEscaneado.trim()) return;

            try {
                this.buscandoComprobante = true;
                let codigo = this.codigoEscaneado.trim().toUpperCase();

                // Si solo ingresaron números
                if (/^\d+$/.test(codigo)) {
                    const correlativoFormateado = codigo.padStart(8, '0');

                    // Si hay un tipo seleccionado, buscar con ese tipo
                    if (this.tipoDocSeleccionado !== 'todos') {
                        const pedidoConSerie = this.pedidosOrdenados.find(p =>
                            p.serie && p.serie.charAt(0).toUpperCase() === this.tipoDocSeleccionado
                        );
                        if (pedidoConSerie) {
                            codigo = `${pedidoConSerie.serie}-${correlativoFormateado}`;
                        }
                    } else {
                        // Sin tipo seleccionado, buscar en todos los pedidos por correlativo
                        const pedidoPorCorrelativo = this.pedidosOrdenados.find(p => {
                            const corrNum = p.correlativo.replace(/\D/g, ''); // Solo números del correlativo
                            return corrNum === correlativoFormateado || corrNum.endsWith(codigo) || corrNum === codigo;
                        });
                        if (pedidoPorCorrelativo) {
                            this.codigoEscaneado = '';
                            if (pedidoPorCorrelativo.verificado) {
                                this.mostrarMsg('Esta boleta ya fue verificada', 'info');
                            } else if (!this.puedeVerificarPedido(pedidoPorCorrelativo)) {
                                this.pedidoActual = pedidoPorCorrelativo;
                                this.dialogPedido = true;
                                this.mostrarMsg('Algunos productos no están listos', 'warning');
                            } else {
                                this.pedidoActual = pedidoPorCorrelativo;
                                this.dialogPedido = true;
                            }
                            this.buscandoComprobante = false;
                            return;
                        }
                    }
                }

                const pedidoEncontrado = this.pedidosOrdenados.find(p => {
                    const serieCorr = this.formatSerieCorrelativo(p.serie, p.correlativo).toUpperCase();
                    const soloCorrelativo = p.correlativo.toUpperCase();
                    const corrSinCeros = soloCorrelativo.replace(/^0+/, '');
                    const codigoSinCeros = codigo.replace(/^0+/, '');
                    return serieCorr === codigo || soloCorrelativo === codigo ||
                        serieCorr.includes(codigo) || corrSinCeros === codigoSinCeros;
                });

                if (pedidoEncontrado) {
                    if (pedidoEncontrado.verificado) {
                        this.mostrarMsg('Esta boleta ya fue verificada', 'info');
                    } else if (!this.puedeVerificarPedido(pedidoEncontrado)) {
                        this.pedidoActual = pedidoEncontrado;
                        this.dialogPedido = true;
                        this.mostrarMsg('Algunos productos no están listos', 'warning');
                    } else {
                        this.pedidoActual = pedidoEncontrado;
                        this.dialogPedido = true;
                    }
                    this.codigoEscaneado = '';
                } else {
                    await this.buscarEnOtrosRepartos(codigo);
                }

            } catch (error) {
                this.mostrarMsg('Error buscando: ' + error.message, 'error');
            } finally {
                this.buscandoComprobante = false;
            }
        },

        async buscarEnOtrosRepartos(codigo) {
            this.errorBoletaInfo = {
                reparto: null,
                mensaje: 'No se encontró esta boleta en el reparto actual'
            };
            this.dialogErrorBoleta = true;
        },

        verificarPedidoManual(pedido) {
            this.pedidoActual = pedido;
            this.dialogPedido = true;
        },

        confirmarVerificacion() {
            if (!this.pedidoActual || !this.puedeVerificarPedido(this.pedidoActual)) return;

            this.pedidoActual.verificado = true;

            this.pedidoActual.productos.forEach(prod => {
                const keyUnico = `${prod.codigo}_${prod.medida}`;
                const producto = this.productosConsolidados.find(p => p.key_unico === keyUnico);
                if (producto) {
                    const todosVerificados = producto.pedidos.every(ped => {
                        const pedidoCompleto = this.pedidosOrdenados.find(p => p.numeracion === ped.numeracion);
                        return pedidoCompleto && pedidoCompleto.verificado;
                    });
                    if (todosVerificados) {
                        producto.bloqueado = true;
                    }
                }
            });

            this.filtrarProductos();
            this.dialogPedido = false;
            this.mostrarMsg('Boleta verificada correctamente', 'success');
        },

        desverificarPedido() {
            if (!this.pedidoActual) return;

            this.pedidoActual.verificado = false;

            this.pedidoActual.productos.forEach(prod => {
                const keyUnico = `${prod.codigo}_${prod.medida}`;
                const producto = this.productosConsolidados.find(p => p.key_unico === keyUnico);
                if (producto) {
                    producto.bloqueado = false;
                }
            });

            this.filtrarProductos();
            this.dialogPedido = false;
            this.mostrarMsg('Verificación removida', 'warning');
        },

        async abrirCamara() {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    this.mostrarMsg('Tu navegador no soporta acceso a la cámara', 'error');
                    return;
                }
                this.dialogCamara = true;
                this.cargandoCamara = true;
                await this.$nextTick();
                await new Promise(resolve => setTimeout(resolve, 300));

                const video = this.$refs.videoQR;
                const canvas = this.$refs.canvasQR;

                if (!video || !canvas) {
                    this.mostrarMsg('Error: elementos no encontrados', 'error');
                    this.dialogCamara = false;
                    return;
                }

                this.canvasQR = canvas;
                const ctx = canvas.getContext('2d');

                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });

                video.srcObject = this.videoStream;
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        this.cargandoCamara = false;

                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        this.scanInterval = setInterval(() => {
                            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                    inversionAttempts: 'dontInvert'
                                });

                                if (code && code.data) {
                                    this.procesarQRData(code.data);
                                }
                            }
                        }, 250);

                    }).catch(e => {
                        console.error('Error al reproducir video:', e);
                    });
                };

            } catch (error) {
                console.error('Error al acceder a la cámara:', error);
                let mensaje = 'No se pudo acceder a la cámara';
                if (error.name === 'NotAllowedError') {
                    mensaje = 'Permiso de cámara denegado. Habilítalo en configuración del navegador';
                } else if (error.name === 'NotFoundError') {
                    mensaje = 'No se encontró ninguna cámara en el dispositivo';
                } else if (error.name === 'NotReadableError') {
                    mensaje = 'La cámara está siendo usada por otra aplicación';
                }
                this.mostrarMsg(mensaje, 'error');
                this.dialogCamara = false;
                this.cargandoCamara = false;
            }
        },

        procesarQRData(data) {
            const partes = data.split('|');

            if (partes.length >= 4) {
                const serie = partes[2];
                const correlativo = partes[3];

                if (serie && correlativo) {
                    this.codigoEscaneado = `${serie}-${correlativo}`;
                    this.cerrarCamara();
                    this.buscarComprobante();
                    return;
                }
            }

            if (data.includes('-')) {
                this.codigoEscaneado = data;
                this.cerrarCamara();
                this.buscarComprobante();
            }
        },

        cerrarCamara() {
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }

            if (this.videoStream) {
                this.videoStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.videoStream = null;
            }
            const video = this.$refs.videoQR;
            if (video) {
                video.srcObject = null;
            }
            this.dialogCamara = false;
            this.cargandoCamara = false;
        },

        getEstadoColor(item) {
            if (item.bloqueado) return 'info';
            if (item.cantidad_subida > item.cantidad_total) return 'error';
            if (item.cantidad_subida === item.cantidad_total) return 'success';
            if (item.cantidad_subida > 0) return 'warning';
            return 'grey';
        },

        getEstadoIcon(item) {
            if (item.bloqueado) return 'mdi-lock';
            if (item.cantidad_subida > item.cantidad_total) return 'mdi-alert-octagon';
            if (item.cantidad_subida === item.cantidad_total) return 'mdi-check-circle';
            if (item.cantidad_subida > 0) return 'mdi-alert-circle';
            return 'mdi-circle-outline';
        },

        getEstadoTexto(item) {
            if (item.bloqueado) return 'Bloqueado';
            if (item.cantidad_subida > item.cantidad_total) return 'Excede';
            if (item.cantidad_subida === item.cantidad_total) return 'Listo';
            if (item.cantidad_subida > 0) return 'Parcial';
            return 'Pendiente';
        },

        getRowClass(item) {
            if (item.bloqueado) return 'blue lighten-5';
            if (item.cantidad_subida > item.cantidad_total) return 'red lighten-5';
            if (item.cantidad_subida === item.cantidad_total) return 'green lighten-5';
            if (item.cantidad_subida > 0) return 'yellow lighten-4';
            return '';
        },

        getInputBgColor(item) {
            if (item.bloqueado) return 'blue lighten-4';
            if (item.cantidad_subida > item.cantidad_total) return 'red lighten-3';
            if (item.cantidad_subida === item.cantidad_total) return 'green lighten-4';
            if (item.cantidad_subida > 0 && item.cantidad_subida < item.cantidad_total) return 'orange lighten-4';
            return '';
        },

        getCardClassPedido(pedido, idx) {
            if (pedido.verificado) return 'green lighten-5';
            if (!this.puedeVerificarPedido(pedido)) return 'orange lighten-5';
            if (idx === 0) return 'blue lighten-5';
            return '';
        },

        async guardarCarga() {
            if (!this.puedeGuardar) {
                this.dialogAdvertenciaGuardar = true;
                return;
            }

            try {
                this.guardando = true;

                const porcentaje = Math.round(this.porcentajeAlistado * 100) / 100;
                const boletasVerificadasList = this.pedidosOrdenados
                    .filter(p => p.verificado)
                    .map(p => p.numeracion);

                const datosCarga = {
                    grupo: this.grupo,
                    fecha_carga: moment().unix(),
                    fecha_carga_str: moment().format('DD/MM/YYYY HH:mm'),
                    usuario: store.state.permisos?.correo || 'sistema',
                    estado: 'completo',
                    productos: this.productosConsolidados.map(p => ({
                        key_unico: p.key_unico,
                        codigo: p.codigo,
                        nombre: p.nombre,
                        medida: p.medida,
                        cantidad_total: p.cantidad_total,
                        cantidad_subida: p.cantidad_subida || 0,
                        peso_linea: Math.round((p.peso_linea || 0) * 100) / 100,
                        stock: p.stock,
                        bloqueado: p.bloqueado
                    })),
                    boletas_verificadas: boletasVerificadasList,
                    resumen: {
                        total_productos: this.productosConsolidados.length,
                        productos_listos: this.productosListos,
                        total_boletas: this.pedidosOrdenados.length,
                        boletas_verificadas: this.boletasVerificadas,
                        porcentaje: porcentaje,
                        peso_total: Math.round(this.pesoTotalPedido * 100) / 100
                    }
                };

                await db.database()
                    .ref(store.state.baseDatos.bd)
                    .child('pedidos')
                    .child('carga_reparto')
                    .child(this.grupo)
                    .set(datosCarga);

                await db.database()
                    .ref(store.state.baseDatos.bd)
                    .child('pedidos')
                    .child('cabecera_reparto')
                    .child(this.grupo)
                    .child('estado_carga')
                    .set({
                        porcentaje: porcentaje,
                        fecha: moment().unix(),
                        completo: true
                    });

                this.cargaExistente = datosCarga;
                this.$emit('guardado', datosCarga);
                this.mostrarMsg('Carga guardada correctamente', 'success');

            } catch (error) {
                this.mostrarMsg('Error guardando: ' + error.message, 'error');
            } finally {
                this.guardando = false;
            }
        },

        formatSerieCorrelativo(serie, correlativo) {
            if (correlativo && correlativo.startsWith(serie + '-')) {
                return correlativo;
            }
            if (correlativo && correlativo.startsWith(serie)) {
                return correlativo;
            }
            return `${serie}-${correlativo}`;
        },

        seleccionarTipoDoc(tipo) {
            this.tipoDocSeleccionado = tipo;
            this.filtrarCorrelativos();
        },

        onCodigoChange(val) {
        },

        filtrarCorrelativos() {
            if (this.tipoDocSeleccionado === 'todos') {
                this.correlativosFiltrados = this.pedidosOrdenados.map(p => {
                    return this.formatSerieCorrelativo(p.serie, p.correlativo);
                });
            } else {
                this.correlativosFiltrados = this.pedidosOrdenados
                    .filter(p => p.serie && p.serie.charAt(0).toUpperCase() === this.tipoDocSeleccionado)
                    .map(p => this.formatSerieCorrelativo(p.serie, p.correlativo));
            }
        },

        filtroCorrelativo(item, queryText) {
            if (!queryText) return true;
            const search = queryText.toLowerCase();
            const itemNumeros = item.replace(/\D/g, '');
            const searchNumeros = search.replace(/\D/g, '');
            return item.toLowerCase().includes(search) ||
                (searchNumeros && itemNumeros.includes(searchNumeros));
        },

        mostrarMsg(texto, color = 'success') {
            this.snackbarText = texto;
            this.snackbarColor = color;
            this.snackbar = true;
        },

        cerrar() {
            this.cerrarCamara();
            this.dial = false;
            this.$emit('cerrar');
        }
    }
};
</script>

<style scoped>
.green.lighten-5 {
    background-color: #e8f5e9 !important;
}

.yellow.lighten-4 {
    background-color: #fff9c4 !important;
}

.orange.lighten-5 {
    background-color: #fff3e0 !important;
}

.blue.lighten-5 {
    background-color: #e3f2fd !important;
}

.red.lighten-5 {
    background-color: #ffebee !important;
}

.centered-input {
    max-width: 100px;
    margin: 0 auto;
}

.centered-input>>>input {
    text-align: center;
}

.qr-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.qr-frame {
    width: 200px;
    height: 200px;
    border: 3px solid #4CAF50;
    border-radius: 10px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    animation: pulse 2s infinite;
}

.cursor-pointer {
    cursor: pointer;
}

@keyframes pulse {

    0%,
    100% {
        border-color: #4CAF50;
    }

    50% {
        border-color: #81C784;
    }
}

.line-height-1 {
    line-height: 1;
}

.border-thin {
    border: 1px solid #eee;
}

.compact-select {
    font-size: 0.75rem !important;
}

.compact-select :deep(.v-input__control) {
    min-height: 30px !important;
}

/* Animación simple */
.animate-fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Ajuste para el input redondeado de Vuetify */
.custom-input :deep(.v-input__slot) {
  padding-left: 8px !important;
  padding-right: 8px !important; /* <-- clave */
  background: #fff !important;
}


.line-height-tight { line-height: 1.2 !important; }
.lh-1 { line-height: 1 !important; margin-bottom: 2px !important; }
.bg-light { background-color: #f8f9fa; }
.border-right { border-right: 1px solid #e0e0e0; }
.border-left { border-left: 1px solid #e0e0e0; }
.success-border { border: 2px solid #4CAF50 !important; }

/* Quitar flechas del input number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>