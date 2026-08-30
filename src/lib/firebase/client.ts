import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import {
  clientEnv,
  isFirebaseConfigured,
  useFirebaseEmulator,
} from '@/lib/env.public'

/*
 * Firebase Web SDK (client-only). Firebase is the whole backend for this app:
 * Cloud Firestore is the system of record for church data, plus Authentication,
 * Storage (profile photos/uploads) and Cloud Messaging.
 *
 * Everything is initialised lazily so importing this module has no side effects
 * and the app still builds/boots before a Firebase project is configured.
 * Cloud Messaging (getMessaging) is intentionally deferred — it is only
 * supported in the browser and is wired up when reminders/push land.
 */
function firebaseConfig() {
  return {
    apiKey: clientEnv.VITE_FIREBASE_API_KEY,
    authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: clientEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: clientEnv.VITE_FIREBASE_APP_ID,
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Set the VITE_FIREBASE_* variables in .env.',
    )
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig())
}

// Cache the Firestore instance so we only initialise/connect once.
let firestoreInstance: Firestore | null = null

export function getFirebaseDb(): Firestore {
  if (firestoreInstance) return firestoreInstance
  // Force long polling: Firestore's default WebChannel streaming transport is
  // silently blocked/mangled by some proxies, VPNs, ad-blockers and browser
  // extensions, which makes reads/writes hang forever even though requests
  // return 200. Auto-detect can still misfire in those setups, so we force the
  // reliable plain-HTTP long-polling transport outright.
  firestoreInstance = initializeFirestore(getFirebaseApp(), {
    experimentalForceLongPolling: true,
  })
  if (useFirebaseEmulator) {
    connectFirestoreEmulator(firestoreInstance, '127.0.0.1', 8080)
  }
  return firestoreInstance
}

let authInstance: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance
  authInstance = getAuth(getFirebaseApp())
  if (useFirebaseEmulator) {
    connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    })
  }
  return authInstance
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}
