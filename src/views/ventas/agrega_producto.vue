<template>
    <v-dialog v-model="dial" max-width="390">
        <div>
            <v-system-bar window dark>
                <v-icon @click="cierra()" color="red" large>mdi-close</v-icon>
                <v-spacer></v-spacer>
                <v-checkbox v-if="false" class="mb-n3" dense v-model="agrega_catalogo" label="Agregar Catalogo"></v-checkbox>
            </v-system-bar>
        </div>
        <v-card class="pa-3">
            <v-row dense>
                <v-col cols="6">
                    <v-select :items="arraytipoProducto" label="Tipo" dense outlined v-model="tipoproducto"></v-select>
                </v-col>
                <v-col cols="6">
                    <v-select :items="arrayOperacion" label="Operacion" dense outlined
                        v-model="tipooperacion"></v-select>
                </v-col>
            </v-row>
            <v-row class="mt-n3" dense>
                <v-col cols="12">
                      <v-autocomplete outlined dense clearable :disabled="!$store.state.permisos.productos_edita"
                            v-model="medida" :items="itemsMedidasNombre" item-text="text" item-value="value"
                            label="Medida" :menu-props="{ maxHeight: 300 }" :filter="filtraStr"
                             @change="medida = (medida || '').toUpperCase()" />
                </v-col>
            </v-row>
            <v-row class="mt-n4" dense>
                <v-col cols="6">
                    <v-text-field autofocus dense outlined type="number" v-model="cantidad"
                        label="Cantidad"></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-text-field dense outlined type="number" v-model="precio" label="Precio"></v-text-field>
                </v-col>
            </v-row>
            <v-textarea dense class="mt-n2" outlined v-model="nombre" auto-grow filled color="deep-purple"
                label="Descripcion" rows="1"></v-textarea>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="agrega()">
                    Agregar
                </v-btn>
            </v-card-actions>
        </v-card>

    </v-dialog>
</template>

<script>
import {
    editaProducto,
    sumaContador,
    obtenContador
} from '../../db'
import store from '@/store/index'
export default {
    name: 'caja',

    data() {
        return {
            dial: false,
            arraytipoProducto: ['BIEN', 'SERVICIO'],
            arrayOperacion: [
                'GRAVADA',
                'EXONERADA',
                'INAFECTA'
            ],
            tipooperacion: 'GRAVADA',
            tipoproducto: "BIEN",
            cantidad: '',
            precio: '',
            nombre: '',
            medida: 'UNIDAD',
            agrega_catalogo: false,
        }
    },
    created() {
        if (Boolean(store.state.configuracion.operacion)) {
            this.tipooperacion = store.state.configuracion.operacion
        }
        this.dial = true
    },
        computed: {
        itemsMedidasNombre() {
            const arr = (this.$store.state.medidassunat || []);
            return arr.map(m => ({
                text: `${String(m.nombre || '').toUpperCase()}`,
                value: String(m.nombre || '').toUpperCase()   // ↩ lo que devuelve (solo nombre)
            }));
        },
    },
    methods: {
        async agrega() {
            if (this.cantidad == '' || this.cantidad == 0) {
                alert('ingrese cantidad valida')
                return
            }
            if (this.precio == '' || this.precio == 0) {
                alert('ingrese Precio valido')
                return
            }
            if (this.nombre == '') {
                alert('ingrese descripcion')
                return
            }
            var id = this.create_UUID().substring(29)
            var array = {
                uuid: id,
                id: id,
                cantidad: Number(this.cantidad),
                nombre: this.nombre,
                medida: this.medida,
                precio: this.precio,
                preciodescuento: 0,
                costo: 0,
                tipoproducto: this.tipoproducto,
                operacion: this.tipooperacion,
                icbper: false,
                controstock: false,
                cargoxconsumo: false,
            }
            if (this.agrega_catalogo) {
                store.commit("dialogoprogress")
                await this.guarda_producto()
                store.commit("dialogoprogress")
            }
            this.$emit('agrega_lista', array)

        },
        async guarda_producto() {
            var snapshot = await obtenContador().once("value")
            var id = snapshot.val().ordenproducto
            editaProducto(id, "id", id)
            editaProducto(id, "activo", true)
            editaProducto(id, "codbarra", '')
            editaProducto(id, "nombre", this.nombre.trim())
            editaProducto(id, "categoria", '')
            editaProducto(id, "medida", this.medida)
            editaProducto(id, "stock", 0)
            editaProducto(id, "precio", this.precio)
            editaProducto(id, "costo", 0)
            editaProducto(id, "cocina", false)
            editaProducto(id, "tipoproducto", this.tipoproducto)
            editaProducto(id, "operacion", this.tipooperacion)
            editaProducto(id, "icbper", false)
            editaProducto(id, "barra", false)
            editaProducto(id, "controstock", false)
            editaProducto(id, "cargoxconsumo", false)
            editaProducto(id, "grupo_obs", [])
            await editaProducto(id, "stock_min", 1)
            await sumaContador("ordenproducto", parseInt(id) + 1)
            return true
        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        cierra() {
            this.$emit('cierra', false)
        }
    }
}
</script>
