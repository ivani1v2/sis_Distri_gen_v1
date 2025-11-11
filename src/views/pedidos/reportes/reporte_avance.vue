<template>
    <v-dialog v-model="dial" scrollable max-width="1200px" persistent>
        <v-card>
            <!-- Barra superior -->
            <v-system-bar window dark>
                <v-icon @click="cerrar()" color="red" large>mdi-close</v-icon>
                <v-spacer></v-spacer>
                Reporte
                <v-spacer></v-spacer>
                <v-icon @click="exportarCSV('productos', rowsProductos)" left small>mdi-download</v-icon> CSV
            </v-system-bar>

            <v-card-text class="pt-4">

                <v-row dense>
                    <v-col cols="6" xs="6">
                        <v-select v-model="vendSel" :items="itemsVendedores" item-text="label" item-value="value" dense
                            outlined hide-details class="mr-2" style="max-width: 260px" label="Filtrar por vendedor"
                            clearable />
                    </v-col>
                    <v-col cols="6" xs="6">
                        <v-text-field dense v-model="search" solo-inverted flat hide-details clearable
                            prepend-inner-icon="mdi-magnify" label="Buscar producto" class="mr-2"
                            style="max-width: 320px" />
                    </v-col>
                </v-row>

                <!-- Buscar -->

                <v-card outlined>
                    <v-card-title class="py-2">

                        <v-spacer></v-spacer>
                        <div class="caption grey--text">
                            Unidades: <strong>{{ fmtInt(kpi.unidades) }}</strong> &nbsp;·&nbsp;
                            Total: <strong>S/{{ n2(kpi.totalSoles) }}</strong> &nbsp;·&nbsp;
                            Utilidad: <strong>S/{{ n2(kpi.utilidadTotal) }}</strong>
                        </div>
                    </v-card-title>
                    <div v-if="isMobile" class="px-3 pb-2">
                        <v-row dense>
                            <v-col cols="8">
                                <v-select v-model="sortBy" :items="sortOptions" dense outlined hide-details
                                    label="Ordenar por" />
                            </v-col>
                            <v-col cols="4" class="d-flex align-center">
                                <v-btn block outlined small @click="sortDesc = !sortDesc">
                                    <v-icon left small>{{ sortDesc ? 'mdi-sort-descending' : 'mdi-sort-ascending'
                                    }}</v-icon>
                                    {{ sortDesc ? 'Desc' : 'Asc' }}
                                </v-btn>
                            </v-col>
                        </v-row>
                    </div>
                    <v-data-table v-if="!isMobile" :headers="headersProductos" :items="rowsProductos" :search="search"
                        dense :items-per-page="10" class="elevation-1">
                        <template v-slot:item.unidades="{ item }">
                            {{ item.unidadesFmt || fmtInt(item.unidades) }}
                        </template>
                        <template v-slot:item.costoTotal="{ item }">S/{{ n2(item.costoTotal) }}</template>
                        <template v-slot:item.totalSoles="{ item }">S/{{ n2(item.totalSoles) }}</template>
                        <template v-slot:item.utilidad="{ item }">
                            <span :class="item.utilidad >= 0 ? 'green--text' : 'red--text'">S/{{ n2(item.utilidad)
                                }}</span>
                        </template>
                        <template v-slot:item.margenPct="{ item }">{{ n2(item.margenPct) }}%</template>
                    </v-data-table>
                    <div v-else class="px-2">
                        <v-card v-for="it in mobileRows" :key="it.id" class="mb-2" outlined>
                            <v-list-item three-line>
                                <v-list-item-content>
                                    <div class="caption grey--text">ID {{ it.id }}</div>
                                    <v-list-item-title class="font-weight-medium">{{ it.nombre }}</v-list-item-title>
                                    <div class="caption">Medida: {{ it.medida }}</div>
                                </v-list-item-content>
                                <v-list-item-action class="text-right">
                                    <div class="subtitle-2">S/{{ n2(it.totalSoles) }}</div>
                                    <div :class="it.utilidad >= 0 ? 'green--text caption' : 'red--text caption'">
                                        Util: S/{{ n2(it.utilidad) }}
                                    </div>
                                </v-list-item-action>
                            </v-list-item>
                            <v-divider />
                            <v-card-text class="py-2">
                                <v-chip x-small class="ma-1" label>
                                    Cant: {{ it.unidadesFmt || fmtInt(it.unidades) }}
                                </v-chip>
                                <v-chip x-small class="ma-1" label>Costo: S/{{ n2(it.costoTotal) }}</v-chip>
                                <v-chip x-small class="ma-1" label
                                    :class="it.utilidad >= 0 ? 'green lighten-5' : 'red lighten-5'">
                                    Margen: {{ n2(it.margenPct) }}%
                                </v-chip>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-card>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: 'ReporteProductos',
    props: {
        value: { type: Boolean, default: false },        // para abrir/cerrar desde el padre
        data: { type: Array, default: () => [] },      // [{ cabecera:{...}, detalle:[...] }, ...]
    },
    data() {
        return {
            dial: false,
            search: '',
            vendSel: null, // código de vendedor seleccionado (o null para TODOS)
            sortBy: 'totalSoles', // móvil
            sortDesc: true,       // móvil
        };
    },
    watch: {
        value: { immediate: true, handler(v) { this.dial = !!v; } },
        dial(v) { this.$emit('input', v); },
    },
    created() {
        console.log('data', this.data);
        if (this.value === false) this.dial = true; // abre por defecto si no se controla externamente
    },
    computed: {
        isMobile() { return this.$vuetify?.breakpoint?.smAndDown; },

        // Lista única de vendedores
        itemsVendedores() {
            const set = new Set();
            const pedidos = Array.isArray(this.data) ? this.data : [];
            for (const p of pedidos) {
                const cab = p?.cabecera || {};
                const esAnulado = (String(cab.estado || '').toLowerCase() === 'anulado') || !!cab.anulado;
                if (esAnulado) continue; // ⬅️ ignora anulados
                if (cab.cod_vendedor) set.add(cab.cod_vendedor);
            }
            const arr = Array.from(set).sort();
            return [{ label: 'Todos', value: null }].concat(arr.map(v => ({ label: v, value: v })));
        },

        // Detalle aplanado con metadatos (para agrupar)
        detallesFlat() {
            const out = [];
            const pedidos = Array.isArray(this.data) ? this.data : [];
            for (let i = 0; i < pedidos.length; i++) {
                const cab = pedidos[i]?.cabecera || {};
                const det = Array.isArray(pedidos[i]?.detalle) ? pedidos[i].detalle : [];
                const esAnulado = (String(cab.estado || '').toLowerCase() === 'anulado') || !!cab.anulado;
                if (esAnulado) continue; // ⬅️ ignora pedidos anulados

                for (let j = 0; j < det.length; j++) {
                    const it = det[j] || {};
                    out.push({
                        vendedor: cab.cod_vendedor || '',
                        idProd: it.id,
                        nombre: it.nombre,
                        factor: it.factor,
                        medida: it.medida,
                        cantidad: Number(it.cantidad || 0),
                        totalLinea: Number(
                            it.totalLinea != null ? it.totalLinea : (Number(it.precio || 0) * Number(it.cantidad || 0))
                        ),
                    });
                }
            }
            return out;
        },


        // Aplica filtro por vendedor (si se selecciona)
        detallesFiltrados() {
            if (!this.vendSel) return this.detallesFlat;
            return this.detallesFlat.filter(l => l.vendedor === this.vendSel);
        },

        // Agrupado por producto
        rowsProductos() {
            const map = new Map();
            for (const l of this.detallesFiltrados) {

                const key = String(l.idProd);
                const prod = this.$store.state.productos.find(p => p.id == l.idProd) || {};
                const costoBase = Number(prod.costo || 0);

                const obj = map.get(key) || {
                    id: l.idProd,
                    nombre: l.nombre || '',
                    medida: l.medida || '',
                    unidades: 0,
                    totalSoles: 0,
                    costoUnit: costoBase,   // ← ahora guarda el costo base por unidad
                    costoTotal: 0,
                    utilidad: 0,
                    margenPct: 0,
                    cantPorMedida: {},      // ← NUEVO
                    unidadesFmt: ''         // ← NUEVO
                };
                const cant = Number(l.cantidad || 0);
                const totalLinea = Number(l.totalLinea || 0);
                const unidadesEq = cant * (l.medida !== 'UNIDAD' ? Number(l.factor || 1) : 1);
                obj.unidades += cant;
                obj.totalSoles += totalLinea;
                obj.cantPorMedida[l.medida || ''] = (obj.cantPorMedida[l.medida || ''] || 0) + cant;
                obj.costoTotal += costoBase * unidadesEq;
                map.set(key, obj);
            }

            // calcula costo total, utilidad y margen
            for (const v of map.values()) {
                v.utilidad = v.totalSoles - v.costoTotal;
                v.margenPct = v.totalSoles > 0 ? (v.utilidad / v.totalSoles) * 100 : 0;

                const cCaja = Number(v.cantPorMedida['CAJA'] || 0);
                const cUni = Number(v.cantPorMedida['UNIDAD'] || 0);

                if (cCaja > 0 && cUni > 0) {
                    v.unidadesFmt = `${cCaja}/${cUni}`;
                } else if (cCaja > 0) {
                    v.unidadesFmt = `${cCaja}`;
                } else if (cUni > 0) {
                    v.unidadesFmt = `${cUni}`;
                } else {
                    // No hubo CAJA ni UNIDAD: usar las medidas reales (DISPLAY, PAQUETE, SACO, etc.)
                    const keys = Object.keys(v.cantPorMedida).filter(k => (v.cantPorMedida[k] || 0) > 0);

                    if (keys.length === 1) {
                        // Una sola medida → solo el número (si factor=1 también caerá aquí sin "0/1")
                        v.unidadesFmt = `${v.cantPorMedida[keys[0]]}`;
                    } else if (keys.length > 1) {
                        // Varias medidas no estándar → "n1 + n2 + ..."
                        v.unidadesFmt = keys.map(k => `${v.cantPorMedida[k]}`).join(' + ');
                        // Si prefieres mostrar etiqueta corta: `${v.cantPorMedida[k]}${k.slice(0,1)}`
                    } else {
                        v.unidadesFmt = ''; // sin ventas
                    }
                }
            }

            return Array.from(map.values()).sort((a, b) => b.totalSoles - a.totalSoles);
        },


        // KPIs de la vista actual (filtrada)
        kpi() {
            let unidades = 0, totalSoles = 0, utilidadTotal = 0;
            for (const r of this.rowsProductos) {
                unidades += Number(r.unidades || 0);
                totalSoles += Number(r.totalSoles || 0);
                utilidadTotal += Number(r.utilidad || 0);
            }
            return { unidades, totalSoles, utilidadTotal };
        },

        headersProductos() {
            return [
                { text: 'ID', value: 'id', width: 100 },
                { text: 'Producto', value: 'nombre' },
                { text: 'Medida', value: 'medida', width: 110 },
                { text: 'Unidades', value: 'unidades', align: 'end', width: 110 },
                { text: 'Costo Total', value: 'costoTotal', align: 'end', width: 120 },
                { text: 'Total (S/)', value: 'totalSoles', align: 'end', width: 120 },
                { text: 'Utilidad (S/)', value: 'utilidad', align: 'end', width: 130 },
                { text: 'Margen %', value: 'margenPct', align: 'end', width: 110 },
            ];
        },
        sortOptions() {
            return [
                { text: 'Total (S/)', value: 'totalSoles' },
                { text: 'Unidades', value: 'unidades' },
                { text: 'Utilidad (S/)', value: 'utilidad' },
                { text: 'Margen %', value: 'margenPct' },
                { text: 'ID', value: 'id' },
                { text: 'Producto', value: 'nombre' },
            ];
        },
        mobileRows() {
            const q = (this.search || '').toLowerCase().trim();

            // base
            let arr = this.rowsProductos.slice();

            // 🔎 aplicar búsqueda en móvil (por id, nombre y medida)
            if (q) {
                arr = arr.filter(r =>
                    String(r.id).includes(q) ||
                    (r.nombre || '').toLowerCase().includes(q) ||
                    (r.medida || '').toLowerCase().includes(q)
                );
            }

            // ordenamiento existente
            const key = this.sortBy || 'totalSoles';
            arr.sort((a, b) => {
                const va = a[key]; const vb = b[key];
                const isStr = typeof va === 'string' || typeof vb === 'string';
                if (isStr) {
                    const cmp = String(va || '').localeCompare(String(vb || ''));
                    return this.sortDesc ? -cmp : cmp;
                }
                const cmp = Number(va || 0) - Number(vb || 0);
                return this.sortDesc ? -cmp : cmp;
            });

            return arr;
        },

    },
    methods: {
        cerrar() { this.$emit('cerrar'); this.dial = false; },
        n2(v) { return Number(v || 0).toFixed(2); },
        fmtInt(v) { return Number(v || 0).toLocaleString(); },

        exportarCSV(nombre, items) {
            const cols = Object.keys(items[0] || { id: '', nombre: '', medida: '', unidades: 0, totalSoles: 0 });
            const filas = [cols.join(',')];
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const row = cols.map(c => {
                    const val = it[c];
                    if (val == null) return '';
                    const s = String(val).replace(/"/g, '""');
                    return /[",\n]/.test(s) ? `"${s}"` : s;
                }).join(',');
                filas.push(row);
            }
            const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${nombre}${this.vendSel ? ('_' + this.vendSel) : ''}.csv`; a.click();
            URL.revokeObjectURL(url);
        },
    },
};
</script>

<style scoped>
/* bordes suaves para cards */
.v-card {
    border-radius: 14px;
}
</style>
