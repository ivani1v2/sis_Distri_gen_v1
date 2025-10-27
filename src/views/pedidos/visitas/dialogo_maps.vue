<template>
  <v-dialog v-model="dial" persistent max-width="800px" fullscreen>
    <v-card>
      <v-app-bar color="success" dark dense>
        <v-btn icon @click="cierra" color="red">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <h5>{{ listafiltrada }}</h5>
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item @click='compartir(markers[0].position.lat, markers[0].position.lng)'>
              <v-list-item-icon>
                <v-icon color="info">mdi-share</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Ver Ruta</v-list-item-title>
            </v-list-item>
            <v-list-item @click="ubicarme">
              <v-list-item-icon>
                <v-icon color="green">mdi-google-maps</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Ubicarme</v-list-item-title>
            </v-list-item>
            <v-list-item @click.prevent="guarda">
              <v-list-item-icon>
                <v-icon color="orange">mdi-content-save</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Guardar</v-list-item-title>
            </v-list-item>
            <v-list-item @click="eliminar_todo">
              <v-list-item-icon>
                <v-icon color="red">mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Limpiar</v-list-item-title>
            </v-list-item>

          </v-list>
        </v-menu>

      </v-app-bar>
      <v-card-text>

        <GmapMap :center="center" :options="options" :zoom="zoom" style="width: 100%; height: 85vh" @click="mark">

          <GmapMarker v-for="(m, index) in markers" :key="index" :position="m.position" :title="m.title"
            :clickable="true" :draggable="true" @click="selectMarker(m)">
            <Gmap-info-window :opened="window_open" :position="m.position" :options="infoWindowOptions"
              @closeclick="window_open = false">
              <v-row class="pa-2" dense>
                <v-col cols="10">
                  <h4>{{ m.title }}</h4>
                </v-col>
                <v-col cols="2">
                  <v-icon color="info" left @click='compartir(m.position.lat, m.position.lng)'>
                    mdi-share
                  </v-icon>
                </v-col>
              </v-row>
            </Gmap-info-window>

          </GmapMarker>
        </GmapMap>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogo" max-width="200px">
      <v-card>
        <v-app-bar color="primary" dark dense>
          <v-btn icon @click="dialogo = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-app-bar>
        <v-card-text></v-card-text>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import store from '@/store/index'
import {
  nuevoCliente_lista
} from '../../db'
export default {
  props: {
    data: Object,
    modo: ''
  },
  data() {
    return {
      dial: true,
      zoom: 12,
      dialogo: false,
      window_open: true,
      punto_selecto: null,
      options: {
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        disableDefaultUi: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      },
      center: {
        lat: -8.106452954120423,
        lng: -79.02572202917145
      },
      markers: [],
      infoWindowOptions: {
        pixelOffset: {
          width: 0,
          height: -35
        }
      }
    }
  },
  async mounted() {
    await this.$gmapApiPromiseLazy();
    this.setInitialMapData();
  },
  computed: {
    listafiltrada() {
      return this.data ? this.data.nombre : '';
    }
  },
  methods: {
    setInitialMapData() {
      if (this.modo == 'multiple') {
        for (var i = 0; i < this.data.length; i++) {
          var cli = this.data[i]
          this.markers.push({
            id: i,
            position: {
              lat: cli.latitud,
              lng: cli.longitud
            },
            title: cli.nombre
          });
        }
        console.log(this.markers)
        this.zoom = 17;
      } else {
        if (this.data) {
          const {
            latitud,
            longitud,
            nombre
          } = this.data;
          if (latitud && longitud) {
            this.center = {
              lat: latitud,
              lng: longitud
            };
            this.markers = [{
              id: 0,
              position: {
                lat: latitud,
                lng: longitud
              },
              title: nombre
            }];
            this.zoom = 17;
          }
        }
      }
    },
    mark(event) {
      if (this.modo != 'multiple') {
        this.markers = [{
          id: 0,
          position: {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          },
          title: this.data.nombre
        }];
      }
    },
    selectMarker(marker) {

      this.center = marker.position;
      this.punto_selecto = marker;
      this.window_open = true;

    },
    eliminar_todo() {
      if (confirm('seguro de querer eliminar?')) {
        store.commit("dialogoprogress");
        this.$getLocation().then(coordinates => {
          this.markers = [];
          this.center = {
            lat: coordinates.lat,
            lng: coordinates.lng
          };
          this.zoom = 12;
          store.commit("dialogoprogress");
        });
      }
    },
    ubicarme() {
      store.commit("dialogoprogress");
      this.$getLocation().then(coordinates => {
        this.markers = [{
          id: 0,
          position: {
            lat: coordinates.lat,
            lng: coordinates.lng
          },
          title: this.data.nombre
        }];
        this.center = {
          lat: coordinates.lat,
          lng: coordinates.lng
        };
        this.zoom = 18;
        store.commit("dialogoprogress");
      });
    },
    async guarda() {
      store.commit("dialogoprogress");
      if (this.markers.length > 0) {
        const {
          lat,
          lng
        } = this.markers[0].position;

        console.log(this.data.id, 'latitud', lat, lng)
        await nuevoCliente_lista(this.data.id + '/latitud', lat)
        await nuevoCliente_lista(this.data.id + '/longitud', lng)
        store.commit("dialogoprogress");
      }
    },
    compartir(lat, lng) {
      console.log(lat, lng)
      this.$getLocation().then(coordinates => {
        const origin = `${coordinates.lat},${coordinates.lng}`;
        const destination = `${lat},${lng}`;
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        window.open(mapUrl, '_blank');
      });


    },
    cierra() {
      this.$emit('cierra', false);
    }
  }
}
</script>

<style scoped>
.v-app-bar {
  justify-content: space-between;
}
</style>
