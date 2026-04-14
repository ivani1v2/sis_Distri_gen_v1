<template>
    <v-dialog v-model="visibleLocal" max-width="520">
        <v-card class="pa-3">
            <v-toolbar flat dense>
                <v-toolbar-title class="subtitle-1">Pago adelanto</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="cerrar"><v-icon>mdi-close</v-icon></v-btn>
            </v-toolbar>

            <v-row dense>
                <v-col cols="12" sm="6">
                    <v-text-field outlined dense type="date" label="Fecha" v-model="form.fecha"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-select outlined dense label="Tipo operacion" :items="tiposOperacion" v-model="form.tipo_op"></v-select>
                </v-col>
                <v-col cols="12" sm="6" class="mt-n5">
                    <v-text-field outlined dense label="N° operacion" v-model="form.n_operacion"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" class="mt-n5">
                    <v-text-field outlined dense label="Banco" v-model="form.banco"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" class="mt-n5">
                    <v-text-field outlined dense type="number" min="0" :max="maxAdelanto" step="0.01" label="Monto"
                        v-model.number="form.monto" @input="ajustarMontoMaximo" @blur="ajustarMontoMaximo"
                        @change="ajustarMontoMaximo"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" class="mt-n5">
                    <v-select outlined dense label="Moneda" :items="monedasOpciones" item-text="label" item-value="simbolo"
                        v-model="form.moneda"></v-select>
                </v-col>
                <v-col cols="12" class="mt-n5">
                    <v-text-field outlined dense readonly label="Saldo (referencial)" :value="saldoTexto"></v-text-field>
                </v-col>
                <v-col cols="12" class="mt-n5" v-if="excedeTotal">
                    <v-alert dense text type="warning" class="py-1 px-2 mb-0 caption">
                        El monto supera al total del pedido
                    </v-alert>
                </v-col>
            </v-row>

            <v-card-actions>
                <v-btn text color="grey darken-1" @click="limpiar">Limpiar</v-btn>
                <v-spacer></v-spacer>
                <v-btn text @click="cerrar">Cancelar</v-btn>
                <v-btn color="indigo" dark @click="guardar">Guardar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment'

export default {
    name: 'dial_pago_adelanto',
    props: {
        value: { type: Boolean, default: false },
        adelanto: { type: Object, default: () => ({}) },
        tiposOperacion: { type: Array, default: () => [] },
        monedasOpciones: { type: Array, default: () => [] },
        monedaBase: { type: String, default: 'S/' },
        totalDocumento: { type: Number, default: 0 },
        saldoReferencial: { type: Number, default: 0 },
    },
    data() {
        return {
            visibleLocal: this.value,
            form: this.toForm(this.adelanto),
        }
    },
    computed: {
        esEfectivo() {
            const t = String(this.form.tipo_op).trim().toUpperCase();
            return t === 'EFECTIVO';
        },
        totalDocumentoNum() {
            const n = Number(this.totalDocumento);
            if (Number.isFinite(n) && n > 0) return n;
            const fallback = Number(this.saldoReferencial);
            return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
        },
        montoActualNum() {
            const n = Number(this.form.monto);
            return Number.isFinite(n) && n > 0 ? n : 0;
        },
        maxAdelanto() {
            return Number(this.totalDocumentoNum.toFixed(2));
        },
        saldoDinamico() {
            const saldo = this.totalDocumentoNum - this.montoActualNum;
            return Number((saldo > 0 ? saldo : 0).toFixed(2));
        },
        saldoTexto() {
            return `${this.monedaBase} ${this.saldoDinamico.toFixed(2)}`;
        },
        excedeTotal() {
            return this.totalDocumentoNum > 0 && this.montoActualNum > this.totalDocumentoNum;
        },
        monedaPorDefecto() {
            const monedaDefecto = this.$store.state.configuracion?.moneda_defecto;
            const monedaEncontrada = this.monedasOpciones.find(m => 
                m.codigo === monedaDefecto || m.simbolo === monedaDefecto
            );
            return monedaEncontrada?.simbolo || this.monedaBase;
        }
    },
    watch: {
        value(nv) {
            this.visibleLocal = nv;
            if (nv) {
                this.form = this.toForm(this.adelanto);
            }
        },
        visibleLocal(nv) {
            this.$emit('input', nv);
        },
        adelanto() {
            if (this.visibleLocal) {
                this.form = this.toForm(this.adelanto);
            }
        },
        'form.monto'() {
            this.ajustarMontoMaximo();
        }
    },
    methods: {
        monedaSimbolo() {
            return this.$store.state.moneda.find(m =>
                m.codigo === this.$store.state.configuracion?.moneda_defecto
            )?.simbolo || 'S/';
        },
        normalizaMonedaA_simbolo(valorMoneda) {
            const v = String(valorMoneda || '').trim();
            if (!v) return this.monedaPorDefecto;

            const porSimbolo = (this.monedasOpciones || []).find(m => String(m.simbolo || '').trim() === v);
            if (porSimbolo) return String(porSimbolo.simbolo || '').trim();

            const porCodigo = (this.monedasOpciones || []).find(m => String(m.codigo || '').trim() === v);
            if (porCodigo) return String(porCodigo.simbolo || '').trim();

            return this.monedaPorDefecto;
        },
        toForm(src) {
            const fechaRaw = src ? src.fecha : null;
            let fecha = '';
            if (typeof fechaRaw === 'number' && Number.isFinite(fechaRaw)) {
                fecha = moment.unix(fechaRaw).format('YYYY-MM-DD');
            } else if (typeof fechaRaw === 'string') {
                fecha = fechaRaw.trim();
            }

            const montoRaw = src ? src.monto : null;
            const monto = (montoRaw === null || montoRaw === undefined || montoRaw === '') ? null : Number(montoRaw);

            let monedaInicial = this.monedaPorDefecto;
            if (src && src.moneda) {
                monedaInicial = this.normalizaMonedaA_simbolo(src.moneda);
            }

            return {
                fecha,
                tipo_op: src && src.tipo_op ? String(src.tipo_op).trim() : '',
                n_operacion: src && src.n_operacion ? String(src.n_operacion).trim() : '',
                banco: src && src.banco ? String(src.banco).trim() : '',
                monto: Number.isFinite(monto) ? monto : null,
                moneda: monedaInicial,
            };
        },
        cerrar() {
            this.visibleLocal = false;
        },
        ajustarMontoMaximo() {
            let raw = Number(this.form.monto);

            if (!Number.isFinite(raw)) {
                this.form.monto = null;
                return;
            }

            if (raw < 0) {
                this.form.monto = 0;
                return;
            }
        },
        limpiar() {
            this.form = {
                fecha: '',
                tipo_op: '',
                n_operacion: '',
                banco: '',
                monto: null,
                moneda: this.monedaPorDefecto
            };
        },
        guardar() {
            const monto = Number(this.form.monto);
            const tieneMonto = Number.isFinite(monto) && monto > 0;

            if (!tieneMonto) {
                this.$emit('save', null);
                this.visibleLocal = false;
                return;
            }

            if (monto > this.maxAdelanto) {
                this.$store.commit('dialogosnackbar', 'El adelanto no puede superar el total del documento');
                return;
            }

            if (!this.form.fecha) {
                this.$store.commit('dialogosnackbar', 'Fecha es obligatoria');
                return;
            }
            if (!this.form.tipo_op) {
                this.$store.commit('dialogosnackbar', 'Tipo operacion es obligatorio');
                return;
            }
            if (!this.form.banco) {
                this.$store.commit('dialogosnackbar', 'Banco es obligatorio');
                return;
            }
            if (!this.form.moneda) {
                this.$store.commit('dialogosnackbar', 'Moneda es obligatoria');
                return;
            }
            if (!this.esEfectivo && !String(this.form.n_operacion).trim()) {
                this.$store.commit('dialogosnackbar', 'N° operacion es obligatorio');
                return;
            }

            const payload = {
                fecha: moment(this.form.fecha, 'YYYY-MM-DD').unix(),
                tipo_op: String(this.form.tipo_op).trim(),
                banco: String(this.form.banco).trim(),
                monto,
                moneda: this.normalizaMonedaA_simbolo(this.form.moneda),
            };

            const nro = String(this.form.n_operacion).trim();
            if (nro) {
                payload.n_operacion = nro;
            }

            this.$emit('save', payload);
            this.visibleLocal = false;
        }
    }
}
</script>