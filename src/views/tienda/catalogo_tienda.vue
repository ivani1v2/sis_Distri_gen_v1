<template>
    <div class="tienda-page">
         <v-row v-if="mostrarAlertaSincronizada && tiendaSincronizada" dense class="mb-1 ">
            <v-col cols="12">
                <v-card class="sync-status-card rounded-xl" flat>
                    <v-card-text class="d-flex align-center py-3 px-4">
                        <div class="sync-status-icon mr-3">
                            <v-icon color="#15803d">mdi-check-decagram</v-icon>
                        </div>
                        <div>
                            <div class="sync-status-title">Toda la tienda esta sincronizada</div>
                            <div class="sync-status-copy">
                                No hay categorias, marcas, productos, promociones, grupos de precio ni configuracion pendientes de envio.
                            </div>
                        </div>
                        <v-spacer />
                        <v-btn icon small color="#15803d" @click="cerrarAlertaSincronizada">
                            <v-icon small>mdi-close</v-icon>
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row dense class="mb-1">
            <v-col cols="12">
                <v-card class="tienda-hero-compact rounded-xl overflow-hidden" flat>
                    <v-card-text class="pa-4">
                        <v-row dense align="center">
                            <v-col cols="12" md="7">
                                <div class="hero-link-shell">
                                    <div class="hero-link-label">Enlace público</div>

                                    <div class="d-flex align-center mt-1">
                                        <div class="hero-link-value text-truncate flex-grow-1 mr-2">
                                            {{ tiendaUrl }}
                                        </div>

                                        <v-btn icon small color="#1034a6" @click="copiarLinkTienda">
                                            <v-icon small>mdi-content-copy</v-icon>
                                        </v-btn>
                                    </div>
                                </div>
                            </v-col>

                            <v-col cols="12" md="5">
                                <div class="d-flex flex-wrap justify-md-end align-center">
                                    <v-btn color="#f59e0b" depressed rounded small class="mr-2 mb-2 white--text"
                                        @click="dial_config = !dial_config">
                                        <v-icon left>mdi-cog-outline</v-icon>
                                        Configuración
                                    </v-btn>

                                    <v-btn color="#0f766e" depressed rounded small class="mb-2 white--text"
                                        @click="sincronizar()">
                                        <v-icon left>mdi-sync</v-icon>
                                        Sincronizar
                                    </v-btn>
                                </div>

                                <div class=" text-caption text-md-right">
                                    Ultima sincronizacion: {{ ultimaSincronizacionTexto }}
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

       

        <!-- ====================== ACCESO A TIENDA (PRO) ====================== -->
        <v-card v-if="false" class="mb-3 rounded-lg tienda-banner" outlined>
            <v-card-text class="py-3 d-flex align-center flex-wrap">
                <v-avatar size="42" class="mr-3" color="primary" tile>
                    <v-icon dark>mdi-storefront</v-icon>
                </v-avatar>

                <div class="mr-4">
                    <div class="text-subtitle-1 font-weight-black">Visualizar mi tienda</div>
                    <div class="text-caption grey--text">
                        Revisa cómo la ven tus clientes en tiempo real.
                    </div>
                    <div class="text-caption font-weight-bold mt-1 primary--text">
                        https://tienda.domo.pe/
                    </div>
                </div>

                <v-spacer />

                <div class="d-flex align-center">
                    <v-btn color="primary" rounded depressed class="mr-2" @click="abrirTienda">
                        <v-icon left>mdi-open-in-new</v-icon>
                        Abrir tienda
                    </v-btn>

                    <v-btn icon color="grey darken-1" :title="'Copiar enlace'" @click="copiarLinkTienda">
                        <v-icon>mdi-content-copy</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <v-card v-if="false">

            <v-btn color="primary" rounded depressed @click="dial_config = !dial_config">
                <v-icon left>mdi-cog</v-icon> Configura
            </v-btn>
            <v-btn color="primary" rounded depressed @click="sincronizar">
                <v-icon left>mdi-cog</v-icon> sincroniza
            </v-btn>
        </v-card>
        <v-card elevation="0" class="rounded-xl tienda-workspace overflow-hidden">
            <div class="workspace-topbar">
                <div>
                    <div class="workspace-kicker">Gestion visual</div>
                    <div class="workspace-title">{{ tabActualInfo.label }}</div>
                    <div class="workspace-copy">{{ tabActualInfo.description }}</div>
                </div>

                <div class="workspace-pills">
                    <v-chip color="#eff6ff" text-color="#1d4ed8" class="font-weight-bold mr-2 mb-2" small>
                        {{ tabActualInfo.count }} visibles
                    </v-chip>
                </div>
            </div>

            <v-tabs v-model="tab" background-color="transparent" color="#1034a6" grow class="tienda-tabs px-2 px-md-4">
                <v-tab v-for="(item, i) in items" :key="i" class="font-weight-bold tienda-tab">
                    <v-icon left small>{{ getIcon(item) }}</v-icon>
                    <span>{{ item }}</span>
                    <span class="tab-counter">{{ tabsPresentacion[i].count }}</span>
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab" class="tienda-tabs-body pa-4 pa-md-6">
                <v-tab-item>
                    <dialogo-categorias modo="tab" :items="categorias" :placeholder-img="placeholderImg"
                        @agregar="abrirAgregar('categoria')" @editar="editarCategoria" @eliminar="eliminarCategoria"
                        @select-image="seleccionarFotoDesdeLista($event, 'categoria')"
                        @reordenar="reordenarCategorias" />
                </v-tab-item>

                <v-tab-item>
                    <dialogo-marca modo="tab" :items="marcas" :placeholder-img="placeholderImg"
                        @agregar="abrirAgregar('marca')" @editar="editarMarca" @eliminar="eliminarMarca"
                        @select-image="seleccionarFotoDesdeLista($event, 'marca')" @reordenar="reordenarMarcas" />
                </v-tab-item>

                <v-tab-item>
                    <dialogo-productos modo="tab" :items="productos" :placeholder-img="placeholderImg"
                        @agregar="abrirAgregar('producto')" @editar="editarProducto" @eliminar="eliminarProducto"
                        @select-image="seleccionarFotoDesdeLista($event, 'producto')" @reordenar="reordenarProductos" />
                </v-tab-item>

                <v-tab-item>
                    <dialogo-promociones modo="tab" :items="promociones" :placeholder-img="placeholderImg"
                        :array-productos="arrayProductos" :array-marca="array_marca"
                        @agregar="abrirAgregar('promocion')" @editar="editarPromocion" @eliminar="eliminarPromocion"
                        @select-image="seleccionarFotoDesdeLista($event, 'promocion')"
                        @reordenar="reordenarPromociones" />
                </v-tab-item>

                <v-tab-item>
                    <dialogo-grupo-precio modo="tab" :items="gruposPrecio" :array-productos="arrayProductos"
                        @agregar="abrirAgregar('grupo_precio')" @editar="editarGrupoPrecio"
                        @eliminar="eliminarGrupoPrecio" @reordenar="reordenarGruposPrecio" />
                </v-tab-item>
                <!-- ====================== MARCAS ====================== -->
                <v-tab-item v-if="false">
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Categorías</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('categoria')">
                                <v-icon left>mdi-plus</v-icon> Nueva Categoría
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!categorias.length" type="info" dense text>
                            No hay categorías registradas.
                        </v-alert>

                        <draggable v-model="categorias" :animation="200" handle=".drag-handle"
                            @end="alSoltarDragCategorias" tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in categorias" :key="item.id" class="pa-2" style="width: 200px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorCategoria(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="editarCategoria(item)">
                                                        <v-icon color="warning" small>mdi-pencil</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('categoria', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                    </v-card-text>

                                    <input :ref="'file_categoria_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'categoria', item.id)" />
                                </v-card>
                            </div>
                        </draggable>
                    </v-card>
                </v-tab-item>
                <v-tab-item v-if="false">
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Marcas</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('marca')">
                                <v-icon left>mdi-plus</v-icon> Nueva Marca
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!marcas.length" type="info" dense text>
                            No hay marcas registradas.
                        </v-alert>


                        <draggable v-model="marcas" :animation="200" handle=".drag-handle" @end="alSoltarDragMarcas"
                            tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in marcas" :key="item.id" class="pa-2" style="width: 200px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorMarca(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="editarMarca(item)">
                                                        <v-icon color="warning" small>mdi-pencil</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('marca', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                    </v-card-text>

                                    <input :ref="'file_marca_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'marca', item.id)" />
                                </v-card>
                            </div>
                        </draggable>



                    </v-card>
                </v-tab-item>
                <!-- ====================== CATEGORIAS ====================== -->

                <!-- ====================== PRODUCTOS ====================== -->
                <v-tab-item v-if="false">
                    <v-card flat color="transparent">
                        <v-card-title class="px-0 pb-4 d-flex align-center">
                            <div class="text-h5 font-weight-black">Productos</div>
                            <v-spacer />
                            <v-btn color="primary" rounded depressed @click="abrirAgregar('producto')">
                                <v-icon left>mdi-plus</v-icon> Nuevo Producto
                            </v-btn>
                        </v-card-title>

                        <v-alert v-if="!productos.length" type="info" dense text>
                            No hay productos registrados.
                        </v-alert>

                        <draggable v-model="productos" :animation="200" handle=".drag-handle"
                            @end="alSoltarDragProductos" tag="div" class="d-flex flex-wrap">
                            <div v-for="(item, index) in productos" :key="item.id" class="pa-2" style="width: 220px;">
                                <v-card class="rounded-xl overflow-hidden" outlined>
                                    <v-hover v-slot="{ hover }">
                                        <div style="position: relative;">
                                            <v-img :src="item.fotoUrl || placeholderImg"
                                                :lazy-src="item.thumbB64 || placeholderImg" height="180"
                                                class="grey lighten-4" />

                                            <v-fade-transition>
                                                <div v-if="hover" class="d-flex align-center justify-center"
                                                    style="position:absolute; inset:0; background: rgba(0,0,0,0.4); z-index: 2;">
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="abrirSelectorProducto(item.id)">
                                                        <v-icon color="primary" small>mdi-camera</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1 drag-handle">
                                                        <v-icon color="grey darken-2" small>mdi-drag</v-icon>
                                                    </v-btn>
                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="editarProducto(item)">
                                                        <v-icon color="warning" small>mdi-pencil</v-icon>
                                                    </v-btn>

                                                    <v-btn fab x-small color="white" class="ma-1"
                                                        @click="eliminarItem('producto', item.id)">
                                                        <v-icon color="red" small>mdi-delete</v-icon>
                                                    </v-btn>
                                                </div>
                                            </v-fade-transition>

                                            <div class="pa-2" style="position:absolute; left:0; top:0; z-index: 1;">
                                                <v-chip x-small color="rgba(0,0,0,0.5)" dark>
                                                    #{{ item.orden || (index + 1) }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-hover>

                                    <v-card-text class="pa-2 text-center">
                                        <div class="text-caption font-weight-bold text-truncate black--text">
                                            {{ item.nombre }}
                                        </div>
                                        <div class="text-caption grey--text">
                                            S/ {{ Number(item.precio || 0).toFixed(2) }}
                                        </div>
                                        <div class="text-caption grey--text text-truncate">
                                            {{ item.marca || 'Sin marca' }} • {{ item.categoria || 'Sin categoría' }}
                                        </div>

                                    </v-card-text>

                                    <input :ref="'file_producto_' + item.id" type="file" accept="image/*"
                                        style="display:none" @change="seleccionarFoto($event, 'producto', item.id)" />
                                </v-card>
                            </div>
                        </draggable>
                    </v-card>
                </v-tab-item>

                <!-- (Luego puedes copiar el mismo patrón para categorias y productos) -->
            </v-tabs-items>
        </v-card>

        <!-- ====================== DIALOGO ====================== -->
        <v-dialog v-model="dlgAdd" max-width="900" scrollable transition="dialog-bottom-transition">
            <v-card class="rounded-xl tienda-dialog-card">
                <v-toolbar flat color="white" class="px-2 tienda-dialog-toolbar">
                    <v-btn icon @click="cerrarDialogo"><v-icon>mdi-close</v-icon></v-btn>
                    <v-toolbar-title class="font-weight-black">{{ tituloDialogo }}</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="pt-6 tienda-dialog-body">
                    <div v-if="tipoDialogo !== 'grupo_precio'" class="text-center mb-6 dialog-media-panel">
                        <v-hover v-slot="{ hover }">
                            <v-avatar size="120" color="grey lighten-4" class="elevation-2 dialog-media-avatar">
                                <v-img :src="imagenPrincipalDialogo">
                                    <v-fade-transition>
                                        <div v-if="hover" class="d-flex align-center justify-center"
                                            style="height:100%; background: rgba(0,0,0,0.3); cursor:pointer"
                                            @click="$refs.fileCreate.click()">
                                            <v-icon color="white">mdi-camera-plus</v-icon>
                                        </div>
                                    </v-fade-transition>
                                </v-img>
                            </v-avatar>
                        </v-hover>
                        <div v-if="['producto', 'promocion'].includes(tipoDialogo) && imagenesDialogo.length"
                            class="d-flex justify-center flex-wrap mt-3">
                            <div v-for="(imagen, index) in imagenesDialogo"
                                :key="`${imagen.rutaStorage || 'nuevo'}_${index}`" class="mx-1 my-1">
                                <v-avatar size="56" tile class="rounded-lg elevation-1">
                                    <v-img
                                        :src="imagen.preview || imagen.fotoUrl || imagen.thumbB64 || placeholderImg" />
                                </v-avatar>
                            </div>
                        </div>
                        <div class="mt-2 text-caption grey--text">
                            {{ ['producto', 'promocion'].includes(tipoDialogo) ? 'Sube una o varias fotos' : 'Sube una foto clara' }}
                        </div>
                        <input ref="fileCreate" type="file" accept="image/*" style="display:none"
                            :multiple="['producto', 'promocion'].includes(tipoDialogo)"
                            @change="seleccionarFotoDialogo" />
                    </div>

                    <dialogo-marca v-if="tipoDialogo === 'marca'" v-model="formMarca" :items="array_marca"
                        :categorias="arraycategoria" />

                    <dialogo-categorias v-if="tipoDialogo === 'categoria'" v-model="formCategoria"
                        :items="arraycategoria" />

                    <dialogo-productos v-if="tipoDialogo === 'producto'" v-model="formProducto"
                        :array-productos="arrayProductos" :array-marca="array_marca" :array-categoria="arraycategoria"
                        :items-medidas-nombre="itemsMedidasNombre" :arraytipo-producto="arraytipoProducto"
                        :array-operacion="arrayOperacion" :producto-sel-id="productoSelId" :mostrar-catalogo="!editMode"
                        @select-catalogo="onSelectProductoCatalogo" />

                    <dialogo-promociones v-if="tipoDialogo === 'promocion'" v-model="formPromocion"
                        :array-productos="arrayProductos" :array-marca="array_marca" />

                    <dialogo-grupo-precio v-if="tipoDialogo === 'grupo_precio'" v-model="formGrupoPrecio"
                        :array-productos="arrayProductos" />

                    <v-autocomplete v-if="false && tipoDialogo === 'marca'" v-model="formMarca.nombre"
                        :items="array_marca" label="Marca" outlined rounded dense clearable hide-details
                        :search-input.sync="searchMarca" />

                    <v-autocomplete v-if="false && tipoDialogo === 'categoria'" v-model="formCategoria.nombre"
                        :items="arraycategoria" label="Categoría" outlined rounded dense clearable hide-details
                        :search-input.sync="searchCategoria" />


                    <template v-if="false && tipoDialogo === 'producto'">
                        <v-autocomplete v-model="productoSelId" :items="arrayProductos" item-text="nombre"
                            item-value="id" label="Buscar producto (catálogo)" outlined rounded dense clearable
                            :search-input.sync="searchProducto" @change="onSelectProductoCatalogo" />

                        <v-text-field class="mt-6" v-model="formProducto.nombre" label="Nombre del producto" outlined
                            rounded dense />

                        <v-text-field class="mt-n3" v-model.number="formProducto.precio" label="Precio" type="number"
                            min="0" step="0.01" outlined rounded dense />
                        <v-autocomplete class="mt-n3" v-model="formProducto.marca" :items="array_marca" label="Marca"
                            outlined rounded dense clearable />

                        <v-autocomplete class="mt-n3" v-model="formProducto.categoria" :items="arraycategoria"
                            label="Categoría" outlined rounded dense clearable />


                        <v-row dense class="mt-1">
                            <v-col cols="12" md="6">
                                <v-text-field v-model="formProducto.codbarra" label="CÃ³digo de barras" outlined rounded
                                    dense />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-autocomplete v-model="formProducto.medida" :items="itemsMedidasNombre" label="Medida"
                                    outlined rounded dense clearable />
                            </v-col>
                        </v-row>

                        <v-row dense class="mt-n3">
                            <v-col cols="12" md="6">
                                <v-select v-model="formProducto.tipoproducto" :items="arraytipoProducto"
                                    label="Tipo de producto" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="formProducto.operacion" :items="arrayOperacion" label="OperaciÃ³n"
                                    outlined rounded dense />
                            </v-col>
                        </v-row>

                        <v-row dense class="mt-n3">
                            <v-col cols="12" md="3">
                                <v-text-field v-model.number="formProducto.costo" label="Costo" type="number" min="0"
                                    step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-text-field v-model.number="formProducto.stock" label="Stock" type="number" min="0"
                                    step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-text-field v-model.number="formProducto.peso" label="Peso" type="number" min="0"
                                    step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-text-field v-model.number="formProducto.factor" label="Factor" type="number" min="0"
                                    step="0.01" outlined rounded dense />
                            </v-col>
                        </v-row>

                        <v-row dense class="mt-n3">
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.margen" label="Margen" type="number" min="0"
                                    step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.precio_may1" label="Precio mayoreo 1"
                                    type="number" min="0" step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.escala_may1" label="Escala mayoreo 1"
                                    type="number" min="0" step="1" outlined rounded dense />
                            </v-col>
                        </v-row>

                        <v-row dense class="mt-n3">
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.precio_may2" label="Precio mayoreo 2"
                                    type="number" min="0" step="0.01" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.escala_may2" label="Escala mayoreo 2"
                                    type="number" min="0" step="1" outlined rounded dense />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model.number="formProducto.editado" label="Editado" type="number"
                                    min="0" step="1" outlined rounded dense />
                            </v-col>
                        </v-row>

                        <v-row dense class="mt-n1">
                            <v-col cols="12" md="3">
                                <v-switch v-model="formProducto.activo" inset dense label="Activo" />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-switch v-model="formProducto.controstock" inset dense label="Controla stock" />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-switch v-model="formProducto.icbper" inset dense label="ICBPER" />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-switch v-model="formProducto.tiene_bono" inset dense label="Tiene bono" />
                            </v-col>
                        </v-row>
                    </template>

                </v-card-text>

                <v-card-actions class="pa-4 pt-0">
                    <v-btn block x-large color="#1034a6" rounded depressed class="tienda-save-btn"
                        :disabled="deshabilitarGuardar" @click="guardarItem">
                        Confirmar y Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <dial_config v-if="dial_config" @cerrar="dial_config = false" @guardado="escucharTodo"
            @sincronizar-todo="sincronizar(true)" />

        <dial_crop ref="dlgCrop" @confirmado="onCropConfirmado" @cerrar="onCropCerrado" />

    </div>
</template>

<script>
import firebase from "firebase/app"
import "firebase/database"
import "firebase/storage"
import { obten_datos_tienda, guarda_datos_tienda, elimina_datos_tienda, allCategorias } from "../../db"
import { generarMiniaturaBase64, convertirADataUrl } from "./helpers"
import store from "@/store"
import draggable from "vuedraggable"
import dial_config from "./dialogos/config_tienda.vue"
import dial_crop from "./dialogos/dial_foto.vue"
import DialogoMarca from "./dialogos/marca.vue"
import DialogoCategorias from "./dialogos/categorias.vue"
import DialogoProductos from "./dialogos/productos.vue"
import DialogoPromociones from "./dialogos/promociones.vue"
import DialogoGrupoPrecio from "./dialogos/grupo_precio.vue"
import axios from "axios";

export default {
    name: "caja",
    props: { dial_activo: "" },
    components: { draggable, dial_config, dial_crop, DialogoMarca, DialogoCategorias, DialogoProductos, DialogoPromociones, DialogoGrupoPrecio },
    data() {
        return {
            dial_config: false,
            tab: 0,
            items: ["CATEGORIAS", "MARCAS", "PRODUCTOS", "PROMOCIONES", "GRUPO PRECIO"],

            marcas: [],
            categorias: [],
            productos: [],
            promociones: [],
            gruposPrecio: [],
            configTienda: {
                pedido_minimo: 0,
                telefono_whatsapp: "",
                comprobantes_permitidos: ["B", "F", "T"],
                ultima_sincronizacion: 0,
                updatedAt: 0,
            },
            mostrarAlertaSincronizada: true,

            bd: store.state.baseDatos.bd,

            dlgAdd: false,
            tipoDialogo: "",

            formMarca: { nombre: "", categoria: "" },
            formCategoria: { nombre: "" },
            formPromocion: {
                nombre: "",
                codigosProductos: [],
                marcasRelacionadas: [],
            },
            formGrupoPrecio: {
                nombre: "",
                escala_may1: 0,
                escala_may2: 0,
                codigosAceptados: [],
            },
            formProducto: {
                nombre: "",
                precio: 0,
                marca: "",
                categoria: "",
                codbarra: "",
                costo: 0,
                stock: 0,
                peso: 0,
                factor: 1,
                medida: "UNIDAD",
                operacion: "EXONERADA",
                tipoproducto: "BIEN",
                activo: true,
                controstock: true,
                nuevo_ingreso: false,
                icbper: false,
                tiene_bono: false,
                margen: 0,
                precio_may1: 0,
                precio_may2: 0,
                escala_may1: 0,
                escala_may2: 0,
                editado: 0,
                idCatalogo: "",
            },



            previewDialogo: "",
            archivoDialogo: null,
            imagenesDialogo: [],
            editMode: false,
            editId: "",
            placeholderImg:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
          <rect width='100%' height='100%' fill='#f2f2f2'/>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#999' font-family='Arial' font-size='16'>
            Sin foto
          </text>
        </svg>`),
            arraycategoria: [],
            array_marca: [],
            arrayProductos: [],
            arraytipoProducto: ["BIEN", "SERVICIO"],
            arrayOperacion: ["GRAVADA", "EXONERADA", "INAFECTA"],
            searchMarca: null,
            searchCategoria: null,
            searchProducto: null,

            productoSelId: null,          // id del producto seleccionado del catálogo
            productoSelObj: null,         // objeto completo
        }

    },
    computed: {
        tiendaUrl() {
            return "https://tienda.domo.pe/"
        },
        ultimaSincronizacionTexto() {
            const ts = Number(this.configTienda?.ultima_sincronizacion || 0)
            if (!ts) return "Sin registro"

            try {
                return new Intl.DateTimeFormat("es-PE", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(new Date(ts))
            } catch (e) {
                return new Date(ts).toLocaleString()
            }
        },
        itemsMedidasNombre() {
            const arr = this.$store.state.medidassunat || []
            return arr.map(m => String(m.nombre || "").toUpperCase()).filter(Boolean)
        },
        tabsPresentacion() {
            const descripcion = {
                CATEGORIAS: "Ordena la entrada visual de la tienda para que el cliente navegue rapido.",
                MARCAS: "Agrupa productos por identidad comercial y mejora la recordacion.",
                PRODUCTOS: "Ajusta precios, fotos y estado de los articulos visibles.",
                PROMOCIONES: "Crea banners de venta con productos y marcas relacionadas.",
                "GRUPO PRECIO": "Define familias de codigos para descuentos por volumen.",
            }

            return this.items.map(item => ({
                label: item,
                description: descripcion[item] || "Gestiona el contenido de la tienda.",
                count:
                    item === "CATEGORIAS" ? this.categorias.length :
                        item === "MARCAS" ? this.marcas.length :
                            item === "PRODUCTOS" ? this.productos.length :
                                item === "PROMOCIONES" ? this.promociones.length :
                                    item === "GRUPO PRECIO" ? this.gruposPrecio.length : 0,
            }))
        },
        tabActualInfo() {
            return this.tabsPresentacion[this.tab] || {
                label: "Panel",
                description: "Gestiona el contenido de la tienda.",
                count: 0,
            }
        },
        totalPendientesSincronizacion() {
            const ultimaSincronizacion = Number(this.configTienda?.ultima_sincronizacion || 0)
            const contarPendientes = (items = []) => {
                const arr = Array.isArray(items) ? items : []
                if (!ultimaSincronizacion) return arr.length
                return arr.filter(item => Number(item?.updatedAt || 0) > ultimaSincronizacion).length
            }

            const configPendiente = !ultimaSincronizacion || Number(this.configTienda?.updatedAt || 0) > ultimaSincronizacion ? 1 : 0

            return (
                contarPendientes(this.categorias) +
                contarPendientes(this.marcas) +
                contarPendientes(this.productos) +
                contarPendientes(this.promociones) +
                contarPendientes(this.gruposPrecio) +
                configPendiente
            )
        },
        tiendaSincronizada() {
            return this.totalPendientesSincronizacion === 0
        },
        tituloDialogo() {
            if (this.tipoDialogo === "marca") return "Agregar Marca"
            if (this.tipoDialogo === "categoria") return "Agregar Categoría"
            if (this.tipoDialogo === "producto") return this.editMode ? "Editar Producto" : "Agregar Producto"
            if (this.tipoDialogo === "promocion") return this.editMode ? "Editar Promocion" : "Agregar Promocion"
            if (this.tipoDialogo === "grupo_precio") return this.editMode ? "Editar Grupo Precio" : "Agregar Grupo Precio"
            return "Agregar"
        },

        deshabilitarGuardar() {
            if (this.tipoDialogo === "marca") return !this.formMarca.nombre.trim() || !this.formMarca.categoria
            if (this.tipoDialogo === "categoria") return !this.formCategoria.nombre.trim()
            if (this.tipoDialogo === "promocion")
                return (
                    !this.formPromocion.nombre.trim() ||
                    !(this.formPromocion.codigosProductos || []).length ||
                    !(this.formPromocion.marcasRelacionadas || []).length
                )
            if (this.tipoDialogo === "grupo_precio")
                return (
                    !this.formGrupoPrecio.nombre.trim() ||
                    !(this.formGrupoPrecio.codigosAceptados || []).length
                )
            if (this.tipoDialogo === "producto")
                return (
                    (!this.editMode && !this.formProducto.idCatalogo) ||
                    !this.formProducto.nombre.trim() ||
                    !(Number(this.formProducto.precio) > 0) ||
                    !this.formProducto.categoria ||
                    !this.formProducto.marca
                )


            return true
        },
        imagenPrincipalDialogo() {
            if (!["producto", "promocion"].includes(this.tipoDialogo)) return this.previewDialogo || this.placeholderImg

            const principal = (this.imagenesDialogo || [])[0] || {}
            return principal.preview || principal.fotoUrl || principal.thumbB64 || this.placeholderImg
        },
    },
    watch: {
        tiendaSincronizada(nuevoValor, valorAnterior) {
            if (nuevoValor && !valorAnterior) {
                this.mostrarAlertaSincronizada = true
            }
        },
    },
    mounted() {
        this.escucharTodo()
    },
    async created() {
        var snapshot = await allCategorias("categorias").once("value")
        snapshot.forEach((item) => {
            this.arraycategoria.push(item.val().nombre)
        })
        var snapshot = await allCategorias("marcas").once("value")
        snapshot.forEach((item) => {
            this.array_marca.push(item.val().nombre)
        })
        this.arrayProductos = store.state.productos

    },
    methods: {
        async sincronizar(forzarTodo = false) {
            const enviarTodo = typeof forzarTodo === "boolean" ? forzarTodo : false
            const bd = this.bd || store.state.baseDatos.bd
            const productosStore = this.arrayProductos || store.state.productos || []
            const ultimaSincronizacion = Number(this.configTienda?.ultima_sincronizacion || 0)
            const filtrarActualizados = (items = []) => {
                const arr = Array.isArray(items) ? items : []
                if (enviarTodo || !ultimaSincronizacion) return arr
                return arr.filter(item => Number(item?.updatedAt || 0) > ultimaSincronizacion)
            }

            const productosJson = filtrarActualizados(this.productos).map((item) => {
                const idStore = item.idCatalogo || item.id
                const productoStore = (productosStore || []).find(prod => String(prod.id) === String(idStore)) || {}

                return {
                    id: item.id || "",
                    nombre: item.nombre || "",
                    precio: Number(item.precio || 0),
                    marca: item.marca || "",
                    categoria: item.categoria || "",
                    medida: item.medida || "UNIDAD",
                    factor: Number(productoStore.factor || 0),
                    precio_may1: Number(item.precio_may1 || 0),
                    precio_may2: Number(item.precio_may2 || 0),
                    escala_may1: Number(item.escala_may1 || 0),
                    escala_may2: Number(item.escala_may2 || 0),
                    activo: !!item.activo,
                    controstock: !!item.controstock,
                    nuevo_ingreso: !!item.nuevo_ingreso,
                    imagenes: this.normalizarImagenesProducto(item),
                    updatedAt: Number(item.updatedAt || 0),
                }
            })

            const categoriasJson = filtrarActualizados(this.categorias).map(item => ({
                id: item.id || "",
                nombre: item.nombre || "",
                fotoUrl: item.fotoUrl || "",
                thumbB64: item.thumbB64 || "",
                updatedAt: Number(item.updatedAt || 0),
            }))

            const marcasJson = filtrarActualizados(this.marcas).map(item => ({
                id: item.id || "",
                nombre: item.nombre || "",
                categoria: item.categoria || "",
                fotoUrl: item.fotoUrl || "",
                thumbB64: item.thumbB64 || "",
                updatedAt: Number(item.updatedAt || 0),
            }))

            const promocionesJson = filtrarActualizados(this.promociones).map(item => ({
                id: item.id || "",
                nombre: item.nombre || "",
                codigosProductos: Array.isArray(item.codigosProductos) ? item.codigosProductos.map(x => String(x)) : [],
                marcasRelacionadas: Array.isArray(item.marcasRelacionadas) ? item.marcasRelacionadas.filter(Boolean) : [],
                imagenes: this.normalizarImagenesPromocion(item),
                updatedAt: Number(item.updatedAt || 0),
            }))

            const gruposPrecioJson = filtrarActualizados(this.gruposPrecio).map(item => ({
                id: item.id || "",
                nombre: item.nombre || "",
                escala_may1: Number(item.escala_may1 || 0),
                escala_may2: Number(item.escala_may2 || 0),
                codigosAceptados: Array.isArray(item.codigosAceptados) ? item.codigosAceptados.map(x => String(x)) : [],
                updatedAt: Number(item.updatedAt || 0),
            }))

            const configuracionActualizada = enviarTodo || !ultimaSincronizacion || Number(this.configTienda?.updatedAt || 0) > ultimaSincronizacion
            const configuracionJson = configuracionActualizada
                ? {
                    pedido_minimo: Number(this.configTienda?.pedido_minimo || 0),
                    telefono_whatsapp: String(this.configTienda?.telefono_whatsapp || "").trim(),
                    comprobantes_permitidos: Array.isArray(this.configTienda?.comprobantes_permitidos)
                        ? this.configTienda.comprobantes_permitidos.filter(Boolean)
                        : [],
                    updatedAt: Number(this.configTienda?.updatedAt || 0),
                }
                : null

            const totalCambios =
                productosJson.length +
                categoriasJson.length +
                marcasJson.length +
                promocionesJson.length +
                gruposPrecioJson.length +
                (configuracionJson ? 1 : 0)

            if (!bd || !totalCambios) {
                if (this.$toast) this.$toast.info("No hay cambios pendientes para sincronizar")
                return
            }

            try {
                store.commit("dialogoprogress")

                const response = await axios.post(
                    "https://us-central1-domo-tienda.cloudfunctions.net/back_tienda",
                    //"http://localhost:5001/domo-tienda/us-central1/back_tienda",
                    {
                        bd: String(bd),
                        metodo: "sincroniza_productos",
                        data: productosJson,
                        payload_nodos: {
                            productos: productosJson,
                            categorias: categoriasJson,
                            marcas: marcasJson,
                            promociones: promocionesJson,
                            grupos_precio: gruposPrecioJson,
                            configuracion: configuracionJson,
                        },
                        ultima_sincronizacion: ultimaSincronizacion,
                        sincronizacion_completa: enviarTodo,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )

                const nuevaUltimaSincronizacion = Date.now()
                await obten_datos_tienda("configuracion").update({
                    ultima_sincronizacion: nuevaUltimaSincronizacion,
                })
                this.configTienda = {
                    ...this.configTienda,
                    ultima_sincronizacion: nuevaUltimaSincronizacion,
                }

                console.log("Datos sincronizados:", response.data)
            } catch (error) {
                console.error("Error sincronizando tienda:", error?.response?.data || error.message || error)
            } finally {
                store.commit("dialogoprogress")
            }
        },
        crearFormProductoBase() {
            return {
                nombre: "",
                precio: 0,
                marca: "",
                categoria: "",
                medida: "UNIDAD",
                activo: true,
                controstock: true,
                nuevo_ingreso: false,
                precio_may1: 0,
                precio_may2: 0,
                escala_may1: 0,
                escala_may2: 0,
                idCatalogo: "",
            }
        },
        crearFormPromocionBase() {
            return {
                nombre: "",
                codigosProductos: [],
                marcasRelacionadas: [],
            }
        },
        crearFormGrupoPrecioBase() {
            return {
                nombre: "",
                escala_may1: 0,
                escala_may2: 0,
                codigosAceptados: [],
            }
        },
        mapearGrupoPrecioAFormulario(grupo = {}) {
            const base = this.crearFormGrupoPrecioBase()
            return {
                ...base,
                ...grupo,
                nombre: grupo.nombre || base.nombre,
                escala_may1: Number(grupo.escala_may1 || base.escala_may1),
                escala_may2: Number(grupo.escala_may2 || base.escala_may2),
                codigosAceptados: Array.isArray(grupo.codigosAceptados)
                    ? grupo.codigosAceptados.map(item => String(item))
                    : base.codigosAceptados,
            }
        },
        mapearPromocionAFormulario(promocion = {}) {
            const base = this.crearFormPromocionBase()
            return {
                ...base,
                ...promocion,
                nombre: promocion.nombre || base.nombre,
                codigosProductos: Array.isArray(promocion.codigosProductos)
                    ? promocion.codigosProductos.map(item => String(item))
                    : base.codigosProductos,
                marcasRelacionadas: Array.isArray(promocion.marcasRelacionadas)
                    ? promocion.marcasRelacionadas.filter(Boolean)
                    : base.marcasRelacionadas,
            }
        },

        mapearProductoAFormulario(producto = {}) {
            const base = this.crearFormProductoBase()
            return {
                ...base,
                ...producto,
                nombre: producto.nombre || base.nombre,
                precio: Number(producto.precio || base.precio),
                marca: typeof producto.marca === "string" ? producto.marca : base.marca,
                categoria: producto.categoria || base.categoria,
                medida: producto.medida || base.medida,
                activo: producto.activo !== undefined ? !!producto.activo : base.activo,
                controstock: producto.controstock !== undefined ? !!producto.controstock : base.controstock,
                nuevo_ingreso: producto.nuevo_ingreso !== undefined ? !!producto.nuevo_ingreso : base.nuevo_ingreso,
                precio_may1: Number(producto.precio_may1 || base.precio_may1),
                precio_may2: Number(producto.precio_may2 || base.precio_may2),
                escala_may1: Number(producto.escala_may1 || base.escala_may1),
                escala_may2: Number(producto.escala_may2 || base.escala_may2),
                idCatalogo: producto.idCatalogo || base.idCatalogo,
            }
        },
        normalizarImagenProducto(imagen = {}, index = 0) {
            return {
                fotoUrl: imagen.fotoUrl || "",
                thumbB64: imagen.thumbB64 || "",
                rutaStorage: imagen.rutaStorage || "",
                orden: Number(imagen.orden || index + 1),
            }
        },
        normalizarImagenesProducto(producto = {}) {
            if (Array.isArray(producto?.imagenes) && producto.imagenes.length) {
                return producto.imagenes
                    .map((imagen, index) => this.normalizarImagenProducto(imagen, index))
                    .filter(imagen => imagen.fotoUrl || imagen.thumbB64 || imagen.rutaStorage)
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                    .map((imagen, index) => ({
                        ...imagen,
                        orden: index + 1,
                    }))
            }

            if (producto?.fotoUrl || producto?.thumbB64 || producto?.rutaStorage) {
                return [this.normalizarImagenProducto(producto, 0)]
            }

            return []
        },
        normalizarImagenesPromocion(promocion = {}) {
            if (Array.isArray(promocion?.imagenes) && promocion.imagenes.length) {
                return promocion.imagenes
                    .map((imagen, index) => this.normalizarImagenProducto(imagen, index))
                    .filter(imagen => imagen.fotoUrl || imagen.thumbB64 || imagen.rutaStorage)
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                    .map((imagen, index) => ({
                        ...imagen,
                        orden: index + 1,
                    }))
            }

            if (promocion?.fotoUrl || promocion?.thumbB64 || promocion?.rutaStorage) {
                return [this.normalizarImagenProducto(promocion, 0)]
            }

            return []
        },
        normalizarProductoEnMemoria(producto = {}) {
            const { fotoUrl, thumbB64, rutaStorage, ...resto } = producto || {}
            return {
                ...resto,
                imagenes: this.normalizarImagenesProducto(producto),
            }
        },
        normalizarPromocionEnMemoria(promocion = {}) {
            const { fotoUrl, thumbB64, rutaStorage, ...resto } = promocion || {}
            return {
                ...resto,
                imagenes: this.normalizarImagenesPromocion(promocion),
                codigosProductos: Array.isArray(promocion?.codigosProductos)
                    ? promocion.codigosProductos.map(item => String(item))
                    : [],
                marcasRelacionadas: Array.isArray(promocion?.marcasRelacionadas)
                    ? promocion.marcasRelacionadas.filter(Boolean)
                    : [],
            }
        },
        cargarImagenesDialogoProducto(producto = {}) {
            this.imagenesDialogo = this.normalizarImagenesProducto(producto).map((imagen, index) => ({
                ...imagen,
                preview: imagen.fotoUrl || imagen.thumbB64 || "",
                esNueva: false,
                orden: index + 1,
            }))
        },
        cargarImagenesDialogoPromocion(promocion = {}) {
            this.imagenesDialogo = this.normalizarImagenesPromocion(promocion).map((imagen, index) => ({
                ...imagen,
                preview: imagen.fotoUrl || imagen.thumbB64 || "",
                esNueva: false,
                orden: index + 1,
            }))
        },
        async agregarArchivosDialogoProducto(files = []) {
            const lista = Array.isArray(files) ? files.filter(Boolean) : []
            if (!lista.length) return

            const nuevos = await Promise.all(
                lista.map(async (file) => {
                    const preview = await convertirADataUrl(file)
                    return {
                        file,
                        preview,
                        fotoUrl: "",
                        thumbB64: preview,
                        rutaStorage: "",
                        esNueva: true,
                    }
                })
            )

            this.imagenesDialogo = [...this.imagenesDialogo, ...nuevos].map((imagen, index) => ({
                ...imagen,
                orden: index + 1,
            }))
        },
        async construirImagenesProductoDesdeDialogo(id, tipoStorage = "producto") {
            const imagenes = []

            for (const imagen of this.imagenesDialogo || []) {
                if (imagen?.esNueva && imagen.file) {
                    const thumbB64 = await generarMiniaturaBase64(imagen.file, 220, 0.65)
                    const { url, rutaStorage } = await this.subirImagenStorage(imagen.file, tipoStorage, id)

                    imagenes.push({
                        fotoUrl: url,
                        thumbB64,
                        rutaStorage,
                    })
                    continue
                }

                if (imagen?.fotoUrl || imagen?.thumbB64 || imagen?.rutaStorage) {
                    imagenes.push(this.normalizarImagenProducto(imagen, imagenes.length))
                }
            }

            return imagenes.map((imagen, index) => ({
                ...imagen,
                orden: index + 1,
            }))
        },
        construirItemPromocion({ id, nombre, orden, actual = {} }) {
            return {
                id,
                nombre,
                orden,
                updatedAt: Date.now(),
                codigosProductos: Array.isArray(this.formPromocion.codigosProductos)
                    ? this.formPromocion.codigosProductos.map(item => String(item))
                    : [],
                marcasRelacionadas: Array.isArray(this.formPromocion.marcasRelacionadas)
                    ? this.formPromocion.marcasRelacionadas.filter(Boolean)
                    : [],
                imagenes: this.normalizarImagenesPromocion(actual),
            }
        },
        construirItemGrupoPrecio({ id, nombre, orden, actual = {} }) {
            return {
                ...actual,
                id,
                nombre,
                orden,
                updatedAt: Date.now(),
                escala_may1: Number(this.formGrupoPrecio.escala_may1 || 0),
                escala_may2: Number(this.formGrupoPrecio.escala_may2 || 0),
                codigosAceptados: Array.isArray(this.formGrupoPrecio.codigosAceptados)
                    ? this.formGrupoPrecio.codigosAceptados.map(item => String(item))
                    : [],
            }
        },

        construirItemProducto({ id, nombre, orden, actual = {} }) {
            return {
                id,
                nombre,
                orden,
                updatedAt: Date.now(),
                imagenes: this.normalizarImagenesProducto(actual),
                precio: Number(this.formProducto.precio || 0),
                marca: this.formProducto.marca || "",
                categoria: this.formProducto.categoria || "",
                medida: this.formProducto.medida || "UNIDAD",
                precio_may1: Number(this.formProducto.precio_may1 || 0),
                precio_may2: Number(this.formProducto.precio_may2 || 0),
                escala_may1: Number(this.formProducto.escala_may1 || 0),
                escala_may2: Number(this.formProducto.escala_may2 || 0),
                activo: !!this.formProducto.activo,
                controstock: !!this.formProducto.controstock,
                nuevo_ingreso: !!this.formProducto.nuevo_ingreso,
            }
        },

        abrirTienda() {
            // abre en nueva pestaña
            window.open("https://tienda.domo.pe/", "_blank");
        },

        async copiarLinkTienda() {
            const link = "https://tienda.domo.pe/";
            try {
                await navigator.clipboard.writeText(link);
                if (this.$toast) this.$toast.success("Link copiado");
                else alert("Link copiado: " + link);
            } catch (e) {
                // fallback
                const el = document.createElement("textarea");
                el.value = link;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                alert("Link copiado: " + link);
            }
        },

        onSelectProductoCatalogo(id) {
            this.productoSelId = id || null
            if (!id) {
                this.productoSelObj = null
                this.formProducto = this.crearFormProductoBase()
                return
            }

            const p = (this.arrayProductos || []).find(x => String(x.id) === String(id))
            if (!p) return

            this.productoSelObj = p

            this.formProducto = this.mapearProductoAFormulario(p)

            // tus datos reales traen categoria como texto
            this.formProducto.categoria = p.categoria || ""

            // si en tu catálogo marca viene como "0" (id) y no nombre,
            // aquí puedes mapearlo si tienes tabla marcas, si no, lo dejas vacío.
            this.formProducto.marca = typeof p.marca === "string" ? p.marca : ""

            this.formProducto.idCatalogo = p.id
        },

        async aplicarFotoProcesadaEnTarjeta(file, tipo, id) {
            const tabla =
                tipo === "marca" ? "marcas" :
                    tipo === "categoria" ? "categorias" :
                        tipo === "promocion" ? "promociones" :
                            "productos"

            const arr =
                tabla === "marcas" ? this.marcas :
                    tabla === "categorias" ? this.categorias :
                        tabla === "promociones" ? this.promociones :
                            this.productos

            const actual = (arr || []).find(x => x && x.id === id) || {}

            let nuevoRegistro

            if (["productos", "promociones"].includes(tabla)) {
                const thumbB64 = await generarMiniaturaBase64(file, 220, 0.65)
                const { fotoUrl: _fotoUrl, thumbB64: _thumbB64, rutaStorage: _rutaStorage, ...resto } = actual
                const { url, rutaStorage } = await this.subirImagenStorage(file, tipo, id)
                const imagenesActuales = tabla === "promociones"
                    ? this.normalizarImagenesPromocion(actual)
                    : this.normalizarImagenesProducto(actual)

                nuevoRegistro = {
                    ...resto,
                    id,
                    imagenes: [
                        ...imagenesActuales,
                        {
                            fotoUrl: url,
                            thumbB64,
                            rutaStorage,
                        },
                    ].map((imagen, index) => ({
                        ...this.normalizarImagenProducto(imagen, index),
                        orden: index + 1,
                    })),
                    updatedAt: Date.now(),
                }
            } else {
                if (actual.rutaStorage) {
                    await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                }

                const thumbB64 = await generarMiniaturaBase64(file, 220, 0.65)
                const { url, rutaStorage } = await this.subirImagenStorage(file, tipo, id)

                nuevoRegistro = {
                    ...actual,
                    id,
                    thumbB64,
                    fotoUrl: url,
                    rutaStorage,
                    updatedAt: Date.now(),
                }
            }

            await guarda_datos_tienda(`${tabla}/${id}`, nuevoRegistro)

            // 4) actualizar en memoria
            const idx = (arr || []).findIndex(x => x && x.id === id)
            if (idx >= 0) {
                if (tabla === "marcas") this.$set(this.marcas, idx, nuevoRegistro)
                if (tabla === "categorias") this.$set(this.categorias, idx, nuevoRegistro)
                if (tabla === "productos") this.$set(this.productos, idx, nuevoRegistro)
                if (tabla === "promociones") this.$set(this.promociones, idx, this.normalizarPromocionEnMemoria(nuevoRegistro))
            }
        },

        async onCropConfirmado({ file, preview, meta }) {
            if (meta.modo === "dialogo") {
                this.archivoDialogo = file
                this.previewDialogo = preview
                return
            }

            if (meta.modo === "tarjeta") {
                await this.aplicarFotoProcesadaEnTarjeta(file, meta.tipo, meta.id)
            }
        },

        onCropCerrado() {
            // opcional: limpiar estados si quieres
        },

        procesarArchivoSeleccionado(file, meta) {
            if (!file) return
            this.$refs.dlgCrop.abrirCropperConFile(file, meta)
        },

        seleccionarFotoDesdeLista(payload, tipo) {
            if (!payload?.file || !payload?.id) return
            this.procesarArchivoSeleccionado(payload.file, {
                modo: "tarjeta",
                tipo,
                id: payload.id,
            })
        },

        reordenarMarcas(items) {
            this.marcas = Array.isArray(items) ? [...items] : []
            this.alSoltarDragMarcas()
        },

        reordenarCategorias(items) {
            this.categorias = Array.isArray(items) ? [...items] : []
            this.alSoltarDragCategorias()
        },

        reordenarProductos(items) {
            this.productos = Array.isArray(items) ? [...items] : []
            this.alSoltarDragProductos()
        },
        reordenarPromociones(items) {
            this.promociones = Array.isArray(items) ? [...items] : []
            this.alSoltarDragPromociones()
        },
        reordenarGruposPrecio(items) {
            this.gruposPrecio = Array.isArray(items) ? [...items] : []
            this.alSoltarDragGruposPrecio()
        },

        eliminarMarca(id) {
            return this.eliminarItem("marca", id)
        },

        eliminarCategoria(id) {
            return this.eliminarItem("categoria", id)
        },

        eliminarProducto(id) {
            return this.eliminarItem("producto", id)
        },
        eliminarPromocion(id) {
            return this.eliminarItem("promocion", id)
        },
        eliminarGrupoPrecio(id) {
            return this.eliminarItem("grupo_precio", id)
        },

        editarProducto(item) {
            this.tipoDialogo = "producto"
            this.editMode = true
            this.editId = item.id
            this.productoSelId = item.idCatalogo || null

            this.formProducto = this.mapearProductoAFormulario(item)

            // si ya tiene foto, muéstrala de preview (no es obligatorio)
            this.previewDialogo = item.fotoUrl || item.thumbB64 || ""
            this.archivoDialogo = null // si elige otra foto, recién se setea

            this.dlgAdd = true
        },

        editarMarca(item) {
            this.tipoDialogo = "marca"
            this.editMode = true
            this.editId = item.id
            this.formMarca = { nombre: item.nombre || "", categoria: item.categoria || "" }
            this.previewDialogo = item.fotoUrl || item.thumbB64 || ""
            this.archivoDialogo = null
            this.dlgAdd = true
        },

        editarCategoria(item) {
            this.tipoDialogo = "categoria"
            this.editMode = true
            this.editId = item.id
            this.formCategoria = { nombre: item.nombre || "" }
            this.previewDialogo = item.fotoUrl || item.thumbB64 || ""
            this.archivoDialogo = null
            this.dlgAdd = true
        },
        editarPromocion(item) {
            this.tipoDialogo = "promocion"
            this.editMode = true
            this.editId = item.id
            this.formPromocion = this.mapearPromocionAFormulario(item)
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.cargarImagenesDialogoPromocion(item)
            this.dlgAdd = true
        },
        editarGrupoPrecio(item) {
            this.tipoDialogo = "grupo_precio"
            this.editMode = true
            this.editId = item.id
            this.formGrupoPrecio = this.mapearGrupoPrecioAFormulario(item)
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.imagenesDialogo = []
            this.dlgAdd = true
        },

        getIcon(tabName) {
            const icons = { MARCAS: "mdi-watermark", CATEGORIAS: "mdi-tag-multiple", PRODUCTOS: "mdi-package-variant", PROMOCIONES: "mdi-sale", "GRUPO PRECIO": "mdi-family-tree" }
            return icons[tabName] || "mdi-help"
        },

        async escucharTodo() {
            const [snapM, snapC, snapP, snapPromo, snapGrupoPrecio, snapConfig] = await Promise.all([
                obten_datos_tienda("marcas").once("value"),
                obten_datos_tienda("categorias").once("value"),
                obten_datos_tienda("productos").once("value"),
                obten_datos_tienda("promociones").once("value"),
                obten_datos_tienda("grupos_precio").once("value"),
                obten_datos_tienda("configuracion").once("value"),
            ])

            const valM = snapM.val() || {}
            const valC = snapC.val() || {}
            const valP = snapP.val() || {}
            const valPromo = snapPromo.val() || {}
            const valGrupoPrecio = snapGrupoPrecio.val() || {}
            const valConfig = snapConfig.val() || {}

            this.marcas = Object.values(valM).filter(x => x && x.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.categorias = Object.values(valC).filter(x => x && x.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.productos = Object.values(valP)
                .filter(x => x && x.id)
                .map(item => this.normalizarProductoEnMemoria(item))
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.promociones = Object.values(valPromo)
                .filter(x => x && x.id)
                .map(item => this.normalizarPromocionEnMemoria(item))
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.gruposPrecio = Object.values(valGrupoPrecio)
                .filter(x => x && x.id)
                .map(item => this.mapearGrupoPrecioAFormulario(item))
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            this.configTienda = {
                pedido_minimo: Number(valConfig.pedido_minimo || 0),
                telefono_whatsapp: String(valConfig.telefono_whatsapp || ""),
                comprobantes_permitidos: Array.isArray(valConfig.comprobantes_permitidos) && valConfig.comprobantes_permitidos.length
                    ? valConfig.comprobantes_permitidos
                    : ["B", "F", "T"],
                ultima_sincronizacion: Number(valConfig.ultima_sincronizacion || 0),
                updatedAt: Number(valConfig.updatedAt || 0),
            }
            this.mostrarAlertaSincronizada = true
            this.sincronizarCatalogosAutocomplete()

        },

        cerrarAlertaSincronizada() {
            this.mostrarAlertaSincronizada = false
        },

        sincronizarCatalogosAutocomplete() {
            this.array_marca = (this.marcas || []).map(item => item.nombre).filter(Boolean)
            this.arraycategoria = (this.categorias || []).map(item => item.nombre).filter(Boolean)
        },

        async propagarCambioNombreEnProductos(campo, nombreAnterior, nombreNuevo) {
            if (!campo || !nombreAnterior || !nombreNuevo || nombreAnterior === nombreNuevo) return

            const productosActualizados = (this.productos || []).map(item => {
                if (!item || item[campo] !== nombreAnterior) return item
                return {
                    ...item,
                    [campo]: nombreNuevo,
                    updatedAt: Date.now(),
                }
            })

            const cambios = productosActualizados.filter((item, index) => {
                const original = this.productos[index]
                return item && original && item[campo] !== original[campo]
            })

            if (!cambios.length) return

            const updates = {}
            cambios.forEach(item => {
                updates[`productos/${item.id}/${campo}`] = item[campo]
                updates[`productos/${item.id}/updatedAt`] = item.updatedAt
            })

            await firebase.database().ref(this.bd).child("tienda").update(updates)
            this.productos = productosActualizados
        },

        // ---- dialogo ----
        abrirAgregar(tipo) {
            this.tipoDialogo = tipo
            this.editMode = false
            this.editId = ""
            this.productoSelId = null

            if (tipo === "marca") this.formMarca = { nombre: "", categoria: "" }
            if (tipo === "categoria") this.formCategoria = { nombre: "" }
            if (tipo === "producto") this.formProducto = this.crearFormProductoBase()

            this.previewDialogo = ""
            this.archivoDialogo = null
            this.dlgAdd = true
        },

        cerrarDialogo() {
            this.dlgAdd = false
            this.tipoDialogo = ""
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.editMode = false
            this.editId = ""
            this.productoSelId = null
            if (this.$refs.fileCreate) this.$refs.fileCreate.value = ""
        },

        seleccionarFotoDialogo(e) {
            const file = e.target.files?.[0]
            this.procesarArchivoSeleccionado(file, {
                modo: "dialogo",
            })
            e.target.value = ""
        },

        // ---- guardar ----
        generarId() {
            return "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
        },
        obtenerIdProductoDesdeStore() {
            const idBuscado = this.formProducto.idCatalogo || this.productoSelId
            if (!idBuscado) return ""

            const productoStore = (this.arrayProductos || []).find(x => String(x.id) === String(idBuscado))
            return productoStore?.id || idBuscado || ""
        },
        async guardarItem() {
            if (this.deshabilitarGuardar) return
            store.commit("dialogoprogress")

            try {
                const esMarca = this.tipoDialogo === "marca"
                const esCategoria = this.tipoDialogo === "categoria"
                const esProducto = this.tipoDialogo === "producto"

                const tabla = esMarca ? "marcas" : esCategoria ? "categorias" : esProducto ? "productos" : null
                if (!tabla) return

                // si es edición, no generes id nuevo
                const id = this.editMode
                    ? this.editId
                    : esProducto
                        ? this.obtenerIdProductoDesdeStore()
                        : this.generarId()

                if (esProducto && !id) return

                const nombre = esMarca
                    ? this.formMarca.nombre.trim()
                    : esCategoria
                        ? this.formCategoria.nombre.trim()
                        : this.formProducto.nombre.trim()
                const categoriaMarca = esMarca ? (this.formMarca.categoria || "") : ""

                // orden:
                // - si edita: respeta el orden actual del producto
                // - si crea: pone al final
                let orden
                if (esMarca) {
                    if (this.editMode) {
                        const actual = (this.marcas || []).find(x => x.id === id)
                        orden = actual?.orden || 1
                    } else {
                        orden = this.marcas.length + 1
                    }
                }
                if (esCategoria) {
                    if (this.editMode) {
                        const actual = (this.categorias || []).find(x => x.id === id)
                        orden = actual?.orden || 1
                    } else {
                        orden = this.categorias.length + 1
                    }
                }
                if (esProducto) {
                    if (this.editMode) {
                        const actual = (this.productos || []).find(x => x.id === id)
                        orden = actual?.orden || 1
                    } else {
                        orden = this.productos.length + 1
                    }
                }
                let actual = null
                let nombreAnterior = ""

                // base item
                let item

                if (this.editMode) {
                    actual = {}
                    if (esMarca) actual = (this.marcas || []).find(x => x.id === id) || {}
                    if (esCategoria) actual = (this.categorias || []).find(x => x.id === id) || {}
                    if (esProducto) actual = (this.productos || []).find(x => x.id === id) || {}
                    nombreAnterior = actual.nombre || ""

                    item = esProducto
                        ? this.construirItemProducto({ id, nombre, orden, actual })
                        : {
                            ...actual,
                            id,
                            nombre,
                            ...(esMarca ? { categoria: categoriaMarca } : {}),
                            orden,
                            updatedAt: Date.now(),
                        }

                    // 2) SOLO si cambió foto, actualizas thumb/fotoUrl/rutaStorage
                    if (this.archivoDialogo) {
                        // 1) borrar anterior (si existía)
                        if (item.rutaStorage) {
                            await this.eliminarEnStoragePorRuta(item.rutaStorage)
                        }

                        // 2) subir nueva
                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const tipoStorage = esMarca ? "marca" : esCategoria ? "categoria" : "producto"
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, tipoStorage, id)

                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }


                } else {
                    // CREAR NUEVO (marca/categoria/producto)
                    item = esProducto
                        ? this.construirItemProducto({ id, nombre, orden })
                        : {
                            id,
                            nombre,
                            ...(esMarca ? { categoria: categoriaMarca } : {}),
                            orden,
                            thumbB64: "",
                            fotoUrl: "",
                            updatedAt: Date.now(),
                        }

                    if (this.archivoDialogo) {
                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const tipoStorage = esMarca ? "marca" : esCategoria ? "categoria" : "producto"
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, tipoStorage, id)
                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }
                }


                await guarda_datos_tienda(`${tabla}/${id}`, item)

                if (this.editMode && esMarca) {
                    await this.propagarCambioNombreEnProductos("marca", nombreAnterior, nombre)
                }
                if (this.editMode && esCategoria) {
                    await this.propagarCambioNombreEnProductos("categoria", nombreAnterior, nombre)
                }

                // actualizar arrays en memoria
                if (tabla === "marcas") {
                    if (this.editMode) {
                        const idx = (this.marcas || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.marcas, idx, item)
                    } else {
                        this.marcas.unshift(item)
                    }
                } else if (tabla === "categorias") {
                    if (this.editMode) {
                        const idx = (this.categorias || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.categorias, idx, item)
                    } else {
                        this.categorias.unshift(item)
                    }
                } else if (tabla === "productos") {
                    if (this.editMode) {
                        const idx = (this.productos || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.productos, idx, item)
                    } else {
                        this.productos.unshift(item)
                    }
                }

                this.sincronizarCatalogosAutocomplete()

                this.cerrarDialogo()
            } catch (e) {
                console.error("❌ Error guardando:", e)
            } finally {
                store.commit("dialogoprogress")
            }
        },

        seleccionarFoto(e, tipo, id) {
            const file = e.target.files?.[0]
            this.procesarArchivoSeleccionado(file, {
                modo: "tarjeta",
                tipo,
                id,
            })
            e.target.value = ""
        },

        async eliminarItem(tipo, id) {
            try {
                const ok = confirm("¿Seguro de eliminar este registro? Esta acción no se puede deshacer.")
                if (!ok) return

                const tabla =
                    tipo === "marca" ? "marcas" :
                        tipo === "categoria" ? "categorias" :
                            tipo === "producto" ? "productos" : null

                if (!tabla) return

                // 1) Obtener el registro actual para saber rutaStorage
                const bd = store.state.baseDatos.bd
                const snap = await firebase.database().ref(bd).child(`tienda/${tabla}/${id}`).once("value")
                const actual = snap.val() || {}

                // 2) Borrar foto en Storage
                // Opción A: borrar solo el archivo exacto (si guardaste rutaStorage)
                if (actual.rutaStorage) {
                    await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                } else {
                    // Opción B: borrar toda la carpeta por si hubo varias fotos (más seguro)
                    // tienda/{bd}/{tipo}/{id}/
                    const prefix = `tienda/${this.bd}/${tipo}/${id}`
                    await this.eliminarCarpetaStorage(prefix)
                }

                // 3) Borrar el registro en RTDB
                await elimina_datos_tienda(tabla, id)

                // 4) Actualizar arrays + reordenar (tu lógica igual)
                if (tabla === "marcas") {
                    this.marcas = (this.marcas || []).filter(x => x && x.id !== id)
                    this.marcas = this.marcas.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.marcas.forEach(m => (updates[`marcas/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "categorias") {
                    this.categorias = (this.categorias || []).filter(x => x && x.id !== id)
                    this.categorias = this.categorias.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.categorias.forEach(m => (updates[`categorias/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "productos") {
                    this.productos = (this.productos || []).filter(x => x && x.id !== id)
                    this.productos = this.productos.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.productos.forEach(m => (updates[`productos/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                console.log("✅ Eliminado (BD + Storage):", tabla, id)
            } catch (e) {
                console.error("❌ Error al eliminar:", e)
            }
        },


        async eliminarEnStoragePorRuta(rutaStorage) {
            try {
                if (!rutaStorage) return
                await firebase.storage().ref(rutaStorage).delete()
            } catch (e) {
                // Si no existe o no hay permisos, no rompas el flujo
                console.warn("⚠️ No se pudo borrar en Storage:", e?.message || e)
            }
        },

        async eliminarCarpetaStorage(prefix) {
            // Borra todo lo que haya dentro del "folder" (Firebase no borra carpetas, borra archivos)
            try {
                if (!prefix) return
                const ref = firebase.storage().ref(prefix)
                const res = await ref.listAll()

                // borra archivos
                await Promise.all(res.items.map(item => item.delete()))

                // si hay subcarpetas, borrar recursivo
                await Promise.all(res.prefixes.map(p => this.eliminarCarpetaStorage(p.fullPath)))
            } catch (e) {
                console.warn("⚠️ No se pudo borrar carpeta en Storage:", e?.message || e)
            }
        },



        async subirImagenStorage(file, tipo, id) {
            const extension = (file.name.split(".").pop() || "jpg").toLowerCase()
            const nombreArchivo = `${Date.now()}_${id}.${extension}`
            const rutaStorage = `tienda/${this.bd}/${tipo}/${id}/${nombreArchivo}`

            const refStorage = firebase.storage().ref(rutaStorage)
            await refStorage.put(file, { contentType: file.type || "image/jpeg" })
            const url = await refStorage.getDownloadURL()
            return { url, rutaStorage }
        },
        editarProducto(item) {
            this.tipoDialogo = "producto"
            this.editMode = true
            this.editId = item.id
            this.productoSelId = item.idCatalogo || null
            this.formProducto = this.mapearProductoAFormulario(item)
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.cargarImagenesDialogoProducto(item)
            this.dlgAdd = true
        },
        abrirAgregar(tipo) {
            this.tipoDialogo = tipo
            this.editMode = false
            this.editId = ""
            this.productoSelId = null

            if (tipo === "marca") this.formMarca = { nombre: "", categoria: "" }
            if (tipo === "categoria") this.formCategoria = { nombre: "" }
            if (tipo === "producto") this.formProducto = this.crearFormProductoBase()
            if (tipo === "promocion") this.formPromocion = this.crearFormPromocionBase()
            if (tipo === "grupo_precio") this.formGrupoPrecio = this.crearFormGrupoPrecioBase()

            this.previewDialogo = ""
            this.archivoDialogo = null
            this.imagenesDialogo = []
            this.dlgAdd = true
        },
        cerrarDialogo() {
            this.dlgAdd = false
            this.tipoDialogo = ""
            this.previewDialogo = ""
            this.archivoDialogo = null
            this.imagenesDialogo = []
            this.editMode = false
            this.editId = ""
            this.productoSelId = null
            if (this.$refs.fileCreate) this.$refs.fileCreate.value = ""
        },
        async seleccionarFotoDialogo(e) {
            const files = Array.from(e.target.files || [])
            if (!files.length) {
                e.target.value = ""
                return
            }

            if (["producto", "promocion"].includes(this.tipoDialogo)) {
                await this.agregarArchivosDialogoProducto(files)
            } else {
                this.procesarArchivoSeleccionado(files[0], {
                    modo: "dialogo",
                })
            }

            e.target.value = ""
        },
        async guardarItem() {
            if (this.deshabilitarGuardar) return
            store.commit("dialogoprogress")

            try {
                const esMarca = this.tipoDialogo === "marca"
                const esCategoria = this.tipoDialogo === "categoria"
                const esProducto = this.tipoDialogo === "producto"
                const esPromocion = this.tipoDialogo === "promocion"
                const esGrupoPrecio = this.tipoDialogo === "grupo_precio"

                const tabla = esMarca ? "marcas" : esCategoria ? "categorias" : esProducto ? "productos" : esPromocion ? "promociones" : esGrupoPrecio ? "grupos_precio" : null
                if (!tabla) return

                const id = this.editMode
                    ? this.editId
                    : esProducto
                        ? this.obtenerIdProductoDesdeStore()
                        : this.generarId()

                if (esProducto && !id) return

                const nombre = esMarca
                    ? this.formMarca.nombre.trim()
                    : esCategoria
                        ? this.formCategoria.nombre.trim()
                        : esProducto
                            ? this.formProducto.nombre.trim()
                            : esPromocion
                                ? this.formPromocion.nombre.trim()
                                : this.formGrupoPrecio.nombre.trim()
                const categoriaMarca = esMarca ? (this.formMarca.categoria || "") : ""

                let orden
                if (esMarca) {
                    orden = this.editMode
                        ? ((this.marcas || []).find(x => x.id === id)?.orden || 1)
                        : this.marcas.length + 1
                }
                if (esCategoria) {
                    orden = this.editMode
                        ? ((this.categorias || []).find(x => x.id === id)?.orden || 1)
                        : this.categorias.length + 1
                }
                if (esProducto) {
                    orden = this.editMode
                        ? ((this.productos || []).find(x => x.id === id)?.orden || 1)
                        : this.productos.length + 1
                }
                if (esPromocion) {
                    orden = this.editMode
                        ? ((this.promociones || []).find(x => x.id === id)?.orden || 1)
                        : this.promociones.length + 1
                }
                if (esGrupoPrecio) {
                    orden = this.editMode
                        ? ((this.gruposPrecio || []).find(x => x.id === id)?.orden || 1)
                        : this.gruposPrecio.length + 1
                }

                let actual = null
                let nombreAnterior = ""
                let item

                if (this.editMode) {
                    actual = {}
                    if (esMarca) actual = (this.marcas || []).find(x => x.id === id) || {}
                    if (esCategoria) actual = (this.categorias || []).find(x => x.id === id) || {}
                    if (esProducto) actual = (this.productos || []).find(x => x.id === id) || {}
                    if (esPromocion) actual = (this.promociones || []).find(x => x.id === id) || {}
                    if (esGrupoPrecio) actual = (this.gruposPrecio || []).find(x => x.id === id) || {}
                    nombreAnterior = actual.nombre || ""

                    item = esProducto
                        ? this.construirItemProducto({ id, nombre, orden, actual })
                        : esPromocion
                            ? this.construirItemPromocion({ id, nombre, orden, actual })
                            : esGrupoPrecio
                                ? this.construirItemGrupoPrecio({ id, nombre, orden, actual })
                                : {
                                    ...actual,
                                    id,
                                    nombre,
                                    ...(esMarca ? { categoria: categoriaMarca } : {}),
                                    orden,
                                    updatedAt: Date.now(),
                                }

                    if (esProducto) {
                        item.imagenes = await this.construirImagenesProductoDesdeDialogo(id)
                        item.updatedAt = Date.now()
                    } else if (esPromocion) {
                        item.imagenes = await this.construirImagenesProductoDesdeDialogo(id, "promocion")
                        item.updatedAt = Date.now()
                    } else if (esGrupoPrecio) {
                        item.updatedAt = Date.now()
                    } else if (this.archivoDialogo) {
                        if (item.rutaStorage) {
                            await this.eliminarEnStoragePorRuta(item.rutaStorage)
                        }

                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const tipoStorage = esMarca ? "marca" : "categoria"
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, tipoStorage, id)

                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }
                } else {
                    item = esProducto
                        ? this.construirItemProducto({ id, nombre, orden })
                        : esPromocion
                            ? this.construirItemPromocion({ id, nombre, orden })
                            : esGrupoPrecio
                                ? this.construirItemGrupoPrecio({ id, nombre, orden })
                                : {
                                    id,
                                    nombre,
                                    ...(esMarca ? { categoria: categoriaMarca } : {}),
                                    orden,
                                    thumbB64: "",
                                    fotoUrl: "",
                                    updatedAt: Date.now(),
                                }

                    if (esProducto) {
                        item.imagenes = await this.construirImagenesProductoDesdeDialogo(id)
                        item.updatedAt = Date.now()
                    } else if (esPromocion) {
                        item.imagenes = await this.construirImagenesProductoDesdeDialogo(id, "promocion")
                        item.updatedAt = Date.now()
                    } else if (esGrupoPrecio) {
                        item.updatedAt = Date.now()
                    } else if (this.archivoDialogo) {
                        item.thumbB64 = await generarMiniaturaBase64(this.archivoDialogo, 220, 0.65)
                        const tipoStorage = esMarca ? "marca" : "categoria"
                        const { url, rutaStorage } = await this.subirImagenStorage(this.archivoDialogo, tipoStorage, id)
                        item.fotoUrl = url
                        item.rutaStorage = rutaStorage
                        item.updatedAt = Date.now()
                    }
                }

                if (esProducto) {
                    item = this.normalizarProductoEnMemoria(item)
                }
                if (esPromocion) {
                    item = this.normalizarPromocionEnMemoria(item)
                }

                await guarda_datos_tienda(`${tabla}/${id}`, item)

                if (this.editMode && esMarca) {
                    await this.propagarCambioNombreEnProductos("marca", nombreAnterior, nombre)
                }
                if (this.editMode && esCategoria) {
                    await this.propagarCambioNombreEnProductos("categoria", nombreAnterior, nombre)
                }

                if (tabla === "marcas") {
                    if (this.editMode) {
                        const idx = (this.marcas || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.marcas, idx, item)
                    } else {
                        this.marcas.unshift(item)
                    }
                } else if (tabla === "categorias") {
                    if (this.editMode) {
                        const idx = (this.categorias || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.categorias, idx, item)
                    } else {
                        this.categorias.unshift(item)
                    }
                } else if (tabla === "productos") {
                    if (this.editMode) {
                        const idx = (this.productos || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.productos, idx, item)
                    } else {
                        this.productos.unshift(item)
                    }
                } else if (tabla === "promociones") {
                    if (this.editMode) {
                        const idx = (this.promociones || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.promociones, idx, item)
                    } else {
                        this.promociones.unshift(item)
                    }
                } else if (tabla === "grupos_precio") {
                    if (this.editMode) {
                        const idx = (this.gruposPrecio || []).findIndex(x => x.id === id)
                        if (idx >= 0) this.$set(this.gruposPrecio, idx, item)
                    } else {
                        this.gruposPrecio.unshift(item)
                    }
                }

                this.sincronizarCatalogosAutocomplete()
                this.cerrarDialogo()
            } catch (e) {
                console.error("âŒ Error guardando:", e)
            } finally {
                store.commit("dialogoprogress")
            }
        },
        async eliminarItem(tipo, id) {
            try {
                const ok = confirm("Â¿Seguro de eliminar este registro? Esta acciÃ³n no se puede deshacer.")
                if (!ok) return

                const tabla =
                    tipo === "marca" ? "marcas" :
                        tipo === "categoria" ? "categorias" :
                            tipo === "producto" ? "productos" :
                                tipo === "promocion" ? "promociones" :
                                    tipo === "grupo_precio" ? "grupos_precio" : null

                if (!tabla) return

                const bd = store.state.baseDatos.bd
                const snap = await firebase.database().ref(bd).child(`tienda/${tabla}/${id}`).once("value")
                const actual = snap.val() || {}

                if (tabla === "productos") {
                    const imagenes = this.normalizarImagenesProducto(actual)
                    if (imagenes.length) {
                        await Promise.all(
                            imagenes
                                .map(imagen => imagen.rutaStorage)
                                .filter(Boolean)
                                .map(ruta => this.eliminarEnStoragePorRuta(ruta))
                        )
                    } else if (actual.rutaStorage) {
                        await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                    } else {
                        const prefix = `tienda/${this.bd}/${tipo}/${id}`
                        await this.eliminarCarpetaStorage(prefix)
                    }
                } else if (tabla === "promociones") {
                    const imagenes = this.normalizarImagenesPromocion(actual)
                    if (imagenes.length) {
                        await Promise.all(
                            imagenes
                                .map(imagen => imagen.rutaStorage)
                                .filter(Boolean)
                                .map(ruta => this.eliminarEnStoragePorRuta(ruta))
                        )
                    } else if (actual.rutaStorage) {
                        await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                    } else {
                        const prefix = `tienda/${this.bd}/${tipo}/${id}`
                        await this.eliminarCarpetaStorage(prefix)
                    }
                } else if (actual.rutaStorage) {
                    await this.eliminarEnStoragePorRuta(actual.rutaStorage)
                } else {
                    const prefix = `tienda/${this.bd}/${tipo}/${id}`
                    await this.eliminarCarpetaStorage(prefix)
                }

                await elimina_datos_tienda(tabla, id)

                if (tabla === "marcas") {
                    this.marcas = (this.marcas || []).filter(x => x && x.id !== id)
                    this.marcas = this.marcas.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.marcas.forEach(m => (updates[`marcas/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "categorias") {
                    this.categorias = (this.categorias || []).filter(x => x && x.id !== id)
                    this.categorias = this.categorias.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.categorias.forEach(m => (updates[`categorias/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                if (tabla === "productos") {
                    this.productos = (this.productos || []).filter(x => x && x.id !== id)
                    this.productos = this.productos.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.productos.forEach(m => (updates[`productos/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }
                if (tabla === "promociones") {
                    this.promociones = (this.promociones || []).filter(x => x && x.id !== id)
                    this.promociones = this.promociones.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.promociones.forEach(m => (updates[`promociones/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }
                if (tabla === "grupos_precio") {
                    this.gruposPrecio = (this.gruposPrecio || []).filter(x => x && x.id !== id)
                    this.gruposPrecio = this.gruposPrecio.map((m, i) => ({ ...m, orden: i + 1 }))

                    const updates = {}
                    this.gruposPrecio.forEach(m => (updates[`grupos_precio/${m.id}/orden`] = m.orden))
                    await firebase.database().ref(bd).child("tienda").update(updates)
                }

                this.sincronizarCatalogosAutocomplete()
                console.log("âœ… Eliminado (BD + Storage):", tabla, id)
            } catch (e) {
                console.error("âŒ Error al eliminar:", e)
            }
        },
        async alSoltarDragMarcas() {
            try {
                const bd = store.state.baseDatos.bd

                // 1) re-calcula orden en memoria (para que el chip cambie al toque)
                this.marcas = this.marcas.map((m, i) => ({ ...m, orden: i + 1 }))

                // 2) update masivo (rutas RELATIVAS a /{bd}/tienda)
                const updates = {}
                this.marcas.forEach(m => {
                    updates[`marcas/${m.id}/orden`] = m.orden
                })

                // 3) aplica el update en /{bd}/tienda
                await firebase.database().ref(bd).child("tienda").update(updates)

                console.log("✅ Orden guardado", this.marcas.map(x => ({ id: x.id, orden: x.orden })))
            } catch (e) {
                console.error("❌ Error guardando orden:", e)
            }
        },
        async alSoltarDragCategorias() {
            try {
                const bd = store.state.baseDatos.bd

                this.categorias = this.categorias.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.categorias.forEach(m => {
                    updates[`categorias/${m.id}/orden`] = m.orden
                })

                await firebase.database().ref(bd).child("tienda").update(updates)

                console.log("✅ Orden categorías guardado", this.categorias.map(x => ({ id: x.id, orden: x.orden })))
            } catch (e) {
                console.error("❌ Error guardando orden categorías:", e)
            }
        },
        async alSoltarDragProductos() {
            try {
                const bd = store.state.baseDatos.bd
                this.productos = this.productos.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.productos.forEach(m => (updates[`productos/${m.id}/orden`] = m.orden))

                await firebase.database().ref(bd).child("tienda").update(updates)
                console.log("✅ Orden productos guardado")
            } catch (e) {
                console.error("❌ Error guardando orden productos:", e)
            }
        },

        async alSoltarDragPromociones() {
            try {
                const bd = store.state.baseDatos.bd
                this.promociones = this.promociones.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.promociones.forEach(m => (updates[`promociones/${m.id}/orden`] = m.orden))

                await firebase.database().ref(bd).child("tienda").update(updates)
                console.log("âœ… Orden promociones guardado")
            } catch (e) {
                console.error("âŒ Error guardando orden promociones:", e)
            }
        },
        async alSoltarDragGruposPrecio() {
            try {
                const bd = store.state.baseDatos.bd
                this.gruposPrecio = this.gruposPrecio.map((m, i) => ({ ...m, orden: i + 1 }))

                const updates = {}
                this.gruposPrecio.forEach(m => (updates[`grupos_precio/${m.id}/orden`] = m.orden))

                await firebase.database().ref(bd).child("tienda").update(updates)
                console.log("âœ… Orden grupos de precio guardado")
            } catch (e) {
                console.error("âŒ Error guardando orden grupos de precio:", e)
            }
        },
        nombreMarca(id) {
            const m = (this.marcas || []).find(x => x.id === id)
            return m ? m.nombre : "Sin marca"
        },
        nombreCategoria(id) {
            const c = (this.categorias || []).find(x => x.id === id)
            return c ? c.nombre : "Sin categoría"
        },


    },
}
</script>

<style scoped>
.tienda-page {
    padding: 20px;
    background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 28%),
        radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 26%),
        linear-gradient(180deg, #f6f8fc 0%, #edf2f7 100%);
    min-height: 100%;
}

.card-item {
    transition: 0.2s;
}

.drag-ghost {
    opacity: 0.15;
}

.drag-chosen {
    opacity: 0.9;
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}

.tienda-hero {
    background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 28%),
        radial-gradient(circle at bottom left, rgba(251, 191, 36, 0.2), transparent 30%),
        linear-gradient(135deg, #1f2937 0%, #7c2d12 52%, #c2410c 100%);
    color: #fff;
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
}

.tienda-hero-compact {
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.hero-eyebrow,
.workspace-kicker,
.side-highlight-label,
.hero-link-label {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 11px;
    font-weight: 800;
}

.hero-eyebrow {
    color: rgba(255, 255, 255, 0.72);
}

.hero-title {
    max-width: 680px;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 38px;
    line-height: 1.08;
    font-weight: 900;
}

.hero-title-compact {
    max-width: 760px;
    font-size: 25px;
    line-height: 1.05;
}

.hero-subtitle {
    max-width: 640px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 15px;
    line-height: 1.7;
}

.hero-subtitle-compact {
    max-width: 760px;
    font-size: 13px;
    line-height: 1.45;
}

.hero-link-shell {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
}

.hero-link-label {
    color: rgba(255, 255, 255, 0.6);
}

.hero-link-value {
    font-size: 14px;
    font-weight: 800;
    word-break: break-all;
}

.hero-sync-meta {
    color: rgba(255, 255, 255, 0.78);
}

.sync-status-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border: 1px solid #bbf7d0;
    box-shadow: 0 12px 28px rgba(21, 128, 61, 0.08);
}

.sync-status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: rgba(34, 197, 94, 0.12);
}

.sync-status-title {
    font-size: 16px;
    font-weight: 800;
    color: #166534;
}

.sync-status-copy {
    margin-top: 2px;
    font-size: 13px;
    color: #15803d;
}

.tienda-hero-secondary {
    border: 1px solid rgba(16, 52, 166, 0.12);
}

.tienda-side-panel,
.tienda-workspace,
.tienda-dialog-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.14);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.side-panel-title,
.workspace-title {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 26px;
    line-height: 1.1;
    font-weight: 900;
    color: #0f172a;
}

.side-panel-subtitle,
.workspace-copy,
.side-highlight-copy {
    color: #475569;
    font-size: 14px;
    line-height: 1.6;
}

.metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.metric-tile {
    padding: 14px;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
}

.metric-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 12px;
    margin-bottom: 10px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
}

.metric-value {
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
}

.metric-label {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.side-highlight {
    padding: 16px;
    border-radius: 20px;
    background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
    border: 1px solid #dbeafe;
}

.side-highlight-title {
    margin-top: 4px;
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
}

.workspace-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 26px 28px 18px;
    background:
        radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 25%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.workspace-kicker {
    color: #2563eb;
}

.workspace-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.tienda-tabs {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.tienda-tab {
    gap: 8px;
    min-height: 76px;
    color: #334155 !important;
}

.tab-counter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    margin-left: 4px;
    padding: 0 8px;
    border-radius: 999px;
    background: #dbeafe;
    color: #1034a6;
    font-size: 12px;
    font-weight: 800;
}

.tienda-tabs-body {
    background:
        linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.tienda-dialog-toolbar {
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.tienda-dialog-body {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.dialog-media-panel {
    padding: 20px 18px 16px;
    border-radius: 22px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px dashed #cbd5e1;
}

.dialog-media-avatar {
    border: 6px solid #fff;
}

.tienda-save-btn {
    box-shadow: 0 18px 32px rgba(29, 78, 216, 0.24);
}

.tienda-banner {
    border: 1px solid #e8eefc !important;
    background: linear-gradient(90deg, rgba(30, 58, 138, 0.08) 0%, rgba(255, 255, 255, 1) 60%);
}

@media (max-width: 960px) {
    .hero-title {
        font-size: 30px;
    }

    .hero-title-compact {
        font-size: 22px;
    }

    .workspace-topbar {
        padding: 22px 20px 16px;
    }
}

@media (max-width: 600px) {
    .tienda-page {
        padding: 12px;
    }

    .hero-title {
        font-size: 26px;
    }

    .hero-title-compact {
        font-size: 19px;
    }

    .metric-grid {
        grid-template-columns: 1fr 1fr;
    }

    .workspace-topbar {
        flex-direction: column;
    }
}

.hero-link-value {
    font-weight: 600;
    color: #1034a6;
    word-break: break-all;
}

.hero-link-label {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .4px;
}

.hero-title-compact {
    font-size: 24px;
    line-height: 1.2;
    font-weight: 800;
}

.hero-subtitle-compact {
    font-size: 14px;
    color: #5b6475;
    line-height: 1.5;
}

.hero-link-shell {
    background: rgba(255, 255, 255, .65);
    border: 1px solid rgba(16, 52, 166, .10);
    border-radius: 14px;
    padding: 12px 14px;
}
</style>
