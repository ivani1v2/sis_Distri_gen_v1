<template>
    <div class="mb-6 pa-3">
        <v-card>
            <v-btn v-if="false" color="success" block @click.prevent="elimina()" small>Consolida</v-btn>
            <v-btn v-if="false" color="success" block @click.prevent="router('consolidaSunat')" small>Consolida</v-btn>
            <v-row dense>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date" label="Inicio"></v-text-field>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field class="mx-1" outlined dense type="date" v-model="date2" label="Fin"></v-text-field>
                </v-col>
                <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field class="mx-1" outlined dense v-model="num_doc" label="Busca Documento"
                        append-icon="mdi-magnify" @click:append="busca()" prepend-inner-icon="T"
                        @keyup.enter="busca()"></v-text-field>
                </v-col>
            </v-row>
            <v-row class="mt-n8">
                <v-col cols="6">
                    <h4 class="text-center"> Aprobados: S/.{{ sumaventas().ticket }}</h4>
                </v-col>
                <v-col cols="6">
                    <h4 class="text-center red--text"> Anulados: S/.{{ sumaventas().rechazados }}</h4>
                </v-col>
            </v-row>

            <v-simple-table fixed-header height="70vh" dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Correlativo
                            </th>
                            <th class="text-left" v-if="!$store.state.esmovil">
                                Cliente
                            </th>
                            <th class="text-left">
                                Fecha
                            </th>
                            <th class="text-left">
                                Estado
                            </th>
                            <th class="text-left">
                                Total
                            </th>
                            <th class="text-left">
                                Accion
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in listafiltrada" :key="item.id">
                            <td style="font-size:75%;">{{ item.numeracion }}</td>
                            <td style="font-size:75%;" v-if="!$store.state.esmovil">{{ item.dni + ' - ' + item.cliente
                            }}
                            </td>
                            <td>{{ conviertefecha(item.fecha) }}</td>
                            <td>
                                <v-icon @click="consultaApisunat(item)" :color="item.color">mdi-circle</v-icon>
                            </td>
                            <td style="font-size:75%;">S/.{{ item.total }}</td>
                            <td width="100">
                                <v-row>
                                    <v-col cols="6">
                                        <v-icon color="green"
                                            @click.prevent="ejecutaConsolida(item.numeracion), dialog = true">mdi-eye</v-icon>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-icon color="red"
                                            @click.prevent="selecciona_item(item)">mdi-text-box-search-outline</v-icon>
                                    </v-col>
                                </v-row>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

        </v-card>


        <v-dialog v-model="dialog" max-width="850px">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialog = !dialog">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-3">
                <v-row dense>
                    <v-col cols="12">
                    </v-col>
                </v-row>

                <v-simple-table dark fixed-header max-width="70vh" dense>
                    <template v-slot:default>

                        <thead>
                            <tr>
                                <th class="text-left">
                                    Descripcion
                                </th>
                                <th class="text-left">
                                    Medida
                                </th>
                                <th class="text-left">
                                    Cantidad.
                                </th>
                                <th class="text-left">
                                    Precio
                                </th>
                                <th class="text-left">
                                    Descuento
                                </th>
                                <th class="text-left">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr v-for="item in arrayConsolidar" :key="item.id">
                                <td>{{ item.nombre }}</td>
                                <td>{{ item.medida }}</td>
                                <td>{{ item.cantidad }}</td>
                                <td>S/.{{ item.precioedita }}</td>
                                <td class="red--text">S/.{{ item.preciodescuento }}</td>
                                <td>S/.{{ redondear(item.precioedita * item.cantidad) }}</td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card>

        </v-dialog>

        <v-dialog v-model="dialogocomprobante" max-width="590">
            <div>
                <v-system-bar window dark>
                    <v-icon @click="dialogocomprobante = false">mdi-close</v-icon>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-2">

                <v-row dense class="text-center">

                    <v-col cols="6">
                        <v-card @click.prevent="anulaticket()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/anular.png"></v-img>
                                <h5 block class="text-center">ANULAR</h5>
                            </v-container>
                        </v-card>
                    </v-col>

                    <v-col cols="6">
                        <v-card @click.prevent="convertir()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/convertir.png"></v-img>
                                <h5 block class="text-center">Convertir</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="genera_guia()">
                            <v-container>
                                <v-img class="mx-auto" height="30" width="30" src="/camion.png"></v-img>
                                <h5 block class="text-center">Guia Rem.</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <dial_convertir v-if="dial_convertir" :cabecera="seleccionado" :items="items_convertir"
            @cierra="dial_convertir = false, busca()" />

        <imprime v-if="genera_pdf" :data="seleccionado" @cierra="genera_pdf = $event" />

    </div>
</template>

<script>
import imprime from '@/components/dialogos/dialog_imprime'
import dial_convertir from '@/views/sunat/convertir'
import {
    allCabecera,
    consultaDetalle,
    grabaDatoC,
    consulta_Cabecera,
    elimina_Cabecera,
    grabaCabecera,
} from '../../db'
import store from '@/store/index'
import {
    pdfGenera
} from '../../pdf'

import moment from 'moment'
import {
    grabaEstadoComprobante
} from '../../db'
import {
    modifica_stock_array
} from '../../control_stock'
import { fs, colempresa } from '../../db_firestore'
export default {
    components: {
        imprime,
        dial_convertir
    },

    data: () => ({
        dial_convertir: false,
        dialogocomprobante: false,
        documento: '',
        desserts: [],
        documentoEnvio: '',
        dialog: false,
        arrayConsolidar: [],
        buscar: '',
        date: moment(String(new Date)).format('YYYY-MM-DD'),
        date2: moment(String(new Date)).format('YYYY-MM-DD'),
        rechazados: 0,
        img: '',
        error: '',
        seleccionado: '',
        documentoanula: '',
        genera_pdf: false,
        num_doc: '',
        items_convertir: []
    }),

    computed: {
        listafiltrada() {
            return this.desserts.reverse()
        }
    },
    created() {
        this.busca()
    },
    methods: {
        async genera_guia() {
            if (confirm('seguro de generar Guia')) {
                store.commit("dialogoprogress", 1)
                var array = []
                var snapshot = await consultaDetalle(this.seleccionado.numeracion).once("value")
                snapshot.forEach((item) => {
                    array.push(item.val())
                })
                var array_guia = {
                    cabecera: this.seleccionado,
                    detalle: array
                }
                store.commit("dialogoprogress", 1)
                store.commit('array_guia', array_guia)
                this.$router.push({
                    name: 'gr_remitente'
                })
            }
        },
        async elimina() {

            for (var i = 0; i < this.desserts.length; i++) {
                var data = this.desserts[i]
                console.log(data)
                await elimina_Cabecera(data.numeracion)
            }
        },
        async convertir() {
            var array = []
            var data = this.seleccionado
            var snapshot = await consultaDetalle(data.numeracion).once("value")
            snapshot.forEach((item) => {
                array.push(item.val())
            })
            this.items_convertir = array
            this.dialogocomprobante = false
            this.dial_convertir = true
        },
        busca() {
            var array = []
            this.desserts = []
            if (this.num_doc != '') {
                var data = store.state.seriesdocumentos.ticket + '-' + (this.num_doc).toString().padStart(8, 0)
                console.log(data)
                consulta_Cabecera(data)
                    .once("value").then((snapshot) => {
                        if (snapshot.exists()) {
                            var data = snapshot.val()
                            data.color = this.asigna_color_doc(data),
                                this.desserts.push(data)
                        } else {
                            store.commit('dialogosnackbar', 'Comprobante no existe')
                        }
                    })
            } else {
                allCabecera()
                    .orderByChild('fecha')
                    .startAt(moment(String(this.date)) / 1000)
                    .endAt(moment(String(this.date2)).add(23, 'h').add(59, 'm').add(59, 's') / 1000)
                    .once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            var data = item.val()
                            if (data.tipocomprobante == 'T') {
                                data.color = this.asigna_color_doc(data),
                                    array.push(data)
                            }
                        })
                        this.desserts = array
                    })
            }
        },
        asigna_color_doc(datas) {
            let data = datas
            var color = ''
            if (data.estado != 'aprobado' || data.estado != 'ACEPTADO' ||
                data.estado != 'PENDIENTE' || data.estado != 'pendiente') {
                color = '#FF0000'
            }
            if (data.estado == 'aprobado' || data.estado == 'ACEPTADO') {
                color = '#46FF00'
            }
            if (data.estado == 'PENDIENTE' || data.estado == 'pendiente') {
                color = '#FFB200'
            }
            return color
        },
        selecciona_item(item) {
            console.log(item)
            this.seleccionado = item
            this.genera_pdf = true
        },
        verPDF(item) {
            var arraydatos = []
            consultaDetalle(item.numeracion).once("value").then((snapshot) => {
                arraydatos = snapshot.val()
                if (snapshot.exists()) {
                    pdfGenera(arraydatos, '', '', item, "caja")
                }
            })
        },
        consultaApisunat(item) {
            console.log(item)
            /*if (item.estado == 'ANULADO') {
                alert('TICKET ANULADO')
                return
            }*/
            this.seleccionado = item
            this.dialogocomprobante = true
        },
    async anulaticket() {
    if (confirm('seguro que anular?')) {
        store.commit("dialogoprogress", 1);

        // 1. marcar cabecera anulada
        await grabaEstadoComprobante(
            this.seleccionado.numeracion,
            'ANULADO',
            'ANULADO',
            'ANULADO',
            ''
        );

        // 2. si aún no devolvimos stock antes, devolver stock ahora
        let detallesVenta = [];
        if (!this.seleccionado.regesa_stock) {
            await grabaCabecera(this.seleccionado.numeracion + '/regesa_stock', true);

            const snap = await consultaDetalle(this.seleccionado.numeracion).once("value");
            if (snap.exists()) {
                detallesVenta = Object.values(snap.val());
            }

            await modifica_stock_array('SUMA', detallesVenta);
        } else {
            // igual necesitamos los detalles para limpiar kardex
            const snap = await consultaDetalle(this.seleccionado.numeracion).once("value");
            if (snap.exists()) {
                detallesVenta = Object.values(snap.val());
            }
        }

        // 3. limpiar kardex de esa venta
        await this.eliminar_mov(this.seleccionado, detallesVenta);

        // 4. cerrar diálogo, refrescar pantalla
        this.dialogocomprobante = false;
        this.busca();
        store.commit("dialogoprogress", 1);
    }
},

        async eliminar_mov(cabecera, detalles) {
            try {
                // cabecera.numeracion es el doc_src en kardex para las ventas
                const docSrc = String(cabecera.numeracion || "");

                if (!docSrc) {
                    console.warn("No hay docSrc válido para eliminar_mov");
                    return;
                }

                // detalles es el array de líneas de venta de ese comprobante
                // cada línea debe tener:
                //   - id   (id del producto)
                //   - uuid_linea (o uuid) único estable por línea
                // si falta uuid_linea, usamos uuid. Si ninguna existe... no podemos borrar esa línea.
                for (const det of detalles) {
                    const pid = String(det.id || "");
                    const uuidLinea = det.uuid_linea || det.uuid || "";

                    if (!pid || !uuidLinea) {
                        console.warn("detalle sin pid o uuid_linea, skip:", det);
                        continue;
                    }

                    const lineId = docSrc + "_" + uuidLinea;

                    // ruta al documento de kardex que queremos borrar:
                    // /{empresa}/kardex/historial/{pid}/detalle/{lineId}
                    await colempresa()
                        .doc("kardex")
                        .collection("historial")
                        .doc(pid)
                        .collection("detalle")
                        .doc(lineId)
                        .delete()
                        .catch(e => {
                            console.error("No se pudo borrar linea kardex:", e);
                        });
                }

                // opcional: también podríamos actualizar el saldo_final del producto en kardex,
                // pero eso ya es recalcular kardex, cosa más pesada → lo dejamos fuera por ahora.

                console.log("✔ eliminar_mov completado para doc", docSrc);
            } catch (err) {
                console.error("Error en eliminar_mov:", err);
            }
        },

        conviertefecha(date) {
            return moment.unix(date).format('DD/MM/YYYY hh:mm A')
        },
        sumaventas() {
            var array = {}
            var ventaticket = 0
            var rechazados = 0
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].tipocomprobante == 'T' && this.desserts[i].estado == 'aprobado') {
                    ventaticket = ventaticket + parseFloat(this.desserts[i].total)
                } else {
                    rechazados = rechazados + parseFloat(this.desserts[i].total)
                }
            }

            array = {
                ticket: this.redondear(ventaticket),
                rechazados: this.redondear(rechazados),
            }
            return array
        },
        ejecutaConsolida(value) {
            this.cargaData(value)
        },
        cargaData(value) {
            this.arrayConsolidar = []
            for (var i = 0; i < this.desserts.length; i++) {
                if (this.desserts[i].numeracion == value) {
                    consultaDetalle(this.desserts[i].numeracion).once("value").then((snapshot) => {
                        snapshot.forEach((item) => {
                            this.arrayConsolidar.push(item.val())
                        })

                    })
                }
            }
        },
        redondear(valor) {
            return parseFloat(valor).toFixed(store.state.configuracion.decimal)
        },


    }
}
</script>
