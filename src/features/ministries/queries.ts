import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listAllMemberships,
  listDepartmentMembers,
  listDepartments,
  listPersonDepartments,
  removeDepartmentMember,
  seedDefaultDepartments,
  setDepartmentMember,
  updateDepartment,
} from '@/lib/firestore/departments'
import type { DepartmentFormValues } from '@/domain/department'
import type { DepartmentRole } from '@/domain/enums'

/*
 * TanStack Query hooks over the Firestore departments/memberships data access,
 * mirroring the People module. Queries are disabled until Firebase is
 * configured so the app renders a "connect Firebase" state instead of erroring.
 */
export const ministryKeys = {
  all: ['ministries'] as const,
  list: () => [...ministryKeys.all, 'list'] as const,
  detail: (id: string) => [...ministryKeys.all, 'detail', id] as const,
  members: (id: string) => [...ministryKeys.all, 'members', id] as const,
  allMemberships: () => [...ministryKeys.all, 'memberships'] as const,
  personDepartments: (personId: string) =>
    [...ministryKeys.all, 'person', personId] as const,
}

export function useDepartments() {
  return useQuery({
    queryKey: ministryKeys.list(),
    queryFn: listDepartments,
    enabled: isFirebaseConfigured,
  })
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ministryKeys.detail(id),
    queryFn: () => getDepartment(id),
    enabled: isFirebaseConfigured && Boolean(id),
  })
}

/** All memberships — used to count members per department on the list. */
export function useAllMemberships() {
  return useQuery({
    queryKey: ministryKeys.allMemberships(),
    queryFn: listAllMemberships,
    enabled: isFirebaseConfigured,
  })
}

export function useDepartmentMembers(departmentId: string) {
  return useQuery({
    queryKey: ministryKeys.members(departmentId),
    queryFn: () => listDepartmentMembers(departmentId),
    enabled: isFirebaseConfigured && Boolean(departmentId),
  })
}

export function usePersonDepartments(personId: string) {
  return useQuery({
    queryKey: ministryKeys.personDepartments(personId),
    queryFn: () => listPersonDepartments(personId),
    enabled: isFirebaseConfigured && Boolean(personId),
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: DepartmentFormValues) => createDepartment(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: DepartmentFormValues
    }) => updateDepartment(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}

export function useSeedDepartments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => seedDefaultDepartments(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}

export function useSetDepartmentMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      personId,
      role,
    }: {
      departmentId: string
      personId: string
      role: DepartmentRole
    }) => setDepartmentMember(departmentId, personId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}

export function useRemoveDepartmentMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      personId,
    }: {
      departmentId: string
      personId: string
    }) => removeDepartmentMember(departmentId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ministryKeys.all }),
  })
}
