<template>
    <v-dialog
        ref="dialog"
        v-model="$store.state.dialogoAlerta"
        persistent
         max-width="500px"
    
    > 
            <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogoAlerta')">mdi-close</v-icon>
        <v-spacer></v-spacer>
      </v-system-bar>
    </div>
     <v-card class="pa-4">
        <v-img
            class="mx-auto"
            height="80"
            width="80"
            src="/iconalerta.png"
            ></v-img>
         <v-row class="mx-auto mt-1">
        <v-col>
            <v-card class="pa-1" elevation="8">
                <v-card-text>
                    {{$store.state.arraynotifica.mensaje}}
                </v-card-text>
                <v-card-actions>
                    <v-row class="mx-auto">
                    <v-col>  
                        <v-btn @click="ahora()"
                        block color="info">
                            LISTO
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
                grabaactualizadialogo(store.state.baseDatos.bd,false,"dialogoAlerta").then((r)=>{
                    store.commit('dialogoAlerta')  
                })                                
            },
        }
        
}

</script>
