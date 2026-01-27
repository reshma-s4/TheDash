import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkixl6LLACy4VeSxk1OdPaRpceFiB3sH8",
  authDomain: "login-75a8b.firebaseapp.com",
  projectId: "login-75a8b",
  storageBucket: "login-75a8b.firebasestorage.app",
  messagingSenderId: "935441000840",
  appId: "1:935441000840:web:95cb979bd14bec4c53b23d",
  measurementId: "G-N4T4SMGJ61"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
