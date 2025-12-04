// help_mov_tranferencia.js
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
    nuevoMovimiento,
    obtenContador,
    sumaContador,
    nuevoMovimiento_otrabd,
    actualiza_transferencia,
    elmina_mov_kardex,           // origen
    elmina_mov_kardex_otrabd     // destino
} from '@/db';

export async function registrarMovimientosTransferencia(doc) {
    try {
        if (!doc || !Array.isArray(doc.productos) || doc.productos.length === 0) return;

        // 🕒 Tiempos base
        const ts = doc.fecha_unix || moment().unix();
        const fecha_creacion = moment().unix();
        const periodo = doc.periodo || moment.unix(ts).format('YYYYMM');

        // 👤 Responsable: sacado del usuario de la transferencia (ej: correo)
        let responsable = '';
        if (doc.usuario) {
            // similar a slice(0, -13) pero más genérico
            responsable = String(doc.usuario).replace(/@.*/, '');
        }

        const totalNumber = Number(doc.total || 0);
        const total = totalNumber.toFixed(2);

        // 🧾 Detalle en formato de movimientos (mismo estilo que AJUSTE/MERMA)
        const detalle = doc.productos.map(p => {
            const cantidad = Number(p.cantidad) || 0;
            const factor   = Number(p.factor || 1);
            const costo    = Number(p.precio || p.costo || 0);

            return {
                id: String(p.id),
                nombre: p.nombre,
                medida: p.medida || 'UNIDAD',
                modo_cant: p.modo_cant || 'entero',

                cantidad,
                cant_ingresada: cantidad,
                factor,

                operacion: 'GRAVADA',

                // para kardex
                costo,
                costo_nuevo: costo,

                stock: Number(p.stock || 0),

                // clave estable como en tus otros movimientos
                uuid: p.uuid || uuidv4(),
            };
        });

        // 🔢 Obtener contador actual
        const snapshot = await obtenContador().once('value');
        let conta = snapshot.val()?.orden_movimientos;

        if (!conta) {
            conta = '00001';
        }

        const idSalida = conta;
        const idIngreso = (parseInt(conta, 10) + 1).toString().padStart(5, '0');
        const siguiente = (parseInt(idIngreso, 10) + 1).toString().padStart(5, '0');

        // 🧱 Base común de la cabecera (misma estructura que nuevo_ajuste)
        const baseCommon = {
            periodo,
            operacion: 'AJUSTE',              // se mostrará en la sección de Entradas/Salidas
            fecha_creacion,
            fecha_emision: ts,
            fecha_ingreso: ts,
            cod_doc: '00',
            sreferencia: doc.sede_origen,
            creferencia: doc.sede_destino,
            num_doc: '',
            modo_pago: '',
            observacion: doc.observacion || 'TRANSFERENCIA ENTRE SEDES',
            baseimponible: totalNumber,
            igv: 0,
            porc_igv: 0,
            tot_gratuita: 0,
            tot_exonerada: 0,
            total,
            responsable: responsable || 'TRANSFERENCIA',
            data: detalle,
        };

        // 📤 Movimiento SALIDA (sede origen)
        const movSalida = {
            ...baseCommon,
            id: 'T' + idSalida,
            tipodocumento: 'SALIDA',
            modo_ajuste: 'SALIDA',
            motivo: 'TRANSFERENCIA ENTRE SEDES',
            creferencia: 'SALIDA',
            nom_proveedor: 'SALIDA',
        };

        // 📥 Movimiento INGRESO (sede destino)
        const movIngreso = {
            ...baseCommon,
            id: 'T' + idIngreso,
            tipodocumento: 'ENTRADA',
            modo_ajuste: 'ENTRADA',
            motivo: 'TRANSFERENCIA ENTRE SEDES',
            creferencia: 'ENTRADA',
            nom_proveedor: 'ENTRADA',
        };

        // 🔄 Grabar ambos movimientos en la misma secuencia del contador
        await nuevoMovimiento(movSalida.id, movSalida);
        await nuevoMovimiento_otrabd(baseCommon.creferencia, movIngreso.id, movIngreso);

        // Dejar el contador en el siguiente valor libre
        await sumaContador('orden_movimientos', siguiente);

        // Guarda los IDs en la transferencia para poder anular después
        const idTrans = doc.key || doc.id;
        if (idTrans) {
            await actualiza_transferencia(idTrans, {
                mov_salida_id: movSalida.id,
                mov_ingreso_id: movIngreso.id,
            });
        }

        console.log('Movimientos de transferencia creados OK', movSalida.id, movIngreso.id);
    } catch (e) {
        console.error('Error al registrar movimientos de transferencia:', e);
    }
}

// ANULA movimientos (SALIDA + INGRESO) cuando se anula la transferencia
export async function anularMovimientosTransferencia(transferencia) {
    try {
        if (!transferencia) return;

        const {
            mov_salida_id,
            mov_ingreso_id,
            sede_destino
        } = transferencia;

        // Si no hay nada guardado, no hacemos nada
        if (!mov_salida_id && !mov_ingreso_id) {
            console.log('Transferencia sin IDs de movimiento, nada que borrar');
            return;
        }

        // 🗑️ Borrar movimiento de ORIGEN (BD actual)
        if (mov_salida_id) {
            try {
                await elmina_mov_kardex(mov_salida_id);
                console.log('Movimiento SALIDA eliminado:', mov_salida_id);
            } catch (e) {
                console.error('Error al eliminar movimiento de origen:', mov_salida_id, e);
            }
        }

        // 🗑️ Borrar movimiento de DESTINO (otra BD)
        if (mov_ingreso_id && sede_destino) {
            try {
                await elmina_mov_kardex_otrabd(sede_destino, mov_ingreso_id);
                console.log('Movimiento INGRESO eliminado en', sede_destino, ':', mov_ingreso_id);
            } catch (e) {
                console.error('Error al eliminar movimiento de destino:', mov_ingreso_id, e);
            }
        }

        console.log('Anulación de movimientos de transferencia completada');
    } catch (e) {
        console.error('Error en anularMovimientosTransferencia:', e);
    }
}


// EDITA (reemplaza) movimientos de una transferencia:
// 1) borra los movimientos antiguos (SALIDA + INGRESO)
// 2) vuelve a generar movimientos con la transferencia editada
export async function rehacerMovimientosTransferencia(transferenciaAnterior, transferenciaNueva) {
    try {
        if (!transferenciaAnterior || !transferenciaNueva) {
            console.log('rehacerMovimientosTransferencia: falta transferenciaAnterior o transferenciaNueva');
            return;
        }

        // 1️⃣ BORRAR movimientos anteriores (solo movimientos, NO marca la transferencia como anulada)
        await anularMovimientosTransferencia(transferenciaAnterior);

        // 2️⃣ VOLVER A CREAR con la info nueva
        //    Aseguramos que conserve el mismo id/key de transferencia
        const docNuevo = {
            ...transferenciaNueva,
            key: transferenciaAnterior.key || transferenciaAnterior.id || transferenciaNueva.key || transferenciaNueva.id,
        };

        await registrarMovimientosTransferencia(docNuevo);

        console.log('rehacerMovimientosTransferencia OK');
    } catch (e) {
        console.error('Error en rehacerMovimientosTransferencia:', e);
    }
}
