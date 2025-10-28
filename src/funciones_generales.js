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
    const descuentositem = parseFloat(data.preciodescuento);
    const precio_item = parseFloat(
      redondear(data.precio - descuentositem / data.cantidad)
    );

    let valor_unitario = precio_item;
    let igv = 0;
    let valorTotal = 0;
    let antesimpuesto = 0;
    let totalImpuesto = 0;

    if (data.operacion === "GRAVADA") {
      valor_unitario = precio_item / (1 + porcentaje_igv);
      antesimpuesto = valor_unitario * data.cantidad;
      totalImpuesto = antesimpuesto * porcentaje_igv;
      valorTotal = antesimpuesto;
      totaloperaGravada += antesimpuesto;
      totalIGV += totalImpuesto;
      igv = valor_unitario * data.cantidad * porcentaje_igv;
    }

    if (data.operacion === "EXONERADA") {
      antesimpuesto = precio_item * data.cantidad;
      valorTotal = antesimpuesto;
      totaloperaExonerada += antesimpuesto;
    }

    if (data.operacion === "INAFECTA") {
      antesimpuesto = precio_item * data.cantidad;
      valorTotal = antesimpuesto;
      totaloperaInfafecta += antesimpuesto;
    }
    if (data.operacion == "GRATUITA") {
      //console.log("precios", redondear(descuentositem / data.cantidad))
      var precioVentaUnitario = precio_item;
      valor_unitario = precioVentaUnitario;
      igv = 0.0;
      valorTotal = valor_unitario * data.cantidad;
      antesimpuesto = valor_unitario * data.cantidad;
      totalImpuesto = 0;
      totaloperaGravada = totaloperaGravada + 0;
      totaloperaExonerada = totaloperaExonerada + 0;
      total_op_gratuitas = total_op_gratuitas + parseFloat(antesimpuesto);
      totalIGV = totalIGV + 0;
      totalIGV_GRATUITA = +totalIGV_GRATUITA + 0;
      valor_unitario = 0.0;
      totalImpuesto = 0.0;
      //antesimpuesto = (precioVentaUnitario*parseFloat(data.cantidad))
    }

    if (!data.tipoproducto) {
      data.tipoproducto = "BIEN";
    }

    items.push({
      id: data.id,
      cantidad: data.cantidad,
      nombre: data.nombre,
      factor: data.factor || 1,
      medida: data.medida,
      cod_medida: obtencodigomedida(data.medida, data.tipoproducto),
      precio: data.precio,
      precioedita: data.precio,
      preciodescuento: data.preciodescuento,
      tipoproducto: data.tipoproducto,
      operacion: data.operacion,
      icbper: false,
      cargoxconsumo: data.cargoxconsumo || false,
      valor_unitario: valor_unitario.toFixed(5),
      valor_total: valorTotal.toFixed(2),
      igv: igv.toFixed(2),
      valor_icbper: 0.0,
      factor_icbper: store.state.configuracion.icbper,
      total_antes_impuestos: antesimpuesto.toFixed(2),
      total_impuestos: totalImpuesto.toFixed(2),
      precioVentaUnitario: redondear(precio_item),
      uuid: crypto.randomUUID() || "",
    });
  }

  return {
    item: items,
    totaloperaGravada: totaloperaGravada.toFixed(2),
    totaloperaExonerada: totaloperaExonerada.toFixed(2),
    totaloperaInfafecta: totaloperaInfafecta.toFixed(2),
    total_op_gratuitas: total_op_gratuitas.toFixed(2),
    totalIGV: totalIGV.toFixed(2),
    totalIGV_GRATUITA: totalIGV_GRATUITA.toFixed(2),
    total_cargo: total_cargo.toFixed(2),
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
