import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Firestore,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { getSavedState, saveState } from './data';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp;
export let db: Firestore;
export let auth: Auth;
let useLocalFallback = false;

// Determine if we should use fallback instantly (meaning config is default placeholder)
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('PlaceholderOnly') || firebaseConfig.apiKey === '') {
  console.warn("Rancho Modesta: Usando modo fuera de línea con almacenamiento local de respaldo. Ejecuta 'set_up_firebase' si deseas sincronización en la nube.");
  useLocalFallback = true;
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);

    // Validation test connection to Firestore as requested by the Firebase Skill
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test-connection-probe', 'probe'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Failing block fell to offline client.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Error al inicializar Firebase SDK, activando fallback local:", error);
    useLocalFallback = true;
  }
}

// Error handler specified by the Firebase Integration Skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Active local storage subscriber list for simulations
const listeners: { [collectionName: string]: ((data: any[]) => void)[] } = {};

function notifyListeners(collectionName: string) {
  if (listeners[collectionName]) {
    const data = getSavedState<any[]>(collectionName, []);
    listeners[collectionName].forEach(cb => cb(data));
  }
}

/**
 * Listens to updates from a Firestore collection. If offline or placeholder,
 * subscribes to localStorage changes smoothly using listeners.
 */
export function listenCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void
): () => void {
  if (useLocalFallback) {
    if (!listeners[collectionName]) {
      listeners[collectionName] = [];
    }
    listeners[collectionName].push(onUpdate);
    
    // Initial emission
    const initialData = getSavedState<T[]>(collectionName, []);
    onUpdate(initialData);

    // Return unsubscribe function
    return () => {
      listeners[collectionName] = listeners[collectionName].filter(cb => cb !== onUpdate);
    };
  } else {
    try {
      const colRef = collection(db, collectionName);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ ...docSnap.data(), id: docSnap.id } as T);
          });
          onUpdate(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, collectionName);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, collectionName);
    }
  }
}

/**
 * Saves or updates a document.
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  if (useLocalFallback) {
    const current = getSavedState<T[]>(collectionName, []);
    const idx = current.findIndex(item => item.id === docId);
    if (idx >= 0) {
      current[idx] = data;
    } else {
      current.push(data);
    }
    saveState(collectionName, current);
    notifyListeners(collectionName);
    return Promise.resolve();
  } else {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  }
}

/**
 * Removes a document.
 */
export async function removeDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  if (useLocalFallback) {
    const current = getSavedState<any[]>(collectionName, []);
    const filtered = current.filter(item => item.id !== docId);
    saveState(collectionName, filtered);
    notifyListeners(collectionName);
    return Promise.resolve();
  } else {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    }
  }
}

/**
 * Seeds initial data into a collection if it is currently empty.
 */
export async function seedInitialDataIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
): Promise<void> {
  if (useLocalFallback) {
    const current = getSavedState<T[]>(collectionName, []);
    if (current.length === 0) {
      saveState(collectionName, initialData);
      notifyListeners(collectionName);
    }
    return Promise.resolve();
  } else {
    try {
      const colRef = collection(db, collectionName);
      const querySnapshot = await getDocs(colRef);
      if (querySnapshot.empty) {
        for (const item of initialData) {
          const docRef = doc(db, collectionName, item.id);
          await setDoc(docRef, item);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, collectionName);
    }
  }
}
