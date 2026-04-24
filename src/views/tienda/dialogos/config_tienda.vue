<template>
    <v-dialog v-model="dial" class="mx-auto" max-width="550" persistent>
        <div>
            <v-system-bar window dark>
                <v-icon large color="red" @click="cierre">mdi-close</v-icon>
                <v-spacer></v-spacer>
            </v-system-bar>
        </div>

        <v-card outlined class="rounded-lg">
            <v-card-title class="font-weight-bold">
                Configuracion de pedidos
            </v-card-title>

            <v-divider />

            <v-card-text class="mt-6">
                <v-text-field v-model.number="pedidoMinimo" label="Monto minimo de pedido" prefix="S/ " type="number"
                    outlined dense min="0" hint="El pedido no podra registrarse si no supera este monto"
                    persistent-hint />

                <v-text-field v-model="ultimaSincronizacion" class="mt-4" label="Ultima sincronizacion"
                    type="datetime-local" prepend-inner-icon="mdi-clock-outline" outlined dense
                    hint="Solo se enviaran registros modificados despues de esta fecha. Si lo dejas vacio, se enviara todo."
                    persistent-hint />

                <v-text-field v-model="telefonoWhatsapp" class="mt-4" label="Telefono de WhatsApp" type="tel"
                    prepend-inner-icon="mdi-whatsapp" outlined dense
                    hint="Numero al que se dirigiran los clientes cuando tengan dudas" persistent-hint />

                <v-autocomplete v-model="comprobantesPermitidos" class="mt-4" :items="itemsComprobantes"
                    item-text="label" item-value="value" label="Comprobantes permitidos" multiple chips deletable-chips
                    outlined dense hint="Selecciona que tipos de comprobante aceptara la tienda" persistent-hint />

                <v-row class="mt-4">
                    <v-col cols="6">
                        <v-text-field v-model="serie" label="Serie" type="text" prepend-inner-icon="mdi-counter"
                            outlined dense hint="Número de serie para pedidos" persistent-hint />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field :value="moneda" label="Moneda" type="text" :disabled="true"
                            prepend-inner-icon="mdi-check" outlined dense
                            persistent-hint />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn class="mr-2" color="secondary" outlined :loading="guardandoSincronizando"
                    @click="guardarYSincronizarTodo">
                    Sincronizar todo
                </v-btn>
                <v-btn color="primary" :loading="guardando" @click="guardar">
                    Guardar cambios
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import firebase from "firebase/app"
import "firebase/database"
import store from "@/store"

export default {
    name: "ConfiguracionPedido",

    data() {
        return {
            dial: false,
            pedidoMinimo: 0,
            ultimaSincronizacion: "",
            telefonoWhatsapp: "",
            comprobantesPermitidos: ["B", "F", "T"],
            serie: "APP",
            moneda: "",
            itemsComprobantes: [
                { label: "Boleta (B)", value: "B" },
                { label: "Factura (F)", value: "F" },
                { label: "Nota de venta (T)", value: "T" },
            ],
            guardando: false,
            guardandoSincronizando: false,
        }
    },
    created() {
        this.dial = true
    },
    mounted() {
        this.moneda = this.monedaSimbolo
        this.cargarConfiguracion()
    },
    computed: {
        monedaSimbolo() {
            return this.$store.state.moneda.find(m => m.codigo == this.$store.state.configuracion.moneda_defecto)?.simbolo || 'S/ ';
        },
    },
    methods: {
        obtenerPayloadConfiguracion() {
            return {
                pedido_minimo: Number(this.pedidoMinimo) || 0,
                ultima_sincronizacion: this.parsearDatetimeLocal(this.ultimaSincronizacion),
                telefono_whatsapp: String(this.telefonoWhatsapp || "").trim(),
                comprobantes_permitidos: Array.isArray(this.comprobantesPermitidos)
                    ? this.comprobantesPermitidos.filter(Boolean)
                    : [],
                serie: String(this.serie || "APP").trim(),
                moneda: String(this.moneda || this.monedaSimbolo).trim(),
                updatedAt: Date.now(),
            }
        },
        refConfig() {
            return firebase
                .database()
                .ref(store.state.baseDatos.bd)
                .child("tienda")
                .child("configuracion")
        },

        async cargarConfiguracion() {
            const snap = await this.refConfig().once("value")
            const data = snap.val() || {}
            this.pedidoMinimo = data.pedido_minimo || 0
            this.ultimaSincronizacion = this.formatearDatetimeLocal(data.ultima_sincronizacion)
            this.telefonoWhatsapp = data.telefono_whatsapp || ""
            this.comprobantesPermitidos = Array.isArray(data.comprobantes_permitidos) && data.comprobantes_permitidos.length
                ? data.comprobantes_permitidos
                : ["B", "F", "T"]
            this.serie = data.serie || "APP"
            this.moneda = data.moneda || this.monedaSimbolo
        },

        async guardarConfiguracion() {
            const payload = this.obtenerPayloadConfiguracion()
            await this.refConfig().update(payload)
            return payload
        },
        async guardar() {
            try {
                this.guardando = true
                store.commit("dialogoprogress")
                const payload = await this.guardarConfiguracion()
                this.$emit("guardado", payload)
                store.commit("dialogoprogress")
                this.cierre()
            } catch (e) {
                console.error("Error guardando configuracion", e)
            } finally {
                this.guardando = false
            }
        },
        async guardarYSincronizarTodo() {
            try {
                this.guardandoSincronizando = true
                store.commit("dialogoprogress")
                const payload = await this.guardarConfiguracion()
                this.$emit("guardado", payload)
                this.$emit("sincronizar-todo", payload)
                store.commit("dialogoprogress")
                this.cierre()
            } catch (e) {
                console.error("Error guardando y sincronizando todo", e)
            } finally {
                this.guardandoSincronizando = false
            }
        },
        formatearDatetimeLocal(valor) {
            const ts = Number(valor || 0)
            if (!ts) return ""

            const fecha = new Date(ts)
            if (Number.isNaN(fecha.getTime())) return ""

            const pad = (n) => String(n).padStart(2, "0")
            return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
        },
        parsearDatetimeLocal(valor) {
            if (!valor) return 0
            const fecha = new Date(valor)
            const ts = fecha.getTime()
            return Number.isNaN(ts) ? 0 : ts
        },
        cierre() {
            this.$emit("cerrar")
            this.dial = false
        },
    },
}
</script>
