export default function WorkersLoading() {
  return (
    <div className="space-y-8">
      {/* إحصاء */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 skeleton rounded-3xl" />
        ))}
      </div>
      {/* بحث */}
      <div className="h-12 skeleton rounded-2xl" />
      {/* بطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-72 skeleton rounded-4xl" />
        ))}
      </div>
    </div>
  );
}
