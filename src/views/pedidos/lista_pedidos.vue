<template>
    <div class="pa-3">
        <v-card class="mb-2 pa-2">
            <v-row dense>
                <v-btn v-if="false" @click="actualizarUbicacionesDesdePedidos"> ver ubicacion cliente </v-btn>
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Inicio" v-model="date1" @change="filtrar()" />
                </v-col>
                <v-col cols="6" md="3" sm="6">
                    <v-text-field outlined dense type="date" label="Fin" v-model="date2" @change="filtrar()" />
                </v-col>
                <v-col cols="4" md="2" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n4' : ''">
                    <v-select style="font-size:80%;" :disabled="!$store.state.permisos.es_admin" v-model="vendedor"
                        :items="vendedoresItems" item-text="nombre" item-value="codigo" label="Vendedor" outlined
                        dense />
                </v-col>
                <v-col cols="8" md="4" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n4' : ''">
                    <v-text-field style="font-size:80%;" outlined dense label="Buscar" v-model="busca" />
                </v-col>
                <v-col cols="4" class="mt-n4">
                    <v-menu bottom offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="success" block x-small v-bind="attrs" v-on="on">
                                Opciones
                                <v-spacer></v-spacer>
                                <v-icon left>
                                    mdi-arrow-down-bold
                                </v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click="filtrar()">
                                <v-list-item-title> <v-icon left>mdi-magnify</v-icon> Filtrar</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="verConsolidado">
                                <v-list-item-title>
                                    <v-icon left>mdi-clipboard-text</v-icon> Rep. consolidado
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="rep_avance">
                                <v-list-item-title>
                                    <v-icon left>mdi-clipboard-text</v-icon> Rep. Avance Ventas
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="dial_anular = !dial_anular">
                                <v-list-item-title>
                                    <v-icon left>mdi-clipboard-text</v-icon> Anular Pedido
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
                <v-col cols="4" class="mt-n4">
                    <div class="body-2">
                        <strong class="red--text"># Pedidos:</strong> {{ resumen.totalPedidos }}
                    </div>
                </v-col>

                <v-col cols="4" class="mt-n4">
                    <div class="body-2">
                        <strong class="red--text">Total:</strong> S/. {{ number2(resumen.totalSoles) }}
                    </div>
                </v-col>
            </v-row>


        </v-card>

        <v-card>
            <v-simple-table dense fixed-header height="65vh">
                <thead>
                    <tr>
                        <th>Vend.</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in pedidosFiltrados" :key="pedido.id">
                        <td style="font-size:75%;">{{ pedido.cod_vendedor }}</td>
                        <td style="font-size:75%;">{{ pedido.doc_numero }} - {{ pedido.cliente_nombre }}</td>
                        <td style="font-size:75%;">{{ pedido.fecha }}</td>
                        <td>
                            <v-chip x-small :color="chipColor(pedido.estado)" dark>
                            </v-chip>
                        </td>
                        <td style="font-size:75%;">S/.{{ number2(pedido.total) }}</td>

                        <td>
                            <v-row dense>
                                <v-col cols='6'>
                                    <v-btn icon small @click="verDetalle(pedido)">
                                        <v-icon color="blue">mdi-eye</v-icon>
                                    </v-btn>
                                </v-col>
                                <v-col cols='6'>
                                    <v-menu>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn icon v-bind="attrs" v-on="on">
                                                <v-icon>mdi-dots-vertical</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list dense>
                                            <v-list-item @click='pedidoSeleccionado = pedido, imprimir(pedido)'>
                                                <v-list-item-icon>
                                                    <v-icon color="success"> mdi-printer</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Imprimir</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click='editar(pedido)' v-if="pedido.estado != 'anulado'">
                                                <v-list-item-icon>
                                                    <v-icon color="success"> mdi-pencil</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Editar</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click='anular(pedido)' v-if="pedido.estado != 'anulado'">
                                                <v-list-item-icon>
                                                    <v-icon color="error"> mdi-delete</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>Anulado</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </v-col>
                            </v-row>



                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>

        <v-dialog v-model="dialogo_imprime" max-width="490px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogo_imprime = !dialogo_imprime">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprimir('A4')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF A4</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprimir('80')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 80mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="4" sm="12">
                        <v-card @click.prevent="imprimir('58')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/pdf.png"></v-img>
                                <h5 block class="text-center pa-1">PDF 58mm</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <dial_rep_avance v-if="dial_avance" :data="result" @cerrar="dial_avance = false" />
        <edita_ped ref="editorDetalle" v-model="showEditorDetalle" :cabecera="editorCabecera" :detalle="editorDetalle"
            :editable-precio="false" @cancelar="showEditorDetalle = false" />
        <dial_detalle_ped v-if="dialogDetalle" @cierra="dialogDetalle = false"
            :pedidoSeleccionado="pedidoSeleccionado" />
        <dial_consolidado v-if="dialogConsolidado" :selected-ids="selectedIds"
            :consolidado-seleccionados="consolidadoSeleccionados" @cierra="dialogConsolidado = false"
            :pedidos="pedidosFiltrados" />
        <anular_p v-if="dial_anular" @cerrar="dial_anular = false" />

    </div>
</template>

<script>
import moment from "moment";
import { all_pedidos, detalle_pedido } from "../../db";
import { crearOActualizarCliente as nuevoCliente, borrarCliente as eliminaCliente } from '../../db_firestore'

import edita_ped from './dialogos/edita_pedido.vue'
import dial_detalle_ped from './dialogos/dialogo_detalle_ped.vue'
import dial_consolidado from "./dialogos/dialogo_rep_consolidado.vue"
import dial_rep_avance from "./reportes/reporte_avance.vue"
import store from '@/store/index'
import { pdfGenera } from './formatos/orden_pedido.js'
import anular_p from './anular_pedido.vue'
import axios from "axios";
export default {
    components: {
        dial_rep_avance,
        edita_ped,
        dial_detalle_ped,
        dial_consolidado,
        anular_p
    },
    data() {
        return {
            // estado
            dial_anular: false,
            result: [],
            showEditorDetalle: false,
            vendedor: 'TODOS',
            allPedidosRaw: [],
            dialogDetalle: false,
            pedidoSeleccionado: {},
            detalleSeleccionado: [],
            dialogConsolidadoProd: false,
            consolidadoProductos: [],
            // fechas
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            // datos
            pedidosArray: [],
            // refs
            refOrden: null,
            editorCabecera: {},
            editorDetalle: [],
            consolidadoSeleccionados: [],
            selectedIds: [],
            dialogConsolidado: false,
            dial_avance: false,
            busca: '',
            dialogo_imprime: false,
        };
    },
    created() {
        this.filtrar(); // carga inicial (hoy)
        if (!store.state.permisos.es_admin) {
            this.vendedor = store.state.sedeActual.codigo
        }

    },
    beforeDestroy() {
        this._detach();
    },
    computed: {
        // Agrega "TODOS" al inicio de la lista de sedes/vendedores
        pedidosFiltrados() {
            const q = (this.busca || '').trim();
            if (!q) return this.pedidosArray;

            const normQ = this._norm(q);

            // Si el término parece numérico, también probamos contra el total
            const qNum = Number(q.replace(',', '.'));
            const esNum = Number.isFinite(qNum);

            return (this.pedidosArray || []).filter(p => {
                const doc = this._norm(p.doc_numero || '');
                const cli = this._norm(p.cliente_nombre || '');
                const tot = Number(p.total || 0);
                const totStr = this._norm(this.number2(tot)); // "123.45"

                const coincideTexto = doc.includes(normQ) || cli.includes(normQ);
                if (coincideTexto) return true;

                if (esNum) {
                    // Coincide si: total ~ qNum (tolerancia de 1 centavo) o si el string del total contiene el patrón
                    if (Math.abs(tot - qNum) <= 0.01) return true;
                }
                return totStr.includes(normQ);
            });
        },


        resumen() {
            // solo pedidos NO anulados
            const arr = (Array.isArray(this.pedidosArray) ? this.pedidosArray : [])
                .filter(p => String(p.estado || '').toLowerCase() !== 'anulado')

            const totalSoles = arr.reduce((acc, p) => acc + Number(p.total || 0), 0)

            // si tus pedidos NO traen # ítems, se mostrará null (así evitas sumar NaN)
            const totalItems = arr.reduce((acc, p) => {
                const n = Number(p.items ?? p.cant_items ?? null)
                return Number.isFinite(n) ? acc + n : acc
            }, 0)
            const hayItems = arr.some(p => (p.items != null) || (p.cant_items != null))

            return {
                totalSoles,
                totalItems: hayItems ? totalItems : null,
                totalPedidos: arr.length,
            }
        },

        vendedoresItems() {
            const base = Array.isArray(this.$store.state.array_sedes)
                ? this.$store.state.array_sedes
                : [];
            const tieneTodos = base.some(it => (it.codigo || '').toString().toUpperCase() === 'TODOS');
            return tieneTodos ? base : [{ nombre: 'TODOS', codigo: 'TODOS' }, ...base];
        }
    },
    watch: {
        vendedor() { this.applyVendorFilter(); },
        date1() { this.filtrar(); },
        date2() { this.filtrar(); }
    },

    methods: {
        async actualizarUbicacionesDesdePedidos() {
            const arr = this.pedidosFiltrados || [];
            if (!arr.length) {
                console.warn('No hay pedidos filtrados');
                return;
            }

            for (const p of arr) {
                const idCliente = p.doc_numero || p.id;
                if (!idCliente) continue;

                const lat = p.ubicacion_cliente?.lat ?? p.ubicacion_pedido?.lat ?? null;
                const lng = p.ubicacion_cliente?.lng ?? p.ubicacion_pedido?.lng ?? null;

                if (lat && lng) {
                    console.log(
                        `Actualizando cliente ${idCliente} con lat:${lat}, lng:${lng}`
                    );
                    await nuevoCliente(idCliente, {
                        latitud: String(lat),
                        longitud: String(lng),
                        editado: Date.now()
                    });

                    console.log(
                        `Cliente ${idCliente} actualizado -> lat:${lat}, lng:${lng}`
                    );
                }
            }

            alert("Ubicaciones actualizadas correctamente");
        },

        _norm(s) {
            return String(s)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // quita acentos
                .trim();
        },
        async rep_avance() {
            try {
                store.commit("dialogoprogress")
                const pedidos = Array.isArray(this.pedidosArray) ? this.pedidosArray.slice() : [];
                if (pedidos.length === 0) return [];

                // Trae en paralelo el detalle de cada pedido
                const resultados = await Promise.all(
                    pedidos.map(async (cab) => {
                        const snap = await detalle_pedido(cab.id).once("value");
                        return {
                            cabecera: cab,
                            detalle: snap.exists() ? snap.val() : null,
                        };
                    })
                );
                this.result = resultados
                store.commit("dialogoprogress")
                this.dial_avance = true

            } catch (err) {
                console.error("rep_avance error:", err);
            }
        },

        async verConsolidado() {
            const pedidos = (this.pedidosArray || [])
                .filter(p => String(p.estado || '').toLowerCase() !== 'anulado')
                .slice();

            if (!pedidos.length) {
                this.$toast && this.$toast.info
                    ? this.$toast.info("No hay pedidos en el rango seleccionado.")
                    : alert("No hay pedidos en el rango seleccionado.");
                return;
            }

            // guarda solo los IDs para el <dial_consolidado>
            this.selectedIds = pedidos.map(p => p.id);

            const acumulado = [];

            try {
                // spinner global (si tu store lo usa como toggle)
                store.commit && store.commit("dialogoprogress");

                await Promise.all(
                    pedidos.map(async (p) => {
                        const snap = await detalle_pedido(p.id).once("value");
                        const val = snap.val() || [];
                        const items = Array.isArray(val) ? val : Object.values(val);

                        items.forEach(d => {
                            const cantidad = Number(d.cantidad || 0);
                            const precio = Number(d.precio || 0).toFixed(2);
                            const total = Number(d.totalLinea).toFixed(2);
                            console.log("Detalle pedido:", d.totalLinea);
                            acumulado.push({
                                pedidoId: p.id,
                                fecha: this.formatFecha(p.fecha_emision),
                                vendedor: p.cod_vendedor || '',
                                cliente: `${p.doc_numero || ''} - ${p.cliente_nombre || ''}`.trim(),
                                codigo: d.codigo || d.id || '',
                                nombre: d.nombre,
                                medida: d.medida,
                                operacion: d.operacion,
                                cantidad,
                                precio,
                                total_linea: total,
                            });
                        });
                    })
                );

                // ordena por pedido y luego por producto
                acumulado.sort((a, b) => {
                    if (a.pedidoId === b.pedidoId) return String(a.nombre).localeCompare(String(b.nombre));
                    return String(a.pedidoId).localeCompare(String(b.pedidoId));
                });
                console.log("Consolidado generado:", acumulado);
                this.consolidadoSeleccionados = acumulado;
                this.dialogConsolidado = true;
            } catch (e) {
                console.error(e);
                this.$toast?.error
                    ? this.$toast.error("No se pudo generar el consolidado.")
                    : alert("No se pudo generar el consolidado.");
            } finally {
                store.commit && store.commit("dialogoprogress");
            }
        },
        async editar(pedido) {
            var snap = await detalle_pedido(pedido.id).once('value')
            const val = snap.val() || [];
            const items = Array.isArray(val) ? val : Object.values(val);
            this.editorCabecera = pedido;
            this.editorDetalle = items;
            this.showEditorDetalle = true
        },
        async anular(pedido) {
            try {
                if (!confirm('Seguro de anular el pedido? Se devolverá el stock.')) {
                    return;
                }
                store.commit("dialogoprogress")
                // 1) Trae el detalle
                const snap = await detalle_pedido(pedido.id).once('value');
                const val = snap.val() || [];
                const detalle = Array.isArray(val) ? val : Object.values(val);

                // 2) Arma payload
                const payload = {
                    cabecera: { ...pedido },   // viene con id, estado actual, etc.
                    detalle,                   // necesario para devolver stock
                    control_stock: true
                };

                // 3) Llama a tu endpoint con metodo "anular_pedido"
                //    Usa tu helper de axios según tu arquitectura
                //    Ejemplo genérico:
                //'https://api-distribucion-6sfc6tum4a-rj.a.run.app'
                //   'http://localhost:5000/sis-distribucion/southamerica-east1/api_distribucion'
                var idem = `anula-${pedido.id}`; // clave única para evitar duplicados
                await axios.post('https://api-distribucion-6sfc6tum4a-rj.a.run.app', {

                    bd: this.$store.state.baseDatos.bd,
                    data: payload,
                    metodo: "anular_pedido"
                },
                    {
                        headers: { 'X-Idempotency-Key': idem }
                    }

                );

                this.$toast?.success?.("Pedido anulado y stock revertido") || alert("Anulado OK");
                store.commit("dialogoprogress")
                this.filtrar()
            } catch (e) {
                console.error(e);
                this.$toast?.error?.("No se pudo anular el pedido") || alert("Error al anular");
            }
        },
        chipColor(estado) {
            const s = (estado || '').toString().toLowerCase();
            if (s === 'anulado') return 'red';
            if (s === 'procesado' || s === 'atendido') return 'blue';
            return 'orange'; // pendiente y otros
        },
        // --- helpers --- //
        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },
        _detach() {
            if (this.refOrden) {
                this.refOrden.off();
                this.refOrden = null;
            }
        },


        // --- filtros / data --- //
        filtrar() {

            // normaliza rango
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            if (!d1.isValid() || !d2.isValid()) {
                // 🔴 ocultar progreso si las fechas no son válidas

                return;
            }

            // si vienen invertidas, intercambia
            if (d1.isAfter(d2)) [d1, d2] = [d2, d1];

            const start = d1.startOf("day").unix();      // segundos UNIX
            const end = d2.endOf("day").unix();

            // limpia listener anterior y suscribe nuevo
            this._detach();
            this.refOrden = all_pedidos()
                .orderByChild("fecha_emision")
                .startAt(start)
                .endAt(end);

            this.refOrden.on(
                "value",
                (snap) => this.onDataChange(snap),
                (err) => { console.error(err) }
            );

        },


        onDataChange(snap) {
            const array = [];
            snap.forEach((item) => {
                const data = item.val() || {};
                const key = item.key;
                data.id = key;

                data.fecha = this.formatFecha(data.fecha_emision);
                array.push(data);
            });
            console.log(array)
            this.allPedidosRaw = array;
            this.applyVendorFilter();

        },
        applyVendorFilter() {
            const v = (this.vendedor || 'TODOS').toString().toUpperCase().trim();

            if (v === 'TODOS') {
                // Todos los pedidos del rango
                this.pedidosArray = this.sortPedidos(this.allPedidosRaw);
                return;
            }

            // Filtra por cod_vendedor (ajusta el campo si es necesario)
            this.pedidosArray = this.sortPedidos(
                this.allPedidosRaw.filter(p =>
                    (p.cod_vendedor != null ? String(p.cod_vendedor) : '')
                        .toUpperCase().trim() === v
                )
            );
        },
        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },
        // --- acciones UI --- //
        async verDetalle(pedido) {
            console.log(pedido)
            this.pedidoSeleccionado = pedido;
            this.dialogDetalle = true
        },
        sortPedidos(arr) {
            return (arr || []).slice().sort((a, b) => (b.fecha_emision || 0) - (a.fecha_emision || 0));
        },
        async imprimir(tama) {
            var pedido = this.pedidoSeleccionado
            store.commit("dialogoprogress")
            console.log("Imprimir", pedido)
            var snap = await detalle_pedido(pedido.id).once('value')
            const val = snap.val() || [];
            const items = Array.isArray(val) ? val : Object.values(val);
            store.commit("dialogoprogress")
            // pdfGenera(pedido, items, tama);
            pdfGenera(pedido, items, store.state.configImpresora.tamano);
        }
    },
};
</script>
