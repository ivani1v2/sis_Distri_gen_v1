<template>
    <v-dialog v-model="dial" max-width="650" persistent>
        <!-- Barra superior con cerrar -->
        <div>
            <v-system-bar window dark>
                <v-icon color="red" @click="cerrar_dialogo()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h2 class="red--text">
                    <strong>{{ moneda }} {{ redondear(item_selecto.total) }}</strong>
                </h2>
                <v-spacer></v-spacer>
                <span>N° {{ item_selecto.id }}</span>
            </v-system-bar>
        </div>

        <v-card>
            <v-card-subtitle class="grey--text text--darken-4">
                <span class="grey--text text--darken-4">
                    <h4 class="">{{ item_selecto.dni }} - {{ item_selecto.cliente }}</h4>
                </span>

                <v-chip x-small :color="chipPagoColor(item_selecto.forma_pago)" dark
                    class="text-uppercase font-weight-bold mr-2" style="font-size:10px;letter-spacing:.03em;">
                    {{ chipPagoTexto(item_selecto.forma_pago) }}
                </v-chip>

                <v-chip x-small :color="chipItemsColor()" dark class="font-weight-bold mr-2"
                    style="font-size:10px;letter-spacing:.03em;">
                    {{ totalItemsPedido }} ítems
                </v-chip>

                <v-chip x-small color="deep-orange darken-2" dark class="font-weight-bold"
                    style="font-size:10px;letter-spacing:.03em;">
                    {{ totalRechazados }} rechazados
                </v-chip>
                <br />
            </v-card-subtitle>

            <!-- OBSERVACIONES (cabecera) -->
            <v-card-text class="pt-0">
                <v-textarea v-model="observaciones" outlined dense rows="2" auto-grow
                    label="Observaciones de entrega (opcional)" />
            </v-card-text>

            <v-card-actions class="mt-n12">
                <v-row dense>
                    <v-col cols="4" class="text-center px-1">
                        <v-btn block x-small color="error" class="ma-0" @click="abrirDialogoRechazo">
                            <v-icon left small>mdi-delete</v-icon>
                            {{ $vuetify.breakpoint.xs ? 'Rechazar' : 'Agregar rechazo' }}
                        </v-btn>
                    </v-col>
                    <v-col cols="4" class="text-center px-1">
                        <v-btn block x-small color="success" class="ma-0" @click="abrirPagos">
                            <v-icon left small>mdi-check</v-icon>
                            {{ $vuetify.breakpoint.xs ? 'Cobrar' : 'Confirmar' }}
                        </v-btn>
                    </v-col>
                    <v-col cols="4" class="text-center px-1">
                        <v-btn block x-small color="info" class="ma-0" @click="verDetallePedido">
                            <v-icon left small>mdi-file-document-outline</v-icon>
                            {{ $vuetify.breakpoint.xs ? 'Ver' : 'Detalle Pedido' }}
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-actions>

            <v-divider class="mb-2"></v-divider>

            <!-- LISTA DE RECHAZOS en tarjetas -->
            <v-simple-table class="elevation-0" dense>
                <thead class="d-none">
                    <tr>
                        <th>Ítems</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="it in itemsCalculados" :key="it.uuid || it.id">
                        <td class="pa-0 mt-n1 mb-n1">
                            <v-card class="ma-1 pa-2" outlined :elevation="0" ripple>
                                <div class="d-flex align-center mt-n2 mb-n2">
                                    <!-- Contenido -->
                                    <div class="flex-grow-1 mr-2">
                                        <div class="text-caption grey--text text--darken-1">
                                            <span>
                                                Precio: {{ moneda }} {{ redondear(it.es_rechazo_parcial ? unitPrice(it)
                                                    / (it.factor || 1) : unitPrice(it)) }}
                                            </span>
                                            <v-chip v-if="it.medida" x-small class="ml-1" label>{{ it.es_rechazo_parcial
                                                ? 'UNIDAD' : it.medida }}</v-chip>
                                            <v-chip v-if="it.operacion === 'GRATUITA'" x-small class="ml-1" color="pink"
                                                text-color="white" label>
                                                Gratuita
                                            </v-chip>
                                        </div>

                                        <div class="mt-1 text-subtitle-2 text-truncate" style="max-width:70vw;">
                                            <span class="font-weight-bold red--text">{{ Number(it.cantidad_rechazo ||
                                                it.cantidad) }}×</span>
                                            <span class="caption grey--text">[{{ it.codigo || it.id }}]</span>
                                            {{ it.nombre }}
                                        </div>
                                    </div>

                                    <!-- Total -->
                                    <div class="text-right mr-1">
                                        <div class="subtitle-2 font-weight-bold">
                                            {{ moneda }} {{ redondear(totalLineaRechazo(it)) }}
                                        </div>
                                        <div class="caption grey--text">Total</div>
                                        <v-btn icon x-small class="mt-1" @click="quitarRechazo(it)">
                                            <v-icon small>mdi-close</v-icon>
                                        </v-btn>
                                    </div>
                                </div>
                            </v-card>
                        </td>
                    </tr>

                    <tr v-if="!itemsCalculados.length">
                        <td class="py-6 text-center grey--text">
                            Aún no hay productos rechazados. Usa “Agregar rechazo”.
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>

        <!-- DIÁLOGO AGREGAR RECHAZO (con cantidad) -->
        <v-dialog v-model="dialRechazo" max-width="520">
            <v-card>
                <v-card-title class="subtitle-1">Agregar ítem rechazado</v-card-title>
                <v-card-text>

                    <v-autocomplete v-model="rechazoSeleccion" :items="itemsElegibles" item-value="uuid"
                        :item-text="formatItemText" outlined dense clearable hide-selected
                        label="Buscar producto del comprobante" :filter="customFilter" @change="onSelectRechazo">
                        <template v-slot:item="{ item }">
                            <div class="d-flex justify-space-between align-center" style="width:100%;">
                                <div class="text-truncate" style="max-width:70%;">
                                    <span class="caption blue-grey--text">[{{ item.codigo || item.id }}]</span>
                                    {{ item.nombre }}
                                    <span class="grey--text">
                                        · {{ Number(item.cantidad) }} {{ item.medida || '' }}
                                    </span>

                                    <!-- Etiqueta gratuita -->
                                    <v-chip v-if="String(item.operacion || '').toUpperCase() === 'GRATUITA'" x-small
                                        class="ml-1" color="pink" text-color="white" label>
                                        Gratuita
                                    </v-chip>
                                </div>

                                <div class="text-right">
                                    <!-- Si es gratuita, valor 0 en rojo -->
                                    <span v-if="String(item.operacion || '').toUpperCase() === 'GRATUITA'"
                                        class="red--text font-weight-bold">
                                        {{ moneda }} {{ redondear(0) }}
                                    </span>

                                    <!-- Si NO es gratuita, muestra el total real -->
                                    <span v-else>
                                        {{ moneda }} {{
                                            redondear(
                                                Number(item.total_antes_impuestos) + Number(item.total_impuestos)
                                            )
                                        }}
                                    </span>
                                </div>
                            </div>
                        </template>
                    </v-autocomplete>


                    <div v-if="seleccionActual" class="mt-2">
                        <div class="caption grey--text mb-1">
                            Disponible: {{ cantidadDisponibleTexto }}
                        </div>

                        <!-- Si el factor > 1 y medida != UNIDAD, permite rechazo parcial -->
                        <div v-if="permiteRechazoParcial" class="mb-2">
                            <v-chip x-small color="info" class="mb-1">
                                Factor: {{ seleccionActual.factor }} unidades por {{ seleccionActual.medida }}
                            </v-chip>
                            <v-radio-group v-model="modoRechazo" row dense hide-details class="mt-1">
                                <v-radio label="Rechazar completo" value="completo" />
                                <v-radio label="Rechazar parcial (abrir paquete)" value="parcial" />
                            </v-radio-group>
                        </div>

                        <!-- Cantidad a rechazar según modo -->
                        <v-text-field v-if="modoRechazo === 'completo' || !permiteRechazoParcial"
                            v-model.number="qtyRechazo" type="number" outlined dense hide-details :min="1"
                            :max="Number(seleccionActual.cantidad)" :label="labelCantidadRechazo"
                            @focus="$event.target.select()" />

                        <!-- Modo parcial: rechazar unidades del factor -->
                        <div v-if="modoRechazo === 'parcial' && permiteRechazoParcial">
                            <v-text-field v-model.number="qtyRechazoParcial" type="number" outlined dense hide-details
                                :min="1" :max="maxUnidadesParciales"
                                :label="`Unidades a rechazar (máx ${maxUnidadesParciales})`"
                                @focus="$event.target.select()" />
                            <div class="caption grey--text mt-1">
                                Rechazando {{ qtyRechazoParcial || 0 }} unidades de {{ totalUnidadesDisponibles }}
                                totales
                            </div>
                        </div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text small @click="dialRechazo = false">Cancelar</v-btn>
                    <v-btn small color="error" :disabled="!seleccionActual || !qtyValida" @click="confirmAddRechazo">
                        <v-icon left small>mdi-delete</v-icon>
                        Agregar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- DIÁLOGO MÉTODOS DE PAGO (mínimo) -->
        <v-dialog v-model="dialPagos" max-width="500" transition="dialog-bottom-transition">
            <v-card class="pa-3">
                <v-toolbar flat dense class="mb-2">
                    <v-toolbar-title class="subtitle-1">Métodos de pago</v-toolbar-title>
                    <v-spacer />
                    <v-btn icon @click="dialPagos = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <div class="mb-4 text-center">
                    <v-chip small class="mr-1" outlined>
                        Pedido: {{ moneda }} {{ redondear(item_selecto.total) }}
                    </v-chip>
                    <v-chip small class="mr-1" color="deep-orange" outlined>
                        Rechazo: {{ moneda }} {{ redondear(totalRechazosMonto) }}
                    </v-chip>
                    <v-chip small class="mr-1" color="green" outlined>
                        Cobrar: {{ moneda }} {{ redondear(totalACobrar) }}
                    </v-chip>
                </div>

                <!-- MÉTODOS DE PAGO -->
                <v-row dense v-for="p in pagosEntrega" :key="p.nombre" class="align-center">
                    <v-col cols="12">
                        <v-text-field :label="p.nombre.toUpperCase()" :prefix="moneda" :value="p.monto"
                            @input="val => { p.monto = val; onMontoInput(p) }"
                            :type="$store.state.esmovil ? 'tel' : 'number'" inputmode="decimal" step="0.01" outlined
                            dense hide-details class="mpago-field" :class="{ 'mpago-activo': parseFloat(p.monto) > 0 }"
                            @focus="$event.target.select()">
                            <template v-slot:prepend-inner>
                                <v-avatar size="28" class="mr-2" tile>
                                    <v-img :src="busca_ico(p.nombre)" @click.stop="cambia_modo_pago(p)" />
                                </v-avatar>
                            </template>

                            <template v-slot:append>
                                <v-btn icon x-small @click.stop="cambia_modo_pago(p)">
                                    <v-icon small>mdi-arrow-collapse-down</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-col>
                </v-row>

                <div class="mt-n2 mb-3 caption grey--text" v-if="diferenciaTotal !== 0">
                    Falta/Exceso: {{ moneda }} {{ redondear(diferenciaTotal) }}
                </div>

                <!-- BOTÓN PARA MOSTRAR CRÉDITO -->
                <v-btn v-if="!esCredito" small block color="indigo" class="mb-2" @click="toggleCredito">
                    <v-icon left small>mdi-calendar-clock</v-icon>
                    Generar crédito
                </v-btn>
                <v-expand-transition v-if="!esCredito">
                    <div v-if="mostrarCredito" class="pa-2 mb-3 grey lighten-4 rounded">
                        <v-text-field v-model="montoCredito" label="Monto del crédito" :prefix="moneda" type="number"
                            inputmode="decimal" step="0.01" dense outlined hide-details class="mb-2"
                            @input="onCreditoInput" />

                        <v-text-field v-model="fechaVenceCredito" label="Fecha de vencimiento" type="date" dense
                            outlined hide-details class="mb-2" readonly />

                        <!-- 🔴 SIN botón de guardar aquí: el crédito se genera en Cobrar y finalizar -->
                    </div>
                </v-expand-transition>

                <v-btn class="mt-2" block color="success" :disabled="!pagosValidos" @click="finalizarEntrega">
                    <v-icon left>mdi-cash-check</v-icon>
                    Cobrar y finalizar
                </v-btn>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoDetalle" :max-width="$vuetify.breakpoint.smAndDown ? '100%' : '700px'"
            :fullscreen="$vuetify.breakpoint.smAndDown">
            <v-card>
                <v-toolbar flat dense color="grey lighten-3">
                    <v-toolbar-title class="text-subtitle-2">
                        <v-icon small left>mdi-file-document-outline</v-icon>
                        Pedido #{{ item_selecto.id }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon small @click="dialogoDetalle = false">
                        <v-icon small>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-card-text class="pa-3">
                    <div :class="$vuetify.breakpoint.smAndDown ? 'd-flex flex-column' : 'd-flex justify-space-between align-center'"
                        class="mb-3">
                        <div>
                            <span class="font-weight-medium">{{ item_selecto.cliente }}</span>
                            <span class="grey--text text-caption ml-2">{{ item_selecto.dni }}</span>
                        </div>
                        <div :class="$vuetify.breakpoint.smAndDown ? 'mt-1' : 'text-right'">
                            <span class="font-weight-bold primary--text">{{ moneda }} {{ redondear(item_selecto.total)
                            }}</span>
                        </div>
                    </div>

                    <div v-if="$vuetify.breakpoint.smAndDown">
                        <v-card v-for="item in detallePedidoItems" :key="item.codigo" outlined class="mb-2 pa-2">
                            <div class="d-flex justify-space-between align-start">
                                <div class="flex-grow-1" style="max-width: 70%;">
                                    <div class="text-body-2 font-weight-medium">{{ item.nombre }}</div>
                                    <div class="text-caption grey--text">{{ item.codigo }}</div>
                                    <v-chip v-if="item.operacion === 'GRATUITA'" x-small color="pink" text-color="white"
                                        class="mt-1">Gratis</v-chip>
                                </div>
                                <div class="text-right">
                                    <div class="text-caption grey--text">{{ item.cantidad }} {{ item.medida }}</div>
                                    <div class="text-caption">{{ moneda }} {{ item.precio_unit.toFixed(2) }}</div>
                                    <div class="font-weight-bold"
                                        :class="{ 'red--text': item.operacion === 'GRATUITA' }">
                                        {{ moneda }} {{ item.total.toFixed(2) }}
                                    </div>
                                </div>
                            </div>
                        </v-card>
                        <v-card color="grey lighten-4" class="pa-3">
                            <div class="d-flex justify-space-between">
                                <span class="font-weight-bold">TOTAL</span>
                                <span class="font-weight-bold primary--text">{{ moneda }} {{ detallePedidoTotal
                                }}</span>
                            </div>
                        </v-card>
                    </div>

                    <v-simple-table v-else dense>
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th class="text-caption">Producto</th>
                                    <th class="text-caption text-center">Cant</th>
                                    <th class="text-caption text-right">P.Unit</th>
                                    <th class="text-caption text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in detallePedidoItems" :key="item.codigo">
                                    <td>
                                        <div class="text-body-2">
                                            {{ item.nombre }}
                                            <v-chip v-if="item.operacion === 'GRATUITA'" x-small color="pink"
                                                text-color="white" class="ml-1">
                                                Gratis
                                            </v-chip>
                                        </div>
                                        <div class="text-caption grey--text">{{ item.codigo }}</div>
                                    </td>
                                    <td class="text-center">{{ item.cantidad }} {{ item.medida }}</td>
                                    <td class="text-right">{{ moneda }} {{ item.precio_unit.toFixed(2) }}</td>
                                    <td class="text-right font-weight-medium">
                                        <span :class="{ 'red--text': item.operacion === 'GRATUITA' }">
                                            {{ moneda }} {{ item.total.toFixed(2) }}
                                        </span>
                                    </td>
                                </tr>
                                <tr class="grey lighten-4">
                                    <td colspan="3" class="text-right font-weight-bold">TOTAL</td>
                                    <td class="text-right font-weight-bold primary--text">{{ moneda }} {{
                                        detallePedidoTotal }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>

    </v-dialog>
</template>

<script>

import { all_detalle_p, grabaCabecera_p, nuevo_detalle_entrega, nuevaCuentaxcobrar, incrementa_procesados_reparto, marcaPedidoComoContabilizado, db } from "../../../db";

export default {
    props: { grupo: null, item_selecto: { type: Object, required: true } },
    data() {
        return {
            dial: false,
            array_detalle: [],
            moneda: "S/.",
            observaciones: "",
            // Rechazos
            dialRechazo: false,
            rechazoSeleccion: null,
            seleccionActual: null,
            qtyRechazo: 1,
            qtyRechazoParcial: 1,
            modoRechazo: 'completo',
            rechazados: [],
            // Pagos
            dialPagos: false,
            pagosEntrega: [],
            mostrarCredito: false,
            montoCredito: "",
            fechaVenceCredito: "",
            dialogoDetalle: false,
            detallePedido: "",
            detallePedidoItems: [],
            detallePedidoTotal: 0
        };
    },
    async created() {
        console.log(this.item_selecto);
        this.item_selecto.id_grupo = this.item_selecto.id_grupo || this.grupo;
        await this.busca_detalle();
        this.moneda = this.item_selecto.moneda || "S/";
        const lista = (this.$store?.state?.modopagos || []).map(n => ({ nombre: n, monto: "" }));
        this.pagosEntrega = lista;
        this.dial = true;
    },
    computed: {
        esCredito() {
            const f = (this.item_selecto?.forma_pago || "").toString().toLowerCase();
            return f === "credito" || f === "crédito";
        },

        totalItemsPedido() { return (this.array_detalle || []).length; },
        itemsCalculados() { return this.rechazados; },
        totalRechazados() { return this.rechazados.length; },
        itemsElegibles() {
            const usados = new Set(this.rechazados.map(r => r.uuid || r.id));
            return (this.array_detalle || []).filter(x => !usados.has(x.uuid || x.id));
        },
        qtyValida() {
            if (!this.seleccionActual) return false;

            if (this.modoRechazo === 'parcial' && this.permiteRechazoParcial) {
                const q = Number(this.qtyRechazoParcial || 0);
                return q >= 1 && q <= this.maxUnidadesParciales;
            }

            const q = Number(this.qtyRechazo || 0);
            return q >= 1 && q <= Number(this.seleccionActual.cantidad || 0);
        },

        permiteRechazoParcial() {
            if (!this.seleccionActual) return false;
            const factor = Number(this.seleccionActual.factor || 1);
            const medida = String(this.seleccionActual.medida || '').toUpperCase();
            return factor > 1 && medida !== 'UNIDAD' && medida !== 'UND' && medida !== 'NIU';
        },

        totalUnidadesDisponibles() {
            if (!this.seleccionActual) return 0;
            const factor = Number(this.seleccionActual.factor || 1);
            const cantidad = Number(this.seleccionActual.cantidad || 0);
            return cantidad * factor;
        },

        maxUnidadesParciales() {
            if (!this.seleccionActual) return 0;
            const factor = Number(this.seleccionActual.factor || 1);
            const cantidad = Number(this.seleccionActual.cantidad || 0);
            return cantidad * factor;
        },

        cantidadDisponibleTexto() {
            if (!this.seleccionActual) return '';
            const cantidad = Number(this.seleccionActual.cantidad || 0);
            const medida = this.seleccionActual.medida || '';
            const factor = Number(this.seleccionActual.factor || 1);

            if (factor > 1 && medida !== 'UNIDAD' && medida !== 'UND' && medida !== 'NIU') {
                return `${cantidad} ${medida} (${cantidad * factor} unidades)`;
            }
            return `${cantidad} ${medida}`;
        },

        labelCantidadRechazo() {
            if (!this.seleccionActual) return 'Cantidad a rechazar';
            const medida = this.seleccionActual.medida || '';
            return `Cantidad de ${medida} a rechazar`;
        },

        totalRechazosMonto() {
            return this.rechazados.reduce((acc, it) => {
                if (String(it.operacion || '').toUpperCase() === 'GRATUITA') return acc;
                return acc + this.totalLineaRechazo(it);
            }, 0);
        },
        totalACobrar() {
            if (this.esCredito) return 0;
            const t = Number(this.item_selecto?.total || 0) - Number(this.totalRechazosMonto || 0);
            return t < 0 ? 0 : t;
        },

        sumaPagos() {
            return this.pagosEntrega.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        },
        montoCreditoNumber() {
            return this.mostrarCredito ? Number(this.montoCredito || 0) : 0;
        },

        sumaTotalConCredito() {
            return this.sumaPagos + this.montoCreditoNumber;
        },

        diferenciaTotal() {
            return Number(this.totalACobrar.toFixed(2)) - Number(this.sumaTotalConCredito.toFixed(2));
        },

        pagosValidos() {
            return Math.abs(this.diferenciaTotal) < 0.01;
        }
    },
    methods: {
        async busca_detalle() {
            const snap = await all_detalle_p(this.item_selecto.id_grupo, this.item_selecto.id).once("value");
            const raw = snap.val() || [];
            console.log("Detalle pedido leído:", raw);
            if (Array.isArray(raw)) {
                this.array_detalle = raw.map(x => ({ ...x, uuid: x.uuid || `${x.id}-${Math.random()}` }));
            } else {
                this.array_detalle = Object.keys(raw).map(k => ({ uuid: k, ...raw[k] }));
            }
        },
        redondear(n) { const num = Number(n || 0); return num.toFixed(2); },
        cerrar_dialogo() { this.dial = false; this.$emit("cerrar"); },

        chipPagoColor(forma) {
            const f = (forma || "").toLowerCase();
            if (f === "contado") return "green darken-2";
            if (f === "credito" || f === "crédito") return "indigo darken-2";
            return "grey darken-1";
        },
        chipPagoTexto(forma) {
            if (!forma) return "—";
            const f = forma.toLowerCase();
            if (f === "contado") return "contado";
            if (f === "credito" || f === "crédito") return "crédito";
            return forma;
        },
        chipItemsColor() { return "blue-grey darken-2"; },

        abrirDialogoRechazo() {
            this.rechazoSeleccion = null;
            this.seleccionActual = null;
            this.qtyRechazo = 1;
            this.dialRechazo = true;
        },
        formatItemText(it) {
            if (!it) return "";
            const esGratuita = String(it.operacion || "").toUpperCase() === "GRATUITA";
            const totalReal = Number(it.total_antes_impuestos) + Number(it.total_impuestos);
            const total = esGratuita ? this.redondear(0) : this.redondear(totalReal);

            return `${it.nombre} · ${Number(it.cantidad)} ${it.medida || ""} · ${this.moneda
                } ${total}`;
        },

        customFilter(item, queryText, itemText) {
            const q = (queryText || "").toLowerCase();
            return (itemText || "").toLowerCase().includes(q)
                || String(item.nombre || "").toLowerCase().includes(q);
        },
        onSelectRechazo(uuid) {
            if (!uuid) { this.seleccionActual = null; return; }
            const it = this.itemsElegibles.find(x => (x.uuid || x.id) === uuid);
            this.seleccionActual = it || null;
            this.qtyRechazo = 1;
            this.qtyRechazoParcial = 1;
            this.modoRechazo = 'completo';
        },
        confirmAddRechazo() {
            if (!this.seleccionActual || !this.qtyValida) return;

            let cantidadRechazo;
            let esParcial = false;
            const factor = Number(this.seleccionActual.factor || 1);
            const medida = String(this.seleccionActual.medida || '').toUpperCase();

            if (this.modoRechazo === 'parcial' && this.permiteRechazoParcial) {
                cantidadRechazo = Number(this.qtyRechazoParcial);
                esParcial = true;
            } else {
                cantidadRechazo = Number(this.qtyRechazo);
                if (factor > 1 && medida !== 'UNIDAD' && medida !== 'UND' && medida !== 'NIU') {
                    cantidadRechazo = cantidadRechazo * factor;
                    esParcial = false;
                }
            }

            const it = {
                ...this.seleccionActual,
                cantidad_rechazo: cantidadRechazo,
                es_rechazo_parcial: esParcial,
                factor: factor,
                medida_original: this.seleccionActual.medida,
                cantidad_original: Number(this.seleccionActual.cantidad)
            };

            this.rechazados.push(it);
            this.dialRechazo = false;
            this.rechazoSeleccion = null;
            this.seleccionActual = null;
            this.qtyRechazo = 1;
            this.qtyRechazoParcial = 1;
            this.modoRechazo = 'completo';
        },
        quitarRechazo(it) {
            const id = it.uuid || it.id;
            this.rechazados = this.rechazados.filter(r => (r.uuid || r.id) !== id);
        },

        unitPrice(it) {
            const p = Number(it.precio);
            if (Number.isFinite(p) && p > 0) return p;
            const tot = Number(it.total_antes_impuestos || it.totalLinea || 0);
            const cant = Number(it.cantidad) || 1;
            return cant ? (tot / cant) : 0;
        },
        totalLineaRechazo(it) {
            if (String(it.operacion || '').toUpperCase() === 'GRATUITA') return 0;

            const cantidadRechazo = Number(it.cantidad_rechazo || 0);
            const factor = Number(it.factor || 1);
            const medida = String(it.medida_original || it.medida || '').toUpperCase();

            let precioPorUnidadVenta = this.unitPrice(it);
            let total = 0;

            if (it.es_rechazo_parcial) {
                total = (precioPorUnidadVenta / factor) * cantidadRechazo;
            } else {
                if (factor > 1 && medida !== 'UNIDAD' && medida !== 'UND' && medida !== 'NIU') {
                    const cajasRechazadas = cantidadRechazo / factor;
                    total = precioPorUnidadVenta * cajasRechazadas;
                } else {
                    total = precioPorUnidadVenta * cantidadRechazo;
                }
            }

            return total;
        },

        abrirPagos() {
            const restante = Number(this.totalACobrar.toFixed(2));
            this.pagosEntrega = (this.$store?.state?.modopagos || []).map((n, idx) => ({
                nombre: n,
                monto: idx === 0 ? (restante > 0 ? restante.toFixed(2) : '') : ''
            }));
            this.dialPagos = true;
        },

        onCreditoInput() {
            const saldo = this.getMetodoSaldo();
            if (!saldo) return;

            const total = Number(this.totalACobrar.toFixed(2));
            const otros = this.sumaSin(saldo.nombre);
            let restante = Number((total - otros - this.montoCreditoNumber).toFixed(2));

            if (restante < 0) restante = 0;
            saldo.monto = restante ? restante.toFixed(2) : '0';
        },

        async finalizarEntrega() {
            if (!this.pagosValidos) return;

            const rechazos = this.rechazados.map(it => {
                const factor = Number(it.factor || 1);
                let precioUnit = Number(this.unitPrice(it)) || 0;
                if (it.es_rechazo_parcial && factor > 1) {
                    precioUnit = precioUnit / factor;
                }

                return {
                    uuid: it.uuid || it.id,
                    id_producto: it.id,
                    nombre: it.nombre,
                    cantidad: Number(it.cantidad_rechazo || 0),
                    total_linea: Number(this.totalLineaRechazo(it) || 0),
                    medida: it.medida || "",
                    precio_unit: precioUnit,
                    operacion: it.operacion || "",
                    factor: factor,
                    es_rechazo_parcial: it.es_rechazo_parcial || false,
                    cantidad_original: Number(it.cantidad_original || it.cantidad || 0)
                };
            });

            const pagos_filtrados = this.pagosEntrega
                .filter(p => parseFloat(p.monto) > 0)
                .map(p => ({ nombre: p.nombre, monto: Number(p.monto) }));

            const totalCobrar = Number(this.totalACobrar.toFixed(2));
            const totalPagado = Number(this.sumaPagos.toFixed(2));
            const montoCred = Number(this.montoCreditoNumber.toFixed(2));

            let fechaVenceUnix = null;
            if (montoCred > 0) {
                if (!this.fechaVenceCredito) {
                    this.setFechaVencePorDefecto();
                }
                fechaVenceUnix = Math.floor(
                    new Date(this.fechaVenceCredito + "T23:59:59").getTime() / 1000
                );
            }

            const estadoEntrega = rechazos.length > 0 ? "parcial" : "entregado";

            const data = {
                id_grupo: this.item_selecto.id_grupo,
                id_pedido: this.item_selecto.id,
                rechazos,
                rechazos_count: rechazos.length,
                pagos_entrega: pagos_filtrados,
                observaciones: this.observaciones || "",
                total_pedido: Number(this.item_selecto.total || 0),
                total_rechazado: Number(this.totalRechazosMonto.toFixed(2)),
                total_cobrar: totalCobrar,
                total_cobrado: totalPagado,
                total_credito: montoCred,
                fecha_vence_credito: fechaVenceUnix
            };

            let yaFueContabilizado = false;
            try {
                const contabilizadosRef = db.database().ref(this.$store.state.baseDatos.bd)
                    .child("pedidos")
                    .child("cabecera_reparto")
                    .child(this.item_selecto.id_grupo)
                    .child("resumen")
                    .child("pedidos_contabilizados");

                const snapshot = await contabilizadosRef.child(this.item_selecto.id).once('value');
                yaFueContabilizado = snapshot.exists();
                console.log(`Verificando si pedido ${this.item_selecto.id} ya fue contabilizado:`, yaFueContabilizado);
            } catch (error) {
                console.error("Error al verificar contador:", error);
                yaFueContabilizado = false;
            }
            const promesas = [
                nuevo_detalle_entrega(this.item_selecto.id_grupo, this.item_selecto.id, data),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/estado_entrega`, estadoEntrega),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/observacion_entrega`, this.observaciones || ""),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/rechazos_count`, rechazos.length),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/pagos_entrega`, pagos_filtrados),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/total_cobrar`, totalCobrar),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/total_cobrado`, totalPagado),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/total_credito`, montoCred),
            ];

            if (fechaVenceUnix) {
                promesas.push(
                    grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/fecha_vence_credito`, fechaVenceUnix)
                );
            }

            if (montoCred > 0) {
                const cab = this.item_selecto || {};
                const pendiente = montoCred;

                const payloadCredito = {
                    monto_total: pendiente,
                    monto_pendiente: pendiente,
                    estado: "PENDIENTE",
                    documento: cab.dni || "",
                    moneda: cab.moneda || "S/",
                    nombre: cab.cliente || "",
                    vendedor: cab.vendedor || "",
                    doc_ref: cab.numeracion || "",
                    fecha: cab.fecha,
                    fecha_vence: fechaVenceUnix,
                    datos: [
                        {
                            id: 1,
                            fecha_vence: fechaVenceUnix,
                            monto: pendiente,
                            estado: "PENDIENTE",
                        },
                    ],
                };

                const id = payloadCredito.doc_ref || `${payloadCredito.documento || "SIN_DOC"}_${cab.id || Date.now()}`;
                promesas.push(nuevaCuentaxcobrar(id, payloadCredito));
            }

            if (!yaFueContabilizado) {
                console.log('Primera vez que se procesa. Incrementando contador...');

                promesas.push(incrementa_procesados_reparto(this.item_selecto.id_grupo));
                promesas.push(marcaPedidoComoContabilizado(this.item_selecto.id_grupo, this.item_selecto.id));

            } else {
                console.log('Pedido ya fue contabilizado previamente, no se incrementa.');
            }

            try {
                this.$store.commit("dialogoprogress");
                await Promise.all(promesas);
                this.$store.commit("dialogoprogress");

                if (montoCred > 0) {
                    this.$toast?.success?.("Entrega cobrada y crédito generado.") || alert("Entrega cobrada y crédito generado.");
                } else {
                    this.$toast?.success?.("Entrega cobrada correctamente.") || alert("Entrega cobrada correctamente.");
                }

                this.dialPagos = false;
                this.$emit("guardado", { grupo: this.item_selecto.id_grupo });

            } catch (e) {
                console.error("Error al finalizar entrega:", e);
                this.$store.commit("dialogoprogress");
                this.$toast?.error?.("No se pudo guardar la entrega.") || alert("No se pudo guardar la entrega.");
            }
        },

        busca_ico(data) {
            var iconos = this.$store.state.iconos_pagos.find(item => item.nombre == data)
            return iconos.icono
        },
        getMetodoSaldo() {
            let efectivo = this.pagosEntrega.find(x => String(x.nombre).toUpperCase() === 'YAPE');
            if (!efectivo && this.pagosEntrega.length > 0) {
                efectivo = this.pagosEntrega[0];
            }
            return efectivo || null;
        },

        sumaSin(nombre) {
            return this.pagosEntrega
                .filter(p => p.nombre !== nombre)
                .reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        },

        cambia_modo_pago(val) {
            const total = Number(this.totalACobrar.toFixed(2));
            this.pagosEntrega.forEach(p => { p.monto = ''; });
            const sel = this.pagosEntrega.find(p => p.nombre === val.nombre);
            if (sel) sel.monto = total > 0 ? total.toFixed(2) : '';

            const saldo = this.getMetodoSaldo();
            if (saldo && saldo.nombre !== val.nombre) {
                saldo.monto = '0';
            }
        },

        onMontoInput(editado) {
            const saldo = this.getMetodoSaldo();
            if (!saldo || editado?.nombre === saldo.nombre) return;

            const total = Number(this.totalACobrar.toFixed(2));
            const otros = this.sumaSin(saldo.nombre);
            let restante = Number((total - otros - this.montoCreditoNumber).toFixed(2));

            if (restante < 0) restante = 0;
            saldo.monto = restante ? restante.toFixed(2) : '0';
        },

        setFechaVencePorDefecto() {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            this.fechaVenceCredito = d.toISOString().slice(0, 10);
        },

        toggleCredito() {
            if (!this.mostrarCredito) {
                const faltante = this.totalACobrar - this.sumaPagos;
                this.montoCredito = Number(faltante > 0 ? faltante : 0).toFixed(2);
                this.setFechaVencePorDefecto();
                this.onCreditoInput();
            }
            this.mostrarCredito = !this.mostrarCredito;
        },
        verDetallePedido() {
            const detalleItems = this.array_detalle.map(item => {
                const cantidad = Number(item.cantidad || 0);
                const precio = Number(item.precio || 0);
                const esGratuita = String(item.operacion || '').toUpperCase() === 'GRATUITA';
                const total = esGratuita ? 0 : cantidad * precio;
                const codigo = item.cod_interno || item.id || "";
                return {
                    codigo: codigo,
                    nombre: item.nombre || "",
                    cantidad: cantidad,
                    medida: item.medida || "",
                    precio_unit: precio,
                    total: total,
                    operacion: item.operacion || ""
                };
            });
            this.detallePedidoItems = detalleItems;
            this.detallePedidoTotal = this.redondear(this.item_selecto.total);
            this.dialogoDetalle = true;
        }
    },
};
</script>

<style scoped>
.mpago-field .v-input__slot {
    padding-left: 6px;
}

/* respira mejor */
.mpago-activo .v-input__slot {
    border-color: #2e7d32 !important;
}

/* destaca método con monto */
</style>