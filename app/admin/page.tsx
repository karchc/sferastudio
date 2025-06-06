"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();
  
  // Redirect to dashboard as the default admin page using useEffect
  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}