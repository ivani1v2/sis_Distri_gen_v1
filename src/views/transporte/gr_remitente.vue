<template>
    <div class="mb-6 pa-4 mt-3">
        <v-row class="text-left mt-n5">
            <v-col cols="4">
                <h4 v-if="valida_guia">GUIA DE REMISION/REMITENTE</h4>
                <h4 v-if="!valida_guia">GUIA DE REMISION/TRANSPORTISTA</h4>
            </v-col>
            <v-col cols="4">
                <v-btn block elevation="3" color="info" @click="emitir()" small>
                    <v-icon left>
                        mdi-package-variant-closed
                    </v-icon>Emitir
                </v-btn>
            </v-col>
            <v-col cols="4">
                <v-btn block elevation="3" color="error" @click="vista_previa()" small>
                    <v-icon left>
                        mdi-eye
                    </v-icon>vista Previa
                </v-btn>
            </v-col>
        </v-row>

        <v-card class="pa-3 mt-1">
            <v-row class="mx-auto text-center">
                <v-col cols="6">
                    <v-select style="font-size:13.5px" outlined dense v-model="tipo_guia" :items="array_tipo_guia"
                        menu-props="auto" hide-details label="TIPO DE GUIA"></v-select>
                </v-col>
                <v-col cols="6" class="mx-auto text-center">
                    <v-radio-group v-if="valida_guia" style="font-size:13.5px" class="mb-n6 mt-1 text-center" dense
                        v-model="modo_transporte" row> Modo
                        :
                        <v-radio label="Publico" value="01"></v-radio>
                        <v-radio label="Privado" value="02"></v-radio>
                    </v-radio-group>
                    <v-text-field class="mb-n6" v-if="!valida_guia" style="font-size:13.5px" outlined dense
                        v-model="registro_mtc" label="N° Registro MTC"></v-text-field>
                </v-col>
            </v-row>
        </v-card>
        <v-row class="mt-1" dense>
            <v-col cols="6">
                <v-card class="pa-3 mt-1">
                    <v-row class="mx-auto text-center mt-n5" dense>
                        <v-col cols="4">
                            <v-switch dense v-model="retorno_vacio" label="Retorno Vehiculo Vacio" color="red"
                                hide-details></v-switch>
                        </v-col>
                        <v-col cols="4" class="mx-auto text-center">
                            <v-switch dense v-model="retorno_envaces" label="Retorno con Envases Vacíos" color="red"
                                hide-details></v-switch>
                        </v-col>
                        <v-col cols="4" class="mx-auto text-center">
                            <v-switch dense v-model="programado" label="Transbordo Programado" color="red"
                                hide-details></v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="mx-auto text-center mt-n5" dense>
                        <v-col cols="4" class="mx-auto text-center">
                            <v-switch v-if="valida_guia" dense v-model="vehic_m1" label="Vehículos Categoría M1 o L"
                                color="red" hide-details></v-switch>
                        </v-col>
                        <v-col cols="4" class="mx-auto text-center">
                            <v-switch dense v-model="traslado_total" label="Traslado total (DAM o DS)" color="red"
                                hide-details></v-switch>
                        </v-col>
                        <v-col cols="4" class="mx-auto text-center">
                            <v-switch v-if="valida_guia" dense v-model="datos_transpor" label="Datos del Transportista"
                                color="red" hide-details></v-switch>
                            <v-switch v-if="!valida_guia" dense v-model="trans_sub" label="Trasporte Subcontratado"
                                color="red" hide-details></v-switch>
                        </v-col>

                    </v-row>
                </v-card>
            </v-col>
            <v-col cols="6">
                <v-card class="pa-3 mt-1">
                    <v-row dense>
                        <v-col cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n1'"
                            v-if="!valida_guia">
                            <v-select style="font-size:13.5px" outlined dense v-model="pagado_por" :items="array_pagos"
                                menu-props="auto" hide-details label="Flete pagado por:"></v-select>
                        </v-col>
                        <v-col cols="12" :sm="!valida_guia ? 6 : 12"
                            :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n1 mb-n6'">
                            <v-text-field style="font-size:13.5px" outlined dense :value="resumenRelacionados"
                                label="Doc. Relacionados" readonly class="cursor-pointer" persistent-hint
                                append-icon="mdi-file-document-edit-outline"
                                @click="dial_relacionados = !dial_relacionados"
                                @click:append="dial_relacionados = !dial_relacionados" />
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>

        <v-card class="pa-3 mt-1" v-if="trans_sub">
            <h4 style="font-size:13.5px" class="mb-1">Empresa Subcontrata</h4>
            <v-row dense>
                <v-col cols="12" sm="3" :class="$vuetify.breakpoint.smAndDown ? '' : 'mb-n6'">
                    <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="ruc_subcontrata"
                        label="RUC" append-icon="mdi-magnify" @click:append="buscar_sub()"
                        @keyup.enter="buscar_sub()"></v-text-field>

                </v-col>
                <v-col cols="12" sm="9" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mb-n6'">
                    <v-text-field style="font-size:13.5px" outlined small dense v-model="razon_subcontrata"
                        label="Razon Social"></v-text-field>
                </v-col>
            </v-row>
        </v-card>

        <v-card class="pa-3 mt-1">
            <h4 style="font-size:13.5px" class="mb-1" v-if="valida_guia">Emisor
            </h4>
            <h4 style="font-size:13.5px" class="mb-1" v-if="!valida_guia">REMITENTE
                <v-btn class="mt-n1 ml-3" elevation="3" color="info" @click="di_remitente = true" x-small>
                    <v-icon left>
                        mdi-magnify
                    </v-icon>Ver Lista
                </v-btn>
            </h4>
            <v-row class="text-center" dense :class="$vuetify.breakpoint.smAndDown ? 'mb-n2' : 'mb-n6'">

                <v-col cols="6" sm="3">
                    <v-text-field style="font-size:13.5px" type="date" outlined dense v-model="date_emision"
                        label="Emision"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-text-field style="font-size:13.5px" type="date" outlined dense v-model="date_traslado"
                        :label="texto_fecha"></v-text-field>
                </v-col>
                <v-col v-if="!valida_guia" cols="6" sm="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-select style="font-size:13.5px" outlined dense v-model="documento" :items="documentos"
                        menu-props="auto" hide-details label="Tipo Doc"></v-select>
                </v-col>
                <v-col v-if="!valida_guia" cols="6" sm="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                    <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="numero_doc"
                        label="N° Doc" append-icon="mdi-magnify" @click:append="BuscarDocumento()"
                        @keyup.enter="BuscarDocumento()"></v-text-field>
                </v-col>
                <v-col v-if="!valida_guia" cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'">
                    <v-text-field style="font-size:13.5px" outlined small dense v-model="razon_social"
                        label="Razon Social"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" :class="!valida_guia ? 'mt-n5' : ''">
                    <v-select style="font-size:13.5px" outlined dense v-model="motivos_guia"
                        :items="$store.state.motivos_guia" menu-props="auto" hide-details
                        label="Motivo Traslado"></v-select>
                </v-col>
            </v-row>
        </v-card>
        <v-row class="mt-1" dense>
            <v-col :cols="valida_modo ? 6 : 12">
                <v-card class="pa-3 mt-1">
                    <h4 style="font-size:13.5px" class="mb-1">Destinatario

                    </h4>

                    <v-row class="text-center" dense :class="$vuetify.breakpoint.smAndDown ? 'mb-n2' : 'mb-n6'">
                        <v-col cols="6" sm="3" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                            <v-select style="font-size:13.5px" outlined dense v-model="documento_dest"
                                :items="documentos" menu-props="auto" hide-details label="Tipo Doc"></v-select>
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-text-field style="font-size:13.5px" outlined type="number" dense
                                v-model="ruc_destinatario" label="N° Doc" append-icon="mdi-magnify"
                                @click:append="buscar_destina()" @keyup.enter="buscar_destina()"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                            <v-text-field style="font-size:13.5px" outlined small dense
                                v-model="razonsocial_destinatario" label="Razon Social"></v-text-field>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
            <v-col cols="6" v-if="valida_modo">
                <v-card class="pa-3 mt-1">
                    <h4 style="font-size:13.5px" class="mb-1">Datos Transportista
                        <v-btn class="mt-n1 ml-3" elevation="3" color="info" @click="dial_trans = true" x-small>
                            <v-icon left>
                                mdi-magnify
                            </v-icon>Ver Lista
                        </v-btn>
                    </h4>
                    <v-row class="text-center mb-n5" dense>
                        <v-col cols="12" sm="3" :class="$vuetify.breakpoint.smAndDown ? '' : ''">
                            <v-text-field style="font-size:13.5px" outlined type="number" dense v-model="ruc_transporte"
                                label="RUC Transportista" append-icon="mdi-magnify" @click:append="buscar_transporte()"
                                @keyup.enter="buscar_transporte()"></v-text-field>

                        </v-col>
                        <v-col cols="12" sm="5" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                            <v-text-field style="font-size:13.5px" outlined small dense v-model="razon_transporte"
                                label="Razon Social"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="4" :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : ''">
                            <v-text-field style="font-size:13.5px" outlined dense v-model="registro_mtc"
                                label="N° Registro MTC"></v-text-field>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>


        <v-row class="mt-1" dense v-if="datos_transpor">
            <v-col cols="6">
                <v-card class="pa-3">
                    <v-row class="text-center">
                        <v-col cols="6">
                            <h4 style="font-size:13.5px" class="mb-1">Datos de Vehiculos</h4>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block elevation="3" color="info" @click="dial_agrega_v = !dial_agrega_v" x-small>
                                <v-icon left>
                                    mdi-plus
                                </v-icon>Adicionar
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-simple-table fixed-header height="15vh" dense>
                        <template v-slot:default>

                            <thead>
                                <tr>
                                    <th class="text-left">
                                        N° de placa
                                    </th>
                                    <th class="text-left">
                                        Nº de TUCE o C.H.Veh.
                                    </th>
                                    <th class="text-left">
                                        N° de autorización
                                    </th>
                                    <th class="text-left">
                                        Emisor de la autorización
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr v-for="item in array_vehiculo" :key="item.placa">
                                    <td style="font-size:75%">
                                        <v-icon color="red" @click="eliminar_V(item)" small>mdi-close</v-icon>
                                        {{ item.placa }}
                                    </td>
                                    <td style="font-size:75%">{{ item.num_habilitacion }}</td>
                                    <td style="font-size:75%">{{ item.autorizacion }}</td>
                                    <td style="font-size:75%"> {{ item.emisor_autori }} </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card>
            </v-col>

            <v-col cols="6">
                <v-card class="pa-3">

                    <v-row class="text-center">
                        <v-col cols="6">
                            <h4 style="font-size:13.5px" class="mb-1">Conductor</h4>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block elevation="3" color="info" @click="dial_agrega_c = !dial_agrega_c" x-small>
                                <v-icon left>
                                    mdi-plus
                                </v-icon>Adicionar
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-simple-table fixed-header height="15vh" dense>
                        <template v-slot:default>

                            <thead>
                                <tr>
                                    <th class="text-left">
                                        N° Doc
                                    </th>
                                    <th class="text-left">
                                        Conductor
                                    </th>
                                    <th class="text-left">
                                        Licencia
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="item in array_conductor" :key="item.id">
                                    <td style="font-size:75%">
                                        <v-icon color="red" @click="eliminar_c(item)" small>mdi-close</v-icon>
                                        {{ item.num_doc_conductor }}
                                    </td>
                                    <td style="font-size:75%">{{ item.nom_conductor }}</td>
                                    <td style="font-size:75%"> {{ item.num_licencia }} </td>

                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="mt-1 " dense>

            <v-col cols="6">
                <v-card class="pa-3 mb-n7">
                    <v-row dense>
                        <v-row class="text-left">
                            <v-col cols="6">
                                <h4 style="font-size:13.5px">Punto de Partida
                                </h4>
                            </v-col>
                            <v-col cols="6">

                            </v-col>
                        </v-row>
                        <v-col cols="12">
                            <v-row class="" dense>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="departamento_p"
                                        :items="arrayDepas" item-text="nombre" return-object label="DEPARTAMENTO">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="provincia_p" :items="arrayProvsP"
                                        item-text="nombre" return-object label="PROVINCIA" :disabled="!departamento_p">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>

                                </v-col>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="distrito_p" :items="arrayDistsP"
                                        item-text="nombre" return-object label="DISTRITO" :disabled="!provincia_p">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                            </v-row>
                            <v-textarea :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'"
                                style="font-size:13.5px" outlined dense v-model="dir_p" auto-grow filled
                                label="DIRECCION ORIGEN" rows="1"></v-textarea>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>

            <v-col cols="6">
                <v-card class="pa-3">
                    <v-row class="" dense>
                        <h4 style="font-size:13.5px">Punto de Llegada
                            <v-btn x-small color="info" class="mr-1" @click="abrirDialogDireccion()">
                                <v-icon left>mdi-plus</v-icon>Direcciones
                            </v-btn>
                        </h4>
                        <v-col cols="12">
                            <v-row class="" dense>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="departamento_l"
                                        :items="arrayDepas" item-text="nombre" return-object label="DEPARTAMENTO">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="provincia_l" :items="arrayProvsL"
                                        item-text="nombre" return-object label="PROVINCIA" :disabled="!departamento_l">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>

                                </v-col>
                                <v-col cols="4">
                                    <v-autocomplete outlined dense clearable v-model="distrito_l" :items="arrayDistsL"
                                        item-text="nombre" return-object label="DISTRITO" :disabled="!provincia_l">
                                        <template v-slot:item="{ item }">
                                            <div class="d-flex justify-space-between" style="width:100%">
                                                <span>{{ item.nombre }}</span>
                                                <small class="grey--text">{{ item.ubigeo_sunat || item.ubigeo }}</small>
                                            </div>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                            </v-row>
                            <v-textarea :class="$vuetify.breakpoint.smAndDown ? 'mt-n6' : 'mt-n5'"
                                style="font-size:13.5px" outlined dense v-model="dir_l" auto-grow filled
                                label="DIRECCION LLEGADA" rows="1"></v-textarea>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>
        <v-row class=" mb-n6" dense>
            <v-col cols="2">
                <v-select outlined dense v-model="medida_t" :items="array_medidas" menu-props="auto" hide-details
                    label="Medida"></v-select>
            </v-col>
            <v-col cols="2">
                <v-text-field outlined dense v-model="peso" type="number" label="Peso Total"></v-text-field>
            </v-col>
            <v-col cols="4">
                <v-textarea style="font-size:13.5px" outlined dense v-model="observacion" auto-grow filled
                    label="Observacion" rows="1"></v-textarea>
            </v-col>
            <v-col cols="1">
                <v-text-field outlined dense v-model="nro_bultos" type="number" label="Nro. de Bultos"></v-text-field>
            </v-col>
            <v-col cols="1">
                <div v-if="medida_bultos !== 'OTROS'">
                    <v-select outlined dense v-model="medida_bultos" :items="opciones_medida_bultos" menu-props="auto"
                        hide-details label="Medida"></v-select>
                </div>
                <div v-else>
                    <v-text-field outlined dense v-model="medida_bultos_personalizada" label="Medida (otros)"
                        hide-details append-icon="mdi-close" @click:append="volverASelect"></v-text-field>
                </div>
            </v-col>
            <v-col cols="2">
                <v-btn block elevation="3" color="warning" @click="agregar_item()" small>
                    <v-icon left>
                        mdi-package-variant-closed
                    </v-icon>Agregar Items
                </v-btn>
            </v-col>
        </v-row>
        <v-card class="pa-3 mb-12">
            <v-simple-table fixed-header height="20vh" dense>
                <template v-slot:default>

                    <thead>
                        <tr>
                            <th class="text-left">
                                Descripcion
                            </th>
                            <th class="text-left">
                                cantidad
                            </th>
                            <th class="text-left">
                                MEDIDA
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr v-for="item in lista_items" :key="item.id">
                            <td>
                                <v-icon color="red" @click="eliminar(item)" small>mdi-close</v-icon>
                                {{ item.descripcion }}
                            </td>
                            <td>{{ item.cantidad }}</td>
                            <td> {{ item.medida }} </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>


        <v-dialog v-model="dial_imprime" max-width="550" persistent>
            <div>
                <v-system-bar window dark>
                    <v-spacer></v-spacer>
                </v-system-bar>
            </div>
            <v-card class="pa-6 text-center" v-if="pendiente">
                <v-progress-circular :width="7" :size="100" indeterminate color="blue"
                    style="font-size:13.5px">Esperando
                    QR</v-progress-circular>
                <h3 class="text-center">Las Guias solo tienen QR, cuando las aprueba sunat!</h3>
                <p style="font-size:13.5px" class="text-center">Para sustentar el traslado es suficiente exhibir el
                    código
                    QR o indicar verbalmente
                    al fedatario fiscalizador, el número de RUC del remitente, la serie y número de la Guía de
                    Remisión
                    Electrónica (GRE).
                </p>
                <p style="font-size:13.5px" class="text-center">Referencia: Art 6 de la RS 255-2015/SUNAT modificado
                    por
                    el
                    Art. 3 de la RS
                    123-2022/SUNAT</p>
                <v-row dense>
                    <v-col cols="6">
                        <v-card @click.prevent="genera_pdf('genera')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/disc.png"></v-img>
                                <h5 block class="text-center pa-1">IMPRIME SIN QR</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card @click.prevent="regresa()">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/reenvia.png"></v-img>
                                <h5 block class="text-center pa-1">SALIR</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
            <v-card class="pa-6 text-center" v-if="!pendiente">
                <v-img class="mx-auto" height="80" width="80" src="/chek.gif"></v-img>
                <h5 class="text-center">APROBADO</h5>

                <v-row dense>
                    <v-col cols="12" xs="12" sm="12">
                        <v-card @click.prevent="genera_pdf('genera')">
                            <v-container>
                                <v-img class="mx-auto" height="35" width="35" src="/disc.png"></v-img>
                                <h5 block class="text-center pa-1">IMPRIME</h5>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card>
        </v-dialog>
        <dial_destinatario v-if="di_destinatario" @cierre="di_destinatario = false"
            @agrega_lista="agregar_destinatario($event)" />
        <dial_remitente v-if="di_remitente" @cierre="di_remitente = false" @agrega_lista="agregar_remitente($event)" />
        <dial_items v-if="dial_agrega" @cierre="dial_agrega = false" @agrega_item="guada_item($event)" />
        <vehiculos v-if="dial_agrega_v" @cierre="dial_agrega_v = false" @agrega_lista="agrega_vehiculo($event)" />
        <choferes v-if="dial_agrega_c" @cierre="dial_agrega_c = false" @agrega_lista="agrega_conductor($event)" />
        <transportista v-if="dial_trans" @cierre="dial_trans = false" @agrega_lista="agregar_empresa($event)" />
        <dial_relaciona v-if="dial_relacionados" @cierre="dial_relacionados = false"
            @agregar="agrega_relacionado($event)" @limpiar="array_relacionados = [], dial_relacionados = false" />
        <dial_obs v-if="dial_observa" @cierre="dial_observa = false" @agrega_lista="agrega_obs($event)" />

        <dialog_direcciones_cliente v-model="dial_direcciones" :cliente-id="numero || ''"
            @seleccion="onDireccionSeleccionada" />
    </div>
</template>

<script>
import {
    obtenContador,
    nuevaGuiaremision,
    sumaContador,
    nuevo_transporte,
    buscaGuiaremision,
    grabaConfigura,
    nuevo_tablas_transporte,
    grabaCabecera_p
} from '../../db'
import vehiculos from '@/views/transporte/vehiculos'
import choferes from '@/views/transporte/choferes'
import transportista from '@/views/transporte/dial/dial_transportista'
import dial_relaciona from './dial/dialogo_relacionados.vue'
import dial_items from './dial/dialogo_agrega_items.vue'
import {
    guia_remision
} from '../../servidorsunat'
import {
    generaGuia
} from '../../pdf_guia'
import moment from 'moment'
import store from '@/store/index'
import axios from "axios"
import dialog_direcciones_cliente from '@/views/clientes/dialogos/dial_direcciones'
import {
    departamento,
    provincia,
    distrito
} from '../../ubigeos'
export default {
    components: {
        vehiculos,
        choferes,
        transportista,
        dial_relaciona,
        dial_items,
        dialog_direcciones_cliente
    },
    data: () => ({
        dial_direcciones: false,
        dial_agrega: false,
        dial_observa: false,
        di_remitente: false,
        di_destinatario: false,
        dial_relacionados: false,
        array_relacionados: [],
        pendiente: true,
        dial_imprime: false,
        dial_agrega_v: false,
        dial_agrega_c: false,
        dial_trans: false,
        dialogoubicaciones: false,
        dial_agrega: false,
        ubigeodepa: '',
        ubigeoprov: '',
        ubigeoselecto: '',
        tipoubicacion: '',
        arraydepa: [],
        arrayprov: [],
        arraydistr: [],
        tipo_guia: 'GUIA REMITENTE',
        array_tipo_guia: [
            'GUIA REMITENTE',
            'GUIA TRANSPORTISTA',
        ],
        documentos: [
            'DNI',
            'RUC',
            'Pasaporte',
            'Carnet de Extranjeria'
        ],
        date_emision: moment(String(new Date)).format('YYYY-MM-DD'),
        date_traslado: moment(String(new Date)).format('YYYY-MM-DD'),
        modo_transporte: "01",
        documento: 'DNI',
        numero_doc: '',
        razon_social: '',
        motivos_guia: 'VENTA',
        ruc_transporte: '',
        razon_transporte: '',
        registro_mtc: '',
        departamento_p: '',
        provincia_p: '',
        distrito_p: '',
        dir_p: '',
        departamento_l: '',
        provincia_l: '',
        distrito_l: '',
        dir_l: '',
        peso: '',
        observacion: '',
        lista_items: [],
        ubicacion_partida: false,
        documento_dest: 'DNI',
        ruc_destinatario: '',
        razonsocial_destinatario: '',
        ubigeo1: '',
        ubigeo2: '',
        ubigeo3: '',
        u_origen: '',
        u_destino: '',
        array_vehiculo: [],
        array_conductor: [],
        retorno_vacio: false,
        retorno_envaces: false,
        programado: false,
        vehic_m1: false,
        traslado_total: false,
        datos_transpor: false,
        trans_sub: false,
        array_medidas: ['KILOGRAMO', 'TONELADA'],
        array_pagos: ['Remitente', 'Subcontratador', 'Tercero'],
        medida_t: 'KILOGRAMO',
        item_selecto: [],
        pagado_por: 'Remitente',
        ruc_subcontrata: '',
        razon_subcontrata: '',
        arrayDepas: [],
        arrayProvsP: [], // provincias para Partida
        arrayDistsP: [], // distritos para Partida
        arrayProvsL: [], // provincias para Llegada
        arrayDistsL: [], // distritos para Llegada
        cascadaLock: false,
        dialogo_dire: false,
        modo_direccion: '',
        numero: '',
        id_grupo_pedido: '',
        numeracion_pedido: '',
        opciones_medida_bultos: ['CAJAS', 'BULTOS', 'SOBRE', 'PAQUETE', 'OTROS'],
        medida_bultos_personalizada: '',
        medida_bultos: 'CAJAS',
    }),
    watch: {
        'departamento_p'(depa) {
            if (this.cascadaLock) return
            this.provincia_p = null
            this.distrito_p = null
            this.arrayDistsP = []
            if (depa && (depa.ubigeo || depa.ubigeo_sunat)) {
                this.arrayProvsP = provincia(depa.ubigeo || depa.ubigeo_sunat) || []
            } else {
                this.arrayProvsP = []
            }
            if (!this.distrito_p) this.u_origen = ''
        },
        'provincia_p'(prov) {
            if (this.cascadaLock) return
            this.distrito_p = null
            if (prov && (prov.ubigeo || prov.ubigeo_sunat)) {
                this.arrayDistsP = distrito(prov.ubigeo || prov.ubigeo_sunat) || []
            } else {
                this.arrayDistsP = []
            }
            if (!this.distrito_p) this.u_origen = ''
        },

        'distrito_p'(dist) {
            if (this.cascadaLock) return
            const dep = this.departamento_p || null
            const prov = this.provincia_p || null
            const dis = dist || null

            const uDep = dep?.ubigeo_sunat ?? dep?.ubigeo ?? ''
            const uProv = prov?.ubigeo_sunat ?? prov?.ubigeo ?? ''
            const uDist = dis?.ubigeo_sunat ?? dis?.ubigeo ?? ''

            this.u_origen = (uDep && uProv && uDist) ? `${uDep}${uProv}${uDist}` : ''
            console.log(this.u_origen)
        },
        'departamento_l'(depa) {
            if (this.cascadaLock) return
            this.provincia_l = null
            this.distrito_l = null
            this.arrayDistsL = []
            if (depa && (depa.ubigeo || depa.ubigeo_sunat)) {
                this.arrayProvsL = provincia(depa.ubigeo || depa.ubigeo_sunat) || []
            } else {
                this.arrayProvsL = []
            }
            if (!this.distrito_l) this.u_destino = ''
        },

        'provincia_l'(prov) {
            if (this.cascadaLock) return
            this.distrito_l = null
            if (prov && (prov.ubigeo || prov.ubigeo_sunat)) {
                this.arrayDistsL = distrito(prov.ubigeo || prov.ubigeo_sunat) || []

            } else {
                this.arrayDistsL = []
            }

            if (!this.distrito_l) this.u_destino = ''
        },

        'distrito_l'(dist) {
            if (this.cascadaLock) return
            const dep = this.departamento_l || null
            const prov = this.provincia_l || null
            const dis = dist || null

            const uDep = dep?.ubigeo_sunat ?? dep?.ubigeo ?? ''
            const uProv = prov?.ubigeo_sunat ?? prov?.ubigeo ?? ''
            const uDist = dis?.ubigeo_sunat ?? dis?.ubigeo ?? ''

            this.u_destino = (uDep && uProv && uDist) ? `${uDep}${uProv}${uDist}` : ''
            console.log(this.u_destino)
        },
        'medida_bultos'(newVal) {
            if (newVal !== 'OTROS') {
                this.medida_bultos_personalizada = '';
            }
        },

    },
    created() {
        this.arrayDepas = departamento() || []

        if (store.state.array_guia) {
            console.log(store.state.baseDatos)

            // --- precarga UBICACIÓN PARTIDA desde baseDatos ---
            const bd = store.state.baseDatos || {}

            this.cascadaLock = true
            try {
                const depP = this.findDep(bd.departamento)
                const provP = this.findProv(depP, bd.provincia)
                const distP = this.findDist(provP, bd.distrito)

                // Set partida (objetos)
                this.departamento_p = depP
                this.arrayProvsP = depP ? (provincia(depP.ubigeo || depP.ubigeo_sunat) || []) : []
                this.provincia_p = provP
                this.arrayDistsP = provP ? (distrito(provP.ubigeo || provP.ubigeo_sunat) || []) : []
                this.distrito_p = distP

                // Dirección + ubigeo
                this.dir_p = bd.direccion || ''
                this.u_origen = bd.ubigeo || ''
            } finally {
                this.$nextTick(() => { this.cascadaLock = false })
            }

            // --- lo tuyo (destinatario + items) ---
            const detalle = store.state.array_guia.array_item
            const cabecera = store.state.array_guia.arrayCabecera
            console.log("detalle", detalle)
            this.ruc_destinatario = cabecera.dni
            this.documento_dest = cabecera.tipoDocumento
            this.razonsocial_destinatario = cabecera.cliente

            this.id_grupo_pedido = cabecera.id_grupo || ''
            this.numeracion_pedido = cabecera.numeracion || ''

            for (let i = 0; i < detalle.length; i++) {
                const data = detalle[i]
                this.lista_items.push({
                    uuid: data.id,
                    cantidad: data.cantidad,
                    medida: this.obtencodigomedida(data.medida),
                    des_medida: data.medida,
                    cod_producto: data.id,
                    descripcion: data.nombre
                })
            }
            // ---- Documento relacionado (automático desde cabecera) ----
            const clean = v => (v == null ? '' : String(v)).replace(/\s+/g, '');

            const docRel = {
                ruc: clean(cabecera?.dni),                // RUC/DNI del emisor del doc relacionado
                tipo: clean(cabecera?.cod_comprobante),   // 03/01/07/08/etc
                id: clean(cabecera?.numeracion || cabecera?.serie + '-' + cabecera?.correlativoDocEmitido),
            };

            // evita duplicados
            if (docRel.ruc && docRel.tipo && docRel.id) {
                const key = `${docRel.ruc}|${docRel.tipo}|${docRel.id}`;
                const existe = (this.array_relacionados || []).some(x =>
                    `${clean(x.ruc)}|${clean(x.tipo)}|${clean(x.id)}` === key
                );
                if (!existe) this.array_relacionados = [docRel];
            }

        }
    },

    beforeDestroy() {
        store.commit('array_guia', '')
    },

    computed: {

        resumenRelacionados() {
            const arr = this.array_relacionados;
            if (!Array.isArray(arr) || arr.length === 0) return 'Sin documentos';

            // Acepta distintas claves por si tu diálogo emite con otros nombres
            return arr.map(d => {
                const tipo = d.tipo ?? d.documento_tipo ?? d.doc_tipo ?? '';
                const id = d.id ?? d.documento ?? d.doc_id ?? '';
                const ruc = d.ruc ?? d.ruc_emisor ?? '';
                return `${tipo}:${id}${ruc ? ' (RUC ' + ruc + ')' : ''}`;
            }).join(' · ');
        },

        valida_modo() {
            if (this.modo_transporte == '01') {
                return true
            } else {
                this.datos_transpor = true
                return false
            }
        },
        valida_guia() {
            if (this.tipo_guia == 'GUIA REMITENTE') {
                this.trans_sub = false
                this.numero_doc = store.state.baseDatos.ruc
                this.documento = 'RUC'
                this.razon_social = store.state.baseDatos.name
                this.modo_transporte = '01'
                this.registro_mtc = ''
                this.datos_transpor = false
                return true
            } else {
                this.datos_transpor = true
                this.numero_doc = ''
                this.documento = 'RUC'
                this.razon_social = ''
                this.modo_transporte = '02'
                this.registro_mtc = store.state.configuracion.registro_mtc
                return false
            }
        },
        texto_fecha() {
            if (this.modo_transporte == '01') {
                return 'ENTREGA AL TRANSPORTISTA'
            } else {
                return 'INICIO DEL TRASLADO'
            }
        },
        medida_bultos_final() {
            if (this.medida_bultos === 'OTROS') {
                return this.medida_bultos_personalizada || 'OTROS';
            }
            return this.medida_bultos;
        },
    },
    methods: {
        abrirDialogDireccion() {
            this.numero = this.ruc_destinatario
            this.dialogo_dire = true
            this.dial_direcciones = true
            this.modo_direccion = 'llegada'
        },
        onDireccionSeleccionada(data) {
            if (!data) return;

            const depObj = data.departamento || null;
            const provObj = data.provincia || null;
            const distObj = data.distrito || null;

            // Claves para cargar listas en cascada
            const depKey = depObj?.ubigeo ?? depObj?.ubigeo_sunat ?? '';
            const provKey = provObj?.ubigeo ?? provObj?.ubigeo_sunat ?? '';


            // Ubigeo final: tu objeto ya trae ubigeo completo "130111"
            const ubigeoFinal = String(data.ubigeo || '').trim();

            this.cascadaLock = true;
            try {
                if (this.modo_direccion === 'llegada') {
                    // --- LLEGADA ---
                    this.departamento_l = depObj;

                    // provincias y distritos disponibles para selects
                    this.arrayProvsL = depKey ? (provincia(depKey) || []) : [];
                    this.provincia_l = provObj;

                    this.arrayDistsL = provKey ? (distrito(provKey) || []) : [];
                    this.distrito_l = distObj;

                    // dirección + ubigeo
                    this.dir_l = (data.direccion || '').toUpperCase();
                    this.u_destino = ubigeoFinal;
                } else {
                    // --- PARTIDA ---
                    this.departamento_p = depObj;

                    this.arrayProvsP = depKey ? (provincia(depKey) || []) : [];
                    this.provincia_p = provObj;

                    this.arrayDistsP = provKey ? (distrito(provKey) || []) : [];
                    this.distrito_p = distObj;

                    this.dir_p = (data.direccion || '').toUpperCase();
                    this.u_origen = ubigeoFinal;
                }
            } finally {
                this.$nextTick(() => {
                    this.cascadaLock = false;

                    // Cerrar diálogo
                    this.dial_direcciones = false;

                    // Si usas dialogo_dire también:
                    this.dialogo_dire = false;
                });
            }
        },

        selecciona_ubicaciones(data) {
            console.log(data)
            this.cascadaLock = true
            try {
                const dep = data.departamento || null
                const prov = data.provincia || null
                const dist = data.distrito || null

                const uDep = dep?.ubigeo || ''
                const uProv = prov?.ubigeo || ''


                if (this.modo_direccion === 'llegada') {
                    this.departamento_l = dep
                    this.provincia_l = prov
                    this.distrito_l = dist
                    this.dir_l = data.direccion || ''
                    this.u_destino = data.ubigeo

                    // cargar listas auxiliares
                    this.arrayProvsL = provincia(uDep) || []
                    this.arrayDistsL = distrito(uProv) || []
                } else {
                    this.departamento_p = dep
                    this.provincia_p = prov
                    this.distrito_p = dist
                    this.dir_p = data.direccion || ''
                    this.u_origen = data.ubigeo
                    this.arrayProvsP = provincia(uDep) || []
                    this.arrayDistsP = distrito(uProv) || []
                }
            } finally {
                this.$nextTick(() => {
                    this.cascadaLock = false
                })
            }
        },

        agrega_relacionado(data) {
            console.log(data)
            const clean = v => (v == null ? '' : String(v)).replace(/\s+/g, ''); // quita todos los espacios

            const item = {
                ...data,
                id: clean(data.id),
                ruc: clean(data.ruc),
            };

            this.array_relacionados.push(item);
            this.dial_relacionados = false;
        },

        async finaliza_(array) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            store.commit("dialogoprogress")
            store.commit('array_guia', '')
            this.dial_imprime = true
            this.item_selecto = array
            this.pendiente = true
            buscaGuiaremision(array.id + '/qr').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    console.log(snapshot.val())
                    this.item_selecto.qr = snapshot.val()
                    this.pendiente = false
                    buscaGuiaremision(array.id + '/qr').off()
                }
            })
            await new Promise(resolve => setTimeout(resolve, 5000))
            buscaGuiaremision(array.id + '/qr').off()
            this.pendiente = false
        },
        agrega_vehiculo(data) {
            if (this.array_vehiculo.length != 0) {
                data.autorizacion = ''
            }
            this.array_vehiculo.push(data)
            this.dial_agrega_v = false
        },
        eliminar_V(item) {
            var pos = this.array_vehiculo.map(e => e.placa).indexOf(item.placa)
            this.array_vehiculo.splice(pos, 1)
        },
        agrega_conductor(data) {
            if (this.array_conductor.length == 0) {
                data.title = 'Principal'
            } else {
                data.title = 'Secundario'
            }
            this.array_conductor.push(data)
            this.dial_agrega_c = false
        },
        agregar_remitente(data) {
            this.documento = data.documento
            this.numero_doc = data.ruc
            this.razon_social = data.razonsocial
            this.di_remitente = false
        },
        agregar_destinatario(data) {
            console.log(data)
            this.documento_dest = data.documento
            this.ruc_destinatario = data.ruc
            this.razonsocial_destinatario = data.razonsocial
            this.di_destinatario = false
        },
        agregar_empresa(data) {
            console.log(data)
            this.ruc_transporte = data.ruc
            this.razon_transporte = data.razon_transporte
            this.registro_mtc = data.registro_mtc
            this.dial_trans = false
        },
        eliminar_c(item) {
            var pos = this.array_conductor.map(e => e.num_licencia).indexOf(item.num_licencia)
            this.array_conductor.splice(pos, 1)
        },

        agregar_item() {
            this.dial_agrega = true
        },
        guada_item(data) {
            this.lista_items.push(data)
            this.dial_agrega = false
        },
        eliminar(item) {
            var pos = this.lista_items.map(e => e.uuid).indexOf(item.uuid)
            this.lista_items.splice(pos, 1)
        },
        async BuscarDocumento() {
            store.commit("dialogoprogress")
            console.log(this.numero_doc.length)
            if (this.numero_doc.length == 8) {
                this.documento = 'DNI'
            }
            if (this.numero_doc.length == 11) {
                this.documento = 'RUC'
            }
            var data = await this.consultaApiPeru(this.documento, this.numero_doc)
            console.log(data)
            if (Boolean(data)) {
                if (this.documento == 'DNI') {
                    this.razon_social = data.nombre_completo
                } else {
                    this.razon_social = data.nombre_o_razon_social
                }

                store.commit("dialogoprogress")
            } else {
                alert('No existe Data')
                store.commit("dialogoprogress")
            }
        },
        async buscar_sub() {
            if (this.ruc_subcontrata.length != 11) {
                alert('DEBE SER RUC')
                return
            }
            store.commit("dialogoprogress")
            var data = await this.consultaApiPeru('RUC', this.ruc_subcontrata)
            console.log(data)
            if (Boolean(data)) {
                this.razon_subcontrata = data.nombre_o_razon_social
                store.commit("dialogoprogress")
            } else {
                alert('No existe Data')
                store.commit("dialogoprogress")
            }
        },
        async buscar_transporte() {
            if (this.ruc_transporte.length != 11) {
                alert('DEBE SER RUC')
                return
            }
            store.commit("dialogoprogress")
            var data = await this.consultaApiPeru('RUC', this.ruc_transporte)
            console.log(data)
            if (Boolean(data)) {
                this.razon_transporte = data.nombre_o_razon_social
                store.commit("dialogoprogress")
            } else {
                alert('No existe Data')
                store.commit("dialogoprogress")
            }
        },
        async buscar_destina() {
            store.commit("dialogoprogress")
            console.log(this.ruc_destinatario.length)
            if (this.ruc_destinatario.length == 8) {
                this.documento_dest = 'DNI'
            }
            if (this.ruc_destinatario.length == 11) {
                this.documento_dest = 'RUC'
            }
            var data = await this.consultaApiPeru(this.documento_dest, this.ruc_destinatario)
            console.log(data)
            if (Boolean(data)) {
                if (this.documento_dest == 'DNI') {
                    this.razonsocial_destinatario = data.nombre_completo
                } else {
                    this.razonsocial_destinatario = data.nombre_o_razon_social
                }

                store.commit("dialogoprogress")
            } else {
                alert('No existe Data')
                store.commit("dialogoprogress")
            }
        },
        async consultaApiPeru(tipo, doc) {
            var self = this
            var token = '80a4a1c5f2e97c2d78fcd5074cd64ff0a29007ef91880ad2c214af67a084433d'
            var resp = await axios
                .get('https://apiperu.dev/api/' + tipo.toLowerCase() + '/' + doc, {
                    headers: {
                        Content_Type: 'application/json',
                        authorization: ' Bearer ' + token
                    }
                })
                .then(response => (this.info = response.data

                ))
            return resp.data
        },

        async vista_previa() {
            if (this.lista_items == '') {
                alert('Es obligatorio Agregar Items')
                return
            }
            if (this.numero_doc == '') {
                alert('Documento del remitente no puede quedar Vacio')
                return
            }
            /*   if (this.tipo_guia != 'GUIA REMITENTE' && store.state.baseDatos.ruc == this.numero_doc) {
                   alert('Remitente no puede ser igual a Transportista')
                   return
               }*/
            store.commit("dialogoprogress")
            var modo_transportes = 'PRIVADO'
            if (this.modo_transporte == '01') {
                modo_transportes = 'PUBLICO'
            }
            var Emision = this.conviertefecha_unix(this.date_emision)
            var translado = this.conviertefecha_unix(this.date_traslado)
            var contador = await obtenContador().once("value")
            if (this.tipo_guia == 'GUIA REMITENTE') {
                var tipos_guia = '09'
                var serie_guia = store.state.seriesdocumentos.guia
                var cont = contador.val().orden_guia
            } else {
                var tipos_guia = '31'
                var serie_guia = store.state.seriesdocumentos.guia_t
                var cont = contador.val().orden_guia_t
            }

            var array = {
                id: serie_guia + '-' + cont,
                serie: serie_guia,
                correlativo: cont,
                tipo_comprobante: tipos_guia,
                tipo_guia: this.tipo_guia,
                fecha_emision: Emision,
                fecha_traslado: translado,
                motivo: this.motivos_guia,
                cod_motivo: this.obten_codigo_motivo(this.motivos_guia),
                observacion: this.observacion,
                modo_transporte: this.modo_transporte,
                modo_transporte_desc: modo_transportes,
                ruc_transporte: this.ruc_transporte,
                razonsocial_transporte: this.razon_transporte,
                registro_mtc: this.registro_mtc,
                array_vehiculo: this.array_vehiculo,
                array_conductor: this.array_conductor,
                cod_documento_rem: this.obten_codigo_doc(this.documento),
                ruc_remitente: this.numero_doc,
                razonsocial_remitente: this.razon_social,
                u_origen: this.u_origen,
                dir_origen: this.dir_p.toUpperCase(),
                departamento_p: this.departamento_p.nombre,
                provincia_p: this.provincia_p.nombre,
                distrito_p: this.distrito_p.nombre,
                cod_documento: this.obten_codigo_doc(this.documento_dest),
                ruc_destinatario: this.ruc_destinatario,
                razonsocial_destinatario: this.razonsocial_destinatario,
                u_destino: this.u_destino,
                dir_destino: this.dir_l.toUpperCase(),
                departamento_l: this.departamento_l.nombre,
                provincia_l: this.provincia_l.nombre,
                distrito_l: this.distrito_l.nombre,
                medida_t: this.medida_t,
                cod_medida_t: this.obtencodigomedida(this.medida_t),
                peso_total: this.peso,
                nro_bultos: this.nro_bultos,
                medida_bultos: this.medida_bultos_final,
                data: this.lista_items,
                retorno_vacio: this.retorno_vacio,
                retorno_envaces: this.retorno_envaces,
                programado: this.programado,
                vehic_m1: this.vehic_m1,
                traslado_total: this.traslado_total,
                datos_transpor: this.datos_transpor,
                trans_sub: this.trans_sub,
                ruc_subcontrata: this.ruc_subcontrata,
                razon_subcontrata: this.razon_subcontrata,
                pagado_por: this.pagado_por,
                doc_relacionados: this.array_relacionados
            }
            this.item_selecto = array
            this.guarda_empresa_t()
            this.genera_pdf('vista')
            store.commit("dialogoprogress")
        },
        async emitir() {
            if (this.lista_items == '') {
                alert('Es obligatorio Agregar Items')
                return
            }
            if (this.numero_doc == '') {
                alert('Documento del remitente no puede quedar Vacio')
                return
            }
            /*   if (this.tipo_guia != 'GUIA REMITENTE' && store.state.baseDatos.ruc == this.numero_doc) {
                   alert('Remitente no puede ser igual a Transportista')
                   return
               }*/
            if (this.peso == 0 || this.peso == '' || this.peso == ' ') {
                alert('Ingrese el Peso total')
                return
            }
            if (this.dir_p == '' || this.departamento_p == '' || this.provincia_p == '' || this.distrito_p == '' ||
                this.dir_l == '' || this.departamento_l == '' || this.provincia_l == '' || this.distrito_l == '') {
                alert('COMPLETE DIRECCION')
                return
            }
            if (!confirm('ESTA SEGURO DE EMITIR?')) {
                return
            }
            store.commit("dialogoprogress")
            var modo_transportes = 'PRIVADO'
            if (this.modo_transporte == '01') {
                modo_transportes = 'PUBLICO'
            }
            if (this.tipo_guia == 'GUIA TRANSPORTISTA' && this.registro_mtc != '') {
                grabaConfigura("registro_mtc", this.registro_mtc)
            }
            var Emision = this.conviertefecha_unix(this.date_emision)
            var translado = this.conviertefecha_unix(this.date_traslado)
            var contador = await obtenContador().once("value")
            if (this.tipo_guia == 'GUIA REMITENTE') {
                var tipos_guia = '09'
                var serie_guia = store.state.seriesdocumentos.guia
                var cont = contador.val().orden_guia
            } else {
                var tipos_guia = '31'
                var serie_guia = store.state.seriesdocumentos.guia_t
                var cont = contador.val().orden_guia_t
            }
            console.log('depa', this.departamento_l)
            var array = {
                id: serie_guia + '-' + cont,
                serie: serie_guia,
                correlativo: cont,
                tipo_comprobante: tipos_guia,
                tipo_guia: this.tipo_guia,
                fecha_emision: Emision,
                fecha_traslado: translado,
                motivo: this.motivos_guia,
                cod_motivo: this.obten_codigo_motivo(this.motivos_guia),
                observacion: this.observacion,
                modo_transporte: this.modo_transporte,
                modo_transporte_desc: modo_transportes,
                ruc_transporte: this.ruc_transporte,
                razonsocial_transporte: this.razon_transporte,
                registro_mtc: this.registro_mtc,
                array_vehiculo: this.array_vehiculo,
                array_conductor: this.array_conductor,
                cod_documento_rem: this.obten_codigo_doc(this.documento),
                ruc_remitente: this.numero_doc,
                razonsocial_remitente: this.razon_social,
                u_origen: this.u_origen,
                dir_origen: this.dir_p.toUpperCase(),
                departamento_p: this.departamento_p.nombre,
                provincia_p: this.provincia_p.nombre,
                distrito_p: this.distrito_p.nombre,
                cod_documento: this.obten_codigo_doc(this.documento_dest),
                ruc_destinatario: this.ruc_destinatario,
                razonsocial_destinatario: this.razonsocial_destinatario,
                u_destino: this.u_destino,
                dir_destino: this.dir_l.toUpperCase(),
                departamento_l: this.departamento_l.nombre,
                provincia_l: this.provincia_l.nombre,
                distrito_l: this.distrito_l.nombre,
                medida_t: this.medida_t,
                cod_medida_t: this.obtencodigomedida(this.medida_t),
                peso_total: this.peso,
                nro_bultos: this.nro_bultos,
                medida_bultos: this.medida_bultos_final,
                data: this.lista_items,
                retorno_vacio: this.retorno_vacio,
                retorno_envaces: this.retorno_envaces,
                programado: this.programado,
                vehic_m1: this.vehic_m1,
                traslado_total: this.traslado_total,
                datos_transpor: this.datos_transpor,
                trans_sub: this.trans_sub,
                ruc_subcontrata: this.ruc_subcontrata,
                razon_subcontrata: this.razon_subcontrata,
                pagado_por: this.pagado_por,
                doc_relacionados: this.array_relacionados
            }
            await nuevaGuiaremision(array.id, array)

            // Guardar guia_id en el pedido si viene desde liquida_reparto
            if (this.id_grupo_pedido && this.numeracion_pedido) {
                await grabaCabecera_p(
                    this.id_grupo_pedido,
                    `${this.numeracion_pedido}/guia_id`,
                    array.id
                )
            }

            await this.guarda_empresa_t()
            guia_remision(array, array.data)
            if (this.tipo_guia == 'GUIA REMITENTE') {
                await sumaContador("orden_guia", (parseInt(array.correlativo) + 1).toString().padStart(5, 0))
                this.finaliza_(array)
            } else {
                await sumaContador("orden_guia_t", (parseInt(array.correlativo) + 1).toString().padStart(5, 0))
                this.finaliza_(array)
            }
        },
        obten_codigo_doc(val) {
            if (val == "DNI") {
                var doccliente = "1" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (val == "RUC") {
                var doccliente = "6" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (val == "Pasaporte") {
                var doccliente = "7" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            if (val == "Carnet de Extranjeria") {
                var doccliente = "4" // 6 ruc --4 carnet --7 pasaporte -- 1 DNI
            }
            return doccliente
        },
        async guarda_empresa_t() {
            if (this.ruc_transporte != '') {
                var array = {
                    id: this.ruc_transporte,
                    ruc: this.ruc_transporte,
                    razon_transporte: this.razon_transporte,
                    registro_mtc: this.registro_mtc
                }
                await nuevo_transporte(array.id, array)
            }
            if (this.ruc_destinatario != '') {
                var arra = {
                    id: this.ruc_destinatario,
                    documento: this.documento_dest,
                    ruc: this.ruc_destinatario,
                    razonsocial: this.razonsocial_destinatario,
                }
                await nuevo_tablas_transporte('destinatario', arra.id, arra)
            }
            if (this.numero_doc != '') {
                var arr = {
                    id: this.numero_doc,
                    documento: this.documento,
                    ruc: this.numero_doc,
                    razonsocial: this.razon_social,
                }
                await nuevo_tablas_transporte('remitente', arr.id, arr)
            }
            return true

        },
        async genera_pdf(modo) {
            store.commit("dialogoprogress")
            generaGuia(this.item_selecto, store.state.configImpresora.tamano)
            await new Promise(resolve => setTimeout(resolve, 1000))
            store.commit("dialogoprogress")
            if (modo != 'vista') {
                this.regresa()
            }
        },
        regresa() {
            if (this.id_grupo_pedido) {
                this.$router.push({
                    path: `/liquida_reparto/${this.id_grupo_pedido}`
                })
            } else {
                this.$router.push({
                    path: '/reporte_Guia'
                })
            }
        },
        conviertefecha_unix(date) {
            return moment(String(date)) / 1000
        },
        obten_codigo_motivo(nombre) {
            var array = store.state.motivosSunat_guia
            var nomenclatura = '01'
            for (var i = 0; i < array.length; i++) {
                if (array[i].nombre == nombre) {
                    nomenclatura = array[i].codigo
                }
            }
            return nomenclatura
        },
        obtencodigomedida(medida) {
            var array = store.state.medidassunat.find(item => item.nombre == medida)
            return array.corto
        },
        async Guardar_obs() {
            if (confirm('seguro de guardar??')) {
                store.commit("dialogoprogress")
                var array = {
                    uuid: this.create_UUID(),
                    observacion: this.observacion,
                }
                await nuevo_tablas_transporte('obs', array.uuid, array)
                store.commit("dialogoprogress")
            }

        },
        create_UUID() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid.substring(29);
        },
        agrega_obs(data) {
            this.observacion = data.observacion
            this.dial_observa = false
        },
        findDep(val) {
            if (!val) return null
            if (typeof val === 'object') return val
            return (this.arrayDepas || []).find(d =>
                String(d.nombre || '').toUpperCase() === String(val).toUpperCase()
                || d.ubigeo === val
                || d.ubigeo_sunat === val
            ) || null
        },

        findProv(depObj, val) {
            if (!depObj || !val) return null
            if (typeof val === 'object') return val
            const provs = provincia(depObj.ubigeo || depObj.ubigeo_sunat) || []
            return provs.find(p =>
                String(p.nombre || '').toUpperCase() === String(val).toUpperCase()
                || p.ubigeo === val
                || p.ubigeo_sunat === val
            ) || null
        },

        findDist(provObj, val) {
            if (!provObj || !val) return null
            if (typeof val === 'object') return val
            const dists = distrito(provObj.ubigeo || provObj.ubigeo_sunat) || []
            return dists.find(d =>
                String(d.nombre || '').toUpperCase() === String(val).toUpperCase()
                || d.ubigeo === val
                || d.ubigeo_sunat === val
            ) || null
        },
        volverASelect() {
            this.medida_bultos = 'CAJAS';
            this.medida_bultos_personalizada = '';
        },
    }
}
</script>
