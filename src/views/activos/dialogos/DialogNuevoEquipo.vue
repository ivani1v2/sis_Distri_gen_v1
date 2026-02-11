<template>
  <v-dialog v-model="show" max-width="600px" persistent scrollable>
    <v-card>
      <v-card-title class="primary white--text py-2 subtitle-1">
        <v-icon small color="white" class="mr-2">{{ equipo ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ equipo ? 'Editar Equipo' : 'Nuevo Equipo' }}
        <v-spacer></v-spacer>
        <v-btn icon dark @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="form" v-model="formValid">
          <v-row dense class="mb-n5" >
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.codigo" label="Código (Obligatorio)" outlined dense
                :rules="[rules.required, rules.codigoValido]" :disabled="!!equipo" :loading="verificandoCodigo"
                :error-messages="errorCodigo" :hint="!equipo ? 'Ej: ACTIVO-XXX' : ''" persistent-hint
                @blur="verificarCodigo"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.marca" label="Marca (Obligatorio)" outlined dense
                :rules="[rules.required]"></v-text-field>
            </v-col>
          </v-row>

          <v-row dense class="mb-n5">
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.modelo" label="Modelo" outlined dense></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.descripcion" :items="tiposEquipo" label="Tipo de Equipo (Obligatorio)" outlined dense
                :rules="[rules.required]"></v-select>
            </v-col>
          </v-row>

          <v-row dense class="mb-n5">
            <v-col cols="12">
              <v-text-field v-model="form.ubicacion_especifica" label="Ubicación Específica" outlined dense
                placeholder="Ej: Bodega A, Estante 3"></v-text-field>
            </v-col>
          </v-row>

          <v-row dense class="mb-n5">
            <v-col cols="12" sm="6">
              <v-menu v-model="menuFecha" :close-on-content-click="false" transition="scale-transition" offset-y
                min-width="auto">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field :value="fechaIngresoFormateada" label="Fecha de Ingreso" outlined dense readonly
                    v-bind="attrs" v-on="on" prepend-inner-icon="mdi-calendar"></v-text-field>
                </template>
                <v-date-picker v-model="form.fecha_ingreso_picker" @input="menuFecha = false"
                  locale="es"></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6" v-if="equipo">
              <v-select v-model="form.condicion" :items="condiciones" label="Condición" outlined dense
                :disabled="!puedeEditarCondicion"></v-select>
            </v-col>
          </v-row>

          <v-row dense class="mb-n5">
            <v-col cols="12">
              <v-textarea v-model="form.observacion_actual" label="Observación" outlined dense rows="2"
                auto-grow></v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn text @click="cerrar">Cancelar</v-btn>
        <v-btn color="primary" :loading="guardando" :disabled="!formValid" @click="guardar">
          <v-icon left>mdi-content-save</v-icon>
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { nuevoEquipo, actualizarEquipo, obtenerSiguienteCodigo, existeCodigo } from "@/db_activos";
import moment from "moment";

export default {
  name: "DialogNuevoEquipo",

  props: {
    visible: { type: Boolean, default: false },
    equipo: { type: Object, default: null }
  },

  data() {
    return {
      formValid: false,
      guardando: false,
      menuFecha: false,
      verificandoCodigo: false,
      errorCodigo: "",
      codigoVerificado: false,

      form: {
        codigo: "",
        marca: "",
        modelo: "",
        descripcion: "",
        ubicacion_especifica: "",
        fecha_ingreso_picker: moment().format("YYYY-MM-DD"),
        condicion: "OPERATIVO",
        observacion_actual: ""
      },

      tiposEquipo: [
        "Congelador",
        "Refrigerador",
        "Vitrina Refrigerada",
        "Conservador",
        "Cámara Frigorífica",
        "Dispensador",
        "Otro"
      ],

      condiciones: [
        { text: "Operativo", value: "OPERATIVO" },
        { text: "Averiado", value: "AVERIADO" },
        { text: "Dado de Baja", value: "DADO DE BAJA" }
      ],

      rules: {
        required: v => !!v || "Este campo es requerido",
        codigoValido: v => !v || /^[A-Za-z0-9\-_]+$/.test(v) || "Solo letras, números, guiones y guiones bajos"
      }
    };
  },

  computed: {
    show: {
      get() { return this.visible; },
      set(val) { this.$emit("update:visible", val); }
    },

    fechaIngresoFormateada() {
      return this.form.fecha_ingreso_picker
        ? moment(this.form.fecha_ingreso_picker).format("DD/MM/YYYY")
        : "";
    },

    puedeEditarCondicion() {
      if (!this.equipo) return false;
      if (this.equipo.condicion === "EN MANTENIMIENTO") return false;
      if (this.equipo.estado === "ALMACÉN") return true;
      if (this.equipo.condicion === "DADO DE BAJA") return true;
      return false;
    }
  },

  watch: {
    visible: {
      handler(val) {
        if (val) {
          this.inicializarForm();
        }
      },
      immediate: true
    },
    equipo: {
      handler() {
        if (this.visible) {
          this.inicializarForm();
        }
      },
      immediate: true
    }
  },

  methods: {
    inicializarForm() {
      this.errorCodigo = "";
      this.codigoVerificado = false;

      if (this.equipo) {
        this.form = {
          codigo: this.equipo.codigo,
          marca: this.equipo.marca || "",
          modelo: this.equipo.modelo || "",
          descripcion: this.equipo.descripcion || "",
          ubicacion_especifica: this.equipo.ubicacion_especifica || "",
          fecha_ingreso_picker: this.equipo.fecha_ingreso
            ? moment(this.equipo.fecha_ingreso).format("YYYY-MM-DD")
            : moment().format("YYYY-MM-DD"),
          condicion: this.equipo.condicion || "OPERATIVO",
          observacion_actual: this.equipo.observacion_actual || ""
        };
        this.codigoVerificado = true;
      } else {
        this.form = {
          codigo: "",
          marca: "",
          modelo: "",
          descripcion: "",
          ubicacion_especifica: "",
          fecha_ingreso_picker: moment().format("YYYY-MM-DD"),
          condicion: "OPERATIVO",
          observacion_actual: ""
        };
      }
    },

    async verificarCodigo() {
      if (this.equipo || !this.form.codigo || !this.form.codigo.trim()) {
        this.errorCodigo = "";
        this.codigoVerificado = true;
        return;
      }

      const codigo = this.form.codigo.trim().toUpperCase();
      this.form.codigo = codigo;

      this.verificandoCodigo = true;
      this.errorCodigo = "";

      try {
        const existe = await existeCodigo(codigo);
        if (existe) {
          this.errorCodigo = `El código ${codigo} ya existe`;
          this.codigoVerificado = false;
        } else {
          this.errorCodigo = "";
          this.codigoVerificado = true;
        }
      } catch (error) {
        console.error("Error al verificar código:", error);
        this.errorCodigo = "Error al verificar código";
        this.codigoVerificado = false;
      } finally {
        this.verificandoCodigo = false;
      }
    },

    async guardar() {
      if (!this.$refs.form.validate()) return;
      if (!this.equipo && this.form.codigo && this.form.codigo.trim()) {
        await this.verificarCodigo();
        if (this.errorCodigo) {
          this.$store.commit("dialogosnackbar", this.errorCodigo);
          return;
        }
      }

      this.guardando = true;

      try {
        const codigoFinal = this.form.codigo && this.form.codigo.trim()
          ? this.form.codigo.trim().toUpperCase()
          : await obtenerSiguienteCodigo();

        const data = {
          codigo: codigoFinal,
          marca: this.form.marca,
          modelo: this.form.modelo,
          descripcion: this.form.descripcion,
          ubicacion_especifica: this.form.ubicacion_especifica,
          fecha_ingreso: moment(this.form.fecha_ingreso_picker).valueOf(),
          observacion_actual: this.form.observacion_actual
        };

        if (this.equipo) {
          if (this.puedeEditarCondicion && this.form.condicion !== this.equipo.condicion) {
            data.condicion = this.form.condicion;
          }
          await actualizarEquipo(this.equipo.codigo, data);
        } else {
          await nuevoEquipo(data);
        }

        this.$emit("guardado");
        this.cerrar();
      } catch (error) {
        console.error("Error al guardar equipo:", error);
        this.$store.commit("dialogosnackbar", "Error: " + error.message);
      } finally {
        this.guardando = false;
      }
    },

    cerrar() {
      this.show = false;
      this.errorCodigo = "";
      this.codigoVerificado = false;
      this.$refs.form?.reset();
    }
  }
};
</script>
