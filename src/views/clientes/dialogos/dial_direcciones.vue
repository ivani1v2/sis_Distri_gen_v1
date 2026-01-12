<template>
    <v-dialog v-model="show" max-width="750" persistent>
        <v-card class="rounded-lg elevation-8">
            <v-toolbar dense flat color="indigo" dark>
                <v-icon left>mdi-map-marker-multiple</v-icon>
                <v-toolbar-title class="font-weight-medium">
                    Direcciones de entrega
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip v-if="direcciones.length" small color="white" text-color="indigo" class="mr-2 font-weight-bold">
                    <v-icon left small>mdi-map-marker</v-icon>
                    {{ direcciones.length }} dirección(es)
                </v-chip>
                <v-btn icon @click="cerrar" title="Cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="py-2 px-4 grey lighten-5" v-if="cliente">
                <div class="caption font-weight-bold grey--text text--darken-3">CLIENTE:</div>
                <div class="subtitle-2 font-weight-medium indigo--text text--darken-2">
                    {{ cliente.documento }} • {{ cliente.nombre }}
                </div>
            </v-card-text>

            <v-card-text class="pt-4 pb-0">
                <div v-if="cargando" class="text-center my-8">
                    <v-progress-circular indeterminate color="indigo"></v-progress-circular>
                    <div class="caption mt-2 text--secondary">Cargando direcciones del cliente...</div>
                </div>

                <v-alert v-else-if="error" type="error" dense class="mb-4">
                    <v-icon left>mdi-alert-circle</v-icon> {{ error }}
                </v-alert>

                <v-alert v-else-if="!direcciones.length" type="info" prominent text class="mb-4">
                    <v-icon left>mdi-information</v-icon> Este cliente no tiene direcciones registradas para la venta.
                </v-alert>

                <template v-if="!$vuetify.breakpoint.xsOnly && direcciones.length">
                    <v-simple-table dense class="elevation-1 rounded-lg">
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th style="width:50px;" class="text-center">Principal</th>
                                    <th>Dirección</th>
                                    <th style="width: 20%;">Referencia</th>
                                    <th style="width: 25%;">Ubicación Geográfica</th>
                                    <th style="width:100px;" class="text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(dir, i) in direcciones" :key="i" @click="seleccionar(dir)"
                                    class="direccion-row">
                                    <td class="text-center">
                                        <v-icon v-if="dir.principal" small color="deep-orange"
                                            title="Dirección principal">
                                            mdi-star
                                        </v-icon>
                                    </td>
                                    <td class="font-weight-medium">{{ dir.direccion }}</td>
                                    <td class="caption text--secondary">{{ dir.referencia || 'N/A' }}</td>
                                    <td class="caption">
                                        {{ nombreDist(dir) }} / {{ nombreProv(dir) }}
                                        <div v-if="dir.ubigeo" class="grey--text text--darken-1 mt-n1">
                                            ({{ dir.ubigeo }})
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <v-btn small color="success" @click.stop="seleccionar(dir)"
                                            class="font-weight-bold">
                                            <v-icon left small>mdi-check-bold</v-icon>
                                            Usar
                                        </v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </template>

                <template v-else-if="direcciones.length">
                    <v-list dense class="py-0">
                        <v-list-item v-for="(dir, i) in direcciones" :key="i" @click="seleccionar(dir)"
                            class="my-1 elevation-1 rounded-lg">
                            <v-list-item-icon class="mr-3">
                                <v-icon :color="dir.principal ? 'deep-orange' : 'indigo'">
                                    {{ dir.principal ? 'mdi-star-circle' : 'mdi-map-marker' }}
                                </v-icon>
                            </v-list-item-icon>

                            <v-list-item-content>
                                <v-list-item-title class="wrap font-weight-medium">
                                    {{ dir.direccion }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="wrap caption text--secondary mt-1">
                                    <span v-if="dir.referencia" class="font-weight-medium mr-1">{{ dir.referencia
                                        }}</span>
                                    ({{ nombreDist(dir) }} - {{ nombreProv(dir) }})
                                    <span v-if="dir.ubigeo" class="ml-1 indigo--text text--lighten-3"> • {{ dir.ubigeo
                                        }}</span>
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action>
                                <v-btn icon small color="success" title="Seleccionar">
                                    <v-icon>mdi-check</v-icon>
                                </v-btn>
                            </v-list-item-action>
                        </v-list-item>
                    </v-list>
                </template>
            </v-card-text>

            <v-card-actions class="pt-4 pb-3">
                <v-spacer></v-spacer>
                <v-btn color="grey darken-1" text @click="cerrar">
                    <v-icon left>mdi-close-box-outline</v-icon>
                    Cerrar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
// 👇 igual que tu otro diálogo: leemos desde colClientes
import { colClientes } from '../../../db_firestore'

export default {
    name: 'DialogDireccionesCliente',
    props: {
        // v-model del diálogo
        value: { type: Boolean, default: false },
        // id del cliente (RUC/DNI)
        clienteId: { type: String, required: true }
    },
    data() {
        return {
            cliente: null,
            cargando: false,
            error: null
        }
    },
    computed: {
        show: {
            get() {
                return this.value
            },
            set(val) {
                this.$emit('input', val)
            }
        },
        direcciones() {
            return this.cliente?.direcciones || []
        }
    },
    watch: {
        // cuando se abre el diálogo, carga el cliente
        show(nv) {
            if (nv) {
                this.cargarCliente()
            }
        },
        clienteId() {
            if (this.show) {
                this.cargarCliente()
            }
        }
    },
    methods: {
        async cargarCliente() {
            try {
                this.error = null
                this.cargando = true

                const id = String(this.clienteId || '').trim()
                if (!id) {
                    this.error = 'Id de cliente inválido.'
                    this.cliente = null
                    return
                }

                let doc = null
                console.log(id)
                // 1) Intento rápido desde caché (igual patrón que tu otro diálogo)
                try {
                    doc = await colClientes().doc(id).get()
                } catch (e) {
                    // si falla cache, seguimos abajo con server
                    console.warn('Cache cliente no disponible, leyendo desde servidor…', e)
                }

                // 2) Si no hay doc o no existe, prueba desde servidor
                if (!doc || !doc.exists) {
                    doc = await colClientes().doc(id).get()
                }

                if (!doc.exists) {
                    this.error = 'No se encontró el cliente.'
                    this.cliente = null
                    return
                }

                this.cliente = { id: doc.id, ...doc.data() }
            } catch (e) {
                console.error('Error cargando cliente en dialog-direcciones:', e)
                this.error = 'Error al cargar los datos del cliente.'
                this.cliente = null
            } finally {
                this.cargando = false
            }
        },

        seleccionar(dir) {
            if (!dir) return
            this.$emit('seleccion', dir)
            this.show = false
        },

        cerrar() {
            this.show = false
        },

        nombreDep(dir) {
            return dir && dir.departamento
                ? (typeof dir.departamento === 'object' ? dir.departamento.nombre : dir.departamento)
                : ''
        },
        nombreProv(dir) {
            return dir && dir.provincia
                ? (typeof dir.provincia === 'object' ? dir.provincia.nombre : dir.provincia)
                : ''
        },
        nombreDist(dir) {
            return dir && dir.distrito
                ? (typeof dir.distrito === 'object' ? dir.distrito.nombre : dir.distrito)
                : ''
        }
    }
}
</script>

<style scoped>
/* Asegura que las direcciones largas se ajusten en cualquier elemento de lista o tabla */
.wrap {
    white-space: normal !important;
    word-break: break-word;
}

/* Estilo para dar efecto visual de selección en la tabla (Desktop) */
.direccion-row:hover {
    background-color: #e8eaf6; /* Indigo lighten-5 */
    transition: background-color 0.2s;
}

/* Asegura que los íconos de lista tengan espacio adecuado en móvil */
.v-list-item__icon {
    margin-top: 8px !important;
    margin-bottom: 8px !important;
}
</style>