<template>
    <div class="mb-6 pa-3 mt-1">
        <v-row dense>
            <v-btn color="success" block small v-if="false" @click="modifica_stock()">
                <v-icon left>mdi-cog</v-icon> modifica 0
            </v-btn>
            <v-col cols="6">
                <v-select v-model="sede_actual" :items="$store.state.array_sedes.filter(e => e.tipo == 'sede')"
                    item-text="nombre" item-value="base" label="Sede" outlined dense @change="sedeCambiada"></v-select>
            </v-col>
            <v-col cols="6">

                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn color="success" block small v-bind="attrs" v-on="on">
                            <v-icon left>mdi-cog</v-icon> Opciones
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item>

                            <v-btn :disabled="sede_actual != base_principal" dark small color="orange" block
                                @click="sincroniar(), sincroniza_categoria(); sincroniza_bonos()">
                                <v-icon left>mdi-refresh</v-icon> Sincronizar Productos
                            </v-btn>
                        </v-list-item>
                        <v-list-item>

                            <v-btn v-if="false" dark small color="orange" block @click="setControlStockGlobal(true)">
                                <v-icon left>mdi-refresh</v-icon> stock 1
                            </v-btn>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>
        </v-row>

        <v-row dense class="mt-n6">
            <v-col cols="6">
                <v-text-field outlined dense v-model="buscar" append-icon="mdi-magnify" label="BUSCAR"></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-select outlined dense v-model="filtro_categoria" :items="arraycategoria_f" menu-props="auto"
                    hide-details label="Categoría"></v-select>
            </v-col>
        </v-row>

        <v-card class="pa-4">
            <v-data-table dense :headers="headers" :items="listafiltrada" mobile-breakpoint="1">
                <template v-slot:item="{ item }">
                    <tr>
                        <td style="font-size: 80%">{{ item.id }}</td>
                        <td style="font-size: 80%">{{ item.categoria }}</td>
                        <td style="font-size: 80%">{{ item.nombre }}</td>
                        <td style="font-size: 80%">{{ item.stock }}</td>
                        <td style="font-size: 80%">{{ item.precio }}</td>
                    </tr>
                </template>
            </v-data-table>
        </v-card>
        <!-- Diálogo de progreso -->
        <v-dialog v-model="dialogoProgreso" persistent max-width="400">
            <v-card>
                <v-card-title class="headline grey lighten-2">
                    Sincronizando Productos
                </v-card-title>
                <v-card-text>
                    <div v-if="totalPorCopiar > 0">
                        <div>Sede: <strong>{{ sedeProgreso }}</strong></div>
                        <div>
                            Productos copiados: <strong>{{ copiados }}</strong> de <strong>{{ totalPorCopiar }}</strong>
                        </div>
                        <v-progress-linear :value="porcentajeProgreso" color="primary" height="8"
                            rounded></v-progress-linear>
                    </div>
                    <div v-else>
                        No hay productos nuevos para copiar.
                    </div>
                    <div v-if="progresoFinalizado">
                        <v-divider class="my-2"></v-divider>
                        <strong>Resumen:</strong>
                        <ul>
                            <li v-for="(r, i) in resumenSedes" :key="i">{{ r }}</li>
                        </ul>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn v-if="progresoFinalizado" color="success" @click="dialogoProgreso = false">
                        Cerrar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </div>
</template>

<script>
import {
    allCategorias,
    allProductoOtraBase,
    nuevoProductoOtraBase,
    nuevaCategoria_otraBD,
    allBono,
    nuevoBono_otraBD
} from '@/db';
import store from '@/store/index'
export default {
    data() {
        return {
            sede_actual: '',
            productos: [],
            buscar: '',
            filtro_categoria: 'TODOS',
            arraycategoria_f: [],
            headers: [{
                text: 'ID',
                value: 'id'
            },
            {
                text: 'Categoría',
                value: 'categoria'
            },
            {
                text: 'Nombre',
                value: 'nombre'
            },
            {
                text: 'Stock',
                value: 'stock'
            },
            {
                text: 'Precio',
                value: 'precio'
            }
            ],
            dialogoProgreso: false,
            sedeProgreso: "",
            copiados: 0,
            totalPorCopiar: 0,
            progresoFinalizado: false,
            resumenSedes: [],
            base_principal: ''
        };
    },

    computed: {
        listafiltrada() {
            let lista = this.productos;

            if (this.filtro_categoria !== 'TODOS') {
                lista = lista.filter(item => item.categoria === this.filtro_categoria);
            }

            if (this.buscar) {
                const term = this.buscar.toLowerCase();
                lista = lista.filter(item => (item.id + item.nombre).toLowerCase().includes(term));
            }

            return lista;
        },
        porcentajeProgreso() {
            if (!this.totalPorCopiar) return 0;
            return (this.copiados / this.totalPorCopiar) * 100;
        }
    },

    async created() {
        this.base_principal = store.state.array_sedes.filter(e => e.principal)[0].base
        const snapshot = await allCategorias().once('value');
        this.arraycategoria_f = ['TODOS'];
        snapshot.forEach(item => {
            this.arraycategoria_f.push(item.val().nombre);
        });
    },

    methods: {
        async sedeCambiada(base) {
            const snap = await allProductoOtraBase(base).once('value');
            const data = snap.val();
            this.productos = data ? Object.values(data) : [];
        },
        async sincroniza_categoria() {
            try {
                // 1) Leer categorías de la sede principal
                const snap = await allCategorias().once('value');
                if (!snap.exists()) {
                    this._toast('info', 'No existen categorías en la sede principal para sincronizar.');
                    return;
                }

                // 2) Normalizar categorías
                const categorias = [];
                const nombresVistos = new Set();
                snap.forEach(child => {
                    const val = child.val() || {};
                    const nombre = (val.nombre || '').trim();
                    if (!nombre) return;

                    const firma = nombre.toUpperCase();
                    if (nombresVistos.has(firma)) return;
                    nombresVistos.add(firma);

                    categorias.push({
                        id: child.key,
                        nombre,
                        editado: val.editado || Math.floor(Date.now() / 1000)
                    });
                });

                if (!categorias.length) {
                    this._toast('info', 'No hay categorías válidas para sincronizar.');
                    return;
                }

                // 3) Sedes destino (todas menos la actual, y con base definida)
                const sedes = store.state.array_sedes.filter(
                    s => s.tipo === 'sede' && s.base && s.base !== this.sede_actual
                );
                if (!sedes.length) {
                    this._toast('info', 'No hay otras sedes a las cuales sincronizar categorías.');
                    return;
                }

                this.resumenSedes = [];
                let totalGlobal = 0;

                // 4) Upsert por sede
                for (const sede of sedes) {
                    await Promise.all(
                        categorias.map(cat =>
                            nuevaCategoria_otraBD(sede.base, cat.id, {
                                id: cat.id,
                                nombre: cat.nombre,
                                editado: cat.editado
                            })
                        )
                    );
                    totalGlobal += categorias.length;
                    this.resumenSedes.push(
                        `${categorias.length} categoría(s) sincronizada(s) en sede ${sede.nombre || sede.base}`
                    );
                }

                this._toast(
                    'success',
                    `Sincronización de categorías finalizada: ${totalGlobal} categoría(s) en total.`
                );
            } catch (err) {
                this._toast('error', 'Error al sincronizar categorías: ' + (err?.message || err));
            }
        },



        async sincroniar() {
            try {
                // Productos de la sede principal (sin tocar stock aquí)
                const productos_principal = store.state.productos || [];
                if (!productos_principal.length) {
                    this.$toast?.info && this.$toast.info('No existen productos en la sede principal para sincronizar.');
                    return;
                }

                // Sedes destino (todas menos la sede actual)
                const sedes = store.state.array_sedes.filter(s => s.base !== this.sede_actual && s.tipo === 'sede');

                this.dialogoProgreso = true;
                this.sedeProgreso = "";
                this.copiados = 0;
                this.totalPorCopiar = 0;
                this.progresoFinalizado = false;
                this.resumenSedes = [];

                let total_global = 0;
                const ahora = Math.floor(Date.now() / 1000);

                // Pre-mapear principal por id para acceso O(1)
                const mapPrincipal = new Map();
                for (const p of productos_principal) if (p?.id) mapPrincipal.set(String(p.id), p);

                for (const sede of sedes) {
                    this.sedeProgreso = sede.nombre || sede.base;

                    // Cargar destino una sola vez por sede
                    const snap = await allProductoOtraBase(sede.base).once('value');
                    const productos_sede = snap.val() || {};
                    // Map destino por id
                    const mapDestino = new Map(Object.entries(productos_sede)); // id -> objeto

                    // Construir lista de acciones (NO escribir aún)
                    const acciones = []; // { id, data }
                    for (const [id, src] of mapPrincipal.entries()) {
                        if (!id) continue;

                        const dst = mapDestino.get(id);
                        if (!dst) {
                            // Crear: clonar del principal con stock=0 y sin stock2
                            const crear = { ...src, stock: 0, editado: src.editado || ahora };
                            delete crear.stock2;
                            acciones.push({ id, data: crear });
                            continue;
                        }

                        // Si principal más nuevo → actualizar sin tocar stock/stock2
                        const editSrc = Number(src.editado || 0);
                        const editDst = Number(dst.editado || 0);
                        if (editSrc > editDst) {
                            // --- CAMBIO AQUÍ ---

                            // 1. Usamos 'src' como base. Esto elimina cualquier campo "fantasma" 
                            // que exista en la sede pero que ya fue borrado en la principal.
                            const merged = { ...src };

                            // 2. Restauramos el STOCK de la sede (para no perder su inventario)
                            merged.stock = dst.stock;

                            // 3. Restauramos stock2 si existe en la sede
                            if (Object.prototype.hasOwnProperty.call(dst, 'stock2')) {
                                merged.stock2 = dst.stock2;
                            } else {
                                // Si la sede no tenía stock2, nos aseguramos de borrarlo 
                                // por si 'src' traía alguno por defecto.
                                delete merged.stock2;
                            }

                            // 4. Actualizamos la fecha
                            merged.editado = editSrc || ahora;

                            acciones.push({ id, data: merged });
                        }
                    }

                    this.copiados = 0;
                    this.totalPorCopiar = acciones.length;

                    if (!acciones.length) {
                        this.resumenSedes.push(`Sin cambios para ${this.sedeProgreso}`);
                        // pequeña pausa estética para que el usuario vea el avance
                        await new Promise(res => setTimeout(res, 200));
                        continue;
                    }

                    // Grabar en lotes concurrentes (rápido y estable)
                    await this.grabaLote(sede.base, acciones, 40);

                    total_global += acciones.length;
                    this.resumenSedes.push(`${acciones.length} producto(s) procesado(s) en ${this.sedeProgreso}`);
                }

                this.progresoFinalizado = true;

                if (total_global === 0) {
                    this.$toast?.info && this.$toast.info('No hubo productos nuevos/actualizados en las demás sedes.');
                } else {
                    this.$toast?.success && this.$toast.success(`Sincronización OK: ${total_global} productos.`, { timeout: 8000 });
                }
            } catch (error) {
                this.dialogoProgreso = false;
                this.$toast?.error && this.$toast.error('Error al sincronizar productos: ' + (error?.message || error));
            }
        },
        async sincroniza_bonos() {
            try {
                // 1) leer TODOS los bonos globales desde la sede principal
                const snap = await allBono().once('value');
                const bonos = snap.val() || {};

                const claves = Object.keys(bonos);
                if (!claves.length) {
                    this.$toast?.info && this.$toast.info('No hay bonos globales para sincronizar.');
                    return;
                }

                // 2) sedes destino (todas menos la sede actual)
                const sedes = store.state.array_sedes.filter(
                    s => s.base !== this.sede_actual && s.tipo === 'sede'
                );
                if (!sedes.length) {
                    this.$toast?.info && this.$toast.info('No hay otras sedes a las cuales sincronizar bonos.');
                    return;
                }

                let totalGlobal = 0;

                // 3) copiar SIEMPRE tal cual (sobrescribir)
                for (const sede of sedes) {
                    const acciones = claves.map(id => {
                        const data = bonos[id];
                        return nuevoBono_otraBD(sede.base, id, data);
                    });

                    await Promise.all(acciones); // sobrescribe todo en esa sede

                    totalGlobal += acciones.length;
                    this.resumenSedes.push(
                        `${acciones.length} bono(s) sincronizado(s) en sede ${sede.nombre || sede.base}`
                    );
                }

                this.$toast?.success &&
                    this.$toast.success(
                        `Sincronización de bonos globales OK: ${totalGlobal} bono(s) copiado(s).`,
                        { timeout: 8000 }
                    );
            } catch (err) {
                this.$toast?.error &&
                    this.$toast.error('Error al sincronizar bonos: ' + (err?.message || err));
            }
        },

        // Helper: graba por lotes con concurrencia limitada
        async grabaLote(sedeBase, acciones, batchSize = 40) {
            for (let i = 0; i < acciones.length; i += batchSize) {
                const slice = acciones.slice(i, i + batchSize);

                await Promise.all(
                    slice.map(({ id, data }) =>
                        nuevoProductoOtraBase(sedeBase, id, data).then(() => {
                            // actualizar progreso de forma barata
                            this.copiados++;
                        })
                    )
                );
            }
        },

        _toast(tipo, msg) {
            if (this.$toast && this.$toast[tipo]) {
                this.$toast[tipo](msg);
            } else if (this.$store?.commit) {
                // fallback a snackbar global
                this.$store.commit("dialogosnackbar", msg);
            } else {
                console.log(tipo.toUpperCase(), msg);
            }
        },

        progresoGlobal() {
            // Retorna porcentaje global de todas las sedes
            let total = this.resumenSedes.reduce((acc, r) => {
                let m = r.match(/^(\d+) producto/);
                return acc + (m ? parseInt(m[1]) : 0);
            }, 0);
            return total;
        },
        async modifica_stock() {
            if (!this.sede_actual) return;

            const snap = await allProductoOtraBase(this.sede_actual).once('value');
            const productosSede = snap.val() || {};
            const ids = Object.keys(productosSede);

            this.dialogoProgreso = true;
            this.sedeProgreso = this.sede_actual;
            this.copiados = 0;
            this.totalPorCopiar = ids.length;
            this.progresoFinalizado = false;
            this.resumenSedes = [];

            const ahora = Math.floor(Date.now() / 1000);

            for (const id of ids) {
                const p = productosSede[id] || {};
                const upd = { ...p, stock: 0, editado: ahora };
                if (Object.prototype.hasOwnProperty.call(p, 'stock2')) upd.stock2 = 0;
                await nuevoProductoOtraBase(this.sede_actual, id, upd);
                this.copiados++;
            }

            this.progresoFinalizado = true;

            const snapRef = await allProductoOtraBase(this.sede_actual).once('value');
            const dataRef = snapRef.val();
            this.productos = dataRef ? Object.values(dataRef) : [];
        },
        // Setea stock global en TODOS los productos de una base (sede)
        // - valor: número al que quieres fijar el stock
        // - base: base/sede destino (por defecto la seleccionada en el selector)
        // - opts: { tocarStock2: boolean, categoria: string|null }  (opcional)
        async setStockGlobal(valor, base = this.sede_actual, opts = {}) {
            const { tocarStock2 = false, categoria = null } = opts;

            if (!base && !this.sede_actual) {
                this.$toast?.error && this.$toast.error('Selecciona una sede primero.');
                return;
            }

            const nuevoValor = Number(valor);
            if (Number.isNaN(nuevoValor)) {
                this.$toast?.error && this.$toast.error('El valor de stock debe ser numérico.');
                return;
            }

            try {
                // Cargar todos los productos de la base
                const snap = await allProductoOtraBase(base).once('value');
                const productos = snap.val() || {};
                const ids = Object.keys(productos);

                // Filtro por categoría (si se pidió)
                const idsFiltrados = categoria
                    ? ids.filter(id => (productos[id]?.categoria || '').toString() === categoria.toString())
                    : ids;

                // Preparar UI de progreso
                this.dialogoProgreso = true;
                this.sedeProgreso = base;
                this.copiados = 0;
                this.totalPorCopiar = idsFiltrados.length;
                this.progresoFinalizado = false;
                this.resumenSedes = [];

                const ahora = Math.floor(Date.now() / 1000);
                const batchSize = 60; // tamaño de lote (ajústalo si quieres más/menos concurrencia)

                for (let i = 0; i < idsFiltrados.length; i += batchSize) {
                    const slice = idsFiltrados.slice(i, i + batchSize);

                    await Promise.all(
                        slice.map(async (id) => {
                            const p = productos[id] || {};
                            const upd = { ...p, stock: nuevoValor, editado: ahora };
                            if (tocarStock2 && Object.prototype.hasOwnProperty.call(p, 'stock2')) {
                                upd.stock2 = nuevoValor;
                            }
                            await nuevoProductoOtraBase(base, id, upd);
                            this.copiados++;
                        })
                    );
                }

                this.progresoFinalizado = true;
                this.resumenSedes.push(
                    `Stock fijado a ${nuevoValor} en ${this.totalPorCopiar} producto(s) de la sede ${this.sedeProgreso}`
                );

                // Si es la sede visible en pantalla, refresca tabla
                if (base === this.sede_actual) {
                    const ref = await allProductoOtraBase(base).once('value');
                    const dataRef = ref.val();
                    this.productos = dataRef ? Object.values(dataRef) : [];
                }

                this.$toast?.success && this.$toast.success('Actualización de stock finalizada.', { timeout: 6000 });
            } catch (err) {
                this.dialogoProgreso = false;
                this.$toast?.error && this.$toast.error('Error al actualizar stock: ' + (err?.message || err));
            }
        },


        // Cambia masivamente el flag "controstock" en TODOS los productos de una base (sede)
        // - valor: boolean (por defecto false)
        // - base: base/sede destino (por defecto la seleccionada)
        // - opts: { categoria: string|null } para limitar por categoría (opcional)
        async setControlStockGlobal(valor = false, base = this.sede_actual, opts = {}) {
            const { categoria = null } = opts;

            if (!base) {
                this.$toast?.error && this.$toast.error('Selecciona una sede primero.');
                return;
            }

            try {
                // Leer todos los productos de la base
                const snap = await allProductoOtraBase(base).once('value');
                const productos = snap.val() || {};
                const ids = Object.keys(productos);

                // Filtrar por categoría (si aplica)
                const idsFiltrados = categoria
                    ? ids.filter(id => (productos[id]?.categoria || '').toString() === categoria.toString())
                    : ids;

                // UI de progreso
                this.dialogoProgreso = true;
                this.sedeProgreso = base;
                this.copiados = 0;
                this.totalPorCopiar = idsFiltrados.length;
                this.progresoFinalizado = false;
                this.resumenSedes = [];

                const ahora = Math.floor(Date.now() / 1000);
                const batchSize = 60; // ajusta si quieres más/menos concurrencia

                for (let i = 0; i < idsFiltrados.length; i += batchSize) {
                    const slice = idsFiltrados.slice(i, i + batchSize);

                    await Promise.all(
                        slice.map(async (id) => {
                            const p = productos[id] || {};
                            const upd = { ...p, controstock: !!valor, editado: ahora };
                            await nuevoProductoOtraBase(base, id, upd);
                            this.copiados++;
                        })
                    );
                }

                this.progresoFinalizado = true;
                this.resumenSedes.push(
                    `controstock = ${valor ? 'true' : 'false'} en ${this.totalPorCopiar} producto(s) de la sede ${this.sedeProgreso}`
                );

                // Si es la sede visible, refresca la tabla
                if (base === this.sede_actual) {
                    const ref = await allProductoOtraBase(base).once('value');
                    const dataRef = ref.val();
                    this.productos = dataRef ? Object.values(dataRef) : [];
                }

                this.$toast?.success && this.$toast.success('Actualización masiva de controstock finalizada.', { timeout: 6000 });
            } catch (err) {
                this.dialogoProgreso = false;
                this.$toast?.error && this.$toast.error('Error al actualizar controstock: ' + (err?.message || err));
            }
        }



    }


};
</script>
