import {
  obtenContador,
  grabaAnulacionreferecia,
  grabaCabeceraRA,
  grabaDetalleRA,
  sumaContador,
} from "@/db";
import {
  resumenBajaSunat,
  resumenComprobantes,
  consultasunatTicket,
} from "@/servidorsunat";
import moment from "moment";
export const consuta_ticket = async () => {
  // var snap = await consultasunatTicket("500000316450038");
  //console.log(snap);
};
export const ejecutaresumen = (array) => {
  console.log(array);
  var resp = obtencorrelativo(array.tipocomprobante).then((r) => {
    console.log(r);
    if (array.tipocomprobante == "NC") {
      array.cod_comprobante = "07";
      array.correlativoDocEmitido = array.correlativo;
    }
    if (array.tipocomprobante == "F" || array.tipocomprobante == "NC") {
      var motivo = "Error en Documento";
      var modoanula = "RA";
    } else {
      var motivo = 3;
      var modoanula = "RC";
    }
    var items = [];
    items.push({
      item: 1,
      numeracion: array.numeracion,
      tipo_comprobante: array.cod_comprobante,
      serie: array.serie,
      correlativo: array.correlativoDocEmitido,
      motivo: motivo,
      total_a_pagar: (
        parseFloat(array.total) - parseFloat(array.descuentos)
      ).toFixed(2),
      total_op_gravadas: array.total_op_gravadas,
      total_impuestos: array.igv,
    });
    var a = enviaresumenes(r, items, modoanula, array).then((r) => {
      return r;
    });
    return a;
  });
  return resp;
};

function obtencorrelativo(Tipo) {
  var a = obtenContador()
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        if (Tipo == "F" || Tipo == "NC") {
          return snapshot.val().ordenresumen;
        } else {
          return snapshot.val().ordenresumenc;
        }
      }
    });
  return a;
}

function enviaresumenes(r, arrayItems, modoanula, cabecera) {
  var fecha_1 = moment().format("YYYY-MM-DD");
  var fecha_2 = moment().format("YYYYMMDD");
  var fecha = moment().unix();

  var arrayCabecera = {
    fecha: fecha,
    tipo_comprobante: modoanula,
    fecha_referencia: fecha_1,
    fecha_envio: fecha_1,
    serie: fecha_2,
    correlativo: r,
    estado: "PENDIENTE",
    mensajeSunat: "",
    ticket: "",
  };
  console.log(arrayCabecera);
  if (modoanula == "RA") {
    arrayCabecera.fecha_referencia = moment
      .unix(cabecera.fecha)
      .format("YYYY-MM-DD");
    var a = resumenBajaSunat(arrayCabecera, arrayItems).then((ra) => {
      console.log(ra);
      finaldeanulacion(arrayCabecera, arrayItems, r, modoanula);
      return ra;
    });
    return a;
  } else {
    var a = resumenComprobantes(arrayCabecera, arrayItems).then((ra) => {
      finaldeanulacion(arrayCabecera, arrayItems, r, modoanula);
      return ra;
    });
    return a;
  }
}

function finaldeanulacion(arrayCabecera, arrayItems, correlativo, modoanula) {
  grabaAnulacionreferecia(
    arrayItems[0].numeracion,
    "anulado",
    "Anulado mediante baja Comprobante: " + correlativo
  );

  grabaCabeceraRA(modoanula + correlativo, arrayCabecera);
  grabaDetalleRA(modoanula + correlativo, arrayItems).then((r) => {
    if (modoanula == "RA") {
      var nomcontador = "ordenresumen";
    } else {
      var nomcontador = "ordenresumenc";
    }
    sumaContador(
      nomcontador,
      (parseInt(correlativo) + 1).toString().padStart(4, 0)
    );
  });
}
