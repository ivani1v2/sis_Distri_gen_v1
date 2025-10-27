
import 'firebase/firestore'
import { allEmpresas, allClientes_bd } from './db'
import { fs } from './db_firestore'




export async function copiarDocumento() {
  const origen = fs.collection("general").doc("00000000000");
  const destino = fs.collection("general").doc("10296192185");

  const subcolecciones = ["clientes", "rutaDelDia"];

  for (const sub of subcolecciones) {
    const snap = await origen.collection(sub).get();
    for (const doc of snap.docs) {
      await destino.collection(sub).doc(doc.id).set(doc.data());
      console.log(`Copiado ${sub}/${doc.id}`);
    }
  }
  console.log("✅ Copia completa");
}

