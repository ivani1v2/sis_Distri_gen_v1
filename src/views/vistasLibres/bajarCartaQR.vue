<template>
<v-container class="mt-8">
      
        <v-btn color="success" @click="GuardaToken()" block>BAJAR CARTA PDF</v-btn>
    
</v-container>              
</template>

<script>
import { solicitaPermiso,ObtenerToken} from '../../sendMessaging'
import { bajarCartaPDF} from '../../db'
import route from '@/router/index'
import axios from "axios"

export default {
 data () {
      return {
         fondo: 'https://w0.peakpx.com/wallpaper/794/209/HD-wallpaper-sushi-fish-japanese-plate-food.jpg'
      }
    },

    created () {
      this.ActivaPermiso()
    },

     methods: {
        php(){
              axios({
                method: 'get',
                url: ' http://localhost:8081/factura.php'}).then(response => (
        console.log(response)

        )) 
        .catch(function (error) {
        console.log(error)

        });

        },
         ActivaPermiso(){
             solicitaPermiso()
             
         },
         GuardaToken(){
             
        ObtenerToken().getToken().then((currentToken) => {
          if (currentToken) {
              console.log('token',currentToken);
               bajarCartaPDF(this.$route.params.id).once("value").then((snapshot) => {
                   console.log(snapshot.val().cartapdf)
                window.open(snapshot.val().cartapdf)
                })

             // guardaToken(currentToken)
          } else {
              // Show permission request.
              console.log('No Instance ID token available. Request permission to generate one.');
              // Show permission UI.
              updateUIForPushPermissionRequired();
          }
          }).catch((err) => {
          console.log('An error occurred while retrieving token. ', err);
          });
            }

         
         
     }

}
</script>
<style>

</style>