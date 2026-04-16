import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDDmQWPhiItuqvNOhievJhkLyjvxufVgO4",
  authDomain: "project-3941876394108886568.firebaseapp.com",
  projectId: "project-3941876394108886568",
  storageBucket: "project-3941876394108886568.firebasestorage.app",
  messagingSenderId: "301543101272",
  appId: "1:301543101272:web:8e609647d88ea77a5b4b2d",
  measurementId: "G-N1W1KFV5S3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
