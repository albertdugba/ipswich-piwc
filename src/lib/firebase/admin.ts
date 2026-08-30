import {
  cert,
  getApp,
  getApps,
  initializeApp,
  applicationDefault,
  type App,
} from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { serverEnv } from '@/lib/env.server'

let cachedApp: App | null = null

function getAdminApp(): App {
  if (getApps().length) return getApp()
  if (cachedApp) return cachedApp

  if (serverEnv.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(serverEnv.FIREBASE_SERVICE_ACCOUNT) as {
      projectId: string
      clientEmail: string
      privateKey: string
    }
    cachedApp = initializeApp({ credential: cert(serviceAccount) })
  } else if (serverEnv.GOOGLE_APPLICATION_CREDENTIALS) {
    cachedApp = initializeApp({ credential: applicationDefault() })
  } else {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT or ' +
        'GOOGLE_APPLICATION_CREDENTIALS in .env.',
    )
  }

  return cachedApp
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}
