<template>
    <v-dialog v-model="dial" max-width="800px" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-icon large color="green" @click="nuevo()">mdi-plus</v-icon>
            </v-system-bar>
        </div>
        <v-card>
            <v-simple-table fixed-header height="50vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">Empresa</th>
                            <th class="text-left">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td style="font-size:75%;">{{ item.ruc }} - {{ item.nombre }}</td>
                            <td>
                                <v-btn icon small @click="seleccionarEmpresa(item)">
                                    <v-icon color="blue">mdi-domain</v-icon>
                                </v-btn>
                                <v-btn class="ml-6" icon small @click="elimina_multiempresas(item.id)">
                                    <v-icon color="red">mdi-delete</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <!-- Diálogo de nueva empresa -->
        <v-dialog v-model="dialog" max-width="600px">
            <v-card>
                <v-container>
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-text-field outlined dense v-model="ruc" type="number" append-icon="mdi-magnify"
                                @click:append="BuscarDocumento()" @keyup.enter="BuscarDocumento()"
                                label="RUC"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field outlined dense v-model="name" label="Empresa"></v-text-field>
                        </v-col>
                    </v-row>
                </v-container>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="dialog = false">Cancelar</v-btn>
                    <v-btn color="blue darken-1" text @click="guarda_empresa()">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Tabla de sedes -->
        <v-card v-if="empresaSeleccionada">
            <v-divider class="my-3"></v-divider>
            <v-card-title class="subtitle-1">
                Sedes de: <strong class="ml-2">{{ empresaSeleccionada.nombre }}</strong>
                <v-spacer></v-spacer>
                <v-btn icon small @click="agrega_sede">
                    <v-icon color="green">mdi-plus</v-icon>
                </v-btn>
            </v-card-title>
            <v-simple-table dense>
                <thead>
                    <tr>
                        <th>Nombre de Sede</th>
                        <th>Base de Datos</th>
                        <th>Tipo</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(sede, index) in empresaSeleccionada.sedes" :key="index">
                        <td>
                            {{ sede.codigo }} - {{ sede.nombre }}
                            <v-icon v-if="sede.principal" small color="yellow darken-2" class="ml-2">mdi-star</v-icon>
                        </td>
                           <td>{{ sede.base }}</td>
                        <td>{{ sede.tipo }}</td>
                        <td>
                            <v-icon small color="green" @click="marcarComoPrincipal(index)">mdi-star-outline</v-icon>
                            <v-icon small color="red" class="ml-2" @click="elimina_sede(index)">mdi-delete</v-icon>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>

        <!-- NUEVO: Diálogo para agregar sede -->
        <v-dialog v-model="dialogSede" max-width="540px" persistent>
            <v-card>
                <v-card-title class="subtitle-2">Agregar sede / vendedor</v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row dense>
                                    <v-col cols="12">
                                <v-text-field
                                    v-model="sedeForm.codigo"
                                    outlined dense
                                    label="Codigo"
                                    autocomplete="off"
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="sedeForm.nombre"
                                    outlined dense
                                    label="Nombre"
                                    autocomplete="off"
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="sedeForm.base"
                                    outlined dense
                                    label="Base de datos"
                                    autocomplete="off"
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-select
                                    v-model="sedeForm.tipo"
                                    :items="['sede', 'vendedor']"
                                    outlined dense
                                    label="Tipo"
                                />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="cancelar_agrega_sede">Cancelar</v-btn>
                    <v-btn color="success" text @click="confirmar_agrega_sede">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- FIN NUEVO -->
    </v-dialog>
</template>

<script>
import { all_multiEmpresas, nueva_multiEmpresa, elimina_multiEmpresa } from '../../db'
import store from '@/store/index'
import axios from 'axios'

export default {
    data() {
        return {
            dial: false,
            dialog: false,
            desserts: [],
            name: '',
            ruc: '',
            empresaSeleccionada: null,

            // NUEVO: estado del diálogo y formulario de sede
            dialogSede: false,
            sedeForm: {
                codigo:'',
                nombre: '',
                base: '',
                tipo: null, // 'sede' | 'vendedor'
            },
        }
    },
    created() {
        this.dial = true
    },
    mounted() {
        all_multiEmpresas().on("value", this.onDataChange);
    },
    beforeDestroy() {
        all_multiEmpresas().off("value", this.onDataChange);
    },
    computed: {
        listafiltrada() {
            return this.desserts
        }
    },
    methods: {
        async marcarComoPrincipal(index) {
            this.empresaSeleccionada.sedes.forEach((s, i) => {
                s.principal = i === index;
            });
            await nueva_multiEmpresa(this.empresaSeleccionada.id, this.empresaSeleccionada);
        },
        onDataChange(items) {
            let array = [];
            items.forEach((item) => {
                let key = item.key;
                let data = item.val();
                data.key = key;
                if (!data.sedes) data.sedes = [];
                array.push(data);
            });
            this.desserts = array;
        },
        async guarda_empresa() {
            if (!confirm('¿Seguro de guardar?')) return;
            store.commit("dialogoprogress");
            const array = {
                id: this.ruc,
                ruc: this.ruc,
                nombre: this.name,
                sedes: [],
            };
            await nueva_multiEmpresa(array.id, array);
            this.dialog = false;
            store.commit("dialogoprogress");
        },
        nuevo() {
            this.dialog = true;
        },
        cierra() {
            this.$emit('cierra', false);
        },
        BuscarDocumento() {
            if (this.ruc.length == 11) {
                store.commit("dialogoprogress");
                const token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d';
                axios
                    .get(`https://apiperu.dev/api/ruc/${this.ruc}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        this.llenardatos(response.data.data);
                        store.commit("dialogoprogress");
                    })
                    .catch(() => {
                        store.commit("dialogoprogress");
                        store.commit('dialogosnackbar', "DOCUMENTO INVÁLIDO");
                    });
            } else {
                store.commit('dialogosnackbar', "DOCUMENTO INVÁLIDO");
            }
        },
        llenardatos(data) {
            this.name = data.nombre_o_razon_social;
        },
        seleccionarEmpresa(item) {
            this.empresaSeleccionada = item;
        },

        // ===== CAMBIO SOLICITADO: ya no prompts =====
        agrega_sede() {
            if (!this.empresaSeleccionada) {
                store.commit('dialogosnackbar', 'Selecciona una empresa primero');
                return;
            }
            this.resetSedeForm();
            this.dialogSede = true;
        },
        cancelar_agrega_sede() {
            this.dialogSede = false;
        },
        async confirmar_agrega_sede() {
            const {codigo, nombre, base, tipo } = this.sedeForm;
            if (!nombre || !base || !tipo) {
                store.commit('dialogosnackbar', 'Completa nombre, base y tipo');
                return;
            }
            const nuevaSede = {
                codigo,
                nombre,
                base,
                tipo,        // almacenamos el tipo seleccionado
                principal: false
            };
            this.empresaSeleccionada.sedes.push(nuevaSede);
            try {
                store.commit("dialogoprogress");
                await nueva_multiEmpresa(this.empresaSeleccionada.id, this.empresaSeleccionada);
                this.dialogSede = false;
                this.resetSedeForm();
            } finally {
                store.commit("dialogoprogress");
            }
        },
        resetSedeForm() {
            this.sedeForm = { codigo:'',nombre: '', base: '', tipo: null };
        },
        // ===== FIN CAMBIO =====

        async elimina_sede(index) {
            if (confirm("¿Deseas eliminar esta sede?")) {
                this.empresaSeleccionada.sedes.splice(index, 1);
                await nueva_multiEmpresa(this.empresaSeleccionada.id, this.empresaSeleccionada);
            }
        },
        async elimina_multiempresas(id) {
            if (!confirm('¿Deseas eliminar esta empresa?')) return;

            try {
                store.commit("dialogoprogress");
                await elimina_multiEmpresa(id);
                store.commit("dialogosnackbar", "Empresa eliminada correctamente");

                // Refrescar la lista
                this.empresaSeleccionada = null;
                this.desserts = this.desserts.filter(emp => emp.id !== id);
            } catch (error) {
                store.commit("dialogosnackbar", "Error al eliminar empresa");
                console.error(error);
            } finally {
                store.commit("dialogoprogress");
            }
        }
    }
}
</script>
