<template>
    <v-dialog v-model="dial" persistent :fullscreen="$vuetify.breakpoint.xs" max-width="600">
        <v-card :class="{ 'mobile-dialog': $vuetify.breakpoint.xs }">
            <v-toolbar flat dark color="indigo darken-2" dense>
                <v-btn icon @click="cerrar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title class="text-subtitle-1">
                    Ordenar Pedidos
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip color="white" text-color="indigo" x-small class="font-weight-bold">
                    {{ pedidosOrdenados.length }} pedidos
                </v-chip>
            </v-toolbar>

            <v-card-text class="pa-3">
                <v-alert dense text type="info" class="mb-3">
                    <div class="d-flex align-center">
                        <div style="font-size: 12px">
                            <span class="d-block"><strong>Primero (arriba)</strong> = Último en entregar</span>
                            <span class="d-block"><strong>Último (abajo)</strong> = Primero en entregar</span>
                        </div>
                    </div>
                </v-alert>

                <div class="d-flex justify-space-between align-center mb-2">
                    <div class="text-caption grey--text">
                        <v-icon x-small left>mdi-gesture-swipe</v-icon>
                        Arrastra para reordenar
                    </div>
                    <div>
                        <v-btn icon x-small @click="invertirOrden" class="mr-1">
                            <v-icon x-small>mdi-swap-vertical</v-icon>
                        </v-btn>
                        <v-btn icon x-small @click="ordenarPorCliente">
                            <v-icon x-small>mdi-sort-alphabetical-ascending</v-icon>
                        </v-btn>
                    </div>
                </div>

                <draggable v-model="pedidosOrdenados" handle=".drag-handle" animation="200" ghost-class="ghost-card"
                    @end="onDragEnd">
                    <transition-group name="flip-list" tag="div">
                        <v-card v-for="(pedido, index) in pedidosOrdenados" :key="pedido.id" outlined
                            class="mb-2 pedido-card-mobile"
                            :class="{ 'first-card': index === 0, 'last-card': index === pedidosOrdenados.length - 1 }">
                            <div class="d-flex align-center pa-2">
                                <div class="drag-handle mr-2">
                                    <v-icon small color="grey">mdi-drag-vertical</v-icon>
                                </div>

                                <v-avatar size="28" :color="getOrdenColor(index)"
                                    class="mr-2 white--text font-weight-bold">
                                    {{ index + 1 }}
                                </v-avatar>

                                <div class="flex-grow-1 overflow-hidden">
                                    <div class="d-flex align-center">
                                            {{ pedido.cliente_nombre }}
                                    </div>
                                    <div class="d-flex text-caption grey--text mt-1">
                                        <span class="text-truncate" style="max-width: 120px">
                                            <v-icon x-small>mdi-identifier</v-icon>
                                            {{ pedido.doc_numero }}
                                        </span>
                                    </div>
                                </div>

                                <div class="text-right ml-2">
                                    <div class="text-caption font-weight-bold success--text">
                                        {{ number2(pedido.total) }}
                                    </div>
                                    <div class="text-caption grey--text">
                                        {{ number2(pedido.peso_total || 0) }} kg
                                    </div>
                                </div>
                            </div>

                            <v-divider class="mx-2"></v-divider>

                            <div class="d-flex justify-space-between align-center pa-2">
                                <div class="text-caption grey--text">
                                    <v-icon x-small left>mdi-map-marker</v-icon>
                                    {{pedido.cliente_direccion }}
                                </div>
                                <v-chip x-small :color="index === pedidosOrdenados.length - 1 ? 'success' :
                                    index === 0 ? 'orange' : 'grey lighten-1'" label class="px-2">
                                    {{ getOrdenLabel(index) }}
                                </v-chip>
                            </div>
                        </v-card>
                    </transition-group>
                </draggable>

                <v-divider class="my-3"></v-divider>

                <v-row dense class="mt-2">
                    <v-col cols="6" class="py-1">
                        <div class="d-flex align-center">
                            <v-icon small color="primary" class="mr-1">mdi-package</v-icon>
                            <div>
                                <div class="text-caption grey--text">Total Pedidos</div>
                                <div class="text-body-1 primary--text font-weight-bold">{{ pedidosOrdenados.length }}
                                </div>
                            </div>
                        </div>
                    </v-col>
                    <v-col cols="6" class="py-1">
                        <div class="d-flex align-center">
                            <v-icon small color="orange" class="mr-1">mdi-weight</v-icon>
                            <div>
                                <div class="text-caption grey--text">Peso Total</div>
                                <div class="text-body-1 orange--text font-weight-bold">{{ number2(pesoTotal) }} kg</div>
                            </div>
                        </div>
                    </v-col>
                    <v-col cols="6" class="py-1">
                        <div class="d-flex align-center">
                            <v-icon small color="success" class="mr-1">mdi-cash</v-icon>
                            <div>
                                <div class="text-caption grey--text">Contado</div>
                                <div class="text-body-1 success--text font-weight-bold">S/ {{ number2(totalContado) }}
                                </div>
                            </div>
                        </div>
                    </v-col>
                    <v-col cols="6" class="py-1">
                        <div class="d-flex align-center">
                            <v-icon small color="warning" class="mr-1">mdi-credit-card</v-icon>
                            <div>
                                <div class="text-caption grey--text">Crédito</div>
                                <div class="text-body-1 warning--text font-weight-bold">S/ {{ number2(totalCredito) }}
                                </div>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-3">
                <div class="d-flex" style="gap: 8px">
                    <v-btn text color="grey" @click="cerrar" class="flex-grow-1">
                        <v-icon left small>mdi-close</v-icon>
                        Cancelar
                    </v-btn>
                    <v-btn color="success" @click="confirmar" :loading="cargando" class="flex-grow-1">
                        <v-icon left small>mdi-check</v-icon>
                        Confirmar Orden
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import draggable from 'vuedraggable';

export default {
    name: 'DialOrdenLifo',
    components: { draggable },
    props: {
        pedidos: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            dial: true,
            pedidosOrdenados: [],
            cargando: false
        };
    },
    computed: {
        pesoTotal() {
            return this.pedidosOrdenados.reduce((sum, p) => sum + Number(p.peso_total || 0), 0);
        },
        totalContado() {
            return this.pedidosOrdenados
                .filter(p => String(p.condicion_pago || '').toUpperCase().includes('CONTADO'))
                .reduce((sum, p) => sum + Number(p.total || 0), 0);
        },
        totalCredito() {
            return this.pedidosOrdenados
                .filter(p => {
                    const cond = String(p.condicion_pago || '').toUpperCase();
                    return cond.includes('CREDITO') || cond.includes('CRÉDITO');
                })
                .reduce((sum, p) => sum + Number(p.total || 0), 0);
        }
    },
    created() {
        this.pedidosOrdenados = [...this.pedidos].map((p, idx) => ({
            ...p,
            orden_lifo: idx + 1
        }));
    },
    methods: {
        onDragEnd() {
            this.pedidosOrdenados.forEach((p, idx) => {
                p.orden_lifo = idx + 1;
            });
        },
        invertirOrden() {
            this.pedidosOrdenados.reverse();
            this.onDragEnd();
        },
        ordenarPorCliente() {
            this.pedidosOrdenados.sort((a, b) =>
                (a.cliente_nombre || '').localeCompare(b.cliente_nombre || '')
            );
            this.onDragEnd();
        },
        getOrdenColor(index) {
            if (index === 0) return 'orange darken-1';
            if (index === this.pedidosOrdenados.length - 1) return 'success';
            return 'grey';
        },
        getOrdenLabel(index) {
            if (index === 0) return 'Último';
            if (index === this.pedidosOrdenados.length - 1) return '1ro';
            return `${this.pedidosOrdenados.length - index}°`;
        },
        getCondicionColor(condicion) {
            const cond = String(condicion || '').toUpperCase();
            if (cond.includes('CONTADO')) return 'success';
            if (cond.includes('CREDITO') || cond.includes('CRÉDITO')) return 'warning';
            return 'grey';
        },
        truncarTexto(texto, maxLength) {
            if (!texto) return '';
            return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
        },
        number2(n) {
            return Number(n || 0).toFixed(2);
        },
        cerrar() {
            this.dial = false;
            this.$emit('cerrar');
        },
        confirmar() {
            const pedidosConOrden = this.pedidosOrdenados.map((p, idx) => ({
                ...p,
                orden_lifo: idx + 1
            }));
            this.$emit('confirmar', pedidosConOrden);
        }
    }
};
</script>

<style scoped>
.pedido-card-mobile {
    transition: all 0.2s ease;
    border-radius: 6px !important;
}

.pedido-card-mobile:hover {
    background-color: #f8f9fa;
}

.drag-handle {
    cursor: grab;
    padding: 4px;
    border-radius: 4px;
}

.drag-handle:active {
    cursor: grabbing;
    background: #f0f0f0;
}

.ghost-card {
    opacity: 0.5;
    background: #e3f2fd !important;
    border: 2px dashed #1976d2 !important;
}

.first-card {
    border-left: 3px solid #ff9800 !important;
}

.last-card {
    border-left: 3px solid #4caf50 !important;
}

.flip-list-move {
    transition: transform 0.3s;
}

.mobile-dialog {
    border-radius: 0 !important;
}

.text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (min-width: 600px) {
    .pedido-card-mobile {
        padding: 8px !important;
    }

    .v-card-text {
        max-height: 60vh;
        overflow-y: auto;
    }
}
</style>