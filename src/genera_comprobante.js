import store from '@/store/index'
import { grabaCabecera, grabaDetalle, sumaContador } from './db'
import moment from 'moment'
import { pdfGenera } from './pdf_comprobantes'
import { enviaDocumentoApiSunat } from './servidorsunat'


export const cobrar_js = async (cabecera, items) => {
    let resp = await completa_items(items)
    let tt = await procesa_cobro(cabecera, resp)
    return tt
}
export const sumarCorrelativo = async (data, contadores) => {
    if (data == "T") {
        var valor = (parseInt(contadores) + 1).toString().padStart(8, 0)
        var campo = 'ordenticket'
    }
    if (data == "B") {
        var valor = (parseInt(contadores) + 1).toString().padStart(8, 0)
        var campo = 'ordenboleta'
    }
    if (data == "F") {
        var valor = (parseInt(contadores) + 1).toString().padStart(8, 0)
        var campo = 'ordenfactura'
    }
    if (data == "Flujo") {
        var valor = (parseInt(contadores) + 1).toString().padStart(5, 0)
        var campo = "flujocaja"
    }
    if (data == "clientes") {
        var valor = (parseInt(contadores) + 1).toString().padStart(5, 0)
        var campo = "ordenclientes"
    }
    var a = await sumaContador(campo, valor)
    return a
}
async function procesa_cobro(cabecera, data) {
    cabecera.vendedor = store.state.permisos.token
    cabecera.total_op_gravadas = data.totaloperaGravada
    cabecera.igv = data.totalIGV
    cabecera.porcentaje_igv = store.state.configuracion.igv
    cabecera.total_op_exoneradas = data.totaloperaExonerada
    cabecera.total_cargo = data.total_cargo
    cabecera.total_op_gratuitas = data.total_op_gratuitas
    var items = data.item
    await grabaCabecera(cabecera.numeracion, cabecera)
    await grabaDetalle(cabecera.numeracion, items)
    if (cabecera.tipocomprobante != 'T') {
        enviaDocumentoApiSunat(cabecera, items).then((rrr) => {
            console.log(rrr)
        })
    }
    pdfGenera(items, cabecera, store.state.configImpresora.tamano, 'abre')
    return true
}

function completa_items(arrays) {
    var item = []
    var totaloperaGravada = 0
    var totaloperaExonerada = 0
    var totalIGV = 0
    var total_cargo = 0
    var porcentaje_igv = store.state.configuracion.igv / 100
    //var porcentaje_cargo = store.state.configuracion.cargoxconsumo / 100
    var a = new Promise((resolve, reject) => {
        arrays.forEach((items, index, array) => {
            var data = items
            var descuentositem = parseFloat(data.preciodescuento)
            var precio_item = parseFloat(redondear(data.precioedita - (descuentositem / data.cantidad)))
            /*   if (invent.cargoxconsumo && porcentaje_cargo != 0) {
                   var cargo = parseFloat(redondear(precio_item / (parseFloat(porcentaje_cargo) + 1)))
                   var sumcargo = parseFloat(precio_item - cargo)
                   precio_item = cargo
                   total_cargo = total_cargo + parseFloat(sumcargo * data.cantidad)
               }*/
            if (data.operacion == "GRAVADA") {
                var precioVentaUnitario = precio_item
                var valor_unitario = precioVentaUnitario / (1 + (porcentaje_igv))
                var igv = valor_unitario * data.cantidad * porcentaje_igv
                var valorTotal = valor_unitario * data.cantidad
                var antesimpuesto = valor_unitario * data.cantidad
                var totalImpuesto = valor_unitario * data.cantidad * porcentaje_igv
                totaloperaGravada = totaloperaGravada + parseFloat(antesimpuesto)
                totaloperaExonerada = totaloperaExonerada + 0
                totalIGV = totalIGV + parseFloat(totalImpuesto)
            }
            if (data.operacion == "EXONERADA") {
                var precioVentaUnitario = precio_item
                var valor_unitario = precioVentaUnitario
                var igv = 0.00
                var valorTotal = valor_unitario * data.cantidad
                var antesimpuesto = valor_unitario * data.cantidad
                var totalImpuesto = 0.00
                totaloperaGravada = totaloperaGravada + 0
                totaloperaExonerada = totaloperaExonerada + parseFloat(antesimpuesto)
                totalIGV = totalIGV + parseFloat(totalImpuesto)
            }
            item.push({
                id: data.id,
                cantidad: data.cantidad,
                nombre: data.nombre,
                medida: data.medida,
                cod_medida: obtencodigomedida(data.medida, data.tipoproducto),
                precio: data.precio,
                precioedita: data.precio,
                preciodescuento: data.preciodescuento,
                tipoproducto: data.tipoproducto,
                operacion: data.operacion,
                valor_unitario: valor_unitario.toFixed(5),
                valor_total: valorTotal.toFixed(2),
                igv: igv.toFixed(2),
                valor_icbper: 0.00,
                factor_icbper: store.state.configuracion.icbper,
                total_antes_impuestos: antesimpuesto.toFixed(2),
                total_impuestos: totalImpuesto.toFixed(2),
                precioVentaUnitario: redondear(precioVentaUnitario)
            })
            if (index === array.length - 1) {
                var data = {
                    item: item,
                    totaloperaGravada: totaloperaGravada.toFixed(2),
                    totaloperaExonerada: totaloperaExonerada.toFixed(2),
                    total_op_gratuitas: '0.00',
                    totalIGV: totalIGV.toFixed(2),
                    total_cargo: total_cargo.toFixed(2)
                }
                resolve(data)
            };
        })

    })
    a.then((value) => {
        return value
    })
    return a
}
function obtencodigomedida(medida, tipoproducto) {
    if (tipoproducto == 'SERVICIO') {
        return 'ZZ'
    } else {
        var array = store.state.medidassunat
        var nomenclatura = 'NIU'
        for (var i = 0; i < array.length; i++) {
            if (array[i].nombre == medida) {
                nomenclatura = array[i].corto
            }
        }
        return nomenclatura
    }
}
function redondear(valor) {
    return parseFloat(valor).toFixed(store.state.configuracion.decimal)
}
