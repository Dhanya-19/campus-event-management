import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAcG5U5nx9fR2g_kVyheVmoihL10ntNmTs",
  authDomain: "campusconnect-auth-15af9.firebaseapp.com",
  projectId: "campusconnect-auth-15af9",
  storageBucket: "campusconnect-auth-15af9.firebasestorage.app",
  messagingSenderId: "739204502268",
  appId: "1:739204502268:web:77cd19c29bd9a04eac3d79",
  measurementId: "G-4DSZW4TXPH",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
