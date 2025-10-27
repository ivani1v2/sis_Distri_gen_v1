<template>
    <v-dialog v-model="dial" max-width="560px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon v-if="true" large color="red" @click="ver_impresoras">mdi-printer-wireless</v-icon>
                <v-spacer></v-spacer>
                <v-icon v-if="true" large color="blue" @click="actualizar">mdi-refresh</v-icon>
            </v-system-bar>
        </div>
        <v-card class="pa-1">
            <v-card-text>
                <v-col>
                    <v-text-field readonly dense v-model="ip_servidor" label="IP HOST IMPRESORA"></v-text-field>
                </v-col>
                <v-simple-table dense>
                    <thead>
                        <tr>
                            <th>Nombre de la Impresora</th>
                            <th>Tipo</th>
                            <th>Accion</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="impresoras.length">
                            <tr v-for="(printer, index) in impresoras" :key="index">
                                <td>{{ printer.deviceId }}</td>
                                <td>
                                    <v-select class="mt-3 mb-n2" outlined :items="tiposImpresora" dense
                                        v-model="printer.tipo" label="Selecciona tipo"
                                        @change="guardarCambio(index)"></v-select>
                                </td>
                                <td>
                                    <v-icon color="red" @click="elimina(printer)">mdi-close</v-icon>
                                </td>
                            </tr>
                        </template>
                        <tr v-else>
                            <td colspan="2" class="text-center">No hay impresoras disponibles</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card-text>
        </v-card>
        <v-dialog v-model="dial_impresoras" max-width="400px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dial_impresoras = !dial_impresoras">mdi-close</v-icon>

                    <h3 class=" justify-center">
                        Impresoras Disponibles
                    </h3>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>
                <v-simple-table fixed-header max-width="70vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th>Nombre de la Impresora</th>
                                <th>ID de Dispositivo</th>

                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="(printer, index) in imp_disponibles" :key="index"
                                @click="seleccionar_imp(printer)">
                                <td>{{ printer.name }}</td>
                                <td>{{ printer.deviceId }}</td>

                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script>
import {
    all_serv_imp,
    guarda_serv_imp,
    elimina
} from '../../db';
import store from '@/store/index';
import axios from "axios";
export default {
    data() {
        return {
            dial_impresoras: false,
            dial: false,
            ip_servidor: '',
            impresoras: [],
            tiposImpresora: ["Caja1"], // Opciones
        };
    },
    async created() {
        await this.actualizar();
        this.dial = true;
    },

    methods: {
        async guardarCambio(index) {
            try {
                const updatedPrinter = this.impresoras[index];
                console.log("Actualizando impresora:", updatedPrinter);
                await guarda_serv_imp("impresoras", this.impresoras); // Actualiza la base de datos local
            } catch (error) {
                console.error("Error al guardar el cambio de tipo:", error);
                alert("❌ Error al guardar el cambio de tipo.");
            }
        },
        async elimina(data) {
            if (confirm('esta seguro de eliminar?')) {
                store.commit("dialogoprogress")
                this.impresoras = this.impresoras.filter((printer) => printer.deviceId !== data.deviceId);
                await guarda_serv_imp('impresoras', this.impresoras)
                store.commit("dialogoprogress")
            }
        },
        async seleccionar_imp(data) {
            store.commit("dialogoprogress")
            console.log(data)
            this.impresoras.push({
                deviceId: data.deviceId,
                name: data.name,
                tipo: 'Caja1'
            })
            await guarda_serv_imp('impresoras', this.impresoras)
            store.commit("dialogoprogress")
            this.actualizar()
            this.dial_impresoras = false
        },
        async ver_impresoras() {
            try {
                store.commit("dialogoprogress")
                this.obtenerInfoServidor()
                const response = await axios.get("http://localhost:3030/api/impresoras");
                console.log(response)
                this.imp_disponibles = response.data.map((printer) => ({
                    name: printer.name,
                    deviceId: printer.deviceId,
                    tipo: null, // Inicialmente vacío
                }));
                store.commit("dialogoprogress")
                this.dial_impresoras = true
            } catch (error) {
                console.error("Error al sincronizar impresoras:", error);
                alert("❌ Error al sincronizar impresoras");
            }
        },
        async obtenerInfoServidor() {
            try {
                const response = await axios.get("http://localhost:3030/api/server-info");
                this.ip_servidor = response.data.ip + ':' + response.data.port
                await guarda_serv_imp('ip', this.ip_servidor)
            } catch (error) {
                console.error("Error al obtener información del servidor:", error);
                alert("❌ Error al obtener información del servidor");
            }
        },
        async descargar() {
            const url = "https://firebasestorage.googleapis.com/v0/b/factura-peru.appspot.com/o/repositorio%2FDomotica%20Sis%20Setup%201.0.0.exe?alt=media&token=719caca8-993e-4168-9026-59e285106120";
            const link = document.createElement("a");
            link.href = url;
            link.download = "Domotica_Sis_Setup_1.0.0.exe";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        async actualizar() {
            try {
                store.commit("dialogoprogress");
                const snapshot = await all_serv_imp().once('value');
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    this.ip_servidor = data.ip || 'No disponible';
                    this.impresoras = data.impresoras || [];
                } else {
                    this.ip_servidor = 'No disponible';
                    this.impresoras = [];
                }
            } catch (error) {
                console.error("Error al actualizar los datos:", error);
                this.ip_servidor = 'Error al obtener datos';
                this.impresoras = [];
            } finally {
                store.commit("dialogoprogress");
            }
        },
        cierra() {
            this.$emit('cierra', false);
        }
    }
};
</script>
