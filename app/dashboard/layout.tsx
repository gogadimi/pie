import Sidebar from "@/components/dashboard/sidebar";
import { headers as nextHeaders } from "next/headers";
import HeaderClientWrapper from "@/components/dashboard/header-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await nextHeaders();
  const nextUrl = headerList.get("next-url");
  let pathname = "/dashboard";
  if (nextUrl) {
    try {
      pathname = new URL(nextUrl).pathname;
    } catch {
      // fallback
    }
  }

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Welcome back — here's your pricing overview.",
    },
    "/dashboard/products": {
      title: "Products",
      subtitle: "Manage and monitor your product catalog.",
    },
    "/dashboard/competitors": {
      title: "Competitors",
      subtitle: "Track competitor prices and market positioning.",
    },
  };

  const info = titleMap[pathname] ?? {
    title: pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Dashboard",
    subtitle: "PIE — Pricing Intelligence Engine",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex flex-shrink-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderClientWrapper title={info.title} subtitle={info.subtitle} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
