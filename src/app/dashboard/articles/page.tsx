"use client";

import { Newspaper } from "lucide-react";

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
        <Newspaper className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Article management coming soon</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Manage your articles, track performance, and create new content from this dashboard.
        </p>
      </div>
    </div>
  );
}
