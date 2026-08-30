import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePersonAttendance, useServices } from './queries'

/*
 * Person-side attendance summary for the member profile: how many services
 * they've attended and their attendance rate across all recorded services.
 */
export function PersonAttendance({ personId }: { personId: string }) {
  const attended = usePersonAttendance(personId)
  const services = useServices()

  const count = attended.data?.length ?? 0
  const total = services.data?.length ?? 0
  const rate = total > 0 ? Math.round((count / total) * 100) : null
  const loading = attended.isLoading || services.isLoading

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No services recorded yet.
          </p>
        ) : (
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {count}
              <span className="text-base font-normal text-muted-foreground">
                {' '}
                / {total} services
              </span>
            </p>
            {rate !== null ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {rate}% attendance
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
