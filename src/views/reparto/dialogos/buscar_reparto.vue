<template>
    <v-dialog v-model="dial_repartos" max-width="650">
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="dial_repartos = false">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-1">
            <v-card class="mb-2 pa-2">
                <v-row dense>
                    <v-col cols="6">
                        <v-text-field outlined dense type="date" label="Desde" v-model="date1" />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field outlined dense type="date" label="Hasta" v-model="date2" />
                    </v-col>
                    <v-col cols="12" class="text-center mt-n6">
                        <v-btn small color="success" class="" @click="filtrar">
                            filtrar
                            <v-icon>mdi-filter</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card>
            
            <v-card>
                <v-simple-table fixed-header height="65vh">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Fecha</th>
                            <th>Transporte</th>
                            <th>N°Pedidos</th>
                            <th>Entregados</th>
                            <th>Total S/.</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pedido in repartosFiltrados" :key="pedido.id" @click="selec_reparto(pedido)" style="cursor: pointer;">
                            <td style="font-size:75%;">{{ pedido.id }}</td>
                            <td style="font-size:75%;">{{ pedido.fecha }}</td>
                            <td style="font-size:75%;">
                                <v-chip v-if="pedido.d_transporte?.usuario_nombre" x-small color="info" dark>
                                    <v-icon x-small left>mdi-account</v-icon>
                                    {{ pedido.d_transporte.usuario_nombre }}
                                </v-chip>
                                <span v-else class="grey--text">-</span>
                            </td>
                            <td style="font-size:75%;">{{ Number(pedido.resumen?.total_pedidos || 0) }}</td>
                            <td style="font-size:75%;">{{ Number(pedido.resumen?.total_pedidos_procesados || 0) }}</td>
                            <td style="font-size:75%;">S/.{{ Number(pedido.resumen?.total_general || 0).toFixed(2) }}</td>
                            <td style="font-size:75%;">
                                <v-chip 
                                    x-small 
                                    :color="chipColorEstado(pedido)" 
                                    dark
                                >
                                    {{ textoEstado(pedido) }}
                                    <span v-if="porcentajeEntregados(pedido) > 0 && porcentajeEntregados(pedido) < 100">
                                        ({{ Math.round(porcentajeEntregados(pedido)) }}%)
                                    </span>
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card>
        </v-card>
    </v-dialog>
</template>

<script>
import { all_cabecera_reparto } from "../../../db";
import moment from "moment";
import store from '@/store/index'

export default {
    name: 'buscar_reparto',
    props: {
        item_selecto: null,
    },
    data() {
        return {
            dial_repartos: false,
            motivo_rechazo: '',
            date1: moment().format("YYYY-MM-DD"),
            date2: moment().format("YYYY-MM-DD"),
            todosRepartos: [],
            repartosFiltrados: [],
        };
    },
    computed: {
        esAdmin() {
            return store.state.permisos?.es_admin === true;
        },
        usuarioActual() {
            return store.state.permisos?.token || '';
        }
    },
    created() {
        this.dial_repartos = true;
        this.filtrar();
    },
    methods: {
        porcentajeEntregados(pedido) {
            const total = Number(pedido.resumen?.total_pedidos || 0);
            const entregados = Number(pedido.resumen?.total_pedidos_procesados || 0);
            if (total === 0) return 0;
            return (entregados / total) * 100;
        },
        textoEstado(pedido) {
            const porcentaje = this.porcentajeEntregados(pedido);
            if (porcentaje === 100) return 'ENTREGADO';
            return 'EN REPARTO';
        },
        chipColorEstado(pedido) {
            const porcentaje = this.porcentajeEntregados(pedido);
            if (porcentaje === 100) return 'success';
            return 'info';
        },
        async filtrar() {
            let d1 = moment(this.date1, "YYYY-MM-DD");
            let d2 = moment(this.date2, "YYYY-MM-DD");
            const start = d1.startOf("day").unix();
            const end = d2.endOf("day").unix();

            const snap = await all_cabecera_reparto()
                .orderByChild("fecha_traslado")
                .startAt(start)
                .endAt(end)
                .once("value");
            
            const array = [];
            snap.forEach((item) => {
                const data = item.val() || {};
                data.id = item.key;
                data.fecha = this.formatFecha(data.fecha_traslado, 'DD/MM');
                
                if (!this.esAdmin) {
                    const usuarioAsignado = data.d_transporte?.usuario_id || '';
                    if (usuarioAsignado && usuarioAsignado !== this.usuarioActual) {
                        return;
                    }
                }
                
                array.push(data);
            });
            
            this.todosRepartos = array.sort((a, b) => (b.fecha_traslado || 0) - (a.fecha_traslado || 0));
            
            this.repartosFiltrados = this.todosRepartos.filter(reparto => {
                const porcentaje = this.porcentajeEntregados(reparto);
                return porcentaje < 100;
            });
        },

        formatFecha(unix, formato = 'DD/MM HH:mm') {
            return moment.unix(unix).format(formato);
        },
        
        selec_reparto(item) {
            this.$emit('seleccionado', item);
            this.dial_repartos = false;
        },

        cerrar_dialogo() {
            this.$emit('cerrar');
        },
    },
};
</script>