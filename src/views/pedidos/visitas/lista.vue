<template>
    <div class="pa-3">

        <v-card class="pa-2">
            <v-row dense>
                <v-col cols="6" sm="6" md="3">
                    <v-select v-model="sede_actual" :items="$store.state.array_sedes" item-text="nombre"
                        item-value="codigo" label="Vendedor" outlined dense :disabled="bloqueo_filtro || cargando" />
                </v-col>
                <v-col cols="6" sm="6" md="3">
                    <v-select :items="arra_estado" label="Estado" dense outlined v-model="estado"
                        :disabled="cargando" />
                </v-col>
                <v-col cols="6" sm="6" md="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6 ' : ''">
                    <v-menu v-model="menuFecha" :close-on-content-click="false" transition="scale-transition" offset-y
                        min-width="290">
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field v-model="date" :label="`Día:     -  -  - >  ${dia}`" outlined dense readonly
                                prepend-inner-icon="mdi-calendar" v-bind="attrs" v-on="on" :disabled="cargando" />
                        </template>

                        <!-- Contenido del dropdown -->
                        <v-card>
                            <v-toolbar dense flat>
                                <v-checkbox v-model="filtrarPorDia" hide-details dense class="ma-0" :disabled="cargando"
                                    label="Filtrar por día" />
                                <v-spacer />
                                <v-btn outlined color="error" small text @click="menuFecha = false">OK</v-btn>
                            </v-toolbar>

                            <v-divider />

                            <v-date-picker v-model="date" locale="es" scrollable @change="menuFecha = false" />
                        </v-card>
                    </v-menu>
                </v-col>

                <v-col cols="6" sm="6" md="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6 ' : ''">
                    <v-select v-model="zona" :items="zonasConTodas" item-text="nombre" item-value="nombre" label="Zona"
                        outlined dense :disabled="cargando" />

                </v-col>

                <v-col cols="12" sm="12" md="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6 ' : 'mt-n4'">
                    <v-layout dense align-center>
                        <v-flex>
                            <v-text-field outlined dense v-model="busca_p" label="Buscar (nombre)" :disabled="cargando"
                                clearable />
                        </v-flex>
                        <v-btn icon small color="info" class="ml-2 mt-n6 mr-6" @click="_refreshClientesYFiltrado"
                            :loading="cargando">
                            <v-icon>mdi-filter</v-icon>
                        </v-btn>
                    </v-layout>
                </v-col>

                <v-col cols="6" sm="6" md="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6 ' : 'mt-n2'">
                    <v-menu bottom offset-y>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="success" block x-small v-bind="attrs" v-on="on">
                                Clientes
                                <v-spacer></v-spacer>
                                <v-icon left>mdi-arrow-down-bold</v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click="cliente_selecto = null, dial_cliente = !dial_cliente">
                                <v-list-item-title>
                                    <v-icon left color="info">mdi-plus</v-icon> Crear Cliente
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="busca_clientes = !busca_clientes">
                                <v-list-item-title>
                                    <v-icon left color="success">mdi-clipboard-list</v-icon> Ver Lista Clientes
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
                <v-col cols="6" sm="6" md="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6 ' : 'mt-n2'">
                    <v-btn class="" block color="warning" x-small :loading="cargando" @click="abre_mapa_total">
                        Mapa de zona
                    </v-btn>
                </v-col>
            </v-row>

            <v-progress-linear v-if="cargando" indeterminate height="2" class="mt-1" />

        </v-card>

        <v-card class="mt-2 mb-10">
            <!-- ESCRITORIO / TABLET: tabla -->
            <div v-if="!isMobile">
                <v-data-table :headers="headers" :items="listafiltrada" dense fixed-header height="65vh"
                    :items-per-page="50" :loading="cargando" class="elevation-1"
                    :footer-props="{ itemsPerPageOptions: [25, 50, 100, 200] }" item-key="id">
                    <!-- Cliente -->
                    <template v-slot:[`item.nombre`]="{ item }">
                        <span style="font-size:85%">
                            <v-icon small color="red" @click.prevent="editar_cliente(item)">mdi-pencil</v-icon>
                            {{ item.nombre }}
                        </span>
                    </template>

                    <!-- Dirección (tooltip con _dir y texto truncado _dirTrunc que ya preparaste) -->
                    <template v-slot:[`item._dir`]="{ item }">
                        <span style="font-size:75%">
                            <v-tooltip top>
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on">{{ item._dirTrunc }}</span>
                                </template>
                                <span>{{ item._dir }}</span>
                            </v-tooltip>
                        </span>
                    </template>

                    <!-- Zona -->
                    <template v-slot:[`item.zona`]="{ item }">
                        <span style="font-size:75%">{{ item.zona }}</span>
                    </template>

                    <!-- Estado (icono coloreado + texto accesible en tooltip) -->
                    <template v-slot:[`item.estado`]="{ item }">
                        <span style="font-size:75%">
                            <v-tooltip top>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on" @click.prevent="ver_cli(item)"
                                        :color="estadoColor(item.estado)">
                                        mdi-circle
                                    </v-icon>
                                </template>
                                <span>{{ item.estado || 'sin estado' }}</span>
                            </v-tooltip>
                        </span>
                    </template>

                    <!-- Acción (botones iguales a tu tabla) -->
                    <template v-slot:[`item.accion`]="{ item }">
                        <div class="d-flex flex-wrap align-right gap-1 acciones-inline">
                            <v-btn x-small text color="info" v-if="$store.state.permisos.venta_directa"
                                @click="vender(item)">
                                <v-icon left small>mdi-cash-register</v-icon> Vender
                            </v-btn>

                            <v-btn x-small text color="success" v-if="$store.state.permisos.pre_venta"
                                @click="pre_venta(item)">
                                <v-icon left small>mdi-cart</v-icon> Pre-venta
                            </v-btn>

                            <v-btn x-small text color="orange" v-if="item.estado == 'pendiente'"
                                @click="marcar_visita(item)">
                                <v-icon left small>mdi-eye</v-icon> Visita
                            </v-btn>

                            <v-btn x-small text color="red" @click="abre_mapa(item)">
                                <v-icon left small>mdi-google-maps</v-icon> Ubicación
                            </v-btn>
                            <v-btn x-small text color="info" @click=" cliente_selecto = item, dial_histo_ = true">
                                <v-icon left small>mdi-table-eye</v-icon> Historial
                            </v-btn>
                            <v-btn x-small text color="red darken-2" @click="verDeudas(item)">
                                <v-icon left small>mdi-cash</v-icon> Deudas
                            </v-btn>
                        </div>
                    </template>

                    <!-- Estado vacío -->
                    <template v-slot:no-data>
                        <v-alert type="info" outlined dense class="my-2">No hay clientes para mostrar.</v-alert>
                    </template>
                </v-data-table>

            </div>

            <!-- MÓVIL: v-cards -->
            <div v-else class="px-2 py-2">
                <v-skeleton-loader v-if="cargando" type="list-item-two-line@6" />

                <template v-else>
                    <v-alert v-if="listafiltrada.length === 0" type="info" outlined dense class="my-2">No hay clientes
                        para mostrar.</v-alert>

                    <v-card v-for="(item, idx) in displayed" :key="item.id + '_' + idx" class="mb-2" outlined>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title class="font-weight-medium">
                                    <v-icon small color="red" @click.prevent="editar_cliente(item)">mdi-pencil</v-icon>
                                    {{ item.nombre }}
                                </v-list-item-title>
                                <div class="caption mt-1 grey--text text--darken-1 truncate">
                                    <v-icon x-small class="mr-1" color="grey">mdi-map-marker</v-icon>
                                    {{ item._dir }}
                                </div>
                                <v-list-item-subtitle class="mt-1">
                                    <v-chip x-small class="mr-1" label>{{ item.zona || '—' }}</v-chip>
                                    <v-chip x-small :color="estadoColor(item.estado)"
                                        :text-color="estadoColor(item.estado) === 'orange' ? 'black' : 'white'" label>
                                        {{ (item.estado || 'sin estado').toUpperCase() }}
                                    </v-chip>
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action>
                                <v-tooltip top>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn icon v-bind="attrs" v-on="on" @click="abre_mapa(item)">
                                            <v-icon color="red">mdi-google-maps</v-icon>
                                        </v-btn>
                                    </template>
                                    <span>Ubicación</span>
                                </v-tooltip>
                            </v-list-item-action>
                        </v-list-item>

                        <v-divider />

                        <v-card-actions class="py-1">
                            <v-btn x-small text color="info" @click="vender(item)"
                                v-if="$store.state.permisos.venta_directa">
                                <v-icon left small>mdi-cash-register</v-icon> Vender
                            </v-btn>

                            <v-btn x-small text color="success" @click="pre_venta(item)"
                                v-if="$store.state.permisos.pre_venta">
                                <v-icon left small>mdi-cart</v-icon> Pre-venta
                            </v-btn>


                            <v-spacer></v-spacer>

                            <v-menu bottom offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn color="error" text x-small v-bind="attrs" v-on="on">
                                        Acciones
                                        <v-spacer></v-spacer>
                                        <v-icon left>mdi-arrow-down-bold</v-icon>
                                    </v-btn>
                                </template>
                                <v-list dense>
                                    <v-list-item @click="marcar_visita(item)">
                                        <v-list-item-title>
                                            <v-icon left color="orange">mdi-eye</v-icon> Marcar visita
                                        </v-list-item-title>
                                    </v-list-item>
                                    <v-list-item @click=" cliente_selecto = item, dial_histo_ = true">
                                        <v-list-item-title>
                                            <v-icon left color="success">mdi-clipboard-list</v-icon> Historial Compras
                                        </v-list-item-title>
                                    </v-list-item>
                                    <v-list-item @click="verDeudas(item)">
                                        <v-list-item-title>
                                            <v-icon left color="red">mdi-cash</v-icon> Ver Deudas
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-card-actions>
                    </v-card>
                    <div ref="sentinel" class="py-4 text-center grey--text">
                        <v-progress-circular v-if="loadingMore" indeterminate size="20" />
                    </div>

                    <!-- Fallback: muestra si aún hay más y el observer no disparó -->
                    <div v-if="isMobile && displayed.length < listafiltrada.length" class="text-center pb-4">
                        <v-btn small outlined @click="verMas" :disabled="loadingMore">Ver más</v-btn>
                    </div>
                </template>
            </div>
        </v-card>
        <v-dialog v-model="dial_agrega_GPS" max-width="420px">
            <v-card class="pa-4">
                <v-card-title class="justify-center">
                    <v-icon color="orange" size="48">mdi-map-marker-alert</v-icon>
                </v-card-title>
                <v-card-text class="text-center">

                    <div class="text-h6 font-weight-bold mb-2">
                        Ubicación GPS no encontrada
                    </div>

                    <div class="text-body-2 grey--text">
                        Este cliente aún no cuenta con coordenadas registradas.
                        ¿Deseas agregar su ubicación ahora en el mapa?
                    </div>
                </v-card-text>
                <v-card-actions class="d-flex justify-space-between mt-4">

                    <v-btn outlined color="grey" class="flex-grow-1 mr-2" @click="dial_agrega_GPS = false">
                        Cancelar
                    </v-btn>

                    <v-btn color="green" class="flex-grow-1" @click="dialogoMapa = true; dial_agrega_GPS = false">
                        Agregar GPS
                    </v-btn>

                </v-card-actions>
            </v-card>
        </v-dialog>

        <nuevo_cli v-if="dial_cliente" @cierra="dial_ubica_gps($event)"
            @actualizar=" _refreshClientesYFiltrado(), dial_ubica_gps($event)" :vendedor="sede_actual"
            :cliente_selecto="cliente_selecto" />
        <dial_mapas v-model="dialogoMapa" :cliente-en-mapa="clienteSeleccionado"
            :clientes="verTodosMapa ? listafiltrada : []" :ver-todos="verTodosMapa" :guardar_auto="!verTodosMapa"
            @cierra="dialogoMapa = false; _refreshClientesYFiltrado()" />
        <dial_detalle_ped v-if="dialogDetalle" @cierra="dialogDetalle = false"
            :pedidoSeleccionado="pedidoSeleccionado" />
        <busca_clis v-if="busca_clientes" @cerrar="busca_clientes = false"
            @agregar="busca_clientes = false, _refreshClientesYFiltrado()" :dia="dia" :sede='sede_actual'></busca_clis>
        <dial_histo_cliente v-if="dial_histo_" @cerrar="dial_histo_ = false" :cliente="cliente_selecto" />
        <dial_deudas_cliente v-model="dialog_deudas" :cliente="cliente_deuda" :accion-pendiente="accion_pendiente"
            @cerrar="cerrarDialogDeudas" @continuar="onContinuarDeudas" />
    </div>
</template>

<script>
import moment from 'moment'
import 'moment/locale/es'
import { all_pedidos, allCabecera, nueva_visita, visita_x_id } from '../../../db'
import store from '@/store/index'
import nuevo_cli from '@/views/clientes/agrega_cliente'
import busca_clis from '@/views/clientes/dialogos/busca_cliente'
import dial_mapas from '../../clientes/dial_mapa.vue'
import dial_detalle_ped from '../dialogos/dialogo_detalle_ped.vue'
import { loadFiltros, saveFiltros } from '../../../guarda_navegador';
import { colClientes, colRuta_x_dia } from '../../../db_firestore'
import dial_histo_cliente from '../../clientes/dialogos/historial_compras.vue'
import dial_deudas_cliente from '../../clientes/dialogos/dial_deudas_cliente.vue'
moment.locale('es')
export default {
    name: 'ListaClientesVisitas',
    components: { nuevo_cli, dial_mapas, dial_detalle_ped, busca_clis, dial_histo_cliente, dial_deudas_cliente },
    data: () => ({
        headers: [
            { text: 'Cliente', value: 'nombre' },
            { text: 'Dirección', value: '_dir', sortable: false },
            { text: 'Zona', value: 'zona' },
            { text: 'Estado', value: 'estado', sortable: false },
            { text: 'Acción', value: 'accion', sortable: false },
        ],
        dial_agrega_GPS: false,
        cargando: false,
        menuFecha: false,
        error: null,
        dialogDetalle: false,
        dialogoMapa: false,
        clienteSeleccionado: null,
        verTodosMapa: false,
        dial_histo_: false,
        date: moment().format('YYYY-MM-DD'),
        filtrarPorDia: true,
        dial_cliente: false,
        busca_clientes: false,
        arra_estado: ['todos', 'atendido', 'pendiente', 'visita'],
        sede_actual: '',
        estado: 'todos',
        busca_p: '',

        lista_clientes: [], // Array de clientes [{id, nombre, zona, estado, sede, ...}]
        bloqueo_filtro: false,
        pedidoSeleccionado: [],
        detalleSeleccionado: [],
        cliente_selecto: null,
        zona: 'TODAS',
        array_clientes: [],
        unsubClientes: null,
        page: 1,
        pageSize: 30,   // muestra 50 en móvil, luego cargará +50
        loadingMore: false,
        observer: null,
        // Variables para diálogo de cuentas por cobrar
        dialog_deudas: false,
        cliente_deuda: null,
        accion_pendiente: null, // 'vender' o 'pre_venta'

    }),
    computed: {
        displayed() {
            const end = this.page * this.pageSize;
            return this.listafiltrada.slice(0, end);
        },
        isMobile() {
            return this.$vuetify && this.$vuetify.breakpoint.smAndDown;
        },
        dia() {
            return moment(this.date).format('ddd').normalize('NFD')                                             // separa tildes
                .replace(/[\u0300-\u036f]/g, '')                              // quita tildes
                .replace(/\./g, '')                                           // quita el punto final
                .toLowerCase();   // "lun", "mar", "mié", ... // lun, mar, mié...
        },
        listafiltrada() {

            let lista = Array.isArray(this.lista_clientes) ? this.lista_clientes : []

            // Filtro por estado
            if (this.estado && this.estado !== 'todos') {
                const e = String(this.estado).toLowerCase();
                const include = e === 'atendido'
                    ? new Set(['atendido', 'venta', 'pre-venta'])
                    : new Set([e]);
                lista = lista.filter(c => include.has(String(c.estado || '').toLowerCase()));
            }

            // Filtro por zona
            if (this.zona && this.zona.toUpperCase() !== 'TODAS') {
                const z = this.zona.toLowerCase().trim()
                lista = lista.filter(c => (c.zona || '').toLowerCase().trim() === z)
            }

            // Búsqueda por nombre
            const q = (this.busca_p || '').trim().toLowerCase()
            if (q) {
                lista = lista.filter(c => {
                    const nombre = (c.nombre || '').toLowerCase()
                    const coincide = nombre.includes(q)
                    return coincide
                })
            }

            return lista;
        },

        zonasConTodas() {
            const base = Array.isArray(this.$store.state.zonas) ? this.$store.state.zonas : [];

            return [{ nombre: 'TODAS' }, ...base];
        },
    },
    async created() {
        if (!this.$store.state.permisos?.moduloempresa) {
            this.bloqueo_filtro = true;
        }

        const f = loadFiltros();
        //console.log('sede', f.sede)
        this.sede_actual = f.sede || this.$store.state.sedeActual.codigo;
        this.estado = f.estado ?? 'todos';
        this.date = f.date || moment().format('YYYY-MM-DD');
        this.zona = f.zona || 'TODAS';
        this.busca_p = f.busca_p || '';
        this.filtrarPorDia = (typeof f.filtrarPorDia === 'boolean') ? f.filtrarPorDia : true; // ⬅️ nuevo
        await this.obtener_clientes();
    },

    watch: {
        estado(nv) { saveFiltros({ estado: nv }); this.filtra(); },
        busca_p(nv) {
            saveFiltros({ busca_p: nv });
        },
        async sede_actual(nv) {
            saveFiltros({ sede: nv });
            await this._refreshClientesYFiltrado();   // 👈 resuscribe + filtra
        },
        async zona(nv) {
            saveFiltros({ zona: nv });
            await this._refreshClientesYFiltrado();   // 👈 resuscribe + filtra
        },
        async date(nv) {
            saveFiltros({ date: nv });
            await this._refreshClientesYFiltrado();   // 👈 resuscribe + filtra (cambia this.dia)
        },
        async filtrarPorDia(nv) {
            saveFiltros({ filtrarPorDia: nv });   // ⬅️ guarda preferencia
            await this._refreshClientesYFiltrado();
        },

        listafiltrada() { this.page = 1; }
    },
    mounted() {
        // this.filtra();
        if (this.isMobile) {
            this.$nextTick(() => {
                this.observer = new IntersectionObserver(
                    entries => {
                        const [entry] = entries;
                        if (entry.isIntersecting && !this.cargando && !this.loadingMore) {
                            this.loadingMore = true;
                            requestAnimationFrame(() => {
                                this.page += 1;
                                this.loadingMore = false;
                            });
                        }
                    },
                    { root: null, threshold: 0.1, rootMargin: '100px' }
                );
                if (this.$refs.sentinel) this.observer.observe(this.$refs.sentinel);
            });
        }
    },
    beforeDestroy() {
        if (this.observer) this.observer.disconnect();
    },
    methods: {
        getRowKey(item) {
            return item.id || `row_${Math.random()}`;
        },
        dial_ubica_gps(data) {
            console.log(data)
            if ((data.latitud == null || data.longitud == null) && data.id !== '') {
                this.clienteSeleccionado = data
                this.dial_agrega_GPS = true
            }
            this.dial_cliente = false
        },
        verMas() {
            if (this.loadingMore) return;
            this.loadingMore = true;
            requestAnimationFrame(() => {
                this.page += 1;
                this.loadingMore = false;
            });
        },
        async _refreshClientesYFiltrado() {
            await this.obtener_clientes();  // desuscribe y suscribe con la query nueva
            // arma la tabla con los clientes recién cargados
        },
        async obtener_clientes() {
            this.cargando = true;
            try {
                const diaActual = this.dia;
                let q = colClientes()
                    .where('activo', '==', true)
                    .where('sede', '==', this.sede_actual)

                if (this.filtrarPorDia) {
                    q = q.where('dia', 'array-contains', diaActual);
                }

                if (this.zona && this.zona.toUpperCase() !== 'TODAS') {
                    q = q.where('zona', '==', this.zona);
                }

                const snap = await q.get();
                this.array_clientes = snap.docs.map(d => {
                    const data = d.data();
                    const dir = this.getDireccion(data);
                    return {
                        id: d.id,
                        ...data,
                        _dir: dir,
                        _dirTrunc: this.trunc(dir, 50),
                    };
                });

                await this.filtra();

            } catch (e) {
                console.error('Error:', e);
                this.array_clientes = [];
            } finally {
                this.cargando = false;
            }
        },


        trunc(str, max = 50) {
            const s = String(str || '');
            return s.length > max ? s.slice(0, max - 1) + '…' : s;
        },
        getDireccion(c) {
            const ok = v => typeof v === 'string' && v.trim().length > 0;
            if (!c) return 'Sin dirección';

            // Toma la dirección principal del arreglo; si no hay, null
            const pickDir = (obj) => {
                if (!Array.isArray(obj?.direcciones) || obj.direcciones.length === 0) return null;
                return obj.direcciones.find(x => x?.principal) || obj.direcciones[0];
            };
            const drec = pickDir(c);

            // Campos posibles (prioriza 'direcciones' y luego campos planos)
            const direccion =
                (ok(drec?.direccion) ? drec.direccion :
                    ok(c?.direccion) ? c.direccion :
                        ok(c?.cliente_direccion) ? c.cliente_direccion : '').trim();

            const distrito =
                (ok(drec?.distrito?.nombre) ? drec.distrito.nombre :
                    ok(c?.distrito) ? c.distrito : '').trim();

            const provincia =
                (ok(drec?.provincia?.nombre) ? drec.provincia.nombre :
                    ok(c?.provincia) ? c.provincia : '').trim();


            const referencia =
                (ok(drec?.referencia) ? drec.referencia :
                    ok(c?.referencia) ? c.referencia : '').trim();

            // Evita duplicados (ej. zona == distrito) manteniendo el primero
            const uniqKeepFirst = (arr) => {
                const seen = new Set(); const out = [];
                for (const s of arr) {
                    const key = s.toLowerCase();
                    if (!s || seen.has(key)) continue;
                    seen.add(key); out.push(s);
                }
                return out;
            };

            // Construye "Zona — Distrito, Provincia"
            const locParts = uniqKeepFirst([distrito, provincia].filter(ok));
            let locStr = '';
            if (locParts.length) {
                const head = locParts[0];
                const tail = locParts.slice(1).join(', ');
                locStr = tail ? `${head} — ${tail}` : head;
            }

            // Base: Dirección explícita o (Zona/Distrito/Provincia)
            const base = direccion || locStr;

            // Añade referencia si existe
            const result = [base, ok(referencia) ? `Ref: ${referencia}` : '']
                .filter(ok)
                .join(' · ');

            return result || 'Sin dirección';
        },


        async verDetalle(item) {
            // ahora 'item' es un cliente; usamos su pedido_id calculado en filtra()
            const pedidoId = item?.pedido_id;
            if (!pedidoId) {
                store.commit && store.commit('dialogosnackbar', 'Este cliente no tiene pedido asociado en la fecha.');
                return;
            }

            store.commit("dialogoprogress");

            // cabecera del pedido para mostrar total, cliente, etc.
            const cabSnap = await all_pedidos().child(pedidoId).once("value");
            const cab = cabSnap.val() || {};
            this.pedidoSeleccionado = { id: pedidoId, ...cab };
            store.commit("dialogoprogress");

            this.dialogDetalle = true;

        },
        number2(n) {
            const x = Number(n || 0);
            return x.toFixed(2);
        },
        abre_mapa_total() {
            this.verTodosMapa = true
            this.clienteSeleccionado = null
            this.dialogoMapa = true
        },
        async ver_cli(item) {
            // Aquí puedes abrir un diálogo de detalles o navegar
            // this.$emit('ver-cliente', item)
            // console.log('Ver cliente:', item)
        },
        _normDia(s) {
            // lun, mar, mie, jue, vie, sab, dom (acepta 'lunes' también)
            const x = String(s || '')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin tildes
                .replace(/\./g, '') // sin puntos de abreviatura
                .toLowerCase().trim();
            // toma solo las 3 primeras letras para uniformizar 'lunes' -> 'lun'
            return x.slice(0, 3);
        },
        _tieneDia(valorDia, diaBuscado) {
            const target = this._normDia(diaBuscado);
            if (Array.isArray(valorDia)) {
                return valorDia.some(d => this._normDia(d) === target);
            }
            return this._normDia(valorDia) === target;
        },
        async filtra() {
            const start = moment(this.date, 'YYYY-MM-DD').startOf('day').unix();
            const end = moment(this.date, 'YYYY-MM-DD').endOf('day').unix();

            if (!this.sede_actual) {
                this.lista_clientes = [];
                return;
            }

            this.cargando = true;

            const rank = { 'venta': 3, 'pre-venta': 2, 'visita': 1 };

            try {
                let q = colRuta_x_dia()
                    .where('sede', '==', String(this.sede_actual))
                    .where('fecha', '>=', start)
                    .where('fecha', '<=', end);

                const snap = await q.get();
                console.log('filtra(): visitas encontradas', snap.size);

                const bestByCliente = new Map();
                snap.forEach(d => {
                    const r = d.data() || {};
                    const id = String(r.cliente_id || '').trim();
                    const est = String(r.estado || '').toLowerCase();
                    if (!id) return;

                    const prev = bestByCliente.get(id);
                    if (!prev || (rank[est] || 0) > (rank[String(prev).toLowerCase()] || 0)) {
                        bestByCliente.set(id, r.estado);
                    }
                });

                const base = Array.isArray(this.array_clientes) ? this.array_clientes : [];

                this.lista_clientes = base.map(c => {
                    const clienteId = String(c.id || '').trim();
                    const estadoRaw = bestByCliente.get(clienteId) || 'pendiente';
                    const estado = String(estadoRaw).toLowerCase();

                    return {
                        ...c,
                        id: c.id,
                        estado
                    };
                });

            } catch (e) {
                console.error('Error en filtra():', e);
                this.lista_clientes = [];
            } finally {
                this.cargando = false;
            }
        },

        abre_mapa(cliente) {
            this.verTodosMapa = false
            this.clienteSeleccionado = cliente || null
            this.dialogoMapa = true
        },
        vender(data) {
            console.log(data)
            this.cliente_deuda = data
            this.accion_pendiente = 'vender'
            store.commit("setOrigenPedido", "visitas");
            this.dialog_deudas = true
        },
        ejecutarVenta(data) {
            var fecha = moment(this.date).format('DDMMYYYY')
            data.fecha = fecha
            store.commit("cliente_selecto", data)
            this.$router.push({
                name: 'caja2'
            })
        },
        async pre_venta(data) {
            this.cliente_deuda = data
            this.accion_pendiente = 'pre_venta'
            store.commit("setOrigenPedido", "visitas");
            this.dialog_deudas = true
        },
        ejecutarPreVenta(data) {
            var fecha = moment(this.date).format('DDMMYYYY')
            data.fecha = fecha
            store.commit("cliente_selecto", data)
            store.commit("setOrigenPedido", "visitas")
            this.$router.push({
                name: 'nuevo_pedido'
            })
        },
        verDeudas(cliente) {
            this.cliente_deuda = cliente
            this.accion_pendiente = null
            this.dialog_deudas = true
        },
        cerrarDialogDeudas() {
            this.dialog_deudas = false
            this.accion_pendiente = null
            this.cliente_deuda = null
        },
        async onContinuarDeudas(payload) {
            const { accion, cliente } = payload
            this.cerrarDialogDeudas()
            if (accion === 'vender') {
                await this.guardarEstadoRuta(cliente, 'venta');
                this.ejecutarVenta(cliente)
            } else if (accion === 'pre_venta') {
                await this.guardarEstadoRuta(cliente, 'pre-venta');
                this.ejecutarPreVenta(cliente)
            }
        },
        async marcar_visita(cliente) {
            const RADIO_PERMITIDO_M = this.$store.state.configuracion.distancia_visita || 15;

            try {
                const tieneCoordsCliente = cliente.latitud != null && cliente.longitud != null;

                if (tieneCoordsCliente) {
                    const ua = store.state.ubicacion_actual;
                    if (!ua || ua.lat == null || ua.lng == null) {
                        store.commit('dialogosnackbar', 'No hay ubicación actual (GPS).');
                        return;
                    }

                    const latUser = Number(ua.lat);
                    const lngUser = Number(ua.lng);
                    const latCli = Number(cliente.latitud);
                    const lngCli = Number(cliente.longitud);

                    if ([latUser, lngUser, latCli, lngCli].some(v => Number.isNaN(v))) {
                        store.commit('dialogosnackbar', 'Coordenadas inválidas.');
                        return;
                    }

                    const dist = this.distanciaMetros(latUser, lngUser, latCli, lngCli);

                    if (dist > RADIO_PERMITIDO_M) {
                        store.commit('dialogosnackbar', 'No está en el punto de visita (distancia > 15 m).');
                        return;
                    }
                }

                if (!confirm('¿Está seguro de marcar visita?')) {
                    return;
                }

                const fecha = moment(this.date).unix();
                const visita = {
                    fecha,
                    sede: this.sede_actual || '',
                    cliente_id: cliente.id || '',
                    zona: cliente.zona || '',
                    estado: 'visita'
                };

                await colRuta_x_dia().add(visita);
                store.commit('dialogosnackbar', 'Visita marcada correctamente.');
                this.filtra();

            } catch (e) {
                console.error(e);
                store.commit('dialogosnackbar', 'Error al marcar la visita.');
            }
        },

        distanciaMetros(lat1, lon1, lat2, lon2) {
            const R = 6371e3; // metros
            const toRad = d => d * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        },
        estadoColor(estado) {
            const e = String(estado || '').toLowerCase().trim();

            switch (e) {
                case 'atendido':
                    return 'green';
                case 'venta':
                    return 'green';
                case 'pre-venta':
                    return 'blue';
                case 'visita':
                case 'visitado': // 👈 para compatibilidad
                    return 'red';
                case 'pendiente':
                    return 'orange';
                default:
                    return 'grey';
            }
        },

        editar_cliente(item) {
            console.log(item)
            this.cliente_selecto = item;   // 👉 pasa el cliente al diálogo
            this.dial_cliente = true;      // 👉 abre el diálogo de edición
        },
        async guardarEstadoRuta(cliente, estado) {
            try {
                const fecha = moment(this.date).unix();
                const registro = {
                    fecha,
                    sede: this.sede_actual || '',
                    cliente_id: cliente.id, // Usar ID de Firestore
                    zona: cliente.zona || '',
                    estado: estado // 'venta' o 'pre-venta'
                };
                await colRuta_x_dia().add(registro);
            } catch (e) {
                console.error('Error guardando estado:', e);
            }
        },
    }

}
</script>

<style scoped>
/* Animación opcional conservada */
@keyframes anim {
    0% {
        background-color: #fff;
    }

    50% {
        background-color: #ffc4c4;
    }

    100% {
        background-color: #fff;
    }
}

.id_card_rect {
    animation-name: anim;
    animation-duration: 2s;
    animation-iteration-count: infinite;
}

.v-card {
    border-radius: 14px;
}

.truncate {
    max-width: 72vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
