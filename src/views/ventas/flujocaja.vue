<template>
    <div class="pa-4">
        
        <v-dialog persistent v-model="dialogoprogress" max-width="250">
            <v-card class="pa-8 text-center rounded-lg">
                <v-progress-circular :rotate="360" :size="80" :width="10" color="primary" indeterminate />
                <div class="mt-3 text-subtitle-1">Procesando...</div>
            </v-card>
        </v-dialog>

        <v-card class="elevation-3 mb-4 rounded-lg">
            <v-card-text class="py-3">
                <v-row align="center" dense>
                    <v-col cols="12" md="5" sm="12">
                        <div class="d-flex align-center">
                            <v-icon large left color="primary">mdi-cash-multiple</v-icon>
                            <div>
                                <h3 class="text-h6 primary--text">TOTAL CAJA: S/.{{ sumatotal() }}</h3>
                                <span class="caption">
                                    VENTA (Ingresos): S/.{{ sumaVentas() }} | Apertura: {{ fecha_inicio }}
                                </span>
                            </div>
                        </div>
                    </v-col>

                    <v-col cols="12" md="2" sm="4" class="text-center">
                        <v-btn small v-if="$store.state.permisos.punto_venta" block  color="error" @click="abrir_caja()">
                            <v-icon left>mdi-cash-register</v-icon> Punto Venta
                        </v-btn>
                    </v-col>

                    <v-col cols="12" md="5" sm="8" class="text-right">
                        <v-menu v-model="menuOpc" bottom offset-y :close-on-content-click="false" nudge-bottom="10" max-width="300">
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn color="primary" block small v-bind="attrs" v-on="on">
                                    <v-icon left>mdi-tune</v-icon> Opciones de Flujo
                                </v-btn>
                            </template>

                            <v-list dense>
                                <v-list-item @click.stop>
                                    <v-select outlined dense v-model="filtroMov" :items="arrayFiltroMov" item-text="text"
                                        item-value="value" label="Filtrar movimientos" hide-details />
                                </v-list-item>
                                <v-divider class="my-1"></v-divider>

                                <v-list-item @click="evento(5)">
                                    <v-list-item-icon><v-icon color="info">mdi-cash-plus</v-icon></v-list-item-icon>
                                    <v-list-item-title>Inicio / Apertura Caja</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="evento(2)">
                                    <v-list-item-icon><v-icon color="info">mdi-swap-horizontal</v-icon></v-list-item-icon>
                                    <v-list-item-title>Nuevo Ingreso / Egreso</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="evento(3)">
                                    <v-list-item-icon><v-icon color="info">mdi-lock</v-icon></v-list-item-icon>
                                    <v-list-item-title>Cerrar Caja (Reporte)</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="evento(4)">
                                    <v-list-item-icon><v-icon color="info">mdi-history</v-icon></v-list-item-icon>
                                    <v-list-item-title>Ver Historial</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="dialog_reporte = true">
                                    <v-list-item-icon><v-icon color="info">mdi-chart-box-outline</v-icon></v-list-item-icon>
                                    <v-list-item-title>Productos Vendidos</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="evento(6)">
                                    <v-list-item-icon><v-icon color="info">mdi-file-chart-outline</v-icon></v-list-item-icon>
                                    <v-list-item-title>Reporte General</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        
        <v-row dense>
            <v-col cols="12" md="3" sm="6" v-for="item in suma_reportes()" :key="item.nombre">
                <v-card class="pa-3 elevation-2 rounded-lg" :color="item.nombre === 'EFE' ? 'amber lighten-5' : 'blue-grey lighten-5'">
                    <div class="text-subtitle-1 font-weight-bold">{{ item.nombre }}</div>
                    <v-divider class="my-1"></v-divider>
                    <v-row dense class="text-caption font-weight-medium text-center">
                        <v-col cols="4">Ingreso</v-col>
                        <v-col cols="4">Egreso</v-col>
                        <v-col cols="4">Saldo</v-col>
                    </v-row>
                    <v-row dense class="text-center font-weight-bold">
                        <v-col cols="4" class="green--text text--darken-2">S/.{{ redondear(item.ingreso) }}</v-col>
                        <v-col cols="4" class="red--text text--darken-2">S/.{{ redondear(item.egreso) }}</v-col>
                        <v-col cols="4" :class="{'green--text': (item.ingreso - item.egreso) >= 0, 'red--text': (item.ingreso - item.egreso) < 0}">
                            S/.{{ redondear(item.ingreso - item.egreso) }}
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>
        
        <v-simple-table class="elevation-1 rounded-lg" fixed-header height="60vh" dense>
            <template v-slot:default>
                <thead>
                    <tr class="blue-grey lighten-5">
                        <th class="text-left">Mov.</th>
                        <th class="text-left">Modo</th>
                        <th class="text-left">Fecha</th>
                        <th class="text-right">Total</th>
                        <th class="text-left">Observación</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Accion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in listafiltrada" :key="item.id" :class="{ 'grey lighten-4': item.operacion === 'credito' }">
                        <td>
                            <v-chip 
                                x-small 
                                :color="item.operacion === 'ingreso' ? 'success' : (item.operacion === 'egreso' ? 'error' : 'primary')" 
                                dark
                            >
                                {{ extrae_texto(item.operacion, 4) }}
                            </v-chip>
                        </td>
                        <td>{{ extrae_texto(item.modo, 4) }}</td>
                        <td><span class="caption">{{ conviertefecha(item.fecha) }}</span></td>
                        <td class="text-right font-weight-bold" 
                            :class="{ 'red--text': item.operacion === 'egreso', 'success--text': item.operacion === 'ingreso' }">
                            S/.{{ redondear(item.total) }}
                        </td>
                        <td><span class="caption">{{ item.observacion }}</span></td>
                        <td class="text-center">
                            <v-chip x-small :color="item.estado === 'activo' ? 'green' : 'red'" dark>
                                {{ item.estado }}
                            </v-chip>
                        </td>
                        <td class="text-center" width="100">
                            <v-btn icon x-small color="red" @click="abre_editar(item)" title="Ver / Anular">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn icon x-small color="green" @click.prevent="ver_items(item)" title="Ver Detalle Venta">
                                <v-icon>mdi-eye</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>

        <v-dialog v-model="dialogoegreso" max-width="600">
            <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark><v-toolbar-title>Registro Ingreso / Egreso</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialogoegreso = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="6"><v-text-field type="date" outlined dense v-model="date" label="Fecha"></v-text-field></v-col>
                        <v-col cols="6"><v-select v-model="operacion" :items="arrayoperacion2" label="Tipo Operación" outlined dense></v-select></v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="6"><v-text-field type="number" v-model="monto" label="Monto S/." outlined dense prefix="S/." /></v-col>
                        <v-col cols="6"><v-select v-model="modo_pago" :items="$store.state.modopagos" label="Modo Pago" outlined dense></v-select></v-col>
                    </v-row>
                    <v-row dense class="mt-n4">
                        <v-col cols="12"><v-textarea v-model="obs" auto-grow outlined dense label="Observación" rows="1" /></v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="green" block large @click="graba()"><v-icon left>mdi-content-save</v-icon> GUARDAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogoObservacion" max-width="390">
            <v-card class="rounded-lg">
                <v-toolbar color="red" dense dark><v-toolbar-title>Detalle y Gestión</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialogoObservacion = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <h4 class="mb-2">Total: <strong class="success--text">S/.{{ redondear(itemelecto.total) }}</strong></h4>
                    <h4 class="mb-2">Modo Pago: <strong class="red--text">{{ itemelecto.modo }}</strong> 
                         <v-btn icon x-small color="green" class="ml-1" @click="cambia_metodo = true" title="Cambiar método de pago"><v-icon small>mdi-lead-pencil</v-icon></v-btn>
                    </h4>
                    <h4 class="mb-4">Observación: {{ itemelecto.observacion }}</h4>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="error" block large @click="pre_anular = true"><v-icon left>mdi-delete</v-icon> ANULAR FLUJO</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="pre_anular" max-width="460">
             <v-card class="rounded-lg">
                <v-toolbar color="red darken-2" dense dark><v-toolbar-title>Confirmar Anulación (Atención)</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="pre_anular = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4 text-center">
                    <h4 class="text-h6 red--text">¡ADVERTENCIA DE ANULACIÓN!</h4>
                    <p class="mt-3 text-subtitle-2">
                        Este proceso anulará **SOLO** la entrada en el **Flujo de Caja**.
                    </p>
                    <p class="caption font-weight-bold">
                        RECUERDE: Debe anular el comprobante de venta asociado (Boleta/Factura) con una **NOTA DE CRÉDITO** o solicitud de **BAJA** en el sistema de la SUNAT/facturador.
                    </p>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="error" block large @click="anular()">CONTINUAR (Anular Flujo)</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="cambia_metodo" max-width="390">
            <v-card class="rounded-lg">
                <v-toolbar color="green" dense dark><v-toolbar-title>Cambiar Modo de Pago</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="cambia_metodo = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                 <v-card-text class="pa-4">
                    <v-select v-model="modo_pago" :items="$store.state.modopagos" label="Nuevo Modo" outlined dense></v-select>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="success" block large @click="cambia_edita_modo()">MODIFICAR</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogocierre" max-width="460">
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark><v-toolbar-title>Cierre de Caja</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialogocierre = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-text-field disabled type="date" outlined dense v-model="date" label="Fecha de Cierre"></v-text-field>
                    <v-textarea class="mt-n2" dense v-model="observacion" auto-grow filled outlined color="deep-purple" label="Observación del Cierre" rows="1"></v-textarea>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="red" large @click="ejecuta_reporte_detallado()">Ver Reporte</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" large @click="cierraflujos()">Cerrar y Grabar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="dialogo_apertura" max-width="390">
             <v-card class="rounded-lg">
                <v-toolbar color="info" dense dark><v-toolbar-title>Apertura de Caja</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialogo_apertura = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                 <v-card-text class="pa-4">
                    <v-text-field disabled type="date" outlined dense v-model="date" label="Fecha"></v-text-field>
                    <v-text-field class="mt-n2" outlined type="number" dense v-model="monto_apertura" label="Monto Apertura (Efectivo)" prefix="S/." />
                    <v-checkbox v-model="guardar_stock" label="Guardar stock actual" class="mt-2" dense></v-checkbox>
                </v-card-text>
                <v-card-actions class="pa-4 pt-0">
                    <v-btn color="green darken-1" block large @click="crea_apertura()">
                        <v-icon left>mdi-cash-lock-open</v-icon> CREAR APERTURA
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dial_reportes" max-width="390">
            <v-card class="rounded-lg">
                <v-toolbar color="teal darken-1" dense dark><v-toolbar-title>Generar Reporte General</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dial_reportes = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="6">
                            <v-btn color="warning" block @click="ejecuta_reporte_detallado()">
                                <v-icon left>mdi-file-pdf-box</v-icon> PDF
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn color="success" block @click="exportaExcel()">
                                <v-icon left>mdi-file-excel</v-icon> Excel
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="dialog" max-width="850px">
            <v-card class="rounded-lg">
                <v-toolbar color="primary" dense dark><v-toolbar-title>Detalle de Items</v-toolbar-title><v-spacer></v-spacer><v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn></v-toolbar>
                <v-card-text class="pa-4">
                    <v-simple-table fixed-header height="60vh" dense class="elevation-1">
                        <template v-slot:default>
                            <thead class="blue-grey lighten-5">
                                <tr>
                                    <th class="text-left font-weight-bold">Descripción</th>
                                    <th class="text-left font-weight-bold">Medida</th>
                                    <th class="text-center font-weight-bold">Cantidad</th>
                                    <th class="text-right font-weight-bold">Precio Unit.</th>
                                    <th class="text-right font-weight-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in arrayConsolidar" :key="index">
                                    <td>{{ item.nombre }}</td>
                                    <td>{{ item.medida }}</td>
                                    <td class="text-center">{{ item.cantidad }}</td>
                                    <td class="text-right">S/.{{ redondear(item.precioedita) }}</td>
                                    <td class="text-right font-weight-bold">S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card-text>
            </v-card>
        </v-dialog>
        
        <dial_rep_vend v-if="dialog_reporte" :data="desserts" @cierra="dialog_reporte = false" />

    </div>
</template>

<script>

import {
    allflujo,
    edita_Flujo,
    nuevoflujo,
    consultaDetalle,
    estadoFlujo,
    elimina_all_flujo,
    nuevoflujo_historial,
    nuevo_histo_stock,
    all_histo_stock,
    nuevoflujo_teso
} from '../../db'
import XLSX from 'xlsx'
import moment from 'moment'
import {
    pdfcierrecaja,
    pdf_total_caja
} from '../../pdf'
import dial_rep_vend from './reportes/rep_productos_vendidos.vue'
import store from '@/store/index'

export default {
    name: 'flujocaja',
    components: {
        dial_rep_vend
    },
    data() {
        return {
            filtroMov: 'todos',
            arrayFiltroMov: [
                { text: "Todos", value: "todos" },
                { text: "Ingresos", value: "ingreso" },
                { text: "Egresos", value: "egreso" },
                { text: "Venta", value: "venta" }
            ],
            arrayConsolidar: [],
            arra_cods: [],
            dialog: false,
            dialog_reporte: false,
            date: moment(String(new Date)).format('YYYY-MM-DD'),
            date2: moment(String(new Date)).format('YYYY-MM-DD'),
            monto_apertura: 0,
            dialogo_apertura: false,
            dial_reportes: false,
            desserts: [],
            dialogoegreso: false,
            dialogoObservacion: false,
            dialogocierre: false,
            guardar_stock: false,
            operacionfiltra: 'todos',
            operacion: 'ingreso',
            arrayoperacion: ["todos", "ingreso", "egreso"],
            arrayoperacion2: ["ingreso", "egreso"],
            observacion: '',
            ordenflujo: '',
            modo: 'EFECTIVO',
            arrafiltrado: '',
            itemelecto: '',
            arrayExporta: [],
            dialogoprogress: false,
            doc_sujeto: '',
            nom_sujeto: '',
            serie_ref: '',
            corr_ref: '',
            modo_pago: 'EFECTIVO',
            monto: '',
            obs: '',
            cabecera: '',
            fecha_inicio: moment(String(new Date)).format('MM-DD'),
            cambia_metodo: false,
            pre_anular: false,
        }
    },
    mounted() {
        allflujo().limitToLast(1500).on("value", this.onDataChange);
    },
    beforeDestroy() {
        allflujo().off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            if (this.filtroMov === 'todos') return this.desserts;

            // 👇 Nuevo filtro: solo movimientos de ingreso cuya observación contenga "VENTA"
            if (this.filtroMov === 'venta') {
                return this.desserts.filter(f =>
                    f.operacion === 'ingreso' &&
                    f.estado !== 'anulado' &&
                    f.observacion &&
                    f.observacion.toUpperCase().includes('VENTA')
                );
            }

            // Ingresos / Egresos como ya lo tenías
            return this.desserts.filter(f =>
                f.operacion === this.filtroMov
            );
        },
    },
    methods: {
        abrir_caja() {
            this.$router.push('/caja2'); // Redirige a la ruta flujocaja
        },




        abre_editar(item) {

            this.modo_pago = item.modo
            this.itemelecto = item
            this.dialogoObservacion = true
        },
        async cambia_edita_modo() {
            store.commit("dialogoprogress", 1)
            await edita_Flujo(this.itemelecto.id + '/modo', this.modo_pago)
            store.commit("dialogoprogress", 1)
            this.cambia_metodo = false
            this.dialogoObservacion = false
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },
        sumatotal() {
            var suma = 0
            var array = this.listafiltrada
            for (var i = 0; i < array.length; i++) {
                if (array[i].operacion == "ingreso" && array[i].estado != 'anulado') {
                    suma = suma + parseFloat(array[i].total)
                }
            }
            return suma.toFixed(2)
        },
        sumaVentas() {
            let suma = 0;
            for (let i = 0; i < this.desserts.length; i++) {
                const item = this.desserts[i];

                if (
                    item.operacion === "ingreso" &&
                    item.estado !== "anulado" &&
                    item.observacion &&
                    item.observacion.toUpperCase().includes("VENTA")
                ) {
                    suma += parseFloat(item.total);
                }
            }
            return suma.toFixed(2);
        },
        suma_reportes() {
            var lista = []
            var modopagos = store.state.modopagos
            for (var i = 0; i < modopagos.length; i++) {
                lista.push({
                    nombre: this.extrae_texto(modopagos[i], 4),
                    ingreso: this.sumatoria(this.listafiltrada, modopagos[i], 'ingreso'),
                    egreso: this.sumatoria(this.listafiltrada, modopagos[i], 'egreso'),
                })
            }
            return lista
        },
        sumatoria(array, modo, operacion) {
            var suma = 0
            for (var e = 0; e < array.length; e++) {
                if (array[e].modo == modo && array[e].operacion == operacion && array[e].estado == 'activo') {
                    suma = suma + parseFloat(array[e].total)
                }
            }
            return suma.toFixed(2)
        },
        extrae_texto(data, cantidad) {
            return data.substr(0, cantidad)
        },
        evento(item) {
            if (item == 2) {
                this.consultaCorrelativo()
            }
            if (item == 3) {
                this.cierrecaja()
            }
            if (item == 4) {
                this.$router.push({
                    path: '/reporte_flujos'
                })
            }
            if (item == 5) {
                this.dialogo_apertura = true
            }
            if (item == 6) {
                this.dial_reportes = true
            }
        },
        async onDataChange(items) {

            let array = [];
            items.forEach((item) => {
                let data = item.val();
                if (Boolean(data.estado)) {
                    let key = item.key
                    data.key = key
                    data.id = key
                    array.push(data);
                }

            });

            array.sort(function (a, b) {
                if (a.fecha > b.fecha) {
                    return 1;
                }
                if (a.fecha < b.fecha) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            this.desserts = array.reverse()
            //store.commit("dialogoprogress", 1)
        },

        irCaja() {
            this.$router.push({
                path: '/caja2'
            })
        },
        conviertefecha(date) {
            return moment.unix(date).format('DD/MM hh:mm A')
        },
        consultaCorrelativo() {
            this.dialogoegreso = true

        },
        async graba() {

            if (!this.monto || isNaN(this.monto) || this.monto <= 0) {
                this.$store.commit('dialogosnackbar', 'Ingrese un monto válido');
                return;
            }
            if (this.operacion === 'egreso') {
                const reportes = this.suma_reportes(); // ← asegúrate que devuelve un array
                console.log('Reportes disponibles:', reportes, this.modo_pago.toUpperCase());
                const metodo = reportes.find(m =>
                    m.nombre.toUpperCase() === this.extrae_texto(this.modo_pago, 4)
                );
                console.log('Método encontrado:', metodo);
                if (metodo) {
                    const saldoDisponible = parseFloat(metodo.ingreso) - parseFloat(metodo.egreso);
                    if (parseFloat(this.monto) > saldoDisponible && !store.state.permisos.es_admin) {
                        this.$store.commit('dialogosnackbar', `Saldo insuficiente en ${this.modo_pago}`);
                        return;
                    }
                }
            }

            this.dialogoprogress = true;
            const correo = store.state.permisos.correo || '';
            const responsable = correo.split('@')[0];

            const flujo = {
                operacion: this.operacion || '',
                observacion: `${this.obs || ''} ${this.serie_ref || ''} ${this.corr_ref || ''}`.trim(),
                modo: this.modo_pago || '',
                fecha: moment().unix(),
                total: parseFloat(this.monto),
                estado: 'activo',
                responsable,
                sujeto: responsable
            };

            try {
                await nuevoflujo(flujo);
                this.limpia();
                this.$store.commit('dialogosnackbar', '✅ Flujo guardado correctamente');
            } catch (error) {
                console.error('Error al guardar:', error);
                this.$store.commit('dialogosnackbar', '❌ Error al guardar el flujo');
            } finally {
                this.dialogoprogress = false;
            }
        },



        limpia() {
            this.dialogoegreso = false
            this.dialogocierre = false
            this.obs = ''
            this.operacion = 'ingreso'
            this.monto = ''
        },
        cierrecaja() {
            this.operacion = "todos"
            this.modo = "EFECTIVO"
            this.dialogocierre = true

        },
        calcTotalesPorMetodo(flujos) {
            const porModo = {};
            const mods = (this.$store.state.modopagos || []).map(m => m.toUpperCase());

            // inicializa todos los métodos que tengas configurados
            for (const m of mods) porModo[m] = { ingreso: 0, egreso: 0, saldo: 0 };

            // acumula
            for (const it of flujos) {
                if (!it || it.estado === 'anulado') continue;
                const modo = (it.modo || 'SIN DEFINIR').toUpperCase();
                const total = parseFloat(it.total) || 0;

                if (!porModo[modo]) porModo[modo] = { ingreso: 0, egreso: 0, saldo: 0 };

                if (it.operacion === 'ingreso') porModo[modo].ingreso += total;
                else if (it.operacion === 'egreso') porModo[modo].egreso += total;
                // (crédito no impacta saldo de caja)
            }

            // calcula saldos por método
            const saldosFinales = {};
            let totalIngreso = 0, totalEgreso = 0;

            for (const [modo, v] of Object.entries(porModo)) {
                v.ingreso = parseFloat(v.ingreso.toFixed(2));
                v.egreso = parseFloat(v.egreso.toFixed(2));
                v.saldo = parseFloat((v.ingreso - v.egreso).toFixed(2));

                saldosFinales[modo] = v.saldo;
                totalIngreso += v.ingreso;
                totalEgreso += v.egreso;
            }

            return {
                por_modo: porModo,
                saldos_finales: saldosFinales,
                total_ingreso: parseFloat(totalIngreso.toFixed(2)),
                total_egreso: parseFloat(totalEgreso.toFixed(2)),
            };
        },

        // 🔹 NUEVO: aplica saldos finales como saldos iniciales del nuevo flujo
        async aplica_saldos_iniciales(saldosFinalesPorModo) {
            const ahora = moment().unix();
            const correo = this.$store.state.permisos.correo || '';
            const responsable = correo.split('@')[0];

            for (const [modo, saldo] of Object.entries(saldosFinalesPorModo)) {
                const monto = parseFloat(saldo) || 0;
                if (monto <= 0) continue; // solo trasladamos saldos positivos

                const flujoInicial = {
                    operacion: 'ingreso',
                    observacion: 'Saldo inicial automático',
                    modo,
                    fecha: ahora,
                    total: parseFloat(monto.toFixed(2)),
                    estado: 'activo',
                    responsable,
                    sujeto: responsable,
                };
                await nuevoflujo(flujoInicial);
            }
        },
        async cierraflujos() {
            this.$store.commit("dialogoprogress", 1);

            // 1) Calcula totales por método con los flujos actuales
            const tot = this.calcTotalesPorMetodo(this.desserts);

            // 2) Arma registro de historial (incluye desagregado por método)
            const historial = {
                fecha_inicio: moment().unix(),
                fecha_cierre: moment().unix(),
                monto_apertura: 0,
                ingreso: tot.total_ingreso,
                egreso: tot.total_egreso,
                observacion: this.observacion,
                estado: 'cerrado',
                data: this.desserts,              // respaldo de movimientos
                totales_por_modo: tot.por_modo,            // 👈 guardado por método
                saldos_finales_por_modo: tot.saldos_finales// 👈 saldos finales por método
            };

            // (opcional) genera pdf detallado antes de limpiar
            this.ejecuta_reporte_detallado();

            // 3) Guarda historial y crea movimientos en tesorería (netos por método)
            const r = await nuevoflujo_historial(historial);
            await this.crear_flujo_tesoreria(historial, r.key);

            // 4) Limpia flujos de la caja actual
            await elimina_all_flujo();

            // 5) Aplica saldos finales como saldos iniciales del NUEVO flujo
            if (store.state.configuracion.copia_saldos_caja) {
                await this.aplica_saldos_iniciales(tot.saldos_finales);
            }


            this.$store.commit("dialogoprogress", 0);
            this.dialogocierre = false;
        },
        async crear_flujo_tesoreria(data, key) {
            const ingresosPorModo = {};
            const egresosPorModo = {};
            const creditosPorModo = {};

            // Acumular por método de pago
            data.data.forEach(item => {
                if (item.estado === "anulado") return;
                const modo = item.modo || "SIN DEFINIR";
                const total = parseFloat(item.total) || 0;

                if (item.operacion === "ingreso") {
                    ingresosPorModo[modo] = (ingresosPorModo[modo] || 0) + total;
                } else if (item.operacion === "egreso") {
                    egresosPorModo[modo] = (egresosPorModo[modo] || 0) + total;
                } else if (item.operacion === "credito") {
                    creditosPorModo[modo] = (creditosPorModo[modo] || 0) + total;
                }
            });

            const ahora = moment().unix();
            const sede = store.state.sedeActual;
            const responsable = (store.state.permisos.correo || '').split('@')[0];

            // Saldo neto por método (ingreso - egreso). Si es negativo, registrar como egreso.
            const modos = new Set([...Object.keys(ingresosPorModo), ...Object.keys(egresosPorModo)]);
            for (const modo of modos) {
                const neto = (ingresosPorModo[modo] || 0) - (egresosPorModo[modo] || 0);
                if (neto === 0) continue;

                const flujo = {
                    operacion: neto > 0 ? "ingreso" : "egreso",
                    observacion: `Cierre de caja ${sede.nombre} - Saldo neto por ${modo}`,
                    origen: sede,
                    modo,
                    fecha: ahora,
                    total: Math.abs(neto),
                    estado: "activo",
                    id_flujo: key,
                    responsable
                };
                await nuevoflujo_teso(flujo);
            }

            // Línea aparte para CRÉDITO (no se netea)
            for (const [modo, total] of Object.entries(creditosPorModo)) {
                if (!total) continue;
                const flujoCredito = {
                    operacion: "credito",
                    observacion: `Cierre de caja ${sede.nombre} - Total por ${modo} (CRÉDITO)`,
                    origen: sede,
                    modo,
                    fecha: ahora,
                    total,
                    estado: "activo",
                    id_flujo: key,
                    responsable
                };
                await nuevoflujo_teso(flujoCredito);
            }

            this.dialogo_apertura = false;
        },



        total_saldo(modo) {
            var lista = {}
            lista = {
                nombre: this.extrae_texto(modo, 4),
                ingreso: this.sumatoria(this.desserts, modo, 'ingreso'),
                egreso: this.sumatoria(this.desserts, modo, 'egreso'),
            }

            return lista
        },
        async crea_caja() {
            var arra_totales = this.total_saldo('EFECTIVO')
            var monto = (parseFloat(arra_totales.ingreso) - parseFloat(arra_totales.egreso)).toFixed(2)
            var array = {
                fecha_inicio: moment().unix(),
                fecha_cierre: '',
                monto_apertura: monto,
                ingreso: 0,
                egreso: 0,
                observacion: 'Apertura automatica',
                estado: 'activo'
            }
            await nuevoflujo_historial(array)

            //this.dialogo_apertura=false
            //this.crea_apertura(monto)

        },
        async crea_apertura() {
            store.commit("dialogoprogress", 1)
            var flujo = {
                operacion: 'ingreso',
                observacion: 'Apertura de caja',
                modo: 'EFECTIVO',
                fecha: moment().unix(),
                total: this.monto_apertura,
                estado: 'activo',
                responsable: store.state.permisos.correo.slice(0, -13),
                sujeto: store.state.permisos.correo.slice(0, -13),
            }
            await nuevoflujo(flujo)

            this.dialogo_apertura = false
            store.commit("dialogoprogress", 1)

        },


        ejecutareporte(flujos) {
            var modopagos = store.state.modopagos
            var nuevoArray = []
            var fecha = moment(String(new Date)).format('YYYY-MM-DD hh:mm A')
            for (var i = 0; i < modopagos.length; i++) {
                var suma = 0
                var array = []
                for (var e = 0; e < flujos.length; e++) {
                    if (flujos[e].estado != 'anulado') {
                        if (flujos[e].modo == modopagos[i]) {

                            array.push(flujos[e]);
                            console.log(parseFloat(flujos[e]))
                            if (flujos[e].operacion == "ingreso") {
                                suma = suma + parseFloat(flujos[e].total)

                            } else {
                                suma = suma - parseFloat(flujos[e].total)
                            }
                        }
                    }
                }

                nuevoArray[i] = new Array(3);
                nuevoArray[i][0] = array
                nuevoArray[i][1] = modopagos[i]
                nuevoArray[i][2] = suma.toFixed(2)
            }
            pdfcierrecaja(nuevoArray, fecha)
        },
        exportaExcel() {
            var data = this.desserts
            var array = []
            for (var i = 0; i < data.length; i++) {
                var item = data[i]
                array.push({
                    operacion: item.operacion,
                    modo: item.modo,
                    fecha: this.conviertefecha(item.fecha),
                    total: parseFloat(item.total),
                    obs: item.observacion,
                    estado: item.estado
                })
            }
            var data = XLSX.utils.json_to_sheet(array)
            const workbook = XLSX.utils.book_new()
            const filename = 'DATA'
            XLSX.utils.book_append_sheet(workbook, data, "flujo caja")
            XLSX.writeFile(workbook, `${filename}.xlsx`)
            this.dialogoExporta = false
        },
        async anular() {

            this.dialogoprogress = true
            var id = this.itemelecto.id
            console.log(this.itemelecto)
            await estadoFlujo(id, "anulado")
            this.dialogoObservacion = false
            this.pre_anular = false
            this.dialogoprogress = false

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
        ejecuta_reporte_detallado() {
            let movimientos = {
                EFECTIVO: {
                    ingreso: 0,
                    egreso: 0
                },
                TARJETA: {
                    ingreso: 0,
                    egreso: 0
                },
                YAPE: {
                    ingreso: 0,
                    egreso: 0
                },
                PLIN: {
                    ingreso: 0,
                    egreso: 0
                },
                TRANSFERENCIA: {
                    ingreso: 0,
                    egreso: 0
                },
                "T.DEBITO": {
                    ingreso: 0,
                    egreso: 0
                },
                "T.CREDITO": {
                    ingreso: 0,
                    egreso: 0
                },
                RAPPY: {
                    ingreso: 0,
                    egreso: 0
                },
                "PEDIDOS YA": {
                    ingreso: 0,
                    egreso: 0
                },
                "POS QR": {
                    ingreso: 0,
                    egreso: 0
                }
            };

            let t_general = 0;
            let t_egresos = 0;
            let datos_egreso = [],
                datos_ingreso = [];

            this.desserts.forEach(item => {
                if (item.estado !== 'anulado') {
                    let monto = parseFloat(item.total);
                    let operacion = item.operacion;
                    let metodo = item.modo;

                    if (operacion === 'ingreso') {
                        t_general += monto;
                        movimientos[metodo]?.ingreso !== undefined ? movimientos[metodo].ingreso += monto : null;
                        datos_ingreso.push(item);
                    } else if (operacion === 'egreso') {
                        t_egresos += monto;
                        movimientos[metodo]?.egreso !== undefined ? movimientos[metodo].egreso -= monto : null;
                        datos_egreso.push(item);
                    }
                }
            });
            const redondear = (num) => parseFloat(num.toFixed(2));
            let array = {
                observacion: this.observacion,
                ...Object.keys(movimientos).reduce((acc, key) => ({
                    ...acc,
                    [`i_${key.toLowerCase().replace(/\s/g, '')}`]: redondear(movimientos[key].ingreso),
                    [`e_${key.toLowerCase().replace(/\s/g, '')}`]: redondear(movimientos[key].egreso)
                }), {}),
                t_efectivo: movimientos.EFECTIVO.ingreso + movimientos.EFECTIVO.egreso,
                datos: datos_egreso,
                datos_ingreso: datos_ingreso,
                t_general: t_general,
                t_egresos: t_egresos
            };
            console.log(array)
            pdf_total_caja(array);
        },
        async ver_items(value) {
            store.commit("dialogoprogress", 1)
            this.arrayConsolidar = []
            this.arra_cods = []
            var snapshot = await consultaDetalle(value.numeracion_doc).once("value")
            snapshot.forEach((item) => {
                this.arrayConsolidar.push(item.val())
            })
            store.commit("dialogoprogress", 1)
            this.dialog = true

        },
        async obtener_cod_venta(value) {
            console.log(value)
            var da = ''
            var a = await allpedidos().orderByChild('doc_venta').equalTo(value.numeracion_doc).once('value')

            if (a.exists()) {
                a.forEach((item) => {
                    var data = item.val()
                    if (data.tienda == store.state.permisos.tienda) {
                        da = da + ' ' + data.id
                    }

                })
            }
            return da
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(2)
        },

    }

}
</script>
<style>
.credito-row {
    color: #1976d2 !important;
    /* Azul (puedes usar otra tonalidad) */
    font-weight: 600;
    /* opcional, para resaltar */
}
</style>