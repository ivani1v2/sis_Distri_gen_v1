<template>
    <div class="pa-4">
        <v-card outlined class="pa-4 mb-4">
            <v-row justify="space-between" align="center">
                <v-col cols="6" sm="6">
                    <h2 class="text-h6">📦 Control de Movimientos</h2>
                </v-col>
                <v-col cols="6" sm="6" class="text-right">
                    <v-btn small color="primary" @click="mostrarDialogo = !mostrarDialogo">
                        <v-icon left>mdi-plus</v-icon>Nuevo
                    </v-btn>
                </v-col>
                <v-col cols="6" sm="6" class="text-right">
                    <v-btn v-if="false" color="secondary" @click="verResumen = !verResumen">
                        <v-icon left>mdi-chart-bar</v-icon>Ver Resumen
                    </v-btn>
                </v-col>
            </v-row>
            <v-row dense class="mb-n6">
                <v-col cols="6" sm="3">
                    <v-text-field v-model="date1" type="date" dense outlined label="Desde"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-text-field v-model="date2" type="date" dense outlined label="Hasta"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-select v-model="sede_destino" :items="sedesDestino" label="Sede Destino" item-text="nombre"
                        item-value="base" outlined dense :rules="[v => !!v || 'Seleccione sede destino']"></v-select>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-btn small block color="success" @click="cargarMovimientos">
                        <v-icon left>mdi-magnify</v-icon>Buscar
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>

        <v-card outlined>
            <v-data-table :headers="headers" :items="movimientos" dense class="elevation-1" mobile-breakpoint="1">
                <template v-slot:item.fecha="{ item }">
                    <span>
                        {{ formatoFecha(item.fecha_unix) }}
                        <v-chip v-if="item.estado === 'anulado'" color="red" text-color="white" x-small class="ml-2">
                            ANULADO
                        </v-chip>
                        <v-chip v-if="item.estado === 'editado'" color="warning" text-color="white" x-small
                            class="ml-2">
                            EDITADO
                        </v-chip>
                    </span>
                </template>
                <template v-slot:item.sede_origen="{ item }">
                    <v-chip color="blue lighten-4" text-color="blue darken-2" small>
                        {{ nombreSede(item.sede_origen) }}
                    </v-chip>
                </template>
                <template v-slot:item.sede_destino="{ item }">
                    <v-chip color="green lighten-4" text-color="green darken-2" small>
                        {{ nombreSede(item.sede_destino) }}
                    </v-chip>
                </template>
                <template v-slot:item.productos="{ item }">
                    {{ item.productos.length }} productos
                </template>
                <template v-slot:item.usuario="{ item }">
                    S/{{ item.total || '-' }}
                </template>
                <template v-slot:item.accion="{ item }">
                    <v-menu bottom left>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn icon v-bind="attrs" v-on="on">
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="verDetalle(item)">
                                <v-list-item-icon><v-icon color="blue">mdi-eye</v-icon></v-list-item-icon>
                                <v-list-item-content>Ver Detalle</v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="editarTransferencia(item)">
                                <v-list-item-icon><v-icon color="orange">mdi-pencil</v-icon></v-list-item-icon>
                                <v-list-item-content>Editar</v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="anularTransferencia(item)">
                                <v-list-item-icon><v-icon color="red">mdi-cancel</v-icon></v-list-item-icon>
                                <v-list-item-content>Anular</v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="imprimirTransferencia(item)">
                                <v-list-item-icon><v-icon color="green">mdi-printer</v-icon></v-list-item-icon>
                                <v-list-item-content>Imprimir</v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>

            </v-data-table>
        </v-card>

        <v-dialog v-model="mostrarDetalle" max-width="600px">
            <v-card>
                <v-card-title class="headline">Detalle de Movimiento</v-card-title>
                <v-card-subtitle class="mb-2">
                    Origen: <strong>{{ nombreSede(detalleActual.sede_origen) }}</strong> |
                    Destino: <strong>{{ nombreSede(detalleActual.sede_destino) }}</strong><br>
                    Usuario: <strong>{{ detalleActual.usuario || '-' }}</strong> <br>
                    Fecha: <strong>{{ formatoFecha(detalleActual.fecha_unix) }}</strong> <br>
                    Total: <strong>S/{{ detalleActual.total }}</strong> <br>
                    Observacion: <strong>{{ detalleActual.observacion }}</strong>
                </v-card-subtitle>
                <v-card-text>
                    <v-simple-table dense>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Cantidad</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, i) in detalleActual.productos" :key="i">
                                <td>{{ p.nombre }}</td>
                                <td>{{ p.codbarra || p.codigo || p.id }}</td>
                                <td>{{ p.cantidad }}</td>
                                <td>S/{{ p.monto_soles }}</td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text color="red" @click="mostrarDetalle = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dialogo_editar_transferencia v-if="dialogoEditar" :dialog.sync="dialogoEditar" :transferencia="detalleEditar"
            :nombreSede="nombreSede" @cerrar="dialogoEditar = false, cargarMovimientos" @guardado="cargarMovimientos" />
        <dial_mov v-if="mostrarDialogo" @cerrar="mostrarDialogo = false, cargarMovimientos" />
    </div>
</template>

<script>
import dial_mov from '@/views/kardex/dial_transferencia'
import { imprimirTransferenciaPDF80mm } from "@/views/kardex/formatos/form_transferencia"; // ajusta ruta según tu estructura
import dialogo_editar_transferencia from "./dialogos/dialogo_editar_transferencia.vue"
import { all_transferencia, allProductoOtraBase, grabarStockOtraBase, actualiza_transferencia } from '@/db'
import { anularMovimientosTransferencia } from '@/views/kardex/help_mov_tranferencia'
import moment from 'moment'
import store from '@/store'

export default {
    components: {
        dial_mov,
        dialogo_editar_transferencia
    },
    data() {
        return {
            verResumen: false,
            mostrarDialogo: false,
            date1: moment().format('YYYY-MM-DD'),
            date2: moment().format('YYYY-MM-DD'),
            movimientos: [],
            headers: [
                { text: 'Fecha', value: 'fecha' },
                { text: 'Origen', value: 'sede_origen' },
                { text: 'Destino', value: 'sede_destino' },
                { text: 'Productos', value: 'productos' },
                { text: 'Usuario', value: 'usuario' },
                { text: 'Acción', value: 'accion', sortable: false }
            ],
            mostrarDetalle: false,
            detalleActual: {
                sede_origen: '',
                sede_destino: '',
                usuario: '',
                fecha_unix: 0,
                productos: []
            },
            dialogoEditar: false,
            detalleEditar: {},
            sede_destino: 'TODAS',      // base seleccionada
            sedesDestino: []
        }
    },
    mounted() {
        this.prepararSedesDestino()
        this.cargarMovimientos()
    },
    methods: {
        prepararSedesDestino() {
            const sedes = (store.state.array_sedes || []).filter(s => s.tipo === 'sede')

            // opcional: agregar opción "Todas"
            this.sedesDestino = [
                { nombre: 'TODAS', base: '*' },
                ...sedes.map(s => ({
                    nombre: s.nombre,
                    base: s.base
                }))
            ]
        },
        verDetalle(movimiento) {
            this.detalleActual = movimiento
            this.mostrarDetalle = true
        },
        cargarMovimientos() {
            const inicio = moment(this.date1, 'YYYY-MM-DD').startOf('day').unix()
            const fin = moment(this.date2, 'YYYY-MM-DD').endOf('day').unix()
            all_transferencia()
                .orderByChild('fecha_unix')
                .startAt(inicio)
                .endAt(fin)
                .once('value', this.onDataChange)
        },
        onDataChange(snapshot) {
            const datos = []
            snapshot.forEach(item => {
                const obj = item.val()
                obj.key = item.key // aquí guardamos la key del nodo
                datos.push(obj)
            })
            // Ordenar descendente por fecha
            datos.sort((a, b) => b.fecha_unix - a.fecha_unix)
            let filtrados = datos

            if (this.sede_destino && this.sede_destino !== '*') {
                filtrados = datos.filter(mov => mov.sede_destino === this.sede_destino)
            }
            this.movimientos = filtrados
        },
        formatoFecha(timestamp) {
            return moment.unix(timestamp).format('DD/MM/YYYY')
        },
        nombreSede(base) {
            if (!base) return '-';
            // Puedes usar store.state o this.$store si usas namespaced modules
            const sedes = store.state.array_sedes.filter(e => e.tipo == 'sede') || [];
            const s = sedes.find(s => s.base == base);
            return s ? s.nombre : base;
        },
        editarTransferencia(item) {
            console.log(item)
            this.detalleEditar = item
            this.dialogoEditar = true
        },

        async anularTransferencia(item) {
            if (item.estado === 'anulado') {
                this.muestraMsg('Esta transferencia ya está anulada.', 'warning');
                return;
            }
            if (!confirm('¿Seguro que deseas anular esta transferencia? El stock será revertido.')) return;
            this.cargando = true;
            try {
                store.commit("dialogoprogress")
                // Cargar productos actuales de cada sede
                const snap_origen = await allProductoOtraBase(item.sede_origen).once('value');
                const origen_actual = snap_origen.val() ? Object.values(snap_origen.val()) : [];

                const snap_destino = await allProductoOtraBase(item.sede_destino).once('value');
                const destino_actual = snap_destino.val() ? Object.values(snap_destino.val()) : [];

                // Por cada producto, revertir stock
                for (const prod of item.productos) {
                    // En origen: sumamos la cantidad transferida
                    const prodOrigen = origen_actual.find(p => p.id == prod.id);
                    const stockOrigen = prodOrigen ? Number(prodOrigen.stock) : 0;
                    await grabarStockOtraBase(item.sede_origen, prod.id, stockOrigen + Number(prod.cantidad));

                    // En destino: restamos la cantidad transferida (no puede ser menor a 0)
                    const prodDestino = destino_actual.find(p => p.id == prod.id);
                    const stockDestino = prodDestino ? Number(prodDestino.stock) : 0;
                    const nuevoStockDestino = Math.max(0, stockDestino - Number(prod.cantidad));
                    await grabarStockOtraBase(item.sede_destino, prod.id, nuevoStockDestino);
                }

                // Actualizar estado a "anulado"
                // Cambia "actualiza_transferencia" según tu helper, y el nombre de la key (item.key)
                await actualiza_transferencia(item.key || item.id, { estado: 'anulado', anulado_por: store.state.permisos.correo, anulado_en: moment().unix() });
                await anularMovimientosTransferencia(item);
                store.commit("dialogoprogress")
                this.muestraMsg('Transferencia anulada y stocks revertidos.', 'success');
                // Si quieres cerrar dialog/actualizar tabla:
                if (typeof this.cargarMovimientos === "function") this.cargarMovimientos();
            } catch (e) {
                this.muestraMsg('Error al anular transferencia: ' + (e.message || e), 'error');
            }
            this.cargando = false;
        },
        imprimirTransferencia(item) {
            imprimirTransferenciaPDF80mm(
                item,
                this.nombreSede,         // función que convierte base => nombre
                this.formatoFecha        // función para formatear fecha unix
            );
        },
        // Si no tienes muestraMsg:
        muestraMsg(msg, color = 'info') {
            this.textoMensaje = msg;
            this.colorMensaje = color;
            this.mensaje = true;
        },
    }
}
</script>
