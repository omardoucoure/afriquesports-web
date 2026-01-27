import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard | Afrique Sports",
  description: "Dashboard for Afrique Sports",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={jakarta.className}>
        <div className="min-h-screen bg-gray-50">
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>

          <MobileSidebar />

          <main className="lg:pl-64 pt-16 lg:pt-0">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
