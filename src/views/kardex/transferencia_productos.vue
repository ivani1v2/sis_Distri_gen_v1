<template>
    <div class="pa-4">
        <v-card outlined class="pa-4 mb-4">
            <v-row justify="space-between" align="center">
                <v-col cols="6" sm="6">
                    <h2 class="text-h6">Control de Movimientos</h2>
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
                        item-value="base" outlined dense :disabled="!esAdmin"
                        :rules="[v => !!v || 'Seleccione sede destino']"></v-select>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-btn small block color="success" @click="cargarMovimientos">
                        <v-icon left>mdi-magnify</v-icon>Buscar
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>


        <v-card outlined>
            <v-data-table :headers="headers" :items="movimientos" dense class="elevation-1 d-none d-md-block" :items-per-page="10">
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
                    <v-chip small color="primary" text-color="white" @click="verDetalle(item)" style="cursor: pointer;">
                        <v-icon left x-small>mdi-package-variant</v-icon>
                        {{ item.productos.length }} productos
                    </v-chip>
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
                            <v-divider></v-divider>
                            <v-list-item @click="imprimirTransferencia(item)">
                                <v-list-item-icon><v-icon color="green">mdi-printer</v-icon></v-list-item-icon>
                                <v-list-item-content>Imprimir Ticket</v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="imprimirTransferenciaA4(item)">
                                <v-list-item-icon><v-icon color="blue">mdi-file-pdf-box</v-icon></v-list-item-icon>
                                <v-list-item-content>Imprimir A4</v-list-item-content>
                            </v-list-item>
                            <v-list-item @click="exportarTransferenciaExcel(item)">
                                <v-list-item-icon><v-icon color="success">mdi-microsoft-excel</v-icon></v-list-item-icon>
                                <v-list-item-content>Exportar Excel</v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table>
           
            <div class="d-md-none pa-2">
                <div v-if="movimientos.length === 0" class="text-center py-4 grey--text">
                    No hay movimientos para mostrar
                </div>
                <v-card v-for="(item, index) in movimientos" :key="'mov-'+index"
                    outlined class="mb-2" :class="{'red lighten-5': item.estado === 'anulado'}">
                    <v-card-text class="pa-3">
                        <div class="d-flex justify-space-between align-start">
                            <div class="flex-grow-1" @click="verDetalle(item)" style="cursor: pointer;">
                                <div class="d-flex align-center mb-2">
                                    <span class="font-weight-bold">{{ formatoFecha(item.fecha_unix) }}</span>
                                    <v-chip v-if="item.estado === 'anulado'" color="red" text-color="white" x-small class="ml-2">
                                        ANULADO
                                    </v-chip>
                                    <v-chip v-if="item.estado === 'editado'" color="warning" text-color="white" x-small class="ml-2">
                                        EDITADO
                                    </v-chip>
                                </div>
                                <div class="d-flex align-center flex-wrap mb-2">
                                    <v-chip x-small color="blue lighten-4" text-color="blue darken-2" class="mr-1">
                                        {{ nombreSede(item.sede_origen) }}
                                    </v-chip>
                                    <v-icon x-small>mdi-arrow-right</v-icon>
                                    <v-chip x-small color="green lighten-4" text-color="green darken-2" class="ml-1">
                                        {{ nombreSede(item.sede_destino) }}
                                    </v-chip>
                                </div>
                                <div class="d-flex align-center text-caption">
                                    <span class="mr-3">
                                        <v-icon x-small class="mr-1">mdi-package-variant</v-icon>
                                        {{ item.productos.length }} producto(s)
                                    </span>
                                    <span class="font-weight-bold primary--text">
                                        S/ {{ Number(item.total || 0).toFixed(2) }}
                                    </span>
                                </div>
                            </div>
                            <v-menu bottom left>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn icon small v-bind="attrs" v-on="on">
                                        <v-icon>mdi-dots-vertical</v-icon>
                                    </v-btn>
                                </template>
                                <v-list dense>
                                    <v-list-item @click="verDetalle(item)">
                                        <v-list-item-icon><v-icon small color="blue">mdi-eye</v-icon></v-list-item-icon>
                                        <v-list-item-content><v-list-item-title>Ver Detalle</v-list-item-title></v-list-item-content>
                                    </v-list-item>
                                    <v-list-item @click="editarTransferencia(item)">
                                        <v-list-item-icon><v-icon small color="orange">mdi-pencil</v-icon></v-list-item-icon>
                                        <v-list-item-content><v-list-item-title>Editar</v-list-item-title></v-list-item-content>
                                    </v-list-item>
                                    <v-list-item @click="anularTransferencia(item)">
                                        <v-list-item-icon><v-icon small color="red">mdi-cancel</v-icon></v-list-item-icon>
                                        <v-list-item-content><v-list-item-title>Anular</v-list-item-title></v-list-item-content>
                                    </v-list-item>
                                    <v-divider></v-divider>
                                    <v-list-item @click="imprimirTransferencia(item)">
                                        <v-list-item-icon><v-icon small color="green">mdi-printer</v-icon></v-list-item-icon>
                                        <v-list-item-content><v-list-item-title>Ticket</v-list-item-title></v-list-item-content>
                                    </v-list-item>
                                    <v-list-item @click="imprimirTransferenciaA4(item)">
                                        <v-list-item-icon><v-icon small color="blue">mdi-file-pdf-box</v-icon></v-list-item-icon>
                                        <v-list-item-content><v-list-item-title>PDF A4</v-list-item-title></v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
           
            <v-card-actions v-if="movimientos.length">
                <v-spacer></v-spacer>
                <v-btn small color="success" outlined @click="exportarListaExcel">
                    <v-icon left small>mdi-microsoft-excel</v-icon>
                    Exportar Lista Excel
                </v-btn>
            </v-card-actions>
        </v-card>


        <v-dialog v-model="mostrarDetalle" max-width="700px">
            <v-card>
                <v-card-title class="headline primary white--text">
                    <v-icon left color="white">mdi-truck-delivery</v-icon>
                    Detalle de Transferencia
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-row dense>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Origen</div>
                            <v-chip color="blue lighten-4" text-color="blue darken-2" small>
                                {{ nombreSede(detalleActual.sede_origen) }}
                            </v-chip>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Destino</div>
                            <v-chip color="green lighten-4" text-color="green darken-2" small>
                                {{ nombreSede(detalleActual.sede_destino) }}
                            </v-chip>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Fecha</div>
                            <div class="font-weight-medium">{{ formatoFecha(detalleActual.fecha_unix) }}</div>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Usuario</div>
                            <div class="font-weight-medium">{{ (detalleActual.usuario || '-').split('@')[0] }}</div>
                        </v-col>
                    </v-row>
                   
                    <v-divider class="my-3"></v-divider>
                    <v-row dense class="mb-3">
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Productos</div>
                            <div class="text-h6 primary--text">{{ detalleActual.productos?.length || 0 }}</div>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Unidades</div>
                            <div class="text-h6 primary--text">{{ detalleActual.total_unidades || calcularUnidades(detalleActual) }}</div>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Peso Total</div>
                            <div class="text-h6 orange--text">{{ Number(detalleActual.peso_total || 0).toFixed(2) }} kg</div>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <div class="text-caption grey--text">Monto Total</div>
                            <div class="text-h6 success--text">S/ {{ Number(detalleActual.total || 0).toFixed(2) }}</div>
                        </v-col>
                    </v-row>


                    <v-alert v-if="detalleActual.observacion" dense text type="info" class="mb-3">
                        <strong>Observación:</strong> {{ detalleActual.observacion }}
                    </v-alert>
                    <v-simple-table dense>
                        <thead>
                            <tr class="grey lighten-3">
                                <th>#</th>
                                <th>Producto</th>
                                <th>Código</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-right">P. Unit.</th>
                                <th class="text-right">Peso</th>
                                <th class="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, i) in detalleActual.productos" :key="i">
                                <td>{{ i + 1 }}</td>
                                <td>{{ p.nombre }}</td>
                                <td>{{ p.codbarra || p.id }}</td>
                                <td class="text-center">{{ p.cantidad }}</td>
                                <td class="text-right">S/ {{ Number(p.precio || 0).toFixed(2) }}</td>
                                <td class="text-right">{{ Number(p.peso || 0).toFixed(2) }} kg</td>
                                <td class="text-right font-weight-medium">S/ {{ Number(p.monto_soles || 0).toFixed(2) }}</td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                </v-card-text>
                <v-card-actions>
                    <v-btn small text color="primary" @click="imprimirTransferencia(detalleActual)">
                        <v-icon left small>mdi-printer</v-icon>Ticket
                    </v-btn>
                    <v-btn small text color="blue" @click="imprimirTransferenciaA4(detalleActual)">
                        <v-icon left small>mdi-file-pdf-box</v-icon>PDF A4
                    </v-btn>
                    <v-btn small text color="success" @click="exportarTransferenciaExcel(detalleActual)">
                        <v-icon left small>mdi-microsoft-excel</v-icon>Excel
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text color="grey" @click="mostrarDetalle = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_mov v-if="mostrarDialogo" @cerrar="cerrarDialogoNuevo" @guardado="cargarMovimientos" />
        <dial_mov v-if="dialogoEditar" :transferencia="detalleEditar" @cerrar="cerrarDialogoEditar" @guardado="cargarMovimientos" />
    </div>
</template>


<script>
import dial_mov from '@/views/kardex/dial_transferencia'
import {
    imprimirTransferenciaPDF80mm,
    imprimirTransferenciaPDFA4,
    exportarTransferenciaExcel as exportarExcelItem,
    exportarListaTransferenciasExcel
} from "@/views/kardex/formatos/form_transferencia";
import { all_transferencia, allProductoOtraBase, grabarStockOtraBase, actualiza_transferencia } from '@/db'
import { anularMovimientosTransferencia } from '@/views/kardex/help_mov_tranferencia'
import moment from 'moment'
import store from '@/store'


export default {
    components: {
        dial_mov
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
                { text: 'Total', value: 'usuario' },
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
            sede_destino: '',
            sedesDestino: []
        }
    },
    computed: {
        esAdmin() {
            return store.state.permisos?.es_admin === true;
        },
        sedeActualBase() {
            return store.state.sedeActual?.base || store.state.sedeActual?.codigo || '';
        }
    },
    mounted() {
        this.prepararSedesDestino()
        this.inicializarSedeFiltro()
        this.cargarMovimientos()
    },
    methods: {
        inicializarSedeFiltro() {
            if (this.esAdmin) {
                this.sede_destino = '*';
            } else {
                this.sede_destino = this.sedeActualBase || '*';
            }
        },
        prepararSedesDestino() {
            const sedes = (store.state.array_sedes || []).filter(s => s.tipo === 'sede')


            if (this.esAdmin) {
                this.sedesDestino = [
                    { nombre: 'TODAS', base: '*' },
                    ...sedes.map(s => ({
                        nombre: s.nombre,
                        base: s.base
                    }))
                ]
            } else {
                const miSede = sedes.find(s => s.base === this.sedeActualBase);
                this.sedesDestino = [
                    { nombre: 'TODAS MIS TRANSFERENCIAS', base: '*' },
                    ...(miSede ? [{ nombre: miSede.nombre, base: miSede.base }] : [])
                ];
            }
        },
        calcularUnidades(transferencia) {
            return (transferencia.productos || []).reduce((s, p) => s + Number(p.cantidad || 0), 0);
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
                obj.key = item.key
                datos.push(obj)
            })
            datos.sort((a, b) => b.fecha_unix - a.fecha_unix)
            let filtrados = datos
           
            // Para usuarios no-admin, mostrar transferencias donde su sede sea origen O destino
            if (!this.esAdmin) {
                filtrados = filtrados.filter(mov =>
                    mov.sede_origen === this.sedeActualBase ||
                    mov.sede_destino === this.sedeActualBase
                )
            }
           
            // Filtro adicional por sede destino seleccionada
            if (this.sede_destino && this.sede_destino !== '*') {
                filtrados = filtrados.filter(mov =>
                    mov.sede_destino === this.sede_destino ||
                    mov.sede_origen === this.sede_destino
                )
            }
           
            this.movimientos = filtrados
        },
        formatoFecha(timestamp) {
            return moment.unix(timestamp).format('DD/MM/YYYY')
        },
        nombreSede(base) {
            if (!base) return '-';
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
                const snap_origen = await allProductoOtraBase(item.sede_origen).once('value');
                const origen_actual = snap_origen.val() ? Object.values(snap_origen.val()) : [];


                const snap_destino = await allProductoOtraBase(item.sede_destino).once('value');
                const destino_actual = snap_destino.val() ? Object.values(snap_destino.val()) : [];


                for (const prod of item.productos) {
                    const prodOrigen = origen_actual.find(p => p.id == prod.id);
                    const stockOrigen = prodOrigen ? Number(prodOrigen.stock) : 0;
                    await grabarStockOtraBase(item.sede_origen, prod.id, stockOrigen + Number(prod.cantidad));


                    const prodDestino = destino_actual.find(p => p.id == prod.id);
                    const stockDestino = prodDestino ? Number(prodDestino.stock) : 0;
                    const nuevoStockDestino = Math.max(0, stockDestino - Number(prod.cantidad));
                    await grabarStockOtraBase(item.sede_destino, prod.id, nuevoStockDestino);
                }
                await actualiza_transferencia(item.key || item.id, { estado: 'anulado', anulado_por: store.state.permisos.correo, anulado_en: moment().unix() });
                await anularMovimientosTransferencia(item);
                store.commit("dialogoprogress")
                this.muestraMsg('Transferencia anulada y stocks revertidos.', 'success');
                if (typeof this.cargarMovimientos === "function") this.cargarMovimientos();
            } catch (e) {
                this.muestraMsg('Error al anular transferencia: ' + (e.message || e), 'error');
            }
            this.cargando = false;
        },
        imprimirTransferencia(item) {
            imprimirTransferenciaPDF80mm(
                item,
                this.nombreSede,
                this.formatoFecha
            );
        },
        imprimirTransferenciaA4(item) {
            const logoEmpresa = store.state.logoempresa || null;
            imprimirTransferenciaPDFA4(item, this.nombreSede, logoEmpresa);
        },
        exportarTransferenciaExcel(item) {
            exportarExcelItem(item, this.nombreSede);
        },
        exportarListaExcel() {
            if (this.movimientos.length === 0) {
                this.muestraMsg('No hay transferencias para exportar', 'warning');
                return;
            }
            exportarListaTransferenciasExcel(this.movimientos, this.nombreSede);
        },
        cerrarDialogoNuevo() {
            this.mostrarDialogo = false;
            this.cargarMovimientos();
        },
        cerrarDialogoEditar() {
            this.dialogoEditar = false;
            this.cargarMovimientos();
        },
        muestraMsg(msg, color = 'info') {
            this.textoMensaje = msg;
            this.colorMensaje = color;
            this.mensaje = true;
        },
    }
}
</script>