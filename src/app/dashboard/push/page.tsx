"use client";

import { Bell } from "lucide-react";

export default function PushPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Push Notifications</h1>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
        <Bell className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Push notification management coming soon</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Send push notifications, manage subscribers, and track engagement from this dashboard.
        </p>
      </div>
    </div>
  );
}
