import { allEmpresas, db } from "../db";

const BDS_IGNORADAS = ["BD97", "BD98", "BD99"];

function tieneValor(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== "";
}

function estaActivo(item) {
  return item.activo !== false;
}

export async function buscarProductosConPromocionesPrecio() {
  console.log("🔎 Buscando productos que usan promociones tipo precio...\n");

  const resultados = [];
  let totalPromos = 0;
  let totalProductos = 0;

  try {
    const empSnap = await allEmpresas().once("value");
    const empresas = empSnap.val() || {};
    const keysEmpresas = Object.keys(empresas);

    for (const key of keysEmpresas) {
      const empresa = empresas[key] || {};

      const bd = String(
        empresa.bd ||
        empresa.base ||
        empresa.baseDatos ||
        empresa.ruc_asociado ||
        ""
      ).trim();

      if (!bd) continue;
      if (BDS_IGNORADAS.includes(bd)) continue;

      console.log(`📌 Revisando ${bd}`);

      const bonoSnap = await db
        .database()
        .ref(`${bd}/kardex/Bono`)
        .once("value");

      if (!bonoSnap.exists()) continue;

      const promos = {};

      bonoSnap.forEach((bonoItemSnap) => {
        const bono = bonoItemSnap.val() || {};
        const tipo = String(bono.tipo || "").trim().toLowerCase();

        if (tipo !== "precio") return;
        if (!estaActivo(bono)) return;
        if (!tieneValor(bono.escala_may1)) return;
        if (!tieneValor(bono.precio_may1)) return;

        const codigoPromo = String(
          bono.codigo || bono.id || bonoItemSnap.key || ""
        ).trim();

        if (!codigoPromo) return;

        promos[codigoPromo] = {
          key: bonoItemSnap.key,
          codigo: codigoPromo,
          nombre: bono.nombre || "",
          id_grupo: bono.id_grupo || "",
          escala_may1: bono.escala_may1 || "",
          escala_may2: bono.escala_may2 || "",
          precio_may1: bono.precio_may1 || "",
          precio_may2: bono.precio_may2 || "",
        };
      });

      const codigosPromo = Object.keys(promos);

      if (codigosPromo.length === 0) continue;

      totalPromos += codigosPromo.length;

      const productosSnap = await db
        .database()
        .ref(`${bd}/productos`)
        .once("value");

      if (!productosSnap.exists()) continue;

      productosSnap.forEach((prodSnap) => {
        const prod = prodSnap.val() || {};

        const grupoPrecio = String(prod.grupo_precio || "").trim();

        if (!grupoPrecio) return;
        if (!promos[grupoPrecio]) return;

        const promo = promos[grupoPrecio];

        totalProductos++;

        resultados.push({
          bd,
          producto_key: prodSnap.key,
          producto_id: prod.id || prodSnap.key,
          producto_codigo: prod.codigo || prod.codbarra || "",
          producto_nombre: prod.nombre || "",
          producto_precio: prod.precio || "",
          producto_medida: prod.medida || "",
          producto_factor: prod.factor || "",
          grupo_precio: grupoPrecio,

          promo_codigo: promo.codigo,
          promo_nombre: promo.nombre,
          promo_key: promo.key,
          promo_id_grupo: promo.id_grupo,
          promo_escala_may1: promo.escala_may1,
          promo_precio_may1: promo.precio_may1,
          promo_escala_may2: promo.escala_may2,
          promo_precio_may2: promo.precio_may2,

          ruta_producto: `${bd}/productos/${prodSnap.key}`,
          ruta_promo: `${bd}/kardex/Bono/${promo.key}`,
        });
      });
    }

    console.log(`\n✅ Promociones válidas revisadas: ${totalPromos}`);
    console.log(`✅ Productos encontrados usando promociones: ${totalProductos}\n`);

    if (resultados.length > 0) {
      console.table(resultados);
    } else {
      console.log("No se encontraron productos usando esas promociones.");
    }

    return resultados;
  } catch (error) {
    console.error("❌ Error buscando productos con promociones:", error);
    return [];
  }
}