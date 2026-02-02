<template>
    <div>
        <v-btn v-if="esAdmin" fab fixed bottom right color="#039BE5" dark class="mb-12 mr-2"
            @click="dial_periodos = true" title="Gestión de Períodos">
            <v-icon>mdi-calendar-lock</v-icon>
        </v-btn>
        <dialog_periodos v-model="dial_periodos" @cerrar="dial_periodos = false"
            @periodo-actualizado="onPeriodoActualizado" />
    </div>
</template>

<script>
import dialog_periodos from '@/components/dialogos/dialog_periodos';

export default {
    name: 'FabPeriodos',
    components: {
        dialog_periodos
    },
    data() {
        return {
            dial_periodos: false
        };
    },
    computed: {
        esAdmin() {
            return this.$store.state.permisos?.es_admin === true;
        }
    },
    methods: {
        onPeriodoActualizado(data) {
            this.$emit('periodo-actualizado', data);
        }
    }
};
</script>
