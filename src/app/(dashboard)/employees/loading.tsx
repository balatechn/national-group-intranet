import { Users } from 'lucide-react';

export default function EmployeesLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-4 w-48 bg-surface-200 rounded mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-7 h-7 text-surface-300" />
              <div className="h-8 w-48 bg-surface-200 rounded" />
            </div>
            <div className="h-4 w-64 bg-surface-200 rounded mt-2" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-surface-200 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-surface-200 rounded-lg" />
            <div className="h-10 w-36 bg-surface-200 rounded-lg" />
            <div className="h-10 w-32 bg-surface-200 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-surface-200 rounded-lg" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-200" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-surface-200 rounded mb-2" />
                <div className="h-4 w-24 bg-surface-200 rounded mb-1" />
                <div className="h-3 w-20 bg-surface-200 rounded" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-100 space-y-2">
              <div className="h-4 w-full bg-surface-200 rounded" />
              <div className="h-4 w-3/4 bg-surface-200 rounded" />
              <div className="h-4 w-5/6 bg-surface-200 rounded" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 bg-surface-200 rounded-full" />
              <div className="h-6 w-20 bg-surface-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
