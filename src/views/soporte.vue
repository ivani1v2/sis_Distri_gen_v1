<template>
<v-container>

            <v-row class="mb-4">
                    <v-col
                        cols="6"
                        class="pa-3"                       
                        md="6"
                        sm="6"                        
                        xs="6">
                        <v-card @click.prevent="dialogopagos= !dialogopagos">
                        <v-container>              
                              <v-img
                              class="mx-auto"
                                height="70"
                                width="70"
                                src="/cash.png"
                              ></v-img>
                             <h4 block class="text-center pa-1">Mis pagos</h4>                     
                        </v-container>
                      </v-card>
                    </v-col>
                        <v-col
                        cols="6"
                        class="pa-3"                        
                        md="6"
                        sm="6"                        
                        xs="6">
                        <v-card >
                        <v-container>                  
                              <v-img
                              class="mx-auto"
                                      height="70"
                                width="70"
                                src="/youtube.png"
                              ></v-img>
                             <h4 block class="text-center pa-1">Tutoriales</h4>
                        </v-container>
                      </v-card>
                    </v-col>
                    <v-col
                        cols="6"
                        class="pa-3"                        
                        md="6"
                        sm="6"                        
                        xs="6">
                        <v-card>
                        <v-container>                  
                              <v-img
                              class="mx-auto"
                                      height="70"
                                width="70"
                                src="/contrato.png"
                              ></v-img>
                             <h4 block class="text-center pa-1">Contrato</h4>
                        </v-container>
                      </v-card>
                    </v-col>
                    <v-col
                        cols="6"
                        class="pa-3"                        
                        md="6"
                        sm="6"                        
                        xs="6">
                        <v-card :href="`https://api.whatsapp.com/send?phone=$+51902135696&text=Tengo una sugerencia con respecto al sistema`" 
                        target="_blank">
                        <v-container>                  
                              <v-img
                              class="mx-auto"
                                height="70"
                                width="70"
                                src="/chat.png"

                              ></v-img>
                             <h4 block class="text-center pa-1">Sugerencias</h4>
                        </v-container>
                      </v-card>
                    </v-col>
                    <v-col
                        cols="6"
                        class="pa-3"                        
                        md="6"
                        sm="6"                        
                        xs="6">
                        <v-card @click="router('suministros')">
                        <v-container>                  
                              <v-img
                              class="mx-auto"
                                height="70"
                                width="70"
                                src="/disc.png"

                              ></v-img>
                             <h4 block class="text-center pa-1">Suministros</h4>
                        </v-container>
                      </v-card>
                    </v-col>
    </v-row>

         <v-dialog     
     v-model="dialogopagos"
      max-width="490"
      >
    <div>
      <v-system-bar window dark>
        <v-icon @click="dialogopagos = false">mdi-close</v-icon>
      </v-system-bar>
    </div>
  <v-card>

  <v-simple-table
    fixed-header
    height="400px"
    dense
  >
    <template v-slot:default >
      <thead>
        <tr>
          <th class="text-center" >
            Periodo
          </th>
          <th class="text-center" nowrap>
            Fechas de Pago
          </th>
            <th class="text-center">
            Estado
          </th>
          <th class="text-center">
            Pagado el
          </th>
        </tr>
      </thead>
      <tbody >
        <tr
          v-for="item in arraypagos"
          :key="item.id"
        >
          <td nowrap >{{ item.periodo }}</td>
          <td nowrap class="text-center">{{ item.fpago }}</td>
         <td nowrap class="text-center red--text" v-if="item.estado=='PENDIENTE'">{{ item.estado }}</td>
         <td class="text-center green--text" v-if="item.estado=='PAGADO'">{{ item.estado }}</td>
         <td><v-btn small v-if="item.pagadoel!=''" text @click="abrirpago(item)">{{ item.pagadoel }} </v-btn></td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>

  </v-card>

     </v-dialog> 



    </v-container>
</template>

<script>
// @ is an alias to /src
import store from '@/store/index'
import { allCronogramapago } from '../db'
export default {
  name: 'panel',
   

  data(){
    return{
        dialogopagos:false,
        dialogovideos:false,
        arraypagos : [],
        items: [
        {
          action: '15 min',
          headline: 'Tenemos novedades para Ti',
          subtitle: 'Facturacion Domotica System esta habilitado para ti, los 365 dias',
          title: 'BIENVENIDO!',
        }, 
        ]
  }
  },
    created(){
      this.cargacronograma()
    },
     methods: {
       cargacronograma(){
        allCronogramapago(store.state.baseDatos.bd).once("value").then((snapshot) => {
            this.arraypagos=snapshot.val()
        })
      },
       abrirpago(item){
           if(item.ruta!=''){
            window.open(item.ruta)
           }
      },
         router(view){
          this.$router.push({name:view})
        },
    
     },

}
</script>

