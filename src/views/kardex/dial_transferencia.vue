<template>
    <v-dialog v-model="dial" persistent hide-overlay transition="dialog-bottom-transition" max-width="750px" fullscreen>
        <div>
            <v-system-bar class="" dense window dark height="40">
                <v-icon large color="red" @click="cierra()">mdi-close</v-icon>
                <v-spacer></v-spacer>
                <h3 class="">Categorias</h3>
                <v-spacer></v-spacer>

            </v-system-bar>
        </div>
        <v-card class="pa-4" max-width="900" style="margin:auto;">
            <h3 class="mb-2">Transferir Varios Productos entre Sedes</h3>
            <v-form ref="form" lazy-validation>
                <v-row dense>
                    <v-col cols="6">
                        <v-select v-model="sede_origen" :items="sedes" label="Sede Origen" item-text="nombre"
                            item-value="base" outlined dense @change="cargarProductos"
                            :rules="[v => !!v || 'Seleccione sede origen']"></v-select>
                    </v-col>
                    <v-col cols="6">
                        <v-select v-model="sede_destino" :items="sedesDestino" label="Sede Destino" item-text="nombre"
                            item-value="base" outlined dense
                            :rules="[v => !!v || 'Seleccione sede destino']"></v-select>
                    </v-col>
                </v-row>
                <v-row dense class="mt-n4">
                    <v-col cols="7">
                        <v-autocomplete v-model="producto" :items="productos_origen" label="Buscar por nombre"
                            item-text="nombre" item-value="id" outlined dense :disabled="!sede_origen" clearable
                            @change="onSeleccionProducto">
                            <template v-slot:item="{ item }">
                                <span>{{ item.nombre }} <span style="color:#888; font-size:80%">({{ item.id
                                        }})</span></span>
                            </template>
                        </v-autocomplete>
                    </v-col>
                    <v-col cols="5">
                        <v-text-field v-model="codigo_barra_busqueda" label="Buscar por código de barra" outlined dense
                            :disabled="!sede_origen" @keyup.enter="buscarPorCodigoBarra" append-icon="mdi-barcode"
                            clearable></v-text-field>
                    </v-col>
                    <v-col cols="12" class="mt-n4">
                        <v-textarea v-model="observacion" label="Observación" outlined dense auto-grow
                            rows="2"></v-textarea>
                    </v-col>
                </v-row>
                <!-- Tabla de productos por transferir -->
                <v-row class="mt-n6">
                    <v-col cols="12">
                        <v-row dense class="mt-3">
                            <v-col cols="12" class="text-left">
                                <h3>Total Monto: <strong>S/ {{ totalMontoSoles.toFixed(2) }}</strong></h3>
                            </v-col>
                        </v-row>
                        <v-data-table :headers="headersTransferencia" :items="lista_transferencia" dense class="mt-3">
                            <template v-slot:item.cantidad="{ item, index }">
                                <v-edit-dialog :return-value.sync="item.cantidad" large persistent
                                    @save="validaCantidad(item, index)" @cancel="restauraCantidad(item, index)"
                                    @open="backupCantidad(item)">
                                    <span>{{ item.cantidad }}</span>
                                    <template v-slot:input>
                                        <v-text-field v-model.number="item.cantidad" type="number" :min="1"
                                            :max="item.stock_origen" single-line dense
                                            @keydown.enter="validaCantidad(item, index); $event.target.blur()"></v-text-field>
                                    </template>
                                </v-edit-dialog>
                            </template>
                            <template v-slot:item.monto_soles="{ item }">
                                <span>S/ {{ Number(item.monto_soles).toFixed(2) }}</span>
                            </template>
                            <template v-slot:item.acciones="{ item, index }">
                                <v-icon small color="red" @click="eliminarDeLista(index)">mdi-delete</v-icon>
                            </template>
                            <template v-slot:no-data>
                                <v-alert type="info" dense>Agregue productos a transferir</v-alert>
                            </template>
                        </v-data-table>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="12" class="text-right">
                        <v-btn color="success" @click="transferir" :loading="cargando"
                            :disabled="lista_transferencia.length == 0">
                            Transferir Todo
                        </v-btn>
                    </v-col>
                </v-row>
            </v-form>
            <v-snackbar v-model="mensaje" :color="colorMensaje" timeout="4000">{{ textoMensaje }}</v-snackbar>
        </v-card>
    </v-dialog>
</template>

<script>
import {
    allProductoOtraBase,
    grabarStockOtraBase,
    graba_transferencia,
    
} from '@/db';
import { registrarMovimientosTransferencia } from './help_mov_tranferencia';
import store from '@/store/index';
import moment from 'moment'
export default {
    data() {
        return {
            dial: false,
            sedes: store.state.array_sedes.filter(e => e.tipo == 'sede'),
            sede_origen: '',
            sede_destino: '',
            productos_origen: [],
            cantidadBackup: {}, // Para backup temporal por producto
            producto: '', // id seleccionado
            codigo_barra_busqueda: '',
            cantidad: 1,
            lista_transferencia: [],
            observacion: '',
            mensaje: false,
            textoMensaje: '',
            colorMensaje: 'success',
            cargando: false,
            headersTransferencia: [
                { text: 'ID', value: 'id' },
                { text: 'Nombre', value: 'nombre' },
                { text: 'Código Barra', value: 'codbarra' },
                { text: 'Stock actual', value: 'stock_origen' },
                { text: 'Cantidad', value: 'cantidad' },
                { text: 'Monto S/', value: 'monto_soles' },
                { text: 'Acciones', value: 'acciones', sortable: false }
            ]
        };
    },
    created() {
        this.dial = true
    },

    computed: {
        totalMontoSoles() {
            return this.lista_transferencia.reduce((sum, item) => sum + Number(item.monto_soles || 0), 0);
        },
        sedesDestino() {
            return this.sedes.filter(s => s.base !== this.sede_origen);
        },
        stockDisponible() {
            const prod = this.productos_origen.find(p => p.id == this.producto);
            return prod ? Number(prod.stock) : 0;
        },
        cantidadValida() {
            return this.cantidad > 0 && this.cantidad <= this.stockDisponible;
        }
    },
    methods: {
        backupCantidad(item) {
            // Guarda valor previo por si cancelan la edición
            this.cantidadBackup[item.id] = item.cantidad;
        },
        restauraCantidad(item, index) {
            // Restaura el valor anterior si cancelan
            item.cantidad = this.cantidadBackup[item.id];
        },
        validaCantidad(item, index) {
            if (item.cantidad < 1) {
                item.cantidad = 1;
                this.muestraMsg('No puedes transferir menos de 1 unidad', 'error');
            }
            const prod = this.productos_origen.find(p => p.id == item.id);
            if (item.cantidad > prod.stock) {
                item.cantidad = prod.stock;
                this.muestraMsg('No puedes transferir más que el stock actual (' + prod.stock + ')', 'error');
            }
            item.monto_soles = Number(item.cantidad) * Number(item.precio || 0);
        },
        async cargarProductos() {
            this.productos_origen = [];
            this.producto = '';
            this.codigo_barra_busqueda = '';
            this.cantidad = 1;
            this.lista_transferencia = [];
            if (this.sede_origen) {
                const snap = await allProductoOtraBase(this.sede_origen).once('value');
                const data = snap.val();
                this.productos_origen = data ? Object.values(data) : [];
            }
        },
        buscarPorCodigoBarra() {
            if (!this.codigo_barra_busqueda) return;
            const prod = this.productos_origen.find(
                p => p.codbarra && p.codbarra.trim() === this.codigo_barra_busqueda.trim()
            );
            if (prod) {
                this.producto = prod.id;
                this.cantidad = 1;
                // Agrega automáticamente y limpia campos
                this.agregarProducto('codigo');
            } else {
                this.muestraMsg('Producto no encontrado por código de barra', 'error');
            }
        },
        onSeleccionProducto(value) {
            if (!value) return;
            this.cantidad = 1;
            // Agrega automáticamente y limpia campos
            this.agregarProducto('nombre');
        },
        agregarProducto(automatico = false) {
            if (!this.producto || !this.cantidadValida) return;
            const prod = this.productos_origen.find(p => p.id == this.producto);

            // Buscar si ya está en la lista de transferencia
            let existente = this.lista_transferencia.find(p => p.id == prod.id);

            if (existente) {
                // Sumar la cantidad, pero sin pasar el stock disponible en origen
                const stock_restante = Number(prod.stock) - Number(existente.cantidad);
                const cantidad_a_sumar = Math.min(Number(this.cantidad), stock_restante);

                if (cantidad_a_sumar > 0) {
                    existente.cantidad += cantidad_a_sumar;
                    this.muestraMsg('Cantidad sumada al producto ya existente en la lista', 'success');
                } else {
                    this.muestraMsg('No puedes agregar más cantidad, llegaste al límite de stock', 'error');
                }
                this.limpiarCamposProducto();
                return;
            }
            // Si no existe, agrega como antes
            this.lista_transferencia.push({
                id: prod.id,
                nombre: prod.nombre,
                codbarra: prod.codbarra,
                cantidad: Number(this.cantidad),
                stock_origen: prod.stock,
                precio: prod.precio || 0,
                monto_soles: Number(this.cantidad) * Number(prod.precio || 0), // ✅ Calculamos monto inicial
            });
            this.limpiarCamposProducto();
        },

        limpiarCamposProducto() {
            this.producto = '';
            this.cantidad = 1;
            this.codigo_barra_busqueda = '';
        },
        eliminarDeLista(idx) {
            this.lista_transferencia.splice(idx, 1);
        },
        async transferir() {
            if (!this.$refs.form.validate()) return;
            if (this.sede_origen === this.sede_destino) {
                this.muestraMsg('No puede seleccionar la misma sede', 'error');
                return;
            }
            if (this.lista_transferencia.length === 0) {
                this.muestraMsg('Agregue productos a transferir', 'error');
                return;
            }
            this.cargando = true;
            try {
                // Obtener productos destino
                const snap_destino = await allProductoOtraBase(this.sede_destino).once('value');
                const productos_destino = snap_destino.val() ? Object.values(snap_destino.val()) : [];

                // Validar stock antes de procesar
                for (const item of this.lista_transferencia) {
                    const prodOrigen = this.productos_origen.find(p => p.id == item.id);
                    if (!prodOrigen || Number(item.cantidad) > Number(prodOrigen.stock)) {
                        this.muestraMsg(
                            `El stock disponible de "${item.nombre}" es insuficiente (${prodOrigen ? prodOrigen.stock : 0})`,
                            'error'
                        );
                        this.cargando = false;
                        return;
                    }
                }

                // Proceso producto por producto
                for (const item of this.lista_transferencia) {
                    // Restar stock en origen
                    const prodOrigen = this.productos_origen.find(p => p.id == item.id);
                    const nuevoStockOrigen = Number(prodOrigen.stock) - Number(item.cantidad);
                    await grabarStockOtraBase(this.sede_origen, item.id, nuevoStockOrigen);

                    // Sumar stock en destino
                    const prodDestino = productos_destino.find(p => p.id == item.id);
                    let nuevoStockDestino = prodDestino
                        ? Number(prodDestino.stock) + Number(item.cantidad)
                        : Number(item.cantidad);

                    if (prodDestino) {
                        await grabarStockOtraBase(this.sede_destino, item.id, nuevoStockDestino);
                    }
                }
                const totalTransferencia = this.lista_transferencia.reduce(
                    (suma, item) => suma + Number(item.monto_soles || 0),
                    0
                );
                // Guardar documento de transferencia con la lista de productos
                const doc = {
                    fecha_unix: moment().unix(),
                    sede_origen: this.sede_origen,
                    sede_destino: this.sede_destino,
                    productos: this.lista_transferencia.map(item => ({
                        id: item.id,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio: item.precio || 0,
                        monto_soles: Number(item.monto_soles.toFixed(2)), // ✅ aseguramos 2 decimales
                    })),
                    total: Number(totalTransferencia.toFixed(2)), // ✅ nuevo campo total
                    estado: "activo",
                    usuario: store.state.permisos.correo,
                    observacion: this.observacion,
                };
                var resp = await graba_transferencia(doc);
                console.log('Key transferencia:', resp.key);
                await registrarMovimientosTransferencia({...doc, key: resp.key});
                this.muestraMsg('Transferencia realizada correctamente', 'success');
                this.cargarProductos();
                this.sede_destino = '';
                this.observacion = '';
                this.lista_transferencia = [];
            } catch (e) {
                this.muestraMsg('Error en la transferencia: ' + (e.message || e), 'error');
            }
            this.cargando = false;
        },

        muestraMsg(msg, color) {
            this.textoMensaje = msg;
            this.colorMensaje = color;
            this.mensaje = true;
        },
        cierra() {
            this.$emit('cerrar');
            this.dial = false;
        }
    },
};
</script>
