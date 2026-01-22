/**
 * migracion_bonos.js
 * ---------------------------------------------------------
 * MIGRA (1 sola vez) los bonos unitarios de productos (tiene_bono=true + lista_bono[])
 * hacia bonos_globales (tipo:"bono") y enlaza automáticamente cada producto con grupo_bono="Bxxxxx".
 *
 * Requisitos:
 *  - Debes tener acceso a: store, allBono(), nuevoBono(), nuevoProducto()
 *  - store.state.productos debe estar cargado.
 *
 * Uso:
 *  1) Importa y ejecuta runMigracionBonosUnitariosToGlobales()
 *  2) Espera a que termine (mira consola).
 */

import store from "@/store";

// Ajusta estas rutas según tu proyecto:
import { allBono, nuevoBono, nuevoProducto } from "@/db"; // <-- AJUSTA

// -------------------- helpers --------------------
function _suffixNum(cod) {
  if (!cod || typeof cod !== "string") return 0;
  const m = cod.match(/^[A-Z](\d+)$/i);
  return m ? Number(m[1]) : 0;
}

function _nextCodigoBonosGlobales(tipo, movimientosActuales) {
  const pref = tipo === "precio" ? "P" : "B";
  const nums = (movimientosActuales || [])
    .filter((m) => m?.tipo === tipo && typeof (m.codigo || m.id) === "string")
    .map((m) => _suffixNum(m.codigo || m.id))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${pref}${String(max + 1).padStart(5, "0")}`;
}

function _buildBonoGlobalFromProducto(prod) {
  const lista = Array.isArray(prod.lista_bono) ? prod.lista_bono : [];

  const reglas = lista
    .filter(Boolean)
    .map((r, idx) => ({
      id: idx + 1,
      apartir_de: Number(r.apartir_de) || 0,
      cantidad_bono: Number(r.cantidad ?? r.cantidad_bono) || 0,
      cantidad_max: null,
      codigo: String(r.cod_producto || r.codigo || prod.id),
    }))
    .filter((x) => x.apartir_de > 0 && x.cantidad_bono > 0 && x.codigo);

  reglas.sort((a, b) => a.apartir_de - b.apartir_de);

  return {
    tipo: "bono",
    activo: true,
    nombre: `BONO ${prod.id} - ${prod.nombre}`,
    observacion: `Auto generado desde lista_bono del producto ${prod.id}`,
    proveedor: prod.proveedor || null,
    fecha_vencimiento: null,
    data: reglas,
    creado: Date.now(),
    usuario: store?.state?.usuario || null,
  };
}

/**
 * Obtiene bonos_globales existentes (allBono) normalizado a array
 */
async function _getBonosGlobalesActuales() {
  const snap = await allBono().once("value");
  const val = typeof snap.val === "function" ? snap.val() : null;

  if (Array.isArray(val)) return val.filter(Boolean);
  if (val && typeof val === "object") return Object.values(val).filter(Boolean);
  return [];
}

/**
 * Ejecuta migración:
 * - por cada producto con tiene_bono=true, crea 1 bono_global tipo bono (Bxxxxx)
 * - asigna producto.grupo_bono = Bxxxxx
 * - (opcional recomendado) desactiva bono unitario en producto: tiene_bono=false y lista_bono=[]
 */
export async function runMigracionBonosUnitariosToGlobales(options = {}) {
  const {
    // si true, luego de migrar, deja el producto sin bono unitario (recomendado para no duplicar lógica)
    limpiarBonoUnitario = true,

    // si true, NO crea bono global si el producto ya tiene grupo_bono asignado
    skipIfProductoYaTieneGrupoBono = true,

    // si true, NO crea bono global si no hay reglas válidas en lista_bono
    skipIfNoReglas = true,
  } = options;

  const productos = (store.state.productos || []).filter(Boolean);

  // Solo productos con bono unitario activo
  let conBonos = productos.filter(
    (p) => p && (p.tiene_bono === true || !!p.grupo_bono),
  );

  console.log(`🟦 Productos candidatos (tiene_bono=true): ${conBonos.length}`);

  // bonos_globales actuales para correlativos
  const movimientosActuales = await _getBonosGlobalesActuales();

  // contador de grupos bono (id_grupo)
  let contadorGrupoBono = movimientosActuales.filter(
    (m) => m?.tipo === "bono",
  ).length;

  let creados = 0;
  let enlazados = 0;
  let saltados = 0;
  let errores = 0;

  for (const p of conBonos) {
    try {
      if (p.grupo_bono) {
        if (
          limpiarBonoUnitario &&
          (p.tiene_bono === true || (p.lista_bono || []).length)
        ) {
          const productoActualizado = {
            ...p,
            tiene_bono: false,
            lista_bono: [],
          };
          await nuevoProducto(String(p.id), productoActualizado);
          console.log(
            `🧹 Limpio bono unitario: ${p.id} (ya tenía grupo_bono=${p.grupo_bono})`,
          );
        }
        saltados++;
        continue;
      }
      const payload = _buildBonoGlobalFromProducto(p);

      if (skipIfNoReglas && (!payload.data || !payload.data.length)) {
        saltados++;
        console.log(`🟨 SKIP ${p.id} - sin reglas válidas`);
        continue;
      }

      // crea bono global
      const newCode = _nextCodigoBonosGlobales("bono", movimientosActuales);
      contadorGrupoBono += 1;

      payload.codigo = newCode;
      payload.id = newCode;
      payload.id_grupo = contadorGrupoBono;

      await nuevoBono(newCode, payload);
      movimientosActuales.push(payload);
      creados++;

      // enlaza producto al bono global
      const productoActualizado = {
        ...p,
        grupo_bono: newCode,
      };

      if (limpiarBonoUnitario) {
        productoActualizado.tiene_bono = false;
        productoActualizado.lista_bono = [];
      }

      // guarda producto actualizado
      await nuevoProducto(String(p.id), productoActualizado);
      enlazados++;

      console.log(`✅ ${p.id} -> grupo_bono=${newCode}`);
    } catch (e) {
      errores++;
      console.error(`❌ Error en producto ${p?.id}`, e);
    }
  }

  console.log("==========================================");
  console.log("✅ Migración finalizada");
  console.log("Bonos globales creados:", creados);
  console.log("Productos enlazados:", enlazados);
  console.log("Saltados:", saltados);
  console.log("Errores:", errores);
  console.log("==========================================");

  // snackbar si tienes commit disponible
  if (store?.commit) {
    store.commit(
      "dialogosnackbar",
      `Migración OK. Creados:${creados} Enlazados:${enlazados} Saltados:${saltados} Errores:${errores}`,
    );
  }

  return { creados, enlazados, saltados, errores };
}

/**
 * Ejemplo rápido:
 * runMigracionBonosUnitariosToGlobales({ limpiarBonoUnitario: true })
 */
