<template>
    <v-dialog
        ref="dialog"
        v-model="$store.state.dialogoFecha"
        :return-value.sync="date"
        persistent
        width="290px"
    > 
      <v-date-picker v-model="date"  scrollable>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="$store.commit('dialogoFecha')">Cancel</v-btn>
          <v-btn text color="primary" @click="regresa(),$refs.dialog.save(date)">OK</v-btn>
        </v-date-picker>
      </v-dialog>
</template>
<script>
import moment from 'moment'
export default {
        data() {
        return{
            date: moment(String(new Date)).format('YYYY-MM-DD'),
        }
        },
        methods:{
            regresa(){
                this.$emit('fecha',this.date)
            }
        }
        
}

</script>
