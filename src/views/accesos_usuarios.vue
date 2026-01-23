<template>
    <v-container mb-5>
        <v-row dense class="text-center">
            <v-col cols="6">
                <h4>Usuario: {{ permisosususario.nombre }}</h4>
                <h4>Correo: {{ permisosususario.correo }}</h4>
            </v-col>
            <v-col cols="3">
                <v-btn elevation="10" rounded color="green" @click="grabaPermiso">
                    <v-icon color="white" class="mx-auto" medium>mdi-content-save</v-icon>
                </v-btn>
            </v-col>
            <v-col cols="3">
                <v-btn elevation="10" rounded color="red" @click="regresar">
                    <v-icon color="white" class="mx-auto" medium>mdi-keyboard-return</v-icon>
                </v-btn>
            </v-col>
        </v-row>

        <v-card class="pa-4" v-for="(seccion, index) in secciones" :key="index">
            <v-card-title class="mt-n6">{{ seccion.titulo }}</v-card-title>
            <v-row dense v-for="(item, idx) in seccion.items" :key="idx" class="mt-n8">
                <v-col cols="6" v-for="(permiso, pIdx) in item" :key="pIdx">
                    <div class="d-flex align-center">
                        <v-checkbox dense v-model="permisosususario[permiso.value]" :label="permiso.label" />
                        <v-tooltip v-if="permiso.tooltip" top>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon small class="ml-1" color="red" v-bind="attrs" v-on="on">mdi-information-outline</v-icon>
                            </template>
                            <span>{{ permiso.tooltip }}</span>
                        </v-tooltip>
                    </div>
                </v-col>
            </v-row>
        </v-card>
    </v-container>
</template>

<script>
import { buscarUsuarios, nuevoUsuario } from '../db';
import store from '@/store';

export default {
    data() {
        return {
            permisosususario: {},
            secciones: [
                {
                    titulo: 'General',
                    items: [
                        [
                            { label: 'Configuracion', value: 'moduloempresa' },
                            { label: 'Sunat', value: 'modulosunat' },

                        ],
                        [
                            { label: 'Administrador', value: 'es_admin' },
                            { label: 'Master', value: 'es_master' },
                        ],
                        [
                            { label: 'BONO AUTOMATICO ESTRICTO', value: 'permite_editar_bono', tooltip: 'Si esta activo, los bonos automaticos son estaticos no permite agregar mas o quitar. calculo Estricto de la logica' },
                            { label: 'PRECIO AUTOMATICO ESTRICTO', value: 'permite_editar_precio', tooltip: 'Si esta activo, los precios por escala son estaticos. No permite modificar cantidad ni eliminar productos con precio mayorista aplicado' },
                        ]
                    ],
                },
                {
                    titulo: 'Productos',
                    items: [
                        [
                            { label: 'Modulo Productos', value: 'moduloproductos' },
                            { label: 'Crea', value: 'crea_producto' },


                        ],
                        [
                            { label: 'Edita Producto', value: 'productos_edita' },
                            { label: 'Editar ID Productos', value: 'productos_edita_id' },

                        ],
                        [
                            { label: 'Editar Cod Barra', value: 'productos_edita_codbarra' },
                            { label: 'Productos x sede', value: 'productos_sede' },
                        ],
                        [
                            { label: 'Visualiza Stock', value: 'productos_visualiza_stock' },
                        ],
                    ],
                },
                {
                    titulo: 'Kardex',
                    items: [
                        [
                            { label: 'Kardex', value: 'modulokardex' },
                            { label: 'transferencias ', value: 'transferencias' },
                        ],
                        [

                        ],
                    ],
                },
                {
                    titulo: 'Transporte',
                    items: [
                        [
                            { label: 'Transporte', value: 'modulotransporte' },
                        ],
                        [
                        ],
                    ],
                },
                {
                    titulo: 'Finanzas',
                    items: [
                        [
                            { label: 'Finanzas', value: 'moduloFinanzas' },
                            { label: 'Tesoreria', value: 'tesoreria' },
                        ],
                        [
                            { label: 'Flujo Caja', value: 'flujo_caja' },
                            { label: 'Cuentas x cobrar', value: 'cuentas_cobrar' },
                        ],
                    ],
                },
                {
                    titulo: 'Empleados',
                    items: [
                        [
                            { label: 'Empleados', value: 'moduloempleados' },
                        ],
                        [
                        ],
                    ],
                },
                {
                    titulo: 'Pedidos',
                    items: [
                        [
                            { label: 'Visitas', value: 'visitas' },
                            { label: 'Lista pedidos', value: 'lista_pedidos' },
                        ],
                        [
                            { label: 'Pre-venta', value: 'pre_venta' },
                            { label: 'Venta Directa', value: 'venta_directa' },
                        ],
                        [
                            { label: 'Reparto', value: 'reparto' },
                        ],
                    ],
                },
                {
                    titulo: 'Caja',
                    items: [
                        [
                            { label: 'Caja', value: 'modulocaja' },
                            { label: 'Editar Cantidad', value: 'caja_edita_cantidad' },
                        ],
                        [
                            { label: 'Punto Venta', value: 'punto_venta' },
                            { label: 'Editar Precio', value: 'caja_edita_precio' },
                        ],
                        [

                            { label: 'Descuentos', value: 'descuentos' },
                            { label: 'Ctas.x Cobrar', value: 'modulocuentasxcobrar' },
                        ],
                        [
                            { label: 'Edita Fecha', value: 'edita_fecha' },
                            { label: 'Proformas', value: 'proforma' },
                        ],
                           [
                            { label: 'Agregar Producto ', value: 'agrega_producto' },

                            { label: 'Edita Bono', value: 'edita_bono' ,tooltip: 'Permite al momento de pedido o venta, convertir un producto en bono o tambien quitarlo.'},
                        ],
                    ],
                },
                {
                    titulo: 'Clientes',
                    items: [
                        [
                            { label: 'Clientes', value: 'moduloclientes' },
                            { label: 'Editar Clientes', value: 'clientes_edita' },
                        ],
                        [
                            { label: 'Eliminar Clientes', value: 'clientes_elimina' },
                            { label: 'Crear Clientes', value: 'clientes_crea' },
                        ],
                        [
                            { label: 'Filtrar por Vendedor', value: 'filtrar_cliente_sede', tooltip: 'Si está activo, el usuario solo verá los clientes asignados a su sede en la vista de Clientes. Si está inactivo o es Admin/Master, verá todos.' },
                        ],
                    ],
                },
                {
                    titulo: 'Reportes',
                    items: [
                        [
                            { label: 'Reportes', value: 'moduloreportes' },
                            { label: 'Comision Empl.', value: 'reportes_comision' },
                        ],
                        [
                            { label: 'Comprobantes', value: 'reportes_comprobantes' },
                            { label: 'Ranking', value: 'reportes_ranking' },
                        ],
                        [
                            { label: 'Utilidad', value: 'reportes_utilidad' },
                            { label: 'Tipo Operaciones', value: 'reportes_operaciones' },
                        ],
                        [
                            { label: 'Avance de Ventas', value: 'reporte_avance' },
                           
                        ],
                    ],
                },
            ],
        };
    },
    created() {
        this.inicio();
    },
    methods: {
        inicio() {
            buscarUsuarios(this.$route.params.id).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    this.permisosususario = snapshot.val();
                }
            });
        },
        grabaPermiso() {
            const p = this.permisosususario;
            const array = {
                token: p.token,
                nombre: p.nombre,
                correo: p.correo || 'Pendiente',
                pass: p.pass || '',
                bd: store.state.baseDatos.bd,
                ...p,
            };
            nuevoUsuario(p.token, array).then(() => {
                store.commit('dialogosnackbar', 'GUARDADO CON EXITO');
            });
        },
        regresar() {
            this.$router.push({ path: '/gestionUsuarios/' });
        },
    },
};
</script>
