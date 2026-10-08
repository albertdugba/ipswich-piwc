import { addDoc, collection } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type { PrayerRequestValues } from '@/domain/prayer-request'

const PRAYER_REQUESTS = 'prayerRequests'

/** Public submission from the website. Requests start as NEW and private. */
export async function submitPrayerRequest(
  values: PrayerRequestValues,
): Promise<string> {
  const db = getFirebaseDb()
  const ref = await addDoc(collection(db, PRAYER_REQUESTS), {
    request: values.request,
    anonymous: values.anonymous,
    name: values.name,
    phone: values.phone,
    status: 'NEW',
    source: 'WEBSITE',
    createdAt: Date.now(),
  })
  return ref.id
}
