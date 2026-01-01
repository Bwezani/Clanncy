
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClwgjSApdHuJQfr1PmIanhTrrUDCuKQPc",
  authDomain: "clanncy-c7a97.firebaseapp.com",
  projectId: "clanncy-c7a97",
  storageBucket: "clanncy-c7a97.firebasestorage.app",
  messagingSenderId: "1017418013116",
  appId: "1:1017418013116:web:70961877465b731365f3b9",
  measurementId: "G-SMFBEPDK3D"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
