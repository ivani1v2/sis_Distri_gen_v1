<template>
    <v-dialog v-model="dial" max-width="500px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <span class="white--text">Configuración Impresión Host</span>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>
        <v-card class="pa-4">
            <v-card-subtitle class="text-center pb-0 mb-2 mt-n1">
                <v-chip :color="config_activa ? 'green' : 'grey'" dark small>
                    {{ config_activa ? '✓ Configurado' : 'Sin configurar' }}
                </v-chip>
            </v-card-subtitle>

            <v-card-text>
                <v-row dense>
                    <v-col cols="8">
                        <v-text-field dense outlined v-model="config.ip_dispositivo" label="IP del Dispositivo"
                            placeholder="192.168.1.17"></v-text-field>
                    </v-col>
                    <v-col cols="4">
                        <v-text-field dense outlined v-model="config.puerto_dispositivo" label="Puerto"
                            placeholder="8090" type="number"></v-text-field>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n4">
                        <v-text-field dense outlined v-model="config.nombre_impresora" label="Nombre de Impresora"
                            placeholder="POS-80-Series"></v-text-field>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n4">
                        <v-text-field dense outlined v-model="config.token" label="Token de Seguridad"
                            placeholder="1234"></v-text-field>
                    </v-col>
                </v-row>

                <v-divider class="my-3 mt-n2"></v-divider>

                <v-row dense>
                    <v-col cols="6">
                        <v-btn block color="primary" :loading="probando" @click="probarConexion"
                            :disabled="!config.ip_dispositivo">
                            <v-icon left>mdi-lan-connect</v-icon>
                            Probar Conexión
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn block color="success" :loading="guardando" @click="guardarConfiguracion"
                            :disabled="!config.ip_dispositivo">
                            <v-icon left>mdi-content-save</v-icon>
                            Guardar
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row dense class="mt-2">
                    <v-col cols="12">
                        <v-btn block color="orange" dark @click="descargarBridge">
                            <v-icon left>mdi-download</v-icon>
                            Descargar Bridge
                        </v-btn>
                    </v-col>
                </v-row>

                <v-alert v-if="mensaje" :type="tipoMensaje" dense class="mt-3 mb-0" dismissible @input="mensaje = ''">
                    {{ mensaje }}
                </v-alert>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { nuevoCampoUsuario, buscarUsuarios } from '../../db';
import store from '@/store/index';

export default {
    data() {
        return {
            dial: false,
            config: {
                ip_dispositivo: '',
                puerto_dispositivo: 8090,
                nombre_impresora: 'POS-80-Series',
                token: '1234'
            },
            probando: false,
            guardando: false,
            mensaje: '',
            tipoMensaje: 'info',
            linkDescarga: 'https://firebasestorage.googleapis.com/v0/b/sis-distribucion.firebasestorage.app/o/programas%2FDomotica-Print-Bridge-Setup-1.0.4.exe?alt=media&token=d9c37771-8d7a-4d9d-8322-ab4eab910753'
        };
    },
    computed: {
        config_activa() {
            return this.config.ip_dispositivo && this.config.nombre_impresora;
        },
        tokenUsuario() {
            return store.state.permisos?.token || '';
        }
    },
    async created() {
        await this.cargarConfiguracion();
        this.dial = true;
    },
    methods: {
        async cargarConfiguracion() {
            try {
                if (!this.tokenUsuario) return;

                const snapshot = await buscarUsuarios(this.tokenUsuario).once('value');
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.config_impresion_host) {
                        this.config = { ...this.config, ...data.config_impresion_host };
                    }
                }
            } catch (error) {
                console.error("Error al cargar configuración:", error);
            }
        },
        async guardarConfiguracion() {
            try {
                if (!this.tokenUsuario) {
                    this.mostrarMensaje('No se encontró token de usuario', 'error');
                    return;
                }

                if (!this.config.ip_dispositivo) {
                    this.mostrarMensaje('Ingrese la IP del dispositivo', 'warning');
                    return;
                }

                this.guardando = true;
                await nuevoCampoUsuario(this.tokenUsuario, 'config_impresion_host', {
                    ip_dispositivo: this.config.ip_dispositivo,
                    puerto_dispositivo: parseInt(this.config.puerto_dispositivo) || 8090,
                    nombre_impresora: this.config.nombre_impresora || 'POS-80-Series',
                    token: this.config.token || '1234'
                });

                if (store.state.permisos) {
                    store.state.permisos.config_impresion_host = { ...this.config };
                }

                this.mostrarMensaje('Configuración guardada correctamente', 'success');
                store.commit('dialogosnackbar', 'Configuración de impresión host guardada');

            } catch (error) {
                console.error("Error al guardar:", error);
                this.mostrarMensaje('Error al guardar: ' + error.message, 'error');
            } finally {
                this.guardando = false;
            }
        },
        async probarConexion() {
            if (!this.config.ip_dispositivo) {
                this.mostrarMensaje('Ingrese la IP del dispositivo', 'warning');
                return;
            }

            this.probando = true;
            this.mensaje = '';

            try {
                const puerto = this.config.puerto_dispositivo || 8090;
                const BRIDGE_URL = `http://${this.config.ip_dispositivo}:${puerto}/bridge-pdf`;
                const response = await fetch(BRIDGE_URL, {
                    method: 'HEAD',
                    mode: 'no-cors',
                });
                this.mostrarMensaje(' Conexión exitosa al bridge', 'success');
                setTimeout(() => {
                    window.open(BRIDGE_URL, '_blank', 'width=500,height=400');
                }, 500);

            } catch (error) {
                console.error('Error probando conexión:', error);
                const puerto = this.config.puerto_dispositivo || 8090;
                const BRIDGE_URL = `http://${this.config.ip_dispositivo}:${puerto}/bridge-pdf`;
                const ventana = window.open(BRIDGE_URL, '_blank', 'width=500,height=400');
                if (!ventana) {
                    this.mostrarMensaje('No se pudo conectar. Verifica bloqueadores de ventanas.', 'error');
                } else {
                    this.mostrarMensaje('Se abrió ventana del bridge. Verifica manualmente.', 'info');

                    setTimeout(() => {
                        try {
                            if (ventana.location.href.includes('bridge-pdf')) {
                                this.mostrarMensaje('Bridge detectado y funcionando', 'success');
                            } else {
                                this.mostrarMensaje('Bridge puede no estar instalado o corriendo', 'warning');
                            }
                        } catch (e) {
                            this.mostrarMensaje('Bridge detectado (página cargada)', 'success');
                        }
                    }, 2000);
                }
            } finally {
                this.probando = false;
            }
        },
        descargarBridge() {
            const link = document.createElement("a");
            link.href = this.linkDescarga;
            link.download = "Domotica-Print-Bridge-Setup-1.0.4.exe";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.mostrarMensaje('Descarga iniciada. Instala el bridge en la PC con IP ' + this.config.ip_dispositivo, 'info');
        },
        mostrarMensaje(texto, tipo) {
            this.mensaje = texto;
            this.tipoMensaje = tipo;
            setTimeout(() => {
                if (this.mensaje === texto) {
                    this.mensaje = '';
                }
            }, 5000);
        },
        cierra() {
            this.$emit('cierra', false);
        }
    }
};
</script>