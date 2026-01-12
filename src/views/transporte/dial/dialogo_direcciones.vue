<template>
    <v-dialog v-model="dial" max-width="760" persistent>
        <v-card>
            <v-card-title class="text-h6">
                Ubicaciones Frecuentes
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
            </v-card-title>

            <v-card-text>
                <v-simple-table class="mt-4" v-if="ubicaciones.length">
                    <thead>
                        <tr>
                            <th>Ubigeo</th>
                            <th>Dir</th>
                            <th>Dirección</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, i) in ubicaciones" :key="item.id || i">
                            <td>{{ item.ubigeo }}</td>
                            <td>{{ nombreDep(item) }} - {{ nombreProv(item) }} - {{ nombreDist(item)}}</td>
                            <td>{{ item.direccion }}</td>
                            <td class="text-right">
                                <v-btn icon small @click="seleccionar(item)">
                                    <v-icon  color="primary">mdi-check</v-icon>
                                </v-btn>
                                <v-btn class="ml-4" icon small @click="pedirEliminar(item)">
                                    <v-icon small color="red">mdi-delete</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>

                <div v-else class="text-center grey--text">No hay ubicaciones guardadas</div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { all_ubica_frec, elimina_ubica_frec } from '../../../db' // asegúrate de que existe
import store from '@/store/index'
export default {
    name: 'dialogo_direcciones',
    props: {
modo_direccion:''
    },
    data() {
        return {
            dial: false,
            ubicaciones: []
        }
    },
    watch: {
        value(val) {
            this.dial = val
            if (val) this.cargarUbicaciones()
        },
        dial(val) {
            // sincroniza v-model con el padre
            this.$emit('input', val)
        }
    },
    async created() {
        await this.cargarUbicaciones()
        this.dial = true
        console.log(this.modo_direccion)
    },
    methods: {
        async cargarUbicaciones() {
             store.commit("dialogoprogress")
            try {
                const snap = await all_ubica_frec().orderByChild('modo').equalTo(this.modo_direccion).once('value')
                const list = []
                snap.forEach(child => {
                    const v = child.val() || {}
                    list.push({
                        id: child.key,
                        ...v
                    })
                })
                this.ubicaciones = list
            } catch (e) {
                console.error('❌ Error cargando ubicaciones:', e)
                this.ubicaciones = []
            }
             store.commit("dialogoprogress")
        },
        nombreDep(it) {
            // evita optional chaining en template
            return (it.departamento && it.departamento.nombre) || it.departamento || ''
        },
        nombreProv(it) {
            return (it.provincia && it.provincia.nombre) || it.provincia || ''
        },
        nombreDist(it) {
            return (it.distrito && it.distrito.nombre) || it.distrito || ''
        },
        seleccionar(item) {
            this.$emit('selecciona', item)
            this.cerrar()
        },
        async pedirEliminar(item) {
            // Delega al padre para borrar (evita romper si no tienes función en db)
            console.log(item)
            if (confirm('seguro de elimniar?')) {
  
                await elimina_ubica_frec(item.id)
                this.cargarUbicaciones()
            }

        },
        cerrar() {
            this.dial = false
            this.$emit('cierre', true)
        }
    }
}
</script>
