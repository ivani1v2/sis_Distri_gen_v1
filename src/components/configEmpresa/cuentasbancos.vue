<template>

    <v-dialog
        v-model="$store.state.dialogobancos"
        max-width="560px"
    >
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogobancos')">mdi-close</v-icon>
        <v-spacer></v-spacer>
         <v-icon  @click="dialog=!dialog,initialize()" medium class="white" color="green">mdi-plus</v-icon>
      </v-system-bar>
    </div>

    <v-card>
     <v-card v-if="dialog">

         <v-card-title primary-title>
             <div>
      <v-row>
                  <v-col
                    cols="6"
                  >
                    <v-text-field
                      v-model="editedItem.banco"
                      label="banco"
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="6"
                  >
                    <v-text-field
                      v-model="editedItem.moneda"
                      label="Moneda"
                    ></v-text-field>
                  </v-col>
                <v-col
                    cols="6"
                  >
                    <v-text-field
                      v-model="editedItem.cuenta"
                      label="Cuenta"
                    ></v-text-field>
                  </v-col>
                <v-col
                    cols="6"
                  >
                    <v-text-field
                      v-model="editedItem.cci"
                      label="CCI"
                    ></v-text-field>
                  </v-col>
                    <v-col
                    cols="6"
                  >
              <v-btn @click.prevent="agrega()" color="success">ok</v-btn>
                  </v-col>
      </v-row>
             </div>
         </v-card-title>
     </v-card>
              
  <v-simple-table>
    <template v-slot:default>
      <thead>
          
        <tr>
          <th class="text-left">
            BANCO
          </th>
        <th class="text-left">
            MONEDA
          </th>
          <th class="text-left">
            CUENTA
          </th>
            <th class="text-left">
            CCI
          </th>
        <th class="text-left">
            ACCION
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in desserts"
          :key="item.banco"
        >
          <td>{{ item.banco }}</td>
          <td>{{ item.moneda }}</td>
          <td>{{ item.cuenta }}</td>
          <td>{{ item.cci }}</td>
         <td>  <v-icon @click.prevent="elimina(item.banco)" color="red">mdi-close</v-icon> </td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>

    </v-card>
 
    </v-dialog>
</template>
<script>
import { allBancos,nuevoBanco,eliminaBanco} from '../../db'
export default {

 data () {
      return {
          dialog:false,
        desserts: [],

        editedItem: {
            banco:'',
            moneda:'',
            cuenta:'',
            cci:''
      },
      }
    },
    mounted() {
      allBancos().on("value", this.onDataChange);
      },
    beforeDestroy() {
      allBancos().off("value", this.onDataChange);
    },

     methods: {
       
    onDataChange(items) {
                   this.desserts= []
      let array = [];
      items.forEach((item) => {
        let data = item.val();
        array.push({
            banco: data.banco,
            moneda: data.moneda,
            cuenta: data.cuenta,
            cci: data.cci
        });
      });

      this.desserts = array;
    },
      initialize(){         
         this.desserts= []
            allBancos().once("value").then((snapshot) => {
              snapshot.forEach((item) => {                
                let data = item.val();
                this.desserts.push({
                    banco: data.banco,
                    moneda: data.moneda,
                    cuenta: data.cuenta,
                    cci: data.cci
                });
              });
              })      
      },
      agrega(){
          this.editedItem.banco = this.editedItem.banco.toUpperCase()
          this.editedItem.moneda = this.editedItem.moneda.toUpperCase()
          nuevoBanco(this.editedItem.banco,this.editedItem)
          this.editedItem.banco=''
          this.editedItem.moneda=''
          this.editedItem.cuenta=''
          this.editedItem.cci=''
          this.dialog=false
          this.initialize()
      },
      elimina(id){
          eliminaBanco(id)
      }
     }

}
</script>