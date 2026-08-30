import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/env.public'
import { listGreetingsSince, setGreeted } from '@/lib/firestore/greetings'
import type { CelebrationKind } from '@/domain/celebration'

export const reminderKeys = {
  all: ['reminders'] as const,
  greetings: (fromIso: string) =>
    [...reminderKeys.all, 'greetings', fromIso] as const,
}

export function useGreetings(fromIso: string) {
  return useQuery({
    queryKey: reminderKeys.greetings(fromIso),
    queryFn: () => listGreetingsSince(fromIso),
    enabled: isFirebaseConfigured && Boolean(fromIso),
  })
}

export function useSetGreeted(fromIso: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      personId,
      kind,
      occursOn,
      greeted,
      greetedById,
    }: {
      id: string
      personId: string
      kind: CelebrationKind
      occursOn: string
      greeted: boolean
      greetedById?: string | null
    }) => setGreeted(id, { personId, kind, occursOn, greeted, greetedById }),

    onMutate: async ({ id, personId, kind, occursOn, greeted }) => {
      const key = reminderKeys.greetings(fromIso)
      await qc.cancelQueries({ queryKey: key })
      const previous =
        qc.getQueryData<Awaited<ReturnType<typeof listGreetingsSince>>>(key)
      qc.setQueryData(key, (list: typeof previous = []) =>
        greeted
          ? list.some((g) => g.id === id)
            ? list
            : [
                ...list,
                {
                  id,
                  personId,
                  kind,
                  occursOn,
                  greetedAt: Date.now(),
                  greetedById: null,
                },
              ]
          : list.filter((g) => g.id !== id),
      )
      return { key, previous }
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous)
    },
  })
}
