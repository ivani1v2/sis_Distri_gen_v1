<template>
    <v-dialog v-model="dial" max-width="520" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon color="red" @click="cierra">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h4 class="mr-10">Seleccionar Cliente para Nuevo Pedido</h4>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card class="pa-3">
            <v-autocomplete :disabled="cargando" outlined dense clearable hide-selected
                label="Busca Cliente (código, DNI/RUC o nombre)" :menu-props="{ maxHeight: '300' }" v-model="selectedId"
                :items="filtrados" item-text="label" item-value="id" :search-input.sync="busca_p" :loading="cargando"
                :no-data-text="busca_p ? 'Sin resultados' : 'Escribe para buscar'" @change="onSelect" class="mt-1 mb-n4"/>

            <v-card v-if="selectedCli" class="pa-3 mb-6" outlined>
                <div class="text-subtitle-2 grey--text">Cliente seleccionado</div>
                <div><strong>DOC:</strong> {{ selectedCli.documento || '—' }}</div>
                <div><strong>Nombre:</strong> {{ selectedCli.nombre || '—' }}</div>
                <div v-if="selectedCli.telefono"><strong>Teléfono:</strong> {{ selectedCli.telefono || '—' }}</div>
                <div v-if="selectedCli.direccion"><strong>Dirección:</strong> {{ selectedCli.direccion || '—' }}</div>
                <div v-if="selectedCli.zona"><strong>Zona:</strong> {{ selectedCli.zona || '—' }}</div>
                <div v-if="selectedCli.nota"><strong>Nota:</strong> {{ selectedCli.nota || '—' }}</div>
            </v-card>

            <v-btn block color="#42A5F5" class="mt-n2 white--text" :disabled="!selectedCli || guardando || cargando"
                @click="seleccionarCliente">
                <v-icon left>mdi-cart</v-icon>
                {{ guardando ? 'Cargando...' : 'Continuar con Pedido' }}
            </v-btn>

            <v-btn block text color="#26A69A" class="mt-2" @click="abrirCrearCliente">
                <v-icon left>mdi-account-plus</v-icon>
                Crear Nuevo Cliente
            </v-btn>

        </v-card>

        <nuevo_cli v-if="dial_crear_cliente" 
            @cierra="dial_crear_cliente = false" 
            @actualizar="onClienteCreado($event)"
            :cliente_selecto="null" />
    </v-dialog>
</template>

<script>
import { colClientes } from '../../../db_firestore'
import store from '@/store/index'
import nuevo_cli from '@/views/clientes/agrega_cliente'

export default {
    name: 'BuscaClientesPedido',
    components: {
        nuevo_cli
    },
    props: {
        sede: { type: String, default: '' }
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
            _pauseFilter: false,
            dial_crear_cliente: false
        }
    },

    created() {
        this.filtrados = this.todos
    },
    
    watch: {
        busca_p(q) {
            if (this._pauseFilter) return
            const v = this.norm(q)
            if (!v) { 
                this.filtrados = this.todos; 
                return 
            }

            this.filtrados = this.todos.filter(row =>
                row._nNombre.includes(v) ||
                row._nId.includes(v) ||
                row._nNota.includes(v)
            )
        },

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
                        label,
                        _nId: this.norm(id),
                        _nNombre: this.norm(nombre),
                        _nNota: this.norm(nota),
                    }
                })
                
                if (!this.busca_p) this.filtrados = this.todos
                
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
                this.cargando = true

                const liviano = this.todos.find(c => c.id === id)
                if (liviano) {
                    this.selectedCli = { 
                        id: liviano.id, 
                        documento: liviano.id,
                        ...liviano 
                    }
                }

                try {
                    const docCache = await colClientes().doc(String(id)).get()
                    if (docCache.exists) {
                        const data = docCache.data()
                        this.selectedCli = { 
                            id: docCache.id, 
                            documento: docCache.id,
                            ...data 
                        }
                        console.log('Cliente seleccionado:', this.selectedCli)
                    }
                } catch (e) {
                    console.error('Error leyendo Firestore:', e)
                }

            } catch (e) {
                console.error('Error en selección:', e)
            } finally {
                this._pauseFilter = false
                this.cargando = false
            }
        },

        seleccionarCliente() {
            if (!this.selectedCli) return
            
            this.$emit('seleccionar', this.selectedCli)
            this.cierra()
        },
        
        abrirCrearCliente() {
            this.dial_crear_cliente = true
        },

        async onClienteCreado(clienteNuevo) {
            this.dial_crear_cliente = false
            if (clienteNuevo && (clienteNuevo.id || clienteNuevo.documento)) {
                try {
                    this.cargando = true
                    const docId = String(clienteNuevo.documento || clienteNuevo.id || '').trim()
                    
                    const docSnap = await colClientes().doc(docId).get()
                    if (docSnap.exists) {
                        const data = docSnap.data()
                        this.selectedCli = {
                            id: docSnap.id,
                            documento: docSnap.id,
                            ...data
                        }
                        this.selectedId = docSnap.id
                        store.commit('dialogosnackbar', 'Cliente creado y seleccionado')
                    } else {
                        this.selectedCli = {
                            id: docId,
                            documento: docId,
                            ...clienteNuevo
                        }
                        this.selectedId = docId
                    }
                } catch (e) {
                    console.error('Error obteniendo cliente recién creado:', e)
                    this.selectedCli = clienteNuevo
                    this.selectedId = clienteNuevo.documento || clienteNuevo.id
                } finally {
                    this.cargando = false
                }
            }
        },
        
        cierra() {
            this.dial = false
            this.$emit('cerrar')
        },
    }
}
</script>

<style scoped>
.text-subtitle-2 {
    font-size: 13px;
}
</style>