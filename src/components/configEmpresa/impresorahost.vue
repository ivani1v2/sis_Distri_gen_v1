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
        <v-card class="pa-2">
            <v-card-subtitle class="text-center pb-0 mb-2 mt-n1">
                <v-switch v-model="activo" inset dense color="success"
                    :label="activo ? 'Impresión Host: ACTIVADA' : 'Impresión Host: DESACTIVADA'" />
            </v-card-subtitle>

            <v-card-text>
                <v-row dense>
                    <v-col cols="8">
                        <v-text-field :disabled="!activo" dense outlined v-model="config.ip_dispositivo"
                            label="IP del Dispositivo" placeholder="192.168.1.17"></v-text-field>
                    </v-col>
                    <v-col cols="4">
                        <v-text-field :disabled="!activo" dense outlined v-model="config.puerto_dispositivo"
                            label="Puerto" placeholder="8090" type="number"></v-text-field>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n4">
                        <v-text-field :disabled="!activo" dense outlined v-model="config.nombre_impresora"
                            label="Nombre de Impresora" placeholder="POS-80-Series"></v-text-field>
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" class="mt-n4">
                        <v-text-field :disabled="!activo" dense outlined v-model="config.token"
                            label="Token de Seguridad" placeholder="1234"></v-text-field>
                    </v-col>
                </v-row>

                <v-divider class="my-3 mt-n2"></v-divider>

                <v-row dense>
                    <v-col cols="12" md="6" sm="12">
                        <v-btn small block color="primary" :loading="probando" @click="probarConexion"
                            :disabled="!config.ip_dispositivo">
                            <v-icon left>mdi-lan-connect</v-icon>
                            Probar Conexión
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="6" sm="12">
                        <v-btn small block color="success" :loading="guardando" @click="guardarConfiguracion"
                            :disabled="!config.ip_dispositivo">
                            <v-icon left>mdi-content-save</v-icon>
                            Guardar
                        </v-btn>
                    </v-col>
                    <v-col cols="12" md="12" sm="12">
                        <v-btn small block color="orange" dark @click="descargarBridge">
                            <v-icon left>mdi-download</v-icon>
                            Descargar Driver
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
import jsPDF from 'jspdf';
import { nuevoCampoUsuario, } from '../../db';
import store from '@/store/index';

export default {
    data() {
        return {
            activo: false,
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
            linkDescarga: 'https://firebasestorage.googleapis.com/v0/b/sis-distribucion.firebasestorage.app/o/programas%2FDomotica-Print-Bridge-Setup-1.0.5.exe?alt=media&token=7785a7cd-2d42-4f47-8980-cb4bb07df569'
        };
    },
    computed: {
        config_activa() {
            return this.config.ip_dispositivo && this.config.nombre_impresora;
        },
        permiso_user() {
            return store.state.permisos || '';
        }
    },
    async created() {
        console.log(this.permiso_user)
        await this.cargarConfiguracion();
        this.dial = true;
    },
    methods: {
        async cargarConfiguracion() {
            try {
                const p = this.permiso_user || {};

                // ✅ estado del switch: si no existe, false
                this.activo = !!p.permite_impresion_host;

                // ✅ cargar config con defaults + lo guardado
                const saved = p.config_impresion_host || {};
                this.config = {
                    ip_dispositivo: saved.ip_dispositivo || '',
                    puerto_dispositivo: Number(saved.puerto_dispositivo || 8090),
                    nombre_impresora: saved.nombre_impresora || 'POS-80-Series',
                    token: saved.token || '1234'
                };
            } catch (error) {
                console.error("Error al cargar configuración:", error);
            }
        },

        async guardarConfiguracion() {
            try {
                const tokenUser = this.permiso_user?.token;
                if (!tokenUser) {
                    this.mostrarMensaje('No se encontró token de usuario', 'error');
                    return;
                }

                this.guardando = true;

                // ✅ 1) guardar el switch SIEMPRE
                await nuevoCampoUsuario(tokenUser, 'permite_impresion_host', !!this.activo);

                // ✅ si está desactivado, no obligues IP ni guardes config (opcional)
                if (!this.activo) {
                    // actualiza store
                    if (store.state.permisos) {
                        store.state.permisos.permite_impresion_host = false;
                    }
                    this.mostrarMensaje('Impresión Host desactivada', 'success');
                    store.commit('dialogosnackbar', 'Impresión host desactivada');
                    return;
                }

                // ✅ 2) si está activado, valida campos mínimos
                if (!this.config.ip_dispositivo) {
                    this.mostrarMensaje('Ingrese la IP del dispositivo', 'warning');
                    return;
                }

                const payload = {
                    ip_dispositivo: String(this.config.ip_dispositivo || '').trim(),
                    puerto_dispositivo: parseInt(this.config.puerto_dispositivo) || 8090,
                    nombre_impresora: String(this.config.nombre_impresora || 'POS-80-Series').trim(),
                    token: String(this.config.token || '1234').trim()
                };

                await nuevoCampoUsuario(tokenUser, 'config_impresion_host', payload);

                // ✅ actualiza store (config + permiso)
                if (store.state.permisos) {
                    store.state.permisos.permite_impresion_host = true;
                    store.state.permisos.config_impresion_host = { ...payload };
                }

                this.mostrarMensaje('Configuración guardada correctamente', 'success');
                store.commit('dialogosnackbar', 'Configuración de impresión host guardada');

            } catch (error) {
                console.error("Error al guardar:", error);
                this.mostrarMensaje('Error al guardar: ' + (error?.message || error), 'error');
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

                // ✅ ventana grande
                const ventana = window.open(
                    BRIDGE_URL,
                    "_blank",
                    "width=1100,height=820,left=80,top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
                );

                if (!ventana) {
                    this.mostrarMensaje('Permite ventanas emergentes para probar impresión.', 'error');
                    return;
                }

                // ✅ Genera PDF de prueba (grande)
                const buffer = await this.generarPdfPruebaArrayBuffer({
                    titulo: "CONEXIÓN EXITOSA ✅",
                    ip: this.config.ip_dispositivo,
                    puerto,
                    impresora: this.config.nombre_impresora || 'POS-80-Series',
                });

                const token = this.config.token || '1234';

                const meta = {
                    bd: store?.state?.baseDatos?.bd || "",
                    usuario: store?.state?.permisos?.nombre || "",
                    tipo: "test_print",
                    ts: Date.now(),
                };

                const mensaje = {
                    type: "PRINT_PDF",
                    token,
                    printer: this.config.nombre_impresora || "POS-80-Series",
                    meta,
                    pdf: buffer
                };

                // ✅ igual que tu método: reintenta hasta que el bridge esté listo
                const ok = await this.postMessageCuandoListo(ventana, mensaje, buffer);

                if (ok) {
                    this.mostrarMensaje('Conexión exitosa. Se envió PDF de prueba al bridge.', 'success');
                    // opcional: cerrar luego
                    // setTimeout(() => { try { ventana.close(); } catch (_) {} }, 4000);
                } else {
                    this.mostrarMensaje('Se abrió el bridge, pero no respondió a tiempo. Intenta otra vez.', 'warning');
                }

            } catch (error) {
                console.error('Error probando conexión:', error);
                this.mostrarMensaje('No se pudo conectar. Verifica IP, puerto y que el bridge esté corriendo.', 'error');
            } finally {
                this.probando = false;
            }
        },
        postMessageCuandoListo(ventana, mensaje, buffer) {
            return new Promise((resolve) => {
                const start = Date.now();
                const timeoutMs = 6000;   // tiempo total de intento
                const intervalMs = 250;

                const timer = setInterval(() => {
                    try {
                        // Si la ventana se cerró
                        if (ventana.closed) {
                            clearInterval(timer);
                            resolve(false);
                            return;
                        }

                        // Intento de envío
                        ventana.postMessage(mensaje, "*", [buffer]);
                        clearInterval(timer);
                        resolve(true);

                    } catch (e) {
                        // sigue intentando hasta timeout
                        if (Date.now() - start > timeoutMs) {
                            clearInterval(timer);
                            resolve(false);
                        }
                    }
                }, intervalMs);
            });
        },
        async generarPdfPruebaArrayBuffer({
            titulo,
            ip,
            puerto,
            impresora,
            modo = "ticket80" // "ticket80" | "a4_izq"
        }) {
            // ===== Config =====
            const left = 3;      // margen izquierdo (mm)
            const top = 4;       // margen superior
            const line = 5;      // altura línea base
            const small = 9;
            const normal = 10;
            const big = 12;

            // ===== Tamaños =====
            // Ticket: 80mm ancho, alto dinámico (ponemos un alto grande y ya)
            // jsPDF permite format personalizado: [w, h]
            const fmt = (modo === "ticket80")
                ? [80, 200]     // 80mm x 200mm (suficiente para prueba)
                : "a4";         // A4

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: fmt
            });

            // En A4 queremos todo pegado a la izquierda (sin centrar)
            // En ticket también.
            let y = top;

            const write = (txt, size = normal, bold = false) => {
                doc.setFont("helvetica", bold ? "bold" : "normal");
                doc.setFontSize(size);
                doc.text(String(txt), left, y);
                y += line;
            };

            const hr = () => {
                doc.setLineWidth(0.2);
                doc.line(left, y, (modo === "ticket80" ? 80 - left : 210 - left), y); // 210mm ancho A4
                y += 4;
            };

            // ===== Contenido compacto =====
            write(titulo, big, true);          // sin centrado
            write("PRUEBA IMPRESIÓN HOST", normal, true);
            hr();

            write(`IP: ${ip}`, normal, false);
            write(`PUERTO: ${puerto}`, normal, false);

            // en ticket, el nombre de impresora puede ser largo
            const imp = String(impresora || "").trim();
            if (imp.length > 28 && modo === "ticket80") {
                write(`IMP: ${imp.slice(0, 28)}`, small, false);
                write(`     ${imp.slice(28, 56)}`, small, false);
            } else {
                write(`IMP: ${imp}`, normal, false);
            }

            hr();

            // Fecha y BD pegado a la izquierda
            write(`FECHA: ${new Date().toLocaleString()}`, small, false);
            write(`USU: ${(store?.state?.permisos?.nombre || "").toString().slice(0, 22)}`, small, false);
            write(`BD: ${(store?.state?.baseDatos?.bd || "").toString()}`, small, false);

            hr();
            write("✅ SI IMPRIME ESTO:", normal, true);
            write("CONEXIÓN OK + ENVÍO PDF OK", small, false);

            // ===== Recorte para ticket (opcional) =====
            // Ajusta el alto para que no quede mucho blanco (solo en ticket)
            if (modo === "ticket80") {
                const finalH = Math.min(Math.max(y + 6, 70), 200); // entre 70 y 200
                // jsPDF no puede cambiar format después, pero al imprimir suele ignorar el blanco extra.
                // Para minimizar blanco, mantenemos contenido corto.
            }

            return doc.output("arraybuffer");
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