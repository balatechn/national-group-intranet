import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-28 bg-muted animate-pulse rounded mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional stats skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-32 bg-muted animate-pulse rounded mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
