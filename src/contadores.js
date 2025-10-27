import { obtenContador, sumaContador, obtenContador_externo, actualizaContador_externo } from './db'

export const sumarCorrelativo = async (data, contadores) => {
    var tam = 6
    if (data == 'orden_pacientes') {
        tam = 8
    }
    var valor = (parseInt(contadores) + 1).toString().padStart(tam, 0)
    var a = await sumaContador(data, valor)
    return a
}
export const obten_contador = async (contador) => {
    var a = await obtenContador().child(contador).once("value")
    return a.val()
}