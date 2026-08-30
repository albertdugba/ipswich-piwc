import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type {
  AttendanceRecord,
  Service,
  ServiceFormValues,
} from '@/domain/service'

const SERVICES = 'services'
const RECORDS = 'attendanceRecords'

const recordId = (serviceId: string, personId: string) =>
  `${serviceId}__${personId}`

function toService(id: string, d: DocumentData): Service {
  return {
    id,
    name: d.name ?? '',
    serviceDate: d.serviceDate ?? '',
    notes: d.notes ?? null,
    presentCount: d.presentCount ?? 0,
    createdAt: d.createdAt ?? 0,
  }
}

function toRecord(id: string, d: DocumentData): AttendanceRecord {
  return {
    id,
    serviceId: d.serviceId ?? '',
    personId: d.personId ?? '',
    createdAt: d.createdAt ?? 0,
  }
}

export async function listServices(): Promise<Service[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, SERVICES), orderBy('serviceDate', 'desc')),
  )
  return snap.docs.map((s) => toService(s.id, s.data()))
}

export async function getService(id: string): Promise<Service | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, SERVICES, id))
  return snap.exists() ? toService(snap.id, snap.data()) : null
}

export async function createService(
  values: ServiceFormValues,
): Promise<string> {
  const db = getFirebaseDb()
  const ref = await addDoc(collection(db, SERVICES), {
    name: values.name,
    serviceDate: values.serviceDate,
    notes: values.notes ?? null,
    presentCount: 0,
    createdAt: Date.now(),
  })
  return ref.id
}

export async function updateService(
  id: string,
  values: ServiceFormValues,
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, SERVICES, id), {
    name: values.name,
    serviceDate: values.serviceDate,
    notes: values.notes ?? null,
  })
}

export async function deleteService(id: string): Promise<void> {
  const db = getFirebaseDb()
  const records = await getDocs(
    query(collection(db, RECORDS), where('serviceId', '==', id)),
  )
  await Promise.all(records.docs.map((r) => deleteDoc(r.ref)))
  await deleteDoc(doc(db, SERVICES, id))
}

export async function listServicePresentIds(
  serviceId: string,
): Promise<string[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, RECORDS), where('serviceId', '==', serviceId)),
  )
  return snap.docs.map((s) => toRecord(s.id, s.data()).personId)
}

export async function listPersonAttendance(
  personId: string,
): Promise<string[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, RECORDS), where('personId', '==', personId)),
  )
  return snap.docs.map((s) => toRecord(s.id, s.data()).serviceId)
}

export async function setPersonPresent(
  serviceId: string,
  personId: string,
  present: boolean,
  recordedById?: string | null,
): Promise<void> {
  const db = getFirebaseDb()
  const ref = doc(db, RECORDS, recordId(serviceId, personId))

  if (present) {
    await setDoc(ref, {
      serviceId,
      personId,
      recordedById: recordedById ?? null,
      createdAt: Date.now(),
    })
  } else {
    await deleteDoc(ref)
  }

  const count = (await listServicePresentIds(serviceId)).length
  await updateDoc(doc(db, SERVICES, serviceId), { presentCount: count })
}

const BATCH_LIMIT = 499

export async function saveServiceAttendance(
  serviceId: string,
  presentPersonIds: string[],
  recordedById?: string | null,
): Promise<void> {
  const db = getFirebaseDb()
  const current = new Set(await listServicePresentIds(serviceId))
  const next = new Set(presentPersonIds)

  const toAdd = [...next].filter((id) => !current.has(id))
  const toRemove = [...current].filter((id) => !next.has(id))
  const now = Date.now()

  type Op = { kind: 'add' | 'remove'; personId: string }
  const ops: Op[] = [
    ...toAdd.map((personId): Op => ({ kind: 'add', personId })),
    ...toRemove.map((personId): Op => ({ kind: 'remove', personId })),
  ]

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const op of ops.slice(i, i + BATCH_LIMIT)) {
      const ref = doc(db, RECORDS, recordId(serviceId, op.personId))
      if (op.kind === 'add') {
        batch.set(ref, {
          serviceId,
          personId: op.personId,
          recordedById: recordedById ?? null,
          createdAt: now,
        })
      } else {
        batch.delete(ref)
      }
    }
    if (i + BATCH_LIMIT >= ops.length) {
      batch.update(doc(db, SERVICES, serviceId), { presentCount: next.size })
    }
    await batch.commit()
  }

  if (ops.length === 0) {
    await updateDoc(doc(db, SERVICES, serviceId), { presentCount: next.size })
  }
}

export async function listPreviousServicePresentIds(
  serviceId: string,
): Promise<{ service: Service; personIds: string[] } | null> {
  const db = getFirebaseDb()
  const current = await getService(serviceId)
  if (!current) return null

  const snap = await getDocs(
    query(
      collection(db, SERVICES),
      where('serviceDate', '<', current.serviceDate),
      orderBy('serviceDate', 'desc'),
      limit(1),
    ),
  )
  const prev = snap.docs[0]
  if (!prev) return null

  const service = toService(prev.id, prev.data())
  return { service, personIds: await listServicePresentIds(service.id) }
}
