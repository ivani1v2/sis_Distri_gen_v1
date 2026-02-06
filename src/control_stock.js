// control_stock.js
import store from "@/store/index";
import { editaProducto, getProductoRef } from "./db"; 
// ✅ NUEVO: getProductoRef(id) debe devolver la referencia RTDB al producto (ver abajo)

export const modifica_stock_array = async (metodo, arrays) => {
  for (let i = 0; i < arrays.length; i++) {
    const item = arrays[i];
    await modifica_stock_unitario(metodo, item);
  }
  return arrays;
};

export const modifica_stock_unitario = async (metodo, item) => {
  switch (metodo) {
    case "SUMA":
      return await suma_stock_app(item);
    case "RESTA":
      return await resta_stock_app(item);
    default:
      return true;
  }
};

// ---------------------------
// Helpers
// ---------------------------
function getProductoFromStore(id) {
  return (store.state.productos || []).find((p) => String(p.id) === String(id)) || null;
}

function calcDelta(producto, data) {
  // ✅ mantiene tu lógica
  let delta = Number(data.cantidad || 0) * Number(producto.factor || 1);
  if (Number(producto.factor) !== 1 && String(data.medida).toUpperCase() === "UNIDAD") {
    delta = Number(data.cantidad || 0);
  }
  // redondeo base
  return Number.isFinite(delta) ? delta : 0;
}

async function aplicaDeltaAtomicoRTDB(id, deltaSigned) {
  // deltaSigned puede ser + o -
  const ref = getProductoRef(id);
  if (!ref) throw new Error("getProductoRef(id) no devolvió ref válida");

  // ✅ transacción atómica sobre "stock"
  // Si tu stock está en otra ruta/campo, ajusta aquí.
  await ref.child("stock").transaction((current) => {
    const cur = Number(current || 0);
    const next = cur + Number(deltaSigned || 0);
    // redondeo 2 decimales
    return Number(next.toFixed(2));
  });
}

// ---------------------------
// SUMA / RESTA (atómico)
// ---------------------------
async function resta_stock_app(data) {
  const producto = getProductoFromStore(data.id);
  if (!producto) return true;

  if (!producto.controstock) return true;

  const delta = calcDelta(producto, data);
  if (delta <= 0) return true;

  // ✅ ATÓMICO: resta
  await aplicaDeltaAtomicoRTDB(data.id, -delta);

  // (opcional) Mantener compatibilidad: si editaProducto hace otras cosas, lo puedes dejar
  // pero OJO: si editaProducto escribe stock directo, NO lo uses aquí o romperás lo atómico.
  // await editaProducto(data.id, "stock", nuevo_stock)  // ❌ ya no

  return true;
}

async function suma_stock_app(data) {
  const producto = getProductoFromStore(data.id);
  if (!producto) return true;

  if (!producto.controstock) return true;

  const delta = calcDelta(producto, data);
  if (delta <= 0) return true;

  // ✅ ATÓMICO: suma
  await aplicaDeltaAtomicoRTDB(data.id, +delta);

  return true;
}
