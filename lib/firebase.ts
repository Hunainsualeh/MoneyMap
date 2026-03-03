import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAOQqSGGNO5sLg4p3P1A19NOSL529gQoU",
  authDomain: "supervisor-81df6.firebaseapp.com",
  projectId: "supervisor-81df6",
  storageBucket: "supervisor-81df6.firebasestorage.app",
  messagingSenderId: "883491546571",
  appId: "1:883491546571:web:6b909ff80840cfd4a3c24e",
  measurementId: "G-R38NV0ZDW7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Use new persistent cache API (replaces deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
