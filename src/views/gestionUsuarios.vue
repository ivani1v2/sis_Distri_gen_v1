<template>
    <div mb-5 class="pa-6">
        <v-btn v-if="false" color="success mb-1" small block @click.prevent="modificarpermisos">Crear permisos</v-btn>
        <v-btn color="success mb-1" small block @click.prevent="dialog = !dialog">Crear usuario</v-btn>
        <v-simple-table class="elevation-1 mt-2" fixed-header height="65vh" dense>
            <template v-slot:default>
                <thead>

                    <tr>
                        <th class="text-left">
                            NOMBRE
                        </th>
                        <th class="text-left">
                            Codigo
                        </th>
                        <th class="text-left">
                            BaseDatos
                        </th>
                        <th class="text-left">
                            Correo
                        </th>
                        <th class="text-left">
                            Accion
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in desserts" :key="item.token">
                        <td>{{ item.nombre }}</td>
                        <td>{{ item.codigo }}</td>
                        <td>{{ item.bd }}</td>
                        <td>{{ item.correo }}</td>
                        <td>
                            <v-row class="text-center">
                                <v-col cols="6">
                                    <v-icon @click="bloquear(item, false)" color="red"
                                        v-if="item.bloqueo">mdi-wifi-off</v-icon>
                                    <v-icon @click="bloquear(item, true)" color="green"
                                        v-if="!item.bloqueo">mdi-wifi-check</v-icon>
                                </v-col>
                                <v-col cols="6">
                                    <v-icon class="ml-4" @click="item_selecto = item, dial_sett = true"
                                        color="red">mdi-cog-refresh</v-icon>
                                </v-col>
                            </v-row>

                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>
        <v-dialog v-model="dial_sett" max-width="520px" persistent>
            <v-card class="mx-auto">
                <v-toolbar flat dense>
                    <v-avatar size="36" class="mr-3">
                        <v-icon color="primary">mdi-account-cog</v-icon>
                    </v-avatar>

                    <div class="d-flex flex-column">
                        <span class="subtitle-2 font-weight-medium">Editar usuario</span>
                        <span class="caption grey--text">
                            {{ (item_selecto && item_selecto.correo) ? item_selecto.correo : 'sin-correo' }}
                        </span>
                    </div>

                    <v-spacer></v-spacer>

                    <v-chip x-small label class="mr-2"
                        :color="(item_selecto && item_selecto.bloqueo) ? 'red lighten-4' : 'green lighten-4'">
                        <v-icon left small :color="(item_selecto && item_selecto.bloqueo) ? 'red' : 'green'">
                            {{ (item_selecto && item_selecto.bloqueo) ? 'mdi-wifi-off' : 'mdi-wifi-check' }}
                        </v-icon>
                        {{ (item_selecto && item_selecto.bloqueo) ? 'Bloqueado' : 'Activo' }}
                    </v-chip>

                    <v-btn icon @click="dial_sett = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <v-divider></v-divider>

                <v-card-text class="pt-4">
                    <v-form ref="formSett" v-model="validSett" lazy-validation>
                        <v-row dense>
                            <v-col cols="12">
                                <v-text-field outlined dense v-model="item_selecto.nombre" label="Nombre"
                                    :rules="[v => !!v || 'Requerido']" required />
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field outlined dense v-model="item_selecto.codigo" label="Código"
                                    :rules="[v => !!v || 'Requerido']" required />
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field outlined dense v-model="item_selecto.bd" label="Base de datos" disabled />
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="px-4 pb-4">
                    <v-btn text @click="dial_sett = false">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="info" class="mr-2" @click="cargaPermisos()">
                        <v-icon left small>mdi-shield-key</v-icon> Gestionar Permisos
                    </v-btn>
                    <v-btn color="success" @click="guardar_permisos()">
                        <v-icon left small>mdi-content-save</v-icon> Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>



        <v-dialog v-model="dialog" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="mx-auto" color="white">
                <v-card-text>
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-text-field v-model="nombre" label="NOMBRE" required></v-text-field>
                        <v-text-field v-model="email" label="E-mail" required suffix="@domotica.com"></v-text-field>

                        <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1"
                            label="Contraseña" hint="Min 8 caracteres" counter
                            @click:append="show1 = !show1"></v-text-field>
                    </v-form>

                </v-card-text>
                <v-card-actions>
                    <v-btn color="success" block @click.prevent="crearUsuario()">Creausuario</v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

    </div>
</template>

<script>
import {
    nuevoUsuario,
    allUsuarios,
    borra_usuario,
    nuevoCampoUsuario,

} from '../db'
import axios from "axios";
import store from '@/store/index'
import firebase from 'firebase'
export default {

    data() {
        return {
            dial_contra: false,
            token: '',
            nombre: '',
            correo: '',
            pass: '',
            dialog: false,
            valid: true,
            desserts: [],
            permisosususario: [],
            dial_sett: false,
            validSett: true,
            item_selecto: {},
            nueva_contra: '',
            password: '',
            rules: {
                required: value => !!value || 'Required.',
                min: v => v.length >= 8 || 'Min 8 characters',
                emailMatch: () => (`The email and password you entered don't match`),
            },
            email: '',
            show1: false,
            dial_bd: false,
            bd_antigua: '',
            bd_nueva: '',
            dial_tienda: false,
            tienda: ''
        }
    },
    mounted() {
        allUsuarios().orderByChild('ruc').equalTo(Number(store.state.baseDatos.ruc_asociado)).on("value", this.onDataChange);
        // allUsuarios().on("value", this.onDataChange);
    },
    beforeDestroy() {
        allUsuarios().off("value", this.onDataChange);
    },
    methods: {
        async bloquear(user, value) {
            // user: objeto del v-for (item), value: true = bloquear, false = desbloquear
            if (!user || !user.token) {
                this.$store?.commit?.('dialogosnackbar', 'Usuario inválido');
                return;
            }

            // Evitar bloquear administradores
            if (user.es_admin) {
                this.$store?.commit?.('dialogosnackbar', 'No se puede bloquear un administrador');
                return;
            }

            // Si no hay cambios, salir
            if (user.bloqueo === value) return;

            // Actualización optimista del estado local
            const prev = user.bloqueo;
            if (typeof user.bloqueo === 'undefined') {
                // Asegura reactividad si la propiedad no existía
                this.$set(user, 'bloqueo', value);
            } else {
                user.bloqueo = value;
            }

            try {
                store.commit("dialogoprogress");
                // Persiste el cambio
                await nuevoCampoUsuario(user.token, 'bloqueo', value);
                // (Opcional) Guarda timestamp del último cambio
                await nuevoCampoUsuario(user.token, 'bloqueo_at', Date.now());

                this.$store?.commit?.(
                    'dialogosnackbar',
                    value ? 'Usuario bloqueado' : 'Usuario activado'
                );
            } catch (e) {
                console.error(e);
                // Revertir si falló
                user.bloqueo = prev;
                this.$store?.commit?.('dialogosnackbar', 'No se pudo actualizar el estado de bloqueo');
            } finally {
                store.commit("dialogoprogress");
            }
        },

        async graba_campo() {
            var item = this.item_selecto
            store.commit("dialogoprogress")
            await nuevoCampoUsuario(item.token, 'tienda', this.tienda)
            store.commit("dialogoprogress")
            this.dial_tienda = false
            this.dial_sett = false
        },

        onDataChange(items) {
            this.desserts = []
            let array = [];
            items.forEach((item) => {
                let data = item.val();
                array.push(data);
            });

            this.desserts = array;
        },
        async guardar_permisos() {
            if (!this.$refs.formSett) return;
            const ok = await this.$refs.formSett.validate();
            if (!ok) {
                this.$store?.commit?.('dialogosnackbar', 'Completa los campos requeridos');
                return;
            }

            const u = this.item_selecto || {};
            if (!u.token) {
                this.$store?.commit?.('dialogosnackbar', 'Usuario inválido');
                return;
            }

            try {
                store.commit("dialogoprogress");
                // Guarda nombre y código (bd es solo lectura en el diálogo)
                await Promise.all([
                    nuevoCampoUsuario(u.token, 'nombre', u.nombre || ''),
                    nuevoCampoUsuario(u.token, 'codigo', u.codigo || '')
                ]);

                this.$store?.commit?.('dialogosnackbar', 'Datos guardados correctamente');
                this.dial_sett = false;
            } catch (e) {
                console.error(e);
                this.$store?.commit?.('dialogosnackbar', 'Error al guardar cambios');
            } finally {
                store.commit("dialogoprogress");
            }
        },

        cargaPermisos() {
            var items = this.item_selecto
            this.$router.push({
                path: "/accesos_usuarios/" + items.token
            })
        },

        async crearUsuario() {
            if (this.email && this.password) {
                store.commit("dialogoprogress")
                var token = this.create_UUID()
                var array = {
                    token: token,
                    nombre: this.nombre,
                    correo: this.email + "@domotica.com",
                    pass: this.password,
                    bd: store.state.baseDatos.bd,
                    ruc: Number(store.state.baseDatos.ruc_asociado)
                }
                console.log(array)
                await nuevoUsuario(token, array)
                this.dialog = false
                this.nombre = ''
                this.crearUsuarios()
            } else {

            }
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid.substring(20);
        },

        crearUsuarios() {
            firebase.auth().createUserWithEmailAndPassword(this.email + "@domotica.com", this.password)
                .then(user => {
                    store.commit("dialogoprogress")
                    this.$router.push({
                        name: 'panel'
                    })
                }).catch(error => {
                    store.commit("dialogoprogress")
                    alert('error interno, comuniquese con administrador')
                })

        },
        modificarpermisos() {

            for (var i = 0; i < this.desserts.length; i++) {
                console.log(this.desserts[i].token)
                nuevoCampoUsuario(this.desserts[i].token, "crea_producto", true)
            }

            //nuevoUsuario(this.token,array)
        }
    }

}
</script>
