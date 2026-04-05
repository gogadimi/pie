export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">You&apos;re offline</h1>
        <p className="text-sm text-slate-500 mb-6">Check your connection or refresh to try again.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium min-h-[44px]">🔄 Refresh</button>
      </div>
    </div>
  );
}
