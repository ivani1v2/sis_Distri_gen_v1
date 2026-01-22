<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" fullscreen>
        <div>
            <v-system-bar dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3>Genera Reparto</h3>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="mb-2 pa-4 pa-md-6 mt-2" :class="{ 'pb-16': isMobile }">
            <v-row dense align="center">
                <v-col cols="6" md="3">
                    <v-text-field outlined dense type="date" label="Inicio" v-model="date1" @change="filtrar"
                        hide-details />
                </v-col>
                <v-col cols="6" md="3">
                    <v-text-field outlined dense type="date" label="Fin" v-model="date2" @change="filtrar"
                        hide-details />
                </v-col>

                <v-col cols="6" md="3" v-if="!isMobile">
                    <v-select outlined dense label="Vendedor" v-model="vendedoresSeleccionados"
                        :items="vendedoresItemsConTodos" item-text="nombre" item-value="codigo" multiple small-chips
                        deletable-chips hide-details :menu-props="{ maxHeight: '300', offsetY: true }"
                        @change="filtrar"></v-select>
                </v-col>

                <v-col cols="6" v-if="isMobile">
                    <v-btn color="info" block small @click="dialFiltroMovil = true">
                        <v-icon left small>mdi-filter</v-icon>
                        Vendedor
                        <v-chip v-if="vendedoresSeleccionados.length > 0 && !vendedoresSeleccionados.includes('todos')"
                            x-small class="ml-1" color="white" text-color="info">
                            {{ vendedoresSeleccionados.length }}
                        </v-chip>
                    </v-btn>
                </v-col>

                <v-col cols="6" md="3" class="d-flex align-center">
                    <v-menu bottom offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="success" block small v-bind="attrs" v-on="on">
                                Opciones
                                <v-spacer></v-spacer>
                                <v-icon left>mdi-arrow-down-bold</v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click="crear">
                                <v-list-item-title>
                                    <v-icon left>mdi-cash</v-icon> Crear Reparto Nuevo
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="agregar_a_reparto_existente">
                                <v-list-item-title>
                                    <v-icon left>mdi-cash</v-icon> Agregar a Reparto Existente
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="verConsolidado">
                                <v-list-item-title>
                                    <v-icon left>mdi-clipboard-text</v-icon> Ver consolidado
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>

            <v-bottom-sheet v-model="dialFiltroMovil" inset>
                <v-card class="pa-3">
                    <div class="d-flex align-center mb-2">
                        <div class="text-subtitle-1 font-weight-bold">Filtrar por vendedor</div>
                        <v-spacer />
                        <v-btn icon @click="dialFiltroMovil = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </div>

                    <v-select v-model="vendedoresSeleccionados" :items="vendedoresItemsConTodos" item-text="nombre"
                        item-value="codigo" label="Vendedor" multiple chips small-chips deletable-chips clearable
                        :menu-props="{ maxHeight: '300' }" outlined dense></v-select>

                    <v-row dense class="mt-2">
                        <v-col cols="6">
                            <v-btn block outlined color="grey" @click="vendedoresSeleccionados = ['todos']">
                                Todos
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block color="primary" @click="aplicarFiltroMovil">
                                Aplicar
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card>
            </v-bottom-sheet>

            <div class="my-3">
                <small class="grey--text">
                    {{ selectedIds.length }} seleccionado(s) de {{ pedidosArray.length }} visibles
                </small>
            </div>

            <v-simple-table dense fixed-header height="60vh">
                <thead>
                    <tr>
                        <th style="width:36px">
                            <v-checkbox dense hide-details :input-value="allVisibleSelected"
                                :indeterminate="indeterminate" @change="onToggleMaster" />
                        </th>
                        <th>Vendedor</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Comprobante</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in pedidosArray" :key="pedido.id">
                        <td>
                            <v-checkbox dense hide-details v-model="selectedIds" :value="String(pedido.id)" />
                        </td>
                        <td style="font-size:75%;">{{ pedido.cod_vendedor }}</td>
                        <td style="font-size:75%;">{{ pedido.doc_numero }} - {{ pedido.cliente_nombre }}</td>
                        <td style="font-size:75%;">{{ pedido.fecha }}</td>
                        <td>
                            <v-chip x-small :color="chipColor(pedido.estado)" dark />
                        </td>
                        <td style="font-size:75%;"><Strong>{{ pedido.moneda }}</Strong> {{ number2(pedido.total) }}</td>
                        <td style="font-size:70%; min-width:90px;">
                            <v-chip-group v-model="pedido.tipo_comprobante" mandatory column
                                active-class="primary white--text" @change="cambiar_comprobante(pedido)">
                                <v-chip x-small value="T">Nota</v-chip>
                                <v-chip x-small value="B">Bole</v-chip>
                                <v-chip x-small value="F">Fact</v-chip>
                            </v-chip-group>
                        </td>
                        <td>
                            <v-btn icon small @click="verDetalle(pedido)">
                                <v-icon color="blue">mdi-eye</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>
        <v-dialog v-model="dialogDetalle" max-width="650">
            <v-card>
                <v-toolbar flat color="black" dark dense>
                    <v-toolbar-title>{{ pedidoSeleccionado ? pedidoSeleccionado.id : '' }}</v-toolbar-title>
                    <v-toolbar-title class="ml-12"> S/ {{ pedidoSeleccionado ? pedidoSeleccionado.total : ''
                    }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialogDetalle = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>
                <div v-if="pedidoSeleccionado" class="pa-2">
                    <h5>Cliente: <span>{{ pedidoSeleccionado.doc_numero }} - {{ pedidoSeleccionado.cliente_nombre
                    }}</span></h5>
                    <h5>Direcion: <span>{{ pedidoSeleccionado.cliente_direccion }}</span></h5>
                    <h5>Modo : {{ pedidoSeleccionado.condicion_pago }}</h5>
                    <h5>Comprobante : {{ pedidoSeleccionado.tipo_comprobante }}</h5>
                </div>

                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Medida</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="d in detalleSeleccionado" :key="`${d.id}-${d.nombre}`">
                            <td style="font-size:75%;">{{ d.nombre }} <strong class="red--text"
                                    v-if="d.operacion == 'GRATUITA'">{{ d.operacion }}</strong></td>
                            <td style="font-size:75%;">{{ d.cantidad }}</td>
                            <td style="font-size:75%;">{{ d.medida }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.precio) }}</td>
                            <td style="font-size:75%;">S/.{{ number2(d.totalLinea) }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogCrear" max-width="750">
            <v-card>
                <v-toolbar flat dark color="black" dense>
                    <v-btn icon @click="dialogCrear = false"><v-icon>mdi-close</v-icon></v-btn>
                    <v-toolbar-title>Crear Reparto</v-toolbar-title>
                    <v-spacer></v-spacer>
                </v-toolbar>

                <v-card-text class="pt-4">
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-text-field dense outlined type="date" label="Fecha de Traslado"
                                v-model="fechaTraslado" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field dense outlined type="date" label="Fecha de Emisión Comprobantes"
                                v-model="fechaEmision" />
                        </v-col>
                    </v-row>

                    <v-row class="mb-4" :class="isMobile ? 'flex-column' : ''">
                        <v-col v-for="(resumen, moneda) in resumenPorMoneda" :key="moneda" cols="12" :md="getCardCols"
                            :sm="getCardCols" class="d-flex">
                            <v-card outlined class="flex-grow-1 overflow-hidden" elevation="2" :style="{
                                borderRadius: '12px',
                                borderTop: `3px solid ${getBorderColor(moneda)}`
                            }">
                                <div class="pa-3 d-flex align-center" :class="getCardColor(moneda)">
                                    <v-avatar size="36" :color="getIconColor(moneda)" class="mr-2">
                                        <v-icon small dark>mdi-cash-fast</v-icon>
                                    </v-avatar>
                                    <div>
                                        <div class="subtitle-2 font-weight-bold">
                                            {{ resumen.nombre || moneda }}
                                        </div>
                                        <div class="caption grey--text text--darken-1">
                                            {{ resumen.pedidos }} pedido(s)
                                        </div>
                                    </div>
                                </div>
                                <div class="pa-3">
                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="caption grey--text">Contado</span>
                                        <span class="body-2 font-weight-medium success--text">
                                            {{ resumen.simbolo }} {{ number2(resumen.contado) }}
                                        </span>
                                    </div>

                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="caption grey--text">Crédito</span>
                                        <span class="body-2 font-weight-medium warning--text text--darken-2">
                                            {{ resumen.simbolo }} {{ number2(resumen.credito) }}
                                        </span>
                                    </div>

                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="caption grey--text">Peso</span>
                                        <span class="body-2 font-weight-medium grey--text text--darken-2">
                                            {{ number2(resumen.peso) }} KG
                                        </span>
                                    </div>

                                    <v-divider class="my-2"></v-divider>

                                    <div class="d-flex justify-space-between align-center">
                                        <span class="subtitle-2 font-weight-bold">TOTAL</span>
                                        <span class="subtitle-1 font-weight-bold"
                                            :style="{ color: getBorderColor(moneda) }">
                                            {{ resumen.simbolo }} {{ number2(resumen.total) }}
                                        </span>
                                    </div>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <div class="mt-2 font-weight-bold">T. GENERAL:
                        <span class="black--text">{{ totalPedidosSel }} pedidos</span>
                    </div>
                    <v-textarea dense outlined v-model="obs" auto-grow filled label="Observacion" rows="1"></v-textarea>
                </v-card-text>

                <v-card-actions class="px-4 pb-4">
                    <v-btn :color="ordenConfigurado ? 'success' : 'orange'" outlined @click="abrirOrdenLIFO">
                        <v-icon left>{{ ordenConfigurado ? 'mdi-check-circle' : 'mdi-sort-variant' }}</v-icon>
                        {{ ordenConfigurado ? 'Orden Configurado' : 'Orden de Carga' }}
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="success" large @click="confirmarCrearReparto">
                        <v-icon left>mdi-check-circle</v-icon> Crear
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="blocking" persistent max-width="320">
            <v-card class="pa-6 d-flex align-center justify-center" elevation="8">
                <div class="text-center">
                    <v-progress-circular indeterminate size="48" class="mb-3"></v-progress-circular>
                    <div class="subtitle-1 font-weight-medium">Procesando…</div>
                    <small class="grey--text">No cierres esta ventana</small>
                </div>
            </v-card>
        </v-dialog>

        <dial_consolidado v-if="dialogConsolidado" :selected-ids="selectedIds"
            :consolidado-seleccionados="consolidadoSeleccionados" @cierra="dialogConsolidado = false" />
        
        <dial_orden_lifo v-if="dialogOrdenLifo" :pedidos="pedidosParaOrdenar" @cerrar="dialogOrdenLifo = false" @confirmar="onConfirmarOrdenLifo" />
    </v-dialog>
</template>

<script>
import moment from "moment";
import { all_pedidos, detalle_pedido, modifica_pedidos } from "../../../db";
import dial_consolidado from "../../pedidos/dialogos/dialogo_rep_consolidado.vue";
import dial_orden_lifo from "./dial_orden_lifo.vue";
import store from '@/store/index'
import axios from "axios";
import CryptoJS from "crypto-js";

export default {
    components: {
        dial_consolidado,
        dial_orden_lifo
    },
    data() {
        return {
            dial: false,
            dialFiltroMovil: false,
            vendedoresSeleccionados: ['todos'],
            dialogDetalle: false,
            pedidoSeleccionado: null,
            detalleSeleccionado: [],
            dialogConsolidado: false,
            consolidadoSeleccionados: [],
            dialogOrdenLifo: false,
            pedidosParaOrdenar: [],
            pedidosOrdenados: [],
            ordenConfigurado: false,
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            pedidosArray: [],
            refOrden: null,
            selectedIds: [],
            dialogCrear: false,
            fechaTraslado: moment().format("YYYY-MM-DD"),
            fechaEmision: moment().format("YYYY-MM-DD"),
            blocking: false,
            opcionesComprobante: [
                { label: 'TICKET', value: 'T' },
                { label: 'BOLETA', value: 'B' },
                { label: 'FACTURA', value: 'F' },
            ],
            obs: '',
            cardColors: {
                'S/': {
                    bg: 'blue-grey lighten-5',
                    border: '#1976D2',
                    icon: 'blue darken-2'
                },
                'PEN': {
                    bg: 'blue-grey lighten-5',
                    border: '#1976D2',
                    icon: 'blue darken-2'
                },
                'USD': {
                    bg: 'green lighten-5',
                    border: '#388E3C',
                    icon: 'green darken-2'
                },
                '$': {
                    bg: 'green lighten-5',
                    border: '#388E3C',
                    icon: 'green darken-2'
                },
                'EUR': {
                    bg: 'amber lighten-5',
                    border: '#F57C00',
                    icon: 'orange darken-2'
                },
                '€': {
                    bg: 'amber lighten-5',
                    border: '#F57C00',
                    icon: 'orange darken-2'
                },
                'default': {
                    bg: 'grey lighten-4',
                    border: '#546E7A',
                    icon: 'blue-grey darken-1'
                }
            }
        };
    },
    computed: {
        isMobile() {
            return this.$vuetify?.breakpoint?.smAndDown || false;
        },
        vendedoresItemsConTodos() {
            const sedes = this.$store.state.array_sedes || [];
            const items = [{ codigo: 'todos', nombre: 'TODOS' }];
            const codigosVistos = new Set(['todos']);
            sedes.forEach(sede => {
                if (sede.codigo && !codigosVistos.has(sede.codigo)) {
                    items.push({
                        codigo: sede.codigo,
                        nombre: sede.nombre || sede.codigo
                    });
                    codigosVistos.add(sede.codigo);
                }
            });
            return items;
        },
        getCardCols() {
            const count = Object.keys(this.resumenPorMoneda).length;
            if (this.isMobile) return 12;
            if (count === 1) return 12;
            if (count === 2) return 6;
            if (count === 3) return 4;
            return 3;
        },
        resumenPorMoneda() {
            const resumen = {};
            const monedas = this.$store.state.moneda || [];

            this.seleccionados.forEach(p => {
                const monedaRaw = p.moneda || p.cod_moneda || 'S/';
                let monedaInfo = monedas.find(m => m.codigo === monedaRaw || m.simbolo === monedaRaw);
                if (!monedaInfo) monedaInfo = { simbolo: monedaRaw, moneda: monedaRaw, codigo: monedaRaw };
                const codMoneda = monedaInfo.codigo || monedaRaw;

                if (!resumen[codMoneda]) {
                    resumen[codMoneda] = {
                        simbolo: monedaInfo.simbolo,
                        nombre: monedaInfo.moneda,
                        contado: 0,
                        credito: 0,
                        peso: 0,
                        pedidos: 0,
                        total: 0
                    };
                }

                const condicion = String(p.condicion_pago || '').toUpperCase();
                const total = Number(p.total || 0);
                const peso = Number(p.peso_total || 0);

                if (condicion.includes('CONTADO')) {
                    resumen[codMoneda].contado += total;
                } else if (condicion.includes('CREDITO') || condicion.includes('CRÉDITO')) {
                    resumen[codMoneda].credito += total;
                }

                resumen[codMoneda].peso += peso;
                resumen[codMoneda].pedidos += 1;
                resumen[codMoneda].total += total;
            });

            return resumen;
        },
        visibleIds() {
            return this.pedidosArray.map(p => String(p.id));
        },
        allVisibleSelected() {
            return this.visibleIds.length > 0 &&
                this.visibleIds.every(id => this.selectedIds.includes(id));
        },
        indeterminate() {
            const count = this.selectedIds.filter(id => this.visibleIds.includes(id)).length;
            return count > 0 && count < this.visibleIds.length;
        },

        seleccionados() {
            const set = new Set(this.selectedIds.map(String));
            return this.pedidosArray.filter(p => set.has(String(p.id)));
        },
        totalPedidosSel() {
            return this.seleccionados.length;
        },
        totalContadoSel() {
            return this.seleccionados
                .filter(p => String(p.condicion_pago || '').toUpperCase().includes('CONTADO'))
                .reduce((a, b) => a + Number(b.total || 0), 0);
        },
        totalCreditoSel() {
            return this.seleccionados
                .filter(p => String(p.condicion_pago || '').toUpperCase().includes('CREDITO') || String(p.condicion_pago || '').toUpperCase().includes('CRÉDITO'))
                .reduce((a, b) => a + Number(b.total || 0), 0);
        },
        totalGeneralSel() {
            return this.seleccionados.reduce((a, b) => a + Number(b.total || 0), 0);
        },
        pesoTotalSel() {
            return this.seleccionados.reduce((a, b) => a + Number(b.peso_total || 0), 0);
        },
    },
    created() {
        this.dial = true
        this.filtrar();
    },
    beforeDestroy() {
        this._detach();
    },
    watch: {
        date1() { this.filtrar(); },
        date2() { this.filtrar(); },
    },
    methods: {
        aplicarFiltroMovil() {
            this.dialFiltroMovil = false;
            this.filtrar();
        },

        getCardColor(moneda) {
            return this.cardColors[moneda]?.bg || this.cardColors.default.bg;
        },

        getBorderColor(moneda) {
            return this.cardColors[moneda]?.border || this.cardColors.default.border;
        },

        getIconColor(moneda) {
            return this.cardColors[moneda]?.icon || this.cardColors.default.icon;
        },

        async cambiar_comprobante(pedido) {
            try {
                store.commit("dialogoprogress");

                if (!pedido || !pedido.id) {
                    console.warn("Pedido sin id, no puedo actualizar");
                    return;
                }

                const nuevoTipo = pedido.tipo_comprobante;
                await modifica_pedidos(
                    pedido.id + '/tipo_comprobante',
                    nuevoTipo
                );

                store.commit('dialogosnackbar', 'Comprobante actualizado');
            } catch (e) {
                console.error("Error actualizando comprobante:", e);
                alert("No se pudo actualizar el comprobante");
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async verConsolidado() {
            if (this.selectedIds.length === 0) {
                this.$toast && this.$toast.info
                    ? this.$toast.info("Selecciona al menos un documento.")
                    : alert("Selecciona al menos un documento.");
                return;
            }

            const byId = new Map(this.pedidosArray.map(p => [String(p.id), p]));
            const acumulado = [];

            try {
                store.commit && store.commit("dialogoprogress");

                await Promise.all(
                    this.selectedIds.map(async (id) => {
                        const p = byId.get(String(id)) || {};
                        const snap = await detalle_pedido(id).once("value");
                        const val = snap.val() || [];
                        const items = Array.isArray(val) ? val : Object.values(val);

                        items.forEach(d => {
                            acumulado.push({
                                pedidoId: id,
                                cliente: `${p.doc_numero || ''} - ${p.cliente_nombre || ''}`.trim(),
                                codigo: d.codigo || d.id || '',
                                nombre: d.nombre,
                                cantidad: d.cantidad,
                                medida: d.medida,
                                operacion: d.operacion,
                                precio: d.precio,
                                total_linea: d.totalLinea
                            });
                        });
                    })
                );

                acumulado.sort((a, b) => {
                    if (a.pedidoId === b.pedidoId) return String(a.nombre).localeCompare(String(b.nombre));
                    return String(a.pedidoId).localeCompare(String(b.pedidoId));
                });

                this.consolidadoSeleccionados = acumulado;
                this.dialogConsolidado = !this.dialogConsolidado;
            } finally {
                store.commit && store.commit("dialogoprogress");
            }
        },

        onToggleMaster(val) {
            if (val) {
                const set = new Set([...this.selectedIds, ...this.visibleIds]);
                this.selectedIds = Array.from(set);
            } else {
                const visible = new Set(this.visibleIds);
                this.selectedIds = this.selectedIds.filter(id => !visible.has(id));
            }
        },

        crear() {
            if (this.selectedIds.length === 0) {
                this.$toast && this.$toast.info
                    ? this.$toast.info("Selecciona al menos un documento.")
                    : alert("Selecciona al menos un documento.");
                return;
            }
            const set = new Set(this.selectedIds.map(String));
            this.pedidosParaOrdenar = this.pedidosArray.filter(p => set.has(String(p.id)));
            
            this.ordenConfigurado = false;
            this.pedidosOrdenados = [];
            
            this.fechaTraslado = this.date2;
            this.fechaEmision = this.date2;
            this.dialogCrear = true;
        },

        abrirOrdenLIFO() {
            this.dialogOrdenLifo = true;
        },

        onConfirmarOrdenLifo(pedidosOrdenados) {
            this.pedidosOrdenados = pedidosOrdenados;
            this.ordenConfigurado = true;
            this.dialogOrdenLifo = false;
            
            this.$toast && this.$toast.success
                ? this.$toast.success("Orden de carga configurado")
                : null;
        },

        async confirmarCrearReparto() {
            try {
                if (this.blocking) return;
                this.blocking = true;

                const unixTraslado = moment(String(this.fechaTraslado)).unix();
                const unixEmision = moment(String(this.fechaEmision)).unix();

                if (!unixTraslado || !unixEmision) {
                    this.$toast?.error
                        ? this.$toast.error("Fechas inválidas. Revisa traslado/emisión.")
                        : alert("Fechas inválidas. Revisa traslado/emisión.");
                    return;
                }

                const vendedorStr = this.vendedoresSeleccionados.includes('todos')
                    ? 'todos'
                    : this.vendedoresSeleccionados.join(',');

                const pedidosConOrden = this.pedidosOrdenados.length > 0
                    ? this.pedidosOrdenados.map(p => ({
                        id: p.id,
                        orden_lifo: p.orden_lifo
                    }))
                    : this.selectedIds.map((id, idx) => ({
                        id,
                        orden_lifo: idx + 1
                    }));

                const payload = {
                    fecha_traslado: unixTraslado,
                    fecha_emision: moment().unix(),
                    fecha_comprobantes: unixEmision,
                    vendedor: vendedorStr,
                    pedidos: pedidosConOrden.map(p => p.id),
                    pedidos_orden: pedidosConOrden,
                    obs: this.obs,
                    resumen: {
                        total_contado: this.totalContadoSel.toFixed(2),
                        total_credito: this.totalCreditoSel.toFixed(2),
                        peso_total: this.pesoTotalSel.toFixed(2),
                        total_pedidos: String(this.totalPedidosSel),
                        total_general: this.totalGeneralSel.toFixed(2),
                    },
                    resumen_monedas: this.resumenPorMoneda
                };

                var resp = await this.api_rest(payload, "crea_reparto");
                this.$router.push({
                    path: "/liquida_reparto/" + resp.data.data.grupo
                });
            } catch (e) {
                console.error(e);
                this.$toast?.error
                    ? this.$toast.error("Error creando el reparto.")
                    : alert("Error creando el reparto.");
            } finally {
                this.blocking = false;
            }
        },

        async api_rest(data, metodo) {
            var idem = this.buildIdemKeyPedido({
                bd: store.state.baseDatos.bd,
                payload: data,
            });
            var a = axios({
                method: 'POST',
                url: 'https://api-distribucion-6sfc6tum4a-rj.a.run.app',
                headers: {
                    'X-Idempotency-Key': idem,
                },
                data: {
                    "bd": store.state.baseDatos.bd,
                    "data": data,
                    "metodo": metodo
                }
            }).then(response => {
                return response
            })
            return a
        },

        buildIdemKeyPedido({ bd, payload = {} }) {
            const day = payload.fecha_emision
                ? moment.unix(Number(payload.fecha_emision)).format("YYYY-MM-DD")
                : moment().format("YYYY-MM-DD");

            const base = {
                day,
                ft: Number(payload.fecha_traslado || 0),
                fe: Number(payload.fecha_emision || 0),
                fc: Number(payload.fecha_comprobantes || 0),
                vend: String(payload.vendedor || ""),
                pedidos: (payload.pedidos || []).map(String).sort().join("|"),
                obs: String(payload.obs || ""),
                resumen: {
                    tc: String(payload?.resumen?.total_contado || ""),
                    tcr: String(payload?.resumen?.total_credito || ""),
                    p: String(payload?.resumen?.peso_total || ""),
                    tp: String(payload?.resumen?.total_pedidos || ""),
                    tg: String(payload?.resumen?.total_general || ""),
                }
            };

            const raw = JSON.stringify(base);
            const hash10 = CryptoJS.SHA256(raw).toString().substring(0, 10);

            return `${bd}-${hash10}`;
        },

        async agregar_a_reparto_existente() {
            try {
                if (this.blocking) return;

                if (this.selectedIds.length === 0) {
                    this.$toast && this.$toast.info
                        ? this.$toast.info("Selecciona al menos un documento.")
                        : alert("Selecciona al menos un documento.");
                    return;
                }

                const grupoInput = prompt(
                    "Ingresa el número de grupo de reparto al que deseas agregar (ej: 0005):"
                );

                if (!grupoInput) {
                    return;
                }

                const grupo = String(grupoInput).trim();
                if (!grupo) {
                    this.$toast && this.$toast.error
                        ? this.$toast.error("Grupo inválido.")
                        : alert("Grupo inválido.");
                    return;
                }

                this.blocking = true;

                const fechaEmiStr =
                    this.fechaEmision ||
                    this.date2 ||
                    moment().format("YYYY-MM-DD");

                const unixEmision = moment(String(fechaEmiStr)).unix();

                if (!unixEmision) {
                    this.$toast && this.$toast.error
                        ? this.$toast.error("Fecha de emisión inválida.")
                        : alert("Fecha de emisión inválida.");
                    return;
                }

                const payload = {
                    grupo,
                    fecha_comprobantes: unixEmision,
                    pedidos: this.selectedIds,
                    resumen: {
                        total_contado: this.totalContadoSel.toFixed(2),
                        total_credito: this.totalCreditoSel.toFixed(2),
                        peso_total: this.pesoTotalSel.toFixed(2),
                        total_pedidos: this.totalPedidosSel.toFixed(2),
                        total_general: this.totalGeneralSel.toFixed(2),
                    },
                };

                const resp = await this.api_rest(payload, "adiciona_reparto");
                const grupoResp = resp?.data?.data?.grupo || grupo;

                this.$router.push({
                    path: "/liquida_reparto/" + grupoResp,
                });
            } catch (e) {
                console.error("Error agregando a reparto existente:", e);
                this.$toast?.error
                    ? this.$toast.error("Error agregando a reparto existente.")
                    : alert("Error agregando a reparto existente.");
            } finally {
                this.blocking = false;
            }
        },

        chipColor(estado) {
            const s = (estado || '').toString().toLowerCase();
            if (s === 'anulado') return 'red';
            if (s === 'procesado' || s === 'atendido') return 'blue';
            return 'orange';
        },

        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },

        _detach() {
            if (this.refOrden) {
                this.refOrden.off("value", this.onDataChange);
                this.refOrden = null;
            }
        },

        filtrar() {
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            if (!d1.isValid() || !d2.isValid()) return;
            if (d1.isAfter(d2)) [d1, d2] = [d2, d1];

            const start = d1.startOf("day").unix();
            const end = d2.endOf("day").unix();

            this._detach();
            this.refOrden = all_pedidos()
                .orderByChild("fecha_emision")
                .startAt(start)
                .endAt(end);

            this.refOrden.on("value", this.onDataChange);
        },

        onDataChange(snap) {
            const arr = [];
            const vendedores = this.vendedoresSeleccionados || ['todos'];
            const filtrarPorVendedor = !vendedores.includes('todos') && vendedores.length > 0;

            snap.forEach(item => {
                const data = item.val() || {};
                if (data?.estado !== 'pendiente' || !(Number(data?.total) > 0)) return;
                data.id = item.key;
                data.fecha = this.formatFecha(data.fecha_emision);

                if (filtrarPorVendedor) {
                    const cod = (data.cod_vendedor || '').toString().toLowerCase();
                    const match = vendedores.some(v => v.toLowerCase() === cod);
                    if (!match) return;
                }
                arr.push(data);
            });
            this.pedidosArray = arr;

            const visible = new Set(arr.map(p => String(p.id)));
            this.selectedIds = this.selectedIds.filter(id => visible.has(id));
        },

        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },

        async verDetalle(pedido) {
            this.pedidoSeleccionado = pedido;
            store.commit("dialogoprogress");
            const snap = await detalle_pedido(pedido.id).once("value")
            const val = snap.val() || [];
            const items = Array.isArray(val) ? val : Object.values(val);
            this.detalleSeleccionado = items;
            this.dialogDetalle = true;
            store.commit("dialogoprogress");
        },

        cierra() {
            this.dial = false
            this.$emit('cierra')
        },
    },
};
</script>