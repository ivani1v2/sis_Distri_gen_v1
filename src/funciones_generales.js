import store from "@/store/index";
import {
  nuevoflujo,
  sumaContador,
  grabaCabecera,
  grabaDetalle,
  editaProducto,
} from "./db";
import { enviaDocumentoApiSunat } from "./servidorsunat";

export const procesar_items = async (items) => {
  const data = await completa_items(items);
  return [
    {
      estado: "PENDIENTE",
      mensajeSunat: "",
      hash: "",
      documentId: "",
      vendedor: store.state.permisos.token,
      total_op_gravadas: data.totaloperaGravada,
      total_op_inafectas: data.totaloperaInfafecta,
      total_op_gratuitas: data.total_op_gratuitas,
      igv: data.totalIGV,
      porcentaje_igv: store.state.configuracion.igv,
      porcentaje_cargo: 0,
      total_op_exoneradas: data.totaloperaExonerada,
      totalIGV_GRATUITA: data.totalIGV_GRATUITA,
      total_cargo: data.total_cargo,
    },
    data.item,
  ];
};

async function completa_items(arrays) {
  const items = [];
  let totaloperaGravada = 0;
  let totaloperaExonerada = 0;
  let totaloperaInfafecta = 0;
  let totalIGV = 0;
  let total_cargo = 0;
  var total_op_gratuitas = 0;
  var totalIGV_GRATUITA = 0;
  const porcentaje_igv = store.state.configuracion.igv / 100;
  const porcentaje_cargo = 0;
  
  for (const data of arrays) {
    // USAR precioedita (precio final con descuentos)
    const precioFinal = parseFloat(data.precioedita) || parseFloat(data.precio) || 0;
    
    // Extraer descuentos correctamente
    const d1 = data.descuentos?.desc_1 ?? data.desc_1 ?? 0;
    const d2 = data.descuentos?.desc_2 ?? data.desc_2 ?? 0;
    const d3 = data.descuentos?.desc_3 ?? data.desc_3 ?? 0;
    
    const descuentositem = parseFloat(data.preciodescuento) || 0;
    
    // Calcular precio item considerando descuentos globales
    const precio_item = parseFloat(
      redondear(precioFinal - descuentositem / data.cantidad)
    );

    let valor_unitario = precio_item;
    let igv = 0;
    let valorTotal = 0;
    let antesimpuesto = 0;
    let totalImpuesto = 0;

    console.log(`Procesando ${data.id} - ${data.nombre}:`);
    console.log(`- Operacion: ${data.operacion}`);
    console.log(`- Precio final: ${precioFinal}`);
    console.log(`- Cantidad: ${data.cantidad}`);

    if (data.operacion === "GRAVADA") {
      valor_unitario = precio_item / (1 + porcentaje_igv);
      antesimpuesto = valor_unitario * data.cantidad;
      totalImpuesto = antesimpuesto * porcentaje_igv;
      valorTotal = antesimpuesto + totalImpuesto;
      totaloperaGravada += antesimpuesto;
      totalIGV += totalImpuesto;
      igv = totalImpuesto;
      
    }

    if (data.operacion === "EXONERADA") {
      antesimpuesto = precio_item * data.cantidad;
      valorTotal = antesimpuesto; // ← EXONERADA: no tiene IGV
      totaloperaExonerada += antesimpuesto;
      
    }

    if (data.operacion === "INAFECTA") {
      antesimpuesto = precio_item * data.cantidad;
      valorTotal = antesimpuesto;
      totaloperaInfafecta += antesimpuesto;
    }
    
    if (data.operacion == "GRATUITA") {
      var precioVentaUnitario = precio_item;
      valor_unitario = precioVentaUnitario;
      igv = 0.0;
      valorTotal = 0;
      antesimpuesto = valor_unitario * data.cantidad;
      totalImpuesto = 0;
      totaloperaGravada = totaloperaGravada + 0;
      total_op_gratuitas = total_op_gratuitas + parseFloat(antesimpuesto);
      totalIGV = totalIGV + 0;
      totalIGV_GRATUITA = totalIGV_GRATUITA + 0;
      valor_unitario = 0.0;
      totalImpuesto = 0.0;
    }
    
    const tieneDescuentosPorcentaje = (d1 !== 0 || d2 !== 0 || d3 !== 0);

    const itemProcesado = {
      id: data.id,
      cantidad: data.cantidad,
      nombre: data.nombre,
      factor: data.factor || 1,
      medida: data.medida,
      cod_medida: obtencodigomedida(data.medida, data.tipoproducto || "BIEN"),
      precio: precioFinal,
      precioedita: precioFinal,
      precio_base: data.precio_base || precioFinal,
      preciodescuento: data.preciodescuento,
      tipoproducto: data.tipoproducto || "BIEN",
      operacion: data.operacion,
      valor_unitario: valor_unitario.toFixed(5),
      valor_total: redondear(valorTotal), 
      igv: redondear(igv),
      total_antes_impuestos: redondear(antesimpuesto),
      total_impuestos: redondear(totalImpuesto),
      precioVentaUnitario: redondear(precio_item),
      uuid: crypto.randomUUID() || "",
    };

    // Solo agregamos el nodo "descuentos" si hay algún porcentaje distinto de 0
    if (tieneDescuentosPorcentaje) {
      itemProcesado.descuentos = {
        desc_1: d1,
        desc_2: d2,
        desc_3: d3,
        precioFinal: precioFinal,
        precioBase: data.precio_base || precioFinal,
        precioCatalogo: data.descuentos?.precioCatalogo || data.precio_base || precioFinal
      };
      
      itemProcesado.desc_1 = d1;
      itemProcesado.desc_2 = d2;
      itemProcesado.desc_3 = d3;
    }

    items.push(itemProcesado);
  }

  return {
    item: items,
    totaloperaGravada: redondear(totaloperaGravada),
    totaloperaExonerada: redondear(totaloperaExonerada),
    totaloperaInfafecta: redondear(totaloperaInfafecta),
    total_op_gratuitas: redondear(total_op_gratuitas),
    totalIGV: redondear(totalIGV),
    totalIGV_GRATUITA: redondear(totalIGV_GRATUITA),
    total_cargo: redondear(total_cargo),
  };
}

export const cobrar_js = async (arrayCabecera, array_item) => {
  await Promise.all([
    grabaCabecera(arrayCabecera.numeracion, arrayCabecera),
    grabaDetalle(arrayCabecera.numeracion, array_item),
    sumarCorrelativo(arrayCabecera),
    flujo_caja(arrayCabecera),
    modifica_stock_array("RESTA", array_item),
  ]);
  if (arrayCabecera.tipocomprobante != "T") {
    enviaDocumentoApiSunat(arrayCabecera, array_item);
  }
  return true;
};
async function flujo_caja(cabecera) {
  //console.log(cabecera.forma_pago);

  for (var i = 0; i < cabecera.modopago.length; i++) {
    var data = cabecera.modopago[i];
    if (cabecera.a_cuenta != 0) {
      if (cabecera.forma_pago != "Credito") {
        if (data.monto != "") {
          var flujo = {
            operacion: "ingreso",
            observacion: "VENTA - " + cabecera.numeracion,
            numeracion_doc: cabecera.numeracion,
            modo: data.nombre,
            fecha: cabecera.fecha,
            total: data.monto,
            estado: "activo",
            responsable: store.state.permisos.correo.slice(0, -13),
            sujeto: store.state.permisos.correo.slice(0, -13),
          };
          await nuevoflujo(flujo);
        }
      } else {
        if (data.monto != "") {
          var flujo = {
            operacion: 'credito',
            observacion: 'VENTA CREDITO - ' + cabecera.numeracion,
            numeracion_doc: cabecera.numeracion,
            modo: 'credito',
            fecha: cabecera.fecha,
            total: data.monto,
            estado: "activo",
            responsable: store.state.permisos.correo.slice(0, -13),
            sujeto: store.state.permisos.correo.slice(0, -13),
          };
          await nuevoflujo(flujo);
        }
      }
    }
  }
  return true;
}
async function sumarCorrelativo(data) {
  if (data.tipocomprobante == "T") {
    var valor = (parseInt(data.correlativoDocEmitido) + 1)
      .toString()
      .padStart(8, 0);
    var campo = "ordenticket";
  }
  if (data.tipocomprobante == "B") {
    var valor = (parseInt(data.correlativoDocEmitido) + 1)
      .toString()
      .padStart(8, 0);
    var campo = "ordenboleta";
  }
  if (data.tipocomprobante == "F") {
    var valor = (parseInt(data.correlativoDocEmitido) + 1)
      .toString()
      .padStart(8, 0);
    var campo = "ordenfactura";
  }
  await sumaContador(campo, valor);
  return true;
}
function redondear(valor) {
  return parseFloat(valor).toFixed(store.state.configuracion.decimal);
}
function obtencodigomedida(medida, tipoproducto) {
  if (tipoproducto == "SERVICIO") {
    return "ZZ";
  } else {
    var array = store.state.medidassunat;
    var nomenclatura = "NIU";
    for (var i = 0; i < array.length; i++) {
      if (array[i].nombre == medida) {
        nomenclatura = array[i].corto;
      }
    }
    return nomenclatura;
  }
}

export const modifica_stock_array = async (metodo, arrays) => {
  for (var i = 0; i < arrays.length; i++) {
    var items = arrays[i];
    if (metodo == "SUMA") {
      await suma_stock_app(items);
    }
    if (metodo == "RESTA") {
      await resta_stock_app(items);
    }
  }
  return arrays;
};
export const modifica_stock_unitario = async (metodo, item) => {
  var res = "";
  switch (metodo) {
    case "SUMA":
      res = await suma_stock_app(item);
      break;
    case "RESTA":
      res = await resta_stock_app(item);
      break;
  }
  return res;
};

async function resta_stock_app(data) {
  var producto = store.state.productos.find(
    (id) => String(id.id) === String(data.id)
  );
  if (Boolean(producto)) {
    if (producto.controstock) {
      var nuevo_stock = parseFloat(
        (parseFloat(producto.stock) - parseFloat(data.cantidad)).toFixed(2)
      );
      await editaProducto(data.id, "stock", nuevo_stock);
    }
  }
  return true;
}
async function suma_stock_app(data) {
  var producto = store.state.productos.find(
    (id) => String(id.id) === String(data.id)
  );
  if (Boolean(producto)) {
    if (producto.controstock) {
      var nuevo_stock = parseFloat(
        (parseFloat(producto.stock) + parseFloat(data.cantidad)).toFixed(2)
      );
      await editaProducto(data.id, "stock", nuevo_stock);
    }
  }
  return true;
}
