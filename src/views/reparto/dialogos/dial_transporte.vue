<template>
    <v-dialog v-model="dialogo" max-width="550" persistent>
        <v-card class="rounded-lg">
            <v-toolbar dense color="info" dark>
                <v-icon left>mdi-truck</v-icon>
                <v-toolbar-title>Asignar Transporte</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-autocomplete v-model="transporteData.usuario_id" :items="listaUsuariosTransporte"
                            item-text="nombre" item-value="id" label="Usuario Transportista" outlined dense
                            clearable prepend-inner-icon="mdi-account" @change="onUsuarioChange">
                            <template v-slot:item="{ item }">
                                <v-list-item-content>
                                    <v-list-item-title>{{ item.nombre }}</v-list-item-title>
                                    <v-list-item-subtitle v-if="item.email">{{ item.email }}</v-list-item-subtitle>
                                </v-list-item-content>
                            </template>
                        </v-autocomplete>
                    </v-col>

                    <v-col cols="12">
                        <v-text-field v-model="transporteData.nombre_conductor" label="Conductor" outlined dense
                            readonly prepend-inner-icon="mdi-account-tie">
                            <template v-slot:append>
                                <v-btn icon small color="info" @click="dial_agrega_c = true">
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                        <div v-if="transporteData.dni_conductor" class="caption grey--text mt-n3 mb-2">
                            DNI: {{ transporteData.dni_conductor }}
                        </div>
                    </v-col>

                    <v-col cols="12">
                        <v-text-field v-model="transporteData.placa" label="Vehiculo (Placa)" outlined dense
                            readonly prepend-inner-icon="mdi-car">
                            <template v-slot:append>
                                <v-btn icon small color="info" @click="dial_agrega_v = true">
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-col>

                    <v-col cols="12">
                        <v-textarea v-model="transporteData.observacion" label="Observacion" outlined dense rows="2"
                            prepend-inner-icon="mdi-note-text"></v-textarea>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-btn text color="error" @click="quitarAsignacion" :loading="loading">
                    <v-icon left>mdi-delete</v-icon>
                    Quitar Asignacion
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="info" @click="guardarAsignacion" :loading="loading">
                    <v-icon left>mdi-content-save</v-icon>
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>

        <vehiculos v-if="dial_agrega_v" @cierre="dial_agrega_v = false" @agrega_lista="onVehiculoSeleccionado" />
        <choferes v-if="dial_agrega_c" @cierre="dial_agrega_c = false" @agrega_lista="onConductorSeleccionado" />
    </v-dialog>
</template>

<script>
import moment from "moment";
import { allUsuariosTransporte, guarda_transporte_reparto, obtener_transporte_reparto, eliminar_transporte_reparto } from "../../../db";
import vehiculos from '@/views/transporte/vehiculos';
import choferes from '@/views/transporte/choferes';

export default {
    name: "dial_transporte",
    components: {
        vehiculos,
        choferes
    },
    props: {
        value: {
            type: Boolean,
            default: false
        },
        repartoId: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            dialogo: false,
            loading: false,
            dial_agrega_v: false,
            dial_agrega_c: false,
            listaUsuariosTransporte: [],
            transporteData: {
                usuario_id: '',
                usuario_nombre: '',
                dni_conductor: '',
                nombre_conductor: '',
                placa: '',
                observacion: ''
            }
        };
    },
    watch: {
        value: {
            immediate: true,
            handler(val) {
                this.dialogo = val;
                if (val && this.repartoId) {
                    this.cargarDatos();
                }
            }
        },
        dialogo(val) {
            if (!val) {
                this.$emit('input', false);
            }
        }
    },
    methods: {
        async cargarDatos() {
            this.loading = true;
            try {
                const [snapUsuarios, snapTransporteActual] = await Promise.all([
                    allUsuariosTransporte().once('value'),
                    obtener_transporte_reparto(this.repartoId).once('value')
                ]);

                const usuarios = [];
                snapUsuarios.forEach(item => {
                    const usuario = item.val();
                    if (usuario.es_transporte === true) {
                        usuarios.push({
                            id: item.key,
                            nombre: usuario.nombre,
                            ...usuario
                        });
                    }
                });
                this.listaUsuariosTransporte = usuarios;

                const transporteActual = snapTransporteActual.val();
                if (transporteActual) {
                    this.transporteData = {
                        usuario_id: transporteActual.usuario_id || '',
                        usuario_nombre: transporteActual.usuario_nombre || '',
                        dni_conductor: transporteActual.dni_conductor || '',
                        nombre_conductor: transporteActual.nombre_conductor || '',
                        placa: transporteActual.placa || '',
                        observacion: transporteActual.observacion || ''
                    };
                } else {
                    this.resetTransporteData();
                }
            } catch (error) {
                console.error('Error al cargar datos de transporte:', error);
                this.$store.commit('dialogosnackbar', 'Error al cargar datos');
            } finally {
                this.loading = false;
            }
        },
        resetTransporteData() {
            this.transporteData = {
                usuario_id: '',
                usuario_nombre: '',
                dni_conductor: '',
                nombre_conductor: '',
                placa: '',
                observacion: ''
            };
        },
        onUsuarioChange(usuarioId) {
            const usuario = this.listaUsuariosTransporte.find(u => u.id === usuarioId);
            this.transporteData.usuario_nombre = usuario ? usuario.nombre : '';
        },
        onVehiculoSeleccionado(vehiculo) {
            this.transporteData.placa = vehiculo.placa || '';
            this.dial_agrega_v = false;
        },
        onConductorSeleccionado(conductor) {
            this.transporteData.dni_conductor = conductor.num_doc_conductor || '';
            this.transporteData.nombre_conductor = conductor.nom_conductor || '';
            this.dial_agrega_c = false;
        },
        async guardarAsignacion() {
            this.loading = true;
            try {
                const ahora = moment().format('YYYY-MM-DD HH:mm:ss');
                const dataGuardar = {
                    usuario_id: this.transporteData.usuario_id || '',
                    usuario_nombre: this.transporteData.usuario_nombre || '',
                    dni_conductor: this.transporteData.dni_conductor || '',
                    nombre_conductor: this.transporteData.nombre_conductor || '',
                    placa: this.transporteData.placa || '',
                    observacion: this.transporteData.observacion || '',
                    fecha_asignacion: ahora,
                    fecha_modificacion: ahora
                };

                await guarda_transporte_reparto(this.repartoId, dataGuardar);
                this.$store.commit('dialogosnackbar', 'Transporte asignado correctamente');
                this.$emit('guardado');
                this.cerrar();
            } catch (error) {
                console.error('Error al guardar transporte:', error);
                this.$store.commit('dialogosnackbar', 'Error al guardar');
            } finally {
                this.loading = false;
            }
        },
        async quitarAsignacion() {
            if (!this.repartoId) return;

            const confirmar = confirm('Estas seguro de que quieres quitar la asignacion de transporte? El reparto quedara visible para todos los usuarios.');
            if (!confirmar) return;

            this.loading = true;
            try {
                await eliminar_transporte_reparto(this.repartoId);
                this.$store.commit('dialogosnackbar', 'Asignacion eliminada correctamente');
                this.resetTransporteData();
                this.$emit('guardado');
                this.cerrar();
            } catch (error) {
                console.error('Error al eliminar transporte:', error);
                this.$store.commit('dialogosnackbar', 'Error al eliminar');
            } finally {
                this.loading = false;
            }
        },
        cerrar() {
            this.dialogo = false;
            this.$emit('input', false);
            this.$emit('cierre');
        }
    }
};
</script>
