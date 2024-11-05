// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZexHUfeXIw7YaXCbTbWymDgOJhnJIZRo",
  authDomain: "bulk-mail-83d39.firebaseapp.com",
  projectId: "bulk-mail-83d39",
  storageBucket: "bulk-mail-83d39.firebasestorage.app",
  messagingSenderId: "221782045567",
  appId: "1:221782045567:web:5ecbff7a3b7363dd1a604a",
  measurementId: "G-8VNFEWD7HG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
