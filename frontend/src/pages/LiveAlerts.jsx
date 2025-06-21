import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Bell,
  Clock,
  MapPin,
  ExternalLink,
  Zap,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  Filter,
} from "lucide-react";

const LiveAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState("all");
  const [ws, setWs] = useState(null);

  // Fetch initial data
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts");
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts/reports?limit=5");
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl =
        process.env.NODE_ENV === "development"
          ? "ws://localhost:3000"
          : `wss://${window.location.host}`;

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log("Connected to alert WebSocket");
        setConnected(true);
        websocket.send(JSON.stringify({ type: "JOIN_ALERT_UPDATES" }));
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "NEW_DISASTER_ALERT":
              setAlerts((prev) => [data.alert, ...prev.slice(0, 49)]);
              showNotification(data.alert);
              break;

            case "URGENT_ALERT":
              setAlerts((prev) => [data.alert, ...prev.slice(0, 49)]);
              showUrgentNotification(data.alert, data.message);
              break;

            case "COMPREHENSIVE_UPDATE":
              if (data.data.alerts) setAlerts(data.data.alerts);
              if (data.data.recentReports) setReports(data.data.recentReports);
              if (data.data.stats)
                setStats((prev) => ({ ...prev, ...data.data.stats }));
              break;

            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.onclose = () => {
        console.log("Alert WebSocket disconnected");
        setConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchStats(), fetchReports()]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchAlerts, fetchStats, fetchReports]);

  // Notification functions
  const showNotification = (alert) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`New Disaster Alert: ${alert.type}`, {
        body: alert.title,
        icon: "/alert-icon.png",
      });
    }
  };

  const showUrgentNotification = (alert, message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 URGENT DISASTER ALERT", {
        body: message,
        icon: "/urgent-icon.png",
        requireInteraction: true,
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity.toLowerCase() === filter.toLowerCase();
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "LOW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Live Disaster Alerts
          </h1>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              connected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Alerts</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDisasters || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Severity</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.bySeverity?.HIGH || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Medium Severity
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.bySeverity?.MEDIUM || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reports</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalReports || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Alerts
              </h2>
              <p className="text-sm text-gray-600">
                Showing {filteredAlerts.length} alerts
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No alerts found for the selected filter.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredAlerts.map((alert, index) => (
                    <div
                      key={alert.id}
                      className={`p-4 border-b hover:bg-gray-50 ${
                        alert.isNew
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {alert.type}
                            </span>
                            {alert.isNew && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {alert.title}
                          </h3>
                          {alert.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {alert.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {Array.isArray(alert.location)
                                  ? alert.location.join(", ")
                                  : alert.location}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(alert.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {alert.url && (
                            <a
                              href={alert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Reports
              </h3>
            </div>
            <div className="p-4">
              {reports.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent reports available.
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report, index) => (
                    <div
                      key={report.id}
                      className="pb-3 border-b last:border-b-0"
                    >
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {report.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {report.source}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(report.date)}
                        </span>
                        {report.url && (
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Read more
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Disaster Types */}
          {stats.byType && Object.keys(stats.byType).length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  By Disaster Type
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{type}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket</span>
                  <span
                    className={`text-sm font-medium ${
                      connected ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(new Date())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAlerts;
