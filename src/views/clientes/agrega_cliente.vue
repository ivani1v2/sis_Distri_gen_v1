<template>
    <v-dialog v-model="dial_cliente" max-width="750" transition="dialog-top-transition" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-btn x-small color="primary" @click="dial_config = true">
                    <v-icon left>mdi-plus</v-icon> Adicional
                </v-btn>
                <v-spacer></v-spacer>
                <v-icon color="green" large v-if="!permiso_edita" @click="save()">mdi-content-save</v-icon>
                <template>
                    <v-menu bottom left offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn icon v-bind="attrs" v-on="on">
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>

                        <v-list dense>
                            <v-list-item @click="elimina_cliente()">
                                <v-list-item-icon><v-icon color="red">mdi-delete</v-icon></v-list-item-icon>
                                <v-list-item-title>Eliminar</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <!-- Fila 1: Doc -->
            <v-row class="mt-1" dense>
                <v-col cols="6">
                    <v-select outlined :disabled="permiso_edita || cargando" dense v-model="clienteForm.tipodoc"
                        :items="arraydocumento" menu-props="auto" hide-details label="TIPO DOC" />
                </v-col>

                <v-col cols="6">
                    <v-text-field outlined :disabled="permiso_edita || cargando || sinDocumento" type="text"
                        inputmode="numeric" pattern="[0-9]*" dense v-model="clienteForm.documento"
                        :label="sinDocumento ? 'SIN DOCUMENTO' : 'DOCUMENTO ' + hintDoc"
                        :append-icon="sinDocumento ? undefined : 'mdi-magnify'" persistent-hint :loading="cargando"
                        @click:append="sinDocumento ? null : BuscarDocumento()"
                        @keyup.enter="sinDocumento ? null : BuscarDocumento()" />
                </v-col>
            </v-row>

            <!-- Fila 2: Tel - Sede -->
            <v-row class="mt-n5" dense>
                <v-col cols="6">
                    <v-text-field outlined :disabled="permiso_edita" type="text" inputmode="tel" dense
                        v-model="clienteForm.telefono" label="Telefono" />
                </v-col>

                <v-col cols="6">
                    <v-select outlined :disabled="permiso_edita" dense v-model="clienteForm.sede" :items="array_sedes"
                        item-text="nombre" item-value="codigo" label="Vendedor">
                        <template v-slot:item="{ item }"><span>{{ item.nombre }}</span></template>
                        <template v-slot:selection="{ item }"><span>{{ item && item.nombre }}</span></template>
                    </v-select>
                </v-col>
            </v-row>

            <!-- Nombre / Correo -->
            <v-row class="mt-n5" dense>
                <v-col cols="12">
                    <v-textarea :disabled="permiso_edita" outlined dense v-model="clienteForm.nombre" auto-grow filled
                        label="NOMBRE/RAZON SOCIAL" rows="1" />
                </v-col>

                <v-col cols="12" class="mt-n5">
                    <v-text-field type="email" :disabled="permiso_edita" outlined dense v-model="clienteForm.correo"
                        label="CORREO" />
                </v-col>
            </v-row>

            <!-- NUEVO BLOQUE: Direcciones en tabla -->
            <v-row class="mt-n6" dense>
                <v-col cols="12">
                    <div class="d-flex align-center justify-space-between mb-1">
                        <h3 class="subtitle-2 mb-0">Direcciones</h3>
                        <div>
                            <v-btn x-small color="primary" class="mr-1" @click="abrirDialogDireccion()">
                                <v-icon left>mdi-plus</v-icon> Agregar
                            </v-btn>

                            <!-- 👇 Solo se muestra para RUC que empieza en 20 -->
                            <v-btn v-if="puedeConsultarAnexos" x-small color="indigo" dark
                                @click="consultarDireccionesAnexas">
                                <v-icon left>mdi-map-search</v-icon>
                                Anexos
                            </v-btn>
                        </div>
                    </div>


                    <template v-if="!$vuetify.breakpoint.xsOnly">
                        <v-simple-table dense class="tabla-dir">
                            <thead>
                                <tr>
                                    <th style="width:32px;">Pri</th>
                                    <th>Dirección</th>
                                    <th>Referencia</th>
                                    <th>Dep / Prov / Dist</th>

                                    <th style="width:90px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="!clienteForm.direcciones.length">
                                    <td colspan="6" class="text-center grey--text">Sin direcciones. Agrega la primera.
                                    </td>
                                </tr>
                                <tr v-for="(dir, i) in clienteForm.direcciones" :key="i">
                                    <td class="text-center">
                                        <v-radio-group v-model="indicePrincipal" hide-details class="mt-n4"
                                            @change="onChangePrincipal">
                                            <v-radio :value="i"></v-radio>
                                        </v-radio-group>
                                    </td>
                                    <td class="wrap">{{ dir.direccion }}</td>
                                    <td class="wrap">{{ dir.referencia }}</td>
                                    <td class="wrap">
                                        {{ nombreDep(dir) }} / {{ nombreProv(dir) }} / {{ nombreDist(dir) }}
                                    </td>
                                    <td class="text-right">
                                        <v-btn icon x-small color="blue" @click="abrirDialogDireccion(i)"><v-icon
                                                small>mdi-pencil</v-icon></v-btn>
                                        <v-btn icon x-small color="red" @click="eliminarDireccion(i)"><v-icon
                                                small>mdi-delete</v-icon></v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </template>

                    <!-- Vista MÓVIL -->
                    <template v-else>
                        <div v-if="!clienteForm.direcciones.length" class="text-center grey--text mb-2">
                            Sin direcciones. Agrega la primera.
                        </div>

                        <v-list two-line dense class="lista-dir">
                            <v-list-item v-for="(dir, i) in clienteForm.direcciones" :key="i">
                                <v-list-item-action class="mr-2">
                                    <v-radio-group v-model="indicePrincipal" hide-details @change="onChangePrincipal">
                                        <v-radio :value="i"></v-radio>
                                    </v-radio-group>
                                </v-list-item-action>

                                <v-list-item-content>
                                    <v-list-item-title class="font-weight-medium wrap">{{ dir.direccion
                                        }}</v-list-item-title>
                                    <v-list-item-subtitle class="wrap">
                                        <span v-if="dir.referencia">{{ dir.referencia }} • </span>
                                        {{ nombreDep(dir) }} / {{ nombreProv(dir) }} / {{ nombreDist(dir) }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>

                                <v-list-item-action>
                                    <v-btn icon x-small color="blue" @click="abrirDialogDireccion(i)"><v-icon
                                            small>mdi-pencil</v-icon></v-btn>
                                    <v-btn icon x-small color="red" @click="eliminarDireccion(i)"><v-icon
                                            small>mdi-delete</v-icon></v-btn>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </template>

                    <small class="grey--text">La dirección “Pri” se usará como principal (facturación/envío por
                        defecto).</small>
                </v-col>
            </v-row>

            <!-- Resto de campos (nota, giro, zona, días) -->
            <v-row class="mt-1" dense>
                <v-col cols="6">
                    <v-layout dense align-center>
                        <v-flex>
                            <v-autocomplete outlined dense clearable :disabled="permiso_edita"
                                v-model="clienteForm.zona" :items="zonasOpc" item-text="nombre" item-value="nombre"
                                label="Zona" hide-details :menu-props="{ offsetY: true }">
                                <template v-slot:item="{ item }"><span>{{ item.nombre }}</span></template>
                                <template v-slot:selection="{ item }"><span>{{ item && item.nombre }}</span></template>
                            </v-autocomplete>
                        </v-flex>
                        <v-btn icon small color="info" class="" @click="abre_tabla">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </v-layout>

                </v-col>

                <v-col cols="6">
                    <v-select :disabled="permiso_edita" :items="$store.state.dia_filt" label="Días de atención" dense
                        outlined multiple chips small-chips deletable-chips persistent-hint v-model="clienteForm.dia" />
                </v-col>

                <v-col cols="6" class="mt-n4">
                    <v-textarea :disabled="permiso_edita" outlined dense v-model="clienteForm.nota" auto-grow filled
                        label="Nota" rows="1" />
                </v-col>
                <v-col cols="6" class="mt-n4">
                    <v-textarea :disabled="permiso_edita" outlined dense v-model="clienteForm.giro" auto-grow filled
                        label="Giro Negocio" rows="1" />
                </v-col>
            </v-row>
            <v-row class="mt-1" dense>

                <v-col cols="6" class="mt-n4">
                    <v-select :disabled="permiso_edita" :items="array_frec" label="Frecuencia" dense outlined
                        v-model="clienteForm.frecuencia" />
                </v-col>

                <v-col cols="6" class="mt-n4">
                    <v-select :disabled="permiso_edita" :items="arrayTipoComprobante" item-text="text"
                        item-value="value" label="Tipo Comprobante" dense outlined
                        v-model="clienteForm.tipocomprobante">
                        <template v-slot:append>
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon small color="blue" v-bind="attrs" v-on="on">mdi-help-circle</v-icon>
                                </template>
                                <span>Tipo de comprobante por defecto para este cliente (Nota venta, Boleta,
                                    Factura)</span>
                            </v-tooltip>
                        </template>
                    </v-select>
                </v-col>

            </v-row>
            <v-alert v-if="error" type="error" dense class="mt-2">{{ error }}</v-alert>
        </v-card>

        <!-- Diálogo de zonas existente -->
        <dial_tabla v-if="dialtabla" @cierra="dialtabla = false" />

        <!-- NUEVO: Diálogo para agregar/editar dirección -->
        <v-dialog v-model="dialDireccion" max-width="680" persistent>
            <v-card class="pa-3">
                <div class="d-flex align-center">
                    <h3 class="subtitle-1 mb-0">{{ editIndex === null ? 'Agregar dirección' : 'Editar dirección' }}</h3>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="cerrarDialogDireccion"><v-icon color="red">mdi-close</v-icon></v-btn>
                </div>

                <v-row dense class="mt-1">
                    <v-col cols="12">
                        <v-textarea outlined dense v-model="direccionForm.direccion" auto-grow filled label="Dirección"
                            rows="1" />
                    </v-col>
                    <v-col cols="12" class="mt-n4">
                        <v-textarea outlined dense v-model="direccionForm.referencia" auto-grow filled
                            label="Referencia" rows="1" />
                    </v-col>
                </v-row>

                <v-row dense class="mt-n2">
                    <v-col cols="6">
                        <v-autocomplete outlined dense clearable v-model="direccionForm.departamento"
                            :items="arrayDepas2" item-text="nombre" return-object label="DEPARTAMENTO"
                            @change="onDepChange">
                            <template v-slot:item="{ item }">
                                <div class="d-flex justify-space-between" style="width:100%">
                                    <span>{{ item.nombre }}</span>
                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                </div>
                            </template>
                        </v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete outlined dense clearable :disabled="!direccionForm.departamento"
                            v-model="direccionForm.provincia" :items="arrayProvs2" item-text="nombre" return-object
                            label="PROVINCIA" @change="onProvChange">
                            <template v-slot:item="{ item }">
                                <div class="d-flex justify-space-between" style="width:100%">
                                    <span>{{ item.nombre }}</span>
                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                </div>
                            </template>
                        </v-autocomplete>
                    </v-col>
                </v-row>

                <v-row dense class="mt-n2">
                    <v-col cols="6">
                        <v-autocomplete outlined dense clearable :disabled="!direccionForm.provincia"
                            v-model="direccionForm.distrito" :items="arrayDists2" item-text="nombre" return-object
                            label="DISTRITO" @change="onDistChange">
                            <template v-slot:item="{ item }">
                                <div class="d-flex justify-space-between" style="width:100%">
                                    <span>{{ item.nombre }}</span>
                                    <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                </div>
                            </template>
                        </v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field outlined dense v-model="direccionForm.ubigeo" label="UBIGEO" readonly />
                    </v-col>
                </v-row>

                <v-row dense class="mt-n2">
                    <v-col cols="6">
                        <v-text-field outlined dense v-model="direccionForm.latitud" label="Latitud" />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined dense v-model="direccionForm.longitud" label="Longitud" />
                    </v-col>
                </v-row>

                <div class="text-right mt-2">
                    <v-btn text @click="cerrarDialogDireccion">Cancelar</v-btn>
                    <v-btn color="primary" @click="guardarDireccion">Guardar</v-btn>
                </div>
            </v-card>
        </v-dialog>
        <!-- Diálogo ADICIONAL -->
        <v-dialog v-model="dial_config" max-width="750" transition="dialog-bottom-transition">
            <v-card color="grey lighten-4">
                <v-toolbar flat color="white">
                    <v-icon color="primary" class="mr-3">mdi-tune-variant</v-icon>
                    <v-toolbar-title class="subtitle-1 font-weight-bold grey--text text--darken-3">
                        Configuración del Cliente
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dial_config = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pa-4">
                    <v-row>
                        <v-col cols="12" :md="esListaPreciosActivo ? 6 : 12">
                            <v-card outlined class="rounded-lg elevation-1 fill-height">
                                <v-card-title class="text-subtitle-1 font-weight-bold">
                                    <v-icon left color="blue">mdi-credit-card-settings</v-icon>
                                    Línea de Crédito
                                </v-card-title>
                                <v-divider></v-divider>

                                <v-card-text class="pt-4">
                                    <v-switch v-model="clienteForm.permite_credito"
                                        :disabled="permiso_edita || !lineaCreditoHabilitado" label="Habilitar crédito"
                                        inset color="success" class="mt-0" />

                                    <v-expand-transition>
                                        <div v-if="clienteForm.permite_credito && lineaCreditoHabilitado">
                                            <v-row dense>
                                                <v-col cols="12" :md="esListaPreciosActivo ? 12 : 6">
                                                    <v-text-field v-model.number="clienteForm.linea_credito"
                                                        label="Monto Autorizado" prefix="S/." outlined dense
                                                        prepend-inner-icon="mdi-cash" type="number"
                                                        :rules="[v => v > 0 || 'Monto requerido']" />
                                                </v-col>
                                                <v-col cols="12" :md="esListaPreciosActivo ? 12 : 6">
                                                    <v-text-field v-model.number="clienteForm.dias_credito"
                                                        label="Plazo de pago (días)" outlined dense class="mt-n3"
                                                        prepend-inner-icon="mdi-clock-outline" persistent-hint
                                                        type="number" />
                                                </v-col>
                                            </v-row>
                                        </div>
                                    </v-expand-transition>

                                    <v-alert v-if="!lineaCreditoHabilitado" type="warning" text dense
                                        class="mt-3 text-caption">
                                        Opción bloqueada por configuración global.
                                    </v-alert>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col v-if="esListaPreciosActivo" cols="12" md="6">
                            <v-card outlined class="rounded-lg elevation-1 fill-height d-flex flex-column">
                                <v-card-title class="text-subtitle-1 font-weight-bold">
                                    <v-icon left color="orange darken-3">mdi-tag-multiple-outline</v-icon>
                                    Listas de Precios
                                </v-card-title>

                                <v-divider></v-divider>

                                <v-list flat dense class="py-0 flex-grow-1">
                                    <v-list-item-group v-model="clienteForm.listas_precios" multiple
                                        active-class="blue--text text--darken-4" @change="mensajeListaPrecio">
                                        <v-list-item v-for="item in listasPrecioOpc" :key="item.value"
                                            :value="item.value" :disabled="permiso_edita" class="px-4">
                                            <template v-slot:default="{ active }">
                                                <v-list-item-action class="mr-3">
                                                    <v-checkbox :input-value="active" color="primary"
                                                        :disabled="permiso_edita" hide-details />
                                                </v-list-item-action>

                                                <v-list-item-content>
                                                    <v-list-item-title class="font-weight-medium">
                                                        {{ item.text }}
                                                    </v-list-item-title>
                                                </v-list-item-content>
                                                <v-list-item-icon v-if="active">
                                                    <v-icon color="primary" small>mdi-check-circle</v-icon>
                                                </v-list-item-icon>
                                            </template>
                                        </v-list-item>
                                    </v-list-item-group>
                                </v-list>
                            </v-card>
                        </v-col>
                        <v-col cols="12" :md="6">
                            <v-card outlined class="rounded-lg elevation-1 fill-height">
                                <v-card-title class="text-subtitle-1 font-weight-bold">
                                    <v-icon left color="primary">mdi-account</v-icon>
                                    Imagen del cliente
                                </v-card-title>
                                <v-divider></v-divider>
                                <v-card-text class="pt-4">
                                    <v-row justify="center">
                                        <v-col cols="12" class="text-center">
                                            <imagen_cliente ref="imagenCliente" :cliente-doc="clienteForm.documento"
                                                :cliente-id="clienteForm.id" :modo-pendiente="!clienteForm.id"
                                                modo-activador="miniatura" />
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                                <v-alert v-if="!$store.state.baseDatos?.imagen_cliente" type="warning" text dense
                                    class="mt-3 text-caption">
                                    Opción bloqueada por configuración global.
                                </v-alert>
                            </v-card>
                        </v-col>
                        <v-col cols="12" :md="6">
                            <v-card outlined class="rounded-lg elevation-1 fill-height">
                                <v-card-title class="text-subtitle-1 font-weight-bold">
                                    <v-icon left color="green">mdi-cellphone-check</v-icon>
                                    Pedido por Aplicativo
                                </v-card-title>
                                <v-divider></v-divider>
                                <v-card-text class="pt-4">
                                    <v-switch v-model="pedidoAplicativo" :disabled="permiso_edita"
                                        label="Permitir pedidos desde aplicativo móvil" inset color="success">
                                        <template v-slot:label>
                                            <div>
                                                <span>{{ pedidoAplicativo ? 'Habilitado' : 'Deshabilitado' }}</span>
                                                <v-tooltip bottom>
                                                    <template v-slot:activator="{ on, attrs }">
                                                        <v-icon small color="grey" v-bind="attrs" v-on="on"
                                                            class="ml-1">mdi-help-circle</v-icon>
                                                    </template>
                                                    <span>Habilita esta opción para que el cliente pueda realizar
                                                        pedidos desde Aplicativo (Tienda Virtual)</span>
                                                </v-tooltip>
                                            </div>
                                        </template>
                                    </v-switch>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="white pa-4">
                    <v-btn text color="grey darken-1" @click="dial_config = false" class="text-none">
                        Cancelar
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" depressed large @click="dial_config = false" class="px-8 text-none">
                        <v-icon left>mdi-check</v-icon>
                        Guardar cambios
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>
import { obtenContador, sumaContador } from '../../db'
import { crearOActualizarCliente as nuevoCliente, borrarCliente as eliminaCliente } from '../../db_firestore'
import dial_tabla from './dialogos/tablas_zona.vue'
import store from '@/store/index'
import { mapActions } from 'vuex'
import { departamento, provincia, distrito } from '../../ubigeos'
import moment from 'moment'
import 'moment/locale/es'
import imagen_cliente from './dialogos/imagen_cliente.vue'

export default {
    components: { dial_tabla, imagen_cliente },
    props: {
        cliente_selecto: { type: Object, default: null },
        vendedor: null,
    },
    name: 'caja',
    data() {
        return {
            dial_config: false,
            dial_cliente: false,
            permiso_edita: false,
            cargando: false,
            error: null,
            dialtabla: false,
            arraydocumento: ['SIN DOCUMENTO', 'DNI', 'RUC', 'PASSAPORTE', 'CARNET DE EXTRANJERIA'],
            array_frec: ['SEMANAL', 'QUINCENAL', 'MENSUAL'],
            arrayTipoComprobante: [
                { text: 'NOTA', value: 'T' },
                { text: 'BOLETA', value: 'B' },
                { text: 'FACTURA', value: 'F' }
            ],

            // viejo set de listas (para auto-map desde API): lo usaremos solo para bootstrap
            arrayDepas: [],
            arrayProvs: [],
            arrayDists: [],

            // NUEVO: estado del diálogo de dirección
            dialDireccion: false,
            editIndex: null,
            direccionForm: this.nuevaDireccion(),
            arrayDepas2: [],
            arrayProvs2: [],
            arrayDists2: [],

            indicePrincipal: 0, // radio de dirección principal
            mensajePrecio: '',
            pedidoAplicativo: false,

            clienteForm: {
                activo: true,
                id: '',
                tipodoc: 'DNI',
                documento: '',
                nombre: '',
                correo: '',
                telefono: '',
                sede: '',
                nota: '',
                zona: '',
                giro: '',
                dia: [],
                latitud: null,
                longitud: null,
                direcciones: [], // [{direccion, referencia, departamento:{}, provincia:{}, distrito:{}, ubigeo, latitud, longitud, principal:boolean}]
                tipocomprobante: 'T',
                frecuencia: '',
                permite_credito: false,
                linea_credito: 0,
                dias_credito: 0,
                listas_precios: [],
                pedido_aplicativo: false,
            }
        }
    },
    created() {
        this.dial_cliente = true
        this.clienteForm.sede = this.vendedor || store.state.sedeActual.codigo
        const diaHoy = moment().locale('es').format('ddd')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\./g, '').toLowerCase()
        this.clienteForm.dia = [diaHoy]

        // Bootstrap de listas generales (para mapeo por API)
        this.arrayDepas = departamento() || []

        // Listas del diálogo de dirección
        this.arrayDepas2 = departamento() || []

        if (this.cliente_selecto) {
            this.cargarDesdeCliente(this.cliente_selecto)
        }
    },
    computed: {
        puedeConsultarAnexos() {
            const doc = String(this.clienteForm.documento || '').trim();
            const tipo = (this.clienteForm.tipodoc || '').toUpperCase();
            // 11 dígitos, tipo RUC y empieza en 20
            return doc.length === 11 && doc.startsWith('20') && tipo === 'RUC';
        },
        lineaCreditoHabilitado() {
            return this.$store.state.configuracion?.linea_credito_activo === true
        },
        zonasOpc() {
            const base = this.$store.state.zonas || []
            return base.map(z => (typeof z === 'string' ? { nombre: z } : z))
        },
        array_sedes() {
            return store.state.array_sedes || []
        },
        sinDocumento() {
            return (this.clienteForm.tipodoc || '').toUpperCase() === 'SIN DOCUMENTO'
        },
        hintDoc() {
            if (this.sinDocumento) return ''
            return this.clienteForm.tipodoc === 'RUC' ? '11 dígitos' : '8 dígitos'
        },
        hoyISO() {
            return moment().format('YYYY-MM-DD');
        },
        // 🔽 si tienes algo en store.state.listas_precio lo usa; si no, cae en 3 por defecto
        listasPrecioOpc() {
            return [
                { text: 'MAYORISTA', value: 'mayorista' },
                { text: 'DISTRIBUIDOR', value: 'distribuidor' },
                { text: 'MINORISTA', value: 'minorista' }
            ]
        },
        esListaPreciosActivo() {
            return this.$store.state.configuracion?.lista_precios === true;
        },
    },
    watch: {
        // Normalización doc + detección DNI/RUC
        'clienteForm.documento'(nv) {
            const solo = String(nv || '').replace(/\D+/g, '');
            let newTipo = this.clienteForm.tipodoc;
            if (solo.length >= 11) newTipo = 'RUC';
            else if (solo.length >= 8) newTipo = 'DNI';
            const max = newTipo === 'RUC' ? 11 : 8;
            const clipped = solo.slice(0, max);
            if (this.clienteForm.tipodoc !== newTipo) this.clienteForm.tipodoc = newTipo;
            if (nv !== clipped) this.clienteForm.documento = clipped;
        },
        'clienteForm.tipodoc'(nv) {
            const upper = (nv || '').toUpperCase();
            const max = upper === 'RUC' ? 11 : 8;
            this.clienteForm.documento = String(this.clienteForm.documento || '').slice(0, max);
        },
        formaPago(nv) {
            if (nv === 'CRÉDITO') {
                this.fechaVencimiento = moment().add(7, 'days').format('YYYY-MM-DD');
            } else {
                this.fechaVencimiento = '';
            }
        },
        // 🔽 si desactivan crédito, resetea línea
        'clienteForm.permite_credito'(nv) {
            if (!nv) this.clienteForm.linea_credito = 0;
        },
        'clienteForm.pedido_aplicativo'(nv) {
            this.pedidoAplicativo = nv || false;
        },
        pedidoAplicativo(nv) {
            this.clienteForm.pedido_aplicativo = nv;
        },
    },
    methods: {
        // ----- util -----
        nuevaDireccion() {
            return {
                direccion: '',
                referencia: '',
                departamento: null,
                provincia: null,
                distrito: null,
                ubigeo: '',
                latitud: null,
                longitud: null,
                principal: false,
            }
        },
        _norm(s) {
            return String(s || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase()
                .trim()
        },

        // ----- zonas -----
        async abre_tabla() {
            this.dialtabla = !this.dialtabla
        },

        // ----- direcciones: UI -----
        abrirDialogDireccion(index = null) {
            this.editIndex = index
            this.direccionForm = index === null
                ? this.nuevaDireccion()
                : JSON.parse(JSON.stringify(this.clienteForm.direcciones[index])) // clone

            // Cargar listas dependientes acorde a selección
            this.arrayDepas2 = departamento() || []
            if (this.direccionForm.departamento) {
                const depUb = this.direccionForm.departamento.ubigeo || this.direccionForm.departamento.ubigeo_sunat
                this.arrayProvs2 = provincia(depUb) || []
            } else this.arrayProvs2 = []

            if (this.direccionForm.provincia) {
                const provUb = this.direccionForm.provincia.ubigeo || this.direccionForm.provincia.ubigeo_sunat
                this.arrayDists2 = distrito(provUb) || []
            } else this.arrayDists2 = []

            this.dialDireccion = true
        },
        cerrarDialogDireccion() {
            this.dialDireccion = false
            this.editIndex = null
        },
        onDepChange(depa) {
            this.direccionForm.provincia = null
            this.direccionForm.distrito = null
            this.direccionForm.ubigeo = ''
            this.arrayProvs2 = depa ? (provincia(depa.ubigeo || depa.ubigeo_sunat) || []) : []
            this.arrayDists2 = []
        },
        onProvChange(prov) {
            this.direccionForm.distrito = null
            this.direccionForm.ubigeo = ''
            this.arrayDists2 = prov ? (distrito(prov.ubigeo || prov.ubigeo_sunat) || []) : []
        },
        onDistChange(dist) {
            this.direccionForm.ubigeo = this.generarUbigeo(
                this.direccionForm.departamento,
                this.direccionForm.provincia,
                dist
            );
        },

        guardarDireccion() {
            // Validaciones mínimas
            if (!this.direccionForm.direccion) {
                this.$toast && this.$toast.error ? this.$toast.error('Ingrese la dirección') : alert('Ingrese la dirección')
                return
            }
            const payload = JSON.parse(JSON.stringify(this.direccionForm))
            if (this.editIndex === null) {
                this.clienteForm.direcciones.push(payload)
                // si es la primera, marcarla como principal
                if (this.clienteForm.direcciones.length === 1) {
                    this.indicePrincipal = 0
                    this.clienteForm.direcciones[0].principal = true
                }
            } else {
                this.$set(this.clienteForm.direcciones, this.editIndex, payload)
            }
            this.cerrarDialogDireccion()
        },
        eliminarDireccion(i) {
            this.clienteForm.direcciones.splice(i, 1)
            if (!this.clienteForm.direcciones.length) {
                this.indicePrincipal = 0
            } else if (this.indicePrincipal === i) {
                // si borraste la principal, deja la 0 como principal
                this.indicePrincipal = 0
                this.onChangePrincipal()
            }
        },
        onChangePrincipal() {
            this.clienteForm.direcciones.forEach((d, idx) => { d.principal = (idx === this.indicePrincipal) })
        },

        // ----- API Perú + mapeo a una dirección -----
        ...mapActions(['busca_cliente', 'consultaApiPeru']),
        async BuscarDocumento() {
            this.error = null
            let tipo = (this.clienteForm.tipodoc || '').toUpperCase()
            const numero = String(this.clienteForm.documento || '').replace(/\D+/g, '')
            if (numero.length === 11) tipo = 'RUC'
            else if (numero.length === 8) tipo = 'DNI'
            const requerido = tipo === 'RUC' ? 11 : 8
            if (!numero || numero.length !== requerido) {
                this.error = `Ingrese un ${tipo} válido (${requerido} dígitos).`
                return
            }

            this.cargando = true
            try {
                const res = await this.consultaApiPeru({ documento: tipo, numero })
                // Campos base
                this.clienteForm = {
                    ...this.clienteForm,
                    id: numero,
                    documento: numero,
                    nombre: res?.nombre || this.clienteForm.nombre,
                    sede: this.clienteForm.sede || (store.state.baseDatos?.bd || '')
                }

                // Armar una dirección desde la respuesta si vino algo
                const depName = this._norm(res?.departamento)
                const provName = this._norm(res?.provincia)
                const distName = this._norm(res?.distrito)
                const ubigeoApi = res?.ubigeo || ''

                let depObj, provObj, distObj
                this.arrayProvs = []
                this.arrayDists = []

                if (depName) {
                    depObj = (this.arrayDepas || []).find(d => this._norm(d.nombre) === depName)
                    if (depObj) this.arrayProvs = provincia(depObj.ubigeo || depObj.ubigeo_sunat) || []
                }
                if (provName && this.arrayProvs.length) {
                    provObj = this.arrayProvs.find(p => this._norm(p.nombre) === provName)
                    if (provObj) this.arrayDists = distrito(provObj.ubigeo || provObj.ubigeo_sunat) || []
                }
                if (distName && this.arrayDists.length) {
                    distObj = this.arrayDists.find(d => this._norm(d.nombre) === distName)
                }

                const direccionApi = {
                    direccion: res?.direccion || '',
                    referencia: '',
                    departamento: depObj || null,
                    provincia: provObj || null,
                    distrito: distObj || null,
                    ubigeo: this.generarUbigeo(depObj, provObj, distObj),

                    latitud: null,
                    longitud: null,
                    principal: false,
                }

                if (direccionApi.direccion) {
                    // si no hay direcciones aún, deja esta como principal
                    if (!this.clienteForm.direcciones.length) {
                        direccionApi.principal = true
                        this.indicePrincipal = 0
                    }
                    this.clienteForm.direcciones.push(direccionApi)
                }
            } catch (e) {
                console.error(e)
                this.error = 'No se pudo obtener los datos del cliente.'
            } finally {
                this.cargando = false
            }
        },
        generarUbigeo(depObj, provObj, distObj) {
            const dep = depObj ? (depObj.ubigeo_sunat || depObj.ubigeo || '').padStart(2, '0') : '';
            const prov = provObj ? (provObj.ubigeo_sunat || provObj.ubigeo || '').padStart(2, '0') : '';
            const dist = distObj ? (distObj.ubigeo_sunat || distObj.ubigeo || '').padStart(2, '0') : '';

            if (dep && prov && dist) return `${dep}${prov}${dist}`;
            return ''; // incompleto
        },

        // ----- Guardado -----
        async save() {
            try {
                if (this.clienteForm.sede === '') return alert('Seleccione una sede para el cliente')
                if (this.clienteForm.nombre === '') return alert('Ingrese nombre valido')
                if (this.clienteForm.tipodoc !== 'SIN DOCUMENTO' && this.clienteForm.documento === '')
                    return alert('Numero de documento invalido')

                // Validación mínima de direcciones
                if (!this.clienteForm.direcciones.length) {
                    const cont = confirm('No has agregado ninguna dirección. ¿Guardar de todas formas?')
                    if (!cont) return
                }
                if (this.clienteForm.permite_credito && this.lineaCreditoHabilitado) {
                    const credito = Number(this.clienteForm.linea_credito || 0)
                    if (credito <= 0) {
                        this.error = 'si habilita crédito, la línea de crédito debe ser mayor a 0'
                        this.dial_config = true
                        return
                    }
                }

                store.commit('dialogoprogress')

                let suma = false
                if (this.clienteForm.tipodoc === 'SIN DOCUMENTO' && this.clienteForm.documento === '') {
                    const snap = await obtenContador().once('value')
                    const n = Number(snap.val().ordenclientes)
                    const codigo = String(n).padStart(4, '0')
                    this.clienteForm.documento = codigo
                    suma = true
                }

                // Siempre guardar id = documento
                this.clienteForm.id = this.clienteForm.documento

                // Asegura “principal” coherente
                this.onChangePrincipal()
                if (navigator.onLine) {
                    await nuevoCliente(this.clienteForm.documento, { ...this.clienteForm })
                } else {
                    nuevoCliente(this.clienteForm.documento, { ...this.clienteForm })
                }


                if (suma) {
                    await sumaContador('ordenclientes', String(parseInt(this.clienteForm.documento) + 1).padStart(4, '0'))
                }
                if (this.clienteForm.id && this.$refs.imagenCliente) {
                    await this.$refs.imagenCliente.guardarImagenPendiente(
                        this.clienteForm.documento,
                        this.clienteForm.id
                    )
                }

                this.$emit('actualizar', this.clienteForm)
                store.commit('dialogoprogress')
            } catch (err) {
                console.error(err)
                this.snackbar = true
                this.text = 'Error al guardar cliente'
            }
        },
        // Dentro de methods: { ... }
        async cargarDesdeCliente(c = {}) {
            // 1) Campos base
            this.clienteForm = {
                ...this.clienteForm,
                activo: c.activo !== undefined ? c.activo : true,
                id: c.id || c.documento || '',
                tipodoc: c.tipodoc || this.clienteForm.tipodoc,
                documento: String(c.documento || ''),
                nombre: c.nombre || '',
                correo: c.correo || '',
                telefono: c.telefono || '',
                sede: c.sede || (this.$store.state.baseDatos?.bd || this.clienteForm.sede || ''),
                nota: c.nota || '',
                zona: c.zona || '',
                giro: c.giro || '',
                dia: Array.isArray(c.dia) ? c.dia : (c.dia ? [c.dia] : this.clienteForm.dia),
                tipocomprobante: c.tipocomprobante || 'T',
                latitud: c.latitud !== undefined ? c.latitud : this.clienteForm.latitud,
                longitud: c.longitud !== undefined ? c.longitud : this.clienteForm.longitud,
                direcciones: Array.isArray(c.direcciones) ? JSON.parse(JSON.stringify(c.direcciones)) : [],
                frecuencia: c.frecuencia || 'SEMANAL',
                permite_credito: typeof c.permite_credito === 'boolean' ? c.permite_credito : this.clienteForm.permite_credito || false,
                linea_credito: Number.isFinite(Number(c.linea_credito)) ? Number(c.linea_credito) : this.clienteForm.linea_credito || 0,
                listas_precios: Array.isArray(c.listas_precios) ? [...c.listas_precios] : (this.clienteForm.listas_precios || []),
                dias_credito: Number.isFinite(Number(c.dias_credito)) ? Number(c.dias_credito) : this.clienteForm.dias_credito || 0,
                pedido_aplicativo: c.pedido_aplicativo === true,
            };

            // 2) Si viene formato antiguo (campos sueltos), migrar a direcciones[]
            const tieneAntiguos =
                (c.direccion && c.direccion !== '') ||
                c.referencia || c.departamento || c.provincia || c.distrito || c.ubigeo;

            if (tieneAntiguos && !c.direcciones) {
                // Normaliza nombres
                const _norm = (s) =>
                    String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

                // Buscar objetos por nombre para dep/prov/dist
                let depObj = null, provObj = null, distObj = null;
                const depas = this.arrayDepas.length ? this.arrayDepas : (departamento() || []);

                if (c.departamento) {
                    depObj = typeof c.departamento === 'object'
                        ? c.departamento
                        : depas.find(d => _norm(d.nombre) === _norm(c.departamento)) || null;
                }

                if (depObj) {
                    const proqs = provincia(depObj.ubigeo || depObj.ubigeo_sunat) || [];
                    if (c.provincia) {
                        provObj = typeof c.provincia === 'object'
                            ? c.provincia
                            : proqs.find(p => _norm(p.nombre) === _norm(c.provincia)) || null;
                    }
                    if (provObj) {
                        const distqs = distrito(provObj.ubigeo || provObj.ubigeo_sunat) || [];
                        if (c.distrito) {
                            distObj = typeof c.distrito === 'object'
                                ? c.distrito
                                : distqs.find(d => _norm(d.nombre) === _norm(c.distrito)) || null;
                        }
                    }
                }

                const dirMigrada = {
                    direccion: c.direccion || '',
                    referencia: c.referencia || '',
                    departamento: depObj,
                    provincia: provObj,
                    distrito: distObj,
                    ubigeo: c.ubigeo || (distObj ? (distObj.ubigeo_sunat || distObj.ubigeo) : ''),
                    latitud: c.latitud ?? null,
                    longitud: c.longitud ?? null,
                    principal: true, // al migrar, márcala principal
                };

                // Insertar al inicio si no existe ya una principal
                if (!this.clienteForm.direcciones.length) {
                    this.clienteForm.direcciones = [dirMigrada];
                    this.indicePrincipal = 0;
                } else {
                    // Si ya hay direcciones, respeta su principal y agrega esta como secundaria
                    dirMigrada.principal = false;
                    this.clienteForm.direcciones.push(dirMigrada);
                    // recalcula índice principal
                    const idx = this.clienteForm.direcciones.findIndex(d => d.principal);
                    this.indicePrincipal = idx >= 0 ? idx : 0;
                }
            }
            this.pedidoAplicativo = this.clienteForm.pedido_aplicativo;

            // Asegura coherencia de principal
            this.onChangePrincipal();
        },
        nombreDep(dir) {
            return dir && dir.departamento
                ? (typeof dir.departamento === 'object' ? dir.departamento.nombre : dir.departamento)
                : '';
        },
        nombreProv(dir) {
            return dir && dir.provincia
                ? (typeof dir.provincia === 'object' ? dir.provincia.nombre : dir.provincia)
                : '';
        },
        nombreDist(dir) {
            return dir && dir.distrito
                ? (typeof dir.distrito === 'object' ? dir.distrito.nombre : dir.distrito)
                : '';
        },
        cierra() {
            this.$emit('cierra', this.clienteForm)
        },
        async elimina_cliente() {

            if (confirm('Esta seguro de eliminar?')) {
                store.commit('dialogoprogress')
                await eliminaCliente(this.cliente_selecto.id)
                store.commit('dialogoprogress')
                this.cierra()
                //alert('cliente eliminado')
            }

        },
        async consultarDireccionesAnexas() {
            try {
                const ruc = String(this.clienteForm.documento || '').trim();

                if (ruc.length !== 11 || !ruc.startsWith('20')) {
                    this.$toast?.error?.('Debe ingresar un RUC válido que empiece con 20.')
                        || alert('Debe ingresar un RUC válido que empiece con 20.');
                    return;
                }

                // Token para API Perú: ajústalo según dónde lo guardes
                const token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d';
                if (!token) {
                    this.$toast?.error?.('Falta configurar el token de ApiPeru.')
                        || alert('Falta configurar el token de ApiPeru.');
                    return;
                }

                this.cargando = true;

                const resp = await fetch('https://apiperu.dev/api/ruc-establecimientos-anexos', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ruc })
                });

                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}`);
                }

                const json = await resp.json();
                if (!json.success || !Array.isArray(json.data)) {
                    throw new Error('Respuesta inválida de ApiPeru.');
                }

                const anexos = json.data || [];
                if (!anexos.length) {
                    this.$toast?.info?.('No se encontraron establecimientos anexos.')
                        || alert('No se encontraron establecimientos anexos.');
                    return;
                }

                // Aseguramos tener la lista de departamentos cargada
                const depas = this.arrayDepas.length ? this.arrayDepas : (departamento() || []);
                const _norm = this._norm; // reutilizamos tu normalizador

                const existentes = this.clienteForm.direcciones || [];
                let agregados = 0;

                anexos.forEach(a => {
                    const dirTexto = a.direccion_completa || a.direccion || '';
                    if (!dirTexto) return;

                    // Evitar duplicados (por dirección)
                    const yaExiste = existentes.some(d => _norm(d.direccion) === _norm(dirTexto));
                    if (yaExiste) return;

                    // Buscar objetos de dep/prov/dist por nombre
                    let depObj = null, provObj = null, distObj = null;

                    const depName = _norm(a.departamento);
                    const provName = _norm(a.provincia);
                    const distName = _norm(a.distrito);

                    if (depName) {
                        depObj = depas.find(d => _norm(d.nombre) === depName) || null;
                    }

                    if (depObj) {
                        const provs = provincia(depObj.ubigeo || depObj.ubigeo_sunat) || [];
                        if (provName) {
                            provObj = provs.find(p => _norm(p.nombre) === provName) || null;
                        }
                        if (provObj) {
                            const dists = distrito(provObj.ubigeo || provObj.ubigeo_sunat) || [];
                            if (distName) {
                                distObj = dists.find(d => _norm(d.nombre) === distName) || null;
                            }
                        }
                    }

                    const dirObj = {
                        direccion: dirTexto,
                        referencia: a.actividad_economica || a.tipo_de_establecimiento || '',
                        departamento: depObj,
                        provincia: provObj,
                        distrito: distObj,
                        ubigeo: this.generarUbigeo(depObj, provObj, distObj),
                        latitud: null,
                        longitud: null,
                        principal: false,
                    };

                    this.clienteForm.direcciones.push(dirObj);
                    agregados++;
                });

                // Si antes no había direcciones y ahora sí, marca la primera como principal
                if (this.clienteForm.direcciones.length && this.indicePrincipal == null) {
                    this.indicePrincipal = 0;
                }
                this.onChangePrincipal();

                if (agregados > 0) {
                    this.$toast?.success?.(`Se agregaron ${agregados} direcciones anexas.`)
                        || alert(`Se agregaron ${agregados} direcciones anexas.`);
                } else {
                    this.$toast?.info?.('No se agregaron nuevas direcciones (ya existían en la ficha).')
                        || alert('No se agregaron nuevas direcciones (ya existían en la ficha).');
                }

            } catch (e) {
                console.error('Error al consultar direcciones anexas:', e);
                this.$toast?.error?.('No se pudo consultar las direcciones anexas.')
                    || alert('No se encontro direcciones anexas.');
            } finally {
                this.cargando = false;
            }
        },
        mensajeListaPrecio(valores) {

            let mensajes = []

            if (valores.includes('minorista')) {
                mensajes.push('Precio regular')
            }

            if (valores.includes('distribuidor')) {
                mensajes.push('Escala 1')
            }

            if (valores.includes('mayorista')) {
                mensajes.push('Escala 2')
            }

            if (mensajes.length) {
                this.mensajePrecio = 'Este cliente podrá comprar con: ' + mensajes.join(', ')
            } else {
                this.mensajePrecio = ''
            }
        }
    }
}
</script>
