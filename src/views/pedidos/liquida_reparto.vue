<template>
    <div class="pa-4">
        <v-card class="elevation-4 rounded-lg">

            <v-card-title class="pa-3 blue-grey lighten-5 d-flex align-center">

                <div class="d-flex align-center">
                    <v-icon color="red" large @click="anterior" title="Reparto Anterior">mdi-arrow-left-bold</v-icon>

                    <div class="d-flex align-center mx-2">
                        <span class="text-h6 mr-1">REPARTO N°</span>

                        <template v-if="editandoReparto">
                            <v-text-field v-model="repartoEditado" @keyup.enter="confirmarCambioReparto" type="number"
                                dense outlined hide-details style="width: 100px" autofocus
                                ref="inputReparto"></v-text-field>
                            <v-btn icon small color="primary" @click="confirmarCambioReparto" class="ml-1"
                                title="Buscar reparto">
                                <v-icon>mdi-magnify</v-icon>
                            </v-btn>
                            <v-btn icon small @click="cancelarEdicion" class="ml-1" title="Cancelar">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </template>

                        <span v-else class="text-h6" @click="iniciarEdicion"
                            style="cursor: pointer; border-bottom: 1px dashed grey;">
                            {{ router_grupo }}
                            <v-icon x-small color="grey" class="ml-1">mdi-pencil</v-icon>
                        </span>
                    </div>

                    <v-icon color="red" large @click="siguiente" title="Reparto Siguiente">mdi-arrow-right-bold</v-icon>
                </div>

                <v-spacer></v-spacer>

                <div class="d-flex align-center mt-2">
                    <v-btn v-if="esAdmin" color="info" dark small class="rounded-lg mx-1" @click="abrirDialTransporte">
                        <v-icon left small>mdi-truck</v-icon> Transp.
                    </v-btn>

                    <v-menu bottom offset-y transition="scale-transition" nudge-bottom="5"
                        :close-on-content-click="false">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="red darken-2" dark small v-bind="attrs" v-on="on" class="rounded-lg mx-1">
                                <v-icon left small>mdi-file-chart</v-icon> Reportes
                            </v-btn>
                        </template>
                        <v-list dense class="py-1">
                            <v-list-item @click="dial_descarga = true">
                                <v-list-item-icon><v-icon
                                        color="blue darken-2">mdi-warehouse</v-icon></v-list-item-icon>
                                <v-list-item-title>Reporte Almacén</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="reporte_producto_cliente()">
                                <v-list-item-icon><v-icon
                                        color="green darken-2">mdi-account-multiple</v-icon></v-list-item-icon>
                                <v-list-item-title>Producto x Cliente</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="pdf_transporte()">
                                <v-list-item-icon><v-icon color="indigo darken-2">mdi-truck</v-icon></v-list-item-icon>
                                <v-list-item-title>Reporte Transporte</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="pdf_clientes_transporte()">
                                <v-list-item-icon><v-icon
                                        color="teal darken-2">mdi-clipboard-list</v-icon></v-list-item-icon>
                                <v-list-item-title>Lista Clientes (Reparto)</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="reporte_cobrar()">
                                <v-list-item-icon><v-icon
                                        color="orange darken-2">mdi-account-cash</v-icon></v-list-item-icon>
                                <v-list-item-title>Por Cobrar</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="ver_detalle_masivo()">
                                <v-list-item-icon><v-icon
                                        color="purple darken-2">mdi-file-eye</v-icon></v-list-item-icon>
                                <v-list-item-title>Ver Detalle (Consol.)</v-list-item-title>
                            </v-list-item>
                            <v-divider></v-divider>
                            <v-list-item @click="dialogo_imprime = true">
                                <v-list-item-icon><v-icon color="teal darken-2">mdi-printer</v-icon></v-list-item-icon>
                                <v-list-item-title>Imprimir Comprobantes</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="dialogImpresionGuias = true" :disabled="!puedeImprimirGuia">
                                <v-list-item-icon>
                                    <v-icon
                                        :color="puedeImprimirGuia ? 'cyan darken-2' : 'grey'">mdi-file-document-multiple</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Imprimir Guías</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>

                    <v-menu bottom offset-y transition="scale-transition" nudge-bottom="5">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="blue darken-3" dark small v-bind="attrs" v-on="on" class="rounded-lg mx-1">
                                <v-icon left small>mdi-cogs</v-icon> Acciones
                            </v-btn>
                        </template>
                        <v-list dense class="py-1">
                            <v-list-item @click="envia_sunat" :disabled="periodoCerrado">
                                <v-list-item-icon><v-icon color="green">mdi-cloud-upload</v-icon></v-list-item-icon>
                                <v-list-item-title>Procesar</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="abare_guias()" :disabled="!puedeGenerarGuia">
                                <v-list-item-icon>
                                    <v-icon :color="puedeGenerarGuia ? 'cyan darken-2' : 'grey'">mdi-file-send</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Generar Guía</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="transferir_pedidos()">
                                <v-list-item-icon><v-icon
                                        color="deep-purple darken-1">mdi-swap-horizontal</v-icon></v-list-item-icon>
                                <v-list-item-title>Transferir Pedidos</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="anular_masivo()" :disabled="!puedeAnularMasivo">
                                <v-list-item-icon><v-icon color="red">mdi-cancel</v-icon></v-list-item-icon>
                                <v-list-item-title>Anular Masivo</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>

            </v-card-title>

            <v-alert v-if="periodoCerrado" type="warning" dense class="mx-4 mb-1 mt-2 caption" outlined>
                El período <strong>{{ periodoActualKey }}</strong> está cerrado. No se puede enviar a Sunat.
            </v-alert>

            <v-card-text class="py-3">
                <v-row dense>
                    <v-col cols="12" sm="4">
                        <h4 class="text-subtitle-1">
                            FECHA TRASLADO: <span class="primary--text">{{ conviertefecha(cabecera_total.fecha_traslado)
                                }}</span>
                        </h4>
                        <!-- Chip de transporte asignado -->
                        <div v-if="cabecera_total.d_transporte?.usuario_nombre" class="mt-1">
                            <v-chip small color="info" dark>
                                <v-icon small left>mdi-truck</v-icon>
                                {{ cabecera_total.d_transporte.usuario_nombre }}
                                <span v-if="cabecera_total.d_transporte.placa" class="ml-1">
                                    | {{ cabecera_total.d_transporte.placa }}
                                </span>
                            </v-chip>
                        </div>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <h4 class="text-subtitle-1">
                            TOTAL PEDIDOS: <span class="font-weight-bold">{{ suma_pedidos }}</span>
                            <span class="ml-4">PESO TOTAL: <span class="font-weight-bold">{{ suma_peso }}
                                    KG</span></span>
                        </h4>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <h4 class="text-subtitle-1">
                            TOTAL VENTA: <span class="green--text text--darken-2">{{ moneda }} {{ t_general }}</span>
                        </h4>
                        <span class="caption">Contado: {{ moneda }} {{ t_contado }} | Crédito: {{ moneda }} {{ t_credito
                        }}</span>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-simple-table fixed-header dense height='65vh' class="elevation-0">
                <template v-slot:default>
                    <thead>
                        <tr class="blue-grey lighten-5">
                            <th class="text-left">Correlativo</th>
                            <th class="text-left">Cliente</th>
                            <th class="text-left">
                                <v-btn icon x-small
                                    @click="ordenar_correlativo = false; ordenar_vendedor = !ordenar_vendedor"
                                    color="info">
                                    <v-icon small>mdi-sort-alphabetical-descending</v-icon>
                                </v-btn>
                                Vend.
                            </th>
                            <th class="text-center">Peso (KG)</th>
                            <th class="text-left">Modo</th>
                            <th class="text-center">SUNAT</th>
                            <th class="text-right">Monto Crédito</th>
                            <th class="text-right">Total</th>
                            <th class="text-center">
                                Accion
                                <v-checkbox class="d-inline-block ml-2 mt-0" dense v-model="consolida_t"
                                    @click="consolida_todo()" hide-details></v-checkbox>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.numeracion">
                            <td class="caption font-weight-medium">
                                {{ item.numeracion }}
                                <v-chip v-if="item.guia_id" x-small color="cyan" dark class="ml-1"
                                    @click="imprime_guia(item)">GR</v-chip>
                            </td>
                            <td class="caption">{{ item.dni }} - {{ item.cliente }}</td>
                            <td class="caption">{{ item.vendedor }}</td>
                            <td class="text-center caption">{{ redondear(item.peso_total) }}</td>
                            <td class="caption">
                                <v-chip x-small :color="item.forma_pago === 'CREDITO' ? 'orange' : 'success'" dark>
                                    {{ item.forma_pago }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <v-chip x-small
                                    :color="item.estado === 'ANULADO' ? 'red' : (item.estado === 'PENDIENTE' ? 'orange' : 'green')"
                                    dark>
                                    {{ item.estado.substring(0, 4) }}
                                </v-chip>
                            </td>
                            <td class="text-right caption red--text">{{ item.moneda }}{{ redondear(item.pendiente_pago)
                                }}</td>
                            <td class="text-right caption font-weight-bold">{{ item.moneda }}{{ redondear(item.total) }}
                            </td>
                            <td class="text-center">
                                <v-row dense align="center">
                                    <v-col cols="6" class="pr-0">
                                        <v-menu offset-y>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-btn icon x-small v-bind="attrs" v-on="on">
                                                    <v-icon small>mdi-dots-vertical</v-icon>
                                                </v-btn>
                                            </template>
                                            <v-list dense>
                                                <v-list-item @click='ver_detalle(item)'>
                                                    <v-list-item-icon><v-icon
                                                            color="warning">mdi-eye</v-icon></v-list-item-icon>
                                                    <v-list-item-title>Ver Detalle</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click='genera_guia(item)'
                                                    v-if="item.estado !== 'ENVIADO' && item.estado !== 'ANULADO'">
                                                    <v-list-item-icon><v-icon
                                                            color="success">mdi-truck</v-icon></v-list-item-icon>
                                                    <v-list-item-title>Genera Guia Rem</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click='imprimir(item)'>
                                                    <v-list-item-icon><v-icon
                                                            color="info">mdi-printer-check</v-icon></v-list-item-icon>
                                                    <v-list-item-title>Imprimir Comprobante</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click='edita_c(item)' v-if="item.estado == 'PENDIENTE'">
                                                    <v-list-item-icon><v-icon
                                                            color="success">mdi-pencil</v-icon></v-list-item-icon>
                                                    <v-list-item-title>Editar (PENDIENTE)</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click='abrirDialogoAnulacion(item)'
                                                    v-if="item.estado !== 'ANULADO' && item.estado !== 'ENVIADO'">
                                                    <v-list-item-icon><v-icon
                                                            color="error">mdi-delete</v-icon></v-list-item-icon>
                                                    <v-list-item-title>Anular</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </v-col>
                                    <v-col cols="6" class="pl-0">
                                        <v-checkbox class="mt-0" dense v-model="item.consolida"
                                            hide-details></v-checkbox>
                                    </v-col>
                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <v-dialog v-model="dialogDetalle" max-width="650">
            <v-card class="rounded-lg">
                <v-toolbar color="warning" dense dark><v-toolbar-title>Detalle del
                        Pedido</v-toolbar-title><v-spacer></v-spacer><v-btn icon
                        @click="dialogDetalle = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th class="text-left">Producto</th>
                                <th class="text-left">Medida</th>
                                <th class="text-right">Precio Unitario</th>
                                <th class="text-right">Total Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="d in pedidoSeleccionado" :key="`${d.id}-${d.nombre}`">
                                <td class="caption">
                                    <strong class="red--text mr-1">{{ d.cantidad }}</strong> x {{ d.id }} - {{ d.nombre
                                    }}
                                    <v-chip v-if="d.operacion == 'GRATUITA'" x-small color="teal" dark
                                        class="ml-1">GRATUITA</v-chip>
                                </td>
                                <td class="caption">{{ d.medida }}</td>
                                <td class="text-right caption">
                                    S/.{{ d.precio }}
                                    <strong v-if="d.preciodescuento != 0" class="red--text ml-1">(-S/.{{
                                        d.preciodescuento
                                        }})</strong>
                                </td>
                                <td class="text-right caption font-weight-bold">S/.{{
                                    redondear((Number(d.total_antes_impuestos)
                                        + Number(d.total_impuestos))) }}</td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo Anulación Individual -->
        <v-dialog v-model="dialogo_motivo_anulacion" max-width="520px" persistent>
            <v-card class="rounded-lg">
                <v-toolbar color="error" dense dark>
                    <v-toolbar-title>Anulación de Comprobante</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="cerrarDialogoAnulacion"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pt-4">
                    <div class="mb-3 text-subtitle-2 grey--text text--darken-1">
                        Anulando comprobante: <strong class="error--text">{{ comp_anular ? comp_anular.numeracion : ''
                            }}</strong>
                    </div>

                    <v-select dense outlined clearable :items="motivos_predeterminados"
                        label="Motivo (selección rápida)" v-model="motivo_seleccion" @change="sincronizaMotivo" />

                    <v-textarea outlined dense auto-grow rows="2" v-model.trim="motivo_anulacion"
                        label="Detalle del motivo (obligatorio)" :rules="[v => !!v || 'Ingrese el motivo']" />

                    <v-checkbox v-model="regresar_pendiente"
                        label="Si marca la casilla, el pedido regresará a PENDIENTE, no se revertirá stock" dense
                        hide-details class="mt-n3" color="warning" />

                    <div v-if="error_motivo" class="red--text text-caption mt-1">{{ error_motivo }}</div>
                </v-card-text>
                <v-card-actions class="px-4 pb-4">
                    <v-btn text @click="cerrarDialogoAnulacion">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="error" :loading="anulando" @click="confirmarAnulacion">
                        <v-icon left>mdi-delete</v-icon> Anular comprobante
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Diálogo Anulación Masiva -->
        <v-dialog v-model="dial_anular_masivo" max-width="520px" persistent>
            <v-card class="rounded-lg">
                <v-toolbar color="error" dense dark>
                    <v-toolbar-title>Anulación Masiva de Comprobantes</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dial_anular_masivo = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <v-card-text class="pt-4">
                    <div class="mb-3 text-subtitle-2 grey--text text--darken-1">
                        Se anularán <strong class="error--text">{{ comprobantesSeleccionadosAnular.length }}</strong>
                        comprobante(s)
                    </div>

                    <v-select dense outlined clearable :items="motivos_predeterminados"
                        label="Motivo (selección rápida)" v-model="motivo_seleccion_masivo"
                        @change="sincronizaMotivoMasivo" />

                    <v-textarea outlined dense auto-grow rows="2" v-model.trim="motivo_anulacion_masivo"
                        label="Detalle del motivo (obligatorio)" :rules="[v => !!v || 'Ingrese el motivo']" />

                    <v-checkbox v-model="regresar_pendiente_masivo"
                        label="Regresar pedidos a PENDIENTE (no revertir stock)" dense hide-details class="mt-n3"
                        color="warning" />

                    <div v-if="error_motivo_masivo" class="red--text text-caption mt-1">{{ error_motivo_masivo }}</div>
                </v-card-text>
                <v-card-actions class="px-4 pb-4">
                    <v-btn text @click="dial_anular_masivo = false">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="error" :loading="anulando_masivo" @click="confirmarAnulacionMasiva">
                        <v-icon left>mdi-delete</v-icon> Anular comprobantes
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_descarga" max-width="590">
            <v-card class="rounded-lg">
                <v-toolbar color="red darken-2" dense dark>
                    <v-toolbar-title>Reporte de Almacén</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dial_descarga = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pa-4">
                    <h4 class="text-subtitle-1 mb-2">Seleccione Formato de descarga</h4>

                    <v-radio-group v-model="formato_descarga" row dense>
                        <v-radio value="F1" label="CODIGO - DESCRIPCION - MEDIDA - CAJAS - UND - PESO" />
                        <v-radio value="F2" label="CAJAS - UND - MEDIDA - DESCRIPCION - PESO" />
                        <v-radio value="F3" label="CODIGO - DESCRIPCION - PROVEEDOR - MEDIDA - CAJAS - UND - PESO" />
                    </v-radio-group>

                    <v-textarea v-model="observacion_reporte" label="Observación" outlined dense rows="2" auto-grow
                        class="mt-3"></v-textarea>

                    <v-row class="pa-1">
                        <v-col cols="6">
                            <v-btn class="mt-2" color="success" block @click="pdf_almacen()">
                                <v-icon left>mdi-file-pdf-box</v-icon> PDF
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn class="mt-2" color="error" block @click="exportar_ex()">
                                <v-icon left>mdi-file-excel</v-icon> EXCEL
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>


        <v-dialog v-model="dialogo_imprime" max-width="490px">
            <v-card class="rounded-lg">
                <v-toolbar color="teal darken-2" dense dark><v-toolbar-title>Seleccionar
                        Formato</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialogo_imprime = false">
                        <v-icon>mdi-close</v-icon></v-btn>
                    <v-icon v-if="tiene_permiso_host" small color="orange" class="mr-2" @click="dial_config_host = true"
                        title="Configurar Impresión Host">mdi-cog</v-icon>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-btn-toggle v-model="modo_impresion_comp" mandatory class="mb-4 d-flex justify-center" rounded>
                        <v-btn value="abre" small :color="modo_impresion_comp === 'abre' ? 'teal' : ''"
                            :class="modo_impresion_comp === 'abre' ? 'white--text' : ''">
                            <v-icon left small>mdi-printer</v-icon> Imprimir
                        </v-btn>
                        <v-btn value="descarga" small :color="modo_impresion_comp === 'descarga' ? 'teal' : ''"
                            :class="modo_impresion_comp === 'descarga' ? 'white--text' : ''">
                            <v-icon left small>mdi-download</v-icon> Descargar
                        </v-btn>
                    </v-btn-toggle>
                    <v-row justify="center" class="mb-4">
                        <v-col cols="8" sm="6" md="5">
                            <v-text-field v-model.number="copias_comprobante" label="Copias" type="number" min="1"
                                max="10" dense outlined hide-details prepend-inner-icon="mdi-content-copy"
                                background-color="grey lighten-4" class="rounded-lg">
                                <template v-slot:append>
                                    <v-btn icon small
                                        @click="copias_comprobante = Math.min(copias_comprobante + 1, 10)">
                                        <v-icon small>mdi-plus</v-icon>
                                    </v-btn>
                                    <v-btn icon small @click="copias_comprobante = Math.max(copias_comprobante - 1, 1)">
                                        <v-icon small>mdi-minus</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="12" md="4">
                            <v-card outlined class="pa-3 text-center hover-card"
                                @click.prevent="imprime_comprobante('A4')">
                                <v-icon size="35" color="red">mdi-file-pdf-box</v-icon>
                                <h5 class="text-caption mt-1">PDF A4</h5>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card outlined class="pa-3 text-center hover-card"
                                @click.prevent="imprime_comprobante('80')">
                                <v-icon size="35" color="red">mdi-printer-pos</v-icon>
                                <h5 class="text-caption mt-1">Ticket 80mm</h5>
                            </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-card outlined class="pa-3 text-center hover-card"
                                @click.prevent="imprime_comprobante('58')">
                                <v-icon size="35" color="red">mdi-printer-pos</v-icon>
                                <h5 class="text-caption mt-1">Ticket 58mm</h5>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogo_guia_individual" max-width="490px">
            <v-card class="rounded-lg">
                <v-toolbar class="text-caption"
                    :color="guia_individual_tipo === 'transporte' ? 'purple darken-1' : 'cyan darken-1'" dense dark>
                    <v-toolbar-title>{{ guia_individual_tipo === 'transporte' ? 'Guía Transporte' : 'Guía Remisión'
                        }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogo_guia_individual = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text class="pa-4">
                    <v-btn-toggle v-model="modo_guia_individual" mandatory class="mb-4 d-flex justify-center" rounded>
                        <v-btn value="abre" small
                            :color="modo_guia_individual === 'abre' ? (guia_individual_tipo === 'transporte' ? 'purple' : 'cyan') : ''"
                            :class="modo_guia_individual === 'abre' ? 'white--text' : ''">
                            <v-icon left small>mdi-printer</v-icon> Imprimir
                        </v-btn>
                        <v-btn value="descarga" small
                            :color="modo_guia_individual === 'descarga' ? (guia_individual_tipo === 'transporte' ? 'purple' : 'cyan') : ''"
                            :class="modo_guia_individual === 'descarga' ? 'white--text' : ''">
                            <v-icon left small>mdi-download</v-icon> Descargar
                        </v-btn>
                    </v-btn-toggle>

                    <v-row v-if="modo_guia_individual === 'abre'" justify="center" class="mb-4">
                        <v-col cols="8" sm="6" md="5">
                            <v-text-field v-model.number="copias_guia_individual" label="Copias" type="number" min="1"
                                max="10" dense outlined hide-details prepend-inner-icon="mdi-content-copy"
                                background-color="grey lighten-4" class="rounded-lg">
                                <template v-slot:append>
                                    <v-btn icon small
                                        @click="copias_guia_individual = Math.min(copias_guia_individual + 1, 10)">
                                        <v-icon small>mdi-plus</v-icon>
                                    </v-btn>
                                    <v-btn icon small
                                        @click="copias_guia_individual = Math.max(copias_guia_individual - 1, 1)">
                                        <v-icon small>mdi-minus</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="6">
                            <v-card outlined class="pa-3 text-center hover-card"
                                @click.prevent="ejecutarImpresionGuia('A4')">
                                <v-icon size="35" color="red">mdi-file-pdf-box</v-icon>
                                <h5 class="text-caption mt-1">PDF A4</h5>
                            </v-card>
                        </v-col>
                        <v-col cols="6">
                            <v-card outlined class="pa-3 text-center hover-card"
                                @click.prevent="ejecutarImpresionGuia('80')">
                                <v-icon size="35" color="red">mdi-printer-pos</v-icon>
                                <h5 class="text-caption mt-1">Ticket 80mm</h5>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog persistent v-model="progress" max-width="500">
            <v-card class="pa-8 text-center rounded-lg">
                <h5 class="text-subtitle-1 mb-2">Procesando...</h5>
                <v-progress-linear indeterminate color="blue-grey" height="25" />
            </v-card>
        </v-dialog>
        <v-dialog persistent v-model="progress2" max-width="500">
            <v-card class="pa-8 text-center rounded-lg">
                <h5 class="text-subtitle-1 mb-2">Generando Reporte...</h5>
                <v-progress-linear v-model="skill" color="blue-grey" height="25">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>
            </v-card>
        </v-dialog>
        <v-dialog v-model="printDialog" persistent max-width="500">
            <v-card class="pa-6 rounded-lg">
                <h5 class="text-center text-subtitle-1">Imprimiendo comprobantes…</h5>
                <div class="text-center caption mb-2">
                    {{ printDone }} / {{ printTotal }} completados — faltan {{ Math.max(printTotal - printDone, 0) }}
                </div>
                <v-progress-linear :value="printPercent" height="22" color="blue-grey">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>
                <div v-if="printError" class="red--text text-caption mt-2">{{ printError }}</div>
                <div class="mt-4 d-flex justify-end">
                    <v-btn text color="primary" @click="printDialog = false" :disabled="printDone < printTotal">
                        Cerrar
                    </v-btn>
                </div>
            </v-card>
        </v-dialog>

        <impresion_guias_masivas v-model="dialogImpresionGuias" :desserts="desserts" :router-grupo="router_grupo"
            @update:impresion-completada="onImpresionCompletada" />

        <genera_guias v-if="dialogo_guia" @cierra="dialogo_guia = false" @graba="carga_Guia()" :data_guia="data_guia" />
        <dialogo_edita_c v-if="dialogo_edita_" @cierra="dialogo_edita_ = false, recalcula_cabecera()"
            :cabecera="cabecera_selecta" :detalle="detalle_selecto" />
        <imprime v-if="genera_pdf" :data="seleccionado" :detalle="detalle_selecto" @cierra="genera_pdf = $event" />
        <impresorahost v-if="dial_config_host" @cierra="dial_config_host = false" />

        <!-- Dialogo Transporte -->
        <dial_transporte v-model="dial_transporte_show" :reparto-id="router_grupo" @guardado="inicio"
            @cierre="dial_transporte_show = false" />
    </div>
</template>

<script>
import {
    Cabecera_p,
    all_Cabecera_p,
    all_detalle_p,
    allcuentaxcobrar,
    buscaGuiaremision,
    eliminar_Movimientos,
    all_serv_imp,
    grabaCabecera_p,
    modifica_pedidos,
    nueva_cabecera_reparto,
    all_periodos
} from '../../db'
import store from '@/store/index'
import fab_periodos from '@/components/fab_periodos'
import XLSX from 'xlsx'
import moment from 'moment'
import dialogo_edita_c from './dialogos/dialogo_edita_c'
import genera_guias from './dialogos/genera_guias.vue'
import impresorahost from '@/components/configEmpresa/impresorahost.vue'

import {
    pdfGenera
} from '../../pdf_comprobantes'
import {
    pdf_cuentas_cobrar
} from '../../pdf_reportes'
import {
    reporte_almacen,
    reporte_transporte,
    reporte_clientes_transporte
} from './reportes_pdf'
import imprime from '@/components/dialogos/dialog_imprime'
import {
    generaGuia
} from '../../pdf_guia'
import { reporteProductoClientePDF } from './reportes_pdf'
import axios from "axios"
import { colClientes } from '../../db_firestore'
import dial_transporte from '../reparto/dialogos/dial_transporte.vue'
import impresion_guias_masivas from './dialogos/impresion_guias_masivas.vue'
import { reporte_almacen_consolidado } from '../pedidos/reportes_pdf';
import {
    abrir_bridge_impresion,
    impresion_bridge,
    cerrar_bridge_impresion
} from '../../views/funciones/impresion_bridge'
export default {
    components: {
        dialogo_edita_c,
        imprime,
        genera_guias,
        impresorahost,
        dial_transporte,
        impresion_guias_masivas
    },
    data() {
        return {
            dial_transporte_show: false,
            dialogo_imprime: false,
            dialogImpresionGuias: false,
            dialogDetalle: false,
            pedidoSeleccionado: null,
            dialogo_motivo_anulacion: false,
            comp_anular: null,
            motivo_anulacion: '',
            motivo_seleccion: null,
            motivos_predeterminados: [
                'Error en la operación',
                'Datos del cliente incorrectos',
                'Producto/servicio cargado por error',
                'Duplicado',
                'Solicitud del cliente'
            ],
            dial_anular_masivo: false,
            motivo_anulacion_masivo: '',
            motivo_seleccion_masivo: null,
            error_motivo_masivo: '',
            anulando_masivo: false,
            regresar_pendiente_masivo: false,
            comprobantesSeleccionadosAnular: [],
            error_motivo: '',
            anulando: false,
            regresar_pendiente: false,
            seleccionado: [],
            detalle_selecto: [],
            genera_pdf: false,
            data_guia: [],
            dialogo_guia: false,
            dial_descarga: false,
            progress2: false,
            progress: false,
            skill: 0,
            dialogo_detalle: false,
            dialo_crea: false,
            desserts: [],
            date1: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            fecha_traslado: moment(String(new Date)).format('YYYY-MM-DD'),
            arrayConsolidar: [],
            modulo: [],
            vendedor: [],
            consolida_t: false,
            total_contado: 0,
            total_credito: 0,
            total_peso: 0,
            total_item: 0,
            num_doc: '',
            detalles: [],
            cabecera_total: '',
            dialo_datos: false,
            desactiva_guia: false,
            dial_impresion: false,
            inicio_impresion: 0,
            dia_envia_sunat: false,
            suma_peso: 0,
            t_general: 0,
            t_credito: 0,
            t_contado: 0,
            router_grupo: '',
            ordenar_vendedor: false,
            ordenar_correlativo: false,
            dialogo_edita_: false,
            listafiltrada: [],
            cabecera_selecta: [],
            detalle_selecto: [],
            printDialog: false,
            printTotal: 0,
            printDone: 0,
            printError: '',
            observacion_reporte: '',
            observacion_reporte: '',
            formato_descarga: 'F1', // 👈 NUEVO: formato por defecto
            moneda: 'S/',
            periodosBD: {},
            _periodoRef: null,
            dial_config_host: false,
            buscarReparto: '',
            editandoReparto: false,
            repartoEditado: '',
            modo_impresion_comp: 'abre',
            copias_comprobante: 1,
            dialogo_guia_individual: false,
            modo_guia_individual: 'abre',
            copias_guia_individual: 1,
            guia_individual_tipo: 'remision',
            guia_individual_data: null,
        }
    },
    created() {
        this.moneda = this.$store.state.moneda.find(m => m.codigo === this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/'
        this.router_grupo = this.$route.params.id
        this.inicio()

    },
    mounted() {
        all_Cabecera_p(this.router_grupo).on("value", this.onDataChange);
        this.suscribirPeriodos();
    },
    beforeDestroy() {
        all_Cabecera_p(this.router_grupo).off("value", this.onDataChange);
        if (this._periodoRef) this._periodoRef.off('value', this.onPeriodoChange);
    },
    watch: {
        router_grupo() {
            this.inicio(); // carga cabecera
            all_Cabecera_p(this.router_grupo).off("value", this.onDataChange); // limpia anterior
            all_Cabecera_p(this.router_grupo).on("value", this.onDataChange); // escucha nuevo
        }
    },
    computed: {
        esAdmin() {
            return this.$store.state.permisos?.es_admin === true;
        },
        tiene_permiso_host() {
            return store.state.permisos?.permite_impresion_host === true;
        },
        printPercent() {
            return this.printTotal ? (this.printDone / this.printTotal) * 100 : 0;
        },
        periodoCerrado() {
            const fechaRef = this.cabecera_total?.fecha_comprobantes || this.cabecera_total?.fecha_traslado;
            if (!fechaRef) return false;

            const periodoKey = moment.unix(fechaRef).format('YYYY-MM');
            const periodo = this.periodosBD[periodoKey];

            if (!periodo) {
                console.warn(`No se encontró período ${periodoKey} en periodosBD:`, this.periodosBD);
                return false;
            }

            return periodo.estado === 'close';
        },
        periodoActualKey() {
            const fechaRef = this.cabecera_total?.fecha_comprobantes || this.cabecera_total?.fecha_traslado;
            if (!fechaRef) return '';
            return moment.unix(fechaRef).format('YYYY-MM');
        },
        // Computed para verificar si hay pedidos con estado ENVIADO
        tieneEnviados() {
            return this.desserts.some(p => p.estado === 'ENVIADO');
        },

        puedeAnularMasivo() {
            const seleccionados = this.desserts.filter(d => d.consolida);
            if (seleccionados.length === 0) return false;
            return seleccionados.every(p =>
                p.estado !== 'ENVIADO' && p.estado !== 'ANULADO'
            );
        },
        puedeGenerarGuia() {
            const seleccionados = this.desserts.filter(d => d.consolida);
            if (seleccionados.length === 0) return false;
            return seleccionados.every(p => p.estado !== 'ANULADO');
        },
        puedeImprimirGuia() {
            const seleccionados = this.desserts.filter(d => d.consolida);
            if (seleccionados.length === 0) return false;
            return seleccionados.some(p => p.guia_id && p.estado !== 'ANULADO');
        },
        suma_pedidos() {
            let total = 0;
            let sum_soles = 0;
            let sum_peso = 0;
            let sum_credito = 0;
            let sum_contado = 0;

            this.desserts.forEach((pedido) => {
                if (pedido.estado !== "ANULADO") {
                    total += 1;
                    sum_soles += parseFloat(pedido.total);
                    sum_peso += parseFloat(pedido.peso_total);

                    if (pedido.pendiente_pago === 0) {
                        sum_contado += parseFloat(pedido.total);
                    } else {
                        sum_credito += parseFloat(pedido.pendiente_pago);
                    }
                }
            });

            this.t_general = sum_soles.toFixed(2);
            this.suma_peso = sum_peso.toFixed(2);
            this.t_credito = sum_credito.toFixed(2);
            this.t_contado = sum_contado.toFixed(2);

            return total;
        },
        apiBaseUrl() {
            /* const hostname = window.location.hostname;
             if (hostname === 'localhost' || hostname === '127.0.0.1') {
                 return 'http://127.0.0.1:5001/sis-distribucion/southamerica-east1/api_distribucion';
             } */
            return 'https://api-distribucion-6sfc6tum4a-rj.a.run.app';
        }
    },
    watch: {
        router_grupo() {
            this.inicio(); // actualiza cabecera
            all_Cabecera_p(this.router_grupo).off("value", this.onDataChange);
            all_Cabecera_p(this.router_grupo).on("value", this.onDataChange);
        },
        num_doc() {
            this.filtrarLista();
        },
        ordenar_vendedor() {
            this.filtrarLista();
        },
        ordenar_correlativo() {
            this.filtrarLista();
        }
    },
    methods: {
        abrirDialTransporte() {
            this.dial_transporte_show = true;
        },
        onImpresionCompletada() {
            this.dialogImpresionGuias = false;
            console.log('Impresión de guías completada');
        },
        async genera_guia(data) {
            store.commit("dialogoprogress", 1)
            const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
            // Agregar id_grupo al data para que gr_remitente pueda regresar aquí
            const cabeceraConGrupo = {
                ...data,
                id_grupo: this.router_grupo
            }
            var array = {
                arrayCabecera: cabeceraConGrupo,
                array_item: snapshot.val()
            }
            store.commit("array_guia", array)
            if (store.state.esmovil) {
                this.$router.push({
                    path: '/gr_movil'
                })
            } else {
                this.$router.push({
                    path: '/gr_remitente'
                })
            }
            store.commit("dialogoprogress", 1)
        },
        async recalcula_cabecera() {
            const resumen = {
                peso_total: 0,
                total_contado: 0,
                total_credito: 0,
                total_general: 0,
                total_pedidos: 0,
                total_anulados: 0
            };

            // Recorremos todos los comprobantes del reparto
            this.desserts.forEach(p => {
                if (p.estado === 'ANULADO') return; // no suma anulados

                resumen.peso_total += Number(p.peso_total || 0);
                resumen.total_general += Number(p.total || 0);
                resumen.total_pedidos += 1;

                const pendiente = Number(p.pendiente_pago || 0);

                if (pendiente === 0) {
                    // Todo contado
                    resumen.total_contado += Number(p.total || 0);
                } else {
                    // Crédito pendiente
                    resumen.total_credito += pendiente;
                }
            });

            // Redondeo básico
            resumen.peso_total = Number(resumen.peso_total.toFixed(2));
            resumen.total_contado = Number(resumen.total_contado.toFixed(2));
            resumen.total_credito = Number(resumen.total_credito.toFixed(2));
            resumen.total_general = Number(resumen.total_general.toFixed(2));

            // Actualiza la cabecera del reparto
            await nueva_cabecera_reparto(this.router_grupo + '/total', resumen.total_general);
            await nueva_cabecera_reparto(this.router_grupo + '/total_pedidos', resumen.total_pedidos);
            await nueva_cabecera_reparto(this.router_grupo + '/resumen', resumen);
        },

        async actualizaEstadoReparto() {
            const pedidos = this.desserts || [];
            if (!pedidos.length) return;
            const totalPedidos = pedidos.length;
            const enviados = pedidos.filter(p => p.estado === 'ENVIADO').length;
            const anulados = pedidos.filter(p => p.estado === 'ANULADO').length;

            let nuevoEstado = 'PENDIENTE';
            if (anulados === totalPedidos && totalPedidos > 0) {
                nuevoEstado = 'ANULADO';
            }
            else if (enviados === totalPedidos && totalPedidos > 0) {
                nuevoEstado = 'ENVIADO';
            }
            else if (enviados > 0 || anulados > 0) {
                nuevoEstado = 'PARCIAL';
            }

            await nueva_cabecera_reparto(this.router_grupo + '/estado', nuevoEstado);
            await nueva_cabecera_reparto(this.router_grupo + '/resumen/total_anulados', anulados);
        },

        async transferir_pedidos() {
            const seleccionados = this.desserts.filter(d =>
                d.consolida &&
                d.estado !== 'ANULADO' &&
                d.estado !== 'ENVIADO'
            );

            if (seleccionados.length === 0) {
                this.$store.commit('dialogosnackbar', 'No hay pedidos pendientes seleccionados para transferir.');
                return;
            }

            const nuevo_reparto = prompt('Ingrese el número del nuevo reparto:');
            if (!nuevo_reparto) {
                alert('Operación cancelada. No se ingresó un número de reparto válido.');
                return;
            }

            store.commit("dialogoprogress");
            var array = [];

            for (const pedido of seleccionados) {
                console.log('Transfiriendo pedido:', pedido);
                const snapshot = await all_detalle_p(this.router_grupo, pedido.numeracion).once("value");
                array.push({
                    cabecera: { ...pedido, id_grupo: nuevo_reparto },
                    items: snapshot.val()
                });
            }

            const payload = {
                grupo_antiguo: this.router_grupo,
                grupo_nuevo: nuevo_reparto,
                data: array
            };

            try {
                const idem = `transfer-${this.router_grupo}-${nuevo_reparto}-${Date.now()}`;

                const resultado = await this.api_rest(payload, 'tranferir_pedido', {
                    'X-Idempotency-Key': idem
                });
                console.log('Transferencia exitosa:', resultado);
                this.$store.commit('dialogosnackbar', 'Pedidos transferidos correctamente');
                this.inicio();
            } catch (error) {
                console.error(' Error transfiriendo pedidos:', error);
                this.$store.commit('dialogosnackbar', error.message || 'Error al transferir pedidos');
            } finally {
                store.commit("dialogoprogress");
            }
        },
        async imprimir(data) {
            store.commit("dialogoprogress");
            const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
            this.detalle_selecto = snapshot.val()
            var cliente = store.state.clientes.find(e => Number(e.documento) == Number(data.dni))
            if (cliente) {
                data.telefono = cliente.telefono || ''
                data.referencia = cliente.referencia || ''
            }
            this.seleccionado = data
            store.commit("dialogoprogress");
            this.genera_pdf = true
        },
        async reporte_cobrar() {
            store.commit("dialogoprogress");

            let r = await this.busca_creditos(this.desserts);

            // Filtrar elementos únicos por `doc_ref`
            const uniqueR = r.filter(
                (current, index, self) =>
                    self.findIndex((item) => item.doc_ref === current.doc_ref) === index
            );

            // Generar PDF de cuentas por cobrar
            pdf_cuentas_cobrar(uniqueR);

            store.commit("dialogoprogress");
        },
        async pdf_transporte() {
            store.commit("dialogoprogress");

            const array = this.desserts.filter(
                (item) => item.consolida && item.estado !== "ANULADO"
            );

            const r = await this.consultadetalles_pdf(array);
            store.commit("dialogoprogress");

            // Generar reporte de transporte
            reporte_transporte(r);
        },
        async pdf_clientes_transporte() {
            store.commit("dialogoprogress");
            const array = this.desserts.filter(
                (item) => item.consolida && item.estado !== "ANULADO"
            );

            if (!array.length) {
                store.commit("dialogoprogress");
                this.$store.commit('dialogosnackbar', 'Seleccione al menos un pedido.');
                return;
            }
            array.sort((a, b) => {
                const va = String(a.vendedor || '').toUpperCase();
                const vb = String(b.vendedor || '').toUpperCase();

                if (va === vb) {
                    return String(a.numeracion || '').localeCompare(String(b.numeracion || ''));
                }
                return va.localeCompare(vb);
            });

            try {
                const r = await this.consultadetalles_pdf(array);
                reporte_clientes_transporte(r);
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'Error generando reporte de clientes transporte.');
            } finally {
                store.commit("dialogoprogress");
            }
        },
        async pdf_almacen() {
            try {
                store.commit("dialogoprogress", true);
                const pedidosSeleccionados = this.desserts
                    .filter(d => d.consolida && d.estado !== 'ANULADO')
                    .map(d => d.numeracion);
                const payload = {
                    bd: this.$store.state.baseDatos.bd,
                    metodo: "productos_consolidados_almacen",
                    data: {
                        repartos: [this.router_grupo]
                    }
                };

                if (pedidosSeleccionados.length > 0) {
                    payload.data.pedidos = pedidosSeleccionados;
                }
                const response = await axios.post(this.apiBaseUrl, payload);
                if (!response.data?.data) {
                    throw new Error('No se recibieron datos');
                }

                const {
                    productos,
                    pesoTotal,
                    totalCajas,
                    totalUnd
                } = response.data.data;
                if (pedidosSeleccionados.length > 0) {
                    this.$store.commit('dialogosnackbar', `Generando reporte para ${pedidosSeleccionados.length} pedido(s) seleccionado(s)`);
                }

                reporte_almacen_consolidado(
                    this.router_grupo,
                    pesoTotal,
                    productos,
                    totalCajas,
                    totalUnd,
                    this.observacion_reporte,
                    this.formato_descarga,
                    pedidosSeleccionados.length > 0 ? pedidosSeleccionados : null
                );

                this.dial_descarga = false;

            } catch (e) {
                console.error('Error:', e);
                this.$store.commit('dialogosnackbar', 'Error al generar el reporte');
            } finally {
                store.commit("dialogoprogress", false);
            }
        },
        filtrarLista() {
            let array = this.desserts.filter((item) =>
                (item.numeracion + item.cliente)
                    .toLowerCase()
                    .includes(this.num_doc.toLowerCase())
            );

            if (this.ordenar_vendedor) {
                array.sort((a, b) => a.vendedor.localeCompare(b.vendedor));
            }

            if (this.ordenar_correlativo) {
                array.sort((a, b) => a.numeracion.localeCompare(b.numeracion));
            }

            this.listafiltrada = array;
        },
        async actualiza_guia(data) {
            if (confirm('Seguro de generar Guia?')) {
                var snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value")
                var array = {
                    cabecera: data,
                    items: snapshot.val()
                }
                store.commit('productos_guia', array)
                this.$router.push({
                    path: "/gr_remitente/"
                })
            }
        },
        async abare_guias() {
            // Solo seleccionados (consolida) y no anulados
            const seleccionados = this.desserts.filter(d => d.consolida && d.estado !== 'ANULADO');

            if (!seleccionados.length) {
                this.$store.commit('dialogosnackbar', 'Seleccione al menos un comprobante.');
                return;
            }

            // Helper: código SUNAT de medida (NIU/KGM/TNE, etc.)
            const medCode = (nombre) => {
                const it = this.$store.state.medidassunat?.find(m => m.nombre === nombre);
                return it ? it.corto : 'NIU'; // fallback
            };

            try {
                this.$store.commit('dialogoprogress'); // abre

                const conItems = [];

                for (const d of seleccionados) {
                    // Lee detalle del comprobante
                    const snap = await all_detalle_p(this.router_grupo, d.numeracion).once('value');

                    const items = [];
                    let pesoComprobante = 0;

                    if (snap && snap.exists()) {
                        snap.forEach((s) => {
                            const v = s.val() || {};

                            // Busca en el maestro para completar peso si no viene en el detalle
                            const prod = this.$store.state.productos?.find(
                                p => String(p.id) === String(v.id)
                            ) || {};

                            // Peso unitario con tolerancia a distintos campos
                            const pesoUnit = Number(prod.peso)

                            const cantidad = Number(v.cantidad || 0);

                            // Peso del ítem = peso unitario * cantidad (si necesitas factor por caja, ajusta aquí)
                            const pesoItem = Number((pesoUnit * cantidad).toFixed(3));
                            pesoComprobante += pesoItem;

                            items.push({
                                uuid: v.id,
                                cantidad,
                                medida: medCode(v.medida),   // código SUNAT
                                des_medida: v.medida,        // descripción
                                cod_producto: v.id,
                                descripcion: v.nombre,
                                // campos útiles extra para trazabilidad
                                peso: Number(pesoUnit.toFixed(3)),
                                peso_total_item: pesoItem,
                            });
                        });
                    }

                    const peso_total_final = Number((pesoComprobante).toFixed(3));

                    let direccion = d.direccion;
                    let ubigeo = d.ubigeo;
                    if ((!direccion || !ubigeo) && Array.isArray(this.$store.state.clientes)) {
                        const cli = this.$store.state.clientes.find(
                            c => String(c.documento) === String(d.dni)
                        );
                        if (cli) {
                            direccion = direccion || cli.direccion || '';
                            ubigeo = ubigeo || cli.ubigeo || '';
                        }
                    }

                    // Adjunta items y peso calculado al comprobante
                    conItems.push({
                        ...d,
                        direccion,
                        ubigeo,
                        items,
                        peso_total: Number(peso_total_final.toFixed(3)),
                    });
                }

                // Enviar al componente generador masivo
                this.data_guia = {
                    id_grupo: this.router_grupo,
                    desserts: conItems,
                };
                this.dialogo_guia = true;
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'No se pudieron cargar los ítems.');
            } finally {
                this.$store.commit('dialogoprogress'); // cierra
            }
        },


        async imprime_guia(data) {
            this.guia_individual_tipo = 'remision';
            this.guia_individual_data = data.guia_id;
            this.dialogo_guia_individual = true;
        },

        /* async imprime_guia(data) {
            var snapshot = await buscaGuiaremision(data.guia_id).once("value")
            console.log(snapshot.val())
            if (snapshot.exists()) {
                var arraydatos = snapshot.val()
                generaGuia(arraydatos, store.state.configImpresora.tamano)
            }
        }, */
        inicio() {
            Cabecera_p(this.router_grupo)
                .once("value").then((snapshot) => {
                    var data = snapshot.val()
                    console.log('inci', data)
                    this.cabecera_total = {
                        id_grupo: this.router_grupo,
                        contado: data.contado,
                        credito: data.credito,
                        total: (parseFloat(data.credito) + parseFloat(data.contado)).toFixed(2),
                        peso: data.peso,
                        guia: data.guia,
                        pedidos: data.pedidos,
                        fecha_traslado: data.fecha_traslado,
                        envio_stock: data.envio_stock,
                        fecha_comprobantes: data.fecha_comprobantes,
                        d_transporte: data.d_transporte || null
                    }
                    this.total_peso = data.peso
                })
        },
        async anterior() {
            if (parseInt(this.router_grupo) <= 1) {
                this.$store.commit('dialogosnackbar', 'Ya estás en el primer reparto');
                return;
            }

            const corre = (parseInt(this.router_grupo) - 1).toString().padStart(4, '0');

            try {
                const snapshot = await Cabecera_p(corre).once('value');

                if (!snapshot.exists()) {
                    this.$store.commit('dialogosnackbar', 'El reparto anterior no existe');
                    return;
                }

                const esAccesible = await this._repartoEsAccesible(corre);

                if (esAccesible) {
                    this.router_grupo = corre;
                } else {
                    // Buscar automáticamente el anterior reparto accesible
                    const anteriorAccesible = await this.buscarAnteriorAccesible(parseInt(corre));
                    if (anteriorAccesible) {
                        this.router_grupo = anteriorAccesible;
                    }
                }
            } catch (error) {
                console.error('Error en anterior:', error);
                this.$store.commit('dialogosnackbar', 'Error al cargar el reparto');
            }
        },
        async siguiente() {
            const corre = (parseInt(this.router_grupo) + 1).toString().padStart(4, '0');

            try {
                const snapshot = await Cabecera_p(corre).once('value');

                if (!snapshot.exists()) {
                    this.$store.commit('dialogosnackbar', 'NO EXISTEN MÁS REPARTOS');
                    return;
                }

                const esAccesible = await this._repartoEsAccesible(corre);

                if (esAccesible) {
                    this.router_grupo = corre;
                } else {
                    // Buscar automáticamente el siguiente reparto accesible
                    const siguienteAccesible = await this.buscarSiguienteAccesible(parseInt(corre));
                    if (siguienteAccesible) {
                        this.router_grupo = siguienteAccesible;
                    }
                }
            } catch (error) {
                console.error('Error en siguiente:', error);
                this.$store.commit('dialogosnackbar', 'Error al cargar el reparto');
            }
        },


        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                data.consolida = false; // estado inicial
                array.push(data);
            });
            console.log(array)
            this.desserts = array;
            this.filtrarLista(); // 👈 importante
        },

        async busca_creditos(data) {
            const array_cuentas = [];

            try {
                // Crear un array de promesas para cada consulta
                const promesas = data.map(async (items) => {
                    const snapshot = await allcuentaxcobrar()
                        .orderByChild("documento")
                        .equalTo(items.dni)
                        .once("value");

                    if (snapshot.exists()) {
                        snapshot.forEach((item) => {
                            if (Number(item.val().monto_pendiente) != 0)
                                array_cuentas.push(item.val());
                        });
                    }
                });

                // Esperar a que todas las promesas se completen
                await Promise.all(promesas);

                return array_cuentas;
            } catch (error) {
                console.error("Error en busca_creditos:", error);
                throw error; // Lanzar el error para manejarlo fuera
            }
        },

        consolida_todo() {
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].estado !== 'ANULADO') {
                    this.desserts[i].consolida = this.consolida_t;
                } else {
                    this.desserts[i].consolida = false;
                }
            }
        },
        async cargaData(value) {
            try {
                // Abrir el diálogo de progreso
                store.commit("dialogoprogress", true);

                // Limpiar el arrayConsolidar
                this.arrayConsolidar = [];

                // Obtener los detalles de la base de datos
                const snapshot = await all_detalle_p(this.router_grupo, value.numeracion).once("value");

                console.log(snapshot.val());

                // Procesar los datos obtenidos
                snapshot.forEach((item) => {
                    const producto = item.val();
                    producto.total = (parseFloat(producto.precio) * parseFloat(producto.cantidad)).toFixed(2);
                    this.arrayConsolidar.push(producto);
                });

                // Mostrar el diálogo de detalle
                this.dialogo_detalle = true;
            } catch (error) {
                console.error("Error en cargaData:", error);
                store.commit("dialogosnackbar", "Ocurrió un error al cargar los datos.");
            } finally {
                // Cerrar el diálogo de progreso
                store.commit("dialogoprogress", false);
            }
        },
        carga_Guia() {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            this.consuta_detalle(this.desserts).then(() => {
                this.arrayConsolidar.sort(function (a, b) {
                    if (a.nombre > b.nombre) {
                        return 1;
                    }
                    if (a.nombre < b.nombre) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                var data = {
                    total_peso: this.suma_peso,
                }
                var array = [this.arrayConsolidar, data]
                store.commit("dialogoprogress")
                store.commit('data_guia', array)
                store.commit('dialogo_guia', false)
            })
        },
        ver_detalle_masivo() {
            store.commit("dialogoprogress")
            this.arrayConsolidar = []
            this.consuta_detalle(this.desserts).then(() => {
                this.arrayConsolidar.sort(function (a, b) {
                    if (a.nombre > b.nombre) {
                        return 1;
                    }
                    if (a.nombre < b.nombre) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                store.commit("dialogoprogress")
                this.dialogo_detalle = true
            })
        },
        async consuta_detalle(arrays) {

            for (const data of arrays) {
                if (data.consolida) {
                    const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
                    snapshot.forEach((item) => {
                        const producto = item.val();
                        const invet = store.state.productos.find((id) => String(id.id) === String(producto.id));
                        console.log(producto.id, invet)
                        if (!invet) return;

                        let cantidad = parseFloat(producto.cantidad) * parseFloat(invet.factor);
                        if (producto.medida === "UNIDAD" && invet.factor > 1) {
                            cantidad = parseFloat(producto.cantidad);
                        }

                        // Buscar producto existente en arrayConsolidar
                        const index = this.arrayConsolidar.findIndex((p) => p.id === producto.id);

                        if (index === -1) {
                            // Producto no existe, agregarlo
                            this.arrayConsolidar.push({
                                id: producto.id,
                                nombre: producto.nombre,
                                medida: invet.medida,
                                cantidad: cantidad,
                                peso: (parseFloat(producto.peso) * parseFloat(producto.cantidad)).toFixed(2),
                                precio: producto.precio,
                                total: (parseFloat(producto.precio) * parseFloat(producto.cantidad)).toFixed(2),
                            });
                        } else {
                            // Producto existente, actualizar valores
                            const consolidado = this.arrayConsolidar[index];

                            consolidado.cantidad += cantidad;
                            consolidado.peso = (
                                parseFloat(consolidado.peso) +
                                parseFloat(producto.peso) * parseFloat(producto.cantidad)
                            ).toFixed(2);
                            consolidado.total = (
                                parseFloat(consolidado.total) +
                                parseFloat(producto.precio) * parseFloat(producto.cantidad)
                            ).toFixed(2);
                        }
                    });
                }
            }

            return this.arrayConsolidar;
        },

        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YY')
        },

        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        Exporta_excel() {
            var data = XLSX.utils.json_to_sheet(this.arrayConsolidar)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "Ordenes")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExporta = false
        },
        async imprime_comprobante(tamano) {
            const array = this.desserts.filter(
                item => item.consolida === true && item.estado !== 'ANULADO'
            );

            if (!array.length) {
                this.$store.commit('dialogosnackbar', 'Seleccione al menos un comprobante.');
                return;
            }

            this.dialogo_imprime = false;
            this.printTotal = array.length;
            this.printDone = 0;
            this.printError = '';
            this.printDialog = true;

            try {
                await abrir_bridge_impresion();

                for (let i = 0; i < array.length; i++) {
                    try {
                        const data = { ...array[i] };

                        const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");

                        if (!snapshot.exists()) {
                            throw new Error('Comprobante sin detalle');
                        }

                        const arraydatos = snapshot.val();

                        const docCliente = await colClientes().doc(String(data.dni)).get();
                        if (docCliente.exists) {
                            const datas = docCliente.data() || {};
                            data.referencia = this.getReferenciaPrincipal(datas) || datas.referencia || '';
                        }

                        const resp = await pdfGenera(
                            arraydatos,
                            data,
                            tamano,
                            this.modo_impresion_comp
                        );

                        await impresion_bridge(
                            resp,
                            this.copias_comprobante || 1,
                            `${data.numeracion}-${i}-${Date.now()}`,
                            i === array.length - 1
                        );

                        this.printDone = i + 1;

                        // pausa corta para PCs lentas
                        await new Promise(resolve => setTimeout(resolve, 50));
                    } catch (error) {
                        console.error('Error en comprobante:', error);
                        this.printError = `Error en comprobante ${i + 1}: ${error.message}`;

                        const continuar = confirm(`Error en comprobante ${i + 1}. ¿Continuar con los siguientes?`);
                        if (!continuar) break;
                    }
                }

                this.$store.commit(
                    'dialogosnackbar',
                    this.modo_impresion_comp === 'descarga'
                        ? 'Descarga completada'
                        : 'Documentos enviados a la cola de impresión'
                );
            } finally {
                this.printDialog = false;
                await cerrar_bridge_impresion();
            }
        },
        getReferenciaPrincipal(cliente) {
            if (!cliente || !Array.isArray(cliente.direcciones) || cliente.direcciones.length === 0) return '';
            const dir = cliente.direcciones.find(d => d && d.principal) || cliente.direcciones[0];
            return (dir && dir.referencia) ? String(dir.referencia).trim() : '';
        },
        async edita_c(cabecera) {
            console.log(cabecera)
            store.commit("dialogoprogress");
            var snapshot = await all_detalle_p(this.router_grupo, cabecera.numeracion).once("value")
            var detalle = snapshot.val()
            if (snapshot.exists()) {
                console.log(snapshot.val())
                this.cabecera_selecta = cabecera
                this.detalle_selecto = detalle
                this.dialogo_edita_ = true
            }
            store.commit("dialogoprogress");
        },
        async busca_cuentas(doc) {
            var lista = []
            var snapshot = await allcuentaxcobrar().orderByChild("documento").equalTo(String(doc)).once("value")
            if (snapshot.exists()) {
                snapshot.forEach((item) => {
                    var dat = item.val()
                    console.log(dat)
                    if (Number(dat.monto_pendiente) != 0) {
                        lista.push(item.val())
                    }
                })
            }
            return lista
        },
        async consultadetalles_pdf(arrays) {
            var i = 0
            var arrayDetalle = []
            for (var i = 0; i < arrays.length; i++) {
                var items = arrays[i]
                var array_tempo = []
                var snapshot = await all_detalle_p(this.router_grupo, items.numeracion).once("value")
                var total = 0
                snapshot.forEach((item) => {
                    let value = item.val();
                    /*  if (value.operacion != 'GRATUITA') {
                          total = total + (value.precioedita * value.cantidad)
                      }*/

                    var tg = false
                    if (value.operacion == 'GRATUITA') {
                        tg = true
                    }
                    array_tempo.push({
                        cantidad: parseFloat(value.cantidad),
                        id: value.id,
                        nombre: value.nombre,
                        medida: value.medida,
                        precio: parseFloat(value.precio),
                        observacion: value.observacion,
                        tg: tg
                    })
                })
                //    console.log(items.total, total.toFixed(2))
                //    items.total = total.toFixed(2)
                var t = []
                if (items.forma_pago == 'CREDITO') {
                    t = await this.busca_cuentas(items.dni)
                }

                var array_cabe = {
                    total: this.t_general,
                    peso: this.suma_peso,
                    pedidos: this.suma_pedidos,
                    contado: this.t_contado,
                    credito: this.t_credito,
                    id_grupo: this.router_grupo
                }
                arrayDetalle[i] = new Array(3)
                arrayDetalle[i][0] = array_tempo
                arrayDetalle[i][1] = items
                arrayDetalle[i][2] = array_cabe
                arrayDetalle[i][3] = t
                this.detalles = arrayDetalle
            }
            return arrayDetalle
        },

        async procesa_stock() {

            for (var i = 0; i < this.desserts.length; i++) {
                var data = this.desserts[i]
                console.log(data)

                var snap = await all_detalle_p(this.router_grupo, data.numeracion).once("value")
                snap.forEach((item) => {
                    var items = item.val()
                    console.log(items.key_mov)
                })


            }
        },
        iniciarEdicion() {
            this.repartoEditado = this.router_grupo;
            this.editandoReparto = true;
            this.$nextTick(() => {
                if (this.$refs.inputReparto) {
                    this.$refs.inputReparto.focus();
                    const input = this.$refs.inputReparto.$el.querySelector('input');
                    if (input) input.select();
                }
            });
        },

        cancelarEdicion() {
            this.editandoReparto = false;
            this.repartoEditado = '';
        },

        async confirmarCambioReparto() {
            if (!this.repartoEditado) {
                this.cancelarEdicion();
                return;
            }

            const repartoBuscado = this.repartoEditado.padStart(4, '0');

            try {
                const snapshot = await Cabecera_p(repartoBuscado).once('value');

                if (!snapshot.exists()) {
                    this.$store.commit('dialogosnackbar', 'El reparto no existe');
                    this.$nextTick(() => {
                        if (this.$refs.inputReparto) {
                            this.$refs.inputReparto.focus();
                        }
                    });
                    return;
                }

                const esAccesible = await this._repartoEsAccesible(repartoBuscado);

                if (esAccesible) {
                    this.router_grupo = repartoBuscado;
                    this.cancelarEdicion();
                } else {
                    this.$store.commit('dialogosnackbar', 'No tienes permiso para ver este reparto');
                    this.$nextTick(() => {
                        if (this.$refs.inputReparto) {
                            this.$refs.inputReparto.focus();
                        }
                    });
                }
            } catch (error) {
                console.error('Error en confirmarCambioReparto:', error);
                this.$store.commit('dialogosnackbar', 'Error al buscar el reparto');
            }
        },

        finaliza(data) {
            console.log(data)
            this.progress = false
        },
        async exportar_ex() {
            store.commit("dialogoprogress");
            this.arrayConsolidar = [];

            const array = this.desserts.filter(
                (item) => item.consolida === true && item.estado !== 'ANULADO'
            );

            await this.consuta_detalle(array);

            // Ordenar por nombre y luego por id
            this.arrayConsolidar.sort((a, b) => {
                if (a.nombre > b.nombre) return 1;
                if (a.nombre < b.nombre) return -1;
                return 0;
            });
            this.arrayConsolidar.sort((a, b) => {
                if (a.id > b.id) return 1;
                if (a.id < b.id) return -1;
                return 0;
            });

            const dataConsolidada = this.arrayConsolidar;
            const filas = [];

            for (let i = 0; i < dataConsolidada.length; i++) {
                const dd = dataConsolidada[i];
                const invet = store.state.productos.find(
                    (id) => String(id.id) === String(dd.id)
                );

                const valor = await this.convierte_stock(
                    Number(dd.cantidad),
                    Number(invet?.factor || 1)
                );

                const pesoTotal = Number(dd.peso || 0);

                if (this.formato_descarga === 'F1') {
                    // CODIGO - DESCRIPCION - MEDIDA - CAJAS - UND - PESO
                    filas.push({
                        CODIGO: dd.id,
                        DESCRIPCION: dd.nombre,
                        MEDIDA: 'UND',
                        CAJAS: valor.entero,
                        UND: valor.und,
                        PESO: pesoTotal,
                    });
                } else {
                    // F2: CAJAS - UND - MEDIDA - DESCRIPCION - PESO
                    filas.push({
                        CAJAS: valor.entero,
                        UND: valor.und,
                        MEDIDA: 'UND',
                        DESCRIPCION: dd.nombre,
                        PESO: pesoTotal,
                    });
                }
            }

            const hoja = XLSX.utils.json_to_sheet(filas);
            const workbook = XLSX.utils.book_new();
            const filename = 'rep_reparto_almacen';

            XLSX.utils.book_append_sheet(workbook, hoja, "almacen");
            XLSX.writeFile(workbook, `${filename}.xlsx`);

            store.commit("dialogoprogress");
        },

        async convierte_stock(stock, factor) {
            var cajas = Math.floor(stock / factor)
            var und = stock - cajas * factor
            var regresa = {
                entero: cajas,
                und: und
            }
            return regresa
        },
        async anular(data) {
            this.abrirDialogoAnulacion(data);
        },
        async envia_sunat() {
            if (!confirm("Esta seguro de procesar reparto?, solo Boletas y facturas seran enviadas a sunat")) {
                return
            }
            const seleccionados = this.listafiltrada.filter(
                x => x.consolida && x.estado === 'PENDIENTE'
            );

            if (!seleccionados.length) {
                this.$store.commit('dialogosnackbar', 'Seleccione comprobantes con estado PENDIENTE para enviar.');
                return;
            }

            try {
                store.commit("dialogoprogress");

                const array = {
                    cabeceras: seleccionados,
                    id_reparto: this.router_grupo
                };

                await this.api_rest(array, 'sunat_reparto');
                await this.actualizaEstadoReparto();

                this.$store.commit('dialogosnackbar', 'Envío a Sunat iniciado correctamente.');
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'Ocurrió un error al enviar a Sunat.');
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async api_rest(data, metodo, headers = {}) {
            console.log('Llamando a API:', { metodo, data, url: this.apiBaseUrl });
            try {
                const response = await axios({
                    method: 'POST',
                    url: this.apiBaseUrl,
                    headers: headers,
                    data: {
                        "bd": this.$store.state.baseDatos.bd,
                        "data": data,
                        "metodo": metodo
                    }
                });

                return response.data;
            } catch (error) {
                console.error('Error en api_rest:', error);
                if (error.message === 'Network Error') {
                    throw new Error(`No se pudo conectar al servidor. Verifica que la API esté disponible en ${this.apiBaseUrl}`);
                }
                throw error;
            }
        },
        abrirDialogoAnulacion(item) {
            this.comp_anular = item;
            this.motivo_anulacion = '';
            this.motivo_seleccion = null;
            this.error_motivo = '';
            this.regresar_pendiente = false;
            this.dialogo_motivo_anulacion = true;
        },

        cerrarDialogoAnulacion() {
            this.dialogo_motivo_anulacion = false;
            this.comp_anular = null;
            this.motivo_anulacion = '';
            this.motivo_seleccion = null;
            this.error_motivo = '';
            this.regresar_pendiente = false;
        },

        sincronizaMotivo(val) {
            if (val && !this.motivo_anulacion) this.motivo_anulacion = val;
        },

        async confirmarAnulacion() {
            if (!this.motivo_anulacion) {
                this.error_motivo = 'Ingrese el motivo';
                return;
            }
            if (!this.comp_anular) return;

            try {
                this.anulando = true;

                const snap = await all_detalle_p(this.router_grupo, this.comp_anular.numeracion).once('value');
                const detalle = snap.val() || [];

                const cabAPI = {
                    ...this.comp_anular,
                    id: `${this.router_grupo}-${this.comp_anular.numeracion}`,
                    id_grupo: this.router_grupo,
                    id_documento: this.comp_anular.numeracion,
                    id_pedido: this.comp_anular.id_pedido,
                };

                const payload = {
                    cabecera: cabAPI,
                    detalle,
                    control_stock: !this.regresar_pendiente,
                    motivo_anulacion: this.motivo_anulacion,
                    regresar_pendiente: this.regresar_pendiente,
                };

                const idem = `anula-${this.router_grupo}-${this.comp_anular.numeracion}`;

                await this.api_rest(payload, 'anular_pedido', {
                    'X-Idempotency-Key': idem
                });

                this.recalcula_cabecera();
                this.actualizaEstadoReparto();

                this.$store.commit('dialogosnackbar',
                    this.regresar_pendiente
                        ? 'Comprobante anulado SIN revertir stock. Pedido regresó a pendiente.'
                        : 'Comprobante anulado CON reversión de stock.'
                );

                this.cerrarDialogoAnulacion();
            } catch (e) {
                console.error(e);
                this.$store.commit('dialogosnackbar', 'Ocurrió un error al anular.');
            } finally {
                this.anulando = false;
            }
        },
        async anular_masivo() {
            const seleccionados = this.desserts.filter(d => d.consolida && d.estado !== 'ANULADO');

            if (seleccionados.length === 0) {
                this.$store.commit('dialogosnackbar', 'No hay comprobantes válidos seleccionados.');
                return;
            }

            this.comprobantesSeleccionadosAnular = seleccionados;
            this.motivo_anulacion_masivo = '';
            this.motivo_seleccion_masivo = null;
            this.error_motivo_masivo = '';
            this.regresar_pendiente_masivo = false;
            this.dial_anular_masivo = true;
        },

        sincronizaMotivoMasivo(val) {
            if (val && !this.motivo_anulacion_masivo) this.motivo_anulacion_masivo = val;
        },

        async confirmarAnulacionMasiva() {
            if (!this.motivo_anulacion_masivo) {
                this.error_motivo_masivo = 'Ingrese el motivo';
                return;
            }

            try {
                this.anulando_masivo = true;

                for (const comp of this.comprobantesSeleccionadosAnular) {
                    try {
                        const snap = await all_detalle_p(this.router_grupo, comp.numeracion).once('value');
                        const detalle = snap.val() || [];

                        const cabAPI = {
                            ...comp,
                            id: `${this.router_grupo}-${comp.numeracion}`,
                            id_grupo: this.router_grupo,
                            id_documento: comp.numeracion,
                            id_pedido: comp.id_pedido,
                        };

                        const payload = {
                            cabecera: cabAPI,
                            detalle,
                            control_stock: !this.regresar_pendiente_masivo,
                            motivo_anulacion: this.motivo_anulacion_masivo,
                            regresar_pendiente: this.regresar_pendiente_masivo,
                        };

                        const idem = `anula-${this.router_grupo}-${comp.numeracion}`;

                        await this.api_rest(payload, 'anular_pedido', {
                            'X-Idempotency-Key': idem
                        });

                    } catch (e) {
                        console.error(`Error anulando ${comp.numeracion}:`, e);
                    }
                }

                this.recalcula_cabecera();
                this.actualizaEstadoReparto();

                this.$store.commit('dialogosnackbar',
                    `${this.comprobantesSeleccionadosAnular.length} comprobantes anulados.`
                );

                this.dial_anular_masivo = false;
            } catch (e) {
                console.error('Error en anulación masiva:', e);
                this.error_motivo_masivo = 'Ocurrió un error al anular masivamente.';
            } finally {
                this.anulando_masivo = false;
            }
        },

        // (Tu método anular viejo ya no se usa, lo puedes retirar o dejar redirigiendo)
        async anular(data) {
            // Redirige al nuevo flujo con diálogo
            this.abrirDialogoAnulacion(data);
        },
        // 🔗 ADICIÓN: helpers para detectar Electron y abrir deep link
        esElectron() {
            // En BrowserWindow, el userAgent incluye "Electron/<ver>"
            return /\belectron\/\d+/i.test(navigator.userAgent);
        },
        esEscritorioNavegador() {
            // No Electron y no móvil (usando tu breakpoint Vuetify)
            const isMobile = this.$vuetify?.breakpoint?.smAndDown;
            return !this.esElectron() && !isMobile;
        },
        abrirElectronDeepLink(params = {}) {
            const PROTO = 'domotica';
            const q = new URLSearchParams(params).toString();
            // 👇 barra después de 'print' para que el main parsee bien: domotica://print/?...
            const url = `${PROTO}://print/${q ? `?${q}` : ''}`;

            window.location.href = url;

            setTimeout(() => {
                this.$store?.commit?.('dialogosnackbar', 'Si no se abrió la app de escritorio, instálala y vuelve a intentar.');
            }, 1500);
        },
        async reporte_producto_cliente() {
            store.commit("dialogoprogress");

            const arrays = this.desserts.filter(d => d.estado != "ANULADO") || [];

            // 🗓️ rango de fechas (antigua y reciente)
            const ts = arrays.map(x => Number(x.fecha) || 0).filter(Boolean);
            const fechaIni = ts.length ? Math.min(...ts) : null;   // más antigua
            const fechaFin = ts.length ? Math.max(...ts) : null;   // más reciente

            const rangoFechas = {
                fecha_ini: fechaIni,
                fecha_fin: fechaFin,
                fecha_ini_str: fechaIni ? moment.unix(fechaIni).format("DD/MM/YYYY") : "",
                fecha_fin_str: fechaFin ? moment.unix(fechaFin).format("DD/MM/YYYY") : ""
            };

            const datas = [];
            for (const data of arrays) {
                const snapshot = await all_detalle_p(this.router_grupo, data.numeracion).once("value");
                datas.push({ cabecera: data, detalle: snapshot.val() });
            }

            // 👉 pásalo al generador
            reporteProductoClientePDF(datas, rangoFechas);

            store.commit("dialogoprogress");
        },
        async ver_detalle(item) {
            console.log('cabecera', item)
            this.$store.commit("dialogoprogress");
            console.log(this.router_grupo, item.numeracion)
            var snap = await all_detalle_p(this.router_grupo, item.numeracion).once("value")
            const detalle = snap.val();
            this.$store.commit("dialogoprogress");
            this.dialogDetalle = true;
            this.pedidoSeleccionado = detalle
            console.log(this.pedidoSeleccionado);
            // Aquí puedes abrir un diálogo o hacer lo que necesites con el detalle

        },

        onPeriodoChange(snapshot) {
            this.periodosBD = snapshot.val() || {};
        },
        suscribirPeriodos() {
            if (this._periodoRef) this._periodoRef.off('value', this.onPeriodoChange);
            this._periodoRef = all_periodos();
            this._periodoRef.on('value', this.onPeriodoChange);
        },

        async _repartoEsAccesible(grupo) {
            if (!grupo) return false;

            const currentUserId = this.$store.state.permisos.token || '';

            try {
                // Obtener la referencia directa a la cabecera del reparto
                const snapshot = await Cabecera_p(grupo).once('value');
                const repartoData = snapshot.val();

                // Si el reparto no existe, no es accesible
                if (!repartoData) return false;

                // Obtener el usuario asignado del objeto d_transporte
                const usuarioAsignado = repartoData.d_transporte?.usuario_id || '';

                // Regla de acceso:
                // - Si NO tiene usuario asignado (usuarioAsignado es ''), es ACCESIBLE para todos.
                // - Si TIENE usuario asignado, solo es ACCESIBLE si coincide con el currentUserId.
                return !usuarioAsignado || usuarioAsignado === currentUserId;
            } catch (error) {
                console.error(`Error al verificar accesibilidad del reparto ${grupo}:`, error);
                return false; // En caso de error, denegamos el acceso por seguridad.
            }
        },
        async buscarSiguienteAccesible(desde) {
            let grupoActual = parseInt(desde);
            const maxIntentos = 100; // Límite para evitar bucle infinito

            for (let i = 0; i < maxIntentos; i++) {
                const siguiente = (grupoActual + 1).toString().padStart(4, '0');
                const snapshot = await Cabecera_p(siguiente).once('value');

                if (!snapshot.exists()) {
                    this.$store.commit('dialogosnackbar', 'No hay más repartos accesibles');
                    return null;
                }

                const esAccesible = await this._repartoEsAccesible(siguiente);
                if (esAccesible) {
                    return siguiente;
                }

                grupoActual++;
            }

            this.$store.commit('dialogosnackbar', 'No se encontraron más repartos accesibles');
            return null;
        },

        async buscarAnteriorAccesible(desde) {
            let grupoActual = parseInt(desde);
            const maxIntentos = 100;

            for (let i = 0; i < maxIntentos; i++) {
                if (grupoActual <= 1) {
                    this.$store.commit('dialogosnackbar', 'No hay repartos anteriores accesibles');
                    return null;
                }

                const anterior = (grupoActual - 1).toString().padStart(4, '0');
                const snapshot = await Cabecera_p(anterior).once('value');

                if (!snapshot.exists()) break;

                const esAccesible = await this._repartoEsAccesible(anterior);
                if (esAccesible) {
                    return anterior;
                }

                grupoActual--;
            }

            this.$store.commit('dialogosnackbar', 'No se encontraron repartos anteriores accesibles');
            return null;
        },
        async ejecutarImpresionGuia(formato) {
            this.dialogo_guia_individual = false;
            this.$store.commit('dialogoprogress', 1);

            try {
                let snapshot;

                if (this.guia_individual_tipo === 'transporte') {
                    // snapshot = await buscarGuiaTransporte(this.guia_individual_data).once('value');
                    this.$store.commit('dialogosnackbar', 'Función de guía transporte en desarrollo');
                    return;
                } else {
                    snapshot = await buscaGuiaremision(this.guia_individual_data).once('value');
                }

                if (snapshot.exists()) {
                    const arraydatos = snapshot.val();

                    if (this.modo_guia_individual === 'descarga') {
                        for (let c = 1; c <= this.copias_guia_individual; c++) {
                            if (c > 1) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }

                            const dataConCopia = {
                                ...arraydatos,
                                numero_copia: c,
                                total_copias: this.copias_guia_individual
                            };

                            generaGuia(dataConCopia, formato, this.modo_guia_individual, 1);
                        }
                    } else {
                        generaGuia(arraydatos, formato, this.modo_guia_individual, this.copias_guia_individual);
                    }

                    this.$store.commit('dialogosnackbar',
                        this.modo_guia_individual === 'descarga'
                            ? 'Descarga de guía completada'
                            : 'Impresión de guía enviada'
                    );
                } else {
                    this.$store.commit('dialogosnackbar', 'No se encontró la guía');
                }
            } catch (e) {
                console.error('Error procesando guía:', e);
                this.$store.commit('dialogosnackbar', 'Error al procesar la guía');
            } finally {
                this.$store.commit('dialogoprogress');
            }
        },
    }
}
</script>
