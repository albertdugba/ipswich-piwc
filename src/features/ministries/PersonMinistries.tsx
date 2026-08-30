import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HugeiconsIcon, MinistryIcon, StarIcon } from '@/lib/icons'
import { useDepartments, usePersonDepartments } from './queries'
import { departmentRoleLabels } from '@/domain/enums'

export function PersonMinistries({ personId }: { personId: string }) {
  const memberships = usePersonDepartments(personId)
  const departments = useDepartments()

  const rows = useMemo(() => {
    const names = new Map(
      (departments.data ?? []).map((d) => [d.id, d.name] as const),
    )
    return (memberships.data ?? [])
      .map((m) => ({
        id: m.id,
        departmentId: m.departmentId,
        name: names.get(m.departmentId),
        role: m.role,
      }))
      .filter((r): r is typeof r & { name: string } => Boolean(r.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [memberships.data, departments.data])

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Ministries</CardTitle>
      </CardHeader>
      <CardContent>
        {memberships.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not in any ministry yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  to="/ministries/$departmentId"
                  params={{ departmentId: r.departmentId }}
                  className="flex items-center justify-between gap-2 text-sm hover:text-brand-700"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <HugeiconsIcon
                      icon={MinistryIcon}
                      className="size-4 text-muted-foreground"
                    />
                    {r.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {r.role !== 'MEMBER' ? (
                      <HugeiconsIcon
                        icon={StarIcon}
                        className="size-3 text-gold-600"
                      />
                    ) : null}
                    {departmentRoleLabels[r.role]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
