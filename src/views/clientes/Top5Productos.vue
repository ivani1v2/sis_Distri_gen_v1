<template>
  <v-card class="elevation-1 rounded-lg mb-2">
    <v-card-title class="py-1 px-2 subtitle-2 font-weight-bold blue-grey--text text--darken-2">
      <v-icon small color="amber" class="mr-2">mdi-package-variant-closed</v-icon>
      Top 5 Productos Más Vendidos
      <span v-if="productosParaMostrar" class="ml-2 font-weight-black">
        ({{ productosParaMostrar.totalCantidad }} und)
      </span>
      <v-spacer></v-spacer>
      <v-chip v-if="esMultiMes" x-small color="primary" outlined>
        {{ meses.length }} meses
      </v-chip>
    </v-card-title>
    <v-divider></v-divider>
    
    <v-card-text>
      <template v-if="esMultiMes">
        <v-tabs v-model="tabActivo" grow show-arrows class="mb-4">
          <v-tab v-for="(mes, idx) in meses" :key="idx">
            {{ mes.nombre }}
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tabActivo">
          <v-tab-item 
            v-for="(mes, idx) in meses" 
            :key="idx"
            :transition="false"
            :reverse-transition="false"
          >
            <div v-if="tabActivo === idx">
              <div class="d-flex flex-column flex-md-row align-center justify-center">
                <div style="width: 100%; max-width: 250px; height: 205px;" class="mb-2 mb-md-0">
                  <canvas :ref="'chartTop5_' + idx" class="top5-chart"></canvas>
                </div>
                
                <div v-if="mes.productos.length" class="ml-0 ml-md-6" style="min-width: 250px;">
                  <div class="legend-container">
                    <div 
                      v-for="(prod, pidx) in mes.productos" 
                      :key="pidx"
                      class="legend-item d-flex align-center py-1"
                      @mouseenter="highlightSegment(pidx, true)"
                      @mouseleave="highlightSegment(pidx, false)"
                    >
                      <div 
                        class="color-box mr-2" 
                        :style="{ backgroundColor: colores[pidx % colores.length] }"
                      ></div>
                      <div class="legend-text">
                        <span class="font-weight-medium caption">{{ prod.codigo_producto }}</span>
                        <span class="mx-1">-</span>
                        <span class="caption" :title="prod.nombre_producto">
                          {{ prod.nombre_producto }}
                        </span>
                        <span class="font-weight-bold caption ml-1">
                          (Cant. {{ prod.cantidad_total }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-tab-item>
        </v-tabs-items>
      </template>

      <template v-else>
        <div v-if="mesUnico">
          <div class="d-flex flex-column flex-md-row align-center justify-center">
            <div style="width: 100%; max-width: 250px; height: 275px;" class="mb-2 mb-md-0">
              <canvas ref="chartUnico" class="top5-chart"></canvas>
            </div>
            
            <div v-if="mesUnico.productos.length" class="ml-0 ml-md-6" style="min-width: 250px;">
              <div class="legend-container">
                <div 
                  v-for="(prod, idx) in mesUnico.productos" 
                  :key="idx"
                  class="legend-item d-flex align-center py-1"
                  @mouseenter="highlightSegment(idx, true)"
                  @mouseleave="highlightSegment(idx, false)"
                >
                  <div 
                    class="color-box mr-2" 
                    :style="{ backgroundColor: colores[idx % colores.length] }"
                  ></div>
                  <div class="legend-text">
                    <span class="font-weight-medium">{{ prod.codigo_producto }}</span>
                    <span class="mx-1">-</span>
                    <span :title="prod.nombre_producto">
                      {{ prod.nombre_producto }}
                    </span>
                    <span class="font-weight-bold ml-1">
                      (Cant. {{ prod.cantidad_total }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!tieneProductos" class="text-center py-8">
        <v-icon size="48" color="grey lighten-2" class="mb-2">mdi-package-variant-closed</v-icon>
        <div class="grey--text">No hay información de productos para este período</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Chart from "chart.js/auto";

export default {
  name: "Top5Productos",
  props: {
    datosCliente: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      tabActivo: 0,
      chartInstances: {}
    };
  },
  computed: {
    esMultiMes() {
      return this.datosCliente.length > 1;
    },

    tieneProductos() {
      return this.datosCliente.some(mes => 
        mes.top_5_productos && mes.top_5_productos.length > 0
      );
    },

    productosParaMostrar() {
      return this.esMultiMes ? this.meses[this.tabActivo] : this.mesUnico;
    },

    meses() {
      return this.datosCliente.map(mes => {
        const productosRaw = mes.top_5_productos || [];
        const totalCantidad = productosRaw.reduce(
          (sum, p) => sum + Number(p.cantidad_total || 0), 
          0
        );
        
        const productos = productosRaw.map(p => ({
          ranking: p.ranking || 'N/A',
          codigo_producto: p.codigo_producto || 'S/C',
          nombre_producto: p.nombre_producto || 'SIN NOMBRE',
          cantidad_total: Number(p.cantidad_total || 0)
        })).sort((a, b) => Number(a.ranking) - Number(b.ranking));

        return {
          nombre: `${mes.mes_nombre_es} ${mes.anio}`,
          productos,
          totalCantidad
        };
      });
    },

    mesUnico() {
      return this.datosCliente.length === 1 ? this.meses[0] : null;
    },

    colores() {
      return [
        "#2196F3", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0",
        "#00BCD4", "#FFC107", "#795548", "#607D8B", "#F44336"
      ];
    }
  },
  watch: {
    datosCliente: {
      immediate: true,
      handler() {
        this.tabActivo = 0;
        this.destruirTodosCharts();
        this.$nextTick(() => {
          setTimeout(() => this.crearChartActivo(), 300);
        });
      }
    },
    tabActivo() {
      this.$nextTick(() => {
        setTimeout(() => this.crearChartActivo(), 300);
      });
    }
  },
  methods: {
    destruirTodosCharts() {
      Object.values(this.chartInstances).forEach(chart => {
        if (chart) chart.destroy();
      });
      this.chartInstances = {};
    },

    highlightSegment(index, highlight) {
      const chart = this.esMultiMes 
        ? this.chartInstances[`chart_${this.tabActivo}`]
        : this.chartInstances.chart_unico;
      
      if (chart) {
        const meta = chart.getDatasetMeta(0);
        if (meta.data[index]) {
          meta.data[index].hover = highlight;
          chart.update();
        }
      }
    },

    crearChartActivo() {
      if (!this.tieneProductos || !this.productosParaMostrar) return;

      const { productos, totalCantidad } = this.productosParaMostrar;
      if (!productos.length) return;

      let canvas;
      if (this.esMultiMes) {
        const canvasRef = this.$refs[`chartTop5_${this.tabActivo}`];
        canvas = Array.isArray(canvasRef) ? canvasRef[0] : canvasRef;
      } else {
        canvas = this.$refs.chartUnico;
      }

      if (!canvas) {
        setTimeout(() => this.crearChartActivo(), 500);
        return;
      }

      const ctx = canvas.getContext("2d");
      const chartKey = this.esMultiMes ? `chart_${this.tabActivo}` : 'chart_unico';

      if (this.chartInstances[chartKey]) {
        this.chartInstances[chartKey].destroy();
      }

      const labels = productos.map(p => {
        return `${p.codigo_producto} - ${p.nombre_producto}`;
      });
      
      const data = productos.map(p => p.cantidad_total);
      const backgroundColors = productos.map((_, i) => this.colores[i % this.colores.length]);

      try {
        this.chartInstances[chartKey] = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: backgroundColors,
              borderColor: "white",
              borderWidth: 2,
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
              legend: {
                display: false // Ocultamos la leyenda nativa de Chart.js
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw || 0;
                    const percentage = totalCantidad > 0 
                      ? ((value / totalCantidad) * 100).toFixed(1) 
                      : 0;
                    return `${context.label}: ${value} und (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error al crear chart:', error);
      }
    }
  },
  beforeDestroy() {
    this.destruirTodosCharts();
  }
};
</script>

<style scoped>
.top5-chart {
  max-height: 350px;
  max-width: 350px;
}

.v-tabs {
  margin-bottom: 8px;
}

.v-tab {
  text-transform: none !important;
  letter-spacing: normal !important;
  font-size: 0.85rem !important;
}

/* Estilos para la leyenda personalizada */
.legend-container {
  max-height: 350px;
  overflow-y: auto;
  padding-right: 8px;
}

.legend-item {
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 8px;
  transition: background-color 0.2s;
}

.legend-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-text {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

/* Responsive: en móvil la leyenda ocupa todo el ancho */
@media (max-width: 959px) {
  .legend-container {
    max-height: none;
    width: 100%;
  }
  
  .legend-text {
    white-space: normal;
    flex-wrap: wrap;
  }
  
  .text-truncate {
    max-width: none;
  }
}
</style>