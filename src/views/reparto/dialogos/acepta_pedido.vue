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
                    <v-col cols="6" class="text-center">
                        <v-btn x-small color="error" class="ma-2" @click="abrirDialogoRechazo">
                            <v-icon left>mdi-delete</v-icon>
                            Agregar rechazo
                        </v-btn>
                    </v-col>
                    <v-col cols="6" class="text-center">
                        <!-- AHORA abre diálogo de pagos -->
                        <v-btn x-small color="success" class="ma-2" @click="abrirPagos">
                            <v-icon left>mdi-check</v-icon>
                            Confirmar
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
                                                Precio: {{ moneda }} {{ redondear(unitPrice(it)) }}
                                            </span>
                                            <v-chip v-if="it.medida" x-small class="ml-1" label>{{ it.medida }}</v-chip>
                                            <v-chip v-if="it.operacion === 'GRATUITA'" x-small class="ml-1" color="pink"
                                                text-color="white" label>
                                                Gratuita
                                            </v-chip>
                                        </div>

                                        <div class="mt-1 text-subtitle-2 text-truncate" style="max-width:70vw;">
                                            <span class="font-weight-bold red--text">{{ Number(it.cantidad_rechazo ||
                                                it.cantidad) }}×</span>
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
                                    {{ item.nombre }}
                                    <span class="grey--text">· {{ Number(item.cantidad) }} {{ item.medida || ''
                                    }}</span>
                                </div>
                                <div class="text-right">
                                    {{ moneda }} {{ redondear((Number(item.total_antes_impuestos) +
                                        Number(item.total_impuestos))) }}
                                </div>
                            </div>
                        </template>
                    </v-autocomplete>

                    <div v-if="seleccionActual" class="mt-2">
                        <div class="caption grey--text mb-1">
                            Disponible: {{ Number(seleccionActual.cantidad) }} {{ seleccionActual.medida || '' }}
                        </div>
                        <v-text-field v-model.number="qtyRechazo" type="number" outlined dense hide-details :min="1"
                            :max="Number(seleccionActual.cantidad)" label="Cantidad a rechazar"
                            @focus="$event.target.select()" />
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
                <!-- MÉTODOS DE PAGO: fila compacta con icono incrustado -->
                <v-row dense v-for="p in pagosEntrega" :key="p.nombre" class="align-center">
                    <v-col cols="12">
                        <v-text-field :label="p.nombre.toUpperCase()" :prefix="moneda" :value="p.monto"
                            @input="val => { p.monto = val; onMontoInput(p) }"
                            :type="$store.state.esmovil ? 'tel' : 'number'" inputmode="decimal" step="0.01" outlined
                            dense hide-details class="mpago-field" :class="{ 'mpago-activo': parseFloat(p.monto) > 0 }"
                            @focus="$event.target.select()">
                            <!-- Icono del método como 'prepend-inner' (clic = llena con total) -->
                            <template v-slot:prepend-inner>
                                <v-avatar size="28" class="mr-2" tile>
                                    <v-img :src="busca_ico(p.nombre)" @click.stop="cambia_modo_pago(p)" />
                                </v-avatar>
                            </template>

                            <!-- Botón rápido para llenar con el total a cobrar -->
                            <template v-slot:append>
                                <v-btn icon x-small @click.stop="cambia_modo_pago(p)">
                                    <v-icon small>mdi-arrow-collapse-down</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-col>
                </v-row>


                <div class="mt-n2 mb-3 caption grey--text" v-if="diferenciaPagos !== 0">
                    Falta/Exceso: {{ moneda }} {{ redondear(diferenciaPagos) }}
                </div>

                <v-btn class="mt-4" block color="success" :disabled="!pagosValidos" @click="finalizarEntrega">
                    <v-icon left>mdi-cash-check</v-icon> Cobrar y finalizar
                </v-btn>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import { all_detalle_p, grabaCabecera_p, nuevo_detalle_entrega } from "../../../db";

export default {
    props: { item_selecto: { type: Object, required: true } },
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
            rechazados: [],
            // Pagos
            dialPagos: false,
            pagosEntrega: []
        };
    },
    async created() {
        await this.busca_detalle();
        // base de métodos de pago desde el store
        const lista = (this.$store?.state?.modopagos || []).map(n => ({ nombre: n, monto: "" }));
        this.pagosEntrega = lista;
        this.dial = true;
    },
    computed: {
        totalItemsPedido() { return (this.array_detalle || []).length; },
        itemsCalculados() { return this.rechazados; },
        totalRechazados() { return this.rechazados.length; },
        itemsElegibles() {
            const usados = new Set(this.rechazados.map(r => r.uuid || r.id));
            return (this.array_detalle || []).filter(x => !usados.has(x.uuid || x.id));
        },
        qtyValida() {
            if (!this.seleccionActual) return false;
            const q = Number(this.qtyRechazo || 0);
            return q >= 1 && q <= Number(this.seleccionActual.cantidad || 0);
        },
        // $$$
        totalRechazosMonto() {
            return this.rechazados.reduce((acc, it) => acc + this.totalLineaRechazo(it), 0);
        },
        totalACobrar() {
            const t = Number(this.item_selecto?.total || 0) - Number(this.totalRechazosMonto || 0);
            return t < 0 ? 0 : t;
        },
        sumaPagos() {
            return this.pagosEntrega.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        },
        diferenciaPagos() {
            // positivo => falta; negativo => exceso
            return Number(this.totalACobrar.toFixed(2)) - Number(this.sumaPagos.toFixed(2));
        },
        pagosValidos() {
            // exige que la suma coincida exactamente
            return Math.abs(this.diferenciaPagos) < 0.01;
        }
    },
    methods: {
        async busca_detalle() {
            const snap = await all_detalle_p(this.item_selecto.id_grupo, this.item_selecto.id).once("value");
            const raw = snap.val() || [];
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

        // === Rechazos ===
        abrirDialogoRechazo() {
            this.rechazoSeleccion = null;
            this.seleccionActual = null;
            this.qtyRechazo = 1;
            this.dialRechazo = true;
        },
        formatItemText(it) {
            if (!it) return "";
            const total = this.redondear((Number(it.total_antes_impuestos) + Number(it.total_impuestos)));
            return `${it.nombre} · ${Number(it.cantidad)} ${it.medida || ""} · ${this.moneda} ${total}`;
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
        },
        confirmAddRechazo() {
            if (!this.seleccionActual || !this.qtyValida) return;
            const it = { ...this.seleccionActual, cantidad_rechazo: Number(this.qtyRechazo) };
            this.rechazados.push(it);
            this.dialRechazo = false;
            this.rechazoSeleccion = null;
            this.seleccionActual = null;
            this.qtyRechazo = 1;
        },
        quitarRechazo(it) {
            const id = it.uuid || it.id;
            this.rechazados = this.rechazados.filter(r => (r.uuid || r.id) !== id);
        },

        // Cálculos monetarios
        unitPrice(it) {
            const p = Number(it.precio);
            if (Number.isFinite(p) && p > 0) return p;
            const tot = Number(it.total_antes_impuestos || it.totalLinea || 0);
            const cant = Number(it.cantidad) || 1;
            return cant ? (tot / cant) : 0;
        },
        totalLineaRechazo(it) {
            const q = Number(it.cantidad_rechazo || it.cantidad || 0);
            return this.unitPrice(it) * q;
        },

        abrirPagos() {
            const restante = Number(this.totalACobrar.toFixed(2));
            this.pagosEntrega = (this.$store?.state?.modopagos || []).map((n, idx) => ({
                nombre: n,
                monto: idx === 0 ? (restante > 0 ? restante.toFixed(2) : '') : ''
            }));
            this.dialPagos = true;
        },


        // Guarda todo (estado entrega + observaciones + rechazos + pagos)
        async finalizarEntrega() {
            if (!this.pagosValidos) return;

            const rechazos = this.rechazados.map(it => ({
                uuid: it.uuid || it.id,
                id_producto: it.id,
                nombre: it.nombre,
                cantidad: Number(it.cantidad_rechazo || 0),
                total_linea: Number(this.totalLineaRechazo(it) || 0),
                medida: it.medida || "",
                precio_unit: Number(this.unitPrice(it)) || 0,
                operacion: it.operacion || ""
            }));


            const pagos_filtrados = this.pagosEntrega
                .filter(p => parseFloat(p.monto) > 0)
                .map(p => ({ nombre: p.nombre, monto: Number(p.monto) }));
            var data = {
                id_grupo: this.item_selecto.id_grupo,
                id_pedido: this.item_selecto.id,
                rechazos: rechazos,
                rechazos_count: rechazos.length,
                pagos_entrega: pagos_filtrados,
                total_pedido: Number(this.item_selecto.total || 0),
                total_rechazado: Number(this.totalRechazosMonto.toFixed(2)),
                total_cobrado: Number(this.totalACobrar.toFixed(2)),
            }
            console.log("Finalizar entrega con datos:", data);
            this.$store.commit("dialogoprogress");
            await Promise.all([
                nuevo_detalle_entrega(this.item_selecto.id_grupo, this.item_selecto.id, data),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/estado_entrega`, "entregado"),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/observacion_entrega`, this.observaciones || ""),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/rechazos_count`, rechazos.length),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/pagos_entrega`, pagos_filtrados),
                grabaCabecera_p(this.item_selecto.id_grupo, `${this.item_selecto.id}/total_cobrado`, Number(this.totalACobrar.toFixed(2)))
            ]);

            this.$store.commit("dialogoprogress");
            this.dialPagos = false;
            this.$emit("guardado", { grupo: this.item_selecto.id_grupo });
        },
        busca_ico(data) {
            var iconos = this.$store.state.iconos_pagos.find(item => item.nombre == data)
            return iconos.icono
        },
        getMetodoSaldo() {
            let efectivo = this.pagosEntrega.find(x => String(x.nombre).toUpperCase() === 'EFECTIVO');
            if (!efectivo && this.pagosEntrega.length > 0) {
                efectivo = this.pagosEntrega[0];
            }
            return efectivo || null;
        },

        // Suma de métodos excepto uno (para calcular saldo)
        sumaSin(nombre) {
            return this.pagosEntrega
                .filter(p => p.nombre !== nombre)
                .reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        },

        // Click en icono del método: rellena ese método con TODO el total a cobrar y limpia los demás
        cambia_modo_pago(val) {
            const total = Number(this.totalACobrar.toFixed(2));
            // limpia todos
            this.pagosEntrega.forEach(p => { p.monto = ''; });
            // pone el total en el seleccionado
            const sel = this.pagosEntrega.find(p => p.nombre === val.nombre);
            if (sel) sel.monto = total > 0 ? total.toFixed(2) : '';

            // si el seleccionado NO es el de saldo (EFECTIVO o 1ro), no hace falta más;
            // si quieres que EFECTIVO quede en 0 explícito:
            const saldo = this.getMetodoSaldo();
            if (saldo && saldo.nombre !== val.nombre) {
                saldo.monto = '0';
            }
        },

        // Cuando el usuario escribe en un método, ajusta automáticamente EFECTIVO con el restante
        onMontoInput(editado) {
            // No autoajustes si el que edita es el método de saldo (EFECTIVO/primero)
            const saldo = this.getMetodoSaldo();
            if (!saldo || editado?.nombre === saldo.nombre) return;

            const total = Number(this.totalACobrar.toFixed(2));
            const otros = this.sumaSin(saldo.nombre); // todo menos el de saldo
            let restante = Number((total - otros).toFixed(2));
            if (restante < 0) restante = 0; // evita negativos
            saldo.monto = restante ? restante.toFixed(2) : (restante === 0 ? '0' : '');
        },
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