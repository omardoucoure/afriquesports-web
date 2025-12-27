'use client';

import { useEffect, useState } from 'react';

interface SEOStatus {
  lastRun: any;
  recentRuns: any[];
  recentAlerts: any[];
  indexingStats: any;
  franceStats: any;
  agentActive: boolean;
}

export default function SEODashboardPage() {
  const [status, setStatus] = useState<SEOStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo-status');
      const data = await response.json();

      if (data.success) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#345C00] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SEO dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#345C00] to-[#9DFF20] text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">SEO Agent Dashboard</h1>
              <p className="mt-2 opacity-90">Autonomous SEO monitoring and optimization</p>
            </div>
            <div className={`w-4 h-4 rounded-full ${status?.agentActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Last Run */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Last Run</h3>
            {status?.lastRun ? (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  {status.lastRun.status === 'success' ? '✅' : '❌'} {status.lastRun.status}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(status.lastRun.started_at).toLocaleString('fr-FR')}
                </p>
              </>
            ) : (
              <p className="text-gray-500">No runs yet</p>
            )}
          </div>

          {/* Indexing Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Indexing (7d)</h3>
            {status?.indexingStats ? (
              <>
                <p className="text-2xl font-bold text-[#345C00]">{status.indexingStats.total}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {status.indexingStats.indexed} indexed, {status.indexingStats.errors} errors
                </p>
              </>
            ) : (
              <p className="text-gray-500">No data</p>
            )}
          </div>

          {/* France Clicks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">France Clicks (7d)</h3>
            {status?.franceStats ? (
              <>
                <p className="text-2xl font-bold text-[#345C00]">{status.franceStats.totalClicks.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Pos: {status.franceStats.avgPosition}
                </p>
              </>
            ) : (
              <p className="text-gray-500">No data</p>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Recent Alerts</h3>
            <p className="text-2xl font-bold text-orange-600">{status?.recentAlerts?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Last 24 hours</p>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Runs</h2>
            <button
              onClick={fetchStatus}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Run Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Started</th>
                  <th className="text-left py-3 px-4">Duration</th>
                </tr>
              </thead>
              <tbody>
                {status?.recentRuns?.map((run) => {
                  const duration = run.completed_at
                    ? ((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)
                    : 'N/A';

                  return (
                    <tr key={run.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {run.run_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          run.status === 'success' ? 'bg-green-100 text-green-800' :
                          run.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(run.started_at).toLocaleString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{duration}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts */}
        {status?.recentAlerts && status.recentAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              {status.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                      alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center text-gray-500 text-sm mt-6">
          Auto-refreshing every 30 seconds
        </div>
      </div>
    </div>
  );
}
