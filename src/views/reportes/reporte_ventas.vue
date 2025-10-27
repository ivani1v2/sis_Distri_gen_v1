<template>
    <div>
        <v-card class="pa-3 mx-2">

            <v-row>
                <v-col cols="12" md="2">
                    <v-card-title class="mt-n6">📊 Consultar</v-card-title>
                </v-col>

                <!-- Año -->
                <v-col cols="12" md="4" v-if="false">
                    <v-select dense v-model="reporte" :items="array_reporte" label="Reporte" outlined></v-select>
                </v-col>
                <v-col cols="12" md="2">
                    <v-select dense v-model="filtros.year" :items="years" label="Año" outlined></v-select>
                </v-col>
                <!-- Mes -->
                <v-col cols="12" md="2">
                    <v-select dense v-model="filtros.mes" :items="meses" label="Mes" outlined></v-select>
                </v-col>

                <v-col cols="12" md="2">
                    <v-btn small color="primary" class="mt-1" @click="consultarVentas">
                        🔍 Consultar
                    </v-btn>
                </v-col>
            </v-row>

            <v-row class="mt-n8">
                <!-- Proveedor -->
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.proveedores" :items="proveedores" label="Proveedores"
                        outlined clearable multiple chips item-text="nombre" item-value="nombre"></v-autocomplete>
                </v-col>

                <!-- Marca -->
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.marcas" :items="marcas" label="Marcas" outlined clearable
                        multiple chips item-text="nombre" item-value="nombre"></v-autocomplete>
                </v-col>

                <!-- Categoria -->
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.categorias" :items="categorias" label="Categorias" outlined
                        clearable multiple chips item-text="nombre" item-value="nombre"></v-autocomplete>
                </v-col>

                <!-- Vendedor -->
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.vendedores" :items="$store.state.array_sedes" label="Vendedores" outlined
                        clearable multiple chips item-text="nombre" item-value="codigo"></v-autocomplete>
                </v-col>
            </v-row>
            <v-row class="mt-n8">
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.cliente" :items="clientesConFormato" label="Cliente" outlined
                        clearable multiple chips item-text="displayCliente" item-value="documento">
                    </v-autocomplete>

                </v-col>
                <v-col cols="12" md="3">
                    <v-autocomplete dense v-model="filtros.producto" :items="productosConFormato" label="Producto"
                        outlined clearable multiple chips item-text="displayProducto" item-value="id">
                    </v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                    <v-select dense v-model="criterioAgrupacion" :items="criterios" label="Agrupar por"
                        outlined></v-select>
                </v-col>
            </v-row>
            <!-- Tabla de Resultados -->
            <v-data-table v-if="ventas.length" :headers="headers" :items="ventas" class="mt-5" dense>
                <template v-slot:body.append>
                    <tr class="font-weight-bold">
                        <td colspan="dynamicColSpan" class="text-right">Total General:</td>
                        <td class="text-right" v-if="puntos_cobertura != 0">
                            <span v-if="criterioAgrupacion !== 'Proveedor'">{{ puntos_cobertura }}</span>
                        </td>
                        <!-- Cantidad solo si no es agrupación por Vendedor -->
                        <td class="text-right">
                            <span v-if="criterioAgrupacion !== 'Vendedor' && criterioAgrupacion !== 'Proveedor'">{{
                                totalCantidad }}</span>
                        </td>
                        <td class="text-right">S/ {{ totalVentas }}</td>
                    </tr>
                </template>

                <template v-slot:footer.prepend>
                    <v-row>
                        <v-col cols="6">
                            <v-btn small color="success" class="mx-2" @click="exportToExcel">
                                <v-icon left>mdi-microsoft-excel</v-icon>
                                Excel
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn v-if="criterioAgrupacion
                                !== 'Ninguno' && criterioAgrupacion
                                !== 'Cliente'" small color="info" class="mt-1" @click="mostrarGrafico">
                                📊 Ver Gráfico
                            </v-btn>
                        </v-col>
                    </v-row>

                </template>
            </v-data-table>
        </v-card>
        <!-- 🔹 DIÁLOGO PARA EL GRÁFICO -->
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
import Chart from "chart.js/auto"; // 📊 Importamos Chart.js para gráficos
import { allCategorias } from "../../db";
import axios from "axios";
import store from "@/store/index";
import * as XLSX from "xlsx";

export default {
    data() {
        return {
            dialogGrafico: false,
            chartInstance: null, // 📊 Variable para almacenar la instancia del gráfico
            tipoGrafico: "doughnut",  // 📌 Valor por defecto en español
            tiposGraficos: [
                { text: "Barra", value: "bar" },
                { text: "Dona", value: "doughnut" },
                { text: "Pastel", value: "pie" },
                { text: "Línea", value: "line" }
            ],
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
                { text: "Enero", value: 1 },
                { text: "Febrero", value: 2 },
                { text: "Marzo", value: 3 },
                { text: "Abril", value: 4 },
                { text: "Mayo", value: 5 },
                { text: "Junio", value: 6 },
                { text: "Julio", value: 7 },
                { text: "Agosto", value: 8 },
                { text: "Septiembre", value: 9 },
                { text: "Octubre", value: 10 },
                { text: "Noviembre", value: 11 },
                { text: "Diciembre", value: 12 },
            ],
            proveedores: [],
            marcas: [],
            categorias: [],
            vendedores: [],
            ventas: [],
            headers: [],
            array_reporte: ['PRODUCTOS X VENDEDOR'],
            reporte: 'PRODUCTOS X VENDEDOR',
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
            return this.headers.length - 2; // Asegura que los totales estén alineados
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
        async consultarVentas() {
            try {
                store.commit("dialogoprogress");
                const filtros = this.filtros;

                // --- Condiciones base ---
                let where = `
      WHERE cab.estado != 'ANULADO'
      AND det.operacion != 'GRATUITA'
      AND EXTRACT(YEAR FROM cab.fecha_ts) = @year
      AND EXTRACT(MONTH FROM cab.fecha_ts) = @mes
    `;

                let groupBy = ``;
                let orderBy = `ORDER BY total DESC`;

                // --- Campos base (modo Ninguno) ---
                let selectFields = `
      FORMAT_DATE('%Y-%m-%d', DATE(cab.fecha_ts)) AS fecha,
      cab.vendedor,
      CONCAT(det.producto_id, ' - ', det.nombre) AS producto,
      prod.proveedor,
      prod.marca,
      prod.categoria,
      SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
      ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
    `;

                const params = { year: filtros.year, mes: filtros.mes };

                // --- Filtros dinámicos ---
                if (filtros.vendedores.length) {
                    where += ` AND cab.vendedor IN UNNEST(@vendedores)`;
                    params.vendedores = filtros.vendedores;
                }
                if (filtros.proveedores.length) {
                    where += ` AND prod.proveedor IN UNNEST(@proveedores)`;
                    params.proveedores = filtros.proveedores;
                }
                if (filtros.marcas.length) {
                    where += ` AND prod.marca IN UNNEST(@marcas)`;
                    params.marcas = filtros.marcas;
                }
                if (filtros.categorias.length) {
                    where += ` AND prod.categoria IN UNNEST(@categorias)`;
                    params.categorias = filtros.categorias;
                }
                if (filtros.cliente.length) {
                    where += ` AND CAST(cab.dni AS STRING) IN UNNEST(@clientes)`;
                    params.clientes = filtros.cliente.map(d => String(d));
                }
                if (filtros.producto.length) {
                    where += ` AND det.producto_id IN UNNEST(@productos)`;
                    params.productos = filtros.producto.map(d => String(d));
                }

                // --- Agrupaciones dinámicas ---
                switch (this.criterioAgrupacion) {
                    case "Vendedor":
                        selectFields = `
          cab.vendedor,
          COUNT(DISTINCT cab.dni) AS puntos_cobertura,
          SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
          ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
        `;
                        groupBy = `GROUP BY cab.vendedor`;
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
      CONCAT(CAST(cab.dni AS STRING), ' - ', cab.cliente) AS cliente,
      SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
      ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
    `;
                        groupBy = `GROUP BY cab.dni, cab.cliente`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Cliente", value: "cliente" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" },
                        ];
                        break;

                    case "Producto":
                        selectFields = `
          CONCAT(det.producto_id, ' - ', det.nombre) AS producto,
          SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
          ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
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
          prod.marca,
          SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
          ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
        `;
                        groupBy = `GROUP BY prod.marca`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Marca", value: "marca" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Categoria":
                        selectFields = `
          prod.categoria,
          SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
          ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
        `;
                        groupBy = `GROUP BY prod.categoria`;
                        orderBy = `ORDER BY total DESC`;
                        this.headers = [
                            { text: "Categoría", value: "categoria" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;

                    case "Dia":
                        selectFields = `
    FORMAT_DATE('%A', DATE(cab.fecha_ts)) AS dia,
    SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
    ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
  `;
                        groupBy = `GROUP BY dia`;
                        orderBy = `
    ORDER BY CASE dia
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7 ELSE 8 END
  `;
                        this.headers = [
                            { text: "Día", value: "dia" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" },
                        ];
                        break;


                    case "Fecha":
                        selectFields = `
    FORMAT_DATE('%Y-%m-%d', DATE(cab.fecha_ts)) AS fecha,
    FORMAT_DATE('%A', DATE(cab.fecha_ts)) AS dia,
    SUM(SAFE_CAST(det.cantidad AS NUMERIC)) AS cantidad,
    ROUND(SUM(SAFE_CAST(det.valor_total AS NUMERIC) + SAFE_CAST(det.total_impuestos AS NUMERIC)), 2) AS total
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
                        // ✅ Caso sin agrupación explícita
                        groupBy = `GROUP BY cab.fecha_ts, cab.vendedor, producto, prod.proveedor, prod.marca, prod.categoria`;
                        orderBy = `ORDER BY cab.fecha_ts ASC`;
                        this.headers = [
                            { text: "Fecha", value: "fecha" },
                            { text: "Vendedor", value: "vendedor" },
                            { text: "Producto", value: "producto" },
                            { text: "Cantidad", value: "cantidad", align: "right" },
                            { text: "Total (S/)", value: "total", align: "right" }
                        ];
                        break;
                }

                // --- Consulta final ---
                const query = `
      SELECT ${selectFields}
      FROM \`sis-distribucion.firebase.detalle_comprobantes\` AS det
      JOIN \`sis-distribucion.firebase.cabecera\` AS cab
        ON cab.id_empresa = det.id_empresa
       AND cab.numeracion = det.numeracion
      LEFT JOIN \`sis-distribucion.firebase.productos\` AS prod
        ON prod.id_empresa = det.id_empresa
       AND prod.id = det.producto_id
      ${where}
      ${groupBy}
      ${orderBy}
    `;

                const response = await axios.post(
                    "http://localhost:5000/sis-distribucion/southamerica-east1/consulta_bigquery",
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

        convertir_vendedor(id) {

            var vend = this.vendedores.find(e => e.codigo == id)
            console.log(vend)
            return vend.displayText
        },
        convertir_stock(producto, cantidad) {
            console.log(producto.substring(0, 4).toUpperCase(), cantidad);

            // Buscar el producto en el store
            var prod = store.state.productos.find(e => e.id == producto.substring(0, 4).toUpperCase());

            if (!prod) {
                console.warn("Producto no encontrado en el store:", producto.substring(0, 4).toUpperCase());
                return "N/A"; // Devuelve "N/A" si no encuentra el producto
            }

            // Extraer el factor del producto
            var factor = prod.factor || 1; // Si no tiene factor, asumimos 1
            var cajas = Math.floor(cantidad / factor);
            var und = cantidad - cajas * factor;

            return `${cajas}/${und}`;
        },
        traducir(dia) {
            const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

            const dias = {
                "Monday": "Lunes",
                "Tuesday": "Martes",
                "Wednesday": "Miércoles",
                "Thursday": "Jueves",
                "Friday": "Viernes",
                "Saturday": "Sábado",
                "Sunday": "Domingo"
            };

            if (!isNaN(dia)) {
                // Si es número, usa el array de días (0 = Domingo, 6 = Sábado)
                return diasSemana[dia] || "";
            } else {
                // Si es string en inglés, usa el objeto de traducción
                return dias[dia] || dia; // Si no lo encuentra, devuelve el mismo valor
            }
        },
        exportToExcel() {
            if (this.ventas.length === 0) {
                alert("No hay datos para exportar.");
                return;
            }

            // 📌 Filtra y elimina los campos vacíos o null de cada fila antes de exportar
            const ventasLimpias = this.ventas.map(row => {
                return Object.fromEntries(
                    Object.entries(row).filter(([_, value]) => value !== "" && value !== null)
                );
            });

            // Crea una hoja de Excel a partir de los datos filtrados
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
                    scales: this.tipoGrafico === "line" ? { y: { beginAtZero: true } } : {}
                }
            });
        }
    }


};
</script>
