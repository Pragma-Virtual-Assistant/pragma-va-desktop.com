import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCDaLDojeyRyv611jllqAoGDVgFVp72KdQ",
    authDomain: "pragmavadesktopinfowebsite.firebaseapp.com",
    projectId: "pragmavadesktopinfowebsite",
    storageBucket: "pragmavadesktopinfowebsite.firebasestorage.app",
    messagingSenderId: "542492384641",
    appId: "1:542492384641:web:06470ebbb5dfe64545dc80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export default app;
