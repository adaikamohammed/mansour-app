export default function TasksLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-3xl" />)}
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-64 skeleton rounded-2xl" />
        <div className="h-10 flex-1 skeleton rounded-2xl" />
        <div className="h-10 w-32 skeleton rounded-2xl" />
      </div>
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 skeleton rounded-3xl" />)}
      </div>
    </div>
  );
}
