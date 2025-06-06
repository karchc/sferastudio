"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, CreditCard, BookOpen } from "lucide-react";

type Test = {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  price: number;
  currency: string;
  is_free: boolean;
  category_ids?: string[];
  categories?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
};

type PurchasedTest = {
  purchaseId: string;
  purchaseDate: string;
  paymentAmount: number;
  test: Test;
};

type UserTestsData = {
  purchasedTests: PurchasedTest[];
  totalPurchased: number;
};

export default function MyTestsPage() {
  const [loading, setLoading] = useState(true);
  const [userTests, setUserTests] = useState<UserTestsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserTests() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/purchased-tests");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login");
            return;
          }
          throw new Error(`Failed to fetch tests: ${res.status}`);
        }
        const data = await res.json();
        setUserTests(data);
      } catch (error) {
        console.error("Error loading tests:", error);
        setError("Failed to load your tests. Please try again.");
      }
      setLoading(false);
    }
    loadUserTests();
  }, [router]);

  const formatTimeLimit = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <main className="py-12 bg-[#F6F7FA] min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#3EB3E7] border-r-transparent" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-4 text-lg text-[#5C677D]">Loading your tests...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-12 bg-[#F6F7FA] min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#3EB3E7] text-white rounded-md hover:bg-[#2da0d4] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12 bg-[#F6F7FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">My Tests</h1>
          <p className="text-[#5C677D]">
            Access all your purchased test materials
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#5C677D] text-sm font-medium">Total Purchased Tests</p>
              <p className="text-3xl font-bold text-[#0B1F3A]">{userTests?.totalPurchased || 0}</p>
            </div>
            <CreditCard className="h-10 w-10 text-[#3EB3E7]" />
          </div>
        </div>

        {/* Tests Grid */}
        {userTests?.purchasedTests && userTests.purchasedTests.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTests.purchasedTests.map((purchase) => (
                <div
                  key={purchase.purchaseId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/test/${purchase.test.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#0B1F3A] line-clamp-2">
                      {purchase.test.title}
                    </h3>
                    <span className="px-2 py-1 bg-[#3EB3E7] text-white text-xs rounded-full whitespace-nowrap ml-2">
                      OWNED
                    </span>
                  </div>
                  
                  {purchase.test.description && (
                    <p className="text-[#5C677D] text-sm mb-4 line-clamp-2">
                      {purchase.test.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-[#5C677D]">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatTimeLimit(purchase.test.time_limit)}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Purchased {formatDate(purchase.purchaseDate)}
                    </div>
                    {purchase.test.categories && purchase.test.categories.length > 0 && (
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {purchase.test.categories.map(c => c.name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-[#5C677D] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">No Tests Available</h3>
            <p className="text-[#5C677D] mb-6">
              You don't have any tests yet. Browse our catalog to find tests to purchase.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-[#3EB3E7] text-white rounded-md hover:bg-[#2da0d4] transition-colors font-medium"
            >
              Browse Tests
            </button>
          </div>
        )}
      </div>
    </main>
  );
}