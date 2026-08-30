import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  createPerson,
  deletePerson,
  getPerson,
  listPeople,
  updatePerson,
} from '@/lib/firestore/people'
import type { PersonFormValues } from '@/domain/person'

/*
 * TanStack Query hooks over the Firestore people data access. Data is fetched
 * client-side (the queries are disabled until Firebase is configured, so the
 * app renders cleanly before a project is connected). Mutations invalidate the
 * list + affected detail so the UI stays in sync.
 */
export const peopleKeys = {
  all: ['people'] as const,
  list: () => [...peopleKeys.all, 'list'] as const,
  detail: (id: string) => [...peopleKeys.all, 'detail', id] as const,
}

export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.list(),
    queryFn: listPeople,
    enabled: isFirebaseConfigured,
  })
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: peopleKeys.detail(id),
    queryFn: () => getPerson(id),
    enabled: isFirebaseConfigured && Boolean(id),
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PersonFormValues) => createPerson(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: peopleKeys.all })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PersonFormValues }) =>
      updatePerson(id, values),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: peopleKeys.list() })
      void queryClient.invalidateQueries({ queryKey: peopleKeys.detail(id) })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: peopleKeys.all })
    },
  })
}
