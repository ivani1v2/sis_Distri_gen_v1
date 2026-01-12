<template>
    <div class="pa-2 pa-md-4">
        <v-card class="elevation-4 rounded-lg">

            <v-card-title class="pa-4 blue-grey lighten-5 d-block">
                <div class="d-flex align-center mb-3">
                    <v-icon :large="$vuetify.breakpoint.mdAndUp" left color="blue-grey darken-3">mdi-cash-multiple</v-icon>
                    <span :class="{'text-h5': $vuetify.breakpoint.mdAndUp, 'text-h6': $vuetify.breakpoint.smAndDown}"
                          class="font-weight-bold blue-grey--text text--darken-3">Cuentas por Cobrar</span>
                    <v-spacer></v-spacer>

                    <v-btn color="success" small @click="exportToExcel" class="ml-2 font-weight-medium">
                        <v-icon left small>mdi-file-excel</v-icon>
                        <span v-if="$vuetify.breakpoint.mdAndUp">Exportar Excel</span>
                        <span v-else>Excel</span>
                    </v-btn>

                    <v-menu bottom offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="primary" small v-bind="attrs" v-on="on" class="ml-2 font-weight-medium">
                                <v-icon left small>mdi-cog</v-icon> Opciones
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item>
                                <v-btn small color="error" block @click="sincroniza_productos">
                                    <v-icon left>mdi-chart-bar</v-icon> Sincroniza Productos
                                </v-btn>
                            </v-list-item>
                            <v-list-item>
                                <v-btn small color="warning" block @click="sincroniza_periodo">
                                    <v-icon left>mdi-chart-bar</v-icon> Sincroniza Periodo
                                </v-btn>
                            </v-list-item>
                            <v-list-item>
                                <v-btn small color="red" block @click="borra_periodo">
                                    <v-icon left>mdi-delete</v-icon> Borrar Periodo
                                </v-btn>
                            </v-list-item>
                        </v-list>
                    </v-menu>

                </div>

                <v-row dense>
                    <v-col cols="6" sm="3">
                        <v-select dense v-model="filtros.year" :items="years" label="Año" outlined hide-details></v-select>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select dense v-model="filtros.mes" :items="meses" label="Mes" outlined hide-details></v-select>
                    </v-col>
                    <v-col cols="12" sm="3" class="d-flex align-center">
                        <v-select dense v-model="criterioAgrupacion" :items="criterios" label="Agrupar por" outlined hide-details></v-select>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-btn block color="primary" @click="consultarVentas" class="mt-0 mt-sm-1 font-weight-bold">
                            🔍 Consultar Ventas
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row dense class="mt-2">
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.proveedores" :items="proveedores" label="Proveedores"
                            outlined clearable multiple chips item-text="nombre" item-value="nombre" hide-details></v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.marcas" :items="marcas" label="Marcas" outlined clearable
                            multiple chips item-text="nombre" item-value="nombre" hide-details></v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.categorias" :items="categorias" label="Categorias" outlined
                            clearable multiple chips item-text="nombre" item-value="nombre" hide-details></v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.vendedores" :items="$store.state.array_sedes"
                            label="Vendedores" outlined clearable multiple chips item-text="nombre" item-value="codigo" hide-details></v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.cliente" :items="clientesConFormato" label="Cliente" outlined
                            clearable multiple chips item-text="displayCliente" item-value="documento" hide-details></v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-autocomplete dense v-model="filtros.producto" :items="productosConFormato" label="Producto"
                            outlined clearable multiple chips item-text="displayProducto" item-value="id" hide-details></v-autocomplete>
                    </v-col>
                </v-row>
            </v-card-title>

            <v-divider></v-divider>
            
            <v-card-text v-if="$store.state.dialogo_progress_estado" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <div class="caption mt-3">Consultando BigQuery...</div>
            </v-card-text>

            <v-data-table v-else-if="$vuetify.breakpoint.mdAndUp" :headers="headers" :items="ventas" class="mt-0" dense>
                
                <template v-slot:body.append>
                    <tr class="font-weight-bold grey lighten-3">
                        <td :colspan="headers.length - 2" class="text-right">Total General:</td>
                        <td class="text-right" v-if="criterioAgrupacion === 'Vendedor'">
                            {{ puntos_cobertura }}
                        </td>
                        <td class="text-right">
                            <span v-if="criterioAgrupacion !== 'Vendedor' && criterioAgrupacion !== 'Proveedor'">{{ totalCantidad }}</span>
                        </td>
                        <td class="text-right">S/ {{ totalVentas }}</td>
                    </tr>
                </template>

                <template v-slot:footer.prepend>
                    <v-row class="py-2">
                        <v-col cols="12" class="text-left">
                            <v-btn v-if="criterioAgrupacion !== 'Ninguno' && criterioAgrupacion !== 'Cliente'" 
                                small color="info" class="mx-2" @click="mostrarGrafico">
                                📊 Ver Gráfico
                            </v-btn>
                        </v-col>
                    </v-row>
                </template>
            </v-data-table>

            <div v-else class="pa-2">
                
                <v-alert v-if="ventas.length === 0" type="info" dense text class="my-4">
                    No hay resultados para la consulta actual.
                </v-alert>

                <v-card v-if="ventas.length > 0" class="mb-4 elevation-2 rounded-lg">
                    <v-card-title class="py-2 subtitle-1 font-weight-bold">
                        Resultados agrupados por {{ criterioAgrupacion }}
                        <v-spacer></v-spacer>
                        <v-btn v-if="criterioAgrupacion !== 'Ninguno' && criterioAgrupacion !== 'Cliente'" 
                                small icon color="info" @click="mostrarGrafico" title="Ver gráfico">
                            <v-icon>mdi-chart-pie</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-divider></v-divider>
                    
                    <v-list dense class="py-0">
                        <v-list-item class="primary lighten-5">
                            <v-list-item-content>
                                <v-list-item-title class="font-weight-bold">Total General</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                                <span class="text-h6 font-weight-black primary--text">S/ {{ totalVentas }}</span>
                            </v-list-item-action>
                        </v-list-item>
                         <v-list-item v-if="criterioAgrupacion === 'Vendedor'">
                            <v-list-item-content>
                                <v-list-item-title class="caption">Puntos de Cobertura</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                                <v-chip small color="info">{{ puntos_cobertura }} clientes</v-chip>
                            </v-list-item-action>
                        </v-list-item>
                         <v-list-item v-if="criterioAgrupacion !== 'Vendedor' && criterioAgrupacion !== 'Proveedor'">
                            <v-list-item-content>
                                <v-list-item-title class="caption">Total Unidades Vendidas</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                                <v-chip small color="blue-grey lighten-4">{{ totalCantidad }} uds</v-chip>
                            </v-list-item-action>
                        </v-list-item>
                    </v-list>
                </v-card>

                <v-list dense class="py-0">
                    <v-card v-for="(item, index) in ventas" :key="index" class="mb-3 elevation-1 rounded-lg">
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title class="font-weight-bold text-truncate primary--text">
                                    {{ item[Object.keys(item)[0]] }} </v-list-item-title>
                                <v-list-item-subtitle v-if="Object.keys(item).length > 2 && item[Object.keys(item)[1]]" class="caption grey--text">
                                    {{ item[Object.keys(item)[1]] }}
                                </v-list-item-subtitle>
                            </v-list-item-content>
                            
                            <v-list-item-action>
                                <span class="text-h6 font-weight-bold">{{ item.total }}</span>
                                <span class="caption grey--text mt-n1">S/</span>
                            </v-list-item-action>
                        </v-list-item>
                        
                        <v-card-actions class="py-1">
                            <div v-if="item.puntos_cobertura" class="caption info--text font-weight-medium">
                                Cobertura: {{ item.puntos_cobertura }}
                            </div>
                            <div v-else-if="item.cantidad" class="caption font-weight-medium">
                                Cantidad: {{ item.cantidad }} uds
                            </div>
                            <v-spacer></v-spacer>
                            <v-btn text x-small color="blue-grey" @click="ejecutaAccionSecundaria(item)" :title="`Ver detalle de ${criterioAgrupacion}`">
                                Detalle
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-list>
            </div>
        </v-card>

        <v-dialog v-model="dialogGrafico" max-width="600px">
            <v-card>
                <v-card-title>
                    📊 Ventas por {{ criterioAgrupacion }}
                    <v-spacer></v-spacer>
                    <v-select dense v-model="tipoGrafico" :items="tiposGraficos" label="Tipo de gráfico" outlined
                        class="ml-3" style="max-width: 150px;" @change="actualizarGrafico"
                        item-value="value"></v-select>
                </v-card-title>
                <v-card-text>
                    <canvas ref="chartCanvas"></canvas>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="error" text @click="dialogGrafico = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import Chart from "chart.js/auto";
import { allCategorias } from "../../db";
import axios from "axios";
import store from "@/store/index";
import * as XLSX from "xlsx";

export default {
    data() {
        return {
            dialogGrafico: false,
            chartInstance: null,
            tipoGrafico: "doughnut",
            tiposGraficos: [
                { text: "Barra", value: "bar" },
                { text: "Dona", value: "doughnut" },
                { text: "Pastel", value: "pie" },
                { text: "Línea", value: "line" }
            ],
            // ... (filtros, years, meses, proveedores, marcas, categorias, vendedores, ventas, headers, criterios se mantienen)
            filtros: {
                year: new Date().getFullYear(),
                mes: new Date().getMonth() + 1,
                proveedores: [],
                marcas: [],
                categorias: [],
                vendedores: [],
                cliente: [],
                producto: [],
            },
            years: Array.from({ length: 2 }, (_, i) => new Date().getFullYear() - i),
            meses: [
                { text: "Enero", value: 1 }, { text: "Febrero", value: 2 }, { text: "Marzo", value: 3 },
                { text: "Abril", value: 4 }, { text: "Mayo", value: 5 }, { text: "Junio", value: 6 },
                { text: "Julio", value: 7 }, { text: "Agosto", value: 8 }, { text: "Septiembre", value: 9 },
                { text: "Octubre", value: 10 }, { text: "Noviembre", value: 11 }, { text: "Diciembre", value: 12 },
            ],
            proveedores: [],
            marcas: [],
            categorias: [],
            ventas: [],
            headers: [],
            criterios: ["Ninguno", "Fecha", "Dia", "Vendedor", "Cliente", "Producto", "Proveedor", "Marca", "Categoria"],
            criterioAgrupacion: "Ninguno",
        };
    },
    computed: {
        puntos_cobertura() {
            return this.ventas.reduce((sum, row) => sum + Number(row.puntos_cobertura || 0), 0);
        },
        totalCantidad() {
            return this.ventas.reduce((sum, row) => sum + Number(row.cantidad || 0), 0);
        },
        totalVentas() {
            return this.ventas.reduce((sum, row) => sum + Number(row.total || 0), 0).toFixed(2);
        },
        dynamicColSpan() {
            return this.headers.length - 2;
        },
        clientesConFormato() {
            return this.$store.state.clientessearch.map(cliente => ({
                ...cliente,
                displayCliente: `${cliente.id} - ${cliente.nombre}`
            }));
        },
        productosConFormato() {
            return this.$store.state.productos.map(producto => ({
                ...producto,
                displayProducto: `${producto.id} - ${producto.nombre}`
            }));
        }
    },
    created() {
        const fetchData = async (tabla, destino) => {
            const snapshot = await allCategorias(tabla).once("value");
            snapshot.forEach((item) => {
                const data = item.val();
                if (data.activo !== false) {
                    destino.push(data);
                }
            });
        };

        fetchData("categorias", this.categorias);
        fetchData("proveedor", this.proveedores);
        fetchData("marcas", this.marcas);
    },
    methods: {
        // --- Lógica de sincronización y consulta (se mantiene) ---
        async borra_periodo() {
            // ... (implementación existente)
            try {
                if (!confirm("⚠️ Se eliminarán todos los registros del periodo seleccionado en BigQuery. ¿Desea continuar?")) return;

                const empresa = this.$store.state.baseDatos?.ruc_asociado || this.$store.state.baseDatos?.ruc;
                const bd = this.$store.state.baseDatos?.bd;

                if (!empresa || !bd) {
                    alert("No se encontró información de la empresa o BD. Comuníquese con soporte.");
                    return;
                }

                const { year, mes } = this.filtros;
                if (!year || !mes) {
                    alert("Debe seleccionar año y mes para borrar el periodo.");
                    return;
                }

                const inicioDate = new Date(year, mes - 1, 1, 0, 0, 0);
                const finDate = new Date(year, mes, 0, 23, 59, 59);
                const inicio = Math.floor(inicioDate.getTime() / 1000);
                const fin = Math.floor(finDate.getTime() / 1000);

                store.commit("dialogoprogress");

                const url = "https://southamerica-east1-sis-distribucion.cloudfunctions.net/borra_bigquery_periodo";
                const payload = { empresa: String(empresa), inicio, fin };

                const response = await axios.post(url, payload, {
                    headers: { "Content-Type": "application/json" }
                });

                console.log("🗑️ Periodo borrado:", response.data);
                store.commit("dialogoprogress");
                alert("✅ Periodo eliminado correctamente de BigQuery.");
            } catch (error) {
                console.error("❌ Error al borrar periodo:", error?.response?.data || error.message || error);
                store.commit("dialogoprogress");
                alert("Error al borrar el periodo. Revise la consola o comuníquese con soporte.");
            }
        },

        async sincroniza_periodo() {
            // ... (implementación existente)
            try {
                alert("Se sincronizarán todas las ventas del periodo seleccionado (año/mes) hacia BigQuery.");

                const empresa = this.$store.state.baseDatos?.ruc_asociado || this.$store.state.baseDatos?.ruc;
                const bd = this.$store.state.baseDatos?.bd;

                if (!empresa || !bd) {
                    console.warn("Faltan datos para sincronizar periodo:", { empresa, bd });
                    alert("No se encontró información de la empresa o BD. Comuníquese con soporte.");
                    return;
                }

                const { year, mes } = this.filtros;
                if (!year || !mes) {
                    alert("Debe seleccionar año y mes para sincronizar el periodo.");
                    return;
                }

                const inicioDate = new Date(year, mes - 1, 1, 0, 0, 0);
                const finDate = new Date(year, mes, 0, 23, 59, 59);

                const inicio = Math.floor(inicioDate.getTime() / 1000);
                const fin = Math.floor(finDate.getTime() / 1000);

                store.commit("dialogoprogress");

                const url = "https://southamerica-east1-sis-distribucion.cloudfunctions.net/big_query";
                const payload = {
                    empresa: String(empresa),
                    bd: String(bd),
                    inicio,
                    fin,
                };

                const response = await axios.post(url, payload, {
                    headers: { "Content-Type": "application/json" }
                });

                console.log("✅ Periodo sincronizado:", response.data);
                store.commit("dialogoprogress");

            } catch (error) {
                console.error("❌ Error al sincronizar periodo:", error?.response?.data || error.message || error);
                store.commit("dialogoprogress");
                alert("Ocurrió un error al sincronizar el periodo. Revise la consola o comuníquese con soporte.");
            }
        },

        async sincroniza_productos() {
            // ... (implementación existente)
            alert("Solo es necesario si se han agregado nuevos productos o se han modificado existentes.");
            const empresa = this.$store.state.baseDatos?.ruc_asociado || this.$store.state.baseDatos?.ruc;
            const bd = this.$store.state.baseDatos?.bd;

            if (!empresa || !bd) {
                console.warn("Faltan datos para sincronizar productos:", { empresa, bd });
                return;
            }

            try {
                store.commit("dialogoprogress");
                const url = "https://southamerica-east1-sis-distribucion.cloudfunctions.net/big_query_productos";
                const payload = { empresa: String(empresa), bd: String(bd) };

                const response = await axios.post(url, payload, {
                    headers: { "Content-Type": "application/json" }
                });

                console.log("✅ Productos sincronizados:", response.data);
                store.commit("dialogoprogress");
            } catch (error) {
                console.error("❌ Error al sincronizar productos:", error?.response?.data || error.message || error);
            }
        },

        async consultarVentas() {
            // ... (implementación existente)
            try {
                store.commit("dialogoprogress");
                const filtros = this.filtros;

                const empresa = String(
                    this.$store.state.baseDatos?.ruc_asociado ||
                    this.$store.state.baseDatos?.ruc ||
                    ""
                ).trim();
                if (!empresa) {
                    console.warn("No hay RUC de empresa para filtrar");
                    store.commit("dialogoprogress");
                    return;
                }

                let where = `
            WHERE id_empresa = @empresa
            AND estado != 'ANULADO'
            AND operacion != 'GRATUITA'
            AND EXTRACT(YEAR  FROM fecha_ts) = @year
            AND EXTRACT(MONTH FROM fecha_ts) = @mes
          `;

                let groupBy = ``;
                let orderBy = `ORDER BY total DESC`;

                let selectFields = `
            FORMAT_DATE('%Y-%m-%d', DATE(fecha_ts)) AS fecha,
            vendedor,
            CONCAT(producto_id, ' - ', producto_nombre) AS producto,
            proveedor,
            marca,
            categoria,
            SUM(SAFE_CAST(cantidad_unid AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;

                const params = {
                    empresa,
                    year: filtros.year,
                    mes: filtros.mes
                };

                // --- Filtros dinámicos ---
                if (filtros.vendedores.length) {
                    where += ` AND vendedor IN UNNEST(@vendedores)`;
                    params.vendedores = filtros.vendedores;
                }
                if (filtros.proveedores.length) {
                    where += ` AND proveedor IN UNNEST(@proveedores)`;
                    params.proveedores = filtros.proveedores;
                }
                if (filtros.marcas.length) {
                    where += ` AND marca IN UNNEST(@marcas)`;
                    params.marcas = filtros.marcas;
                }
                if (filtros.categorias.length) {
                    where += ` AND categoria IN UNNEST(@categorias)`;
                    params.categorias = filtros.categorias;
                }
                if (filtros.cliente.length) {
                    where += ` AND CAST(dni AS STRING) IN UNNEST(@clientes)`;
                    params.clientes = filtros.cliente.map(d => String(d));
                }
                if (filtros.producto.length) {
                    where += ` AND producto_id IN UNNEST(@productos)`;
                    params.productos = filtros.producto.map(d => String(d));
                }

                // --- Agrupaciones dinámicas ---
                switch (this.criterioAgrupacion) {
                    case "Vendedor":
                        selectFields = `
            vendedor,
            COUNT(DISTINCT dni) AS puntos_cobertura,
            SUM(SAFE_CAST(cantidad_unid AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY vendedor`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Vendedor", value: "vendedor" },
                            { text: "Cobertura", value: "puntos_cobertura", align: "right" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Cliente":
                        selectFields = `
            CONCAT(CAST(dni AS STRING), ' - ', cliente) AS cliente,
            SUM(SAFE_CAST(cantidad_unid AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY dni, cliente`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Cliente", value: "cliente" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" },
                        ];
                        break;

                    case "Producto":
                        selectFields = `
            CONCAT(producto_id, ' - ', producto_nombre) AS producto,
            SUM(SAFE_CAST(cantidad_unid AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY producto`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Producto", value: "producto" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Marca":
                        selectFields = `
            marca,
            SUM(SAFE_CAST(cantidad_unid  AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY marca`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Marca", value: "marca" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Categoria":
                        selectFields = `
            categoria,
            SUM(SAFE_CAST(cantidad_unid  AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY categoria`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Categoría", value: "categoria" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Dia":
                        selectFields = `
            dia_nombre_es AS dia,
            SUM(SAFE_CAST(cantidad_unid  AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY dia`;
                        orderBy = `
            ORDER BY CASE dia
              WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
              WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6
              WHEN 'Domingo' THEN 7 ELSE 8 END
          `;
                        this.headers = [
                            { text: "Día", value: "dia" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" },
                        ];
                        break;

                    case "Fecha":
                        selectFields = `
            FORMAT_DATE('%Y-%m-%d', DATE(fecha_ts)) AS fecha,
            dia_nombre_es AS dia,
            SUM(SAFE_CAST(cantidad_unid AS NUMERIC)) AS cantidad,
            ROUND(SUM(SAFE_CAST(valor_total AS NUMERIC) + SAFE_CAST(total_impuestos AS NUMERIC)), 2) AS total
          `;
                        groupBy = `GROUP BY fecha, dia`;
                        orderBy = `ORDER BY fecha ASC`;
                        this.headers = [
                            { text: "Fecha", value: "fecha" },
                            { text: "Día", value: "dia" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" },
                        ];
                        break;

                    default:
                        groupBy = `GROUP BY fecha_ts, vendedor, producto, proveedor, marca, categoria`;
                        orderBy = `ORDER BY fecha_ts ASC`;
                        this.headers = [
                            { text: "Fecha", value: "fecha" },
                            { text: "Vendedor", value: "vendedor" },
                            { text: "Producto", value: "producto" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;
                }

                const query = `
            SELECT ${selectFields}
            FROM \`sis-distribucion.firebase.vw_venta_agregada\`
            ${where}
            ${groupBy}
            ${orderBy}
          `;

                const response = await axios.post(
                    "https://consulta-bigquery-6sfc6tum4a-rj.a.run.app",
                    { query, params },
                    { headers: { "Content-Type": "application/json" } }
                );

                this.ventas = response.data.data.map(row => ({
                    ...row,
                    cantidad: Number(row.cantidad) || 0,
                    total: Number(Number(row.total).toFixed(2)),
                }));

                store.commit("dialogoprogress");
            } catch (error) {
                console.error("❌ Error al consultar ventas:", error);
                store.commit("dialogoprogress");
            }
        },

        // --- Métodos auxiliares y de gráfico (se mantienen) ---
        // ... (convertir_vendedor, convertir_stock)
        ejecutaAccionSecundaria(item) {
            // Este método sería para manejar la acción 'Detalle' en móvil si se necesita un diálogo de detalle.
            // Actualmente no está definido en el script original, pero es un placeholder de UX.
            alert(`Acción 'Detalle' para ${this.criterioAgrupacion}: ${item[Object.keys(item)[0]]}`);
        },
        exportToExcel() {
            if (this.ventas.length === 0) {
                alert("No hay datos para exportar.");
                return;
            }

            const ventasLimpias = this.ventas.map(row => {
                return Object.fromEntries(
                    Object.entries(row).filter(([_, value]) => value !== "" && value !== null)
                );
            });

            const worksheet = XLSX.utils.json_to_sheet(ventasLimpias);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
            XLSX.writeFile(workbook, `Reporte_Ventas.xlsx`);
        },
        mostrarGrafico() {
            this.dialogGrafico = true;
            this.$nextTick(() => {
                setTimeout(() => {
                    this.dibujarGrafico();
                }, 400);
            });
        },
        actualizarGrafico() {
            this.$nextTick(() => {
                this.dibujarGrafico();
            });
        },
        dibujarGrafico() {
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            const ctx = this.$refs.chartCanvas.getContext("2d");

            const colores = [
                "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40",
                "#e91e63", "#8bc34a", "#795548", "#00bcd4", "#cddc39", "#ff5722"
            ];

            const etiquetas = this.ventas.map(v => v[this.criterioAgrupacion.toLowerCase()]);
            const datos = this.ventas.map(v => v.total);
            const backgroundColors = etiquetas.map((_, index) => colores[index % colores.length]);

            this.chartInstance = new Chart(ctx, {
                type: this.tipoGrafico,
                data: {
                    labels: etiquetas,
                    datasets: [{
                        label: `Ventas por ${this.criterioAgrupacion}`,
                        data: datos,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "top" },
                    },
                    scales: this.tipoGrafico === "line" || this.tipoGrafico === "bar" ? { y: { beginAtZero: true } } : {}
                }
            });
        }
    }
};
</script>

<style scoped>
/* Estilos adicionales para la vista móvil */
.v-list-item__action {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}

.primary--text {
    /* Asegura que el texto primario de la lista tenga buen contraste */
    color: #1a237e !important;
}

.v-card__actions .v-btn {
    padding: 0 8px !important;
    min-width: 0 !important;
    height: 24px !important;
    font-size: 0.65rem;
}
</style>