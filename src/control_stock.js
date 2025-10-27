import store from '@/store/index'
import { editaProducto } from './db'

export const modifica_stock_array = async (metodo, arrays) => {
    for (var i = 0; i < arrays.length; i++) {
        var items = arrays[i]
        if (metodo == 'SUMA') {
            await suma_stock_app(items)
        }
        if (metodo == 'RESTA') {
            await resta_stock_app(items)
        }
    }
    return arrays
}
export const modifica_stock_unitario = async (metodo, item) => {
    var res = ''
    switch (metodo) {
        case 'SUMA':
            res = await suma_stock_app(item)
            break;
        case 'RESTA':
            res = await resta_stock_app(item)
            break;
    }
    return res
}

async function resta_stock_app(data) {
    var producto = store.state.productos.find(id => String(id.id) === String(data.id))
    if (Boolean(producto)) {
        if (producto.controstock) {
            let delta = data.cantidad * producto.factor;
            if (producto.factor != 1 && data.medida == 'UNIDAD') {
                delta = data.cantidad; // corregido
            }
            var nuevo_stock = parseFloat((parseFloat(producto.stock) - parseFloat(delta)).toFixed(2))
            await editaProducto(data.id, 'stock', nuevo_stock)
        }
    }
    return true
}
async function suma_stock_app(data) {
    var producto = store.state.productos.find(id => String(id.id) === String(data.id))
    if (Boolean(producto)) {
        if (producto.controstock) {
            let delta = data.cantidad * producto.factor;
            if (producto.factor != 1 && data.medida == 'UNIDAD') {
                delta = data.cantidad; // corregido
            }
            var nuevo_stock = parseFloat((parseFloat(producto.stock) + parseFloat(delta)).toFixed(2))
            await editaProducto(data.id, 'stock', nuevo_stock)
        }
    }
    return true
}