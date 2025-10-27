import store from '@/store/index'
import axios from "axios"
import { db,grabaCabecera,grabaEstadoComprobante,grabaDetalle,grabaCabeceraNCD,grabaDetalleNCD } from '@/db'
import QR from 'qrcode-base64'
import { pdfGenera} from '@/pdf'
import moment from 'moment'

export const envioGuia = (arrayCabecera,array) => {

    grabaCabeceraNCD(arrayCabecera.tipocomprobante+arrayCabecera.correlativo,arrayCabecera)
    grabaDetalleNCD(arrayCabecera.tipocomprobante+arrayCabecera.correlativo,array)

    var rutaFirma = store.state.baseDatos.nombrefirma
    var passFirma = store.state.baseDatos.passfirma
    var ruc = store.state.baseDatos.ruc
    if(store.state.baseDatos.pruebas){
      var servidorsunat = "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService"
    }else{                  
      var servidorsunat = "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl"
    }
    var arrayEmisor = {    
      tipo_documento : 6,
      ruc : store.state.baseDatos.ruc,
      razon_social : store.state.baseDatos.name,
      usuario_sol: store.state.baseDatos.usuariosol,
      clave_sol:store.state.baseDatos.clavesol
      }

      var arrayItems = []
      var totaloperaGravada = 0
      var totalIGV = 0
    
      for(var i=0;i<array.length;i++){ 

        var unidads = obtencodigomedida(array[i].medida)  
        if(array[i].tipoproducto=="SERVICIO"){
          unidads = "ZZ"
        }

        var cantidad = array[i].cantidad
        var nombre = array[i].nombre
        var descuentositem = parseFloat(array[i].preciodescuento)
        var precioVentaUnitario = redondear((array[i].precioedita-redondear(descuentositem/cantidad)))
        var valorUnitario = precioVentaUnitario/1.18 //sin igv
        var valorTotal = redondear(valorUnitario*cantidad)
        var antesimpuesto = redondear(valorUnitario*cantidad)
        var totalImpuesto = redondear(valorUnitario*cantidad*0.18)
        totaloperaGravada = totaloperaGravada + parseFloat(antesimpuesto)
        totalIGV = totalIGV + parseFloat(totalImpuesto)
        
        arrayItems.push({
          item  : i+1,
          cantidad   : cantidad,
          unidad   : unidads,
          nombre : nombre,
          valor_unitario : redondear(valorUnitario),     // precio sin igv unitario
          precio_lista : precioVentaUnitario, //precio venta
          valor_total : valorTotal,
          igv  : totalImpuesto,
          total_antes_impuestos : antesimpuesto,
          total_impuestos : totalImpuesto,
          codigos : ["S","10","1000","IGV","VAT"]
        })
       }       

       var arrayCabecerasunat = { 
        tipo_comprobante: '07', 
        moneda          : "PEN",
        serie           : arrayCabecera.serie,
        correlativo     : arrayCabecera.correlativo,
        total_op_gravadas : redondear(totaloperaGravada),
        igv          : redondear(totalIGV),
        total_impuestos    : redondear(totalIGV),
        total_a_pagar      : redondear(totaloperaGravada + totalIGV),//moment.unix(arrayCabecera.fecha).format('hh:mm A DD/MM')
        fecha_emision      : moment.unix(arrayCabecera.fecha).format('YYYY-MM-DD'),
        codigo_motivo       :  "01",
        descripcion_motivo  :  "ANULACION DE LA OPERACION",
        tipo_comp_ref       :   arrayCabecera.tipo_comp_ref,
        serie_comp_ref      :   arrayCabecera.serie_comp_ref,
        correlativo_comp_ref:   arrayCabecera.correlativo_comp_ref
      }
      var bodyFormData = new FormData();
      bodyFormData.append('funcion', 'NC');
      bodyFormData.append('usuario', ruc);
      bodyFormData.append('rutafirma', rutaFirma);
      bodyFormData.append('passfirma', passFirma);
      bodyFormData.append('servidorsunat', servidorsunat);
      bodyFormData.append('emisor', JSON.stringify(arrayEmisor));
      bodyFormData.append('cabecera', JSON.stringify(arrayCabecerasunat));
      bodyFormData.append('items', JSON.stringify(arrayItems));
    var resp =  axios({
      method: 'POST',
      url: 'https://factura-peru.uc.r.appspot.com/',
      data: bodyFormData,
      headers: { "Content-Type": "multipart/form-data" },
  }).then(response => {
    return response.data

  }).catch(function(error) {
    return error
  });
  return resp
}

function obtencodigomedida(medida){
   var array = store.state.medidassunat
   var nomenclatura = 'NIU'
   for(var i=0;i<array.length;i++){ 
     if(array[i].nombre==medida){
      nomenclatura = array[i].corto
     }
   }
   return nomenclatura
}