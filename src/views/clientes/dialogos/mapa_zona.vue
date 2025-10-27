<template>
    <v-dialog v-model="dialogoMapaClientes" max-width="1100px" persistent fullscreen>
        <div>
            <v-system-bar class="" dense window dark height="40">
                <v-spacer></v-spacer>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar"><v-icon color="red">mdi-close</v-icon></v-btn>
            </v-system-bar>
        </div>
        <v-card>
            <v-card-title>
                <!-- Selector de zona -->
                <v-select class="mr-2" dense outlined hide-details :items="zonasItems" item-text="nombre"
                    item-value="key" label="Zona" v-model="selectedKey" style="max-width: 230px"
                    @change="onSelectZona" />

                <!-- Color de la zona seleccionada -->
                <v-menu offset-y v-if="selectedZona">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn small class="mr-2" v-bind="attrs" v-on="on" :disabled="!selectedZona">
                            <span class="w-3 h-3 mr-2 rounded-full"
                                :style="{ display: 'inline-block', width: '14px', height: '14px', backgroundColor: colorByKey[selectedKey] || '#4285F4', borderRadius: '50%' }"></span>
                            Color
                        </v-btn>
                    </template>
                    <v-card>
                        <v-color-picker v-model="colorTemp" hide-canvas hide-inputs mode="hexa" dot-size="18"
                            :swatches="swatches" show-swatches @click="aplicarColor()" />
                        <v-card-actions>
                            <v-spacer />
                            <v-btn small text @click="colorTemp = colorByKey[selectedKey] || '#4285F4'">Reset</v-btn>
                            <v-btn small color="primary" @click="aplicarColor()">Aplicar</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-menu>

                <!-- Eliminar zona -->
                <v-btn small class="mr-2" color="error" :disabled="!selectedZona || !tienePoligono(selectedKey)"
                    @click="eliminarPoligono()">
                    <v-icon left>mdi-trash-can</v-icon>Eliminar
                </v-btn>

                <!-- Dibujar / Controles -->
                <v-btn small class="mr-2" :color="dibujando ? 'warning' : 'primary'" :disabled="!selectedZona"
                    @click="toggleDibujo">
                    <v-icon left>mdi-vector-polygon</v-icon>{{ dibujando ? 'Finalizar' : 'Dibujar' }}
                </v-btn>

                <v-btn small class="mr-2" color="info" :disabled="!dibujando || poligonoTemp.length === 0"
                    @click="deshacerPunto">
                    <v-icon left>mdi-backspace</v-icon>Deshacer
                </v-btn>

                <v-btn small class="mr-2" color="success"
                    :disabled="!selectedZona || (dibujando ? poligonoTemp.length < 3 : !tienePoligono(selectedKey))"
                    @click="guardarZonaSeleccionada">
                    <v-icon left>mdi-content-save</v-icon>Guardar
                </v-btn>

                <v-btn small class="mr-4" color="error" :disabled="!dibujando" @click="cancelarDibujo">
                    <v-icon left>mdi-close-octagon</v-icon>Cancelar
                </v-btn>

            </v-card-title>

            <v-card-text style="position:relative; padding:0;">
                <div style="height:500px; width:100%; position:relative;">

                    <!-- LEYENDA flotante -->
                    <div class="legend-card">
                        <div class="legend-title">Zonas</div>
                        <div v-for="z in zonasOrdenadas" :key="'lg' + z.key" class="legend-item">
                            <!-- ✅ booleans -->
                            <input type="checkbox" v-model="visibleByKey[z.key]" />
                            <span class="legend-color"
                                :style="{ backgroundColor: colorByKey[z.key] || '#4285F4' }"></span>
                            <span class="legend-name" @click="seleccionarYEnfocar(z.key)">{{ z.nombre }}</span>
                        </div>
                    </div>

                    <GmapMap ref="mapa" :center="centro" :zoom="zoom" style="width:100%; height:500px"
                        :options="mapOptions" @click="onMapClick" @tilesloaded="onMapReady">
                        <!-- Marcadores de clientes -->
                        <GmapMarker v-for="c in clientesConUbicacion" :key="c.id"
                            :position="{ lat: Number(c.latitud), lng: Number(c.longitud) }" :title="c.nombre"
                            @click="mostrarInfo(c)" />

                        <!-- Polígonos por zona -->
                        <GmapPolygon v-for="z in zonasOrdenadas" v-if="esVisible(z.key)" :key="'z' + z.key"
                            :ref="'poly_' + z.key" :paths="getPathsFor(z.key)"
                            :editable="selectedKey === z.key && !dibujando"
                            :draggable="selectedKey === z.key && !dibujando" :options="polyOptionsFor(z.key)"
                            @paths_changed="onPathsChangedByKey(z.key)" />

                        <!-- Polígono temporal en modo dibujo -->
                        <GmapPolygon v-if="poligonoTemp.length" :paths="poligonoTemp" :options="tempPolyOptions" />

                        <!-- InfoWindow -->
                        <GmapInfoWindow v-if="clienteSeleccionado"
                            :position="{ lat: Number(clienteSeleccionado.latitud), lng: Number(clienteSeleccionado.longitud) }"
                            @closeclick="clienteSeleccionado = null">
                            <div>
                                <strong>{{ clienteSeleccionado.nombre }}</strong><br>
                                <small>{{ clienteSeleccionado.direccion }}</small>
                            </div>
                        </GmapInfoWindow>
                    </GmapMap>

                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { edita_tablacliente } from '../../../db'
import store from '@/store'

export default {
  name: "mapa_clientes",
  props: {
    value: Boolean,
    clientes: { type: Array, required: true },
    // Array de zonas => cada item: { key, nombre, mapa? }
    zonas: { type: Array, default: () => [] }
  },
  data() {
    return {
      dialogoMapaClientes: true,           // lo dejas abierto como en tu ejemplo
      centro: { lat: -9.19, lng: -75.0152 },
      zoom: 6,
      mapReady: false,

      // cámara / comportamiento
      didInitialFit: false,                // solo una vez al inicio
      hasUserInteracted: false,            // si el usuario movió/zoomeó

      // selección y estados por zona
      selectedKey: null,
      pathsByKey: {},   // { key: [{lat,lng}, ...] }
      colorByKey: {},   // { key: '#RRGGBB' }
      visibleByKey: {}, // { key: true/false }

      // dibujo
      dibujando: false,
      poligonoTemp: [],

      // clientes
      clienteSeleccionado: null,

      // estilos
      tempPolyOptions: {
        fillColor: '#7BAAF7', fillOpacity: 0.18,
        strokeColor: '#7BAAF7', strokeWeight: 2,
        strokeOpacity: 0.9
      },
      mapOptions: {
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        draggableCursor: 'crosshair',
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
          { featureType: "administrative", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
        ]
      },

      // UI color
      colorTemp: '#4285F4',
      swatches: [
        ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC'],
        ['#1E88E5', '#E53935', '#FDD835', '#43A047', '#8E24AA'],
        ['#039BE5', '#C62828', '#FFB300', '#2E7D32', '#6A1B9A']
      ]
    };
  },
  computed: {
    clientesConUbicacion() {
      return this.clientes.filter(
        c => c.latitud && c.longitud && !isNaN(Number(c.latitud)) && !isNaN(Number(c.longitud))
      );
    },
    zonasOrdenadas() {
      const arr = Array.isArray(this.zonas) ? this.zonas.slice() : [];
      return arr.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    },
    zonasItems() {
      return this.zonasOrdenadas.map(z => ({ key: z.key, nombre: z.nombre || z.key }));
    },
    selectedZona() {
      return (this.zonas || []).find(z => z.key === this.selectedKey) || null;
    }
  },
  created() {
    this.hidratarDesdeProps();
    this.$nextTick(() => {
      // Selecciona la primera zona si no hay selección
      if (!this.selectedKey && this.zonasOrdenadas.length) {
        this.selectedKey = this.zonasOrdenadas[0].key;
        this.onSelectZona(this.selectedKey);
      }
    });
  },
  watch: {
    zonas: {
      deep: true,
      handler() {
        this.hidratarDesdeProps(true);
        // Si aún no hubo interacción y el mapa ya está listo, puedes volver a ajustar a todas
        if (this.mapReady && !this.hasUserInteracted && !this.didInitialFit) {
          this.fitAllZones();
          this.didInitialFit = true;
        }
      }
    },
    selectedKey(newKey) {
      if (newKey) {
        this.colorTemp = this.colorByKey[newKey] || '#4285F4';
        this.ensurePathsLoaded(newKey);
        // Enfocar SOLO si el usuario no movió/zoomeó aún
        this.$nextTick(() => this.onSelectZona(newKey, true));
      }
    }
  },
  methods: {
    // ---------- Inicialización / Props ----------
    hidratarDesdeProps(merge = false) {
      const arr = Array.isArray(this.zonas) ? this.zonas : [];
      const defaults = ['#4285F4','#DB4437','#F4B400','#0F9D58','#AB47BC','#1E88E5','#E53935','#FDD835','#43A047','#8E24AA'];
      let i = 0;
      arr.forEach(z => {
        const k = z.key;
        // paths
        const paths = (z.mapa && Array.isArray(z.mapa.paths)) ? z.mapa.paths.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) })) : null;
        if (!merge || !this.pathsByKey[k]) {
          if (paths && paths.length >= 3) this.$set(this.pathsByKey, k, paths);
          else this.$delete(this.pathsByKey, k);
        }
        // color
        const color = (z.mapa && z.mapa.color) ? z.mapa.color : (this.colorByKey[k] || defaults[i % defaults.length]);
        this.$set(this.colorByKey, k, color);
        // visibilidad por defecto: true
        if (typeof this.visibleByKey[k] === 'undefined') this.$set(this.visibleByKey, k, true);
        i++;
      });

      // limpia claves que ya no existen
      const keysProp = new Set(arr.map(z => z.key));
      Object.keys(this.pathsByKey).forEach(k => { if (!keysProp.has(k)) this.$delete(this.pathsByKey, k); });
      Object.keys(this.colorByKey).forEach(k => { if (!keysProp.has(k)) this.$delete(this.colorByKey, k); });
      Object.keys(this.visibleByKey).forEach(k => { if (!keysProp.has(k)) this.$delete(this.visibleByKey, k); });
    },

    ensurePathsLoaded(key) {
      if (this.pathsByKey[key] && this.pathsByKey[key].length) return;
      const z = (this.zonas || []).find(x => x.key === key);
      if (z && z.mapa && Array.isArray(z.mapa.paths) && z.mapa.paths.length >= 3) {
        const paths = z.mapa.paths.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
        this.$set(this.pathsByKey, key, paths);
      }
    },

    // ---------- Cámara / Mapa ----------
    onMapReady() {
      this.mapReady = true;
      // Ajuste inicial a TODAS las zonas visibles (una sola vez)
      if (!this.didInitialFit) {
        this.fitAllZones();
        this.didInitialFit = true;
      }
    },
    markUserInteraction() {
      this.hasUserInteracted = true;
    },
    fitAllZones() {
      if (!this.mapReady) return;
      const map = this.$refs?.mapa?.$mapObject;
      if (!map) return;

      // Reunir bounds de las zonas visibles que tengan geometry
      let any = false;
      let north = -90, south = 90, east = -180, west = 180;

      this.zonasOrdenadas.forEach(z => {
        const k = z.key;
        if (!this.esVisible(k)) return;

        let b = null;
        if (z.mapa && z.mapa.bounds) {
          b = z.mapa.bounds;
        } else {
          const p = this.pathsByKey[k];
          if (p && p.length) b = this.getBounds(p);
        }
        if (!b) return;

        any = true;
        north = Math.max(north, Number(b.north));
        south = Math.min(south, Number(b.south));
        east  = Math.max(east,  Number(b.east));
        west  = Math.min(west,  Number(b.west));
      });

      if (!any || south > north || west > east) return;

      const gBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(south, west),
        new google.maps.LatLng(north, east)
      );
      this.$nextTick(() => map.fitBounds(gBounds));
    },

    // ---------- Leyenda / UI ----------
    esVisible(key) { return this.visibleByKey[key] !== false; },
    seleccionarYEnfocar(key) {
      this.selectedKey = key;
      // Solo enfoca si no hubo interacción (se respeta mapa libre)
      if (!this.hasUserInteracted) this.onSelectZona(key, true);
    },
    onSelectZona(key, fit = false) {
      this.ensurePathsLoaded(key);
      const z = (this.zonas || []).find(x => x.key === key);
      if (!z) return;

      // Solo hacemos fit si NO hubo interacción del usuario
      if (fit && !this.hasUserInteracted) {
        if (z.mapa && z.mapa.bounds) {
          this.fitBounds(z.mapa.bounds);
        } else {
          const p = this.pathsByKey[key];
          if (p && p.length) {
            const b = this.getBounds(p);
            this.fitBounds(b);
          }
        }
      }
      this.colorTemp = this.colorByKey[key] || '#4285F4';
    },

    // ---------- Estilos por polígono ----------
    polyOptionsFor(key) {
      const col = this.colorByKey[key] || '#4285F4';
      const sel = this.selectedKey === key;
      return {
        fillColor: col,
        fillOpacity: sel ? 0.28 : 0.20,
        strokeColor: col,
        strokeOpacity: sel ? 1 : 0.9,
        strokeWeight: sel ? 2.5 : 2,
        clickable: true
      };
    },

    // ---------- Paths por zona ----------
    getPathsFor(key) {
      const local = this.pathsByKey[key];
      return local && local.length ? local : [];
    },
    onPathsChangedByKey(key) {
      const arr = this.$refs['poly_' + key];
      const comp = Array.isArray(arr) ? arr[0] : arr;
      if (!comp || !comp.$polygonObject) return;
      const path = comp.$polygonObject.getPath();
      const nuevo = [];
      for (let i = 0; i < path.getLength(); i++) {
        const p = path.getAt(i);
        nuevo.push({ lat: p.lat(), lng: p.lng() });
      }
      this.$set(this.pathsByKey, key, nuevo);
    },

    // ---------- Dibujo ----------
    toggleDibujo() {
      if (!this.selectedKey) return;
      this.dibujando = !this.dibujando;
      if (this.dibujando) this.poligonoTemp = [];
    },
    onMapClick(e) {
      if (!this.dibujando) return;
      const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.poligonoTemp = [...this.poligonoTemp, p];
    },
    deshacerPunto() {
      this.poligonoTemp.pop();
      this.poligonoTemp = [...this.poligonoTemp];
    },
    cancelarDibujo() {
      this.poligonoTemp = [];
      this.dibujando = false;
    },

    // ---------- Guardar / Eliminar ----------
    async guardarZonaSeleccionada() {
      if (!this.selectedKey) return;
      store.commit && store.commit("dialogoprogress");

      try {
        let points = [];
        if (this.dibujando) {
          if (this.poligonoTemp.length < 3) return;
          points = this.poligonoTemp.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
        } else {
          const local = this.pathsByKey[this.selectedKey];
          if (!local || local.length < 3) return;
          points = local.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
        }

        const bounds = this.getBounds(points);
        const area_m2 = (window.google?.maps?.geometry)
          ? google.maps.geometry.spherical.computeArea(points.map(p => new google.maps.LatLng(p.lat, p.lng)))
          : null;
        const centroid = this.getCentroid(points);

        const z = this.selectedZona;
        const payload = {
          nombre: z?.nombre || `Zona ${this.selectedKey}`,
          color: this.colorByKey[this.selectedKey] || '#4285F4',
          createdAt: new Date().toISOString(),
          paths: points,
          bounds,
          centroid,
          area_m2
        };

        console.log('=== GUARDAR ZONA ===', this.selectedKey, JSON.stringify(payload, null, 2));
        if (z && z.key) await edita_tablacliente('zona', z.key, 'mapa', payload);

        // Local
        this.$set(this.pathsByKey, this.selectedKey, points);
        this.poligonoTemp = [];
        this.dibujando = false;

      } catch (e) {
        console.error(e);
      } finally {
        store.commit && store.commit("dialogoprogress");
      }
    },

    async eliminarPoligono() {
      if (!this.selectedKey) return;
      if (!this.tienePoligono(this.selectedKey)) return;
      const confirmar = window.confirm('¿Eliminar el polígono de la zona seleccionada?');
      if (!confirmar) return;

      store.commit && store.commit("dialogoprogress");
      try {
        this.$delete(this.pathsByKey, this.selectedKey);
        this.poligonoTemp = [];
        this.dibujando = false;

        const z = this.selectedZona;
        if (z && z.key) {
          await edita_tablacliente('zona', z.key, 'mapa', null);
          console.log('Eliminado en Firebase: mapa=null para', z.key);
        }
      } catch (e) {
        console.error('Error al eliminar:', e);
      } finally {
        store.commit && store.commit("dialogoprogress");
      }
    },

    aplicarColor() {
      if (!this.selectedKey) return;
      this.$set(this.colorByKey, this.selectedKey, this.colorTemp || '#4285F4');
    },

    tienePoligono(key) {
      const p = this.pathsByKey[key];
      return Array.isArray(p) && p.length >= 3;
    },

    // ---------- Utilidades geométricas ----------
    getBounds(points) {
      let north = -90, south = 90, east = -180, west = 180;
      points.forEach(p => {
        if (p.lat > north) north = p.lat;
        if (p.lat < south) south = p.lat;
        if (p.lng > east)  east  = p.lng;
        if (p.lng < west)  west  = p.lng;
      });
      return { north, south, east, west };
    },
    getCentroid(points) {
      const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
      return { lat: sum.lat / points.length, lng: sum.lng / points.length };
    },
    fitBounds(b) {
      if (!this.mapReady) return;
      const map = this.$refs?.mapa?.$mapObject;
      if (!map) return;
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(Number(b.south), Number(b.west)),
        new google.maps.LatLng(Number(b.north), Number(b.east))
      );
      this.$nextTick(() => map.fitBounds(bounds));
    },

    // ---------- UI clientes ----------
    mostrarInfo(c) {
      this.clienteSeleccionado = c;
      this.centro = { lat: Number(c.latitud), lng: Number(c.longitud) };
      this.zoom = 16;
    },
    cerrar() { this.$emit('cerrar', false); }
  }
};
</script>

<style scoped>
.fab-ubicarme {
  position: absolute;
  bottom: 22px;
  right: 22px;
  z-index: 3020;
}

.legend-card {
  position: absolute;
  top: 12px;
  left: 12px;
  background: white;
  padding: 8px 10px;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  z-index: 3030;
  max-height: 46%;
  overflow: auto;
  min-width: 180px;
}
.legend-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin: 4px 0;
}
.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  margin: 0 8px;
  border: 1px solid rgba(0,0,0,0.15);
}
.legend-name {
  cursor: pointer;
  user-select: none;
}
</style>