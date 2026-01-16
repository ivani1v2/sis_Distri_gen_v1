<template>
    <v-dialog v-model="dialogoAlerta" max-width="1000px" persistent :fullscreen="false">
        <v-card>
            <v-system-bar dark color="grey darken-3" class="px-2">
                <v-icon small class="mr-1">mdi-alert-circle-outline</v-icon>
                <span class="text-caption font-weight-medium">ALERTA - STOCK MÍNIMO</span>
                <v-spacer></v-spacer>
                <v-btn icon @click="exportarExcel" title="Exportar Excel" class="mx-1">
                    <v-icon color="green lighten-2">mdi-microsoft-excel</v-icon>
                </v-btn>
                <v-btn icon @click="exportarPDF" :loading="generandoPDF" title="Exportar PDF" class="mx-1">
                    <v-icon color="red lighten-2">mdi-file-pdf-box</v-icon>
                </v-btn>
                <v-btn icon @click="dialogoAlerta = false" class="ml-1">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-system-bar>
            <v-card-text class="pa-2 pa-sm-3">
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="buscar"
                            :placeholder="$vuetify.breakpoint.smAndDown ? 'Buscar...' : 'Buscar producto'"
                            outlined dense
                            hide-details
                            :prepend-inner-icon="$vuetify.breakpoint.smAndDown ? 'mdi-magnify' : null"
                            :append-icon="$vuetify.breakpoint.smAndDown ? null : 'mdi-magnify'"
                            clearable
                            class="mb-sm-0 mb-1"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select
                            v-model="categoriaFiltro"
                            :items="listaCategorias"
                            :placeholder="$vuetify.breakpoint.smAndDown ? 'Categoría' : 'Filtrar por categoría'"
                            outlined dense
                            hide-details
                            clearable
                            :prepend-inner-icon="$vuetify.breakpoint.smAndDown ? 'mdi-filter' : null"
                        ></v-select>
                    </v-col>
                </v-row>

                <div class="d-flex align-center mt-1 mt-sm-2">
                    <v-chip small color="grey darken-2" text-color="white" class="mr-1">
                        {{ productosFiltrados.length }}
                    </v-chip>
                    <span class="text-caption grey--text">
                        productos bajo mínimo
                    </span>
                    <v-spacer></v-spacer>
                    <v-chip v-if="productosSinStock > 0" small color="red" text-color="white">
                        {{ productosSinStock }} sin stock
                    </v-chip>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-text class="pa-0" :style="contentStyle">
                <template v-if="!cargando && productosFiltrados.length > 0">
                    <div v-if="$vuetify.breakpoint.smAndDown" class="pa-2">
                        <div v-for="producto in productosFiltrados" :key="producto.id" 
                             class="mb-2 pa-3 rounded-lg elevation-1"
                             :class="getCardClass(producto)">
                            <div class="d-flex justify-space-between align-center mb-1">
                                <span class="text-caption grey--text font-weight-medium">
                                    {{ producto.id }}
                                </span>
                                <v-chip small :color="getChipColor(producto)" dark>
                                    {{ producto.categoria }}
                                </v-chip>
                            </div>

                            <div class="text-body-2 mb-2 text-truncate">
                                {{ producto.nombre }}
                            </div>
                            

                            <div class="d-flex justify-space-between align-center">
                                <div class="text-center">
                                    <div class="text-caption grey--text">Medida</div>
                                    <div class="font-weight-medium">
                                        {{ producto.medida }}
                                    </div>
                                </div>
                                <div class="text-center">
                                    <div class="text-caption grey--text">Stock</div>
                                    <div class="font-weight-bold " :class="getStockClass(producto)">
                                        {{ formatoStockMobile(producto.stock, producto.factor) }}
                                    </div>
                                </div>
                                
                                <div class="text-center">
                                    <div class="text-caption grey--text">Mínimo</div>
                                    <div class="font-weight-medium">
                                        {{ formatoStockMobile(producto.stock_minimo, producto.factor) }}
                                    </div>
                                </div>
                                
                                <div class="text-center">
                                    <div class="text-caption grey--text">Difer.</div>
                                    <div class="font-weight-bold" :class="getDiferenciaClass(producto)">
                                        {{ formatoDiferencia(producto) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <v-data-table
                        v-else
                        :headers="headers"
                        :items="productosFiltrados"
                        :search="buscar"
                        dense
                        :items-per-page="10"
                        class="elevation-0"
                        hide-default-footer
                    >
                        <template v-slot:item="{ item }">
                            <tr :class="getRowClass(item)">
                                <td class="text-caption">{{ item.id }}</td>
                                <td class="text-caption">{{ item.categoria }}</td>
                                <td class="text-body-2">{{ item.nombre }}</td>
                                <td class="text-body-2">{{ item.medida }}</td>
                                <td class="text-center">
                                    <span :class="getStockClass(item)">
                                        {{ formatoStock(item.stock, item.factor) }}
                                    </span>
                                </td>
                                <td class="text-center">{{ formatoStock(item.stock_minimo, item.factor) }}</td>
                                <td class="text-center">
                                    <span :class="getDiferenciaClass(item)">
                                        {{ formatoDiferencia(item) }}
                                    </span>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </template>
                <template v-if="cargando">
                    <div class="text-center py-8">
                        <v-progress-circular indeterminate color="grey" size="32"></v-progress-circular>
                        <p class="mt-3 text-caption grey--text">Cargando productos...</p>
                    </div>
                </template>
                <template v-if="!cargando && productosFiltrados.length === 0">
                    <div class="text-center py-8">
                        <v-icon color="green" size="48">mdi-check-circle</v-icon>
                        <p class="title green--text mt-2">¡Excelente!</p>
                        <p class="text-caption grey--text">Todos los productos tienen stock suficiente</p>
                    </div>
                </template>
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions class="pa-3">
                <v-spacer></v-spacer>
                <v-btn color="grey darken-2" dark @click="dialogoAlerta = false" class="px-4">
                    <v-icon left>mdi-close</v-icon>
                    Cerrar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { allProductos } from '@/db'
import XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default {
    name: 'DialAlertaStockMinimo',
    
    props: {
        value: { type: Boolean, default: false }
    },
    
    data: () => ({
        dialogoAlerta: false,
        cargando: false,
        generandoPDF: false,
        buscar: '',
        categoriaFiltro: null,
        productos: [],
        headers: [
            { text: 'ID', value: 'id', width: 60 },
            { text: 'Categoría', value: 'categoria', width: 100 },
            { text: 'Producto', value: 'nombre', width : 300},
            { text: 'Medida', value: 'medida', align: 'center', width: 80 },
            { text: 'Stock', value: 'stock', align: 'center', width: 80 },
            { text: 'Mínimo', value: 'stock_minimo', align: 'center', width: 80 },
            { text: 'Difer.', value: 'diferencia', align: 'center', width: 70 }
        ]
    }),
    
    computed: {
        productosAlertados() {
            if (!this.productos || this.productos.length === 0) return []
            
            return this.productos.filter(p => {
                if (!p) return false
                if (p.activo === false) return false
                if (p.controstock === false) return false
                
                const stock = Number(p.stock) || 0
                const minimo = Number(p.stock_minimo) || 0
                return minimo > 0 && stock < minimo
            })
        },
        
        productosFiltrados() {
            let filtrados = this.productosAlertados
            if (this.categoriaFiltro) {
                filtrados = filtrados.filter(p => p.categoria === this.categoriaFiltro)
            }
            if (this.buscar) {
                const busqueda = this.buscar.toLowerCase()
                filtrados = filtrados.filter(p => 
                    (p.id && p.id.toLowerCase().includes(busqueda)) ||
                    (p.nombre && p.nombre.toLowerCase().includes(busqueda))
                )
            }
            return filtrados
        },
        
        listaCategorias() {
            if (!this.productosAlertados || this.productosAlertados.length === 0) return []
            const cats = this.productosAlertados
                .map(p => p.categoria)
                .filter(c => c && c.trim() !== '')
            return [...new Set(cats)].sort()
        },

        productosSinStock() {
            return this.productosAlertados.filter(p => Number(p.stock) === 0).length
        },

        contentStyle() {
            if (this.$vuetify.breakpoint.smAndDown) {
                return {
                    'max-height': 'calc(70vh - 140px)',
                    'overflow-y': 'auto',
                    'min-height': '200px'
                }
            } else {
                return {
                    'max-height': '400px',
                    'overflow-y': 'auto',
                    'min-height': '200px'
                }
            }
        }
    },
    
    watch: {
        value: {
            immediate: true,
            handler(val) {
                this.dialogoAlerta = val
                if (val) {
                    this.cargarProductos()
                }
            }
        },
        dialogoAlerta(val) {
            this.$emit('input', val)
        }
    },
    
    methods: {
        async cargarProductos() {
            this.cargando = true
            this.productos = []
            try {
                const snap = await allProductos().once('value')
                const arr = []
                snap.forEach(child => {
                    const prod = child.val()
                    if (prod) {
                        arr.push({ ...prod, key: child.key })
                    }
                })
                this.productos = arr
            } catch (e) {
                console.error('Error cargando productos:', e)
            } finally {
                this.cargando = false
            }
        },
        
        formatoStock(stock, factor = 1) {
            const s = Number(stock) || 0
            const f = Number(factor) || 1
            if (f <= 1) return s.toString()
            const cajas = Math.floor(s / f)
            const und = s - (cajas * f)
            return und > 0 ? `${cajas}/${und}` : `${cajas}/0`
        },
        
        formatoStockMobile(stock, factor = 1) {
            const s = Number(stock) || 0
            const f = Number(factor) || 1
            if (f <= 1) return s.toString()
            const cajas = Math.floor(s / f)
            const und = s - (cajas * f)
            return und > 0 ? `${cajas}/${und}` : `${cajas}/0`
        },
    
        calcularDiferencia(item) {
            return (Number(item.stock) || 0) - (Number(item.stock_minimo) || 0)
        },
        
        formatoDiferencia(item) {
            const dif = this.calcularDiferencia(item);
            const f = Number(item.factor) || 1;
            if (f <= 1) return dif.toString();
            const signo = dif < 0 ? '-' : '';
            const difAbs = Math.abs(dif);
            const cajas = Math.floor(difAbs / f);
            const und = difAbs - (cajas * f);
            return und > 0 ? `${signo}${cajas}/${und}` : `${signo}${cajas}/0`;
        },
        
        getCardClass(producto) {
            const stock = Number(producto.stock) || 0
            if (stock === 0) return 'red lighten-5'
            if (stock < (Number(producto.stock_minimo) || 0)) return 'orange lighten-5'
            return 'grey lighten-4'
        },
        
        getRowClass(producto) {
            const stock = Number(producto.stock) || 0
            if (stock === 0) return 'red lighten-5'
            if (stock < (Number(producto.stock_minimo) || 0)) return 'orange lighten-5'
            return ''
        },
        
        getChipColor(producto) {
            const stock = Number(producto.stock) || 0
            if (stock === 0) return 'red'
            if (stock < (Number(producto.stock_minimo) || 0)) return 'orange'
            return 'blue-grey'
        },
        
        getStockClass(producto) {
            const stock = Number(producto.stock) || 0
            if (stock === 0) return 'red--text font-weight-bold'
            if (stock < (Number(producto.stock_minimo) || 0)) return 'orange--text font-weight-bold'
            return 'green--text'
        },
        
        getDiferenciaClass(producto) {
            const dif = this.calcularDiferencia(producto)
            if (dif >= 0) return 'green--text'
            if (dif > -5) return 'orange--text'
            return 'red--text font-weight-bold'
        },
        
        exportarExcel() {
            const data = this.productosFiltrados.map(p => ({
                ID: p.id,
                Categoría: p.categoria,
                Producto: p.nombre,
                Medida: p.medida || '',
                'Stock Actual': this.formatoStock(p.stock, p.factor),
                'Stock Mínimo': this.formatoStock(p.stock_minimo, p.factor),
                Diferencia: this.formatoDiferencia(p)
            }))
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(data)
            ws['!cols'] =[
                {wch: 3},
                {wch: 15},
                {wch: 50},
                {wch: 15},
                {wch: 15},
                {wch: 15},
                {wch: 15}
                
            ]
            XLSX.utils.book_append_sheet(wb, ws, 'Stock Mínimo')
            XLSX.writeFile(wb, `alerta_stock_${new Date().toISOString().split('T')[0]}.xlsx`)
        },
        
        async exportarPDF() {
            this.generandoPDF = true
            try {
                const doc = new jsPDF('landscape')
                doc.setFontSize(14)
                doc.text('ALERTA DE STOCK MÍNIMO', 15, 15)
                doc.setFontSize(9)
                doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 22)
                doc.text(`Total: ${this.productosFiltrados.length} productos`, 15, 28)
                
                const datos = this.productosFiltrados.map(p => [
                    p.id, p.categoria, p.nombre.substring(0, 35), p.medida || '',
                    this.formatoStock(p.stock, p.factor), 
                    this.formatoStock(p.stock_minimo, p.factor), 
                    this.formatoDiferencia(p)
                ])
                
                doc.autoTable({
                    startY: 35,
                    head: [['ID', 'Categoría', 'Producto', 'Medida', 'Stock', 'Mínimo', 'Diferencia']],
                    body: datos,
                    theme: 'striped',
                    headStyles: { fillColor: [80, 80, 80] },
                    styles: { fontSize: 8 }
                })
                
                doc.save(`alerta_stock_${new Date().toISOString().split('T')[0]}.pdf`)
            } catch (e) {
                console.error(e)
            } finally {
                this.generandoPDF = false
            }
        }
    }
}
</script>

<style scoped>
.rounded-lg {
    border-radius: 8px;
}

.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.v-card {
    overflow: hidden !important;
}

@media (max-width: 600px) {
    .v-btn {
        min-width: 40px !important;
        min-height: 40px !important;
    }
    
    .v-card {
        margin: 10px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
    }
    
    .v-card__text {
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }
    
    .v-card__text > div:first-child {
        height: 100%;
        overflow-y: auto;
    }
    
    .v-chip {
        height: 24px !important;
        font-size: 0.75rem !important;
    }
    .v-card__actions {
        flex: none;
        padding: 12px !important;
    }
}
</style>