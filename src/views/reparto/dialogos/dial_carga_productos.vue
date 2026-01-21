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
                    Alistar Productos
                    <v-chip x-small class="ml-2" :color="productosListos === productosConsolidados.length ? 'success' : 'warning'" dark>
                        {{ productosListos }}/{{ productosConsolidados.length }}
                    </v-chip>
                </v-tab>
                <v-tab>
                    <v-icon left small>mdi-qrcode-scan</v-icon>
                    Verificar Boletas
                    <v-chip x-small class="ml-2" :color="boletasVerificadas === pedidosOrdenados.length ? 'success' : 'warning'" dark>
                        {{ boletasVerificadas }}/{{ pedidosOrdenados.length }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tabActivo">
                <v-tab-item>
                    <v-card flat class="pa-3 pa-md-4">
                        <v-card outlined class="mb-4 pa-3">
                            <div class="d-flex align-center justify-space-between mb-2">
                                <span class="font-weight-bold">Progreso de Alistado</span>
                                <span class="caption">
                                    {{ productosListos }} / {{ productosConsolidados.length }} productos listos
                                </span>
                            </div>
                            <v-progress-linear :value="porcentajeAlistado" height="20" rounded 
                                :color="colorProgresoAlistado" class="mb-2">
                                <template v-slot:default>
                                    <strong class="white--text">{{ porcentajeAlistado.toFixed(2) }}%</strong>
                                </template>
                            </v-progress-linear>
                            <v-row dense class="text-caption grey--text">
                                <v-col cols="4" class="text-center">
                                    <v-icon x-small color="success">mdi-check-circle</v-icon>
                                    {{ productosListos }} listos
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <v-icon x-small color="warning">mdi-alert-circle</v-icon>
                                    {{ productosParciales }} parciales
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <v-icon x-small color="grey">mdi-circle-outline</v-icon>
                                    {{ productosPendientes }} pendientes
                                </v-col>
                            </v-row>
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
                                <v-select v-model="filtroEstado" :items="opcionesEstado" outlined dense 
                                    hide-details label="Estado" @change="filtrarProductos">
                                </v-select>
                            </v-col>
                            <v-col cols="6" sm="3" md="2">
                                <v-btn block color="teal" dark small @click="marcarTodosListos" 
                                    :disabled="todosListos">
                                    <v-icon left small>mdi-check-all</v-icon>
                                    Alistar Todos
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-alert v-if="erroresAlistado.length > 0" dense text type="error" class="mb-3">
                            <div class="font-weight-bold mb-1">Errores de alistado:</div>
                            <ul class="ma-0 pl-4">
                                <li v-for="(err, i) in erroresAlistado.slice(0, 5)" :key="i" class="text-caption">{{ err }}</li>
                                <li v-if="erroresAlistado.length > 5" class="text-caption">... y {{ erroresAlistado.length - 5 }} más</li>
                            </ul>
                        </v-alert>

                        <v-card outlined v-if="!isMobile">
                            <v-data-table :headers="headers" :items="productosFiltrados"
                                :items-per-page="15" dense class="elevation-0" 
                                :item-class="getRowClass" item-key="key_unico">

                                <template v-slot:item.seleccionar="{ item }">
                                    <v-checkbox 
                                        :input-value="item.cantidad_subida === Math.min(item.cantidad_total, item.stock)"
                                        @change="toggleAlistarItem(item, $event)"
                                        :disabled="item.bloqueado || item.stock === 0"
                                        dense hide-details class="ma-0 pa-0">
                                    </v-checkbox>
                                </template>

                                <template v-slot:item.bloqueado="{ item }">
                                    <v-icon v-if="item.bloqueado" small color="info">mdi-lock</v-icon>
                                </template>

                                <template v-slot:item.producto="{ item }">
                                    <div>
                                        <strong>{{ item.nombre }}</strong>
                                        <div class="text-caption grey--text">
                                            {{ item.codigo }} 
                                            <v-chip x-small outlined class="ml-1">{{ item.medida }}</v-chip>
                                        </div>
                                    </div>
                                </template>

                                <template v-slot:item.cantidad_total="{ item }">
                                    <v-chip small color="primary" dark>
                                        {{ item.cantidad_total }} {{ item.medida }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.peso_total="{ item }">
                                    <span class="text-caption">{{ item.peso_linea.toFixed(2) }} kg</span>
                                </template>

                                <template v-slot:item.stock="{ item }">
                                    <v-chip small :color="getStockColor(item)" dark>
                                        {{ item.stock }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.cantidad_subida="{ item }">
                                    <v-text-field v-model.number="item.cantidad_subida" type="number" 
                                        outlined dense hide-details style="max-width: 100px;"
                                        :min="0" :max="item.stock"
                                        @input="onCantidadChange(item)"
                                        :disabled="item.bloqueado"
                                        :error="item.cantidad_subida > item.stock || item.cantidad_subida > item.cantidad_total"
                                        :success="item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock"
                                        :background-color="getInputBgColor(item)">
                                    </v-text-field>
                                </template>

                                <template v-slot:item.estado="{ item }">
                                    <v-chip x-small :color="getEstadoColor(item)" dark>
                                        <v-icon x-small left>{{ getEstadoIcon(item) }}</v-icon>
                                        {{ getEstadoTexto(item) }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.clientes="{ item }">
                                    <v-btn small color="indigo" dark text @click="abrirDialogClientes(item)">
                                        {{ item.pedidos.length }} 
                                        <v-icon small right>mdi-eye</v-icon>
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </v-card>

                        <div v-else>
                            <v-card v-for="item in productosFiltrados" :key="item.key_unico" outlined 
                                class="mb-2" :class="getRowClass(item)">
                                <v-card-text class="pa-3">
                                    <div class="d-flex align-center mb-2">
                                        <v-checkbox 
                                            :input-value="item.cantidad_subida === Math.min(item.cantidad_total, item.stock)"
                                            @change="toggleAlistarItem(item, $event)"
                                            :disabled="item.bloqueado || item.stock === 0"
                                            dense hide-details class="ma-0 pa-0 mr-2">
                                        </v-checkbox>
                                        <v-icon v-if="item.bloqueado" small color="info" class="mr-2">mdi-lock</v-icon>
                                        <div class="flex-grow-1">
                                            <div class="font-weight-bold text-body-2">{{ item.nombre }}</div>
                                            <div class="text-caption grey--text">
                                                {{ item.codigo }} 
                                                <v-chip x-small outlined>{{ item.medida }}</v-chip>
                                            </div>
                                        </div>
                                        <v-chip x-small :color="getEstadoColor(item)" dark>
                                            {{ getEstadoTexto(item) }}
                                        </v-chip>
                                    </div>

                                    <v-row dense align="center" class="mb-2">
                                        <v-col cols="3" class="text-center">
                                            <div class="text-caption grey--text">Requerido</div>
                                            <v-chip small color="primary" dark>{{ item.cantidad_total }}</v-chip>
                                        </v-col>
                                        <v-col cols="3" class="text-center">
                                            <div class="text-caption grey--text">Stock</div>
                                            <v-chip small :color="getStockColor(item)" dark>{{ item.stock }}</v-chip>
                                        </v-col>
                                        <v-col cols="6">
                                            <div class="text-caption grey--text text-center">Alistado</div>
                                            <v-text-field v-model.number="item.cantidad_subida" type="number" 
                                                outlined dense hide-details class="centered-input"
                                                :min="0" :max="item.stock"
                                                @input="onCantidadChange(item)"
                                                :disabled="item.bloqueado"
                                                :error="item.cantidad_subida > item.stock || item.cantidad_subida > item.cantidad_total"
                                                :success="item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock"
                                                :background-color="getInputBgColor(item)">
                                            </v-text-field>
                                        </v-col>
                                    </v-row>

                                    <v-btn block x-small text color="indigo" @click="abrirDialogClientes(item)">
                                        <v-icon left x-small>mdi-account-group</v-icon>
                                        Ver {{ item.pedidos.length }} clientes
                                    </v-btn>
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-card>
                </v-tab-item>

                <v-tab-item>
                    <v-card flat class="pa-3 pa-md-4">
                        <v-card outlined class="mb-4 pa-3">
                            <div class="d-flex align-center mb-3">
                                <v-icon color="teal" class="mr-2">mdi-qrcode-scan</v-icon>
                                <span class="font-weight-bold">Escanear Comprobante</span>
                            </div>
                            
                            <v-row dense>
                                <v-col cols="12" sm="8" md="6">
                                    <v-text-field v-model="codigoEscaneado" outlined dense 
                                        label="Serie-Correlativo (ej: BD06-00000999)"
                                        prepend-inner-icon="mdi-barcode-scan"
                                        @keyup.enter="buscarComprobante"
                                        :loading="buscandoComprobante"
                                        clearable hide-details
                                        ref="inputEscaner">
                                    </v-text-field>
                                </v-col>
                                <v-col cols="6" sm="2">
                                    <v-btn block color="teal" dark @click="buscarComprobante" 
                                        :loading="buscandoComprobante" :disabled="!codigoEscaneado">
                                        <v-icon>mdi-magnify</v-icon>
                                    </v-btn>
                                </v-col>
                                <v-col cols="6" sm="2">
                                    <v-btn block color="indigo" dark @click="abrirCamara">
                                        <v-icon>mdi-camera</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-card>

                        <v-card outlined class="mb-4 pa-3">
                            <v-row dense>
                                <v-col cols="6" class="text-center">
                                    <div class="text-h5 font-weight-bold success--text">{{ boletasVerificadas }}</div>
                                    <div class="caption grey--text">Boletas Verificadas</div>
                                </v-col>
                                <v-col cols="6" class="text-center">
                                    <div class="text-h5 font-weight-bold warning--text">{{ pedidosOrdenados.length - boletasVerificadas }}</div>
                                    <div class="caption grey--text">Pendientes</div>
                                </v-col>
                            </v-row>
                            <v-progress-linear :value="porcentajeVerificacion" height="10" rounded 
                                :color="porcentajeVerificacion === 100 ? 'success' : 'warning'" class="mt-2">
                            </v-progress-linear>
                        </v-card>

                        <v-row>
                            <v-col v-for="(pedido, idx) in pedidosOrdenados" :key="pedido.numeracion" 
                                cols="12" sm="6" md="4">
                                <v-card outlined class="mb-2" 
                                    :class="getCardClassPedido(pedido, idx)">
                                    <v-card-title class="py-2 px-3">
                                        <v-chip small :color="pedido.verificado ? 'success' : (idx === 0 ? 'info' : 'grey')" 
                                            dark class="mr-2">
                                            {{ idx + 1 }}°
                                        </v-chip>
                                        <span class="text-body-2 font-weight-bold text-truncate" style="max-width: 150px;">
                                            {{ pedido.cliente }}
                                        </span>
                                        <v-spacer></v-spacer>
                                        <v-icon v-if="pedido.verificado" color="success">mdi-check-circle</v-icon>
                                        <v-icon v-else-if="!puedeVerificarPedido(pedido)" color="warning" small>mdi-alert</v-icon>
                                    </v-card-title>
                                    
                                    <v-divider></v-divider>
                                    
                                    <v-card-text class="pa-2">
                                        <div class="text-caption grey--text mb-1">
                                            <v-icon x-small>mdi-receipt</v-icon> 
                                            {{ pedido.serie }}-{{ pedido.correlativo }}
                                        </div>
                                        <div class="text-caption grey--text mb-1">
                                            <v-icon x-small>mdi-package-variant</v-icon> 
                                            {{ pedido.productos.length }} productos
                                        </div>
                                        
                                        <v-chip v-if="pedido.verificado" x-small color="success" dark class="mt-1">
                                            <v-icon x-small left>mdi-check</v-icon> VERIFICADO
                                        </v-chip>
                                        <v-chip v-else-if="!puedeVerificarPedido(pedido)" x-small color="warning" dark class="mt-1">
                                            <v-icon x-small left>mdi-alert</v-icon> PRODUCTOS INCOMPLETOS
                                        </v-chip>
                                        <v-chip v-else x-small color="grey" dark class="mt-1">
                                            PENDIENTE
                                        </v-chip>
                                    </v-card-text>

                                    <v-card-actions class="pa-2 pt-0">
                                        <v-btn x-small text color="indigo" @click="abrirDialogPedido(pedido)">
                                            <v-icon left x-small>mdi-eye</v-icon>
                                            Ver detalle
                                        </v-btn>
                                        <v-spacer></v-spacer>
                                        <v-btn v-if="!pedido.verificado && puedeVerificarPedido(pedido)" 
                                            x-small color="success" dark depressed
                                            @click="verificarPedidoManual(pedido)">
                                            <v-icon left x-small>mdi-check</v-icon>
                                            Verificar
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-tab-item>
            </v-tabs-items>
        </v-card>

        <v-dialog v-model="dialogClientes" max-width="500" scrollable>
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
                    <v-chip small :color="getStockColor(productoActual)">
                        Stock: {{ productoActual.stock }}
                    </v-chip>
                </v-card-subtitle>

                <v-divider></v-divider>

                <v-card-text class="pa-0">
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th>Orden</th>
                                <th>Cliente</th>
                                <th class="text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="pedido in productoActual.pedidos" :key="pedido.key_pedido">
                                <td>
                                    <v-chip x-small :color="pedido.orden_carga === 1 ? 'success' : 'grey'" dark>
                                        {{ pedido.orden_carga }}°
                                    </v-chip>
                                </td>
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
                        {{ pedidoActual.serie }}-{{ pedidoActual.correlativo }}
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
                        Pedido ID: {{ pedidoActual.id_pedido }} | Orden de carga: {{ pedidoActual.orden_carga }}°
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
                        :disabled="!puedeVerificarPedido(pedidoActual)"
                        @click="confirmarVerificacion">
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
                    <video ref="videoQR" style="width: 100%; max-height: 300px; object-fit: cover;" 
                        autoplay playsinline muted></video>
                    <canvas ref="canvasQR" style="display: none;"></canvas>
                    <div v-if="!cargandoCamara" class="qr-overlay">
                        <div class="qr-frame"></div>
                    </div>
                    <div v-if="cargandoCamara" class="pa-4" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
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
                        <strong>{{ productosConsolidados.length - productosListos }}</strong> productos sin alistar completamente
                    </div>
                    <div v-if="boletasVerificadas < pedidosOrdenados.length" class="mb-3">
                        <v-icon color="warning" class="mr-2">mdi-receipt</v-icon>
                        <strong>{{ pedidosOrdenados.length - boletasVerificadas }}</strong> boletas sin verificar
                    </div>
                    <v-alert dense text type="info" class="mt-3">
                        Debe completar el alistado de todos los productos y verificar todas las boletas antes de guardar.
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
                { text: '', value: 'seleccionar', width: '50px', sortable: false },
                { text: '', value: 'bloqueado', width: '30px', sortable: false },
                { text: 'Producto', value: 'producto', width: '25%' },
                { text: 'Requerido', value: 'cantidad_total', align: 'center', width: '100px' },
                { text: 'Peso (kg)', value: 'peso_total', align: 'center', width: '80px' },
                { text: 'Stock', value: 'stock', align: 'center', width: '80px' },
                { text: 'Alistado', value: 'cantidad_subida', align: 'center', width: '100px' },
                { text: 'Estado', value: 'estado', align: 'center', width: '100px' },
                { text: 'Clientes', value: 'clientes', align: 'center', width: '80px' }
            ]
        };
    },
    computed: {
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
        erroresAlistado() {
            const errs = [];
            this.productosConsolidados.forEach(p => {
                if (p.cantidad_subida > p.cantidad_total) {
                    errs.push(`${p.nombre}: Excede (${p.cantidad_subida} > ${p.cantidad_total})`);
                }
                if (p.cantidad_subida < p.cantidad_total && !p.bloqueado) {
                    errs.push(`${p.nombre}: Faltante (${p.cantidad_subida || 0} / ${p.cantidad_total})`);
                }
            });
            return errs;
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
            let valor = parseInt(item.cantidad_subida) || 0;
            
            if (valor < 0) {
                valor = 0;
            }
            
            if (valor > item.stock) {
                valor = item.stock;
                this.mostrarMsg(`Stock insuficiente. Máximo disponible: ${item.stock}`, 'warning');
            }
            
            item.cantidad_subida = valor;
            
            this.filtrarProductos();
        },

        toggleAlistarItem(item, checked) {
            if (item.bloqueado || item.stock === 0) return;
            
            if (checked) {
                item.cantidad_subida = Math.min(item.cantidad_total, item.stock);
            } else {
                item.cantidad_subida = 0;
            }
            this.filtrarProductos();
        },

        marcarTodosListos() {
            this.productosConsolidados.forEach(item => {
                if (!item.bloqueado && item.stock > 0) {
                    item.cantidad_subida = Math.min(item.cantidad_total, item.stock);
                }
            });
            this.filtrarProductos();
            this.mostrarMsg('Todos los productos alistados según stock disponible', 'success');
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
                const codigo = this.codigoEscaneado.trim().toUpperCase();

                const pedidoEncontrado = this.pedidosOrdenados.find(p => {
                    const serieCorr = `${p.serie}-${p.correlativo}`.toUpperCase();
                    return serieCorr === codigo || p.correlativo === codigo;
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
            if (item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock) return 'success';
            if (item.cantidad_subida > 0) return 'warning';
            return 'grey';
        },

        getEstadoIcon(item) {
            if (item.bloqueado) return 'mdi-lock';
            if (item.cantidad_subida > item.cantidad_total) return 'mdi-alert-octagon';
            if (item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock) return 'mdi-check-circle';
            if (item.cantidad_subida > 0) return 'mdi-alert-circle';
            return 'mdi-circle-outline';
        },

        getEstadoTexto(item) {
            if (item.bloqueado) return 'Bloqueado';
            if (item.cantidad_subida > item.cantidad_total) return 'Excede';
            if (item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock) return 'Listo';
            if (item.cantidad_subida > 0) return 'Parcial';
            return 'Pendiente';
        },

        getStockColor(item) {
            if (item.stock >= item.cantidad_total) return 'success';
            if (item.stock > 0) return 'warning';
            return 'error';
        },

        getRowClass(item) {
            if (item.bloqueado) return 'blue lighten-5';
            if (item.cantidad_subida > item.cantidad_total) return 'red lighten-5';
            if (item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock) return 'green lighten-5';
            if (item.cantidad_subida > 0) return 'yellow lighten-4';
            return '';
        },

        getInputBgColor(item) {
            if (item.bloqueado) return 'blue lighten-4';
            if (item.cantidad_subida > item.cantidad_total) return 'red lighten-3';
            if (item.cantidad_subida === item.cantidad_total && item.cantidad_subida <= item.stock) return 'green lighten-4';
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
.centered-input >>> input {
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
@keyframes pulse {
    0%, 100% { border-color: #4CAF50; }
    50% { border-color: #81C784; }
}
</style>
