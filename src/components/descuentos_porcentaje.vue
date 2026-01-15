<template>
    <v-row class="mx-auto text-center" dense v-show="visible">
        <v-col cols="4">
            <v-text-field dense outlined type="number" label="% Desc 1" v-model.number="desc_1"
                @input="calculaDescuentos()" hide-details min="0" max="100" />
        </v-col>
        <v-col cols="4">
            <v-text-field dense outlined type="number" label="% Desc 2" v-model.number="desc_2"
                @input="calculaDescuentos()" hide-details min="0" max="100" />
        </v-col>
        <v-col cols="4">
            <v-text-field dense outlined type="number" label="% Desc 3" v-model.number="desc_3"
                @input="calculaDescuentos()" hide-details min="0" max="100" />
        </v-col>
    </v-row>
</template>

<script>
export default {
    name: 'DescuentosPorcentaje',
    props: {
        precioBase: {
            type: Number,
            default: 0
        },
        descuentosIniciales: {
            type: Object,
            default: () => ({ desc_1: 0, desc_2: 0, desc_3: 0 })
        },
        esBono: {
            type: Boolean,
            default: false
        },
        decimales: {
            type: Number,
            default: 2
        }
    },
    data() {
        return {
            desc_1: 0,
            desc_2: 0,
            desc_3: 0
        }
    },
    computed: {
        visible() {
            const config = this.$store.state.configuracion || {};
            return config.desc_porcentaje_catalogo && !this.esBono;
        }
    },
    watch: {
        descuentosIniciales: {
            immediate: true,
            handler(val) {
                if (val) {
                    this.desc_1 = val.desc_1 || 0;
                    this.desc_2 = val.desc_2 || 0;
                    this.desc_3 = val.desc_3 || 0;
                    this.$nextTick(() => this.calculaDescuentos());
                }
            }
        },
        precioBase() {
            this.calculaDescuentos();
        },

    },
    methods: {
        calculaDescuentos() {
            const base = Number(this.precioBase) || 0;
            const d1 = Number(this.desc_1) || 0;
            const d2 = Number(this.desc_2) || 0;
            const d3 = Number(this.desc_3) || 0;

            if (d1 === 0 && d2 === 0 && d3 === 0) {
                this.emitirCambio(base, 0);
                return;
            }
            let precioActual = base;
            if (d1 > 0) precioActual = precioActual * (1 - d1 / 100);
            if (d2 > 0) precioActual = precioActual * (1 - d2 / 100);
            if (d3 > 0) precioActual = precioActual * (1 - d3 / 100);

            const precioFinal = this.redondear(precioActual);
            const montoDescuento = this.redondear(base - precioActual);

            this.emitirCambio(precioFinal, montoDescuento);
        },
        emitirCambio(precioFinal = null, montoDescuento = null) {
            this.$emit('cambio', {
                desc_1: this.desc_1 || 0,
                desc_2: this.desc_2 || 0,
                desc_3: this.desc_3 || 0,
                precioFinal: precioFinal !== null ? precioFinal : this.precioBase,
                montoDescuento: montoDescuento || 0
            });
        },
        redondear(valor) {
            return parseFloat(Number(valor).toFixed(this.decimales));
        },

        reset() {
            console.log('sse')
            this.desc_1 = 0;
            this.desc_2 = 0;
            this.desc_3 = 0;
            this.calculaDescuentos();
        }
    }
}
</script>
