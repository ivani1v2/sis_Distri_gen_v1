<template>
    <v-dialog v-model="dialog" max-width="900" persistent scrollable>
        <v-card class="dialog-carga">
            <v-toolbar flat color="deep-purple darken-1" dark dense class="pa-0 ma-0"
                style="min-height: 48px; height: 48px;">
                <v-toolbar-title class="text-body-2 font-weight-medium px-2">
                    <v-icon left small>mdi-upload-multiple</v-icon>
                    Carga Masiva de Activos
                </v-toolbar-title>

                <v-spacer></v-spacer>

                <v-btn icon dark @click="cerrar" class="mr-1">
                    <v-icon small>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text class="pa-4">
                <v-row dense class="mb-4">
                    <v-col cols="12">
                        <div class="d-flex align-center">
                            <v-avatar color="deep-purple lighten-4" size="32" class="mr-3">
                                <span class="deep-purple--text font-weight-bold">1</span>
                            </v-avatar>
                            <span class="font-weight-medium">Descarga la plantilla</span>
                            <v-spacer></v-spacer>
                            <v-tooltip left>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn icon color="deep-purple" dark v-bind="attrs" v-on="on" class="mr-2">
                                        <v-icon>mdi-information-outline</v-icon>
                                    </v-btn>
                                </template>
                                <div class="pa-2" style="max-width: 300px;">
                                    <div class="font-weight-bold mb-1">Estados permitidos:</div>
                                    <div class="d-flex flex-wrap mb-2">
                                        <v-chip x-small color="blue" label dark class="mr-1 mb-1">ALMACÉN</v-chip>
                                        <v-chip x-small color="orange" label dark class="mr-1 mb-1">RESERVADO</v-chip>
                                        <v-chip x-small color="teal" label dark class="mr-1 mb-1">EN USO</v-chip>
                                        <v-chip x-small color="amber darken-2" label dark class="mr-1 mb-1">PENDIENTE
                                            RECOJO</v-chip>
                                    </div>
                                    <div class="font-weight-bold mb-1">Condiciones permitidas:</div>
                                    <div class="d-flex flex-wrap">
                                        <v-chip x-small color="green" label dark class="mr-1 mb-1">OPERATIVO</v-chip>
                                        <v-chip x-small color="purple" label dark class="mr-1 mb-1">EN
                                            MANTENIMIENTO</v-chip>
                                        <v-chip x-small color="red" label dark class="mr-1 mb-1">AVERIADO</v-chip>
                                        <v-chip x-small color="grey" label dark class="mr-1 mb-1">DADO DE BAJA</v-chip>
                                    </div>
                                </div>
                            </v-tooltip>
                            <v-btn color="deep-purple" outlined small @click="descargarPlantilla">
                                <v-icon left small>mdi-download</v-icon>
                                Plantilla Excel
                            </v-btn>

                        </div>
                        <div class="ml-10 mt-1 caption grey--text">
                            La plantilla ya incluye "OPERATIVO" y "ALMACÉN" por defecto.
                            <span class="red--text">* El código es OBLIGATORIO y debe ser único.</span>
                        </div>
                    </v-col>
                </v-row>

                <v-divider class="my-3"></v-divider>

                <v-row dense class="mb-4">
                    <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                            <v-avatar color="deep-purple lighten-4" size="32" class="mr-3">
                                <span class="deep-purple--text font-weight-bold">2</span>
                            </v-avatar>
                            <span class="font-weight-medium">Sube tu archivo Excel</span>
                        </div>

                        <div class="ml-10">
                            <div class="drop-zone pa-6 text-center" :class="{ 'dragover': dragOver }"
                                @dragenter="dragOver = true" @dragleave="dragOver = false" @dragover.prevent
                                @drop.prevent="manejarDrop" @click="$refs.fileInput.click()">
                                <v-icon size="48" :color="dragOver ? 'deep-purple' : 'grey'">
                                    mdi-cloud-upload
                                </v-icon>
                                <div class="text-subtitle-1 mt-2">
                                    {{ dragOver ? 'Suelta el archivo' : 'Arrastra o haz clic para seleccionar' }}
                                </div>
                                <div class="caption grey--text">
                                    Archivos Excel (.xlsx, .xls, .csv)
                                </div>
                                <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="d-none"
                                    @change="manejarArchivoSeleccionado">
                            </div>

                            <div v-if="nombreArchivo" class="mt-2 d-flex align-center">
                                <v-icon small color="success" class="mr-1">mdi-check-circle</v-icon>
                                <span class="caption">{{ nombreArchivo }}</span>
                                <v-btn x-small icon @click="resetUpload" class="ml-2">
                                    <v-icon small>mdi-close</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <v-divider v-if="vistaPrevia.length > 0" class="my-3"></v-divider>

                <v-row dense v-if="vistaPrevia.length > 0">
                    <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                            <v-avatar color="deep-purple lighten-4" size="32" class="mr-3">
                                <span class="deep-purple--text font-weight-bold">3</span>
                            </v-avatar>
                            <span class="font-weight-medium">Vista previa y validación</span>
                            <v-chip small :color="resumen.color" class="ml-3" dark>
                                {{ resumen.texto }}
                            </v-chip>
                            <v-spacer></v-spacer>
                            <span class="caption grey--text mr-2">
                                Válidos: {{ validos.length }} | Errores: {{ errores.length }}
                            </span>
                        </div>

                        <v-card outlined class="mt-1">
                            <v-simple-table dense fixed-header height="300">
                                <thead>
                                    <tr>
                                        <th class="text-center" width="50">#</th>
                                        <th>Código</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th>Descripción</th>
                                        <th>Condición</th>
                                        <th>Estado</th>
                                        <th>Validación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in vistaPrevia" :key="index">
                                        <td class="text-center caption">{{ index + 1 }}</td>
                                        <td class="caption font-weight-bold">{{ item.codigo || '—' }}</td>
                                        <td class="caption">{{ item.marca || '—' }}</td>
                                        <td class="caption">{{ item.modelo || '—' }}</td>
                                        <td class="caption">{{ truncar(item.descripcion, 30) }}</td>
                                        <td class="caption">
                                            <v-chip x-small :color="item.condicion === 'OPERATIVO' ? 'green' : 'orange'"
                                                label>
                                                {{ item.condicion }}
                                            </v-chip>
                                        </td>
                                        <td class="caption">
                                            <v-chip x-small :color="item.estado === 'ALMACÉN' ? 'blue' : 'amber'"
                                                outlined label>
                                                {{ item.estado }}
                                            </v-chip>
                                        </td>
                                        <td class="text-center">
                                            <v-icon small :color="item._valido ? 'success' : 'error'">
                                                {{ item._valido ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                                            </v-icon>
                                            <v-tooltip v-if="!item._valido" right>
                                                <template v-slot:activator="{ on, attrs }">
                                                    <v-icon small color="error" v-bind="attrs"
                                                        v-on="on">mdi-information</v-icon>
                                                </template>
                                                <span>{{ item._error }}</span>
                                            </v-tooltip>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </v-card>

                        <v-expansion-panels v-if="errores.length > 0" class="mt-2">
                            <v-expansion-panel>
                                <v-expansion-panel-header class="py-1 error lighten-5">
                                    <span class="caption font-weight-bold error--text">
                                        {{ errores.length }} registro(s) con errores
                                    </span>
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <v-list dense>
                                        <v-list-item v-for="(err, idx) in errores" :key="idx" class="py-0">
                                            <v-list-item-content class="py-1">
                                                <span class="caption">
                                                    <strong>Fila {{ err.fila }}:</strong>
                                                    <span class="red--text">{{ err.error }}</span>
                                                    <span v-if="err.codigo" class="grey--text"> (Código: {{ err.codigo
                                                    }})</span>
                                                </span>
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions class="pa-3">
                <v-btn text color="grey" @click="cerrar" :disabled="importando">
                    Cancelar
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="vistaPrevia.length > 0" dark color="deep-purple" :loading="importando"
                    :disabled="validos.length === 0 || importando" @click="importarMasivo">
                    <v-icon left small>mdi-database-import</v-icon>
                    Importar {{ validos.length }} equipo{{ validos.length !== 1 ? 's' : '' }}
                </v-btn>
            </v-card-actions>

            <v-progress-linear v-if="importando" indeterminate color="deep-purple" height="3"></v-progress-linear>
        </v-card>
    </v-dialog>
</template>

<script>
import * as XLSX from 'xlsx';
import { importarEquiposMasivo } from "@/db_activos";
import moment from 'moment';

export default {
    name: "DialogCargaMasivaActivos",

    props: {
        visible: { type: Boolean, default: false }
    },

    data() {
        return {
            dragOver: false,
            nombreArchivo: "",
            vistaPrevia: [],
            importando: false,
            resultados: null
        };
    },

    computed: {
        dialog: {
            get() { return this.visible; },
            set(v) { this.$emit("update:visible", v); }
        },

        validos() {
            return this.vistaPrevia.filter(item => item._valido === true);
        },

        errores() {
            return this.vistaPrevia.filter(item => item._valido === false);
        },

        resumen() {
            if (this.vistaPrevia.length === 0) return { texto: "", color: "" };
            if (this.validos.length === this.vistaPrevia.length) {
                return { texto: "Todos los registros son válidos", color: "success" };
            }
            if (this.validos.length === 0) {
                return { texto: "Ningún registro válido", color: "error" };
            }
            return { texto: `${this.validos.length} válidos, ${this.errores.length} con errores`, color: "warning" };
        }
    },

    methods: {
        descargarPlantilla() {
            const plantilla = [
                {
                    codigo: "ACTIVO-999",
                    marca: "MABE",
                    modelo: "X-2000",
                    descripcion: "Refrigerador",
                    fecha_ingreso: moment().format("DD/MM/YYYY"),
                    ubicacion_especifica: "ALMACEN CENTRAL",
                    condicion: "OPERATIVO",
                    estado: "ALMACÉN",
                    cliente_id: "",
                    cliente_nombre: "",
                    cliente_direccion: "",
                    observacion_actual: ""
                }
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(plantilla);

            ws['!cols'] = [
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 30 },
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 30 },
                { wch: 40 },
                { wch: 30 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Activos");

            const instrucciones = [
                { Instruccion: "CÓDIGO: Obligatorio, debe ser único" },
                { Instruccion: "MARCA: Obligatorio" },
                { Instruccion: "MODELO: Opcional" },
                { Instruccion: "DESCRIPCIÓN: Obligatorio" },
                { Instruccion: "FECHA_INGRESO: Obligatorio (DD/MM/YYYY)" },
                { Instruccion: "UBICACIÓN: Obligatorio" },
                { Instruccion: "CONDICIÓN: Ya viene OPERATIVO, no cambiar" },
                { Instruccion: "ESTADO: Ya viene ALMACÉN, no cambiar" },
                { Instruccion: "CLIENTE_ID: Solo si está asignado" },
                { Instruccion: "CLIENTE_NOMBRE: Solo si está asignado" },
                { Instruccion: "DIRECCIÓN: Solo si está asignado" },
                { Instruccion: "OBSERVACIÓN: Opcional" }
            ];
            const wsInst = XLSX.utils.json_to_sheet(instrucciones);
            XLSX.utils.book_append_sheet(wb, wsInst, "Instrucciones");

            XLSX.writeFile(wb, "plantilla_carga_activos.xlsx");
        },

        manejarDrop(e) {
            this.dragOver = false;
            const archivo = e.dataTransfer.files[0];
            if (archivo) {
                this.procesarArchivo(archivo);
            }
        },

        manejarArchivoSeleccionado(e) {
            const archivo = e.target.files[0];
            if (archivo) {
                this.procesarArchivo(archivo);
            }
        },

        resetUpload() {
            this.nombreArchivo = "";
            this.vistaPrevia = [];
            this.$refs.fileInput.value = "";
        },

        async procesarArchivo(archivo) {
            this.nombreArchivo = archivo.name;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const primeraHoja = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[primeraHoja];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    this.vistaPrevia = this.validarRegistros(json);
                } catch (error) {
                    this.$store.commit("dialogosnackbar", "Error al leer el archivo");
                    console.error(error);
                }
            };
            reader.readAsArrayBuffer(archivo);
        },

        validarRegistros(registros) {
            const codigosRepetidos = new Set();
            const codigosExistentes = new Set();

            return registros.map((reg, index) => {
                const item = { ...reg, _fila: index + 2, _valido: true, _error: null };

                if (!item.codigo || String(item.codigo).trim() === "") {
                    item._valido = false;
                    item._error = "Código obligatorio";
                } else {
                    item.codigo = String(item.codigo).trim().toUpperCase();

                    if (codigosRepetidos.has(item.codigo)) {
                        item._valido = false;
                        item._error = "Código duplicado en el archivo";
                    } else {
                        codigosRepetidos.add(item.codigo);
                    }
                }
                if (!item.marca || String(item.marca).trim() === "") {
                    item._valido = false;
                    item._error = item._error || "Marca obligatoria";
                }
                if (!item.descripcion || String(item.descripcion).trim() === "") {
                    item._valido = false;
                    item._error = item._error || "Descripción obligatoria";
                }
                if (!item.fecha_ingreso) {
                    item._valido = false;
                    item._error = item._error || "Fecha de ingreso obligatoria";
                }

                if (!item.ubicacion_especifica || String(item.ubicacion_especifica).trim() === "") {
                    item._valido = false;
                    item._error = item._error || "Ubicación obligatoria";
                }
                item.condicion = item.condicion || "OPERATIVO";
                item.estado = item.estado || "ALMACÉN";

                return item;
            });
        },

        async importarMasivo() {
            this.importando = true;

            try {
                const registrosValidos = this.validos.map(v => ({
                    ...v,
                    _fila: v._fila,
                    _valido: undefined,
                    _error: undefined
                }));

                const resultado = await importarEquiposMasivo(registrosValidos);

                this.$store.commit("dialogosnackbar",
                    `Importación completada: ${resultado.exitosos.length} éxitos, ${resultado.errores.length} errores`
                );

                this.$emit("importado", resultado);

                setTimeout(() => {
                    this.importando = false;
                    this.resetUpload();
                    this.cerrar();
                }, 1500);

            } catch (error) {
                console.error("Error en importación masiva:", error);
                this.$store.commit("dialogosnackbar", "Error en la importación masiva");
                this.importando = false;
            }
        },

        truncar(texto, largo) {
            if (!texto) return "";
            return texto.length > largo ? texto.substring(0, largo) + "..." : texto;
        },

        cerrar() {
            this.resetUpload();
            this.dialog = false;
        }
    }
};
</script>

<style scoped>
.dialog-carga {
    display: flex;
    flex-direction: column;
}

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    background-color: #fafafa;
    cursor: pointer;
    transition: all 0.2s;
}

.drop-zone:hover {
    border-color: #673ab7;
    background-color: #f3e5f5;
}

.dragover {
    border-color: #673ab7;
    background-color: #ede7f6;
}
</style>