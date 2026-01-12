<template>
    <v-dialog v-model="dial" max-width="520" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierra">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h4>Buscar cliente</h4>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <!-- Autocomplete -->
            <v-autocomplete :disabled="cargando" outlined dense clearable hide-selected
                label="Busca Cliente (código, DNI/RUC o nombre)" :menu-props="{ maxHeight: '300' }" v-model="selectedId"
                :items="filtrados" item-text="label" item-value="id" :search-input.sync="busca_p" :loading="cargando"
                :no-data-text="busca_p ? 'Sin resultados' : 'Escribe para buscar'" @change="onSelect" />

            <!-- Resumen -->
            <v-card v-if="selectedCli" class="pa-3 mt-2" outlined>
                <div class="text-subtitle-2 grey--text">Cliente seleccionado</div>
                <div><b>DOC:</b> {{ selectedCli.documento || '—' }}</div>
                <div>{{ selectedCli.nombre || '—' }}</div>
                <div>{{ selectedCli.nota || '—' }}</div>
            </v-card>

            <!-- Agregar -->
            <v-btn block color="primary" class="mt-3" :disabled="!selectedCli || guardando || cargando"
                @click="emitAgregar">
                {{ guardando ? 'Guardando...' : 'Agregar' }}
            </v-btn>

        </v-card>
    </v-dialog>
</template>

<script>
import { colClientes, crearOActualizarCliente } from '../../../db_firestore'

export default {
    name: 'DialogHistorialClientes',
    props: {
        sede: { type: String, default: '' },
        dia: { type: String, default: '' },

    },
    data() {
        return {
            dial: true,
            busca_p: '',
            todos: [],
            filtrados: [],
            selectedId: null,
            selectedCli: null,
            cargando: false,
            guardando: false,
        }
    },

    async created() {
        this.filtrados = this.todos        // inicial
    },
    watch: {
        // filtra por texto
        busca_p(q) {
            if (this._pauseFilter) return
            const v = this.norm(q)
            if (!v) { this.filtrados = this.todos; return }

            this.filtrados = this.todos.filter(row =>
                row._nNombre.includes(v) ||
                row._nId.includes(v) ||
                row._nNota.includes(v)
            )
        },

        // hidrata desde el store: convierte a objetos con label e índices normalizados
        '$store.state.clientessearch': {
            immediate: true,
            handler(nuevo) {
                const base = Array.isArray(nuevo) ? nuevo : []
                this.todos = base.map(it => {
                    const id = String(it.id ?? it.codigo ?? it.documento ?? '').trim()
                    const nombre = String(it.nombre ?? '').trim()
                    const nota = String(it.nota ?? '').trim()
                    const label = `${id}${id && nombre ? ' / ' : ''}${nombre}${nota ? ' / ' + nota : ''}`

                    return {
                        ...it,
                        id,
                        nombre,
                        nota,
                        label,                 // <-- usado por item-text="label"
                        _nId: this.norm(id),
                        _nNombre: this.norm(nombre),
                        _nNota: this.norm(nota),
                    }
                })
                // si no hay texto de búsqueda, mostraremos todos
                if (!this.busca_p) this.filtrados = this.todos
                // si el selectedId actual ya no existe, límpialo
                if (this.selectedId && !this.todos.some(t => t.id === this.selectedId)) {
                    this.selectedId = null
                    this.selectedCli = null
                }
            }
        },
    },

    methods: {

        norm(s) {
            return (s || '').toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .trim()
        },
        async onSelect(id) {
            this.selectedCli = null
            if (!id) return

            try {
                this._pauseFilter = true
                this.cargando = true   // ⬅️ BLOQUEA UI (autocomplete y botón)

                // 1) Selección instantánea desde memoria
                const liviano = this.todos.find(c => c.id === id)
                if (liviano) this.selectedCli = { id: liviano.id, ...liviano }

                // 2) Intento de leer completo desde Firestore
                try {
                    const docCache = await colClientes().doc(String(id)).get()
                    if (docCache.exists) {
                        this.selectedCli = { id: docCache.id, ...docCache.data() }
                        console.log('selecto', this.selectedCli)
                    }
                } catch (e) {
                    console.error('Error leyendo Firestore:', e)
                }

            } catch (e) {
                console.error('❌ onSelect error:', e)
            } finally {
                this._pauseFilter = false
                this.cargando = false   // ⬅️ DESBLOQUEA UI
            }
        },


        async emitAgregar() {
            if (!this.selectedCli) return
            this.$store.commit("dialogoprogress");
            // Payload base que siempre se emite
            const cli = { ...this.selectedCli }

            // Solo si recibiste ambos props, actualiza en Firestore
            if (this.sede && this.dia) {
                cli.sede = this.sede

                const nuevoDiaArr = this.normalizaDia(this.dia)
                const actualArr = Array.isArray(cli.dia) ? cli.dia : this.normalizaDia(cli.dia)

                cli.dia = Array.from(new Set([
                    ...actualArr.map(x => String(x).toLowerCase().trim()),
                    ...nuevoDiaArr.map(x => String(x).toLowerCase().trim()),
                ])).filter(Boolean)

                try {
                    await crearOActualizarCliente(cli.id, cli)
                } catch (e) {
                    console.error('No se pudo actualizar el cliente en Firestore:', e)
                    this.$emit('warn', 'No se pudo actualizar el cliente, se continuará sin guardar.')
                }
            }

            if (Array.isArray(cli.direcciones) && cli.direcciones.length > 0) {
                const dirObj = cli.direcciones.find(d => d?.direccion && d.direccion.trim() !== '')
                if (dirObj) {
                    cli.direccion = dirObj.direccion
                }
            }
            this.$store.commit("dialogoprogress");
            // Emitir siempre el seleccionado (con sede/dia si aplicó)
            this.$emit('agregar', cli)
        },

        normalizaDia(v) {
            if (Array.isArray(v)) return v.map(x => String(x).toLowerCase().trim()).filter(Boolean)
            if (typeof v === 'string' && v.trim()) return [v.toLowerCase().trim()]
            return []
        },
        cierra() {
            this.dial = false
            this.$emit('cerrar')
        },
    },


}
</script>

<style scoped>
.text-subtitle-2 {
    font-size: 13px;
}
</style>
