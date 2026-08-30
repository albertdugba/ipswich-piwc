import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type {
  Department,
  DepartmentFormValues,
  DepartmentMembership,
} from '@/domain/department'
import { DEFAULT_MINISTRIES } from '@/domain/department'
import type { DepartmentRole } from '@/domain/enums'

const DEPARTMENTS = 'departments'
const MEMBERSHIPS = 'departmentMemberships'

const membershipId = (departmentId: string, personId: string) =>
  `${departmentId}__${personId}`

function toDepartment(id: string, d: DocumentData): Department {
  return {
    id,
    name: d.name ?? '',
    description: d.description ?? null,
    isActive: d.isActive ?? true,
    createdAt: d.createdAt ?? 0,
    updatedAt: d.updatedAt ?? 0,
  }
}

function toMembership(id: string, d: DocumentData): DepartmentMembership {
  return {
    id,
    departmentId: d.departmentId ?? '',
    personId: d.personId ?? '',
    role: (d.role ?? 'MEMBER') as DepartmentRole,
    joinedOn: d.joinedOn ?? 0,
    isActive: d.isActive ?? true,
  }
}

function dedupeMemberships(
  rows: DepartmentMembership[],
): DepartmentMembership[] {
  const byPair = new Map<string, DepartmentMembership>()
  for (const m of rows) {
    const key = membershipId(m.departmentId, m.personId)
    const kept = byPair.get(key)
    if (!kept || m.id === key) byPair.set(key, m)
  }
  return [...byPair.values()]
}

async function findMembershipRefs(departmentId: string, personId: string) {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(
      collection(db, MEMBERSHIPS),
      where('departmentId', '==', departmentId),
      where('personId', '==', personId),
    ),
  )
  return snap.docs.map((s) => s.ref)
}

export async function listDepartments(): Promise<Department[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, DEPARTMENTS), orderBy('name')),
  )
  return snap.docs.map((s) => toDepartment(s.id, s.data()))
}

export async function getDepartment(id: string): Promise<Department | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, DEPARTMENTS, id))
  return snap.exists() ? toDepartment(snap.id, snap.data()) : null
}

export async function createDepartment(
  values: DepartmentFormValues,
): Promise<string> {
  const db = getFirebaseDb()
  const now = Date.now()
  const ref = await addDoc(collection(db, DEPARTMENTS), {
    name: values.name,
    description: values.description ?? null,
    isActive: values.isActive,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updateDepartment(
  id: string,
  values: DepartmentFormValues,
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, DEPARTMENTS, id), {
    name: values.name,
    description: values.description ?? null,
    isActive: values.isActive,
    updatedAt: Date.now(),
  })
}

export async function deleteDepartment(id: string): Promise<void> {
  const db = getFirebaseDb()
  const members = await getDocs(
    query(collection(db, MEMBERSHIPS), where('departmentId', '==', id)),
  )
  await Promise.all(members.docs.map((m) => deleteDoc(m.ref)))
  await deleteDoc(doc(db, DEPARTMENTS, id))
}

export async function seedDefaultDepartments(): Promise<number> {
  const existing = await listDepartments()
  const existingNames = new Set(existing.map((d) => d.name.toLowerCase()))
  const toCreate = DEFAULT_MINISTRIES.filter(
    (m) => !existingNames.has(m.name.toLowerCase()),
  )
  await Promise.all(
    toCreate.map((m) =>
      createDepartment({
        name: m.name,
        description: m.description,
        isActive: true,
      }),
    ),
  )
  return toCreate.length
}

export async function listAllMemberships(): Promise<DepartmentMembership[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(collection(db, MEMBERSHIPS))
  return dedupeMemberships(snap.docs.map((s) => toMembership(s.id, s.data())))
}

export async function listDepartmentMembers(
  departmentId: string,
): Promise<DepartmentMembership[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(
      collection(db, MEMBERSHIPS),
      where('departmentId', '==', departmentId),
    ),
  )
  return dedupeMemberships(snap.docs.map((s) => toMembership(s.id, s.data())))
}

export async function listPersonDepartments(
  personId: string,
): Promise<DepartmentMembership[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, MEMBERSHIPS), where('personId', '==', personId)),
  )
  return dedupeMemberships(snap.docs.map((s) => toMembership(s.id, s.data())))
}

export async function setDepartmentMember(
  departmentId: string,
  personId: string,
  role: DepartmentRole,
): Promise<void> {
  const db = getFirebaseDb()
  const id = membershipId(departmentId, personId)
  const ref = doc(db, MEMBERSHIPS, id)
  const existing = await getDoc(ref)
  const strays = (await findMembershipRefs(departmentId, personId)).filter(
    (r) => r.id !== id,
  )

  await setDoc(ref, {
    departmentId,
    personId,
    role,
    isActive: true,
    joinedOn: existing.exists()
      ? (existing.data().joinedOn ?? Date.now())
      : Date.now(),
  })
  await Promise.all(strays.map((r) => deleteDoc(r)))
}

export async function removeDepartmentMember(
  departmentId: string,
  personId: string,
): Promise<void> {
  const db = getFirebaseDb()
  const refs = await findMembershipRefs(departmentId, personId)
  const canonical = doc(db, MEMBERSHIPS, membershipId(departmentId, personId))
  const all = refs.some((r) => r.id === canonical.id)
    ? refs
    : [...refs, canonical]
  await Promise.all(all.map((r) => deleteDoc(r)))
}
