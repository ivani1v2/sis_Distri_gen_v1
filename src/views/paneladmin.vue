<template>
    <div class="pa-6">
        <!-- Acciones y búsqueda -->
        <v-btn v-if="false" x-small color="success" block @click="copiar_ruc">copiar</v-btn>
        <v-row class="mb-2" dense>
            <v-col cols="12" md="6">
                <v-btn x-small color="success" block @click="abreNueva">Nueva Empresa</v-btn>
                <div class="mt-2 d-flex align-center">
                    <v-chip x-small class="mr-2" color="grey darken-3" text-color="white" label>
                        Prueba: {{ totalPruebas }}
                    </v-chip>
                    <v-chip x-small class="mr-2" color="green" text-color="white" label>
                        Producción: {{ totalProduccion }}
                    </v-chip>
                    <v-chip x-small label>
                        Total: {{ desserts.length }}
                    </v-chip>
                </div>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field v-model.trim="buscarLocal" dense outlined clearable append-icon="mdi-magnify"
                    label="BUSCAR" @input="onBuscarInput" />
            </v-col>
        </v-row>

        <!-- Tabla -->
        <v-simple-table class="elevation-4" fixed-header height="70vh" dense>
            <thead>
                <tr>
                    <th class="text-left">BD</th>
                    <th class="text-left">EMPRESA</th>
                    <th class="text-left">Correo</th>
                    <th class="text-left">Prueba</th>
                    <th class="text-left">Acción</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in listaFiltrada" :key="item.key">
                    <td class="text-no-wrap" style="font-size:80%;">{{ item.bd }}</td>
                    <td style="font-size:80%;">{{ item.ruc }} - {{ item.name }}</td>
                    <td style="font-size:80%;">{{ item.usuario }}</td>
                    <td style="font-size:80%;">
                        <v-icon v-if="item.pruebas" color="warning" small>mdi-circle</v-icon>
                        <v-icon v-else color="success" small>mdi-circle</v-icon>
                    </td>
                    <td style="font-size:80%;">
                        <v-btn icon x-small color="green" @click="editarEmp(item)">
                            <v-icon small>mdi-lead-pencil</v-icon>
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>

        <!-- Diálogo -->
        <v-dialog v-model="dialog" :fullscreen="$vuetify.breakpoint.smAndDown"
            :max-width="$vuetify.breakpoint.smAndDown ? undefined : '1000px'" persistent scrollable
            transition="dialog-bottom-transition" eager>
            <v-card class="dialog-card">
                <v-toolbar dense flat class="sticky-top">
                    <v-toolbar-title class="text-subtitle-1">
                        {{ form.editar ? 'Editar Empresa' : 'Nueva Empresa' }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </v-toolbar>

                <!-- Área scrollable -->
                <v-card-text class="pa-2">
                    <v-form ref="frm" lazy-validation @submit.prevent="guardaEmpresa">
                        <v-container fluid class="pa-1">
                            <v-row dense>

                                <v-col cols="12">
                                    <div class="text-caption font-weight-bold grey--text mb-1">IDENTIFICACIÓN Y
                                        UBICACIÓN</div>
                                    <v-card outlined class="pa-3 mb-3">
                                        <v-row dense>
                                            <v-col cols="12" md="3">
                                                <v-text-field v-model.trim="form.ruc" label="RUC" type="number" dense
                                                    outlined hide-details append-icon="mdi-magnify"
                                                    :rules="[req, rucRule]" :disabled="cargando || form.editar"
                                                    @click:append="buscarDocumento" />
                                            </v-col>
                                            <v-col cols="12" md="5">
                                                <v-text-field v-model.trim="form.name" label="Razón Social" dense
                                                    outlined hide-details :rules="[req]" />
                                            </v-col>
                                            <v-col cols="12" md="4">
                                                <v-text-field v-model.trim="form.namecomercial" label="Nombre Comercial"
                                                    dense outlined hide-details />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model.trim="form.direccion" label="Dirección Fiscal"
                                                    dense outlined hide-details />
                                            </v-col>
                                            <v-col cols="4" md="2"><v-text-field v-model="form.departamento"
                                                    label="Dep." dense outlined hide-details /></v-col>
                                            <v-col cols="4" md="2"><v-text-field v-model="form.provincia" label="Prov."
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="4" md="2"><v-text-field v-model="form.distrito" label="Dist."
                                                    dense outlined hide-details /></v-col>
                                        </v-row>
                                    </v-card>
                                </v-col>

                                <v-col cols="12" md="7">
                                    <div class="text-caption font-weight-bold grey--text mb-1">CREDENCIALES Y SUNAT
                                    </div>
                                    <v-card outlined class="pa-3" height="100%">
                                        <v-row dense>
                                            <v-col cols="6"><v-text-field v-model="form.usuario" label="Usuario (Email)"
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="6">
                                                <v-text-field v-model="form.clave" label="Clave" dense outlined
                                                    hide-details :append-icon="verPass ? 'mdi-eye-off' : 'mdi-eye'"
                                                    :type="verPass ? 'text' : 'password'"
                                                    @click:append="verPass = !verPass" />
                                            </v-col>
                                            <v-col cols="6"><v-text-field v-model="form.usuariosol" label="Usuario SOL"
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="6"><v-text-field v-model="form.clavesol" label="Clave SOL"
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="6"><v-text-field v-model="form.nombrefirma" label="Nom. Firma"
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="6"><v-text-field v-model="form.passfirma" label="Pass Firma"
                                                    dense outlined hide-details /></v-col>
                                            <v-col cols="6"><v-text-field v-model="form.bd" label="Base de Datos" dense
                                                    outlined hide-details
                                                    @blur="form.bd = form.bd.toUpperCase()" /></v-col>
                                            <v-col cols="6"><v-text-field v-model="form.num_usuarios"
                                                    label="Límite Usuarios" dense outlined hide-details /></v-col>
                                        </v-row>
                                    </v-card>
                                </v-col>

                                <v-col cols="12" md="5">
                                    <div class="text-caption font-weight-bold grey--text mb-1">MÓDULOS ACTIVOS</div>
                                    <v-card outlined class="pa-3 grey lighten-5" height="100%">
                                        <v-row no-gutters>
                                            <v-col cols="6"><v-switch v-model="form.es_tienda" label="Es Tienda" dense
                                                    hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.transporte" label="Es Transp." dense
                                                    hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.pruebas" label="Modo Pruebas" dense
                                                    hide-details class="mt-0" color="error" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.multi_empresa" label="Multi-Empresa"
                                                    dense hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.kardex_avanzado" label="Kardex avanzado "
                                                    dense hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.mod_activos" label="modulo Activos" dense
                                                    hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.bigquery" label="BigQuery" dense
                                                    hide-details class="mt-0" color="primary" /></v-col>
                                            <v-col cols="6"><v-switch v-model="form.caja2" label="Caja V2" dense
                                                    hide-details class="mt-0" color="primary" /></v-col>
                                        </v-row>
                                    </v-card>
                                </v-col>

                            </v-row>
                        </v-container>
                    </v-form>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="sticky-bottom">
                    <v-spacer />
                    <v-btn text :disabled="cargando" @click="dialog = false">Cancelar</v-btn>
                    <v-btn color="primary" :loading="cargando" :disabled="cargando" type="submit" text
                        @click="$refs.frm?.validate() && guardaEmpresa()">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import {
    allEmpresas,
    nuevaEmpresa,
    nuevoUsuario,
} from '../db'
import firebase from 'firebase'
import axios from 'axios'
import store from '@/store/index'

export default {
    data: () => ({
        // UI
        dialog: false,
        cargando: false,
        verPass: false,

        // dataset
        desserts: [],

        // búsqueda (con debounce)
        buscarLocal: '',
        buscar: '',

        // form unificado
        form: {
            editar: false,
            name: '',
            namecomercial: '',
            ruc: '',
            departamento: '',
            provincia: '',
            distrito: '',
            direccion: '',
            ubigeo: '',
            anexo: '0000',
            usuario: '',
            clave: 'admin1234',
            usuariosol: 'DOMOTICA',
            clavesol: 'Domotica1234',
            nombrefirma: 'demo.pfx',
            passfirma: 'Domotica1234',
            PersonaID: '',
            Token: '',
            bd: '',
            restaurante: false,
            transporte: false,
            pruebas: false,
            caja2: true,
            multi_empresa: false,
            nom_sede: '',
            es_tienda: false,
            ruc_asociado: '',
            bigquery: false,
            kardex_avanzado: false,
            num_usuarios: ''
        },

        // reglas
        req: v => !!v || 'Requerido',
        rucRule: v => (v && String(v).length === 11) || 'RUC debe tener 11 dígitos',
    }),

    mounted() {
        allEmpresas().on('value', this.onDataChange)
    },
    beforeDestroy() {
        allEmpresas().off('value', this.onDataChange)
    },

    computed: {
        listaFiltrada() {
            const q = this.buscar.toLowerCase()
            if (!q) return this.ordenadas
            return this.ordenadas.filter(it =>
                (it.bd + it.ruc + it.name + it.usuario).toLowerCase().includes(q)
            )
        },
        ordenadas() {
            // estable: BD asc
            return [...this.desserts].sort((a, b) => (a.bd || '').localeCompare(b.bd || ''))
        },
        totalPruebas() {
            return this.desserts.filter(i => !!i.pruebas).length
        },
        totalProduccion() {
            return this.desserts.filter(i => !i.pruebas).length
        },
    },

    methods: {
        // --- debounce simple sin libs ---
        onBuscarInput() {
            clearTimeout(this._t)
            this._t = setTimeout(() => { this.buscar = this.buscarLocal }, 200)
        },

        onDataChange(snap) {
            const arr = []
            snap.forEach(ch => {
                const data = ch.val() || {}
                data.key = ch.key
                arr.push(data)
            })
            this.desserts = arr
        },

        resetFormDefaults() {
            Object.assign(this.form, {
                editar: false,
                name: '',
                namecomercial: '',
                ruc: '',
                departamento: '',
                provincia: '',
                distrito: '',
                direccion: '',
                ubigeo: '',
                anexo: '0000',
                usuario: '',
                clave: 'admin1234',
                usuariosol: 'DOMOTICA',
                clavesol: 'Domotica1234',
                nombrefirma: 'demo.pfx',
                passfirma: 'Domotica1234',
                PersonaID: '',
                Token: '',
                bd: '',
                restaurante: false,
                transporte: false,
                pruebas: false,
                caja2: true,
                multi_empresa: false,
                nom_sede: '',
                es_tienda: false,
                ruc_asociado: '',
                bigquery: false,
                kardex_avanzado: false,
                num_usuarios: ''
            })
        },

        abreNueva() {
            this.resetFormDefaults()
            this.dialog = true
        },

        editarEmp(data) {
            this.resetFormDefaults()
            Object.assign(this.form, { ...data, editar: true })
            this.dialog = true
        },

        async guardaEmpresa() {
            const ok = this.$refs.frm && this.$refs.frm.validate ? this.$refs.frm.validate() : true
            if (!ok) return

            // Validaciones claves
            if (!this.form.editar) {
                if (!this.form.bd) return alert('BD NO PUEDE SER VACÍA')
                const existe = this.desserts.find(it => it.bd === this.form.bd)
                if (existe) return alert('BD OCUPADA, REVISAR')
            }

            const payload = { ...this.form }
            delete payload.editar

            try {
                this.cargando = true
                store.commit('dialogoprogress')

                await nuevaEmpresa(payload.bd, payload)

                if (!this.form.editar) {
                    await this.crearUsuarioInicial()
                    await this.crearAuthFirebase()
                }

                this.dialog = false
            } catch (e) {
                console.error(e)
                alert('Error al guardar. Intente nuevamente.')
            } finally {
                this.cargando = false
                store.commit('dialogoprogress')
            }
        },

        async crearUsuarioInicial() {
            const token = this.createUUID()
            const usuario = {
                token,
                nombre: this.form.namecomercial,
                correo: this.form.usuario,
                pass: this.form.clave,
                bd: this.form.bd,
                moduloempresa: true,
                moduloproductos: true,
                productos_visualiza_stock: true,
                modulokardex: true,
                modulosunat: true,
                moduloclientes: true,
                clientes_edita: true,
                clientes_elimina: true,
                clientes_crea: true,
                modulocaja: true,
                caja_edita_cantidad: true,
                caja_edita_precio: true,
                modulocuentasxcobrar: true,
                modulocomprobantes: true,
                moduloordensalida: true,
                orden_crea: true,
                orden_anula: true,
                orden_edita: true,
                moduloreportes: true,
                reportes_comision: true,
                reportes_comprobantes: true,
                reportes_ranking: true,
                reportes_utilidad: true,
                reportes_operaciones: true,
                es_admin: true,
                es_master: true,
                ruc: Number(this.form.ruc || 0),
                num_usuarios: ''
            }
            await nuevoUsuario(usuario.token, usuario)
        },

        async crearAuthFirebase() {
            try {
                await firebase.auth().createUserWithEmailAndPassword(this.form.usuario, this.form.clave)
                this.$router.push({ name: 'panel' })
            } catch (e) {
                console.error(e)
                alert('Error creando usuario de acceso. Contacte al administrador.')
            }
        },

        createUUID() {
            let dt = new Date().getTime()
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = (dt + Math.random() * 16) % 16 | 0
                dt = Math.floor(dt / 16)
                return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
            })
            return uuid.substring(20)
        },

        async buscarDocumento() {
            if (!this.form.ruc || String(this.form.ruc).length !== 11) {
                return store.commit('dialogosnackbar', 'DOCUMENTO INVÁLIDO')
            }

            const token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            try {
                this.cargando = true
                store.commit('dialogoprogress')
                const { data } = await axios.get(`https://apiperu.dev/api/ruc/${this.form.ruc}`, {
                    headers: { Content_Type: 'application/json', authorization: ` Bearer ${token}` }
                })
                this.llenarDatos(data.data)
            } catch (e) {
                console.error(e)
                store.commit('dialogosnackbar', 'DOCUMENTO INVÁLIDO')
            } finally {
                this.cargando = false
                store.commit('dialogoprogress')
            }
        },

        llenarDatos(d) {
            if (!d) return
            this.form.name = d.nombre_o_razon_social || this.form.name
            this.form.direccion = d.direccion || this.form.direccion
            this.form.departamento = d.departamento || this.form.departamento
            this.form.provincia = d.provincia || this.form.provincia
            this.form.distrito = d.distrito || this.form.distrito
            this.form.ubigeo = d.ubigeo_sunat || this.form.ubigeo
        },
        async copiar_ruc() {
            var array = this.desserts
            for (let index = 0; index < array.length; index++) {
                const element = array[index];
                console.log(element.bd);
                await nuevaEmpresa(element.bd + '/ruc_asociado', element.ruc)


            }
        },
    },
}
</script>

<style scoped>
.text-no-wrap {
    white-space: nowrap;
}
</style>
