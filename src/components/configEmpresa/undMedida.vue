<template>
  <v-dialog v-model="$store.state.dialogomedidas" max-width="560px" persistent>
    <div>
      <v-system-bar window dark>
        <v-icon @click="$store.commit('dialogomedidas')">mdi-close</v-icon>
        <v-spacer></v-spacer>

        <!-- Botón: recargar/merge desde BD -->
        <v-btn small text @click="cargarDesdeBD" :loading="cargando" :disabled="cargando">
          <v-icon left>mdi-cloud-sync</v-icon> Sincronizar
        </v-btn>

        <!-- Botón: activar formulario -->
        <v-btn small text class="ml-2" @click="toggleForm">
          <v-icon left>mdi-plus</v-icon> Nueva
        </v-btn>
      </v-system-bar>
    </div>

    <v-card>
      <!-- Formulario de alta -->
      <v-expand-transition>
        <div v-if="mostrarForm">
          <v-divider></v-divider>
          <v-card-text>
            <v-form ref="form" v-model="formValido" lazy-validation>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.nombre" label="Nombre" outlined dense
                    :rules="[rules.requerido, rules.min2]" @blur="aMayus('nombre')" :disabled="cargando"
                    hint="Ej.: UNIDAD, KILOGRAMO, DOCENA" persistent-hint />
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model="form.corto" label="SUNAT" outlined dense :rules="[rules.requerido, rules.len3]"
                    @blur="aMayus('corto')" :disabled="cargando" hint="Código 3 letras (NIU, KGM, LTR)" persistent-hint
                    maxlength="3" />
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model="form.general" label="General" outlined dense
                    :rules="[rules.requerido, rules.min2]" @blur="aMayus('general')" :disabled="cargando"
                    hint="Abreviatura local (UND, KG, LT)" persistent-hint />
                </v-col>
              </v-row>

              <v-row dense>
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn text @click="cancelar" :disabled="cargando">Cancelar</v-btn>
                  <v-btn color="primary" dark @click="guardar" :loading="cargando" :disabled="!formValido || cargando">
                    <v-icon left>mdi-content-save</v-icon> Guardar
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
        </div>
      </v-expand-transition>

      <!-- Tabla -->
      <v-card-text class="pt-0">
        <v-simple-table dense>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Nombre</th>
                <th class="text-left">SUNAT</th>
                <th class="text-left">General</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in medidasOrdenadas" :key="item.nombre + '-' + item.corto">
                <td>{{ item.nombre }}</td>
                <td>{{ item.corto }}</td>
                <td>{{ item.general }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { all_medidas, graba_medida } from '@/db.js'
import store from '@/store/index'

export default {
  name: 'DialogoMedidasSunat',
  data() {
    return {
      // Formulario
      mostrarForm: false,
      formValido: false,
      cargando: false,
      form: {
        nombre: '',
        corto: 'NIU',
        general: ''
      },
      // Reglas validación
      rules: {
        requerido: v => (!!v && String(v).trim().length > 0) || 'Requerido',
        min2: v => (v && String(v).trim().length >= 2) || 'Mínimo 2 caracteres',
        len3: v => (v && String(v).trim().length === 3) || 'Debe tener 3 caracteres'
      },
      // Fallback local por si el store llega vacío (opc.)
      medidassunat_local: [
        { nombre: "UNIDAD", corto: "NIU", general: "UND" },
        { nombre: "METRO CUBICO", corto: "MTQ", general: "MTQ" },
        { nombre: "DOCENA", corto: "DZN", general: "DOC" },
        { nombre: "PAR", corto: "NIU", general: "PAR" },
        { nombre: "MILLARES", corto: "MIL", general: "MILL" },
        { nombre: "KILOGRAMO", corto: "KGM", general: "KG" },
        { nombre: "TONELADA", corto: "TNE", general: "TN" },
        { nombre: "METRO", corto: "MTR", general: "MT" },
        { nombre: "GRAMO", corto: "GRM", general: "GR" },
        { nombre: "PAQUETE", corto: "PK", general: "PAQ" },
        { nombre: "PAQUETEx6", corto: "PK", general: "PAQ" },
        { nombre: "PAQUETEx12", corto: "PK", general: "PAQ" },
        { nombre: "CAJA", corto: "BX", general: "CAJ" },
        { nombre: "BOTELLAS", corto: "BO", general: "BOT" },
        { nombre: "LITRO", corto: "LTR", general: "LT" },
        { nombre: "GALON", corto: "GLI", general: "GAL" },
        { nombre: "BIDON", corto: "NIU", general: "BID" },
        { nombre: "PLANCHA", corto: "NIU", general: "UND" },
        { nombre: "CIENTO", corto: "NIU", general: "UND" },
        { nombre: "FARDOS", corto: "NIU", general: "FAR" },
        { nombre: "DIAS", corto: "NIU", general: "UND" },
        { nombre: "FRASCO", corto: "NIU", general: "UND" },
        { nombre: "DISPLAY", corto: "NIU", general: "UND" },
        { nombre: "TIRA", corto: "NIU", general: "UND" },
        { nombre: "SACO", corto: "BG", general: "SAC" },
      ]
    }
  },
  computed: {
    medidas() {
      // Prefiere el store; si no hay, usa fallback local
      return (store.state.medidassunat && store.state.medidassunat.length)
        ? store.state.medidassunat
        : this.medidassunat_local
    },
    medidasOrdenadas() {
      return [...this.medidas].sort((a, b) => a.nombre.localeCompare(b.nombre))
    }
  },
  methods: {
    toggleForm() {
      this.mostrarForm = !this.mostrarForm
      if (this.mostrarForm) this.resetForm()
    },
    resetForm() {
      this.form = { nombre: '', corto: 'NIU', general: '' }
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.resetValidation()
      })
    },
    aMayus(campo) {
      if (!this.form[campo]) return
      this.form[campo] = String(this.form[campo]).trim().toUpperCase()
    },
    existeDuplicado({ nombre, corto }) {
      const n = String(nombre || '').trim().toUpperCase()
      const c = String(corto || '').trim().toUpperCase()
      return this.medidas.some(m => {
        const mn = String(m.nombre || '').trim().toUpperCase()
        const mc = String(m.corto || '').trim().toUpperCase()
        // DUPLICADO SOLO SI el par (nombre,corto) ya existe
        return mn === n && mc === c
      })
    },


    async guardar() {
      try {
        this.aMayus('nombre'); this.aMayus('corto'); this.aMayus('general')

        // Validar form
        if (this.$refs.form && !this.$refs.form.validate()) return

        // Chequear duplicado
        if (this.existeDuplicado(this.form)) {
          store.commit('dialogosnackbar', 'La medida ya existe (Nombre o SUNAT).')
          return
        }

        this.cargando = true

        // Persistir en BD
        const payload = { ...this.form }
        await graba_medida(payload) // <-- tu implementación en '@/db.js'

        // Actualizar store
        store.commit('agrega_medida', payload)

        store.commit('dialogosnackbar', 'Medida registrada correctamente.')
        this.resetForm()
        this.mostrarForm = false
      } catch (e) {
        console.error(e)
        store.commit('dialogosnackbar', 'Error al grabar la medida.')
      } finally {
        this.cargando = false
      }
    },
    cancelar() {
      this.resetForm()
      this.mostrarForm = false
    },
    async cargarDesdeBD() {
      try {
        this.cargando = true
        const snap = await all_medidas().once('value')

        const arrBD = snap && typeof snap.val === 'function'
          ? this.toArrayMedidasFromVal(snap.val())
          : Array.isArray(snap)
            ? this.toArrayMedidasFromVal(snap)
            : this.toArrayMedidasFromVal(snap || {})

        const actuales = this.medidas.map(m => ({
          nombre: String(m.nombre || '').trim().toUpperCase(),
          corto: String(m.corto || '').trim().toUpperCase(),
          general: String(m.general || '').trim().toUpperCase(),
        }))

        const keyOf = x => `${x.nombre}__${x.corto}`
        const seen = new Set()
        const merged = []

        for (const it of actuales) {
          const k = keyOf(it)
          if (!seen.has(k)) { seen.add(k); merged.push(it) }
        }
        for (const it of arrBD) {
          const k = keyOf(it)
          if (!seen.has(k)) { seen.add(k); merged.push(it) }
        }

        store.commit('set_medidas', merged)
        store.commit('dialogosnackbar', 'Medidas sincronizadas.')
      } catch (e) {
        console.error(e)
        store.commit('dialogosnackbar', 'No se pudo sincronizar con la BD.')
      } finally {
        this.cargando = false
      }
    },


    toArrayMedidasFromVal(val) {
      const obj = val || {};
      const arr = Array.isArray(obj) ? obj : Object.values(obj);
      return arr
        .filter(Boolean)
        .map(it => ({
          nombre: String(it.nombre || '').trim().toUpperCase(),
          corto: String(it.corto || '').trim().toUpperCase(),
          general: String(it.general || '').trim().toUpperCase(),
        }));
    }
  }
}
</script>
