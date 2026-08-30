import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type { Person, PersonFormValues } from '@/domain/person'

const COLLECTION = 'people'

function toDocData(values: PersonFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    preferredName: values.preferredName ?? null,
    gender: values.gender ?? null,
    dateOfBirth: values.dateOfBirth ?? null,
    phone: values.phone ?? null,
    email: values.email ?? null,
    addressLine1: values.addressLine1 ?? null,
    addressLine2: values.addressLine2 ?? null,
    city: values.city ?? null,
    postcode: values.postcode ?? null,
    membershipStatus: values.membershipStatus,
    firstAttendedOn: values.firstAttendedOn ?? null,
    membershipDate: values.membershipDate ?? null,
    maritalStatus: values.maritalStatus ?? null,
    marriageDate: values.marriageDate ?? null,
    notes: values.notes ?? null,
    smsOptOut: values.smsOptOut ?? false,
    isActive: values.isActive,
  }
}

function toPerson(id: string, d: DocumentData): Person {
  return {
    id,
    firstName: d.firstName ?? '',
    lastName: d.lastName ?? '',
    preferredName: d.preferredName ?? null,
    gender: d.gender ?? null,
    dateOfBirth: d.dateOfBirth ?? null,
    phone: d.phone ?? null,
    email: d.email ?? null,
    addressLine1: d.addressLine1 ?? null,
    addressLine2: d.addressLine2 ?? null,
    city: d.city ?? null,
    postcode: d.postcode ?? null,
    photoUrl: d.photoUrl ?? null,
    membershipStatus: d.membershipStatus ?? 'VISITOR',
    firstAttendedOn: d.firstAttendedOn ?? null,
    membershipDate: d.membershipDate ?? null,
    maritalStatus: d.maritalStatus ?? null,
    marriageDate: d.marriageDate ?? null,
    notes: d.notes ?? null,
    smsOptOut: d.smsOptOut ?? false,
    isActive: d.isActive ?? true,
    createdAt: d.createdAt ?? 0,
    updatedAt: d.updatedAt ?? 0,
  }
}

export async function listPeople(): Promise<Person[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy('lastName')),
  )
  return snap.docs
    .map((s) => toPerson(s.id, s.data()))
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    )
}

export async function getPerson(id: string): Promise<Person | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? toPerson(snap.id, snap.data()) : null
}

export async function createPerson(values: PersonFormValues): Promise<string> {
  const db = getFirebaseDb()
  const now = Date.now()
  const ref = await addDoc(collection(db, COLLECTION), {
    ...toDocData(values),
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updatePerson(
  id: string,
  values: PersonFormValues,
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, COLLECTION, id), {
    ...toDocData(values),
    updatedAt: Date.now(),
  })
}

export async function deletePerson(id: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, COLLECTION, id))
}
