<template >
<v-container class="mb-6" >
      <v-row no-gutters class="mt-3 mx-1">
        <v-col cols="9">
          <v-text-field
            outlined
            dense
            v-model="buscar"
            append-icon="mdi-magnify"
            label="BUSCAR"
          ></v-text-field>
        </v-col>
          <v-col cols="2" class="ml-1 ">
            <v-btn block elevation="5" rounded color="success" @click="obtenordenproducto()">NUEVO</v-btn>
        </v-col>
      </v-row>

      <v-data-table
      :headers="headers"
      :items="listafiltrada"
       dense       
    >
    <template v-slot:item.actions="{ item }" >
 <v-row>
          <v-col cols="12">
            <v-icon color="green" @click="editar(item.id),itemselecto=item">mdi-lead-pencil</v-icon> 
          </v-col>
            </v-row>
    </template>
    <template v-slot:no-data>
      <v-btn
        color="primary"
        @click="initialize"
      >
        SHOW
      </v-btn>
    </template>
    </v-data-table>

      <v-dialog
        v-model="dialogo"
        max-width="600px"
    >
    <div>
      <v-system-bar window dark>
        <v-icon color="red" large @click="dialogo=!dialogo">mdi-close</v-icon>
        <v-switch v-model="activo" color="green" label="ACTIVO"></v-switch>
        <v-spacer></v-spacer>
        <v-icon color="green" large @click="save()">mdi-content-save</v-icon>
        <v-icon color="red" large @click="dialogoElimina=!dialogoElimina">mdi-delete</v-icon>
      </v-system-bar>
    </div>

    <v-card  max-height="500"  class="overflow-y-auto">  
            <v-card-text>
              <v-container>            
                <v-row class="mt-1" dense>
                  
                  <v-col
                    cols="6"
                    sm="6"
                    md="6"
                  >
                    <v-text-field
                    dense
                      disabled
                      v-model="id"
                      label="ID"
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="6"
                    sm="6"
                    md="6"
                  >
                  <v-select
                  dense
                  v-model="tipodoc"
                  :items="arraydocumento"
                  menu-props="auto"
                  hide-details
                  label="TIPO DOC"
                  ></v-select>
                  
                  </v-col>
                 </v-row>
                 <v-row class="mt-n4">
                    <v-col
                    cols="6"
                  >
                    <v-text-field
                    type="number"
                    dense
                      v-model="documento"
                      label="DOCUMENTO"
                      append-icon="mdi-magnify"
                      @click:append="BuscarDocumento()"
                      @keyup.enter="BuscarDocumento()"
                    ></v-text-field>
                  </v-col>

                    <v-col
                    cols="6"
                  >
                    <v-text-field
                    type="number"
                    dense
                      v-model="telefono"
                      label="Telefono"
                    ></v-text-field>
                  </v-col>         
                </v-row> 
                 <v-row class="mt-n7">
                  <v-col
                    cols="12"
                  >
                      <v-textarea
                      outlined
                      dense
                      v-model="nombre"
                      auto-grow
                      filled
                      label="NOMBRE"
                      rows="1"
                  ></v-textarea>
                  </v-col>
                 </v-row>
                  <v-row class="mt-n7">
                  <v-col
                    cols="12"
                  >
                      <v-textarea
                      outlined
                      dense
                      v-model="direccion"
                      auto-grow
                      filled
                      label="Direccion"
                      rows="1"
                  ></v-textarea>
                  </v-col>
                 </v-row>
                <v-row class="mt-n7">
                  <v-col
                    cols="12"
                  >
                      <v-textarea
                      outlined
                      dense
                      v-model="referencia"
                      auto-grow
                      filled
                      label="Referencia"
                      rows="1"
                  ></v-textarea>
                  </v-col>
                 </v-row>
                <v-row class="mt-n7">
                  <v-col
                    cols="12"
                  >
                      <v-textarea
                      outlined
                      dense
                      v-model="alias"
                      auto-grow
                      filled
                      label="ALIAS"
                      rows="1"
                  ></v-textarea>
                  </v-col>
                 </v-row>
                  <v-row class="mt-n9">
                  <v-col
                    cols="12"
                  >
                      <v-textarea
                      outlined
                      dense
                      v-model="nota"
                      auto-grow
                      filled
                      label="Nota"
                      rows="1"
                  ></v-textarea>
                  </v-col>
                 </v-row>   
              </v-container>
            </v-card-text>    

    </v-card>
    </v-dialog>

      <v-dialog
        v-model="dialogoElimina"
        max-width="460px"
    >
    <div>
      <v-system-bar window dark>
        <v-icon @click="dialogoElimina=!dialogoElimina">mdi-close</v-icon>
      </v-system-bar>
    </div>
    <v-card> 
      <v-card-text>
       <h3> DESEA ELIMINAR PERMANENTEMENTE EL CLIENTE?</h3>
      </v-card-text>
      <v-card-actions>  
        <v-spacer></v-spacer>
        <v-btn color="success" @click="eliminar()">si</v-btn>
        <v-btn color="error" @click="dialogoElimina=!dialogoElimina">no</v-btn>
      </v-card-actions>
    </v-card>
    </v-dialog>
      

      <v-dialog
        v-model="dialogoFiltro"
        max-width="460px"
    >
    <div>
      <v-system-bar window dark>
        <v-icon @click="dialogoFiltro=!dialogoFiltro">mdi-close</v-icon>
      </v-system-bar>
    </div>
    <v-card class="pa-3"> 
      <v-card-text>
          <v-select
            :items="arrayfiltroStock"
            label="Stock"
            outlined
            v-model="filtrostock"
          ></v-select>
            <v-select
            :items="arrayfiltroestado"
            label="ESTADO"
            outlined
            v-model="filtroestado"
          ></v-select>
      </v-card-text>
      <v-card-actions>  
        <v-spacer></v-spacer>
        <v-btn color="success" @click="dialogoFiltro=!dialogoFiltro">FILTRAR</v-btn>
      </v-card-actions>
    </v-card>
    </v-dialog>

    <div class="text-center">
      <v-snackbar
        v-model="snackbar"
        :timeout="timeout"
        top
      >
        {{ text }}

        <template v-slot:action="{ attrs }">
          <v-btn
            color="blue"
            text
            v-bind="attrs"
            @click="snackbar = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
</v-container>
</template>

<script>
import { allEmpleados,nuevoEmpleados,eliminaEmpleados,obtenContador,
sumaContador} from '../../db'
import axios from "axios"
import store from '@/store/index'
  export default {

    data: () => ({
      snackbar: false,
      text: '',
      timeout: 2000,
      sumacon : false,
      itemselecto:'',
      dialogoElimina:false,
      dialogoFiltro:false,
      buscar:'',
      headers: [
        {
          text: 'id',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        { text: 'DOCUMENTO', value: 'documento' , divider: true,cellClass:'text-caption'},
        { text: 'Nombre', value: 'nombre' , divider: true,cellClass:'text-caption'},
        { text: 'Actions', value: 'actions', sortable: false },
        
      ],
      desserts:[],
        arraydocumento:['DNI','RUC'],
        arraymedida:[],
        dialogo:false,
        arrayfiltroStock:['incluir 0','excluir 0'],
        filtrostock:'incluir 0',
        arrayfiltroestado:['TODOS','ACTIVO','INACTIVO'],
        filtroestado:'ACTIVO',
        tipoproducto:"BIEN",
        activo:true,
        id:'',
        tipodoc:'DNI',
        documento:'',
        nombre:'',
        direccion:'',
        telefono:'',
        alias:'',
        nota:'',
        referencia:'',
        progress:false,
        Uploadvalue:0,
    }),

    mounted() {
      allEmpleados().on("value", this.onDataChange);
      },
    beforeDestroy() {
      allEmpleados().off("value", this.onDataChange);
    },
    created () {      
      this.initialize()      
    },

    computed: {
        listafiltrada() {
            var filtro  =  this.desserts

            return filtro.filter((item)=>(item.documento+item.nombre
            +item.telefono+item.alias+item.nota)
                .toLowerCase().includes(this.buscar.toLowerCase()))

        }
            
    },
 
    methods: {

      initialize(){
        allEmpleados().on("value", this.onDataChange);
      },
      onDataChange(items) {
      let array = [];
      items.forEach((item) => {
        let key = item.key;
        let data = item.val();
        array.push({
          id: key,
          activo:data.activo,
          tipodoc:data.tipodoc,
          documento:data.documento,
          nombre:data.nombre,
          direccion:data.direccion,
          telefono:data.telefono,
          alias:data.alias,
          nota:data.nota,
          referencia:data.referencia
        });
      });

      this.desserts = array;
      
    },

      obtenordenproducto(){
        this.sumacon=true
        obtenContador().once("value").then((snapshot) => {
          if(snapshot.exists()){
            this.activo=true
            this.id = snapshot.val().ordentrabajadores
            this.tipodoc='DNI',
            this.documento='',
            this.nombre='',
            this.direccion='',
            this.telefono='',
            this.alias='',
            this.nota='',
            this.referencia='',
            this.dialogo=true
          }     
            })
      },
      editar(id){
        this.sumacon = false
        for(var i=0;i<this.desserts.length;i++){
          if(this.desserts[i].id==id){      
              this.id = this.desserts[i].id
              this.activo = this.desserts[i].activo
              this.tipodoc=this.desserts[i].tipodoc,
              this.documento=this.desserts[i].documento,
              this.nombre=this.desserts[i].nombre,
              this.direccion=this.desserts[i].direccion,
              this.telefono=this.desserts[i].telefono,
              this.alias=this.desserts[i].alias,
              this.nota=this.desserts[i].nota,
              this.referencia = this.desserts[i].referencia
              this.dialogo=true
              }
        }
      },  
      save () {
        var array ={
            activo:this.activo,
            id:this.id,
            tipodoc:this.tipodoc,
            documento:this.documento,
            nombre:this.nombre,
            direccion:this.direccion,
            telefono:this.telefono,
            alias:this.alias,
            nota:this.nota,
            referencia:this.referencia
        }
        nuevoEmpleados(this.id,array)
        if(this.sumacon==true){
          this.sumacontador() 
        }        
        this.dialogo=false
      },     
      eliminar(){
        eliminaEmpleados(this.itemselecto.id)
        this.itemselecto = ''
        this.dialogoElimina=false
        this.dialogo=false
      },
      sumacontador(){
        sumaContador("ordentrabajadores",(parseInt(this.id)+1).toString().padStart(4, 0))
      },
    BuscarDocumento(){
      if(this.documento!=''&& this.tipodoc=="RUC" || this.tipodoc=="DNI" 
      && this.documento.length==8 || this.documento.length==11){
        store.commit("dialogoprogress")
        var self = this,
        token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
        axios
          .get('https://apiperu.dev/api/'+this.tipodoc.toLowerCase()+'/'+this.documento, 
          { headers: { 
            Content_Type: 'application/json',
            authorization:' Bearer '+ token }})
          .then(response => (this.info = response.data,
           store.commit("dialogoprogress"),
            self.llenardatos(response.data.data)
            ))     
            .catch(error => {
            store.commit("dialogoprogress"),
            self.snack('Documento Invalido')
            })
      }else{
        this.snack("Ingrese Documento")
      }
    },
    llenardatos(data){
        if(this.tipodoc=='DNI'){
          this.nombre = data.nombre_completo
        }
        if(this.tipodoc=='RUC'){
          this.nombre = data.nombre_o_razon_social
          this.direccion= data.direccion_completa
        }
    },
    snack(text){
        this.snackbar=true
        this.text = text
    },
    },
  }
</script>