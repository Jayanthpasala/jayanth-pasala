import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlOICqCg9hdlIX-yKHTSH2skWfqAqSnXM",
  authDomain: "gen-lang-client-0972837952.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0972837952-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0972837952",
  storageBucket: "gen-lang-client-0972837952.firebasestorage.app",
  messagingSenderId: "683423213216",
  appId: "1:683423213216:web:ceb7f24d2936892e2d4bc5",
  measurementId: "G-4M9MGGR831"
};

// Singleton to prevent multiple initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target the default Firestore instance explicitly
export const db = getFirestore(app);