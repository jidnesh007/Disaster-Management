import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Activity,
  Users,
  MapPin,
  Database,
  RefreshCw,
  Settings,
  Heart,
  Package,
  Building,
  Wifi,
  WifiOff,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Eye,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AdminDashboard = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [alertStatus, setAlertStatus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  // Mock data for demonstration
  const [stats, setStats] = useState({
    activeSOS: 12,
    rescueTeams: 8,
    shelters: 45,
    volunteers: 234,
    donations: 1250000,
    resources: 156,
  });

  const [recentAlerts, setRecentAlerts] = useState([
    {
      id: 1,
      type: "Flood",
      location: "Bandra West",
      severity: "High",
      time: "2 mins ago",
      status: "Active",
    },
    {
      id: 2,
      type: "Landslide",
      location: "Powai",
      severity: "Medium",
      time: "15 mins ago",
      status: "Monitoring",
    },
    {
      id: 3,
      type: "Heavy Rain",
      location: "Andheri",
      severity: "Low",
      time: "1 hour ago",
      status: "Resolved",
    },
  ]);

  const [rescueTeams, setRescueTeams] = useState([
    {
      id: 1,
      name: "Team Alpha",
      location: "Bandra",
      status: "Active",
      members: 5,
      currentMission: "Flood Rescue",
    },
    {
      id: 2,
      name: "Team Beta",
      location: "Andheri",
      status: "Standby",
      members: 4,
      currentMission: null,
    },
    {
      id: 3,
      name: "Team Gamma",
      location: "Powai",
      status: "Active",
      members: 6,
      currentMission: "Medical Emergency",
    },
  ]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket("ws://localhost:3000");

      websocket.onopen = () => {
        console.log("Admin WebSocket connected");
        setWsConnected(true);
        websocket.send(
          JSON.stringify({
            type: "JOIN_COORDINATOR",
            userId: "admin-dashboard",
          })
        );
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        // Handle real-time updates
        switch (data.type) {
          case "NEW_SOS":
            setStats((prev) => ({ ...prev, activeSOS: prev.activeSOS + 1 }));
            break;
          case "DISASTER_ALERT":
            setRecentAlerts((prev) => [data, ...prev.slice(0, 9)]);
            break;
          case "FACILITY_UPDATE":
            // Handle facility updates
            break;
        }
      };

      websocket.onclose = () => {
        console.log("Admin WebSocket disconnected");
        setWsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
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

  // Fetch system health
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        setSystemHealth(data);
      } catch (error) {
        console.error("Failed to fetch system health:", error);
      }
    };

    const fetchAlertStatus = async () => {
      try {
        const response = await fetch("/api/admin/alerts/status");
        const data = await response.json();
        setAlertStatus(data.data);
      } catch (error) {
        console.error("Failed to fetch alert status:", error);
      }
    };

    fetchSystemHealth();
    fetchAlertStatus();
    setLoading(false);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchAlertStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleForceAlertCheck = async () => {
    try {
      const response = await fetch("/api/admin/alerts/force-check", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        alert("Alert check initiated successfully");
      }
    } catch (error) {
      console.error("Failed to force alert check:", error);
      alert("Failed to initiate alert check");
    }
  };

  const handleResetAlerts = async () => {
    if (confirm("Are you sure you want to reset the alert tracker?")) {
      try {
        const response = await fetch("/api/admin/alerts/reset", {
          method: "POST",
        });
        const data = await response.json();
        if (data.success) {
          alert("Alert tracker reset successfully");
        }
      } catch (error) {
        console.error("Failed to reset alerts:", error);
        alert("Failed to reset alert tracker");
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "text-red-600 bg-red-100";
      case "Monitoring":
        return "text-yellow-600 bg-yellow-100";
      case "Resolved":
        return "text-green-600 bg-green-100";
      case "Standby":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Disaster Management Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Mumbai Emergency Response System
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  wsConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {wsConnected ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>{wsConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "alerts", label: "Alerts", icon: AlertTriangle },
              { id: "teams", label: "Rescue Teams", icon: Users },
              { id: "resources", label: "Resources", icon: Package },
              { id: "system", label: "System", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[
                {
                  label: "Active SOS",
                  value: stats.activeSOS,
                  icon: AlertTriangle,
                  color: "text-red-600",
                  change: "+2",
                },
                {
                  label: "Rescue Teams",
                  value: stats.rescueTeams,
                  icon: Users,
                  color: "text-blue-600",
                  change: "0",
                },
                {
                  label: "Active Shelters",
                  value: stats.shelters,
                  icon: Building,
                  color: "text-green-600",
                  change: "+3",
                },
                {
                  label: "Volunteers",
                  value: stats.volunteers,
                  icon: Heart,
                  color: "text-purple-600",
                  change: "+12",
                },
                {
                  label: "Donations (₹)",
                  value: `${(stats.donations / 100000).toFixed(1)}L`,
                  icon: TrendingUp,
                  color: "text-orange-600",
                  change: "+15%",
                },
                {
                  label: "Resources",
                  value: stats.resources,
                  icon: Package,
                  color: "text-indigo-600",
                  change: "-5",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p
                        className={`text-xs ${
                          stat.change.startsWith("+")
                            ? "text-green-600"
                            : stat.change.startsWith("-")
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {stat.change} from yesterday
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Alerts
                </h3>
              </div>
              <div className="divide-y">
                {recentAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {alert.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {alert.location} • {alert.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            {/* Alert System Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Alert System Control
                </h3>
                <div className="flex items-center space-x-2">
                  {alertStatus?.isRunning ? (
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Running</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Stopped</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tracked Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alertStatus?.trackedAlerts || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Last Check</p>
                  <p className="text-sm font-medium text-gray-900">
                    {alertStatus?.lastCheck
                      ? new Date(alertStatus.lastCheck).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">System Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {systemHealth?.alertSystem?.isRunning
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleForceAlertCheck}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Force Check</span>
                </button>
                <button
                  onClick={handleResetAlerts}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Tracker</span>
                </button>
              </div>
            </div>

            {/* Alert History */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Alert History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alert
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
                            <span className="text-sm font-medium text-gray-900">
                              {alert.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alert.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                              alert.severity
                            )}`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              alert.status
                            )}`}
                          >
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Rescue Teams Status
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Mission
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rescueTeams.map((team) => (
                      <tr key={team.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-blue-500 mr-3" />
                            <span className="text-sm font-medium text-gray-900">
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {team.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              team.status
                            )}`}
                          >
                            {team.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.members}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.currentMission || "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Play className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Medical Supplies",
                  count: 45,
                  status: "Good",
                  icon: Heart,
                },
                {
                  title: "Food Packages",
                  count: 234,
                  status: "Low",
                  icon: Package,
                },
                {
                  title: "Water Bottles",
                  count: 1200,
                  status: "Good",
                  icon: Package,
                },
                {
                  title: "Blankets",
                  count: 89,
                  status: "Critical",
                  icon: Package,
                },
                {
                  title: "Emergency Kits",
                  count: 67,
                  status: "Good",
                  icon: Package,
                },
                {
                  title: "Communication Devices",
                  count: 23,
                  status: "Low",
                  icon: Package,
                },
              ].map((resource, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <resource.icon className="h-8 w-8 text-blue-600" />
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        resource.status === "Good"
                          ? "bg-green-100 text-green-800"
                          : resource.status === "Low"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {resource.count}
                  </p>
                  <p className="text-sm text-gray-500">Available units</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                System Health
              </h3>
              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Server</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium">
                          {Math.floor(systemHealth.server.uptime / 60)} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Environment:</span>
                        <span className="font-medium">
                          {systemHealth.server.environment}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Memory:</span>
                        <span className="font-medium">
                          {Math.round(
                            systemHealth.server.memory.used / 1024 / 1024
                          )}{" "}
                          MB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Database</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-medium ${
                            systemHealth.database.status === "connected"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {systemHealth.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database:</span>
                        <span className="font-medium">
                          {systemHealth.database.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">WebSocket</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connected:</span>
                        <span className="font-medium">
                          {systemHealth.websocket.connected}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rescue Teams:</span>
                        <span className="font-medium">
                          {systemHealth.websocket.rescueTeams}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coordinators:</span>
                        <span className="font-medium">
                          {systemHealth.websocket.coordinators}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                System Controls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">Restart Services</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                  <Database className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">Database Backup</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">System Configuration</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">Scheduled Tasks</span>
                </button>
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent System Logs
                </h3>
              </div>
              <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm max-h-64 overflow-y-auto">
                <div>
                  [2025-06-21 14:32:15] INFO: Alert system initialized
                  successfully
                </div>
                <div>
                  [2025-06-21 14:32:16] INFO: WebSocket server started on port
                  3000
                </div>
                <div>
                  [2025-06-21 14:32:17] INFO: Database connection established
                </div>
                <div>
                  [2025-06-21 14:35:22] INFO: New SOS alert received from Bandra
                  West
                </div>
                <div>
                  [2025-06-21 14:35:25] INFO: Rescue team Alpha dispatched
                </div>
                <div>
                  [2025-06-21 14:38:10] WARNING: High CPU usage detected (85%)
                </div>
                <div>
                  [2025-06-21 14:40:15] INFO: Alert check completed - 3 new
                  alerts processed
                </div>
                <div>
                  [2025-06-21 14:42:30] INFO: Volunteer registration successful
                  - ID: V234
                </div>
                <div>
                  [2025-06-21 14:45:18] ERROR: Failed to send SMS notification
                  to +91xxxxxxxxxx
                </div>
                <div>
                  [2025-06-21 14:45:20] INFO: Email notification sent
                  successfully
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
