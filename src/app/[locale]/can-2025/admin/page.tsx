'use client';

import { useEffect, useState } from 'react';

interface AgentStatus {
  running: boolean;
  uptime?: string;
  last_check: string;
}

interface VLLMStatus {
  running: boolean;
  endpoint: string;
  model?: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface SEOStatus {
  agentActive: boolean;
  lastRun: any;
  recentRuns: any[];
  recentAlerts: any[];
  indexingStats: any;
  franceStats: any;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [vllmStatus, setVLLMStatus] = useState<VLLMStatus | null>(null);
  const [seoStatus, setSeoStatus] = useState<SEOStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthenticated(true);
      fetchAllStatus();
    }
  }, []);

  // Auto-refresh every 10 seconds when authenticated
  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(fetchAllStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        setAuthenticated(true);
        fetchAllStatus();
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStatus = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      // Fetch agent status
      const agentRes = await fetch('/api/admin/agent-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgentStatus(agentData);
      }

      // Fetch vLLM status
      const vllmRes = await fetch('/api/admin/vllm-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vllmRes.ok) {
        const vllmData = await vllmRes.json();
        setVLLMStatus(vllmData);
      }

      // Fetch recent logs
      const logsRes = await fetch('/api/admin/agent-logs?lines=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs);
      }

      // Fetch SEO status
      const seoRes = await fetch('/api/admin/seo-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (seoRes.ok) {
        const seoData = await seoRes.json();
        setSeoStatus(seoData);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleAgentControl = async (action: 'start' | 'stop' | 'restart') => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    if (!confirm(`Are you sure you want to ${action} the agent?`)) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/agent-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`Agent ${action} successful`);
        setTimeout(fetchAllStatus, 2000);
      } else {
        alert(`Failed to ${action} agent`);
      }
    } catch (error) {
      alert('Control action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]"
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#345C00] text-white py-2 rounded-lg hover:bg-[#9DFF20] hover:text-[#345C00] transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Autonomous Agent Dashboard</h1>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                setAuthenticated(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-600 mt-2">Monitor and control the CAN 2025 commentary agent</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Agent Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agent Status</h2>
              <div className={`w-3 h-3 rounded-full ${agentStatus?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>

            {agentStatus ? (
              <div className="space-y-2 mb-4">
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={agentStatus.running ? 'text-green-600' : 'text-red-600'}>
                    {agentStatus.running ? 'Running' : 'Stopped'}
                  </span>
                </p>
                {agentStatus.uptime && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Uptime:</span> {agentStatus.uptime}
                  </p>
                )}
                <p className="text-gray-500 text-sm">
                  Last check: {new Date(agentStatus.last_check).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 mb-4">Loading...</p>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAgentControl('start')}
                disabled={actionLoading || agentStatus?.running}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start
              </button>
              <button
                onClick={() => handleAgentControl('stop')}
                disabled={actionLoading || !agentStatus?.running}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop
              </button>
              <button
                onClick={() => handleAgentControl('restart')}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restart
              </button>
            </div>
          </div>

          {/* vLLM Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">vLLM Server</h2>
              <div className={`w-3 h-3 rounded-full ${vllmStatus?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>

            {vllmStatus ? (
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={vllmStatus.running ? 'text-green-600' : 'text-red-600'}>
                    {vllmStatus.running ? 'Running' : 'Stopped'}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Endpoint:</span>{' '}
                  <span className="text-sm font-mono">{vllmStatus.endpoint}</span>
                </p>
                {vllmStatus.model && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Model:</span>{' '}
                    <span className="text-sm">{vllmStatus.model}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>

          {/* SEO Agent Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">SEO Agent</h2>
              <div className={`w-3 h-3 rounded-full ${seoStatus?.agentActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>

            {seoStatus ? (
              <div className="space-y-3">
                {/* Last Run */}
                {seoStatus.lastRun && (
                  <div>
                    <p className="text-gray-700 text-sm">
                      <span className="font-semibold">Last run:</span>{' '}
                      <span className={seoStatus.lastRun.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {seoStatus.lastRun.status}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(seoStatus.lastRun.started_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* France Stats */}
                {seoStatus.franceStats && (
                  <div className="border-t pt-3">
                    <p className="text-gray-600 text-sm font-semibold mb-2">France (7 days)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Clicks</p>
                        <p className="font-bold text-[#345C00]">{seoStatus.franceStats.totalClicks?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Pos</p>
                        <p className="font-bold">{seoStatus.franceStats.avgPosition?.toFixed(1) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Impressions</p>
                        <p className="font-bold">{seoStatus.franceStats.totalImpressions?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CTR</p>
                        <p className="font-bold">{seoStatus.franceStats.avgCTR?.toFixed(2) || 0}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Indexing Stats */}
                {seoStatus.indexingStats && (
                  <div className="border-t pt-3">
                    <p className="text-gray-600 text-sm font-semibold mb-2">Indexing</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-semibold">{seoStatus.indexingStats.submitted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Indexed:</span>
                        <span className="font-semibold text-green-600">{seoStatus.indexingStats.indexed || 0}</span>
                      </div>
                      {seoStatus.indexingStats.error > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Errors:</span>
                          <span className="font-semibold text-red-600">{seoStatus.indexingStats.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Alerts */}
                {seoStatus.recentAlerts && seoStatus.recentAlerts.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-gray-600 text-sm font-semibold mb-2">
                      Recent Alerts ({seoStatus.recentAlerts.length})
                    </p>
                    <div className="space-y-1">
                      {seoStatus.recentAlerts.slice(0, 3).map((alert: any, index: number) => (
                        <div key={index} className="text-xs">
                          <span className={`font-semibold ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {alert.severity === 'critical' ? '🚨' :
                             alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                          </span>
                          <span className="text-gray-700 ml-1">{alert.message.substring(0, 40)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Logs</h2>
            <button
              onClick={fetchAllStatus}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No logs available</p>
            )}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center text-gray-500 text-sm mt-4">
          Auto-refreshing every 10 seconds
        </div>
      </div>
    </div>
  );
}
