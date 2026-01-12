<template>
    <div class="pa-4">
        <v-card class="elevation-4 rounded-lg">
            <v-card-title class="headline primary white--text">
                <v-icon large left>mdi-cogs</v-icon>
                Gestión de Integraciones del Sistema
            </v-card-title>
            <v-card-text class="mt-4">
                <v-row dense>
                    <!-- WHATSAPP API -->
                    <v-col cols="12" md="4">
                        <!-- CARD OPCIÓN 1 — BANNER SUPERIOR -->
                        <v-card outlined class="pa-0 fill-height d-flex flex-column rounded-lg">

                            <!-- Imagen de portada / banner -->
                            <v-img
                                src="https://firebasestorage.googleapis.com/v0/b/sis-distribucion.firebasestorage.app/o/imagenes%2FGemini_Generated_Image_qzyxddqzyxddqzyx.png?alt=media&token=a7b187bc-0393-4e69-a076-1787e17625e5"
                                height="140" class="rounded-t-lg" cover></v-img>

                            <!-- Contenido del card -->
                            <div class="pa-4 d-flex flex-column fill-height">

                                <!-- TÍTULO + SWITCH -->
                                <v-card-title
                                    class="subtitle-1 font-weight-bold d-flex justify-space-between pb-2 px-0">
                                    <div class="d-flex align-center">
                                        <v-icon color="green" left>mdi-whatsapp</v-icon>
                                        WhatsApp API Oficial
                                    </div>
                                    <v-switch disabled v-model="whatsapp.activo" dense hide-details class="mt-0 pt-0"></v-switch>
                                </v-card-title>

                                <v-divider class="mb-3"></v-divider>

                                <!-- DESCRIPCIÓN -->
                     <p class="body-2 mb-3 grey--text text--darken-1"> Conecta tu número de WhatsApp Business mediante la API oficial para enviar notificaciones, recordatorios de pago, promociones con imágenes, catálogos y mensajes automatizados. Activa bots inteligentes de venta, seguimiento y atención al cliente que trabajan 24/7, responden consultas, envían precios, toman pedidos y elevan tus conversiones sin esfuerzo. Una integración pensada para escalar tu negocio. </p>

                                <!-- CAMPOS (solo visibles si está activo) -->
                                <div v-if="whatsapp.activo" class="flex-grow-1">
                                    <v-text-field v-model="whatsapp.config.api_key" label="API Key / Token" outlined
                                        dense clearable hide-details="auto" class="mb-3"></v-text-field>

                                    <v-text-field v-model="whatsapp.config.numero_remitente"
                                        label="Número Remitente (+Cód. País)" outlined dense clearable
                                        hide-details="auto" class="mb-3"></v-text-field>

                                    <v-text-field v-model="whatsapp.config.endpoint" label="Webhook/API Endpoint URL"
                                        outlined dense clearable hide-details="auto" class="mb-3"></v-text-field>
                                </div>

                                <v-spacer></v-spacer>

                                <!-- ESTADO + BOTÓN FINAL -->
                                <div class="mt-auto pt-2">
                                    <v-alert :type="whatsapp.estado.tipo" dense text class="mt-3 mb-2">
                                        Estado: {{ whatsapp.estado.mensaje }}
                                    </v-alert>

                                    <v-btn :disabled="!whatsapp.activo || whatsapp.estado.tipo === 'success'" block
                                        color="primary" @click="testWhatsapp" :loading="whatsapp.loading">
                                        <v-icon left>mdi-flash</v-icon>
                                        Probar Conexión
                                    </v-btn>
                                </div>

                            </div>
                        </v-card>

                    </v-col>

                    <!-- IA -->
                    <v-col cols="12" md="4">
                        <v-card outlined class="pa-0 fill-height d-flex flex-column rounded-lg">

                            <!-- Imagen de portada / banner -->
                            <v-img src="https://firebasestorage.googleapis.com/v0/b/sis-distribucion.firebasestorage.app/o/imagenes%2FGemini_Generated_Image_4c47854c47854c47.png?alt=media&token=3eb8cae4-f19d-45c3-82ba-966daf93fc99" height="140" class="rounded-t-lg" cover></v-img>

                            <div class="pa-4 d-flex flex-column fill-height">

                                <!-- Título + Switch -->
                                <v-card-title
                                    class="subtitle-1 font-weight-bold d-flex justify-space-between pb-2 px-0">
                                    <div class="d-flex align-center">
                                        <v-icon color="purple" left>mdi-brain</v-icon>
                                        Inteligencia Artificial (IA)
                                    </div>
                                    <v-switch v-model="ia.activo" dense hide-details class="mt-0 pt-0"></v-switch>
                                </v-card-title>

                                <v-divider class="mb-3"></v-divider>

                                <!-- Descripción -->
                                <p class="body-2 mb-3 grey--text text--darken-1">
                                    Configura el motor de IA que potenciará tu sistema: respuestas automáticas,
                                    generación de textos, análisis de datos y soporte inteligente para tus usuarios.
                                    Ideal para automatizar tareas y mejorar la eficiencia operativa.
                                </p>

                                <!-- Controles solo si está activo -->
                                <div v-if="ia.activo" class="flex-grow-1">

                                    <v-select v-model="ia.config.modelo" :items="ia.modelosDisponibles"
                                        label="Modelo de IA" outlined dense hide-details="auto" class="mb-3"></v-select>

                                    <v-text-field v-model="ia.config.api_key" label="API Key (IA)" outlined dense
                                        clearable hide-details="auto" class="mb-3"></v-text-field>

                                    <v-slider v-model="ia.config.temperatura" label="Temperatura (Creatividad)"
                                        thumb-label="always" :min="0" :max="1" :step="0.1" class="mt-4 mb-0"></v-slider>

                                    <span class="caption grey--text d-block text-right">{{
                                        ia.config.temperatura.toFixed(1) }}</span>

                                </div>

                                <v-spacer></v-spacer>

                                <!-- Estado + Botón -->
                                <div class="mt-auto pt-2">
                                    <v-alert dense text :type="ia.estado.tipo" class="mt-3 mb-2">
                                        Resultado: {{ ia.estado.mensaje }}
                                    </v-alert>

                                    <v-btn :disabled="!ia.activo" block color="purple darken-1" @click="testIA"
                                        :loading="ia.loading">
                                        <v-icon left>mdi-robot</v-icon>
                                        Probar Conexión
                                    </v-btn>
                                </div>

                            </div>
                        </v-card>
                    </v-col>

                    <!-- TIENDA VIRTUAL -->
                    <v-col cols="12" md="4">
                        <!-- CARD TIENDA — BANNER SUPERIOR -->
                        <v-card outlined class="pa-0 fill-height d-flex flex-column rounded-lg">

                            <!-- Imagen de portada / banner -->
                            <v-img src="https://firebasestorage.googleapis.com/v0/b/sis-distribucion.firebasestorage.app/o/imagenes%2FGemini_Generated_Image_1nyu8v1nyu8v1nyu.png?alt=media&token=2424f7e4-dac2-4f14-9bd7-688ef4d403ec" height="140" class="rounded-t-lg" cover></v-img>

                            <div class="pa-4 d-flex flex-column fill-height">

                                <!-- Título + Switch -->
                                <v-card-title
                                    class="subtitle-1 font-weight-bold d-flex justify-space-between pb-2 px-0">
                                    <div class="d-flex align-center">
                                        <v-icon color="orange" left>mdi-storefront</v-icon>
                                        Tienda Virtual / E-commerce
                                    </div>
                                    <v-switch disabled v-model="tienda.activo" dense hide-details class="mt-0 pt-0"></v-switch>
                                </v-card-title>

                                <v-divider class="mb-3"></v-divider>

                                <!-- Descripción -->
                                <p class="body-2 mb-3 grey--text text--darken-1">
                                    Sincroniza tu sistema con una tienda virtual para gestionar productos, precios,
                                    stock, pedidos y actualizaciones en tiempo real. Perfecto para vender en línea
                                    sin duplicar trabajo.
                                </p>

                                <!-- Controles solo si está activo -->
                                <div v-if="tienda.activo" class="flex-grow-1">

                                    <v-text-field v-model="tienda.config.dominio_tienda"
                                        label="Dominio de la Tienda (URL)" outlined dense clearable hide-details="auto"
                                        class="mb-3"></v-text-field>

                                    <v-text-field v-model="tienda.config.token_api" label="Token de Acceso (API)"
                                        outlined dense clearable hide-details="auto" class="mb-3"></v-text-field>

                                    <v-switch disabled v-model="tienda.config.sincronizacion_automatica"
                                        label="Sincronización Automática Diaria" dense hide-details
                                        class="mt-4"></v-switch>

                                </div>

                                <v-spacer></v-spacer>

                                <!-- Estado + botón -->
                                <div class="mt-auto pt-2">
                                    <v-alert dense text :type="tienda.estado.tipo" class="mt-3 mb-2">
                                        Último estado: {{ tienda.estado.mensaje }}
                                    </v-alert>

                                    <v-btn :disabled="!tienda.activo" block color="orange darken-1" @click="testTienda"
                                        :loading="tienda.loading">
                                        <v-icon left>mdi-reload</v-icon>
                                        Probar Sincronización
                                    </v-btn>
                                </div>

                            </div>
                        </v-card>

                    </v-col>

                </v-row>
            </v-card-text>

            <v-divider></v-divider>


        </v-card>

        <!-- Diálogo de guardado -->
        <v-dialog v-model="dialogGuardar" max-width="400">
            <v-card>
                <v-toolbar color="success" dense dark>
                    <v-toolbar-title>Configuración Guardada</v-toolbar-title>
                </v-toolbar>
                <v-card-text class="py-4 text-center">
                    <v-icon color="success" size="60">mdi-check-circle-outline</v-icon>
                    <p class="mt-3">Los cambios en las integraciones han sido guardados correctamente.</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="dialogGuardar = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
// Usaremos un simulador de conexión para los métodos de prueba
const SIMULADOR = {
    // 80% éxito, 20% fallo
    esExitoso: () => Math.random() < 0.8,
    // Simula una respuesta de IA
    respuestaIA: (modelo) => `Análisis exitoso con ${modelo}. La temperatura de ${this.ia.config.temperatura} optimiza el tono de respuesta.`,
};

export default {
    name: 'ModuloIntegraciones',
    data: () => ({
        guardando: false,
        dialogGuardar: false,

        // Estado y Configuración de WhatsApp
        whatsapp: {
            activo: false,
            loading: false,
            config: {
                api_key: 'whapi-XXXX',
                numero_remitente: '+51900000000',
                endpoint: 'https://api.whatsapp.com/v1',
            },
            estado: { tipo: 'warning', mensaje: 'Sin configurar' }, // tipo: success, error, warning
        },

        // Estado y Configuración de Inteligencia Artificial (IA)
        ia: {
            activo: false,
            loading: false,
            modelosDisponibles: ['GPT-4', 'GPT-5', 'Gemini', 'Llama 3', 'Modelo Local', 'Otro'],
            config: {
                modelo: 'Gemini',
                api_key: 'gemini-api-XXXX',
                temperatura: 0.7, // Slider 0.0 a 1.0
            },
            estado: { tipo: 'warning', mensaje: 'Sin configurar' },
        },

        // Estado y Configuración de Tienda Virtual
        tienda: {
            activo: false,
            loading: false,
            config: {
                dominio_tienda: 'https://mitienda.com',
                token_api: 'store-token-XXXX',
                sincronizacion_automatica: true,
            },
            estado: { tipo: 'warning', mensaje: 'Sin configurar' }, // Muestra último estado
        },
    }),

    methods: {
        /**
         * @description Simula la prueba de conexión a WhatsApp API.
         */
        testWhatsapp() {
            if (!this.whatsapp.config.api_key || !this.whatsapp.config.endpoint) {
                this.whatsapp.estado = { tipo: 'error', mensaje: 'Rellene todos los campos' };
                return;
            }

            this.whatsapp.loading = true;
            this.whatsapp.estado = { tipo: 'info', mensaje: 'Probando conexión...' };

            setTimeout(() => {
                if (SIMULADOR.esExitoso()) {
                    this.whatsapp.estado = { tipo: 'success', mensaje: 'Conexión exitosa y activa' };
                } else {
                    this.whatsapp.estado = { tipo: 'error', mensaje: 'Error: Autenticación o endpoint falló' };
                }
                this.whatsapp.loading = false;
            }, 1500);
        },

        /**
         * @description Simula la prueba de conexión y generación de texto con la IA.
         */
        testIA() {
            if (!this.ia.config.api_key || !this.ia.config.modelo) {
                this.ia.estado = { tipo: 'error', mensaje: 'Rellene todos los campos' };
                return;
            }

            this.ia.loading = true;
            this.ia.estado = { tipo: 'info', mensaje: 'Analizando modelo...' };

            setTimeout(() => {
                if (SIMULADOR.esExitoso()) {
                    const mensaje = SIMULADOR.respuestaIA(this.ia.config.modelo);
                    this.ia.estado = { tipo: 'success', mensaje: mensaje };
                } else {
                    this.ia.estado = { tipo: 'error', mensaje: 'Error: Modelo no responde o API Key inválida' };
                }
                this.ia.loading = false;
            }, 2000);
        },

        /**
         * @description Simula la prueba de sincronización con la Tienda Virtual.
         */
        testTienda() {
            if (!this.tienda.config.dominio_tienda || !this.tienda.config.token_api) {
                this.tienda.estado = { tipo: 'error', mensaje: 'Rellene todos los campos' };
                return;
            }

            this.tienda.loading = true;
            this.tienda.estado = { tipo: 'info', mensaje: 'Iniciando sincronización...' };

            setTimeout(() => {
                if (SIMULADOR.esExitoso()) {
                    this.tienda.estado = { tipo: 'success', mensaje: `Sincronizado OK. ${Math.floor(Math.random() * 50) + 10} productos actualizados.` };
                } else {
                    this.tienda.estado = { tipo: 'error', mensaje: 'Error: Fallo al conectar con el dominio o token expirado.' };
                }
                this.tienda.loading = false;
            }, 1800);
        },

        /**
         * @description Guarda toda la configuración de las integraciones.
         */
        guardarConfiguracion() {
            this.guardando = true;

            // Lógica real para enviar this.whatsapp.config, this.ia.config, etc. al servidor
            console.log('Guardando configuración de WhatsApp:', this.whatsapp.config);
            console.log('Guardando configuración de IA:', this.ia.config);
            console.log('Guardando configuración de Tienda:', this.tienda.config);

            setTimeout(() => {
                this.guardando = false;
                this.dialogGuardar = true; // Muestra el diálogo de éxito
            }, 1000);
        },
    },

    watch: {
        // Al desactivar, resetear el estado de la prueba
        'whatsapp.activo'(newVal) {
            if (!newVal) this.whatsapp.estado = { tipo: 'warning', mensaje: 'Desactivado' };
            if (newVal && this.whatsapp.config.api_key) this.whatsapp.estado = { tipo: 'warning', mensaje: 'Sin probar' };
        },
        'ia.activo'(newVal) {
            if (!newVal) this.ia.estado = { tipo: 'warning', mensaje: 'Desactivado' };
            if (newVal && this.ia.config.api_key) this.ia.estado = { tipo: 'warning', mensaje: 'Sin probar' };
        },
        'tienda.activo'(newVal) {
            if (!newVal) this.tienda.estado = { tipo: 'warning', mensaje: 'Desactivado' };
            if (newVal && this.tienda.config.token_api) this.tienda.estado = { tipo: 'warning', mensaje: 'Sin probar' };
        },
    }
};
</script>

<style scoped>
/* Estilos para asegurar que las tarjetas de las integraciones se vean bien */
.v-card--outlined {
    border-width: 2px;
}

.headline {
    border-radius: 8px 8px 0 0 !important;
}
</style>