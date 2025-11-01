<template>
    <div class="pa-3">
        <v-row>
            <v-col cols="12" md="4"
                v-if="$vuetify.breakpoint.mdAndUp || ($vuetify.breakpoint.smAndDown && $vuetify.breakpoint.width > $vuetify.breakpoint.height)">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true" :x_categoria="true">
                </cat_fijo>
            </v-col>
            <v-col cols="12" md="8">
                <v-card class="mt-1">
                    <v-card-text>
                        <v-row class="mt-n1" dense>
                            <v-col cols="6" xs="6">
                                <cat_fijo v-if="$store.state.esmovil" ref="catFijo"
                                    @agrega_lista="agregar_lista($event)" :muestra_tabla="false" :x_categoria="true">
                                </cat_fijo>
                            </v-col>
                            <v-col cols="6" xs="12">
                                <v-btn small elevation="3" rounded color="success" @click="abre_catalogo()">
                                    Catalogo
                                    <v-icon color="white" class="mx-auto text--center"
                                        small>mdi-archive-arrow-down</v-icon>

                                </v-btn>
                            </v-col>

                        </v-row>
                    </v-card-text>
                </v-card>
                <h4 class="mb-n5 mt-1 red--text" v-if="cliente_s != ''">
                    <div> Cliente : {{ cliente_s.nombre }}</div>
                </h4>
                <v-card class="mt-5">
                    <div class="tabla-scroll">
                        <v-simple-table class="elevation-0" dense>
                            <!-- Sin encabezado: usamos tarjetas -->
                            <thead class="d-none">
                                <tr>
                                    <th>Ítems</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="item in listaproductos" :key="item.uuid || item.id"
                                    @click.prevent="editaProducto(item)">
                                    <td class="pa-0 mt-n1 mb-n1">
                                        <v-card class="ma-1 pa-2 " outlined :elevation="0" ripple>
                                            <div class="d-flex align-center mt-n2 mb-n2">
                                                <!-- Contenido -->
                                                <div class="flex-grow-1 mr-2">
                                                    <div class="text-caption grey--text text--darken-1">
                                                        <!-- Precio + chips -->
                                                        <span>
                                                            Precio: {{ moneda }}
                                                            {{ redondear(item.precio) }}
                                                        </span>
                                                        <v-chip v-if="Number(item.preciodescuento) > 0" x-small
                                                            class="ml-1" color="deep-orange" text-color="white" label>
                                                            −{{ moneda }} {{ redondear(item.preciodescuento) }}
                                                        </v-chip>
                                                        <v-chip v-if="item.medida" x-small class="ml-1" label>
                                                            {{ item.medida }}
                                                        </v-chip>
                                                        <v-chip v-if="item.operacion === 'GRATUITA'" x-small
                                                            class="ml-1" color="pink" text-color="white" label>
                                                            Gratuita
                                                        </v-chip>
                                                    </div>

                                                    <div class="mt-1 text-subtitle-2 text-truncate"
                                                        style="max-width: 70vw;">
                                                        <span class="font-weight-bold red--text">{{
                                                            Number(item.cantidad)
                                                        }}×</span>
                                                        {{ item.nombre }}
                                                    </div>
                                                </div>

                                                <!-- Total -->
                                                <div class="text-right mr-1">
                                                    <div class="subtitle-2 font-weight-bold">
                                                        {{ moneda }}
                                                        {{ item.totalLinea
                                                        }}
                                                    </div>
                                                    <div class="caption grey--text">Total</div>
                                                </div>
                                            </div>
                                        </v-card>
                                    </td>
                                </tr>

                                <!-- Vacío -->
                                <tr v-if="!listaproductos || listaproductos.length === 0">
                                    <td class="py-6 text-center grey--text">
                                        No hay productos en la lista
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </div>

                </v-card>

                <v-card class="mt-3 pa-1 totals-sticky">
                    <v-row>
                        <v-col cols="7">
                            <v-list-item-content class="ml-3">
                                <v-list-item-subtitle>

                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h3>SubTotal: {{ moneda }} {{ sumaTotal() }}</h3>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle v-if="sumaDescuentos() != 0">
                                    <h4 class="red--text">Descuentos: {{ moneda }} {{ sumaDescuentos() }}</h4>
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    <h2>Total: <select class="mr-n1 red--text" id="moneda" name="moneda"
                                            v-model="moneda">
                                            <option v-for="moneda in $store.state.moneda" :key="moneda.codigo"
                                                :value="moneda.simbolo">
                                                {{ moneda.simbolo }}
                                            </option>
                                        </select> {{ redondear(sumaTotal() - sumaDescuentos()) }}</h2>
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </v-col>
                        <v-col cols="1">
                        </v-col>
                        <v-col cols="3">
                            <v-btn block elevation="15" rounded v-if="listaproductos != ''" color="error"
                                @click="grabar()">
                                Grabar
                            </v-btn>
                        </v-col>

                    </v-row>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="dialogoProducto" max-width="390">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dialogoProducto = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                                     <v-checkbox :disabled="!$store.state.permisos.edita_bono" v-model="es_bono"
                        label="ES BONO"></v-checkbox>
                </v-system-bar>
            </div>
            <v-card class="pa-3">

                <v-row class="mx-auto mt-4 text-center" dense v-if="$store.state.permisos.caja_edita_cantidad">

                    <v-col cols="4" xs="4">
                        <v-icon @click="suma()" color="green">mdi-plus</v-icon>
                    </v-col>

                    <v-col cols="4" xs="4">
                        <v-text-field dense @keyup.enter="grabaEdita()" type="number" outlined v-model="cantidadEdita"
                            label="Cantidad"></v-text-field>
                    </v-col>
                    <v-col cols="4" xs="4">
                        <v-icon @click="resta()" color="red">mdi-minus</v-icon>
                    </v-col>

                </v-row>
                <v-row class="mx-auto text-center" dense>
                    <v-col cols="12">
                        <v-textarea readonly dense class="mt-n2" outlined v-model="nombreEdita" auto-grow filled
                            color="deep-purple" label="Descripcion" rows="1"></v-textarea>
                    </v-col>
                </v-row>
                <v-row class="mx-auto text-center mt-n3" dense>
                    <v-col readonly @focus="$event.target.select()" cols="6"
                        v-if="$store.state.permisos.caja_edita_precio">
                        <v-text-field outlined dense @keyup.enter="grabaEdita()" type="number" v-model="precioedita"
                            label="Precio"></v-text-field>
                    </v-col>
                    <v-col cols="6" v-if="false">
                        <v-text-field :disabled="es_bono" @focus="$event.target.select()" outlined dense
                            @keyup.enter="grabaEdita()" type="number" v-model="preciodescuento"
                            label="Descuento"></v-text-field>
                    </v-col> </v-row>
                <v-card-actions class="mt-n6">

                    <v-btn color="red darken-1" text @click="eliminaedita()">
                        Elimina
                    </v-btn>

                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="grabaEdita()">
                        Graba
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_catalogo" max-width="550">
            <div>
                <v-system-bar window dark>
                    <v-icon large color="red" @click="dial_catalogo = false">mdi-close</v-icon>
                </v-system-bar>
            </div>
            <v-card class="pa-1">
                <cat_fijo ref="catFijo" @agrega_lista="agregar_lista($event)" :muestra_tabla="true"
                    :x_categoria="false">
                </cat_fijo>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_guardar" max-width="640">
            <v-card class="pa-2 rounded-xl">
                <v-toolbar dense flat>
                    <v-toolbar-title class="subtitle-1 font-weight-medium">
                        Guardar Pedido
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-chip small class="mr-2" outlined>
                        Total: <strong class="ml-1">{{ redondear(sumaTotal() - sumaDescuentos()) }}</strong>
                    </v-chip>
                    <v-btn icon @click="dial_guardar = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-divider></v-divider>

                <v-card-text class="">
                    <!-- Tipo de comprobante -->
                    <v-row dense class="">
                        <v-col cols="12">
                            <v-radio-group v-model="tipocomprobante" row>
                                <v-radio label="Nota" value="T"></v-radio>
                                <v-radio label="Boleta" value="B"></v-radio>
                                <v-radio label="Factura" value="F"></v-radio>
                            </v-radio-group>
                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="12" sm="4">
                            <v-select readonly outlined dense v-model="documento" :items="documentos" label="Tipo Doc"
                                hide-details prepend-inner-icon="mdi-card-account-details-outline" />
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-text-field readonly outlined dense type="number" v-model="numero" label="Número"
                                append-icon="mdi-magnify" @click:append="BuscarDocumento()"
                                @keyup.enter="BuscarDocumento()" />
                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="12" class="mt-n5">
                            <v-text-field readonly outlined dense v-model="nombreCompleto" label="Nombres completos"
                                prepend-inner-icon="mdi-account" />
                        </v-col>
                        <v-col cols="12" class="mt-n5">
                            <!-- Dirección con icono de mapa al costado -->
                            <v-layout dense align-center>
                                <v-flex>
                                    <v-text-field class="" outlined dense v-model="direccion"
                                        label="Direccion"></v-text-field>
                                </v-flex>
                                <v-btn icon small color="info" class="ml-2 mt-n8" @click="ver_direcciones">
                                    <v-icon>mdi-directions</v-icon>
                                </v-btn>
                            </v-layout>

                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="12" sm="4" class="mt-n5">
                            <v-text-field outlined dense type="tel" v-model="telfcliente" label="Teléfono"
                                prepend-inner-icon="mdi-phone" />
                        </v-col>

                        <v-col cols="12" sm="4" class="mt-n5">
                            <!-- NUEVO: Forma de pago -->
                            <v-select outlined dense v-model="formaPago" :items="['CONTADO', 'CRÉDITO']"
                                label="Forma de pago" prepend-inner-icon="mdi-cash-multiple" />
                        </v-col>

                        <v-col cols="12" sm="4" class="mt-n5" v-if="formaPago === 'CRÉDITO'">
                            <!-- NUEVO: Fecha de vencimiento (hoy + 7) -->
                            <v-text-field outlined dense type="date" v-model="fechaVencimiento" :min="hoyISO"
                                label="Vence el" prepend-inner-icon="mdi-calendar" />
                        </v-col>
                    </v-row>

                    <v-row dense>
                        <v-col cols="12" class="mt-n5">
                            <v-text-field outlined dense v-model="observacion" label="Observación"
                                prepend-inner-icon="mdi-note-text" />
                        </v-col>
                    </v-row>
                    <v-switch v-model="imprime_orden" dense inset color="indigo" :label="`Imprime Orden Pedido`"
                        prepend-icon="mdi-printer" class="mt-0" hide-details />
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="pa-3">
                    <v-spacer></v-spacer>
                    <v-btn text color="grey darken-1" @click="dial_guardar = false">
                        Cancelar
                    </v-btn>
                    <v-btn color="red" dark @click="confirmarGuardado">
                        Guardar
                        <v-icon right>mdi-content-save</v-icon>
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dial_direcciones" max-width="620">
            <v-card>
                <v-toolbar flat dense>
                    <v-toolbar-title>Direcciones del cliente</v-toolbar-title>
                    <v-spacer />
                    <v-btn icon @click="dial_direcciones = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-card-text class="pt-2">
                    <v-radio-group v-model="direccionSeleccionadaIndex">
                        <v-radio v-for="(d, idx) in list_direcciones" :key="idx" :value="idx"
                            :label="formatDireccionLista(d)" class="my-1" />
                    </v-radio-group>
                </v-card-text>

                <v-divider />
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="primary" :disabled="direccionSeleccionadaIndex === null" @click="aplicarDireccion()">
                        Usar esta dirección
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog de progreso -->
        <v-dialog v-model="loadingGuardar" persistent max-width="300">
            <v-card class="pa-6 text-center">
                <v-progress-circular indeterminate size="60" color="red"></v-progress-circular>
                <div class="mt-3">Guardando pedido...</div>
            </v-card>
        </v-dialog>
        <dial_mapas v-model="dialogoMapa" :guardar_auto="true" @cierra="dialogoMapa = false" />
    </div>
</template>

<script>
import moment from 'moment'
import store from '@/store/index'
import cat_fijo from '@/components/catalogo_fijo'
import dial_mapas from '../clientes/dial_mapa.vue'
import { pdfGenera } from './formatos/orden_pedido.js'
import { aplicaPreciosYBonos } from "../funciones/calculo_bonos";
import axios from "axios"
export default {
    name: 'caja',

    components: {
        cat_fijo,
        dial_mapas
    },

    data() {
        return {
            loadingGuardar: false,
            tipocomprobante: 'T',
            documentos: ['SIN DOCUMENTO', 'DNI', 'RUC', 'Pasaporte', 'Carnet de Extranjeria'],
            documento: 'DNI',
            numero: '',
            nombreCompleto: '',
            telfcliente: '',
            direccion: '',
            observacion: '',
            dial_guardar: false,
            dial_catalogo: false,
            moneda: 'S/',
            dialogoProducto: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            listaproductos: [],
            cantidadEdita: '',
            nombreEdita: '',
            precioedita: '',
            preciodescuento: '',
            porcentaje: 0,
            item_selecto: [],
            cliente_s: [],
            formaPago: 'CONTADO',
            fechaVencimiento: '', // ISO yyyy-mm-dd cuando sea crédito
            dialogoMapa: false,
            list_direcciones: [],
            dial_direcciones: false,
            direccionSeleccionadaIndex: null,
            imprime_orden: false,
            es_bono: false,
        }
    },
    created() {
        const data = store?.state?.cliente_selecto;

        if (data) {
            // Busca la dirección principal
            const dirPri = Array.isArray(data.direcciones) && data.direcciones.length
                ? (data.direcciones.find(d => d && d.principal) || data.direcciones[0])
                : null;

            // Usa data.direccion si existe; si no, la principal del array
            const direccion = (data.direccion && String(data.direccion).trim())
                ? data.direccion
                : (dirPri?.direccion || '');

            this.cliente_s = data;
            this.numero = data.documento || '';
            this.direccion = direccion;
            this.documento = data.tipodoc || '';
            this.nombreCompleto = data.nombre || '';
            this.telfcliente = data.telefono || '';
                 this.tipocomprobante = store.state.configuracion.defecto || 'T';
            // OPCIONAL: si tu componente tiene estas props/campos, completa coords
            if ('latitud' in this) this.latitud = (data.latitud ?? dirPri?.latitud ?? null);
            if ('longitud' in this) this.longitud = (data.longitud ?? dirPri?.longitud ?? null);
        }
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.detectarTecla);
        store.commit("emision", '')
        store.commit("cliente_selecto", '')
    },
    computed: {
        hoyISO() {
            return moment().format('YYYY-MM-DD');
        },
    },
    watch: {
        formaPago(nv) {
            if (nv === 'CRÉDITO') {
                // Fecha actual + 7 días
                this.fechaVencimiento = moment().add(7, 'days').format('YYYY-MM-DD');
            } else {
                this.fechaVencimiento = '';
            }
        },
    },
    mounted() {
        window.addEventListener("keydown", this.detectarTecla);
    },
    methods: {
        ver_direcciones() {
            try {
                // Documento del cliente (prioriza lo digitado; si no, el del prop cliente)
                const doc = String(this.numero || this.cliente?.dni || '').trim();
                if (!doc) {
                    store.commit && store.commit('dialogosnackbar', 'Primero ingrese/busque el documento del cliente.');
                    return;
                }

                const cli = (store.state.clientes || []).find(
                    x => String(x.documento || x.id || '') === doc
                );

                const direcs = Array.isArray(cli?.direcciones) ? cli.direcciones : [];
                if (!direcs.length) {
                    store.commit && store.commit('dialogosnackbar', 'Este cliente no tiene direcciones registradas.');
                    return;
                }

                this.list_direcciones = direcs;
                // Preselecciona la principal si existe; si no, la primera
                const idxPrincipal = this.list_direcciones.findIndex(x => !!x.principal);
                this.direccionSeleccionadaIndex = idxPrincipal >= 0 ? idxPrincipal : 0;
                this.dial_direcciones = true;
            } catch (e) {
                console.error(e);
                store.commit && store.commit('dialogosnackbar', 'No se pudieron cargar las direcciones.');
            }
        },
        formatDireccionLista(d) {
            // Texto amigable para listar en el diálogo
            const linea = (d?.direccion || '').trim();
            const dis = (d?.distrito?.nombre || '').trim();
            const prov = (d?.provincia?.nombre || '').trim();
            const ref = (d?.referencia || '').trim();

            const loc = [dis, prov].filter(Boolean).join(', ');
            const base = [linea, loc].filter(Boolean).join(' — ');
            return ref ? `${base} · Ref: ${ref}` : base;
        },

        aplicarDireccion() {
            const d = this.list_direcciones?.[this.direccionSeleccionadaIndex];
            if (!d) { this.dial_direcciones = false; return; }

            // Pegamos al campo 'direccion' del comprobante (calle + distrito + provincia)
            this.direccion = [
                (d?.direccion || '').trim(),
                (d?.distrito?.nombre || '').trim(),
                (d?.provincia?.nombre || '').trim()
            ].filter(Boolean).join(' - ');

            this.dial_direcciones = false;
        },
        grabar() {
            this.recalculoCompleto()
            this.dial_guardar = true;
        },
        abrirMapa() {
            this.dialogoMapa = !this.dialogoMapa
        },
        async confirmarGuardado() {
            // Validaciones mínimas
            if (!this.numero) {
                store.commit("dialogosnackbar", "Ingrese el número de documento");
                return;
            }
            if (!this.nombreCompleto) {
                store.commit("dialogosnackbar", "Ingrese el nombre del cliente");
                return;
            }
            if (this.formaPago === 'CRÉDITO' && !this.fechaVencimiento) {
                store.commit("dialogosnackbar", "Seleccione la fecha de vencimiento");
                return;
            }
            if (!Array.isArray(this.listaproductos) || this.listaproductos.length === 0) {
                store.commit("dialogosnackbar", "Agregue al menos un producto");
                return;
            }

            this.loadingGuardar = true; // 🔹 abre dialogo progreso

            try {
                // Subtotal y totales
                const subTotal = parseFloat(this.sumaTotal() || 0);
                const descuentos = parseFloat(this.sumaDescuentos() || 0);
                const totalGeneral = parseFloat((subTotal - descuentos).toFixed(2));

                // Cabecera (ya lo tienes armado)
                const cabecera = {
                    tipo_comprobante: this.tipocomprobante,
                    moneda: this.moneda,
                    fecha_emision: moment().unix(),
                    condicion_pago: this.formaPago,
                    fecha_vencimiento: this.formaPago === 'CRÉDITO' ? this.fechaVencimiento : null,
                    dias_credito: 0,
                    doc_tipo: this.documento,
                    doc_numero: this.numero,
                    cliente_nombre: this.nombreCompleto,
                    cliente_direccion: this.direccion,
                    cliente_telefono: this.telfcliente || '',
                    subtotal: subTotal,
                    descuentos: descuentos,
                    total: totalGeneral,
                    total_items: this.listaproductos.length,
                    observacion: this.observacion || '',
                    cod_vendedor: store.state.sedeActual.codigo,
                    estado: 'pendiente',
                    ubicacion_cliente: {
                        lat: this.cliente_s.latitud,
                        lng: this.cliente_s.longitud
                    },
                    ubicacion_pedido: store.state.ubicacion_actual
                };

                const detalle = this.listaproductos;

                const payload = { cabecera, detalle, control_stock: true, ruc_asociado: this.$store.state.baseDatos.ruc_asociado };
                console.log('⏺️ Payload listo para enviar:', payload);

                await this.api_rest(payload, "guardar_pedido");
                if (this.imprime_orden) {
                    pdfGenera(cabecera, detalle, store.state.configImpresora.tamano);
                }
                store.commit("dialogosnackbar", "Documento guardado con éxito ✅");
                this.dial_guardar = false;

                this.resetFormulario(); // 🔹 limpia campos

                this.$router.push("/lista"); // 🔹 redirige*/
            } catch (err) {
                console.error("❌ Error guardando:", err);
                store.commit("dialogosnackbar", "Error al guardar el pedido");
            } finally {
                this.loadingGuardar = false; // 🔹 siempre cerrar progress
            }
        },
        resetFormulario() {
            this.numero = "";
            this.nombreCompleto = "";
            this.telfcliente = "";
            this.direccion = "";
            this.observacion = "";
            this.listaproductos = [];
            this.formaPago = "CONTADO";
            this.fechaVencimiento = "";
        },
        async api_rest(data, metodo) {
            console.log(data)
            var a = axios({
                method: 'POST',
                url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                //url: 'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion',
                headers: {},
                data: {
                    "bd": store.state.baseDatos.bd,
                    "data": data,
                    "metodo": metodo
                }
            }).then(response => {
                console.log(response.data)
                return response
            })
            return a
        },
        agregar_lista(value) {
            const items = Array.isArray(value) ? value : [value];

            items.forEach(val => {
                const medidaLinea = (val.medida || '').toString().trim().toUpperCase();
                const esGratuitaNueva = String(val.operacion || '').toUpperCase() === 'GRATUITA';

                // ---------- CASO GRATUITA: acumula cantidad por (id + medida)
                if (esGratuitaNueva) {
                    const existenteGrat = this.listaproductos.find(item =>
                        item.id === val.id &&
                        String(item.medida || '').toUpperCase() === medidaLinea &&
                        String(item.operacion || '').toUpperCase() === 'GRATUITA'
                    );

                    if (existenteGrat) {
                        existenteGrat.cantidad = Number(existenteGrat.cantidad || 0) + Number(val.cantidad || 0);
                        existenteGrat.totalLinea = '0.00'; // siempre 0 en gratuita
                        return; // ya sumamos; no insertamos nuevo
                    }

                    // No existía: insertar línea gratuita
                    this.listaproductos.push({
                        uuid: this.create_UUID().substring(29),
                        factor: val.factor,
                        id: val.id,
                        cantidad: Number(val.cantidad || 0),
                        nombre: val.nombre,
                        medida: medidaLinea,
                        precio: Number(val.precio || 0),
                        precio_base: Number(val.precio || 0),
                        preciodescuento: 0,
                        costo: val.costo,
                        tipoproducto: val.tipoproducto,
                        operacion: 'GRATUITA',
                        peso: 0,
                        controstock: val.controstock,
                        totalLinea: '0.00',
                    });
                    return;
                }

                // ---------- CASO NO GRATUITA: PERMITIR DUPLICADOS, PERO SUMAR SI (id + medida) COINCIDEN
                const existente = this.listaproductos.find(item =>
                    item.id === val.id &&
                    String(item.medida || '').toUpperCase() === medidaLinea &&
                    String(item.operacion || '').toUpperCase() !== 'GRATUITA' // solo acumula con no-gratuita
                );

                if (existente) {
                    // Acumular cantidad. Si el precio nuevo difiere, mantenemos el precio que ya estaba
                    // (si prefieres reemplazar por el nuevo, cambia la asignación de precio).
                    existente.cantidad = Number(existente.cantidad || 0) + Number(val.cantidad || 0);

                    // Mantén el precio de la línea existente
                    const precioUnit = Number(existente.precio || 0);
                    existente.totalLinea = this.redondear(precioUnit * Number(existente.cantidad || 0));
                    // Mantén preciodescuento tal cual (se suman aparte en sumaDescuentos)
                    return; // no inserta nueva línea
                }

                // No había línea equivalente -> insertar una nueva
                this.listaproductos.push({
                    uuid: this.create_UUID().substring(29),
                    factor: val.factor,
                    id: val.id,
                    cantidad: Number(val.cantidad || 0),
                    nombre: val.nombre,
                    medida: medidaLinea,
                    precio: Number(val.precio || 0),
                    precio_base: Number(val.precio || 0),
                    preciodescuento: 0,
                    costo: val.costo,
                    tipoproducto: val.tipoproducto,
                    operacion: val.operacion, // 'GRAVADA', etc.
                    peso: 0,
                    controstock: val.controstock,
                    totalLinea: this.redondear(Number(val.precio || 0) * Number(val.cantidad || 0)),
                });
            });

            // Recalcula todo (precios/bonos/redondeos)
            this.recalculoCompleto();
        },
        recalculoCompleto() {
            this.listaproductos = aplicaPreciosYBonos({
                lineas: this.listaproductos,
                productos: this.$store.state.productos,
                bonos: this.$store.state.bonos,
                createUUID: this.create_UUID,
                redondear: (n) => Number(n).toFixed(this.$store.state.configuracion.decimal),
                inPlace: true,
            });
        },
        grabaEdita() {
            // Normaliza
            const cant = this.toNum(this.cantidadEdita, 0);
            const precioNuevo = this.toNum(this.precioedita, -1); // -1 para detectar inválido
            const descNuevo = this.toNum(this.preciodescuento, 0);

            if (cant <= 0) {
                alert('Ingrese cantidad válida');
                return;
            }
            if (!this.esBono && this.$store.state.configuracion.precio_minimo) {

                const prod = store.state.productos.find(p => String(p.id) === String(this.item_selecto.id)) || {};
                const factor = (
                    Number(this.item_selecto?.factor) &&
                    this.item_selecto.medida !== 'UNIDAD' &&
                    Number(this.item_selecto.factor) !== 1
                ) ? Number(this.item_selecto.factor) : 1;

                // bases numéricas
                const baseMay2 = Number(prod.precio_may2) || 0;
                const baseMay1 = Number(prod.precio_may1) || 0;
                const basePrecio = Number(prod.precio) || 0;

                // elige base mínima preferente
                let baseMinima = basePrecio;
                if (baseMay2 > 0) baseMinima = baseMay2;
                else if (baseMay1 > 0) baseMinima = baseMay1;

                // aplica factor y redondea si tienes helper
                const precioMinimo = this.redondear ? this.redondear(baseMinima * factor) : (baseMinima * factor);
                if (Number(this.precioedita) < precioMinimo) {
                    alert(`Precio menor al mínimo (${precioMinimo})`);
                    return;
                }
            }
            const pos = this.listaproductos.findIndex(e => e.uuid === this.item_selecto.uuid);
            if (pos === -1) return;

            const linea = this.listaproductos[pos];

            // Valida stock si corresponde
            if (linea.controstock) {
                const prod = (this.$store.state.productos || []).find(p => p.id == linea.id);
                if (prod && this.toNum(prod.stock, 0) < cant) {
                    alert('Producto sin Stock');
                    return;
                }
            }

            // Actualiza cantidad siempre
            linea.cantidad = cant;

            // ===== Caso BONO / GRATUITA =====
            if (this.es_bono) {
                linea.operacion = 'GRATUITA';
                // Mantén la info, pero el total mostrado es 0
                linea.precio = this.toNum(this.precioedita, 0);
                linea.preciodescuento = descNuevo;
                linea.totalLinea = this.redondear(0);
                // opcional: marca manual
                linea.precio_manual = true;
                this.dialogoProducto = false;
                return;
            }

            // ===== Caso NO BONO =====
            // Si estaba como gratuita, vuelve a su operacion normal
            if (String(linea.operacion || '').toUpperCase() === 'GRATUITA') {
                linea.operacion = 'GRAVADA';
            }

            // Si el usuario editó el precio, úsalo (>= 0)
            if (precioNuevo >= 0) {
                linea.precio = precioNuevo;
                linea.precio_base = precioNuevo;  // para coherencia con tu modelo
                // opcional: marca que es precio manual por si tu calculador de bonos lo respeta
                linea.precio_manual = true;
            }

            // Descuento por línea si lo usas (en tu UI está oculto, pero lo dejo coherente)
            linea.preciodescuento = descNuevo;

            // Recalcula total mostrado en tarjeta
            const total = (this.toNum(linea.precio, 0) * cant);
            linea.totalLinea = this.redondear(total);

            this.dialogoProducto = false;

            // Si tu función aplicaPreciosYBonos NO debe pisar el precio manual,
            // deja esta marca y ajústala en ese helper para que respete "precio_manual".
            this.recalculoCompleto();
        },


        suma() {
            if (this.item_selecto.controstock) {
                var producto = store.state.productos.find(item => item.id == this.item_selecto.id)
                if (producto.stock <= this.cantidadEdita) {
                    alert('Producto sin Stock')
                    return
                }
            }
            this.cantidadEdita = parseInt(this.cantidadEdita) + 1
        },
        resta() {
            if (this.cantidadEdita > 1) {
                this.cantidadEdita = parseInt(this.cantidadEdita) - 1
            }
        },
        eliminaedita() {
            var pos = this.listaproductos.map(e => e.uuid).indexOf(this.item_selecto.uuid)
            this.listaproductos.splice(pos, 1)
            this.dialogoProducto = false
            this.recalculoCompleto()
        },
        editaProducto(val) {
            this.item_selecto = val
            this.cantidadEdita = val.cantidad
            this.nombreEdita = val.nombre
            this.precioedita = val.precio
            this.preciodescuento = val.preciodescuento
            // Marcar el checkbox según la operacion actual
            this.es_bono = String(val.operacion || '').toUpperCase() === 'GRATUITA'

            this.dialogoProducto = true
        },


        sumaTotal() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                if (this.listaproductos[i].operacion != 'GRATUITA') {
                    suma = suma + (this.listaproductos[i].cantidad * this.listaproductos[i].precio)
                }
            }
            this.totalDocumento = suma.toFixed(2)
            return suma.toFixed(2)
        },
        sumaDescuentos() {
            var suma = 0
            for (var i = 0; i < this.listaproductos.length; i++) {
                suma = suma + parseFloat(this.listaproductos[i].preciodescuento)
            }
            this.totalDescuento = (suma).toFixed(2)
            return (suma).toFixed(2)
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        abre_catalogo() {
            this.dial_catalogo = true
        },
        toNum(v, def = 0) {
            const n = Number(v);
            return Number.isFinite(n) ? n : def;
        },
        tieneMay1(p) {
            return this.toNum(p && p.precio_may1, 0) > 0 && this.toNum(p && p.escala_may1, 0) > 0;
        },
        tieneMay2(p) {
            return this.toNum(p && p.precio_may2, 0) > 0 && this.toNum(p && p.escala_may2, 0) > 0;
        },
        sugerirTier(producto, cantidadRaw) {
            const cantidad = this.toNum(cantidadRaw, 0);

            const hayMay1 = this.tieneMay1(producto);
            const hayMay2 = this.tieneMay2(producto);

            if (!hayMay1 && !hayMay2) return 1;

            if (hayMay1 && !hayMay2) {
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                return cantidad >= esc1 ? 2 : 1;
            }

            if (hayMay1 && hayMay2) {
                const esc1 = this.toNum(producto.escala_may1, Infinity);
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                const lim1 = Math.min(esc1, esc2);
                const lim2 = Math.max(esc1, esc2);
                if (cantidad >= lim2) return 3;
                if (cantidad >= lim1) return 2;
                return 1;
            }
            // Caso raro: solo may2
            if (!hayMay1 && hayMay2) {
                const esc2 = this.toNum(producto.escala_may2, Infinity);
                return cantidad >= esc2 ? 3 : 1;
            }
            return 1;
        },
        precioPorTier(producto, tier) {
            if (tier === 3) return this.toNum(producto.precio_may2, this.toNum(producto.precio, 0));
            if (tier === 2) return this.toNum(producto.precio_may1, this.toNum(producto.precio, 0));
            return this.toNum(producto.precio, 0);
        },

    },

}
</script>
<style>
.selected-row {
    background-color: #b2ff85;
    /* Puedes cambiar el color de fondo para la fila seleccionada */
}

.table-container {
    height: 65vh;
    overflow-y: auto;
}

/* La columna ocupa el alto de la vista para que el scroll viva dentro */
.venta-col {
    min-height: 100vh;
}

/* Área desplazable solo para la lista (clave: min-height:0 en hijos flex) */
.tabla-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0;
}

/* Mantiene el card de totales visible abajo (opcional) */
.totals-sticky {
    position: sticky;
    bottom: 0;
    z-index: 5;
}

/* Pequeño ajuste para iOS/Android (evita “salto” al abrir teclado) */
@supports (height: 100dvh) {
    .venta-col {
        min-height: 100dvh;
    }
}
</style>
