import { LiveMatchCommentary } from "@/components/can2025";
import { Header, Footer } from "@/components/layout";

export default function TestCommentaryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20">
        <div className="container-main py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Test Live Commentary
              </h1>
              <p className="text-gray-600 mb-4">
                This is a test page to preview the AI-powered live commentary feature.
              </p>

              {/* Match Header */}
              <div className="bg-gradient-to-r from-[#022a27] to-[#04453f] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        TEST MODE
                      </span>
                      <span className="text-sm text-white/80">67'</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Maroc vs Comores
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-[#9DFF20]">
                      2 - 0
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Commentary Component */}
            <LiveMatchCommentary
              matchId="test_match_1766331124"
              locale="fr"
              autoRefresh={true}
              refreshInterval={10000}
            />

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">How to test:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>The commentary above is loading from the database</li>
                <li>Run <code className="bg-blue-100 px-1 rounded">./test-commentary.sh</code> to add more events</li>
                <li>The component auto-refreshes every 10 seconds</li>
                <li>Events are color-coded: green (goals), yellow (cards)</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
