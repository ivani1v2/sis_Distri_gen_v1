<template>
  <v-card id="create">

    <v-speed-dial
      v-model="fab"
      absolute
      :top="top"
      :bottom="bottom"
      :right="right"
      :left="left"
      :direction="direction"
      :open-on-hover="hover"
      :transition="transition"
    >

    <template v-slot:activator >
        <v-btn
          v-model="fab"
          color="red"
          dark
          fab
        >
          <v-icon v-if="fab">mdi-cog-outline</v-icon>
          <v-icon v-else>mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <v-btn class="ml-12" dark small color="orange" @click="envento(4)">
        Historial
    </v-btn>
      <v-btn class="ml-12" dark small color="green" @click="envento(1)">
        Exporta
    </v-btn>
      <v-btn class="ml-12" dark small color="blue" @click="envento(2)">
        Movimientos
    </v-btn>
      <v-btn class="ml-12" dark small color="red" @click="envento(3)">
        CIERRA CAJA
    </v-btn>
    </v-speed-dial>
  </v-card>
</template>

<script>
  export default {
      name: 'botonflotante',

    data: () => ({
      tienda:'',
      offsetTop: 0,
      direction: 'top',
      fab: false,
      fling: true,
      hover: false,
      tabs: null,
      top: false,
      right: false,
      bottom: true,
      left: true,
      transition: 'slide-y-reverse-transition',
    }),

    computed: {
      activeFab () {
        switch (this.tabs) {
          case 'one': return { class: 'purple', icon: 'account_circle' }
          case 'two': return { class: 'red', icon: 'edit' }
          case 'three': return { class: 'green', icon: 'keyboard_arrow_up' }
          default: return {}
        }
      },
    },
    methods:{
      envento(item){            
          this.$emit('evento',item)
         
      },
    }

  }
</script>

<style>
  /* This is for documentation purposes and will not be needed in your application */
  #create .v-speed-dial {
    position: fixed;
  }

  #create .v-btn--floating {
    position: relative;
  }
</style>