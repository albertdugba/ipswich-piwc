import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type { CelebrationKind } from '@/domain/celebration'

const GREETINGS = 'celebrationGreetings'

export type GreetingChannel = 'MANUAL' | 'SMS'

export interface Greeting {
  id: string
  personId: string
  kind: CelebrationKind
  occursOn: string
  greetedAt: number
  greetedById?: string | null
  channel: GreetingChannel
}

function toGreeting(id: string, d: DocumentData): Greeting {
  return {
    id,
    personId: d.personId ?? '',
    kind: (d.kind ?? 'BIRTHDAY') as CelebrationKind,
    occursOn: d.occursOn ?? '',
    greetedAt: d.greetedAt ?? 0,
    greetedById: d.greetedById ?? null,
    channel: d.channel === 'SMS' ? 'SMS' : 'MANUAL',
  }
}

export async function listGreetingsSince(fromIso: string): Promise<Greeting[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, GREETINGS), where('occursOn', '>=', fromIso)),
  )
  return snap.docs.map((s) => toGreeting(s.id, s.data()))
}

export async function setGreeted(
  id: string,
  {
    personId,
    kind,
    occursOn,
    greeted,
    greetedById,
  }: {
    personId: string
    kind: CelebrationKind
    occursOn: string
    greeted: boolean
    greetedById?: string | null
  },
): Promise<void> {
  const db = getFirebaseDb()
  const ref = doc(db, GREETINGS, id)
  if (!greeted) {
    await deleteDoc(ref)
    return
  }
  await setDoc(ref, {
    personId,
    kind,
    occursOn,
    greetedAt: Date.now(),
    greetedById: greetedById ?? null,
    channel: 'MANUAL',
  })
}
