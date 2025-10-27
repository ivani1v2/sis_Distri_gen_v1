import store from "@/store/index";
import {
  obtenContador,
  nuevaGuiaremision,
  sumaContador,
  all_detalle_p,
  edita_Cabecera_p,
} from "./db";
import { guia_remision } from "./servidorsunat";

export const guia_masivo = async (array, cabecera) => {
  var data = array;
  var snapshot = await obtenContador().once("value");
  var contador = snapshot.val();
  for (var i = 0; i < data.length; i++) {
    if (data[i].consolida && !Boolean(data[i].num_guia)) {
      // if (data[i].consolida) {
      consultaCorrelativo(data[i], cabecera, contador.orden_guia);
      contador.orden_guia = (parseInt(contador.orden_guia) + 1)
        .toString()
        .padStart(8, 0);
    }
    if (data.length == i + 1) {
      await sumaContador("orden_guia", contador.orden_guia);
      return true;
    }
  }
  return c;
};
async function consultaCorrelativo(comprobante, cabecera_guias, contador) {
  var snapshot = await all_detalle_p(
    cabecera_guias.num_reparto,
    comprobante.numeracion
  ).once("value");
  var array = store.state.clientes.find((e) => e.documento == comprobante.dni);
  var prov = "TRUJILLO";
  var dist = "TRUJILLO";
  if (array != undefined) {
    prov = array.provincia;
    dist = array.distrito;
  }
  //console.log(snapshot.val());
  var lista_productos = snapshot.val();
  cabecera_guias.observacion =
    "Comprobante Referencia : " +
    comprobante.serie +
    "-" +
    comprobante.correlativoDocEmitido;
  cabecera_guias.correlativo = contador;
  cabecera_guias.id = store.state.seriesdocumentos.guia + "-" + contador;
  cabecera_guias.serie = store.state.seriesdocumentos.guia;
  cabecera_guias.cod_documento = comprobante.cod_tipoDocumento;
  cabecera_guias.ruc_destinatario = comprobante.dni;
  cabecera_guias.razonsocial_destinatario = comprobante.cliente;
  cabecera_guias.u_destino = "130101";
  cabecera_guias.dir_destino = comprobante.direccion;
  cabecera_guias.departamento_l = "LA LIBERTAD";
  cabecera_guias.provincia_l = prov;
  cabecera_guias.distrito_l = dist;
  cabecera_guias.medida_t = "KILOGRAMO";
  cabecera_guias.cod_medida_t = "KGM";
  cabecera_guias.peso_total = comprobante.peso_total;
  cabecera_guias.data = lista_productos;

  await Promise.all([
    nuevaGuiaremision(cabecera_guias.id, cabecera_guias),
    guia_remision(cabecera_guias, lista_productos),
    edita_Cabecera_p(
      cabecera_guias.num_reparto,
      comprobante.numeracion,
      "num_guia",
      cabecera_guias.correlativo
    ),
  ]);
  return true;
}
