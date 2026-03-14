import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- 1. Added this import

const firebaseConfig = {
  apiKey: "AIzaSyDKATXvxuwUEytcs-D1SivLqPRG8LG_dKY",
  authDomain: "intelligent-health-hub.firebaseapp.com",
  projectId: "intelligent-health-hub",
  storageBucket: "intelligent-health-hub.firebasestorage.app",
  messagingSenderId: "1078699537893",
  appId: "1:1078699537893:web:310d8108941b251baaeb0c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it!
export const auth = getAuth(app); // <-- 2. Added this export