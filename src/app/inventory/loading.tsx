export default function InventoryLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton rounded-3xl" />)}
      </div>
      <div className="h-12 skeleton rounded-2xl" />
      <div className="h-96 skeleton rounded-4xl" />
    </div>
  );
}
