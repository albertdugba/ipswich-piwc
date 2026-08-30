import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  createFund,
  createRecord,
  deleteFund,
  deleteRecord,
  getFund,
  listFundRecords,
  listFunds,
  updateFund,
  updateRecord,
} from '@/lib/firestore/contributions'
import type {
  ContributionFundFormValues,
  ContributionRecordFormValues,
} from '@/domain/contribution'

export const contributionKeys = {
  all: ['contributions'] as const,
  funds: () => [...contributionKeys.all, 'funds'] as const,
  fund: (id: string) => [...contributionKeys.all, 'fund', id] as const,
  records: (fundId: string) =>
    [...contributionKeys.all, 'records', fundId] as const,
}

export function useFunds() {
  return useQuery({
    queryKey: contributionKeys.funds(),
    queryFn: listFunds,
    enabled: isFirebaseConfigured,
  })
}

export function useFund(id: string) {
  return useQuery({
    queryKey: contributionKeys.fund(id),
    queryFn: () => getFund(id),
    enabled: isFirebaseConfigured && Boolean(id),
  })
}

export function useFundRecords(fundId: string) {
  return useQuery({
    queryKey: contributionKeys.records(fundId),
    queryFn: () => listFundRecords(fundId),
    enabled: isFirebaseConfigured && Boolean(fundId),
  })
}

export function useCreateFund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: ContributionFundFormValues) => createFund(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}

export function useUpdateFund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: ContributionFundFormValues
    }) => updateFund(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}

export function useDeleteFund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFund(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}

export function useCreateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      fundId,
      values,
      recordedById,
    }: {
      fundId: string
      values: ContributionRecordFormValues
      recordedById?: string | null
    }) => createRecord(fundId, values, recordedById),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}

export function useUpdateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      recordId,
      fundId,
      values,
    }: {
      recordId: string
      fundId: string
      values: ContributionRecordFormValues
    }) => updateRecord(recordId, fundId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}

export function useDeleteRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, fundId }: { recordId: string; fundId: string }) =>
      deleteRecord(recordId, fundId),
    onSuccess: () => qc.invalidateQueries({ queryKey: contributionKeys.all }),
  })
}
