import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">PIE</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/#features" className="hover:text-slate-900 transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Compare Plans</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>
      {children}
      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-semibold text-slate-900">Pricing Intelligence Engine</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 PIE. Built with ❤️ for smart pricing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
