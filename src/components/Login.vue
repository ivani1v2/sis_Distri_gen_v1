<template>
    <v-container grid-list-xs>

        <v-card-title class="mt-1"></v-card-title>

        <v-card shaped elevation="20" class="mx-auto mt-5" color="white" width="300px">

            <v-card-title class="mx-auto">
                <h5 class="mx-auto" style="font-family:verdana;font-size:80%;">INICIAR SESION</h5>

            </v-card-title>
            <v-divider class="mt-n3"></v-divider>
            <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                    <v-text-field outline v-model="email" label="E-mail" required suffix="@domotica.com"></v-text-field>

                    <v-text-field outline v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                        :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1"
                        label="Contraseña" hint="Min 8 caracteres" counter @click:append="show1 = !show1"
                        @keyup.enter="agregar()"></v-text-field>
                </v-form>

            </v-card-text>

            <v-card-actions>
                <v-col>
                    <v-btn rounded elevation="15" block color="success" class="mr-4" @click.stop="agregar">
                        INICIAR SESION
                    </v-btn>

                    <v-btn @click="dialog = !dialog" block text small class="mt-3 blue--text  ">¿Registro nuevo?</v-btn>

                </v-col>

            </v-card-actions>
            <v-card-title v-if="false" class="eye mb-12 mx-auto pa-2">
                <v-img src="/santa.png" max-width="250" max-height="200" class="mx-auto"></v-img>
            </v-card-title>
        </v-card>

        <v-snackbar v-model="snackbar" :timeout="timeout" top>
            {{ mensaje }}
            <v-btn color="blue" text @click="snackbar = false">
                Close
            </v-btn>
        </v-snackbar>
        <v-spacer></v-spacer>

        <v-dialog v-model="dialog" max-width="460px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>

            <v-card class="mx-auto" color="white">
                <v-card-title class="mx-auto">
                    <h5 class="mx-auto">NUEVO USUARIO</h5>
                </v-card-title>

                <v-card-text>
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-text-field v-model="token" label="TOKEN" required></v-text-field>
                        <v-text-field v-model="email" label="E-mail" required suffix="@domotica.com"></v-text-field>

                        <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1"
                            label="Contraseña" hint="Min 8 caracteres" counter
                            @click:append="show1 = !show1"></v-text-field>
                    </v-form>

                </v-card-text>

                <v-card-actions>
                    <v-col>
                        <v-btn block color="success" class="mr-4" @click.stop="crearUsuario()">
                            CREAR
                        </v-btn>

                    </v-col>

                </v-card-actions>

            </v-card>

        </v-dialog>
    </v-container>
</template>

<script>
// @ is an alias to /src

import {
    primerUsuario,
    buscarUsuarios
} from '../db'
import firebase from 'firebase'

export default {
    name: 'login',

    data() {
        return {
            token: '',
            dialog: false,
            email: '',
            show1: false,
            password: '',
            rules: {
                required: value => !!value || 'Required.',
                min: v => v.length >= 8 || 'Min 8 characters',
                emailMatch: () => (`The email and password you entered don't match`),
            },

            snackbar: false,
            timeout: 2000,
            mensaje: '',
            valid: true
        }
    },

    methods: {
        agregar() {
            this.validate()
            if (this.password != "" && this.email != "") {

                firebase.auth().signInWithEmailAndPassword(this.email.trim() + "@domotica.com", this.password.trim())
                    .then(user => {
                        console.info(user)
                        this.$router.push({
                            name: 'panel'
                        })
                    }).catch(err => {
                        this.snackbar = true
                        console.info(err.code)
                        this.mensaje = err.code
                    })
            }
        },

        validate() {
            this.$refs.form.validate()
        },
        crearUsuario() {
            if (this.token && this.email && this.password) {
                buscarUsuarios(this.token).once("value").then((snapshot) => {

                    if (snapshot.val() != null) {

                        primerUsuario(this.token, this.email.toLowerCase() + "@domotica.com", this.password)
                        firebase.auth().createUserWithEmailAndPassword(this.email + "@domotica.com", this.password)
                            .then(user => {
                                this.$router.push({
                                    name: 'panel'
                                })
                            }).catch(error => {
                                console.log(error)
                            })
                    } else {
                        this.snackbar = true
                        this.mensaje = "TOKEN INVALIDO"
                    }
                });
            } else {
                console.log("error")
            }
        }
    },

}
</script>

<style>
.eye {
    position: absolute;
    height: 200px;
    width: 400px;
    top: -132px;
    left: -150px;
    z-index: 1;
}

.heaven {
    position: absolute;
    z-index: 0;
}
</style>
