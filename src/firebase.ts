import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBs-1qZRuED6eg4PCha3YXC7IHipS3vTAQ",
  authDomain: "conesul-26d9c.firebaseapp.com",
  projectId: "conesul-26d9c",
  storageBucket: "conesul-26d9c.firebasestorage.app",
  messagingSenderId: "574249028398",
  appId: "1:574249028398:web:7aab73ae8293ff14c3c8bf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);