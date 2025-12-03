"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/tests">
            <h1 className="text-2xl font-bold text-blue-600">Practice ERP Admin</h1>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-700 p-4">
          <nav className="space-y-2">
            <Link href="/admin/tests">
              <Button
                variant={isActive("/admin/tests") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Test Management
              </Button>
            </Link>
            <Link href="/admin/questions">
              <Button
                variant={isActive("/admin/questions") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Question Management
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button
                variant={isActive("/admin/categories") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Categories
              </Button>
            </Link>
            <Link href="/admin/test-data">
              <Button
                variant={isActive("/admin/test-data") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Test Data
              </Button>
            </Link>
            <Link href="/admin/categories-direct">
              <Button
                variant={isActive("/admin/categories-direct") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Categories Direct
              </Button>
            </Link>
            <Link href="/admin/categories-auth">
              <Button
                variant={isActive("/admin/categories-auth") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Categories Auth
              </Button>
            </Link>
            <Link href="/admin/categories-basic">
              <Button
                variant={isActive("/admin/categories-basic") ? "default" : "ghost"}
                className="w-full justify-start bg-green-100 hover:bg-green-200 text-green-800"
              >
                🔧 Basic CRUD Test
              </Button>
            </Link>
            <Link href="/admin/auth">
              <Button
                variant={isActive("/admin/auth") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                Admin Login
              </Button>
            </Link>
            <Link href="/admin/auth-bypass">
              <Button
                variant={isActive("/admin/auth-bypass") ? "default" : "ghost"}
                className="w-full justify-start bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
              >
                ⚠️ Auth Bypass
              </Button>
            </Link>
            <Link href="/admin/direct-login">
              <Button
                variant={isActive("/admin/direct-login") ? "default" : "ghost"}
                className="w-full justify-start bg-blue-100 hover:bg-blue-200 text-blue-800"
              >
                🔑 Direct Login
              </Button>
            </Link>
            <Link href="/admin/categories-admin">
              <Button
                variant={isActive("/admin/categories-admin") ? "default" : "ghost"}
                className="w-full justify-start bg-purple-100 hover:bg-purple-200 text-purple-800"
              >
                ✅ Admin Categories
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}