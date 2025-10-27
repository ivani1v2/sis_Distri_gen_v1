<template>
    <v-dialog
        ref="dialog"
        v-model="$store.state.dialogomensaje"
        persistent
         max-width="500px"
    > 
            <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogomensaje')">mdi-close</v-icon>
        <v-spacer></v-spacer>
      </v-system-bar>
    </div>
     <v-card class="pa-4">
        <v-img
            class="mx-auto"
            height="100"
            width="100"
            src="/asistente.png"
            ></v-img>
         <v-row class="mx-auto mt-1">
        <v-col>
            <v-card class="pa-1" elevation="8">
                <v-card-text>
                Hola!! Soy tu asistente de DOMÓTICA SYSTEM.
                Quiero informarte que tenemos una nueva <span class="green--text">Actualización.</span>
                Te recomiedo aplicarla cuanto antes! 
                </v-card-text>
                <v-card-actions>
                    <v-row class="mx-auto">
                    <v-col>
                        <v-btn @click="ahora()"
                         block color="red">
                            ahora
                        </v-btn>    
                    </v-col>
                    <v-col>
                        <v-btn @click="luego()"
                        block color="green">
                            Luego
                        </v-btn>
                    </v-col>
                    </v-row>                                   
                </v-card-actions>
            </v-card>
         </v-col>
         </v-row>
     </v-card>
      </v-dialog>
</template>
<script>
import { grabaactualizadialogo } from '../../db'
import store from '@/store/index'
export default {
        data() {
        return{
            
        }
        },
        methods:{
            ahora(){
                store.commit('dialogomensaje')
                grabaactualizadialogo(store.state.baseDatos.bd,false,"dialogoactualiza").then((r)=>{
                    location.reload(true);
                })                                
            },
            luego(){
                store.commit('dialogomensaje')
                
            }
        }
        
}

</script>
