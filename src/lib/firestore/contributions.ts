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
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type {
  ContributionFund,
  ContributionFundFormValues,
  ContributionRecord,
  ContributionRecordFormValues,
} from '@/domain/contribution'
import { paymentMethodValues } from '@/domain/enums'
import type { ContributionKind, PaymentMethod } from '@/domain/enums'

const FUNDS = 'contributionFunds'
const RECORDS = 'contributionRecords'

function toFund(id: string, d: DocumentData): ContributionFund {
  return {
    id,
    name: d.name ?? '',
    kind: (d.kind ?? 'SPECIAL') as ContributionKind,
    departmentId: d.departmentId ?? null,
    beneficiaryPersonId: d.beneficiaryPersonId ?? null,
    beneficiaryNote: d.beneficiaryNote ?? null,
    expectedPerPerson: d.expectedPerPerson ?? null,
    targetAmount: d.targetAmount ?? null,
    periodStart: d.periodStart ?? null,
    periodEnd: d.periodEnd ?? null,
    isOpen: d.isOpen ?? true,
    notes: d.notes ?? null,
    totalAmount: d.totalAmount ?? 0,
    contributorCount: d.contributorCount ?? 0,
    createdAt: d.createdAt ?? 0,
    updatedAt: d.updatedAt ?? 0,
  }
}

function toPaymentMethod(value: unknown): PaymentMethod {
  return paymentMethodValues.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : 'OTHER'
}

function toRecord(id: string, d: DocumentData): ContributionRecord {
  return {
    id,
    fundId: d.fundId ?? '',
    personId: d.personId ?? '',
    amount: d.amount ?? 0,
    contributedOn: d.contributedOn ?? '',
    method: toPaymentMethod(d.method),
    note: d.note ?? null,
    recordedById: d.recordedById ?? null,
    createdAt: d.createdAt ?? 0,
  }
}

function toFundDocData(values: ContributionFundFormValues) {
  return {
    name: values.name,
    kind: values.kind,
    departmentId:
      values.kind === 'MINISTRY_DUES' ? (values.departmentId ?? null) : null,
    beneficiaryPersonId:
      values.kind === 'BEREAVEMENT'
        ? (values.beneficiaryPersonId ?? null)
        : null,
    beneficiaryNote:
      values.kind === 'BEREAVEMENT' ? (values.beneficiaryNote ?? null) : null,
    expectedPerPerson: values.expectedPerPerson ?? null,
    targetAmount: values.targetAmount ?? null,
    periodStart: values.periodStart ?? null,
    periodEnd: values.periodEnd ?? null,
    isOpen: values.isOpen,
    notes: values.notes ?? null,
  }
}

export async function listFunds(): Promise<ContributionFund[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, FUNDS), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((s) => toFund(s.id, s.data()))
}

export async function getFund(id: string): Promise<ContributionFund | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, FUNDS, id))
  return snap.exists() ? toFund(snap.id, snap.data()) : null
}

export async function createFund(
  values: ContributionFundFormValues,
): Promise<string> {
  const db = getFirebaseDb()
  const now = Date.now()
  const ref = await addDoc(collection(db, FUNDS), {
    ...toFundDocData(values),
    totalAmount: 0,
    contributorCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updateFund(
  id: string,
  values: ContributionFundFormValues,
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, FUNDS, id), {
    ...toFundDocData(values),
    updatedAt: Date.now(),
  })
}

export async function deleteFund(id: string): Promise<void> {
  const db = getFirebaseDb()
  const records = await getDocs(
    query(collection(db, RECORDS), where('fundId', '==', id)),
  )
  for (let i = 0; i < records.docs.length; i += 499) {
    const batch = writeBatch(db)
    for (const r of records.docs.slice(i, i + 499)) batch.delete(r.ref)
    await batch.commit()
  }
  await deleteDoc(doc(db, FUNDS, id))
}

export async function listFundRecords(
  fundId: string,
): Promise<ContributionRecord[]> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, RECORDS), where('fundId', '==', fundId)),
  )
  return snap.docs
    .map((s) => toRecord(s.id, s.data()))
    .sort(
      (a, b) =>
        b.contributedOn.localeCompare(a.contributedOn) ||
        b.createdAt - a.createdAt,
    )
}

async function refreshFundTotals(fundId: string): Promise<void> {
  const db = getFirebaseDb()
  const records = await listFundRecords(fundId)
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const contributorCount = new Set(records.map((r) => r.personId)).size
  await updateDoc(doc(db, FUNDS, fundId), {
    totalAmount,
    contributorCount,
    updatedAt: Date.now(),
  })
}

export async function createRecord(
  fundId: string,
  values: ContributionRecordFormValues,
  recordedById?: string | null,
): Promise<string> {
  const db = getFirebaseDb()
  const ref = await addDoc(collection(db, RECORDS), {
    fundId,
    personId: values.personId,
    amount: values.amount,
    contributedOn: values.contributedOn,
    method: values.method,
    note: values.note ?? null,
    recordedById: recordedById ?? null,
    createdAt: Date.now(),
  })
  await refreshFundTotals(fundId)
  return ref.id
}

export async function updateRecord(
  recordId: string,
  fundId: string,
  values: ContributionRecordFormValues,
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, RECORDS, recordId), {
    personId: values.personId,
    amount: values.amount,
    contributedOn: values.contributedOn,
    method: values.method,
    note: values.note ?? null,
  })
  await refreshFundTotals(fundId)
}

export async function deleteRecord(
  recordId: string,
  fundId: string,
): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, RECORDS, recordId))
  await refreshFundTotals(fundId)
}
