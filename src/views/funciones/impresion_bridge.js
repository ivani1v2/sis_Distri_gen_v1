import store from "@/store/index";

let ventanaBridge = null;
let bridgeReadyPromise = null;

function getBridgeConfig() {
  const configHost = store?.state?.permisos?.config_impresion_host || {};
  const IP_PC = configHost.ip_dispositivo || "192.168.1.19";
  const PORT = configHost.puerto_dispositivo || 8090;

  return {
    BRIDGE_URL: `http://${IP_PC}:${PORT}/bridge-pdf`,
    token:
      store?.state?.configImpresora?.token_host ||
      configHost.token ||
      "1234",
    printer: configHost.nombre_impresora || "POS-80-Series",
  };
}

export async function abrir_bridge_impresion() {
  if (ventanaBridge && !ventanaBridge.closed && bridgeReadyPromise) {
    return bridgeReadyPromise;
  }

  const { BRIDGE_URL } = getBridgeConfig();

  ventanaBridge = window.open(
    BRIDGE_URL,
    "bridge_print_window",
    "width=500,height=400,menubar=no,toolbar=no,location=no,status=no"
  );

  if (!ventanaBridge) {
    throw new Error("No se pudo abrir la ventana de impresión.");
  }

  bridgeReadyPromise = new Promise((resolve, reject) => {
    let timeoutId = null;

    const onMessage = (event) => {
      if (event.source !== ventanaBridge) return;

      const data = event.data || {};

      if (data.type === "BRIDGE_READY") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", onMessage);
        resolve(ventanaBridge);
        return;
      }

      if (data.type === "BRIDGE_ERROR") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", onMessage);
        reject(new Error(data.message || "Error iniciando bridge"));
      }
    };

    window.addEventListener("message", onMessage);

    timeoutId = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Timeout esperando bridge"));
    }, 10000);
  });

  return bridgeReadyPromise;
}

export async function impresion_bridge(pdfBuffer, copias = 1, docId = Date.now(), isLast = false) {
  if (!(pdfBuffer instanceof ArrayBuffer)) {
    throw new Error("El documento no es un ArrayBuffer válido");
  }

  const ventana = await abrir_bridge_impresion();
  const { token, printer } = getBridgeConfig();

  return new Promise((resolve, reject) => {
    let terminado = false;
    let timeoutId = null;

    const finalizar = (ok, data = null) => {
      if (terminado) return;
      terminado = true;

      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);

      if (ok) resolve(data);
      else reject(data instanceof Error ? data : new Error(data || "Error enviando al bridge"));
    };

    const onMessage = (event) => {
      if (event.source !== ventana) return;

      const data = event.data || {};
      if (String(data.jobId || "") !== String(docId)) return;

      if (data.type === "BRIDGE_ACCEPTED") {
        finalizar(true, data);
        return;
      }

      if (data.type === "BRIDGE_ERROR") {
        finalizar(false, data.message || "Error del bridge");
      }
    };

    window.addEventListener("message", onMessage);

    try {
      ventana.postMessage(
        {
          type: "PRINT_PDF",
          token,
          printer,
          copies: Number(copias) || 1,
          jobId: String(docId),
          pdf: pdfBuffer.slice(0),
          isLast: !!isLast,
          autoCloseOnLast: !!isLast,
        },
        "*"
      );
    } catch (e) {
      finalizar(false, e);
      return;
    }

    timeoutId = setTimeout(() => {
      finalizar(false, new Error("Timeout enviando documento al bridge"));
    }, 15000);
  });
}

export async function cerrar_bridge_impresion(delay = 1200) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  bridgeReadyPromise = null;

  if (ventanaBridge && !ventanaBridge.closed) {
    try {
      ventanaBridge.close();
    } catch (e) {}
  }

  ventanaBridge = null;
}