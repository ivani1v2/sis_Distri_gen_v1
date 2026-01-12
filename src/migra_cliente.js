import firebase from 'firebase/app'
import 'firebase/firestore'
import { allEmpresas, allClientes_bd,nuevoCliente_migra,elimina_cliente_migra } from './db'
import { fs } from './db_firestore'

// 🔹 Referencia de destino en Firestore (principal)
const dstClientesFS = (ruc) =>
  fs.collection('general').doc(String(ruc)).collection('clientes')

// 🔹 Referencia de destino en Firestore (colección de búsqueda)
const dstClientesSearch = (ruc) =>
  fs.collection('general').doc(String(ruc)).collection('clientes_search')

// 🔹 Referencia de destino en RTDB para lista ligera


// 🔹 Normaliza el campo "dia" a array siempre
function normalizaDia(valor) {
  if (Array.isArray(valor)) return valor.map(x => String(x).toLowerCase())
  if (typeof valor === 'string' && valor.trim()) return [valor.trim().toLowerCase()]
  return []
}

// 🔹 Quita tildes y convierte a minúsculas
function normalizeString(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// 🔹 Migrar solo una empresa por su RUC (RTDB -> Firestore)
export const migra_clientes_por_ruc = async (ruc) => {
  try {
    if (!ruc) throw new Error('Debe especificar un RUC válido.')

    console.log(`🚀 Iniciando migración de clientes para RUC: ${ruc}`)

    const cliSnap = await allClientes_bd(ruc).once('value')
    const clientes = cliSnap.val() || {}
    const ids = Object.keys(clientes)

    if (ids.length === 0) {
      console.log(`⚠️ No hay clientes para ${ruc}`)
      return
    }

    const colFS = dstClientesFS(ruc)
    const colSearch = dstClientesSearch(ruc)

    let batch = fs.batch()
    let countInBatch = 0
    let total = 0

    for (const id of ids) {
      const raw = clientes[id] || {}
      const docId = String(id).trim() || fs.collection('_tmp').doc().id

      // ✅ Normaliza campo "dia"
      const dia = normalizaDia(raw.dia)

      // ✅ Normalizados auxiliares
      const nombre_lc = normalizeString(raw.nombre)

      // 📄 Documento principal
      const dataPrincipal = {
        ...raw,
        dia,
        nombre_lc,
      }

      // 🔍 Documento en colección de búsqueda (ligero)
      const dataSearch = {
        nombre: raw.nombre || '',
        documento: raw.documento || '',
        nota: raw.nota || '',
      }

      // ➕ Escrituras
      batch.set(colFS.doc(docId), dataPrincipal, { merge: true })
      batch.set(colSearch.doc(docId), dataSearch, { merge: true })
      countInBatch += 2
      total++

      // 🔐 Límite seguro del batch (<500)
      if (countInBatch >= 400) {
        await batch.commit()
        console.log(`✅ Commit parcial (${ruc}): ${total} clientes`)
        batch = fs.batch()
        countInBatch = 0
      }
    }

    if (countInBatch > 0) await batch.commit()
    console.log(`🎯 Migración completa para RUC ${ruc}: ${total} clientes`)
  } catch (err) {
    console.error('❌ Error en migra_clientes_por_ruc:', err)
  }
}

// 🔹 Migrar todas las empresas (RTDB -> Firestore)
export const migra_clientes = async () => {
  try {
    const empSnap = await allEmpresas().once('value')
    const empresas = empSnap.val() || {}
    const keysEmpresas = Object.keys(empresas)

    if (keysEmpresas.length === 0) {
      console.log('⚠️ No hay empresas para migrar.')
      return
    }

    for (const k of keysEmpresas) {
      const empresa = empresas[k] || {}
      const ruc = String(empresa.ruc_asociado || '').trim()

      if (!ruc) {
        console.warn(`Empresa ${k} sin RUC asociado, se omite.`)
        continue
      }

      await migra_clientes_por_ruc(ruc)
    }

    console.log('🚩 Proceso de migración de todas las empresas finalizado.')
  } catch (err) {
    console.error('❌ Error en migra_clientes:', err)
  }
}

/* ================================
   🔄 NUEVO: FIRESTORE -> RTDB LIGERO
   ================================ */

// 🔹 Generar lista ligera de clientes para un solo RUC
export const genera_clientes_ligeros_por_ruc = async (ruc) => {
  try {
    if (!ruc) throw new Error('Debe especificar un RUC válido.')

    console.log(`📥 Leyendo clientes desde Firestore para RUC: ${ruc}`)

    const colFS = dstClientesFS(ruc)
    const snap = await colFS.get()
  console.log(snap)
    if (snap.empty) {
      console.log(`⚠️ Sin clientes en Firestore para RUC ${ruc}`)
      // Podrías limpiar el nodo en RTDB si quieres:
      // await dstClientesLigeroRTDB(ruc).set(null)
      return
    }

    const ligeros = {} // { [idCliente]: { documento, nombre } }

    snap.forEach(doc => {
      const data = doc.data() || {}
      const id = doc.id

      ligeros[id] = {
        id: id,
        nombre: data.nombre,
      }
    })

    // 🔸 Graba lista ligera en RTDB: clientes_ligeros/{RUC}
    console.log(ruc,ligeros)
    await nuevoCliente_migra(ruc,ligeros)

    console.log(`✅ Lista ligera generada en RTDB para RUC ${ruc}: ${Object.keys(ligeros).length} clientes`)
  } catch (err) {
    console.error('❌ Error en genera_clientes_ligeros_por_ruc:', err)
  }
}

// 🔹 Generar lista ligera de clientes para TODAS las empresas
export const genera_clientes_ligeros = async () => {
  try {
    const empSnap = await allEmpresas().once('value')
    const empresas = empSnap.val() || {}
    const keysEmpresas = Object.keys(empresas)

    if (keysEmpresas.length === 0) {
      console.log('⚠️ No hay empresas para generar listas ligeras.')
      return
    }

    for (const k of keysEmpresas) {
      const empresa = empresas[k] || {}
      const ruc = String(empresa.ruc_asociado || '').trim()

      if (!ruc) {
        console.warn(`Empresa ${k} sin RUC asociado, se omite en lista ligera.`)
        continue
      }

      await genera_clientes_ligeros_por_ruc(ruc)
    }

    console.log('🏁 Generación de listas ligeras completada para todas las empresas.')
  } catch (err) {
    console.error('❌ Error en genera_clientes_ligeros:', err)
  }
}

export const limpiar_clientes_por_ruc = async (ruc) => {
  if (!ruc) {
    console.warn('limpiar_clientes_por_ruc: RUC vacío, se omite.')
    return
  }

elimina_cliente_migra(ruc)   // 👈 según tu screenshot

  console.log(`🗑 Eliminando nodo RTDB: /${path}`)

  try {
    await root.child(path).set(null)   // o .remove()
    console.log(`✅ Nodo _clientes eliminado para RUC ${ruc}`)
  } catch (err) {
    console.error(`❌ Error al eliminar _clientes para RUC ${ruc}:`, err)
  }
}
