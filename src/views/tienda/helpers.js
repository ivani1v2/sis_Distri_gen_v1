// helpers.js

export const IMAGE_PRESETS = {
  thumb: {
    maxWidth: 260,
    quality: 0.6,
  },
  storage: {
    producto: { maxWidth: 1400, maxHeight: 1400, quality: 0.8 },
    promocion: { maxWidth: 1600, maxHeight: 1600, quality: 0.82 },
    marca: { maxWidth: 1000, maxHeight: 1000, quality: 0.78 },
    categoria: { maxWidth: 1000, maxHeight: 1000, quality: 0.78 },
    general: { maxWidth: 1200, maxHeight: 1200, quality: 0.8 },
  },
  crop: {
    producto: { size: 1400, quality: 0.88 },
    promocion: { size: 1600, quality: 0.9 },
    marca: { size: 1000, quality: 0.86 },
    categoria: { size: 1000, quality: 0.86 },
    general: { size: 1200, quality: 0.88 },
  },
};

export function obtenerPresetImagen(tipo = "general", grupo = "storage") {
  const presets = IMAGE_PRESETS[grupo] || {};
  return presets[tipo] || presets.general || {};
}

export function obtenerMimeOptimizado() {
  return soportaWebp() ? "image/webp" : "image/jpeg";
}

export function extensionDesdeMime(mimeType = "image/jpeg") {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  return "jpg";
}

export async function generarMiniaturaBase64(
  file,
  maxAncho = IMAGE_PRESETS.thumb.maxWidth,
  calidad = IMAGE_PRESETS.thumb.quality
) {
  const img = await cargarImagen(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const escala = Math.min(1, maxAncho / img.width);
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);

  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const tipo = obtenerMimeOptimizado();
  return canvas.toDataURL(tipo, calidad);
}

export async function optimizarImagenParaStorage(file, tipo = "general") {
  const preset = obtenerPresetImagen(tipo, "storage");
  const img = await cargarImagen(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxWidth = Number(preset.maxWidth || 1200);
  const maxHeight = Number(preset.maxHeight || maxWidth || 1200);
  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const mimeType = obtenerMimeOptimizado();
  const quality = Number(preset.quality || 0.8);

  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("No se pudo optimizar la imagen"));
    }, mimeType, quality);
  });

  const extension = extensionDesdeMime(mimeType);
  const baseName = String((file.name || "imagen").replace(/\.[^.]+$/, "") || "imagen");
  const optimizedFile = new File([blob], `${baseName}.${extension}`, { type: mimeType });

  return {
    file: optimizedFile,
    mimeType,
    extension,
    width,
    height,
    size: blob.size,
    originalSize: Number(file.size || 0),
  };
}

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function soportaWebp() {
  try {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (e) {
    return false;
  }
}

export async function convertirADataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
