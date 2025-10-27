import { db, guardaToken, consultaToken } from './db'
import store from '@/store/index'

export const solicitaPermiso = () => {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
      // ...
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}

export const ObtenerToken = () => {
  //par de llaves  Certificados de envío web
  db.messaging().usePublicVapidKey("BKe8mU9rjqsycOWmHiA2-u6KM72Q-Z2Wo-lsfqkNCSaHSPUQKNHHBkWSfjgCIA2xkyKQHZA70h57gkn31W2s_FI");
  return db.messaging()
}

export const enviarmensaje = (Titulo, Cuerpo, token) => {
  //Clave de servidor es la key
  var key = 'AAAAmk-wh2E:APA91bGE_OFCczyd2FHaikGDNDeA8mave2N9pjhZ1ApedNBPqt5XrXAl6W2qfTLDbPTcju0iB3l_Q8zAX8wsxmzBF9gRkkoO7JC21e7l3coWp-JKf20KSIJseVvjcz3LRQD9JnM9tfJn';
  var to = token;
  var notification = {
    'title': Titulo,
    'body': Cuerpo,
    'icon': 'pedidos.png',
    'click_action': 'https://mitienda-f5ef8.web.app/comprobantes'
  };
  fetch('https://fcm.googleapis.com/fcm/send', {
    'method': 'POST',
    'headers': {
      'Authorization': 'key=' + key,
      'Content-Type': 'application/json'
    },
    'body': JSON.stringify({
      'notification': notification,
      'to': to
    })
  }).then(function (response) {
    console.log("enviado --", response);
  }).catch(function (error) {
    console.error("error", error);
  })
}