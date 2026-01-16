<template>
    <div class="pa-6 mb-5">
        <!-- CABECERA / CONTENEDOR PRINCIPAL -->
        <v-card class="elevation-2">
            <v-toolbar flat dense>
                <v-toolbar-title class="subtitle-1 font-weight-bold">
                    Gestión de usuarios
                </v-toolbar-title>

                <v-spacer></v-spacer>

                <!-- Contador de usuarios -->
                <v-chip small label class="mr-3" v-if="desserts && desserts.length">
                    <v-icon left small>mdi-account-group</v-icon>
                    {{ desserts.length }} usuarios
                </v-chip>

                <!-- Botón oculto (mantengo funcionalidad original) -->
                <v-btn v-if="false" color="success" small class="mr-2" @click.prevent="modificarpermisos">
                    <v-icon left small>mdi-shield-key</v-icon>
                    Crear permisos
                </v-btn>

                <!-- Crear usuario -->
                <v-btn color="success" small depressed @click.prevent="dialog = true">
                    <v-icon left small>mdi-account-plus</v-icon>
                    Crear usuario
                </v-btn>
            </v-toolbar>

            <v-divider></v-divider>

            <!-- TABLA DE USUARIOS -->
            <v-simple-table class="usuarios-table" fixed-header height="65vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">Nombre</th>
                            <th class="text-left">Código</th>
                            <th class="text-left">Base de datos</th>
                            <th class="text-left">Correo</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in desserts" :key="item.token">
                            <td class="user-cell">
                                <div class="font-weight-medium text-truncate">
                                    {{ item.nombre || 'Sin nombre' }}
                                </div>
                            </td>
                            <td class="user-cell">
                                <div class="text-truncate">
                                    {{ item.codigo || '-' }}
                                </div>
                            </td>
                            <td class="user-cell">
                                <div class="text-truncate">
                                    {{ item.bd || '-' }}
                                </div>
                            </td>
                            <td class="user-cell">
                                <div class="text-truncate">
                                    {{ item.correo || '-' }}
                                </div>
                            </td>
                            <td class="text-center acciones-cell">
                                <v-row dense align="center" justify="center" no-gutters class="acciones-row">
                                    <!-- Bloquear / Activar -->
                                    <v-col cols="4" class="text-center">
                                        <v-tooltip bottom>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-btn icon v-bind="attrs" v-on="on"
                                                    @click="bloquear(item, !item.bloqueo)" :disabled="item.es_admin">
                                                    <v-icon :color="item.bloqueo ? 'red' : 'green'">
                                                        {{ item.bloqueo ? 'mdi-wifi-off' : 'mdi-wifi-check' }}
                                                    </v-icon>
                                                </v-btn>
                                            </template>
                                            <span v-if="item.es_admin">
                                                Administrador (no se puede bloquear)
                                            </span>
                                            <span v-else>
                                                {{ item.bloqueo ? 'Activar usuario' : 'Bloquear usuario' }}
                                            </span>
                                        </v-tooltip>
                                    </v-col>

                                    <!-- Configuración -->
                                    <v-col cols="4" class="text-center">
                                        <v-tooltip bottom>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-btn icon v-bind="attrs" v-on="on"
                                                    @click="item_selecto = item; dial_sett = true">
                                                    <v-icon color="primary">mdi-cog-refresh</v-icon>
                                                </v-btn>
                                            </template>
                                            <span>Editar datos y permisos</span>
                                        </v-tooltip>
                                    </v-col>
                                    <v-col cols="4" class="text-center">
                                        <v-tooltip bottom>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-btn icon v-bind="attrs" v-on="on"
                                                    @click="toggleGps(item, !item.gps_activo)">
                                                    <v-icon :color="item.gps_activo ? 'blue' : 'grey'">
                                                        {{ item.gps_activo ? 'mdi-map-marker-radius' :
                                                        'mdi-map-marker-off' }}
                                                    </v-icon>
                                                </v-btn>
                                            </template>
                                            <span>
                                                {{ item.gps_activo ? 'Desactivar geolocalización' : 'Activar geolocalización' }}
                                            </span>
                                        </v-tooltip>
                                    </v-col>

                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <!-- DIALOGO EDITAR USUARIO -->
        <v-dialog v-model="dial_sett" max-width="520px" persistent>
            <v-card class="mx-auto">
                <v-toolbar flat dense>
                    <v-avatar size="36" class="mr-3">
                        <v-icon color="primary">mdi-account-cog</v-icon>
                    </v-avatar>

                    <div class="d-flex flex-column">
                        <span class="subtitle-2 font-weight-medium">Editar usuario</span>
                        <span class="caption grey--text">
                            {{ (item_selecto && item_selecto.correo) ? item_selecto.correo : 'sin correo' }}
                        </span>
                    </div>

                    <v-spacer></v-spacer>

                    <!-- Estado -->
                    <v-chip x-small label class="mr-2"
                        :color="(item_selecto && item_selecto.bloqueo) ? 'red lighten-4' : 'green lighten-4'">
                        <v-icon left small :color="(item_selecto && item_selecto.bloqueo) ? 'red' : 'green'">
                            {{ (item_selecto && item_selecto.bloqueo) ? 'mdi-wifi-off' : 'mdi-wifi-check' }}
                        </v-icon>
                        {{ (item_selecto && item_selecto.bloqueo) ? 'Bloqueado' : 'Activo' }}
                    </v-chip>

                    <v-btn icon @click="dial_sett = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-divider></v-divider>

                <v-card-text class="pt-4">
                    <v-form ref="formSett" v-model="validSett" lazy-validation>
                        <v-row dense>
                            <v-col cols="12">
                                <v-text-field outlined dense v-model="item_selecto.nombre" label="Nombre"
                                    :rules="[v => !!v || 'Requerido']" required hide-details="auto" />
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field outlined dense v-model="item_selecto.codigo" label="Código interno"
                                    :rules="[v => !!v || 'Requerido']" required hide-details="auto" />
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field outlined dense v-model="item_selecto.bd" label="Base de datos" disabled
                                    hide-details="auto" />
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>
     <v-card-actions class="px-4 pb-4">
            
                    <v-spacer></v-spacer>
              
                    <v-btn disabled small color="success" @click="dial_permitidos=!dial_permitidos">
                        <v-icon left small>mdi-content-save</v-icon>
                        Productos Permitidos
                    </v-btn>
                    
                </v-card-actions>
                <v-card-actions class="px-4 pb-4">
                    <v-btn text @click="dial_sett = false">Cancelar</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn small color="info" class="mr-2" @click="cargaPermisos()">
                        <v-icon left small>mdi-shield-key</v-icon>
                        permisos
                    </v-btn>
                    <v-btn small color="success" @click="guardar_permisos()">
                        <v-icon left small>mdi-content-save</v-icon>
                        Guardar
                    </v-btn>
                    
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- DIALOGO CREAR USUARIO -->
        <v-dialog v-model="dialog" max-width="460px">
            <v-card class="mx-auto">
                <v-toolbar flat dense color="primary" dark>
                    <v-toolbar-title class="subtitle-2">Nuevo usuario</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>

                <v-divider></v-divider>

                <v-card-text class="pt-4">
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-text-field v-model="nombre" label="Nombre" outlined dense required hide-details="auto" />

                        <v-text-field v-model="email" label="Usuario (sin @domotica.com)" outlined dense required
                            suffix="@domotica.com" hide-details="auto" />

                        <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'"
                            name="input-password" label="Contraseña" hint="Mínimo 8 caracteres" counter outlined dense
                            hide-details="auto" autocomplete="new-password" @click:append="show1 = !show1" />
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-btn color="success" block large @click.prevent="crearUsuario()">
                        <v-icon left small>mdi-content-save</v-icon>
                        Crear usuario
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_lista :vendedor="item_selecto"  v-if="dial_permitidos" @cerrar="dial_permitidos = false" />
    </div>
</template>


<script>
import {
    nuevoUsuario,
    allUsuarios,
    borra_usuario,
    nuevoCampoUsuario,
    lee_multiEmpresas,
    nueva_multiEmpresa,
} from '../db'
import axios from "axios";
import store from '@/store/index'
import dial_lista from '../components/dialogos/dial_lista_prod_vende.vue'
import firebase from 'firebase'
export default {
    components: {
        dial_lista
    },
    data() {
        return {
            dial_permitidos:false,
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
        async toggleGps(user, value) {
            if (!user || !user.token) {
                this.$store?.commit?.('dialogosnackbar', 'Usuario inválido');
                return;
            }

            const prev = user.gps_activo;

            if (typeof user.gps_activo === 'undefined') {
                this.$set(user, 'gps_activo', value);
            } else {
                user.gps_activo = value;
            }

            try {
                store.commit("dialogoprogress");
                await nuevoCampoUsuario(user.token, 'gps_activo', value);

                this.$store?.commit?.(
                    'dialogosnackbar',
                    value ? 'Geolocalización activada para este usuario' : 'Geolocalización desactivada para este usuario'
                );
            } catch (e) {
                console.error(e);
                user.gps_activo = prev;
                this.$store?.commit?.('dialogosnackbar', 'No se pudo actualizar la geolocalización');
            } finally {
                store.commit("dialogoprogress");
            }
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

                // Actualizar también en multi_empresas
                await this.actualizarNombreEnMultiEmpresas(u);

                this.$store?.commit?.('dialogosnackbar', 'Datos guardados correctamente');
                this.dial_sett = false;
            } catch (e) {
                console.error(e);
                this.$store?.commit?.('dialogosnackbar', 'Error al guardar cambios');
            } finally {
                store.commit("dialogoprogress");
            }
        },
        async actualizarNombreEnMultiEmpresas(usuario) {
            if (!usuario || !usuario.codigo || !usuario.nombre) return;
            
            const ruc = usuario.ruc || store.state.baseDatos?.ruc_asociado;
            if (!ruc) return;

            try {
                const snapshot = await lee_multiEmpresas(ruc).once('value');
                const empresa = snapshot.val();

                if (!empresa || !Array.isArray(empresa.sedes)) return;
                const index = empresa.sedes.findIndex(s => s.codigo === usuario.codigo);
                if (index === -1) return;
                empresa.sedes[index].nombre = usuario.nombre;

                await nueva_multiEmpresa(ruc, empresa);
                console.log('Nombre actualizado en multi_empresas para códigoOOO:', usuario.codigo);
            } catch (error) {
                console.error('Error al actualizar multi_empreSaaas:', error);
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
                nuevoCampoUsuario(this.desserts[i].token, "productos_edita_id", false)
            }

            //nuevoUsuario(this.token,array)
        }
    }

}
</script>
<style scoped>
.usuarios-table thead th {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding-top: 8px !important;
    padding-bottom: 8px !important;
}

.usuarios-table tbody tr:hover {
    background-color: #f5f5f5;
}

.user-cell {
    max-width: 220px;
}

.user-cell .text-truncate {
    max-width: 220px;
}

.acciones-cell {
    width: 150px;
}

.acciones-row {
    min-width: 120px;
}
</style>