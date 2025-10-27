<template>
<v-dialog v-model="dialogo" max-width="500px">
    <div>
        <v-system-bar window dark>
            <v-icon color="red" large @click="dialogo=!dialogo">mdi-close</v-icon>
            <v-switch v-model="activo" color="green" label="ACTIVO"></v-switch>
            <v-spacer></v-spacer>
            <v-icon color="blue" large @click="dialogosetting=!dialogosetting">mdi-cog-transfer-outline</v-icon>
            <v-icon color="yellow" large @click="subirXLS()">mdi-microsoft-excel</v-icon>
            <v-icon color="green" large @click="save()">mdi-content-save</v-icon>
            <v-icon color="red" large @click="dialogoElimina=!dialogoElimina">mdi-delete</v-icon>
        </v-system-bar>
    </div>

    <v-card class="pa-4">

        <v-row>
            <v-col cols="6" sm="6" md="6">
                <v-select :items="arraytipoProducto" label="Tipo" dense outlined v-model="tipoproducto"></v-select>
            </v-col>
            <v-col cols="6" sm="6" md="6">
                <v-select :items="arrayOperacion" label="Operacion" dense outlined v-model="operacion"></v-select>
            </v-col>
        </v-row>

        <v-row class="mt-n9">
            <v-col v-if="$store.state.configuracion.codbarras" cols="12" md="12" sm="12">
                <v-text-field dense class="mb-n7" v-model="codbarra" label="Cod Barras" append-icon="mdi-barcode-scan" autofocus></v-text-field>
            </v-col>

            <v-col cols="6" sm="6" md="6">
                <v-text-field dense disabled v-model="id" label="ID"></v-text-field>
            </v-col>
            <v-col cols="6" sm="6" md="6">
                <v-select dense v-model="categoria" :items="arraycategoria" menu-props="auto" hide-details label="Categoria"></v-select>
            </v-col>
        </v-row>

        <v-row class="mt-n7">
            <v-col cols="12">
                <v-textarea dense outlined v-model="nombre" auto-grow filled label="Descripcion" rows="1"></v-textarea>
            </v-col>
        </v-row>

        <v-row class="mt-n9">
            <v-col cols="6" sm="6" md="6" xs="6">
                <v-text-field type="number" dense v-model="stock" label="Stock"></v-text-field>
            </v-col>

            <v-col cols="6" sm="6" md="6" xs="6">
                <v-select dense v-model="medida" :items="$store.state.medidas" menu-props="auto" hide-details label="Medida"></v-select>
            </v-col>
        </v-row>

        <v-row class="mt-n7">
            <v-col cols="6" sm="6" md="6">
                <v-text-field type="number" dense v-model="precio" label="Precio"></v-text-field>
            </v-col>
            <v-col cols="6" sm="6" md="6">
                <v-text-field dense type="number" v-model="margen" label="Margen" suffix="%"></v-text-field>
            </v-col>
        </v-row>

        <v-row class="mt-n7">

            <v-col cols="6" sm="6" md="6">
                <v-text-field dense type="number" v-model="costo" label="Costo"></v-text-field>
            </v-col>

        </v-row>

        <v-row class="mt-n10" v-if="$store.state.baseDatos.restaurante ">
            <v-col cols="6">
                <v-switch v-model="cocina" label="Cocina"></v-switch>
            </v-col>
            <v-col cols="6">
                <v-switch v-model="barra" label="Barra"></v-switch>
            </v-col>
        </v-row>
        <v-row class="mt-n10">
            <v-col cols="6">
                <v-switch v-model="icbper" label="ICBPER"></v-switch>
            </v-col>
            <v-col cols="6">
                <v-switch v-model="controstock" label="Control Stock"></v-switch>
            </v-col>
        </v-row>

    </v-card>

</v-dialog>
</template>

<script>
import store from '@/store/index'

export default {

    data() {
        return {
            arrayiconos: [],
            tamañoarray: 0,
            categoriaselecta: '',
            activaproductos: false,
            buscar: '',
        }
    },
    created() {

    },
    mounted() {
        this.initialize()
    },
    methods: {
        initialize() {
            //this.activaproductos=false
            this.arrayiconos = store.state.categorias
        },
        iraproductos(item) {
            this.buscar = ''
            this.categoriaselecta = item.nombre
            if (this.listafiltrada != '') {
                this.activaproductos = true
            }

        },
        agregaCatalogo(item) {
            this.$emit('array', item)

        }
    },
    computed: {
        listafiltrada() {
            var invent = store.state.productos
            if (store.state.configuracion.ordencategorias) {
                return invent.filter((item) =>
                        (item.activo) == true)
                    .filter((item) => (item.categoria)
                        .toLowerCase().includes(this.categoriaselecta.toLowerCase()))
                    .filter((item) => (item.nombre)
                        .toLowerCase().includes(this.buscar.toLowerCase()))
            } else {
                return invent.filter((item) =>
                        (item.activo) == true)
                    .filter((item) => (item.nombre)
                        .toLowerCase().includes(this.buscar.toLowerCase()))
            }

        }
    }
}
</script>
