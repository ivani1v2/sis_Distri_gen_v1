import store from "@/store/index";

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const medidaOf = (v) =>
  String(v || "UNIDAD")
    .trim()
    .toUpperCase();

const esGratuita = (v) =>
  String(v?.operacion || "")
    .trim()
    .toUpperCase() === "GRATUITA";

const roundWith = (redondear, n) =>
  redondear ? redondear(n) : Number(n || 0).toFixed(2);

const productoOf = (productos, id) =>
  productos.find((p) => String(p.id) === String(id));

const precioProducto = (producto, medida, fallback = 0, tipoPrecio = "normal") => {
  if (!producto) return toNum(fallback, 0);

  let precio = toNum(producto.precio, fallback);
  if (tipoPrecio === "may1") precio = toNum(producto.precio_may1, precio);
  if (tipoPrecio === "may2") precio = toNum(producto.precio_may2, precio);

  const factor = toNum(producto.factor, 1) || 1;
  if (factor > 1 && medidaOf(medida) !== "UNIDAD") precio *= factor;

  return precio;
};

const pesoLinea = (linea, producto) => {
  const cantidad = toNum(linea.cantidad, 0);
  const factor = toNum(linea.factor || producto?.factor, 1) || 1;
  const pesoUnit = toNum(producto?.peso ?? linea.peso, 0);
  const unidades = medidaOf(linea.medida) === "UNIDAD" ? cantidad : cantidad * factor;
  return Number((pesoUnit * unidades).toFixed(4));
};

export function agregarLista({ listaActual = [], nuevosItems = [], redondear, createUUID }) {
  const lista = Array.isArray(listaActual) ? [...listaActual] : [];
  const items = Array.isArray(nuevosItems) ? nuevosItems : [nuevosItems];
  const nuevoUuid = () => (typeof createUUID === "function" ? createUUID() : create_UUID()).substring(29);

  const buildLinea = (raw = {}) => {
    const productos = store.state.productos || [];
    const producto = productoOf(productos, raw.id ?? raw.cod_producto);
    const medida = medidaOf(raw.medida || producto?.medida);
    const cantidad = toNum(raw.cantidad, 0);
    const gratuita = esGratuita(raw);
    const precioBase = precioProducto(producto, medida, raw.precio_base ?? raw.precio ?? 0);
    const precio = gratuita ? 0 : toNum(raw.precio, precioBase);

    return {
      uuid: raw.uuid || nuevoUuid(),
      id: raw.id ?? raw.cod_producto ?? "",
      nombre: String(raw.nombre || producto?.nombre || ""),
      cantidad,
      medida,
      factor: toNum(raw.factor || producto?.factor, 1) || 1,
      precio,
      precio_base: gratuita ? Number(precioBase.toFixed(4)) : precio,
      preciodescuento: gratuita ? 0 : toNum(raw.preciodescuento, 0),
      tipoproducto: String(raw.tipoproducto || producto?.tipoproducto || "BIEN"),
      operacion: gratuita ? "GRATUITA" : String(raw.operacion || "GRAVADA").trim().toUpperCase(),
      peso: pesoLinea(raw, producto),
      controstock: raw.controstock === true || producto?.controstock === true,
      totalLinea: gratuita ? "0.00" : roundWith(redondear, precio * cantidad),
      ...(raw.bono_auto === true ? { bono_auto: true } : {}),
    };
  };

  const buscar = (id, medida, gratuita) =>
    lista.find(
      (x) =>
        String(x.id) === String(id) &&
        medidaOf(x.medida) === medida &&
        esGratuita(x) === gratuita,
    );

  for (const raw of items) {
    const item = buildLinea(raw);
    const gratuita = esGratuita(item);
    const existente = buscar(item.id, item.medida, gratuita);

    if (existente) {
      existente.cantidad = toNum(existente.cantidad, 0) + item.cantidad;
      existente.peso = toNum(existente.peso, 0) + item.peso;
      existente.totalLinea = gratuita
        ? "0.00"
        : roundWith(redondear, toNum(existente.precio, 0) * toNum(existente.cantidad, 0));
      continue;
    }

    lista.push(item);
  }

  return lista;
}

export function aplicaPreciosYBonos({ lineas = [], redondear } = {}) {
  const productos = store.state.productos || [];
  const bonos = store.state.bonos || {};
  const recargo = store.state.recargo_credito || {};

  const aplicarRecargo =
    recargo.formaPago === "CREDITO" &&
    recargo.aplicarRecargo === true &&
    toNum(recargo.porcentajeRecargo, 0) > 0;

  const factorRecargo = aplicarRecargo
    ? 1 + toNum(recargo.porcentajeRecargo, 0) / 100
    : 1;

  const lista = (Array.isArray(lineas) ? lineas : [])
    .filter((item) => !(item?.bono_auto === true && esGratuita(item)))
    .map((raw = {}) => {
      const producto = productoOf(productos, raw.id ?? raw.cod_producto);
      const medida = medidaOf(raw.medida || producto?.medida);
      const cantidad = toNum(raw.cantidad, 0);
      const gratuita = esGratuita(raw);
      const precioRef = precioProducto(producto, medida, raw.precio_base ?? raw.precio ?? 0);
      const precio = gratuita ? 0 : toNum(raw.precio, precioRef);

      return {
        uuid: raw.uuid || create_UUID().substring(29),
        id: raw.id ?? raw.cod_producto ?? "",
        nombre: String(raw.nombre || producto?.nombre || ""),
        cantidad,
        medida,
        factor: toNum(raw.factor || producto?.factor, 1) || 1,
        precio,
        precio_base: gratuita ? Number(precioRef.toFixed(4)) : toNum(raw.precio_base, precio),
        preciodescuento: gratuita ? 0 : toNum(raw.preciodescuento, 0),
        tipoproducto: String(raw.tipoproducto || producto?.tipoproducto || "BIEN"),
        operacion: gratuita ? "GRATUITA" : String(raw.operacion || "GRAVADA").trim().toUpperCase(),
        peso: pesoLinea(raw, producto),
        controstock: raw.controstock === true || producto?.controstock === true,
        totalLinea: gratuita ? "0.00" : roundWith(redondear, cantidad * precio),
        ...(raw.bono_auto === true ? { bono_auto: true } : {}),
      };
    });

  const unidadesEnLista = (id) =>
    lista.reduce((total, item) => {
      if (String(item.id) !== String(id)) return total;
      const factor = toNum(item.factor, 1) || 1;
      const cantidad = toNum(item.cantidad, 0);
      return total + (medidaOf(item.medida) === "UNIDAD" ? cantidad : cantidad * factor);
    }, 0);

  const gruposPrecio = {};

  lista.forEach((linea) => {
    if (esGratuita(linea)) return;

    const producto = productoOf(productos, linea.id);
    const grupo = producto?.grupo_precio;
    if (!grupo) return;

    if (!gruposPrecio[grupo]) gruposPrecio[grupo] = { lineas: [], totalCajas: 0 };

    const factor = toNum(linea.factor || producto.factor, 1) || 1;
    const cantidad = toNum(linea.cantidad, 0);
    const cajasEquivalentes = medidaOf(linea.medida) === "UNIDAD" ? cantidad / factor : cantidad;

    gruposPrecio[grupo].lineas.push({ linea, producto });
    gruposPrecio[grupo].totalCajas += cajasEquivalentes;
  });

  const tipoPrecioPorGrupo = {};

  Object.keys(gruposPrecio).forEach((grupoId) => {
    const config = bonos[grupoId];
    if (!config || config.activo !== true || config.tipo !== "precio") return;

    const total = gruposPrecio[grupoId].totalCajas;
    const escala1 = toNum(config.escala_may1, 0);
    const escala2 = toNum(config.escala_may2, 0);

    tipoPrecioPorGrupo[grupoId] =
      escala2 > 0 && total >= escala2
        ? "may2"
        : escala1 > 0 && total >= escala1
          ? "may1"
          : "normal";
  });

  lista.forEach((linea) => {
    const producto = productoOf(productos, linea.id);

    if (esGratuita(linea)) {
      const precioRef = precioProducto(producto, linea.medida, linea.precio_base || linea.precio || 0);
      linea.precio = 0;
      linea.precio_base = Number(precioRef.toFixed(4));
      linea.preciodescuento = 0;
      linea.totalLinea = "0.00";
      linea.peso = pesoLinea(linea, producto);
      return;
    }

    const grupo = producto?.grupo_precio;
    const tipoPrecio = grupo && tipoPrecioPorGrupo[grupo] ? tipoPrecioPorGrupo[grupo] : "normal";
    const precioBase = precioProducto(producto, linea.medida, linea.precio_base || linea.precio || 0, tipoPrecio);
    const precioFinal = Number((precioBase * factorRecargo).toFixed(4));

    linea.precio = precioFinal;
    linea.precio_base = precioFinal;
    linea.totalLinea = roundWith(redondear, precioFinal * toNum(linea.cantidad, 0));
    linea.peso = pesoLinea(linea, producto);
  });

  const gruposBono = {};

  lista.forEach((linea) => {
    if (esGratuita(linea)) return;

    const producto = productoOf(productos, linea.id);
    const grupoBono = producto?.grupo_bono;
    if (!grupoBono) return;

    if (!gruposBono[grupoBono]) gruposBono[grupoBono] = { totalUnidades: 0 };

    const factor = toNum(linea.factor || producto.factor, 1) || 1;
    const cantidad = toNum(linea.cantidad, 0);
    const unidades = medidaOf(linea.medida) === "UNIDAD" ? cantidad : cantidad * factor;

    gruposBono[grupoBono].totalUnidades += unidades;
  });

  Object.keys(gruposBono).forEach((grupoId) => {
    const config = bonos[grupoId];
    if (!config || config.activo !== true || config.tipo !== "bono") return;

    (config.data || []).forEach((regla) => {
      const apartirDe = toNum(regla.apartir_de, 0);
      const cantidadBono = toNum(regla.cantidad_bono, 0);
      const codigoBono = String(regla.codigo || "");

      if (!apartirDe || !cantidadBono || !codigoBono) return;
      if (gruposBono[grupoId].totalUnidades < apartirDe) return;

      const totalBono = Math.floor(gruposBono[grupoId].totalUnidades / apartirDe) * cantidadBono;
      if (totalBono <= 0) return;

      const prodBono = productoOf(productos, codigoBono);
      if (!prodBono) return;

      let cantidadFinalBono = totalBono;
      if (prodBono.controstock === true) {
        const stockDisponible = Math.max(0, toNum(prodBono.stock, 0) - unidadesEnLista(prodBono.id));
        cantidadFinalBono = Math.min(totalBono, stockDisponible);
      }

      if (cantidadFinalBono <= 0) return;

      const precioReferencial = precioProducto(prodBono, "UNIDAD", prodBono.precio || 0);
      lista.push({
        uuid: create_UUID().substring(29),
        id: prodBono.id,
        nombre: prodBono.nombre,
        cantidad: cantidadFinalBono,
        medida: "UNIDAD",
        factor: 1,
        precio: 0,
        precio_base: Number(precioReferencial.toFixed(4)),
        preciodescuento: 0,
        tipoproducto: String(prodBono.tipoproducto || "BIEN"),
        operacion: "GRATUITA",
        peso: pesoLinea({ ...prodBono, cantidad: cantidadFinalBono, medida: "UNIDAD" }, prodBono),
        controstock: prodBono.controstock === true,
        totalLinea: "0.00",
        bono_auto: true,
      });
    });
  });

  return lista;
}

function create_UUID() {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    },
  );
  return uuid;
}
