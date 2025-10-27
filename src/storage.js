// Conveniently import this file anywhere to use db

import firebase from 'firebase/app'
import 'firebase/database'

export const db = firebase
.initializeApp({  
    apiKey: "AIzaSyBRZsvdirIVvKtRGlUG_hEJKDXyaeTACxg",
    authDomain: "mitienda-f5ef8.firebaseapp.com",
    databaseURL: "https://mitienda-f5ef8.firebaseio.com",
    projectId: "mitienda-f5ef8",
    storageBucket: "mitienda-f5ef8.appspot.com",
    messagingSenderId: "662761932641",
    appId: "1:662761932641:web:716d3f469e9c3947ede720"
})

