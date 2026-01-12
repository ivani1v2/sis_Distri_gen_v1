// helpers.js

export async function generarMiniaturaBase64(
  file,
  maxAncho = 220,
  calidad = 0.65
) {
  const img = await cargarImagen(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const escala = Math.min(1, maxAncho / img.width);
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const tipo = soportaWebp() ? "image/webp" : "image/jpeg";
  return canvas.toDataURL(tipo, calidad);
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
