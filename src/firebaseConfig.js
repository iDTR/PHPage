// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE (La que copiaste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyCi8rA4CDTHOqbom-9xghMnxuV7ypC57yk",
  authDomain: "honeywell-molds.firebaseapp.com",
  projectId: "honeywell-molds",
  storageBucket: "honeywell-molds.firebasestorage.app",
  messagingSenderId: "373332903922",
  appId: "1:373332903922:web:37a7540b8c806c71eb0d6b",
  measurementId: "G-7Y5TLG1C64"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar la Base de Datos (Firestore)
export const db = getFirestore(app);