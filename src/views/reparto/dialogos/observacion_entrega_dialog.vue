<template>
    <v-dialog v-model="dial" max-width="560" persistent>
        <v-card>
            <v-card-title class="subtitle-1 font-weight-bold">
                <v-icon left color="primary">mdi-note-edit-outline</v-icon>
                Observación de entrega
            </v-card-title>

            <v-card-text>
                <v-textarea v-model="texto" outlined auto-grow rows="3" counter="500" :maxlength="500"
                    label="Observación general del reparto" />
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn text @click="dial = false">Cancelar</v-btn>
                <v-btn color="primary" dark :disabled="guardando" @click="guardar">
                    <v-icon left small>mdi-content-save</v-icon>
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { graba_observacion_entrega } from "../../../db";

export default {
    name: "observacion_entrega_dialog",
    props: {
        value: { type: Boolean, default: false },
        grupo: { type: [String, Number], default: null },
        observacionActual: { type: String, default: "" }
    },
    data() {
        return {
            dial: false,
            texto: "",
            guardando: false
        };
    },
    watch: {
        value: {
            immediate: true,
            handler(v) {
                this.dial = v;
            }
        },
        dial(v) {
            this.$emit("input", v);
            if (v) {
                this.texto = this.observacionActual || "";
            }
        },
        observacionActual(v) {
            if (this.dial) {
                this.texto = v || "";
            }
        }
    },
    methods: {
        async guardar() {
            if (!this.grupo) {
                alert("Seleccione un reparto primero");
                return;
            }

            try {
                this.guardando = true;
                this.$store.commit("dialogoprogress");
                const limpio = String(this.texto || "").trim();
                await graba_observacion_entrega(String(this.grupo), limpio);
                this.$store.commit("dialogoprogress");
                this.$emit("guardado", limpio);
                this.dial = false;
            } catch (error) {
                console.error("Error guardando observación de entrega:", error);
                this.$store.commit("dialogoprogress");
                alert("No se pudo guardar la observación");
            } finally {
                this.guardando = false;
            }
        }
    }
};
</script>
