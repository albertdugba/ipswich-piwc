import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  createService,
  deleteService,
  getService,
  listPersonAttendance,
  listPreviousServicePresentIds,
  listServicePresentIds,
  listServices,
  saveServiceAttendance,
  setPersonPresent,
  updateService,
} from '@/lib/firestore/attendance'
import type { ServiceFormValues } from '@/domain/service'

/*
 * TanStack Query hooks over the Firestore attendance data access, mirroring the
 * People and Ministries modules. Queries are disabled until Firebase is
 * configured.
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  services: () => [...attendanceKeys.all, 'services'] as const,
  service: (id: string) => [...attendanceKeys.all, 'service', id] as const,
  present: (id: string) => [...attendanceKeys.all, 'present', id] as const,
  person: (personId: string) =>
    [...attendanceKeys.all, 'person', personId] as const,
  previous: (id: string) => [...attendanceKeys.all, 'previous', id] as const,
}

export function useServices() {
  return useQuery({
    queryKey: attendanceKeys.services(),
    queryFn: listServices,
    enabled: isFirebaseConfigured,
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: attendanceKeys.service(id),
    queryFn: () => getService(id),
    enabled: isFirebaseConfigured && Boolean(id),
  })
}

export function useServicePresent(serviceId: string) {
  return useQuery({
    queryKey: attendanceKeys.present(serviceId),
    queryFn: () => listServicePresentIds(serviceId),
    enabled: isFirebaseConfigured && Boolean(serviceId),
  })
}

export function usePersonAttendance(personId: string) {
  return useQuery({
    queryKey: attendanceKeys.person(personId),
    queryFn: () => listPersonAttendance(personId),
    enabled: isFirebaseConfigured && Boolean(personId),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: ServiceFormValues) => createService(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      updateService(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.all }),
  })
}

/** Whoever attended the service before this one — powers "copy from last service". */
export function usePreviousServicePresent(serviceId: string) {
  return useQuery({
    queryKey: attendanceKeys.previous(serviceId),
    queryFn: () => listPreviousServicePresentIds(serviceId),
    enabled: isFirebaseConfigured && Boolean(serviceId),
  })
}

/*
 * Mark one person present/absent, applied optimistically so the row responds
 * instantly and the register stays usable on a poor church-hall connection. On
 * failure the previous list is rolled back and the caller can surface an undo.
 */
export function useTogglePresent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      serviceId,
      personId,
      present,
      recordedById,
    }: {
      serviceId: string
      personId: string
      present: boolean
      recordedById?: string | null
    }) => setPersonPresent(serviceId, personId, present, recordedById),

    onMutate: async ({ serviceId, personId, present }) => {
      const key = attendanceKeys.present(serviceId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<string[]>(key)
      qc.setQueryData<string[]>(key, (ids = []) =>
        present
          ? ids.includes(personId)
            ? ids
            : [...ids, personId]
          : ids.filter((id) => id !== personId),
      )
      return { key, previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous)
    },

    // Refresh the service doc so the header's presentCount catches up, but leave
    // the present list alone — the optimistic value is already correct.
    onSettled: (_data, _err, { serviceId }) => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.service(serviceId) })
      void qc.invalidateQueries({ queryKey: attendanceKeys.services() })
    },
  })
}

/*
 * Replace the whole present set in one batched write. Used by the bulk actions
 * (mark filtered, mark a ministry, copy from last service) where a per-person
 * loop would mean hundreds of round trips.
 */
export function useSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      serviceId,
      presentPersonIds,
      recordedById,
    }: {
      serviceId: string
      presentPersonIds: string[]
      recordedById?: string | null
    }) => saveServiceAttendance(serviceId, presentPersonIds, recordedById),

    onMutate: async ({ serviceId, presentPersonIds }) => {
      const key = attendanceKeys.present(serviceId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<string[]>(key)
      qc.setQueryData<string[]>(key, presentPersonIds)
      return { key, previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous)
    },

    onSettled: (_data, _err, { serviceId }) => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.service(serviceId) })
      void qc.invalidateQueries({ queryKey: attendanceKeys.services() })
    },
  })
}
